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
from utils.exception_strategies import handle_route_exceptions
from exceptions.custom_exceptions import ValidationError, UnauthorizedError
from utils.validators import user_validator
from middleware.logging import log_user_activity, log_security_event
from middleware.auth import token_required
import logging

logger = logging.getLogger(__name__)

# Importa JWT Blacklist Service
try:
    from services.jwt_blacklist_service import jwt_blacklist_service
    from config.security import get_token_expiration
    JWT_BLACKLIST_AVAILABLE = True
except ImportError:
    JWT_BLACKLIST_AVAILABLE = False
    logger.warning("JWT Blacklist service not available")

auth_bp = Blueprint('auth', __name__)
auth_service = AuthService()

@auth_bp.route('/register', methods=['POST'])
@rate_limit("5 per minute")
@validate_json('name', 'email', 'password')
@handle_route_exceptions
def register():
    """
    Registra novo usuário.

    Implementa tratamento robusto de exceções e validação de dados.

    Request Body:
        name (str): Nome completo do usuário.
        email (str): Email válido.
        password (str): Senha (mínimo 8 caracteres).

    Returns:
        JSON: Usuário criado com token de acesso ou erro.
    """
    data = request.get_json()

    # Valida dados
    if not user_validator.validate_registration(data):
        errors = user_validator.get_errors()
        raise ValidationError(
            message='Dados inválidos',
            details={'errors': errors}
        )

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
        raise ValidationError(result.get('error', 'Erro ao registrar usuário'))

@auth_bp.route('/login', methods=['POST'])
@rate_limit("5 per minute")
@validate_json('email', 'password')
@handle_route_exceptions
def login():
    """
    Autentica usuário.
    
    Implementa tratamento robusto de exceções e validação de credenciais.
    """
    data = request.get_json()

    if not data.get('email') or not data.get('password'):
        raise ValidationError("Email e senha são obrigatórios")

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
            'reason': result.get('error', 'Credenciais inválidas')
        })
        raise UnauthorizedError(result.get('error', 'Credenciais inválidas'))

@auth_bp.route('/refresh', methods=['POST'])
@rate_limit("10 per minute")
@validate_json('refresh_token')
@handle_route_exceptions
def refresh_token():
    """
    Renova token de acesso.

    Implementa tratamento robusto de exceções e validação de tokens.

    Request Body:
        refresh_token (str): Token de renovação válido.

    Returns:
        JSON: Novos tokens de acesso e renovação ou erro.
    """
    data = request.get_json()
    refresh_token = data.get('refresh_token')

    if not refresh_token:
        raise ValidationError("refresh_token é obrigatório")

    result = auth_service.refresh_token(refresh_token)

    if result.get('success'):
        return jsonify({
            'token': result['token'],
            'refresh_token': result['refresh_token']
        }), 200
    else:
        raise UnauthorizedError(result.get('error', 'Token de renovação inválido'))

@auth_bp.route('/logout', methods=['POST'])
@token_required
@log_activity('user_logout')
@handle_route_exceptions
def logout():
    """
    Faz logout do usuário e revoga o token JWT.
    
    Implementa tratamento robusto de exceções e revogação de tokens.
    Requer token de autenticação no header.
    Adiciona o token à blacklist para impedir reutilização.
    """
    # Extrai token do header
    auth_header = request.headers.get('Authorization', '')
    if not auth_header.startswith('Bearer '):
        raise UnauthorizedError("Token inválido")
    
    token = auth_header[7:]  # Remove 'Bearer '
    
    # Revoga token usando JWT Blacklist
    if JWT_BLACKLIST_AVAILABLE:
        try:
            expires_at = get_token_expiration(token)
            if expires_at:
                jwt_blacklist_service.revoke_token(token, expires_at)
                logger.info(f"Token revogado para usuário {request.current_user.get('id', 'unknown')}")
            else:
                logger.warning("Não foi possível obter expiração do token")
        except (AttributeError, KeyError, ValueError, TypeError) as e:
            logger.error(f"Erro ao revogar token: {str(e)}")
            # Continua com logout mesmo se blacklist falhar
        except (ConnectionError, TimeoutError, OSError) as e:
            # Captura exceções de conexão/rede do blacklist service
            logger.error(f"Erro de conexão ao revogar token: {str(e)}")
            # Continua com logout mesmo se blacklist falhar
    else:
        logger.warning("JWT Blacklist não disponível")
    
    # Log de segurança
    if hasattr(request, 'current_user') and request.current_user:
        log_security_event('logout_success', details={
            'user_id': request.current_user.get('id')
        })
    
    return jsonify({
        'message': 'Logout realizado com sucesso',
        'token_revoked': JWT_BLACKLIST_AVAILABLE
    }), 200

@auth_bp.route('/forgot-password', methods=['POST'])
@rate_limit("3 per hour")
@validate_json('email')
@handle_route_exceptions
def forgot_password():
    """
    Solicita reset de senha.
    
    Implementa tratamento robusto de exceções e validação de email.
    """
    data = request.get_json()
    email = data.get('email')

    if not email:
        raise ValidationError("Email é obrigatório")

    result = auth_service.forgot_password(email)

    if result.get('success'):
        log_security_event('password_reset_requested', details={'email': email})
        return jsonify({'message': 'Email de reset enviado com sucesso'}), 200
    else:
        raise ValidationError(result.get('error', 'Erro ao solicitar reset de senha'))

@auth_bp.route('/reset-password', methods=['POST'])
@rate_limit("5 per hour")
@validate_json('token', 'new_password')
@handle_route_exceptions
def reset_password():
    """
    Reseta senha com token.
    
    Implementa tratamento robusto de exceções e validação de senha.
    """
    data = request.get_json()

    if not data.get('token'):
        raise ValidationError("Token é obrigatório")
    
    if not data.get('new_password'):
        raise ValidationError("Nova senha é obrigatória")

    # Valida nova senha
    password_validation = user_validator.validate_password(data['new_password'])
    if not password_validation['valid']:
        raise ValidationError(
            message='Senha inválida',
            details={'errors': password_validation['errors']}
        )

    result = auth_service.reset_password(data['token'], data['new_password'])

    if result.get('success'):
        log_security_event('password_reset_completed', details={
            'user_id': result.get('user_id')
        })
        return jsonify({'message': 'Senha alterada com sucesso'}), 200
    else:
        raise ValidationError(result.get('error', 'Erro ao resetar senha'))

@auth_bp.route('/verify-email', methods=['POST'])
@rate_limit("10 per hour")
@validate_json('token')
@handle_route_exceptions
def verify_email():
    """
    Verifica email do usuário.
    
    Implementa tratamento robusto de exceções e validação de token.
    """
    data = request.get_json()
    token = data.get('token')

    if not token:
        raise ValidationError("Token é obrigatório")

    result = auth_service.verify_email(token)

    if result.get('success'):
        log_user_activity(result['user_id'], 'email_verified')
        return jsonify({'message': 'Email verificado com sucesso'}), 200
    else:
        raise ValidationError(result.get('error', 'Token de verificação inválido'))

@auth_bp.route('/me', methods=['GET'])
@token_required
@rate_limit("60 per minute")
@handle_route_exceptions
def get_current_user():
    """
    Retorna dados do usuário atual.
    
    Implementa tratamento robusto de exceções e retorna dados do usuário autenticado.
    """
    # Esta rota requer autenticação
    # Por enquanto retorna dados básicos do usuário autenticado
    user = request.current_user
    return jsonify({
        'id': user.get('id'),
        'email': user.get('email'),
        'name': user.get('name'),
        'is_verified': user.get('is_verified', False)
    }), 200

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
