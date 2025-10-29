"""
Serviço de Two-Factor Authentication (2FA) RE-EDUCA Store
"""
import os
import logging
import pyotp
import qrcode
import io
import base64
import secrets
from typing import Dict, Any, Optional
from datetime import datetime, timedelta
from config.database import supabase_client
from utils.helpers import generate_uuid

logger = logging.getLogger(__name__)

class TwoFactorService:
    """Service para operações de 2FA"""
    
    def __init__(self):
        self.db = supabase_client
    
    def generate_secret_key(self, user_email: str) -> str:
        """Gera uma chave secreta para TOTP"""
        return pyotp.random_base32()
    
    def generate_qr_code(self, user_email: str, secret_key: str) -> str:
        """Gera QR code para configuração do 2FA"""
        try:
            # Cria URI para o app autenticador
            totp_uri = pyotp.totp.TOTP(secret_key).provisioning_uri(
                name=user_email,
                issuer_name="RE-EDUCA Store"
            )
            
            # Gera QR code
            qr = qrcode.QRCode(version=1, box_size=10, border=5)
            qr.add_data(totp_uri)
            qr.make(fit=True)
            
            # Cria imagem
            img = qr.make_image(fill_color="black", back_color="white")
            
            # Converte para base64
            buffer = io.BytesIO()
            img.save(buffer, format='PNG')
            buffer.seek(0)
            
            # Converte para string base64
            img_str = base64.b64encode(buffer.getvalue()).decode()
            
            return f"data:image/png;base64,{img_str}"
            
        except Exception as e:
            logger.error(f"Erro ao gerar QR code: {str(e)}")
            raise
    
    def generate_backup_codes(self, count: int = 10) -> list:
        """Gera códigos de backup para 2FA"""
        return [secrets.token_hex(4).upper() for _ in range(count)]
    
    def setup_two_factor(self, user_id: str, user_email: str) -> Dict[str, Any]:
        """Configura 2FA para um usuário"""
        try:
            # Gera chave secreta
            secret_key = self.generate_secret_key(user_email)
            
            # Gera códigos de backup
            backup_codes = self.generate_backup_codes()
            
            # Gera QR code
            qr_code = self.generate_qr_code(user_email, secret_key)
            
            # Salva no banco de dados
            if hasattr(self.db, 'execute_insert'):
                # SQLite
                self.db.execute_insert('''
                    INSERT OR REPLACE INTO two_factor_auth 
                    (user_id, secret_key, backup_codes, enabled, created_at, updated_at)
                    VALUES (?, ?, ?, ?, ?, ?)
                ''', (
                    user_id,
                    secret_key,
                    ','.join(backup_codes),
                    False,  # Não habilitado até verificação
                    datetime.now().isoformat(),
                    datetime.now().isoformat()
                ))
            else:
                # Supabase
                self.db._make_request("GET", 'two_factor_auth').upsert({
                    'user_id': user_id,
                    'secret_key': secret_key,
                    'backup_codes': ','.join(backup_codes),
                    'enabled': False,
                    'created_at': datetime.now().isoformat(),
                    'updated_at': datetime.now().isoformat()
                }).execute()
            
            return {
                'success': True,
                'secret_key': secret_key,
                'qr_code': qr_code,
                'backup_codes': backup_codes,
                'message': '2FA configurado com sucesso. Escaneie o QR code com seu app autenticador.'
            }
            
        except Exception as e:
            logger.error(f"Erro ao configurar 2FA: {str(e)}")
            return {'success': False, 'error': 'Erro interno do servidor'}
    
    def verify_totp_code(self, user_id: str, totp_code: str) -> Dict[str, Any]:
        """Verifica código TOTP"""
        try:
            # Busca chave secreta do usuário
            if hasattr(self.db, 'execute_query'):
                # SQLite
                result = self.db.execute_query(
                    'SELECT secret_key FROM two_factor_auth WHERE user_id = ?',
                    (user_id,)
                )
            else:
                # Supabase
                result = self.db._make_request("GET", 'two_factor_auth').select('secret_key').eq('user_id', user_id).execute()
                result = result.data
            
            if not result:
                return {'success': False, 'error': '2FA não configurado'}
            
            secret_key = result[0]['secret_key']
            
            # Verifica código TOTP
            totp = pyotp.TOTP(secret_key)
            if totp.verify(totp_code, valid_window=1):
                return {'success': True, 'message': 'Código válido'}
            else:
                return {'success': False, 'error': 'Código inválido'}
                
        except Exception as e:
            logger.error(f"Erro ao verificar código TOTP: {str(e)}")
            return {'success': False, 'error': 'Erro interno do servidor'}
    
    def verify_backup_code(self, user_id: str, backup_code: str) -> Dict[str, Any]:
        """Verifica código de backup"""
        try:
            # Busca códigos de backup do usuário
            if hasattr(self.db, 'execute_query'):
                # SQLite
                result = self.db.execute_query(
                    'SELECT backup_codes FROM two_factor_auth WHERE user_id = ?',
                    (user_id,)
                )
            else:
                # Supabase
                result = self.db._make_request("GET", 'two_factor_auth').select('backup_codes').eq('user_id', user_id).execute()
                result = result.data
            
            if not result:
                return {'success': False, 'error': '2FA não configurado'}
            
            backup_codes = result[0]['backup_codes'].split(',')
            
            if backup_code.upper() in backup_codes:
                # Remove código usado
                backup_codes.remove(backup_code.upper())
                
                # Atualiza banco
                if hasattr(self.db, 'execute_update'):
                    # SQLite
                    self.db.execute_update(
                        'UPDATE two_factor_auth SET backup_codes = ? WHERE user_id = ?',
                        (','.join(backup_codes), user_id)
                    )
                else:
                    # Supabase
                    self.db._make_request("GET", 'two_factor_auth').update({
                        'backup_codes': ','.join(backup_codes)
                    }).eq('user_id', user_id).execute()
                
                return {'success': True, 'message': 'Código de backup válido'}
            else:
                return {'success': False, 'error': 'Código de backup inválido'}
                
        except Exception as e:
            logger.error(f"Erro ao verificar código de backup: {str(e)}")
            return {'success': False, 'error': 'Erro interno do servidor'}
    
    def enable_two_factor(self, user_id: str, totp_code: str) -> Dict[str, Any]:
        """Habilita 2FA após verificação do código"""
        try:
            # Verifica código TOTP
            verification = self.verify_totp_code(user_id, totp_code)
            if not verification['success']:
                return verification
            
            # Habilita 2FA
            if hasattr(self.db, 'execute_update'):
                # SQLite
                self.db.execute_update(
                    'UPDATE two_factor_auth SET enabled = 1, updated_at = ? WHERE user_id = ?',
                    (datetime.now().isoformat(), user_id)
                )
                
                # Atualiza tabela users
                self.db.execute_update(
                    'UPDATE users SET two_factor_enabled = 1, updated_at = ? WHERE id = ?',
                    (datetime.now().isoformat(), user_id)
                )
            else:
                # Supabase
                self.db._make_request("GET", 'two_factor_auth').update({
                    'enabled': True,
                    'updated_at': datetime.now().isoformat()
                }).eq('user_id', user_id).execute()
                
                self.db._make_request("GET", 'users').update({
                    'two_factor_enabled': True,
                    'updated_at': datetime.now().isoformat()
                }).eq('id', user_id).execute()
            
            return {'success': True, 'message': '2FA habilitado com sucesso'}
            
        except Exception as e:
            logger.error(f"Erro ao habilitar 2FA: {str(e)}")
            return {'success': False, 'error': 'Erro interno do servidor'}
    
    def disable_two_factor(self, user_id: str, totp_code: str = None, backup_code: str = None) -> Dict[str, Any]:
        """Desabilita 2FA"""
        try:
            # Verifica se tem 2FA habilitado
            if hasattr(self.db, 'execute_query'):
                # SQLite
                result = self.db.execute_query(
                    'SELECT enabled FROM two_factor_auth WHERE user_id = ?',
                    (user_id,)
                )
            else:
                # Supabase
                result = self.db._make_request("GET", 'two_factor_auth').select('enabled').eq('user_id', user_id).execute()
                result = result.data
            
            if not result or not result[0]['enabled']:
                return {'success': False, 'error': '2FA não está habilitado'}
            
            # Verifica código (TOTP ou backup)
            if totp_code:
                verification = self.verify_totp_code(user_id, totp_code)
            elif backup_code:
                verification = self.verify_backup_code(user_id, backup_code)
            else:
                return {'success': False, 'error': 'Código de verificação necessário'}
            
            if not verification['success']:
                return verification
            
            # Desabilita 2FA
            if hasattr(self.db, 'execute_update'):
                # SQLite
                self.db.execute_update(
                    'UPDATE two_factor_auth SET enabled = 0, updated_at = ? WHERE user_id = ?',
                    (datetime.now().isoformat(), user_id)
                )
                
                # Atualiza tabela users
                self.db.execute_update(
                    'UPDATE users SET two_factor_enabled = 0, updated_at = ? WHERE id = ?',
                    (datetime.now().isoformat(), user_id)
                )
            else:
                # Supabase
                self.db._make_request("GET", 'two_factor_auth').update({
                    'enabled': False,
                    'updated_at': datetime.now().isoformat()
                }).eq('user_id', user_id).execute()
                
                self.db._make_request("GET", 'users').update({
                    'two_factor_enabled': False,
                    'updated_at': datetime.now().isoformat()
                }).eq('id', user_id).execute()
            
            return {'success': True, 'message': '2FA desabilitado com sucesso'}
            
        except Exception as e:
            logger.error(f"Erro ao desabilitar 2FA: {str(e)}")
            return {'success': False, 'error': 'Erro interno do servidor'}
    
    def is_two_factor_enabled(self, user_id: str) -> bool:
        """Verifica se 2FA está habilitado para o usuário"""
        try:
            if hasattr(self.db, 'execute_query'):
                # SQLite
                result = self.db.execute_query(
                    'SELECT enabled FROM two_factor_auth WHERE user_id = ?',
                    (user_id,)
                )
            else:
                # Supabase
                result = self.db._make_request("GET", 'two_factor_auth').select('enabled').eq('user_id', user_id).execute()
                result = result.data
            
            return bool(result and result[0]['enabled'])
            
        except Exception as e:
            logger.error(f"Erro ao verificar status do 2FA: {str(e)}")
            return False
    
    def get_backup_codes(self, user_id: str) -> Dict[str, Any]:
        """Retorna códigos de backup do usuário"""
        try:
            if hasattr(self.db, 'execute_query'):
                # SQLite
                result = self.db.execute_query(
                    'SELECT backup_codes FROM two_factor_auth WHERE user_id = ?',
                    (user_id,)
                )
            else:
                # Supabase
                result = self.db._make_request("GET", 'two_factor_auth').select('backup_codes').eq('user_id', user_id).execute()
                result = result.data
            
            if not result:
                return {'success': False, 'error': '2FA não configurado'}
            
            backup_codes = result[0]['backup_codes'].split(',')
            
            return {
                'success': True,
                'backup_codes': backup_codes,
                'remaining': len(backup_codes)
            }
            
        except Exception as e:
            logger.error(f"Erro ao buscar códigos de backup: {str(e)}")
            return {'success': False, 'error': 'Erro interno do servidor'}
    
    def regenerate_backup_codes(self, user_id: str, totp_code: str) -> Dict[str, Any]:
        """Regenera códigos de backup"""
        try:
            # Verifica código TOTP
            verification = self.verify_totp_code(user_id, totp_code)
            if not verification['success']:
                return verification
            
            # Gera novos códigos
            backup_codes = self.generate_backup_codes()
            
            # Atualiza banco
            if hasattr(self.db, 'execute_update'):
                # SQLite
                self.db.execute_update(
                    'UPDATE two_factor_auth SET backup_codes = ?, updated_at = ? WHERE user_id = ?',
                    (','.join(backup_codes), datetime.now().isoformat(), user_id)
                )
            else:
                # Supabase
                self.db._make_request("GET", 'two_factor_auth').update({
                    'backup_codes': ','.join(backup_codes),
                    'updated_at': datetime.now().isoformat()
                }).eq('user_id', user_id).execute()
            
            return {
                'success': True,
                'backup_codes': backup_codes,
                'message': 'Códigos de backup regenerados com sucesso'
            }
            
        except Exception as e:
            logger.error(f"Erro ao regenerar códigos de backup: {str(e)}")
            return {'success': False, 'error': 'Erro interno do servidor'}