# -*- coding: utf-8 -*-
"""
Aplicação principal RE-EDUCA Store
"""
import os
import logging
from flask import Flask
from flask_socketio import SocketIO
from config.settings import get_config
from config.database import test_db_connection
from middleware.cors import setup_cors
from middleware.logging import setup_logging
from middleware.rate_limit import setup_rate_limiting  # DEPRECATED - usar rate_limit_redis
from middleware.rate_limit_redis import setup_rate_limiting_redis


def validate_critical_config(config):
    """
    Valida variáveis de configuração críticas no startup.

    Args:
        config: Objeto de configuração.

    Raises:
        ValueError: Se alguma variável crítica não estiver configurada.
    """
    critical_vars = {
        'SECRET_KEY': config.SECRET_KEY,
        'SUPABASE_URL': config.SUPABASE_URL,
        'SUPABASE_KEY': config.SUPABASE_KEY,
    }

    missing_vars = [var for var, value in critical_vars.items() if not value]

    if missing_vars:
        raise ValueError(
            f"Variáveis críticas não configuradas: {', '.join(missing_vars)}. "
            f"Verifique seu arquivo .env"
        )


def create_app(config_name=None):
    """Factory function para criar a aplicação Flask"""

    # Cria a aplicação Flask
    app = Flask(__name__, static_folder='static')

    # Carrega configurações
    config = get_config(config_name)
    app.config.from_object(config)

    # Valida variáveis críticas no startup
    validate_critical_config(config)

    # Configura logging
    setup_logging(app)
    logger = logging.getLogger(__name__)

    # Configura CORS
    setup_cors(app)

    # Configura rate limiting com Redis (substitui implementação em memória)
    setup_rate_limiting_redis(app)
    logger.info("Rate limiting com Redis configurado")

    # Testa conexão com banco de dados
    if not test_db_connection():
        logger.warning("Conexão com banco de dados falhou")

    # Configura SocketIO
    socketio = SocketIO(app, cors_allowed_origins="*", logger=True, engineio_logger=True)

    # Registra blueprints
    register_blueprints(app)

    # Configura WebSocket
    setup_websocket(socketio)

    # Registra handlers de erro
    register_error_handlers(app)

    logger.info("Aplicação RE-EDUCA Store inicializada com sucesso")

    return app, socketio


def register_blueprints(app):
    """Registra os blueprints da aplicação"""
    from routes.auth import auth_bp
    from routes.users import users_bp
    from routes.products import products_bp
    from routes.orders import orders_bp
    from routes.cart import cart_bp
    from routes.health_tools import health_tools_bp
    from routes.admin import admin_bp
    from routes.admin_ai import admin_ai_bp
    from routes.admin_ai_rotation import admin_ai_rotation_bp
    from routes.payments import payments_bp
    from routes.coupons import coupons_bp
    from routes.ai import ai_bp
    from routes.exercises import exercises_bp
    from routes.health_calculators import health_calculators_bp
    from routes.social import social_bp
    from routes.live_streaming import live_streaming_bp
    from routes.video_routes import video_bp
    from routes.system_routes import system_bp
    from routes.swagger import swagger_bp
    from routes.predictive import predictive_bp
    from routes.social_additional import social_additional_bp
    from routes.users_exports import exports_bp
    from routes.user_context import user_context_bp
    from routes.search import search_bp
    from routes.recommendations import recommendations_bp

    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(users_bp, url_prefix='/api/users')
    app.register_blueprint(user_context_bp)  # Já tem url_prefix='/api/user'
    app.register_blueprint(products_bp, url_prefix='/api/products')
    app.register_blueprint(orders_bp, url_prefix='/api/orders')
    app.register_blueprint(cart_bp, url_prefix='/api/cart')
    app.register_blueprint(health_tools_bp, url_prefix='/api/health')

    # LGPD Compliance
    from routes.lgpd import lgpd_bp
    app.register_blueprint(lgpd_bp)
    app.register_blueprint(exercises_bp, url_prefix='/api/exercises')
    app.register_blueprint(health_calculators_bp, url_prefix='/api/health-calculators')
    app.register_blueprint(predictive_bp, url_prefix='/api/predictive')
    app.register_blueprint(admin_bp, url_prefix='/api/admin')
    app.register_blueprint(admin_ai_bp, url_prefix='/api/admin/ai')
    app.register_blueprint(admin_ai_rotation_bp, url_prefix='/api/admin/ai/rotation')
    app.register_blueprint(payments_bp, url_prefix='/api/payments')
    app.register_blueprint(coupons_bp, url_prefix='/api/coupons')
    app.register_blueprint(ai_bp, url_prefix='/api/ai')
    app.register_blueprint(social_bp, url_prefix='/api/social')
    app.register_blueprint(live_streaming_bp, url_prefix='/api/social/streams')
    app.register_blueprint(social_additional_bp, url_prefix='/api/social')
    app.register_blueprint(exports_bp, url_prefix='/api/users/exports')
    app.register_blueprint(swagger_bp)
    app.register_blueprint(system_bp, url_prefix='/api/system')
    app.register_blueprint(video_bp, url_prefix='/api/videos')
    app.register_blueprint(search_bp)  # Já tem url_prefix='/api/search'
    app.register_blueprint(recommendations_bp)  # Já tem url_prefix='/api/recommendations'


def setup_websocket(socketio):
    from services.integration_service import integration_service

    # Inicializar WebSocket via serviço de integração
    ws_service = integration_service.initialize_websocket(socketio)
    """Configura WebSocket para live streaming"""
    from services.websocket_service import WebSocketService

    # Inicializa serviço de WebSocket
    ws_service = WebSocketService(socketio)

    # Eventos de conexão
    @socketio.on('connect')
    def handle_connect(auth=None):
        return ws_service.on_connect(auth)

    @socketio.on('disconnect')
    def handle_disconnect():
        return ws_service.on_disconnect()

    # Eventos de live streaming
    @socketio.on('join_stream')
    def handle_join_stream(data):
        return ws_service.on_join_stream(data)

    @socketio.on('leave_stream')
    def handle_leave_stream(data):
        return ws_service.on_leave_stream(data)

    @socketio.on('send_message')
    def handle_send_message(data):
        return ws_service.on_send_message(data)

    @socketio.on('send_gift')
    def handle_send_gift(data):
        return ws_service.on_send_gift(data)

    @socketio.on('like_message')
    def handle_like_message(data):
        return ws_service.on_like_message(data)

    @socketio.on('follow_user')
    def handle_follow_user(data):
        return ws_service.on_follow_user(data)

    @socketio.on('report_stream')
    def handle_report_stream(data):
        return ws_service.on_report_stream(data)


def register_error_handlers(app):
    """Registra handlers de erro"""
    from middleware.error_handler import register_error_handlers as register_custom_error_handlers
    register_custom_error_handlers(app)

    # Health checks completos
    @app.route('/health')
    def health_check():
        """Health check básico"""
        return {'status': 'healthy', 'service': 'RE-EDUCA Store API'}, 200

    @app.route('/health/detailed')
    def health_check_detailed():
        """Health check detalhado com todos os serviços"""
        from utils.health_checks import health_check_service
        result = health_check_service.perform_health_check()
        status_code = 200 if result['status'] == 'healthy' else 503
        return result, status_code

    # Métricas Prometheus (se disponível)
    try:
        from monitoring.metrics import generate_latest, CONTENT_TYPE_LATEST
        @app.route('/metrics')
        def metrics():
            """Endpoint de métricas Prometheus"""
            return generate_latest(), 200, {'Content-Type': CONTENT_TYPE_LATEST}
    except ImportError:
        pass  # Prometheus não disponível


def main():
    """Função principal para executar a aplicação"""
    app, socketio = create_app()

    # Configurações baseadas no ambiente
    debug = os.environ.get('FLASK_DEBUG', 'false').lower() == 'true'
    host = os.environ.get('HOST', '0.0.0.0')
    port = int(os.environ.get('PORT', 9001))
    environment = os.environ.get('FLASK_ENV', 'development')

    print("🚀 RE-EDUCA Store iniciando...")
    print("📍 Host: " + str(host))
    print("🔌 Porta: " + str(port))
    print("🐛 Debug: " + str(debug))
    print("🌐 Ambiente: " + str(environment))
    print("🔌 WebSocket: Ativado")

    # Configuração de produção vs desenvolvimento
    if environment == 'production':
        socketio.run(app, host=host, port=port, debug=False, allow_unsafe_werkzeug=True)
    else:
        socketio.run(app, host=host, port=port, debug=debug, allow_unsafe_werkzeug=True)


if __name__ == '__main__':
    main()
