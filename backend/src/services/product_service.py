"""
Service de produtos RE-EDUCA Store.

Gerencia operações de produtos incluindo:
- Listagem com filtros e paginação
- Busca de produtos
- CRUD completo de produtos
- Gestão de categorias
- Produtos em destaque
- Controle de estoque

Utiliza exclusivamente ProductRepository para acesso a dados seguindo o padrão de arquitetura.
"""

import logging
from typing import Any, Dict, List, Optional

from repositories.product_repository import ProductRepository
from repositories.review_repository import ReviewRepository
from repositories.order_item_repository import OrderItemRepository
from services.base_service import BaseService

logger = logging.getLogger(__name__)


class ProductService(BaseService):
    """Service para operações de produtos - Usa repositório"""

    def __init__(self):
        super().__init__()
        self.repo = ProductRepository()  # Repositório de produtos (único acesso a dados)
        self.review_repo = ReviewRepository()  # Repositório de reviews
        self.order_item_repo = OrderItemRepository()  # Repositório de itens de pedido

    def get_products(
        self, page: int = 1, per_page: int = 20, category: Optional[str] = None, search: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Retorna lista de produtos com filtros e paginação.

        Utiliza ProductRepository exclusivamente para acesso padronizado aos dados.
        """
        try:
            filters = {"is_active": True}
            if category:
                filters["category"] = category
            if search:
                filters["search"] = search

            return self.repo.find_all_with_filters(filters=filters, page=page, per_page=per_page)

        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            self.logger.error(f"Erro ao buscar produtos: {e}", exc_info=True)
            return {
                "products": [],
                "pagination": {"page": page, "per_page": per_page, "total": 0, "pages": 0},
                "error": "Erro interno do servidor",
            }

    def get_product(self, product_id: str) -> Optional[Dict[str, Any]]:
        """
        Retorna detalhes de um produto específico - usa repositório.

        Args:
            product_id (str): ID do produto.

        Returns:
            Optional[Dict[str, Any]]: Dados do produto ou None se não encontrado.
        """
        try:
            return self.repo.find_by_id(product_id)
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            self.logger.error(f"Erro ao buscar produto: {e}", exc_info=True)
            return None

    def create_product(self, product_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Cria um novo produto.

        Utiliza ProductRepository exclusivamente para acesso padronizado aos dados.
        """
        try:
            required_fields = ["name", "price", "category"]
            missing = [field for field in required_fields if field not in product_data or product_data[field] is None]
            if missing:
                return {"success": False, "error": f'Campos obrigatórios faltando: {", ".join(missing)}'}

            if "is_active" not in product_data:
                product_data["is_active"] = True
            if "in_stock" not in product_data:
                product_data["in_stock"] = True

            created_product = self.repo.create(product_data)

            if created_product:
                # Invalidar cache de produtos
                self._invalidate_product_cache()
                return {"success": True, "product": created_product}
            else:
                return {"success": False, "error": "Erro ao criar produto"}
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            self.logger.error(f"Erro ao criar produto: {e}", exc_info=True)
            return {"success": False, "error": "Erro interno do servidor"}

    def update_product(self, product_id: str, product_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Atualiza um produto.

        Utiliza ProductRepository exclusivamente para acesso padronizado aos dados.
        """
        try:
            existing = self.repo.find_by_id(product_id)
            if not existing:
                return {"success": False, "error": "Produto não encontrado"}

            restricted_fields = ["id", "created_at"]
            update_data = {k: v for k, v in product_data.items() if k not in restricted_fields}

            updated_product = self.repo.update(product_id, update_data)

            if updated_product:
                # Invalidar cache do produto específico e lista geral
                self._invalidate_product_cache(product_id)
                return {"success": True, "product": updated_product}
            else:
                return {"success": False, "error": "Erro ao atualizar produto"}
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            self.logger.error(f"Erro ao atualizar produto: {e}", exc_info=True)
            return {"success": False, "error": "Erro interno do servidor"}

    def delete_product(self, product_id: str) -> Dict[str, Any]:
        """
        Remove um produto (soft delete).

        Utiliza ProductRepository exclusivamente para acesso padronizado aos dados.
        """
        try:
            updated = self.repo.update(product_id, {"is_active": False})

            if updated:
                # Invalidar cache do produto e lista geral
                self._invalidate_product_cache(product_id)
                return {"success": True, "message": "Produto desativado com sucesso"}
            else:
                return {"success": False, "error": "Produto não encontrado"}
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            self.logger.error(f"Erro ao remover produto: {e}", exc_info=True)
            return {"success": False, "error": "Erro interno do servidor"}

    def get_categories(self) -> List[str]:
        """
        Retorna lista de categorias.

        Utiliza ProductRepository exclusivamente para acesso padronizado aos dados.
        """
        try:
            return self.repo.get_categories()
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            self.logger.error(f"Erro ao buscar categorias: {e}", exc_info=True)
            return []

    def get_product_reviews(
        self, product_id: str, page: int = 1, per_page: int = 10, order_by: str = "created_at"
    ) -> Dict[str, Any]:
        """
        Retorna avaliações de um produto.

        Utiliza ReviewRepository para acesso padronizado aos dados.

        Args:
            product_id: ID do produto
            page: Página
            per_page: Itens por página
            order_by: Campo para ordenação (created_at, helpful, rating)

        Returns:
            Dict com reviews e paginação
        """
        try:
            # Verificar se produto existe
            product = self.repo.find_by_id(product_id)
            if not product:
                return {"reviews": [], "pagination": {"page": page, "per_page": per_page, "total": 0, "pages": 0}}

            # Buscar reviews usando repository
            result = self.review_repo.find_by_product(
                product_id=product_id, page=page, per_page=per_page, order_by=order_by, desc=True
            )

            # Buscar estatísticas de rating
            stats = self.review_repo.get_rating_stats(product_id)

            return {
                **result,
                "rating_stats": stats,
            }
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            return {"reviews": [], "pagination": {"page": page, "per_page": per_page, "total": 0, "pages": 0}}
        except Exception as e:
            self.logger.error(f"Erro ao buscar avaliações: {e}", exc_info=True)
            return {"reviews": [], "pagination": {"page": page, "per_page": per_page, "total": 0, "pages": 0}}

    def create_review(self, product_id: str, user_id: str, review_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Cria uma avaliação de produto.

        Utiliza ReviewRepository para acesso padronizado aos dados.
        O rating do produto é atualizado automaticamente via trigger no banco.

        Args:
            product_id: ID do produto
            user_id: ID do usuário
            review_data: Dados da avaliação (rating, comment, title, pros, cons, images, verified)

        Returns:
            Dict com success e review ou error
        """
        try:
            # Validar campos obrigatórios
            if "rating" not in review_data:
                return {"success": False, "error": "Rating é obrigatório"}

            rating = int(review_data["rating"])
            if rating < 1 or rating > 5:
                return {"success": False, "error": "Rating deve estar entre 1 e 5"}

            # Verificar se produto existe
            product = self.repo.find_by_id(product_id)
            if not product:
                return {"success": False, "error": "Produto não encontrado"}

            # Verificar se usuário já avaliou este produto
            if self.review_repo.user_has_reviewed(product_id, user_id):
                return {"success": False, "error": "Você já avaliou este produto"}

            # Preparar dados da review
            from datetime import datetime

            review_data_to_save = {
                "product_id": product_id,
                "user_id": user_id,
                "rating": rating,
                "comment": review_data.get("comment", ""),
                "title": review_data.get("title"),
                "pros": review_data.get("pros"),
                "cons": review_data.get("cons"),
                "verified": review_data.get("verified", False),
                "images": review_data.get("images", []),
                "created_at": datetime.utcnow().isoformat(),
                "updated_at": datetime.utcnow().isoformat(),
            }

            # Criar review usando repository
            created_review = self.review_repo.create(review_data_to_save)

            if created_review:
                # Buscar review completa com dados do usuário
                review_with_user = self.review_repo.find_by_id_with_user(created_review["id"])

                # Invalidar cache de reviews do produto
                self._invalidate_product_cache(product_id, invalidate_reviews=True)
                return {
                    "success": True,
                    "review": review_with_user or created_review,
                    "message": "Avaliação criada com sucesso",
                }
            else:
                return {"success": False, "error": "Erro ao criar avaliação"}
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            return {"success": False, "error": f"Erro de validação: {str(e)}"}
        except Exception as e:
            self.logger.error(f"Erro ao criar avaliação: {e}", exc_info=True)
            return {"success": False, "error": "Erro interno do servidor"}

    def update_review(
        self, review_id: str, user_id: str, review_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Atualiza uma avaliação de produto.

        Utiliza ReviewRepository para acesso padronizado aos dados.

        Args:
            review_id: ID da review
            user_id: ID do usuário (para verificar permissão)
            review_data: Dados a atualizar

        Returns:
            Dict com success e review atualizada ou error
        """
        try:
            # Buscar review existente
            review = self.review_repo.find_by_id(review_id)
            if not review:
                return {"success": False, "error": "Avaliação não encontrada"}

            # Verificar se usuário é o dono da review ou admin
            if review.get("user_id") != user_id:
                # Verificar se é admin
                from repositories.user_repository import UserRepository

                user_repo = UserRepository()
                user = user_repo.find_by_id(user_id)
                if not user or user.get("role") != "admin":
                    return {"success": False, "error": "Você não tem permissão para editar esta avaliação"}

            # Validar rating se fornecido
            if "rating" in review_data:
                rating = int(review_data["rating"])
                if rating < 1 or rating > 5:
                    return {"success": False, "error": "Rating deve estar entre 1 e 5"}

            # Preparar dados para atualização
            from datetime import datetime

            update_data = {k: v for k, v in review_data.items() if k not in ["id", "product_id", "user_id", "created_at"]}
            update_data["updated_at"] = datetime.utcnow().isoformat()

            # Atualizar review
            updated_review = self.review_repo.update(review_id, update_data)

            if updated_review:
                # Buscar review completa com dados do usuário
                review_with_user = self.review_repo.find_by_id_with_user(review_id)
                
                # Invalidar cache de reviews do produto
                product_id = review.get("product_id")
                if product_id:
                    self._invalidate_product_cache(product_id, invalidate_reviews=True)

                return {
                    "success": True,
                    "review": review_with_user or updated_review,
                    "message": "Avaliação atualizada com sucesso",
                }
            else:
                return {"success": False, "error": "Erro ao atualizar avaliação"}
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            return {"success": False, "error": f"Erro de validação: {str(e)}"}
        except Exception as e:
            self.logger.error(f"Erro ao atualizar avaliação: {e}", exc_info=True)
            return {"success": False, "error": "Erro interno do servidor"}

    def delete_review(self, review_id: str, user_id: str) -> Dict[str, Any]:
        """
        Deleta uma avaliação de produto.

        Utiliza ReviewRepository para acesso padronizado aos dados.

        Args:
            review_id: ID da review
            user_id: ID do usuário (para verificar permissão)

        Returns:
            Dict com success ou error
        """
        try:
            # Buscar review existente
            review = self.review_repo.find_by_id(review_id)
            if not review:
                return {"success": False, "error": "Avaliação não encontrada"}

            # Verificar se usuário é o dono da review ou admin
            if review.get("user_id") != user_id:
                # Verificar se é admin
                from repositories.user_repository import UserRepository

                user_repo = UserRepository()
                user = user_repo.find_by_id(user_id)
                if not user or user.get("role") != "admin":
                    return {"success": False, "error": "Você não tem permissão para deletar esta avaliação"}

            # Deletar review
            deleted = self.review_repo.delete(review_id)
            
            # Obter product_id antes de deletar
            product_id = review.get("product_id") if review else None

            if deleted:
                # Invalidar cache de reviews do produto
                if product_id:
                    self._invalidate_product_cache(product_id, invalidate_reviews=True)
                return {"success": True, "message": "Avaliação deletada com sucesso"}
            else:
                return {"success": False, "error": "Erro ao deletar avaliação"}
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            return {"success": False, "error": f"Erro de validação: {str(e)}"}
        except Exception as e:
            self.logger.error(f"Erro ao deletar avaliação: {e}", exc_info=True)
            return {"success": False, "error": "Erro interno do servidor"}

    def vote_review_helpful(self, review_id: str, user_id: str, is_helpful: bool) -> Dict[str, Any]:
        """
        Vota em uma review como útil ou não útil.

        Utiliza ReviewRepository para acesso padronizado aos dados.

        Args:
            review_id: ID da review
            user_id: ID do usuário que está votando
            is_helpful: True se útil, False se não útil

        Returns:
            Dict com success e review atualizada ou error
        """
        try:
            # Verificar se review existe
            review = self.review_repo.find_by_id(review_id)
            if not review:
                return {"success": False, "error": "Avaliação não encontrada"}

            # Votar usando repository
            result = self.review_repo.vote_helpful(review_id, user_id, is_helpful)
            
            # Invalidar cache de reviews do produto se voto foi bem-sucedido
            if result.get("success") and review:
                product_id = review.get("product_id")
                if product_id:
                    self._invalidate_product_cache(product_id, invalidate_reviews=True)

            return result
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            return {"success": False, "error": f"Erro de validação: {str(e)}"}
        except Exception as e:
            self.logger.error(f"Erro ao votar em avaliação: {e}", exc_info=True)
            return {"success": False, "error": "Erro interno do servidor"}

    def get_featured_products(self, limit: int = 10) -> List[Dict[str, Any]]:
        """Retorna produtos em destaque - usa repositório"""
        try:
            result = self.repo.find_all_with_filters(
                filters={"is_active": True, "featured": True}, order_by="created_at", desc=True, limit=limit
            )
            return (
                result.get("products", [])
                if isinstance(result, dict)
                else result[:limit] if isinstance(result, list) else []
            )
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            self.logger.error(f"Erro ao buscar produtos em destaque: {e}", exc_info=True)
            return []

    def get_recommended_products(self, user_id: Optional[str] = None, limit: int = 10) -> List[Dict[str, Any]]:
        """Retorna produtos recomendados para o usuário - usa repositório"""
        try:
            return self.repo.find_recommended(limit=limit)
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            self.logger.error(f"Erro ao buscar produtos recomendados: {e}", exc_info=True)
            return []

    def get_trending_products(self, limit: int = 10, period: str = "week") -> List[Dict[str, Any]]:
        """Retorna produtos em tendência - usa repositório"""
        try:
            return self.repo.find_trending(limit=limit)
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            self.logger.error(f"Erro ao buscar produtos em tendência: {e}", exc_info=True)
            return []

    def get_related_products(self, product_id: str, limit: int = 4) -> List[Dict[str, Any]]:
        """
        Retorna produtos relacionados ao produto especificado.

        Busca produtos da mesma categoria, excluindo o produto atual.

        Args:
            product_id: ID do produto
            limit: Limite de resultados (padrão: 4)

        Returns:
            Lista de produtos relacionados
        """
        try:
            return self.repo.find_related(product_id, limit=limit)
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            self.logger.error(f"Erro ao buscar produtos relacionados: {e}", exc_info=True)
            return []

    def _get_recommended_products_old(self, user_id: str, limit: int = 10) -> List[Dict[str, Any]]:
        """Retorna produtos recomendados para o usuário"""
        try:
            # Implementação básica - em produção usar ML
            products = self.db.get_products({})
            return products[:limit]
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            logger.error(f"Erro ao buscar produtos recomendados: {e}", exc_info=True)
            return []

    def search_products(self, filters: Dict[str, Any], page: int = 1, per_page: int = 20) -> Dict[str, Any]:
        """
        Busca avançada de produtos com múltiplos filtros.

        Utiliza ProductRepository exclusivamente para acesso padronizado aos dados.
        """
        try:
            if "is_active" not in filters:
                filters["is_active"] = True

            return self.repo.find_all_with_filters(filters=filters, page=page, per_page=per_page)
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            self.logger.error(f"Erro na busca de produtos: {e}", exc_info=True)
            return {"products": [], "pagination": {"page": page, "per_page": per_page, "total": 0, "pages": 0}}

    def get_product_ranking(
        self, limit: int = 20, category: Optional[str] = None, period_days: int = 30
    ) -> Dict[str, Any]:
        """
        Retorna ranking de produtos baseado em dados reais de vendas.
        
        Calcula score baseado em:
        - Número de vendas (peso: 40%)
        - Receita gerada (peso: 30%)
        - Rating médio e número de reviews (peso: 20%)
        - Produto em destaque (peso: 10%)
        
        Args:
            limit: Número de produtos no ranking
            category: Filtrar por categoria (opcional)
            period_days: Período em dias para análise de vendas (padrão: 30)
            
        Returns:
            Dict com lista de produtos ordenados por score e métricas
        """
        try:
            from datetime import datetime, timedelta
            from collections import defaultdict

            # Calcular período
            end_date = datetime.now()
            start_date = end_date - timedelta(days=period_days)

            # Buscar pedidos completados no período
            from repositories.order_repository import OrderRepository
            order_repo = OrderRepository()
            orders = order_repo.find_by_date_range(
                start_date.isoformat(), end_date.isoformat(), status_filter=["completed", "paid"]
            )

            if not orders:
                # Se não houver vendas, retornar produtos por rating
                return self._get_ranking_by_rating(limit, category)

            # Buscar itens de pedido
            order_ids = [order["id"] for order in orders]
            order_items = self.order_item_repo.find_by_order_ids(order_ids)

            # Agregar vendas por produto
            product_sales = defaultdict(lambda: {"quantity": 0, "revenue": 0, "orders": set()})
            for item in order_items:
                product_id = item.get("product_id")
                quantity = item.get("quantity", 0)
                price = item.get("price", 0)
                order_id = item.get("order_id")

                product_sales[product_id]["quantity"] += quantity
                product_sales[product_id]["revenue"] += quantity * price
                product_sales[product_id]["orders"].add(order_id)

            # Buscar produtos ativos
            filters = {"is_active": True}
            if category:
                filters["category"] = category

            all_products_result = self.repo.find_all_with_filters(filters=filters, page=1, per_page=1000)
            all_products = (
                all_products_result.get("products", [])
                if isinstance(all_products_result, dict)
                else (all_products_result if isinstance(all_products_result, list) else [])
            )

            # Calcular scores para cada produto
            product_scores = []
            max_sales = max((ps["quantity"] for ps in product_sales.values()), default=1)
            max_revenue = max((ps["revenue"] for ps in product_sales.values()), default=1)

            for product in all_products:
                product_id = product["id"]
                sales_data = product_sales.get(product_id, {"quantity": 0, "revenue": 0, "orders": set()})

                # Buscar rating e reviews
                rating_stats = self.review_repo.get_rating_stats(product_id)
                avg_rating = rating_stats.get("average_rating", 0)
                reviews_count = rating_stats.get("total_reviews", 0)

                # Normalizar métricas (0-1)
                sales_score = sales_data["quantity"] / max_sales if max_sales > 0 else 0
                revenue_score = sales_data["revenue"] / max_revenue if max_revenue > 0 else 0
                rating_score = avg_rating / 5.0  # Normalizar para 0-1
                reviews_score = min(reviews_count / 50.0, 1.0)  # Cap em 50 reviews
                featured_score = 1.0 if product.get("is_featured", False) else 0.0

                # Calcular score final (pesos)
                final_score = (
                    sales_score * 0.4
                    + revenue_score * 0.3
                    + (rating_score * 0.7 + reviews_score * 0.3) * 0.2
                    + featured_score * 0.1
                )

                product_scores.append(
                    {
                        "product": product,
                        "score": round(final_score, 4),
                        "metrics": {
                            "sales_quantity": sales_data["quantity"],
                            "revenue": round(sales_data["revenue"], 2),
                            "unique_orders": len(sales_data["orders"]),
                            "avg_rating": round(avg_rating, 2),
                            "reviews_count": reviews_count,
                        },
                    }
                )

            # Ordenar por score
            product_scores.sort(key=lambda x: x["score"], reverse=True)

            # Retornar top produtos
            top_products = product_scores[:limit]

            return {
                "ranking": [
                    {
                        "rank": idx + 1,
                        "product_id": item["product"]["id"],
                        "product_name": item["product"].get("name", "Produto"),
                        "category": item["product"].get("category", ""),
                        "price": item["product"].get("price", 0),
                        "score": item["score"],
                        "metrics": item["metrics"],
                    }
                    for idx, item in enumerate(top_products)
                ],
                "period_days": period_days,
                "total_products_analyzed": len(all_products),
            }

        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            return {"ranking": [], "error": "Erro de validação"}
        except Exception as e:
            self.logger.error(f"Erro ao calcular ranking: {e}", exc_info=True)
            return {"ranking": [], "error": "Erro interno do servidor"}

    def _get_ranking_by_rating(self, limit: int, category: Optional[str] = None) -> Dict[str, Any]:
        """Retorna ranking baseado apenas em rating quando não há dados de vendas"""
        try:
            filters = {"is_active": True}
            if category:
                filters["category"] = category

            products_result = self.repo.find_all_with_filters(filters=filters, page=1, per_page=limit * 2)
            products = (
                products_result.get("products", [])
                if isinstance(products_result, dict)
                else (products_result if isinstance(products_result, list) else [])
            )

            product_scores = []
            for product in products:
                rating_stats = self.review_repo.get_rating_stats(product["id"])
                avg_rating = rating_stats.get("average_rating", 0)
                reviews_count = rating_stats.get("total_reviews", 0)

                # Score baseado apenas em rating e reviews
                score = (avg_rating / 5.0) * 0.7 + min(reviews_count / 50.0, 1.0) * 0.3

                product_scores.append(
                    {
                        "product": product,
                        "score": round(score, 4),
                        "metrics": {
                            "avg_rating": round(avg_rating, 2),
                            "reviews_count": reviews_count,
                            "sales_quantity": 0,
                            "revenue": 0,
                        },
                    }
                )

            product_scores.sort(key=lambda x: x["score"], reverse=True)

            return {
                "ranking": [
                    {
                        "rank": idx + 1,
                        "product_id": item["product"]["id"],
                        "product_name": item["product"].get("name", "Produto"),
                        "category": item["product"].get("category", ""),
                        "price": item["product"].get("price", 0),
                        "score": item["score"],
                        "metrics": item["metrics"],
                    }
                    for idx, item in enumerate(product_scores[:limit])
                ],
                "period_days": 0,
                "total_products_analyzed": len(products),
                "note": "Ranking baseado apenas em rating (sem dados de vendas)",
            }
        except Exception as e:
            logger.error(f"Erro ao buscar ranking por rating: {e}", exc_info=True)
            return {"ranking": [], "error": "Erro ao buscar ranking"}

    def _invalidate_product_cache(self, product_id: Optional[str] = None, invalidate_reviews: bool = False):
        """
        Invalida cache relacionado a produtos.
        
        Args:
            product_id: ID do produto específico (None = invalidar todos)
            invalidate_reviews: Se True, também invalida cache de reviews
        """
        try:
            from services.cache_service import CacheService
            cache_service = CacheService()
            
            if not cache_service.is_available():
                return
            
            # Invalidar cache de lista de produtos
            cache_service.delete_pattern("cache:routes.products.get_products:*")
            
            # Invalidar cache de busca
            cache_service.delete_pattern("cache:routes.products.search_products:*")
            
            # Invalidar cache de produto específico
            if product_id:
                cache_service.delete_pattern(f"cache:routes.products.get_product:*product_id:{product_id}*")
            
            # Invalidar cache de reviews se necessário
            if invalidate_reviews and product_id:
                cache_service.delete_pattern(f"cache:routes.products.get_product_reviews:*product_id:{product_id}*")
            
            logger.debug(f"Cache de produtos invalidado (product_id={product_id}, reviews={invalidate_reviews})")
        except Exception as e:
            logger.warning(f"Erro ao invalidar cache de produtos: {e}")
ucts": [], "pagination": {"page": page, "per_page": per_page, "total": 0, "pages": 0}}
