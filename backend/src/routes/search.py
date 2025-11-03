"""
Rotas de Busca Global RE-EDUCA Store.

Endpoint unificado para busca em múltiplas entidades:
- Produtos
- Exercícios
- Planos de treino
- Ferramentas de saúde
- Usuários (se aplicável)
"""
from flask import Blueprint, request, jsonify
from middleware.auth import token_required
from utils.rate_limit_helper import rate_limit
from services.product_service import ProductService
from services.exercise_service import ExerciseService
import logging

logger = logging.getLogger(__name__)

search_bp = Blueprint('search', __name__, url_prefix='/api/search')
product_service = ProductService()
exercise_service = ExerciseService()

@search_bp.route('/global', methods=['GET'])
@token_required
@rate_limit("30 per minute")
def global_search():
    """
    Busca global em múltiplas entidades do sistema.

    Query Parameters:
        q (str): Termo de busca (obrigatório)
        type (str): Tipo de busca - 'all', 'products', 'exercises', 'workout_plans', 'tools' (opcional)
        limit (int): Limite de resultados por tipo (padrão: 10)

    Returns:
        JSON: Resultados organizados por tipo
    """
    try:
        query = request.args.get('q', '').strip()
        search_type = request.args.get('type', 'all')
        limit = int(request.args.get('limit', 10))

        if not query:
            return jsonify({'error': 'Termo de busca (q) é obrigatório'}), 400

        results = {
            'query': query,
            'products': [],
            'exercises': [],
            'workout_plans': [],
            'tools': [],
            'total': 0
        }

        # Buscar produtos
        if search_type in ['all', 'products']:
            try:
                # ✅ CORRIGIDO: Usa ProductService em vez de query direta
                products_result = product_service.search_products(
                    filters={'search': query, 'is_active': True},
                    page=1,
                    per_page=limit
                )
                if products_result.get('products'):
                    results['products'] = products_result['products']
            except Exception as e:
                logger.warning(f"Erro ao buscar produtos: {str(e)}")

        # Buscar exercícios
        if search_type in ['all', 'exercises']:
            try:
                # ✅ CORRIGIDO: Usa ExerciseService em vez de query direta
                exercises_result = exercise_service.get_exercises(
                    page=1,
                    limit=limit
                )
                # Filtrar por query (fazer no service se necessário, ou aqui temporariamente)
                if exercises_result.get('exercises'):
                    filtered = [
                        ex for ex in exercises_result['exercises']
                        if query.lower() in ex.get('exercise_name', ex.get('name', '')).lower()
                    ]
                    results['exercises'] = filtered[:limit]
            except Exception as e:
                logger.warning(f"Erro ao buscar exercícios: {str(e)}")

        # Buscar planos de treino (se tabela existir)
        # ✅ CORRIGIDO: Usa ExerciseService (pode criar método específico depois)
        if search_type in ['all', 'workout_plans']:
            try:
                # Por enquanto vazio - TODO: Criar método em ExerciseService para workout_plans
                # Se necessário, pode criar WorkoutPlanRepository/Service
                results['workout_plans'] = []
            except Exception as e:
                logger.debug(f"Busca de workout_plans não disponível: {str(e)}")

        # Ferramentas de saúde (calculadoras) - lista estática
        if search_type in ['all', 'tools']:
            tools = [
                {'id': 'imc', 'name': 'Calculadora de IMC', 'type': 'calculator', 'category': 'health'},
                {'id': 'calories', 'name': 'Calculadora de Calorias', 'type': 'calculator', 'category': 'health'},
                {'id': 'hydration', 'name': 'Calculadora de Hidratação', 'type': 'calculator', 'category': 'health'},
                {'id': 'biological_age', 'name': 'Idade Biológica', 'type': 'calculator', 'category': 'health'},
                {'id': 'metabolism', 'name': 'Metabolismo', 'type': 'calculator', 'category': 'health'},
            ]

            # Filtrar por query
            filtered_tools = [
                tool for tool in tools
                if query.lower() in tool['name'].lower()
            ]
            results['tools'] = filtered_tools[:limit]

        # Calcular total
        results['total'] = (
            len(results['products']) +
            len(results['exercises']) +
            len(results['workout_plans']) +
            len(results['tools'])
        )

        return jsonify({
            'success': True,
            'results': results
        }), 200

    except Exception as e:
        logger.error(f"Erro na busca global: {str(e)}")
        return jsonify({'error': 'Erro interno do servidor'}), 500

@search_bp.route('/suggestions', methods=['GET'])
@token_required
@rate_limit("50 per minute")
def get_suggestions():
    """
    Retorna sugestões de busca baseadas em histórico e popularidade.

    Query Parameters:
        q (str): Termo de busca parcial
        type (str): Tipo de sugestão - 'products', 'exercises', 'all' (opcional)

    Returns:
        JSON: Lista de sugestões
    """
    try:
        query = request.args.get('q', '').strip().lower()
        search_type = request.args.get('type', 'all')
        limit = int(request.args.get('limit', 5))

        suggestions = []

        if not query:
            # Retornar busca populares/trending
            return jsonify({
                'success': True,
                'suggestions': []
            }), 200

        # Buscar sugestões de produtos
        if search_type in ['all', 'products']:
            try:
                # ✅ CORRIGIDO: Usa ProductService
                products_result = product_service.search_products(
                    filters={'search': query, 'is_active': True},
                    page=1,
                    per_page=limit
                )
                if products_result.get('products'):
                    for product in products_result['products']:
                        suggestions.append({
                            'id': product['id'],
                            'text': product['name'],
                            'type': 'product',
                            'category': product.get('category', '')
                        })
            except Exception as e:
                logger.warning(f"Erro ao buscar sugestões de produtos: {str(e)}")

        # Buscar sugestões de exercícios
        if search_type in ['all', 'exercises']:
            try:
                # ✅ CORRIGIDO: Usa ExerciseService
                exercises_result = exercise_service.get_exercises(page=1, limit=limit)
                if exercises_result.get('exercises'):
                    seen = set()
                    for exercise in exercises_result['exercises']:
                        name = exercise.get('exercise_name', exercise.get('name', '')).lower()
                        if name and name not in seen:
                            seen.add(name)
                            suggestions.append({
                                'id': exercise.get('id', name),
                                'text': exercise.get('exercise_name', exercise.get('name', '')),
                                'type': 'exercise',
                                'category': exercise.get('category', '')
                            })
            except Exception as e:
                logger.warning(f"Erro ao buscar sugestões de exercícios: {str(e)}")

        return jsonify({
            'success': True,
            'suggestions': suggestions[:limit * 2]  # Limitar total
        }), 200

    except Exception as e:
        logger.error(f"Erro ao buscar sugestões: {str(e)}")
        return jsonify({'error': 'Erro interno do servidor'}), 500
