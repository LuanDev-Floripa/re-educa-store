"""
Middleware de Versionamento de API RE-EDUCA Store.

Gerencia versionamento e deprecação de endpoints.

Sistema de versionamento de API implementado para gerenciar evolução de endpoints.
"""

import logging
from functools import wraps

from flask import jsonify, request

logger = logging.getLogger(__name__)


def deprecated_api(version: str, sunset_date: str = None, alternative: str = None):
    """
    Decorator para marcar endpoints como depreciados.

    Args:
        version: Versão em que foi depreciado (ex: 'v1')
        sunset_date: Data em que será removido (formato: 'YYYY-MM-DD')
        alternative: Endpoint alternativo recomendado

    Returns:
        Decorator function
    """

    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            # Adiciona headers de deprecação
            response = f(*args, **kwargs)

            # Se for uma resposta JSON, adiciona headers
            if hasattr(response, "headers"):
                response.headers["Deprecation"] = "true"
                response.headers["API-Version"] = version
                if sunset_date:
                    response.headers["Sunset"] = sunset_date
                if alternative:
                    response.headers["Link"] = f'<{alternative}>; rel="successor-version"'

                # Adiciona warning no log
                logger.warning(
                    f"Endpoint depreciado acessado: {request.path} " f"(versão: {version}, sunset: {sunset_date})"
                )

            return response

        return decorated_function

    return decorator


def check_api_version():
    """
    Verifica versão da API no header Accept.

    Formato esperado: application/vnd.api+json;version=v1

    Returns:
        str: Versão da API ou 'v1' como padrão
    """
    accept_header = request.headers.get("Accept", "")

    # Verifica se há versionamento no Accept header
    if "version=" in accept_header:
        try:
            version = accept_header.split("version=")[1].split(";")[0].split(",")[0]
            return version.strip()
        except (IndexError, AttributeError) as e:
            # Fallback: se não conseguir parsear header, continua sem version
            logger.debug(f"Erro ao parsear version do header (fallback aceitável): {str(e)}")
            pass
        except Exception as e:
            logger.debug(f"Erro inesperado ao parsear version: {str(e)}")
            pass

    # Verifica no path
    if "/v1/" in request.path:
        return "v1"
    elif "/v2/" in request.path:
        return "v2"

    # Padrão: v1
    return "v1"


def require_api_version(version: str):
    """
    Decorator para exigir versão específica da API.

    Args:
        version: Versão exigida (ex: 'v1')

    Returns:
        Decorator function
    """

    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            requested_version = check_api_version()

            if requested_version != version:
                return (
                    jsonify(
                        {
                            "success": False,
                            "error": f"Versão de API inválida. Versão requerida: {version}, recebida: {requested_version}",
                            "api_version": version,
                        }
                    ),
                    400,
                )

            return f(*args, **kwargs)

        return decorated_function

    return decorator
