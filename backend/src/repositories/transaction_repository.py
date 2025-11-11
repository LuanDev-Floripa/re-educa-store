# -*- coding: utf-8 -*-
"""
Repositório de Transações RE-EDUCA Store.

Gerencia acesso a dados de transações de monetização.
"""
import logging
from typing import Any, Dict, List, Optional

from repositories.base_repository import BaseRepository

logger = logging.getLogger(__name__)


class TransactionRepository(BaseRepository):
    """
    Repositório para operações com transações.

    Tabela: transactions
    """

    def __init__(self):
        """Inicializa o repositório de transações."""
        super().__init__("transactions")

    def find_by_user_id(self, user_id: str, limit: int = 50) -> List[Dict[str, Any]]:
        """
        Busca transações por ID do usuário.

        Args:
            user_id: ID do usuário
            limit: Limite de resultados (padrão: 50)

        Returns:
            Lista de transações do usuário
        """
        try:
            result = (
                self.db.table(self.table_name)
                .select("*")
                .eq("user_id", user_id)
                .order("created_at", desc=True)
                .limit(limit)
                .execute()
            )
            return result.data if result.data else []
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            self.logger.error(f"Erro ao buscar transações por usuário: {str(e)}", exc_info=True)
            return []

    def find_by_type(self, user_id: str, transaction_type: str, limit: Optional[int] = None) -> List[Dict[str, Any]]:
        """
        Busca transações por tipo e usuário.

        Args:
            user_id: ID do usuário
            transaction_type: Tipo da transação ('tip_received', 'tip_sent', 'subscription_payment', etc.)
            limit: Limite de resultados (opcional)

        Returns:
            Lista de transações do tipo especificado
        """
        try:
            query = (
                self.db.table(self.table_name)
                .select("*")
                .eq("user_id", user_id)
                .eq("type", transaction_type)
                .order("created_at", desc=True)
            )

            if limit:
                query = query.limit(limit)

            result = query.execute()
            return result.data if result.data else []
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            self.logger.error(f"Erro ao buscar transações por tipo: {str(e)}", exc_info=True)
            return []

    def find_by_status(self, status: str, limit: Optional[int] = None) -> List[Dict[str, Any]]:
        """
        Busca transações por status.

        Args:
            status: Status da transação ('pending', 'completed', 'failed', 'cancelled')
            limit: Limite de resultados (opcional)

        Returns:
            Lista de transações com o status especificado
        """
        try:
            query = self.db.table(self.table_name).select("*").eq("status", status).order("created_at", desc=True)

            if limit:
                query = query.limit(limit)

            result = query.execute()
            return result.data if result.data else []
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            self.logger.error(f"Erro ao buscar transações por status: {str(e)}", exc_info=True)
            return []

    def create(self, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Cria uma nova transação.

        Args:
            data: Dados da transação

        Returns:
            Transação criada ou None em caso de erro
        """
        try:
            result = self.db.table(self.table_name).insert(data).execute()

            if result.data and len(result.data) > 0:
                transaction = result.data[0]
                self._invalidate_cache()
                return transaction
            return None
        except Exception as e:
            self.logger.error(f"Erro ao criar transação: {str(e)}")
            return None

    def update_status(
        self, transaction_id: str, status: str, completed_at: Optional[str] = None
    ) -> Optional[Dict[str, Any]]:
        """
        Atualiza o status de uma transação.

        Args:
            transaction_id: ID da transação
            status: Novo status ('pending', 'completed', 'failed', 'cancelled')
            completed_at: Data de conclusão (opcional, usado quando status='completed')

        Returns:
            Transação atualizada ou None em caso de erro
        """
        try:
            from datetime import datetime

            update_data = {"status": status}

            if status == "completed" and completed_at:
                update_data["completed_at"] = completed_at
            elif status == "completed" and not completed_at:
                update_data["completed_at"] = datetime.utcnow().isoformat()

            result = self.db.table(self.table_name).update(update_data).eq("id", transaction_id).execute()

            if result.data and len(result.data) > 0:
                transaction = result.data[0]
                self._invalidate_cache(transaction_id)
                return transaction
            return None
        except Exception as e:
            self.logger.error(f"Erro ao atualizar status da transação: {str(e)}")
            return None

    def find_by_related_user(self, related_user_id: str, limit: Optional[int] = None) -> List[Dict[str, Any]]:
        """
        Busca transações relacionadas a um usuário (ex: tips enviados/recebidos).

        Args:
            related_user_id: ID do usuário relacionado
            limit: Limite de resultados (opcional)

        Returns:
            Lista de transações relacionadas
        """
        try:
            query = (
                self.db.table(self.table_name)
                .select("*")
                .eq("related_user_id", related_user_id)
                .order("created_at", desc=True)
            )

            if limit:
                query = query.limit(limit)

            result = query.execute()
            return result.data if result.data else []
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            self.logger.error(f"Erro ao buscar transações relacionadas: {str(e)}", exc_info=True)
            return []

    def find_by_related_post(self, related_post_id: str, limit: Optional[int] = None) -> List[Dict[str, Any]]:
        """
        Busca transações relacionadas a um post (ex: tips em posts).

        Args:
            related_post_id: ID do post relacionado
            limit: Limite de resultados (opcional)

        Returns:
            Lista de transações relacionadas ao post
        """
        try:
            query = (
                self.db.table(self.table_name)
                .select("*")
                .eq("related_post_id", related_post_id)
                .order("created_at", desc=True)
            )

            if limit:
                query = query.limit(limit)

            result = query.execute()
            return result.data if result.data else []
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            self.logger.error(f"Erro ao buscar transações do post: {str(e)}", exc_info=True)
            return []
