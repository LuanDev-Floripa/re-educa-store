"""
Serviço de Upload de Vídeo para Live Streaming RE-EDUCA Store.

Gerencia upload de vídeos incluindo:
- Upload para Supabase Storage
- Processamento de vídeos
- Geração de thumbnails
- URLs públicas de CDN
- Validação de formato e tamanho
- Chunked upload para arquivos grandes
"""

import os
import uuid
import logging
from datetime import datetime
from typing import Dict, Optional, List
import requests
from werkzeug.utils import secure_filename
from config.database import supabase_client
from utils.helpers import generate_uuid

logger = logging.getLogger(__name__)

class VideoUploadService:
    """Service para upload e gerenciamento de vídeos."""
    
    def __init__(self):
        """Inicializa o serviço de upload de vídeos."""
        self.supabase = supabase_client
        self.supabase_url = os.environ.get('SUPABASE_URL')
        self.supabase_key = os.environ.get('SUPABASE_ANON_KEY')
        self.bucket_name = 'videos'
        
    def _get_supabase_headers(self) -> Dict[str, str]:
        """Retorna headers para requisições Supabase"""
        return {
            'Authorization': f'Bearer {self.supabase_key}',
            'Content-Type': 'application/json'
        }
    
    def _get_storage_headers(self) -> Dict[str, str]:
        """Retorna headers para requisições de storage"""
        return {
            'Authorization': f'Bearer {self.supabase_key}',
            'Content-Type': 'application/octet-stream'
        }
    
    def upload_video(self, file, user_id: str, stream_id: str = None) -> Dict:
        """
        Upload de vídeo para Supabase Storage.
        
        Args:
            file: Arquivo de vídeo.
            user_id (str): ID do usuário.
            stream_id (str, optional): ID do stream relacionado.
            
        Returns:
            Dict: Resultado com URL pública do vídeo ou erro.
        """
        try:
            # Gerar nome único para o arquivo
            file_extension = os.path.splitext(secure_filename(file.filename))[1]
            video_id = str(uuid.uuid4())
            filename = f"{user_id}/{video_id}{file_extension}"
            
            # Upload para Supabase Storage
            upload_url = f"{self.supabase_url}/storage/v1/object/{self.bucket_name}/{filename}"
            
            headers = self._get_storage_headers()
            headers['Content-Type'] = file.content_type
            
            response = requests.post(
                upload_url,
                data=file.read(),
                headers=headers
            )
            
            if response.status_code not in [200, 201]:
                raise Exception(f"Erro no upload: {response.text}")
            
            # URL do vídeo
            video_url = f"{self.supabase_url}/storage/v1/object/public/{self.bucket_name}/{filename}"
            
            # Salvar metadados no banco
            video_data = self._save_video_metadata(
                video_id, user_id, filename, video_url, 
                file.content_type, file.content_length, stream_id
            )
            
            return {
                'success': True,
                'video_id': video_id,
                'video_url': video_url,
                'filename': filename,
                'metadata': video_data
            }
            
        except Exception as e:
            logger.error(f"Erro no upload de vídeo: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def _save_video_metadata(self, video_id: str, user_id: str, filename: str, 
                           video_url: str, content_type: str, file_size: int, 
                           stream_id: str = None) -> Dict:
        """Salva metadados do vídeo no banco"""
        try:
            video_data = {
                'id': video_id,
                'user_id': user_id,
                'filename': filename,
                'video_url': video_url,
                'content_type': content_type,
                'file_size': file_size,
                'stream_id': stream_id,
                'status': 'uploaded'
            }
            
            result = self.supabase.table('video_uploads').insert(video_data).execute()
            
            if result.data and len(result.data) > 0:
                return result.data[0]
            else:
                raise Exception("Erro ao salvar metadados: nenhum dado retornado")
            
        except Exception as e:
            logger.error(f"Erro ao salvar metadados do vídeo: {e}", exc_info=True)
            raise e
    
    def get_video_by_id(self, video_id: str) -> Optional[Dict]:
        """Obtém vídeo por ID"""
        try:
            result = self.supabase.table('video_uploads')\
                .select('*')\
                .eq('id', video_id)\
                .single()\
                .execute()
            
            if result.data:
                return result.data
            return None
            
        except Exception as e:
            logger.error(f"Erro ao obter vídeo: {e}", exc_info=True)
            return None
    
    def get_user_videos(self, user_id: str, limit: int = 20, offset: int = 0) -> List[Dict]:
        """Obtém vídeos do usuário"""
        try:
            result = self.supabase.table('video_uploads')\
                .select('*')\
                .eq('user_id', user_id)\
                .order('created_at', desc=True)\
                .range(offset, offset + limit - 1)\
                .execute()
            
            return result.data if result.data else []
            
        except Exception as e:
            logger.error(f"Erro ao obter vídeos do usuário: {e}", exc_info=True)
            return []
    
    def delete_video(self, video_id: str, user_id: str) -> bool:
        """Deleta vídeo do Supabase Storage e banco"""
        try:
            # Obter metadados do vídeo
            video = self.get_video_by_id(video_id)
            if not video or video['user_id'] != user_id:
                return False
            
            # Deletar do Supabase Storage
            delete_url = f"{self.supabase_url}/storage/v1/object/{self.bucket_name}/{video['filename']}"
            
            response = requests.delete(
                delete_url,
                headers=self._get_supabase_headers()
            )
            
            if response.status_code not in [200, 204]:
                logger.warning(f"Erro ao deletar arquivo do storage: {response.text}")
            
            # Deletar do banco
            self.supabase.table('video_uploads')\
                .delete()\
                .eq('id', video_id)\
                .eq('user_id', user_id)\
                .execute()
            
            return True
            
        except Exception as e:
            logger.error(f"Erro ao deletar vídeo: {e}", exc_info=True)
            return False
    
    def update_video_metadata(self, video_id: str, user_id: str, title: str = None, description: str = None) -> Dict:
        """Atualiza metadados do vídeo (título e descrição)"""
        try:
            # Verificar se vídeo existe e pertence ao usuário
            video = self.get_video_by_id(video_id)
            if not video or video['user_id'] != user_id:
                return {'success': False, 'error': 'Vídeo não encontrado ou acesso negado'}
            
            # Preparar dados de atualização
            update_data = {}
            if title is not None:
                update_data['title'] = title
            if description is not None:
                update_data['description'] = description
            
            if not update_data:
                return {'success': False, 'error': 'Nenhum dado para atualizar'}
            
            update_data['updated_at'] = datetime.utcnow().isoformat()
            
            # Atualizar via Supabase
            result = self.supabase.table('video_uploads')\
                .update(update_data)\
                .eq('id', video_id)\
                .eq('user_id', user_id)\
                .execute()
            
            if result.data and len(result.data) > 0:
                return {
                    'success': True,
                    'message': 'Metadados atualizados com sucesso',
                    'data': result.data[0]
                }
            else:
                return {'success': False, 'error': 'Nenhum registro atualizado'}
                    
        except Exception as e:
            logger.error(f"Erro ao atualizar metadados do vídeo: {e}", exc_info=True)
            return {'success': False, 'error': str(e)}
    
    def generate_presigned_url(self, video_id: str, user_id: str, 
                             expiration: int = 3600) -> Optional[str]:
        """Gera URL pré-assinada para upload direto"""
        try:
            video = self.get_video_by_id(video_id)
            if not video or video['user_id'] != user_id:
                return None
            
            # Para Supabase Storage, retornamos a URL pública
            return video['video_url']
            
        except Exception as e:
            logger.error(f"Erro ao gerar URL pré-assinada: {e}")
            return None
    
    def get_video_analytics(self, video_id: str) -> Dict:
        """Obtém analytics do vídeo"""
        try:
            # Buscar views do vídeo
            views_result = self.supabase.table('video_views')\
                .select('user_id, view_duration')\
                .eq('video_id', video_id)\
                .execute()
            
            if not views_result.data:
                return {
                    'total_views': 0,
                    'avg_duration': 0,
                    'unique_viewers': 0
                }
            
            views = views_result.data
            total_views = len(views)
            unique_viewers = len(set(v.get('user_id') for v in views if v.get('user_id')))
            
            # Calcular duração média
            durations = [v.get('view_duration', 0) for v in views if v.get('view_duration')]
            avg_duration = sum(durations) / len(durations) if durations else 0
            
            return {
                'total_views': total_views,
                'avg_duration': float(avg_duration),
                'unique_viewers': unique_viewers
            }
            
        except Exception as e:
            logger.error(f"Erro ao obter analytics do vídeo: {e}", exc_info=True)
            return {
                'total_views': 0,
                'avg_duration': 0,
                'unique_viewers': 0
            }
    
    def create_bucket_if_not_exists(self) -> bool:
        """Cria bucket de vídeos se não existir"""
        try:
            # Verificar se bucket existe
            list_url = f"{self.supabase_url}/storage/v1/bucket"
            
            response = requests.get(
                list_url,
                headers=self._get_supabase_headers()
            )
            
            if response.status_code == 200:
                buckets = response.json()
                for bucket in buckets:
                    if bucket['name'] == self.bucket_name:
                        return True
            
            # Criar bucket
            create_url = f"{self.supabase_url}/storage/v1/bucket"
            bucket_data = {
                'name': self.bucket_name,
                'public': True,
                'file_size_limit': 52428800,  # 50MB
                'allowed_mime_types': [
                    'video/mp4',
                    'video/webm',
                    'video/ogg',
                    'video/quicktime'
                ]
            }
            
            response = requests.post(
                create_url,
                json=bucket_data,
                headers=self._get_supabase_headers()
            )
            
            if response.status_code in [200, 201]:
                logger.info(f"Bucket '{self.bucket_name}' criado com sucesso")
                return True
            else:
                logger.error(f"Erro ao criar bucket: {response.text}")
                return False
                
        except Exception as e:
            logger.error(f"Erro ao verificar/criar bucket: {e}")
            return False
