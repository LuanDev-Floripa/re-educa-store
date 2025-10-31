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

logger = logging.getLogger(__name__)

# Blueprint para rotas de análise preditiva
predictive_bp = Blueprint('predictive', __name__)

# Inicializa serviço
predictive_service = PredictiveAnalysisService()

@predictive_bp.route('/health-metrics', methods=['GET'])
@token_required
def predict_health_metrics():
    """
    Prediz métricas de saúde futuras do usuário.
    
    Query Parameters:
        days_ahead (int): Dias para prever (padrão: 30, máx: 365).
        
    Returns:
        JSON: Predições de métricas de saúde ou erro.
    """
    try:
        user_id = request.current_user['id']
        days_ahead = int(request.args.get('days_ahead', 30))
        
        if days_ahead < 1 or days_ahead > 365:
            return jsonify({'error': 'days_ahead deve estar entre 1 e 365'}), 400
        
        result = predictive_service.predict_health_metrics(user_id, days_ahead)
        
        if result['success']:
            return jsonify(result), 200
        else:
            return jsonify({'error': result['error']}), 400
            
    except ValueError:
        return jsonify({'error': 'days_ahead deve ser um número válido'}), 400
    except Exception as e:
        logger.error(f"Erro na predição de métricas de saúde: {str(e)}")
        return jsonify({'error': 'Erro interno do servidor'}), 500

@predictive_bp.route('/behavior', methods=['GET'])
@token_required
def predict_user_behavior():
    """
    Prediz comportamento do usuário.
    
    Query Parameters:
        type (str): Tipo de comportamento (purchases, exercise, nutrition).
        
    Returns:
        JSON: Predições de comportamento ou erro.
    """
    try:
        user_id = request.current_user['id']
        behavior_type = request.args.get('type', 'purchases')
        
        valid_types = ['purchases', 'exercise', 'nutrition']
        if behavior_type not in valid_types:
            return jsonify({'error': f'Tipo deve ser um dos seguintes: {", ".join(valid_types)}'}), 400
        
        result = predictive_service.predict_user_behavior(user_id, behavior_type)
        
        if result['success']:
            return jsonify(result), 200
        else:
            return jsonify({'error': result['error']}), 400
            
    except Exception as e:
        logger.error(f"Erro na predição de comportamento: {str(e)}")
        return jsonify({'error': 'Erro interno do servidor'}), 500

@predictive_bp.route('/churn-risk', methods=['GET'])
@token_required
def predict_churn_risk():
    """
    Prediz risco de churn do usuário.
    
    Returns:
        JSON: Análise de risco de churn com score e fatores.
    """
    try:
        user_id = request.current_user['id']
        
        result = predictive_service.predict_churn_risk(user_id)
        
        if result['success']:
            return jsonify(result), 200
        else:
            return jsonify({'error': result['error']}), 400
            
    except Exception as e:
        logger.error(f"Erro na predição de churn: {str(e)}")
        return jsonify({'error': 'Erro interno do servidor'}), 500

@predictive_bp.route('/interventions', methods=['GET'])
@token_required
def predict_optimal_interventions():
    """Prediz intervenções ótimas para o usuário"""
    try:
        user_id = request.current_user['id']
        
        result = predictive_service.predict_optimal_interventions(user_id)
        
        if result['success']:
            return jsonify(result), 200
        else:
            return jsonify({'error': result['error']}), 400
            
    except Exception as e:
        logger.error(f"Erro na predição de intervenções: {str(e)}")
        return jsonify({'error': 'Erro interno do servidor'}), 500

@predictive_bp.route('/seasonal-trends', methods=['GET'])
@token_required
def predict_seasonal_trends():
    """Prediz tendências sazonais do usuário"""
    try:
        user_id = request.current_user['id']
        
        result = predictive_service.predict_seasonal_trends(user_id)
        
        if result['success']:
            return jsonify(result), 200
        else:
            return jsonify({'error': result['error']}), 400
            
    except Exception as e:
        logger.error(f"Erro na predição de tendências sazonais: {str(e)}")
        return jsonify({'error': 'Erro interno do servidor'}), 500

@predictive_bp.route('/comprehensive-analysis', methods=['GET'])
@token_required
def get_comprehensive_analysis():
    """Obtém análise preditiva abrangente do usuário"""
    try:
        user_id = request.current_user['id']
        days_ahead = int(request.args.get('days_ahead', 30))
        
        # Executa múltiplas análises em paralelo
        results = {}
        
        # Predição de métricas de saúde
        health_result = predictive_service.predict_health_metrics(user_id, days_ahead)
        if health_result['success']:
            results['health_metrics'] = health_result
        
        # Predição de churn
        churn_result = predictive_service.predict_churn_risk(user_id)
        if churn_result['success']:
            results['churn_risk'] = churn_result
        
        # Predição de intervenções
        interventions_result = predictive_service.predict_optimal_interventions(user_id)
        if interventions_result['success']:
            results['interventions'] = interventions_result
        
        # Predição de tendências sazonais
        seasonal_result = predictive_service.predict_seasonal_trends(user_id)
        if seasonal_result['success']:
            results['seasonal_trends'] = seasonal_result
        
        # Predição de comportamento de compras
        purchase_result = predictive_service.predict_user_behavior(user_id, 'purchases')
        if purchase_result['success']:
            results['purchase_behavior'] = purchase_result
        
        # Predição de comportamento de exercícios
        exercise_result = predictive_service.predict_user_behavior(user_id, 'exercise')
        if exercise_result['success']:
            results['exercise_behavior'] = exercise_result
        
        return jsonify({
            'success': True,
            'user_id': user_id,
            'analysis': results,
            'generated_at': '2024-01-01T00:00:00Z'  # Em produção, usar datetime.now()
        }), 200
        
    except ValueError:
        return jsonify({'error': 'days_ahead deve ser um número válido'}), 400
    except Exception as e:
        logger.error(f"Erro na análise abrangente: {str(e)}")
        return jsonify({'error': 'Erro interno do servidor'}), 500

@predictive_bp.route('/admin/model-performance', methods=['GET'])
@token_required
@admin_required
def get_model_performance():
    """Obtém performance dos modelos preditivos (admin only)"""
    try:
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
        
    except Exception as e:
        logger.error(f"Erro ao obter performance dos modelos: {str(e)}")
        return jsonify({'error': 'Erro interno do servidor'}), 500

@predictive_bp.route('/admin/retrain-models', methods=['POST'])
@token_required
@admin_required
def retrain_models():
    """Retreina modelos preditivos (admin only)"""
    try:
        data = request.get_json() or {}
        model_type = data.get('model_type', 'all')
        
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
        
    except Exception as e:
        logger.error(f"Erro no retreinamento dos modelos: {str(e)}")
        return jsonify({'error': 'Erro interno do servidor'}), 500

@predictive_bp.route('/admin/analytics', methods=['GET'])
@token_required
@admin_required
def get_predictive_analytics():
    """Obtém analytics de análise preditiva (admin only)"""
    try:
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
        
    except Exception as e:
        logger.error(f"Erro ao obter analytics preditivos: {str(e)}")
        return jsonify({'error': 'Erro interno do servidor'}), 500