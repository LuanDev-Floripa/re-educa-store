# -*- coding: utf-8 -*-
"""
Repositório de Itens de Pedido RE-EDUCA Store.

Gerencia acesso a dados de itens de pedidos (order_items).
"""
import logging
from typing import Any, Dict, List

from repositories.base_repository import BaseRepository

logger = logging.getLogger(__name__)


class OrderItemRepository(BaseRepository):
    """
    Repositório para operações com itens de pedidos.

    Tabela: order_items
    """

    def __init__(self):
        """Inicializa o repositório de itens de pedidos."""
        super().__init__("order_items")

    def find_by_order_ids(self, order_ids: List[str]) -> List[Dict[str, Any]]:
        """
        Busca itens de pedidos por lista de IDs de pedidos.

        Args:
            order_ids: Lista de IDs de pedidos

        Returns:
            Lista de itens de pedidos
        """
        try:
            if not order_ids:
                return []

            result = self.db.table(self.table_name).select("*").in_("order_id", order_ids).execute()

            return result.data if result.data else []
        except Exception as e:
            self.logger.error(f"Erro ao buscar itens de pedidos: {str(e)}", exc_info=True)
            return []

    def find_by_order_id(self, order_id: str) -> List[Dict[str, Any]]:
        """
        Busca itens de um pedido específico.

        Args:
            order_id: ID do pedido

        Returns:
            Lista de itens do pedido
        """
        try:
            result = self.db.table(self.table_name).select("*").eq("order_id", order_id).execute()

            return result.data if result.data else []
        except Exception as e:
            self.logger.error(f"Erro ao buscar itens do pedido {order_id}: {str(e)}", exc_info=True)
            return []

    def get_top_products_by_sales(self, order_ids: List[str], limit: int = 10) -> List[Dict[str, Any]]:
        """
        Retorna produtos mais vendidos baseado em itens de pedidos.

        Args:
            order_ids: Lista de IDs de pedidos
            limit: Limite de produtos a retornar

        Returns:
            Lista de produtos com quantidade e receita total
        """
        try:
            if not order_ids:
                return []

            items = self.find_by_order_ids(order_ids)

            # Agregar por produto
            from collections import defaultdict

            product_totals = defaultdict(lambda: {"quantity": 0, "revenue": 0})

            for item in items:
                product_id = item.get("product_id")
                quantity = item.get("quantity", 0)
                price = item.get("price", 0)

                if product_id:
                    product_totals[product_id]["quantity"] += quantity
                    product_totals[product_id]["revenue"] += quantity * price

            # Ordenar por quantidade e retornar top N
            sorted_products = sorted(product_totals.items(), key=lambda x: x[1]["quantity"], reverse=True)[:limit]

            return [
                {"product_id": product_id, "quantity": data["quantity"], "revenue": data["revenue"]}
                for product_id, data in sorted_products
            ]
        except Exception as e:
            self.logger.error(f"Erro ao calcular top produtos: {str(e)}", exc_info=True)
            return []
