"""
Rotas administrativas RE-EDUCA Store
"""
from flask import Blueprint, request, jsonify
from services.admin_service import AdminService
from services.analytics_service import AnalyticsService
from utils.decorators import admin_required, log_activity
from middleware.logging import log_user_activity

admin_bp = Blueprint('admin', __name__)
admin_service = AdminService()
analytics_service = AnalyticsService()

@admin_bp.route('/dashboard', methods=['GET'])
@admin_required
def get_dashboard_stats():
    """Retorna estatísticas do dashboard admin"""
    try:
        stats = admin_service.get_dashboard_stats()
        return jsonify(stats), 200
    except Exception as e:
        return jsonify({'error': 'Erro interno do servidor'}), 500

@admin_bp.route('/users', methods=['GET'])
@admin_required
def get_all_users():
    """Retorna todos os usuários (admin)"""
    try:
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 20))
        search = request.args.get('search')
        
        users = admin_service.get_all_users(page, per_page, search)
        return jsonify(users), 200
        
    except Exception as e:
        return jsonify({'error': 'Erro interno do servidor'}), 500

@admin_bp.route('/analytics', methods=['GET'])
@admin_required
def get_analytics():
    """Retorna analytics gerais (admin) - DEPRECATED, use /analytics/sales"""
    try:
        period = request.args.get('period', '30')  # dias
        analytics = admin_service.get_analytics(int(period))
        return jsonify(analytics), 200
        
    except Exception as e:
        return jsonify({'error': 'Erro interno do servidor'}), 500

@admin_bp.route('/analytics/sales', methods=['GET'])
@admin_required
def get_sales_analytics():
    """Retorna analytics detalhado de vendas"""
    try:
        period = request.args.get('period', 'month')  # today, week, month, quarter, year
        analytics = analytics_service.get_sales_analytics(period)
        return jsonify(analytics), 200
    except Exception as e:
        return jsonify({'error': 'Erro ao buscar analytics de vendas', 'details': str(e)}), 500

@admin_bp.route('/analytics/users', methods=['GET'])
@admin_required
def get_users_analytics():
    """Retorna analytics detalhado de usuários"""
    try:
        period = request.args.get('period', 'month')  # today, week, month, quarter, year
        analytics = analytics_service.get_users_analytics(period)
        return jsonify(analytics), 200
    except Exception as e:
        return jsonify({'error': 'Erro ao buscar analytics de usuários', 'details': str(e)}), 500

@admin_bp.route('/analytics/products', methods=['GET'])
@admin_required
def get_products_analytics():
    """Retorna analytics detalhado de produtos"""
    try:
        period = request.args.get('period', 'month')  # today, week, month, quarter, year
        analytics = analytics_service.get_products_analytics(period)
        return jsonify(analytics), 200
    except Exception as e:
        return jsonify({'error': 'Erro ao buscar analytics de produtos', 'details': str(e)}), 500

@admin_bp.route('/orders', methods=['GET'])
@admin_required
def get_all_orders():
    """Retorna todos os pedidos (admin)"""
    try:
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 20))
        status = request.args.get('status')
        
        orders = admin_service.get_all_orders(page, per_page, status)
        return jsonify(orders), 200
        
    except Exception as e:
        return jsonify({'error': 'Erro interno do servidor'}), 500