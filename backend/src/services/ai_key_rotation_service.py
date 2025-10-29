"""
Serviço de Rotação Automática de Chaves de IA
Gerencia a rotação automática e manual de chaves de API
"""
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
from config.database import supabase_client
from utils.encryption import encryption_service
from utils.helpers import generate_uuid

logger = logging.getLogger(__name__)

class AIKeyRotationService:
    """Serviço para rotação automática de chaves de IA"""
    
    def __init__(self):
        self.logger = logger
        self.supabase = supabase_client
        self.encryption = encryption_service
    
    def check_key_rotation_needed(self) -> Dict[str, Any]:
        """Verifica se alguma chave precisa ser rotacionada"""
        try:
            # Obter configurações de rotação
            rotation_settings = self._get_rotation_settings()
            rotation_days = int(rotation_settings.get('key_rotation_days', 90))
            
            # Calcular data limite
            limit_date = datetime.now() - timedelta(days=rotation_days)
            
            # Buscar configurações que precisam de rotação
            result = self.supabase.table('ai_configurations').select('*').execute()
            
            if not result.data:
                return {
                    'success': True,
                    'needs_rotation': False,
                    'configs_to_rotate': []
                }
            
            configs_to_rotate = []
            for config in result.data:
                if config.get('is_active', False):
                    # Verificar se a chave é muito antiga
                    created_at = datetime.fromisoformat(config['created_at'].replace('Z', '+00:00'))
                    if created_at < limit_date:
                        configs_to_rotate.append({
                            'id': config['id'],
                            'provider': config['provider'],
                            'service_name': config['service_name'],
                            'created_at': config['created_at'],
                            'days_old': (datetime.now() - created_at).days
                        })
            
            return {
                'success': True,
                'needs_rotation': len(configs_to_rotate) > 0,
                'configs_to_rotate': configs_to_rotate,
                'rotation_days': rotation_days
            }
            
        except Exception as e:
            self.logger.error(f"Erro ao verificar rotação de chaves: {str(e)}")
            return {'success': False, 'error': 'Erro interno do servidor'}
    
    def rotate_key(self, config_id: str, new_api_key: str, rotated_by: str) -> Dict[str, Any]:
        """Rotaciona uma chave específica"""
        try:
            # Obter configuração atual
            config_result = self.supabase.table('ai_configurations').select('*').eq('id', config_id).execute()
            
            if not config_result.data:
                return {'success': False, 'error': 'Configuração não encontrada'}
            
            config = config_result.data[0]
            
            # Criptografar nova chave
            encrypted_new_key = self.encryption.encrypt_api_key(new_api_key)
            
            # Criar backup da chave antiga
            backup_data = {
                'id': generate_uuid(),
                'original_config_id': config_id,
                'old_api_key_encrypted': config['api_key_encrypted'],
                'new_api_key_encrypted': encrypted_new_key,
                'rotated_by': rotated_by,
                'rotated_at': datetime.now().isoformat(),
                'reason': 'manual_rotation'
            }
            
            # Salvar backup
            self.supabase.table('ai_key_rotation_logs').insert(backup_data).execute()
            
            # Atualizar configuração com nova chave
            update_data = {
                'api_key_encrypted': encrypted_new_key,
                'updated_at': datetime.now().isoformat(),
                'last_rotated_at': datetime.now().isoformat()
            }
            
            result = self.supabase.table('ai_configurations').update(update_data).eq('id', config_id).execute()
            
            if result.data:
                self.logger.info(f"Chave rotacionada com sucesso: {config_id}")
                
                # Testar nova chave
                test_result = self._test_rotated_key(config_id, new_api_key)
                
                return {
                    'success': True,
                    'data': {
                        'config_id': config_id,
                        'provider': config['provider'],
                        'service_name': config['service_name'],
                        'rotated_at': datetime.now().isoformat(),
                        'test_result': test_result
                    },
                    'message': 'Chave rotacionada com sucesso'
                }
            else:
                return {'success': False, 'error': 'Erro ao atualizar configuração'}
                
        except Exception as e:
            self.logger.error(f"Erro ao rotacionar chave: {str(e)}")
            return {'success': False, 'error': 'Erro interno do servidor'}
    
    def auto_rotate_keys(self) -> Dict[str, Any]:
        """Executa rotação automática de chaves"""
        try:
            # Verificar quais chaves precisam ser rotacionadas
            rotation_check = self.check_key_rotation_needed()
            
            if not rotation_check['success']:
                return rotation_check
            
            if not rotation_check['needs_rotation']:
                return {
                    'success': True,
                    'message': 'Nenhuma chave precisa ser rotacionada',
                    'rotated_count': 0
                }
            
            rotated_configs = []
            failed_configs = []
            
            for config in rotation_check['configs_to_rotate']:
                try:
                    # Em modo mock, simular rotação
                    if self._is_mock_mode():
                        rotated_configs.append({
                            'id': config['id'],
                            'provider': config['provider'],
                            'service_name': config['service_name'],
                            'status': 'rotated_mock'
                        })
                    else:
                        # Em produção, solicitar nova chave (implementar lógica específica)
                        self.logger.warning(f"Rotacao automatica necessaria para {config['id']} - implementar logica de producao")
                        failed_configs.append({
                            'id': config['id'],
                            'provider': config['provider'],
                            'service_name': config['service_name'],
                            'error': 'Rotacao automatica nao implementada para producao'
                        })
                        
                except Exception as e:
                    self.logger.error(f"Erro ao rotacionar {config['id']}: {str(e)}")
                    failed_configs.append({
                        'id': config['id'],
                        'provider': config['provider'],
                        'service_name': config['service_name'],
                        'error': str(e)
                    })
            
            return {
                'success': True,
                'message': f'Rotacao automatica concluida: {len(rotated_configs)} sucessos, {len(failed_configs)} falhas',
                'rotated_count': len(rotated_configs),
                'rotated_configs': rotated_configs,
                'failed_configs': failed_configs
            }
            
        except Exception as e:
            self.logger.error(f"Erro na rotacao automatica: {str(e)}")
            return {'success': False, 'error': 'Erro interno do servidor'}
    
    def get_rotation_history(self, config_id: str = None, limit: int = 50) -> Dict[str, Any]:
        """Obtém histórico de rotações"""
        try:
            query = self.supabase.table('ai_key_rotation_logs').select('*')
            
            if config_id:
                query = query.eq('original_config_id', config_id)
            
            result = query.order('rotated_at', desc=True).limit(limit).execute()
            
            if result.data:
                return {
                    'success': True,
                    'data': result.data
                }
            else:
                return {
                    'success': True,
                    'data': []
                }
                
        except Exception as e:
            self.logger.error(f"Erro ao obter historico de rotacao: {str(e)}")
            return {'success': False, 'error': 'Erro interno do servidor'}
    
    def get_rotation_settings(self) -> Dict[str, Any]:
        """Obtém configurações de rotação"""
        try:
            result = self.supabase.table('ai_security_settings').select('*').execute()
            
            if result.data:
                settings = {}
                for setting in result.data:
                    settings[setting['setting_key']] = setting['setting_value']
                
                return {
                    'success': True,
                    'data': settings
                }
            else:
                return {
                    'success': True,
                    'data': {}
                }
                
        except Exception as e:
            self.logger.error(f"Erro ao obter configuracoes de rotacao: {str(e)}")
            return {'success': False, 'error': 'Erro interno do servidor'}
    
    def update_rotation_settings(self, settings: Dict[str, Any]) -> Dict[str, Any]:
        """Atualiza configurações de rotação"""
        try:
            updated_count = 0
            
            for key, value in settings.items():
                result = self.supabase.table('ai_security_settings').update({
                    'setting_value': str(value),
                    'updated_at': datetime.now().isoformat()
                }).eq('setting_key', key).execute()
                
                if result.data:
                    updated_count += 1
            
            return {
                'success': True,
                'data': {
                    'updated_count': updated_count,
                    'settings': settings
                },
                'message': f'{updated_count} configuracoes atualizadas'
            }
            
        except Exception as e:
            self.logger.error(f"Erro ao atualizar configuracoes de rotacao: {str(e)}")
            return {'success': False, 'error': 'Erro interno do servidor'}
    
    def _get_rotation_settings(self) -> Dict[str, Any]:
        """Obtém configurações de rotação internamente"""
        try:
            result = self.supabase.table('ai_security_settings').select('*').execute()
            
            if result.data:
                settings = {}
                for setting in result.data:
                    settings[setting['setting_key']] = setting['setting_value']
                return settings
            else:
                return {'key_rotation_days': '90'}
                
        except Exception as e:
            self.logger.warning(f"Erro ao obter configuracoes de rotacao: {str(e)}")
            return {'key_rotation_days': '90'}
    
    def _test_rotated_key(self, config_id: str, api_key: str) -> Dict[str, Any]:
        """Testa chave após rotação"""
        try:
            # Obter configuração
            config_result = self.supabase.table('ai_configurations').select('*').eq('id', config_id).execute()
            
            if not config_result.data:
                return {'success': False, 'error': 'Configuração não encontrada'}
            
            config = config_result.data[0]
            
            # Testar baseado no provider
            if config['provider'] == 'gemini':
                return self._test_gemini_key(api_key)
            elif config['provider'] == 'perplexity':
                return self._test_perplexity_key(api_key)
            else:
                return {'success': False, 'error': f'Provider não suportado: {config["provider"]}'}
                
        except Exception as e:
            self.logger.error(f"Erro ao testar chave rotacionada: {str(e)}")
            return {'success': False, 'error': 'Erro interno do servidor'}
    
    def _test_gemini_key(self, api_key: str) -> Dict[str, Any]:
        """Testa chave do Gemini"""
        try:
            import google.generativeai as genai
            
            genai.configure(api_key=api_key)
            model = genai.GenerativeModel('gemini-pro')
            
            response = model.generate_content("Teste de conectividade após rotação")
            
            return {
                'success': True,
                'status': 'connected',
                'response': response.text[:100] if response.text else 'Sem resposta'
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': f'Erro ao testar Gemini: {str(e)}'
            }
    
    def _test_perplexity_key(self, api_key: str) -> Dict[str, Any]:
        """Testa chave do Perplexity"""
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
                        "content": "Teste de conectividade após rotação"
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
                    'status': 'connected',
                    'response': result['choices'][0]['message']['content'][:100] if result.get('choices') else 'Sem resposta'
                }
            else:
                return {
                    'success': False,
                    'error': f'Erro HTTP {response.status_code}'
                }
                
        except Exception as e:
            return {
                'success': False,
                'error': f'Erro ao testar Perplexity: {str(e)}'
            }
    
    def _is_mock_mode(self) -> bool:
        """Verifica se está em modo mock"""
        import os
        return os.getenv('FLASK_ENV') != 'production'

# Instância global do serviço
ai_key_rotation_service = AIKeyRotationService()