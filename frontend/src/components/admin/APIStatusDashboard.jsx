import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/Ui/card";
import { Button } from "@/components/Ui/button";
import { Badge } from "@/components/Ui/badge";
import {
  Wifi,
  WifiOff,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertCircle,
  Zap,
  Activity,
  Clock,
} from "lucide-react";
import { toast } from "sonner";

/**
 * Painel de status das APIs.
 * - Executa testes paralelos (backend, rotas de IA, Gemini, Perplexity)
 * - Mostra badges, ícones e último horário do teste
 * - Emite toasts de sucesso/aviso/erro conforme resultado
 */
const APIStatusDashboard = () => {
  const [status, setStatus] = useState({
    backend: "unknown",
    ai_routes: "unknown",
    gemini: "unknown",
    perplexity: "unknown",
  });
  const [loading, setLoading] = useState(false);
  const [lastCheck, setLastCheck] = useState(null);

  const testBackend = async () => {
    try {
      const response = await fetch("/health");
      return response.ok;
    } catch (error) {
      console.error("Erro ao testar backend:", error);
      return false;
    }
  };

  const testAIRoutes = async () => {
    try {
      const response = await fetch("/api/ai/recommendations/profile");
      // Esperamos 401 (token requerido) como resposta válida
      return response.status === 401;
    } catch (error) {
      console.error("Erro ao testar AI routes:", error);
      return false;
    }
  };

  const testGemini = async () => {
    try {
      const response = await fetch(
        "/api/admin/ai/configs/gemini-real-config/test",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("admin_token") || ""}`,
            "Content-Type": "application/json",
          },
        },
      );
      return response.ok;
    } catch (error) {
      console.error("Erro ao testar Gemini:", error);
      return false;
    }
  };

  const testPerplexity = async () => {
    try {
      const response = await fetch(
        "/api/admin/ai/configs/perplexity-real-config/test",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("admin_token") || ""}`,
            "Content-Type": "application/json",
          },
        },
      );
      return response.ok;
    } catch (error) {
      console.error("Erro ao testar Perplexity:", error);
      return false;
    }
  };

  const runAllTests = useCallback(async () => {
    setLoading(true);
    try {
      const [backendOk, aiRoutesOk, geminiOk, perplexityOk] = await Promise.all(
        [testBackend(), testAIRoutes(), testGemini(), testPerplexity()],
      );

      const newStatus = {
        backend: backendOk ? "connected" : "error",
        ai_routes: aiRoutesOk ? "connected" : "error",
        gemini: geminiOk ? "connected" : "error",
        perplexity: perplexityOk ? "connected" : "error",
      };

      setStatus(newStatus);
      setLastCheck(new Date());

      const allConnected = Object.values(newStatus).every(
        (s) => s === "connected",
      );
      if (allConnected) {
        toast.success("Todas as APIs estão funcionando!");
      } else {
        toast.warning("Algumas APIs podem ter problemas");
      }
    } catch (error) {
      console.error("Erro ao testar APIs:", error);
      toast.error("Erro ao testar APIs: " + error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const getStatusIcon = (status) => {
    switch (status) {
      case "connected":
        return <CheckCircle className={`h-4 w-4 ${getStatusColor(status)}`} />;
      case "error":
        return <XCircle className={`h-4 w-4 ${getStatusColor(status)}`} />;
      default:
        return <AlertCircle className={`h-4 w-4 ${getStatusColor(status)}`} />;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "connected":
        return (
          <Badge variant="default" className="bg-green-100 text-green-800">
            Conectado
          </Badge>
        );
      case "error":
        return <Badge variant="destructive">Erro</Badge>;
      default:
        return <Badge variant="secondary">Não testado</Badge>;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "connected":
        return "text-green-500";
      case "error":
        return "text-red-500";
      default:
        return "text-gray-500";
    }
  };

  useEffect(() => {
    // Teste inicial
    runAllTests();
  }, [runAllTests]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Activity className="h-5 w-5" />
            <span>Status das APIs</span>
          </CardTitle>
          <div className="flex items-center space-x-2">
            {lastCheck && (
              <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>Último teste: {lastCheck.toLocaleTimeString()}</span>
              </div>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={runAllTests}
              disabled={loading}
            >
              {loading ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center space-x-3">
                {getStatusIcon(status.backend)}
                <div>
                  <p className="font-medium">Backend</p>
                  <p className="text-sm text-muted-foreground">
                    Servidor Flask
                  </p>
                </div>
              </div>
              {getStatusBadge(status.backend)}
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center space-x-3">
                {getStatusIcon(status.ai_routes)}
                <div>
                  <p className="font-medium">Rotas de IA</p>
                  <p className="text-sm text-muted-foreground">
                    Endpoints protegidos
                  </p>
                </div>
              </div>
              {getStatusBadge(status.ai_routes)}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center space-x-3">
                {getStatusIcon(status.gemini)}
                <div>
                  <p className="font-medium">Google Gemini</p>
                  <p className="text-sm text-muted-foreground">API de IA</p>
                </div>
              </div>
              {getStatusBadge(status.gemini)}
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center space-x-3">
                {getStatusIcon(status.perplexity)}
                <div>
                  <p className="font-medium">Perplexity</p>
                  <p className="text-sm text-muted-foreground">
                    API de Pesquisa
                  </p>
                </div>
              </div>
              {getStatusBadge(status.perplexity)}
            </div>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Zap className="h-4 w-4" />
              <span className="text-sm font-medium">Teste Rápido</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={runAllTests}
              disabled={loading}
            >
              {loading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Testando...
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4 mr-2" />
                  Testar Todas
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default APIStatusDashboard;
