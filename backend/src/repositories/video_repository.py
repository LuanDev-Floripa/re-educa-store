# -*- coding: utf-8 -*-
"""
Repositório de Vídeos RE-EDUCA Store.

Gerencia acesso a dados de upload e gerenciamento de vídeos.
"""
import logging
from typing import Any, Dict, List, Optional

from repositories.base_repository import BaseRepository

logger = logging.getLogger(__name__)


class VideoRepository(BaseRepository):
    """
    Repositório para operações com vídeos.

    Tabela: video_uploads
    """

    def __init__(self):
        """Inicializa o repositório de vídeos."""
        super().__init__("video_uploads")

    def create_video(self, video_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Cria registro de vídeo.

        Args:
            video_data: Dados do vídeo

        Returns:
            Vídeo criado ou None
        """
        try:
            from datetime import datetime

            from utils.helpers import generate_uuid

            if "id" not in video_data:
                video_data["id"] = generate_uuid()
            if "created_at" not in video_data:
                video_data["created_at"] = datetime.now().isoformat()
            if "status" not in video_data:
                video_data["status"] = "uploaded"

            return self.create(video_data)
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            self.logger.error(f"Erro ao criar vídeo: {str(e)}", exc_info=True)
            return None

    def find_by_user(self, user_id: str, limit: Optional[int] = None, offset: int = 0) -> List[Dict[str, Any]]:
        """
        Busca vídeos de um usuário.

        Args:
            user_id: ID do usuário
            limit: Limite de resultados
            offset: Offset para paginação

        Returns:
            Lista de vídeos
        """
        try:
            return self.find_all(
                filters={"user_id": user_id}, order_by="created_at", desc=True, limit=limit, offset=offset
            )
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            self.logger.error(f"Erro ao buscar vídeos do usuário: {str(e)}", exc_info=True)
            return []

    def update_video_status(
        self, video_id: str, user_id: str, status: str, update_data: Optional[Dict[str, Any]] = None
    ) -> Optional[Dict[str, Any]]:
        """
        Atualiza status e outros dados do vídeo.

        Args:
            video_id: ID do vídeo
            user_id: ID do usuário (para validação)
            status: Novo status
            update_data: Dados adicionais para atualizar

        Returns:
            Vídeo atualizado ou None
        """
        try:
            # Verifica se o vídeo pertence ao usuário
            video = self.find_by_id(video_id)
            if not video or video.get("user_id") != user_id:
                return None

            from datetime import datetime

            data_to_update = update_data or {}
            data_to_update["status"] = status
            data_to_update["updated_at"] = datetime.now().isoformat()

            return self.update(video_id, data_to_update)
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            self.logger.error(f"Erro ao atualizar status do vídeo: {str(e)}", exc_info=True)
            return None

    def delete_video(self, video_id: str, user_id: str) -> bool:
        """
        Deleta vídeo (apenas se pertencer ao usuário).

        Args:
            video_id: ID do vídeo
            user_id: ID do usuário (para validação)

        Returns:
            True se deletado, False caso contrário
        """
        try:
            # Verifica se o vídeo pertence ao usuário
            video = self.find_by_id(video_id)
            if not video or video.get("user_id") != user_id:
                return False

            return self.delete(video_id)
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            self.logger.error(f"Erro ao deletar vídeo: {str(e)}", exc_info=True)
            return False

    def get_video_views(self, video_id: str) -> List[Dict[str, Any]]:
        """
        Busca visualizações de um vídeo.

        Args:
            video_id: ID do vídeo

        Returns:
            Lista de visualizações
        """
        try:
            result = self.db.table("video_views").select("user_id, view_duration").eq("video_id", video_id).execute()
            return result.data if result.data else []
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            self.logger.warning(f"Tabela video_views pode não existir: {str(e)}")
            return []
