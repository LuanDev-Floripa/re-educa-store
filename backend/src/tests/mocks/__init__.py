# -*- coding: utf-8 -*-
"""
Mocks para Testes RE-EDUCA Store.

Centraliza mocks de repositórios e services para uso em testes.
"""
from tests.mocks.repository_mocks import (
    MockHealthRepository,
    MockOrderRepository,
    MockProductRepository,
    MockUserRepository,
)

__all__ = [
    "MockHealthRepository",
    "MockUserRepository",
    "MockProductRepository",
    "MockOrderRepository",
]
