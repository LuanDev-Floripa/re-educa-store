# -*- coding: utf-8 -*-
"""
Testes de Integração para Rotas de Saúde RE-EDUCA Store.

Testa endpoints completos incluindo autenticação, validação e integração com services.
"""
import json
from unittest.mock import patch

import pytest


@pytest.fixture
def app():
    """Cria aplicação Flask para testes"""
    from app import create_app

    app, _ = create_app()
    app.config["TESTING"] = True
    return app


@pytest.fixture
def client(app):
    """Cliente de teste"""
    return app.test_client()


@pytest.fixture
def auth_headers(app):
    """Headers de autenticação"""
    with app.test_request_context():
        from flask import request

        # Mock token válido
        with patch("middleware.auth.verify_token") as mock_verify:
            mock_verify.return_value = {"user_id": "test-user-123", "email": "test@example.com"}

            # Mock request.current_user

            def set_current_user():
                request.current_user = {"id": "test-user-123", "email": "test@example.com", "role": "user"}

            return {"Authorization": "Bearer valid-token", "set_user": set_current_user}


class TestHealthRoutesIMC:
    """Testes de integração para rotas de IMC"""

    @patch("routes.health_tools.health_service")
    def test_calculate_imc_endpoint_public(self, mock_service, client):
        """Testa endpoint público de cálculo de IMC"""
        # Arrange
        mock_service.save_imc_calculation.return_value = {"success": True, "entry": {"id": "calc-123", "imc": 24.65}}

        # Mock cálculo
        with patch("routes.health_tools.calculate_imc") as mock_calc:
            mock_calc.return_value = {
                "imc": 24.65,
                "classification": "Normal",
                "color": "green",
                "recommendations": ["Manter peso"],
                "weight_range": {"min": 56.7, "max": 76.6},
            }

            payload = {"weight": 75.5, "height": 175}  # em cm

            # Act
            response = client.post("/api/health/imc/calculate", json=payload, content_type="application/json")

            # Assert
            assert response.status_code == 200
            data = json.loads(response.data)
            assert "imc" in data
            assert data["imc"] == 24.65
            assert "classification" in data

    @patch("routes.health_tools.health_service")
    def test_calculate_imc_validation_error(self, mock_service, client):
        """Testa validação de entrada no endpoint de IMC"""
        # Arrange
        payload = {"weight": -10, "height": 175}  # Peso inválido

        # Act
        response = client.post("/api/health/imc/calculate", json=payload, content_type="application/json")

        # Assert
        assert response.status_code in [400, 422]  # Erro de validação


class TestHealthRoutesBiologicalAge:
    """Testes de integração para rotas de Idade Biológica"""

    @patch("routes.health_tools.health_service")
    def test_calculate_biological_age_endpoint(self, mock_service, client, auth_headers):
        """Testa endpoint de cálculo de idade biológica"""
        # Arrange
        auth_headers["set_user"]()  # Configura usuário autenticado

        mock_service.calculate_biological_age.return_value = {
            "chronological_age": 40,
            "biological_age": 35,
            "age_difference": -5,
            "classification": "Jovem",
            "score": 90,
            "recommendations": [],
        }

        mock_service.save_biological_age_calculation.return_value = {"success": True, "entry": {"id": "bio-123"}}

        payload = {"age": 40, "factors": {"cardiovascularFitness": "excellent", "strength": "good"}}

        # Mock token authentication
        with patch("middleware.auth.verify_token") as mock_verify:
            mock_verify.return_value = {"user_id": "test-user-123"}

            # Act
            response = client.post(
                "/api/health/biological-age/calculate",
                json=payload,
                headers={"Authorization": "Bearer valid-token"},
                content_type="application/json",
            )

            # Assert
            assert response.status_code == 200
            data = json.loads(response.data)
            assert "biological_age" in data
            assert data["chronological_age"] == 40

    @patch("routes.health_tools.health_service")
    def test_get_biological_age_history(self, mock_service, client, auth_headers):
        """Testa endpoint de histórico de idade biológica"""
        # Arrange
        mock_service.get_biological_age_history.return_value = {
            "calculations": [
                {"id": "1", "biological_age": 35, "created_at": "2025-01-01"},
                {"id": "2", "biological_age": 36, "created_at": "2025-01-15"},
            ],
            "pagination": {"page": 1, "per_page": 20, "total": 2, "pages": 1},
        }

        with patch("middleware.auth.verify_token") as mock_verify:
            mock_verify.return_value = {"user_id": "test-user-123"}

            # Act
            response = client.get(
                "/api/health/biological-age/history?page=1&per_page=20", headers={"Authorization": "Bearer valid-token"}
            )

            # Assert
            assert response.status_code == 200
            data = json.loads(response.data)
            assert "calculations" in data
            assert len(data["calculations"]) == 2
            assert "pagination" in data


class TestHealthRoutesCalories:
    """Testes de integração para rotas de calorias"""

    @patch("routes.health_tools.calculate_calories")
    def test_calculate_calories_endpoint(self, mock_calc, client):
        """Testa endpoint de cálculo de calorias"""
        # Arrange
        mock_calc.return_value = {"bmr": 1750, "daily_calories": 2625, "activity_multiplier": 1.5}

        payload = {"age": 30, "weight": 75, "height": 175, "gender": "male", "activity_level": "moderate"}

        # Act
        response = client.post("/api/health/calories/calculate", json=payload, content_type="application/json")

        # Assert
        assert response.status_code == 200
        data = json.loads(response.data)
        assert "daily_calories" in data
        assert "bmr" in data
        assert data["bmr"] == 1750


class TestUsersRoutes:
    """Testes de integração para rotas de usuários"""

    @patch("routes.users.user_service")
    def test_get_user_analytics(self, mock_service, client):
        """Testa endpoint de analytics do usuário"""
        # Arrange
        mock_service.get_user_analytics.return_value = {
            "user_id": "test-user-123",
            "statistics": {"total_orders": 5, "total_exercises": 10, "active_days": 7},
        }

        with patch("middleware.auth.verify_token") as mock_verify:
            mock_verify.return_value = {"user_id": "test-user-123"}

            # Act
            response = client.get("/api/users/analytics?period=30", headers={"Authorization": "Bearer valid-token"})

            # Assert
            assert response.status_code == 200
            data = json.loads(response.data)
            assert "statistics" in data
            assert "total_orders" in data["statistics"]

    @patch("routes.users.user_service")
    def test_update_profile_validation(self, mock_service, client):
        """Testa validação ao atualizar perfil"""
        # Arrange
        payload = {"name": "A"}  # Nome muito curto (deve falhar)

        with patch("middleware.auth.verify_token") as mock_verify:
            mock_verify.return_value = {"user_id": "test-user-123"}

            # Act
            response = client.put(
                "/api/users/profile",
                json=payload,
                headers={"Authorization": "Bearer valid-token"},
                content_type="application/json",
            )

            # Assert - Deve retornar erro de validação
            assert response.status_code in [400, 422]


class TestProductsRoutes:
    """Testes de integração para rotas de produtos"""

    @patch("routes.products.product_service")
    def test_get_recommended_products(self, mock_service, client):
        """Testa endpoint de produtos recomendados"""
        # Arrange
        mock_service.get_recommended_products.return_value = [
            {"id": "1", "name": "Produto A", "rating": 5.0},
            {"id": "2", "name": "Produto B", "rating": 4.8},
        ]

        with patch("middleware.auth.verify_token") as mock_verify:
            mock_verify.return_value = {"user_id": "test-user-123"}

            # Act
            response = client.get("/api/products/recommended", headers={"Authorization": "Bearer valid-token"})

            # Assert
            assert response.status_code == 200
            data = json.loads(response.data)
            assert "products" in data or isinstance(data, list)

    @patch("routes.products.product_service")
    def test_get_trending_products(self, mock_service, client):
        """Testa endpoint de produtos em tendência"""
        # Arrange
        mock_service.get_trending_products.return_value = [{"id": "1", "name": "Produto A", "sales_count": 100}]

        with patch("middleware.auth.verify_token") as mock_verify:
            mock_verify.return_value = {"user_id": "test-user-123"}

            # Act
            response = client.get("/api/products/trending", headers={"Authorization": "Bearer valid-token"})

            # Assert
            assert response.status_code == 200
