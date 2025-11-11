"""
Serviço de Moderação Social RE-EDUCA Store.
"""
import logging
from typing import Any, Dict, List, Optional

from repositories.social_moderation_repository import SocialModerationRepository
from services.base_service import BaseService

logger = logging.getLogger(__name__)


class SocialModerationService(BaseService):
    """Service para moderação social."""
    
    def __init__(self):
        super().__init__()
        self.repo = SocialModerationRepository()
    
    def create_report(
        self,
        reporter_id: str,
        report_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Cria um novo report."""
        try:
            report_data_to_save = {
                "reporter_id": reporter_id,
                "reported_user_id": report_data.get("reported_user_id"),
                "post_id": report_data.get("post_id"),
                "comment_id": report_data.get("comment_id"),
                "report_type": report_data.get("report_type", "other"),
                "reason": report_data.get("reason", ""),
                "status": "pending"
            }
            
            created = self.repo.create_report(report_data_to_save)
            
            if created:
                return {"success": True, "report": created}
            else:
                return {"success": False, "error": "Erro ao criar report"}
        except Exception as e:
            self.logger.error(f"Erro ao criar report: {str(e)}", exc_info=True)
            return {"success": False, "error": str(e)}
    
    def get_reports(
        self,
        status: Optional[str] = None,
        report_type: Optional[str] = None,
        page: int = 1,
        per_page: int = 20
    ) -> Dict[str, Any]:
        """Busca reports."""
        return self.repo.get_reports(status=status, report_type=report_type, page=page, per_page=per_page)
    
    def resolve_report(
        self,
        report_id: str,
        moderator_id: str,
        status: str,
        resolution_note: Optional[str] = None,
        action_taken: Optional[str] = None
    ) -> Dict[str, Any]:
        """Resolve um report."""
        try:
            # Buscar report
            report = self.repo.find_by_id(report_id)
            if not report:
                return {"success": False, "error": "Report não encontrado"}
            
            # Atualizar status
            updated = self.repo.update_report_status(
                report_id=report_id,
                status=status,
                reviewed_by=moderator_id,
                resolution_note=resolution_note
            )
            
            if updated:
                # Adicionar ao histórico
                self.repo.add_moderation_history(
                    moderator_id=moderator_id,
                    action_type="report_resolved",
                    target_type="report",
                    target_id=report_id,
                    reason=resolution_note,
                    details={"action_taken": action_taken, "original_status": report.get("status")}
                )
                
                return {"success": True, "report": updated}
            else:
                return {"success": False, "error": "Erro ao atualizar report"}
        except Exception as e:
            self.logger.error(f"Erro ao resolver report: {str(e)}", exc_info=True)
            return {"success": False, "error": str(e)}
    
    def ban_user(
        self,
        user_id: str,
        moderator_id: str,
        reason: str,
        ban_type: str = "temporary",
        expires_at: Optional[str] = None
    ) -> Dict[str, Any]:
        """Bane um usuário."""
        try:
            banned = self.repo.ban_user(
                user_id=user_id,
                banned_by=moderator_id,
                reason=reason,
                ban_type=ban_type,
                expires_at=expires_at
            )
            
            if banned:
                # Adicionar ao histórico
                self.repo.add_moderation_history(
                    moderator_id=moderator_id,
                    action_type="user_banned",
                    target_type="user",
                    target_id=user_id,
                    reason=reason,
                    details={"ban_type": ban_type, "expires_at": expires_at}
                )
                
                return {"success": True, "banned_user": banned}
            else:
                return {"success": False, "error": "Erro ao banir usuário"}
        except Exception as e:
            self.logger.error(f"Erro ao banir usuário: {str(e)}", exc_info=True)
            return {"success": False, "error": str(e)}
    
    def unban_user(self, user_id: str, moderator_id: str) -> Dict[str, Any]:
        """Remove ban de um usuário."""
        try:
            success = self.repo.unban_user(user_id)
            
            if success:
                # Adicionar ao histórico
                self.repo.add_moderation_history(
                    moderator_id=moderator_id,
                    action_type="user_unbanned",
                    target_type="user",
                    target_id=user_id,
                    reason="Ban removido"
                )
                
                return {"success": True, "message": "Usuário desbanido com sucesso"}
            else:
                return {"success": False, "error": "Usuário não está banido ou erro ao desbanir"}
        except Exception as e:
            self.logger.error(f"Erro ao desbanir usuário: {str(e)}", exc_info=True)
            return {"success": False, "error": str(e)}
    
    def get_banned_users(self, page: int = 1, per_page: int = 20) -> Dict[str, Any]:
        """Busca usuários banidos."""
        return self.repo.get_banned_users(page=page, per_page=per_page)
    
    def delete_post(self, post_id: str, moderator_id: str, reason: str) -> Dict[str, Any]:
        """Deleta um post (moderação)."""
        try:
            from repositories.social_repository import SocialRepository
            social_repo = SocialRepository()
            
            deleted = social_repo.delete(post_id)
            
            if deleted:
                # Adicionar ao histórico
                self.repo.add_moderation_history(
                    moderator_id=moderator_id,
                    action_type="post_deleted",
                    target_type="post",
                    target_id=post_id,
                    reason=reason
                )
                
                return {"success": True, "message": "Post deletado com sucesso"}
            else:
                return {"success": False, "error": "Post não encontrado"}
        except Exception as e:
            self.logger.error(f"Erro ao deletar post: {str(e)}", exc_info=True)
            return {"success": False, "error": str(e)}
    
    def delete_comment(self, comment_id: str, moderator_id: str, reason: str) -> Dict[str, Any]:
        """Deleta um comentário (moderação)."""
        try:
            from config.database import supabase_client
            
            response = supabase_client.table("comments").delete().eq("id", comment_id).execute()
            
            if response.data:
                # Adicionar ao histórico
                self.repo.add_moderation_history(
                    moderator_id=moderator_id,
                    action_type="comment_deleted",
                    target_type="comment",
                    target_id=comment_id,
                    reason=reason
                )
                
                return {"success": True, "message": "Comentário deletado com sucesso"}
            else:
                return {"success": False, "error": "Comentário não encontrado"}
        except Exception as e:
            self.logger.error(f"Erro ao deletar comentário: {str(e)}", exc_info=True)
            return {"success": False, "error": str(e)}
    
    def get_moderation_history(
        self,
        moderator_id: Optional[str] = None,
        target_type: Optional[str] = None,
        page: int = 1,
        per_page: int = 20
    ) -> Dict[str, Any]:
        """Busca histórico de moderação."""
        return self.repo.get_moderation_history(
            moderator_id=moderator_id,
            target_type=target_type,
            page=page,
            per_page=per_page
        )
    
    def get_moderation_stats(self) -> Dict[str, Any]:
        """Retorna estatísticas de moderação."""
        try:
            # Contar reports por status
            pending = self.repo.get_reports(status="pending", page=1, per_page=1)
            reviewing = self.repo.get_reports(status="reviewing", page=1, per_page=1)
            resolved = self.repo.get_reports(status="resolved", page=1, per_page=1)
            
            # Contar usuários banidos
            banned = self.repo.get_banned_users(page=1, per_page=1)
            
            return {
                "success": True,
                "stats": {
                    "pending_reports": pending.get("total", 0),
                    "reviewing_reports": reviewing.get("total", 0),
                    "resolved_reports": resolved.get("total", 0),
                    "banned_users": banned.get("total", 0)
                }
            }
        except Exception as e:
            self.logger.error(f"Erro ao buscar estatísticas: {str(e)}", exc_info=True)
            return {"success": False, "error": str(e), "stats": {}}
