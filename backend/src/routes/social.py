# -*- coding: utf-8 -*-
"""
Rotas da Rede Social RE-EDUCA
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from database.connection import get_db_connection
from utils.validators import validate_required_fields
from utils.decorators import handle_exceptions
import logging
from datetime import datetime, timezone
import json

# Configurar logging
logger = logging.getLogger(__name__)

# Criar blueprint
social_bp = Blueprint('social', __name__, url_prefix='/api/social')

# =====================================================
# ROTAS DE POSTS
# =====================================================

@social_bp.route('/posts', methods=['POST'])
@jwt_required()
@handle_exceptions
def create_post():
    """Criar um novo post"""
    data = request.get_json()
    user_id = get_jwt_identity()
    
    # Validar campos obrigatórios
    required_fields = ['content']
    if not validate_required_fields(data, required_fields):
        return jsonify({'error': 'Campos obrigatórios: content'}), 400
    
    # Conectar ao banco
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # Inserir post
        cursor.execute("""
            INSERT INTO posts (user_id, content, post_type, media_urls, hashtags, 
                             mentions, is_public, location, mood)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id, created_at
        """, (
            user_id,
            data['content'],
            data.get('post_type', 'text'),
            data.get('media_urls', []),
            data.get('hashtags', []),
            data.get('mentions', []),
            data.get('is_public', True),
            data.get('location'),
            data.get('mood')
        ))
        
        result = cursor.fetchone()
        post_id = result[0]
        created_at = result[1]
        
        # Processar hashtags
        if data.get('hashtags'):
            for hashtag in data['hashtags']:
                # Inserir ou atualizar hashtag
                cursor.execute("""
                    INSERT INTO hashtags (name, usage_count) 
                    VALUES (%s, 1)
                    ON CONFLICT (name) 
                    DO UPDATE SET usage_count = hashtags.usage_count + 1
                """, (hashtag,))
                
                # Relacionar post com hashtag
                cursor.execute("""
                    INSERT INTO post_hashtags (post_id, hashtag_id)
                    SELECT %s, id FROM hashtags WHERE name = %s
                """, (post_id, hashtag))
        
        conn.commit()
        
        return jsonify({
            'success': True,
            'post_id': post_id,
            'created_at': created_at.isoformat(),
            'message': 'Post criado com sucesso!'
        }), 201
        
    except Exception as e:
        conn.rollback()
        logger.error(f"Erro ao criar post: {str(e)}")
        return jsonify({'error': 'Erro interno do servidor'}), 500
    finally:
        cursor.close()
        conn.close()

@social_bp.route('/posts', methods=['GET'])
@jwt_required()
@handle_exceptions
def get_posts():
    """Buscar posts do feed"""
    user_id = get_jwt_identity()
    page = request.args.get('page', 1, type=int)
    limit = request.args.get('limit', 20, type=int)
    post_type = request.args.get('type')
    hashtag = request.args.get('hashtag')
    
    offset = (page - 1) * limit
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # Query base
        base_query = """
            SELECT p.id, p.user_id, p.content, p.post_type, p.media_urls, 
                   p.hashtags, p.mentions, p.is_public, p.location, p.mood,
                   p.created_at, p.updated_at,
                   u.name as user_name, u.avatar_url,
                   COUNT(DISTINCT r.id) as reaction_count,
                   COUNT(DISTINCT c.id) as comment_count,
                   COUNT(DISTINCT s.id) as share_count,
                   CASE WHEN EXISTS(
                       SELECT 1 FROM reactions r2 
                       WHERE r2.post_id = p.id AND r2.user_id = %s
                   ) THEN true ELSE false END as user_reacted
            FROM posts p
            JOIN auth.users u ON p.user_id = u.id
            LEFT JOIN reactions r ON p.id = r.post_id
            LEFT JOIN comments c ON p.id = c.post_id
            LEFT JOIN shares s ON p.id = s.post_id
            WHERE p.is_public = true
        """
        
        params = [user_id]
        
        # Filtros
        if post_type:
            base_query += " AND p.post_type = %s"
            params.append(post_type)
            
        if hashtag:
            base_query += " AND %s = ANY(p.hashtags)"
            params.append(hashtag)
        
        # Ordenação e paginação
        base_query += """
            GROUP BY p.id, u.name, u.avatar_url
            ORDER BY p.created_at DESC
            LIMIT %s OFFSET %s
        """
        params.extend([limit, offset])
        
        cursor.execute(base_query, params)
        posts = cursor.fetchall()
        
        # Converter para dicionários
        posts_list = []
        for post in posts:
            posts_list.append({
                'id': post[0],
                'user_id': post[1],
                'content': post[2],
                'post_type': post[3],
                'media_urls': post[4] or [],
                'hashtags': post[5] or [],
                'mentions': post[6] or [],
                'is_public': post[7],
                'location': post[8],
                'mood': post[9],
                'created_at': post[10].isoformat(),
                'updated_at': post[11].isoformat(),
                'user_name': post[12],
                'avatar_url': post[13],
                'reaction_count': post[14],
                'comment_count': post[15],
                'share_count': post[16],
                'user_reacted': post[17]
            })
        
        return jsonify({
            'success': True,
            'posts': posts_list,
            'page': page,
            'limit': limit,
            'total': len(posts_list)
        }), 200
        
    except Exception as e:
        logger.error(f"Erro ao buscar posts: {str(e)}")
        return jsonify({'error': 'Erro interno do servidor'}), 500
    finally:
        cursor.close()
        conn.close()

@social_bp.route('/posts/<post_id>', methods=['GET'])
@jwt_required()
@handle_exceptions
def get_post(post_id):
    """Buscar um post específico"""
    user_id = get_jwt_identity()
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        cursor.execute("""
            SELECT p.id, p.user_id, p.content, p.post_type, p.media_urls, 
                   p.hashtags, p.mentions, p.is_public, p.location, p.mood,
                   p.created_at, p.updated_at,
                   u.name as user_name, u.avatar_url,
                   COUNT(DISTINCT r.id) as reaction_count,
                   COUNT(DISTINCT c.id) as comment_count,
                   COUNT(DISTINCT s.id) as share_count,
                   CASE WHEN EXISTS(
                       SELECT 1 FROM reactions r2 
                       WHERE r2.post_id = p.id AND r2.user_id = %s
                   ) THEN true ELSE false END as user_reacted
            FROM posts p
            JOIN auth.users u ON p.user_id = u.id
            LEFT JOIN reactions r ON p.id = r.post_id
            LEFT JOIN comments c ON p.id = c.post_id
            LEFT JOIN shares s ON p.id = s.post_id
            WHERE p.id = %s AND (p.is_public = true OR p.user_id = %s)
            GROUP BY p.id, u.name, u.avatar_url
        """, (user_id, post_id, user_id))
        
        post = cursor.fetchone()
        
        if not post:
            return jsonify({'error': 'Post não encontrado'}), 404
        
        post_data = {
            'id': post[0],
            'user_id': post[1],
            'content': post[2],
            'post_type': post[3],
            'media_urls': post[4] or [],
            'hashtags': post[5] or [],
            'mentions': post[6] or [],
            'is_public': post[7],
            'location': post[8],
            'mood': post[9],
            'created_at': post[10].isoformat(),
            'updated_at': post[11].isoformat(),
            'user_name': post[12],
            'avatar_url': post[13],
            'reaction_count': post[14],
            'comment_count': post[15],
            'share_count': post[16],
            'user_reacted': post[17]
        }
        
        return jsonify({
            'success': True,
            'post': post_data
        }), 200
        
    except Exception as e:
        logger.error(f"Erro ao buscar post: {str(e)}")
        return jsonify({'error': 'Erro interno do servidor'}), 500
    finally:
        cursor.close()
        conn.close()

@social_bp.route('/posts/<post_id>', methods=['PUT'])
@jwt_required()
@handle_exceptions
def update_post(post_id):
    """Atualizar um post"""
    user_id = get_jwt_identity()
    data = request.get_json()
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # Verificar se o post pertence ao usuário
        cursor.execute("SELECT user_id FROM posts WHERE id = %s", (post_id,))
        post = cursor.fetchone()
        
        if not post:
            return jsonify({'error': 'Post não encontrado'}), 404
            
        if post[0] != user_id:
            return jsonify({'error': 'Você não tem permissão para editar este post'}), 403
        
        # Atualizar post
        cursor.execute("""
            UPDATE posts 
            SET content = %s, media_urls = %s, hashtags = %s, 
                mentions = %s, is_public = %s, location = %s, 
                mood = %s, updated_at = NOW()
            WHERE id = %s
        """, (
            data.get('content'),
            data.get('media_urls', []),
            data.get('hashtags', []),
            data.get('mentions', []),
            data.get('is_public', True),
            data.get('location'),
            data.get('mood'),
            post_id
        ))
        
        conn.commit()
        
        return jsonify({
            'success': True,
            'message': 'Post atualizado com sucesso!'
        }), 200
        
    except Exception as e:
        conn.rollback()
        logger.error(f"Erro ao atualizar post: {str(e)}")
        return jsonify({'error': 'Erro interno do servidor'}), 500
    finally:
        cursor.close()
        conn.close()

@social_bp.route('/posts/<post_id>', methods=['DELETE'])
@jwt_required()
@handle_exceptions
def delete_post(post_id):
    """Deletar um post"""
    user_id = get_jwt_identity()
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # Verificar se o post pertence ao usuário
        cursor.execute("SELECT user_id FROM posts WHERE id = %s", (post_id,))
        post = cursor.fetchone()
        
        if not post:
            return jsonify({'error': 'Post não encontrado'}), 404
            
        if post[0] != user_id:
            return jsonify({'error': 'Você não tem permissão para deletar este post'}), 403
        
        # Deletar post (cascade vai deletar reações, comentários, etc.)
        cursor.execute("DELETE FROM posts WHERE id = %s", (post_id,))
        
        conn.commit()
        
        return jsonify({
            'success': True,
            'message': 'Post deletado com sucesso!'
        }), 200
        
    except Exception as e:
        conn.rollback()
        logger.error(f"Erro ao deletar post: {str(e)}")
        return jsonify({'error': 'Erro interno do servidor'}), 500
    finally:
        cursor.close()
        conn.close()

# =====================================================
# ROTAS DE COMENTÁRIOS
# =====================================================

@social_bp.route('/posts/<post_id>/comments', methods=['POST'])
@jwt_required()
@handle_exceptions
def create_comment(post_id):
    """Criar um comentário"""
    user_id = get_jwt_identity()
    data = request.get_json()
    
    if not data.get('content'):
        return jsonify({'error': 'Conteúdo do comentário é obrigatório'}), 400
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # Verificar se o post existe e é público
        cursor.execute("""
            SELECT id, is_public, user_id FROM posts 
            WHERE id = %s AND (is_public = true OR user_id = %s)
        """, (post_id, user_id))
        
        post = cursor.fetchone()
        if not post:
            return jsonify({'error': 'Post não encontrado ou privado'}), 404
        
        # Inserir comentário
        cursor.execute("""
            INSERT INTO comments (post_id, user_id, content, parent_comment_id)
            VALUES (%s, %s, %s, %s)
            RETURNING id, created_at
        """, (
            post_id,
            user_id,
            data['content'],
            data.get('parent_comment_id')
        ))
        
        result = cursor.fetchone()
        comment_id = result[0]
        created_at = result[1]
        
        conn.commit()
        
        return jsonify({
            'success': True,
            'comment_id': comment_id,
            'created_at': created_at.isoformat(),
            'message': 'Comentário criado com sucesso!'
        }), 201
        
    except Exception as e:
        conn.rollback()
        logger.error(f"Erro ao criar comentário: {str(e)}")
        return jsonify({'error': 'Erro interno do servidor'}), 500
    finally:
        cursor.close()
        conn.close()

@social_bp.route('/posts/<post_id>/comments', methods=['GET'])
@jwt_required()
@handle_exceptions
def get_comments(post_id):
    """Buscar comentários de um post"""
    user_id = get_jwt_identity()
    page = request.args.get('page', 1, type=int)
    limit = request.args.get('limit', 20, type=int)
    
    offset = (page - 1) * limit
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # Verificar se o post existe e é público
        cursor.execute("""
            SELECT id, is_public, user_id FROM posts 
            WHERE id = %s AND (is_public = true OR user_id = %s)
        """, (post_id, user_id))
        
        post = cursor.fetchone()
        if not post:
            return jsonify({'error': 'Post não encontrado ou privado'}), 404
        
        # Buscar comentários
        cursor.execute("""
            SELECT c.id, c.user_id, c.content, c.parent_comment_id, 
                   c.is_edited, c.created_at, c.updated_at,
                   u.name as user_name, u.avatar_url,
                   COUNT(DISTINCT r.id) as reaction_count,
                   CASE WHEN EXISTS(
                       SELECT 1 FROM reactions r2 
                       WHERE r2.comment_id = c.id AND r2.user_id = %s
                   ) THEN true ELSE false END as user_reacted
            FROM comments c
            JOIN auth.users u ON c.user_id = u.id
            LEFT JOIN reactions r ON c.id = r.comment_id
            WHERE c.post_id = %s
            GROUP BY c.id, u.name, u.avatar_url
            ORDER BY c.created_at ASC
            LIMIT %s OFFSET %s
        """, (user_id, post_id, limit, offset))
        
        comments = cursor.fetchall()
        
        comments_list = []
        for comment in comments:
            comments_list.append({
                'id': comment[0],
                'user_id': comment[1],
                'content': comment[2],
                'parent_comment_id': comment[3],
                'is_edited': comment[4],
                'created_at': comment[5].isoformat(),
                'updated_at': comment[6].isoformat(),
                'user_name': comment[7],
                'avatar_url': comment[8],
                'reaction_count': comment[9],
                'user_reacted': comment[10]
            })
        
        return jsonify({
            'success': True,
            'comments': comments_list,
            'page': page,
            'limit': limit,
            'total': len(comments_list)
        }), 200
        
    except Exception as e:
        logger.error(f"Erro ao buscar comentários: {str(e)}")
        return jsonify({'error': 'Erro interno do servidor'}), 500
    finally:
        cursor.close()
        conn.close()

# =====================================================
# ROTAS DE REAÇÕES
# =====================================================

@social_bp.route('/posts/<post_id>/reactions', methods=['POST'])
@jwt_required()
@handle_exceptions
def create_reaction(post_id):
    """Criar ou atualizar reação em um post"""
    user_id = get_jwt_identity()
    data = request.get_json()
    
    reaction_type = data.get('reaction_type', 'like')
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # Verificar se o post existe
        cursor.execute("SELECT id FROM posts WHERE id = %s", (post_id,))
        if not cursor.fetchone():
            return jsonify({'error': 'Post não encontrado'}), 404
        
        # Inserir ou atualizar reação
        cursor.execute("""
            INSERT INTO reactions (post_id, user_id, reaction_type)
            VALUES (%s, %s, %s)
            ON CONFLICT (post_id, user_id, reaction_type) 
            DO UPDATE SET reaction_type = EXCLUDED.reaction_type
        """, (post_id, user_id, reaction_type))
        
        conn.commit()
        
        return jsonify({
            'success': True,
            'message': 'Reação adicionada com sucesso!'
        }), 200
        
    except Exception as e:
        conn.rollback()
        logger.error(f"Erro ao criar reação: {str(e)}")
        return jsonify({'error': 'Erro interno do servidor'}), 500
    finally:
        cursor.close()
        conn.close()

@social_bp.route('/posts/<post_id>/reactions', methods=['DELETE'])
@jwt_required()
@handle_exceptions
def remove_reaction(post_id):
    """Remover reação de um post"""
    user_id = get_jwt_identity()
    reaction_type = request.args.get('reaction_type', 'like')
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        cursor.execute("""
            DELETE FROM reactions 
            WHERE post_id = %s AND user_id = %s AND reaction_type = %s
        """, (post_id, user_id, reaction_type))
        
        conn.commit()
        
        return jsonify({
            'success': True,
            'message': 'Reação removida com sucesso!'
        }), 200
        
    except Exception as e:
        conn.rollback()
        logger.error(f"Erro ao remover reação: {str(e)}")
        return jsonify({'error': 'Erro interno do servidor'}), 500
    finally:
        cursor.close()
        conn.close()

# =====================================================
# ROTAS DE SEGUIDORES
# =====================================================

@social_bp.route('/users/<user_id>/follow', methods=['POST'])
@jwt_required()
@handle_exceptions
def follow_user(user_id):
    """Seguir um usuário"""
    follower_id = get_jwt_identity()
    
    if follower_id == user_id:
        return jsonify({'error': 'Você não pode seguir a si mesmo'}), 400
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # Verificar se o usuário existe
        cursor.execute("SELECT id FROM auth.users WHERE id = %s", (user_id,))
        if not cursor.fetchone():
            return jsonify({'error': 'Usuário não encontrado'}), 404
        
        # Inserir follow
        cursor.execute("""
            INSERT INTO follows (follower_id, following_id)
            VALUES (%s, %s)
            ON CONFLICT (follower_id, following_id) DO NOTHING
        """, (follower_id, user_id))
        
        conn.commit()
        
        return jsonify({
            'success': True,
            'message': 'Usuário seguido com sucesso!'
        }), 200
        
    except Exception as e:
        conn.rollback()
        logger.error(f"Erro ao seguir usuário: {str(e)}")
        return jsonify({'error': 'Erro interno do servidor'}), 500
    finally:
        cursor.close()
        conn.close()

@social_bp.route('/users/<user_id>/follow', methods=['DELETE'])
@jwt_required()
@handle_exceptions
def unfollow_user(user_id):
    """Deixar de seguir um usuário"""
    follower_id = get_jwt_identity()
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        cursor.execute("""
            DELETE FROM follows 
            WHERE follower_id = %s AND following_id = %s
        """, (follower_id, user_id))
        
        conn.commit()
        
        return jsonify({
            'success': True,
            'message': 'Deixou de seguir o usuário!'
        }), 200
        
    except Exception as e:
        conn.rollback()
        logger.error(f"Erro ao deixar de seguir usuário: {str(e)}")
        return jsonify({'error': 'Erro interno do servidor'}), 500
    finally:
        cursor.close()
        conn.close()

# =====================================================
# ROTAS DE NOTIFICAÇÕES
# =====================================================

@social_bp.route('/notifications', methods=['GET'])
@jwt_required()
@handle_exceptions
def get_notifications():
    """Buscar notificações do usuário"""
    user_id = get_jwt_identity()
    page = request.args.get('page', 1, type=int)
    limit = request.args.get('limit', 20, type=int)
    unread_only = request.args.get('unread_only', 'false').lower() == 'true'
    
    offset = (page - 1) * limit
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        query = """
            SELECT n.id, n.type, n.title, n.message, n.data, n.is_read, 
                   n.created_at, u.name as from_user_name, u.avatar_url
            FROM notifications n
            LEFT JOIN auth.users u ON n.from_user_id = u.id
            WHERE n.user_id = %s
        """
        params = [user_id]
        
        if unread_only:
            query += " AND n.is_read = false"
        
        query += " ORDER BY n.created_at DESC LIMIT %s OFFSET %s"
        params.extend([limit, offset])
        
        cursor.execute(query, params)
        notifications = cursor.fetchall()
        
        notifications_list = []
        for notif in notifications:
            notifications_list.append({
                'id': notif[0],
                'type': notif[1],
                'title': notif[2],
                'message': notif[3],
                'data': notif[4],
                'is_read': notif[5],
                'created_at': notif[6].isoformat(),
                'from_user_name': notif[7],
                'avatar_url': notif[8]
            })
        
        return jsonify({
            'success': True,
            'notifications': notifications_list,
            'page': page,
            'limit': limit,
            'total': len(notifications_list)
        }), 200
        
    except Exception as e:
        logger.error(f"Erro ao buscar notificações: {str(e)}")
        return jsonify({'error': 'Erro interno do servidor'}), 500
    finally:
        cursor.close()
        conn.close()

@social_bp.route('/notifications/<notification_id>/read', methods=['PUT'])
@jwt_required()
@handle_exceptions
def mark_notification_read(notification_id):
    """Marcar notificação como lida"""
    user_id = get_jwt_identity()
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        cursor.execute("""
            UPDATE notifications 
            SET is_read = true 
            WHERE id = %s AND user_id = %s
        """, (notification_id, user_id))
        
        conn.commit()
        
        return jsonify({
            'success': True,
            'message': 'Notificação marcada como lida!'
        }), 200
        
    except Exception as e:
        conn.rollback()
        logger.error(f"Erro ao marcar notificação como lida: {str(e)}")
        return jsonify({'error': 'Erro interno do servidor'}), 500
    finally:
        cursor.close()
        conn.close()

# =====================================================
# ROTAS DE BUSCA
# =====================================================

@social_bp.route('/search', methods=['GET'])
@jwt_required()
@handle_exceptions
def search():
    """Buscar posts, usuários e hashtags"""
    query = request.args.get('q', '')
    search_type = request.args.get('type', 'all')  # all, posts, users, hashtags
    page = request.args.get('page', 1, type=int)
    limit = request.args.get('limit', 20, type=int)
    
    if not query:
        return jsonify({'error': 'Query de busca é obrigatória'}), 400
    
    offset = (page - 1) * limit
    user_id = get_jwt_identity()
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        results = {}
        
        # Buscar posts
        if search_type in ['all', 'posts']:
            cursor.execute("""
                SELECT p.id, p.content, p.post_type, p.created_at,
                       u.name as user_name, u.avatar_url
                FROM posts p
                JOIN auth.users u ON p.user_id = u.id
                WHERE p.is_public = true 
                AND (p.content ILIKE %s OR %s = ANY(p.hashtags))
                ORDER BY p.created_at DESC
                LIMIT %s OFFSET %s
            """, (f'%{query}%', f'#{query}', limit, offset))
            
            posts = cursor.fetchall()
            results['posts'] = [{
                'id': post[0],
                'content': post[1],
                'post_type': post[2],
                'created_at': post[3].isoformat(),
                'user_name': post[4],
                'avatar_url': post[5]
            } for post in posts]
        
        # Buscar usuários
        if search_type in ['all', 'users']:
            cursor.execute("""
                SELECT id, name, avatar_url
                FROM auth.users
                WHERE name ILIKE %s
                LIMIT %s OFFSET %s
            """, (f'%{query}%', limit, offset))
            
            users = cursor.fetchall()
            results['users'] = [{
                'id': user[0],
                'name': user[1],
                'avatar_url': user[2]
            } for user in users]
        
        # Buscar hashtags
        if search_type in ['all', 'hashtags']:
            cursor.execute("""
                SELECT name, usage_count
                FROM hashtags
                WHERE name ILIKE %s
                ORDER BY usage_count DESC
                LIMIT %s OFFSET %s
            """, (f'%{query}%', limit, offset))
            
            hashtags = cursor.fetchall()
            results['hashtags'] = [{
                'name': hashtag[0],
                'usage_count': hashtag[1]
            } for hashtag in hashtags]
        
        return jsonify({
            'success': True,
            'query': query,
            'results': results,
            'page': page,
            'limit': limit
        }), 200
        
    except Exception as e:
        logger.error(f"Erro na busca: {str(e)}")
        return jsonify({'error': 'Erro interno do servidor'}), 500
    finally:
        cursor.close()
        conn.close()