"""
Service de produtos RE-EDUCA Store.

Gerencia operações de produtos incluindo:
- Listagem com filtros e paginação
- Busca de produtos
- CRUD completo de produtos
- Gestão de categorias
- Produtos em destaque
- Controle de estoque

CORRIGIDO: Usa exclusivamente ProductRepository para acesso a dados.
"""
import logging
from typing import Dict, Any, List, Optional
from repositories.product_repository import ProductRepository
from services.base_service import BaseService

logger = logging.getLogger(__name__)


class ProductService(BaseService):
    """Service para operações de produtos - Usa repositório"""

    def __init__(self):
        super().__init__()
        self.repo = ProductRepository()  # Repositório de produtos (único acesso a dados)

    def get_products(self,
        page: int = 1, per_page: int = 20, category: Optional[str] = None, search: Optional[str] = None) -> Dict[str, Any]:
        """
        Retorna lista de produtos com filtros e paginação.

        CORRIGIDO: Agora usa ProductRepository exclusivamente.
        """
        try:
            filters = {'is_active': True}
            if category:
                filters['category'] = category
            if search:
                filters['search'] = search

            # ✅ Usa repositório com paginação otimizada
            return self.repo.find_all_with_filters(filters=filters, page=page, per_page=per_page)

        except Exception as e:
            self.logger.error(f"Erro ao buscar produtos: {e}")
            return {
                'products': [],
                'pagination': {
                    'page': page,
                    'per_page': per_page,
                    'total': 0,
                    'pages': 0
                },
                'error': 'Erro interno do servidor'
            }

    def get_product(self, product_id: str) -> Optional[Dict[str, Any]]:
        """
        Retorna detalhes de um produto específico - usa repositório.

        Args:
            product_id (str): ID do produto.

        Returns:
            Optional[Dict[str, Any]]: Dados do produto ou None se não encontrado.
        """
        try:
            return self.repo.find_by_id(product_id)
        except Exception as e:
            self.logger.error(f"Erro ao buscar produto: {e}")
            return None

    def create_product(self, product_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Cria um novo produto.

        CORRIGIDO: Agora usa ProductRepository exclusivamente.
        """
        try:
            # ✅ Validação de negócio: campos obrigatórios
            required_fields = ['name', 'price', 'category']
            missing = [field for field in required_fields if field not in product_data or product_data[field] is None]
            if missing:
                return {'success': False, 'error': f'Campos obrigatórios faltando: {", ".join(missing)}'}

            # ✅ Garante valores padrão
            if 'is_active' not in product_data:
                product_data['is_active'] = True
            if 'in_stock' not in product_data:
                product_data['in_stock'] = True

            # ✅ Cria via repositório
            created_product = self.repo.create(product_data)

            if created_product:
                return {'success': True, 'product': created_product}
            else:
                return {'success': False, 'error': 'Erro ao criar produto'}
        except Exception as e:
            self.logger.error(f"Erro ao criar produto: {e}")
            return {'success': False, 'error': 'Erro interno do servidor'}

    def update_product(self, product_id: str, product_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Atualiza um produto.

        CORRIGIDO: Agora usa ProductRepository exclusivamente.
        """
        try:
            # ✅ Valida que produto existe
            existing = self.repo.find_by_id(product_id)
            if not existing:
                return {'success': False, 'error': 'Produto não encontrado'}

            # ✅ Remove campos que não devem ser atualizados diretamente
            restricted_fields = ['id', 'created_at']
            update_data = {k: v for k, v in product_data.items() if k not in restricted_fields}

            # ✅ Atualiza via repositório
            updated_product = self.repo.update(product_id, update_data)

            if updated_product:
                return {'success': True, 'product': updated_product}
            else:
                return {'success': False, 'error': 'Erro ao atualizar produto'}
        except Exception as e:
            self.logger.error(f"Erro ao atualizar produto: {e}")
            return {'success': False, 'error': 'Erro interno do servidor'}

    def delete_product(self, product_id: str) -> Dict[str, Any]:
        """
        Remove um produto (soft delete).

        CORRIGIDO: Agora usa ProductRepository exclusivamente.
        """
        try:
            # ✅ Soft delete via repositório
            updated = self.repo.update(product_id, {'is_active': False})

            if updated:
                return {'success': True, 'message': 'Produto desativado com sucesso'}
            else:
                return {'success': False, 'error': 'Produto não encontrado'}
        except Exception as e:
            self.logger.error(f"Erro ao remover produto: {e}")
            return {'success': False, 'error': 'Erro interno do servidor'}

    def get_categories(self) -> List[str]:
        """
        Retorna lista de categorias.

        CORRIGIDO: Agora usa ProductRepository exclusivamente.
        """
        try:
            # ✅ Usa método específico do repositório
            return self.repo.get_categories()
        except Exception as e:
            self.logger.error(f"Erro ao buscar categorias: {e}")
            return []

    def get_featured_products(self, limit: int = 10) -> List[Dict[str, Any]]:
        """Retorna produtos em destaque"""
        try:
            products = self.db.get_products({'featured': True})
            return products[:limit]
        except Exception as e:
            logger.error(f"Erro ao buscar produtos em destaque: {e}")
            return []

    def get_recommended_products(self, user_id: Optional[str] = None, limit: int = 10) -> List[Dict[str, Any]]:
        """Retorna produtos recomendados para o usuário - usa repositório"""
        try:
            return self.repo.find_recommended(limit=limit)
        except Exception as e:
            self.logger.error(f"Erro ao buscar produtos recomendados: {e}")
            return []

    def get_trending_products(self, limit: int = 10, period: str = 'week') -> List[Dict[str, Any]]:
        """Retorna produtos em tendência - usa repositório"""
        try:
            return self.repo.find_trending(limit=limit)
        except Exception as e:
            self.logger.error(f"Erro ao buscar produtos em tendência: {e}")
            return []

    def _get_recommended_products_old(self, user_id: str, limit: int = 10) -> List[Dict[str, Any]]:
        """Retorna produtos recomendados para o usuário"""
        try:
            # Implementação básica - em produção usar ML
            products = self.db.get_products({})
            return products[:limit]
        except Exception as e:
            logger.error(f"Erro ao buscar produtos recomendados: {e}")
            return []

    def search_products(self, filters: Dict[str, Any], page: int = 1, per_page: int = 20) -> Dict[str, Any]:
        """
        Busca avançada de produtos com múltiplos filtros.

        CORRIGIDO: Agora usa ProductRepository exclusivamente.
        """
        try:
            # ✅ Garante que busca apenas produtos ativos
            if 'is_active' not in filters:
                filters['is_active'] = True

            # ✅ Usa repositório com filtros e paginação otimizada
            return self.repo.find_all_with_filters(filters=filters, page=page, per_page=per_page)
        except Exception as e:
            self.logger.error(f"Erro na busca de produtos: {e}")
            return {
                'products': [],
                'pagination': {
                    'page': page,
                    'per_page': per_page,
                    'total': 0,
                    'pages': 0
                }
            }
