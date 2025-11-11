"""
Repositório de Exercícios RE-EDUCA Store.

Gerencia acesso a dados de exercícios e sessões de treino.
"""

import logging
from typing import Any, Dict, List, Optional

from repositories.base_repository import BaseRepository

logger = logging.getLogger(__name__)


class ExerciseRepository(BaseRepository):
    """
    Repositório para operações com exercícios.

    Tabela: exercises
    """

    def __init__(self):
        """Inicializa o repositório de exercícios."""
        super().__init__("exercises")

    def find_by_id(self, exercise_id: str) -> Optional[Dict[str, Any]]:
        """
        Busca exercício por ID.

        Args:
            exercise_id: ID do exercício

        Returns:
            Exercício encontrado ou None
        """
        return super().find_by_id(exercise_id)

    def find_by_category(self, category: str, limit: Optional[int] = None) -> List[Dict[str, Any]]:
        """
        Busca exercícios por categoria.

        Args:
            category: Categoria do exercício
            limit: Limite de resultados

        Returns:
            Lista de exercícios
        """
        try:
            return self.find_all(filters={"category": category}, order_by="name", limit=limit)
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            self.logger.error(f"Erro ao buscar exercícios por categoria: {str(e)}", exc_info=True)
            return []

    def search(self, query: str, limit: Optional[int] = None) -> List[Dict[str, Any]]:
        """
        Busca exercícios por nome ou descrição.

        Args:
            query: Termo de busca
            limit: Limite de resultados

        Returns:
            Lista de exercícios encontrados
        """
        try:
            # Usa ilike para busca case-insensitive
            result = (
                self.db.table(self.table_name)
                .select("*")
                .or_(f"name.ilike.%{query}%,description.ilike.%{query}%")
                .limit(limit if limit else 50)
                .execute()
            )
            return result.data if result.data else []
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            self.logger.error(f"Erro ao buscar exercícios: {str(e)}", exc_info=True)
            return []
