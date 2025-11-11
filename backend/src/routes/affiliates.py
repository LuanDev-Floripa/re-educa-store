"""
Rotas de Afiliados RE-EDUCA Store.

Gerencia integração com plataformas de afiliados (Hotmart, Kiwify, Eduzz)
incluindo listagem de produtos, sincronização e tracking de conversões.
"""
from flask import Blueprint, request, jsonify
from services.affiliate_service import AffiliateService
from utils.decorators import token_required, admin_required, validate_json
from utils.idempotency_decorators import webhook_idempotent
from utils.rate_limit_helper import rate_limit
from utils.exception_strategies import handle_route_exceptions
from exceptions.custom_exceptions import ValidationError, InternalServerError, UnauthorizedError
from middleware.logging import log_user_activity, log_security_event
import logging

logger = logging.getLogger(__name__)

affiliates_bp = Blueprint('affiliates', __name__)
affiliate_service = AffiliateService()

@affiliates_bp.route('/products', methods=['GET'])
@token_required
@rate_limit("30 per minute")
@handle_route_exceptions
def get_affiliate_products():
    """
    Busca produtos afiliados.
    
    Implementa tratamento robusto de exceções e validação de dados.

    Query Parameters:
        platform (str): Plataforma de afiliados (hotmart, kiwify, eduzz).
        category (str): Categoria de produtos.
        page (int): Número da página (padrão: 1).
        limit (int): Limite de resultados (padrão: 20, máx: 100).

    Returns:
        JSON: Lista de produtos afiliados ou erro.
    """
    platform = request.args.get('platform')
    category = request.args.get('category')
    
    try:
        page = int(request.args.get('page', 1))
        if page < 1:
            raise ValidationError("page deve ser maior que 0")
    except (ValueError, TypeError):
        raise ValidationError("page deve ser um número válido")
    
    try:
        limit = int(request.args.get('limit', 20))
        if limit < 1 or limit > 100:
            raise ValidationError("limit deve estar entre 1 e 100")
    except (ValueError, TypeError):
        raise ValidationError("limit deve ser um número válido")

    result = affiliate_service.get_affiliate_products(
        platform=platform,
        category=category,
        page=page,
        limit=limit
    )

    if not result.get('success'):
        raise ValidationError(result.get('error', 'Erro ao buscar produtos afiliados'))

    return jsonify(result), 200

@affiliates_bp.route('/products/sync', methods=['POST'])
@token_required
@admin_required
@rate_limit("5 per hour")
@handle_route_exceptions
def sync_affiliate_products():
    """
    Sincroniza produtos de todas as plataformas (admin only).
    
    Implementa tratamento robusto de exceções e validação de dados.

    Returns:
        JSON: Resultado da sincronização com total de produtos e plataformas.
    """
    result = affiliate_service.sync_all_affiliate_products()

    if not result.get('success'):
        raise InternalServerError(result.get('error', 'Erro ao sincronizar produtos afiliados'))

    log_user_activity(request.current_user['id'], 'affiliate_products_synced', {
        'total_products': result['total_products'],
        'platforms': result['platforms_synced']
    })
    return jsonify(result), 200

@affiliates_bp.route('/products/hotmart', methods=['GET'])
@token_required
@admin_required
@rate_limit("10 per minute")
@handle_route_exceptions
def get_hotmart_products():
    """
    Busca produtos do Hotmart (admin only).
    
    Implementa tratamento robusto de exceções e validação de dados.
    """
    try:
        page = int(request.args.get('page', 0))
        if page < 0:
            raise ValidationError("page deve ser maior ou igual a 0")
    except (ValueError, TypeError):
        raise ValidationError("page deve ser um número válido")
    
    try:
        size = int(request.args.get('size', 20))
        if size < 1 or size > 100:
            raise ValidationError("size deve estar entre 1 e 100")
    except (ValueError, TypeError):
        raise ValidationError("size deve ser um número válido")

    result = affiliate_service.get_hotmart_products(page=page, size=size)

    if not result.get('success'):
        raise ValidationError(result.get('error', 'Erro ao buscar produtos do Hotmart'))

    return jsonify(result), 200

@affiliates_bp.route('/products/kiwify', methods=['GET'])
@token_required
@admin_required
@rate_limit("10 per minute")
@handle_route_exceptions
def get_kiwify_products():
    """
    Busca produtos do Kiwify (admin only).
    
    Implementa tratamento robusto de exceções e validação de dados.
    """
    try:
        page = int(request.args.get('page', 1))
        if page < 1:
            raise ValidationError("page deve ser maior que 0")
    except (ValueError, TypeError):
        raise ValidationError("page deve ser um número válido")
    
    try:
        limit = int(request.args.get('limit', 20))
        if limit < 1 or limit > 100:
            raise ValidationError("limit deve estar entre 1 e 100")
    except (ValueError, TypeError):
        raise ValidationError("limit deve ser um número válido")

    result = affiliate_service.get_kiwify_products(page=page, limit=limit)

    if not result.get('success'):
        raise ValidationError(result.get('error', 'Erro ao buscar produtos do Kiwify'))

    return jsonify(result), 200

@affiliates_bp.route('/products/logs', methods=['GET'])
@token_required
@admin_required
@rate_limit("10 per minute")
@handle_route_exceptions
def get_logs_products():
    """
    Busca produtos do Logs (admin only).
    
    Implementa tratamento robusto de exceções e validação de dados.
    """
    try:
        page = int(request.args.get('page', 1))
        if page < 1:
            raise ValidationError("page deve ser maior que 0")
    except (ValueError, TypeError):
        raise ValidationError("page deve ser um número válido")
    
    try:
        limit = int(request.args.get('limit', 20))
        if limit < 1 or limit > 100:
            raise ValidationError("limit deve estar entre 1 e 100")
    except (ValueError, TypeError):
        raise ValidationError("limit deve ser um número válido")

    result = affiliate_service.get_logs_products(page=page, limit=limit)

    if not result.get('success'):
        raise ValidationError(result.get('error', 'Erro ao buscar produtos do Logs'))

    return jsonify(result), 200

@affiliates_bp.route('/products/braip', methods=['GET'])
@token_required
@admin_required
@rate_limit("10 per minute")
@handle_route_exceptions
def get_braip_products():
    """
    Busca produtos do Braip (admin only).
    
    Implementa tratamento robusto de exceções e validação de dados.
    """
    try:
        page = int(request.args.get('page', 1))
        if page < 1:
            raise ValidationError("page deve ser maior que 0")
    except (ValueError, TypeError):
        raise ValidationError("page deve ser um número válido")
    
    try:
        limit = int(request.args.get('limit', 20))
        if limit < 1 or limit > 100:
            raise ValidationError("limit deve estar entre 1 e 100")
    except (ValueError, TypeError):
        raise ValidationError("limit deve ser um número válido")

    result = affiliate_service.get_braip_products(page=page, limit=limit)

    if not result.get('success'):
        raise ValidationError(result.get('error', 'Erro ao buscar produtos do Braip'))

    return jsonify(result), 200

@affiliates_bp.route('/sales', methods=['GET'])
@token_required
@admin_required
@rate_limit("20 per minute")
@handle_route_exceptions
def get_affiliate_sales():
    """
    Busca vendas afiliadas (admin only).
    
    Implementa tratamento robusto de exceções e validação de dados.
    """
    platform = request.args.get('platform')
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    
    try:
        page = int(request.args.get('page', 1))
        if page < 1:
            raise ValidationError("page deve ser maior que 0")
    except (ValueError, TypeError):
        raise ValidationError("page deve ser um número válido")
    
    try:
        limit = int(request.args.get('limit', 20))
        if limit < 1 or limit > 100:
            raise ValidationError("limit deve estar entre 1 e 100")
    except (ValueError, TypeError):
        raise ValidationError("limit deve ser um número válido")

    result = affiliate_service.get_affiliate_sales(
        platform=platform,
        start_date=start_date,
        end_date=end_date,
        page=page,
        limit=limit
    )

    if not result.get('success'):
        raise ValidationError(result.get('error', 'Erro ao buscar vendas afiliadas'))

    return jsonify(result), 200

@affiliates_bp.route('/stats', methods=['GET'])
@token_required
@admin_required
@rate_limit("10 per minute")
@handle_route_exceptions
def get_affiliate_stats():
    """
    Retorna estatísticas de afiliados (admin only).
    
    Implementa tratamento robusto de exceções e validação de dados.
    """
    result = affiliate_service.get_affiliate_stats()

    if not result.get('success'):
        raise InternalServerError(result.get('error', 'Erro ao buscar estatísticas de afiliados'))

    return jsonify(result), 200

@affiliates_bp.route('/webhook/hotmart', methods=['POST'])
@webhook_idempotent(event_id_field='data.purchase.subscription.code', ttl=604800)
@handle_route_exceptions
def hotmart_webhook():
    """
    Webhook do Hotmart para notificações de venda (IDEMPOTENTE).
    
    Implementa tratamento robusto de exceções e validação de dados.
    Idempotência garante que eventos duplicados são ignorados automaticamente (TTL: 7 dias).
    """
    # Verifica assinatura do webhook
    signature = request.headers.get('X-Hotmart-Hottok')
    payload = request.get_data()

    if signature:
        # Valida assinatura do webhook
        is_valid = affiliate_service.verify_hotmart_webhook(signature, payload)
        if not is_valid:
            log_security_event('hotmart_webhook_invalid_signature', details={
                'ip': request.remote_addr,
                'signature_received': signature[:20] + '...' if signature else None
            })
            raise UnauthorizedError('Assinatura inválida')

    data = request.get_json()

    if not data:
        raise ValidationError('Payload inválido')

    # Processa notificação de venda
    if data.get('event') == 'PURCHASE_APPROVED':
        result = affiliate_service.track_hotmart_sale(data)

        if not result.get('success'):
            raise ValidationError(result.get('error', 'Erro ao processar venda do Hotmart'))

        return jsonify({'status': 'success'}), 200

    return jsonify({'status': 'ignored'}), 200

@affiliates_bp.route('/webhook/kiwify', methods=['POST'])
@webhook_idempotent(event_id_field='data.id', ttl=604800)
@handle_route_exceptions
def kiwify_webhook():
    """
    Webhook do Kiwify para notificações de venda.
    
    Implementa tratamento robusto de exceções e validação de dados.
    """
    # Verifica assinatura do webhook
    signature = request.headers.get('X-Kiwify-Signature')
    payload = request.get_data()

    if signature:
        # Valida assinatura do webhook
        is_valid = affiliate_service.verify_kiwify_webhook(signature, payload)
        if not is_valid:
            log_security_event('kiwify_webhook_invalid_signature', details={
                'ip': request.remote_addr,
                'signature_received': signature[:20] + '...' if signature else None
            })
            raise UnauthorizedError('Assinatura inválida')

    data = request.get_json()

    if not data:
        raise ValidationError('Payload inválido')

    # Processa notificação de venda
    if data.get('event') == 'sale.created':
        result = affiliate_service.track_kiwify_sale(data)

        if not result.get('success'):
            raise ValidationError(result.get('error', 'Erro ao processar venda do Kiwify'))

        return jsonify({'status': 'success'}), 200

    return jsonify({'status': 'ignored'}), 200

@affiliates_bp.route('/webhook/logs', methods=['POST'])
@webhook_idempotent(event_id_field='data.id', ttl=604800)
@handle_route_exceptions
def logs_webhook():
    """
    Webhook do Logs para notificações de venda.
    
    Implementa tratamento robusto de exceções e validação de dados.
    """
    data = request.get_json()

    if not data:
        raise ValidationError('Payload inválido')

    # Processa notificação de venda
    if data.get('event') == 'sale.completed':
        result = affiliate_service.track_logs_sale(data)

        if not result.get('success'):
            raise ValidationError(result.get('error', 'Erro ao processar venda do Logs'))

        return jsonify({'status': 'success'}), 200

    return jsonify({'status': 'ignored'}), 200

@affiliates_bp.route('/webhook/braip', methods=['POST'])
@webhook_idempotent(event_id_field='transaction.id', ttl=604800)
@handle_route_exceptions
def braip_webhook():
    """
    Webhook do Braip para notificações de venda.
    
    Implementa tratamento robusto de exceções e validação de dados.
    """
    data = request.get_json()

    if not data:
        raise ValidationError('Payload inválido')

    # Processa notificação de venda
    if data.get('event') == 'transaction.approved':
        result = affiliate_service.track_braip_sale(data)

        if not result.get('success'):
            raise ValidationError(result.get('error', 'Erro ao processar venda do Braip'))

        return jsonify({'status': 'success'}), 200

    return jsonify({'status': 'ignored'}), 200

@affiliates_bp.route('/commission/calculate', methods=['POST'])
@token_required
@rate_limit("20 per minute")
@validate_json('platform', 'amount')
@handle_route_exceptions
def calculate_commission():
    """
    Calcula comissão para uma venda.
    
    Implementa tratamento robusto de exceções e validação de dados.
    """
    data = request.get_json()
    platform = data['platform']
    
    try:
        amount = float(data['amount'])
        if amount < 0:
            raise ValidationError("amount deve ser maior ou igual a 0")
    except (ValueError, TypeError):
        raise ValidationError('Valor inválido para amount')

    commission = affiliate_service.calculate_commission(platform, amount)

    return jsonify({
        'platform': platform,
        'amount': amount,
        'commission': commission,
        'commission_ra