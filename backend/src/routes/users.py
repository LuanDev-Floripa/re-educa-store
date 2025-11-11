"""
Rotas de usuários RE-EDUCA Store.

Gerencia operações de usuários incluindo:
- Dashboard e perfil do usuário
- Atualização de perfil e senha
- Históricos e atividades
- Preferências e configurações
"""
import logging
from flask import Blueprint, request, jsonify
from services.auth_service import AuthService
from services.user_dashboard_service import UserDashboardService
from services.user_service import UserService
from utils.decorators import token_required, log_activity
from utils.rate_limit_helper import rate_limit
from utils.exception_strategies import handle_route_exceptions
from utils.validators import user_validator
from middleware.logging import log_user_activity
from exceptions.custom_exceptions import InternalServerError, BaseAPIException, ValidationError, NotFoundError

logger = logging.getLogger(__name__)

users_bp = Blueprint('users', __name__)
auth_service = AuthService()
dashboard_service = UserDashboardService()
user_service = UserService()  # Novo service (Sprint 8)

@users_bp.route('/dashboard', methods=['GET'])
@token_required
@cache_response(timeout=120, key_prefix='user_dashboard')  # 2 minutos (varia por usuário)
@rate_limit("60 per minute")
@log_activity('get_dashboard')
@handle_route_exceptions
def get_user_dashboard():
    """
    Retorna dados completos do dashboard do usuário.
    
    Implementa tratamento robusto de exceções e validação de dados.
    """
    user_id = request.current_user['id']
    dashboard_data = dashboard_service.get_dashboard_data(user_id)
    return jsonify(dashboard_data), 200

@users_bp.route('/profile', methods=['GET'])
@token_required
@log_activity('get_profile')
@handle_route_exceptions
def get_profile():
    """
    Retorna perfil do usuário atual.
    
    Implementa tratamento robusto de exceções e validação de dados.
    """
    user = request.current_user
    return jsonify({
        'user': user
    }), 200

@users_bp.route('/profile', methods=['PUT'])
@token_required
@log_activity('update_profile')
@handle_route_exceptions
def update_profile():
    """
    Atualiza perfil do usuário.
    
    Implementa tratamento robusto de exceções e validação de dados.
    """
    data = request.get_json()
    user_id = request.current_user['id']

    # Valida dados
    if not user_validator.validate_profile_update(data):
        raise ValidationError('Dados inválidos', details=user_validator.get_errors())

    # Atualiza perfil usando user_service (Sprint 8)
    result = user_service.update_user_profile(user_id, data)

    if not result.get('success'):
        from exceptions.custom_exceptions import BadRequestError
        raise BadRequestError(result.get('error', 'Erro ao atualizar perfil'))

    log_user_activity(user_id, 'profile_updated', data)
    return jsonify({
        'message': 'Perfil atualizado com sucesso',
        'user': result['user']
    }), 200

@users_bp.route('/change-password', methods=['POST'])
@token_required
@rate_limit("5 per hour")
@log_activity('change_password')
@handle_route_exceptions
def change_password():
    """
    Altera senha do usuário.
    
    Implementa tratamento robusto de exceções e validação de dados.
    """
    data = request.get_json()
    user_id = request.current_user['id']

    if not data.get('current_password') or not data.get('new_password'):
        raise ValidationError('Senha atual e nova senha são obrigatórias')

    # Valida nova senha
    password_validation = user_validator.validate_password(data['new_password'])
    if not password_validation['valid']:
        raise ValidationError('Nova senha inválida', details=password_validation['errors'])

    # Altera senha
    result = auth_service.change_password(
        user_id,
        data['current_password'],
        data['new_password']
    )

    if not result.get('success'):
        raise ValidationError(result.get('error', 'Erro ao alterar senha'))

    log_user_activity(user_id, 'password_changed')
    return jsonify({'message': 'Senha alterada com sucesso'}), 200

@users_bp.route('/subscription', methods=['GET'])
@token_required
@rate_limit("30 per minute")
@handle_route_exceptions
def get_subscription():
    """
    Retorna dados da assinatura do usuário.
    
    Implementa tratamento robusto de exceções e validação de dados.
    """
    user = request.current_user
    return jsonify({
        'subscription': {
            'type': user.get('subscription_type', 'free'),
            'status': user.get('subscription_status', 'active'),
            'expires_at': user.get('subscription_expires_at'),
            'features': get_subscription_features(user.get('subscription_type', 'free'))
        }
    }), 200

@users_bp.route('/analytics', methods=['GET'])
@token_required
@rate_limit("20 per minute")
@handle_route_exceptions
def get_user_analytics():
    """
    Retorna analytics consolidado do usuário.
    
    Implementa tratamento robusto de exceções e validação de dados.

    Inclui:
    - Estatísticas de saúde (IMC, calorias, exercícios)
    - Progresso ao longo do tempo
    - Tendências e métricas consolidadas
    - Comparação com períodos anteriores
    """
    user_id = request.current_user['id']
    
    try:
        period = int(request.args.get('period', 30))
        if period < 1 or period > 365:
            raise ValidationError("period deve estar entre 1 e 365 dias")
    except (ValueError, TypeError):
        raise ValidationError("period deve ser um número válido")
    
    analytics = user_service.get_user_analytics(user_id, period)

    if 'error' in analytics:
        raise InternalServerError(analytics['error'])

    return jsonify(analytics), 200

@users_bp.route('/achievements', methods=['GET'])
@token_required
@rate_limit("20 per minute")
@handle_route_exceptions
def get_user_achievements():
    """
    Retorna conquistas do usuário.
    
    Implementa tratamento robusto de exceções e validação de dados.

    Inclui:
    - Badges e conquistas desbloqueadas
    - Progresso para próximas conquistas
    - Estatísticas de conquistas
    """
    user_id = request.current_user['id']
    achievements = user_service.get_user_achievements(user_id)

    return jsonify({'achievements': achievements}), 200

@users_bp.route('/activity', methods=['GET'])
@token_required
@handle_route_exceptions
def get_user_activity():
    """
    Retorna atividades do usuário.
    
    Implementa tratamento robusto de exceções e validação de dados.
    """
    # Utiliza UserService para acesso a dados seguindo o padrão de arquitetura
    from services.user_service import UserService
    user_service = UserService()

    user_id = request.current_user['id']
    activity_type = request.args.get('type')  # Filtro opcional por tipo
    
    try:
        page = int(request.args.get('page', 1))
        if page < 1:
            raise ValidationError("page deve ser maior que 0")
    except (ValueError, TypeError):
        raise ValidationError("page deve ser um número válido")
    
    try:
        per_page = int(request.args.get('per_page', 20))
        if per_page < 1 or per_page > 100:
            raise ValidationError("per_page deve estar entre 1 e 100")
    except (ValueError, TypeError):
        raise ValidationError("per_page deve ser um número válido")

    # Utiliza service que encapsula acesso ao repositório
    result = user_service.get_user_activities(user_id, page, per_page, activity_type)
    activities = result.get('activities', [])

    # Formatar resposta
    formatted_activities = []
    for activity in activities:
        formatted_activities.append({
            'id': activity.get('id'),
            'type': activity.get('activity_type'),
            'title': activity.get('title'),
            'description': activity.get('description'),
            'created_at': activity.get('created_at')
        })

    return jsonify({
        'activities': formatted_activities,
        'pagination': {
            'page': page,
            'per_page': per_page,
            'total': len(activities),
            'pages': (len(activities) + per_page - 1) // per_page if activities else 0
        }
    }), 200


def get_subscription_features(subscription_type):
    """Retorna features disponíveis para o tipo de assinatura"""
    features = {
        'free': [
            'imc_calculator',
            'basic_food_diary',
            'limited_reports'
        ],
        'basic': [
            'imc_calculator',
            'food_diary',
            'exercise_tracker',
            'basic_reports',
            'email_support'
        ],
        'premium': [
            'imc_calculator',
            'food_diary',
            'exercise_tracker',
            'advanced_reports',
            'ai_assistant',
            'priority_support',
            'custom_goals'
        ],
        'enterprise': [
            'all_premium_features',
            'api_access',
            'white_label',
            'dedicated_support',
            'custom_integrations'
        ]
    }

    return features.get(subscription_type, features['free'])
