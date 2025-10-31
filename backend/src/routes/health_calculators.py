"""
Rotas de Calculadoras de Saúde RE-EDUCA Store.

Fornece calculadoras de saúde incluindo:
- IMC (Índice de Massa Corporal)
- Calorias diárias necessárias
- Hidratação diária recomendada
- Percentual de gordura corporal
- Histórico de cálculos
"""
from flask import Blueprint, request, jsonify
from services.health_calculator_service import HealthCalculatorService
from utils.decorators import token_required, rate_limit, validate_json
from middleware.logging import log_user_activity, log_security_event

health_calculators_bp = Blueprint('health_calculators', __name__)
health_calculator_service = HealthCalculatorService()

@health_calculators_bp.route('/bmi', methods=['POST'])
@token_required
@rate_limit("10 per minute")
@validate_json('height_cm', 'weight_kg')
def calculate_bmi():
    """
    Calcula IMC (Índice de Massa Corporal).
    
    Request Body:
        height_cm (float): Altura em centímetros.
        weight_kg (float): Peso em quilogramas.
        
    Returns:
        JSON: IMC calculado com classificação e recomendações.
    """
    try:
        data = request.get_json()
        user_id = request.current_user['id']
        
        height_cm = float(data['height_cm'])
        weight_kg = float(data['weight_kg'])
        
        result = health_calculator_service.calculate_bmi(height_cm, weight_kg)
        
        if 'error' in result:
            return jsonify({'error': result['error']}), 400
        
        # Salva o cálculo
        save_result = health_calculator_service.save_calculation(
            user_id, 'bmi', data, result
        )
        
        log_user_activity(user_id, 'bmi_calculated', {
            'height_cm': height_cm,
            'weight_kg': weight_kg,
            'bmi': result['bmi']
        })
        
        return jsonify({
            'calculation': result,
            'saved': save_result['success']
        }), 200
        
    except ValueError as e:
        return jsonify({'error': 'Valores inválidos fornecidos'}), 400
    except Exception as e:
        log_security_event('bmi_calculation_error', details={'error': str(e)})
        return jsonify({'error': 'Erro interno do servidor'}), 500

@health_calculators_bp.route('/calories', methods=['POST'])
@token_required
@rate_limit("10 per minute")
@validate_json('age', 'gender', 'height_cm', 'weight_kg', 'activity_level')
def calculate_calories():
    """
    Calcula necessidade calórica diária.
    
    Request Body:
        age (int): Idade em anos.
        gender (str): Gênero ('male' ou 'female').
        height_cm (float): Altura em centímetros.
        weight_kg (float): Peso em quilogramas.
        activity_level (str): Nível de atividade física.
        
    Returns:
        JSON: Calorias diárias com metas de macronutrientes.
    """
    try:
        data = request.get_json()
        user_id = request.current_user['id']
        
        age = int(data['age'])
        gender = data['gender']
        height_cm = float(data['height_cm'])
        weight_kg = float(data['weight_kg'])
        activity_level = data['activity_level']
        
        result = health_calculator_service.calculate_calories(
            age, gender, height_cm, weight_kg, activity_level
        )
        
        if 'error' in result:
            return jsonify({'error': result['error']}), 400
        
        # Salva o cálculo
        save_result = health_calculator_service.save_calculation(
            user_id, 'calories', data, result
        )
        
        log_user_activity(user_id, 'calories_calculated', {
            'age': age,
            'gender': gender,
            'daily_calories': result['daily_calories']
        })
        
        return jsonify({
            'calculation': result,
            'saved': save_result['success']
        }), 200
        
    except ValueError as e:
        return jsonify({'error': 'Valores inválidos fornecidos'}), 400
    except Exception as e:
        log_security_event('calories_calculation_error', details={'error': str(e)})
        return jsonify({'error': 'Erro interno do servidor'}), 500

@health_calculators_bp.route('/hydration', methods=['POST'])
@token_required
@rate_limit("10 per minute")
@validate_json('weight_kg', 'activity_level')
def calculate_hydration():
    """Calcula necessidade de hidratação diária"""
    try:
        data = request.get_json()
        user_id = request.current_user['id']
        
        weight_kg = float(data['weight_kg'])
        activity_level = data['activity_level']
        climate = data.get('climate', 'temperate')
        
        result = health_calculator_service.calculate_hydration(
            weight_kg, activity_level, climate
        )
        
        if 'error' in result:
            return jsonify({'error': result['error']}), 400
        
        # Salva o cálculo
        save_result = health_calculator_service.save_calculation(
            user_id, 'hydration', data, result
        )
        
        log_user_activity(user_id, 'hydration_calculated', {
            'weight_kg': weight_kg,
            'total_water_liters': result['total_water_liters']
        })
        
        return jsonify({
            'calculation': result,
            'saved': save_result['success']
        }), 200
        
    except ValueError as e:
        return jsonify({'error': 'Valores inválidos fornecidos'}), 400
    except Exception as e:
        log_security_event('hydration_calculation_error', details={'error': str(e)})
        return jsonify({'error': 'Erro interno do servidor'}), 500

@health_calculators_bp.route('/body-fat', methods=['POST'])
@token_required
@rate_limit("10 per minute")
@validate_json('age', 'gender', 'height_cm', 'weight_kg', 'waist_cm', 'neck_cm')
def calculate_body_fat():
    """Calcula percentual de gordura corporal"""
    try:
        data = request.get_json()
        user_id = request.current_user['id']
        
        age = int(data['age'])
        gender = data['gender']
        height_cm = float(data['height_cm'])
        weight_kg = float(data['weight_kg'])
        waist_cm = float(data['waist_cm'])
        neck_cm = float(data['neck_cm'])
        
        result = health_calculator_service.calculate_body_fat(
            age, gender, height_cm, weight_kg, waist_cm, neck_cm
        )
        
        if 'error' in result:
            return jsonify({'error': result['error']}), 400
        
        # Salva o cálculo
        save_result = health_calculator_service.save_calculation(
            user_id, 'body_fat', data, result
        )
        
        log_user_activity(user_id, 'body_fat_calculated', {
            'age': age,
            'gender': gender,
            'body_fat_percentage': result['body_fat_percentage']
        })
        
        return jsonify({
            'calculation': result,
            'saved': save_result['success']
        }), 200
        
    except ValueError as e:
        return jsonify({'error': 'Valores inválidos fornecidos'}), 400
    except Exception as e:
        log_security_event('body_fat_calculation_error', details={'error': str(e)})
        return jsonify({'error': 'Erro interno do servidor'}), 500

@health_calculators_bp.route('/activity-levels', methods=['GET'])
@token_required
@rate_limit("30 per minute")
def get_activity_levels():
    """Retorna níveis de atividade disponíveis"""
    try:
        activity_levels = [
            {
                'value': 'sedentary',
                'label': 'Sedentário',
                'description': 'Pouco ou nenhum exercício'
            },
            {
                'value': 'light',
                'label': 'Leve',
                'description': 'Exercício leve 1-3 dias/semana'
            },
            {
                'value': 'moderate',
                'label': 'Moderado',
                'description': 'Exercício moderado 3-5 dias/semana'
            },
            {
                'value': 'active',
                'label': 'Ativo',
                'description': 'Exercício pesado 6-7 dias/semana'
            },
            {
                'value': 'very_active',
                'label': 'Muito Ativo',
                'description': 'Exercício muito pesado, trabalho físico'
            }
        ]
        
        return jsonify({'activity_levels': activity_levels}), 200
        
    except Exception as e:
        return jsonify({'error': 'Erro interno do servidor'}), 500

@health_calculators_bp.route('/climate-types', methods=['GET'])
@token_required
@rate_limit("30 per minute")
def get_climate_types():
    """Retorna tipos de clima disponíveis"""
    try:
        climate_types = [
            {
                'value': 'cold',
                'label': 'Frio',
                'description': 'Temperatura baixa'
            },
            {
                'value': 'temperate',
                'label': 'Temperado',
                'description': 'Temperatura moderada'
            },
            {
                'value': 'hot',
                'label': 'Quente',
                'description': 'Temperatura alta'
            },
            {
                'value': 'very_hot',
                'label': 'Muito Quente',
                'description': 'Temperatura muito alta'
            }
        ]
        
        return jsonify({'climate_types': climate_types}), 200
        
    except Exception as e:
        return jsonify({'error': 'Erro interno do servidor'}), 500