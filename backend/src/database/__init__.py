# -*- coding: utf-8 -*-
"""
Módulo de conexão com banco de dados RE-EDUCA Store - Supabase.

Centraliza acesso ao banco de dados Supabase.
Todos os imports devem usar este módulo para garantir consistência.

Importar deste módulo para garantir consistência:
    from database import get_db_connection
    from database.connection import get_db_connection
"""
from database.connection import get_db_connection

__all__ = ["get_db_connection"]
