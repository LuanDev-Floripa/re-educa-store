# -*- coding: utf-8 -*-
"""
Exceções customizadas para RE-EDUCA Store.

Todas as exceções seguem padrão consistente de mensagens e códigos HTTP.
"""
from typing import Any, Dict, Optional


class BaseAPIException(Exception):
    """Classe base para todas as exceções da API"""

    def __init__(
        self,
        message: str,
        status_code: int = 500,
        details: Optional[Dict[str, Any]] = None,
        error_code: Optional[str] = None,
    ):
        self.message = message
        self.status_code = status_code
        self.details = details or {}
        self.error_code = error_code or self.__class__.__name__
        super().__init__(self.message)

    def to_dict(self) -> Dict[str, Any]:
        """Converte exceção para dicionário (para resposta JSON)"""
        return {"error": True, "error_code": self.error_code, "message": self.message, "details": self.details}


class ValidationError(BaseAPIException):
    """Erro de validação de dados (400)"""

    def __init__(self, message: str = "Dados inválidos", details: Optional[Dict[str, Any]] = None):
        super().__init__(message=message, status_code=400, details=details, error_code="VALIDATION_ERROR")


class BadRequestError(BaseAPIException):
    """Erro de requisição inválida (400)"""

    def __init__(self, message: str = "Requisição inválida", details: Optional[Dict[str, Any]] = None):
        super().__init__(message=message, status_code=400, details=details, error_code="BAD_REQUEST")


class UnauthorizedError(BaseAPIException):
    """Erro de autenticação (401)"""

    def __init__(self, message: str = "Não autenticado", details: Optional[Dict[str, Any]] = None):
        super().__init__(message=message, status_code=401, details=details, error_code="UNAUTHORIZED")


class ForbiddenError(BaseAPIException):
    """Erro de autorização (403)"""

    def __init__(self, message: str = "Acesso negado", details: Optional[Dict[str, Any]] = None):
        super().__init__(message=message, status_code=403, details=details, error_code="FORBIDDEN")


class NotFoundError(BaseAPIException):
    """Erro de recurso não encontrado (404)"""

    def __init__(self, message: str = "Recurso não encontrado", details: Optional[Dict[str, Any]] = None):
        super().__init__(message=message, status_code=404, details=details, error_code="NOT_FOUND")


class ConflictError(BaseAPIException):
    """Erro de conflito (409)"""

    def __init__(self, message: str = "Conflito de recursos", details: Optional[Dict[str, Any]] = None):
        super().__init__(message=message, status_code=409, details=details, error_code="CONFLICT")


class RateLimitError(BaseAPIException):
    """Erro de rate limit (429)"""

    def __init__(self, message: str = "Muitas requisições", details: Optional[Dict[str, Any]] = None):
        super().__init__(message=message, status_code=429, details=details, error_code="RATE_LIMIT_EXCEEDED")


class DatabaseError(BaseAPIException):
    """Erro de banco de dados (500)"""

    def __init__(self, message: str = "Erro no banco de dados", details: Optional[Dict[str, Any]] = None):
        super().__init__(message=message, status_code=500, details=details, error_code="DATABASE_ERROR")


class InternalServerError(BaseAPIException):
    """Erro interno do servidor (500)"""

    def __init__(self, message: str = "Erro interno do servidor", details: Optional[Dict[str, Any]] = None):
        super().__init__(message=message, status_code=500, details=details, error_code="INTERNAL_SERVER_ERROR")
