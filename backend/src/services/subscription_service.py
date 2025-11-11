"""
Service de Assinaturas RE-EDUCA Store.

Gerencia operações relacionadas a assinaturas.
"""

import logging
import os
from datetime import datetime
from typing import Any, Dict, List, Optional

from repositories.subscription_repository import SubscriptionRepository
from services.base_service import BaseService

logger = logging.getLogger(__name__)


class SubscriptionService(BaseService):
    """
    Service para operações de assinaturas.

    Usa SubscriptionRepository para acesso a dados.
    """

    def __init__(self):
        super().__init__()
        self.repo = SubscriptionRepository()

    def get_user_subscriptions(self, user_id: str) -> List[Dict[str, Any]]:
        """
        Retorna assinaturas do usuário.

        Args:
            user_id: ID do usuário

        Returns:
            Lista de assinaturas
        """
        try:
            return self.repo.find_by_user(user_id)
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            self.logger.error(f"Erro ao buscar assinaturas: {str(e)}", exc_info=True)
            return []

    def get_subscription(self, subscription_id: str, user_id: str) -> Optional[Dict[str, Any]]:
        """
        Retorna detalhes de uma assinatura.

        Valida que a assinatura pertence ao usuário.

        Args:
            subscription_id: ID da assinatura
            user_id: ID do usuário

        Returns:
            Dict com dados da assinatura ou None
        """
        try:
            subscription = self.repo.find_by_id(subscription_id)
            if subscription and subscription.get("user_id") == user_id:
                return subscription
            return None
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            self.logger.error(f"Erro ao buscar assinatura: {str(e)}", exc_info=True)
            return None

    def update_subscription_by_stripe_id(
        self, stripe_subscription_id: str, update_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Atualiza assinatura por ID do Stripe.

        Usado principalmente em webhooks do Stripe.

        Args:
            stripe_subscription_id: ID da assinatura no Stripe
            update_data: Dados para atualizar

        Returns:
            Dict com success e subscription ou error
        """
        try:
            updated = self.repo.update_by_stripe_subscription_id(stripe_subscription_id, update_data)

            if updated:
                return {"success": True, "subscription": updated}
            else:
                return {"success": False, "error": "Assinatura não encontrada"}
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            self.logger.error(f"Erro ao atualizar assinatura por Stripe ID: {str(e)}", exc_info=True)
            return {"success": False, "error": "Erro interno do servidor"}

    def update_subscription_status(
        self, stripe_subscription_id: str, status: str, additional_data: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Atualiza status da assinatura por Stripe ID.

        Usado em webhooks do Stripe.

        Args:
            stripe_subscription_id: ID da assinatura no Stripe
            status: Novo status ('active', 'cancelled', etc.)
            additional_data: Dados adicionais para atualizar (opcional)

        Returns:
            Dict com success e subscription ou error
        """
        try:
            update_data = {"status": status, "updated_at": datetime.utcnow().isoformat()}

            if additional_data:
                update_data.update(additional_data)

            return self.update_subscription_by_stripe_id(stripe_subscription_id, update_data)
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            self.logger.error(f"Erro ao atualizar status da assinatura: {str(e)}", exc_info=True)
            return {"success": False, "error": "Erro interno do servidor"}

    def cancel_subscription(
        self, subscription_id: str, user_id: str, stripe_subscription_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Cancela uma assinatura.

        Args:
            subscription_id: ID da assinatura
            user_id: ID do usuário
            stripe_subscription_id: ID no Stripe (opcional, para cancelar no gateway)

        Returns:
            Dict com success ou error
        """
        try:
            # Cancela no Stripe se necessário
            if stripe_subscription_id:
                try:
                    import stripe

                    stripe.api_key = os.environ.get("STRIPE_SECRET_KEY")
                    stripe.Subscription.modify(stripe_subscription_id, cancel_at_period_end=True)
                except (ValueError, KeyError) as e:
                    logger.warning(f"Erro de validação: {str(e)}")
                    # Tratamento específico pode ser adicionado aqui
                except Exception as e:
                    self.logger.warning(f"Erro ao cancelar no Stripe: {str(e)}")

            # Cancela no banco via repositório
            updated = self.repo.cancel(subscription_id, user_id)

            if updated:
                return {"success": True, "message": "Assinatura cancelada com sucesso", "subscription": updated}
            else:
                return {"success": False, "error": "Assinatura não encontrada ou não pertence ao usuário"}
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            self.logger.error(f"Erro ao cancelar assinatura: {str(e)}", exc_info=True)
            return {"success": False, "error": "Erro interno do servidor"}
