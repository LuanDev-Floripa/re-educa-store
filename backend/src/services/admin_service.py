"""
Service administrativo RE-EDUCA Store.

Gerencia operações administrativas incluindo:
- Dashboard com estatísticas gerais
- Gestão de usuários e permissões
- Analytics de vendas e pedidos
- Relatórios e métricas
"""

import logging
from datetime import datetime, timedelta
from typing import Any, Dict

from config.database import supabase_client
from repositories.order_repository import OrderRepository
from repositories.product_repository import ProductRepository
from repositories.user_repository import UserRepository
from services.base_service import BaseService

logger = logging.getLogger(__name__)


class AdminService(BaseService):
    """
    Service para operações administrativas.

    Herda de BaseService para padronização e centralização de lógica comum.
    Centraliza lógica de negócio para painel administrativo.
    """

    def __init__(self):
        """Inicializa o serviço administrativo."""
        super().__init__()
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
            # Buscar todos os usuários (apenas campos necessários)
            all_users = self.user_repo.find_all(order_by="created_at", desc=True)

            # Buscar todos os produtos
            all_products = self.product_repo.find_all(order_by="created_at", desc=True)

            # Buscar todos os pedidos
            all_orders = self.order_repo.find_all(order_by="created_at", desc=True)

            # Calcular métricas
            total_users = len(all_users) if all_users else 0
            active_users = len([u for u in all_users if u.get("is_active")]) if all_users else 0
            today_str = datetime.now().strftime("%Y-%m-%d")
            new_users_today = (
                len([u for u in all_users if u.get("created_at", "").startswith(today_str)]) if all_users else 0
            )

            total_products = len(all_products) if all_products else 0
            active_products = len([p for p in all_products if p.get("is_active")]) if all_products else 0
            featured_products = len([p for p in all_products if p.get("is_featured", False)]) if all_products else 0

            total_orders = len(all_orders) if all_orders else 0
            pending_orders = len([o for o in all_orders if o.get("status") == "pending"]) if all_orders else 0
            completed_orders = (
                len([o for o in all_orders if o.get("status") in ["paid", "completed"]]) if all_orders else 0
            )

            # Revenue
            today = datetime.now().strftime("%Y-%m-%d")
            today_orders = [o for o in all_orders if o.get("created_at", "").startswith(today)] if all_orders else []
            today_revenue = sum(o.get("total", 0) for o in today_orders if o.get("status") in ["paid", "completed"])

            month_start = datetime.now().replace(day=1).strftime("%Y-%m-%d")
            month_orders = [o for o in all_orders if o.get("created_at", "") >= month_start] if all_orders else []
            month_revenue = sum(o.get("total", 0) for o in month_orders if o.get("status") in ["paid", "completed"])

            # Calcular crescimento de receita (comparar mês atual com mês anterior)
            previous_month_start = (datetime.now().replace(day=1) - timedelta(days=1)).replace(day=1).strftime("%Y-%m-%d")
            previous_month_end = datetime.now().replace(day=1).strftime("%Y-%m-%d")
            previous_month_orders = (
                [o for o in all_orders if previous_month_start <= o.get("created_at", "") < previous_month_end]
                if all_orders
                else []
            )
            previous_month_revenue = sum(
                o.get("total", 0) for o in previous_month_orders if o.get("status") in ["paid", "completed"]
            )
            revenue_growth = (
                ((month_revenue - previous_month_revenue) / previous_month_revenue * 100)
                if previous_month_revenue > 0
                else (100 if month_revenue > 0 else 0)
            )

            # Recent activity: últimas 10 atividades (pedidos, novos usuários)
            recent_activity = []
            # Adicionar pedidos recentes
            recent_orders = sorted(
                [o for o in all_orders if o.get("created_at")],
                key=lambda x: x.get("created_at", ""),
                reverse=True,
            )[:5]
            for order in recent_orders:
                recent_activity.append(
                    {
                        "type": "order",
                        "id": order.get("id"),
                        "description": f"Novo pedido #{order.get('id', 'N/A')} - R$ {order.get('total', 0):.2f}",
                        "timestamp": order.get("created_at"),
                    }
                )
            # Adicionar novos usuários recentes
            recent_users = sorted(
                [u for u in all_users if u.get("created_at")],
                key=lambda x: x.get("created_at", ""),
                reverse=True,
            )[:5]
            for user in recent_users:
                recent_activity.append(
                    {
                        "type": "user",
                        "id": user.get("id"),
                        "description": f"Novo usuário: {user.get('name', user.get('email', 'N/A'))}",
                        "timestamp": user.get("created_at"),
                    }
                )
            # Ordenar por timestamp e pegar os 10 mais recentes
            recent_activity = sorted(recent_activity, key=lambda x: x.get("timestamp", ""), reverse=True)[:10]

            return {
                "users": {"total": total_users, "active": active_users, "new": new_users_today},
                "products": {"total": total_products, "active": active_products, "featured": featured_products},
                "orders": {"total": total_orders, "pending": pending_orders, "completed": completed_orders},
                "revenue": {"today": today_revenue, "month": month_revenue, "growth": round(revenue_growth, 2)},
                "recent_activity": recent_activity,
            }
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            logger.error(f"Erro ao buscar stats do dashboard: {str(e)}", exc_info=True)
            return {
                "users": {"total": 0, "active": 0, "new": 0},
                "products": {"total": 0, "active": 0, "featured": 0},
                "orders": {"total": 0, "pending": 0, "completed": 0},
                "revenue": {"today": 0, "month": 0, "growth": 0},
                "recent_activity": [],
            }

    def get_all_users(self, page: int = 1, per_page: int = 20, search: str = None) -> Dict[str, Any]:
        """Retorna todos os usuários"""
        try:
            if search:
                search_result = self.user_repo.search(search, page=page, per_page=per_page)
                return {
                    "users": search_result.get("users", []),
                    "pagination": search_result.get(
                        "pagination", {"page": page, "per_page": per_page, "total": 0, "pages": 0}
                    ),
                }
            else:
                users = self.user_repo.find_all(
                    limit=per_page, offset=(page - 1) * per_page, order_by="created_at", desc=True
                )
                total = self.user_repo.count()

                return {
                    "users": users or [],
                    "pagination": {
                        "page": page,
                        "per_page": per_page,
                        "total": total,
                        "pages": (total + per_page - 1) // per_page if total > 0 else 0,
                    },
                }

        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            logger.error(f"Erro ao buscar usuários: {str(e)}", exc_info=True)
            return {"error": "Erro interno do servidor"}

    def get_analytics(self, period_days: int = 30) -> Dict[str, Any]:
        """Retorna analytics gerais"""
        try:
            end_date = datetime.now()
            start_date = end_date - timedelta(days=period_days)

            # Busca dados do período
            # Para users: filtrar por data
            all_users = self.user_repo.find_all()
            period_users = (
                [u for u in all_users if start_date.isoformat() <= u.get("created_at", "") <= end_date.isoformat()]
                if all_users
                else []
            )

            # Para orders: usar OrderRepository
            all_orders = self.order_repo.find_all()
            period_orders = (
                [o for o in all_orders if start_date.isoformat() <= o.get("created_at", "") <= end_date.isoformat()]
                if all_orders
                else []
            )

            # Calcula métricas
            total_users = len(period_users)
            total_orders = len(period_orders)
            total_revenue = sum(order.get("total", 0) for order in period_orders if order.get("status") == "paid")

            return {
                "period": {"start_date": start_date.isoformat(), "end_date": end_date.isoformat(), "days": period_days},
                "metrics": {
                    "total_users": total_users,
                    "total_orders": total_orders,
                    "total_revenue": total_revenue,
                    "average_order_value": total_revenue / total_orders if total_orders > 0 else 0,
                },
            }

        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            logger.error(f"Erro ao gerar analytics: {str(e)}", exc_info=True)
            return {"error": "Erro interno do servidor"}

    def get_all_orders(self, page: int = 1, per_page: int = 20, status: str = None) -> Dict[str, Any]:
        """Retorna todos os pedidos"""
        try:
            filters = {}
            if status:
                filters["status"] = status

            # Usa método que inclui informações de usuário
            orders = self.order_repo.get_orders_with_user_info(
                filters=filters, limit=per_page, offset=(page - 1) * per_page
            )

            total = self.order_repo.count(filters=filters)

            return {
                "orders": orders or [],
                "pagination": {
                    "page": page,
                    "per_page": per_page,
                    "total": total,
                    "pages": (total + per_page - 1) // per_page if total > 0 else 0,
                },
            }

        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            logger.error(f"Erro ao buscar pedidos: {str(e)}", exc_info=True)
            return {"error": "Erro interno do servidor"}
