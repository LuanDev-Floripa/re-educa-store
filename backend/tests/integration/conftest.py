"""
Configuração compartilhada para testes de integração.
"""
import pytest
import os
import sys
from unittest.mock import patch

# Adiciona o diretório src ao path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../../src'))

from app import create_app


@pytest.fixture(scope='session')
def app():
    """Cria instância da aplicação Flask para testes."""
    app, socketio = create_app('testing')
    app.config['TESTING'] = True
    app.config['SECRET_KEY'] = 'test-secret-key'
    app.config['WTF_CSRF_ENABLED'] = False
    
    # Configurações de teste
    with app.app_context():
        yield app


@pytest.fixture(scope='session')
def client(app):
    """Cria cliente de teste para requisições HTTP."""
    return app.test_client()


@pytest.fixture
def auth_headers():
    """Retorna headers de autenticação para testes."""
    # Mock token - em produção, gerar token real ou usar fixture de auth
    return {
        'Authorization': 'Bearer test-token',
        'Content-Type': 'application/json'
    }


@pytest.fixture
def mock_user():
    """Mock de usuário para testes."""
    return {
        'id': 'test-user-id',
        'email': 'test@example.com',
        'name': 'Test User',
        'role': 'user'
    }


@pytest.fixture
def mock_token_required(app):
    """Mock do decorator token_required para permitir testes sem autenticação real."""
    def mock_decorator(func):
        def wrapper(*args, **kwargs):
            # Simula usuário autenticado
            from flask import request
            request.current_user = {
                'id': 'test-user-id',
                'email': 'test@example.com',
                'name': 'Test User'
            }
            return func(*args, **kwargs)
        wrapper.__name__ = func.__name__
        return wrapper
    return mock_decorator


@pytest.fixture(autouse=True)
def mock_environment(monkeypatch):
    """Mock de variáveis de ambiente para testes."""
    monkeypatch.setenv('FLASK_ENV', 'testing')
    monkeypatch.setenv('SECRET_KEY', 'test-secret-key')
    monkeypatch.setenv('SUPABASE_URL', 'https://test.supabase.co')
    monkeypatch.setenv('SUPABASE_KEY', 'test-key')
