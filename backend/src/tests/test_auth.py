"""
Testes de Autenticação RE-EDUCA Store
"""
import pytest
import json
from unittest.mock import patch, MagicMock
from main import app
from services.auth_service import AuthService
from services.email_service import EmailService

@pytest.fixture
def client():
    """Cliente de teste Flask"""
    app.config['TESTING'] = True
    with app.test_client() as client:
        yield client

@pytest.fixture
def auth_service():
    """Instância do serviço de autenticação"""
    return AuthService()

@pytest.fixture
def mock_supabase():
    """Mock do Supabase"""
    with patch('src.services.auth_service.get_db') as mock:
        mock_supabase = MagicMock()
        mock.return_value = mock_supabase
        yield mock_supabase

class TestAuthService:
    """
    Testes do serviço de autenticação RE-EDUCA Store.
    
    Suite completa de testes para AuthService incluindo:
    - Registro de usuários
    - Autenticação e login
    - Verificação de email
    - Recuperação de senha
    """
    
    def test_register_user_success(self, auth_service, mock_supabase):
        """
        Testa registro de usuário com sucesso.
        
        Verifica:
        - Criação bem-sucedida do usuário
        - Geração de tokens JWT (access e refresh)
        - Envio de email de verificação
        - Dados do usuário corretos na resposta
        
        Args:
            auth_service: Instância do AuthService.
            mock_supabase: Mock do Supabase.
        """
        # Mock do Supabase
        mock_supabase.table.return_value.select.return_value.eq.return_value.execute.return_value.data = []
        mock_supabase.table.return_value.insert.return_value.execute.return_value.data = [{
            'id': 'test-user-id',
            'email': 'test@example.com',
            'name': 'Test User',
            'role': 'user',
            'subscription_plan': 'free'
        }]
        mock_supabase.table.return_value.upsert.return_value.execute.return_value = None
        
        # Mock do serviço de email
        with patch.object(auth_service.email_service, 'send_verification_email') as mock_email:
            mock_email.return_value = True
            
            # Dados de teste
            user_data = {
                'name': 'Test User',
                'email': 'test@example.com',
                'password': 'password123'
            }
            
            # Executa teste
            result = auth_service.register_user(user_data)
            
            # Assert: Operação deve ter sucesso
            assert result['success'] is True, "Registro deve ter sucesso"
            assert isinstance(result, dict), "Resultado deve ser um dicionário"
            
            # Assert: Deve conter dados do usuário
            assert 'user' in result, "Resultado deve conter 'user'"
            assert isinstance(result['user'], dict), "Campo 'user' deve ser um dicionário"
            assert result['user']['email'] == 'test@example.com', "Email deve corresponder"
            assert result['user']['name'] == 'Test User', "Nome deve corresponder"
            
            # Assert: Deve conter tokens JWT
            assert 'token' in result, "Resultado deve conter 'token'"
            assert 'refresh_token' in result, "Resultado deve conter 'refresh_token'"
            assert isinstance(result['token'], str), "Token deve ser string"
            assert len(result['token']) > 0, "Token não pode estar vazio"
    
    def test_register_user_email_exists(self, auth_service, mock_supabase):
        """Testa registro com email já existente"""
        # Mock do Supabase - email já existe
        mock_supabase.table.return_value.select.return_value.eq.return_value.execute.return_value.data = [{
            'id': 'existing-user-id'
        }]
        
        # Dados de teste
        user_data = {
            'name': 'Test User',
            'email': 'existing@example.com',
            'password': 'password123'
        }
        
        # Executa teste
        result = auth_service.register_user(user_data)
        
        # Verifica resultado
        assert result['success'] is False
        assert result['error'] == 'Email já está em uso'
    
    def test_authenticate_user_success(self, auth_service, mock_supabase):
        """Testa autenticação de usuário com sucesso"""
        # Mock do Supabase
        mock_supabase.table.return_value.select.return_value.eq.return_value.execute.return_value.data = [{
            'id': 'test-user-id',
            'email': 'test@example.com',
            'name': 'Test User',
            'password_hash': '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/8KzKz2K',  # hash de 'password123'
            'role': 'user',
            'subscription_plan': 'free',
            'active': True
        }]
        mock_supabase.table.return_value.update.return_value.eq.return_value.execute.return_value = None
        
        # Executa teste
        result = auth_service.authenticate_user('test@example.com', 'password123')
        
        # Verifica resultado
        assert result['success'] is True
        assert 'user' in result
        assert 'token' in result
        assert 'refresh_token' in result
        assert result['user']['email'] == 'test@example.com'
    
    def test_authenticate_user_invalid_credentials(self, auth_service, mock_supabase):
        """Testa autenticação com credenciais inválidas"""
        # Mock do Supabase - usuário não encontrado
        mock_supabase.table.return_value.select.return_value.eq.return_value.execute.return_value.data = []
        
        # Executa teste
        result = auth_service.authenticate_user('nonexistent@example.com', 'wrongpassword')
        
        # Verifica resultado
        assert result['success'] is False
        assert result['error'] == 'Email ou senha inválidos'
    
    def test_verify_email_success(self, auth_service, mock_supabase):
        """Testa verificação de email com sucesso"""
        # Mock do token JWT
        with patch('src.services.auth_service.verify_token') as mock_verify:
            mock_verify.return_value = {'user_id': 'test-user-id'}
            
            # Mock do Supabase
            mock_supabase.table.return_value.select.return_value.eq.return_value.eq.return_value.execute.return_value.data = [{
                'token': 'test-token',
                'expires_at': '2025-12-31T23:59:59Z'
            }]
            mock_supabase.table.return_value.select.return_value.eq.return_value.execute.return_value.data = [{
                'id': 'test-user-id',
                'email': 'test@example.com',
                'name': 'Test User'
            }]
            mock_supabase.table.return_value.update.return_value.eq.return_value.execute.return_value = None
            
            # Mock do serviço de email
            with patch.object(auth_service.email_service, 'send_welcome_email') as mock_email:
                mock_email.return_value = True
                
                # Executa teste
                result = auth_service.verify_email('test-token')
                
                # Verifica resultado
                assert result['success'] is True
                assert result['user_id'] == 'test-user-id'
    
    def test_forgot_password_success(self, auth_service, mock_supabase):
        """Testa solicitação de reset de senha com sucesso"""
        # Mock do Supabase
        mock_supabase.table.return_value.select.return_value.eq.return_value.execute.return_value.data = [{
            'id': 'test-user-id',
            'name': 'Test User'
        }]
        mock_supabase.table.return_value.insert.return_value.execute.return_value = None
        
        # Mock do serviço de email
        with patch.object(auth_service.email_service, 'send_password_reset_email') as mock_email:
            mock_email.return_value = True
            
            # Executa teste
            result = auth_service.forgot_password('test@example.com')
            
            # Verifica resultado
            assert result['success'] is True
            assert result['message'] == 'Email de reset enviado'

class TestAuthRoutes:
    """Testes das rotas de autenticação"""
    
    def test_register_route_success(self, client, mock_supabase):
        """Testa rota de registro com sucesso"""
        # Mock do Supabase
        mock_supabase.table.return_value.select.return_value.eq.return_value.execute.return_value.data = []
        mock_supabase.table.return_value.insert.return_value.execute.return_value.data = [{
            'id': 'test-user-id',
            'email': 'test@example.com',
            'name': 'Test User',
            'role': 'user',
            'subscription_plan': 'free'
        }]
        mock_supabase.table.return_value.upsert.return_value.execute.return_value = None
        
        # Mock do serviço de email
        with patch('src.routes.auth.EmailService') as mock_email_service:
            mock_email_service.return_value.send_verification_email.return_value = True
            
            # Dados de teste
            data = {
                'name': 'Test User',
                'email': 'test@example.com',
                'password': 'password123'
            }
            
            # Executa teste
            response = client.post('/api/auth/register', 
                                 data=json.dumps(data),
                                 content_type='application/json')
            
            # Verifica resultado
            assert response.status_code == 201
            response_data = json.loads(response.data)
            assert 'message' in response_data
            assert 'user' in response_data
            assert 'token' in response_data
    
    def test_login_route_success(self, client, mock_supabase):
        """Testa rota de login com sucesso"""
        # Mock do Supabase
        mock_supabase.table.return_value.select.return_value.eq.return_value.execute.return_value.data = [{
            'id': 'test-user-id',
            'email': 'test@example.com',
            'name': 'Test User',
            'password_hash': '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/8KzKz2K',
            'role': 'user',
            'subscription_plan': 'free',
            'active': True
        }]
        mock_supabase.table.return_value.update.return_value.eq.return_value.execute.return_value = None
        
        # Dados de teste
        data = {
            'email': 'test@example.com',
            'password': 'password123'
        }
        
        # Executa teste
        response = client.post('/api/auth/login',
                             data=json.dumps(data),
                             content_type='application/json')
        
        # Verifica resultado
        assert response.status_code == 200
        response_data = json.loads(response.data)
        assert 'message' in response_data
        assert 'user' in response_data
        assert 'token' in response_data
    
    def test_login_route_invalid_credentials(self, client, mock_supabase):
        """Testa rota de login com credenciais inválidas"""
        # Mock do Supabase - usuário não encontrado
        mock_supabase.table.return_value.select.return_value.eq.return_value.execute.return_value.data = []
        
        # Dados de teste
        data = {
            'email': 'nonexistent@example.com',
            'password': 'wrongpassword'
        }
        
        # Executa teste
        response = client.post('/api/auth/login',
                             data=json.dumps(data),
                             content_type='application/json')
        
        # Verifica resultado
        assert response.status_code == 401
        response_data = json.loads(response.data)
        assert 'error' in response_data
    
    def test_verify_email_route_success(self, client, mock_supabase):
        """Testa rota de verificação de email com sucesso"""
        # Mock do token JWT
        with patch('src.routes.auth.verify_token') as mock_verify:
            mock_verify.return_value = {'user_id': 'test-user-id'}
            
            # Mock do Supabase
            mock_supabase.table.return_value.select.return_value.eq.return_value.eq.return_value.execute.return_value.data = [{
                'token': 'test-token',
                'expires_at': '2025-12-31T23:59:59Z'
            }]
            mock_supabase.table.return_value.select.return_value.eq.return_value.execute.return_value.data = [{
                'id': 'test-user-id',
                'email': 'test@example.com',
                'name': 'Test User'
            }]
            mock_supabase.table.return_value.update.return_value.eq.return_value.execute.return_value = None
            
            # Mock do serviço de email
            with patch('src.routes.auth.EmailService') as mock_email_service:
                mock_email_service.return_value.send_welcome_email.return_value = True
                
                # Dados de teste
                data = {
                    'token': 'test-token'
                }
                
                # Executa teste
                response = client.post('/api/auth/verify-email',
                                     data=json.dumps(data),
                                     content_type='application/json')
                
                # Verifica resultado
                assert response.status_code == 200
                response_data = json.loads(response.data)
                assert 'message' in response_data
    
    def test_forgot_password_route_success(self, client, mock_supabase):
        """Testa rota de esqueci minha senha com sucesso"""
        # Mock do Supabase
        mock_supabase.table.return_value.select.return_value.eq.return_value.execute.return_value.data = [{
            'id': 'test-user-id',
            'name': 'Test User'
        }]
        mock_supabase.table.return_value.insert.return_value.execute.return_value = None
        
        # Mock do serviço de email
        with patch('src.routes.auth.EmailService') as mock_email_service:
            mock_email_service.return_value.send_password_reset_email.return_value = True
            
            # Dados de teste
            data = {
                'email': 'test@example.com'
            }
            
            # Executa teste
            response = client.post('/api/auth/forgot-password',
                                 data=json.dumps(data),
                                 content_type='application/json')
            
            # Verifica resultado
            assert response.status_code == 200
            response_data = json.loads(response.data)
            assert 'message' in response_data

class TestEmailService:
    """Testes do serviço de email"""
    
    def test_send_verification_email(self):
        """Testa envio de email de verificação"""
        with patch('src.services.email_service.smtplib.SMTP') as mock_smtp:
            # Mock do servidor SMTP
            mock_server = MagicMock()
            mock_smtp.return_value.__enter__.return_value = mock_server
            
            # Cria serviço de email
            email_service = EmailService()
            
            # Executa teste
            result = email_service.send_verification_email(
                'test@example.com',
                'Test User',
                'verification-token'
            )
            
            # Verifica resultado
            assert result is True
            mock_server.send_message.assert_called_once()
    
    def test_send_password_reset_email(self):
        """Testa envio de email de reset de senha"""
        with patch('src.services.email_service.smtplib.SMTP') as mock_smtp:
            # Mock do servidor SMTP
            mock_server = MagicMock()
            mock_smtp.return_value.__enter__.return_value = mock_server
            
            # Cria serviço de email
            email_service = EmailService()
            
            # Executa teste
            result = email_service.send_password_reset_email(
                'test@example.com',
                'Test User',
                'reset-token'
            )
            
            # Verifica resultado
            assert result is True
            mock_server.send_message.assert_called_once()
    
    def test_send_welcome_email(self):
        """Testa envio de email de boas-vindas"""
        with patch('src.services.email_service.smtplib.SMTP') as mock_smtp:
            # Mock do servidor SMTP
            mock_server = MagicMock()
            mock_smtp.return_value.__enter__.return_value = mock_server
            
            # Cria serviço de email
            email_service = EmailService()
            
            # Executa teste
            result = email_service.send_welcome_email(
                'test@example.com',
                'Test User'
            )
            
            # Verifica resultado
            assert result is True
            mock_server.send_message.assert_called_once()

if __name__ == '__main__':
    pytest.main([__file__])