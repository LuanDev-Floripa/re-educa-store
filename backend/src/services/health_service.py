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
from config.settings import get_config
from utils.helpers import generate_uuid, paginate_data
from repositories.health_repository import HealthRepository
from services.base_service import BaseService

logger = logging.getLogger(__name__)


class HealthService(BaseService):
    """
    Service para operações de saúde.

    CORRIGIDO: Agora usa HealthRepository exclusivamente.
    """

    def __init__(self):
        """Inicializa o serviço de saúde."""
        super().__init__()
        self.config = get_config()
        self.repo = HealthRepository()  # Repositório de saúde

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
            # Usa repositório ao invés de acessar Supabase diretamente
            entry = self.repo.save_imc_calculation(user_id, calculation_data)

            if entry:
                return {'success': True, 'entry': entry}
            else:
                return {'success': False, 'error': 'Erro ao salvar cálculo'}

        except Exception as e:
            self.logger.error(f"Erro ao salvar cálculo IMC: {str(e)}")
            return {'success': False, 'error': 'Erro interno do servidor'}

    def get_imc_history(self, user_id: str, page: int = 1, per_page: int = 20) -> Dict[str, Any]:
        """Retorna histórico de cálculos de IMC"""
        try:
            # Usa repositório ao invés de acessar Supabase diretamente
            return self.repo.get_imc_history(user_id, page, per_page)
        except Exception as e:
            self.logger.error(f"Erro ao buscar histórico IMC: {str(e)}")
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
                # Extrai nutrientes principais dos foodNutrients
                nutrients_raw = food.get('foodNutrients', [])
                
                # Mapeia nutrientes por ID (padrão USDA)
                # Energia (kcal): 1008, Proteína: 1003, Carboidrato: 1005, Gordura: 1004, Fibra: 1079
                nutrients_map = {
                    'calories': 1008,  # Energy (kcal)
                    'protein': 1003,   # Protein
                    'carbs': 1005,     # Carbohydrate, by difference
                    'fat': 1004,       # Total lipid (fat)
                    'fiber': 1079,     # Fiber, total dietary
                }
                
                extracted_nutrients = {}
                for nutrient in nutrients_raw:
                    nutrient_id = nutrient.get('nutrientId') or nutrient.get('nutrient', {}).get('id')
                    nutrient_name = nutrient.get('nutrientName') or nutrient.get('nutrient', {}).get('name', '')
                    value = nutrient.get('value') or nutrient.get('amount', 0)
                    unit = nutrient.get('unitName') or nutrient.get('nutrient', {}).get('unitName', '')
                    
                    # Extrai nutrientes principais
                    if nutrient_id == nutrients_map['calories']:
                        extracted_nutrients['calories'] = round(float(value or 0), 1)
                    elif nutrient_id == nutrients_map['protein']:
                        extracted_nutrients['protein'] = round(float(value or 0), 1)
                    elif nutrient_id == nutrients_map['carbs']:
                        extracted_nutrients['carbs'] = round(float(value or 0), 1)
                    elif nutrient_id == nutrients_map['fat']:
                        extracted_nutrients['fat'] = round(float(value or 0), 1)
                    elif nutrient_id == nutrients_map['fiber']:
                        extracted_nutrients['fiber'] = round(float(value or 0), 1)
                    
                    # Salva todos os nutrientes para referência
                    if nutrient_name and value:
                        extracted_nutrients[nutrient_name.lower()] = {
                            'value': value,
                            'unit': unit
                        }
                
                foods.append({
                    'fdc_id': food.get('fdcId'),
                    'name': food.get('description'),
                    'brand': food.get('brandOwner'),
                    'category': food.get('foodCategory', {}).get('description') if isinstance(food.get('foodCategory'), dict) else food.get('foodCategory'),
                    'calories': extracted_nutrients.get('calories', 0),
                    'protein': extracted_nutrients.get('protein', 0),
                    'carbs': extracted_nutrients.get('carbs', 0),
                    'fat': extracted_nutrients.get('fat', 0),
                    'fiber': extracted_nutrients.get('fiber', 0),
                    'nutrients': nutrients_raw,  # Mantém todos os nutrientes originais
                    'serving_size': food.get('servingSize'),
                    'serving_unit': food.get('servingSizeUnit')
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

            # Processa nutrientes e extrai principais
            nutrients = {}
            nutrients_map = {
                'calories': 1008,  # Energy (kcal)
                'protein': 1003,   # Protein
                'carbs': 1005,     # Carbohydrate, by difference
                'fat': 1004,       # Total lipid (fat)
                'fiber': 1079,     # Fiber, total dietary
            }
            
            extracted_nutrients = {}
            for nutrient in data.get('foodNutrients', []):
                nutrient_id = nutrient.get('nutrientId') or (nutrient.get('nutrient', {}).get('id') if isinstance(nutrient.get('nutrient'), dict) else None)
                nutrient_name = nutrient.get('nutrientName') or (nutrient.get('nutrient', {}).get('name', '') if isinstance(nutrient.get('nutrient'), dict) else '')
                nutrient_value = nutrient.get('value') or nutrient.get('amount', 0)
                nutrient_unit = nutrient.get('unitName') or (nutrient.get('nutrient', {}).get('unitName', '') if isinstance(nutrient.get('nutrient'), dict) else '')

                if nutrient_name and nutrient_value:
                    nutrients[nutrient_name] = {
                        'value': nutrient_value,
                        'unit': nutrient_unit,
                        'id': nutrient_id
                    }
                
                # Extrai nutrientes principais
                if nutrient_id == nutrients_map['calories']:
                    extracted_nutrients['calories'] = round(float(nutrient_value or 0), 1)
                elif nutrient_id == nutrients_map['protein']:
                    extracted_nutrients['protein'] = round(float(nutrient_value or 0), 1)
                elif nutrient_id == nutrients_map['carbs']:
                    extracted_nutrients['carbs'] = round(float(nutrient_value or 0), 1)
                elif nutrient_id == nutrients_map['fat']:
                    extracted_nutrients['fat'] = round(float(nutrient_value or 0), 1)
                elif nutrient_id == nutrients_map['fiber']:
                    extracted_nutrients['fiber'] = round(float(nutrient_value or 0), 1)

            return {
                'fdc_id': data.get('fdcId'),
                'name': data.get('description'),
                'brand': data.get('brandOwner'),
                'category': data.get('foodCategory', {}).get('description') if isinstance(data.get('foodCategory'), dict) else data.get('foodCategory'),
                'calories': extracted_nutrients.get('calories', 0),
                'protein': extracted_nutrients.get('protein', 0),
                'carbs': extracted_nutrients.get('carbs', 0),
                'fat': extracted_nutrients.get('fat', 0),
                'fiber': extracted_nutrients.get('fiber', 0),
                'nutrients': nutrients,  # Todos os nutrientes
                'serving_size': data.get('servingSize'),
                'serving_unit': data.get('servingSizeUnit')
            }

        except requests.RequestException as e:
            logger.error(f"Erro na API USDA: {str(e)}")
            return None
        except Exception as e:
            self.logger.error(f"Erro ao buscar detalhes do alimento: {str(e)}")
            return None

    def add_food_entry(self, user_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """Adiciona entrada de alimento - usa repositório"""
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
                'consumed_at': data.get('entry_date', datetime.now().isoformat()) if data.get('entry_date') else datetime.now().isoformat(),
                'meal_type': data.get('meal_type', 'other'),
                'created_at': datetime.now().isoformat()
            }

            # ✅ CORRIGIDO: Usa repositório
            entry = self.repo.add_food_entry(user_id, entry_data)

            if entry:
                return {'success': True, 'entry': entry}
            else:
                return {'success': False, 'error': 'Erro ao adicionar entrada'}

        except Exception as e:
            self.logger.error(f"Erro ao adicionar entrada alimentar: {str(e)}")
            return {'success': False, 'error': 'Erro interno do servidor'}

    def get_food_entries(self,
        user_id: str, date: Optional[str] = None, page: int = 1, per_page: int = 20) -> Dict[str, Any]:
        """
        Retorna entradas do diário alimentar.

        CORRIGIDO: Agora usa HealthRepository.
        """
        try:
            # ✅ CORRIGIDO: Usa repositório
            entries = self.repo.get_food_entries(user_id, date=date, page=page, per_page=per_page)

            # Reformatar para compatibilidade (repositório retorna lista, service retorna dict com paginação)
            # TODO: Melhorar repositório para retornar paginação
            total = len(entries) if isinstance(entries, list) else 0

            return {
                'entries': entries if isinstance(entries, list) else [],
                'pagination': {
                    'page': page,
                    'per_page': per_page,
                    'total': total,
                    'pages': (total + per_page - 1) // per_page if total > 0 else 0
                }
            }

        except Exception as e:
            self.logger.error(f"Erro ao buscar entradas alimentares: {str(e)}")
            return {'error': 'Erro interno do servidor'}

    def delete_food_entry(self, user_id: str, entry_id: str) -> Dict[str, Any]:
        """
        Deleta entrada do diário alimentar.
        
        Args:
            user_id: ID do usuário
            entry_id: ID da entrada
            
        Returns:
            Dict com sucesso ou erro
        """
        try:
            # ✅ CORRIGIDO: Usa repositório
            deleted = self.repo.delete_food_entry(user_id, entry_id)
            
            if deleted:
                return {'success': True}
            else:
                return {'success': False, 'error': 'Entrada não encontrada ou sem permissão'}
                
        except Exception as e:
            self.logger.error(f"Erro ao deletar entrada alimentar: {str(e)}")
            return {'success': False, 'error': 'Erro interno do servidor'}

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

            # ✅ CORRIGIDO: Usa repositório
            entry = self.repo.add_exercise_entry(user_id, entry_data)

            if entry:
                return {'success': True, 'entry': entry}
            else:
                return {'success': False, 'error': 'Erro ao adicionar exercício'}

        except Exception as e:
            self.logger.error(f"Erro ao adicionar exercício: {str(e)}")
            return {'success': False, 'error': 'Erro interno do servidor'}

    def get_exercise_entries(self,
        user_id: str, date: Optional[str] = None, page: int = 1, per_page: int = 20) -> Dict[str, Any]:
        """
        Retorna entradas de exercícios.

        CORRIGIDO: Agora usa HealthRepository.
        """
        try:
            # ✅ CORRIGIDO: Usa repositório
            entries = self.repo.get_exercise_entries(user_id, date=date, page=page, per_page=per_page)

            # Reformatar para compatibilidade
            total = len(entries) if isinstance(entries, list) else 0

            return {
                'entries': entries if isinstance(entries, list) else [],
                'pagination': {
                    'page': page,
                    'per_page': per_page,
                    'total': total,
                    'pages': (total + per_page - 1) // per_page if total > 0 else 0
                }
            }

        except Exception as e:
            self.logger.error(f"Erro ao buscar entradas de exercício: {str(e)}")
            return {'error': 'Erro interno do servidor'}

    def get_health_analytics(self, user_id: str, period_days: int = 30) -> Dict[str, Any]:
        """Retorna analytics de saúde do usuário"""
        try:
            end_date = datetime.now()
            start_date = end_date - timedelta(days=period_days)

            # ✅ CORRIGIDO: Busca dados do período via repositório
            imc_history = self.repo.get_imc_history(user_id, page=1, per_page=1000)
            imc_data = imc_history.get('entries', []) if isinstance(imc_history, dict) else []
            # Filtra por período
            imc_result_data = [
                entry for entry in imc_data
                if start_date.isoformat() <= entry.get('created_at', '') <=
                end_date.isoformat()
            ]

            # ✅ CORRIGIDO: Usa repositório para food entries
            food_entries = self.repo.get_food_entries(user_id, page=1, per_page=1000)
            food_data = food_entries if isinstance(food_entries, list) else []

            # ✅ CORRIGIDO: Usa repositório para exercise entries
            exercise_entries = self.repo.get_exercise_entries(user_id, page=1, per_page=1000)
            exercise_data = exercise_entries if isinstance(exercise_entries, list) else []

            # Calcula métricas
            total_calories_consumed = sum(entry.get('calories', 0) for entry in food_data)
            total_calories_burned = sum(entry.get('calories_burned', 0) for entry in exercise_data)
            avg_imc = (
                sum(entry.get('imc', 0) for entry in imc_result_data) /
                len(imc_result_data) if imc_result_data else 0
            )

            return {
                'period': {
                    'start_date': start_date.isoformat(),
                    'end_date': end_date.isoformat(),
                    'days': period_days
                },
                'metrics': {
                    'total_imc_calculations': len(imc_result_data),
                    'average_imc': round(avg_imc, 2),
                    'total_food_entries': len(food_data),
                    'total_calories_consumed': total_calories_consumed,
                    'total_exercise_entries': len(exercise_data),
                    'total_calories_burned': total_calories_burned,
                    'net_calories': total_calories_consumed - total_calories_burned
                },
                'trends': {
                    'imc_trend': self._calculate_trend(imc_result_data, 'imc'),
                    'calories_trend': self._calculate_trend(food_data, 'calories')
                }
            }

        except Exception as e:
            self.logger.error(f"Erro ao gerar analytics: {str(e)}")
            return {'error': 'Erro interno do servidor'}

    def get_health_goals(self, user_id: str) -> List[Dict[str, Any]]:
        """
        Retorna metas de saúde do usuário.

        CORRIGIDO: Usa repositório quando método estiver disponível.
        Por enquanto, mantém direto já que repositório não tem método específico ainda.
        """
        try:
            # ✅ CORRIGIDO: Usa GoalRepository
            from repositories.goal_repository import GoalRepository
            goal_repo = GoalRepository()
            # Nota: health_goals pode ser diferente de user_goals
            # Por enquanto usa GoalRepository, pode precisar de ajuste se tabelas forem diferentes
            return goal_repo.find_active_by_user(user_id)

        except Exception as e:
            self.logger.error(f"Erro ao buscar metas: {str(e)}")
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

            # ✅ CORRIGIDO: Usa repositório
            goal = self.repo.save_goal(user_id, goal_data)

            if goal:
                return {'success': True, 'goal': goal}
            else:
                return {'success': False, 'error': 'Erro ao criar meta'}

        except Exception as e:
            logger.error(f"Erro ao criar meta: {str(e)}")
            return {'success': False, 'error': 'Erro interno do servidor'}

    def save_calorie_calculation(self, user_id: str, calculation_data: Dict[str, Any]) -> Dict[str, Any]:
        """Salva cálculo de calorias - usa repositório"""
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

            # ✅ CORRIGIDO: Usa repositório
            entry = self.repo.save_calorie_calculation(user_id, entry_data)

            if entry:
                return {'success': True, 'entry': entry}
            else:
                return {'success': False, 'error': 'Erro ao salvar cálculo'}

        except Exception as e:
            self.logger.error(f"Erro ao salvar cálculo de calorias: {str(e)}")
            return {'success': False, 'error': 'Erro interno do servidor'}

    def get_calorie_history(self, user_id: str, page: int = 1, per_page: int = 20) -> Dict[str, Any]:
        """
        Retorna histórico de cálculos de calorias.

        CORRIGIDO: Agora usa HealthRepository.
        """
        try:
            # ✅ CORRIGIDO: Usa repositório
            return self.repo.get_calorie_history(user_id, page, per_page)

        except Exception as e:
            self.logger.error(f"Erro ao buscar histórico de calorias: {str(e)}")
            return {'error': 'Erro interno do servidor'}

    def calculate_biological_age(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Calcula idade biológica baseada em múltiplos fatores.

        Args:
            data: Dados do usuário incluindo idade, fatores de saúde, etc.

        Returns:
            Dict com idade biológica calculada, diferença, classificação e score.
        """
        try:
            chronological_age = int(data.get('age', 30))
            age_adjustment = 0

            # Fatores de fitness
            fitness_factors = {
                'cardiovascularFitness': {'poor': 3, 'below_average': 2, 'average': 0, 'good': -1, 'excellent': -2},
                'strength': {'poor': 2, 'below_average': 1, 'average': 0, 'good': -1, 'excellent': -2},
                'endurance': {'poor': 2, 'below_average': 1, 'average': 0, 'good': -1, 'excellent': -2},
                'flexibility': {'poor': 1, 'below_average': 0.5, 'average': 0, 'good': -0.5, 'excellent': -1},
                'balance': {'poor': 1, 'below_average': 0.5, 'average': 0, 'good': -0.5, 'excellent': -1},
            }

            for factor_key, factor_values in fitness_factors.items():
                value = data.get('factors', {}).get(factor_key)
                if value and value in factor_values:
                    age_adjustment += factor_values[value]

            # Fatores de estilo de vida
            lifestyle_factors = {
                'sleepQuality': {'poor': 2, 'fair': 1, 'good': 0, 'excellent': -1},
                'dietQuality': {'poor': 2, 'fair': 1, 'good': 0, 'excellent': -1},
                'hydration': {'poor': 1, 'fair': 0.5, 'good': 0, 'excellent': -0.5},
                'exerciseFrequency': {'poor': 3, 'below_average': 1.5, 'average': 0, 'good': -1.5, 'excellent': -3},
            }

            for factor_key, factor_values in lifestyle_factors.items():
                value = data.get('factors', {}).get(factor_key)
                if value and value in factor_values:
                    age_adjustment += factor_values[value]

            # Estresse
            stress_levels = {'low': -0.5, 'moderate': 0, 'high': 1.5, 'severe': 3}
            stress_level = data.get('factors', {}).get('stressLevel')
            if stress_level and stress_level in stress_levels:
                age_adjustment += stress_levels[stress_level]

            # Tabagismo e álcool
            smoking = data.get('factors', {}).get('smoking', 'never')
            if smoking == 'yes':
                age_adjustment += 5
            elif smoking == 'former':
                age_adjustment += 2

            alcohol = data.get('factors', {}).get('alcohol', 'none')
            if alcohol == 'heavy':
                age_adjustment += 3
            elif alcohol == 'moderate':
                age_adjustment += 1

            # Doenças crônicas
            chronic_diseases = data.get('chronicDiseases', [])
            disease_factors = {
                'diabetes': 3, 'hypertension': 2, 'heart_disease': 4, 'cancer': 5,
                'arthritis': 1, 'osteoporosis': 2, 'depression': 1, 'anxiety': 1
            }
            for disease in chronic_diseases:
                if disease in disease_factors:
                    age_adjustment += disease_factors[disease]

            # Medicamentos
            medications = data.get('medications', [])
            for medication in medications:
                age_adjustment += 0.5  # Cada medicamento adiciona um pouco

            # Histórico familiar
            family_history = data.get('familyHistory', [])
            age_adjustment += len(family_history) * 1.5

            # Biomarcadores
            biomarkers = data.get('biomarkers', {})
            body_fat = biomarkers.get('bodyFat')
            if body_fat:
                body_fat_value = float(body_fat)
                if body_fat_value > 25:
                    age_adjustment += (body_fat_value - 25) * 0.2
                elif body_fat_value < 10:
                    age_adjustment -= (10 - body_fat_value) * 0.1

            muscle_mass = biomarkers.get('muscleMass')
            gender = data.get('gender', 'male')
            if muscle_mass:
                muscle_mass_value = float(muscle_mass)
                expected_muscle_mass = 40 if gender == 'male' else 30
                if muscle_mass_value < expected_muscle_mass:
                    age_adjustment += (expected_muscle_mass - muscle_mass_value) * 0.1
                elif muscle_mass_value > expected_muscle_mass + 5:
                    age_adjustment -= (muscle_mass_value - expected_muscle_mass - 5) * 0.05

            # Outros biomarcadores
            biomarker_factors = {
                'bloodPressure': {'high': 3, 'normal': -1},
                'cholesterol': {'high': 2, 'normal': -1},
                'bloodSugar': {'high': 3, 'normal': -1},
                'inflammation': {'high': 2, 'low': -1},
                'vitaminD': {'low': 1, 'optimal': -1},
                'omega3': {'low': 1, 'optimal': -1},
            }

            for biomarker_key, biomarker_values in biomarker_factors.items():
                value = biomarkers.get(biomarker_key)
                if value and value in biomarker_values:
                    age_adjustment += biomarker_values[value]

            # Calcula idade biológica
            biological_age = chronological_age + age_adjustment
            age_difference = biological_age - chronological_age

            # Classificação
            if age_difference <= -5:
                classification = 'Muito Jovem'
            elif age_difference <= -2:
                classification = 'Jovem'
            elif age_difference >= 5:
                classification = 'Envelhecido'
            elif age_difference >= 2:
                classification = 'Ligeiramente Envelhecido'
            else:
                classification = 'Normal'

            # Score (0-100)
            score = max(0, min(100, 100 - (age_difference * 2)))

            # Gera recomendações
            recommendations = self._generate_biological_age_recommendations(
                age_difference, chronic_diseases, data.get('lifestyleFactors', []),
                data.get('factors', {}).get('cardiovascularFitness'),
                data.get('factors', {}).get('strength'),
                data.get('factors', {}).get('sleepQuality'),
                data.get('factors', {}).get('dietQuality'),
            )

            return {
                'chronological_age': chronological_age,
                'biological_age': round(biological_age, 1),
                'age_difference': round(age_difference, 1),
                'classification': classification,
                'score': round(score, 1),
                'recommendations': recommendations,
                'factors_used': {
                    'fitness': data.get('factors', {}).get('cardiovascularFitness'),
                    'strength': data.get('factors', {}).get('strength'),
                    'sleep': data.get('factors', {}).get('sleepQuality'),
                    'diet': data.get('factors', {}).get('dietQuality'),
                }
            }

        except Exception as e:
            logger.error(f"Erro ao calcular idade biológica: {str(e)}")
            return {'error': 'Erro ao calcular idade biológica'}

    def _generate_biological_age_recommendations(
        self, age_difference, diseases, lifestyle, cardio, strength, sleep, diet
    ) -> List[Dict[str, str]]:
        """Gera recomendações baseadas no cálculo"""
        recommendations = []

        if age_difference > 0:
            recommendations.append({
                'type': 'warning',
                'title': 'Envelhecimento Acelerado',
                'message': 'Sua idade biológica está acima da cronológica. Foque em melhorar hábitos de vida.'
            })
        elif age_difference < -2:
            recommendations.append({
                'type': 'success',
                'title': 'Envelhecimento Lento',
                'message': 'Excelente! Continue mantendo seus hábitos saudáveis.'
            })

        if cardio in ['poor', 'below_average']:
            recommendations.append({
                'type': 'error',
                'title': 'Fitness Cardiovascular',
                'message': 'Melhore sua condição cardiovascular com exercícios aeróbicos regulares.'
            })

        if strength in ['poor', 'below_average']:
            recommendations.append({
                'type': 'warning',
                'title': 'Força Muscular',
                'message': 'Inclua treino de força para manter a massa muscular e densidade óssea.'
            })

        if sleep in ['poor', 'fair']:
            recommendations.append({
                'type': 'warning',
                'title': 'Qualidade do Sono',
                'message': 'Melhore sua higiene do sono para otimizar a recuperação e regeneração celular.'
            })

        if diet in ['poor', 'fair']:
            recommendations.append({
                'type': 'warning',
                'title': 'Qualidade da Dieta',
                'message': 'Adote uma dieta rica em antioxidantes, ômega-3 e nutrientes anti-inflamatórios.'
            })

        if diseases and len(diseases) > 0:
            recommendations.append({
                'type': 'error',
                'title': 'Doenças Crônicas',
                'message': 'Trabalhe com profissionais de saúde para gerenciar suas condições médicas.'
            })

        if 'smoking' in lifestyle:
            recommendations.append({
                'type': 'error',
                'title': 'Tabagismo',
                'message': 'Parar de fumar é uma das melhores coisas que você pode fazer para sua saúde.'
            })

        if 'sedentary' in lifestyle:
            recommendations.append({
                'type': 'warning',
                'title': 'Vida Sedentária',
                'message': 'Aumente sua atividade física diária. Mesmo pequenas mudanças fazem diferença.'
            })

        recommendations.append({
            'type': 'info',
            'title': 'Dica Geral',
            'message': 'O envelhecimento saudável é um processo contínuo. Pequenas melhorias diárias têm grande impacto a longo prazo.'
        })

        return recommendations

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
                'factors': calculation_data.get('factors_used', {}),
                'recommendations': calculation_data.get('recommendations', []),
                'created_at': datetime.now().isoformat()
            }

            # ✅ CORRIGIDO: Usa HealthRepository
            entry = self.repo.create_biological_age_calculation(entry_data)

            if entry:
                return {'success': True, 'entry': entry}
            else:
                return {'success': False, 'error': 'Erro ao salvar cálculo'}

        except Exception as e:
            self.logger.error(f"Erro ao salvar cálculo de idade biológica: {str(e)}")
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

            # ✅ CORRIGIDO: Usa HealthRepository
            entry = self.repo.create_hydration_calculation(entry_data)

            if entry:
                return {'success': True, 'entry': entry}
            else:
                return {'success': False, 'error': 'Erro ao salvar cálculo'}

        except Exception as e:
            logger.error(f"Erro ao salvar cálculo de hidratação: {str(e)}")
            return {'success': False, 'error': 'Erro interno do servidor'}

    def save_metabolism_calculation(self, user_id: str, calculation_data: Dict[str, Any]) -> Dict[str, Any]:
        """Salva cálculo de metabolismo no banco - usa tabela específica"""
        try:
            entry_data = {
                'id': generate_uuid(),
                'user_id': user_id,
                'age': calculation_data.get('age'),
                'gender': calculation_data.get('gender'),
                'weight': calculation_data.get('weight'),
                'height': calculation_data.get('height'),  # Em metros
                'activity_level': calculation_data.get('activity_level'),
                'bmr': calculation_data.get('bmr'),
                'tdee': calculation_data.get('tdee'),
                'metabolism_type': calculation_data.get('metabolism_type'),
                'recommendations': calculation_data.get('recommendations', []),
                'created_at': datetime.now().isoformat()
            }

            # ✅ CORRIGIDO: Usa tabela específica metabolism_calculations
            entry = self.repo.create_metabolism_calculation(entry_data)

            if entry:
                return {'success': True, 'entry': entry}
            else:
                return {'success': False, 'error': 'Erro ao salvar cálculo'}

        except Exception as e:
            logger.error(f"Erro ao salvar cálculo de metabolismo: {str(e)}")
            return {'success': False, 'error': 'Erro interno do servidor'}

    def save_sleep_calculation(self, user_id: str, calculation_data: Dict[str, Any]) -> Dict[str, Any]:
        """Salva cálculo de sono no banco - usa tabela específica"""
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

            # ✅ CORRIGIDO: Usa tabela específica sleep_calculations
            entry = self.repo.create_sleep_calculation(entry_data)
            if entry:
                return {'success': True, 'entry': entry}
            else:
                return {'success': False, 'error': 'Erro ao salvar cálculo'}

        except Exception as e:
            logger.error(f"Erro ao salvar cálculo de sono: {str(e)}")
            return {'success': False, 'error': 'Erro interno do servidor'}

    def get_biological_age_history(self,
        user_id: str, page: int = 1, per_page: int = 20, start_date: Optional[str] = None, end_date: Optional[str] = None) -> Dict[str, Any]:
        """
        Retorna histórico de cálculos de idade biológica.

        CORRIGIDO: Agora usa HealthRepository com método específico para tabela biological_age_calculations.
        """
        try:
            # ✅ CORRIGIDO: Usa método específico que busca da tabela correta
            return self.repo.get_biological_age_history(user_id, page, per_page, start_date, end_date)
        except Exception as e:
            self.logger.error(f"Erro ao buscar histórico de idade biológica: {str(e)}")
            return {'error': 'Erro interno do servidor'}

    def get_metabolism_history(self,
        user_id: str, page: int = 1, per_page: int = 20, start_date: Optional[str] = None, end_date: Optional[str] = None) -> Dict[str, Any]:
        """
        Retorna histórico de cálculos de metabolismo.

        CORRIGIDO: Agora usa HealthRepository com método específico para tabela metabolism_calculations.
        """
        try:
            # ✅ CORRIGIDO: Usa método específico que busca da tabela correta
            return self.repo.get_metabolism_history(user_id, page, per_page, start_date, end_date)
        except Exception as e:
            self.logger.error(f"Erro ao buscar histórico de metabolismo: {str(e)}")
            return {'error': 'Erro interno do servidor'}

    def get_sleep_history(self,
        user_id: str, page: int = 1, per_page: int = 20, start_date: Optional[str] = None, end_date: Optional[str] = None) -> Dict[str, Any]:
        """
        Retorna histórico de cálculos de sono.

        CORRIGIDO: Agora usa HealthRepository.
        """
        try:
            # ✅ CORRIGIDO: Usa repositório
            return self.repo.get_calculation_history('sleep', user_id, page, per_page, start_date, end_date)
        except Exception as e:
            self.logger.error(f"Erro ao buscar histórico de sono: {str(e)}")
            return {'error': 'Erro interno do servidor'}

    def get_stress_history(self,
        user_id: str, page: int = 1, per_page: int = 20, start_date: Optional[str] = None, end_date: Optional[str] = None) -> Dict[str, Any]:
        """
        Retorna histórico de cálculos de estresse.

        CORRIGIDO: Agora usa HealthRepository com método específico para tabela stress_calculations.
        """
        try:
            # ✅ CORRIGIDO: Usa método específico que busca da tabela correta
            return self.repo.get_stress_history(user_id, page, per_page, start_date, end_date)
        except Exception as e:
            self.logger.error(f"Erro ao buscar histórico de estresse: {str(e)}")
            return {'error': 'Erro interno do servidor'}

    def get_hydration_history(self,
        user_id: str, page: int = 1, per_page: int = 20, start_date: Optional[str] = None, end_date: Optional[str] = None) -> Dict[str, Any]:
        """
        Retorna histórico de cálculos de hidratação.

        CORRIGIDO: Agora usa HealthRepository com método específico para tabela hydration_calculations.
        """
        try:
            # ✅ CORRIGIDO: Usa método específico que busca da tabela correta
            return self.repo.get_hydration_history(user_id, page, per_page, start_date, end_date)
        except Exception as e:
            self.logger.error(f"Erro ao buscar histórico de hidratação: {str(e)}")
            return {'error': 'Erro interno do servidor'}

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

            # ✅ CORRIGIDO: Usa repositório
            entry = self.repo.save_calculation('stress', user_id, entry_data)

            if entry:
                return {'success': True, 'entry': entry}
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
