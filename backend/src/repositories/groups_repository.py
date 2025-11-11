"""
Repository para grupos e comunidades.
"""

import logging
from typing import Any, Dict, List, Optional

from repositories.base_repository import BaseRepository

logger = logging.getLogger(__name__)


class GroupsRepository(BaseRepository):
    """Repository para grupos"""

    def __init__(self):
        super().__init__("groups")

    def find_all(self, filters: Dict = None, page: int = 1, limit: int = 20) -> List[Dict[str, Any]]:
        """Lista grupos com filtros"""
        try:
            query = self.db.table("groups").select("*, creator:users!groups_creator_id_fkey(id, name, avatar_url)")

            if filters:
                if filters.get("privacy"):
                    query = query.eq("privacy", filters["privacy"])
                if filters.get("category"):
                    query = query.eq("category", filters["category"])
                if filters.get("search"):
                    query = query.ilike("name", f"%{filters['search']}%")

            query = query.eq("is_active", True).order("created_at", desc=True)

            offset = (page - 1) * limit
            result = query.range(offset, offset + limit - 1).execute()

            return result.data or []

        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            logger.error(f"Erro ao buscar grupos: {str(e)}", exc_info=True)
            return []

    def find_by_id(self, group_id: str) -> Optional[Dict[str, Any]]:
        """Busca grupo por ID"""
        try:
            result = (
                self.db.table("groups")
                .select("*, creator:users!groups_creator_id_fkey(id, name, avatar_url)")
                .eq("id", group_id)
                .execute()
            )
            return result.data[0] if result.data else None
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            logger.error(f"Erro ao buscar grupo: {str(e)}", exc_info=True)
            return None

    def create_group(self, group_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Cria novo grupo"""
        try:
            result = self.db.table("groups").insert(group_data).execute()
            return result.data[0] if result.data else None
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            logger.error(f"Erro ao criar grupo: {str(e)}", exc_info=True)
            return None

    def update_group(self, group_id: str, group_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Atualiza grupo"""
        try:
            result = self.db.table("groups").update(group_data).eq("id", group_id).execute()
            return result.data[0] if result.data else None
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            logger.error(f"Erro ao atualizar grupo: {str(e)}", exc_info=True)
            return None

    def get_user_groups(self, user_id: str) -> List[Dict[str, Any]]:
        """Busca grupos do usuário"""
        try:
            result = (
                self.db.table("group_members")
                .select(
                    "group:groups!group_members_group_id_fkey(*, creator:users!groups_creator_id_fkey(id, name, avatar_url))"
                )
                .eq("user_id", user_id)
                .execute()
            )

            groups = []
            for item in result.data or []:
                group = item.get("group")
                if group:
                    groups.append(group)

            return groups
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            logger.error(f"Erro ao buscar grupos do usuário: {str(e)}", exc_info=True)
            return []

    def join_group(self, group_id: str, user_id: str, role: str = "member") -> bool:
        """Adiciona usuário ao grupo"""
        try:
            # Verificar se já é membro
            existing = (
                self.db.table("group_members").select("id").eq("group_id", group_id).eq("user_id", user_id).execute()
            )
            if existing.data:
                logger.info(f"Usuário {user_id} já é membro do grupo {group_id}")
                return False

            result = (
                self.db.table("group_members")
                .insert({"group_id": group_id, "user_id": user_id, "role": role})
                .execute()
            )

            return len(result.data) > 0
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            logger.error(f"Erro ao participar do grupo: {str(e)}", exc_info=True)
            return False

    def leave_group(self, group_id: str, user_id: str) -> bool:
        """Remove usuário do grupo"""
        try:
            # Verificar se é criador (não pode sair)
            group = self.find_by_id(group_id)
            if group and group.get("creator_id") == user_id:
                logger.warning(f"Criador {user_id} não pode sair do grupo {group_id}")
                return False

            self.db.table("group_members").delete().eq("group_id", group_id).eq("user_id", user_id).execute()
            return True
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            logger.error(f"Erro ao sair do grupo: {str(e)}", exc_info=True)
            return False

    def is_member(self, group_id: str, user_id: str) -> bool:
        """Verifica se usuário é membro"""
        try:
            result = (
                self.db.table("group_members").select("id").eq("group_id", group_id).eq("user_id", user_id).execute()
            )
            return len(result.data) > 0
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            logger.error(f"Erro ao verificar membro: {str(e)}", exc_info=True)
            return False

    def get_members(self, group_id: str, limit: int = 50) -> List[Dict[str, Any]]:
        """Busca membros do grupo"""
        try:
            result = (
                self.db.table("group_members")
                .select("*, user:users!group_members_user_id_fkey(id, name, avatar_url)")
                .eq("group_id", group_id)
                .order("joined_at", desc=False)
                .limit(limit)
                .execute()
            )

            return result.data or []
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            logger.error(f"Erro ao buscar membros: {str(e)}", exc_info=True)
            return []

    def get_user_role(self, group_id: str, user_id: str) -> Optional[str]:
        """Retorna role do usuário no grupo"""
        try:
            result = (
                self.db.table("group_members").select("role").eq("group_id", group_id).eq("user_id", user_id).execute()
            )
            return result.data[0]["role"] if result.data else None
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            logger.error(f"Erro ao buscar role: {str(e)}", exc_info=True)
            return None

    def find_all_sorted_by_members(self, limit: int = 50) -> List[Dict[str, Any]]:
        """
        Busca grupos ordenados por número de membros.

        Args:
            limit: Limite de resultados

        Returns:
            Lista de grupos ordenados por member_count
        """
        try:
            result = (
                self.db.table("groups")
                .select("*")
                .eq("is_active", True)
                .order("member_count", desc=True)
                .limit(limit)
                .execute()
            )
            return result.data if result.data else []
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            logger.error(f"Erro ao buscar grupos ordenados: {str(e)}", exc_info=True)
            return []

    def is_user_member(self, group_id: str, user_id: str) -> bool:
        """
        Verifica se usuário é membro de um grupo.

        Args:
            group_id: ID do grupo
            user_id: ID do usuário

        Returns:
            True se é membro, False caso contrário
        """
        return self.is_member(group_id, user_id)

    def invite_user(self, group_id: str, user_id: str, invited_by: str) -> bool:
        """
        Convida usuário para o grupo (adiciona como membro).

        Args:
            group_id: ID do grupo
            user_id: ID do usuário a ser convidado
            invited_by: ID do usuário que está convidando

        Returns:
            True se convite foi criado, False caso contrário
        """
        try:
            # Verificar se já é membro
            if self.is_member(group_id, user_id):
                logger.info(f"Usuário {user_id} já é membro do grupo {group_id}")
                return False

            # Adicionar como membro
            result = (
                self.db.table("group_members")
                .insert({"group_id": group_id, "user_id": user_id, "role": "member"})
                .execute()
            )

            # Atualizar contador de membros
            try:
                # Buscar contagem atual
                count_result = (
                    self.db.table("group_members").select("id", count="exact").eq("group_id", group_id).execute()
                )
                members_count = (
                    count_result.count
                    if hasattr(count_result, "count")
                    else len(count_result.data) if count_result.data else 0
                )

                # Atualizar contador
                self.db.table("groups").update({"members_count": members_count}).eq("id", group_id).execute()
            except Exception as e:
                logger.warning(f"Erro ao atualizar contador de membros: {str(e)}")

            return len(result.data) > 0
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            return False
        except Exception as e:
            logger.error(f"Erro ao convidar usuário: {str(e)}", exc_info=True)
            return False
