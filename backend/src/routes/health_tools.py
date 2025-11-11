"""
Rotas de ferramentas de saúde RE-EDUCA Store.

Endpoints para calculadoras e ferramentas de saúde incluindo:
- Cálculo de IMC (público e autenticado)
- Cálculo de calorias (TMB, TDEE)
- Macronutrientes (proteínas, carbos, gorduras)
- Hidratação diária
- Idade biológica
- Análise de sono
- Níveis de estresse
- Integração com APIs externas (USDA, nutrition APIs)

NOTA: Alguns endpoints são públicos para atrair usuários.
"""
from flask import Blueprint, request, jsonify
from services.health_service import HealthService
from utils.decorators import token_required, log_activity, premium_required
from utils.rate_limit_helper import rate_limit
from utils.exception_strategies import handle_route_exceptions
from utils.validators import health_data_validator
from utils.helpers import calculate_imc, calculate_calories, calculate_macros
from utils.sanitizers import sanitize_dict, sanitize_pagination_params
from middleware.logging import log_user_activity
from exceptions.custom_exceptions import ValidationError, NotFoundError
import logging

health_tools_bp = Blueprint('health_tools', __name__)
health_service = HealthService()

logger = logging.getLogger(__name__)


def _generate_hydration_recommendations(conditions, pregnancy, breastfeeding, exercise_duration):
    """
    Gera recomendações personalizadas de hidratação baseadas em condições de saúde.

    Args:
        conditions: Lista de condições de saúde
        pregnancy: Se está grávida
        breastfeeding: Se está amamentando
        exercise_duration: Duração do exercício em minutos

    Returns:
        Lista de recomendações formatadas
    """
    recommendations = []

    if 'diabetes' in conditions:
        recommendations.append({
            'type': 'warning',
            'title': 'Diabetes',
            'message': 'Monitore a glicemia e beba água regularmente para evitar picos de açúcar no sangue'
        })

    if 'kidney_disease' in conditions:
        recommendations.append({
            'type': 'error',
            'title': 'Doença Renal',
            'message': 'Consulte seu médico para determinar a quantidade ideal de líquidos'
        })

    if 'heart_disease' in conditions:
        recommendations.append({
            'type': 'warning',
            'title': 'Doença Cardíaca',
            'message': 'Evite excesso de líquidos e monitore a pressão arterial'
        })

    if pregnancy:
        recommendations.append({
            'type': 'info',
            'title': 'Gravidez',
            'message': 'Aumente a ingestão de água para apoiar o desenvolvimento do bebê e prevenir infecções urinárias'
        })

    if breastfeeding:
        recommendations.append({
            'type': 'info',
            'title': 'Amamentação',
            'message': 'Beba água antes, durante e após cada mamada para manter a produção de leite'
        })

    if exercise_duration > 60:
        recommendations.append({
            'type': 'info',
            'title': 'Exercício Prolongado',
            'message': 'Considere bebidas isotônicas para repor eletrólitos perdidos no suor'
        })

    # Recomendação geral sempre no final
    recommendations.append({
        'type': 'success',
        'title': 'Dica Geral',
        'message': 'Beba água ao longo do dia, não apenas quando sentir sede'
    })

    return recommendations

@health_tools_bp.route('/imc/calculate', methods=['POST'])
@rate_limit("20 per hour")
@handle_route_exceptions
def calculate_imc_route():
    """
    Calcula IMC (público - não requer autenticação).

    Implementa tratamento robusto de exceções e validação de dados.

    Request Body:
        weight (float): Peso em kg.
        height (float): Altura em cm ou metros.

    Returns:
        JSON: IMC, classificação, recomendações e faixa de peso ideal.
    """
    data = request.get_json()
    
    if not data:
        raise ValidationError("Dados são obrigatórios")
    
    # Tenta obter user_id se autenticado, mas não requer
    user_id = None
    try:
        if hasattr(request, 'current_user') and request.current_user:
            user_id = request.current_user.get('id')
    except (AttributeError, KeyError, TypeError):
        pass  # Endpoint público - continua sem user_id se não autenticado

    # Normaliza altura: frontend envia em cm, backend precisa em metros
    try:
        weight = float(data.get('weight', 0))
        height_cm = float(data.get('height', 0))
    except (ValueError, TypeError):
        raise ValidationError("Peso e altura devem ser números válidos")

    if weight <= 0 or height_cm <= 0:
        raise ValidationError("Peso e altura devem ser maiores que zero")

    if height_cm > 3:  # Provavelmente está em cm, converte para metros
        height_m = height_cm / 100
    else:
        height_m = height_cm  # Já está em metros

    # Calcula IMC
    result = calculate_imc(weight, height_m)

    if 'error' in result:
        raise ValidationError(result['error'])

    # Salva cálculo no banco apenas se usuário estiver autenticado
    if user_id:
        health_service.save_imc_calculation(user_id, result)
        log_user_activity(user_id, 'imc_calculated', {
            'weight': data['weight'],
            'height': data['height'],
            'imc': result['imc']
        })

    return jsonify({
        'imc': result['imc'],
        'classification': result['classification'],
        'color': result['color'],
        'recommendations': result['recommendations'],
        'weight_range': result['weight_range']
    }), 200

@health_tools_bp.route('/imc/history', methods=['GET'])
@token_required
@handle_route_exceptions
def get_imc_history():
    """
    Retorna histórico de cálculos de IMC.
    
    Implementa tratamento robusto de exceções e validação de dados.
    """
    user_id = request.current_user['id']
    
    try:
        page = int(request.args.get('page', 1))
        if page < 1:
            raise ValidationError("page deve ser maior que 0")
    except (ValueError, TypeError):
        raise ValidationError("page deve ser um número válido")
    
    try:
        per_page = int(request.args.get('per_page', 20))
        if per_page < 1:
            raise ValidationError("per_page deve ser maior que 0")
    except (ValueError, TypeError):
        raise ValidationError("per_page deve ser um número válido")

    history = health_service.get_imc_history(user_id, page, per_page)

    return jsonify(history), 200



@health_tools_bp.route('/nutrition/search', methods=['GET'])
@token_required
@rate_limit("50 per hour")
@handle_route_exceptions
def search_foods():
    """
    Busca alimentos na API USDA.
    
    Implementa tratamento robusto de exceções e validação de dados.
    """
    query = request.args.get('query', '').strip()
    
    if not query:
        raise ValidationError("Query é obrigatória")
    
    if len(query) < 2:
        raise ValidationError("Query deve ter pelo menos 2 caracteres")

    # Busca na API USDA
    foods = health_service.search_foods(query)

    return jsonify({
        'foods': foods,
        'query': query
    }), 200

@health_tools_bp.route('/nutrition/food/<int:fdc_id>', methods=['GET'])
@token_required
@rate_limit("100 per hour")
@handle_route_exceptions
def get_food_details(fdc_id):
    """
    Retorna detalhes nutricionais de um alimento.
    
    Implementa tratamento robusto de exceções e validação de dados.
    """
    if not fdc_id or fdc_id <= 0:
        raise ValidationError("fdc_id deve ser um número positivo")
    
    food_details = health_service.get_food_details(fdc_id)

    if not food_details:
        raise NotFoundError("Alimento não encontrado")

    return jsonify(food_details), 200

@health_tools_bp.route('/food-diary/entries', methods=['POST'])
@token_required
@rate_limit("100 per hour")
@log_activity('food_entry_added')
@handle_route_exceptions
def add_food_entry():
    """
    Adiciona entrada no diário alimentar.
    
    Implementa tratamento robusto de exceções e validação de dados.
    """
    data = request.get_json()
    user_id = request.current_user['id']

    if not data:
        raise ValidationError("Dados são obrigatórios")

    # Valida dados
    if not health_data_validator.validate_food_entry(data):
        errors = health_data_validator.get_errors()
        raise ValidationError(
            message='Dados inválidos',
            details={'errors': errors}
        )

    # Adiciona entrada
    result = health_service.add_food_entry(user_id, data)

    if result.get('success'):
        log_user_activity(user_id, 'food_entry_added', {
            'food_name': data.get('food_name'),
            'quantity': data.get('quantity')
        })

        return jsonify({
            'message': 'Entrada adicionada com sucesso',
            'entry': result['entry']
        }), 201
    else:
        raise ValidationError(result.get('error', 'Erro ao adicionar entrada'))

@health_tools_bp.route('/food-diary/entries', methods=['GET'])
@token_required
@handle_route_exceptions
def get_food_entries():
    """
    Retorna entradas do diário alimentar.
    
    Implementa tratamento robusto de exceções e validação de dados.
    """
    user_id = request.current_user['id']
    date = request.args.get('date')
    
    try:
        page = int(request.args.get('page', 1))
        if page < 1:
            raise ValidationError("page deve ser maior que 0")
    except (ValueError, TypeError):
        raise ValidationError("page deve ser um número válido")
    
    try:
        per_page = int(request.args.get('per_page', 20))
        if per_page < 1:
            raise ValidationError("per_page deve ser maior que 0")
    except (ValueError, TypeError):
        raise ValidationError("per_page deve ser um número válido")

    entries = health_service.get_food_entries(user_id, date, page, per_page)

    return jsonify(entries), 200

@health_tools_bp.route('/food-diary/entries/<entry_id>', methods=['PUT', 'PATCH'])
@token_required
@rate_limit("100 per hour")
@log_activity('food_entry_updated')
@handle_route_exceptions
def update_food_entry(entry_id):
    """
    Atualiza entrada do diário alimentar.
    
    Implementa tratamento robusto de exceções e validação de dados.
    """
    if not entry_id:
        raise ValidationError("entry_id é obrigatório")
    
    data = request.get_json()
    user_id = request.current_user['id']
    
    if not data:
        raise ValidationError("Dados são obrigatórios")
    
    # Valida dados
    if not health_data_validator.validate_food_entry(data):
        errors = health_data_validator.get_errors()
        raise ValidationError(
            message='Dados inválidos',
            details={'errors': errors}
        )
    
    result = health_service.update_food_entry(user_id, entry_id, data)
    
    if result.get('success'):
        log_user_activity(user_id, 'food_entry_updated', {
            'entry_id': entry_id,
            'food_name': data.get('food_name')
        })
        
        return jsonify({
            'message': 'Entrada atualizada com sucesso',
            'entry': result['entry']
        }), 200
    else:
        raise NotFoundError(result.get('error', 'Entrada não encontrada'))

@health_tools_bp.route('/food-diary/entries/<entry_id>', methods=['DELETE'])
@token_required
@rate_limit("100 per hour")
@log_activity('food_entry_deleted')
@handle_route_exceptions
def delete_food_entry(entry_id):
    """
    Deleta entrada do diário alimentar.
    
    Implementa tratamento robusto de exceções e validação de dados.
    """
    if not entry_id:
        raise ValidationError("entry_id é obrigatório")
    
    user_id = request.current_user['id']
    
    result = health_service.delete_food_entry(user_id, entry_id)
    
    if result.get('success'):
        log_user_activity(user_id, 'food_entry_deleted', {
            'entry_id': entry_id
        })
        
        return jsonify({
            'message': 'Entrada deletada com sucesso'
        }), 200
    else:
        raise NotFoundError(result.get('error', 'Entrada não encontrada'))

@health_tools_bp.route('/exercise/entries', methods=['POST'])
@token_required
@rate_limit("50 per hour")
@log_activity('exercise_entry_added')
@handle_route_exceptions
def add_exercise_entry():
    """
    Adiciona entrada de exercício.
    
    Implementa tratamento robusto de exceções e validação de dados.
    """
    data = request.get_json()
    user_id = request.current_user['id']

    if not data:
        raise ValidationError("Dados são obrigatórios")

    # Valida dados
    if not health_data_validator.validate_exercise_entry(data):
        errors = health_data_validator.get_errors()
        raise ValidationError(
            message='Dados inválidos',
            details={'errors': errors}
        )

    # Adiciona entrada
    result = health_service.add_exercise_entry(user_id, data)

    if result.get('success'):
        log_user_activity(user_id, 'exercise_entry_added', {
            'exercise_name': data.get('exercise_name'),
            'duration': data.get('duration')
        })

        return jsonify({
            'message': 'Exercício adicionado com sucesso',
            'entry': result['entry']
        }), 201
    else:
        raise ValidationError(result.get('error', 'Erro ao adicionar exercício'))

@health_tools_bp.route('/exercise/entries', methods=['GET'])
@token_required
@handle_route_exceptions
def get_exercise_entries():
    """
    Retorna entradas de exercícios.
    
    Implementa tratamento robusto de exceções e validação de dados.
    """
    user_id = request.current_user['id']
    date = request.args.get('date')
    
    try:
        page = int(request.args.get('page', 1))
        if page < 1:
            raise ValidationError("page deve ser maior que 0")
    except (ValueError, TypeError):
        raise ValidationError("page deve ser um número válido")
    
    try:
        per_page = int(request.args.get('per_page', 20))
        if per_page < 1:
            raise ValidationError("per_page deve ser maior que 0")
    except (ValueError, TypeError):
        raise ValidationError("per_page deve ser um número válido")

    entries = health_service.get_exercise_entries(user_id, date, page, per_page)

    return jsonify(entries), 200

@health_tools_bp.route('/analytics/summary', methods=['GET'])
@token_required
@premium_required
@handle_route_exceptions
def get_health_analytics():
    """
    Retorna resumo de analytics de saúde.
    
    Implementa tratamento robusto de exceções e validação de dados.
    """
    user_id = request.current_user['id']
    period = request.args.get('period', '30')  # dias

    try:
        period_int = int(period)
        if period_int < 1:
            raise ValidationError("period deve ser maior que 0")
    except (ValueError, TypeError):
        raise ValidationError("period deve ser um número válido")

    analytics = health_service.get_health_analytics(user_id, period_int)

    return jsonify(analytics), 200

@health_tools_bp.route('/goals', methods=['GET'])
@token_required
@handle_route_exceptions
def get_health_goals():
    """
    Retorna metas de saúde do usuário.
    
    Implementa tratamento robusto de exceções e validação de dados.
    """
    user_id = request.current_user['id']
    goals = health_service.get_health_goals(user_id)

    return jsonify({'goals': goals}), 200

@health_tools_bp.route('/goals', methods=['POST'])
@token_required
@log_activity('goal_created')
@handle_route_exceptions
def create_health_goal():
    """
    Cria nova meta de saúde.
    
    Implementa tratamento robusto de exceções e validação de dados.
    """
    data = request.get_json()
    user_id = request.current_user['id']

    if not data:
        raise ValidationError("Dados são obrigatórios")
    
    if not data.get('type'):
        raise ValidationError("Tipo de meta é obrigatório")

    result = health_service.create_health_goal(user_id, data)

    if result.get('success'):
        log_user_activity(user_id, 'goal_created', {
            'goal_type': data.get('type'),
            'target_value': data.get('target_value')
        })

        return jsonify({
            'message': 'Meta criada com sucesso',
            'goal': result['goal']
        }), 201
    else:
        raise ValidationError(result.get('error', 'Erro ao criar meta'))

# Novas rotas para as calculadoras

@health_tools_bp.route('/calories/calculate', methods=['POST'])
@rate_limit("10 per hour")
@handle_route_exceptions
def calculate_calories_route():
    """
    Calcula necessidade calórica (público - não requer autenticação).
    
    Implementa tratamento robusto de exceções e validação de dados.
    """
    data = request.get_json()
    
    if not data:
        raise ValidationError("Dados são obrigatórios")
    
    # Tenta obter user_id se autenticado, mas não requer
    user_id = None
    try:
        if hasattr(request, 'current_user') and request.current_user:
            user_id = request.current_user.get('id')
    except (AttributeError, KeyError, TypeError):
        pass  # Endpoint público - continua sem user_id se não autenticado

    required_fields = ['age', 'weight', 'height', 'gender', 'activity_level']
    for field in required_fields:
        if not data.get(field):
            raise ValidationError(f'Campo {field} é obrigatório')

    # Normaliza altura: frontend envia em cm, backend precisa em metros
    try:
        age = int(data['age'])
        if age < 1 or age > 150:
            raise ValidationError("Idade deve estar entre 1 e 150 anos")
    except (ValueError, TypeError):
        raise ValidationError("Idade deve ser um número válido")
    
    try:
        weight = float(data['weight'])
        if weight <= 0 or weight > 500:
            raise ValidationError("Peso deve estar entre 0 e 500 kg")
    except (ValueError, TypeError):
        raise ValidationError("Peso deve ser um número válido")
    
    try:
        height_cm = float(data['height'])
        if height_cm <= 0 or height_cm > 300:
            raise ValidationError("Altura deve estar entre 0 e 300 cm")
    except (ValueError, TypeError):
        raise ValidationError("Altura deve ser um número válido")
    
    gender = data['gender']
    if gender not in ['male', 'female', 'other']:
        raise ValidationError("Gênero deve ser: male, female ou other")
    
    activity_level = data['activity_level']
    valid_levels = ['sedentary', 'light', 'moderate', 'active', 'very_active']
    if activity_level not in valid_levels:
        raise ValidationError(f"Nível de atividade deve ser um dos: {', '.join(valid_levels)}")

    # Converte altura de cm para metros se necessário
    if height_cm > 3:  # Provavelmente está em cm
        height_m = height_cm / 100
    else:
        height_m = height_cm  # Já está em metros

    # Calcula calorias (a função espera altura em metros)
    result = calculate_calories(
        age,
        weight,
        height_m,
        gender,
        activity_level
    )

    # Calcula macronutrientes
    macros = calculate_macros(result['daily_calories'])

    # Salva cálculo no banco apenas se usuário estiver autenticado
    saved = False
    if user_id:
        calculation_data = {
            'age': age,
            'gender': gender,
            'weight': weight,
            'height': height_m,  # Salva em metros
            'height_cm': height_cm,  # Também salva em cm para referência
            'activity_level': activity_level,
            'goal': data.get('goal', 'maintain'),
            'bmr': result['bmr'],
            'tdee': result['daily_calories'],
            'target_calories': result['daily_calories'],
            'deficit': 500 if data.get('goal') == 'lose_weight' else 0,
            'surplus': 300 if data.get('goal') == 'gain_weight' else 0
        }

        save_result = health_service.save_calorie_calculation(user_id, calculation_data)
        saved = save_result.get('success', False)

        if saved:
            log_user_activity(user_id, 'calories_calculated', {
                'age': data['age'],
                'weight': data['weight'],
                'height': data['height'],
                'daily_calories': result['daily_calories']
            })

    return jsonify({
        'bmr': result['bmr'],
        'daily_calories': result['daily_calories'],
        'activity_multiplier': result['activity_multiplier'],
        'macros': macros,
        'saved': saved
    }), 200

@health_tools_bp.route('/calories/history', methods=['GET'])
@token_required
@handle_route_exceptions
def get_calorie_history():
    """
    Retorna histórico de cálculos de calorias.
    
    Implementa tratamento robusto de exceções e validação de dados.
    """
    user_id = request.current_user['id']
    
    try:
        page = int(request.args.get('page', 1))
        if page < 1:
            raise ValidationError("page deve ser maior que 0")
    except (ValueError, TypeError):
        raise ValidationError("page deve ser um número válido")
    
    try:
        per_page = int(request.args.get('per_page', 20))
        if per_page < 1:
            raise ValidationError("per_page deve ser maior que 0")
    except (ValueError, TypeError):
        raise ValidationError("per_page deve ser um número válido")

    history = health_service.get_calorie_history(user_id, page, per_page)

    return jsonify(history), 200

@health_tools_bp.route('/biological-age/calculate', methods=['POST'])
@rate_limit("5 per hour")
@handle_route_exceptions
def calculate_biological_age_route():
    """
    Calcula idade biológica (público - não requer autenticação).
    
    Implementa tratamento robusto de exceções e validação de dados.
    """
    raw_data = request.get_json()
    if not raw_data:
        raise ValidationError("Dados não fornecidos")

    # Sanitiza dados de entrada
    data = sanitize_dict(raw_data, sanitize_strings=True)

    # Valida dados
    if not health_data_validator.validate_biological_age(data):
        errors = health_data_validator.get_errors()
        raise ValidationError(
            message="Dados inválidos",
            details={'errors': errors}
        )

    # Tenta obter user_id se autenticado, mas não requer
    user_id = None
    try:
        if hasattr(request, 'current_user') and request.current_user:
            user_id = request.current_user.get('id')
    except (AttributeError, KeyError, TypeError):
        pass  # Endpoint público - continua sem user_id se não autenticado

    # Usa o service para calcular idade biológica (toda lógica no backend)
    result = health_service.calculate_biological_age(data)

    if 'error' in result:
        raise ValidationError(result['error'])

    # Salva cálculo no banco se usuário estiver autenticado
    saved = False
    if user_id:
        save_result = health_service.save_biological_age_calculation(user_id, result)
        saved = save_result.get('success', False)

        if saved:
            log_user_activity(user_id, 'biological_age_calculated', {
                'chronological_age': result['chronological_age'],
                'biological_age': result['biological_age'],
                'age_difference': result['age_difference']
            })

    return jsonify({
        **result,
        'saved': saved
    }), 200

@health_tools_bp.route('/hydration/calculate', methods=['POST'])
@rate_limit("10 per hour")
@handle_route_exceptions
def calculate_hydration_route():
    """
    Calcula necessidades de hidratação (público - não requer autenticação).
    
    Implementa tratamento robusto de exceções e validação de dados.
    """
    data = request.get_json()
    
    if not data:
        raise ValidationError("Dados são obrigatórios")
    
    # Tenta obter user_id se autenticado, mas não requer
    user_id = None
    try:
        if hasattr(request, 'current_user') and request.current_user:
            user_id = request.current_user.get('id')
    except (AttributeError, KeyError, TypeError):
        pass  # Endpoint público - continua sem user_id se não autenticado

    required_fields = ['weight', 'age', 'gender', 'activity_level', 'climate']
    for field in required_fields:
        if not data.get(field):
            raise ValidationError(f'Campo {field} é obrigatório')

    # Cálculo base: 35ml por kg de peso corporal
    try:
        weight = float(data['weight'])
        if weight <= 0 or weight > 500:
            raise ValidationError("Peso deve estar entre 0 e 500 kg")
    except (ValueError, TypeError):
        raise ValidationError("Peso deve ser um número válido")
    
    try:
        age = int(data['age'])
        if age < 1 or age > 150:
            raise ValidationError("Idade deve estar entre 1 e 150 anos")
    except (ValueError, TypeError):
        raise ValidationError("Idade deve ser um número válido")
    
    gender = data['gender']
    if gender not in ['male', 'female', 'other']:
        raise ValidationError("Gênero deve ser: male, female ou other")
    
    activity_level = data['activity_level']
    valid_levels = ['sedentary', 'light', 'moderate', 'active', 'very_active']
    if activity_level not in valid_levels:
        raise ValidationError(f"Nível de atividade deve ser um dos: {', '.join(valid_levels)}")
    
    climate = data['climate']
    valid_climates = ['temperate', 'hot', 'very_hot', 'cold', 'dry']
    if climate not in valid_climates:
        raise ValidationError(f"Clima deve ser um dos: {', '.join(valid_climates)}")
    
    base_water_intake = weight * 35

    # Ajustes por idade, gênero, atividade e clima
    if age > 65:
        base_water_intake *= 0.9
    elif age < 18:
        base_water_intake *= 1.1

    if gender == 'male':
        base_water_intake *= 1.1

    # Fatores de atividade e clima (simplificado)
    activity_factors = {
        'sedentary': 1.0,
        'light': 1.2,
        'moderate': 1.4,
        'active': 1.6,
        'very_active': 1.8
    }

    climate_factors = {
        'temperate': 1.0,
        'hot': 1.3,
        'very_hot': 1.5,
        'cold': 0.9,
        'dry': 1.2
    }

    base_water_intake *= activity_factors.get(activity_level, 1.0)
    base_water_intake *= climate_factors.get(climate, 1.0)

    # Ajuste por exercício
    try:
        exercise_duration = float(data.get('exercise_duration', 0))
        if exercise_duration < 0:
            raise ValidationError("Duração do exercício não pode ser negativa")
    except (ValueError, TypeError):
        exercise_duration = 0
    
    if exercise_duration > 0:
        exercise_intensity = data.get('exercise_intensity', 'moderate')
        intensity_factors = {
            'low': 0.5,
            'moderate': 1.0,
            'high': 1.5,
            'very_high': 2.0
        }
        exercise_water_loss = exercise_duration * intensity_factors.get(exercise_intensity, 1.0) * 10
        base_water_intake += exercise_water_loss

    total_intake = round(base_water_intake)
    water_intake = round(total_intake * 0.7)
    other_fluids = round(total_intake * 0.3)

    # Gerar recomendações personalizadas (lógica movida do frontend)
    health_conditions = data.get('health_conditions', [])
    pregnancy = data.get('pregnancy', False)
    breastfeeding = data.get('breastfeeding', False)
    recommendations = _generate_hydration_recommendations(
        health_conditions,
        pregnancy,
        breastfeeding,
        exercise_duration
    )

    calculation_data = {
        'weight': weight,
        'age': age,
        'gender': gender,
        'activity_level': activity_level,
        'climate': climate,
        'exercise_duration': exercise_duration,
        'exercise_intensity': data.get('exercise_intensity'),
        'health_conditions': health_conditions,
        'total_intake': total_intake,
        'water_intake': water_intake,
        'other_fluids': other_fluids,
        'recommendations': recommendations
    }

    saved = False
    if user_id:
        save_result = health_service.save_hydration_calculation(user_id, calculation_data)
        saved = save_result.get('success', False)

        if saved:
            log_user_activity(user_id, 'hydration_calculated', {
                'weight': data['weight'],
                'total_intake': total_intake
            })

    return jsonify({
        'total_intake': total_intake,
        'water_intake': water_intake,
        'other_fluids': other_fluids,
        'hourly_intake': round(total_intake / 16),
        'recommendations': recommendations,
        'saved': saved
    }), 200

@health_tools_bp.route('/metabolism/calculate', methods=['POST'])
@rate_limit("10 per hour")
@handle_route_exceptions
def calculate_metabolism_route():
    """
    Calcula metabolismo (público - não requer autenticação).
    
    Implementa tratamento robusto de exceções e validação de dados.
    """
    data = request.get_json()
    
    if not data:
        raise ValidationError("Dados são obrigatórios")
    
    # Tenta obter user_id se autenticado, mas não requer
    user_id = None
    try:
        if hasattr(request, 'current_user') and request.current_user:
            user_id = request.current_user.get('id')
    except (AttributeError, KeyError, TypeError):
        pass  # Endpoint público - continua sem user_id se não autenticado

    required_fields = ['age', 'weight', 'height', 'gender', 'activity_level']
    for field in required_fields:
        if not data.get(field):
            raise ValidationError(f'Campo {field} é obrigatório')

    # Calcula BMR usando Harris-Benedict
    try:
        age = int(data['age'])
        if age < 1 or age > 150:
            raise ValidationError("Idade deve estar entre 1 e 150 anos")
    except (ValueError, TypeError):
        raise ValidationError("Idade deve ser um número válido")
    
    try:
        weight = float(data['weight'])
        if weight <= 0 or weight > 500:
            raise ValidationError("Peso deve estar entre 0 e 500 kg")
    except (ValueError, TypeError):
        raise ValidationError("Peso deve ser um número válido")
    
    try:
        height_cm = float(data['height'])
        if height_cm <= 0 or height_cm > 300:
            raise ValidationError("Altura deve estar entre 0 e 300 cm")
    except (ValueError, TypeError):
        raise ValidationError("Altura deve ser um número válido")
    
    gender = data['gender']
    if gender not in ['male', 'female', 'other']:
        raise ValidationError("Gênero deve ser: male, female ou other")
    
    activity_level = data['activity_level']
    valid_levels = ['sedentary', 'light', 'moderate', 'active', 'very_active']
    if activity_level not in valid_levels:
        raise ValidationError(f"Nível de atividade deve ser um dos: {', '.join(valid_levels)}")

    # Converte altura de cm para metros se necessário
    if height_cm > 3:  # Provavelmente está em cm
        height_m = height_cm / 100
    else:
        height_m = height_cm  # Já está em metros

    # Convertemos para cm novamente para a fórmula de Harris-Benedict
    height_cm_for_formula = height_m * 100

    if gender == 'male':
        bmr = 88.362 + (13.397 * weight) + (4.799 * height_cm_for_formula) - (5.677 * age)
    else:
        bmr = 447.593 + (9.247 * weight) + (3.098 * height_cm_for_formula) - (4.330 * age)

    # Calcula TDEE
    activity_factors = {
        'sedentary': 1.2,
        'light': 1.375,
        'moderate': 1.55,
        'active': 1.725,
        'very_active': 1.9
    }

    tdee = bmr * activity_factors.get(activity_level, 1.2)

    # Determina tipo de metabolismo
    metabolism_type = 'Normal'
    if tdee > bmr * 1.8:
        metabolism_type = 'Rápido'
    elif tdee < bmr * 1.3:
        metabolism_type = 'Lento'

    calculation_data = {
        'age': age,
        'gender': gender,
        'weight': weight,
        'height': height_m,  # Salva em metros
        'height_cm': height_cm,  # Também salva em cm para referência
        'activity_level': activity_level,
        'bmr': round(bmr),
        'tdee': round(tdee),
        'metabolism_type': metabolism_type,
        'recommendations': data.get('recommendations', [])
    }

    saved = False
    if user_id:
        save_result = health_service.save_metabolism_calculation(user_id, calculation_data)
        saved = save_result.get('success', False)

        if saved:
            log_user_activity(user_id, 'metabolism_calculated', {
                'bmr': round(bmr),
                'tdee': round(tdee),
                'metabolism_type': metabolism_type
            })

    return jsonify({
        'bmr': round(bmr),
        'tdee': round(tdee),
        'metabolism_type': metabolism_type,
        'saved': saved
    }), 200

@health_tools_bp.route('/sleep/calculate', methods=['POST'])
@token_required
@rate_limit("10 per hour")
@log_activity('sleep_calculation')
@handle_route_exceptions
def calculate_sleep_route():
    """
    Calcula necessidades de sono e salva no banco.
    
    Implementa tratamento robusto de exceções e validação de dados.
    """
    data = request.get_json()
    user_id = request.current_user['id']

    if not data:
        raise ValidationError("Dados são obrigatórios")

    required_fields = ['age', 'sleep_duration', 'sleep_quality']
    for field in required_fields:
        if not data.get(field):
            raise ValidationError(f'Campo {field} é obrigatório')

    try:
        age = int(data['age'])
        if age < 1 or age > 150:
            raise ValidationError("Idade deve estar entre 1 e 150 anos")
    except (ValueError, TypeError):
        raise ValidationError("Idade deve ser um número válido")
    
    try:
        sleep_duration = float(data['sleep_duration'])
        if sleep_duration < 0 or sleep_duration > 24:
            raise ValidationError("Duração do sono deve estar entre 0 e 24 horas")
    except (ValueError, TypeError):
        raise ValidationError("Duração do sono deve ser um número válido")
    
    sleep_quality = data['sleep_quality']
    valid_qualities = ['poor', 'fair', 'good', 'excellent']
    if sleep_quality not in valid_qualities:
        raise ValidationError(f"Qualidade do sono deve ser um dos: {', '.join(valid_qualities)}")

    # Calcula eficiência do sono baseada na qualidade e duração
    quality_scores = {
        'poor': 0.6,
        'fair': 0.7,
        'good': 0.8,
        'excellent': 0.9
    }

    sleep_efficiency = quality_scores.get(sleep_quality, 0.7)

    # Recomendações baseadas na idade
    age_recommendations = {
        'adult': (7, 9),
        'elderly': (7, 8),
        'teen': (8, 10)
    }

    if age >= 65:
        age_group = 'elderly'
    elif age < 18:
        age_group = 'teen'
    else:
        age_group = 'adult'

    min_sleep, max_sleep = age_recommendations[age_group]

    calculation_data = {
        'age': age,
        'sleep_duration': sleep_duration,
        'sleep_quality': sleep_quality,
        'bedtime': data.get('bedtime'),
        'wake_time': data.get('wake_time'),
        'sleep_efficiency': sleep_efficiency,
        'recommendations': [
            f'Recomendação para sua idade: {min_sleep}-{max_sleep} horas',
            f'Eficiência atual: {sleep_efficiency*100:.0f}%'
        ]
    }

    save_result = health_service.save_sleep_calculation(user_id, calculation_data)

    if not save_result.get('success'):
        raise ValidationError('Erro ao salvar cálculo')

    log_user_activity(user_id, 'sleep_calculated', {
        'sleep_duration': sleep_duration,
        'sleep_quality': sleep_quality,
        'sleep_efficiency': sleep_efficiency
    })

    return jsonify({
        'sleep_duration': sleep_duration,
        'sleep_quality': sleep_quality,
        'sleep_efficiency': sleep_efficiency,
        'recommendations': calculation_data['recommendations'],
        'saved': True
    }), 200

@health_tools_bp.route('/stress/calculate', methods=['POST'])
@rate_limit("10 per hour")
@handle_route_exceptions
def calculate_stress_route():
    """
    Calcula nível de estresse (público - não requer autenticação).
    
    Implementa tratamento robusto de exceções e validação de dados.
    """
    data = request.get_json()
    
    if not data:
        raise ValidationError("Dados são obrigatórios")
    
    # Tenta obter user_id se autenticado, mas não requer
    user_id = None
    try:
        if hasattr(request, 'current_user') and request.current_user:
            user_id = request.current_user.get('id')
    except (AttributeError, KeyError, TypeError):
        pass  # Endpoint público - continua sem user_id se não autenticado

    required_fields = ['stress_factors']
    for field in required_fields:
        if not data.get(field):
            raise ValidationError(f'Campo {field} é obrigatório')

    stress_factors = data['stress_factors']
    
    if not isinstance(stress_factors, list):
        raise ValidationError("stress_factors deve ser uma lista")

    # Calcula score de estresse baseado nos fatores
    stress_score = 0
    for factor in stress_factors:
        if not isinstance(factor, dict):
            continue
        severity = factor.get('severity', 'low')
        if severity == 'high':
            stress_score += 3
        elif severity == 'medium':
            stress_score += 2
        else:
            stress_score += 1

    # Determina nível de estresse
    if stress_score <= 5:
        stress_level = 'Baixo'
    elif stress_score <= 10:
        stress_level = 'Moderado'
    elif stress_score <= 15:
        stress_level = 'Alto'
    else:
        stress_level = 'Muito Alto'

    # Estratégias de coping baseadas no nível
    coping_strategies = []
    if stress_level in ['Alto', 'Muito Alto']:
        coping_strategies.extend([
            'Prática de meditação diária',
            'Exercícios de respiração',
            'Atividade física regular',
            'Busque apoio profissional'
        ])
    else:
        coping_strategies.extend([
            'Mantenha rotinas saudáveis',
            'Pratique mindfulness',
            'Exercite-se regularmente'
        ])

    calculation_data = {
        'stress_level': stress_level,
        'stress_score': stress_score,
        'stress_factors': stress_factors,
        'coping_strategies': coping_strategies,
        'recommendations': [
            f'Nível de estresse: {stress_level}',
            f'Score: {stress_score}/20',
            'Considere implementar estratégias de coping'
        ]
    }

    saved = False
    if user_id:
        save_result = health_service.save_stress_calculation(user_id, calculation_data)
        saved = save_result.get('success', False)

        if saved:
            log_user_activity(user_id, 'stress_calculated', {
                'stress_level': stress_level,
                'stress_score': stress_score
            })

    return jsonify({
        'stress_level': stress_level,
        'stress_score': stress_score,
        'coping_strategies': coping_strategies,
        'recommendations': calculation_data['recommendations'],
        'saved': saved
    }), 200

@health_tools_bp.route('/macros/calculate', methods=['POST'])
@rate_limit("10 per hour")
@handle_route_exceptions
def calculate_macros_route():
    """
    Calcula macronutrientes baseado em calorias e objetivo.
    
    Implementa tratamento robusto de exceções e validação de dados.
    
    Lógica de negócio movida do frontend para o backend.
    """
    data = request.get_json()
    
    if not data:
        raise ValidationError("Dados são obrigatórios")

    try:
        calories = float(data.get('calories', 0))
        if calories <= 0 or calories > 10000:
            raise ValidationError("Calorias devem estar entre 0 e 10000")
    except (ValueError, TypeError):
        raise ValidationError("Calorias deve ser um número válido")
    
    goal = data.get('goal', 'maintain')  # lose, maintain, gain
    valid_goals = ['lose', 'maintain', 'gain']
    if goal not in valid_goals:
        raise ValidationError(f"Objetivo deve ser um dos: {', '.join(valid_goals)}")

    # Ajusta porcentagens de macros baseado no objetivo
    if goal == 'lose':
        # Perda de peso: mais proteína, menos carboidratos
        protein_percent = 30
        fat_percent = 30
    elif goal == 'gain':
        # Ganho de peso: mais carboidratos
        protein_percent = 25
        fat_percent = 25
    else:
        # Manutenção: distribuição balanceada
        protein_percent = 25
        fat_percent = 30

    # Calcula macros usando helper
    macros_result = calculate_macros(calories, protein_percent, fat_percent)

    return jsonify({
        'success': True,
        'calories': calories,
        'goal': goal,
        'macros': macros_result
    }), 200

# Endpoints de histórico - Sprint 4
@health_tools_bp.route('/biological-age/history', methods=['GET'])
@token_required
@rate_limit("30 per minute")
@handle_route_exceptions
def get_biological_age_history():
    """
    Retorna histórico de cálculos de idade biológica.
    
    Implementa tratamento robusto de exceções e validação de dados.
    """
    user_id = request.current_user['id']

    # Sanitiza e valida parâmetros de paginação
    page, per_page = sanitize_pagination_params(
        request.args.get('page'),
        request.args.get('per_page')
    )
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')

    history = health_service.get_biological_age_history(user_id, page, per_page, start_date, end_date)

    if 'error' in history:
        raise ValidationError(history.get('error', 'Erro ao buscar histórico'))

    return jsonify(history), 200

@health_tools_bp.route('/metabolism/history', methods=['GET'])
@token_required
@rate_limit("30 per minute")
@handle_route_exceptions
def get_metabolism_history():
    """
    Retorna histórico de cálculos de metabolismo.
    
    Implementa tratamento robusto de exceções e validação de dados.
    """
    user_id = request.current_user['id']
    
    try:
        page = int(request.args.get('page', 1))
        if page < 1:
            raise ValidationError("page deve ser maior que 0")
    except (ValueError, TypeError):
        raise ValidationError("page deve ser um número válido")
    
    try:
        per_page = int(request.args.get('per_page', 20))
        if per_page < 1:
            raise ValidationError("per_page deve ser maior que 0")
    except (ValueError, TypeError):
        raise ValidationError("per_page deve ser um número válido")
    
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')

    history = health_service.get_metabolism_history(user_id, page, per_page, start_date, end_date)

    if 'error' in history:
        raise ValidationError(history.get('error', 'Erro ao buscar histórico'))

    return jsonify(history), 200

@health_tools_bp.route('/sleep/history', methods=['GET'])
@token_required
@rate_limit("30 per minute")
@handle_route_exceptions
def get_sleep_history():
    """
    Retorna histórico de cálculos de sono.
    
    Implementa tratamento robusto de exceções e validação de dados.
    """
    user_id = request.current_user['id']
    
    try:
        page = int(request.args.get('page', 1))
        if page < 1:
            raise ValidationError("page deve ser maior que 0")
    except (ValueError, TypeError):
        raise ValidationError("page deve ser um número válido")
    
    try:
        per_page = int(request.args.get('per_page', 20))
        if per_page < 1:
            raise ValidationError("per_page deve ser maior que 0")
    except (ValueError, TypeError):
        raise ValidationError("per_page deve ser um número válido")
    
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')

    history = health_service.get_sleep_history(user_id, page, per_page, start_date, end_date)

    if 'error' in history:
        raise ValidationError(history.get('error', 'Erro ao buscar histórico'))

    return jsonify(history), 200

@health_tools_bp.route('/stress/history', methods=['GET'])
@token_required
@rate_limit("30 per minute")
@handle_route_exceptions
def get_stress_history():
    """
    Retorna histórico de cálculos de estresse.
    
    Implementa tratamento robusto de exceções e validação de dados.
    """
    user_id = request.current_user['id']
    
    try:
        page = int(request.args.get('page', 1))
        if page < 1:
            raise ValidationError("page deve ser maior que 0")
    except (ValueError, TypeError):
        raise ValidationError("page deve ser um número válido")
    
    try:
        per_page = int(request.args.get('per_page', 20))
        if per_page < 1:
            raise ValidationError("per_page deve ser maior que 0")
    except (ValueError, TypeError):
        raise ValidationError("per_page deve ser um número válido")
    
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')

    history = health_service.get_stress_history(user_id, page, per_page, start_date, end_date)

    if 'error' in history:
        raise ValidationError(history.get('error', 'Erro ao buscar histórico'))

    return jsonify(history), 200

@health_tools_bp.route('/hydration/history', methods=['GET'])
@token_required
@rate_limit("30 per minute")
@handle_route_exceptions
def get_hydration_history():
    """
    Retorna histórico de cálculos de hidratação.
    
    Implementa tratamento robusto de exceções e suporte a paginação.
    """
    user_id = request.current_user['id']
    
    try:
        page = int(request.args.get('page', 1))
        if page < 1:
            raise ValidationError("page deve ser maior que 0")
    except (ValueError, TypeError):
        raise ValidationError("page deve ser um número válido")
    
    try:
        per_page = int(request.args.get('per_page', 20))
        if per_page < 1:
            raise ValidationError("per_page deve ser maior que 0")
    except (ValueError, TypeError):
        raise ValidationError("per_page deve ser um número válido")
    
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')

    history = health_service.get_hydration_history(user_id, page, per_page, start_date, end_date)

    if 'error' in history:
        raise ValidationError(history.get('error', 'Erro ao buscar histórico'))

    return jsonify(history), 200
