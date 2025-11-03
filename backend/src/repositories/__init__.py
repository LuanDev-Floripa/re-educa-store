# -*- coding: utf-8 -*-
"""
Repositórios RE-EDUCA Store.

Camada de abstração para acesso a dados.
Services devem usar repositórios ao invés de acessar Supabase diretamente.
"""
from repositories.base_repository import BaseRepository
from repositories.health_repository import HealthRepository
from repositories.user_repository import UserRepository
from repositories.product_repository import ProductRepository
from repositories.exercise_repository import ExerciseRepository
from repositories.order_repository import OrderRepository
from repositories.ai_repository import AIRepository
from repositories.goal_repository import GoalRepository
from repositories.workout_repository import WorkoutRepository
from repositories.workout_plan_repository import WorkoutPlanRepository
from repositories.social_repository import SocialRepository
from repositories.coupon_repository import CouponRepository
from repositories.coupon_usage_repository import CouponUsageRepository
from repositories.two_factor_repository import TwoFactorRepository
from repositories.affiliate_repository import AffiliateRepository
from repositories.lgpd_repository import LGPDRepository
from repositories.video_repository import VideoRepository
from repositories.ai_config_repository import AIConfigRepository
from repositories.ai_key_rotation_repository import AIKeyRotationRepository
from repositories.predictive_analysis_repository import PredictiveAnalysisRepository
from repositories.promotion_repository import PromotionRepository
from repositories.cart_repository import CartRepository

__all__ = [
    'BaseRepository',
    'HealthRepository',
    'UserRepository',
    'ProductRepository',
    'ExerciseRepository',
    'OrderRepository',
    'AIRepository',
    'GoalRepository',
    'WorkoutRepository',
    'WorkoutPlanRepository',
    'SocialRepository',
    'CouponRepository',
    'CouponUsageRepository',
    'TwoFactorRepository',
    'InventoryRepository',
    'AffiliateRepository',
    'LGPDRepository',
    'VideoRepository',
    'AIConfigRepository',
    'AIKeyRotationRepository',
    'PredictiveAnalysisRepository',
    'PromotionRepository',
    'CartRepository',
]
