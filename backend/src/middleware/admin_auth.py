"""
Middleware de autenticação administrativa.

Fornece decorators para proteção de rotas que exigem
privilegios administrativos ou acesso a dados próprios.
"""
from functools import wraps
from flask import request, jsonify, g
from services.auth_service import AuthService
import logging

logger = logging.getLogger(__name__)

def admin_required(f):
    """
    Decorator que verifica se o usuário é admin.
    
    Args:
        f (callable): Função a ser decorada.
        
    Returns:
        callable: Função decorada com verificação de admin.
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        try:
            # Verifica se há token de autorização
            auth_header = request.headers.get('Authorization')
            if not auth_header or not auth_header.startswith('Bearer '):
                return jsonify({'error': 'Token de autorização necessário'}), 401
            
            token = auth_header.split(' ')[1]
            
            # Verifica token e obtém usuário
            auth_service = AuthService()
            user = auth_service.verify_token(token)
            
            if not user:
                return jsonify({'error': 'Token inválido'}), 401
            
            # Verifica se usuário é admin
            if user.get('role') != 'admin':
                logger.warning(f"Tentativa de acesso administrativo por usuário não-admin: {user.get('email')}")
                return jsonify({'error': 'Acesso negado. Privilégios de administrador necessários'}), 403
            
            # Adiciona usuário ao contexto
            g.current_user = user
            
            return f(*args, **kwargs)
            
        except Exception as e:
            logger.error(f"Erro na verificação de admin: {str(e)}")
            return jsonify({'error': 'Erro interno do servidor'}), 500
    
    return decorated_function

def admin_or_self_required(f):
    """
    Decorator que verifica se o usuário é admin ou está acessando seus próprios dados.
    
    Permite que usuários acessem apenas seus próprios dados, exceto se forem admins.
    
    Args:
        f (callable): Função a ser decorada.
        
    Returns:
        callable: Função decorada com verificação de autorização.
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        try:
            # Verifica se há token de autorização
            auth_header = request.headers.get('Authorization')
            if not auth_header or not auth_header.startswith('Bearer '):
                return jsonify({'error': 'Token de autorização necessário'}), 401
            
            token = auth_header.split(' ')[1]
            
            # Verifica token e obtém usuário
            auth_service = AuthService()
            user = auth_service.verify_token(token)
            
            if not user:
                return jsonify({'error': 'Token inválido'}), 401
            
            # Verifica se é admin ou se está acessando seus próprios dados
            user_id = kwargs.get('user_id')
            if user.get('role') != 'admin' and user.get('id') != user_id:
                logger.warning(f"Tentativa de acesso não autorizado: {user.get('email')} tentando acessar dados do usuário {user_id}")
                return jsonify({'error': 'Acesso negado'}), 403
            
            # Adiciona usuário ao contexto
            g.current_user = user
            
            return f(*args, **kwargs)
            
        except Exception as e:
            logger.error(f"Erro na verificação de acesso: {str(e)}")
            return jsonify({'error': 'Erro interno do servidor'}), 500
    
    return decorated_function