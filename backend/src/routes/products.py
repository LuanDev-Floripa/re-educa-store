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
from utils.decorators import token_required, admin_required, log_activity, cache_response
from utils.rate_limit_helper import rate_limit
from utils.exception_strategies import handle_route_exceptions
from exceptions.custom_exceptions import ValidationError, NotFoundError, InternalServerError
from utils.validators import product_validator
from middleware.logging import log_user_activity

logger = logging.getLogger(__name__)

products_bp = Blueprint('products', __name__)
product_service = ProductService()

@products_bp.route('/', methods=['GET'])
@rate_limit("100 per hour")
@handle_route_exceptions
def get_products():
    """
    Retorna lista de produtos.
    
    Implementa tratamento robusto de exceções e validação de dados.

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
    
    category = request.args.get('category')
    search = request.args.get('search')

    products = product_service.get_products(page, per_page, category, search)

    return jsonify(products), 200

@products_bp.route('/search', methods=['GET'])
@rate_limit("100 per hour")
@handle_route_exceptions
def search_products():
    """
    Busca avançada de produtos com filtros.
    
    Implementa tratamento robusto de exceções e validação de dados.
    """
    # Parâmetros de busca
    query = request.args.get('q', '').strip()
    category = request.args.get('category')
    min_price = request.args.get('min_price', type=float)
    max_price = request.args.get('max_price', type=float)
    in_stock = request.args.get('in_stock', type=bool)
    featured = request.args.get('featured', type=bool)
    sort_by = request.args.get('sort_by', 'name')  # name, price_asc, price_desc, created_at
    
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

@products_bp.route('/<product_id>', methods=['GET'])
@rate_limit("200 per hour")
@handle_route_exceptions
def get_product(product_id):
    """
    Retorna detalhes de um produto.
    
    Implementa tratamento robusto de exceções e validação de dados.
    """
    if not product_id:
        raise ValidationError("product_id é obrigatório")
    
    product = product_service.get_product(product_id)

    if not product:
        raise NotFoundError('Produto não encontrado')

    return jsonify(product), 200

@products_bp.route('/recommended', methods=['GET'])
@token_required
@cache_response(timeout=300, vary_by=['limit'])  # 5 minutos (varia por usuário automaticamente)
@rate_limit("30 per minute")
@handle_route_exceptions
def get_recommended_products():
    """
    Retorna produtos recomendados para o usuário autenticado.
    
    Implementa tratamento robusto de exceções e validação de dados.

    Baseado em:
    - Histórico de compras
    - Objetivos de saúde
    - Produtos visualizados

    Query Parameters:
        limit (int): Número de produtos (padrão: 10)

    Returns:
        JSON: Lista de produtos recomendados
    """
    user_id = request.current_user['id']
    
    try:
        limit = int(request.args.get('limit', 10))
        if limit < 1 or limit > 50:
            raise ValidationError("limit deve estar entre 1 e 50")
    except (ValueError, TypeError):
        raise ValidationError("limit deve ser um número válido")

    # Buscar produtos recomendados (pode ser expandido com lógica de ML)
    # Por enquanto, retorna produtos mais bem avaliados e em estoque
    recommended = product_service.get_recommended_products(user_id, limit)

    return jsonify({
        'success': True,
        'products': recommended
    }), 200

@products_bp.route('/trending', methods=['GET'])
@rate_limit("50 per hour")
@handle_route_exceptions
def get_trending_products():
    """
    Retorna produtos em tendência.
    
    Implementa tratamento robusto de exceções e validação de dados.

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
        if limit < 1 or limit > 50:
            raise ValidationError("limit deve estar entre 1 e 50")
    except (ValueError, TypeError):
        raise ValidationError("limit deve ser um número válido")
    
    period = request.args.get('period', 'week')
    valid_periods = ['day', 'week', 'month']
    if period not in valid_periods:
        raise ValidationError(f"period deve ser um dos: {', '.join(valid_periods)}")

    trending = product_service.get_trending_products(limit, period)

    return jsonify({
        'success': True,
        'products': trending,
        'period': period
    }), 200

@products_bp.route('/', methods=['POST'])
@admin_required
@log_activity('product_created')
@handle_route_exceptions
def create_product():
    """
    Cria novo produto (admin).
    
    Implementa tratamento robusto de exceções e validação de dados.
    """
    data = request.get_json()

    # Valida dados
    if not product_validator.validate_product(data):
        raise ValidationError('Dados inválidos', details=product_validator.get_errors())

    # Cria produto
    result = product_service.create_product(data)

    if not result.get('success'):
        raise ValidationError(result.get('error', 'Erro ao criar produto'))

    log_user_activity(request.current_user['id'], 'product_created', {
        'product_name': data['name'],
        'category': data.get('category')
    })

    return jsonify({
        'message': 'Produto criado com sucesso',
        'product': result['product']
    }), 201

@products_bp.route('/<product_id>', methods=['PUT'])
@admin_required
@log_activity('product_updated')
@handle_route_exceptions
def update_product(product_id):
    """
    Atualiza produto (admin).
    
    Implementa tratamento robusto de exceções e validação de dados.
    """
    if not product_id:
        raise ValidationError("product_id é obrigatório")
    
    data = request.get_json()

    # Atualiza produto
    result = product_service.update_product(product_id, data)

    if not result.get('success'):
        raise NotFoundError(result.get('error', 'Produto não encontrado ou erro ao atualizar'))

    log_user_activity(request.current_user['id'], 'product_updated', {
        'product_id': product_id,
        'changes': data
    })

    return jsonify({
        'message': 'Produto atualizado com sucesso',
        'product': result['product']
    }), 200

@products_bp.route('/<product_id>/duplicate', methods=['POST'])
@admin_required
@rate_limit("10 per hour")
@log_activity('product_duplicated')
@handle_route_exceptions
def duplicate_product(product_id: str):
    """
    Duplica um produto existente (admin).
    
    Cria uma cópia do produto com nome modificado e ID novo.
    
    Returns:
        JSON: Produto duplicado ou erro
    """
    if not product_id:
        raise ValidationError("product_id é obrigatório")
    
    # Buscar produto original
    original = product_service.repo.find_by_id(product_id)
    if not original:
        raise NotFoundError("Produto não encontrado")
    
    # Criar cópia
    duplicate_data = original.copy()
    
    # Remover campos que não devem ser copiados
    duplicate_data.pop('id', None)
    duplicate_data.pop('created_at', None)
    duplicate_data.pop('updated_at', None)
    
    # Modificar nome para indicar cópia
    duplicate_data['name'] = f"{duplicate_data.get('name', 'Produto')} (Cópia)"
    
    # Criar novo produto
    result = product_service.create_product(duplicate_data)
    
    if not result.get('success'):
        raise ValidationError(result.get('error', 'Erro ao duplicar produto'))
    
    log_user_activity(request.current_user['id'], 'product_duplicated', {
        'original_id': product_id,
        'new_id': result['product']['id']
    })
    
    return jsonify({
        'message': 'Produto duplicado com sucesso',
        'product': result['product']
    }), 201

@products_bp.route('/import', methods=['POST'])
@admin_required
@rate_limit("5 per hour")
@log_activity('products_imported')
@handle_route_exceptions
def import_products():
    """
    Importa produtos em massa via CSV ou JSON (admin).
    
    Request Body:
        format (str): Formato (csv, json)
        data (str ou list): Dados dos produtos
        
    Returns:
        JSON: Resultado da importação
    """
    data = request.get_json()
    if not data:
        raise ValidationError("Dados são obrigatórios")
    
    import_format = data.get('format', 'json')
    products_data = data.get('data', [])
    
    if not products_data:
        raise ValidationError("data é obrigatório")
    
    # Se CSV, parsear
    if import_format == 'csv':
        import csv
        import io
        
        if isinstance(products_data, str):
            csv_reader = csv.DictReader(io.StringIO(products_data))
            products_data = list(csv_reader)
    
    # Validar e criar produtos
    created = []
    errors = []
    
    for idx, product_data in enumerate(products_data):
        try:
            # Validar dados básicos
            if not product_data.get('name') or not product_data.get('price'):
                errors.append({
                    'index': idx,
                    'error': 'Nome e preço são obrigatórios'
                })
                continue
            
            # Criar produto
            result = product_service.create_product(product_data)
            if result.get('success'):
                created.append(result['product'])
            else:
                errors.append({
                    'index': idx,
                    'error': result.get('error', 'Erro ao criar produto')
                })
        except Exception as e:
            errors.append({
                'index': idx,
                'error': str(e)
            })
    
    log_user_activity(request.current_user['id'], 'products_imported', {
        'total': len(products_data),
        'created': len(created),
        'errors': len(errors)
    })
    
    return jsonify({
        'message': f'Importação concluída: {len(created)} criados, {len(errors)} erros',
        'created': created,
        'errors': errors,
        'total': len(products_data),
        'success_count': len(created),
        'error_count': len(errors)
    }), 200

@products_bp.route('/categories', methods=['GET'])
@cache_response(timeout=3600, key_prefix='product_categories')  # 1 hora (categorias mudam raramente)
@rate_limit("100 per hour")
@handle_route_exceptions
def get_categories():
    """
    Retorna categorias de produtos.
    
    Implementa tratamento robusto de exceções e validação de dados.
    """
    categories = product_service.get_categories()
    return jsonify({'categories': categories}), 200

@products_bp.route('/<product_id>/reviews', methods=['GET'])
@rate_limit("100 per hour")
@handle_route_exceptions
def get_product_reviews(product_id):
    """
    Retorna avaliações de um produto.
    
    Implementa tratamento robusto de exceções e validação de dados.
    
    Query Parameters:
        page (int): Página de resultados (padrão: 1)
        per_page (int): Itens por página (padrão: 10)
        order_by (str): Ordenação - 'created_at', 'helpful', 'rating' (padrão: 'created_at')
    """
    if not product_id:
        raise ValidationError("product_id é obrigatório")
    
    try:
        page = int(request.args.get('page', 1))
        if page < 1:
            raise ValidationError("page deve ser maior que 0")
    except (ValueError, TypeError):
        raise ValidationError("page deve ser um número válido")
    
    try:
        per_page = int(request.args.get('per_page', 10))
        if per_page < 1 or per_page > 50:
            raise ValidationError("per_page deve estar entre 1 e 50")
    except (ValueError, TypeError):
        raise ValidationError("per_page deve ser um número válido")

    order_by = request.args.get('order_by', 'created_at')
    valid_order_by = ['created_at', 'helpful', 'rating']
    if order_by not in valid_order_by:
        raise ValidationError(f"order_by deve ser um dos: {', '.join(valid_order_by)}")

    reviews = product_service.get_product_reviews(product_id, page, per_page, order_by)

    return jsonify(reviews), 200

@products_bp.route('/<product_id>/reviews', methods=['POST'])
@token_required
@rate_limit("10 per hour")
@log_activity('review_created')
@handle_route_exceptions
def create_product_review(product_id):
    """
    Cria uma avaliação para um produto.
    
    Implementa tratamento robusto de exceções e validação de dados.
    
    Request Body:
        rating (int): Nota de 1 a 5 (obrigatório)
        comment (str): Comentário da avaliação
        title (str): Título da avaliação (opcional)
        pros (str): Pontos positivos (opcional)
        cons (str): Pontos negativos (opcional)
        images (array): Array de URLs de imagens (opcional)
        verified (bool): Se o usuário comprou o produto (opcional)
    """
    if not product_id:
        raise ValidationError("product_id é obrigatório")
    
    user_id = request.current_user.get('id')
    if not user_id:
        raise ValidationError("Usuário não autenticado")
    
    data = request.get_json()
    if not data:
        raise ValidationError("Dados da avaliação são obrigatórios")
    
    # Validar rating
    if 'rating' not in data:
        raise ValidationError("rating é obrigatório")
    
    try:
        rating = int(data['rating'])
        if rating < 1 or rating > 5:
            raise ValidationError("rating deve estar entre 1 e 5")
    except (ValueError, TypeError):
        raise ValidationError("rating deve ser um número inteiro entre 1 e 5")

    result = product_service.create_review(product_id, user_id, data)

    if not result.get('success'):
        raise ValidationError(result.get('error', 'Erro ao criar avaliação'))

    log_user_activity(user_id, 'review_created', {
        'product_id': product_id,
        'review_id': result['review'].get('id'),
        'rating': rating
    })

    return jsonify(result), 201

@products_bp.route('/<product_id>/reviews/<review_id>', methods=['PUT'])
@token_required
@rate_limit("20 per hour")
@log_activity('review_updated')
@handle_route_exceptions
def update_product_review(product_id, review_id):
    """
    Atualiza uma avaliação de produto.
    
    Implementa tratamento robusto de exceções e validação de dados.
    
    Apenas o dono da avaliação ou admin pode atualizar.
    """
    if not product_id:
        raise ValidationError("product_id é obrigatório")
    
    if not review_id:
        raise ValidationError("review_id é obrigatório")
    
    user_id = request.current_user.get('id')
    if not user_id:
        raise ValidationError("Usuário não autenticado")
    
    data = request.get_json()
    if not data:
        raise ValidationError("Dados da avaliação são obrigatórios")
    
    # Validar rating se fornecido
    if 'rating' in data:
        try:
            rating = int(data['rating'])
            if rating < 1 or rating > 5:
                raise ValidationError("rating deve estar entre 1 e 5")
        except (ValueError, TypeError):
            raise ValidationError("rating deve ser um número inteiro entre 1 e 5")

    result = product_service.update_review(review_id, user_id, data)

    if not result.get('success'):
        raise ValidationError(result.get('error', 'Erro ao atualizar avaliação'))

    log_user_activity(user_id, 'review_updated', {
        'product_id': product_id,
        'review_id': review_id
    })

    return jsonify(result), 200

@products_bp.route('/<product_id>/reviews/<review_id>', methods=['DELETE'])
@token_required
@rate_limit("10 per hour")
@log_activity('review_deleted')
@handle_route_exceptions
def delete_product_review(product_id, review_id):
    """
    Deleta uma avaliação de produto.
    
    Implementa tratamento robusto de exceções e validação de dados.
    
    Apenas o dono da avaliação ou admin pode deletar.
    """
    if not product_id:
        raise ValidationError("product_id é obrigatório")
    
    if not review_id:
        raise ValidationError("review_id é obrigatório")
    
    user_id = request.current_user.get('id')
    if not user_id:
        raise ValidationError("Usuário não autenticado")

    result = product_service.delete_review(review_id, user_id)

    if not result.get('success'):
        raise ValidationError(result.get('error', 'Erro ao deletar avaliação'))

    log_user_activity(user_id, 'review_deleted', {
        'product_id': product_id,
        'review_id': review_id
    })

    return jsonify(result), 200

@products_bp.route('/<product_id>/reviews/<review_id>/helpful', methods=['POST'])
@token_required
@rate_limit("30 per hour")
@handle_route_exceptions
def vote_review_helpful(product_id, review_id):
    """
    Vota em uma avaliação como útil ou não útil.
    
    Implementa tratamento robusto de exceções e validação de dados.
    
    Request Body:
        is_helpful (bool): True se útil, False se não útil (padrão: True)
    """
    if not product_id:
        raise ValidationError("product_id é obrigatório")
    
    if not review_id:
        raise ValidationError("review_id é obrigatório")
    
    user_id = request.current_user.get('id')
    if not user_id:
        raise ValidationError("Usuário não autenticado")
    
    data = request.get_json() or {}
    is_helpful = data.get('is_helpful', True)
    
    if not isinstance(is_helpful, bool):
        raise ValidationError("is_helpful deve ser um booleano")

    result = product_service.vote_review_helpful(review_id, user_id, is_helpful)

    if not result.get('success'):
        raise ValidationError(result.get('error', 'Erro ao votar em avaliação'))

    return jsonify(result), 200


@products_bp.route('/featured', methods=['GET'])
@cache_response(timeout=600, key_prefix='featured_products')  # 10 minutos
@rate_limit("100 per hour")
@handle_route_exceptions
def get_featured_products():
    """
    Retorna produtos em destaque.
    
    Implementa tratamento robusto de exceções e validação de dados.
    """
    products = product_service.get_featured_products()
    return jsonify({'products': products}), 200

# Função get_recommended_products duplicada removida - usar /recommended (linha 128)
