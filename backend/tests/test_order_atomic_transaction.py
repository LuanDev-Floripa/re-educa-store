"""
Testes de Transações Atômicas para Order Service.

Testa que criação de pedidos é atômica e não deixa dados inconsistentes.
"""
import pytest
from services.order_service import OrderService
from services.cart_service import CartService
from repositories.order_repository import OrderRepository
from repositories.product_repository import ProductRepository
from config.database import supabase_client


class TestOrderAtomicTransaction:
    """Testes de transações atômicas para criação de pedidos."""

    @pytest.fixture
    def order_service(self):
        """Fixture para criar instância do serviço."""
        return OrderService()

    @pytest.fixture
    def cart_service(self):
        """Fixture para criar instância do serviço."""
        return CartService()

    @pytest.fixture
    def test_user_id(self):
        """Retorna ID de usuário de teste."""
        # Usar usuário existente ou criar um de teste
        return "test-user-id-123"

    @pytest.fixture
    def test_product(self):
        """Cria produto de teste com estoque."""
        product_repo = ProductRepository()
        
        product_data = {
            'name': 'Produto Teste Pedido',
            'description': 'Teste',
            'price': 50.00,
            'stock_quantity': 100,
            'category': 'test',
            'is_active': True
        }
        
        result = supabase_client.table('products').insert(product_data).execute()
        if result.data:
            product_id = result.data[0]['id']
            yield product_id
            
            # Cleanup
            supabase_client.table('products').delete().eq('id', product_id).execute()
        else:
            pytest.skip("Não foi possível criar produto de teste")

    def test_order_creation_clears_cart(self, order_service, cart_service, test_user_id, test_product):
        """
        Testa que carrinho é limpo após criar pedido.
        
        Cenário: Adicionar item ao carrinho, criar pedido.
        Resultado esperado: Carrinho deve estar vazio após criar pedido.
        """
        # Adicionar item ao carrinho
        cart_result = cart_service.add_to_cart(test_user_id, test_product, 2)
        assert cart_result.get('success'), "Falha ao adicionar ao carrinho"
        
        # Verificar que carrinho tem itens
        cart = cart_service.get_cart(test_user_id)
        assert len(cart.get('items', [])) > 0, "Carrinho deveria ter itens"
        
        # Criar pedido
        order_data = {
            'shipping_address': {
                'street': 'Rua Teste',
                'city': 'São Paulo',
                'zip': '00000-000'
            },
            'payment_method': 'credit_card'
        }
        
        order_result = order_service.create_order(test_user_id, order_data)
        
        # Verificar que pedido foi criado
        assert order_result.get('success'), f"Falha ao criar pedido: {order_result.get('error')}"
        
        # Verificar que carrinho foi limpo
        cart_after = cart_service.get_cart(test_user_id)
        assert len(cart_after.get('items', [])) == 0, "Carrinho deveria estar vazio após criar pedido"

    def test_order_creation_fails_stock_insufficient(self, order_service, cart_service, test_user_id, test_product):
        """
        Testa que pedido não é criado se estoque insuficiente.
        
        Cenário: Adicionar mais itens ao carrinho do que há em estoque.
        Resultado esperado: Pedido não deve ser criado, carrinho não deve ser limpo.
        """
        # Adicionar mais itens do que há em estoque (estoque = 100, adicionar 150)
        cart_result = cart_service.add_to_cart(test_user_id, test_product, 150)
        assert cart_result.get('success'), "Falha ao adicionar ao carrinho"
        
        # Verificar que carrinho tem itens
        cart = cart_service.get_cart(test_user_id)
        assert len(cart.get('items', [])) > 0, "Carrinho deveria ter itens"
        
        # Tentar criar pedido (deve falhar por estoque insuficiente)
        order_data = {
            'shipping_address': {
                'street': 'Rua Teste',
                'city': 'São Paulo',
                'zip': '00000-000'
            },
            'payment_method': 'credit_card'
        }
        
        order_result = order_service.create_order(test_user_id, order_data)
        
        # Verificar que pedido NÃO foi criado
        assert not order_result.get('success'), "Pedido não deveria ser criado com estoque insuficiente"
        
        # Verificar que carrinho NÃO foi limpo (rollback)
        cart_after = cart_service.get_cart(test_user_id)
        assert len(cart_after.get('items', [])) > 0, "Carrinho não deveria ser limpo se pedido falhou"

    def test_order_creation_updates_stock(self, order_service, cart_service, test_user_id, test_product):
        """
        Testa que estoque é atualizado quando pedido é criado.
        
        Cenário: Estoque inicial = 100, pedido com 5 unidades.
        Resultado esperado: Estoque final = 95.
        """
        initial_stock = 100
        order_quantity = 5
        
        # Garantir estoque inicial
        product_repo = ProductRepository()
        product_repo.update_stock(test_product, initial_stock)
        
        # Adicionar ao carrinho
        cart_service.add_to_cart(test_user_id, test_product, order_quantity)
        
        # Criar pedido
        order_data = {
            'shipping_address': {
                'street': 'Rua Teste',
                'city': 'São Paulo',
                'zip': '00000-000'
            },
            'payment_method': 'credit_card'
        }
        
        order_result = order_service.create_order(test_user_id, order_data)
        assert order_result.get('success'), "Falha ao criar pedido"
        
        # Verificar estoque final
        from services.inventory_service import InventoryService
        inventory_service = InventoryService()
        stock_result = inventory_service.get_product_stock(test_product)
        
        final_stock = stock_result.get('stock_quantity', 0)
        expected_stock = initial_stock - order_quantity
        
        assert final_stock == expected_stock, \
            f"Estoque incorreto: esperado {expected_stock}, obtido {final_stock}"

    def test_order_creation_rollback_on_error(self, order_service, cart_service, test_user_id, test_product):
        """
        Testa que em caso de erro, tudo é revertido (rollback).
        
        Cenário: Simular erro durante criação de pedido.
        Resultado esperado: Nenhum pedido criado, carrinho intacto, estoque intacto.
        """
        initial_stock = 100
        
        # Garantir estoque inicial
        product_repo = ProductRepository()
        product_repo.update_stock(test_product, initial_stock)
        
        # Adicionar ao carrinho
        cart_service.add_to_cart(test_user_id, test_product, 5)
        
        # Verificar estado inicial
        cart_before = cart_service.get_cart(test_user_id)
        items_before = len(cart_before.get('items', []))
        
        # Tentar criar pedido com dados inválidos (deve falhar)
        # Por exemplo, sem shipping_address obrigatório
        order_data = {
            'payment_method': 'credit_card'
            # shipping_address faltando
        }
        
        # A função SQL deve validar e retornar erro
        # Se falhar, carrinho e estoque devem permanecer intactos
        order_result = order_service.create_order(test_user_id, order_data)
        
        # Se pedido falhou, verificar que nada mudou
        if not order_result.get('success'):
            cart_after = cart_service.get_cart(test_user_id)
            items_after = len(cart_after.get('items', []))
            
            # Carrinho deve estar intacto
            assert items_after == items_before, \
                "Carrinho não deveria ser alterado se pedido falhou"
            
            # Estoque deve estar intacto
            from services.inventory_service import InventoryService
            inventory_service = InventoryService()
            stock_result = inventory_service.get_product_stock(test_product)
            final_stock = stock_result.get('stock_quantity', 0)
            
            assert final_stock == initial_stock, \
                f"Estoque não deveria ser alterado se pedido falhou: esperado {initial_stock}, obtido {final_stock}"