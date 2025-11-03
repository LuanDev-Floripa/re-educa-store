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
from typing import Callable, Any
from flask import request, jsonify
from config.security import verify_token
from config.database import supabase_client

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
        token = request.headers.get('Authorization')

        if not token:
            return jsonify({'error': 'Token de acesso requerido'}), 401

        try:
            # Remove 'Bearer ' do token
            if token.startswith('Bearer '):
                token = token[7:]

            # Verifica o token
            payload = verify_token(token)
            if not payload:
                return jsonify({'error': 'Token inválido ou expirado'}), 401

            # Verifica se o usuário existe no banco
            supabase = supabase_client
            if supabase:
                user = supabase.get_user_by_id(payload['user_id'])

                if not user:
                    return jsonify({'error': 'Usuário não encontrado'}), 401

                request.current_user = user
            else:
                return jsonify({'error': 'Erro de conexão com banco de dados'}), 500

        except Exception as e:
            logger.error(f"Erro na autenticação: {str(e)}")
            return jsonify({'error': 'Erro interno de autenticação'}), 500

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
        if not hasattr(request, 'current_user') or request.current_user.get('role') != 'admin':
            return jsonify({'error': 'Acesso negado. Privilégios de administrador requeridos.'}), 403
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
        if not hasattr(request, 'current_user'):
            return jsonify({'error': 'Autenticação requerida'}), 401

        user = request.current_user
        subscription = user.get('subscription_type', 'free')

        if subscription not in ['premium', 'enterprise']:
            return jsonify({'error': 'Plano premium requerido para esta funcionalidade'}), 403

        return f(*args, **kwargs)

    return decorated


def rate_limit(limit: str = "100 per hour"):
    """Decorator para rate limiting"""
    def decorator(f: Callable) -> Callable:
        @functools.wraps(f)
        def decorated(*args, **kwargs):
            # Implementação básica de rate limiting
            # Em produção, usar Flask-Limiter
            return f(*args, **kwargs)
        return decorated
    return decorator


def validate_json(*required_fields: str):
    """Decorator para validar campos obrigatórios no JSON"""
    def decorator(f: Callable) -> Callable:
        @functools.wraps(f)
        def decorated(*args, **kwargs):
            if not request.is_json:
                return jsonify({'error': 'Content-Type deve ser application/json'}), 400

            data = request.get_json()
            if not data:
                return jsonify({'error': 'Dados JSON inválidos'}), 400

            missing_fields = [field for field in required_fields if field not in data]
            if missing_fields:
                return jsonify({
                    'error': 'Campos obrigatórios ausentes',
                    'missing_fields': missing_fields
                }), 400

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
                if hasattr(request, 'current_user'):
                    user_id = request.current_user.get('id')
                    logger.info(f"Atividade: {activity_type} - Usuário: {user_id} - IP: {request.remote_addr}")

                return result
            except Exception as e:
                logger.error(f"Erro na atividade {activity_type}: {str(e)}")
                raise
        return decorated
    return decorator


def cache_response(timeout: int = 300):
    """Decorator para cache de resposta"""
    def decorator(f: Callable) -> Callable:
        @functools.wraps(f)
        def decorated(*args, **kwargs):
            # Implementação básica de cache
            # Em produção, usar Flask-Caching
            return f(*args, **kwargs)
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
            return jsonify({'error': 'Erro interno do servidor'}), 500
    return decorated


def handle_exceptions(f: Callable) -> Callable:
    """Decorator para tratamento de exceções (alias para handle_errors)"""
    return handle_errors(f)
