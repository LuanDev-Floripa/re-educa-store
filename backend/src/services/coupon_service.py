"""
Serviço de Cupons e Promoções RE-EDUCA Store.

Gerencia cupons de desconto incluindo:
- Criação e geração de códigos únicos
- Validação de cupons (regras, datas, limites)
- Aplicação de descontos (percentual ou valor fixo)
- Controle de uso e limites por usuário
- Rastreamento de conversões
"""
import os
import logging
import secrets
import string
from typing import Dict, Any, Optional, List
from datetime import datetime
from repositories.coupon_repository import CouponRepository
from repositories.coupon_usage_repository import CouponUsageRepository
from services.base_service import BaseService
from utils.helpers import generate_uuid


class CouponService(BaseService):
    """
    Service para operações de cupons e promoções.

    CORRIGIDO: Usa repositórios para acesso a dados.
    """

    def __init__(self):
        """Inicializa o serviço de cupons."""
        super().__init__()
        self.repo = CouponRepository()
        self.usage_repo = CouponUsageRepository()

    def get_coupon_by_id(self, coupon_id: str) -> Optional[Dict[str, Any]]:
        """
        Busca cupom por ID.

        CORRIGIDO: Usa CouponRepository.

        Args:
            coupon_id: ID do cupom

        Returns:
            Dict com dados do cupom ou None
        """
        try:
            return self.repo.find_by_id(coupon_id)
        except Exception as e:
            self.logger.error(f"Erro ao buscar cupom por ID: {str(e)}")
            return None

    def get_coupon_by_code(self, code: str) -> Optional[Dict[str, Any]]:
        """
        Busca cupom por código.

        CORRIGIDO: Usa CouponRepository.

        Args:
            code: Código do cupom

        Returns:
            Dict com dados do cupom ou None
        """
        try:
            return self.repo.find_by_code(code)
        except Exception as e:
            self.logger.error(f"Erro ao buscar cupom por código: {str(e)}")
            return None

    def generate_coupon_code(self, length: int = 8) -> str:
        """
        Gera código de cupom único alfanumérico.

        CORRIGIDO: Usa CouponRepository para verificar existência.

        Args:
            length (int): Tamanho do código (padrão: 8).

        Returns:
            str: Código único gerado.
        """
        while True:
            # Gera código alfanumérico
            code = ''.join(secrets.choices(string.ascii_uppercase + string.digits, k=length))

            # ✅ Verifica se já existe via repositório
            existing = self.repo.find_by_code(code)
            if not existing:
                return code

    def create_coupon(self, coupon_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Cria novo cupom com validação de dados.

        Args:
            coupon_data (Dict[str, Any]): Dados do cupom incluindo type, value, valid_until.

        Returns:
            Dict[str, Any]: Resultado com success e cupom criado ou erro.
        """
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
                'valid_from': coupon_data.get('valid_from', datetime.utcnow().isoformat()),
                'valid_until': coupon_data['valid_until'],
                'active': True,
                'created_at': datetime.utcnow().isoformat(),
                'updated_at': datetime.utcnow().isoformat()
            }

            # ✅ Cria via repositório
            created_coupon = self.repo.create(coupon)

            if created_coupon:
                return {
                    'success': True,
                    'coupon': created_coupon,
                    'message': 'Cupom criado com sucesso'
                }
            else:
                return {'success': False, 'error': 'Erro ao criar cupom'}

        except Exception as e:
            self.logger.error(f"Erro ao criar cupom: {str(e)}")
            return {'success': False, 'error': 'Erro interno do servidor'}

    def validate_coupon(self, code: str, user_id: str, order_value: float) -> Dict[str, Any]:
        """
        Valida cupom para uso.

        CORRIGIDO: Usa CouponRepository e CouponUsageRepository.
        """
        try:
            # ✅ Busca cupom via repositório
            coupon = self.repo.find_by_code(code.upper())

            if not coupon:
                return {'success': False, 'error': 'Cupom não encontrado'}

            # Verifica se está dentro do período de validade
            now = datetime.utcnow()
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

            # ✅ Verifica limite de uso por usuário via repositório
            user_usage_count = self.usage_repo.get_user_usage_count(coupon['id'], user_id)

            if user_usage_count >= coupon.get('user_limit', 1):
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
            self.logger.error(f"Erro ao validar cupom: {str(e)}")
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

            # ✅ Registra uso do cupom via repositório
            usage_data = {
                'id': generate_uuid(),
                'coupon_id': coupon['id'],
                'coupon_code': coupon.get('code'),
                'user_id': user_id,
                'order_id': order_id,
                'discount_value': discount,
                'used_at': datetime.utcnow().isoformat()
            }
            self.usage_repo.create(usage_data)

            # ✅ Incrementa contador via repositório
            self.repo.increment_usage_count(coupon['id'])

            return {
                'success': True,
                'coupon': coupon,
                'discount': discount,
                'final_value': order_value - discount,
                'message': 'Cupom aplicado com sucesso'
            }

        except Exception as e:
            self.logger.error(f"Erro ao aplicar cupom: {str(e)}")
            return {'success': False, 'error': 'Erro interno do servidor'}

    def get_coupons(self, filters: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Lista cupons com filtros.

        CORRIGIDO: Usa CouponRepository exclusivamente.
        """
        try:
            # ✅ Usa método do repositório que já aplica filtros
            coupons = self.repo.find_active(filters or {})

            return {
                'success': True,
                'coupons': coupons
            }

        except Exception as e:
            self.logger.error(f"Erro ao listar cupons: {str(e)}", exc_info=True)
            return {'success': False, 'error': 'Erro interno do servidor'}

    def update_coupon(self, coupon_id: str, update_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Atualiza cupom.

        CORRIGIDO: Usa CouponRepository.
        """
        try:
            # Remove campos que não devem ser atualizados
            update_data.pop('id', None)
            update_data.pop('created_at', None)
            update_data['updated_at'] = datetime.utcnow().isoformat()

            # ✅ Atualiza via repositório
            updated = self.repo.update(coupon_id, update_data)

            if updated:
                return {'success': True, 'message': 'Cupom atualizado com sucesso', 'coupon': updated}
            else:
                return {'success': False, 'error': 'Cupom não encontrado'}

        except Exception as e:
            self.logger.error(f"Erro ao atualizar cupom: {str(e)}")
            return {'success': False, 'error': 'Erro interno do servidor'}

    def delete_coupon(self, coupon_id: str) -> Dict[str, Any]:
        """
        Deleta cupom (soft delete).

        CORRIGIDO: Usa CouponRepository.
        """
        try:
            # ✅ Soft delete via repositório
            updated = self.repo.update(coupon_id, {
                'active': False,
                'updated_at': datetime.utcnow().isoformat()
            })

            if updated:
                return {'success': True, 'message': 'Cupom removido com sucesso'}
            else:
                return {'success': False, 'error': 'Cupom não encontrado'}

        except Exception as e:
            self.logger.error(f"Erro ao deletar cupom: {str(e)}")
            return {'success': False, 'error': 'Erro interno do servidor'}

    def get_coupon_usage(
        self,
        coupon_id: str = None,
        coupon_code: str = None,
        page: int = 1,
        per_page: int = 20
    ) -> Dict[str, Any]:
        """
        Retorna histórico de uso de um cupom com paginação.

        CORRIGIDO: Usa CouponUsageRepository.

        Args:
            coupon_id: ID do cupom (opcional)
            coupon_code: Código do cupom (opcional)
            page: Página
            per_page: Itens por página
        """
        try:
            # Se tiver código, busca o ID primeiro
            if coupon_code and not coupon_id:
                coupon = self.repo.find_by_code(coupon_code)
                if coupon:
                    coupon_id = coupon['id']
                else:
                    return {
                        'usage_history': [],
                        'total_uses': 0,
                        'pagination': {
                            'page': page,
                            'per_page': per_page,
                            'total': 0,
                            'pages': 0
                        }
                    }

            # ✅ Busca histórico via repositório
            usage_info = self.usage_repo.get_usage_history(
                coupon_id=coupon_id,
                page=page,
                per_page=per_page
            )

            return {
                'usage_history': usage_info.get('usage', []),
                'total_uses': usage_info.get('pagination', {}).get('total', 0),
                'pagination': usage_info.get('pagination', {})
            }

        except Exception as e:
            self.logger.error(f"Erro ao buscar histórico de uso: {str(e)}")
            return {
                'usage_history': [],
                'total_uses': 0,
                'pagination': {
                    'page': page,
                    'per_page': per_page,
                    'total': 0,
                    'pages': 0
                }
            }

    def get_coupon_analytics(self, coupon_id: str = None) -> Dict[str, Any]:
        """
        Retorna analytics de cupons.

        CORRIGIDO: Usa CouponUsageRepository.
        """
        try:
            # ✅ Busca analytics via repositório
            analytics = self.usage_repo.get_analytics(coupon_id)

            return {
                'success': True,
                'analytics': analytics
            }

        except Exception as e:
            self.logger.error(f"Erro ao buscar analytics de cupons: {str(e)}")
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
