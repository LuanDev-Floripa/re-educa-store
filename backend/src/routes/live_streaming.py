from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from services.live_streaming_service import LiveStreamingService
from utils.decorators import handle_exceptions
import logging

live_streaming_bp = Blueprint('live_streaming', __name__, url_prefix='/api/social/streams')
live_streaming_service = LiveStreamingService()

@live_streaming_bp.route('', methods=['GET'])
@jwt_required()
@handle_exceptions
def get_streams():
    """Get all active streams"""
    try:
        category = request.args.get('category')
        limit = int(request.args.get('limit', 20))
        offset = int(request.args.get('offset', 0))
        
        streams = live_streaming_service.get_streams(
            category=category,
            limit=limit,
            offset=offset
        )
        
        return jsonify({
            'success': True,
            'streams': streams,
            'total': len(streams)
        }), 200
    except Exception as e:
        logging.error(f"Error getting streams: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Erro ao carregar streams'
        }), 500

@live_streaming_bp.route('', methods=['POST'])
@jwt_required()
@handle_exceptions
def start_stream():
    """Start a new live stream"""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        required_fields = ['title', 'category']
        for field in required_fields:
            if field not in data:
                return jsonify({
                    'success': False,
                    'message': f'Campo obrigatório: {field}'
                }), 400
        
        stream = live_streaming_service.start_stream(
            user_id=user_id,
            title=data['title'],
            category=data['category'],
            description=data.get('description', ''),
            tags=data.get('tags', [])
        )
        
        return jsonify({
            'success': True,
            'stream': stream,
            'message': 'Stream iniciado com sucesso'
        }), 201
    except Exception as e:
        logging.error(f"Error starting stream: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Erro ao iniciar stream'
        }), 500

@live_streaming_bp.route('/<int:stream_id>', methods=['DELETE'])
@jwt_required()
@handle_exceptions
def end_stream(stream_id):
    """End a live stream"""
    try:
        user_id = get_jwt_identity()
        
        success = live_streaming_service.end_stream(
            stream_id=stream_id,
            user_id=user_id
        )
        
        if not success:
            return jsonify({
                'success': False,
                'message': 'Stream não encontrado ou não autorizado'
            }), 404
        
        return jsonify({
            'success': True,
            'message': 'Stream encerrado com sucesso'
        }), 200
    except Exception as e:
        logging.error(f"Error ending stream: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Erro ao encerrar stream'
        }), 500

@live_streaming_bp.route('/<int:stream_id>/join', methods=['POST'])
@jwt_required()
@handle_exceptions
def join_stream(stream_id):
    """Join a live stream"""
    try:
        user_id = get_jwt_identity()
        
        stream = live_streaming_service.join_stream(
            stream_id=stream_id,
            user_id=user_id
        )
        
        if not stream:
            return jsonify({
                'success': False,
                'message': 'Stream não encontrado'
            }), 404
        
        return jsonify({
            'success': True,
            'stream': stream,
            'message': 'Entrou no stream com sucesso'
        }), 200
    except Exception as e:
        logging.error(f"Error joining stream: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Erro ao entrar no stream'
        }), 500

@live_streaming_bp.route('/<int:stream_id>/leave', methods=['POST'])
@jwt_required()
@handle_exceptions
def leave_stream(stream_id):
    """Leave a live stream"""
    try:
        user_id = get_jwt_identity()
        
        success = live_streaming_service.leave_stream(
            stream_id=stream_id,
            user_id=user_id
        )
        
        if not success:
            return jsonify({
                'success': False,
                'message': 'Erro ao sair do stream'
            }), 400
        
        return jsonify({
            'success': True,
            'message': 'Saiu do stream com sucesso'
        }), 200
    except Exception as e:
        logging.error(f"Error leaving stream: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Erro ao sair do stream'
        }), 500

@live_streaming_bp.route('/<int:stream_id>/messages', methods=['POST'])
@jwt_required()
@handle_exceptions
def send_message(stream_id):
    """Send a message to a live stream"""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        if 'message' not in data:
            return jsonify({
                'success': False,
                'message': 'Mensagem é obrigatória'
            }), 400
        
        message = live_streaming_service.send_message(
            stream_id=stream_id,
            user_id=user_id,
            message=data['message']
        )
        
        if not message:
            return jsonify({
                'success': False,
                'message': 'Stream não encontrado'
            }), 404
        
        return jsonify({
            'success': True,
            'message': message
        }), 201
    except Exception as e:
        logging.error(f"Error sending message: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Erro ao enviar mensagem'
        }), 500

@live_streaming_bp.route('/<int:stream_id>/gifts', methods=['POST'])
@jwt_required()
@handle_exceptions
def send_gift(stream_id):
    """Send a gift to a live stream"""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        required_fields = ['gift_id', 'gift_name', 'gift_cost']
        for field in required_fields:
            if field not in data:
                return jsonify({
                    'success': False,
                    'message': f'Campo obrigatório: {field}'
                }), 400
        
        gift = live_streaming_service.send_gift(
            stream_id=stream_id,
            user_id=user_id,
            gift_id=data['gift_id'],
            gift_name=data['gift_name'],
            gift_cost=data['gift_cost']
        )
        
        if not gift:
            return jsonify({
                'success': False,
                'message': 'Stream não encontrado'
            }), 404
        
        return jsonify({
            'success': True,
            'gift': gift
        }), 201
    except Exception as e:
        logging.error(f"Error sending gift: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Erro ao enviar presente'
        }), 500

@live_streaming_bp.route('/<int:stream_id>/report', methods=['POST'])
@jwt_required()
@handle_exceptions
def report_stream(stream_id):
    """Report a live stream"""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        if 'reason' not in data:
            return jsonify({
                'success': False,
                'message': 'Motivo é obrigatório'
            }), 400
        
        success = live_streaming_service.report_stream(
            stream_id=stream_id,
            user_id=user_id,
            reason=data['reason']
        )
        
        if not success:
            return jsonify({
                'success': False,
                'message': 'Stream não encontrado'
            }), 404
        
        return jsonify({
            'success': True,
            'message': 'Stream reportado com sucesso'
        }), 200
    except Exception as e:
        logging.error(f"Error reporting stream: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Erro ao reportar stream'
        }), 500

@live_streaming_bp.route('/<int:stream_id>/stats', methods=['GET'])
@jwt_required()
@handle_exceptions
def get_stream_stats(stream_id):
    """Get stream statistics"""
    try:
        stats = live_streaming_service.get_stream_stats(stream_id)
        
        if not stats:
            return jsonify({
                'success': False,
                'message': 'Stream não encontrado'
            }), 404
        
        return jsonify({
            'success': True,
            'stats': stats
        }), 200
    except Exception as e:
        logging.error(f"Error getting stream stats: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Erro ao carregar estatísticas'
        }), 500