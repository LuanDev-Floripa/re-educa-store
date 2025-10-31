"""
Service de Carrinho RE-EDUCA Store.

Gerencia operações do carrinho de compras incluindo:
- Adicionar e remover produtos
- Atualizar quantidades
- Calcular totais
- Validar estoque disponível
- Limpar carrinho
"""
import logging
from typing import Dict, Any, List
from datetime import datetime
from config.database import supabase_client
from utils.helpers import generate_uuid

logger = logging.getLogger(__name__)

class CartService:
    """
    Service para operações de carrinho de compras.
    
    Usa Supabase para armazenamento.
    """
    
    def __init__(self):
        """Inicializa o serviço de carrinho."""
        self.supabase = supabase_client
    
    def get_cart(self, user_id: str) -> Dict[str, Any]:
        """
        Retorna carrinho do usuário com itens e totais.
        
        Args:
            user_id (str): ID do usuário.
            
        Returns:
            Dict[str, Any]: Carrinho com items, total e item_count.
        """
        try:
            # Buscar itens do carrinho com dados do produto
            result = self.supabase.table('cart_items')\
                .select('*, products!cart_items_product_id_fkey(id, name, price, image_url, stock_quantity, is_active)')\
                .eq('user_id', user_id)\
                .execute()
            
            items = []
            total = 0
            
            if result.data:
                for item in result.data:
                    # Filtrar apenas produtos ativos
                    product = item.get('products', {}) if isinstance(item.get('products'), dict) else {}
                    if not product.get('is_active', True):
                        continue
                    
                    item_total = item['quantity'] * product.get('price', 0)
                    items.append({
                        'id': item['id'],
                        'product_id': item['product_id'],
                        'quantity': item['quantity'],
                        'name': product.get('name', 'Produto'),
                        'price': product.get('price', 0),
                        'image_url': product.get('image_url', ''),
                        'stock_quantity': product.get('stock_quantity', 0),
                        'total': item_total,
                        'created_at': item.get('created_at'),
                        'updated_at': item.get('updated_at')
                    })
                    total += item_total
            
            return {
                'items': items,
                'total': round(total, 2),
                'item_count': len(items)
            }
        except Exception as e:
            logger.error(f"Erro ao buscar carrinho: {str(e)}", exc_info=True)
            return {'items': [], 'total': 0, 'item_count': 0}
    
    def add_to_cart(self, user_id: str, product_id: str, quantity: int = 1) -> Dict[str, Any]:
        """
        Adiciona produto ao carrinho ou atualiza quantidade.
        
        Args:
            user_id (str): ID do usuário.
            product_id (str): ID do produto.
            quantity (int): Quantidade a adicionar (padrão: 1).
            
        Returns:
            Dict[str, Any]: Resultado com success e carrinho atualizado ou erro.
        """
        try:
            if quantity <= 0:
                return {'success': False, 'error': 'Quantidade inválida'}
            
            # Verificar se produto existe e está ativo
            product_result = self.supabase.table('products')\
                .select('id, stock_quantity, is_active')\
                .eq('id', product_id)\
                .eq('is_active', True)\
                .single()\
                .execute()
            
            if not product_result.data:
                return {'success': False, 'error': 'Produto não encontrado ou inativo'}
            
            product = product_result.data
            
            # Verificar estoque disponível
            if product.get('stock_quantity', 0) < quantity:
                return {'success': False, 'error': 'Estoque insuficiente'}
            
            # Verificar se item já existe no carrinho
            existing_result = self.supabase.table('cart_items')\
                .select('id, quantity')\
                .eq('user_id', user_id)\
                .eq('product_id', product_id)\
                .execute()
            
            if existing_result.data:
                # Atualizar quantidade existente
                existing_item = existing_result.data[0]
                new_quantity = existing_item['quantity'] + quantity
                
                # Verificar estoque novamente
                if product.get('stock_quantity', 0) < new_quantity:
                    return {'success': False, 'error': 'Estoque insuficiente para esta quantidade'}
                
                self.supabase.table('cart_items')\
                    .update({
                        'quantity': new_quantity,
                        'updated_at': datetime.now().isoformat()
                    })\
                    .eq('id', existing_item['id'])\
                    .execute()
            else:
                # Inserir novo item
                self.supabase.table('cart_items')\
                    .insert({
                        'id': generate_uuid(),
                        'user_id': user_id,
                        'product_id': product_id,
                        'quantity': quantity
                    })\
                    .execute()
            
            return {'success': True, 'message': 'Produto adicionado ao carrinho'}
        except Exception as e:
            logger.error(f"Erro ao adicionar ao carrinho: {str(e)}", exc_info=True)
            return {'success': False, 'error': 'Erro ao adicionar ao carrinho'}
    
    def update_cart_item(self, user_id: str, item_id: str, quantity: int) -> Dict[str, Any]:
        """
        Atualiza quantidade de item no carrinho.
        
        Args:
            user_id (str): ID do usuário.
            item_id (str): ID do item do carrinho.
            quantity (int): Nova quantidade.
            
        Returns:
            Dict[str, Any]: Resultado da operação.
        """
        try:
            if quantity <= 0:
                return self.remove_from_cart(user_id, item_id)
            
            # Buscar item do carrinho
            item_result = self.supabase.table('cart_items')\
                .select('product_id, products!cart_items_product_id_fkey(stock_quantity)')\
                .eq('id', item_id)\
                .eq('user_id', user_id)\
                .execute()
            
            if not item_result.data:
                return {'success': False, 'error': 'Item não encontrado'}
            
            item = item_result.data[0]
            product = item.get('products', {}) if isinstance(item.get('products'), dict) else {}
            stock_quantity = product.get('stock_quantity', 0)
            
            # Verificar estoque
            if stock_quantity < quantity:
                return {'success': False, 'error': 'Estoque insuficiente'}
            
            # Atualizar quantidade
            self.supabase.table('cart_items')\
                .update({
                    'quantity': quantity,
                    'updated_at': datetime.now().isoformat()
                })\
                .eq('id', item_id)\
                .eq('user_id', user_id)\
                .execute()
            
            return {'success': True, 'message': 'Carrinho atualizado'}
        except Exception as e:
            logger.error(f"Erro ao atualizar carrinho: {str(e)}", exc_info=True)
            return {'success': False, 'error': 'Erro ao atualizar carrinho'}
    
    def remove_from_cart(self, user_id: str, item_id: str) -> Dict[str, Any]:
        """
        Remove item do carrinho.
        
        Args:
            user_id (str): ID do usuário.
            item_id (str): ID do item do carrinho.
            
        Returns:
            Dict[str, Any]: Resultado da operação.
        """
        try:
            self.supabase.table('cart_items')\
                .delete()\
                .eq('id', item_id)\
                .eq('user_id', user_id)\
                .execute()
            
            return {'success': True, 'message': 'Item removido do carrinho'}
        except Exception as e:
            logger.error(f"Erro ao remover do carrinho: {str(e)}", exc_info=True)
            return {'success': False, 'error': 'Erro ao remover do carrinho'}
    
    def clear_cart(self, user_id: str) -> Dict[str, Any]:
        """
        Limpa carrinho do usuário (remove todos os itens).
        
        Args:
            user_id (str): ID do usuário.
            
        Returns:
            Dict[str, Any]: Resultado da operação.
        """
        try:
            self.supabase.table('cart_items')\
                .delete()\
                .eq('user_id', user_id)\
                .execute()
            
            return {'success': True, 'message': 'Carrinho limpo'}
        except Exception as e:
            logger.error(f"Erro ao limpar carrinho: {str(e)}", exc_info=True)
            return {'success': False, 'error': 'Erro ao limpar carrinho'}

# Instância global do serviço
cart_service = CartService()
