"""
Middleware de rate limiting para RE-EDUCA Store.

Implementa limitação de requisições por IP incluindo:
- Rate limiting por endpoint
- Armazenamento em memória (development)
- Respostas 429 Too Many Requests
- Headers de retry-after

AVISO: Implementação simples em memória.
Para produção, usar Flask-Limiter com Redis.

Exemplos de uso:
    @app.rate_limit('5 per minute')
    def sensitive_endpoint():
        ...
"""
from flask import Flask, request, jsonify
from functools import wraps
import time
from collections import defaultdict
from threading import Lock

# Armazenamento simples em memória para rate limiting
# Em produção, usar Redis ou similar
_rate_limit_storage = defaultdict(list)

_rate_limit_lock = Lock()


def setup_rate_limiting(app: Flask):
    """
    Configura rate limiting para a aplicação.

    Args:
        app (Flask): Instância da aplicação Flask.

    Note:
        Adiciona decorator app.rate_limit para uso nas rotas.
    """

    def rate_limit(limit: str = "100 per hour"):
        """
        Decorator para rate limiting.

        Args:
            limit (str): Limite no formato "N per period".
                         Ex: "100 per hour", "5 per minute"

        Returns:
            Callable: Decorator de função.
        """
        def decorator(f):
            @wraps(f)
            def decorated(*args, **kwargs):
                # Implementação básica de rate limiting
                # Em produção, usar Flask-Limiter

                # Identifica o cliente
                client_id = request.remote_addr

                # Parse do limite (ex: "100 per hour")
                try:
                    count, period = limit.split(' per ')
                    count = int(count)

                    # Converte período para segundos
                    period_seconds = {
                        'second': 1,
                        'minute': 60,
                        'hour': 3600,
                        'day': 86400
                    }.get(period, 3600)

                except (ValueError, KeyError):
                    # Fallback para 100 por hora
                    count = 100
                    period_seconds = 3600

                # Verifica rate limit
                if not check_rate_limit(client_id, count, period_seconds):
                    return jsonify({
                        'error': 'Limite de requisições excedido',
                        'retry_after': get_retry_after(client_id, period_seconds)
                    }), 429

                return f(*args, **kwargs)
            return decorated
        return decorator

    # Adiciona decorator ao app
    app.rate_limit = rate_limit


# Função standalone para importação direta (para uso em rotas antes do app estar configurado)
def rate_limit(limit: str = "100 per hour"):
    """
    Decorator para rate limiting (versão standalone).

    Args:
        limit (str): Limite no formato "N per period".
                     Ex: "100 per hour", "5 per minute"

    Returns:
        Callable: Decorator de função.
    """
    def decorator(f):
        @wraps(f)
        def decorated(*args, **kwargs):
            from flask import request, jsonify

            # Identifica o cliente
            client_id = request.remote_addr

            # Parse do limite (ex: "100 per hour")
            try:
                count, period = limit.split(' per ')
                count = int(count)

                # Converte período para segundos
                period_seconds = {
                    'second': 1,
                    'minute': 60,
                    'hour': 3600,
                    'day': 86400
                }.get(period, 3600)

            except (ValueError, KeyError):
                # Fallback para 100 por hora
                count = 100
                period_seconds = 3600

            # Verifica rate limit
            if not check_rate_limit(client_id, count, period_seconds):
                return jsonify({
                    'error': 'Limite de requisições excedido',
                    'retry_after': get_retry_after(client_id, period_seconds)
                }), 429

            return f(*args, **kwargs)
        return decorated
    return decorator


def check_rate_limit(client_id: str, max_requests: int, window_seconds: int) -> bool:
    """Verifica se o cliente excedeu o rate limit"""
    current_time = time.time()

    with _rate_limit_lock:
        # Remove requisições antigas
        client_requests = _rate_limit_storage[client_id]
        client_requests[:] = [req_time for req_time in client_requests
                            if current_time - req_time < window_seconds]

        # Verifica se excedeu o limite
        if len(client_requests) >= max_requests:
            return False

        # Adiciona nova requisição
        client_requests.append(current_time)
        return True


def get_retry_after(client_id: str, window_seconds: int) -> int:
    """Calcula tempo de retry"""
    current_time = time.time()

    with _rate_limit_lock:
        client_requests = _rate_limit_storage[client_id]
        if client_requests:
            oldest_request = min(client_requests)
            retry_after = int(oldest_request + window_seconds - current_time)
            return max(retry_after, 1)

    return 60  # Fallback


def get_rate_limit_info(client_id: str) -> dict:
    """Retorna informações sobre rate limit do cliente"""
    current_time = time.time()

    with _rate_limit_lock:
        client_requests = _rate_limit_storage[client_id]

        # Remove requisições antigas (última hora)
        client_requests[:] = [
            req_time for req_time in client_requests
            if current_time - req_time < 3600
        ]

        return {
            'requests_in_last_hour': len(client_requests),
            'oldest_request': min(client_requests) if client_requests else None,
            'newest_request': max(client_requests) if client_requests else None
        }


def clear_rate_limit_storage():
    """Limpa o storage de rate limiting (útil para testes)"""
    with _rate_limit_lock:
        _rate_limit_storage.clear()
