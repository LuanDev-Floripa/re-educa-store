"""
Service de autenticação RE-EDUCA Store - Supabase
"""
import logging
from typing import Dict, Any, Optional
from datetime import datetime, timedelta
from config.database import supabase_client
from config.security import hash_password, verify_password, generate_token, verify_token
from utils.helpers import validate_email, generate_uuid

logger = logging.getLogger(__name__)

class AuthService:
    """Service para operações de autenticação - Supabase"""
    
    def __init__(self):
        self.supabase = supabase_client
    
    def register_user(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Registra novo usuário"""
        try:
            # Verifica se email já existe
            existing_user = self.supabase.get_user_by_email(data['email'])
            
            if existing_user:
                return {'success': False, 'error': 'Email já está em uso'}
            
            # Valida email
            if not validate_email(data['email']):
                return {'success': False, 'error': 'Email inválido'}
            
            # Hash da senha
            password_hash = hash_password(data['password'])
            
            # Dados do usuário
            user_data = {
                'name': data['name'],
                'email': data['email'],
                'password_hash': password_hash,
                'role': 'user',
                'is_active': True
            }
            
            # Cria usuário
            result = self.supabase.create_user(user_data)
            
            if result and isinstance(result, dict) and 'id' in result:
                # Gera token
                token = generate_token(result['id'])
                
                return {
                    'success': True,
                    'user': {
                        'id': result['id'],
                        'name': result.get('name'),
                        'email': result.get('email'),
                        'role': result.get('role', 'user')
                    },
                    'token': token
                }
            else:
                logger.error(f"Erro ao criar usuário. Result: {result}")
                return {'success': False, 'error': 'Erro ao criar usuário'}
                
        except Exception as e:
            logger.error(f"Erro ao registrar usuário: {e}")
            return {'success': False, 'error': 'Erro interno do servidor'}
    
    def authenticate_user(self, email: str, password: str) -> Dict[str, Any]:
        """Autentica usuário"""
        try:
            # Busca usuário por email
            user = self.supabase.get_user_by_email(email)
            
            if not user:
                return {'success': False, 'error': 'Email ou senha inválidos'}
            
            # Verifica senha
            if not verify_password(password, user['password_hash']):
                return {'success': False, 'error': 'Email ou senha inválidos'}
            
            # Verifica se usuário está ativo
            if not user.get('is_active', True):
                return {'success': False, 'error': 'Conta desativada'}
            
            # Atualiza último login (campo não existe na tabela atual)
            # self.supabase.update_user(user['id'], {
            #     'last_login': datetime.now().isoformat()
            # })
            
            # Gera token
            token = generate_token(user['id'])
            
            return {
                'success': True,
                'user': {
                    'id': user['id'],
                    'name': user['name'],
                    'email': user['email'],
                    'role': user['role']
                },
                'token': token
            }
                
        except Exception as e:
            logger.error(f"Erro ao autenticar usuário: {e}")
            return {'success': False, 'error': 'Erro interno do servidor'}
    
    def get_user_by_id(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Busca usuário por ID"""
        try:
            return self.supabase.get_user_by_id(user_id)
        except Exception as e:
            logger.error(f"Erro ao buscar usuário: {e}")
            return None
    
    def update_user(self, user_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """Atualiza dados do usuário"""
        try:
            result = self.supabase.update_user(user_id, data)
            
            if result and 'error' not in result:
                return {'success': True, 'user': result}
            else:
                return {'success': False, 'error': 'Erro ao atualizar usuário'}
                
        except Exception as e:
            logger.error(f"Erro ao atualizar usuário: {e}")
            return {'success': False, 'error': 'Erro interno do servidor'}
    
    def change_password(self, user_id: str, current_password: str, new_password: str) -> Dict[str, Any]:
        """Altera senha do usuário"""
        try:
            # Busca usuário
            user = self.supabase.get_user_by_id(user_id)
            
            if not user:
                return {'success': False, 'error': 'Usuário não encontrado'}
            
            # Verifica senha atual
            if not verify_password(current_password, user['password_hash']):
                return {'success': False, 'error': 'Senha atual incorreta'}
            
            # Hash da nova senha
            new_password_hash = hash_password(new_password)
            
            # Atualiza senha
            result = self.supabase.update_user(user_id, {
                'password_hash': new_password_hash,
                'updated_at': datetime.now().isoformat()
            })
            
            if result and 'error' not in result:
                return {'success': True}
            else:
                return {'success': False, 'error': 'Erro ao alterar senha'}
                
        except Exception as e:
            logger.error(f"Erro ao alterar senha: {e}")
            return {'success': False, 'error': 'Erro interno do servidor'}
    
    def deactivate_user(self, user_id: str) -> Dict[str, Any]:
        """Desativa usuário"""
        try:
            result = self.supabase.update_user(user_id, {
                'is_active': False,
                'updated_at': datetime.now().isoformat()
            })
            
            if result and 'error' not in result:
                return {'success': True}
            else:
                return {'success': False, 'error': 'Erro ao desativar usuário'}
                
        except Exception as e:
            logger.error(f"Erro ao desativar usuário: {e}")
            return {'success': False, 'error': 'Erro interno do servidor'}