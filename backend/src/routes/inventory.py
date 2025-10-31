"""
Rotas de Estoque RE-EDUCA Store.

Gerencia controle de estoque de produtos incluindo:
- Consulta de disponibilidade
- Atualização de estoque (admin)
- Reserva de produtos para pedidos
- Liberação de reservas
- Relatórios de movimentação

SEGURANÇA:
- Consultas: usuários autenticados
- Atualizações: apenas administradores
- Logs de todas as operações críticas
"""
from flask import Blueprint, request, jsonify
from services.inventory_service import InventoryService
from utils.decorators import token_required, admin_required, rate_limit, validate_json
from middleware.logging import log_user_activity, log_security_event

inventory_bp = Blueprint('inventory', __name__)
inventory_service = InventoryService()

@inventory_bp.route('/stock/<product_id>', methods=['GET'])
@token_required
@rate_limit("30 per minute")
def get_product_stock(product_id):
    """
    Obtém estoque de um produto.
    
    Args:
        product_id (str): ID do produto.
        
    Returns:
        JSON: Quantidade em estoque e disponibilidade.
    """
    try:
        result = inventory_service.get_product_stock(product_id)
        
        if result.get('success'):
            return jsonify(result), 200
        else:
            return jsonify({'error': result['error']}), 400
            
    except Exception as e:
        log_security_event('stock_check_error', details={'error': str(e)})
        return jsonify({'error': 'Erro interno do servidor'}), 500

@inventory_bp.route('/stock/<product_id>/update', methods=['POST'])
@token_required
@admin_required
@rate_limit("20 per minute")
@validate_json('quantity', 'operation')
def update_stock(product_id):
    """Atualiza estoque de um produto (admin only)"""
    try:
        data = request.get_json()
        quantity = int(data['quantity'])
        operation = data['operation']
        
        result = inventory_service.update_stock(product_id, quantity, operation)
        
        if result.get('success'):
            log_user_activity(request.current_user['id'], 'stock_updated', {
                'product_id': product_id,
                'operation': operation,
                'quantity': quantity,
                'new_stock': result['new_stock']
            })
            return jsonify(result), 200
        else:
            return jsonify({'error': result['error']}), 400
            
    except ValueError:
        return jsonify({'error': 'Quantidade deve ser um número inteiro'}), 400
    except Exception as e:
        log_security_event('stock_update_error', details={'error': str(e)})
        return jsonify({'error': 'Erro interno do servidor'}), 500

@inventory_bp.route('/reserve', methods=['POST'])
@token_required
@rate_limit("10 per minute")
@validate_json('product_id', 'quantity')
def reserve_stock():
    """Reserva estoque para um pedido"""
    try:
        data = request.get_json()
        product_id = data['product_id']
        quantity = int(data['quantity'])
        order_id = data.get('order_id')
        
        result = inventory_service.reserve_stock(product_id, quantity, order_id)
        
        if result.get('success'):
            log_user_activity(request.current_user['id'], 'stock_reserved', {
                'product_id': product_id,
                'quantity': quantity,
                'reservation_id': result['reservation_id']
            })
            return jsonify(result), 200
        else:
            return jsonify({'error': result['error']}), 400
            
    except ValueError:
        return jsonify({'error': 'Quantidade deve ser um número inteiro'}), 400
    except Exception as e:
        log_security_event('stock_reservation_error', details={'error': str(e)})
        return jsonify({'error': 'Erro interno do servidor'}), 500

@inventory_bp.route('/reserve/<reservation_id>/confirm', methods=['POST'])
@token_required
@rate_limit("10 per minute")
def confirm_reservation(reservation_id):
    """Confirma reserva de estoque"""
    try:
        result = inventory_service.confirm_stock_reservation(reservation_id)
        
        if result.get('success'):
            log_user_activity(request.current_user['id'], 'stock_reservation_confirmed', {
                'reservation_id': reservation_id
            })
            return jsonify(result), 200
        else:
            return jsonify({'error': result['error']}), 400
            
    except Exception as e:
        log_security_event('stock_reservation_confirm_error', details={'error': str(e)})
        return jsonify({'error': 'Erro interno do servidor'}), 500

@inventory_bp.route('/reserve/<reservation_id>/cancel', methods=['POST'])
@token_required
@rate_limit("10 per minute")
def cancel_reservation(reservation_id):
    """Cancela reserva de estoque"""
    try:
        result = inventory_service.cancel_stock_reservation(reservation_id)
        
        if result.get('success'):
            log_user_activity(request.current_user['id'], 'stock_reservation_cancelled', {
                'reservation_id': reservation_id
            })
            return jsonify(result), 200
        else:
            return jsonify({'error': result['error']}), 400
            
    except Exception as e:
        log_security_event('stock_reservation_cancel_error', details={'error': str(e)})
        return jsonify({'error': 'Erro interno do servidor'}), 500

@inventory_bp.route('/low-stock', methods=['GET'])
@token_required
@admin_required
@rate_limit("10 per minute")
def get_low_stock_products():
    """Busca produtos com estoque baixo (admin only)"""
    try:
        threshold = int(request.args.get('threshold', 10))
        
        result = inventory_service.get_low_stock_products(threshold)
        
        if result.get('success'):
            return jsonify(result), 200
        else:
            return jsonify({'error': result['error']}), 400
            
    except ValueError:
        return jsonify({'error': 'Threshold deve ser um número inteiro'}), 400
    except Exception as e:
        log_security_event('low_stock_error', details={'error': str(e)})
        return jsonify({'error': 'Erro interno do servidor'}), 500

@inventory_bp.route('/movements', methods=['GET'])
@token_required
@admin_required
@rate_limit("20 per minute")
def get_stock_movements():
    """Busca movimentações de estoque (admin only)"""
    try:
        product_id = request.args.get('product_id')
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        page = int(request.args.get('page', 1))
        limit = min(int(request.args.get('limit', 20)), 100)
        
        result = inventory_service.get_stock_movements(
            product_id=product_id,
            start_date=start_date,
            end_date=end_date,
            page=page,
            limit=limit
        )
        
        if result.get('success'):
            return jsonify(result), 200
        else:
            return jsonify({'error': result['error']}), 400
            
    except Exception as e:
        log_security_event('stock_movements_error', details={'error': str(e)})
        return jsonify({'error': 'Erro interno do servidor'}), 500

@inventory_bp.route('/report', methods=['GET'])
@token_required
@admin_required
@rate_limit("5 per minute")
def get_inventory_report():
    """Gera relatório de estoque (admin only)"""
    try:
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        
        result = inventory_service.get_inventory_report(start_date, end_date)
        
        if result.get('success'):
            return jsonify(result), 200
        else:
            return jsonify({'error': result['error']}), 400
            
    except Exception as e:
        log_security_event('inventory_report_error', details={'error': str(e)})
        return jsonify({'error': 'Erro interno do servidor'}), 500

@inventory_bp.route('/cleanup-reservations', methods=['POST'])
@token_required
@admin_required
@rate_limit("1 per hour")
def cleanup_expired_reservations():
    """Limpa reservas expiradas (admin only)"""
    try:
        result = inventory_service.cleanup_expired_reservations()
        
        if result.get('success'):
            log_user_activity(request.current_user['id'], 'expired_reservations_cleaned', {
                'cancelled_count': result['cancelled_reservations']
            })
            return jsonify(result), 200
        else:
            return jsonify({'error': result['error']}), 400
            
    except Exception as e:
        log_security_event('cleanup_reservations_error', details={'error': str(e)})
        return jsonify({'error': 'Erro interno do servidor'}), 500