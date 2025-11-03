# -*- coding: utf-8 -*-
"""
Otimizador de Queries RE-EDUCA Store.

Fornece funções para otimizar queries e evitar problemas N+1.
"""
import logging
from typing import Dict, Any, List, Optional
from functools import wraps

logger = logging.getLogger(__name__)


def batch_fetch(ids: List[str], fetch_func, batch_size: int = 100) -> Dict[str, Any]:
    """
    Busca registros em lotes para evitar N+1 queries.

    Args:
        ids: Lista de IDs para buscar
        fetch_func: Função que busca múltiplos IDs (recebe lista)
        batch_size: Tamanho do lote

    Returns:
        Dict mapeando ID para registro
    """
    result = {}

    # Divide em lotes
    for i in range(0, len(ids), batch_size):
        batch = ids[i:i + batch_size]
        try:
            batch_results = fetch_func(batch)
            # Assume que fetch_func retorna lista ou dict
            if isinstance(batch_results, list):
                for item in batch_results:
                    if 'id' in item:
                        result[item['id']] = item
            elif isinstance(batch_results, dict):
                result.update(batch_results)
        except Exception as e:
            logger.error(f"Erro ao buscar lote: {str(e)}")

    return result


def optimize_query_with_joins(query_builder, related_tables: List[str]) -> Any:
    """
    Otimiza query adicionando joins para evitar N+1.

    Args:
        query_builder: Builder da query Supabase
        related_tables: Lista de tabelas relacionadas para incluir

    Returns:
        Query builder otimizado
    """
    try:
        # Adiciona selects relacionados se necessário
        for table in related_tables:
            # Exemplo: query_builder.select(f'*, {table}(*)')
            pass  # Implementação específica depende da estrutura

        return query_builder
    except Exception as e:
        logger.error(f"Erro ao otimizar query: {str(e)}")
        return query_builder


def cache_query_result(cache_key: str, ttl: int = 300):
    """
    Decorator para cachear resultados de queries.

    Args:
        cache_key: Chave do cache (pode usar {args} para formatar)
        ttl: TTL em segundos
    """
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            # Formata chave do cache se necessário
            key = cache_key.format(**kwargs) if '{' in cache_key else cache_key

            # TODO: Implementar cache real (Redis ou memória)
            # Por enquanto, apenas executa a função
            return func(*args, **kwargs)

        return wrapper
    return decorator
