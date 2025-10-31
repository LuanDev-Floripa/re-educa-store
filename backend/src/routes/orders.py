"""
Rotas de Pedidos RE-EDUCA Store.

Gerencia endpoints relacionados a pedidos incluindo:
- Listagem de pedidos do usuário (paginação)
- Detalhes de pedido específico
- Criação de novos pedidos
- Cancelamento de pedidos

Requisições requerem autenticação via token_required.
Rate limiting aplicado em criação de pedidos.
"""
from flask import Blueprint, request, jsonify
import logging
from services.order_service import OrderService
from utils.decorators import token_required, log_activity, rate_limit
from utils.validators import order_validator
from middleware.logging import log_user_activity

logger = logging.getLogger(__name__)

orders_bp = Blueprint('orders', __name__)
order_service = OrderService()

@orders_bp.route('/', methods=['GET'])
@token_required
def get_user_orders():
    """
    Retorna pedidos do usuário autenticado.
    
    Suporta paginação via query parameters:
    - page: Número da página (padrão: 1)
    - per_page: Itens por página (padrão: 20)
    
    Returns:
        JSON: Lista de pedidos com metadados de paginação.
        Status 200: Sucesso
        Status 401: Não autenticado
        Status 500: Erro interno
    """
    try:
        user_id = request.current_user.get('id')
        if not user_id:
            return jsonify({'error': 'Usuário não autenticado'}), 401
        
        # Valida e converte parâmetros de paginação
        try:
            page = max(1, int(request.args.get('page', 1)))
            per_page = max(1, min(100, int(request.args.get('per_page', 20))))
        except (ValueError, TypeError):
            page, per_page = 1, 20
        
        orders = order_service.get_user_orders(user_id, page, per_page)
        return jsonify(orders), 200
        
    except Exception as e:
        logger.error(f"Erro ao buscar pedidos do usuário: {str(e)}", exc_info=True)
        return jsonify({'error': 'Erro interno do servidor'}), 500

@orders_bp.route('/<order_id>', methods=['GET'])
@token_required
def get_order(order_id):
    """
    Retorna detalhes de um pedido específico.
    
    Verifica se o pedido pertence ao usuário autenticado.
    
    Args:
        order_id (str): ID do pedido.
    
    Returns:
        JSON: Detalhes completos do pedido.
        Status 200: Sucesso
        Status 401: Não autenticado
        Status 404: Pedido não encontrado ou não pertence ao usuário
        Status 500: Erro interno
    """
    try:
        user_id = request.current_user.get('id')
        if not user_id:
            return jsonify({'error': 'Usuário não autenticado'}), 401
        
        if not order_id:
            return jsonify({'error': 'ID do pedido é obrigatório'}), 400
        
        order = order_service.get_order(order_id, user_id)
        
        if not order:
            return jsonify({'error': 'Pedido não encontrado'}), 404
        
        return jsonify(order), 200
        
    except Exception as e:
        logger.error(f"Erro ao buscar pedido {order_id}: {str(e)}", exc_info=True)
        return jsonify({'error': 'Erro interno do servidor'}), 500

@orders_bp.route('/', methods=['POST'])
@token_required
@rate_limit("10 per hour")
@log_activity('order_created')
def create_order():
    """
    Cria um novo pedido para o usuário autenticado.
    
    Valida dados do pedido antes de criar.
    Aplica rate limiting (10 requisições por hora).
    Registra atividade de criação de pedido.
    
    Request Body:
        JSON com dados do pedido (itens, endereço, método de pagamento, etc.)
    
    Returns:
        JSON: Pedido criado com detalhes completos.
        Status 201: Pedido criado com sucesso
        Status 400: Dados inválidos ou erro na criação
        Status 401: Não autenticado
        Status 429: Rate limit excedido
        Status 500: Erro interno
    """
    try:
        user_id = request.current_user.get('id')
        if not user_id:
            return jsonify({'error': 'Usuário não autenticado'}), 401
        
        data = request.get_json()
        if not data:
            return jsonify({'error': 'Dados do pedido são obrigatórios'}), 400
        
        # Valida dados
        if not order_validator.validate_order(data):
            return jsonify({
                'error': 'Dados inválidos',
                'details': order_validator.get_errors()
            }), 400
        
        # Cria pedido
        result = order_service.create_order(user_id, data)
        
        if result.get('success'):
            log_user_activity(user_id, 'order_created', {
                'order_id': result['order']['id'],
                'total': result['order']['total']
            })
            
            return jsonify({
                'message': 'Pedido criado com sucesso',
                'order': result['order']
            }), 201
        else:
            return jsonify({'error': result.get('error', 'Erro ao criar pedido')}), 400
            
    except Exception as e:
        logger.error(f"Erro ao criar pedido: {str(e)}", exc_info=True)
        return jsonify({'error': 'Erro interno do servidor'}), 500

@orders_bp.route('/<order_id>/cancel', methods=['POST'])
@token_required
@log_activity('order_cancelled')
def cancel_order(order_id):
    """
    Cancela um pedido do usuário autenticado.
    
    Verifica se o pedido pertence ao usuário antes de cancelar.
    Registra atividade de cancelamento.
    
    Args:
        order_id (str): ID do pedido a ser cancelado.
    
    Returns:
        JSON: Mensagem de sucesso.
        Status 200: Pedido cancelado com sucesso
        Status 400: Erro ao cancelar (pedido já cancelado, etc.)
        Status 401: Não autenticado
        Status 404: Pedido não encontrado ou não pertence ao usuário
        Status 500: Erro interno
    """
    try:
        user_id = request.current_user.get('id')
        if not user_id:
            return jsonify({'error': 'Usuário não autenticado'}), 401
        
        if not order_id:
            return jsonify({'error': 'ID do pedido é obrigatório'}), 400
        
        result = order_service.cancel_order(order_id, user_id)
        
        if result.get('success'):
            log_user_activity(user_id, 'order_cancelled', {
                'order_id': order_id
            })
            
            return jsonify({'message': 'Pedido cancelado com sucesso'}), 200
        else:
            return jsonify({'error': result.get('error', 'Erro ao cancelar pedido')}), 400
            
    except Exception as e:
        logger.error(f"Erro ao cancelar pedido {order_id}: {str(e)}", exc_info=True)
        return jsonify({'error': 'Erro interno do servidor'}), 500