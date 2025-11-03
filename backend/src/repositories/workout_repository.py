"""
Repositório de Sessões de Treino RE-EDUCA Store.

Gerencia acesso a dados de sessões de treino (workout_sessions e weekly_workout_sessions).
"""
import logging
from typing import Dict, Any, List, Optional
from repositories.base_repository import BaseRepository

logger = logging.getLogger(__name__)


class WorkoutRepository(BaseRepository):
    """
    Repositório para operações com sessões de treino.
    
    Tabelas:
    - workout_sessions (sessões simples)
    - weekly_workout_sessions (sessões semanais com plano)
    """
    
    def __init__(self):
        """Inicializa o repositório de treinos."""
        super().__init__('workout_sessions')  # Tabela padrão
    
    def find_by_user(self, user_id: str, limit: Optional[int] = None) -> List[Dict[str, Any]]:
        """
        Busca sessões de treino de um usuário.
        
        Args:
            user_id: ID do usuário
            limit: Limite de resultados
        
        Returns:
            Lista de sessões de treino
        """
        try:
            return self.find_all(
                filters={'user_id': user_id},
                order_by='created_at',
                desc=True,
                limit=limit
            )
        except Exception as e:
            self.logger.error(f"Erro ao buscar sessões do usuário {user_id}: {str(e)}")
            return []
    
    def find_weekly_sessions(
        self,
        user_id: str,
        plan_id: Optional[str] = None,
        week_number: Optional[int] = None,
        status: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Busca sessões semanais de treino.
        
        Args:
            user_id: ID do usuário
            plan_id: ID do plano (opcional)
            week_number: Número da semana (opcional)
            status: Status da sessão (opcional)
        
        Returns:
            Lista de sessões semanais
        """
        try:
            # Usa tabela weekly_workout_sessions
            filters = {'user_id': user_id}
            if plan_id:
                filters['plan_id'] = plan_id
            if week_number:
                filters['week_number'] = week_number
            if status:
                filters['status'] = status
            
            # Busca na tabela weekly_workout_sessions
            query = self.db.table('weekly_workout_sessions').select('*')
            
            for field, value in filters.items():
                query = query.eq(field, value)
            
            query = query.order('scheduled_date', desc=True)
            
            result = query.execute()
            return result.data if result.data else []
            
        except Exception as e:
            self.logger.error(f"Erro ao buscar sessões semanais: {str(e)}")
            return []
    
    def find_recent(self, user_id: str, limit: int = 5) -> List[Dict[str, Any]]:
        """
        Busca sessões recentes de um usuário.
        
        Args:
            user_id: ID do usuário
            limit: Número de sessões
        
        Returns:
            Lista de sessões recentes
        """
        return self.find_by_user(user_id, limit=limit)
    
    def create_workout_session(self, session_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Cria uma nova sessão de treino.
        
        Args:
            session_data: Dados da sessão
        
        Returns:
            Sessão criada ou None
        """
        try:
            return self.create(session_data)
        except Exception as e:
            self.logger.error(f"Erro ao criar sessão: {str(e)}")
            return None
    
    def update_session_status(
        self,
        session_id: str,
        status: str,
        completed_at: Optional[str] = None
    ) -> Optional[Dict[str, Any]]:
        """
        Atualiza status de uma sessão.
        
        Args:
            session_id: ID da sessão
            status: Novo status
            completed_at: Data de conclusão (opcional)
        
        Returns:
            Sessão atualizada ou None
        """
        try:
            update_data = {
                'status': status,
                'updated_at': self._get_current_timestamp()
            }
            if completed_at:
                update_data['completed_at'] = completed_at
            
            # Verifica se é sessão semanal ou simples
            if self._is_weekly_session(session_id):
                result = self.db.table('weekly_workout_sessions').update(update_data).eq('id', session_id).execute()
            else:
                result = self.db.table('workout_sessions').update(update_data).eq('id', session_id).execute()
            
            if result.data and len(result.data) > 0:
                return result.data[0]
            return None
            
        except Exception as e:
            self.logger.error(f"Erro ao atualizar status da sessão {session_id}: {str(e)}")
            return None
    
    def get_weekly_session_day(self, session_id: str) -> Optional[int]:
        """
        Busca dia da semana de uma sessão semanal.
        
        Args:
            session_id: ID da sessão
        
        Returns:
            Dia da semana (0-6) ou None
        """
        try:
            result = (
                self.db.table('weekly_workout_sessions')
                .select('day_of_week')
                .eq('id', session_id)
                .single()
                .execute()
            )
            if result.data:
                return result.data.get('day_of_week')
            return None
        except Exception as e:
            self.logger.warning(f"Erro ao buscar dia da sessão: {str(e)}")
            return None
    
    def get_session_exercise_progress(self, session_id: str) -> List[Dict[str, Any]]:
        """
        Busca progresso de exercícios de uma sessão.
        
        Args:
            session_id: ID da sessão
        
        Returns:
            Lista de progressos de exercícios
        """
        try:
            result = (
                self.db.table('session_exercise_progress')
                .select('*, exercises(*)')
                .eq('session_id', session_id)
                .execute()
            )
            return result.data if result.data else []
        except Exception as e:
            self.logger.warning(f"Erro ao buscar progresso: {str(e)}")
            return []
    
    def _is_weekly_session(self, session_id: str) -> bool:
        """Verifica se é uma sessão semanal."""
        try:
            result = self.db.table('weekly_workout_sessions').select('id').eq('id', session_id).execute()
            return result.data and len(result.data) > 0
        except Exception:
            return False
    
    def _get_current_timestamp(self) -> str:
        """Retorna timestamp atual em ISO format."""
        from datetime import datetime
        return datetime.utcnow().isoformat()
