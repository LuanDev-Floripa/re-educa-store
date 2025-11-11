# -*- coding: utf-8 -*-
"""
Helpers para configuração de CORS RE-EDUCA Store.

Centraliza lógica de validação e gerenciamento de origens permitidas.
"""
import logging
import os
from typing import List, Optional

logger = logging.getLogger(__name__)


def get_allowed_origins(environment: Optional[str] = None) -> List[str]:
    """
    Retorna lista de origens permitidas baseada no ambiente.

    Args:
        environment: Ambiente ('development', 'production', etc.)
            Se None, usa FLASK_ENV ou 'development'

    Returns:
        Lista de origens permitidas (URLs)
    """
    if environment is None:
        environment = os.getenv("FLASK_ENV", "development")

    # Obter origens do .env
    cors_origins_env = os.getenv("CORS_ORIGINS", "")

    # Origens padrão para desenvolvimento
    default_origins = [
        "http://localhost:9002",
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:5174",
    ]

    # Origens de produção (sempre incluir)
    production_origins = [
        "https://re-educa.topsupplementslab.com",
        "https://www.re-educa.topsupplementslab.com",
        "https://topsupplementslab.com",
    ]

    # Combinar origens
    all_origins = list(set(default_origins + production_origins))

    # Adicionar origens do .env se especificadas
    if cors_origins_env:
        cors_origins = [origin.strip() for origin in cors_origins_env.split(",") if origin.strip()]
        all_origins.extend(cors_origins)
        all_origins = list(set(all_origins))  # Remover duplicatas

    # Logging para debug
    if environment == "development":
        logger.debug(f"Origens CORS permitidas ({environment}): {all_origins}")

    return all_origins


def is_origin_allowed(origin: str, allowed_origins: Optional[List[str]] = None) -> bool:
    """
    Verifica se uma origem é permitida.

    Args:
        origin: Origem a verificar (ex: 'http://localhost:5173')
        allowed_origins: Lista de origens permitidas. Se None, usa get_allowed_origins()

    Returns:
        True se origem é permitida, False caso contrário
    """
    if not origin:
        return False

    if allowed_origins is None:
        allowed_origins = get_allowed_origins()

    # Verificação exata
    if origin in allowed_origins:
        return True

    # Verificação de subdomínios para produção
    # Permite subdomínios de topsupplementslab.com
    if "topsupplementslab.com" in origin:
        # Verifica se é HTTPS e domínio válido
        if origin.startswith("https://") and (
            "re-educa.topsupplementslab.com" in origin or "topsupplementslab.com" in origin
        ):
            return True

    return False


def validate_origin_format(origin: str) -> bool:
    """
    Valida formato de origem.

    Args:
        origin: Origem a validar

    Returns:
        True se formato é válido, False caso contrário
    """
    if not origin:
        return False

    # Deve começar com http:// ou https://
    if not (origin.startswith("http://") or origin.startswith("https://")):
        return False

    # Não deve ter espaços ou caracteres inválidos
    if " " in origin or "\n" in origin or "\r" in origin:
        return False

    return True
