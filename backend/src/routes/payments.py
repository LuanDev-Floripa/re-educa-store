"""
Rotas de Pagamentos RE-EDUCA Store.

Gerencia pagamentos via múltiplos métodos incluindo:
- Stripe (cartão de crédito, PIX)
- PayPal
- Assinaturas recorrentes
- Webhooks de confirmação
"""
import os
import stripe
from flask import Blueprint, request, jsonify
from services.payment_service import PaymentService
from utils.decorators import token_required, validate_json
from utils.rate_limit_helper import rate_limit
from middleware.logging import log_user_activity, log_security_event
import logging

logger = logging.getLogger(__name__)

payments_bp = Blueprint('payments', __name__)
payment_service = PaymentService()

@payments_bp.route('/methods', methods=['GET'])
def get_payment_methods():
    """
    Retorna métodos de pagamento disponíveis.

    Returns:
        JSON: Lista de métodos de pagamento suportados.
    """
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
    """
    Cria Payment Intent no Stripe.

    Request Body:
        amount (int): Valor em centavos.
        currency (str): Moeda (padrão: 'brl').
        order_id (str, optional): ID do pedido relacionado.

    Returns:
        JSON: Payment Intent com client_secret para processamento.
    """
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

@payments_bp.route('/webhooks/stripe', methods=['POST'])
def stripe_webhook():
    """
    Webhook para eventos do Stripe.

    Processa eventos assíncronos do Stripe como:
    - payment_intent.succeeded
    - payment_intent.payment_failed
    - charge.succeeded
    - charge.failed
    - subscription.updated
    - subscription.deleted

    IMPORTANTE: Esta rota NÃO requer autenticação (Stripe chama diretamente).
    Validação via assinatura Stripe (webhook secret).
    """
    try:
        payload = request.get_data(as_text=True)
        sig_header = request.headers.get('Stripe-Signature')

        # Verifica webhook secret
        webhook_secret = os.environ.get('STRIPE_WEBHOOK_SECRET')
        if not webhook_secret:
            logger.warning("STRIPE_WEBHOOK_SECRET não configurado")
            return jsonify({'error': 'Webhook não configurado'}), 400

        try:
            event = stripe.Webhook.construct_event(
                payload, sig_header, webhook_secret
            )
        except ValueError:
            logger.error("Payload inválido do Stripe")
            return jsonify({'error': 'Payload inválido'}), 400
        except stripe.error.SignatureVerificationError:
            logger.error("Assinatura inválida do Stripe")
            return jsonify({'error': 'Assinatura inválida'}), 400

        # Processa evento
        event_type = event['type']
        event_data = event['data']['object']

        result = payment_service.handle_stripe_webhook_event(event_type, event_data)

        if result.get('success'):
            return jsonify({'received': True}), 200
        else:
            logger.error(f"Erro ao processar webhook: {result.get('error')}")
            return jsonify({'error': result.get('error')}), 500

    except Exception as e:
        logger.error(f"Erro no webhook Stripe: {str(e)}", exc_info=True)
        return jsonify({'error': 'Erro interno'}), 500

@payments_bp.route('/stripe/create-subscription', methods=['POST'])
@token_required
@rate_limit("5 per minute")
@validate_json('price_id')
def create_stripe_subscription():
    """
    Cria assinatura no Stripe.

    Request Body:
        price_id (str): ID do preço da assinatura no Stripe.
        trial_period_days (int, optional): Dias de período trial.

    Returns:
        JSON: Assinatura criada com status e detalhes.
    """
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

# Webhook Stripe duplicado removido - usar /webhooks/stripe (linha 106)

@payments_bp.route('/pagseguro/create-payment', methods=['POST'])
@token_required
@rate_limit("10 per minute")
@validate_json('order_id', 'items', 'customer')
def create_pagseguro_payment():
    """Cria pagamento no PagSeguro"""
    try:
        user = request.current_user
        data = request.get_json()

        # ✅ CORRIGIDO: Usa OrderService em vez de query direta
        from services.order_service import OrderService
        order_service = OrderService()
        order = order_service.get_order(data['order_id'], user['id'])

        if not order:
            return jsonify({'error': 'Pedido não encontrado'}), 404

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

        # ✅ CORRIGIDO: Usa OrderService em vez de query direta
        from services.order_service import OrderService
        order_service = OrderService()
        orders_result = order_service.get_user_orders(user_id, page, per_page)

        return jsonify({
            'payments': orders_result.get('orders', []),
            'page': page,
            'per_page': per_page,
            'total': orders_result.get('pagination', {}).get('total', 0)
        }), 200

    except Exception as e:
        return jsonify({'error': 'Erro interno do servidor'}), 500

@payments_bp.route('/subscriptions', methods=['GET'])
@token_required
def get_user_subscriptions():
    """Retorna assinaturas do usuário"""
    try:
        user_id = request.current_user['id']

        # ✅ CORRIGIDO: Usa SubscriptionService em vez de query direta
        from services.subscription_service import SubscriptionService
        subscription_service = SubscriptionService()
        subscriptions = subscription_service.get_user_subscriptions(user_id)

        return jsonify({
            'subscriptions': subscriptions
        }), 200

    except Exception as e:
        logger.error(f"Erro ao buscar assinaturas: {str(e)}")
        return jsonify({'error': 'Erro interno do servidor'}), 500

@payments_bp.route('/subscriptions/<subscription_id>/cancel', methods=['POST'])
@token_required
@rate_limit("3 per minute")
def cancel_subscription(subscription_id):
    """Cancela assinatura"""
    try:
        user_id = request.current_user['id']

        # ✅ CORRIGIDO: Usa SubscriptionService em vez de queries diretas
        from services.subscription_service import SubscriptionService
        subscription_service = SubscriptionService()

        # Busca assinatura para obter stripe_subscription_id se necessário
        subscription = subscription_service.get_subscription(subscription_id, user_id)
        if not subscription:
            return jsonify({'error': 'Assinatura não encontrada'}), 404

        # Cancela via service (que cancela no Stripe e no banco)
        result = subscription_service.cancel_subscription(
            subscription_id=subscription_id,
            user_id=user_id,
            stripe_subscription_id=subscription.get('stripe_subscription_id')
        )

        if result.get('success'):
            log_user_activity(user_id, 'subscription_cancelled', {
                'subscription_id': subscription_id
            })
            return jsonify({'message': 'Assinatura cancelada com sucesso'}), 200
        else:
            return jsonify({'error': result.get('error', 'Erro ao cancelar assinatura')}), 400

    except Exception as e:
        logger.error(f"Erro ao cancelar assinatura: {str(e)}")
        log_security_event('subscription_cancellation_error', details={'error': str(e)})
        return jsonify({'error': 'Erro interno do servidor'}), 500
