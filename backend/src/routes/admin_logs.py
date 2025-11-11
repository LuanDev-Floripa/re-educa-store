"""
Rotas Administrativas de Logs e Auditoria RE-EDUCA Store.

Fornece endpoints para visualização de logs de atividades e segurança.
"""
from flask import Blueprint, request, jsonify
from services.admin_logs_service import AdminLogsService
from utils.decorators import admin_required
from utils.rate_limit_helper import rate_limit
from utils.exception_strategies import handle_route_exceptions
from exceptions.custom_exceptions import ValidationError
import logging

logger = logging.getLogger(__name__)

admin_logs_bp = Blueprint('admin_logs', __name__, url_prefix='/api/admin/logs')
admin_logs_service = AdminLogsService()

@admin_logs_bp.route('/activity', methods=['GET'])
@admin_required
@rate_limit("100 per hour")
@handle_route_exceptions
def get_activity_logs():
    """
    Busca logs de atividades de usuários.
    
    Query Parameters:
        user_id (str, optional): Filtrar por usuário
        activity_type (str, optional): Filtrar por tipo de atividade
        start_date (str, optional): Data inicial (ISO format)
        end_date (str, optional): Data final (ISO format)
        page (int): Página (padrão: 1)
        per_page (int): Itens por página (padrão: 20, máx: 100)
    """
    try:
        page = int(request.args.get('page', 1))
        if page < 1:
            raise ValidationError("page deve ser maior que 0")
    except (ValueError, TypeError):
        raise ValidationError("page deve ser um número válido")
    
    try:
        per_page = min(int(request.args.get('per_page', 20)), 100)
        if per_page < 1 or per_page > 100:
            raise ValidationError("per_page deve estar entre 1 e 100")
    except (ValueError, TypeError):
        raise ValidationError("per_page deve ser um número válido")
    
    user_id = request.args.get('user_id')
    activity_type = request.args.get('activity_type')
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    
    result = admin_logs_service.get_activity_logs(
        user_id=user_id,
        activity_type=activity_type,
        start_date=start_date,
        end_date=end_date,
        page=page,
        per_page=per_page
    )
    
    return jsonify(result), 200

@admin_logs_bp.route('/security', methods=['GET'])
@admin_required
@rate_limit("100 per hour")
@handle_route_exceptions
def get_security_logs():
    """
    Busca logs de segurança.
    
    Query Parameters:
        user_id (str, optional): Filtrar por usuário
        event_type (str, optional): Filtrar por tipo de evento
        severity (str, optional): Filtrar por severidade (low, medium, high, critical)
        resolved (bool, optional): Filtrar por resolvido/não resolvido
        start_date (str, optional): Data inicial (ISO format)
        end_date (str, optional): Data final (ISO format)
        page (int): Página (padrão: 1)
        per_page (int): Itens por página (padrão: 20, máx: 100)
    """
    try:
        page = int(request.args.get('page', 1))
        if page < 1:
            raise ValidationError("page deve ser maior que 0")
    except (ValueError, TypeError):
        raise ValidationError("page deve ser um número válido")
    
    try:
        per_page = min(int(request.args.get('per_page', 20)), 100)
        if per_page < 1 or per_page > 100:
            raise ValidationError("per_page deve estar entre 1 e 100")
    except (ValueError, TypeError):
        raise ValidationError("per_page deve ser um número válido")
    
    user_id = request.args.get('user_id')
    event_type = request.args.get('event_type')
    severity = request.args.get('severity')
    resolved = request.args.get('resolved')
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    
    # Converter resolved de string para boolean
    resolved_bool = None
    if resolved is not None:
        resolved_bool = resolved.lower() in ('true', '1', 'yes')
    
    result = admin_logs_service.get_security_logs(
        user_id=user_id,
        event_type=event_type,
        severity=severity,
        resolved=resolved_bool,
        start_date=start_date,
        end_date=end_date,
        page=page,
        per_page=per_page
    )
    
    return jsonify(result), 200

@admin_logs_bp.route('/security/<log_id>/resolve', methods=['PUT', 'PATCH'])
@admin_required
@rate_limit("50 per hour")
@handle_route_exceptions
def resolve_security_log(log_id):
    """
    Marca um log de segurança como resolvido.
    
    Args:
        log_id (str): ID do log de segurança
    """
    if not log_id:
        raise ValidationError("log_id é obrigatório")
    
    admin_id = request.current_user.get('id') if hasattr(request, 'current_user') else None
    
    result = admin_logs_service.resolve_security_log(log_id, admin_id)
    
    if not result.get('success'):
        raise ValidationError(result.get('error', 'Erro ao resolver log'))
    
    return jsonify(result), 200

@admin_logs_bp.route('/stats', methods=['GET'])
@admin_required
@rate_limit("50 per hour")
@handle_route_exceptions
def get_logs_stats():
    """
    Retorna estatísticas de logs.
    
    Query Parameters:
        start_date (str, optional): Data inicial (ISO format)
        end_date (str, optional): Data final (ISO format)
    """
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    
    result = admin_logs_service.get_logs_stats(start_date, end_date)
    
    return jsonify(result), 200

@admin_logs_bp.route('/export', methods=['GET'])
@admin_required
@rate_limit("10 per hour")
@handle_route_exceptions
def export_logs():
    """
    Exporta logs em formato CSV ou JSON.
    
    Query Parameters:
        type (str): Tipo de log (activity, security, all) - obrigatório
        format (str): Formato (csv, json) - padrão: json
        start_date (str, optional): Data inicial (ISO format)
        end_date (str, optional): Data final (ISO format)
    """
    from flask import Response
    import csv
    import io
    
    log_type = request.args.get('type')
    if not log_type:
        raise ValidationError("type é obrigatório (activity, security, all)")
    
    valid_types = ['activity', 'security', 'all']
    if log_type not in valid_types:
        raise ValidationError(f"type deve ser um dos: {', '.join(valid_types)}")
    
    export_format = request.args.get('format', 'json')
    valid_formats = ['csv', 'json']
    if export_format not in valid_formats:
        raise ValidationError(f"format deve ser um dos: {', '.join(valid_formats)}")
    
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    
    # Buscar logs
    if log_type in ['activity', 'all']:
        activity_logs = admin_logs_service.get_activity_logs(
            start_date=start_date,
            end_date=end_date,
            page=1,
            per_page=10000  # Limite alto para exportação
        )
    else:
        activity_logs = {'logs': [], 'total': 0}
    
    if log_type in ['security', 'all']:
        security_logs = admin_logs_service.get_security_logs(
            start_date=start_date,
            end_date=end_date,
            page=1,
            per_page=10000
        )
    else:
        security_logs = {'logs': [], 'total': 0}
    
    if export_format == 'csv':
        output = io.StringIO()
        writer = csv.writer(output)
        
        if log_type in ['activity', 'all']:
            writer.writerow(['Tipo', 'ID', 'User ID', 'Activity Type', 'Description', 'IP Address', 'Created At'])
            for log in activity_logs.get('logs', []):
                writer.writerow([
                    'Activity',
                    log.get('id'),
                    log.get('user_id'),
                    log.get('activity_type'),
                    log.get('activity_description'),
                    log.get('ip_address'),
                    log.get('created_at')
                ])
        
        if log_type in ['security', 'all']:
            if log_type == 'all':
                writer.writerow([])  # Linha em branco
            writer.writerow(['Tipo', 'ID', 'User ID', 'Event Type', 'Severity', 'Description', 'Resolved', 'IP Address', 'Created At'])
            for log in security_logs.get('logs', []):
                writer.writerow([
                    'Security',
                    log.get('id'),
                    log.get('user_id'),
                    log.get('event_type'),
                    log.get('severity'),
                    log.get('event_description'),
                    log.get('resolved'),
                    log.get('ip_address'),
                    log.get('created_at')
                ])
        
        response = Response(
            output.getvalue(),
            mimetype='text/csv',
            headers={'Content-Disposition': f'attachment; filename=logs_{log_type}_{start_date or "all"}.csv'}
        )
        return response
    else:
        return jsonify({
            'type': log_type,
            'activity_logs': activity_logs.get('logs', []),
            'security_logs': security_logs.get('logs', []),
            'total_activity': activity_logs.get('total', 0),
            'total_security': security_logs.get('total', 0)
        }), 200
