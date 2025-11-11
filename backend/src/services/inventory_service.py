"""
Serviço de Estoque RE-EDUCA Store.

Gerencia controle de estoque incluindo:
- Consulta de disponibilidade
- Atualização de estoque (adição/subtração)
- Reserva de produtos para pedidos
- Liberação de reservas
- Validação de estoque disponível
- Histórico de movimentações
"""

import logging
from datetime import datetime, timedelta
from typing import Any, Dict

from repositories.inventory_repository import InventoryRepository
from repositories.product_repository import ProductRepository
from services.base_service import BaseService
from services.product_service import ProductService

logger = logging.getLogger(__name__)


class InventoryService(BaseService):
    """
    Service para gestão de estoque de produtos.
    
    Utiliza InventoryRepository e ProductRepository para acesso a dados seguindo o padrão de arquitetura.
    """

    def __init__(self):
        """Inicializa o serviço de estoque."""
        super().__init__()
        self.repo = InventoryRepository()
        self.product_repo = ProductRepository()
        self.product_service = ProductService()

    def get_product_stock(self, product_id: str) -> Dict[str, Any]:
        """
        Obtém estoque de um produto.

        Args:
            product_id (str): ID do produto.

        Returns:
            Dict[str, Any]: Quantidade em estoque e disponibilidade.
        """
        try:
            product = self.repo.get_product_stock(product_id)

            if not product:
                return {"success": False, "error": "Produto não encontrado"}

            return {
                "success": True,
                "product_id": product_id,
                "product_name": product.get("name", ""),
                "stock_quantity": product.get("stock_quantity", 0),
                "is_available": product.get("stock_quantity", 0) > 0,
            }

        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            self.logger.error(f"Erro ao buscar estoque: {str(e)}", exc_info=True)
            return {"success": False, "error": str(e)}

    def update_stock(self, product_id: str, quantity_change: int, operation: str = "subtract") -> Dict[str, Any]:
        """
        Atualiza estoque de um produto de forma atômica.

        Usa função SQL com lock pessimista para evitar race conditions.

        Args:
            product_id: ID do produto
            quantity_change: Quantidade a alterar (positivo para adicionar, negativo para subtrair)
            operation: 'subtract' (padrão), 'add' ou 'set'

        Returns:
            Dict com success e dados do estoque ou erro
        """
        try:
            from config.database import supabase_client

            # Normalizar quantity_change baseado na operação
            if operation == "subtract":
                # Para subtrair, quantity_change deve ser negativo
                actual_change = -abs(quantity_change)
            elif operation == "add":
                # Para adicionar, quantity_change deve ser positivo
                actual_change = abs(quantity_change)
            elif operation == "set":
                # Para set, precisa buscar estoque atual primeiro
                product = self.product_repo.find_by_id(product_id)
                if not product:
                    return {"success": False, "error": "Produto não encontrado"}
                current_stock = product.get("stock_quantity", 0)
                actual_change = quantity_change - current_stock
            else:
                return {"success": False, "error": "Operação inválida"}

            result = supabase_client.rpc(
                "update_product_stock", {"p_product_id": product_id, "p_quantity_change": actual_change}
            )

            if not result or result.get("error"):
                error_msg = result.get("error", "Erro desconhecido") if result else "Erro ao atualizar estoque"
                self.logger.error(f"Erro ao atualizar estoque: {error_msg}")
                return {"success": False, "error": error_msg}

            # Se sucesso, registrar movimento de estoque
            if result.get("success"):
                self._log_stock_movement(
                    product_id,
                    result.get("product_name", ""),
                    result.get("previous_stock", 0),
                    result.get("new_stock", 0),
                    operation,
                    abs(quantity_change),
                )

            return result

        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            self.logger.error(f"Erro ao atualizar estoque: {str(e)}", exc_info=True)
            return {"success": False, "error": str(e)}

    def reserve_stock(self, product_id: str, quantity: int, order_id: str = None) -> Dict[str, Any]:
        """Reserva estoque para um pedido"""
        try:
            # Verifica se há estoque suficiente
            stock_result = self.get_product_stock(product_id)
            if not stock_result["success"]:
                return stock_result

            if stock_result["stock_quantity"] < quantity:
                return {"success": False, "error": "Estoque insuficiente"}

            # Cria reserva
            reservation_data = {
                "product_id": product_id,
                "quantity": quantity,
                "order_id": order_id,
                "status": "reserved",
            }

            reservation_data["expires_at"] = (datetime.utcnow() + timedelta(hours=24)).isoformat()
            reservation_data["created_at"] = datetime.utcnow().isoformat()

            reservation = self.repo.create_reservation(reservation_data)

            if reservation:
                # Atualiza estoque disponível
                self.update_stock(product_id, quantity, "subtract")

                return {
                    "success": True,
                    "reservation_id": reservation["id"],
                    "product_id": product_id,
                    "quantity": quantity,
                    "expires_at": reservation_data["expires_at"],
                }
            else:
                return {"success": False, "error": "Erro ao criar reserva"}

        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            self.logger.error(f"Erro ao reservar estoque: {str(e)}", exc_info=True)
            return {"success": False, "error": str(e)}

    def confirm_stock_reservation(self, reservation_id: str) -> Dict[str, Any]:
        """Confirma reserva de estoque (converte em venda)"""
        try:
            reservation = self.repo.find_reservation_by_id(reservation_id)

            if not reservation:
                return {"success": False, "error": "Reserva não encontrada"}

            # Verifica se não expirou
            expires_at = datetime.fromisoformat(reservation["expires_at"])
            if datetime.utcnow() > expires_at:
                return {"success": False, "error": "Reserva expirada"}

            update_data = {"status": "confirmed", "confirmed_at": datetime.utcnow().isoformat()}
            updated = self.repo.update_reservation(reservation_id, update_data)
            if not updated:
                return {"success": False, "error": "Erro ao confirmar reserva"}

            return {
                "success": True,
                "reservation_id": reservation_id,
                "product_id": reservation["product_id"],
                "quantity": reservation["quantity"],
            }

        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            logger.error(f"Erro ao confirmar reserva: {str(e)}", exc_info=True)
            return {"success": False, "error": str(e)}

    def cancel_stock_reservation(self, reservation_id: str) -> Dict[str, Any]:
        """Cancela reserva de estoque"""
        try:
            reservation = self.repo.find_reservation_by_id(reservation_id)

            if not reservation:
                return {"success": False, "error": "Reserva não encontrada"}

            update_data = {"status": "cancelled", "cancelled_at": datetime.utcnow().isoformat()}
            updated = self.repo.update_reservation(reservation_id, update_data)
            if not updated:
                return {"success": False, "error": "Erro ao cancelar reserva"}

            # Devolve estoque
            self.update_stock(reservation["product_id"], reservation["quantity"], "add")

            return {
                "success": True,
                "reservation_id": reservation_id,
                "product_id": reservation["product_id"],
                "quantity": reservation["quantity"],
            }

        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            logger.error(f"Erro ao cancelar reserva: {str(e)}", exc_info=True)
            return {"success": False, "error": str(e)}

    def get_low_stock_products(self, threshold: int = 10) -> Dict[str, Any]:
        """Busca produtos com estoque baixo"""
        try:
            products = self.product_repo.find_low_stock(threshold)

            return {"success": True, "products": products, "threshold": threshold, "count": len(products)}

        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            logger.error(f"Erro ao buscar produtos com estoque baixo: {str(e)}", exc_info=True)
            return {"success": False, "error": str(e)}

    def get_stock_movements(
        self, product_id: str = None, start_date: str = None, end_date: str = None, page: int = 1, limit: int = 20
    ) -> Dict[str, Any]:
        """Busca movimentações de estoque"""
        try:
            movements = self.repo.find_movements(
                product_id=product_id, start_date=start_date, end_date=end_date, page=page, per_page=limit
            )

            return {"success": True, "movements": movements, "page": page, "limit": limit}

        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            self.logger.error(f"Erro ao buscar movimentações: {str(e)}", exc_info=True)
            return {"success": False, "error": str(e)}

    def get_inventory_report(self, start_date: str = None, end_date: str = None) -> Dict[str, Any]:
        """Gera relatório de estoque"""
        try:
            # Produtos com estoque baixo
            low_stock = self.get_low_stock_products()

            # Total de produtos
            total_products = self.product_repo.count_active()

            # Produtos sem estoque
            out_of_stock = self.product_repo.count_out_of_stock()

            # Produtos com estoque
            in_stock = total_products - out_of_stock

            # Valor total do estoque
            total_value = self.product_repo.get_total_inventory_value()

            return {
                "success": True,
                "report": {
                    "total_products": total_products,
                    "in_stock": in_stock,
                    "out_of_stock": out_of_stock,
                    "low_stock_count": low_stock.get("count", 0),
                    "low_stock_products": low_stock.get("products", []),
                    "total_inventory_value": total_value,
                    "generated_at": datetime.now().isoformat(),
                },
            }

        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            logger.error(f"Erro ao gerar relatório: {str(e)}", exc_info=True)
            return {"success": False, "error": str(e)}

    def _log_stock_movement(
        self, product_id: str, product_name: str, previous_stock: int, new_stock: int, operation: str, quantity: int
    ):
        """Registra movimentação de estoque"""
        try:
            movement_data = {
                "product_id": product_id,
                "product_name": product_name,
                "previous_stock": previous_stock,
                "new_stock": new_stock,
                "quantity_change": quantity,
                "operation": operation,
                "created_at": datetime.utcnow().isoformat(),
            }

            self.repo.create_movement(movement_data)

        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            self.logger.error(f"Erro ao registrar movimentação: {str(e)}", exc_info=True)

    def cleanup_expired_reservations(self) -> Dict[str, Any]:
        """Limpa reservas expiradas"""
        try:
            now = datetime.now().isoformat()

            # Busca reservas expiradas
            expired_reservations = self.repo.find_expired_reservations(now)

            cancelled_count = 0

            for reservation in expired_reservations:
                # Cancela reserva
                self.cancel_stock_reservation(reservation["id"])
                cancelled_count += 1

            return {"success": True, "cancelled_reservations": cancelled_count, "cleaned_at": now}

        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            logger.error(f"Erro ao limpar reservas expiradas: {str(e)}", exc_info=True)
            return {"success": False, "error": str(e)}

    def check_and_send_low_stock_alerts(self, threshold: int = 10) -> Dict[str, Any]:
        """
        Verifica produtos com estoque baixo e envia alertas.

        Utiliza configurações de alerta por produto ou usa threshold padrão.

        Args:
            threshold: Threshold padrão se produto não tiver configuração

        Returns:
            Dict com produtos alertados e estatísticas
        """
        try:
            from config.database import supabase_client

            # Buscar produtos com estoque baixo
            low_stock_result = self.get_low_stock_products(threshold)
            if not low_stock_result.get("success"):
                return {"success": False, "error": "Erro ao buscar produtos com estoque baixo"}

            products = low_stock_result.get("products", [])
            alerts_sent = 0
            alerts_created = []

            for product in products:
                product_id = product.get("id")
                stock_quantity = product.get("stock_quantity", 0)

                # Buscar configuração de alerta do produto
                alert_config = (
                    supabase_client.table("inventory_alert_settings")
                    .select("*")
                    .eq("product_id", product_id)
                    .eq("enabled", True)
                    .execute()
                )

                config = alert_config.data[0] if alert_config.data else None

                # Usar threshold da configuração ou padrão
                product_threshold = config.get("threshold", threshold) if config else threshold

                # Verificar se precisa alertar (estoque <= threshold)
                if stock_quantity > product_threshold:
                    continue

                # Verificar se já foi alertado recentemente (últimas 24h)
                recent_alert = (
                    supabase_client.table("inventory_alert_history")
                    .select("id")
                    .eq("product_id", product_id)
                    .eq("is_resolved", False)
                    .gte("sent_at", (datetime.utcnow() - timedelta(hours=24)).isoformat())
                    .execute()
                )

                if recent_alert.data:
                    # Já foi alertado recentemente, pular
                    continue

                # Determinar tipo de alerta
                if stock_quantity == 0:
                    alert_type = "out_of_stock"
                elif stock_quantity <= (product_threshold * 0.3):
                    alert_type = "critical"
                else:
                    alert_type = "low_stock"

                # Criar registro de alerta
                alert_data = {
                    "product_id": product_id,
                    "product_name": product.get("name", ""),
                    "threshold": product_threshold,
                    "stock_quantity": stock_quantity,
                    "alert_type": alert_type,
                    "notified_emails": config.get("notify_email", []) if config else [],
                    "notified_admins": config.get("notify_admins", True) if config else True,
                    "sent_at": datetime.utcnow().isoformat(),
                    "is_resolved": False,
                }

                alert_history = (
                    supabase_client.table("inventory_alert_history")
                    .insert(alert_data)
                    .execute()
                )

                if alert_history.data:
                    alert_id = alert_history.data[0]["id"]
                    alerts_created.append(alert_id)

                    # Enviar notificações
                    self._send_stock_alert_notifications(product, alert_data, config)
                    alerts_sent += 1

            return {
                "success": True,
                "alerts_sent": alerts_sent,
                "alerts_created": alerts_created,
                "products_checked": len(products),
                "checked_at": datetime.utcnow().isoformat(),
            }

        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            return {"success": False, "error": f"Erro de validação: {str(e)}"}
        except Exception as e:
            self.logger.error(f"Erro ao verificar e enviar alertas: {str(e)}", exc_info=True)
            return {"success": False, "error": str(e)}

    def _send_stock_alert_notifications(self, product: Dict[str, Any], alert_data: Dict[str, Any], config: Dict[str, Any] = None):
        """
        Envia notificações de alerta de estoque por email.

        Args:
            product: Dados do produto
            alert_data: Dados do alerta
            config: Configuração de alerta (opcional)
        """
        try:
            from services.email_service import EmailService
            from repositories.user_repository import UserRepository

            email_service = EmailService()
            user_repo = UserRepository()

            product_name = product.get("name", "Produto")
            stock_quantity = alert_data.get("stock_quantity", 0)
            alert_type = alert_data.get("alert_type", "low_stock")

            # Mensagens por tipo de alerta
            messages = {
                "out_of_stock": {
                    "subject": f"⚠️ ALERTA: {product_name} está SEM ESTOQUE",
                    "severity": "CRÍTICO",
                },
                "critical": {
                    "subject": f"🔴 ALERTA CRÍTICO: {product_name} com estoque muito baixo",
                    "severity": "CRÍTICO",
                },
                "low_stock": {
                    "subject": f"⚠️ ALERTA: {product_name} com estoque baixo",
                    "severity": "MÉDIO",
                },
            }

            message_info = messages.get(alert_type, messages["low_stock"])

            # Template HTML do email
            html_content = f"""
            <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2 style="color: #e74c3c;">{message_info['subject']}</h2>
                    
                    <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
                        <h3>Detalhes do Produto</h3>
                        <p><strong>Produto:</strong> {product_name}</p>
                        <p><strong>Estoque Atual:</strong> {stock_quantity} unidades</p>
                        <p><strong>Threshold:</strong> {alert_data.get('threshold', 10)} unidades</p>
                        <p><strong>Severidade:</strong> {message_info['severity']}</p>
                    </div>
                    
                    <p>Por favor, verifique o estoque e considere fazer um novo pedido.</p>
                    
                    <p style="color: #666; font-size: 12px; margin-top: 30px;">
                        Este é um alerta automático do sistema RE-EDUCA Store.
                    </p>
                </div>
            </body>
            </html>
            """

            text_content = f"""
            {message_info['subject']}
            
            Detalhes do Produto:
            - Produto: {product_name}
            - Estoque Atual: {stock_quantity} unidades
            - Threshold: {alert_data.get('threshold', 10)} unidades
            - Severidade: {message_info['severity']}
            
            Por favor, verifique o estoque e considere fazer um novo pedido.
            """

            # Enviar para emails configurados
            notify_emails = config.get("notify_email", []) if config else []
            for email in notify_emails:
                if email:
                    # Enviar email síncrono para alertas críticos (não usar queue)
                    email_service._send_email(email, message_info["subject"], html_content, text_content, use_queue=False)

            # Enviar para admins se configurado
            if config is None or config.get("notify_admins", True):
                # Buscar emails de admins
                from config.database import supabase_client
                admins_result = (
                    supabase_client.table("users")
                    .select("email")
                    .eq("role", "admin")
                    .eq("is_active", True)
                    .execute()
                )
                admins = admins_result.data if admins_result.data else []
                for admin in admins:
                    admin_email = admin.get("email")
                    if admin_email:
                        # Enviar email síncrono para alertas críticos (não usar queue)
                        email_service._send_email(admin_email, message_info["subject"], html_content, text_content, use_queue=False)

        except Exception as e:
            self.logger.error(f"Erro ao enviar notificações de alerta: {str(e)}", exc_info=True)

    def get_alert_settings(self, product_id: str = None) -> Dict[str, Any]:
        """
        Busca configurações de alerta.

        Args:
            product_id: ID do produto (opcional, se None retorna todas)

        Returns:
            Dict com configurações
        """
        try:
            from config.database import supabase_client

            query = supabase_client.table("inventory_alert_settings").select("*")

            if product_id:
                query = query.eq("product_id", product_id)

            result = query.execute()

            settings = result.data if result.data else []

            if product_id and settings:
                return {"success": True, "settings": settings[0]}
            else:
                return {"success": True, "settings": settings}

        except Exception as e:
            self.logger.error(f"Erro ao buscar configurações de alerta: {str(e)}", exc_info=True)
            return {"success": False, "error": str(e)}

    def update_alert_settings(self, product_id: str, settings_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Atualiza ou cria configurações de alerta para um produto.

        Args:
            product_id: ID do produto
            settings_data: Dados da configuração (threshold, enabled, notify_email, notify_admins)

        Returns:
            Dict com success e settings atualizadas
        """
        try:
            from config.database import supabase_client
            from datetime import datetime

            # Verificar se produto existe
            product = self.product_repo.find_by_id(product_id)
            if not product:
                return {"success": False, "error": "Produto não encontrado"}

            # Preparar dados
            update_data = {
                "product_id": product_id,
                "threshold": settings_data.get("threshold", 10),
                "enabled": settings_data.get("enabled", True),
                "notify_email": settings_data.get("notify_email", []),
                "notify_admins": settings_data.get("notify_admins", True),
                "updated_at": datetime.utcnow().isoformat(),
            }

            # Verificar se já existe configuração
            existing = (
                supabase_client.table("inventory_alert_settings")
                .select("id")
                .eq("product_id", product_id)
                .execute()
            )

            if existing.data:
                # Atualizar
                result = (
                    supabase_client.table("inventory_alert_settings")
                    .update(update_data)
                    .eq("product_id", product_id)
                    .execute()
                )
            else:
                # Criar
                update_data["created_at"] = datetime.utcnow().isoformat()
                result = supabase_client.table("inventory_alert_settings").insert(update_data).execute()

            if result.data:
                return {"success": True, "settings": result.data[0]}
            else:
                return {"success": False, "error": "Erro ao salvar configurações"}

        except Exception as e:
            self.logger.error(f"Erro ao atualizar configurações de alerta: {str(e)}", exc_info=True)
            return {"success": False, "error": str(e)}

    def get_alert_history(self, product_id: str = None, page: int = 1, per_page: int = 20) -> Dict[str, Any]:
        """
        Busca histórico de alertas.

        Args:
            product_id: ID do produto (opcional)
            page: Página
            per_page: Itens por página

        Returns:
            Dict com histórico e paginação
        """
        try:
            from config.database import supabase_client

            offset = (page - 1) * per_page
            end = offset + per_page - 1

            query = supabase_client.table("inventory_alert_history").select("*")

            if product_id:
                query = query.eq("product_id", product_id)

            query = query.order("sent_at", desc=True).range(offset, end)

            result = query.execute()
            alerts = result.data if result.data else []

            # Contar total
            count_query = supabase_client.table("inventory_alert_history").select("id", count="exact")
            if product_id:
                count_query = count_query.eq("product_id", product_id)
            count_result = count_query.execute()
            total = count_result.count if hasattr(count_result, "count") else len(alerts)

            return {
                "success": True,
                "alerts": alerts,
                "pagination": {
                    "page": page,
                    "per_page": per_page,
                    "total": total,
                    "pages": (total + per_page - 1) // per_page if total > 0 else 0,
                },
            }

        except Exception as e:
            self.logger.error(f"Erro ao buscar histórico de alertas: {str(e)}", exc_info=True)
            return {"success": False, "error": str(e)}
