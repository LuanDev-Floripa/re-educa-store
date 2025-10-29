"""
Rotas Administrativas para Rotação de Chaves de IA
Permite que administradores gerenciem rotação automática e manual de chaves
"""
from flask import Blueprint, request, jsonify
from datetime import datetime
import logging
from utils.decorators import token_required, admin_required, rate_limit, log_activity
from services.ai_key_rotation_service import ai_key_rotation_service

logger = logging.getLogger(__name__)

# Criar blueprint para rotas de rotação de chaves
admin_ai_rotation_bp = Blueprint('admin_ai_rotation', __name__, url_prefix='/api/admin/ai/rotation')

@admin_ai_rotation_bp.route('/check', methods=['GET'])
@token_required
@admin_required
@rate_limit("50 per hour")
@log_activity('admin_ai_rotation_check')
def check_rotation_needed():
    """Verifica se alguma chave precisa ser rotacionada"""
    try:
        result = ai_key_rotation_service.check_key_rotation_needed()
        
        if result['success']:
            return jsonify({
                'success': True,
                'data': result
            }), 200
        else:
            return jsonify({
                'success': False,
                'error': result['error']
            }), 500
            
    except Exception as e:
        logger.error(f"Erro ao verificar rotação necessária: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Erro interno do servidor'
        }), 500

@admin_ai_rotation_bp.route('/rotate/<config_id>', methods=['POST'])
@token_required
@admin_required
@rate_limit("10 per hour")
@log_activity('admin_ai_rotation_manual')
def rotate_key(config_id):
    """Rotaciona uma chave específica"""
    try:
        data = request.get_json()
        
        if not data or 'new_api_key' not in data:
            return jsonify({
                'success': False,
                'error': 'Nova chave de API é obrigatória'
            }), 400
        
        new_api_key = data['new_api_key']
        rotated_by = request.user_id  # ID do admin que está rotacionando
        
        result = ai_key_rotation_service.rotate_key(config_id, new_api_key, rotated_by)
        
        if result['success']:
            return jsonify({
                'success': True,
                'data': result['data'],
                'message': result['message']
            }), 200
        else:
            return jsonify({
                'success': False,
                'error': result['error']
            }), 400
            
    except Exception as e:
        logger.error(f"Erro ao rotacionar chave: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Erro interno do servidor'
        }), 500

@admin_ai_rotation_bp.route('/auto-rotate', methods=['POST'])
@token_required
@admin_required
@rate_limit("5 per hour")
@log_activity('admin_ai_rotation_auto')
def auto_rotate_keys():
    """Executa rotação automática de chaves"""
    try:
        result = ai_key_rotation_service.auto_rotate_keys()
        
        if result['success']:
            return jsonify({
                'success': True,
                'data': result
            }), 200
        else:
            return jsonify({
                'success': False,
                'error': result['error']
            }), 500
            
    except Exception as e:
        logger.error(f"Erro na rotação automática: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Erro interno do servidor'
        }), 500

@admin_ai_rotation_bp.route('/history', methods=['GET'])
@token_required
@admin_required
@rate_limit("100 per hour")
@log_activity('admin_ai_rotation_history')
def get_rotation_history():
    """Obtém histórico de rotações"""
    try:
        config_id = request.args.get('config_id')
        limit = int(request.args.get('limit', 50))
        
        result = ai_key_rotation_service.get_rotation_history(config_id, limit)
        
        if result['success']:
            return jsonify({
                'success': True,
                'data': result['data']
            }), 200
        else:
            return jsonify({
                'success': False,
                'error': result['error']
            }), 500
            
    except Exception as e:
        logger.error(f"Erro ao obter histórico de rotação: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Erro interno do servidor'
        }), 500

@admin_ai_rotation_bp.route('/settings', methods=['GET'])
@token_required
@admin_required
@rate_limit("100 per hour")
@log_activity('admin_ai_rotation_settings_get')
def get_rotation_settings():
    """Obtém configurações de rotação"""
    try:
        result = ai_key_rotation_service.get_rotation_settings()
        
        if result['success']:
            return jsonify({
                'success': True,
                'data': result['data']
            }), 200
        else:
            return jsonify({
                'success': False,
                'error': result['error']
            }), 500
            
    except Exception as e:
        logger.error(f"Erro ao obter configurações de rotação: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Erro interno do servidor'
        }), 500

@admin_ai_rotation_bp.route('/settings', methods=['PUT'])
@token_required
@admin_required
@rate_limit("20 per hour")
@log_activity('admin_ai_rotation_settings_update')
def update_rotation_settings():
    """Atualiza configurações de rotação"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                'success': False,
                'error': 'Dados não fornecidos'
            }), 400
        
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
            return jsonify({
                'success': False,
                'error': 'Nenhuma configuração válida fornecida'
            }), 400
        
        result = ai_key_rotation_service.update_rotation_settings(filtered_settings)
        
        if result['success']:
            return jsonify({
                'success': True,
                'data': result['data'],
                'message': result['message']
            }), 200
        else:
            return jsonify({
                'success': False,
                'error': result['error']
            }), 400
            
    except Exception as e:
        logger.error(f"Erro ao atualizar configurações de rotação: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Erro interno do servidor'
        }), 500

@admin_ai_rotation_bp.route('/status', methods=['GET'])
@token_required
@admin_required
@rate_limit("100 per hour")
def get_rotation_status():
    """Obtém status geral do sistema de rotação"""
    try:
        # Verificar rotação necessária
        rotation_check = ai_key_rotation_service.check_key_rotation_needed()
        
        # Obter configurações
        settings_result = ai_key_rotation_service.get_rotation_settings()
        
        # Obter histórico recente
        history_result = ai_key_rotation_service.get_rotation_history(limit=10)
        
        status_data = {
            'rotation_needed': rotation_check.get('needs_rotation', False) if rotation_check['success'] else False,
            'configs_to_rotate': rotation_check.get('configs_to_rotate', []) if rotation_check['success'] else [],
            'rotation_days': rotation_check.get('rotation_days', 90) if rotation_check['success'] else 90,
            'settings': settings_result.get('data', {}) if settings_result['success'] else {},
            'recent_rotations': history_result.get('data', []) if history_result['success'] else [],
            'last_check': datetime.now().isoformat()
        }
        
        return jsonify({
            'success': True,
            'data': status_data
        }), 200
        
    except Exception as e:
        logger.error(f"Erro ao obter status de rotação: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Erro interno do servidor'
        }), 500