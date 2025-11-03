"""
Repositório de Cupons RE-EDUCA Store.

Gerencia acesso a dados de cupons.
"""
import logging
from typing import Dict, Any, List, Optional
from repositories.base_repository import BaseRepository

logger = logging.getLogger(__name__)


class CouponRepository(BaseRepository):
    """
    Repositório para operações com cupons.
    
    Tabela: coupons
    """
    
    def __init__(self):
        """Inicializa o repositório de cupons."""
        super().__init__('coupons')
    
    def find_by_code(self, code: str, active_only: bool = False) -> Optional[Dict[str, Any]]:
        """
        Busca cupom por código.
        
        Args:
            code: Código do cupom
            active_only: Se True, apenas cupons ativos
        
        Returns:
            Cupom encontrado ou None
        """
        try:
            filters = {'code': code.upper()}
            if active_only:
                filters['is_active'] = True
            
            results = self.find_all(filters=filters, limit=1)
            return results[0] if results else None
        except Exception as e:
            self.logger.error(f"Erro ao buscar cupom por código: {str(e)}")
            return None
    
    def code_exists(self, code: str) -> bool:
        """
        Verifica se um código de cupom já existe.
        
        Args:
            code: Código do cupom
        
        Returns:
            True se existe, False caso contrário
        """
        try:
            coupon = self.find_by_code(code)
            return coupon is not None
        except Exception as e:
            self.logger.error(f"Erro ao verificar existência do código: {str(e)}")
            return False
    
    def find_active(self, limit: Optional[int] = None, offset: int = 0) -> List[Dict[str, Any]]:
        """
        Busca cupons ativos.
        
        Args:
            limit: Limite de resultados
            offset: Offset para paginação
        
        Returns:
            Lista de cupons ativos
        """
        try:
            return self.find_all(
                filters={'is_active': True},
                order_by='created_at',
                desc=True,
                limit=limit,
                offset=offset
            )
        except Exception as e:
            self.logger.error(f"Erro ao buscar cupons ativos: {str(e)}")
            return []
    
    def find_valid(
        self,
        order_value: float,
        valid_from: Optional[str] = None,
        valid_until: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Busca cupons válidos para um valor de pedido.
        
        Args:
            order_value: Valor do pedido
            valid_from: Data de início (opcional)
            valid_until: Data de término (opcional)
        
        Returns:
            Lista de cupons válidos
        """
        try:
            from datetime import datetime
            
            query = (
                self.db.table(self.table_name)
                .select('*')
                .eq('is_active', True)
                .lte('min_order_value', order_value)
            )
            
            if valid_from:
                query = query.gte('valid_from', valid_from)
            
            if valid_until:
                query = query.lte('valid_until', valid_until)
            else:
                # Usa data atual se não especificada
                now = datetime.now().isoformat()
                query = query.gte('valid_from', now).lte('valid_until', now)
            
            result = query.execute()
            return result.data if result.data else []
        except Exception as e:
            self.logger.error(f"Erro ao buscar cupons válidos: {str(e)}")
            return []
