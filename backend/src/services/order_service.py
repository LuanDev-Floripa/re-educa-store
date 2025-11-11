"""
Service de pedidos RE-EDUCA Store.

Gerencia fluxo completo de pedidos incluindo:
- Criação de pedidos a partir do carrinho
- Gestão de status do pedido
- Histórico de pedidos do usuário
- Validação de estoque
- Integração com pagamentos
"""

import logging
from datetime import datetime
from typing import Any, Dict, Optional

from repositories.order_repository import OrderRepository
from services.base_service import BaseService

logger = logging.getLogger(__name__)


class OrderService(BaseService):
    """
    Service para operações de pedidos.

    Implementa lógica de negócio para gerenciamento de pedidos.
    Usa OrderRepository para acesso a dados (padrão Repository).
    """

    def __init__(self):
        """Inicializa o serviço de pedidos."""
        super().__init__()
        self.repo = OrderRepository()
        try:
            from services.cart_service import CartService
            from services.coupon_service import CouponService
            from services.shipping_service import ShippingService

            self.cart_service = CartService()
            self.coupon_service = CouponService()
            self.shipping_service = ShippingService()
        except ImportError:
            self.logger.warning("Alguns serviços não disponíveis")
            self.cart_service = None
            self.coupon_service = None
            self.shipping_service = None

    def get_user_orders(self, user_id: str, page: int = 1, per_page: int = 20) -> Dict[str, Any]:
        """
        Retorna pedidos do usuário com paginação.

        Utiliza OrderRepository para acesso a dados seguindo o padrão de arquitetura.

        Args:
            user_id (str): ID do usuário.
            page (int): Página (padrão: 1).
            per_page (int): Itens por página (padrão: 20).

        Returns:
            Dict[str, Any]: Pedidos paginados ou erro.
        """
        try:
            return self.repo.find_by_user(user_id, page, per_page)
        except ValueError as e:
            self.logger.warning(f"Erro de validação ao buscar pedidos: {str(e)}")
            return {
                "orders": [],
                "pagination": {"page": page, "per_page": per_page, "total": 0, "pages": 0},
                "error": "Dados inválidos",
            }
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            self.logger.error(f"Erro ao buscar pedidos: {str(e)}", exc_info=True)
            return {
                "orders": [],
                "pagination": {"page": page, "per_page": per_page, "total": 0, "pages": 0},
                "error": "Erro interno do servidor",
            }

    def get_order(self, order_id: str, user_id: str) -> Optional[Dict[str, Any]]:
        """
        Retorna detalhes de um pedido.
        
        Utiliza repositório e valida que pedido pertence ao usuário para segurança.

        Args:
            order_id: ID do pedido
            user_id: ID do usuário

        Returns:
            Dict com dados do pedido ou None se não encontrado/não pertence ao usuário
        """
        try:
            order = self.repo.find_by_id(order_id)

            # Validação de negócio: verifica se pedido pertence ao usuário
            if order and order.get("user_id") == user_id:
                return order
            return None

        except ValueError as e:
            self.logger.warning(f"Erro de validação ao buscar pedido: {str(e)}")
            return None
        except KeyError as e:
            self.logger.warning(f"Campo obrigatório ausente ao buscar pedido: {str(e)}")
            return None
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            self.logger.error(f"Erro ao buscar pedido: {str(e)}", exc_info=True)
            return None

    def cancel_order(self, order_id: str, user_id: str) -> Dict[str, Any]:
        """
        Cancela um pedido do usuário.

        Utiliza OrderRepository para atualização padronizada.

        Args:
            order_id: ID do pedido
            user_id: ID do usuário

        Returns:
            Dict com success ou error
        """
        try:
            # Verifica se pedido existe e pertence ao usuário (via método que já valida)
            order = self.get_order(order_id, user_id)
            if not order:
                return {"success": False, "error": "Pedido não encontrado"}

            if order.get("status") in ["cancelled", "completed"]:
                return {"success": False, "error": "Pedido não pode ser cancelado"}

            updated = self.repo.update(order_id, {"status": "cancelled", "updated_at": datetime.utcnow().isoformat()})

            if updated:
                return {"success": True, "message": "Pedido cancelado com sucesso", "order": updated}
            else:
                return {"success": False, "error": "Erro ao cancelar pedido"}

        except ValueError as e:
            self.logger.warning(f"Erro de validação ao cancelar pedido: {str(e)}")
            return {"success": False, "error": f"Dados inválidos: {str(e)}"}
        except KeyError as e:
            self.logger.warning(f"Campo obrigatório ausente ao cancelar pedido: {str(e)}")
            return {"success": False, "error": f"Campo obrigatório ausente: {str(e)}"}
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            self.logger.error(f"Erro ao cancelar pedido: {str(e)}", exc_info=True)
            return {"success": False, "error": "Erro interno do servidor"}

    def create_order(self, user_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Cria novo pedido a partir do carrinho.

        MELHORADO: Agora cria pedido a partir do carrinho, calcula frete e aplica cupom.

        Args:
            user_id: ID do usuário
            data: Dados do pedido (shipping_address, payment_method, coupon_code, etc.)

        Returns:
            Dict com success e order ou error
        """
        try:
            # Buscar carrinho do usuário
            cart = self.cart_service.get_cart(user_id)
            cart_items = cart.get("items", [])

            # Validar que tem produtos no carrinho
            if not cart_items or len(cart_items) == 0:
                return {"success": False, "error": "Carrinho vazio"}

            # Calcular subtotal
            subtotal = cart.get("total", 0)

            # Aplicar cupom se fornecido
            discount_amount = 0
            coupon_code = data.get("coupon_code")
            if coupon_code:
                coupon_result = self.coupon_service.apply_coupon(coupon_code, user_id, subtotal)
                if coupon_result.get("success"):
                    discount_amount = coupon_result.get("discount_amount", 0)

            # Calcular frete
            shipping_address = data.get("shipping_address")
            order_items = data.get("items") or []
            
            # Se tiver CEP e itens, tentar usar API dos Correios
            use_correios = bool(
                shipping_address
                and (shipping_address.get("cep") or shipping_address.get("postal_code"))
                and order_items
            )
            
            shipping_result = self.shipping_service.calculate_shipping(
                order_total=subtotal,
                address=shipping_address,
                items=order_items,
                use_correios=use_correios
            )
            shipping_cost = shipping_result.get("shipping_cost", 0)

            # Calcular total final
            total = subtotal - discount_amount + shipping_cost

            # Preparar itens do pedido
            order_items = []
            for item in cart_items:
                order_items.append(
                    {
                        "product_id": item["product_id"],
                        "quantity": item["quantity"],
                        "price": item["price"],
                        "name": item.get("name", "Produto"),
                    }
                )

            # Isso garante que: valida estoque, cria pedido, cria itens e limpa carrinho em uma única transação
            from config.database import supabase_client

            # Preparar dados do pedido como dict (será convertido para JSONB no banco)
            order_data_jsonb = {
                "subtotal": float(subtotal),
                "discount_amount": float(discount_amount),
                "shipping_cost": float(shipping_cost),
                "total": float(total),
                "status": "pending",
                "payment_status": "pending",
                "shipping_address": shipping_address,
                "payment_method": data.get("payment_method", "credit_card"),
                "coupon_code": coupon_code if coupon_code else None,
                "transaction_id": data.get("transaction_id"),
            }

            # Preparar itens do carrinho (será convertido para JSONB no banco)
            # Formatar cada item corretamente
            formatted_cart_items = []
            for item in cart_items:
                formatted_cart_items.append(
                    {
                        "product_id": str(item["product_id"]),
                        "quantity": int(item["quantity"]),
                        "price": float(item["price"]),
                        "name": item.get("name", "Produto"),
                    }
                )

            # Chamar função SQL atômica
            # O Supabase client vai converter automaticamente para JSONB
            result = supabase_client.rpc(
                "create_order_atomic",
                {"p_user_id": user_id, "p_order_data": order_data_jsonb, "p_cart_items": formatted_cart_items},
            )

            if result and result.get("success"):
                # A função SQL já limpou o carrinho e validou estoque
                order_result = result.get("order")
                if isinstance(order_result, str):
                    import json

                    order_result = json.loads(order_result)

                return {"success": True, "order": order_result, "message": "Pedido criado com sucesso"}
            else:
                error_msg = result.get("error", "Erro ao criar pedido") if result else "Erro ao criar pedido"
                self.logger.error(f"Erro ao criar pedido: {error_msg}")
                return {"success": False, "error": error_msg}

        except ValueError as e:
            self.logger.warning(f"Erro de validação ao criar pedido: {str(e)}")
            return {"success": False, "error": f"Dados inválidos: {str(e)}"}
        except KeyError as e:
            self.logger.warning(f"Campo obrigatório ausente ao criar pedido: {str(e)}")
            return {"success": False, "error": f"Campo obrigatório ausente: {str(e)}"}
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            self.logger.error(f"Erro ao criar pedido: {str(e)}", exc_info=True)
            return {"success": False, "error": "Erro interno do servidor"}

    def update_order_status(self, order_id: str, status: str, transaction_id: str = None) -> Dict[str, Any]:
        """
        Atualiza status de um pedido.

        Método auxiliar para PaymentService usar.

        Args:
            order_id: ID do pedido
            status: Novo status ('paid', 'failed', etc.)
            transaction_id: ID da transação (opcional)

        Returns:
            Dict com success ou error
        """
        try:
            update_data = {"status": status, "payment_status": status, "updated_at": datetime.utcnow().isoformat()}

            if transaction_id:
                update_data["transaction_id"] = transaction_id

            updated = self.repo.update(order_id, update_data)

            if updated:
                return {"success": True, "order": updated}
            else:
                return {"success": False, "error": "Pedido não encontrado"}
        except ValueError as e:
            self.logger.warning(f"Erro de validação ao atualizar status: {str(e)}")
            return {"success": False, "error": f"Dados inválidos: {str(e)}"}
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            self.logger.error(f"Erro ao atualizar status do pedido: {str(e)}", exc_info=True)
            return {"success": False, "error": "Erro interno do servidor"}

    def update_order_payment_status(
        self,
        order_id: str,
        payment_status: str,
        provider: str = None,
        transaction_id: str = None,
        order_status: str = None,
    ) -> Dict[str, Any]:
        """
        Atualiza status de pagamento de um pedido.

        Método usado por PaymentService para atualizar pagamentos.

        Args:
            order_id: ID do pedido
            payment_status: Status do pagamento ('paid', 'failed', 'pending')
            provider: Provider de pagamento (opcional)
            transaction_id: ID da transação (opcional)
            order_status: Status do pedido se pagamento for aprovado (opcional)

        Returns:
            Dict com success ou error
        """
        try:
            update_data = {"payment_status": payment_status, "updated_at": datetime.utcnow().isoformat()}

            if provider:
                update_data["payment_provider"] = provider
            if transaction_id:
                update_data["payment_transaction_id"] = transaction_id
            if order_status:
                update_data["status"] = order_status
            if payment_status == "paid" and order_status == "processing":
                update_data["paid_at"] = datetime.utcnow().isoformat()

            updated = self.repo.update(order_id, update_data)

            if updated:
                return {"success": True, "order": updated}
            else:
                return {"success": False, "error": "Pedido não encontrado"}
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            self.logger.error(f"Erro ao atualizar status de pagamento: {str(e)}", exc_info=True)
            return {"success": False, "error": "Erro interno do servidor"}

    def update_order_tracking(self, order_id: str, tracking_number: str, admin_id: str = None) -> Dict[str, Any]:
        """
        Atualiza o código de rastreamento de um pedido (admin).
        Detecta automaticamente a transportadora e salva informações.

        Args:
            order_id: ID do pedido
            tracking_number: Código de rastreamento
            admin_id: ID do admin que está atualizando (opcional, para logs)

        Returns:
            Dict com success ou error
        """
        try:
            # Verificar se pedido existe
            order = self.repo.find_by_id(order_id)
            if not order:
                return {"success": False, "error": "Pedido não encontrado"}

            # Detectar transportadora automaticamente
            from services.carrier_detection_service import carrier_detection_service

            carrier_info = carrier_detection_service.get_carrier_info(tracking_number)
            carrier = carrier_info.get("carrier")
            tracking_url = carrier_info.get("tracking_url")

            # Atualizar pedido com tracking_number, carrier e tracking_url
            update_data = {
                "tracking_number": tracking_number,
                "carrier": carrier,
                "tracking_url": tracking_url,
                "updated_at": datetime.utcnow().isoformat(),
            }

            # Se status ainda não for "shipped", atualizar também
            if order.get("status") not in ["shipped", "delivered", "completed"]:
                update_data["status"] = "shipped"

            updated = self.repo.update(order_id, update_data)

            if updated:
                # Criar evento inicial no histórico de rastreamento
                from repositories.tracking_history_repository import TrackingHistoryRepository
                tracking_repo = TrackingHistoryRepository()
                tracking_repo.create_event(
                    order_id=order_id,
                    tracking_number=tracking_number,
                    event_type="created",
                    event_description=f"Código de rastreamento adicionado: {tracking_number}",
                    carrier=carrier,
                    source="admin" if admin_id else "manual",
                )
                
                self.logger.info(
                    f"Tracking atualizado para pedido {order_id} por admin {admin_id}: {tracking_number} ({carrier})"
                )
                return {
                    "success": True,
                    "message": "Código de rastreamento atualizado com sucesso",
                    "order": updated,
                    "carrier": carrier,
                    "tracking_url": tracking_url,
                }
            else:
                return {"success": False, "error": "Erro ao atualizar código de rastreamento"}

        except (ValueError, KeyError) as e:
            self.logger.warning(f"Erro de validação ao atualizar tracking: {str(e)}")
            return {"success": False, "error": f"Dados inválidos: {str(e)}"}
        except Exception as e:
            self.logger.error(f"Erro ao atualizar tracking: {str(e)}", exc_info=True)
            return {"success": False, "error": "Erro interno do servidor"}

    def get_order_tracking(self, order_id: str, user_id: str) -> Dict[str, Any]:
        """
        Retorna informações de rastreamento do pedido incluindo histórico.

        Args:
            order_id: ID do pedido
            user_id: ID do usuário

        Returns:
            Dict com informações de rastreamento e histórico ou erro
        """
        try:
            order = self.get_order(order_id, user_id)
            if not order:
                return {"success": False, "error": "Pedido não encontrado"}

            tracking_info = {
                "order_id": order_id,
                "status": order.get("status", "pending"),
                "tracking_number": order.get("tracking_number"),
                "estimated_delivery": order.get("estimated_delivery"),
                "shipping_address": order.get("shipping_address"),
                "created_at": order.get("created_at"),
                "updated_at": order.get("updated_at"),
                "tracking_url": None,
                "history": [],
            }

            # Se tiver tracking_number, construir URL de rastreamento e buscar histórico
            if tracking_info["tracking_number"]:
                # Detectar transportadora automaticamente
                from services.carrier_detection_service import carrier_detection_service

                carrier_info = carrier_detection_service.get_carrier_info(tracking_info["tracking_number"])
                tracking_info["tracking_url"] = carrier_info.get("tracking_url")
                tracking_info["carrier"] = carrier_info.get("carrier")
                tracking_info["carrier_detection_confidence"] = carrier_info.get("confidence")

                # Buscar histórico de rastreamento do banco
                from repositories.tracking_history_repository import TrackingHistoryRepository
                tracking_repo = TrackingHistoryRepository()
                history = tracking_repo.find_by_order(order_id)
                tracking_info["history"] = history

                # Se não houver histórico e for Correios, tentar buscar da API (se disponível)
                if not history and tracking_info.get("carrier") == "correios":
                    from services.correios_integration_service import correios_integration_service
                    api_history = correios_integration_service.get_tracking_history(tracking_info["tracking_number"])
                    # Nota: API pública não retorna histórico, mas estrutura está pronta

            return {"success": True, "tracking": tracking_info}
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            self.logger.error(f"Erro ao buscar rastreamento: {str(e)}", exc_info=True)
            return {"success": False, "error": "Erro interno do servidor"}

    def get_order_invoice(self, order_id: str, user_id: str) -> Dict[str, Any]:
        """
        Retorna dados da nota fiscal do pedido.

        Args:
            order_id: ID do pedido
            user_id: ID do usuário

        Returns:
            Dict com dados da nota fiscal ou erro
        """
        try:
            order = self.get_order(order_id, user_id)
            if not order:
                return {"success": False, "error": "Pedido não encontrado"}

            # Buscar itens do pedido
            items = order.get("items", [])
            if not isinstance(items, list):
                items = []

            invoice_data = {
                "order_id": order_id,
                "order_number": order.get("id"),
                "invoice_number": f"NF-{order_id[:8].upper()}",
                "issue_date": order.get("created_at"),
                "status": order.get("status"),
                "customer": {
                    "user_id": user_id,
                    # Adicionar dados do usuário se necessário
                },
                "shipping_address": order.get("shipping_address"),
                "items": [
                    {
                        "name": item.get("name", "Produto"),
                        "quantity": item.get("quantity", 1),
                        "unit_price": item.get("price", 0),
                        "total": item.get("price", 0) * item.get("quantity", 1),
                    }
                    for item in items
                ],
                "subtotal": order.get("subtotal", 0),
                "discount_amount": order.get("discount_amount", 0),
                "shipping_cost": order.get("shipping_cost", 0),
                "total": order.get("total", 0),
                "payment_method": order.get("payment_method", "credit_card"),
                "payment_status": order.get("payment_status", "pending"),
            }

            return {"success": True, "invoice": invoice_data}
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            self.logger.error(f"Erro ao buscar nota fiscal: {str(e)}", exc_info=True)
            return {"success": False, "error": "Erro interno do servidor"}

    def reorder(self, order_id: str, user_id: str) -> Dict[str, Any]:
        """
        Adiciona itens de um pedido anterior ao carrinho atual.

        Args:
            order_id: ID do pedido original
            user_id: ID do usuário

        Returns:
            Dict com success ou error
        """
        try:
            if not self.cart_service:
                return {"success": False, "error": "Serviço de carrinho não disponível"}

            # Buscar pedido original
            order = self.get_order(order_id, user_id)
            if not order:
                return {"success": False, "error": "Pedido não encontrado"}

            # Buscar itens do pedido
            items = order.get("items", [])
            if not isinstance(items, list) or len(items) == 0:
                return {"success": False, "error": "Pedido não possui itens"}

            # Adicionar cada item ao carrinho
            added_items = []
            failed_items = []

            for item in items:
                product_id = item.get("product_id")
                quantity = item.get("quantity", 1)

                if product_id:
                    try:
                        result = self.cart_service.add_to_cart(user_id, product_id, quantity)
                        if result.get("success"):
                            added_items.append(
                                {"product_id": product_id, "name": item.get("name", "Produto"), "quantity": quantity}
                            )
                        else:
                            failed_items.append(
                                {
                                    "product_id": product_id,
                                    "name": item.get("name", "Produto"),
                                    "error": result.get("error", "Erro desconhecido"),
                                }
                            )
                    except (ValueError, KeyError) as e:
                        logger.warning(f"Erro de validação: {str(e)}")
                        # Tratamento específico pode ser adicionado aqui
                    except Exception as e:
                        self.logger.error(f"Erro ao adicionar item ao carrinho: {str(e)}", exc_info=True)
                        failed_items.append(
                            {"product_id": product_id, "name": item.get("name", "Produto"), "error": str(e)}
                        )

            if len(added_items) > 0:
                return {
                    "success": True,
                    "message": f"{len(added_items)} item(ns) adicionado(s) ao carrinho",
                    "added_items": added_items,
                    "failed_items": failed_items if failed_items else None,
                }
            else:
                return {
                    "success": False,
                    "error": "Nenhum item pôde ser adicionado ao carrinho",
                    "failed_items": failed_items,
                }
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            self.logger.error(f"Erro ao reordenar pedido: {str(e)}", exc_info=True)
            return {"success": False, "error": "Erro interno do servidor"}
