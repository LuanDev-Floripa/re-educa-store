# -*- coding: utf-8 -*-
"""
Repositório de Regras de Frete RE-EDUCA Store.

Gerencia acesso a dados de regras de frete.
"""
import logging
from typing import Any, Dict, List

from repositories.base_repository import BaseRepository

logger = logging.getLogger(__name__)


class ShippingRepository(BaseRepository):
    """
    Repositório para operações com regras de frete.

    Tabela: shipping_rules
    """

    def __init__(self):
        """Inicializa o repositório de regras de frete."""
        super().__init__("shipping_rules")

    def find_active_rules(self, order_by: str = "priority", desc: bool = True) -> List[Dict[str, Any]]:
        """
        Busca regras de frete ativas, ordenadas por prioridade.

        Args:
            order_by: Campo para ordenação (padrão: 'priority')
            desc: Se ordenação é descendente

        Returns:
            Lista de regras ativas
        """
        try:
            return self.find_all(filters={"is_active": True}, order_by=order_by, desc=desc)
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            self.logger.error(f"Erro ao buscar regras de frete ativas: {str(e)}", exc_info=True)
            return []
