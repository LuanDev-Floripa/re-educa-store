"""
Repositório de Uso de Cupons RE-EDUCA Store.

Gerencia acesso a dados de uso de cupons.
"""

import logging
from typing import Any, Dict, Optional

from repositories.base_repository import BaseRepository

logger = logging.getLogger(__name__)


class CouponUsageRepository(BaseRepository):
    """
    Repositório para operações com uso de cupons.

    Tabela: coupon_usage
    """

    def __init__(self):
        """Inicializa o repositório de uso de cupons."""
        super().__init__("coupon_usage")

    def count_by_coupon(self, coupon_id: str) -> int:
        """
        Conta usos de um cupom.

        Args:
            coupon_id: ID do cupom

        Returns:
            Número de usos
        """
        try:
            return self.count(filters={"coupon_id": coupon_id})
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            self.logger.error(f"Erro ao contar usos do cupom: {str(e)}", exc_info=True)
            return 0

    def count_by_coupon_and_user(self, coupon_id: str, user_id: str) -> int:
        """
        Conta usos de um cupom por um usuário.

        Args:
            coupon_id: ID do cupom
            user_id: ID do usuário

        Returns:
            Número de usos pelo usuário
        """
        try:
            return self.count(filters={"coupon_id": coupon_id, "user_id": user_id})
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            self.logger.error(f"Erro ao contar usos do cupom por usuário: {str(e)}", exc_info=True)
            return 0

    def get_total_discount_by_coupon(self, coupon_id: str) -> float:
        """
        Obtém o valor total de desconto aplicado por um cupom.

        Args:
            coupon_id: ID do cupom

        Returns:
            Valor total de desconto
        """
        try:
            usages = self.find_all(filters={"coupon_id": coupon_id})
            return sum(usage.get("discount_amount", 0) for usage in usages)
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            self.logger.error(f"Erro ao calcular desconto total: {str(e)}", exc_info=True)
            return 0.0

    def get_unique_users_by_coupon(self, coupon_id: str) -> int:
        """
        Obtém número de usuários únicos que usaram o cupom.

        Args:
            coupon_id: ID do cupom

        Returns:
            Número de usuários únicos
        """
        try:
            usages = self.find_all(filters={"coupon_id": coupon_id})
            unique_users = set(usage.get("user_id") for usage in usages if usage.get("user_id"))
            return len(unique_users)
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            self.logger.error(f"Erro ao contar usuários únicos: {str(e)}", exc_info=True)
            return 0

    def record_usage(
        self, coupon_id: str, user_id: str, order_id: str, discount_amount: float
    ) -> Optional[Dict[str, Any]]:
        """
        Registra uso de um cupom.

        Args:
            coupon_id: ID do cupom
            user_id: ID do usuário
            order_id: ID do pedido
            discount_amount: Valor do desconto aplicado

        Returns:
            Uso registrado ou None
        """
        try:
            from datetime import datetime

            from utils.helpers import generate_uuid

            usage_data = {
                "id": generate_uuid(),
                "coupon_id": coupon_id,
                "user_id": user_id,
                "order_id": order_id,
                "discount_amount": discount_amount,
                "used_at": datetime.now().isoformat(),
            }

            return self.create(usage_data)
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            self.logger.error(f"Erro ao registrar uso do cupom: {str(e)}", exc_info=True)
            return None

    def get_coupon_stats(self, coupon_id: str) -> Dict[str, Any]:
        """
        Obtém estatísticas de uso de um cupom.

        Args:
            coupon_id: ID do cupom

        Returns:
            Dicionário com estatísticas
        """
        try:
            return {
                "total_usage": self.count_by_coupon(coupon_id),
                "total_discount": self.get_total_discount_by_coupon(coupon_id),
                "unique_users": self.get_unique_users_by_coupon(coupon_id),
            }
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            self.logger.error(f"Erro ao obter estatísticas do cupom: {str(e)}", exc_info=True)
            return {"total_usage": 0, "total_discount": 0.0, "unique_users": 0}
