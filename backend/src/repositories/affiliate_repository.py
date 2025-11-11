# -*- coding: utf-8 -*-
"""
Repositório de Afiliados RE-EDUCA Store.

Gerencia acesso a dados de integrações com plataformas de afiliados.
"""
import logging
from typing import Any, Dict, List, Optional

from repositories.base_repository import BaseRepository

logger = logging.getLogger(__name__)


class AffiliateRepository(BaseRepository):
    """
    Repositório para operações com vendas de afiliados.

    Tabela: affiliate_sales
    """

    def __init__(self):
        """Inicializa o repositório de afiliados."""
        super().__init__("affiliate_sales")

    def create_sale(self, sale_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Registra uma venda de afiliado.

        Args:
            sale_data: Dados da venda

        Returns:
            Venda registrada ou None
        """
        try:
            from datetime import datetime

            from utils.helpers import generate_uuid

            if "id" not in sale_data:
                sale_data["id"] = generate_uuid()
            if "created_at" not in sale_data:
                sale_data["created_at"] = datetime.now().isoformat()

            return self.create(sale_data)
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            self.logger.error(f"Erro ao criar venda de afiliado: {str(e)}", exc_info=True)
            return None

    def find_by_platform(
        self,
        platform: str,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        limit: Optional[int] = None,
        offset: int = 0,
    ) -> List[Dict[str, Any]]:
        """
        Busca vendas por plataforma.

        Args:
            platform: Nome da plataforma
            start_date: Data inicial (opcional)
            end_date: Data final (opcional)
            limit: Limite de resultados
            offset: Offset para paginação

        Returns:
            Lista de vendas
        """
        try:
            query = self.db.table(self.table_name).select("*").eq("platform", platform)

            if start_date:
                query = query.gte("sale_date", start_date)

            if end_date:
                query = query.lte("sale_date", end_date)

            query = query.order("created_at", desc=True)

            if limit:
                query = query.range(offset, offset + limit - 1)

            result = query.execute()
            return result.data if result.data else []
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            self.logger.error(f"Erro ao buscar vendas por plataforma: {str(e)}", exc_info=True)
            return []

    def find_all_filtered(
        self,
        platform: Optional[str] = None,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        limit: Optional[int] = None,
        offset: int = 0,
    ) -> List[Dict[str, Any]]:
        """
        Busca vendas com filtros.

        Args:
            platform: Plataforma (opcional)
            start_date: Data inicial (opcional)
            end_date: Data final (opcional)
            limit: Limite de resultados
            offset: Offset para paginação

        Returns:
            Lista de vendas
        """
        try:
            query = self.db.table(self.table_name).select("*")

            if platform:
                query = query.eq("platform", platform)

            if start_date:
                query = query.gte("sale_date", start_date)

            if end_date:
                query = query.lte("sale_date", end_date)

            query = query.order("created_at", desc=True)

            if limit:
                query = query.range(offset, offset + limit - 1)

            result = query.execute()
            return result.data if result.data else []
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            self.logger.error(f"Erro ao buscar vendas com filtros: {str(e)}", exc_info=True)
            return []

    def count_filtered(
        self, platform: Optional[str] = None, start_date: Optional[str] = None, end_date: Optional[str] = None
    ) -> int:
        """
        Conta vendas com filtros.

        Args:
            platform: Plataforma (opcional)
            start_date: Data inicial (opcional)
            end_date: Data final (opcional)

        Returns:
            Número de vendas
        """
        try:
            query = self.db.table(self.table_name).select("id", count="exact")

            if platform:
                query = query.eq("platform", platform)

            if start_date:
                query = query.gte("sale_date", start_date)

            if end_date:
                query = query.lte("sale_date", end_date)

            result = query.execute()
            return result.count if hasattr(result, "count") and result.count is not None else 0
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            self.logger.error(f"Erro ao contar vendas: {str(e)}", exc_info=True)
            return 0

    def upsert_product(self, product_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Insere ou atualiza produto de afiliado na tabela products.
        
        Se produto já existe (por platform_product_id), atualiza.
        Caso contrário, cria novo.
        
        Args:
            product_data: Dados do produto (deve incluir platform_product_id e product_source)
        
        Returns:
            Produto inserido/atualizado ou None
        """
        try:
            from datetime import datetime
            from utils.helpers import generate_uuid
            
            platform_product_id = product_data.get("platform_product_id")
            product_source = product_data.get("product_source") or product_data.get("platform")
            
            if not platform_product_id:
                logger.warning("platform_product_id é obrigatório para upsert_product")
                return None
            
            # Buscar produto existente por platform_product_id
            existing = (
                self.db.table("products")
                .select("*")
                .eq("platform_product_id", platform_product_id)
                .eq("product_source", product_source)
                .execute()
            )
            
            product_data["product_source"] = product_source
            product_data["updated_at"] = datetime.now().isoformat()
            
            if existing.data and len(existing.data) > 0:
                # Atualizar produto existente
                product_id = existing.data[0]["id"]
                # Remover campos que não devem ser atualizados
                update_data = {k: v for k, v in product_data.items() if k not in ["id", "created_at"]}
                result = self.db.table("products").update(update_data).eq("id", product_id).execute()
                return result.data[0] if result.data else None
            else:
                # Criar novo produto
                if "id" not in product_data:
                    product_data["id"] = generate_uuid()
                if "created_at" not in product_data:
                    product_data["created_at"] = datetime.now().isoformat()
                
                result = self.db.table("products").insert(product_data).execute()
                return result.data[0] if result.data else None
                
        except Exception as e:
            self.logger.error(f"Erro ao fazer upsert de produto: {str(e)}", exc_info=True)
            return None

    def find_all_products(self, platform: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        Busca todos os produtos de afiliados.
        
        Args:
            platform: Plataforma específica (opcional)
        
        Returns:
            Lista de produtos
        """
        try:
            query = self.db.table("products").select("*").neq("product_source", "own")
            
            if platform:
                # Mapear nome da plataforma para product_source
                platform_map = {
                    "hotmart": "hotmart",
                    "kiwify": "kiwifi",  # Note: typo no schema
                    "logs": "other",
                    "braip": "other"
                }
                product_source = platform_map.get(platform, platform)
                query = query.eq("product_source", product_source)
            
            result = query.execute()
            return result.data if result.data else []
        except Exception as e:
            self.logger.error(f"Erro ao buscar produtos de afiliados: {str(e)}", exc_info=True)
            return []

    def count_products_by_platform(self, platform: str) -> int:
        """
        Conta produtos por plataforma.
        
        Args:
            platform: Nome da plataforma
        
        Returns:
            Número de produtos
        """
        try:
            platform_map = {
                "hotmart": "hotmart",
                "kiwify": "kiwifi",
                "logs": "other",
                "braip": "other"
            }
            product_source = platform_map.get(platform, platform)
            
            result = (
                self.db.table("products")
                .select("id", count="exact")
                .eq("product_source", product_source)
                .execute()
            )
            return result.count if hasattr(result, "count") and result.count is not None else 0
        except Exception as e:
            self.logger.error(f"Erro ao contar produtos por plataforma: {str(e)}", exc_info=True)
            return 0

    def find_sales(self, limit: Optional[int] = None) -> List[Dict[str, Any]]:
        """
        Busca todas as vendas de afiliados.
        
        Args:
            limit: Limite de resultados (opcional)
        
        Returns:
            Lista de vendas
        """
        try:
            query = self.db.table(self.table_name).select("*").order("created_at", desc=True)
            
            if limit:
                query = query.limit(limit)
            
            result = query.execute()
            return result.data if result.data else []
        except Exception as e:
            self.logger.error(f"Erro ao buscar vendas: {str(e)}", exc_info=True)
            return []
