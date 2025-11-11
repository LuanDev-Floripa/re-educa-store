"""
Decoradores utilitários para RE-EDUCA Store.

Fornece decorators para:
- Autenticação (token_required)
- Autorização (admin_required, premium_required)
- Rate limiting
- Validação de JSON
- Log de atividades
- Tratamento de erros
"""

import functools
import logging
from typing import Callable

from config.database import supabase_client
from config.security import verify_token
from flask import jsonify, request

logger = logging.getLogger(__name__)


def token_required(f: Callable) -> Callable:
    """
    Decorator para rotas que requerem autenticação.

    Valida token JWT e adiciona current_user ao request.

    Args:
        f (Callable): Função a ser decorada.

    Returns:
        Callable: Função decorada com validação de token.
    """

    @functools.wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get("Authorization")

        if not token:
            return jsonify({"error": "Token de acesso requerido"}), 401

        try:
            # Remove 'Bearer ' do token
            if token.startswith("Bearer "):
                token = token[7:]

            # Verifica o token
            payload = verify_token(token)
            if not payload:
                return jsonify({"error": "Token inválido ou expirado"}), 401

            # Verifica se o usuário existe no banco
            supabase = supabase_client
            if supabase:
                user = supabase.get_user_by_id(payload["user_id"])

                if not user:
                    return jsonify({"error": "Usuário não encontrado"}), 401

                request.current_user = user
            else:
                return jsonify({"error": "Erro de conexão com banco de dados"}), 500

        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            logger.error(f"Erro na autenticação: {str(e)}", exc_info=True)
            return jsonify({"error": "Erro interno de autenticação"}), 500

        return f(*args, **kwargs)

    return decorated


def admin_required(f: Callable) -> Callable:
    """
    Decorator para rotas que requerem privilégios de administrador.

    Args:
        f (Callable): Função a ser decorada.

    Returns:
        Callable: Função decorada com verificação de admin.
    """

    @functools.wraps(f)
    def decorated(*args, **kwargs):
        if not hasattr(request, "current_user") or request.current_user.get("role") != "admin":
            return jsonify({"error": "Acesso negado. Privilégios de administrador requeridos."}), 403
        return f(*args, **kwargs)

    return decorated


def premium_required(f: Callable) -> Callable:
    """
    Decorator para rotas que requerem plano premium.

    Args:
        f (Callable): Função a ser decorada.

    Returns:
        Callable: Função decorada com verificação de plano.
    """

    @functools.wraps(f)
    def decorated(*args, **kwargs):
        if not hasattr(request, "current_user"):
            return jsonify({"error": "Autenticação requerida"}), 401

        user = request.current_user
        subscription = user.get("subscription_type", "free")

        if subscription not in ["premium", "enterprise"]:
            return jsonify({"error": "Plano premium requerido para esta funcionalidade"}), 403

        return f(*args, **kwargs)

    return decorated


# Rate limiting foi migrado para utils/rate_limit_helper.py
# Use: from utils.rate_limit_helper import rate_limit


def validate_json(*required_fields: str):
    """Decorator para validar campos obrigatórios no JSON"""

    def decorator(f: Callable) -> Callable:
        @functools.wraps(f)
        def decorated(*args, **kwargs):
            if not request.is_json:
                return jsonify({"error": "Content-Type deve ser application/json"}), 400

            data = request.get_json()
            if not data:
                return jsonify({"error": "Dados JSON inválidos"}), 400

            missing_fields = [field for field in required_fields if field not in data]
            if missing_fields:
                return jsonify({"error": "Campos obrigatórios ausentes", "missing_fields": missing_fields}), 400

            return f(*args, **kwargs)

        return decorated

    return decorator


def log_activity(activity_type: str):
    """Decorator para logar atividades do usuário"""

    def decorator(f: Callable) -> Callable:
        @functools.wraps(f)
        def decorated(*args, **kwargs):
            try:
                result = f(*args, **kwargs)

                # Log da atividade
                if hasattr(request, "current_user"):
                    user_id = request.current_user.get("id")
                    logger.info(f"Atividade: {activity_type} - Usuário: {user_id} - IP: {request.remote_addr}")

                return result
            except Exception as e:
                logger.error(f"Erro na atividade {activity_type}: {str(e)}")
                raise

        return decorated

    return decorator


def cache_response(timeout: int = 300, key_prefix: str = None, vary_by: list = None):
    """
    Decorator para cache de resposta usando CacheService.
    
    Args:
        timeout: TTL em segundos (padrão: 5 minutos)
        key_prefix: Prefixo para chave de cache (padrão: nome da função)
        vary_by: Lista de campos do request para variar a chave (ex: ['user_id', 'page'])
    
    Exemplo:
        @cache_response(timeout=600, vary_by=['page', 'per_page'])
        def get_products(page, per_page):
            ...
    """

    def decorator(f: Callable) -> Callable:
        @functools.wraps(f)
        def decorated(*args, **kwargs):
            from services.cache_service import CacheService
            import hashlib
            import json
            
            cache_service = CacheService()
            
            # Se cache não disponível, executar função normalmente
            if not cache_service.is_available():
                return f(*args, **kwargs)
            
            # Construir chave de cache
            prefix = key_prefix or f"{f.__module__}.{f.__name__}"
            
            # Adicionar variações baseadas em parâmetros
            cache_key_parts = [prefix]
            
            # Adicionar args e kwargs relevantes
            if vary_by:
                for var in vary_by:
                    if var in kwargs:
                        cache_key_parts.append(f"{var}:{kwargs[var]}")
                    elif var in request.args:
                        cache_key_parts.append(f"{var}:{request.args[var]}")
            else:
                # Por padrão, incluir todos os kwargs e query params
                if kwargs:
                    cache_key_parts.append(json.dumps(kwargs, sort_keys=True))
                if request.args:
                    cache_key_parts.append(json.dumps(dict(request.args), sort_keys=True))
            
            # Adicionar user_id se autenticado (para cache por usuário)
            if hasattr(request, 'current_user') and request.current_user:
                user_id = request.current_user.get('id')
                if user_id:
                    cache_key_parts.append(f"user:{user_id}")
            
            # Criar hash da chave para evitar chaves muito longas
            cache_key_str = ":".join(str(p) for p in cache_key_parts)
            cache_key_hash = hashlib.md5(cache_key_str.encode()).hexdigest()
            cache_key = f"cache:{prefix}:{cache_key_hash}"
            
            # Tentar obter do cache
            cached_result = cache_service.get(cache_key)
            if cached_result is not None:
                logger.debug(f"Cache hit: {cache_key}")
                # Retornar resposta cached (pode ser tuple de (response, status_code))
                if isinstance(cached_result, dict) and 'response' in cached_result:
                    status_code = cached_result.get('status_code', 200)
                    return jsonify(cached_result['response']), status_code
                return cached_result
            
            # Cache miss - executar função
            logger.debug(f"Cache miss: {cache_key}")
            result = f(*args, **kwargs)
            
            # Armazenar no cache
            try:
                # Se resultado é tuple (response, status_code), armazenar ambos
                if isinstance(result, tuple) and len(result) == 2:
                    response_data, status_code = result
                    # Se response_data é Response do Flask, extrair JSON
                    if hasattr(response_data, 'get_json'):
                        try:
                            json_data = response_data.get_json()
                            cache_service.set(cache_key, {'response': json_data, 'status_code': status_code}, ttl=timeout)
                        except Exception:
                            # Se não conseguir serializar, não cachear
                            pass
                    else:
                        cache_service.set(cache_key, {'response': response_data, 'status_code': status_code}, ttl=timeout)
                else:
                    cache_service.set(cache_key, result, ttl=timeout)
            except Exception as e:
                logger.warning(f"Erro ao armazenar no cache: {e}")
            
            return result

        return decorated

    return decorator


def handle_errors(f: Callable) -> Callable:
    """Decorator para tratamento de erros"""

    @functools.wraps(f)
    def decorated(*args, **kwargs):
        try:
            return f(*args, **kwargs)
        except Exception as e:
            logger.error(f"Erro não tratado: {str(e)}")
            return jsonify({"error": "Erro interno do servidor"}), 500

    return decorated


def handle_exceptions(f: Callable) -> Callable:
    """
    Decorator para tratamento de exceções com mapeamento automático.

    Usa exception_handler para mapear exceções Python padrão
    para exceções customizadas da API.
    """

    @functools.wraps(f)
    def decorated(*args, **kwargs):
        try:
            return f(*args, **kwargs)
        except Exception as e:
            # Importar aqui para evitar circular imports
            from exceptions.custom_exceptions import BaseAPIException
            from utils.exception_handler import handle_exception

            # Se já é exceção customizada, usar diretamente
            if isinstance(e, BaseAPIException):
                return jsonify(e.to_dict()), e.status_code

            # Mapear exceção padrão
            context = f"{f.__module__}.{f.__name__}"
            response, status_code = handle_exception(e, context)
            return jsonify(response), status_code

    return decorated
