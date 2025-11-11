"""
Repositório de Moderação Social RE-EDUCA Store.
"""
import logging
from typing import Any, Dict, List, Optional
from datetime import datetime

from repositories.base_repository import BaseRepository

logger = logging.getLogger(__name__)


class SocialModerationRepository(BaseRepository):
    """Repositório para moderação social."""
    
    def __init__(self):
        super().__init__("social_reports")
        self.reports_table = "social_reports"
        self.banned_table = "banned_users"
        self.history_table = "moderation_history"
    
    def create_report(self, report_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Cria um novo report."""
        try:
            response = self.db.table(self.reports_table).insert(report_data).execute()
            if response.data and len(response.data) > 0:
                return response.data[0]
            return None
        except Exception as e:
            self.logger.error(f"Erro ao criar report: {str(e)}", exc_info=True)
            return None
    
    def get_reports(
        self,
        status: Optional[str] = None,
        report_type: Optional[str] = None,
        page: int = 1,
        per_page: int = 20
    ) -> Dict[str, Any]:
        """Busca reports com filtros."""
        try:
            query = self.db.table(self.reports_table).select("*", count="exact")
            
            if status:
                query = query.eq("status", status)
            if report_type:
                query = query.eq("report_type", report_type)
            
            query = query.order("created_at", desc=True)
            
            offset = (page - 1) * per_page
            query = query.range(offset, offset + per_page - 1)
            
            response = query.execute()
            
            return {
                "reports": response.data or [],
                "total": response.count or 0,
                "page": page,
                "per_page": per_page,
                "pages": (response.count + per_page - 1) // per_page if response.count else 0
            }
        except Exception as e:
            self.logger.error(f"Erro ao buscar reports: {str(e)}", exc_info=True)
            return {"reports": [], "total": 0, "page": page, "per_page": per_page, "pages": 0}
    
    def update_report_status(
        self,
        report_id: str,
        status: str,
        reviewed_by: str,
        resolution_note: Optional[str] = None
    ) -> Optional[Dict[str, Any]]:
        """Atualiza status de um report."""
        try:
            update_data = {
                "status": status,
                "reviewed_by": reviewed_by,
                "reviewed_at": datetime.now().isoformat(),
                "updated_at": datetime.now().isoformat()
            }
            if resolution_note:
                update_data["resolution_note"] = resolution_note
            
            response = self.db.table(self.reports_table).update(update_data).eq("id", report_id).execute()
            
            if response.data and len(response.data) > 0:
                return response.data[0]
            return None
        except Exception as e:
            self.logger.error(f"Erro ao atualizar report: {str(e)}", exc_info=True)
            return None
    
    def ban_user(
        self,
        user_id: str,
        banned_by: str,
        reason: str,
        ban_type: str = "temporary",
        expires_at: Optional[str] = None
    ) -> Optional[Dict[str, Any]]:
        """Bane um usuário."""
        try:
            ban_data = {
                "user_id": user_id,
                "banned_by": banned_by,
                "reason": reason,
                "ban_type": ban_type,
                "is_active": True,
                "created_at": datetime.now().isoformat(),
                "updated_at": datetime.now().isoformat()
            }
            if expires_at:
                ban_data["expires_at"] = expires_at
            
            # Se já existe ban ativo, atualizar; senão, criar novo
            existing = self.db.table(self.banned_table).select("*").eq("user_id", user_id).eq("is_active", True).execute()
            
            if existing.data and len(existing.data) > 0:
                response = self.db.table(self.banned_table).update(ban_data).eq("id", existing.data[0]["id"]).execute()
            else:
                response = self.db.table(self.banned_table).insert(ban_data).execute()
            
            if response.data and len(response.data) > 0:
                return response.data[0]
            return None
        except Exception as e:
            self.logger.error(f"Erro ao banir usuário: {str(e)}", exc_info=True)
            return None
    
    def unban_user(self, user_id: str) -> bool:
        """Remove ban de um usuário."""
        try:
            response = self.db.table(self.banned_table).update({
                "is_active": False,
                "updated_at": datetime.now().isoformat()
            }).eq("user_id", user_id).eq("is_active", True).execute()
            
            return len(response.data) > 0 if response.data else False
        except Exception as e:
            self.logger.error(f"Erro ao desbanir usuário: {str(e)}", exc_info=True)
            return False
    
    def get_banned_users(self, page: int = 1, per_page: int = 20) -> Dict[str, Any]:
        """Busca usuários banidos."""
        try:
            query = self.db.table(self.banned_table).select("*", count="exact").eq("is_active", True)
            query = query.order("created_at", desc=True)
            
            offset = (page - 1) * per_page
            query = query.range(offset, offset + per_page - 1)
            
            response = query.execute()
            
            return {
                "banned_users": response.data or [],
                "total": response.count or 0,
                "page": page,
                "per_page": per_page,
                "pages": (response.count + per_page - 1) // per_page if response.count else 0
            }
        except Exception as e:
            self.logger.error(f"Erro ao buscar usuários banidos: {str(e)}", exc_info=True)
            return {"banned_users": [], "total": 0, "page": page, "per_page": per_page, "pages": 0}
    
    def is_user_banned(self, user_id: str) -> bool:
        """Verifica se usuário está banido."""
        try:
            response = self.db.table(self.banned_table).select("id").eq("user_id", user_id).eq("is_active", True).execute()
            if response.data:
                # Verificar se ban permanente ou ainda não expirou
                for ban in response.data:
                    if ban.get("ban_type") == "permanent":
                        return True
                    if ban.get("expires_at"):
                        expires_at = datetime.fromisoformat(ban["expires_at"].replace("Z", "+00:00"))
                        if expires_at > datetime.now(expires_at.tzinfo):
                            return True
            return False
        except Exception as e:
            self.logger.error(f"Erro ao verificar ban: {str(e)}", exc_info=True)
            return False
    
    def add_moderation_history(
        self,
        moderator_id: str,
        action_type: str,
        target_type: str,
        target_id: str,
        reason: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None
    ) -> Optional[Dict[str, Any]]:
        """Adiciona entrada no histórico de moderação."""
        try:
            history_data = {
                "moderator_id": moderator_id,
                "action_type": action_type,
                "target_type": target_type,
                "target_id": target_id,
                "reason": reason,
                "details": details or {},
                "created_at": datetime.now().isoformat()
            }
            
            response = self.db.table(self.history_table).insert(history_data).execute()
            
            if response.data and len(response.data) > 0:
                return response.data[0]
            return None
        except Exception as e:
            self.logger.error(f"Erro ao adicionar histórico: {str(e)}", exc_info=True)
            return None
    
    def get_moderation_history(
        self,
        moderator_id: Optional[str] = None,
        target_type: Optional[str] = None,
        page: int = 1,
        per_page: int = 20
    ) -> Dict[str, Any]:
        """Busca histórico de moderação."""
        try:
            query = self.db.table(self.history_table).select("*", count="exact")
            
            if moderator_id:
                query = query.eq("moderator_id", moderator_id)
            if target_type:
                query = query.eq("target_type", target_type)
            
            query = query.order("created_at", desc=True)
            
            offset = (page - 1) * per_page
            query = query.range(offset, offset + per_page - 1)
            
            response = query.execute()
            
            return {
                "history": response.data or [],
                "total": response.count or 0,
                "page": page,
                "per_page": per_page,
                "pages": (response.count + per_page - 1) // per_page if response.count else 0
            }
        except Exception as e:
            self.logger.error(f"Erro ao buscar histórico: {str(e)}", exc_info=True)
            return {"history": [], "total": 0, "page": page, "per_page": per_page, "pages": 0}
