"""
Serviço de Pagamentos RE-EDUCA Store.

Integra múltiplos gateways de pagamento incluindo:
- Stripe (cartão de crédito internacional, PIX)
- PagSeguro (pagamentos Brasil)
- Assinaturas recorrentes
- Webhooks de confirmação
- Controle antifraude
"""
import os
import stripe
import requests
import logging
from typing import Dict, Any, Optional, List
from datetime import datetime, timedelta
from config.database import supabase_client
from decimal import Decimal

logger = logging.getLogger(__name__)

class PaymentService:
    def __init__(self):
        self.supabase = supabase_client
        
        # Configuração Stripe
        stripe.api_key = os.environ.get('STRIPE_SECRET_KEY')
        self.stripe_public_key = os.environ.get('STRIPE_PUBLIC_KEY')
        
        # Configuração PagSeguro
        self.pagseguro_email = os.environ.get('PAGSEGURO_EMAIL')
        self.pagseguro_token = os.environ.get('PAGSEGURO_TOKEN')
        self.pagseguro_sandbox = os.environ.get('PAGSEGURO_SANDBOX', 'true').lower() == 'true'
        
        # URLs PagSeguro
        if self.pagseguro_sandbox:
            self.pagseguro_url = 'https://ws.sandbox.pagseguro.uol.com.br'
        else:
            self.pagseguro_url = 'https://ws.pagseguro.uol.com.br'
    
    # ================================
    # STRIPE
    # ================================
    
    def create_stripe_customer(self, user_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Cria cliente no Stripe.
        
        Args:
            user_data (Dict[str, Any]): Dados do usuário com email, name e id.
            
        Returns:
            Dict[str, Any]: Resultado com success e customer_id ou erro.
        """
        try:
            customer = stripe.Customer.create(
                email=user_data['email'],
                name=user_data['name'],
                metadata={
                    'user_id': user_data['id'],
                    'subscription_plan': user_data.get('subscription_plan', 'free')
                }
            )
            
            return {
                'success': True,
                'customer_id': customer.id,
                'customer': customer
            }
            
        except stripe.error.StripeError as e:
            logger.error(f"Erro ao criar cliente Stripe: {str(e)}")
            return {'success': False, 'error': str(e)}
    
    def create_stripe_payment_intent(self, amount: float, currency: str = 'brl', 
                                   customer_id: str = None, metadata: Dict = None) -> Dict[str, Any]:
        """
        Cria Payment Intent no Stripe para processar pagamento.
        
        Args:
            amount (float): Valor em reais.
            currency (str): Moeda (padrão: 'brl').
            customer_id (str, optional): ID do cliente Stripe.
            metadata (Dict, optional): Metadados adicionais.
            
        Returns:
            Dict[str, Any]: Resultado com client_secret e payment_intent_id ou erro.
        """
        try:
            intent_data = {
                'amount': int(amount * 100),  # Stripe usa centavos
                'currency': currency,
                'automatic_payment_methods': {
                    'enabled': True,
                },
                'metadata': metadata or {}
            }
            
            if customer_id:
                intent_data['customer'] = customer_id
            
            payment_intent = stripe.PaymentIntent.create(**intent_data)
            
            return {
                'success': True,
                'client_secret': payment_intent.client_secret,
                'payment_intent_id': payment_intent.id
            }
            
        except stripe.error.StripeError as e:
            logger.error(f"Erro ao criar Payment Intent: {str(e)}")
            return {'success': False, 'error': str(e)}
    
    def create_stripe_subscription(self, customer_id: str, price_id: str, 
                                 trial_period_days: int = None) -> Dict[str, Any]:
        """Cria assinatura no Stripe"""
        try:
            subscription_data = {
                'customer': customer_id,
                'items': [{'price': price_id}],
                'payment_behavior': 'default_incomplete',
                'payment_settings': {'save_default_payment_method': 'on_subscription'},
                'expand': ['latest_invoice.payment_intent'],
            }
            
            if trial_period_days:
                subscription_data['trial_period_days'] = trial_period_days
            
            subscription = stripe.Subscription.create(**subscription_data)
            
            return {
                'success': True,
                'subscription_id': subscription.id,
                'client_secret': subscription.latest_invoice.payment_intent.client_secret
            }
            
        except stripe.error.StripeError as e:
            logger.error(f"Erro ao criar assinatura Stripe: {str(e)}")
            return {'success': False, 'error': str(e)}
    
    def handle_stripe_webhook(self, payload: str, signature: str) -> Dict[str, Any]:
        """Processa webhook do Stripe"""
        try:
            webhook_secret = os.environ.get('STRIPE_WEBHOOK_SECRET')
            event = stripe.Webhook.construct_event(payload, signature, webhook_secret)
            
            if event['type'] == 'payment_intent.succeeded':
                return self._handle_payment_success(event['data']['object'])
            elif event['type'] == 'payment_intent.payment_failed':
                return self._handle_payment_failed(event['data']['object'])
            elif event['type'] == 'invoice.payment_succeeded':
                return self._handle_subscription_payment(event['data']['object'])
            elif event['type'] == 'customer.subscription.updated':
                return self._handle_subscription_updated(event['data']['object'])
            elif event['type'] == 'customer.subscription.deleted':
                return self._handle_subscription_cancelled(event['data']['object'])
            
            return {'success': True, 'message': 'Evento processado'}
            
        except stripe.error.SignatureVerificationError:
            logger.error("Webhook Stripe: Assinatura inválida")
            return {'success': False, 'error': 'Assinatura inválida'}
        except Exception as e:
            logger.error(f"Erro ao processar webhook Stripe: {str(e)}")
            return {'success': False, 'error': str(e)}
    
    # ================================
    # PAGSEGURO
    # ================================
    
    def create_pagseguro_payment(self, order_data: Dict[str, Any]) -> Dict[str, Any]:
        """Cria pagamento no PagSeguro"""
        try:
            # Dados do pagamento
            payment_data = {
                'email': self.pagseguro_email,
                'token': self.pagseguro_token,
                'currency': 'BRL',
                'reference': order_data['order_id'],
                'notificationURL': f"{os.environ.get('BACKEND_URL')}/api/payments/pagseguro/notification",
                'redirectURL': f"{os.environ.get('FRONTEND_URL')}/payment/success",
            }
            
            # Adiciona itens
            for i, item in enumerate(order_data['items']):
                payment_data[f'itemId{i+1}'] = item['id']
                payment_data[f'itemDescription{i+1}'] = item['name']
                payment_data[f'itemAmount{i+1}'] = f"{item['price']:.2f}"
                payment_data[f'itemQuantity{i+1}'] = item['quantity']
            
            # Dados do comprador
            payment_data['senderName'] = order_data['customer']['name']
            payment_data['senderEmail'] = order_data['customer']['email']
            payment_data['senderPhone'] = order_data['customer']['phone']
            
            # Endereço
            if 'address' in order_data:
                address = order_data['address']
                payment_data['shippingAddressStreet'] = address['street']
                payment_data['shippingAddressNumber'] = address['number']
                payment_data['shippingAddressComplement'] = address.get('complement', '')
                payment_data['shippingAddressDistrict'] = address['district']
                payment_data['shippingAddressPostalCode'] = address['postal_code']
                payment_data['shippingAddressCity'] = address['city']
                payment_data['shippingAddressState'] = address['state']
                payment_data['shippingAddressCountry'] = 'BRA'
            
            # Envia requisição
            response = requests.post(
                f"{self.pagseguro_url}/v2/checkout",
                data=payment_data,
                headers={'Content-Type': 'application/x-www-form-urlencoded'}
            )
            
            if response.status_code == 200:
                # Parse XML response
                import xml.etree.ElementTree as ET
                root = ET.fromstring(response.text)
                
                if root.tag == 'checkout':
                    code = root.find('code').text
                    return {
                        'success': True,
                        'payment_code': code,
                        'payment_url': f"{self.pagseguro_url}/v2/checkout/payment.html?code={code}"
                    }
                else:
                    error = root.find('error').text if root.find('error') is not None else 'Erro desconhecido'
                    return {'success': False, 'error': error}
            else:
                return {'success': False, 'error': f'Erro HTTP: {response.status_code}'}
                
        except Exception as e:
            logger.error(f"Erro ao criar pagamento PagSeguro: {str(e)}")
            return {'success': False, 'error': str(e)}
    
    def handle_pagseguro_notification(self, notification_code: str, notification_type: str) -> Dict[str, Any]:
        """Processa notificação do PagSeguro"""
        try:
            # Busca detalhes da transação
            response = requests.get(
                f"{self.pagseguro_url}/v3/transactions/notifications/{notification_code}",
                params={
                    'email': self.pagseguro_email,
                    'token': self.pagseguro_token
                }
            )
            
            if response.status_code == 200:
                import xml.etree.ElementTree as ET
                root = ET.fromstring(response.text)
                
                transaction_id = root.find('code').text
                status = root.find('status').text
                reference = root.find('reference').text
                
                return self._update_payment_status(reference, status, 'pagseguro', transaction_id)
            else:
                return {'success': False, 'error': f'Erro ao buscar transação: {response.status_code}'}
                
        except Exception as e:
            logger.error(f"Erro ao processar notificação PagSeguro: {str(e)}")
            return {'success': False, 'error': str(e)}
    
    # ================================
    # MÉTODOS AUXILIARES
    # ================================
    
    def _handle_payment_success(self, payment_intent: Dict) -> Dict[str, Any]:
        """Processa pagamento bem-sucedido"""
        try:
            order_id = payment_intent.get('metadata', {}).get('order_id')
            if order_id:
                return self._update_payment_status(order_id, 'completed', 'stripe', payment_intent['id'])
            return {'success': True}
        except Exception as e:
            logger.error(f"Erro ao processar pagamento bem-sucedido: {str(e)}")
            return {'success': False, 'error': str(e)}
    
    def _handle_payment_failed(self, payment_intent: Dict) -> Dict[str, Any]:
        """Processa pagamento falhado"""
        try:
            order_id = payment_intent.get('metadata', {}).get('order_id')
            if order_id:
                return self._update_payment_status(order_id, 'failed', 'stripe', payment_intent['id'])
            return {'success': True}
        except Exception as e:
            logger.error(f"Erro ao processar pagamento falhado: {str(e)}")
            return {'success': False, 'error': str(e)}
    
    def _handle_subscription_payment(self, invoice: Dict) -> Dict[str, Any]:
        """Processa pagamento de assinatura"""
        try:
            subscription_id = invoice['subscription']
            customer_id = invoice['customer']
            
            # Busca dados da assinatura
            subscription = stripe.Subscription.retrieve(subscription_id)
            
            # Atualiza status da assinatura no banco
            self.supabase.table('subscriptions').update({
                'status': subscription['status'],
                'current_period_end': datetime.fromtimestamp(subscription['current_period_end']).isoformat(),
                'updated_at': datetime.now().isoformat()
            }).eq('stripe_subscription_id', subscription_id).execute()
            
            return {'success': True}
        except Exception as e:
            logger.error(f"Erro ao processar pagamento de assinatura: {str(e)}")
            return {'success': False, 'error': str(e)}
    
    def _handle_subscription_updated(self, subscription: Dict) -> Dict[str, Any]:
        """Processa atualização de assinatura"""
        try:
            subscription_id = subscription['id']
            status = subscription['status']
            
            # Atualiza status no banco
            self.supabase.table('subscriptions').update({
                'status': status,
                'updated_at': datetime.now().isoformat()
            }).eq('stripe_subscription_id', subscription_id).execute()
            
            return {'success': True}
        except Exception as e:
            logger.error(f"Erro ao atualizar assinatura: {str(e)}")
            return {'success': False, 'error': str(e)}
    
    def _handle_subscription_cancelled(self, subscription: Dict) -> Dict[str, Any]:
        """Processa cancelamento de assinatura"""
        try:
            subscription_id = subscription['id']
            
            # Atualiza status no banco
            self.supabase.table('subscriptions').update({
                'status': 'cancelled',
                'cancelled_at': datetime.now().isoformat(),
                'updated_at': datetime.now().isoformat()
            }).eq('stripe_subscription_id', subscription_id).execute()
            
            return {'success': True}
        except Exception as e:
            logger.error(f"Erro ao cancelar assinatura: {str(e)}")
            return {'success': False, 'error': str(e)}
    
    def _update_payment_status(self, order_id: str, status: str, provider: str, transaction_id: str) -> Dict[str, Any]:
        """Atualiza status do pagamento no banco"""
        try:
            # Mapeia status
            status_map = {
                'completed': 'paid',
                'failed': 'failed',
                'pending': 'pending',
                '3': 'paid',  # PagSeguro: Paga
                '4': 'paid',  # PagSeguro: Disponível
                '5': 'failed',  # PagSeguro: Em disputa
                '6': 'failed',  # PagSeguro: Devolvida
                '7': 'failed',  # PagSeguro: Cancelada
            }
            
            db_status = status_map.get(status, 'pending')
            
            # Atualiza pedido
            self.supabase.table('orders').update({
                'payment_status': db_status,
                'payment_provider': provider,
                'payment_transaction_id': transaction_id,
                'updated_at': datetime.now().isoformat()
            }).eq('id', order_id).execute()
            
            # Se pago, atualiza status do pedido
            if db_status == 'paid':
                self.supabase.table('orders').update({
                    'status': 'processing',
                    'paid_at': datetime.now().isoformat()
                }).eq('id', order_id).execute()
            
            return {'success': True}
        except Exception as e:
            logger.error(f"Erro ao atualizar status do pagamento: {str(e)}")
            return {'success': False, 'error': str(e)}
    
    def get_payment_methods(self) -> Dict[str, Any]:
        """Retorna métodos de pagamento disponíveis"""
        return {
            'stripe': {
                'enabled': bool(stripe.api_key),
                'public_key': self.stripe_public_key,
                'methods': ['card', 'pix', 'boleto']
            },
            'pagseguro': {
                'enabled': bool(self.pagseguro_token),
                'methods': ['card', 'pix', 'boleto', 'debit']
            }
        }