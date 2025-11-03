# -*- coding: utf-8 -*-
"""
Service de Usuários RE-EDUCA Store.

Gerencia operações relacionadas a usuários incluindo:
- Busca e atualização de perfis
- Histórico de atividades
- Preferências e configurações
- Analytics do usuário
"""
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
from repositories.user_repository import UserRepository
from repositories.order_repository import OrderRepository
from repositories.health_repository import HealthRepository

logger = logging.getLogger(__name__)


class UserService:
    """
    Service para operações de usuários.

    Centraliza lógica de negócio relacionada a usuários.
    Usa repositórios para acesso a dados (Sprint 7).
    """

    def __init__(self):
        """Inicializa o serviço de usuários."""
        self.user_repo = UserRepository()
        self.order_repo = OrderRepository()
        self.health_repo = HealthRepository()

    def get_user_by_id(self, user_id: str) -> Optional[Dict[str, Any]]:
        """
        Busca usuário por ID.

        Args:
            user_id: ID do usuário

        Returns:
            Dict com dados do usuário ou None
        """
        try:
            return self.user_repo.find_by_id(user_id)
        except Exception as e:
            logger.error(f"Erro ao buscar usuário {user_id}: {str(e)}")
            return None

    def get_user_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        """
        Busca usuário por email.

        Args:
            email: Email do usuário

        Returns:
            Dict com dados do usuário ou None
        """
        try:
            return self.user_repo.find_by_email(email)
        except Exception as e:
            logger.error(f"Erro ao buscar usuário por email {email}: {str(e)}")
            return None

    def update_user_profile(self, user_id: str, profile_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Atualiza perfil do usuário.

        Args:
            user_id: ID do usuário
            profile_data: Dados a serem atualizados

        Returns:
            Dict com success e user atualizado ou erro
        """
        try:
            # Remove campos que não devem ser atualizados diretamente
            restricted_fields = ['id', 'email', 'password', 'created_at']
            update_data = {k: v for k, v in profile_data.items() if k not in restricted_fields}

            updated_user = self.user_repo.update_profile(user_id, update_data)

            if updated_user:
                # Limpa cache
                self.user_repo.clear_cache(f"users:id:{user_id}")
                return {'success': True, 'user': updated_user}
            else:
                return {'success': False, 'error': 'Erro ao atualizar perfil'}

        except Exception as e:
            logger.error(f"Erro ao atualizar perfil do usuário {user_id}: {str(e)}")
            return {'success': False, 'error': 'Erro interno do servidor'}

    def get_user_activities(
        self,
        user_id: str,
        page: int = 1,
        per_page: int = 20,
        activity_type: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Retorna atividades do usuário com paginação.

        CORRIGIDO: Agora usa UserRepository.

        Args:
            user_id: ID do usuário
            page: Número da página
            per_page: Itens por página
            activity_type: Filtro opcional por tipo

        Returns:
            Dict com atividades e paginação
        """
        try:
            # ✅ Usa repositório
            return self.user_repo.get_user_activities(user_id, page, per_page, activity_type)
        except Exception as e:
            logger.error(f"Erro ao buscar atividades do usuário {user_id}: {str(e)}")
            return {
                'activities': [],
                'pagination': {
                    'page': page,
                    'per_page': per_page,
                    'total': 0,
                    'pages': 0
                }
            }

    def get_user_analytics(self, user_id: str, period_days: int = 30) -> Dict[str, Any]:
        """
        Retorna analytics consolidado do usuário.

        Args:
            user_id: ID do usuário
            period_days: Período em dias para análise (padrão: 30)

        Returns:
            Dict com analytics do usuário
        """
        try:
            start_date = (datetime.now() - timedelta(days=period_days)).isoformat()

            # Busca dados de saúde
            health_data = {
                'imc_history': self.health_repo.get_imc_history(user_id, page=1, per_page=100),
                'calories_history': self.health_repo.get_calorie_history(user_id, page=1, per_page=100),
                'exercise_entries': self.health_repo.get_exercise_entries(user_id, page=1, per_page=100)
            }

            # Busca pedidos recentes
            orders_data = self.order_repo.find_by_user(user_id, page=1, per_page=50)

            # Calcula estatísticas
            total_orders = orders_data.get('pagination', {}).get('total', 0)
            total_exercises = len(health_data['exercise_entries'])

            # Calcula progresso de IMC
            imc_trend = 'stable'
            if health_data['imc_history'].get('calculations'):
                recent_imc = health_data['imc_history']['calculations'][:2]
                if len(recent_imc) == 2:
                    if recent_imc[0]['imc'] < recent_imc[1]['imc']:
                        imc_trend = 'down'
                    elif recent_imc[0]['imc'] > recent_imc[1]['imc']:
                        imc_trend = 'up'

            return {
                'user_id': user_id,
                'period_days': period_days,
                'statistics': {
                    'total_orders': total_orders,
                    'total_exercises': total_exercises,
                    'active_days': self._calculate_active_days(health_data, period_days),
                    'imc_trend': imc_trend
                },
                'health': health_data,
                'orders': orders_data.get('orders', [])[:10],  # Últimos 10
                'generated_at': datetime.now().isoformat()
            }

        except Exception as e:
            logger.error(f"Erro ao buscar analytics do usuário {user_id}: {str(e)}")
            return {'error': 'Erro interno do servidor'}

    def get_user_achievements(self, user_id: str, limit: int = 10) -> List[Dict[str, Any]]:
        """
        Retorna conquistas do usuário.

        Args:
            user_id: ID do usuário
            limit: Limite de conquistas a retornar

        Returns:
            Lista de conquistas
        """
        try:
            # Por enquanto, retorna conquistas mockadas
            # TODO: Implementar sistema de conquistas completo
            achievements = []

            # Verifica conquistas baseadas em dados
            orders = self.order_repo.find_by_user(user_id, page=1, per_page=1)
            if orders.get('pagination', {}).get('total', 0) > 0:
                achievements.append({
                    'id': 'first_order',
                    'title': 'Primeira Compra',
                    'description': 'Realizou a primeira compra',
                    'icon': 'shopping',
                    'unlocked_at': datetime.now().isoformat()
                })

            exercises = self.health_repo.get_exercise_entries(user_id, page=1, per_page=10)
            if len(exercises) >= 10:
                achievements.append({
                    'id': 'exercise_master',
                    'title': 'Mestre dos Exercícios',
                    'description': 'Completou 10 exercícios',
                    'icon': 'dumbbell',
                    'unlocked_at': datetime.now().isoformat()
                })

            return achievements[:limit]

        except Exception as e:
            logger.error(f"Erro ao buscar conquistas do usuário {user_id}: {str(e)}")
            return []

    def _calculate_active_days(self, health_data: Dict[str, Any], period_days: int) -> int:
        """Calcula dias ativos baseado em dados de saúde"""
        try:
            exercise_dates = set()
            for entry in health_data.get('exercise_entries', []):
                if entry.get('entry_date'):
                    exercise_dates.add(entry['entry_date'])
            return len(exercise_dates)
        except Exception:
            return 0
