# -*- coding: utf-8 -*-
"""
Conexão com banco de dados RE-EDUCA Store - Supabase.

Módulo responsável por fornecer a conexão com o banco de dados Supabase,
com tratamento de erros robusto.

IMPORTANTE: Este módulo usa APENAS Supabase. SQLite foi removido.
"""
import logging
from config.database import supabase_client

logger = logging.getLogger(__name__)


def get_db_connection():
    """
    Retorna conexão com banco de dados Supabase.

    Returns:
        SupabaseClient: Cliente Supabase para operações no banco.

    Raises:
        ConnectionError: Se não for possível estabelecer conexão.
    """
    try:
        return supabase_client
    except Exception as e:
        logger.error(f"Erro ao obter conexão com banco: {str(e)}", exc_info=True)
        raise ConnectionError(f"Falha ao conectar com o banco de dados: {str(e)}") from e
