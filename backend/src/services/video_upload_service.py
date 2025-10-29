"""
Serviço de Upload de Vídeo para Live Streaming
Gerencia upload, processamento e CDN de vídeos usando Supabase Storage
"""

import os
import uuid
import logging
from datetime import datetime
from typing import Dict, Optional, List
import requests
from werkzeug.utils import secure_filename
from database.connection import get_db_connection
from config.database import supabase_client

logger = logging.getLogger(__name__)

class VideoUploadService:
    def __init__(self):
        self.conn = get_db_connection()
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
        """Upload de vídeo para Supabase Storage"""
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
            cursor = self.conn.cursor()
            
            cursor.execute("""
                INSERT INTO video_uploads (
                    id, user_id, filename, video_url, content_type, 
                    file_size, stream_id, status, created_at
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING *
            """, (
                video_id, user_id, filename, video_url, content_type,
                file_size, stream_id, 'uploaded', datetime.utcnow()
            ))
            
            result = cursor.fetchone()
            self.conn.commit()
            
            return {
                'id': result[0],
                'user_id': result[1],
                'filename': result[2],
                'video_url': result[3],
                'content_type': result[4],
                'file_size': result[5],
                'stream_id': result[6],
                'status': result[7],
                'created_at': result[8]
            }
            
        except Exception as e:
            logger.error(f"Erro ao salvar metadados do vídeo: {e}")
            self.conn.rollback()
            raise e
    
    def get_video_by_id(self, video_id: str) -> Optional[Dict]:
        """Obtém vídeo por ID"""
        try:
            cursor = self.conn.cursor()
            cursor.execute("""
                SELECT * FROM video_uploads 
                WHERE id = %s
            """, (video_id,))
            
            result = cursor.fetchone()
            if result:
                return {
                    'id': result[0],
                    'user_id': result[1],
                    'filename': result[2],
                    'video_url': result[3],
                    'content_type': result[4],
                    'file_size': result[5],
                    'stream_id': result[6],
                    'status': result[7],
                    'created_at': result[8]
                }
            return None
            
        except Exception as e:
            logger.error(f"Erro ao obter vídeo: {e}")
            return None
    
    def get_user_videos(self, user_id: str, limit: int = 20, offset: int = 0) -> List[Dict]:
        """Obtém vídeos do usuário"""
        try:
            cursor = self.conn.cursor()
            cursor.execute("""
                SELECT * FROM video_uploads 
                WHERE user_id = %s
                ORDER BY created_at DESC
                LIMIT %s OFFSET %s
            """, (user_id, limit, offset))
            
            results = cursor.fetchall()
            videos = []
            
            for result in results:
                videos.append({
                    'id': result[0],
                    'user_id': result[1],
                    'filename': result[2],
                    'video_url': result[3],
                    'content_type': result[4],
                    'file_size': result[5],
                    'stream_id': result[6],
                    'status': result[7],
                    'created_at': result[8]
                })
            
            return videos
            
        except Exception as e:
            logger.error(f"Erro ao obter vídeos do usuário: {e}")
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
            cursor = self.conn.cursor()
            cursor.execute("""
                DELETE FROM video_uploads 
                WHERE id = %s AND user_id = %s
            """, (video_id, user_id))
            
            self.conn.commit()
            return True
            
        except Exception as e:
            logger.error(f"Erro ao deletar vídeo: {e}")
            self.conn.rollback()
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
            try:
                result = supabase_client.table('video_uploads').update(update_data).eq('id', video_id).eq('user_id', user_id).execute()
                
                if result.data and len(result.data) > 0:
                    return {
                        'success': True,
                        'message': 'Metadados atualizados com sucesso',
                        'data': result.data[0]
                    }
                else:
                    return {'success': False, 'error': 'Nenhum registro atualizado'}
            except Exception as supabase_error:
                logger.warning(f"Erro ao atualizar via Supabase, tentando SQL direto: {str(supabase_error)}")
                
                # Fallback para SQL direto
                cursor = self.conn.cursor()
                set_clauses = []
                values = []
                
                if title is not None:
                    set_clauses.append("title = %s")
                    values.append(title)
                if description is not None:
                    set_clauses.append("description = %s")
                    values.append(description)
                
                set_clauses.append("updated_at = %s")
                values.append(datetime.utcnow())
                values.extend([video_id, user_id])
                
                query = f"""
                    UPDATE video_uploads 
                    SET {', '.join(set_clauses)}
                    WHERE id = %s AND user_id = %s
                    RETURNING *
                """
                
                cursor.execute(query, values)
                result = cursor.fetchone()
                self.conn.commit()
                
                if result:
                    return {
                        'success': True,
                        'message': 'Metadados atualizados com sucesso',
                        'data': {
                            'id': result[0],
                            'title': result[9] if len(result) > 9 else title,
                            'description': result[10] if len(result) > 10 else description
                        }
                    }
                else:
                    return {'success': False, 'error': 'Nenhum registro atualizado'}
                    
        except Exception as e:
            logger.error(f"Erro ao atualizar metadados do vídeo: {e}")
            if hasattr(self, 'conn'):
                self.conn.rollback()
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
            cursor = self.conn.cursor()
            
            # Estatísticas básicas
            cursor.execute("""
                SELECT 
                    COUNT(*) as total_views,
                    AVG(view_duration) as avg_duration,
                    COUNT(DISTINCT user_id) as unique_viewers
                FROM video_views 
                WHERE video_id = %s
            """, (video_id,))
            
            stats = cursor.fetchone()
            
            return {
                'total_views': stats[0] or 0,
                'avg_duration': float(stats[1]) if stats[1] else 0,
                'unique_viewers': stats[2] or 0
            }
            
        except Exception as e:
            logger.error(f"Erro ao obter analytics do vídeo: {e}")
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
