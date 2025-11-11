# -*- coding: utf-8 -*-
"""
Rotas de Suporte RE-EDUCA Store.

Gerencia tickets de suporte e FAQs incluindo:
- Criação e gerenciamento de tickets
- Listagem de FAQs
- Respostas e atualizações de status
"""
import logging
from flask import Blueprint, request, jsonify
from middleware.auth import token_required
from utils.decorators import handle_exceptions, log_activity
from utils.rate_limit_helper import rate_limit
from utils.validators import validate_required_fields
from exceptions.custom_exceptions import ValidationError, NotFoundError
from config.database import supabase_client

logger = logging.getLogger(__name__)

support_bp = Blueprint('support', __name__, url_prefix='/api/support')


@support_bp.route('/tickets', methods=['GET'])
@token_required
@rate_limit("60 per minute")
@handle_exceptions
def get_user_tickets():
    """
    Retorna tickets de suporte do usuário atual.
    
    Query params:
    - status: filtrar por status (open, closed, pending)
    - page: número da página
    - limit: itens por página
    """
    user_id = request.current_user['id']
    status = request.args.get('status')
    page = request.args.get('page', 1, type=int)
    limit = request.args.get('limit', 20, type=int)
    
    try:
        query = supabase_client.table('support_tickets').select('*').eq('user_id', user_id)
        
        if status:
            query = query.eq('status', status)
        
        query = query.order('created_at', desc=True)
        query = query.range((page - 1) * limit, page * limit - 1)
        
        response = query.execute()
        tickets = response.data if response.data else []
        
        # Contar total
        count_query = supabase_client.table('support_tickets').select('id', count='exact').eq('user_id', user_id)
        if status:
            count_query = count_query.eq('status', status)
        count_response = count_query.execute()
        total = count_response.count if hasattr(count_response, 'count') else len(tickets)
        
        return jsonify({
            'success': True,
            'tickets': tickets,
            'pagination': {
                'page': page,
                'limit': limit,
                'total': total,
                'pages': (total + limit - 1) // limit
            }
        }), 200
    except Exception as e:
        logger.error(f"Erro ao buscar tickets do usuário {user_id}: {str(e)}", exc_info=True)
        return jsonify({
            'success': False,
            'error': 'Erro ao buscar tickets',
            'tickets': []
        }), 500


@support_bp.route('/tickets', methods=['POST'])
@token_required
@rate_limit("10 per hour")
@log_activity('create_support_ticket')
@handle_exceptions
def create_ticket():
    """
    Cria um novo ticket de suporte.
    
    Body:
    - subject: assunto do ticket (obrigatório)
    - message: mensagem inicial (obrigatório)
    - category: categoria (opcional)
    - priority: prioridade (low, medium, high) - padrão: medium
    """
    user_id = request.current_user['id']
    data = request.get_json()
    
    # Validar campos obrigatórios
    if not validate_required_fields(data, ['subject', 'message']):
        raise ValidationError('Campos obrigatórios: subject, message')
    
    try:
        ticket_data = {
            'user_id': user_id,
            'subject': data['subject'],
            'message': data['message'],
            'category': data.get('category', 'general'),
            'priority': data.get('priority', 'medium'),
            'status': 'open',
        }
        
        response = supabase_client.table('support_tickets').insert(ticket_data).execute()
        
        if response.data:
            ticket = response.data[0]
            return jsonify({
                'success': True,
                'ticket': ticket,
                'message': 'Ticket criado com sucesso'
            }), 201
        else:
            return jsonify({
                'success': False,
                'error': 'Erro ao criar ticket'
            }), 500
    except Exception as e:
        logger.error(f"Erro ao criar ticket para usuário {user_id}: {str(e)}", exc_info=True)
        return jsonify({
            'success': False,
            'error': 'Erro ao criar ticket'
        }), 500


@support_bp.route('/tickets/<ticket_id>', methods=['GET'])
@token_required
@handle_exceptions
def get_ticket(ticket_id):
    """Retorna detalhes de um ticket específico com mensagens."""
    user_id = request.current_user['id']
    
    try:
        # Buscar ticket
        ticket_response = supabase_client.table('support_tickets').select('*').eq('id', ticket_id).eq('user_id', user_id).single().execute()
        
        if not ticket_response.data:
            raise NotFoundError('Ticket não encontrado')
        
        ticket = ticket_response.data
        
        # Buscar mensagens do ticket
        messages_response = supabase_client.table('support_ticket_messages').select('*').eq('ticket_id', ticket_id).order('created_at', desc=False).execute()
        messages = messages_response.data if messages_response.data else []
        
        ticket['messages'] = messages
        
        return jsonify({
            'success': True,
            'ticket': ticket
        }), 200
    except NotFoundError:
        raise
    except Exception as e:
        logger.error(f"Erro ao buscar ticket {ticket_id}: {str(e)}", exc_info=True)
        return jsonify({
            'success': False,
            'error': 'Erro ao buscar ticket'
        }), 500


@support_bp.route('/tickets/<ticket_id>/messages', methods=['POST'])
@token_required
@rate_limit("20 per hour")
@log_activity('add_ticket_message')
@handle_exceptions
def add_ticket_message(ticket_id):
    """
    Adiciona uma mensagem a um ticket.
    
    Body:
    - message: conteúdo da mensagem (obrigatório)
    """
    user_id = request.current_user['id']
    data = request.get_json()
    
    if not validate_required_fields(data, ['message']):
        raise ValidationError('Campo obrigatório: message')
    
    try:
        # Verificar se ticket pertence ao usuário
        ticket_response = supabase_client.table('support_tickets').select('id, status').eq('id', ticket_id).eq('user_id', user_id).single().execute()
        
        if not ticket_response.data:
            raise NotFoundError('Ticket não encontrado')
        
        # Adicionar mensagem
        message_data = {
            'ticket_id': ticket_id,
            'user_id': user_id,
            'message': data['message'],
            'is_from_user': True,
        }
        
        message_response = supabase_client.table('support_ticket_messages').insert(message_data).execute()
        
        # Atualizar status do ticket para "pending" se estava "closed"
        if ticket_response.data.get('status') == 'closed':
            supabase_client.table('support_tickets').update({'status': 'pending'}).eq('id', ticket_id).execute()
        
        if message_response.data:
            return jsonify({
                'success': True,
                'message': message_response.data[0],
                'message_text': 'Mensagem adicionada com sucesso'
            }), 201
        else:
            return jsonify({
                'success': False,
                'error': 'Erro ao adicionar mensagem'
            }), 500
    except NotFoundError:
        raise
    except Exception as e:
        logger.error(f"Erro ao adicionar mensagem ao ticket {ticket_id}: {str(e)}", exc_info=True)
        return jsonify({
            'success': False,
            'error': 'Erro ao adicionar mensagem'
        }), 500


@support_bp.route('/tickets/<ticket_id>', methods=['PUT'])
@token_required
@handle_exceptions
def update_ticket(ticket_id):
    """
    Atualiza um ticket (apenas status para "closed" pelo usuário).
    
    Body:
    - status: novo status (apenas "closed" permitido para usuários)
    """
    user_id = request.current_user['id']
    data = request.get_json()
    
    try:
        # Verificar se ticket pertence ao usuário
        ticket_response = supabase_client.table('support_tickets').select('id').eq('id', ticket_id).eq('user_id', user_id).single().execute()
        
        if not ticket_response.data:
            raise NotFoundError('Ticket não encontrado')
        
        # Usuários só podem fechar tickets
        if data.get('status') and data['status'] != 'closed':
            raise ValidationError('Usuários só podem fechar tickets')
        
        update_data = {}
        if data.get('status') == 'closed':
            from datetime import datetime
            update_data['status'] = 'closed'
            update_data['closed_at'] = datetime.now().isoformat()
        
        if update_data:
            response = supabase_client.table('support_tickets').update(update_data).eq('id', ticket_id).execute()
            
            if response.data:
                return jsonify({
                    'success': True,
                    'ticket': response.data[0],
                    'message': 'Ticket atualizado com sucesso'
                }), 200
        
        return jsonify({
            'success': False,
            'error': 'Nenhuma atualização válida'
        }), 400
    except (NotFoundError, ValidationError):
        raise
    except Exception as e:
        logger.error(f"Erro ao atualizar ticket {ticket_id}: {str(e)}", exc_info=True)
        return jsonify({
            'success': False,
            'error': 'Erro ao atualizar ticket'
        }), 500


@support_bp.route('/faqs', methods=['GET'])
@handle_exceptions
def get_faqs():
    """
    Retorna lista de FAQs públicas.
    
    Query params:
    - category: filtrar por categoria
    - search: buscar por termo
    """
    category = request.args.get('category')
    search = request.args.get('search')
    
    try:
        query = supabase_client.table('support_faqs').select('*').eq('is_active', True)
        
        if category:
            query = query.eq('category', category)
        
        if search:
            # Buscar em title ou content usando ilike
            # PostgREST: usar filtros separados ou() não é suportado diretamente
            # Vamos usar uma abordagem alternativa: buscar e filtrar em memória
            # ou fazer duas queries e combinar
            # Por simplicidade, vamos buscar todos e filtrar (para poucos FAQs é aceitável)
            all_faqs = supabase_client.table('support_faqs').select('*').eq('is_active', True).execute()
            if all_faqs.data:
                search_lower = search.lower()
                faqs = [
                    faq for faq in all_faqs.data
                    if search_lower in (faq.get('title', '') or '').lower()
                    or search_lower in (faq.get('content', '') or '').lower()
                ]
                return jsonify({
                    'success': True,
                    'faqs': faqs
                }), 200
        
        query = query.order('order_index', desc=False)
        
        response = query.execute()
        faqs = response.data if response.data else []
        
        return jsonify({
            'success': True,
            'faqs': faqs
        }), 200
    except Exception as e:
        logger.error(f"Erro ao buscar FAQs: {str(e)}", exc_info=True)
        return jsonify({
            'success': False,
            'error': 'Erro ao buscar FAQs',
            'faqs': []
        }), 500


@support_bp.route('/faqs/categories', methods=['GET'])
@handle_exceptions
def get_faq_categories():
    """Retorna lista de categorias de FAQs."""
    try:
        response = supabase_client.table('support_faqs').select('category').eq('is_active', True).execute()
        
        categories = set()
        if response.data:
            for faq in response.data:
                if faq.get('category'):
                    categories.add(faq['category'])
        
        return jsonify({
            'success': True,
            'categories': sorted(list(categories))
        }), 200
    except Exception as e:
        logger.error(f"Erro ao buscar categorias de FAQs: {str(e)}", exc_info=True)
        return jsonify({
            'success': False,
            'error': 'Erro ao buscar categorias',
            'categories': []
        }), 500
