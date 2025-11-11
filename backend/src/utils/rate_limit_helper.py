"""
Helper para Rate Limiting com Redis.

Wrapper que permite usar o limiter de forma fácil nas rotas.
"""

from functools import wraps

# Tenta importar o limiter Redis
try:
    from middleware.rate_limit_redis import get_limiter

    _redis_limiter = None
    _limiter_available = True
except (ImportError, RuntimeError):
    _redis_limiter = None
    _limiter_available = False


def _get_limiter_safe():
    """Retorna o limiter de forma segura"""
    global _redis_limiter
    if _limiter_available and _redis_limiter is None:
        try:
            _redis_limiter = get_limiter()
        except (RuntimeError, AttributeError):
            _redis_limiter = None
    return _redis_limiter


def rate_limit(limit: str):
    """
    Decorator para rate limiting usando Redis.

    Args:
        limit (str): Limite no formato "N per period" (ex: "5 per minute")

    Returns:
        Decorator function
    """

    def decorator(f):
        limiter = _get_limiter_safe()

        if limiter:
            # Usa Flask-Limiter se disponível
            return limiter.limit(limit)(f)
        else:
            # Fallback: decorator vazio se limiter não estiver disponível
            @wraps(f)
            def wrapper(*args, **kwargs):
                return f(*args, **kwargs)

            return wrapper

    return decorator
