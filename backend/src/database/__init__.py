# -*- coding: utf-8 -*-
"""
Módulo de conexão com banco de dados RE-EDUCA Store.

Centraliza acesso ao banco de dados incluindo:
- Conexão com PostgreSQL (local)
- Integração com Supabase (produção)
- Pool de conexões
- Helpers de query

Importar deste módulo para garantir consistência:
    from database import get_db_connection
"""
