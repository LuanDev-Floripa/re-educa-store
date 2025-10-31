"""
Testes para Rotas de Usuário RE-EDUCA Store.

Cobre funcionalidades de perfil de usuário incluindo:
- Obtenção de perfil completo
- Atualização de dados do perfil
- Validação de campos (altura, peso, gênero, etc.)
- Níveis de atividade
- Objetivos de saúde
- Criação de novos perfis
"""
import pytest
import json
from unittest.mock import patch, Mock
from app import create_app
app = create_app()

@pytest.fixture
def client():
    """Cliente Flask de teste."""
    app.config['TESTING'] = True
    return app.test_client()

@pytest.fixture
def auth_headers():
    """Headers de autenticação para testes."""
    return {'Authorization': 'Bearer test-token'}

class TestUserRoutes:
    """
    Testes para as rotas de usuário RE-EDUCA Store.
    
    Suite completa de testes para rotas de perfil incluindo:
    - CRUD de perfis
    - Validações de dados
    - Cenários de sucesso e erro
    """
    
    @patch('main.token_required')
    @patch('main.supabase')
    def test_get_profile_success(self, mock_supabase, mock_token_required, client, auth_headers):
        """Testa obtenção de perfil bem-sucedida"""
        # Mock do decorator token_required
        def mock_decorator(f):
            def decorated(*args, **kwargs):
                from flask import request
                request.current_user = {
                    'id': 'test-user-id',
                    'email': 'test@example.com',
                    'name': 'Test User',
                    'role': 'user',
                    'subscription_plan': 'free',
                    'created_at': '2023-01-01T00:00:00Z'
                }
                return f(*args, **kwargs)
            return decorated
        
        mock_token_required.side_effect = mock_decorator
        
        # Mock da tabela user_profiles
        mock_profiles_table = Mock()
        mock_profiles_table.select.return_value = mock_profiles_table
        mock_profiles_table.eq.return_value = mock_profiles_table
        mock_profiles_table.execute.return_value = Mock(data=[{
            'id': 'profile-1',
            'user_id': 'test-user-id',
            'birth_date': '1990-01-01',
            'gender': 'M',
            'height': 170,
            'weight': 70,
            'activity_level': 'moderate'
        }])
        
        mock_supabase.table.return_value = mock_profiles_table
        
        response = client.get('/api/user/profile', headers=auth_headers)
        
        # Assert: Status HTTP deve ser 200 (sucesso)
        assert response.status_code == 200, f"Esperado 200, recebido {response.status_code}"
        
        # Assert: Resposta deve conter dados JSON válidos
        data = json.loads(response.data)
        assert isinstance(data, dict), "Resposta deve ser um objeto JSON"
        
        # Assert: Deve conter campos obrigatórios
        assert 'user' in data, "Resposta deve conter campo 'user'"
        assert 'profile' in data, "Resposta deve conter campo 'profile'"
        assert isinstance(data['user'], dict), "Campo 'user' deve ser um dicionário"
        assert isinstance(data['profile'], dict), "Campo 'profile' deve ser um dicionário"
        
        # Assert: Dados do usuário devem corresponder
        assert data['user']['email'] == 'test@example.com', "Email deve corresponder"
        assert data['profile']['height'] == 170, "Altura deve corresponder"
    
    @patch('main.token_required')
    @patch('main.supabase')
    def test_get_profile_no_extended_profile(self, mock_supabase, mock_token_required, client, auth_headers):
        """Testa obtenção de perfil sem perfil estendido"""
        # Mock do decorator token_required
        def mock_decorator(f):
            def decorated(*args, **kwargs):
                from flask import request
                request.current_user = {
                    'id': 'test-user-id',
                    'email': 'test@example.com',
                    'name': 'Test User',
                    'role': 'user',
                    'subscription_plan': 'free',
                    'created_at': '2023-01-01T00:00:00Z'
                }
                return f(*args, **kwargs)
            return decorated
        
        mock_token_required.side_effect = mock_decorator
        
        # Mock da tabela user_profiles (sem dados)
        mock_profiles_table = Mock()
        mock_profiles_table.select.return_value = mock_profiles_table
        mock_profiles_table.eq.return_value = mock_profiles_table
        mock_profiles_table.execute.return_value = Mock(data=[])
        
        mock_supabase.table.return_value = mock_profiles_table
        
        response = client.get('/api/user/profile', headers=auth_headers)
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'user' in data
        assert 'profile' in data
        assert data['profile'] == {}  # Perfil vazio
    
    @patch('main.token_required')
    @patch('main.supabase')
    def test_update_profile_success(self, mock_supabase, mock_token_required, client, auth_headers):
        """Testa atualização de perfil bem-sucedida"""
        # Mock do decorator token_required
        def mock_decorator(f):
            def decorated(*args, **kwargs):
                from flask import request
                request.current_user = {
                    'id': 'test-user-id',
                    'email': 'test@example.com',
                    'name': 'Test User',
                    'role': 'user'
                }
                return f(*args, **kwargs)
            return decorated
        
        mock_token_required.side_effect = mock_decorator
        
        # Mock da tabela users
        mock_users_table = Mock()
        mock_users_table.update.return_value = mock_users_table
        mock_users_table.eq.return_value = mock_users_table
        mock_users_table.execute.return_value = Mock(data=[])
        
        # Mock da tabela user_profiles
        mock_profiles_table = Mock()
        mock_profiles_table.select.return_value = mock_profiles_table
        mock_profiles_table.eq.return_value = mock_profiles_table
        mock_profiles_table.execute.return_value = Mock(data=[{
            'id': 'profile-1',
            'user_id': 'test-user-id'
        }])
        mock_profiles_table.update.return_value = mock_profiles_table
        
        # Mock da tabela user_activities
        mock_activities_table = Mock()
        mock_activities_table.insert.return_value = mock_activities_table
        mock_activities_table.execute.return_value = Mock(data=[])
        
        def mock_table(table_name):
            if table_name == 'users':
                return mock_users_table
            elif table_name == 'user_profiles':
                return mock_profiles_table
            elif table_name == 'user_activities':
                return mock_activities_table
            else:
                return Mock()
        
        mock_supabase.table.side_effect = mock_table
        
        response = client.put('/api/user/profile', 
                            json={'name': 'Updated Name', 'height': 175},
                            headers=auth_headers)
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'message' in data
    
    @patch('main.token_required')
    @patch('main.supabase')
    def test_update_profile_new_profile(self, mock_supabase, mock_token_required, client, auth_headers):
        """Testa criação de novo perfil"""
        # Mock do decorator token_required
        def mock_decorator(f):
            def decorated(*args, **kwargs):
                from flask import request
                request.current_user = {
                    'id': 'test-user-id',
                    'email': 'test@example.com',
                    'name': 'Test User',
                    'role': 'user'
                }
                return f(*args, **kwargs)
            return decorated
        
        mock_token_required.side_effect = mock_decorator
        
        # Mock da tabela users
        mock_users_table = Mock()
        mock_users_table.update.return_value = mock_users_table
        mock_users_table.eq.return_value = mock_users_table
        mock_users_table.execute.return_value = Mock(data=[])
        
        # Mock da tabela user_profiles (sem perfil existente)
        mock_profiles_table = Mock()
        mock_profiles_table.select.return_value = mock_profiles_table
        mock_profiles_table.eq.return_value = mock_profiles_table
        mock_profiles_table.execute.return_value = Mock(data=[])
        mock_profiles_table.insert.return_value = mock_profiles_table
        mock_profiles_table.execute.return_value = Mock(data=[])
        
        # Mock da tabela user_activities
        mock_activities_table = Mock()
        mock_activities_table.insert.return_value = mock_activities_table
        mock_activities_table.execute.return_value = Mock(data=[])
        
        def mock_table(table_name):
            if table_name == 'users':
                return mock_users_table
            elif table_name == 'user_profiles':
                return mock_profiles_table
            elif table_name == 'user_activities':
                return mock_activities_table
            else:
                return Mock()
        
        mock_supabase.table.side_effect = mock_table
        
        response = client.put('/api/user/profile', 
                            json={'height': 180, 'weight': 75},
                            headers=auth_headers)
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'message' in data
    
    @patch('main.token_required')
    @patch('main.supabase')
    def test_update_profile_name_only(self, mock_supabase, mock_token_required, client, auth_headers):
        """Testa atualização apenas do nome"""
        # Mock do decorator token_required
        def mock_decorator(f):
            def decorated(*args, **kwargs):
                from flask import request
                request.current_user = {
                    'id': 'test-user-id',
                    'email': 'test@example.com',
                    'name': 'Test User',
                    'role': 'user'
                }
                return f(*args, **kwargs)
            return decorated
        
        mock_token_required.side_effect = mock_decorator
        
        # Mock da tabela users
        mock_users_table = Mock()
        mock_users_table.update.return_value = mock_users_table
        mock_users_table.eq.return_value = mock_users_table
        mock_users_table.execute.return_value = Mock(data=[])
        
        # Mock da tabela user_profiles
        mock_profiles_table = Mock()
        mock_profiles_table.select.return_value = mock_profiles_table
        mock_profiles_table.eq.return_value = mock_profiles_table
        mock_profiles_table.execute.return_value = Mock(data=[{
            'id': 'profile-1',
            'user_id': 'test-user-id'
        }])
        mock_profiles_table.update.return_value = mock_profiles_table
        
        # Mock da tabela user_activities
        mock_activities_table = Mock()
        mock_activities_table.insert.return_value = mock_activities_table
        mock_activities_table.execute.return_value = Mock(data=[])
        
        def mock_table(table_name):
            if table_name == 'users':
                return mock_users_table
            elif table_name == 'user_profiles':
                return mock_profiles_table
            elif table_name == 'user_activities':
                return mock_activities_table
            else:
                return Mock()
        
        mock_supabase.table.side_effect = mock_table
        
        response = client.put('/api/user/profile', 
                            json={'name': 'New Name'},
                            headers=auth_headers)
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'message' in data
    
    @patch('main.token_required')
    @patch('main.supabase')
    def test_update_profile_invalid_fields(self, mock_supabase, mock_token_required, client, auth_headers):
        """Testa atualização com campos inválidos"""
        # Mock do decorator token_required
        def mock_decorator(f):
            def decorated(*args, **kwargs):
                from flask import request
                request.current_user = {
                    'id': 'test-user-id',
                    'email': 'test@example.com',
                    'name': 'Test User',
                    'role': 'user'
                }
                return f(*args, **kwargs)
            return decorated
        
        mock_token_required.side_effect = mock_decorator
        
        # Mock da tabela users
        mock_users_table = Mock()
        mock_users_table.update.return_value = mock_users_table
        mock_users_table.eq.return_value = mock_users_table
        mock_users_table.execute.return_value = Mock(data=[])
        
        # Mock da tabela user_profiles
        mock_profiles_table = Mock()
        mock_profiles_table.select.return_value = mock_profiles_table
        mock_profiles_table.eq.return_value = mock_profiles_table
        mock_profiles_table.execute.return_value = Mock(data=[{
            'id': 'profile-1',
            'user_id': 'test-user-id'
        }])
        mock_profiles_table.update.return_value = mock_profiles_table
        
        # Mock da tabela user_activities
        mock_activities_table = Mock()
        mock_activities_table.insert.return_value = mock_activities_table
        mock_activities_table.execute.return_value = Mock(data=[])
        
        def mock_table(table_name):
            if table_name == 'users':
                return mock_users_table
            elif table_name == 'user_profiles':
                return mock_profiles_table
            elif table_name == 'user_activities':
                return mock_activities_table
            else:
                return Mock()
        
        mock_supabase.table.side_effect = mock_table
        
        # Campos inválidos são ignorados
        response = client.put('/api/user/profile', 
                            json={'invalid_field': 'value', 'height': 170},
                            headers=auth_headers)
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'message' in data
    
    @patch('main.token_required')
    @patch('main.supabase')
    def test_update_profile_empty_data(self, mock_supabase, mock_token_required, client, auth_headers):
        """Testa atualização com dados vazios"""
        # Mock do decorator token_required
        def mock_decorator(f):
            def decorated(*args, **kwargs):
                from flask import request
                request.current_user = {
                    'id': 'test-user-id',
                    'email': 'test@example.com',
                    'name': 'Test User',
                    'role': 'user'
                }
                return f(*args, **kwargs)
            return decorated
        
        mock_token_required.side_effect = mock_decorator
        
        # Mock da tabela users
        mock_users_table = Mock()
        mock_users_table.update.return_value = mock_users_table
        mock_users_table.eq.return_value = mock_users_table
        mock_users_table.execute.return_value = Mock(data=[])
        
        # Mock da tabela user_profiles
        mock_profiles_table = Mock()
        mock_profiles_table.select.return_value = mock_profiles_table
        mock_profiles_table.eq.return_value = mock_profiles_table
        mock_profiles_table.execute.return_value = Mock(data=[{
            'id': 'profile-1',
            'user_id': 'test-user-id'
        }])
        
        # Mock da tabela user_activities
        mock_activities_table = Mock()
        mock_activities_table.insert.return_value = mock_activities_table
        mock_activities_table.execute.return_value = Mock(data=[])
        
        def mock_table(table_name):
            if table_name == 'users':
                return mock_users_table
            elif table_name == 'user_profiles':
                return mock_profiles_table
            elif table_name == 'user_activities':
                return mock_activities_table
            else:
                return Mock()
        
        mock_supabase.table.side_effect = mock_table
        
        response = client.put('/api/user/profile', 
                            json={},
                            headers=auth_headers)
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'message' in data
    
    @patch('main.token_required')
    @patch('main.supabase')
    def test_profile_validation_height(self, mock_supabase, mock_token_required, client, auth_headers):
        """Testa validação de altura"""
        # Mock do decorator token_required
        def mock_decorator(f):
            def decorated(*args, **kwargs):
                from flask import request
                request.current_user = {
                    'id': 'test-user-id',
                    'email': 'test@example.com',
                    'name': 'Test User',
                    'role': 'user'
                }
                return f(*args, **kwargs)
            return decorated
        
        mock_token_required.side_effect = mock_decorator
        
        # Mock das tabelas
        mock_users_table = Mock()
        mock_users_table.update.return_value = mock_users_table
        mock_users_table.eq.return_value = mock_users_table
        mock_users_table.execute.return_value = Mock(data=[])
        
        mock_profiles_table = Mock()
        mock_profiles_table.select.return_value = mock_profiles_table
        mock_profiles_table.eq.return_value = mock_profiles_table
        mock_profiles_table.execute.return_value = Mock(data=[{
            'id': 'profile-1',
            'user_id': 'test-user-id'
        }])
        mock_profiles_table.update.return_value = mock_profiles_table
        
        mock_activities_table = Mock()
        mock_activities_table.insert.return_value = mock_activities_table
        mock_activities_table.execute.return_value = Mock(data=[])
        
        def mock_table(table_name):
            if table_name == 'users':
                return mock_users_table
            elif table_name == 'user_profiles':
                return mock_profiles_table
            elif table_name == 'user_activities':
                return mock_activities_table
            else:
                return Mock()
        
        mock_supabase.table.side_effect = mock_table
        
        # Testa diferentes alturas
        heights = [150, 170, 200]
        
        for height in heights:
            response = client.put('/api/user/profile', 
                                json={'height': height},
                                headers=auth_headers)
            assert response.status_code == 200
    
    @patch('main.token_required')
    @patch('main.supabase')
    def test_profile_validation_weight(self, mock_supabase, mock_token_required, client, auth_headers):
        """Testa validação de peso"""
        # Mock do decorator token_required
        def mock_decorator(f):
            def decorated(*args, **kwargs):
                from flask import request
                request.current_user = {
                    'id': 'test-user-id',
                    'email': 'test@example.com',
                    'name': 'Test User',
                    'role': 'user'
                }
                return f(*args, **kwargs)
            return decorated
        
        mock_token_required.side_effect = mock_decorator
        
        # Mock das tabelas
        mock_users_table = Mock()
        mock_users_table.update.return_value = mock_users_table
        mock_users_table.eq.return_value = mock_users_table
        mock_users_table.execute.return_value = Mock(data=[])
        
        mock_profiles_table = Mock()
        mock_profiles_table.select.return_value = mock_profiles_table
        mock_profiles_table.eq.return_value = mock_profiles_table
        mock_profiles_table.execute.return_value = Mock(data=[{
            'id': 'profile-1',
            'user_id': 'test-user-id'
        }])
        mock_profiles_table.update.return_value = mock_profiles_table
        
        mock_activities_table = Mock()
        mock_activities_table.insert.return_value = mock_activities_table
        mock_activities_table.execute.return_value = Mock(data=[])
        
        def mock_table(table_name):
            if table_name == 'users':
                return mock_users_table
            elif table_name == 'user_profiles':
                return mock_profiles_table
            elif table_name == 'user_activities':
                return mock_activities_table
            else:
                return Mock()
        
        mock_supabase.table.side_effect = mock_table
        
        # Testa diferentes pesos
        weights = [40, 70, 120]
        
        for weight in weights:
            response = client.put('/api/user/profile', 
                                json={'weight': weight},
                                headers=auth_headers)
            assert response.status_code == 200
    
    @patch('main.token_required')
    @patch('main.supabase')
    def test_profile_activity_levels(self, mock_supabase, mock_token_required, client, auth_headers):
        """Testa níveis de atividade"""
        # Mock do decorator token_required
        def mock_decorator(f):
            def decorated(*args, **kwargs):
                from flask import request
                request.current_user = {
                    'id': 'test-user-id',
                    'email': 'test@example.com',
                    'name': 'Test User',
                    'role': 'user'
                }
                return f(*args, **kwargs)
            return decorated
        
        mock_token_required.side_effect = mock_decorator
        
        # Mock das tabelas
        mock_users_table = Mock()
        mock_users_table.update.return_value = mock_users_table
        mock_users_table.eq.return_value = mock_users_table
        mock_users_table.execute.return_value = Mock(data=[])
        
        mock_profiles_table = Mock()
        mock_profiles_table.select.return_value = mock_profiles_table
        mock_profiles_table.eq.return_value = mock_profiles_table
        mock_profiles_table.execute.return_value = Mock(data=[{
            'id': 'profile-1',
            'user_id': 'test-user-id'
        }])
        mock_profiles_table.update.return_value = mock_profiles_table
        
        mock_activities_table = Mock()
        mock_activities_table.insert.return_value = mock_activities_table
        mock_activities_table.execute.return_value = Mock(data=[])
        
        def mock_table(table_name):
            if table_name == 'users':
                return mock_users_table
            elif table_name == 'user_profiles':
                return mock_profiles_table
            elif table_name == 'user_activities':
                return mock_activities_table
            else:
                return Mock()
        
        mock_supabase.table.side_effect = mock_table
        
        # Testa diferentes níveis de atividade
        activity_levels = ['sedentary', 'light', 'moderate', 'active', 'very_active']
        
        for level in activity_levels:
            response = client.put('/api/user/profile', 
                                json={'activity_level': level},
                                headers=auth_headers)
            assert response.status_code == 200
    
    @patch('main.token_required')
    @patch('main.supabase')
    def test_profile_health_goals(self, mock_supabase, mock_token_required, client, auth_headers):
        """Testa objetivos de saúde"""
        # Mock do decorator token_required
        def mock_decorator(f):
            def decorated(*args, **kwargs):
                from flask import request
                request.current_user = {
                    'id': 'test-user-id',
                    'email': 'test@example.com',
                    'name': 'Test User',
                    'role': 'user'
                }
                return f(*args, **kwargs)
            return decorated
        
        mock_token_required.side_effect = mock_decorator
        
        # Mock das tabelas
        mock_users_table = Mock()
        mock_users_table.update.return_value = mock_users_table
        mock_users_table.eq.return_value = mock_users_table
        mock_users_table.execute.return_value = Mock(data=[])
        
        mock_profiles_table = Mock()
        mock_profiles_table.select.return_value = mock_profiles_table
        mock_profiles_table.eq.return_value = mock_profiles_table
        mock_profiles_table.execute.return_value = Mock(data=[{
            'id': 'profile-1',
            'user_id': 'test-user-id'
        }])
        mock_profiles_table.update.return_value = mock_profiles_table
        
        mock_activities_table = Mock()
        mock_activities_table.insert.return_value = mock_activities_table
        mock_activities_table.execute.return_value = Mock(data=[])
        
        def mock_table(table_name):
            if table_name == 'users':
                return mock_users_table
            elif table_name == 'user_profiles':
                return mock_profiles_table
            elif table_name == 'user_activities':
                return mock_activities_table
            else:
                return Mock()
        
        mock_supabase.table.side_effect = mock_table
        
        # Testa diferentes objetivos
        health_goals = ['weight_loss', 'muscle_gain', 'maintenance', 'general_health']
        
        for goal in health_goals:
            response = client.put('/api/user/profile', 
                                json={'health_goals': goal},
                                headers=auth_headers)
            assert response.status_code == 200
    
    @patch('main.token_required')
    @patch('main.supabase')
    def test_profile_gender_values(self, mock_supabase, mock_token_required, client, auth_headers):
        """Testa valores de gênero"""
        # Mock do decorator token_required
        def mock_decorator(f):
            def decorated(*args, **kwargs):
                from flask import request
                request.current_user = {
                    'id': 'test-user-id',
                    'email': 'test@example.com',
                    'name': 'Test User',
                    'role': 'user'
                }
                return f(*args, **kwargs)
            return decorated
        
        mock_token_required.side_effect = mock_decorator
        
        # Mock das tabelas
        mock_users_table = Mock()
        mock_users_table.update.return_value = mock_users_table
        mock_users_table.eq.return_value = mock_users_table
        mock_users_table.execute.return_value = Mock(data=[])
        
        mock_profiles_table = Mock()
        mock_profiles_table.select.return_value = mock_profiles_table
        mock_profiles_table.eq.return_value = mock_profiles_table
        mock_profiles_table.execute.return_value = Mock(data=[{
            'id': 'profile-1',
            'user_id': 'test-user-id'
        }])
        mock_profiles_table.update.return_value = mock_profiles_table
        
        mock_activities_table = Mock()
        mock_activities_table.insert.return_value = mock_activities_table
        mock_activities_table.execute.return_value = Mock(data=[])
        
        def mock_table(table_name):
            if table_name == 'users':
                return mock_users_table
            elif table_name == 'user_profiles':
                return mock_profiles_table
            elif table_name == 'user_activities':
                return mock_activities_table
            else:
                return Mock()
        
        mock_supabase.table.side_effect = mock_table
        
        # Testa diferentes valores de gênero
        gender_values = ['M', 'F', 'O']  # Masculino, Feminino, Outro
        
        for gender in gender_values:
            response = client.put('/api/user/profile', 
                                json={'gender': gender},
                                headers=auth_headers)
            assert response.status_code == 200