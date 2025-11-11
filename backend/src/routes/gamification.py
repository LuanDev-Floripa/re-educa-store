"""
Rotas de Gamificação RE-EDUCA Store.

Gerencia endpoints de gamificação incluindo:
- Estatísticas do usuário
- Desafios
- Conquistas
- Recompensas
"""

import logging

from flask import Blueprint, jsonify, request
from services.gamification_service import GamificationService
from utils.decorators import token_required
from utils.rate_limit_helper import rate_limit
from utils.exception_strategies import handle_route_exceptions
from exceptions.custom_exceptions import ValidationError, NotFoundError, UnauthorizedError, InternalServerError

logger = logging.getLogger(__name__)

gamification_bp = Blueprint("gamification", __name__)
gamification_service = GamificationService()


@gamification_bp.route("/stats", methods=["GET"])
@token_required
@rate_limit("30 per minute")
@handle_route_exceptions
def get_user_stats():
    """
    Retorna estatísticas de gamificação do usuário autenticado.
    
    Implementa tratamento robusto de exceções e validação de dados.

    Returns:
        JSON: Estatísticas do usuário
    """
    user_id = request.current_user.get("id")
    if not user_id:
        raise UnauthorizedError("Usuário não autenticado")

    stats = gamification_service.get_user_stats(user_id)
    return jsonify(stats), 200


@gamification_bp.route("/challenges", methods=["GET"])
@token_required
@rate_limit("30 per minute")
@handle_route_exceptions
def get_challenges():
    """
    Retorna lista de desafios disponíveis.
    
    Implementa tratamento robusto de exceções e validação de dados.

    Returns:
        JSON: Lista de desafios
    """
    user_id = request.current_user.get("id")
    if not user_id:
        raise UnauthorizedError("Usuário não autenticado")

    challenges = gamification_service.get_challenges(user_id)
    return jsonify({"challenges": challenges, "total": len(challenges)}), 200


@gamification_bp.route("/challenges/<challenge_id>/start", methods=["POST"])
@token_required
@rate_limit("10 per minute")
@handle_route_exceptions
def start_challenge(challenge_id):
    """
    Inicia um desafio para o usuário autenticado.
    
    Implementa tratamento robusto de exceções e validação de dados.

    Args:
        challenge_id (str): ID do desafio

    Returns:
        JSON: Confirmação de início
    """
    if not challenge_id:
        raise ValidationError("challenge_id é obrigatório")
    
    user_id = request.current_user.get("id")
    if not user_id:
        raise UnauthorizedError("Usuário não autenticado")

    result = gamification_service.start_challenge(user_id, challenge_id)

    if not result.get("success"):
        raise ValidationError(result.get("error", "Erro ao iniciar desafio"))

    return jsonify(result), 200


@gamification_bp.route("/challenges/<challenge_id>/complete", methods=["POST"])
@token_required
@rate_limit("10 per minute")
@handle_route_exceptions
def complete_challenge(challenge_id):
    """
    Completa um desafio para o usuário autenticado.
    
    Implementa tratamento robusto de exceções e validação de dados.

    Args:
        challenge_id (str): ID do desafio

    Returns:
        JSON: Confirmação de conclusão com pontos ganhos
    """
    if not challenge_id:
        raise ValidationError("challenge_id é obrigatório")
    
    user_id = request.current_user.get("id")
    if not user_id:
        raise UnauthorizedError("Usuário não autenticado")

    result = gamification_service.complete_challenge(user_id, challenge_id)

    if not result.get("success"):
        raise ValidationError(result.get("error", "Erro ao completar desafio"))

    return jsonify(result), 200


@gamification_bp.route("/rewards/<reward_id>/claim", methods=["POST"])
@token_required
@rate_limit("10 per minute")
@handle_route_exceptions
def claim_reward(reward_id):
    """
    Reivindica uma recompensa.
    
    Implementa tratamento robusto de exceções e validação de dados.

    Args:
        reward_id (str): ID da recompensa

    Returns:
        JSON: Confirmação de reivindicação
    """
    if not reward_id:
        raise ValidationError("reward_id é obrigatório")
    
    user_id = request.current_user.get("id")
    if not user_id:
        raise UnauthorizedError("Usuário não autenticado")

    result = gamification_service.claim_reward(user_id, reward_id)

    if not result.get("success"):
        raise ValidationError(result.get("error", "Erro ao reivindicar recompensa"))

    return jsonify(result), 200


@gamification_bp.route("/leaderboard", methods=["GET"])
@rate_limit("30 per minute")
@handle_route_exceptions
def get_leaderboard():
    """
    Retorna leaderboard de usuários por pontos.
    
    Implementa tratamento robusto de exceções e validação de dados.

    Query Parameters:
        limit (int): Número de usuários a retornar (padrão: 10, máximo: 100)

    Returns:
        JSON: Lista de usuários ordenados por pontos
    """
    try:
        limit = int(request.args.get('limit', 10))
        if limit < 1:
            limit = 10
        if limit > 100:
            limit = 100
    except (ValueError, TypeError):
        limit = 10

    leaderboard = gamification_service.get_leaderboard(limit)
    return jsonify({"leaderboard": leaderboard, "total": len(leaderboard)}), 200


@gamification_bp.route("/rewards", methods=["GET"])
@token_required
@rate_limit("30 per minute")
@handle_route_exceptions
def get_available_rewards():
    """
    Retorna lista de recompensas disponíveis.
    
    Implementa tratamento robusto de exceções e validação de dados.

    Returns:
        JSON: Lista de recompensas disponíveis
    """
    user_id = request.current_user.get("id")
    if not user_id:
        raise UnauthorizedError("Usuário não autenticado")

    rewards = gamification_service.get_available_rewards(user_id)
    return jsonify({"rewards": rewards, "total": len(rewards)}), 200
