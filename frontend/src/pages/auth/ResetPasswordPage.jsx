import React from "react";
import logger from "@/utils/logger";
import apiClient from "@/services/apiClient";
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
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  const [isResetting, setIsResetting] = React.useState(false);
  const [resetStatus, setResetStatus] = React.useState(null);

  const token = searchParams.get("token");

  const {
    register,
    handleSubmit,
    formState: { errors },
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
      await apiClient.post("/auth/reset-password", {
        body: {
          token: token,
          new_password: data.newPassword,
        },
      });
      setResetStatus("success");
      toast.success("Senha alterada com sucesso!");
      // Redireciona para o login após 3 segundos
      setTimeout(() => {
        navigate("/login");
      }, 3000);
    } catch (error) {
      logger.error("Erro ao alterar senha:", error);
      toast.error(error?.message || "Erro ao alterar senha. Tente novamente.");
    } finally {
      setIsResetting(false);
    }
  };

  const renderContent = () => {
    if (resetStatus === "success") {
      return (
        <div className="text-center">
          <CheckCircle className="h-16 w-16 text-primary mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-foreground mb-2">
            Senha Alterada!
          </h2>
          <p className="text-muted-foreground mb-6">
            Sua senha foi alterada com sucesso. Você será redirecionado para o
            login em alguns segundos.
          </p>
          <Button
            onClick={() => navigate("/login")}
            className="w-full"
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
          <XCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-foreground mb-2">
            Link Inválido
          </h2>
          <p className="text-muted-foreground/90 leading-relaxed mb-8">
            O link de reset de senha é inválido ou expirou. Solicite um novo
            link.
          </p>
          <Button
            onClick={() => navigate("/forgot-password")}
            className="w-full"
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
            className="text-sm font-medium text-foreground"
          >
            Nova Senha
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground/80" />
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
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground/80 hover:text-foreground transition-colors duration-200"
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
          {errors.newPassword && (
            <p className="text-sm text-destructive">
              {errors.newPassword.message}
            </p>
          )}
        </div>

        {/* Confirmar Senha */}
        <div className="space-y-2">
          <label
            htmlFor="confirmPassword"
            className="text-sm font-medium text-foreground"
          >
            Confirmar Nova Senha
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground/80" />
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
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground/80 hover:text-foreground transition-colors duration-200"
            >
              {showConfirmPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="text-sm text-destructive">
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        {/* Requisitos da Senha */}
        <div className="bg-primary/10 p-3 rounded-lg">
          <p className="text-sm font-medium text-primary mb-2">
            Requisitos da senha:
          </p>
          <ul className="text-xs text-primary space-y-1">
            <li>• Pelo menos 8 caracteres</li>
            <li>• Uma letra minúscula</li>
            <li>• Uma letra maiúscula</li>
            <li>• Um número</li>
          </ul>
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          className="w-full"
          disabled={isResetting}
        >
          {isResetting ? (
            <div className="flex items-center gap-2.5">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" role="status" aria-label="Alterando senha">
                <span className="sr-only">Alterando senha...</span>
              </div>
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
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center shadow-[0_2px_4px_0_rgba(0,0,0,0.1)]">
                <span className="text-primary-foreground font-bold text-sm">RE</span>
              </div>
              <span className="text-2xl font-bold text-foreground">
                RE-EDUCA
              </span>
            </div>
          </div>
          <CardTitle className="text-xl font-bold text-foreground">
            Redefinir Senha
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Digite sua nova senha para continuar
          </CardDescription>
        </CardHeader>

        <CardContent>{renderContent()}</CardContent>
      </Card>
    </AuthLayout>
  );
};
