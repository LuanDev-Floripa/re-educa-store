"""
Repositório de IA RE-EDUCA Store.

Gerencia acesso a dados de histórico de chat e contexto de IA.
"""
import logging
from typing import Dict, Any, List, Optional
from repositories.base_repository import BaseRepository

logger = logging.getLogger(__name__)


class AIRepository(BaseRepository):
    """
    Repositório para operações com histórico de chat e contexto de IA.
    
    Tabela: ai_chat_messages (ou similar)
    """
    
    def __init__(self):
        """Inicializa o repositório de IA."""
        super().__init__('ai_chat_messages')
    
    def create_chat_message(self, message_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Cria uma nova mensagem de chat.
        
        Args:
            message_data: Dados da mensagem (user_id, user_message, ai_response, etc.)
        
        Returns:
            Mensagem criada ou None
        """
        try:
            return self.create(message_data)
        except Exception as e:
            self.logger.error(f"Erro ao criar mensagem de chat: {str(e)}")
            return None
    
    def find_by_user(self, user_id: str, limit: int = 50) -> List[Dict[str, Any]]:
        """
        Busca histórico de chat de um usuário.
        
        Args:
            user_id: ID do usuário
            limit: Número máximo de mensagens
        
        Returns:
            Lista de mensagens do usuário
        """
        try:
            return self.find_all(
                filters={'user_id': user_id},
                order_by='created_at',
                desc=True,
                limit=limit
            )
        except Exception as e:
            self.logger.error(f"Erro ao buscar histórico de chat do usuário {user_id}: {str(e)}")
            return []
    
    def find_recent(self, user_id: str, limit: int = 10) -> List[Dict[str, Any]]:
        """
        Busca mensagens recentes de um usuário.
        
        Args:
            user_id: ID do usuário
            limit: Número de mensagens
        
        Returns:
            Lista de mensagens recentes
        """
        return self.find_by_user(user_id, limit=limit)
    
    def find_by_intent(self, user_id: str, intent: str, limit: int = 10) -> List[Dict[str, Any]]:
        """
        Busca mensagens por tipo de intenção.
        
        Args:
            user_id: ID do usuário
            intent: Tipo de intenção
            limit: Número de mensagens
        
        Returns:
            Lista de mensagens com a intenção especificada
        """
        try:
            return self.find_all(
                filters={
                    'user_id': user_id,
                    'intent': intent
                },
                order_by='created_at',
                desc=True,
                limit=limit
            )
        except Exception as e:
            self.logger.error(f"Erro ao buscar mensagens por intenção: {str(e)}")
            return []
