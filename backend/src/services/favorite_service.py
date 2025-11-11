"""
Service de Favoritos RE-EDUCA Store.

Gerencia operações relacionadas a favoritos.
"""

import logging
from typing import Any, Dict, List

from repositories.favorite_repository import FavoriteRepository
from services.base_service import BaseService

logger = logging.getLogger(__name__)


class FavoriteService(BaseService):
    """
    Service para operações de favoritos.

    Usa FavoriteRepository para acesso a dados.
    """

    def __init__(self):
        super().__init__()
        self.repo = FavoriteRepository()

    def get_user_favorites(self, user_id: str) -> List[Dict[str, Any]]:
        """
        Retorna favoritos do usuário.

        Args:
            user_id: ID do usuário

        Returns:
            Lista de favoritos com produtos
        """
        try:
            return self.repo.find_by_user(user_id)
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            self.logger.error(f"Erro ao buscar favoritos: {str(e)}", exc_info=True)
            return []

    def add_favorite(self, user_id: str, product_id: str) -> Dict[str, Any]:
        """
        Adiciona produto aos favoritos.

        Args:
            user_id: ID do usuário
            product_id: ID do produto

        Returns:
            Dict com success ou error
        """
        try:
            from datetime import datetime

            from utils.helpers import generate_uuid

            # Verifica se já existe
            existing = self.repo.find_by_user_and_product(user_id, product_id)
            if existing:
                return {"success": False, "error": "Produto já está nos favoritos"}

            favorite_data = {
                "id": generate_uuid(),
                "user_id": user_id,
                "product_id": product_id,
                "created_at": datetime.utcnow().isoformat(),
            }

            created = self.repo.create(favorite_data)

            if created:
                return {"success": True, "favorite": created}
            else:
                return {"success": False, "error": "Erro ao adicionar favorito"}
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            self.logger.error(f"Erro ao adicionar favorito: {str(e)}", exc_info=True)
            return {"success": False, "error": "Erro interno do servidor"}

    def remove_favorite(self, user_id: str, product_id: str) -> Dict[str, Any]:
        """
        Remove produto dos favoritos.

        Args:
            user_id: ID do usuário
            product_id: ID do produto

        Returns:
            Dict com success ou error
        """
        try:
            # Verifica se existe
            existing = self.repo.find_by_user_and_product(user_id, product_id)
            if not existing:
                return {"success": False, "error": "Favorito não encontrado"}

            deleted = self.repo.delete(existing["id"])

            if deleted:
                return {"success": True, "message": "Favorito removido com sucesso"}
            else:
                return {"success": False, "error": "Erro ao remover favorito"}
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            self.logger.error(f"Erro ao remover favorito: {str(e)}", exc_info=True)
            return {"success": False, "error": "Erro interno do servidor"}
