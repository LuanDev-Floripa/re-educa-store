"""
Repositório de Rede Social RE-EDUCA Store.

Gerencia acesso a dados de funcionalidades sociais.
"""
import logging
from typing import Dict, Any, List, Optional
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
        super().__init__('follows')  # Tabela padrão
    
    def count_followers(self, user_id: str) -> int:
        """
        Conta seguidores de um usuário.
        
        Args:
            user_id: ID do usuário
        
        Returns:
            Número de seguidores
        """
        try:
            result = (
                self.db.table('follows')
                .select('id', count='exact')
                .eq('following_id', user_id)
                .execute()
            )
            return (
                result.count
                if hasattr(result, 'count') and result.count is not None
                else (len(result.data) if result.data else 0)
            )
        except Exception as e:
            self.logger.error(f"Erro ao contar seguidores: {str(e)}")
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
            result = (
                self.db.table('follows')
                .select('id', count='exact')
                .eq('follower_id', user_id)
                .execute()
            )
            return (
                result.count
                if hasattr(result, 'count') and result.count is not None
                else (len(result.data) if result.data else 0)
            )
        except Exception as e:
            self.logger.error(f"Erro ao contar seguindo: {str(e)}")
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
            result = (
                self.db.table('posts')
                .select('id')
                .eq('user_id', user_id)
                .execute()
            )
            if result.data:
                return [p.get('id') for p in result.data if p.get('id')]
            return []
        except Exception as e:
            self.logger.error(f"Erro ao buscar posts do usuário: {str(e)}")
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
                self.db.table('reactions')
                .select('id', count='exact')
                .eq('post_id', post_id)
                .eq('reaction_type', 'like')
                .execute()
            )
            return (
                result.count
                if hasattr(result, 'count') and result.count is not None
                else (len(result.data) if result.data else 0)
            )
        except Exception as e:
            self.logger.error(f"Erro ao contar likes do post {post_id}: {str(e)}")
            return 0
    
    def count_total_likes_for_user(self, user_id: str) -> int:
        """
        Conta total de likes recebidos pelo usuário em todos os posts.
        
        Args:
            user_id: ID do usuário
        
        Returns:
            Total de likes recebidos
        """
        try:
            post_ids = self.get_user_post_ids(user_id)
            if not post_ids:
                return 0
            
            total_likes = 0
            for post_id in post_ids:
                total_likes += self.count_post_likes(post_id)
            
            return total_likes
        except Exception as e:
            self.logger.error(f"Erro ao contar total de likes: {str(e)}")
            return 0
