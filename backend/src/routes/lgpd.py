# -*- coding: utf-8 -*-
"""
Rotas de Compliance LGPD RE-EDUCA Store.

Endpoints para:
- Consentimentos
- Exportação de dados
- Exclusão de conta
- Auditoria de acesso
"""
from flask import Blueprint, request, jsonify
from utils.decorators import token_required, handle_exceptions
from services.lgpd_service import LGPDService
from exceptions.custom_exceptions import ValidationError
import logging

logger = logging.getLogger(__name__)

lgpd_bp = Blueprint('lgpd', __name__, url_prefix='/api/lgpd')

lgpd_service = LGPDService()


# ============================================================
# CONSENTIMENTOS
# ============================================================

@lgpd_bp.route('/consents', methods=['GET'])
@token_required
@handle_exceptions
def get_consents():
    """Retorna consentimentos do usuário"""
    user_id = request.current_user['id']
    result = lgpd_service.get_user_consents(user_id)

    if result['success']:
        return jsonify(result), 200
    else:
        return jsonify({'error': result.get('error', 'Erro ao buscar consentimentos')}), 500


@lgpd_bp.route('/consents', methods=['POST'])
@token_required
@handle_exceptions
def grant_consent():
    """Registra consentimento do usuário"""
    user_id = request.current_user['id']
    data = request.get_json() or {}

    consent_type = data.get('consent_type')
    if not consent_type:
        raise ValidationError("consent_type é obrigatório")

    result = lgpd_service.grant_consent(
        user_id=user_id,
        consent_type=consent_type,
        consent_text=data.get('consent_text'),
        version=data.get('version'),
        ip_address=request.remote_addr,
        user_agent=request.headers.get('User-Agent')
    )

    if result['success']:
        return jsonify(result), 200
    else:
        return jsonify({'error': result.get('error')}), 500


@lgpd_bp.route('/consents/<consent_type>', methods=['DELETE'])
@token_required
@handle_exceptions
def revoke_consent(consent_type: str):
    """Revoga consentimento do usuário"""
    user_id = request.current_user['id']
    result = lgpd_service.revoke_consent(user_id, consent_type)

    if result['success']:
        return jsonify(result), 200
    else:
        return jsonify({'error': result.get('error')}), 500


# ============================================================
# EXPORTAÇÃO DE DADOS
# ============================================================

@lgpd_bp.route('/export', methods=['POST'])
@token_required
@handle_exceptions
def export_data():
    """
    Exporta dados do usuário (LGPD).

    Request Body:
        data_types (list): Tipos de dados ['all'] ou específicos
        format (str): 'json', 'csv', 'pdf'
    """
    user_id = request.current_user['id']
    data = request.get_json() or {}

    data_types = data.get('data_types', ['all'])
    format = data.get('format', 'json')

    if format not in ['json', 'csv', 'pdf']:
        raise ValidationError("format deve ser 'json', 'csv' ou 'pdf'")

    result = lgpd_service.export_user_data(
        user_id=user_id,
        data_types=data_types,
        format=format
    )

    if result['success']:
        return jsonify(result), 200
    else:
        return jsonify({'error': result.get('error')}), 500


# ============================================================
# EXCLUSÃO DE CONTA
# ============================================================

@lgpd_bp.route('/delete-account', methods=['POST'])
@token_required
@handle_exceptions
def delete_account():
    """
    Exclui ou anonimiza conta do usuário (LGPD).

    Request Body:
        deletion_type (str): 'full', 'partial', 'anonymize'
        reason (str): Motivo da exclusão (opcional)
    """
    user_id = request.current_user['id']
    data = request.get_json() or {}

    deletion_type = data.get('deletion_type', 'anonymize')
    if deletion_type not in ['full', 'partial', 'anonymize']:
        raise ValidationError("deletion_type deve ser 'full', 'partial' ou 'anonymize'")

    # Confirmação dupla
    confirm = data.get('confirm', False)
    if not confirm:
        raise ValidationError("Confirmação necessária. Envie confirm: true")

    result = lgpd_service.delete_user_account(
        user_id=user_id,
        deletion_type=deletion_type,
        reason=data.get('reason'),
        requested_by=user_id,
        ip_address=request.remote_addr,
        user_agent=request.headers.get('User-Agent')
    )

    if result['success']:
        return jsonify(result), 200
    else:
        return jsonify({'error': result.get('error')}), 500


# ============================================================
# AUDITORIA
# ============================================================

@lgpd_bp.route('/access-logs', methods=['GET'])
@token_required
@handle_exceptions
def get_access_logs():
    """Retorna logs de acesso aos dados do usuário"""
    user_id = request.current_user['id']

    page = int(request.args.get('page', 1))
    per_page = int(request.args.get('per_page', 20))

    result = lgpd_service.get_access_logs(
        user_id=user_id,
        page=page,
        per_page=per_page
    )

    if result['success']:
        return jsonify(result), 200
    else:
        return jsonify({'error': result.get('error')}), 500
