"""
Rotas para monitoramento e saúde do sistema RE-EDUCA Store.

Fornece endpoints para:
- Health checks do sistema
- Métricas e estatísticas
- Limpeza de cache
- Status de serviços
"""

import logging
from flask import Blueprint, jsonify, request
from middleware.auth import token_required
from services.integration_service import integration_service
from utils.exception_strategies import handle_route_exceptions
from exceptions.custom_exceptions import ValidationError, InternalServerError

logger = logging.getLogger(__name__)

# Blueprint para rotas do sistema
system_bp = Blueprint('system', __name__, url_prefix='/api/system')

@system_bp.route('/health', methods=['GET'])
@handle_route_exceptions
def health_check():
    """
    Health check do sistema.
    
    Implementa tratamento robusto de exceções e validação de dados.

    Verifica status de todos os serviços e dependências.

    Returns:
        JSON: Status geral do sistema (healthy/warning/unhealthy).
    """
    health_status = integration_service.health_check()

    # Determinar código de status HTTP
    if health_status.get('overall') == 'healthy':
        status_code = 200
    elif health_status.get('overall') == 'warning':
        status_code = 200  # Ainda funcional
    else:
        status_code = 503  # Service Unavailable

    return jsonify({
        'success': True,
        'data': health_status
    }), status_code

@system_bp.route('/stats', methods=['GET'])
@token_required
@handle_route_exceptions
def get_system_stats():
    """
    Obtém estatísticas do sistema (requer autenticação).
    
    Implementa tratamento robusto de exceções e validação de dados.

    Retorna métricas gerais do sistema incluindo:
    - Número de usuários
    - Estatísticas de uso
    - Status de serviços

    Returns:
        JSON: Estatísticas do sistema.
    """
    user_id = request.current_user.get('id')

    # Aqui você poderia verificar se o usuário é admin
    # Por enquanto, permitimos para qualquer usuário autenticado

    stats = integration_service.get_system_stats()

    return jsonify({
        'success': True,
        'data': stats
    }), 200

@system_bp.route('/cache/clear', methods=['POST'])
@token_required
@handle_route_exceptions
def clear_cache():
    """
    Limpa cache do sistema (requer autenticação).
    
    Implementa tratamento robusto de exceções e validação de dados.
    """
    user_id = request.current_user.get('id')

    # Aqui você poderia verificar se o usuário é admin
    # Por enquanto, permitimos para qualquer usuário autenticado

    if not integration_service.cache.is_available():
        raise InternalServerError('Cache não disponível')

    integration_service.cache.flush_all()
    return jsonify({
        'success': True,
        'message': 'Cache limpo com sucesso'
    }), 200

@system_bp.route('/storage/setup', methods=['POST'])
@token_required
@handle_route_exceptions
def setup_storage():
    """
    Configura storage do sistema (requer autenticação).
    
    Implementa tratamento robusto de exceções e validação de dados.
    """
    user_id = request.current_user.get('id')

    # Aqui você poderia verificar se o usuário é admin
    # Por enquanto, permitimos para qualquer usuário autenticado

    success = integration_service.video_upload.create_bucket_if_not_exists()

    if not success:
        raise InternalServerError('Erro ao configurar storage')

    return jsonify({
        'success': True,
        'message': 'Storage configurado com sucesso'
    }), 200

@system_bp.route('/cleanup', methods=['POST'])
@token_required
@handle_route_exceptions
def cleanup_system():
    """
    Limpa recursos do sistema (requer autenticação).
    
    Implementa tratamento robusto de exceções e validação de dados.

    Executa limpeza de recursos temporários e dados obsoletos
    para otimizar performance do sistema.

    Returns:
        JSON: Confirmação de limpeza completa.
    """
    user_id = request.current_user.get('id')

    # Aqui você poderia verificar se o usuário é admin
    # Por enquanto, permitimos para qualquer usuário autenticado

    integration_service.cleanup_resources()

    return jsonify({
        'success': True,
        'message': 'Sistema limpo com sucesso'
    }), 200
