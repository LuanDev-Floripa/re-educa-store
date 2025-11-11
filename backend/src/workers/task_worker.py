"""
Worker para Processamento de Tarefas Assíncronas RE-EDUCA Store.

Processa tarefas enfileiradas pelo sistema de filas Redis.
Executa tarefas em background de forma assíncrona.

Uso:
    python -m workers.task_worker --queue payments --workers 4
"""

import argparse
import importlib
import logging
import time
from datetime import datetime
from typing import Any, Dict

from services.queue_service import QueueNames, queue_service

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")


class TaskWorker:
    """
    Worker para processar tarefas assíncronas enfileiradas.

    Worker completo para processar tarefas do sistema de filas de forma assíncrona.
    """

    def __init__(self, queue_name: str = "default", workers: int = 1):
        """
        Inicializa o worker.

        Args:
            queue_name: Nome da fila a processar
            workers: Número de workers paralelos (atualmente 1, pode ser expandido)
        """
        self.queue_name = queue_name
        self.workers = workers
        self.running = False
        self.processed_count = 0
        self.failed_count = 0
        self.start_time = datetime.now()

    def execute_task(self, task: Dict[str, Any]) -> bool:
        """
        Executa uma tarefa enfileirada.

        Args:
            task: Dados da tarefa contendo function_name, module, args, kwargs

        Returns:
            True se executada com sucesso, False caso contrário
        """
        try:
            task_data = task.get("data", {})
            function_name = task_data.get("function_name")
            module_name = task_data.get("module")
            args = task_data.get("args", [])
            kwargs = task_data.get("kwargs", {})

            if not function_name or not module_name:
                logger.error(f"Tarefa inválida: falta function_name ou module: {task}")
                return False

            # Importa o módulo
            try:
                module = importlib.import_module(module_name)
            except ImportError as e:
                logger.error(f"Erro ao importar módulo {module_name}: {e}")
                return False

            # Obtém a função
            if not hasattr(module, function_name):
                logger.error(f"Função {function_name} não encontrada no módulo {module_name}")
                return False

            func = getattr(module, function_name)

            # Se a função foi decorada, obtém a função original
            if hasattr(func, "_original_function"):
                func = func._original_function

            # Executa a função
            logger.info(f"Executando tarefa: {function_name} com args={args}, kwargs={kwargs}")
            result = func(*args, **kwargs)
            logger.info(f"Tarefa {function_name} executada com sucesso. Resultado: {result}")

            return True

        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            logger.error(f"Erro ao executar tarefa {task.get('id', 'unknown')}: {e}", exc_info=True)
            return False

    def process_queue(self):
        """Processa continuamente a fila de tarefas."""
        if not queue_service.is_connected():
            logger.error("Redis não está conectado. Worker não pode processar tarefas.")
            return

        self.running = True
        logger.info(f"Worker iniciado para fila: {self.queue_name}")

        while self.running:
            try:
                # Tenta obter uma tarefa da fila
                task = queue_service.dequeue_task(self.queue_name, priority=1)

                if task:
                    # Executa a tarefa
                    success = self.execute_task(task)

                    if success:
                        self.processed_count += 1
                        logger.info(f"Tarefa {task.get('id', 'unknown')} processada com sucesso")
                    else:
                        self.failed_count += 1
                        # Tenta fazer retry
                        queue_service.retry_failed_task(self.queue_name, task)
                        logger.warning(f"Tarefa {task.get('id', 'unknown')} falhou, será retentada")
                else:
                    # Não há tarefas, aguarda um pouco
                    time.sleep(1)

            except KeyboardInterrupt:
                logger.info("Worker interrompido pelo usuário")
                self.running = False
                break
            except (ValueError, KeyError) as e:
                logger.warning(f"Erro de validação: {str(e)}")
                # Tratamento específico pode ser adicionado aqui
            except Exception as e:
                logger.error(f"Erro no loop de processamento: {e}", exc_info=True)
                time.sleep(5)  # Aguarda antes de tentar novamente

        # Estatísticas finais
        runtime = (datetime.now() - self.start_time).total_seconds()
        logger.info(
            f"""
        Worker finalizado:
        - Tarefas processadas: {self.processed_count}
        - Tarefas falhadas: {self.failed_count}
        - Tempo de execução: {runtime:.2f}s
        """
        )

    def stop(self):
        """Para o worker."""
        self.running = False
        logger.info("Parando worker...")


def main():
    """Função principal para executar o worker via linha de comando."""
    parser = argparse.ArgumentParser(description="Worker para processar tarefas assíncronas")
    parser.add_argument("--queue", type=str, default="default", help="Nome da fila a processar (padrão: default)")
    parser.add_argument("--workers", type=int, default=1, help="Número de workers paralelos (padrão: 1)")

    args = parser.parse_args()

    # Valida nome da fila
    valid_queues = [
        QueueNames.PAYMENTS,
        QueueNames.HEALTH_ANALYSIS,
        QueueNames.NOTIFICATIONS,
        QueueNames.REPORTS,
        QueueNames.AI_PROCESSING,
        QueueNames.DATA_SYNC,
        "default",
    ]

    if args.queue not in valid_queues:
        logger.warning(f"Fila {args.queue} não está na lista de filas válidas, mas continuando...")

    # Cria e inicia o worker
    worker = TaskWorker(queue_name=args.queue, workers=args.workers)

    try:
        worker.process_queue()
    except KeyboardInterrupt:
        worker.stop()


if __name__ == "__main__":
    main()
