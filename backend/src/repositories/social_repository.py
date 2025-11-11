"""
Repositório de Rede Social RE-EDUCA Store.

Gerencia acesso a dados de funcionalidades sociais.
"""

import logging
from typing import Any, Dict, List, Optional

from repositories.base_repository import BaseRepository

logger = logging.getLogger(__name__)


class SocialRepository(BaseRepository):
    """
    Repositório para operações sociais.

    Tabelas:
    - follows
    - posts
    - reactions
    - comments
    - etc.
    """

    def __init__(self):
        """Inicializa o repositório social."""
        super().__init__("follows")  # Tabela padrão

    def count_followers(self, user_id: str) -> int:
        """
        Conta seguidores de um usuário.

        Args:
            user_id: ID do usuário

        Returns:
            Número de seguidores
        """
        try:
            result = self.db.table("follows").select("id", count="exact").eq("following_id", user_id).execute()
            return (
                result.count
                if hasattr(result, "count") and result.count is not None
                else (len(result.data) if result.data else 0)
            )
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            self.logger.error(f"Erro ao contar seguidores: {str(e)}", exc_info=True)
            return 0

    def count_following(self, user_id: str) -> int:
        """
        Conta quantos usuários o usuário segue.

        Args:
            user_id: ID do usuário

        Returns:
            Número de usuários seguidos
        """
        try:
            result = self.db.table("follows").select("id", count="exact").eq("follower_id", user_id).execute()
            return (
                result.count
                if hasattr(result, "count") and result.count is not None
                else (len(result.data) if result.data else 0)
            )
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            self.logger.error(f"Erro ao contar seguindo: {str(e)}", exc_info=True)
            return 0

    def get_user_post_ids(self, user_id: str) -> List[str]:
        """
        Busca IDs dos posts de um usuário.

        Args:
            user_id: ID do usuário

        Returns:
            Lista de IDs dos posts
        """
        try:
            result = self.db.table("posts").select("id").eq("user_id", user_id).execute()
            if result.data:
                return [p.get("id") for p in result.data if p.get("id")]
            return []
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            self.logger.error(f"Erro ao buscar posts do usuário: {str(e)}", exc_info=True)
            return []

    def count_post_likes(self, post_id: str) -> int:
        """
        Conta likes de um post.

        Args:
            post_id: ID do post

        Returns:
            Número de likes
        """
        try:
            result = (
                self.db.table("reactions")
                .select("id", count="exact")
                .eq("post_id", post_id)
                .eq("reaction_type", "like")
                .execute()
            )
            return (
                result.count
                if hasattr(result, "count") and result.count is not None
                else (len(result.data) if result.data else 0)
            )
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            self.logger.error(f"Erro ao contar likes do post {post_id}: {str(e)}", exc_info=True)
            return 0

    def count_total_likes_for_user(self, user_id: str) -> int:
        """
        Conta total de likes recebidos pelo usuário em todos os posts.
        
        Otimizado para usar uma única query com JOIN em vez de N+1 queries.

        Args:
            user_id: ID do usuário

        Returns:
            Total de likes recebidos
        """
        try:
            # 1. Buscar IDs dos posts do usuário
            post_ids = self.get_user_post_ids(user_id)
            if not post_ids:
                return 0

            # 2. Contar likes em uma única query com IN (batch)
            result = (
                self.db.table("reactions")
                .select("id", count="exact")
                .eq("reaction_type", "like")
                .in_("post_id", post_ids)
                .execute()
            )

            return (
                result.count
                if hasattr(result, "count") and result.count is not None
                else (len(result.data) if result.data else 0)
            )
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            self.logger.error(f"Erro ao contar total de likes: {str(e)}", exc_info=True)
            return 0

    # =====================================================
    # MÉTODOS DE POSTS
    # =====================================================

    def create_post(self, post_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Cria um novo post.

        Args:
            post_data: Dados do post (user_id, content, post_type, etc)

        Returns:
            Post criado ou None em caso de erro
        """
        try:
            result = self.db.table("posts").insert(post_data).execute()
            if result.data and len(result.data) > 0:
                post = result.data[0]
                # Buscar dados do usuário para incluir no retorno
                return self._enrich_post_with_user_data(post)
            return None
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            self.logger.error(f"Erro ao criar post: {str(e)}", exc_info=True)
            return None

    def get_posts(
        self,
        user_id: str,
        page: int = 1,
        limit: int = 20,
        post_type: Optional[str] = None,
        hashtag: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        """
        Busca posts do feed.

        Faz JOIN com tabela users para trazer dados do autor.

        Args:
            user_id: ID do usuário logado (para verificar reações próprias)
            page: Número da página
            limit: Limite por página
            post_type: Tipo de post (filtro opcional)
            hashtag: Hashtag (filtro opcional)

        Returns:
            Lista de posts com dados do usuário enriquecidos
        """
        try:
            offset = (page - 1) * limit

            # Query base com JOIN para trazer dados do usuário
            # Supabase PostgREST permite joins usando sintaxe: select('*, users(*)')
            query = (
                self.db.table("posts")
                .select("*, users!posts_user_id_fkey(id, name, email, avatar_url)")
                .order("created_at", desc=True)
                .range(offset, offset + limit - 1)
            )

            # Filtros
            if post_type:
                query = query.eq("post_type", post_type)

            if hashtag:
                # Buscar posts que contenham a hashtag (busca em array ou texto)
                # Assumindo que hashtags são armazenadas como array JSONB
                query = query.contains("hashtags", [hashtag])

            result = query.execute()
            posts = result.data if result.data else []

            # Se houver muitos posts, fazer batch queries para contadores
            if posts:
                post_ids = [p.get("id") for p in posts if p.get("id")]

                # Buscar contadores de reações em batch (uma query para todos)
                reaction_counts = {}
                if post_ids:
                    try:
                        reactions_result = (
                            self.db.table("reactions")
                            .select("post_id")
                            .eq("reaction_type", "like")
                            .in_("post_id", post_ids)
                            .execute()
                        )
                        # Contar por post_id
                        if reactions_result.data:
                            for reaction in reactions_result.data:
                                post_id = reaction.get("post_id")
                                if post_id:
                                    reaction_counts[post_id] = reaction_counts.get(post_id, 0) + 1
                    except (ValueError, KeyError) as e:
                        logger.warning(f"Erro de validação: {str(e)}")
                        # Tratamento específico pode ser adicionado aqui
                    except Exception as e:
                        self.logger.warning(f"Erro ao buscar contadores de reações em batch: {str(e)}")

                # Buscar contadores de comentários em batch
                comment_counts = {}
                if post_ids:
                    try:
                        comments_result = self.db.table("comments").select("post_id").in_("post_id", post_ids).execute()
                        # Contar por post_id
                        if comments_result.data:
                            for comment in comments_result.data:
                                post_id = comment.get("post_id")
                                if post_id:
                                    comment_counts[post_id] = comment_counts.get(post_id, 0) + 1
                    except (ValueError, KeyError) as e:
                        logger.warning(f"Erro de validação: {str(e)}")
                        # Tratamento específico pode ser adicionado aqui
                    except Exception as e:
                        self.logger.warning(f"Erro ao buscar contadores de comentários em batch: {str(e)}")

                # Verificar reações do usuário atual em batch
                user_reactions = set()
                if user_id and post_ids:
                    try:
                        user_reactions_result = (
                            self.db.table("reactions")
                            .select("post_id")
                            .eq("user_id", user_id)
                            .in_("post_id", post_ids)
                            .execute()
                        )
                        if user_reactions_result.data:
                            user_reactions = {r.get("post_id") for r in user_reactions_result.data if r.get("post_id")}
                    except (ValueError, KeyError) as e:
                        logger.warning(f"Erro de validação: {str(e)}")
                        # Tratamento específico pode ser adicionado aqui
                    except Exception as e:
                        self.logger.warning(f"Erro ao buscar reações do usuário em batch: {str(e)}")

                # Enriquecer posts com dados já obtidos em batch
                enriched_posts = []
                for post in posts:
                    post_id = post.get("id")
                    enriched = {
                        **post,
                        "reaction_count": reaction_counts.get(post_id, 0),
                        "comment_count": comment_counts.get(post_id, 0),
                        "user_reacted": post_id in user_reactions,
                    }
                    # Adicionar dados do usuário (já vem do JOIN)
                    if isinstance(post.get("users"), dict):
                        user = post["users"]
                        enriched.update(
                            {
                                "user_name": user.get("name") or user.get("email", ""),
                                "avatar_url": user.get("avatar_url"),
                                "user_email": user.get("email"),
                            }
                        )
                    enriched.pop("users", None)
                    enriched_posts.append(enriched)

                return enriched_posts

            return []
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            self.logger.error(f"Erro ao buscar posts: {str(e)}", exc_info=True)
            # Fallback: tentar sem JOIN
            try:
                result = (
                    self.db.table("posts")
                    .select("*")
                    .order("created_at", desc=True)
                    .range(offset, offset + limit - 1)
                    .execute()
                )
                posts = result.data if result.data else []
                return [self._enrich_post_with_user_data(p, user_id) for p in posts]
            except Exception as e2:
                self.logger.error(f"Erro no fallback de busca de posts: {str(e2)}")
                return []

    def get_post(self, post_id: str) -> Optional[Dict[str, Any]]:
        """
        Busca um post específico.

        Args:
            post_id: ID do post

        Returns:
            Post com dados do usuário ou None
        """
        try:
            result = (
                self.db.table("posts")
                .select("*, users!posts_user_id_fkey(id, name, email, avatar_url)")
                .eq("id", post_id)
                .execute()
            )
            if result.data and len(result.data) > 0:
                post = result.data[0]
                return self._enrich_post_with_user_data(post)
            return None
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            self.logger.error(f"Erro ao buscar post {post_id}: {str(e)}", exc_info=True)
            # Fallback
            try:
                result = self.db.table("posts").select("*").eq("id", post_id).execute()
                if result.data and len(result.data) > 0:
                    return self._enrich_post_with_user_data(result.data[0])
            except Exception as e:
                self.logger.debug(f"Fallback de busca de post falhou (esperado): {str(e)}")
                pass
            return None

    def update_post(self, post_id: str, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Atualiza um post.

        Args:
            post_id: ID do post
            data: Dados a serem atualizados

        Returns:
            Post atualizado ou None
        """
        try:
            result = self.db.table("posts").update(data).eq("id", post_id).execute()
            if result.data and len(result.data) > 0:
                return self._enrich_post_with_user_data(result.data[0])
            return None
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            self.logger.error(f"Erro ao atualizar post {post_id}: {str(e)}", exc_info=True)
            return None

    def delete_post(self, post_id: str) -> bool:
        """
        Deleta um post.

        Args:
            post_id: ID do post

        Returns:
            True se deletado, False caso contrário
        """
        try:
            result = self.db.table("posts").delete().eq("id", post_id).execute()
            return result.data is not None
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            self.logger.error(f"Erro ao deletar post {post_id}: {str(e)}", exc_info=True)
            return False

    # =====================================================
    # MÉTODOS DE COMENTÁRIOS
    # =====================================================

    def create_comment(self, comment_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Cria um comentário.

        Args:
            comment_data: Dados do comentário (post_id, user_id, content, parent_id)

        Returns:
            Comentário criado ou None
        """
        try:
            result = self.db.table("comments").insert(comment_data).execute()
            if result.data and len(result.data) > 0:
                comment = result.data[0]
                return self._enrich_comment_with_user_data(comment)
            return None
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            self.logger.error(f"Erro ao criar comentário: {str(e)}", exc_info=True)
            return None

    def get_comments(self, post_id: str, page: int = 1, limit: int = 20) -> List[Dict[str, Any]]:
        """
        Busca comentários de um post.

        Args:
            post_id: ID do post
            page: Número da página
            limit: Limite por página

        Returns:
            Lista de comentários com dados do usuário
        """
        try:
            offset = (page - 1) * limit
            result = (
                self.db.table("comments")
                .select("*, users!comments_user_id_fkey(id, name, email, avatar_url)")
                .eq("post_id", post_id)
                .order("created_at", desc=False)  # Mais antigos primeiro
                .range(offset, offset + limit - 1)
                .execute()
            )
            comments = result.data if result.data else []
            return [self._enrich_comment_with_user_data(c) for c in comments]
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            self.logger.error(f"Erro ao buscar comentários do post {post_id}: {str(e)}", exc_info=True)
            return []

    # =====================================================
    # MÉTODOS DE REAÇÕES
    # =====================================================

    def create_reaction(self, post_id: str, user_id: str, reaction_type: str) -> Optional[Dict[str, Any]]:
        """
        Cria ou atualiza uma reação em um post.

        Args:
            post_id: ID do post
            user_id: ID do usuário
            reaction_type: Tipo de reação (like, love, etc)

        Returns:
            Reação criada/atualizada ou None
        """
        try:
            # Verificar se já existe reação
            existing = (
                self.db.table("reactions")
                .select("*")
                .eq("post_id", post_id)
                .eq("user_id", user_id)
                .eq("reaction_type", reaction_type)
                .execute()
            )

            if existing.data and len(existing.data) > 0:
                # Já existe, retornar existente
                return existing.data[0]

            # Criar nova reação
            result = (
                self.db.table("reactions")
                .insert({"post_id": post_id, "user_id": user_id, "reaction_type": reaction_type})
                .execute()
            )
            if result.data and len(result.data) > 0:
                return result.data[0]
            return None
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            self.logger.error(f"Erro ao criar reação: {str(e)}", exc_info=True)
            return None

    def remove_reaction(self, post_id: str, user_id: str, reaction_type: Optional[str] = None) -> bool:
        """
        Remove uma reação de um post.

        Args:
            post_id: ID do post
            user_id: ID do usuário
            reaction_type: Tipo de reação (opcional, remove qualquer tipo se None)

        Returns:
            True se removido, False caso contrário
        """
        try:
            query = self.db.table("reactions").delete().eq("post_id", post_id).eq("user_id", user_id)
            if reaction_type:
                query = query.eq("reaction_type", reaction_type)

            result = query.execute()
            return result.data is not None
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            self.logger.error(f"Erro ao remover reação: {str(e)}", exc_info=True)
            return False

    # =====================================================
    # MÉTODOS DE SEGUIMENTOS
    # =====================================================

    def follow_user(self, follower_id: str, following_id: str) -> Optional[Dict[str, Any]]:
        """
        Cria relação de seguimento.

        Args:
            follower_id: ID do usuário que está seguindo
            following_id: ID do usuário sendo seguido

        Returns:
            Relação criada ou None
        """
        try:
            # Verificar se já existe
            existing = (
                self.db.table("follows")
                .select("*")
                .eq("follower_id", follower_id)
                .eq("following_id", following_id)
                .execute()
            )

            if existing.data and len(existing.data) > 0:
                return existing.data[0]

            # Criar nova relação
            result = (
                self.db.table("follows").insert({"follower_id": follower_id, "following_id": following_id}).execute()
            )
            if result.data and len(result.data) > 0:
                return result.data[0]
            return None
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            self.logger.error(f"Erro ao seguir usuário: {str(e)}", exc_info=True)
            return None

    def unfollow_user(self, follower_id: str, following_id: str) -> bool:
        """
        Remove relação de seguimento.

        Args:
            follower_id: ID do usuário que está deixando de seguir
            following_id: ID do usuário sendo deixado de seguir

        Returns:
            True se removido, False caso contrário
        """
        try:
            result = (
                self.db.table("follows")
                .delete()
                .eq("follower_id", follower_id)
                .eq("following_id", following_id)
                .execute()
            )
            return result.data is not None
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            self.logger.error(f"Erro ao deixar de seguir: {str(e)}", exc_info=True)
            return False

    def is_following(self, follower_id: str, following_id: str) -> bool:
        """
        Verifica se um usuário está seguindo outro.

        Args:
            follower_id: ID do usuário que pode estar seguindo
            following_id: ID do usuário que pode estar sendo seguido

        Returns:
            True se está seguindo, False caso contrário
        """
        try:
            result = (
                self.db.table("follows")
                .select("id")
                .eq("follower_id", follower_id)
                .eq("following_id", following_id)
                .execute()
            )
            return result.data is not None and len(result.data) > 0
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            self.logger.error(f"Erro ao verificar seguimento: {str(e)}", exc_info=True)
            return False

    # =====================================================
    # MÉTODOS DE BUSCA
    # =====================================================

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
            filters: Filtros avançados (dateRange, sortBy, verified, media, minLikes, location)

        Returns:
            Dict com resultados organizados por tipo
        """
        try:
            from datetime import datetime, timedelta

            offset = (page - 1) * limit
            filters = filters or {}
            results = {"posts": [], "users": [], "hashtags": []}

            # Buscar posts com filtros avançados
            if search_type in ("all", "posts"):
                try:
                    posts_query = (
                        self.db.table("posts")
                        .select("*, users!posts_user_id_fkey(id, name, email, avatar_url)")
                    )

                    # Filtro de texto
                    if query:
                        posts_query = posts_query.ilike("content", f"%{query}%")

                    # Filtro por tipo de post
                    if filters.get("type") and filters["type"] != "all":
                        posts_query = posts_query.eq("post_type", filters["type"])

                    # Filtro por data
                    date_range = filters.get("dateRange", "all")
                    if date_range != "all":
                        now = datetime.utcnow()
                        if date_range == "day":
                            start_date = (now - timedelta(days=1)).isoformat()
                        elif date_range == "week":
                            start_date = (now - timedelta(days=7)).isoformat()
                        elif date_range == "month":
                            start_date = (now - timedelta(days=30)).isoformat()
                        elif date_range == "year":
                            start_date = (now - timedelta(days=365)).isoformat()
                        else:
                            start_date = None

                        if start_date:
                            posts_query = posts_query.gte("created_at", start_date)

                    # Filtro por usuário verificado
                    if filters.get("verified") is True:
                        # Buscar apenas posts de usuários verificados
                        # Assumindo que há campo verified em users ou account_verifications
                        # Por enquanto, buscar posts e filtrar depois
                        pass  # Implementar quando tiver campo verified

                    # Filtro por posts com mídia
                    if filters.get("media") is True:
                        posts_query = posts_query.not_.is_("media_urls", "null")
                        posts_query = posts_query.neq("media_urls", "[]")

                    # Ordenação
                    sort_by = filters.get("sortBy", "recent")
                    if sort_by == "recent":
                        posts_query = posts_query.order("created_at", desc=True)
                    elif sort_by == "oldest":
                        posts_query = posts_query.order("created_at", desc=False)
                    elif sort_by == "popular":
                        # Ordenar por likes (precisa calcular ou usar campo calculado)
                        posts_query = posts_query.order("created_at", desc=True)  # Fallback

                    posts_result = posts_query.range(offset, offset + limit - 1).execute()

                    if posts_result.data:
                        posts = [self._enrich_post_with_user_data(p) for p in posts_result.data]

                        # Filtro por mínimo de likes (após buscar)
                        min_likes = filters.get("minLikes", 0)
                        if min_likes > 0:
                            posts = [p for p in posts if p.get("reaction_count", 0) >= min_likes]

                        # Filtro por localização
                        location = filters.get("location")
                        if location:
                            posts = [
                                p
                                for p in posts
                                if p.get("location") and location.lower() in p.get("location", "").lower()
                            ]

                        results["posts"] = posts
                except (ValueError, KeyError) as e:
                    logger.warning(f"Erro de validação: {str(e)}")
                except Exception as e:
                    self.logger.warning(f"Erro ao buscar posts: {str(e)}")

            # Buscar usuários com filtros
            if search_type in ("all", "users"):
                try:
                    users_query = self.db.table("users").select("id, name, email, avatar_url, bio")

                    if query:
                        users_query = users_query.or_(f"name.ilike.%{query}%,email.ilike.%{query}%")

                    # Filtro por verificado
                    if filters.get("verified") is True:
                        # Buscar apenas usuários verificados
                        # Assumindo tabela account_verifications
                        try:
                            verified_users_result = (
                                self.db.table("account_verifications")
                                .select("user_id")
                                .eq("status", "verified")
                                .execute()
                            )
                            verified_user_ids = (
                                [v.get("user_id") for v in verified_users_result.data if v.get("user_id")]
                                if verified_users_result.data
                                else []
                            )
                            if verified_user_ids:
                                users_query = users_query.in_("id", verified_user_ids)
                            else:
                                # Nenhum usuário verificado, retornar vazio
                                results["users"] = []
                                return results
                        except Exception:
                            # Se tabela não existir, ignorar filtro
                            pass

                    users_result = users_query.range(offset, offset + limit - 1).execute()
                    if users_result.data:
                        results["users"] = users_result.data
                except (ValueError, KeyError) as e:
                    logger.warning(f"Erro de validação: {str(e)}")
                except Exception as e:
                    self.logger.warning(f"Erro ao buscar usuários: {str(e)}")

            # Hashtags (buscar em posts que contenham hashtag)
            if search_type in ("all", "hashtags"):
                try:
                    hashtag_query = self.db.table("posts").select("hashtags")

                    if query:
                        hashtag_query = hashtag_query.contains("hashtags", [query.replace("#", "")])

                    hashtag_result = hashtag_query.execute()

                    # Extrair hashtags únicas
                    hashtags = set()
                    if hashtag_result.data:
                        for post in hashtag_result.data:
                            if post.get("hashtags"):
                                hashtags.update(post.get("hashtags", []))

                    results["hashtags"] = [{"tag": tag} for tag in list(hashtags)[:limit]]
                except (ValueError, KeyError) as e:
                    logger.warning(f"Erro de validação: {str(e)}")
                except Exception as e:
                    self.logger.warning(f"Erro ao buscar hashtags: {str(e)}")

            return results
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            return {"posts": [], "users": [], "hashtags": []}
        except Exception as e:
            self.logger.error(f"Erro na busca: {str(e)}", exc_info=True)
            return {"posts": [], "users": [], "hashtags": []}

    # =====================================================
    # MÉTODOS DE NOTIFICAÇÕES
    # =====================================================

    def get_notifications(
        self, user_id: str, page: int = 1, limit: int = 20, unread_only: bool = False
    ) -> List[Dict[str, Any]]:
        """
        Busca notificações do usuário.

        Args:
            user_id: ID do usuário
            page: Número da página
            limit: Limite por página
            unread_only: Se deve retornar apenas não lidas

        Returns:
            Lista de notificações
        """
        try:
            offset = (page - 1) * limit
            query = (
                self.db.table("notifications")
                .select("*")
                .eq("user_id", user_id)
                .order("created_at", desc=True)
                .range(offset, offset + limit - 1)
            )

            if unread_only:
                query = query.eq("is_read", False)

            result = query.execute()
            return result.data if result.data else []
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            self.logger.error(f"Erro ao buscar notificações: {str(e)}", exc_info=True)
            return []

    def mark_notification_read(self, notification_id: str, user_id: str) -> bool:
        """
        Marca notificação como lida.

        Args:
            notification_id: ID da notificação
            user_id: ID do usuário (verificação de segurança)

        Returns:
            True se atualizado, False caso contrário
        """
        try:
            result = (
                self.db.table("notifications")
                .update({"is_read": True})
                .eq("id", notification_id)
                .eq("user_id", user_id)
                .execute()
            )
            return result.data is not None
        except (ValueError, KeyError) as e:
            self.logger.warning(f"Erro de validação ao marcar notificação: {str(e)}")
            return False
        except Exception as e:
            self.logger.error(f"Erro ao marcar notificação como lida: {str(e)}", exc_info=True)
            return False

    # =====================================================
    # MÉTODOS AUXILIARES - ENRIQUECIMENTO DE DADOS
    # =====================================================

    def _enrich_post_with_user_data(
        self, post: Dict[str, Any], current_user_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Enriquece post com dados do usuário e contadores.

        Otimizado para usar dados já presentes no JOIN, evitando queries adicionais.

        Args:
            post: Dados do post (já deve vir com dados do usuário via JOIN)
            current_user_id: ID do usuário atual (para verificar reação própria)

        Returns:
            Post enriquecido
        """
        try:
            user_data = {}
            if isinstance(post.get("users"), dict):
                user = post["users"]
                user_data = {
                    "user_name": user.get("name") or user.get("email", ""),
                    "avatar_url": user.get("avatar_url"),
                    "user_email": user.get("email"),
                }
            elif post.get("user_id"):
                # Se não veio no JOIN, usar dados básicos do post
                # Não fazer query adicional (evitar N+1)
                user_data = {
                    "user_name": post.get("user_name", ""),
                    "avatar_url": post.get("avatar_url"),
                    "user_email": post.get("user_email", ""),
                }

            # Ou calcular uma única vez (não fazer query adicional se não necessário)
            post_id = post.get("id", "")

            # Se os contadores já estão no post (via triggers/views), usar
            reaction_count = post.get("reaction_count") or post.get("likes_count") or 0
            comment_count = post.get("comment_count") or post.get("comments_count") or 0

            # Se não estão presentes, calcular (mas apenas se realmente necessário)
            # Normalmente os triggers do banco já atualizam esses campos
            if reaction_count == 0 and post_id:
                reaction_count = self.count_post_likes(post_id)

            if comment_count == 0 and post_id:
                try:
                    comment_result = (
                        self.db.table("comments").select("id", count="exact").eq("post_id", post_id).execute()
                    )
                    comment_count = (
                        comment_result.count
                        if hasattr(comment_result, "count") and comment_result.count is not None
                        else (len(comment_result.data) if comment_result.data else 0)
                    )
                except (ValueError, KeyError, AttributeError) as e:
                    self.logger.debug(f"Erro ao processar contador (não crítico): {str(e)}")
                    pass
                except Exception as e:
                    self.logger.debug(f"Erro inesperado ao processar contador: {str(e)}")
                    pass

            # Verificar se usuário atual reagiu (apenas se necessário)
            user_reacted = False
            if current_user_id and post_id:
                # Se já temos informação de reação no post, usar
                if "user_reacted" in post:
                    user_reacted = post["user_reacted"]
                else:
                    # Verificar reação apenas se necessário
                    try:
                        reaction_result = (
                            self.db.table("reactions")
                            .select("id")
                            .eq("post_id", post_id)
                            .eq("user_id", current_user_id)
                            .limit(1)  # Apenas verificar existência
                            .execute()
                        )
                        user_reacted = reaction_result.data is not None and len(reaction_result.data) > 0
                    except (ValueError, KeyError, AttributeError) as e:
                        # Fallback: se não conseguir verificar reação, assume False
                        self.logger.debug(f"Erro ao verificar reação do usuário (não crítico): {str(e)}")
                        pass
                    except Exception as e:
                        self.logger.debug(f"Erro inesperado ao verificar reação: {str(e)}")
                        pass

            # Montar post enriquecido
            enriched = {
                **post,
                **user_data,
                "reaction_count": reaction_count,
                "comment_count": comment_count,
                "share_count": post.get("share_count", 0),
                "user_reacted": user_reacted,
            }

            # Remover objeto users se existir (já extraímos os dados)
            enriched.pop("users", None)

            return enriched
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            self.logger.error(f"Erro ao enriquecer post: {str(e)}", exc_info=True)
            return post

    def _enrich_comment_with_user_data(self, comment: Dict[str, Any]) -> Dict[str, Any]:
        """
        Enriquece comentário com dados do usuário.

        Args:
            comment: Dados do comentário

        Returns:
            Comentário enriquecido
        """
        try:
            user_data = {}
            if isinstance(comment.get("users"), dict):
                user = comment["users"]
                user_data = {
                    "user": {
                        "id": user.get("id"),
                        "name": user.get("name") or user.get("email", ""),
                        "avatar_url": user.get("avatar_url"),
                        "email": user.get("email"),
                    }
                }
            elif comment.get("user_id"):
                try:
                    user_result = (
                        self.db.table("users")
                        .select("id, name, email, avatar_url")
                        .eq("id", comment["user_id"])
                        .execute()
                    )
                    if user_result.data and len(user_result.data) > 0:
                        user = user_result.data[0]
                        user_data = {
                            "user": {
                                "id": user.get("id"),
                                "name": user.get("name") or user.get("email", ""),
                                "avatar_url": user.get("avatar_url"),
                                "email": user.get("email"),
                            }
                        }
                except (ValueError, KeyError, AttributeError) as e:
                    self.logger.debug(f"Erro ao processar contador (não crítico): {str(e)}")
                    pass
                except Exception as e:
                    self.logger.debug(f"Erro inesperado ao processar contador: {str(e)}")
                    pass

            enriched = {**comment, **user_data}
            enriched.pop("users", None)  # Remover objeto users se existir

            return enriched
        except Exception as e:
            self.logger.error(f"Erro ao enriquecer comentário: {str(e)}")
            return comment

    # =====================================================
    # MÉTODOS DE PERFIL PÚBLICO
    # =====================================================

    def get_user_profile(self, user_id: str, viewer_id: Optional[str] = None) -> Optional[Dict[str, Any]]:
        """
        Busca perfil público de um usuário.

        Args:
            user_id: ID do usuário cujo perfil será buscado
            viewer_id: ID do usuário que está visualizando (para verificar seguimento)

        Returns:
            Dict com dados do perfil ou None
        """
        try:
            # Buscar dados básicos do usuário
            user_result = (
                self.db.table("users")
                .select("id, name, email, avatar_url, bio, is_verified, created_at")
                .eq("id", user_id)
                .execute()
            )

            if not user_result.data or len(user_result.data) == 0:
                return None

            user = user_result.data[0]

            followers_count = self.count_followers(user_id)
            following_count = self.count_following(user_id)

            posts_count = 0
            try:
                posts_result = self.db.table("posts").select("id", count="exact").eq("user_id", user_id).execute()
                posts_count = (
                    posts_result.count
                    if hasattr(posts_result, "count") and posts_result.count is not None
                    else (len(posts_result.data) if posts_result.data else 0)
                )
            except (ValueError, KeyError, AttributeError) as e:
                # Fallback: se não conseguir contar posts, assume 0
                self.logger.debug(f"Erro ao contar posts do usuário (não crítico): {str(e)}")
                pass
            except Exception as e:
                self.logger.debug(f"Erro inesperado ao contar posts: {str(e)}")
                pass

            total_likes = self.count_total_likes_for_user(user_id)

            # Verificar se viewer está seguindo
            is_following = False
            is_follower = False
            if viewer_id and viewer_id != user_id:
                is_following = self.is_following(viewer_id, user_id)
                is_follower = self.is_following(user_id, viewer_id)

            # Buscar posts recentes (últimos 10)
            recent_posts = []
            try:
                posts_result = (
                    self.db.table("posts")
                    .select("*, users!posts_user_id_fkey(id, name, email, avatar_url)")
                    .eq("user_id", user_id)
                    .order("created_at", desc=True)
                    .limit(10)
                    .execute()
                )
                if posts_result.data:
                    recent_posts = [self._enrich_post_with_user_data(p, viewer_id) for p in posts_result.data]
            except (ValueError, KeyError) as e:
                logger.warning(f"Erro de validação: {str(e)}")
                # Tratamento específico pode ser adicionado aqui
            except Exception as e:
                self.logger.warning(f"Erro ao buscar posts recentes: {str(e)}")

            return {
                "id": user.get("id"),
                "name": user.get("name") or user.get("email", ""),
                "email": user.get("email"),
                "avatar_url": user.get("avatar_url"),
                "bio": user.get("bio"),
                "is_verified": user.get("is_verified", False),
                "created_at": user.get("created_at"),
                "stats": {
                    "followers": followers_count,
                    "following": following_count,
                    "posts": posts_count,
                    "total_likes": total_likes,
                },
                "relationship": {
                    "is_following": is_following,
                    "is_follower": is_follower,
                    "is_own_profile": viewer_id == user_id,
                },
                "recent_posts": recent_posts,
            }
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            self.logger.error(f"Erro ao buscar perfil do usuário {user_id}: {str(e)}", exc_info=True)
            return None

    def get_user_posts(
        self, user_id: str, viewer_id: Optional[str] = None, page: int = 1, limit: int = 20
    ) -> List[Dict[str, Any]]:
        """
        Busca posts de um usuário específico.

        Args:
            user_id: ID do usuário
            viewer_id: ID do usuário visualizando
            page: Número da página
            limit: Limite por página

        Returns:
            Lista de posts
        """
        try:
            offset = (page - 1) * limit
            result = (
                self.db.table("posts")
                .select("*, users!posts_user_id_fkey(id, name, email, avatar_url)")
                .eq("user_id", user_id)
                .order("created_at", desc=True)
                .range(offset, offset + limit - 1)
                .execute()
            )
            posts = result.data if result.data else []
            return [self._enrich_post_with_user_data(p, viewer_id) for p in posts]
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            self.logger.error(f"Erro ao buscar posts do usuário {user_id}: {str(e)}", exc_info=True)
            return []
