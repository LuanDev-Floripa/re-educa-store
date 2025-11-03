# -*- coding: utf-8 -*-
"""
Exceções customizadas para RE-EDUCA Store.

Todas as exceções herdam de uma classe base para facilitar tratamento centralizado.
"""
from exceptions.custom_exceptions import (
    ValidationError,
    NotFoundError,
    UnauthorizedError,
    ForbiddenError,
    ConflictError,
    BadRequestError,
    InternalServerError,
    RateLimitError,
    DatabaseError
)

__all__ = [
    'ValidationError',
    'NotFoundError',
    'UnauthorizedError',
    'ForbiddenError',
    'ConflictError',
    'BadRequestError',
    'InternalServerError',
    'RateLimitError',
    'DatabaseError',
]
