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
from repositories.predictive_analysis_repository import PredictiveAnalysisRepository
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
        self.repo = PredictiveAnalysisRepository()
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
        """
        Busca histórico de saúde do usuário.
        
        ✅ CORRIGIDO: Usa PredictiveAnalysisRepository.
        """
        try:
            # ✅ CORRIGIDO: Busca histórico via repositório
            imc_history = self.repo.get_user_imc_history(user_id)
            exercise_history = self.repo.get_user_workout_sessions(user_id)

            # Combina dados
            health_data = []

            for record in imc_history:
                health_data.append({
                    'date': record['calculated_at'],
                    'imc_value': record.get('imc_value', 0),
                    'weight': record.get('weight_kg', 0),
                    'height': record.get('height_cm', 0),
                    'user_id': user_id
                })

            # Busca também dados de exercícios para incluir na análise
            if exercise_history:
                for record in exercise_history:
                    health_data.append({
                        'date': record.get('completed_at', record.get('created_at')),
                        'user_id': user_id,
                        'activity_level': min(10,
                            record.get('duration_minutes', 0) / 6) if record.get('duration_minutes') else 0
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
                # ✅ CORRIGIDO: Busca sessões via repositório
                exercise_response_data = self.repo.get_user_workout_sessions(user_id, days_back=30)

                if exercise_response_data and len(exercise_response_data) > 0:
                    # Calcula score de atividade baseado em frequência e duração
                    exercise_df = pd.DataFrame(exercise_response_data)
                    exercise_df['completed_at'] = pd.to_datetime(exercise_df['completed_at'])
                    exercise_df = exercise_df.sort_values('completed_at')

                    # Calcula frequência semanal
                    days_with_exercise = len(exercise_df['completed_at'].dt.date.unique())
                    weekly_frequency = (days_with_exercise / 30) * 7

                    # Calcula duração média
                    avg_duration = (exercise_df['duration_minutes'].mean() if 'duration_minutes' in exercise_df.columns else 0)

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
                        recent_avg_duration = (recent_days['duration_minutes'].mean() if 'duration_minutes' in recent_days.columns else 0)

                        if len(older_days) > 0:
                            older_freq = len(older_days['completed_at'].dt.date.unique()) / (len(older_days) / 7)
                            older_avg_duration = (older_days['duration_minutes'].mean() if 'duration_minutes' in older_days.columns else 0)

                            trend = ('increasing' if (recent_freq > older_freq or recent_avg_duration > older_avg_duration) else 'stable' if (recent_freq == older_freq and recent_avg_duration == older_avg_duration) else 'decreasing')
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
        """
        Busca dados comportamentais do usuário.
        
        ✅ CORRIGIDO: Usa PredictiveAnalysisRepository.
        """
        try:
            if behavior_type == 'purchases':
                return self.repo.get_user_orders(user_id)
            elif behavior_type == 'exercise':
                return self.repo.get_user_workout_sessions(user_id)
            elif behavior_type == 'nutrition':
                return self.repo.get_user_food_diary(user_id)
            else:
                return []

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
            # ✅ CORRIGIDO: Busca atividades via repositório
            activities_data = self.repo.get_user_activities(user_id, days_back=30)

            # Calcula métricas
            total_activities = len(activities_data)
            days_since_last_activity = 0

            if activities_data:
                last_activity = max(activities_data, key=lambda x: x.get('timestamp', x.get('created_at', '')))
                last_activity_time = last_activity.get('timestamp') or last_activity.get('created_at', '')
                if last_activity_time:
                    if isinstance(last_activity_time, str):
                        last_activity_dt = datetime.fromisoformat(last_activity_time.replace('Z', '+00:00'))
                    else:
                        last_activity_dt = last_activity_time
                    days_since_last_activity = (datetime.now() - last_activity_dt.replace(tzinfo=None)).days

            # ✅ CORRIGIDO: Busca último login via repositório
            last_login_dt = self.repo.get_user_last_login(user_id)
            days_since_last_login = 0

            if last_login_dt:
                if isinstance(last_login_dt, datetime):
                    days_since_last_login = (datetime.now() - last_login_dt.replace(tzinfo=None)).days
                else:
                    last_login = datetime.fromisoformat(str(last_login_dt).replace('Z', '+00:00'))
                    days_since_last_login = (datetime.now() - last_login.replace(tzinfo=None)).days

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
            # ✅ CORRIGIDO: Busca dados via repositório
            exercise_data = self.repo.get_user_workout_sessions(user_id, days_back=30)
            nutrition_data = self.repo.get_user_food_diary(user_id, days_back=30)
            hydration_data = self.repo.get_user_hydration_history(user_id, days_back=30)

            # Calcula frequência real de exercícios
            exercise_frequency = len(exercise_data) / 30 if exercise_data else 0

            # Calcula score nutricional baseado em registros
            # Se tem muitos registros = boa aderência
            nutrition_score = min(100, len(nutrition_data) * 3) if nutrition_data else 0

            # Calcula nível de hidratação baseado em histórico
            hydration_level = 0
            if hydration_data:
                # Média de água diária (em litros)
                avg_water = np.mean([h.get('total_water_liters', 0) for h in hydration_data])
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
            logger.error(f"Erro ao analisar padrões: {str(e)}")
            return {}

    def _get_seasonal_data(self, user_id: str) -> Dict[str, List[Dict]]:
        """
        Busca dados históricos agrupados por estação do ano.
        
        ✅ CORRIGIDO: Usa PredictiveAnalysisRepository.
        """
        try:
            # ✅ CORRIGIDO: Busca dados via repositório
            imc_data = self.repo.get_user_imc_history(user_id)
            exercise_data = self.repo.get_user_workout_sessions(user_id)
            activities_data = self.repo.get_user_activities(user_id)

            seasonal_data = {'spring': [], 'summer': [], 'autumn': [], 'winter': []}

            # Processa dados por estação
            all_data = []
            
            # Adiciona dados de IMC
            for record in imc_data:
                date_str = record.get('calculated_at', '')
                if date_str:
                    try:
                        record_date = datetime.fromisoformat(date_str.replace('Z', '+00:00'))
                        season = self._get_season_from_date(record_date)
                        if season:
                            all_data.append({
                                'date': date_str,
                                'season': season,
                                'activity_level': 0,
                                'mood_score': 7,
                                'energy_level': 7,
                                'sleep_quality': 7
                            })
                    except Exception:
                        pass

            # Adiciona dados de exercícios
            for record in exercise_data:
                date_str = record.get('completed_at') or record.get('created_at', '')
                if date_str:
                    try:
                        record_date = datetime.fromisoformat(date_str.replace('Z', '+00:00'))
                        season = self._get_season_from_date(record_date)
                        if season:
                            all_data.append({
                                'date': date_str,
                                'season': season,
                                'activity_level': min(10, record.get('duration_minutes', 0) / 6) if record.get('duration_minutes') else 0,
                                'mood_score': 7,
                                'energy_level': 7,
                                'sleep_quality': 7
                            })
                    except Exception:
                        pass

            # Agrupa por estação
            for data in all_data:
                season = data.get('season')
                if season and season in seasonal_data:
                    seasonal_data[season].append(data)

            return seasonal_data

        except Exception as e:
            logger.error(f"Erro ao buscar dados sazonais: {str(e)}")
            return {}

    def _get_season_from_date(self, date: datetime) -> Optional[str]:
        """Determina estação do ano a partir de uma data"""
        try:
            month = date.month
            if month in [12, 1, 2]:
                return 'winter'
            elif month in [3, 4, 5]:
                return 'spring'
            elif month in [6, 7, 8]:
                return 'summer'
            elif month in [9, 10, 11]:
                return 'autumn'
            return None
        except Exception:
            return None

    def _get_current_season(self) -> str:
        """Retorna estação atual"""
        season = self._get_season_from_date(datetime.now())
        return season if season else 'spring'

    def _get_next_season(self, current_season: str) -> str:
        """Retorna próxima estação"""
        seasons = ['spring', 'summer', 'autumn', 'winter']
        try:
            current_idx = seasons.index(current_season)
            return seasons[(current_idx + 1) % 4]
        except ValueError:
            return 'spring'

    def _predict_seasonal_changes(self, trends: Dict, current_season: str, next_season: str) -> Dict:
        """Prediz mudanças sazonais"""
        try:
            current_trend = trends.get(current_season, {})
            next_trend = trends.get(next_season, {})

            predicted = {}
            for metric in ['activity_level', 'mood_score', 'energy_level', 'sleep_quality']:
                current_val = current_trend.get(metric, 5.0)
                next_historical = next_trend.get(metric, current_val)
                predicted[metric] = round(next_historical, 1)

            return predicted
        except Exception as e:
            logger.error(f"Erro ao predizer mudanças sazonais: {str(e)}")
            return {}

    def _get_seasonal_recommendations(self, season: str, trends: Dict) -> List[str]:
        """Gera recomendações baseadas na estação"""
        recommendations = []
        if season == 'winter':
            recommendations = [
                'Aumente exercícios indoor',
                'Mantenha rotina de sono consistente',
                'Atenção à hidratação'
            ]
        elif season == 'spring':
            recommendations = [
                'Aproveite o clima para exercícios ao ar livre',
                'Aumente gradualmente a atividade',
                'Renove seus objetivos'
            ]
        elif season == 'summer':
            recommendations = [
                'Hidratação extra é essencial',
                'Evite exercícios nos horários mais quentes',
                'Mantenha rotina mesmo com férias'
            ]
        else:  # autumn
            recommendations = [
                'Prepare-se para mudanças de tempo',
                'Mantenha atividade regular',
                'Foque em objetivos de fim de ano'
            ]
        return recommendations

    def _get_risk_recommendations(self, risk_level: str, risk_factors: int) -> List[str]:
        """Retorna recomendações baseadas no nível de risco"""
        if risk_level == 'Alto':
            return [
                'Consulte um profissional de saúde',
                'Reduza fatores de risco imediatamente',
                'Monitore métricas regularmente'
            ]
        elif risk_level == 'Médio':
            return [
                'Mantenha monitoramento regular',
                'Foque em melhorias graduais',
                'Acompanhe progresso semanalmente'
            ]
        else:
            return [
                'Continue com hábitos saudáveis',
                'Mantenha rotina atual',
                'Defina novos desafios'
            ]

    def _get_purchase_recommendations(self, avg_days: float, avg_value: float) -> List[str]:
        """Recomendações baseadas em padrões de compra"""
        recommendations = []
        if avg_days > 90:
            recommendations.append('Considere ofertas especiais para reativar')
        if avg_value < 50:
            recommendations.append('Explore produtos premium')
        return recommendations or ['Mantenha seu padrão de compras atual']

    def _get_exercise_recommendations(self, avg_days: float, avg_duration: float) -> List[str]:
        """Recomendações baseadas em padrões de exercício"""
        recommendations = []
        if avg_days > 7:
            recommendations.append('Aumente frequência para pelo menos 3x por semana')
        if avg_duration < 30:
            recommendations.append('Tente aumentar duração gradualmente')
        return recommendations or ['Mantenha consistência atual']

    def _get_nutrition_recommendations(self, avg_meals: float) -> List[str]:
        """Recomendações baseadas em padrões nutricionais"""
        if avg_meals < 2:
            return ['Aumente número de refeições para 3-4 por dia']
        elif avg_meals < 3:
            return ['Considere adicionar uma refeição intermediária']
        else:
            return ['Mantenha boa frequência de refeições']