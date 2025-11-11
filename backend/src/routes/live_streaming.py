"""
Rotas de Live Streaming RE-EDUCA.

Gerencia transmissões ao vivo incluindo:
- Iniciar e encerrar streams
- Listar streams ativos
- Gerenciar participantes e visualizadores
- Chat e interações em tempo real
"""
from flask import Blueprint, request, jsonify
from middleware.auth import token_required
from services.live_streaming_service import LiveStreamingService
from utils.exception_strategies import handle_route_exceptions
from exceptions.custom_exceptions import ValidationError, NotFoundError, InternalServerError
import logging

logger = logging.getLogger(__name__)

live_streaming_bp = Blueprint('live_streaming', __name__, url_prefix='/api/social/streams')
live_streaming_service = LiveStreamingService()

@live_streaming_bp.route('', methods=['GET'])
@token_required
@handle_route_exceptions
def get_streams():
    """
    Lista todos os streams ativos.
    
    Implementa tratamento robusto de exceções e validação de dados.

    Query Parameters:
        category (str): Filtrar por categoria.
        limit (int): Limite de resultados (padrão: 20).
        offset (int): Offset para paginação (padrão: 0).

    Returns:
        JSON: Lista de streams ativos ou erro.
    """
    category = request.args.get('category')
    
    try:
        limit = int(request.args.get('limit', 20))
        if limit < 1 or limit > 100:
            raise ValidationError("limit deve estar entre 1 e 100")
    except (ValueError, TypeError):
        raise ValidationError("limit deve ser um número válido")
    
    try:
        offset = int(request.args.get('offset', 0))
        if offset < 0:
            raise ValidationError("offset deve ser maior ou igual a 0")
    except (ValueError, TypeError):
        raise ValidationError("offset deve ser um número válido")

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

@live_streaming_bp.route('', methods=['POST'])
@token_required
@handle_route_exceptions
def start_stream():
    """
    Inicia uma nova transmissão ao vivo.
    
    Implementa tratamento robusto de exceções e validação de dados.

    Request Body:
        title (str): Título do stream (obrigatório).
        category (str): Categoria (obrigatório).
        description (str): Descrição opcional.
        tags (list): Tags opcionais.

    Returns:
        JSON: Stream criado com detalhes ou erro.
    """
    user_id = request.current_user.get('id')
    data = request.get_json()

    required_fields = ['title', 'category']
    for field in required_fields:
        if field not in data:
            raise ValidationError(f'Campo obrigatório: {field}')

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

@live_streaming_bp.route('/<int:stream_id>', methods=['DELETE'])
@token_required
@handle_route_exceptions
def end_stream(stream_id):
    """
    Encerra uma transmissão ao vivo.
    
    Implementa tratamento robusto de exceções e validação de dados.

    Args:
        stream_id (int): ID do stream.

    Returns:
        JSON: Confirmação de encerramento ou erro 404.
    """
    user_id = request.current_user.get('id')

    success = live_streaming_service.end_stream(
        stream_id=stream_id,
        user_id=user_id
    )

    if not success:
        raise NotFoundError('Stream não encontrado ou não autorizado')

    return jsonify({
        'success': True,
        'message': 'Stream encerrado com sucesso'
    }), 200

@live_streaming_bp.route('/<int:stream_id>/join', methods=['POST'])
@token_required
@handle_route_exceptions
def join_stream(stream_id):
    """
    Entra em um stream ao vivo.
    
    Implementa tratamento robusto de exceções e validação de dados.
    """
    user_id = request.current_user.get('id')

    stream = live_streaming_service.join_stream(
        stream_id=stream_id,
        user_id=user_id
    )

    if not stream:
        raise NotFoundError('Stream não encontrado')

    return jsonify({
        'success': True,
        'stream': stream,
        'message': 'Entrou no stream com sucesso'
    }), 200

@live_streaming_bp.route('/<int:stream_id>/leave', methods=['POST'])
@token_required
@handle_route_exceptions
def leave_stream(stream_id):
    """
    Sai de um stream ao vivo.
    
    Implementa tratamento robusto de exceções e validação de dados.
    """
    user_id = request.current_user.get('id')

    success = live_streaming_service.leave_stream(
        stream_id=stream_id,
        user_id=user_id
    )

    if not success:
        raise ValidationError('Erro ao sair do stream')

    return jsonify({
        'success': True,
        'message': 'Saiu do stream com sucesso'
    }), 200

@live_streaming_bp.route('/<int:stream_id>/messages', methods=['POST'])
@token_required
@handle_route_exceptions
def send_message(stream_id):
    """
    Envia mensagem em um stream ao vivo.
    
    Implementa tratamento robusto de exceções e validação de dados.
    """
    user_id = request.current_user.get('id')
    data = request.get_json()

    if 'message' not in data or not data.get('message'):
        raise ValidationError('Mensagem é obrigatória')

    message = live_streaming_service.send_message(
        stream_id=stream_id,
        user_id=user_id,
        message=data['message']
    )

    if not message:
        raise NotFoundError('Stream não encontrado')

    return jsonify({
        'success': True,
        'message': message
    }), 201

@live_streaming_bp.route('/<int:stream_id>/gifts', methods=['POST'])
@token_required
@handle_route_exceptions
def send_gift(stream_id):
    """
    Envia presente em um stream ao vivo.
    
    Implementa tratamento robusto de exceções e validação de dados.
    """
    user_id = request.current_user.get('id')
    data = request.get_json()

    required_fields = ['gift_id', 'gift_name', 'gift_cost']
    for field in required_fields:
        if field not in data:
            raise ValidationError(f'Campo obrigatório: {field}')

    try:
        gift_cost = float(data['gift_cost'])
        if gift_cost < 0:
            raise ValidationError("gift_cost deve ser maior ou igual a 0")
    except (ValueError, TypeError):
        raise ValidationError("gift_cost deve ser um número válido")

    gift = live_streaming_service.send_gift(
        stream_id=stream_id,
        user_id=user_id,
        gift_id=data['gift_id'],
        gift_name=data['gift_name'],
        gift_cost=gift_cost
    )

    if not gift:
        raise NotFoundError('Stream não encontrado')

    return jsonify({
        'success': True,
        'gift': gift
    }), 201

@live_streaming_bp.route('/<int:stream_id>/report', methods=['POST'])
@token_required
@handle_route_exceptions
def report_stream(stream_id):
    """
    Reporta um stream ao vivo.
    
    Implementa tratamento robusto de exceções e validação de dados.
    """
    user_id = request.current_user.get('id')
    data = request.get_json()

    if 'reason' not in data or not data.get('reason'):
        raise ValidationError('Motivo é obrigatório')

    success = live_streaming_service.report_stream(
        stream_id=stream_id,
        user_id=user_id,
        reason=data['reason']
    )

    if not success:
        raise NotFoundError('Stream não encontrado')

    return jsonify({
        'success': True,
        'message': 'Stream reportado com sucesso'
    }), 200

@live_streaming_bp.route('/<int:stream_id>/stats', methods=['GET'])
@token_required
@handle_route_exceptions
def get_stream_stats(stream_id):
    """
    Obtém estatísticas de um stream.
    
    Implementa tratamento robusto de exceções e validação de dados.
    """
    stats = live_streaming_service.get_stream_stats(stream_id)

    if not stats:
        raise NotFoundError('Stream não encontrado')

    return jsonify({
        'success': True,
        'stats': stats
    }), 200
