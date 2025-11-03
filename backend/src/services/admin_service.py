"""
Service administrativo RE-EDUCA Store.

Gerencia operações administrativas incluindo:
- Dashboard com estatísticas gerais
- Gestão de usuários e permissões
- Analytics de vendas e pedidos
- Relatórios e métricas
"""
import logging
from typing import Dict, Any
from datetime import datetime, timedelta
from config.database import supabase_client
from repositories.user_repository import UserRepository
from repositories.product_repository import ProductRepository
from repositories.order_repository import OrderRepository

logger = logging.getLogger(__name__)


class AdminService:
    """
    Service para operações administrativas.

    Centraliza lógica de negócio para painel administrativo.
    """

    def __init__(self):
        """Inicializa o serviço administrativo."""
        self.supabase = supabase_client
        self.user_repo = UserRepository()
        self.product_repo = ProductRepository()
        self.order_repo = OrderRepository()

    def get_dashboard_stats(self) -> Dict[str, Any]:
        """
        Retorna estatísticas do dashboard admin.

        Returns:
            Dict[str, Any]: Métricas de usuários, produtos, pedidos e receita.
        """
        try:
            # ✅ CORRIGIDO: Usa repositórios
            # Buscar todos os usuários (apenas campos necessários)
            all_users = self.user_repo.find_all(
                order_by='created_at',
                desc=True
            )
            
            # Buscar todos os produtos
            all_products = self.product_repo.find_all(
                order_by='created_at',
                desc=True
            )
            
            # Buscar todos os pedidos
            all_orders = self.order_repo.find_all(
                order_by='created_at',
                desc=True
            )

            # Calcular métricas
            total_users = len(all_users) if all_users else 0
            active_users = (
                len([u for u in all_users if u.get('is_active')])
                if all_users else 0
            )
            today_str = datetime.now().strftime('%Y-%m-%d')
            new_users_today = (
                len([
                    u for u in all_users
                    if u.get('created_at', '').startswith(today_str)
                ]) if all_users else 0
            )

            total_products = len(all_products) if all_products else 0
            active_products = (
                len([p for p in all_products if p.get('is_active')]) if all_products else 0
            )

            total_orders = len(all_orders) if all_orders else 0
            pending_orders = (
                len([o for o in all_orders if o.get('status') == 'pending'])
                if all_orders else 0
            )
            completed_orders = (
                len([o for o in all_orders if o.get('status') in ['paid', 'completed']])
                if all_orders else 0
            )

            # Revenue
            today = datetime.now().strftime('%Y-%m-%d')
            today_orders = (
                [o for o in all_orders if o.get('created_at', '').startswith(today)]
                if all_orders else []
            )
            today_revenue = sum(
                o.get('total', 0) for o in today_orders
                if o.get('status') in ['paid', 'completed']
            )

            month_start = datetime.now().replace(day=1).strftime('%Y-%m-%d')
            month_orders = (
                [o for o in all_orders if o.get('created_at', '') >= month_start]
                if all_orders else []
            )
            month_revenue = sum(
                o.get('total', 0) for o in month_orders
                if o.get('status') in ['paid', 'completed']
            )

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
            # ✅ CORRIGIDO: Usa UserRepository
            if search:
                search_result = self.user_repo.search(search, page=page, per_page=per_page)
                return {
                    'users': search_result.get('users', []),
                    'pagination': search_result.get('pagination', {
                        'page': page,
                        'per_page': per_page,
                        'total': 0,
                        'pages': 0
                    })
                }
            else:
                users = self.user_repo.find_all(
                    limit=per_page,
                    offset=(page - 1) * per_page,
                    order_by='created_at',
                    desc=True
                )
                total = self.user_repo.count()

                return {
                    'users': users or [],
                    'pagination': {
                        'page': page,
                        'per_page': per_page,
                        'total': total,
                        'pages': (total + per_page - 1) // per_page if total > 0 else 0
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

            # ✅ CORRIGIDO: Usa repositórios
            # Busca dados do período
            # Para users: filtrar por data
            all_users = self.user_repo.find_all()
            period_users = [
                u for u in all_users
                if start_date.isoformat() <= u.get('created_at', '') <= end_date.isoformat()
            ] if all_users else []
            
            # Para orders: usar OrderRepository
            all_orders = self.order_repo.find_all()
            period_orders = [
                o for o in all_orders
                if start_date.isoformat() <= o.get('created_at', '') <= end_date.isoformat()
            ] if all_orders else []

            # Calcula métricas
            total_users = len(period_users)
            total_orders = len(period_orders)
            total_revenue = sum(
                order.get('total', 0) for order in period_orders
                if order.get('status') == 'paid'
            )

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
            # ✅ CORRIGIDO: Usa OrderRepository
            filters = {}
            if status:
                filters['status'] = status

            # Usa método que inclui informações de usuário
            orders = self.order_repo.get_orders_with_user_info(
                filters=filters,
                limit=per_page,
                offset=(page - 1) * per_page
            )
            
            total = self.order_repo.count(filters=filters)

            return {
                'orders': orders or [],
                'pagination': {
                    'page': page,
                    'per_page': per_page,
                    'total': total,
                    'pages': (total + per_page - 1) // per_page if total > 0 else 0
                }
            }

        except Exception as e:
            logger.error(f"Erro ao buscar pedidos: {str(e)}")
            return {'error': 'Erro interno do servidor'}
