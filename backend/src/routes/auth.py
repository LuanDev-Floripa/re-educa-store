"""
Rotas de autenticação RE-EDUCA Store.

Gerencia autenticação e autorização de usuários incluindo:
- Registro de novos usuários
- Login e logout
- Renovação de tokens
- Recuperação de senha
- Verificação de email
"""
from flask import Blueprint, request, jsonify
from services.auth_service import AuthService
from utils.decorators import validate_json, log_activity
from utils.rate_limit_helper import rate_limit
from utils.validators import user_validator
from middleware.logging import log_user_activity, log_security_event

auth_bp = Blueprint('auth', __name__)
auth_service = AuthService()

@auth_bp.route('/register', methods=['POST'])
@rate_limit("5 per minute")
@validate_json('name', 'email', 'password')
def register():
    """
    Registra novo usuário.

    Request Body:
        name (str): Nome completo do usuário.
        email (str): Email válido.
        password (str): Senha (mínimo 8 caracteres).

    Returns:
        JSON: Usuário criado com token de acesso ou erro.
    """
    try:
        data = request.get_json()

        # Valida dados
        if not user_validator.validate_registration(data):
            return jsonify({
                'error': 'Dados inválidos',
                'details': user_validator.get_errors()
            }), 400

        # Registra usuário
        result = auth_service.register_user(data)

        if result.get('success'):
            log_user_activity(result['user']['id'], 'user_registered', {
                'email': data['email'],
                'name': data['name']
            })

            return jsonify({
                'message': 'Usuário registrado com sucesso',
                'user': result['user'],
                'token': result['token']
            }), 201
        else:
            return jsonify({'error': result['error']}), 400

    except Exception as e:
        log_security_event('registration_error', details={'error': str(e)})
        return jsonify({'error': 'Erro interno do servidor'}), 500

@auth_bp.route('/login', methods=['POST'])
@rate_limit("5 per minute")
@validate_json('email', 'password')
def login():
    """Autentica usuário"""
    try:
        data = request.get_json()

        # Autentica usuário
        result = auth_service.authenticate_user(data['email'], data['password'])

        if result.get('success'):
            log_user_activity(result['user']['id'], 'user_login', {
                'email': data['email']
            })

            return jsonify({
                'message': 'Login realizado com sucesso',
                'user': result['user'],
                'token': result['token']
            }), 200
        else:
            log_security_event('login_failed', details={
                'email': data['email'],
                'reason': result['error']
            })

            return jsonify({'error': result['error']}), 401

    except Exception as e:
        log_security_event('login_error', details={'error': str(e)})
        return jsonify({'error': 'Erro interno do servidor'}), 500

@auth_bp.route('/refresh', methods=['POST'])
@rate_limit("10 per minute")
@validate_json('refresh_token')
def refresh_token():
    """
    Renova token de acesso.

    Request Body:
        refresh_token (str): Token de renovação válido.

    Returns:
        JSON: Novos tokens de acesso e renovação ou erro.
    """
    try:
        data = request.get_json()
        refresh_token = data['refresh_token']

        result = auth_service.refresh_token(refresh_token)

        if result.get('success'):
            return jsonify({
                'token': result['token'],
                'refresh_token': result['refresh_token']
            }), 200
        else:
            return jsonify({'error': result['error']}), 401

    except Exception:
        return jsonify({'error': 'Erro interno do servidor'}), 500

@auth_bp.route('/logout', methods=['POST'])
@log_activity('user_logout')
def logout():
    """Logout do usuário"""
    try:
        # Em uma implementação completa, invalidaria o token
        return jsonify({'message': 'Logout realizado com sucesso'}), 200
    except Exception:
        return jsonify({'error': 'Erro interno do servidor'}), 500

@auth_bp.route('/forgot-password', methods=['POST'])
@rate_limit("3 per hour")
@validate_json('email')
def forgot_password():
    """Solicita reset de senha"""
    try:
        data = request.get_json()
        email = data['email']

        result = auth_service.forgot_password(email)

        if result.get('success'):
            log_security_event('password_reset_requested', details={'email': email})
            return jsonify({'message': 'Email de reset enviado com sucesso'}), 200
        else:
            return jsonify({'error': result['error']}), 400

    except Exception:
        return jsonify({'error': 'Erro interno do servidor'}), 500

@auth_bp.route('/reset-password', methods=['POST'])
@rate_limit("5 per hour")
@validate_json('token', 'new_password')
def reset_password():
    """Reseta senha com token"""
    try:
        data = request.get_json()

        # Valida nova senha
        password_validation = user_validator.validate_password(data['new_password'])
        if not password_validation['valid']:
            return jsonify({
                'error': 'Senha inválida',
                'details': password_validation['errors']
            }), 400

        result = auth_service.reset_password(data['token'], data['new_password'])

        if result.get('success'):
            log_security_event('password_reset_completed', details={
                'user_id': result.get('user_id')
            })
            return jsonify({'message': 'Senha alterada com sucesso'}), 200
        else:
            return jsonify({'error': result['error']}), 400

    except Exception:
        return jsonify({'error': 'Erro interno do servidor'}), 500

@auth_bp.route('/verify-email', methods=['POST'])
@rate_limit("10 per hour")
@validate_json('token')
def verify_email():
    """Verifica email do usuário"""
    try:
        data = request.get_json()
        token = data['token']

        result = auth_service.verify_email(token)

        if result.get('success'):
            log_user_activity(result['user_id'], 'email_verified')
            return jsonify({'message': 'Email verificado com sucesso'}), 200
        else:
            return jsonify({'error': result['error']}), 400

    except Exception:
        return jsonify({'error': 'Erro interno do servidor'}), 500

@auth_bp.route('/me', methods=['GET'])
def get_current_user():
    """Retorna dados do usuário atual"""
    try:
        # Esta rota requer autenticação
        # Será implementada com o decorator token_required
        return jsonify({'error': 'Não implementado'}), 501
    except Exception:
        return jsonify({'error': 'Erro interno do servidor'}), 500

# Rotas para 2FA
@auth_bp.route('/2fa/setup', methods=['POST'])
@rate_limit("5 per hour")
def setup_two_factor():
    """Configura 2FA para o usuário"""
    # Esta rota requer autenticação
    # Será implementada com o decorator token_required
    return jsonify({'error': 'Não implementado'}), 501

@auth_bp.route('/2fa/verify', methods=['POST'])
@rate_limit("10 per minute")
@validate_json('code')
def verify_two_factor():
    """Verifica código 2FA"""
    # Esta rota requer autenticação
    # Será implementada com o decorator token_required
    return jsonify({'error': 'Não implementado'}), 501

@auth_bp.route('/2fa/enable', methods=['POST'])
@rate_limit("5 per hour")
@validate_json('code')
def enable_two_factor():
    """Habilita 2FA"""
    # Esta rota requer autenticação
    # Será implementada com o decorator token_required
    return jsonify({'error': 'Não implementado'}), 501

@auth_bp.route('/2fa/disable', methods=['POST'])
@rate_limit("5 per hour")
@validate_json('code')
def disable_two_factor():
    """Desabilita 2FA"""
    # Esta rota requer autenticação
    # Será implementada com o decorator token_required
    return jsonify({'error': 'Não implementado'}), 501

@auth_bp.route('/2fa/backup-codes', methods=['GET'])
@rate_limit("10 per hour")
def get_backup_codes():
    """Retorna códigos de backup"""
    # Esta rota requer autenticação
    # Será implementada com o decorator token_required
    return jsonify({'error': 'Não implementado'}), 501

@auth_bp.route('/2fa/regenerate-backup-codes', methods=['POST'])
@rate_limit("5 per hour")
@validate_json('code')
def regenerate_backup_codes():
    """Regenera códigos de backup"""
    # Esta rota requer autenticação
    # Será implementada com o decorator token_required
    return jsonify({'error': 'Não implementado'}), 501
