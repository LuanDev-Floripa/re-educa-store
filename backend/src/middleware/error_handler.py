# -*- coding: utf-8 -*-
"""
Handler global de erros para RE-EDUCA Store.

Centraliza tratamento de todas as exceções e padroniza respostas de erro.
"""
import logging
import traceback

from exceptions.custom_exceptions import BaseAPIException
from flask import jsonify, request

logger = logging.getLogger(__name__)


def register_error_handlers(app):
    """
    Registra todos os handlers de erro na aplicação Flask.

    Args:
        app: Instância da aplicação Flask
    """

    @app.errorhandler(BaseAPIException)
    def handle_api_exception(error: BaseAPIException):
        """Handler para exceções customizadas da API"""
        logger.warning(
            f"API Exception: {error.error_code} - {error.message}",
            extra={
                "error_code": error.error_code,
                "status_code": error.status_code,
                "path": request.path,
                "method": request.method,
                "details": error.details,
            },
        )

        response = jsonify(error.to_dict())
        response.status_code = error.status_code
        return response

    @app.errorhandler(404)
    def handle_not_found(error):
        """Handler para recursos não encontrados"""
        logger.info(f"Not Found: {request.path}", extra={"path": request.path, "method": request.method})
        return (
            jsonify(
                {
                    "error": True,
                    "error_code": "NOT_FOUND",
                    "message": "Recurso não encontrado",
                    "details": {"path": request.path},
                }
            ),
            404,
        )

    @app.errorhandler(405)
    def handle_method_not_allowed(error):
        """Handler para métodos não permitidos"""
        logger.warning(
            f"Method Not Allowed: {request.method} {request.path}",
            extra={"path": request.path, "method": request.method},
        )
        return (
            jsonify(
                {
                    "error": True,
                    "error_code": "METHOD_NOT_ALLOWED",
                    "message": "Método não permitido",
                    "details": {"method": request.method, "path": request.path},
                }
            ),
            405,
        )

    @app.errorhandler(400)
    def handle_bad_request(error):
        """Handler para requisições inválidas"""
        logger.warning(f"Bad Request: {request.path}", extra={"path": request.path, "method": request.method})
        return (
            jsonify({"error": True, "error_code": "BAD_REQUEST", "message": "Requisição inválida", "details": {}}),
            400,
        )

    @app.errorhandler(500)
    def handle_internal_error(error):
        """Handler para erros internos do servidor"""
        # Log detalhado do erro em desenvolvimento, genérico em produção
        is_debug = app.config.get("DEBUG", False)

        error_details = {"path": request.path, "method": request.method}

        if is_debug:
            error_details["traceback"] = traceback.format_exc()
            error_details["error_message"] = str(error)

        logger.error(f"Internal Server Error: {request.path}", exc_info=True, extra=error_details)

        # Não expor detalhes internos em produção
        message = "Erro interno do servidor"
        if is_debug:
            message = str(error)

        return (
            jsonify(
                {
                    "error": True,
                    "error_code": "INTERNAL_SERVER_ERROR",
                    "message": message,
                    "details": error_details if is_debug else {},
                }
            ),
            500,
        )

    @app.errorhandler(429)
    def handle_rate_limit(error):
        """Handler para rate limit"""
        logger.warning(
            f"Rate Limit Exceeded: {request.path}",
            extra={"path": request.path, "method": request.method, "remote_addr": request.remote_addr},
        )
        return (
            jsonify(
                {
                    "error": True,
                    "error_code": "RATE_LIMIT_EXCEEDED",
                    "message": "Muitas requisições. Tente novamente mais tarde.",
                    "details": {},
                }
            ),
            429,
        )

    @app.errorhandler(Exception)
    def handle_generic_exception(error: Exception):
        """Handler genérico para qualquer exceção não tratada"""
        is_debug = app.config.get("DEBUG", False)

        error_details = {"path": request.path, "method": request.method, "error_type": type(error).__name__}

        if is_debug:
            error_details["traceback"] = traceback.format_exc()
            error_details["error_message"] = str(error)

        logger.error(
            f"Unhandled Exception: {type(error).__name__} - {request.path}", exc_info=True, extra=error_details
        )

        # Se for exceção customizada, trata de forma apropriada
        if isinstance(error, BaseAPIException):
            return handle_api_exception(error)

        # Erro genérico
        message = "Erro interno do servidor"
        if is_debug:
            message = str(error)

        return (
            jsonify(
                {
                    "error": True,
                    "error_code": "INTERNAL_SERVER_ERROR",
                    "message": message,
                    "details": error_details if is_debug else {},
                }
            ),
            500,
        )
