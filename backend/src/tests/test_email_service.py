"""
Testes do Serviço de Email RE-EDUCA Store
"""
import pytest
import os
from unittest.mock import patch, MagicMock
from services.email_service import EmailService

@pytest.fixture
def email_service():
    """Instância do serviço de email"""
    return EmailService()

@pytest.fixture
def mock_smtp():
    """Mock do servidor SMTP"""
    with patch('src.services.email_service.smtplib.SMTP') as mock:
        mock_server = MagicMock()
        mock.return_value.__enter__.return_value = mock_server
        yield mock_server

@pytest.fixture
def mock_ssl():
    """Mock do SSL"""
    with patch('src.services.email_service.ssl.create_default_context') as mock:
        yield mock

class TestEmailService:
    """Testes do serviço de email"""
    
    def test_init_with_env_vars(self, email_service):
        """Testa inicialização com variáveis de ambiente"""
        assert email_service.smtp_server == 'smtp.gmail.com'
        assert email_service.smtp_port == 587
        assert email_service.from_email == 'noreply@re-educa.com'
        assert email_service.from_name == 'RE-EDUCA Store'
    
    def test_init_with_custom_env_vars(self):
        """Testa inicialização com variáveis customizadas"""
        with patch.dict(os.environ, {
            'SMTP_SERVER': 'smtp.custom.com',
            'SMTP_PORT': '465',
            'SMTP_USERNAME': 'custom@example.com',
            'SMTP_PASSWORD': 'custom_password',
            'FROM_EMAIL': 'custom@example.com',
            'FROM_NAME': 'Custom Name'
        }):
            service = EmailService()
            assert service.smtp_server == 'smtp.custom.com'
            assert service.smtp_port == 465
            assert service.smtp_username == 'custom@example.com'
            assert service.smtp_password == 'custom_password'
            assert service.from_email == 'custom@example.com'
            assert service.from_name == 'Custom Name'
    
    def test_create_connection_success(self, email_service, mock_smtp, mock_ssl):
        """Testa criação de conexão SMTP com sucesso"""
        # Mock das credenciais
        email_service.smtp_username = 'test@example.com'
        email_service.smtp_password = 'test_password'
        
        connection = email_service._create_connection()
        
        # Verifica se o SMTP foi chamado corretamente
        mock_smtp.assert_called_once_with('smtp.gmail.com', 587)
        connection.starttls.assert_called_once()
        connection.login.assert_called_once_with('test@example.com', 'test_password')
    
    def test_create_connection_error(self, email_service, mock_smtp):
        """Testa criação de conexão SMTP com erro"""
        # Mock do SMTP para retornar erro
        mock_smtp.side_effect = Exception('Connection failed')
        
        with pytest.raises(Exception) as exc_info:
            email_service._create_connection()
        
        assert str(exc_info.value) == 'Connection failed'
    
    def test_send_email_success(self, email_service, mock_smtp):
        """Testa envio de email com sucesso"""
        # Mock das credenciais
        email_service.smtp_username = 'test@example.com'
        email_service.smtp_password = 'test_password'
        
        result = email_service._send_email(
            to_email='recipient@example.com',
            subject='Test Subject',
            html_content='<h1>Test HTML</h1>',
            text_content='Test Text'
        )
        
        assert result is True
        mock_smtp.return_value.__enter__.return_value.send_message.assert_called_once()
    
    def test_send_email_html_only(self, email_service, mock_smtp):
        """Testa envio de email apenas com HTML"""
        # Mock das credenciais
        email_service.smtp_username = 'test@example.com'
        email_service.smtp_password = 'test_password'
        
        result = email_service._send_email(
            to_email='recipient@example.com',
            subject='Test Subject',
            html_content='<h1>Test HTML</h1>'
        )
        
        assert result is True
        mock_smtp.return_value.__enter__.return_value.send_message.assert_called_once()
    
    def test_send_email_error(self, email_service, mock_smtp):
        """Testa envio de email com erro"""
        # Mock do SMTP para retornar erro
        mock_smtp.side_effect = Exception('Send failed')
        
        result = email_service._send_email(
            to_email='recipient@example.com',
            subject='Test Subject',
            html_content='<h1>Test HTML</h1>'
        )
        
        assert result is False
    
    def test_send_verification_email_success(self, email_service, mock_smtp):
        """Testa envio de email de verificação com sucesso"""
        # Mock das credenciais
        email_service.smtp_username = 'test@example.com'
        email_service.smtp_password = 'test_password'
        
        with patch.dict(os.environ, {'FRONTEND_URL': 'https://app.re-educa.com'}):
            result = email_service.send_verification_email(
                user_email='test@example.com',
                user_name='Test User',
                verification_token='verification-token-123'
            )
        
        assert result is True
        mock_smtp.return_value.__enter__.return_value.send_message.assert_called_once()
        
        # Verifica se o email foi enviado com os dados corretos
        call_args = mock_smtp.return_value.__enter__.return_value.send_message.call_args[0][0]
        assert call_args['From'] == 'RE-EDUCA Store <noreply@re-educa.com>'
        assert call_args['To'] == 'test@example.com'
        assert call_args['Subject'] == 'Verifique seu email - RE-EDUCA Store'
    
    def test_send_verification_email_content(self, email_service, mock_smtp):
        """Testa conteúdo do email de verificação"""
        # Mock das credenciais
        email_service.smtp_username = 'test@example.com'
        email_service.smtp_password = 'test_password'
        
        with patch.dict(os.environ, {'FRONTEND_URL': 'https://app.re-educa.com'}):
            email_service.send_verification_email(
                user_email='test@example.com',
                user_name='Test User',
                verification_token='verification-token-123'
            )
        
        # Verifica o conteúdo do email
        call_args = mock_smtp.return_value.__enter__.return_value.send_message.call_args[0][0]
        html_content = call_args.get_payload()[1].get_payload()
        
        assert 'Test User' in html_content
        assert 'verification-token-123' in html_content
        assert 'https://app.re-educa.com/verify-email?token=verification-token-123' in html_content
        assert '24 horas' in html_content
    
    def test_send_password_reset_email_success(self, email_service, mock_smtp):
        """Testa envio de email de reset de senha com sucesso"""
        # Mock das credenciais
        email_service.smtp_username = 'test@example.com'
        email_service.smtp_password = 'test_password'
        
        with patch.dict(os.environ, {'FRONTEND_URL': 'https://app.re-educa.com'}):
            result = email_service.send_password_reset_email(
                user_email='test@example.com',
                user_name='Test User',
                reset_token='reset-token-123'
            )
        
        assert result is True
        mock_smtp.return_value.__enter__.return_value.send_message.assert_called_once()
        
        # Verifica se o email foi enviado com os dados corretos
        call_args = mock_smtp.return_value.__enter__.return_value.send_message.call_args[0][0]
        assert call_args['From'] == 'RE-EDUCA Store <noreply@re-educa.com>'
        assert call_args['To'] == 'test@example.com'
        assert call_args['Subject'] == 'Redefinir sua senha - RE-EDUCA Store'
    
    def test_send_password_reset_email_content(self, email_service, mock_smtp):
        """Testa conteúdo do email de reset de senha"""
        # Mock das credenciais
        email_service.smtp_username = 'test@example.com'
        email_service.smtp_password = 'test_password'
        
        with patch.dict(os.environ, {'FRONTEND_URL': 'https://app.re-educa.com'}):
            email_service.send_password_reset_email(
                user_email='test@example.com',
                user_name='Test User',
                reset_token='reset-token-123'
            )
        
        # Verifica o conteúdo do email
        call_args = mock_smtp.return_value.__enter__.return_value.send_message.call_args[0][0]
        html_content = call_args.get_payload()[1].get_payload()
        
        assert 'Test User' in html_content
        assert 'reset-token-123' in html_content
        assert 'https://app.re-educa.com/reset-password?token=reset-token-123' in html_content
        assert '1 hora' in html_content
        assert '⚠️' in html_content  # Emoji de aviso
    
    def test_send_welcome_email_success(self, email_service, mock_smtp):
        """Testa envio de email de boas-vindas com sucesso"""
        # Mock das credenciais
        email_service.smtp_username = 'test@example.com'
        email_service.smtp_password = 'test_password'
        
        with patch.dict(os.environ, {'FRONTEND_URL': 'https://app.re-educa.com'}):
            result = email_service.send_welcome_email(
                user_email='test@example.com',
                user_name='Test User'
            )
        
        assert result is True
        mock_smtp.return_value.__enter__.return_value.send_message.assert_called_once()
        
        # Verifica se o email foi enviado com os dados corretos
        call_args = mock_smtp.return_value.__enter__.return_value.send_message.call_args[0][0]
        assert call_args['From'] == 'RE-EDUCA Store <noreply@re-educa.com>'
        assert call_args['To'] == 'test@example.com'
        assert call_args['Subject'] == 'Bem-vindo à RE-EDUCA Store! 🎉'
    
    def test_send_welcome_email_content(self, email_service, mock_smtp):
        """Testa conteúdo do email de boas-vindas"""
        # Mock das credenciais
        email_service.smtp_username = 'test@example.com'
        email_service.smtp_password = 'test_password'
        
        with patch.dict(os.environ, {'FRONTEND_URL': 'https://app.re-educa.com'}):
            email_service.send_welcome_email(
                user_email='test@example.com',
                user_name='Test User'
            )
        
        # Verifica o conteúdo do email
        call_args = mock_smtp.return_value.__enter__.return_value.send_message.call_args[0][0]
        html_content = call_args.get_payload()[1].get_payload()
        
        assert 'Test User' in html_content
        assert '🎉' in html_content  # Emoji de celebração
        assert 'Calculadora IMC' in html_content
        assert 'Diário Alimentar' in html_content
        assert 'Loja de Produtos' in html_content
        assert 'Assistente IA' in html_content
        assert 'https://app.re-educa.com/dashboard' in html_content
    
    def test_email_templates_contain_required_elements(self, email_service, mock_smtp):
        """Testa se os templates de email contêm elementos obrigatórios"""
        # Mock das credenciais
        email_service.smtp_username = 'test@example.com'
        email_service.smtp_password = 'test_password'
        
        with patch.dict(os.environ, {'FRONTEND_URL': 'https://app.re-educa.com'}):
            # Testa email de verificação
            email_service.send_verification_email(
                'test@example.com', 'Test User', 'token123'
            )
            
            call_args = mock_smtp.return_value.__enter__.return_value.send_message.call_args[0][0]
            html_content = call_args.get_payload()[1].get_payload()
            
            # Elementos obrigatórios
            assert 'RE-EDUCA Store' in html_content
            assert 'Test User' in html_content
            assert 'token123' in html_content
            assert 'Verificar Email' in html_content
            assert '24 horas' in html_content
            assert '© 2025 RE-EDUCA Store' in html_content
    
    def test_email_templates_responsive_design(self, email_service, mock_smtp):
        """Testa se os templates são responsivos"""
        # Mock das credenciais
        email_service.smtp_username = 'test@example.com'
        email_service.smtp_password = 'test_password'
        
        with patch.dict(os.environ, {'FRONTEND_URL': 'https://app.re-educa.com'}):
            email_service.send_verification_email(
                'test@example.com', 'Test User', 'token123'
            )
            
            call_args = mock_smtp.return_value.__enter__.return_value.send_message.call_args[0][0]
            html_content = call_args.get_payload()[1].get_payload()
            
            # Elementos de design responsivo
            assert 'viewport' in html_content
            assert 'max-width' in html_content
            assert 'border-radius' in html_content
            assert 'padding' in html_content
            assert 'margin' in html_content
    
    def test_email_templates_accessibility(self, email_service, mock_smtp):
        """Testa acessibilidade dos templates"""
        # Mock das credenciais
        email_service.smtp_username = 'test@example.com'
        email_service.smtp_password = 'test_password'
        
        with patch.dict(os.environ, {'FRONTEND_URL': 'https://app.re-educa.com'}):
            email_service.send_verification_email(
                'test@example.com', 'Test User', 'token123'
            )
            
            call_args = mock_smtp.return_value.__enter__.return_value.send_message.call_args[0][0]
            html_content = call_args.get_payload()[1].get_payload()
            
            # Elementos de acessibilidade
            assert '<html>' in html_content
            assert '<head>' in html_content
            assert '<body>' in html_content
            assert 'charset="utf-8"' in html_content
            assert 'lang="pt-BR"' in html_content or 'lang="pt"' in html_content
    
    def test_email_service_error_handling(self, email_service, mock_smtp):
        """Testa tratamento de erros no serviço de email"""
        # Mock do SMTP para retornar erro
        mock_smtp.side_effect = Exception('SMTP Error')
        
        result = email_service.send_verification_email(
            'test@example.com', 'Test User', 'token123'
        )
        
        assert result is False
    
    def test_email_service_without_credentials(self, email_service, mock_smtp):
        """Testa serviço de email sem credenciais"""
        # Remove credenciais
        email_service.smtp_username = None
        email_service.smtp_password = None
        
        with pytest.raises(Exception):
            email_service._create_connection()

if __name__ == '__main__':
    pytest.main([__file__])