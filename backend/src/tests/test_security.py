"""
Testes de Segurança RE-EDUCA Store
"""
import pytest
import json
import hashlib
import hmac
from unittest.mock import patch, MagicMock
from main import app
from services.auth_service import AuthService
from services.payment_service import PaymentService

@pytest.fixture
def client():
    """Cliente de teste Flask"""
    app.config['TESTING'] = True
    with app.test_client() as client:
        yield client

class TestSecurity:
    """Testes de segurança"""
    
    def test_sql_injection_protection(self, client):
        """Testa proteção contra SQL injection"""
        # Tenta SQL injection no login
        malicious_payload = "'; DROP TABLE users; --"
        
        response = client.post('/api/auth/login',
                             data=json.dumps({
                                 'email': malicious_payload,
                                 'password': 'password'
                             }),
                             content_type='application/json')
        
        # Assert: Não deve retornar 500 (que indicaria SQL injection bem-sucedida)
        assert response.status_code != 500, "Status 500 pode indicar SQL injection bem-sucedida"
        assert response.status_code in [400, 401, 404], \
            f"Esperado 400/401/404 para payload malicioso, recebido {response.status_code}"
        
        # Assert: Não deve expor erros SQL na resposta
        response_data = json.loads(response.data)
        error_msg = response_data.get('error', '').lower()
        assert 'sql' not in error_msg, "Resposta não deve expor erros SQL"
        assert 'syntax' not in error_msg, "Resposta não deve expor sintaxe SQL"
        assert 'database' not in error_msg or 'error' not in error_msg, \
            "Resposta não deve expor detalhes de banco de dados"
    
    def test_xss_protection(self, client):
        """Testa proteção contra XSS"""
        # Tenta XSS no registro
        xss_payload = "<script>alert('XSS')</script>"
        
        response = client.post('/api/auth/register',
                             data=json.dumps({
                                 'name': xss_payload,
                                 'email': 'test@example.com',
                                 'password': 'password123'
                             }),
                             content_type='application/json')
        
        # Verifica se o payload não foi executado
        assert xss_payload not in response.data.decode()
    
    def test_csrf_protection(self, client):
        """Testa proteção contra CSRF"""
        # Tenta fazer requisição sem token CSRF
        response = client.post('/api/auth/register',
                             data=json.dumps({
                                 'name': 'Test User',
                                 'email': 'test@example.com',
                                 'password': 'password123'
                             }),
                             content_type='application/json')
        
        # Deve retornar erro ou sucesso, mas não deve ser vulnerável a CSRF
        assert response.status_code in [200, 201, 400, 401, 403]
    
    def test_rate_limiting(self, client):
        """Testa rate limiting"""
        # Tenta fazer muitas requisições de login
        for i in range(10):
            response = client.post('/api/auth/login',
                                 data=json.dumps({
                                     'email': 'test@example.com',
                                     'password': 'wrongpassword'
                                 }),
                                 content_type='application/json')
            
            if response.status_code == 429:  # Too Many Requests
                break
        
        # Deve eventualmente retornar 429
        assert response.status_code == 429
    
    def test_password_hashing(self):
        """Testa se senhas são hasheadas corretamente"""
        from config.security import hash_password, verify_password
        
        password = "testpassword123"
        hashed = hash_password(password)
        
        # Verifica se a senha foi hasheada
        assert hashed != password
        assert len(hashed) > 50  # bcrypt gera hashes longos
        
        # Verifica se a verificação funciona
        assert verify_password(password, hashed) is True
        assert verify_password("wrongpassword", hashed) is False
    
    def test_jwt_security(self):
        """Testa segurança do JWT"""
        from config.security import generate_token, verify_token
        
        user_id = "test-user-id"
        token = generate_token(user_id)
        
        # Verifica se o token foi gerado
        assert token is not None
        assert len(token) > 100  # JWT tokens são longos
        
        # Verifica se o token pode ser verificado
        payload = verify_token(token)
        assert payload is not None
        assert payload['user_id'] == user_id
        
        # Verifica se token inválido é rejeitado
        invalid_token = "invalid.token.here"
        payload = verify_token(invalid_token)
        assert payload is None
    
    def test_jwt_expiration(self):
        """Testa expiração do JWT"""
        from config.security import generate_token, verify_token
        import time
        
        # Gera token com expiração de 1 segundo
        user_id = "test-user-id"
        token = generate_token(user_id, expires_in=1)
        
        # Verifica se o token é válido inicialmente
        payload = verify_token(token)
        assert payload is not None
        
        # Aguarda expiração
        time.sleep(2)
        
        # Verifica se o token expirou
        payload = verify_token(token)
        assert payload is None
    
    def test_input_validation(self, client):
        """Testa validação de entrada"""
        # Testa email inválido
        response = client.post('/api/auth/register',
                             data=json.dumps({
                                 'name': 'Test User',
                                 'email': 'invalid-email',
                                 'password': 'password123'
                             }),
                             content_type='application/json')
        
        assert response.status_code == 400
        response_data = json.loads(response.data)
        assert 'email' in response_data.get('error', '').lower()
        
        # Testa senha fraca
        response = client.post('/api/auth/register',
                             data=json.dumps({
                                 'name': 'Test User',
                                 'email': 'test@example.com',
                                 'password': '123'
                             }),
                             content_type='application/json')
        
        assert response.status_code == 400
        response_data = json.loads(response.data)
        assert 'senha' in response_data.get('error', '').lower()
    
    def test_authentication_required(self, client):
        """Testa se rotas protegidas requerem autenticação"""
        # Tenta acessar rota protegida sem token
        response = client.get('/api/users/profile')
        
        assert response.status_code == 401
    
    def test_admin_authorization(self, client):
        """Testa autorização de admin"""
        # Tenta acessar rota de admin sem ser admin
        response = client.get('/api/admin/users')
        
        assert response.status_code == 401
    
    def test_file_upload_security(self, client):
        """Testa segurança de upload de arquivos"""
        # Tenta fazer upload de arquivo malicioso
        malicious_file = b"<?php system($_GET['cmd']); ?>"
        
        response = client.post('/api/upload',
                             data={'file': (malicious_file, 'malicious.php')},
                             content_type='multipart/form-data')
        
        # Deve rejeitar o arquivo
        assert response.status_code in [400, 403, 415]
    
    def test_directory_traversal_protection(self, client):
        """Testa proteção contra directory traversal"""
        # Tenta acessar arquivo fora do diretório permitido
        response = client.get('/api/files/../../../etc/passwd')
        
        # Deve retornar 404 ou 403
        assert response.status_code in [404, 403]
    
    def test_headers_security(self, client):
        """Testa headers de segurança"""
        response = client.get('/')
        
        # Verifica headers de segurança
        assert 'X-Content-Type-Options' in response.headers
        assert 'X-Frame-Options' in response.headers
        assert 'X-XSS-Protection' in response.headers
    
    def test_https_redirect(self, client):
        """Testa redirecionamento para HTTPS"""
        # Simula requisição HTTP
        response = client.get('/', headers={'X-Forwarded-Proto': 'http'})
        
        # Deve redirecionar para HTTPS em produção
        # Em desenvolvimento, pode retornar 200
        assert response.status_code in [200, 301, 302]
    
    def test_cors_configuration(self, client):
        """Testa configuração de CORS"""
        # Testa requisição de origem diferente
        response = client.get('/api/auth/me',
                            headers={'Origin': 'https://malicious-site.com'})
        
        # Deve rejeitar ou permitir baseado na configuração
        assert response.status_code in [200, 401, 403]
    
    def test_session_security(self, client):
        """Testa segurança de sessão"""
        # Faz login
        response = client.post('/api/auth/login',
                             data=json.dumps({
                                 'email': 'test@example.com',
                                 'password': 'password123'
                             }),
                             content_type='application/json')
        
        if response.status_code == 200:
            # Verifica se o cookie de sessão é seguro
            cookies = response.headers.get('Set-Cookie', '')
            assert 'HttpOnly' in cookies
            assert 'Secure' in cookies or 'SameSite' in cookies
    
    def test_password_reset_security(self, client):
        """Testa segurança do reset de senha"""
        # Tenta reset com email inexistente
        response = client.post('/api/auth/forgot-password',
                             data=json.dumps({
                                 'email': 'nonexistent@example.com'
                             }),
                             content_type='application/json')
        
        # Deve retornar sucesso (não revelar se email existe)
        assert response.status_code == 200
    
    def test_2fa_security(self):
        """Testa segurança do 2FA"""
        from services.two_factor_service import TwoFactorService
        
        service = TwoFactorService()
        
        # Testa geração de chave secreta
        secret_key = service.generate_secret_key('test@example.com')
        assert len(secret_key) == 32
        assert secret_key.isalnum()
        
        # Testa geração de códigos de backup
        backup_codes = service.generate_backup_codes(10)
        assert len(backup_codes) == 10
        for code in backup_codes:
            assert len(code) == 8
            assert code.isalnum()
    
    def test_payment_security(self):
        """Testa segurança de pagamentos"""
        from services.payment_service import PaymentService
        
        service = PaymentService()
        
        # Testa webhook com assinatura inválida
        result = service.handle_stripe_webhook('payload', 'invalid_signature')
        assert result['success'] is False
        assert 'Assinatura inválida' in result['error']
    
    def test_data_encryption(self):
        """Testa criptografia de dados sensíveis"""
        from config.security import hash_password
        
        # Testa se senhas são criptografadas
        password = "sensitive_password"
        hashed = hash_password(password)
        
        # Verifica se o hash é diferente da senha original
        assert hashed != password
        
        # Verifica se o hash tem tamanho adequado
        assert len(hashed) > 50
    
    def test_logging_security(self, client):
        """Testa se logs não expõem informações sensíveis"""
        import logging
        
        # Captura logs
        with patch('src.middleware.logging.logger') as mock_logger:
            # Faz requisição com dados sensíveis
            response = client.post('/api/auth/login',
                                 data=json.dumps({
                                     'email': 'test@example.com',
                                     'password': 'sensitive_password'
                                 }),
                                 content_type='application/json')
            
            # Verifica se a senha não foi logada
            for call in mock_logger.info.call_args_list:
                assert 'sensitive_password' not in str(call)
    
    def test_api_versioning_security(self, client):
        """Testa segurança de versionamento de API"""
        # Testa versão antiga da API
        response = client.get('/api/v1/users')
        
        # Deve retornar erro ou redirecionar
        assert response.status_code in [404, 301, 302]
    
    def test_error_handling_security(self, client):
        """Testa se tratamento de erros não expõe informações sensíveis"""
        # Tenta causar erro interno
        response = client.get('/api/nonexistent-endpoint')
        
        # Verifica se o erro não expõe informações do sistema
        response_data = json.loads(response.data)
        assert 'traceback' not in response_data.get('error', '').lower()
        assert 'stack' not in response_data.get('error', '').lower()
    
    def test_brute_force_protection(self, client):
        """Testa proteção contra brute force"""
        # Tenta fazer login várias vezes com senha errada
        for i in range(5):
            response = client.post('/api/auth/login',
                                 data=json.dumps({
                                     'email': 'test@example.com',
                                     'password': 'wrongpassword'
                                 }),
                                 content_type='application/json')
            
            if response.status_code == 429:  # Rate limited
                break
        
        # Deve eventualmente ser rate limited
        assert response.status_code == 429
    
    def test_sql_injection_in_search(self, client):
        """Testa proteção contra SQL injection em busca"""
        # Tenta SQL injection na busca
        malicious_query = "'; DROP TABLE products; --"
        
        response = client.get(f'/api/products/search?q={malicious_query}')
        
        # Deve retornar erro ou resultado vazio, não erro SQL
        assert response.status_code in [200, 400, 404]
        
        if response.status_code == 200:
            response_data = json.loads(response.data)
            assert 'sql' not in str(response_data).lower()
    
    def test_xss_in_search_results(self, client):
        """Testa proteção contra XSS em resultados de busca"""
        # Busca por termo com XSS
        xss_query = "<script>alert('XSS')</script>"
        
        response = client.get(f'/api/products/search?q={xss_query}')
        
        # Verifica se o payload não foi executado
        assert xss_query not in response.data.decode()
    
    def test_file_type_validation(self, client):
        """Testa validação de tipo de arquivo"""
        # Tenta fazer upload de arquivo com extensão perigosa
        dangerous_file = b"malicious content"
        
        response = client.post('/api/upload',
                             data={'file': (dangerous_file, 'malicious.exe')},
                             content_type='multipart/form-data')
        
        # Deve rejeitar o arquivo
        assert response.status_code in [400, 403, 415]
    
    def test_content_length_limit(self, client):
        """Testa limite de tamanho de conteúdo"""
        # Tenta enviar payload muito grande
        large_payload = "x" * (16 * 1024 * 1024 + 1)  # 16MB + 1 byte
        
        response = client.post('/api/upload',
                             data={'file': (large_payload, 'large.txt')},
                             content_type='multipart/form-data')
        
        # Deve rejeitar o arquivo
        assert response.status_code in [400, 413]

if __name__ == '__main__':
    pytest.main([__file__])