# -*- coding: utf-8 -*-
"""
Repositório de Reviews RE-EDUCA Store.

Gerencia acesso a dados de reviews de produtos.
"""
import logging
from typing import Any, Dict, List, Optional

from repositories.base_repository import BaseRepository

logger = logging.getLogger(__name__)


class ReviewRepository(BaseRepository):
    """
    Repositório para operações com reviews de produtos.

    Tabela: reviews
    """

    def __init__(self):
        """Inicializa o repositório de reviews."""
        super().__init__("reviews")

    def find_by_product(
        self, product_id: str, page: int = 1, per_page: int = 10, order_by: str = "created_at", desc: bool = True
    ) -> Dict[str, Any]:
        """
        Busca reviews de um produto com paginação.

        Args:
            product_id: ID do produto
            page: Número da página (1-indexed)
            per_page: Itens por página
            order_by: Campo para ordenação (padrão: created_at)
            desc: Se deve ordenar descendente (padrão: True)

        Returns:
            Dict com reviews e informações de paginação
        """
        try:
            offset = (page - 1) * per_page
            end = offset + per_page - 1

            # Query com JOIN para buscar dados do usuário
            query = (
                self.db.table(self.table_name)
                .select(
                    """
                    *,
                    users:user_id (
                        id,
                        name,
                        email
                    )
                    """
                )
                .eq("product_id", product_id)
            )

            # Ordenação
            if order_by == "helpful":
                query = query.order("helpful_count", desc=True)
            elif order_by == "rating":
                query = query.order("rating", desc=desc)
            else:
                query = query.order(order_by, desc=desc)

            # Paginação
            query = query.range(offset, end)

            result = query.execute()
            reviews = result.data if result.data else []

            # Contar total
            count_result = (
                self.db.table(self.table_name)
                .select("id", count="exact")
                .eq("product_id", product_id)
                .execute()
            )
            total = count_result.count if hasattr(count_result, "count") else len(reviews)

            return {
                "reviews": reviews,
                "pagination": {
                    "page": page,
                    "per_page": per_page,
                    "total": total,
                    "pages": (total + per_page - 1) // per_page if total > 0 else 0,
                },
            }
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            return {"reviews": [], "pagination": {"page": page, "per_page": per_page, "total": 0, "pages": 0}}
        except Exception as e:
            self.logger.error(f"Erro ao buscar reviews do produto: {str(e)}", exc_info=True)
            return {"reviews": [], "pagination": {"page": page, "per_page": per_page, "total": 0, "pages": 0}}

    def find_by_user(self, user_id: str, page: int = 1, per_page: int = 10) -> Dict[str, Any]:
        """
        Busca reviews de um usuário.

        Args:
            user_id: ID do usuário
            page: Número da página
            per_page: Itens por página

        Returns:
            Dict com reviews e paginação
        """
        try:
            offset = (page - 1) * per_page
            end = offset + per_page - 1

            query = (
                self.db.table(self.table_name)
                .select(
                    """
                    *,
                    products:product_id (
                        id,
                        name,
                        image_url
                    )
                    """
                )
                .eq("user_id", user_id)
                .order("created_at", desc=True)
                .range(offset, end)
            )

            result = query.execute()
            reviews = result.data if result.data else []

            # Contar total
            count_result = (
                self.db.table(self.table_name)
                .select("id", count="exact")
                .eq("user_id", user_id)
                .execute()
            )
            total = count_result.count if hasattr(count_result, "count") else len(reviews)

            return {
                "reviews": reviews,
                "pagination": {
                    "page": page,
                    "per_page": per_page,
                    "total": total,
                    "pages": (total + per_page - 1) // per_page if total > 0 else 0,
                },
            }
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            return {"reviews": [], "pagination": {"page": page, "per_page": per_page, "total": 0, "pages": 0}}
        except Exception as e:
            self.logger.error(f"Erro ao buscar reviews do usuário: {str(e)}", exc_info=True)
            return {"reviews": [], "pagination": {"page": page, "per_page": per_page, "total": 0, "pages": 0}}

    def find_by_id_with_user(self, review_id: str) -> Optional[Dict[str, Any]]:
        """
        Busca uma review por ID incluindo dados do usuário.

        Args:
            review_id: ID da review

        Returns:
            Dict com review e dados do usuário ou None
        """
        try:
            result = (
                self.db.table(self.table_name)
                .select(
                    """
                    *,
                    users:user_id (
                        id,
                        name,
                        email
                    )
                    """
                )
                .eq("id", review_id)
                .execute()
            )

            if result.data and len(result.data) > 0:
                return result.data[0]
            return None
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            return None
        except Exception as e:
            self.logger.error(f"Erro ao buscar review: {str(e)}", exc_info=True)
            return None

    def user_has_reviewed(self, product_id: str, user_id: str) -> bool:
        """
        Verifica se usuário já avaliou o produto.

        Args:
            product_id: ID do produto
            user_id: ID do usuário

        Returns:
            True se já avaliou, False caso contrário
        """
        try:
            result = (
                self.db.table(self.table_name)
                .select("id")
                .eq("product_id", product_id)
                .eq("user_id", user_id)
                .limit(1)
                .execute()
            )
            return len(result.data) > 0 if result.data else False
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            return False
        except Exception as e:
            self.logger.error(f"Erro ao verificar se usuário já avaliou: {str(e)}", exc_info=True)
            return False

    def get_rating_stats(self, product_id: str) -> Dict[str, Any]:
        """
        Retorna estatísticas de rating de um produto.

        Args:
            product_id: ID do produto

        Returns:
            Dict com estatísticas (média, distribuição, total)
        """
        try:
            result = (
                self.db.table(self.table_name)
                .select("rating")
                .eq("product_id", product_id)
                .execute()
            )

            if not result.data:
                return {
                    "average": 0.0,
                    "total": 0,
                    "distribution": {1: 0, 2: 0, 3: 0, 4: 0, 5: 0},
                }

            ratings = [r.get("rating") for r in result.data if r.get("rating")]
            total = len(ratings)

            if total == 0:
                return {
                    "average": 0.0,
                    "total": 0,
                    "distribution": {1: 0, 2: 0, 3: 0, 4: 0, 5: 0},
                }

            average = sum(ratings) / total
            distribution = {i: ratings.count(i) for i in range(1, 6)}

            return {
                "average": round(average, 2),
                "total": total,
                "distribution": distribution,
            }
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            return {"average": 0.0, "total": 0, "distribution": {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}}
        except Exception as e:
            self.logger.error(f"Erro ao calcular estatísticas de rating: {str(e)}", exc_info=True)
            return {"average": 0.0, "total": 0, "distribution": {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}}

    def vote_helpful(self, review_id: str, user_id: str, is_helpful: bool) -> Dict[str, Any]:
        """
        Vota em uma review como útil ou não útil.

        Args:
            review_id: ID da review
            user_id: ID do usuário que está votando
            is_helpful: True se útil, False se não útil

        Returns:
            Dict com success e dados atualizados
        """
        try:
            from datetime import datetime

            # Verificar se já existe voto
            existing = (
                self.db.table("review_votes")
                .select("*")
                .eq("review_id", review_id)
                .eq("user_id", user_id)
                .execute()
            )

            vote_data = {
                "review_id": review_id,
                "user_id": user_id,
                "is_helpful": is_helpful,
                "created_at": datetime.utcnow().isoformat(),
            }

            if existing.data and len(existing.data) > 0:
                # Atualizar voto existente
                result = (
                    self.db.table("review_votes")
                    .update(vote_data)
                    .eq("id", existing.data[0]["id"])
                    .execute()
                )
            else:
                # Criar novo voto
                result = self.db.table("review_votes").insert(vote_data).execute()

            # Buscar review atualizada (contadores serão atualizados pelo trigger)
            review = self.find_by_id(review_id)

            return {"success": True, "review": review}
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            return {"success": False, "error": f"Erro de validação: {str(e)}"}
        except Exception as e:
            self.logger.error(f"Erro ao votar em review: {str(e)}", exc_info=True)
            return {"success": False, "error": "Erro ao votar em review"}
