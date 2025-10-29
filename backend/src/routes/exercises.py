"""
Rotas de Exercícios e Treinos RE-EDUCA Store
"""
from flask import Blueprint, request, jsonify
from services.exercise_service import ExerciseService
from utils.decorators import token_required, admin_required, rate_limit, validate_json
from middleware.logging import log_user_activity, log_security_event

exercises_bp = Blueprint('exercises', __name__)
exercise_service = ExerciseService()

@exercises_bp.route('/', methods=['GET'])
@token_required
@rate_limit("30 per minute")
def get_exercises():
    """Lista exercícios com filtros"""
    try:
        category = request.args.get('category')
        difficulty = request.args.get('difficulty')
        equipment = request.args.get('equipment')
        muscle_group = request.args.get('muscle_group')
        page = int(request.args.get('page', 1))
        limit = min(int(request.args.get('limit', 20)), 100)
        
        result = exercise_service.get_exercises(
            category=category,
            difficulty=difficulty,
            equipment=equipment,
            muscle_group=muscle_group,
            page=page,
            limit=limit
        )
        
        if 'error' in result:
            return jsonify({'error': result['error']}), 400
        else:
            return jsonify(result), 200
            
    except Exception as e:
        log_security_event('exercises_list_error', details={'error': str(e)})
        return jsonify({'error': 'Erro interno do servidor'}), 500

@exercises_bp.route('/<exercise_id>', methods=['GET'])
@token_required
@rate_limit("30 per minute")
def get_exercise(exercise_id):
    """Busca exercício por ID"""
    try:
        result = exercise_service.get_exercise_by_id(exercise_id)
        
        if result:
            return jsonify({'exercise': result}), 200
        else:
            return jsonify({'error': 'Exercício não encontrado'}), 404
            
    except Exception as e:
        log_security_event('exercise_get_error', details={'error': str(e)})
        return jsonify({'error': 'Erro interno do servidor'}), 500

@exercises_bp.route('/logs', methods=['POST'])
@token_required
@rate_limit("10 per minute")
@validate_json('exercise_name', 'duration_minutes')
def create_exercise_log():
    """Cria log de exercício"""
    try:
        data = request.get_json()
        user_id = request.current_user['id']
        
        result = exercise_service.create_exercise_log(user_id, data)
        
        if result.get('success'):
            log_user_activity(user_id, 'exercise_logged', {
                'exercise_id': data.get('exercise_id'),
                'duration': data.get('duration_minutes')
            })
            return jsonify(result), 201
        else:
            return jsonify({'error': result['error']}), 400
            
    except Exception as e:
        log_security_event('exercise_log_error', details={'error': str(e)})
        return jsonify({'error': 'Erro interno do servidor'}), 500

@exercises_bp.route('/logs', methods=['GET'])
@token_required
@rate_limit("30 per minute")
def get_exercise_logs():
    """Busca logs de exercícios do usuário"""
    try:
        user_id = request.current_user['id']
        limit = int(request.args.get('limit', 50))
        
        logs = exercise_service.get_exercise_logs(user_id, limit)
        
        return jsonify({'logs': logs}), 200
        
    except Exception as e:
        log_security_event('exercise_logs_error', details={'error': str(e)})
        return jsonify({'error': 'Erro interno do servidor'}), 500

@exercises_bp.route('/categories', methods=['GET'])
@token_required
@rate_limit("30 per minute")
def get_categories():
    """Retorna categorias de exercícios"""
    try:
        categories = exercise_service.get_exercise_categories()
        return jsonify({'categories': categories}), 200
    except Exception as e:
        return jsonify({'error': 'Erro interno do servidor'}), 500

@exercises_bp.route('/difficulty-levels', methods=['GET'])
@token_required
@rate_limit("30 per minute")
def get_difficulty_levels():
    """Retorna níveis de dificuldade"""
    try:
        levels = exercise_service.get_difficulty_levels()
        return jsonify({'levels': levels}), 200
    except Exception as e:
        return jsonify({'error': 'Erro interno do servidor'}), 500

@exercises_bp.route('/muscle-groups', methods=['GET'])
@token_required
@rate_limit("30 per minute")
def get_muscle_groups():
    """Retorna grupos musculares"""
    try:
        groups = exercise_service.get_muscle_groups()
        return jsonify({'groups': groups}), 200
    except Exception as e:
        return jsonify({'error': 'Erro interno do servidor'}), 500