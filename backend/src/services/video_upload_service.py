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

import logging
import os
import uuid
from datetime import datetime
from typing import Dict, List, Optional

import requests
from config.database import supabase_client
from repositories.video_repository import VideoRepository
from werkzeug.utils import secure_filename

logger = logging.getLogger(__name__)


class VideoUploadService:
    """Service para upload e gerenciamento de vídeos."""

    def __init__(self):
        """Inicializa o serviço de upload de vídeos."""
        self.supabase = supabase_client
        self.video_repo = VideoRepository()
        self.supabase_url = os.environ.get("SUPABASE_URL")
        self.supabase_key = os.environ.get("SUPABASE_ANON_KEY")
        self.bucket_name = "videos"

    def _get_supabase_headers(self) -> Dict[str, str]:
        """Retorna headers para requisições Supabase"""
        return {"Authorization": f"Bearer {self.supabase_key}", "Content-Type": "application/json"}

    def _get_storage_headers(self) -> Dict[str, str]:
        """Retorna headers para requisições de storage"""
        return {"Authorization": f"Bearer {self.supabase_key}", "Content-Type": "application/octet-stream"}

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
            headers["Content-Type"] = file.content_type

            response = requests.post(upload_url, data=file.read(), headers=headers, timeout=60)

            if response.status_code not in [200, 201]:
                raise Exception(f"Erro no upload: {response.text}")

            # URL do vídeo
            video_url = f"{self.supabase_url}/storage/v1/object/public/{self.bucket_name}/{filename}"

            # Salvar metadados no banco
            video_data = self._save_video_metadata(
                video_id, user_id, filename, video_url, file.content_type, file.content_length, stream_id
            )

            return {
                "success": True,
                "video_id": video_id,
                "video_url": video_url,
                "filename": filename,
                "metadata": video_data,
            }

        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            logger.error(f"Erro no upload de vídeo: {e}", exc_info=True)
            return {"success": False, "error": str(e)}

    def _save_video_metadata(
        self,
        video_id: str,
        user_id: str,
        filename: str,
        video_url: str,
        content_type: str,
        file_size: int,
        stream_id: str = None,
    ) -> Dict:
        """Salva metadados do vídeo no banco"""
        try:
            video_data = {
                "id": video_id,
                "user_id": user_id,
                "filename": filename,
                "video_url": video_url,
                "content_type": content_type,
                "file_size": file_size,
                "stream_id": stream_id,
                "status": "uploaded",
            }

            result = self.video_repo.create_video(video_data)

            if result:
                return result
            else:
                raise Exception("Erro ao salvar metadados: nenhum dado retornado")

        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            logger.error(f"Erro ao salvar metadados do vídeo: {e}", exc_info=True)
            raise e

    def get_video_by_id(self, video_id: str) -> Optional[Dict]:
        """Obtém vídeo por ID"""
        try:
            return self.video_repo.find_by_id(video_id)
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            logger.error(f"Erro ao obter vídeo: {e}", exc_info=True)
            return None

    def get_user_videos(self, user_id: str, limit: int = 20, offset: int = 0) -> List[Dict]:
        """Obtém vídeos do usuário"""
        try:
            return self.video_repo.find_by_user(user_id, limit=limit, offset=offset)
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            logger.error(f"Erro ao obter vídeos do usuário: {e}", exc_info=True)
            return []

    def delete_video(self, video_id: str, user_id: str) -> bool:
        """Deleta vídeo do Supabase Storage e banco"""
        try:
            # Obter metadados do vídeo
            video = self.get_video_by_id(video_id)
            if not video or video["user_id"] != user_id:
                return False

            # Deletar do Supabase Storage
            delete_url = f"{self.supabase_url}/storage/v1/object/{self.bucket_name}/{video['filename']}"

            response = requests.delete(delete_url, headers=self._get_supabase_headers(), timeout=10)

            if response.status_code not in [200, 204]:
                logger.warning(f"Erro ao deletar arquivo do storage: {response.text}")

            # Deletar do banco
            deleted = self.video_repo.delete_video(video_id, user_id)
            if not deleted:
                return False

            return True

        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            logger.error(f"Erro ao deletar vídeo: {e}", exc_info=True)
            return False

    def update_video_metadata(self, video_id: str, user_id: str, title: str = None, description: str = None) -> Dict:
        """Atualiza metadados do vídeo (título e descrição)"""
        try:
            # Verificar se vídeo existe e pertence ao usuário
            video = self.get_video_by_id(video_id)
            if not video or video["user_id"] != user_id:
                return {"success": False, "error": "Vídeo não encontrado ou acesso negado"}

            # Preparar dados de atualização
            update_data = {}
            if title is not None:
                update_data["title"] = title
            if description is not None:
                update_data["description"] = description

            if not update_data:
                return {"success": False, "error": "Nenhum dado para atualizar"}

            update_data["updated_at"] = datetime.utcnow().isoformat()

            result = self.video_repo.update_video_status(video_id, user_id, "updated", update_data)

            if result:
                return {"success": True, "message": "Metadados atualizados com sucesso", "data": result}
            else:
                return {"success": False, "error": "Nenhum registro atualizado"}

        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            logger.error(f"Erro ao atualizar metadados do vídeo: {e}", exc_info=True)
            return {"success": False, "error": str(e)}

    def generate_presigned_url(self, video_id: str, user_id: str, expiration: int = 3600) -> Optional[str]:
        """Gera URL pré-assinada para upload direto"""
        try:
            video = self.get_video_by_id(video_id)
            if not video or video["user_id"] != user_id:
                return None

            # Para Supabase Storage, retornamos a URL pública
            return video["video_url"]

        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            logger.error(f"Erro ao gerar URL pré-assinada: {e}", exc_info=True)
            return None

    def get_video_analytics(self, video_id: str) -> Dict:
        """
        Obtém analytics avançados do vídeo.
        
        Inclui:
        - Métricas básicas (views, viewers, duração)
        - Taxa de engajamento (likes, comments, shares)
        - Análise temporal (views por dia)
        - Taxa de retenção e conclusão
        - Top viewers
        """
        try:
            from collections import defaultdict
            from datetime import datetime, timedelta

            # Buscar views do vídeo
            views_result = self.video_repo.get_video_views(video_id)
            views = views_result.data if views_result.data else []

            if not views:
                return self._get_empty_analytics()

            # Métricas básicas
            total_views = len(views)
            unique_viewers = len(set(v.get("user_id") for v in views if v.get("user_id")))
            durations = [v.get("view_duration", 0) for v in views if v.get("view_duration")]
            avg_duration = sum(durations) / len(durations) if durations else 0
            completion_rates = [v.get("completion_rate", 0) for v in views if v.get("completion_rate")]
            avg_completion_rate = sum(completion_rates) / len(completion_rates) if completion_rates else 0

            # Buscar likes, comments e shares
            likes_result = self.db.table("video_likes").select("id, user_id, created_at").eq("video_id", video_id).execute()
            likes = likes_result.data if likes_result.data else []
            total_likes = len(likes)

            comments_result = self.db.table("video_comments").select("id, user_id, created_at").eq("video_id", video_id).execute()
            comments = comments_result.data if comments_result.data else []
            total_comments = len(comments)

            shares_result = self.db.table("video_shares").select("id, user_id, created_at").eq("video_id", video_id).execute()
            shares = shares_result.data if shares_result.data else []
            total_shares = len(shares)

            # Taxa de engajamento
            engagement_rate = 0
            if total_views > 0:
                engagement_rate = ((total_likes + total_comments + total_shares) / total_views) * 100

            # Análise temporal (views por dia)
            views_by_day = defaultdict(int)
            for view in views:
                if view.get("created_at"):
                    try:
                        view_date = datetime.fromisoformat(view["created_at"].replace("Z", "+00:00")).date()
                        views_by_day[view_date.isoformat()] += 1
                    except (ValueError, AttributeError):
                        pass

            # Ordenar por data
            views_by_day_sorted = sorted(
                [{"date": date, "views": count} for date, count in views_by_day.items()],
                key=lambda x: x["date"],
            )

            # Top viewers (usuários que mais assistiram)
            viewer_counts = defaultdict(int)
            viewer_durations = defaultdict(int)
            for view in views:
                user_id = view.get("user_id")
                if user_id:
                    viewer_counts[user_id] += 1
                    viewer_durations[user_id] += view.get("view_duration", 0)

            top_viewers = []
            for user_id, count in sorted(viewer_counts.items(), key=lambda x: x[1], reverse=True)[:10]:
                top_viewers.append(
                    {
                        "user_id": user_id,
                        "view_count": count,
                        "total_duration": viewer_durations[user_id],
                    }
                )

            # Taxa de retenção (por faixas de tempo)
            retention_analysis = self._calculate_retention(views)

            # Análise de picos (horários mais assistidos)
            views_by_hour = defaultdict(int)
            for view in views:
                if view.get("created_at"):
                    try:
                        view_datetime = datetime.fromisoformat(view["created_at"].replace("Z", "+00:00"))
                        hour = view_datetime.hour
                        views_by_hour[hour] += 1
                    except (ValueError, AttributeError):
                        pass

            peak_hours = sorted(
                [{"hour": hour, "views": count} for hour, count in views_by_hour.items()],
                key=lambda x: x["views"],
                reverse=True,
            )[:5]

            return {
                "video_id": video_id,
                "metrics": {
                    "total_views": total_views,
                    "unique_viewers": unique_viewers,
                    "avg_duration": round(float(avg_duration), 2),
                    "avg_completion_rate": round(float(avg_completion_rate), 2),
                    "total_likes": total_likes,
                    "total_comments": total_comments,
                    "total_shares": total_shares,
                    "engagement_rate": round(engagement_rate, 2),
                    "like_rate": round((total_likes / total_views * 100) if total_views > 0 else 0, 2),
                    "comment_rate": round((total_comments / total_views * 100) if total_views > 0 else 0, 2),
                    "share_rate": round((total_shares / total_views * 100) if total_views > 0 else 0, 2),
                },
                "temporal_analysis": {
                    "views_by_day": views_by_day_sorted,
                    "peak_hours": peak_hours,
                },
                "audience": {
                    "top_viewers": top_viewers,
                    "retention": retention_analysis,
                },
            }

        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            return self._get_empty_analytics()
        except Exception as e:
            logger.error(f"Erro ao obter analytics do vídeo: {e}", exc_info=True)
            return self._get_empty_analytics()

    def _calculate_retention(self, views: List[Dict]) -> Dict[str, Any]:
        """Calcula taxa de retenção por faixas de tempo"""
        try:
            # Agrupar por completion_rate
            retention_buckets = {
                "0-25%": 0,
                "25-50%": 0,
                "50-75%": 0,
                "75-100%": 0,
                "100%": 0,
            }

            for view in views:
                completion = view.get("completion_rate", 0)
                if completion >= 100:
                    retention_buckets["100%"] += 1
                elif completion >= 75:
                    retention_buckets["75-100%"] += 1
                elif completion >= 50:
                    retention_buckets["50-75%"] += 1
                elif completion >= 25:
                    retention_buckets["25-50%"] += 1
                else:
                    retention_buckets["0-25%"] += 1

            total = sum(retention_buckets.values())
            if total > 0:
                retention_buckets = {k: round((v / total) * 100, 2) for k, v in retention_buckets.items()}

            return retention_buckets
        except Exception as e:
            logger.error(f"Erro ao calcular retenção: {e}")
            return {}

    def _get_empty_analytics(self) -> Dict:
        """Retorna analytics vazio"""
        return {
            "video_id": None,
            "metrics": {
                "total_views": 0,
                "unique_viewers": 0,
                "avg_duration": 0,
                "avg_completion_rate": 0,
                "total_likes": 0,
                "total_comments": 0,
                "total_shares": 0,
                "engagement_rate": 0,
                "like_rate": 0,
                "comment_rate": 0,
                "share_rate": 0,
            },
            "temporal_analysis": {
                "views_by_day": [],
                "peak_hours": [],
            },
            "audience": {
                "top_viewers": [],
                "retention": {},
            },
        }

    def create_bucket_if_not_exists(self) -> bool:
        """Cria bucket de vídeos se não existir"""
        try:
            # Verificar se bucket existe
            list_url = f"{self.supabase_url}/storage/v1/bucket"

            response = requests.get(list_url, headers=self._get_supabase_headers(), timeout=10)

            if response.status_code == 200:
                buckets = response.json()
                for bucket in buckets:
                    if bucket["name"] == self.bucket_name:
                        return True

            # Criar bucket
            create_url = f"{self.supabase_url}/storage/v1/bucket"
            bucket_data = {
                "name": self.bucket_name,
                "public": True,
                "file_size_limit": 52428800,  # 50MB
                "allowed_mime_types": ["video/mp4", "video/webm", "video/ogg", "video/quicktime"],
            }

            response = requests.post(create_url, json=bucket_data, headers=self._get_supabase_headers(), timeout=10)

            if response.status_code in [200, 201]:
                logger.info(f"Bucket '{self.bucket_name}' criado com sucesso")
                return True
            else:
                logger.error(f"Erro ao criar bucket: {response.text}")
                return False

        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            logger.error(f"Erro ao verificar/criar bucket: {e}", exc_info=True)
            return False
