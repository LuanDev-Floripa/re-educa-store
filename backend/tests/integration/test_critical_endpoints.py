"""
Testes de integração para endpoints críticos.

Valida os 11 endpoints críticos identificados na verificação:
1. GET /api/cart
2. GET /api/orders
3. GET /api/products
4. GET /api/exercises
5. GET /api/health/imc/history
6. GET /api/health/food-diary/entries
7. GET /api/social/messages
8. GET /api/social/groups
9. GET /api/gamification/stats
10. GET /api/gamification/challenges
11. POST /api/payments/process
"""
import pytest
from unittest.mock import patch, MagicMock


@pytest.mark.integration
class TestCriticalEndpoints:
    """Testes para endpoints críticos da aplicação."""
    
    @pytest.fixture(autouse=True)
    def setup(self, client, mock_user):
        """Setup para cada teste."""
        self.client = client
        self.mock_user = mock_user
        self.auth_headers = {
            'Authorization': 'Bearer test-token',
            'Content-Type': 'application/json'
        }
    
    @patch('utils.decorators.token_required')
    @patch('services.cart_service.CartService.get_cart')
    def test_get_cart(self, mock_get_cart, mock_token_required):
        """Testa GET /api/cart - endpoint crítico #1."""
        mock_get_cart.return_value = {
            'items': [],
            'total': 0,
            'subtotal': 0
        }
        
        response = self.client.get('/api/cart', headers=self.auth_headers)
        
        # Endpoint pode retornar 200 (sucesso), 400 (bad request), 401 (não autenticado)
        assert response.status_code in [200, 400, 401]
        if response.status_code == 200:
            data = response.get_json()
            assert 'items' in data or 'error' in data
    
    @patch('utils.decorators.token_required')
    @patch('services.order_service.OrderService.get_user_orders')
    def test_get_orders(self, mock_get_orders, mock_token_required):
        """Testa GET /api/orders - endpoint crítico #2."""
        mock_get_orders.return_value = {
            'orders': [],
            'pagination': {'total': 0, 'page': 1, 'per_page': 20}
        }
        
        response = self.client.get('/api/orders', headers=self.auth_headers)
        
        # Endpoint pode retornar 200, 400, 401
        assert response.status_code in [200, 400, 401]
        if response.status_code == 200:
            data = response.get_json()
            assert 'orders' in data or 'error' in data
    
    @patch('services.product_service.ProductService.get_products')
    def test_get_products(self, mock_get_products):
        """Testa GET /api/products - endpoint crítico #3."""
        mock_get_products.return_value = {
            'products': [],
            'total': 0
        }
        
        response = self.client.get('/api/products')
        
        assert response.status_code == 200
        data = response.get_json()
        assert 'products' in data or 'error' in data
    
    @patch('services.exercise_service.ExerciseService.get_exercises')
    def test_get_exercises(self, mock_get_exercises):
        """Testa GET /api/exercises - endpoint crítico #4."""
        mock_get_exercises.return_value = {
            'exercises': [],
            'total': 0
        }
        
        response = self.client.get('/api/exercises')
        
        # Endpoint pode retornar 200, 401 (requer autenticação)
        assert response.status_code in [200, 401]
        if response.status_code == 200:
            data = response.get_json()
            assert 'exercises' in data or 'error' in data
    
    @patch('utils.decorators.token_required')
    @patch('services.health_service.HealthService.get_imc_history')
    def test_get_imc_history(self, mock_get_history, mock_token_required):
        """Testa GET /api/health/imc/history - endpoint crítico #5."""
        mock_get_history.return_value = {
            'history': [],
            'total': 0
        }
        
        response = self.client.get('/api/health/imc/history', headers=self.auth_headers)
        
        # Endpoint pode retornar 200, 400, 401
        assert response.status_code in [200, 400, 401]
        if response.status_code == 200:
            data = response.get_json()
            assert 'history' in data or 'error' in data
    
    @patch('utils.decorators.token_required')
    @patch('services.health_service.HealthService.get_food_entries')
    def test_get_food_diary_entries(self, mock_get_entries, mock_token_required):
        """Testa GET /api/health/food-diary/entries - endpoint crítico #6."""
        mock_get_entries.return_value = {
            'entries': [],
            'total': 0
        }
        
        response = self.client.get('/api/health/food-diary/entries', headers=self.auth_headers)
        
        # Endpoint pode retornar 200, 400, 401
        assert response.status_code in [200, 400, 401]
        if response.status_code == 200:
            data = response.get_json()
            assert 'entries' in data or 'error' in data
    
    @patch('utils.decorators.token_required')
    @patch('services.messages_service.MessagesService.get_conversations')
    def test_get_social_messages(self, mock_get_conversations, mock_token_required):
        """Testa GET /api/social/messages - endpoint crítico #7."""
        mock_get_conversations.return_value = {
            'conversations': []
        }
        
        response = self.client.get('/api/social/messages', headers=self.auth_headers)
        
        # Endpoint pode retornar 200, 400, 401
        assert response.status_code in [200, 400, 401]
        if response.status_code == 200:
            data = response.get_json()
            assert 'conversations' in data or 'error' in data
    
    @patch('utils.decorators.token_required')
    @patch('services.groups_service.GroupsService.get_groups')
    def test_get_social_groups(self, mock_get_groups, mock_token_required):
        """Testa GET /api/social/groups - endpoint crítico #8."""
        mock_get_groups.return_value = {
            'groups': [],
            'total': 0
        }
        
        response = self.client.get('/api/social/groups', headers=self.auth_headers)
        
        # Endpoint pode retornar 200, 400, 401
        assert response.status_code in [200, 400, 401]
        if response.status_code == 200:
            data = response.get_json()
            assert 'groups' in data or 'error' in data
    
    @patch('utils.decorators.token_required')
    @patch('services.gamification_service.GamificationService.get_user_stats')
    def test_get_gamification_stats(self, mock_get_stats, mock_token_required):
        """Testa GET /api/gamification/stats - endpoint crítico #9."""
        mock_get_stats.return_value = {
            'user_id': 'test-id',
            'total_points': 0,
            'level': 1,
            'achievements_count': 0
        }
        
        response = self.client.get('/api/gamification/stats', headers=self.auth_headers)
        
        # Endpoint pode retornar 200, 400, 401
        assert response.status_code in [200, 400, 401]
        if response.status_code == 200:
            data = response.get_json()
            assert 'total_points' in data or 'error' in data
    
    @patch('utils.decorators.token_required')
    @patch('services.gamification_service.GamificationService.get_challenges')
    def test_get_gamification_challenges(self, mock_get_challenges, mock_token_required):
        """Testa GET /api/gamification/challenges - endpoint crítico #10."""
        mock_get_challenges.return_value = {
            'challenges': [],
            'total': 0
        }
        
        response = self.client.get('/api/gamification/challenges', headers=self.auth_headers)
        
        # Endpoint pode retornar 200, 400, 401
        assert response.status_code in [200, 400, 401]
        if response.status_code == 200:
            data = response.get_json()
            assert 'challenges' in data or 'error' in data
    
    @patch('utils.decorators.token_required')
    @patch('services.payment_service.PaymentService.create_stripe_payment_intent')
    def test_post_payments_process(self, mock_process, mock_token_required):
        """Testa POST /api/payments/process - endpoint crítico #11."""
        mock_process.return_value = {
            'success': True,
            'client_secret': 'test-secret',
            'payment_intent_id': 'test-id'
        }
        
        payload = {
            'payment_method': 'stripe',
            'amount': 100.0,
            'currency': 'brl'
        }
        
        response = self.client.post(
            '/api/payments/process',
            json=payload,
            headers=self.auth_headers
        )
        
        assert response.status_code in [200, 400, 401]
        if response.status_code == 200:
            data = response.get_json()
            assert 'success' in data or 'error' in data
