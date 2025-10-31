"""
Service de pedidos RE-EDUCA Store.

Gerencia fluxo completo de pedidos incluindo:
- Criação de pedidos a partir do carrinho
- Gestão de status do pedido
- Histórico de pedidos do usuário
- Validação de estoque
- Integração com pagamentos
"""
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime
from config.database import supabase_client
from utils.helpers import generate_uuid

logger = logging.getLogger(__name__)

class OrderService:
    """
    Service para operações de pedidos.
    
    Implementa lógica de negócio para gerenciamento de pedidos.
    """
    
    def __init__(self):
        """Inicializa o serviço de pedidos."""
        self.supabase = supabase_client
    
    def get_user_orders(self, user_id: str, page: int = 1, per_page: int = 20) -> Dict[str, Any]:
        """
        Retorna pedidos do usuário com paginação.
        
        Args:
            user_id (str): ID do usuário.
            page (int): Página (padrão: 1).
            per_page (int): Itens por página (padrão: 20).
            
        Returns:
            Dict[str, Any]: Pedidos paginados ou erro.
        """
        try:
            result = self.supabase.table('orders')\
                .select('*')\
                .eq('user_id', user_id)\
                .order('created_at', desc=True)\
                .execute()
            
            if result.data:
                # Paginação manual
                start = (page - 1) * per_page
                end = start + per_page
                paginated_data = result.data[start:end]
                
                return {
                    'orders': paginated_data,
                    'pagination': {
                        'page': page,
                        'per_page': per_page,
                        'total': len(result.data),
                        'pages': (len(result.data) + per_page - 1) // per_page
                    }
                }
            else:
                return {
                    'orders': [],
                    'pagination': {
                        'page': page,
                        'per_page': per_page,
                        'total': 0,
                        'pages': 0
                    }
                }
                
        except Exception as e:
            logger.error(f"Erro ao buscar pedidos: {str(e)}")
            return {'error': 'Erro interno do servidor'}
    
    def get_order(self, order_id: str, user_id: str) -> Optional[Dict[str, Any]]:
        """Retorna detalhes de um pedido"""
        try:
            result = self.supabase.table('orders')\
                .select('*')\
                .eq('id', order_id)\
                .eq('user_id', user_id)\
                .execute()
            
            if result.data:
                return result.data[0]
            return None
            
        except Exception as e:
            logger.error(f"Erro ao buscar pedido: {str(e)}")
            return None
    
    def create_order(self, user_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """Cria novo pedido"""
        try:
            # Calcula total
            total = sum(item['price'] * item['quantity'] for item in data['products'])
            
            order_data = {
                'id': generate_uuid(),
                'user_id': user_id,
                'products': data['products'],
                'total': total,
                'status': 'pending',
                'shipping_address': data['shipping_address'],
                'payment_method': data.get('payment_method', 'credit_card'),
                'created_at': datetime.now().isoformat()
            }
            
            result = self.supabase.table('orders').insert(order_data).execute()
            
            if result.data:
                return {'success': True, 'order': result.data[0]}
            else:
                return {'success': False, 'error': 'Erro ao criar pedido'}
                
        except Exception as e:
            logger.error(f"Erro ao criar pedido: {str(e)}")
            return {'success': False, 'error': 'Erro interno do servidor'}
    
    def cancel_order(self, order_id: str, user_id: str) -> Dict[str, Any]:
        """Cancela um pedido"""
        try:
            result = self.supabase.table('orders')\
                .update({'status': 'cancelled'})\
                .eq('id', order_id)\
                .eq('user_id', user_id)\
                .execute()
            
            if result.data:
                return {'success': True}
            else:
                return {'success': False, 'error': 'Pedido não encontrado'}
                
        except Exception as e:
            logger.error(f"Erro ao cancelar pedido: {str(e)}")
            return {'success': False, 'error': 'Erro interno do servidor'}