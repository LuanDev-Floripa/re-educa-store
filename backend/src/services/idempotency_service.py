# -*- coding: utf-8 -*-
"""
Serviço de Idempotência para RE-EDUCA Store.

Garante que operações críticas (pagamentos, pedidos, webhooks) possam
ser executadas múltiplas vezes sem efeitos colaterais duplicados.

Usa Redis para armazenar chaves de idempotência com TTL automático.
"""

import logging
import hashlib
import json
from datetime import datetime, timedelta
from typing import Any, Dict, Optional, Callable
from functools import wraps

logger = logging.getLogger(__name__)


class IdempotencyService:
    """
    Serviço para garantir idempotência em operações críticas.
    
    Uso típico:
    - Webhooks (Stripe, pagamentos)
    - Criação de pedidos
    - Processamento de pagamentos
    - Operações financeiras
    """
    
    def __init__(self):
        """Inicializa serviço de idempotência"""
        try:
            from services.cache_service import cache_service
            self.cache = cache_service
            self.available = True
        except ImportError:
            logger.warning("Cache service não disponível - idempotência desabilitada")
            self.cache = None
            self.available = False
        
        self.prefix = "idempotency:"
        self.default_ttl = 86400  # 24 horas
    
    def generate_key(self, operation: str, params: Dict[str, Any]) -> str:
        """
        Gera chave de idempotência única baseada em operação e parâmetros.
        
        Args:
            operation: Nome da operação (ex: 'create_order', 'process_payment')
            params: Parâmetros que identificam unicamente a operação
        
        Returns:
            str: Chave de idempotência (hash SHA256)
        """
        # Serializa params de forma determinística
        params_str = json.dumps(params, sort_keys=True)
        
        # Gera hash
        content = f"{operation}:{params_str}"
        hash_key = hashlib.sha256(content.encode()).hexdigest()
        
        return f"{self.prefix}{operation}:{hash_key}"
    
    def check_and_store(self, key: str, result: Any, ttl: int = None) -> tuple:
        """
        Verifica se operação já foi executada e armazena resultado.
        
        Args:
            key: Chave de idempotência
            result: Resultado da operação
            ttl: TTL em segundos (padrão: 24h)
        
        Returns:
            tuple: (is_duplicate: bool, stored_result: Any)
                   is_duplicate=True se operação já foi executada
                   stored_result contém resultado anterior se duplicada
        """
        if not self.available:
            return False, None
        
        try:
            # Verifica se já existe
            existing = self.cache.get(key)
            
            if existing:
                logger.info(f"Operação duplicada detectada: {key[:50]}...")
                return True, existing
            
            # Armazena resultado
            ttl = ttl or self.default_ttl
            self.cache.set(key, result, ttl=ttl)
            
            logger.debug(f"Resultado armazenado com chave: {key[:50]}...")
            return False, None
            
        except Exception as e:
            logger.error(f"Erro no check de idempotência: {str(e)}")
            # Failover: permite operação se cache falhar
            return False, None
    
    def execute_idempotent(
        self, 
        operation: str, 
        params: Dict[str, Any],
        func: Callable,
        ttl: int = None
    ) -> Dict[str, Any]:
        """
        Executa operação de forma idempotente.
        
        Se operação já foi executada, retorna resultado anterior.
        Caso contrário, executa e armazena resultado.
        
        Args:
            operation: Nome da operação
            params: Parâmetros identificadores
            func: Função a executar
            ttl: TTL em segundos
        
        Returns:
            Dict: Resultado da operação (novo ou anterior)
        """
        # Gera chave
        key = self.generate_key(operation, params)
        
        # Verifica se já foi executada
        is_duplicate, stored_result = self.check_and_store(key, None, ttl)
        
        if is_duplicate and stored_result:
            logger.info(f"Retornando resultado anterior de {operation}")
            return {
                **stored_result,
                'idempotent': True,
                'from_cache': True
            }
        
        # Executa operação
        try:
            result = func()
            
            # Armazena resultado
            self.check_and_store(key, result, ttl)
            
            return {
                **result,
                'idempotent': True,
                'from_cache': False
            }
            
        except Exception as e:
            logger.error(f"Erro ao executar operação idempotente: {str(e)}")
            raise
    
    def invalidate(self, key: str) -> bool:
        """
        Invalida chave de idempotência.
        
        Útil quando operação precisa ser refeita.
        
        Args:
            key: Chave de idempotência
        
        Returns:
            bool: True se invalidada com sucesso
        """
        if not self.available:
            return False
        
        try:
            self.cache.delete(key)
            logger.info(f"Chave invalidada: {key[:50]}...")
            return True
        except Exception as e:
            logger.error(f"Erro ao invalidar chave: {str(e)}")
            return False


# Instância global
idempotency_service = IdempotencyService()


# ============================================================
# DECORATORS PARA IDEMPOTÊNCIA
# ============================================================

def idempotent_operation(operation_name: str, key_params: List[str], ttl: int = 86400):
    """
    Decorator para tornar operação idempotente.
    
    Args:
        operation_name: Nome da operação
        key_params: Lista de nomes de parâmetros para gerar chave
        ttl: TTL em segundos (padrão: 24h)
    
    Usage:
        @idempotent_operation('create_order', ['user_id', 'cart_id'])
        def create_order(self, user_id, cart_id, **kwargs):
            # Operação será idempotente
            return {'order_id': '...'}
    """
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        def wrapper(*args, **kwargs):
            # Extrai parâmetros para chave
            import inspect
            sig = inspect.signature(func)
            bound = sig.bind(*args, **kwargs)
            bound.apply_defaults()
            
            # Monta params da chave
            key_data = {}
            for param in key_params:
                if param in bound.arguments:
                    key_data[param] = str(bound.arguments[param])
            
            # Gera chave
            key = idempotency_service.generate_key(operation_name, key_data)
            
            # Verifica cache
            if idempotency_service.available:
                is_duplicate, stored_result = idempotency_service.check_and_store(key, None, ttl)
                
                if is_duplicate and stored_result:
                    logger.info(f"Retornando resultado anterior de {operation_name}")
                    return {**stored_result, 'idempotent': True}
            
            # Executa operação
            result = func(*args, **kwargs)
            
            # Armazena resultado
            if idempotency_service.available and isinstance(result, dict):
                idempotency_service.check_and_store(key, result, ttl)
            
            return result
        
        return wrapper
    return decorator


def webhook_idempotent(event_id_param: str = 'event_id', ttl: int = 604800):
    """
    Decorator específico para webhooks (TTL padrão: 7 dias).
    
    Args:
        event_id_param: Nome do parâmetro que contém event_id
        ttl: TTL em segundos (padrão: 7 dias)
    
    Usage:
        @webhook_idempotent('stripe_event_id')
        def process_stripe_webhook(self, stripe_event_id, data):
            # Webhook processado apenas uma vez
    """
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        def wrapper(*args, **kwargs):
            # Extrai event_id
            import inspect
            sig = inspect.signature(func)
            bound = sig.bind(*args, **kwargs)
            
            event_id = bound.arguments.get(event_id_param)
            
            if not event_id:
                logger.warning(f"Event ID não encontrado em {func.__name__}")
                return func(*args, **kwargs)
            
            # Gera chave
            operation = f"webhook_{func.__name__}"
            key = idempotency_service.generate_key(operation, {event_id_param: str(event_id)})
            
            # Verifica se já processado
            if idempotency_service.available:
                is_duplicate, stored_result = idempotency_service.check_and_store(key, None, ttl)
                
                if is_duplicate:
                    logger.warning(f"Webhook duplicado ignorado: {event_id}")
                    return {
                        'success': True,
                        'message': 'Webhook já processado',
                        'idempotent': True,
                        'event_id': event_id
                    }
            
            # Processa webhook
            result = func(*args, **kwargs)
            
            # Armazena resultado
            if idempotency_service.available and isinstance(result, dict):
                idempotency_service.check_and_store(key, result, ttl)
            
            return result
        
        return wrapper
    return decorator


# ============================================================
# UTILITÁRIOS
# ============================================================

def generate_idempotency_key_from_request() -> Optional[str]:
    """
    Gera chave de idempotência a partir do request Flask.
    
    Usa Idempotency-Key header se fornecido, senão gera baseado no conteúdo.
    
    Returns:
        Optional[str]: Chave de idempotência ou None
    """
    from flask import request
    
    # Prioriza header Idempotency-Key (padrão Stripe)
    if 'Idempotency-Key' in request.headers:
        return f"{idempotency_service.prefix}request:{request.headers['Idempotency-Key']}"
    
    # Gera baseado no conteúdo
    if request.is_json:
        data = request.get_json()
        if data:
            # Hash do conteúdo + endpoint
            content = json.dumps(data, sort_keys=True)
            hash_key = hashlib.sha256(f"{request.path}:{content}".encode()).hexdigest()
            return f"{idempotency_service.prefix}request:{hash_key}"
    
    return None
