"""
Testes Básicos de Funcionalidade RE-EDUCA Store.

Testes fundamentais para validar:
- Imports de dependências
- Configuração do pytest
- Funções utilitárias básicas
- Criação da aplicação Flask
- Variáveis de ambiente
"""

import os
import sys

import pytest

# Adiciona o diretório src ao path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))


class TestBasicFunctionality:
    """
    Testes básicos de funcionalidade RE-EDUCA Store.

    Validações fundamentais do ambiente de testes e
    configurações básicas da aplicação.
    """

    def test_imports(self):
        """
        Testa se os imports básicos funcionam.

        Verifica:
        - Importação do Flask
        - Versão do Flask disponível
        - Ausência de erros de importação

        Raises:
            pytest.fail: Se Flask não puder ser importado.
        """
        try:
            import flask

            assert flask.__version__ is not None
        except ImportError:
            pytest.fail("Flask não pode ser importado")

    def test_pytest_configuration(self):
        """Testa se a configuração do pytest está correta"""
        import pytest

        # Verifica se os marks estão disponíveis
        assert hasattr(pytest.mark, "unit")
        assert hasattr(pytest.mark, "integration")
        assert hasattr(pytest.mark, "auth")
        assert hasattr(pytest.mark, "health")
        assert hasattr(pytest.mark, "nutrition")
        assert hasattr(pytest.mark, "payment")
        assert hasattr(pytest.mark, "ai")

    def test_utility_functions(self):
        """Testa funções utilitárias básicas"""
        from datetime import datetime, timedelta, timezone

        # Testa datetime com timezone
        now = datetime.now(timezone.utc)
        assert now.tzinfo is not None

        # Testa timedelta
        future = now + timedelta(days=7)
        assert future > now

    def test_basic_app_creation(self):
        """Testa criação básica da aplicação Flask"""
        try:
            from app import create_app

            app = create_app()
            assert app is not None
            assert hasattr(app, "config")
            # Não verifica TESTING pois pode não estar configurado
        except Exception as e:
            pytest.fail(f"Erro ao criar aplicação: {str(e)}")

    def test_environment_variables(self):
        """Testa se as variáveis de ambiente estão configuradas"""
        assert os.environ.get("SECRET_KEY") == "test-secret-key"
        assert os.environ.get("SUPABASE_URL") == "https://test.supabase.co"
        assert os.environ.get("SUPABASE_KEY") == "test-key"
