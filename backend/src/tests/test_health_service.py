# -*- coding: utf-8 -*-
"""
Testes Unitários para HealthService RE-EDUCA Store.

Testa lógica de negócios do serviço de saúde.
"""
from unittest.mock import Mock, patch

import pytest
from repositories.health_repository import HealthRepository
from services.health_service import HealthService


@pytest.fixture
def mock_health_repo():
    """Mock do HealthRepository"""
    repo = Mock(spec=HealthRepository)
    return repo


@pytest.fixture
def health_service(mock_health_repo):
    """Fixture para HealthService com repositório mockado"""
    with patch("services.health_service.HealthRepository", return_value=mock_health_repo):
        service = HealthService()
        service.repo = mock_health_repo
        return service


class TestHealthServiceIMC:
    """Testes para cálculos de IMC"""

    def test_save_imc_calculation_success(self, health_service, mock_health_repo):
        """Testa salvamento bem-sucedido de cálculo de IMC"""
        # Arrange
        user_id = "test-user-123"
        calculation_data = {
            "weight": 75.5,
            "height": 1.75,
            "imc": 24.65,
            "classification": "Normal",
            "color": "green",
            "recommendations": ["Manter peso"],
            "weight_range": {"min": 56.7, "max": 76.6},
        }

        saved_entry = {"id": "calc-123", "user_id": user_id, **calculation_data}
        mock_health_repo.save_imc_calculation.return_value = saved_entry

        # Act
        result = health_service.save_imc_calculation(user_id, calculation_data)

        # Assert
        assert result["success"] is True
        assert result["entry"] == saved_entry
        mock_health_repo.save_imc_calculation.assert_called_once_with(user_id, calculation_data)

    def test_save_imc_calculation_error(self, health_service, mock_health_repo):
        """Testa erro ao salvar cálculo de IMC"""
        # Arrange
        user_id = "test-user-123"
        calculation_data = {"weight": 75.5, "height": 1.75}
        mock_health_repo.save_imc_calculation.return_value = None

        # Act
        result = health_service.save_imc_calculation(user_id, calculation_data)

        # Assert
        assert result["success"] is False
        assert "error" in result

    def test_get_imc_history_success(self, health_service, mock_health_repo):
        """Testa busca de histórico de IMC"""
        # Arrange
        user_id = "test-user-123"
        page = 1
        per_page = 20

        mock_history = {
            "calculations": [
                {"id": "1", "imc": 24.5, "created_at": "2025-01-01"},
                {"id": "2", "imc": 24.8, "created_at": "2025-01-15"},
            ],
            "pagination": {"page": page, "per_page": per_page, "total": 2, "pages": 1},
        }
        mock_health_repo.get_imc_history.return_value = mock_history

        # Act
        result = health_service.get_imc_history(user_id, page, per_page)

        # Assert
        assert "calculations" in result
        assert len(result["calculations"]) == 2
        assert result["pagination"]["total"] == 2
        mock_health_repo.get_imc_history.assert_called_once_with(user_id, page, per_page)

    def test_get_imc_history_error(self, health_service, mock_health_repo):
        """Testa erro ao buscar histórico"""
        # Arrange
        mock_health_repo.get_imc_history.side_effect = Exception("Database error")

        # Act
        result = health_service.get_imc_history("test-user", 1, 20)

        # Assert
        assert "error" in result


class TestHealthServiceBiologicalAge:
    """Testes para cálculos de Idade Biológica"""

    def test_save_biological_age_calculation_success(self, health_service, mock_health_repo):
        """Testa salvamento de cálculo de idade biológica"""
        # Arrange
        user_id = "test-user-123"
        calculation_data = {
            "chronological_age": 40,
            "biological_age": 35,
            "age_difference": -5,
            "classification": "Jovem",
            "score": 85,
            "factors": {},
            "recommendations": [],
        }

        saved_entry = {"id": "bio-123", "user_id": user_id, **calculation_data}
        mock_health_repo.save_biological_age_calculation.return_value = saved_entry

        # Act
        result = health_service.save_biological_age_calculation(user_id, calculation_data)

        # Assert
        assert result["success"] is True
        assert result["entry"] == saved_entry
        mock_health_repo.save_biological_age_calculation.assert_called_once()

    def test_get_biological_age_history_with_dates(self, health_service, mock_health_repo):
        """Testa busca de histórico com filtros de data"""
        # Arrange
        user_id = "test-user-123"
        start_date = "2025-01-01"
        end_date = "2025-01-31"

        mock_history = {"calculations": [], "pagination": {"page": 1, "per_page": 20, "total": 0, "pages": 0}}
        mock_health_repo.get_biological_age_history.return_value = mock_history

        # Act
        result = health_service.get_biological_age_history(
            user_id, page=1, per_page=20, start_date=start_date, end_date=end_date
        )

        # Assert
        assert "calculations" in result
        mock_health_repo.get_biological_age_history.assert_called_once_with(user_id, 1, 20, start_date, end_date)


class TestHealthServiceCalories:
    """Testes para cálculos de calorias"""

    def test_save_calorie_calculation_success(self, health_service, mock_health_repo):
        """Testa salvamento de cálculo de calorias"""
        # Arrange
        user_id = "test-user-123"
        calculation_data = {"age": 30, "gender": "male", "weight": 75, "height": 1.75, "bmr": 1750, "tdee": 2625}

        saved_entry = {"id": "cal-123", **calculation_data}
        mock_health_repo.save_calorie_calculation.return_value = saved_entry

        # Act
        result = health_service.save_calorie_calculation(user_id, calculation_data)

        # Assert
        assert result["success"] is True
        mock_health_repo.save_calorie_calculation.assert_called_once()


class TestHealthServiceFoodDiary:
    """Testes para diário alimentar"""

    def test_add_food_entry_success(self, health_service, mock_health_repo):
        """Testa adição de entrada no diário alimentar"""
        # Arrange
        user_id = "test-user-123"
        food_data = {"food_name": "Maçã", "quantity": 1, "unit": "unidade", "calories": 80}

        saved_entry = {"id": "food-123", **food_data}
        mock_health_repo.add_food_entry.return_value = saved_entry

        # Act
        result = health_service.add_food_entry(user_id, food_data)

        # Assert
        assert result["success"] is True
        assert result["entry"] == saved_entry
        mock_health_repo.add_food_entry.assert_called_once()

    def test_get_food_entries_with_date(self, health_service, mock_health_repo):
        """Testa busca de entradas com filtro de data"""
        # Arrange
        user_id = "test-user-123"
        date = "2025-01-27"
        entries = [
            {"id": "1", "food_name": "Maçã", "entry_date": date},
            {"id": "2", "food_name": "Banana", "entry_date": date},
        ]
        mock_health_repo.get_food_entries.return_value = entries

        # Act
        result = health_service.get_food_entries(user_id, date=date, page=1, per_page=20)

        # Assert
        assert "entries" in result
        assert len(result["entries"]) == 2
        mock_health_repo.get_food_entries.assert_called_once_with(user_id, date, 1, 20)


class TestHealthServiceExercise:
    """Testes para entradas de exercício"""

    def test_add_exercise_entry_success(self, health_service, mock_health_repo):
        """Testa adição de entrada de exercício"""
        # Arrange
        user_id = "test-user-123"
        exercise_data = {"exercise_name": "Corrida", "duration": 30, "intensity": "moderate", "calories_burned": 300}

        saved_entry = {"id": "ex-123", **exercise_data}
        mock_health_repo.add_exercise_entry.return_value = saved_entry

        # Act
        result = health_service.add_exercise_entry(user_id, exercise_data)

        # Assert
        assert result["success"] is True
        assert result["entry"] == saved_entry
        mock_health_repo.add_exercise_entry.assert_called_once()

    def test_get_exercise_entries_pagination(self, health_service, mock_health_repo):
        """Testa busca de exercícios com paginação"""
        # Arrange
        user_id = "test-user-123"
        entries = [{"id": "1", "exercise_name": "Corrida"}, {"id": "2", "exercise_name": "Natação"}]
        mock_health_repo.get_exercise_entries.return_value = entries

        # Act
        result = health_service.get_exercise_entries(user_id, page=1, per_page=10)

        # Assert
        assert "entries" in result
        assert "pagination" in result
        mock_health_repo.get_exercise_entries.assert_called_once_with(user_id, None, 1, 10)


class TestHealthServiceBiologicalAgeCalculation:
    """Testes para cálculo de idade biológica"""

    def test_calculate_biological_age_basic(self, health_service):
        """Testa cálculo básico de idade biológica"""
        # Arrange
        data = {"age": 40, "weight": 75, "height": 1.75}

        # Act
        result = health_service.calculate_biological_age(data)

        # Assert
        assert "chronological_age" in result
        assert "biological_age" in result
        assert "age_difference" in result
        assert "classification" in result
        assert result["chronological_age"] == 40

    def test_calculate_biological_age_with_fitness_factors(self, health_service):
        """Testa cálculo com fatores de fitness"""
        # Arrange
        data = {"age": 40, "cardiovascularFitness": "excellent", "strength": "good", "endurance": "excellent"}

        # Act
        result = health_service.calculate_biological_age(data)

        # Assert
        assert result["biological_age"] < result["chronological_age"]  # Deve reduzir idade biológica
        assert result["age_difference"] < 0  # Diferença negativa = mais jovem

    def test_calculate_biological_age_with_lifestyle_factors(self, health_service):
        """Testa cálculo com fatores de estilo de vida"""
        # Arrange
        data = {
            "age": 40,
            "sleep_quality": "excellent",
            "diet_quality": "good",
            "hydration_level": "adequate",
            "exercise_frequency": "daily",
        }

        # Act
        result = health_service.calculate_biological_age(data)

        # Assert
        assert "biological_age" in result
        assert "recommendations" in result
        assert isinstance(result["recommendations"], list)
