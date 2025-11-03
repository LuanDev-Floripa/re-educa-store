"""
Middleware CORS para RE-EDUCA Store.

Configura CORS (Cross-Origin Resource Sharing) para permitir
acesso de domínios autorizados com headers de segurança adicionais.
"""
import os
import logging
from flask import Flask
from flask_cors import CORS

logger = logging.getLogger(__name__)


def setup_cors(app: Flask):
    """
    Configura CORS para a aplicação.

    Configura origens permitidas, métodos HTTP, headers aceitos
    e adiciona headers de segurança às respostas.

    Args:
        app (Flask): Instância da aplicação Flask.
    """

    # Obter origens permitidas do .env
    # IMPORTANTE: Em produção, configurar CORS_ORIGINS explicitamente
    cors_origins_env = os.getenv('CORS_ORIGINS', '')

    # Origens padrão apenas para desenvolvimento
    default_origins = []
    if app.config.get('DEBUG', False):
        default_origins = [
            'http://localhost:9002',
            'http://localhost:3000',
            'http://localhost:5173',
            'http://localhost:5174'
        ]

    # Combinar origens do env e defaults
    if cors_origins_env:
        cors_origins = [origin.strip() for origin in cors_origins_env.split(',') if origin.strip()]
        all_origins = list(set(cors_origins + default_origins))
    else:
        # Se não definido e não é dev, usar lista vazia (mais seguro)
        if app.config.get('DEBUG', False):
            all_origins = default_origins
        else:
            # Em produção, exige CORS_ORIGINS definido
            all_origins = []
            logger.warning(
                "CORS_ORIGINS não definido em produção! Configure a variável de ambiente CORS_ORIGINS."
            )

    # Configuração CORS
    CORS(app,
         origins=all_origins,
         methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'HEAD', 'PATCH'],
         allow_headers=['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
         supports_credentials=True,
         max_age=3600)

    @app.after_request
    def add_security_headers(response):
        """
        Adiciona headers de segurança às respostas.

        Args:
            response: Objeto de resposta Flask.

        Returns:
            Response com headers de segurança adicionados.
        """
        # Headers de segurança
        response.headers['X-Content-Type-Options'] = 'nosniff'
        response.headers['X-Frame-Options'] = 'DENY'
        response.headers['X-XSS-Protection'] = '1; mode=block'
        response.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'

        # HSTS apenas em HTTPS (produção)
        if not app.config.get('DEBUG', False):
            response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'

        # Content Security Policy (CSP) - configurar conforme necessário
        # response.headers['Content-Security-Policy'] = "default-src 'self'"

        return response
