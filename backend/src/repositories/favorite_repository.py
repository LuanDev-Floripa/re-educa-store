# -*- coding: utf-8 -*-
"""
Repositório de Favoritos RE-EDUCA Store.

Gerencia acesso a dados de favoritos.
"""
import logging
from typing import Dict, Any, List, Optional
from repositories.base_repository import BaseRepository

logger = logging.getLogger(__name__)


class FavoriteRepository(BaseRepository):
    """Repositório para operações com favoritos."""
    
    def __init__(self):
        """Inicializa o repositório de favoritos."""
        super().__init__('favorites')
