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
def get_user_profile():
    """Obtém perfil de IA do usuário"""
    try:
        user_id = request.current_user['id']

        result = ai_recommendation_service.get_user_profile_vector(user_id)

        if result['success']:
            return jsonify(result), 200
        else:
            return jsonify({'error': result['error']}), 500

    except Exception as e:
        logger.error(f"Erro ao obter perfil do usuário: {str(e)}")
        return jsonify({'error': 'Erro interno do servidor'}), 500

@ai_bp.route('/recommendations/products', methods=['GET'])
@token_required
def get_product_recommendations():
    """
    Obtém recomendações de produtos para o usuário.

    Query Parameters:
        limit (int): Número máximo de recomendações (padrão: 10).

    Returns:
        JSON: Lista de produtos recomendados com scores ou erro.
    """
    try:
        user_id = request.current_user['id']
        limit = int(request.args.get('limit', 10))

        result = ai_recommendation_service.recommend_products(user_id, limit=limit)

        if result['success']:
            return jsonify(result), 200
        else:
            return jsonify({'error': result['error']}), 500

    except Exception as e:
        logger.error(f"Erro ao obter recomendações de produtos: {str(e)}")
        return jsonify({'error': 'Erro interno do servidor'}), 500

@ai_bp.route('/recommendations/exercises', methods=['GET'])
@token_required
def get_exercise_recommendations():
    """Obtém recomendações de exercícios para o usuário"""
    try:
        user_id = request.current_user['id']
        limit = int(request.args.get('limit', 10))

        result = ai_recommendation_service.recommend_exercises(user_id, limit=limit)

        if result['success']:
            return jsonify(result), 200
        else:
            return jsonify({'error': result['error']}), 500

    except Exception as e:
        logger.error(f"Erro ao obter recomendações de exercícios: {str(e)}")
        return jsonify({'error': 'Erro interno do servidor'}), 500

@ai_bp.route('/recommendations/nutrition', methods=['GET'])
@token_required
def get_nutrition_recommendations():
    """Obtém recomendações nutricionais para o usuário"""
    try:
        user_id = request.current_user['id']
        limit = int(request.args.get('limit', 10))

        result = ai_recommendation_service.recommend_nutrition_plans(user_id, limit=limit)

        if result['success']:
            return jsonify(result), 200
        else:
            return jsonify({'error': result['error']}), 500

    except Exception as e:
        logger.error(f"Erro ao obter recomendações nutricionais: {str(e)}")
        return jsonify({'error': 'Erro interno do servidor'}), 500

@ai_bp.route('/predictions/health-trends', methods=['GET'])
@token_required
def get_health_trends():
    """Obtém previsões de tendências de saúde"""
    try:
        user_id = request.current_user['id']
        days_ahead = int(request.args.get('days_ahead', 30))

        result = ai_recommendation_service.predict_health_trends(user_id, days_ahead=days_ahead)

        if result['success']:
            return jsonify(result), 200
        else:
            return jsonify({'error': result['error']}), 500

    except Exception as e:
        logger.error(f"Erro ao obter previsões de saúde: {str(e)}")
        return jsonify({'error': 'Erro interno do servidor'}), 500

@ai_bp.route('/similar-users', methods=['GET'])
@token_required
def get_similar_users():
    """Obtém usuários similares baseado no perfil"""
    try:
        user_id = request.current_user['id']
        limit = int(request.args.get('limit', 5))

        result = ai_recommendation_service.find_similar_users(user_id, limit=limit)

        if result['success']:
            return jsonify(result), 200
        else:
            return jsonify({'error': result['error']}), 500

    except Exception as e:
        logger.error(f"Erro ao encontrar usuários similares: {str(e)}")
        return jsonify({'error': 'Erro interno do servidor'}), 500

@ai_bp.route('/insights', methods=['GET'])
@token_required
def get_ai_insights():
    """Obtém insights de IA personalizados"""
    try:
        user_id = request.current_user['id']

        result = ai_recommendation_service.generate_ai_insights(user_id)

        if result['success']:
            return jsonify(result), 200
        else:
            return jsonify({'error': result['error']}), 500

    except Exception as e:
        logger.error(f"Erro ao gerar insights de IA: {str(e)}")
        return jsonify({'error': 'Erro interno do servidor'}), 500

@ai_bp.route('/chat', methods=['POST'])
@token_required
def chat_with_ai():
    """
    Chat com assistente de IA preditivo usando contexto do usuário

    Body:
        - message (str): Mensagem do usuário
        - agent_type (str, opcional): Tipo de agente (platform_concierge, dr_nutri, etc.)
        - context (dict, opcional): Contexto do usuário (perfil, saúde, etc.)
        - context_summary (str, opcional): Resumo textual do contexto
    """
    try:
        data = request.get_json()
        user_id = request.current_user['id']
        message = data.get('message', '').strip()
        agent_type = data.get('agent_type', 'platform_concierge')
        context = data.get('context')  # Dados estruturados do usuário
        context_summary = data.get('context_summary')  # Resumo textual

        if not message:
            return jsonify({'error': 'Mensagem é obrigatória'}), 400

        # Processar mensagem com contexto do usuário para IA preditiva
        result = ai_service.process_chat_message(
            user_id=user_id,
            message=message,
            agent_type=agent_type,
            user_context=context,
            context_summary=context_summary
        )

        if result['success']:
            return jsonify(result), 200
        else:
            return jsonify({'error': result['error']}), 500

    except Exception as e:
        logger.error(f"Erro no chat com IA: {str(e)}")
        return jsonify({'error': 'Erro interno do servidor'}), 500

@ai_bp.route('/chat/history', methods=['GET'])
@token_required
def get_chat_history():
    """Obtém histórico de conversas com IA"""
    try:
        user_id = request.current_user['id']
        limit = int(request.args.get('limit', 50))

        result = ai_service.get_chat_history(user_id, limit=limit)

        if result['success']:
            return jsonify(result), 200
        else:
            return jsonify({'error': result['error']}), 500

    except Exception as e:
        logger.error(f"Erro ao obter histórico de chat: {str(e)}")
        return jsonify({'error': 'Erro interno do servidor'}), 500

@ai_bp.route('/analyze/image', methods=['POST'])
@token_required
def analyze_image():
    """Analisa imagem com IA (ex: comida, exercício)"""
    try:
        user_id = request.current_user['id']

        if 'image' not in request.files:
            return jsonify({'error': 'Imagem é obrigatória'}), 400

        image_file = request.files['image']
        analysis_type = request.form.get('type', 'general')  # food, exercise, general

        result = ai_service.analyze_image(user_id, image_file, analysis_type)

        if result['success']:
            return jsonify(result), 200
        else:
            return jsonify({'error': result['error']}), 500

    except Exception as e:
        logger.error(f"Erro na análise de imagem: {str(e)}")
        return jsonify({'error': 'Erro interno do servidor'}), 500

@ai_bp.route('/analyze-health-data', methods=['POST'])
@token_required
@rate_limit("10 per hour")
def analyze_health_data():
    """
    Analisa dados de saúde do usuário usando IA.

    Request Body:
        - period_days (int): Período em dias para análise (padrão: 30)
        - include_recommendations (bool): Incluir recomendações (padrão: true)

    Returns:
        JSON: Análise completa com insights e recomendações
    """
    try:
        user_id = request.current_user['id']
        data = request.get_json() or {}
        period_days = data.get('period_days', 30)
        include_recommendations = data.get('include_recommendations', True)

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

    except Exception as e:
        logger.error(f"Erro ao analisar dados de saúde: {str(e)}")
        return jsonify({'error': 'Erro interno do servidor'}), 500

@ai_bp.route('/admin/retrain', methods=['POST'])
@token_required
@admin_required
def retrain_models():
    """Retreina modelos de IA (admin only)"""
    try:
        model_type = request.json.get('model_type', 'all')

        result = ai_recommendation_service.retrain_models(model_type)

        if result['success']:
            return jsonify(result), 200
        else:
            return jsonify({'error': result['error']}), 500

    except Exception as e:
        logger.error(f"Erro ao retreinar modelos: {str(e)}")
        return jsonify({'error': 'Erro interno do servidor'}), 500

@ai_bp.route('/admin/analytics', methods=['GET'])
@token_required
@admin_required
def get_ai_analytics():
    """Obtém analytics de IA (admin only)"""
    try:
        result = ai_recommendation_service.get_ai_analytics()

        if result['success']:
            return jsonify(result), 200
        else:
            return jsonify({'error': result['error']}), 500

    except Exception as e:
        logger.error(f"Erro ao obter analytics de IA: {str(e)}")
        return jsonify({'error': 'Erro interno do servidor'}), 500

@ai_bp.route('/admin/performance', methods=['GET'])
@token_required
@admin_required
def get_model_performance():
    """Obtém performance dos modelos de IA (admin only)"""
    try:
        result = ai_recommendation_service.get_model_performance()

        if result['success']:
            return jsonify(result), 200
        else:
            return jsonify({'error': result['error']}), 500

    except Exception as e:
        logger.error(f"Erro ao obter performance dos modelos: {str(e)}")
        return jsonify({'error': 'Erro interno do servidor'}), 500
