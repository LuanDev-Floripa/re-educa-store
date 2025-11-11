"""
Rotas de Frete RE-EDUCA Store.

Gerencia cálculo de frete incluindo:
- Cálculo básico por regras
- Cálculo por CEP usando API dos Correios
- Validação de CEP
- Múltiplas opções de frete
"""
from flask import Blueprint, request, jsonify
import logging
from services.shipping_service import ShippingService
from utils.decorators import token_required
from utils.rate_limit_helper import rate_limit
from utils.exception_strategies import handle_route_exceptions
from exceptions.custom_exceptions import ValidationError
from utils.validators import validate_json

logger = logging.getLogger(__name__)

shipping_bp = Blueprint('shipping', __name__)
shipping_service = ShippingService()

@shipping_bp.route('/calculate', methods=['POST'])
@token_required
@rate_limit("30 per minute")
@handle_route_exceptions
def calculate_shipping():
    """
    Calcula frete para um pedido.
    
    Implementa tratamento robusto de exceções e validação de dados.
    
    Request Body:
        order_total (float): Valor total do pedido
        address (dict, optional): Endereço de entrega com 'cep'
        items (array, optional): Lista de itens com peso e dimensões
        use_correios (bool, optional): Se deve usar API dos Correios (padrão: false)
    """
    data = request.get_json()
    if not data:
        raise ValidationError("Dados são obrigatórios")
    
    try:
        order_total = float(data.get('order_total', 0))
        if order_total < 0:
            raise ValidationError("order_total deve ser maior ou igual a 0")
    except (ValueError, TypeError):
        raise ValidationError('order_total deve ser um número válido')
    
    address = data.get('address')
    items = data.get('items')
    use_correios = data.get('use_correios', False)
    
    result = shipping_service.calculate_shipping(
        order_total=order_total,
        address=address,
        items=items,
        use_correios=use_correios
    )
    
    return jsonify(result), 200

@shipping_bp.route('/calculate-by-cep', methods=['POST'])
@token_required
@rate_limit("30 per minute")
@validate_json('cep_destino', 'items')
@handle_route_exceptions
def calculate_shipping_by_cep():
    """
    Calcula frete usando CEP e itens (usa API dos Correios).
    
    Implementa tratamento robusto de exceções e validação de dados.
    
    Request Body:
        cep_destino (str): CEP de destino (formato: 01310100 ou 01310-100)
        items (array): Lista de itens com peso e dimensões
        order_total (float, optional): Valor total do pedido (para frete grátis)
    """
    data = request.get_json()
    cep_destino = data.get('cep_destino')
    items = data.get('items')
    
    if not cep_destino:
        raise ValidationError("cep_destino é obrigatório")
    
    if not items or not isinstance(items, list) or len(items) == 0:
        raise ValidationError("items é obrigatório e deve ser uma lista não vazia")
    
    try:
        order_total = float(data.get('order_total', 0))
        if order_total < 0:
            raise ValidationError("order_total deve ser maior ou igual a 0")
    except (ValueError, TypeError):
        raise ValidationError('order_total deve ser um número válido')
    
    result = shipping_service.calculate_shipping_by_cep(
        cep_destino=cep_destino,
        items=items,
        order_total=order_total
    )
    
    if not result.get('success'):
        raise ValidationError(result.get('error', 'Erro ao calcular frete'))
    
    return jsonify(result), 200

@shipping_bp.route('/validate-cep/<cep>', methods=['GET'])
@rate_limit("50 per hour")
@handle_route_exceptions
def validate_cep(cep):
    """
    Valida e busca informações de um CEP.
    
    Implementa tratamento robusto de exceções e validação de dados.
    
    Args:
        cep (str): CEP a validar (formato: 01310100 ou 01310-100)
    
    Returns:
        JSON: Informações do CEP ou erro
    """
    if not cep:
        raise ValidationError("CEP é obrigatório")
    
    result = shipping_service.validate_cep(cep)
    
    if not result.get('success'):
        raise ValidationError(result.get('error', 'CEP inválido'))
    
    return jsonify(result), 200
