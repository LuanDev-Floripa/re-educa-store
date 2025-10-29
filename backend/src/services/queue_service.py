"""
Serviço de Filas Redis para Processamento Assíncrono
RE-EDUCA - Sistema de Educação em Saúde
"""

import redis
import json
import logging
from typing import Dict, Any, Optional, Callable
from datetime import datetime, timedelta
from functools import wraps
import time

logger = logging.getLogger(__name__)

class RedisQueueService:
    """Serviço de filas Redis para processamento assíncrono"""
    
    def __init__(self, redis_url: str = "redis://localhost:6379"):
        """Inicializa o serviço de filas"""
        try:
            self.redis_client = redis.from_url(redis_url)
            self.redis_client.ping()  # Testa conexão
            logger.info("Conexão com Redis estabelecida com sucesso")
        except Exception as e:
            logger.error(f"Erro ao conectar com Redis: {e}")
            self.redis_client = None
    
    def is_connected(self) -> bool:
        """Verifica se está conectado ao Redis"""
        return self.redis_client is not None
    
    def enqueue_task(self, queue_name: str, task_data: Dict[str, Any], 
                    priority: int = 0, delay: int = 0) -> bool:
        """
        Adiciona uma tarefa à fila
        
        Args:
            queue_name: Nome da fila
            task_data: Dados da tarefa
            priority: Prioridade (0 = baixa, 1 = normal, 2 = alta)
            delay: Delay em segundos antes de processar
            
        Returns:
            bool: True se a tarefa foi adicionada com sucesso
        """
        if not self.is_connected():
            logger.error("Redis não está conectado")
            return False
        
        try:
            task = {
                'id': f"{queue_name}_{int(time.time() * 1000)}",
                'data': task_data,
                'priority': priority,
                'created_at': datetime.utcnow().isoformat(),
                'attempts': 0,
                'max_attempts': 3
            }
            
            if delay > 0:
                # Tarefa com delay (usando sorted set)
                score = time.time() + delay
                self.redis_client.zadd(f"{queue_name}_delayed", {json.dumps(task): score})
                logger.info(f"Tarefa adicionada à fila {queue_name} com delay de {delay}s")
            else:
                # Tarefa imediata (usando list com prioridade)
                priority_key = f"{queue_name}_priority_{priority}"
                self.redis_client.lpush(priority_key, json.dumps(task))
                logger.info(f"Tarefa adicionada à fila {queue_name} com prioridade {priority}")
            
            return True
            
        except Exception as e:
            logger.error(f"Erro ao adicionar tarefa à fila {queue_name}: {e}")
            return False
    
    def dequeue_task(self, queue_name: str, priority: int = 1) -> Optional[Dict[str, Any]]:
        """
        Remove e retorna a próxima tarefa da fila
        
        Args:
            queue_name: Nome da fila
            priority: Prioridade a processar (0 = baixa, 1 = normal, 2 = alta)
            
        Returns:
            Dict com dados da tarefa ou None se não houver tarefas
        """
        if not self.is_connected():
            return None
        
        try:
            # Primeiro, verifica tarefas com delay
            delayed_tasks = self.redis_client.zrangebyscore(
                f"{queue_name}_delayed", 
                0, 
                time.time()
            )
            
            if delayed_tasks:
                # Move tarefas com delay para fila de prioridade
                for task_json in delayed_tasks:
                    task = json.loads(task_json)
                    priority_key = f"{queue_name}_priority_{task['priority']}"
                    self.redis_client.lpush(priority_key, task_json)
                    self.redis_client.zrem(f"{queue_name}_delayed", task_json)
                    logger.info(f"Tarefa movida da fila de delay para prioridade {task['priority']}")
            
            # Processa por prioridade (alta -> normal -> baixa)
            priorities = [2, 1, 0] if priority == 1 else [priority]
            
            for p in priorities:
                priority_key = f"{queue_name}_priority_{p}"
                task_json = self.redis_client.rpop(priority_key)
                
                if task_json:
                    task = json.loads(task_json)
                    logger.info(f"Tarefa removida da fila {queue_name} com prioridade {p}")
                    return task
            
            return None
            
        except Exception as e:
            logger.error(f"Erro ao remover tarefa da fila {queue_name}: {e}")
            return None
    
    def get_queue_stats(self, queue_name: str) -> Dict[str, Any]:
        """
        Retorna estatísticas da fila
        
        Args:
            queue_name: Nome da fila
            
        Returns:
            Dict com estatísticas da fila
        """
        if not self.is_connected():
            return {}
        
        try:
            stats = {}
            
            # Conta tarefas por prioridade
            for priority in [0, 1, 2]:
                priority_key = f"{queue_name}_priority_{priority}"
                count = self.redis_client.llen(priority_key)
                stats[f"priority_{priority}"] = count
            
            # Conta tarefas com delay
            delayed_count = self.redis_client.zcard(f"{queue_name}_delayed")
            stats["delayed"] = delayed_count
            
            # Total de tarefas
            stats["total"] = sum(stats.get(f"priority_{p}", 0) for p in [0, 1, 2]) + delayed_count
            
            return stats
            
        except Exception as e:
            logger.error(f"Erro ao obter estatísticas da fila {queue_name}: {e}")
            return {}
    
    def clear_queue(self, queue_name: str) -> bool:
        """
        Limpa todas as tarefas de uma fila
        
        Args:
            queue_name: Nome da fila
            
        Returns:
            bool: True se a fila foi limpa com sucesso
        """
        if not self.is_connected():
            return False
        
        try:
            # Remove tarefas por prioridade
            for priority in [0, 1, 2]:
                priority_key = f"{queue_name}_priority_{priority}"
                self.redis_client.delete(priority_key)
            
            # Remove tarefas com delay
            self.redis_client.delete(f"{queue_name}_delayed")
            
            logger.info(f"Fila {queue_name} limpa com sucesso")
            return True
            
        except Exception as e:
            logger.error(f"Erro ao limpar fila {queue_name}: {e}")
            return False
    
    def retry_failed_task(self, queue_name: str, task: Dict[str, Any]) -> bool:
        """
        Recoloca uma tarefa falhada na fila para retry
        
        Args:
            queue_name: Nome da fila
            task: Dados da tarefa
            
        Returns:
            bool: True se a tarefa foi recolocada com sucesso
        """
        if not self.is_connected():
            return False
        
        try:
            task['attempts'] += 1
            
            if task['attempts'] >= task['max_attempts']:
                # Tarefa falhou demais, move para fila de falhas
                self.redis_client.lpush(f"{queue_name}_failed", json.dumps(task))
                logger.warning(f"Tarefa {task['id']} movida para fila de falhas após {task['attempts']} tentativas")
                return False
            
            # Recoloca na fila com delay exponencial
            delay = min(60 * (2 ** task['attempts']), 3600)  # Max 1 hora
            return self.enqueue_task(queue_name, task['data'], task['priority'], delay)
            
        except Exception as e:
            logger.error(f"Erro ao fazer retry da tarefa {task.get('id', 'unknown')}: {e}")
            return False

# Decorator para tarefas assíncronas
def async_task(queue_name: str, priority: int = 1, delay: int = 0):
    """
    Decorator para executar funções como tarefas assíncronas
    
    Args:
        queue_name: Nome da fila
        priority: Prioridade da tarefa
        delay: Delay em segundos
    """
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        def wrapper(*args, **kwargs):
            # Executa a função normalmente
            return func(*args, **kwargs)
        
        # Adiciona metadados para execução assíncrona
        wrapper.is_async_task = True
        wrapper.queue_name = queue_name
        wrapper.priority = priority
        wrapper.delay = delay
        
        return wrapper
    return decorator

# Instância global do serviço
queue_service = RedisQueueService()

# Filas predefinidas
class QueueNames:
    """Nomes das filas do sistema"""
    PAYMENTS = "payments"
    HEALTH_ANALYSIS = "health_analysis"
    NOTIFICATIONS = "notifications"
    REPORTS = "reports"
    AI_PROCESSING = "ai_processing"
    DATA_SYNC = "data_sync"

# Exemplos de uso
if __name__ == "__main__":
    # Teste do serviço
    service = RedisQueueService()
    
    if service.is_connected():
        # Adiciona tarefas de teste
        service.enqueue_task(
            QueueNames.PAYMENTS,
            {"user_id": "123", "amount": 99.90, "method": "pix"},
            priority=2
        )
        
        service.enqueue_task(
            QueueNames.HEALTH_ANALYSIS,
            {"user_id": "456", "data_type": "imc", "value": 25.5},
            priority=1,
            delay=10
        )
        
        # Mostra estatísticas
        stats = service.get_queue_stats(QueueNames.PAYMENTS)
        print(f"Estatísticas da fila de pagamentos: {stats}")
        
        # Processa uma tarefa
        task = service.dequeue_task(QueueNames.PAYMENTS)
        if task:
            print(f"Tarefa processada: {task}")
    else:
        print("Redis não está disponível")