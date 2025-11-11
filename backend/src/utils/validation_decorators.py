# -*- coding: utf-8 -*-
"""
Decorators de Validação para RE-EDUCA Store.

Decorators reutilizáveis para validação de inputs em endpoints.
"""

import logging
from functools import wraps
from flask import jsonify, request

from utils.input_validators import input_validator

logger = logging.getLogger(__name__)


def validate_order_request(f):
    """
    Decorator para validar requisições de criação de pedido.
    
    Usage:
        @app.route('/orders', methods=['POST'])
        @validate_order_request
        def create_order():
            data = request.get_json()
            # data já foi validado
    """
    @wraps(f)
    def decorated(*args, **kwargs):
        try:
            data = request.get_json()
            
            if not data:
                return jsonify({"error": "JSON inválido"}), 400
            
            is_valid, errors = input_validator.validate_order_data(data)
            
            if not is_valid:
                logger.warning(f"Pedido inválido: {errors}")
                return jsonify({
                    "error": "Dados do pedido inválidos",
                    "details": errors
                }), 400
            
            return f(*args, **kwargs)
            
        except Exception as e:
            logger.error(f"Erro na validação de pedido: {str(e)}", exc_info=True)
            return jsonify({"error": "Erro ao validar pedido"}), 500
    
    return decorated


def validate_payment_request(f):
    """
    Decorator para validar requisições de pagamento.
    
    Usage:
        @app.route('/payments', methods=['POST'])
        @validate_payment_request
        def create_payment():
            data = request.get_json()
            # data já foi validado
    """
    @wraps(f)
    def decorated(*args, **kwargs):
        try:
            data = request.get_json()
            
            if not data:
                return jsonify({"error": "JSON inválido"}), 400
            
            is_valid, errors = input_validator.validate_payment_data(data)
            
            if not is_valid:
                logger.warning(f"Pagamento inválido: {errors}")
                return jsonify({
                    "error": "Dados de pagamento inválidos",
                    "details": errors
                }), 400
            
            return f(*args, **kwargs)
            
        except Exception as e:
            logger.error(f"Erro na validação de pagamento: {str(e)}", exc_info=True)
            return jsonify({"error": "Erro ao validar pagamento"}), 500
    
    return decorated


def validate_pagination(f):
    """
    Decorator para validar parâmetros de paginação.
    
    Adiciona page e per_page validados ao request.validated_params
    
    Usage:
        @app.route('/products')
        @validate_pagination
        def get_products():
            page, per_page = request.validated_params['page'], request.validated_params['per_page']
    """
    @wraps(f)
    def decorated(*args, **kwargs):
        page = request.args.get('page', 1)
        per_page = request.args.get('per_page', 20)
        
        page, per_page = input_validator.validate_pagination(page, per_page)
        
        # Adiciona ao request para uso na função
        if not hasattr(request, 'validated_params'):
            request.validated_params = {}
        
        request.validated_params['page'] = page
        request.validated_params['per_page'] = per_page
        
        return f(*args, **kwargs)
    
    return decorated


def validate_uuid_param(param_name: str):
    """
    Decorator factory para validar parâmetro UUID.
    
    Usage:
        @app.route('/products/<product_id>')
        @validate_uuid_param('product_id')
        def get_product(product_id):
            # product_id já foi validado
    """
    def decorator(f):
        @wraps(f)
        def decorated(*args, **kwargs):
            param_value = kwargs.get(param_name)
            
            if not param_value:
                return jsonify({"error": f"Parâmetro '{param_name}' obrigatório"}), 400
            
            if not input_validator.validate_uuid(param_value):
                logger.warning(f"UUID inválido: {param_name}={param_value}")
                return jsonify({"error": f"'{param_name}' deve ser um UUID válido"}), 400
            
            return f(*args, **kwargs)
        
        return decorated
    return decorator


def sanitize_string_fields(*field_names):
    """
    Decorator factory para sanitizar campos de string no JSON.
    
    Usage:
        @app.route('/products', methods=['POST'])
        @sanitize_string_fields('name', 'description')
        def create_product():
            data = request.get_json()
            # data['name'] e data['description'] foram sanitizados
    """
    def decorator(f):
        @wraps(f)
        def decorated(*args, **kwargs):
            try:
                data = request.get_json()
                
                if not data:
                    return jsonify({"error": "JSON inválido"}), 400
                
                # Sanitiza campos especificados
                for field in field_names:
                    if field in data and isinstance(data[field], str):
                        sanitized = input_validator.sanitize_string(data[field])
                        
                        if sanitized is None:
                            logger.warning(f"Campo '{field}' contém conteúdo inválido")
                            return jsonify({
                                "error": f"Campo '{field}' contém conteúdo inválido"
                            }), 400
                        
                        data[field] = sanitized
                
                # Atualiza JSON no request
                request._cached_json = (data, data)
                
                return f(*args, **kwargs)
                
            except Exception as e:
                logger.error(f"Erro ao sanitizar campos: {str(e)}", exc_info=True)
                return jsonify({"error": "Erro ao processar requisição"}), 500
        
        return decorated
    return decorator


def validate_positive_numbers(**field_configs):
    """
    Decorator factory para validar números positivos.
    
    Usage:
        @app.route('/products', methods=['POST'])
        @validate_positive_numbers(price=False, stock_quantity=True)  # False = não permite zero
        def create_product():
            data = request.get_json()
            # price e stock_quantity foram validados
    """
    def decorator(f):
        @wraps(f)
        def decorated(*args, **kwargs):
            try:
                data = request.get_json()
                
                if not data:
                    return jsonify({"error": "JSON inválido"}), 400
                
                for field, allow_zero in field_configs.items():
                    if field in data:
                        if not input_validator.validate_positive_number(data[field], allow_zero=allow_zero):
                            logger.warning(f"Número inválido: {field}={data[field]}")
                            return jsonify({
                                "error": f"Campo '{field}' deve ser um número positivo" + 
                                        (" ou zero" if allow_zero else "")
                            }), 400
                
                return f(*args, **kwargs)
                
            except Exception as e:
                logger.error(f"Erro ao validar números: {str(e)}", exc_info=True)
                return jsonify({"error": "Erro ao processar requisição"}), 500
        
        return decorated
    return decorator
