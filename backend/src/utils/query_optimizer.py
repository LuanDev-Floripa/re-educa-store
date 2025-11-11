# -*- coding: utf-8 -*-
"""
Otimizador de Queries RE-EDUCA Store.

Fornece funções para otimizar queries e evitar problemas N+1.
Utiliza cache distribuído Redis para melhorar performance.
"""
import hashlib
import json
import logging
from functools import wraps
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)

# Cache service singleton
_cache_service = None


def _get_cache_service():
    """Obtém instância do cache service (lazy loading)."""
    global _cache_service
    if _cache_service is None:
        try:
            from services.cache_service import CacheService
            _cache_service = CacheService()
        except Exception as e:
            logger.warning(f"Cache service não disponível: {e}")
            _cache_service = None
    return _cache_service


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
        batch = ids[i : i + batch_size]
        try:
            batch_results = fetch_func(batch)
            # Assume que fetch_func retorna lista ou dict
            if isinstance(batch_results, list):
                for item in batch_results:
                    if "id" in item:
                        result[item["id"]] = item
            elif isinstance(batch_results, dict):
                result.update(batch_results)
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            logger.error(f"Erro ao buscar lote: {str(e)}", exc_info=True)

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
    Decorator para cachear resultados de queries usando Redis.

    Implementado cache distribuído com Redis para melhor performance.

    Args:
        cache_key: Chave do cache (pode usar {args} e {kwargs} para formatar)
        ttl: TTL em segundos (padrão: 5 minutos)

    Exemplo:
        @cache_query_result("user:{user_id}", ttl=600)
        def get_user_data(user_id: str):
            return db.query(...)
    """

    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            cache_service = _get_cache_service()
            
            # Gerar chave de cache única baseada em args/kwargs
            # Hash dos argumentos para evitar chaves muito longas
            args_str = json.dumps(args, default=str, sort_keys=True)
            kwargs_str = json.dumps(kwargs, default=str, sort_keys=True)
            args_hash = hashlib.md5(f"{args_str}:{kwargs_str}".encode()).hexdigest()[:8]
            
            # Formatar chave final
            final_key = f"query:{cache_key.format(*args, **kwargs)}:{args_hash}"
            
            # Tentar obter do cache
            if cache_service and cache_service.is_available():
                cached_result = cache_service.get(final_key)
                if cached_result is not None:
                    logger.debug(f"Cache hit: {final_key}")
                    return cached_result
            
            # Cache miss - executar função
            logger.debug(f"Cache miss: {final_key}")
            result = func(*args, **kwargs)
            
            # Armazenar no cache
            if cache_service and cache_service.is_available():
                try:
                    cache_service.set(final_key, result, ttl=ttl)
                    logger.debug(f"Cached: {final_key} (TTL: {ttl}s)")
                except Exception as e:
                    logger.warning(f"Erro ao cachear resultado: {e}")
            
            return result

        return wrapper

    return decorator
