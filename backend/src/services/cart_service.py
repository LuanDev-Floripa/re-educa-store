"""
Service de Carrinho RE-EDUCA Store
"""
import logging
import sqlite3
from typing import Dict, Any, List
from datetime import datetime
from config.database import supabase_client
from utils.helpers import generate_uuid

logger = logging.getLogger(__name__)

class CartService:
    """Service para operações de carrinho de compras"""
    
    def __init__(self):
        self.db = supabase_client
        if hasattr(self.db, 'db_path'):
            self.db_path = self.db.db_path
        else:
            self.db_path = None
    
    def get_cart(self, user_id: str) -> Dict[str, Any]:
        """Retorna carrinho do usuário"""
        try:
            if self.db_path:
                conn = sqlite3.connect(self.db_path)
                conn.row_factory = sqlite3.Row
                cursor = conn.cursor()
                
                # Buscar itens do carrinho
                cursor.execute("""
                    SELECT c.*, p.name, p.price, p.image_url, p.stock_quantity
                    FROM cart_items c
                    JOIN products p ON c.product_id = p.id
                    WHERE c.user_id = ? AND p.is_active = 1
                    ORDER BY c.created_at DESC
                """, (user_id,))
                
                rows = cursor.fetchall()
                items = []
                total = 0
                
                for row in rows:
                    item = dict(row)
                    item_total = item['quantity'] * item['price']
                    item['total'] = item_total
                    total += item_total
                    items.append(item)
                
                conn.close()
                
                return {
                    'items': items,
                    'total': round(total, 2),
                    'item_count': len(items)
                }
            else:
                # Supabase
                result = self.db._make_request("GET", 'cart_items').select('*, products(name, price, image_url, stock_quantity)').eq('user_id', user_id).execute()
                
                items = []
                total = 0
                
                if result.data:
                    for item in result.data:
                        product = item.get('products', {})
                        item_total = item['quantity'] * product.get('price', 0)
                        items.append({
                            'id': item['id'],
                            'product_id': item['product_id'],
                            'quantity': item['quantity'],
                            'name': product.get('name', 'Produto'),
                            'price': product.get('price', 0),
                            'image_url': product.get('image_url', ''),
                            'stock_quantity': product.get('stock_quantity', 0),
                            'total': item_total
                        })
                        total += item_total
                
                return {
                    'items': items,
                    'total': round(total, 2),
                    'item_count': len(items)
                }
        except Exception as e:
            logger.error(f"Erro ao buscar carrinho: {str(e)}")
            return {'items': [], 'total': 0, 'item_count': 0}
    
    def add_to_cart(self, user_id: str, product_id: str, quantity: int = 1) -> Dict[str, Any]:
        """Adiciona produto ao carrinho"""
        try:
            if quantity <= 0:
                return {'success': False, 'error': 'Quantidade inválida'}
            
            if self.db_path:
                conn = sqlite3.connect(self.db_path)
                cursor = conn.cursor()
                
                # Verificar estoque
                cursor.execute("SELECT stock_quantity FROM products WHERE id = ? AND is_active = 1", (product_id,))
                row = cursor.fetchone()
                
                if not row:
                    conn.close()
                    return {'success': False, 'error': 'Produto não encontrado'}
                
                if row[0] < quantity:
                    conn.close()
                    return {'success': False, 'error': 'Estoque insuficiente'}
                
                # Verificar se já existe no carrinho
                cursor.execute("SELECT id, quantity FROM cart_items WHERE user_id = ? AND product_id = ?", (user_id, product_id))
                existing = cursor.fetchone()
                
                if existing:
                    # Atualizar quantidade
                    new_quantity = existing[1] + quantity
                    if row[0] < new_quantity:
                        conn.close()
                        return {'success': False, 'error': 'Estoque insuficiente para esta quantidade'}
                    
                    cursor.execute("UPDATE cart_items SET quantity = ?, updated_at = ? WHERE id = ?",
                                 (new_quantity, datetime.now().isoformat(), existing[0]))
                else:
                    # Inserir novo item
                    cart_item_id = generate_uuid()
                    cursor.execute("""
                        INSERT INTO cart_items (id, user_id, product_id, quantity, created_at, updated_at)
                        VALUES (?, ?, ?, ?, ?, ?)
                    """, (cart_item_id, user_id, product_id, quantity, datetime.now().isoformat(), datetime.now().isoformat()))
                
                conn.commit()
                conn.close()
                
                return {'success': True, 'message': 'Produto adicionado ao carrinho'}
            else:
                # Supabase
                # Verificar estoque
                product = self.db._make_request("GET", 'products').select('stock_quantity').eq('id', product_id).eq('is_active', True).execute()
                
                if not product.data:
                    return {'success': False, 'error': 'Produto não encontrado'}
                
                if product.data[0]['stock_quantity'] < quantity:
                    return {'success': False, 'error': 'Estoque insuficiente'}
                
                # Verificar se já existe
                existing = self.db._make_request("GET", 'cart_items').select('*').eq('user_id', user_id).eq('product_id', product_id).execute()
                
                if existing.data:
                    # Atualizar
                    new_quantity = existing.data[0]['quantity'] + quantity
                    if product.data[0]['stock_quantity'] < new_quantity:
                        return {'success': False, 'error': 'Estoque insuficiente para esta quantidade'}
                    
                    self.db._make_request("GET", 'cart_items').update({'quantity': new_quantity, 'updated_at': datetime.now().isoformat()}).eq('id', existing.data[0]['id']).execute()
                else:
                    # Inserir
                    self.db._make_request("GET", 'cart_items').insert({
                        'id': generate_uuid(),
                        'user_id': user_id,
                        'product_id': product_id,
                        'quantity': quantity
                    }).execute()
                
                return {'success': True, 'message': 'Produto adicionado ao carrinho'}
        except Exception as e:
            logger.error(f"Erro ao adicionar ao carrinho: {str(e)}")
            return {'success': False, 'error': 'Erro ao adicionar ao carrinho'}
    
    def update_cart_item(self, user_id: str, item_id: str, quantity: int) -> Dict[str, Any]:
        """Atualiza quantidade de item no carrinho"""
        try:
            if quantity <= 0:
                return self.remove_from_cart(user_id, item_id)
            
            if self.db_path:
                conn = sqlite3.connect(self.db_path)
                cursor = conn.cursor()
                
                # Buscar item e verificar estoque
                cursor.execute("""
                    SELECT c.product_id, p.stock_quantity
                    FROM cart_items c
                    JOIN products p ON c.product_id = p.id
                    WHERE c.id = ? AND c.user_id = ?
                """, (item_id, user_id))
                
                row = cursor.fetchone()
                
                if not row:
                    conn.close()
                    return {'success': False, 'error': 'Item não encontrado'}
                
                if row[1] < quantity:
                    conn.close()
                    return {'success': False, 'error': 'Estoque insuficiente'}
                
                # Atualizar
                cursor.execute("UPDATE cart_items SET quantity = ?, updated_at = ? WHERE id = ? AND user_id = ?",
                             (quantity, datetime.now().isoformat(), item_id, user_id))
                
                conn.commit()
                conn.close()
                
                return {'success': True, 'message': 'Carrinho atualizado'}
            else:
                # Supabase
                item = self.db._make_request("GET", 'cart_items').select('product_id').eq('id', item_id).eq('user_id', user_id).execute()
                
                if not item.data:
                    return {'success': False, 'error': 'Item não encontrado'}
                
                product = self.db._make_request("GET", 'products').select('stock_quantity').eq('id', item.data[0]['product_id']).execute()
                
                if not product.data or product.data[0]['stock_quantity'] < quantity:
                    return {'success': False, 'error': 'Estoque insuficiente'}
                
                self.db._make_request("GET", 'cart_items').update({'quantity': quantity, 'updated_at': datetime.now().isoformat()}).eq('id', item_id).eq('user_id', user_id).execute()
                
                return {'success': True, 'message': 'Carrinho atualizado'}
        except Exception as e:
            logger.error(f"Erro ao atualizar carrinho: {str(e)}")
            return {'success': False, 'error': 'Erro ao atualizar carrinho'}
    
    def remove_from_cart(self, user_id: str, item_id: str) -> Dict[str, Any]:
        """Remove item do carrinho"""
        try:
            if self.db_path:
                conn = sqlite3.connect(self.db_path)
                cursor = conn.cursor()
                
                cursor.execute("DELETE FROM cart_items WHERE id = ? AND user_id = ?", (item_id, user_id))
                
                conn.commit()
                conn.close()
                
                return {'success': True, 'message': 'Item removido do carrinho'}
            else:
                # Supabase
                self.db._make_request("GET", 'cart_items').delete().eq('id', item_id).eq('user_id', user_id).execute()
                
                return {'success': True, 'message': 'Item removido do carrinho'}
        except Exception as e:
            logger.error(f"Erro ao remover do carrinho: {str(e)}")
            return {'success': False, 'error': 'Erro ao remover do carrinho'}
    
    def clear_cart(self, user_id: str) -> Dict[str, Any]:
        """Limpa carrinho do usuário"""
        try:
            if self.db_path:
                conn = sqlite3.connect(self.db_path)
                cursor = conn.cursor()
                
                cursor.execute("DELETE FROM cart_items WHERE user_id = ?", (user_id,))
                
                conn.commit()
                conn.close()
                
                return {'success': True, 'message': 'Carrinho limpo'}
            else:
                # Supabase
                self.db._make_request("GET", 'cart_items').delete().eq('user_id', user_id).execute()
                
                return {'success': True, 'message': 'Carrinho limpo'}
        except Exception as e:
            logger.error(f"Erro ao limpar carrinho: {str(e)}")
            return {'success': False, 'error': 'Erro ao limpar carrinho'}
