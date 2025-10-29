"""
Rotas de Afiliados RE-EDUCA Store
"""
from flask import Blueprint, request, jsonify
from services.affiliate_service import AffiliateService
from utils.decorators import token_required, admin_required, rate_limit, validate_json
from middleware.logging import log_user_activity, log_security_event

affiliates_bp = Blueprint('affiliates', __name__)
affiliate_service = AffiliateService()

@affiliates_bp.route('/products', methods=['GET'])
@token_required
@rate_limit("30 per minute")
def get_affiliate_products():
    """Busca produtos afiliados"""
    try:
        platform = request.args.get('platform')
        category = request.args.get('category')
        page = int(request.args.get('page', 1))
        limit = min(int(request.args.get('limit', 20)), 100)
        
        result = affiliate_service.get_affiliate_products(
            platform=platform,
            category=category,
            page=page,
            limit=limit
        )
        
        if result.get('success'):
            return jsonify(result), 200
        else:
            return jsonify({'error': result['error']}), 400
            
    except Exception as e:
        log_security_event('affiliate_products_error', details={'error': str(e)})
        return jsonify({'error': 'Erro interno do servidor'}), 500

@affiliates_bp.route('/products/sync', methods=['POST'])
@token_required
@admin_required
@rate_limit("5 per hour")
def sync_affiliate_products():
    """Sincroniza produtos de todas as plataformas (admin only)"""
    try:
        result = affiliate_service.sync_all_affiliate_products()
        
        if result.get('success'):
            log_user_activity(request.current_user['id'], 'affiliate_products_synced', {
                'total_products': result['total_products'],
                'platforms': result['platforms_synced']
            })
            return jsonify(result), 200
        else:
            return jsonify({'error': result['error']}), 400
            
    except Exception as e:
        log_security_event('affiliate_sync_error', details={'error': str(e)})
        return jsonify({'error': 'Erro interno do servidor'}), 500

@affiliates_bp.route('/products/hotmart', methods=['GET'])
@token_required
@admin_required
@rate_limit("10 per minute")
def get_hotmart_products():
    """Busca produtos do Hotmart (admin only)"""
    try:
        page = int(request.args.get('page', 0))
        size = int(request.args.get('size', 20))
        
        result = affiliate_service.get_hotmart_products(page=page, size=size)
        
        if result.get('success'):
            return jsonify(result), 200
        else:
            return jsonify({'error': result['error']}), 400
            
    except Exception as e:
        log_security_event('hotmart_products_error', details={'error': str(e)})
        return jsonify({'error': 'Erro interno do servidor'}), 500

@affiliates_bp.route('/products/kiwify', methods=['GET'])
@token_required
@admin_required
@rate_limit("10 per minute")
def get_kiwify_products():
    """Busca produtos do Kiwify (admin only)"""
    try:
        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', 20))
        
        result = affiliate_service.get_kiwify_products(page=page, limit=limit)
        
        if result.get('success'):
            return jsonify(result), 200
        else:
            return jsonify({'error': result['error']}), 400
            
    except Exception as e:
        log_security_event('kiwify_products_error', details={'error': str(e)})
        return jsonify({'error': 'Erro interno do servidor'}), 500

@affiliates_bp.route('/products/logs', methods=['GET'])
@token_required
@admin_required
@rate_limit("10 per minute")
def get_logs_products():
    """Busca produtos do Logs (admin only)"""
    try:
        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', 20))
        
        result = affiliate_service.get_logs_products(page=page, limit=limit)
        
        if result.get('success'):
            return jsonify(result), 200
        else:
            return jsonify({'error': result['error']}), 400
            
    except Exception as e:
        log_security_event('logs_products_error', details={'error': str(e)})
        return jsonify({'error': 'Erro interno do servidor'}), 500

@affiliates_bp.route('/products/braip', methods=['GET'])
@token_required
@admin_required
@rate_limit("10 per minute")
def get_braip_products():
    """Busca produtos do Braip (admin only)"""
    try:
        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', 20))
        
        result = affiliate_service.get_braip_products(page=page, limit=limit)
        
        if result.get('success'):
            return jsonify(result), 200
        else:
            return jsonify({'error': result['error']}), 400
            
    except Exception as e:
        log_security_event('braip_products_error', details={'error': str(e)})
        return jsonify({'error': 'Erro interno do servidor'}), 500

@affiliates_bp.route('/sales', methods=['GET'])
@token_required
@admin_required
@rate_limit("20 per minute")
def get_affiliate_sales():
    """Busca vendas afiliadas (admin only)"""
    try:
        platform = request.args.get('platform')
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        page = int(request.args.get('page', 1))
        limit = min(int(request.args.get('limit', 20)), 100)
        
        result = affiliate_service.get_affiliate_sales(
            platform=platform,
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
        log_security_event('affiliate_sales_error', details={'error': str(e)})
        return jsonify({'error': 'Erro interno do servidor'}), 500

@affiliates_bp.route('/stats', methods=['GET'])
@token_required
@admin_required
@rate_limit("10 per minute")
def get_affiliate_stats():
    """Retorna estatísticas de afiliados (admin only)"""
    try:
        result = affiliate_service.get_affiliate_stats()
        
        if result.get('success'):
            return jsonify(result), 200
        else:
            return jsonify({'error': result['error']}), 400
            
    except Exception as e:
        log_security_event('affiliate_stats_error', details={'error': str(e)})
        return jsonify({'error': 'Erro interno do servidor'}), 500

@affiliates_bp.route('/webhook/hotmart', methods=['POST'])
def hotmart_webhook():
    """Webhook do Hotmart para notificações de venda"""
    try:
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
                return jsonify({'error': 'Assinatura inválida'}), 401
        
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'Payload inválido'}), 400
        
        # Processa notificação de venda
        if data.get('event') == 'PURCHASE_APPROVED':
            result = affiliate_service.track_hotmart_sale(data)
            
            if result.get('success'):
                return jsonify({'status': 'success'}), 200
            else:
                return jsonify({'error': result['error']}), 400
        
        return jsonify({'status': 'ignored'}), 200
        
    except Exception as e:
        log_security_event('hotmart_webhook_error', details={'error': str(e)})
        return jsonify({'error': 'Erro interno do servidor'}), 500

@affiliates_bp.route('/webhook/kiwify', methods=['POST'])
def kiwify_webhook():
    """Webhook do Kiwify para notificações de venda"""
    try:
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
                return jsonify({'error': 'Assinatura inválida'}), 401
        
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'Payload inválido'}), 400
        
        # Processa notificação de venda
        if data.get('event') == 'sale.created':
            result = affiliate_service.track_kiwify_sale(data)
            
            if result.get('success'):
                return jsonify({'status': 'success'}), 200
            else:
                return jsonify({'error': result['error']}), 400
        
        return jsonify({'status': 'ignored'}), 200
        
    except Exception as e:
        log_security_event('kiwify_webhook_error', details={'error': str(e)})
        return jsonify({'error': 'Erro interno do servidor'}), 500

@affiliates_bp.route('/webhook/logs', methods=['POST'])
def logs_webhook():
    """Webhook do Logs para notificações de venda"""
    try:
        data = request.get_json()
        
        # Processa notificação de venda
        if data.get('event') == 'sale.completed':
            result = affiliate_service.track_logs_sale(data)
            
            if result.get('success'):
                return jsonify({'status': 'success'}), 200
            else:
                return jsonify({'error': result['error']}), 400
        
        return jsonify({'status': 'ignored'}), 200
        
    except Exception as e:
        log_security_event('logs_webhook_error', details={'error': str(e)})
        return jsonify({'error': 'Erro interno do servidor'}), 500

@affiliates_bp.route('/webhook/braip', methods=['POST'])
def braip_webhook():
    """Webhook do Braip para notificações de venda"""
    try:
        data = request.get_json()
        
        # Processa notificação de venda
        if data.get('event') == 'transaction.approved':
            result = affiliate_service.track_braip_sale(data)
            
            if result.get('success'):
                return jsonify({'status': 'success'}), 200
            else:
                return jsonify({'error': result['error']}), 400
        
        return jsonify({'status': 'ignored'}), 200
        
    except Exception as e:
        log_security_event('braip_webhook_error', details={'error': str(e)})
        return jsonify({'error': 'Erro interno do servidor'}), 500

@affiliates_bp.route('/commission/calculate', methods=['POST'])
@token_required
@rate_limit("20 per minute")
@validate_json('platform', 'amount')
def calculate_commission():
    """Calcula comissão para uma venda"""
    try:
        data = request.get_json()
        platform = data['platform']
        amount = float(data['amount'])
        
        commission = affiliate_service.calculate_commission(platform, amount)
        
        return jsonify({
            'platform': platform,
            'amount': amount,
            'commission': commission,
            'commission_rate': commission / amount if amount > 0 else 0
        }), 200
        
    except ValueError:
        return jsonify({'error': 'Valor inválido para amount'}), 400
    except Exception as e:
        log_security_event('commission_calculation_error', details={'error': str(e)})
        return jsonify({'error': 'Erro interno do servidor'}), 500