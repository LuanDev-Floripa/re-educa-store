import pytest
import json
from unittest.mock import patch, Mock
from app import create_app
app = create_app()

@pytest.fixture
def client():
    app.config['TESTING'] = True
    return app.test_client()

@pytest.fixture
def auth_headers():
    """Headers de autenticação para testes"""
    return {'Authorization': 'Bearer test-token'}

class TestHealthTools:
    """Testes para as ferramentas de saúde"""
    
    @patch('main.supabase')
    @patch('main.jwt.decode')
    def test_calculate_imc_success(self, mock_jwt_decode, mock_supabase, client, auth_headers):
        """Testa cálculo de IMC bem-sucedido"""
        # Mock do JWT
        mock_jwt_decode.return_value = {'user_id': 'test-user-id'}
        
        # Mock da tabela users
        mock_users_table = Mock()
        mock_users_table.select.return_value = mock_users_table
        mock_users_table.eq.return_value = mock_users_table
        mock_users_table.execute.return_value = Mock(data=[{
            'id': 'test-user-id',
            'email': 'test@example.com',
            'name': 'Test User',
            'role': 'user'
        }])
        
        # Mock da tabela imc_history
        mock_imc_table = Mock()
        mock_imc_table.insert.return_value = mock_imc_table
        mock_imc_table.execute.return_value = Mock(data=[])
        
        # Mock da tabela user_activities
        mock_activities_table = Mock()
        mock_activities_table.insert.return_value = mock_activities_table
        mock_activities_table.execute.return_value = Mock(data=[])
        
        # Configura o mock para retornar a tabela apropriada
        def mock_table(table_name):
            if table_name == 'users':
                return mock_users_table
            elif table_name == 'imc_history':
                return mock_imc_table
            elif table_name == 'user_activities':
                return mock_activities_table
            else:
                return Mock()
        
        mock_supabase.table.side_effect = mock_table
        
        response = client.post('/api/tools/imc/calculate', 
                             json={'weight': 70, 'height': 170},
                             headers=auth_headers)
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'imc' in data
        assert 'classification' in data
        assert 'recommendations' in data
    
    @patch('main.supabase')
    @patch('main.jwt.decode')
    def test_calculate_imc_invalid_values(self, mock_jwt_decode, mock_supabase, client, auth_headers):
        """Testa cálculo de IMC com valores inválidos"""
        # Mock do JWT
        mock_jwt_decode.return_value = {'user_id': 'test-user-id'}
        
        # Mock da tabela users
        mock_users_table = Mock()
        mock_users_table.select.return_value = mock_users_table
        mock_users_table.eq.return_value = mock_users_table
        mock_users_table.execute.return_value = Mock(data=[{
            'id': 'test-user-id',
            'email': 'test@example.com',
            'name': 'Test User',
            'role': 'user'
        }])
        
        def mock_table(table_name):
            if table_name == 'users':
                return mock_users_table
            else:
                return Mock()
        
        mock_supabase.table.side_effect = mock_table
        
        response = client.post('/api/tools/imc/calculate', 
                             json={'weight': 0, 'height': 170},
                             headers=auth_headers)
        
        assert response.status_code == 400
        data = json.loads(response.data)
        assert 'error' in data
    
    @patch('main.supabase')
    @patch('main.jwt.decode')
    def test_calculate_imc_negative_values(self, mock_jwt_decode, mock_supabase, client, auth_headers):
        """Testa cálculo de IMC com valores negativos"""
        # Mock do JWT
        mock_jwt_decode.return_value = {'user_id': 'test-user-id'}
        
        # Mock da tabela users
        mock_users_table = Mock()
        mock_users_table.select.return_value = mock_users_table
        mock_users_table.eq.return_value = mock_users_table
        mock_users_table.execute.return_value = Mock(data=[{
            'id': 'test-user-id',
            'email': 'test@example.com',
            'name': 'Test User',
            'role': 'user'
        }])
        
        def mock_table(table_name):
            if table_name == 'users':
                return mock_users_table
            else:
                return Mock()
        
        mock_supabase.table.side_effect = mock_table
        
        response = client.post('/api/tools/imc/calculate', 
                             json={'weight': -70, 'height': 170},
                             headers=auth_headers)
        
        assert response.status_code == 400
        data = json.loads(response.data)
        assert 'error' in data
    
    @patch('main.supabase')
    @patch('main.jwt.decode')
    def test_calculate_imc_missing_fields(self, mock_jwt_decode, mock_supabase, client, auth_headers):
        """Testa cálculo de IMC com campos faltando"""
        # Mock do JWT
        mock_jwt_decode.return_value = {'user_id': 'test-user-id'}
        
        # Mock da tabela users
        mock_users_table = Mock()
        mock_users_table.select.return_value = mock_users_table
        mock_users_table.eq.return_value = mock_users_table
        mock_users_table.execute.return_value = Mock(data=[{
            'id': 'test-user-id',
            'email': 'test@example.com',
            'name': 'Test User',
            'role': 'user'
        }])
        
        def mock_table(table_name):
            if table_name == 'users':
                return mock_users_table
            else:
                return Mock()
        
        mock_supabase.table.side_effect = mock_table
        
        response = client.post('/api/tools/imc/calculate', 
                             json={'weight': 70},
                             headers=auth_headers)
        
        assert response.status_code == 400
        data = json.loads(response.data)
        assert 'error' in data
    
    @patch('main.supabase')
    @patch('main.jwt.decode')
    def test_calculate_imc_underweight(self, mock_jwt_decode, mock_supabase, client, auth_headers):
        """Testa cálculo de IMC para pessoa abaixo do peso"""
        # Mock do JWT
        mock_jwt_decode.return_value = {'user_id': 'test-user-id'}
        
        # Mock das tabelas
        mock_users_table = Mock()
        mock_users_table.select.return_value = mock_users_table
        mock_users_table.eq.return_value = mock_users_table
        mock_users_table.execute.return_value = Mock(data=[{
            'id': 'test-user-id',
            'email': 'test@example.com',
            'name': 'Test User',
            'role': 'user'
        }])
        
        mock_imc_table = Mock()
        mock_imc_table.insert.return_value = mock_imc_table
        mock_imc_table.execute.return_value = Mock(data=[])
        
        mock_activities_table = Mock()
        mock_activities_table.insert.return_value = mock_activities_table
        mock_activities_table.execute.return_value = Mock(data=[])
        
        def mock_table(table_name):
            if table_name == 'users':
                return mock_users_table
            elif table_name == 'imc_history':
                return mock_imc_table
            elif table_name == 'user_activities':
                return mock_activities_table
            else:
                return Mock()
        
        mock_supabase.table.side_effect = mock_table
        
        response = client.post('/api/tools/imc/calculate', 
                             json={'weight': 50, 'height': 170},
                             headers=auth_headers)
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['classification'] == 'Abaixo do peso'
    
    @patch('main.supabase')
    @patch('main.jwt.decode')
    def test_calculate_imc_overweight(self, mock_jwt_decode, mock_supabase, client, auth_headers):
        """Testa cálculo de IMC para pessoa com sobrepeso"""
        # Mock do JWT
        mock_jwt_decode.return_value = {'user_id': 'test-user-id'}
        
        # Mock das tabelas
        mock_users_table = Mock()
        mock_users_table.select.return_value = mock_users_table
        mock_users_table.eq.return_value = mock_users_table
        mock_users_table.execute.return_value = Mock(data=[{
            'id': 'test-user-id',
            'email': 'test@example.com',
            'name': 'Test User',
            'role': 'user'
        }])
        
        mock_imc_table = Mock()
        mock_imc_table.insert.return_value = mock_imc_table
        mock_imc_table.execute.return_value = Mock(data=[])
        
        mock_activities_table = Mock()
        mock_activities_table.insert.return_value = mock_activities_table
        mock_activities_table.execute.return_value = Mock(data=[])
        
        def mock_table(table_name):
            if table_name == 'users':
                return mock_users_table
            elif table_name == 'imc_history':
                return mock_imc_table
            elif table_name == 'user_activities':
                return mock_activities_table
            else:
                return Mock()
        
        mock_supabase.table.side_effect = mock_table
        
        response = client.post('/api/tools/imc/calculate', 
                             json={'weight': 80, 'height': 170},
                             headers=auth_headers)
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['classification'] == 'Sobrepeso'
    
    @patch('main.supabase')
    @patch('main.jwt.decode')
    def test_calculate_imc_obesity(self, mock_jwt_decode, mock_supabase, client, auth_headers):
        """Testa cálculo de IMC para pessoa com obesidade"""
        # Mock do JWT
        mock_jwt_decode.return_value = {'user_id': 'test-user-id'}
        
        # Mock das tabelas
        mock_users_table = Mock()
        mock_users_table.select.return_value = mock_users_table
        mock_users_table.eq.return_value = mock_users_table
        mock_users_table.execute.return_value = Mock(data=[{
            'id': 'test-user-id',
            'email': 'test@example.com',
            'name': 'Test User',
            'role': 'user'
        }])
        
        mock_imc_table = Mock()
        mock_imc_table.insert.return_value = mock_imc_table
        mock_imc_table.execute.return_value = Mock(data=[])
        
        mock_activities_table = Mock()
        mock_activities_table.insert.return_value = mock_activities_table
        mock_activities_table.execute.return_value = Mock(data=[])
        
        def mock_table(table_name):
            if table_name == 'users':
                return mock_users_table
            elif table_name == 'imc_history':
                return mock_imc_table
            elif table_name == 'user_activities':
                return mock_activities_table
            else:
                return Mock()
        
        mock_supabase.table.side_effect = mock_table
        
        response = client.post('/api/tools/imc/calculate', 
                             json={'weight': 100, 'height': 170},
                             headers=auth_headers)
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'Obesidade' in data['classification']
    
    @patch('main.supabase')
    @patch('main.jwt.decode')
    def test_get_imc_history(self, mock_jwt_decode, mock_supabase, client, auth_headers):
        """Testa obtenção do histórico de IMC"""
        # Mock do JWT
        mock_jwt_decode.return_value = {'user_id': 'test-user-id'}
        
        # Mock das tabelas
        mock_users_table = Mock()
        mock_users_table.select.return_value = mock_users_table
        mock_users_table.eq.return_value = mock_users_table
        mock_users_table.execute.return_value = Mock(data=[{
            'id': 'test-user-id',
            'email': 'test@example.com',
            'name': 'Test User',
            'role': 'user'
        }])
        
        mock_imc_table = Mock()
        mock_imc_table.select.return_value = mock_imc_table
        mock_imc_table.eq.return_value = mock_imc_table
        mock_imc_table.order.return_value = mock_imc_table
        mock_imc_table.limit.return_value = mock_imc_table
        mock_imc_table.execute.return_value = Mock(data=[
            {
                'id': '1',
                'weight': 70,
                'height': 170,
                'imc_value': 24.22,
                'classification': 'Peso normal',
                'calculated_at': '2023-01-01T00:00:00Z'
            }
        ])
        
        def mock_table(table_name):
            if table_name == 'users':
                return mock_users_table
            elif table_name == 'imc_history':
                return mock_imc_table
            else:
                return Mock()
        
        mock_supabase.table.side_effect = mock_table
        
        response = client.get('/api/tools/imc/history', headers=auth_headers)
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'history' in data
        assert len(data['history']) == 1
    
    def test_imc_recommendations_underweight(self):
        """Testa recomendações para IMC abaixo do peso"""
        from main import get_imc_recommendations
        
        recommendations = get_imc_recommendations(17.0)
        assert len(recommendations) > 0
        assert any('nutricionista' in rec.lower() for rec in recommendations)
    
    def test_imc_recommendations_normal(self):
        """Testa recomendações para IMC normal"""
        from main import get_imc_recommendations
        
        recommendations = get_imc_recommendations(22.0)
        assert len(recommendations) > 0
        assert any('equilibrada' in rec.lower() for rec in recommendations)
    
    def test_imc_recommendations_overweight(self):
        """Testa recomendações para IMC com sobrepeso"""
        from main import get_imc_recommendations
        
        recommendations = get_imc_recommendations(27.0)
        assert len(recommendations) > 0
        assert any('açúcares' in rec.lower() for rec in recommendations)
    
    def test_imc_recommendations_obesity(self):
        """Testa recomendações para IMC com obesidade"""
        from main import get_imc_recommendations
        
        recommendations = get_imc_recommendations(35.0)
        assert len(recommendations) > 0
        assert any('médica' in rec.lower() for rec in recommendations)
    
    def test_imc_calculation_precision(self):
        """Testa precisão do cálculo de IMC"""
        from main import get_imc_recommendations
        
        # Testa diferentes valores
        recommendations1 = get_imc_recommendations(18.4)
        recommendations2 = get_imc_recommendations(18.6)
        
        assert recommendations1 != recommendations2  # Deve retornar recomendações diferentes