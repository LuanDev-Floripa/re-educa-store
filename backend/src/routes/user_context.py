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
from utils.decorators import handle_exceptions
from services.favorite_service import FavoriteService
from services.user_service import UserService
from services.health_service import HealthService
from services.order_service import OrderService
import logging

logger = logging.getLogger(__name__)

# Criar blueprint
user_context_bp = Blueprint('user_context', __name__, url_prefix='/api/user')

# Instanciar services
favorite_service = FavoriteService()
user_service = UserService()
health_service = HealthService()
order_service = OrderService()

# =====================================================
# ROTAS DE FAVORITOS
# =====================================================

@user_context_bp.route('/favorites', methods=['GET'])
@token_required
@handle_exceptions
def get_user_favorites():
    """Obter favoritos do usuário"""
    user_id = request.current_user['id']

    try:
        # ✅ CORRIGIDO: Usa FavoriteService em vez de query direta
        favorites = favorite_service.get_user_favorites(user_id)
        return jsonify({
            'success': True,
            'favorites': favorites
        }), 200
    except Exception as e:
        logger.error(f"Erro ao obter favoritos: {e}")
        return jsonify({'error': 'Erro ao obter favoritos'}), 500

@user_context_bp.route('/favorites', methods=['POST'])
@token_required
@handle_exceptions
def add_favorite():
    """Adicionar produto aos favoritos"""
    user_id = request.current_user['id']
    data = request.get_json()

    product_id = data.get('product_id')
    if not product_id:
        return jsonify({'error': 'product_id é obrigatório'}), 400

    try:
        # ✅ CORRIGIDO: Usa FavoriteService em vez de query direta
        result = favorite_service.add_favorite(user_id, product_id)

        if result.get('success'):
            return jsonify({
                'success': True,
                'favorite': result.get('favorite')
            }), 201
        return jsonify({'error': result.get('error', 'Falha ao adicionar favorito')}), 400
    except Exception as e:
        logger.error(f"Erro ao adicionar favorito: {e}")
        return jsonify({'error': 'Erro ao adicionar favorito'}), 500

@user_context_bp.route('/favorites/<product_id>', methods=['DELETE'])
@token_required
@handle_exceptions
def remove_favorite(product_id):
    """Remover produto dos favoritos"""
    user_id = request.current_user['id']

    try:
        # ✅ CORRIGIDO: Usa FavoriteService em vez de query direta
        result = favorite_service.remove_favorite(user_id, product_id)

        if result.get('success'):
            return jsonify({'success': True, 'message': 'Favorito removido'}), 200
        return jsonify({'error': result.get('error', 'Erro ao remover favorito')}), 400
    except Exception as e:
        logger.error(f"Erro ao remover favorito: {e}")
        return jsonify({'error': 'Erro ao remover favorito'}), 500

# =====================================================
# ROTAS DE CONTEXTO COMPLETO (para IA)
# =====================================================

@user_context_bp.route('/context', methods=['GET'])
@token_required
@handle_exceptions
def get_user_context():
    """Obter contexto completo do usuário para IA"""
    user_id = request.current_user['id']

    try:
        context = {
            'profile': {},
            'health': {},
            'workouts': [],
            'goals': [],
            'purchases': [],
            'favorites': []
        }

        # ✅ CORRIGIDO: Usa services em vez de queries diretas
        # Obter perfil
        profile = user_service.get_user_by_id(user_id)
        if profile:
            context['profile'] = profile

        # Obter dados de saúde
        health_data = health_service.get_health_analytics(user_id, period_days=30)
        if health_data.get('health'):
            context['health'] = health_data['health']

        # Obter treinos recentes (pode criar método específico depois)
        # Por enquanto vazio - TODO: Criar método em ExerciseService
        context['workouts'] = []

        # Obter objetivos (pode criar método depois)
        # Por enquanto vazio - TODO: Criar método em UserService
        context['goals'] = []

        # Obter compras recentes
        orders_result = order_service.get_user_orders(user_id, page=1, per_page=10)
        if orders_result.get('orders'):
            context['purchases'] = orders_result['orders']

        # Obter favoritos
        favorites = favorite_service.get_user_favorites(user_id)
        if favorites:
            context['favorites'] = favorites

        return jsonify({
            'success': True,
            'context': context
        }), 200
    except Exception as e:
        logger.error(f"Erro ao obter contexto do usuário: {e}")
        return jsonify({'error': 'Erro ao obter contexto do usuário'}), 500

@user_context_bp.route('/preferences', methods=['GET'])
@token_required
@handle_exceptions
def get_user_preferences():
    """Obter preferências do usuário"""
    user_id = request.current_user['id']

    try:
        # ✅ CORRIGIDO: Já está usando UserService (linha 155)
        # Mantido apenas para garantir consistência
        user = user_service.get_user_by_id(user_id)
        preferences = user.get('preferences', {}) if user else {}

        return jsonify({
            'success': True,
            'preferences': preferences
        }), 200
    except Exception as e:
        logger.error(f"Erro ao obter preferências: {e}")
        return jsonify({'error': 'Erro ao obter preferências'}), 500

@user_context_bp.route('/preferences', methods=['PUT'])
@token_required
@handle_exceptions
def update_user_preferences():
    """Atualizar preferências do usuário"""
    user_id = request.current_user['id']
    data = request.get_json()

    try:
        # ✅ CORRIGIDO: Usa UserService em vez de query direta
        result = user_service.update_user_profile(user_id, {'preferences': data})

        if result.get('success'):
            return jsonify({
                'success': True,
                'preferences': result.get('user', {}).get('preferences', {})
            }), 200
        return jsonify({'error': result.get('error', 'Falha ao atualizar preferências')}), 400
    except Exception as e:
        logger.error(f"Erro ao atualizar preferências: {e}")
        return jsonify({'error': 'Erro ao atualizar preferências'}), 500
