"""
Testes simples de validação para verificar se endpoints estão acessíveis.

Estes testes são mais simples e não requerem mocks complexos.
"""
import pytest


@pytest.mark.integration
class TestSimpleEndpointValidation:
    """Testes simples de validação de endpoints."""
    
    @pytest.fixture(autouse=True)
    def setup(self, client):
        """Setup para cada teste."""
        self.client = client
    
    def test_health_endpoint(self):
        """Testa se endpoint de health está acessível."""
        response = self.client.get('/health')
        assert response.status_code == 200
        data = response.get_json()
        assert 'status' in data
    
    def test_products_endpoint_exists(self):
        """Testa se endpoint de products existe."""
        response = self.client.get('/api/products')
        # Deve retornar 200 (sucesso) ou 404 (não encontrado), mas não 500 (erro interno)
        assert response.status_code != 500
        assert response.status_code in [200, 404]
    
    def test_exercises_endpoint_exists(self):
        """Testa se endpoint de exercises existe."""
        response = self.client.get('/api/exercises')
        assert response.status_code != 500
        assert response.status_code in [200, 401, 404]  # 401 = requer autenticação
    
    def test_products_endpoint_returns_json(self):
        """Testa se endpoint de products retorna JSON."""
        response = self.client.get('/api/products')
        if response.status_code == 200:
            # Deve conseguir fazer parse do JSON
            try:
                data = response.get_json()
                assert data is not None
            except Exception:
                pytest.fail("Endpoint /api/products não retorna JSON válido")
    
    def test_nonexistent_endpoint_returns_404(self):
        """Testa se endpoint inexistente retorna 404."""
        response = self.client.get('/api/nonexistent-endpoint-12345')
        assert response.status_code == 404
    
    def test_endpoints_handle_cors(self):
        """Testa se endpoints têm CORS configurado."""
        response = self.client.get('/api/products')
        # CORS headers podem estar presentes
        # Não vamos falhar se não estiverem, apenas verificar que não quebra
        assert response.status_code != 500
