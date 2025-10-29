"""
Serviço de Exercícios RE-EDUCA Store
"""
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
from config.database import supabase_client
from decimal import Decimal

logger = logging.getLogger(__name__)

class ExerciseService:
    def __init__(self):
        self.supabase = supabase_client
    
    def get_exercises(self, category: str = None, difficulty: str = None, 
                     equipment: str = None, muscle_group: str = None,
                     page: int = 1, limit: int = 20) -> Dict[str, Any]:
        """Busca exercícios com filtros"""
        try:
            query = self.supabase.table('exercises').select('*')
            
            if category:
                query = query.eq('category', category)
            
            if difficulty:
                query = query.eq('difficulty', difficulty)
            
            if equipment:
                query = query.contains('equipment', [equipment])
            
            if muscle_group:
                query = query.contains('muscle_groups', [muscle_group])
            
            # Paginação
            offset = (page - 1) * limit
            query = query.range(offset, offset + limit - 1).order('name')
            
            result = query.execute()
            
            return {
                'success': True,
                'exercises': result.data,
                'page': page,
                'limit': limit
            }
            
        except Exception as e:
            logger.error(f"Erro ao buscar exercícios: {str(e)}")
            return {'success': False, 'error': str(e)}
    
    def get_exercise_by_id(self, exercise_id: str) -> Dict[str, Any]:
        """Busca exercício por ID"""
        try:
            result = self.supabase.table('exercises').select('*').eq('id', exercise_id).execute()
            
            if result.data:
                return {
                    'success': True,
                    'exercise': result.data[0]
                }
            else:
                return {'success': False, 'error': 'Exercício não encontrado'}
                
        except Exception as e:
            logger.error(f"Erro ao buscar exercício: {str(e)}")
            return {'success': False, 'error': str(e)}
    
    def create_workout_plan(self, user_id: str, plan_data: Dict[str, Any]) -> Dict[str, Any]:
        """Cria plano de treino personalizado"""
        try:
            # Valida dados
            required_fields = ['name', 'description', 'exercises']
            for field in required_fields:
                if not plan_data.get(field):
                    return {'success': False, 'error': f'Campo {field} é obrigatório'}
            
            # Prepara dados do plano
            plan = {
                'user_id': user_id,
                'name': plan_data['name'],
                'description': plan_data['description'],
                'difficulty': plan_data.get('difficulty', 'beginner'),
                'duration_weeks': plan_data.get('duration_weeks', 4),
                'sessions_per_week': plan_data.get('sessions_per_week', 3),
                'exercises': plan_data['exercises'],
                'goals': plan_data.get('goals', []),
                'is_active': True,
                'created_at': datetime.now().isoformat(),
                'updated_at': datetime.now().isoformat()
            }
            
            # Salva plano
            result = self.supabase.table('workout_plans').insert(plan).execute()
            
            if result.data:
                return {
                    'success': True,
                    'workout_plan': result.data[0],
                    'message': 'Plano de treino criado com sucesso'
                }
            else:
                return {'success': False, 'error': 'Erro ao criar plano de treino'}
                
        except Exception as e:
            logger.error(f"Erro ao criar plano de treino: {str(e)}")
            return {'success': False, 'error': str(e)}
    
    def get_user_workout_plans(self, user_id: str, is_active: bool = None) -> Dict[str, Any]:
        """Busca planos de treino do usuário"""
        try:
            query = self.supabase.table('workout_plans').select('*').eq('user_id', user_id)
            
            if is_active is not None:
                query = query.eq('is_active', is_active)
            
            query = query.order('created_at', desc=True)
            result = query.execute()
            
            return {
                'success': True,
                'workout_plans': result.data
            }
            
        except Exception as e:
            logger.error(f"Erro ao buscar planos de treino: {str(e)}")
            return {'success': False, 'error': str(e)}
    
    def log_workout_session(self, user_id: str, session_data: Dict[str, Any]) -> Dict[str, Any]:
        """Registra sessão de treino"""
        try:
            # Valida dados
            required_fields = ['workout_plan_id', 'exercises_completed']
            for field in required_fields:
                if not session_data.get(field):
                    return {'success': False, 'error': f'Campo {field} é obrigatório'}
            
            # Calcula métricas
            total_duration = sum(ex.get('duration_minutes', 0) for ex in session_data['exercises_completed'])
            total_calories = sum(ex.get('calories_burned', 0) for ex in session_data['exercises_completed'])
            
            # Prepara dados da sessão
            session = {
                'user_id': user_id,
                'workout_plan_id': session_data['workout_plan_id'],
                'session_date': session_data.get('session_date', datetime.now().isoformat()),
                'total_duration_minutes': total_duration,
                'total_calories_burned': total_calories,
                'exercises_completed': session_data['exercises_completed'],
                'notes': session_data.get('notes', ''),
                'rating': session_data.get('rating'),
                'created_at': datetime.now().isoformat()
            }
            
            # Salva sessão
            result = self.supabase.table('workout_sessions').insert(session).execute()
            
            if result.data:
                return {
                    'success': True,
                    'workout_session': result.data[0],
                    'message': 'Sessão de treino registrada com sucesso'
                }
            else:
                return {'success': False, 'error': 'Erro ao registrar sessão'}
                
        except Exception as e:
            logger.error(f"Erro ao registrar sessão: {str(e)}")
            return {'success': False, 'error': str(e)}
    
    def get_workout_history(self, user_id: str, start_date: str = None, 
                          end_date: str = None, page: int = 1, limit: int = 20) -> Dict[str, Any]:
        """Busca histórico de treinos"""
        try:
            query = self.supabase.table('workout_sessions').select('*').eq('user_id', user_id)
            
            if start_date:
                query = query.gte('session_date', start_date)
            
            if end_date:
                query = query.lte('session_date', end_date)
            
            # Paginação
            offset = (page - 1) * limit
            query = query.range(offset, offset + limit - 1).order('session_date', desc=True)
            
            result = query.execute()
            
            return {
                'success': True,
                'sessions': result.data,
                'page': page,
                'limit': limit
            }
            
        except Exception as e:
            logger.error(f"Erro ao buscar histórico: {str(e)}")
            return {'success': False, 'error': str(e)}
    
    def get_workout_stats(self, user_id: str, period_days: int = 30) -> Dict[str, Any]:
        """Retorna estatísticas de treino"""
        try:
            start_date = (datetime.now() - timedelta(days=period_days)).isoformat()
            
            # Busca sessões do período
            sessions_result = self.supabase.table('workout_sessions').select('*').eq('user_id', user_id).gte('session_date', start_date).execute()
            
            sessions = sessions_result.data
            
            if not sessions:
                return {
                    'success': True,
                    'stats': {
                        'total_sessions': 0,
                        'total_duration_minutes': 0,
                        'total_calories_burned': 0,
                        'average_session_duration': 0,
                        'average_calories_per_session': 0,
                        'workout_frequency': 0,
                        'period_days': period_days
                    }
                }
            
            # Calcula estatísticas
            total_sessions = len(sessions)
            total_duration = sum(session.get('total_duration_minutes', 0) for session in sessions)
            total_calories = sum(session.get('total_calories_burned', 0) for session in sessions)
            
            average_session_duration = total_duration / total_sessions if total_sessions > 0 else 0
            average_calories_per_session = total_calories / total_sessions if total_sessions > 0 else 0
            workout_frequency = total_sessions / period_days if period_days > 0 else 0
            
            # Exercícios mais realizados
            exercise_count = {}
            for session in sessions:
                for exercise in session.get('exercises_completed', []):
                    exercise_name = exercise.get('exercise_name', '')
                    if exercise_name:
                        exercise_count[exercise_name] = exercise_count.get(exercise_name, 0) + 1
            
            most_frequent_exercises = sorted(exercise_count.items(), key=lambda x: x[1], reverse=True)[:5]
            
            return {
                'success': True,
                'stats': {
                    'total_sessions': total_sessions,
                    'total_duration_minutes': total_duration,
                    'total_calories_burned': total_calories,
                    'average_session_duration': round(average_session_duration, 1),
                    'average_calories_per_session': round(average_calories_per_session, 1),
                    'workout_frequency': round(workout_frequency, 2),
                    'most_frequent_exercises': most_frequent_exercises,
                    'period_days': period_days
                }
            }
            
        except Exception as e:
            logger.error(f"Erro ao calcular estatísticas: {str(e)}")
            return {'success': False, 'error': str(e)}
    
    def calculate_calories_burned(self, exercise_id: str, duration_minutes: int, 
                                user_weight_kg: float) -> float:
        """Calcula calorias queimadas baseado no exercício e peso do usuário"""
        try:
            # Busca dados do exercício
            exercise_result = self.supabase.table('exercises').select('met_value').eq('id', exercise_id).execute()
            
            if not exercise_result.data:
                return 0
            
            exercise = exercise_result.data[0]
            met_value = exercise.get('met_value', 3.5)  # Default MET value
            
            # Fórmula: METs × peso(kg) × tempo(horas)
            calories = met_value * user_weight_kg * (duration_minutes / 60)
            
            return round(calories, 1)
            
        except Exception as e:
            logger.error(f"Erro ao calcular calorias: {str(e)}")
            return 0
    
    def get_exercise_categories(self) -> Dict[str, Any]:
        """Retorna categorias de exercícios disponíveis"""
        try:
            result = self.supabase.table('exercises').select('category').execute()
            
            categories = list(set(exercise['category'] for exercise in result.data if exercise.get('category')))
            categories.sort()
            
            return {
                'success': True,
                'categories': categories
            }
            
        except Exception as e:
            logger.error(f"Erro ao buscar categorias: {str(e)}")
            return {'success': False, 'error': str(e)}
    
    def get_muscle_groups(self) -> Dict[str, Any]:
        """Retorna grupos musculares disponíveis"""
        try:
            result = self.supabase.table('exercises').select('muscle_groups').execute()
            
            muscle_groups = set()
            for exercise in result.data:
                if exercise.get('muscle_groups'):
                    muscle_groups.update(exercise['muscle_groups'])
            
            muscle_groups = list(muscle_groups)
            muscle_groups.sort()
            
            return {
                'success': True,
                'muscle_groups': muscle_groups
            }
            
        except Exception as e:
            logger.error(f"Erro ao buscar grupos musculares: {str(e)}")
            return {'success': False, 'error': str(e)}
    
    def get_equipment_list(self) -> Dict[str, Any]:
        """Retorna lista de equipamentos disponíveis"""
        try:
            result = self.supabase.table('exercises').select('equipment').execute()
            
            equipment = set()
            for exercise in result.data:
                if exercise.get('equipment'):
                    equipment.update(exercise['equipment'])
            
            equipment = list(equipment)
            equipment.sort()
            
            return {
                'success': True,
                'equipment': equipment
            }
            
        except Exception as e:
            logger.error(f"Erro ao buscar equipamentos: {str(e)}")
            return {'success': False, 'error': str(e)}