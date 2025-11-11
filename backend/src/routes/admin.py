"""
Rotas administrativas RE-EDUCA Store.

Fornece endpoints para gerenciamento administrativo incluindo:
- Dashboard e estatísticas
- Gestão de usuários
- Analytics de vendas, usuários e produtos
- Gestão de pedidos
"""
from flask import Blueprint, request, jsonify
from datetime import datetime
from services.admin_service import AdminService
from services.analytics_service import AnalyticsService
from utils.decorators import admin_required, log_activity
from utils.rate_limit_helper import rate_limit
from utils.exception_strategies import handle_route_exceptions
from exceptions.custom_exceptions import ValidationError, NotFoundError
import logging

logger = logging.getLogger(__name__)

admin_bp = Blueprint('admin', __name__)
admin_service = AdminService()
analytics_service = AnalyticsService()

@admin_bp.route('/dashboard', methods=['GET'])
@admin_required
@handle_route_exceptions
def get_dashboard_stats():
    """
    Retorna estatísticas do dashboard admin.

    Implementa tratamento robusto de exceções e validação de dados.

    Returns:
        JSON: Estatísticas gerais do dashboard ou erro.
    """
    stats = admin_service.get_dashboard_stats()
    return jsonify(stats), 200

@admin_bp.route('/users', methods=['GET'])
@admin_required
@rate_limit("100 per hour")
@handle_route_exceptions
def get_all_users():
    """
    Retorna todos os usuários (admin).

    Implementa tratamento robusto de exceções e validação de dados.

    Query Parameters:
        page (int): Página de resultados (padrão: 1).
        per_page (int): Itens por página (padrão: 20).
        search (str): Termo de busca opcional.

    Returns:
        JSON: Lista de usuários paginada ou erro.
    """
    try:
        page = int(request.args.get('page', 1))
        if page < 1:
            raise ValidationError("page deve ser maior que 0")
    except (ValueError, TypeError):
        raise ValidationError("page deve ser um número válido")
    
    try:
        per_page = int(request.args.get('per_page', 20))
        if per_page < 1:
            raise ValidationError("per_page deve ser maior que 0")
    except (ValueError, TypeError):
        raise ValidationError("per_page deve ser um número válido")
    
    search = request.args.get('search')

    users = admin_service.get_all_users(page, per_page, search)
    return jsonify(users), 200

@admin_bp.route('/users', methods=['POST'])
@admin_required
@rate_limit("20 per hour")
@log_activity('user_created')
@handle_route_exceptions
def create_user():
    """
    Cria novo usuário (admin).
    
    Request Body:
        name (str): Nome completo
        email (str): Email válido
        password (str): Senha (mínimo 8 caracteres)
        role (str, opcional): Role (padrão: user)
        
    Returns:
        JSON: Usuário criado ou erro
    """
    data = request.get_json()
    if not data:
        raise ValidationError("Dados são obrigatórios")
    
    from services.auth_service import AuthService
    auth_service = AuthService()
    
    # Criar usuário usando auth_service
    result = auth_service.register_user({
        'name': data.get('name'),
        'email': data.get('email'),
        'password': data.get('password'),
    })
    
    if not result.get('success'):
        raise ValidationError(result.get('error', 'Erro ao criar usuário'))
    
    # Atualizar role se fornecido
    user_id = result['user']['id']
    if data.get('role'):
        from services.user_service import UserService
        user_service = UserService()
        user_service.update_user_profile(user_id, {'role': data.get('role')})
    
    return jsonify({
        'message': 'Usuário criado com sucesso',
        'user': result['user']
    }), 201

@admin_bp.route('/users/<user_id>/reset-password', methods=['POST'])
@admin_required
@rate_limit("10 per hour")
@log_activity('password_reset_by_admin')
@handle_route_exceptions
def reset_user_password(user_id: str):
    """
    Reseta senha de usuário (admin).
    
    Request Body:
        new_password (str): Nova senha (opcional, gera aleatória se não fornecido)
        send_email (bool): Se deve enviar email com nova senha (padrão: true)
        
    Returns:
        JSON: Nova senha ou confirmação
    """
    data = request.get_json() or {}
    from services.auth_service import AuthService
    from utils.helpers import generate_random_string
    
    auth_service = AuthService()
    
    # Gerar senha aleatória se não fornecida
    new_password = data.get('new_password')
    if not new_password:
        new_password = generate_random_string(12)
    
    # Validar senha
    from utils.validators import user_validator
    password_validation = user_validator.validate_password(new_password)
    if not password_validation['valid']:
        raise ValidationError('Senha inválida', details=password_validation['errors'])
    
    # Atualizar senha diretamente no banco (admin pode resetar sem senha atual)
    from repositories.user_repository import UserRepository
    from utils.encryption import hash_password
    
    user_repo = UserRepository()
    user = user_repo.find_by_id(user_id)
    if not user:
        raise NotFoundError('Usuário não encontrado')
    
    # Atualizar senha
    hashed_password = hash_password(new_password)
    user_repo.update(user_id, {'password': hashed_password})
    
    # Enviar email se solicitado
    if data.get('send_email', True):
        from services.email_service import EmailService
        email_service = EmailService()
        email_service.send_new_password_email(
            user['email'],
            user.get('name', user.get('email', 'Usuário')),
            new_password
        )
    
    return jsonify({
        'message': 'Senha resetada com sucesso',
        'new_password': new_password if not data.get('send_email', True) else None,
        'email_sent': data.get('send_email', True)
    }), 200

@admin_bp.route('/users/export', methods=['GET'])
@admin_required
@rate_limit("10 per hour")
@handle_route_exceptions
def export_users():
    """
    Exporta lista de usuários em CSV ou JSON.
    
    Query Parameters:
        format (str): Formato (csv, json) - padrão: json
        filter_role (str, opcional): Filtrar por role
        filter_status (str, opcional): Filtrar por status
        
    Returns:
        Arquivo CSV ou JSON
    """
    from flask import Response
    import csv
    import io
    
    export_format = request.args.get('format', 'json')
    filter_role = request.args.get('filter_role')
    filter_status = request.args.get('filter_status')
    
    # Buscar usuários usando user_repo diretamente
    from repositories.user_repository import UserRepository
    user_repo = UserRepository()
    users_list = user_repo.find_all()
    
    # Aplicar filtros
    if filter_role:
        users_list = [u for u in users_list if u.get('role') == filter_role]
    if filter_status:
        users_list = [u for u in users_list if u.get('status') == filter_status]
    
    if export_format == 'csv':
        output = io.StringIO()
        writer = csv.writer(output)
        
        # Cabeçalho
        writer.writerow(['ID', 'Nome', 'Email', 'Role', 'Status', 'Verificado', 'Criado em'])
        
        # Dados
        for user in users_list:
            writer.writerow([
                user.get('id', ''),
                user.get('name', ''),
                user.get('email', ''),
                user.get('role', ''),
                user.get('status', ''),
                'Sim' if user.get('is_verified') else 'Não',
                user.get('created_at', ''),
            ])
        
        response = Response(
            output.getvalue(),
            mimetype='text/csv',
            headers={'Content-Disposition': 'attachment; filename=users_export.csv'}
        )
        return response
    else:
        return jsonify({
            'users': users_list,
            'total': len(users_list)
        }), 200

@admin_bp.route('/analytics', methods=['GET'])
@admin_required
@handle_route_exceptions
def get_analytics():
    """
    Retorna analytics gerais (admin) - DEPRECATED, use /analytics/sales.
    
    Implementa tratamento robusto de exceções e validação de dados.
    """
    period = request.args.get('period', '30')  # dias
    
    try:
        period_int = int(period)
        if period_int < 1:
            raise ValidationError("period deve ser maior que 0")
    except (ValueError, TypeError):
        raise ValidationError("period deve ser um número válido")
    
    analytics = admin_service.get_analytics(period_int)
    return jsonify(analytics), 200

@admin_bp.route('/analytics/sales', methods=['GET'])
@admin_required
@handle_route_exceptions
def get_sales_analytics():
    """
    Retorna analytics detalhado de vendas.
    
    Implementa tratamento robusto de exceções e validação de dados.
    """
    period = request.args.get('period', 'month')  # today, week, month, quarter, year
    
    valid_periods = ['today', 'week', 'month', 'quarter', 'year']
    if period not in valid_periods:
        raise ValidationError(f"period deve ser um dos: {', '.join(valid_periods)}")
    
    analytics = analytics_service.get_sales_analytics(period)
    return jsonify(analytics), 200

@admin_bp.route('/analytics/users', methods=['GET'])
@admin_required
@handle_route_exceptions
def get_users_analytics():
    """
    Retorna analytics detalhado de usuários.
    
    Implementa tratamento robusto de exceções e validação de dados.
    """
    period = request.args.get('period', 'month')  # today, week, month, quarter, year
    
    valid_periods = ['today', 'week', 'month', 'quarter', 'year']
    if period not in valid_periods:
        raise ValidationError(f"period deve ser um dos: {', '.join(valid_periods)}")
    
    analytics = analytics_service.get_users_analytics(period)
    return jsonify(analytics), 200

@admin_bp.route('/analytics/products', methods=['GET'])
@admin_required
@handle_route_exceptions
def get_products_analytics():
    """
    Retorna analytics detalhado de produtos.
    
    Implementa tratamento robusto de exceções e validação de dados.
    """
    period = request.args.get('period', 'month')  # today, week, month, quarter, year
    
    valid_periods = ['today', 'week', 'month', 'quarter', 'year']
    if period not in valid_periods:
        raise ValidationError(f"period deve ser um dos: {', '.join(valid_periods)}")
    
    analytics = analytics_service.get_products_analytics(period)
    return jsonify(analytics), 200

@admin_bp.route('/orders', methods=['GET'])
@admin_required
@handle_route_exceptions
def get_all_orders():
    """
    Retorna todos os pedidos (admin).
    
    Implementa tratamento robusto de exceções e validação de dados.
    """
    try:
        page = int(request.args.get('page', 1))
        if page < 1:
            raise ValidationError("page deve ser maior que 0")
    except (ValueError, TypeError):
        raise ValidationError("page deve ser um número válido")
    
    try:
        per_page = int(request.args.get('per_page', 20))
        if per_page < 1:
            raise ValidationError("per_page deve ser maior que 0")
    except (ValueError, TypeError):
        raise ValidationError("per_page deve ser um número válido")
    
    status = request.args.get('status')

    orders = admin_service.get_all_orders(page, per_page, status)
    return jsonify(orders), 200

@admin_bp.route('/orders/<order_id>/cancel', methods=['POST'])
@admin_required
@rate_limit("10 per hour")
@log_activity('order_cancelled_by_admin')
@handle_route_exceptions
def cancel_order(order_id: str):
    """
    Cancela um pedido (admin).
    
    Request Body:
        reason (str, opcional): Motivo do cancelamento
        refund (bool): Se deve processar reembolso (padrão: true)
        
    Returns:
        JSON: Confirmação do cancelamento
    """
    from services.order_service import OrderService
    
    order_service = OrderService()
    admin_id = request.current_user.get('id') if hasattr(request, 'current_user') else None
    
    data = request.get_json() or {}
    reason = data.get('reason', 'Cancelado pelo administrador')
    should_refund = data.get('refund', True)
    
    # Cancelar pedido (admin pode cancelar qualquer pedido)
    # Buscar pedido diretamente sem validação de user_id
    order = order_service.repo.find_by_id(order_id)
    if not order:
        raise NotFoundError("Pedido não encontrado")
    
    if order.get("status") in ["cancelled", "completed", "refunded"]:
        raise ValidationError("Pedido não pode ser cancelado neste status")
    
    # Atualizar status
    updated = order_service.repo.update(order_id, {
        "status": "cancelled",
        "cancellation_reason": reason,
        "updated_at": datetime.now().isoformat()
    })
    
    if not updated:
        raise ValidationError("Erro ao cancelar pedido")
    
    result = {"success": True, "message": "Pedido cancelado com sucesso", "order": updated}
    
    # Processar reembolso se solicitado
    if should_refund and result.get('order', {}).get('status') == 'cancelled':
        from services.payment_service import PaymentService
        payment_service = PaymentService()
        
        order = result.get('order', {})
        payment_id = order.get('payment_id')
        
        if payment_id:
            refund_result = payment_service.process_refund(payment_id, order.get('total', 0))
            if refund_result.get('success'):
                result['refund'] = refund_result
    
    return jsonify(result), 200

@admin_bp.route('/orders/<order_id>/refund', methods=['POST'])
@admin_required
@rate_limit("10 per hour")
@log_activity('order_refunded')
@handle_route_exceptions
def refund_order(order_id: str):
    """
    Processa reembolso de um pedido (admin).
    
    Request Body:
        amount (float, opcional): Valor a reembolsar (padrão: total do pedido)
        reason (str, opcional): Motivo do reembolso
        
    Returns:
        JSON: Confirmação do reembolso
    """
    from services.order_service import OrderService
    from services.payment_service import PaymentService
    
    order_service = OrderService()
    payment_service = PaymentService()
    admin_id = request.current_user.get('id') if hasattr(request, 'current_user') else None
    
    # Buscar pedido
    order = order_service.repo.find_by_id(order_id)
    if not order:
        raise NotFoundError("Pedido não encontrado")
    
    data = request.get_json() or {}
    amount = data.get('amount', order.get('total', 0))
    reason = data.get('reason', 'Reembolso processado pelo administrador')
    
    # Validar valor
    if amount <= 0 or amount > order.get('total', 0):
        raise ValidationError("Valor de reembolso inválido")
    
    # Processar reembolso
    payment_id = order.get('payment_id')
    if not payment_id:
        raise ValidationError("Pedido não possui pagamento associado")
    
    refund_result = payment_service.process_refund(payment_id, amount)
    
    if not refund_result.get('success'):
        raise ValidationError(refund_result.get('error', 'Erro ao processar reembolso'))
    
    # Atualizar status do pedido
    order_service.repo.update(order_id, {
        'status': 'refunded',
        'refund_amount': amount,
        'refund_reason': reason
    })
    
    log_user_activity(admin_id, 'order_refunded', {
        'order_id': order_id,
        'amount': amount,
        'reason': reason
    })
    
    return jsonify({
        'success': True,
        'message': 'Reembolso processado com sucesso',
        'refund': refund_result,
        'order_id': order_id
    }), 200

@admin_bp.route('/orders/<order_id>/items', methods=['PUT'])
@admin_required
@rate_limit("10 per hour")
@log_activity('order_items_updated')
@handle_route_exceptions
def update_order_items(order_id: str):
    """
    Edita itens de um pedido (admin).
    
    Request Body:
        items (list): Lista de itens atualizados
        recalculate_total (bool): Se deve recalcular total (padrão: true)
        
    Returns:
        JSON: Pedido atualizado
    """
    from services.order_service import OrderService
    
    order_service = OrderService()
    admin_id = request.current_user.get('id') if hasattr(request, 'current_user') else None
    
    data = request.get_json()
    if not data:
        raise ValidationError("Dados são obrigatórios")
    
    items = data.get('items', [])
    if not items or not isinstance(items, list):
        raise ValidationError("items deve ser uma lista não vazia")
    
    recalculate_total = data.get('recalculate_total', True)
    
    # Buscar pedido
    order = order_service.repo.find_by_id(order_id)
    if not order:
        raise NotFoundError("Pedido não encontrado")
    
    # Validar que pedido pode ser editado
    if order.get('status') in ['completed', 'cancelled', 'refunded']:
        raise ValidationError("Pedido não pode ser editado neste status")
    
    # Atualizar itens
    from repositories.order_item_repository import OrderItemRepository
    order_item_repo = OrderItemRepository()
    
    # Remover itens antigos
    existing_items = order_item_repo.find_by_order(order_id)
    for item in existing_items:
        order_item_repo.delete(item['id'])
    
    # Adicionar novos itens
    total = 0
    for item in items:
        item_data = {
            'order_id': order_id,
            'product_id': item.get('product_id'),
            'quantity': item.get('quantity', 1),
            'price': item.get('price', 0),
        }
        order_item_repo.create(item_data)
        total += item_data['price'] * item_data['quantity']
    
    # Atualizar total do pedido
    if recalculate_total:
        order_service.repo.update(order_id, {'total': total})
    
    log_user_activity(admin_id, 'order_items_updated', {
        'order_id': order_id,
        'items_count': len(items),
        'new_total': total
    })
    
    # Buscar pedido atualizado
    updated_order = order_service.get_order(order_id, None)  # Admin pode ver qualquer pedido
    
    return jsonify({
        'success': True,
        'message': 'Itens do pedido atualizados com sucesso',
        'order': updated_order
    }), 200

@admin_bp.route('/orders/<order_id>/tracking', methods=['PUT', 'PATCH'])
@admin_required
@handle_route_exceptions
def update_order_tracking(order_id):
    """
    Atualiza código de rastreamento de um pedido (admin).
    Detecta automaticamente a transportadora e cria evento inicial no histórico.
    
    Request Body:
        JSON com tracking_number (obrigatório).
    """
    from services.order_service import OrderService
    
    order_service = OrderService()
    admin_id = request.current_user.get('id') if hasattr(request, 'current_user') else None
    
    data = request.get_json()
    if not data:
        raise ValidationError("Dados são obrigatórios")
    
    tracking_number = data.get('tracking_number')
    if not tracking_number:
        raise ValidationError("tracking_number é obrigatório")
    
    if not isinstance(tracking_number, str) or not tracking_number.strip():
        raise ValidationError("tracking_number deve ser uma string não vazia")
    
    result = order_service.update_order_tracking(order_id, tracking_number.strip(), admin_id)
    
    if not result.get('success'):
        raise ValidationError(result.get('error', 'Erro ao atualizar código de rastreamento'))
    
    return jsonify(result), 200

@admin_bp.route('/orders/<order_id>/tracking/history', methods=['POST'])
@admin_required
@handle_route_exceptions
def add_tracking_event(order_id):
    """
    Adiciona evento manual ao histórico de rastreamento (admin).
    
    Request Body:
        event_type (str): Tipo de evento (created, in_transit, out_for_delivery, delivered, exception)
        event_description (str): Descrição do evento
        location (str, optional): Local do evento
        event_date (str, optional): Data do evento (ISO format, padrão: agora)
        metadata (dict, optional): Dados adicionais
    """
    from services.order_service import OrderService
    from repositories.tracking_history_repository import TrackingHistoryRepository
    
    order_service = OrderService()
    admin_id = request.current_user.get('id') if hasattr(request, 'current_user') else None
    
    # Verificar se pedido existe e pertence ao sistema
    order = order_service.repo.find_by_id(order_id)
    if not order:
        raise NotFoundError("Pedido não encontrado")
    
    data = request.get_json()
    if not data:
        raise ValidationError("Dados são obrigatórios")
    
    event_type = data.get('event_type')
    event_description = data.get('event_description')
    
    if not event_type or not event_description:
        raise ValidationError("event_type e event_description são obrigatórios")
    
    tracking_number = order.get('tracking_number')
    if not tracking_number:
        raise ValidationError("Pedido não possui código de rastreamento")
    
    tracking_repo = TrackingHistoryRepository()
    event = tracking_repo.create_event(
        order_id=order_id,
        tracking_number=tracking_number,
        event_type=event_type,
        event_description=event_description,
        location=data.get('location'),
        event_date=data.get('event_date'),
        carrier=order.get('carrier'),
        source="admin",
        metadata=data.get('metadata'),
    )
    
    if not event:
        raise ValidationError("Erro ao criar evento de rastreamento")
    
    return jsonify({
        "success": True,
        "message": "Evento de rastreamento adicionado com sucesso",
        "event": event
    }), 201

@admin_bp.route('/reports/export', methods=['GET'])
@admin_required
@handle_route_exceptions
def export_report():
    """
    Exporta relatório em formato CSV ou JSON.
    
    Implementa tratamento robusto de exceções e validação de dados.
    
    Query Parameters:
        type (str): Tipo de relatório (sales, users, products) - obrigatório.
        format (str): Formato de exportação (csv, json) - padrão: json.
        period (str): Período (today, week, month, quarter, year) - padrão: month.
    """
    from flask import Response
    import csv
    import io
    
    report_type = request.args.get('type')
    if not report_type:
        raise ValidationError("type é obrigatório (sales, users, products)")
    
    valid_types = ['sales', 'users', 'products']
    if report_type not in valid_types:
        raise ValidationError(f"type deve ser um dos: {', '.join(valid_types)}")
    
    export_format = request.args.get('format', 'json')
    valid_formats = ['csv', 'json']
    if export_format not in valid_formats:
        raise ValidationError(f"format deve ser um dos: {', '.join(valid_formats)}")
    
    period = request.args.get('period', 'month')
    valid_periods = ['today', 'week', 'month', 'quarter', 'year']
    if period not in valid_periods:
        raise ValidationError(f"period deve ser um dos: {', '.join(valid_periods)}")
    
    # Gerar relatório
    if report_type == 'sales':
        data = analytics_service.get_sales_analytics(period)
        report_data = data.get('metrics', {})
        report_data['sales_by_day'] = data.get('sales_by_day', [])
        report_data['top_products'] = data.get('top_products', [])
    elif report_type == 'users':
        data = analytics_service.get_users_analytics(period)
        report_data = data.get('metrics', {})
        report_data['users_by_day'] = data.get('users_by_day', [])
        report_data['top_active_users'] = data.get('top_active_users', [])
    elif report_type == 'products':
        data = analytics_service.get_products_analytics(period)
        report_data = data.get('metrics', {})
        report_data['top_products'] = data.get('top_products', [])
        report_data['low_stock_products'] = data.get('low_stock_products', [])
        report_data['category_sales'] = data.get('category_sales', [])
    else:
        report_data = {}
    
    if export_format == 'csv':
        # Gerar CSV
        output = io.StringIO()
        writer = csv.writer(output)
        
        # Escrever cabeçalho
        writer.writerow(['Métrica', 'Valor'])
        
        # Escrever métricas principais
        for key, value in report_data.items():
            if isinstance(value, (dict, list)):
                continue
            writer.writerow([key, value])
        
        # Escrever dados tabulares se existirem
        if 'sales_by_day' in report_data:
            writer.writerow([])
            writer.writerow(['Data', 'Receita', 'Pedidos'])
            for day in report_data['sales_by_day']:
                writer.writerow([day.get('date'), day.get('revenue'), day.get('orders')])
        
        if 'top_products' in report_data:
            writer.writerow([])
            writer.writerow(['Produto', 'Quantidade', 'Receita'])
            for product in report_data['top_products']:
                writer.writerow([
                    product.get('name', 'N/A'),
                    product.get('quantity', product.get('quantity_sold', 0)),
                    product.get('revenue', 0)
                ])
        
        response = Response(
            output.getvalue(),
            mimetype='text/csv',
            headers={'Content-Disposition': f'attachment; filename=report_{report_type}_{period}.csv'}
        )
        return response
    else:
        # Retornar JSON
        return jsonify({
            'report_type': report_type,
            'period': period,
            'data': report_data
        }), 200

@admin_bp.route('/dashboard/system-metrics', methods=['GET'])
@admin_required
@handle_route_exceptions
def get_system_metrics():
    """
    Retorna métricas de sistema (monitoring).
    
    Implementa tratamento robusto de exceções e validação de dados.
    """
    from services.monitoring_service import MonitoringService
    
    monitoring_service = MonitoringService()
    metrics = monitoring_service.get_all_metrics()
    
    return jsonify(metrics), 200
