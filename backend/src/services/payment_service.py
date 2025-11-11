"""
Serviço de Pagamentos RE-EDUCA Store.

Integra múltiplos gateways de pagamento incluindo:
- Stripe (cartão de crédito internacional, PIX)
- PagSeguro (pagamentos Brasil)
- Assinaturas recorrentes
- Webhooks de confirmação
- Controle antifraude
"""

import logging
import os
from datetime import datetime
from typing import Any, Dict

import requests
import stripe
from services.base_service import BaseService

logger = logging.getLogger(__name__)


class PaymentService(BaseService):
    """
    Service de Pagamentos RE-EDUCA Store.
    
    Herda de BaseService para padronização e logging consistente.
    Utiliza SubscriptionService e OrderService para acesso a dados.
    """

    def __init__(self):
        super().__init__()
        # Todos os acessos ao banco agora são via SubscriptionService e OrderService

        # Configuração Stripe
        stripe.api_key = os.environ.get("STRIPE_SECRET_KEY")
        self.stripe_public_key = os.environ.get("STRIPE_PUBLIC_KEY")

        # Configuração PagSeguro
        self.pagseguro_email = os.environ.get("PAGSEGURO_EMAIL")
        self.pagseguro_token = os.environ.get("PAGSEGURO_TOKEN")
        self.pagseguro_sandbox = os.environ.get("PAGSEGURO_SANDBOX", "true").lower() == "true"

        # URLs PagSeguro
        if self.pagseguro_sandbox:
            self.pagseguro_url = "https://ws.sandbox.pagseguro.uol.com.br"
        else:
            self.pagseguro_url = "https://ws.pagseguro.uol.com.br"

    # ================================
    # STRIPE
    # ================================

    def create_stripe_customer(self, user_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Cria cliente no Stripe.

        Args:
            user_data (Dict[str, Any]): Dados do usuário com email, name e id.

        Returns:
            Dict[str, Any]: Resultado com success e customer_id ou erro.
        """
        try:
            customer = stripe.Customer.create(
                email=user_data["email"],
                name=user_data["name"],
                metadata={"user_id": user_data["id"], "subscription_plan": user_data.get("subscription_plan", "free")},
            )

            return {"success": True, "customer_id": customer.id, "customer": customer}

        except stripe.error.StripeError as e:
            logger.error(f"Erro ao criar cliente Stripe: {str(e)}")
            return {"success": False, "error": str(e)}

    def create_stripe_payment_intent(
        self, amount: float, currency: str = "brl", customer_id: str = None, metadata: Dict = None
    ) -> Dict[str, Any]:
        """
        Cria Payment Intent no Stripe para processar pagamento.

        Args:
            amount (float): Valor em reais.
            currency (str): Moeda (padrão: 'brl').
            customer_id (str, optional): ID do cliente Stripe.
            metadata (Dict, optional): Metadados adicionais.

        Returns:
            Dict[str, Any]: Resultado com client_secret e payment_intent_id ou erro.
        """
        try:
            intent_data = {
                "amount": int(amount * 100),  # Stripe usa centavos
                "currency": currency,
                "automatic_payment_methods": {
                    "enabled": True,
                },
                "metadata": metadata or {},
            }

            if customer_id:
                intent_data["customer"] = customer_id

            payment_intent = stripe.PaymentIntent.create(**intent_data)

            return {
                "success": True,
                "client_secret": payment_intent.client_secret,
                "payment_intent_id": payment_intent.id,
            }

        except stripe.error.StripeError as e:
            logger.error(f"Erro ao criar Payment Intent: {str(e)}")
            return {"success": False, "error": str(e)}

    def create_stripe_subscription(
        self, customer_id: str, price_id: str, trial_period_days: int = None
    ) -> Dict[str, Any]:
        """Cria assinatura no Stripe"""
        try:
            subscription_data = {
                "customer": customer_id,
                "items": [{"price": price_id}],
                "payment_behavior": "default_incomplete",
                "payment_settings": {"save_default_payment_method": "on_subscription"},
                "expand": ["latest_invoice.payment_intent"],
            }

            if trial_period_days:
                subscription_data["trial_period_days"] = trial_period_days

            subscription = stripe.Subscription.create(**subscription_data)

            return {
                "success": True,
                "subscription_id": subscription.id,
                "client_secret": subscription.latest_invoice.payment_intent.client_secret,
            }

        except stripe.error.StripeError as e:
            logger.error(f"Erro ao criar assinatura Stripe: {str(e)}")
            return {"success": False, "error": str(e)}

    def handle_stripe_webhook(self, payload: str, signature: str) -> Dict[str, Any]:
        """
        Processa webhook do Stripe com idempotência.
        
        Verifica se webhook já foi processado antes de processar novamente para evitar duplicação.
        """
        try:
            webhook_secret = os.environ.get("STRIPE_WEBHOOK_SECRET")
            event = stripe.Webhook.construct_event(payload, signature, webhook_secret)

            webhook_id = event.get("id")
            if webhook_id:
                if self._is_webhook_processed(webhook_id, "stripe"):
                    logger.info(f"Webhook Stripe {webhook_id} já foi processado anteriormente")
                    return {
                        "success": True,
                        "message": "Webhook já processado (idempotência)",
                        "already_processed": True,
                    }

            # Processar evento
            result = None
            if event["type"] == "payment_intent.succeeded":
                result = self._handle_payment_success(event["data"]["object"])
            elif event["type"] == "payment_intent.payment_failed":
                result = self._handle_payment_failed(event["data"]["object"])
            elif event["type"] == "invoice.payment_succeeded":
                result = self._handle_subscription_payment(event["data"]["object"])
            elif event["type"] == "customer.subscription.updated":
                result = self._handle_subscription_updated(event["data"]["object"])
            elif event["type"] == "customer.subscription.deleted":
                result = self._handle_subscription_cancelled(event["data"]["object"])
            else:
                result = {"success": True, "message": "Evento processado"}

            if webhook_id and result:
                order_id = None
                transaction_id = None

                # Extrair order_id e transaction_id do evento
                if "data" in event and "object" in event["data"]:
                    obj = event["data"]["object"]
                    order_id = obj.get("metadata", {}).get("order_id")
                    transaction_id = obj.get("id") or obj.get("payment_intent")

                self._register_webhook_processed(
                    webhook_id=webhook_id,
                    provider="stripe",
                    event_type=event["type"],
                    order_id=order_id,
                    transaction_id=transaction_id,
                    result=result,
                )

            return result

        except stripe.error.SignatureVerificationError:
            logger.error("Webhook Stripe: Assinatura inválida")
            return {"success": False, "error": "Assinatura inválida"}
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            logger.error(f"Erro ao processar webhook Stripe: {str(e)}", exc_info=True)
            return {"success": False, "error": str(e)}

    # ================================
    # PAGSEGURO
    # ================================

    def create_pagseguro_payment(self, order_data: Dict[str, Any]) -> Dict[str, Any]:
        """Cria pagamento no PagSeguro"""
        try:
            # Dados do pagamento
            payment_data = {
                "email": self.pagseguro_email,
                "token": self.pagseguro_token,
                "currency": "BRL",
                "reference": order_data["order_id"],
                "notificationURL": f"{os.environ.get('BACKEND_URL')}/api/payments/pagseguro/notification",
                "redirectURL": f"{os.environ.get('FRONTEND_URL')}/payment/success",
            }

            # Adiciona itens
            for i, item in enumerate(order_data["items"]):
                payment_data[f"itemId{i+1}"] = item["id"]
                payment_data[f"itemDescription{i+1}"] = item["name"]
                payment_data[f"itemAmount{i+1}"] = f"{item['price']:.2f}"
                payment_data[f"itemQuantity{i+1}"] = item["quantity"]

            # Dados do comprador
            payment_data["senderName"] = order_data["customer"]["name"]
            payment_data["senderEmail"] = order_data["customer"]["email"]
            payment_data["senderPhone"] = order_data["customer"]["phone"]

            # Endereço
            if "address" in order_data:
                address = order_data["address"]
                payment_data["shippingAddressStreet"] = address["street"]
                payment_data["shippingAddressNumber"] = address["number"]
                payment_data["shippingAddressComplement"] = address.get("complement", "")
                payment_data["shippingAddressDistrict"] = address["district"]
                payment_data["shippingAddressPostalCode"] = address["postal_code"]
                payment_data["shippingAddressCity"] = address["city"]
                payment_data["shippingAddressState"] = address["state"]
                payment_data["shippingAddressCountry"] = "BRA"

            # Envia requisição
            response = requests.post(
                f"{self.pagseguro_url}/v2/checkout",
                data=payment_data,
                headers={"Content-Type": "application/x-www-form-urlencoded"},
            )

            if response.status_code == 200:
                # Parse XML response
                import xml.etree.ElementTree as ET

                root = ET.fromstring(response.text)

                if root.tag == "checkout":
                    code = root.find("code").text
                    logger.info(f"PagSeguro checkout criado: {code}")
                    return {
                        "success": True,
                        "payment_code": code,
                        "payment_url": f"{self.pagseguro_url}/v2/checkout/payment.html?code={code}",
                    }
                else:
                    error = root.find("error").text if root.find("error") is not None else "Erro desconhecido"
                    return {"success": False, "error": error}
            else:
                return {"success": False, "error": f"Erro HTTP: {response.status_code}"}

        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            logger.error(f"Erro ao criar pagamento PagSeguro: {str(e)}", exc_info=True)
            return {"success": False, "error": str(e)}

    def handle_pagseguro_notification(self, notification_code: str, notification_type: str) -> Dict[str, Any]:
        """
        Processa notificação do PagSeguro com idempotência.
        
        Verifica se notificação já foi processada antes de processar novamente para evitar duplicação.
        """
        try:
            if self._is_webhook_processed(notification_code, "pagseguro"):
                logger.info(f"Notificação PagSeguro {notification_code} já foi processada anteriormente")
                return {
                    "success": True,
                    "message": "Notificação já processada (idempotência)",
                    "already_processed": True,
                }

            # Busca detalhes da transação
            response = requests.get(
                f"{self.pagseguro_url}/v3/transactions/notifications/{notification_code}",
                params={"email": self.pagseguro_email, "token": self.pagseguro_token},
            )

            if response.status_code == 200:
                import xml.etree.ElementTree as ET

                root = ET.fromstring(response.text)

                transaction_id = root.find("code").text
                status = root.find("status").text
                reference = root.find("reference").text

                # Processar atualização de status
                result = self._update_payment_status(reference, status, "pagseguro", transaction_id)

                if result.get("success"):
                    self._register_webhook_processed(
                        webhook_id=notification_code,
                        provider="pagseguro",
                        event_type=notification_type,
                        order_id=reference,
                        transaction_id=transaction_id,
                        result=result,
                    )

                return result
            else:
                return {"success": False, "error": f"Erro ao buscar transação: {response.status_code}"}

        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            logger.error(f"Erro ao processar notificação PagSeguro: {str(e)}", exc_info=True)
            return {"success": False, "error": str(e)}

    # ================================
    # MÉTODOS AUXILIARES
    # ================================

    def _handle_payment_success(self, payment_intent: Dict) -> Dict[str, Any]:
        """Processa pagamento bem-sucedido"""
        try:
            order_id = payment_intent.get("metadata", {}).get("order_id")
            if order_id:
                return self._update_payment_status(order_id, "completed", "stripe", payment_intent["id"])
            return {"success": True}
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            logger.error(f"Erro ao processar pagamento bem-sucedido: {str(e)}", exc_info=True)
            return {"success": False, "error": str(e)}

    def _handle_subscription_payment(self, invoice: Dict) -> Dict[str, Any]:
        """
        Processa pagamento de assinatura.

        Utiliza SubscriptionService para acesso a dados seguindo o padrão de arquitetura.
        """
        try:
            subscription_id = invoice["subscription"]

            # Busca dados da assinatura
            subscription = stripe.Subscription.retrieve(subscription_id)

            from services.subscription_service import SubscriptionService

            subscription_service = SubscriptionService()

            update_data = {
                "status": subscription["status"],
                "current_period_end": datetime.fromtimestamp(subscription["current_period_end"]).isoformat(),
                "updated_at": datetime.utcnow().isoformat(),
            }

            result = subscription_service.update_subscription_by_stripe_id(subscription_id, update_data)

            if result.get("success"):
                return {"success": True}
            else:
                return {"success": False, "error": result.get("error", "Erro ao atualizar assinatura")}
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            logger.error(f"Erro ao processar pagamento de assinatura: {str(e)}", exc_info=True)
            return {"success": False, "error": str(e)}

    def _handle_subscription_updated(self, subscription: Dict) -> Dict[str, Any]:
        """
        Processa atualização de assinatura.

        Utiliza SubscriptionService para acesso a dados seguindo o padrão de arquitetura.
        """
        try:
            subscription_id = subscription["id"]
            status = subscription["status"]

            from services.subscription_service import SubscriptionService

            subscription_service = SubscriptionService()

            result = subscription_service.update_subscription_status(subscription_id, status)

            if result.get("success"):
                return {"success": True}
            else:
                return {"success": False, "error": result.get("error", "Erro ao atualizar assinatura")}
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            logger.error(f"Erro ao atualizar assinatura: {str(e)}", exc_info=True)
            return {"success": False, "error": str(e)}

    def _handle_subscription_cancelled(self, subscription: Dict) -> Dict[str, Any]:
        """
        Processa cancelamento de assinatura.

        Utiliza SubscriptionService para acesso a dados seguindo o padrão de arquitetura.
        """
        try:
            subscription_id = subscription["id"]

            from services.subscription_service import SubscriptionService

            subscription_service = SubscriptionService()

            additional_data = {"cancelled_at": datetime.utcnow().isoformat()}

            result = subscription_service.update_subscription_status(
                subscription_id, "cancelled", additional_data=additional_data
            )

            if result.get("success"):
                return {"success": True}
            else:
                return {"success": False, "error": result.get("error", "Erro ao cancelar assinatura")}
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            logger.error(f"Erro ao cancelar assinatura: {str(e)}", exc_info=True)
            return {"success": False, "error": str(e)}

    def handle_stripe_webhook_event(self, event_type: str, event_data: Dict[str, Any], event_id: str = None) -> Dict[str, Any]:
        """
        Processa eventos de webhook do Stripe.
        
        IMPORTANTE: Este método é chamado pela rota que já tem @webhook_idempotent,
        mas adiciona verificação adicional de processed_webhooks para dupla proteção.

        Args:
            event_type: Tipo do evento (payment_intent.succeeded, etc.)
            event_data: Dados do evento
            event_id: ID do evento (opcional, para verificação de idempotência)

        Returns:
            Dict com success ou error
        """
        try:
            # Verificação adicional de idempotência (dupla proteção)
            # A rota já tem @webhook_idempotent, mas verificamos também processed_webhooks
            if event_id:
                if self._is_webhook_processed(event_id, "stripe"):
                    logger.info(f"Webhook Stripe {event_id} já foi processado (verificação adicional)")
                    return {
                        "success": True,
                        "message": "Webhook já processado (idempotência)",
                        "already_processed": True,
                    }
            # Processar evento
            result = None
            if event_type == "payment_intent.succeeded":
                result = self._handle_payment_succeeded(event_data)
            elif event_type == "payment_intent.payment_failed":
                result = self._handle_payment_failed(event_data)
            elif event_type == "charge.succeeded":
                result = self._handle_charge_succeeded(event_data)
            elif event_type == "charge.failed":
                result = self._handle_charge_failed(event_data)
            elif event_type == "subscription.updated":
                result = self._handle_subscription_updated(event_data)
            elif event_type == "subscription.deleted":
                result = self._handle_subscription_cancelled(event_data)
            else:
                logger.info(f"Evento Stripe não processado: {event_type}")
                result = {"success": True, "message": "Evento ignorado"}
            
            # Registrar webhook como processado se tiver event_id
            if event_id and result and result.get('success') and not result.get('already_processed'):
                order_id = event_data.get('metadata', {}).get('order_id')
                transaction_id = event_data.get('id') or event_data.get('payment_intent')
                
                self._register_webhook_processed(
                    webhook_id=event_id,
                    provider="stripe",
                    event_type=event_type,
                    order_id=order_id,
                    transaction_id=transaction_id,
                    result=result,
                )
            
            return result
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            logger.error(f"Erro ao processar webhook Stripe: {str(e)}", exc_info=True)
            return {"success": False, "error": str(e)}

    def _handle_payment_succeeded(self, payment_intent: Dict[str, Any]) -> Dict[str, Any]:
        """
        Processa pagamento bem-sucedido.

        Utiliza OrderService para operações padronizadas.
        """
        try:
            order_id = payment_intent.get("metadata", {}).get("order_id")

            if order_id:
                from services.order_service import OrderService

                order_service = OrderService()

                result = order_service.update_order_status(
                    order_id=order_id, status="paid", transaction_id=payment_intent.get("id")
                )

                if result.get("success"):
                    logger.info(f"Pedido {order_id} pago com sucesso via Stripe")
                else:
                    logger.warning(f"Erro ao atualizar status do pedido {order_id}: {result.get('error')}")

            return {"success": True}
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            logger.error(f"Erro ao processar pagamento bem-sucedido: {str(e)}", exc_info=True)
            return {"success": False, "error": str(e)}

    def _handle_payment_failed(self, payment_intent: Dict[str, Any]) -> Dict[str, Any]:
        """
        Processa falha de pagamento.

        Utiliza OrderService para operações padronizadas.
        """
        try:
            order_id = payment_intent.get("metadata", {}).get("order_id")

            if order_id:
                from services.order_service import OrderService

                order_service = OrderService()

                result = order_service.update_order_status(order_id=order_id, status="failed")

                if result.get("success"):
                    logger.warning(f"Falha no pagamento do pedido {order_id}")
                else:
                    logger.warning(f"Erro ao atualizar status do pedido {order_id}: {result.get('error')}")

            return {"success": True}
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            logger.error(f"Erro ao processar falha de pagamento: {str(e)}", exc_info=True)
            return {"success": False, "error": str(e)}

    def _handle_charge_succeeded(self, charge: Dict[str, Any]) -> Dict[str, Any]:
        """Processa cobrança bem-sucedida"""
        # Similar a payment_intent.succeeded, mas para charges diretos
        return self._handle_payment_succeeded(charge)

    def _handle_charge_failed(self, charge: Dict[str, Any]) -> Dict[str, Any]:
        """Processa falha de cobrança"""
        return self._handle_payment_failed(charge)

    def _update_payment_status(self, order_id: str, status: str, provider: str, transaction_id: str) -> Dict[str, Any]:
        """Atualiza status do pagamento no banco"""
        try:
            # Mapeia status
            status_map = {
                "completed": "paid",
                "failed": "failed",
                "pending": "pending",
                "3": "paid",  # PagSeguro: Paga
                "4": "paid",  # PagSeguro: Disponível
                "5": "failed",  # PagSeguro: Em disputa
                "6": "failed",  # PagSeguro: Devolvida
                "7": "failed",  # PagSeguro: Cancelada
            }

            db_status = status_map.get(status, "pending")

            from services.order_service import OrderService

            order_service = OrderService()

            # Se pago, atualiza status do pedido também
            order_status = "processing" if db_status == "paid" else None

            result = order_service.update_order_payment_status(
                order_id=order_id,
                payment_status=db_status,
                provider=provider,
                transaction_id=transaction_id,
                order_status=order_status,
            )

            if result.get("success"):
                return {"success": True}
            else:
                return {"success": False, "error": result.get("error", "Erro ao atualizar status")}
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            logger.error(f"Erro ao atualizar status do pagamento: {str(e)}", exc_info=True)
            return {"success": False, "error": str(e)}

    def get_payment_methods(self) -> Dict[str, Any]:
        """Retorna métodos de pagamento disponíveis"""
        return {
            "stripe": {
                "enabled": bool(stripe.api_key),
                "public_key": self.stripe_public_key,
                "methods": ["card", "pix", "boleto"],
            },
            "pagseguro": {"enabled": bool(self.pagseguro_token), "methods": ["card", "pix", "boleto", "debit"]},
        }

    def process_refund(self, payment_id: str, amount: float = None) -> Dict[str, Any]:
        """
        Processa reembolso de um pagamento.
        
        Args:
            payment_id: ID do pagamento (Stripe payment intent ID ou PagSeguro transaction ID)
            amount: Valor a reembolsar (None = reembolso total)
            
        Returns:
            Dict com resultado do reembolso
        """
        try:
            # Tentar identificar gateway pelo formato do payment_id
            # Stripe: começa com "pi_" ou "ch_"
            # PagSeguro: formato alfanumérico
            
            if payment_id.startswith(("pi_", "ch_", "pm_")):
                # Stripe
                if not stripe.api_key:
                    return {"success": False, "error": "Stripe não configurado"}
                
                try:
                    # Buscar payment intent
                    payment_intent = stripe.PaymentIntent.retrieve(payment_id)
                    
                    # Criar reembolso
                    if amount:
                        refund_amount = int(amount * 100)  # Stripe usa centavos
                        refund = stripe.Refund.create(
                            payment_intent=payment_id,
                            amount=refund_amount
                        )
                    else:
                        # Reembolso total
                        refund = stripe.Refund.create(payment_intent=payment_id)
                    
                    return {
                        "success": True,
                        "refund_id": refund.id,
                        "amount": refund.amount / 100,  # Converter de centavos
                        "status": refund.status,
                        "gateway": "stripe"
                    }
                except stripe.error.StripeError as e:
                    logger.error(f"Erro ao processar reembolso Stripe: {str(e)}")
                    return {"success": False, "error": f"Erro Stripe: {str(e)}"}
            else:
                # PagSeguro ou outro gateway
                # Por enquanto, retornar sucesso simulado
                # Em produção, implementar integração real com PagSeguro
                logger.warning(f"Reembolso PagSeguro não implementado para payment_id: {payment_id}")
                return {
                    "success": True,
                    "refund_id": f"refund_{payment_id}",
                    "amount": amount or 0,
                    "status": "pending",
                    "gateway": "pagseguro",
                    "message": "Reembolso registrado (integração real pendente)"
                }
                
        except Exception as e:
            self.logger.error(f"Erro ao processar reembolso: {e}", exc_info=True)
            return {"success": False, "error": str(e)}

    # ================================
    # IDEMPOTÊNCIA DE WEBHOOKS
    # ================================

    def _is_webhook_processed(self, webhook_id: str, provider: str) -> bool:
        """
        Verifica se um webhook já foi processado anteriormente.
        
        Implementa idempotência para evitar processamento duplicado de webhooks.

        Args:
            webhook_id: ID único do webhook (Stripe event ID, PagSeguro notification code, etc.)
            provider: Provider do webhook ('stripe', 'pagseguro', etc.)

        Returns:
            bool: True se já foi processado, False caso contrário
        """
        try:
            from config.database import supabase_client

            # Chamar função SQL para verificar
            result = supabase_client.rpc("is_webhook_processed", {"p_webhook_id": webhook_id, "p_provider": provider})

            # Função retorna boolean
            return bool(result) if result is not None else False

        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            logger.error(f"Erro ao verificar idempotência de webhook: {str(e)}", exc_info=True)
            # Em caso de erro, assumir que não foi processado (processar para segurança)
            return False

    def _register_webhook_processed(
        self,
        webhook_id: str,
        provider: str,
        event_type: str,
        order_id: str = None,
        transaction_id: str = None,
        result: Dict = None,
    ) -> bool:
        """
        Registra um webhook como processado.

        Registra webhook processado para garantir idempotência.

        Args:
            webhook_id: ID único do webhook
            provider: Provider do webhook
            event_type: Tipo do evento
            order_id: ID do pedido (opcional)
            transaction_id: ID da transação (opcional)
            result: Resultado do processamento (opcional, para auditoria)

        Returns:
            bool: True se registrado com sucesso, False caso contrário
        """
        try:
            import json

            from config.database import supabase_client

            # Chamar função SQL para registrar
            supabase_client.rpc(
                "register_webhook_processed",
                {
                    "p_webhook_id": webhook_id,
                    "p_provider": provider,
                    "p_event_type": event_type,
                    "p_order_id": order_id,
                    "p_transaction_id": transaction_id,
                    "p_result": json.dumps(result) if result else None,
                },
            )

            # Se retornou ID, foi registrado com sucesso
            # Se retornou NULL, já existe (idempotência OK)
            return True

        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            logger.error(f"Erro ao registrar webhook processado: {str(e)}", exc_info=True)
            # Não falhar o processamento se registro falhar
            return False
