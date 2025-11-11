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
from utils.decorators import token_required, validate_json
from utils.rate_limit_helper import rate_limit
from utils.exception_strategies import handle_route_exceptions
from exceptions.custom_exceptions import ValidationError, InternalServerError
from middleware.logging import log_user_activity, log_security_event
import logging

logger = logging.getLogger(__name__)

health_calculators_bp = Blueprint('health_calculators', __name__)
health_calculator_service = HealthCalculatorService()

@health_calculators_bp.route('/bmi', methods=['POST'])
@token_required
@rate_limit("10 per minute")
@validate_json('height_cm', 'weight_kg')
@handle_route_exceptions
def calculate_bmi():
    """
    Calcula IMC (Índice de Massa Corporal).
    
    Implementa tratamento robusto de exceções e validação de dados.

    Request Body:
        height_cm (float): Altura em centímetros.
        weight_kg (float): Peso em quilogramas.

    Returns:
        JSON: IMC calculado com classificação e recomendações.
    """
    data = request.get_json()
    user_id = request.current_user['id']

    try:
        height_cm = float(data['height_cm'])
        if height_cm <= 0 or height_cm > 300:
            raise ValidationError("height_cm deve estar entre 0 e 300 cm")
    except (ValueError, TypeError):
        raise ValidationError("height_cm deve ser um número válido")
    
    try:
        weight_kg = float(data['weight_kg'])
        if weight_kg <= 0 or weight_kg > 500:
            raise ValidationError("weight_kg deve estar entre 0 e 500 kg")
    except (ValueError, TypeError):
        raise ValidationError("weight_kg deve ser um número válido")

    result = health_calculator_service.calculate_bmi(height_cm, weight_kg)

    if 'error' in result:
        raise ValidationError(result['error'])

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

@health_calculators_bp.route('/calories', methods=['POST'])
@token_required
@rate_limit("10 per minute")
@validate_json('age', 'gender', 'height_cm', 'weight_kg', 'activity_level')
@handle_route_exceptions
def calculate_calories():
    """
    Calcula necessidade calórica diária.
    
    Implementa tratamento robusto de exceções e validação de dados.

    Request Body:
        age (int): Idade em anos.
        gender (str): Gênero ('male' ou 'female').
        height_cm (float): Altura em centímetros.
        weight_kg (float): Peso em quilogramas.
        activity_level (str): Nível de atividade física.

    Returns:
        JSON: Calorias diárias com metas de macronutrientes.
    """
    data = request.get_json()
    user_id = request.current_user['id']

    try:
        age = int(data['age'])
        if age < 1 or age > 150:
            raise ValidationError("age deve estar entre 1 e 150 anos")
    except (ValueError, TypeError):
        raise ValidationError("age deve ser um número válido")
    
    gender = data['gender']
    valid_genders = ['male', 'female']
    if gender not in valid_genders:
        raise ValidationError(f'gender deve ser um dos: {", ".join(valid_genders)}')
    
    try:
        height_cm = float(data['height_cm'])
        if height_cm <= 0 or height_cm > 300:
            raise ValidationError("height_cm deve estar entre 0 e 300 cm")
    except (ValueError, TypeError):
        raise ValidationError("height_cm deve ser um número válido")
    
    try:
        weight_kg = float(data['weight_kg'])
        if weight_kg <= 0 or weight_kg > 500:
            raise ValidationError("weight_kg deve estar entre 0 e 500 kg")
    except (ValueError, TypeError):
        raise ValidationError("weight_kg deve ser um número válido")
    
    activity_level = data['activity_level']
    valid_levels = ['sedentary', 'light', 'moderate', 'active', 'very_active']
    if activity_level not in valid_levels:
        raise ValidationError(f'activity_level deve ser um dos: {", ".join(valid_levels)}')

    result = health_calculator_service.calculate_calories(
        age, gender, height_cm, weight_kg, activity_level
    )

    if 'error' in result:
        raise ValidationError(result['error'])

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

@health_calculators_bp.route('/hydration', methods=['POST'])
@token_required
@rate_limit("10 per minute")
@validate_json('weight_kg', 'activity_level')
@handle_route_exceptions
def calculate_hydration():
    """
    Calcula necessidade de hidratação diária.
    
    Implementa tratamento robusto de exceções e validação de dados.
    """
    data = request.get_json()
    user_id = request.current_user['id']

    try:
        weight_kg = float(data['weight_kg'])
        if weight_kg <= 0 or weight_kg > 500:
            raise ValidationError("weight_kg deve estar entre 0 e 500 kg")
    except (ValueError, TypeError):
        raise ValidationError("weight_kg deve ser um número válido")
    
    activity_level = data['activity_level']
    valid_levels = ['sedentary', 'light', 'moderate', 'active', 'very_active']
    if activity_level not in valid_levels:
        raise ValidationError(f'activity_level deve ser um dos: {", ".join(valid_levels)}')
    
    climate = data.get('climate', 'temperate')
    valid_climates = ['cold', 'temperate', 'hot', 'very_hot']
    if climate not in valid_climates:
        raise ValidationError(f'climate deve ser um dos: {", ".join(valid_climates)}')

    result = health_calculator_service.calculate_hydration(
        weight_kg, activity_level, climate
    )

    if 'error' in result:
        raise ValidationError(result['error'])

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

@health_calculators_bp.route('/body-fat', methods=['POST'])
@token_required
@rate_limit("10 per minute")
@validate_json('age', 'gender', 'height_cm', 'weight_kg', 'waist_cm', 'neck_cm')
@handle_route_exceptions
def calculate_body_fat():
    """
    Calcula percentual de gordura corporal.
    
    Implementa tratamento robusto de exceções e validação de dados.
    """
    data = request.get_json()
    user_id = request.current_user['id']

    try:
        age = int(data['age'])
        if age < 1 or age > 150:
            raise ValidationError("age deve estar entre 1 e 150 anos")
    except (ValueError, TypeError):
        raise ValidationError("age deve ser um número válido")
    
    gender = data['gender']
    valid_genders = ['male', 'female']
    if gender not in valid_genders:
        raise ValidationError(f'gender deve ser um dos: {", ".join(valid_genders)}')
    
    try:
        height_cm = float(data['height_cm'])
        if height_cm <= 0 or height_cm > 300:
            raise ValidationError("height_cm deve estar entre 0 e 300 cm")
    except (ValueError, TypeError):
        raise ValidationError("height_cm deve ser um número válido")
    
    try:
        weight_kg = float(data['weight_kg'])
        if weight_kg <= 0 or weight_kg > 500:
            raise ValidationError("weight_kg deve estar entre 0 e 500 kg")
    except (ValueError, TypeError):
        raise ValidationError("weight_kg deve ser um número válido")
    
    try:
        waist_cm = float(data['waist_cm'])
        if waist_cm <= 0 or waist_cm > 200:
            raise ValidationError("waist_cm deve estar entre 0 e 200 cm")
    except (ValueError, TypeError):
        raise ValidationError("waist_cm deve ser um número válido")
    
    try:
        neck_cm = float(data['neck_cm'])
        if neck_cm <= 0 or neck_cm > 100:
            raise ValidationError("neck_cm deve estar entre 0 e 100 cm")
    except (ValueError, TypeError):
        raise ValidationError("neck_cm deve ser um número válido")

    result = health_calculator_service.calculate_body_fat(
        age, gender, height_cm, weight_kg, waist_cm, neck_cm
    )

    if 'error' in result:
        raise ValidationError(result['error'])

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

@health_calculators_bp.route('/activity-levels', methods=['GET'])
@token_required
@rate_limit("30 per minute")
@handle_route_exceptions
def get_activity_levels():
    """
    Retorna níveis de atividade disponíveis.
    
    Implementa tratamento robusto de exceções e validação de dados.
    """
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

@health_calculators_bp.route('/climate-types', methods=['GET'])
@token_required
@rate_limit("30 per minute")
@handle_route_exceptions
def get_climate_types():
    """
    Retorna tipos de clima disponíveis.
    
    Implementa tratamento robusto de exceções e validação de dados.
    """
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
