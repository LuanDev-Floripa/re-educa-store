"""
Serviço de Configuração de IA com Chaves Mock RE-EDUCA Store.

AVISO: APENAS PARA DESENVOLVIMENTO!

Fornece chaves mock para testar integrações de IA sem custos:
- Gemini mock key
- Perplexity mock key
- OpenAI mock key (futuro)
- Respostas simuladas

IMPORTANTE:
- NUNCA usar em produção
- Configurar via MOCK_MODE=true no .env
- Chaves mock não fazem chamadas reais às APIs
- Retorna dados simulados para testes
"""

import logging
import os
from datetime import datetime
from typing import Any, Dict

from config.database import supabase_client
from utils.encryption import encryption_service
from utils.helpers import generate_uuid

logger = logging.getLogger(__name__)


class AIConfigServiceMock:
    """Serviço mock para desenvolvimento com chaves temporárias"""

    def __init__(self):
        self.logger = logger
        self.supabase = supabase_client
        self.encryption = encryption_service

        # Chaves mock para desenvolvimento (usar variáveis de ambiente)
        self.mock_keys = {
            "gemini": os.getenv("GEMINI_API_KEY_MOCK", ""),  # Configure via .env
            "perplexity": os.getenv("PERPLEXITY_API_KEY_MOCK", ""),  # Configure via .env
        }

    def get_ai_config(self, provider: str, service_name: str = None) -> Dict[str, Any]:
        """Obtém configuração de IA com chave mock"""
        try:
            # Verificar se temos chave mock para o provider
            if provider in self.mock_keys:
                return {
                    "success": True,
                    "data": {
                        "id": f"{provider}-mock-config",
                        "provider": provider,
                        "service_name": service_name or "default",
                        "api_key": self.mock_keys[provider],
                        "api_endpoint": self._get_mock_endpoint(provider),
                        "model_name": self._get_mock_model(provider),
                        "max_tokens": 4000 if provider == "gemini" else 2000,
                        "temperature": 0.7 if provider == "gemini" else 0.3,
                        "usage_limit": None,
                        "usage_count": 0,
                        "is_mock": True,  # Flag para indicar que é mock
                    },
                }
            else:
                return {"success": False, "error": f"Provider não suportado: {provider}"}

        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            self.logger.error(f"Erro ao obter configuração mock de IA: {str(e)}", exc_info=True)
            return {"success": False, "error": "Erro interno do servidor"}

    def _get_mock_endpoint(self, provider: str) -> str:
        """Retorna endpoint mock baseado no provider"""
        endpoints = {
            "gemini": "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent",
            "perplexity": "https://api.perplexity.ai/chat/completions",
        }
        return endpoints.get(provider, "")

    def _get_mock_model(self, provider: str) -> str:
        """Retorna modelo mock baseado no provider"""
        models = {"gemini": "gemini-pro", "perplexity": "llama-3.1-sonar-small-128k-online"}
        return models.get(provider, "")

    def list_ai_configs(self, include_inactive: bool = False) -> Dict[str, Any]:
        """Lista configurações mock de IA"""
        try:
            configs = []
            for provider, key in self.mock_keys.items():
                configs.append(
                    {
                        "id": f"{provider}-mock-config",
                        "provider": provider,
                        "service_name": "default",
                        "api_endpoint": self._get_mock_endpoint(provider),
                        "model_name": self._get_mock_model(provider),
                        "is_active": True,
                        "is_default": True,
                        "usage_count": 0,
                        "last_used_at": None,
                        "created_at": datetime.now().isoformat(),
                        "is_mock": True,
                    }
                )

            return {"success": True, "data": configs}

        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            self.logger.error(f"Erro ao listar configurações mock de IA: {str(e)}", exc_info=True)
            return {"success": False, "error": "Erro interno do servidor"}

    def test_ai_config(self, config_id: str) -> Dict[str, Any]:
        """Testa configuração mock de IA"""
        try:
            # Extrair provider do config_id
            if "gemini" in config_id:
                provider = "gemini"
            elif "perplexity" in config_id:
                provider = "perplexity"
            else:
                return {"success": False, "error": "Configuração mock não encontrada"}

            # Simular teste bem-sucedido
            return {
                "success": True,
                "data": {
                    "provider": provider,
                    "status": "connected_mock",
                    "response": "Teste mock bem-sucedido - chave temporária funcionando",
                    "tested_at": datetime.now().isoformat(),
                    "is_mock": True,
                },
            }

        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            self.logger.error(f"Erro ao testar configuração mock de IA: {str(e)}", exc_info=True)
            return {"success": False, "error": "Erro interno do servidor"}

    def create_ai_config(self, config_data: Dict[str, Any], created_by: str) -> Dict[str, Any]:
        """Cria configuração mock (apenas para compatibilidade)"""
        return {
            "success": True,
            "data": {
                "id": f"{config_data['provider']}-mock-config",
                "provider": config_data["provider"],
                "service_name": config_data["service_name"],
                "is_active": True,
                "is_default": True,
                "is_mock": True,
            },
            "message": "Configuração mock criada (modo desenvolvimento)",
        }

    def update_ai_config(self, config_id: str, update_data: Dict[str, Any]) -> Dict[str, Any]:
        """Atualiza configuração mock (apenas para compatibilidade)"""
        return {
            "success": True,
            "data": {"id": config_id, "is_mock": True, "updated_at": datetime.now().isoformat()},
            "message": "Configuração mock atualizada (modo desenvolvimento)",
        }

    def delete_ai_config(self, config_id: str) -> Dict[str, Any]:
        """Remove configuração mock (apenas para compatibilidade)"""
        return {"success": True, "message": "Configuração mock removida (modo desenvolvimento)"}

    def log_ai_usage(
        self,
        config_id: str,
        user_id: str,
        request_type: str,
        tokens_used: int,
        success: bool,
        error_message: str = None,
        request_data: Dict = None,
        response_data: Dict = None,
    ) -> Dict[str, Any]:
        """Registra uso mock da API de IA"""
        try:
            # Em modo mock, apenas logamos no console
            self.logger.info(
                f"Mock AI Usage - Config: {config_id}, "
                f"User: {user_id}, Type: {request_type}, "
                f"Tokens: {tokens_used}, Success: {success}"
            )

            return {
                "success": True,
                "data": {
                    "id": generate_uuid(),
                    "config_id": config_id,
                    "user_id": user_id,
                    "request_type": request_type,
                    "tokens_used": tokens_used,
                    "success": success,
                    "is_mock": True,
                    "created_at": datetime.now().isoformat(),
                },
            }

        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            self.logger.error(f"Erro ao registrar uso mock de IA: {str(e)}", exc_info=True)
            return {"success": False, "error": "Erro interno do servidor"}


# Instância global do serviço mock
ai_config_service_mock = AIConfigServiceMock()
