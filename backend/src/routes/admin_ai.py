"""
Rotas Administrativas para Configuração de IA.

Permite que administradores gerenciem configurações de IA de forma segura,
incluindo criação, listagem, atualização e exclusão de configurações de
diferentes providers (Gemini, Perplexity, OpenAI, Claude).
"""
from flask import Blueprint, request, jsonify
from datetime import datetime
import logging
from utils.decorators import token_required, log_activity
from utils.rate_limit_helper import rate_limit
from utils.exception_strategies import handle_route_exceptions
from exceptions.custom_exceptions import ValidationError, NotFoundError, InternalServerError
from middleware.admin_auth import admin_required
from services.ai_config_service_hybrid import ai_config_service_hybrid as ai_config_service

logger = logging.getLogger(__name__)

# Criar blueprint para rotas administrativas de IA
admin_ai_bp = Blueprint('admin_ai', __name__, url_prefix='/api/admin/ai')

@admin_ai_bp.route('/configs', methods=['GET'])
@token_required
@admin_required
@rate_limit("100 per hour")
@log_activity('admin_ai_configs_list')
@handle_route_exceptions
def list_ai_configs():
    """
    Lista todas as configurações de IA.
    
    Implementa tratamento robusto de exceções e validação de dados.

    Query Parameters:
        include_inactive (bool): Incluir configurações inativas (padrão: false).

    Returns:
        JSON: Lista de configurações de IA ou erro.
    """
    include_inactive = request.args.get('include_inactive', 'false').lower() == 'true'

    result = ai_config_service.list_ai_configs(include_inactive=include_inactive)

    if not result.get('success'):
        raise InternalServerError(result.get('error', 'Erro ao listar configurações'))

    return jsonify({
        'success': True,
        'data': result['data'],
        'count': len(result['data'])
    }), 200

@admin_ai_bp.route('/configs', methods=['POST'])
@token_required
@admin_required
@rate_limit("20 per hour")
@log_activity('admin_ai_config_create')
@handle_route_exceptions
def create_ai_config():
    """
    Cria nova configuração de IA.
    
    Implementa tratamento robusto de exceções e validação de dados.

    Request Body:
        provider (str): Provider da IA (gemini, perplexity, openai, claude).
        service_name (str): Nome do serviço.
        api_key (str): Chave da API (será criptografada).

    Returns:
        JSON: Configuração criada ou erro.
    """
    data = request.get_json()

    if not data:
        raise ValidationError('Dados não fornecidos')

    # Validar campos obrigatórios
    required_fields = ['provider', 'service_name', 'api_key']
    for field in required_fields:
        if field not in data:
            raise ValidationError(f'Campo obrigatório: {field}')

    # Validar provider
    valid_providers = ['gemini', 'perplexity', 'openai', 'claude']
    if data['provider'] not in valid_providers:
        raise ValidationError(f'Provider inválido. Use: {", ".join(valid_providers)}')

    # Obter ID do usuário admin (do token)
    admin_user_id = request.user_id

    result = ai_config_service.create_ai_config(data, admin_user_id)

    if not result.get('success'):
        raise ValidationError(result.get('error', 'Erro ao criar configuração'))

    return jsonify({
        'success': True,
        'data': result['data'],
        'message': 'Configuração de IA criada com sucesso'
    }), 201

@admin_ai_bp.route('/configs/<config_id>', methods=['GET'])
@token_required
@admin_required
@rate_limit("100 per hour")
@log_activity('admin_ai_config_get')
@handle_route_exceptions
def get_ai_config(config_id):
    """
    Obtém configuração específica de IA (sem chave descriptografada).
    
    Implementa tratamento robusto de exceções e validação de dados.
    """
    if not config_id:
        raise ValidationError("config_id é obrigatório")
    
    # Listar todas as configurações e filtrar por ID
    result = ai_config_service.list_ai_configs(include_inactive=True)

    if not result.get('success'):
        raise InternalServerError(result.get('error', 'Erro ao buscar configurações'))

    config = next((c for c in result['data'] if c['id'] == config_id), None)
    if not config:
        raise NotFoundError('Configuração não encontrada')

    return jsonify({
        'success': True,
        'data': config
    }), 200

@admin_ai_bp.route('/configs/<config_id>', methods=['PUT'])
@token_required
@admin_required
@rate_limit("20 per hour")
@log_activity('admin_ai_config_update')
@handle_route_exceptions
def update_ai_config(config_id):
    """
    Atualiza configuração de IA.
    
    Implementa tratamento robusto de exceções e validação de dados.
    """
    if not config_id:
        raise ValidationError("config_id é obrigatório")
    
    data = request.get_json()

    if not data:
        raise ValidationError('Dados não fornecidos')

    # Validar provider se fornecido
    if 'provider' in data:
        valid_providers = ['gemini', 'perplexity', 'openai', 'claude']
        if data['provider'] not in valid_providers:
            raise ValidationError(f'Provider inválido. Use: {", ".join(valid_providers)}')

    result = ai_config_service.update_ai_config(config_id, data)

    if not result.get('success'):
        raise NotFoundError(result.get('error', 'Configuração não encontrada ou erro ao atualizar'))

    return jsonify({
        'success': True,
        'data': result['data'],
        'message': 'Configuração atualizada com sucesso'
    }), 200

@admin_ai_bp.route('/configs/<config_id>', methods=['DELETE'])
@token_required
@admin_required
@rate_limit("10 per hour")
@log_activity('admin_ai_config_delete')
@handle_route_exceptions
def delete_ai_config(config_id):
    """
    Remove configuração de IA.
    
    Implementa tratamento robusto de exceções e validação de dados.
    """
    if not config_id:
        raise ValidationError("config_id é obrigatório")
    
    result = ai_config_service.delete_ai_config(config_id)

    if not result.get('success'):
        raise NotFoundError(result.get('error', 'Configuração não encontrada ou erro ao deletar'))

    return jsonify({
        'success': True,
        'message': result['message']
    }), 200

@admin_ai_bp.route('/configs/<config_id>/test', methods=['POST'])
@token_required
@admin_required
@rate_limit("10 per hour")
@log_activity('admin_ai_config_test')
@handle_route_exceptions
def test_ai_config(config_id):
    """
    Testa configuração de IA.
    
    Implementa tratamento robusto de exceções e validação de dados.
    """
    if not config_id:
        raise ValidationError("config_id é obrigatório")
    
    result = ai_config_service.test_ai_config(config_id)

    if not result.get('success'):
        raise ValidationError(result.get('error', 'Erro ao testar configuração'))

    return jsonify({
        'success': True,
        'data': result['data'],
        'message': 'Teste realizado com sucesso'
    }), 200

@admin_ai_bp.route('/usage-stats', methods=['GET'])
@token_required
@admin_required
@rate_limit("50 per hour")
@log_activity('admin_ai_usage_stats')
@handle_route_exceptions
def get_usage_stats():
    """
    Obtém estatísticas de uso das APIs de IA.
    
    Implementa tratamento robusto de exceções e validação de dados.
    """
    provider = request.args.get('provider')
    
    try:
        days = int(request.args.get('days', 30))
        if days < 1 or days > 365:
            raise ValidationError("days deve estar entre 1 e 365")
    except (ValueError, TypeError):
        raise ValidationError("days deve ser um número válido")

    # Calcular data de início
    from datetime import timedelta
    start_date = datetime.now() - timedelta(days=days)

    # Construir query
    query = ai_config_service.supabase.table('ai_usage_logs').select('*')
    query = query.gte('created_at', start_date.isoformat())

    if provider:
        # Join com ai_configurations para filtrar por provider
        query = query.eq('ai_configurations.provider', provider)

    result = query.execute()

    if result.data:
        # Processar estatísticas
        stats = {
            'total_requests': len(result.data),
            'successful_requests': len([r for r in result.data if r['success']]),
            'failed_requests': len([r for r in result.data if not r['success']]),
            'total_tokens': sum(r.get('tokens_used', 0) for r in result.data),
            'avg_response_time': (
                sum(r.get('response_time_ms', 0) for r in result.data) /
                len(result.data) if result.data else 0
            ),
            'requests_by_type': {},
            'requests_by_provider': {},
            'requests_by_day': {}
        }

        # Agrupar por tipo de requisição
        for log in result.data:
            req_type = log.get('request_type', 'unknown')
            stats['requests_by_type'][req_type] = stats['requests_by_type'].get(req_type, 0) + 1

        # Agrupar por dia
        for log in result.data:
            day = log['created_at'][:10]  # YYYY-MM-DD
            stats['requests_by_day'][day] = stats['requests_by_day'].get(day, 0) + 1

        return jsonify({
            'success': True,
            'data': stats,
            'period': f'{days} dias',
            'start_date': start_date.isoformat()
        }), 200
    else:
        return jsonify({
            'success': True,
            'data': {
                'total_requests': 0,
                'successful_requests': 0,
                'failed_requests': 0,
                'total_tokens': 0,
                'avg_response_time': 0,
                'requests_by_type': {},
                'requests_by_provider': {},
                'requests_by_day': {}
            },
            'period': f'{days} dias',
            'start_date': start_date.isoformat()
        }), 200

@admin_ai_bp.route('/health', methods=['GET'])
@token_required
@admin_required
@rate_limit("100 per hour")
@handle_route_exceptions
def admin_ai_health():
    """
    Health check do sistema de IA administrativo.
    
    Implementa tratamento robusto de exceções e validação de dados.
    """
    # Verificar configurações disponíveis
    configs_result = ai_config_service.list_ai_configs()

    health_data = {
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'ai_config_service': True,
        'encryption_service': True,
        'available_configs': (
            len(configs_result['data']) if configs_result.get('success') else 0
        ),
        'active_configs': (
            len([c for c in configs_result['data'] if c.get('is_active')])
            if configs_result.get('success') else 0
        ),
        'providers': (
            list(set(c['provider'] for c in configs_result['data']))
            if configs_result.get('success') else []
        )
    }

    return jsonify({
        'success': True,
        'data': health_data
    }), 200
