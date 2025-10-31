"""
Service administrativo RE-EDUCA Store.

Gerencia operações administrativas incluindo:
- Dashboard com estatísticas gerais
- Gestão de usuários e permissões
- Analytics de vendas e pedidos
- Relatórios e métricas
"""
import logging
from typing import Dict, Any, List
from datetime import datetime, timedelta
from config.database import supabase_client

logger = logging.getLogger(__name__)

class AdminService:
    """
    Service para operações administrativas.
    
    Centraliza lógica de negócio para painel administrativo.
    """
    
    def __init__(self):
        """Inicializa o serviço administrativo."""
        self.supabase = supabase_client
    
    def get_dashboard_stats(self) -> Dict[str, Any]:
        """
        Retorna estatísticas do dashboard admin.
        
        Returns:
            Dict[str, Any]: Métricas de usuários, produtos, pedidos e receita.
        """
        try:
            # Buscar totais
            users_result = self.supabase.table('users').select('id, is_active, created_at').execute()
            products_result = self.supabase.table('products').select('id, is_active').execute()
            orders_result = self.supabase.table('orders').select('id, status, total, created_at').execute()
            
            # Calcular métricas
            total_users = len(users_result.data) if users_result.data else 0
            active_users = len([u for u in users_result.data if u.get('is_active')]) if users_result.data else 0
            new_users_today = len([u for u in users_result.data if u.get('created_at', '').startswith(datetime.now().strftime('%Y-%m-%d'))]) if users_result.data else 0
            
            total_products = len(products_result.data) if products_result.data else 0
            active_products = len([p for p in products_result.data if p.get('is_active')]) if products_result.data else 0
            
            total_orders = len(orders_result.data) if orders_result.data else 0
            pending_orders = len([o for o in orders_result.data if o.get('status') == 'pending']) if orders_result.data else 0
            completed_orders = len([o for o in orders_result.data if o.get('status') in ['paid', 'completed']]) if orders_result.data else 0
            
            # Revenue
            today = datetime.now().strftime('%Y-%m-%d')
            today_orders = [o for o in orders_result.data if o.get('created_at', '').startswith(today)] if orders_result.data else []
            today_revenue = sum(o.get('total', 0) for o in today_orders if o.get('status') in ['paid', 'completed'])
            
            month_start = datetime.now().replace(day=1).strftime('%Y-%m-%d')
            month_orders = [o for o in orders_result.data if o.get('created_at', '') >= month_start] if orders_result.data else []
            month_revenue = sum(o.get('total', 0) for o in month_orders if o.get('status') in ['paid', 'completed'])
            
            return {
                'users': {
                    'total': total_users,
                    'active': active_users,
                    'new': new_users_today
                },
                'products': {
                    'total': total_products,
                    'active': active_products,
                    'featured': 0
                },
                'orders': {
                    'total': total_orders,
                    'pending': pending_orders,
                    'completed': completed_orders
                },
                'revenue': {
                    'today': today_revenue,
                    'month': month_revenue,
                    'growth': 0
                },
                'recent_activity': []
            }
        except Exception as e:
            logger.error(f"Erro ao buscar stats do dashboard: {str(e)}")
            return {
                'users': {'total': 0, 'active': 0, 'new': 0},
                'products': {'total': 0, 'active': 0, 'featured': 0},
                'orders': {'total': 0, 'pending': 0, 'completed': 0},
                'revenue': {'today': 0, 'month': 0, 'growth': 0},
                'recent_activity': []
            }
    
    def get_all_users(self, page: int = 1, per_page: int = 20, search: str = None) -> Dict[str, Any]:
        """Retorna todos os usuários"""
        try:
            query = self.supabase.table('users').select('*')
            
            if search:
                # Para busca, usar filtro ilike em name (pode ser estendido para email)
                query = query.ilike('name', f"%{search}%")
            
            result = query.order('created_at', desc=True).execute()
            
            if result.data:
                # Paginação manual
                start = (page - 1) * per_page
                end = start + per_page
                paginated_data = result.data[start:end]
                
                return {
                    'users': paginated_data,
                    'pagination': {
                        'page': page,
                        'per_page': per_page,
                        'total': len(result.data),
                        'pages': (len(result.data) + per_page - 1) // per_page
                    }
                }
            else:
                return {
                    'users': [],
                    'pagination': {
                        'page': page,
                        'per_page': per_page,
                        'total': 0,
                        'pages': 0
                    }
                }
                
        except Exception as e:
            logger.error(f"Erro ao buscar usuários: {str(e)}")
            return {'error': 'Erro interno do servidor'}
    
    def get_analytics(self, period_days: int = 30) -> Dict[str, Any]:
        """Retorna analytics gerais"""
        try:
            end_date = datetime.now()
            start_date = end_date - timedelta(days=period_days)
            
            # Busca dados do período
            users_result = self.supabase.table('users')\
                .select('created_at')\
                .gte('created_at', start_date.isoformat())\
                .lte('created_at', end_date.isoformat())\
                .execute()
            
            orders_result = self.supabase.table('orders')\
                .select('total, status')\
                .gte('created_at', start_date.isoformat())\
                .lte('created_at', end_date.isoformat())\
                .execute()
            
            # Calcula métricas
            total_users = len(users_result.data)
            total_orders = len(orders_result.data)
            total_revenue = sum(order.get('total', 0) for order in orders_result.data if order.get('status') == 'paid')
            
            return {
                'period': {
                    'start_date': start_date.isoformat(),
                    'end_date': end_date.isoformat(),
                    'days': period_days
                },
                'metrics': {
                    'total_users': total_users,
                    'total_orders': total_orders,
                    'total_revenue': total_revenue,
                    'average_order_value': total_revenue / total_orders if total_orders > 0 else 0
                }
            }
            
        except Exception as e:
            logger.error(f"Erro ao gerar analytics: {str(e)}")
            return {'error': 'Erro interno do servidor'}
    
    def get_all_orders(self, page: int = 1, per_page: int = 20, status: str = None) -> Dict[str, Any]:
        """Retorna todos os pedidos"""
        try:
            query = self.supabase.table('orders').select('*, users(name, email)')
            
            if status:
                query = query.eq('status', status)
            
            result = query.order('created_at', desc=True).execute()
            
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