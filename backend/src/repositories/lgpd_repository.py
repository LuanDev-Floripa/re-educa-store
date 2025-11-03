# -*- coding: utf-8 -*-
"""
Repositório de LGPD RE-EDUCA Store.

Gerencia acesso a dados de compliance LGPD.
"""
import logging
from typing import Dict, Any, List, Optional
from repositories.base_repository import BaseRepository

logger = logging.getLogger(__name__)


class LGPDRepository(BaseRepository):
    """
    Repositório para operações de compliance LGPD.
    
    Tabelas:
    - user_consents
    - data_access_logs
    - user_deletions
    """
    
    def __init__(self):
        """Inicializa o repositório de LGPD."""
        super().__init__('user_consents')
    
    def find_consents_by_user(self, user_id: str) -> List[Dict[str, Any]]:
        """
        Busca todos os consentimentos de um usuário.
        
        Args:
            user_id: ID do usuário
        
        Returns:
            Lista de consentimentos
        """
        try:
            return self.find_all(
                filters={'user_id': user_id},
                order_by='created_at',
                desc=True
            )
        except Exception as e:
            self.logger.error(f"Erro ao buscar consentimentos: {str(e)}")
            return []
    
    def find_consent_by_type(self, user_id: str, consent_type: str) -> Optional[Dict[str, Any]]:
        """
        Busca consentimento específico por tipo.
        
        Args:
            user_id: ID do usuário
            consent_type: Tipo de consentimento
        
        Returns:
            Consentimento ou None
        """
        try:
            result = self.find_all(
                filters={'user_id': user_id, 'consent_type': consent_type},
                limit=1
            )
            return result[0] if result else None
        except Exception as e:
            self.logger.error(f"Erro ao buscar consentimento: {str(e)}")
            return None
    
    def create_consent(self, consent_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Cria novo consentimento.
        
        Args:
            consent_data: Dados do consentimento
        
        Returns:
            Consentimento criado ou None
        """
        try:
            from utils.helpers import generate_uuid
            from datetime import datetime
            
            if 'id' not in consent_data:
                consent_data['id'] = generate_uuid()
            if 'created_at' not in consent_data:
                consent_data['created_at'] = datetime.now().isoformat()
            
            return self.create(consent_data)
        except Exception as e:
            self.logger.error(f"Erro ao criar consentimento: {str(e)}")
            return None
    
    def update_consent(self, consent_id: str, update_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Atualiza consentimento existente.
        
        Args:
            consent_id: ID do consentimento
            update_data: Dados para atualizar
        
        Returns:
            Consentimento atualizado ou None
        """
        try:
            from datetime import datetime
            
            if 'updated_at' not in update_data:
                update_data['updated_at'] = datetime.now().isoformat()
            
            return self.update(consent_id, update_data)
        except Exception as e:
            self.logger.error(f"Erro ao atualizar consentimento: {str(e)}")
            return None
    
    def create_access_log(self, log_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Cria log de acesso a dados.
        
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
            
            result = self.db.table('data_access_logs').insert(log_data).execute()
            return result.data[0] if result.data and len(result.data) > 0 else None
        except Exception as e:
            self.logger.error(f"Erro ao criar log de acesso: {str(e)}")
            return None
    
    def find_access_logs(
        self,
        accessed_user_id: str,
        limit: Optional[int] = None,
        offset: int = 0
    ) -> List[Dict[str, Any]]:
        """
        Busca logs de acesso.
        
        Args:
            accessed_user_id: ID do usuário acessado
            limit: Limite de resultados
            offset: Offset para paginação
        
        Returns:
            Lista de logs
        """
        try:
            query = (
                self.db.table('data_access_logs')
                .select('*')
                .eq('accessed_user_id', accessed_user_id)
                .order('created_at', desc=True)
            )
            
            if limit:
                query = query.range(offset, offset + limit - 1)
            
            result = query.execute()
            return result.data if result.data else []
        except Exception as e:
            self.logger.error(f"Erro ao buscar logs de acesso: {str(e)}")
            return []
    
    def count_access_logs(self, accessed_user_id: str) -> int:
        """
        Conta logs de acesso de um usuário.
        
        Args:
            accessed_user_id: ID do usuário
        
        Returns:
            Número de logs
        """
        try:
            result = (
                self.db.table('data_access_logs')
                .select('id', count='exact')
                .eq('accessed_user_id', accessed_user_id)
                .execute()
            )
            return result.count if hasattr(result, 'count') and result.count is not None else 0
        except Exception as e:
            self.logger.error(f"Erro ao contar logs: {str(e)}")
            return 0
    
    def create_deletion_record(self, deletion_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Cria registro de exclusão de conta.
        
        Args:
            deletion_data: Dados da exclusão
        
        Returns:
            Registro criado ou None
        """
        try:
            from utils.helpers import generate_uuid
            from datetime import datetime
            
            if 'id' not in deletion_data:
                deletion_data['id'] = generate_uuid()
            if 'created_at' not in deletion_data:
                deletion_data['created_at'] = datetime.now().isoformat()
            
            result = self.db.table('user_deletions').insert(deletion_data).execute()
            return result.data[0] if result.data and len(result.data) > 0 else None
        except Exception as e:
            self.logger.error(f"Erro ao criar registro de exclusão: {str(e)}")
            return None
    
    def get_table_data_by_user(self, user_id: str, table_name: str) -> List[Dict[str, Any]]:
        """
        Busca dados de uma tabela relacionada ao usuário (método genérico).
        
        Args:
            user_id: ID do usuário
            table_name: Nome da tabela
        
        Returns:
            Lista de dados
        """
        try:
            result = (
                self.db.table(table_name)
                .select('*')
                .eq('user_id', user_id)
                .execute()
            )
            return result.data if result.data else []
        except Exception as e:
            self.logger.warning(f"Erro ao buscar {table_name}: {str(e)}")
            return []
