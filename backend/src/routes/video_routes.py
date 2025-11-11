"""
Rotas para gerenciamento de vídeos
Upload, download, analytics e gerenciamento de vídeos
"""

import os
import logging
from flask import Blueprint, request, jsonify
from middleware.auth import token_required
from services.video_upload_service import VideoUploadService
from utils.exception_strategies import handle_route_exceptions
from exceptions.custom_exceptions import ValidationError, NotFoundError, UnauthorizedError, InternalServerError

logger = logging.getLogger(__name__)

# Blueprint para rotas de vídeo
video_bp = Blueprint('video', __name__, url_prefix='/api/video')

# Inicializar serviço de upload
video_service = VideoUploadService()

# Configurações de upload
ALLOWED_EXTENSIONS = {'mp4', 'webm', 'ogg', 'avi', 'mov', '3gp'}

MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB


def allowed_file(filename):
    """
    Verifica se o arquivo tem extensão permitida.

    Args:
        filename (str): Nome do arquivo.

    Returns:
        bool: True se extensão é permitida, False caso contrário.
    """
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@video_bp.route('/upload', methods=['POST'])
@token_required
@handle_route_exceptions
def upload_video():
    """
    Upload de vídeo para Supabase Storage.
    
    Implementa tratamento robusto de exceções e validação de dados.

    Form Data:
        video (file): Arquivo de vídeo (obrigatório).
        stream_id (str): ID do stream relacionado (opcional).
        title (str): Título do vídeo (opcional).
        description (str): Descrição do vídeo (opcional).

    Returns:
        JSON: URL do vídeo uploaded ou erro.
    """
    user_id = request.current_user.get('id')

    # Verificar se arquivo foi enviado
    if 'video' not in request.files:
        raise ValidationError('Nenhum arquivo de vídeo enviado')

    file = request.files['video']

    # Verificar se arquivo foi selecionado
    if file.filename == '':
        raise ValidationError('Nenhum arquivo selecionado')

    # Verificar extensão
    if not allowed_file(file.filename):
        raise ValidationError(f'Extensão não permitida. Use: {", ".join(ALLOWED_EXTENSIONS)}')

    # Verificar tamanho do arquivo
    file.seek(0, os.SEEK_END)
    file_size = file.tell()
    file.seek(0)

    if file_size > MAX_FILE_SIZE:
        raise ValidationError(f'Arquivo muito grande. Máximo: {MAX_FILE_SIZE // (1024*1024)}MB')

    # Obter dados adicionais
    stream_id = request.form.get('stream_id')
    title = request.form.get('title', '')
    description = request.form.get('description', '')

    # Fazer upload
    result = video_service.upload_video(file, user_id, stream_id)

    if not result.get('success'):
        raise InternalServerError(result.get('error', 'Erro ao fazer upload do vídeo'))

    # Adicionar metadados adicionais se fornecidos
    if title or description:
        video_id = result.get('video_id') or result.get('data', {}).get('id')
        if video_id:
            metadata_result = video_service.update_video_metadata(
                video_id,
                user_id,
                title=title if title else None,
                description=description if description else None
            )
            if metadata_result.get('success'):
                # Atualizar resultado com metadados
                result['metadata'] = metadata_result.get('data', {})
            else:
                logger.warning(f"Erro ao salvar metadados: {metadata_result.get('error')}")

    return jsonify({
        'success': True,
        'message': 'Vídeo enviado com sucesso',
        'data': result
    }), 201

@video_bp.route('/<video_id>', methods=['GET'])
@token_required
@handle_route_exceptions
def get_video(video_id):
    """
    Obtém informações de um vídeo específico.
    
    Implementa tratamento robusto de exceções e validação de dados.
    """
    if not video_id:
        raise ValidationError("video_id é obrigatório")
    
    user_id = request.current_user.get('id')

    video = video_service.get_video_by_id(video_id)

    if not video:
        raise NotFoundError('Vídeo não encontrado')

    # Verificar se usuário pode acessar o vídeo
    if video.get('user_id') != user_id:
        raise UnauthorizedError('Acesso negado')

    return jsonify({
        'success': True,
        'data': video
    }), 200

@video_bp.route('/user/<user_id>', methods=['GET'])
@token_required
@handle_route_exceptions
def get_user_videos(user_id):
    """
    Obtém vídeos de um usuário específico.
    
    Implementa tratamento robusto de exceções e validação de dados.
    """
    if not user_id:
        raise ValidationError("user_id é obrigatório")
    
    current_user_id = request.current_user.get('id')

    # Verificar se usuário pode acessar os vídeos
    if current_user_id != user_id:
        raise UnauthorizedError('Acesso negado')

    # Parâmetros de paginação
    try:
        page = int(request.args.get('page', 1))
        if page < 1:
            raise ValidationError("page deve ser maior que 0")
    except (ValueError, TypeError):
        raise ValidationError("page deve ser um número válido")
    
    try:
        limit = int(request.args.get('limit', 20))
        if limit < 1 or limit > 100:
            raise ValidationError("limit deve estar entre 1 e 100")
    except (ValueError, TypeError):
        raise ValidationError("limit deve ser um número válido")
    
    offset = (page - 1) * limit

    videos = video_service.get_user_videos(user_id, limit, offset)

    return jsonify({
        'success': True,
        'data': videos,
        'pagination': {
            'page': page,
            'limit': limit,
            'total': len(videos)
        }
    }), 200

@video_bp.route('/<video_id>', methods=['DELETE'])
@token_required
@handle_route_exceptions
def delete_video(video_id):
    """
    Deleta um vídeo.
    
    Implementa tratamento robusto de exceções e validação de dados.
    """
    if not video_id:
        raise ValidationError("video_id é obrigatório")
    
    user_id = request.current_user.get('id')

    success = video_service.delete_video(video_id, user_id)

    if not success:
        raise NotFoundError('Vídeo não encontrado ou acesso negado')

    return jsonify({
        'success': True,
        'message': 'Vídeo deletado com sucesso'
    }), 200

@video_bp.route('/<video_id>/analytics', methods=['GET'])
@token_required
@handle_route_exceptions
def get_video_analytics(video_id):
    """
    Obtém analytics de um vídeo.
    
    Implementa tratamento robusto de exceções e validação de dados.
    """
    if not video_id:
        raise ValidationError("video_id é obrigatório")
    
    user_id = request.current_user.get('id')

    # Verificar se vídeo existe e usuário tem acesso
    video = video_service.get_video_by_id(video_id)
    if not video or video.get('user_id') != user_id:
        raise NotFoundError('Vídeo não encontrado ou acesso negado')

    analytics = video_service.get_video_analytics(video_id)

    return jsonify({
        'success': True,
        'data': analytics
    }), 200

@video_bp.route('/<video_id>/url', methods=['GET'])
@token_required
@handle_route_exceptions
def get_video_url(video_id):
    """
    Obtém URL pública do vídeo.
    
    Implementa tratamento robusto de exceções e validação de dados.
    """
    if not video_id:
        raise ValidationError("video_id é obrigatório")
    
    user_id = request.current_user.get('id')

    video = video_service.get_video_by_id(video_id)

    if not video:
        raise NotFoundError('Vídeo não encontrado')

    # Verificar se usuário pode acessar o vídeo
    if video.get('user_id') != user_id:
        raise UnauthorizedError('Acesso negado')

    url = video_service.generate_presigned_url(video_id, user_id)

    return jsonify({
        'success': True,
        'data': {
            'video_url': url,
            'video_id': video_id
        }
    }), 200

@video_bp.route('/setup-storage', methods=['POST'])
@token_required
@handle_route_exceptions
def setup_storage():
    """
    Configura bucket de storage (apenas para admin).
    
    Implementa tratamento robusto de exceções e validação de dados.
    """
    user_id = request.current_user.get('id')

    # Aqui você poderia verificar se o usuário é admin
    # Por enquanto, permitimos para qualquer usuário autenticado

    success = video_service.create_bucket_if_not_exists()

    if not success:
        raise InternalServerError('Erro ao configurar storage')

    return jsonify({
        'success': True,
        'message': 'Storage configurado com sucesso'
    }), 200
