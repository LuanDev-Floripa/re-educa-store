"""
Testes de Pagamentos RE-EDUCA Store.

Cobre rotas e serviços de pagamento incluindo:
- Criação de clientes e Payment Intents
- Processamento de webhooks
- Histórico de pagamentos
- Gerenciamento de assinaturas
- Validação de dados
"""

import json
from unittest.mock import MagicMock, patch

import pytest
from main import app
from services.payment_service import PaymentService


@pytest.fixture
def client():
    """Cliente de teste Flask"""
    app.config["TESTING"] = True
    with app.test_client() as client:
        yield client


@pytest.fixture
def payment_service():
    """Instância do serviço de pagamentos"""
    return PaymentService()


@pytest.fixture
def mock_supabase():
    """Mock do Supabase"""
    with patch("src.services.payment_service.get_db") as mock:
        mock_supabase = MagicMock()
        mock.return_value = mock_supabase
        yield mock_supabase


class TestPaymentService:
    """Testes do serviço de pagamentos"""

    def test_create_stripe_customer_success(self, payment_service):
        """Testa criação de cliente Stripe com sucesso"""
        with patch("src.services.payment_service.stripe.Customer.create") as mock_create:
            # Mock do Stripe
            mock_customer = MagicMock()
            mock_customer.id = "cus_test123"
            mock_create.return_value = mock_customer

            # Dados de teste
            user_data = {"id": "user123", "email": "test@example.com", "name": "Test User", "subscription_plan": "free"}

            # Executa teste
            result = payment_service.create_stripe_customer(user_data)

            # Verifica resultado
            assert result["success"] is True
            assert result["customer_id"] == "cus_test123"
            assert result["customer"] == mock_customer

    def test_create_stripe_payment_intent_success(self, payment_service):
        """Testa criação de Payment Intent com sucesso"""
        with patch("src.services.payment_service.stripe.PaymentIntent.create") as mock_create:
            # Mock do Stripe
            mock_intent = MagicMock()
            mock_intent.client_secret = "pi_test123_secret"
            mock_intent.id = "pi_test123"
            mock_create.return_value = mock_intent

            # Executa teste
            result = payment_service.create_stripe_payment_intent(
                amount=100.00, currency="brl", customer_id="cus_test123", metadata={"order_id": "order123"}
            )

            # Verifica resultado
            assert result["success"] is True
            assert result["client_secret"] == "pi_test123_secret"
            assert result["payment_intent_id"] == "pi_test123"

    def test_create_stripe_subscription_success(self, payment_service):
        """Testa criação de assinatura Stripe com sucesso"""
        with patch("src.services.payment_service.stripe.Subscription.create") as mock_create:
            # Mock do Stripe
            mock_subscription = MagicMock()
            mock_subscription.id = "sub_test123"
            mock_invoice = MagicMock()
            mock_payment_intent = MagicMock()
            mock_payment_intent.client_secret = "pi_test123_secret"
            mock_invoice.payment_intent = mock_payment_intent
            mock_subscription.latest_invoice = mock_invoice
            mock_create.return_value = mock_subscription

            # Executa teste
            result = payment_service.create_stripe_subscription(
                customer_id="cus_test123", price_id="price_test123", trial_period_days=7
            )

            # Verifica resultado
            assert result["success"] is True
            assert result["subscription_id"] == "sub_test123"
            assert result["client_secret"] == "pi_test123_secret"

    def test_handle_stripe_webhook_payment_success(self, payment_service):
        """Testa webhook de pagamento bem-sucedido"""
        with patch("src.services.payment_service.stripe.Webhook.construct_event") as mock_webhook:
            # Mock do evento Stripe
            mock_event = {
                "type": "payment_intent.succeeded",
                "data": {"object": {"id": "pi_test123", "metadata": {"order_id": "order123"}}},
            }
            mock_webhook.return_value = mock_event

            # Mock do método auxiliar
            with patch.object(payment_service, "_handle_payment_success") as mock_handle:
                mock_handle.return_value = {"success": True}

                # Executa teste
                result = payment_service.handle_stripe_webhook("payload", "signature")

                # Verifica resultado
                assert result["success"] is True
                mock_handle.assert_called_once()

    def test_create_pagseguro_payment_success(self, payment_service):
        """Testa criação de pagamento PagSeguro com sucesso"""
        with patch("src.services.payment_service.requests.post") as mock_post:
            # Mock da resposta do PagSeguro
            mock_response = MagicMock()
            mock_response.status_code = 200
            mock_response.text = """
            <checkout>
                <code>8CF4BE7DCECEF0F004A6DFA0A8243412</code>
                <date>2010-12-02T10:11:28.000-02:00</date>
            </checkout>
            """
            mock_post.return_value = mock_response

            # Dados de teste
            order_data = {
                "order_id": "order123",
                "items": [{"id": "item1", "name": "Produto Teste", "price": 100.00, "quantity": 1}],
                "customer": {"name": "Test User", "email": "test@example.com", "phone": "11999999999"},
            }

            # Executa teste
            result = payment_service.create_pagseguro_payment(order_data)

            # Verifica resultado
            assert result["success"] is True
            assert "payment_code" in result
            assert "payment_url" in result

    def test_handle_pagseguro_notification_success(self, payment_service):
        """Testa notificação do PagSeguro com sucesso"""
        with patch("src.services.payment_service.requests.get") as mock_get:
            # Mock da resposta do PagSeguro
            mock_response = MagicMock()
            mock_response.status_code = 200
            mock_response.text = """
            <transaction>
                <code>9E884542-81B3-4419-9A75-BCC6FB495EF1</code>
                <reference>order123</reference>
                <status>3</status>
            </transaction>
            """
            mock_get.return_value = mock_response

            # Mock do método auxiliar
            with patch.object(payment_service, "_update_payment_status") as mock_update:
                mock_update.return_value = {"success": True}

                # Executa teste
                result = payment_service.handle_pagseguro_notification("notification123", "transaction")

                # Verifica resultado
                assert result["success"] is True
                mock_update.assert_called_once()

    def test_get_payment_methods(self, payment_service):
        """Testa obtenção de métodos de pagamento"""
        # Executa teste
        result = payment_service.get_payment_methods()

        # Verifica resultado
        assert "stripe" in result
        assert "pagseguro" in result
        assert "enabled" in result["stripe"]
        assert "enabled" in result["pagseguro"]
        assert "methods" in result["stripe"]
        assert "methods" in result["pagseguro"]


class TestPaymentRoutes:
    """Testes das rotas de pagamento"""

    def test_get_payment_methods_route(self, client):
        """Testa rota de métodos de pagamento"""
        # Executa teste
        response = client.get("/api/payments/methods")

        # Verifica resultado
        assert response.status_code == 200
        response_data = json.loads(response.data)
        assert "stripe" in response_data
        assert "pagseguro" in response_data

    def test_create_stripe_payment_intent_route_success(self, client, mock_supabase):
        """Testa rota de criação de Payment Intent com sucesso"""
        # Mock do Supabase
        mock_supabase.table.return_value.select.return_value.eq.return_value.execute.return_value.data = [
            {"id": "user123", "email": "test@example.com", "name": "Test User", "subscription_plan": "free"}
        ]

        # Mock do Stripe
        with patch("src.routes.payments.stripe.Customer.create") as mock_customer:
            mock_customer.return_value.id = "cus_test123"

            with patch("src.routes.payments.stripe.PaymentIntent.create") as mock_intent:
                mock_intent_obj = MagicMock()
                mock_intent_obj.client_secret = "pi_test123_secret"
                mock_intent_obj.id = "pi_test123"
                mock_intent.return_value = mock_intent_obj

                # Mock do token de autenticação
                with patch("src.routes.payments.token_required") as mock_auth:
                    mock_auth.return_value = lambda f: f

                    # Dados de teste
                    data = {"amount": 100.00, "currency": "brl"}

                    # Executa teste
                    response = client.post(
                        "/api/payments/stripe/create-payment-intent",
                        data=json.dumps(data),
                        content_type="application/json",
                    )

                    # Verifica resultado
                    assert response.status_code == 200
                    response_data = json.loads(response.data)
                    assert "client_secret" in response_data
                    assert "payment_intent_id" in response_data

    def test_stripe_webhook_route_success(self, client):
        """Testa rota de webhook do Stripe com sucesso"""
        with patch("src.routes.payments.stripe.Webhook.construct_event") as mock_webhook:
            # Mock do evento Stripe
            mock_event = {
                "type": "payment_intent.succeeded",
                "data": {"object": {"id": "pi_test123", "metadata": {"order_id": "order123"}}},
            }
            mock_webhook.return_value = mock_event

            # Mock do método auxiliar
            with patch("src.routes.payments.payment_service._handle_payment_success") as mock_handle:
                mock_handle.return_value = {"success": True}

                # Executa teste
                response = client.post(
                    "/api/payments/stripe/webhook", data="test payload", headers={"Stripe-Signature": "test_signature"}
                )

                # Verifica resultado
                assert response.status_code == 200
                response_data = json.loads(response.data)
                assert response_data["status"] == "success"

    def test_create_pagseguro_payment_route_success(self, client, mock_supabase):
        """Testa rota de criação de pagamento PagSeguro com sucesso"""
        # Mock do Supabase
        mock_supabase.table.return_value.select.return_value.eq.return_value.execute.return_value.data = [
            {"id": "order123", "user_id": "user123", "total": 100.00}
        ]

        # Mock do PagSeguro
        with patch("src.routes.payments.requests.post") as mock_post:
            mock_response = MagicMock()
            mock_response.status_code = 200
            mock_response.text = """
            <checkout>
                <code>8CF4BE7DCECEF0F004A6DFA0A8243412</code>
                <date>2010-12-02T10:11:28.000-02:00</date>
            </checkout>
            """
            mock_post.return_value = mock_response

            # Mock do token de autenticação
            with patch("src.routes.payments.token_required") as mock_auth:
                mock_auth.return_value = lambda f: f

                # Dados de teste
                data = {
                    "order_id": "order123",
                    "items": [{"id": "item1", "name": "Produto Teste", "price": 100.00, "quantity": 1}],
                    "customer": {"name": "Test User", "email": "test@example.com", "phone": "11999999999"},
                }

                # Executa teste
                response = client.post(
                    "/api/payments/pagseguro/create-payment", data=json.dumps(data), content_type="application/json"
                )

                # Verifica resultado
                assert response.status_code == 200
                response_data = json.loads(response.data)
                assert "payment_code" in response_data
                assert "payment_url" in response_data

    def test_pagseguro_notification_route_success(self, client):
        """Testa rota de notificação do PagSeguro com sucesso"""
        with patch("src.routes.payments.requests.get") as mock_get:
            # Mock da resposta do PagSeguro
            mock_response = MagicMock()
            mock_response.status_code = 200
            mock_response.text = """
            <transaction>
                <code>9E884542-81B3-4419-9A75-BCC6FB495EF1</code>
                <reference>order123</reference>
                <status>3</status>
            </transaction>
            """
            mock_get.return_value = mock_response

            # Mock do método auxiliar
            with patch("src.routes.payments.payment_service._update_payment_status") as mock_update:
                mock_update.return_value = {"success": True}

                # Executa teste
                response = client.post(
                    "/api/payments/pagseguro/notification",
                    data={"notificationCode": "notification123", "notificationType": "transaction"},
                )

                # Verifica resultado
                assert response.status_code == 200
                response_data = json.loads(response.data)
                assert response_data["status"] == "success"

    def test_get_payment_history_route_success(self, client, mock_supabase):
        """Testa rota de histórico de pagamentos com sucesso"""
        # Mock do Supabase
        mock_supabase.table.return_value.select.return_value.eq.return_value.order.return_value.range.return_value.execute.return_value.data = [
            {"id": "order1", "total": 100.00, "status": "completed", "created_at": "2025-01-01T00:00:00Z"},
            {"id": "order2", "total": 200.00, "status": "pending", "created_at": "2025-01-02T00:00:00Z"},
        ]

        # Mock do token de autenticação
        with patch("src.routes.payments.token_required") as mock_auth:
            mock_auth.return_value = lambda f: f

            # Executa teste
            response = client.get("/api/payments/history")

            # Verifica resultado
            assert response.status_code == 200
            response_data = json.loads(response.data)
            assert "payments" in response_data
            assert "page" in response_data
            assert "per_page" in response_data
            assert len(response_data["payments"]) == 2

    def test_get_user_subscriptions_route_success(self, client, mock_supabase):
        """Testa rota de assinaturas do usuário com sucesso"""
        # Mock do Supabase
        mock_supabase.table.return_value.select.return_value.eq.return_value.order.return_value.execute.return_value.data = [
            {"id": "sub1", "plan": "premium", "status": "active", "created_at": "2025-01-01T00:00:00Z"}
        ]

        # Mock do token de autenticação
        with patch("src.routes.payments.token_required") as mock_auth:
            mock_auth.return_value = lambda f: f

            # Executa teste
            response = client.get("/api/payments/subscriptions")

            # Verifica resultado
            assert response.status_code == 200
            response_data = json.loads(response.data)
            assert "subscriptions" in response_data
            assert len(response_data["subscriptions"]) == 1

    def test_cancel_subscription_route_success(self, client, mock_supabase):
        """Testa rota de cancelamento de assinatura com sucesso"""
        # Mock do Supabase
        mock_supabase.table.return_value.select.return_value.eq.return_value.eq.return_value.execute.return_value.data = [
            {"id": "sub1", "stripe_subscription_id": "sub_stripe123", "status": "active"}
        ]
        mock_supabase.table.return_value.update.return_value.eq.return_value.execute.return_value = None

        # Mock do Stripe
        with patch("src.routes.payments.stripe.Subscription.modify") as mock_modify:
            mock_modify.return_value = None

            # Mock do token de autenticação
            with patch("src.routes.payments.token_required") as mock_auth:
                mock_auth.return_value = lambda f: f

                # Executa teste
                response = client.post("/api/payments/subscriptions/sub1/cancel")

                # Verifica resultado
                assert response.status_code == 200
                response_data = json.loads(response.data)
                assert "message" in response_data


if __name__ == "__main__":
    pytest.main([__file__])
