#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script para iniciar o Worker de Alertas de Estoque RE-EDUCA Store.

Este script inicia o worker que verifica periodicamente produtos com estoque baixo
e envia alertas por email para administradores.

Uso:
    python scripts/start_inventory_alert_worker.py [--interval 3600]

Opções:
    --interval: Intervalo entre verificações em segundos (padrão: 3600 = 1 hora)
"""

import argparse
import logging
import os
import sys
from pathlib import Path

# Adiciona o diretório raiz ao path para imports
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

# Configura logging antes de importar módulos
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler("logs/inventory_alert_worker.log", encoding="utf-8"),
    ],
)

logger = logging.getLogger(__name__)


def main():
    """Função principal para iniciar o worker"""
    parser = argparse.ArgumentParser(
        description="Worker de Alertas de Estoque RE-EDUCA Store"
    )
    parser.add_argument(
        "--interval",
        type=int,
        default=3600,
        help="Intervalo entre verificações em segundos (padrão: 3600 = 1 hora)",
    )
    parser.add_argument(
        "--once",
        action="store_true",
        help="Executa uma única verificação e encerra",
    )

    args = parser.parse_args()

    # Valida intervalo
    if args.interval < 60:
        logger.error("Intervalo mínimo é 60 segundos (1 minuto)")
        sys.exit(1)

    try:
        from workers.inventory_alert_worker import InventoryAlertWorker

        logger.info("=" * 60)
        logger.info("🚀 Iniciando Worker de Alertas de Estoque")
        logger.info(f"⏱️  Intervalo: {args.interval} segundos ({args.interval / 60:.1f} minutos)")
        logger.info("=" * 60)

        worker = InventoryAlertWorker(check_interval=args.interval)

        if args.once:
            logger.info("Executando verificação única...")
            result = worker.run_once()
            if result.get("success"):
                logger.info(
                    f"✓ Verificação concluída: {result.get('alerts_sent', 0)} alerta(s) enviado(s)"
                )
            else:
                logger.error(f"✗ Erro na verificação: {result.get('error')}")
                sys.exit(1)
        else:
            # Inicia worker em modo contínuo
            worker.start()

    except KeyboardInterrupt:
        logger.info("\n⚠️  Worker interrompido pelo usuário")
        sys.exit(0)
    except Exception as e:
        logger.error(f"❌ Erro ao iniciar worker: {e}", exc_info=True)
        sys.exit(1)


if __name__ == "__main__":
    main()
