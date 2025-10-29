"""
Rotas de Pagamentos RE-EDUCA Store
"""
from flask import Blueprint, request, jsonify
from services.payment_service import PaymentService
from utils.decorators import token_required, rate_limit, validate_json
from middleware.logging import log_user_activity, log_security_event

payments_bp = Blueprint('payments', __name__)
payment_service = PaymentService()

@payments_bp.route('/methods', methods=['GET'])
def get_payment_methods():
    """Retorna métodos de pagamento disponíveis"""
    try:
        methods = payment_service.get_payment_methods()
        return jsonify(methods), 200
    except Exception as e:
        return jsonify({'error': 'Erro interno do servidor'}), 500

@payments_bp.route('/stripe/create-payment-intent', methods=['POST'])
@token_required
@rate_limit("10 per minute")
@validate_json('amount', 'currency')
def create_stripe_payment_intent():
    """Cria Payment Intent no Stripe"""
    try:
        user = request.current_user
        data = request.get_json()
        
        # Cria ou busca cliente Stripe
        customer_result = payment_service.create_stripe_customer({
            'id': user['id'],
            'email': user['email'],
            'name': user['name'],
            'subscription_plan': user.get('subscription_plan', 'free')
        })
        
        if not customer_result.get('success'):
            return jsonify({'error': customer_result['error']}), 400
        
        # Cria Payment Intent
        intent_result = payment_service.create_stripe_payment_intent(
            amount=data['amount'],
            currency=data.get('currency', 'brl'),
            customer_id=customer_result['customer_id'],
            metadata={
                'user_id': user['id'],
                'order_id': data.get('order_id')
            }
        )
        
        if intent_result.get('success'):
            log_user_activity(user['id'], 'payment_intent_created', {
                'amount': data['amount'],
                'currency': data.get('currency', 'brl'),
                'provider': 'stripe'
            })
            return jsonify(intent_result), 200
        else:
            return jsonify({'error': intent_result['error']}), 400
            
    except Exception as e:
        log_security_event('payment_intent_error', details={'error': str(e)})
        return jsonify({'error': 'Erro interno do servidor'}), 500

@payments_bp.route('/stripe/create-subscription', methods=['POST'])
@token_required
@rate_limit("5 per minute")
@validate_json('price_id')
def create_stripe_subscription():
    """Cria assinatura no Stripe"""
    try:
        user = request.current_user
        data = request.get_json()
        
        # Cria ou busca cliente Stripe
        customer_result = payment_service.create_stripe_customer({
            'id': user['id'],
            'email': user['email'],
            'name': user['name'],
            'subscription_plan': user.get('subscription_plan', 'free')
        })
        
        if not customer_result.get('success'):
            return jsonify({'error': customer_result['error']}), 400
        
        # Cria assinatura
        subscription_result = payment_service.create_stripe_subscription(
            customer_id=customer_result['customer_id'],
            price_id=data['price_id'],
            trial_period_days=data.get('trial_period_days')
        )
        
        if subscription_result.get('success'):
            log_user_activity(user['id'], 'subscription_created', {
                'price_id': data['price_id'],
                'provider': 'stripe'
            })
            return jsonify(subscription_result), 200
        else:
            return jsonify({'error': subscription_result['error']}), 400
            
    except Exception as e:
        log_security_event('subscription_creation_error', details={'error': str(e)})
        return jsonify({'error': 'Erro interno do servidor'}), 500

@payments_bp.route('/stripe/webhook', methods=['POST'])
def stripe_webhook():
    """Webhook do Stripe"""
    try:
        payload = request.get_data()
        signature = request.headers.get('Stripe-Signature')
        
        if not signature:
            return jsonify({'error': 'Assinatura não fornecida'}), 400
        
        result = payment_service.handle_stripe_webhook(payload, signature)
        
        if result.get('success'):
            return jsonify({'status': 'success'}), 200
        else:
            return jsonify({'error': result['error']}), 400
            
    except Exception as e:
        log_security_event('stripe_webhook_error', details={'error': str(e)})
        return jsonify({'error': 'Erro interno do servidor'}), 500

@payments_bp.route('/pagseguro/create-payment', methods=['POST'])
@token_required
@rate_limit("10 per minute")
@validate_json('order_id', 'items', 'customer')
def create_pagseguro_payment():
    """Cria pagamento no PagSeguro"""
    try:
        user = request.current_user
        data = request.get_json()
        
        # Busca dados do pedido
        order_result = payment_service.supabase.table('orders').select('*').eq('id', data['order_id']).execute()
        
        if not order_result.data:
            return jsonify({'error': 'Pedido não encontrado'}), 404
        
        order = order_result.data[0]
        
        # Prepara dados do pagamento
        payment_data = {
            'order_id': order['id'],
            'items': data['items'],
            'customer': data['customer'],
            'address': data.get('address')
        }
        
        result = payment_service.create_pagseguro_payment(payment_data)
        
        if result.get('success'):
            log_user_activity(user['id'], 'pagseguro_payment_created', {
                'order_id': data['order_id'],
                'provider': 'pagseguro'
            })
            return jsonify(result), 200
        else:
            return jsonify({'error': result['error']}), 400
            
    except Exception as e:
        log_security_event('pagseguro_payment_error', details={'error': str(e)})
        return jsonify({'error': 'Erro interno do servidor'}), 500

@payments_bp.route('/pagseguro/notification', methods=['POST'])
def pagseguro_notification():
    """Notificação do PagSeguro"""
    try:
        notification_code = request.form.get('notificationCode')
        notification_type = request.form.get('notificationType')
        
        if not notification_code:
            return jsonify({'error': 'Código de notificação não fornecido'}), 400
        
        result = payment_service.handle_pagseguro_notification(notification_code, notification_type)
        
        if result.get('success'):
            return jsonify({'status': 'success'}), 200
        else:
            return jsonify({'error': result['error']}), 400
            
    except Exception as e:
        log_security_event('pagseguro_notification_error', details={'error': str(e)})
        return jsonify({'error': 'Erro interno do servidor'}), 500

@payments_bp.route('/pagseguro/status/<transaction_id>', methods=['GET'])
def get_pagseguro_status(transaction_id):
    """Busca status de transação no PagSeguro"""
    try:
        result = payment_service.handle_pagseguro_notification(transaction_id, 'transaction')
        
        if result.get('success'):
            return jsonify(result), 200
        else:
            return jsonify({'error': result['error']}), 400
            
    except Exception as e:
        return jsonify({'error': 'Erro interno do servidor'}), 500

@payments_bp.route('/history', methods=['GET'])
@token_required
def get_payment_history():
    """Retorna histórico de pagamentos do usuário"""
    try:
        user_id = request.current_user['id']
        page = int(request.args.get('page', 1))
        per_page = min(int(request.args.get('per_page', 20)), 100)
        
        offset = (page - 1) * per_page
        
        # Busca pedidos do usuário
        orders_result = payment_service.supabase.table('orders').select('*').eq('user_id', user_id).order('created_at', desc=True).range(offset, offset + per_page - 1).execute()
        
        return jsonify({
            'payments': orders_result.data,
            'page': page,
            'per_page': per_page
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Erro interno do servidor'}), 500

@payments_bp.route('/subscriptions', methods=['GET'])
@token_required
def get_user_subscriptions():
    """Retorna assinaturas do usuário"""
    try:
        user_id = request.current_user['id']
        
        # Busca assinaturas do usuário
        subscriptions_result = payment_service.supabase.table('subscriptions').select('*').eq('user_id', user_id).order('created_at', desc=True).execute()
        
        return jsonify({
            'subscriptions': subscriptions_result.data
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Erro interno do servidor'}), 500

@payments_bp.route('/subscriptions/<subscription_id>/cancel', methods=['POST'])
@token_required
@rate_limit("3 per minute")
def cancel_subscription(subscription_id):
    """Cancela assinatura"""
    try:
        user_id = request.current_user['id']
        
        # Busca assinatura
        subscription_result = payment_service.supabase.table('subscriptions').select('*').eq('id', subscription_id).eq('user_id', user_id).execute()
        
        if not subscription_result.data:
            return jsonify({'error': 'Assinatura não encontrada'}), 404
        
        subscription = subscription_result.data[0]
        
        # Cancela no Stripe se aplicável
        if subscription.get('stripe_subscription_id'):
            import stripe
            stripe.Subscription.modify(
                subscription['stripe_subscription_id'],
                cancel_at_period_end=True
            )
        
        # Atualiza status no banco
        payment_service.supabase.table('subscriptions').update({
            'status': 'cancelled',
            'cancelled_at': datetime.now().isoformat(),
            'updated_at': datetime.now().isoformat()
        }).eq('id', subscription_id).execute()
        
        log_user_activity(user_id, 'subscription_cancelled', {
            'subscription_id': subscription_id
        })
        
        return jsonify({'message': 'Assinatura cancelada com sucesso'}), 200
        
    except Exception as e:
        log_security_event('subscription_cancellation_error', details={'error': str(e)})
        return jsonify({'error': 'Erro interno do servidor'}), 500