"""
Configurações de Testes Pytest RE-EDUCA Store.

Centraliza fixtures e configurações de testes incluindo:
- Fixtures da aplicação Flask
- Mocks do Supabase
- Mocks de autenticação
- Variáveis de ambiente de teste
- Setup e teardown de testes

IMPORTANTE:
- Fixtures são compartilhadas entre todos os testes
- Usar mocks para evitar chamadas reais às APIs
- Limpar estado entre testes
"""

import os
import sys
from datetime import datetime, timedelta, timezone
from functools import wraps
from unittest.mock import Mock, patch

import jwt
import pytest

# Adiciona o diretório src ao path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

# Configurações de teste
os.environ["SECRET_KEY"] = "test-secret-key"
os.environ["SUPABASE_URL"] = "https://test.supabase.co"
os.environ["SUPABASE_KEY"] = "test-key"
os.environ["USDA_API_KEY"] = "test-usda-key"


@pytest.fixture
def app():
    """
    Fixture para criar a aplicação Flask de teste.

    Yields:
        Flask: App configurada para testes.
    """
    from app import create_app

    app = create_app()

    app.config["TESTING"] = True
    app.config["SECRET_KEY"] = "test-secret-key"

    # Configuração temporária para testes
    with app.app_context():
        yield app


@pytest.fixture
def client(app):
    """Fixture para criar cliente de teste"""
    return app.test_client()


@pytest.fixture
def mock_supabase():
    """Mock do cliente Supabase - Melhorado para testes de services"""
    mock_client = Mock()

    # Mock das tabelas
    mock_users_table = Mock()
    mock_user_profiles_table = Mock()
    mock_imc_history_table = Mock()
    mock_user_activities_table = Mock()
    mock_products_table = Mock()
    mock_orders_table = Mock()
    mock_exercises_table = Mock()

    # Configuração padrão para métodos encadeados

    def setup_mock_table(table):
        table.select.return_value = table
        table.eq.return_value = table
        table.insert.return_value = table
        table.update.return_value = table
        table.delete.return_value = table
        table.order.return_value = table
        table.limit.return_value = table
        table.range.return_value = table
        table.gte.return_value = table
        table.lte.return_value = table
        table.in_.return_value = table
        table.execute.return_value = Mock(data=[], count=0)
        return table

    mock_users_table = setup_mock_table(mock_users_table)
    mock_user_profiles_table = setup_mock_table(mock_user_profiles_table)
    mock_imc_history_table = setup_mock_table(mock_imc_history_table)
    mock_user_activities_table = setup_mock_table(mock_user_activities_table)
    mock_products_table = setup_mock_table(mock_products_table)
    mock_orders_table = setup_mock_table(mock_orders_table)
    mock_exercises_table = setup_mock_table(mock_exercises_table)

    # Configura retorno de tabela baseado no nome

    def mock_table(table_name):
        tables = {
            "users": mock_users_table,
            "user_profiles": mock_user_profiles_table,
            "imc_calculations": mock_imc_history_table,
            "user_activities": mock_user_activities_table,
            "products": mock_products_table,
            "orders": mock_orders_table,
            "exercises": mock_exercises_table,
        }
        return tables.get(table_name, setup_mock_table(Mock()))

    mock_client.table.side_effect = mock_table
    mock_client.get_user_by_email = Mock(return_value=None)
    mock_client.create_user = Mock(return_value={"id": "new-user-123"})
    mock_client.update_user = Mock(return_value={"id": "user-123"})

    return mock_client


@pytest.fixture
def mock_user_data():
    """Dados de usuário para testes"""
    return {
        "id": "test-user-id",
        "email": "test@example.com",
        "name": "Test User",
        "role": "user",
        "is_active": True,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "subscription_plan": "free",
        "password_hash": "hashed_password",
    }


@pytest.fixture
def mock_token(mock_user_data):
    """Token JWT válido para testes"""
    payload = {"user_id": mock_user_data["id"], "exp": datetime.now(timezone.utc) + timedelta(days=7)}
    return jwt.encode(payload, "test-secret-key", algorithm="HS256")


@pytest.fixture
def auth_headers(mock_token):
    """Headers de autenticação para testes"""
    return {"Authorization": f"Bearer {mock_token}"}


@pytest.fixture
def mock_requests():
    """Mock da biblioteca requests"""
    with patch("main.requests") as mock_req:
        yield mock_req


@pytest.fixture
def mock_bcrypt():
    """Mock da biblioteca bcrypt"""
    with patch("main.bcrypt") as mock_bc:
        yield mock_bc


@pytest.fixture
def mock_jwt():
    """Mock da biblioteca JWT"""
    with patch("main.jwt") as mock_jwt_lib:
        # Mock do decode para retornar dados do usuário
        mock_jwt_lib.decode.return_value = {"user_id": "test-user-id"}
        yield mock_jwt_lib


@pytest.fixture
def mock_token_required():
    """Mock do decorator token_required"""

    def mock_decorator(f):
        @wraps(f)
        def decorated(*args, **kwargs):
            # Simula usuário autenticado
            from flask import request

            request.current_user = {
                "id": "test-user-id",
                "email": "test@example.com",
                "name": "Test User",
                "role": "user",
                "subscription_plan": "free",
            }
            return f(*args, **kwargs)

        return decorated

    return mock_decorator


@pytest.fixture
def mock_supabase_client():
    """Mock mais robusto do cliente Supabase"""
    with patch("main.supabase") as mock_supabase:
        # Mock da tabela users
        mock_users_table = Mock()
        mock_users_table.select.return_value = mock_users_table
        mock_users_table.eq.return_value = mock_users_table
        mock_users_table.insert.return_value = mock_users_table
        mock_users_table.update.return_value = mock_users_table
        mock_users_table.execute.return_value = Mock(
            data=[{"id": "test-user-id", "email": "test@example.com", "name": "Test User", "role": "user"}]
        )

        mock_supabase.table.return_value = mock_users_table
        yield mock_supabase


@pytest.fixture
def mock_supabase_tables():
    """Mock completo das tabelas Supabase"""
    with patch("main.supabase") as mock_supabase:
        # Mock da tabela users
        mock_users_table = Mock()
        mock_users_table.select.return_value = mock_users_table
        mock_users_table.eq.return_value = mock_users_table
        mock_users_table.insert.return_value = mock_users_table
        mock_users_table.update.return_value = mock_users_table
        mock_users_table.execute.return_value = Mock(
            data=[
                {
                    "id": "test-user-id",
                    "email": "test@example.com",
                    "name": "Test User",
                    "role": "user",
                    "is_active": True,
                    "created_at": datetime.now(timezone.utc).isoformat(),
                    "subscription_plan": "free",
                }
            ]
        )

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
            if table_name == "users":
                return mock_users_table
            elif table_name == "user_profiles":
                return mock_profiles_table
            elif table_name == "imc_history":
                return mock_imc_table
            elif table_name == "user_activities":
                return mock_activities_table
            else:
                return Mock()

        mock_supabase.table.side_effect = mock_table
        yield mock_supabase


@pytest.fixture
def mock_requests_get():
    """Mock específico para requests.get"""
    with patch("main.requests.get") as mock_get:
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "foods": [
                {
                    "fdcId": "12345",
                    "description": "Test Food",
                    "brandOwner": "Test Brand",
                    "ingredients": "Test ingredients",
                    "foodNutrients": [{"nutrientName": "Energy", "value": 100, "unitName": "KCAL"}],
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
                "id": "test-user-id",
                "email": "test@example.com",
                "name": "Test User",
                "role": "user",
                "subscription_plan": "free",
            }
            return f(*args, **kwargs)

        return decorated

    return mock_decorator
