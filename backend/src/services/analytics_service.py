"""
Service de Analytics RE-EDUCA Store.

Gerencia analytics e métricas incluindo:
- Analytics de vendas por período
- Métricas de usuários e engajamento
- Análise de produtos e categorias
- Comparações temporais
- KPIs e dashboards
"""
import logging
from typing import Dict, Any, List
from datetime import datetime, timedelta
from config.database import supabase_client
from collections import defaultdict

logger = logging.getLogger(__name__)

class AnalyticsService:
    """
    Service para analytics e métricas do admin.
    
    Processa dados para gerar insights e relatórios.
    """
    
    def __init__(self):
        """Inicializa o serviço de analytics."""
        self.db = supabase_client
    
    def get_sales_analytics(self, period: str = 'month') -> Dict[str, Any]:
        """
        Retorna analytics de vendas por período.
        
        Args:
            period (str): Período (today, week, month, quarter, year).
            
        Returns:
            Dict[str, Any]: Métricas de vendas, conversão e produtos top.
        """
        try:
            start_date, end_date = self._get_date_range(period)
            
            # Buscar pedidos do período
            orders_result = self.db._make_request("GET", 'orders').select('*').gte('created_at', start_date).lte('created_at', end_date).execute()
            
            if not orders_result.data:
                return self._get_empty_sales_analytics(period)
            
            orders = orders_result.data
            
            # Calcular métricas gerais
            total_revenue = sum(order.get('total', 0) for order in orders if order.get('status') in ['paid', 'completed'])
            total_orders = len(orders)
            completed_orders = len([o for o in orders if o.get('status') in ['paid', 'completed']])
            pending_orders = len([o for o in orders if o.get('status') == 'pending'])
            cancelled_orders = len([o for o in orders if o.get('status') == 'cancelled'])
            
            # Ticket médio
            average_ticket = total_revenue / completed_orders if completed_orders > 0 else 0
            
            # Taxa de conversão (considerando carrinho abandonado)
            conversion_rate = (completed_orders / total_orders * 100) if total_orders > 0 else 0
            
            # Análise temporal
            sales_by_day = self._group_sales_by_day(orders, start_date, end_date)
            
            # Top produtos vendidos
            top_products = self._get_top_products_sold(start_date, end_date)
            
            # Comparação com período anterior
            previous_period_data = self._get_previous_period_comparison(period)
            
            return {
                'period': period,
                'start_date': start_date,
                'end_date': end_date,
                'metrics': {
                    'total_revenue': round(total_revenue, 2),
                    'total_orders': total_orders,
                    'completed_orders': completed_orders,
                    'pending_orders': pending_orders,
                    'cancelled_orders': cancelled_orders,
                    'average_ticket': round(average_ticket, 2),
                    'conversion_rate': round(conversion_rate, 2)
                },
                'sales_by_day': sales_by_day,
                'top_products': top_products,
                'comparison': previous_period_data
            }
        except Exception as e:
            logger.error(f"Erro ao buscar analytics de vendas: {str(e)}")
            return self._get_empty_sales_analytics(period)
    
    def get_users_analytics(self, period: str = 'month') -> Dict[str, Any]:
        """Retorna analytics de usuários por período"""
        try:
            start_date, end_date = self._get_date_range(period)
            
            # Buscar todos os usuários
            all_users_result = self.db._make_request("GET", 'users').select('*').execute()
            
            # Buscar novos usuários do período
            new_users_result = self.db._make_request("GET", 'users').select('*').gte('created_at', start_date).lte('created_at', end_date).execute()
            
            # Buscar atividades do período
            activities_result = self.db._make_request("GET", 'user_activities').select('*').gte('created_at', start_date).lte('created_at', end_date).execute()
            
            total_users = len(all_users_result.data) if all_users_result.data else 0
            new_users = len(new_users_result.data) if new_users_result.data else 0
            active_users = len(set(act.get('user_id') for act in activities_result.data)) if activities_result.data else 0
            
            # Taxa de retenção (usuários ativos / total)
            retention_rate = (active_users / total_users * 100) if total_users > 0 else 0
            
            # Usuários por dia
            users_by_day = self._group_users_by_day(new_users_result.data if new_users_result.data else [], start_date, end_date)
            
            # Usuários mais ativos
            top_active_users = self._get_top_active_users(activities_result.data if activities_result.data else [])
            
            # Distribuição por role
            roles_distribution = self._get_users_by_role(all_users_result.data if all_users_result.data else [])
            
            return {
                'period': period,
                'start_date': start_date,
                'end_date': end_date,
                'metrics': {
                    'total_users': total_users,
                    'new_users': new_users,
                    'active_users': active_users,
                    'retention_rate': round(retention_rate, 2)
                },
                'users_by_day': users_by_day,
                'top_active_users': top_active_users,
                'roles_distribution': roles_distribution
            }
        except Exception as e:
            logger.error(f"Erro ao buscar analytics de usuários: {str(e)}")
            return self._get_empty_users_analytics(period)
    
    def get_products_analytics(self, period: str = 'month') -> Dict[str, Any]:
        """Retorna analytics de produtos por período"""
        try:
            start_date, end_date = self._get_date_range(period)
            
            # Buscar todos os produtos
            products_result = self.db._make_request("GET", 'products').select('*').execute()
            
            # Buscar itens vendidos no período
            orders_result = self.db._make_request("GET", 'orders').select('id').gte('created_at', start_date).lte('created_at', end_date).eq('status', 'completed').execute()
            order_ids = [o['id'] for o in orders_result.data] if orders_result.data else []
            
            order_items = []
            if order_ids:
                items_result = self.db._make_request("GET", 'order_items').select('*').in_('order_id', order_ids).execute()
                order_items = items_result.data if items_result.data else []
            
            # Produtos mais vendidos
            product_sales = defaultdict(lambda: {'quantity': 0, 'revenue': 0})
            for item in order_items:
                product_id = item.get('product_id')
                quantity = item.get('quantity', 0)
                price = item.get('price', 0)
                
                product_sales[product_id]['quantity'] += quantity
                product_sales[product_id]['revenue'] += price * quantity
            
            # Top 10 produtos
            top_products = []
            for product_id, sales in sorted(product_sales.items(), key=lambda x: x[1]['revenue'], reverse=True)[:10]:
                product = next((p for p in products_result.data if p['id'] == product_id), None) if products_result.data else None
                if product:
                    top_products.append({
                        'id': product_id,
                        'name': product.get('name', 'Produto'),
                        'quantity_sold': sales['quantity'],
                        'revenue': round(sales['revenue'], 2),
                        'category': product.get('category', 'Sem categoria')
                    })
            
            # Produtos com baixo estoque
            low_stock_products = []
            if products_result.data:
                for product in products_result.data:
                    stock = product.get('stock_quantity', 0)
                    if stock < 10 and product.get('is_active', True):
                        low_stock_products.append({
                            'id': product['id'],
                            'name': product.get('name', 'Produto'),
                            'stock': stock,
                            'category': product.get('category', 'Sem categoria')
                        })
            
            # Vendas por categoria
            category_sales = self._group_sales_by_category(order_items, products_result.data if products_result.data else [])
            
            total_products = len(products_result.data) if products_result.data else 0
            active_products = len([p for p in products_result.data if p.get('is_active', True)]) if products_result.data else 0
            out_of_stock = len([p for p in products_result.data if p.get('stock_quantity', 0) == 0]) if products_result.data else 0
            
            return {
                'period': period,
                'start_date': start_date,
                'end_date': end_date,
                'metrics': {
                    'total_products': total_products,
                    'active_products': active_products,
                    'out_of_stock': out_of_stock,
                    'low_stock': len(low_stock_products)
                },
                'top_products': top_products,
                'low_stock_products': low_stock_products[:10],
                'category_sales': category_sales
            }
        except Exception as e:
            logger.error(f"Erro ao buscar analytics de produtos: {str(e)}")
            return self._get_empty_products_analytics(period)
    
    def _get_date_range(self, period: str) -> tuple:
        """Retorna range de datas baseado no período"""
        end_date = datetime.now()
        
        if period == 'today':
            start_date = end_date.replace(hour=0, minute=0, second=0, microsecond=0)
        elif period == 'week':
            start_date = end_date - timedelta(days=7)
        elif period == 'month':
            start_date = end_date - timedelta(days=30)
        elif period == 'quarter':
            start_date = end_date - timedelta(days=90)
        elif period == 'year':
            start_date = end_date - timedelta(days=365)
        else:
            start_date = end_date - timedelta(days=30)
        
        return start_date.isoformat(), end_date.isoformat()
    
    def _group_sales_by_day(self, orders: List[Dict], start_date: str, end_date: str) -> List[Dict[str, Any]]:
        """Agrupa vendas por dia"""
        try:
            daily_sales = defaultdict(lambda: {'date': '', 'revenue': 0, 'orders': 0})
            
            for order in orders:
                if order.get('status') not in ['paid', 'completed']:
                    continue
                
                order_date = datetime.fromisoformat(order['created_at'].replace('Z', '+00:00')).date()
                date_str = order_date.isoformat()
                
                daily_sales[date_str]['date'] = date_str
                daily_sales[date_str]['revenue'] += order.get('total', 0)
                daily_sales[date_str]['orders'] += 1
            
            # Preencher dias sem vendas
            start = datetime.fromisoformat(start_date.replace('Z', '+00:00')).date()
            end = datetime.fromisoformat(end_date.replace('Z', '+00:00')).date()
            current = start
            
            while current <= end:
                date_str = current.isoformat()
                if date_str not in daily_sales:
                    daily_sales[date_str] = {'date': date_str, 'revenue': 0, 'orders': 0}
                current += timedelta(days=1)
            
            return sorted([{'date': k, 'revenue': round(v['revenue'], 2), 'orders': v['orders']} 
                          for k, v in daily_sales.items()], key=lambda x: x['date'])
        except Exception as e:
            logger.error(f"Erro ao agrupar vendas por dia: {str(e)}")
            return []
    
    def _group_users_by_day(self, users: List[Dict], start_date: str, end_date: str) -> List[Dict[str, Any]]:
        """Agrupa novos usuários por dia"""
        try:
            daily_users = defaultdict(int)
            
            for user in users:
                user_date = datetime.fromisoformat(user['created_at'].replace('Z', '+00:00')).date().isoformat()
                daily_users[user_date] += 1
            
            # Preencher dias sem novos usuários
            start = datetime.fromisoformat(start_date.replace('Z', '+00:00')).date()
            end = datetime.fromisoformat(end_date.replace('Z', '+00:00')).date()
            current = start
            
            while current <= end:
                date_str = current.isoformat()
                if date_str not in daily_users:
                    daily_users[date_str] = 0
                current += timedelta(days=1)
            
            return sorted([{'date': k, 'count': v} for k, v in daily_users.items()], key=lambda x: x['date'])
        except Exception as e:
            logger.error(f"Erro ao agrupar usuários por dia: {str(e)}")
            return []
    
    def _get_top_products_sold(self, start_date: str, end_date: str, limit: int = 5) -> List[Dict[str, Any]]:
        """Retorna top produtos vendidos no período"""
        try:
            orders_result = self.db._make_request("GET", 'orders').select('id').gte('created_at', start_date).lte('created_at', end_date).eq('status', 'completed').execute()
            
            if not orders_result.data:
                return []
            
            order_ids = [o['id'] for o in orders_result.data]
            items_result = self.db._make_request("GET", 'order_items').select('product_id, quantity, price').in_('order_id', order_ids).execute()
            
            if not items_result.data:
                return []
            
            # Agregar por produto
            product_totals = defaultdict(lambda: {'quantity': 0, 'revenue': 0})
            for item in items_result.data:
                product_id = item.get('product_id')
                product_totals[product_id]['quantity'] += item.get('quantity', 0)
                product_totals[product_id]['revenue'] += item.get('quantity', 0) * item.get('price', 0)
            
            # Buscar nomes dos produtos
            top_products = []
            for product_id, totals in sorted(product_totals.items(), key=lambda x: x[1]['revenue'], reverse=True)[:limit]:
                product_result = self.db._make_request("GET", 'products').select('name, category').eq('id', product_id).execute()
                
                product_name = 'Produto'
                category = 'Sem categoria'
                if product_result.data:
                    product_name = product_result.data[0].get('name', 'Produto')
                    category = product_result.data[0].get('category', 'Sem categoria')
                
                top_products.append({
                    'id': product_id,
                    'name': product_name,
                    'category': category,
                    'quantity': totals['quantity'],
                    'revenue': round(totals['revenue'], 2)
                })
            
            return top_products
        except Exception as e:
            logger.error(f"Erro ao buscar top produtos: {str(e)}")
            return []
    
    def _get_top_active_users(self, activities: List[Dict], limit: int = 10) -> List[Dict[str, Any]]:
        """Retorna usuários mais ativos"""
        try:
            user_activity_count = defaultdict(int)
            
            for activity in activities:
                user_id = activity.get('user_id')
                user_activity_count[user_id] += 1
            
            # Buscar informações dos top usuários
            top_users = []
            for user_id, count in sorted(user_activity_count.items(), key=lambda x: x[1], reverse=True)[:limit]:
                user_result = self.db._make_request("GET", 'users').select('name, email').eq('id', user_id).execute()
                
                if user_result.data:
                    top_users.append({
                        'id': user_id,
                        'name': user_result.data[0].get('name', 'Usuário'),
                        'email': user_result.data[0].get('email', ''),
                        'activity_count': count
                    })
            
            return top_users
        except Exception as e:
            logger.error(f"Erro ao buscar usuários mais ativos: {str(e)}")
            return []
    
    def _get_users_by_role(self, users: List[Dict]) -> Dict[str, int]:
        """Retorna distribuição de usuários por role"""
        try:
            role_counts = defaultdict(int)
            
            for user in users:
                role = user.get('role', 'user')
                role_counts[role] += 1
            
            return dict(role_counts)
        except Exception as e:
            logger.error(f"Erro ao agrupar usuários por role: {str(e)}")
            return {}
    
    def _group_sales_by_category(self, order_items: List[Dict], products: List[Dict]) -> List[Dict[str, Any]]:
        """Agrupa vendas por categoria"""
        try:
            # Criar mapa de produtos
            products_map = {p['id']: p for p in products}
            
            category_sales = defaultdict(lambda: {'quantity': 0, 'revenue': 0})
            
            for item in order_items:
                product_id = item.get('product_id')
                product = products_map.get(product_id)
                
                if product:
                    category = product.get('category', 'Sem categoria')
                    category_sales[category]['quantity'] += item.get('quantity', 0)
                    category_sales[category]['revenue'] += item.get('quantity', 0) * item.get('price', 0)
            
            return [
                {
                    'category': category,
                    'quantity': sales['quantity'],
                    'revenue': round(sales['revenue'], 2)
                }
                for category, sales in sorted(category_sales.items(), key=lambda x: x[1]['revenue'], reverse=True)
            ]
        except Exception as e:
            logger.error(f"Erro ao agrupar vendas por categoria: {str(e)}")
            return []
    
    def _get_previous_period_comparison(self, period: str) -> Dict[str, Any]:
        """Compara com período anterior"""
        try:
            # Obter datas do período anterior
            current_start, current_end = self._get_date_range(period)
            
            # Calcular período anterior
            current_start_dt = datetime.fromisoformat(current_start.replace('Z', '+00:00'))
            current_end_dt = datetime.fromisoformat(current_end.replace('Z', '+00:00'))
            period_length = (current_end_dt - current_start_dt).days
            
            previous_start = (current_start_dt - timedelta(days=period_length)).isoformat()
            previous_end = current_start
            
            # Buscar dados do período anterior
            previous_orders = self.db._make_request("GET", 'orders').select('*').gte('created_at', previous_start).lt('created_at', previous_end).execute()
            
            previous_revenue = 0
            previous_orders_count = 0
            
            if previous_orders.data:
                previous_revenue = sum(o.get('total', 0) for o in previous_orders.data if o.get('status') in ['paid', 'completed'])
                previous_orders_count = len([o for o in previous_orders.data if o.get('status') in ['paid', 'completed']])
            
            # Buscar dados do período atual
            current_orders = self.db._make_request("GET", 'orders').select('*').gte('created_at', current_start).lte('created_at', current_end).execute()
            
            current_revenue = 0
            current_orders_count = 0
            
            if current_orders.data:
                current_revenue = sum(o.get('total', 0) for o in current_orders.data if o.get('status') in ['paid', 'completed'])
                current_orders_count = len([o for o in current_orders.data if o.get('status') in ['paid', 'completed']])
            
            # Calcular variações
            revenue_change = ((current_revenue - previous_revenue) / previous_revenue * 100) if previous_revenue > 0 else 0
            orders_change = ((current_orders_count - previous_orders_count) / previous_orders_count * 100) if previous_orders_count > 0 else 0
            
            return {
                'previous_revenue': round(previous_revenue, 2),
                'current_revenue': round(current_revenue, 2),
                'revenue_change_percent': round(revenue_change, 2),
                'previous_orders': previous_orders_count,
                'current_orders': current_orders_count,
                'orders_change_percent': round(orders_change, 2)
            }
        except Exception as e:
            logger.error(f"Erro ao comparar períodos: {str(e)}")
            return {
                'previous_revenue': 0,
                'current_revenue': 0,
                'revenue_change_percent': 0,
                'previous_orders': 0,
                'current_orders': 0,
                'orders_change_percent': 0
            }
    
    def _get_empty_sales_analytics(self, period: str) -> Dict[str, Any]:
        """Retorna analytics de vendas vazio"""
        start_date, end_date = self._get_date_range(period)
        return {
            'period': period,
            'start_date': start_date,
            'end_date': end_date,
            'metrics': {
                'total_revenue': 0,
                'total_orders': 0,
                'completed_orders': 0,
                'pending_orders': 0,
                'cancelled_orders': 0,
                'average_ticket': 0,
                'conversion_rate': 0
            },
            'sales_by_day': [],
            'top_products': [],
            'comparison': {
                'previous_revenue': 0,
                'current_revenue': 0,
                'revenue_change_percent': 0,
                'previous_orders': 0,
                'current_orders': 0,
                'orders_change_percent': 0
            }
        }
    
    def _get_empty_users_analytics(self, period: str) -> Dict[str, Any]:
        """Retorna analytics de usuários vazio"""
        start_date, end_date = self._get_date_range(period)
        return {
            'period': period,
            'start_date': start_date,
            'end_date': end_date,
            'metrics': {
                'total_users': 0,
                'new_users': 0,
                'active_users': 0,
                'retention_rate': 0
            },
            'users_by_day': [],
            'top_active_users': [],
            'roles_distribution': {}
        }
    
    def _get_empty_products_analytics(self, period: str) -> Dict[str, Any]:
        """Retorna analytics de produtos vazio"""
        start_date, end_date = self._get_date_range(period)
        return {
            'period': period,
            'start_date': start_date,
            'end_date': end_date,
            'metrics': {
                'total_products': 0,
                'active_products': 0,
                'out_of_stock': 0,
                'low_stock': 0
            },
            'top_products': [],
            'low_stock_products': [],
            'category_sales': []
        }
