"""
Rotas de Relatórios Avançados RE-EDUCA Store.

Gerencia geração e agendamento de relatórios incluindo:
- Templates de relatórios
- Geração de relatórios customizados
- Agendamento de relatórios
- Exportação em múltiplos formatos (PDF, CSV, Excel, JSON)
"""

import logging
from flask import Blueprint, request, jsonify, Response
from services.report_service import ReportService
from utils.decorators import admin_required, log_activity
from utils.rate_limit_helper import rate_limit
from utils.exception_strategies import handle_route_exceptions
from exceptions.custom_exceptions import ValidationError

logger = logging.getLogger(__name__)

admin_reports_bp = Blueprint('admin_reports', __name__)
report_service = ReportService()


@admin_reports_bp.route('/templates', methods=['GET'])
@admin_required
@rate_limit("100 per hour")
@handle_route_exceptions
def get_report_templates():
    """
    Retorna templates de relatórios disponíveis.
    
    Returns:
        JSON: Lista de templates
    """
    templates = report_service.get_report_templates()
    return jsonify({"success": True, "templates": templates}), 200


@admin_reports_bp.route('/templates/<template_id>', methods=['GET'])
@admin_required
@rate_limit("100 per hour")
@handle_route_exceptions
def get_template(template_id: str):
    """
    Retorna template específico.
    
    Args:
        template_id: ID do template
        
    Returns:
        JSON: Template ou erro
    """
    template = report_service.get_template_by_id(template_id)
    if not template:
        raise ValidationError("Template não encontrado")
    
    return jsonify({"success": True, "template": template}), 200


@admin_reports_bp.route('/generate', methods=['POST'])
@admin_required
@rate_limit("20 per hour")
@log_activity('report_generated')
@handle_route_exceptions
def generate_report():
    """
    Gera relatório customizado.
    
    Request Body:
        report_type (str): Tipo (sales, users, products, all)
        period (str): Período (today, week, month, quarter, year)
        template_id (str, opcional): ID do template
        sections (list, opcional): Seções a incluir
        custom_filters (dict, opcional): Filtros customizados
        
    Returns:
        JSON: Dados do relatório
    """
    data = request.get_json() or {}
    
    report_type = data.get('report_type')
    if not report_type:
        raise ValidationError("report_type é obrigatório")
    
    valid_types = ['sales', 'users', 'products', 'all']
    if report_type not in valid_types:
        raise ValidationError(f"report_type deve ser um dos: {', '.join(valid_types)}")
    
    period = data.get('period', 'month')
    valid_periods = ['today', 'week', 'month', 'quarter', 'year']
    if period not in valid_periods:
        raise ValidationError(f"period deve ser um dos: {', '.join(valid_periods)}")
    
    result = report_service.generate_report(
        report_type=report_type,
        period=period,
        template_id=data.get('template_id'),
        sections=data.get('sections'),
        custom_filters=data.get('custom_filters'),
    )
    
    if not result.get('success'):
        raise ValidationError(result.get('error', 'Erro ao gerar relatório'))
    
    return jsonify(result), 200


@admin_reports_bp.route('/export', methods=['GET'])
@admin_required
@rate_limit("30 per hour")
@handle_route_exceptions
def export_report():
    """
    Exporta relatório em formato específico.
    
    Query Parameters:
        type (str): Tipo de relatório (sales, users, products, all)
        period (str): Período (today, week, month, quarter, year)
        format (str): Formato (pdf, csv, json, excel)
        template_id (str, opcional): ID do template
        
    Returns:
        Arquivo ou JSON conforme formato
    """
    report_type = request.args.get('type')
    if not report_type:
        raise ValidationError("type é obrigatório")
    
    period = request.args.get('period', 'month')
    export_format = request.args.get('format', 'json')
    template_id = request.args.get('template_id')
    
    # Gerar relatório
    result = report_service.generate_report(
        report_type=report_type,
        period=period,
        template_id=template_id,
    )
    
    if not result.get('success'):
        raise ValidationError(result.get('error', 'Erro ao gerar relatório'))
    
    report_data = result['report']
    
    # Exportar conforme formato
    if export_format == 'pdf':
        try:
            pdf_bytes = report_service.generate_pdf(report_data)
            return Response(
                pdf_bytes,
                mimetype='application/pdf',
                headers={'Content-Disposition': f'attachment; filename=report_{report_type}_{period}.pdf'}
            )
        except Exception as e:
            logger.error(f"Erro ao gerar PDF: {e}")
            raise ValidationError("Erro ao gerar PDF. Biblioteca não disponível.")
    
    elif export_format == 'csv':
        from flask import Response
        import csv
        import io
        
        output = io.StringIO()
        writer = csv.writer(output)
        
        # Escrever cabeçalho
        writer.writerow(['Métrica', 'Valor'])
        
        # Escrever métricas principais
        if 'sales' in report_data:
            sales = report_data['sales']
            metrics = sales.get('metrics', {})
            for key, value in metrics.items():
                writer.writerow([key, value])
        
        response = Response(
            output.getvalue(),
            mimetype='text/csv',
            headers={'Content-Disposition': f'attachment; filename=report_{report_type}_{period}.csv'}
        )
        return response
    
    elif export_format == 'json':
        return jsonify({
            'report_type': report_type,
            'period': period,
            'data': report_data
        }), 200
    
    else:
        raise ValidationError(f"Formato {export_format} não suportado")


@admin_reports_bp.route('/schedule', methods=['POST'])
@admin_required
@rate_limit("10 per hour")
@log_activity('report_scheduled')
@handle_route_exceptions
def schedule_report():
    """
    Agenda relatório para envio automático.
    
    Request Body:
        template_id (str): ID do template
        frequency (str): Frequência (daily, weekly, monthly)
        recipients (list): Lista de emails
        format (str): Formato (pdf, csv, json)
        start_date (str, opcional): Data de início
        
    Returns:
        JSON: Confirmação do agendamento
    """
    data = request.get_json() or {}
    
    template_id = data.get('template_id')
    if not template_id:
        raise ValidationError("template_id é obrigatório")
    
    frequency = data.get('frequency')
    if not frequency:
        raise ValidationError("frequency é obrigatório")
    
    valid_frequencies = ['daily', 'weekly', 'monthly']
    if frequency not in valid_frequencies:
        raise ValidationError(f"frequency deve ser um dos: {', '.join(valid_frequencies)}")
    
    recipients = data.get('recipients', [])
    if not recipients or not isinstance(recipients, list):
        raise ValidationError("recipients deve ser uma lista de emails")
    
    result = report_service.schedule_report(
        template_id=template_id,
        frequency=frequency,
        recipients=recipients,
        format=data.get('format', 'pdf'),
        start_date=data.get('start_date'),
    )
    
    if not result.get('success'):
        raise ValidationError(result.get('error', 'Erro ao agendar relatório'))
    
    return jsonify(result), 201


@admin_reports_bp.route('/schedule', methods=['GET'])
@admin_required
@rate_limit("100 per hour")
@handle_route_exceptions
def get_scheduled_reports():
    """
    Retorna todos os relatórios agendados.
    
    Query Parameters:
        active_only (bool): Se True, retorna apenas ativos
        
    Returns:
        JSON: Lista de agendamentos
    """
    active_only = request.args.get('active_only', 'false').lower() == 'true'
    schedules = report_service.get_scheduled_reports()
    
    if active_only:
        schedules = [s for s in schedules if s.get('is_active', False)]
    
    return jsonify({"success": True, "schedules": schedules}), 200


@admin_reports_bp.route('/schedule/<schedule_id>', methods=['DELETE'])
@admin_required
@rate_limit("10 per hour")
@log_activity('report_schedule_cancelled')
@handle_route_exceptions
def cancel_scheduled_report(schedule_id: str):
    """
    Cancela relatório agendado.
    
    Args:
        schedule_id: ID do agendamento
        
    Returns:
        JSON: Confirmação
    """
    result = report_service.cancel_scheduled_report(schedule_id)
    
    if not result.get('success'):
        raise ValidationError(result.get('error', 'Erro ao cancelar agendamento'))
    
    return jsonify(result), 200
