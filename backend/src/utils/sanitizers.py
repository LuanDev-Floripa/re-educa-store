# -*- coding: utf-8 -*-
"""
Sanitizadores para RE-EDUCA Store.

Prevenção de SQL Injection, XSS e outras vulnerabilidades.
"""
import html
import re
from typing import Any, Dict, List


def sanitize_string(value: str, max_length: int = 1000) -> str:
    """
    Sanitiza string removendo caracteres perigosos.

    Args:
        value: String a ser sanitizada
        max_length: Tamanho máximo permitido

    Returns:
        String sanitizada
    """
    if not isinstance(value, str):
        return str(value)

    # Remove caracteres nulos
    value = value.replace("\x00", "")

    # Escapa HTML
    value = html.escape(value)

    # Limita tamanho
    if len(value) > max_length:
        value = value[:max_length]

    return value.strip()


def sanitize_integer(value: Any, min_value: int = None, max_value: int = None) -> int:
    """
    Sanitiza e valida inteiro.

    Args:
        value: Valor a ser sanitizado
        min_value: Valor mínimo permitido
        max_value: Valor máximo permitido

    Returns:
        Inteiro validado

    Raises:
        ValueError: Se valor não for válido
    """
    try:
        int_value = int(value)

        if min_value is not None and int_value < min_value:
            raise ValueError(f"Valor deve ser >= {min_value}")

        if max_value is not None and int_value > max_value:
            raise ValueError(f"Valor deve ser <= {max_value}")

        return int_value
    except (ValueError, TypeError):
        raise ValueError("Valor deve ser um número inteiro válido")


def sanitize_float(value: Any, min_value: float = None, max_value: float = None) -> float:
    """
    Sanitiza e valida float.

    Args:
        value: Valor a ser sanitizado
        min_value: Valor mínimo permitido
        max_value: Valor máximo permitido

    Returns:
        Float validado

    Raises:
        ValueError: Se valor não for válido
    """
    try:
        float_value = float(value)

        if min_value is not None and float_value < min_value:
            raise ValueError(f"Valor deve ser >= {min_value}")

        if max_value is not None and float_value > max_value:
            raise ValueError(f"Valor deve ser <= {max_value}")

        return float_value
    except (ValueError, TypeError):
        raise ValueError("Valor deve ser um número válido")


def sanitize_email(email: str) -> str:
    """
    Sanitiza email removendo caracteres inválidos.

    Args:
        email: Email a ser sanitizado

    Returns:
        Email sanitizado (lowercase, sem espaços)
    """
    if not isinstance(email, str):
        raise ValueError("Email deve ser uma string")

    email = email.strip().lower()

    # Remove caracteres perigosos (mantém apenas letras, números, @, ., -, _)
    email = re.sub(r"[^a-z0-9@._-]", "", email)

    return email


def sanitize_sql_like_pattern(pattern: str) -> str:
    """
    Sanitiza padrão SQL LIKE removendo caracteres perigosos.

    Args:
        pattern: Padrão a ser sanitizado

    Returns:
        Padrão sanitizado
    """
    if not isinstance(pattern, str):
        return ""

    # Remove caracteres que poderiam causar problemas em LIKE
    # Escapa % e _ que são caracteres especiais do SQL LIKE
    pattern = pattern.replace("%", r"\%").replace("_", r"\_")

    return sanitize_string(pattern)


def sanitize_dict(data: Dict[str, Any], sanitize_strings: bool = True) -> Dict[str, Any]:
    """
    Sanitiza dicionário recursivamente.

    Args:
        data: Dicionário a ser sanitizado
        sanitize_strings: Se deve sanitizar strings

    Returns:
        Dicionário sanitizado
    """
    sanitized = {}

    for key, value in data.items():
        # Sanitiza chave
        sanitized_key = sanitize_string(key, max_length=100) if isinstance(key, str) else key

        # Sanitiza valor
        if isinstance(value, str) and sanitize_strings:
            sanitized[sanitized_key] = sanitize_string(value)
        elif isinstance(value, dict):
            sanitized[sanitized_key] = sanitize_dict(value, sanitize_strings)
        elif isinstance(value, list):
            sanitized[sanitized_key] = sanitize_list(value, sanitize_strings)
        else:
            sanitized[sanitized_key] = value

    return sanitized


def sanitize_list(data: List[Any], sanitize_strings: bool = True) -> List[Any]:
    """
    Sanitiza lista recursivamente.

    Args:
        data: Lista a ser sanitizada
        sanitize_strings: Se deve sanitizar strings

    Returns:
        Lista sanitizada
    """
    sanitized = []

    for item in data:
        if isinstance(item, str) and sanitize_strings:
            sanitized.append(sanitize_string(item))
        elif isinstance(item, dict):
            sanitized.append(sanitize_dict(item, sanitize_strings))
        elif isinstance(item, list):
            sanitized.append(sanitize_list(item, sanitize_strings))
        else:
            sanitized.append(item)

    return sanitized


def sanitize_pagination_params(page: Any, per_page: Any) -> tuple[int, int]:
    """
    Sanitiza parâmetros de paginação.

    Args:
        page: Número da página
        per_page: Itens por página

    Returns:
        Tupla (page, per_page) sanitizada
    """
    page = sanitize_integer(page, min_value=1, max_value=1000) if page else 1
    per_page = sanitize_integer(per_page, min_value=1, max_value=100) if per_page else 20

    return page, per_page
