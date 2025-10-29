"""
Configurações de segurança RE-EDUCA Store
"""
import os
import bcrypt
import jwt
from datetime import datetime, timedelta
from typing import Dict, Any, Optional
from .settings import get_config

class SecurityConfig:
    """Configurações de segurança da aplicação"""
    
    def __init__(self):
        self.config = get_config()
    
    def hash_password(self, password: str) -> str:
        """Gera hash da senha usando bcrypt"""
        salt = bcrypt.gensalt()
        hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
        return hashed.decode('utf-8')
    
    def verify_password(self, password: str, hashed: str) -> bool:
        """Verifica se a senha está correta"""
        return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))
    
    def generate_token(self, user_id: str, expires_in: Optional[int] = None) -> str:
        """Gera token JWT para o usuário"""
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
        """Gera refresh token JWT"""
        payload = {
            'user_id': user_id,
            'exp': datetime.utcnow() + timedelta(seconds=self.config.JWT_REFRESH_TOKEN_EXPIRES),
            'iat': datetime.utcnow(),
            'type': 'refresh'
        }
        
        return jwt.encode(payload, self.config.JWT_SECRET_KEY, algorithm='HS256')
    
    def verify_token(self, token: str) -> Optional[Dict[str, Any]]:
        """Verifica e decodifica o token JWT"""
        try:
            payload = jwt.decode(token, self.config.JWT_SECRET_KEY, algorithms=['HS256'])
            return payload
        except jwt.ExpiredSignatureError:
            return None
        except jwt.InvalidTokenError:
            return None
    
    def is_token_expired(self, token: str) -> bool:
        """Verifica se o token está expirado"""
        try:
            payload = jwt.decode(token, self.config.JWT_SECRET_KEY, algorithms=['HS256'])
            exp = datetime.fromtimestamp(payload['exp'])
            return datetime.utcnow() > exp
        except:
            return True
    
    def get_token_expiration(self, token: str) -> Optional[datetime]:
        """Retorna a data de expiração do token"""
        try:
            payload = jwt.decode(token, self.config.JWT_SECRET_KEY, algorithms=['HS256'])
            return datetime.fromtimestamp(payload['exp'])
        except:
            return None

# Instância global de segurança
security_config = SecurityConfig()

def hash_password(password: str) -> str:
    """Gera hash da senha"""
    return security_config.hash_password(password)

def verify_password(password: str, hashed: str) -> bool:
    """Verifica senha"""
    return security_config.verify_password(password, hashed)

def generate_token(user_id: str, expires_in: Optional[int] = None) -> str:
    """Gera token JWT"""
    return security_config.generate_token(user_id, expires_in)

def generate_refresh_token(user_id: str) -> str:
    """Gera refresh token"""
    return security_config.generate_refresh_token(user_id)

def verify_token(token: str) -> Optional[Dict[str, Any]]:
    """Verifica token JWT"""
    return security_config.verify_token(token)

def is_token_expired(token: str) -> bool:
    """Verifica se token está expirado"""
    return security_config.is_token_expired(token)

def get_token_expiration(token: str) -> Optional[datetime]:
    """Retorna expiração do token"""
    return security_config.get_token_expiration(token)