import React from "react";
/**
 * LoginPage
 * - Validação com zod; fallbacks de erro; redirecionamento por role
 */
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/Ui/button";
import { Input } from "@/components/Ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/Ui/card";
import { AuthLayout } from "../../components/layouts/PageLayout";
import { useAuth } from "../../hooks/useAuth.jsx";
import {
  Heart,
  Eye,
  EyeOff,
  Mail,
  Lock,
  ArrowRight,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";

// Schema de validação
const loginSchema = z.object({
  email: z.string().min(1, "Email é obrigatório").email("Email inválido"),
  password: z
    .string()
    .min(1, "Senha é obrigatória")
    .min(6, "Senha deve ter pelo menos 6 caracteres"),
});

export const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data) => {
    setIsLoading(true);
    setError(null);

    try {
      if (typeof login !== "function") {
        throw new Error("Serviço de login indisponível");
      }
      const result = await login(
        data.email.trim().toLowerCase(),
        data.password,
      );

      if (result?.success && result?.user) {
        toast.success("Login realizado com sucesso!", {
          description: `Bem-vindo, ${result.user.name || result.user.email}!`,
        });

        // Limpa o formulário
        reset();

        // Aguarda um momento antes de redirecionar para melhor UX
        setTimeout(() => {
          if (result.user.role === "admin") {
            navigate("/admin");
          } else {
            navigate("/dashboard");
          }
        }, 500);
      } else {
        const errorMessage =
          result?.error || "Erro ao fazer login. Verifique suas credenciais.";
        setError(errorMessage);
        toast.error("Erro no login", {
          description: errorMessage,
        });
      }
    } catch (error) {
      console.error("Erro no login:", error);
      const errorMessage =
        error?.message || "Erro ao fazer login. Tente novamente.";
      setError(errorMessage);
      toast.error("Erro no login", {
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout>
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="flex items-center space-x-2">
              <Heart className="h-8 w-8 text-red-500" />
              <span className="text-2xl font-bold text-gray-900 dark:text-white">
                RE-EDUCA
              </span>
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
            Bem-vindo de volta!
          </CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400">
            Entre na sua conta para continuar sua jornada de saúde
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-4"
            noValidate
          >
            {/* Mensagem de erro geral */}
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-start space-x-3" role="alert" aria-live="assertive">
                <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-red-800 dark:text-red-200">
                    {error}
                  </p>
                </div>
              </div>
            )}

            {/* Email */}
            <div className="space-y-2">
              <label
                htmlFor="email"
                className="text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  className={`pl-10 ${errors.email ? "border-red-500 focus:ring-red-500" : ""}`}
                  {...register("email")}
                  disabled={isLoading}
                  autoComplete="email"
                />
              </div>
              {errors.email && (
                <p className="text-sm text-red-600 dark:text-red-400 flex items-center space-x-1">
                  <AlertCircle className="h-3 w-3" />
                  <span>{errors.email.message}</span>
                </p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label
                htmlFor="password"
                className="text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Senha
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Sua senha"
                  className={`pl-10 pr-10 ${errors.password ? "border-red-500 focus:ring-red-500" : ""}`}
                  {...register("password")}
                  disabled={isLoading}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  disabled={isLoading}
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-sm text-red-600 dark:text-red-400 flex items-center space-x-1">
                  <AlertCircle className="h-3 w-3" />
                  <span>{errors.password.message}</span>
                </p>
              )}
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-offset-0"
                  disabled={isLoading}
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Lembrar de mim
                </span>
              </label>
              <Link
                to="/forgot-password"
                className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                tabIndex={isLoading ? -1 : 0}
              >
                Esqueceu a senha?
              </Link>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl transition-all duration-200"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Entrando...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <span>Entrar</span>
                  <ArrowRight className="h-4 w-4" />
                </div>
              )}
            </Button>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-300 dark:border-gray-600" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white dark:bg-gray-900 px-2 text-gray-500 dark:text-gray-400">
                  Ou continue com
                </span>
              </div>
            </div>

            {/* Social Login */}
            <div className="grid grid-cols-2 gap-3">
              <Button
                type="button"
                variant="outline"
                className="w-full hover:bg-gray-50 dark:hover:bg-gray-800"
                onClick={() => toast.info("Login social em desenvolvimento")}
                disabled={isLoading}
              >
                <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Google
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full hover:bg-gray-50 dark:hover:bg-gray-800"
                onClick={() => toast.info("Login social em desenvolvimento")}
                disabled={isLoading}
              >
                <svg
                  className="w-4 h-4 mr-2"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z" />
                </svg>
                Twitter
              </Button>
            </div>

            {/* Sign Up Link */}
            <div className="text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Não tem uma conta?{" "}
                <Link
                  to="/register"
                  className="font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                  tabIndex={isLoading ? -1 : 0}
                >
                  Cadastre-se
                </Link>
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
    </AuthLayout>
  );
};
