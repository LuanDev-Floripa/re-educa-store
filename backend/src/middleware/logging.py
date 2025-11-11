"""
Middleware de logging para RE-EDUCA Store.

Configura sistema de logging com diferentes níveis e categorias,
incluindo logs de requisições, respostas, erros, atividades de
usuários e eventos de segurança.
"""

import logging
import os
import sys
import time
from datetime import datetime

from config.settings import get_config
from flask import Flask, g, request


def setup_logging(app: Flask):
    """
    Configura logging para a aplicação.

    Suporta logging estruturado (JSON) e tradicional.

    Configura níveis de log, formatos, handlers e middlewares
    para registrar requisições, respostas e erros.

    Args:
        app (Flask): Instância da aplicação Flask.
    """
    config = get_config()

    # Tenta usar logging estruturado se configurado
    use_json_logging = getattr(config, "USE_JSON_LOGGING", False)

    if use_json_logging:
        try:
            from utils.structured_logging import setup_structured_logging

            setup_structured_logging(
                app, log_file="logs/app.log", log_level=getattr(config, "LOG_LEVEL", "INFO"), use_json=True
            )
            return  # Early return se usar logging estruturado
        except ImportError:
            pass  # Fallback para logging tradicional

    # Garante que o diretório de logs existe
    log_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "..", "logs")
    os.makedirs(log_dir, exist_ok=True)
    log_file = os.path.join(log_dir, "app.log")

    # Configuração básica de logging
    log_level = getattr(config, "LOG_LEVEL", "INFO")
    log_format = getattr(config, "LOG_FORMAT", "%(asctime)s - %(name)s - %(levelname)s - %(message)s")

    logging.basicConfig(
        level=getattr(logging, log_level),
        format=log_format,
        handlers=[logging.StreamHandler(sys.stdout), logging.FileHandler(log_file)],
    )

    # Logger principal da aplicação
    logger = logging.getLogger("re-educa")
    logger.setLevel(getattr(logging, log_level))

    @app.before_request
    def log_request():
        """Registra informações da requisição HTTP."""
        g.start_time = datetime.now()

        # Log da requisição
        logger.info(f"Requisição: {request.method} {request.path} - IP: {request.remote_addr}")

        # Log de dados sensíveis (apenas em debug)
        if app.config.get("DEBUG") and request.is_json:
            logger.debug(f"Dados da requisição: {request.get_json()}")

    @app.after_request
    def log_response(response):
        """
        Registra informações da resposta HTTP com métricas de performance.

        OTIMIZADO: Logging estruturado de performance.

        Args:
            response: Objeto de resposta Flask.

        Returns:
            Response: Objeto de resposta inalterado.
        """
        # Calcula tempo de resposta
        if hasattr(g, "start_time"):
            # g.start_time pode ser time.time() (float) ou datetime (do app.py)
            if isinstance(g.start_time, datetime):
                duration = (datetime.now() - g.start_time).total_seconds()
            else:
                # É float (time.time())
                duration = time.time() - g.start_time
            duration_ms = duration * 1000

            # Log estruturado de performance
            extra = {
                "method": request.method,
                "path": request.path,
                "status_code": response.status_code,
                "duration_ms": round(duration_ms, 2),
                "duration_s": round(duration, 3),
            }

            # Adiciona user_id se disponível
            if hasattr(request, "current_user") and request.current_user:
                extra["user_id"] = request.current_user.get("id")

            # Log baseado no status code e duração
            if response.status_code >= 500:
                logger.error(f"Resposta: {response.status_code} - Duração: {duration:.3f}s", extra=extra)
            elif response.status_code >= 400:
                logger.warning(f"Resposta: {response.status_code} - Duração: {duration:.3f}s", extra=extra)
            elif duration > 1.0:  # Requisições lentas (> 1s)
                logger.warning(f"Resposta lenta: {response.status_code} - Duração: {duration:.3f}s", extra=extra)
            else:
                logger.info(f"Resposta: {response.status_code} - Duração: {duration:.3f}s", extra=extra)

        return response

    @app.errorhandler(Exception)
    def log_error(error):
        """
        Registra erros não tratados.

        Args:
            error: Exceção capturada.

        Returns:
            tuple: Resposta de erro JSON e código de status.
        """
        logger.error(f"Erro não tratado: {str(error)}", exc_info=True)
        return {"error": "Erro interno do servidor"}, 500


def log_user_activity(user_id: str, activity: str, details: dict = None):
    """
    Registra atividades do usuário.

    Args:
        user_id (str): ID do usuário.
        activity (str): Descrição da atividade.
        details (dict, optional): Detalhes adicionais da atividade.
    """
    logger = logging.getLogger("re-educa.user_activity")

    log_data = {
        "user_id": user_id,
        "activity": activity,
        "timestamp": datetime.now().isoformat(),
        "ip_address": request.remote_addr,
        "user_agent": request.headers.get("User-Agent", ""),
        "details": details or {},
    }

    logger.info(f"Atividade do usuário: {log_data}")
    
    # Salvar no banco de dados para auditoria administrativa
    try:
        from config.database import supabase_client
        from flask import has_request_context
        
        # Verificar se estamos em contexto de requisição
        if has_request_context():
            ip_address = request.remote_addr if hasattr(request, 'remote_addr') else None
            user_agent = request.headers.get("User-Agent", "") if hasattr(request, 'headers') else ""
        else:
            ip_address = None
            user_agent = ""
        
        supabase_client.table("admin_activity_logs").insert({
            "user_id": user_id,
            "activity_type": activity,
            "activity_description": activity,
            "ip_address": ip_address,
            "user_agent": user_agent,
            "details": details or {},
        }).execute()
    except Exception as e:
        # Não falhar se não conseguir salvar no banco (logging não é crítico)
        logger.warning(f"Erro ao salvar log de atividade no banco: {str(e)}")


def log_system_event(event: str, details: dict = None):
    """
    Registra eventos do sistema.

    Args:
        event (str): Descrição do evento.
        details (dict, optional): Detalhes adicionais do evento.
    """
    logger = logging.getLogger("re-educa.system")

    log_data = {"event": event, "timestamp": datetime.now().isoformat(), "details": details or {}}

    logger.info(f"Evento do sistema: {log_data}")


def log_security_event(event: str, user_id: str = None, details: dict = None):
    """
    Registra eventos de segurança.

    Args:
        event (str): Descrição do evento de segurança.
        user_id (str, optional): ID do usuário envolvido.
        details (dict, optional): Detalhes adicionais do evento.
    """
    logger = logging.getLogger("re-educa.security")

    log_data = {
        "event": event,
        "user_id": user_id,
        "timestamp": datetime.now().isoformat(),
        "ip_address": request.remote_addr,
        "user_agent": request.headers.get("User-Agent", ""),
        "details": details or {},
    }

    logger.warning(f"Evento de segurança: {log_data}")
    
    # Determinar severidade baseado no tipo de evento
    severity = "medium"
    if "failed" in event.lower() or "unauthorized" in event.lower() or "attack" in event.lower():
        severity = "high"
    elif "critical" in event.lower() or "breach" in event.lower():
        severity = "critical"
    elif "warning" in event.lower() or "suspicious" in event.lower():
        severity = "medium"
    else:
        severity = "low"
    
    # Salvar no banco de dados para auditoria administrativa
    try:
        from config.database import supabase_client
        from flask import has_request_context
        
        # Verificar se estamos em contexto de requisição
        if has_request_context():
            ip_address = request.remote_addr if hasattr(request, 'remote_addr') else None
            user_agent = request.headers.get("User-Agent", "") if hasattr(request, 'headers') else ""
        else:
            ip_address = None
            user_agent = ""
        
        supabase_client.table("admin_security_logs").insert({
            "user_id": user_id,
            "event_type": event,
            "event_description": event,
            "severity": severity,
            "ip_address": ip_address,
            "user_agent": user_agent,
            "details": details or {},
        }).execute()
    except Exception as e:
        # Não falhar se não conseguir salvar no banco (logging não é crítico)
        logger.warning(f"Erro ao salvar log de segurança no banco: {str(e)}")
