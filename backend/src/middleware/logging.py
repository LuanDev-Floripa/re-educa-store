"""
Middleware de logging para RE-EDUCA Store
"""
import logging
import sys
import os
from datetime import datetime
from flask import Flask, request, g
from config.settings import get_config

def setup_logging(app: Flask):
    """Configura logging para a aplicação"""
    
    config = get_config()
    
    # Garante que o diretório de logs existe
    log_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), '..', 'logs')
    os.makedirs(log_dir, exist_ok=True)
    log_file = os.path.join(log_dir, 'app.log')
    
    # Configuração básica de logging
    logging.basicConfig(
        level=getattr(logging, config.LOG_LEVEL),
        format=config.LOG_FORMAT,
        handlers=[
            logging.StreamHandler(sys.stdout),
            logging.FileHandler(log_file)
        ]
    )
    
    # Logger principal da aplicação
    logger = logging.getLogger('re-educa')
    logger.setLevel(getattr(logging, config.LOG_LEVEL))
    
    # Middleware para log de requisições
    @app.before_request
    def log_request():
        g.start_time = datetime.now()
        
        # Log da requisição
        logger.info(f"Requisição: {request.method} {request.path} - IP: {request.remote_addr}")
        
        # Log de dados sensíveis (apenas em debug)
        if app.config.get('DEBUG') and request.is_json:
            logger.debug(f"Dados da requisição: {request.get_json()}")
    
    @app.after_request
    def log_response(response):
        # Calcula tempo de resposta
        if hasattr(g, 'start_time'):
            duration = (datetime.now() - g.start_time).total_seconds()
            logger.info(f"Resposta: {response.status_code} - Duração: {duration:.3f}s")
        
        return response
    
    # Middleware para log de erros
    @app.errorhandler(Exception)
    def log_error(error):
        logger.error(f"Erro não tratado: {str(error)}", exc_info=True)
        return {'error': 'Erro interno do servidor'}, 500

def log_user_activity(user_id: str, activity: str, details: dict = None):
    """Log de atividades do usuário"""
    logger = logging.getLogger('re-educa.user_activity')
    
    log_data = {
        'user_id': user_id,
        'activity': activity,
        'timestamp': datetime.now().isoformat(),
        'ip_address': request.remote_addr,
        'user_agent': request.headers.get('User-Agent', ''),
        'details': details or {}
    }
    
    logger.info(f"Atividade do usuário: {log_data}")

def log_system_event(event: str, details: dict = None):
    """Log de eventos do sistema"""
    logger = logging.getLogger('re-educa.system')
    
    log_data = {
        'event': event,
        'timestamp': datetime.now().isoformat(),
        'details': details or {}
    }
    
    logger.info(f"Evento do sistema: {log_data}")

def log_security_event(event: str, user_id: str = None, details: dict = None):
    """Log de eventos de segurança"""
    logger = logging.getLogger('re-educa.security')
    
    log_data = {
        'event': event,
        'user_id': user_id,
        'timestamp': datetime.now().isoformat(),
        'ip_address': request.remote_addr,
        'user_agent': request.headers.get('User-Agent', ''),
        'details': details or {}
    }
    
    logger.warning(f"Evento de segurança: {log_data}")