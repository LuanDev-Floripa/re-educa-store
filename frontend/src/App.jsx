import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { ThemeProvider } from 'next-themes';
import { AuthProvider } from './hooks/useAuth.jsx';
import { ErrorBoundary } from './components/Ui/error.jsx';

// Layouts
import { ContentLayout, DashboardLayout, AuthLayout, UserLayoutWrapper } from './components/layouts/PageLayout';

// Pages
import HomePage from './pages/HomePage';
import CatalogPage from './pages/CatalogPage';
import ProductDetailPage from './pages/ProductDetailPage';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { VerifyEmailPage } from './pages/auth/VerifyEmailPage';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/auth/ResetPasswordPage';
import ToolsPage from './pages/tools/ToolsPage';
import { IMCCalculatorPage } from './pages/tools/IMCCalculatorPage';
import { FoodDiaryPage } from './pages/tools/FoodDiaryPage';
import ExercisesPage from './pages/tools/ExercisesPage';
import WorkoutPlansPage from './pages/tools/WorkoutPlansPage';
import WorkoutSessionsPage from './pages/tools/WorkoutSessionsPage';
import CalorieCalculatorPage from './pages/tools/CalorieCalculatorPage';
import MetabolismCalculatorPage from './pages/tools/MetabolismCalculatorPage';
import HydrationCalculatorPage from './pages/tools/HydrationCalculatorPage';
import SleepCalculatorPage from './pages/tools/SleepCalculatorPage';
import StressCalculatorPage from './pages/tools/StressCalculatorPage';
import BiologicalAgeCalculatorPage from './pages/tools/BiologicalAgeCalculatorPage';
import { StorePage } from './pages/store/StorePage';
import { CheckoutPage } from './pages/checkout/CheckoutPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import UserDashboardPage from './pages/user/UserDashboardPage';
import UserProfilePage from './pages/user/UserProfilePage';
import UserSettingsPage from './pages/user/UserSettingsPage';
import FavoritesPage from './pages/FavoritesPage';
import AIPage from './pages/ai/AIPage';
import SocialPage from './pages/social/SocialPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminDashboardComplete from './pages/admin/AdminDashboardComplete';
import AdminUsers from './pages/admin/AdminUsers';
import AdminProductsPage from './pages/admin/AdminProductsPage';
import AdminOrdersPage from './pages/admin/AdminOrdersPage';
import AdminAnalyticsPage from './pages/admin/AdminAnalyticsPage';
import AdminCouponsPage from './pages/admin/AdminCouponsPage';
import AIConfigPage from './pages/admin/AIConfigPage';
import AdminLayout from './components/admin/AdminLayout';
import CartPage from './pages/store/CartPage';
import OrdersPage from './pages/store/OrdersPage';

// Error Pages
import Error404Page from './pages/errors/Error404Page';
import Error500Page from './pages/errors/Error500Page';

// Components
import InstallPrompt from './components/pwa/InstallPrompt';
import OfflineIndicator from './components/pwa/OfflineIndicator';
import CartPopup from './components/cart/CartPopup';
import FloatingCartButton from './components/cart/FloatingCartButton';
import FloatingThemeControls from './components/theme/FloatingThemeControls';



// Contexts
import { CartProvider } from './contexts/CartContext';
import { FavoritesProvider } from './contexts/FavoritesContext';

// Auth Components
import AdminRoute from './components/auth/AdminRoute';
import { useAuth } from './hooks/useAuth.jsx';

// Theme initialization
import './lib/theme';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Public Route Component (redirects if already authenticated)
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Carregando...</p>
        </div>
      </div>
    );
  }

  if (user) {
    // Redirecionar admin para painel administrativo
    if (user.role === 'admin') {
      return <Navigate to="/admin" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// Home Page Component


// App Component
function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
        <CartProvider>
          <FavoritesProvider>
            <AuthProvider>
              <AppContent />
            </AuthProvider>
          </FavoritesProvider>
        </CartProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

// Componente interno que usa o Router
function AppContent() {
  return (
    <Router>
            <div className="App">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<HomePage />} />
              <Route path="/catalog" element={<CatalogPage />} />
              <Route path="/product/:id" element={<ProductDetailPage />} />
              
              <Route 
                path="/login" 
                element={
                  <PublicRoute>
                    <LoginPage />
                  </PublicRoute>
                } 
              />
              
              <Route 
                path="/register" 
                element={
                  <PublicRoute>
                    <RegisterPage />
                  </PublicRoute>
                } 
              />

              <Route 
                path="/verify-email" 
                element={<VerifyEmailPage />} 
              />

              <Route 
                path="/forgot-password" 
                element={
                  <PublicRoute>
                    <ForgotPasswordPage />
                  </PublicRoute>
                } 
              />

              <Route 
                path="/reset-password" 
                element={<ResetPasswordPage />} 
              />

                          {/* Protected Routes */}
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <UserLayoutWrapper>
                    <UserDashboardPage />
                  </UserLayoutWrapper>
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/favorites" 
              element={
                <ProtectedRoute>
                  <UserLayoutWrapper>
                    <FavoritesPage />
                  </UserLayoutWrapper>
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/tools" 
              element={
                <ProtectedRoute>
                  <UserLayoutWrapper>
                    <ToolsPage />
                  </UserLayoutWrapper>
                </ProtectedRoute>
              } 
            />

            {/* Health Tools Routes */}
            <Route 
              path="/tools/imc" 
              element={
                <ProtectedRoute>
                  <UserLayoutWrapper>
                    <IMCCalculatorPage />
                  </UserLayoutWrapper>
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/tools/food-diary" 
              element={
                <ProtectedRoute>
                  <UserLayoutWrapper>
                    <FoodDiaryPage />
                  </UserLayoutWrapper>
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/tools/exercises" 
              element={
                <ProtectedRoute>
                  <UserLayoutWrapper>
                    <ExercisesPage />
                  </UserLayoutWrapper>
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/tools/workout-plans" 
              element={
                <ProtectedRoute>
                  <UserLayoutWrapper>
                    <WorkoutPlansPage />
                  </UserLayoutWrapper>
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/tools/workout-sessions" 
              element={
                <ProtectedRoute>
                  <UserLayoutWrapper>
                    <WorkoutSessionsPage />
                  </UserLayoutWrapper>
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/tools/calorie-calculator" 
              element={
                <ProtectedRoute>
                  <UserLayoutWrapper>
                    <CalorieCalculatorPage />
                  </UserLayoutWrapper>
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/tools/metabolism-calculator" 
              element={
                <ProtectedRoute>
                  <UserLayoutWrapper>
                    <MetabolismCalculatorPage />
                  </UserLayoutWrapper>
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/tools/hydration-calculator" 
              element={
                <ProtectedRoute>
                  <UserLayoutWrapper>
                    <HydrationCalculatorPage />
                  </UserLayoutWrapper>
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/tools/sleep-calculator" 
              element={
                <ProtectedRoute>
                  <UserLayoutWrapper>
                    <SleepCalculatorPage />
                  </UserLayoutWrapper>
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/tools/stress-calculator" 
              element={
                <ProtectedRoute>
                  <UserLayoutWrapper>
                    <StressCalculatorPage />
                  </UserLayoutWrapper>
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/tools/biological-age-calculator" 
              element={
                <ProtectedRoute>
                  <UserLayoutWrapper>
                    <BiologicalAgeCalculatorPage />
                  </UserLayoutWrapper>
                </ProtectedRoute>
              } 
            />

            {/* User Profile Routes */}
            <Route 
              path="/profile" 
              element={
                <ProtectedRoute>
                  <UserLayoutWrapper>
                    <UserProfilePage />
                  </UserLayoutWrapper>
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/settings" 
              element={
                <ProtectedRoute>
                  <UserLayoutWrapper>
                    <UserSettingsPage />
                  </UserLayoutWrapper>
                </ProtectedRoute>
              } 
            />

            {/* Store Routes */}
            <Route 
              path="/store" 
              element={
                <ProtectedRoute>
                  <UserLayoutWrapper>
                    <StorePage />
                  </UserLayoutWrapper>
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/store/product/:productId" 
              element={
                <ProtectedRoute>
                  <UserLayoutWrapper>
                    <ProductDetailPage />
                  </UserLayoutWrapper>
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/store/cart" 
              element={
                <ProtectedRoute>
                  <UserLayoutWrapper>
                    <CartPage />
                  </UserLayoutWrapper>
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/store/orders" 
              element={
                <ProtectedRoute>
                  <UserLayoutWrapper>
                    <OrdersPage />
                  </UserLayoutWrapper>
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/checkout" 
              element={
                <ProtectedRoute>
                  <CheckoutPage />
                </ProtectedRoute>
              } 
            />

            {/* AI Routes */}
            <Route 
              path="/ai" 
              element={
                <ProtectedRoute>
                  <AIPage />
                </ProtectedRoute>
              } 
            />

            {/* Social Network Routes */}
            <Route 
              path="/social" 
              element={
                <ProtectedRoute>
                  <UserLayoutWrapper>
                    <SocialPage />
                  </UserLayoutWrapper>
                </ProtectedRoute>
              } 
            />

            {/* Admin Routes - Protected with AdminRoute */}
            <Route 
              path="/admin" 
              element={
                <ProtectedRoute>
                  <AdminRoute>
                    <AdminLayout>
                      <AdminDashboardComplete />
                    </AdminLayout>
                  </AdminRoute>
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/admin/users" 
              element={
                <ProtectedRoute>
                  <AdminRoute>
                    <AdminLayout>
                      <AdminUsers />
                    </AdminLayout>
                  </AdminRoute>
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/admin/products" 
              element={
                <ProtectedRoute>
                  <AdminRoute>
                    <AdminLayout>
                      <AdminProductsPage />
                    </AdminLayout>
                  </AdminRoute>
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/admin/coupons" 
              element={
                <ProtectedRoute>
                  <AdminRoute>
                    <AdminLayout>
                      <AdminCouponsPage />
                    </AdminLayout>
                  </AdminRoute>
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/admin/orders" 
              element={
                <ProtectedRoute>
                  <AdminRoute>
                    <AdminLayout>
                      <AdminOrdersPage />
                    </AdminLayout>
                  </AdminRoute>
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/admin/analytics" 
              element={
                <ProtectedRoute>
                  <AdminRoute>
                    <AdminLayout>
                      <AdminAnalyticsPage />
                    </AdminLayout>
                  </AdminRoute>
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/admin/reports" 
              element={
                <ProtectedRoute>
                  <AdminRoute>
                    <AdminLayout>
                      <AdminAnalyticsPage />
                    </AdminLayout>
                  </AdminRoute>
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/admin/financial" 
              element={
                <ProtectedRoute>
                  <AdminRoute>
                    <AdminLayout>
                      <AdminAnalyticsPage />
                    </AdminLayout>
                  </AdminRoute>
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/admin/settings" 
              element={
                <ProtectedRoute>
                  <AdminRoute>
                    <AdminLayout>
                      <AdminAnalyticsPage />
                    </AdminLayout>
                  </AdminRoute>
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/admin/ai-config" 
              element={
                <ProtectedRoute>
                  <AdminRoute>
                    <AdminLayout>
                      <AIConfigPage />
                    </AdminLayout>
                  </AdminRoute>
                </ProtectedRoute>
              } 
            />

            {/* Error Routes */}
            <Route path="/404" element={<Error404Page />} />
            <Route path="/500" element={<Error500Page />} />
            
            {/* Catch all route - 404 */}
            <Route path="*" element={<Error404Page />} />
            </Routes>

            {/* PWA Components */}
            <InstallPrompt />
            <OfflineIndicator />
            <CartPopup />
            <FloatingCartButton />
            <FloatingThemeControls />



            {/* Toast Notifications */}
            <Toaster 
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: 'var(--background)',
                  color: 'var(--foreground)',
                  border: '1px solid var(--border)',
                },
              }}
            />
                      </div>
    </Router>
  );
}

export default App;

