"""
Rotas de Carrinho RE-EDUCA Store.

Gerencia operações do carrinho de compras incluindo:
- Visualização do carrinho
- Adição e remoção de produtos
- Atualização de quantidades
- Limpeza do carrinho
"""
from flask import Blueprint, request, jsonify
from services.cart_service import CartService
from utils.decorators import token_required, log_activity
from utils.rate_limit_helper import rate_limit
from utils.exception_strategies import handle_route_exceptions
from exceptions.custom_exceptions import ValidationError, NotFoundError, InternalServerError
import logging

logger = logging.getLogger(__name__)

cart_bp = Blueprint('cart', __name__)
cart_service = CartService()

@cart_bp.route('/', methods=['GET'])
@token_required
@handle_route_exceptions
def get_cart():
    """
    Retorna carrinho do usuário.
    
    Implementa tratamento robusto de exceções e validação de dados.

    Returns:
        JSON: Carrinho com itens, quantidades e totais ou erro.
    """
    user_id = request.current_user['id']
    cart = cart_service.get_cart(user_id)
    return jsonify(cart), 200

@cart_bp.route('/add', methods=['POST'])
@token_required
@rate_limit("30 per minute")
@log_activity('cart_add_item')
@handle_route_exceptions
def add_to_cart():
    """
    Adiciona produto ao carrinho.
    
    Implementa tratamento robusto de exceções e validação de dados.

    Request Body:
        product_id (str): ID do produto.
        quantity (int): Quantidade (padrão: 1, mínimo: 1).

    Returns:
        JSON: Carrinho atualizado ou erro.
    """
    user_id = request.current_user['id']
    data = request.get_json()

    product_id = data.get('product_id')
    quantity = data.get('quantity', 1)

    if not product_id:
        raise ValidationError('product_id é obrigatório')

    if not isinstance(quantity, int) or quantity <= 0:
        raise ValidationError('Quantidade deve ser um número inteiro maior que 0')

    result = cart_service.add_to_cart(user_id, product_id, quantity)

    if not result.get('success'):
        raise ValidationError(result.get('error', 'Erro ao adicionar ao carrinho'))

    return jsonify(result), 200

@cart_bp.route('/update/<item_id>', methods=['PUT'])
@token_required
@rate_limit("30 per minute")
@log_activity('cart_update_item')
@handle_route_exceptions
def update_cart_item(item_id):
    """
    Atualiza quantidade de item no carrinho.
    
    Implementa tratamento robusto de exceções e validação de dados.

    Args:
        item_id (str): ID do item no carrinho.

    Request Body:
        quantity (int): Nova quantidade (mínimo: 0).

    Returns:
        JSON: Carrinho atualizado ou erro.
    """
    if not item_id:
        raise ValidationError("item_id é obrigatório")
    
    user_id = request.current_user['id']
    data = request.get_json()

    quantity = data.get('quantity')

    if quantity is None or not isinstance(quantity, int) or quantity < 0:
        raise ValidationError('Quantidade deve ser um número inteiro maior ou igual a 0')

    result = cart_service.update_cart_item(user_id, item_id, quantity)

    if not result.get('success'):
        raise ValidationError(result.get('error', 'Erro ao atualizar carrinho'))

    return jsonify(result), 200

@cart_bp.route('/remove/<item_id>', methods=['DELETE'])
@token_required
@rate_limit("30 per minute")
@log_activity('cart_remove_item')
@handle_route_exceptions
def remove_from_cart(item_id):
    """
    Remove item do carrinho.
    
    Implementa tratamento robusto de exceções e validação de dados.

    Args:
        item_id (str): ID do item a ser removido.

    Returns:
        JSON: Confirmação de remoção ou erro.
    """
    if not item_id:
        raise ValidationError("item_id é obrigatório")
    
    user_id = request.current_user['id']
    result = cart_service.remove_from_cart(user_id, item_id)

    if not result.get('success'):
        raise NotFoundError(result.get('error', 'Item não encontrado no carrinho'))

    return jsonify(result), 200

@cart_bp.route('/clear', methods=['DELETE'])
@token_required
@rate_limit("10 per hour")
@log_activity('cart_cleared')
@handle_route_exceptions
def clear_cart():
    """
    Limpa todo o carrinho do usuário.
    
    Implementa tratamento robusto de exceções e validação de dados.

    Returns:
        JSON: Confirmação de limpeza ou erro.
    """
    user_id = request.current_user['id']
    result = cart_service.clear_cart(user_id)

    if not result.get('success'):
        raise InternalServerError(result.get('error', 'Erro ao limpar carrinho'))

    return jsonify(result), 200
