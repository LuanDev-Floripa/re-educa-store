"""
Repositório de Planos de Treino RE-EDUCA Store.

Gerencia acesso a dados de planos de treino e exercícios de planos.
"""

import logging
from typing import Any, Dict, List, Optional

from repositories.base_repository import BaseRepository

logger = logging.getLogger(__name__)


class WorkoutPlanRepository(BaseRepository):
    """
    Repositório para operações com planos de treino.

    Tabelas:
    - workout_plans
    - workout_plan_exercises
    """

    def __init__(self):
        """Inicializa o repositório de planos de treino."""
        super().__init__("workout_plans")

    def create_plan(self, plan_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Cria um novo plano de treino.

        Args:
            plan_data: Dados do plano

        Returns:
            Plano criado ou None
        """
        try:
            return self.create(plan_data)
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            self.logger.error(f"Erro ao criar plano de treino: {str(e)}", exc_info=True)
            return None

    def update_plan(self, plan_id: str, plan_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Atualiza um plano de treino.

        Args:
            plan_id: ID do plano
            plan_data: Dados a atualizar

        Returns:
            Plano atualizado ou None
        """
        try:
            return self.update(plan_id, plan_data)
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            self.logger.error(f"Erro ao atualizar plano de treino: {str(e)}", exc_info=True)
            return None

    def delete_plan(self, plan_id: str) -> bool:
        """
        Deleta um plano de treino.

        Args:
            plan_id: ID do plano

        Returns:
            True se deletado, False caso contrário
        """
        try:
            # Primeiro remove exercícios do plano
            self.delete_plan_exercises(plan_id)
            # Depois deleta o plano
            return self.delete(plan_id)
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            self.logger.error(f"Erro ao deletar plano de treino: {str(e)}", exc_info=True)
            return False

    def add_exercise_to_plan(
        self,
        plan_id: str,
        exercise_id: str,
        day_of_week: int,
        sets: Optional[int] = None,
        reps: Optional[int] = None,
        weight: Optional[float] = None,
        rest_seconds: Optional[int] = None,
        order: Optional[int] = None,
    ) -> Optional[Dict[str, Any]]:
        """
        Adiciona um exercício a um plano.

        Args:
            plan_id: ID do plano
            exercise_id: ID do exercício
            day_of_week: Dia da semana (1-7)
            sets: Número de séries
            reps: Número de repetições
            weight: Peso (opcional)
            rest_seconds: Tempo de descanso (opcional)
            order: Ordem do exercício no dia

        Returns:
            Exercício adicionado ou None
        """
        try:
            exercise_data = {
                "plan_id": plan_id,
                "exercise_id": exercise_id,
                "day_of_week": day_of_week,
                "sets": sets,
                "reps": reps,
                "weight": weight,
                "rest_seconds": rest_seconds,
                "order": order or 1,
            }

            result = self.db.table("workout_plan_exercises").insert(exercise_data).execute()

            if result.data and len(result.data) > 0:
                return result.data[0]
            return None
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            self.logger.error(f"Erro ao adicionar exercício ao plano: {str(e)}", exc_info=True)
            return None

    def get_plan_exercises(self, plan_id: str, day_of_week: Optional[int] = None) -> List[Dict[str, Any]]:
        """
        Busca exercícios de um plano.

        Args:
            plan_id: ID do plano
            day_of_week: Dia da semana (opcional)

        Returns:
            Lista de exercícios do plano
        """
        try:
            query = self.db.table("workout_plan_exercises").select("*, exercises(*)").eq("plan_id", plan_id)

            if day_of_week:
                query = query.eq("day_of_week", day_of_week)

            query = query.order("day_of_week").order("order")

            result = query.execute()
            return result.data if result.data else []
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            self.logger.error(f"Erro ao buscar exercícios do plano: {str(e)}", exc_info=True)
            return []

    def delete_plan_exercises(self, plan_id: str) -> bool:
        """
        Remove todos os exercícios de um plano.

        Args:
            plan_id: ID do plano

        Returns:
            True se deletado, False caso contrário
        """
        try:
            (self.db.table("workout_plan_exercises").delete().eq("plan_id", plan_id).execute())
            return True
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            self.logger.error(f"Erro ao deletar exercícios do plano: {str(e)}", exc_info=True)
            return False

    def find_by_user(self, user_id: str, limit: Optional[int] = None) -> List[Dict[str, Any]]:
        """
        Busca planos de treino de um usuário.

        Args:
            user_id: ID do usuário
            limit: Limite de resultados

        Returns:
            Lista de planos de treino
        """
        try:
            return self.find_all(filters={"user_id": user_id}, order_by="created_at", desc=True, limit=limit)
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            self.logger.error(f"Erro ao buscar planos do usuário: {str(e)}", exc_info=True)
            return []
