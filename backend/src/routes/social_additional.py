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

NOTA: Usa Supabase Client via API REST (não SQL direto).
"""
from flask import Blueprint, request, jsonify
from utils.decorators import handle_exceptions, token_required
from services.social_service import SocialService
from config.database import supabase_client
import logging

logger = logging.getLogger(__name__)

# Instanciar service
social_service = SocialService()

# Criar blueprint adicional ou adicionar ao social_bp existente
social_additional_bp = Blueprint('social_additional', __name__, url_prefix='/api/social')

@social_additional_bp.route('/groups', methods=['GET'])
@token_required
@handle_exceptions
def get_groups():
    """
    Lista grupos sociais disponíveis.

    Returns:
        JSON: Lista de grupos com informações de membro e categoria.
    """
    try:
        user_id = request.current_user.get('id') if hasattr(request, 'current_user') else None

        # Usar Supabase Client via API REST
        try:
            # PostgREST API - buscar grupos ordenados por member_count
            # Usar header Range ou limit como parâmetro
            result = supabase_client._make_request('GET', 'groups', params={
                'limit': '50'
            })

            # Se result é lista, ordenar por member_count manualmente
            if isinstance(result, list):
                result = sorted(result, key=lambda x: x.get('member_count', 0) or 0, reverse=True)

            # Se result é lista, processar diretamente
            if isinstance(result, list):
                groups_list = []
                for g in result:
                    # Verificar se usuário está no grupo
                    is_joined = False
                    if user_id:
                        try:
                            members_result = supabase_client._make_request(
                                'GET',
                                'group_members',
                                params={'group_id': f'eq.{g.get("id")}', 'user_id': f'eq.{user_id}'}
                            )
                            is_joined = isinstance(members_result, list) and len(members_result) > 0
                        except Exception as e:
                            logger.debug(f"Erro ao verificar membro do grupo {g.get('id')}: {str(e)}")
                            is_joined = False

                    groups_list.append({
                        'id': g.get('id'),
                        'name': g.get('name'),
                        'description': g.get('description'),
                        'category': g.get('category', 'general'),
                        'privacy': g.get('is_public', True) and 'public' or 'private',
                        'members': g.get('member_count', g.get('members_count', 0)) or 0,
                        'posts': g.get('posts_count', 0) or 0,
                        'createdAt': g.get('created_at'),
                        'isJoined': is_joined
                    })
            else:
                groups_list = []

            return jsonify({
                'success': True,
                'groups': groups_list
            }), 200

        except Exception as api_error:
            logger.error(f"Erro na requisição Supabase: {str(api_error)}")
            # Retornar lista vazia em caso de erro ao invés de quebrar
            return jsonify({
                'success': True,
                'groups': []
            }), 200

    except Exception as e:
        logger.error(f"Erro ao buscar grupos: {str(e)}")
        return jsonify({
            'success': True,
            'groups': []
        }), 200  # Retornar vazio ao invés de erro 500

@social_additional_bp.route('/analytics', methods=['GET'])
@token_required
@handle_exceptions
def get_analytics():
    """
    Retorna analytics sociais do usuário.

    Coleta estatísticas de engajamento incluindo:
    - Posts criados pelo usuário
    - Metas ativas
    - Insights de audiência (estrutura preparada)

    Returns:
        JSON: Analytics com posts, audiência, metas e insights.
    """
    try:
        user_id = request.current_user.get('id')
        if not user_id:
            return jsonify({'error': 'Usuário não identificado'}), 401

        # Buscar posts do usuário via Supabase
        try:
            posts_result = supabase_client._make_request(
                'GET',
                'posts',
                params={'user_id': f'eq.{user_id}', 'order': 'created_at.desc', 'limit': 20}
            )

            if isinstance(posts_result, list):
                posts_list = [{
                    'id': p.get('id'),
                    'content': p.get('content', '')[:100],  # Truncar para resumo
                    'timestamp': p.get('created_at')
                } for p in posts_result]
            else:
                posts_list = []
        except Exception as e:
            logger.warning(f"Erro ao buscar posts para analytics: {str(e)}")
            posts_list = []

        # Buscar goals do usuário
        try:
            goals_result = supabase_client._make_request(
                'GET',
                'user_goals',
                params={'user_id': f'eq.{user_id}', 'status': 'eq.active'}
            )
            goals_list = goals_result if isinstance(goals_result, list) else []
        except Exception:
            goals_list = []

        # Analytics básicos - audience será implementado depois (Medium-1)
        # Por enquanto retornar estrutura vazia mas funcional
        return jsonify({
            'success': True,
            'posts': posts_list,
            'audience': {
                'ageGroups': [],
                'genders': [],
                'locations': [],
                'interests': []
            },
            'goals': goals_list,
            'insights': []
        }), 200

    except Exception as e:
        logger.error(f"Erro ao buscar analytics: {str(e)}")
        return jsonify({
            'success': True,
            'posts': [],
            'audience': {'ageGroups': [], 'genders': [], 'locations': [], 'interests': []},
            'goals': [],
            'insights': []
        }), 200  # Retornar estrutura vazia ao invés de erro

@social_additional_bp.route('/verification/pending', methods=['GET'])
@token_required
@handle_exceptions
def get_pending_verifications():
    """
    Lista verificações pendentes de contas (apenas admin).

    Retorna todas as solicitações de verificação de conta que
    estão aguardando aprovação de administradores.

    Returns:
        JSON: Lista de verificações pendentes com ID, usuário e status.

    Raises:
        403: Se usuário não for administrador.
    """
    try:
        user_id = request.current_user.get('id')
        role = request.current_user.get('role', 'user')

        if role != 'admin':
            return jsonify({'error': 'Acesso negado. Privilégios de administrador requeridos.'}), 403

        # Buscar verificações pendentes via Supabase
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
            else:
                verifications_list = []
        except Exception as e:
            logger.warning(f"Erro ao buscar verificações (tabela pode não existir): {str(e)}")
            verifications_list = []

        return jsonify({
            'success': True,
            'verifications': verifications_list
        }), 200

    except Exception as e:
        logger.error(f"Erro ao buscar verificações: {str(e)}")
        return jsonify({
            'success': True,
            'verifications': []
        }), 200  # Retornar vazio ao invés de erro 500

@social_additional_bp.route('/monetization/subscriptions', methods=['GET'])
@token_required
@handle_exceptions
def get_subscriptions():
    """
    Lista assinaturas de monetização do usuário.

    Retorna tanto assinaturas onde o usuário é subscriber quanto
    onde é creator (conteudista).

    Returns:
        JSON: Lista de assinaturas com planos, preços e status.
    """
    try:
        user_id = request.current_user.get('id')
        if not user_id:
            return jsonify({'error': 'Usuário não identificado'}), 401

        # Buscar subscriptions via Supabase
        # Nota: tabela pode não existir ainda, retornar vazio se não existir
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
            subscriptions_list = []
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
        except Exception as e:
            logger.warning(f"Erro ao buscar subscriptions (tabela pode não existir): {str(e)}")
            subscriptions_list = []

        return jsonify({
            'success': True,
            'subscriptions': subscriptions_list
        }), 200

    except Exception as e:
        logger.error(f"Erro ao buscar assinaturas: {str(e)}")
        return jsonify({
            'success': True,
            'subscriptions': []
        }), 200  # Retornar vazio ao invés de erro 500

@social_additional_bp.route('/monetization/transactions', methods=['GET'])
@token_required
@handle_exceptions
def get_transactions():
    """
    Lista transações de monetização do usuário.

    Retorna histórico de transações incluindo:
    - Pagamentos recebidos (creator)
    - Pagamentos realizados (subscriber)
    - Status e valores das transações

    Returns:
        JSON: Lista de transações com tipo, valor, descrição e status.
    """
    try:
        user_id = request.current_user.get('id')
        if not user_id:
            return jsonify({'error': 'Usuário não identificado'}), 401

        # Buscar transactions via Supabase
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
            else:
                transactions_list = []
        except Exception as e:
            logger.warning(f"Erro ao buscar transactions (tabela pode não existir): {str(e)}")
            transactions_list = []

        return jsonify({
            'success': True,
            'transactions': transactions_list
        }), 200

    except Exception as e:
        logger.error(f"Erro ao buscar transações: {str(e)}")
        return jsonify({
            'success': True,
            'transactions': []
        }), 200  # Retornar vazio ao invés de erro 500

@social_additional_bp.route('/stats', methods=['GET'])
@token_required
@handle_exceptions
def get_social_stats():
    """
    Retorna estatísticas sociais do usuário.

    Calcula métricas de engajamento incluindo:
    - Total de posts criados
    - Total de seguidores (followers)
    - Total de seguindo (following)
    - Total de likes recebidos em todos os posts

    Returns:
        JSON: Estatísticas com contadores de posts, followers, following e likes.
    """
    try:
        user_id = request.current_user.get('id')
        if not user_id:
            return jsonify({'error': 'Usuário não identificado'}), 401

        stats = {
            'totalPosts': 0,
            'totalFollowers': 0,
            'totalFollowing': 0,
            'totalLikes': 0
        }

        # ✅ CORRIGIDO: Usa SocialService
        try:
            posts_result = social_service.get_posts(user_id=user_id, page=1, limit=1)
            stats['totalPosts'] = (
                posts_result.get('pagination', {}).get('total', 0) if posts_result.get('success') else 0
            )
        except Exception as e:
            logger.warning(f"Erro ao contar posts: {str(e)}")
            stats['totalPosts'] = 0

        # ✅ CORRIGIDO: Usa SocialRepository
        try:
            from repositories.social_repository import SocialRepository
            social_repo = SocialRepository()
            
            stats['totalFollowers'] = social_repo.count_followers(user_id)
            stats['totalFollowing'] = social_repo.count_following(user_id)
            stats['totalLikes'] = social_repo.count_total_likes_for_user(user_id)
        except Exception as e:
            logger.warning(f"Erro ao contar estatísticas sociais: {str(e)}")
            stats['totalFollowers'] = 0
            stats['totalFollowing'] = 0
            stats['totalLikes'] = 0

        return jsonify({
            'success': True,
            'stats': stats
        }), 200

    except Exception as e:
        logger.error(f"Erro ao buscar stats: {str(e)}")
        return jsonify({
            'success': True,
            'stats': {
                'totalPosts': 0,
                'totalFollowers': 0,
                'totalFollowing': 0,
                'totalLikes': 0
            }
        }), 200  # Retorna stats zerados ao invés de erro

@social_additional_bp.route('/groups/my', methods=['GET'])
@token_required
@handle_exceptions
def get_my_groups():
    """
    Retorna grupos dos quais o usuário autenticado é membro.

    Busca todos os grupos onde o usuário está cadastrado e retorna
    informações detalhadas de cada um.

    Returns:
        JSON: Lista de grupos do usuário com detalhes completos.
    """
    try:
        user_id = request.current_user.get('id')
        if not user_id:
            return jsonify({'error': 'Usuário não identificado'}), 401

        # Buscar grupos onde usuário é membro
        try:
            members_result = supabase_client._make_request(
                'GET',
                'group_members',
                params={'user_id': f'eq.{user_id}', 'select': 'group_id'}
            )

            if isinstance(members_result, list) and len(members_result) > 0:
                group_ids = [m.get('group_id') for m in members_result if m.get('group_id')]

                # Buscar detalhes dos grupos
                groups_list = []
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
                    except Exception:
                        continue
            else:
                groups_list = []
        except Exception as e:
            logger.warning(f"Erro ao buscar meus grupos: {str(e)}")
            groups_list = []

        return jsonify({
            'success': True,
            'groups': groups_list
        }), 200

    except Exception as e:
        logger.error(f"Erro ao buscar meus grupos: {str(e)}")
        return jsonify({
            'success': True,
            'groups': []
        }), 200

@social_additional_bp.route('/groups/trending', methods=['GET'])
@token_required
@handle_exceptions
def get_trending_groups():
    """
    Retorna grupos em tendência ordenados por número de membros.

    Busca os 20 grupos com maior número de membros para exibição
    na página de descoberta de grupos.

    Returns:
        JSON: Lista dos 20 grupos mais populares.
    """
    try:
        # Buscar grupos ordenados por número de membros
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
            else:
                trending_list = []
        except Exception as e:
            logger.warning(f"Erro ao buscar grupos trending: {str(e)}")
            trending_list = []

        return jsonify({
            'success': True,
            'groups': trending_list
        }), 200

    except Exception as e:
        logger.error(f"Erro ao buscar grupos trending: {str(e)}")
        return jsonify({
            'success': True,
            'groups': []
        }), 200
