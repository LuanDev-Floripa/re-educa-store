"""
Rotas de Cupons e Promoções RE-EDUCA Store.

Gerencia cupons de desconto incluindo:
- Validação de cupons
- Aplicação em pedidos
- Listagem de cupons disponíveis
- Gerenciamento administrativo de cupons
"""
from flask import Blueprint, request, jsonify
from services.coupon_service import CouponService
from utils.decorators import token_required, rate_limit, validate_json, admin_required
from middleware.logging import log_user_activity, log_security_event

coupons_bp = Blueprint('coupons', __name__)
coupon_service = CouponService()

@coupons_bp.route('/validate', methods=['POST'])
@token_required
@rate_limit("10 per minute")
@validate_json('code', 'order_value')
def validate_coupon():
    """
    Valida cupom para uso.
    
    Request Body:
        code (str): Código do cupom.
        order_value (float): Valor do pedido.
        
    Returns:
        JSON: Cupom válido com desconto calculado ou erro.
    """
    try:
        user_id = request.current_user['id']
        data = request.get_json()
        
        result = coupon_service.validate_coupon(
            code=data['code'],
            user_id=user_id,
            order_value=data['order_value']
        )
        
        if result.get('success'):
            log_user_activity(user_id, 'coupon_validated', {
                'code': data['code'],
                'order_value': data['order_value']
            })
            return jsonify(result), 200
        else:
            return jsonify({'error': result['error']}), 400
            
    except Exception as e:
        log_security_event('coupon_validation_error', details={'error': str(e)})
        return jsonify({'error': 'Erro interno do servidor'}), 500

@coupons_bp.route('/apply', methods=['POST'])
@token_required
@rate_limit("10 per minute")
@validate_json('code', 'order_id', 'order_value')
def apply_coupon():
    """
    Aplica cupom a um pedido.
    
    Request Body:
        code (str): Código do cupom.
        order_id (str): ID do pedido.
        order_value (float): Valor do pedido.
        
    Returns:
        JSON: Pedido com desconto aplicado ou erro.
    """
    try:
        user_id = request.current_user['id']
        data = request.get_json()
        
        result = coupon_service.apply_coupon(
            code=data['code'],
            user_id=user_id,
            order_id=data['order_id'],
            order_value=data['order_value']
        )
        
        if result.get('success'):
            log_user_activity(user_id, 'coupon_applied', {
                'code': data['code'],
                'order_id': data['order_id'],
                'discount': result['discount']
            })
            return jsonify(result), 200
        else:
            return jsonify({'error': result['error']}), 400
            
    except Exception as e:
        log_security_event('coupon_application_error', details={'error': str(e)})
        return jsonify({'error': 'Erro interno do servidor'}), 500

@coupons_bp.route('/', methods=['GET'])
@token_required
def get_coupons():
    """
    Lista cupons disponíveis para o usuário.
    
    Query Parameters:
        search (str): Termo de busca opcional.
        
    Returns:
        JSON: Lista de cupons válidos e ativos.
    """
    try:
        user_id = request.current_user['id']
        
        # Filtros para cupons ativos e válidos
        filters = {
            'active': True,
            'search': request.args.get('search')
        }
        
        result = coupon_service.get_coupons(filters)
        
        if result.get('success'):
            # Filtra cupons válidos para o usuário
            valid_coupons = []
            for coupon in result['coupons']:
                # Verifica se está dentro do período de validade
                from datetime import datetime
                now = datetime.now()
                valid_from = datetime.fromisoformat(coupon['valid_from'])
                valid_until = datetime.fromisoformat(coupon['valid_until'])
                
                if now >= valid_from and now <= valid_until:
                    valid_coupons.append(coupon)
            
            return jsonify({
                'success': True,
                'coupons': valid_coupons
            }), 200
        else:
            return jsonify({'error': result['error']}), 400
            
    except Exception as e:
        return jsonify({'error': 'Erro interno do servidor'}), 500

# Rotas administrativas
@coupons_bp.route('/admin', methods=['GET'])
@admin_required
def admin_get_coupons():
    """Lista todos os cupons (admin)"""
    try:
        filters = {
            'active': request.args.get('active'),
            'type': request.args.get('type'),
            'search': request.args.get('search')
        }
        
        # Remove valores None
        filters = {k: v for k, v in filters.items() if v is not None}
        
        result = coupon_service.get_coupons(filters)
        
        if result.get('success'):
            return jsonify(result), 200
        else:
            return jsonify({'error': result['error']}), 400
            
    except Exception as e:
        return jsonify({'error': 'Erro interno do servidor'}), 500

@coupons_bp.route('/admin', methods=['POST'])
@admin_required
@rate_limit("5 per minute")
@validate_json('name', 'type', 'value', 'valid_until')
def admin_create_coupon():
    """Cria novo cupom (admin)"""
    try:
        data = request.get_json()
        
        result = coupon_service.create_coupon(data)
        
        if result.get('success'):
            log_user_activity(request.current_user['id'], 'coupon_created', {
                'code': result['coupon']['code'],
                'name': data['name']
            })
            return jsonify(result), 201
        else:
            return jsonify({'error': result['error']}), 400
            
    except Exception as e:
        log_security_event('coupon_creation_error', details={'error': str(e)})
        return jsonify({'error': 'Erro interno do servidor'}), 500

@coupons_bp.route('/admin/<coupon_id>', methods=['PUT'])
@admin_required
@rate_limit("10 per minute")
def admin_update_coupon(coupon_id):
    """Atualiza cupom (admin)"""
    try:
        data = request.get_json()
        
        result = coupon_service.update_coupon(coupon_id, data)
        
        if result.get('success'):
            log_user_activity(request.current_user['id'], 'coupon_updated', {
                'coupon_id': coupon_id
            })
            return jsonify(result), 200
        else:
            return jsonify({'error': result['error']}), 400
            
    except Exception as e:
        log_security_event('coupon_update_error', details={'error': str(e)})
        return jsonify({'error': 'Erro interno do servidor'}), 500

@coupons_bp.route('/admin/<coupon_id>', methods=['DELETE'])
@admin_required
@rate_limit("5 per minute")
def admin_delete_coupon(coupon_id):
    """Remove cupom (admin)"""
    try:
        result = coupon_service.delete_coupon(coupon_id)
        
        if result.get('success'):
            log_user_activity(request.current_user['id'], 'coupon_deleted', {
                'coupon_id': coupon_id
            })
            return jsonify(result), 200
        else:
            return jsonify({'error': result['error']}), 400
            
    except Exception as e:
        log_security_event('coupon_deletion_error', details={'error': str(e)})
        return jsonify({'error': 'Erro interno do servidor'}), 500

@coupons_bp.route('/admin/analytics', methods=['GET'])
@admin_required
def admin_get_coupon_analytics():
    """Retorna analytics de cupons (admin)"""
    try:
        coupon_id = request.args.get('coupon_id')
        
        result = coupon_service.get_coupon_analytics(coupon_id)
        
        if result.get('success'):
            return jsonify(result), 200
        else:
            return jsonify({'error': result['error']}), 400
            
    except Exception as e:
        return jsonify({'error': 'Erro interno do servidor'}), 500

@coupons_bp.route('/admin/<coupon_id>/usage', methods=['GET'])
@admin_required
def admin_get_coupon_usage(coupon_id):
    """Retorna histórico de uso de um cupom (admin)"""
    try:
        page = int(request.args.get('page', 1))
        per_page = min(int(request.args.get('per_page', 20)), 100)
        
        offset = (page - 1) * per_page
        
        # Busca uso do cupom
        if hasattr(coupon_service.db, 'execute_query'):
            # SQLite
            usage_result = coupon_service.db.execute_query('''
                SELECT cu.*, u.name as user_name, u.email as user_email, o.total_amount
                FROM coupon_usage cu
                LEFT JOIN users u ON cu.user_id = u.id
                LEFT JOIN orders o ON cu.order_id = o.id
                WHERE cu.coupon_id = ?
                ORDER BY cu.used_at DESC
                LIMIT ? OFFSET ?
            ''', (coupon_id, per_page, offset))
        else:
            # Supabase
            usage_result = coupon_service.db.table('coupon_usage').select(
                '*, users(name, email), orders(total_amount)'
            ).eq('coupon_id', coupon_id).order('used_at', desc=True).range(offset, offset + per_page - 1).execute()
            usage_result = usage_result.data
        
        return jsonify({
            'success': True,
            'usage': usage_result,
            'page': page,
            'per_page': per_page
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Erro interno do servidor'}), 500