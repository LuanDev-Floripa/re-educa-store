# -*- coding: utf-8 -*-
"""
Conexão com banco de dados RE-EDUCA Store
"""
import os
import logging
from typing import Optional, Union
from config.database import supabase_client

logger = logging.getLogger(__name__)

def get_db_connection():
    """Retorna conexão com banco de dados"""
    try:
        db = supabase_client
        
        # Se for SQLite
        if hasattr(db, 'get_connection'):
            return db.get_connection()
        
        # Se for Supabase, retorna o cliente
        return db
        
    except Exception as e:
        logger.error(f"Erro ao obter conexão com banco: {str(e)}")
        raise