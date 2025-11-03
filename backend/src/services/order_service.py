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
from typing import Dict, Any, List, Optional
from datetime import datetime
from utils.helpers import generate_uuid
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

    def get_user_orders(self, user_id: str, page: int = 1, per_page: int = 20) -> Dict[str, Any]:
        """
        Retorna pedidos do usuário com paginação.

        CORRIGIDO: Agora usa OrderRepository para acesso a dados.

        Args:
            user_id (str): ID do usuário.
            page (int): Página (padrão: 1).
            per_page (int): Itens por página (padrão: 20).

        Returns:
            Dict[str, Any]: Pedidos paginados ou erro.
        """
        try:
            # ✅ Usa repositório - paginação otimizada com .range()
            return self.repo.find_by_user(user_id, page, per_page)
        except Exception as e:
            self.logger.error(f"Erro ao buscar pedidos: {str(e)}")
            return {
                'orders': [],
                'pagination': {
                    'page': page,
                    'per_page': per_page,
                    'total': 0,
                    'pages': 0
                },
                'error': 'Erro interno do servidor'
            }

    def get_order(self, order_id: str, user_id: str) -> Optional[Dict[str, Any]]:
        """
        Retorna detalhes de um pedido.

        CORRIGIDO: Usa repositório e valida que pedido pertence ao usuário.

        Args:
            order_id: ID do pedido
            user_id: ID do usuário

        Returns:
            Dict com dados do pedido ou None se não encontrado/não pertence ao usuário
        """
        try:
            # ✅ Busca via repositório (com cache)
            order = self.repo.find_by_id(order_id)

            # Validação de negócio: verifica se pedido pertence ao usuário
            if order and order.get('user_id') == user_id:
                return order
            return None

        except Exception as e:
            self.logger.error(f"Erro ao buscar pedido: {str(e)}")
            return None

    def cancel_order(self, order_id: str, user_id: str) -> Dict[str, Any]:
        """
        Cancela um pedido do usuário.

        CORRIGIDO: Agora usa OrderRepository para atualização.

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
                return {'success': False, 'error': 'Pedido não encontrado'}

            # ✅ Regra de negócio: verifica se pode cancelar
            if order.get('status') in ['cancelled', 'completed']:
                return {'success': False, 'error': 'Pedido não pode ser cancelado'}

            # ✅ Atualiza via repositório (com cache invalidation automático)
            updated = self.repo.update(order_id, {
                'status': 'cancelled',
                'updated_at': datetime.utcnow().isoformat()
            })

            if updated:
                return {'success': True, 'message': 'Pedido cancelado com sucesso', 'order': updated}
            else:
                return {'success': False, 'error': 'Erro ao cancelar pedido'}

        except Exception as e:
            self.logger.error(f"Erro ao cancelar pedido: {str(e)}")
            return {'success': False, 'error': 'Erro interno do servidor'}

    def create_order(self, user_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Cria novo pedido.

        CORRIGIDO: Agora usa OrderRepository para criação.

        Args:
            user_id: ID do usuário
            data: Dados do pedido (products, shipping_address, etc.)

        Returns:
            Dict com success e order ou error
        """
        try:
            # ✅ Regra de negócio: calcula total
            total = sum(item['price'] * item['quantity'] for item in data.get('products', []))

            # ✅ Regra de negócio: valida que tem produtos
            if not data.get('products') or len(data['products']) == 0:
                return {'success': False, 'error': 'Pedido deve conter pelo menos um produto'}

            # Prepara dados do pedido
            order_data = {
                'id': generate_uuid(),
                'user_id': user_id,
                'products': data['products'],
                'total': total,
                'status': 'pending',
                'shipping_address': data.get('shipping_address'),
                'payment_method': data.get('payment_method', 'credit_card'),
                'created_at': datetime.utcnow().isoformat(),
                'updated_at': datetime.utcnow().isoformat()
            }

            # ✅ Cria via repositório
            created_order = self.repo.create(order_data)

            if created_order:
                return {'success': True, 'order': created_order}
            else:
                return {'success': False, 'error': 'Erro ao criar pedido'}

        except Exception as e:
            self.logger.error(f"Erro ao criar pedido: {str(e)}")
            return {'success': False, 'error': 'Erro interno do servidor'}

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
            update_data = {
                'status': status,
                'payment_status': status,
                'updated_at': datetime.utcnow().isoformat()
            }

            if transaction_id:
                update_data['transaction_id'] = transaction_id

            updated = self.repo.update(order_id, update_data)

            if updated:
                return {'success': True, 'order': updated}
            else:
                return {'success': False, 'error': 'Pedido não encontrado'}
        except Exception as e:
            self.logger.error(f"Erro ao atualizar status do pedido: {str(e)}")
            return {'success': False, 'error': 'Erro interno do servidor'}

    def update_order_payment_status(
        self,
        order_id: str,
        payment_status: str,
        provider: str = None,
        transaction_id: str = None,
        order_status: str = None
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
            update_data = {
                'payment_status': payment_status,
                'updated_at': datetime.utcnow().isoformat()
            }

            if provider:
                update_data['payment_provider'] = provider
            if transaction_id:
                update_data['payment_transaction_id'] = transaction_id
            if order_status:
                update_data['status'] = order_status
            if payment_status == 'paid' and order_status == 'processing':
                update_data['paid_at'] = datetime.utcnow().isoformat()

            updated = self.repo.update(order_id, update_data)

            if updated:
                return {'success': True, 'order': updated}
            else:
                return {'success': False, 'error': 'Pedido não encontrado'}
        except Exception as e:
            self.logger.error(f"Erro ao atualizar status de pagamento: {str(e)}")
            return {'success': False, 'error': 'Erro interno do servidor'}
