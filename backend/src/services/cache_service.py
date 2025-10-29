"""
Serviço de Cache Redis para Performance
Gerencia cache de dados, sessões e otimizações
"""

import json
import logging
import redis
from datetime import datetime, timedelta
from typing import Any, Optional, Dict, List
from functools import wraps
import hashlib

logger = logging.getLogger(__name__)

class CacheService:
    def __init__(self):
        self.redis_client = None
        self._init_redis()
        
    def _init_redis(self):
        """Inicializa conexão com Redis"""
        try:
            self.redis_client = redis.Redis(
                host='localhost',
                port=6379,
                db=0,
                decode_responses=True,
                socket_connect_timeout=5,
                socket_timeout=5
            )
            # Testa conexão
            self.redis_client.ping()
            logger.info("Conexão Redis estabelecida com sucesso")
        except Exception as e:
            logger.error(f"Erro ao conectar com Redis: {e}")
            self.redis_client = None
    
    def is_available(self) -> bool:
        """Verifica se Redis está disponível"""
        return self.redis_client is not None
    
    def get(self, key: str) -> Optional[Any]:
        """Obtém valor do cache"""
        try:
            if not self.is_available():
                return None
            
            value = self.redis_client.get(key)
            if value:
                return json.loads(value)
            return None
            
        except Exception as e:
            logger.error(f"Erro ao obter do cache: {e}")
            return None
    
    def set(self, key: str, value: Any, ttl: int = 3600) -> bool:
        """Define valor no cache com TTL"""
        try:
            if not self.is_available():
                return False
            
            serialized_value = json.dumps(value, default=str)
            return self.redis_client.setex(key, ttl, serialized_value)
            
        except Exception as e:
            logger.error(f"Erro ao definir no cache: {e}")
            return False
    
    def delete(self, key: str) -> bool:
        """Remove valor do cache"""
        try:
            if not self.is_available():
                return False
            
            return bool(self.redis_client.delete(key))
            
        except Exception as e:
            logger.error(f"Erro ao deletar do cache: {e}")
            return False
    
    def delete_pattern(self, pattern: str) -> int:
        """Remove valores que correspondem ao padrão"""
        try:
            if not self.is_available():
                return 0
            
            keys = self.redis_client.keys(pattern)
            if keys:
                return self.redis_client.delete(*keys)
            return 0
            
        except Exception as e:
            logger.error(f"Erro ao deletar padrão do cache: {e}")
            return 0
    
    def exists(self, key: str) -> bool:
        """Verifica se chave existe no cache"""
        try:
            if not self.is_available():
                return False
            
            return bool(self.redis_client.exists(key))
            
        except Exception as e:
            logger.error(f"Erro ao verificar existência no cache: {e}")
            return False
    
    def increment(self, key: str, amount: int = 1) -> Optional[int]:
        """Incrementa valor numérico no cache"""
        try:
            if not self.is_available():
                return None
            
            return self.redis_client.incrby(key, amount)
            
        except Exception as e:
            logger.error(f"Erro ao incrementar no cache: {e}")
            return None
    
    def decrement(self, key: str, amount: int = 1) -> Optional[int]:
        """Decrementa valor numérico no cache"""
        try:
            if not self.is_available():
                return None
            
            return self.redis_client.decrby(key, amount)
            
        except Exception as e:
            logger.error(f"Erro ao decrementar no cache: {e}")
            return None
    
    def get_ttl(self, key: str) -> int:
        """Obtém TTL restante da chave"""
        try:
            if not self.is_available():
                return -1
            
            return self.redis_client.ttl(key)
            
        except Exception as e:
            logger.error(f"Erro ao obter TTL do cache: {e}")
            return -1
    
    def set_ttl(self, key: str, ttl: int) -> bool:
        """Define TTL para chave existente"""
        try:
            if not self.is_available():
                return False
            
            return bool(self.redis_client.expire(key, ttl))
            
        except Exception as e:
            logger.error(f"Erro ao definir TTL no cache: {e}")
            return False
    
    def flush_all(self) -> bool:
        """Limpa todo o cache"""
        try:
            if not self.is_available():
                return False
            
            return self.redis_client.flushdb()
            
        except Exception as e:
            logger.error(f"Erro ao limpar cache: {e}")
            return False
    
    def get_stats(self) -> Dict:
        """Obtém estatísticas do Redis"""
        try:
            if not self.is_available():
                return {}
            
            info = self.redis_client.info()
            return {
                'connected_clients': info.get('connected_clients', 0),
                'used_memory': info.get('used_memory_human', '0B'),
                'total_commands_processed': info.get('total_commands_processed', 0),
                'keyspace_hits': info.get('keyspace_hits', 0),
                'keyspace_misses': info.get('keyspace_misses', 0),
                'uptime_in_seconds': info.get('uptime_in_seconds', 0)
            }
            
        except Exception as e:
            logger.error(f"Erro ao obter estatísticas do Redis: {e}")
            return {}

# Instância global do serviço de cache
cache_service = CacheService()

def cache_key(*args, **kwargs) -> str:
    """Gera chave de cache baseada nos argumentos"""
    key_data = str(args) + str(sorted(kwargs.items()))
    return hashlib.md5(key_data.encode()).hexdigest()

def cached(ttl: int = 3600, key_prefix: str = ""):
    """Decorator para cache de funções"""
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            # Gera chave de cache
            cache_key_str = f"{key_prefix}:{func.__name__}:{cache_key(*args, **kwargs)}"
            
            # Tenta obter do cache
            cached_result = cache_service.get(cache_key_str)
            if cached_result is not None:
                logger.debug(f"Cache hit para {cache_key_str}")
                return cached_result
            
            # Executa função e armazena no cache
            result = func(*args, **kwargs)
            cache_service.set(cache_key_str, result, ttl)
            logger.debug(f"Cache miss para {cache_key_str}, resultado armazenado")
            
            return result
        return wrapper
    return decorator

def invalidate_cache(pattern: str):
    """Decorator para invalidar cache após operações"""
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            result = func(*args, **kwargs)
            cache_service.delete_pattern(pattern)
            logger.debug(f"Cache invalidado para padrão: {pattern}")
            return result
        return wrapper
    return decorator

# Funções específicas para diferentes tipos de cache
class SocialCacheService:
    def __init__(self):
        self.cache = cache_service
    
    def get_user_posts(self, user_id: str, page: int = 1) -> Optional[List]:
        """Obtém posts do usuário do cache"""
        key = f"user_posts:{user_id}:page:{page}"
        return self.cache.get(key)
    
    def set_user_posts(self, user_id: str, page: int, posts: List, ttl: int = 300):
        """Armazena posts do usuário no cache"""
        key = f"user_posts:{user_id}:page:{page}"
        return self.cache.set(key, posts, ttl)
    
    def invalidate_user_posts(self, user_id: str):
        """Invalida cache de posts do usuário"""
        pattern = f"user_posts:{user_id}:*"
        return self.cache.delete_pattern(pattern)
    
    def get_streams(self, category: str = None, page: int = 1) -> Optional[List]:
        """Obtém streams do cache"""
        key = f"streams:{category or 'all'}:page:{page}"
        return self.cache.get(key)
    
    def set_streams(self, category: str, page: int, streams: List, ttl: int = 60):
        """Armazena streams no cache"""
        key = f"streams:{category or 'all'}:page:{page}"
        return self.cache.set(key, streams, ttl)
    
    def invalidate_streams(self):
        """Invalida cache de streams"""
        pattern = "streams:*"
        return self.cache.delete_pattern(pattern)
    
    def get_video_stats(self, video_id: str) -> Optional[Dict]:
        """Obtém estatísticas do vídeo do cache"""
        key = f"video_stats:{video_id}"
        return self.cache.get(key)
    
    def set_video_stats(self, video_id: str, stats: Dict, ttl: int = 300):
        """Armazena estatísticas do vídeo no cache"""
        key = f"video_stats:{video_id}"
        return self.cache.set(key, stats, ttl)
    
    def invalidate_video_stats(self, video_id: str):
        """Invalida cache de estatísticas do vídeo"""
        key = f"video_stats:{video_id}"
        return self.cache.delete(key)

# Instância global do serviço de cache social
social_cache = SocialCacheService()
