"""
Rotas de pedidos RE-EDUCA Store
"""
from flask import Blueprint, request, jsonify
from services.order_service import OrderService
from utils.decorators import token_required, log_activity, rate_limit
from utils.validators import order_validator
from middleware.logging import log_user_activity

orders_bp = Blueprint('orders', __name__)
order_service = OrderService()

@orders_bp.route('/', methods=['GET'])
@token_required
def get_user_orders():
    """Retorna pedidos do usuário"""
    try:
        user_id = request.current_user['id']
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 20))
        
        orders = order_service.get_user_orders(user_id, page, per_page)
        return jsonify(orders), 200
        
    except Exception as e:
        return jsonify({'error': 'Erro interno do servidor'}), 500

@orders_bp.route('/<order_id>', methods=['GET'])
@token_required
def get_order(order_id):
    """Retorna detalhes de um pedido"""
    try:
        user_id = request.current_user['id']
        order = order_service.get_order(order_id, user_id)
        
        if not order:
            return jsonify({'error': 'Pedido não encontrado'}), 404
        
        return jsonify(order), 200
        
    except Exception as e:
        return jsonify({'error': 'Erro interno do servidor'}), 500

@orders_bp.route('/', methods=['POST'])
@token_required
@rate_limit("10 per hour")
@log_activity('order_created')
def create_order():
    """Cria novo pedido"""
    try:
        data = request.get_json()
        user_id = request.current_user['id']
        
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
            return jsonify({'error': result['error']}), 400
            
    except Exception as e:
        return jsonify({'error': 'Erro interno do servidor'}), 500

@orders_bp.route('/<order_id>/cancel', methods=['POST'])
@token_required
@log_activity('order_cancelled')
def cancel_order(order_id):
    """Cancela um pedido"""
    try:
        user_id = request.current_user['id']
        result = order_service.cancel_order(order_id, user_id)
        
        if result.get('success'):
            log_user_activity(user_id, 'order_cancelled', {
                'order_id': order_id
            })
            
            return jsonify({'message': 'Pedido cancelado com sucesso'}), 200
        else:
            return jsonify({'error': result['error']}), 400
            
    except Exception as e:
        return jsonify({'error': 'Erro interno do servidor'}), 500