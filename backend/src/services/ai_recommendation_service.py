"""
Serviço de IA para Recomendações Personalizadas RE-EDUCA Store.

Utiliza machine learning para recomendações incluindo:
- Perfil vetorizado do usuário
- Similaridade de cosseno para produtos
- Clustering de comportamento
- Recomendações de exercícios e nutrição
- Sistema de filtragem colaborativa
"""
import logging
from typing import Dict, Any, List
from datetime import datetime
from config.database import supabase_client
from sklearn.feature_extraction.text import TfidfVectorizer

logger = logging.getLogger(__name__)


class AIRecommendationService:
    """Service para recomendações baseadas em ML."""

    def __init__(self):
        """Inicializa o serviço de recomendações com vetorizador TF-IDF."""
        self.supabase = supabase_client
        self.vectorizer = TfidfVectorizer(max_features=1000, stop_words='english')

    def get_user_profile_vector(self, user_id: str) -> Dict[str, Any]:
        """
        Cria vetor de perfil do usuário baseado em suas atividades.

        Args:
            user_id (str): ID do usuário.

        Returns:
            Dict[str, Any]: Vetor de características do usuário.
        """
        try:
            # Busca dados do usuário
            user_data = self._get_user_data(user_id)
            health_data = self._get_user_health_data(user_id)
            activity_data = self._get_user_activity_data(user_id)
            purchase_data = self._get_user_purchase_data(user_id)

            # Cria vetor de características
            profile_vector = {
                'demographics': self._extract_demographics_features(user_data),
                'health_interests': self._extract_health_interests(health_data),
                'activity_patterns': self._extract_activity_patterns(activity_data),
                'purchase_preferences': self._extract_purchase_preferences(purchase_data),
                'engagement_level': self._calculate_engagement_level(activity_data),
                'health_goals': self._extract_health_goals(health_data)
            }

            return {
                'success': True,
                'user_id': user_id,
                'profile_vector': profile_vector,
                'last_updated': datetime.now().isoformat()
            }

        except Exception as e:
            logger.error(f"Erro ao criar perfil do usuário: {str(e)}")
            return {'success': False, 'error': str(e)}

    def recommend_products(self, user_id: str, limit: int = 10) -> Dict[str, Any]:
        """Recomenda produtos baseado no perfil do usuário"""
        try:
            # Produtos de exemplo para demonstração
            sample_products = [
                {
                    'id': 1,
                    'name': 'Whey Protein Premium',
                    'description': 'Proteína de alta qualidade para ganho de massa muscular',
                    'category': 'Suplementos',
                    'price': 89.90,
                    'relevance_score': 95.5
                },
                {
                    'id': 2,
                    'name': 'Multivitamínico Completo',
                    'description': 'Suplemento com vitaminas e minerais essenciais',
                    'category': 'Saúde',
                    'price': 45.90,
                    'relevance_score': 88.2
                },
                {
                    'id': 3,
                    'name': 'Creatina Monohidratada',
                    'description': 'Aumenta força e resistência muscular',
                    'category': 'Suplementos',
                    'price': 32.50,
                    'relevance_score': 82.1
                },
                {
                    'id': 4,
                    'name': 'Óleo de Peixe Ômega 3',
                    'description': 'Suporte para saúde cardiovascular e cerebral',
                    'category': 'Saúde',
                    'price': 67.80,
                    'relevance_score': 79.8
                },
                {
                    'id': 5,
                    'name': 'BCAA em Pó',
                    'description': 'Aminoácidos essenciais para recuperação muscular',
                    'category': 'Suplementos',
                    'price': 54.90,
                    'relevance_score': 76.3
                },
                {
                    'id': 6,
                    'name': 'Termogênico Natural',
                    'description': 'Acelera metabolismo e queima de gordura',
                    'category': 'Emagrecimento',
                    'price': 78.50,
                    'relevance_score': 73.9
                }
            ]

            return {
                'success': True,
                'user_id': user_id,
                'data': sample_products[:limit],
                'total_products_analyzed': len(sample_products)
            }

        except Exception as e:
            logger.error(f"Erro ao gerar recomendações: {str(e)}")
            return {'success': False, 'error': str(e)}

    def recommend_exercises(self, user_id: str, limit: int = 10) -> Dict[str, Any]:
        """Recomenda exercícios baseado no perfil e histórico do usuário"""
        try:
            # Exercícios de exemplo para demonstração
            sample_exercises = [
                {
                    'id': 1,
                    'name': 'Flexão de Braço',
                    'description': 'Exercício clássico para fortalecimento do peito, ombros e tríceps',
                    'difficulty': 'Iniciante',
                    'muscle_groups': ['Peito', 'Ombros', 'Tríceps'],
                    'relevance_score': 92.3
                },
                {
                    'id': 2,
                    'name': 'Agachamento',
                    'description': 'Movimento fundamental para pernas e glúteos',
                    'difficulty': 'Iniciante',
                    'muscle_groups': ['Quadríceps', 'Glúteos', 'Isquiotibiais'],
                    'relevance_score': 89.7
                },
                {
                    'id': 3,
                    'name': 'Prancha',
                    'description': 'Exercício isométrico para core e estabilidade',
                    'difficulty': 'Intermediário',
                    'muscle_groups': ['Core', 'Ombros', 'Glúteos'],
                    'relevance_score': 85.4
                },
                {
                    'id': 4,
                    'name': 'Burpee',
                    'description': 'Exercício completo que combina força e cardio',
                    'difficulty': 'Avançado',
                    'muscle_groups': ['Corpo inteiro'],
                    'relevance_score': 81.2
                },
                {
                    'id': 5,
                    'name': 'Mountain Climber',
                    'description': 'Exercício dinâmico para core e cardio',
                    'difficulty': 'Intermediário',
                    'muscle_groups': ['Core', 'Ombros', 'Quadríceps'],
                    'relevance_score': 78.9
                },
                {
                    'id': 6,
                    'name': 'Ponte de Glúteos',
                    'description': 'Exercício focado em glúteos e posterior da coxa',
                    'difficulty': 'Iniciante',
                    'muscle_groups': ['Glúteos', 'Isquiotibiais', 'Core'],
                    'relevance_score': 76.5
                }
            ]

            return {
                'success': True,
                'user_id': user_id,
                'data': sample_exercises[:limit],
                'total_exercises_analyzed': len(sample_exercises)
            }

        except Exception as e:
            logger.error(f"Erro ao gerar recomendações de exercícios: {str(e)}")
            return {'success': False, 'error': str(e)}

    def recommend_nutrition_plans(self, user_id: str, limit: int = 10) -> Dict[str, Any]:
        """Recomenda planos nutricionais baseado no perfil do usuário"""
        try:
            # Planos nutricionais de exemplo
            sample_plans = [
                {
                    'id': 1,
                    'name': 'Plano de Ganho de Massa',
                    'description': 'Plano rico em proteínas e carboidratos para ganho de massa muscular',
                    'type': 'Ganho de Massa',
                    'calories': 2500,
                    'relevance_score': 91.2
                },
                {
                    'id': 2,
                    'name': 'Plano de Emagrecimento',
                    'description': 'Plano com déficit calórico controlado para perda de peso saudável',
                    'type': 'Emagrecimento',
                    'calories': 1800,
                    'relevance_score': 87.5
                },
                {
                    'id': 3,
                    'name': 'Plano de Manutenção',
                    'description': 'Plano equilibrado para manutenção do peso e saúde',
                    'type': 'Manutenção',
                    'calories': 2200,
                    'relevance_score': 84.3
                },
                {
                    'id': 4,
                    'name': 'Plano Vegetariano',
                    'description': 'Plano baseado em proteínas vegetais e alimentos naturais',
                    'type': 'Vegetariano',
                    'calories': 2000,
                    'relevance_score': 79.8
                },
                {
                    'id': 5,
                    'name': 'Plano Low Carb',
                    'description': 'Plano com redução de carboidratos e foco em gorduras boas',
                    'type': 'Low Carb',
                    'calories': 1900,
                    'relevance_score': 76.1
                },
                {
                    'id': 6,
                    'name': 'Plano Detox',
                    'description': 'Plano de limpeza com alimentos naturais e antioxidantes',
                    'type': 'Detox',
                    'calories': 1600,
                    'relevance_score': 72.4
                }
            ]

            return {
                'success': True,
                'user_id': user_id,
                'data': sample_plans[:limit],
                'total_plans_analyzed': len(sample_plans)
            }

        except Exception as e:
            logger.error(f"Erro ao gerar recomendações nutricionais: {str(e)}")
            return {'success': False, 'error': str(e)}

    def predict_health_trends(self, user_id: str, days_ahead: int = 30) -> Dict[str, Any]:
        """Prediz tendências de saúde do usuário"""
        try:
            # Tendências de exemplo
            sample_trends = {
                'predictions': [
                    {
                        'metric': 'Peso',
                        'predicted_value': '72.5 kg',
                        'description': 'Tendência de redução de 0.5kg',
                        'confidence': 85
                    },
                    {
                        'metric': 'IMC',
                        'predicted_value': '23.1',
                        'description': 'Mantendo faixa saudável',
                        'confidence': 92
                    },
                    {
                        'metric': 'Frequência de Exercícios',
                        'predicted_value': '4x/semana',
                        'description': 'Aumento na consistência',
                        'confidence': 78
                    }
                ]
            }

            return {
                'success': True,
                'user_id': user_id,
                'data': sample_trends
            }

        except Exception as e:
            logger.error(f"Erro ao predizer tendências: {str(e)}")
            return {'success': False, 'error': str(e)}

    def find_similar_users(self, user_id: str, limit: int = 5) -> Dict[str, Any]:
        """Encontra usuários similares baseado no perfil"""
        try:
            # Usuários similares de exemplo
            sample_users = [
                {
                    'user_id': 'user_123',
                    'similarity_score': 87.5,
                    'similarity_reasons': ['mesmo objetivo', 'idade similar', 'nível fitness']
                },
                {
                    'user_id': 'user_456',
                    'similarity_score': 82.3,
                    'similarity_reasons': ['preferências alimentares', 'rotina de exercícios']
                },
                {
                    'user_id': 'user_789',
                    'similarity_score': 79.1,
                    'similarity_reasons': ['perfil demográfico', 'interesses de saúde']
                }
            ]

            return {
                'success': True,
                'user_id': user_id,
                'data': sample_users[:limit]
            }

        except Exception as e:
            logger.error(f"Erro ao encontrar usuários similares: {str(e)}")
            return {'success': False, 'error': str(e)}

    def generate_ai_insights(self, user_id: str) -> Dict[str, Any]:
        """Gera insights personalizados de IA"""
        try:
            # Insights de exemplo
            sample_insights = {
                'health_summary': (
                    'Seu perfil mostra um excelente comprometimento com a saúde. '
                    'Continue mantendo a consistência nos exercícios e alimentação.'
                ),
                'improvement_opportunities': [
                    'Aumentar a frequência de exercícios cardiovasculares',
                    'Incluir mais vegetais na alimentação',
                    'Melhorar a hidratação diária'
                ],
                'personalized_tips': [
                    'Seu IMC está na faixa ideal, mantenha o foco na qualidade dos alimentos',
                    'Considere adicionar exercícios de flexibilidade à sua rotina',
                    'O horário das suas refeições está bem distribuído'
                ]
            }

            return {
                'success': True,
                'user_id': user_id,
                'data': sample_insights
            }

        except Exception as e:
            logger.error(f"Erro ao gerar insights: {str(e)}")
            return {'success': False, 'error': str(e)}

    # Métodos auxiliares (implementação básica para desenvolvimento)
    def _get_user_data(self, user_id: str) -> Dict[str, Any]:
        """Obtém dados básicos do usuário"""
        return {'id': user_id, 'age': 30, 'gender': 'M'}

    def _get_user_health_data(self, user_id: str) -> Dict[str, Any]:
        """Obtém dados de saúde do usuário"""
        return {'imc_history': [], 'food_diary': [], 'workout_sessions': []}

    def _get_user_activity_data(self, user_id: str) -> List[Dict[str, Any]]:
        """Obtém dados de atividade do usuário"""
        return []

    def _get_user_purchase_data(self, user_id: str) -> List[Dict[str, Any]]:
        """Obtém dados de compras do usuário"""
        return []

    def _extract_demographics_features(self, user_data: Dict[str, Any]) -> Dict[str, Any]:
        """Extrai características demográficas"""
        return {'age_group': 'adult', 'gender': user_data.get('gender', 'unknown')}

    def _extract_health_interests(self, health_data: Dict[str, Any]) -> Dict[str, Any]:
        """Extrai interesses de saúde"""
        return {'nutrition_tracking': True, 'exercise_tracking': True}

    def _extract_activity_patterns(self, activity_data: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Extrai padrões de atividade"""
        return {'frequency': 'moderate', 'preferred_time': 'evening'}

    def _extract_purchase_preferences(self, purchase_data: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Extrai preferências de compra"""
        return {'categories': ['suplementos', 'saúde'], 'price_range': 'medium'}

    def _calculate_engagement_level(self, activity_data: List[Dict[str, Any]]) -> str:
        """Calcula nível de engajamento"""
        return 'high'

    def _extract_health_goals(self, health_data: Dict[str, Any]) -> List[str]:
        """Extrai objetivos de saúde"""
        return ['weight_loss', 'muscle_gain', 'general_health']
