# -*- coding: utf-8 -*-
"""
Repositório de Rotação de Chaves de IA RE-EDUCA Store.

Gerencia acesso a dados de rotação de chaves e configurações de segurança.
"""
import logging
from typing import Dict, Any, List, Optional
from repositories.base_repository import BaseRepository

logger = logging.getLogger(__name__)


class AIKeyRotationRepository(BaseRepository):
    """
    Repositório para operações de rotação de chaves de IA.
    
    Tabelas:
    - ai_key_rotation_logs
    - ai_security_settings
    """
    
    def __init__(self):
        """Inicializa o repositório de rotação de chaves."""
        super().__init__('ai_key_rotation_logs')
    
    def create_rotation_log(self, log_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Cria log de rotação de chave.
        
        Args:
            log_data: Dados do log
        
        Returns:
            Log criado ou None
        """
        try:
            from utils.helpers import generate_uuid
            from datetime import datetime
            
            if 'id' not in log_data:
                log_data['id'] = generate_uuid()
            if 'rotated_at' not in log_data:
                log_data['rotated_at'] = datetime.now().isoformat()
            
            result = self.db.table(self.table_name).insert(log_data).execute()
            return result.data[0] if result.data and len(result.data) > 0 else None
        except Exception as e:
            self.logger.error(f"Erro ao criar log de rotação: {str(e)}")
            return None
    
    def find_rotation_logs(
        self,
        config_id: Optional[str] = None,
        limit: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        """
        Busca logs de rotação.
        
        Args:
            config_id: ID da configuração (opcional)
            limit: Limite de resultados
        
        Returns:
            Lista de logs
        """
        try:
            filters = {}
            if config_id:
                filters['original_config_id'] = config_id
            
            result = (
                self.db.table(self.table_name)
                .select('*')
            )
            
            if config_id:
                result = result.eq('original_config_id', config_id)
            
            result = result.order('rotated_at', desc=True)
            
            if limit:
                result = result.limit(limit)
            
            query_result = result.execute()
            return query_result.data if query_result.data else []
        except Exception as e:
            self.logger.error(f"Erro ao buscar logs de rotação: {str(e)}")
            return []
    
    def get_security_settings(self) -> Dict[str, Any]:
        """
        Busca configurações de segurança.
        
        Returns:
            Dict com configurações
        """
        try:
            result = self.db.table('ai_security_settings').select('*').execute()
            
            if result.data:
                settings = {}
                for setting in result.data:
                    key = setting.get('setting_key')
                    value = setting.get('setting_value')
                    
                    # Tenta converter para tipo apropriado
                    if value:
                        if value.lower() == 'true':
                            value = True
                        elif value.lower() == 'false':
                            value = False
                        elif value.isdigit():
                            value = int(value)
                        else:
                            try:
                                value = float(value)
                            except ValueError:
                                pass
                    
                    settings[key] = value
                
                return settings
            return {}
        except Exception as e:
            self.logger.warning(f"Erro ao buscar configurações de segurança: {str(e)}")
            return {}
    
    def update_security_setting(self, key: str, value: Any) -> bool:
        """
        Atualiza configuração de segurança.
        
        Args:
            key: Chave da configuração
            value: Valor
        
        Returns:
            True se atualizado, False caso contrário
        """
        try:
            from datetime import datetime
            
            result = (
                self.db.table('ai_security_settings')
                .update({
                    'setting_value': str(value),
                    'updated_at': datetime.now().isoformat()
                })
                .eq('setting_key', key)
                .execute()
            )
            
            return result.data is not None and len(result.data) > 0
        except Exception as e:
            self.logger.error(f"Erro ao atualizar configuração: {str(e)}")
            return False
