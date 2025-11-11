"""
Serviço de Logs e Auditoria Administrativa RE-EDUCA Store.

Gerencia logs de atividades de usuários e eventos de segurança.
"""
import logging
from datetime import datetime
from typing import Any, Dict, List, Optional

from repositories.base_repository import BaseRepository
from services.base_service import BaseService

logger = logging.getLogger(__name__)


class AdminLogsRepository(BaseRepository):
    """Repositório para logs administrativos."""
    
    def __init__(self):
        super().__init__("admin_activity_logs")  # table_name padrão
        self.activity_table = "admin_activity_logs"
        self.security_table = "admin_security_logs"
        # Usar self.db do BaseRepository
        self.supabase = self.db
    
    def get_activity_logs(
        self,
        user_id: Optional[str] = None,
        activity_type: Optional[str] = None,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        page: int = 1,
        per_page: int = 20
    ) -> Dict[str, Any]:
        """Busca logs de atividades."""
        try:
            query = self.supabase.table(self.activity_table).select("*", count="exact")
            
            if user_id:
                query = query.eq("user_id", user_id)
            if activity_type:
                query = query.eq("activity_type", activity_type)
            if start_date:
                query = query.gte("created_at", start_date)
            if end_date:
                query = query.lte("created_at", end_date)
            
            query = query.order("created_at", desc=True)
            
            # Paginação
            offset = (page - 1) * per_page
            query = query.range(offset, offset + per_page - 1)
            
            response = query.execute()
            
            return {
                "logs": response.data or [],
                "total": response.count or 0,
                "page": page,
                "per_page": per_page,
                "pages": (response.count + per_page - 1) // per_page if response.count else 0
            }
        except Exception as e:
            logger.error(f"Erro ao buscar logs de atividades: {str(e)}", exc_info=True)
            return {"logs": [], "total": 0, "page": page, "per_page": per_page, "pages": 0}
    
    def get_security_logs(
        self,
        user_id: Optional[str] = None,
        event_type: Optional[str] = None,
        severity: Optional[str] = None,
        resolved: Optional[bool] = None,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        page: int = 1,
        per_page: int = 20
    ) -> Dict[str, Any]:
        """Busca logs de segurança."""
        try:
            query = self.supabase.table(self.security_table).select("*", count="exact")
            
            if user_id:
                query = query.eq("user_id", user_id)
            if event_type:
                query = query.eq("event_type", event_type)
            if severity:
                query = query.eq("severity", severity)
            if resolved is not None:
                query = query.eq("resolved", resolved)
            if start_date:
                query = query.gte("created_at", start_date)
            if end_date:
                query = query.lte("created_at", end_date)
            
            query = query.order("created_at", desc=True)
            
            # Paginação
            offset = (page - 1) * per_page
            query = query.range(offset, offset + per_page - 1)
            
            response = query.execute()
            
            return {
                "logs": response.data or [],
                "total": response.count or 0,
                "page": page,
                "per_page": per_page,
                "pages": (response.count + per_page - 1) // per_page if response.count else 0
            }
        except Exception as e:
            logger.error(f"Erro ao buscar logs de segurança: {str(e)}", exc_info=True)
            return {"logs": [], "total": 0, "page": page, "per_page": per_page, "pages": 0}
    
    def resolve_security_log(self, log_id: str, resolved_by: Optional[str] = None) -> Dict[str, Any]:
        """Marca log de segurança como resolvido."""
        try:
            update_data = {
                "resolved": True,
                "resolved_at": datetime.now().isoformat()
            }
            if resolved_by:
                update_data["resolved_by"] = resolved_by
            
            response = self.supabase.table(self.security_table).update(update_data).eq("id", log_id).execute()
            
            if response.data:
                return {"success": True, "log": response.data[0]}
            else:
                return {"success": False, "error": "Log não encontrado"}
        except Exception as e:
            logger.error(f"Erro ao resolver log de segurança: {str(e)}", exc_info=True)
            return {"success": False, "error": str(e)}


class AdminLogsService(BaseService):
    """Service para logs e auditoria administrativa."""
    
    def __init__(self):
        super().__init__()
        self.repo = AdminLogsRepository()
    
    def get_activity_logs(
        self,
        user_id: Optional[str] = None,
        activity_type: Optional[str] = None,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        page: int = 1,
        per_page: int = 20
    ) -> Dict[str, Any]:
        """Busca logs de atividades."""
        return self.repo.get_activity_logs(
            user_id=user_id,
            activity_type=activity_type,
            start_date=start_date,
            end_date=end_date,
            page=page,
            per_page=per_page
        )
    
    def get_security_logs(
        self,
        user_id: Optional[str] = None,
        event_type: Optional[str] = None,
        severity: Optional[str] = None,
        resolved: Optional[bool] = None,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        page: int = 1,
        per_page: int = 20
    ) -> Dict[str, Any]:
        """Busca logs de segurança."""
        return self.repo.get_security_logs(
            user_id=user_id,
            event_type=event_type,
            severity=severity,
            resolved=resolved,
            start_date=start_date,
            end_date=end_date,
            page=page,
            per_page=per_page
        )
    
    def resolve_security_log(self, log_id: str, resolved_by: Optional[str] = None) -> Dict[str, Any]:
        """Marca log de segurança como resolvido."""
        return self.repo.resolve_security_log(log_id, resolved_by)
    
    def get_logs_stats(
        self,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None
    ) -> Dict[str, Any]:
        """Retorna estatísticas de logs."""
        try:
            activity_logs = self.repo.get_activity_logs(
                start_date=start_date,
                end_date=end_date,
                page=1,
                per_page=1
            )
            
            security_logs = self.repo.get_security_logs(
                start_date=start_date,
                end_date=end_date,
                page=1,
                per_page=1
            )
            
            unresolved_security = self.repo.get_security_logs(
                resolved=False,
                start_date=start_date,
                end_date=end_date,
                page=1,
                per_page=1
            )
            
            return {
                "success": True,
                "stats": {
                    "total_activity_logs": activity_logs.get("total", 0),
                    "total_security_logs": security_logs.get("total", 0),
                    "unresolved_security_logs": unresolved_security.get("total", 0),
                    "period": {
                        "start_date": start_date,
                        "end_date": end_date
                    }
                }
            }
        except Exception as e:
            logger.error(f"Erro ao buscar estatísticas de logs: {str(e)}", exc_info=True)
            return {"success": False, "error": str(e)}
