"""
Documentação Swagger/OpenAPI para RE-EDUCA Store
"""
from flask import Blueprint
from flask_restx import Api, Resource, fields
from services.product_service import ProductService
from services.health_service import HealthService
from services.exercise_service import ExerciseService
from services.ai_service import AIService

swagger_bp = Blueprint('swagger', __name__)
api = Api(swagger_bp, 
          title='RE-EDUCA Store API',
          version='1.0',
          description='API completa para loja de suplementos e ferramentas de saúde',
          doc='/docs/',
          prefix='/api/docs')

# Namespaces
ns_products = api.namespace('products', description='Operações de produtos')
ns_health = api.namespace('health', description='Ferramentas de saúde')
ns_exercises = api.namespace('exercises', description='Exercícios e treinos')
ns_ai = api.namespace('ai', description='Inteligência Artificial')

# Modelos de dados
product_model = api.model('Product', {
    'id': fields.String(description='ID único do produto'),
    'name': fields.String(required=True, description='Nome do produto'),
    'description': fields.String(description='Descrição do produto'),
    'price': fields.Float(required=True, description='Preço do produto'),
    'category': fields.String(description='Categoria do produto'),
    'image_url': fields.String(description='URL da imagem'),
    'stock_quantity': fields.Integer(description='Quantidade em estoque'),
    'is_active': fields.Boolean(description='Produto ativo'),
    'created_at': fields.DateTime(description='Data de criação'),
    'updated_at': fields.DateTime(description='Data de atualização')
})

product_list_model = api.model('ProductList', {
    'products': fields.List(fields.Nested(product_model)),
    'pagination': fields.Nested(api.model('Pagination', {
        'page': fields.Integer(description='Página atual'),
        'per_page': fields.Integer(description='Itens por página'),
        'total': fields.Integer(description='Total de itens'),
        'pages': fields.Integer(description='Total de páginas')
    }))
})

imc_request_model = api.model('IMCRequest', {
    'height': fields.Float(required=True, description='Altura em metros'),
    'weight': fields.Float(required=True, description='Peso em kg')
})

imc_response_model = api.model('IMCResponse', {
    'imc': fields.Float(description='Valor do IMC'),
    'classification': fields.String(description='Classificação do IMC'),
    'color': fields.String(description='Cor para exibição'),
    'recommendations': fields.List(fields.String, description='Recomendações'),
    'weight_range': fields.Nested(api.model('WeightRange', {
        'min': fields.Float(description='Peso mínimo ideal'),
        'max': fields.Float(description='Peso máximo ideal')
    }))
})

calories_request_model = api.model('CaloriesRequest', {
    'weight': fields.Float(required=True, description='Peso em kg'),
    'height': fields.Float(required=True, description='Altura em cm'),
    'age': fields.Integer(required=True, description='Idade em anos'),
    'gender': fields.String(required=True, enum=['male', 'female'], description='Gênero'),
    'activity_level': fields.String(required=True, enum=['sedentary', 'light', 'moderate', 'active', 'very_active'], description='Nível de atividade')
})

calories_response_model = api.model('CaloriesResponse', {
    'bmr': fields.Float(description='Taxa metabólica basal'),
    'tdee': fields.Float(description='Gasto calórico total diário'),
    'calories': fields.Float(description='Calorias recomendadas'),
    'macros': fields.Nested(api.model('Macros', {
        'protein': fields.Float(description='Proteínas (g)'),
        'carbs': fields.Float(description='Carboidratos (g)'),
        'fat': fields.Float(description='Gorduras (g)')
    }))
})

exercise_model = api.model('Exercise', {
    'id': fields.String(description='ID único do exercício'),
    'name': fields.String(description='Nome do exercício'),
    'description': fields.String(description='Descrição do exercício'),
    'category': fields.String(description='Categoria do exercício'),
    'difficulty': fields.String(description='Nível de dificuldade'),
    'equipment': fields.String(description='Equipamento necessário'),
    'muscle_groups': fields.List(fields.String, description='Grupos musculares trabalhados'),
    'instructions': fields.List(fields.String, description='Instruções de execução'),
    'image_url': fields.String(description='URL da imagem'),
    'video_url': fields.String(description='URL do vídeo')
})

ai_chat_request_model = api.model('AIChatRequest', {
    'message': fields.String(required=True, description='Mensagem do usuário')
})

ai_chat_response_model = api.model('AIChatResponse', {
    'response': fields.String(description='Resposta da IA'),
    'timestamp': fields.DateTime(description='Timestamp da resposta')
})

# Rotas de Produtos
@ns_products.route('/')
class ProductList(Resource):
    @api.doc('list_products')
    @api.marshal_with(product_list_model)
    def get(self):
        """Lista todos os produtos com paginação"""
        service = ProductService()
        page = int(api.payload.get('page', 1)) if api.payload else 1
        per_page = int(api.payload.get('per_page', 20)) if api.payload else 20
        category = api.payload.get('category') if api.payload else None
        search = api.payload.get('search') if api.payload else None
        
        return service.get_products(page=page, per_page=per_page, category=category, search=search)

@ns_products.route('/<string:product_id>')
class Product(Resource):
    @api.doc('get_product')
    @api.marshal_with(product_model)
    def get(self, product_id):
        """Retorna detalhes de um produto específico"""
        service = ProductService()
        return service.get_product(product_id)

@ns_products.route('/categories')
class ProductCategories(Resource):
    @api.doc('get_categories')
    def get(self):
        """Retorna lista de categorias de produtos"""
        service = ProductService()
        return service.get_categories()

@ns_products.route('/featured')
class FeaturedProducts(Resource):
    @api.doc('get_featured_products')
    def get(self):
        """Retorna produtos em destaque"""
        service = ProductService()
        return service.get_featured_products()

# Rotas de Saúde
@ns_health.route('/imc/calculate')
class IMCCalculate(Resource):
    @api.doc('calculate_imc')
    @api.expect(imc_request_model)
    @api.marshal_with(imc_response_model)
    def post(self):
        """Calcula IMC e retorna classificação"""
        service = HealthService()
        data = api.payload
        # Aqui você implementaria a lógica de cálculo
        return {
            'imc': 24.5,
            'classification': 'Peso normal',
            'color': 'green',
            'recommendations': ['Manter alimentação equilibrada', 'Praticar exercícios regularmente'],
            'weight_range': {'min': 60.0, 'max': 80.0}
        }

@ns_health.route('/calories/calculate')
class CaloriesCalculate(Resource):
    @api.doc('calculate_calories')
    @api.expect(calories_request_model)
    @api.marshal_with(calories_response_model)
    def post(self):
        """Calcula necessidade calórica diária"""
        # Aqui você implementaria a lógica de cálculo
        return {
            'bmr': 1800.0,
            'tdee': 2500.0,
            'calories': 2500.0,
            'macros': {
                'protein': 150.0,
                'carbs': 300.0,
                'fat': 80.0
            }
        }

# Rotas de Exercícios
@ns_exercises.route('/')
class ExerciseList(Resource):
    @api.doc('list_exercises')
    def get(self):
        """Lista exercícios disponíveis"""
        service = ExerciseService()
        return service.get_exercises()

@ns_exercises.route('/categories')
class ExerciseCategories(Resource):
    @api.doc('get_exercise_categories')
    def get(self):
        """Retorna categorias de exercícios"""
        service = ExerciseService()
        return service.get_categories()

# Rotas de IA
@ns_ai.route('/chat')
class AIChat(Resource):
    @api.doc('ai_chat')
    @api.expect(ai_chat_request_model)
    @api.marshal_with(ai_chat_response_model)
    def post(self):
        """Chat com IA para recomendações de saúde"""
        service = AIService()
        data = api.payload
        # Aqui você implementaria a lógica de IA
        return {
            'response': 'Olá! Como posso ajudá-lo com suas metas de saúde hoje?',
            'timestamp': '2024-01-01T00:00:00Z'
        }

@ns_ai.route('/recommendations/products')
class AIProductRecommendations(Resource):
    @api.doc('get_ai_product_recommendations')
    def get(self):
        """Retorna recomendações de produtos baseadas em IA"""
        service = AIService()
        return service.get_product_recommendations()

# Rota de status da API
@api.route('/status')
class APIStatus(Resource):
    @api.doc('api_status')
    def get(self):
        """Status da API"""
        return {
            'status': 'online',
            'version': '1.0',
            'timestamp': '2024-01-01T00:00:00Z',
            'endpoints': {
                'products': '/api/products/',
                'health': '/api/health/',
                'exercises': '/api/exercises/',
                'ai': '/api/ai/'
            }
        }