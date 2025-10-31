import React from "react";
/**
 * ResetPasswordPage
 * - Validação de senha; reset com token; fallbacks/toasts
 */
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/Ui/card";
import { Button } from "@/components/Ui/button";
import { Input } from "@/components/Ui/input";
import { AuthLayout } from "../../components/layouts/PageLayout";
import { useApi } from "../../lib/api";
import {
  Lock,
  Eye,
  EyeOff,
  CheckCircle,
  XCircle,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";

// Schema de validação
const resetPasswordSchema = z
  .object({
    newPassword: z
      .string()
      .min(8, "Senha deve ter pelo menos 8 caracteres")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "Senha deve conter pelo menos uma letra minúscula, uma maiúscula e um número",
      ),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Senhas não coincidem",
    path: ["confirmPassword"],
  });

export const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { request } = useApi();
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  const [isResetting, setIsResetting] = React.useState(false);
  const [resetStatus, setResetStatus] = React.useState(null);

  const token = searchParams.get("token");

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmit = async (data) => {
    if (!token) {
      toast.error("Token de reset inválido");
      return;
    }

    setIsResetting(true);
    try {
      if (typeof request !== "function") {
        throw new Error("Serviço de rede indisponível");
      }
      const response = await request(() =>
        fetch("/api/auth/reset-password", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            token: token,
            new_password: data.newPassword,
          }),
        }),
      );

      if (response.ok) {
        setResetStatus("success");
        toast.success("Senha alterada com sucesso!");
        // Redireciona para o login após 3 segundos
        setTimeout(() => {
          navigate("/login");
        }, 3000);
      } else {
        let error;
        try {
          error = await response.json();
        } catch {
          error = {};
        }
        toast.error(error?.error || "Erro ao alterar senha");
      }
    } catch (error) {
      console.error("Erro ao alterar senha:", error);
      toast.error(error?.message || "Erro ao alterar senha. Tente novamente.");
    } finally {
      setIsResetting(false);
    }
  };

  const renderContent = () => {
    if (resetStatus === "success") {
      return (
        <div className="text-center">
          <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Senha Alterada!
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Sua senha foi alterada com sucesso. Você será redirecionado para o
            login em alguns segundos.
          </p>
          <Button
            onClick={() => navigate("/login")}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            <ArrowRight className="w-4 h-4 mr-2" />
            Ir para Login
          </Button>
        </div>
      );
    }

    if (!token) {
      return (
        <div className="text-center">
          <XCircle className="h-16 w-16 text-red-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Link Inválido
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            O link de reset de senha é inválido ou expirou. Solicite um novo
            link.
          </p>
          <Button
            onClick={() => navigate("/forgot-password")}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            Solicitar Novo Link
          </Button>
        </div>
      );
    }

    return (
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Nova Senha */}
        <div className="space-y-2">
          <label
            htmlFor="newPassword"
            className="text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Nova Senha
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              id="newPassword"
              type={showPassword ? "text" : "password"}
              placeholder="Digite sua nova senha"
              className="pl-10 pr-10"
              {...register("newPassword")}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
          {errors.newPassword && (
            <p className="text-sm text-red-600 dark:text-red-400">
              {errors.newPassword.message}
            </p>
          )}
        </div>

        {/* Confirmar Senha */}
        <div className="space-y-2">
          <label
            htmlFor="confirmPassword"
            className="text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Confirmar Nova Senha
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Confirme sua nova senha"
              className="pl-10 pr-10"
              {...register("confirmPassword")}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              {showConfirmPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="text-sm text-red-600 dark:text-red-400">
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        {/* Requisitos da Senha */}
        <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
          <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
            Requisitos da senha:
          </p>
          <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-1">
            <li>• Pelo menos 8 caracteres</li>
            <li>• Uma letra minúscula</li>
            <li>• Uma letra maiúscula</li>
            <li>• Um número</li>
          </ul>
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white"
          disabled={isResetting}
        >
          {isResetting ? (
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Alterando senha...</span>
            </div>
          ) : (
            "Alterar Senha"
          )}
        </Button>
      </form>
    );
  };

  return (
    <AuthLayout>
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">RE</span>
              </div>
              <span className="text-2xl font-bold text-gray-900 dark:text-white">
                RE-EDUCA
              </span>
            </div>
          </div>
          <CardTitle className="text-xl font-bold text-gray-900 dark:text-white">
            Redefinir Senha
          </CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400">
            Digite sua nova senha para continuar
          </CardDescription>
        </CardHeader>

        <CardContent>{renderContent()}</CardContent>
      </Card>
    </AuthLayout>
  );
};
