"""
Serviço de Promoções e Cupons RE-EDUCA Store.

Gerencia promoções e cupons incluindo:
- Criação e validação de cupons
- Cálculo de descontos (percentual e fixo)
- Regras de aplicação (valor mínimo, limites)
- Controle de uso por usuário
- Datas de validade
- Produtos/categorias aplicáveis
"""
import logging
import secrets
import string
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
from config.database import supabase_client
from decimal import Decimal

logger = logging.getLogger(__name__)

class PromotionService:
    """Service para gestão de promoções e cupons."""
    
    def __init__(self):
        """Inicializa o serviço de promoções."""
        self.supabase = supabase_client
    
    def create_coupon(self, coupon_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Cria um novo cupom com validação.
        
        Args:
            coupon_data (Dict[str, Any]): Dados do cupom incluindo type, value, valid_until.
            
        Returns:
            Dict[str, Any]: Cupom criado ou erro.
        """
        try:
            # Gera código do cupom se não fornecido
            if not coupon_data.get('code'):
                coupon_data['code'] = self._generate_coupon_code()
            
            # Valida dados
            validation = self._validate_coupon_data(coupon_data)
            if not validation['valid']:
                return {'success': False, 'error': validation['error']}
            
            # Verifica se código já existe
            existing = self.supabase.table('coupons').select('id').eq('code', coupon_data['code']).execute()
            if existing.data:
                return {'success': False, 'error': 'Código do cupom já existe'}
            
            # Prepara dados
            coupon = {
                'code': coupon_data['code'].upper(),
                'name': coupon_data['name'],
                'description': coupon_data.get('description', ''),
                'type': coupon_data['type'],  # 'percentage' ou 'fixed'
                'value': coupon_data['value'],
                'min_order_value': coupon_data.get('min_order_value', 0),
                'max_discount': coupon_data.get('max_discount'),
                'usage_limit': coupon_data.get('usage_limit'),
                'usage_limit_per_user': coupon_data.get('usage_limit_per_user', 1),
                'valid_from': coupon_data.get('valid_from', datetime.now().isoformat()),
                'valid_until': coupon_data['valid_until'],
                'is_active': coupon_data.get('is_active', True),
                'applicable_products': coupon_data.get('applicable_products', []),
                'applicable_categories': coupon_data.get('applicable_categories', []),
                'created_at': datetime.now().isoformat(),
                'updated_at': datetime.now().isoformat()
            }
            
            # Salva cupom
            result = self.supabase.table('coupons').insert(coupon).execute()
            
            if result.data:
                return {
                    'success': True,
                    'coupon': result.data[0],
                    'message': 'Cupom criado com sucesso'
                }
            else:
                return {'success': False, 'error': 'Erro ao criar cupom'}
                
        except Exception as e:
            logger.error(f"Erro ao criar cupom: {str(e)}")
            return {'success': False, 'error': str(e)}
    
    def validate_coupon(self, code: str, user_id: str, order_value: float, 
                       product_ids: List[str] = None) -> Dict[str, Any]:
        """Valida um cupom para uso"""
        try:
            # Busca cupom
            coupon_result = self.supabase.table('coupons').select('*').eq('code', code.upper()).eq('is_active', True).execute()
            
            if not coupon_result.data:
                return {'success': False, 'error': 'Cupom não encontrado ou inativo'}
            
            coupon = coupon_result.data[0]
            
            # Verifica validade temporal
            now = datetime.now()
            valid_from = datetime.fromisoformat(coupon['valid_from'])
            valid_until = datetime.fromisoformat(coupon['valid_until'])
            
            if now < valid_from:
                return {'success': False, 'error': 'Cupom ainda não é válido'}
            
            if now > valid_until:
                return {'success': False, 'error': 'Cupom expirado'}
            
            # Verifica valor mínimo do pedido
            if order_value < coupon['min_order_value']:
                return {
                    'success': False, 
                    'error': f'Valor mínimo do pedido: R$ {coupon["min_order_value"]:.2f}'
                }
            
            # Verifica limite de uso geral
            if coupon['usage_limit']:
                usage_count = self.supabase.table('coupon_usage').select('id', count='exact').eq('coupon_id', coupon['id']).execute()
                if usage_count.count >= coupon['usage_limit']:
                    return {'success': False, 'error': 'Cupom esgotado'}
            
            # Verifica limite de uso por usuário
            user_usage_count = self.supabase.table('coupon_usage').select('id', count='exact').eq('coupon_id', coupon['id']).eq('user_id', user_id).execute()
            if user_usage_count.count >= coupon['usage_limit_per_user']:
                return {'success': False, 'error': 'Limite de uso por usuário atingido'}
            
            # Verifica produtos aplicáveis
            if coupon['applicable_products'] and product_ids:
                if not any(pid in coupon['applicable_products'] for pid in product_ids):
                    return {'success': False, 'error': 'Cupom não aplicável aos produtos selecionados'}
            
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
            return {'success': False, 'error': str(e)}
    
    def apply_coupon(self, code: str, user_id: str, order_id: str, order_value: float) -> Dict[str, Any]:
        """Aplica um cupom a um pedido"""
        try:
            # Valida cupom
            validation = self.validate_coupon(code, user_id, order_value)
            if not validation['success']:
                return validation
            
            coupon = validation['coupon']
            discount = validation['discount']
            
            # Registra uso do cupom
            usage_data = {
                'coupon_id': coupon['id'],
                'user_id': user_id,
                'order_id': order_id,
                'discount_amount': discount,
                'order_value': order_value,
                'used_at': datetime.now().isoformat()
            }
            
            self.supabase.table('coupon_usage').insert(usage_data).execute()
            
            return {
                'success': True,
                'coupon': coupon,
                'discount': discount,
                'final_value': order_value - discount,
                'message': 'Cupom aplicado com sucesso'
            }
            
        except Exception as e:
            logger.error(f"Erro ao aplicar cupom: {str(e)}")
            return {'success': False, 'error': str(e)}
    
    def get_coupons(self, is_active: bool = None, page: int = 1, limit: int = 20) -> Dict[str, Any]:
        """Lista cupons"""
        try:
            query = self.supabase.table('coupons').select('*')
            
            if is_active is not None:
                query = query.eq('is_active', is_active)
            
            # Paginação
            offset = (page - 1) * limit
            query = query.range(offset, offset + limit - 1).order('created_at', desc=True)
            
            result = query.execute()
            
            return {
                'success': True,
                'coupons': result.data,
                'page': page,
                'limit': limit
            }
            
        except Exception as e:
            logger.error(f"Erro ao buscar cupons: {str(e)}")
            return {'success': False, 'error': str(e)}
    
    def get_coupon_usage_stats(self, coupon_id: str) -> Dict[str, Any]:
        """Retorna estatísticas de uso de um cupom"""
        try:
            # Total de usos
            total_usage = self.supabase.table('coupon_usage').select('id', count='exact').eq('coupon_id', coupon_id).execute()
            
            # Valor total de desconto
            usage_data = self.supabase.table('coupon_usage').select('discount_amount').eq('coupon_id', coupon_id).execute()
            total_discount = sum(usage.get('discount_amount', 0) for usage in usage_data.data)
            
            # Usos por usuário
            user_usage = self.supabase.table('coupon_usage').select('user_id', count='exact').eq('coupon_id', coupon_id).execute()
            unique_users = len(set(usage.get('user_id') for usage in user_usage.data))
            
            return {
                'success': True,
                'stats': {
                    'total_usage': total_usage.count or 0,
                    'total_discount': total_discount,
                    'unique_users': unique_users,
                    'average_discount': total_discount / (total_usage.count or 1)
                }
            }
            
        except Exception as e:
            logger.error(f"Erro ao buscar estatísticas: {str(e)}")
            return {'success': False, 'error': str(e)}
    
    def create_promotion(self, promotion_data: Dict[str, Any]) -> Dict[str, Any]:
        """Cria uma promoção"""
        try:
            # Valida dados
            validation = self._validate_promotion_data(promotion_data)
            if not validation['valid']:
                return {'success': False, 'error': validation['error']}
            
            # Prepara dados
            promotion = {
                'name': promotion_data['name'],
                'description': promotion_data.get('description', ''),
                'type': promotion_data['type'],  # 'percentage', 'fixed', 'bogo'
                'value': promotion_data['value'],
                'min_order_value': promotion_data.get('min_order_value', 0),
                'max_discount': promotion_data.get('max_discount'),
                'valid_from': promotion_data.get('valid_from', datetime.now().isoformat()),
                'valid_until': promotion_data['valid_until'],
                'is_active': promotion_data.get('is_active', True),
                'applicable_products': promotion_data.get('applicable_products', []),
                'applicable_categories': promotion_data.get('applicable_categories', []),
                'priority': promotion_data.get('priority', 0),
                'created_at': datetime.now().isoformat(),
                'updated_at': datetime.now().isoformat()
            }
            
            # Salva promoção
            result = self.supabase.table('promotions').insert(promotion).execute()
            
            if result.data:
                return {
                    'success': True,
                    'promotion': result.data[0],
                    'message': 'Promoção criada com sucesso'
                }
            else:
                return {'success': False, 'error': 'Erro ao criar promoção'}
                
        except Exception as e:
            logger.error(f"Erro ao criar promoção: {str(e)}")
            return {'success': False, 'error': str(e)}
    
    def get_applicable_promotions(self, order_value: float, product_ids: List[str] = None) -> Dict[str, Any]:
        """Busca promoções aplicáveis"""
        try:
            now = datetime.now().isoformat()
            
            query = self.supabase.table('promotions').select('*').eq('is_active', True).gte('valid_from', now).lte('valid_until', now).gte('min_order_value', order_value)
            
            result = query.execute()
            
            applicable_promotions = []
            
            for promotion in result.data:
                # Verifica se aplica aos produtos
                if promotion['applicable_products'] and product_ids:
                    if not any(pid in promotion['applicable_products'] for pid in product_ids):
                        continue
                
                # Calcula desconto
                discount = self._calculate_discount(promotion, order_value)
                
                applicable_promotions.append({
                    'promotion': promotion,
                    'discount': discount,
                    'final_value': order_value - discount
                })
            
            # Ordena por prioridade
            applicable_promotions.sort(key=lambda x: x['promotion']['priority'], reverse=True)
            
            return {
                'success': True,
                'promotions': applicable_promotions
            }
            
        except Exception as e:
            logger.error(f"Erro ao buscar promoções: {str(e)}")
            return {'success': False, 'error': str(e)}
    
    def _generate_coupon_code(self, length: int = 8) -> str:
        """Gera código único para cupom"""
        characters = string.ascii_uppercase + string.digits
        return ''.join(secrets.choice(characters) for _ in range(length))
    
    def _validate_coupon_data(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Valida dados do cupom"""
        required_fields = ['name', 'type', 'value', 'valid_until']
        
        for field in required_fields:
            if not data.get(field):
                return {'valid': False, 'error': f'Campo {field} é obrigatório'}
        
        if data['type'] not in ['percentage', 'fixed']:
            return {'valid': False, 'error': 'Tipo deve ser percentage ou fixed'}
        
        if data['type'] == 'percentage' and (data['value'] < 0 or data['value'] > 100):
            return {'valid': False, 'error': 'Percentual deve estar entre 0 e 100'}
        
        if data['type'] == 'fixed' and data['value'] < 0:
            return {'valid': False, 'error': 'Valor fixo deve ser positivo'}
        
        return {'valid': True}
    
    def _validate_promotion_data(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Valida dados da promoção"""
        required_fields = ['name', 'type', 'value', 'valid_until']
        
        for field in required_fields:
            if not data.get(field):
                return {'valid': False, 'error': f'Campo {field} é obrigatório'}
        
        if data['type'] not in ['percentage', 'fixed', 'bogo']:
            return {'valid': False, 'error': 'Tipo deve ser percentage, fixed ou bogo'}
        
        return {'valid': True}
    
    def _calculate_discount(self, promotion_or_coupon: Dict[str, Any], order_value: float) -> float:
        """Calcula valor do desconto"""
        if promotion_or_coupon['type'] == 'percentage':
            discount = order_value * (promotion_or_coupon['value'] / 100)
        elif promotion_or_coupon['type'] == 'fixed':
            discount = promotion_or_coupon['value']
        else:  # bogo
            discount = 0  # Implementar lógica BOGO se necessário
        
        # Aplica desconto máximo se definido
        if promotion_or_coupon.get('max_discount'):
            discount = min(discount, promotion_or_coupon['max_discount'])
        
        # Não permite desconto maior que o valor do pedido
        return min(discount, order_value)