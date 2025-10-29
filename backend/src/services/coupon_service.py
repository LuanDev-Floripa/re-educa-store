"""
Serviço de Cupons e Promoções RE-EDUCA Store
"""
import os
import logging
import secrets
import string
from typing import Dict, Any, Optional, List
from datetime import datetime, timedelta
from config.database import supabase_client
from utils.helpers import generate_uuid

logger = logging.getLogger(__name__)

class CouponService:
    """Service para operações de cupons e promoções"""
    
    def __init__(self):
        self.db = supabase_client
    
    def generate_coupon_code(self, length: int = 8) -> str:
        """Gera código de cupom único"""
        while True:
            # Gera código alfanumérico
            code = ''.join(secrets.choices(string.ascii_uppercase + string.digits, k=length))
            
            # Verifica se já existe
            if hasattr(self.db, 'execute_query'):
                # SQLite
                result = self.db.execute_query(
                    'SELECT id FROM coupons WHERE code = ?',
                    (code,)
                )
            else:
                # Supabase
                result = self.db._make_request("GET", 'coupons').select('id').eq('code', code).execute()
                result = result.data
            
            if not result:
                return code
    
    def create_coupon(self, coupon_data: Dict[str, Any]) -> Dict[str, Any]:
        """Cria novo cupom"""
        try:
            # Gera código se não fornecido
            if not coupon_data.get('code'):
                coupon_data['code'] = self.generate_coupon_code()
            
            # Valida dados
            if not self._validate_coupon_data(coupon_data):
                return {'success': False, 'error': 'Dados do cupom inválidos'}
            
            # Prepara dados para inserção
            coupon = {
                'id': generate_uuid(),
                'code': coupon_data['code'].upper(),
                'name': coupon_data['name'],
                'description': coupon_data.get('description', ''),
                'type': coupon_data['type'],  # 'percentage' ou 'fixed'
                'value': coupon_data['value'],
                'min_order_value': coupon_data.get('min_order_value', 0),
                'max_discount': coupon_data.get('max_discount'),
                'usage_limit': coupon_data.get('usage_limit'),
                'usage_count': 0,
                'user_limit': coupon_data.get('user_limit', 1),
                'valid_from': coupon_data.get('valid_from', datetime.now().isoformat()),
                'valid_until': coupon_data['valid_until'],
                'active': True,
                'created_at': datetime.now().isoformat(),
                'updated_at': datetime.now().isoformat()
            }
            
            # Insere no banco
            if hasattr(self.db, 'execute_insert'):
                # SQLite
                self.db.execute_insert('''
                    INSERT INTO coupons 
                    (id, code, name, description, type, value, min_order_value, max_discount, 
                     usage_limit, usage_count, user_limit, valid_from, valid_until, active, 
                     created_at, updated_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ''', (
                    coupon['id'], coupon['code'], coupon['name'], coupon['description'],
                    coupon['type'], coupon['value'], coupon['min_order_value'], coupon['max_discount'],
                    coupon['usage_limit'], coupon['usage_count'], coupon['user_limit'],
                    coupon['valid_from'], coupon['valid_until'], coupon['active'],
                    coupon['created_at'], coupon['updated_at']
                ))
            else:
                # Supabase
                self.db._make_request("GET", 'coupons').insert(coupon).execute()
            
            return {
                'success': True,
                'coupon': coupon,
                'message': 'Cupom criado com sucesso'
            }
            
        except Exception as e:
            logger.error(f"Erro ao criar cupom: {str(e)}")
            return {'success': False, 'error': 'Erro interno do servidor'}
    
    def validate_coupon(self, code: str, user_id: str, order_value: float) -> Dict[str, Any]:
        """Valida cupom para uso"""
        try:
            # Busca cupom
            if hasattr(self.db, 'execute_query'):
                # SQLite
                result = self.db.execute_query(
                    'SELECT * FROM coupons WHERE code = ? AND active = 1',
                    (code.upper(),)
                )
            else:
                # Supabase
                result = self.db._make_request("GET", 'coupons').select('*').eq('code', code.upper()).eq('active', True).execute()
                result = result.data
            
            if not result:
                return {'success': False, 'error': 'Cupom não encontrado'}
            
            coupon = result[0]
            
            # Verifica se está dentro do período de validade
            now = datetime.now()
            valid_from = datetime.fromisoformat(coupon['valid_from'])
            valid_until = datetime.fromisoformat(coupon['valid_until'])
            
            if now < valid_from or now > valid_until:
                return {'success': False, 'error': 'Cupom fora do período de validade'}
            
            # Verifica valor mínimo do pedido
            if order_value < coupon['min_order_value']:
                return {
                    'success': False, 
                    'error': f'Valor mínimo do pedido: R$ {coupon["min_order_value"]:.2f}'
                }
            
            # Verifica limite de uso total
            if coupon['usage_limit'] and coupon['usage_count'] >= coupon['usage_limit']:
                return {'success': False, 'error': 'Cupom esgotado'}
            
            # Verifica limite de uso por usuário
            if hasattr(self.db, 'execute_query'):
                # SQLite
                user_usage = self.db.execute_query(
                    'SELECT COUNT(*) as count FROM coupon_usage WHERE coupon_id = ? AND user_id = ?',
                    (coupon['id'], user_id)
                )
            else:
                # Supabase
                user_usage = self.db._make_request("GET", 'coupon_usage').select('id').eq('coupon_id', coupon['id']).eq('user_id', user_id).execute()
                user_usage = [{'count': len(user_usage.data)}]
            
            if user_usage and user_usage[0]['count'] >= coupon['user_limit']:
                return {'success': False, 'error': 'Limite de uso por usuário atingido'}
            
            # Calcula desconto
            discount = self._calculate_discount(coupon, order_value)
            
            return {
                'success': True,
                'coupon': coupon,
                'discount': discount,
                'final_value': order_value - discount
            }
            
        except Exception as e:
            logger.error(f"Erro ao validar cupom: {str(e)}")
            return {'success': False, 'error': 'Erro interno do servidor'}
    
    def apply_coupon(self, code: str, user_id: str, order_id: str, order_value: float) -> Dict[str, Any]:
        """Aplica cupom a um pedido"""
        try:
            # Valida cupom
            validation = self.validate_coupon(code, user_id, order_value)
            if not validation['success']:
                return validation
            
            coupon = validation['coupon']
            discount = validation['discount']
            
            # Registra uso do cupom
            if hasattr(self.db, 'execute_insert'):
                # SQLite
                self.db.execute_insert('''
                    INSERT INTO coupon_usage 
                    (id, coupon_id, user_id, order_id, discount_value, used_at)
                    VALUES (?, ?, ?, ?, ?, ?)
                ''', (
                    generate_uuid(), coupon['id'], user_id, order_id, 
                    discount, datetime.now().isoformat()
                ))
                
                # Atualiza contador de uso
                self.db.execute_update(
                    'UPDATE coupons SET usage_count = usage_count + 1 WHERE id = ?',
                    (coupon['id'],)
                )
            else:
                # Supabase
                self.db._make_request("GET", 'coupon_usage').insert({
                    'id': generate_uuid(),
                    'coupon_id': coupon['id'],
                    'user_id': user_id,
                    'order_id': order_id,
                    'discount_value': discount,
                    'used_at': datetime.now().isoformat()
                }).execute()
                
                # Atualiza contador de uso
                self.db._make_request("GET", 'coupons').update({
                    'usage_count': coupon['usage_count'] + 1
                }).eq('id', coupon['id']).execute()
            
            return {
                'success': True,
                'coupon': coupon,
                'discount': discount,
                'final_value': order_value - discount,
                'message': 'Cupom aplicado com sucesso'
            }
            
        except Exception as e:
            logger.error(f"Erro ao aplicar cupom: {str(e)}")
            return {'success': False, 'error': 'Erro interno do servidor'}
    
    def get_coupons(self, filters: Dict[str, Any] = None) -> Dict[str, Any]:
        """Lista cupons com filtros"""
        try:
            query = "SELECT * FROM coupons WHERE 1=1"
            params = []
            
            if filters:
                if filters.get('active') is not None:
                    query += " AND active = ?"
                    params.append(filters['active'])
                
                if filters.get('type'):
                    query += " AND type = ?"
                    params.append(filters['type'])
                
                if filters.get('search'):
                    query += " AND (name LIKE ? OR code LIKE ?)"
                    search_term = f"%{filters['search']}%"
                    params.extend([search_term, search_term])
            
            query += " ORDER BY created_at DESC"
            
            if hasattr(self.db, 'execute_query'):
                # SQLite
                result = self.db.execute_query(query, tuple(params))
            else:
                # Supabase - implementar filtros
                result = self.db._make_request("GET", 'coupons').select('*').order('created_at', desc=True).execute()
                result = result.data
            
            return {
                'success': True,
                'coupons': result
            }
            
        except Exception as e:
            logger.error(f"Erro ao listar cupons: {str(e)}")
            return {'success': False, 'error': 'Erro interno do servidor'}
    
    def update_coupon(self, coupon_id: str, update_data: Dict[str, Any]) -> Dict[str, Any]:
        """Atualiza cupom"""
        try:
            # Remove campos que não devem ser atualizados
            update_data.pop('id', None)
            update_data.pop('created_at', None)
            update_data['updated_at'] = datetime.now().isoformat()
            
            # Atualiza no banco
            if hasattr(self.db, 'execute_update'):
                # SQLite
                set_clause = ', '.join([f"{key} = ?" for key in update_data.keys()])
                query = f"UPDATE coupons SET {set_clause} WHERE id = ?"
                params = list(update_data.values()) + [coupon_id]
                
                rows_affected = self.db.execute_update(query, tuple(params))
            else:
                # Supabase
                result = self.db._make_request("GET", 'coupons').update(update_data).eq('id', coupon_id).execute()
                rows_affected = len(result.data)
            
            if rows_affected > 0:
                return {'success': True, 'message': 'Cupom atualizado com sucesso'}
            else:
                return {'success': False, 'error': 'Cupom não encontrado'}
                
        except Exception as e:
            logger.error(f"Erro ao atualizar cupom: {str(e)}")
            return {'success': False, 'error': 'Erro interno do servidor'}
    
    def delete_coupon(self, coupon_id: str) -> Dict[str, Any]:
        """Deleta cupom (soft delete)"""
        try:
            # Soft delete - marca como inativo
            if hasattr(self.db, 'execute_update'):
                # SQLite
                rows_affected = self.db.execute_update(
                    'UPDATE coupons SET active = 0, updated_at = ? WHERE id = ?',
                    (datetime.now().isoformat(), coupon_id)
                )
            else:
                # Supabase
                result = self.db._make_request("GET", 'coupons').update({
                    'active': False,
                    'updated_at': datetime.now().isoformat()
                }).eq('id', coupon_id).execute()
                rows_affected = len(result.data)
            
            if rows_affected > 0:
                return {'success': True, 'message': 'Cupom removido com sucesso'}
            else:
                return {'success': False, 'error': 'Cupom não encontrado'}
                
        except Exception as e:
            logger.error(f"Erro ao deletar cupom: {str(e)}")
            return {'success': False, 'error': 'Erro interno do servidor'}
    
    def get_coupon_analytics(self, coupon_id: str = None) -> Dict[str, Any]:
        """Retorna analytics de cupons"""
        try:
            if coupon_id:
                # Analytics de um cupom específico
                if hasattr(self.db, 'execute_query'):
                    # SQLite
                    usage_stats = self.db.execute_query('''
                        SELECT 
                            COUNT(*) as total_usage,
                            SUM(discount_value) as total_discount,
                            AVG(discount_value) as avg_discount
                        FROM coupon_usage 
                        WHERE coupon_id = ?
                    ''', (coupon_id,))
                else:
                    # Supabase
                    usage_result = self.db._make_request("GET", 'coupon_usage').select('discount_value').eq('coupon_id', coupon_id).execute()
                    usage_data = usage_result.data
                    
                    usage_stats = [{
                        'total_usage': len(usage_data),
                        'total_discount': sum(item['discount_value'] for item in usage_data),
                        'avg_discount': sum(item['discount_value'] for item in usage_data) / len(usage_data) if usage_data else 0
                    }]
            else:
                # Analytics gerais
                if hasattr(self.db, 'execute_query'):
                    # SQLite
                    usage_stats = self.db.execute_query('''
                        SELECT 
                            COUNT(*) as total_usage,
                            SUM(discount_value) as total_discount,
                            AVG(discount_value) as avg_discount
                        FROM coupon_usage
                    ''')
                else:
                    # Supabase
                    usage_result = self.db._make_request("GET", 'coupon_usage').select('discount_value').execute()
                    usage_data = usage_result.data
                    
                    usage_stats = [{
                        'total_usage': len(usage_data),
                        'total_discount': sum(item['discount_value'] for item in usage_data),
                        'avg_discount': sum(item['discount_value'] for item in usage_data) / len(usage_data) if usage_data else 0
                    }]
            
            return {
                'success': True,
                'analytics': usage_stats[0] if usage_stats else {
                    'total_usage': 0,
                    'total_discount': 0,
                    'avg_discount': 0
                }
            }
            
        except Exception as e:
            logger.error(f"Erro ao buscar analytics de cupons: {str(e)}")
            return {'success': False, 'error': 'Erro interno do servidor'}
    
    def _validate_coupon_data(self, data: Dict[str, Any]) -> bool:
        """Valida dados do cupom"""
        required_fields = ['name', 'type', 'value', 'valid_until']
        
        for field in required_fields:
            if field not in data:
                return False
        
        if data['type'] not in ['percentage', 'fixed']:
            return False
        
        if data['type'] == 'percentage' and (data['value'] <= 0 or data['value'] > 100):
            return False
        
        if data['type'] == 'fixed' and data['value'] <= 0:
            return False
        
        return True
    
    def _calculate_discount(self, coupon: Dict[str, Any], order_value: float) -> float:
        """Calcula valor do desconto"""
        if coupon['type'] == 'percentage':
            discount = order_value * (coupon['value'] / 100)
        else:  # fixed
            discount = coupon['value']
        
        # Aplica desconto máximo se definido
        if coupon.get('max_discount') and discount > coupon['max_discount']:
            discount = coupon['max_discount']
        
        # Não pode ser maior que o valor do pedido
        return min(discount, order_value)