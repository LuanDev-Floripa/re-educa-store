"""
Rotas de Promoções e Cupons RE-EDUCA Store.

Gerencia promoções e cupons de desconto incluindo:
- Listagem e criação de cupons (admin)
- Validação e aplicação de cupons
- Regras de promoção e descontos
"""
from datetime import datetime
from flask import Blueprint, request, jsonify
from services.promotion_service import PromotionService
from utils.decorators import token_required, admin_required, validate_json
from utils.rate_limit_helper import rate_limit
from utils.exception_strategies import handle_route_exceptions
from exceptions.custom_exceptions import ValidationError, NotFoundError, InternalServerError
from middleware.logging import log_user_activity, log_security_event
import logging

logger = logging.getLogger(__name__)

promotions_bp = Blueprint('promotions', __name__)
promotion_service = PromotionService()

@promotions_bp.route('/coupons', methods=['GET'])
@token_required
@admin_required
@rate_limit("20 per minute")
@handle_route_exceptions
def get_coupons():
    """
    Lista cupons (admin only).
    
    Implementa tratamento robusto de exceções e validação de dados.
    """
    is_active = request.args.get('is_active')
    if is_active is not None:
        is_active = is_active.lower() == 'true'

    try:
        page = int(request.args.get('page', 1))
        if page < 1:
            raise ValidationError("page deve ser maior que 0")
    except (ValueError, TypeError):
        raise ValidationError("page deve ser um número válido")
    
    try:
        limit = min(int(request.args.get('limit', 20)), 100)
        if limit < 1:
            raise ValidationError("limit deve ser maior que 0")
    except (ValueError, TypeError):
        raise ValidationError("limit deve ser um número válido")

    result = promotion_service.get_coupons(is_active=is_active, page=page, limit=limit)

    if not result.get('success'):
        raise ValidationError(result.get('error', 'Erro ao buscar cupons'))

    return jsonify(result), 200

@promotions_bp.route('/coupons', methods=['POST'])
@token_required
@admin_required
@rate_limit("10 per minute")
@validate_json('name', 'type', 'value', 'valid_until')
@handle_route_exceptions
def create_coupon():
    """
    Cria um novo cupom (admin only).
    
    Implementa tratamento robusto de exceções e validação de dados.
    """
    data = request.get_json()

    result = promotion_service.create_coupon(data)

    if not result.get('success'):
        raise ValidationError(result.get('error', 'Erro ao criar cupom'))

    log_user_activity(request.current_user['id'], 'coupon_created', {
        'coupon_code': result['coupon']['code'],
        'coupon_name': result['coupon']['name']
    })
    return jsonify(result), 201

@promotions_bp.route('/coupons/validate', methods=['POST'])
@token_required
@rate_limit("20 per minute")
@validate_json('code', 'order_value')
@handle_route_exceptions
def validate_coupon():
    """
    Valida um cupom.
    
    Implementa tratamento robusto de exceções e validação de dados.
    """
    data = request.get_json()
    code = data['code']
    user_id = request.current_user['id']
    product_ids = data.get('product_ids', [])
    
    try:
        order_value = float(data['order_value'])
        if order_value < 0:
            raise ValidationError("order_value deve ser maior ou igual a 0")
    except (ValueError, TypeError):
        raise ValidationError('Valor do pedido deve ser um número válido')

    result = promotion_service.validate_coupon(code, user_id, order_value, product_ids)

    if not result.get('success'):
        raise ValidationError(result.get('error', 'Erro ao validar cupom'))

    return jsonify(result), 200

@promotions_bp.route('/coupons/apply', methods=['POST'])
@token_required
@rate_limit("10 per minute")
@validate_json('code', 'order_id', 'order_value')
@handle_route_exceptions
def apply_coupon():
    """
    Aplica um cupom a um pedido.
    
    Implementa tratamento robusto de exceções e validação de dados.
    """
    data = request.get_json()
    code = data['code']
    user_id = request.current_user['id']
    order_id = data['order_id']
    
    try:
        order_value = float(data['order_value'])
        if order_value < 0:
            raise ValidationError("order_value deve ser maior ou igual a 0")
    except (ValueError, TypeError):
        raise ValidationError('Valor do pedido deve ser um número válido')

    result = promotion_service.apply_coupon(code, user_id, order_id, order_value)

    if not result.get('success'):
        raise ValidationError(result.get('error', 'Erro ao aplicar cupom'))

    log_user_activity(user_id, 'coupon_applied', {
        'coupon_code': code,
        'order_id': order_id,
        'discount': result['discount']
    })
    return jsonify(result), 200

@promotions_bp.route('/coupons/<coupon_id>/stats', methods=['GET'])
@token_required
@admin_required
@rate_limit("10 per minute")
@handle_route_exceptions
def get_coupon_stats(coupon_id):
    """
    Retorna estatísticas de uso de um cupom (admin only).
    
    Implementa tratamento robusto de exceções e validação de dados.
    """
    if not coupon_id:
        raise ValidationError("coupon_id é obrigatório")
    
    result = promotion_service.get_coupon_usage_stats(coupon_id)

    if not result.get('success'):
        raise NotFoundError(result.get('error', 'Cupom não encontrado ou erro ao buscar estatísticas'))

    return jsonify(result), 200

@promotions_bp.route('/promotions', methods=['GET'])
@token_required
@admin_required
@rate_limit("20 per minute")
@handle_route_exceptions
def get_promotions():
    """
    Lista promoções (admin only).
    
    Implementa tratamento robusto de exceções e validação de dados.
    """
    is_active = request.args.get('is_active')
    if is_active is not None:
        is_active = is_active.lower() == 'true'

    try:
        page = int(request.args.get('page', 1))
        if page < 1:
            raise ValidationError("page deve ser maior que 0")
    except (ValueError, TypeError):
        raise ValidationError("page deve ser um número válido")
    
    try:
        limit = min(int(request.args.get('limit', 20)), 100)
        if limit < 1:
            raise ValidationError("limit deve ser maior que 0")
    except (ValueError, TypeError):
        raise ValidationError("limit deve ser um número válido")

    result = promotion_service.get_promotions(is_active=is_active, page=page, limit=limit)

    if not result.get('success'):
        raise ValidationError(result.get('error', 'Erro ao buscar promoções'))

    return jsonify(result), 200

@promotions_bp.route('/promotions', methods=['POST'])
@token_required
@admin_required
@rate_limit("10 per minute")
@validate_json('name', 'type', 'value', 'valid_until')
@handle_route_exceptions
def create_promotion():
    """
    Cria uma nova promoção (admin only).
    
    Implementa tratamento robusto de exceções e validação de dados.
    """
    data = request.get_json()

    result = promotion_service.create_promotion(data)

    if not result.get('success'):
        raise ValidationError(result.get('error', 'Erro ao criar promoção'))

    log_user_activity(request.current_user['id'], 'promotion_created', {
        'promotion_name': result['promotion']['name'],
        'promotion_type': result['promotion']['type']
    })
    return jsonify(result), 201

@promotions_bp.route('/promotions/applicable', methods=['POST'])
@token_required
@rate_limit("20 per minute")
@validate_json('order_value')
@handle_route_exceptions
def get_applicable_promotions():
    """
    Busca promoções aplicáveis.
    
    Implementa tratamento robusto de exceções e validação de dados.
    """
    data = request.get_json()
    product_ids = data.get('product_ids', [])
    
    try:
        order_value = float(data['order_value'])
        if order_value < 0:
            raise ValidationError("order_value deve ser maior ou igual a 0")
    except (ValueError, TypeError):
        raise ValidationError('Valor do pedido deve ser um número válido')

    result = promotion_service.get_applicable_promotions(order_value, product_ids)

    if not result.get('success'):
        raise ValidationError(result.get('error', 'Erro ao buscar promoções aplicáveis'))

    return jsonify(result), 200

@promotions_bp.route('/coupons/<coupon_id>', methods=['PUT'])
@token_required
@admin_required
@rate_limit("10 per minute")
@handle_route_exceptions
def update_coupon(coupon_id):
    """
    Atualiza um cupom (admin only).
    
    Implementa tratamento robusto de exceções e validação de dados.
    """
    if not coupon_id:
        raise ValidationError("coupon_id é obrigatório")
    
    data = request.get_json()

    # Utiliza CouponRepository através do service padronizado
    coupon = promotion_service.coupon_repo.find_by_id(coupon_id)

    if not coupon:
        raise NotFoundError('Cupom não encontrado')

    # Atualiza dados
    update_data = {
        'updated_at': datetime.now().isoformat()
    }

    allowed_fields = ['name', 'description', 'is_active', 'valid_until', 'usage_limit', 'usage_limit_per_user']
    for field in allowed_fields:
        if field in data:
            update_data[field] = data[field]

    updated_coupon = promotion_service.coupon_repo.update(coupon_id, update_data)

    if not updated_coupon:
        raise InternalServerError('Erro ao atualizar cupom')

    log_user_activity(request.current_user['id'], 'coupon_updated', {
        'coupon_id': coupon_id,
        'updated_fields': list(update_data.keys())
    })
    return jsonify({'success': True, 'coupon': updated_coupon}), 200

@promotions_bp.route('/promotions/<promotion_id>', methods=['PUT'])
@token_required
@admin_required
@rate_limit("10 per minute")
@handle_route_exceptions
def update_promotion(promotion_id):
    """
    Atualiza uma promoção (admin only).
    
    Implementa tratamento robusto de exceções e validação de dados.
    
    NOTA: Promoções ainda usam queries diretas ao Supabase (pode ser melhorado depois).
    """
    if not promotion_id:
        raise ValidationError("promotion_id é obrigatório")
    
    data = request.get_json()

    # Busca promoção através do service
    # Por enquanto mantém query direta para promotions (não há PromotionRepository ainda)
    promotion_result = promotion_service.supabase.table('promotions').select('*').eq('id', promotion_id).execute()

    if not promotion_result.data:
        raise NotFoundError('Promoção não encontrada')

    # Atualiza dados
    update_data = {
        'updated_at': datetime.now().isoformat()
    }

    allowed_fields = ['name', 'description', 'is_active', 'valid_until', 'priority']
    for field in allowed_fields:
        if field in data:
            update_data[field] = data[field]

    # Atualiza no banco (promoções ainda direto)
    result = promotion_service.supabase.table('promotions').update(update_data).eq('id', promotion_id).execute()

    if not result.data:
        raise InternalServerError('Erro ao atualizar promoção')

    log_user_activity(request.current_user['id'], 'promotion_updated', {
        'promotion_id': promotion_id,
        'updated_fields': list(update_data.keys())
    })
    return jsonify({'success': True, 'promotion': result.data[0]}), 200

@promotions_bp.route('/coupons/<coupon_id>', methods=['DELETE'])
@token_required
@admin_required
@rate_limit("5 per minute")
@handle_route_exceptions
def delete_coupon(coupon_id):
    """
    Deleta um cupom (admin only).
    
    Implementa tratamento robusto de exceções e validação de dados.
    """
    if not coupon_id:
        raise ValidationError("coupon_id é obrigatório")
    
    # Utiliza CouponRepository através do service padronizado
    coupon = promotion_service.coupon_repo.find_by_id(coupon_id)

    if not coupon:
        raise NotFoundError('Cupom não encontrado')

    # Deleta cupom
    success = promotion_service.coupon_repo.delete(coupon_id)

    if not success:
        raise InternalServerError('Erro ao deletar cupom')

    log_user_activity(request.current_user['id'], 'coupon_deleted', {
        'coupon_id': coupon_id,
        'coupon_code': coupon.get('code', '')
    })

    return jsonify({'success': True, 'message': 'Cupom deletado com sucesso'}), 200

@promotions_bp.route('/promotions/<promotion_id>', methods=['DELETE'])
@token_required
@admin_required
@rate_limit("5 per minute")
@handle_route_exceptions
def delete_promotion(promotion_id):
    """
    Deleta uma promoção (admin only).
    
    Implementa tratamento robusto de exceções e validação de dados.
    
    NOTA: Promoções ainda usam queries diretas ao Supabase (pode ser melhorado depois).
    """
    if not promotion_id:
        raise ValidationError("promotion_id é obrigatório")
    
    # Verifica se promoção existe
    promotion_result = promotion_service.supabase.table('promotions').select('*').eq('id', promotion_id).execute()

    if not promotion_result.data:
        raise NotFoundError('Promoção não encontrada')

    # Deleta promoção
    promotion_service.supabase.table('promotions').delete().eq('id', promotion_id).execute()

    log_user_activity(request.current_user['id'], 'promotion_deleted', {
        'promotion_id': promotion_id,
        'promotion_name': promotion_result.data[0]['name']
    })

    return jsonify({'success': True, 'message': 'Promoção deletada com sucesso'}), 200
