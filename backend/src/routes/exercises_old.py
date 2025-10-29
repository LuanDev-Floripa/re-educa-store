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
        
        if result.get('success'):
            return jsonify(result), 200
        else:
            return jsonify({'error': result['error']}), 400
            
    except Exception as e:
        log_security_event('exercises_list_error', details={'error': str(e)})
        return jsonify({'error': 'Erro interno do servidor'}), 500

@exercises_bp.route('/exercises/<exercise_id>', methods=['GET'])
@token_required
@rate_limit("30 per minute")
def get_exercise(exercise_id):
    """Busca exercício por ID"""
    try:
        result = exercise_service.get_exercise_by_id(exercise_id)
        
        if result.get('success'):
            return jsonify(result), 200
        else:
            return jsonify({'error': result['error']}), 404
            
    except Exception as e:
        log_security_event('exercise_detail_error', details={'error': str(e)})
        return jsonify({'error': 'Erro interno do servidor'}), 500

@exercises_bp.route('/exercises/categories', methods=['GET'])
@token_required
@rate_limit("10 per minute")
def get_exercise_categories():
    """Retorna categorias de exercícios"""
    try:
        result = exercise_service.get_exercise_categories()
        
        if result.get('success'):
            return jsonify(result), 200
        else:
            return jsonify({'error': result['error']}), 400
            
    except Exception as e:
        return jsonify({'error': 'Erro interno do servidor'}), 500

@exercises_bp.route('/exercises/muscle-groups', methods=['GET'])
@token_required
@rate_limit("10 per minute")
def get_muscle_groups():
    """Retorna grupos musculares"""
    try:
        result = exercise_service.get_muscle_groups()
        
        if result.get('success'):
            return jsonify(result), 200
        else:
            return jsonify({'error': result['error']}), 400
            
    except Exception as e:
        return jsonify({'error': 'Erro interno do servidor'}), 500

@exercises_bp.route('/exercises/equipment', methods=['GET'])
@token_required
@rate_limit("10 per minute")
def get_equipment_list():
    """Retorna lista de equipamentos"""
    try:
        result = exercise_service.get_equipment_list()
        
        if result.get('success'):
            return jsonify(result), 200
        else:
            return jsonify({'error': result['error']}), 400
            
    except Exception as e:
        return jsonify({'error': 'Erro interno do servidor'}), 500

@exercises_bp.route('/workout-plans', methods=['GET'])
@token_required
@rate_limit("20 per minute")
def get_user_workout_plans():
    """Busca planos de treino do usuário"""
    try:
        user_id = request.current_user['id']
        is_active = request.args.get('is_active')
        if is_active is not None:
            is_active = is_active.lower() == 'true'
        
        result = exercise_service.get_user_workout_plans(user_id, is_active)
        
        if result.get('success'):
            return jsonify(result), 200
        else:
            return jsonify({'error': result['error']}), 400
            
    except Exception as e:
        log_security_event('workout_plans_error', details={'error': str(e)})
        return jsonify({'error': 'Erro interno do servidor'}), 500

@exercises_bp.route('/workout-plans', methods=['POST'])
@token_required
@rate_limit("10 per minute")
@validate_json('name', 'description', 'exercises')
def create_workout_plan():
    """Cria plano de treino personalizado"""
    try:
        user_id = request.current_user['id']
        data = request.get_json()
        
        result = exercise_service.create_workout_plan(user_id, data)
        
        if result.get('success'):
            log_user_activity(user_id, 'workout_plan_created', {
                'plan_name': data['name'],
                'exercises_count': len(data['exercises'])
            })
            return jsonify(result), 201
        else:
            return jsonify({'error': result['error']}), 400
            
    except Exception as e:
        log_security_event('workout_plan_creation_error', details={'error': str(e)})
        return jsonify({'error': 'Erro interno do servidor'}), 500

@exercises_bp.route('/workout-sessions', methods=['POST'])
@token_required
@rate_limit("20 per minute")
@validate_json('workout_plan_id', 'exercises_completed')
def log_workout_session():
    """Registra sessão de treino"""
    try:
        user_id = request.current_user['id']
        data = request.get_json()
        
        result = exercise_service.log_workout_session(user_id, data)
        
        if result.get('success'):
            log_user_activity(user_id, 'workout_session_logged', {
                'plan_id': data['workout_plan_id'],
                'duration': result['workout_session']['total_duration_minutes'],
                'calories': result['workout_session']['total_calories_burned']
            })
            return jsonify(result), 201
        else:
            return jsonify({'error': result['error']}), 400
            
    except Exception as e:
        log_security_event('workout_session_error', details={'error': str(e)})
        return jsonify({'error': 'Erro interno do servidor'}), 500

@exercises_bp.route('/workout-sessions', methods=['GET'])
@token_required
@rate_limit("20 per minute")
def get_workout_history():
    """Busca histórico de treinos"""
    try:
        user_id = request.current_user['id']
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        page = int(request.args.get('page', 1))
        limit = min(int(request.args.get('limit', 20)), 100)
        
        result = exercise_service.get_workout_history(
            user_id=user_id,
            start_date=start_date,
            end_date=end_date,
            page=page,
            limit=limit
        )
        
        if result.get('success'):
            return jsonify(result), 200
        else:
            return jsonify({'error': result['error']}), 400
            
    except Exception as e:
        log_security_event('workout_history_error', details={'error': str(e)})
        return jsonify({'error': 'Erro interno do servidor'}), 500

@exercises_bp.route('/workout-stats', methods=['GET'])
@token_required
@rate_limit("10 per minute")
def get_workout_stats():
    """Retorna estatísticas de treino"""
    try:
        user_id = request.current_user['id']
        period_days = int(request.args.get('period_days', 30))
        
        result = exercise_service.get_workout_stats(user_id, period_days)
        
        if result.get('success'):
            return jsonify(result), 200
        else:
            return jsonify({'error': result['error']}), 400
            
    except ValueError:
        return jsonify({'error': 'Periodo deve ser um número inteiro'}), 400
    except Exception as e:
        log_security_event('workout_stats_error', details={'error': str(e)})
        return jsonify({'error': 'Erro interno do servidor'}), 500

@exercises_bp.route('/calories/calculate', methods=['POST'])
@token_required
@rate_limit("30 per minute")
@validate_json('exercise_id', 'duration_minutes', 'user_weight_kg')
def calculate_calories():
    """Calcula calorias queimadas"""
    try:
        data = request.get_json()
        exercise_id = data['exercise_id']
        duration_minutes = int(data['duration_minutes'])
        user_weight_kg = float(data['user_weight_kg'])
        
        calories = exercise_service.calculate_calories_burned(
            exercise_id, duration_minutes, user_weight_kg
        )
        
        return jsonify({
            'exercise_id': exercise_id,
            'duration_minutes': duration_minutes,
            'user_weight_kg': user_weight_kg,
            'calories_burned': calories
        }), 200
        
    except ValueError:
        return jsonify({'error': 'Dados inválidos'}), 400
    except Exception as e:
        log_security_event('calories_calculation_error', details={'error': str(e)})
        return jsonify({'error': 'Erro interno do servidor'}), 500

@exercises_bp.route('/exercises', methods=['POST'])
@token_required
@admin_required
@rate_limit("10 per minute")
@validate_json('name', 'category', 'difficulty', 'muscle_groups')
def create_exercise():
    """Cria novo exercício (admin only)"""
    try:
        data = request.get_json()
        
        # Prepara dados do exercício
        exercise = {
            'name': data['name'],
            'description': data.get('description', ''),
            'category': data['category'],
            'difficulty': data['difficulty'],
            'muscle_groups': data['muscle_groups'],
            'equipment': data.get('equipment', []),
            'instructions': data.get('instructions', []),
            'tips': data.get('tips', []),
            'met_value': data.get('met_value', 3.5),
            'image_url': data.get('image_url'),
            'video_url': data.get('video_url'),
            'is_active': data.get('is_active', True),
            'created_at': datetime.now().isoformat(),
            'updated_at': datetime.now().isoformat()
        }
        
        # Salva exercício
        result = exercise_service.supabase.table('exercises').insert(exercise).execute()
        
        if result.data:
            log_user_activity(request.current_user['id'], 'exercise_created', {
                'exercise_name': data['name'],
                'category': data['category']
            })
            return jsonify({
                'success': True,
                'exercise': result.data[0],
                'message': 'Exercício criado com sucesso'
            }), 201
        else:
            return jsonify({'error': 'Erro ao criar exercício'}), 500
            
    except Exception as e:
        log_security_event('exercise_creation_error', details={'error': str(e)})
        return jsonify({'error': 'Erro interno do servidor'}), 500

@exercises_bp.route('/exercises/<exercise_id>', methods=['PUT'])
@token_required
@admin_required
@rate_limit("10 per minute")
def update_exercise(exercise_id):
    """Atualiza exercício (admin only)"""
    try:
        data = request.get_json()
        
        # Busca exercício existente
        exercise_result = exercise_service.supabase.table('exercises').select('*').eq('id', exercise_id).execute()
        
        if not exercise_result.data:
            return jsonify({'error': 'Exercício não encontrado'}), 404
        
        # Atualiza dados
        update_data = {
            'updated_at': datetime.now().isoformat()
        }
        
        allowed_fields = ['name', 'description', 'category', 'difficulty', 'muscle_groups', 
                         'equipment', 'instructions', 'tips', 'met_value', 'image_url', 
                         'video_url', 'is_active']
        
        for field in allowed_fields:
            if field in data:
                update_data[field] = data[field]
        
        # Atualiza no banco
        result = exercise_service.supabase.table('exercises').update(update_data).eq('id', exercise_id).execute()
        
        if result.data:
            log_user_activity(request.current_user['id'], 'exercise_updated', {
                'exercise_id': exercise_id,
                'updated_fields': list(update_data.keys())
            })
            return jsonify({'success': True, 'exercise': result.data[0]}), 200
        else:
            return jsonify({'error': 'Erro ao atualizar exercício'}), 500
            
    except Exception as e:
        log_security_event('exercise_update_error', details={'error': str(e)})
        return jsonify({'error': 'Erro interno do servidor'}), 500