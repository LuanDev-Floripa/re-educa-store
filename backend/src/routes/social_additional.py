# -*- coding: utf-8 -*-
"""
Rotas adicionais da Rede Social RE-EDUCA.

Endpoints complementares para funcionalidades sociais incluindo:
- Grupos e comunidades
- Notificações sociais
- Reels e stories
- Verificação de contas
- Monetização
- Analytics sociais

Utiliza GroupsService e SocialService para acesso a dados seguindo o padrão de arquitetura.
"""
from flask import Blueprint, request, jsonify
from utils.decorators import token_required
from services.social_service import SocialService
from services.groups_service import GroupsService
from services.messages_service import MessagesService
from services.image_upload_service import ImageUploadService
from utils.exception_strategies import handle_route_exceptions
from exceptions.custom_exceptions import NotFoundError, UnauthorizedError, ValidationError
from supabase_client import supabase_client
import logging
import os
import uuid
import requests
from werkzeug.utils import secure_filename

logger = logging.getLogger(__name__)

# Instanciar services
social_service = SocialService()
groups_service = GroupsService()
messages_service = MessagesService()
image_upload_service = ImageUploadService()

# Criar blueprint adicional ou adicionar ao social_bp existente
social_additional_bp = Blueprint('social_additional', __name__, url_prefix='/api/social')

@social_additional_bp.route('/groups', methods=['GET'])
@token_required
@handle_route_exceptions
def get_groups():
    """
    Lista grupos sociais disponíveis.

    Utiliza GroupsService para acesso a dados seguindo o padrão de arquitetura.

    Returns:
        JSON: Lista de grupos com informações de membro e categoria.
    """
    user_id = request.current_user.get('id') if hasattr(request, 'current_user') else None
    
    # Usar GroupsService para buscar grupos ordenados por membros
    result = groups_service.get_groups_sorted_by_members(limit=50)
    
    if not result.get('success'):
        raise NotFoundError(result.get('error', 'Erro ao buscar grupos'))
    
    groups = result.get('groups', [])
    
    # Enriquecer com informação de membro para cada grupo
    groups_list = []
    for g in groups:
        is_joined = False
        if user_id:
            is_joined = groups_service.is_user_member(g.get('id'), user_id)
        
        groups_list.append({
            'id': g.get('id'),
            'name': g.get('name'),
            'description': g.get('description'),
            'category': g.get('category', 'general'),
            'privacy': 'public' if g.get('privacy') == 'public' else 'private',
            'members': g.get('member_count', g.get('members_count', 0)) or 0,
            'posts': g.get('posts_count', 0) or 0,
            'createdAt': g.get('created_at'),
            'isJoined': is_joined
        })
    
    return jsonify({
        'success': True,
        'groups': groups_list
    }), 200

@social_additional_bp.route('/analytics', methods=['GET'])
@token_required
@handle_route_exceptions
def get_analytics():
    """
    Retorna analytics sociais do usuário.
    
    Implementa tratamento robusto de exceções e validação de dados.

    Coleta estatísticas de engajamento incluindo:
    - Posts criados pelo usuário
    - Metas ativas
    - Insights de audiência (estrutura preparada)

    Returns:
        JSON: Analytics com posts, audiência, metas e insights.
    """
    user_id = request.current_user.get('id')
    if not user_id:
        raise UnauthorizedError('Usuário não identificado')

    # Utiliza SocialService para acesso a dados seguindo o padrão de arquitetura
    posts_list = []
    try:
        posts_result = social_service.get_user_posts_for_analytics(user_id, limit=20)
        posts_list = [{
            'id': p.get('id'),
            'content': p.get('content', '')[:100],  # Truncar para resumo
            'timestamp': p.get('created_at')
        } for p in posts_result] if posts_result else []
    except (AttributeError, KeyError, TypeError) as e:
        logger.warning(f"Erro ao buscar posts para analytics: {str(e)}")
        posts_list = []

    # Utiliza UserService para acesso a objetivos do usuário
    from repositories.goal_repository import GoalRepository
    goal_repo = GoalRepository()
    goals_list = []
    try:
        goals_list = goal_repo.find_active_by_user(user_id)
    except (AttributeError, KeyError, TypeError):
        goals_list = []

    # Analytics de audiência
    audience_data = {
        'ageGroups': [],
        'genders': [],
        'locations': [],
        'interests': []
    }
    
    try:
        # Buscar seguidores do usuário
        from repositories.social_repository import SocialRepository
        social_repo = SocialRepository()
        
        # Buscar IDs dos seguidores
        followers_result = (
            supabase_client.table("follows")
            .select("follower_id")
            .eq("following_id", user_id)
            .execute()
        )
        
        follower_ids = [f.get("follower_id") for f in (followers_result.data or []) if f.get("follower_id")]
        
        if follower_ids:
            # Buscar dados demográficos dos seguidores (se disponíveis)
            # Por enquanto, retornar estrutura básica
            # Em produção, integrar com dados de perfil dos usuários
            
            # Contar por localização (se houver campo location em users)
            try:
                locations_result = (
                    supabase_client.table("users")
                    .select("location")
                    .in_("id", follower_ids[:100])  # Limitar para performance
                    .execute()
                )
                
                if locations_result.data:
                    locations = {}
                    for user in locations_result.data:
                        location = user.get("location")
                        if location:
                            locations[location] = locations.get(location, 0) + 1
                    
                    audience_data['locations'] = [
                        {'location': loc, 'count': count}
                        for loc, count in sorted(locations.items(), key=lambda x: x[1], reverse=True)[:10]
                    ]
            except Exception as e:
                logger.warning(f"Erro ao buscar localizações: {str(e)}")
        
        # Insights básicos
        insights = []
        try:
            # Calcular taxa de engajamento
            total_posts = len(posts_list)
            total_followers = social_repo.count_followers(user_id)
            total_likes = social_repo.count_total_likes_for_user(user_id)
            
            if total_posts > 0 and total_followers > 0:
                engagement_rate = (total_likes / (total_posts * total_followers)) * 100 if total_followers > 0 else 0
                insights.append({
                    'type': 'engagement_rate',
                    'value': round(engagement_rate, 2),
                    'label': 'Taxa de Engajamento',
                    'description': f'{engagement_rate:.1f}% de engajamento por post'
                })
            
            # Post mais popular
            if posts_list:
                # Buscar post com mais likes
                post_ids = [p.get('id') for p in posts_list if p.get('id')]
                if post_ids:
                    max_likes = 0
                    popular_post_id = None
                    for post_id in post_ids:
                        likes = social_repo.count_post_likes(post_id)
                        if likes > max_likes:
                            max_likes = likes
                            popular_post_id = post_id
                    
                    if popular_post_id:
                        insights.append({
                            'type': 'popular_post',
                            'value': max_likes,
                            'label': 'Post Mais Popular',
                            'description': f'{max_likes} curtidas'
                        })
        except Exception as e:
            logger.warning(f"Erro ao calcular insights: {str(e)}")
    
    except Exception as e:
        logger.warning(f"Erro ao buscar analytics de audiência: {str(e)}")
    
    return jsonify({
        'success': True,
        'posts': posts_list,
        'audience': audience_data,
        'goals': goals_list,
        'insights': insights
    }), 200

@social_additional_bp.route('/verification/pending', methods=['GET'])
@token_required
@handle_route_exceptions
def get_pending_verifications():
    """
    Lista verificações pendentes de contas (apenas admin).
    
    Implementa tratamento robusto de exceções e validação de dados.

    Retorna todas as solicitações de verificação de conta que
    estão aguardando aprovação de administradores.

    Returns:
        JSON: Lista de verificações pendentes com ID, usuário e status.

    Raises:
        403: Se usuário não for administrador.
    """
    user_id = request.current_user.get('id')
    role = request.current_user.get('role', 'user')

    if role != 'admin':
        raise ValidationError('Acesso negado. Privilégios de administrador requeridos.')

    # Buscar verificações pendentes via Supabase
    verifications_list = []
    try:
        verifications_result = supabase_client._make_request(
            'GET',
            'account_verifications',
            params={'status': 'eq.pending', 'order': 'submitted_at.desc'}
        )

        if isinstance(verifications_result, list):
            verifications_list = [{
                'id': v.get('id'),
                'userId': v.get('user_id'),
                'status': v.get('status', 'pending'),
                'submittedAt': v.get('submitted_at'),
                'category': v.get('category')
            } for v in verifications_result]
    except (AttributeError, KeyError, TypeError, ConnectionError) as e:
        logger.warning(f"Erro ao buscar verificações (tabela pode não existir): {str(e)}")
        verifications_list = []

    return jsonify({
        'success': True,
        'verifications': verifications_list
    }), 200

@social_additional_bp.route('/monetization/subscriptions', methods=['GET'])
@token_required
@handle_route_exceptions
def get_subscriptions():
    """
    Lista assinaturas de monetização do usuário.
    
    Implementa tratamento robusto de exceções e validação de dados.

    Retorna tanto assinaturas onde o usuário é subscriber quanto
    onde é creator (conteudista).

    Returns:
        JSON: Lista de assinaturas com planos, preços e status.
    """
    user_id = request.current_user.get('id')
    if not user_id:
        raise UnauthorizedError('Usuário não identificado')

    # Buscar subscriptions via Supabase
    # Nota: tabela pode não existir ainda, retornar vazio se não existir
    subscriptions_list = []
    try:
        # Buscar onde usuário é subscriber
        subscriber_result = supabase_client._make_request(
            'GET',
            'subscriptions',
            params={'subscriber_id': f'eq.{user_id}', 'order': 'created_at.desc'}
        )

        # Buscar onde usuário é creator
        creator_result = supabase_client._make_request(
            'GET',
            'subscriptions',
            params={'creator_id': f'eq.{user_id}', 'order': 'created_at.desc'}
        )

        all_subscriptions = []
        if isinstance(subscriber_result, list):
            all_subscriptions.extend(subscriber_result)
        if isinstance(creator_result, list):
            all_subscriptions.extend(creator_result)

        # Remover duplicatas se houver
        seen_ids = set()
        for s in all_subscriptions:
            s_id = s.get('id')
            if s_id and s_id not in seen_ids:
                seen_ids.add(s_id)
                subscriptions_list.append({
                    'id': s.get('id'),
                    'subscriberId': s.get('subscriber_id'),
                    'creatorId': s.get('creator_id'),
                    'plan': s.get('plan'),
                    'price': float(s.get('price', 0)) if s.get('price') else 0,
                    'status': s.get('status', 'active'),
                    'nextBilling': s.get('next_billing')
                })
    except (AttributeError, KeyError, TypeError, ConnectionError, ValueError) as e:
        logger.warning(f"Erro ao buscar subscriptions (tabela pode não existir): {str(e)}")
        subscriptions_list = []

    return jsonify({
        'success': True,
        'subscriptions': subscriptions_list
    }), 200

@social_additional_bp.route('/monetization/transactions', methods=['GET'])
@token_required
@handle_route_exceptions
def get_transactions():
    """
    Lista transações de monetização do usuário.
    
    Implementa tratamento robusto de exceções e validação de dados.

    Retorna histórico de transações incluindo:
    - Pagamentos recebidos (creator)
    - Pagamentos realizados (subscriber)
    - Status e valores das transações

    Returns:
        JSON: Lista de transações com tipo, valor, descrição e status.
    """
    user_id = request.current_user.get('id')
    if not user_id:
        raise UnauthorizedError('Usuário não identificado')

    # Buscar transactions via Supabase
    transactions_list = []
    try:
        transactions_result = supabase_client._make_request(
            'GET',
            'transactions',
            params={'user_id': f'eq.{user_id}', 'order': 'created_at.desc', 'limit': 50}
        )

        if isinstance(transactions_result, list):
            transactions_list = [{
                'id': t.get('id'),
                'type': t.get('type'),
                'amount': float(t.get('amount', 0)) if t.get('amount') else 0,
                'description': t.get('description', ''),
                'status': t.get('status', 'completed'),
                'timestamp': t.get('created_at')
            } for t in transactions_result]
    except (AttributeError, KeyError, TypeError, ConnectionError, ValueError) as e:
        logger.warning(f"Erro ao buscar transactions (tabela pode não existir): {str(e)}")
        transactions_list = []

    return jsonify({
        'success': True,
        'transactions': transactions_list
    }), 200

@social_additional_bp.route('/stats', methods=['GET'])
@token_required
@handle_route_exceptions
def get_social_stats():
    """
    Retorna estatísticas sociais do usuário.
    
    Implementa tratamento robusto de exceções e validação de dados.

    Calcula métricas de engajamento incluindo:
    - Total de posts criados
    - Total de seguidores (followers)
    - Total de seguindo (following)
    - Total de likes recebidos em todos os posts

    Returns:
        JSON: Estatísticas com contadores de posts, followers, following e likes.
    """
    user_id = request.current_user.get('id')
    if not user_id:
        raise UnauthorizedError('Usuário não identificado')

    stats = {
        'totalPosts': 0,
        'totalFollowers': 0,
        'totalFollowing': 0,
        'totalLikes': 0
    }

    # Utiliza SocialService para acesso a dados
    try:
        posts_result = social_service.get_posts(user_id=user_id, page=1, limit=1)
        stats['totalPosts'] = (
            posts_result.get('pagination', {}).get('total', 0) if posts_result.get('success') else 0
        )
    except (AttributeError, KeyError, TypeError) as e:
        logger.warning(f"Erro ao contar posts: {str(e)}")
        stats['totalPosts'] = 0

    # Utiliza SocialRepository através do service padronizado
    try:
        from repositories.social_repository import SocialRepository
        social_repo = SocialRepository()
        
        stats['totalFollowers'] = social_repo.count_followers(user_id)
        stats['totalFollowing'] = social_repo.count_following(user_id)
        stats['totalLikes'] = social_repo.count_total_likes_for_user(user_id)
    except (AttributeError, KeyError, TypeError) as e:
        logger.warning(f"Erro ao contar estatísticas sociais: {str(e)}")
        stats['totalFollowers'] = 0
        stats['totalFollowing'] = 0
        stats['totalLikes'] = 0

    return jsonify({
        'success': True,
        'stats': stats
    }), 200

@social_additional_bp.route('/groups/my', methods=['GET'])
@token_required
@handle_route_exceptions
def get_my_groups():
    """
    Retorna grupos dos quais o usuário autenticado é membro.
    
    Implementa tratamento robusto de exceções e validação de dados.

    Busca todos os grupos onde o usuário está cadastrado e retorna
    informações detalhadas de cada um.

    Returns:
        JSON: Lista de grupos do usuário com detalhes completos.
    """
    user_id = request.current_user.get('id')
    if not user_id:
        raise UnauthorizedError('Usuário não identificado')

    # Buscar grupos onde usuário é membro
    groups_list = []
    try:
        members_result = supabase_client._make_request(
            'GET',
            'group_members',
            params={'user_id': f'eq.{user_id}', 'select': 'group_id'}
        )

        if isinstance(members_result, list) and len(members_result) > 0:
            group_ids = [m.get('group_id') for m in members_result if m.get('group_id')]

            # Buscar detalhes dos grupos
            for group_id in group_ids:
                try:
                    # Buscar grupo específico
                    group_result = supabase_client._make_request(
                        'GET',
                        'groups',
                        params={'id': f'eq.{group_id}'}
                    )
                    if isinstance(group_result, list) and len(group_result) > 0:
                        g = group_result[0]
                        groups_list.append({
                            'id': g.get('id'),
                            'name': g.get('name'),
                            'description': g.get('description'),
                            'category': g.get('category', 'general'),
                            'privacy': 'public' if g.get('is_public', True) else 'private',
                            'members': g.get('member_count', g.get('members_count', 0)) or 0,
                            'posts': g.get('posts_count', 0) or 0,
                            'createdAt': g.get('created_at'),
                            'isJoined': True
                        })
                except (AttributeError, KeyError, TypeError, ConnectionError):
                    continue
    except (AttributeError, KeyError, TypeError, ConnectionError) as e:
        logger.warning(f"Erro ao buscar meus grupos: {str(e)}")
        groups_list = []

    return jsonify({
        'success': True,
        'groups': groups_list
    }), 200

@social_additional_bp.route('/groups/trending', methods=['GET'])
@token_required
@handle_route_exceptions
def get_trending_groups():
    """
    Retorna grupos em tendência ordenados por número de membros.
    
    Implementa tratamento robusto de exceções e validação de dados.

    Busca os 20 grupos com maior número de membros para exibição
    na página de descoberta de grupos.

    Returns:
        JSON: Lista dos 20 grupos mais populares.
    """
    # Buscar grupos ordenados por número de membros
    trending_list = []
    try:
        # Buscar grupos e ordenar manualmente
        result = supabase_client._make_request('GET', 'groups')

        if isinstance(result, list):
            result = sorted(
                result,
                key=lambda x: x.get('member_count', x.get('members_count', 0)) or 0,
                reverse=True
            )[:20]

        if isinstance(result, list):
            trending_list = [{
                'id': g.get('id'),
                'name': g.get('name'),
                'description': g.get('description'),
                'category': g.get('category', 'general'),
                'privacy': 'public' if g.get('is_public', True) else 'private',
                'members': g.get('member_count', 0) or 0,
                'posts': g.get('posts_count', 0) or 0,
                'createdAt': g.get('created_at'),
                'isJoined': False  # Será atualizado no frontend se necessário
            } for g in result]
    except (AttributeError, KeyError, TypeError, ConnectionError) as e:
        logger.warning(f"Erro ao buscar grupos trending: {str(e)}")
        trending_list = []

    return jsonify({
        'success': True,
        'groups': trending_list
    }), 200

# =====================================================
# ROTAS DE MENSAGENS DIRETAS
# =====================================================

@social_additional_bp.route('/messages', methods=['GET'])
@token_required
@handle_route_exceptions
def get_conversations():
    """
    Lista conversas do usuário.
    
    Returns:
        JSON: Lista de conversas com última mensagem
    """
    user_id = request.current_user.get('id')
    result = messages_service.get_conversations(user_id)
    
    if result.get('success'):
        return jsonify(result), 200
    else:
        return jsonify({'error': result.get('error', 'Erro ao buscar conversas')}), 500

@social_additional_bp.route('/messages/<other_user_id>', methods=['GET'])
@token_required
@handle_route_exceptions
def get_messages(other_user_id):
    """
    Busca mensagens entre dois usuários.
    
    Args:
        other_user_id: ID do outro usuário
    
    Query Parameters:
        limit: Limite de mensagens (padrão: 50)
    
    Returns:
        JSON: Lista de mensagens
    """
    user_id = request.current_user.get('id')
    limit = request.args.get('limit', 50, type=int)
    
    result = messages_service.get_messages(user_id, other_user_id, limit)
    
    if result.get('success'):
        return jsonify(result), 200
    else:
        return jsonify({'error': result.get('error', 'Erro ao buscar mensagens')}), 500

@social_additional_bp.route('/messages', methods=['POST'])
@token_required
@handle_route_exceptions
def send_message():
    """
    Envia mensagem direta.
    
    Body (JSON):
        recipient_id (str): ID do destinatário (obrigatório)
        content (str): Conteúdo da mensagem (obrigatório se não houver anexo)
        attachment_url (str, optional): URL do anexo já enviado
        attachment_type (str, optional): Tipo do anexo
        attachment_filename (str, optional): Nome do arquivo
        attachment_size (int, optional): Tamanho em bytes
    
    Returns:
        JSON: Mensagem enviada
    """
    user_id = request.current_user.get('id')
    data = request.get_json() or {}
    
    recipient_id = data.get('recipient_id')
    content = data.get('content', '')
    
    if not recipient_id:
        raise ValidationError('recipient_id é obrigatório')
    
    if not content and not data.get('attachment_url'):
        raise ValidationError('content ou attachment_url é obrigatório')
    
    result = messages_service.send_message(
        sender_id=user_id,
        recipient_id=recipient_id,
        content=content,
        attachment_url=data.get('attachment_url'),
        attachment_type=data.get('attachment_type'),
        attachment_filename=data.get('attachment_filename'),
        attachment_size=data.get('attachment_size')
    )
    
    if result.get('success'):
        return jsonify(result), 201
    else:
        return jsonify({'error': result.get('error', 'Erro ao enviar mensagem')}), 500

@social_additional_bp.route('/messages/upload', methods=['POST'])
@token_required
@handle_route_exceptions
def upload_message_attachment():
    """
    Upload de arquivo para anexar em mensagem direta.
    
    Form Data:
        file (file): Arquivo a ser enviado (obrigatório)
    
    Returns:
        JSON: URL do arquivo e metadados
    """
    user_id = request.current_user.get('id')
    
    # Verificar se arquivo foi enviado
    if 'file' not in request.files:
        raise ValidationError('Nenhum arquivo enviado')
    
    file = request.files['file']
    
    if file.filename == '':
        raise ValidationError('Nenhum arquivo selecionado')
    
    # Validar tipo de arquivo
    allowed_extensions = {'.jpg', '.jpeg', '.png', '.gif', '.webp', '.pdf', '.doc', '.docx', '.txt', '.mp4', '.mp3', '.zip'}
    file_ext = os.path.splitext(secure_filename(file.filename))[1].lower()
    
    if file_ext not in allowed_extensions:
        raise ValidationError(f'Formato não permitido. Use: {", ".join(allowed_extensions)}')
    
    # Validar tamanho (máximo 25MB)
    MAX_FILE_SIZE = 25 * 1024 * 1024
    file.seek(0, os.SEEK_END)
    file_size = file.tell()
    file.seek(0)
    
    if file_size > MAX_FILE_SIZE:
        raise ValidationError(f'Arquivo muito grande. Máximo: {MAX_FILE_SIZE // (1024*1024)}MB')
    
    # Determinar tipo de anexo
    is_image = file_ext in {'.jpg', '.jpeg', '.png', '.gif', '.webp'}
    is_video = file_ext in {'.mp4', '.webm', '.mov', '.avi'}
    is_audio = file_ext in {'.mp3', '.wav', '.ogg'}
    is_document = file_ext in {'.pdf', '.doc', '.docx', '.txt', '.zip'}
    
    attachment_type = None
    if is_image:
        attachment_type = 'image'
    elif is_video:
        attachment_type = 'video'
    elif is_audio:
        attachment_type = 'audio'
    elif is_document:
        attachment_type = 'document'
    
    # Fazer upload usando ImageUploadService (suporta vários tipos)
    try:
        # Usar bucket apropriado
        bucket_name = "message-attachments"
        
        # Gerar nome único
        filename = f"{user_id}/{uuid.uuid4().hex[:8]}{file_ext}"
        
        # Upload para Supabase Storage
        from config.settings import get_config
        config = get_config()
        upload_url = f"{config.SUPABASE_URL}/storage/v1/object/{bucket_name}/{filename}"
        
        headers = {
            "Authorization": f"Bearer {config.SUPABASE_KEY}",
            "Content-Type": file.content_type if hasattr(file, 'content_type') else 'application/octet-stream'
        }
        
        file_content = file.read()
        response = requests.post(upload_url, data=file_content, headers=headers, timeout=30)
        
        if response.status_code not in [200, 201]:
            raise Exception(f"Erro no upload: {response.text}")
        
        # URL pública
        file_url = f"{config.SUPABASE_URL}/storage/v1/object/public/{bucket_name}/{filename}"
        
        return jsonify({
            'success': True,
            'attachment_url': file_url,
            'attachment_type': attachment_type,
            'attachment_filename': secure_filename(file.filename),
            'attachment_size': file_size
        }), 200
        
    except Exception as e:
        logger.error(f"Erro ao fazer upload de anexo: {e}", exc_info=True)
        raise ValidationError(f'Erro ao fazer upload: {str(e)}')

@social_additional_bp.route('/messages/<message_id>/read', methods=['PUT'])
@token_required
@handle_route_exceptions
def mark_message_read(message_id):
    """
    Marca mensagem como lida.
    
    Args:
        message_id: ID da mensagem
    
    Returns:
        JSON: Resultado da operação
    """
    user_id = request.current_user.get('id')
    result = messages_service.mark_message_read(message_id, user_id)
    
    if result.get('success'):
        return jsonify(result), 200
    else:
        return jsonify({'error': result.get('error', 'Erro ao marcar como lida')}), 500

@social_additional_bp.route('/messages/conversation/<other_user_id>/read', methods=['PUT'])
@token_required
@handle_route_exceptions
def mark_conversation_read(other_user_id):
    """
    Marca todas as mensagens de uma conversa como lidas.
    
    Args:
        other_user_id: ID do outro usuário
    
    Returns:
        JSON: Número de mensagens marcadas
    """
    user_id = request.current_user.get('id')
    result = messages_service.mark_conversation_read(user_id, other_user_id)
    
    if result.get('success'):
        return jsonify(result), 200
    else:
        return jsonify({'error': result.get('error', 'Erro ao marcar conversa como lida')}), 500

@social_additional_bp.route('/messages/unread-count', methods=['GET'])
@token_required
@handle_route_exceptions
def get_unread_count():
    """
    Retorna número de mensagens não lidas.
    
    Returns:
        JSON: Contador de mensagens não lidas
    """
    user_id = request.current_user.get('id')
    result = messages_service.get_unread_count(user_id)
    
    return jsonify(result), 200
