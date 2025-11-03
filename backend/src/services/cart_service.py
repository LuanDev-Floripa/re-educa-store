"""
Service de Carrinho RE-EDUCA Store.

Gerencia operações do carrinho de compras incluindo:
- Adicionar e remover produtos
- Atualizar quantidades
- Calcular totais
- Validar estoque disponível
- Limpar carrinho
"""
import logging
from typing import Dict, Any, List
from repositories.cart_repository import CartRepository
from services.base_service import BaseService
from services.product_service import ProductService


class CartService(BaseService):
    """
    Service para operações de carrinho de compras.

    CORRIGIDO: Agora usa CartRepository para acesso a dados.
    """

    def __init__(self):
        """Inicializa o serviço de carrinho."""
        super().__init__()
        self.repo = CartRepository()
        self.product_service = ProductService()

    def get_cart(self, user_id: str) -> Dict[str, Any]:
        """
        Retorna carrinho do usuário com itens e totais.

        CORRIGIDO: Agora usa CartRepository.

        Args:
            user_id (str): ID do usuário.

        Returns:
            Dict[str, Any]: Carrinho com items, total e item_count.
        """
        try:
            # ✅ CORRIGIDO: Usa repositório
            cart_items = self.repo.find_by_user_with_products(user_id)

            items = []
            total = 0

            for item in cart_items:
                # Filtrar apenas produtos ativos
                product = item.get('products', {}) if isinstance(item.get('products'), dict) else {}
                if not product.get('is_active', True):
                    continue

                item_total = item['quantity'] * product.get('price', 0)
                items.append({
                    'id': item['id'],
                    'product_id': item['product_id'],
                    'quantity': item['quantity'],
                    'name': product.get('name', 'Produto'),
                    'price': product.get('price', 0),
                    'image_url': product.get('image_url', ''),
                    'stock_quantity': product.get('stock_quantity', 0),
                    'total': item_total,
                    'created_at': item.get('created_at'),
                    'updated_at': item.get('updated_at')
                })
                total += item_total

            return {
                'items': items,
                'total': round(total, 2),
                'item_count': len(items)
            }
        except Exception as e:
            self.logger.error(f"Erro ao buscar carrinho: {str(e)}", exc_info=True)
            return {'items': [], 'total': 0, 'item_count': 0}

    def add_to_cart(self, user_id: str, product_id: str, quantity: int = 1) -> Dict[str, Any]:
        """
        Adiciona produto ao carrinho ou atualiza quantidade.

        CORRIGIDO: Agora usa CartRepository e ProductService.

        Args:
            user_id (str): ID do usuário.
            product_id (str): ID do produto.
            quantity (int): Quantidade a adicionar (padrão: 1).

        Returns:
            Dict[str, Any]: Resultado com success e carrinho atualizado ou erro.
        """
        try:
            if quantity <= 0:
                return {'success': False, 'error': 'Quantidade inválida'}

            # ✅ CORRIGIDO: Usa ProductService para verificar produto
            product_result = self.product_service.get_product(product_id)
            if not product_result.get('success') or not product_result.get('product'):
                return {'success': False, 'error': 'Produto não encontrado ou inativo'}

            product = product_result['product']

            # Verificar estoque disponível
            if product.get('stock_quantity', 0) < quantity:
                return {'success': False, 'error': 'Estoque insuficiente'}

            # ✅ CORRIGIDO: Verifica se item já existe via repositório
            existing_item = self.repo.find_by_user_and_product(user_id, product_id)

            if existing_item:
                # Atualizar quantidade existente
                new_quantity = existing_item['quantity'] + quantity

                # Verificar estoque novamente
                if product.get('stock_quantity', 0) < new_quantity:
                    return {'success': False, 'error': 'Estoque insuficiente para esta quantidade'}

                # ✅ CORRIGIDO: Atualiza via repositório
                updated = self.repo.update_quantity(existing_item['id'], user_id, new_quantity)
                if not updated:
                    return {'success': False, 'error': 'Erro ao atualizar carrinho'}
            else:
                # ✅ CORRIGIDO: Insere novo item via repositório
                created = self.repo.create_item(user_id, product_id, quantity)
                if not created:
                    return {'success': False, 'error': 'Erro ao adicionar ao carrinho'}

            return {'success': True, 'message': 'Produto adicionado ao carrinho'}
        except Exception as e:
            self.logger.error(f"Erro ao adicionar ao carrinho: {str(e)}", exc_info=True)
            return {'success': False, 'error': 'Erro ao adicionar ao carrinho'}

    def update_cart_item(self, user_id: str, item_id: str, quantity: int) -> Dict[str, Any]:
        """
        Atualiza quantidade de item no carrinho.

        CORRIGIDO: Agora usa CartRepository e ProductService.

        Args:
            user_id (str): ID do usuário.
            item_id (str): ID do item do carrinho.
            quantity (int): Nova quantidade.

        Returns:
            Dict[str, Any]: Resultado da operação.
        """
        try:
            if quantity <= 0:
                return self.remove_from_cart(user_id, item_id)

            # ✅ CORRIGIDO: Busca item via repositório
            item = self.repo.find_by_id_and_user(item_id, user_id)

            if not item:
                return {'success': False, 'error': 'Item não encontrado'}

            # ✅ CORRIGIDO: Verifica estoque via ProductService
            product_result = self.product_service.get_product(item['product_id'])
            if not product_result.get('success') or not product_result.get('product'):
                return {'success': False, 'error': 'Produto não encontrado'}

            product = product_result['product']
            stock_quantity = product.get('stock_quantity', 0)

            # Verificar estoque
            if stock_quantity < quantity:
                return {'success': False, 'error': 'Estoque insuficiente'}

            # ✅ CORRIGIDO: Atualiza via repositório
            updated = self.repo.update_quantity(item_id, user_id, quantity)
            if not updated:
                return {'success': False, 'error': 'Erro ao atualizar carrinho'}

            return {'success': True, 'message': 'Carrinho atualizado'}
        except Exception as e:
            self.logger.error(f"Erro ao atualizar carrinho: {str(e)}", exc_info=True)
            return {'success': False, 'error': 'Erro ao atualizar carrinho'}

    def remove_from_cart(self, user_id: str, item_id: str) -> Dict[str, Any]:
        """
        Remove item do carrinho.

        CORRIGIDO: Agora usa CartRepository.

        Args:
            user_id (str): ID do usuário.
            item_id (str): ID do item do carrinho.

        Returns:
            Dict[str, Any]: Resultado da operação.
        """
        try:
            # ✅ CORRIGIDO: Remove via repositório
            success = self.repo.delete_by_id_and_user(item_id, user_id)

            if success:
                return {'success': True, 'message': 'Item removido do carrinho'}
            else:
                return {'success': False, 'error': 'Erro ao remover do carrinho'}
        except Exception as e:
            self.logger.error(f"Erro ao remover do carrinho: {str(e)}", exc_info=True)
            return {'success': False, 'error': 'Erro ao remover do carrinho'}

    def clear_cart(self, user_id: str) -> Dict[str, Any]:
        """
        Limpa carrinho do usuário (remove todos os itens).

        CORRIGIDO: Agora usa CartRepository.

        Args:
            user_id (str): ID do usuário.

        Returns:
            Dict[str, Any]: Resultado da operação.
        """
        try:
            # ✅ CORRIGIDO: Limpa via repositório
            success = self.repo.delete_all_by_user(user_id)

            if success:
                return {'success': True, 'message': 'Carrinho limpo'}
            else:
                return {'success': False, 'error': 'Erro ao limpar carrinho'}
        except Exception as e:
            self.logger.error(f"Erro ao limpar carrinho: {str(e)}", exc_info=True)
            return {'success': False, 'error': 'Erro ao limpar carrinho'}


# Instância global do serviço
cart_service = CartService()
