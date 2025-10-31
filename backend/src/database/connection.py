# -*- coding: utf-8 -*-
"""
Conexão com banco de dados RE-EDUCA Store.

Módulo responsável por fornecer a conexão com o banco de dados,
seja Supabase ou SQLite local, com tratamento de erros robusto.
"""
import os
import logging
from typing import Optional, Union
from config.database import supabase_client

logger = logging.getLogger(__name__)

def get_db_connection():
    """
    Retorna conexão com banco de dados.
    
    Suporta múltiplos tipos de banco de dados (Supabase, SQLite)
    e garante que uma conexão válida seja retornada.
    
    Returns:
        Union[SupabaseClient, sqlite3.Connection]: Conexão com o banco.
        
    Raises:
        Exception: Se não for possível estabelecer conexão.
    """
    try:
        db = supabase_client
        
        # Se for SQLite
        if hasattr(db, 'get_connection'):
            return db.get_connection()
        
        # Se for Supabase, retorna o cliente
        return db
        
    except Exception as e:
        logger.error(f"Erro ao obter conexão com banco: {str(e)}", exc_info=True)
        raise ConnectionError(f"Falha ao conectar com o banco de dados: {str(e)}") from e