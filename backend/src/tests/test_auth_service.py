# -*- coding: utf-8 -*-
"""
Testes Unitários para AuthService RE-EDUCA Store.
"""
import pytest
from unittest.mock import Mock, patch, MagicMock
from services.auth_service import AuthService


@pytest.fixture
def mock_supabase_client():
    """Mock do Supabase client"""
    mock_client = Mock()
    mock_client.get_user_by_email.return_value = None
    mock_client.create_user.return_value = {'id': 'new-user-123', 'email': 'test@example.com'}
    return mock_client


@pytest.fixture
def auth_service(mock_supabase_client):
    """Fixture para AuthService"""
    with patch('services.auth_service.supabase_client', mock_supabase_client):
        service = AuthService()
        service.supabase = mock_supabase_client
        return service


class TestAuthService:
    """Testes para AuthService"""
    
    def test_register_user_success(self, auth_service, mock_supabase_client):
        """Testa registro de novo usuário"""
        # Arrange
        user_data = {
            'email': 'newuser@example.com',
            'password': 'SecurePass123!',
            'name': 'New User'
        }
        mock_supabase_client.get_user_by_email.return_value = None
        
        # Act
        result = auth_service.register_user(user_data)
        
        # Assert
        assert result['success'] is True
        assert 'user' in result or 'token' in result
        mock_supabase_client.get_user_by_email.assert_called_once()
    
    def test_register_user_email_exists(self, auth_service, mock_supabase_client):
        """Testa registro com email já existente"""
        # Arrange
        user_data = {
            'email': 'existing@example.com',
            'password': 'SecurePass123!',
            'name': 'Existing User'
        }
        mock_supabase_client.get_user_by_email.return_value = {'id': 'existing-123'}
        
        # Act
        result = auth_service.register_user(user_data)
        
        # Assert
        assert result['success'] is False
        assert 'já está em uso' in result.get('error', '')
    
    def test_update_user_profile_success(self, auth_service, mock_supabase_client):
        """Testa atualização de perfil"""
        # Arrange
        user_id = 'user-123'
        profile_data = {
            'name': 'Updated Name',
            'phone': '11999999999'
        }
        mock_supabase_client.update_user.return_value = {
            'id': user_id,
            **profile_data
        }
        
        # Act
        result = auth_service.update_user_profile(user_id, profile_data)
        
        # Assert
        assert result['success'] is True
        mock_supabase_client.update_user.assert_called_once()