# -*- coding: utf-8 -*-
"""
Sistema de Resiliência HTTP RE-EDUCA Store.

Fornece ferramentas para tornar chamadas HTTP mais resilientes:
- Circuit Breaker Pattern
- Retry com Backoff Exponencial
- Timeouts configuráveis
- Métricas de performance
"""

import logging
import time
from datetime import datetime, timedelta
from enum import Enum
from functools import wraps
from typing import Any, Callable, Dict, Optional

import requests

logger = logging.getLogger(__name__)


# ==============================================================================
# CONFIGURAÇÕES PADRÃO
# ==============================================================================

DEFAULT_TIMEOUT = 10  # segundos
DEFAULT_MAX_RETRIES = 3
DEFAULT_BACKOFF_FACTOR = 2.0
DEFAULT_CIRCUIT_BREAKER_THRESHOLD = 5
DEFAULT_CIRCUIT_BREAKER_TIMEOUT = 60  # segundos


# ==============================================================================
# CIRCUIT BREAKER
# ==============================================================================

class CircuitBreakerState(Enum):
    """Estados do Circuit Breaker."""
    CLOSED = "closed"  # Funcionando normalmente
    OPEN = "open"  # Falhou muito, bloqueia requisições
    HALF_OPEN = "half_open"  # Testando se voltou ao normal


class CircuitBreaker:
    """
    Implementa Circuit Breaker Pattern.
    
    Previne sobrecarga de serviços externos quando estão falhando.
    """

    def __init__(
        self,
        name: str,
        failure_threshold: int = DEFAULT_CIRCUIT_BREAKER_THRESHOLD,
        timeout: int = DEFAULT_CIRCUIT_BREAKER_TIMEOUT,
        expected_exceptions: tuple = (requests.exceptions.RequestException,)
    ):
        """
        Inicializa Circuit Breaker.
        
        Args:
            name: Nome identificador do circuit breaker
            failure_threshold: Número de falhas antes de abrir o circuito
            timeout: Tempo em segundos antes de tentar novamente (HALF_OPEN)
            expected_exceptions: Tupla de exceções que devem ser contadas
        """
        self.name = name
        self.failure_threshold = failure_threshold
        self.timeout = timeout
        self.expected_exceptions = expected_exceptions
        
        self.failure_count = 0
        self.success_count = 0
        self.last_failure_time: Optional[datetime] = None
        self.state = CircuitBreakerState.CLOSED

    def call(self, func: Callable, *args, **kwargs) -> Any:
        """
        Executa função através do circuit breaker.
        
        Args:
            func: Função a ser executada
            *args, **kwargs: Argumentos da função
            
        Returns:
            Resultado da função
            
        Raises:
            Exception: Se circuito estiver aberto ou função falhar
        """
        if self.state == CircuitBreakerState.OPEN:
            if self._should_attempt_reset():
                self.state = CircuitBreakerState.HALF_OPEN
                logger.info(f"Circuit Breaker '{self.name}': Tentando HALF_OPEN")
            else:
                raise Exception(
                    f"Circuit Breaker '{self.name}' está OPEN. "
                    f"Tentará novamente após {self.timeout}s."
                )

        try:
            result = func(*args, **kwargs)
            self._on_success()
            return result
            
        except self.expected_exceptions as e:
            self._on_failure()
            raise

    def _should_attempt_reset(self) -> bool:
        """Verifica se deve tentar resetar o circuito."""
        if self.last_failure_time is None:
            return True
        return datetime.now() - self.last_failure_time >= timedelta(seconds=self.timeout)

    def _on_success(self):
        """Callback de sucesso."""
        self.failure_count = 0
        if self.state == CircuitBreakerState.HALF_OPEN:
            self.state = CircuitBreakerState.CLOSED
            logger.info(f"Circuit Breaker '{self.name}': Voltou para CLOSED")
        self.success_count += 1

    def _on_failure(self):
        """Callback de falha."""
        self.failure_count += 1
        self.last_failure_time = datetime.now()
        
        if self.failure_count >= self.failure_threshold:
            self.state = CircuitBreakerState.OPEN
            logger.warning(
                f"Circuit Breaker '{self.name}': Mudou para OPEN "
                f"após {self.failure_count} falhas"
            )

    def reset(self):
        """Reseta manualmente o circuit breaker."""
        self.failure_count = 0
        self.success_count = 0
        self.last_failure_time = None
        self.state = CircuitBreakerState.CLOSED
        logger.info(f"Circuit Breaker '{self.name}': Reset manual")


# ==============================================================================
# CIRCUIT BREAKER REGISTRY
# ==============================================================================

_circuit_breakers: Dict[str, CircuitBreaker] = {}


def get_circuit_breaker(
    name: str,
    failure_threshold: int = DEFAULT_CIRCUIT_BREAKER_THRESHOLD,
    timeout: int = DEFAULT_CIRCUIT_BREAKER_TIMEOUT
) -> CircuitBreaker:
    """
    Obtém ou cria um circuit breaker.
    
    Args:
        name: Nome do circuit breaker
        failure_threshold: Threshold de falhas
        timeout: Timeout de recuperação
        
    Returns:
        Instância do CircuitBreaker
    """
    if name not in _circuit_breakers:
        _circuit_breakers[name] = CircuitBreaker(
            name=name,
            failure_threshold=failure_threshold,
            timeout=timeout
        )
    return _circuit_breakers[name]


# ==============================================================================
# RETRY COM BACKOFF EXPONENCIAL
# ==============================================================================

def retry_with_backoff(
    max_retries: int = DEFAULT_MAX_RETRIES,
    backoff_factor: float = DEFAULT_BACKOFF_FACTOR,
    exceptions: tuple = (requests.exceptions.RequestException,)
):
    """
    Decorator para retry com backoff exponencial.
    
    Args:
        max_retries: Número máximo de tentativas
        backoff_factor: Fator de crescimento do delay
        exceptions: Tupla de exceções que devem disparar retry
        
    Usage:
        @retry_with_backoff(max_retries=3, backoff_factor=2)
        def fetch_data():
            return requests.get('https://api.example.com/data', timeout=10)
    """
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        def wrapper(*args, **kwargs):
            last_exception = None
            
            for attempt in range(max_retries):
                try:
                    return func(*args, **kwargs)
                    
                except exceptions as e:
                    last_exception = e
                    
                    if attempt < max_retries - 1:
                        delay = backoff_factor ** attempt
                        logger.warning(
                            f"Tentativa {attempt + 1}/{max_retries} falhou para "
                            f"{func.__name__}. Aguardando {delay:.2f}s. Erro: {e}"
                        )
                        time.sleep(delay)
                    else:
                        logger.error(
                            f"Todas as {max_retries} tentativas falharam para "
                            f"{func.__name__}. Último erro: {e}"
                        )
            
            raise last_exception
            
        return wrapper
    return decorator


# ==============================================================================
# CLIENTE HTTP RESILIENTE
# ==============================================================================

class ResilientHTTPClient:
    """
    Cliente HTTP com resiliência integrada.
    
    Features:
    - Circuit Breaker
    - Retry automático
    - Timeouts configuráveis
    - Métricas de performance
    """

    def __init__(
        self,
        service_name: str,
        base_url: Optional[str] = None,
        timeout: int = DEFAULT_TIMEOUT,
        max_retries: int = DEFAULT_MAX_RETRIES,
        use_circuit_breaker: bool = True
    ):
        """
        Inicializa cliente resiliente.
        
        Args:
            service_name: Nome do serviço (para logs e métricas)
            base_url: URL base opcional
            timeout: Timeout padrão em segundos
            max_retries: Máximo de tentativas
            use_circuit_breaker: Se deve usar circuit breaker
        """
        self.service_name = service_name
        self.base_url = base_url
        self.timeout = timeout
        self.max_retries = max_retries
        self.use_circuit_breaker = use_circuit_breaker
        
        if use_circuit_breaker:
            self.circuit_breaker = get_circuit_breaker(service_name)
        else:
            self.circuit_breaker = None
        
        # Métricas
        self.total_requests = 0
        self.successful_requests = 0
        self.failed_requests = 0

    def _build_url(self, endpoint: str) -> str:
        """Constrói URL completa."""
        if self.base_url:
            return f"{self.base_url.rstrip('/')}/{endpoint.lstrip('/')}"
        return endpoint

    @retry_with_backoff()
    def _do_request(self, method: str, url: str, **kwargs) -> requests.Response:
        """
        Executa requisição com retry.
        
        Args:
            method: Método HTTP
            url: URL completa
            **kwargs: Argumentos adicionais para requests
            
        Returns:
            Response do requests
        """
        # Garante timeout
        if 'timeout' not in kwargs:
            kwargs['timeout'] = self.timeout
        
        response = requests.request(method, url, **kwargs)
        response.raise_for_status()
        return response

    def request(
        self,
        method: str,
        endpoint: str,
        **kwargs
    ) -> requests.Response:
        """
        Faz requisição resiliente.
        
        Args:
            method: Método HTTP (GET, POST, etc.)
            endpoint: Endpoint ou URL completa
            **kwargs: Argumentos adicionais para requests
            
        Returns:
            Response do requests
            
        Raises:
            Exception: Se todas tentativas falharem ou circuito estiver aberto
        """
        self.total_requests += 1
        url = self._build_url(endpoint)
        
        try:
            if self.circuit_breaker:
                response = self.circuit_breaker.call(
                    self._do_request,
                    method,
                    url,
                    **kwargs
                )
            else:
                response = self._do_request(method, url, **kwargs)
            
            self.successful_requests += 1
            return response
            
        except Exception as e:
            self.failed_requests += 1
            logger.error(
                f"Falha na requisição para {self.service_name} ({method} {url}): {e}"
            )
            raise

    def get(self, endpoint: str, **kwargs) -> requests.Response:
        """GET request."""
        return self.request('GET', endpoint, **kwargs)

    def post(self, endpoint: str, **kwargs) -> requests.Response:
        """POST request."""
        return self.request('POST', endpoint, **kwargs)

    def put(self, endpoint: str, **kwargs) -> requests.Response:
        """PUT request."""
        return self.request('PUT', endpoint, **kwargs)

    def patch(self, endpoint: str, **kwargs) -> requests.Response:
        """PATCH request."""
        return self.request('PATCH', endpoint, **kwargs)

    def delete(self, endpoint: str, **kwargs) -> requests.Response:
        """DELETE request."""
        return self.request('DELETE', endpoint, **kwargs)

    def get_metrics(self) -> Dict[str, Any]:
        """
        Retorna métricas do cliente.
        
        Returns:
            Dict com métricas de performance
        """
        success_rate = (
            (self.successful_requests / self.total_requests * 100)
            if self.total_requests > 0 else 0
        )
        
        metrics = {
            'service_name': self.service_name,
            'total_requests': self.total_requests,
            'successful_requests': self.successful_requests,
            'failed_requests': self.failed_requests,
            'success_rate': f"{success_rate:.2f}%"
        }
        
        if self.circuit_breaker:
            metrics['circuit_breaker_state'] = self.circuit_breaker.state.value
            metrics['circuit_breaker_failures'] = self.circuit_breaker.failure_count
        
        return metrics


# ==============================================================================
# HELPERS
# ==============================================================================

def create_stripe_client() -> ResilientHTTPClient:
    """Cria cliente resiliente para Stripe."""
    return ResilientHTTPClient(
        service_name='stripe',
        timeout=15,
        max_retries=3
    )


def create_openai_client() -> ResilientHTTPClient:
    """Cria cliente resiliente para OpenAI."""
    return ResilientHTTPClient(
        service_name='openai',
        timeout=30,  # APIs de IA podem demorar mais
        max_retries=2
    )


def create_usda_client() -> ResilientHTTPClient:
    """Cria cliente resiliente para USDA."""
    return ResilientHTTPClient(
        service_name='usda',
        base_url='https://api.nal.usda.gov/fdc/v1',
        timeout=10,
        max_retries=3
    )


def create_affiliate_client(service_name: str) -> ResilientHTTPClient:
    """
    Cria cliente resiliente para serviços de afiliados.
    
    Args:
        service_name: Nome do serviço (hotmart, kiwify, braip)
        
    Returns:
        Cliente HTTP resiliente
    """
    return ResilientHTTPClient(
        service_name=service_name,
        timeout=15,
        max_retries=3
    )
