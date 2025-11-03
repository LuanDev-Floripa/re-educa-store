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

import json
import logging
from typing import Dict, List, Optional
from flask_socketio import emit, join_room, leave_room, disconnect
from flask import request
from middleware.auth import token_required
import jwt
from config.settings import get_config
from services.live_streaming_service import LiveStreamingService

logger = logging.getLogger(__name__)


class WebSocketService:
    """
    Service para gerenciamento de conexões WebSocket.

    Gerencia todas as interações em tempo real do sistema.
    """

    def __init__(self, socketio):
        """Inicializa o serviço WebSocket com instância do SocketIO."""
        self.socketio = socketio
        self.live_streaming_service = LiveStreamingService()
        self.active_connections = {}  # {user_id: [socket_ids]}
        self.stream_rooms = {}  # {stream_id: [user_ids]}

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
            if token.startswith('Bearer '):
                token = token[7:]

            # Decodifica o token JWT
            config = get_config()
            data = jwt.decode(token, config.JWT_SECRET_KEY, algorithms=['HS256'])
            user_id = data.get('user_id')

            if user_id:
                return user_id
            return None
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
            if not auth or 'token' not in auth:
                logger.warning("Conexão WebSocket sem token de autenticação")
                disconnect()
                return False

            user_id = self.authenticate_user(auth['token'])
            if not user_id:
                logger.warning("Token inválido na conexão WebSocket")
                disconnect()
                return False

            # Registrar conexão
            if user_id not in self.active_connections:
                self.active_connections[user_id] = []
            self.active_connections[user_id].append(request.sid)

            logger.info(f"Usuário {user_id} conectado via WebSocket")
            return True

        except Exception as e:
            logger.error(f"Erro na conexão WebSocket: {e}")
            disconnect()
            return False

    def on_disconnect(self):
        """Evento de desconexão do WebSocket"""
        try:
            user_id = self.get_user_from_socket(request.sid)
            if user_id:
                # Remover conexão
                if user_id in self.active_connections:
                    self.active_connections[user_id].remove(request.sid)
                    if not self.active_connections[user_id]:
                        del self.active_connections[user_id]

                # Sair de todas as salas de stream
                for stream_id in list(self.stream_rooms.keys()):
                    if user_id in self.stream_rooms[stream_id]:
                        self.leave_stream_room(stream_id, user_id)

                logger.info(f"Usuário {user_id} desconectado do WebSocket")

        except Exception as e:
            logger.error(f"Erro na desconexão WebSocket: {e}")

    def get_user_from_socket(self, socket_id):
        """Encontra usuário pelo socket_id"""
        for user_id, socket_ids in self.active_connections.items():
            if socket_id in socket_ids:
                return user_id
        return None

    def join_stream_room(self, stream_id, user_id):
        """Usuário entra na sala do stream"""
        try:
            join_room(f"stream_{stream_id}")

            if stream_id not in self.stream_rooms:
                self.stream_rooms[stream_id] = []

            if user_id not in self.stream_rooms[stream_id]:
                self.stream_rooms[stream_id].append(user_id)

                # Atualizar contador de visualizadores
                self.live_streaming_service.join_stream(stream_id, user_id)

                # Notificar outros usuários
                emit('viewer_joined', {
                    'user_id': user_id,
                    'viewer_count': len(self.stream_rooms[stream_id])
                }, room=f"stream_{stream_id}", include_self=False)

                logger.info(f"Usuário {user_id} entrou no stream {stream_id}")

        except Exception as e:
            logger.error(f"Erro ao entrar na sala do stream: {e}")

    def leave_stream_room(self, stream_id, user_id):
        """Usuário sai da sala do stream"""
        try:
            leave_room(f"stream_{stream_id}")

            if stream_id in self.stream_rooms and user_id in self.stream_rooms[stream_id]:
                self.stream_rooms[stream_id].remove(user_id)

                # Atualizar contador de visualizadores
                self.live_streaming_service.leave_stream(stream_id, user_id)

                # Notificar outros usuários
                emit('viewer_left', {
                    'user_id': user_id,
                    'viewer_count': len(self.stream_rooms[stream_id])
                }, room=f"stream_{stream_id}", include_self=False)

                logger.info(f"Usuário {user_id} saiu do stream {stream_id}")

        except Exception as e:
            logger.error(f"Erro ao sair da sala do stream: {e}")

    def on_join_stream(self, data):
        """Evento: usuário quer assistir um stream"""
        try:
            user_id = self.get_user_from_socket(request.sid)
            if not user_id:
                emit('error', {'message': 'Usuário não autenticado'})
                return

            stream_id = data.get('stream_id')
            if not stream_id:
                emit('error', {'message': 'ID do stream é obrigatório'})
                return

            # Verificar se stream existe e está ativo
            stream = self.live_streaming_service.get_stream_by_id(stream_id)
            if not stream or stream['status'] != 'live':
                emit('error', {'message': 'Stream não encontrado ou não está ativo'})
                return

            self.join_stream_room(stream_id, user_id)

            # Enviar dados do stream para o usuário
            emit('stream_joined', {
                'stream': stream,
                'viewer_count': len(self.stream_rooms.get(stream_id, []))
            })

        except Exception as e:
            logger.error(f"Erro ao entrar no stream: {e}")
            emit('error', {'message': 'Erro interno do servidor'})

    def on_leave_stream(self, data):
        """Evento: usuário quer sair de um stream"""
        try:
            user_id = self.get_user_from_socket(request.sid)
            if not user_id:
                return

            stream_id = data.get('stream_id')
            if stream_id:
                self.leave_stream_room(stream_id, user_id)
                emit('stream_left', {'stream_id': stream_id})

        except Exception as e:
            logger.error(f"Erro ao sair do stream: {e}")

    def on_send_message(self, data):
        """Evento: enviar mensagem no chat do stream"""
        try:
            user_id = self.get_user_from_socket(request.sid)
            if not user_id:
                emit('error', {'message': 'Usuário não autenticado'})
                return

            stream_id = data.get('stream_id')
            message = data.get('message', '').strip()

            if not stream_id or not message:
                emit('error', {'message': 'Stream ID e mensagem são obrigatórios'})
                return

            # Salvar mensagem no banco
            message_data = self.live_streaming_service.send_message(
                stream_id, user_id, message
            )

            if message_data:
                # Enviar mensagem para todos na sala
                emit('message_received', {
                    'id': message_data['id'],
                    'user_id': user_id,
                    'username': message_data.get('username', 'Usuário'),
                    'message': message,
                    'timestamp': message_data['created_at'],
                    'likes': 0
                }, room=f"stream_{stream_id}")

        except Exception as e:
            logger.error(f"Erro ao enviar mensagem: {e}")
            emit('error', {'message': 'Erro ao enviar mensagem'})

    def on_send_gift(self, data):
        """Evento: enviar presente no stream"""
        try:
            user_id = self.get_user_from_socket(request.sid)
            if not user_id:
                emit('error', {'message': 'Usuário não autenticado'})
                return

            stream_id = data.get('stream_id')
            gift_type = data.get('gift_type')
            gift_value = data.get('gift_value', 0)

            if not stream_id or not gift_type:
                emit('error', {'message': 'Stream ID e tipo de presente são obrigatórios'})
                return

            # Salvar presente no banco
            gift_data = self.live_streaming_service.send_gift(
                stream_id, user_id, gift_type, gift_value
            )

            if gift_data:
                # Notificar todos na sala
                emit('gift_sent', {
                    'id': gift_data['id'],
                    'user_id': user_id,
                    'username': gift_data.get('username', 'Usuário'),
                    'gift_type': gift_type,
                    'gift_value': gift_value,
                    'timestamp': gift_data['created_at']
                }, room=f"stream_{stream_id}")

        except Exception as e:
            logger.error(f"Erro ao enviar presente: {e}")
            emit('error', {'message': 'Erro ao enviar presente'})

    def on_like_message(self, data):
        """Evento: curtir mensagem do chat"""
        try:
            user_id = self.get_user_from_socket(request.sid)
            if not user_id:
                return

            message_id = data.get('message_id')
            if message_id:
                # Implementar lógica de curtir mensagem
                emit('message_liked', {
                    'message_id': message_id,
                    'user_id': user_id
                }, room=f"stream_{data.get('stream_id')}")

        except Exception as e:
            logger.error(f"Erro ao curtir mensagem: {e}")

    def on_follow_user(self, data):
        """Evento: seguir usuário"""
        try:
            user_id = self.get_user_from_socket(request.sid)
            if not user_id:
                return

            target_user_id = data.get('target_user_id')
            if target_user_id:
                # Implementar lógica de seguir usuário
                emit('user_followed', {
                    'follower_id': user_id,
                    'target_user_id': target_user_id
                })

        except Exception as e:
            logger.error(f"Erro ao seguir usuário: {e}")

    def on_report_stream(self, data):
        """Evento: reportar stream"""
        try:
            user_id = self.get_user_from_socket(request.sid)
            if not user_id:
                emit('error', {'message': 'Usuário não autenticado'})
                return

            stream_id = data.get('stream_id')
            reason = data.get('reason')

            if stream_id and reason:
                self.live_streaming_service.report_stream(stream_id, user_id, reason)
                emit('stream_reported', {'stream_id': stream_id})

        except Exception as e:
            logger.error(f"Erro ao reportar stream: {e}")
            emit('error', {'message': 'Erro ao reportar stream'})

    def broadcast_stream_started(self, stream_data):
        """Broadcast: stream iniciado"""
        try:
            self.socketio.emit('stream_started', stream_data, namespace='/')
        except Exception as e:
            logger.error(f"Erro ao broadcast stream iniciado: {e}")

    def broadcast_stream_ended(self, stream_id):
        """Broadcast: stream finalizado"""
        try:
            self.socketio.emit('stream_ended', {'stream_id': stream_id}, namespace='/')
        except Exception as e:
            logger.error(f"Erro ao broadcast stream finalizado: {e}")

    def get_stream_viewers(self, stream_id):
        """Obter lista de visualizadores do stream"""
        return self.stream_rooms.get(stream_id, [])

    def get_user_connections(self, user_id):
        """Obter conexões ativas do usuário"""
        return self.active_connections.get(user_id, [])
