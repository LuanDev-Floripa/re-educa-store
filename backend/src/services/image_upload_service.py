"""
Serviço de Upload de Imagens para Perfil RE-EDUCA Store.

Gerencia upload de imagens incluindo:
- Upload para Supabase Storage
- Validação de formato e tamanho
- Redimensionamento de imagens
- URLs públicas de CDN
- Upload de avatar de perfil
"""

import logging
import os
import uuid
from typing import Dict, Optional

import requests
from werkzeug.utils import secure_filename

try:
    from PIL import Image

    PIL_AVAILABLE = True
except ImportError:
    PIL_AVAILABLE = False
import io

from config.database import supabase_client

logger = logging.getLogger(__name__)

if not PIL_AVAILABLE:
    logger.warning("PIL/Pillow não disponível. Redimensionamento de imagens desabilitado.")


class ImageUploadService:
    """Service para upload e gerenciamento de imagens."""

    def __init__(self):
        """Inicializa o serviço de upload de imagens."""
        from config.settings import get_config

        config = get_config()

        self.supabase = supabase_client
        self.supabase_url = config.SUPABASE_URL
        self.supabase_key = config.SUPABASE_KEY
        self.bucket_name = "avatars"  # Bucket para fotos de perfil

    def _get_supabase_headers(self) -> Dict[str, str]:
        """Retorna headers para requisições Supabase"""
        return {"Authorization": f"Bearer {self.supabase_key}", "Content-Type": "application/json"}

    def _get_storage_headers(self, content_type: str = "image/jpeg") -> Dict[str, str]:
        """Retorna headers para requisições de storage"""
        return {"Authorization": f"Bearer {self.supabase_key}", "Content-Type": content_type}

    def _resize_image(self, file_content: bytes, max_size: tuple = (800, 800), quality: int = 85) -> bytes:
        """
        Redimensiona imagem mantendo proporção.

        Args:
            file_content: Conteúdo binário da imagem
            max_size: Tamanho máximo (width, height)
            quality: Qualidade JPEG (1-100)

        Returns:
            bytes: Imagem redimensionada
        """
        if not PIL_AVAILABLE:
            # Se PIL não estiver disponível, retorna original
            return file_content

        try:
            img = Image.open(io.BytesIO(file_content))

            # Converter RGBA para RGB se necessário
            if img.mode in ("RGBA", "LA", "P"):
                rgb_img = Image.new("RGB", img.size, (255, 255, 255))
                if img.mode == "P":
                    img = img.convert("RGBA")
                rgb_img.paste(img, mask=img.split()[-1] if img.mode == "RGBA" else None)
                img = rgb_img

            # Redimensionar mantendo proporção
            img.thumbnail(max_size, Image.Resampling.LANCZOS)

            # Salvar em bytes
            output = io.BytesIO()
            img.save(output, format="JPEG", quality=quality, optimize=True)
            output.seek(0)

            return output.read()
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            logger.error(f"Erro ao redimensionar imagem: {e}", exc_info=True)
            return file_content  # Retorna original se falhar

    def upload_avatar(self, file, user_id: str) -> Dict:
        """
        Upload de foto de perfil para Supabase Storage.

        Args:
            file: Arquivo de imagem (Flask file object ou similar)
            user_id: ID do usuário

        Returns:
            Dict: Resultado com URL pública da imagem ou erro
        """
        try:
            # Validar se arquivo existe
            if not file or not hasattr(file, "filename"):
                return {"success": False, "error": "Arquivo inválido"}

            # Validar tipo de arquivo
            allowed_extensions = {".jpg", ".jpeg", ".png", ".webp", ".gif"}
            filename = secure_filename(file.filename or "image.jpg")
            file_extension = os.path.splitext(filename)[1].lower()

            if file_extension not in allowed_extensions:
                return {"success": False, "error": f'Formato não permitido. Use: {", ".join(allowed_extensions)}'}

            # Validar tamanho (máximo 5MB)
            MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB

            # Ler conteúdo do arquivo
            if hasattr(file, "read"):
                file_content = file.read()
                # Reset se possível
                if hasattr(file, "seek"):
                    file.seek(0)
            elif isinstance(file, bytes):
                file_content = file
            else:
                return {"success": False, "error": "Formato de arquivo não suportado"}

            if len(file_content) > MAX_FILE_SIZE:
                return {"success": False, "error": f"Arquivo muito grande. Máximo: {MAX_FILE_SIZE // (1024*1024)}MB"}

            # Redimensionar imagem se necessário
            resized_content = self._resize_image(file_content, max_size=(800, 800), quality=85)

            # Gerar nome único para o arquivo
            # Usar user_id como parte do nome para facilitar identificação
            filename = f"{user_id}/avatar_{uuid.uuid4().hex[:8]}.jpg"

            # Upload para Supabase Storage
            upload_url = f"{self.supabase_url}/storage/v1/object/{self.bucket_name}/{filename}"

            headers = self._get_storage_headers("image/jpeg")

            response = requests.post(upload_url, data=resized_content, headers=headers, timeout=15)

            if response.status_code not in [200, 201]:
                logger.error(f"Erro no upload de avatar: {response.text}")
                return {"success": False, "error": f"Erro no upload: {response.text}"}

            # URL pública da imagem
            avatar_url = f"{self.supabase_url}/storage/v1/object/public/{self.bucket_name}/{filename}"

            return {"success": True, "avatar_url": avatar_url, "filename": filename, "size": len(resized_content)}

        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            logger.error(f"Erro no upload de avatar: {e}", exc_info=True)
            return {"success": False, "error": str(e)}

    def upload_post_media(self, file, user_id: str, post_id: str = None) -> Dict:
        """
        Upload de mídia (foto ou vídeo) para post.

        Args:
            file: Arquivo de imagem ou vídeo
            user_id: ID do usuário
            post_id: ID do post (opcional, para organização)

        Returns:
            Dict: Resultado com URL pública da mídia ou erro
        """
        try:
            # Validar se arquivo existe
            if not file or not hasattr(file, "filename"):
                return {"success": False, "error": "Arquivo inválido"}

            # Validar tipo de arquivo
            is_image = file.filename.lower().endswith((".jpg", ".jpeg", ".png", ".webp", ".gif"))
            is_video = file.filename.lower().endswith((".mp4", ".webm", ".ogg", ".mov", ".avi"))

            if not (is_image or is_video):
                return {
                    "success": False,
                    "error": "Formato não permitido. Use imagens (JPG, PNG, WebP, GIF) ou vídeos (MP4, WebM, OGG, MOV, AVI)",
                }

            # Validar tamanho
            MAX_FILE_SIZE = 50 * 1024 * 1024 if is_video else 10 * 1024 * 1024  # 50MB para vídeo, 10MB para imagem
            file_content = file.read()
            if hasattr(file, "seek"):
                file.seek(0)

            if len(file_content) > MAX_FILE_SIZE:
                max_mb = MAX_FILE_SIZE // (1024 * 1024)
                return {"success": False, "error": f"Arquivo muito grande. Máximo: {max_mb}MB"}

            # Processar imagem (redimensionar se necessário)
            if is_image:
                processed_content = self._resize_image(file_content, max_size=(1200, 1200), quality=85)
            else:
                processed_content = file_content  # Vídeos não redimensionamos

            # Gerar nome único
            file_extension = os.path.splitext(secure_filename(file.filename))[1].lower()
            filename = f"{user_id}/posts/{post_id or 'temp'}/{uuid.uuid4().hex[:8]}{file_extension}"

            # Bucket baseado no tipo
            bucket_name = "post-images" if is_image else "post-videos"

            # Upload para Supabase Storage
            upload_url = f"{self.supabase_url}/storage/v1/object/{bucket_name}/{filename}"
            headers = self._get_storage_headers(
                file.content_type if hasattr(file, "content_type") else ("image/jpeg" if is_image else "video/mp4")
            )

            response = requests.post(upload_url, data=processed_content, headers=headers, timeout=15)

            if response.status_code not in [200, 201]:
                logger.error(f"Erro no upload de mídia: {response.text}")
                return {"success": False, "error": f"Erro no upload: {response.text}"}

            # URL pública
            media_url = f"{self.supabase_url}/storage/v1/object/public/{bucket_name}/{filename}"

            return {
                "success": True,
                "media_url": media_url,
                "filename": filename,
                "type": "image" if is_image else "video",
                "size": len(processed_content),
            }

        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            logger.error(f"Erro no upload de mídia para post: {e}", exc_info=True)
            return {"success": False, "error": str(e)}

    def delete_avatar(self, user_id: str, filename: Optional[str] = None) -> bool:
        """
        Deleta avatar do Supabase Storage.

        Args:
            user_id: ID do usuário
            filename: Nome do arquivo (opcional, se não fornecido tenta deletar todos os avatares do usuário)

        Returns:
            bool: True se deletado, False caso contrário
        """
        try:
            if filename:
                # Deletar arquivo específico
                delete_url = f"{self.supabase_url}/storage/v1/object/{self.bucket_name}/{filename}"
                response = requests.delete(delete_url, headers=self._get_supabase_headers(), timeout=10)
                return response.status_code in [200, 204]
            else:
                # Tentar listar e deletar todos os avatares do usuário
                list_url = f"{self.supabase_url}/storage/v1/object/list/{self.bucket_name}"
                params = {"prefix": f"{user_id}/"}

                response = requests.get(list_url, headers=self._get_supabase_headers(), params=params, timeout=10)

                if response.status_code == 200:
                    files = response.json()
                    deleted_count = 0
                    for file_info in files:
                        file_name = file_info.get("name")
                        if file_name and file_name.startswith(f"{user_id}/"):
                            delete_url = f"{self.supabase_url}/storage/v1/object/{self.bucket_name}/{file_name}"
                            delete_response = requests.delete(delete_url, headers=self._get_supabase_headers(), timeout=10)
                            if delete_response.status_code in [200, 204]:
                                deleted_count += 1

                    return deleted_count > 0

                return False

        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            logger.error(f"Erro ao deletar avatar: {e}", exc_info=True)
            return False

    def create_bucket_if_not_exists(self) -> bool:
        """Cria bucket de avatares se não existir"""
        try:
            # Verificar se bucket existe
            list_url = f"{self.supabase_url}/storage/v1/bucket"

            response = requests.get(list_url, headers=self._get_supabase_headers(), timeout=10)

            if response.status_code == 200:
                buckets = response.json()
                for bucket in buckets:
                    if bucket.get("name") == self.bucket_name:
                        return True

            # Criar bucket
            create_url = f"{self.supabase_url}/storage/v1/bucket"
            bucket_data = {
                "name": self.bucket_name,
                "public": True,
                "file_size_limit": 5242880,  # 5MB
                "allowed_mime_types": ["image/jpeg", "image/png", "image/webp", "image/gif"],
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


# Instância global do serviço
image_upload_service = ImageUploadService()
