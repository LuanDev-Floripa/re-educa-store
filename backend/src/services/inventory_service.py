"""
Serviço de Estoque RE-EDUCA Store
"""
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
from config.database import supabase_client
from decimal import Decimal

logger = logging.getLogger(__name__)

class InventoryService:
    def __init__(self):
        self.supabase = supabase_client
    
    def get_product_stock(self, product_id: str) -> Dict[str, Any]:
        """Obtém estoque de um produto"""
        try:
            result = self.supabase.table('products').select('stock_quantity, name').eq('id', product_id).execute()
            
            if not result.data:
                return {'success': False, 'error': 'Produto não encontrado'}
            
            product = result.data[0]
            
            return {
                'success': True,
                'product_id': product_id,
                'product_name': product['name'],
                'stock_quantity': product['stock_quantity'],
                'is_available': product['stock_quantity'] > 0
            }
            
        except Exception as e:
            logger.error(f"Erro ao buscar estoque: {str(e)}")
            return {'success': False, 'error': str(e)}
    
    def update_stock(self, product_id: str, quantity_change: int, operation: str = 'subtract') -> Dict[str, Any]:
        """Atualiza estoque de um produto"""
        try:
            # Busca estoque atual
            current_result = self.supabase.table('products').select('stock_quantity, name').eq('id', product_id).execute()
            
            if not current_result.data:
                return {'success': False, 'error': 'Produto não encontrado'}
            
            current_stock = current_result.data[0]['stock_quantity']
            product_name = current_result.data[0]['name']
            
            # Calcula novo estoque
            if operation == 'subtract':
                new_stock = current_stock - quantity_change
            elif operation == 'add':
                new_stock = current_stock + quantity_change
            elif operation == 'set':
                new_stock = quantity_change
            else:
                return {'success': False, 'error': 'Operação inválida'}
            
            # Verifica se não fica negativo
            if new_stock < 0:
                return {'success': False, 'error': 'Estoque insuficiente'}
            
            # Atualiza estoque
            self.supabase.table('products').update({
                'stock_quantity': new_stock,
                'updated_at': datetime.now().isoformat()
            }).eq('id', product_id).execute()
            
            # Registra movimento de estoque
            self._log_stock_movement(product_id, product_name, current_stock, new_stock, operation, quantity_change)
            
            return {
                'success': True,
                'product_id': product_id,
                'product_name': product_name,
                'previous_stock': current_stock,
                'new_stock': new_stock,
                'quantity_change': quantity_change,
                'operation': operation
            }
            
        except Exception as e:
            logger.error(f"Erro ao atualizar estoque: {str(e)}")
            return {'success': False, 'error': str(e)}
    
    def reserve_stock(self, product_id: str, quantity: int, order_id: str = None) -> Dict[str, Any]:
        """Reserva estoque para um pedido"""
        try:
            # Verifica se há estoque suficiente
            stock_result = self.get_product_stock(product_id)
            if not stock_result['success']:
                return stock_result
            
            if stock_result['stock_quantity'] < quantity:
                return {'success': False, 'error': 'Estoque insuficiente'}
            
            # Cria reserva
            reservation_data = {
                'product_id': product_id,
                'quantity': quantity,
                'order_id': order_id,
                'status': 'reserved',
                'expires_at': (datetime.now() + timedelta(hours=24)).isoformat(),  # Reserva por 24h
                'created_at': datetime.now().isoformat()
            }
            
            result = self.supabase.table('stock_reservations').insert(reservation_data).execute()
            
            if result.data:
                # Atualiza estoque disponível
                self.update_stock(product_id, quantity, 'subtract')
                
                return {
                    'success': True,
                    'reservation_id': result.data[0]['id'],
                    'product_id': product_id,
                    'quantity': quantity,
                    'expires_at': reservation_data['expires_at']
                }
            else:
                return {'success': False, 'error': 'Erro ao criar reserva'}
                
        except Exception as e:
            logger.error(f"Erro ao reservar estoque: {str(e)}")
            return {'success': False, 'error': str(e)}
    
    def confirm_stock_reservation(self, reservation_id: str) -> Dict[str, Any]:
        """Confirma reserva de estoque (converte em venda)"""
        try:
            # Busca reserva
            reservation_result = self.supabase.table('stock_reservations').select('*').eq('id', reservation_id).execute()
            
            if not reservation_result.data:
                return {'success': False, 'error': 'Reserva não encontrada'}
            
            reservation = reservation_result.data[0]
            
            # Verifica se não expirou
            expires_at = datetime.fromisoformat(reservation['expires_at'])
            if datetime.now() > expires_at:
                return {'success': False, 'error': 'Reserva expirada'}
            
            # Atualiza status da reserva
            self.supabase.table('stock_reservations').update({
                'status': 'confirmed',
                'confirmed_at': datetime.now().isoformat()
            }).eq('id', reservation_id).execute()
            
            return {
                'success': True,
                'reservation_id': reservation_id,
                'product_id': reservation['product_id'],
                'quantity': reservation['quantity']
            }
            
        except Exception as e:
            logger.error(f"Erro ao confirmar reserva: {str(e)}")
            return {'success': False, 'error': str(e)}
    
    def cancel_stock_reservation(self, reservation_id: str) -> Dict[str, Any]:
        """Cancela reserva de estoque"""
        try:
            # Busca reserva
            reservation_result = self.supabase.table('stock_reservations').select('*').eq('id', reservation_id).execute()
            
            if not reservation_result.data:
                return {'success': False, 'error': 'Reserva não encontrada'}
            
            reservation = reservation_result.data[0]
            
            # Atualiza status da reserva
            self.supabase.table('stock_reservations').update({
                'status': 'cancelled',
                'cancelled_at': datetime.now().isoformat()
            }).eq('id', reservation_id).execute()
            
            # Devolve estoque
            self.update_stock(reservation['product_id'], reservation['quantity'], 'add')
            
            return {
                'success': True,
                'reservation_id': reservation_id,
                'product_id': reservation['product_id'],
                'quantity': reservation['quantity']
            }
            
        except Exception as e:
            logger.error(f"Erro ao cancelar reserva: {str(e)}")
            return {'success': False, 'error': str(e)}
    
    def get_low_stock_products(self, threshold: int = 10) -> Dict[str, Any]:
        """Busca produtos com estoque baixo"""
        try:
            result = self.supabase.table('products').select('*').lt('stock_quantity', threshold).eq('is_active', True).execute()
            
            return {
                'success': True,
                'products': result.data,
                'threshold': threshold,
                'count': len(result.data)
            }
            
        except Exception as e:
            logger.error(f"Erro ao buscar produtos com estoque baixo: {str(e)}")
            return {'success': False, 'error': str(e)}
    
    def get_stock_movements(self, product_id: str = None, start_date: str = None, 
                          end_date: str = None, page: int = 1, limit: int = 20) -> Dict[str, Any]:
        """Busca movimentações de estoque"""
        try:
            query = self.supabase.table('stock_movements').select('*')
            
            if product_id:
                query = query.eq('product_id', product_id)
            
            if start_date:
                query = query.gte('created_at', start_date)
            
            if end_date:
                query = query.lte('created_at', end_date)
            
            # Paginação
            offset = (page - 1) * limit
            query = query.range(offset, offset + limit - 1).order('created_at', desc=True)
            
            result = query.execute()
            
            return {
                'success': True,
                'movements': result.data,
                'page': page,
                'limit': limit
            }
            
        except Exception as e:
            logger.error(f"Erro ao buscar movimentações: {str(e)}")
            return {'success': False, 'error': str(e)}
    
    def get_inventory_report(self, start_date: str = None, end_date: str = None) -> Dict[str, Any]:
        """Gera relatório de estoque"""
        try:
            # Produtos com estoque baixo
            low_stock = self.get_low_stock_products()
            
            # Total de produtos
            total_products_result = self.supabase.table('products').select('id', count='exact').eq('is_active', True).execute()
            total_products = total_products_result.count or 0
            
            # Produtos sem estoque
            out_of_stock_result = self.supabase.table('products').select('id', count='exact').eq('stock_quantity', 0).eq('is_active', True).execute()
            out_of_stock = out_of_stock_result.count or 0
            
            # Produtos com estoque
            in_stock = total_products - out_of_stock
            
            # Valor total do estoque
            products_result = self.supabase.table('products').select('price, stock_quantity').eq('is_active', True).execute()
            total_value = sum(
                (product.get('price', 0) or 0) * (product.get('stock_quantity', 0) or 0)
                for product in products_result.data
            )
            
            return {
                'success': True,
                'report': {
                    'total_products': total_products,
                    'in_stock': in_stock,
                    'out_of_stock': out_of_stock,
                    'low_stock_count': low_stock.get('count', 0),
                    'low_stock_products': low_stock.get('products', []),
                    'total_inventory_value': total_value,
                    'generated_at': datetime.now().isoformat()
                }
            }
            
        except Exception as e:
            logger.error(f"Erro ao gerar relatório: {str(e)}")
            return {'success': False, 'error': str(e)}
    
    def _log_stock_movement(self, product_id: str, product_name: str, previous_stock: int, 
                          new_stock: int, operation: str, quantity: int):
        """Registra movimentação de estoque"""
        try:
            movement_data = {
                'product_id': product_id,
                'product_name': product_name,
                'previous_stock': previous_stock,
                'new_stock': new_stock,
                'quantity_change': quantity,
                'operation': operation,
                'created_at': datetime.now().isoformat()
            }
            
            self.supabase.table('stock_movements').insert(movement_data).execute()
            
        except Exception as e:
            logger.error(f"Erro ao registrar movimentação: {str(e)}")
    
    def cleanup_expired_reservations(self) -> Dict[str, Any]:
        """Limpa reservas expiradas"""
        try:
            now = datetime.now().isoformat()
            
            # Busca reservas expiradas
            expired_result = self.supabase.table('stock_reservations').select('*').lt('expires_at', now).eq('status', 'reserved').execute()
            
            cancelled_count = 0
            
            for reservation in expired_result.data:
                # Cancela reserva
                self.cancel_stock_reservation(reservation['id'])
                cancelled_count += 1
            
            return {
                'success': True,
                'cancelled_reservations': cancelled_count,
                'cleaned_at': now
            }
            
        except Exception as e:
            logger.error(f"Erro ao limpar reservas expiradas: {str(e)}")
            return {'success': False, 'error': str(e)}