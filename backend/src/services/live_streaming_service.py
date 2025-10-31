"""
Serviço de Live Streaming RE-EDUCA Store.

Gerencia transmissões ao vivo incluindo:
- Criação e gerenciamento de streams
- Controle de visualizadores
- Chat e interações em tempo real
- Analytics de streams
- Moderação e relatórios
"""
from datetime import datetime, timedelta
from config.database import supabase_client
from utils.helpers import generate_uuid
import logging

logger = logging.getLogger(__name__)

class LiveStreamingService:
    """Service para gerenciamento de live streaming."""
    
    def __init__(self):
        """Inicializa o serviço de live streaming."""
        self.supabase = supabase_client

    def get_streams(self, category=None, limit=20, offset=0):
        """
        Lista todos os streams ativos.
        
        Args:
            category (str, optional): Filtrar por categoria.
            limit (int): Limite de resultados (padrão: 20).
            offset (int): Offset para paginação (padrão: 0).
            
        Returns:
            List[Dict]: Lista de streams ativos.
        """
        try:
            query = self.supabase.table('live_streams')\
                .select('*, users!live_streams_user_id_fkey(id, name, username, avatar_url, is_verified)')\
                .eq('is_live', True)
            
            if category:
                query = query.eq('category', category)
            
            result = query.order('created_at', desc=True)\
                .range(offset, offset + limit - 1)\
                .execute()
            
            streams = []
            if result.data:
                for stream in result.data:
                    user_info = stream.get('users', {}) if isinstance(stream.get('users'), dict) else {}
                    streams.append({
                        'id': stream['id'],
                        'title': stream.get('title'),
                        'description': stream.get('description'),
                        'category': stream.get('category'),
                        'tags': stream.get('tags') or [],
                        'viewer_count': stream.get('viewer_count', 0),
                        'like_count': stream.get('like_count', 0),
                        'share_count': stream.get('share_count', 0),
                        'created_at': stream.get('created_at'),
                        'is_live': stream.get('is_live', False),
                        'user': {
                            'id': user_info.get('id'),
                            'name': user_info.get('name'),
                            'username': user_info.get('username'),
                            'avatar_url': user_info.get('avatar_url'),
                            'is_verified': user_info.get('is_verified', False)
                        }
                    })
            
            return streams
            
        except Exception as e:
            logger.error(f"Error getting streams: {str(e)}", exc_info=True)
            return []

    def start_stream(self, user_id, title, category, description="", tags=None):
        """Start a new live stream"""
        try:
            # Check if user already has an active stream
            existing = self.supabase.table('live_streams')\
                .select('id')\
                .eq('user_id', user_id)\
                .eq('is_live', True)\
                .execute()
            
            if existing.data:
                raise Exception("Usuário já possui um stream ativo")
            
            # Create new stream
            stream_id = generate_uuid()
            stream_data = {
                'id': stream_id,
                'user_id': user_id,
                'title': title,
                'description': description,
                'category': category,
                'tags': tags or [],
                'is_live': True,
                'viewer_count': 0,
                'like_count': 0,
                'share_count': 0
            }
            
            result = self.supabase.table('live_streams').insert(stream_data).execute()
            
            if result.data:
                return self.get_stream_by_id(stream_id)
            else:
                raise Exception("Erro ao criar stream")
            
        except Exception as e:
            logger.error(f"Error starting stream: {str(e)}", exc_info=True)
            raise e

    def end_stream(self, stream_id, user_id):
        """End a live stream"""
        try:
            # Check if stream exists and belongs to user
            existing = self.supabase.table('live_streams')\
                .select('id')\
                .eq('id', stream_id)\
                .eq('user_id', user_id)\
                .eq('is_live', True)\
                .execute()
            
            if not existing.data:
                return False
            
            # End stream
            self.supabase.table('live_streams')\
                .update({
                    'is_live': False,
                    'ended_at': datetime.now().isoformat()
                })\
                .eq('id', stream_id)\
                .execute()
            
            return True
            
        except Exception as e:
            logger.error(f"Error ending stream: {str(e)}", exc_info=True)
            return False

    def join_stream(self, stream_id, user_id):
        """Join a live stream"""
        try:
            # Get stream data
            stream_result = self.supabase.table('live_streams')\
                .select('*, users!live_streams_user_id_fkey(id, name, username, avatar_url, is_verified)')\
                .eq('id', stream_id)\
                .eq('is_live', True)\
                .single()\
                .execute()
            
            if not stream_result.data:
                return None
            
            stream = stream_result.data
            
            # Increment viewer count
            new_viewer_count = stream.get('viewer_count', 0) + 1
            self.supabase.table('live_streams')\
                .update({'viewer_count': new_viewer_count})\
                .eq('id', stream_id)\
                .execute()
            
            # Add viewer to stream viewers (upsert - ignora se já existe)
            try:
                self.supabase.table('stream_viewers')\
                    .insert({
                        'stream_id': stream_id,
                        'user_id': user_id,
                        'joined_at': datetime.now().isoformat()
                    })\
                    .execute()
            except:
                pass  # Já existe, ignorar
            
            user_info = stream.get('users', {}) if isinstance(stream.get('users'), dict) else {}
            
            return {
                'id': stream['id'],
                'title': stream.get('title'),
                'description': stream.get('description'),
                'category': stream.get('category'),
                'tags': stream.get('tags') or [],
                'viewer_count': new_viewer_count,
                'like_count': stream.get('like_count', 0),
                'share_count': stream.get('share_count', 0),
                'created_at': stream.get('created_at'),
                'is_live': stream.get('is_live', False),
                'user': {
                    'id': user_info.get('id'),
                    'name': user_info.get('name'),
                    'username': user_info.get('username'),
                    'avatar_url': user_info.get('avatar_url'),
                    'is_verified': user_info.get('is_verified', False)
                }
            }
            
        except Exception as e:
            logger.error(f"Error joining stream: {str(e)}", exc_info=True)
            return None

    def leave_stream(self, stream_id, user_id):
        """Leave a live stream"""
        try:
            # Remove viewer from stream viewers
            self.supabase.table('stream_viewers')\
                .delete()\
                .eq('stream_id', stream_id)\
                .eq('user_id', user_id)\
                .execute()
            
            # Get current viewer count
            stream_result = self.supabase.table('live_streams')\
                .select('viewer_count')\
                .eq('id', stream_id)\
                .single()\
                .execute()
            
            if stream_result.data:
                current_count = stream_result.data.get('viewer_count', 0)
                new_count = max(current_count - 1, 0)
                
                # Decrement viewer count
                self.supabase.table('live_streams')\
                    .update({'viewer_count': new_count})\
                    .eq('id', stream_id)\
                    .execute()
            
            return True
            
        except Exception as e:
            logger.error(f"Error leaving stream: {str(e)}", exc_info=True)
            return False

    def send_message(self, stream_id, user_id, message):
        """Send a message to a live stream"""
        try:
            # Check if stream exists and is live
            stream_check = self.supabase.table('live_streams')\
                .select('id')\
                .eq('id', stream_id)\
                .eq('is_live', True)\
                .execute()
            
            if not stream_check.data:
                return None
            
            # Create message
            message_id = generate_uuid()
            message_data = {
                'id': message_id,
                'stream_id': stream_id,
                'user_id': user_id,
                'message': message
            }
            
            result = self.supabase.table('stream_messages').insert(message_data).execute()
            
            if result.data:
                return result.data[0]
            return None
            
        except Exception as e:
            logger.error(f"Error sending message: {str(e)}", exc_info=True)
            return None

    def send_gift(self, stream_id, user_id, gift_type, gift_value):
        """Send a gift to a live stream"""
        try:
            # Check if stream exists and is live
            stream_check = self.supabase.table('live_streams')\
                .select('id')\
                .eq('id', stream_id)\
                .eq('is_live', True)\
                .execute()
            
            if not stream_check.data:
                return None
            
            # Create gift
            gift_id = generate_uuid()
            gift_data = {
                'id': gift_id,
                'stream_id': stream_id,
                'user_id': user_id,
                'gift_type': gift_type,
                'gift_value': gift_value
            }
            
            result = self.supabase.table('stream_gifts').insert(gift_data).execute()
            
            if result.data:
                return result.data[0]
            return None
            
        except Exception as e:
            logger.error(f"Error sending gift: {str(e)}", exc_info=True)
            return None

    def report_stream(self, stream_id, user_id, reason):
        """Report a live stream"""
        try:
            # Check if stream exists
            stream_check = self.supabase.table('live_streams')\
                .select('id')\
                .eq('id', stream_id)\
                .execute()
            
            if not stream_check.data:
                return False
            
            # Create report
            report_id = generate_uuid()
            report_data = {
                'id': report_id,
                'stream_id': stream_id,
                'user_id': user_id,
                'reason': reason
            }
            
            self.supabase.table('stream_reports').insert(report_data).execute()
            return True
            
        except Exception as e:
            logger.error(f"Error reporting stream: {str(e)}", exc_info=True)
            return False

    def get_stream_stats(self, stream_id):
        """Get stream statistics"""
        try:
            # Get stream basic data
            stream_result = self.supabase.table('live_streams')\
                .select('viewer_count, like_count, share_count, created_at')\
                .eq('id', stream_id)\
                .single()\
                .execute()
            
            if not stream_result.data:
                return None
            
            stream = stream_result.data
            
            # Get unique viewers count
            viewers_result = self.supabase.table('stream_viewers')\
                .select('user_id', count='exact')\
                .eq('stream_id', stream_id)\
                .execute()
            unique_viewers = viewers_result.count if hasattr(viewers_result, 'count') else 0
            
            # Get messages count
            messages_result = self.supabase.table('stream_messages')\
                .select('id', count='exact')\
                .eq('stream_id', stream_id)\
                .execute()
            message_count = messages_result.count if hasattr(messages_result, 'count') else 0
            
            # Get gifts count
            gifts_result = self.supabase.table('stream_gifts')\
                .select('id', count='exact')\
                .eq('stream_id', stream_id)\
                .execute()
            gift_count = gifts_result.count if hasattr(gifts_result, 'count') else 0
            
            return {
                'viewer_count': stream.get('viewer_count', 0),
                'like_count': stream.get('like_count', 0),
                'share_count': stream.get('share_count', 0),
                'created_at': stream.get('created_at'),
                'unique_viewers': unique_viewers,
                'message_count': message_count,
                'gift_count': gift_count
            }
            
        except Exception as e:
            logger.error(f"Error getting stream stats: {str(e)}", exc_info=True)
            return None

    def get_stream_by_id(self, stream_id):
        """Get stream by ID"""
        try:
            result = self.supabase.table('live_streams')\
                .select('*, users!live_streams_user_id_fkey(id, name, username, avatar_url, is_verified)')\
                .eq('id', stream_id)\
                .single()\
                .execute()
            
            if not result.data:
                return None
            
            stream = result.data
            user_info = stream.get('users', {}) if isinstance(stream.get('users'), dict) else {}
            
            return {
                'id': stream['id'],
                'title': stream.get('title'),
                'description': stream.get('description'),
                'category': stream.get('category'),
                'tags': stream.get('tags') or [],
                'viewer_count': stream.get('viewer_count', 0),
                'like_count': stream.get('like_count', 0),
                'share_count': stream.get('share_count', 0),
                'created_at': stream.get('created_at'),
                'is_live': stream.get('is_live', False),
                'status': 'live' if stream.get('is_live') else 'ended',
                'user': {
                    'id': user_info.get('id'),
                    'name': user_info.get('name'),
                    'username': user_info.get('username'),
                    'avatar_url': user_info.get('avatar_url'),
                    'is_verified': user_info.get('is_verified', False)
                }
            }
            
        except Exception as e:
            logger.error(f"Error getting stream by ID: {str(e)}", exc_info=True)
            return None