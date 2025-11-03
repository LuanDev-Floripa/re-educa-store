# -*- coding: utf-8 -*-
"""
Repositório de Produtos RE-EDUCA Store.

Gerencia acesso a dados de produtos.
"""
import logging
from typing import Dict, Any, List, Optional
from repositories.base_repository import BaseRepository

logger = logging.getLogger(__name__)


class ProductRepository(BaseRepository):
    """
    Repositório para operações com produtos.
    
    Tabela: products
    """
    
    def __init__(self):
        """Inicializa o repositório de produtos."""
        super().__init__('products')
    
    def find_active(self, limit: Optional[int] = None, offset: int = 0) -> List[Dict[str, Any]]:
        """
        Busca produtos ativos.
        
        Args:
            limit: Limite de resultados
            offset: Offset para paginação
        
        Returns:
            Lista de produtos ativos
        """
        try:
            return self.find_all(
                filters={'is_active': True},
                order_by='created_at',
                desc=True,
                limit=limit,
                offset=offset
            )
        except Exception as e:
            self.logger.error(f"Erro ao buscar produtos ativos: {str(e)}")
            return []
    
    def update_stock(self, product_id: str, new_stock: int) -> Optional[Dict[str, Any]]:
        """
        Atualiza estoque de um produto.
        
        Args:
            product_id: ID do produto
            new_stock: Nova quantidade em estoque
        
        Returns:
            Produto atualizado ou None
        """
        try:
            from datetime import datetime
            
            return self.update(product_id, {
                'stock_quantity': max(0, new_stock),  # Não permite negativo
                'updated_at': datetime.now().isoformat()
            })
        except Exception as e:
            self.logger.error(f"Erro ao atualizar estoque: {str(e)}")
            return None
    
    def find_low_stock(self, threshold: int = 10) -> List[Dict[str, Any]]:
        """
        Busca produtos com estoque baixo.
        
        Args:
            threshold: Limite de estoque mínimo
        
        Returns:
            Lista de produtos com estoque abaixo do threshold
        """
        try:
            # Query com filtro de estoque baixo
            result = (
                self.db.table(self.table_name)
                .select('*')
                .lt('stock_quantity', threshold)
                .eq('is_active', True)
                .execute()
            )
            return result.data if result.data else []
        except Exception as e:
            self.logger.error(f"Erro ao buscar produtos com estoque baixo: {str(e)}")
            return []
    
    def count_active(self) -> int:
        """
        Conta produtos ativos.
        
        Returns:
            Número de produtos ativos
        """
        try:
            return self.count(filters={'is_active': True})
        except Exception as e:
            self.logger.error(f"Erro ao contar produtos ativos: {str(e)}")
            return 0
    
    def count_out_of_stock(self) -> int:
        """
        Conta produtos sem estoque.
        
        Returns:
            Número de produtos sem estoque
        """
        try:
            return self.count(filters={'stock_quantity': 0, 'is_active': True})
        except Exception as e:
            self.logger.error(f"Erro ao contar produtos sem estoque: {str(e)}")
            return 0
    
    def get_total_inventory_value(self) -> float:
        """
        Calcula valor total do inventário (estoque * preço).
        
        Returns:
            Valor total do inventário
        """
        try:
            result = (
                self.db.table(self.table_name)
                .select('price, stock_quantity')
                .eq('is_active', True)
                .execute()
            )
            
            if result.data:
                total = sum(
                    p.get('price', 0) * p.get('stock_quantity', 0)
                    for p in result.data
                )
                return float(total)
            return 0.0
        except Exception as e:
            self.logger.error(f"Erro ao calcular valor do inventário: {str(e)}")
            return 0.0
