"""
Repositório de Usuários RE-EDUCA Store.

Gerencia acesso a dados de usuários.
"""

import logging
from typing import Any, Dict, List, Optional

from repositories.base_repository import BaseRepository

logger = logging.getLogger(__name__)


class UserRepository(BaseRepository):
    """
    Repositório para operações com usuários.

    Tabela: users
    """

    def __init__(self):
        """Inicializa o repositório de usuários."""
        super().__init__("users")

    def find_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        """
        Busca usuário por email.

        Args:
            email: Email do usuário

        Returns:
            Dados do usuário ou None
        """
        try:
            result = self.find_all(filters={"email": email}, limit=1)
            return result[0] if result else None
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            self.logger.error(f"Erro ao buscar usuário por email {email}: {str(e)}", exc_info=True)
            return None

    def find_all_users(self) -> List[Dict[str, Any]]:
        """
        Busca todos os usuários (sem filtros).

        Returns:
            Lista de todos os usuários
        """
        try:
            return self.find_all(limit=None)
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            self.logger.error(f"Erro ao buscar todos os usuários: {str(e)}", exc_info=True)
            return []

    def find_by_date_range(self, start_date: str, end_date: str) -> List[Dict[str, Any]]:
        """
        Busca usuários criados em um intervalo de datas.

        Args:
            start_date: Data inicial (ISO format)
            end_date: Data final (ISO format)

        Returns:
            Lista de usuários criados no período
        """
        try:
            result = (
                self.db.table(self.table_name)
                .select("*")
                .gte("created_at", start_date)
                .lte("created_at", end_date)
                .order("created_at", desc=True)
                .execute()
            )
            return result.data if result.data else []
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            self.logger.error(f"Erro ao buscar usuários por período: {str(e)}", exc_info=True)
            return []

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
                filters={"is_active": True}, order_by="created_at", desc=True, limit=per_page, offset=offset
            )

            total = self.count(filters={"is_active": True})

            return {
                "users": users,
                "pagination": {
                    "page": page,
                    "per_page": per_page,
                    "total": total,
                    "pages": (total + per_page - 1) // per_page,
                },
            }
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            self.logger.error(f"Erro ao buscar usuários ativos: {str(e)}", exc_info=True)
            return {"users": [], "pagination": {"page": page, "per_page": per_page, "total": 0, "pages": 0}}

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
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            self.logger.error(f"Erro ao atualizar perfil do usuário {user_id}: {str(e)}", exc_info=True)
            return None

    def get_user_activities(
        self, user_id: str, page: int = 1, per_page: int = 20, activity_type: Optional[str] = None
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
            filters = {"user_id": user_id}
            if activity_type:
                filters["activity_type"] = activity_type

            offset = (page - 1) * per_page
            activities = self.db.table("user_activities").select("*").eq("user_id", user_id)

            if activity_type:
                activities = activities.eq("activity_type", activity_type)

            result = activities.order("created_at", desc=True).range(offset, offset + per_page - 1).execute()

            activities_list = result.data if result.data else []
            total = len(activities_list)  # Simplificado - em produção usar count

            return {
                "activities": activities_list,
                "pagination": {
                    "page": page,
                    "per_page": per_page,
                    "total": total,
                    "pages": (total + per_page - 1) // per_page if total > 0 else 0,
                },
            }
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            self.logger.error(f"Erro ao buscar atividades: {str(e)}", exc_info=True)
            return {"activities": [], "pagination": {"page": page, "per_page": per_page, "total": 0, "pages": 0}}

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
            result = (
                self.db.table(self.table_name)
                .select("*")
                .or_(f"name.ilike.%{query}%,email.ilike.%{query}%")
                .eq("is_active", True)
                .order("created_at", desc=True)
                .range((page - 1) * per_page, page * per_page - 1)
                .execute()
            )

            users = result.data if result.data else []

            # Count total
            count_result = (
                self.db.table(self.table_name)
                .select("id", count="exact")
                .or_(f"name.ilike.%{query}%,email.ilike.%{query}%")
                .eq("is_active", True)
                .execute()
            )

            total = count_result.count if hasattr(count_result, "count") else len(users)

            return {
                "users": users,
                "pagination": {
                    "page": page,
                    "per_page": per_page,
                    "total": total,
                    "pages": (total + per_page - 1) // per_page,
                },
            }
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            self.logger.error(f"Erro ao buscar usuários: {str(e)}", exc_info=True)
            return {"users": [], "pagination": {"page": page, "per_page": per_page, "total": 0, "pages": 0}}

    def get_user_preferences(self, user_id: str) -> Optional[Dict[str, Any]]:
        """
        Busca preferências do usuário.

        Args:
            user_id: ID do usuário

        Returns:
            Preferências do usuário ou None
        """
        try:
            result = self.db.table("user_preferences").select("*").eq("user_id", user_id).execute()
            if result.data:
                return result.data[0]
            # Se não existir, retorna None (será criado no primeiro save)
            return None
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            self.logger.error(f"Erro ao buscar preferências do usuário {user_id}: {str(e)}", exc_info=True)
            return None

    def upsert_user_preferences(self, user_id: str, preferences: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Cria ou atualiza preferências do usuário.

        Args:
            user_id: ID do usuário
            preferences: Dados das preferências

        Returns:
            Preferências atualizadas ou None
        """
        try:
            # Remove campos que não devem ser atualizados
            restricted_fields = ["id", "created_at"]
            update_data = {k: v for k, v in preferences.items() if k not in restricted_fields}

            # Adiciona user_id e updated_at
            update_data["user_id"] = user_id
            update_data["updated_at"] = "now()"

            # Upsert (INSERT ... ON CONFLICT UPDATE)
            result = self.db.table("user_preferences").upsert(update_data, on_conflict="user_id").execute()

            if result.data:
                return result.data[0]
            return None
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            self.logger.error(f"Erro ao salvar preferências do usuário {user_id}: {str(e)}", exc_info=True)
            return None
