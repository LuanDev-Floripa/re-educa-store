"""
Serviço de Configuração Segura de IA RE-EDUCA Store.

Gerencia chaves de API de IA com segurança incluindo:
- Armazenamento criptografado de API keys
- CRUD de configurações por provider
- Fallback automático entre providers
- Controle de uso e quotas
- Logs de acesso às chaves

SEGURANÇA:
- Chaves sempre criptografadas em repouso
- Descriptografia apenas em memória
- Nunca retornar chaves em logs
- Rotação periódica recomendada (ai_key_rotation_service)
"""
import logging
from typing import Dict, Any
from datetime import datetime
from config.database import supabase_client
from utils.encryption import encryption_service
from utils.helpers import generate_uuid
from repositories.ai_config_repository import AIConfigRepository

logger = logging.getLogger(__name__)


class AIConfigService:
    """Serviço para gerenciar configurações de IA de forma segura"""

    def __init__(self):
        self.logger = logger
        self.supabase = supabase_client
        self.encryption = encryption_service
        self.repo = AIConfigRepository()

    def create_ai_config(self, config_data: Dict[str, Any], created_by: str) -> Dict[str, Any]:
        """Cria uma nova configuração de IA com chave criptografada"""
        try:
            # Validar dados obrigatórios
            required_fields = ['provider', 'service_name', 'api_key']
            for field in required_fields:
                if field not in config_data:
                    return {'success': False, 'error': f'Campo obrigatório: {field}'}

            # Criptografar a chave de API
            encrypted_api_key = self.encryption.encrypt_api_key(config_data['api_key'])

            # Preparar dados para inserção
            ai_config = {
                'id': generate_uuid(),
                'provider': config_data['provider'],
                'service_name': config_data['service_name'],
                'api_key_encrypted': encrypted_api_key,
                'api_endpoint': config_data.get('api_endpoint'),
                'model_name': config_data.get('model_name'),
                'max_tokens': config_data.get('max_tokens', 1000),
                'temperature': config_data.get('temperature', 0.7),
                'is_active': config_data.get('is_active', True),
                'is_default': config_data.get('is_default', False),
                'usage_limit': config_data.get('usage_limit'),
                'expires_at': config_data.get('expires_at'),
                'created_by': created_by,
                'created_at': datetime.now().isoformat()
            }

            # ✅ CORRIGIDO: Inserir via repositório
            result = self.repo.create(ai_config)

            if result:
                self.logger.info(
                    f"Configuração de IA criada: {config_data['provider']} - "
                    f"{config_data['service_name']}"
                )
                return {
                    'success': True,
                    'data': {
                        'id': result['id'],
                        'provider': result['provider'],
                        'service_name': result['service_name'],
                        'is_active': result['is_active'],
                        'is_default': result['is_default']
                    }
                }
            else:
                return {'success': False, 'error': 'Erro ao inserir configuração no banco'}

        except Exception as e:
            self.logger.error(f"Erro ao criar configuração de IA: {str(e)}")
            return {'success': False, 'error': 'Erro interno do servidor'}

    def get_ai_config(self, provider: str, service_name: str = None) -> Dict[str, Any]:
        """Obtém configuração de IA e descriptografa a chave"""
        try:
            # ✅ CORRIGIDO: Usa AIConfigRepository
            config = self.repo.find_by_provider(
                provider=provider,
                service_name=service_name,
                is_active=True,
                is_default=None if service_name else True
            )

            if config:

                # Descriptografar a chave de API
                try:
                    decrypted_api_key = self.encryption.decrypt_api_key(config['api_key_encrypted'])

                    # ✅ CORRIGIDO: Atualizar contador de uso via repositório
                    self.repo.update_usage_count(config['id'])

                    return {
                        'success': True,
                        'data': {
                            'id': config['id'],
                            'provider': config['provider'],
                            'service_name': config['service_name'],
                            'api_key': decrypted_api_key,
                            'api_endpoint': config['api_endpoint'],
                            'model_name': config['model_name'],
                            'max_tokens': config['max_tokens'],
                            'temperature': config['temperature'],
                            'usage_limit': config['usage_limit'],
                            'usage_count': config['usage_count']
                        }
                    }
                except Exception as decrypt_error:
                    self.logger.error(f"Erro ao descriptografar chave: {str(decrypt_error)}")
                    return {'success': False, 'error': 'Erro ao descriptografar chave de API'}
            else:
                return {'success': False, 'error': 'Configuração de IA não encontrada'}

        except Exception as e:
            self.logger.error(f"Erro ao obter configuração de IA: {str(e)}")
            return {'success': False, 'error': 'Erro interno do servidor'}

    def list_ai_configs(self, include_inactive: bool = False) -> Dict[str, Any]:
        """Lista todas as configurações de IA (sem chaves descriptografadas)"""
        try:
            # ✅ CORRIGIDO: Usa AIConfigRepository
            configs_list = self.repo.find_active(include_inactive=include_inactive)

            if configs_list:
                configs = []
                for config in configs_list:
                    configs.append({
                        'id': config['id'],
                        'provider': config['provider'],
                        'service_name': config['service_name'],
                        'api_endpoint': config['api_endpoint'],
                        'model_name': config['model_name'],
                        'is_active': config['is_active'],
                        'is_default': config['is_default'],
                        'usage_count': config['usage_count'],
                        'last_used_at': config['last_used_at'],
                        'created_at': config['created_at']
                    })

                return {'success': True, 'data': configs}
            else:
                return {'success': True, 'data': []}

        except Exception as e:
            self.logger.error(f"Erro ao listar configurações de IA: {str(e)}")
            return {'success': False, 'error': 'Erro interno do servidor'}

    def update_ai_config(self, config_id: str, update_data: Dict[str, Any]) -> Dict[str, Any]:
        """Atualiza configuração de IA"""
        try:
            # Se a chave de API está sendo atualizada, criptografar
            if 'api_key' in update_data:
                update_data['api_key_encrypted'] = self.encryption.encrypt_api_key(update_data['api_key'])
                del update_data['api_key']

            # Adicionar timestamp de atualização
            update_data['updated_at'] = datetime.now().isoformat()

            # ✅ CORRIGIDO: Usa AIConfigRepository
            result = self.repo.update(config_id, update_data)

            if result:
                self.logger.info(f"Configuração de IA atualizada: {config_id}")
                return {'success': True, 'data': result}
            else:
                return {'success': False, 'error': 'Configuração não encontrada'}

        except Exception as e:
            self.logger.error(f"Erro ao atualizar configuração de IA: {str(e)}")
            return {'success': False, 'error': 'Erro interno do servidor'}

    def delete_ai_config(self, config_id: str) -> Dict[str, Any]:
        """Remove configuração de IA"""
        try:
            # ✅ CORRIGIDO: Usa AIConfigRepository
            deleted = self.repo.delete(config_id)

            if deleted:
                self.logger.info(f"Configuração de IA removida: {config_id}")
                return {'success': True, 'message': 'Configuração removida com sucesso'}
            else:
                return {'success': False, 'error': 'Configuração não encontrada'}

        except Exception as e:
            self.logger.error(f"Erro ao remover configuração de IA: {str(e)}")
            return {'success': False, 'error': 'Erro interno do servidor'}

    def test_ai_config(self, config_id: str) -> Dict[str, Any]:
        """Testa uma configuração de IA fazendo uma requisição simples"""
        try:
            # ✅ CORRIGIDO: Obter configuração via repositório
            config = self.repo.find_by_id(config_id)

            if not config:
                return {'success': False, 'error': 'Configuração não encontrada'}

            # Descriptografar chave
            api_key = self.encryption.decrypt_api_key(config['api_key_encrypted'])

            # Testar baseado no provider
            if config['provider'] == 'gemini':
                return self._test_gemini_api(api_key, config)
            elif config['provider'] == 'perplexity':
                return self._test_perplexity_api(api_key, config)
            else:
                return {'success': False, 'error': f'Provider não suportado: {config["provider"]}'}

        except Exception as e:
            self.logger.error(f"Erro ao testar configuração de IA: {str(e)}")
            return {'success': False, 'error': 'Erro interno do servidor'}

    def _test_gemini_api(self, api_key: str, config: Dict[str, Any]) -> Dict[str, Any]:
        """Testa API do Google Gemini"""
        try:
            import google.generativeai as genai

            genai.configure(api_key=api_key)
            model = genai.GenerativeModel('gemini-pro')

            response = model.generate_content("Teste de conectividade - responda apenas 'OK'")

            return {
                'success': True,
                'data': {
                    'provider': 'gemini',
                    'status': 'connected',
                    'response': response.text[:100] if response.text else 'Sem resposta',
                    'tested_at': datetime.now().isoformat()
                }
            }

        except Exception as e:
            return {
                'success': False,
                'error': f'Erro ao conectar com Gemini: {str(e)}'
            }

    def _test_perplexity_api(self, api_key: str, config: Dict[str, Any]) -> Dict[str, Any]:
        """Testa API do Perplexity"""
        try:
            import requests

            headers = {
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json"
            }

            payload = {
                "model": "llama-3.1-sonar-small-128k-online",
                "messages": [
                    {
                        "role": "user",
                        "content": "Teste de conectividade - responda apenas 'OK'"
                    }
                ],
                "max_tokens": 10
            }

            response = requests.post(
                "https://api.perplexity.ai/chat/completions",
                json=payload,
                headers=headers,
                timeout=10
            )

            if response.status_code == 200:
                result = response.json()
                return {
                    'success': True,
                    'data': {
                        'provider': 'perplexity',
                        'status': 'connected',
                        'response': (
                            result['choices'][0]['message']['content'][:100]
                            if result.get('choices') else 'Sem resposta'
                        ),
                        'tested_at': datetime.now().isoformat()
                    }
                }
            else:
                return {
                    'success': False,
                    'error': f'Erro HTTP {response.status_code}: {response.text}'
                }

        except Exception as e:
            return {
                'success': False,
                'error': f'Erro ao conectar com Perplexity: {str(e)}'
            }

    def _update_usage_count(self, config_id: str):
        """Atualiza contador de uso da configuração"""
        try:
            # ✅ CORRIGIDO: Usa AIConfigRepository
            self.repo.update_usage_count(config_id)
        except Exception as e:
            self.logger.warning(f"Erro ao atualizar contador de uso: {str(e)}")

    def log_ai_usage(
            self, config_id: str, user_id: str, request_type: str,
            tokens_used: int, success: bool, error_message: str = None,
            request_data: Dict = None, response_data: Dict = None
    ) -> Dict[str, Any]:
        """Registra uso da API de IA"""
        try:
            usage_log = {
                'id': generate_uuid(),
                'ai_config_id': config_id,
                'user_id': user_id,
                'request_type': request_type,
                'tokens_used': tokens_used,
                'success': success,
                'error_message': error_message,
                'request_data': request_data or {},
                'response_data': response_data or {},
                'created_at': datetime.now().isoformat()
            }

            # ✅ CORRIGIDO: Usa AIConfigRepository
            result = self.repo.create_usage_log(usage_log)

            if result:
                return {'success': True, 'data': result}
            else:
                return {'success': False, 'error': 'Erro ao registrar uso'}

        except Exception as e:
            self.logger.error(f"Erro ao registrar uso de IA: {str(e)}")
            return {'success': False, 'error': 'Erro interno do servidor'}


# Instância global do serviço
ai_config_service = AIConfigService()
