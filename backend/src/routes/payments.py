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
from utils.exception_strategies import handle_route_exceptions
from exceptions.custom_exceptions import ValidationError, NotFoundError, InternalServerError
from utils.validation_decorators import validate_payment_request, validate_positive_numbers
from utils.idempotency_decorators import webhook_idempotent, idempotent_endpoint
from middleware.logging import log_user_activity, log_security_event
import logging

logger = logging.getLogger(__name__)

payments_bp = Blueprint('payments', __name__)
payment_service = PaymentService()

@payments_bp.route('/methods', methods=['GET'])
@handle_route_exceptions
def get_payment_methods():
    """
    Retorna métodos de pagamento disponíveis.
    
    Implementa tratamento robusto de exceções e validação de dados.

    Returns:
        JSON: Lista de métodos de pagamento suportados.
    """
    methods = payment_service.get_payment_methods()
    return jsonify(methods), 200

@payments_bp.route('/stripe/create-payment-intent', methods=['POST'])
@token_required
@rate_limit("10 per minute")
@validate_json('amount', 'currency')
@validate_positive_numbers(amount=False)
@handle_route_exceptions
def create_stripe_payment_intent():
    """
    Cria Payment Intent no Stripe.
    
    Implementa tratamento robusto de exceções e validação de dados.

    Request Body:
        amount (int): Valor em centavos (validado automaticamente).
        currency (str): Moeda (padrão: 'brl').
        order_id (str, optional): ID do pedido relacionado.

    Returns:
        JSON: Payment Intent com client_secret para processamento.
    """
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
        raise ValidationError(customer_result.get('error', 'Erro ao criar cliente Stripe'))

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

    if not intent_result.get('success'):
        raise ValidationError(intent_result.get('error', 'Erro ao criar Payment Intent'))

    log_user_activity(user['id'], 'payment_intent_created', {
        'amount': data['amount'],
        'currency': data.get('currency', 'brl'),
        'provider': 'stripe'
    })
    return jsonify(intent_result), 200

@payments_bp.route('/webhooks/stripe', methods=['POST'])
@webhook_idempotent(event_id_field='id', ttl=604800)
@handle_route_exceptions
def stripe_webhook():
    """
    Webhook para eventos do Stripe (IDEMPOTENTE).
    
    Implementa tratamento robusto de exceções e validação de dados.

    Processa eventos assíncronos do Stripe como:
    - payment_intent.succeeded
    - payment_intent.payment_failed
    - charge.succeeded
    - charge.failed
    - subscription.updated
    - subscription.deleted

    IMPORTANTE: Esta rota NÃO requer autenticação (Stripe chama diretamente).
    Validação via assinatura Stripe (webhook secret).
    Idempotência garante que eventos duplicados são ignorados automaticamente (TTL: 7 dias).
    """
    payload = request.get_data(as_text=True)
    sig_header = request.headers.get('Stripe-Signature')

    # Verifica webhook secret
    webhook_secret = os.environ.get('STRIPE_WEBHOOK_SECRET')
    if not webhook_secret:
        logger.warning("STRIPE_WEBHOOK_SECRET não configurado")
        raise ValidationError('Webhook não configurado')

    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, webhook_secret
        )
    except ValueError:
        logger.error("Payload inválido do Stripe")
        raise ValidationError('Payload inválido')
    except stripe.error.SignatureVerificationError:
        logger.error("Assinatura inválida do Stripe")
        raise ValidationError('Assinatura inválida')

    # Processa evento
    event_type = event['type']
    event_data = event['data']['object']
    event_id = event.get('id')  # ID do evento para idempotência

    # Passa event_id para verificação adicional de idempotência
    # O service já registra o webhook como processado internamente
    result = payment_service.handle_stripe_webhook_event(event_type, event_data, event_id)

    if not result.get('success'):
        raise InternalServerError(result.get('error', 'Erro ao processar webhook'))

    return jsonify({'received': True}), 200

@payments_bp.route('/stripe/create-subscription', methods=['POST'])
@token_required
@rate_limit("5 per minute")
@validate_json('price_id')
@handle_route_exceptions
def create_stripe_subscription():
    """
    Cria assinatura no Stripe.
    
    Implementa tratamento robusto de exceções e validação de dados.

    Request Body:
        price_id (str): ID do preço da assinatura no Stripe.
        trial_period_days (int, optional): Dias de período trial.

    Returns:
        JSON: Assinatura criada com status e detalhes.
    """
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
        raise ValidationError(customer_result.get('error', 'Erro ao criar cliente Stripe'))

    # Cria assinatura
    subscription_result = payment_service.create_stripe_subscription(
        customer_id=customer_result['customer_id'],
        price_id=data['price_id'],
        trial_period_days=data.get('trial_period_days')
    )

    if not subscription_result.get('success'):
        raise ValidationError(subscription_result.get('error', 'Erro ao criar assinatura'))

    log_user_activity(user['id'], 'subscription_created', {
        'price_id': data['price_id'],
        'provider': 'stripe'
    })
    return jsonify(subscription_result), 200

# Webhook Stripe duplicado removido - usar /webhooks/stripe (linha 106)

@payments_bp.route('/pagseguro/create-payment', methods=['POST'])
@token_required
@rate_limit("10 per minute")
@validate_json('order_id', 'items', 'customer')
@handle_route_exceptions
def create_pagseguro_payment():
    """
    Cria pagamento no PagSeguro.
    
    Implementa tratamento robusto de exceções e validação de dados.
    """
    user = request.current_user
    data = request.get_json()

    # Utiliza OrderService para acesso a dados seguindo o padrão de arquitetura
    from services.order_service import OrderService
    order_service = OrderService()
    order = order_service.get_order(data['order_id'], user['id'])

    if not order:
        raise NotFoundError('Pedido não encontrado')

    # Prepara dados do pagamento
    payment_data = {
        'order_id': order['id'],
        'items': data['items'],
        'customer': data['customer'],
        'address': data.get('address')
    }

    result = payment_service.create_pagseguro_payment(payment_data)

    if not result.get('success'):
        raise ValidationError(result.get('error', 'Erro ao criar pagamento PagSeguro'))

    log_user_activity(user['id'], 'pagseguro_payment_created', {
        'order_id': data['order_id'],
        'provider': 'pagseguro'
    })
    return jsonify(result), 200

@payments_bp.route('/pagseguro/notification', methods=['POST'])
@webhook_idempotent(event_id_field='notificationCode', ttl=604800)
@handle_route_exceptions
def pagseguro_notification():
    """
    Notificação do PagSeguro (IDEMPOTENTE).
    
    Implementa tratamento robusto de exceções e validação de dados.
    Idempotência garante que notificações duplicadas são ignoradas automaticamente (TTL: 7 dias).
    """
    notification_code = request.form.get('notificationCode')
    notification_type = request.form.get('notificationType')

    if not notification_code:
        raise ValidationError('Código de notificação não fornecido')

    result = payment_service.handle_pagseguro_notification(notification_code, notification_type)

    if not result.get('success'):
        raise ValidationError(result.get('error', 'Erro ao processar notificação PagSeguro'))

    return jsonify({'status': 'success'}), 200

@payments_bp.route('/pagseguro/status/<transaction_id>', methods=['GET'])
@handle_route_exceptions
def get_pagseguro_status(transaction_id):
    """
    Busca status de transação no PagSeguro.
    
    Implementa tratamento robusto de exceções e validação de dados.
    """
    if not transaction_id:
        raise ValidationError("transaction_id é obrigatório")
    
    result = payment_service.handle_pagseguro_notification(transaction_id, 'transaction')

    if not result.get('success'):
        raise NotFoundError(result.get('error', 'Transação não encontrada ou erro ao buscar status'))

    return jsonify(result), 200

@payments_bp.route('/history', methods=['GET'])
@token_required
@handle_route_exceptions
def get_payment_history():
    """
    Retorna histórico de pagamentos do usuário.
    
    Implementa tratamento robusto de exceções e validação de dados.
    """
    user_id = request.current_user['id']
    
    try:
        page = int(request.args.get('page', 1))
        if page < 1:
            raise ValidationError("page deve ser maior que 0")
    except (ValueError, TypeError):
        raise ValidationError("page deve ser um número válido")
    
    try:
        per_page = min(int(request.args.get('per_page', 20)), 100)
        if per_page < 1 or per_page > 100:
            raise ValidationError("per_page deve estar entre 1 e 100")
    except (ValueError, TypeError):
        raise ValidationError("per_page deve ser um número válido")

    # Utiliza OrderService para acesso a dados seguindo o padrão de arquitetura
    from services.order_service import OrderService
    order_service = OrderService()
    orders_result = order_service.get_user_orders(user_id, page, per_page)

    return jsonify({
        'payments': orders_result.get('orders', []),
        'page': page,
        'per_page': per_page,
        'total': orders_result.get('pagination', {}).get('total', 0)
    }), 200

@payments_bp.route('/subscriptions', methods=['GET'])
@token_required
@handle_route_exceptions
def get_user_subscriptions():
    """
    Retorna assinaturas do usuário.
    
    Implementa tratamento robusto de exceções e validação de dados.
    """
    user_id = request.current_user['id']

    # Utiliza SubscriptionService para operações padronizadas
    from services.subscription_service import SubscriptionService
    subscription_service = SubscriptionService()
    subscriptions = subscription_service.get_user_subscriptions(user_id)

    return jsonify({
        'subscriptions': subscriptions
    }), 200

@payments_bp.route('/subscriptions/<subscription_id>/cancel', methods=['POST'])
@token_required
@rate_limit("3 per minute")
@handle_route_exceptions
def cancel_subscription(subscription_id):
    """
    Cancela assinatura.
    
    Implementa tratamento robusto de exceções e validação de dados.
    """
    if not subscription_id:
        raise ValidationError("subscription_id é obrigatório")
    
    user_id = request.current_user['id']

    # Utiliza SubscriptionService para operações padronizadas
    from services.subscription_service import SubscriptionService
    subscription_service = SubscriptionService()

    # Busca assinatura para obter stripe_subscription_id se necessário
    subscription = subscription_service.get_subscription(subscription_id, user_id)
    if not subscription:
        raise NotFoundError('Assinatura não encontrada')

    # Cancela via service (que cancela no Stripe e no banco)
    result = subscription_service.cancel_subscription(
        subscription_id=subscription_id,
        user_id=user_id,
        stripe_subscription_id=subscription.get('stripe_subscription_id')
    )

    if not result.get('success'):
        raise ValidationError(result.get('error', 'Erro ao cancelar assinatura'))

    log_user_activity(user_id, 'subscription_cancelled', {
        'subscription_id': subscription_id
    })
    return jsonify({'message': 'Assinatura cancelada com sucesso'}), 200
og_user_activity(user_id, 'subscription_cancelled', {
        'subscription_id': subscription_id
    })
    return jsonify({'message': 'Assinatura cancelada com sucesso'}), 200
