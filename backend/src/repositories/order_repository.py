# -*- coding: utf-8 -*-
"""
Repositório de Pedidos RE-EDUCA Store.

Gerencia acesso a dados de pedidos.
"""
import logging
from typing import Dict, Any, List, Optional
from repositories.base_repository import BaseRepository

logger = logging.getLogger(__name__)


class OrderRepository(BaseRepository):
    """
    Repositório para operações com pedidos.
    
    Tabela: orders
    """
    
    def __init__(self):
        """Inicializa o repositório de pedidos."""
        super().__init__('orders')
    
    def find_by_user(self, user_id: str, limit: Optional[int] = None) -> List[Dict[str, Any]]:
        """
        Busca pedidos de um usuário.
        
        Args:
            user_id: ID do usuário
            limit: Limite de resultados
        
        Returns:
            Lista de pedidos do usuário
        """
        try:
            return self.find_all(
                filters={'user_id': user_id},
                order_by='created_at',
                desc=True,
                limit=limit
            )
        except Exception as e:
            self.logger.error(f"Erro ao buscar pedidos do usuário: {str(e)}")
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
            return self.find_all(
                filters={'status': status},
                order_by='created_at',
                desc=True,
                limit=limit
            )
        except Exception as e:
            self.logger.error(f"Erro ao buscar pedidos por status: {str(e)}")
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
                orders = [o for o in all_orders if o.get('status') in status_filter]
            else:
                orders = all_orders
            
            return float(sum(order.get('total', 0) for order in orders))
        except Exception as e:
            self.logger.error(f"Erro ao calcular receita total: {str(e)}")
            return 0.0
    
    def get_orders_with_user_info(
        self,
        filters: Optional[Dict[str, Any]] = None,
        limit: Optional[int] = None,
        offset: int = 0
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
            query = (
                self.db.table(self.table_name)
                .select('*, users(name, email)')
            )
            
            if filters:
                for key, value in filters.items():
                    query = query.eq(key, value)
            
            query = query.order('created_at', desc=True)
            
            if limit:
                query = query.range(offset, offset + limit - 1)
            
            result = query.execute()
            return result.data if result.data else []
        except Exception as e:
            self.logger.error(f"Erro ao buscar pedidos com info de usuário: {str(e)}")
            return []
