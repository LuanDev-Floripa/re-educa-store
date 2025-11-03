"""
Sistema de Métricas Prometheus para Monitoramento RE-EDUCA Store.

Coleta métricas do sistema para Prometheus/Grafana incluindo:
- Requisições HTTP (total, duração, status)
- Erros da aplicação
- Métricas de negócio (vendas, usuários, logins)
- Performance de banco de dados
- Cache hit/miss rates
- Filas e workers

INTEGRAÇÃO:
- Endpoint /metrics para Prometheus scraping
- Dashboards em Grafana
- Alertas via Alertmanager

DEPENDÊNCIA:
- prometheus-client (pip install prometheus-client)
"""

import time
import logging
from typing import Any, Optional
from functools import wraps

try:
    from prometheus_client import (
        Counter, Histogram, Gauge,
        generate_latest,
        CollectorRegistry
    )
    PROMETHEUS_AVAILABLE = True
except ImportError:
    PROMETHEUS_AVAILABLE = False
    logging.warning("Prometheus client não disponível. Métricas serão desabilitadas.")

logger = logging.getLogger(__name__)


class MetricsCollector:
    """
    Coletor de métricas para o sistema RE-EDUCA.

    Centraliza coleta de métricas Prometheus.
    """

    def __init__(self, registry: Optional[Any] = None):
        """
        Inicializa o coletor de métricas.

        Args:
            registry (CollectorRegistry, optional): Registry customizado.
        """
        if not PROMETHEUS_AVAILABLE:
            logger.warning("Prometheus não disponível, métricas desabilitadas")
            self.enabled = False
            return

        self.enabled = True
        self.registry = registry or CollectorRegistry()

        # Métricas de requisições HTTP
        self.http_requests_total = Counter(
            'http_requests_total',
            'Total de requisições HTTP',
            ['method', 'endpoint', 'status'],
            registry=self.registry
        )

        self.http_request_duration_seconds = Histogram(
            'http_request_duration_seconds',
            'Duração das requisições HTTP',
            ['method', 'endpoint'],
            buckets=[0.1, 0.25, 0.5, 1.0, 2.5, 5.0, 10.0],
            registry=self.registry
        )

        # Métricas de banco de dados
        self.db_queries_total = Counter(
            'db_queries_total',
            'Total de queries no banco de dados',
            ['operation', 'table'],
            registry=self.registry
        )

        self.db_query_duration_seconds = Histogram(
            'db_query_duration_seconds',
            'Duração das queries no banco de dados',
            ['operation', 'table'],
            buckets=[0.01, 0.05, 0.1, 0.25, 0.5, 1.0, 2.5],
            registry=self.registry
        )

        # Métricas de cache
        self.cache_hits_total = Counter(
            'cache_hits_total',
            'Total de hits no cache',
            ['cache_type'],
            registry=self.registry
        )

        self.cache_misses_total = Counter(
            'cache_misses_total',
            'Total de misses no cache',
            ['cache_type'],
            registry=self.registry
        )

        self.cache_size_bytes = Gauge(
            'cache_size_bytes',
            'Tamanho do cache em bytes',
            ['cache_type'],
            registry=self.registry
        )

        # Métricas de filas
        self.queue_tasks_total = Counter(
            'queue_tasks_total',
            'Total de tarefas processadas',
            ['queue_name', 'status'],
            registry=self.registry
        )

        self.queue_tasks_in_queue = Gauge(
            'queue_tasks_in_queue',
            'Número de tarefas na fila',
            ['queue_name', 'priority'],
            registry=self.registry
        )

        self.queue_task_duration_seconds = Histogram(
            'queue_task_duration_seconds',
            'Duração do processamento de tarefas',
            ['queue_name'],
            buckets=[0.1, 0.25, 0.5, 1.0, 2.5, 5.0, 10.0],
            registry=self.registry
        )

        # Métricas de usuários
        self.active_users = Gauge(
            'active_users',
            'Número de usuários ativos',
            registry=self.registry
        )

        self.user_registrations_total = Counter(
            'user_registrations_total',
            'Total de registros de usuários',
            registry=self.registry
        )

        self.user_logins_total = Counter(
            'user_logins_total',
            'Total de logins de usuários',
            ['status'],
            registry=self.registry
        )

        # Métricas de saúde
        self.health_checks_total = Counter(
            'health_checks_total',
            'Total de verificações de saúde',
            ['check_type', 'status'],
            registry=self.registry
        )

        self.health_check_duration_seconds = Histogram(
            'health_check_duration_seconds',
            'Duração das verificações de saúde',
            ['check_type'],
            buckets=[0.01, 0.05, 0.1, 0.25, 0.5],
            registry=self.registry
        )

        # Métricas de IA
        self.ai_requests_total = Counter(
            'ai_requests_total',
            'Total de requisições para IA',
            ['ai_type', 'status'],
            registry=self.registry
        )

        self.ai_response_time_seconds = Histogram(
            'ai_response_time_seconds',
            'Tempo de resposta da IA',
            ['ai_type'],
            buckets=[0.1, 0.25, 0.5, 1.0, 2.5, 5.0],
            registry=self.registry
        )

        # Métricas de pagamentos
        self.payment_requests_total = Counter(
            'payment_requests_total',
            'Total de requisições de pagamento',
            ['payment_method', 'status'],
            registry=self.registry
        )

        self.payment_amount_total = Counter(
            'payment_amount_total',
            'Valor total dos pagamentos',
            ['payment_method', 'status'],
            registry=self.registry
        )

        # Métricas de sistema
        self.system_memory_bytes = Gauge(
            'system_memory_bytes',
            'Uso de memória do sistema',
            registry=self.registry
        )

        self.system_cpu_percent = Gauge(
            'system_cpu_percent',
            'Uso de CPU do sistema',
            registry=self.registry
        )

        self.system_disk_usage_percent = Gauge(
            'system_disk_usage_percent',
            'Uso de disco do sistema',
            registry=self.registry
        )

        logger.info("Sistema de métricas inicializado com sucesso")

    def record_http_request(self, method: str, endpoint: str, status: int, duration: float):
        """Registra métrica de requisição HTTP"""
        if not self.enabled:
            return

        try:
            self.http_requests_total.labels(method=method, endpoint=endpoint, status=status).inc()
            self.http_request_duration_seconds.labels(method=method, endpoint=endpoint).observe(duration)
        except Exception as e:
            logger.error(f"Erro ao registrar métrica HTTP: {e}")

    def record_db_query(self, operation: str, table: str, duration: float):
        """Registra métrica de query no banco"""
        if not self.enabled:
            return

        try:
            self.db_queries_total.labels(operation=operation, table=table).inc()
            self.db_query_duration_seconds.labels(operation=operation, table=table).observe(duration)
        except Exception as e:
            logger.error(f"Erro ao registrar métrica de banco: {e}")

    def record_cache_hit(self, cache_type: str):
        """Registra hit no cache"""
        if not self.enabled:
            return

        try:
            self.cache_hits_total.labels(cache_type=cache_type).inc()
        except Exception as e:
            logger.error(f"Erro ao registrar hit no cache: {e}")

    def record_cache_miss(self, cache_type: str):
        """Registra miss no cache"""
        if not self.enabled:
            return

        try:
            self.cache_misses_total.labels(cache_type=cache_type).inc()
        except Exception as e:
            logger.error(f"Erro ao registrar miss no cache: {e}")

    def set_cache_size(self, cache_type: str, size_bytes: int):
        """Define tamanho do cache"""
        if not self.enabled:
            return

        try:
            self.cache_size_bytes.labels(cache_type=cache_type).set(size_bytes)
        except Exception as e:
            logger.error(f"Erro ao definir tamanho do cache: {e}")

    def record_queue_task(self, queue_name: str, status: str):
        """Registra tarefa da fila"""
        if not self.enabled:
            return

        try:
            self.queue_tasks_total.labels(queue_name=queue_name, status=status).inc()
        except Exception as e:
            logger.error(f"Erro ao registrar tarefa da fila: {e}")

    def set_queue_tasks_count(self, queue_name: str, priority: str, count: int):
        """Define número de tarefas na fila"""
        if not self.enabled:
            return

        try:
            self.queue_tasks_in_queue.labels(queue_name=queue_name, priority=priority).set(count)
        except Exception as e:
            logger.error(f"Erro ao definir contagem de tarefas: {e}")

    def record_queue_task_duration(self, queue_name: str, duration: float):
        """Registra duração de tarefa da fila"""
        if not self.enabled:
            return

        try:
            self.queue_task_duration_seconds.labels(queue_name=queue_name).observe(duration)
        except Exception as e:
            logger.error(f"Erro ao registrar duração de tarefa: {e}")

    def set_active_users(self, count: int):
        """Define número de usuários ativos"""
        if not self.enabled:
            return

        try:
            self.active_users.set(count)
        except Exception as e:
            logger.error(f"Erro ao definir usuários ativos: {e}")

    def record_user_registration(self):
        """Registra registro de usuário"""
        if not self.enabled:
            return

        try:
            self.user_registrations_total.inc()
        except Exception as e:
            logger.error(f"Erro ao registrar registro de usuário: {e}")

    def record_user_login(self, status: str):
        """Registra login de usuário"""
        if not self.enabled:
            return

        try:
            self.user_logins_total.labels(status=status).inc()
        except Exception as e:
            logger.error(f"Erro ao registrar login: {e}")

    def record_health_check(self, check_type: str, status: str, duration: float):
        """Registra verificação de saúde"""
        if not self.enabled:
            return

        try:
            self.health_checks_total.labels(check_type=check_type, status=status).inc()
            self.health_check_duration_seconds.labels(check_type=check_type).observe(duration)
        except Exception as e:
            logger.error(f"Erro ao registrar verificação de saúde: {e}")

    def record_ai_request(self, ai_type: str, status: str, response_time: float):
        """Registra requisição para IA"""
        if not self.enabled:
            return

        try:
            self.ai_requests_total.labels(ai_type=ai_type, status=status).inc()
            self.ai_response_time_seconds.labels(ai_type=ai_type).observe(response_time)
        except Exception as e:
            logger.error(f"Erro ao registrar requisição de IA: {e}")

    def record_payment_request(self, payment_method: str, status: str, amount: float):
        """Registra requisição de pagamento"""
        if not self.enabled:
            return

        try:
            self.payment_requests_total.labels(payment_method=payment_method, status=status).inc()
            self.payment_amount_total.labels(payment_method=payment_method, status=status).inc(amount)
        except Exception as e:
            logger.error(f"Erro ao registrar pagamento: {e}")

    def set_system_metrics(self, memory_bytes: int, cpu_percent: float, disk_percent: float):
        """Define métricas do sistema"""
        if not self.enabled:
            return

        try:
            self.system_memory_bytes.set(memory_bytes)
            self.system_cpu_percent.set(cpu_percent)
            self.system_disk_usage_percent.set(disk_percent)
        except Exception as e:
            logger.error(f"Erro ao definir métricas do sistema: {e}")

    def get_metrics(self) -> str:
        """Retorna métricas no formato Prometheus"""
        if not self.enabled:
            return "# Métricas desabilitadas - Prometheus não disponível"

        try:
            return generate_latest(self.registry)
        except Exception as e:
            logger.error(f"Erro ao gerar métricas: {e}")
            return f"# Erro ao gerar métricas: {e}"


# Instância global do coletor
metrics_collector = MetricsCollector()

# Decorators para facilitar o uso
def track_http_request(endpoint: str = None):
    """Decorator para rastrear requisições HTTP"""
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            start_time = time.time()

            try:
                result = func(*args, **kwargs)
                status = 200
                return result
            except Exception as e:
                status = 500
                raise
            finally:
                duration = time.time() - start_time
                ep = endpoint or func.__name__
                metrics_collector.record_http_request(
                    method="GET",  # Assumindo GET, pode ser melhorado
                    endpoint=ep,
                    status=status,
                    duration=duration
                )

        return wrapper
    return decorator


def track_db_query(operation: str, table: str):
    """Decorator para rastrear queries no banco"""
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            start_time = time.time()

            try:
                result = func(*args, **kwargs)
                return result
            finally:
                duration = time.time() - start_time
                metrics_collector.record_db_query(operation, table, duration)

        return wrapper
    return decorator


def track_cache_operation(cache_type: str):
    """Decorator para rastrear operações de cache"""
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            try:
                result = func(*args, **kwargs)
                if result is not None:
                    metrics_collector.record_cache_hit(cache_type)
                else:
                    metrics_collector.record_cache_miss(cache_type)
                return result
            except Exception as e:
                metrics_collector.record_cache_miss(cache_type)
                raise

        return wrapper
    return decorator


def track_queue_task(queue_name: str):
    """Decorator para rastrear tarefas da fila"""
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            start_time = time.time()

            try:
                result = func(*args, **kwargs)
                status = "success"
                return result
            except Exception as e:
                status = "failed"
                raise
            finally:
                duration = time.time() - start_time
                metrics_collector.record_queue_task(queue_name, status)
                metrics_collector.record_queue_task_duration(queue_name, duration)

        return wrapper
    return decorator


# Exemplo de uso
if __name__ == "__main__":
    # Testa o sistema de métricas
    collector = MetricsCollector()

    # Simula algumas métricas
    collector.record_http_request("GET", "/api/health", 200, 0.1)
    collector.record_db_query("SELECT", "users", 0.05)
    collector.record_cache_hit("redis")
    collector.set_active_users(150)

    # Gera métricas
    metrics = collector.get_metrics()
    print("Métricas geradas:")
    print(metrics)
