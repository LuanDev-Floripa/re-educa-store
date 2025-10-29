"""
Rotas de usuários RE-EDUCA Store
"""
import logging
from flask import Blueprint, request, jsonify
from services.auth_service import AuthService
from services.user_dashboard_service import UserDashboardService
from utils.decorators import token_required, log_activity, rate_limit
from utils.validators import user_validator
from middleware.logging import log_user_activity

logger = logging.getLogger(__name__)

users_bp = Blueprint('users', __name__)
auth_service = AuthService()
dashboard_service = UserDashboardService()

@users_bp.route('/dashboard', methods=['GET'])
@token_required
@log_activity('get_dashboard')
def get_user_dashboard():
    """Retorna dados completos do dashboard do usuário"""
    try:
        user_id = request.current_user['id']
        dashboard_data = dashboard_service.get_dashboard_data(user_id)
        return jsonify(dashboard_data), 200
    except Exception as e:
        return jsonify({'error': 'Erro ao buscar dashboard', 'details': str(e)}), 500

@users_bp.route('/profile', methods=['GET'])
@token_required
@log_activity('get_profile')
def get_profile():
    """Retorna perfil do usuário atual"""
    try:
        user = request.current_user
        return jsonify({
            'user': user
        }), 200
    except Exception as e:
        return jsonify({'error': 'Erro interno do servidor'}), 500

@users_bp.route('/profile', methods=['PUT'])
@token_required
@log_activity('update_profile')
def update_profile():
    """Atualiza perfil do usuário"""
    try:
        data = request.get_json()
        user_id = request.current_user['id']
        
        # Valida dados
        if not user_validator.validate_profile_update(data):
            return jsonify({
                'error': 'Dados inválidos',
                'details': user_validator.get_errors()
            }), 400
        
        # Atualiza perfil
        result = auth_service.update_user_profile(user_id, data)
        
        if result.get('success'):
            log_user_activity(user_id, 'profile_updated', data)
            return jsonify({
                'message': 'Perfil atualizado com sucesso',
                'user': result['user']
            }), 200
        else:
            return jsonify({'error': result['error']}), 400
            
    except Exception as e:
        return jsonify({'error': 'Erro interno do servidor'}), 500

@users_bp.route('/change-password', methods=['POST'])
@token_required
@rate_limit("5 per hour")
@log_activity('change_password')
def change_password():
    """Altera senha do usuário"""
    try:
        data = request.get_json()
        user_id = request.current_user['id']
        
        if not data.get('current_password') or not data.get('new_password'):
            return jsonify({'error': 'Senha atual e nova senha são obrigatórias'}), 400
        
        # Valida nova senha
        password_validation = user_validator.validate_password(data['new_password'])
        if not password_validation['valid']:
            return jsonify({
                'error': 'Nova senha inválida',
                'details': password_validation['errors']
            }), 400
        
        # Altera senha
        result = auth_service.change_password(
            user_id, 
            data['current_password'], 
            data['new_password']
        )
        
        if result.get('success'):
            log_user_activity(user_id, 'password_changed')
            return jsonify({'message': 'Senha alterada com sucesso'}), 200
        else:
            return jsonify({'error': result['error']}), 400
            
    except Exception as e:
        return jsonify({'error': 'Erro interno do servidor'}), 500

@users_bp.route('/subscription', methods=['GET'])
@token_required
def get_subscription():
    """Retorna dados da assinatura do usuário"""
    try:
        user = request.current_user
        return jsonify({
            'subscription': {
                'type': user.get('subscription_type', 'free'),
                'status': user.get('subscription_status', 'active'),
                'expires_at': user.get('subscription_expires_at'),
                'features': get_subscription_features(user.get('subscription_type', 'free'))
            }
        }), 200
    except Exception as e:
        return jsonify({'error': 'Erro interno do servidor'}), 500

@users_bp.route('/activity', methods=['GET'])
@token_required
def get_user_activity():
    """Retorna atividades do usuário"""
    try:
        from config.database import supabase_client
        
        user_id = request.current_user['id']
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 20))
        activity_type = request.args.get('type')  # Filtro opcional por tipo
        
        # Buscar atividades do usuário
        query = supabase_client.table('user_activities').select('*')
        query = query.eq('user_id', user_id)
        
        if activity_type:
            query = query.eq('activity_type', activity_type)
        
        # Ordenar por data mais recente
        query = query.order('created_at', desc=True)
        
        # Executar query
        result = query.execute()
        activities_raw = result.data if result.data else []
        
        # Paginação manual
        start = (page - 1) * per_page
        end = start + per_page
        activities = activities_raw[start:end]
        
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
                'total': len(activities_raw),
                'pages': (len(activities_raw) + per_page - 1) // per_page if activities_raw else 0
            }
        }), 200
    except Exception as e:
        logger.error(f"Erro ao buscar atividades: {str(e)}")
        return jsonify({'error': 'Erro interno do servidor', 'details': str(e)}), 500

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