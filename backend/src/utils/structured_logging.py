# -*- coding: utf-8 -*-
"""
Logging Estruturado RE-EDUCA Store.

Fornece logging em formato JSON para fácil integração com sistemas de log.
"""
import json
import logging
import sys
from datetime import datetime
from logging.handlers import RotatingFileHandler
from typing import Any, Dict, Optional


class JSONFormatter(logging.Formatter):
    """Formatter que converte logs para JSON"""

    def format(self, record: logging.LogRecord) -> str:
        """Formata registro de log como JSON"""
        log_data = {
            "timestamp": datetime.utcnow().isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "module": record.module,
            "function": record.funcName,
            "line": record.lineno,
        }

        # Adiciona campos extras se existirem
        if hasattr(record, "user_id"):
            log_data["user_id"] = record.user_id
        if hasattr(record, "request_id"):
            log_data["request_id"] = record.request_id
        if hasattr(record, "duration_ms"):
            log_data["duration_ms"] = record.duration_ms
        if hasattr(record, "status_code"):
            log_data["status_code"] = record.status_code

        # Adiciona exceção se existir
        if record.exc_info:
            log_data["exception"] = self.formatException(record.exc_info)

        return json.dumps(log_data, ensure_ascii=False)


def setup_structured_logging(app, log_file: str = "logs/app.log", log_level: str = "INFO", use_json: bool = True):
    """
    Configura logging estruturado para a aplicação.

    Args:
        app: Aplicação Flask
        log_file: Caminho do arquivo de log
        log_level: Nível de log (DEBUG, INFO, WARNING, ERROR, CRITICAL)
        use_json: Se deve usar formato JSON
    """
    import os

    # Cria diretório de logs se não existir
    log_dir = os.path.dirname(log_file)
    if log_dir and not os.path.exists(log_dir):
        os.makedirs(log_dir)

    # Remove handlers existentes
    app.logger.handlers.clear()

    # Define nível
    app.logger.setLevel(getattr(logging, log_level.upper()))

    # Handler para arquivo
    file_handler = RotatingFileHandler(log_file, maxBytes=10 * 1024 * 1024, backupCount=5)  # 10MB

    # Handler para console
    console_handler = logging.StreamHandler(sys.stdout)

    # Formatter
    if use_json:
        formatter = JSONFormatter()
    else:
        formatter = logging.Formatter("%(asctime)s - %(name)s - %(levelname)s - %(message)s")

    file_handler.setFormatter(formatter)
    console_handler.setFormatter(formatter)

    app.logger.addHandler(file_handler)
    app.logger.addHandler(console_handler)

    # Desabilita logging do Werkzeug em produção
    if not app.config.get("DEBUG"):
        werkzeug_logger = logging.getLogger("werkzeug")
        werkzeug_logger.setLevel(logging.WARNING)


def log_performance(logger: logging.Logger, operation: str, duration_ms: float, **kwargs):
    """
    Loga métrica de performance.

    Args:
        logger: Logger a usar
        operation: Nome da operação
        duration_ms: Duração em milissegundos
        **kwargs: Campos extras
    """
    extra = {"operation": operation, "duration_ms": duration_ms, **kwargs}
    logger.info(f"Performance: {operation} took {duration_ms}ms", extra=extra)


def log_error_with_context(
    logger: logging.Logger, error: Exception, context: Optional[Dict[str, Any]] = None, user_id: Optional[str] = None
):
    """
    Loga erro com contexto estruturado.

    Args:
        logger: Logger a usar
        error: Exceção ocorrida
        context: Contexto adicional
        user_id: ID do usuário (se aplicável)
    """
    extra = {
        "error_type": type(error).__name__,
        "error_message": str(error),
    }

    if context:
        extra.update(context)
    if user_id:
        extra["user_id"] = user_id

    logger.error(f"Error: {error}", exc_info=True, extra=extra)


def log_operation(
    logger: logging.Logger, operation: str, status: str = "success", duration_ms: Optional[float] = None, **kwargs
):
    """
    Loga operação com métricas.

    Args:
        logger: Logger a usar
        operation: Nome da operação
        status: Status (success, error, warning)
        duration_ms: Duração em ms (opcional)
        **kwargs: Campos extras
    """
    extra = {"operation": operation, "status": status, **kwargs}

    if duration_ms is not None:
        extra["duration_ms"] = duration_ms

    level = logging.INFO if status == "success" else logging.ERROR
    logger.log(level, f"Operation: {operation} - {status}", extra=extra)
