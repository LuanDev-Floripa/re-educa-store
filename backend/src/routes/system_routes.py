"""
Rotas para monitoramento e saúde do sistema
Health checks, métricas e estatísticas
"""

import logging
from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from services.integration_service import integration_service
from utils.decorators import handle_exceptions

logger = logging.getLogger(__name__)

# Blueprint para rotas do sistema
system_bp = Blueprint('system', __name__, url_prefix='/api/system')

@system_bp.route('/health', methods=['GET'])
@handle_exceptions
def health_check():
    """Health check do sistema"""
    try:
        health_status = integration_service.health_check()
        
        # Determinar código de status HTTP
        if health_status['overall'] == 'healthy':
            status_code = 200
        elif health_status['overall'] == 'warning':
            status_code = 200  # Ainda funcional
        else:
            status_code = 503  # Service Unavailable
        
        return jsonify({
            'success': True,
            'data': health_status
        }), status_code
        
    except Exception as e:
        logger.error(f"Erro no health check: {e}")
        return jsonify({
            'success': False,
            'error': 'Erro interno do servidor'
        }), 500

@system_bp.route('/stats', methods=['GET'])
@jwt_required()
@handle_exceptions
def get_system_stats():
    """Obtém estatísticas do sistema (requer autenticação)"""
    try:
        user_id = get_jwt_identity()
        
        # Aqui você poderia verificar se o usuário é admin
        # Por enquanto, permitimos para qualquer usuário autenticado
        
        stats = integration_service.get_system_stats()
        
        return jsonify({
            'success': True,
            'data': stats
        }), 200
        
    except Exception as e:
        logger.error(f"Erro ao obter estatísticas: {e}")
        return jsonify({
            'success': False,
            'error': 'Erro interno do servidor'
        }), 500

@system_bp.route('/cache/clear', methods=['POST'])
@jwt_required()
@handle_exceptions
def clear_cache():
    """Limpa cache do sistema (requer autenticação)"""
    try:
        user_id = get_jwt_identity()
        
        # Aqui você poderia verificar se o usuário é admin
        # Por enquanto, permitimos para qualquer usuário autenticado
        
        if integration_service.cache.is_available():
            integration_service.cache.flush_all()
            return jsonify({
                'success': True,
                'message': 'Cache limpo com sucesso'
            }), 200
        else:
            return jsonify({
                'success': False,
                'error': 'Cache não disponível'
            }), 503
            
    except Exception as e:
        logger.error(f"Erro ao limpar cache: {e}")
        return jsonify({
            'success': False,
            'error': 'Erro interno do servidor'
        }), 500

@system_bp.route('/storage/setup', methods=['POST'])
@jwt_required()
@handle_exceptions
def setup_storage():
    """Configura storage do sistema (requer autenticação)"""
    try:
        user_id = get_jwt_identity()
        
        # Aqui você poderia verificar se o usuário é admin
        # Por enquanto, permitimos para qualquer usuário autenticado
        
        success = integration_service.video_upload.create_bucket_if_not_exists()
        
        if success:
            return jsonify({
                'success': True,
                'message': 'Storage configurado com sucesso'
            }), 200
        else:
            return jsonify({
                'success': False,
                'error': 'Erro ao configurar storage'
            }), 500
            
    except Exception as e:
        logger.error(f"Erro ao configurar storage: {e}")
        return jsonify({
            'success': False,
            'error': 'Erro interno do servidor'
        }), 500

@system_bp.route('/cleanup', methods=['POST'])
@jwt_required()
@handle_exceptions
def cleanup_system():
    """Limpa recursos do sistema (requer autenticação)"""
    try:
        user_id = get_jwt_identity()
        
        # Aqui você poderia verificar se o usuário é admin
        # Por enquanto, permitimos para qualquer usuário autenticado
        
        integration_service.cleanup_resources()
        
        return jsonify({
            'success': True,
            'message': 'Sistema limpo com sucesso'
        }), 200
        
    except Exception as e:
        logger.error(f"Erro ao limpar sistema: {e}")
        return jsonify({
            'success': False,
            'error': 'Erro interno do servidor'
        }), 500
