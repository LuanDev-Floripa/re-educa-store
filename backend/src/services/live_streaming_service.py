import psycopg2
from datetime import datetime, timedelta
from database.connection import get_db_connection
from utils.helpers import generate_uuid
import logging

class LiveStreamingService:
    def __init__(self):
        self.conn = get_db_connection()

    def get_streams(self, category=None, limit=20, offset=0):
        """Get all active streams"""
        try:
            cursor = self.conn.cursor()
            
            query = """
                SELECT 
                    s.id,
                    s.title,
                    s.description,
                    s.category,
                    s.tags,
                    s.viewer_count,
                    s.like_count,
                    s.share_count,
                    s.created_at,
                    s.is_live,
                    u.id as user_id,
                    u.name as user_name,
                    u.username,
                    u.avatar_url,
                    u.is_verified
                FROM live_streams s
                JOIN users u ON s.user_id = u.id
                WHERE s.is_live = true
            """
            
            params = []
            if category:
                query += " AND s.category = %s"
                params.append(category)
            
            query += " ORDER BY s.created_at DESC LIMIT %s OFFSET %s"
            params.extend([limit, offset])
            
            cursor.execute(query, params)
            streams = cursor.fetchall()
            
            result = []
            for stream in streams:
                result.append({
                    'id': stream[0],
                    'title': stream[1],
                    'description': stream[2],
                    'category': stream[3],
                    'tags': stream[4] or [],
                    'viewer_count': stream[5],
                    'like_count': stream[6],
                    'share_count': stream[7],
                    'created_at': stream[8].isoformat(),
                    'is_live': stream[9],
                    'user': {
                        'id': stream[10],
                        'name': stream[11],
                        'username': stream[12],
                        'avatar_url': stream[13],
                        'is_verified': stream[14]
                    }
                })
            
            cursor.close()
            return result
            
        except Exception as e:
            logging.error(f"Error getting streams: {str(e)}")
            return []

    def start_stream(self, user_id, title, category, description="", tags=None):
        """Start a new live stream"""
        try:
            cursor = self.conn.cursor()
            
            # Check if user already has an active stream
            cursor.execute("""
                SELECT id FROM live_streams 
                WHERE user_id = %s AND is_live = true
            """, (user_id,))
            
            if cursor.fetchone():
                cursor.close()
                raise Exception("Usuário já possui um stream ativo")
            
            # Create new stream
            stream_id = generate_uuid()
            cursor.execute("""
                INSERT INTO live_streams (
                    id, user_id, title, description, category, 
                    tags, is_live, created_at
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            """, (
                stream_id, user_id, title, description, category,
                tags or [], True, datetime.now()
            ))
            
            self.conn.commit()
            cursor.close()
            
            # Return stream data
            return self.get_stream_by_id(stream_id)
            
        except Exception as e:
            logging.error(f"Error starting stream: {str(e)}")
            raise e

    def end_stream(self, stream_id, user_id):
        """End a live stream"""
        try:
            cursor = self.conn.cursor()
            
            # Check if stream exists and belongs to user
            cursor.execute("""
                SELECT id FROM live_streams 
                WHERE id = %s AND user_id = %s AND is_live = true
            """, (stream_id, user_id))
            
            if not cursor.fetchone():
                cursor.close()
                return False
            
            # End stream
            cursor.execute("""
                UPDATE live_streams 
                SET is_live = false, ended_at = %s
                WHERE id = %s
            """, (datetime.now(), stream_id))
            
            self.conn.commit()
            cursor.close()
            return True
            
        except Exception as e:
            logging.error(f"Error ending stream: {str(e)}")
            return False

    def join_stream(self, stream_id, user_id):
        """Join a live stream"""
        try:
            cursor = self.conn.cursor()
            
            # Get stream data
            cursor.execute("""
                SELECT 
                    s.id, s.title, s.description, s.category, s.tags,
                    s.viewer_count, s.like_count, s.share_count,
                    s.created_at, s.is_live,
                    u.id as user_id, u.name as user_name, 
                    u.username, u.avatar_url, u.is_verified
                FROM live_streams s
                JOIN users u ON s.user_id = u.id
                WHERE s.id = %s AND s.is_live = true
            """, (stream_id,))
            
            stream = cursor.fetchone()
            if not stream:
                cursor.close()
                return None
            
            # Increment viewer count
            cursor.execute("""
                UPDATE live_streams 
                SET viewer_count = viewer_count + 1
                WHERE id = %s
            """, (stream_id,))
            
            # Add viewer to stream viewers
            cursor.execute("""
                INSERT INTO stream_viewers (stream_id, user_id, joined_at)
                VALUES (%s, %s, %s)
                ON CONFLICT (stream_id, user_id) DO NOTHING
            """, (stream_id, user_id, datetime.now()))
            
            self.conn.commit()
            cursor.close()
            
            return {
                'id': stream[0],
                'title': stream[1],
                'description': stream[2],
                'category': stream[3],
                'tags': stream[4] or [],
                'viewer_count': stream[5] + 1,
                'like_count': stream[6],
                'share_count': stream[7],
                'created_at': stream[8].isoformat(),
                'is_live': stream[9],
                'user': {
                    'id': stream[10],
                    'name': stream[11],
                    'username': stream[12],
                    'avatar_url': stream[13],
                    'is_verified': stream[14]
                }
            }
            
        except Exception as e:
            logging.error(f"Error joining stream: {str(e)}")
            return None

    def leave_stream(self, stream_id, user_id):
        """Leave a live stream"""
        try:
            cursor = self.conn.cursor()
            
            # Remove viewer from stream viewers
            cursor.execute("""
                DELETE FROM stream_viewers 
                WHERE stream_id = %s AND user_id = %s
            """, (stream_id, user_id))
            
            # Decrement viewer count
            cursor.execute("""
                UPDATE live_streams 
                SET viewer_count = GREATEST(viewer_count - 1, 0)
                WHERE id = %s
            """, (stream_id,))
            
            self.conn.commit()
            cursor.close()
            return True
            
        except Exception as e:
            logging.error(f"Error leaving stream: {str(e)}")
            return False

    def send_message(self, stream_id, user_id, message):
        """Send a message to a live stream"""
        try:
            cursor = self.conn.cursor()
            
            # Check if stream exists and is live
            cursor.execute("""
                SELECT id FROM live_streams 
                WHERE id = %s AND is_live = true
            """, (stream_id,))
            
            if not cursor.fetchone():
                cursor.close()
                return None
            
            # Create message
            message_id = generate_uuid()
            cursor.execute("""
                INSERT INTO stream_messages (
                    id, stream_id, user_id, message, created_at
                ) VALUES (%s, %s, %s, %s, %s)
            """, (message_id, stream_id, user_id, message, datetime.now()))
            
            self.conn.commit()
            cursor.close()
            
            return {
                'id': message_id,
                'stream_id': stream_id,
                'user_id': user_id,
                'message': message,
                'created_at': datetime.now().isoformat()
            }
            
        except Exception as e:
            logging.error(f"Error sending message: {str(e)}")
            return None

    def send_gift(self, stream_id, user_id, gift_id, gift_name, gift_cost):
        """Send a gift to a live stream"""
        try:
            cursor = self.conn.cursor()
            
            # Check if stream exists and is live
            cursor.execute("""
                SELECT id FROM live_streams 
                WHERE id = %s AND is_live = true
            """, (stream_id,))
            
            if not cursor.fetchone():
                cursor.close()
                return None
            
            # Create gift
            gift_id = generate_uuid()
            cursor.execute("""
                INSERT INTO stream_gifts (
                    id, stream_id, user_id, gift_id, gift_name, 
                    gift_cost, created_at
                ) VALUES (%s, %s, %s, %s, %s, %s, %s)
            """, (gift_id, stream_id, user_id, gift_id, gift_name, gift_cost, datetime.now()))
            
            self.conn.commit()
            cursor.close()
            
            return {
                'id': gift_id,
                'stream_id': stream_id,
                'user_id': user_id,
                'gift_name': gift_name,
                'gift_cost': gift_cost,
                'created_at': datetime.now().isoformat()
            }
            
        except Exception as e:
            logging.error(f"Error sending gift: {str(e)}")
            return None

    def report_stream(self, stream_id, user_id, reason):
        """Report a live stream"""
        try:
            cursor = self.conn.cursor()
            
            # Check if stream exists
            cursor.execute("""
                SELECT id FROM live_streams 
                WHERE id = %s
            """, (stream_id,))
            
            if not cursor.fetchone():
                cursor.close()
                return False
            
            # Create report
            report_id = generate_uuid()
            cursor.execute("""
                INSERT INTO stream_reports (
                    id, stream_id, user_id, reason, created_at
                ) VALUES (%s, %s, %s, %s, %s)
            """, (report_id, stream_id, user_id, reason, datetime.now()))
            
            self.conn.commit()
            cursor.close()
            return True
            
        except Exception as e:
            logging.error(f"Error reporting stream: {str(e)}")
            return False

    def get_stream_stats(self, stream_id):
        """Get stream statistics"""
        try:
            cursor = self.conn.cursor()
            
            cursor.execute("""
                SELECT 
                    s.viewer_count,
                    s.like_count,
                    s.share_count,
                    s.created_at,
                    COUNT(DISTINCT sv.user_id) as unique_viewers,
                    COUNT(DISTINCT sm.id) as message_count,
                    COUNT(DISTINCT sg.id) as gift_count
                FROM live_streams s
                LEFT JOIN stream_viewers sv ON s.id = sv.stream_id
                LEFT JOIN stream_messages sm ON s.id = sm.stream_id
                LEFT JOIN stream_gifts sg ON s.id = sg.stream_id
                WHERE s.id = %s
                GROUP BY s.id, s.viewer_count, s.like_count, s.share_count, s.created_at
            """, (stream_id,))
            
            stats = cursor.fetchone()
            cursor.close()
            
            if not stats:
                return None
            
            return {
                'viewer_count': stats[0],
                'like_count': stats[1],
                'share_count': stats[2],
                'created_at': stats[3].isoformat(),
                'unique_viewers': stats[4],
                'message_count': stats[5],
                'gift_count': stats[6]
            }
            
        except Exception as e:
            logging.error(f"Error getting stream stats: {str(e)}")
            return None

    def get_stream_by_id(self, stream_id):
        """Get stream by ID"""
        try:
            cursor = self.conn.cursor()
            
            cursor.execute("""
                SELECT 
                    s.id, s.title, s.description, s.category, s.tags,
                    s.viewer_count, s.like_count, s.share_count,
                    s.created_at, s.is_live,
                    u.id as user_id, u.name as user_name, 
                    u.username, u.avatar_url, u.is_verified
                FROM live_streams s
                JOIN users u ON s.user_id = u.id
                WHERE s.id = %s
            """, (stream_id,))
            
            stream = cursor.fetchone()
            cursor.close()
            
            if not stream:
                return None
            
            return {
                'id': stream[0],
                'title': stream[1],
                'description': stream[2],
                'category': stream[3],
                'tags': stream[4] or [],
                'viewer_count': stream[5],
                'like_count': stream[6],
                'share_count': stream[7],
                'created_at': stream[8].isoformat(),
                'is_live': stream[9],
                'user': {
                    'id': stream[10],
                    'name': stream[11],
                    'username': stream[12],
                    'avatar_url': stream[13],
                    'is_verified': stream[14]
                }
            }
            
        except Exception as e:
            logging.error(f"Error getting stream by ID: {str(e)}")
            return None