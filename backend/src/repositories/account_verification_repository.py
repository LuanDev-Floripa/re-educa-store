# -*- coding: utf-8 -*-
"""
Repositório de Verificações de Conta RE-EDUCA Store.

Gerencia acesso a dados de verificações de conta (account verifications).
"""
import logging
from typing import Any, Dict, List, Optional

from repositories.base_repository import BaseRepository

logger = logging.getLogger(__name__)


class AccountVerificationRepository(BaseRepository):
    """
    Repositório para operações com verificações de conta.

    Tabela: account_verifications
    """

    def __init__(self):
        """Inicializa o repositório de verificações de conta."""
        super().__init__("account_verifications")

    def find_by_user_id(self, user_id: str) -> List[Dict[str, Any]]:
        """
        Busca verificações por ID do usuário.

        Args:
            user_id: ID do usuário

        Returns:
            Lista de verificações do usuário
        """
        try:
            result = (
                self.db.table(self.table_name)
                .select("*")
                .eq("user_id", user_id)
                .order("submitted_at", desc=True)
                .execute()
            )
            return result.data if result.data else []
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            self.logger.error(f"Erro ao buscar verificações por usuário: {str(e)}", exc_info=True)
            return []

    def find_pending(self, limit: Optional[int] = None) -> List[Dict[str, Any]]:
        """
        Busca verificações pendentes.

        Args:
            limit: Limite de resultados (opcional)

        Returns:
            Lista de verificações pendentes
        """
        try:
            query = self.db.table(self.table_name).select("*").eq("status", "pending").order("submitted_at", desc=True)

            if limit:
                query = query.limit(limit)

            result = query.execute()
            return result.data if result.data else []
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            self.logger.error(f"Erro ao buscar verificações pendentes: {str(e)}", exc_info=True)
            return []

    def find_by_status(self, status: str, limit: Optional[int] = None) -> List[Dict[str, Any]]:
        """
        Busca verificações por status.

        Args:
            status: Status da verificação ('pending', 'approved', 'rejected', 'expired')
            limit: Limite de resultados (opcional)

        Returns:
            Lista de verificações com o status especificado
        """
        try:
            query = self.db.table(self.table_name).select("*").eq("status", status).order("submitted_at", desc=True)

            if limit:
                query = query.limit(limit)

            result = query.execute()
            return result.data if result.data else []
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            self.logger.error(f"Erro ao buscar verificações por status: {str(e)}", exc_info=True)
            return []

    def create(self, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Cria uma nova verificação de conta.

        Args:
            data: Dados da verificação

        Returns:
            Verificação criada ou None em caso de erro
        """
        try:
            result = self.db.table(self.table_name).insert(data).execute()

            if result.data and len(result.data) > 0:
                verification = result.data[0]
                self._invalidate_cache()
                return verification
            return None
        except Exception as e:
            self.logger.error(f"Erro ao criar verificação: {str(e)}")
            return None

    def update_status(
        self,
        verification_id: str,
        status: str,
        reviewed_by: Optional[str] = None,
        rejection_reason: Optional[str] = None,
    ) -> Optional[Dict[str, Any]]:
        """
        Atualiza o status de uma verificação.

        Args:
            verification_id: ID da verificação
            status: Novo status ('pending', 'approved', 'rejected', 'expired')
            reviewed_by: ID do usuário que revisou (opcional)
            rejection_reason: Motivo da rejeição (opcional)

        Returns:
            Verificação atualizada ou None em caso de erro
        """
        try:
            from datetime import datetime

            update_data = {"status": status, "updated_at": datetime.utcnow().isoformat()}

            if reviewed_by:
                update_data["reviewed_by"] = reviewed_by
                update_data["reviewed_at"] = datetime.utcnow().isoformat()

            if rejection_reason:
                update_data["rejection_reason"] = rejection_reason

            result = self.db.table(self.table_name).update(update_data).eq("id", verification_id).execute()

            if result.data and len(result.data) > 0:
                verification = result.data[0]
                self._invalidate_cache(verification_id)
                return verification
            return None
        except Exception as e:
            self.logger.error(f"Erro ao atualizar status da verificação: {str(e)}")
            return None

    def find_by_category(self, category: str, limit: Optional[int] = None) -> List[Dict[str, Any]]:
        """
        Busca verificações por categoria.

        Args:
            category: Categoria ('fitness', 'nutrition', 'wellness', 'coach', 'influencer', 'professional')
            limit: Limite de resultados (opcional)

        Returns:
            Lista de verificações da categoria especificada
        """
        try:
            query = self.db.table(self.table_name).select("*").eq("category", category).order("submitted_at", desc=True)

            if limit:
                query = query.limit(limit)

            result = query.execute()
            return result.data if result.data else []
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            self.logger.error(f"Erro ao buscar verificações por categoria: {str(e)}", exc_info=True)
            return []
