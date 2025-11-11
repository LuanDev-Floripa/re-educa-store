"""
Service para mensagens diretas.
"""

import logging
from typing import Any, Dict

from repositories.messages_repository import MessagesRepository

logger = logging.getLogger(__name__)


class MessagesService:
    """Service para mensagens diretas"""

    def __init__(self):
        self.repo = MessagesRepository()

    def get_conversations(self, user_id: str) -> Dict[str, Any]:
        """Lista conversas do usuário"""
        try:
            conversations = self.repo.get_conversations(user_id)
            return {"success": True, "conversations": conversations}
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            logger.error(f"Erro ao buscar conversas: {str(e)}", exc_info=True)
            return {"success": False, "error": str(e)}

    def get_messages(self, user_id: str, other_user_id: str, limit: int = 50) -> Dict[str, Any]:
        """Busca mensagens entre dois usuários"""
        try:
            messages = self.repo.get_messages(user_id, other_user_id, limit)
            return {"success": True, "messages": messages}
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            logger.error(f"Erro ao buscar mensagens: {str(e)}", exc_info=True)
            return {"success": False, "error": str(e)}

    def send_message(
        self, sender_id: str, recipient_id: str, content: str, 
        attachment_url: str = None, attachment_type: str = None, 
        attachment_filename: str = None, attachment_size: int = None
    ) -> Dict[str, Any]:
        """
        Envia mensagem com suporte a anexos.
        
        Args:
            sender_id: ID do remetente
            recipient_id: ID do destinatário
            content: Conteúdo da mensagem
            attachment_url: URL do anexo (opcional)
            attachment_type: Tipo do anexo (opcional)
            attachment_filename: Nome do arquivo (opcional)
            attachment_size: Tamanho do arquivo (opcional)
        """
        try:
            if sender_id == recipient_id:
                return {"success": False, "error": "Não é possível enviar mensagem para si mesmo"}

            # Permitir mensagem vazia se tiver anexo
            if not content or not content.strip():
                if not attachment_url:
                    return {"success": False, "error": "Conteúdo da mensagem ou anexo é obrigatório"}

            message = self.repo.create_message(
                sender_id, recipient_id, content.strip() if content else "",
                attachment_url, attachment_type, attachment_filename, attachment_size
            )

            if message:
                return {"success": True, "message": message}
            else:
                return {"success": False, "error": "Erro ao enviar mensagem"}

        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            logger.error(f"Erro ao enviar mensagem: {str(e)}", exc_info=True)
            return {"success": False, "error": str(e)}

    def mark_message_read(self, message_id: str, user_id: str) -> Dict[str, Any]:
        """Marca mensagem como lida"""
        try:
            success = self.repo.mark_as_read(message_id, user_id)
            return {
                "success": success,
                "message": "Mensagem marcada como lida" if success else "Erro ao marcar como lida",
            }
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            logger.error(f"Erro ao marcar como lida: {str(e)}", exc_info=True)
            return {"success": False, "error": str(e)}

    def mark_conversation_read(self, user_id: str, other_user_id: str) -> Dict[str, Any]:
        """Marca todas as mensagens de uma conversa como lidas"""
        try:
            count = self.repo.mark_conversation_as_read(user_id, other_user_id)
            return {"success": True, "count": count, "message": f"{count} mensagens marcadas como lidas"}
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            logger.error(f"Erro ao marcar conversa como lida: {str(e)}", exc_info=True)
            return {"success": False, "error": str(e)}

    def get_unread_count(self, user_id: str) -> Dict[str, Any]:
        """Retorna número de mensagens não lidas"""
        try:
            count = self.repo.get_unread_count(user_id)
            return {"success": True, "unread_count": count}
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            logger.error(f"Erro ao contar mensagens não lidas: {str(e)}", exc_info=True)
            return {"success": False, "error": str(e), "unread_count": 0}
