"""
Rotas de produtos RE-EDUCA Store.

Gerencia operações com produtos incluindo:
- Listagem e busca de produtos
- Detalhes de produtos
- Criação, atualização e exclusão (admin)
- Reviews e avaliações
"""
import logging
from flask import Blueprint, request, jsonify
from services.product_service import ProductService
from utils.decorators import token_required, admin_required, log_activity
from utils.rate_limit_helper import rate_limit
from utils.validators import product_validator
from middleware.logging import log_user_activity

logger = logging.getLogger(__name__)

products_bp = Blueprint('products', __name__)
product_service = ProductService()

@products_bp.route('/', methods=['GET'])
@rate_limit("100 per hour")
def get_products():
    """
    Retorna lista de produtos.

    Query Parameters:
        page (int): Página de resultados (padrão: 1).
        per_page (int): Itens por página (padrão: 20).
        category (str): Filtrar por categoria.
        search (str): Termo de busca.

    Returns:
        JSON: Lista paginada de produtos ou erro.
    """
    try:
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 20))
        category = request.args.get('category')
        search = request.args.get('search')

        products = product_service.get_products(page, per_page, category, search)

        return jsonify(products), 200

    except ValueError as e:
        return jsonify({'error': 'Parâmetros inválidos', 'details': str(e)}), 400
    except Exception as e:
        import logging
        logging.getLogger(__name__).error(f"Erro ao listar produtos: {str(e)}", exc_info=True)
        return jsonify({'error': 'Erro interno do servidor'}), 500

@products_bp.route('/search', methods=['GET'])
@rate_limit("100 per hour")
def search_products():
    """Busca avançada de produtos com filtros"""
    try:
        # Parâmetros de busca
        query = request.args.get('q', '').strip()
        category = request.args.get('category')
        min_price = request.args.get('min_price', type=float)
        max_price = request.args.get('max_price', type=float)
        in_stock = request.args.get('in_stock', type=bool)
        featured = request.args.get('featured', type=bool)
        sort_by = request.args.get('sort_by', 'name')  # name, price_asc, price_desc, created_at
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 20))

        # Montar filtros
        filters = {
            'query': query,
            'category': category,
            'min_price': min_price,
            'max_price': max_price,
            'in_stock': in_stock,
            'featured': featured,
            'sort_by': sort_by
        }

        # Remover filtros None
        filters = {k: v for k, v in filters.items() if v is not None}

        # Buscar produtos
        results = product_service.search_products(filters, page, per_page)

        return jsonify(results), 200

    except Exception as e:
        return jsonify({'error': 'Erro ao buscar produtos', 'details': str(e)}), 500

@products_bp.route('/<product_id>', methods=['GET'])
@rate_limit("200 per hour")
def get_product(product_id):
    """Retorna detalhes de um produto"""
    try:
        product = product_service.get_product(product_id)

        if not product:
            return jsonify({'error': 'Produto não encontrado'}), 404

        return jsonify(product), 200

    except Exception as e:
        return jsonify({'error': 'Erro interno do servidor'}), 500

@products_bp.route('/recommended', methods=['GET'])
@token_required
@rate_limit("30 per minute")
def get_recommended_products():
    """
    Retorna produtos recomendados para o usuário autenticado.

    Baseado em:
    - Histórico de compras
    - Objetivos de saúde
    - Produtos visualizados

    Query Parameters:
        limit (int): Número de produtos (padrão: 10)

    Returns:
        JSON: Lista de produtos recomendados
    """
    try:
        user_id = request.current_user['id']
        limit = int(request.args.get('limit', 10))

        # Buscar produtos recomendados (pode ser expandido com lógica de ML)
        # Por enquanto, retorna produtos mais bem avaliados e em estoque
        recommended = product_service.get_recommended_products(user_id, limit)

        return jsonify({
            'success': True,
            'products': recommended
        }), 200

    except Exception as e:
        logger.error(f"Erro ao buscar produtos recomendados: {str(e)}")
        return jsonify({'error': 'Erro interno do servidor'}), 500

@products_bp.route('/trending', methods=['GET'])
@rate_limit("50 per hour")
def get_trending_products():
    """
    Retorna produtos em tendência.

    Baseado em:
    - Número de vendas recentes
    - Avaliações e ratings
    - Visualizações

    Query Parameters:
        limit (int): Número de produtos (padrão: 10)
        period (str): Período - 'day', 'week', 'month' (padrão: 'week')

    Returns:
        JSON: Lista de produtos em tendência
    """
    try:
        limit = int(request.args.get('limit', 10))
        period = request.args.get('period', 'week')

        trending = product_service.get_trending_products(limit, period)

        return jsonify({
            'success': True,
            'products': trending,
            'period': period
        }), 200

    except Exception as e:
        logger.error(f"Erro ao buscar produtos em tendência: {str(e)}")
        return jsonify({'error': 'Erro interno do servidor'}), 500

@products_bp.route('/', methods=['POST'])
@admin_required
@log_activity('product_created')
def create_product():
    """Cria novo produto (admin)"""
    try:
        data = request.get_json()

        # Valida dados
        if not product_validator.validate_product(data):
            return jsonify({
                'error': 'Dados inválidos',
                'details': product_validator.get_errors()
            }), 400

        # Cria produto
        result = product_service.create_product(data)

        if result.get('success'):
            log_user_activity(request.current_user['id'], 'product_created', {
                'product_name': data['name'],
                'category': data.get('category')
            })

            return jsonify({
                'message': 'Produto criado com sucesso',
                'product': result['product']
            }), 201
        else:
            return jsonify({'error': result['error']}), 400

    except Exception as e:
        return jsonify({'error': 'Erro interno do servidor'}), 500

@products_bp.route('/<product_id>', methods=['PUT'])
@admin_required
@log_activity('product_updated')
def update_product(product_id):
    """Atualiza produto (admin)"""
    try:
        data = request.get_json()

        # Atualiza produto
        result = product_service.update_product(product_id, data)

        if result.get('success'):
            log_user_activity(request.current_user['id'], 'product_updated', {
                'product_id': product_id,
                'changes': data
            })

            return jsonify({
                'message': 'Produto atualizado com sucesso',
                'product': result['product']
            }), 200
        else:
            return jsonify({'error': result['error']}), 400

    except Exception as e:
        return jsonify({'error': 'Erro interno do servidor'}), 500

@products_bp.route('/<product_id>', methods=['DELETE'])
@admin_required
@log_activity('product_deleted')
def delete_product(product_id):
    """Remove produto (admin)"""
    try:
        result = product_service.delete_product(product_id)

        if result.get('success'):
            log_user_activity(request.current_user['id'], 'product_deleted', {
                'product_id': product_id
            })

            return jsonify({'message': 'Produto removido com sucesso'}), 200
        else:
            return jsonify({'error': result['error']}), 400

    except Exception as e:
        return jsonify({'error': 'Erro interno do servidor'}), 500

@products_bp.route('/categories', methods=['GET'])
def get_categories():
    """Retorna categorias de produtos"""
    try:
        categories = product_service.get_categories()
        return jsonify({'categories': categories}), 200

    except Exception as e:
        return jsonify({'error': 'Erro interno do servidor'}), 500

@products_bp.route('/<product_id>/reviews', methods=['GET'])
def get_product_reviews(product_id):
    """Retorna avaliações de um produto"""
    try:
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 10))

        reviews = product_service.get_product_reviews(product_id, page, per_page)

        return jsonify(reviews), 200

    except Exception as e:
        return jsonify({'error': 'Erro interno do servidor'}), 500

@products_bp.route('/<product_id>/reviews', methods=['POST'])
@token_required
@rate_limit("10 per hour")
@log_activity('review_created')
def create_product_review(product_id):
    """Cria avaliação de produto"""
    try:
        data = request.get_json()
        user_id = request.current_user['id']

        # Valida dados
        if not data.get('rating') or not data.get('comment'):
            return jsonify({'error': 'Avaliação e comentário são obrigatórios'}), 400

        if not 1 <= data['rating'] <= 5:
            return jsonify({'error': 'Avaliação deve ser entre 1 e 5'}), 400

        # Cria avaliação
        result = product_service.create_review(product_id, user_id, data)

        if result.get('success'):
            log_user_activity(user_id, 'review_created', {
                'product_id': product_id,
                'rating': data['rating']
            })

            return jsonify({
                'message': 'Avaliação criada com sucesso',
                'review': result['review']
            }), 201
        else:
            return jsonify({'error': result['error']}), 400

    except Exception as e:
        return jsonify({'error': 'Erro interno do servidor'}), 500

@products_bp.route('/featured', methods=['GET'])
def get_featured_products():
    """Retorna produtos em destaque"""
    try:
        products = product_service.get_featured_products()
        return jsonify({'products': products}), 200

    except Exception as e:
        return jsonify({'error': 'Erro interno do servidor'}), 500

# Função get_recommended_products duplicada removida - usar /recommended (linha 128)
