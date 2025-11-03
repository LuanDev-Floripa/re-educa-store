"""
Repositório de Usuários RE-EDUCA Store.

Gerencia acesso a dados de usuários.
"""
import logging
from typing import Dict, Any, List, Optional
from repositories.base_repository import BaseRepository

logger = logging.getLogger(__name__)


class UserRepository(BaseRepository):
    """
    Repositório para operações com usuários.
    
    Tabela: users
    """
    
    def __init__(self):
        """Inicializa o repositório de usuários."""
        super().__init__('users')
    
    def find_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        """
        Busca usuário por email.
        
        Args:
            email: Email do usuário
        
        Returns:
            Dados do usuário ou None
        """
        try:
            result = self.find_all(
                filters={'email': email},
                limit=1
            )
            return result[0] if result else None
        except Exception as e:
            self.logger.error(f"Erro ao buscar usuário por email {email}: {str(e)}")
            return None
    
    def find_by_id(self, id: str, use_cache: bool = True) -> Optional[Dict[str, Any]]:
        """
        Busca usuário por ID (sobrescreve método base para adicionar cache específico).
        
        Args:
            id: ID do usuário
            use_cache: Se deve usar cache (padrão: True, cache mais longo para usuários)
        
        Returns:
            Dados do usuário ou None
        """
        # Cache de usuários por mais tempo (10 minutos)
        return super().find_by_id(id, use_cache=use_cache, cache_ttl=600)
    
    def find_all_active(self, page: int = 1, per_page: int = 20) -> Dict[str, Any]:
        """
        Busca todos os usuários ativos com paginação.
        
        Args:
            page: Número da página
            per_page: Itens por página
        
        Returns:
            Dict com lista de usuários e informações de paginação
        """
        try:
            offset = (page - 1) * per_page
            users = self.find_all(
                filters={'is_active': True},
                order_by='created_at',
                desc=True,
                limit=per_page,
                offset=offset
            )
            
            total = self.count(filters={'is_active': True})
            
            return {
                'users': users,
                'pagination': {
                    'page': page,
                    'per_page': per_page,
                    'total': total,
                    'pages': (total + per_page - 1) // per_page
                }
            }
        except Exception as e:
            self.logger.error(f"Erro ao buscar usuários ativos: {str(e)}")
            return {
                'users': [],
                'pagination': {
                    'page': page,
                    'per_page': per_page,
                    'total': 0,
                    'pages': 0
                }
            }
    
    def update_profile(self, user_id: str, profile_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Atualiza perfil do usuário.
        
        Args:
            user_id: ID do usuário
            profile_data: Dados a serem atualizados
        
        Returns:
            Usuário atualizado ou None
        """
        try:
            return self.update(user_id, profile_data)
        except Exception as e:
            self.logger.error(f"Erro ao atualizar perfil do usuário {user_id}: {str(e)}")
            return None
    
    def get_user_activities(
        self,
        user_id: str,
        page: int = 1,
        per_page: int = 20,
        activity_type: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Busca atividades do usuário com paginação.
        
        Args:
            user_id: ID do usuário
            page: Número da página
            per_page: Itens por página
            activity_type: Tipo de atividade (opcional)
        
        Returns:
            Dict com atividades e paginação
        """
        try:
            filters = {'user_id': user_id}
            if activity_type:
                filters['activity_type'] = activity_type
            
            offset = (page - 1) * per_page
            activities = self.db.table('user_activities').select('*').eq('user_id', user_id)
            
            if activity_type:
                activities = activities.eq('activity_type', activity_type)
            
            result = activities.order('created_at', desc=True).range(offset, offset + per_page - 1).execute()
            
            activities_list = result.data if result.data else []
            total = len(activities_list)  # Simplificado - em produção usar count
            
            return {
                'activities': activities_list,
                'pagination': {
                    'page': page,
                    'per_page': per_page,
                    'total': total,
                    'pages': (total + per_page - 1) // per_page if total > 0 else 0
                }
            }
        except Exception as e:
            self.logger.error(f"Erro ao buscar atividades: {str(e)}")
            return {
                'activities': [],
                'pagination': {
                    'page': page,
                    'per_page': per_page,
                    'total': 0,
                    'pages': 0
                }
            }
    
    def search(self, query: str, page: int = 1, per_page: int = 20) -> Dict[str, Any]:
        """
        Busca usuários por nome ou email.
        
        Args:
            query: Termo de busca
            page: Número da página
            per_page: Itens por página
        
        Returns:
            Dict com lista de usuários e paginação
        """
        try:
            # Busca usando PostgREST ilike
            result = self.db.table(self.table_name).select('*').or_(
                f'name.ilike.%{query}%,email.ilike.%{query}%'
            ).eq('is_active', True).order('created_at', desc=True).range(
                (page - 1) * per_page,
                page * per_page - 1
            ).execute()
            
            users = result.data if result.data else []
            
            # Count total
            count_result = self.db.table(self.table_name).select('id', count='exact').or_(
                f'name.ilike.%{query}%,email.ilike.%{query}%'
            ).eq('is_active', True).execute()
            
            total = count_result.count if hasattr(count_result, 'count') else len(users)
            
            return {
                'users': users,
                'pagination': {
                    'page': page,
                    'per_page': per_page,
                    'total': total,
                    'pages': (total + per_page - 1) // per_page
                }
            }
        except Exception as e:
            self.logger.error(f"Erro ao buscar usuários: {str(e)}")
            return {
                'users': [],
                'pagination': {
                    'page': page,
                    'per_page': per_page,
                    'total': 0,
                    'pages': 0
                }
            }
