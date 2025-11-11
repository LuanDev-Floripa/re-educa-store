"""
Rotas para IA e Recomendações RE-EDUCA Store.

Fornece endpoints para recomendações inteligentes de produtos, exercícios
e planos nutricionais, além de previsões de tendências de saúde baseadas
em machine learning.
"""
import logging
from flask import Blueprint, request, jsonify
from middleware.auth import token_required, admin_required
from utils.rate_limit_helper import rate_limit
from utils.exception_strategies import handle_route_exceptions
from exceptions.custom_exceptions import ValidationError, NotFoundError, InternalServerError
from services.ai_recommendation_service import AIRecommendationService
from services.ai_service import AIService
from services.health_service import HealthService

logger = logging.getLogger(__name__)

# Blueprint para rotas de IA
ai_bp = Blueprint('ai', __name__)

# Inicializa serviços
ai_recommendation_service = AIRecommendationService()
ai_service = AIService()
health_service = HealthService()

@ai_bp.route('/recommendations/profile', methods=['GET'])
@token_required
@handle_route_exceptions
def get_user_profile():
    """
    Obtém perfil de IA do usuário.
    
    Implementa tratamento robusto de exceções e validação de dados.
    """
    user_id = request.current_user['id']

    result = ai_recommendation_service.get_user_profile_vector(user_id)

    if not result.get('success'):
        raise InternalServerError(result.get('error', 'Erro ao obter perfil do usuário'))

    return jsonify(result), 200

@ai_bp.route('/recommendations/products', methods=['GET'])
@token_required
@handle_route_exceptions
def get_product_recommendations():
    """
    Obtém recomendações de produtos para o usuário.
    
    Implementa tratamento robusto de exceções e validação de dados.

    Query Parameters:
        limit (int): Número máximo de recomendações (padrão: 10).

    Returns:
        JSON: Lista de produtos recomendados com scores ou erro.
    """
    user_id = request.current_user['id']
    
    try:
        limit = int(request.args.get('limit', 10))
        if limit < 1 or limit > 100:
            raise ValidationError("limit deve estar entre 1 e 100")
    except (ValueError, TypeError):
        raise ValidationError("limit deve ser um número válido")

    result = ai_recommendation_service.recommend_products(user_id, limit=limit)

    if not result.get('success'):
        raise InternalServerError(result.get('error', 'Erro ao obter recomendações de produtos'))

    return jsonify(result), 200

@ai_bp.route('/recommendations/exercises', methods=['GET'])
@token_required
@handle_route_exceptions
def get_exercise_recommendations():
    """
    Obtém recomendações de exercícios para o usuário.
    
    Implementa tratamento robusto de exceções e validação de dados.
    """
    user_id = request.current_user['id']
    
    try:
        limit = int(request.args.get('limit', 10))
        if limit < 1 or limit > 100:
            raise ValidationError("limit deve estar entre 1 e 100")
    except (ValueError, TypeError):
        raise ValidationError("limit deve ser um número válido")

    result = ai_recommendation_service.recommend_exercises(user_id, limit=limit)

    if not result.get('success'):
        raise InternalServerError(result.get('error', 'Erro ao obter recomendações de exercícios'))

    return jsonify(result), 200

@ai_bp.route('/recommendations/nutrition', methods=['GET'])
@token_required
@handle_route_exceptions
def get_nutrition_recommendations():
    """
    Obtém recomendações nutricionais para o usuário.
    
    Implementa tratamento robusto de exceções e validação de dados.
    """
    user_id = request.current_user['id']
    
    try:
        limit = int(request.args.get('limit', 10))
        if limit < 1 or limit > 100:
            raise ValidationError("limit deve estar entre 1 e 100")
    except (ValueError, TypeError):
        raise ValidationError("limit deve ser um número válido")

    result = ai_recommendation_service.recommend_nutrition_plans(user_id, limit=limit)

    if not result.get('success'):
        raise InternalServerError(result.get('error', 'Erro ao obter recomendações nutricionais'))

    return jsonify(result), 200

@ai_bp.route('/predictions/health-trends', methods=['GET'])
@token_required
@handle_route_exceptions
def get_health_trends():
    """
    Obtém previsões de tendências de saúde.
    
    Implementa tratamento robusto de exceções e validação de dados.
    """
    user_id = request.current_user['id']
    
    try:
        days_ahead = int(request.args.get('days_ahead', 30))
        if days_ahead < 1 or days_ahead > 365:
            raise ValidationError("days_ahead deve estar entre 1 e 365")
    except (ValueError, TypeError):
        raise ValidationError("days_ahead deve ser um número válido")

    result = ai_recommendation_service.predict_health_trends(user_id, days_ahead=days_ahead)

    if not result.get('success'):
        raise InternalServerError(result.get('error', 'Erro ao obter previsões de saúde'))

    return jsonify(result), 200

@ai_bp.route('/similar-users', methods=['GET'])
@token_required
@handle_route_exceptions
def get_similar_users():
    """
    Obtém usuários similares baseado no perfil.
    
    Implementa tratamento robusto de exceções e validação de dados.
    """
    user_id = request.current_user['id']
    
    try:
        limit = int(request.args.get('limit', 5))
        if limit < 1 or limit > 50:
            raise ValidationError("limit deve estar entre 1 e 50")
    except (ValueError, TypeError):
        raise ValidationError("limit deve ser um número válido")

    result = ai_recommendation_service.find_similar_users(user_id, limit=limit)

    if not result.get('success'):
        raise InternalServerError(result.get('error', 'Erro ao encontrar usuários similares'))

    return jsonify(result), 200

@ai_bp.route('/insights', methods=['GET'])
@token_required
@handle_route_exceptions
def get_ai_insights():
    """
    Obtém insights de IA personalizados.
    
    Implementa tratamento robusto de exceções e validação de dados.
    """
    user_id = request.current_user['id']

    result = ai_recommendation_service.generate_ai_insights(user_id)

    if not result.get('success'):
        raise InternalServerError(result.get('error', 'Erro ao gerar insights de IA'))

    return jsonify(result), 200

@ai_bp.route('/chat', methods=['POST'])
@token_required
@handle_route_exceptions
def chat_with_ai():
    """
    Chat com assistente de IA preditivo usando contexto do usuário.
    
    Implementa tratamento robusto de exceções e validação de dados.

    Body:
        - message (str): Mensagem do usuário
        - agent_type (str, opcional): Tipo de agente (platform_concierge, dr_nutri, etc.)
        - context (dict, opcional): Contexto do usuário (perfil, saúde, etc.)
        - context_summary (str, opcional): Resumo textual do contexto
    """
    data = request.get_json()
    if not data:
        raise ValidationError("Dados são obrigatórios")
    
    user_id = request.current_user['id']
    message = data.get('message', '').strip()
    agent_type = data.get('agent_type', 'platform_concierge')
    context = data.get('context')  # Dados estruturados do usuário
    context_summary = data.get('context_summary')  # Resumo textual

    if not message:
        raise ValidationError('Mensagem é obrigatória')

    # Processar mensagem com contexto do usuário para IA preditiva
    result = ai_service.process_chat_message(
        user_id=user_id,
        message=message,
        agent_type=agent_type,
        user_context=context,
        context_summary=context_summary
    )

    if not result.get('success'):
        raise InternalServerError(result.get('error', 'Erro no chat com IA'))

    return jsonify(result), 200

@ai_bp.route('/chat/history', methods=['GET'])
@token_required
@handle_route_exceptions
def get_chat_history():
    """
    Obtém histórico de conversas com IA.
    
    Implementa tratamento robusto de exceções e validação de dados.
    """
    user_id = request.current_user['id']
    
    try:
        limit = int(request.args.get('limit', 50))
        if limit < 1 or limit > 200:
            raise ValidationError("limit deve estar entre 1 e 200")
    except (ValueError, TypeError):
        raise ValidationError("limit deve ser um número válido")

    result = ai_service.get_chat_history(user_id, limit=limit)

    if not result.get('success'):
        raise InternalServerError(result.get('error', 'Erro ao obter histórico de chat'))

    return jsonify(result), 200

@ai_bp.route('/analyze/image', methods=['POST'])
@token_required
@handle_route_exceptions
def analyze_image():
    """
    Analisa imagem com IA (ex: comida, exercício).
    
    Implementa tratamento robusto de exceções e validação de dados.
    """
    user_id = request.current_user['id']

    if 'image' not in request.files:
        raise ValidationError('Imagem é obrigatória')

    image_file = request.files['image']
    analysis_type = request.form.get('type', 'general')  # food, exercise, general
    
    valid_types = ['food', 'exercise', 'general']
    if analysis_type not in valid_types:
        raise ValidationError(f"type deve ser um dos: {', '.join(valid_types)}")

    result = ai_service.analyze_image(user_id, image_file, analysis_type)

    if not result.get('success'):
        raise InternalServerError(result.get('error', 'Erro na análise de imagem'))

    return jsonify(result), 200

@ai_bp.route('/analyze-health-data', methods=['POST'])
@token_required
@rate_limit("10 per hour")
@handle_route_exceptions
def analyze_health_data():
    """
    Analisa dados de saúde do usuário usando IA.
    
    Implementa tratamento robusto de exceções e validação de dados.

    Request Body:
        - period_days (int): Período em dias para análise (padrão: 30)
        - include_recommendations (bool): Incluir recomendações (padrão: true)

    Returns:
        JSON: Análise completa com insights e recomendações
    """
    user_id = request.current_user['id']
    data = request.get_json() or {}
    
    try:
        period_days = int(data.get('period_days', 30))
        if period_days < 1 or period_days > 365:
            raise ValidationError("period_days deve estar entre 1 e 365")
    except (ValueError, TypeError):
        raise ValidationError("period_days deve ser um número válido")
    
    include_recommendations = data.get('include_recommendations', True)
    if not isinstance(include_recommendations, bool):
        raise ValidationError("include_recommendations deve ser um booleano")

    # Buscar dados de saúde do período
    analytics = health_service.get_health_analytics(user_id, period_days)

    # Buscar históricos
    imc_history = health_service.get_imc_history(user_id, page=1, per_page=50)
    # calorie_history reservado para uso futuro em ML

    # Gerar insights básicos (pode ser expandido com ML real)
    insights = []

    if analytics.get('metrics'):
        metrics = analytics['metrics']

        # Insight sobre IMC
        if metrics.get('average_imc'):
            avg_imc = metrics['average_imc']
            if avg_imc > 30:
                insights.append({
                    'type': 'warning',
                    'category': 'IMC',
                    'title': 'IMC Elevado',
                    'message': f'Seu IMC médio é {avg_imc:.1f}. Considere consultar um nutricionista.',
                    'priority': 'high'
                })
            elif avg_imc < 18.5:
                insights.append({
                    'type': 'info',
                    'category': 'IMC',
                    'title': 'IMC Abaixo do Ideal',
                    'message': f'Seu IMC médio é {avg_imc:.1f}. Considere aumentar a ingestão calórica.',
                    'priority': 'medium'
                })

        # Insight sobre calorias
        if metrics.get('net_calories'):
            net = metrics['net_calories']
            if net > 500:
                insights.append({
                    'type': 'success',
                    'category': 'Calorias',
                    'title': 'Déficit Calórico',
                    'message': f'Você está em déficit de {net} calorias. Mantenha o foco!',
                    'priority': 'high'
                })

    # Gerar recomendações se solicitado
    recommendations = []
    if include_recommendations:
        if len(imc_history.get('calculations', [])) < 5:
            recommendations.append({
                'type': 'tool',
                'name': 'Acompanhe seu IMC regularmente',
                'description': 'Calcule seu IMC semanalmente para monitorar seu progresso',
                'action': '/tools/imc-calculator'
            })

    return jsonify({
        'success': True,
        'analysis': {
            'period_days': period_days,
            'insights': insights,
            'recommendations': recommendations,
            'metrics_summary': analytics.get('metrics', {}),
            'trends': analytics.get('trends', {})
        }
    }), 200

@ai_bp.route('/admin/retrain', methods=['POST'])
@token_required
@admin_required
@handle_route_exceptions
def retrain_models():
    """
    Retreina modelos de IA (admin only).
    
    Implementa tratamento robusto de exceções e validação de dados.
    """
    data = request.get_json() or {}
    model_type = data.get('model_type', 'all')
    
    valid_types = ['all', 'recommendations', 'predictions', 'insights']
    if model_type not in valid_types:
        raise ValidationError(f"model_type deve ser um dos: {', '.join(valid_types)}")

    result = ai_recommendation_service.retrain_models(model_type)

    if not result.get('success'):
        raise InternalServerError(result.get('error', 'Erro ao retreinar modelos'))

    return jsonify(result), 200

@ai_bp.route('/admin/analytics', methods=['GET'])
@token_required
@admin_required
@handle_route_exceptions
def get_ai_analytics():
    """
    Obtém analytics de IA (admin only).
    
    Implementa tratamento robusto de exceções e validação de dados.
    """
    result = ai_recommendation_service.get_ai_analytics()

    if not result.get('success'):
        raise InternalServerError(result.get('error', 'Erro ao obter analytics de IA'))

    return jsonify(result), 200

@ai_bp.route('/admin/performance', methods=['GET'])
@token_required
@admin_required
@handle_route_exceptions
def get_model_performance():
    """
    Obtém performance dos modelos de IA (admin only).
    
    Implementa tratamento robusto de exceções e validação de dados.
    """
    result = ai_recommendation_service.get_model_performance()

    if not result.get('success'):
        raise InternalServerError(result.get('error', 'Erro ao obter performance dos modelos'))

    return jsonify(result), 200
