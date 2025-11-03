"""
Serviço de Exercícios RE-EDUCA Store - Supabase.

Gerencia sistema completo de exercícios incluindo:
- CRUD de exercícios com filtros avançados
- Planos de treino personalizados
- Sessões semanais de treino
- Tracking de progresso
- Logs de exercícios realizados
- Gestão de metas fitness
"""
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
from config.database import supabase_client
from services.base_service import BaseService
from repositories.exercise_repository import ExerciseRepository
from repositories.workout_repository import WorkoutRepository
from repositories.workout_plan_repository import WorkoutPlanRepository

logger = logging.getLogger(__name__)

# ============================================================
# CONSTANTES
# ============================================================

DAYS_OF_WEEK = {
    1: 'Segunda-feira',
    2: 'Terça-feira',
    3: 'Quarta-feira',
    4: 'Quinta-feira',
    5: 'Sexta-feira',
    6: 'Sábado',
    7: 'Domingo'
}

WORKOUT_STATUS = {
    'scheduled': 'Agendado',
    'in_progress': 'Em Progresso',
    'completed': 'Completo',
    'skipped': 'Pulado'
}

WORKOUT_GOALS = {
    'weight_loss': 'Perda de Peso',
    'muscle_gain': 'Ganho de Massa',
    'endurance': 'Resistência',
    'strength': 'Força',
    'general_fitness': 'Condicionamento Geral',
    'flexibility': 'Flexibilidade'
}

DIFFICULTY_LEVELS = ['beginner', 'intermediate', 'advanced']

EXERCISE_CATEGORIES = ['strength', 'cardio', 'flexibility', 'core', 'balance', 'hiit', 'yoga', 'pilates']

MIN_DAY_OF_WEEK = 1

MAX_DAY_OF_WEEK = 7


class ExerciseService(BaseService):
    """
    Service para gerenciar exercícios, planos de treino e sessões semanais.

    CORRIGIDO: Agora usa ExerciseRepository para acesso a dados.

    Fornece métodos para:
    - Buscar e gerenciar exercícios
    - Criar e gerenciar planos de treino
    - Criar e acompanhar sessões de treino semanais
    """

    def __init__(self):
        """Inicializa o service."""
        super().__init__()
        self.exercise_repo = ExerciseRepository()
        self.workout_repo = WorkoutRepository()
        self.plan_repo = WorkoutPlanRepository()

    # ============================================================
    # MÉTODOS PARA EXERCÍCIOS
    # ============================================================

    def get_exercises(self, category: str = None, difficulty: str = None,
                     equipment: str = None, muscle_group: str = None,
                     page: int = 1, limit: int = 20) -> Dict[str, Any]:
        """
        Busca exercícios com filtros do Supabase

        Args:
            category (str, optional): Categoria do exercício
            difficulty (str, optional): Nível de dificuldade
            equipment (str, optional): Equipamento necessário
            muscle_group (str, optional): Grupo muscular trabalhado
            page (int): Número da página (padrão: 1)
            limit (int): Limite de itens por página (padrão: 20, máximo: 100)

        Returns:
            Dict[str, Any]: Dicionário com lista de exercícios e paginação
                - exercises: Lista de exercícios formatados
                - pagination: Informações de paginação
        """
        try:
            # Valida parâmetros
            if page < 1:
                page = 1
            if limit < 1 or limit > 100:
                limit = 20

            # ✅ CORRIGIDO: Usa repositório com filtros
            filters = {}
            if category and category in EXERCISE_CATEGORIES:
                filters['category'] = category
            if difficulty and difficulty in DIFFICULTY_LEVELS:
                filters['difficulty'] = difficulty

            # ✅ CORRIGIDO: Usa ExerciseRepository
            exercises_list = self.exercise_repo.find_all(
                filters=filters,
                order_by='name',
                limit=limit,
                offset=(page - 1) * limit
            )

            # Para filtros complexos (equipment, muscle_group), filtra manualmente
            exercises = exercises_list
            if equipment:
                exercises = [e for e in exercises if equipment in (e.get('equipment') or [])]
            if muscle_group:
                exercises = [e for e in exercises if muscle_group in (e.get('muscle_groups') or [])]

            # Contagem total (aproximada - pode ser melhorada no repositório)
            total_count = len(exercises) if not filters else len(exercises_list)

            # Formatar resposta
            formatted_exercises = []
            for exercise in exercises:
                formatted_exercises.append({
                    'id': exercise.get('id'),
                    'name': exercise.get('name'),
                    'description': exercise.get('description'),
                    'category': exercise.get('category'),
                    'difficulty': exercise.get('difficulty'),
                    'muscle_groups': exercise.get('muscle_groups') or [],
                    'equipment': exercise.get('equipment') or [],
                    'instructions': exercise.get('instructions') or [],
                    'tips': exercise.get('tips') or [],
                    'calories_per_minute': exercise.get('calories_per_minute') or exercise.get('met_value', 0),
                    'duration_minutes': exercise.get('duration_minutes'),
                    'sets': exercise.get('sets'),
                    'reps': exercise.get('reps'),
                    'rest_seconds': exercise.get('rest_seconds', 60),
                    'image_url': exercise.get('image_url'),
                    'video_url': exercise.get('video_url')
                })

            return {
                'exercises': formatted_exercises,
                'pagination': {
                    'page': page,
                    'limit': limit,
                    'total': total_count,
                    'pages': (total_count + limit - 1) // limit if total_count > 0 else 0
                }
            }

        except Exception as e:
            self.logger.error(f"Erro ao buscar exercícios: {e}")
            return {
                'exercises': [],
                'pagination': {
                    'page': page,
                    'limit': limit,
                    'total': 0,
                    'pages': 0
                },
                'error': 'Erro ao buscar exercícios. Verifique se a tabela exercises existe no banco.'
            }

    def get_exercise_by_id(self, exercise_id: str) -> Optional[Dict[str, Any]]:
        """
        Busca exercício por ID do Supabase

        Args:
            exercise_id (str): ID único do exercício

        Returns:
            Optional[Dict[str, Any]]: Dados do exercício ou None se não encontrado
        """
        try:
            if not exercise_id:
                logger.warning("Tentativa de buscar exercício com ID vazio")
                return None

            # ✅ CORRIGIDO: Usa ExerciseRepository
            exercise = self.exercise_repo.find_by_id(exercise_id)

            if exercise:
                return {
                    'id': exercise.get('id'),
                    'name': exercise.get('name'),
                    'description': exercise.get('description'),
                    'category': exercise.get('category'),
                    'difficulty': exercise.get('difficulty'),
                    'muscle_groups': exercise.get('muscle_groups') or [],
                    'equipment': exercise.get('equipment') or [],
                    'instructions': exercise.get('instructions') or [],
                    'tips': exercise.get('tips') or [],
                    'calories_per_minute': exercise.get('calories_per_minute') or exercise.get('met_value', 0),
                    'duration_minutes': exercise.get('duration_minutes'),
                    'sets': exercise.get('sets'),
                    'reps': exercise.get('reps'),
                    'rest_seconds': exercise.get('rest_seconds', 60),
                    'image_url': exercise.get('image_url'),
                    'video_url': exercise.get('video_url')
                }
            return None
        except Exception as e:
            self.logger.error(f"Erro ao buscar exercício por ID: {e}")
            return None

    def create_exercise_log(self, user_id: str, exercise_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Cria log de exercício realizado pelo usuário

        Args:
            user_id (str): ID do usuário
            exercise_data (Dict[str, Any]): Dados do exercício realizado
                - exercise_name (str): Nome do exercício
                - duration_minutes (int): Duração em minutos
                - calories_burned (float, optional): Calorias queimadas

        Returns:
            Dict[str, Any]: Resultado da operação
                - success (bool): True se criado com sucesso
                - log: Dados do log criado ou error: Mensagem de erro
        """
        try:
            if not user_id:
                return {'success': False, 'error': 'ID do usuário é obrigatório'}

            log_data = {
                'user_id': user_id,
                'exercise_name': exercise_data.get('exercise_name', 'Exercício'),
                'duration_minutes': exercise_data.get('duration_minutes', 0),
                'calories_burned': exercise_data.get('calories_burned', 0)
            }

            # Valida dados mínimos
            if log_data['duration_minutes'] <= 0:
                return {'success': False, 'error': 'Duração deve ser maior que zero'}

            # ✅ CORRIGIDO: Usa WorkoutRepository
            session = self.workout_repo.create_workout_session(log_data)

            if session:
                return {'success': True, 'log': session}
            else:
                return {'success': False, 'error': 'Erro ao criar log de exercício'}

        except Exception as e:
            self.logger.error(f"Erro ao criar log de exercício: {e}")
            return {'success': False, 'error': 'Erro interno do servidor'}

    def get_exercise_logs(self, user_id: str, limit: int = 50) -> List[Dict[str, Any]]:
        """
        Busca logs de exercícios do usuário

        Args:
            user_id (str): ID do usuário
            limit (int): Limite de resultados (padrão: 50)

        Returns:
            List[Dict[str, Any]]: Lista de logs de exercícios
        """
        try:
            if not user_id:
                return []

            if limit < 1 or limit > 100:
                limit = 50

            # ✅ CORRIGIDO: Usa WorkoutRepository
            sessions = self.workout_repo.find_by_user(user_id, limit=limit)
            return sessions
        except Exception as e:
            self.logger.error(f"Erro ao buscar logs de exercícios: {e}")
            return []

    def get_exercise_categories(self) -> List[str]:
        """
        Retorna categorias de exercícios do banco

        Returns:
            List[str]: Lista de categorias únicas
        """
        try:
            # ✅ CORRIGIDO: Usa repositório
            # ✅ CORRIGIDO: Usa exercise_repo
            categories = self.exercise_repo.find_all(filters={}, order_by='category')
            categories = list(set([c.get('category') for c in categories if c.get('category')]))
            return sorted(categories) if categories else EXERCISE_CATEGORIES
        except Exception as e:
            self.logger.error(f"Erro ao buscar categorias: {e}")
            return EXERCISE_CATEGORIES

    def get_difficulty_levels(self) -> List[str]:
        """
        Retorna níveis de dificuldade do banco

        Returns:
            List[str]: Lista de níveis de dificuldade únicos
        """
        try:
            # ✅ CORRIGIDO: Usa repositório
            levels = self.repo.get_difficulty_levels()
            return sorted(levels) if levels else DIFFICULTY_LEVELS
        except Exception as e:
            self.logger.error(f"Erro ao buscar níveis de dificuldade: {e}")
            return DIFFICULTY_LEVELS

    def get_muscle_groups(self) -> List[str]:
        """
        Retorna grupos musculares do banco

        Returns:
            List[str]: Lista de grupos musculares únicos
        """
        try:
            # ✅ CORRIGIDO: Usa exercise_repo
            groups_data = self.exercise_repo.find_all(filters={}, order_by='muscle_groups')
            groups = []
            for g in groups_data:
                muscle_groups = g.get('muscle_groups', [])
                if isinstance(muscle_groups, list):
                    groups.extend(muscle_groups)
            groups = list(set(groups))
            default_groups = [
                'peitoral', 'costas', 'ombros', 'bíceps', 'tríceps',
                'quadríceps', 'posterior', 'glúteos', 'panturrilhas', 'core'
            ]
            return sorted(groups) if groups else default_groups
        except Exception as e:
            self.logger.error(f"Erro ao buscar grupos musculares: {e}")
            return [
                'peitoral', 'costas', 'ombros', 'bíceps', 'tríceps',
                'quadríceps', 'posterior', 'glúteos', 'panturrilhas', 'core'
            ]

    # ============================================================
    # MÉTODOS PARA PLANOS DE TREINO
    # ============================================================

    def create_workout_plan(self, user_id: str, plan_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Cria um novo plano de treino

        Args:
            user_id (str): ID do usuário criador
            plan_data (Dict[str, Any]): Dados do plano
                - name (str): Nome do plano (obrigatório)
                - description (str, optional): Descrição
                - goal (str): Objetivo (weight_loss, muscle_gain, etc.)
                - difficulty (str): Dificuldade (beginner, intermediate, advanced) (obrigatório)
                - duration_weeks (int): Duração em semanas (padrão: 4)
                - workouts_per_week (int): Treinos por semana (padrão: 3)
                - is_active (bool): Se está ativo (padrão: True)
                - is_public (bool): Se é público (padrão: False)
                - exercises (List[Dict], optional): Lista de exercícios do plano

        Returns:
            Dict[str, Any]: Resultado da operação
                - success (bool): True se criado com sucesso
                - plan: Dados do plano criado ou error: Mensagem de erro
        """
        try:
            if not user_id:
                return {'success': False, 'error': 'ID do usuário é obrigatório'}

            # Valida campos obrigatórios
            if not plan_data.get('name'):
                return {'success': False, 'error': 'Nome do plano é obrigatório'}

            if not plan_data.get('difficulty') or plan_data['difficulty'] not in DIFFICULTY_LEVELS:
                return {'success': False, 'error': 'Dificuldade inválida'}

            # Valida objetivo
            goal = plan_data.get('goal', 'general_fitness')
            if goal not in WORKOUT_GOALS:
                goal = 'general_fitness'

            plan_record = {
                'user_id': user_id,
                'name': plan_data['name'].strip(),
                'description': plan_data.get('description', '').strip(),
                'goal': goal,
                'difficulty': plan_data['difficulty'],
                'duration_weeks': max(1, min(plan_data.get('duration_weeks', 4), 52)),  # Entre 1 e 52 semanas
                'workouts_per_week': max(1, min(plan_data.get('workouts_per_week', 3), 7)),  # Entre 1 e 7
                'is_active': plan_data.get('is_active', True),
                'is_public': plan_data.get('is_public', False)
            }

            # ✅ CORRIGIDO: Usa WorkoutPlanRepository
            plan = self.plan_repo.create_plan(plan_record)

            if plan:
                plan_id = plan['id']

                # Adiciona exercícios ao plano se fornecidos
                if 'exercises' in plan_data and plan_data['exercises']:
                    self._add_exercises_to_plan(plan_id, plan_data['exercises'])

                return {'success': True, 'plan': plan}
            else:
                return {'success': False, 'error': 'Erro ao criar plano de treino'}

        except Exception as e:
            logger.error(f"Erro ao criar plano de treino: {e}")
            return {'success': False, 'error': 'Erro interno do servidor'}

    def _add_exercises_to_plan(self, plan_id: str, exercises: List[Dict[str, Any]]) -> None:
        """
        Adiciona exercícios a um plano (método privado)

        Args:
            plan_id (str): ID do plano
            exercises (List[Dict[str, Any]]): Lista de exercícios
                Cada exercício deve conter:
                - exercise_id (str): ID do exercício
                - day_of_week (int, optional): Dia da semana (1-7)
                - order_in_workout (int, optional): Ordem no treino
                - sets (int, optional): Número de séries
                - reps (str, optional): Repetições
                - rest_seconds (int, optional): Descanso em segundos
                - duration_minutes (int, optional): Duração em minutos
                - notes (str, optional): Notas
        """
        try:
            plan_exercises = []
            for idx, ex in enumerate(exercises):
                if not ex.get('exercise_id'):
                    logger.warning(f"Exercício {idx} sem exercise_id, ignorando")
                    continue

                day_of_week = ex.get('day_of_week')
                if day_of_week and not (MIN_DAY_OF_WEEK <= day_of_week <= MAX_DAY_OF_WEEK):
                    logger.warning(f"Dia da semana inválido: {day_of_week}, ignorando")
                    day_of_week = None

                plan_exercises.append({
                    'plan_id': plan_id,
                    'exercise_id': ex['exercise_id'],
                    'day_of_week': day_of_week,
                    'order_in_workout': max(1, ex.get('order_in_workout', idx + 1)),
                    'sets': ex.get('sets'),
                    'reps': ex.get('reps'),
                    'rest_seconds': ex.get('rest_seconds'),
                    'duration_minutes': ex.get('duration_minutes'),
                    'notes': ex.get('notes', '').strip()
                })

            # ✅ CORRIGIDO: Usa WorkoutPlanRepository
            if plan_exercises:
                for plan_ex in plan_exercises:
                    self.plan_repo.add_exercise_to_plan(
                        plan_id=plan_ex['plan_id'],
                        exercise_id=plan_ex['exercise_id'],
                        day_of_week=plan_ex.get('day_of_week'),
                        sets=plan_ex.get('sets'),
                        reps=plan_ex.get('reps'),
                        weight=None,  # Não há weight no plano, apenas no progresso
                        rest_seconds=plan_ex.get('rest_seconds'),
                        order=plan_ex.get('order_in_workout')
                    )
        except Exception as e:
            self.logger.error(f"Erro ao adicionar exercícios ao plano: {e}")

    def get_workout_plans(self, user_id: str = None, is_active: bool = None,
                         is_public: bool = None, page: int = 1, limit: int = 20) -> Dict[str, Any]:
        """
        Lista planos de treino com filtros

        Args:
            user_id (str, optional): ID do usuário para filtrar planos próprios
            is_active (bool, optional): Filtrar por status ativo
            is_public (bool, optional): Filtrar por visibilidade pública
            page (int): Número da página (padrão: 1)
            limit (int): Limite por página (padrão: 20)

        Returns:
            Dict[str, Any]: Dicionário com lista de planos e paginação
        """
        try:
            # Valida parâmetros
            if page < 1:
                page = 1
            if limit < 1 or limit > 100:
                limit = 20

            # ✅ CORRIGIDO: Usa repositório
            filters = {}
            if user_id:
                filters['user_id'] = user_id
            if is_active is not None:
                filters['is_active'] = is_active
            if is_public is not None:
                filters['is_public'] = is_public

            # ✅ CORRIGIDO: Usa WorkoutPlanRepository
            # Busca planos por usuário ou públicos
            if user_id:
                plans = self.plan_repo.find_by_user(user_id, limit=limit)
                total = len(plans)
            else:
                # Busca planos públicos
                plans = self.plan_repo.find_all(
                    filters={**filters, 'is_public': True},
                    limit=limit,
                    offset=(page - 1) * limit
                )
                total = self.plan_repo.count(filters={**filters, 'is_public': True})

            # Adiciona exercícios de cada plano
            for plan in plans:
                plan['exercises'] = self._get_plan_exercises(plan['id'])

            return {
                'plans': plans,
                'pagination': {
                    'page': page,
                    'limit': limit,
                    'total': total,
                    'pages': (total + limit - 1) // limit if total > 0 else 0
                }
            }
        except Exception as e:
            logger.error(f"Erro ao buscar planos: {e}")
            return {'plans': [], 'pagination': {'page': page, 'limit': limit, 'total': 0, 'pages': 0}}

    def _get_plan_exercises(self, plan_id: str) -> List[Dict[str, Any]]:
        """
        Busca exercícios de um plano (método privado)

        Args:
            plan_id (str): ID do plano

        Returns:
            List[Dict[str, Any]]: Lista de exercícios do plano
        """
        try:
            # ✅ CORRIGIDO: Usa repositório
            return self.repo.find_plan_exercises(plan_id)
        except Exception as e:
            self.logger.error(f"Erro ao buscar exercícios do plano: {e}")
            return []

    def get_workout_plan_by_id(self, plan_id: str) -> Optional[Dict[str, Any]]:
        """
        Busca plano de treino por ID

        Args:
            plan_id (str): ID do plano

        Returns:
            Optional[Dict[str, Any]]: Dados do plano ou None se não encontrado
        """
        try:
            if not plan_id:
                return None

            # ✅ CORRIGIDO: Usa WorkoutPlanRepository
            plan = self.plan_repo.find_by_id(plan_id)

            if plan:
                plan['exercises'] = self._get_plan_exercises(plan_id)
                return plan
            return None
        except Exception as e:
            self.logger.error(f"Erro ao buscar plano por ID: {e}")
            return None

    def update_workout_plan(self, plan_id: str, user_id: str, plan_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Atualiza um plano de treino

        Args:
            plan_id (str): ID do plano
            user_id (str): ID do usuário (para verificação de permissão)
            plan_data (Dict[str, Any]): Campos a atualizar

        Returns:
            Dict[str, Any]: Resultado da operação
        """
        try:
            # Verifica se o plano pertence ao usuário
            plan = self.get_workout_plan_by_id(plan_id)
            if not plan or plan.get('user_id') != user_id:
                return {'success': False, 'error': 'Plano não encontrado ou sem permissão'}

            update_data = {}
            allowed_fields = ['name', 'description', 'goal', 'difficulty', 'duration_weeks',
                            'workouts_per_week', 'is_active', 'is_public']

            for field in allowed_fields:
                if field in plan_data:
                    value = plan_data[field]
                    # Validações específicas
                    if field == 'difficulty' and value not in DIFFICULTY_LEVELS:
                        continue
                    if field == 'goal' and value not in WORKOUT_GOALS:
                        continue
                    if field == 'duration_weeks':
                        value = max(1, min(value, 52))
                    if field == 'workouts_per_week':
                        value = max(1, min(value, 7))

                    update_data[field] = value

            if update_data:
                update_data['updated_at'] = datetime.now().isoformat()
                # ✅ CORRIGIDO: Usa WorkoutPlanRepository
                updated_plan = self.plan_repo.update_plan(plan_id, update_data)

                if updated_plan:
                    # Atualiza exercícios se fornecidos
                    if 'exercises' in plan_data:
                        # Remove exercícios antigos
                        self.plan_repo.delete_plan_exercises(plan_id)
                        # Adiciona novos
                        if plan_data['exercises']:
                            self._add_exercises_to_plan(plan_id, plan_data['exercises'])

                    return {'success': True, 'plan': updated_plan}

            return {'success': False, 'error': 'Nenhum campo para atualizar'}
        except Exception as e:
            logger.error(f"Erro ao atualizar plano: {e}")
            return {'success': False, 'error': 'Erro interno do servidor'}

    def delete_workout_plan(self, plan_id: str, user_id: str) -> Dict[str, Any]:
        """
        Deleta um plano de treino

        Args:
            plan_id (str): ID do plano
            user_id (str): ID do usuário (para verificação de permissão)

        Returns:
            Dict[str, Any]: Resultado da operação
        """
        try:
            plan = self.get_workout_plan_by_id(plan_id)
            if not plan or plan.get('user_id') != user_id:
                return {'success': False, 'error': 'Plano não encontrado ou sem permissão'}

            # ✅ CORRIGIDO: Usa WorkoutPlanRepository
            success = self.plan_repo.delete_plan(plan_id)
            if success:
                return {'success': True}
            else:
                return {'success': False, 'error': 'Erro ao deletar plano'}
        except Exception as e:
            logger.error(f"Erro ao deletar plano: {e}")
            return {'success': False, 'error': 'Erro interno do servidor'}

    # ============================================================
    # MÉTODOS PARA SESSÕES DE TREINO SEMANAL
    # ============================================================

    def create_weekly_sessions(self, user_id: str, plan_id: str, start_date: str,
                              week_number: int = 1) -> Dict[str, Any]:
        """
        Cria sessões de treino para uma semana baseado em um plano

        Args:
            user_id (str): ID do usuário
            plan_id (str): ID do plano de treino
            start_date (str): Data de início (ISO format)
            week_number (int): Número da semana (padrão: 1)

        Returns:
            Dict[str, Any]: Resultado com lista de sessões criadas
        """
        try:
            if not user_id or not plan_id or not start_date:
                return {'success': False, 'error': 'Parâmetros obrigatórios: user_id, plan_id, start_date'}

            plan = self.get_workout_plan_by_id(plan_id)
            if not plan:
                return {'success': False, 'error': 'Plano de treino não encontrado'}

            # Busca exercícios agrupados por dia da semana
            exercises_by_day = {}
            for ex in plan.get('exercises', []):
                day = ex.get('day_of_week')
                if day and MIN_DAY_OF_WEEK <= day <= MAX_DAY_OF_WEEK:
                    if day not in exercises_by_day:
                        exercises_by_day[day] = []
                    exercises_by_day[day].append(ex)

            if not exercises_by_day:
                return {'success': False, 'error': 'Plano não possui exercícios agendados por dia da semana'}

            # Cria sessões para cada dia com exercícios
            try:
                start = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
            except Exception:
                start = datetime.fromisoformat(start_date)

            sessions = []
            for day_of_week, exercises in exercises_by_day.items():
                # Calcula data do dia da semana (1=Segunda=0, 7=Domingo=6 no Python weekday)
                python_weekday = day_of_week - 1
                current_weekday = start.weekday()
                days_to_add = python_weekday - current_weekday
                if days_to_add < 0:
                    days_to_add += 7
                session_date = start + timedelta(days=days_to_add)

                session_data = {
                    'user_id': user_id,
                    'plan_id': plan_id,
                    'week_number': max(1, week_number),
                    'day_of_week': day_of_week,
                    'scheduled_date': session_date.date().isoformat(),
                    'status': 'scheduled',
                    'total_exercises': len(exercises)
                }

                # ✅ CORRIGIDO: Usa WorkoutRepository
                # Cria sessão semanal diretamente
                result = self.workout_repo.db.table('weekly_workout_sessions')\
                    .insert(session_data)\
                    .execute()
                session = result.data[0] if result.data else None
                if session and session.get('id'):
                    sessions.append(session)

            return {'success': True, 'sessions': sessions}
        except Exception as e:
            logger.error(f"Erro ao criar sessões semanais: {e}")
            return {'success': False, 'error': 'Erro interno do servidor'}

    def get_weekly_sessions(self, user_id: str, plan_id: str = None, week_number: int = None,
                           start_date: str = None, end_date: str = None) -> List[Dict[str, Any]]:
        """
        Busca sessões de treino do usuário

        Args:
            user_id (str): ID do usuário
            plan_id (str, optional): Filtrar por plano
            week_number (int, optional): Filtrar por semana
            start_date (str, optional): Data inicial (ISO format)
            end_date (str, optional): Data final (ISO format)

        Returns:
            List[Dict[str, Any]]: Lista de sessões com exercícios e progresso
        """
        try:
            if not user_id:
                return []

            # ✅ CORRIGIDO: Usa WorkoutRepository
            sessions = self.workout_repo.find_weekly_sessions(
                user_id=user_id,
                plan_id=plan_id,
                week_number=week_number
            )
            
            # Filtra por data se necessário (pode ser adicionado ao repositório depois)
            if start_date or end_date:
                from datetime import datetime
                filtered_sessions = []
                for session in sessions:
                    scheduled_date = session.get('scheduled_date')
                    if scheduled_date:
                        sched_dt = datetime.fromisoformat(scheduled_date.replace('Z', '+00:00'))
                        if start_date and sched_dt < datetime.fromisoformat(start_date.replace('Z', '+00:00')):
                            continue
                        if end_date and sched_dt > datetime.fromisoformat(end_date.replace('Z', '+00:00')):
                            continue
                    filtered_sessions.append(session)
                sessions = filtered_sessions
            
            # Ordena
            sessions.sort(key=lambda s: (s.get('scheduled_date', ''), s.get('day_of_week', 0)))

            # Adiciona exercícios e progresso de cada sessão
            for session in sessions:
                session['exercises'] = self._get_session_exercises(session['id'], session.get('plan_id'))
                session['progress'] = self._get_session_progress(session['id'])

            return sessions
        except Exception as e:
            logger.error(f"Erro ao buscar sessões: {e}")
            return []

    def _get_session_exercises(self, session_id: str, plan_id: str = None) -> List[Dict[str, Any]]:
        """
        Busca exercícios de uma sessão (método privado)

        Args:
            session_id (str): ID da sessão
            plan_id (str, optional): ID do plano

        Returns:
            List[Dict[str, Any]]: Lista de exercícios da sessão
        """
        try:
            if plan_id:
                # ✅ CORRIGIDO: Usa WorkoutRepository e WorkoutPlanRepository
                day_of_week = self.workout_repo.get_weekly_session_day(session_id)
                if day_of_week is not None:
                    exercises = self.plan_repo.get_plan_exercises(plan_id, day_of_week=day_of_week)
                    if exercises:
                        return exercises
            return []
        except Exception as e:
            logger.error(f"Erro ao buscar exercícios da sessão: {e}")
            return []

    def _get_session_progress(self, session_id: str) -> List[Dict[str, Any]]:
        """
        Busca progresso de uma sessão (método privado)

        Args:
            session_id (str): ID da sessão

        Returns:
            List[Dict[str, Any]]: Lista de progresso dos exercícios
        """
        try:
            # ✅ CORRIGIDO: Usa WorkoutRepository
            progress_data = self.workout_repo.get_session_exercise_progress(session_id)
            return progress_data if progress_data else []
        except Exception as e:
            logger.error(f"Erro ao buscar progresso: {e}")
            return []

    def update_session_status(self, session_id: str, user_id: str, status: str,
                             duration_minutes: int = None) -> Dict[str, Any]:
        """
        Atualiza status de uma sessão

        Args:
            session_id (str): ID da sessão
            user_id (str): ID do usuário (para verificação)
            status (str): Novo status (scheduled, in_progress, completed, skipped)
            duration_minutes (int, optional): Duração em minutos (para status completed)

        Returns:
            Dict[str, Any]: Resultado da operação
        """
        try:
            if status not in WORKOUT_STATUS:
                return {'success': False, 'error': 'Status inválido'}

            update_data = {
                'status': status,
                'updated_at': datetime.now().isoformat()
            }

            if status == 'in_progress' and not duration_minutes:
                update_data['started_at'] = datetime.now().isoformat()
            elif status == 'completed':
                update_data['completed_at'] = datetime.now().isoformat()
                if duration_minutes:
                    update_data['duration_minutes'] = max(0, duration_minutes)

            # ✅ CORRIGIDO: Usa WorkoutRepository
            updated_session = self.workout_repo.update_session_status(
                session_id=session_id,
                status=status,
                completed_at=update_data.get('completed_at')
            )
            
            # Se não encontrou, tenta atualizar manualmente (para campos adicionais)
            if not updated_session and duration_minutes:
                try:
                    result = self.workout_repo.db.table('weekly_workout_sessions')\
                        .update(update_data)\
                        .eq('id', session_id)\
                        .eq('user_id', user_id)\
                        .execute()
                    if result.data:
                        updated_session = result.data[0]
                except Exception:
                    pass
            
            if updated_session:
                result_data = updated_session
            else:
                # Fallback para compatibilidade
                try:
                    result = self.workout_repo.db.table('weekly_workout_sessions')\
                        .select('*')\
                        .eq('id', session_id)\
                        .eq('user_id', user_id)\
                        .execute()
                    result_data = result.data[0] if result.data else None
                except Exception:
                    result_data = None

            if result_data:
                return {'success': True, 'session': result_data}
            return {'success': False, 'error': 'Sessão não encontrada'}
        except Exception as e:
            logger.error(f"Erro ao atualizar sessão: {e}")
            return {'success': False, 'error': 'Erro interno do servidor'}

    def save_exercise_progress(self,
        session_id: str, exercise_id: str, progress_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Salva progresso de um exercício em uma sessão

        Args:
            session_id (str): ID da sessão
            exercise_id (str): ID do exercício
            progress_data (Dict[str, Any]): Dados do progresso
                - sets_completed (int): Séries completadas
                - reps_completed (str): Repetições completadas
                - weight_kg (float, optional): Peso em kg
                - duration_minutes (int, optional): Duração em minutos
                - rest_taken_seconds (int, optional): Descanso em segundos
                - completed (bool): Se foi completado
                - notes (str, optional): Notas

        Returns:
            Dict[str, Any]: Resultado da operação
        """
        try:
            if not session_id or not exercise_id:
                return {'success': False, 'error': 'session_id e exercise_id são obrigatórios'}

            progress_record = {
                'session_id': session_id,
                'exercise_id': exercise_id,
                'sets_completed': max(0, progress_data.get('sets_completed', 0)),
                'reps_completed': progress_data.get('reps_completed', ''),
                'weight_kg': max(0, progress_data.get('weight_kg', 0)) if progress_data.get('weight_kg') else None,
                'duration_minutes': max(0,
                    progress_data.get('duration_minutes', 0)) if progress_data.get('duration_minutes') else None,
                'rest_taken_seconds': max(0,
                    progress_data.get('rest_taken_seconds', 0)) if progress_data.get('rest_taken_seconds') else None,
                'completed': progress_data.get('completed', False),
                'notes': progress_data.get('notes', '').strip()
            }

            # ✅ CORRIGIDO: Insere progresso via repositório
            # Pode criar método específico depois
            result = self.workout_repo.db.table('session_exercise_progress')\
                .insert(progress_record)\
                .execute()

            if result.data:
                # Atualiza contador de exercícios completos na sessão
                self._update_session_completion(session_id)
                return {'success': True, 'progress': result.data[0]}
            return {'success': False, 'error': 'Erro ao salvar progresso'}
        except Exception as e:
            logger.error(f"Erro ao salvar progresso: {e}")
            return {'success': False, 'error': 'Erro interno do servidor'}

    def _update_session_completion(self, session_id: str) -> None:
        """
        Atualiza contador de exercícios completos na sessão (método privado)

        Args:
            session_id (str): ID da sessão
        """
        try:
            # ✅ CORRIGIDO: Usa repositório
            result = self.workout_repo.db.table('session_exercise_progress')\
                .select('id')\
                .eq('session_id', session_id)\
                .eq('completed', True)\
                .execute()
            completed_count = len(result.data) if result.data else 0

            self.workout_repo.db.table('weekly_workout_sessions').update({
                'exercises_completed': completed_count
            }).eq('id', session_id).execute()
        except Exception as e:
            logger.error(f"Erro ao atualizar contador de conclusão: {e}")
