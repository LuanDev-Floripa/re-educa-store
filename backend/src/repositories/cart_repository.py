# -*- coding: utf-8 -*-
"""
Repositório de Carrinho RE-EDUCA Store.

Gerencia acesso a dados do carrinho de compras.
"""
import logging
from typing import Any, Dict, List, Optional

from repositories.base_repository import BaseRepository

logger = logging.getLogger(__name__)


class CartRepository(BaseRepository):
    """
    Repositório para operações com carrinho de compras.

    Tabela: cart_items
    """

    def __init__(self):
        """Inicializa o repositório de carrinho."""
        super().__init__("cart_items")

    def find_by_user(self, user_id: str) -> List[Dict[str, Any]]:
        """
        Busca itens do carrinho de um usuário.

        Args:
            user_id: ID do usuário

        Returns:
            Lista de itens do carrinho
        """
        try:
            return self.find_all(filters={"user_id": user_id}, order_by="created_at", desc=False)
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            self.logger.error(f"Erro ao buscar carrinho: {str(e)}", exc_info=True)
            return []

    def find_item(self, user_id: str, product_id: str) -> Optional[Dict[str, Any]]:
        """
        Busca um item específico no carrinho.

        Args:
            user_id: ID do usuário
            product_id: ID do produto

        Returns:
            Item do carrinho ou None
        """
        try:
            items = self.find_all(filters={"user_id": user_id, "product_id": product_id}, limit=1)
            return items[0] if items else None
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            self.logger.error(f"Erro ao buscar item: {str(e)}", exc_info=True)
            return None

    def clear_user_cart(self, user_id: str) -> bool:
        """
        Limpa carrinho de um usuário.

        Args:
            user_id: ID do usuário

        Returns:
            True se deletado, False caso contrário
        """
        try:
            (self.db.table(self.table_name).delete().eq("user_id", user_id).execute())
            return True
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            self.logger.error(f"Erro ao limpar carrinho: {str(e)}", exc_info=True)
            return False

    def count_user_items(self, user_id: str) -> int:
        """
        Conta itens no carrinho do usuário.

        Args:
            user_id: ID do usuário

        Returns:
            Número de itens
        """
        try:
            items = self.find_by_user(user_id)
            return len(items)
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            self.logger.error(f"Erro ao contar itens: {str(e)}", exc_info=True)
            return 0

    def find_by_user_with_products(self, user_id: str) -> List[Dict[str, Any]]:
        """
        Busca itens do carrinho com dados dos produtos.

        Args:
            user_id: ID do usuário

        Returns:
            Lista de itens do carrinho com dados dos produtos
        """
        try:
            result = (
                self.db.table(self.table_name)
                .select("*, products(*)")
                .eq("user_id", user_id)
                .order("created_at", desc=False)
                .execute()
            )
            return result.data or []
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            self.logger.error(f"Erro ao buscar carrinho com produtos: {str(e)}", exc_info=True)
            return []

    def find_by_user_and_product(self, user_id: str, product_id: str) -> Optional[Dict[str, Any]]:
        """
        Busca item específico no carrinho por usuário e produto.

        Args:
            user_id: ID do usuário
            product_id: ID do produto

        Returns:
            Item do carrinho ou None
        """
        try:
            result = (
                self.db.table(self.table_name)
                .select("*")
                .eq("user_id", user_id)
                .eq("product_id", product_id)
                .limit(1)
                .execute()
            )
            return result.data[0] if result.data and len(result.data) > 0 else None
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            self.logger.error(f"Erro ao buscar item: {str(e)}", exc_info=True)
            return None

    def create_item(self, user_id: str, product_id: str, quantity: int) -> Optional[Dict[str, Any]]:
        """
        Cria novo item no carrinho.

        Args:
            user_id: ID do usuário
            product_id: ID do produto
            quantity: Quantidade

        Returns:
            Item criado ou None
        """
        try:
            result = (
                self.db.table(self.table_name)
                .insert({"user_id": user_id, "product_id": product_id, "quantity": quantity})
                .execute()
            )
            return result.data[0] if result.data and len(result.data) > 0 else None
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            self.logger.error(f"Erro ao criar item: {str(e)}", exc_info=True)
            return None

    def update_quantity(self, item_id: str, user_id: str, quantity: int) -> Optional[Dict[str, Any]]:
        """
        Atualiza quantidade de um item (com validação de usuário).

        Args:
            item_id: ID do item
            user_id: ID do usuário (validação)
            quantity: Nova quantidade

        Returns:
            Item atualizado ou None
        """
        try:
            if quantity <= 0:
                return self.delete_by_id_and_user(item_id, user_id)

            result = (
                self.db.table(self.table_name)
                .update({"quantity": quantity})
                .eq("id", item_id)
                .eq("user_id", user_id)
                .execute()
            )
            return result.data[0] if result.data and len(result.data) > 0 else None
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            self.logger.error(f"Erro ao atualizar quantidade: {str(e)}", exc_info=True)
            return None

    def find_by_id_and_user(self, item_id: str, user_id: str) -> Optional[Dict[str, Any]]:
        """
        Busca item por ID e usuário.

        Args:
            item_id: ID do item
            user_id: ID do usuário

        Returns:
            Item ou None
        """
        try:
            result = (
                self.db.table(self.table_name).select("*").eq("id", item_id).eq("user_id", user_id).limit(1).execute()
            )
            return result.data[0] if result.data and len(result.data) > 0 else None
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            self.logger.error(f"Erro ao buscar item: {str(e)}", exc_info=True)
            return None

    def delete_by_id_and_user(self, item_id: str, user_id: str) -> bool:
        """
        Deleta item por ID e usuário.

        Args:
            item_id: ID do item
            user_id: ID do usuário

        Returns:
            True se deletado, False caso contrário
        """
        try:
            (self.db.table(self.table_name).delete().eq("id", item_id).eq("user_id", user_id).execute())
            return True
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            self.logger.error(f"Erro ao deletar item: {str(e)}", exc_info=True)
            return False

    def delete_all_by_user(self, user_id: str) -> bool:
        """
        Deleta todos os itens do carrinho de um usuário.

        Args:
            user_id: ID do usuário

        Returns:
            True se deletado, False caso contrário
        """
        try:
            (self.db.table(self.table_name).delete().eq("user_id", user_id).execute())
            return True
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            self.logger.error(f"Erro ao limpar carrinho: {str(e)}", exc_info=True)
            return False
