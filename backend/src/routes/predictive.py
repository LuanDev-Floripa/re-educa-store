"""
Rotas para Análise Preditiva RE-EDUCA Store.

Fornece análises preditivas usando machine learning incluindo:
- Previsão de métricas de saúde
- Predição de comportamento do usuário
- Análise de risco de churn
- Recomendações de intervenções
- Tendências sazonais
"""
import logging
from flask import Blueprint, request, jsonify
from middleware.auth import token_required, admin_required
from services.predictive_analysis_service import PredictiveAnalysisService
from utils.exception_strategies import handle_route_exceptions
from exceptions.custom_exceptions import ValidationError, InternalServerError

logger = logging.getLogger(__name__)

# Blueprint para rotas de análise preditiva
predictive_bp = Blueprint('predictive', __name__)

# Inicializa serviço
predictive_service = PredictiveAnalysisService()

@predictive_bp.route('/health-metrics', methods=['GET'])
@token_required
@handle_route_exceptions
def predict_health_metrics():
    """
    Prediz métricas de saúde futuras do usuário.
    
    Implementa tratamento robusto de exceções e validação de dados.

    Query Parameters:
        days_ahead (int): Dias para prever (padrão: 30, máx: 365).

    Returns:
        JSON: Predições de métricas de saúde ou erro.
    """
    user_id = request.current_user['id']
    
    try:
        days_ahead = int(request.args.get('days_ahead', 30))
        if days_ahead < 1 or days_ahead > 365:
            raise ValidationError('days_ahead deve estar entre 1 e 365')
    except (ValueError, TypeError):
        raise ValidationError('days_ahead deve ser um número válido')

    result = predictive_service.predict_health_metrics(user_id, days_ahead)

    if not result.get('success'):
        raise ValidationError(result.get('error', 'Erro ao prever métricas de saúde'))

    return jsonify(result), 200

@predictive_bp.route('/behavior', methods=['GET'])
@token_required
@handle_route_exceptions
def predict_user_behavior():
    """
    Prediz comportamento do usuário.
    
    Implementa tratamento robusto de exceções e validação de dados.

    Query Parameters:
        type (str): Tipo de comportamento (purchases, exercise, nutrition).

    Returns:
        JSON: Predições de comportamento ou erro.
    """
    user_id = request.current_user['id']
    behavior_type = request.args.get('type', 'purchases')

    valid_types = ['purchases', 'exercise', 'nutrition']
    if behavior_type not in valid_types:
        raise ValidationError(f'Tipo deve ser um dos seguintes: {", ".join(valid_types)}')

    result = predictive_service.predict_user_behavior(user_id, behavior_type)

    if not result.get('success'):
        raise ValidationError(result.get('error', 'Erro ao prever comportamento'))

    return jsonify(result), 200

@predictive_bp.route('/churn-risk', methods=['GET'])
@token_required
@handle_route_exceptions
def predict_churn_risk():
    """
    Prediz risco de churn do usuário.
    
    Implementa tratamento robusto de exceções e validação de dados.

    Returns:
        JSON: Análise de risco de churn com score e fatores.
    """
    user_id = request.current_user['id']

    result = predictive_service.predict_churn_risk(user_id)

    if not result.get('success'):
        raise ValidationError(result.get('error', 'Erro ao prever risco de churn'))

    return jsonify(result), 200

@predictive_bp.route('/interventions', methods=['GET'])
@token_required
@handle_route_exceptions
def predict_optimal_interventions():
    """
    Prediz intervenções ótimas para o usuário.
    
    Implementa tratamento robusto de exceções e validação de dados.
    """
    user_id = request.current_user['id']

    result = predictive_service.predict_optimal_interventions(user_id)

    if not result.get('success'):
        raise ValidationError(result.get('error', 'Erro ao prever intervenções'))

    return jsonify(result), 200

@predictive_bp.route('/seasonal-trends', methods=['GET'])
@token_required
@handle_route_exceptions
def predict_seasonal_trends():
    """
    Prediz tendências sazonais do usuário.
    
    Implementa tratamento robusto de exceções e validação de dados.
    """
    user_id = request.current_user['id']

    result = predictive_service.predict_seasonal_trends(user_id)

    if not result.get('success'):
        raise ValidationError(result.get('error', 'Erro ao prever tendências sazonais'))

    return jsonify(result), 200

@predictive_bp.route('/comprehensive-analysis', methods=['GET'])
@token_required
@handle_route_exceptions
def get_comprehensive_analysis():
    """
    Obtém análise preditiva abrangente do usuário.
    
    Implementa tratamento robusto de exceções e validação de dados.
    """
    user_id = request.current_user['id']
    
    try:
        days_ahead = int(request.args.get('days_ahead', 30))
        if days_ahead < 1 or days_ahead > 365:
            raise ValidationError('days_ahead deve estar entre 1 e 365')
    except (ValueError, TypeError):
        raise ValidationError('days_ahead deve ser um número válido')

    # Executa múltiplas análises em paralelo
    results = {}

    # Predição de métricas de saúde
    health_result = predictive_service.predict_health_metrics(user_id, days_ahead)
    if health_result.get('success'):
        results['health_metrics'] = health_result

    # Predição de churn
    churn_result = predictive_service.predict_churn_risk(user_id)
    if churn_result.get('success'):
        results['churn_risk'] = churn_result

    # Predição de intervenções
    interventions_result = predictive_service.predict_optimal_interventions(user_id)
    if interventions_result.get('success'):
        results['interventions'] = interventions_result

    # Predição de tendências sazonais
    seasonal_result = predictive_service.predict_seasonal_trends(user_id)
    if seasonal_result.get('success'):
        results['seasonal_trends'] = seasonal_result

    # Predição de comportamento de compras
    purchase_result = predictive_service.predict_user_behavior(user_id, 'purchases')
    if purchase_result.get('success'):
        results['purchase_behavior'] = purchase_result

    # Predição de comportamento de exercícios
    exercise_result = predictive_service.predict_user_behavior(user_id, 'exercise')
    if exercise_result.get('success'):
        results['exercise_behavior'] = exercise_result

    return jsonify({
        'success': True,
        'user_id': user_id,
        'analysis': results,
        'generated_at': '2024-01-01T00:00:00Z'  # Em produção, usar datetime.now()
    }), 200

@predictive_bp.route('/admin/model-performance', methods=['GET'])
@token_required
@admin_required
@handle_route_exceptions
def get_model_performance():
    """
    Obtém performance dos modelos preditivos (admin only).
    
    Implementa tratamento robusto de exceções e validação de dados.
    """
    # Simula dados de performance dos modelos
    performance_data = {
        'health_metrics_model': {
            'accuracy': 0.85,
            'precision': 0.82,
            'recall': 0.88,
            'f1_score': 0.85,
            'last_trained': '2024-01-01T00:00:00Z',
            'training_samples': 10000
        },
        'churn_prediction_model': {
            'accuracy': 0.78,
            'precision': 0.75,
            'recall': 0.80,
            'f1_score': 0.77,
            'last_trained': '2024-01-01T00:00:00Z',
            'training_samples': 5000
        },
        'behavior_prediction_model': {
            'accuracy': 0.72,
            'precision': 0.70,
            'recall': 0.74,
            'f1_score': 0.72,
            'last_trained': '2024-01-01T00:00:00Z',
            'training_samples': 8000
        }
    }

    return jsonify({
        'success': True,
        'model_performance': performance_data,
        'overall_accuracy': 0.78,
        'last_updated': '2024-01-01T00:00:00Z'
    }), 200

@predictive_bp.route('/admin/retrain-models', methods=['POST'])
@token_required
@admin_required
@handle_route_exceptions
def retrain_models():
    """
    Retreina modelos preditivos (admin only).
    
    Implementa tratamento robusto de exceções e validação de dados.
    """
    data = request.get_json() or {}
    model_type = data.get('model_type', 'all')

    valid_types = ['all', 'health_metrics', 'churn', 'behavior']
    if model_type not in valid_types:
        raise ValidationError(f'model_type deve ser um dos: {", ".join(valid_types)}')

    # Simula retreinamento dos modelos
    retrain_results = {}

    if model_type in ['all', 'health_metrics']:
        retrain_results['health_metrics'] = {
            'status': 'success',
            'new_accuracy': 0.87,
            'training_time': '45 minutes',
            'samples_used': 12000
        }

    if model_type in ['all', 'churn']:
        retrain_results['churn_prediction'] = {
            'status': 'success',
            'new_accuracy': 0.81,
            'training_time': '30 minutes',
            'samples_used': 6000
        }

    if model_type in ['all', 'behavior']:
        retrain_results['behavior_prediction'] = {
            'status': 'success',
            'new_accuracy': 0.75,
            'training_time': '60 minutes',
            'samples_used': 10000
        }

    return jsonify({
        'success': True,
        'retrain_results': retrain_results,
        'completed_at': '2024-01-01T00:00:00Z'
    }), 200

@predictive_bp.route('/admin/analytics', methods=['GET'])
@token_required
@admin_required
@handle_route_exceptions
def get_predictive_analytics():
    """
    Obtém analytics de análise preditiva (admin only).
    
    Implementa tratamento robusto de exceções e validação de dados.
    """
    # Simula dados de analytics
    analytics_data = {
        'total_predictions_made': 15420,
        'predictions_last_30_days': 3240,
        'average_accuracy': 0.78,
        'most_accurate_model': 'health_metrics',
        'predictions_by_type': {
            'health_metrics': 6200,
            'churn_risk': 3100,
            'behavior': 2800,
            'interventions': 2200,
            'seasonal_trends': 1120
        },
        'user_satisfaction': {
            'high': 0.65,
            'medium': 0.25,
            'low': 0.10
        },
        'prediction_trends': {
            'daily_volume': [120, 135, 110, 145, 160, 140, 155],
            'accuracy_trend': [0.75, 0.76, 0.78, 0.77, 0.79, 0.80, 0.78]
        }
    }

    return jsonify({
        'success': True,
        'analytics': analytics_data,
        'generated_at': '2024-01-01T00:00:00Z'
    }), 200
