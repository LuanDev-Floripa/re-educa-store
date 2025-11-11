"""
Middleware CORS para RE-EDUCA Store.

Configura CORS (Cross-Origin Resource Sharing) para permitir
acesso de domínios autorizados com headers de segurança adicionais.
"""

import logging
import os

from flask import Flask, request
from flask_cors import CORS
from utils.cors_helpers import get_allowed_origins, is_origin_allowed

logger = logging.getLogger(__name__)


def setup_cors(app: Flask):
    """
    Configura CORS para a aplicação.

    Configura origens permitidas, métodos HTTP, headers aceitos
    e adiciona headers de segurança às respostas.

    Args:
        app (Flask): Instância da aplicação Flask.
    """

    environment = os.getenv("FLASK_ENV", "development")
    all_origins = get_allowed_origins(environment)

    # Configuração CORS
    CORS(
        app,
        origins=all_origins,
        methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "HEAD", "PATCH"],
        allow_headers=["Content-Type", "Authorization", "X-Requested-With", "Accept", "Origin"],
        supports_credentials=True,
        max_age=3600,
        automatic_options=True,
    )  # Auto-responder OPTIONS sem redirect

    # Handler específico para OPTIONS (preflight) - evitar redirects
    @app.before_request
    def handle_preflight():
        from flask import make_response, request

        if request.method == "OPTIONS":
            origin = request.headers.get("Origin", "")
            if is_origin_allowed(origin, all_origins):
                response = make_response()
                response.headers.add("Access-Control-Allow-Origin", origin)
                response.headers.add(
                    "Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With, Accept, Origin"
                )
                response.headers.add("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, HEAD, PATCH")
                response.headers.add("Access-Control-Allow-Credentials", "true")
                response.headers.add("Access-Control-Max-Age", "3600")
                return response
            else:
                client_ip = request.remote_addr or request.environ.get("HTTP_X_FORWARDED_FOR", "unknown")
                logger.warning(
                    f"CORS bloqueado (preflight): origem={origin}, IP={client_ip}, "
                    f"path={request.path}, método={request.method}"
                )
                return make_response("Forbidden", 403)

    @app.after_request
    def add_cors_and_security_headers(response):
        """
        Adiciona headers CORS e de segurança às respostas.

        Args:
            response: Objeto de resposta Flask.

        Returns:
            Response com headers CORS e de segurança adicionados.
        """
        # Adiciona headers CORS em todas as respostas (mesmo em erros)
        origin = request.headers.get("Origin", "")
        if is_origin_allowed(origin, all_origins):
            # Não usa .add() para sobrescrever qualquer header existente
            response.headers["Access-Control-Allow-Origin"] = origin
            response.headers["Access-Control-Allow-Credentials"] = "true"
        elif origin:
            client_ip = request.remote_addr or request.environ.get("HTTP_X_FORWARDED_FOR", "unknown")
            logger.warning(
                f"CORS bloqueado: origem={origin}, IP={client_ip}, " f"path={request.path}, método={request.method}"
            )

        # Headers de segurança
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"

        # HSTS apenas em HTTPS (produção)
        if not app.config.get("DEBUG", False):
            response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"

        # Content Security Policy (CSP) - configurar conforme necessário
        # response.headers['Content-Security-Policy'] = "default-src 'self'"

        return response
