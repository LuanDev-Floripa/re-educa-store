"""
Repositório de Two-Factor Authentication RE-EDUCA Store.

Gerencia acesso a dados de autenticação de dois fatores.
"""
import logging
from typing import Dict, Any, Optional
from repositories.base_repository import BaseRepository

logger = logging.getLogger(__name__)


class TwoFactorRepository(BaseRepository):
    """
    Repositório para operações com 2FA.
    
    Tabela: two_factor_auth
    """
    
    def __init__(self):
        """Inicializa o repositório de 2FA."""
        super().__init__('two_factor_auth')
    
    def find_by_user(self, user_id: str) -> Optional[Dict[str, Any]]:
        """
        Busca configuração 2FA por usuário.
        
        Args:
            user_id: ID do usuário
        
        Returns:
            Configuração 2FA ou None
        """
        try:
            results = self.find_all(filters={'user_id': user_id}, limit=1)
            return results[0] if results else None
        except Exception as e:
            self.logger.error(f"Erro ao buscar 2FA do usuário: {str(e)}")
            return None
    
    def upsert_config(
        self,
        user_id: str,
        secret_key: str,
        backup_codes: str,
        enabled: bool = False
    ) -> Optional[Dict[str, Any]]:
        """
        Cria ou atualiza configuração 2FA (upsert).
        
        Args:
            user_id: ID do usuário
            secret_key: Chave secreta TOTP
            backup_codes: Códigos de backup (string separada por vírgula)
            enabled: Se está habilitado
        
        Returns:
            Configuração criada/atualizada ou None
        """
        try:
            from datetime import datetime
            
            config_data = {
                'user_id': user_id,
                'secret_key': secret_key,
                'backup_codes': backup_codes,
                'enabled': enabled,
                'updated_at': datetime.now().isoformat()
            }
            
            # Upsert (insert ou update)
            result = (
                self.db.table(self.table_name)
                .upsert(config_data, on_conflict='user_id')
                .execute()
            )
            
            if result.data and len(result.data) > 0:
                return result.data[0]
            return None
        except Exception as e:
            self.logger.error(f"Erro ao fazer upsert de 2FA: {str(e)}")
            return None
    
    def update_enabled(self, user_id: str, enabled: bool) -> Optional[Dict[str, Any]]:
        """
        Atualiza status enabled/disabled do 2FA.
        
        Args:
            user_id: ID do usuário
            enabled: Se está habilitado
        
        Returns:
            Configuração atualizada ou None
        """
        try:
            from datetime import datetime
            
            # Atualiza diretamente por user_id (não tem ID único na tabela)
            result = (
                self.db.table(self.table_name)
                .update({
                    'enabled': enabled,
                    'updated_at': datetime.now().isoformat()
                })
                .eq('user_id', user_id)
                .execute()
            )
            return result.data[0] if result.data else None
        except Exception as e:
            self.logger.error(f"Erro ao atualizar enabled do 2FA: {str(e)}")
            return None
    
    def update_backup_codes(self, user_id: str, backup_codes: str) -> Optional[Dict[str, Any]]:
        """
        Atualiza códigos de backup.
        
        Args:
            user_id: ID do usuário
            backup_codes: Códigos de backup (string separada por vírgula)
        
        Returns:
            Configuração atualizada ou None
        """
        try:
            from datetime import datetime
            
            result = (
                self.db.table(self.table_name)
                .update({
                    'backup_codes': backup_codes,
                    'updated_at': datetime.now().isoformat()
                })
                .eq('user_id', user_id)
                .execute()
            )
            
            return result.data[0] if result.data else None
        except Exception as e:
            self.logger.error(f"Erro ao atualizar backup codes: {str(e)}")
            return None
    
    def get_secret_key(self, user_id: str) -> Optional[str]:
        """
        Obtém chave secreta do usuário.
        
        Args:
            user_id: ID do usuário
        
        Returns:
            Chave secreta ou None
        """
        try:
            config = self.find_by_user(user_id)
            return config.get('secret_key') if config else None
        except Exception as e:
            self.logger.error(f"Erro ao buscar secret key: {str(e)}")
            return None
    
    def is_enabled(self, user_id: str) -> bool:
        """
        Verifica se 2FA está habilitado.
        
        Args:
            user_id: ID do usuário
        
        Returns:
            True se habilitado, False caso contrário
        """
        try:
            config = self.find_by_user(user_id)
            return bool(config.get('enabled', False)) if config else False
        except Exception as e:
            self.logger.error(f"Erro ao verificar se 2FA está habilitado: {str(e)}")
            return False
    
    def get_backup_codes(self, user_id: str) -> Optional[str]:
        """
        Obtém códigos de backup.
        
        Args:
            user_id: ID do usuário
        
        Returns:
            String com códigos separados por vírgula ou None
        """
        try:
            config = self.find_by_user(user_id)
            return config.get('backup_codes') if config else None
        except Exception as e:
            self.logger.error(f"Erro ao buscar backup codes: {str(e)}")
            return None
