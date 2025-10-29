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