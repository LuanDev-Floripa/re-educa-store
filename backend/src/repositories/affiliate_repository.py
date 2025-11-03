# -*- coding: utf-8 -*-
"""
Repositório de Afiliados RE-EDUCA Store.

Gerencia acesso a dados de integrações com plataformas de afiliados.
"""
import logging
from typing import Dict, Any, List, Optional
from repositories.base_repository import BaseRepository

logger = logging.getLogger(__name__)


class AffiliateRepository(BaseRepository):
    """
    Repositório para operações com vendas de afiliados.
    
    Tabela: affiliate_sales
    """
    
    def __init__(self):
        """Inicializa o repositório de afiliados."""
        super().__init__('affiliate_sales')
    
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
            
            if 'id' not in sale_data:
                sale_data['id'] = generate_uuid()
            if 'created_at' not in sale_data:
                sale_data['created_at'] = datetime.now().isoformat()
            
            return self.create(sale_data)
        except Exception as e:
            self.logger.error(f"Erro ao criar venda de afiliado: {str(e)}")
            return None
    
    def find_by_platform(
        self,
        platform: str,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        limit: Optional[int] = None,
        offset: int = 0
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
            filters = {'platform': platform}
            
            query = (
                self.db.table(self.table_name)
                .select('*')
                .eq('platform', platform)
            )
            
            if start_date:
                query = query.gte('sale_date', start_date)
            
            if end_date:
                query = query.lte('sale_date', end_date)
            
            query = query.order('created_at', desc=True)
            
            if limit:
                query = query.range(offset, offset + limit - 1)
            
            result = query.execute()
            return result.data if result.data else []
        except Exception as e:
            self.logger.error(f"Erro ao buscar vendas por plataforma: {str(e)}")
            return []
    
    def find_all_filtered(
        self,
        platform: Optional[str] = None,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        limit: Optional[int] = None,
        offset: int = 0
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
            query = self.db.table(self.table_name).select('*')
            
            if platform:
                query = query.eq('platform', platform)
            
            if start_date:
                query = query.gte('sale_date', start_date)
            
            if end_date:
                query = query.lte('sale_date', end_date)
            
            query = query.order('created_at', desc=True)
            
            if limit:
                query = query.range(offset, offset + limit - 1)
            
            result = query.execute()
            return result.data if result.data else []
        except Exception as e:
            self.logger.error(f"Erro ao buscar vendas com filtros: {str(e)}")
            return []
    
    def count_filtered(
        self,
        platform: Optional[str] = None,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None
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
            query = self.db.table(self.table_name).select('id', count='exact')
            
            if platform:
                query = query.eq('platform', platform)
            
            if start_date:
                query = query.gte('sale_date', start_date)
            
            if end_date:
                query = query.lte('sale_date', end_date)
            
            result = query.execute()
            return result.count if hasattr(result, 'count') and result.count is not None else 0
        except Exception as e:
            self.logger.error(f"Erro ao contar vendas: {str(e)}")
            return 0
