"""
Repositório de Relatórios RE-EDUCA Store.

Gerencia acesso a dados de relatórios agendados.
"""

import logging
from typing import Any, Dict, List, Optional

from repositories.base_repository import BaseRepository

logger = logging.getLogger(__name__)


class ReportRepository(BaseRepository):
    """
    Repositório para operações com relatórios agendados.
    
    Tabela: report_schedules
    """

    def __init__(self):
        """Inicializa o repositório de relatórios."""
        super().__init__("report_schedules")

    def create_schedule(self, schedule_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Cria novo agendamento de relatório.
        
        Args:
            schedule_data: Dados do agendamento
            
        Returns:
            Agendamento criado ou None
        """
        try:
            from datetime import datetime
            from utils.helpers import generate_uuid

            if "id" not in schedule_data:
                schedule_data["id"] = generate_uuid()
            if "created_at" not in schedule_data:
                schedule_data["created_at"] = datetime.now().isoformat()

            return self.create(schedule_data)
        except Exception as e:
            self.logger.error(f"Erro ao criar agendamento: {str(e)}", exc_info=True)
            return None

    def find_all_schedules(self, active_only: bool = False) -> List[Dict[str, Any]]:
        """
        Busca todos os agendamentos.
        
        Args:
            active_only: Se True, retorna apenas agendamentos ativos
            
        Returns:
            Lista de agendamentos
        """
        try:
            query = self.db.table(self.table_name).select("*").order("created_at", desc=True)

            if active_only:
                query = query.eq("is_active", True)

            result = query.execute()
            return result.data if result.data else []
        except Exception as e:
            self.logger.error(f"Erro ao buscar agendamentos: {str(e)}", exc_info=True)
            return []

    def update_schedule(self, schedule_id: str, update_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Atualiza agendamento.
        
        Args:
            schedule_id: ID do agendamento
            update_data: Dados para atualizar
            
        Returns:
            Agendamento atualizado ou None
        """
        try:
            from datetime import datetime

            update_data["updated_at"] = datetime.now().isoformat()
            return self.update(schedule_id, update_data)
        except Exception as e:
            self.logger.error(f"Erro ao atualizar agendamento: {str(e)}", exc_info=True)
            return None

    def find_by_frequency(self, frequency: str) -> List[Dict[str, Any]]:
        """
        Busca agendamentos por frequência.
        
        Args:
            frequency: Frequência (daily, weekly, monthly)
            
        Returns:
            Lista de agendamentos
        """
        try:
            result = (
                self.db.table(self.table_name)
                .select("*")
                .eq("frequency", frequency)
                .eq("is_active", True)
                .execute()
            )
            return result.data if result.data else []
        except Exception as e:
            self.logger.error(f"Erro ao buscar agendamentos por frequência: {str(e)}", exc_info=True)
            return []
