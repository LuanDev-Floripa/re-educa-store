# -*- coding: utf-8 -*-
"""
Repositório de Produtos RE-EDUCA Store.

Gerencia acesso a dados de produtos.
"""
import logging
from typing import Any, Dict, List, Optional

from repositories.base_repository import BaseRepository

logger = logging.getLogger(__name__)


class ProductRepository(BaseRepository):
    """
    Repositório para operações com produtos.

    Tabela: products
    """

    def __init__(self):
        """Inicializa o repositório de produtos."""
        super().__init__("products")

    def find_active(self, limit: Optional[int] = None, offset: int = 0) -> List[Dict[str, Any]]:
        """
        Busca produtos ativos.

        Args:
            limit: Limite de resultados
            offset: Offset para paginação

        Returns:
            Lista de produtos ativos
        """
        try:
            return self.find_all(
                filters={"is_active": True}, order_by="created_at", desc=True, limit=limit, offset=offset
            )
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            self.logger.error(f"Erro ao buscar produtos ativos: {str(e)}", exc_info=True)
            return []

    def find_all_products(self) -> List[Dict[str, Any]]:
        """
        Busca todos os produtos (sem filtros).

        Returns:
            Lista de todos os produtos
        """
        try:
            return self.find_all(limit=None)
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            self.logger.error(f"Erro ao buscar todos os produtos: {str(e)}", exc_info=True)
            return []

    def update_stock(self, product_id: str, new_stock: int) -> Optional[Dict[str, Any]]:
        """
        Atualiza estoque de um produto.

        ⚠️ DEPRECATED: Este método não usa locks e pode ter race conditions.
        Use InventoryService.update_stock() que usa função SQL atômica.

        Args:
            product_id: ID do produto
            new_stock: Nova quantidade em estoque

        Returns:
            Produto atualizado ou None
        """
        try:
            from datetime import datetime

            # Garantir que não fica negativo (CHECK constraint também protege)
            new_stock = max(0, new_stock)

            return self.update(product_id, {"stock_quantity": new_stock, "updated_at": datetime.now().isoformat()})
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            self.logger.error(f"Erro ao atualizar estoque: {str(e)}", exc_info=True)
            return None

    def find_low_stock(self, threshold: int = 10) -> List[Dict[str, Any]]:
        """
        Busca produtos com estoque baixo.

        Args:
            threshold: Limite de estoque mínimo

        Returns:
            Lista de produtos com estoque abaixo do threshold
        """
        try:
            # Query com filtro de estoque baixo
            result = (
                self.db.table(self.table_name)
                .select("*")
                .lt("stock_quantity", threshold)
                .eq("is_active", True)
                .execute()
            )
            return result.data if result.data else []
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            self.logger.error(f"Erro ao buscar produtos com estoque baixo: {str(e)}", exc_info=True)
            return []

    def count_active(self) -> int:
        """
        Conta produtos ativos.

        Returns:
            Número de produtos ativos
        """
        try:
            return self.count(filters={"is_active": True})
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            self.logger.error(f"Erro ao contar produtos ativos: {str(e)}", exc_info=True)
            return 0

    def count_out_of_stock(self) -> int:
        """
        Conta produtos sem estoque.

        Returns:
            Número de produtos sem estoque
        """
        try:
            return self.count(filters={"stock_quantity": 0, "is_active": True})
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            self.logger.error(f"Erro ao contar produtos sem estoque: {str(e)}", exc_info=True)
            return 0

    def get_total_inventory_value(self) -> float:
        """
        Calcula valor total do inventário (estoque * preço).

        Returns:
            Valor total do inventário
        """
        try:
            result = self.db.table(self.table_name).select("price, stock_quantity").eq("is_active", True).execute()

            if result.data:
                total = sum(p.get("price", 0) * p.get("stock_quantity", 0) for p in result.data)
                return float(total)
            return 0.0
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            self.logger.error(f"Erro ao calcular valor do inventário: {str(e)}", exc_info=True)
            return 0.0

    def find_related(self, product_id: str, limit: int = 4) -> List[Dict[str, Any]]:
        """
        Busca produtos relacionados ao produto especificado.

        Busca produtos da mesma categoria, excluindo o produto atual.

        Args:
            product_id: ID do produto
            limit: Limite de resultados (padrão: 4)

        Returns:
            Lista de produtos relacionados
        """
        try:
            # Buscar produto atual para obter categoria
            product = self.find_by_id(product_id)
            if not product:
                return []

            category = product.get("category")
            if not category:
                return []

            # Buscar produtos da mesma categoria, excluindo o produto atual
            result = (
                self.db.table(self.table_name)
                .select("*")
                .eq("category", category)
                .eq("is_active", True)
                .neq("id", product_id)
                .order("created_at", desc=True)
                .limit(limit)
                .execute()
            )

            return result.data if result.data else []
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            self.logger.error(f"Erro ao buscar produtos relacionados: {str(e)}", exc_info=True)
            return []

    def find_recommended(self, limit: int = 10) -> List[Dict[str, Any]]:
        """
        Busca produtos recomendados (bem avaliados e em estoque).

        Args:
            limit: Limite de resultados

        Returns:
            Lista de produtos recomendados
        """
        try:
            result = (
                self.db.table(self.table_name)
                .select("*")
                .eq("is_active", True)
                .gt("stock_quantity", 0)
                .order("rating", desc=True)
                .order("reviews_count", desc=True)
                .limit(limit)
                .execute()
            )
            return result.data if result.data else []
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            self.logger.error(f"Erro ao buscar produtos recomendados: {str(e)}", exc_info=True)
            return []

    def find_trending(self, limit: int = 10) -> List[Dict[str, Any]]:
        """
        Busca produtos em tendência (mais vendidos recentemente).

        Args:
            limit: Limite de resultados

        Returns:
            Lista de produtos em tendência
        """
        try:
            # Retorna produtos mais bem avaliados e em estoque
            # TODO: Implementar ranking baseado em dados reais de vendas
            result = (
                self.db.table(self.table_name)
                .select("*")
                .eq("is_active", True)
                .gt("stock_quantity", 0)
                .order("reviews_count", desc=True)
                .order("rating", desc=True)
                .limit(limit)
                .execute()
            )
            return result.data if result.data else []
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            self.logger.error(f"Erro ao buscar produtos em tendência: {str(e)}", exc_info=True)
            return []

    def find_by_ids(self, product_ids: List[str]) -> List[Dict[str, Any]]:
        """
        Busca múltiplos produtos por IDs.

        Método para evitar N+1 queries através de busca em lote.

        Args:
            product_ids: Lista de IDs dos produtos

        Returns:
            Lista de produtos encontrados
        """
        try:
            if not product_ids:
                return []

            result = self.db.table(self.table_name).select("*").in_("id", product_ids).execute()
            return result.data if result.data else []
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            self.logger.error(f"Erro ao buscar produtos por IDs: {str(e)}", exc_info=True)
            return []

    def get_categories(self) -> List[str]:
        """
        Retorna lista de categorias únicas.

        Returns:
            Lista de categorias
        """
        try:
            result = self.db.table(self.table_name).select("category").eq("is_active", True).execute()

            if result.data:
                categories = set()
                for item in result.data:
                    category = item.get("category")
                    if category:
                        categories.add(category)
                return sorted(list(categories))
            return []
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            self.logger.error(f"Erro ao buscar categorias: {str(e)}", exc_info=True)
            return []

    def find_all_with_filters(
        self, filters: Optional[Dict[str, Any]] = None, page: int = 1, per_page: int = 20
    ) -> Dict[str, Any]:
        """
        Busca produtos com filtros e paginação.

        Retorna formato padronizado com paginação.

        Args:
            filters: Filtros a aplicar (ex: {'category': 'protein', 'search': 'termo'})
            page: Número da página (1-indexed)
            per_page: Itens por página

        Returns:
            Dict com produtos e informações de paginação
        """
        try:
            # Preparar filtros para find_all
            db_filters = {}
            search_term = None

            if filters:
                # Separar filtros normais de search
                for key, value in filters.items():
                    if key == "search":
                        search_term = value
                    elif key != "search":
                        db_filters[key] = value

            # Calcular offset
            offset = (page - 1) * per_page

            # Construir query
            query = self.db.table(self.table_name).select("*")

            # Aplicar filtros normais
            if db_filters:
                for field, value in db_filters.items():
                    if isinstance(value, list):
                        query = query.in_(field, value)
                    else:
                        query = query.eq(field, value)

            # Aplicar busca (search)
            if search_term:
                # Busca em nome ou descrição
                query = query.or_(f"name.ilike.%{search_term}%,description.ilike.%{search_term}%")

            # Ordenação padrão
            query = query.order("created_at", desc=True)

            # Paginação
            end = offset + per_page - 1
            query = query.range(offset, end)

            # Executar query
            result = query.execute()
            products = result.data if result.data else []

            # Contar total (para paginação)
            count_query = self.db.table(self.table_name).select("id", count="exact")

            if db_filters:
                for field, value in db_filters.items():
                    if isinstance(value, list):
                        count_query = count_query.in_(field, value)
                    else:
                        count_query = count_query.eq(field, value)

            if search_term:
                count_query = count_query.or_(f"name.ilike.%{search_term}%,description.ilike.%{search_term}%")

            count_result = count_query.execute()
            total = count_result.count if hasattr(count_result, "count") else len(products)

            return {
                "products": products,
                "pagination": {
                    "page": page,
                    "per_page": per_page,
                    "total": total,
                    "pages": (total + per_page - 1) // per_page if total > 0 else 0,
                },
            }

        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            self.logger.error(f"Erro ao buscar produtos com filtros: {str(e)}", exc_info=True)
            return {"products": [], "pagination": {"page": page, "per_page": per_page, "total": 0, "pages": 0}}
