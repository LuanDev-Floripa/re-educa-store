# -*- coding: utf-8 -*-
"""
Repositório Base RE-EDUCA Store.

Classe base abstrata para todos os repositórios.
Implementa operações CRUD básicas e padrões comuns.
"""
import logging
from abc import ABC
from typing import Any, Dict, List, Optional

from config.database import supabase_client

logger = logging.getLogger(__name__)

# Cache simples em memória (pode ser substituído por Redis depois)
_cache = {}
_cache_ttl = {}

# Tenta usar cache_service se disponível
try:
    from services.cache_service import cache_service

    USE_REDIS_CACHE = True
except ImportError:
    USE_REDIS_CACHE = False
    cache_service = None


class BaseRepository(ABC):
    """
    Classe base para repositórios.

    Fornece operações CRUD básicas e padrões comuns de acesso a dados.
    Todos os repositórios devem herdar desta classe.
    """

    def __init__(self, table_name: str):
        """
        Inicializa o repositório base.

        Args:
            table_name: Nome da tabela no Supabase
        """
        self.table_name = table_name
        self.db = supabase_client
        self.logger = logging.getLogger(f"{__name__}.{self.__class__.__name__}")

    def find_by_id(self, id: str, use_cache: bool = True, cache_ttl: int = 300) -> Optional[Dict[str, Any]]:
        """
        Busca um registro por ID com cache opcional.

        Usa Redis se disponível, senão cache em memória.

        Args:
            id: ID do registro
            use_cache: Se deve usar cache (padrão: True)
            cache_ttl: TTL do cache em segundos (padrão: 300)

        Returns:
            Dict com os dados do registro ou None se não encontrado
        """
        cache_key = f"{self.table_name}:id:{id}"

        # Verifica cache (Redis ou memória)
        if use_cache:
            # Tenta Redis primeiro
            if USE_REDIS_CACHE and cache_service:
                try:
                    cached = cache_service.get(cache_key)
                    if cached:
                        self.logger.debug(f"Cache hit (Redis): {cache_key}")
                        return cached
                except Exception:
                    # SEGURANÇA: except Exception aceitável aqui porque:
                    # 1. É fallback silencioso quando Redis não está disponível
                    # 2. Qualquer erro de cache não deve quebrar a aplicação
                    # 3. O fallback para cache em memória é garantido na sequência
                    pass  # Fallback para cache em memória

            # Cache em memória (fallback)
            from time import time

            if cache_key in _cache and cache_key in _cache_ttl:
                if time() < _cache_ttl[cache_key]:
                    self.logger.debug(f"Cache hit (memória): {cache_key}")
                    return _cache[cache_key]
                else:
                    # Cache expirado
                    _cache.pop(cache_key, None)
                    _cache_ttl.pop(cache_key, None)

        try:
            result = self.db.table(self.table_name).select("*").eq("id", id).execute()
            if result.data and len(result.data) > 0:
                data = result.data[0]
                # Armazena no cache
                if use_cache:
                    # Tenta Redis primeiro
                    if USE_REDIS_CACHE and cache_service:
                        try:
                            cache_service.set(cache_key, data, ttl=cache_ttl)
                        except Exception:
                            # SEGURANÇA: except Exception aceitável aqui porque:
                            # 1. É fallback silencioso quando Redis não está disponível
                            # 2. Qualquer erro de cache não deve quebrar a aplicação
                            # 3. O fallback para cache em memória é garantido na sequência
                            pass  # Fallback para memória

                    # Cache em memória (fallback ou primário)
                    from time import time

                    _cache[cache_key] = data
                    _cache_ttl[cache_key] = time() + cache_ttl

                return data
            return None
        except ValueError as e:
            self.logger.warning(f"Erro de validação ao buscar {self.table_name} por ID {id}: {str(e)}")
            return None
        except KeyError as e:
            self.logger.warning(f"Campo obrigatório ausente ao buscar {self.table_name} por ID {id}: {str(e)}")
            return None
        except Exception as e:
            self.logger.error(f"Erro ao buscar {self.table_name} por ID {id}: {str(e)}", exc_info=True)
            return None

    def _invalidate_cache(self, item_id: Optional[str] = None):
        """
        Invalida cache de um item específico ou toda a tabela.

        Args:
            item_id: ID do item a invalidar (se None, invalida toda a tabela)
        """
        try:
            # Invalidar cache específico do item
            if item_id:
                cache_key = f"{self.table_name}:id:{item_id}"

                # Tenta invalidar no Redis primeiro
                if USE_REDIS_CACHE and cache_service:
                    try:
                        cache_service.delete(cache_key)
                        # Também invalida listas relacionadas
                        cache_service.delete_pattern(f"{self.table_name}:*")
                    except Exception:
                        # SEGURANÇA: except Exception aceitável aqui porque:
                        # 1. É fallback silencioso quando Redis não está disponível
                        # 2. Qualquer erro de cache não deve quebrar a aplicação
                        # 3. O fallback para cache em memória é garantido na sequência
                        pass  # Fallback para cache em memória

                # Invalidar cache em memória
                _cache.pop(cache_key, None)
                _cache_ttl.pop(cache_key, None)

            # Sempre invalidar listas da tabela (já que pode ter mudado)
            pattern_prefix = f"{self.table_name}:"
            keys_to_remove = [k for k in _cache.keys() if k.startswith(pattern_prefix)]
            for key in keys_to_remove:
                _cache.pop(key, None)
                _cache_ttl.pop(key, None)

            # Invalidar no Redis também
            if USE_REDIS_CACHE and cache_service:
                try:
                    cache_service.delete_pattern(f"{self.table_name}:*")
                except Exception as e:
                    # Ignora erros de Redis (fallback silencioso aceitável para cache)
                    self.logger.debug(f"Erro ao invalidar cache Redis (não crítico): {str(e)}")
                    pass

        except (ValueError, KeyError, AttributeError) as e:
            self.logger.debug(f"Erro de validação ao invalidar cache (não crítico): {str(e)}")
            # Não lança exceção, apenas loga o erro
        except Exception as e:
            self.logger.warning(f"Erro ao invalidar cache para {self.table_name}: {str(e)}", exc_info=True)
            # Não lança exceção, apenas loga o erro

    def clear_cache(self, pattern: Optional[str] = None):
        """
        Limpa cache.

        Args:
            pattern: Padrão para limpar (ex: 'users:*'). Se None, limpa tudo.
        """
        # Cache management - using module-level cache (no global needed for reading)
        if pattern:
            keys_to_remove = [k for k in _cache.keys() if k.startswith(pattern.replace("*", ""))]
            for key in keys_to_remove:
                _cache.pop(key, None)
                _cache_ttl.pop(key, None)

            # Limpar no Redis também
            if USE_REDIS_CACHE and cache_service:
                try:
                    cache_service.delete_pattern(pattern)
                except Exception:
                    # SEGURANÇA: except Exception aceitável aqui porque:
                    # 1. É fallback silencioso quando Redis não está disponível
                    # 2. Qualquer erro de cache não deve quebrar a aplicação
                    # 3. Cache em memória já foi limpo acima
                    pass
        else:
            _cache.clear()
            _cache_ttl.clear()

            # Limpar Redis também
            if USE_REDIS_CACHE and cache_service:
                try:
                    cache_service.flush_all()
                except Exception:
                    # SEGURANÇA: except Exception aceitável aqui porque:
                    # 1. É fallback silencioso quando Redis não está disponível
                    # 2. Qualquer erro de cache não deve quebrar a aplicação
                    # 3. Cache em memória já foi limpo acima
                    pass

    def find_all(
        self,
        filters: Optional[Dict[str, Any]] = None,
        order_by: Optional[str] = None,
        desc: bool = True,
        limit: Optional[int] = None,
        offset: Optional[int] = None,
        use_range: bool = True,  # Usa .range() ao invés de .offset() + .limit() para melhor performance
    ) -> List[Dict[str, Any]]:
        """
        Busca todos os registros com filtros opcionais.

        OTIMIZADO: Usa .range() para paginação eficiente do Supabase.

        Args:
            filters: Dict com filtros {campo: valor}
            order_by: Campo para ordenação
            desc: Se ordenação é descendente
            limit: Limite de resultados
            offset: Offset para paginação
            use_range: Se deve usar .range() (mais eficiente) ao invés de .offset()

        Returns:
            Lista de registros
        """
        try:
            query = self.db.table(self.table_name).select("*")

            # Aplica filtros
            if filters:
                for field, value in filters.items():
                    if isinstance(value, list):
                        query = query.in_(field, value)
                    else:
                        query = query.eq(field, value)

            # Ordenação
            if order_by:
                query = query.order(order_by, desc=desc)

            # Paginação usando .range() (mais eficiente que .offset() + .limit())
            if limit and use_range and offset is not None:
                # .range() é mais eficiente para paginação
                end = offset + limit - 1
                query = query.range(offset, end)
            else:
                # Fallback para método tradicional
                if limit:
                    query = query.limit(limit)
                if offset:
                    query = query.offset(offset)

            result = query.execute()
            return result.data if result.data else []

        except Exception as e:
            self.logger.error(f"Erro ao buscar todos {self.table_name}: {str(e)}")
            return []

    def create(self, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Cria um novo registro.
        
        Invalida cache automaticamente após criar registro para manter consistência.

        Args:
            data: Dados do registro a ser criado

        Returns:
            Dict com o registro criado ou None em caso de erro
        """
        try:
            result = self.db.table(self.table_name).insert(data).execute()
            if result.data and len(result.data) > 0:
                created_item = result.data[0]
                self._invalidate_cache(created_item.get("id"))
                return created_item
            return None
        except Exception as e:
            self.logger.error(f"Erro ao criar {self.table_name}: {str(e)}")
            return None

    def update(self, id: str, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Atualiza um registro existente.

        Invalida cache automaticamente após atualizar registro para manter consistência.

        Args:
            id: ID do registro
            data: Dados a serem atualizados

        Returns:
            Dict com o registro atualizado ou None em caso de erro
        """
        try:
            result = self.db.table(self.table_name).update(data).eq("id", id).execute()
            if result.data and len(result.data) > 0:
                self._invalidate_cache(id)
                return result.data[0]
            return None
        except Exception as e:
            self.logger.error(f"Erro ao atualizar {self.table_name} ID {id}: {str(e)}")
            return None

    def delete(self, id: str) -> bool:
        """
        Deleta um registro.

        Invalida cache automaticamente após deletar registro.

        Args:
            id: ID do registro

        Returns:
            True se deletado com sucesso, False caso contrário
        """
        try:
            result = self.db.table(self.table_name).delete().eq("id", id).execute()
            if result.data is not None:
                self._invalidate_cache(id)
                return True
            return False
        except Exception as e:
            self.logger.error(f"Erro ao deletar {self.table_name} ID {id}: {str(e)}")
            return False

    def count(self, filters: Optional[Dict[str, Any]] = None) -> int:
        """
        Conta registros com filtros opcionais.

        Args:
            filters: Dict com filtros {campo: valor}

        Returns:
            Número de registros
        """
        try:
            query = self.db.table(self.table_name).select("id", count="exact")

            if filters:
                for field, value in filters.items():
                    if isinstance(value, list):
                        query = query.in_(field, value)
                    else:
                        query = query.eq(field, value)

            result = query.execute()
            return result.count if hasattr(result, "count") else 0

        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            self.logger.error(f"Erro ao contar {self.table_name}: {str(e)}", exc_info=True)
            return 0

    def exists(self, id: str) -> bool:
        """
        Verifica se um registro existe.

        Args:
            id: ID do registro

        Returns:
            True se existe, False caso contrário
        """
        return self.find_by_id(id) is not None
ot None
s not None
