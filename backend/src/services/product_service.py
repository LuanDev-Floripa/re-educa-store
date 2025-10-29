"""
Service de produtos RE-EDUCA Store - Supabase
"""
import logging
from typing import Dict, Any, List, Optional
from config.database import supabase_client

logger = logging.getLogger(__name__)

class ProductService:
    """Service para operações de produtos - Supabase"""
    
    def __init__(self):
        self.db = supabase_client
    
    def get_products(self, page: int = 1, per_page: int = 20, category: Optional[str] = None, search: Optional[str] = None) -> Dict[str, Any]:
        """Retorna lista de produtos"""
        try:
            filters = {}
            if category:
                filters['category'] = category
            if search:
                filters['search'] = search
            
            products = self.db.get_products(filters)
            
            return {
                'products': products,
                'pagination': {
                    'page': page,
                    'per_page': per_page,
                    'total': len(products),
                    'pages': (len(products) + per_page - 1) // per_page
                }
            }
                
        except Exception as e:
            logger.error(f"Erro ao buscar produtos: {e}")
            return {'error': 'Erro interno do servidor'}
    
    def get_product(self, product_id: str) -> Optional[Dict[str, Any]]:
        """Retorna detalhes de um produto"""
        try:
            return self.db.get_product_by_id(product_id)
        except Exception as e:
            logger.error(f"Erro ao buscar produto: {e}")
            return None
    
    def create_product(self, product_data: Dict[str, Any]) -> Dict[str, Any]:
        """Cria um novo produto"""
        try:
            result = self.db.create_product(product_data)
            if result and 'error' not in result:
                return {'success': True, 'product': result}
            else:
                return {'success': False, 'error': 'Erro ao criar produto'}
        except Exception as e:
            logger.error(f"Erro ao criar produto: {e}")
            return {'success': False, 'error': 'Erro interno do servidor'}
    
    def update_product(self, product_id: str, product_data: Dict[str, Any]) -> Dict[str, Any]:
        """Atualiza um produto"""
        try:
            result = self.db.update_product(product_id, product_data)
            if result and 'error' not in result:
                return {'success': True, 'product': result}
            else:
                return {'success': False, 'error': 'Erro ao atualizar produto'}
        except Exception as e:
            logger.error(f"Erro ao atualizar produto: {e}")
            return {'success': False, 'error': 'Erro interno do servidor'}
    
    def delete_product(self, product_id: str) -> Dict[str, Any]:
        """Remove um produto (soft delete)"""
        try:
            result = self.db.update_product(product_id, {'is_active': False})
            if result and 'error' not in result:
                return {'success': True}
            else:
                return {'success': False, 'error': 'Erro ao remover produto'}
        except Exception as e:
            logger.error(f"Erro ao remover produto: {e}")
            return {'success': False, 'error': 'Erro interno do servidor'}
    
    def get_categories(self) -> List[str]:
        """Retorna lista de categorias"""
        try:
            products = self.db.get_products({})
            categories = list(set(product.get('category') for product in products if product.get('category')))
            return categories
        except Exception as e:
            logger.error(f"Erro ao buscar categorias: {e}")
            return []
    
    def get_featured_products(self, limit: int = 10) -> List[Dict[str, Any]]:
        """Retorna produtos em destaque"""
        try:
            products = self.db.get_products({'featured': True})
            return products[:limit]
        except Exception as e:
            logger.error(f"Erro ao buscar produtos em destaque: {e}")
            return []
    
    def get_recommended_products(self, user_id: str, limit: int = 10) -> List[Dict[str, Any]]:
        """Retorna produtos recomendados para o usuário"""
        try:
            # Implementação básica - em produção usar ML
            products = self.db.get_products({})
            return products[:limit]
        except Exception as e:
            logger.error(f"Erro ao buscar produtos recomendados: {e}")
            return []
    
    def search_products(self, filters: Dict[str, Any], page: int = 1, per_page: int = 20) -> Dict[str, Any]:
        """Busca avançada de produtos com múltiplos filtros"""
        try:
            products = self.db.get_products(filters)
            
            return {
                'products': products,
                'pagination': {
                    'page': page,
                    'per_page': per_page,
                    'total': len(products),
                    'pages': (len(products) + per_page - 1) // per_page
                }
            }
        except Exception as e:
            logger.error(f"Erro na busca de produtos: {e}")
            return {
                'products': [],
                'pagination': {
                    'page': page,
                    'per_page': per_page,
                    'total': 0,
                    'pages': 0
                }
            }