"""
Rotas Administrativas de Moderação Social RE-EDUCA Store.
"""
from flask import Blueprint, request, jsonify
from services.social_moderation_service import SocialModerationService
from utils.decorators import admin_required
from utils.rate_limit_helper import rate_limit
from utils.exception_strategies import handle_route_exceptions
from exceptions.custom_exceptions import ValidationError
import logging

logger = logging.getLogger(__name__)

admin_social_moderation_bp = Blueprint('admin_social_moderation', __name__, url_prefix='/api/admin/social/moderation')
moderation_service = SocialModerationService()

@admin_social_moderation_bp.route('/reports', methods=['GET'])
@admin_required
@rate_limit("100 per hour")
@handle_route_exceptions
def get_reports():
    """
    Busca reports de conteúdo social.
    
    Query Parameters:
        status (str, optional): Filtrar por status (pending, reviewing, approved, rejected, resolved)
        report_type (str, optional): Filtrar por tipo (spam, harassment, inappropriate, fake, other)
        page (int): Página (padrão: 1)
        per_page (int): Itens por página (padrão: 20, máx: 100)
    """
    try:
        page = int(request.args.get('page', 1))
        if page < 1:
            raise ValidationError("page deve ser maior que 0")
    except (ValueError, TypeError):
        raise ValidationError("page deve ser um número válido")
    
    try:
        per_page = min(int(request.args.get('per_page', 20)), 100)
        if per_page < 1 or per_page > 100:
            raise ValidationError("per_page deve estar entre 1 e 100")
    except (ValueError, TypeError):
        raise ValidationError("per_page deve ser um número válido")
    
    status = request.args.get('status')
    report_type = request.args.get('report_type')
    
    result = moderation_service.get_reports(
        status=status,
        report_type=report_type,
        page=page,
        per_page=per_page
    )
    
    return jsonify(result), 200

@admin_social_moderation_bp.route('/reports/<report_id>/resolve', methods=['PUT', 'PATCH'])
@admin_required
@rate_limit("50 per hour")
@handle_route_exceptions
def resolve_report(report_id):
    """
    Resolve um report.
    
    Request Body:
        status (str): Novo status (approved, rejected, resolved)
        resolution_note (str, optional): Nota de resolução
        action_taken (str, optional): Ação tomada (post_deleted, user_banned, etc)
    """
    if not report_id:
        raise ValidationError("report_id é obrigatório")
    
    data = request.get_json() or {}
    status = data.get('status')
    
    if not status:
        raise ValidationError("status é obrigatório")
    
    valid_statuses = ['approved', 'rejected', 'resolved']
    if status not in valid_statuses:
        raise ValidationError(f"status deve ser um dos: {', '.join(valid_statuses)}")
    
    moderator_id = request.current_user.get('id') if hasattr(request, 'current_user') else None
    if not moderator_id:
        raise ValidationError("Moderador não identificado")
    
    result = moderation_service.resolve_report(
        report_id=report_id,
        moderator_id=moderator_id,
        status=status,
        resolution_note=data.get('resolution_note'),
        action_taken=data.get('action_taken')
    )
    
    if not result.get('success'):
        raise ValidationError(result.get('error', 'Erro ao resolver report'))
    
    return jsonify(result), 200

@admin_social_moderation_bp.route('/ban', methods=['POST'])
@admin_required
@rate_limit("20 per hour")
@handle_route_exceptions
def ban_user():
    """
    Bane um usuário.
    
    Request Body:
        user_id (str): ID do usuário a banir
        reason (str): Motivo do ban
        ban_type (str): Tipo de ban (temporary, permanent) - padrão: temporary
        expires_at (str, optional): Data de expiração (ISO format) - obrigatório se temporary
    """
    data = request.get_json()
    if not data:
        raise ValidationError("Dados são obrigatórios")
    
    user_id = data.get('user_id')
    if not user_id:
        raise ValidationError("user_id é obrigatório")
    
    reason = data.get('reason')
    if not reason:
        raise ValidationError("reason é obrigatório")
    
    ban_type = data.get('ban_type', 'temporary')
    if ban_type not in ['temporary', 'permanent']:
        raise ValidationError("ban_type deve ser 'temporary' ou 'permanent'")
    
    expires_at = data.get('expires_at')
    if ban_type == 'temporary' and not expires_at:
        raise ValidationError("expires_at é obrigatório para ban temporário")
    
    moderator_id = request.current_user.get('id') if hasattr(request, 'current_user') else None
    if not moderator_id:
        raise ValidationError("Moderador não identificado")
    
    result = moderation_service.ban_user(
        user_id=user_id,
        moderator_id=moderator_id,
        reason=reason,
        ban_type=ban_type,
        expires_at=expires_at
    )
    
    if not result.get('success'):
        raise ValidationError(result.get('error', 'Erro ao banir usuário'))
    
    return jsonify(result), 200

@admin_social_moderation_bp.route('/unban/<user_id>', methods=['POST'])
@admin_required
@rate_limit("20 per hour")
@handle_route_exceptions
def unban_user(user_id):
    """
    Remove ban de um usuário.
    
    Args:
        user_id (str): ID do usuário
    """
    if not user_id:
        raise ValidationError("user_id é obrigatório")
    
    moderator_id = request.current_user.get('id') if hasattr(request, 'current_user') else None
    if not moderator_id:
        raise ValidationError("Moderador não identificado")
    
    result = moderation_service.unban_user(user_id, moderator_id)
    
    if not result.get('success'):
        raise ValidationError(result.get('error', 'Erro ao desbanir usuário'))
    
    return jsonify(result), 200

@admin_social_moderation_bp.route('/banned', methods=['GET'])
@admin_required
@rate_limit("50 per hour")
@handle_route_exceptions
def get_banned_users():
    """
    Busca usuários banidos.
    
    Query Parameters:
        page (int): Página (padrão: 1)
        per_page (int): Itens por página (padrão: 20, máx: 100)
    """
    try:
        page = int(request.args.get('page', 1))
        if page < 1:
            raise ValidationError("page deve ser maior que 0")
    except (ValueError, TypeError):
        raise ValidationError("page deve ser um número válido")
    
    try:
        per_page = min(int(request.args.get('per_page', 20)), 100)
        if per_page < 1 or per_page > 100:
            raise ValidationError("per_page deve estar entre 1 e 100")
    except (ValueError, TypeError):
        raise ValidationError("per_page deve ser um número válido")
    
    result = moderation_service.get_banned_users(page=page, per_page=per_page)
    
    return jsonify(result), 200

@admin_social_moderation_bp.route('/posts/<post_id>/delete', methods=['DELETE'])
@admin_required
@rate_limit("30 per hour")
@handle_route_exceptions
def delete_post(post_id):
    """
    Deleta um post (moderação).
    
    Request Body:
        reason (str): Motivo da deleção
    """
    if not post_id:
        raise ValidationError("post_id é obrigatório")
    
    data = request.get_json() or {}
    reason = data.get('reason', 'Conteúdo inapropriado')
    
    moderator_id = request.current_user.get('id') if hasattr(request, 'current_user') else None
    if not moderator_id:
        raise ValidationError("Moderador não identificado")
    
    result = moderation_service.delete_post(post_id, moderator_id, reason)
    
    if not result.get('success'):
        raise ValidationError(result.get('error', 'Erro ao deletar post'))
    
    return jsonify(result), 200

@admin_social_moderation_bp.route('/comments/<comment_id>/delete', methods=['DELETE'])
@admin_required
@rate_limit("30 per hour")
@handle_route_exceptions
def delete_comment(comment_id):
    """
    Deleta um comentário (moderação).
    
    Request Body:
        reason (str): Motivo da deleção
    """
    if not comment_id:
        raise ValidationError("comment_id é obrigatório")
    
    data = request.get_json() or {}
    reason = data.get('reason', 'Comentário inapropriado')
    
    moderator_id = request.current_user.get('id') if hasattr(request, 'current_user') else None
    if not moderator_id:
        raise ValidationError("Moderador não identificado")
    
    result = moderation_service.delete_comment(comment_id, moderator_id, reason)
    
    if not result.get('success'):
        raise ValidationError(result.get('error', 'Erro ao deletar comentário'))
    
    return jsonify(result), 200

@admin_social_moderation_bp.route('/history', methods=['GET'])
@admin_required
@rate_limit("50 per hour")
@handle_route_exceptions
def get_moderation_history():
    """
    Busca histórico de moderação.
    
    Query Parameters:
        moderator_id (str, optional): Filtrar por moderador
        target_type (str, optional): Filtrar por tipo (post, comment, user, report)
        page (int): Página (padrão: 1)
        per_page (int): Itens por página (padrão: 20, máx: 100)
    """
    try:
        page = int(request.args.get('page', 1))
        if page < 1:
            raise ValidationError("page deve ser maior que 0")
    except (ValueError, TypeError):
        raise ValidationError("page deve ser um número válido")
    
    try:
        per_page = min(int(request.args.get('per_page', 20)), 100)
        if per_page < 1 or per_page > 100:
            raise ValidationError("per_page deve estar entre 1 e 100")
    except (ValueError, TypeError):
        raise ValidationError("per_page deve ser um número válido")
    
    moderator_id = request.args.get('moderator_id')
    target_type = request.args.get('target_type')
    
    result = moderation_service.get_moderation_history(
        moderator_id=moderator_id,
        target_type=target_type,
        page=page,
        per_page=per_page
    )
    
    return jsonify(result), 200

@admin_social_moderation_bp.route('/stats', methods=['GET'])
@admin_required
@rate_limit("50 per hour")
@handle_route_exceptions
def get_moderation_stats():
    """
    Retorna estatísticas de moderação.
    """
    result = moderation_service.get_moderation_stats()
    
    return jsonify(result), 200
