"""
Service de autenticação RE-EDUCA Store
"""
import logging
from typing import Dict, Any, Optional
from datetime import datetime, timedelta
from config.database import supabase_client
from config.security import hash_password, verify_password, generate_token, generate_refresh_token, verify_token
from utils.helpers import validate_email, generate_uuid
from utils.constants import USER_ROLES, SUBSCRIPTION_TYPES
from services.email_service import EmailService

logger = logging.getLogger(__name__)

class AuthService:
    """Service para operações de autenticação"""
    
    def __init__(self):
        self.supabase = supabase_client
        self.email_service = EmailService()
    
    def register_user(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Registra novo usuário"""
        try:
            # Verifica se email já existe
            existing_user = self.supabase.table('users').select('id').eq('email', data['email']).execute()
            
            if existing_user.data:
                return {'success': False, 'error': 'Email já está em uso'}
            
            # Prepara dados do usuário
            user_data = {
                'id': generate_uuid(),
                'name': data['name'],
                'email': data['email'].lower(),
                'password_hash': hash_password(data['password']),
                'role': USER_ROLES['USER'],
                'subscription_plan': SUBSCRIPTION_TYPES['FREE'],  # Corrigido: subscription_plan
                'email_verified': False,
                'is_active': True,
                'created_at': datetime.now().isoformat(),
                'updated_at': datetime.now().isoformat()
            }
            
            # Adiciona campos opcionais
            if 'birth_date' in data:
                user_data['birth_date'] = data['birth_date']
            if 'cpf' in data:
                user_data['cpf'] = data['cpf']
            if 'phone' in data:
                user_data['phone'] = data['phone']
            
            # Insere usuário no banco
            result = self.supabase.table('users').insert(user_data).execute()
            
            if not result.data:
                return {'success': False, 'error': 'Erro ao criar usuário'}
            
            user = result.data[0]
            
            # Gera token de verificação de email (válido por 24 horas)
            verification_token = generate_token(user['id'], expires_in=86400)
            
            # Salva token de verificação
            self.supabase.table('email_verifications').insert({
                'user_id': user['id'],
                'token': verification_token,
                'expires_at': (datetime.now() + timedelta(hours=24)).isoformat(),
                'used': False
            }).execute()
            
            # Envia email de verificação
            try:
                self.email_service.send_verification_email(
                    user['email'], 
                    user['name'], 
                    verification_token
                )
            except Exception as e:
                logger.error(f"Erro ao enviar email de verificação: {str(e)}")
            
            # Gera tokens de acesso (usuário não verificado ainda)
            token = generate_token(user['id'])
            refresh_token = generate_refresh_token(user['id'])
            
            # Remove senha do retorno
            user.pop('password_hash', None)
            
            return {
                'success': True,
                'user': user,
                'token': token,
                'refresh_token': refresh_token,
                'email_verification_sent': True
            }
            
        except Exception as e:
            logger.error(f"Erro ao registrar usuário: {str(e)}")
            return {'success': False, 'error': 'Erro interno do servidor'}
    
    def authenticate_user(self, email: str, password: str) -> Dict[str, Any]:
        """Autentica usuário"""
        try:
            # Busca usuário por email
            if hasattr(self.supabase, 'execute_query'):
                # SQLite
                result = self.supabase.execute_query(
                    "SELECT * FROM users WHERE email = ?", 
                    (email.lower(),)
                )
                if not result:
                    return {'success': False, 'error': 'Email ou senha inválidos'}
                user = result[0]
            else:
                # Supabase
                result = self.supabase.table('users').select('*').eq('email', email.lower()).execute()
                if not result.data:
                    return {'success': False, 'error': 'Email ou senha inválidos'}
                user = result.data[0]
            
            # Verifica senha
            if not verify_password(password, user['password_hash']):
                return {'success': False, 'error': 'Email ou senha inválidos'}
            
            # Verifica se usuário está ativo
            if not user.get('active', True):
                return {'success': False, 'error': 'Conta desativada'}
            
            # Gera tokens
            token = generate_token(user['id'])
            refresh_token = generate_refresh_token(user['id'])
            
            # Atualiza último login
            if hasattr(self.supabase, 'execute_update'):
                # SQLite
                self.supabase.execute_update(
                    "UPDATE users SET last_login = ? WHERE id = ?",
                    (datetime.now().isoformat(), user['id'])
                )
            else:
                # Supabase
                self.supabase.table('users').update({
                    'last_login': datetime.now().isoformat()
                }).eq('id', user['id']).execute()
            
            # Remove senha do retorno
            user.pop('password_hash', None)
            
            return {
                'success': True,
                'user': user,
                'token': token,
                'refresh_token': refresh_token
            }
            
        except Exception as e:
            logger.error(f"Erro ao autenticar usuário: {str(e)}")
            return {'success': False, 'error': 'Erro interno do servidor'}
    
    def refresh_token(self, refresh_token: str) -> Dict[str, Any]:
        """Renova token de acesso"""
        try:
            # Verifica refresh token
            payload = verify_token(refresh_token)
            if not payload or payload.get('type') != 'refresh':
                return {'success': False, 'error': 'Refresh token inválido'}
            
            user_id = payload['user_id']
            
            # Verifica se usuário existe
            result = self.supabase.table('users').select('id').eq('id', user_id).execute()
            if not result.data:
                return {'success': False, 'error': 'Usuário não encontrado'}
            
            # Gera novos tokens
            token = generate_token(user_id)
            new_refresh_token = generate_refresh_token(user_id)
            
            return {
                'success': True,
                'token': token,
                'refresh_token': new_refresh_token
            }
            
        except Exception as e:
            logger.error(f"Erro ao renovar token: {str(e)}")
            return {'success': False, 'error': 'Erro interno do servidor'}
    
    def forgot_password(self, email: str) -> Dict[str, Any]:
        """Solicita reset de senha"""
        try:
            # Verifica se usuário existe
            result = self.supabase.table('users').select('id, name').eq('email', email.lower()).execute()
            
            if not result.data:
                # Por segurança, não revela se email existe ou não
                return {'success': True, 'message': 'Email de reset enviado'}
            
            user = result.data[0]
            
            # Gera token de reset (válido por 1 hora)
            reset_token = generate_token(user['id'], expires_in=3600)
            
            # Salva token de reset no banco
            self.supabase.table('password_resets').insert({
                'user_id': user['id'],
                'token': reset_token,
                'expires_at': (datetime.now() + timedelta(hours=1)).isoformat(),
                'used': False
            }).execute()
            
            # Envia email de reset
            try:
                self.email_service.send_password_reset_email(
                    user['email'], 
                    user['name'], 
                    reset_token
                )
            except Exception as e:
                logger.error(f"Erro ao enviar email de reset: {str(e)}")
            
            return {'success': True, 'message': 'Email de reset enviado'}
            
        except Exception as e:
            logger.error(f"Erro ao solicitar reset de senha: {str(e)}")
            return {'success': False, 'error': 'Erro interno do servidor'}
    
    def reset_password(self, token: str, new_password: str) -> Dict[str, Any]:
        """Reseta senha com token"""
        try:
            # Verifica token
            payload = verify_token(token)
            if not payload:
                return {'success': False, 'error': 'Token inválido ou expirado'}
            
            user_id = payload['user_id']
            
            # Verifica se token de reset existe e não foi usado
            reset_result = self.supabase.table('password_resets').select('*').eq('token', token).eq('used', False).execute()
            
            if not reset_result.data:
                return {'success': False, 'error': 'Token de reset inválido ou já usado'}
            
            reset_record = reset_result.data[0]
            
            # Verifica se token não expirou
            expires_at = datetime.fromisoformat(reset_record['expires_at'])
            if datetime.now() > expires_at:
                return {'success': False, 'error': 'Token de reset expirado'}
            
            # Atualiza senha
            password_hash = hash_password(new_password)
            self.supabase.table('users').update({
                'password_hash': password_hash,
                'updated_at': datetime.now().isoformat()
            }).eq('id', user_id).execute()
            
            # Marca token como usado
            self.supabase.table('password_resets').update({
                'used': True
            }).eq('token', token).execute()
            
            return {'success': True, 'user_id': user_id}
            
        except Exception as e:
            logger.error(f"Erro ao resetar senha: {str(e)}")
            return {'success': False, 'error': 'Erro interno do servidor'}
    
    def verify_email(self, token: str) -> Dict[str, Any]:
        """Verifica email do usuário"""
        try:
            # Verifica token
            payload = verify_token(token)
            if not payload:
                return {'success': False, 'error': 'Token inválido ou expirado'}
            
            user_id = payload['user_id']
            
            # Verifica se token de verificação existe e não foi usado
            verification_result = self.supabase.table('email_verifications').select('*').eq('token', token).eq('used', False).execute()
            
            if not verification_result.data:
                return {'success': False, 'error': 'Token de verificação inválido ou já usado'}
            
            verification_record = verification_result.data[0]
            
            # Verifica se token não expirou
            expires_at = datetime.fromisoformat(verification_record['expires_at'])
            if datetime.now() > expires_at:
                return {'success': False, 'error': 'Token de verificação expirado'}
            
            # Busca dados do usuário
            user_result = self.supabase.table('users').select('*').eq('id', user_id).execute()
            if not user_result.data:
                return {'success': False, 'error': 'Usuário não encontrado'}
            
            user = user_result.data[0]
            
            # Atualiza status de verificação
            self.supabase.table('users').update({
                'email_verified': True,
                'email_verified_at': datetime.now().isoformat(),
                'updated_at': datetime.now().isoformat()
            }).eq('id', user_id).execute()
            
            # Marca token como usado
            self.supabase.table('email_verifications').update({
                'used': True
            }).eq('token', token).execute()
            
            # Envia email de boas-vindas
            try:
                self.email_service.send_welcome_email(user['email'], user['name'])
            except Exception as e:
                logger.error(f"Erro ao enviar email de boas-vindas: {str(e)}")
            
            return {'success': True, 'user_id': user_id}
            
        except Exception as e:
            logger.error(f"Erro ao verificar email: {str(e)}")
            return {'success': False, 'error': 'Erro interno do servidor'}
    
    def get_user_by_id(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Busca usuário por ID"""
        try:
            result = self.supabase.table('users').select('*').eq('id', user_id).execute()
            
            if result.data:
                user = result.data[0]
                user.pop('password_hash', None)
                return user
            
            return None
            
        except Exception as e:
            logger.error(f"Erro ao buscar usuário: {str(e)}")
            return None
    
    def update_user_profile(self, user_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """Atualiza perfil do usuário"""
        try:
            # Remove campos que não devem ser atualizados
            data.pop('id', None)
            data.pop('email', None)
            data.pop('role', None)
            data.pop('subscription_type', None)
            data.pop('created_at', None)
            
            # Adiciona timestamp de atualização
            data['updated_at'] = datetime.now().isoformat()
            
            # Atualiza usuário
            result = self.supabase.table('users').update(data).eq('id', user_id).execute()
            
            if result.data:
                user = result.data[0]
                user.pop('password_hash', None)
                return {'success': True, 'user': user}
            else:
                return {'success': False, 'error': 'Usuário não encontrado'}
                
        except Exception as e:
            logger.error(f"Erro ao atualizar perfil: {str(e)}")
            return {'success': False, 'error': 'Erro interno do servidor'}
    
    def change_password(self, user_id: str, current_password: str, new_password: str) -> Dict[str, Any]:
        """Altera senha do usuário"""
        try:
            # Busca usuário
            result = self.supabase.table('users').select('*').eq('id', user_id).execute()
            
            if not result.data:
                return {'success': False, 'error': 'Usuário não encontrado'}
            
            user = result.data[0]
            
            # Verifica senha atual
            if not verify_password(current_password, user['password_hash']):
                return {'success': False, 'error': 'Senha atual incorreta'}
            
            # Gera nova senha
            new_password_hash = hash_password(new_password)
            
            # Atualiza senha
            self.supabase.table('users').update({
                'password_hash': new_password_hash,
                'updated_at': datetime.now().isoformat()
            }).eq('id', user_id).execute()
            
            return {'success': True}
            
        except Exception as e:
            logger.error(f"Erro ao alterar senha: {str(e)}")
            return {'success': False, 'error': 'Erro interno do servidor'}
    
    def verify_token(self, token: str) -> Optional[Dict[str, Any]]:
        """Verifica token e retorna dados do usuário"""
        try:
            # Verifica token
            payload = verify_token(token)
            if not payload or payload.get('type') != 'access':
                return None
            
            user_id = payload['user_id']
            
            # Busca usuário
            if hasattr(self.supabase, 'execute_query'):
                # SQLite
                result = self.supabase.execute_query(
                    "SELECT * FROM users WHERE id = ?", 
                    (user_id,)
                )
                if not result:
                    return None
                user = result[0]
            else:
                # Supabase
                result = self.supabase.table('users').select('*').eq('id', user_id).execute()
                if not result.data:
                    return None
                user = result.data[0]
            
            # Verifica se usuário está ativo
            if not user.get('active', True):
                return None
            
            # Remove senha do retorno
            user.pop('password_hash', None)
            
            return user
            
        except Exception as e:
            logger.error(f"Erro ao verificar token: {str(e)}")
            return None