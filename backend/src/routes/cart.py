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

cart_bp = Blueprint('cart', __name__)
cart_service = CartService()

@cart_bp.route('/', methods=['GET'])
@token_required
def get_cart():
    """
    Retorna carrinho do usuário.

    Returns:
        JSON: Carrinho com itens, quantidades e totais ou erro.
    """
    try:
        user_id = request.current_user['id']
        cart = cart_service.get_cart(user_id)
        return jsonify(cart), 200
    except Exception as e:
        return jsonify({'error': 'Erro ao buscar carrinho', 'details': str(e)}), 500

@cart_bp.route('/add', methods=['POST'])
@token_required
@rate_limit("30 per minute")
@log_activity('cart_add_item')
def add_to_cart():
    """
    Adiciona produto ao carrinho.

    Request Body:
        product_id (str): ID do produto.
        quantity (int): Quantidade (padrão: 1, mínimo: 1).

    Returns:
        JSON: Carrinho atualizado ou erro.
    """
    try:
        user_id = request.current_user['id']
        data = request.get_json()

        product_id = data.get('product_id')
        quantity = data.get('quantity', 1)

        if not product_id:
            return jsonify({'error': 'product_id é obrigatório'}), 400

        if not isinstance(quantity, int) or quantity <= 0:
            return jsonify({'error': 'Quantidade inválida'}), 400

        result = cart_service.add_to_cart(user_id, product_id, quantity)

        if result.get('success'):
            return jsonify(result), 200
        else:
            return jsonify(result), 400
    except Exception as e:
        return jsonify({'error': 'Erro ao adicionar ao carrinho', 'details': str(e)}), 500

@cart_bp.route('/update/<item_id>', methods=['PUT'])
@token_required
@rate_limit("30 per minute")
@log_activity('cart_update_item')
def update_cart_item(item_id):
    """
    Atualiza quantidade de item no carrinho.

    Args:
        item_id (str): ID do item no carrinho.

    Request Body:
        quantity (int): Nova quantidade (mínimo: 0).

    Returns:
        JSON: Carrinho atualizado ou erro.
    """
    try:
        user_id = request.current_user['id']
        data = request.get_json()

        quantity = data.get('quantity')

        if quantity is None or not isinstance(quantity, int) or quantity < 0:
            return jsonify({'error': 'Quantidade inválida'}), 400

        result = cart_service.update_cart_item(user_id, item_id, quantity)

        if result.get('success'):
            return jsonify(result), 200
        else:
            return jsonify(result), 400
    except Exception as e:
        return jsonify({'error': 'Erro ao atualizar carrinho', 'details': str(e)}), 500

@cart_bp.route('/remove/<item_id>', methods=['DELETE'])
@token_required
@rate_limit("30 per minute")
@log_activity('cart_remove_item')
def remove_from_cart(item_id):
    """
    Remove item do carrinho.

    Args:
        item_id (str): ID do item a ser removido.

    Returns:
        JSON: Confirmação de remoção ou erro.
    """
    try:
        user_id = request.current_user['id']
        result = cart_service.remove_from_cart(user_id, item_id)

        if result.get('success'):
            return jsonify(result), 200
        else:
            return jsonify(result), 400
    except Exception as e:
        return jsonify({'error': 'Erro ao remover do carrinho', 'details': str(e)}), 500

@cart_bp.route('/clear', methods=['DELETE'])
@token_required
@log_activity('cart_cleared')
def clear_cart():
    """
    Limpa todo o carrinho do usuário.

    Returns:
        JSON: Confirmação de limpeza ou erro.
    """
    try:
        user_id = request.current_user['id']
        result = cart_service.clear_cart(user_id)

        if result.get('success'):
            return jsonify(result), 200
        else:
            return jsonify(result), 400
    except Exception as e:
        return jsonify({'error': 'Erro ao limpar carrinho', 'details': str(e)}), 500
