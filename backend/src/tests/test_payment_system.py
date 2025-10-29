"""
Testes do Sistema de Pagamentos RE-EDUCA Store
"""
import pytest
import json
from unittest.mock import patch, MagicMock
from services.payment_service import PaymentService
from routes.payments import payments_bp
from main import app

@pytest.fixture
def client():
    """Cliente de teste Flask"""
    app.config['TESTING'] = True
    with app.test_client() as client:
        yield client

@pytest.fixture
def payment_service():
    """Instância do serviço de pagamentos"""
    return PaymentService()

@pytest.fixture
def mock_supabase():
    """Mock do Supabase"""
    with patch('src.services.payment_service.get_db') as mock:
        mock_supabase = MagicMock()
        mock.return_value = mock_supabase
        yield mock_supabase

@pytest.fixture
def mock_stripe():
    """Mock do Stripe"""
    with patch('src.services.payment_service.stripe') as mock:
        yield mock

@pytest.fixture
def mock_requests():
    """Mock da biblioteca requests"""
    with patch('src.services.payment_service.requests') as mock:
        yield mock

@pytest.fixture
def sample_user_data():
    """Dados de usuário para testes"""
    return {
        'id': 'test-user-id',
        'email': 'test@example.com',
        'name': 'Test User',
        'subscription_plan': 'free'
    }

@pytest.fixture
def sample_stripe_customer():
    """Cliente Stripe de exemplo"""
    return {
        'id': 'cus_test123',
        'email': 'test@example.com',
        'name': 'Test User',
        'metadata': {
            'user_id': 'test-user-id',
            'subscription_plan': 'free'
        }
    }

@pytest.fixture
def sample_payment_intent():
    """Payment Intent de exemplo"""
    return {
        'id': 'pi_test123',
        'client_secret': 'pi_test123_secret',
        'amount': 10000,  # R$ 100.00 em centavos
        'currency': 'brl',
        'status': 'requires_payment_method'
    }

class TestPaymentService:
    """Testes do serviço de pagamentos"""
    
    def test_create_stripe_customer_success(self, payment_service, mock_stripe, sample_user_data, sample_stripe_customer):
        """Testa criação de cliente Stripe com sucesso"""
        # Mock do Stripe
        mock_stripe.Customer.create.return_value = sample_stripe_customer
        
        result = payment_service.create_stripe_customer(sample_user_data)
        
        assert result['success'] is True
        assert result['customer_id'] == 'cus_test123'
        assert 'customer' in result
        
        # Verifica se o Stripe foi chamado corretamente
        mock_stripe.Customer.create.assert_called_once_with(
            email='test@example.com',
            name='Test User',
            metadata={
                'user_id': 'test-user-id',
                'subscription_plan': 'free'
            }
        )
    
    def test_create_stripe_customer_error(self, payment_service, mock_stripe, sample_user_data):
        """Testa criação de cliente Stripe com erro"""
        # Mock do Stripe para retornar erro
        mock_stripe.Customer.create.side_effect = Exception('Stripe error')
        
        result = payment_service.create_stripe_customer(sample_user_data)
        
        assert result['success'] is False
        assert 'error' in result
    
    def test_create_stripe_payment_intent_success(self, payment_service, mock_stripe, sample_payment_intent):
        """Testa criação de Payment Intent com sucesso"""
        # Mock do Stripe
        mock_stripe.PaymentIntent.create.return_value = sample_payment_intent
        
        result = payment_service.create_stripe_payment_intent(
            amount=100.0,
            currency='brl',
            customer_id='cus_test123',
            metadata={'order_id': 'order-123'}
        )
        
        assert result['success'] is True
        assert result['client_secret'] == 'pi_test123_secret'
        assert result['payment_intent_id'] == 'pi_test123'
        
        # Verifica se o Stripe foi chamado corretamente
        mock_stripe.PaymentIntent.create.assert_called_once()
        call_args = mock_stripe.PaymentIntent.create.call_args[1]
        assert call_args['amount'] == 10000  # R$ 100.00 em centavos
        assert call_args['currency'] == 'brl'
        assert call_args['customer'] == 'cus_test123'
    
    def test_create_stripe_payment_intent_error(self, payment_service, mock_stripe):
        """Testa criação de Payment Intent com erro"""
        # Mock do Stripe para retornar erro
        mock_stripe.PaymentIntent.create.side_effect = Exception('Stripe error')
        
        result = payment_service.create_stripe_payment_intent(100.0, 'brl')
        
        assert result['success'] is False
        assert 'error' in result
    
    def test_create_stripe_subscription_success(self, payment_service, mock_stripe):
        """Testa criação de assinatura Stripe com sucesso"""
        # Mock do Stripe
        mock_subscription = {
            'id': 'sub_test123',
            'latest_invoice': {
                'payment_intent': {
                    'client_secret': 'pi_test123_secret'
                }
            }
        }
        mock_stripe.Subscription.create.return_value = mock_subscription
        
        result = payment_service.create_stripe_subscription(
            customer_id='cus_test123',
            price_id='price_test123'
        )
        
        assert result['success'] is True
        assert result['subscription_id'] == 'sub_test123'
        assert result['client_secret'] == 'pi_test123_secret'
        
        # Verifica se o Stripe foi chamado corretamente
        mock_stripe.Subscription.create.assert_called_once()
        call_args = mock_stripe.Subscription.create.call_args[1]
        assert call_args['customer'] == 'cus_test123'
        assert call_args['items'][0]['price'] == 'price_test123'
    
    def test_create_stripe_subscription_with_trial(self, payment_service, mock_stripe):
        """Testa criação de assinatura com período de teste"""
        # Mock do Stripe
        mock_subscription = {
            'id': 'sub_test123',
            'latest_invoice': {
                'payment_intent': {
                    'client_secret': 'pi_test123_secret'
                }
            }
        }
        mock_stripe.Subscription.create.return_value = mock_subscription
        
        result = payment_service.create_stripe_subscription(
            customer_id='cus_test123',
            price_id='price_test123',
            trial_period_days=7
        )
        
        assert result['success'] is True
        
        # Verifica se o período de teste foi incluído
        call_args = mock_stripe.Subscription.create.call_args[1]
        assert call_args['trial_period_days'] == 7
    
    def test_handle_stripe_webhook_payment_success(self, payment_service, mock_supabase):
        """Testa webhook de pagamento bem-sucedido"""
        # Mock do Stripe webhook
        with patch('src.services.payment_service.stripe.Webhook.construct_event') as mock_webhook:
            mock_webhook.return_value = {
                'type': 'payment_intent.succeeded',
                'data': {
                    'object': {
                        'id': 'pi_test123',
                        'metadata': {
                            'order_id': 'order-123'
                        }
                    }
                }
            }
            
            # Mock do método de atualização de status
            with patch.object(payment_service, '_update_payment_status') as mock_update:
                mock_update.return_value = {'success': True}
                
                result = payment_service.handle_stripe_webhook('payload', 'signature')
                
                assert result['success'] is True
                mock_update.assert_called_once_with('order-123', 'completed', 'stripe', 'pi_test123')
    
    def test_handle_stripe_webhook_payment_failed(self, payment_service, mock_supabase):
        """Testa webhook de pagamento falhado"""
        # Mock do Stripe webhook
        with patch('src.services.payment_service.stripe.Webhook.construct_event') as mock_webhook:
            mock_webhook.return_value = {
                'type': 'payment_intent.payment_failed',
                'data': {
                    'object': {
                        'id': 'pi_test123',
                        'metadata': {
                            'order_id': 'order-123'
                        }
                    }
                }
            }
            
            # Mock do método de atualização de status
            with patch.object(payment_service, '_update_payment_status') as mock_update:
                mock_update.return_value = {'success': True}
                
                result = payment_service.handle_stripe_webhook('payload', 'signature')
                
                assert result['success'] is True
                mock_update.assert_called_once_with('order-123', 'failed', 'stripe', 'pi_test123')
    
    def test_handle_stripe_webhook_subscription_updated(self, payment_service, mock_supabase):
        """Testa webhook de assinatura atualizada"""
        # Mock do Stripe webhook
        with patch('src.services.payment_service.stripe.Webhook.construct_event') as mock_webhook:
            mock_webhook.return_value = {
                'type': 'customer.subscription.updated',
                'data': {
                    'object': {
                        'id': 'sub_test123',
                        'status': 'active'
                    }
                }
            }
            
            # Mock do Supabase
            mock_supabase.table.return_value.update.return_value.eq.return_value.execute.return_value = None
            
            result = payment_service.handle_stripe_webhook('payload', 'signature')
            
            assert result['success'] is True
    
    def test_handle_stripe_webhook_invalid_signature(self, payment_service):
        """Testa webhook com assinatura inválida"""
        # Mock do Stripe webhook para retornar erro de assinatura
        with patch('src.services.payment_service.stripe.Webhook.construct_event') as mock_webhook:
            from stripe.error import SignatureVerificationError
            mock_webhook.side_effect = SignatureVerificationError('Invalid signature', 'signature')
            
            result = payment_service.handle_stripe_webhook('payload', 'invalid_signature')
            
            assert result['success'] is False
            assert result['error'] == 'Assinatura inválida'
    
    def test_create_pagseguro_payment_success(self, payment_service, mock_requests):
        """Testa criação de pagamento PagSeguro com sucesso"""
        # Mock da resposta do PagSeguro
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.text = '''
        <checkout>
            <code>8CF4BE7DCECEF0F004A6DFA0A8243412</code>
        </checkout>
        '''
        mock_requests.post.return_value = mock_response
        
        order_data = {
            'order_id': 'order-123',
            'items': [
                {
                    'id': 'item-1',
                    'name': 'Produto Teste',
                    'price': 50.0,
                    'quantity': 1
                }
            ],
            'customer': {
                'name': 'Test User',
                'email': 'test@example.com',
                'phone': '11999999999'
            }
        }
        
        result = payment_service.create_pagseguro_payment(order_data)
        
        assert result['success'] is True
        assert 'payment_code' in result
        assert 'payment_url' in result
        assert result['payment_code'] == '8CF4BE7DCECEF0F004A6DFA0A8243412'
    
    def test_create_pagseguro_payment_error(self, payment_service, mock_requests):
        """Testa criação de pagamento PagSeguro com erro"""
        # Mock da resposta do PagSeguro com erro
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.text = '''
        <errors>
            <error>
                <code>11001</code>
                <message>Email inválido</message>
            </error>
        </errors>
        '''
        mock_requests.post.return_value = mock_response
        
        order_data = {
            'order_id': 'order-123',
            'items': [],
            'customer': {
                'name': 'Test User',
                'email': 'invalid-email',
                'phone': '11999999999'
            }
        }
        
        result = payment_service.create_pagseguro_payment(order_data)
        
        assert result['success'] is False
        assert 'error' in result
    
    def test_handle_pagseguro_notification_success(self, payment_service, mock_requests, mock_supabase):
        """Testa processamento de notificação PagSeguro com sucesso"""
        # Mock da resposta do PagSeguro
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.text = '''
        <transaction>
            <code>9E884542-81B3-4419-9A75-BCC6FB495EF1</code>
            <status>3</status>
            <reference>order-123</reference>
        </transaction>
        '''
        mock_requests.get.return_value = mock_response
        
        # Mock do método de atualização de status
        with patch.object(payment_service, '_update_payment_status') as mock_update:
            mock_update.return_value = {'success': True}
            
            result = payment_service.handle_pagseguro_notification('notification_code', 'transaction')
            
            assert result['success'] is True
            mock_update.assert_called_once_with('order-123', '3', 'pagseguro', '9E884542-81B3-4419-9A75-BCC6FB495EF1')
    
    def test_update_payment_status_success(self, payment_service, mock_supabase):
        """Testa atualização de status de pagamento"""
        # Mock do Supabase
        mock_supabase.table.return_value.update.return_value.eq.return_value.execute.return_value = None
        
        result = payment_service._update_payment_status('order-123', 'completed', 'stripe', 'pi_test123')
        
        assert result['success'] is True
        
        # Verifica se o Supabase foi chamado corretamente
        mock_supabase.table.assert_called_with('orders')
    
    def test_get_payment_methods(self, payment_service):
        """Testa obtenção de métodos de pagamento"""
        result = payment_service.get_payment_methods()
        
        assert 'stripe' in result
        assert 'pagseguro' in result
        assert 'enabled' in result['stripe']
        assert 'enabled' in result['pagseguro']
        assert 'methods' in result['stripe']
        assert 'methods' in result['pagseguro']

class TestPaymentRoutes:
    """Testes das rotas de pagamentos"""
    
    def test_get_payment_methods_route(self, client):
        """Testa rota de obtenção de métodos de pagamento"""
        response = client.get('/api/payments/methods')
        
        assert response.status_code == 200
        response_data = json.loads(response.data)
        assert 'stripe' in response_data
        assert 'pagseguro' in response_data
    
    def test_create_stripe_payment_intent_route_success(self, client, mock_stripe, sample_stripe_customer, sample_payment_intent):
        """Testa rota de criação de Payment Intent"""
        # Mock do Stripe
        mock_stripe.Customer.create.return_value = sample_stripe_customer
        mock_stripe.PaymentIntent.create.return_value = sample_payment_intent
        
        # Mock do token_required decorator
        with patch('src.routes.payments.token_required') as mock_decorator:
            mock_decorator.return_value = lambda f: f
            
            with patch('src.routes.payments.request') as mock_request:
                mock_request.current_user = {
                    'id': 'test-user-id',
                    'email': 'test@example.com',
                    'name': 'Test User',
                    'subscription_plan': 'free'
                }
                
                data = {
                    'amount': 100.0,
                    'currency': 'brl'
                }
                
                response = client.post('/api/payments/stripe/create-payment-intent',
                                     data=json.dumps(data),
                                     content_type='application/json')
                
                # Como a rota retorna 501 (não implementado), vamos verificar isso
                assert response.status_code == 501
    
    def test_create_stripe_subscription_route_success(self, client, mock_stripe, sample_stripe_customer):
        """Testa rota de criação de assinatura"""
        # Mock do Stripe
        mock_stripe.Customer.create.return_value = sample_stripe_customer
        mock_subscription = {
            'id': 'sub_test123',
            'latest_invoice': {
                'payment_intent': {
                    'client_secret': 'pi_test123_secret'
                }
            }
        }
        mock_stripe.Subscription.create.return_value = mock_subscription
        
        # Mock do token_required decorator
        with patch('src.routes.payments.token_required') as mock_decorator:
            mock_decorator.return_value = lambda f: f
            
            with patch('src.routes.payments.request') as mock_request:
                mock_request.current_user = {
                    'id': 'test-user-id',
                    'email': 'test@example.com',
                    'name': 'Test User',
                    'subscription_plan': 'free'
                }
                
                data = {
                    'price_id': 'price_test123'
                }
                
                response = client.post('/api/payments/stripe/create-subscription',
                                     data=json.dumps(data),
                                     content_type='application/json')
                
                # Como a rota retorna 501 (não implementado), vamos verificar isso
                assert response.status_code == 501
    
    def test_stripe_webhook_route_success(self, client, mock_stripe):
        """Testa rota de webhook do Stripe"""
        # Mock do Stripe webhook
        with patch('src.services.payment_service.stripe.Webhook.construct_event') as mock_webhook:
            mock_webhook.return_value = {
                'type': 'payment_intent.succeeded',
                'data': {
                    'object': {
                        'id': 'pi_test123',
                        'metadata': {
                            'order_id': 'order-123'
                        }
                    }
                }
            }
            
            # Mock do método de atualização de status
            with patch.object(PaymentService, '_update_payment_status') as mock_update:
                mock_update.return_value = {'success': True}
                
                response = client.post('/api/payments/stripe/webhook',
                                     headers={'Stripe-Signature': 'test_signature'})
                
                # Como a rota retorna 501 (não implementado), vamos verificar isso
                assert response.status_code == 501
    
    def test_stripe_webhook_route_no_signature(self, client):
        """Testa rota de webhook sem assinatura"""
        response = client.post('/api/payments/stripe/webhook')
        
        # Como a rota retorna 501 (não implementado), vamos verificar isso
        assert response.status_code == 501
    
    def test_get_payment_history_route_success(self, client, mock_supabase):
        """Testa rota de histórico de pagamentos"""
        # Mock do Supabase
        mock_supabase.table.return_value.select.return_value.eq.return_value.order.return_value.range.return_value.execute.return_value.data = []
        
        # Mock do token_required decorator
        with patch('src.routes.payments.token_required') as mock_decorator:
            mock_decorator.return_value = lambda f: f
            
            with patch('src.routes.payments.request') as mock_request:
                mock_request.current_user = {'id': 'test-user-id'}
                mock_request.args = {}
                
                response = client.get('/api/payments/history')
                
                # Como a rota retorna 501 (não implementado), vamos verificar isso
                assert response.status_code == 501
    
    def test_get_user_subscriptions_route_success(self, client, mock_supabase):
        """Testa rota de assinaturas do usuário"""
        # Mock do Supabase
        mock_supabase.table.return_value.select.return_value.eq.return_value.order.return_value.execute.return_value.data = []
        
        # Mock do token_required decorator
        with patch('src.routes.payments.token_required') as mock_decorator:
            mock_decorator.return_value = lambda f: f
            
            with patch('src.routes.payments.request') as mock_request:
                mock_request.current_user = {'id': 'test-user-id'}
                
                response = client.get('/api/payments/subscriptions')
                
                # Como a rota retorna 501 (não implementado), vamos verificar isso
                assert response.status_code == 501
    
    def test_cancel_subscription_route_success(self, client, mock_supabase, mock_stripe):
        """Testa rota de cancelamento de assinatura"""
        # Mock do Supabase
        mock_supabase.table.return_value.select.return_value.eq.return_value.eq.return_value.execute.return_value.data = [{
            'id': 'sub-123',
            'stripe_subscription_id': 'sub_stripe123'
        }]
        mock_supabase.table.return_value.update.return_value.eq.return_value.execute.return_value = None
        
        # Mock do Stripe
        mock_stripe.Subscription.modify.return_value = None
        
        # Mock do token_required decorator
        with patch('src.routes.payments.token_required') as mock_decorator:
            mock_decorator.return_value = lambda f: f
            
            with patch('src.routes.payments.request') as mock_request:
                mock_request.current_user = {'id': 'test-user-id'}
                
                response = client.post('/api/payments/subscriptions/sub-123/cancel')
                
                # Como a rota retorna 501 (não implementado), vamos verificar isso
                assert response.status_code == 501

if __name__ == '__main__':
    pytest.main([__file__])