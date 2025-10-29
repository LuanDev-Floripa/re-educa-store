"""
Rotas de Promoções e Cupons RE-EDUCA Store
"""
from flask import Blueprint, request, jsonify
from services.promotion_service import PromotionService
from utils.decorators import token_required, admin_required, rate_limit, validate_json
from middleware.logging import log_user_activity, log_security_event

promotions_bp = Blueprint('promotions', __name__)
promotion_service = PromotionService()

@promotions_bp.route('/coupons', methods=['GET'])
@token_required
@admin_required
@rate_limit("20 per minute")
def get_coupons():
    """Lista cupons (admin only)"""
    try:
        is_active = request.args.get('is_active')
        if is_active is not None:
            is_active = is_active.lower() == 'true'
        
        page = int(request.args.get('page', 1))
        limit = min(int(request.args.get('limit', 20)), 100)
        
        result = promotion_service.get_coupons(is_active=is_active, page=page, limit=limit)
        
        if result.get('success'):
            return jsonify(result), 200
        else:
            return jsonify({'error': result['error']}), 400
            
    except Exception as e:
        log_security_event('coupons_list_error', details={'error': str(e)})
        return jsonify({'error': 'Erro interno do servidor'}), 500

@promotions_bp.route('/coupons', methods=['POST'])
@token_required
@admin_required
@rate_limit("10 per minute")
@validate_json('name', 'type', 'value', 'valid_until')
def create_coupon():
    """Cria um novo cupom (admin only)"""
    try:
        data = request.get_json()
        
        result = promotion_service.create_coupon(data)
        
        if result.get('success'):
            log_user_activity(request.current_user['id'], 'coupon_created', {
                'coupon_code': result['coupon']['code'],
                'coupon_name': result['coupon']['name']
            })
            return jsonify(result), 201
        else:
            return jsonify({'error': result['error']}), 400
            
    except Exception as e:
        log_security_event('coupon_creation_error', details={'error': str(e)})
        return jsonify({'error': 'Erro interno do servidor'}), 500

@promotions_bp.route('/coupons/validate', methods=['POST'])
@token_required
@rate_limit("20 per minute")
@validate_json('code', 'order_value')
def validate_coupon():
    """Valida um cupom"""
    try:
        data = request.get_json()
        code = data['code']
        user_id = request.current_user['id']
        order_value = float(data['order_value'])
        product_ids = data.get('product_ids', [])
        
        result = promotion_service.validate_coupon(code, user_id, order_value, product_ids)
        
        if result.get('success'):
            return jsonify(result), 200
        else:
            return jsonify({'error': result['error']}), 400
            
    except ValueError:
        return jsonify({'error': 'Valor do pedido deve ser um número'}), 400
    except Exception as e:
        log_security_event('coupon_validation_error', details={'error': str(e)})
        return jsonify({'error': 'Erro interno do servidor'}), 500

@promotions_bp.route('/coupons/apply', methods=['POST'])
@token_required
@rate_limit("10 per minute")
@validate_json('code', 'order_id', 'order_value')
def apply_coupon():
    """Aplica um cupom a um pedido"""
    try:
        data = request.get_json()
        code = data['code']
        user_id = request.current_user['id']
        order_id = data['order_id']
        order_value = float(data['order_value'])
        
        result = promotion_service.apply_coupon(code, user_id, order_id, order_value)
        
        if result.get('success'):
            log_user_activity(user_id, 'coupon_applied', {
                'coupon_code': code,
                'order_id': order_id,
                'discount': result['discount']
            })
            return jsonify(result), 200
        else:
            return jsonify({'error': result['error']}), 400
            
    except ValueError:
        return jsonify({'error': 'Valor do pedido deve ser um número'}), 400
    except Exception as e:
        log_security_event('coupon_application_error', details={'error': str(e)})
        return jsonify({'error': 'Erro interno do servidor'}), 500

@promotions_bp.route('/coupons/<coupon_id>/stats', methods=['GET'])
@token_required
@admin_required
@rate_limit("10 per minute")
def get_coupon_stats(coupon_id):
    """Retorna estatísticas de uso de um cupom (admin only)"""
    try:
        result = promotion_service.get_coupon_usage_stats(coupon_id)
        
        if result.get('success'):
            return jsonify(result), 200
        else:
            return jsonify({'error': result['error']}), 400
            
    except Exception as e:
        log_security_event('coupon_stats_error', details={'error': str(e)})
        return jsonify({'error': 'Erro interno do servidor'}), 500

@promotions_bp.route('/promotions', methods=['GET'])
@token_required
@admin_required
@rate_limit("20 per minute")
def get_promotions():
    """Lista promoções (admin only)"""
    try:
        is_active = request.args.get('is_active')
        if is_active is not None:
            is_active = is_active.lower() == 'true'
        
        page = int(request.args.get('page', 1))
        limit = min(int(request.args.get('limit', 20)), 100)
        
        result = promotion_service.get_promotions(is_active=is_active, page=page, limit=limit)
        
        if result.get('success'):
            return jsonify(result), 200
        else:
            return jsonify({'error': result['error']}), 400
            
    except Exception as e:
        log_security_event('promotions_list_error', details={'error': str(e)})
        return jsonify({'error': 'Erro interno do servidor'}), 500

@promotions_bp.route('/promotions', methods=['POST'])
@token_required
@admin_required
@rate_limit("10 per minute")
@validate_json('name', 'type', 'value', 'valid_until')
def create_promotion():
    """Cria uma nova promoção (admin only)"""
    try:
        data = request.get_json()
        
        result = promotion_service.create_promotion(data)
        
        if result.get('success'):
            log_user_activity(request.current_user['id'], 'promotion_created', {
                'promotion_name': result['promotion']['name'],
                'promotion_type': result['promotion']['type']
            })
            return jsonify(result), 201
        else:
            return jsonify({'error': result['error']}), 400
            
    except Exception as e:
        log_security_event('promotion_creation_error', details={'error': str(e)})
        return jsonify({'error': 'Erro interno do servidor'}), 500

@promotions_bp.route('/promotions/applicable', methods=['POST'])
@token_required
@rate_limit("20 per minute")
@validate_json('order_value')
def get_applicable_promotions():
    """Busca promoções aplicáveis"""
    try:
        data = request.get_json()
        order_value = float(data['order_value'])
        product_ids = data.get('product_ids', [])
        
        result = promotion_service.get_applicable_promotions(order_value, product_ids)
        
        if result.get('success'):
            return jsonify(result), 200
        else:
            return jsonify({'error': result['error']}), 400
            
    except ValueError:
        return jsonify({'error': 'Valor do pedido deve ser um número'}), 400
    except Exception as e:
        log_security_event('applicable_promotions_error', details={'error': str(e)})
        return jsonify({'error': 'Erro interno do servidor'}), 500

@promotions_bp.route('/coupons/<coupon_id>', methods=['PUT'])
@token_required
@admin_required
@rate_limit("10 per minute")
def update_coupon(coupon_id):
    """Atualiza um cupom (admin only)"""
    try:
        data = request.get_json()
        
        # Busca cupom existente
        coupon_result = promotion_service.supabase.table('coupons').select('*').eq('id', coupon_id).execute()
        
        if not coupon_result.data:
            return jsonify({'error': 'Cupom não encontrado'}), 404
        
        # Atualiza dados
        update_data = {
            'updated_at': datetime.now().isoformat()
        }
        
        allowed_fields = ['name', 'description', 'is_active', 'valid_until', 'usage_limit', 'usage_limit_per_user']
        for field in allowed_fields:
            if field in data:
                update_data[field] = data[field]
        
        # Atualiza no banco
        result = promotion_service.supabase.table('coupons').update(update_data).eq('id', coupon_id).execute()
        
        if result.data:
            log_user_activity(request.current_user['id'], 'coupon_updated', {
                'coupon_id': coupon_id,
                'updated_fields': list(update_data.keys())
            })
            return jsonify({'success': True, 'coupon': result.data[0]}), 200
        else:
            return jsonify({'error': 'Erro ao atualizar cupom'}), 500
            
    except Exception as e:
        log_security_event('coupon_update_error', details={'error': str(e)})
        return jsonify({'error': 'Erro interno do servidor'}), 500

@promotions_bp.route('/promotions/<promotion_id>', methods=['PUT'])
@token_required
@admin_required
@rate_limit("10 per minute")
def update_promotion(promotion_id):
    """Atualiza uma promoção (admin only)"""
    try:
        data = request.get_json()
        
        # Busca promoção existente
        promotion_result = promotion_service.supabase.table('promotions').select('*').eq('id', promotion_id).execute()
        
        if not promotion_result.data:
            return jsonify({'error': 'Promoção não encontrada'}), 404
        
        # Atualiza dados
        update_data = {
            'updated_at': datetime.now().isoformat()
        }
        
        allowed_fields = ['name', 'description', 'is_active', 'valid_until', 'priority']
        for field in allowed_fields:
            if field in data:
                update_data[field] = data[field]
        
        # Atualiza no banco
        result = promotion_service.supabase.table('promotions').update(update_data).eq('id', promotion_id).execute()
        
        if result.data:
            log_user_activity(request.current_user['id'], 'promotion_updated', {
                'promotion_id': promotion_id,
                'updated_fields': list(update_data.keys())
            })
            return jsonify({'success': True, 'promotion': result.data[0]}), 200
        else:
            return jsonify({'error': 'Erro ao atualizar promoção'}), 500
            
    except Exception as e:
        log_security_event('promotion_update_error', details={'error': str(e)})
        return jsonify({'error': 'Erro interno do servidor'}), 500

@promotions_bp.route('/coupons/<coupon_id>', methods=['DELETE'])
@token_required
@admin_required
@rate_limit("5 per minute")
def delete_coupon(coupon_id):
    """Deleta um cupom (admin only)"""
    try:
        # Verifica se cupom existe
        coupon_result = promotion_service.supabase.table('coupons').select('*').eq('id', coupon_id).execute()
        
        if not coupon_result.data:
            return jsonify({'error': 'Cupom não encontrado'}), 404
        
        # Deleta cupom
        promotion_service.supabase.table('coupons').delete().eq('id', coupon_id).execute()
        
        log_user_activity(request.current_user['id'], 'coupon_deleted', {
            'coupon_id': coupon_id,
            'coupon_code': coupon_result.data[0]['code']
        })
        
        return jsonify({'success': True, 'message': 'Cupom deletado com sucesso'}), 200
        
    except Exception as e:
        log_security_event('coupon_deletion_error', details={'error': str(e)})
        return jsonify({'error': 'Erro interno do servidor'}), 500

@promotions_bp.route('/promotions/<promotion_id>', methods=['DELETE'])
@token_required
@admin_required
@rate_limit("5 per minute")
def delete_promotion(promotion_id):
    """Deleta uma promoção (admin only)"""
    try:
        # Verifica se promoção existe
        promotion_result = promotion_service.supabase.table('promotions').select('*').eq('id', promotion_id).execute()
        
        if not promotion_result.data:
            return jsonify({'error': 'Promoção não encontrada'}), 404
        
        # Deleta promoção
        promotion_service.supabase.table('promotions').delete().eq('id', promotion_id).execute()
        
        log_user_activity(request.current_user['id'], 'promotion_deleted', {
            'promotion_id': promotion_id,
            'promotion_name': promotion_result.data[0]['name']
        })
        
        return jsonify({'success': True, 'message': 'Promoção deletada com sucesso'}), 200
        
    except Exception as e:
        log_security_event('promotion_deletion_error', details={'error': str(e)})
        return jsonify({'error': 'Erro interno do servidor'}), 500