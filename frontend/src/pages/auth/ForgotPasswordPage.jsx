import React from "react";
/**
 * ForgotPasswordPage
 * - Validação de email; solicita link de reset; fallbacks/toasts
 */
import { Link } from "react-router-dom";
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
import { Mail, ArrowLeft, CheckCircle } from "lucide-react";
import { toast } from "sonner";

// Schema de validação
const forgotPasswordSchema = z.object({
  email: z.string().email("Email inválido"),
});

export const ForgotPasswordPage = () => {
  const { request } = useApi();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [emailSent, setEmailSent] = React.useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
  } = useForm({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      if (typeof request !== "function") {
        throw new Error("Serviço de rede indisponível");
      }
      const response = await request(() =>
        fetch("/api/auth/forgot-password", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        }),
      );

      if (response.ok) {
        setEmailSent(true);
        toast.success("Email de reset enviado com sucesso!");
      } else {
        let error;
        try {
          error = await response.json();
        } catch {
          error = {};
        }
        toast.error(error?.error || "Erro ao enviar email de reset");
      }
    } catch (error) {
      console.error("Erro ao solicitar reset:", error);
      toast.error(error?.message || "Erro ao solicitar reset. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderContent = () => {
    if (emailSent) {
      return (
        <div className="text-center">
          <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Email Enviado!
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Enviamos um link para redefinir sua senha para:
          </p>
          <p className="font-medium text-gray-900 dark:text-white mb-6">
            {getValues("email")}
          </p>
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg mb-6">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>Próximos passos:</strong>
            </p>
            <ul className="text-sm text-blue-700 dark:text-blue-300 mt-2 space-y-1">
              <li>• Verifique sua caixa de entrada</li>
              <li>• Clique no link do email</li>
              <li>• Crie uma nova senha</li>
              <li>• O link expira em 1 hora</li>
            </ul>
          </div>
          <div className="space-y-3">
            <Button
              onClick={() => setEmailSent(false)}
              variant="outline"
              className="w-full"
            >
              Enviar para outro email
            </Button>
            <Link to="/login">
              <Button variant="outline" className="w-full">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar ao Login
              </Button>
            </Link>
          </div>
        </div>
      );
    }

    return (
      <div>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
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
                className="pl-10"
                {...register("email")}
              />
            </div>
            {errors.email && (
              <p className="text-sm text-red-600 dark:text-red-400" role="alert" aria-live="assertive">
                {errors.email.message}
              </p>
            )}
          </div>

          {/* Instruções */}
          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Digite o email associado à sua conta e enviaremos um link para
              redefinir sua senha.
            </p>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Enviando...</span>
              </div>
            ) : (
              "Enviar Link de Reset"
            )}
          </Button>
        </form>

        {/* Links */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Lembrou da senha?{" "}
            <Link
              to="/login"
              className="font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
            >
              Voltar ao login
            </Link>
          </p>
        </div>
      </div>
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
            Esqueceu sua senha?
          </CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400">
            Não se preocupe, vamos te ajudar a recuperar o acesso
          </CardDescription>
        </CardHeader>

        <CardContent>{renderContent()}</CardContent>
      </Card>
    </AuthLayout>
  );
};
