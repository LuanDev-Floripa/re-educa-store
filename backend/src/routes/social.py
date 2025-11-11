# -*- coding: utf-8 -*-
"""
Rotas da Rede Social RE-EDUCA - Supabase

Usa social_service para lógica de negócio.
"""
from flask import Blueprint, request, jsonify
from middleware.auth import token_required
from services.social_service import social_service
from utils.validators import validate_required_fields
from utils.decorators import handle_exceptions
import logging

# Configurar logging
logger = logging.getLogger(__name__)

# Criar blueprint
social_bp = Blueprint('social', __name__, url_prefix='/api/social')

# =====================================================
# ROTAS DE POSTS
# =====================================================

@social_bp.route('/posts', methods=['POST'])
@token_required
@handle_exceptions
def create_post():
    """Criar um novo post"""
    data = request.get_json()
    user_id = request.current_user['id']

    # Validar campos obrigatórios
    required_fields = ['content']
    if not validate_required_fields(data, required_fields):
        return jsonify({'error': 'Campos obrigatórios: content'}), 400

    result = social_service.create_post(user_id, data)

    if result.get('success'):
        return jsonify({
            'success': True,
            'post_id': result['post']['id'],
            'created_at': result['post']['created_at'],
            'message': result['message']
        }), 201
    else:
        return jsonify({'error': result.get('error', 'Erro ao criar post')}), 500

@social_bp.route('/posts', methods=['GET'])
@token_required
@handle_exceptions
def get_posts():
    """Buscar posts do feed"""
    user_id = request.current_user['id']
    page = request.args.get('page', 1, type=int)
    limit = request.args.get('limit', 20, type=int)
    post_type = request.args.get('type')
    hashtag = request.args.get('hashtag')

    result = social_service.get_posts(user_id, page, limit, post_type, hashtag)

    if result.get('success'):
        return jsonify(result), 200
    else:
        return jsonify({'error': result.get('error', 'Erro ao buscar posts')}), 500

@social_bp.route('/posts/<post_id>', methods=['GET'])
@token_required
@handle_exceptions
def get_post(post_id):
    """Buscar um post específico"""
    user_id = request.current_user['id']

    result = social_service.get_post(post_id, user_id)

    if result.get('success'):
        return jsonify(result), 200
    else:
        status = 404 if 'não encontrado' in result.get('error', '') else 403
        return jsonify({'error': result.get('error', 'Erro ao buscar post')}), status

@social_bp.route('/posts/<post_id>', methods=['PUT'])
@token_required
@handle_exceptions
def update_post(post_id):
    """Atualizar um post"""
    user_id = request.current_user['id']
    data = request.get_json()

    result = social_service.update_post(post_id, user_id, data)

    if result.get('success'):
        return jsonify(result), 200
    else:
        status = 404 if 'não encontrado' in result.get('error', '') else 403
        return jsonify({'error': result.get('error', 'Erro ao atualizar post')}), status

@social_bp.route('/posts/<post_id>', methods=['DELETE'])
@token_required
@handle_exceptions
def delete_post(post_id):
    """Deletar um post"""
    user_id = request.current_user['id']

    result = social_service.delete_post(post_id, user_id)

    if result.get('success'):
        return jsonify(result), 200
    else:
        status = 404 if 'não encontrado' in result.get('error', '') else 403
        return jsonify({'error': result.get('error', 'Erro ao deletar post')}), status

# =====================================================
# ROTAS DE COMENTÁRIOS
# =====================================================

@social_bp.route('/posts/<post_id>/comments', methods=['POST'])
@token_required
@handle_exceptions
def create_comment(post_id):
    """Criar um comentário"""
    user_id = request.current_user['id']
    data = request.get_json()

    if not data.get('content'):
        return jsonify({'error': 'Conteúdo do comentário é obrigatório'}), 400

    result = social_service.create_comment(post_id, user_id, data)

    if result.get('success'):
        return jsonify({
            'success': True,
            'comment_id': result['comment']['id'],
            'created_at': result['comment']['created_at'],
            'message': result['message']
        }), 201
    else:
        status = 404 if 'não encontrado' in result.get('error', '') else 403
        return jsonify({'error': result.get('error', 'Erro ao criar comentário')}), status

@social_bp.route('/posts/<post_id>/comments', methods=['GET'])
@token_required
@handle_exceptions
def get_comments(post_id):
    """Buscar comentários de um post"""
    user_id = request.current_user['id']
    page = request.args.get('page', 1, type=int)
    limit = request.args.get('limit', 20, type=int)

    result = social_service.get_comments(post_id, user_id, page, limit)

    if result.get('success'):
        return jsonify(result), 200
    else:
        status = 404 if 'não encontrado' in result.get('error', '') else 403
        return jsonify({'error': result.get('error', 'Erro ao buscar comentários')}), status

# =====================================================
# ROTAS DE REAÇÕES
# =====================================================

@social_bp.route('/posts/<post_id>/reactions', methods=['POST'])
@token_required
@handle_exceptions
def create_reaction(post_id):
    """Criar ou atualizar reação em um post"""
    user_id = request.current_user['id']
    data = request.get_json() or {}
    reaction_type = data.get('reaction_type', 'like')

    result = social_service.create_reaction(post_id, user_id, reaction_type)

    if result.get('success'):
        return jsonify(result), 200
    else:
        return jsonify({'error': result.get('error', 'Erro ao criar reação')}), 500

@social_bp.route('/posts/<post_id>/reactions', methods=['DELETE'])
@token_required
@handle_exceptions
def remove_reaction(post_id):
    """Remover reação de um post"""
    user_id = request.current_user['id']
    reaction_type = request.args.get('reaction_type', 'like')

    result = social_service.remove_reaction(post_id, user_id, reaction_type)

    if result.get('success'):
        return jsonify(result), 200
    else:
        return jsonify({'error': result.get('error', 'Erro ao remover reação')}), 500

# =====================================================
# ROTAS DE SEGUIDORES
# =====================================================

@social_bp.route('/users/<user_id>/follow', methods=['POST'])
@token_required
@handle_exceptions
def follow_user(user_id):
    """Seguir um usuário"""
    follower_id = request.current_user['id']

    result = social_service.follow_user(follower_id, user_id)

    if result.get('success'):
        return jsonify(result), 200
    else:
        status = 404 if 'não encontrado' in result.get('error', '') else 400
        return jsonify({'error': result.get('error', 'Erro ao seguir usuário')}), status

@social_bp.route('/users/<user_id>/follow', methods=['DELETE'])
@token_required
@handle_exceptions
def unfollow_user(user_id):
    """Deixar de seguir um usuário"""
    follower_id = request.current_user['id']

    result = social_service.unfollow_user(follower_id, user_id)

    if result.get('success'):
        return jsonify(result), 200
    else:
        return jsonify({'error': result.get('error', 'Erro ao deixar de seguir')}), 500

# =====================================================
# ROTAS DE NOTIFICAÇÕES
# =====================================================

@social_bp.route('/notifications', methods=['GET'])
@token_required
@handle_exceptions
def get_notifications():
    """Buscar notificações do usuário"""
    user_id = request.current_user['id']
    page = request.args.get('page', 1, type=int)
    limit = request.args.get('limit', 20, type=int)
    unread_only = request.args.get('unread_only', 'false').lower() == 'true'

    result = social_service.get_notifications(user_id, page, limit, unread_only)

    if result.get('success'):
        return jsonify(result), 200
    else:
        return jsonify({'error': result.get('error', 'Erro ao buscar notificações')}), 500

@social_bp.route('/notifications/<notification_id>/read', methods=['PUT'])
@token_required
@handle_exceptions
def mark_notification_read(notification_id):
    """Marcar notificação como lida"""
    user_id = request.current_user['id']

    result = social_service.mark_notification_read(notification_id, user_id)

    if result.get('success'):
        return jsonify(result), 200
    else:
        return jsonify({'error': result.get('error', 'Erro ao marcar notificação')}), 500

# =====================================================
# ROTAS DE BUSCA
# =====================================================

@social_bp.route('/search', methods=['GET'])
@token_required
@handle_exceptions
def search():
    """
    Busca avançada de posts, usuários e hashtags.
    
    Suporta filtros avançados incluindo:
    - Tipo de busca (posts, users, hashtags, all)
    - Filtro por data (day, week, month, year, all)
    - Ordenação (recent, oldest, popular)
    - Filtro por verificado
    - Filtro por mídia
    - Filtro por mínimo de likes
    - Filtro por localização
    """
    query = request.args.get('q', '')
    search_type = request.args.get('type', 'all')
    page = request.args.get('page', 1, type=int)
    limit = request.args.get('limit', 20, type=int)
    
    # Filtros avançados
    filters = {
        'type': request.args.get('type', 'all'),
        'dateRange': request.args.get('dateRange', 'all'),
        'sortBy': request.args.get('sortBy', 'recent'),
        'verified': request.args.get('verified', 'false').lower() == 'true',
        'media': request.args.get('media', 'false').lower() == 'true',
        'minLikes': request.args.get('minLikes', 0, type=int),
        'location': request.args.get('location', ''),
    }

    if not query:
        return jsonify({'error': 'Query de busca é obrigatória'}), 400

    result = social_service.search(query, search_type, page, limit, filters)

    if result.get('success'):
        return jsonify(result), 200
    else:
        return jsonify({'error': result.get('error', 'Erro na busca')}), 500
