"""
Middleware de Autenticação para Testes RE-EDUCA Store.

Fornece bypass de autenticação para testes automatizados incluindo:
- Decorators mock que simulam token_required
- Usuários mock (user e admin)
- Ativação via variáveis de ambiente

CONFIGURAÇÃO:
- TESTING=true para ativar modo teste
- BYPASS_AUTH=true para bypass de autenticação

AVISO IMPORTANTE:
- NUNCA usar em produção!
- Apenas para testes automatizados
- Verificar env vars antes de deploy
"""
import os
from functools import wraps
from flask import request, jsonify

def create_test_auth_bypass():
    """
    Cria um bypass de autenticação para testes.
    
    Returns:
        tuple: (test_token_required, test_admin_required) decorators.
    """
    
    # Verifica se está em modo de teste
    is_testing = os.environ.get('TESTING', 'false').lower() == 'true'
    bypass_auth = os.environ.get('BYPASS_AUTH', 'false').lower() == 'true'
    
    def test_token_required(f):
        """Decorator de teste que bypassa autenticação"""
        @wraps(f)
        def decorated(*args, **kwargs):
            # Se estiver em modo de teste e bypass ativado, ignora autenticação
            if is_testing and bypass_auth:
                # Cria um usuário mock para testes
                class MockUser:
                    def __init__(self):
                        self.id = 'test-user-id'
                        self.email = 'test@example.com'
                        self.name = 'Test User'
                        self.role = 'admin'
                    
                    def get(self, key, default=None):
                        return getattr(self, key, default)
                
                request.current_user = MockUser()
                return f(*args, **kwargs)
            
            # Caso contrário, usa autenticação normal
            from middleware.auth import token_required
            return token_required(f)(*args, **kwargs)
        
        return decorated
    
    def test_admin_required(f):
        """Decorator de teste que bypassa autenticação de admin"""
        @wraps(f)
        def decorated(*args, **kwargs):
            if is_testing and bypass_auth:
                class MockAdmin:
                    def __init__(self):
                        self.id = 'test-admin-id'
                        self.email = 'admin@test.com'
                        self.name = 'Test Admin'
                        self.role = 'admin'
                    
                    def get(self, key, default=None):
                        return getattr(self, key, default)
                
                request.current_user = MockAdmin()
                return f(*args, **kwargs)
            
            from middleware.auth import admin_required
            return admin_required(f)(*args, **kwargs)
        
        return decorated
    
    return test_token_required, test_admin_required

# Exporta os decorators de teste
test_token_required, test_admin_required = create_test_auth_bypass()
