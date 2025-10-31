import React from "react";
/**
 * RegisterPage
 * - Validação forte de senha; criação de conta com fallbacks/toasts
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
  User,
  Mail,
  Lock,
  ArrowRight,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";

// Schema de validação
const registerSchema = z
  .object({
    name: z
      .string()
      .min(2, "Nome deve ter pelo menos 2 caracteres")
      .max(100, "Nome muito longo")
      .regex(/^[a-zA-ZÀ-ÿ\s]+$/, "Nome deve conter apenas letras"),
    email: z
      .string()
      .min(1, "Email é obrigatório")
      .email("Email inválido")
      .toLowerCase(),
    password: z
      .string()
      .min(8, "Senha deve ter pelo menos 8 caracteres")
      .regex(/[A-Z]/, "Senha deve conter pelo menos uma letra maiúscula")
      .regex(/[a-z]/, "Senha deve conter pelo menos uma letra minúscula")
      .regex(/[0-9]/, "Senha deve conter pelo menos um número")
      .regex(
        /[^A-Za-z0-9]/,
        "Senha deve conter pelo menos um caractere especial",
      ),
    password_confirmation: z.string(),
  })
  .refine((data) => data.password === data.password_confirmation, {
    message: "Senhas não coincidem",
    path: ["password_confirmation"],
  });

export const RegisterPage = () => {
  const navigate = useNavigate();
  const { register: registerUser } = useAuth();
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState(null);
  const [passwordStrength, setPasswordStrength] = React.useState(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    reset,
  } = useForm({
    resolver: zodResolver(registerSchema),
  });

  const watchedPassword = watch("password");

  React.useEffect(() => {
    if (watchedPassword) {
      const strength = calculatePasswordStrength(watchedPassword);
      setPasswordStrength(strength);
    } else {
      setPasswordStrength(null);
    }
  }, [watchedPassword]);

  const calculatePasswordStrength = (password) => {
    if (!password) return null;

    const checks = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[^A-Za-z0-9]/.test(password),
    };

    const score = Object.values(checks).filter(Boolean).length;
    const isValid = Object.values(checks).every(Boolean);

    return {
      score,
      isValid,
      checks,
    };
  };

  const onSubmit = async (data) => {
    setIsLoading(true);
    setError(null);

    try {
      // Prepara dados para envio ao backend (apenas campos necessários)
      const registrationData = {
        name: data.name.trim(),
        email: data.email.trim().toLowerCase(),
        password: data.password,
      };

      if (typeof registerUser !== "function") {
        throw new Error("Serviço de cadastro indisponível");
      }
      const result = await registerUser(registrationData);

      if (result?.success && result?.user) {
        toast.success("Conta criada com sucesso!", {
          description: `Bem-vindo ao RE-EDUCA, ${result?.user?.name || result?.user?.email || "usuário"}!`,
        });

        // Limpa o formulário
        reset();

        // Aguarda um momento antes de redirecionar
        setTimeout(() => {
          navigate("/dashboard");
        }, 500);
      } else {
        const errorMessage =
          result?.error || "Erro ao criar conta. Tente novamente.";
        setError(errorMessage);
        toast.error("Erro no cadastro", {
          description: errorMessage,
        });
      }
    } catch (error) {
      console.error("Erro no registro:", error);
      const errorMessage =
        error?.message ||
        "Erro ao criar conta. Verifique os dados e tente novamente.";
      setError(errorMessage);
      toast.error("Erro no cadastro", {
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getPasswordStrengthColor = (strength) => {
    if (!strength) return "text-gray-400";
    if (strength.isValid) return "text-green-600 dark:text-green-400";
    if (strength.score >= 3) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  const getPasswordStrengthText = (strength) => {
    if (!strength) return "";
    if (strength.isValid) return "Senha forte";
    if (strength.score >= 3) return "Senha média";
    return "Senha fraca";
  };

  const getPasswordRequirements = () => {
    if (!passwordStrength) return null;

    const requirements = [
      {
        key: "length",
        label: "Mínimo 8 caracteres",
        met: passwordStrength.checks.length,
      },
      {
        key: "uppercase",
        label: "Uma letra maiúscula",
        met: passwordStrength.checks.uppercase,
      },
      {
        key: "lowercase",
        label: "Uma letra minúscula",
        met: passwordStrength.checks.lowercase,
      },
      {
        key: "number",
        label: "Um número",
        met: passwordStrength.checks.number,
      },
      {
        key: "special",
        label: "Um caractere especial",
        met: passwordStrength.checks.special,
      },
    ];

    return requirements;
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
            Crie sua conta
          </CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400">
            Comece sua jornada de saúde hoje mesmo
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

            {/* Name */}
            <div className="space-y-2">
              <label
                htmlFor="name"
                className="text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Nome completo
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="name"
                  type="text"
                  placeholder="Seu nome completo"
                  className={`pl-10 ${errors.name ? "border-red-500 focus:ring-red-500" : ""}`}
                  {...register("name")}
                  disabled={isLoading}
                  autoComplete="name"
                />
              </div>
              {errors.name && (
                <p className="text-sm text-red-600 dark:text-red-400 flex items-center space-x-1">
                  <AlertCircle className="h-3 w-3" />
                  <span>{errors.name.message}</span>
                </p>
              )}
            </div>

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
                  autoComplete="new-password"
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

              {/* Password Strength Indicator */}
              {passwordStrength && (
                <div className="space-y-2">
                  <div className="flex items-center space-x-2 text-sm">
                    <span
                      className={getPasswordStrengthColor(passwordStrength)}
                    >
                      {getPasswordStrengthText(passwordStrength)}
                    </span>
                    {passwordStrength.isValid && (
                      <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                    )}
                  </div>

                  {/* Password Requirements */}
                  {watchedPassword && !passwordStrength.isValid && (
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 space-y-1">
                      <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Requisitos da senha:
                      </p>
                      {getPasswordRequirements().map((req, index) => (
                        <div
                          key={index}
                          className="flex items-center space-x-2 text-xs"
                        >
                          {req.met ? (
                            <CheckCircle className="h-3 w-3 text-green-600 dark:text-green-400" />
                          ) : (
                            <AlertCircle className="h-3 w-3 text-gray-400" />
                          )}
                          <span
                            className={
                              req.met
                                ? "text-green-600 dark:text-green-400"
                                : "text-gray-500 dark:text-gray-400"
                            }
                          >
                            {req.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {errors.password && (
                <p className="text-sm text-red-600 dark:text-red-400 flex items-center space-x-1">
                  <AlertCircle className="h-3 w-3" />
                  <span>{errors.password.message}</span>
                </p>
              )}
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <label
                htmlFor="password_confirmation"
                className="text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Confirmar senha
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="password_confirmation"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirme sua senha"
                  className={`pl-10 pr-10 ${errors.password_confirmation ? "border-red-500 focus:ring-red-500" : ""}`}
                  {...register("password_confirmation")}
                  disabled={isLoading}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  disabled={isLoading}
                  aria-label={
                    showConfirmPassword ? "Ocultar senha" : "Mostrar senha"
                  }
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {errors.password_confirmation && (
                <p className="text-sm text-red-600 dark:text-red-400 flex items-center space-x-1">
                  <AlertCircle className="h-3 w-3" />
                  <span>{errors.password_confirmation.message}</span>
                </p>
              )}
            </div>

            {/* Terms */}
            <div className="flex items-start space-x-2">
              <input
                type="checkbox"
                id="terms"
                className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-offset-0"
                required
                disabled={isLoading}
              />
              <label
                htmlFor="terms"
                className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer"
              >
                Concordo com os{" "}
                <Link
                  to="/terms"
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                  tabIndex={isLoading ? -1 : 0}
                >
                  Termos de Uso
                </Link>{" "}
                e{" "}
                <Link
                  to="/privacy"
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                  tabIndex={isLoading ? -1 : 0}
                >
                  Política de Privacidade
                </Link>
              </label>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-lg hover:shadow-xl transition-all duration-200"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Criando conta...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <span>Criar conta</span>
                  <ArrowRight className="h-4 w-4" />
                </div>
              )}
            </Button>

            {/* Sign In Link */}
            <div className="text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Já tem uma conta?{" "}
                <Link
                  to="/login"
                  className="font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                  tabIndex={isLoading ? -1 : 0}
                >
                  Faça login
                </Link>
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
    </AuthLayout>
  );
};
