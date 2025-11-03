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
from datetime import datetime
from config.database import supabase_client
from decimal import Decimal
from repositories.coupon_repository import CouponRepository
from repositories.coupon_usage_repository import CouponUsageRepository

logger = logging.getLogger(__name__)


class PromotionService:
    """Service para gestão de promoções e cupons."""

    def __init__(self):
        """Inicializa o serviço de promoções."""
        self.supabase = supabase_client
        self.coupon_repo = CouponRepository()
        self.usage_repo = CouponUsageRepository()

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

            # ✅ CORRIGIDO: Usa CouponRepository
            if self.coupon_repo.code_exists(coupon_data['code']):
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

            # ✅ CORRIGIDO: Usa CouponRepository
            created_coupon = self.coupon_repo.create(coupon)

            if created_coupon:
                return {
                    'success': True,
                    'coupon': created_coupon,
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
            # ✅ CORRIGIDO: Usa CouponRepository
            coupon = self.coupon_repo.find_by_code(code, active_only=True)

            if not coupon:
                return {'success': False, 'error': 'Cupom não encontrado ou inativo'}

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

            # ✅ CORRIGIDO: Usa CouponUsageRepository
            # Verifica limite de uso geral
            if coupon['usage_limit']:
                usage_count = self.usage_repo.count_by_coupon(coupon['id'])
                if usage_count >= coupon['usage_limit']:
                    return {'success': False, 'error': 'Cupom esgotado'}

            # Verifica limite de uso por usuário
            user_usage_count = self.usage_repo.count_by_coupon_and_user(coupon['id'], user_id)
            if user_usage_count >= coupon['usage_limit_per_user']:
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

            # ✅ CORRIGIDO: Usa CouponUsageRepository
            self.usage_repo.record_usage(
                coupon_id=coupon['id'],
                user_id=user_id,
                order_id=order_id,
                discount_amount=discount
            )

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
            # ✅ CORRIGIDO: Usa CouponRepository
            if is_active is None:
                coupons = self.coupon_repo.find_all(
                    limit=limit,
                    offset=(page - 1) * limit,
                    order_by='created_at',
                    desc=True
                )
                total = self.coupon_repo.count()
            else:
                if is_active:
                    coupons = self.coupon_repo.find_active(limit=limit, offset=(page - 1) * limit)
                    total = self.coupon_repo.count(filters={'is_active': True})
                else:
                    coupons = self.coupon_repo.find_all(
                        filters={'is_active': False},
                        limit=limit,
                        offset=(page - 1) * limit,
                        order_by='created_at',
                        desc=True
                    )
                    total = self.coupon_repo.count(filters={'is_active': False})

            return {
                'success': True,
                'coupons': coupons,
                'page': page,
                'limit': limit,
                'total': total
            }

        except Exception as e:
            logger.error(f"Erro ao buscar cupons: {str(e)}")
            return {'success': False, 'error': str(e)}

    def get_coupon_usage_stats(self, coupon_id: str) -> Dict[str, Any]:
        """Retorna estatísticas de uso de um cupom"""
        try:
            # ✅ CORRIGIDO: Usa CouponUsageRepository
            stats = self.usage_repo.get_coupon_stats(coupon_id)
            total_usage = stats['total_usage']
            total_discount = stats['total_discount']
            unique_users = stats['unique_users']

            return {
                'success': True,
                'stats': {
                    'total_usage': total_usage,
                    'total_discount': total_discount,
                    'unique_users': unique_users,
                    'average_discount': total_discount / (total_usage or 1)
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

            # ✅ CORRIGIDO: Usa PromotionRepository
            from repositories.promotion_repository import PromotionRepository
            promotion_repo = PromotionRepository()
            created_promotion = promotion_repo.create(promotion)

            if created_promotion:
                return {
                    'success': True,
                    'promotion': created_promotion,
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

            # ✅ CORRIGIDO: Usa PromotionRepository
            from repositories.promotion_repository import PromotionRepository
            promotion_repo = PromotionRepository()
            promotions_list = promotion_repo.find_applicable(
                order_value=order_value,
                valid_from=now,
                valid_until=now,
                product_ids=product_ids
            )

            applicable_promotions = []

            for promotion in promotions_list:
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
