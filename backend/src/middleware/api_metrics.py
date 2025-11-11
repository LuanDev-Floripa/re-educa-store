# -*- coding: utf-8 -*-
"""
Middleware de Métricas de API RE-EDUCA Store.

Coleta métricas de requisições HTTP incluindo:
- Tempo de resposta (média, p95, p99)
- Número de requisições por minuto
- Taxa de erro por endpoint
- Requisições por método HTTP

Armazena métricas no Redis para acesso rápido.
"""

import logging
import time
from collections import defaultdict
from datetime import datetime, timedelta
from typing import Dict

from flask import Flask, g, request

logger = logging.getLogger(__name__)

# Instância do cache service (será inicializada no setup)
_cache_service = None


def setup_api_metrics(app: Flask):
    """
    Configura coleta de métricas de API.
    
    Args:
        app: Instância da aplicação Flask
    """
    global _cache_service
    
    try:
        from services.cache_service import CacheService
        _cache_service = CacheService()
    except Exception as e:
        logger.warning(f"CacheService não disponível para métricas: {e}")
        _cache_service = None
    
    @app.before_request
    def before_request_metrics():
        """Registra início da requisição para cálculo de duração"""
        g.start_time = time.time()
    
    @app.after_request
    def after_request_metrics(response):
        """Coleta métricas após cada requisição"""
        if not _cache_service or not _cache_service.is_available():
            return response
        
        try:
            # Calcular duração
            if hasattr(g, 'start_time'):
                duration_ms = (time.time() - g.start_time) * 1000
            else:
                duration_ms = 0
            
            # Normalizar endpoint (remover IDs)
            endpoint = _normalize_endpoint(request.path)
            method = request.method
            status_code = response.status_code
            
            # Armazenar métrica individual
            _store_request_metric(method, endpoint, status_code, duration_ms)
            
            # Atualizar agregados
            _update_aggregated_metrics(method, endpoint, status_code, duration_ms)
            
        except Exception as e:
            logger.debug(f"Erro ao coletar métricas (não crítico): {e}")
        
        return response
    
    logger.info("Middleware de métricas de API configurado")


def _normalize_endpoint(path: str) -> str:
    """
    Normaliza endpoint removendo IDs para agrupar métricas.
    
    Exemplo: /api/products/123-456-789 -> /api/products/:id
    """
    import re
    # Remover UUIDs
    path = re.sub(r'/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}', '/:id', path)
    # Remover números simples
    path = re.sub(r'/\d+', '/:id', path)
    return path


def _store_request_metric(method: str, endpoint: str, status_code: int, duration_ms: float):
    """Armazena métrica individual no Redis (últimas 100 requisições)"""
    try:
        if not _cache_service or not _cache_service.is_available():
            return
        
        # Chave para lista de métricas recentes
        key = f"api:metrics:recent:{endpoint}:{method}"
        
        # Adicionar métrica (timestamp, status, duration)
        metric_data = {
            "timestamp": time.time(),
            "status": status_code,
            "duration_ms": duration_ms
        }
        
        # Usar lista Redis (mantém últimas 100)
        import json
        if hasattr(_cache_service, 'redis_client') and _cache_service.redis_client:
            _cache_service.redis_client.lpush(key, json.dumps(metric_data))
            _cache_service.redis_client.ltrim(key, 0, 99)  # Manter apenas últimas 100
            _cache_service.redis_client.expire(key, 3600)  # Expirar após 1 hora
        
    except Exception as e:
        logger.debug(f"Erro ao armazenar métrica individual: {e}")


def _update_aggregated_metrics(method: str, endpoint: str, status_code: int, duration_ms: float):
    """Atualiza métricas agregadas (último minuto)"""
    try:
        if not _cache_service or not _cache_service.is_available():
            return
        
        current_minute = int(time.time() / 60)  # Minuto atual (timestamp / 60)
        key_base = f"api:metrics:minute:{current_minute}:{endpoint}:{method}"
        
        # Incrementar contador de requisições
        requests_key = f"{key_base}:requests"
        _cache_service.increment(requests_key, 1)
        if hasattr(_cache_service, 'redis_client') and _cache_service.redis_client:
            _cache_service.redis_client.expire(requests_key, 120)  # Expirar após 2 minutos
        
        # Incrementar contador de erros (4xx, 5xx)
        if status_code >= 400:
            errors_key = f"{key_base}:errors"
            _cache_service.increment(errors_key, 1)
            if hasattr(_cache_service, 'redis_client') and _cache_service.redis_client:
                _cache_service.redis_client.expire(errors_key, 120)
        
        # Adicionar duração para cálculo de média/p95/p99
        duration_key = f"{key_base}:durations"
        if hasattr(_cache_service, 'redis_client') and _cache_service.redis_client:
            _cache_service.redis_client.lpush(duration_key, duration_ms)
            _cache_service.redis_client.ltrim(duration_key, 0, 999)  # Últimas 1000 requisições
            _cache_service.redis_client.expire(duration_key, 120)
        
        # Atualizar duração máxima
        max_duration_key = f"{key_base}:max_duration"
        current_max = _cache_service.get(max_duration_key) or 0
        if duration_ms > current_max:
            _cache_service.set(max_duration_key, duration_ms, ttl=120)
        
        # Atualizar duração mínima
        min_duration_key = f"{key_base}:min_duration"
        current_min = _cache_service.get(min_duration_key)
        if current_min is None or duration_ms < current_min:
            _cache_service.set(min_duration_key, duration_ms, ttl=120)
        
    except Exception as e:
        logger.debug(f"Erro ao atualizar métricas agregadas: {e}")


def get_api_metrics_from_cache(endpoint: str = None, method: str = None) -> Dict:
    """
    Obtém métricas de API do cache.
    
    Args:
        endpoint: Endpoint específico (None = todos)
        method: Método HTTP específico (None = todos)
    
    Returns:
        Dict com métricas agregadas
    """
    if not _cache_service or not _cache_service.is_available():
        return {}
    
    try:
        current_minute = int(time.time() / 60)
        previous_minute = current_minute - 1
        
        metrics = {
            "avg_response_time_ms": 0,
            "min_response_time_ms": 0,
            "max_response_time_ms": 0,
            "p95_response_time_ms": 0,
            "p99_response_time_ms": 0,
            "requests_per_minute": 0,
            "error_rate": 0,
            "total_requests": 0,
            "total_errors": 0,
        }
        
        # Buscar métricas do minuto atual e anterior
        for minute in [current_minute, previous_minute]:
            if endpoint and method:
                keys_pattern = f"api:metrics:minute:{minute}:{endpoint}:{method}:*"
            elif endpoint:
                keys_pattern = f"api:metrics:minute:{minute}:{endpoint}:*"
            else:
                keys_pattern = f"api:metrics:minute:{minute}:*"
            
            # Buscar todas as chaves que correspondem ao padrão
            if not hasattr(_cache_service, 'redis_client') or not _cache_service.redis_client:
                return metrics
            keys = _cache_service.redis_client.keys(keys_pattern)
            
            total_requests = 0
            total_errors = 0
            durations = []
            
            for key in keys:
                if key.endswith(":requests"):
                    count = _cache_service.get(key) or 0
                    total_requests += int(count) if isinstance(count, (int, str)) else 0
                elif key.endswith(":errors"):
                    count = _cache_service.get(key) or 0
                    total_errors += int(count) if isinstance(count, (int, str)) else 0
                elif key.endswith(":durations"):
                    # Obter lista de durações
                    if hasattr(_cache_service, 'redis_client') and _cache_service.redis_client:
                        duration_list = _cache_service.redis_client.lrange(key, 0, -1)
                        durations.extend([float(d) for d in duration_list if d])
                elif key.endswith(":max_duration"):
                    max_dur = _cache_service.get(key) or 0
                    if max_dur > metrics["max_response_time_ms"]:
                        metrics["max_response_time_ms"] = float(max_dur)
                elif key.endswith(":min_duration"):
                    min_dur = _cache_service.get(key) or 0
                    if metrics["min_response_time_ms"] == 0 or min_dur < metrics["min_response_time_ms"]:
                        metrics["min_response_time_ms"] = float(min_dur)
            
            metrics["total_requests"] += total_requests
            metrics["total_errors"] += total_errors
        
        # Calcular estatísticas de duração
        if durations:
            durations.sort()
            metrics["avg_response_time_ms"] = round(sum(durations) / len(durations), 2)
            metrics["p95_response_time_ms"] = round(durations[int(len(durations) * 0.95)] if len(durations) > 0 else 0, 2)
            metrics["p99_response_time_ms"] = round(durations[int(len(durations) * 0.99)] if len(durations) > 0 else 0, 2)
        
        # Calcular requisições por minuto (média dos últimos 2 minutos)
        metrics["requests_per_minute"] = round(metrics["total_requests"] / 2, 2) if metrics["total_requests"] > 0 else 0
        
        # Calcular taxa de erro
        if metrics["total_requests"] > 0:
            metrics["error_rate"] = round((metrics["total_errors"] / metrics["total_requests"]) * 100, 2)
        
        return metrics
        
    except Exception as e:
        logger.warning(f"Erro ao obter métricas do cache: {e}")
        return {
            "avg_response_time_ms": 0,
            "requests_per_minute": 0,
            "error_rate": 0,
        }
