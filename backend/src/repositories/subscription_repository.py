# -*- coding: utf-8 -*-
"""
Repositório de Assinaturas RE-EDUCA Store.

Gerencia acesso a dados de assinaturas.
"""
import logging
from typing import Any, Dict, List, Optional

from repositories.base_repository import BaseRepository

logger = logging.getLogger(__name__)


class SubscriptionRepository(BaseRepository):
    """
    Repositório para operações com assinaturas.

    Tabela: subscriptions
    """

    def __init__(self):
        """Inicializa o repositório de assinaturas."""
        super().__init__("subscriptions")

    def find_by_subscriber_id(self, subscriber_id: str, limit: Optional[int] = None) -> List[Dict[str, Any]]:
        """
        Busca assinaturas por ID do assinante.

        Args:
            subscriber_id: ID do usuário assinante
            limit: Limite de resultados (opcional)

        Returns:
            Lista de assinaturas onde o usuário é assinante
        """
        try:
            query = (
                self.db.table(self.table_name)
                .select("*")
                .eq("subscriber_id", subscriber_id)
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
            self.logger.error(f"Erro ao buscar assinaturas por assinante: {str(e)}", exc_info=True)
            return []

    def find_by_creator_id(self, creator_id: str, limit: Optional[int] = None) -> List[Dict[str, Any]]:
        """
        Busca assinaturas por ID do criador.

        Args:
            creator_id: ID do usuário criador/conteudista
            limit: Limite de resultados (opcional)

        Returns:
            Lista de assinaturas onde o usuário é criador
        """
        try:
            query = (
                self.db.table(self.table_name).select("*").eq("creator_id", creator_id).order("created_at", desc=True)
            )

            if limit:
                query = query.limit(limit)

            result = query.execute()
            return result.data if result.data else []
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            self.logger.error(f"Erro ao buscar assinaturas por criador: {str(e)}", exc_info=True)
            return []

    def find_active_by_user(self, user_id: str) -> List[Dict[str, Any]]:
        """
        Busca assinaturas ativas de um usuário (tanto como assinante quanto como criador).

        Args:
            user_id: ID do usuário

        Returns:
            Lista de assinaturas ativas do usuário
        """
        try:
            # Buscar onde usuário é assinante
            subscriber_result = (
                self.db.table(self.table_name)
                .select("*")
                .eq("subscriber_id", user_id)
                .eq("status", "active")
                .order("created_at", desc=True)
                .execute()
            )

            # Buscar onde usuário é criador
            creator_result = (
                self.db.table(self.table_name)
                .select("*")
                .eq("creator_id", user_id)
                .eq("status", "active")
                .order("created_at", desc=True)
                .execute()
            )

            subscriptions = []
            if subscriber_result.data:
                subscriptions.extend(subscriber_result.data)
            if creator_result.data:
                subscriptions.extend(creator_result.data)

            # Remover duplicatas se houver (não deveria, mas por segurança)
            seen_ids = set()
            unique_subscriptions = []
            for sub in subscriptions:
                sub_id = sub.get("id")
                if sub_id and sub_id not in seen_ids:
                    seen_ids.add(sub_id)
                    unique_subscriptions.append(sub)

            return unique_subscriptions
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            self.logger.error(f"Erro ao buscar assinaturas ativas: {str(e)}", exc_info=True)
            return []

    def create(self, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Cria uma nova assinatura.

        Args:
            data: Dados da assinatura

        Returns:
            Assinatura criada ou None em caso de erro
        """
        try:
            result = self.db.table(self.table_name).insert(data).execute()

            if result.data and len(result.data) > 0:
                subscription = result.data[0]
                self._invalidate_cache()
                return subscription
            return None
        except Exception as e:
            self.logger.error(f"Erro ao criar assinatura: {str(e)}")
            return None

    def update_status(
        self, subscription_id: str, status: str, cancelled_at: Optional[str] = None
    ) -> Optional[Dict[str, Any]]:
        """
        Atualiza o status de uma assinatura.

        Args:
            subscription_id: ID da assinatura
            status: Novo status ('active', 'cancelled', 'expired', 'pending')
            cancelled_at: Data de cancelamento (opcional, usado quando status='cancelled')

        Returns:
            Assinatura atualizada ou None em caso de erro
        """
        try:
            from datetime import datetime

            update_data = {"status": status, "updated_at": datetime.utcnow().isoformat()}

            if status == "cancelled" and cancelled_at:
                update_data["cancelled_at"] = cancelled_at
            elif status == "cancelled" and not cancelled_at:
                update_data["cancelled_at"] = datetime.utcnow().isoformat()

            result = self.db.table(self.table_name).update(update_data).eq("id", subscription_id).execute()

            if result.data and len(result.data) > 0:
                subscription = result.data[0]
                self._invalidate_cache(subscription_id)
                return subscription
            return None
        except Exception as e:
            self.logger.error(f"Erro ao atualizar status da assinatura: {str(e)}")
            return None

    def cancel(self, subscription_id: str) -> Optional[Dict[str, Any]]:
        """
        Cancela uma assinatura.

        Args:
            subscription_id: ID da assinatura

        Returns:
            Assinatura cancelada ou None em caso de erro
        """
        try:
            from datetime import datetime

            return self.update_status(subscription_id, "cancelled", cancelled_at=datetime.utcnow().isoformat())
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            self.logger.error(f"Erro ao cancelar assinatura: {str(e)}", exc_info=True)
            return None

    def find_by_subscriber_and_creator(self, subscriber_id: str, creator_id: str) -> Optional[Dict[str, Any]]:
        """
        Busca assinatura específica entre um assinante e um criador.

        Args:
            subscriber_id: ID do assinante
            creator_id: ID do criador

        Returns:
            Assinatura encontrada ou None
        """
        try:
            result = (
                self.db.table(self.table_name)
                .select("*")
                .eq("subscriber_id", subscriber_id)
                .eq("creator_id", creator_id)
                .limit(1)
                .execute()
            )
            return result.data[0] if result.data and len(result.data) > 0 else None
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            self.logger.error(f"Erro ao buscar assinatura específica: {str(e)}", exc_info=True)
            return None
