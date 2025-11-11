# -*- coding: utf-8 -*-
"""
Classe Base para Services RE-EDUCA Store.

Define interface e padrões comuns para todos os services.
"""
import logging
from abc import ABC
from typing import Any, Dict, Optional

from exceptions.custom_exceptions import BaseAPIException


class BaseService(ABC):
    """
    Classe base para todos os services.

    Fornece padrões comuns e estrutura para services.
    """

    def __init__(self):
        """Inicializa o service base."""
        self.logger = logging.getLogger(self.__class__.__name__)

    def _handle_error(self, error: Exception, default_message: str = "Erro interno do servidor") -> Dict[str, Any]:
        """
        Trata erros de forma padronizada.

        Args:
            error: Exceção ocorrida
            default_message: Mensagem padrão se não for exceção customizada

        Returns:
            Dict com erro formatado
        """
        if isinstance(error, BaseAPIException):
            return {"success": False, "error": error.message, "details": error.details}
        else:
            self.logger.error(f"Erro não tratado: {str(error)}", exc_info=True)
            return {"success": False, "error": default_message}

    def _format_success_response(self, data: Any = None, message: Optional[str] = None) -> Dict[str, Any]:
        """
        Formata resposta de sucesso padronizada.

        Args:
            data: Dados a serem retornados
            message: Mensagem de sucesso (opcional)

        Returns:
            Dict com resposta formatada
        """
        response = {"success": True}
        if message:
            response["message"] = message
        if data is not None:
            response["data"] = data
        return response

    def _validate_required_fields(self, data: Dict[str, Any], required_fields: list) -> Optional[str]:
        """
        Valida campos obrigatórios.

        Args:
            data: Dados a serem validados
            required_fields: Lista de campos obrigatórios

        Returns:
            Mensagem de erro se houver campo faltando, None caso contrário
        """
        missing = [field for field in required_fields if field not in data or data[field] is None]
        if missing:
            return f"Campos obrigatórios faltando: {', '.join(missing)}"
        return None
