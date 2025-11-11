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
from datetime import datetime
from typing import Any, Dict, List, Optional

from repositories.health_repository import HealthRepository
from repositories.order_repository import OrderRepository
from repositories.user_repository import UserRepository
from services.base_service import BaseService

logger = logging.getLogger(__name__)


class UserService(BaseService):
    """
    Service para operações de usuários.

    Herda de BaseService para padronização e centraliza lógica de negócio
    relacionada a usuários. Utiliza repositórios para acesso a dados.
    """

    def __init__(self):
        """Inicializa o serviço de usuários."""
        super().__init__()
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
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
            # Deixar Exception genérico tratar abaixo
        except Exception as e:
            return self._handle_error(e, f"Erro ao buscar usuário {user_id}")

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
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
        except Exception as e:
            logger.error(f"Erro ao buscar usuário por email {email}: {str(e)}", exc_info=True)
            return None

    def get_user_goals(self, user_id: str, active_only: bool = True) -> List[Dict[str, Any]]:
        """
        Busca objetivos (goals) do usuário.

        Args:
            user_id: ID do usuário
            active_only: Se True, retorna apenas metas ativas

        Returns:
            Lista de objetivos do usuário
        """
        try:
            from repositories.goal_repository import GoalRepository
            goal_repo = GoalRepository()
            
            if active_only:
                goals = goal_repo.find_active_by_user(user_id)
            else:
                goals = goal_repo.find_by_user(user_id)
            
            return goals if goals else []
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            return []
        except Exception as e:
            logger.error(f"Erro ao buscar objetivos do usuário {user_id}: {str(e)}", exc_info=True)
            return []

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
            restricted_fields = ["id", "email", "password", "created_at"]
            update_data = {k: v for k, v in profile_data.items() if k not in restricted_fields}

            updated_user = self.user_repo.update_profile(user_id, update_data)

            if updated_user:
                # Limpa cache
                self.user_repo.clear_cache(f"users:id:{user_id}")
                return {"success": True, "user": updated_user}
            else:
                return {"success": False, "error": "Erro ao atualizar perfil"}

        except Exception as e:
            logger.error(f"Erro ao atualizar perfil do usuário {user_id}: {str(e)}")
            return {"success": False, "error": "Erro interno do servidor"}

    def get_user_activities(
        self, user_id: str, page: int = 1, per_page: int = 20, activity_type: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Retorna atividades do usuário com paginação.

        Utiliza UserRepository para buscar atividades com suporte a paginação.

        Args:
            user_id: ID do usuário
            page: Número da página
            per_page: Itens por página
            activity_type: Filtro opcional por tipo

        Returns:
            Dict com atividades e paginação
        """
        try:
            return self.user_repo.get_user_activities(user_id, page, per_page, activity_type)
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
        except Exception as e:
            logger.error(f"Erro ao buscar atividades do usuário {user_id}: {str(e)}", exc_info=True)
            return {"activities": [], "pagination": {"page": page, "per_page": per_page, "total": 0, "pages": 0}}

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
            # Busca dados de saúde
            health_data = {
                "imc_history": self.health_repo.get_imc_history(user_id, page=1, per_page=100),
                "calories_history": self.health_repo.get_calorie_history(user_id, page=1, per_page=100),
                "exercise_entries": self.health_repo.get_exercise_entries(user_id, page=1, per_page=100),
            }

            # Busca pedidos recentes
            orders_data = self.order_repo.find_by_user(user_id, page=1, per_page=50)

            # Calcula estatísticas
            total_orders = orders_data.get("pagination", {}).get("total", 0)
            total_exercises = len(health_data["exercise_entries"])

            # Calcula progresso de IMC
            imc_trend = "stable"
            if health_data["imc_history"].get("calculations"):
                recent_imc = health_data["imc_history"]["calculations"][:2]
                if len(recent_imc) == 2:
                    if recent_imc[0]["imc"] < recent_imc[1]["imc"]:
                        imc_trend = "down"
                    elif recent_imc[0]["imc"] > recent_imc[1]["imc"]:
                        imc_trend = "up"

            return {
                "user_id": user_id,
                "period_days": period_days,
                "statistics": {
                    "total_orders": total_orders,
                    "total_exercises": total_exercises,
                    "active_days": self._calculate_active_days(health_data, period_days),
                    "imc_trend": imc_trend,
                },
                "health": health_data,
                "orders": orders_data.get("orders", [])[:10],  # Últimos 10
                "generated_at": datetime.now().isoformat(),
            }

        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
        except Exception as e:
            logger.error(f"Erro ao buscar analytics do usuário {user_id}: {str(e)}", exc_info=True)
            return {"error": "Erro interno do servidor"}

    def get_user_achievements(self, user_id: str, limit: int = 10) -> List[Dict[str, Any]]:
        """
        Retorna conquistas do usuário.
        
        Sistema de conquistas baseado em dados reais do usuário, incluindo
        compras, exercícios e registros de saúde.

        Args:
            user_id: ID do usuário
            limit: Limite de conquistas a retornar

        Returns:
            Lista de conquistas
        """
        try:
            achievements = []

            # 1. Conquistas de Compras
            orders_data = self.order_repo.find_by_user(user_id, page=1, per_page=100)
            total_orders = orders_data.get("pagination", {}).get("total", 0)
            
            if total_orders > 0:
                achievements.append({
                    "id": "first_order",
                    "title": "Primeira Compra",
                    "description": "Realizou a primeira compra",
                    "icon": "shopping",
                    "unlocked_at": datetime.now().isoformat(),
                    "rarity": "common"
                })
            
            if total_orders >= 5:
                achievements.append({
                    "id": "regular_customer",
                    "title": "Cliente Fiel",
                    "description": "Realizou 5 compras",
                    "icon": "star",
                    "unlocked_at": datetime.now().isoformat(),
                    "rarity": "uncommon"
                })
            
            if total_orders >= 10:
                achievements.append({
                    "id": "vip_customer",
                    "title": "Cliente VIP",
                    "description": "Realizou 10 compras",
                    "icon": "crown",
                    "unlocked_at": datetime.now().isoformat(),
                    "rarity": "rare"
                })

            # 2. Conquistas de Exercícios
            exercises = self.health_repo.get_exercise_entries(user_id, page=1, per_page=100)
            total_exercises = len(exercises) if exercises else 0
            
            if total_exercises >= 10:
                achievements.append({
                    "id": "exercise_master",
                    "title": "Mestre dos Exercícios",
                    "description": "Completou 10 exercícios",
                    "icon": "dumbbell",
                    "unlocked_at": datetime.now().isoformat(),
                    "rarity": "common"
                })
            
            if total_exercises >= 50:
                achievements.append({
                    "id": "fitness_enthusiast",
                    "title": "Entusiasta do Fitness",
                    "description": "Completou 50 exercícios",
                    "icon": "trophy",
                    "unlocked_at": datetime.now().isoformat(),
                    "rarity": "uncommon"
                })
            
            if total_exercises >= 100:
                achievements.append({
                    "id": "fitness_legend",
                    "title": "Lenda do Fitness",
                    "description": "Completou 100 exercícios",
                    "icon": "medal",
                    "unlocked_at": datetime.now().isoformat(),
                    "rarity": "epic"
                })

            # 3. Conquistas de Saúde
            imc_history = self.health_repo.get_imc_history(user_id, page=1, per_page=10)
            if imc_history and len(imc_history) >= 5:
                achievements.append({
                    "id": "health_tracker",
                    "title": "Rastreador de Saúde",
                    "description": "Registrou 5 cálculos de IMC",
                    "icon": "heart",
                    "unlocked_at": datetime.now().isoformat(),
                    "rarity": "common"
                })
            
            calorie_history = self.health_repo.get_calorie_history(user_id, page=1, per_page=10)
            if calorie_history and len(calorie_history) >= 10:
                achievements.append({
                    "id": "nutrition_expert",
                    "title": "Especialista em Nutrição",
                    "description": "Registrou 10 cálculos de calorias",
                    "icon": "apple",
                    "unlocked_at": datetime.now().isoformat(),
                    "rarity": "uncommon"
                })

            # 4. Conquistas de Consistência
            # Verifica se usuário tem dados de saúde consistentes
            health_data = self.health_repo.get_health_analytics(user_id, period_days=30)
            if health_data and health_data.get("metrics"):
                achievements.append({
                    "id": "consistent_tracker",
                    "title": "Rastreador Consistente",
                    "description": "Manteve dados de saúde por 30 dias",
                    "icon": "calendar",
                    "unlocked_at": datetime.now().isoformat(),
                    "rarity": "uncommon"
                })

            # Ordena por raridade e data de desbloqueio
            rarity_order = {"common": 1, "uncommon": 2, "rare": 3, "epic": 4, "legendary": 5}
            achievements.sort(key=lambda x: (rarity_order.get(x.get("rarity", "common"), 1), x.get("unlocked_at", "")), reverse=True)

            return achievements[:limit]

        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação ao buscar conquistas: {str(e)}")
            return []
        except Exception as e:
            logger.error(f"Erro ao buscar conquistas do usuário {user_id}: {str(e)}", exc_info=True)
            return []

    def _calculate_active_days(self, health_data: Dict[str, Any], period_days: int) -> int:
        """Calcula dias ativos baseado em dados de saúde"""
        try:
            exercise_dates = set()
            for entry in health_data.get("exercise_entries", []):
                if entry.get("entry_date"):
                    exercise_dates.add(entry["entry_date"])
            return len(exercise_dates)
        except (ValueError, KeyError, TypeError) as e:
            self.logger.debug(f"Erro ao calcular dias ativos (esperado em alguns casos): {str(e)}")
            return 0
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
        except Exception as e:
            self.logger.warning(f"Erro inesperado ao calcular dias ativos: {str(e)}")
            return 0
