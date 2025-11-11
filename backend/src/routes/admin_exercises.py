"""
Rotas Administrativas de Exercícios e Planos RE-EDUCA Store.
"""
from flask import Blueprint, request, jsonify
from services.exercise_service import ExerciseService
from utils.decorators import admin_required
from utils.rate_limit_helper import rate_limit
from utils.exception_strategies import handle_route_exceptions
from exceptions.custom_exceptions import ValidationError
import logging

logger = logging.getLogger(__name__)

admin_exercises_bp = Blueprint('admin_exercises', __name__, url_prefix='/api/admin/exercises')
exercise_service = ExerciseService()

@admin_exercises_bp.route('', methods=['GET'])
@admin_required
@rate_limit("100 per hour")
@handle_route_exceptions
def get_all_exercises():
    """
    Busca todos os exercícios (admin).
    
    Query Parameters:
        category (str, optional): Filtrar por categoria
        difficulty (str, optional): Filtrar por dificuldade
        page (int): Página (padrão: 1)
        limit (int): Limite (padrão: 50, máx: 100)
    """
    try:
        page = int(request.args.get('page', 1))
        if page < 1:
            raise ValidationError("page deve ser maior que 0")
    except (ValueError, TypeError):
        raise ValidationError("page deve ser um número válido")
    
    try:
        limit = min(int(request.args.get('limit', 50)), 100)
        if limit < 1:
            raise ValidationError("limit deve ser maior que 0")
    except (ValueError, TypeError):
        raise ValidationError("limit deve ser um número válido")
    
    category = request.args.get('category')
    difficulty = request.args.get('difficulty')
    equipment = request.args.get('equipment')
    muscle_group = request.args.get('muscle_group')
    
    result = exercise_service.get_exercises(
        category=category,
        difficulty=difficulty,
        equipment=equipment,
        muscle_group=muscle_group,
        page=page,
        limit=limit
    )
    
    return jsonify(result), 200

@admin_exercises_bp.route('', methods=['POST'])
@admin_required
@rate_limit("20 per hour")
@handle_route_exceptions
def create_exercise():
    """
    Cria um novo exercício (admin).
    
    Request Body:
        name (str): Nome do exercício
        description (str): Descrição
        category (str): Categoria
        difficulty (str): Dificuldade
        equipment (str): Equipamento necessário
        muscle_group (str): Grupo muscular
        instructions (str): Instruções
        image_url (str, optional): URL da imagem
    """
    data = request.get_json()
    if not data:
        raise ValidationError("Dados são obrigatórios")
    
    if not data.get('name'):
        raise ValidationError("name é obrigatório")
    
    # Criar exercício usando service (precisa de método admin)
    # Por enquanto, usar método existente se disponível
    result = exercise_service.create_exercise(data)
    
    if result.get('success'):
        return jsonify(result), 201
    else:
        raise ValidationError(result.get('error', 'Erro ao criar exercício'))

@admin_exercises_bp.route('/<exercise_id>', methods=['PUT', 'PATCH'])
@admin_required
@rate_limit("30 per hour")
@handle_route_exceptions
def update_exercise(exercise_id):
    """
    Atualiza um exercício (admin).
    """
    if not exercise_id:
        raise ValidationError("exercise_id é obrigatório")
    
    data = request.get_json()
    if not data:
        raise ValidationError("Dados são obrigatórios")
    
    result = exercise_service.update_exercise(exercise_id, data)
    
    if result.get('success'):
        return jsonify(result), 200
    else:
        raise ValidationError(result.get('error', 'Erro ao atualizar exercício'))

@admin_exercises_bp.route('/<exercise_id>', methods=['DELETE'])
@admin_required
@rate_limit("20 per hour")
@handle_route_exceptions
def delete_exercise(exercise_id):
    """
    Deleta um exercício (admin).
    """
    if not exercise_id:
        raise ValidationError("exercise_id é obrigatório")
    
    result = exercise_service.delete_exercise(exercise_id)
    
    if result.get('success'):
        return jsonify(result), 200
    else:
        raise ValidationError(result.get('error', 'Erro ao deletar exercício'))

@admin_exercises_bp.route('/workout-plans', methods=['GET'])
@admin_required
@rate_limit("100 per hour")
@handle_route_exceptions
def get_all_workout_plans():
    """
    Busca todos os planos de treino (admin).
    
    Query Parameters:
        user_id (str, optional): Filtrar por usuário
        is_active (bool, optional): Filtrar por status
        page (int): Página (padrão: 1)
        limit (int): Limite (padrão: 50, máx: 100)
    """
    try:
        page = int(request.args.get('page', 1))
        if page < 1:
            raise ValidationError("page deve ser maior que 0")
    except (ValueError, TypeError):
        raise ValidationError("page deve ser um número válido")
    
    try:
        limit = min(int(request.args.get('limit', 50)), 100)
        if limit < 1:
            raise ValidationError("limit deve ser maior que 0")
    except (ValueError, TypeError):
        raise ValidationError("limit deve ser um número válido")
    
    user_id = request.args.get('user_id')
    is_active = request.args.get('is_active')
    is_public = request.args.get('is_public')
    
    is_active_bool = None if is_active is None else is_active.lower() == 'true'
    is_public_bool = None if is_public is None else is_public.lower() == 'true'
    
    result = exercise_service.get_workout_plans(
        user_id=user_id,
        is_active=is_active_bool,
        is_public=is_public_bool,
        page=page,
        limit=limit
    )
    
    return jsonify(result), 200

@admin_exercises_bp.route('/workout-plans/<plan_id>', methods=['DELETE'])
@admin_required
@rate_limit("20 per hour")
@handle_route_exceptions
def delete_workout_plan(plan_id):
    """
    Deleta um plano de treino (admin).
    """
    if not plan_id:
        raise ValidationError("plan_id é obrigatório")
    
    # Admin pode deletar qualquer plano
    admin_id = request.current_user.get('id') if hasattr(request, 'current_user') else None
    result = exercise_service.delete_workout_plan(plan_id, admin_id, is_admin=True)
    
    if result.get('success'):
        return jsonify(result), 200
    else:
        raise ValidationError(result.get('error', 'Erro ao deletar plano'))

@admin_exercises_bp.route('/stats', methods=['GET'])
@admin_required
@rate_limit("50 per hour")
@handle_route_exceptions
def get_exercises_stats():
    """
    Retorna estatísticas de exercícios e planos.
    """
    try:
        # Contar exercícios por categoria
        categories = exercise_service.get_exercise_categories()
        exercises_by_category = {}
        for category in categories:
            result = exercise_service.get_exercises(category=category, page=1, limit=1)
            exercises_by_category[category] = result.get('total', 0) if isinstance(result, dict) else 0
        
        # Contar planos
        plans_result = exercise_service.get_workout_plans(page=1, limit=1)
        total_plans = plans_result.get('total', 0) if isinstance(plans_result, dict) else 0
        
        return jsonify({
            "success": True,
            "stats": {
                "total_exercises": sum(exercises_by_category.values()),
                "exercises_by_category": exercises_by_category,
                "total_workout_plans": total_plans,
                "categories": categories,
            }
        }), 200
    except Exception as e:
        logger.error(f"Erro ao buscar estatísticas: {str(e)}", exc_info=True)
        return jsonify({"success": False, "error": str(e), "stats": {}}), 500
