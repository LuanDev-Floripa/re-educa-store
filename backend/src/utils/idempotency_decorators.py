# -*- coding: utf-8 -*-
"""
Decorators de Idempotência para Endpoints Flask.

Permite que endpoints sejam chamados múltiplas vezes com mesmo resultado.
Essencial para webhooks, pagamentos e operações financeiras.
"""

import logging
from functools import wraps
from typing import Any, Callable, List
from flask import request, jsonify

logger = logging.getLogger(__name__)


def idempotent_endpoint(ttl: int = 86400):
    """
    Decorator para tornar endpoint Flask idempotente.
    
    Usa header 'Idempotency-Key' ou gera automaticamente baseado no corpo.
    
    Args:
        ttl: Tempo de vida em segundos (padrão: 24h)
    
    Usage:
        @app.route('/orders', methods=['POST'])
        @token_required
        @idempotent_endpoint(ttl=3600)  # 1 hora
        def create_order():
            # Será executado apenas uma vez por chave única
    """
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        def wrapper(*args, **kwargs):
            try:
                from services.idempotency_service import (
                    idempotency_service,
                    generate_idempotency_key_from_request
                )
                
                if not idempotency_service.available:
                    # Sem cache, executa normalmente
                    return func(*args, **kwargs)
                
                # Gera chave
                key = generate_idempotency_key_from_request()
                
                if not key:
                    # Sem chave, executa normalmente
                    return func(*args, **kwargs)
                
                # Verifica cache
                is_duplicate, stored_result = idempotency_service.check_and_store(key, None, ttl)
                
                if is_duplicate and stored_result:
                    logger.info(f"Requisição duplicada detectada: {key[:50]}...")
                    # Retorna resultado anterior
                    return stored_result
                
                # Executa operação
                response = func(*args, **kwargs)
                
                # Extrai resultado para cache
                if isinstance(response, tuple):
                    result_data, status_code = response[0], response[1]
                else:
                    result_data, status_code = response, 200
                
                # Armazena apenas se sucesso (2xx)
                if 200 <= status_code < 300:
                    cache_data = (result_data, status_code)
                    idempotency_service.check_and_store(key, cache_data, ttl)
                
                return response
                
            except Exception as e:
                logger.error(f"Erro no controle de idempotência: {str(e)}")
                # Failover: executa normalmente se idempotência falhar
                return func(*args, **kwargs)
        
        return wrapper
    return decorator


def webhook_idempotent(event_id_field: str = 'id', ttl: int = 604800):
    """
    Decorator específico para webhooks.
    
    Args:
        event_id_field: Campo do JSON que contém event ID
        ttl: TTL em segundos (padrão: 7 dias)
    
    Usage:
        @app.route('/webhooks/stripe', methods=['POST'])
        @webhook_idempotent(event_id_field='id', ttl=604800)
        def stripe_webhook():
            data = request.get_json()
            # data['id'] será usado como chave de idempotência
    """
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        def wrapper(*args, **kwargs):
            try:
                from services.idempotency_service import idempotency_service
                
                if not idempotency_service.available:
                    return func(*args, **kwargs)
                
                # Extrai event_id do JSON ou Form Data (suporta campos aninhados com notação de ponto)
                data = request.get_json() or dict(request.form)
                if not data:
                    logger.warning("Payload vazio (nem JSON nem Form Data)")
                    return func(*args, **kwargs)
                
                # Suporta campos aninhados (ex: 'data.purchase.code')
                event_id = data
                for field in event_id_field.split('.'):
                    if isinstance(event_id, dict) and field in event_id:
                        event_id = event_id[field]
                    elif isinstance(event_id, (list, tuple)) and field.isdigit():
                        # Suporta arrays (ex: 'data.0.id')
                        idx = int(field)
                        if 0 <= idx < len(event_id):
                            event_id = event_id[idx]
                        else:
                            logger.warning(f"Índice {idx} fora do range no campo {event_id_field}")
                            return func(*args, **kwargs)
                    else:
                        logger.warning(f"Event ID não encontrado no campo {event_id_field}")
                        return func(*args, **kwargs)
                
                if not event_id:
                    logger.warning(f"Event ID vazio no campo {event_id_field}")
                    return func(*args, **kwargs)
                
                # Gera chave
                operation = f"webhook_{func.__name__}"
                key = idempotency_service.generate_key(operation, {'event_id': str(event_id)})
                
                # Verifica se já processado
                is_duplicate, stored_result = idempotency_service.check_and_store(key, None, ttl)
                
                if is_duplicate:
                    logger.warning(f"Webhook duplicado ignorado: {event_id}")
                    return jsonify({
                        'success': True,
                        'message': 'Webhook já processado',
                        'event_id': event_id,
                        'idempotent': True
                    }), 200
                
                # Processa webhook
                response = func(*args, **kwargs)
                
                # Armazena resultado
                if isinstance(response, tuple):
                    result_data, status_code = response[0], response[1]
                else:
                    result_data, status_code = response, 200
                
                if 200 <= status_code < 300:
                    cache_data = (result_data, status_code)
                    idempotency_service.check_and_store(key, cache_data, ttl)
                
                return response
                
            except Exception as e:
                logger.error(f"Erro no webhook idempotente: {str(e)}")
                return func(*args, **kwargs)
        
        return wrapper
    return decorator


def idempotent_operation(operation_name: str, key_from_args: List[str], ttl: int = 3600):
    """
    Decorator genérico para operações idempotentes.
    
    Args:
        operation_name: Nome da operação
        key_from_args: Lista de nomes de argumentos para gerar chave
        ttl: TTL em segundos (padrão: 1h)
    
    Usage:
        @idempotent_operation('process_payment', ['order_id', 'payment_id'])
        def process_payment(self, order_id, payment_id):
            # Processado apenas uma vez por combinação de order_id + payment_id
    """
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        def wrapper(*args, **kwargs):
            try:
                from services.idempotency_service import idempotency_service
                import inspect
                
                if not idempotency_service.available:
                    return func(*args, **kwargs)
                
                # Extrai argumentos para chave
                sig = inspect.signature(func)
                bound = sig.bind(*args, **kwargs)
                bound.apply_defaults()
                
                key_params = {}
                for arg_name in key_from_args:
                    if arg_name in bound.arguments:
                        key_params[arg_name] = str(bound.arguments[arg_name])
                
                if not key_params:
                    logger.warning(f"Nenhum parâmetro encontrado para chave em {operation_name}")
                    return func(*args, **kwargs)
                
                # Gera chave
                key = idempotency_service.generate_key(operation_name, key_params)
                
                # Verifica cache
                is_duplicate, stored_result = idempotency_service.check_and_store(key, None, ttl)
                
                if is_duplicate and stored_result:
                    logger.info(f"Operação duplicada: {operation_name}")
                    return stored_result
                
                # Executa
                result = func(*args, **kwargs)
                
                # Armazena
                if isinstance(result, dict):
                    idempotency_service.check_and_store(key, result, ttl)
                
                return result
                
            except Exception as e:
                logger.error(f"Erro em operação idempotente: {str(e)}")
                return func(*args, **kwargs)
        
        return wrapper
    return decorator
