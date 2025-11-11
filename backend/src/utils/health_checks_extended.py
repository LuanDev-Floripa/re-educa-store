# -*- coding: utf-8 -*-
"""
Sistema de Health Checks Estendido RE-EDUCA Store.

Monitora saúde de todas as dependências externas:
- Database (Supabase)
- Cache (Redis)
- Storage (Supabase Storage)
- APIs Externas (Stripe, OpenAI, USDA, etc)
- Workers (Queue/Task workers)
"""

import logging
import os
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)


# ==============================================================================
# CONSTANTES
# ==============================================================================

class HealthStatus(Enum):
    """Status de saúde de um componente."""
    HEALTHY = "healthy"
    DEGRADED = "degraded"
    UNHEALTHY = "unhealthy"
    UNKNOWN = "unknown"


DEFAULT_TIMEOUT = 5  # segundos
HEALTH_CHECK_CACHE_TTL = 30  # Cache de 30 segundos


# ==============================================================================
# HEALTH CHECK RESULT
# ==============================================================================

class HealthCheckResult:
    """Resultado de um health check."""
    
    def __init__(
        self,
        name: str,
        status: HealthStatus,
        response_time_ms: float,
        message: str = "",
        details: Optional[Dict[str, Any]] = None
    ):
        self.name = name
        self.status = status
        self.response_time_ms = response_time_ms
        self.message = message
        self.details = details or {}
        self.timestamp = datetime.now().isoformat()
    
    def to_dict(self) -> Dict[str, Any]:
        """Converte para dicionário."""
        return {
            "name": self.name,
            "status": self.status.value,
            "response_time_ms": round(self.response_time_ms, 2),
            "message": self.message,
            "details": self.details,
            "timestamp": self.timestamp
        }
    
    def is_healthy(self) -> bool:
        """Verifica se está saudável."""
        return self.status == HealthStatus.HEALTHY


# ==============================================================================
# HEALTH CHECKERS
# ==============================================================================

class DatabaseHealthChecker:
    """Health checker para database (Supabase)."""
    
    @staticmethod
    def check() -> HealthCheckResult:
        """
        Verifica saúde do database.
        
        Returns:
            HealthCheckResult
        """
        start_time = time.time()
        
        try:
            from config.database import supabase_client
            
            # Tenta fazer uma query simples
            response = supabase_client._make_request(
                'GET',
                'users?limit=1&select=id',
                {}
            )
            
            response_time = (time.time() - start_time) * 1000
            
            if 'error' in response:
                return HealthCheckResult(
                    name="database",
                    status=HealthStatus.UNHEALTHY,
                    response_time_ms=response_time,
                    message=f"Database error: {response['error']}",
                    details={"error": str(response['error'])}
                )
            
            # Verificar tempo de resposta
            if response_time > 1000:  # > 1s
                status = HealthStatus.DEGRADED
                message = f"Database slow: {response_time:.0f}ms"
            else:
                status = HealthStatus.HEALTHY
                message = "Database operational"
            
            return HealthCheckResult(
                name="database",
                status=status,
                response_time_ms=response_time,
                message=message,
                details={
                    "provider": "supabase",
                    "connection": "established"
                }
            )
        
        except Exception as e:
            response_time = (time.time() - start_time) * 1000
            logger.error(f"Database health check failed: {e}")
            return HealthCheckResult(
                name="database",
                status=HealthStatus.UNHEALTHY,
                response_time_ms=response_time,
                message=f"Database unavailable: {str(e)}",
                details={"error": str(e)}
            )


class RedisHealthChecker:
    """Health checker para cache (Redis)."""
    
    @staticmethod
    def check() -> HealthCheckResult:
        """
        Verifica saúde do Redis.
        
        Returns:
            HealthCheckResult
        """
        start_time = time.time()
        
        try:
            import redis
            from config.settings import get_config
            
            config = get_config()
            redis_client = redis.from_url(
                config.REDIS_URL,
                decode_responses=True,
                socket_timeout=DEFAULT_TIMEOUT
            )
            
            # Ping
            redis_client.ping()
            
            # Verificar info
            info = redis_client.info('server')
            
            response_time = (time.time() - start_time) * 1000
            
            # Verificar tempo de resposta
            if response_time > 500:  # > 500ms
                status = HealthStatus.DEGRADED
                message = f"Redis slow: {response_time:.0f}ms"
            else:
                status = HealthStatus.HEALTHY
                message = "Redis operational"
            
            return HealthCheckResult(
                name="redis",
                status=status,
                response_time_ms=response_time,
                message=message,
                details={
                    "version": info.get('redis_version', 'unknown'),
                    "uptime_seconds": info.get('uptime_in_seconds', 0),
                    "connected_clients": info.get('connected_clients', 0)
                }
            )
        
        except Exception as e:
            response_time = (time.time() - start_time) * 1000
            logger.error(f"Redis health check failed: {e}")
            return HealthCheckResult(
                name="redis",
                status=HealthStatus.UNHEALTHY,
                response_time_ms=response_time,
                message=f"Redis unavailable: {str(e)}",
                details={"error": str(e)}
            )


class StripeHealthChecker:
    """Health checker para Stripe API."""
    
    @staticmethod
    def check() -> HealthCheckResult:
        """
        Verifica saúde do Stripe.
        
        Returns:
            HealthCheckResult
        """
        start_time = time.time()
        
        try:
            import stripe
            from config.settings import get_config
            
            config = get_config()
            stripe.api_key = config.STRIPE_SECRET_KEY
            
            if not stripe.api_key:
                return HealthCheckResult(
                    name="stripe",
                    status=HealthStatus.UNKNOWN,
                    response_time_ms=0,
                    message="Stripe not configured",
                    details={"configured": False}
                )
            
            # Tentar buscar balance (endpoint leve)
            balance = stripe.Balance.retrieve(timeout=DEFAULT_TIMEOUT)
            
            response_time = (time.time() - start_time) * 1000
            
            return HealthCheckResult(
                name="stripe",
                status=HealthStatus.HEALTHY,
                response_time_ms=response_time,
                message="Stripe operational",
                details={
                    "available": balance.get('available', []),
                    "pending": balance.get('pending', []),
                    "livemode": balance.get('livemode', False)
                }
            )
        
        except Exception as e:
            response_time = (time.time() - start_time) * 1000
            logger.error(f"Stripe health check failed: {e}")
            
            # Degraded se for rate limit, unhealthy caso contrário
            if "rate_limit" in str(e).lower():
                status = HealthStatus.DEGRADED
                message = "Stripe rate limited"
            else:
                status = HealthStatus.UNHEALTHY
                message = f"Stripe unavailable: {str(e)}"
            
            return HealthCheckResult(
                name="stripe",
                status=status,
                response_time_ms=response_time,
                message=message,
                details={"error": str(e)}
            )


class StorageHealthChecker:
    """Health checker para Supabase Storage."""
    
    @staticmethod
    def check() -> HealthCheckResult:
        """
        Verifica saúde do Storage.
        
        Returns:
            HealthCheckResult
        """
        start_time = time.time()
        
        try:
            import requests
            from config.settings import get_config
            
            config = get_config()
            
            # Tentar listar buckets
            url = f"{config.SUPABASE_URL}/storage/v1/bucket"
            headers = {
                "apikey": config.SUPABASE_KEY,
                "Authorization": f"Bearer {config.SUPABASE_KEY}"
            }
            
            response = requests.get(url, headers=headers, timeout=DEFAULT_TIMEOUT)
            response.raise_for_status()
            
            buckets = response.json()
            response_time = (time.time() - start_time) * 1000
            
            return HealthCheckResult(
                name="storage",
                status=HealthStatus.HEALTHY,
                response_time_ms=response_time,
                message="Storage operational",
                details={
                    "provider": "supabase",
                    "buckets_count": len(buckets)
                }
            )
        
        except Exception as e:
            response_time = (time.time() - start_time) * 1000
            logger.error(f"Storage health check failed: {e}")
            return HealthCheckResult(
                name="storage",
                status=HealthStatus.UNHEALTHY,
                response_time_ms=response_time,
                message=f"Storage unavailable: {str(e)}",
                details={"error": str(e)}
            )


class OpenAIHealthChecker:
    """Health checker para OpenAI API."""
    
    @staticmethod
    def check() -> HealthCheckResult:
        """
        Verifica saúde do OpenAI.
        
        Returns:
            HealthCheckResult
        """
        start_time = time.time()
        
        try:
            import openai
            from config.settings import get_config
            
            config = get_config()
            openai.api_key = config.OPENAI_API_KEY
            
            if not openai.api_key:
                return HealthCheckResult(
                    name="openai",
                    status=HealthStatus.UNKNOWN,
                    response_time_ms=0,
                    message="OpenAI not configured",
                    details={"configured": False}
                )
            
            # Tentar listar modelos (endpoint leve)
            models = openai.Model.list(timeout=DEFAULT_TIMEOUT)
            
            response_time = (time.time() - start_time) * 1000
            
            return HealthCheckResult(
                name="openai",
                status=HealthStatus.HEALTHY,
                response_time_ms=response_time,
                message="OpenAI operational",
                details={
                    "models_available": len(models.get('data', [])),
                    "configured": True
                }
            )
        
        except Exception as e:
            response_time = (time.time() - start_time) * 1000
            logger.error(f"OpenAI health check failed: {e}")
            
            # Degraded se for rate limit
            if "rate_limit" in str(e).lower() or "429" in str(e):
                status = HealthStatus.DEGRADED
                message = "OpenAI rate limited"
            else:
                status = HealthStatus.UNHEALTHY
                message = f"OpenAI unavailable: {str(e)}"
            
            return HealthCheckResult(
                name="openai",
                status=status,
                response_time_ms=response_time,
                message=message,
                details={"error": str(e)}
            )


# ==============================================================================
# HEALTH CHECK ORCHESTRATOR
# ==============================================================================

class HealthCheckOrchestrator:
    """Orquestra múltiplos health checks em paralelo."""
    
    def __init__(self):
        """Inicializa o orchestrator."""
        self.checkers = {
            'database': DatabaseHealthChecker,
            'redis': RedisHealthChecker,
            'stripe': StripeHealthChecker,
            'storage': StorageHealthChecker,
            'openai': OpenAIHealthChecker,
        }
        self._cache: Dict[str, tuple] = {}  # {name: (result, timestamp)}
    
    def check_all(self, use_cache: bool = True, timeout: int = 10) -> Dict[str, Any]:
        """
        Executa todos os health checks em paralelo.
        
        Args:
            use_cache: Se deve usar cache de resultados recentes
            timeout: Timeout total para todos checks (segundos)
            
        Returns:
            Dict com status geral e detalhes de cada componente
        """
        results = {}
        
        with ThreadPoolExecutor(max_workers=len(self.checkers)) as executor:
            futures = {
                executor.submit(self._check_with_cache, name, checker, use_cache): name
                for name, checker in self.checkers.items()
            }
            
            for future in as_completed(futures, timeout=timeout):
                name = futures[future]
                try:
                    results[name] = future.result()
                except Exception as e:
                    logger.error(f"Health check failed for {name}: {e}")
                    results[name] = HealthCheckResult(
                        name=name,
                        status=HealthStatus.UNKNOWN,
                        response_time_ms=0,
                        message=f"Check failed: {str(e)}",
                        details={"error": str(e)}
                    )
        
        # Calcular status geral
        overall_status = self._calculate_overall_status(results)
        
        return {
            "status": overall_status.value,
            "timestamp": datetime.now().isoformat(),
            "components": {
                name: result.to_dict()
                for name, result in results.items()
            },
            "summary": {
                "healthy": sum(1 for r in results.values() if r.status == HealthStatus.HEALTHY),
                "degraded": sum(1 for r in results.values() if r.status == HealthStatus.DEGRADED),
                "unhealthy": sum(1 for r in results.values() if r.status == HealthStatus.UNHEALTHY),
                "unknown": sum(1 for r in results.values() if r.status == HealthStatus.UNKNOWN),
                "total": len(results)
            }
        }
    
    def check_one(self, component: str, use_cache: bool = True) -> Optional[Dict[str, Any]]:
        """
        Executa health check de um componente específico.
        
        Args:
            component: Nome do componente
            use_cache: Se deve usar cache
            
        Returns:
            Resultado do health check ou None se componente não existir
        """
        if component not in self.checkers:
            return None
        
        result = self._check_with_cache(component, self.checkers[component], use_cache)
        return result.to_dict()
    
    def _check_with_cache(
        self,
        name: str,
        checker: type,
        use_cache: bool
    ) -> HealthCheckResult:
        """Executa check com cache."""
        if use_cache and name in self._cache:
            result, timestamp = self._cache[name]
            age = time.time() - timestamp
            
            if age < HEALTH_CHECK_CACHE_TTL:
                logger.debug(f"Using cached health check for {name} (age: {age:.1f}s)")
                return result
        
        # Executar check
        result = checker.check()
        
        # Armazenar em cache
        self._cache[name] = (result, time.time())
        
        return result
    
    def _calculate_overall_status(self, results: Dict[str, HealthCheckResult]) -> HealthStatus:
        """
        Calcula status geral baseado em todos os resultados.
        
        Lógica:
        - Se algum crítico (database, redis) está unhealthy: UNHEALTHY
        - Se algum componente está unhealthy: DEGRADED
        - Se algum componente está degraded: DEGRADED
        - Caso contrário: HEALTHY
        """
        critical_components = ['database', 'redis']
        
        # Verificar componentes críticos
        for name in critical_components:
            if name in results and results[name].status == HealthStatus.UNHEALTHY:
                return HealthStatus.UNHEALTHY
        
        # Verificar todos componentes
        statuses = [r.status for r in results.values()]
        
        if HealthStatus.UNHEALTHY in statuses:
            return HealthStatus.DEGRADED
        
        if HealthStatus.DEGRADED in statuses:
            return HealthStatus.DEGRADED
        
        if HealthStatus.UNKNOWN in statuses:
            return HealthStatus.DEGRADED
        
        return HealthStatus.HEALTHY
    
    def clear_cache(self):
        """Limpa cache de health checks."""
        self._cache.clear()
        logger.info("Health check cache cleared")


# ==============================================================================
# SINGLETON INSTANCE
# ==============================================================================

health_check_orchestrator = HealthCheckOrchestrator()


# ==============================================================================
# CONVENIENCE FUNCTIONS
# ==============================================================================

def check_all_health(use_cache: bool = True) -> Dict[str, Any]:
    """
    Verifica saúde de todos componentes.
    
    Args:
        use_cache: Se deve usar cache de resultados recentes
        
    Returns:
        Dict com status geral e detalhes
    """
    return health_check_orchestrator.check_all(use_cache=use_cache)


def check_component_health(component: str, use_cache: bool = True) -> Optional[Dict[str, Any]]:
    """
    Verifica saúde de um componente específico.
    
    Args:
        component: Nome do componente (database, redis, stripe, etc)
        use_cache: Se deve usar cache
        
    Returns:
        Dict com resultado ou None se componente não existir
    """
    return health_check_orchestrator.check_one(component, use_cache=use_cache)


def is_system_healthy() -> bool:
    """
    Verifica se sistema está saudável.
    
    Returns:
        True se sistema está operacional
    """
    result = check_all_health(use_cache=True)
    return result['status'] in ['healthy', 'degraded']
