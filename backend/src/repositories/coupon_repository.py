# -*- coding: utf-8 -*-
"""
Repositório de Cupons RE-EDUCA Store.

Gerencia acesso a dados de cupons de desconto.
"""
import logging
from typing import Any, Dict, Optional

from repositories.base_repository import BaseRepository

logger = logging.getLogger(__name__)


class CouponRepository(BaseRepository):
    """
    Repositório para operações com cupons de desconto.

    Tabela: coupons
    """

    def __init__(self):
        """Inicializa o repositório de cupons."""
        super().__init__("coupons")

    def find_by_code(self, code: str) -> Optional[Dict[str, Any]]:
        """
        Busca cupom por código.

        Args:
            code: Código do cupom

        Returns:
            Cupom ou None
        """
        try:
            result = self.db.table(self.table_name).select("*").eq("code", code.upper()).limit(1).execute()
            return result.data[0] if result.data and len(result.data) > 0 else None
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            self.logger.error(f"Erro ao buscar cupom: {str(e)}", exc_info=True)
            return None

    def is_valid(self, code: str) -> bool:
        """
        Verifica se cupom é válido.

        Args:
            code: Código do cupom

        Returns:
            True se válido, False caso contrário
        """
        try:
            coupon = self.find_by_code(code)
            if not coupon:
                return False

            # Verificar se está ativo
            if not coupon.get("is_active", False):
                return False

            # Verificar data de validade
            from datetime import datetime

            now = datetime.utcnow()

            valid_from = coupon.get("valid_from")
            valid_until = coupon.get("valid_until")

            if valid_from and datetime.fromisoformat(valid_from.replace("Z", "+00:00")) > now:
                return False

            if valid_until and datetime.fromisoformat(valid_until.replace("Z", "+00:00")) < now:
                return False

            # Verificar limite de uso
            usage_limit = coupon.get("usage_limit")
            usage_count = coupon.get("usage_count", 0)
            if usage_limit and usage_count >= usage_limit:
                return False

            return True
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            self.logger.error(f"Erro ao validar cupom: {str(e)}", exc_info=True)
            return False

    def increment_usage(self, code: str) -> bool:
        """
        Incrementa contador de uso do cupom.

        Args:
            code: Código do cupom

        Returns:
            True se incrementado, False caso contrário
        """
        try:
            coupon = self.find_by_code(code)
            if not coupon:
                return False

            new_count = coupon.get("usage_count", 0) + 1

            (self.db.table(self.table_name).update({"usage_count": new_count}).eq("code", code.upper()).execute())
            return True
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            self.logger.error(f"Erro ao incrementar uso: {str(e)}", exc_info=True)
            return False
