import React from "react";
import logger from "@/utils/logger";
import apiClient from "@/services/apiClient";
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
import { Mail, ArrowLeft, CheckCircle } from "lucide-react";
import { toast } from "sonner";

// Schema de validação
const forgotPasswordSchema = z.object({
  email: z.string().email("Email inválido"),
});

export const ForgotPasswordPage = () => {
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
      await apiClient.post("/auth/forgot-password", {
        body: data,
      });
      setEmailSent(true);
      toast.success("Email de reset enviado com sucesso!");
    } catch (error) {
      logger.error("Erro ao solicitar reset:", error);
      toast.error(error?.message || "Erro ao solicitar reset. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderContent = () => {
    if (emailSent) {
      return (
        <div className="text-center">
          <CheckCircle className="h-16 w-16 text-primary mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-foreground mb-2">
            Email Enviado!
          </h2>
          <p className="text-muted-foreground mb-4">
            Enviamos um link para redefinir sua senha para:
          </p>
          <p className="font-medium text-foreground mb-6">
            {getValues("email")}
          </p>
          <div className="bg-primary/10 p-4 rounded-lg mb-6">
            <p className="text-sm text-primary">
              <strong>Próximos passos:</strong>
            </p>
            <ul className="text-sm text-primary mt-2 space-y-1">
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
              className="text-sm font-medium text-foreground"
            >
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                className="pl-10"
                {...register("email")}
              />
            </div>
            {errors.email && (
              <p className="text-sm text-destructive" role="alert" aria-live="assertive">
                {errors.email.message}
              </p>
            )}
          </div>

          {/* Instruções */}
          <div className="bg-muted/50 p-5 rounded-lg border border-border/30">
            <p className="text-sm text-muted-foreground/90 leading-relaxed">
              Digite o email associado à sua conta e enviaremos um link para
              redefinir sua senha.
            </p>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" role="status" aria-label="Enviando">
                  <span className="sr-only">Enviando...</span>
                </div>
                <span>Enviando...</span>
              </div>
            ) : (
              "Enviar Link de Reset"
            )}
          </Button>
        </form>

        {/* Links */}
        <div className="mt-6 text-center">
          <p className="text-sm text-muted-foreground">
            Lembrou da senha?{" "}
            <Link
              to="/login"
              className="font-medium text-primary hover:text-primary/80"
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
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center shadow-[0_2px_4px_0_rgba(0,0,0,0.1)]">
                <span className="text-white font-bold text-sm">RE</span>
              </div>
              <span className="text-2xl font-bold text-foreground">
                RE-EDUCA
              </span>
            </div>
          </div>
          <CardTitle className="text-xl font-bold text-foreground">
            Esqueceu sua senha?
          </CardTitle>
          <CardDescription className="text-muted-foreground/90 leading-relaxed">
            Não se preocupe, vamos te ajudar a recuperar o acesso
          </CardDescription>
        </CardHeader>

        <CardContent>{renderContent()}</CardContent>
      </Card>
    </AuthLayout>
  );
};
