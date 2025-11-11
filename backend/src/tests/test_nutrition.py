import json
from unittest.mock import Mock, patch

import pytest
from app import create_app

app = create_app()


@pytest.fixture
def client():
    app.config["TESTING"] = True
    return app.test_client()


@pytest.fixture
def auth_headers():
    """Headers de autenticação para testes"""
    return {"Authorization": "Bearer test-token"}


class TestNutritionSystem:
    """Testes para o sistema de nutrição"""

    @patch("main.supabase")
    @patch("main.jwt.decode")
    @patch("main.requests.get")
    def test_search_foods_success(self, mock_requests_get, mock_jwt_decode, mock_supabase, client, auth_headers):
        """Testa busca de alimentos bem-sucedida"""
        # Mock do JWT
        mock_jwt_decode.return_value = {"user_id": "test-user-id"}

        # Mock da tabela users
        mock_users_table = Mock()
        mock_users_table.select.return_value = mock_users_table
        mock_users_table.eq.return_value = mock_users_table
        mock_users_table.execute.return_value = Mock(
            data=[{"id": "test-user-id", "email": "test@example.com", "name": "Test User", "role": "user"}]
        )

        # Mock da tabela user_activities
        mock_activities_table = Mock()
        mock_activities_table.insert.return_value = mock_activities_table
        mock_activities_table.execute.return_value = Mock(data=[])

        def mock_table(table_name):
            if table_name == "users":
                return mock_users_table
            elif table_name == "user_activities":
                return mock_activities_table
            else:
                return Mock()

        mock_supabase.table.side_effect = mock_table

        # Mock da API USDA
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
        mock_requests_get.return_value = mock_response

        response = client.get("/api/nutrition/search?q=apple", headers=auth_headers)

        assert response.status_code == 200
        data = json.loads(response.data)
        assert "foods" in data
        assert len(data["foods"]) == 1
        assert data["foods"][0]["description"] == "Test Food"

    @patch("main.supabase")
    @patch("main.jwt.decode")
    def test_search_foods_missing_query(self, mock_jwt_decode, mock_supabase, client, auth_headers):
        """Testa busca sem termo de consulta"""
        # Mock do JWT
        mock_jwt_decode.return_value = {"user_id": "test-user-id"}

        # Mock da tabela users
        mock_users_table = Mock()
        mock_users_table.select.return_value = mock_users_table
        mock_users_table.eq.return_value = mock_users_table
        mock_users_table.execute.return_value = Mock(
            data=[{"id": "test-user-id", "email": "test@example.com", "name": "Test User", "role": "user"}]
        )

        def mock_table(table_name):
            if table_name == "users":
                return mock_users_table
            else:
                return Mock()

        mock_supabase.table.side_effect = mock_table

        response = client.get("/api/nutrition/search", headers=auth_headers)

        assert response.status_code == 400
        data = json.loads(response.data)
        assert "error" in data

    @patch("main.supabase")
    @patch("main.jwt.decode")
    def test_search_foods_empty_query(self, mock_jwt_decode, mock_supabase, client, auth_headers):
        """Testa busca com termo vazio"""
        # Mock do JWT
        mock_jwt_decode.return_value = {"user_id": "test-user-id"}

        # Mock da tabela users
        mock_users_table = Mock()
        mock_users_table.select.return_value = mock_users_table
        mock_users_table.eq.return_value = mock_users_table
        mock_users_table.execute.return_value = Mock(
            data=[{"id": "test-user-id", "email": "test@example.com", "name": "Test User", "role": "user"}]
        )

        def mock_table(table_name):
            if table_name == "users":
                return mock_users_table
            else:
                return Mock()

        mock_supabase.table.side_effect = mock_table

        response = client.get("/api/nutrition/search?q=", headers=auth_headers)

        assert response.status_code == 400
        data = json.loads(response.data)
        assert "error" in data

    @patch("main.supabase")
    @patch("main.jwt.decode")
    @patch("main.requests.get")
    def test_search_foods_usda_api_error(self, mock_requests_get, mock_jwt_decode, mock_supabase, client, auth_headers):
        """Testa erro na API USDA"""
        # Mock do JWT
        mock_jwt_decode.return_value = {"user_id": "test-user-id"}

        # Mock da tabela users
        mock_users_table = Mock()
        mock_users_table.select.return_value = mock_users_table
        mock_users_table.eq.return_value = mock_users_table
        mock_users_table.execute.return_value = Mock(
            data=[{"id": "test-user-id", "email": "test@example.com", "name": "Test User", "role": "user"}]
        )

        def mock_table(table_name):
            if table_name == "users":
                return mock_users_table
            else:
                return Mock()

        mock_supabase.table.side_effect = mock_table

        # Mock da API USDA com erro
        mock_response = Mock()
        mock_response.status_code = 500
        mock_requests_get.return_value = mock_response

        response = client.get("/api/nutrition/search?q=apple", headers=auth_headers)

        assert response.status_code == 500
        data = json.loads(response.data)
        assert "error" in data

    @patch("main.supabase")
    @patch("main.jwt.decode")
    @patch("main.requests.get")
    def test_search_foods_no_results(self, mock_requests_get, mock_jwt_decode, mock_supabase, client, auth_headers):
        """Testa busca sem resultados"""
        # Mock do JWT
        mock_jwt_decode.return_value = {"user_id": "test-user-id"}

        # Mock da tabela users
        mock_users_table = Mock()
        mock_users_table.select.return_value = mock_users_table
        mock_users_table.eq.return_value = mock_users_table
        mock_users_table.execute.return_value = Mock(
            data=[{"id": "test-user-id", "email": "test@example.com", "name": "Test User", "role": "user"}]
        )

        # Mock da tabela user_activities
        mock_activities_table = Mock()
        mock_activities_table.insert.return_value = mock_activities_table
        mock_activities_table.execute.return_value = Mock(data=[])

        def mock_table(table_name):
            if table_name == "users":
                return mock_users_table
            elif table_name == "user_activities":
                return mock_activities_table
            else:
                return Mock()

        mock_supabase.table.side_effect = mock_table

        # Mock da API USDA sem resultados
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {"foods": []}
        mock_requests_get.return_value = mock_response

        response = client.get("/api/nutrition/search?q=nonexistent", headers=auth_headers)

        assert response.status_code == 200
        data = json.loads(response.data)
        assert "foods" in data
        assert len(data["foods"]) == 0

    @patch("main.supabase")
    @patch("main.jwt.decode")
    @patch("main.requests.get")
    def test_search_foods_multiple_results(
        self, mock_requests_get, mock_jwt_decode, mock_supabase, client, auth_headers
    ):
        """Testa busca com múltiplos resultados"""
        # Mock do JWT
        mock_jwt_decode.return_value = {"user_id": "test-user-id"}

        # Mock da tabela users
        mock_users_table = Mock()
        mock_users_table.select.return_value = mock_users_table
        mock_users_table.eq.return_value = mock_users_table
        mock_users_table.execute.return_value = Mock(
            data=[{"id": "test-user-id", "email": "test@example.com", "name": "Test User", "role": "user"}]
        )

        # Mock da tabela user_activities
        mock_activities_table = Mock()
        mock_activities_table.insert.return_value = mock_activities_table
        mock_activities_table.execute.return_value = Mock(data=[])

        def mock_table(table_name):
            if table_name == "users":
                return mock_users_table
            elif table_name == "user_activities":
                return mock_activities_table
            else:
                return Mock()

        mock_supabase.table.side_effect = mock_table

        # Mock da API USDA com múltiplos resultados
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "foods": [
                {
                    "fdcId": "1",
                    "description": "Apple, raw",
                    "brandOwner": "Test Brand",
                    "ingredients": "Apple",
                    "foodNutrients": [{"nutrientName": "Energy", "value": 52, "unitName": "KCAL"}],
                },
                {
                    "fdcId": "2",
                    "description": "Apple, cooked",
                    "brandOwner": "Test Brand",
                    "ingredients": "Apple, sugar",
                    "foodNutrients": [{"nutrientName": "Energy", "value": 80, "unitName": "KCAL"}],
                },
            ]
        }
        mock_requests_get.return_value = mock_response

        response = client.get("/api/nutrition/search?q=apple", headers=auth_headers)

        assert response.status_code == 200
        data = json.loads(response.data)
        assert "foods" in data
        assert len(data["foods"]) == 2
        assert data["foods"][0]["description"] == "Apple, raw"
        assert data["foods"][1]["description"] == "Apple, cooked"

    def test_process_nutrients_complete(self):
        """Testa processamento completo de nutrientes"""
        from main import process_nutrients

        nutrients = [
            {"nutrientName": "Energy", "value": 100, "unitName": "KCAL"},
            {"nutrientName": "Protein", "value": 5, "unitName": "G"},
        ]

        processed = process_nutrients(nutrients)

        assert "calories" in processed
        assert processed["calories"]["value"] == 100
        assert processed["calories"]["unit"] == "KCAL"
        assert "protein" in processed
        assert processed["protein"]["value"] == 5
        assert processed["protein"]["unit"] == "G"

    def test_process_nutrients_partial(self):
        """Testa processamento parcial de nutrientes"""
        from main import process_nutrients

        nutrients = [
            {"nutrientName": "Energy", "value": 150, "unitName": "KCAL"}
            # Apenas energia, sem outros nutrientes
        ]

        processed = process_nutrients(nutrients)

        assert "calories" in processed
        assert processed["calories"]["value"] == 150
        assert processed["calories"]["unit"] == "KCAL"
        assert len(processed) == 1  # Apenas calorias

    def test_process_nutrients_empty(self):
        """Testa processamento de lista vazia de nutrientes"""
        from main import process_nutrients

        processed = process_nutrients([])

        assert isinstance(processed, dict)
        assert len(processed) == 0

    def test_process_nutrients_unknown_names(self):
        """Testa processamento de nutrientes com nomes desconhecidos"""
        from main import process_nutrients

        nutrients = [{"nutrientName": "Unknown Nutrient", "value": 10, "unitName": "MG"}]

        processed = process_nutrients(nutrients)

        assert isinstance(processed, dict)
        assert len(processed) == 0  # Nutriente desconhecido não é processado

    @patch("main.supabase")
    @patch("main.jwt.decode")
    @patch("main.requests.get")
    def test_search_foods_query_parameters(
        self, mock_requests_get, mock_jwt_decode, mock_supabase, client, auth_headers
    ):
        """Testa busca com diferentes parâmetros de consulta"""
        # Mock do JWT
        mock_jwt_decode.return_value = {"user_id": "test-user-id"}

        # Mock da tabela users
        mock_users_table = Mock()
        mock_users_table.select.return_value = mock_users_table
        mock_users_table.eq.return_value = mock_users_table
        mock_users_table.execute.return_value = Mock(
            data=[{"id": "test-user-id", "email": "test@example.com", "name": "Test User", "role": "user"}]
        )

        # Mock da tabela user_activities
        mock_activities_table = Mock()
        mock_activities_table.insert.return_value = mock_activities_table
        mock_activities_table.execute.return_value = Mock(data=[])

        def mock_table(table_name):
            if table_name == "users":
                return mock_users_table
            elif table_name == "user_activities":
                return mock_activities_table
            else:
                return Mock()

        mock_supabase.table.side_effect = mock_table

        # Mock da API USDA
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {"foods": []}
        mock_requests_get.return_value = mock_response

        # Testa diferentes consultas
        queries = ["apple", "banana", "chicken", "rice"]

        for query in queries:
            response = client.get(f"/api/nutrition/search?q={query}", headers=auth_headers)
            assert response.status_code == 200

    @patch("main.supabase")
    @patch("main.jwt.decode")
    @patch("main.requests.get")
    def test_search_foods_pagination(self, mock_requests_get, mock_jwt_decode, mock_supabase, client, auth_headers):
        """Testa busca com paginação"""
        # Mock do JWT
        mock_jwt_decode.return_value = {"user_id": "test-user-id"}

        # Mock da tabela users
        mock_users_table = Mock()
        mock_users_table.select.return_value = mock_users_table
        mock_users_table.eq.return_value = mock_users_table
        mock_users_table.execute.return_value = Mock(
            data=[{"id": "test-user-id", "email": "test@example.com", "name": "Test User", "role": "user"}]
        )

        # Mock da tabela user_activities
        mock_activities_table = Mock()
        mock_activities_table.insert.return_value = mock_activities_table
        mock_activities_table.execute.return_value = Mock(data=[])

        def mock_table(table_name):
            if table_name == "users":
                return mock_users_table
            elif table_name == "user_activities":
                return mock_activities_table
            else:
                return Mock()

        mock_supabase.table.side_effect = mock_table

        # Mock da API USDA
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {"foods": []}
        mock_requests_get.return_value = mock_response

        # Testa com pageSize diferente
        response = client.get("/api/nutrition/search?q=apple&pageSize=10", headers=auth_headers)
        assert response.status_code == 200

    @patch("main.supabase")
    @patch("main.jwt.decode")
    @patch("main.requests.get")
    def test_search_foods_special_characters(
        self, mock_requests_get, mock_jwt_decode, mock_supabase, client, auth_headers
    ):
        """Testa busca com caracteres especiais"""
        # Mock do JWT
        mock_jwt_decode.return_value = {"user_id": "test-user-id"}

        # Mock da tabela users
        mock_users_table = Mock()
        mock_users_table.select.return_value = mock_users_table
        mock_users_table.eq.return_value = mock_users_table
        mock_users_table.execute.return_value = Mock(
            data=[{"id": "test-user-id", "email": "test@example.com", "name": "Test User", "role": "user"}]
        )

        # Mock da tabela user_activities
        mock_activities_table = Mock()
        mock_activities_table.insert.return_value = mock_activities_table
        mock_activities_table.execute.return_value = Mock(data=[])

        def mock_table(table_name):
            if table_name == "users":
                return mock_users_table
            elif table_name == "user_activities":
                return mock_activities_table
            else:
                return Mock()

        mock_supabase.table.side_effect = mock_table

        # Mock da API USDA
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {"foods": []}
        mock_requests_get.return_value = mock_response

        # Testa com caracteres especiais
        special_queries = ["café", "açaí", "pão-de-queijo", "vitamin c"]

        for query in special_queries:
            response = client.get(f"/api/nutrition/search?q={query}", headers=auth_headers)
            assert response.status_code == 200
