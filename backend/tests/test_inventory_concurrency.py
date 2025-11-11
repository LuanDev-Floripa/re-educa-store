"""
Testes de Concorrência para Inventory Service.

Testa que operações de estoque são thread-safe e não têm race conditions.
"""
import pytest
import threading
import time
from services.inventory_service import InventoryService
from repositories.product_repository import ProductRepository
from config.database import supabase_client


class TestInventoryConcurrency:
    """Testes de concorrência para operações de estoque."""

    @pytest.fixture
    def inventory_service(self):
        """Fixture para criar instância do serviço."""
        return InventoryService()

    @pytest.fixture
    def test_product(self):
        """Cria produto de teste com estoque inicial."""
        product_repo = ProductRepository()
        
        # Criar produto de teste
        product_data = {
            'name': 'Produto Teste Concorrência',
            'description': 'Teste',
            'price': 10.00,
            'stock_quantity': 100,  # Estoque inicial
            'category': 'test',
            'is_active': True
        }
        
        result = supabase_client.table('products').insert(product_data).execute()
        if result.data:
            product_id = result.data[0]['id']
            yield product_id
            
            # Cleanup: deletar produto de teste
            supabase_client.table('products').delete().eq('id', product_id).execute()
        else:
            pytest.skip("Não foi possível criar produto de teste")

    def test_concurrent_stock_updates(self, inventory_service, test_product):
        """
        Testa múltiplas atualizações de estoque simultâneas.
        
        Cenário: 10 threads tentam subtrair 5 unidades cada simultaneamente.
        Resultado esperado: Estoque final = 100 - (10 * 5) = 50
        """
        product_id = test_product
        threads = []
        results = []
        errors = []
        
        def subtract_stock(thread_id):
            """Função para subtrair estoque em uma thread."""
            try:
                result = inventory_service.update_stock(
                    product_id, 
                    quantity_change=5, 
                    operation='subtract'
                )
                results.append((thread_id, result))
            except Exception as e:
                errors.append((thread_id, str(e)))
        
        # Criar 10 threads
        for i in range(10):
            thread = threading.Thread(target=subtract_stock, args=(i,))
            threads.append(thread)
        
        # Iniciar todas as threads simultaneamente
        for thread in threads:
            thread.start()
        
        # Aguardar todas terminarem
        for thread in threads:
            thread.join(timeout=10)
        
        # Verificar que não houve erros
        assert len(errors) == 0, f"Erros durante execução: {errors}"
        
        # Verificar que todas as operações foram bem-sucedidas
        successful = [r for r in results if r[1].get('success')]
        assert len(successful) == 10, f"Esperado 10 sucessos, obtido {len(successful)}"
        
        # Verificar estoque final (deve ser 100 - 50 = 50)
        product = inventory_service.get_product_stock(product_id)
        final_stock = product.get('stock_quantity', 0)
        
        assert final_stock == 50, f"Estoque final incorreto: esperado 50, obtido {final_stock}"

    def test_concurrent_stock_insufficient(self, inventory_service, test_product):
        """
        Testa que estoque não fica negativo mesmo com múltiplas requisições.
        
        Cenário: Produto tem 10 unidades, 20 threads tentam subtrair 1 cada.
        Resultado esperado: Apenas 10 operações devem ter sucesso, 10 devem falhar.
        """
        product_id = test_product
        
        # Definir estoque inicial para 10
        product_repo = ProductRepository()
        product_repo.update_stock(product_id, 10)
        
        threads = []
        results = []
        
        def subtract_one():
            """Subtrai 1 unidade."""
            result = inventory_service.update_stock(
                product_id, 
                quantity_change=1, 
                operation='subtract'
            )
            results.append(result)
        
        # Criar 20 threads
        for i in range(20):
            thread = threading.Thread(target=subtract_one)
            threads.append(thread)
        
        # Iniciar todas simultaneamente
        for thread in threads:
            thread.start()
        
        # Aguardar todas terminarem
        for thread in threads:
            thread.join(timeout=10)
        
        # Verificar resultados
        successful = [r for r in results if r.get('success')]
        failed = [r for r in results if not r.get('success')]
        
        # Apenas 10 devem ter sucesso (estoque = 10)
        assert len(successful) == 10, f"Esperado 10 sucessos, obtido {len(successful)}"
        assert len(failed) == 10, f"Esperado 10 falhas, obtido {len(failed)}"
        
        # Verificar que estoque final é 0 (não negativo)
        product = inventory_service.get_product_stock(product_id)
        final_stock = product.get('stock_quantity', 0)
        
        assert final_stock == 0, f"Estoque final deve ser 0, obtido {final_stock}"
        assert final_stock >= 0, "Estoque nunca deve ficar negativo"

    def test_stock_check_constraint(self, inventory_service):
        """
        Testa que CHECK constraint impede estoque negativo no banco.
        
        Tenta inserir produto com estoque negativo diretamente no banco.
        Deve falhar.
        """
        product_data = {
            'name': 'Produto Teste Constraint',
            'description': 'Teste',
            'price': 10.00,
            'stock_quantity': -10,  # Estoque negativo
            'category': 'test',
            'is_active': True
        }
        
        # Tentar inserir com estoque negativo (deve falhar)
        try:
            result = supabase_client.table('products').insert(product_data).execute()
            # Se chegou aqui, constraint não está funcionando
            if result.data:
                product_id = result.data[0]['id']
                # Limpar
                supabase_client.table('products').delete().eq('id', product_id).execute()
            pytest.fail("CHECK constraint não impediu estoque negativo!")
        except Exception as e:
            # Esperado: erro de constraint
            assert 'check_stock_positive' in str(e) or 'constraint' in str(e).lower(), \
                f"Erro inesperado: {e}"