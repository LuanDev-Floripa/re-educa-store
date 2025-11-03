# -*- coding: utf-8 -*-
"""
Testes Unitários para OrderService RE-EDUCA Store.
"""
import pytest
from unittest.mock import Mock, patch
from services.order_service import OrderService


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
def order_service(mock_supabase_client):
    """Fixture para OrderService"""
    with patch('services.order_service.supabase_client', mock_supabase_client):
        service = OrderService()
        service.supabase = mock_supabase_client
        return service


class TestOrderService:
    """Testes para OrderService"""
    
    def test_get_order_by_id_success(self, order_service, mock_supabase_client):
        """Testa busca de pedido por ID"""
        # Arrange
        order_id = 'order-123'
        mock_order = {
            'id': order_id,
            'user_id': 'user-123',
            'total_amount': 199.90,
            'status': 'completed'
        }
        
        mock_result = Mock()
        mock_result.data = [mock_order]
        mock_table = mock_supabase_client.table.return_value
        mock_table.execute.return_value = mock_result
        
        # Act
        result = order_service.get_order_by_id(order_id)
        
        # Assert
        assert result is not None
        assert result['id'] == order_id
        mock_table.eq.assert_called_with('id', order_id)
    
    def test_get_user_orders(self, order_service, mock_supabase_client):
        """Testa busca de pedidos do usuário"""
        # Arrange
        user_id = 'user-123'
        mock_orders = [
            {'id': '1', 'user_id': user_id, 'total_amount': 99.90},
            {'id': '2', 'user_id': user_id, 'total_amount': 149.90}
        ]
        
        mock_result = Mock()
        mock_result.data = mock_orders
        mock_table = mock_supabase_client.table.return_value
        mock_table.execute.return_value = mock_result
        
        # Act
        result = order_service.get_user_orders(user_id, page=1, per_page=20)
        
        # Assert
        assert 'orders' in result
        assert len(result['orders']) == 2
        mock_table.eq.assert_called_with('user_id', user_id)