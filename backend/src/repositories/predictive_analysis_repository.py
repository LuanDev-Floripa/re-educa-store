# -*- coding: utf-8 -*-
"""
Repositório de Análise Preditiva RE-EDUCA Store.

Gerencia acesso a dados para análise preditiva e machine learning.
"""
import logging
from typing import Dict, Any, List, Optional
from repositories.base_repository import BaseRepository
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)


class PredictiveAnalysisRepository(BaseRepository):
    """
    Repositório para operações de análise preditiva.
    
    Tabelas utilizadas:
    - imc_history
    - workout_sessions
    - food_diary_entries
    - hydration_history
    - user_activities
    - orders
    - users
    """
    
    def __init__(self):
        """Inicializa o repositório de análise preditiva."""
        super().__init__('imc_history')  # Tabela padrão
    
    def get_user_imc_history(self, user_id: str) -> List[Dict[str, Any]]:
        """Busca histórico de IMC do usuário."""
        try:
            result = (
                self.db.table('imc_history')
                .select('*')
                .eq('user_id', user_id)
                .order('calculated_at')
                .execute()
            )
            return result.data if result.data else []
        except Exception as e:
            self.logger.warning(f"Erro ao buscar histórico de IMC: {str(e)}")
            return []
    
    def get_user_workout_sessions(
        self,
        user_id: str,
        days_back: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        """Busca sessões de treino do usuário."""
        try:
            query = (
                self.db.table('workout_sessions')
                .select('*')
                .eq('user_id', user_id)
            )
            
            if days_back:
                start_date = (datetime.now() - timedelta(days=days_back)).isoformat()
                query = query.gte('completed_at', start_date)
            
            result = query.order('completed_at').execute()
            return result.data if result.data else []
        except Exception as e:
            self.logger.warning(f"Erro ao buscar sessões de treino: {str(e)}")
            return []
    
    def get_user_food_diary(
        self,
        user_id: str,
        days_back: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        """Busca diário alimentar do usuário."""
        try:
            query = (
                self.db.table('food_diary_entries')
                .select('*')
                .eq('user_id', user_id)
            )
            
            if days_back:
                start_date = (datetime.now() - timedelta(days=days_back)).isoformat()
                query = query.gte('consumed_at', start_date)
            
            result = query.order('consumed_at').execute()
            return result.data if result.data else []
        except Exception as e:
            self.logger.warning(f"Erro ao buscar diário alimentar: {str(e)}")
            return []
    
    def get_user_hydration_history(
        self,
        user_id: str,
        days_back: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        """Busca histórico de hidratação do usuário."""
        try:
            query = (
                self.db.table('hydration_history')
                .select('*')
                .eq('user_id', user_id)
            )
            
            if days_back:
                start_date = (datetime.now() - timedelta(days=days_back)).isoformat()
                query = query.gte('calculated_at', start_date)
            
            result = query.order('calculated_at').execute()
            return result.data if result.data else []
        except Exception as e:
            self.logger.warning(f"Erro ao buscar histórico de hidratação: {str(e)}")
            return []
    
    def get_user_activities(
        self,
        user_id: str,
        days_back: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        """Busca atividades do usuário."""
        try:
            query = (
                self.db.table('user_activities')
                .select('*')
                .eq('user_id', user_id)
            )
            
            if days_back:
                start_date = (datetime.now() - timedelta(days=days_back)).isoformat()
                query = query.gte('timestamp', start_date)
            
            result = query.order('created_at').execute()
            return result.data if result.data else []
        except Exception as e:
            self.logger.warning(f"Erro ao buscar atividades: {str(e)}")
            return []
    
    def get_user_orders(self, user_id: str) -> List[Dict[str, Any]]:
        """Busca pedidos do usuário."""
        try:
            result = (
                self.db.table('orders')
                .select('*')
                .eq('user_id', user_id)
                .order('created_at')
                .execute()
            )
            return result.data if result.data else []
        except Exception as e:
            self.logger.warning(f"Erro ao buscar pedidos: {str(e)}")
            return []
    
    def get_user_last_login(self, user_id: str) -> Optional[datetime]:
        """Busca último login do usuário."""
        try:
            result = (
                self.db.table('users')
                .select('last_login')
                .eq('id', user_id)
                .single()
                .execute()
            )
            
            if result.data and result.data.get('last_login'):
                last_login_str = result.data['last_login']
                if isinstance(last_login_str, str):
                    return datetime.fromisoformat(last_login_str.replace('Z', '+00:00'))
            return None
        except Exception as e:
            self.logger.warning(f"Erro ao buscar último login: {str(e)}")
            return None
