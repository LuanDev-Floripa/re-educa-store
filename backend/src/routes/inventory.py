"""
Rotas de Estoque RE-EDUCA Store.

Gerencia controle de estoque de produtos incluindo:
- Consulta de disponibilidade
- Atualização de estoque (admin)
- Reserva de produtos para pedidos
- Liberação de reservas
- Relatórios de movimentação

SEGURANÇA:
- Consultas: usuários autenticados
- Atualizações: apenas administradores
- Logs de todas as operações críticas
"""
from flask import Blueprint, request, jsonify
from services.inventory_service import InventoryService
from utils.decorators import token_required, admin_required, validate_json
from utils.rate_limit_helper import rate_limit
from utils.exception_strategies import handle_route_exceptions
from exceptions.custom_exceptions import ValidationError, NotFoundError, InternalServerError
from middleware.logging import log_user_activity, log_security_event
import logging

logger = logging.getLogger(__name__)

inventory_bp = Blueprint('inventory', __name__)
inventory_service = InventoryService()

@inventory_bp.route('/stock/<product_id>', methods=['GET'])
@token_required
@rate_limit("30 per minute")
@handle_route_exceptions
def get_product_stock(product_id):
    """
    Obtém estoque de um produto.
    
    Implementa tratamento robusto de exceções e validação de dados.

    Args:
        product_id (str): ID do produto.

    Returns:
        JSON: Quantidade em estoque e disponibilidade.
    """
    if not product_id:
        raise ValidationError("product_id é obrigatório")
    
    result = inventory_service.get_product_stock(product_id)

    if not result.get('success'):
        raise NotFoundError(result.get('error', 'Produto não encontrado'))

    return jsonify(result), 200

@inventory_bp.route('/stock/<product_id>/update', methods=['POST'])
@token_required
@admin_required
@rate_limit("20 per minute")
@validate_json('quantity', 'operation')
@handle_route_exceptions
def update_stock(product_id):
    """
    Atualiza estoque de um produto (admin only).
    
    Implementa tratamento robusto de exceções e validação de dados.
    """
    if not product_id:
        raise ValidationError("product_id é obrigatório")
    
    data = request.get_json()
    operation = data['operation']
    
    valid_operations = ['add', 'subtract', 'set']
    if operation not in valid_operations:
        raise ValidationError(f'operation deve ser um dos: {", ".join(valid_operations)}')
    
    try:
        quantity = int(data['quantity'])
        if quantity < 0:
            raise ValidationError("quantity deve ser maior ou igual a 0")
    except (ValueError, TypeError):
        raise ValidationError('Quantidade deve ser um número inteiro válido')

    result = inventory_service.update_stock(product_id, quantity, operation)

    if not result.get('success'):
        raise ValidationError(result.get('error', 'Erro ao atualizar estoque'))

    log_user_activity(request.current_user['id'], 'stock_updated', {
        'product_id': product_id,
        'operation': operation,
        'quantity': quantity,
        'new_stock': result['new_stock']
    })
    return jsonify(result), 200

@inventory_bp.route('/reserve', methods=['POST'])
@token_required
@rate_limit("10 per minute")
@validate_json('product_id', 'quantity')
@handle_route_exceptions
def reserve_stock():
    """
    Reserva estoque para um pedido.
    
    Implementa tratamento robusto de exceções e validação de dados.
    """
    data = request.get_json()
    product_id = data['product_id']
    order_id = data.get('order_id')
    
    try:
        quantity = int(data['quantity'])
        if quantity < 1:
            raise ValidationError("quantity deve ser maior que 0")
    except (ValueError, TypeError):
        raise ValidationError('Quantidade deve ser um número inteiro válido')

    result = inventory_service.reserve_stock(product_id, quantity, order_id)

    if not result.get('success'):
        raise ValidationError(result.get('error', 'Erro ao reservar estoque'))

    log_user_activity(request.current_user['id'], 'stock_reserved', {
        'product_id': product_id,
        'quantity': quantity,
        'reservation_id': result['reservation_id']
    })
    return jsonify(result), 200

@inventory_bp.route('/reserve/<reservation_id>/confirm', methods=['POST'])
@token_required
@rate_limit("10 per minute")
@handle_route_exceptions
def confirm_reservation(reservation_id):
    """
    Confirma reserva de estoque.
    
    Implementa tratamento robusto de exceções e validação de dados.
    """
    if not reservation_id:
        raise ValidationError("reservation_id é obrigatório")
    
    result = inventory_service.confirm_stock_reservation(reservation_id)

    if not result.get('success'):
        raise NotFoundError(result.get('error', 'Reserva não encontrada ou erro ao confirmar'))

    log_user_activity(request.current_user['id'], 'stock_reservation_confirmed', {
        'reservation_id': reservation_id
    })
    return jsonify(result), 200

@inventory_bp.route('/reserve/<reservation_id>/cancel', methods=['POST'])
@token_required
@rate_limit("10 per minute")
@handle_route_exceptions
def cancel_reservation(reservation_id):
    """
    Cancela reserva de estoque.
    
    Implementa tratamento robusto de exceções e validação de dados.
    """
    if not reservation_id:
        raise ValidationError("reservation_id é obrigatório")
    
    result = inventory_service.cancel_stock_reservation(reservation_id)

    if not result.get('success'):
        raise NotFoundError(result.get('error', 'Reserva não encontrada ou erro ao cancelar'))

    log_user_activity(request.current_user['id'], 'stock_reservation_cancelled', {
        'reservation_id': reservation_id
    })
    return jsonify(result), 200

@inventory_bp.route('/low-stock', methods=['GET'])
@token_required
@admin_required
@rate_limit("10 per minute")
@handle_route_exceptions
def get_low_stock_products():
    """
    Busca produtos com estoque baixo (admin only).
    
    Implementa tratamento robusto de exceções e validação de dados.
    """
    try:
        threshold = int(request.args.get('threshold', 10))
        if threshold < 0:
            raise ValidationError("threshold deve ser maior ou igual a 0")
    except (ValueError, TypeError):
        raise ValidationError('Threshold deve ser um número inteiro válido')

    result = inventory_service.get_low_stock_products(threshold)

    if not result.get('success'):
        raise ValidationError(result.get('error', 'Erro ao buscar produtos com estoque baixo'))

    return jsonify(result), 200

@inventory_bp.route('/movements', methods=['GET'])
@token_required
@admin_required
@rate_limit("20 per minute")
@handle_route_exceptions
def get_stock_movements():
    """
    Busca movimentações de estoque (admin only).
    
    Implementa tratamento robusto de exceções e validação de dados.
    """
    product_id = request.args.get('product_id')
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    
    try:
        page = int(request.args.get('page', 1))
        if page < 1:
            raise ValidationError("page deve ser maior que 0")
    except (ValueError, TypeError):
        raise ValidationError("page deve ser um número válido")
    
    try:
        limit = min(int(request.args.get('limit', 20)), 100)
        if limit < 1 or limit > 100:
            raise ValidationError("limit deve estar entre 1 e 100")
    except (ValueError, TypeError):
        raise ValidationError("limit deve ser um número válido")

    result = inventory_service.get_stock_movements(
        product_id=product_id,
        start_date=start_date,
        end_date=end_date,
        page=page,
        limit=limit
    )

    if not result.get('success'):
        raise ValidationError(result.get('error', 'Erro ao buscar movimentações'))

    return jsonify(result), 200

@inventory_bp.route('/report', methods=['GET'])
@token_required
@admin_required
@rate_limit("5 per minute")
@handle_route_exceptions
def get_inventory_report():
    """
    Gera relatório de estoque (admin only).
    
    Implementa tratamento robusto de exceções e validação de dados.
    """
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')

    result = inventory_service.get_inventory_report(start_date, end_date)

    if not result.get('success'):
        raise InternalServerError(result.get('error', 'Erro ao gerar relatório'))

    return jsonify(result), 200

@inventory_bp.route('/cleanup-reservations', methods=['POST'])
@token_required
@admin_required
@rate_limit("1 per hour")
@handle_route_exceptions
def cleanup_expired_reservations():
    """
    Limpa reservas expiradas (admin only).
    
    Implementa tratamento robusto de exceções e validação de dados.
    """
    result = inventory_service.cleanup_expired_reservations()

    if not result.get('success'):
        raise InternalServerError(result.get('error', 'Erro ao limpar reservas expiradas'))

    log_user_activity(request.current_user['id'], 'expired_reservations_cleaned', {
        'cancelled_count': result['cancelled_reservations']
    })
    return jsonify(result), 200

@inventory_bp.route('/alerts/settings', methods=['GET'])
@token_required
@admin_required
@rate_limit("20 per minute")
@handle_route_exceptions
def get_alert_settings():
    """
    Busca configurações de alertas de estoque (admin only).
    
    Implementa tratamento robusto de exceções e validação de dados.
    
    Query Parameters:
        product_id (str, optional): ID do produto para buscar configuração específica
    """
    product_id = request.args.get('product_id')
    
    result = inventory_service.get_alert_settings(product_id)
    
    if not result.get('success'):
        raise ValidationError(result.get('error', 'Erro ao buscar configurações de alerta'))
    
    return jsonify(result), 200

@inventory_bp.route('/alerts/settings', methods=['POST'])
@token_required
@admin_required
@rate_limit("10 per minute")
@validate_json('product_id', 'threshold')
@handle_route_exceptions
def create_or_update_alert_settings():
    """
    Cria ou atualiza configurações de alerta de estoque (admin only).
    
    Implementa tratamento robusto de exceções e validação de dados.
    
    Request Body:
        product_id (str): ID do produto (obrigatório)
        threshold (int): Threshold de estoque baixo (obrigatório)
        enabled (bool): Se alertas estão habilitados (opcional, padrão: true)
        notify_email (array): Lista de emails para notificar (opcional)
        notify_admins (bool): Se deve notificar admins (opcional, padrão: true)
    """
    data = request.get_json()
    product_id = data.get('product_id')
    
    if not product_id:
        raise ValidationError("product_id é obrigatório")
    
    try:
        threshold = int(data.get('threshold', 10))
        if threshold < 0:
            raise ValidationError("threshold deve ser maior ou igual a 0")
    except (ValueError, TypeError):
        raise ValidationError('threshold deve ser um número inteiro válido')
    
    settings_data = {
        'threshold': threshold,
        'enabled': data.get('enabled', True),
        'notify_email': data.get('notify_email', []),
        'notify_admins': data.get('notify_admins', True),
    }
    
    result = inventory_service.update_alert_settings(product_id, settings_data)
    
    if not result.get('success'):
        raise ValidationError(result.get('error', 'Erro ao salvar configurações de alerta'))
    
    log_user_activity(request.current_user['id'], 'alert_settings_updated', {
        'product_id': product_id,
        'threshold': threshold
    })
    
    return jsonify(result), 200

@inventory_bp.route('/alerts/history', methods=['GET'])
@token_required
@admin_required
@rate_limit("20 per minute")
@handle_route_exceptions
def get_alert_history():
    """
    Busca histórico de alertas de estoque (admin only).
    
    Implementa tratamento robusto de exceções e validação de dados.
    
    Query Parameters:
        product_id (str, optional): ID do produto para filtrar
        page (int): Página (padrão: 1)
        per_page (int): Itens por página (padrão: 20)
    """
    product_id = request.args.get('product_id')
    
    try:
        page = int(request.args.get('page', 1))
        if page < 1:
            raise ValidationError("page deve ser maior que 0")
    except (ValueError, TypeError):
        raise ValidationError("page deve ser um número válido")
    
    try:
        per_page = int(request.args.get('per_page', 20))
        if per_page < 1 or per_page > 100:
            raise ValidationError("per_page deve estar entre 1 e 100")
    except (ValueError, TypeError):
        raise ValidationError("per_page deve ser um número válido")
    
    result = inventory_service.get_alert_history(product_id, page, per_page)
    
    if not result.get('success'):
        raise ValidationError(result.get('error', 'Erro ao buscar histórico de alertas'))
    
    return jsonify(result), 200

@inventory_bp.route('/alerts/check', methods=['POST'])
@token_required
@admin_required
@rate_limit("5 per hour")
@handle_route_exceptions
def check_stock_alerts():
    """
    Executa verificação manual de estoque e envia alertas (admin only).
    
    Implementa tratamento robusto de exceções e validação de dados.
    
    Query Parameters:
        threshold (int, optional): Threshold para verificação (padrão: 10)
    """
    try:
        threshold = int(request.args.get('threshold', 10))
        if threshold < 0:
            raise ValidationError("threshold deve ser maior ou igual a 0")
    except (ValueError, TypeError):
        raise ValidationError('threshold deve ser um número inteiro válido')
    
    result = inventory_service.check_and_send_low_stock_alerts(threshold)
    
    if not result.get('success'):
        raise ValidationError(result.get('error', 'Erro ao verificar estoque'))
    
    log_user_activity(request.current_user['id'], 'stock_alerts_checked', {
        'threshold': threshold,
        'alerts_sent': result.get('alerts_sent', 0)
    })
    
    return jsonify(result), 200

@inventory_bp.route('/alerts/worker/status', methods=['GET'])
@token_required
@admin_required
@rate_limit("30 per hour")
@handle_route_exceptions
def get_worker_status():
    """
    Retorna status do worker de alertas de estoque (admin only).
    
    Returns:
        JSON: Status do worker (running, stats, etc)
    """
    try:
        from workers.inventory_alert_worker import inventory_alert_worker
        
        stats = inventory_alert_worker.get_stats()
        
        return jsonify({
            "success": True,
            "worker": stats
        }), 200
    except Exception as e:
        logger.error(f"Erro ao obter status do worker: {str(e)}", exc_info=True)
        return jsonify({
            "success": False,
            "error": "Worker não disponível",
            "message": "O worker pode não estar em execução"
        }), 503
