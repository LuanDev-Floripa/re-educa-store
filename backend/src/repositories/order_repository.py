# -*- coding: utf-8 -*-
"""
Repositório de Pedidos RE-EDUCA Store.

Gerencia acesso a dados de pedidos.
"""
import logging
from typing import Any, Dict, List, Optional

from repositories.base_repository import BaseRepository

logger = logging.getLogger(__name__)


class OrderRepository(BaseRepository):
    """
    Repositório para operações com pedidos.

    Tabela: orders
    """

    def __init__(self):
        """Inicializa o repositório de pedidos."""
        super().__init__("orders")

    def find_by_user(self, user_id: str, page: int = 1, per_page: int = 20) -> Dict[str, Any]:
        """
        Busca pedidos de um usuário com paginação.

        Args:
            user_id: ID do usuário
            page: Página (1-indexed)
            per_page: Itens por página

        Returns:
            Dict com orders e pagination
        """
        try:
            offset = (page - 1) * per_page

            # Buscar pedidos com itens
            orders_result = (
                self.db.table(self.table_name)
                .select("*, order_items(*)")
                .eq("user_id", user_id)
                .order("created_at", desc=True)
                .range(offset, offset + per_page - 1)
                .execute()
            )

            # Contar total
            count_result = self.db.table(self.table_name).select("id", count="exact").eq("user_id", user_id).execute()

            total = count_result.count if hasattr(count_result, "count") else len(orders_result.data or [])

            orders = orders_result.data or []

            # Formatar pedidos
            formatted_orders = []
            for order in orders:
                items = order.get("order_items", [])
                if not isinstance(items, list):
                    items = []

                formatted_orders.append({**order, "items": items})

            return {
                "orders": formatted_orders,
                "pagination": {
                    "page": page,
                    "per_page": per_page,
                    "total": total,
                    "pages": (total + per_page - 1) // per_page if per_page > 0 else 0,
                },
            }
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            self.logger.error(f"Erro ao buscar pedidos: {str(e)}", exc_info=True)
            return {"orders": [], "pagination": {"page": page, "per_page": per_page, "total": 0, "pages": 0}}

    def find_by_date_range(
        self, start_date: str, end_date: str, status_filter: Optional[List[str]] = None
    ) -> List[Dict[str, Any]]:
        """
        Busca pedidos em um intervalo de datas.

        Args:
            start_date: Data inicial (ISO format)
            end_date: Data final (ISO format)
            status_filter: Lista de status para filtrar (opcional)

        Returns:
            Lista de pedidos no período
        """
        try:
            query = self.db.table(self.table_name).select("*").gte("created_at", start_date).lte("created_at", end_date)

            if status_filter:
                query = query.in_("status", status_filter)

            result = query.order("created_at", desc=True).execute()
            return result.data if result.data else []
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            self.logger.error(f"Erro ao buscar pedidos por período: {str(e)}", exc_info=True)
            return []

    def find_by_status(self, status: str, limit: Optional[int] = None) -> List[Dict[str, Any]]:
        """
        Busca pedidos por status.

        Args:
            status: Status do pedido
            limit: Limite de resultados

        Returns:
            Lista de pedidos
        """
        try:
            return self.find_all(filters={"status": status}, order_by="created_at", desc=True, limit=limit)
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            self.logger.error(f"Erro ao buscar pedidos por status: {str(e)}", exc_info=True)
            return []

    def get_total_revenue(self, status_filter: Optional[List[str]] = None) -> float:
        """
        Calcula receita total de pedidos.

        Args:
            status_filter: Lista de status para filtrar (ex: ['paid', 'completed'])

        Returns:
            Receita total
        """
        try:
            all_orders = self.find_all()

            if not all_orders:
                return 0.0

            if status_filter:
                orders = [o for o in all_orders if o.get("status") in status_filter]
            else:
                orders = all_orders

            return float(sum(order.get("total", 0) for order in orders))
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            self.logger.error(f"Erro ao calcular receita total: {str(e)}", exc_info=True)
            return 0.0

    def create_order_with_items(self, order_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Cria pedido com itens.

        Args:
            order_data: Dados do pedido incluindo items

        Returns:
            Pedido criado ou None
        """
        try:
            from utils.helpers import generate_uuid

            order_id = generate_uuid()
            user_id = order_data["user_id"]
            items = order_data.pop("items", [])

            # Criar pedido
            order_insert = {
                "id": order_id,
                "user_id": user_id,
                "total": order_data.get("total", 0),
                "status": order_data.get("status", "pending"),
                "payment_status": order_data.get("payment_status", "pending"),
                "shipping_address": order_data.get("shipping_address"),
                "payment_method": order_data.get("payment_method"),
                "transaction_id": order_data.get("transaction_id"),
                "coupon_code": order_data.get("coupon_code"),
                "discount_amount": order_data.get("discount_amount", 0),
                "shipping_cost": order_data.get("shipping_cost", 0),
            }

            order_result = self.db.table(self.table_name).insert(order_insert).execute()

            if not order_result.data:
                return None

            # Criar itens do pedido
            if items:
                order_items = []
                for item in items:
                    order_items.append(
                        {
                            "order_id": order_id,
                            "product_id": item["product_id"],
                            "quantity": item["quantity"],
                            "price": item["price"],
                        }
                    )

                if order_items:
                    self.db.table("order_items").insert(order_items).execute()

            # Buscar pedido completo com itens
            result = self.db.table(self.table_name).select("*, order_items(*)").eq("id", order_id).execute()

            if result.data:
                order = result.data[0]
                order["items"] = order.get("order_items", [])
                return order

            return order_result.data[0] if order_result.data else None

        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            self.logger.error(f"Erro ao criar pedido: {str(e)}", exc_info=True)
            return None

    def get_orders_with_user_info(
        self, filters: Optional[Dict[str, Any]] = None, limit: Optional[int] = None, offset: int = 0
    ) -> List[Dict[str, Any]]:
        """
        Busca pedidos com informações de usuário (join).

        Args:
            filters: Filtros adicionais
            limit: Limite de resultados
            offset: Offset para paginação

        Returns:
            Lista de pedidos com dados do usuário
        """
        try:
            query = self.db.table(self.table_name).select("*, users(name, email)")

            if filters:
                for key, value in filters.items():
                    query = query.eq(key, value)

            query = query.order("created_at", desc=True)

            if limit:
                query = query.range(offset, offset + limit - 1)

            result = query.execute()
            return result.data if result.data else []
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            self.logger.error(f"Erro ao buscar pedidos com info de usuário: {str(e)}", exc_info=True)
            return []
