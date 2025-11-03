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

    except Exception:
        return jsonify({'error': 'Erro interno do servidor'}), 500

@coupons_bp.route('/available', methods=['GET'])
@token_required
def get_available_coupons():
    """
    Retorna cupons disponíveis para o usuário autenticado.

    Filtra cupons válidos, ativos e dentro do período de validade.
    Retorna também cupons do usuário e cupons expirados para histórico.

    Returns:
        JSON: Objeto com available, userCoupons e expired.
    """
    try:
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
                except Exception:
                    # Se erro ao parsear datas, adiciona aos disponíveis
                    available.append(coupon)

        # Buscar cupons pessoais do usuário (se houver tabela user_coupons)
        # Por enquanto, retorna lista vazia

        return jsonify({
            'success': True,
            'available': available,
            'userCoupons': user_coupons,
            'expired': expired
        }), 200

    except Exception:
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

    except Exception:
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

    except Exception:
        return jsonify({'error': 'Erro interno do servidor'}), 500

@coupons_bp.route('/admin/<coupon_id>/usage', methods=['GET'])
@admin_required
def admin_get_coupon_usage(coupon_id):
    """Retorna histórico de uso de um cupom (admin)"""
    try:
        page = int(request.args.get('page', 1))
        per_page = min(int(request.args.get('per_page', 20)), 100)

        # ✅ CORRIGIDO: Usa método do CouponService com paginação
        usage_info = coupon_service.get_coupon_usage(coupon_id=coupon_id, page=page, per_page=per_page)

        return jsonify({
            'success': True,
            'usage': usage_info.get('usage_history', []),
            'page': page,
            'per_page': per_page,
            'total': usage_info.get('total_uses', 0),
            'pagination': usage_info.get('pagination', {})
        }), 200

    except Exception:
        return jsonify({'error': 'Erro interno do servidor'}), 500
