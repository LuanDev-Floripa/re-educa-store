# -*- coding: utf-8 -*-
"""
Helper para tratamento de exceções RE-EDUCA Store.

Fornece funções utilitárias para mapear exceções Python padrão
para exceções customizadas da API.
"""
import logging
from typing import Any, Dict, Tuple

from exceptions.custom_exceptions import (
    BadRequestError,
    BaseAPIException,
    DatabaseError,
    ForbiddenError,
    InternalServerError,
    NotFoundError,
)

logger = logging.getLogger(__name__)


def handle_exception(e: Exception, context: str = "") -> Tuple[Dict[str, Any], int]:
    """
    Mapeia exceções Python padrão para exceções customizadas da API.

    Args:
        e: Exceção capturada
        context: Contexto adicional para logging

    Returns:
        Tuple[Dict, int]: Resposta JSON e código HTTP
    """
    # Se já é uma exceção customizada, retornar diretamente
    if isinstance(e, BaseAPIException):
        logger.debug(f"Exceção customizada capturada: {e.__class__.__name__} - {e.message}")
        return e.to_dict(), e.status_code

    # Mapear exceções Python padrão para exceções customizadas
    error_context = f" ({context})" if context else ""

    if isinstance(e, ValueError):
        logger.warning(f"ValueError{error_context}: {str(e)}")
        error = BadRequestError(
            message=f"Dados inválidos: {str(e)}", details={"original_error": str(e), "context": context}
        )
        return error.to_dict(), error.status_code

    elif isinstance(e, KeyError):
        logger.warning(f"KeyError{error_context}: {str(e)}")
        error = BadRequestError(
            message=f"Campo obrigatório ausente: {str(e)}", details={"original_error": str(e), "context": context}
        )
        return error.to_dict(), error.status_code

    elif isinstance(e, PermissionError):
        logger.warning(f"PermissionError{error_context}: {str(e)}")
        error = ForbiddenError(
            message=f"Acesso negado: {str(e)}", details={"original_error": str(e), "context": context}
        )
        return error.to_dict(), error.status_code

    elif isinstance(e, FileNotFoundError):
        logger.warning(f"FileNotFoundError{error_context}: {str(e)}")
        error = NotFoundError(
            message=f"Arquivo não encontrado: {str(e)}", details={"original_error": str(e), "context": context}
        )
        return error.to_dict(), error.status_code

    elif isinstance(e, ConnectionError) or isinstance(e, TimeoutError):
        logger.error(f"ConnectionError/TimeoutError{error_context}: {str(e)}")
        error = InternalServerError(
            message="Erro de conexão com serviço externo", details={"original_error": str(e), "context": context}
        )
        return error.to_dict(), error.status_code

    elif isinstance(e, AttributeError):
        # Pode ser erro de programação ou dados inválidos
        logger.error(f"AttributeError{error_context}: {str(e)}")
        error = BadRequestError(
            message="Dados inválidos ou estrutura incorreta", details={"original_error": str(e), "context": context}
        )
        return error.to_dict(), error.status_code

    elif isinstance(e, TypeError):
        logger.error(f"TypeError{error_context}: {str(e)}")
        error = BadRequestError(message="Tipo de dado inválido", details={"original_error": str(e), "context": context})
        return error.to_dict(), error.status_code

    elif isinstance(e, IndexError):
        logger.warning(f"IndexError{error_context}: {str(e)}")
        error = NotFoundError(message="Índice não encontrado", details={"original_error": str(e), "context": context})
        return error.to_dict(), error.status_code

    # Exceções de banco de dados (psycopg, supabase, etc)
    elif "psycopg" in str(type(e).__module__) or "supabase" in str(type(e).__module__).lower():
        logger.error(f"DatabaseError{error_context}: {str(e)}")
        error = DatabaseError(message="Erro no banco de dados", details={"original_error": str(e), "context": context})
        return error.to_dict(), error.status_code

    # Exceção genérica (último recurso)
    else:
        logger.error(f"Exception não mapeada{error_context}: {type(e).__name__} - {str(e)}", exc_info=True)
        error = InternalServerError(
            message="Erro interno do servidor", details={"error_type": type(e).__name__, "context": context}
        )
        return error.to_dict(), error.status_code


def wrap_exception_handler(func):
    """
    Decorator para aplicar tratamento automático de exceções.

    Uso:
        @wrap_exception_handler
        def minha_funcao():
            # código que pode lançar exceções
            pass
    """
    import functools

    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        try:
            return func(*args, **kwargs)
        except BaseAPIException:
            # Re-raise exceções customizadas (já tratadas)
            raise
        except Exception as e:
            # Mapear exceções padrão
            context = f"{func.__module__}.{func.__name__}"
            response, status_code = handle_exception(e, context)
            from flask import jsonify

            return jsonify(response), status_code

    return wrapper
