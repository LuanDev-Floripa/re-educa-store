# -*- coding: utf-8 -*-
"""
Estratégias de Tratamento de Exceções RE-EDUCA Store.

Fornece padrões consistentes e seguros para substituir
'except Exception' genérico por tratamento específico.

PROBLEMA: except Exception é muito amplo e pode esconder bugs.
SOLUÇÃO: Tratar exceções específicas primeiro, Exception como último recurso.
"""

import logging
from typing import Any, Callable, Dict, Optional, Tuple
from functools import wraps

from exceptions.custom_exceptions import (
    ValidationError,
    DatabaseError,
    NotFoundError,
    UnauthorizedError,
    InternalServerError
)

logger = logging.getLogger(__name__)


# ============================================================
# CATEGORIA 1: Database Operations
# ============================================================

def handle_database_exceptions(operation_name: str):
    """
    Decorator para operações de banco de dados.
    
    Trata exceções específicas de DB e converte para exceções customizadas.
    
    Usage:
        @handle_database_exceptions('criar usuário')
        def create_user(self, data):
            return self.repo.create(data)
    """
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        def wrapper(*args, **kwargs):
            try:
                return func(*args, **kwargs)
            
            # Exceções de validação
            except ValueError as e:
                logger.warning(f"Erro de validação em {operation_name}: {str(e)}")
                raise ValidationError(
                    message=f"Dados inválidos para {operation_name}",
                    details={'error': str(e)}
                )
            
            # Campos obrigatórios ausentes
            except KeyError as e:
                logger.warning(f"Campo obrigatório ausente em {operation_name}: {str(e)}")
                raise ValidationError(
                    message=f"Campo obrigatório ausente: {str(e)}",
                    details={'missing_field': str(e)}
                )
            
            # Erros de tipo
            except TypeError as e:
                logger.warning(f"Erro de tipo em {operation_name}: {str(e)}")
                raise ValidationError(
                    message=f"Tipo de dado incorreto para {operation_name}",
                    details={'error': str(e)}
                )
            
            # Erros de atributo (objeto não tem propriedade esperada)
            except AttributeError as e:
                logger.error(f"Erro de atributo em {operation_name}: {str(e)}")
                raise DatabaseError(
                    message=f"Estrutura de dados inesperada em {operation_name}",
                    details={'error': str(e)}
                )
            
            # Erro genérico - último recurso
            except Exception as e:
                logger.error(f"Erro não tratado em {operation_name}: {str(e)}", exc_info=True)
                raise InternalServerError(
                    message=f"Erro ao {operation_name}",
                    details={'error': str(e) if logger.level == logging.DEBUG else None}
                )
        
        return wrapper
    return decorator


# ============================================================
# CATEGORIA 2: API/External Service Operations
# ============================================================

def handle_external_api_exceptions(service_name: str):
    """
    Decorator para chamadas a APIs externas (Stripe, USDA, etc).
    
    Usage:
        @handle_external_api_exceptions('Stripe')
        def create_payment_intent(self, amount):
            return stripe.PaymentIntent.create(...)
    """
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        def wrapper(*args, **kwargs):
            try:
                return func(*args, **kwargs)
            
            # Timeout de rede
            except requests.exceptions.Timeout as e:
                logger.error(f"Timeout ao chamar {service_name}: {str(e)}")
                raise InternalServerError(
                    message=f"{service_name} não respondeu a tempo",
                    details={'service': service_name, 'error': 'timeout'}
                )
            
            # Erro de conexão
            except requests.exceptions.ConnectionError as e:
                logger.error(f"Erro de conexão com {service_name}: {str(e)}")
                raise InternalServerError(
                    message=f"Não foi possível conectar ao {service_name}",
                    details={'service': service_name, 'error': 'connection'}
                )
            
            # Erro HTTP (4xx, 5xx)
            except requests.exceptions.HTTPError as e:
                logger.error(f"Erro HTTP do {service_name}: {str(e)}")
                raise InternalServerError(
                    message=f"{service_name} retornou erro",
                    details={'service': service_name, 'status': e.response.status_code if hasattr(e, 'response') else None}
                )
            
            # Stripe específico
            except Exception as e:
                if 'stripe' in str(type(e)).lower():
                    logger.error(f"Erro Stripe: {str(e)}")
                    raise InternalServerError(
                        message="Erro no processamento de pagamento",
                        details={'service': 'Stripe'}
                    )
                
                # Erro genérico
                logger.error(f"Erro não tratado ao chamar {service_name}: {str(e)}", exc_info=True)
                raise InternalServerError(
                    message=f"Erro ao comunicar com {service_name}",
                    details={'service': service_name}
                )
        
        return wrapper
    return decorator


# ============================================================
# CATEGORIA 3: Business Logic Operations
# ============================================================

def handle_service_exceptions(operation_name: str, return_dict: bool = True):
    """
    Decorator para lógica de negócio em Services.
    
    Args:
        operation_name: Nome da operação (ex: 'criar pedido')
        return_dict: Se True, retorna dict com success/error. Se False, lança exceção.
    
    Usage:
        @handle_service_exceptions('criar pedido')
        def create_order(self, data):
            # lógica
    """
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        def wrapper(*args, **kwargs):
            try:
                result = func(*args, **kwargs)
                
                # Se retorna dict, garante que tem success
                if return_dict and isinstance(result, dict) and 'success' not in result:
                    return {'success': True, **result}
                
                return result
            
            # Exceções customizadas - repassa
            except (ValidationError, NotFoundError, UnauthorizedError) as e:
                logger.info(f"Exceção esperada em {operation_name}: {e.error_code}")
                if return_dict:
                    return {
                        'success': False,
                        'error': e.message,
                        'error_code': e.error_code,
                        'details': e.details
                    }
                raise
            
            # Validação
            except ValueError as e:
                logger.warning(f"Erro de validação em {operation_name}: {str(e)}")
                if return_dict:
                    return {'success': False, 'error': f'Dados inválidos: {str(e)}'}
                raise ValidationError(message=str(e))
            
            # Campo ausente
            except KeyError as e:
                logger.warning(f"Campo ausente em {operation_name}: {str(e)}")
                if return_dict:
                    return {'success': False, 'error': f'Campo obrigatório: {str(e)}'}
                raise ValidationError(message=f'Campo obrigatório: {str(e)}')
            
            # Tipo incorreto
            except TypeError as e:
                logger.warning(f"Erro de tipo em {operation_name}: {str(e)}")
                if return_dict:
                    return {'success': False, 'error': f'Tipo de dado incorreto'}
                raise ValidationError(message='Tipo de dado incorreto')
            
            # Erro genérico - último recurso
            except Exception as e:
                logger.error(f"Erro não tratado em {operation_name}: {str(e)}", exc_info=True)
                if return_dict:
                    return {
                        'success': False,
                        'error': 'Erro interno do servidor',
                        'details': str(e) if logger.level == logging.DEBUG else None
                    }
                raise InternalServerError(message=f"Erro ao {operation_name}")
        
        return wrapper
    return decorator


# ============================================================
# CATEGORIA 4: Repository Operations
# ============================================================

def safe_repository_call(func: Callable, default_return=None) -> Any:
    """
    Wrapper seguro para chamadas de repositório.
    
    Retorna default_return em caso de erro ao invés de lançar exceção.
    Útil para operações de leitura onde None é aceitável.
    
    Usage:
        user = safe_repository_call(
            lambda: self.repo.find_by_id(user_id),
            default_return=None
        )
    """
    try:
        return func()
    except (ValueError, KeyError, TypeError, AttributeError) as e:
        logger.warning(f"Erro esperado em repositório: {str(e)}")
        return default_return
    except Exception as e:
        logger.error(f"Erro não esperado em repositório: {str(e)}", exc_info=True)
        return default_return


# ============================================================
# CATEGORIA 5: Route Handlers
# ============================================================

def handle_route_exceptions(func: Callable) -> Callable:
    """
    Decorator para endpoints Flask.
    
    Converte exceções customizadas em respostas JSON adequadas.
    Exceções não tratadas retornam 500.
    
    Usage:
        @app.route('/endpoint')
        @handle_route_exceptions
        def my_endpoint():
            # pode lançar exceções customizadas
    """
    @wraps(func)
    def wrapper(*args, **kwargs):
        try:
            return func(*args, **kwargs)
        
        # Exceções customizadas já tem status_code e to_dict()
        except (ValidationError, NotFoundError, UnauthorizedError, DatabaseError, InternalServerError) as e:
            logger.warning(f"Exceção API: {e.error_code} - {e.message}")
            from flask import jsonify
            return jsonify(e.to_dict()), e.status_code
        
        # Erro genérico inesperado
        except Exception as e:
            logger.error(f"Erro não tratado em endpoint: {str(e)}", exc_info=True)
            from flask import jsonify
            return jsonify({
                'error': True,
                'error_code': 'INTERNAL_SERVER_ERROR',
                'message': 'Erro interno do servidor',
                'details': {}
            }), 500
    
    return wrapper


# ============================================================
# UTILITÁRIOS
# ============================================================

def log_and_suppress(error: Exception, operation: str, default_return=None) -> Any:
    """
    Loga erro e retorna valor padrão ao invés de lançar exceção.
    
    Útil para operações não críticas onde falha é aceitável.
    
    Args:
        error: Exceção capturada
        operation: Nome da operação para log
        default_return: Valor a retornar em caso de erro
    
    Returns:
        default_return
    """
    if isinstance(error, (ValueError, KeyError, TypeError)):
        logger.warning(f"Erro não crítico em {operation}: {str(error)}")
    else:
        logger.error(f"Erro em {operation}: {str(error)}", exc_info=True)
    
    return default_return


def categorize_exception(error: Exception) -> Tuple[str, int]:
    """
    Categoriza exceção e retorna mensagem + status HTTP apropriado.
    
    Args:
        error: Exceção a categorizar
    
    Returns:
        Tuple[str, int]: (mensagem, status_code)
    """
    # Validação
    if isinstance(error, (ValueError, KeyError, TypeError)):
        return "Dados inválidos", 400
    
    # Não encontrado
    if isinstance(error, (AttributeError, IndexError)):
        return "Recurso não encontrado", 404
    
    # Permissão
    if isinstance(error, PermissionError):
        return "Acesso negado", 403
    
    # Conexão/timeout
    if hasattr(error, '__module__') and 'requests' in error.__module__:
        return "Erro de comunicação externa", 503
    
    # Genérico
    return "Erro interno do servidor", 500


# ============================================================
# PADRÕES RECOMENDADOS
# ============================================================

"""
PADRÃO 1 - ROUTES (use o decorator handle_route_exceptions):
─────────────────────────────────────────────────────────────

@app.route('/endpoint')
@handle_route_exceptions
def my_endpoint():
    # Pode lançar exceções customizadas
    if not data:
        raise ValidationError("Dados obrigatórios")
    
    result = service.do_something(data)
    return jsonify(result), 200


PADRÃO 2 - SERVICES (use handle_service_exceptions):
─────────────────────────────────────────────────────────────

@handle_service_exceptions('criar pedido')
def create_order(self, data: Dict) -> Dict:
    # Validações com exceções específicas
    if not data.get('items'):
        raise ValueError("Items são obrigatórios")
    
    # Operação
    order = self.repo.create(data)
    return {'order': order}


PADRÃO 3 - REPOSITORIES (trate específico, genérico como último):
─────────────────────────────────────────────────────────────

def find_by_id(self, id: str) -> Optional[Dict]:
    try:
        result = self.db.table(self.table).select().eq('id', id).execute()
        return result.data[0] if result.data else None
    
    except ValueError as e:
        self.logger.warning(f"Validação falhou: {e}")
        return None
    
    except KeyError as e:
        self.logger.warning(f"Campo ausente: {e}")
        return None
    
    except AttributeError as e:
        self.logger.error(f"Estrutura inesperada: {e}")
        return None
    
    except Exception as e:
        # Último recurso - loga tudo
        self.logger.error(f"Erro não esperado: {e}", exc_info=True)
        return None


PADRÃO 4 - CHAMADAS EXTERNAS (use handle_external_api_exceptions):
─────────────────────────────────────────────────────────────

@handle_external_api_exceptions('Stripe')
def create_stripe_customer(self, user_data: Dict) -> Dict:
    customer = stripe.Customer.create(
        email=user_data['email'],
        name=user_data['name']
    )
    return {'success': True, 'customer_id': customer.id}


PADRÃO 5 - OPERAÇÕES NÃO CRÍTICAS (use safe_repository_call):
─────────────────────────────────────────────────────────────

# Cache ou operações onde falha é aceitável
cached_data = safe_repository_call(
    lambda: cache_service.get(cache_key),
    default_return=None
)
"""
