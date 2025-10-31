"""
Rotas para gerenciamento de vídeos
Upload, download, analytics e gerenciamento de vídeos
"""

import os
import logging
from flask import Blueprint, request, jsonify, current_app
from middleware.auth import token_required
from werkzeug.utils import secure_filename
from services.video_upload_service import VideoUploadService
from utils.decorators import handle_exceptions

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
@handle_exceptions
def upload_video():
    """
    Upload de vídeo para Supabase Storage.
    
    Form Data:
        video (file): Arquivo de vídeo (obrigatório).
        stream_id (str): ID do stream relacionado (opcional).
        title (str): Título do vídeo (opcional).
        description (str): Descrição do vídeo (opcional).
        
    Returns:
        JSON: URL do vídeo uploaded ou erro.
    """
    try:
        user_id = request.current_user.get('id')
        
        # Verificar se arquivo foi enviado
        if 'video' not in request.files:
            return jsonify({
                'success': False,
                'error': 'Nenhum arquivo de vídeo enviado'
            }), 400
        
        file = request.files['video']
        
        # Verificar se arquivo foi selecionado
        if file.filename == '':
            return jsonify({
                'success': False,
                'error': 'Nenhum arquivo selecionado'
            }), 400
        
        # Verificar extensão
        if not allowed_file(file.filename):
            return jsonify({
                'success': False,
                'error': f'Extensão não permitida. Use: {", ".join(ALLOWED_EXTENSIONS)}'
            }), 400
        
        # Verificar tamanho do arquivo
        file.seek(0, os.SEEK_END)
        file_size = file.tell()
        file.seek(0)
        
        if file_size > MAX_FILE_SIZE:
            return jsonify({
                'success': False,
                'error': f'Arquivo muito grande. Máximo: {MAX_FILE_SIZE // (1024*1024)}MB'
            }), 400
        
        # Obter dados adicionais
        stream_id = request.form.get('stream_id')
        title = request.form.get('title', '')
        description = request.form.get('description', '')
        
        # Fazer upload
        result = video_service.upload_video(file, user_id, stream_id)
        
        if result['success']:
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
        else:
            return jsonify({
                'success': False,
                'error': result['error']
            }), 500
            
    except Exception as e:
        logger.error(f"Erro no upload de vídeo: {e}")
        return jsonify({
            'success': False,
            'error': 'Erro interno do servidor'
        }), 500

@video_bp.route('/<video_id>', methods=['GET'])
@token_required
@handle_exceptions
def get_video(video_id):
    """Obtém informações de um vídeo específico"""
    try:
        user_id = request.current_user.get('id')
        
        video = video_service.get_video_by_id(video_id)
        
        if not video:
            return jsonify({
                'success': False,
                'error': 'Vídeo não encontrado'
            }), 404
        
        # Verificar se usuário pode acessar o vídeo
        if video['user_id'] != user_id:
            return jsonify({
                'success': False,
                'error': 'Acesso negado'
            }), 403
        
        return jsonify({
            'success': True,
            'data': video
        }), 200
        
    except Exception as e:
        logger.error(f"Erro ao obter vídeo: {e}")
        return jsonify({
            'success': False,
            'error': 'Erro interno do servidor'
        }), 500

@video_bp.route('/user/<user_id>', methods=['GET'])
@token_required
@handle_exceptions
def get_user_videos(user_id):
    """Obtém vídeos de um usuário específico"""
    try:
        current_user_id = request.current_user.get('id')
        
        # Verificar se usuário pode acessar os vídeos
        if current_user_id != user_id:
            return jsonify({
                'success': False,
                'error': 'Acesso negado'
            }), 403
        
        # Parâmetros de paginação
        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', 20))
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
        
    except Exception as e:
        logger.error(f"Erro ao obter vídeos do usuário: {e}")
        return jsonify({
            'success': False,
            'error': 'Erro interno do servidor'
        }), 500

@video_bp.route('/<video_id>', methods=['DELETE'])
@token_required
@handle_exceptions
def delete_video(video_id):
    """Deleta um vídeo"""
    try:
        user_id = request.current_user.get('id')
        
        success = video_service.delete_video(video_id, user_id)
        
        if success:
            return jsonify({
                'success': True,
                'message': 'Vídeo deletado com sucesso'
            }), 200
        else:
            return jsonify({
                'success': False,
                'error': 'Vídeo não encontrado ou acesso negado'
            }), 404
            
    except Exception as e:
        logger.error(f"Erro ao deletar vídeo: {e}")
        return jsonify({
            'success': False,
            'error': 'Erro interno do servidor'
        }), 500

@video_bp.route('/<video_id>/analytics', methods=['GET'])
@token_required
@handle_exceptions
def get_video_analytics(video_id):
    """Obtém analytics de um vídeo"""
    try:
        user_id = request.current_user.get('id')
        
        # Verificar se vídeo existe e usuário tem acesso
        video = video_service.get_video_by_id(video_id)
        if not video or video['user_id'] != user_id:
            return jsonify({
                'success': False,
                'error': 'Vídeo não encontrado ou acesso negado'
            }), 404
        
        analytics = video_service.get_video_analytics(video_id)
        
        return jsonify({
            'success': True,
            'data': analytics
        }), 200
        
    except Exception as e:
        logger.error(f"Erro ao obter analytics do vídeo: {e}")
        return jsonify({
            'success': False,
            'error': 'Erro interno do servidor'
        }), 500

@video_bp.route('/<video_id>/url', methods=['GET'])
@token_required
@handle_exceptions
def get_video_url(video_id):
    """Obtém URL pública do vídeo"""
    try:
        user_id = request.current_user.get('id')
        
        video = video_service.get_video_by_id(video_id)
        
        if not video:
            return jsonify({
                'success': False,
                'error': 'Vídeo não encontrado'
            }), 404
        
        # Verificar se usuário pode acessar o vídeo
        if video['user_id'] != user_id:
            return jsonify({
                'success': False,
                'error': 'Acesso negado'
            }), 403
        
        url = video_service.generate_presigned_url(video_id, user_id)
        
        return jsonify({
            'success': True,
            'data': {
                'video_url': url,
                'video_id': video_id
            }
        }), 200
        
    except Exception as e:
        logger.error(f"Erro ao obter URL do vídeo: {e}")
        return jsonify({
            'success': False,
            'error': 'Erro interno do servidor'
        }), 500

@video_bp.route('/setup-storage', methods=['POST'])
@token_required
@handle_exceptions
def setup_storage():
    """Configura bucket de storage (apenas para admin)"""
    try:
        user_id = request.current_user.get('id')
        
        # Aqui você poderia verificar se o usuário é admin
        # Por enquanto, permitimos para qualquer usuário autenticado
        
        success = video_service.create_bucket_if_not_exists()
        
        if success:
            return jsonify({
                'success': True,
                'message': 'Storage configurado com sucesso'
            }), 200
        else:
            return jsonify({
                'success': False,
                'error': 'Erro ao configurar storage'
            }), 500
            
    except Exception as e:
        logger.error(f"Erro ao configurar storage: {e}")
        return jsonify({
            'success': False,
            'error': 'Erro interno do servidor'
        }), 500
