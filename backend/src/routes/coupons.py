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
from utils.decorators import token_required, validate_json, admin_required
from utils.rate_limit_helper import rate_limit
from utils.exception_strategies import handle_route_exceptions
from exceptions.custom_exceptions import ValidationError, NotFoundError
from middleware.logging import log_user_activity, log_security_event
import logging

logger = logging.getLogger(__name__)

coupons_bp = Blueprint('coupons', __name__)
coupon_service = CouponService()

@coupons_bp.route('/validate', methods=['POST'])
@token_required
@rate_limit("10 per minute")
@validate_json('code', 'order_value')
@handle_route_exceptions
def validate_coupon():
    """
    Valida cupom para uso.

    Implementa tratamento robusto de exceções e validação de dados.

    Request Body:
        code (str): Código do cupom.
        order_value (float): Valor do pedido.

    Returns:
        JSON: Cupom válido com desconto calculado ou erro.
    """
    user_id = request.current_user['id']
    data = request.get_json()

    if not data.get('code'):
        raise ValidationError("Código do cupom é obrigatório")
    
    if not isinstance(data.get('order_value'), (int, float)) or data.get('order_value', 0) <= 0:
        raise ValidationError("Valor do pedido deve ser um número positivo")

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
        raise ValidationError(result.get('error', 'Cupom inválido'))

@coupons_bp.route('/apply', methods=['POST'])
@token_required
@rate_limit("10 per minute")
@validate_json('code', 'order_id', 'order_value')
@handle_route_exceptions
def apply_coupon():
    """
    Aplica cupom a um pedido.

    Implementa tratamento robusto de exceções e validação de dados.

    Request Body:
        code (str): Código do cupom.
        order_id (str): ID do pedido.
        order_value (float): Valor do pedido.

    Returns:
        JSON: Pedido com desconto aplicado ou erro.
    """
    user_id = request.current_user['id']
    data = request.get_json()

    if not data.get('code'):
        raise ValidationError("Código do cupom é obrigatório")
    
    if not data.get('order_id'):
        raise ValidationError("order_id é obrigatório")
    
    if not isinstance(data.get('order_value'), (int, float)) or data.get('order_value', 0) <= 0:
        raise ValidationError("Valor do pedido deve ser um número positivo")

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
        raise ValidationError(result.get('error', 'Erro ao aplicar cupom'))

@coupons_bp.route('/', methods=['GET'])
@token_required
@handle_route_exceptions
def get_coupons():
    """
    Lista cupons disponíveis para o usuário.

    Implementa tratamento robusto de exceções e validação de dados.

    Query Parameters:
        search (str): Termo de busca opcional.

    Returns:
        JSON: Lista de cupons válidos e ativos.
    """
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
            try:
                now = datetime.now()
                valid_from = datetime.fromisoformat(coupon['valid_from'])
                valid_until = datetime.fromisoformat(coupon['valid_until'])

                if now >= valid_from and now <= valid_until:
                    valid_coupons.append(coupon)
            except (ValueError, KeyError):
                # Se erro ao parsear datas, ignora cupom
                continue

        return jsonify({
            'success': True,
            'coupons': valid_coupons
        }), 200
    else:
        raise ValidationError(result.get('error', 'Erro ao buscar cupons'))

@coupons_bp.route('/available', methods=['GET'])
@token_required
@handle_route_exceptions
def get_available_coupons():
    """
    Retorna cupons disponíveis para o usuário autenticado.

    Implementa tratamento robusto de exceções e validação de dados.

    Filtra cupons válidos, ativos e dentro do período de validade.
    Retorna também cupons do usuário e cupons expirados para histórico.

    Returns:
        JSON: Objeto com available, userCoupons e expired.
    """
    # user_id reservado para futura implementação de filtros por usuário
    # user_id = request.current_user['id']
    from datetime import datetime

    now = datetime.now()

    # Buscar todos os cupons ativos
    filters = {'active': True}
    result = coupon_service.get_coupons(filters)

    available = []
    expired = []
    user_coupons = []

    if result.get('success'):
        for coupon in result['coupons']:
            try:
                valid_from = datetime.fromisoformat(coupon['valid_from'].replace('Z', '+00:00'))
                valid_until = datetime.fromisoformat(coupon['valid_until'].replace('Z', '+00:00'))

                # Verificar se está válido
                if now >= valid_from and now <= valid_until:
                    # Verificar limite de uso
                    if (coupon.get('usage_limit') is None or
                            coupon.get('usage_count', 0) <
                            coupon.get('usage_limit', 0)):
                        available.append(coupon)
                else:
                    expired.append(coupon)
            except (ValueError, KeyError):
                # Se erro ao parsear datas, ignora cupom
                continue

    # Buscar cupons pessoais do usuário (se houver tabela user_coupons)
    # Por enquanto, retorna lista vazia

    return jsonify({
        'success': True,
        'available': available,
        'userCoupons': user_coupons,
        'expired': expired
    }), 200

# Rotas administrativas
@coupons_bp.route('/admin', methods=['GET'])
@admin_required
@handle_route_exceptions
def admin_get_coupons():
    """
    Lista todos os cupons (admin).
    
    Implementa tratamento robusto de exceções e validação de dados.
    """
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
        raise ValidationError(result.get('error', 'Erro ao buscar cupons'))

@coupons_bp.route('/admin', methods=['POST'])
@admin_required
@rate_limit("5 per minute")
@validate_json('name', 'type', 'value', 'valid_until')
@handle_route_exceptions
def admin_create_coupon():
    """
    Cria novo cupom (admin).
    
    Implementa tratamento robusto de exceções e validação de dados.
    """
    data = request.get_json()

    if not data.get('name'):
        raise ValidationError("Nome do cupom é obrigatório")
    
    if not data.get('type') or data.get('type') not in ['percentage', 'fixed']:
        raise ValidationError("Tipo deve ser 'percentage' ou 'fixed'")
    
    if not isinstance(data.get('value'), (int, float)) or data.get('value', 0) <= 0:
        raise ValidationError("Valor deve ser um número positivo")

    result = coupon_service.create_coupon(data)

    if result.get('success'):
        log_user_activity(request.current_user['id'], 'coupon_created', {
            'code': result['coupon']['code'],
            'name': data['name']
        })
        return jsonify(result), 201
    else:
        raise ValidationError(result.get('error', 'Erro ao criar cupom'))

@coupons_bp.route('/admin/<coupon_id>', methods=['PUT'])
@admin_required
@rate_limit("10 per minute")
@handle_route_exceptions
def admin_update_coupon(coupon_id):
    """
    Atualiza cupom (admin).
    
    Implementa tratamento robusto de exceções e validação de dados.
    """
    if not coupon_id:
        raise ValidationError("coupon_id é obrigatório")
    
    data = request.get_json()

    result = coupon_service.update_coupon(coupon_id, data)

    if result.get('success'):
        log_user_activity(request.current_user['id'], 'coupon_updated', {
            'coupon_id': coupon_id
        })
        return jsonify(result), 200
    else:
        raise ValidationError(result.get('error', 'Erro ao atualizar cupom'))

@coupons_bp.route('/admin/<coupon_id>', methods=['DELETE'])
@admin_required
@rate_limit("5 per minute")
@handle_route_exceptions
def admin_delete_coupon(coupon_id):
    """
    Remove cupom (admin).
    
    Implementa tratamento robusto de exceções e validação de dados.
    """
    if not coupon_id:
        raise ValidationError("coupon_id é obrigatório")
    
    result = coupon_service.delete_coupon(coupon_id)

    if result.get('success'):
        log_user_activity(request.current_user['id'], 'coupon_deleted', {
            'coupon_id': coupon_id
        })
        return jsonify(result), 200
    else:
        raise NotFoundError(result.get('error', 'Cupom não encontrado'))

@coupons_bp.route('/admin/analytics', methods=['GET'])
@admin_required
@handle_route_exceptions
def admin_get_coupon_analytics():
    """
    Retorna analytics de cupons (admin).
    
    Implementa tratamento robusto de exceções e validação de dados.
    """
    coupon_id = request.args.get('coupon_id')

    result = coupon_service.get_coupon_analytics(coupon_id)

    if result.get('success'):
        return jsonify(result), 200
    else:
        raise ValidationError(result.get('error', 'Erro ao buscar analytics'))

@coupons_bp.route('/admin/<coupon_id>/usage', methods=['GET'])
@admin_required
@handle_route_exceptions
def admin_get_coupon_usage(coupon_id):
    """
    Retorna histórico de uso de um cupom (admin).
    
    Implementa tratamento robusto de exceções e validação de dados.
    """
    if not coupon_id:
        raise ValidationError("coupon_id é obrigatório")
    
    try:
        page = int(request.args.get('page', 1))
        if page < 1:
            raise ValidationError("page deve ser maior que 0")
    except (ValueError, TypeError):
        raise ValidationError("page deve ser um número válido")
    
    try:
        per_page = min(int(request.args.get('per_page', 20)), 100)
        if per_page < 1:
            raise ValidationError("per_page deve ser maior que 0")
    except (ValueError, TypeError):
        raise ValidationError("per_page deve ser um número válido")

    # Utiliza método do CouponService com suporte a paginação
    usage_info = coupon_service.get_coupon_usage(coupon_id=coupon_id, page=page, per_page=per_page)

    return jsonify({
        'success': True,
        'usage': usage_info.get('usage_history', []),
        'page': page,
        'per_page': per_page,
        'total': usage_info.get('total_uses', 0),
        'pagination': usage_info.get('pagination', {})
    }), 200
