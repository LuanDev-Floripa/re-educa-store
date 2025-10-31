"""
Worker para Processamento de Tarefas das Filas Redis RE-EDUCA Store.

Processa tarefas assíncronas em background incluindo:
- Pagamentos e transações
- Análises de saúde
- Envio de notificações
- Geração de relatórios
- Processamento de IA
- Sincronização de dados

Suporta:
- Múltiplas filas simultâneas
- Retry automático com backoff
- Graceful shutdown
- Monitoramento de performance
- Handlers customizáveis por tipo de tarefa
"""

import time
import json
import logging
import threading
from typing import Dict, Any, Optional, Callable
from datetime import datetime
import signal
import sys

from services.queue_service import RedisQueueService, QueueNames

logger = logging.getLogger(__name__)

class QueueWorker:
    """
    Worker para processar tarefas das filas Redis.
    
    Processa tarefas de forma assíncrona com retry e logging.
    
    Attributes:
        worker_id (str): ID único do worker.
        running (bool): Flag de execução.
        processed_tasks (int): Contador de tarefas processadas.
        failed_tasks (int): Contador de tarefas falhadas.
    """
    
    def __init__(self, worker_id: str = None):
        """
        Inicializa o worker.
        
        Args:
            worker_id (str, optional): ID do worker (gerado se não fornecido).
        """
        self.worker_id = worker_id or f"worker_{int(time.time())}"
        self.queue_service = RedisQueueService()
        self.running = False
        self.processed_tasks = 0
        self.failed_tasks = 0
        self.task_handlers = {}
        
        # Configura handlers de tarefas
        self._setup_task_handlers()
        
        # Configura signal handlers para graceful shutdown
        signal.signal(signal.SIGINT, self._signal_handler)
        signal.signal(signal.SIGTERM, self._signal_handler)
    
    def _signal_handler(self, signum, frame):
        """Handler para signals de shutdown"""
        logger.info(f"Worker {self.worker_id} recebeu signal {signum}, iniciando shutdown...")
        self.stop()
    
    def _setup_task_handlers(self):
        """Configura handlers para diferentes tipos de tarefas"""
        self.task_handlers = {
            QueueNames.PAYMENTS: self._handle_payment_task,
            QueueNames.HEALTH_ANALYSIS: self._handle_health_analysis_task,
            QueueNames.NOTIFICATIONS: self._handle_notification_task,
            QueueNames.REPORTS: self._handle_report_task,
            QueueNames.AI_PROCESSING: self._handle_ai_processing_task,
            QueueNames.DATA_SYNC: self._handle_data_sync_task
        }
    
    def register_task_handler(self, queue_name: str, handler: Callable):
        """Registra um handler customizado para uma fila"""
        self.task_handlers[queue_name] = handler
        logger.info(f"Handler customizado registrado para fila {queue_name}")
    
    def start(self, queues: list = None, poll_interval: float = 1.0):
        """
        Inicia o worker
        
        Args:
            queues: Lista de filas para monitorar (None = todas)
            poll_interval: Intervalo entre verificações em segundos
        """
        if not self.queue_service.is_connected():
            logger.error("Redis não está conectado, não é possível iniciar o worker")
            return
        
        if queues is None:
            queues = list(self.task_handlers.keys())
        
        logger.info(f"Worker {self.worker_id} iniciando para filas: {queues}")
        self.running = True
        
        try:
            while self.running:
                for queue_name in queues:
                    if not self.running:
                        break
                    
                    self._process_queue(queue_name)
                
                if self.running:
                    time.sleep(poll_interval)
                    
        except KeyboardInterrupt:
            logger.info("Worker interrompido pelo usuário")
        except Exception as e:
            logger.error(f"Erro no worker: {e}")
        finally:
            self.stop()
    
    def stop(self):
        """Para o worker"""
        logger.info(f"Worker {self.worker_id} parando...")
        self.running = False
    
    def _process_queue(self, queue_name: str):
        """Processa uma fila específica"""
        try:
            # Tenta processar tarefa de alta prioridade
            task = self.queue_service.dequeue_task(queue_name, priority=2)
            
            if not task:
                # Tenta processar tarefa de prioridade normal
                task = self.queue_service.dequeue_task(queue_name, priority=1)
            
            if not task:
                # Tenta processar tarefa de baixa prioridade
                task = self.queue_service.dequeue_task(queue_name, priority=0)
            
            if task:
                self._process_task(queue_name, task)
                
        except Exception as e:
            logger.error(f"Erro ao processar fila {queue_name}: {e}")
    
    def _process_task(self, queue_name: str, task: Dict[str, Any]):
        """Processa uma tarefa específica"""
        task_id = task.get('id', 'unknown')
        logger.info(f"Processando tarefa {task_id} da fila {queue_name}")
        
        try:
            # Executa o handler da tarefa
            handler = self.task_handlers.get(queue_name)
            if handler:
                result = handler(task)
                if result:
                    self.processed_tasks += 1
                    logger.info(f"Tarefa {task_id} processada com sucesso")
                else:
                    self._handle_task_failure(queue_name, task, "Handler retornou False")
            else:
                self._handle_task_failure(queue_name, task, f"Handler não encontrado para fila {queue_name}")
                
        except Exception as e:
            self._handle_task_failure(queue_name, task, str(e))
    
    def _handle_task_failure(self, queue_name: str, task: Dict[str, Any], error: str):
        """Trata falha de uma tarefa"""
        task_id = task.get('id', 'unknown')
        logger.error(f"Falha na tarefa {task_id}: {error}")
        
        # Tenta fazer retry
        if self.queue_service.retry_failed_task(queue_name, task):
            logger.info(f"Tarefa {task_id} recolocada na fila para retry")
        else:
            self.failed_tasks += 1
            logger.error(f"Tarefa {task_id} falhou definitivamente após {task.get('attempts', 0)} tentativas")
    
    def get_stats(self) -> Dict[str, Any]:
        """Retorna estatísticas do worker"""
        return {
            'worker_id': self.worker_id,
            'running': self.running,
            'processed_tasks': self.processed_tasks,
            'failed_tasks': self.failed_tasks,
            'uptime': getattr(self, '_start_time', 0)
        }
    
    # Handlers de tarefas específicas
    def _handle_payment_task(self, task: Dict[str, Any]) -> bool:
        """Processa tarefa de pagamento"""
        try:
            data = task['data']
            user_id = data.get('user_id')
            amount = data.get('amount')
            method = data.get('method')
            
            logger.info(f"Processando pagamento: {method} - R$ {amount} para usuário {user_id}")
            
            # Simula processamento de pagamento
            time.sleep(0.1)
            
            # Aqui você implementaria a lógica real de pagamento
            # Por exemplo, integração com gateway de pagamento
            
            return True
            
        except Exception as e:
            logger.error(f"Erro ao processar tarefa de pagamento: {e}")
            return False
    
    def _handle_health_analysis_task(self, task: Dict[str, Any]) -> bool:
        """Processa tarefa de análise de saúde"""
        try:
            data = task['data']
            user_id = data.get('user_id')
            data_type = data.get('data_type')
            value = data.get('value')
            
            logger.info(f"Analisando dados de saúde: {data_type} = {value} para usuário {user_id}")
            
            # Simula análise de dados
            time.sleep(0.2)
            
            # Aqui você implementaria a lógica real de análise
            # Por exemplo, cálculo de tendências, recomendações, etc.
            
            return True
            
        except Exception as e:
            logger.error(f"Erro ao processar tarefa de análise de saúde: {e}")
            return False
    
    def _handle_notification_task(self, task: Dict[str, Any]) -> bool:
        """Processa tarefa de notificação"""
        try:
            data = task['data']
            user_id = data.get('user_id')
            message = data.get('message')
            notification_type = data.get('type', 'info')
            
            logger.info(f"Enviando notificação {notification_type} para usuário {user_id}: {message}")
            
            # Simula envio de notificação
            time.sleep(0.1)
            
            # Aqui você implementaria a lógica real de notificação
            # Por exemplo, push notification, email, SMS, etc.
            
            return True
            
        except Exception as e:
            logger.error(f"Erro ao processar tarefa de notificação: {e}")
            return False
    
    def _handle_report_task(self, task: Dict[str, Any]) -> bool:
        """Processa tarefa de geração de relatório"""
        try:
            data = task['data']
            user_id = data.get('user_id')
            report_type = data.get('report_type')
            date_range = data.get('date_range')
            
            logger.info(f"Gerando relatório {report_type} para usuário {user_id} - período: {date_range}")
            
            # Simula geração de relatório
            time.sleep(0.5)
            
            # Aqui você implementaria a lógica real de geração de relatório
            # Por exemplo, consultas ao banco, agregações, formatação, etc.
            
            return True
            
        except Exception as e:
            logger.error(f"Erro ao processar tarefa de relatório: {e}")
            return False
    
    def _handle_ai_processing_task(self, task: Dict[str, Any]) -> bool:
        """Processa tarefa de IA"""
        try:
            data = task['data']
            user_id = data.get('user_id')
            ai_task = data.get('task')
            input_data = data.get('input')
            
            logger.info(f"Processando tarefa de IA {ai_task} para usuário {user_id}")
            
            # Simula processamento de IA
            time.sleep(0.3)
            
            # Aqui você implementaria a lógica real de IA
            # Por exemplo, análise de texto, geração de respostas, etc.
            
            return True
            
        except Exception as e:
            logger.error(f"Erro ao processar tarefa de IA: {e}")
            return False
    
    def _handle_data_sync_task(self, task: Dict[str, Any]) -> bool:
        """Processa tarefa de sincronização de dados"""
        try:
            data = task['data']
            sync_type = data.get('sync_type')
            source = data.get('source')
            target = data.get('target')
            
            logger.info(f"Sincronizando dados {sync_type} de {source} para {target}")
            
            # Simula sincronização
            time.sleep(0.4)
            
            # Aqui você implementaria a lógica real de sincronização
            # Por exemplo, sincronização entre sistemas, backup, etc.
            
            return True
            
        except Exception as e:
            logger.error(f"Erro ao processar tarefa de sincronização: {e}")
            return False

class WorkerManager:
    """Gerenciador de múltiplos workers"""
    
    def __init__(self):
        """Inicializa o gerenciador de workers"""
        self.workers = []
        self.threads = []
    
    def start_worker(self, worker_id: str = None, queues: list = None, 
                    poll_interval: float = 1.0) -> QueueWorker:
        """Inicia um novo worker em uma thread separada"""
        worker = QueueWorker(worker_id)
        
        def worker_thread():
            worker.start(queues, poll_interval)
        
        thread = threading.Thread(target=worker_thread, daemon=True)
        thread.start()
        
        self.workers.append(worker)
        self.threads.append(thread)
        
        logger.info(f"Worker {worker.worker_id} iniciado em thread separada")
        return worker
    
    def stop_all_workers(self):
        """Para todos os workers"""
        for worker in self.workers:
            worker.stop()
        
        for thread in self.threads:
            thread.join(timeout=5)
        
        logger.info("Todos os workers foram parados")
    
    def get_all_stats(self) -> Dict[str, Any]:
        """Retorna estatísticas de todos os workers"""
        return {
            'total_workers': len(self.workers),
            'workers': [worker.get_stats() for worker in self.workers]
        }

# Exemplo de uso
if __name__ == "__main__":
    # Configura logging
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    
    # Cria e inicia um worker
    worker = QueueWorker("test_worker")
    
    if worker.queue_service.is_connected():
        logger.info("Iniciando worker de teste...")
        worker.start(poll_interval=2.0)
    else:
        logger.error("Redis não está disponível, não é possível iniciar o worker")