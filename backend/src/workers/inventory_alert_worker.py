# -*- coding: utf-8 -*-
"""
Worker para Verificação Periódica de Estoque RE-EDUCA Store.

Verifica produtos com estoque baixo periodicamente e envia alertas.
Executa em background de forma contínua.
"""
import logging
import signal
import time
from datetime import datetime

from services.inventory_service import InventoryService

logger = logging.getLogger(__name__)


class InventoryAlertWorker:
    """
    Worker para verificação periódica de estoque baixo.
    
    Verifica estoque a cada intervalo configurado e envia alertas quando necessário.
    """

    def __init__(self, check_interval: int = 3600):
        """
        Inicializa o worker de alertas de estoque.

        Args:
            check_interval: Intervalo entre verificações em segundos (padrão: 1 hora)
        """
        self.check_interval = check_interval
        self.inventory_service = InventoryService()
        self.running = False
        self.last_check = None
        self.total_checks = 0
        self.total_alerts_sent = 0

        # Configura signal handlers para graceful shutdown
        signal.signal(signal.SIGINT, self._signal_handler)
        signal.signal(signal.SIGTERM, self._signal_handler)

    def _signal_handler(self, signum, frame):
        """Handler para signals de shutdown"""
        logger.info(f"InventoryAlertWorker recebeu signal {signum}, iniciando shutdown...")
        self.stop()

    def start(self):
        """Inicia o worker de verificação de estoque"""
        logger.info(f"InventoryAlertWorker iniciando (intervalo: {self.check_interval}s)")
        self.running = True

        try:
            while self.running:
                self._check_stock_and_send_alerts()
                self.last_check = datetime.utcnow()

                # Aguardar próximo intervalo
                if self.running:
                    time.sleep(self.check_interval)

        except KeyboardInterrupt:
            logger.info("InventoryAlertWorker interrompido pelo usuário")
        except Exception as e:
            logger.error(f"Erro no InventoryAlertWorker: {e}", exc_info=True)
        finally:
            self.stop()

    def stop(self):
        """Para o worker"""
        logger.info("InventoryAlertWorker parando...")
        self.running = False

    def _check_stock_and_send_alerts(self):
        """Verifica estoque e envia alertas se necessário"""
        try:
            logger.info("Verificando estoque baixo...")
            self.total_checks += 1

            # Verificar e enviar alertas (usa threshold padrão de 10)
            result = self.inventory_service.check_and_send_low_stock_alerts(threshold=10)

            if result.get("success"):
                alerts_sent = result.get("alerts_sent", 0)
                products_checked = result.get("products_checked", 0)

                if alerts_sent > 0:
                    self.total_alerts_sent += alerts_sent
                    logger.warning(
                        f"⚠️ {alerts_sent} alerta(s) de estoque baixo enviado(s) para {products_checked} produto(s) verificado(s)"
                    )
                else:
                    logger.info(f"✓ Verificação concluída: {products_checked} produtos verificados, nenhum alerta necessário")
            else:
                logger.error(f"Erro ao verificar estoque: {result.get('error')}")

        except Exception as e:
            logger.error(f"Erro ao verificar estoque e enviar alertas: {e}", exc_info=True)

    def get_stats(self) -> dict:
        """Retorna estatísticas do worker"""
        return {
            "worker_id": "inventory_alert_worker",
            "running": self.running,
            "check_interval": self.check_interval,
            "total_checks": self.total_checks,
            "total_alerts_sent": self.total_alerts_sent,
            "last_check": self.last_check.isoformat() if self.last_check else None,
        }

    def run_once(self) -> dict:
        """
        Executa uma única verificação (útil para testes ou execução manual).

        Returns:
            Dict com resultado da verificação
        """
        logger.info("Executando verificação única de estoque...")
        result = self.inventory_service.check_and_send_low_stock_alerts(threshold=10)
        self.last_check = datetime.utcnow()
        self.total_checks += 1

        if result.get("success") and result.get("alerts_sent", 0) > 0:
            self.total_alerts_sent += result.get("alerts_sent", 0)

        return result


# Instância singleton (pode ser usado como worker standalone)
inventory_alert_worker = InventoryAlertWorker()


if __name__ == "__main__":
    # Execução direta do worker
    import sys

    check_interval = int(sys.argv[1]) if len(sys.argv) > 1 else 3600  # Padrão: 1 hora

    logging.basicConfig(
        level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    )

    worker = InventoryAlertWorker(check_interval=check_interval)
    worker.start()
