"""
Repository para mensagens diretas.
"""

import logging
from typing import Any, Dict, List, Optional

from repositories.base_repository import BaseRepository

logger = logging.getLogger(__name__)


class MessagesRepository(BaseRepository):
    """Repository para mensagens diretas"""

    def __init__(self):
        super().__init__("direct_messages")

    def get_conversations(self, user_id: str) -> List[Dict[str, Any]]:
        """
        Lista conversas do usuário.
        Agrupa mensagens por outro usuário e retorna última mensagem.
        """
        try:
            # Buscar todas as mensagens onde o usuário é sender ou recipient
            sent = (
                self.db.table("direct_messages")
                .select("*, recipient:users!direct_messages_recipient_id_fkey(id, name, avatar_url)")
                .eq("sender_id", user_id)
                .execute()
            )

            received = (
                self.db.table("direct_messages")
                .select("*, sender:users!direct_messages_sender_id_fkey(id, name, avatar_url)")
                .eq("recipient_id", user_id)
                .execute()
            )

            # Agrupar por usuário e pegar última mensagem
            conversations_map = {}

            # Processar mensagens enviadas
            for msg in sent.data or []:
                other_id = msg["recipient_id"]
                recipient = msg.get("recipient", {})

                if (
                    other_id not in conversations_map
                    or msg["created_at"] > conversations_map[other_id]["last_message_at"]
                ):
                    conversations_map[other_id] = {
                        "user_id": other_id,
                        "user_name": recipient.get("name", "Usuário") if isinstance(recipient, dict) else "Usuário",
                        "avatar_url": recipient.get("avatar_url") if isinstance(recipient, dict) else None,
                        "last_message": msg["content"],
                        "last_message_at": msg["created_at"],
                        "unread_count": 0,
                    }

            # Processar mensagens recebidas
            for msg in received.data or []:
                other_id = msg["sender_id"]
                sender = msg.get("sender", {})
                unread = 1 if not msg.get("read_at") else 0

                if (
                    other_id not in conversations_map
                    or msg["created_at"] > conversations_map[other_id]["last_message_at"]
                ):
                    conversations_map[other_id] = {
                        "user_id": other_id,
                        "user_name": sender.get("name", "Usuário") if isinstance(sender, dict) else "Usuário",
                        "avatar_url": sender.get("avatar_url") if isinstance(sender, dict) else None,
                        "last_message": msg["content"],
                        "last_message_at": msg["created_at"],
                        "unread_count": unread,
                    }
                else:
                    conversations_map[other_id]["unread_count"] += unread

            # Converter para lista e ordenar por última mensagem
            conversations = list(conversations_map.values())
            conversations.sort(key=lambda x: x["last_message_at"], reverse=True)

            return conversations

        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            logger.error(f"Erro ao buscar conversas: {str(e)}", exc_info=True)
            return []

    def get_messages(self, user_id: str, other_user_id: str, limit: int = 50) -> List[Dict[str, Any]]:
        """
        Busca mensagens entre dois usuários.
        Retorna mensagens ordenadas por data (mais antigas primeiro).
        """
        try:
            # Buscar mensagens onde user_id e other_user_id são sender ou recipient
            result = (
                self.db.table("direct_messages")
                .select("*, sender:users!direct_messages_sender_id_fkey(id, name, avatar_url)")
                .or_(
                    f"and(sender_id.eq.{user_id},recipient_id.eq.{other_user_id}),"
                    f"and(sender_id.eq.{other_user_id},recipient_id.eq.{user_id})"
                )
                .order("created_at", desc=False)
                .limit(limit)
                .execute()
            )

            return result.data or []

        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            logger.error(f"Erro ao buscar mensagens: {str(e)}", exc_info=True)
            return []

    def create_message(
        self, sender_id: str, recipient_id: str, content: str, attachment_url: str = None, 
        attachment_type: str = None, attachment_filename: str = None, attachment_size: int = None
    ) -> Optional[Dict[str, Any]]:
        """
        Cria nova mensagem com suporte a anexos.
        
        Args:
            sender_id: ID do remetente
            recipient_id: ID do destinatário
            content: Conteúdo da mensagem
            attachment_url: URL do anexo (opcional)
            attachment_type: Tipo do anexo (opcional)
            attachment_filename: Nome do arquivo (opcional)
            attachment_size: Tamanho do arquivo em bytes (opcional)
        """
        try:
            if sender_id == recipient_id:
                logger.warning(f"Tentativa de enviar mensagem para si mesmo: {sender_id}")
                return None

            if not content or not content.strip():
                # Permitir mensagem vazia se tiver anexo
                if not attachment_url:
                    logger.warning("Tentativa de enviar mensagem vazia sem anexo")
                    return None

            message_data = {
                "sender_id": sender_id,
                "recipient_id": recipient_id,
                "content": content.strip() if content else "",
            }
            
            # Adicionar dados do anexo se fornecido
            if attachment_url:
                message_data["attachment_url"] = attachment_url
                if attachment_type:
                    message_data["attachment_type"] = attachment_type
                if attachment_filename:
                    message_data["attachment_filename"] = attachment_filename
                if attachment_size:
                    message_data["attachment_size"] = attachment_size

            result = (
                self.db.table("direct_messages")
                .insert(message_data)
                .execute()
            )

            if result.data:
                return result.data[0]
            return None

        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            logger.error(f"Erro ao criar mensagem: {str(e)}", exc_info=True)
            return None

    def mark_as_read(self, message_id: str, user_id: str) -> bool:
        """
        Marca mensagem como lida.
        Apenas o recipient pode marcar como lida.
        """
        try:
            result = (
                self.db.table("direct_messages")
                .update({"read_at": "now()"})
                .eq("id", message_id)
                .eq("recipient_id", user_id)
                .is_("read_at", "null")
                .execute()
            )

            return len(result.data) > 0

        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            logger.error(f"Erro ao marcar como lida: {str(e)}", exc_info=True)
            return False

    def mark_conversation_as_read(self, user_id: str, other_user_id: str) -> int:
        """
        Marca todas as mensagens de uma conversa como lidas.
        Retorna número de mensagens marcadas.
        """
        try:
            result = (
                self.db.table("direct_messages")
                .update({"read_at": "now()"})
                .eq("recipient_id", user_id)
                .eq("sender_id", other_user_id)
                .is_("read_at", "null")
                .execute()
            )

            return len(result.data) if result.data else 0

        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            logger.error(f"Erro ao marcar conversa como lida: {str(e)}", exc_info=True)
            return 0

    def get_unread_count(self, user_id: str) -> int:
        """Retorna número de mensagens não lidas do usuário"""
        try:
            result = (
                self.db.table("direct_messages")
                .select("id", count="exact")
                .eq("recipient_id", user_id)
                .is_("read_at", "null")
                .execute()
            )

            return result.count if hasattr(result, "count") else 0

        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            logger.error(f"Erro ao contar mensagens não lidas: {str(e)}", exc_info=True)
            return 0
