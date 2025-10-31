import React from "react";
/**
 * VerifyEmailPage
 * - Verifica por token, reenviar email; fallbacks/toasts
 */
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/Ui/card";
import { Button } from "@/components/Ui/button";
import { AuthLayout } from "../../components/layouts/PageLayout";
import { useApi } from "../../lib/api";
import {
  CheckCircle,
  XCircle,
  Mail,
  ArrowRight,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";

export const VerifyEmailPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { request } = useApi();
  const [isVerifying, setIsVerifying] = React.useState(false);
  const [verificationStatus, setVerificationStatus] = React.useState(null);
  const [isResending, setIsResending] = React.useState(false);

  const token = searchParams.get("token");

  React.useEffect(() => {
    if (token) {
      verifyEmail(token);
    }
  }, [token]);

  const verifyEmail = async (verificationToken) => {
    setIsVerifying(true);
    try {
      if (typeof request !== "function") {
        throw new Error("Serviço de rede indisponível");
      }
      const response = await request(() =>
        fetch("/api/auth/verify-email", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ token: verificationToken }),
        }),
      );

      if (response.ok) {
        setVerificationStatus("success");
        toast.success("Email verificado com sucesso!");
        // Redireciona para o dashboard após 3 segundos
        setTimeout(() => {
          navigate("/dashboard");
        }, 3000);
      } else {
        let error;
        try {
          error = await response.json();
        } catch {
          error = {};
        }
        setVerificationStatus("error");
        toast.error(error?.error || "Erro ao verificar email");
      }
    } catch (error) {
      console.error("Erro ao verificar email:", error);
      setVerificationStatus("error");
      toast.error(error?.message || "Erro ao verificar email. Tente novamente.");
    } finally {
      setIsVerifying(false);
    }
  };

  const resendVerificationEmail = async () => {
    setIsResending(true);
    try {
      const response = await request(() =>
        fetch("/api/auth/resend-verification", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        }),
      );

      if (response.ok) {
        toast.success("Email de verificação reenviado!");
      } else {
        const error = await response.json();
        toast.error(error.error || "Erro ao reenviar email");
      }
    } catch (error) {
      console.error("Erro ao reenviar email:", error);
      toast.error("Erro ao reenviar email. Tente novamente.");
    } finally {
      setIsResending(false);
    }
  };

  const renderContent = () => {
    if (isVerifying) {
      return (
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Verificando seu email...
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Por favor, aguarde enquanto verificamos seu email.
          </p>
        </div>
      );
    }

    if (verificationStatus === "success") {
      return (
        <div className="text-center">
          <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Email Verificado!
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Seu email foi verificado com sucesso. Você será redirecionado para o
            dashboard em alguns segundos.
          </p>
          <Button
            onClick={() => navigate("/dashboard")}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            <ArrowRight className="w-4 h-4 mr-2" />
            Ir para Dashboard
          </Button>
        </div>
      );
    }

    if (verificationStatus === "error") {
      return (
        <div className="text-center">
          <XCircle className="h-16 w-16 text-red-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Erro na Verificação
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Não foi possível verificar seu email. O link pode ter expirado ou já
            foi usado.
          </p>
          <div className="space-y-3">
            <Button
              onClick={resendVerificationEmail}
              disabled={isResending}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isResending ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Reenviando...
                </>
              ) : (
                <>
                  <Mail className="w-4 h-4 mr-2" />
                  Reenviar Email de Verificação
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate("/login")}
              className="w-full"
            >
              Voltar ao Login
            </Button>
          </div>
        </div>
      );
    }

    // Sem token - página de instruções
    return (
      <div className="text-center">
        <Mail className="h-16 w-16 text-blue-600 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Verifique seu Email
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Enviamos um link de verificação para seu email. Clique no link para
          ativar sua conta.
        </p>
        <div className="space-y-3">
          <Button
            onClick={resendVerificationEmail}
            disabled={isResending}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isResending ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Reenviando...
              </>
            ) : (
              <>
                <Mail className="w-4 h-4 mr-2" />
                Reenviar Email de Verificação
              </>
            )}
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate("/login")}
            className="w-full"
          >
            Voltar ao Login
          </Button>
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
            Verificação de Email
          </CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400">
            {token
              ? "Verificando seu email..."
              : "Confirme seu email para continuar"}
          </CardDescription>
        </CardHeader>

        <CardContent>{renderContent()}</CardContent>
      </Card>
    </AuthLayout>
  );
};
