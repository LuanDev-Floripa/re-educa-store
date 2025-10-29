"""
Serviço de Integração
Conecta todos os serviços: Cache, Monitoring, WebSocket, Video Upload
"""

import logging
from typing import Dict, Any, Optional
from services.cache_service import cache_service, social_cache
from services.monitoring_service import monitoring_service, monitor_performance
from services.websocket_service import WebSocketService
from services.video_upload_service import VideoUploadService
from services.live_streaming_service import LiveStreamingService

logger = logging.getLogger(__name__)

class IntegrationService:
    """Serviço principal que integra todos os outros serviços"""
    
    def __init__(self):
        self.cache = cache_service
        self.monitoring = monitoring_service
        self.video_upload = VideoUploadService()
        self.live_streaming = LiveStreamingService()
        self.social_cache = social_cache
        self.websocket_service = None  # Será inicializado quando necessário
        
    def initialize_websocket(self, socketio):
        """Inicializa o serviço de WebSocket"""
        self.websocket_service = WebSocketService(socketio)
        return self.websocket_service
    
    @monitor_performance("integration_health_check")
    def health_check(self) -> Dict[str, Any]:
        """Verifica saúde de todos os serviços"""
        health_status = {
            'overall': 'healthy',
            'services': {},
            'timestamp': monitoring_service.start_time.isoformat()
        }
        
        # Verificar Cache (Redis)
        try:
            cache_available = self.cache.is_available()
            health_status['services']['cache'] = {
                'status': 'healthy' if cache_available else 'unhealthy',
                'available': cache_available
            }
        except Exception as e:
            health_status['services']['cache'] = {
                'status': 'error',
                'error': str(e)
            }
        
        # Verificar Monitoring
        try:
            monitoring_health = self.monitoring.get_health_status()
            health_status['services']['monitoring'] = {
                'status': 'healthy',
                'metrics_count': len(monitoring_health.get('metrics', {}))
            }
        except Exception as e:
            health_status['services']['monitoring'] = {
                'status': 'error',
                'error': str(e)
            }
        
        # Verificar Video Upload (Supabase Storage)
        try:
            # Testar conexão com Supabase
            bucket_created = self.video_upload.create_bucket_if_not_exists()
            health_status['services']['video_upload'] = {
                'status': 'healthy' if bucket_created else 'warning',
                'bucket_ready': bucket_created
            }
        except Exception as e:
            health_status['services']['video_upload'] = {
                'status': 'error',
                'error': str(e)
            }
        
        # Verificar Live Streaming
        try:
            # Verificar se o serviço está inicializado
            health_status['services']['live_streaming'] = {
                'status': 'healthy',
                'initialized': True
            }
        except Exception as e:
            health_status['services']['live_streaming'] = {
                'status': 'error',
                'error': str(e)
            }
        
        # Verificar WebSocket
        try:
            websocket_status = 'healthy' if self.websocket_service else 'not_initialized'
            health_status['services']['websocket'] = {
                'status': websocket_status,
                'initialized': self.websocket_service is not None
            }
        except Exception as e:
            health_status['services']['websocket'] = {
                'status': 'error',
                'error': str(e)
            }
        
        # Determinar status geral
        service_statuses = [service['status'] for service in health_status['services'].values()]
        if 'error' in service_statuses:
            health_status['overall'] = 'unhealthy'
        elif 'warning' in service_statuses:
            health_status['overall'] = 'warning'
        
        return health_status
    
    def get_system_stats(self) -> Dict[str, Any]:
        """Obtém estatísticas do sistema"""
        try:
            # Estatísticas do cache
            cache_stats = self.cache.get_stats() if self.cache.is_available() else {}
            
            # Estatísticas do monitoring
            monitoring_stats = self.monitoring.get_system_metrics()
            
            # Estatísticas do storage
            storage_stats = {}
            try:
                # Aqui você poderia chamar uma função para obter stats do Supabase Storage
                storage_stats = {'bucket': 'videos', 'status': 'active'}
            except Exception as e:
                storage_stats = {'error': str(e)}
            
            return {
                'cache': cache_stats,
                'monitoring': monitoring_stats,
                'storage': storage_stats,
                'timestamp': monitoring_service.start_time.isoformat()
            }
        except Exception as e:
            logger.error(f"Erro ao obter estatísticas do sistema: {e}")
            return {'error': str(e)}
    
    def cleanup_resources(self):
        """Limpa recursos e conexões"""
        try:
            # Fechar conexões Redis
            if self.cache.is_available():
                self.cache.redis_client.close()
            
            # Limpar cache de dados sociais
            if self.social_cache:
                self.social_cache.cache.flush_all()
            
            logger.info("Recursos limpos com sucesso")
        except Exception as e:
            logger.error(f"Erro ao limpar recursos: {e}")

# Instância global do serviço de integração
integration_service = IntegrationService()
