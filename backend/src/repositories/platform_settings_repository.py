"""
Repositório de Configurações da Plataforma RE-EDUCA Store.
"""
import logging
from typing import Any, Dict, List, Optional

from repositories.base_repository import BaseRepository

logger = logging.getLogger(__name__)


class PlatformSettingsRepository(BaseRepository):
    """Repositório para configurações da plataforma."""
    
    def __init__(self):
        super().__init__("platform_settings")
        # Usar self.db do BaseRepository
        self.supabase = self.db
    
    def get_all_settings(self, category: Optional[str] = None) -> List[Dict[str, Any]]:
        """Busca todas as configurações."""
        try:
            query = self.supabase.table(self.table_name).select("*")
            
            if category:
                query = query.eq("category", category)
            
            query = query.order("category", desc=False).order("setting_key", desc=False)
            
            response = query.execute()
            return response.data or []
        except Exception as e:
            logger.error(f"Erro ao buscar configurações: {str(e)}", exc_info=True)
            return []
    
    def get_setting(self, setting_key: str) -> Optional[Dict[str, Any]]:
        """Busca uma configuração específica."""
        try:
            response = self.supabase.table(self.table_name).select("*").eq("setting_key", setting_key).execute()
            
            if response.data and len(response.data) > 0:
                return response.data[0]
            return None
        except Exception as e:
            logger.error(f"Erro ao buscar configuração {setting_key}: {str(e)}", exc_info=True)
            return None
    
    def update_setting(self, setting_key: str, setting_value: str, updated_by: Optional[str] = None) -> Optional[Dict[str, Any]]:
        """Atualiza uma configuração."""
        try:
            update_data = {
                "setting_value": setting_value,
                "updated_at": "now()"
            }
            if updated_by:
                update_data["updated_by"] = updated_by
            
            response = self.supabase.table(self.table_name).update(update_data).eq("setting_key", setting_key).execute()
            
            if response.data and len(response.data) > 0:
                return response.data[0]
            return None
        except Exception as e:
            logger.error(f"Erro ao atualizar configuração {setting_key}: {str(e)}", exc_info=True)
            return None
    
    def create_setting(self, setting_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Cria uma nova configuração."""
        try:
            response = self.supabase.table(self.table_name).insert(setting_data).execute()
            
            if response.data and len(response.data) > 0:
                return response.data[0]
            return None
        except Exception as e:
            logger.error(f"Erro ao criar configuração: {str(e)}", exc_info=True)
            return None
    
    def get_public_settings(self) -> List[Dict[str, Any]]:
        """Busca apenas configurações públicas."""
        try:
            response = self.supabase.table(self.table_name).select("*").eq("is_public", True).execute()
            return response.data or []
        except Exception as e:
            logger.error(f"Erro ao buscar configurações públicas: {str(e)}", exc_info=True)
            return []
