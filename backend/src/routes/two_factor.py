"""
Rotas de Autenticação de Dois Fatores RE-EDUCA Store.

Gerencia autenticação de dois fatores (2FA/TOTP) incluindo:
- Configuração inicial do 2FA
- Verificação de tokens
- Geração de códigos de backup
- Desativação do 2FA
"""
from flask import Blueprint, request, jsonify
from services.two_factor_service import TwoFactorService
from utils.decorators import token_required, validate_json
from utils.rate_limit_helper import rate_limit
from utils.exception_strategies import handle_route_exceptions
from exceptions.custom_exceptions import ValidationError, NotFoundError, UnauthorizedError, InternalServerError
from middleware.logging import log_user_activity, log_security_event
import logging

logger = logging.getLogger(__name__)

two_factor_bp = Blueprint('two_factor', __name__)
two_factor_service = TwoFactorService()

@two_factor_bp.route('/setup', methods=['POST'])
@token_required
@rate_limit("5 per minute")
@handle_route_exceptions
def setup_2fa():
    """
    Configura 2FA para usuário.
    
    Implementa tratamento robusto de exceções e validação de dados.

    Gera QR code e secret key para configuração do authenticator.

    Returns:
        JSON: QR code URL, secret key e códigos de backup.
    """
    user_id = request.current_user['id']
    user_email = request.current_user['email']

    result = two_factor_service.setup_2fa(user_id, user_email)

    if not result.get('success'):
        raise ValidationError(result.get('error', 'Erro ao configurar 2FA'))

    log_user_activity(user_id, '2fa_setup_initiated')
    return jsonify(result), 200

@two_factor_bp.route('/verify-setup', methods=['POST'])
@token_required
@rate_limit("5 per minute")
@validate_json('token')
@handle_route_exceptions
def verify_2fa_setup():
    """
    Verifica token durante configuração do 2FA.
    
    Implementa tratamento robusto de exceções e validação de dados.
    """
    user_id = request.current_user['id']
    data = request.get_json()
    token = data['token']

    result = two_factor_service.verify_2fa_setup(user_id, token)

    if not result.get('success'):
        log_security_event('2fa_setup_verification_failed', details={
            'user_id': user_id,
            'reason': result.get('error')
        })
        raise ValidationError(result.get('error', 'Token inválido'))

    log_user_activity(user_id, '2fa_setup_completed')
    return jsonify(result), 200

@two_factor_bp.route('/verify', methods=['POST'])
@rate_limit("10 per minute")
@validate_json('user_id', 'token')
@handle_route_exceptions
def verify_2fa_token():
    """
    Verifica token 2FA durante login.
    
    Implementa tratamento robusto de exceções e validação de dados.
    """
    data = request.get_json()
    user_id = data['user_id']
    token = data['token']

    result = two_factor_service.verify_2fa_token(user_id, token)

    if not result.get('success'):
        log_security_event('2fa_verification_failed', details={
            'user_id': user_id,
            'reason': result.get('error')
        })
        raise ValidationError(result.get('error', 'Token inválido'))

    log_user_activity(user_id, '2fa_verification_success')
    return jsonify(result), 200


@two_factor_bp.route('/status', methods=['GET'])
@token_required
@handle_route_exceptions
def get_2fa_status():
    """
    Retorna status do 2FA do usuário.
    
    Implementa tratamento robusto de exceções e validação de dados.
    """
    user_id = request.current_user['id']

    result = two_factor_service.get_2fa_status(user_id)

    return jsonify(result), 200

@two_factor_bp.route('/regenerate-backup-codes', methods=['POST'])
@token_required
@rate_limit("3 per hour")
@handle_route_exceptions
def regenerate_backup_codes():
    """
    Regenera códigos de backup.
    
    Implementa tratamento robusto de exceções e validação de dados.
    """
    user_id = request.current_user['id']

    result = two_factor_service.regenerate_backup_codes(user_id)

    if not result.get('success'):
        raise ValidationError(result.get('error', 'Erro ao regenerar códigos de backup'))

    log_user_activity(user_id, '2fa_backup_codes_regenerated')
    return jsonify(result), 200
