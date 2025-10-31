"""
Middleware de Autenticação RE-EDUCA Store.

Fornece decorators para autenticação JWT, autorização baseada
em roles, rate limiting e validação de JSON schema.
"""
import jwt
import logging
from functools import wraps
from flask import request, jsonify
from datetime import datetime, timezone
from config.database import supabase_client

logger = logging.getLogger(__name__)

def token_required(f):
    """
    Decorator para rotas que requerem autenticação.
    
    Valida o token JWT e adiciona o usuário ao contexto da requisição.
    
    Args:
        f (callable): Função a ser decorada.
        
    Returns:
        callable: Função decorada com verificação de token.
    """
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')
        
        if not token:
            return jsonify({'error': 'Token de acesso requerido'}), 401
        
        try:
            # Remove 'Bearer ' do token
            if token.startswith('Bearer '):
                token = token[7:]
            
            # Decodifica o token JWT
            from config.settings import get_config
            config = get_config()
            data = jwt.decode(token, config.JWT_SECRET_KEY, algorithms=['HS256'])
            current_user_id = data['user_id']
            
            # Verifica se o usuário existe no Supabase
            supabase = supabase_client
            user = supabase.get_user_by_id(current_user_id)
            
            if not user:
                return jsonify({'error': 'Usuário não encontrado'}), 401
            
            request.current_user = user
            
        except jwt.ExpiredSignatureError:
            return jsonify({'error': 'Token expirado'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'error': 'Token inválido'}), 401
        except Exception as e:
            logger.error(f"Erro na autenticação: {str(e)}")
            return jsonify({'error': 'Erro interno de autenticação'}), 500
        
        return f(*args, **kwargs)
    
    return decorated

def admin_required(f):
    """
    Decorator para rotas que requerem privilégios de administrador.
    
    Args:
        f (callable): Função a ser decorada.
        
    Returns:
        callable: Função decorada com verificação de admin.
    """
    @wraps(f)
    def decorated(*args, **kwargs):
        if not hasattr(request, 'current_user') or request.current_user.get('role') != 'admin':
            return jsonify({'error': 'Acesso negado. Privilégios de administrador requeridos.'}), 403
        return f(*args, **kwargs)
    
    return decorated

def moderator_required(f):
    """
    Decorator para rotas que requerem privilégios de moderador ou admin.
    
    Args:
        f (callable): Função a ser decorada.
        
    Returns:
        callable: Função decorada com verificação de moderador.
    """
    @wraps(f)
    def decorated(*args, **kwargs):
        if not hasattr(request, 'current_user'):
            return jsonify({'error': 'Token de acesso requerido'}), 401
            
        user_role = request.current_user.get('role')
        if user_role not in ['admin', 'moderator']:
            return jsonify({'error': 'Acesso negado. Privilégios de moderador ou administrador requeridos.'}), 403
        return f(*args, **kwargs)
    
    return decorated

def rate_limit(max_requests=100, window_minutes=60):
    """
    Decorator para rate limiting.
    
    Args:
        max_requests (int): Número máximo de requisições permitidas.
        window_minutes (int): Janela de tempo em minutos.
        
    Returns:
        callable: Decorator configurado.
        
    Note:
        Implementação básica. Em produção, usar Redis ou similar.
    """
    def decorator(f):
        @wraps(f)
        def decorated(*args, **kwargs):
            # Implementação básica de rate limiting
            # Em produção, usar Redis ou similar
            client_ip = request.remote_addr
            user_id = getattr(request, 'current_user', {}).get('id', 'anonymous')
            
            # Aqui você implementaria a lógica de rate limiting
            # Por enquanto, apenas permite a requisição
            return f(*args, **kwargs)
        
        return decorated
    return decorator

def validate_json_schema(schema):
    """
    Decorator para validação de JSON schema.
    
    Args:
        schema (dict): Dicionário com campos e tipos esperados.
        
    Returns:
        callable: Decorator configurado.
        
    Note:
        Validação básica. Em produção, usar jsonschema library.
    """
    def decorator(f):
        @wraps(f)
        def decorated(*args, **kwargs):
            if not request.is_json:
                return jsonify({'error': 'Content-Type deve ser application/json'}), 400
            
            data = request.get_json()
            if not data:
                return jsonify({'error': 'JSON inválido ou vazio'}), 400
            
            # Validação básica - em produção usar jsonschema
            for field, field_type in schema.items():
                if field not in data:
                    return jsonify({'error': f'Campo {field} é obrigatório'}), 400
                
                if not isinstance(data[field], field_type):
                    return jsonify({'error': f'Campo {field} deve ser do tipo {field_type.__name__}'}), 400
            
            return f(*args, **kwargs)
        
        return decorated
    return decorator