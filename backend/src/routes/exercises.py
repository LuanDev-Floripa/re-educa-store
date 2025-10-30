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

# ============================================================
# ROTAS PARA PLANOS DE TREINO
# ============================================================

@exercises_bp.route('/workout-plans', methods=['POST'])
@token_required
@rate_limit("10 per hour")
@validate_json('name', 'difficulty')
def create_workout_plan():
    """Cria um novo plano de treino"""
    try:
        data = request.get_json()
        user_id = request.current_user['id']
        
        result = exercise_service.create_workout_plan(user_id, data)
        
        if result.get('success'):
            log_user_activity(user_id, 'workout_plan_created', {
                'plan_id': result['plan']['id'],
                'name': data['name']
            })
            return jsonify(result), 201
        else:
            return jsonify({'error': result['error']}), 400
            
    except Exception as e:
        log_security_event('workout_plan_create_error', details={'error': str(e)})
        return jsonify({'error': 'Erro interno do servidor'}), 500

@exercises_bp.route('/workout-plans', methods=['GET'])
@token_required
@rate_limit("30 per minute")
def get_workout_plans():
    """Lista planos de treino"""
    try:
        user_id = request.args.get('user_id')
        is_active = request.args.get('is_active')
        is_public = request.args.get('is_public')
        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', 20))
        
        # Se não especificar user_id, usa o usuário atual
        if not user_id:
            user_id = request.current_user['id']
        
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
    except Exception as e:
        return jsonify({'error': 'Erro interno do servidor'}), 500

@exercises_bp.route('/workout-plans/<plan_id>', methods=['GET'])
@token_required
@rate_limit("30 per minute")
def get_workout_plan(plan_id):
    """Busca plano de treino por ID"""
    try:
        plan = exercise_service.get_workout_plan_by_id(plan_id)
        
        if plan:
            return jsonify({'plan': plan}), 200
        else:
            return jsonify({'error': 'Plano não encontrado'}), 404
    except Exception as e:
        return jsonify({'error': 'Erro interno do servidor'}), 500

@exercises_bp.route('/workout-plans/<plan_id>', methods=['PUT'])
@token_required
@rate_limit("10 per hour")
def update_workout_plan(plan_id):
    """Atualiza um plano de treino"""
    try:
        data = request.get_json()
        user_id = request.current_user['id']
        
        result = exercise_service.update_workout_plan(plan_id, user_id, data)
        
        if result.get('success'):
            log_user_activity(user_id, 'workout_plan_updated', {'plan_id': plan_id})
            return jsonify(result), 200
        else:
            return jsonify({'error': result['error']}), 400
    except Exception as e:
        return jsonify({'error': 'Erro interno do servidor'}), 500

@exercises_bp.route('/workout-plans/<plan_id>', methods=['DELETE'])
@token_required
@rate_limit("10 per hour")
def delete_workout_plan(plan_id):
    """Deleta um plano de treino"""
    try:
        user_id = request.current_user['id']
        
        result = exercise_service.delete_workout_plan(plan_id, user_id)
        
        if result.get('success'):
            log_user_activity(user_id, 'workout_plan_deleted', {'plan_id': plan_id})
            return jsonify({'message': 'Plano deletado com sucesso'}), 200
        else:
            return jsonify({'error': result['error']}), 400
    except Exception as e:
        return jsonify({'error': 'Erro interno do servidor'}), 500

# ============================================================
# ROTAS PARA SESSÕES DE TREINO SEMANAL
# ============================================================

@exercises_bp.route('/weekly-sessions', methods=['POST'])
@token_required
@rate_limit("10 per hour")
@validate_json('plan_id', 'start_date')
def create_weekly_sessions():
    """Cria sessões de treino para uma semana"""
    try:
        data = request.get_json()
        user_id = request.current_user['id']
        week_number = data.get('week_number', 1)
        
        result = exercise_service.create_weekly_sessions(
            user_id,
            data['plan_id'],
            data['start_date'],
            week_number
        )
        
        if result.get('success'):
            log_user_activity(user_id, 'weekly_sessions_created', {
                'plan_id': data['plan_id'],
                'week_number': week_number
            })
            return jsonify(result), 201
        else:
            return jsonify({'error': result['error']}), 400
    except Exception as e:
        return jsonify({'error': 'Erro interno do servidor'}), 500

@exercises_bp.route('/weekly-sessions', methods=['GET'])
@token_required
@rate_limit("30 per minute")
def get_weekly_sessions():
    """Busca sessões de treino"""
    try:
        user_id = request.current_user['id']
        plan_id = request.args.get('plan_id')
        week_number = request.args.get('week_number', type=int)
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        
        sessions = exercise_service.get_weekly_sessions(
            user_id,
            plan_id=plan_id,
            week_number=week_number,
            start_date=start_date,
            end_date=end_date
        )
        
        return jsonify({'sessions': sessions}), 200
    except Exception as e:
        return jsonify({'error': 'Erro interno do servidor'}), 500

@exercises_bp.route('/weekly-sessions/<session_id>/status', methods=['PUT'])
@token_required
@rate_limit("20 per hour")
def update_session_status(session_id):
    """Atualiza status de uma sessão"""
    try:
        data = request.get_json()
        user_id = request.current_user['id']
        status = data.get('status')
        duration_minutes = data.get('duration_minutes')
        
        result = exercise_service.update_session_status(
            session_id,
            user_id,
            status,
            duration_minutes
        )
        
        if result.get('success'):
            log_user_activity(user_id, 'session_status_updated', {
                'session_id': session_id,
                'status': status
            })
            return jsonify(result), 200
        else:
            return jsonify({'error': result['error']}), 400
    except Exception as e:
        return jsonify({'error': 'Erro interno do servidor'}), 500

@exercises_bp.route('/weekly-sessions/<session_id>/progress', methods=['POST'])
@token_required
@rate_limit("30 per hour")
@validate_json('exercise_id')
def save_exercise_progress(session_id):
    """Salva progresso de um exercício"""
    try:
        data = request.get_json()
        
        result = exercise_service.save_exercise_progress(
            session_id,
            data['exercise_id'],
            data.get('progress', {})
        )
        
        if result.get('success'):
            return jsonify(result), 201
        else:
            return jsonify({'error': result['error']}), 400
    except Exception as e:
        return jsonify({'error': 'Erro interno do servidor'}), 500