"""
Serviço de Monitoramento e Logs RE-EDUCA Store.

Gerencia monitoramento do sistema incluindo:
- Métricas de CPU, memória e disco
- Performance de endpoints
- Alertas automáticos
- Health checks
- Logs estruturados
- Integração com Prometheus/Grafana
"""

import logging
import time
import psutil
import json
from datetime import datetime, timedelta
from typing import Dict, List, Optional
from functools import wraps
from services.cache_service import cache_service
from config.database import supabase_client

logger = logging.getLogger(__name__)

class MonitoringService:
    """Service para monitoramento de métricas e performance."""
    
    def __init__(self):
        """Inicializa o serviço de monitoramento."""
        self.supabase = supabase_client
        self.metrics = {}
        self.alerts = []
        self.start_time = datetime.now()
        
    def get_system_metrics(self) -> Dict:
        """
        Obtém métricas do sistema.
        
        Returns:
            Dict: Métricas de CPU, memória, disco e rede.
        """
        try:
            # Métricas de CPU
            cpu_percent = psutil.cpu_percent(interval=1)
            cpu_count = psutil.cpu_count()
            
            # Métricas de memória
            memory = psutil.virtual_memory()
            memory_percent = memory.percent
            memory_available = memory.available
            memory_total = memory.total
            
            # Métricas de disco
            disk = psutil.disk_usage('/')
            disk_percent = disk.percent
            disk_free = disk.free
            disk_total = disk.total
            
            # Métricas de rede
            network = psutil.net_io_counters()
            
            return {
                'timestamp': datetime.now().isoformat(),
                'cpu': {
                    'percent': cpu_percent,
                    'count': cpu_count
                },
                'memory': {
                    'percent': memory_percent,
                    'available_bytes': memory_available,
                    'total_bytes': memory_total,
                    'available_gb': round(memory_available / (1024**3), 2),
                    'total_gb': round(memory_total / (1024**3), 2)
                },
                'disk': {
                    'percent': disk_percent,
                    'free_bytes': disk_free,
                    'total_bytes': disk_total,
                    'free_gb': round(disk_free / (1024**3), 2),
                    'total_gb': round(disk_total / (1024**3), 2)
                },
                'network': {
                    'bytes_sent': network.bytes_sent,
                    'bytes_recv': network.bytes_recv,
                    'packets_sent': network.packets_sent,
                    'packets_recv': network.packets_recv
                }
            }
            
        except Exception as e:
            logger.error(f"Erro ao obter métricas do sistema: {e}")
            return {}
    
    def get_application_metrics(self) -> Dict:
        """Obtém métricas da aplicação"""
        try:
            # Uptime da aplicação
            uptime = datetime.now() - self.start_time
            
            # Métricas do banco de dados
            db_metrics = self._get_database_metrics()
            
            # Métricas do Redis
            redis_metrics = cache_service.get_stats()
            
            # Métricas de WebSocket
            ws_metrics = self._get_websocket_metrics()
            
            return {
                'timestamp': datetime.now().isoformat(),
                'uptime_seconds': int(uptime.total_seconds()),
                'uptime_human': str(uptime).split('.')[0],
                'database': db_metrics,
                'redis': redis_metrics,
                'websocket': ws_metrics
            }
            
        except Exception as e:
            logger.error(f"Erro ao obter métricas da aplicação: {e}")
            return {}
    
    def _get_database_metrics(self) -> Dict:
        """Obtém métricas do banco de dados"""
        try:
            # Contagem de registros por tabela usando Supabase
            tables = [
                'users', 'posts', 'live_streams', 'video_uploads',
                'stream_viewers', 'stream_messages', 'stream_gifts'
            ]
            
            table_counts = {}
            for table in tables:
                try:
                    result = self.supabase.table(table).select('id', count='exact').limit(0).execute()
                    # Supabase retorna count no atributo count se disponível
                    count = result.count if hasattr(result, 'count') else len(result.data) if result.data else 0
                    table_counts[table] = count
                except Exception as e:
                    logger.warning(f"Erro ao contar registros da tabela {table}: {e}")
                    table_counts[table] = 0
            
            # Para Supabase, não temos acesso direto a pg_stat_activity
            # Podemos usar uma aproximação ou deixar como 0
            active_connections = 0
            
            return {
                'table_counts': table_counts,
                'active_connections': active_connections,
                'status': 'connected'
            }
            
        except Exception as e:
            logger.error(f"Erro ao obter métricas do banco: {e}")
            return {
                'table_counts': {},
                'active_connections': 0,
                'status': 'error'
            }
    
    def _get_websocket_metrics(self) -> Dict:
        """Obtém métricas do WebSocket"""
        try:
            # Aqui você pode implementar métricas específicas do WebSocket
            # Por exemplo, número de conexões ativas, mensagens por segundo, etc.
            return {
                'active_connections': 0,  # Implementar contagem real
                'messages_per_second': 0,  # Implementar contagem real
                'status': 'active'
            }
            
        except Exception as e:
            logger.error(f"Erro ao obter métricas do WebSocket: {e}")
            return {
                'active_connections': 0,
                'messages_per_second': 0,
                'status': 'error'
            }
    
    def get_performance_metrics(self) -> Dict:
        """Obtém métricas de performance"""
        try:
            # Métricas de resposta de API
            api_metrics = self._get_api_metrics()
            
            # Métricas de cache
            cache_metrics = self._get_cache_metrics()
            
            return {
                'timestamp': datetime.now().isoformat(),
                'api': api_metrics,
                'cache': cache_metrics
            }
            
        except Exception as e:
            logger.error(f"Erro ao obter métricas de performance: {e}")
            return {}
    
    def _get_api_metrics(self) -> Dict:
        """Obtém métricas de API"""
        try:
            # Implementar coleta de métricas de API
            # Por exemplo, tempo de resposta, número de requisições, etc.
            return {
                'avg_response_time_ms': 0,
                'requests_per_minute': 0,
                'error_rate': 0
            }
            
        except Exception as e:
            logger.error(f"Erro ao obter métricas de API: {e}")
            return {}
    
    def _get_cache_metrics(self) -> Dict:
        """Obtém métricas de cache"""
        try:
            redis_stats = cache_service.get_stats()
            return {
                'hit_rate': self._calculate_cache_hit_rate(redis_stats),
                'memory_usage': redis_stats.get('used_memory', '0B'),
                'connected_clients': redis_stats.get('connected_clients', 0)
            }
            
        except Exception as e:
            logger.error(f"Erro ao obter métricas de cache: {e}")
            return {}
    
    def _calculate_cache_hit_rate(self, redis_stats: Dict) -> float:
        """Calcula taxa de hit do cache"""
        try:
            hits = redis_stats.get('keyspace_hits', 0)
            misses = redis_stats.get('keyspace_misses', 0)
            total = hits + misses
            
            if total == 0:
                return 0.0
            
            return round((hits / total) * 100, 2)
            
        except Exception as e:
            logger.error(f"Erro ao calcular hit rate do cache: {e}")
            return 0.0
    
    def check_alerts(self) -> List[Dict]:
        """Verifica alertas do sistema"""
        try:
            alerts = []
            system_metrics = self.get_system_metrics()
            
            # Alerta de CPU alta
            if system_metrics.get('cpu', {}).get('percent', 0) > 80:
                alerts.append({
                    'type': 'cpu_high',
                    'message': f"CPU usage is {system_metrics['cpu']['percent']}%",
                    'severity': 'warning',
                    'timestamp': datetime.now().isoformat()
                })
            
            # Alerta de memória alta
            if system_metrics.get('memory', {}).get('percent', 0) > 85:
                alerts.append({
                    'type': 'memory_high',
                    'message': f"Memory usage is {system_metrics['memory']['percent']}%",
                    'severity': 'warning',
                    'timestamp': datetime.now().isoformat()
                })
            
            # Alerta de disco cheio
            if system_metrics.get('disk', {}).get('percent', 0) > 90:
                alerts.append({
                    'type': 'disk_full',
                    'message': f"Disk usage is {system_metrics['disk']['percent']}%",
                    'severity': 'critical',
                    'timestamp': datetime.now().isoformat()
                })
            
            # Alerta de Redis indisponível
            if not cache_service.is_available():
                alerts.append({
                    'type': 'redis_down',
                    'message': 'Redis cache is not available',
                    'severity': 'critical',
                    'timestamp': datetime.now().isoformat()
                })
            
            return alerts
            
        except Exception as e:
            logger.error(f"Erro ao verificar alertas: {e}")
            return []
    
    def log_metric(self, metric_name: str, value: float, tags: Dict = None):
        """Registra métrica personalizada"""
        try:
            metric = {
                'name': metric_name,
                'value': value,
                'tags': tags or {},
                'timestamp': datetime.now().isoformat()
            }
            
            # Armazenar no cache para acesso rápido
            cache_key = f"metric:{metric_name}:{datetime.now().strftime('%Y%m%d%H%M')}"
            cache_service.set(cache_key, metric, ttl=3600)
            
            logger.info(f"Métrica registrada: {metric_name} = {value}")
            
        except Exception as e:
            logger.error(f"Erro ao registrar métrica: {e}")
    
    def get_health_status(self) -> Dict:
        """Obtém status geral de saúde da aplicação"""
        try:
            system_metrics = self.get_system_metrics()
            app_metrics = self.get_application_metrics()
            alerts = self.check_alerts()
            
            # Determinar status geral
            status = 'healthy'
            if any(alert['severity'] == 'critical' for alert in alerts):
                status = 'critical'
            elif any(alert['severity'] == 'warning' for alert in alerts):
                status = 'warning'
            
            return {
                'status': status,
                'timestamp': datetime.now().isoformat(),
                'system': system_metrics,
                'application': app_metrics,
                'alerts': alerts,
                'uptime': app_metrics.get('uptime_seconds', 0)
            }
            
        except Exception as e:
            logger.error(f"Erro ao obter status de saúde: {e}")
            return {
                'status': 'error',
                'timestamp': datetime.now().isoformat(),
                'error': str(e)
            }

# Instância global do serviço de monitoramento
monitoring_service = MonitoringService()

def monitor_performance(func_name: str = None):
    """Decorator para monitorar performance de funções"""
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            start_time = time.time()
            function_name = func_name or func.__name__
            
            try:
                result = func(*args, **kwargs)
                execution_time = time.time() - start_time
                
                # Registrar métrica de performance
                monitoring_service.log_metric(
                    f"function_execution_time",
                    execution_time,
                    {'function': function_name}
                )
                
                return result
                
            except Exception as e:
                execution_time = time.time() - start_time
                
                # Registrar métrica de erro
                monitoring_service.log_metric(
                    f"function_error",
                    1,
                    {'function': function_name, 'error': str(e)}
                )
                
                raise e
                
        return wrapper
    return decorator

def log_api_call(endpoint: str, method: str, status_code: int, response_time: float):
    """Registra chamada de API"""
    try:
        monitoring_service.log_metric(
            "api_call",
            response_time,
            {
                'endpoint': endpoint,
                'method': method,
                'status_code': status_code
            }
        )
    except Exception as e:
        logger.error(f"Erro ao registrar chamada de API: {e}")

def log_websocket_event(event_type: str, user_id: str = None):
    """Registra evento de WebSocket"""
    try:
        monitoring_service.log_metric(
            "websocket_event",
            1,
            {
                'event_type': event_type,
                'user_id': user_id
            }
        )
    except Exception as e:
        logger.error(f"Erro ao registrar evento WebSocket: {e}")
