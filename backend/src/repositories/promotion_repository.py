# -*- coding: utf-8 -*-
"""
Repositório de Promoções RE-EDUCA Store.

Gerencia acesso a dados de promoções (diferente de cupons).
"""
import logging
from typing import Any, Dict, List, Optional

from repositories.base_repository import BaseRepository

logger = logging.getLogger(__name__)


class PromotionRepository(BaseRepository):
    """
    Repositório para operações com promoções.

    Tabela: promotions
    """

    def __init__(self):
        """Inicializa o repositório de promoções."""
        super().__init__("promotions")

    def find_applicable(
        self,
        order_value: float,
        valid_from: Optional[str] = None,
        valid_until: Optional[str] = None,
        product_ids: Optional[List[str]] = None,
    ) -> List[Dict[str, Any]]:
        """
        Busca promoções aplicáveis a um pedido.

        Args:
            order_value: Valor do pedido
            valid_from: Data inicial (padrão: agora)
            valid_until: Data final (padrão: agora)
            product_ids: IDs de produtos (opcional)

        Returns:
            Lista de promoções aplicáveis
        """
        try:
            from datetime import datetime

            if not valid_from:
                valid_from = datetime.now().isoformat()
            if not valid_until:
                valid_until = datetime.now().isoformat()

            query = (
                self.db.table(self.table_name)
                .select("*")
                .eq("is_active", True)
                .gte("valid_from", valid_from)
                .lte("valid_until", valid_until)
                .lte("min_order_value", order_value)
            )

            result = query.execute()
            promotions = result.data if result.data else []

            # Filtrar por produtos se necessário
            if product_ids and promotions:
                filtered = []
                for promotion in promotions:
                    # Se promoção tem produtos específicos, verificar
                    promo_products = promotion.get("applicable_product_ids", [])
                    if not promo_products or any(pid in promo_products for pid in product_ids):
                        filtered.append(promotion)
                return filtered

            return promotions
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            self.logger.error(f"Erro ao buscar promoções aplicáveis: {str(e)}", exc_info=True)
            return []

    def find_by_id(self, promotion_id: str) -> Optional[Dict[str, Any]]:
        """
        Busca uma promoção por ID.

        Args:
            promotion_id: ID da promoção

        Returns:
            Dados da promoção ou None
        """
        try:
            return super().find_by_id(promotion_id)
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            self.logger.error(f"Erro ao buscar promoção {promotion_id}: {str(e)}", exc_info=True)
            return None

    def update_promotion(self, promotion_id: str, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Atualiza uma promoção.

        Args:
            promotion_id: ID da promoção
            data: Dados para atualizar

        Returns:
            Promoção atualizada ou None
        """
        try:
            return self.update(promotion_id, data)
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            self.logger.error(f"Erro ao atualizar promoção {promotion_id}: {str(e)}", exc_info=True)
            return None

    def delete_promotion(self, promotion_id: str) -> bool:
        """
        Deleta uma promoção.

        Args:
            promotion_id: ID da promoção

        Returns:
            True se deletado com sucesso
        """
        try:
            return self.delete(promotion_id) is not None
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            self.logger.error(f"Erro ao deletar promoção {promotion_id}: {str(e)}", exc_info=True)
            return False
