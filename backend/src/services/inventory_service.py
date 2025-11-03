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
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
from repositories.inventory_repository import InventoryRepository
from repositories.product_repository import ProductRepository
from services.base_service import BaseService
from services.product_service import ProductService
from decimal import Decimal

logger = logging.getLogger(__name__)


class InventoryService(BaseService):
    """
    Service para gestão de estoque de produtos.

    CORRIGIDO: Agora usa InventoryRepository e ProductRepository para acesso a dados.
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
            # ✅ CORRIGIDO: Usa repositório
            product = self.repo.get_product_stock(product_id)

            if not product:
                return {'success': False, 'error': 'Produto não encontrado'}

            return {
                'success': True,
                'product_id': product_id,
                'product_name': product.get('name', ''),
                'stock_quantity': product.get('stock_quantity', 0),
                'is_available': product.get('stock_quantity', 0) > 0
            }

        except Exception as e:
            self.logger.error(f"Erro ao buscar estoque: {str(e)}")
            return {'success': False, 'error': str(e)}

    def update_stock(self, product_id: str, quantity_change: int, operation: str = 'subtract') -> Dict[str, Any]:
        """Atualiza estoque de um produto"""
        try:
            # ✅ CORRIGIDO: Usa ProductRepository
            product = self.product_repo.find_by_id(product_id)

            if not product:
                return {'success': False, 'error': 'Produto não encontrado'}

            current_stock = product.get('stock_quantity', 0)
            product_name = product.get('name', '')

            # Calcula novo estoque
            if operation == 'subtract':
                new_stock = current_stock - quantity_change
            elif operation == 'add':
                new_stock = current_stock + quantity_change
            elif operation == 'set':
                new_stock = quantity_change
            else:
                return {'success': False, 'error': 'Operação inválida'}

            # Verifica se não fica negativo
            if new_stock < 0:
                return {'success': False, 'error': 'Estoque insuficiente'}

            # ✅ CORRIGIDO: Atualiza estoque via ProductRepository
            updated = self.product_repo.update_stock(product_id, new_stock)
            if not updated:
                return {'success': False, 'error': 'Erro ao atualizar estoque'}

            # Registra movimento de estoque
            self._log_stock_movement(product_id, product_name, current_stock, new_stock, operation, quantity_change)

            return {
                'success': True,
                'product_id': product_id,
                'product_name': product_name,
                'previous_stock': current_stock,
                'new_stock': new_stock,
                'quantity_change': quantity_change,
                'operation': operation
            }

        except Exception as e:
            logger.error(f"Erro ao atualizar estoque: {str(e)}")
            return {'success': False, 'error': str(e)}

    def reserve_stock(self, product_id: str, quantity: int, order_id: str = None) -> Dict[str, Any]:
        """Reserva estoque para um pedido"""
        try:
            # Verifica se há estoque suficiente
            stock_result = self.get_product_stock(product_id)
            if not stock_result['success']:
                return stock_result

            if stock_result['stock_quantity'] < quantity:
                return {'success': False, 'error': 'Estoque insuficiente'}

            # Cria reserva
            reservation_data = {
                'product_id': product_id,
                'quantity': quantity,
                'order_id': order_id,
                'status': 'reserved',
            }

            # ✅ CORRIGIDO: Usa repositório (já corrigido acima)
            reservation_data['expires_at'] = (datetime.utcnow() + timedelta(hours=24)).isoformat()
            reservation_data['created_at'] = datetime.utcnow().isoformat()

            reservation = self.repo.create_reservation(reservation_data)

            if reservation:
                # Atualiza estoque disponível
                self.update_stock(product_id, quantity, 'subtract')

                return {
                    'success': True,
                    'reservation_id': reservation['id'],
                    'product_id': product_id,
                    'quantity': quantity,
                    'expires_at': reservation_data['expires_at']
                }
            else:
                return {'success': False, 'error': 'Erro ao criar reserva'}

        except Exception as e:
            self.logger.error(f"Erro ao reservar estoque: {str(e)}")
            return {'success': False, 'error': str(e)}

    def confirm_stock_reservation(self, reservation_id: str) -> Dict[str, Any]:
        """Confirma reserva de estoque (converte em venda)"""
        try:
            # ✅ CORRIGIDO: Busca reserva via repositório
            reservation = self.repo.find_reservation_by_id(reservation_id)

            if not reservation:
                return {'success': False, 'error': 'Reserva não encontrada'}

            # Verifica se não expirou
            expires_at = datetime.fromisoformat(reservation['expires_at'])
            if datetime.utcnow() > expires_at:
                return {'success': False, 'error': 'Reserva expirada'}

            # ✅ CORRIGIDO: Atualiza status via repositório
            update_data = {
                'status': 'confirmed',
                'confirmed_at': datetime.utcnow().isoformat()
            }
            updated = self.repo.update_reservation(reservation_id, update_data)
            if not updated:
                return {'success': False, 'error': 'Erro ao confirmar reserva'}

            return {
                'success': True,
                'reservation_id': reservation_id,
                'product_id': reservation['product_id'],
                'quantity': reservation['quantity']
            }

        except Exception as e:
            logger.error(f"Erro ao confirmar reserva: {str(e)}")
            return {'success': False, 'error': str(e)}

    def cancel_stock_reservation(self, reservation_id: str) -> Dict[str, Any]:
        """Cancela reserva de estoque"""
        try:
            # ✅ CORRIGIDO: Busca reserva via repositório
            reservation = self.repo.find_reservation_by_id(reservation_id)

            if not reservation:
                return {'success': False, 'error': 'Reserva não encontrada'}

            # ✅ CORRIGIDO: Atualiza status via repositório
            update_data = {
                'status': 'cancelled',
                'cancelled_at': datetime.utcnow().isoformat()
            }
            updated = self.repo.update_reservation(reservation_id, update_data)
            if not updated:
                return {'success': False, 'error': 'Erro ao cancelar reserva'}

            # Devolve estoque
            self.update_stock(reservation['product_id'], reservation['quantity'], 'add')

            return {
                'success': True,
                'reservation_id': reservation_id,
                'product_id': reservation['product_id'],
                'quantity': reservation['quantity']
            }

        except Exception as e:
            logger.error(f"Erro ao cancelar reserva: {str(e)}")
            return {'success': False, 'error': str(e)}

    def get_low_stock_products(self, threshold: int = 10) -> Dict[str, Any]:
        """Busca produtos com estoque baixo"""
        try:
            # ✅ CORRIGIDO: Usa ProductRepository
            products = self.product_repo.find_low_stock(threshold)

            return {
                'success': True,
                'products': products,
                'threshold': threshold,
                'count': len(products)
            }

        except Exception as e:
            logger.error(f"Erro ao buscar produtos com estoque baixo: {str(e)}")
            return {'success': False, 'error': str(e)}

    def get_stock_movements(self, product_id: str = None, start_date: str = None,
                          end_date: str = None, page: int = 1, limit: int = 20) -> Dict[str, Any]:
        """Busca movimentações de estoque"""
        try:
            # ✅ CORRIGIDO: Usa repositório
            movements = self.repo.find_movements(product_id=product_id, start_date=start_date,
                                                end_date=end_date, page=page, per_page=limit)

            return {
                'success': True,
                'movements': movements,
                'page': page,
                'limit': limit
            }

        except Exception as e:
            self.logger.error(f"Erro ao buscar movimentações: {str(e)}")
            return {'success': False, 'error': str(e)}

    def get_inventory_report(self, start_date: str = None, end_date: str = None) -> Dict[str, Any]:
        """Gera relatório de estoque"""
        try:
            # Produtos com estoque baixo
            low_stock = self.get_low_stock_products()

            # ✅ CORRIGIDO: Usa ProductRepository
            # Total de produtos
            total_products = self.product_repo.count_active()

            # Produtos sem estoque
            out_of_stock = self.product_repo.count_out_of_stock()

            # Produtos com estoque
            in_stock = total_products - out_of_stock

            # Valor total do estoque
            total_value = self.product_repo.get_total_inventory_value()

            return {
                'success': True,
                'report': {
                    'total_products': total_products,
                    'in_stock': in_stock,
                    'out_of_stock': out_of_stock,
                    'low_stock_count': low_stock.get('count', 0),
                    'low_stock_products': low_stock.get('products', []),
                    'total_inventory_value': total_value,
                    'generated_at': datetime.now().isoformat()
                }
            }

        except Exception as e:
            logger.error(f"Erro ao gerar relatório: {str(e)}")
            return {'success': False, 'error': str(e)}

    def _log_stock_movement(self, product_id: str, product_name: str, previous_stock: int,
                          new_stock: int, operation: str, quantity: int):
        """Registra movimentação de estoque"""
        try:
            movement_data = {
                'product_id': product_id,
                'product_name': product_name,
                'previous_stock': previous_stock,
                'new_stock': new_stock,
                'quantity_change': quantity,
                'operation': operation,
                'created_at': datetime.utcnow().isoformat()
            }

            # ✅ CORRIGIDO: Usa repositório
            self.repo.create_movement(movement_data)

        except Exception as e:
            self.logger.error(f"Erro ao registrar movimentação: {str(e)}")

    def cleanup_expired_reservations(self) -> Dict[str, Any]:
        """Limpa reservas expiradas"""
        try:
            now = datetime.now().isoformat()

            # Busca reservas expiradas
            # ✅ CORRIGIDO: Usa InventoryRepository
            expired_reservations = self.repo.find_expired_reservations(now)

            cancelled_count = 0

            for reservation in expired_reservations:
                # Cancela reserva
                self.cancel_stock_reservation(reservation['id'])
                cancelled_count += 1

            return {
                'success': True,
                'cancelled_reservations': cancelled_count,
                'cleaned_at': now
            }

        except Exception as e:
            logger.error(f"Erro ao limpar reservas expiradas: {str(e)}")
            return {'success': False, 'error': str(e)}
