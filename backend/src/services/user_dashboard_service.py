"""
Service de Dashboard do Usuário RE-EDUCA Store.

Agrega dados de múltiplas fontes para o dashboard incluindo:
- Score de saúde calculado
- Metas semanais e progresso
- Atividades recentes
- Conquistas e badges
- Sumários de treino e nutrição
- Estatísticas rápidas
"""

import logging
from datetime import datetime, timedelta
from typing import Any, Dict, List

from config.database import supabase_client

logger = logging.getLogger(__name__)


class UserDashboardService:
    """
    Service para dados do dashboard do usuário.

    Agrega e processa dados de várias fontes.
    """

    def __init__(self):
        """Inicializa o serviço de dashboard."""
        self.db = supabase_client

    def get_dashboard_data(self, user_id: str) -> Dict[str, Any]:
        """
        Retorna dados completos do dashboard do usuário.

        Args:
            user_id (str): ID do usuário.

        Returns:
            Dict[str, Any]: Dashboard com health_score, metas, atividades, etc.
        """
        try:
            health_score_data = self._calculate_health_score(user_id)
            weekly_goals_data = self._get_weekly_goals(user_id)
            quick_stats_data = self._get_quick_stats(user_id)
            workout_summary_data = self._get_workout_summary(user_id)

            # Formatar metas semanais no formato esperado pelo frontend
            weekly_goals_formatted = {
                "workouts": {
                    "completed": sum(
                        1
                        for g in weekly_goals_data
                        if g.get("title", "").lower().find("exercício") >= 0
                        or g.get("title", "").lower().find("treino") >= 0
                    ),
                    "target": 5,
                },
                "water": {
                    "completed": sum(
                        g.get("progress", 0)
                        for g in weekly_goals_data
                        if g.get("title", "").lower().find("água") >= 0
                        or g.get("title", "").lower().find("hidratação") >= 0
                    )
                    / 7.0,
                    "target": 3.0,
                },
                "sleep": {"completed": 0, "target": 8.0},  # Será calculado com base em dados reais
                "calories": {"completed": workout_summary_data.get("total_calories", 0), "target": 2000},
            }

            # Formatar atividades recentes
            recent_activities = self._get_recent_activities(user_id)
            activities_formatted = [
                {
                    "name": act.get("title", "Atividade"),
                    "time": act.get("timestamp", ""),
                    "type": act.get("type", "general"),
                    "duration": None,
                    "calories": None,
                    "amount": None,
                }
                for act in recent_activities[:5]
            ]

            return {
                "healthScore": health_score_data.get("score", 0),
                "weeklyGoals": weekly_goals_formatted,
                "recentActivities": activities_formatted,
                "achievements": self._get_achievements(user_id),
                "quickStats": {
                    "totalWorkouts": workout_summary_data.get("total_workouts", 0),
                    "totalCalories": workout_summary_data.get("total_calories", 0),
                    "streakDays": quick_stats_data.get("streak_days", 0),
                    "bmi": 0,  # Será calculado separadamente se necessário
                },
            }
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            logger.error(f"Erro ao buscar dashboard do usuário {user_id}: {str(e)}", exc_info=True)
            return self._get_empty_dashboard()

    def _calculate_health_score(self, user_id: str) -> Dict[str, Any]:
        """Calcula score de saúde do usuário"""
        try:
            # Buscar dados do usuário
            user = self.db.get_user_by_id_simple(user_id)
            if not user:
                return {"score": 0, "category": "Iniciante", "color": "gray"}

            # Buscar atividades recentes (últimos 30 dias)
            thirty_days_ago = (datetime.now() - timedelta(days=30)).isoformat()
            activities_list = self.db.get_user_activities(user_id, since=thirty_days_ago)

            # Buscar exercícios completados
            exercises_list = self.db.get_exercise_logs(user_id, since=thirty_days_ago)

            # Calcular score baseado em múltiplos fatores
            score = 50  # Base

            # Fator 1: Frequência de atividades (max +20)
            num_activities = len(activities_list) if activities_list else 0
            score += min(num_activities, 20)

            # Fator 2: Exercícios completados (max +20)
            num_exercises = len(exercises_list) if exercises_list else 0
            score += min(num_exercises * 2, 20)

            # Fator 3: Consistência (max +10)
            if num_activities >= 20:
                score += 10
            elif num_activities >= 10:
                score += 5

            # Limitar entre 0-100
            score = max(0, min(100, score))

            # Determinar categoria
            if score >= 80:
                category = "Atleta"
                color = "green"
            elif score >= 60:
                category = "Avançado"
                color = "blue"
            elif score >= 40:
                category = "Intermediário"
                color = "yellow"
            else:
                category = "Iniciante"
                color = "gray"

            return {"score": score, "category": category, "color": color, "trend": "up" if score >= 50 else "stable"}
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            logger.error(f"Erro ao calcular health score: {str(e)}", exc_info=True)
            return {"score": 0, "category": "Iniciante", "color": "gray", "trend": "stable"}

    def _get_weekly_goals(self, user_id: str) -> List[Dict[str, Any]]:
        """Retorna metas da semana do usuário"""
        try:
            # Buscar metas ativas
            goals_list = self.db.get_user_goals(user_id, is_active=True)

            if not goals_list:
                return self._get_default_goals()

            goals = []
            for goal in goals_list:
                progress = goal.get("progress", 0)
                target = goal.get("target", 100)
                percentage = min(100, (progress / target * 100) if target > 0 else 0)

                goals.append(
                    {
                        "id": goal["id"],
                        "title": goal.get("title", "Meta sem título"),
                        "description": goal.get("description", ""),
                        "progress": progress,
                        "target": target,
                        "percentage": round(percentage, 1),
                        "completed": progress >= target,
                        "icon": goal.get("icon", "target"),
                        "color": goal.get("color", "blue"),
                    }
                )

            return goals[:4]  # Máximo 4 metas principais
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            logger.error(f"Erro ao buscar metas semanais: {str(e)}", exc_info=True)
            return self._get_default_goals()

    def _get_default_goals(self) -> List[Dict[str, Any]]:
        """Retorna metas padrão para usuários sem metas configuradas"""
        return [
            {
                "id": "default-1",
                "title": "Exercícios da Semana",
                "description": "Complete 3 treinos esta semana",
                "progress": 0,
                "target": 3,
                "percentage": 0,
                "completed": False,
                "icon": "dumbbell",
                "color": "blue",
            },
            {
                "id": "default-2",
                "title": "Meta de Hidratação",
                "description": "Beba 2L de água por dia",
                "progress": 0,
                "target": 7,
                "percentage": 0,
                "completed": False,
                "icon": "droplet",
                "color": "cyan",
            },
            {
                "id": "default-3",
                "title": "Registro de Refeições",
                "description": "Registre suas refeições diariamente",
                "progress": 0,
                "target": 7,
                "percentage": 0,
                "completed": False,
                "icon": "utensils",
                "color": "green",
            },
        ]

    def _get_recent_activities(self, user_id: str) -> List[Dict[str, Any]]:
        """Retorna atividades recentes do usuário"""
        try:
            activities_list = self.db.get_user_activities(user_id, limit=10)

            if not activities_list:
                return []

            activities = []
            for activity in activities_list:
                activities.append(
                    {
                        "id": activity["id"],
                        "type": activity.get("activity_type", "general"),
                        "title": activity.get("title", "Atividade"),
                        "description": activity.get("description", ""),
                        "timestamp": activity.get("created_at"),
                        "icon": self._get_activity_icon(activity.get("activity_type", "general")),
                        "color": self._get_activity_color(activity.get("activity_type", "general")),
                    }
                )

            return activities
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            logger.error(f"Erro ao buscar atividades recentes: {str(e)}", exc_info=True)
            return []

    def _get_achievements(self, user_id: str) -> List[Dict[str, Any]]:
        """Retorna conquistas do usuário"""
        try:
            achievements_list = self.db.get_user_achievements(user_id, limit=6)

            if not achievements_list:
                return []

            achievements = []
            for achievement in achievements_list:
                achievements.append(
                    {
                        "id": achievement["id"],
                        "title": achievement.get("title", "Conquista"),
                        "description": achievement.get("description", ""),
                        "icon": achievement.get("icon", "trophy"),
                        "rarity": achievement.get("rarity", "common"),
                        "unlocked_at": achievement.get("unlocked_at"),
                        "points": achievement.get("points", 10),
                    }
                )

            return achievements
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            logger.error(f"Erro ao buscar conquistas: {str(e)}", exc_info=True)
            return []

    def _get_quick_stats(self, user_id: str) -> Dict[str, Any]:
        """Retorna estatísticas rápidas do usuário"""
        try:
            # Buscar pedidos
            orders_list = self.db.get_orders(user_id)
            total_orders = len(orders_list) if orders_list else 0

            # Buscar produtos favoritos
            favorites_list = self.db.get_favorites(user_id)
            total_favorites = len(favorites_list) if favorites_list else 0

            # Buscar reviews
            reviews_list = self.db.get_reviews(user_id)
            total_reviews = len(reviews_list) if reviews_list else 0

            # Calcular dias desde cadastro
            created_at_str = self.db.get_user_created_at(user_id)
            days_active = 0
            if created_at_str:
                created_at = datetime.fromisoformat(created_at_str.replace("Z", "+00:00"))
                days_active = (datetime.now(created_at.tzinfo) - created_at).days

            return {
                "total_orders": total_orders,
                "total_favorites": total_favorites,
                "total_reviews": total_reviews,
                "days_active": days_active,
                "streak_days": self._calculate_streak(user_id),
            }
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            logger.error(f"Erro ao buscar quick stats: {str(e)}", exc_info=True)
            return {"total_orders": 0, "total_favorites": 0, "total_reviews": 0, "days_active": 0, "streak_days": 0}

    def _get_workout_summary(self, user_id: str) -> Dict[str, Any]:
        """Retorna resumo de treinos da semana"""
        try:
            seven_days_ago = (datetime.now() - timedelta(days=7)).isoformat()
            logs_list = self.db.get_exercise_logs(user_id, since=seven_days_ago)

            if not logs_list:
                return {"total_workouts": 0, "total_minutes": 0, "total_calories": 0, "favorite_exercise": None}

            total_workouts = len(logs_list)
            total_minutes = sum(log.get("duration_minutes", 0) for log in logs_list)
            total_calories = sum(log.get("calories_burned", 0) for log in logs_list)

            # Encontrar exercício favorito (mais frequente)
            exercise_counts = {}
            for log in logs_list:
                exercise = log.get("exercise_name", "Desconhecido")
                exercise_counts[exercise] = exercise_counts.get(exercise, 0) + 1

            favorite_exercise = max(exercise_counts.items(), key=lambda x: x[1])[0] if exercise_counts else None

            return {
                "total_workouts": total_workouts,
                "total_minutes": total_minutes,
                "total_calories": total_calories,
                "favorite_exercise": favorite_exercise,
            }
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            logger.error(f"Erro ao buscar resumo de treinos: {str(e)}", exc_info=True)
            return {"total_workouts": 0, "total_minutes": 0, "total_calories": 0, "favorite_exercise": None}

    def _get_nutrition_summary(self, user_id: str) -> Dict[str, Any]:
        """Retorna resumo nutricional do dia"""
        try:
            today = datetime.now().strftime("%Y-%m-%d")
            logs_list = self.db.get_nutrition_logs(user_id, since=today)

            if not logs_list:
                return {"calories": 0, "protein": 0, "carbs": 0, "fat": 0, "water": 0}

            total_calories = sum(log.get("calories", 0) for log in logs_list)
            total_protein = sum(log.get("protein", 0) for log in logs_list)
            total_carbs = sum(log.get("carbs", 0) for log in logs_list)
            total_fat = sum(log.get("fat", 0) for log in logs_list)
            total_water = sum(log.get("water_ml", 0) for log in logs_list)

            return {
                "calories": round(total_calories, 1),
                "protein": round(total_protein, 1),
                "carbs": round(total_carbs, 1),
                "fat": round(total_fat, 1),
                "water": round(total_water / 1000, 1),  # Converter para litros
            }
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            logger.error(f"Erro ao buscar resumo nutricional: {str(e)}", exc_info=True)
            return {"calories": 0, "protein": 0, "carbs": 0, "fat": 0, "water": 0}

    def _calculate_streak(self, user_id: str) -> int:
        """Calcula sequência de dias ativos do usuário"""
        try:
            activities_list = self.db.get_user_activities(user_id)

            if not activities_list:
                return 0

            # Contar dias consecutivos com atividade
            streak = 0
            current_date = datetime.now().date()

            activity_dates = set()
            for activity in activities_list:
                activity_date = datetime.fromisoformat(activity["created_at"].replace("Z", "+00:00")).date()
                activity_dates.add(activity_date)

            # Verificar sequência
            while current_date in activity_dates:
                streak += 1
                current_date -= timedelta(days=1)

            return streak
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            logger.error(f"Erro ao calcular streak: {str(e)}", exc_info=True)
            return 0

    def _get_activity_icon(self, activity_type: str) -> str:
        """Retorna ícone baseado no tipo de atividade"""
        icons = {
            "exercise": "dumbbell",
            "nutrition": "utensils",
            "purchase": "shopping-cart",
            "achievement": "trophy",
            "goal": "target",
            "health": "heart",
            "general": "activity",
        }
        return icons.get(activity_type, "activity")

    def _get_activity_color(self, activity_type: str) -> str:
        """Retorna cor baseada no tipo de atividade"""
        colors = {
            "exercise": "blue",
            "nutrition": "green",
            "purchase": "purple",
            "achievement": "yellow",
            "goal": "orange",
            "health": "red",
            "general": "gray",
        }
        return colors.get(activity_type, "gray")

    def _get_empty_dashboard(self) -> Dict[str, Any]:
        """Retorna dashboard vazio em caso de erro (formato compatível com frontend)"""
        return {
            "healthScore": 0,
            "weeklyGoals": {
                "workouts": {"completed": 0, "target": 5},
                "water": {"completed": 0, "target": 3.0},
                "sleep": {"completed": 0, "target": 8.0},
                "calories": {"completed": 0, "target": 2000},
            },
            "recentActivities": [],
            "achievements": [],
            "quickStats": {"totalWorkouts": 0, "totalCalories": 0, "streakDays": 0, "bmi": 0},
        }
