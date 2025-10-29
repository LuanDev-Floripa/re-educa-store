"""
Service de produtos RE-EDUCA Store - Adaptado para SQLite
"""
import logging
import sqlite3
from typing import Dict, Any, List, Optional
from datetime import datetime
from config.database import get_sqlite_connection
from utils.helpers import generate_uuid

logger = logging.getLogger(__name__)

class ProductService:
    """Service para operações de produtos - SQLite"""
    
    def __init__(self):
        self.db_path = get_sqlite_connection()
    
    def get_products(self, page: int = 1, per_page: int = 20, category: Optional[str] = None, search: Optional[str] = None) -> Dict[str, Any]:
        """Retorna lista de produtos"""
        try:
            conn = sqlite3.connect(self.db_path)
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            
            # Query base
            query = "SELECT * FROM products WHERE is_active = 1"
            params = []
            
            if category:
                query += " AND category = ?"
                params.append(category)
            
            if search:
                query += " AND name LIKE ?"
                params.append(f'%{search}%')
            
            # Contar total
            count_query = query.replace("SELECT *", "SELECT COUNT(*)")
            cursor.execute(count_query, params)
            total = cursor.fetchone()[0]
            
            # Query com paginação
            query += " ORDER BY created_at DESC LIMIT ? OFFSET ?"
            offset = (page - 1) * per_page
            params.extend([per_page, offset])
            
            cursor.execute(query, params)
            rows = cursor.fetchall()
            
            products = [dict(row) for row in rows]
            
            conn.close()
            
            return {
                'products': products,
                'pagination': {
                    'page': page,
                    'per_page': per_page,
                    'total': total,
                    'pages': (total + per_page - 1) // per_page
                }
            }
                
        except Exception as e:
            logger.error(f"Erro ao buscar produtos: {str(e)}")
            return {'error': 'Erro interno do servidor'}
    
    def get_product(self, product_id: str) -> Optional[Dict[str, Any]]:
        """Retorna detalhes de um produto"""
        try:
            conn = sqlite3.connect(self.db_path)
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            
            cursor.execute("SELECT * FROM products WHERE id = ? AND is_active = 1", (product_id,))
            row = cursor.fetchone()
            
            conn.close()
            
            if row:
                return dict(row)
            return None
            
        except Exception as e:
            logger.error(f"Erro ao buscar produto: {str(e)}")
            return None
    
    def create_product(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Cria novo produto"""
        try:
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
                
        except Exception as e:
            logger.error(f"Erro ao criar produto: {str(e)}")
            return {'success': False, 'error': 'Erro interno do servidor'}
    
    def update_product(self, product_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """Atualiza produto"""
        try:
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
                
        except Exception as e:
            logger.error(f"Erro ao atualizar produto: {str(e)}")
            return {'success': False, 'error': 'Erro interno do servidor'}
    
    def delete_product(self, product_id: str) -> Dict[str, Any]:
        """Remove produto (soft delete)"""
        try:
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
                
        except Exception as e:
            logger.error(f"Erro ao remover produto: {str(e)}")
            return {'success': False, 'error': 'Erro interno do servidor'}
    
    def get_categories(self) -> List[Dict[str, Any]]:
        """Retorna categorias de produtos"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute("SELECT DISTINCT category FROM products WHERE is_active = 1 AND category IS NOT NULL")
            rows = cursor.fetchall()
            
            categories = [{'id': row[0], 'name': row[0].title()} for row in rows]
            
            conn.close()
            return categories
            
        except Exception as e:
            logger.error(f"Erro ao buscar categorias: {str(e)}")
            return []
    
    def get_featured_products(self) -> List[Dict[str, Any]]:
        """Retorna produtos em destaque"""
        try:
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
            
        except Exception as e:
            logger.error(f"Erro ao buscar produtos em destaque: {str(e)}")
            return []
    
    def get_recommended_products(self, user_id: str) -> List[Dict[str, Any]]:
        """Retorna produtos recomendados para o usuário"""
        try:
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
            
        except Exception as e:
            logger.error(f"Erro ao buscar produtos recomendados: {str(e)}")
            return []
    
    def get_product_reviews(self, product_id: str, page: int = 1, per_page: int = 10) -> Dict[str, Any]:
        """Retorna avaliações de um produto"""
        try:
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
                
        except Exception as e:
            logger.error(f"Erro ao buscar avaliações: {str(e)}")
            return {'error': 'Erro interno do servidor'}
    
    def create_review(self, product_id: str, user_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """Cria avaliação de produto"""
        try:
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
                
        except Exception as e:
            logger.error(f"Erro ao criar avaliação: {str(e)}")
            return {'success': False, 'error': 'Erro interno do servidor'}