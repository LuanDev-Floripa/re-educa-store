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
from utils.decorators import token_required, rate_limit, validate_json
from middleware.logging import log_user_activity, log_security_event

two_factor_bp = Blueprint('two_factor', __name__)
two_factor_service = TwoFactorService()

@two_factor_bp.route('/setup', methods=['POST'])
@token_required
@rate_limit("5 per minute")
def setup_2fa():
    """
    Configura 2FA para usuário.
    
    Gera QR code e secret key para configuração do authenticator.
    
    Returns:
        JSON: QR code URL, secret key e códigos de backup.
    """
    try:
        user_id = request.current_user['id']
        user_email = request.current_user['email']
        
        result = two_factor_service.setup_2fa(user_id, user_email)
        
        if result.get('success'):
            log_user_activity(user_id, '2fa_setup_initiated')
            return jsonify(result), 200
        else:
            return jsonify({'error': result['error']}), 400
            
    except Exception as e:
        log_security_event('2fa_setup_error', details={'error': str(e)})
        return jsonify({'error': 'Erro interno do servidor'}), 500

@two_factor_bp.route('/verify-setup', methods=['POST'])
@token_required
@rate_limit("5 per minute")
@validate_json('token')
def verify_2fa_setup():
    """Verifica token durante configuração do 2FA"""
    try:
        user_id = request.current_user['id']
        data = request.get_json()
        token = data['token']
        
        result = two_factor_service.verify_2fa_setup(user_id, token)
        
        if result.get('success'):
            log_user_activity(user_id, '2fa_setup_completed')
            return jsonify(result), 200
        else:
            log_security_event('2fa_setup_verification_failed', details={
                'user_id': user_id,
                'reason': result['error']
            })
            return jsonify({'error': result['error']}), 400
            
    except Exception as e:
        log_security_event('2fa_setup_verification_error', details={'error': str(e)})
        return jsonify({'error': 'Erro interno do servidor'}), 500

@two_factor_bp.route('/verify', methods=['POST'])
@rate_limit("10 per minute")
@validate_json('user_id', 'token')
def verify_2fa_token():
    """Verifica token 2FA durante login"""
    try:
        data = request.get_json()
        user_id = data['user_id']
        token = data['token']
        
        result = two_factor_service.verify_2fa_token(user_id, token)
        
        if result.get('success'):
            log_user_activity(user_id, '2fa_verification_success')
            return jsonify(result), 200
        else:
            log_security_event('2fa_verification_failed', details={
                'user_id': user_id,
                'reason': result['error']
            })
            return jsonify({'error': result['error']}), 400
            
    except Exception as e:
        log_security_event('2fa_verification_error', details={'error': str(e)})
        return jsonify({'error': 'Erro interno do servidor'}), 500

@two_factor_bp.route('/disable', methods=['POST'])
@token_required
@rate_limit("3 per minute")
@validate_json('password')
def disable_2fa():
    """Desabilita 2FA para usuário"""
    try:
        user_id = request.current_user['id']
        data = request.get_json()
        password = data['password']
        
        result = two_factor_service.disable_2fa(user_id, password)
        
        if result.get('success'):
            log_user_activity(user_id, '2fa_disabled')
            return jsonify(result), 200
        else:
            log_security_event('2fa_disable_failed', details={
                'user_id': user_id,
                'reason': result['error']
            })
            return jsonify({'error': result['error']}), 400
            
    except Exception as e:
        log_security_event('2fa_disable_error', details={'error': str(e)})
        return jsonify({'error': 'Erro interno do servidor'}), 500

@two_factor_bp.route('/status', methods=['GET'])
@token_required
def get_2fa_status():
    """Retorna status do 2FA do usuário"""
    try:
        user_id = request.current_user['id']
        
        result = two_factor_service.get_2fa_status(user_id)
        
        return jsonify(result), 200
            
    except Exception as e:
        return jsonify({'error': 'Erro interno do servidor'}), 500

@two_factor_bp.route('/regenerate-backup-codes', methods=['POST'])
@token_required
@rate_limit("3 per hour")
def regenerate_backup_codes():
    """Regenera códigos de backup"""
    try:
        user_id = request.current_user['id']
        
        result = two_factor_service.regenerate_backup_codes(user_id)
        
        if result.get('success'):
            log_user_activity(user_id, '2fa_backup_codes_regenerated')
            return jsonify(result), 200
        else:
            return jsonify({'error': result['error']}), 400
            
    except Exception as e:
        return jsonify({'error': 'Erro interno do servidor'}), 500