# -*- coding: utf-8 -*-
"""
Repositórios RE-EDUCA Store.

Camada de abstração para acesso a dados.
Services devem usar repositórios ao invés de acessar Supabase diretamente.
"""
from repositories.account_verification_repository import AccountVerificationRepository
from repositories.affiliate_repository import AffiliateRepository
from repositories.ai_config_repository import AIConfigRepository
from repositories.ai_key_rotation_repository import AIKeyRotationRepository
from repositories.ai_repository import AIRepository
from repositories.base_repository import BaseRepository
from repositories.cart_repository import CartRepository
from repositories.coupon_repository import CouponRepository
from repositories.coupon_usage_repository import CouponUsageRepository
from repositories.exercise_repository import ExerciseRepository
from repositories.favorite_repository import FavoriteRepository
from repositories.goal_repository import GoalRepository
from repositories.groups_repository import GroupsRepository
from repositories.health_repository import HealthRepository
from repositories.inventory_repository import InventoryRepository
from repositories.lgpd_repository import LGPDRepository
from repositories.messages_repository import MessagesRepository
from repositories.order_item_repository import OrderItemRepository
from repositories.order_repository import OrderRepository
from repositories.predictive_analysis_repository import PredictiveAnalysisRepository
from repositories.product_repository import ProductRepository
from repositories.promotion_repository import PromotionRepository
from repositories.shipping_repository import ShippingRepository
from repositories.social_repository import SocialRepository
from repositories.subscription_repository import SubscriptionRepository
from repositories.transaction_repository import TransactionRepository
from repositories.two_factor_repository import TwoFactorRepository
from repositories.user_repository import UserRepository
from repositories.video_repository import VideoRepository
from repositories.workout_plan_repository import WorkoutPlanRepository
from repositories.workout_repository import WorkoutRepository

__all__ = [
    "BaseRepository",
    "HealthRepository",
    "UserRepository",
    "ProductRepository",
    "ExerciseRepository",
    "OrderRepository",
    "OrderItemRepository",
    "AIRepository",
    "GoalRepository",
    "WorkoutRepository",
    "WorkoutPlanRepository",
    "SocialRepository",
    "CouponRepository",
    "CouponUsageRepository",
    "TwoFactorRepository",
    "InventoryRepository",
    "AffiliateRepository",
    "LGPDRepository",
    "VideoRepository",
    "AIConfigRepository",
    "AIKeyRotationRepository",
    "PredictiveAnalysisRepository",
    "PromotionRepository",
    "ReviewRepository",
    "CartRepository",
    "SubscriptionRepository",
    "TransactionRepository",
    "AccountVerificationRepository",
    "ShippingRepository",
    "GroupsRepository",
    "MessagesRepository",
    "FavoriteRepository",
]
itory",
    "FavoriteRepository",
]
