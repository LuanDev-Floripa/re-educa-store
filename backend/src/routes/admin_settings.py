"""
Rotas Administrativas de Configurações da Plataforma RE-EDUCA Store.
"""
from flask import Blueprint, request, jsonify
from services.platform_settings_service import PlatformSettingsService
from utils.decorators import admin_required
from utils.rate_limit_helper import rate_limit
from utils.exception_strategies import handle_route_exceptions
from exceptions.custom_exceptions import ValidationError
import logging

logger = logging.getLogger(__name__)

admin_settings_bp = Blueprint('admin_settings', __name__, url_prefix='/api/admin/settings')
admin_settings_service = PlatformSettingsService()

@admin_settings_bp.route('', methods=['GET'])
@admin_required
@rate_limit("100 per hour")
@handle_route_exceptions
def get_settings():
    """
    Busca todas as configurações da plataforma.
    
    Query Parameters:
        category (str, optional): Filtrar por categoria
    """
    category = request.args.get('category')
    
    result = admin_settings_service.get_all_settings(category=category)
    
    return jsonify(result), 200

@admin_settings_bp.route('/<setting_key>', methods=['GET'])
@admin_required
@rate_limit("100 per hour")
@handle_route_exceptions
def get_setting(setting_key):
    """
    Busca uma configuração específica.
    
    Args:
        setting_key (str): Chave da configuração
    """
    if not setting_key:
        raise ValidationError("setting_key é obrigatório")
    
    result = admin_settings_service.get_setting(setting_key)
    
    if not result.get('success'):
        return jsonify(result), 404
    
    return jsonify(result), 200

@admin_settings_bp.route('/<setting_key>', methods=['PUT', 'PATCH'])
@admin_required
@rate_limit("50 per hour")
@handle_route_exceptions
def update_setting(setting_key):
    """
    Atualiza uma configuração.
    
    Args:
        setting_key (str): Chave da configuração
    
    Request Body:
        JSON com 'value' (obrigatório)
    """
    if not setting_key:
        raise ValidationError("setting_key é obrigatório")
    
    data = request.get_json()
    if not data:
        raise ValidationError("Dados são obrigatórios")
    
    setting_value = data.get('value')
    if setting_value is None:
        raise ValidationError("value é obrigatório")
    
    admin_id = request.current_user.get('id') if hasattr(request, 'current_user') else None
    
    result = admin_settings_service.update_setting(setting_key, setting_value, admin_id)
    
    if not result.get('success'):
        return jsonify(result), 400
    
    return jsonify(result), 200

@admin_settings_bp.route('/bulk', methods=['PUT', 'PATCH'])
@admin_required
@rate_limit("20 per hour")
@handle_route_exceptions
def update_multiple_settings():
    """
    Atualiza múltiplas configurações de uma vez.
    
    Request Body:
        JSON com objeto de chave-valor:
        {
            "setting_key1": "value1",
            "setting_key2": "value2",
            ...
        }
    """
    data = request.get_json()
    if not data:
        raise ValidationError("Dados são obrigatórios")
    
    if not isinstance(data, dict):
        raise ValidationError("Dados devem ser um objeto chave-valor")
    
    admin_id = request.current_user.get('id') if hasattr(request, 'current_user') else None
    
    result = admin_settings_service.update_multiple_settings(data, admin_id)
    
    return jsonify(result), 200

@admin_settings_bp.route('/public', methods=['GET'])
@rate_limit("100 per hour")
@handle_route_exceptions
def get_public_settings():
    """
    Busca configurações públicas (não requer autenticação de admin).
    """
    result = admin_settings_service.get_public_settings()
    
    return jsonify(result), 200
