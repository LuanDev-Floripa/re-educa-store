"""
Service de saúde RE-EDUCA Store.

Gerencia dados de saúde do usuário incluindo:
- Cálculos e histórico de IMC
- Calorias e nutrição
- Hidratação
- Gordura corporal
- Métricas de saúde consolidadas
- Integrações com APIs externas
"""
import logging
import requests
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
from config.database import supabase_client
from config.settings import get_config
from utils.helpers import generate_uuid, paginate_data

logger = logging.getLogger(__name__)

class HealthService:
    """
    Service para operações de saúde.
    
    Centraliza lógica de negócio para dados de saúde.
    """
    
    def __init__(self):
        """Inicializa o serviço de saúde."""
        self.supabase = supabase_client
        self.config = get_config()
    
    def save_imc_calculation(self, user_id: str, calculation_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Salva cálculo de IMC no banco.
        
        Args:
            user_id (str): ID do usuário.
            calculation_data (Dict[str, Any]): Dados do cálculo.
            
        Returns:
            Dict[str, Any]: Entrada salva ou erro.
        """
        try:
            entry_data = {
                'id': generate_uuid(),
                'user_id': user_id,
                'weight': calculation_data.get('weight'),
                'height': calculation_data.get('height'),
                'imc': calculation_data['imc'],
                'classification': calculation_data['classification'],
                'color': calculation_data['color'],
                'recommendations': calculation_data['recommendations'],
                'weight_range': calculation_data['weight_range'],
                'created_at': datetime.now().isoformat()
            }
            
            result = self.supabase.table('imc_calculations').insert(entry_data).execute()
            
            if result.data:
                return {'success': True, 'entry': result.data[0]}
            else:
                return {'success': False, 'error': 'Erro ao salvar cálculo'}
                
        except Exception as e:
            logger.error(f"Erro ao salvar cálculo IMC: {str(e)}")
            return {'success': False, 'error': 'Erro interno do servidor'}
    
    def get_imc_history(self, user_id: str, page: int = 1, per_page: int = 20) -> Dict[str, Any]:
        """Retorna histórico de cálculos de IMC"""
        try:
            result = self.supabase.table('imc_calculations')\
                .select('*')\
                .eq('user_id', user_id)\
                .order('created_at', desc=True)\
                .execute()
            
            if result.data:
                # Paginação manual (em produção, usar paginação do Supabase)
                start = (page - 1) * per_page
                end = start + per_page
                paginated_data = result.data[start:end]
                
                return {
                    'calculations': paginated_data,
                    'pagination': {
                        'page': page,
                        'per_page': per_page,
                        'total': len(result.data),
                        'pages': (len(result.data) + per_page - 1) // per_page
                    }
                }
            else:
                return {
                    'calculations': [],
                    'pagination': {
                        'page': page,
                        'per_page': per_page,
                        'total': 0,
                        'pages': 0
                    }
                }
                
        except Exception as e:
            logger.error(f"Erro ao buscar histórico IMC: {str(e)}")
            return {'error': 'Erro interno do servidor'}
    
    def search_foods(self, query: str) -> List[Dict[str, Any]]:
        """Busca alimentos na API USDA"""
        try:
            # API USDA Food Data Central
            url = f"{self.config.USDA_BASE_URL}/foods/search"
            params = {
                'api_key': self.config.USDA_API_KEY,
                'query': query,
                'pageSize': 25,
                'dataType': ['Foundation', 'SR Legacy']
            }
            
            response = requests.get(url, params=params, timeout=10)
            response.raise_for_status()
            
            data = response.json()
            foods = []
            
            for food in data.get('foods', []):
                foods.append({
                    'fdc_id': food.get('fdcId'),
                    'name': food.get('description'),
                    'brand': food.get('brandOwner'),
                    'category': food.get('foodCategory'),
                    'nutrients': food.get('foodNutrients', [])
                })
            
            return foods
            
        except requests.RequestException as e:
            logger.error(f"Erro na API USDA: {str(e)}")
            return []
        except Exception as e:
            logger.error(f"Erro ao buscar alimentos: {str(e)}")
            return []
    
    def get_food_details(self, fdc_id: int) -> Optional[Dict[str, Any]]:
        """Retorna detalhes nutricionais de um alimento"""
        try:
            url = f"{self.config.USDA_BASE_URL}/food/{fdc_id}"
            params = {
                'api_key': self.config.USDA_API_KEY,
                'format': 'full'
            }
            
            response = requests.get(url, params=params, timeout=10)
            response.raise_for_status()
            
            data = response.json()
            
            # Processa nutrientes
            nutrients = {}
            for nutrient in data.get('foodNutrients', []):
                nutrient_name = nutrient.get('nutrientName', '')
                nutrient_value = nutrient.get('value', 0)
                nutrient_unit = nutrient.get('unitName', '')
                
                if nutrient_name and nutrient_value:
                    nutrients[nutrient_name] = {
                        'value': nutrient_value,
                        'unit': nutrient_unit
                    }
            
            return {
                'fdc_id': data.get('fdcId'),
                'name': data.get('description'),
                'brand': data.get('brandOwner'),
                'category': data.get('foodCategory'),
                'nutrients': nutrients,
                'serving_size': data.get('servingSize'),
                'serving_unit': data.get('servingSizeUnit')
            }
            
        except requests.RequestException as e:
            logger.error(f"Erro na API USDA: {str(e)}")
            return None
        except Exception as e:
            logger.error(f"Erro ao buscar detalhes do alimento: {str(e)}")
            return None
    
    def add_food_entry(self, user_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """Adiciona entrada no diário alimentar"""
        try:
            entry_data = {
                'id': generate_uuid(),
                'user_id': user_id,
                'food_name': data['food_name'],
                'quantity': data['quantity'],
                'unit': data['unit'],
                'calories': data.get('calories', 0),
                'protein': data.get('protein', 0),
                'carbs': data.get('carbs', 0),
                'fat': data.get('fat', 0),
                'fiber': data.get('fiber', 0),
                'consumed_at': data.get('entry_date', datetime.now().date().isoformat()),
                'meal_type': data.get('meal_type', 'other'),
                'created_at': datetime.now().isoformat()
            }
            
            result = self.supabase.table('food_diary_entries').insert(entry_data).execute()
            
            if result.data:
                return {'success': True, 'entry': result.data[0]}
            else:
                return {'success': False, 'error': 'Erro ao adicionar entrada'}
                
        except Exception as e:
            logger.error(f"Erro ao adicionar entrada alimentar: {str(e)}")
            return {'success': False, 'error': 'Erro interno do servidor'}
    
    def get_food_entries(self, user_id: str, date: Optional[str] = None, page: int = 1, per_page: int = 20) -> Dict[str, Any]:
        """Retorna entradas do diário alimentar"""
        try:
            query = self.supabase.table('food_diary_entries').select('*').eq('user_id', user_id)
            
            if date:
                query = query.eq('consumed_at', date)
            
            result = query.order('created_at', desc=True).execute()
            
            if result.data:
                # Paginação manual
                start = (page - 1) * per_page
                end = start + per_page
                paginated_data = result.data[start:end]
                
                return {
                    'entries': paginated_data,
                    'pagination': {
                        'page': page,
                        'per_page': per_page,
                        'total': len(result.data),
                        'pages': (len(result.data) + per_page - 1) // per_page
                    }
                }
            else:
                return {
                    'entries': [],
                    'pagination': {
                        'page': page,
                        'per_page': per_page,
                        'total': 0,
                        'pages': 0
                    }
                }
                
        except Exception as e:
            logger.error(f"Erro ao buscar entradas alimentares: {str(e)}")
            return {'error': 'Erro interno do servidor'}
    
    def add_exercise_entry(self, user_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """Adiciona entrada de exercício"""
        try:
            entry_data = {
                'id': generate_uuid(),
                'user_id': user_id,
                'exercise_name': data['exercise_name'],
                'duration': data['duration'],
                'intensity': data.get('intensity', 'moderate'),
                'calories_burned': data.get('calories_burned', 0),
                'exercise_type': data.get('exercise_type', 'other'),
                'entry_date': data.get('entry_date', datetime.now().date().isoformat()),
                'notes': data.get('notes', ''),
                'created_at': datetime.now().isoformat()
            }
            
            result = self.supabase.table('exercise_entries').insert(entry_data).execute()
            
            if result.data:
                return {'success': True, 'entry': result.data[0]}
            else:
                return {'success': False, 'error': 'Erro ao adicionar exercício'}
                
        except Exception as e:
            logger.error(f"Erro ao adicionar exercício: {str(e)}")
            return {'success': False, 'error': 'Erro interno do servidor'}
    
    def get_exercise_entries(self, user_id: str, date: Optional[str] = None, page: int = 1, per_page: int = 20) -> Dict[str, Any]:
        """Retorna entradas de exercícios"""
        try:
            query = self.supabase.table('exercise_entries').select('*').eq('user_id', user_id)
            
            if date:
                query = query.eq('entry_date', date)
            
            result = query.order('created_at', desc=True).execute()
            
            if result.data:
                # Paginação manual
                start = (page - 1) * per_page
                end = start + per_page
                paginated_data = result.data[start:end]
                
                return {
                    'entries': paginated_data,
                    'pagination': {
                        'page': page,
                        'per_page': per_page,
                        'total': len(result.data),
                        'pages': (len(result.data) + per_page - 1) // per_page
                    }
                }
            else:
                return {
                    'entries': [],
                    'pagination': {
                        'page': page,
                        'per_page': per_page,
                        'total': 0,
                        'pages': 0
                    }
                }
                
        except Exception as e:
            logger.error(f"Erro ao buscar exercícios: {str(e)}")
            return {'error': 'Erro interno do servidor'}
    
    def get_health_analytics(self, user_id: str, period_days: int = 30) -> Dict[str, Any]:
        """Retorna analytics de saúde do usuário"""
        try:
            end_date = datetime.now()
            start_date = end_date - timedelta(days=period_days)
            
            # Busca dados do período
            imc_result = self.supabase.table('imc_calculations')\
                .select('*')\
                .eq('user_id', user_id)\
                .gte('created_at', start_date.isoformat())\
                .lte('created_at', end_date.isoformat())\
                .execute()
            
            food_result = self.supabase.table('food_diary_entries')\
                .select('*')\
                .eq('user_id', user_id)\
                .gte('consumed_at', start_date.date().isoformat())\
                .lte('consumed_at', end_date.date().isoformat())\
                .execute()
            
            exercise_result = self.supabase.table('exercise_entries')\
                .select('*')\
                .eq('user_id', user_id)\
                .gte('entry_date', start_date.date().isoformat())\
                .lte('entry_date', end_date.date().isoformat())\
                .execute()
            
            # Calcula métricas
            total_calories_consumed = sum(entry.get('calories', 0) for entry in food_result.data)
            total_calories_burned = sum(entry.get('calories_burned', 0) for entry in exercise_result.data)
            avg_imc = sum(entry.get('imc', 0) for entry in imc_result.data) / len(imc_result.data) if imc_result.data else 0
            
            return {
                'period': {
                    'start_date': start_date.isoformat(),
                    'end_date': end_date.isoformat(),
                    'days': period_days
                },
                'metrics': {
                    'total_imc_calculations': len(imc_result.data),
                    'average_imc': round(avg_imc, 2),
                    'total_food_entries': len(food_result.data),
                    'total_calories_consumed': total_calories_consumed,
                    'total_exercise_entries': len(exercise_result.data),
                    'total_calories_burned': total_calories_burned,
                    'net_calories': total_calories_consumed - total_calories_burned
                },
                'trends': {
                    'imc_trend': self._calculate_trend(imc_result.data, 'imc'),
                    'calories_trend': self._calculate_trend(food_result.data, 'calories')
                }
            }
            
        except Exception as e:
            logger.error(f"Erro ao gerar analytics: {str(e)}")
            return {'error': 'Erro interno do servidor'}
    
    def get_health_goals(self, user_id: str) -> List[Dict[str, Any]]:
        """Retorna metas de saúde do usuário"""
        try:
            result = self.supabase.table('health_goals')\
                .select('*')\
                .eq('user_id', user_id)\
                .eq('active', True)\
                .order('created_at', desc=True)\
                .execute()
            
            return result.data or []
            
        except Exception as e:
            logger.error(f"Erro ao buscar metas: {str(e)}")
            return []
    
    def create_health_goal(self, user_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """Cria nova meta de saúde"""
        try:
            goal_data = {
                'id': generate_uuid(),
                'user_id': user_id,
                'type': data['type'],
                'target_value': data['target_value'],
                'current_value': data.get('current_value', 0),
                'unit': data.get('unit', ''),
                'deadline': data.get('deadline'),
                'description': data.get('description', ''),
                'active': True,
                'created_at': datetime.now().isoformat()
            }
            
            result = self.supabase.table('health_goals').insert(goal_data).execute()
            
            if result.data:
                return {'success': True, 'goal': result.data[0]}
            else:
                return {'success': False, 'error': 'Erro ao criar meta'}
                
        except Exception as e:
            logger.error(f"Erro ao criar meta: {str(e)}")
            return {'success': False, 'error': 'Erro interno do servidor'}
    
    def save_calorie_calculation(self, user_id: str, calculation_data: Dict[str, Any]) -> Dict[str, Any]:
        """Salva cálculo de calorias no banco"""
        try:
            entry_data = {
                'id': generate_uuid(),
                'user_id': user_id,
                'age': calculation_data.get('age'),
                'gender': calculation_data.get('gender'),
                'weight': calculation_data.get('weight'),
                'height': calculation_data.get('height'),
                'activity_level': calculation_data.get('activity_level'),
                'goal': calculation_data.get('goal'),
                'bmr': calculation_data.get('bmr'),
                'tdee': calculation_data.get('tdee'),
                'target_calories': calculation_data.get('target_calories'),
                'deficit': calculation_data.get('deficit', 0),
                'surplus': calculation_data.get('surplus', 0),
                'created_at': datetime.now().isoformat()
            }
            
            result = self.supabase.table('calorie_calculations').insert(entry_data).execute()
            
            if result.data:
                return {'success': True, 'entry': result.data[0]}
            else:
                return {'success': False, 'error': 'Erro ao salvar cálculo'}
                
        except Exception as e:
            logger.error(f"Erro ao salvar cálculo de calorias: {str(e)}")
            return {'success': False, 'error': 'Erro interno do servidor'}

    def get_calorie_history(self, user_id: str, page: int = 1, per_page: int = 20) -> Dict[str, Any]:
        """Retorna histórico de cálculos de calorias"""
        try:
            result = self.supabase.table('calorie_calculations')\
                .select('*')\
                .eq('user_id', user_id)\
                .order('created_at', desc=True)\
                .execute()
            
            if result.data:
                start = (page - 1) * per_page
                end = start + per_page
                paginated_data = result.data[start:end]
                
                return {
                    'calculations': paginated_data,
                    'pagination': {
                        'page': page,
                        'per_page': per_page,
                        'total': len(result.data),
                        'pages': (len(result.data) + per_page - 1) // per_page
                    }
                }
            else:
                return {
                    'calculations': [],
                    'pagination': {
                        'page': page,
                        'per_page': per_page,
                        'total': 0,
                        'pages': 0
                    }
                }
                
        except Exception as e:
            logger.error(f"Erro ao buscar histórico de calorias: {str(e)}")
            return {'error': 'Erro interno do servidor'}

    def save_biological_age_calculation(self, user_id: str, calculation_data: Dict[str, Any]) -> Dict[str, Any]:
        """Salva cálculo de idade biológica no banco"""
        try:
            entry_data = {
                'id': generate_uuid(),
                'user_id': user_id,
                'chronological_age': calculation_data.get('chronological_age'),
                'biological_age': calculation_data.get('biological_age'),
                'age_difference': calculation_data.get('age_difference'),
                'classification': calculation_data.get('classification'),
                'score': calculation_data.get('score'),
                'factors': calculation_data.get('factors', {}),
                'recommendations': calculation_data.get('recommendations', []),
                'created_at': datetime.now().isoformat()
            }
            
            result = self.supabase.table('biological_age_calculations').insert(entry_data).execute()
            
            if result.data:
                return {'success': True, 'entry': result.data[0]}
            else:
                return {'success': False, 'error': 'Erro ao salvar cálculo'}
                
        except Exception as e:
            logger.error(f"Erro ao salvar cálculo de idade biológica: {str(e)}")
            return {'success': False, 'error': 'Erro interno do servidor'}

    def save_hydration_calculation(self, user_id: str, calculation_data: Dict[str, Any]) -> Dict[str, Any]:
        """Salva cálculo de hidratação no banco"""
        try:
            entry_data = {
                'id': generate_uuid(),
                'user_id': user_id,
                'weight': calculation_data.get('weight'),
                'age': calculation_data.get('age'),
                'gender': calculation_data.get('gender'),
                'activity_level': calculation_data.get('activity_level'),
                'climate': calculation_data.get('climate'),
                'exercise_duration': calculation_data.get('exercise_duration', 0),
                'exercise_intensity': calculation_data.get('exercise_intensity'),
                'health_conditions': calculation_data.get('health_conditions', []),
                'total_intake': calculation_data.get('total_intake'),
                'water_intake': calculation_data.get('water_intake'),
                'other_fluids': calculation_data.get('other_fluids'),
                'created_at': datetime.now().isoformat()
            }
            
            result = self.supabase.table('hydration_calculations').insert(entry_data).execute()
            
            if result.data:
                return {'success': True, 'entry': result.data[0]}
            else:
                return {'success': False, 'error': 'Erro ao salvar cálculo'}
                
        except Exception as e:
            logger.error(f"Erro ao salvar cálculo de hidratação: {str(e)}")
            return {'success': False, 'error': 'Erro interno do servidor'}

    def save_metabolism_calculation(self, user_id: str, calculation_data: Dict[str, Any]) -> Dict[str, Any]:
        """Salva cálculo de metabolismo no banco"""
        try:
            entry_data = {
                'id': generate_uuid(),
                'user_id': user_id,
                'age': calculation_data.get('age'),
                'gender': calculation_data.get('gender'),
                'weight': calculation_data.get('weight'),
                'height': calculation_data.get('height'),
                'activity_level': calculation_data.get('activity_level'),
                'bmr': calculation_data.get('bmr'),
                'tdee': calculation_data.get('tdee'),
                'metabolism_type': calculation_data.get('metabolism_type'),
                'recommendations': calculation_data.get('recommendations', []),
                'created_at': datetime.now().isoformat()
            }
            
            result = self.supabase.table('metabolism_calculations').insert(entry_data).execute()
            
            if result.data:
                return {'success': True, 'entry': result.data[0]}
            else:
                return {'success': False, 'error': 'Erro ao salvar cálculo'}
                
        except Exception as e:
            logger.error(f"Erro ao salvar cálculo de metabolismo: {str(e)}")
            return {'success': False, 'error': 'Erro interno do servidor'}

    def save_sleep_calculation(self, user_id: str, calculation_data: Dict[str, Any]) -> Dict[str, Any]:
        """Salva cálculo de sono no banco"""
        try:
            entry_data = {
                'id': generate_uuid(),
                'user_id': user_id,
                'age': calculation_data.get('age'),
                'sleep_duration': calculation_data.get('sleep_duration'),
                'sleep_quality': calculation_data.get('sleep_quality'),
                'bedtime': calculation_data.get('bedtime'),
                'wake_time': calculation_data.get('wake_time'),
                'sleep_efficiency': calculation_data.get('sleep_efficiency'),
                'recommendations': calculation_data.get('recommendations', []),
                'created_at': datetime.now().isoformat()
            }
            
            result = self.supabase.table('sleep_calculations').insert(entry_data).execute()
            
            if result.data:
                return {'success': True, 'entry': result.data[0]}
            else:
                return {'success': False, 'error': 'Erro ao salvar cálculo'}
                
        except Exception as e:
            logger.error(f"Erro ao salvar cálculo de sono: {str(e)}")
            return {'success': False, 'error': 'Erro interno do servidor'}

    def save_stress_calculation(self, user_id: str, calculation_data: Dict[str, Any]) -> Dict[str, Any]:
        """Salva cálculo de estresse no banco"""
        try:
            entry_data = {
                'id': generate_uuid(),
                'user_id': user_id,
                'stress_level': calculation_data.get('stress_level'),
                'stress_score': calculation_data.get('stress_score'),
                'stress_factors': calculation_data.get('stress_factors', []),
                'coping_strategies': calculation_data.get('coping_strategies', []),
                'recommendations': calculation_data.get('recommendations', []),
                'created_at': datetime.now().isoformat()
            }
            
            result = self.supabase.table('stress_calculations').insert(entry_data).execute()
            
            if result.data:
                return {'success': True, 'entry': result.data[0]}
            else:
                return {'success': False, 'error': 'Erro ao salvar cálculo'}
                
        except Exception as e:
            logger.error(f"Erro ao salvar cálculo de estresse: {str(e)}")
            return {'success': False, 'error': 'Erro interno do servidor'}

    def _calculate_trend(self, data: List[Dict[str, Any]], field: str) -> Dict[str, Any]:
        """Calcula tendência dos dados"""
        if not data:
            return {'trend': 'stable', 'change': 0}
        
        sorted_data = sorted(data, key=lambda x: x.get('created_at', ''))
        
        if len(sorted_data) < 2:
            return {'trend': 'stable', 'change': 0}
        
        first_value = sorted_data[0].get(field, 0)
        last_value = sorted_data[-1].get(field, 0)
        
        change = last_value - first_value
        change_percent = (change / first_value * 100) if first_value > 0 else 0
        
        if change_percent > 5:
            trend = 'increasing'
        elif change_percent < -5:
            trend = 'decreasing'
        else:
            trend = 'stable'
        
        return {
            'trend': trend,
            'change': round(change, 2),
            'change_percent': round(change_percent, 2)
        }