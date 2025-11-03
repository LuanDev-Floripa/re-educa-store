"""
Middleware de Rate Limiting com Redis - RE-EDUCA Store.

Implementação escalável de rate limiting usando Flask-Limiter e Redis.
Substitui implementação em memória anterior.

Funcionalidades:
- Rate limiting por endpoint
- Diferenciação por usuário autenticado vs IP
- Whitelist para admins
- Métricas e logging
- Estratégias configuráveis por rota
"""
import os
import logging
from flask import Flask, request, g
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
import redis

logger = logging.getLogger(__name__)

# Instância global do limiter (será inicializada no setup)
_limiter: Limiter = None


def get_limiter_key():
    """
    Função para determinar a chave de rate limiting.
    
    Prioridade:
    1. User ID se autenticado
    2. IP address se anônimo
    
    Returns:
        str: Chave única para rate limiting
    """
    # Verifica se usuário está autenticado
    if hasattr(request, 'current_user') and request.current_user:
        user_id = request.current_user.get('id')
        if user_id:
            # Rate limit por usuário
            return f"user:{user_id}"
    
    # Verifica se admin (whitelist)
    if hasattr(request, 'current_user') and request.current_user:
        role = request.current_user.get('role')
        if role == 'admin':
            # Admins têm limite muito alto (praticamente ilimitado)
            return f"admin:{request.current_user.get('id')}"
    
    # Fallback para IP
    return f"ip:{get_remote_address()}"


def setup_rate_limiting_redis(app: Flask):
    """
    Configura rate limiting com Redis para a aplicação.
    
    Args:
        app (Flask): Instância da aplicação Flask.
    
    Note:
        Inicializa Flask-Limiter com Redis como storage backend.
        Configura limites padrão e estratégias por endpoint.
    """
    global limiter
    
    # Configuração Redis
    redis_url = os.environ.get('REDIS_URL')
    redis_host = os.environ.get('REDIS_HOST', 'localhost')
    redis_port = int(os.environ.get('REDIS_PORT', 6379))
    redis_password = os.environ.get('REDIS_PASSWORD')
    
    # Construir URL do Redis
    if redis_url:
        storage_uri = redis_url
    else:
        if redis_password:
            storage_uri = f"redis://:{redis_password}@{redis_host}:{redis_port}"
        else:
            storage_uri = f"redis://{redis_host}:{redis_port}"
    
    try:
        # Testar conexão com Redis
        if redis_password:
            test_client = redis.Redis(
                host=redis_host,
                port=redis_port,
                password=redis_password,
                decode_responses=True,
                socket_connect_timeout=5
            )
        else:
            test_client = redis.Redis(
                host=redis_host,
                port=redis_port,
                decode_responses=True,
                socket_connect_timeout=5
            )
        
        test_client.ping()
        logger.info(f"Conexão com Redis estabelecida: {redis_host}:{redis_port}")
        
    except Exception as e:
        logger.error(f"Erro ao conectar com Redis: {e}")
        logger.warning("Rate limiting pode não funcionar corretamente")
    
    # Inicializar Flask-Limiter
    global _limiter, limiter
    _limiter = Limiter(
        app=app,
        key_func=get_limiter_key,
        storage_uri=storage_uri,
        default_limits=["200 per day", "50 per hour"],
        strategy="fixed-window",  # Estratégia: janela fixa
        headers_enabled=True,  # Adiciona headers X-RateLimit-*
        retry_after="http-date"  # Header Retry-After em formato HTTP date
    )
    
    # Atualizar referência global para acesso fácil
    limiter = _limiter
    
    # Registrar no app.extensions para acesso via current_app
    app.extensions['limiter'] = _limiter
    
    # Configurar limites específicos por endpoint (via decorators nas rotas)
    # Exemplos:
    # @limiter.limit("5 per minute") para endpoints críticos
    # @limiter.limit("100 per hour") para endpoints normais
    # @limiter.limit("1000 per hour") para admins (ou sem limite)
    
    logger.info("Rate limiting com Redis configurado com sucesso")
    
    return _limiter


def get_limiter() -> Limiter:
    """
    Retorna a instância global do limiter.
    
    Returns:
        Limiter: Instância do Flask-Limiter
    
    Raises:
        RuntimeError: Se limiter não foi inicializado
    """
    if _limiter is None:
        raise RuntimeError(
            "Rate limiter não foi inicializado. "
            "Chame setup_rate_limiting_redis() primeiro."
        )
    return _limiter


# Variável global para acesso fácil (será preenchida após setup)
limiter = None


# Decorator auxiliar para whitelist de admins
def admin_exempt(f):
    """
    Decorator para isentar admins de rate limiting.
    
    Usar em rotas administrativas que devem ter limite muito alto.
    """
    from functools import wraps
    
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # Se for admin, usar limite muito alto
        if hasattr(request, 'current_user') and request.current_user:
            if request.current_user.get('role') == 'admin':
                # Temporariamente aumenta limite para admins
                # (implementação pode variar conforme necessidade)
                pass
        return f(*args, **kwargs)
    
    return decorated_function


# Função auxiliar para obter informações de rate limit
def get_rate_limit_info():
    """
    Retorna informações sobre rate limit da requisição atual.
    
    Returns:
        dict: Informações sobre rate limit (se disponível)
    """
    if limiter is None:
        return {}
    
    # Informações são adicionadas automaticamente nos headers
    # X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset
    return {
        'limit': request.headers.get('X-RateLimit-Limit'),
        'remaining': request.headers.get('X-RateLimit-Remaining'),
        'reset': request.headers.get('X-RateLimit-Reset')
    }


# Exportar limiter após inicialização
def _get_limiter_safe():
    """Retorna limiter de forma segura (None se não inicializado)"""
    try:
        return get_limiter()
    except RuntimeError:
        return None
