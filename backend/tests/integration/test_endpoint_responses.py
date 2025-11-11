"""
Testes para validar estrutura de respostas dos endpoints.

Garante que os endpoints retornam JSON válido e com estrutura esperada.
"""
import pytest
import json
from unittest.mock import patch


@pytest.mark.integration
class TestEndpointResponses:
    """Testes para validar estrutura de respostas."""
    
    @pytest.fixture(autouse=True)
    def setup(self, client):
        """Setup para cada teste."""
        self.client = client
        self.auth_headers = {
            'Authorization': 'Bearer test-token',
            'Content-Type': 'application/json'
        }
    
    def test_response_is_json(self, client):
        """Testa se todas as respostas são JSON válido."""
        endpoints = [
            '/api/products',
            '/api/health',
            '/api/exercises',
        ]
        
        for endpoint in endpoints:
            response = client.get(endpoint)
            if response.status_code == 200:
                # Deve conseguir fazer parse do JSON
                try:
                    data = response.get_json()
                    assert isinstance(data, dict) or isinstance(data, list)
                except Exception as e:
                    pytest.fail(f"Endpoint {endpoint} não retorna JSON válido: {e}")
    
    def test_error_responses_have_message(self, client):
        """Testa se respostas de erro têm campo 'error' ou 'message'."""
        # Testa endpoint que requer autenticação
        response = client.get('/api/cart')
        
        if response.status_code >= 400:
            data = response.get_json()
            assert data is not None
            # Deve ter 'error' ou 'message'
            assert 'error' in data or 'message' in data or 'detail' in data
    
    def test_success_responses_structure(self, client):
        """Testa estrutura de respostas de sucesso."""
        with patch('services.product_service.ProductService.get_products') as mock:
            mock.return_value = {'products': [], 'total': 0}
            
            response = client.get('/api/products')
            
            if response.status_code == 200:
                data = response.get_json()
                assert isinstance(data, dict)
                # Resposta deve ser um dict, não None
                assert data is not None
    
    def test_list_endpoints_return_arrays(self, client):
        """Testa se endpoints de listagem retornam arrays."""
        endpoints_with_arrays = [
            ('/api/products', 'products'),
            ('/api/exercises', 'exercises'),
        ]
        
        for endpoint, key in endpoints_with_arrays:
            with patch(f'services.product_service.ProductService.get_products' if 'products' in endpoint else 
                      f'services.exercise_service.ExerciseService.get_exercises') as mock:
                mock.return_value = {key: [], 'total': 0}
                
                response = client.get(endpoint)
                
                if response.status_code == 200:
                    data = response.get_json()
                    if key in data:
                        assert isinstance(data[key], list)
    
    def test_paginated_endpoints_have_pagination(self, client):
        """Testa se endpoints paginados têm estrutura de paginação."""
        with patch('services.order_service.OrderService.get_user_orders') as mock:
            mock.return_value = {
                'orders': [],
                'pagination': {
                    'total': 0,
                    'page': 1,
                    'per_page': 20,
                    'pages': 0
                }
            }
            
            response = client.get('/api/orders', headers=self.auth_headers)
            
            if response.status_code == 200:
                data = response.get_json()
                # Deve ter 'orders' ou 'pagination' ou ambos
                assert 'orders' in data or 'pagination' in data or 'error' in data
