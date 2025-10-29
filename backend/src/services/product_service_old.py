"""
Service de produtos RE-EDUCA Store - Adaptado para SQLite
"""
import logging
import sqlite3
from typing import Dict, Any, List, Optional
from datetime import datetime
from config.database import supabase_client
from utils.helpers import generate_uuid

logger = logging.getLogger(__name__)

class ProductService:
    """Service para operações de produtos - SQLite"""
    
    def __init__(self):
        self.db = supabase_client
        # Se for SQLite, pega o caminho do banco
        if hasattr(self.db, 'db_path'):
            self.db_path = self.db.db_path
        else:
            # Fallback para Supabase
            self.db_path = None
    
    def search_products(self, filters: Dict[str, Any], page: int = 1, per_page: int = 20) -> Dict[str, Any]:
        """Busca avançada de produtos com múltiplos filtros"""
        try:
            # Se for SQLite
            if self.db_path:
                conn = sqlite3.connect(self.db_path)
                conn.row_factory = sqlite3.Row
                cursor = conn.cursor()
                
                # Query base
                query = "SELECT * FROM products WHERE is_active = 1"
                params = []
                
                # Aplicar filtros
                if filters.get('query'):
                    query += " AND (name LIKE ? OR description LIKE ?)"
                    search_term = f"%{filters['query']}%"
                    params.extend([search_term, search_term])
                
                if filters.get('category'):
                    query += " AND category = ?"
                    params.append(filters['category'])
                
                if filters.get('min_price') is not None:
                    query += " AND price >= ?"
                    params.append(filters['min_price'])
                
                if filters.get('max_price') is not None:
                    query += " AND price <= ?"
                    params.append(filters['max_price'])
                
                if filters.get('in_stock'):
                    query += " AND stock_quantity > 0"
                
                if filters.get('featured'):
                    query += " AND featured = 1"
                
                # Contar total
                count_query = query.replace("SELECT *", "SELECT COUNT(*)")
                cursor.execute(count_query, params)
                total = cursor.fetchone()[0]
                
                # Ordenação
                sort_by = filters.get('sort_by', 'created_at')
                if sort_by == 'price_asc':
                    query += " ORDER BY price ASC"
                elif sort_by == 'price_desc':
                    query += " ORDER BY price DESC"
                elif sort_by == 'name':
                    query += " ORDER BY name ASC"
                else:
                    query += " ORDER BY created_at DESC"
                
                # Paginação
                query += " LIMIT ? OFFSET ?"
                offset = (page - 1) * per_page
                params.extend([per_page, offset])
                
                cursor.execute(query, params)
                rows = cursor.fetchall()
                
                products = [dict(row) for row in rows]
                
                conn.close()
                
                return {
                    'products': products,
                    'filters': filters,
                    'pagination': {
                        'page': page,
                        'per_page': per_page,
                        'total': total,
                        'pages': (total + per_page - 1) // per_page if total > 0 else 0
                    }
                }
            else:
                # Fallback para Supabase
                query = self.db._make_request("GET", 'products').select('*').eq('is_active', True)
                
                if filters.get('query'):
                    query = query.or_(f'name.ilike.%{filters["query"]}%,description.ilike.%{filters["query"]}%')
                
                if filters.get('category'):
                    query = query.eq('category', filters['category'])
                
                if filters.get('min_price') is not None:
                    query = query.gte('price', filters['min_price'])
                
                if filters.get('max_price') is not None:
                    query = query.lte('price', filters['max_price'])
                
                if filters.get('in_stock'):
                    query = query.gt('stock_quantity', 0)
                
                if filters.get('featured'):
                    query = query.eq('featured', True)
                
                # Ordenação
                sort_by = filters.get('sort_by', 'created_at')
                if sort_by == 'price_asc':
                    query = query.order('price', desc=False)
                elif sort_by == 'price_desc':
                    query = query.order('price', desc=True)
                elif sort_by == 'name':
                    query = query.order('name', desc=False)
                else:
                    query = query.order('created_at', desc=True)
                
                result = query.execute()
                
                if result.data:
                    # Paginação manual
                    start = (page - 1) * per_page
                    end = start + per_page
                    paginated_data = result.data[start:end]
                    
                    return {
                        'products': paginated_data,
                        'filters': filters,
                        'pagination': {
                            'page': page,
                            'per_page': per_page,
                            'total': len(result.data),
                            'pages': (len(result.data) + per_page - 1) // per_page if len(result.data) > 0 else 0
                        }
                    }
                else:
                    return {
                        'products': [],
                        'filters': filters,
                        'pagination': {
                            'page': page,
                            'per_page': per_page,
                            'total': 0,
                            'pages': 0
                        }
                    }
        except Exception as e:
            logger.error(f"Erro ao buscar produtos: {str(e)}")
            return {
                'products': [],
                'filters': filters,
                'pagination': {
                    'page': page,
                    'per_page': per_page,
                    'total': 0,
                    'pages': 0
                }
            }
    
    def get_products(self, page: int = 1, per_page: int = 20, category: Optional[str] = None, search: Optional[str] = None) -> Dict[str, Any]:
        """Retorna lista de produtos"""
        try:
            # Usar Supabase
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
            if self.db_path:
                conn = sqlite3.connect(self.db_path)
                conn.row_factory = sqlite3.Row
                cursor = conn.cursor()
                
                cursor.execute("SELECT * FROM products WHERE id = ? AND is_active = 1", (product_id,))
                row = cursor.fetchone()
                
                conn.close()
                
                if row:
                    return dict(row)
                return None
            else:
                result = self.db._make_request("GET", 'products').select('*').eq('id', product_id).execute()
                
                if result.data:
                    return result.data[0]
                return None
            
        except Exception as e:
            logger.error(f"Erro ao buscar produto: {str(e)}")
            return None
    
    def create_product(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Cria novo produto"""
        try:
            if self.db_path:
                conn = sqlite3.connect(self.db_path)
                cursor = conn.cursor()
                
                product_id = generate_uuid()
                now = datetime.now().isoformat()
                
                cursor.execute("""
                    INSERT INTO products (id, name, description, price, category, image_url, stock_quantity, is_active, created_at, updated_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    product_id,
                    data['name'],
                    data.get('description', ''),
                    data['price'],
                    data.get('category', 'other'),
                    data.get('image_url', ''),
                    data.get('stock_quantity', 0),
                    1,  # is_active = True
                    now,
                    now
                ))
                
                conn.commit()
                conn.close()
                
                # Retornar o produto criado
                return {'success': True, 'product': self.get_product(product_id)}
            else:
                product_data = {
                    'id': generate_uuid(),
                    'name': data['name'],
                    'description': data.get('description', ''),
                    'price': data['price'],
                    'category': data.get('category', 'other'),
                    'status': data.get('status', 'active'),
                    'stock': data.get('stock', 0),
                    'images': data.get('images', []),
                    'created_at': datetime.now().isoformat(),
                    'updated_at': datetime.now().isoformat()
                }
                
                result = self.db._make_request("GET", 'products').insert(product_data).execute()
                
                if result.data:
                    return {'success': True, 'product': result.data[0]}
                else:
                    return {'success': False, 'error': 'Erro ao criar produto'}
                
        except Exception as e:
            logger.error(f"Erro ao criar produto: {str(e)}")
            return {'success': False, 'error': 'Erro interno do servidor'}
    
    def update_product(self, product_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """Atualiza produto"""
        try:
            if self.db_path:
                conn = sqlite3.connect(self.db_path)
                cursor = conn.cursor()
                
                # Verificar se produto existe
                cursor.execute("SELECT id FROM products WHERE id = ?", (product_id,))
                if not cursor.fetchone():
                    conn.close()
                    return {'success': False, 'error': 'Produto não encontrado'}
                
                # Preparar campos para update
                fields = []
                params = []
                
                for key, value in data.items():
                    if key in ['name', 'description', 'price', 'category', 'image_url', 'stock_quantity']:
                        fields.append(f"{key} = ?")
                        params.append(value)
                
                if fields:
                    fields.append("updated_at = ?")
                    params.append(datetime.now().isoformat())
                    params.append(product_id)
                    
                    query = f"UPDATE products SET {', '.join(fields)} WHERE id = ?"
                    cursor.execute(query, params)
                    conn.commit()
                
                conn.close()
                
                return {'success': True, 'product': self.get_product(product_id)}
            else:
                data['updated_at'] = datetime.now().isoformat()
                
                result = self.db._make_request("GET", 'products').update(data).eq('id', product_id).execute()
                
                if result.data:
                    return {'success': True, 'product': result.data[0]}
                else:
                    return {'success': False, 'error': 'Produto não encontrado'}
                
        except Exception as e:
            logger.error(f"Erro ao atualizar produto: {str(e)}")
            return {'success': False, 'error': 'Erro interno do servidor'}
    
    def delete_product(self, product_id: str) -> Dict[str, Any]:
        """Remove produto (soft delete)"""
        try:
            if self.db_path:
                conn = sqlite3.connect(self.db_path)
                cursor = conn.cursor()
                
                cursor.execute("""
                    UPDATE products 
                    SET is_active = 0, updated_at = ? 
                    WHERE id = ?
                """, (datetime.now().isoformat(), product_id))
                
                if cursor.rowcount > 0:
                    conn.commit()
                    conn.close()
                    return {'success': True}
                else:
                    conn.close()
                    return {'success': False, 'error': 'Produto não encontrado'}
            else:
                result = self.db._make_request("GET", 'products').update({
                    'status': 'archived',
                    'updated_at': datetime.now().isoformat()
                }).eq('id', product_id).execute()
                
                if result.data:
                    return {'success': True}
                else:
                    return {'success': False, 'error': 'Produto não encontrado'}
                
        except Exception as e:
            logger.error(f"Erro ao remover produto: {str(e)}")
            return {'success': False, 'error': 'Erro interno do servidor'}
    
    def get_categories(self) -> List[Dict[str, Any]]:
        """Retorna categorias de produtos"""
        try:
            if self.db_path:
                conn = sqlite3.connect(self.db_path)
                cursor = conn.cursor()
                
                cursor.execute("SELECT DISTINCT category FROM products WHERE is_active = 1 AND category IS NOT NULL")
                rows = cursor.fetchall()
                
                categories = [{'id': row[0], 'name': row[0].title()} for row in rows]
                
                conn.close()
                return categories
            else:
                result = self.db._make_request("GET", 'products').select('category').execute()
                
                categories = list(set(item['category'] for item in result.data if item.get('category')))
                
                return [{'id': cat, 'name': cat.title()} for cat in categories]
            
        except Exception as e:
            logger.error(f"Erro ao buscar categorias: {str(e)}")
            return []
    
    def get_featured_products(self) -> List[Dict[str, Any]]:
        """Retorna produtos em destaque"""
        try:
            if self.db_path:
                conn = sqlite3.connect(self.db_path)
                conn.row_factory = sqlite3.Row
                cursor = conn.cursor()
                
                # Como não temos campo 'featured', vamos retornar os mais recentes
                cursor.execute("""
                    SELECT * FROM products 
                    WHERE is_active = 1 
                    ORDER BY created_at DESC 
                    LIMIT 10
                """)
                
                rows = cursor.fetchall()
                products = [dict(row) for row in rows]
                
                conn.close()
                return products
            else:
                result = self.db._make_request("GET", 'products')\
                    .select('*')\
                    .eq('status', 'active')\
                    .eq('featured', True)\
                    .order('created_at', desc=True)\
                    .limit(10)\
                    .execute()
                
                return result.data or []
            
        except Exception as e:
            logger.error(f"Erro ao buscar produtos em destaque: {str(e)}")
            return []
    
    def get_recommended_products(self, user_id: str) -> List[Dict[str, Any]]:
        """Retorna produtos recomendados para o usuário"""
        try:
            if self.db_path:
                conn = sqlite3.connect(self.db_path)
                conn.row_factory = sqlite3.Row
                cursor = conn.cursor()
                
                # Implementação básica - em produção usar ML
                cursor.execute("""
                    SELECT * FROM products 
                    WHERE is_active = 1 
                    ORDER BY created_at DESC 
                    LIMIT 10
                """)
                
                rows = cursor.fetchall()
                products = [dict(row) for row in rows]
                
                conn.close()
                return products
            else:
                # Implementação básica - em produção usar ML
                result = self.db._make_request("GET", 'products')\
                    .select('*')\
                    .eq('status', 'active')\
                    .order('created_at', desc=True)\
                    .limit(10)\
                    .execute()
                
                return result.data or []
            
        except Exception as e:
            logger.error(f"Erro ao buscar produtos recomendados: {str(e)}")
            return []
    
    def get_product_reviews(self, product_id: str, page: int = 1, per_page: int = 10) -> Dict[str, Any]:
        """Retorna avaliações de um produto"""
        try:
            if self.db_path:
                conn = sqlite3.connect(self.db_path)
                conn.row_factory = sqlite3.Row
                cursor = conn.cursor()
                
                # Verificar se tabela de reviews existe
                cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='product_reviews'")
                if not cursor.fetchone():
                    conn.close()
                    return {
                        'reviews': [],
                        'pagination': {
                            'page': page,
                            'per_page': per_page,
                            'total': 0,
                            'pages': 0
                        }
                    }
                
                # Contar total
                cursor.execute("SELECT COUNT(*) FROM product_reviews WHERE product_id = ?", (product_id,))
                total = cursor.fetchone()[0]
                
                # Query com paginação
                offset = (page - 1) * per_page
                cursor.execute("""
                    SELECT * FROM product_reviews 
                    WHERE product_id = ? 
                    ORDER BY created_at DESC 
                    LIMIT ? OFFSET ?
                """, (product_id, per_page, offset))
                
                rows = cursor.fetchall()
                reviews = [dict(row) for row in rows]
                
                conn.close()
                
                return {
                    'reviews': reviews,
                    'pagination': {
                        'page': page,
                        'per_page': per_page,
                        'total': total,
                        'pages': (total + per_page - 1) // per_page
                    }
                }
            else:
                result = self.db._make_request("GET", 'product_reviews')\
                    .select('*, users(name, avatar)')\
                    .eq('product_id', product_id)\
                    .eq('status', 'approved')\
                    .order('created_at', desc=True)\
                    .execute()
                
                if result.data:
                    # Paginação manual
                    start = (page - 1) * per_page
                    end = start + per_page
                    paginated_data = result.data[start:end]
                    
                    return {
                        'reviews': paginated_data,
                        'pagination': {
                            'page': page,
                            'per_page': per_page,
                            'total': len(result.data),
                            'pages': (len(result.data) + per_page - 1) // per_page
                        }
                    }
                else:
                    return {
                        'reviews': [],
                        'pagination': {
                            'page': page,
                            'per_page': per_page,
                            'total': 0,
                            'pages': 0
                        }
                    }
                
        except Exception as e:
            logger.error(f"Erro ao buscar avaliações: {str(e)}")
            return {'error': 'Erro interno do servidor'}
    
    def create_review(self, product_id: str, user_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """Cria avaliação de produto"""
        try:
            if self.db_path:
                conn = sqlite3.connect(self.db_path)
                cursor = conn.cursor()
                
                # Verificar se tabela de reviews existe
                cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='product_reviews'")
                if not cursor.fetchone():
                    conn.close()
                    return {'success': False, 'error': 'Sistema de avaliações não implementado'}
                
                review_id = generate_uuid()
                now = datetime.now().isoformat()
                
                cursor.execute("""
                    INSERT INTO product_reviews (id, product_id, user_id, rating, comment, status, created_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                """, (
                    review_id,
                    product_id,
                    user_id,
                    data['rating'],
                    data['comment'],
                    'pending',  # Aguarda aprovação
                    now
                ))
                
                conn.commit()
                conn.close()
                
                return {'success': True, 'review': {'id': review_id}}
            else:
                review_data = {
                    'id': generate_uuid(),
                    'product_id': product_id,
                    'user_id': user_id,
                    'rating': data['rating'],
                    'comment': data['comment'],
                    'status': 'pending',  # Aguarda aprovação
                    'created_at': datetime.now().isoformat()
                }
                
                result = self.db._make_request("GET", 'product_reviews').insert(review_data).execute()
                
                if result.data:
                    return {'success': True, 'review': result.data[0]}
                else:
                    return {'success': False, 'error': 'Erro ao criar avaliação'}
                
        except Exception as e:
            logger.error(f"Erro ao criar avaliação: {str(e)}")
            return {'success': False, 'error': 'Erro interno do servidor'}