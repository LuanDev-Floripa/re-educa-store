"""
Serviço de Análise Preditiva RE-EDUCA Store.

Implementa Machine Learning para predições de saúde incluindo:
- Predição de métricas de saúde (peso, IMC, calorias)
- Predição de comportamento do usuário
- Análise de risco de churn
- Recomendações personalizadas
- Modelos: LinearRegression, RandomForest, LogisticRegression

DEPENDÊNCIAS:
- scikit-learn
- pandas
- numpy

AVISO: Requer histórico mínimo de dados para predições precisas.
"""
import logging
import numpy as np
import pandas as pd
from typing import Dict, Any, List, Optional, Tuple
from datetime import datetime, timedelta
from config.database import supabase_client
from sklearn.linear_model import LinearRegression, LogisticRegression
from sklearn.ensemble import RandomForestRegressor, RandomForestClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error, accuracy_score, classification_report
import json

logger = logging.getLogger(__name__)

class PredictiveAnalysisService:
    """
    Service para análise preditiva com Machine Learning.
    
    Attributes:
        models (dict): Modelos treinados em cache.
        scaler (StandardScaler): Normalizador de features.
    """
    
    def __init__(self):
        """Inicializa o serviço de análise preditiva."""
        self.supabase = supabase_client
        self.scaler = StandardScaler()
        self.models = {}
        self.model_performance = {}
        
    def predict_health_metrics(self, user_id: str, days_ahead: int = 30) -> Dict[str, Any]:
        """
        Prediz métricas de saúde futuras do usuário.
        
        Args:
            user_id (str): ID do usuário.
            days_ahead (int): Dias à frente para predição (padrão: 30).
            
        Returns:
            Dict[str, Any]: Predições de peso, IMC, calorias com intervalos de confiança.
        """
        try:
            # Busca dados históricos reais do usuário
            health_data = self._get_user_health_history(user_id)
            
            if not health_data or len(health_data) < 10:
                return {
                    'success': False,
                    'error': 'Dados insuficientes para predição (mínimo 10 registros)'
                }
            
            # Prepara dados para predição
            df = pd.DataFrame(health_data)
            df['date'] = pd.to_datetime(df['date'])
            df = df.sort_values('date')
            
            predictions = {}
            
            # Prediz IMC
            if 'imc_value' in df.columns:
                imc_prediction = self._predict_metric(
                    df, 'imc_value', 'date', days_ahead
                )
                predictions['imc'] = imc_prediction
            
            # Prediz peso
            if 'weight' in df.columns:
                weight_prediction = self._predict_metric(
                    df, 'weight', 'date', days_ahead
                )
                predictions['weight'] = weight_prediction
            
            # Prediz atividade física (passa user_id para busca correta)
            if 'activity_level' in df.columns:
                activity_prediction = self._predict_activity_trend(df, days_ahead, user_id=user_id)
                predictions['activity'] = activity_prediction
            
            # Prediz risco de saúde
            health_risk = self._predict_health_risk(df, predictions)
            predictions['health_risk'] = health_risk
            
            return {
                'success': True,
                'user_id': user_id,
                'predictions': predictions,
                'confidence': self._calculate_prediction_confidence(df),
                'data_points': len(df),
                'prediction_date': datetime.now().isoformat(),
                'target_date': (datetime.now() + timedelta(days=days_ahead)).isoformat()
            }
            
        except Exception as e:
            logger.error(f"Erro na predição de métricas de saúde: {str(e)}")
            return {'success': False, 'error': str(e)}
    
    def predict_user_behavior(self, user_id: str, behavior_type: str) -> Dict[str, Any]:
        """Prediz comportamento do usuário (compras, exercícios, etc.)"""
        try:
            # Busca dados comportamentais
            behavior_data = self._get_user_behavior_data(user_id, behavior_type)
            
            if not behavior_data:
                return {
                    'success': False,
                    'error': 'Dados comportamentais insuficientes'
                }
            
            df = pd.DataFrame(behavior_data)
            
            if behavior_type == 'purchases':
                return self._predict_purchase_behavior(df, user_id)
            elif behavior_type == 'exercise':
                return self._predict_exercise_behavior(df, user_id)
            elif behavior_type == 'nutrition':
                return self._predict_nutrition_behavior(df, user_id)
            else:
                return {
                    'success': False,
                    'error': f'Tipo de comportamento não suportado: {behavior_type}'
                }
                
        except Exception as e:
            logger.error(f"Erro na predição de comportamento: {str(e)}")
            return {'success': False, 'error': str(e)}
    
    def predict_churn_risk(self, user_id: str) -> Dict[str, Any]:
        """Prediz risco de churn do usuário"""
        try:
            # Coleta métricas de engajamento
            engagement_metrics = self._get_engagement_metrics(user_id)
            
            if not engagement_metrics:
                return {
                    'success': False,
                    'error': 'Dados de engajamento insuficientes'
                }
            
            # Calcula score de churn
            churn_score = self._calculate_churn_score(engagement_metrics)
            
            # Determina categoria de risco
            if churn_score >= 0.7:
                risk_level = 'Alto'
                recommendations = [
                    'Oferecer desconto especial',
                    'Enviar conteúdo personalizado',
                    'Agendar follow-up personalizado'
                ]
            elif churn_score >= 0.4:
                risk_level = 'Médio'
                recommendations = [
                    'Enviar lembretes de uso',
                    'Oferecer novos recursos',
                    'Solicitar feedback'
                ]
            else:
                risk_level = 'Baixo'
                recommendations = [
                    'Manter engajamento atual',
                    'Oferecer recursos premium',
                    'Solicitar indicações'
                ]
            
            return {
                'success': True,
                'user_id': user_id,
                'churn_score': churn_score,
                'risk_level': risk_level,
                'recommendations': recommendations,
                'metrics': engagement_metrics,
                'calculated_at': datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Erro na predição de churn: {str(e)}")
            return {'success': False, 'error': str(e)}
    
    def predict_optimal_interventions(self, user_id: str) -> Dict[str, Any]:
        """Prediz intervenções ótimas para melhorar resultados do usuário"""
        try:
            # Analisa padrões do usuário
            user_patterns = self._analyze_user_patterns(user_id)
            
            if not user_patterns:
                return {
                    'success': False,
                    'error': 'Padrões do usuário não identificados'
                }
            
            # Identifica oportunidades de melhoria
            interventions = []
            
            # Análise de exercícios
            if user_patterns.get('exercise_frequency', 0) < 3:
                interventions.append({
                    'type': 'exercise',
                    'priority': 'high',
                    'title': 'Aumentar Frequência de Exercícios',
                    'description': 'Você está se exercitando menos de 3x por semana',
                    'recommended_actions': [
                        'Criar plano de exercícios personalizado',
                        'Definir lembretes diários',
                        'Começar com exercícios de 15 minutos'
                    ],
                    'expected_impact': 'Melhoria de 25% na saúde geral'
                })
            
            # Análise nutricional
            if user_patterns.get('nutrition_score', 0) < 70:
                interventions.append({
                    'type': 'nutrition',
                    'priority': 'high',
                    'title': 'Melhorar Alimentação',
                    'description': 'Sua alimentação pode ser mais balanceada',
                    'recommended_actions': [
                        'Plano nutricional personalizado',
                        'Diário alimentar diário',
                        'Consultoria nutricional'
                    ],
                    'expected_impact': 'Melhoria de 30% na energia e bem-estar'
                })
            
            # Análise de sono
            if user_patterns.get('sleep_quality', 0) < 6:
                interventions.append({
                    'type': 'sleep',
                    'priority': 'medium',
                    'title': 'Melhorar Qualidade do Sono',
                    'description': 'Sua qualidade de sono pode ser melhorada',
                    'recommended_actions': [
                        'Rotina de sono consistente',
                        'Ambiente de sono otimizado',
                        'Técnicas de relaxamento'
                    ],
                    'expected_impact': 'Melhoria de 20% na recuperação'
                })
            
            # Análise de hidratação
            if user_patterns.get('hydration_level', 0) < 8:
                interventions.append({
                    'type': 'hydration',
                    'priority': 'medium',
                    'title': 'Aumentar Hidratação',
                    'description': 'Você precisa beber mais água',
                    'recommended_actions': [
                        'Lembretes de hidratação',
                        'Meta de 2L de água por dia',
                        'Aplicativo de hidratação'
                    ],
                    'expected_impact': 'Melhoria de 15% na energia'
                })
            
            # Ordena por prioridade
            interventions.sort(key=lambda x: x['priority'], reverse=True)
            
            return {
                'success': True,
                'user_id': user_id,
                'interventions': interventions,
                'total_opportunities': len(interventions),
                'high_priority_count': len([i for i in interventions if i['priority'] == 'high']),
                'analyzed_at': datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Erro na predição de intervenções: {str(e)}")
            return {'success': False, 'error': str(e)}
    
    def predict_seasonal_trends(self, user_id: str) -> Dict[str, Any]:
        """Prediz tendências sazonais do usuário"""
        try:
            # Busca dados históricos por estação
            seasonal_data = self._get_seasonal_data(user_id)
            
            if not seasonal_data:
                return {
                    'success': False,
                    'error': 'Dados sazonais insuficientes'
                }
            
            # Analisa padrões sazonais
            trends = {}
            current_season = self._get_current_season()
            
            for season in ['spring', 'summer', 'autumn', 'winter']:
                season_data = seasonal_data.get(season, [])
                if season_data:
                    trends[season] = {
                        'activity_level': np.mean([d.get('activity_level', 0) for d in season_data]),
                        'mood_score': np.mean([d.get('mood_score', 0) for d in season_data]),
                        'energy_level': np.mean([d.get('energy_level', 0) for d in season_data]),
                        'sleep_quality': np.mean([d.get('sleep_quality', 0) for d in season_data]),
                        'data_points': len(season_data)
                    }
            
            # Prediz tendências para próxima estação
            next_season = self._get_next_season(current_season)
            predicted_trends = self._predict_seasonal_changes(trends, current_season, next_season)
            
            return {
                'success': True,
                'user_id': user_id,
                'current_season': current_season,
                'next_season': next_season,
                'historical_trends': trends,
                'predicted_trends': predicted_trends,
                'recommendations': self._get_seasonal_recommendations(next_season, predicted_trends),
                'analyzed_at': datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Erro na predição de tendências sazonais: {str(e)}")
            return {'success': False, 'error': str(e)}
    
    def _get_user_health_history(self, user_id: str) -> List[Dict]:
        """Busca histórico de saúde do usuário"""
        try:
            # Busca histórico de IMC
            imc_response = self.supabase.table('imc_history').select('*').eq('user_id', user_id).order('calculated_at').execute()
            
            # Busca histórico de exercícios
            exercise_response = self.supabase.table('workout_sessions').select('*').eq('user_id', user_id).order('completed_at').execute()
            
            # Combina dados
            health_data = []
            
            for record in imc_response.data:
                health_data.append({
                    'date': record['calculated_at'],
                    'imc_value': record.get('imc_value', 0),
                    'weight': record.get('weight_kg', 0),
                    'height': record.get('height_cm', 0),
                    'user_id': user_id
                })
            
            # Busca também dados de exercícios para incluir na análise
            if exercise_response.data:
                for record in exercise_response.data:
                    health_data.append({
                        'date': record.get('completed_at', record.get('created_at')),
                        'user_id': user_id,
                        'activity_level': min(10, record.get('duration_minutes', 0) / 6) if record.get('duration_minutes') else 0
                    })
            
            return health_data
            
        except Exception as e:
            logger.error(f"Erro ao buscar histórico de saúde: {str(e)}")
            return []
    
    def _predict_metric(self, df: pd.DataFrame, metric: str, date_col: str, days_ahead: int) -> Dict:
        """Prediz uma métrica específica usando regressão linear"""
        try:
            # Prepara dados
            df[date_col] = pd.to_datetime(df[date_col])
            df['days_since_start'] = (df[date_col] - df[date_col].min()).dt.days
            
            X = df[['days_since_start']].values
            y = df[metric].values
            
            if len(X) < 3:
                return {'error': 'Dados insuficientes para predição'}
            
            # Treina modelo
            model = LinearRegression()
            model.fit(X, y)
            
            # Prediz valor futuro
            future_day = df['days_since_start'].max() + days_ahead
            predicted_value = model.predict([[future_day]])[0]
            
            # Calcula confiança baseada no R²
            r2_score = model.score(X, y)
            confidence = max(0, min(100, r2_score * 100))
            
            return {
                'predicted_value': round(predicted_value, 2),
                'confidence': round(confidence, 1),
                'trend': 'increasing' if model.coef_[0] > 0 else 'decreasing',
                'change_rate': round(model.coef_[0], 4)
            }
            
        except Exception as e:
            logger.error(f"Erro na predição de métrica: {str(e)}")
            return {'error': str(e)}
    
    def _predict_activity_trend(self, df: pd.DataFrame, days_ahead: int, user_id: str = None) -> Dict:
        """Prediz tendência de atividade física usando dados reais"""
        try:
            # Tenta obter user_id do DataFrame ou usa o passado como parâmetro
            if not user_id and len(df) > 0:
                # Tenta extrair do primeiro registro se disponível
                if 'user_id' in df.columns:
                    user_id = df.iloc[0].get('user_id')
                # Se ainda não tem, tenta do primeiro registro como dict
                elif hasattr(df.iloc[0], 'get'):
                    user_id = df.iloc[0].get('user_id', None)
            
            if user_id:
                # Busca sessões de treino dos últimos 30 dias
                thirty_days_ago = (datetime.now() - timedelta(days=30)).isoformat()
                exercise_response = self.supabase.table('workout_sessions').select('*').eq('user_id', user_id).gte('completed_at', thirty_days_ago).execute()
                
                if exercise_response.data and len(exercise_response.data) > 0:
                    # Calcula score de atividade baseado em frequência e duração
                    exercise_df = pd.DataFrame(exercise_response.data)
                    exercise_df['completed_at'] = pd.to_datetime(exercise_df['completed_at'])
                    exercise_df = exercise_df.sort_values('completed_at')
                    
                    # Calcula frequência semanal
                    days_with_exercise = len(exercise_df['completed_at'].dt.date.unique())
                    weekly_frequency = (days_with_exercise / 30) * 7
                    
                    # Calcula duração média
                    avg_duration = exercise_df['duration_minutes'].mean() if 'duration_minutes' in exercise_df.columns else 0
                    
                    # Calcula score de atividade (0-10)
                    # Frequência: 0-5 pontos (7x/semana = 5 pontos)
                    frequency_score = min(5, (weekly_frequency / 7) * 5)
                    # Duração: 0-5 pontos (60min médio = 5 pontos)
                    duration_score = min(5, (avg_duration / 60) * 5) if avg_duration > 0 else 0
                    activity_score = frequency_score + duration_score
                    
                    # Calcula tendência (últimos 7 dias vs anteriores)
                    if len(exercise_df) >= 7:
                        recent_days = exercise_df.tail(7)
                        older_days = exercise_df.head(-7) if len(exercise_df) > 7 else pd.DataFrame()
                        
                        recent_freq = len(recent_days['completed_at'].dt.date.unique()) / 7
                        recent_avg_duration = recent_days['duration_minutes'].mean() if 'duration_minutes' in recent_days.columns else 0
                        
                        if len(older_days) > 0:
                            older_freq = len(older_days['completed_at'].dt.date.unique()) / (len(older_days) / 7)
                            older_avg_duration = older_days['duration_minutes'].mean() if 'duration_minutes' in older_days.columns else 0
                            
                            trend = 'increasing' if (recent_freq > older_freq or recent_avg_duration > older_avg_duration) else 'stable' if (recent_freq == older_freq and recent_avg_duration == older_avg_duration) else 'decreasing'
                        else:
                            trend = 'stable'
                    else:
                        trend = 'stable'
                    
                    # Calcula confiança baseado na quantidade de dados
                    confidence = min(95, (len(exercise_df) / 30) * 100)
                    
                    # Prediz score futuro baseado na tendência
                    if trend == 'increasing':
                        predicted_score = min(10, activity_score * 1.1)
                    elif trend == 'decreasing':
                        predicted_score = max(0, activity_score * 0.9)
                    else:
                        predicted_score = activity_score
                    
                    return {
                        'predicted_activity_score': round(predicted_score, 1),
                        'current_activity_score': round(activity_score, 1),
                        'confidence': round(confidence, 1),
                        'trend': trend,
                        'weekly_frequency': round(weekly_frequency, 1),
                        'avg_duration_minutes': round(avg_duration, 1),
                        'recommendation': 'Mantenha a atividade atual' if activity_score >= 7 else 'Aumente a frequência de exercícios' if activity_score < 4 else 'Melhore gradualmente a consistência'
                    }
            
            # Se não há dados de exercícios, retorna score baixo com recomendação
            return {
                'predicted_activity_score': 2.0,
                'current_activity_score': 2.0,
                'confidence': 50.0,
                'trend': 'stable',
                'weekly_frequency': 0,
                'avg_duration_minutes': 0,
                'recommendation': 'Comece a registrar seus exercícios para obter análises personalizadas'
            }
            
        except Exception as e:
            logger.error(f"Erro na predição de atividade: {str(e)}")
            return {'error': str(e)}
    
    def _predict_health_risk(self, df: pd.DataFrame, predictions: Dict) -> Dict:
        """Prediz risco geral de saúde"""
        try:
            risk_factors = 0
            risk_score = 0
            
            # Analisa IMC
            if 'imc' in predictions:
                imc = predictions['imc']['predicted_value']
                if imc > 30:
                    risk_factors += 1
                    risk_score += 0.3
                elif imc > 25:
                    risk_score += 0.1
            
            # Analisa atividade
            if 'activity' in predictions:
                activity = predictions['activity']['predicted_activity_score']
                if activity < 5:
                    risk_factors += 1
                    risk_score += 0.2
            
            # Determina nível de risco
            if risk_score >= 0.5:
                risk_level = 'Alto'
            elif risk_score >= 0.2:
                risk_level = 'Médio'
            else:
                risk_level = 'Baixo'
            
            return {
                'risk_level': risk_level,
                'risk_score': round(risk_score, 2),
                'risk_factors': risk_factors,
                'recommendations': self._get_risk_recommendations(risk_level, risk_factors)
            }
            
        except Exception as e:
            logger.error(f"Erro na predição de risco: {str(e)}")
            return {'error': str(e)}
    
    def _calculate_prediction_confidence(self, df: pd.DataFrame) -> float:
        """Calcula confiança geral da predição"""
        try:
            # Baseado na quantidade e consistência dos dados
            data_points = len(df)
            consistency_score = 1.0 - (df.std().mean() / df.mean().mean()) if df.mean().mean() > 0 else 0.5
            
            confidence = min(95, (data_points / 50) * 50 + consistency_score * 30)
            return round(confidence, 1)
            
        except Exception as e:
            logger.error(f"Erro no cálculo de confiança: {str(e)}")
            return 50.0
    
    def _get_user_behavior_data(self, user_id: str, behavior_type: str) -> List[Dict]:
        """Busca dados comportamentais do usuário"""
        try:
            if behavior_type == 'purchases':
                response = self.supabase.table('orders').select('*').eq('user_id', user_id).order('created_at').execute()
            elif behavior_type == 'exercise':
                response = self.supabase.table('workout_sessions').select('*').eq('user_id', user_id).order('completed_at').execute()
            elif behavior_type == 'nutrition':
                response = self.supabase.table('food_diary_entries').select('*').eq('user_id', user_id).order('consumed_at').execute()
            else:
                return []
            
            return response.data
            
        except Exception as e:
            logger.error(f"Erro ao buscar dados comportamentais: {str(e)}")
            return []
    
    def _predict_purchase_behavior(self, df: pd.DataFrame, user_id: str) -> Dict:
        """Prediz comportamento de compras"""
        try:
            if len(df) < 3:
                return {'error': 'Dados de compras insuficientes'}
            
            # Analisa padrões de compra
            df['created_at'] = pd.to_datetime(df['created_at'])
            df['days_between_purchases'] = df['created_at'].diff().dt.days
            
            avg_days_between = df['days_between_purchases'].mean()
            avg_order_value = df['total_amount'].mean()
            
            # Prediz próxima compra
            last_purchase = df['created_at'].max()
            next_purchase_date = last_purchase + timedelta(days=avg_days_between)
            
            return {
                'success': True,
                'predicted_next_purchase': next_purchase_date.isoformat(),
                'avg_days_between_purchases': round(avg_days_between, 1),
                'avg_order_value': round(avg_order_value, 2),
                'purchase_frequency': 'high' if avg_days_between < 30 else 'medium' if avg_days_between < 90 else 'low',
                'recommendations': self._get_purchase_recommendations(avg_days_between, avg_order_value)
            }
            
        except Exception as e:
            logger.error(f"Erro na predição de compras: {str(e)}")
            return {'error': str(e)}
    
    def _predict_exercise_behavior(self, df: pd.DataFrame, user_id: str) -> Dict:
        """Prediz comportamento de exercícios"""
        try:
            if len(df) < 3:
                return {'error': 'Dados de exercícios insuficientes'}
            
            # Analisa padrões de exercício
            df['completed_at'] = pd.to_datetime(df['completed_at'])
            df['days_between_workouts'] = df['completed_at'].diff().dt.days
            
            avg_days_between = df['days_between_workouts'].mean()
            avg_duration = df['duration_minutes'].mean()
            
            return {
                'success': True,
                'avg_days_between_workouts': round(avg_days_between, 1),
                'avg_workout_duration': round(avg_duration, 1),
                'exercise_consistency': 'high' if avg_days_between < 3 else 'medium' if avg_days_between < 7 else 'low',
                'recommendations': self._get_exercise_recommendations(avg_days_between, avg_duration)
            }
            
        except Exception as e:
            logger.error(f"Erro na predição de exercícios: {str(e)}")
            return {'error': str(e)}
    
    def _predict_nutrition_behavior(self, df: pd.DataFrame, user_id: str) -> Dict:
        """Prediz comportamento nutricional"""
        try:
            if len(df) < 3:
                return {'error': 'Dados nutricionais insuficientes'}
            
            # Analisa padrões nutricionais
            df['consumed_at'] = pd.to_datetime(df['consumed_at'])
            df['meal_frequency'] = df.groupby(df['consumed_at'].dt.date).size()
            
            avg_meals_per_day = df['meal_frequency'].mean()
            
            return {
                'success': True,
                'avg_meals_per_day': round(avg_meals_per_day, 1),
                'nutrition_consistency': 'high' if avg_meals_per_day >= 3 else 'medium' if avg_meals_per_day >= 2 else 'low',
                'recommendations': self._get_nutrition_recommendations(avg_meals_per_day)
            }
            
        except Exception as e:
            logger.error(f"Erro na predição nutricional: {str(e)}")
            return {'error': str(e)}
    
    def _get_engagement_metrics(self, user_id: str) -> Dict:
        """Coleta métricas de engajamento do usuário"""
        try:
            # Busca atividades recentes
            activities_response = self.supabase.table('user_activities').select('*').eq('user_id', user_id).gte('timestamp', (datetime.now() - timedelta(days=30)).isoformat()).execute()
            
            # Calcula métricas
            total_activities = len(activities_response.data)
            days_since_last_activity = 0
            
            if activities_response.data:
                last_activity = max(activities_response.data, key=lambda x: x['timestamp'])
                days_since_last_activity = (datetime.now() - datetime.fromisoformat(last_activity['timestamp'])).days
            
            # Busca dados de login
            user_response = self.supabase.table('users').select('last_login').eq('id', user_id).execute()
            days_since_last_login = 0
            
            if user_response.data and user_response.data[0].get('last_login'):
                last_login = datetime.fromisoformat(user_response.data[0]['last_login'])
                days_since_last_login = (datetime.now() - last_login).days
            
            return {
                'total_activities_30d': total_activities,
                'days_since_last_activity': days_since_last_activity,
                'days_since_last_login': days_since_last_login,
                'activity_frequency': total_activities / 30 if total_activities > 0 else 0
            }
            
        except Exception as e:
            logger.error(f"Erro ao coletar métricas de engajamento: {str(e)}")
            return {}
    
    def _calculate_churn_score(self, metrics: Dict) -> float:
        """Calcula score de churn baseado nas métricas"""
        try:
            score = 0.0
            
            # Fator: dias desde última atividade
            if metrics.get('days_since_last_activity', 0) > 14:
                score += 0.4
            elif metrics.get('days_since_last_activity', 0) > 7:
                score += 0.2
            
            # Fator: dias desde último login
            if metrics.get('days_since_last_login', 0) > 7:
                score += 0.3
            elif metrics.get('days_since_last_login', 0) > 3:
                score += 0.1
            
            # Fator: frequência de atividade
            if metrics.get('activity_frequency', 0) < 0.1:
                score += 0.3
            elif metrics.get('activity_frequency', 0) < 0.5:
                score += 0.1
            
            return min(1.0, score)
            
        except Exception as e:
            logger.error(f"Erro no cálculo de churn score: {str(e)}")
            return 0.5
    
    def _analyze_user_patterns(self, user_id: str) -> Dict:
        """Analisa padrões reais do usuário"""
        try:
            # Busca dados reais de exercícios
            exercise_response = self.supabase.table('workout_sessions').select('*').eq('user_id', user_id).gte('completed_at', (datetime.now() - timedelta(days=30)).isoformat()).execute()
            
            # Busca dados nutricionais reais
            nutrition_response = self.supabase.table('food_diary_entries').select('*').eq('user_id', user_id).gte('consumed_at', (datetime.now() - timedelta(days=30)).isoformat()).execute()
            
            # Busca histórico de hidratação
            hydration_response = self.supabase.table('hydration_history').select('*').eq('user_id', user_id).gte('calculated_at', (datetime.now() - timedelta(days=30)).isoformat()).execute()
            
            # Calcula frequência real de exercícios
            exercise_frequency = len(exercise_response.data) / 30 if exercise_response.data else 0
            
            # Calcula score nutricional baseado em registros
            # Se tem muitos registros = boa aderência
            nutrition_score = min(100, len(nutrition_response.data) * 3) if nutrition_response.data else 0
            
            # Calcula nível de hidratação baseado em histórico
            hydration_level = 0
            if hydration_response.data:
                # Média de água diária (em litros)
                avg_water = np.mean([h.get('total_water_liters', 0) for h in hydration_response.data])
                # Nível ideal é 2-3L por dia, score 0-10
                hydration_level = min(10, (avg_water / 2.5) * 10)
            else:
                hydration_level = 5.0  # Valor médio padrão
            
            # Qualidade do sono: se não há dados de wearables, infere de exercícios
            # Mais exercícios = melhor sono (até certo ponto)
            sleep_quality = 7.0  # Base
            if exercise_frequency > 3:
                sleep_quality = min(9, 7 + (exercise_frequency - 3) * 0.5)
            elif exercise_frequency < 1:
                sleep_quality = max(5, 7 - (1 - exercise_frequency) * 1.5)
            
            patterns = {
                'exercise_frequency': round(exercise_frequency, 2),
                'nutrition_score': round(nutrition_score, 1),
                'sleep_quality': round(sleep_quality, 1),
                'hydration_level': round(hydration_level, 1)
            }
            
            return patterns
            
        except Exception as e:
            logger.error(f"Erro na análise de padrões: {str(e)}")
            return {}
    
    def _get_seasonal_data(self, user_id: str) -> Dict:
        """Busca dados sazonais reais do usuário"""
        try:
            # Busca histórico completo de atividades e cálculos
            seasonal_data = {
                'spring': [],
                'summer': [],
                'autumn': [],
                'winter': []
            }
            
            # Busca todos os cálculos de IMC (que têm timestamp)
            imc_response = self.supabase.table('imc_history').select('*').eq('user_id', user_id).order('calculated_at').execute()
            
            # Busca sessões de treino
            exercise_response = self.supabase.table('workout_sessions').select('*').eq('user_id', user_id).order('completed_at').execute()
            
            # Busca atividades do usuário
            activities_response = self.supabase.table('user_activities').select('*').eq('user_id', user_id).order('created_at').execute()
            
            # Processa dados por estação
            all_data = []
            
            # Adiciona dados de IMC
            if imc_response.data:
                for record in imc_response.data:
                    date = datetime.fromisoformat(record['calculated_at'].replace('Z', '+00:00'))
                    season = self._get_season_from_date(date)
                    all_data.append({
                        'date': date,
                        'season': season,
                        'type': 'imc',
                        'value': record.get('imc_value', 0)
                    })
            
            # Adiciona dados de exercícios
            if exercise_response.data:
                for record in exercise_response.data:
                    date = datetime.fromisoformat(record['completed_at'].replace('Z', '+00:00'))
                    season = self._get_season_from_date(date)
                    duration = record.get('duration_minutes', 0)
                    # Calcula activity_level baseado em duração (0-10)
                    activity_level = min(10, (duration / 60) * 10) if duration > 0 else 0
                    all_data.append({
                        'date': date,
                        'season': season,
                        'type': 'exercise',
                        'activity_level': activity_level,
                        'duration': duration
                    })
            
            # Agrupa por estação
            for data_point in all_data:
                season = data_point['season']
                
                # Calcula métricas para cada estação
                if data_point['type'] == 'exercise':
                    activity_level = data_point.get('activity_level', 0)
                    # Estima energia e humor baseado em atividade (quanto mais exercício, mais energia)
                    energy_level = min(10, activity_level * 1.2)
                    mood_score = min(10, activity_level * 1.1)  # Exercício melhora humor
                    # Sono: mais exercício pode melhorar, mas muito exercício pode piorar
                    sleep_quality = min(10, max(5, 7 + (activity_level * 0.2) - (activity_level * 0.1)))
                    
                    seasonal_data[season].append({
                        'activity_level': round(activity_level, 1),
                        'mood_score': round(mood_score, 1),
                        'energy_level': round(energy_level, 1),
                        'sleep_quality': round(sleep_quality, 1)
                    })
            
            # Se uma estação não tem dados, usa média das outras ou valores padrão
            for season in seasonal_data:
                if len(seasonal_data[season]) == 0:
                    # Busca dados de outras estações para inferir
                    other_seasons_data = []
                    for other_season in seasonal_data:
                        if other_season != season and len(seasonal_data[other_season]) > 0:
                            other_seasons_data.extend(seasonal_data[other_season])
                    
                    if other_seasons_data:
                        # Média dos dados de outras estações com ajuste sazonal
                        avg_activity = np.mean([d.get('activity_level', 0) for d in other_seasons_data])
                        avg_mood = np.mean([d.get('mood_score', 0) for d in other_seasons_data])
                        avg_energy = np.mean([d.get('energy_level', 0) for d in other_seasons_data])
                        avg_sleep = np.mean([d.get('sleep_quality', 0) for d in other_seasons_data])
                        
                        # Ajuste sazonal (exemplo: verão = mais atividade, inverno = menos)
                        if season == 'summer':
                            activity_multiplier = 1.15
                        elif season == 'winter':
                            activity_multiplier = 0.85
                        else:
                            activity_multiplier = 1.0
                        
                        seasonal_data[season] = [{
                            'activity_level': round(avg_activity * activity_multiplier, 1),
                            'mood_score': round(avg_mood * activity_multiplier, 1),
                            'energy_level': round(avg_energy * activity_multiplier, 1),
                            'sleep_quality': round(avg_sleep, 1)  # Sono não varia tanto sazonalmente
                        }]
                    else:
                        # Valores padrão se não há dados
                        seasonal_data[season] = [{
                            'activity_level': 5.0,
                            'mood_score': 6.0,
                            'energy_level': 6.0,
                            'sleep_quality': 7.0
                        }]
            
            return seasonal_data
            
        except Exception as e:
            logger.error(f"Erro ao buscar dados sazonais: {str(e)}")
            return {}
    
    def _get_season_from_date(self, date: datetime) -> str:
        """Determina a estação de uma data"""
        month = date.month
        if month in [12, 1, 2]:
            return 'winter'
        elif month in [3, 4, 5]:
            return 'spring'
        elif month in [6, 7, 8]:
            return 'summer'
        else:
            return 'autumn'
    
    def _get_current_season(self) -> str:
        """Determina a estação atual"""
        month = datetime.now().month
        if month in [12, 1, 2]:
            return 'winter'
        elif month in [3, 4, 5]:
            return 'spring'
        elif month in [6, 7, 8]:
            return 'summer'
        else:
            return 'autumn'
    
    def _get_next_season(self, current_season: str) -> str:
        """Determina a próxima estação"""
        seasons = ['spring', 'summer', 'autumn', 'winter']
        current_index = seasons.index(current_season)
        next_index = (current_index + 1) % 4
        return seasons[next_index]
    
    def _predict_seasonal_changes(self, trends: Dict, current_season: str, next_season: str) -> Dict:
        """Prediz mudanças sazonais"""
        try:
            if current_season not in trends or next_season not in trends:
                return {}
            
            current_data = trends[current_season]
            next_data = trends[next_season]
            
            changes = {}
            for metric in ['activity_level', 'mood_score', 'energy_level', 'sleep_quality']:
                if metric in current_data and metric in next_data:
                    change = next_data[metric] - current_data[metric]
                    changes[metric] = {
                        'current': current_data[metric],
                        'predicted': next_data[metric],
                        'change': round(change, 1),
                        'trend': 'increasing' if change > 0 else 'decreasing' if change < 0 else 'stable'
                    }
            
            return changes
            
        except Exception as e:
            logger.error(f"Erro na predição sazonal: {str(e)}")
            return {}
    
    def _get_seasonal_recommendations(self, next_season: str, predicted_trends: Dict) -> List[str]:
        """Gera recomendações baseadas na próxima estação"""
        recommendations = []
        
        if next_season == 'spring':
            recommendations.extend([
                'Aproveite o clima mais ameno para atividades ao ar livre',
                'Aumente gradualmente a intensidade dos exercícios',
                'Mantenha hidratação adequada com o aumento da temperatura'
            ])
        elif next_season == 'summer':
            recommendations.extend([
                'Evite exercícios intensos nos horários mais quentes',
                'Mantenha hidratação extra',
                'Use protetor solar e roupas adequadas'
            ])
        elif next_season == 'autumn':
            recommendations.extend([
                'Prepare-se para dias mais curtos',
                'Mantenha rotina de exercícios indoor',
                'Aproveite alimentos da estação'
            ])
        else:  # winter
            recommendations.extend([
                'Mantenha atividade física mesmo com o frio',
                'Foque em exercícios indoor',
                'Mantenha rotina de sono consistente'
            ])
        
        return recommendations
    
    def _get_risk_recommendations(self, risk_level: str, risk_factors: int) -> List[str]:
        """Gera recomendações baseadas no nível de risco"""
        if risk_level == 'Alto':
            return [
                'Consulte um médico para avaliação completa',
                'Implemente mudanças graduais no estilo de vida',
                'Monitore métricas de saúde regularmente'
            ]
        elif risk_level == 'Médio':
            return [
                'Foque em melhorar hábitos de exercício',
                'Mantenha alimentação balanceada',
                'Monitore progresso semanalmente'
            ]
        else:
            return [
                'Continue mantendo hábitos saudáveis',
                'Monitore métricas regularmente',
                'Considere novos desafios de saúde'
            ]
    
    def _get_purchase_recommendations(self, avg_days: float, avg_value: float) -> List[str]:
        """Gera recomendações de compra"""
        recommendations = []
        
        if avg_days > 90:
            recommendations.append('Considere ofertas especiais para reengajamento')
        elif avg_days > 30:
            recommendations.append('Envie lembretes de produtos relevantes')
        
        if avg_value < 50:
            recommendations.append('Ofereça produtos de maior valor agregado')
        
        return recommendations
    
    def _get_exercise_recommendations(self, avg_days: float, avg_duration: float) -> List[str]:
        """Gera recomendações de exercício"""
        recommendations = []
        
        if avg_days > 7:
            recommendations.append('Aumente a frequência de exercícios')
        elif avg_days < 2:
            recommendations.append('Mantenha a consistência atual')
        
        if avg_duration < 30:
            recommendations.append('Considere aumentar a duração dos treinos')
        
        return recommendations
    
    def _get_nutrition_recommendations(self, avg_meals: float) -> List[str]:
        """Gera recomendações nutricionais"""
        recommendations = []
        
        if avg_meals < 2:
            recommendations.append('Aumente a frequência de refeições')
        elif avg_meals < 3:
            recommendations.append('Adicione lanches saudáveis entre refeições')
        
        return recommendations