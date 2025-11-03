# -*- coding: utf-8 -*-
"""
Testes Unitários para ExerciseService RE-EDUCA Store.
"""
import pytest
from unittest.mock import Mock, patch, MagicMock
from services.exercise_service import ExerciseService


@pytest.fixture
def mock_supabase_client():
    """Mock do Supabase client"""
    mock_client = Mock()
    mock_table = Mock()
    mock_table.select.return_value = mock_table
    mock_table.eq.return_value = mock_table
    mock_table.insert.return_value = mock_table
    mock_table.update.return_value = mock_table
    mock_table.order.return_value = mock_table
    mock_table.limit.return_value = mock_table
    mock_table.execute.return_value = Mock(data=[])
    mock_client.table.return_value = mock_table
    return mock_client


@pytest.fixture
def exercise_service(mock_supabase_client):
    """Fixture para ExerciseService com Supabase mockado"""
    with patch('services.exercise_service.supabase_client', mock_supabase_client):
        service = ExerciseService()
        service.supabase = mock_supabase_client
        return service


class TestExerciseService:
    """Testes para ExerciseService"""
    
    def test_get_exercises_with_filters(self, exercise_service, mock_supabase_client):
        """Testa busca de exercícios com filtros"""
        # Arrange
        mock_result = Mock()
        mock_result.data = [
            {'id': '1', 'name': 'Flexão', 'category': 'strength'},
            {'id': '2', 'name': 'Agachamento', 'category': 'strength'}
        ]
        mock_table = mock_supabase_client.table.return_value
        mock_table.execute.return_value = mock_result
        
        # Act
        result = exercise_service.get_exercises(category='strength', difficulty='beginner')
        
        # Assert
        assert 'exercises' in result
        assert len(result['exercises']) == 2
        mock_supabase_client.table.assert_called_with('exercises')
    
    def test_get_exercise_by_id(self, exercise_service, mock_supabase_client):
        """Testa busca de exercício por ID"""
        # Arrange
        exercise_id = 'exercise-123'
        mock_result = Mock()
        mock_result.data = [{'id': exercise_id, 'name': 'Flexão'}]
        mock_table = mock_supabase_client.table.return_value
        mock_table.execute.return_value = mock_result
        
        # Act
        result = exercise_service.get_exercise_by_id(exercise_id)
        
        # Assert
        assert result is not None
        assert result['id'] == exercise_id
        mock_table.eq.assert_called_with('id', exercise_id)
    
    def test_create_exercise_log_success(self, exercise_service, mock_supabase_client):
        """Testa criação de log de exercício"""
        # Arrange
        user_id = 'user-123'
        exercise_data = {
            'exercise_id': 'ex-1',
            'duration': 30,
            'sets': 3,
            'reps': 10
        }
        
        mock_result = Mock()
        mock_result.data = [{'id': 'log-123', 'user_id': user_id, **exercise_data}]
        mock_table = mock_supabase_client.table.return_value
        mock_table.execute.return_value = mock_result
        
        # Act
        result = exercise_service.create_exercise_log(user_id, exercise_data)
        
        # Assert
        assert result['success'] is True
        assert 'log' in result
        mock_table.insert.assert_called_once()
    
    def test_get_exercise_categories(self, exercise_service):
        """Testa obtenção de categorias de exercícios"""
        # Act
        categories = exercise_service.get_exercise_categories()
        
        # Assert
        assert isinstance(categories, list)
        assert len(categories) > 0
        assert 'strength' in categories