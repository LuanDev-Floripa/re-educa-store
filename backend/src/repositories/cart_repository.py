# -*- coding: utf-8 -*-
"""
Repositório de Carrinho RE-EDUCA Store.

Gerencia acesso a dados do carrinho de compras.
"""
import logging
from typing import Dict, Any, List, Optional
from repositories.base_repository import BaseRepository

logger = logging.getLogger(__name__)


class CartRepository(BaseRepository):
    """
    Repositório para operações com carrinho de compras.
    
    Tabela: cart_items
    """
    
    def __init__(self):
        """Inicializa o repositório de carrinho."""
        super().__init__('cart_items')
    
    def find_by_user(self, user_id: str) -> List[Dict[str, Any]]:
        """
        Busca itens do carrinho de um usuário.
        
        Args:
            user_id: ID do usuário
        
        Returns:
            Lista de itens do carrinho
        """
        try:
            return self.find_all(
                filters={'user_id': user_id},
                order_by='created_at',
                desc=False
            )
        except Exception as e:
            self.logger.error(f"Erro ao buscar carrinho: {str(e)}")
            return []
    
    def find_item(self, user_id: str, product_id: str) -> Optional[Dict[str, Any]]:
        """
        Busca um item específico no carrinho.
        
        Args:
            user_id: ID do usuário
            product_id: ID do produto
        
        Returns:
            Item do carrinho ou None
        """
        try:
            items = self.find_all(filters={'user_id': user_id, 'product_id': product_id}, limit=1)
            return items[0] if items else None
        except Exception as e:
            self.logger.error(f"Erro ao buscar item: {str(e)}")
            return None
    
    def update_quantity(self, item_id: str, quantity: int) -> Optional[Dict[str, Any]]:
        """
        Atualiza quantidade de um item.
        
        Args:
            item_id: ID do item
            quantity: Nova quantidade
        
        Returns:
            Item atualizado ou None
        """
        try:
            if quantity <= 0:
                return self.delete(item_id)
            
            return self.update(item_id, {'quantity': quantity})
        except Exception as e:
            self.logger.error(f"Erro ao atualizar quantidade: {str(e)}")
            return None
    
    def clear_user_cart(self, user_id: str) -> bool:
        """
        Limpa carrinho de um usuário.
        
        Args:
            user_id: ID do usuário
        
        Returns:
            True se deletado, False caso contrário
        """
        try:
            result = (
                self.db.table(self.table_name)
                .delete()
                .eq('user_id', user_id)
                .execute()
            )
            return True
        except Exception as e:
            self.logger.error(f"Erro ao limpar carrinho: {str(e)}")
            return False
    
    def count_user_items(self, user_id: str) -> int:
        """
        Conta itens no carrinho do usuário.
        
        Args:
            user_id: ID do usuário
        
        Returns:
            Número de itens
        """
        try:
            items = self.find_by_user(user_id)
            return len(items)
        except Exception as e:
            self.logger.error(f"Erro ao contar itens: {str(e)}")
            return 0
