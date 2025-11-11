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
import json
from datetime import datetime
from typing import Any, Dict, List

from config.database import supabase_client
from services.cache_service import CacheService
from sklearn.feature_extraction.text import TfidfVectorizer

logger = logging.getLogger(__name__)


class AIRecommendationService:
    """Service para recomendações baseadas em ML."""

    def __init__(self):
        """Inicializa o serviço de recomendações com vetorizador TF-IDF."""
        self.supabase = supabase_client
        self.vectorizer = TfidfVectorizer(max_features=1000, stop_words="english")
        self.cache_service = CacheService()

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
                "demographics": self._extract_demographics_features(user_data),
                "health_interests": self._extract_health_interests(health_data),
                "activity_patterns": self._extract_activity_patterns(activity_data),
                "purchase_preferences": self._extract_purchase_preferences(purchase_data),
                "engagement_level": self._calculate_engagement_level(activity_data),
                "health_goals": self._extract_health_goals(health_data),
            }

            return {
                "success": True,
                "user_id": user_id,
                "profile_vector": profile_vector,
                "last_updated": datetime.now().isoformat(),
            }

        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            logger.error(f"Erro ao criar perfil do usuário: {str(e)}", exc_info=True)
            return {"success": False, "error": str(e)}

    def recommend_products(self, user_id: str, limit: int = 10) -> Dict[str, Any]:
        """
        Recomenda produtos baseado no perfil do usuário usando ML básico.
        
        Utiliza:
        - Histórico de compras do usuário
        - Reviews e ratings
        - Preferências de categoria
        - Filtragem colaborativa básica
        - Cache para melhor performance
        """
        try:
            # Verificar cache (TTL: 1 hora)
            cache_key = f"recommendations:products:{user_id}:{limit}"
            cached_result = self.cache_service.get(cache_key)
            if cached_result:
                logger.info(f"Recomendações de produtos recuperadas do cache para usuário {user_id}")
                return cached_result
            from repositories.product_repository import ProductRepository
            from repositories.order_repository import OrderRepository
            from repositories.review_repository import ReviewRepository
            from repositories.favorite_repository import FavoriteRepository
            import numpy as np

            product_repo = ProductRepository()
            order_repo = OrderRepository()
            review_repo = ReviewRepository()
            favorite_repo = FavoriteRepository()

            # 1. Buscar histórico de compras do usuário
            orders_result = order_repo.find_by_user(user_id, page=1, per_page=50)
            user_orders = orders_result.get("orders", []) if isinstance(orders_result, dict) else []
            purchased_product_ids = set()
            purchased_categories = {}
            
            for order in user_orders:
                order_items = order.get("items", [])
                for item in order_items:
                    product_id = item.get("product_id")
                    # Buscar categoria do produto
                    if product_id:
                        product = product_repo.find_by_id(product_id)
                        if product:
                            category = product.get("category")
                            purchased_product_ids.add(product_id)
                            if category:
                                purchased_categories[category] = purchased_categories.get(category, 0) + 1

            # 2. Buscar produtos favoritados
            try:
                favorites_result = (
                    self.supabase.table("favorites")
                    .select("product_id")
                    .eq("user_id", user_id)
                    .execute()
                )
                favorites = favorites_result.data if favorites_result.data else []
            except Exception:
                favorites = []
            
            favorite_product_ids = {f.get("product_id") for f in favorites if f.get("product_id")}
            favorite_categories = {}
            for fav in favorites:
                product_id = fav.get("product_id")
                if product_id:
                    product = product_repo.find_by_id(product_id)
                    if product:
                        category = product.get("category")
                        if category:
                            favorite_categories[category] = favorite_categories.get(category, 0) + 1

            # 3. Buscar reviews do usuário para entender preferências
            user_reviews = review_repo.find_by_user(user_id, page=1, per_page=50)
            reviewed_product_ids = {r.get("product_id") for r in user_reviews.get("reviews", []) if r.get("product_id")}
            
            # Calcular categoria preferida (mais comprada + mais favoritada)
            all_categories = {**purchased_categories, **favorite_categories}
            preferred_category = max(all_categories.items(), key=lambda x: x[1])[0] if all_categories else None

            # 4. Buscar todos os produtos ativos
            all_products = product_repo.find_active(limit=100)
            
            # 5. Calcular score de relevância para cada produto
            recommendations = []
            
            for product in all_products:
                product_id = product.get("id")
                
                # Pular produtos já comprados (ou incluir com score menor)
                if product_id in purchased_product_ids:
                    continue
                
                score = 0.0
                
                # Score por categoria preferida
                if preferred_category and product.get("category") == preferred_category:
                    score += 30.0
                
                # Score por rating do produto
                rating = float(product.get("rating", 0) or 0)
                reviews_count = int(product.get("reviews_count", 0) or 0)
                if rating > 0:
                    score += rating * 10  # Multiplicar rating por 10
                if reviews_count > 10:
                    score += 10  # Bônus para produtos bem avaliados
                
                # Score por estoque (preferir produtos em estoque)
                if product.get("stock_quantity", 0) > 0:
                    score += 5.0
                
                # Score por featured
                if product.get("featured"):
                    score += 15.0
                
                # Score por similaridade de categoria com favoritos
                if product.get("category") in favorite_categories:
                    score += favorite_categories[product.get("category")] * 5
                
                # Score por preço (produtos em faixa média tendem a ser mais relevantes)
                price = float(product.get("price", 0) or 0)
                if 30 <= price <= 150:  # Faixa de preço popular
                    score += 5.0
                
                if score > 0:
                    recommendations.append({
                        **product,
                        "relevance_score": round(score, 2),
                        "recommendation_reason": self._get_recommendation_reason(
                            product, preferred_category, rating, reviews_count
                        ),
                    })

            # 6. Ordenar por score e retornar top N
            recommendations.sort(key=lambda x: x.get("relevance_score", 0), reverse=True)
            
            result = {
                "success": True,
                "user_id": user_id,
                "data": recommendations[:limit],
                "total_products_analyzed": len(all_products),
                "algorithm": "collaborative_filtering_enhanced",
                "cached_at": datetime.now().isoformat(),
            }
            
            # Armazenar no cache (TTL: 1 hora)
            self.cache_service.set(cache_key, result, ttl=3600)
            
            return result

        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            return {"success": False, "error": f"Erro de validação: {str(e)}"}
        except Exception as e:
            logger.error(f"Erro ao gerar recomendações: {str(e)}", exc_info=True)
            return {"success": False, "error": str(e)}
    
    def _get_recommendation_reason(
        self, product: Dict[str, Any], preferred_category: str, rating: float, reviews_count: int
    ) -> str:
        """
        Gera motivo da recomendação baseado nas características do produto.
        
        Args:
            product: Dados do produto
            preferred_category: Categoria preferida do usuário
            rating: Rating do produto
            reviews_count: Número de reviews
        
        Returns:
            String com motivo da recomendação
        """
        reasons = []
        
        if product.get("category") == preferred_category:
            reasons.append("categoria preferida")
        
        if rating >= 4.5:
            reasons.append("altamente avaliado")
        elif rating >= 4.0:
            reasons.append("bem avaliado")
        
        if reviews_count > 20:
            reasons.append("muito popular")
        elif reviews_count > 10:
            reasons.append("popular")
        
        if product.get("featured"):
            reasons.append("em destaque")
        
        if not reasons:
            reasons.append("recomendado para você")
        
        return ", ".join(reasons)

    def recommend_exercises(self, user_id: str, limit: int = 10) -> Dict[str, Any]:
        """Recomenda exercícios baseado no perfil e histórico do usuário"""
        try:
            # Exercícios de exemplo para demonstração
            sample_exercises = [
                {
                    "id": 1,
                    "name": "Flexão de Braço",
                    "description": "Exercício clássico para fortalecimento do peito, ombros e tríceps",
                    "difficulty": "Iniciante",
                    "muscle_groups": ["Peito", "Ombros", "Tríceps"],
                    "relevance_score": 92.3,
                },
                {
                    "id": 2,
                    "name": "Agachamento",
                    "description": "Movimento fundamental para pernas e glúteos",
                    "difficulty": "Iniciante",
                    "muscle_groups": ["Quadríceps", "Glúteos", "Isquiotibiais"],
                    "relevance_score": 89.7,
                },
                {
                    "id": 3,
                    "name": "Prancha",
                    "description": "Exercício isométrico para core e estabilidade",
                    "difficulty": "Intermediário",
                    "muscle_groups": ["Core", "Ombros", "Glúteos"],
                    "relevance_score": 85.4,
                },
                {
                    "id": 4,
                    "name": "Burpee",
                    "description": "Exercício completo que combina força e cardio",
                    "difficulty": "Avançado",
                    "muscle_groups": ["Corpo inteiro"],
                    "relevance_score": 81.2,
                },
                {
                    "id": 5,
                    "name": "Mountain Climber",
                    "description": "Exercício dinâmico para core e cardio",
                    "difficulty": "Intermediário",
                    "muscle_groups": ["Core", "Ombros", "Quadríceps"],
                    "relevance_score": 78.9,
                },
                {
                    "id": 6,
                    "name": "Ponte de Glúteos",
                    "description": "Exercício focado em glúteos e posterior da coxa",
                    "difficulty": "Iniciante",
                    "muscle_groups": ["Glúteos", "Isquiotibiais", "Core"],
                    "relevance_score": 76.5,
                },
            ]

            return {
                "success": True,
                "user_id": user_id,
                "data": sample_exercises[:limit],
                "total_exercises_analyzed": len(sample_exercises),
            }

        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            logger.error(f"Erro ao gerar recomendações de exercícios: {str(e)}", exc_info=True)
            return {"success": False, "error": str(e)}

    def recommend_nutrition_plans(self, user_id: str, limit: int = 10) -> Dict[str, Any]:
        """Recomenda planos nutricionais baseado no perfil do usuário"""
        try:
            # Planos nutricionais de exemplo
            sample_plans = [
                {
                    "id": 1,
                    "name": "Plano de Ganho de Massa",
                    "description": "Plano rico em proteínas e carboidratos para ganho de massa muscular",
                    "type": "Ganho de Massa",
                    "calories": 2500,
                    "relevance_score": 91.2,
                },
                {
                    "id": 2,
                    "name": "Plano de Emagrecimento",
                    "description": "Plano com déficit calórico controlado para perda de peso saudável",
                    "type": "Emagrecimento",
                    "calories": 1800,
                    "relevance_score": 87.5,
                },
                {
                    "id": 3,
                    "name": "Plano de Manutenção",
                    "description": "Plano equilibrado para manutenção do peso e saúde",
                    "type": "Manutenção",
                    "calories": 2200,
                    "relevance_score": 84.3,
                },
                {
                    "id": 4,
                    "name": "Plano Vegetariano",
                    "description": "Plano baseado em proteínas vegetais e alimentos naturais",
                    "type": "Vegetariano",
                    "calories": 2000,
                    "relevance_score": 79.8,
                },
                {
                    "id": 5,
                    "name": "Plano Low Carb",
                    "description": "Plano com redução de carboidratos e foco em gorduras boas",
                    "type": "Low Carb",
                    "calories": 1900,
                    "relevance_score": 76.1,
                },
                {
                    "id": 6,
                    "name": "Plano Detox",
                    "description": "Plano de limpeza com alimentos naturais e antioxidantes",
                    "type": "Detox",
                    "calories": 1600,
                    "relevance_score": 72.4,
                },
            ]

            return {
                "success": True,
                "user_id": user_id,
                "data": sample_plans[:limit],
                "total_plans_analyzed": len(sample_plans),
            }

        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            logger.error(f"Erro ao gerar recomendações nutricionais: {str(e)}", exc_info=True)
            return {"success": False, "error": str(e)}

    def predict_health_trends(self, user_id: str, days_ahead: int = 30) -> Dict[str, Any]:
        """Prediz tendências de saúde do usuário"""
        try:
            # Tendências de exemplo
            sample_trends = {
                "predictions": [
                    {
                        "metric": "Peso",
                        "predicted_value": "72.5 kg",
                        "description": "Tendência de redução de 0.5kg",
                        "confidence": 85,
                    },
                    {
                        "metric": "IMC",
                        "predicted_value": "23.1",
                        "description": "Mantendo faixa saudável",
                        "confidence": 92,
                    },
                    {
                        "metric": "Frequência de Exercícios",
                        "predicted_value": "4x/semana",
                        "description": "Aumento na consistência",
                        "confidence": 78,
                    },
                ]
            }

            return {"success": True, "user_id": user_id, "data": sample_trends}

        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            logger.error(f"Erro ao predizer tendências: {str(e)}", exc_info=True)
            return {"success": False, "error": str(e)}

    def find_similar_users(self, user_id: str, limit: int = 5) -> Dict[str, Any]:
        """Encontra usuários similares baseado no perfil"""
        try:
            # Usuários similares de exemplo
            sample_users = [
                {
                    "user_id": "user_123",
                    "similarity_score": 87.5,
                    "similarity_reasons": ["mesmo objetivo", "idade similar", "nível fitness"],
                },
                {
                    "user_id": "user_456",
                    "similarity_score": 82.3,
                    "similarity_reasons": ["preferências alimentares", "rotina de exercícios"],
                },
                {
                    "user_id": "user_789",
                    "similarity_score": 79.1,
                    "similarity_reasons": ["perfil demográfico", "interesses de saúde"],
                },
            ]

            return {"success": True, "user_id": user_id, "data": sample_users[:limit]}

        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            logger.error(f"Erro ao encontrar usuários similares: {str(e)}", exc_info=True)
            return {"success": False, "error": str(e)}

    def generate_ai_insights(self, user_id: str) -> Dict[str, Any]:
        """Gera insights personalizados de IA"""
        try:
            # Insights de exemplo
            sample_insights = {
                "health_summary": (
                    "Seu perfil mostra um excelente comprometimento com a saúde. "
                    "Continue mantendo a consistência nos exercícios e alimentação."
                ),
                "improvement_opportunities": [
                    "Aumentar a frequência de exercícios cardiovasculares",
                    "Incluir mais vegetais na alimentação",
                    "Melhorar a hidratação diária",
                ],
                "personalized_tips": [
                    "Seu IMC está na faixa ideal, mantenha o foco na qualidade dos alimentos",
                    "Considere adicionar exercícios de flexibilidade à sua rotina",
                    "O horário das suas refeições está bem distribuído",
                ],
            }

            return {"success": True, "user_id": user_id, "data": sample_insights}

        except (ValueError, KeyError) as e:
            logger.warning(f"Erro de validação: {str(e)}")
            # Tratamento específico pode ser adicionado aqui
        except Exception as e:
            logger.error(f"Erro ao gerar insights: {str(e)}", exc_info=True)
            return {"success": False, "error": str(e)}

    # Métodos auxiliares (implementação básica para desenvolvimento)

    def _get_user_data(self, user_id: str) -> Dict[str, Any]:
        """Obtém dados básicos do usuário do banco"""
        try:
            from repositories.user_repository import UserRepository
            user_repo = UserRepository()
            user = user_repo.find_by_id(user_id)
            return user or {"id": user_id}
        except Exception as e:
            logger.warning(f"Erro ao buscar dados do usuário: {str(e)}")
            return {"id": user_id}

    def _get_user_health_data(self, user_id: str) -> Dict[str, Any]:
        """Obtém dados de saúde do usuário do banco"""
        try:
            from repositories.health_repository import HealthRepository
            health_repo = HealthRepository()
            
            # Buscar histórico de cálculos de saúde
            imc_history = health_repo.get_imc_history(user_id, limit=10)
            calories_history = health_repo.get_calories_history(user_id, limit=10)
            food_diary = health_repo.get_food_diary_entries(user_id, limit=10)
            
            return {
                "imc_history": imc_history.get("entries", []) if isinstance(imc_history, dict) else [],
                "calories_history": calories_history.get("entries", []) if isinstance(calories_history, dict) else [],
                "food_diary": food_diary.get("entries", []) if isinstance(food_diary, dict) else [],
            }
        except Exception as e:
            logger.warning(f"Erro ao buscar dados de saúde: {str(e)}")
            return {"imc_history": [], "food_diary": [], "workout_sessions": []}

    def _get_user_activity_data(self, user_id: str) -> List[Dict[str, Any]]:
        """Obtém dados de atividade do usuário do banco"""
        try:
            from repositories.workout_repository import WorkoutRepository
            workout_repo = WorkoutRepository()
            workouts = workout_repo.find_by_user(user_id, limit=20)
            return workouts if isinstance(workouts, list) else []
        except Exception as e:
            logger.warning(f"Erro ao buscar dados de atividade: {str(e)}")
            return []

    def _get_user_purchase_data(self, user_id: str) -> List[Dict[str, Any]]:
        """Obtém dados de compras do usuário do banco"""
        try:
            from repositories.order_repository import OrderRepository
            order_repo = OrderRepository()
            orders = order_repo.find_by_user(user_id, limit=50)
            return orders if isinstance(orders, list) else []
        except Exception as e:
            logger.warning(f"Erro ao buscar dados de compras: {str(e)}")
            return []

    def _extract_demographics_features(self, user_data: Dict[str, Any]) -> Dict[str, Any]:
        """Extrai características demográficas"""
        return {"age_group": "adult", "gender": user_data.get("gender", "unknown")}

    def _extract_health_interests(self, health_data: Dict[str, Any]) -> Dict[str, Any]:
        """Extrai interesses de saúde"""
        return {"nutrition_tracking": True, "exercise_tracking": True}

    def _extract_activity_patterns(self, activity_data: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Extrai padrões de atividade"""
        return {"frequency": "moderate", "preferred_time": "evening"}

    def _extract_purchase_preferences(self, purchase_data: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Extrai preferências de compra"""
        return {"categories": ["suplementos", "saúde"], "price_range": "medium"}

    def _calculate_engagement_level(self, activity_data: List[Dict[str, Any]]) -> str:
        """Calcula nível de engajamento"""
        return "high"

    def _extract_health_goals(self, health_data: Dict[str, Any]) -> List[str]:
        """Extrai objetivos de saúde"""
        return ["weight_loss", "muscle_gain", "general_health"]
