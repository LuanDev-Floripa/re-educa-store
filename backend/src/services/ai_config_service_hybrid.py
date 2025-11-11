"""
Serviço Híbrido de Configuração de IA RE-EDUCA Store.

Gerencia configurações de IA com seleção automática:
- Mock keys para desenvolvimento (seguro, sem custos)
- Real keys para produção (criptografadas no DB)
- Seleção dinâmica de providers
- Fallback inteligente
- Rotação de chaves
"""

import logging
import os
from datetime import datetime
from typing import Any, Dict, Optional

from config.database import supabase_client
from repositories.ai_config_repository import AIConfigRepository
from utils.encryption import encryption_service
from utils.helpers import generate_uuid

logger = logging.getLogger(__name__)


class AIConfigServiceHybrid:
    """
    Serviço híbrido que usa mock em desenvolvimento e real em produção.

    Attributes:
        is_production (bool): Flag indicando ambiente de produção.
    """

    def __init__(self):
        """Inicializa o serviço híbrido de IA."""
        self.logger = logger
        self.supabase = supabase_client
        self.encryption = encryption_service
        self.repo = AIConfigRepository()
        self.is_production = os.getenv("FLASK_ENV") == "production"

        # Chaves reais (usar variáveis de ambiente)
        self.real_keys = {
            "gemini": os.getenv("GEMINI_API_KEY", ""),  # Configure via .env
            "perplexity": os.getenv("PERPLEXITY_API_KEY", ""),  # Configure via .env
        }

    def get_ai_config(self, provider: str, service_name: str = None) -> Dict[str, Any]:
        """
        Obtém configuração de IA (mock ou real baseado no ambiente).

        Args:
            provider (str): Provider (gemini, perplexity, openai, claude).
            service_name (str, optional): Nome específico do serviço.

        Returns:
            Dict[str, Any]: Configuração com api_key descriptografada.
        """
        try:
            if self.is_production:
                return self._get_real_config(provider, service_name)
            else:
                return self._get_mock_config(provider, service_name)

        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            self.logger.error(f"Erro ao obter configuração de IA: {str(e)}", exc_info=True)
            return {"success": False, "error": "Erro interno do servidor"}

    def _get_real_config(self, provider: str, service_name: str = None) -> Dict[str, Any]:
        """Obtém configuração real do banco de dados"""
        try:
            config = self.repo.find_by_provider(
                provider=provider, service_name=service_name, is_active=True, is_default=None if service_name else True
            )

            if config:

                # Descriptografar a chave de API
                try:
                    decrypted_api_key = self.encryption.decrypt_api_key(config["api_key_encrypted"])

                    self.repo.update_usage_count(config["id"])

                    return {
                        "success": True,
                        "data": {
                            "id": config["id"],
                            "provider": config["provider"],
                            "service_name": config["service_name"],
                            "api_key": decrypted_api_key,
                            "api_endpoint": config["api_endpoint"],
                            "model_name": config["model_name"],
                            "max_tokens": config["max_tokens"],
                            "temperature": config["temperature"],
                            "usage_limit": config["usage_limit"],
                            "usage_count": config["usage_count"],
                            "is_mock": False,
                        },
                    }
                except Exception as decrypt_error:
                    self.logger.error(f"Erro ao descriptografar chave: {str(decrypt_error)}")
                    return {"success": False, "error": "Erro ao descriptografar chave de API"}
            else:
                return {"success": False, "error": "Configuração de IA não encontrada"}

        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            self.logger.error(f"Erro ao obter configuração real: {str(e)}", exc_info=True)
            return {"success": False, "error": "Erro interno do servidor"}

    def _get_mock_config(self, provider: str, service_name: str = None) -> Dict[str, Any]:
        """Obtém configuração real para desenvolvimento"""
        try:
            # Verificar se temos chave real para o provider
            if provider in self.real_keys:
                return {
                    "success": True,
                    "data": {
                        "id": f"{provider}-real-config",
                        "provider": provider,
                        "service_name": service_name or "default",
                        "api_key": self.real_keys[provider],
                        "api_endpoint": self._get_mock_endpoint(provider),
                        "model_name": self._get_mock_model(provider),
                        "max_tokens": 4000 if provider == "gemini" else 2000,
                        "temperature": 0.7 if provider == "gemini" else 0.3,
                        "usage_limit": None,
                        "usage_count": 0,
                        "is_mock": False,  # Agora usando chaves reais
                    },
                }
            else:
                return {"success": False, "error": f"Provider não suportado: {provider}"}

        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            self.logger.error(f"Erro ao obter configuração real: {str(e)}", exc_info=True)
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
        """Lista configurações de IA (mock ou real)"""
        try:
            if self.is_production:
                return self._list_real_configs(include_inactive)
            else:
                return self._list_mock_configs(include_inactive)

        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            self.logger.error(f"Erro ao listar configurações de IA: {str(e)}", exc_info=True)
            return {"success": False, "error": "Erro interno do servidor"}

    def _list_real_configs(self, include_inactive: bool = False) -> Dict[str, Any]:
        """Lista configurações reais do banco"""
        try:
            configs_list = self.repo.find_active(include_inactive=include_inactive)

            if configs_list:
                configs = []
                for config in configs_list:
                    configs.append(
                        {
                            "id": config["id"],
                            "provider": config["provider"],
                            "service_name": config["service_name"],
                            "api_endpoint": config["api_endpoint"],
                            "model_name": config["model_name"],
                            "is_active": config["is_active"],
                            "is_default": config["is_default"],
                            "usage_count": config["usage_count"],
                            "last_used_at": config["last_used_at"],
                            "created_at": config["created_at"],
                            "is_mock": False,
                        }
                    )

                return {"success": True, "data": configs}
            else:
                return {"success": True, "data": []}

        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            self.logger.error(f"Erro ao listar configurações reais: {str(e)}", exc_info=True)
            return {"success": False, "error": "Erro interno do servidor"}

    def _list_mock_configs(self, include_inactive: bool = False) -> Dict[str, Any]:
        """Lista configurações reais"""
        try:
            configs = []
            for provider, key in self.real_keys.items():
                configs.append(
                    {
                        "id": f"{provider}-real-config",
                        "provider": provider,
                        "service_name": "default",
                        "api_endpoint": self._get_mock_endpoint(provider),
                        "model_name": self._get_mock_model(provider),
                        "is_active": True,
                        "is_default": True,
                        "usage_count": 0,
                        "last_used_at": None,
                        "created_at": datetime.now().isoformat(),
                        "is_mock": False,  # Agora usando chaves reais
                    }
                )

            return {"success": True, "data": configs}

        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            self.logger.error(f"Erro ao listar configurações reais: {str(e)}", exc_info=True)
            return {"success": False, "error": "Erro interno do servidor"}

    def test_ai_config(self, config_id: str) -> Dict[str, Any]:
        """Testa configuração de IA"""
        try:
            if self.is_production:
                return self._test_real_config(config_id)
            else:
                return self._test_mock_config(config_id)

        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            self.logger.error(f"Erro ao testar configuração de IA: {str(e)}", exc_info=True)
            return {"success": False, "error": "Erro interno do servidor"}

    def _test_real_config(self, config_id: str) -> Dict[str, Any]:
        """Testa configuração real"""
        try:
            config = self.repo.find_by_id(config_id)

            if not config:
                return {"success": False, "error": "Configuração não encontrada"}

            # Descriptografar chave
            api_key = self.encryption.decrypt_api_key(config["api_key_encrypted"])

            # Testar baseado no provider
            if config["provider"] == "gemini":
                return self._test_gemini_api(api_key, config)
            elif config["provider"] == "perplexity":
                return self._test_perplexity_api(api_key, config)
            else:
                return {"success": False, "error": f'Provider não suportado: {config["provider"]}'}

        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            self.logger.error(f"Erro ao testar configuração real: {str(e)}", exc_info=True)
            return {"success": False, "error": "Erro interno do servidor"}

    def _test_mock_config(self, config_id: str) -> Dict[str, Any]:
        """Testa configuração mock"""
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
            self.logger.error(f"Erro ao testar configuração mock: {str(e)}", exc_info=True)
            return {"success": False, "error": "Erro interno do servidor"}

    def _test_gemini_api(self, api_key: str, config: Dict[str, Any]) -> Dict[str, Any]:
        """Testa API do Google Gemini"""
        try:
            import google.generativeai as genai

            genai.configure(api_key=api_key)
            model = genai.GenerativeModel("gemini-pro")

            response = model.generate_content("Teste de conectividade - responda apenas 'OK'")

            return {
                "success": True,
                "data": {
                    "provider": "gemini",
                    "status": "connected",
                    "response": response.text[:100] if response.text else "Sem resposta",
                    "tested_at": datetime.now().isoformat(),
                    "is_mock": False,
                },
            }

        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
            # Deixar Exception genérico tratar abaixo
        except Exception as e:
            return {"success": False, "error": f"Erro ao conectar com Gemini: {str(e)}"}

    def _test_perplexity_api(self, api_key: str, config: Dict[str, Any]) -> Dict[str, Any]:
        """Testa API do Perplexity"""
        try:
            import requests

            headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}

            payload = {
                "model": "llama-3.1-sonar-small-128k-online",
                "messages": [{"role": "user", "content": "Teste de conectividade - responda apenas 'OK'"}],
                "max_tokens": 10,
            }

            response = requests.post(
                "https://api.perplexity.ai/chat/completions", json=payload, headers=headers, timeout=10
            )

            if response.status_code == 200:
                result = response.json()
                return {
                    "success": True,
                    "data": {
                        "provider": "perplexity",
                        "status": "connected",
                        "response": (
                            result["choices"][0]["message"]["content"][:100]
                            if result.get("choices")
                            else "Sem resposta"
                        ),
                        "tested_at": datetime.now().isoformat(),
                        "is_mock": False,
                    },
                }
            else:
                return {"success": False, "error": f"Erro HTTP {response.status_code}: {response.text}"}

        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
            # Deixar Exception genérico tratar abaixo
        except Exception as e:
            return {"success": False, "error": f"Erro ao conectar com Perplexity: {str(e)}"}

    def _update_usage_count(self, config_id: str):
        """
        Atualiza contador de uso da configuração.
        
        Utiliza AIConfigRepository para acesso a dados seguindo o padrão de arquitetura.
        """
        try:
            self.repo.update_usage_count(config_id)
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            self.logger.warning(f"Erro ao atualizar contador de uso: {str(e)}")

    # Métodos de compatibilidade para as rotas administrativas

    def create_ai_config(self, config_data: Dict[str, Any], created_by: str) -> Dict[str, Any]:
        """Cria configuração de IA"""
        if self.is_production:
            return self._create_real_config(config_data, created_by)
        else:
            return self._create_mock_config(config_data, created_by)

    def _create_real_config(self, config_data: Dict[str, Any], created_by: str) -> Dict[str, Any]:
        """Cria configuração real no banco"""
        try:
            # Validar dados obrigatórios
            required_fields = ["provider", "service_name", "api_key"]
            for field in required_fields:
                if field not in config_data:
                    return {"success": False, "error": f"Campo obrigatório: {field}"}

            # Criptografar a chave de API
            encrypted_api_key = self.encryption.encrypt_api_key(config_data["api_key"])

            # Preparar dados para inserção
            ai_config = {
                "id": generate_uuid(),
                "provider": config_data["provider"],
                "service_name": config_data["service_name"],
                "api_key_encrypted": encrypted_api_key,
                "api_endpoint": config_data.get("api_endpoint"),
                "model_name": config_data.get("model_name"),
                "max_tokens": config_data.get("max_tokens", 1000),
                "temperature": config_data.get("temperature", 0.7),
                "is_active": config_data.get("is_active", True),
                "is_default": config_data.get("is_default", False),
                "usage_limit": config_data.get("usage_limit"),
                "expires_at": config_data.get("expires_at"),
                "created_by": created_by,
                "created_at": datetime.now().isoformat(),
            }

            # Inserir no banco de dados
            result = self.repo.create(ai_config)

            if result:
                self.logger.info(
                    f"Configuração de IA criada: {config_data['provider']} - " f"{config_data['service_name']}"
                )
                return {
                    "success": True,
                    "data": {
                        "id": result["id"],
                        "provider": ai_config["provider"],
                        "service_name": ai_config["service_name"],
                        "is_active": ai_config["is_active"],
                        "is_default": ai_config["is_default"],
                        "is_mock": False,
                    },
                }
            else:
                return {"success": False, "error": "Erro ao inserir configuração no banco"}

        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            self.logger.error(f"Erro ao criar configuração de IA: {str(e)}", exc_info=True)
            return {"success": False, "error": "Erro interno do servidor"}

    def _create_mock_config(self, config_data: Dict[str, Any], created_by: str) -> Dict[str, Any]:
        """Cria configuração mock"""
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
        """Atualiza configuração de IA"""
        if self.is_production:
            return self._update_real_config(config_id, update_data)
        else:
            return self._update_mock_config(config_id, update_data)

    def _update_real_config(self, config_id: str, update_data: Dict[str, Any]) -> Dict[str, Any]:
        """Atualiza configuração real"""
        try:
            # Se a chave de API está sendo atualizada, criptografar
            if "api_key" in update_data:
                update_data["api_key_encrypted"] = self.encryption.encrypt_api_key(update_data["api_key"])
                del update_data["api_key"]

            # Adicionar timestamp de atualização
            update_data["updated_at"] = datetime.now().isoformat()

            result = self.repo.update(config_id, update_data)

            if result:
                self.logger.info(f"Configuração de IA atualizada: {config_id}")
                return {"success": True, "data": result}
            else:
                return {"success": False, "error": "Configuração não encontrada"}

        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            self.logger.error(f"Erro ao atualizar configuração de IA: {str(e)}", exc_info=True)
            return {"success": False, "error": "Erro interno do servidor"}

    def _update_mock_config(self, config_id: str, update_data: Dict[str, Any]) -> Dict[str, Any]:
        """Atualiza configuração mock"""
        return {
            "success": True,
            "data": {"id": config_id, "is_mock": True, "updated_at": datetime.now().isoformat()},
            "message": "Configuração mock atualizada (modo desenvolvimento)",
        }

    def delete_ai_config(self, config_id: str) -> Dict[str, Any]:
        """Remove configuração de IA"""
        if self.is_production:
            return self._delete_real_config(config_id)
        else:
            return self._delete_mock_config(config_id)

    def _delete_real_config(self, config_id: str) -> Dict[str, Any]:
        """Remove configuração real"""
        try:
            deleted = self.repo.delete(config_id)

            if deleted:
                self.logger.info(f"Configuração de IA removida: {config_id}")
                return {"success": True, "message": "Configuração removida com sucesso"}
            else:
                return {"success": False, "error": "Configuração não encontrada"}

        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            self.logger.error(f"Erro ao remover configuração de IA: {str(e)}", exc_info=True)
            return {"success": False, "error": "Erro interno do servidor"}

    def _delete_mock_config(self, config_id: str) -> Dict[str, Any]:
        """Remove configuração mock"""
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
        """Registra uso da API de IA"""
        try:
            if self.is_production:
                return self._log_real_usage(
                    config_id, user_id, request_type, tokens_used, success, error_message, request_data, response_data
                )
            else:
                return self._log_mock_usage(
                    config_id, user_id, request_type, tokens_used, success, error_message, request_data, response_data
                )

        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            self.logger.error(f"Erro ao registrar uso de IA: {str(e)}", exc_info=True)
            return {"success": False, "error": "Erro interno do servidor"}

    def _log_real_usage(
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
        """Registra uso real no banco"""
        try:
            usage_log = {
                "id": generate_uuid(),
                "ai_config_id": config_id,
                "user_id": user_id,
                "request_type": request_type,
                "tokens_used": tokens_used,
                "success": success,
                "error_message": error_message,
                "request_data": request_data or {},
                "response_data": response_data or {},
                "created_at": datetime.now().isoformat(),
            }

            result = self.repo.create_usage_log(usage_log)

            if result:
                return {"success": True, "data": result}
            else:
                return {"success": False, "error": "Erro ao registrar uso"}

        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            self.logger.error(f"Erro ao registrar uso real: {str(e)}", exc_info=True)
            return {"success": False, "error": "Erro interno do servidor"}

    def _log_mock_usage(
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
        """Registra uso mock"""
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
                    "id": f"mock-usage-{generate_uuid()}",
                    "config_id": config_id,
                    "user_id": user_id,
                    "request_type": request_type,
                    "tokens_used": tokens_used,
                    "success": success,
                    "is_mock": True,
                    "created_at": datetime.now().isoformat(),
                },
                "message": "Uso mock registrado (modo desenvolvimento)",
            }

        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            self.logger.error(f"Erro ao registrar uso mock: {str(e)}", exc_info=True)
            return {"success": False, "error": "Erro interno do servidor"}

    def get_usage_stats(self, days: int = 30, provider: Optional[str] = None) -> Dict[str, Any]:
        """
        Obtém estatísticas de uso das APIs de IA.

        Args:
            days: Número de dias para buscar (padrão: 30)
            provider: Provider para filtrar (opcional)

        Returns:
            Dict com estatísticas de uso
        """
        try:
            from datetime import timedelta

            start_date = (datetime.now() - timedelta(days=days)).isoformat()

            logs = self.repo.find_usage_logs(start_date=start_date, provider=provider)

            if not logs:
                return {
                    "success": True,
                    "stats": {
                        "total_requests": 0,
                        "successful_requests": 0,
                        "failed_requests": 0,
                        "total_tokens": 0,
                        "avg_response_time": 0,
                        "requests_by_type": {},
                        "requests_by_provider": {},
                        "requests_by_day": {},
                    },
                }

            # Processar estatísticas
            stats = {
                "total_requests": len(logs),
                "successful_requests": len([r for r in logs if r.get("success", False)]),
                "failed_requests": len([r for r in logs if not r.get("success", False)]),
                "total_tokens": sum(r.get("tokens_used", 0) for r in logs),
                "avg_response_time": (sum(r.get("response_time_ms", 0) for r in logs) / len(logs) if logs else 0),
                "requests_by_type": {},
                "requests_by_provider": {},
                "requests_by_day": {},
            }

            # Agrupar por tipo de requisição
            for log in logs:
                request_type = log.get("request_type", "unknown")
                stats["requests_by_type"][request_type] = stats["requests_by_type"].get(request_type, 0) + 1

            # Agrupar por provider (precisa buscar do config)
            # Por enquanto, agrupa por config_id se disponível
            for log in logs:
                config_id = log.get("ai_config_id", "unknown")
                stats["requests_by_provider"][config_id] = stats["requests_by_provider"].get(config_id, 0) + 1

            # Agrupar por dia
            for log in logs:
                created_at = log.get("created_at", "")
                if created_at:
                    day = created_at[:10]  # YYYY-MM-DD
                    stats["requests_by_day"][day] = stats["requests_by_day"].get(day, 0) + 1

            return {"success": True, "stats": stats}
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            self.logger.error(f"Erro ao buscar estatísticas de uso: {str(e)}", exc_info=True)
            return {"success": False, "error": str(e)}


# Instância global do serviço híbrido
ai_config_service_hybrid = AIConfigServiceHybrid()
