# -*- coding: utf-8 -*-
"""
Rotas de Contexto do Usuário - RE-EDUCA Store

Endpoints para obter dados contextuais do usuário:
- Favoritos
- Preferências
- Dados de contexto completo (para IA)
"""
from flask import Blueprint, request, jsonify
from middleware.auth import token_required
from utils.exception_strategies import handle_route_exceptions
from exceptions.custom_exceptions import ValidationError, NotFoundError, InternalServerError
from services.favorite_service import FavoriteService
from services.user_service import UserService
from services.health_service import HealthService
from services.order_service import OrderService
from services.exercise_service import ExerciseService
import logging

logger = logging.getLogger(__name__)

# Criar blueprint
user_context_bp = Blueprint('user_context', __name__, url_prefix='/api/user')

# Instanciar services
favorite_service = FavoriteService()
user_service = UserService()
health_service = HealthService()
order_service = OrderService()
exercise_service = ExerciseService()

# =====================================================
# ROTAS DE FAVORITOS
# =====================================================

@user_context_bp.route('/favorites', methods=['GET'])
@token_required
@handle_route_exceptions
def get_user_favorites():
    """
    Obter favoritos do usuário.
    
    Implementa tratamento robusto de exceções e utiliza FavoriteService.
    """
    user_id = request.current_user['id']

    # Utiliza FavoriteService para busca padronizada
    favorites = favorite_service.get_user_favorites(user_id)
    return jsonify({
        'success': True,
        'favorites': favorites
    }), 200

@user_context_bp.route('/favorites', methods=['POST'])
@token_required
@handle_route_exceptions
def add_favorite():
    """
    Adicionar produto aos favoritos.
    
    Implementa tratamento robusto de exceções e utiliza FavoriteService.
    """
    user_id = request.current_user['id']
    data = request.get_json()

    product_id = data.get('product_id')
    if not product_id:
        raise ValidationError('product_id é obrigatório')

    # Utiliza FavoriteService para operações padronizadas
    result = favorite_service.add_favorite(user_id, product_id)

    if not result.get('success'):
        raise ValidationError(result.get('error', 'Falha ao adicionar favorito'))

    return jsonify({
        'success': True,
        'favorite': result.get('favorite')
    }), 201

@user_context_bp.route('/favorites/<product_id>', methods=['DELETE'])
@token_required
@handle_route_exceptions
def remove_favorite(product_id):
    """
    Remover produto dos favoritos.
    
    Implementa tratamento robusto de exceções e utiliza FavoriteService.
    """
    if not product_id:
        raise ValidationError("product_id é obrigatório")
    
    user_id = request.current_user['id']

    # Utiliza FavoriteService para operações padronizadas
    result = favorite_service.remove_favorite(user_id, product_id)

    if not result.get('success'):
        raise ValidationError(result.get('error', 'Erro ao remover favorito'))

    return jsonify({'success': True, 'message': 'Favorito removido'}), 200

# =====================================================
# ROTAS DE CONTEXTO COMPLETO (para IA)
# =====================================================

@user_context_bp.route('/context', methods=['GET'])
@token_required
@handle_route_exceptions
def get_user_context():
    """
    Obter contexto completo do usuário para IA.
    
    Implementa tratamento robusto de exceções e utiliza services padronizados.
    """
    user_id = request.current_user['id']

    context = {
        'profile': {},
        'health': {},
        'workouts': [],
        'goals': [],
        'purchases': [],
        'favorites': []
    }

    # Utiliza services padronizados em vez de queries diretas
    # Obter perfil
    try:
        profile = user_service.get_user_by_id(user_id)
        if profile:
            context['profile'] = profile
    except (ValueError, KeyError, AttributeError, ConnectionError, TimeoutError) as e:
        logger.warning(f"Erro ao obter perfil: {e}")
        # Continua mesmo se houver erro em um componente específico

    # Obter dados de saúde
    try:
        health_data = health_service.get_health_analytics(user_id, period_days=30)
        if health_data.get('health'):
            context['health'] = health_data['health']
    except (ValueError, KeyError, AttributeError, ConnectionError, TimeoutError) as e:
        logger.warning(f"Erro ao obter dados de saúde: {e}")
        # Continua mesmo se houver erro em um componente específico

    # Utiliza métodos de ExerciseService e UserService
    try:
        workouts = exercise_service.get_recent_workouts(user_id, limit=5)
        context['workouts'] = workouts if workouts else []
    except (ValueError, KeyError, AttributeError, ConnectionError, TimeoutError) as e:
        logger.warning(f"Erro ao obter treinos: {e}")
        # Continua mesmo se houver erro em um componente específico

    # Utiliza método de UserService
    try:
        goals = user_service.get_user_goals(user_id, active_only=True)
        context['goals'] = goals if goals else []
    except (ValueError, KeyError, AttributeError, ConnectionError, TimeoutError) as e:
        logger.warning(f"Erro ao obter objetivos: {e}")
        # Continua mesmo se houver erro em um componente específico

    # Obter compras recentes
    try:
        orders_result = order_service.get_user_orders(user_id, page=1, per_page=10)
        if orders_result.get('orders'):
            context['purchases'] = orders_result['orders']
    except (ValueError, KeyError, AttributeError, ConnectionError, TimeoutError) as e:
        logger.warning(f"Erro ao obter compras: {e}")
        # Continua mesmo se houver erro em um componente específico

    # Obter favoritos
    try:
        favorites = favorite_service.get_user_favorites(user_id)
        if favorites:
            context['favorites'] = favorites
    except (ValueError, KeyError, AttributeError, ConnectionError, TimeoutError) as e:
        logger.warning(f"Erro ao obter favoritos: {e}")
        # Continua mesmo se houver erro em um componente específico

    return jsonify({
        'success': True,
        'context': context
    }), 200

@user_context_bp.route('/preferences', methods=['GET'])
@token_required
@handle_route_exceptions
def get_user_preferences():
    """
    Obter preferências do usuário.
    
    Implementa tratamento robusto de exceções e utiliza UserService.
    """
    user_id = request.current_user['id']

    # Utiliza UserService para busca padronizada
    user = user_service.get_user_by_id(user_id)
    preferences = user.get('preferences', {}) if user else {}

    return jsonify({
        'success': True,
        'preferences': preferences
    }), 200

@user_context_bp.route('/preferences', methods=['PUT'])
@token_required
@handle_route_exceptions
def update_user_preferences():
    """
    Atualizar preferências do usuário.
    
    Implementa tratamento robusto de exceções e utiliza UserService.
    """
    user_id = request.current_user['id']
    data = request.get_json()

    if not data:
        raise ValidationError('Dados não fornecidos')

    # Utiliza UserService para operações padronizadas
    result = user_service.update_user_profile(user_id, {'preferences': data})

    if not result.get('success'):
        raise ValidationError(result.get('error', 'Falha ao atualizar preferências'))

    return jsonify({
        'success': True,
        'preferences': result.get('user', {}).get('preferences', {})
    }), 200
