/**
 * Lazy Routes Configuration
 * Implementa code splitting para melhorar performance inicial
 */

import { lazy } from 'react';

// ============================================
// PUBLIC PAGES (Carrega imediatamente)
// ============================================
// HomePage e Login devem carregar rápido, então não são lazy

// ============================================
// AUTH PAGES
// ============================================
export const LoginPage = lazy(() => import('../pages/auth/LoginPage'));
export const RegisterPage = lazy(() => import('../pages/auth/RegisterPage'));
export const ForgotPasswordPage = lazy(() => import('../pages/auth/ForgotPasswordPage'));
export const ResetPasswordPage = lazy(() => import('../pages/auth/ResetPasswordPage'));
export const VerifyEmailPage = lazy(() => import('../pages/auth/VerifyEmailPage'));

// ============================================
// USER PAGES
// ============================================
export const UserDashboardPage = lazy(() => import('../pages/user/UserDashboardPage'));
export const UserProfilePage = lazy(() => import('../pages/user/UserProfilePage'));
export const UserSettingsPage = lazy(() => import('../pages/user/UserSettingsPage'));

// ============================================
// STORE PAGES
// ============================================
export const StorePage = lazy(() => import('../pages/store/StorePage'));
export const ProductDetailPage = lazy(() => import('../pages/store/ProductDetailPage'));
export const CartPage = lazy(() => import('../pages/store/CartPage'));
export const CheckoutPage = lazy(() => import('../pages/checkout/CheckoutPage'));
export const OrdersPage = lazy(() => import('../pages/store/OrdersPage'));
export const FavoritesPage = lazy(() => import('../pages/FavoritesPage'));
export const CatalogPage = lazy(() => import('../pages/CatalogPage'));

// ============================================
// TOOLS PAGES
// ============================================
export const ToolsPage = lazy(() => import('../pages/tools/ToolsPage'));
export const ExercisesPage = lazy(() => import('../pages/tools/ExercisesPage'));
export const WorkoutPlansPage = lazy(() => import('../pages/tools/WorkoutPlansPage'));
export const WorkoutSessionsPage = lazy(() => import('../pages/tools/WorkoutSessionsPage'));
export const FoodDiaryPage = lazy(() => import('../pages/tools/FoodDiaryPage'));

// Calculators
export const CalorieCalculatorPage = lazy(() => import('../pages/tools/CalorieCalculatorPage'));
export const IMCCalculatorPage = lazy(() => import('../pages/tools/IMCCalculatorPage'));
export const BiologicalAgeCalculatorPage = lazy(() => import('../pages/tools/BiologicalAgeCalculatorPage'));
export const HydrationCalculatorPage = lazy(() => import('../pages/tools/HydrationCalculatorPage'));
export const MetabolismCalculatorPage = lazy(() => import('../pages/tools/MetabolismCalculatorPage'));
export const SleepCalculatorPage = lazy(() => import('../pages/tools/SleepCalculatorPage'));
export const StressCalculatorPage = lazy(() => import('../pages/tools/StressCalculatorPage'));

// ============================================
// SOCIAL PAGES
// ============================================
export const SocialPage = lazy(() => import('../pages/social/SocialPage'));
export const UserPublicProfile = lazy(() => import('../pages/social/UserPublicProfile'));

// ============================================
// AI PAGES
// ============================================
export const AIPage = lazy(() => import('../pages/ai/AIPage'));

// ============================================
// ADMIN PAGES (Lazy crítico - usuários normais nunca acessam)
// ============================================
export const AdminDashboardComplete = lazy(() => import('../pages/admin/AdminDashboardComplete'));
export const AdminUsers = lazy(() => import('../pages/admin/AdminUsers'));
export const AdminProductsPage = lazy(() => import('../pages/admin/AdminProductsPage'));
export const AdminOrdersPage = lazy(() => import('../pages/admin/AdminOrdersPage'));
export const AdminCouponsPage = lazy(() => import('../pages/admin/AdminCouponsPage'));
export const AdminAnalyticsPage = lazy(() => import('../pages/admin/AdminAnalyticsPage'));
export const AIConfigPage = lazy(() => import('../pages/admin/AIConfigPage'));

// ============================================
// ERROR PAGES
// ============================================
export const Error404Page = lazy(() => import('../pages/errors/Error404Page'));
export const Error500Page = lazy(() => import('../pages/errors/Error500Page'));
