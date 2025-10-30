"""
Serviço de Exercícios RE-EDUCA Store - Supabase
"""
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime
from config.database import supabase_client

logger = logging.getLogger(__name__)

class ExerciseService:
    def __init__(self):
        self.supabase = supabase_client
    
    def get_exercises(self, category: str = None, difficulty: str = None, 
                     equipment: str = None, muscle_group: str = None,
                     page: int = 1, limit: int = 20) -> Dict[str, Any]:
        """Busca exercícios com filtros do Supabase"""
        try:
            # Buscar exercícios do Supabase
            query = self.supabase.table('exercises').select('*', count='exact')
            
            # Aplicar filtros
            if category:
                query = query.eq('category', category)
            if difficulty:
                query = query.eq('difficulty', difficulty)
            if equipment:
                query = query.contains('equipment', [equipment])
            if muscle_group:
                query = query.contains('muscle_groups', [muscle_group])
            
            # Executar query com paginação
            result = query.range((page - 1) * limit, page * limit - 1).execute()
            
            exercises = result.data if result.data else []
            total_count = result.count if hasattr(result, 'count') and result.count is not None else len(exercises)
            
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
            logger.error(f"Erro ao buscar exercícios do Supabase: {e}")
            # Fallback: retornar array vazio em vez de dados mockados
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
        """Busca exercício por ID do Supabase"""
        try:
            result = self.supabase.table('exercises').select('*').eq('id', exercise_id).execute()
            
            if result.data and len(result.data) > 0:
                exercise = result.data[0]
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
                    'image_url': exercise.get('image_url'),
                    'video_url': exercise.get('video_url')
                }
            return None
        except Exception as e:
            logger.error(f"Erro ao buscar exercício por ID: {e}")
            return None
    
    def create_exercise_log(self, user_id: str, exercise_data: Dict[str, Any]) -> Dict[str, Any]:
        """Cria log de exercício"""
        try:
            log_data = {
                'user_id': user_id,
                'exercise_name': exercise_data.get('exercise_name', 'Exercício'),
                'duration_minutes': exercise_data.get('duration_minutes', 0),
                'calories_burned': exercise_data.get('calories_burned', 0)
            }
            
            result = self.supabase.create_exercise_log(log_data)
            
            if result and 'error' not in result:
                return {'success': True, 'log': result}
            else:
                return {'success': False, 'error': 'Erro ao criar log de exercício'}
                
        except Exception as e:
            logger.error(f"Erro ao criar log de exercício: {e}")
            return {'success': False, 'error': 'Erro interno do servidor'}
    
    def get_exercise_logs(self, user_id: str, limit: int = 50) -> List[Dict[str, Any]]:
        """Busca logs de exercícios do usuário"""
        try:
            logs = self.supabase.get_exercise_logs(user_id)
            return logs[:limit] if logs else []
        except Exception as e:
            logger.error(f"Erro ao buscar logs de exercícios: {e}")
            return []
    
    def get_exercise_categories(self) -> List[str]:
        """Retorna categorias de exercícios do banco"""
        try:
            result = self.supabase.table('exercises').select('category').execute()
            if result.data:
                categories = list(set(ex.get('category') for ex in result.data if ex.get('category')))
                return sorted(categories) if categories else ['strength', 'cardio', 'flexibility', 'core', 'balance']
            return ['strength', 'cardio', 'flexibility', 'core', 'balance']
        except Exception as e:
            logger.error(f"Erro ao buscar categorias: {e}")
            return ['strength', 'cardio', 'flexibility', 'core', 'balance']
    
    def get_difficulty_levels(self) -> List[str]:
        """Retorna níveis de dificuldade do banco"""
        try:
            result = self.supabase.table('exercises').select('difficulty').execute()
            if result.data:
                levels = list(set(ex.get('difficulty') for ex in result.data if ex.get('difficulty')))
                return sorted(levels) if levels else ['beginner', 'intermediate', 'advanced']
            return ['beginner', 'intermediate', 'advanced']
        except Exception as e:
            logger.error(f"Erro ao buscar níveis de dificuldade: {e}")
            return ['beginner', 'intermediate', 'advanced']
    
    def get_muscle_groups(self) -> List[str]:
        """Retorna grupos musculares do banco"""
        try:
            result = self.supabase.table('exercises').select('muscle_groups').execute()
            if result.data:
                all_groups = []
                for ex in result.data:
                    if ex.get('muscle_groups') and isinstance(ex.get('muscle_groups'), list):
                        all_groups.extend(ex.get('muscle_groups'))
                return sorted(list(set(all_groups))) if all_groups else ['peitoral', 'costas', 'ombros', 'bíceps', 'tríceps', 'quadríceps', 'posterior', 'glúteos', 'panturrilhas', 'core']
            return ['peitoral', 'costas', 'ombros', 'bíceps', 'tríceps', 'quadríceps', 'posterior', 'glúteos', 'panturrilhas', 'core']
        except Exception as e:
            logger.error(f"Erro ao buscar grupos musculares: {e}")
            return ['peitoral', 'costas', 'ombros', 'bíceps', 'tríceps', 'quadríceps', 'posterior', 'glúteos', 'panturrilhas', 'core']
    
    # ============================================================
    # MÉTODOS PARA PLANOS DE TREINO
    # ============================================================
    
    def create_workout_plan(self, user_id: str, plan_data: Dict[str, Any]) -> Dict[str, Any]:
        """Cria um novo plano de treino"""
        try:
            plan_record = {
                'user_id': user_id,
                'name': plan_data['name'],
                'description': plan_data.get('description'),
                'goal': plan_data.get('goal', 'general_fitness'),
                'difficulty': plan_data['difficulty'],
                'duration_weeks': plan_data.get('duration_weeks', 4),
                'workouts_per_week': plan_data.get('workouts_per_week', 3),
                'is_active': plan_data.get('is_active', True),
                'is_public': plan_data.get('is_public', False)
            }
            
            result = self.supabase.table('workout_plans').insert(plan_record).execute()
            
            if result.data and len(result.data) > 0:
                plan_id = result.data[0]['id']
                
                # Adiciona exercícios ao plano se fornecidos
                if 'exercises' in plan_data and plan_data['exercises']:
                    self._add_exercises_to_plan(plan_id, plan_data['exercises'])
                
                return {'success': True, 'plan': result.data[0]}
            else:
                return {'success': False, 'error': 'Erro ao criar plano de treino'}
                
        except Exception as e:
            logger.error(f"Erro ao criar plano de treino: {e}")
            return {'success': False, 'error': 'Erro interno do servidor'}
    
    def _add_exercises_to_plan(self, plan_id: str, exercises: List[Dict[str, Any]]) -> None:
        """Adiciona exercícios a um plano"""
        try:
            plan_exercises = []
            for ex in exercises:
                plan_exercises.append({
                    'plan_id': plan_id,
                    'exercise_id': ex['exercise_id'],
                    'day_of_week': ex.get('day_of_week'),
                    'order_in_workout': ex.get('order_in_workout', 1),
                    'sets': ex.get('sets'),
                    'reps': ex.get('reps'),
                    'rest_seconds': ex.get('rest_seconds'),
                    'duration_minutes': ex.get('duration_minutes'),
                    'notes': ex.get('notes')
                })
            
            if plan_exercises:
                self.supabase.table('workout_plan_exercises').insert(plan_exercises).execute()
        except Exception as e:
            logger.error(f"Erro ao adicionar exercícios ao plano: {e}")
    
    def get_workout_plans(self, user_id: str = None, is_active: bool = None, 
                         is_public: bool = None, page: int = 1, limit: int = 20) -> Dict[str, Any]:
        """Lista planos de treino"""
        try:
            query = self.supabase.table('workout_plans').select('*', count='exact')
            
            if user_id:
                query = query.eq('user_id', user_id)
            if is_active is not None:
                query = query.eq('is_active', is_active)
            if is_public is not None:
                query = query.eq('is_public', is_public)
            
            result = query.order('created_at', desc=True).range((page - 1) * limit, page * limit - 1).execute()
            
            plans = result.data if result.data else []
            total = result.count if hasattr(result, 'count') and result.count else len(plans)
            
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
        """Busca exercícios de um plano"""
        try:
            result = self.supabase.table('workout_plan_exercises').select('*, exercises(*)').eq('plan_id', plan_id).order('day_of_week').order('order_in_workout').execute()
            
            if result.data:
                return result.data
            return []
        except Exception as e:
            logger.error(f"Erro ao buscar exercícios do plano: {e}")
            return []
    
    def get_workout_plan_by_id(self, plan_id: str) -> Optional[Dict[str, Any]]:
        """Busca plano de treino por ID"""
        try:
            result = self.supabase.table('workout_plans').select('*').eq('id', plan_id).execute()
            
            if result.data and len(result.data) > 0:
                plan = result.data[0]
                plan['exercises'] = self._get_plan_exercises(plan_id)
                return plan
            return None
        except Exception as e:
            logger.error(f"Erro ao buscar plano por ID: {e}")
            return None
    
    def update_workout_plan(self, plan_id: str, user_id: str, plan_data: Dict[str, Any]) -> Dict[str, Any]:
        """Atualiza um plano de treino"""
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
                    update_data[field] = plan_data[field]
            
            if update_data:
                update_data['updated_at'] = datetime.now().isoformat()
                result = self.supabase.table('workout_plans').update(update_data).eq('id', plan_id).execute()
                
                if result.data:
                    # Atualiza exercícios se fornecidos
                    if 'exercises' in plan_data:
                        # Remove exercícios antigos
                        self.supabase.table('workout_plan_exercises').delete().eq('plan_id', plan_id).execute()
                        # Adiciona novos
                        if plan_data['exercises']:
                            self._add_exercises_to_plan(plan_id, plan_data['exercises'])
                    
                    return {'success': True, 'plan': result.data[0]}
            
            return {'success': False, 'error': 'Nenhum campo para atualizar'}
        except Exception as e:
            logger.error(f"Erro ao atualizar plano: {e}")
            return {'success': False, 'error': 'Erro interno do servidor'}
    
    def delete_workout_plan(self, plan_id: str, user_id: str) -> Dict[str, Any]:
        """Deleta um plano de treino"""
        try:
            plan = self.get_workout_plan_by_id(plan_id)
            if not plan or plan.get('user_id') != user_id:
                return {'success': False, 'error': 'Plano não encontrado ou sem permissão'}
            
            self.supabase.table('workout_plans').delete().eq('id', plan_id).execute()
            return {'success': True}
        except Exception as e:
            logger.error(f"Erro ao deletar plano: {e}")
            return {'success': False, 'error': 'Erro interno do servidor'}
    
    # ============================================================
    # MÉTODOS PARA SESSÕES DE TREINO SEMANAL
    # ============================================================
    
    def create_weekly_sessions(self, user_id: str, plan_id: str, start_date: str, 
                              week_number: int = 1) -> Dict[str, Any]:
        """Cria sessões de treino para uma semana"""
        try:
            plan = self.get_workout_plan_by_id(plan_id)
            if not plan:
                return {'success': False, 'error': 'Plano de treino não encontrado'}
            
            # Busca exercícios agrupados por dia da semana
            exercises_by_day = {}
            for ex in plan.get('exercises', []):
                day = ex.get('day_of_week')
                if day:
                    if day not in exercises_by_day:
                        exercises_by_day[day] = []
                    exercises_by_day[day].append(ex)
            
            # Cria sessões para cada dia com exercícios
            from datetime import datetime, timedelta
            start = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
            
            sessions = []
            for day_of_week, exercises in exercises_by_day.items():
                # Calcula data do dia da semana (1=Segunda=0, 7=Domingo=6 no Python weekday)
                # Python weekday: 0=Segunda, 6=Domingo
                # Nosso sistema: 1=Segunda, 7=Domingo
                python_weekday = day_of_week - 1
                current_weekday = start.weekday()
                days_to_add = python_weekday - current_weekday
                if days_to_add < 0:
                    days_to_add += 7
                session_date = start + timedelta(days=days_to_add)
                
                session_data = {
                    'user_id': user_id,
                    'plan_id': plan_id,
                    'week_number': week_number,
                    'day_of_week': day_of_week,
                    'scheduled_date': session_date.date().isoformat(),
                    'status': 'scheduled',
                    'total_exercises': len(exercises)
                }
                
                result = self.supabase.table('weekly_workout_sessions').insert(session_data).execute()
                if result.data:
                    sessions.append(result.data[0])
            
            return {'success': True, 'sessions': sessions}
        except Exception as e:
            logger.error(f"Erro ao criar sessões semanais: {e}")
            return {'success': False, 'error': 'Erro interno do servidor'}
    
    def get_weekly_sessions(self, user_id: str, plan_id: str = None, week_number: int = None,
                           start_date: str = None, end_date: str = None) -> List[Dict[str, Any]]:
        """Busca sessões de treino"""
        try:
            query = self.supabase.table('weekly_workout_sessions').select('*').eq('user_id', user_id)
            
            if plan_id:
                query = query.eq('plan_id', plan_id)
            if week_number:
                query = query.eq('week_number', week_number)
            if start_date:
                query = query.gte('scheduled_date', start_date)
            if end_date:
                query = query.lte('scheduled_date', end_date)
            
            result = query.order('scheduled_date').order('day_of_week').execute()
            
            sessions = result.data if result.data else []
            
            # Adiciona exercícios e progresso de cada sessão
            for session in sessions:
                session['exercises'] = self._get_session_exercises(session['id'], session.get('plan_id'))
                session['progress'] = self._get_session_progress(session['id'])
            
            return sessions
        except Exception as e:
            logger.error(f"Erro ao buscar sessões: {e}")
            return []
    
    def _get_session_exercises(self, session_id: str, plan_id: str = None) -> List[Dict[str, Any]]:
        """Busca exercícios de uma sessão"""
        try:
            if plan_id:
                # Busca exercícios do plano para o dia da semana da sessão
                session = self.supabase.table('weekly_workout_sessions').select('day_of_week').eq('id', session_id).execute()
                if session.data:
                    day_of_week = session.data[0].get('day_of_week')
                    result = self.supabase.table('workout_plan_exercises').select('*, exercises(*)').eq('plan_id', plan_id).eq('day_of_week', day_of_week).order('order_in_workout').execute()
                    if result.data:
                        return result.data
            return []
        except Exception as e:
            logger.error(f"Erro ao buscar exercícios da sessão: {e}")
            return []
    
    def _get_session_progress(self, session_id: str) -> List[Dict[str, Any]]:
        """Busca progresso de uma sessão"""
        try:
            result = self.supabase.table('session_exercise_progress').select('*, exercises(*)').eq('session_id', session_id).execute()
            return result.data if result.data else []
        except Exception as e:
            logger.error(f"Erro ao buscar progresso: {e}")
            return []
    
    def update_session_status(self, session_id: str, user_id: str, status: str, 
                             duration_minutes: int = None) -> Dict[str, Any]:
        """Atualiza status de uma sessão"""
        try:
            update_data = {
                'status': status,
                'updated_at': datetime.now().isoformat()
            }
            
            if status == 'in_progress' and not duration_minutes:
                update_data['started_at'] = datetime.now().isoformat()
            elif status == 'completed':
                update_data['completed_at'] = datetime.now().isoformat()
                if duration_minutes:
                    update_data['duration_minutes'] = duration_minutes
            
            result = self.supabase.table('weekly_workout_sessions').update(update_data).eq('id', session_id).eq('user_id', user_id).execute()
            
            if result.data:
                return {'success': True, 'session': result.data[0]}
            return {'success': False, 'error': 'Sessão não encontrada'}
        except Exception as e:
            logger.error(f"Erro ao atualizar sessão: {e}")
            return {'success': False, 'error': 'Erro interno do servidor'}
    
    def save_exercise_progress(self, session_id: str, exercise_id: str, progress_data: Dict[str, Any]) -> Dict[str, Any]:
        """Salva progresso de um exercício em uma sessão"""
        try:
            progress_record = {
                'session_id': session_id,
                'exercise_id': exercise_id,
                'sets_completed': progress_data.get('sets_completed', 0),
                'reps_completed': progress_data.get('reps_completed'),
                'weight_kg': progress_data.get('weight_kg'),
                'duration_minutes': progress_data.get('duration_minutes'),
                'rest_taken_seconds': progress_data.get('rest_taken_seconds'),
                'completed': progress_data.get('completed', False),
                'notes': progress_data.get('notes')
            }
            
            result = self.supabase.table('session_exercise_progress').insert(progress_record).execute()
            
            if result.data:
                # Atualiza contador de exercícios completos na sessão
                self._update_session_completion(session_id)
                return {'success': True, 'progress': result.data[0]}
            return {'success': False, 'error': 'Erro ao salvar progresso'}
        except Exception as e:
            logger.error(f"Erro ao salvar progresso: {e}")
            return {'success': False, 'error': 'Erro interno do servidor'}
    
    def _update_session_completion(self, session_id: str) -> None:
        """Atualiza contador de exercícios completos na sessão"""
        try:
            result = self.supabase.table('session_exercise_progress').select('id').eq('session_id', session_id).eq('completed', True).execute()
            completed_count = len(result.data) if result.data else 0
            
            self.supabase.table('weekly_workout_sessions').update({
                'exercises_completed': completed_count
            }).eq('id', session_id).execute()
        except Exception as e:
            logger.error(f"Erro ao atualizar contador de conclusão: {e}")