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
from utils.decorators import token_required, log_activity
from utils.rate_limit_helper import rate_limit
from utils.exception_strategies import handle_route_exceptions
from exceptions.custom_exceptions import ValidationError, NotFoundError, UnauthorizedError, InternalServerError
from utils.validators import order_validator
from utils.validation_decorators import validate_order_request, validate_uuid_param
from utils.idempotency_decorators import idempotent_endpoint
from middleware.logging import log_user_activity

logger = logging.getLogger(__name__)

orders_bp = Blueprint('orders', __name__)
order_service = OrderService()

@orders_bp.route('/', methods=['GET'])
@token_required
@handle_route_exceptions
def get_user_orders():
    """
    Retorna pedidos do usuário autenticado.
    
    Implementa tratamento robusto de exceções e validação de dados.

    Suporta paginação via query parameters:
    - page: Número da página (padrão: 1)
    - per_page: Itens por página (padrão: 20)

    Returns:
        JSON: Lista de pedidos com metadados de paginação.
        Status 200: Sucesso
        Status 401: Não autenticado
        Status 500: Erro interno
    """
    user_id = request.current_user.get('id')
    if not user_id:
        raise UnauthorizedError('Usuário não autenticado')

    # Valida e converte parâmetros de paginação
    try:
        page = max(1, int(request.args.get('page', 1)))
        per_page = max(1, min(100, int(request.args.get('per_page', 20))))
    except (ValueError, TypeError):
        page, per_page = 1, 20

    orders = order_service.get_user_orders(user_id, page, per_page)
    return jsonify(orders), 200

@orders_bp.route('/<order_id>', methods=['GET'])
@token_required
@validate_uuid_param('order_id')
@handle_route_exceptions
def get_order(order_id):
    """
    Retorna detalhes de um pedido específico.
    
    Implementa tratamento robusto de exceções e validação de dados.

    Verifica se o pedido pertence ao usuário autenticado.

    Args:
        order_id (str): ID do pedido (UUID validado).

    Returns:
        JSON: Detalhes completos do pedido.
        Status 200: Sucesso
        Status 400: UUID inválido
        Status 401: Não autenticado
        Status 404: Pedido não encontrado ou não pertence ao usuário
        Status 500: Erro interno
    """
    user_id = request.current_user.get('id')
    if not user_id:
        raise UnauthorizedError('Usuário não autenticado')

    order = order_service.get_order(order_id, user_id)

    if not order:
        raise NotFoundError('Pedido não encontrado')

    return jsonify(order), 200

@orders_bp.route('/', methods=['POST'])
@token_required
@rate_limit("10 per hour")
@idempotent_endpoint(ttl=3600)
@log_activity('order_created')
@handle_route_exceptions
def create_order():
    """
    Cria um novo pedido para o usuário autenticado.
    
    Implementa tratamento robusto de exceções e validação de dados.

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
    user_id = request.current_user.get('id')
    if not user_id:
        raise UnauthorizedError('Usuário não autenticado')

    data = request.get_json()
    if not data:
        raise ValidationError('Dados do pedido são obrigatórios')

    # Valida dados
    if not order_validator.validate_order(data):
        raise ValidationError('Dados inválidos', details=order_validator.get_errors())

    # Cria pedido
    result = order_service.create_order(user_id, data)

    if not result.get('success'):
        raise ValidationError(result.get('error', 'Erro ao criar pedido'))

    log_user_activity(user_id, 'order_created', {
        'order_id': result['order']['id'],
        'total': result['order']['total']
    })

    return jsonify({
        'message': 'Pedido criado com sucesso',
        'order': result['order']
    }), 201

@orders_bp.route('/<order_id>/cancel', methods=['PUT', 'POST'])
@token_required
@rate_limit("3 per hour")
@log_activity('order_cancelled')
@handle_route_exceptions
def cancel_order(order_id):
    """
    Cancela um pedido do usuário autenticado.
    
    Implementa tratamento robusto de exceções e validação de dados.

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
    user_id = request.current_user.get('id')
    if not user_id:
        raise UnauthorizedError('Usuário não autenticado')

    if not order_id:
        raise ValidationError('ID do pedido é obrigatório')

    result = order_service.cancel_order(order_id, user_id)

    if not result.get('success'):
        raise ValidationError(result.get('error', 'Erro ao cancelar pedido'))

    log_user_activity(user_id, 'order_cancelled', {
        'order_id': order_id
    })

    return jsonify({'success': True, 'message': 'Pedido cancelado com sucesso'}), 200

@orders_bp.route('/<order_id>/tracking', methods=['GET'])
@token_required
@rate_limit("30 per hour")
@validate_uuid_param('order_id')
@handle_route_exceptions
def get_order_tracking(order_id):
    """
    Retorna informações de rastreamento de um pedido.
    
    Implementa tratamento robusto de exceções e validação de dados.

    Verifica se o pedido pertence ao usuário autenticado.
    Retorna informações de rastreamento incluindo URL de rastreamento da transportadora.

    Args:
        order_id (str): ID do pedido (UUID validado).

    Returns:
        JSON: Informações de rastreamento do pedido.
        Status 200: Sucesso
        Status 400: UUID inválido
        Status 401: Não autenticado
        Status 404: Pedido não encontrado ou não pertence ao usuário
        Status 500: Erro interno
    """
    user_id = request.current_user.get('id')
    if not user_id:
        raise UnauthorizedError('Usuário não autenticado')

    result = order_service.get_order_tracking(order_id, user_id)

    if not result.get('success'):
        raise NotFoundError(result.get('error', 'Pedido não encontrado'))

    return jsonify(result), 200
0
