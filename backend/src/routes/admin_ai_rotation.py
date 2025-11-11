"""
Rotas Administrativas para Rotação de Chaves de IA RE-EDUCA Store.

Gerencia rotação de API keys de IA incluindo:
- Verificação de chaves que precisam rotação
- Rotação manual de chaves específicas
- Rotação automática em lote
- Histórico de rotações
- Configuração de políticas de rotação

SEGURANÇA:
- Apenas administradores têm acesso
- Rate limiting rigoroso (10-50 req/hour)
- Logs de todas as operações
- Chaves criptografadas no banco
"""
from flask import Blueprint, request, jsonify
from datetime import datetime
import logging
from utils.decorators import token_required, admin_required, log_activity
from utils.rate_limit_helper import rate_limit
from utils.exception_strategies import handle_route_exceptions
from exceptions.custom_exceptions import ValidationError, NotFoundError, InternalServerError
from services.ai_key_rotation_service import ai_key_rotation_service

logger = logging.getLogger(__name__)

# Criar blueprint para rotas de rotação de chaves
admin_ai_rotation_bp = Blueprint('admin_ai_rotation', __name__, url_prefix='/api/admin/ai/rotation')

@admin_ai_rotation_bp.route('/check', methods=['GET'])
@token_required
@admin_required
@rate_limit("50 per hour")
@log_activity('admin_ai_rotation_check')
@handle_route_exceptions
def check_rotation_needed():
    """
    Verifica se alguma chave precisa ser rotacionada.
    
    Implementa tratamento robusto de exceções e validação de dados.

    Returns:
        JSON: Lista de chaves que precisam rotação com idade e uso.
    """
    result = ai_key_rotation_service.check_key_rotation_needed()

    if not result.get('success'):
        raise InternalServerError(result.get('error', 'Erro ao verificar rotação necessária'))

    return jsonify({
        'success': True,
        'data': result
    }), 200

@admin_ai_rotation_bp.route('/rotate/<config_id>', methods=['POST'])
@token_required
@admin_required
@rate_limit("10 per hour")
@log_activity('admin_ai_rotation_manual')
@handle_route_exceptions
def rotate_key(config_id):
    """
    Rotaciona uma chave específica.
    
    Implementa tratamento robusto de exceções e validação de dados.
    """
    if not config_id:
        raise ValidationError("config_id é obrigatório")
    
    data = request.get_json()

    if not data or 'new_api_key' not in data:
        raise ValidationError('Nova chave de API é obrigatória')

    new_api_key = data['new_api_key']
    rotated_by = request.user_id  # ID do admin que está rotacionando

    result = ai_key_rotation_service.rotate_key(config_id, new_api_key, rotated_by)

    if not result.get('success'):
        raise ValidationError(result.get('error', 'Erro ao rotacionar chave'))

    return jsonify({
        'success': True,
        'data': result['data'],
        'message': result['message']
    }), 200

@admin_ai_rotation_bp.route('/auto-rotate', methods=['POST'])
@token_required
@admin_required
@rate_limit("5 per hour")
@log_activity('admin_ai_rotation_auto')
@handle_route_exceptions
def auto_rotate_keys():
    """
    Executa rotação automática de chaves.
    
    Implementa tratamento robusto de exceções e validação de dados.
    """
    result = ai_key_rotation_service.auto_rotate_keys()

    if not result.get('success'):
        raise InternalServerError(result.get('error', 'Erro na rotação automática'))

    return jsonify({
        'success': True,
        'data': result
    }), 200

@admin_ai_rotation_bp.route('/history', methods=['GET'])
@token_required
@admin_required
@rate_limit("100 per hour")
@log_activity('admin_ai_rotation_history')
@handle_route_exceptions
def get_rotation_history():
    """
    Obtém histórico de rotações.
    
    Implementa tratamento robusto de exceções e validação de dados.
    """
    config_id = request.args.get('config_id')
    
    try:
        limit = int(request.args.get('limit', 50))
        if limit < 1 or limit > 200:
            raise ValidationError("limit deve estar entre 1 e 200")
    except (ValueError, TypeError):
        raise ValidationError("limit deve ser um número válido")

    result = ai_key_rotation_service.get_rotation_history(config_id, limit)

    if not result.get('success'):
        raise InternalServerError(result.get('error', 'Erro ao obter histórico'))

    return jsonify({
        'success': True,
        'data': result['data']
    }), 200

@admin_ai_rotation_bp.route('/settings', methods=['GET'])
@token_required
@admin_required
@rate_limit("100 per hour")
@log_activity('admin_ai_rotation_settings_get')
@handle_route_exceptions
def get_rotation_settings():
    """
    Obtém configurações de rotação.
    
    Implementa tratamento robusto de exceções e validação de dados.
    """
    result = ai_key_rotation_service.get_rotation_settings()

    if not result.get('success'):
        raise InternalServerError(result.get('error', 'Erro ao obter configurações'))

    return jsonify({
        'success': True,
        'data': result['data']
    }), 200

@admin_ai_rotation_bp.route('/settings', methods=['PUT'])
@token_required
@admin_required
@rate_limit("20 per hour")
@log_activity('admin_ai_rotation_settings_update')
@handle_route_exceptions
def update_rotation_settings():
    """
    Atualiza configurações de rotação.
    
    Implementa tratamento robusto de exceções e validação de dados.
    """
    data = request.get_json()

    if not data:
        raise ValidationError('Dados não fornecidos')

    # Validar configurações
    valid_settings = [
        'key_rotation_days',
        'max_requests_per_hour',
        'max_tokens_per_request',
        'enable_rate_limiting',
        'enable_usage_logging'
    ]

    filtered_settings = {k: v for k, v in data.items() if k in valid_settings}

    if not filtered_settings:
        raise ValidationError('Nenhuma configuração válida fornecida')

    result = ai_key_rotation_service.update_rotation_settings(filtered_settings)

    if not result.get('success'):
        raise ValidationError(result.get('error', 'Erro ao atualizar configurações'))

    return jsonify({
        'success': True,
        'data': result['data'],
        'message': result['message']
    }), 200

@admin_ai_rotation_bp.route('/status', methods=['GET'])
@token_required
@admin_required
@rate_limit("100 per hour")
@handle_route_exceptions
def get_rotation_status():
    """
    Obtém status geral do sistema de rotação.
    
    Implementa tratamento robusto de exceções e validação de dados.
    """
    # Verificar rotação necessária
    rotation_check = ai_key_rotation_service.check_key_rotation_needed()

    # Obter configurações
    settings_result = ai_key_rotation_service.get_rotation_settings()

    # Obter histórico recente
    history_result = ai_key_rotation_service.get_rotation_history(limit=10)

    status_data = {
        'rotation_needed': rotation_check.get('needs_rotation', False) if rotation_check.get('success') else False,
        'configs_to_rotate': rotation_check.get('configs_to_rotate', []) if rotation_check.get('success') else [],
        'rotation_days': rotation_check.get('rotation_days', 90) if rotation_check.get('success') else 90,
        'settings': settings_result.get('data', {}) if settings_result.get('success') else {},
        'recent_rotations': history_result.get('data', []) if history_result.get('success') else [],
        'last_check': datetime.now().isoformat()
    }

    return jsonify({
        'success': True,
        'data': status_data
    }), 200
