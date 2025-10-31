"""
Configurações de segurança RE-EDUCA Store.

Módulo responsável por hash de senhas, geração e validação
de tokens JWT para autenticação e autorização.
"""
import os
import bcrypt
import jwt
from datetime import datetime, timedelta
from typing import Dict, Any, Optional
from .settings import get_config

class SecurityConfig:
    """
    Configurações de segurança da aplicação.
    
    Gerencia hashing de senhas com bcrypt e tokens JWT
    para autenticação segura de usuários.
    """
    
    def __init__(self):
        """Inicializa configurações de segurança."""
        self.config = get_config()
    
    def hash_password(self, password: str) -> str:
        """
        Gera hash da senha usando bcrypt.
        
        Args:
            password (str): Senha em texto plano.
            
        Returns:
            str: Hash da senha.
        """
        salt = bcrypt.gensalt()
        hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
        return hashed.decode('utf-8')
    
    def verify_password(self, password: str, hashed: str) -> bool:
        """
        Verifica se a senha está correta.
        
        Args:
            password (str): Senha em texto plano.
            hashed (str): Hash da senha armazenada.
            
        Returns:
            bool: True se a senha é válida, False caso contrário.
        """
        return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))
    
    def generate_token(self, user_id: str, expires_in: Optional[int] = None) -> str:
        """
        Gera token JWT de acesso para o usuário.
        
        Args:
            user_id (str): ID do usuário.
            expires_in (Optional[int]): Tempo de expiração em segundos.
            
        Returns:
            str: Token JWT codificado.
        """
        if expires_in is None:
            expires_in = self.config.JWT_ACCESS_TOKEN_EXPIRES
        
        payload = {
            'user_id': user_id,
            'exp': datetime.utcnow() + timedelta(seconds=expires_in),
            'iat': datetime.utcnow(),
            'type': 'access'
        }
        
        return jwt.encode(payload, self.config.JWT_SECRET_KEY, algorithm='HS256')
    
    def generate_refresh_token(self, user_id: str) -> str:
        """
        Gera refresh token JWT.
        
        Args:
            user_id (str): ID do usuário.
            
        Returns:
            str: Refresh token JWT codificado.
        """
        payload = {
            'user_id': user_id,
            'exp': datetime.utcnow() + timedelta(seconds=self.config.JWT_REFRESH_TOKEN_EXPIRES),
            'iat': datetime.utcnow(),
            'type': 'refresh'
        }
        
        return jwt.encode(payload, self.config.JWT_SECRET_KEY, algorithm='HS256')
    
    def verify_token(self, token: str) -> Optional[Dict[str, Any]]:
        """
        Verifica e decodifica o token JWT.
        
        Args:
            token (str): Token JWT.
            
        Returns:
            Optional[Dict[str, Any]]: Payload do token ou None se inválido.
        """
        try:
            payload = jwt.decode(token, self.config.JWT_SECRET_KEY, algorithms=['HS256'])
            return payload
        except jwt.ExpiredSignatureError:
            return None
        except jwt.InvalidTokenError:
            return None
    
    def is_token_expired(self, token: str) -> bool:
        """
        Verifica se o token está expirado.
        
        Args:
            token (str): Token JWT.
            
        Returns:
            bool: True se expirado, False caso contrário.
        """
        try:
            payload = jwt.decode(token, self.config.JWT_SECRET_KEY, algorithms=['HS256'])
            exp = datetime.fromtimestamp(payload['exp'])
            return datetime.utcnow() > exp
        except (jwt.ExpiredSignatureError, jwt.InvalidTokenError, Exception):
            return True
    
    def get_token_expiration(self, token: str) -> Optional[datetime]:
        """
        Retorna a data de expiração do token.
        
        Args:
            token (str): Token JWT.
            
        Returns:
            Optional[datetime]: Data de expiração ou None.
        """
        try:
            payload = jwt.decode(token, self.config.JWT_SECRET_KEY, algorithms=['HS256'])
            return datetime.fromtimestamp(payload['exp'])
        except (jwt.ExpiredSignatureError, jwt.InvalidTokenError, Exception):
            return None

# Instância global de segurança
security_config = SecurityConfig()

def hash_password(password: str) -> str:
    """
    Gera hash da senha usando bcrypt.
    
    Args:
        password (str): Senha em texto plano.
        
    Returns:
        str: Hash da senha.
    """
    return security_config.hash_password(password)

def verify_password(password: str, hashed: str) -> bool:
    """
    Verifica se a senha corresponde ao hash.
    
    Args:
        password (str): Senha em texto plano.
        hashed (str): Hash da senha.
        
    Returns:
        bool: True se válida, False caso contrário.
    """
    return security_config.verify_password(password, hashed)

def generate_token(user_id: str, expires_in: Optional[int] = None) -> str:
    """
    Gera token JWT de acesso.
    
    Args:
        user_id (str): ID do usuário.
        expires_in (Optional[int]): Tempo de expiração em segundos.
        
    Returns:
        str: Token JWT.
    """
    return security_config.generate_token(user_id, expires_in)

def generate_refresh_token(user_id: str) -> str:
    """
    Gera refresh token JWT.
    
    Args:
        user_id (str): ID do usuário.
        
    Returns:
        str: Refresh token JWT.
    """
    return security_config.generate_refresh_token(user_id)

def verify_token(token: str) -> Optional[Dict[str, Any]]:
    """
    Verifica e decodifica token JWT.
    
    Args:
        token (str): Token JWT.
        
    Returns:
        Optional[Dict[str, Any]]: Payload do token ou None.
    """
    return security_config.verify_token(token)

def is_token_expired(token: str) -> bool:
    """
    Verifica se token está expirado.
    
    Args:
        token (str): Token JWT.
        
    Returns:
        bool: True se expirado, False caso contrário.
    """
    return security_config.is_token_expired(token)

def get_token_expiration(token: str) -> Optional[datetime]:
    """
    Retorna data de expiração do token.
    
    Args:
        token (str): Token JWT.
        
    Returns:
        Optional[datetime]: Data de expiração ou None.
    """
    return security_config.get_token_expiration(token)