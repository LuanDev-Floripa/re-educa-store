"""
Serviço de WebSocket para Live Streaming RE-EDUCA.

Gerencia comunicação em tempo real incluindo:
- Conexões WebSocket autenticadas
- Salas de chat de streams
- Mensagens e reações em tempo real
- Sistema de presentes virtuais
- Tracking de visualizadores ativos
- Eventos de follows e interações
"""

import logging

import jwt
from config.settings import get_config
from flask import request
from flask_socketio import disconnect, emit, join_room, leave_room
from services.cache_service import cache_service
from services.live_streaming_service import LiveStreamingService

logger = logging.getLogger(__name__)


class WebSocketService:
    """
    Service para gerenciamento de conexões WebSocket.

    Gerencia todas as interações em tempo real do sistema.
    Estado armazenado no Redis para suportar deployment distribuído.
    """

    def __init__(self, socketio):
        """Inicializa o serviço WebSocket com instância do SocketIO."""
        self.socketio = socketio
        self.live_streaming_service = LiveStreamingService()
        self.CONNECTIONS_KEY = "ws:connections"  # {user_id: [socket_ids]}
        self.STREAM_ROOMS_KEY = "ws:stream_rooms"  # {stream_id: [user_ids]}
        # Mantidos para compatibilidade (mas não são mais usados)
        self.active_connections = {}  # DEPRECATED: usar Redis
        self.stream_rooms = {}  # DEPRECATED: usar Redis

    def _get_user_connections(self, user_id: str) -> list:
        """
        Utiliza Redis para Obtém conexões do usuário do Redis.

        Args:
            user_id: ID do usuário

        Returns:
            Lista de socket_ids
        """
        try:
            if cache_service.is_available():
                key = f"{self.CONNECTIONS_KEY}:{user_id}"
                connections = cache_service.get(key)
                if connections:
                    return connections if isinstance(connections, list) else []
            return []
        except Exception as e:
            logger.error(f"Erro ao buscar conexões do usuário {user_id}: {e}")
            return []

    def _set_user_connections(self, user_id: str, connections: list):
        """
        Utiliza Redis para Salva conexões do usuário no Redis.

        Args:
            user_id: ID do usuário
            connections: Lista de socket_ids
        """
        try:
            if cache_service.is_available():
                key = f"{self.CONNECTIONS_KEY}:{user_id}"
                # TTL de 1 hora para conexões
                cache_service.set(key, connections, ttl=3600)
        except Exception as e:
            logger.error(f"Erro ao salvar conexões do usuário {user_id}: {e}")

    def _get_stream_room(self, stream_id: str) -> list:
        """
        Utiliza Redis para Obtém lista de usuários na sala do stream do Redis.

        Args:
            stream_id: ID do stream

        Returns:
            Lista de user_ids
        """
        try:
            if cache_service.is_available():
                key = f"{self.STREAM_ROOMS_KEY}:{stream_id}"
                room_users = cache_service.get(key)
                if room_users:
                    return room_users if isinstance(room_users, list) else []
            return []
        except Exception as e:
            logger.error(f"Erro ao buscar sala do stream {stream_id}: {e}")
            return []

    def _set_stream_room(self, stream_id: str, user_ids: list):
        """
        Utiliza Redis para Salva lista de usuários na sala do stream no Redis.

        Args:
            stream_id: ID do stream
            user_ids: Lista de user_ids
        """
        try:
            if cache_service.is_available():
                key = f"{self.STREAM_ROOMS_KEY}:{stream_id}"
                # TTL de 2 horas para salas de stream
                cache_service.set(key, user_ids, ttl=7200)
        except Exception as e:
            logger.error(f"Erro ao salvar sala do stream {stream_id}: {e}")

    def authenticate_user(self, token):
        """
        Autentica usuário via JWT token.

        Args:
            token (str): Token JWT.

        Returns:
            str: User ID se válido, None caso contrário.
        """
        try:
            # Remove 'Bearer ' se presente
            if token.startswith("Bearer "):
                token = token[7:]

            # Decodifica o token JWT
            config = get_config()
            data = jwt.decode(token, config.JWT_SECRET_KEY, algorithms=["HS256"])
            user_id = data.get("user_id")

            if user_id:
                return user_id
            return None
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            logger.error(f"Erro na autenticação WebSocket: {e}", exc_info=True)
            return None

    def on_connect(self, auth=None):
        """
        Evento de conexão do WebSocket.

        Args:
            auth (dict): Dicionário com token de autenticação.

        Returns:
            bool: True se conectado com sucesso, False caso contrário.
        """
        try:
            if not auth or "token" not in auth:
                logger.warning("Conexão WebSocket sem token de autenticação")
                disconnect()
                return False

            user_id = self.authenticate_user(auth["token"])
            if not user_id:
                logger.warning("Token inválido na conexão WebSocket")
                disconnect()
                return False

            connections = self._get_user_connections(user_id)
            if request.sid not in connections:
                connections.append(request.sid)
                self._set_user_connections(user_id, connections)
                
                # Atualizar contador total de conexões ativas
                if cache_service.is_available():
                    try:
                        total = cache_service.get("ws:total_connections") or 0
                        cache_service.set("ws:total_connections", int(total) + 1, ttl=3600)
                    except Exception:
                        pass  # Não crítico

            logger.info(f"Usuário {user_id} conectado via WebSocket (socket_id: {request.sid})")
            return True

        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            logger.error(f"Erro na conexão WebSocket: {e}", exc_info=True)
            disconnect()
            return False

    def on_disconnect(self):
        """Evento de desconexão do WebSocket"""
        try:
            user_id = self.get_user_from_socket(request.sid)
            if user_id:
                connections = self._get_user_connections(user_id)
                if request.sid in connections:
                    connections.remove(request.sid)
                    if connections:
                        self._set_user_connections(user_id, connections)
                    else:
                        # Remove chave se não houver mais conexões
                        if cache_service.is_available():
                            cache_service.delete(f"{self.CONNECTIONS_KEY}:{user_id}")
                    
                    # Atualizar contador total de conexões ativas
                    if cache_service.is_available():
                        try:
                            total = cache_service.get("ws:total_connections") or 0
                            new_total = max(0, int(total) - 1)
                            cache_service.set("ws:total_connections", new_total, ttl=3600)
                        except Exception:
                            pass  # Não crítico

                # Sair de todas as salas de stream (buscar todas as salas do Redis)
                # Limitação: precisamos manter uma lista de stream_ids ou buscar todas as chaves
                # Por enquanto, apenas limpar conexão (salas são limpas automaticamente via TTL)

                logger.info(f"Usuário {user_id} desconectado do WebSocket")

        except Exception as e:
            logger.error(f"Erro na desconexão WebSocket: {e}")

    def get_user_from_socket(self, socket_id):
        """
        Encontra usuário pelo socket_id através de busca no Redis.

        Nota: Esta operação pode ser lenta se houver muitos usuários.
        Em produção, considerar manter um mapeamento inverso socket_id -> user_id.
        """
        try:
            if cache_service.is_available():
                # Buscar todas as chaves de conexões
                pattern = f"{self.CONNECTIONS_KEY}:*"
                keys = cache_service.redis_client.keys(pattern) if hasattr(cache_service, "redis_client") else []

                for key in keys:
                    user_id = key.replace(f"{self.CONNECTIONS_KEY}:", "")
                    connections = self._get_user_connections(user_id)
                    if socket_id in connections:
                        return user_id
            return None
        except Exception as e:
            logger.error(f"Erro ao buscar usuário por socket_id: {e}")
            return None

    def join_stream_room(self, stream_id, user_id):
        """
        Utiliza Redis para Usuário entra na sala do stream (estado no Redis).
        """
        try:
            join_room(f"stream_{stream_id}")

            room_users = self._get_stream_room(stream_id)
            was_empty = len(room_users) == 0

            if user_id not in room_users:
                room_users.append(user_id)
                self._set_stream_room(stream_id, room_users)

                # Se era o primeiro usuário, incrementar contador de streams ativos
                if was_empty and cache_service.is_available():
                    try:
                        active_streams = cache_service.get("ws:active_streams") or 0
                        cache_service.set("ws:active_streams", int(active_streams) + 1, ttl=3600)
                    except Exception:
                        pass  # Não crítico

                # Atualizar contador de visualizadores
                self.live_streaming_service.join_stream(stream_id, user_id)

                # Notificar outros usuários
                emit(
                    "viewer_joined",
                    {"user_id": user_id, "viewer_count": len(room_users)},
                    room=f"stream_{stream_id}",
                    include_self=False,
                )

                logger.info(f"Usuário {user_id} entrou no stream {stream_id}")

        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            logger.error(f"Erro ao entrar na sala do stream: {e}", exc_info=True)

    def leave_stream_room(self, stream_id, user_id):
        """
        Utiliza Redis para Usuário sai da sala do stream (estado no Redis).
        """
        try:
            leave_room(f"stream_{stream_id}")

            room_users = self._get_stream_room(stream_id)

            if user_id in room_users:
                room_users.remove(user_id)
                is_now_empty = len(room_users) == 0
                self._set_stream_room(stream_id, room_users)

                # Se ficou vazio, decrementar contador de streams ativos
                if is_now_empty and cache_service.is_available():
                    try:
                        active_streams = cache_service.get("ws:active_streams") or 0
                        new_count = max(0, int(active_streams) - 1)
                        cache_service.set("ws:active_streams", new_count, ttl=3600)
                    except Exception:
                        pass  # Não crítico

                # Atualizar contador de visualizadores
                self.live_streaming_service.leave_stream(stream_id, user_id)

                # Notificar outros usuários
                emit(
                    "viewer_left",
                    {"user_id": user_id, "viewer_count": len(room_users)},
                    room=f"stream_{stream_id}",
                    include_self=False,
                )

                logger.info(f"Usuário {user_id} saiu do stream {stream_id}")

        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            logger.error(f"Erro ao sair da sala do stream: {e}", exc_info=True)

    def on_join_stream(self, data):
        """Evento: usuário quer assistir um stream"""
        try:
            user_id = self.get_user_from_socket(request.sid)
            if not user_id:
                emit("error", {"message": "Usuário não autenticado"})
                return

            stream_id = data.get("stream_id")
            if not stream_id:
                emit("error", {"message": "ID do stream é obrigatório"})
                return

            # Verificar se stream existe e está ativo
            stream = self.live_streaming_service.get_stream_by_id(stream_id)
            if not stream or stream["status"] != "live":
                emit("error", {"message": "Stream não encontrado ou não está ativo"})
                return

            self.join_stream_room(stream_id, user_id)

            room_users = self._get_stream_room(stream_id)
            emit("stream_joined", {"stream": stream, "viewer_count": len(room_users)})

        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            logger.error(f"Erro ao entrar no stream: {e}", exc_info=True)
            emit("error", {"message": "Erro interno do servidor"})

    def on_leave_stream(self, data):
        """Evento: usuário quer sair de um stream"""
        try:
            user_id = self.get_user_from_socket(request.sid)
            if not user_id:
                return

            stream_id = data.get("stream_id")
            if stream_id:
                self.leave_stream_room(stream_id, user_id)
                emit("stream_left", {"stream_id": stream_id})

        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            logger.error(f"Erro ao sair do stream: {e}", exc_info=True)

    def on_send_message(self, data):
        """Evento: enviar mensagem no chat do stream"""
        try:
            user_id = self.get_user_from_socket(request.sid)
            if not user_id:
                emit("error", {"message": "Usuário não autenticado"})
                return

            stream_id = data.get("stream_id")
            message = data.get("message", "").strip()

            if not stream_id or not message:
                emit("error", {"message": "Stream ID e mensagem são obrigatórios"})
                return

            # Salvar mensagem no banco
            message_data = self.live_streaming_service.send_message(stream_id, user_id, message)

            if message_data:
                # Atualizar contador total de mensagens
                if cache_service.is_available():
                    try:
                        import time
                        total_messages = cache_service.get("ws:total_messages") or 0
                        cache_service.set("ws:total_messages", int(total_messages) + 1, ttl=3600)
                        
                        # Calcular mensagens por segundo (último minuto)
                        current_time = time.time()
                        messages_key = "ws:messages_timestamps"
                        timestamps = cache_service.get(messages_key) or []
                        # Manter apenas timestamps do último minuto
                        timestamps = [ts for ts in timestamps if current_time - ts < 60]
                        timestamps.append(current_time)
                        cache_service.set(messages_key, timestamps, ttl=60)
                        
                        # Calcular mensagens por segundo
                        if len(timestamps) > 1:
                            time_span = timestamps[-1] - timestamps[0]
                            if time_span > 0:
                                messages_per_second = len(timestamps) / time_span
                            else:
                                messages_per_second = len(timestamps)
                        else:
                            messages_per_second = 0.0
                        
                        cache_service.set("ws:messages_per_second", messages_per_second, ttl=60)
                    except Exception:
                        pass  # Não crítico

                # Buscar contador de likes da mensagem (se existir)
                likes_count = 0
                if cache_service.is_available():
                    try:
                        likes_key = f"stream_message_likes:{message_data['id']}"
                        likes_list = cache_service.get(likes_key) or []
                        likes_count = len(likes_list) if isinstance(likes_list, list) else 0
                    except Exception:
                        pass  # Não crítico

                # Enviar mensagem para todos na sala
                emit(
                    "message_received",
                    {
                        "id": message_data["id"],
                        "user_id": user_id,
                        "username": message_data.get("username", "Usuário"),
                        "message": message,
                        "timestamp": message_data["created_at"],
                        "likes": likes_count,
                    },
                    room=f"stream_{stream_id}",
                )

        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            logger.error(f"Erro ao enviar mensagem: {e}", exc_info=True)
            emit("error", {"message": "Erro ao enviar mensagem"})

    def on_send_gift(self, data):
        """Evento: enviar presente no stream"""
        try:
            user_id = self.get_user_from_socket(request.sid)
            if not user_id:
                emit("error", {"message": "Usuário não autenticado"})
                return

            stream_id = data.get("stream_id")
            gift_type = data.get("gift_type")
            gift_value = data.get("gift_value", 0)

            if not stream_id or not gift_type:
                emit("error", {"message": "Stream ID e tipo de presente são obrigatórios"})
                return

            # Salvar presente no banco
            gift_data = self.live_streaming_service.send_gift(stream_id, user_id, gift_type, gift_value)

            if gift_data:
                # Notificar todos na sala
                emit(
                    "gift_sent",
                    {
                        "id": gift_data["id"],
                        "user_id": user_id,
                        "username": gift_data.get("username", "Usuário"),
                        "gift_type": gift_type,
                        "gift_value": gift_value,
                        "timestamp": gift_data["created_at"],
                    },
                    room=f"stream_{stream_id}",
                )

        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            logger.error(f"Erro ao enviar presente: {e}", exc_info=True)
            emit("error", {"message": "Erro ao enviar presente"})

    def on_like_message(self, data):
        """
        Evento: curtir mensagem do chat.
        
        Armazena likes no Redis e notifica todos na sala do stream.
        """
        try:
            user_id = self.get_user_from_socket(request.sid)
            if not user_id:
                emit("error", {"message": "Usuário não autenticado"})
                return

            message_id = data.get("message_id")
            stream_id = data.get("stream_id")
            
            if not message_id or not stream_id:
                emit("error", {"message": "message_id e stream_id são obrigatórios"})
                return

            # Chave para armazenar likes da mensagem
            likes_key = f"stream_message_likes:{message_id}"
            # Chave para verificar se usuário já curtiu
            user_like_key = f"stream_message_like:{message_id}:{user_id}"

            if not cache_service.is_available():
                emit("error", {"message": "Serviço de cache indisponível"})
                return

            # Verificar se usuário já curtiu
            already_liked = cache_service.get(user_like_key)
            
            if already_liked:
                # Descurtir: remover like
                current_likes = cache_service.get(likes_key) or []
                if user_id in current_likes:
                    current_likes.remove(user_id)
                    cache_service.set(likes_key, current_likes, ttl=86400)  # 24 horas
                    cache_service.delete(user_like_key)
                    
                    # Notificar todos na sala
                    emit(
                        "message_unliked",
                        {
                            "message_id": message_id,
                            "user_id": user_id,
                            "likes_count": len(current_likes),
                        },
                        room=f"stream_{stream_id}",
                    )
            else:
                # Curtir: adicionar like
                current_likes = cache_service.get(likes_key) or []
                if user_id not in current_likes:
                    current_likes.append(user_id)
                    cache_service.set(likes_key, current_likes, ttl=86400)  # 24 horas
                    cache_service.set(user_like_key, True, ttl=86400)
                    
                    # Notificar todos na sala
                    emit(
                        "message_liked",
                        {
                            "message_id": message_id,
                            "user_id": user_id,
                            "likes_count": len(current_likes),
                        },
                        room=f"stream_{stream_id}",
                    )

        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            emit("error", {"message": "Erro de validação"})
        except Exception as e:
            logger.error(f"Erro ao curtir mensagem: {e}", exc_info=True)
            emit("error", {"message": "Erro ao curtir mensagem"})

    def on_follow_user(self, data):
        """Evento: seguir usuário"""
        try:
            user_id = self.get_user_from_socket(request.sid)
            if not user_id:
                return

            target_user_id = data.get("target_user_id")
            if target_user_id:
                # Implementar lógica de seguir usuário
                emit("user_followed", {"follower_id": user_id, "target_user_id": target_user_id})

        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            logger.error(f"Erro ao seguir usuário: {e}", exc_info=True)

    def on_report_stream(self, data):
        """Evento: reportar stream"""
        try:
            user_id = self.get_user_from_socket(request.sid)
            if not user_id:
                emit("error", {"message": "Usuário não autenticado"})
                return

            stream_id = data.get("stream_id")
            reason = data.get("reason")

            if stream_id and reason:
                self.live_streaming_service.report_stream(stream_id, user_id, reason)
                emit("stream_reported", {"stream_id": stream_id})

        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            logger.error(f"Erro ao reportar stream: {e}", exc_info=True)
            emit("error", {"message": "Erro ao reportar stream"})

    def broadcast_stream_started(self, stream_data):
        """Broadcast: stream iniciado"""
        try:
            self.socketio.emit("stream_started", stream_data, namespace="/")
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            logger.error(f"Erro ao broadcast stream iniciado: {e}", exc_info=True)

    def broadcast_stream_ended(self, stream_id):
        """Broadcast: stream finalizado"""
        try:
            self.socketio.emit("stream_ended", {"stream_id": stream_id}, namespace="/")
        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            logger.error(f"Erro ao broadcast stream finalizado: {e}", exc_info=True)

    def get_stream_viewers(self, stream_id):
        """
        Utiliza Redis para Obter lista de visualizadores do stream (do Redis).
        """
        return self._get_stream_room(stream_id)

    def get_user_connections(self, user_id):
        """
        Utiliza Redis para Obter conexões ativas do usuário (do Redis).
        """
        return self._get_user_connections(user_id)

    def cleanup_old_connections(self):
        """
        Limpa conexões antigas, chamado periodicamente ou no startup.

        Remove conexões que não estão mais ativas (TTL expirado).
        """
        try:
            if cache_service.is_available():
                # Redis gerencia TTL automaticamente, mas podemos limpar manualmente se necessário
                logger.info("Limpeza de conexões antigas concluída (TTL gerenciado pelo Redis)")
        except Exception as e:
            logger.error(f"Erro ao limpar conexões antigas: {e}")
