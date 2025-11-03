"""
Repositório de Metas (Goals) RE-EDUCA Store.

Gerencia acesso a dados de metas de usuários (user_goals).
"""
import logging
from typing import Dict, Any, List, Optional
from repositories.base_repository import BaseRepository

logger = logging.getLogger(__name__)


class GoalRepository(BaseRepository):
    """
    Repositório para operações com metas de usuários.
    
    Tabela: user_goals
    """
    
    def __init__(self):
        """Inicializa o repositório de metas."""
        super().__init__('user_goals')
    
    def find_by_user(self, user_id: str, is_active: Optional[bool] = None) -> List[Dict[str, Any]]:
        """
        Busca metas de um usuário.
        
        Args:
            user_id: ID do usuário
            is_active: Filtrar por status ativo (True/False/None para todos)
        
        Returns:
            Lista de metas do usuário
        """
        try:
            filters = {'user_id': user_id}
            if is_active is not None:
                filters['is_active'] = is_active
            
            return self.find_all(
                filters=filters,
                order_by='created_at',
                desc=True
            )
        except Exception as e:
            self.logger.error(f"Erro ao buscar metas do usuário {user_id}: {str(e)}")
            return []
    
    def find_active_by_user(self, user_id: str) -> List[Dict[str, Any]]:
        """
        Busca apenas metas ativas de um usuário.
        
        Args:
            user_id: ID do usuário
        
        Returns:
            Lista de metas ativas
        """
        return self.find_by_user(user_id, is_active=True)
    
    def update_progress(self, goal_id: str, progress: int) -> Optional[Dict[str, Any]]:
        """
        Atualiza progresso de uma meta.
        
        Args:
            goal_id: ID da meta
            progress: Novo valor de progresso
        
        Returns:
            Meta atualizada ou None
        """
        try:
            return self.update(goal_id, {
                'progress': progress,
                'updated_at': self._get_current_timestamp()
            })
        except Exception as e:
            self.logger.error(f"Erro ao atualizar progresso da meta {goal_id}: {str(e)}")
            return None
    
    def deactivate(self, goal_id: str) -> Optional[Dict[str, Any]]:
        """
        Desativa uma meta (soft delete).
        
        Args:
            goal_id: ID da meta
        
        Returns:
            Meta desativada ou None
        """
        try:
            return self.update(goal_id, {
                'is_active': False,
                'updated_at': self._get_current_timestamp()
            })
        except Exception as e:
            self.logger.error(f"Erro ao desativar meta {goal_id}: {str(e)}")
            return None
    
    def _get_current_timestamp(self) -> str:
        """Retorna timestamp atual em ISO format."""
        from datetime import datetime
        return datetime.utcnow().isoformat()
