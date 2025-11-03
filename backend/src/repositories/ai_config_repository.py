# -*- coding: utf-8 -*-
"""
Repositório de Configurações de IA RE-EDUCA Store.

Gerencia acesso a dados de configurações e uso de IA.
"""
import logging
from typing import Dict, Any, List, Optional
from repositories.base_repository import BaseRepository

logger = logging.getLogger(__name__)


class AIConfigRepository(BaseRepository):
    """
    Repositório para operações com configurações de IA.
    
    Tabela: ai_configurations
    """
    
    def __init__(self):
        """Inicializa o repositório de configurações de IA."""
        super().__init__('ai_configurations')
    
    def find_by_provider(
        self,
        provider: str,
        service_name: Optional[str] = None,
        is_active: bool = True,
        is_default: Optional[bool] = None
    ) -> Optional[Dict[str, Any]]:
        """
        Busca configuração por provider.
        
        Args:
            provider: Nome do provider
            service_name: Nome do serviço (opcional)
            is_active: Se deve filtrar apenas ativas
            is_default: Se deve buscar apenas padrão
        
        Returns:
            Configuração ou None
        """
        try:
            filters = {'provider': provider}
            if is_active:
                filters['is_active'] = True
            if service_name:
                filters['service_name'] = service_name
            elif is_default is not None:
                filters['is_default'] = is_default
            
            result = self.find_all(filters=filters, limit=1)
            return result[0] if result else None
        except Exception as e:
            self.logger.error(f"Erro ao buscar configuração por provider: {str(e)}")
            return None
    
    def find_active(self, include_inactive: bool = False) -> List[Dict[str, Any]]:
        """
        Lista todas as configurações.
        
        Args:
            include_inactive: Se deve incluir inativas
        
        Returns:
            Lista de configurações
        """
        try:
            filters = {}
            if not include_inactive:
                filters['is_active'] = True
            
            return self.find_all(
                filters=filters,
                order_by='created_at',
                desc=True
            )
        except Exception as e:
            self.logger.error(f"Erro ao listar configurações: {str(e)}")
            return []
    
    def update_usage_count(self, config_id: str) -> Optional[Dict[str, Any]]:
        """
        Atualiza contador de uso.
        
        Args:
            config_id: ID da configuração
        
        Returns:
            Configuração atualizada ou None
        """
        try:
            from datetime import datetime
            
            # Busca configuração atual
            config = self.find_by_id(config_id)
            if not config:
                return None
            
            new_count = (config.get('usage_count', 0) or 0) + 1
            
            return self.update(config_id, {
                'usage_count': new_count,
                'last_used_at': datetime.now().isoformat()
            })
        except Exception as e:
            self.logger.warning(f"Erro ao atualizar contador de uso: {str(e)}")
            return None
    
    def create_usage_log(self, log_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Cria log de uso de IA.
        
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
            if 'created_at' not in log_data:
                log_data['created_at'] = datetime.now().isoformat()
            
            result = self.db.table('ai_usage_logs').insert(log_data).execute()
            return result.data[0] if result.data and len(result.data) > 0 else None
        except Exception as e:
            self.logger.error(f"Erro ao criar log de uso: {str(e)}")
            return None
