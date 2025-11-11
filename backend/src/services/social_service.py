# -*- coding: utf-8 -*-
"""
Serviço de Rede Social RE-EDUCA - Supabase

Gerencia lógica de negócio para funcionalidades sociais.
"""
import logging
from typing import Any, Dict, List, Optional

from repositories.social_repository import SocialRepository
from services.base_service import BaseService

logger = logging.getLogger(__name__)


class SocialService(BaseService):
    """Serviço para operações de rede social."""

    def __init__(self):
        """Inicializa o serviço social."""
        super().__init__()
        self.repo = SocialRepository()

    def create_post(self, user_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """Cria um novo post."""
        try:
            post_data = {
                "user_id": user_id,
                "content": data.get("content", ""),
                "post_type": data.get("post_type", "text"),
                "hashtags": data.get("hashtags", []),
                "mentions": data.get("mentions", []),
                "media_urls": data.get("media_urls", []),
                "mood": data.get("mood"),
                "location": data.get("location"),
                "is_public": data.get("is_public", True),
            }
            post = self.repo.create_post(post_data)
            return {"success": True, "post": post, "message": "Post criado com sucesso"}
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
            # Deixar Exception genérico tratar abaixo
        except Exception as e:
            return self._handle_error(e, "Erro ao criar post")

    def get_posts(
        self,
        user_id: str,
        page: int = 1,
        limit: int = 20,
        post_type: Optional[str] = None,
        hashtag: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Busca posts do feed."""
        try:
            posts = self.repo.get_posts(user_id, page, limit, post_type, hashtag)
            return {"success": True, "posts": posts, "page": page, "limit": limit}
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
            # Deixar Exception genérico tratar abaixo
        except Exception as e:
            return self._handle_error(e, "Erro ao buscar posts")

    def get_post(self, post_id: str, user_id: str) -> Dict[str, Any]:
        """Busca um post específico."""
        try:
            post = self.repo.get_post(post_id)
            if not post:
                return {"success": False, "error": "Post não encontrado"}

            # Verificar permissões se necessário
            return {"success": True, "post": post}
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
            # Deixar Exception genérico tratar abaixo
        except Exception as e:
            return self._handle_error(e, "Erro ao buscar post")

    def update_post(self, post_id: str, user_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """Atualiza um post."""
        try:
            post = self.repo.get_post(post_id)
            if not post:
                return {"success": False, "error": "Post não encontrado"}

            if post.get("user_id") != user_id:
                return {"success": False, "error": "Sem permissão para atualizar este post"}

            updated = self.repo.update_post(post_id, data)
            return {"success": True, "post": updated, "message": "Post atualizado com sucesso"}
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
            # Deixar Exception genérico tratar abaixo
        except Exception as e:
            return self._handle_error(e, "Erro ao atualizar post")

    def delete_post(self, post_id: str, user_id: str) -> Dict[str, Any]:
        """Deleta um post."""
        try:
            post = self.repo.get_post(post_id)
            if not post:
                return {"success": False, "error": "Post não encontrado"}

            if post.get("user_id") != user_id:
                return {"success": False, "error": "Sem permissão para deletar este post"}

            self.repo.delete_post(post_id)
            return {"success": True, "message": "Post deletado com sucesso"}
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
            # Deixar Exception genérico tratar abaixo
        except Exception as e:
            return self._handle_error(e, "Erro ao deletar post")

    def create_comment(self, post_id: str, user_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """Cria um comentário em um post."""
        try:
            comment_data = {
                "post_id": post_id,
                "user_id": user_id,
                "content": data.get("content"),
            }
            comment = self.repo.create_comment(comment_data)
            return {"success": True, "comment": comment, "message": "Comentário criado com sucesso"}
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
            # Deixar Exception genérico tratar abaixo
        except Exception as e:
            return self._handle_error(e, "Erro ao criar comentário")

    def get_comments(self, post_id: str, user_id: str, page: int = 1, limit: int = 20) -> Dict[str, Any]:
        """Busca comentários de um post."""
        try:
            comments = self.repo.get_comments(post_id, page, limit)
            return {"success": True, "comments": comments, "page": page, "limit": limit}
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
            # Deixar Exception genérico tratar abaixo
        except Exception as e:
            return self._handle_error(e, "Erro ao buscar comentários")

    def create_reaction(self, post_id: str, user_id: str, reaction_type: str) -> Dict[str, Any]:
        """Cria uma reação em um post."""
        try:
            reaction = self.repo.create_reaction(post_id, user_id, reaction_type)
            return {"success": True, "reaction": reaction, "message": "Reação adicionada com sucesso"}
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
            # Deixar Exception genérico tratar abaixo
        except Exception as e:
            return self._handle_error(e, "Erro ao criar reação")

    def remove_reaction(self, post_id: str, user_id: str, reaction_type: Optional[str] = None) -> Dict[str, Any]:
        """Remove uma reação de um post."""
        try:
            self.repo.remove_reaction(post_id, user_id, reaction_type)
            return {"success": True, "message": "Reação removida com sucesso"}
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
            # Deixar Exception genérico tratar abaixo
        except Exception as e:
            return self._handle_error(e, "Erro ao remover reação")

    def follow_user(self, follower_id: str, user_id: str) -> Dict[str, Any]:
        """Segue um usuário."""
        try:
            if follower_id == user_id:
                return {"success": False, "error": "Você não pode seguir a si mesmo"}

            self.repo.follow_user(follower_id, user_id)
            return {"success": True, "message": "Usuário seguido com sucesso"}
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
            # Deixar Exception genérico tratar abaixo
        except Exception as e:
            return self._handle_error(e, "Erro ao seguir usuário")

    def unfollow_user(self, follower_id: str, user_id: str) -> Dict[str, Any]:
        """Deixa de seguir um usuário."""
        try:
            self.repo.unfollow_user(follower_id, user_id)
            return {"success": True, "message": "Usuário deixado de seguir com sucesso"}
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
            # Deixar Exception genérico tratar abaixo
        except Exception as e:
            return self._handle_error(e, "Erro ao deixar de seguir usuário")

    def get_notifications(
        self, user_id: str, page: int = 1, limit: int = 20, unread_only: bool = False
    ) -> Dict[str, Any]:
        """Busca notificações do usuário."""
        try:
            notifications = self.repo.get_notifications(user_id, page, limit, unread_only)
            return {"success": True, "notifications": notifications, "page": page, "limit": limit}
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
            # Deixar Exception genérico tratar abaixo
        except Exception as e:
            return self._handle_error(e, "Erro ao buscar notificações")

    def mark_notification_read(self, notification_id: str, user_id: str) -> Dict[str, Any]:
        """Marca uma notificação como lida."""
        try:
            self.repo.mark_notification_read(notification_id, user_id)
            return {"success": True, "message": "Notificação marcada como lida"}
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
            # Deixar Exception genérico tratar abaixo
        except Exception as e:
            return self._handle_error(e, "Erro ao marcar notificação como lida")

    def search(
        self,
        query: str,
        search_type: str = "all",
        page: int = 1,
        limit: int = 20,
        filters: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Busca avançada de posts, usuários ou hashtags com filtros.

        Args:
            query: Termo de busca
            search_type: Tipo (all, posts, users, hashtags)
            page: Número da página
            limit: Limite por página
            filters: Filtros avançados (dateRange, sortBy, verified, media, minLikes, location, type)

        Returns:
            Dict com resultados e metadados
        """
        try:
            results = self.repo.search(query, search_type, page, limit, filters)
            
            # Calcular totais para paginação
            total_posts = len(results.get("posts", []))
            total_users = len(results.get("users", []))
            total_hashtags = len(results.get("hashtags", []))
            total = total_posts + total_users + total_hashtags
            
            return {
                "success": True,
                "results": results,
                "query": query,
                "type": search_type,
                "filters": filters or {},
                "page": page,
                "limit": limit,
                "total": total,
                "counts": {
                    "posts": total_posts,
                    "users": total_users,
                    "hashtags": total_hashtags,
                },
            }
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            return {"success": False, "error": f"Erro de validação: {str(e)}", "results": {"posts": [], "users": [], "hashtags": []}}
        except Exception as e:
            return self._handle_error(e, "Erro ao realizar busca")

    def get_user_profile(self, user_id: str, viewer_id: str) -> Dict[str, Any]:
        """
        Busca perfil público de um usuário.

        Args:
            user_id: ID do usuário cujo perfil será buscado
            viewer_id: ID do usuário que está visualizando

        Returns:
            Dict com dados do perfil
        """
        try:
            profile = self.repo.get_user_profile(user_id, viewer_id)
            if not profile:
                return {"success": False, "error": "Usuário não encontrado"}

            return {"success": True, "profile": profile}
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
            # Deixar Exception genérico tratar abaixo
        except Exception as e:
            return self._handle_error(e, "Erro ao buscar perfil do usuário")

    def get_user_posts(self, user_id: str, viewer_id: str, page: int = 1, limit: int = 20) -> Dict[str, Any]:
        """
        Busca posts de um usuário específico.

        Args:
            user_id: ID do usuário
            viewer_id: ID do usuário visualizando
            page: Número da página
            limit: Limite por página

        Returns:
            Dict com lista de posts
        """
        try:
            posts = self.repo.get_user_posts(user_id, viewer_id, page, limit)
            return {"success": True, "posts": posts, "page": page, "limit": limit}
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
            # Deixar Exception genérico tratar abaixo
        except Exception as e:
            return self._handle_error(e, "Erro ao buscar posts do usuário")

    def check_follow_status(self, follower_id: str, following_id: str) -> Dict[str, Any]:
        """
        Verifica status de seguimento entre dois usuários.

        Args:
            follower_id: ID do usuário que pode estar seguindo
            following_id: ID do usuário que pode estar sendo seguido

        Returns:
            Dict com status de seguimento
        """
        try:
            is_following = self.repo.is_following(follower_id, following_id)
            is_follower = self.repo.is_following(following_id, follower_id)

            return {
                "success": True,
                "is_following": is_following,
                "is_follower": is_follower,
                "is_mutual": is_following and is_follower,
            }
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
            # Deixar Exception genérico tratar abaixo
        except Exception as e:
            return self._handle_error(e, "Erro ao verificar status de seguimento")

    def get_user_posts_for_analytics(self, user_id: str, limit: int = 20) -> List[Dict[str, Any]]:
        """
        Busca posts do usuário para analytics (formato simplificado).

        Args:
            user_id: ID do usuário
            limit: Limite de resultados

        Returns:
            Lista de posts simplificados
        """
        try:
            result = self.get_user_posts(user_id, user_id, page=1, limit=limit)
            if result.get("success"):
                posts = result.get("posts", [])
                # Formatar para analytics (apenas campos necessários)
                return [
                    {
                        "id": p.get("id"),
                        "content": (p.get("content", "") or "")[:100],  # Truncar
                        "timestamp": p.get("created_at"),
                    }
                    for p in posts
                ]
            return []
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            self.logger.error(f"Erro ao buscar posts para analytics: {str(e)}", exc_info=True)
            return []


# Instância global do serviço
social_service = SocialService()
