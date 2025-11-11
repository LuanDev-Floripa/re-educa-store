"""
Service de Cupons RE-EDUCA Store.

Gerencia operações de cupons de desconto incluindo:
- Validação de cupons
- Aplicação de descontos
- Controle de uso e limites
"""

import logging
from datetime import datetime
from typing import Any, Dict

from repositories.coupon_repository import CouponRepository
from services.base_service import BaseService

logger = logging.getLogger(__name__)


class CouponService(BaseService):
    """
    Service para operações de cupons de desconto.

    Herda de BaseService para padronização e centralização de lógica comum.
    """

    def __init__(self):
        """Inicializa o serviço de cupons."""
        super().__init__()
        self.repo = CouponRepository()

    def validate_coupon(self, code: str, order_total: float = 0) -> Dict[str, Any]:
        """
        Valida um cupom de desconto.

        Args:
            code: Código do cupom
            order_total: Valor total do pedido (para validar min_purchase_amount)

        Returns:
            Dict com success, coupon data ou error
        """
        try:
            if not code or not code.strip():
                return {"success": False, "error": "Código do cupom é obrigatório"}

            coupon = self.repo.find_by_code(code.strip().upper())

            if not coupon:
                return {"success": False, "error": "Cupom não encontrado"}

            # Verificar se está ativo
            if not coupon.get("is_active", False):
                return {"success": False, "error": "Cupom inativo"}

            # Validar data de validade
            now = datetime.utcnow()
            if coupon.get("valid_from"):
                valid_from = datetime.fromisoformat(coupon["valid_from"].replace("Z", "+00:00"))
                if now < valid_from:
                    return {"success": False, "error": "Cupom ainda não está válido"}

            if coupon.get("valid_until"):
                valid_until = datetime.fromisoformat(coupon["valid_until"].replace("Z", "+00:00"))
                if now > valid_until:
                    return {"success": False, "error": "Cupom expirado"}

            # Validar valor mínimo de compra
            min_purchase = float(coupon.get("min_purchase_amount", 0) or 0)
            if order_total < min_purchase:
                return {"success": False, "error": f"Valor mínimo de compra: R$ {min_purchase:.2f}"}

            # Validar limite de uso
            usage_limit = coupon.get("usage_limit")
            usage_count = coupon.get("usage_count", 0)
            if usage_limit and usage_count >= usage_limit:
                return {"success": False, "error": "Cupom esgotado"}

            # Calcular desconto
            discount_type = coupon.get("discount_type", "percentage")
            discount_value = float(coupon.get("discount_value", 0) or 0)

            if discount_type == "percentage":
                discount_amount = order_total * (discount_value / 100)
                # Aplicar max_discount_amount se existir
                max_discount = coupon.get("max_discount_amount")
                if max_discount and discount_amount > max_discount:
                    discount_amount = float(max_discount)
            else:  # fixed
                discount_amount = discount_value
                if discount_amount > order_total:
                    discount_amount = order_total

            return {
                "success": True,
                "valid": True,
                "code": coupon["code"],
                "discount_type": discount_type,
                "discount_percentage": discount_value if discount_type == "percentage" else None,
                "discount_amount": round(discount_amount, 2),
                "discount_value": discount_value,
                "type": discount_type,
                "coupon": coupon,
            }

        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            self.logger.error(f"Erro ao validar cupom: {str(e)}", exc_info=True)
            return {"success": False, "error": "Erro ao validar cupom"}

    def apply_coupon(self, code: str, user_id: str, order_total: float) -> Dict[str, Any]:
        """
        Aplica cupom e incrementa contador de uso.

        Args:
            code: Código do cupom
            user_id: ID do usuário (para tracking)
            order_total: Valor total do pedido

        Returns:
            Dict com success e dados do desconto ou error
        """
        try:
            # Validar cupom
            validation = self.validate_coupon(code, order_total)
            if not validation.get("success"):
                return validation

            coupon = validation["coupon"]

            # Incrementar uso (se não tiver limite, não precisa incrementar)
            if coupon.get("usage_limit"):
                try:
                    self.repo.increment_usage(coupon["code"])
                except (ValueError, KeyError) as e:
                    logger.warning(f"Erro de validação: {str(e)}")
                    # Tratamento específico pode ser adicionado aqui
                except Exception as e:
                    self.logger.warning(f"Erro ao incrementar uso do cupom: {str(e)}")

            return {
                "success": True,
                "code": coupon["code"],
                "discount_type": validation["discount_type"],
                "discount_amount": validation["discount_amount"],
                "discount_percentage": validation.get("discount_percentage"),
            }

        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            self.logger.error(f"Erro ao aplicar cupom: {str(e)}", exc_info=True)
            return {"success": False, "error": "Erro ao aplicar cupom"}
