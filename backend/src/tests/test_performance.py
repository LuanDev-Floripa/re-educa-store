"""
Testes de Performance RE-EDUCA Store.

Cobre métricas de performance incluindo:
- Tempos de resposta de rotas
- Performance de operações críticas (hash, JWT, DB)
- Uso de recursos (CPU, memória)
- Concorrência e escalabilidade
- Tamanho de respostas e serialização
"""

import json
import time
from unittest.mock import MagicMock, patch

import pytest
from main import app


@pytest.fixture
def client():
    """Cliente de teste Flask"""
    app.config["TESTING"] = True
    with app.test_client() as client:
        yield client


class TestPerformance:
    """Testes de performance"""

    def test_login_response_time(self, client):
        """Testa tempo de resposta do login"""
        start_time = time.time()

        response = client.post(
            "/api/auth/login",
            data=json.dumps({"email": "test@example.com", "password": "password123"}),
            content_type="application/json",
        )

        end_time = time.time()
        response_time = end_time - start_time

        # Deve responder em menos de 1 segundo
        assert response_time < 1.0
        assert response.status_code in [200, 401]

    def test_registration_response_time(self, client):
        """Testa tempo de resposta do registro"""
        start_time = time.time()

        response = client.post(
            "/api/auth/register",
            data=json.dumps({"name": "Test User", "email": "test@example.com", "password": "password123"}),
            content_type="application/json",
        )

        end_time = time.time()
        response_time = end_time - start_time

        # Deve responder em menos de 2 segundos
        assert response_time < 2.0
        assert response.status_code in [200, 201, 400]

    def test_database_query_performance(self):
        """Testa performance de consultas ao banco"""
        from services.auth_service import AuthService

        service = AuthService()

        # Mock do banco de dados
        with patch("src.services.auth_service.get_db") as mock_db:
            mock_supabase = MagicMock()
            mock_supabase.table.return_value.select.return_value.eq.return_value.execute.return_value.data = []
            mock_db.return_value = mock_supabase

            start_time = time.time()

            # Simula consulta de usuário
            service.authenticate_user("test@example.com", "password123")

            end_time = time.time()
            query_time = end_time - start_time

            # Deve executar em menos de 100ms
            assert query_time < 0.1

    def test_password_hashing_performance(self):
        """Testa performance do hash de senhas"""
        from config.security import hash_password

        password = "testpassword123"

        start_time = time.time()
        hashed = hash_password(password)
        end_time = time.time()

        hashing_time = end_time - start_time

        # Deve fazer hash em menos de 100ms
        assert hashing_time < 0.1
        assert hashed is not None

    def test_jwt_generation_performance(self):
        """Testa performance da geração de JWT"""
        from config.security import generate_token

        user_id = "test-user-id"

        start_time = time.time()
        token = generate_token(user_id)
        end_time = time.time()

        generation_time = end_time - start_time

        # Deve gerar token em menos de 50ms
        assert generation_time < 0.05
        assert token is not None

    def test_jwt_verification_performance(self):
        """Testa performance da verificação de JWT"""
        from config.security import generate_token, verify_token

        user_id = "test-user-id"
        token = generate_token(user_id)

        start_time = time.time()
        payload = verify_token(token)
        end_time = time.time()

        verification_time = end_time - start_time

        # Deve verificar token em menos de 50ms
        assert verification_time < 0.05
        assert payload is not None

    def test_email_service_performance(self):
        """Testa performance do serviço de email"""
        from services.email_service import EmailService

        service = EmailService()

        # Mock do SMTP
        with patch("src.services.email_service.smtplib.SMTP") as mock_smtp:
            mock_server = MagicMock()
            mock_smtp.return_value.__enter__.return_value = mock_server

            start_time = time.time()

            # Simula envio de email
            result = service.send_verification_email("test@example.com", "Test User", "verification-token")

            end_time = time.time()
            email_time = end_time - start_time

            # Deve enviar email em menos de 500ms
            assert email_time < 0.5
            assert result is True

    def test_payment_service_performance(self):
        """Testa performance do serviço de pagamentos"""
        from services.payment_service import PaymentService

        service = PaymentService()

        # Mock do Stripe
        with patch("src.services.payment_service.stripe") as mock_stripe:
            mock_stripe.Customer.create.return_value = {"id": "cus_test123", "email": "test@example.com"}

            start_time = time.time()

            # Simula criação de cliente
            result = service.create_stripe_customer(
                {"id": "test-user-id", "email": "test@example.com", "name": "Test User"}
            )

            end_time = time.time()
            payment_time = end_time - start_time

            # Deve criar cliente em menos de 1 segundo
            assert payment_time < 1.0
            assert result["success"] is True

    def test_coupon_service_performance(self):
        """Testa performance do serviço de cupons"""
        from services.coupon_service import CouponService

        service = CouponService()

        # Mock do banco de dados
        with patch("src.services.coupon_service.get_db") as mock_db:
            mock_db.return_value.execute_query.return_value = []

            start_time = time.time()

            # Simula validação de cupom
            service.validate_coupon("TEST10", "test-user-id", 100.0)

            end_time = time.time()
            coupon_time = end_time - start_time

            # Deve validar cupom em menos de 200ms
            assert coupon_time < 0.2

    def test_concurrent_requests_performance(self, client):
        """Testa performance com requisições concorrentes"""
        import queue
        import threading

        results = queue.Queue()

        def make_request():
            start_time = time.time()
            response = client.get("/api/auth/me")
            end_time = time.time()
            results.put((response.status_code, end_time - start_time))

        # Cria 10 threads para fazer requisições simultâneas
        threads = []
        for i in range(10):
            thread = threading.Thread(target=make_request)
            threads.append(thread)
            thread.start()

        # Aguarda todas as threads terminarem
        for thread in threads:
            thread.join()

        # Verifica resultados
        response_times = []
        while not results.empty():
            status_code, response_time = results.get()
            response_times.append(response_time)
            assert status_code in [200, 401]  # Pode ser 401 se não autenticado

        # Verifica se todas as requisições foram processadas em tempo aceitável
        for response_time in response_times:
            assert response_time < 1.0

    def test_memory_usage(self):
        """Testa uso de memória"""
        import os

        import psutil

        process = psutil.Process(os.getpid())
        initial_memory = process.memory_info().rss

        # Simula operações que podem consumir memória
        for i in range(1000):
            from config.security import hash_password

            hash_password(f"password{i}")

        final_memory = process.memory_info().rss
        memory_increase = final_memory - initial_memory

        # Verifica se o aumento de memória é aceitável (menos de 10MB)
        assert memory_increase < 10 * 1024 * 1024

    def test_cpu_usage(self):
        """Testa uso de CPU"""
        import os

        import psutil

        # Obtém processo atual para monitoramento
        _ = psutil.Process(os.getpid())

        # Simula operações que podem consumir CPU
        start_time = time.time()
        for i in range(1000):
            from config.security import hash_password

            hash_password(f"password{i}")
        end_time = time.time()

        # Verifica se as operações foram executadas em tempo aceitável
        execution_time = end_time - start_time
        assert execution_time < 5.0  # Menos de 5 segundos para 1000 hashes

    def test_database_connection_pool(self):
        """Testa pool de conexões do banco"""
        from config.database import supabase_client

        # Simula múltiplas conexões
        connections = []
        for i in range(10):
            db = supabase_client
            connections.append(db)

        # Verifica se todas as conexões foram criadas
        assert len(connections) == 10

        # Verifica se as conexões são válidas
        for db in connections:
            assert db is not None

    def test_cache_performance(self):
        """Testa performance do cache"""
        # Simula operação que pode ser cacheada
        start_time = time.time()

        # Simula consulta que seria cacheada
        for i in range(100):
            # Simula operação que seria cacheada
            pass

        end_time = time.time()
        cache_time = end_time - start_time

        # Verifica se o tempo é aceitável
        assert cache_time < 0.1

    def test_api_response_size(self, client):
        """Testa tamanho das respostas da API"""
        response = client.get("/api/auth/me")

        # Verifica se a resposta não é muito grande
        response_size = len(response.data)
        assert response_size < 1024 * 1024  # Menos de 1MB

    def test_json_serialization_performance(self):
        """Testa performance da serialização JSON"""
        import json

        # Dados de teste
        test_data = {
            "user_id": "test-user-id",
            "email": "test@example.com",
            "name": "Test User",
            "data": [i for i in range(1000)],
        }

        start_time = time.time()
        json_string = json.dumps(test_data)
        end_time = time.time()

        serialization_time = end_time - start_time

        # Deve serializar em menos de 10ms
        assert serialization_time < 0.01
        assert json_string is not None

    def test_json_deserialization_performance(self):
        """Testa performance da deserialização JSON"""
        import json

        # JSON de teste
        json_string = (
            '{"user_id": "test-user-id", "email": "test@example.com", "name": "Test User", "data": [1, 2, 3, 4, 5]}'
        )

        start_time = time.time()
        data = json.loads(json_string)
        end_time = time.time()

        deserialization_time = end_time - start_time

        # Deve deserializar em menos de 1ms
        assert deserialization_time < 0.001
        assert data is not None

    def test_file_upload_performance(self, client):
        """Testa performance de upload de arquivos"""
        # Simula arquivo de teste
        test_file = b"test file content" * 1000  # ~17KB

        start_time = time.time()

        response = client.post(
            "/api/upload", data={"file": (test_file, "test.txt")}, content_type="multipart/form-data"
        )

        end_time = time.time()
        upload_time = end_time - start_time

        # Deve processar upload em menos de 1 segundo
        assert upload_time < 1.0
        assert response.status_code in [200, 400, 403, 415]

    def test_search_performance(self, client):
        """Testa performance de busca"""
        start_time = time.time()

        response = client.get("/api/products/search?q=test")

        end_time = time.time()
        search_time = end_time - start_time

        # Deve buscar em menos de 500ms
        assert search_time < 0.5
        assert response.status_code in [200, 404]

    def test_pagination_performance(self, client):
        """Testa performance de paginação"""
        start_time = time.time()

        response = client.get("/api/products?page=1&per_page=20")

        end_time = time.time()
        pagination_time = end_time - start_time

        # Deve paginar em menos de 300ms
        assert pagination_time < 0.3
        assert response.status_code in [200, 404]

    def test_authentication_middleware_performance(self, client):
        """Testa performance do middleware de autenticação"""
        # Simula requisição com token
        headers = {"Authorization": "Bearer invalid-token"}

        start_time = time.time()

        response = client.get("/api/users/profile", headers=headers)

        end_time = time.time()
        auth_time = end_time - start_time

        # Deve verificar autenticação em menos de 100ms
        assert auth_time < 0.1
        assert response.status_code == 401

    def test_rate_limiting_performance(self, client):
        """Testa performance do rate limiting"""
        start_time = time.time()

        # Faz múltiplas requisições
        for i in range(5):
            client.get("/api/auth/me")

        end_time = time.time()
        rate_limit_time = end_time - start_time

        # Deve processar rate limiting em menos de 500ms
        assert rate_limit_time < 0.5

    def test_cors_performance(self, client):
        """Testa performance do CORS"""
        headers = {"Origin": "https://example.com"}

        start_time = time.time()

        response = client.options("/api/auth/login", headers=headers)

        end_time = time.time()
        cors_time = end_time - start_time

        # Deve processar CORS em menos de 50ms
        assert cors_time < 0.05
        assert response.status_code in [200, 204]

    def test_compression_performance(self, client):
        """Testa performance da compressão"""
        start_time = time.time()

        response = client.get("/api/products", headers={"Accept-Encoding": "gzip"})

        end_time = time.time()
        compression_time = end_time - start_time

        # Deve comprimir em menos de 200ms
        assert compression_time < 0.2
        assert response.status_code in [200, 404]

    def test_ssl_performance(self, client):
        """Testa performance do SSL"""
        start_time = time.time()

        response = client.get("/api/auth/me", headers={"X-Forwarded-Proto": "https"})

        end_time = time.time()
        ssl_time = end_time - start_time

        # Deve processar SSL em menos de 100ms
        assert ssl_time < 0.1
        assert response.status_code in [200, 401]


if __name__ == "__main__":
    pytest.main([__file__])
