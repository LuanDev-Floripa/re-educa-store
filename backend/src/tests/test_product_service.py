# -*- coding: utf-8 -*-
"""
Testes Unitários para ProductService RE-EDUCA Store.
"""
from unittest.mock import Mock, patch

import pytest
from repositories.product_repository import ProductRepository
from services.product_service import ProductService


@pytest.fixture
def mock_product_repo():
    """Mock do ProductRepository"""
    repo = Mock(spec=ProductRepository)
    return repo


@pytest.fixture
def product_service(mock_product_repo):
    """Fixture para ProductService com repositório mockado"""
    with patch("services.product_service.ProductRepository", return_value=mock_product_repo):
        service = ProductService()
        service.repo = mock_product_repo
        return service


class TestProductService:
    """Testes para ProductService"""

    def test_get_product_success(self, product_service, mock_product_repo):
        """Testa busca de produto por ID"""
        # Arrange
        product_id = "prod-123"
        mock_product = {"id": product_id, "name": "Whey Protein", "price": 99.90, "is_active": True}
        mock_product_repo.find_by_id.return_value = mock_product

        # Act
        result = product_service.get_product(product_id)

        # Assert
        assert result == mock_product
        assert result["id"] == product_id
        mock_product_repo.find_by_id.assert_called_once_with(product_id)

    def test_get_product_not_found(self, product_service, mock_product_repo):
        """Testa busca de produto inexistente"""
        # Arrange
        mock_product_repo.find_by_id.return_value = None

        # Act
        result = product_service.get_product("non-existent")

        # Assert
        assert result is None

    def test_get_recommended_products(self, product_service, mock_product_repo):
        """Testa busca de produtos recomendados"""
        # Arrange
        mock_products = [
            {"id": "1", "name": "Produto A", "rating": 5.0},
            {"id": "2", "name": "Produto B", "rating": 4.8},
        ]
        mock_product_repo.find_recommended.return_value = mock_products

        # Act
        result = product_service.get_recommended_products(limit=10)

        # Assert
        assert len(result) == 2
        mock_product_repo.find_recommended.assert_called_once_with(limit=10)

    def test_get_trending_products(self, product_service, mock_product_repo):
        """Testa busca de produtos em tendência"""
        # Arrange
        mock_products = [
            {"id": "1", "name": "Produto A", "sales_count": 100},
            {"id": "2", "name": "Produto B", "sales_count": 80},
        ]
        mock_product_repo.find_trending.return_value = mock_products

        # Act
        result = product_service.get_trending_products(limit=10)

        # Assert
        assert len(result) == 2
        mock_product_repo.find_trending.assert_called_once_with(limit=10)
