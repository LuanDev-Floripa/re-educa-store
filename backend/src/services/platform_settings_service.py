"""
Serviço de Configurações da Plataforma RE-EDUCA Store.
"""
import logging
from typing import Any, Dict, List, Optional

from repositories.platform_settings_repository import PlatformSettingsRepository
from services.base_service import BaseService

logger = logging.getLogger(__name__)


class PlatformSettingsService(BaseService):
    """Service para configurações da plataforma."""
    
    def __init__(self):
        super().__init__()
        self.repo = PlatformSettingsRepository()
    
    def get_all_settings(self, category: Optional[str] = None) -> Dict[str, Any]:
        """Busca todas as configurações."""
        try:
            settings = self.repo.get_all_settings(category=category)
            
            # Converter valores baseado no tipo
            formatted_settings = []
            for setting in settings:
                formatted_setting = {
                    **setting,
                    "parsed_value": self._parse_value(setting.get("setting_value"), setting.get("setting_type", "string"))
                }
                formatted_settings.append(formatted_setting)
            
            return {
                "success": True,
                "settings": formatted_settings
            }
        except Exception as e:
            logger.error(f"Erro ao buscar configurações: {str(e)}", exc_info=True)
            return {"success": False, "error": str(e), "settings": []}
    
    def get_setting(self, setting_key: str) -> Dict[str, Any]:
        """Busca uma configuração específica."""
        try:
            setting = self.repo.get_setting(setting_key)
            
            if setting:
                return {
                    "success": True,
                    "setting": {
                        **setting,
                        "parsed_value": self._parse_value(setting.get("setting_value"), setting.get("setting_type", "string"))
                    }
                }
            else:
                return {"success": False, "error": "Configuração não encontrada"}
        except Exception as e:
            logger.error(f"Erro ao buscar configuração: {str(e)}", exc_info=True)
            return {"success": False, "error": str(e)}
    
    def update_setting(self, setting_key: str, setting_value: Any, updated_by: Optional[str] = None) -> Dict[str, Any]:
        """Atualiza uma configuração."""
        try:
            # Buscar configuração existente para validar tipo
            existing = self.repo.get_setting(setting_key)
            if not existing:
                return {"success": False, "error": "Configuração não encontrada"}
            
            # Converter valor para string baseado no tipo
            setting_type = existing.get("setting_type", "string")
            value_str = self._stringify_value(setting_value, setting_type)
            
            updated = self.repo.update_setting(setting_key, value_str, updated_by)
            
            if updated:
                return {
                    "success": True,
                    "setting": {
                        **updated,
                        "parsed_value": self._parse_value(updated.get("setting_value"), setting_type)
                    }
                }
            else:
                return {"success": False, "error": "Erro ao atualizar configuração"}
        except Exception as e:
            logger.error(f"Erro ao atualizar configuração: {str(e)}", exc_info=True)
            return {"success": False, "error": str(e)}
    
    def update_multiple_settings(self, settings: Dict[str, Any], updated_by: Optional[str] = None) -> Dict[str, Any]:
        """Atualiza múltiplas configurações."""
        try:
            results = []
            errors = []
            
            for setting_key, setting_value in settings.items():
                result = self.update_setting(setting_key, setting_value, updated_by)
                if result.get("success"):
                    results.append(result["setting"])
                else:
                    errors.append(f"{setting_key}: {result.get('error', 'Erro desconhecido')}")
            
            return {
                "success": len(errors) == 0,
                "updated": results,
                "errors": errors
            }
        except Exception as e:
            logger.error(f"Erro ao atualizar múltiplas configurações: {str(e)}", exc_info=True)
            return {"success": False, "error": str(e)}
    
    def get_public_settings(self) -> Dict[str, Any]:
        """Busca configurações públicas."""
        try:
            settings = self.repo.get_public_settings()
            
            # Converter para formato chave-valor
            public_dict = {}
            for setting in settings:
                key = setting.get("setting_key")
                value = self._parse_value(setting.get("setting_value"), setting.get("setting_type", "string"))
                public_dict[key] = value
            
            return {
                "success": True,
                "settings": public_dict
            }
        except Exception as e:
            logger.error(f"Erro ao buscar configurações públicas: {str(e)}", exc_info=True)
            return {"success": False, "error": str(e), "settings": {}}
    
    def _parse_value(self, value: str, setting_type: str) -> Any:
        """Converte valor string para o tipo apropriado."""
        if value is None:
            return None
        
        try:
            if setting_type == "boolean":
                return value.lower() in ("true", "1", "yes", "on")
            elif setting_type == "number":
                return float(value) if "." in value else int(value)
            elif setting_type == "json":
                import json
                return json.loads(value)
            else:
                return value
        except (ValueError, TypeError):
            return value
    
    def _stringify_value(self, value: Any, setting_type: str) -> str:
        """Converte valor para string."""
        if value is None:
            return ""
        
        try:
            if setting_type == "json":
                import json
                return json.dumps(value)
            else:
                return str(value)
        except (ValueError, TypeError):
            return str(value)
