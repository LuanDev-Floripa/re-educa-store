"""
Service para grupos e comunidades.
"""

import logging
from typing import Any, Dict

from repositories.groups_repository import GroupsRepository

logger = logging.getLogger(__name__)


class GroupsService:
    """Service para grupos"""

    def __init__(self):
        self.repo = GroupsRepository()

    def get_groups(self, filters: Dict = None, page: int = 1, limit: int = 20) -> Dict[str, Any]:
        """Lista grupos"""
        try:
            groups = self.repo.find_all(filters, page, limit)
            return {"success": True, "groups": groups, "page": page, "limit": limit}
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            logger.error(f"Erro ao buscar grupos: {str(e)}", exc_info=True)
            return {"success": False, "error": str(e)}

    def get_group(self, group_id: str) -> Dict[str, Any]:
        """Busca grupo por ID"""
        try:
            group = self.repo.find_by_id(group_id)
            if group:
                return {"success": True, "group": group}
            return {"success": False, "error": "Grupo não encontrado"}
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            logger.error(f"Erro ao buscar grupo: {str(e)}", exc_info=True)
            return {"success": False, "error": str(e)}

    def create_group(self, user_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """Cria grupo"""
        try:
            if not data.get("name"):
                return {"success": False, "error": "Nome do grupo é obrigatório"}

            group_data = {
                "name": data.get("name"),
                "description": data.get("description"),
                "creator_id": user_id,
                "privacy": data.get("privacy", "public"),
                "category": data.get("category"),
                "rules": data.get("rules"),
                "tags": data.get("tags", []),
            }

            group = self.repo.create_group(group_data)

            if group:
                # Adicionar criador como admin
                self.repo.join_group(group["id"], user_id, "admin")
                return {"success": True, "group": group}
            return {"success": False, "error": "Erro ao criar grupo"}
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            logger.error(f"Erro ao criar grupo: {str(e)}", exc_info=True)
            return {"success": False, "error": str(e)}

    def update_group(self, group_id: str, user_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """Atualiza grupo (apenas criador ou admin)"""
        try:
            # Verificar permissão
            group = self.repo.find_by_id(group_id)
            if not group:
                return {"success": False, "error": "Grupo não encontrado"}

            # Verificar se é criador ou admin
            if group.get("creator_id") != user_id:
                role = self.repo.get_user_role(group_id, user_id)
                if role not in ["admin", "moderator"]:
                    return {"success": False, "error": "Sem permissão para atualizar grupo"}

            # Atualizar
            update_data = {}
            if "name" in data:
                update_data["name"] = data["name"]
            if "description" in data:
                update_data["description"] = data["description"]
            if "privacy" in data:
                update_data["privacy"] = data["privacy"]
            if "category" in data:
                update_data["category"] = data["category"]
            if "rules" in data:
                update_data["rules"] = data["rules"]
            if "tags" in data:
                update_data["tags"] = data["tags"]

            updated_group = self.repo.update_group(group_id, update_data)

            if updated_group:
                return {"success": True, "group": updated_group}
            return {"success": False, "error": "Erro ao atualizar grupo"}
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            logger.error(f"Erro ao atualizar grupo: {str(e)}", exc_info=True)
            return {"success": False, "error": str(e)}

    def join_group(self, group_id: str, user_id: str) -> Dict[str, Any]:
        """Participa do grupo"""
        try:
            # Verificar se grupo existe e é público
            group = self.repo.find_by_id(group_id)
            if not group:
                return {"success": False, "error": "Grupo não encontrado"}

            if group.get("privacy") != "public":
                return {"success": False, "error": "Grupo não é público"}

            if not group.get("is_active"):
                return {"success": False, "error": "Grupo não está ativo"}

            success = self.repo.join_group(group_id, user_id)
            if success:
                return {"success": True, "message": "Você entrou no grupo"}
            return {"success": False, "error": "Erro ao participar do grupo ou já é membro"}
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            logger.error(f"Erro ao participar: {str(e)}", exc_info=True)
            return {"success": False, "error": str(e)}

    def leave_group(self, group_id: str, user_id: str) -> Dict[str, Any]:
        """Sai do grupo"""
        try:
            success = self.repo.leave_group(group_id, user_id)
            if success:
                return {"success": True, "message": "Você saiu do grupo"}
            return {"success": False, "error": "Erro ao sair do grupo ou você é o criador"}
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            logger.error(f"Erro ao sair: {str(e)}", exc_info=True)
            return {"success": False, "error": str(e)}

    def get_user_groups(self, user_id: str) -> Dict[str, Any]:
        """Busca grupos do usuário"""
        try:
            groups = self.repo.get_user_groups(user_id)
            return {"success": True, "groups": groups}
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            logger.error(f"Erro ao buscar grupos do usuário: {str(e)}", exc_info=True)
            return {"success": False, "error": str(e)}

    def get_groups_sorted_by_members(self, limit: int = 50) -> Dict[str, Any]:
        """
        Busca grupos ordenados por número de membros.

        Args:
            limit: Limite de resultados

        Returns:
            Dict com lista de grupos
        """
        try:
            groups = self.repo.find_all_sorted_by_members(limit=limit)
            return {"success": True, "groups": groups}
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            logger.error(f"Erro ao buscar grupos ordenados: {str(e)}", exc_info=True)
            return {"success": False, "error": str(e), "groups": []}

    def is_user_member(self, group_id: str, user_id: str) -> bool:
        """
        Verifica se usuário é membro de um grupo.

        Args:
            group_id: ID do grupo
            user_id: ID do usuário

        Returns:
            True se é membro
        """
        try:
            return self.repo.is_user_member(group_id, user_id)
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            logger.error(f"Erro ao verificar membro: {str(e)}", exc_info=True)
            return False

    def get_members(self, group_id: str, limit: int = 50) -> Dict[str, Any]:
        """Busca membros do grupo"""
        try:
            members = self.repo.get_members(group_id, limit)
            return {"success": True, "members": members}
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            logger.error(f"Erro ao buscar membros: {str(e)}", exc_info=True)
            return {"success": False, "error": str(e)}

    def is_member(self, group_id: str, user_id: str) -> Dict[str, Any]:
        """Verifica se usuário é membro"""
        try:
            is_member = self.repo.is_member(group_id, user_id)
            role = self.repo.get_user_role(group_id, user_id) if is_member else None
            return {"success": True, "is_member": is_member, "role": role}
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            logger.error(f"Erro ao verificar membro: {str(e)}", exc_info=True)
            return {"success": False, "error": str(e)}

    def invite_user(self, group_id: str, user_id: str, invited_by: str) -> Dict[str, Any]:
        """
        Convida usuário para o grupo.

        Args:
            group_id: ID do grupo
            user_id: ID do usuário a ser convidado
            invited_by: ID do usuário que está convidando (admin/moderator)

        Returns:
            Dict com resultado da operação
        """
        try:
            # Verificar se grupo existe
            group = self.repo.find_by_id(group_id)
            if not group:
                return {"success": False, "error": "Grupo não encontrado"}

            # Verificar se quem convida tem permissão (admin ou moderator)
            inviter_role = self.repo.get_user_role(group_id, invited_by)
            if inviter_role not in ["admin", "moderator"] and group.get("creator_id") != invited_by:
                return {"success": False, "error": "Sem permissão para convidar usuários"}

            # Convidar usuário
            success = self.repo.invite_user(group_id, user_id, invited_by)
            if success:
                return {"success": True, "message": "Usuário convidado com sucesso"}
            return {"success": False, "error": "Erro ao convidar usuário ou usuário já é membro"}
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            return {"success": False, "error": str(e)}
        except Exception as e:
            logger.error(f"Erro ao convidar usuário: {str(e)}", exc_info=True)
            return {"success": False, "error": str(e)}
