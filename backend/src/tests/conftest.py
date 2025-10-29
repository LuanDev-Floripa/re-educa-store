import pytest
import os
import sys
import tempfile
from unittest.mock import Mock, patch, AsyncMock, MagicMock
from datetime import datetime, timedelta, timezone
from functools import wraps
import jwt

# Adiciona o diretório src ao path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

# Configurações de teste
os.environ['SECRET_KEY'] = 'test-secret-key'
os.environ['SUPABASE_URL'] = 'https://test.supabase.co'
os.environ['SUPABASE_KEY'] = 'test-key'
os.environ['USDA_API_KEY'] = 'test-usda-key'

@pytest.fixture
def app():
    """Fixture para criar a aplicação Flask de teste"""
    from app import create_app
    app = create_app()
    
    app.config['TESTING'] = True
    app.config['SECRET_KEY'] = 'test-secret-key'
    
    # Configuração temporária para testes
    with app.app_context():
        yield app

@pytest.fixture
def client(app):
    """Fixture para criar cliente de teste"""
    return app.test_client()

@pytest.fixture
def mock_supabase():
    """Mock do cliente Supabase"""
    mock_client = Mock()
    
    # Mock das tabelas
    mock_users_table = Mock()
    mock_user_profiles_table = Mock()
    mock_imc_history_table = Mock()
    mock_user_activities_table = Mock()
    
    # Configuração dos mocks
    mock_client.table.return_value = mock_users_table
    mock_users_table.select.return_value = mock_users_table
    mock_users_table.eq.return_value = mock_users_table
    mock_users_table.insert.return_value = mock_users_table
    mock_users_table.update.return_value = mock_users_table
    mock_users_table.execute.return_value = Mock(data=[])
    
    return mock_client

@pytest.fixture
def mock_user_data():
    """Dados de usuário para testes"""
    return {
        'id': 'test-user-id',
        'email': 'test@example.com',
        'name': 'Test User',
        'role': 'user',
        'is_active': True,
        'created_at': datetime.now(timezone.utc).isoformat(),
        'subscription_plan': 'free',
        'password_hash': 'hashed_password'
    }

@pytest.fixture
def mock_token(mock_user_data):
    """Token JWT válido para testes"""
    payload = {
        'user_id': mock_user_data['id'],
        'exp': datetime.now(timezone.utc) + timedelta(days=7)
    }
    return jwt.encode(payload, 'test-secret-key', algorithm='HS256')

@pytest.fixture
def auth_headers(mock_token):
    """Headers de autenticação para testes"""
    return {'Authorization': f'Bearer {mock_token}'}

@pytest.fixture
def mock_requests():
    """Mock da biblioteca requests"""
    with patch('main.requests') as mock_req:
        yield mock_req

@pytest.fixture
def mock_bcrypt():
    """Mock da biblioteca bcrypt"""
    with patch('main.bcrypt') as mock_bc:
        yield mock_bc

@pytest.fixture
def mock_jwt():
    """Mock da biblioteca JWT"""
    with patch('main.jwt') as mock_jwt_lib:
        # Mock do decode para retornar dados do usuário
        mock_jwt_lib.decode.return_value = {'user_id': 'test-user-id'}
        yield mock_jwt_lib

@pytest.fixture
def mock_token_required():
    """Mock do decorator token_required"""
    def mock_decorator(f):
        @wraps(f)
        def decorated(*args, **kwargs):
            # Simula usuário autenticado
            request.current_user = {
                'id': 'test-user-id',
                'email': 'test@example.com',
                'name': 'Test User',
                'role': 'user',
                'subscription_plan': 'free'
            }
            return f(*args, **kwargs)
        return decorated
    return mock_decorator

@pytest.fixture
def mock_supabase_client():
    """Mock mais robusto do cliente Supabase"""
    with patch('main.supabase') as mock_supabase:
        # Mock da tabela users
        mock_users_table = Mock()
        mock_users_table.select.return_value = mock_users_table
        mock_users_table.eq.return_value = mock_users_table
        mock_users_table.insert.return_value = mock_users_table
        mock_users_table.update.return_value = mock_users_table
        mock_users_table.execute.return_value = Mock(data=[{
            'id': 'test-user-id',
            'email': 'test@example.com',
            'name': 'Test User',
            'role': 'user'
        }])
        
        mock_supabase.table.return_value = mock_users_table
        yield mock_supabase

@pytest.fixture
def mock_supabase_tables():
    """Mock completo das tabelas Supabase"""
    with patch('main.supabase') as mock_supabase:
        # Mock da tabela users
        mock_users_table = Mock()
        mock_users_table.select.return_value = mock_users_table
        mock_users_table.eq.return_value = mock_users_table
        mock_users_table.insert.return_value = mock_users_table
        mock_users_table.update.return_value = mock_users_table
        mock_users_table.execute.return_value = Mock(data=[{
            'id': 'test-user-id',
            'email': 'test@example.com',
            'name': 'Test User',
            'role': 'user',
            'is_active': True,
            'created_at': datetime.now(timezone.utc).isoformat(),
            'subscription_plan': 'free'
        }])
        
        # Mock da tabela user_profiles
        mock_profiles_table = Mock()
        mock_profiles_table.select.return_value = mock_profiles_table
        mock_profiles_table.eq.return_value = mock_profiles_table
        mock_profiles_table.insert.return_value = mock_profiles_table
        mock_profiles_table.update.return_value = mock_profiles_table
        mock_profiles_table.execute.return_value = Mock(data=[])
        
        # Mock da tabela imc_history
        mock_imc_table = Mock()
        mock_imc_table.select.return_value = mock_imc_table
        mock_imc_table.eq.return_value = mock_imc_table
        mock_imc_table.insert.return_value = mock_imc_table
        mock_imc_table.order.return_value = mock_imc_table
        mock_imc_table.limit.return_value = mock_imc_table
        mock_imc_table.execute.return_value = Mock(data=[])
        
        # Mock da tabela user_activities
        mock_activities_table = Mock()
        mock_activities_table.insert.return_value = mock_activities_table
        mock_activities_table.execute.return_value = Mock(data=[])
        
        # Configura o mock para retornar a tabela apropriada
        def mock_table(table_name):
            if table_name == 'users':
                return mock_users_table
            elif table_name == 'user_profiles':
                return mock_profiles_table
            elif table_name == 'imc_history':
                return mock_imc_table
            elif table_name == 'user_activities':
                return mock_activities_table
            else:
                return Mock()
        
        mock_supabase.table.side_effect = mock_table
        yield mock_supabase

@pytest.fixture
def mock_requests_get():
    """Mock específico para requests.get"""
    with patch('main.requests.get') as mock_get:
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            'foods': [
                {
                    'fdcId': '12345',
                    'description': 'Test Food',
                    'brandOwner': 'Test Brand',
                    'ingredients': 'Test ingredients',
                    'foodNutrients': [
                        {
                            'nutrientName': 'Energy',
                            'value': 100,
                            'unitName': 'KCAL'
                        }
                    ]
                }
            ]
        }
        mock_get.return_value = mock_response
        yield mock_get

@pytest.fixture
def mock_token_required_decorator():
    """Mock do decorator token_required que funciona corretamente"""
    def mock_decorator(f):
        @wraps(f)
        def decorated(*args, **kwargs):
            # Simula usuário autenticado diretamente no request
            from flask import request
            request.current_user = {
                'id': 'test-user-id',
                'email': 'test@example.com',
                'name': 'Test User',
                'role': 'user',
                'subscription_plan': 'free'
            }
            return f(*args, **kwargs)
        return decorated
    return mock_decorator