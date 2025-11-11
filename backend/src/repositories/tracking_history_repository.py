# -*- coding: utf-8 -*-
"""
Repositório de Histórico de Rastreamento RE-EDUCA Store.

Gerencia acesso a dados de histórico de rastreamento de pedidos.
"""
import logging
from typing import Any, Dict, List, Optional

from repositories.base_repository import BaseRepository

logger = logging.getLogger(__name__)


class TrackingHistoryRepository(BaseRepository):
    """
    Repositório para operações com histórico de rastreamento.
    
    Tabela: order_tracking_history
    """

    def __init__(self):
        """Inicializa o repositório de histórico de rastreamento."""
        super().__init__("order_tracking_history")

    def find_by_order(self, order_id: str) -> List[Dict[str, Any]]:
        """
        Busca histórico de rastreamento de um pedido.
        
        Args:
            order_id: ID do pedido
            
        Returns:
            Lista de eventos de rastreamento ordenados por data (mais recente primeiro)
        """
        try:
            result = (
                self.db.table(self.table_name)
                .select("*")
                .eq("order_id", order_id)
                .order("event_date", desc=True)
                .order("created_at", desc=True)
                .execute()
            )
            
            return result.data if result.data else []
        except Exception as e:
            self.logger.error(f"Erro ao buscar histórico de rastreamento: {str(e)}", exc_info=True)
            return []

    def find_by_tracking_number(self, tracking_number: str) -> List[Dict[str, Any]]:
        """
        Busca histórico por código de rastreamento.
        
        Args:
            tracking_number: Código de rastreamento
            
        Returns:
            Lista de eventos ordenados por data
        """
        try:
            result = (
                self.db.table(self.table_name)
                .select("*")
                .eq("tracking_number", tracking_number)
                .order("event_date", desc=True)
                .order("created_at", desc=True)
                .execute()
            )
            
            return result.data if result.data else []
        except Exception as e:
            self.logger.error(f"Erro ao buscar histórico por código: {str(e)}", exc_info=True)
            return []

    def create_event(
        self,
        order_id: str,
        tracking_number: str,
        event_type: str,
        event_description: str,
        location: Optional[str] = None,
        event_date: Optional[str] = None,
        carrier: Optional[str] = None,
        source: str = "manual",
        metadata: Optional[Dict[str, Any]] = None,
    ) -> Optional[Dict[str, Any]]:
        """
        Cria um novo evento de rastreamento.
        
        Args:
            order_id: ID do pedido
            tracking_number: Código de rastreamento
            event_type: Tipo de evento (created, in_transit, delivered, etc)
            event_description: Descrição do evento
            location: Local do evento (opcional)
            event_date: Data do evento (opcional, padrão: agora)
            carrier: Transportadora (opcional)
            source: Origem do evento (manual, api, webhook)
            metadata: Dados adicionais (opcional)
            
        Returns:
            Evento criado ou None se erro
        """
        try:
            from datetime import datetime
            
            event_data = {
                "order_id": order_id,
                "tracking_number": tracking_number,
                "event_type": event_type,
                "event_description": event_description,
                "location": location,
                "event_date": event_date or datetime.utcnow().isoformat(),
                "carrier": carrier,
                "source": source,
                "metadata": metadata or {},
            }
            
            created = self.create(event_data)
            return created
        except Exception as e:
            self.logger.error(f"Erro ao criar evento de rastreamento: {str(e)}", exc_info=True)
            return None

    def get_latest_event(self, order_id: str) -> Optional[Dict[str, Any]]:
        """
        Retorna o evento mais recente de um pedido.
        
        Args:
            order_id: ID do pedido
            
        Returns:
            Evento mais recente ou None
        """
        try:
            result = (
                self.db.table(self.table_name)
                .select("*")
                .eq("order_id", order_id)
                .order("event_date", desc=True)
                .order("created_at", desc=True)
                .limit(1)
                .execute()
            )
            
            if result.data and len(result.data) > 0:
                return result.data[0]
            return None
        except Exception as e:
            self.logger.error(f"Erro ao buscar último evento: {str(e)}", exc_info=True)
            return None
