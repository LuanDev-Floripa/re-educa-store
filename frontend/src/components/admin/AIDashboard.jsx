import React, { useState, useEffect } from "react";
import { getAdminToken } from "@/utils/storage";
import logger from "@/utils/logger";
import apiClient from "@/services/apiClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/Ui/card";
import { Badge } from "@/components/Ui/badge";
import { Button } from "@/components/Ui/button";
import {
  Activity,
  Brain,
  Shield,
  Zap,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  Settings,
  TestTube,
} from "lucide-react";
import { toast } from "sonner";
import APIStatusDashboard from "./APIStatusDashboard";

/**
 * Dashboard administrativo de IA.
 * - Carrega status de saúde e configurações dos provedores
 * - Exibe cards de métricas e lista de providers disponíveis
 * - Inclui atualização manual e toasts de erro
 */
const AIDashboard = () => {
  const [healthData, setHealthData] = useState(null);
  const [configs, setConfigs] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const token = getAdminToken();
      if (!token) {
        toast.error("Token de autenticação não encontrado");
        return;
      }

      // Carregar health check e configurações em paralelo
      const [healthData, configsData] = await Promise.all([
        apiClient.request("/admin/ai/health").catch(() => ({ data: null })),
        apiClient.request("/admin/ai/configs").catch(() => ({ data: [] })),
      ]);

      setHealthData(healthData.data || healthData);
      setConfigs(Array.isArray(configsData.data) ? configsData.data : []);
    } catch (error) {
      logger.error("Erro ao carregar dados do dashboard:", error);
      toast.error("Erro ao carregar dados do dashboard: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const getStatusIcon = (status) => {
    switch (status) {
      case "healthy":
        return <CheckCircle className="h-5 w-5 text-primary" />;
      case "warning":
        return <AlertCircle className="h-5 w-5 text-primary" />;
      case "error":
        return <XCircle className="h-5 w-5 text-destructive" />;
      default:
        return <Activity className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getProviderIcon = (provider) => {
    const icons = {
      gemini: "🧠",
      perplexity: "🔍",
      openai: "🤖",
      claude: "🧬",
    };
    return icons[provider] || "⚙️";
  };

  const getProviderColor = (provider) => {
    // Simplificado para usar apenas cores do tema
    return "bg-primary/10 text-primary border-primary/20";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Carregando dashboard...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Status Geral */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Status Geral
                </p>
                <p className="text-2xl font-bold flex items-center">
                  {getStatusIcon(healthData?.status)}
                  <span className="ml-2 capitalize">
                    {healthData?.status || "Unknown"}
                  </span>
                </p>
              </div>
              <Activity className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Configurações
                </p>
                <p className="text-2xl font-bold">
                  {healthData?.available_configs || 0}
                </p>
                <p className="text-xs text-muted-foreground">
                  {healthData?.active_configs || 0} ativas
                </p>
              </div>
              <Settings className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Modo
                </p>
                <p className="text-2xl font-bold flex items-center">
                  <TestTube className="h-5 w-5 mr-2" />
                  Mock
                </p>
                <p className="text-xs text-muted-foreground">Desenvolvimento</p>
              </div>
              <Brain className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Segurança
                </p>
                <p className="text-2xl font-bold flex items-center">
                  <Shield className="h-5 w-5 text-primary mr-2" />
                  Ativa
                </p>
                <p className="text-xs text-muted-foreground">Criptografia OK</p>
              </div>
              <Shield className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Configurações de IA */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Configurações de IA</CardTitle>
            <Button variant="outline" size="sm" onClick={loadDashboardData}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Atualizar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {configs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {configs.map((config) => (
                <Card key={config.id} className="border-l-4 border-l-blue-500">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-2xl">
                          {getProviderIcon(config.provider)}
                        </span>
                        <Badge className={getProviderColor(config.provider)}>
                          {config.provider.toUpperCase()}
                        </Badge>
                      </div>
                      {config.is_mock ? (
                        <Badge variant="secondary">
                          <TestTube className="h-3 w-3 mr-1" />
                          Mock
                        </Badge>
                      ) : (
                        <Badge
                          variant={config.is_active ? "default" : "destructive"}
                        >
                          {config.is_active ? "Ativo" : "Inativo"}
                        </Badge>
                      )}
                    </div>

                    <h3 className="font-semibold mb-1">
                      {config.service_name}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-2">
                      {config.model_name}
                    </p>

                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{config.max_tokens} tokens</span>
                      <span>Temp: {config.temperature}</span>
                    </div>

                    {config.is_default && (
                      <Badge variant="outline" className="mt-2">
                        Configuração Padrão
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Brain className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                Nenhuma configuração encontrada
              </h3>
              <p className="text-muted-foreground">
                Configure as APIs de IA para começar a usar o sistema
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Providers Disponíveis */}
      <Card>
        <CardHeader>
          <CardTitle>Providers Disponíveis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              {
                name: "Google Gemini",
                provider: "gemini",
                status: "available",
              },
              {
                name: "Perplexity",
                provider: "perplexity",
                status: "available",
              },
              { name: "OpenAI", provider: "openai", status: "coming_soon" },
              { name: "Claude", provider: "claude", status: "coming_soon" },
            ].map((item) => (
              <div
                key={item.provider}
                className="text-center p-4 border rounded-lg"
              >
                <div className="text-3xl mb-2">
                  {getProviderIcon(item.provider)}
                </div>
                <h3 className="font-semibold mb-1">{item.name}</h3>
                <Badge
                  variant={
                    item.status === "available" ? "default" : "secondary"
                  }
                  className="text-xs"
                >
                  {item.status === "available" ? "Disponível" : "Em Breve"}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Status das APIs */}
      <APIStatusDashboard />

      {/* Ações Rápidas */}
      <Card>
        <CardHeader>
          <CardTitle>Ações Rápidas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline">
              <Zap className="h-4 w-4 mr-2" />
              Testar Todas as APIs
            </Button>
            <Button variant="outline">
              <Settings className="h-4 w-4 mr-2" />
              Configurações de Segurança
            </Button>
            <Button variant="outline">
              <Activity className="h-4 w-4 mr-2" />
              Ver Logs de Uso
            </Button>
            <Button variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Rotacionar Chaves
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AIDashboard;
