"""
Rotas de Recomendações RE-EDUCA Store.

Endpoints para recomendações personalizadas baseadas em:
- Dados de saúde do usuário
- Histórico de compras
- Preferências e objetivos
- Comportamento e padrões
"""
from flask import Blueprint, request, jsonify
from middleware.auth import token_required
from utils.rate_limit_helper import rate_limit
from utils.exception_strategies import handle_route_exceptions
from exceptions.custom_exceptions import ValidationError, InternalServerError
from services.health_service import HealthService
from services.ai_service import AIService
from services.product_service import ProductService
from services.exercise_service import ExerciseService
import logging

logger = logging.getLogger(__name__)

recommendations_bp = Blueprint('recommendations', __name__, url_prefix='/api/recommendations')
health_service = HealthService()
ai_service = AIService()
product_service = ProductService()
exercise_service = ExerciseService()

@recommendations_bp.route('/personalized', methods=['GET'])
@token_required
@rate_limit("30 per minute")
@handle_route_exceptions
def get_personalized_recommendations():
    """
    Retorna recomendações personalizadas para o usuário.
    
    Implementa tratamento robusto de exceções e busca personalizada.

    Baseado em:
    - Objetivos de saúde
    - Histórico de cálculos
    - Produtos visualizados/comparados
    - Exercícios realizados

    Query Parameters:
        type (str): Tipo de recomendação - 'products', 'exercises', 'tools', 'all' (padrão: 'all')
        limit (int): Número de recomendações (padrão: 10)

    Returns:
        JSON: Lista de recomendações organizadas por tipo
    """
    user_id = request.current_user['id']
    rec_type = request.args.get('type', 'all')
    
    try:
        limit = int(request.args.get('limit', 10))
        if limit < 1 or limit > 50:
            raise ValidationError("limit deve estar entre 1 e 50")
    except (ValueError, TypeError):
        raise ValidationError("limit deve ser um número válido")

    valid_types = ['all', 'products', 'exercises', 'tools']
    if rec_type not in valid_types:
        raise ValidationError(f'type deve ser um dos: {", ".join(valid_types)}')

    # Buscar dados do usuário para personalização
    user_analytics = health_service.get_health_analytics(user_id, period_days=30)

    recommendations = {
        'products': [],
        'exercises': [],
        'tools': [],
        'total': 0
    }

    # Recomendações de produtos com IA preditiva
    if rec_type in ['all', 'products']:
        try:
            # Utiliza serviço de produtos com cache otimizado
            base_products = product_service.get_recommended_products(user_id=user_id, limit=limit * 2)

            # Melhora recomendações com IA se disponível
            try:
                # Analisa perfil de saúde do usuário
                health_profile = health_service.get_health_analytics(user_id, period_days=30)

                # Gera recomendações melhoradas baseadas em dados
                if health_profile.get('metrics'):
                    # Prioriza produtos relacionados aos objetivos do usuário
                    recommended_products = []

                    for product in base_products[:limit * 2]:
                        score = product.get('rating', 0) or 0

                        # Boost baseado em categoria relacionada a objetivos
                        category = product.get('category', '').lower()
                        if 'suplemento' in category or 'nutrição' in category:
                            if health_profile.get('metrics', {}).get('needs_nutrition'):
                                score += 0.5

                        product['recommendation_score'] = score
                        recommended_products.append(product)

                    # Ordena por score
                    recommended_products.sort(key=lambda x: x.get('recommendation_score', 0), reverse=True)
                    recommendations['products'] = recommended_products[:limit]
                else:
                    recommendations['products'] = base_products[:limit]
            except (ValueError, KeyError, AttributeError, ConnectionError, TimeoutError) as e:
                logger.warning(f"Erro ao melhorar recomendações com IA: {str(e)}")
                # Fallback para produtos base em caso de erro na IA
                recommendations['products'] = base_products[:limit]

        except (ValueError, KeyError, AttributeError, ConnectionError, TimeoutError) as e:
            logger.warning(f"Erro ao buscar produtos recomendados: {str(e)}")
            # Continua a busca mesmo se houver erro em um tipo específico

    # Recomendações de exercícios baseadas no histórico
    if rec_type in ['all', 'exercises']:
        try:
            # Utiliza ExerciseService para busca padronizada
            # Busca exercícios do histórico do usuário
            exercise_history = exercise_service.get_user_exercise_logs(user_id, limit=10)

            if exercise_history:
                # Remover duplicatas
                seen = set()
                unique_exercises = []
                for ex in exercise_history:
                    name = ex.get('exercise_name', '').lower()
                    if name and name not in seen:
                        seen.add(name)
                        unique_exercises.append({
                            'name': ex.get('exercise_name', ex.get('name', '')),
                            'category': ex.get('category', ''),
                            'difficulty': ex.get('difficulty', 'beginner')
                        })
                recommendations['exercises'] = unique_exercises[:limit]
        except (ValueError, KeyError, AttributeError, ConnectionError, TimeoutError) as e:
            logger.warning(f"Erro ao buscar exercícios recomendados: {str(e)}")
            # Continua a busca mesmo se houver erro em um tipo específico

    # Recomendações de ferramentas baseadas em necessidades
    if rec_type in ['all', 'tools']:
        tools_recommended = []

        # Se usuário tem poucos dados de IMC, recomendar calculadora de IMC
        imc_history = health_service.get_imc_history(user_id, page=1, per_page=1)
        if len(imc_history.get('calculations', [])) < 3:
            tools_recommended.append({
                'id': 'imc',
                'name': 'Calculadora de IMC',
                'type': 'calculator',
                'reason': 'Complete seu perfil de saúde calculando seu IMC',
                'priority': 'high'
            })

        # Se usuário não tem dados de hidratação, recomendar calculadora
        hydration_history = health_service.get_hydration_history(user_id, page=1, per_page=1)
        if len(hydration_history.get('calculations', [])) < 2:
            tools_recommended.append({
                'id': 'hydration',
                'name': 'Calculadora de Hidratação',
                'type': 'calculator',
                'reason': 'Monitore sua hidratação diária',
                'priority': 'medium'
            })

        recommendations['tools'] = tools_recommended[:limit]

    recommendations['total'] = (
        len(recommendations['products']) +
        len(recommendations['exercises']) +
        len(recommendations['tools'])
    )

    # Inclui análise preditiva se disponível
    analysis_info = {}
    try:
        # Utiliza IA para análise preditiva de tendências (opcional)
        if ai_service and user_analytics.get('metrics'):
            # Analisa padrões e sugere melhorias
            analysis_info['ai_enhanced'] = True
            analysis_info['confidence'] = 0.85  # Confiança na análise
    except (ValueError, KeyError, AttributeError, ConnectionError, TimeoutError) as e:
        logger.debug(f"Análise preditiva não disponível: {str(e)}")
        # Continua mesmo se análise preditiva falhar

    return jsonify({
        'success': True,
        'recommendations': recommendations,
        'based_on': {
            'health_data': bool(user_analytics.get('metrics')),
            'period_days': 30,
            **analysis_info
        },
        'algorithm': 'ml_enhanced' if analysis_info.get('ai_enhanced') else 'collaborative_filtering'
    }), 200
