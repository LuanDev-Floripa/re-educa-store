import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/Ui/card";
import { Button } from "@/components/Ui/button";
import { Input } from "@/components/Ui/input";
import { Label } from "@/components/Ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/Ui/select";
import { Badge } from "@/components/Ui/badge";
import { Alert, AlertDescription } from "@/components/Ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/Ui/tabs";
import {
  Settings,
  Plus,
  TestTube,
  Eye,
  EyeOff,
  Trash2,
  Edit,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  Zap,
  Wifi,
  WifiOff,
  Play,
  StopCircle,
} from "lucide-react";
import { toast } from "sonner";

/**
 * AIConfigPage
 * Gerencia configurações de provedores de IA com testes e validações.
 * Inclui fallbacks para token/storage e respostas da API.
 * @returns {JSX.Element}
 */
const AIConfigPage = () => {
  const [configs, setConfigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState({});
  const [showKeys, setShowKeys] = useState({});
  const [testResults, setTestResults] = useState({});
  const [apiStatus, setApiStatus] = useState({});
  const [newConfig, setNewConfig] = useState({
    provider: "",
    service_name: "",
    api_key: "",
    api_endpoint: "",
    model_name: "",
    max_tokens: 1000,
    temperature: 0.7,
    is_active: true,
    is_default: false,
  });
  const [showNewForm, setShowNewForm] = useState(false);

  // Carregar configurações
  const loadConfigs = async () => {
    try {
      setLoading(true);
      let token = null;
      try {
        token = localStorage.getItem("admin_token");
      } catch {
        token = null;
      }
      if (!token) {
        toast.error("Token de autenticação não encontrado");
        return;
      }

      const response = await fetch("/api/admin/ai/configs", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        const list = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
        setConfigs(list);
      } else {
        toast.error("Erro ao carregar configurações");
      }
    } catch (error) {
      toast.error("Erro de conexão");
    } finally {
      setLoading(false);
    }
  };

  // Testar configuração
  const testConfig = async (configId) => {
    try {
      setTesting((prev) => ({ ...prev, [configId]: true }));
      let token = null;
      try {
        token = localStorage.getItem("admin_token");
      } catch {
        token = null;
      }
      if (!token) {
        toast.error("Token de autenticação não encontrado");
        return;
      }

      const response = await fetch(`/api/admin/ai/configs/${configId}/test`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data?.success) {
          setTestResults((prev) => ({ ...prev, [configId]: data.data }));
          setApiStatus((prev) => ({ ...prev, [configId]: "connected" }));
          toast.success(`Teste bem-sucedido: ${data?.data?.status || "OK"}`);
        } else {
          setTestResults((prev) => ({
            ...prev,
            [configId]: { error: data?.error || "Falha no teste" },
          }));
          setApiStatus((prev) => ({ ...prev, [configId]: "error" }));
          toast.error(`Teste falhou: ${data?.error || "Erro desconhecido"}`);
        }
      } else {
        setApiStatus((prev) => ({ ...prev, [configId]: "error" }));
        toast.error("Erro ao testar configuração");
      }
    } catch (error) {
      setApiStatus((prev) => ({ ...prev, [configId]: "error" }));
      toast.error("Erro de conexão");
    } finally {
      setTesting((prev) => ({ ...prev, [configId]: false }));
    }
  };

  // Testar todas as APIs
  const testAllAPIs = async () => {
    try {
      setLoading(true);
      let token = null;
      try {
        token = localStorage.getItem("admin_token");
      } catch {
        token = null;
      }
      if (!token) {
        toast.error("Token de autenticação não encontrado");
        return;
      }

      // Testar Gemini
      const geminiResponse = await fetch(
        "/api/admin/ai/configs/gemini-real-config/test",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      // Testar Perplexity
      const perplexityResponse = await fetch(
        "/api/admin/ai/configs/perplexity-real-config/test",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      const results = {
        gemini: geminiResponse?.ok ? "connected" : "error",
        perplexity: perplexityResponse?.ok ? "connected" : "error",
      };

      setApiStatus(results);

      if (
        results.gemini === "connected" &&
        results.perplexity === "connected"
      ) {
        toast.success("Todas as APIs estão funcionando!");
      } else {
        toast.warning("Algumas APIs podem ter problemas");
      }
    } catch (error) {
      toast.error("Erro ao testar APIs");
    } finally {
      setLoading(false);
    }
  };

  // Testar conectividade básica
  const testBasicConnectivity = async () => {
    try {
      setLoading(true);

      // Testar health check
      const healthResponse = await fetch("/health");
      const healthOk = !!healthResponse?.ok;

      // Testar rotas de IA
      const aiResponse = await fetch("/api/ai/recommendations/profile");
      const aiOk = aiResponse?.status === 401; // Esperado: token requerido

      const results = {
        backend: healthOk ? "connected" : "error",
        ai_routes: aiOk ? "connected" : "error",
      };

      setApiStatus((prev) => ({ ...prev, ...results }));

      if (healthOk && aiOk) {
        toast.success("Conectividade básica OK!");
      } else {
        toast.warning("Problemas de conectividade detectados");
      }
    } catch (error) {
      toast.error("Erro ao testar conectividade");
    } finally {
      setLoading(false);
    }
  };

  // Criar nova configuração
  const createConfig = async () => {
    try {
      let token = null;
      try {
        token = localStorage.getItem("admin_token");
      } catch {
        token = null;
      }
      if (!token) {
        toast.error("Token de autenticação não encontrado");
        return;
      }

      const response = await fetch("/api/admin/ai/configs", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...newConfig,
          max_tokens: Number(newConfig.max_tokens) || 0,
          temperature: Number(newConfig.temperature) || 0,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data?.success) {
          toast.success("Configuração criada com sucesso");
          setShowNewForm(false);
          setNewConfig({
            provider: "",
            service_name: "",
            api_key: "",
            api_endpoint: "",
            model_name: "",
            max_tokens: 1000,
            temperature: 0.7,
            is_active: true,
            is_default: false,
          });
          loadConfigs();
        } else {
          toast.error(`Erro: ${data?.error || "Falha ao criar"}`);
        }
      } else {
        toast.error("Erro ao criar configuração");
      }
    } catch (error) {
      toast.error("Erro de conexão");
    }
  };

  // Deletar configuração
  const deleteConfig = async (configId) => {
    if (!confirm("Tem certeza que deseja deletar esta configuração?")) {
      return;
    }

    try {
      let token = null;
      try {
        token = localStorage.getItem("admin_token");
      } catch {
        token = null;
      }
      if (!token) {
        toast.error("Token de autenticação não encontrado");
        return;
      }

      const response = await fetch(`/api/admin/ai/configs/${configId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data?.success) {
          toast.success("Configuração deletada com sucesso");
          loadConfigs();
        } else {
          toast.error(`Erro: ${data?.error || "Falha ao deletar"}`);
        }
      } else {
        toast.error("Erro ao deletar configuração");
      }
    } catch (error) {
      toast.error("Erro de conexão");
    }
  };

  // Alternar visibilidade da chave
  const toggleKeyVisibility = (configId) => {
    setShowKeys((prev) => ({ ...prev, [configId]: !prev[configId] }));
  };

  // Obter status da configuração
  const getConfigStatus = (config) => {
    if (config.is_mock) {
      return { label: "Mock", variant: "secondary", icon: TestTube };
    } else if (config.is_active) {
      return { label: "Ativo", variant: "default", icon: CheckCircle };
    } else {
      return { label: "Inativo", variant: "destructive", icon: XCircle };
    }
  };

  // Obter status da API
  const getAPIStatus = (configId) => {
    const status = apiStatus[configId];
    if (status === "connected") {
      return {
        label: "Conectado",
        variant: "default",
        icon: Wifi,
        color: "text-green-500",
      };
    } else if (status === "error") {
      return {
        label: "Erro",
        variant: "destructive",
        icon: WifiOff,
        color: "text-red-500",
      };
    } else {
      return {
        label: "Não testado",
        variant: "secondary",
        icon: AlertCircle,
        color: "text-gray-500",
      };
    }
  };

  // Obter cor do provider
  const getProviderColor = (provider) => {
    const colors = {
      gemini: "bg-blue-100 text-blue-800",
      perplexity: "bg-purple-100 text-purple-800",
      openai: "bg-green-100 text-green-800",
      claude: "bg-orange-100 text-orange-800",
    };
    return colors[provider] || "bg-gray-100 text-gray-800";
  };

  useEffect(() => {
    loadConfigs();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" aria-hidden="true" />
        <span className="ml-2" role="status" aria-live="polite">Carregando configurações...</span>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Configurações de IA</h1>
          <p className="text-muted-foreground">
            Gerencie as configurações das APIs de IA do sistema
          </p>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={testBasicConnectivity}
            disabled={loading}
          >
            <Wifi className="h-4 w-4 mr-2" />
            Testar Conectividade
          </Button>
          <Button variant="outline" onClick={testAllAPIs} disabled={loading}>
            <Zap className="h-4 w-4 mr-2" />
            Testar Todas APIs
          </Button>
          <Button onClick={() => setShowNewForm(!showNewForm)}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Configuração
          </Button>
        </div>
      </div>

      <Tabs defaultValue="configs" className="space-y-4">
        <TabsList>
          <TabsTrigger value="configs">Configurações</TabsTrigger>
          <TabsTrigger value="tests">Testes de API</TabsTrigger>
          <TabsTrigger value="stats">Estatísticas</TabsTrigger>
          <TabsTrigger value="settings">Configurações de Segurança</TabsTrigger>
        </TabsList>

        <TabsContent value="configs" className="space-y-4">
          {/* Formulário de nova configuração */}
          {showNewForm && (
            <Card>
              <CardHeader>
                <CardTitle>Nova Configuração de IA</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="provider">Provider</Label>
                    <Select
                      value={newConfig.provider}
                      onValueChange={(value) =>
                        setNewConfig((prev) => ({ ...prev, provider: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o provider" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="gemini">Google Gemini</SelectItem>
                        <SelectItem value="perplexity">Perplexity</SelectItem>
                        <SelectItem value="openai">OpenAI</SelectItem>
                        <SelectItem value="claude">Claude</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="service_name">Nome do Serviço</Label>
                    <Input
                      id="service_name"
                      value={newConfig.service_name}
                      onChange={(e) =>
                        setNewConfig((prev) => ({
                          ...prev,
                          service_name: e.target.value,
                        }))
                      }
                      placeholder="ex: default, production, etc."
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="api_key">Chave da API</Label>
                  <Input
                    id="api_key"
                    type="password"
                    value={newConfig.api_key}
                    onChange={(e) =>
                      setNewConfig((prev) => ({
                        ...prev,
                        api_key: e.target.value,
                      }))
                    }
                    placeholder="Cole sua chave de API aqui"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="api_endpoint">Endpoint</Label>
                    <Input
                      id="api_endpoint"
                      value={newConfig.api_endpoint}
                      onChange={(e) =>
                        setNewConfig((prev) => ({
                          ...prev,
                          api_endpoint: e.target.value,
                        }))
                      }
                      placeholder="URL do endpoint da API"
                    />
                  </div>
                  <div>
                    <Label htmlFor="model_name">Modelo</Label>
                    <Input
                      id="model_name"
                      value={newConfig.model_name}
                      onChange={(e) =>
                        setNewConfig((prev) => ({
                          ...prev,
                          model_name: e.target.value,
                        }))
                      }
                      placeholder="ex: gemini-pro, gpt-4, etc."
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="max_tokens">Máximo de Tokens</Label>
                    <Input
                      id="max_tokens"
                      type="number"
                      value={newConfig.max_tokens}
                      onChange={(e) =>
                        setNewConfig((prev) => ({
                          ...prev,
                          max_tokens: parseInt(e.target.value),
                        }))
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="temperature">Temperatura</Label>
                    <Input
                      id="temperature"
                      type="number"
                      step="0.1"
                      min="0"
                      max="2"
                      value={newConfig.temperature}
                      onChange={(e) =>
                        setNewConfig((prev) => ({
                          ...prev,
                          temperature: parseFloat(e.target.value),
                        }))
                      }
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button onClick={createConfig}>
                    <Plus className="h-4 w-4 mr-2" />
                    Criar Configuração
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowNewForm(false)}
                  >
                    Cancelar
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Lista de configurações */}
          <div className="grid gap-4">
            {configs.map((config) => {
              const status = getConfigStatus(config);
              const StatusIcon = status.icon;
              const apiStatus = getAPIStatus(config.id);
              const APIStatusIcon = apiStatus.icon;

              return (
                <Card key={config.id}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div>
                          <div className="flex items-center space-x-2">
                            <Badge
                              className={getProviderColor(config.provider)}
                            >
                              {config.provider.toUpperCase()}
                            </Badge>
                            <Badge variant={status.variant}>
                              <StatusIcon className="h-3 w-3 mr-1" />
                              {status.label}
                            </Badge>
                            <Badge
                              variant={apiStatus.variant}
                              className="flex items-center"
                            >
                              <APIStatusIcon
                                className={`h-3 w-3 mr-1 ${apiStatus.color}`}
                              />
                              {apiStatus.label}
                            </Badge>
                            {config.is_default && (
                              <Badge variant="outline">Padrão</Badge>
                            )}
                          </div>
                          <h3 className="font-semibold mt-2">
                            {config.service_name}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {config.model_name} • {config.max_tokens} tokens •
                            Temp: {config.temperature}
                          </p>
                          {config.api_endpoint && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {config.api_endpoint}
                            </p>
                          )}
                          {testResults[config.id] && (
                            <div className="mt-2 p-2 bg-muted rounded-md">
                              <p className="text-xs text-muted-foreground">
                                Último teste:{" "}
                                {testResults[config.id].status || "N/A"}
                              </p>
                              {testResults[config.id].response && (
                                <p className="text-xs text-muted-foreground">
                                  Resposta:{" "}
                                  {testResults[config.id].response.substring(
                                    0,
                                    50,
                                  )}
                                  ...
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleKeyVisibility(config.id)}
                        >
                          {showKeys[config.id] ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => testConfig(config.id)}
                          disabled={testing[config.id]}
                          className={apiStatus.color}
                        >
                          {testing[config.id] ? (
                            <RefreshCw className="h-4 w-4 animate-spin" />
                          ) : (
                            <Play className="h-4 w-4" />
                          )}
                        </Button>
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteConfig(config.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {showKeys[config.id] && (
                      <div className="mt-4 p-3 bg-muted rounded-md">
                        <Label className="text-xs text-muted-foreground">
                          Chave da API:
                        </Label>
                        <p className="font-mono text-sm break-all">
                          {config.is_mock
                            ? "mock-key-***"
                            : "encrypted-key-***"}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {configs.length === 0 && (
            <Card>
              <CardContent className="p-12 text-center">
                <Settings className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  Nenhuma configuração encontrada
                </h3>
                <p className="text-muted-foreground mb-4">
                  Crie sua primeira configuração de IA para começar
                </p>
                <Button onClick={() => setShowNewForm(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Configuração
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="tests" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TestTube className="h-5 w-5" />
                <span>Testes de Conectividade</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold">Teste Básico</h3>
                      <Badge
                        variant={
                          apiStatus.backend === "connected"
                            ? "default"
                            : "destructive"
                        }
                      >
                        {apiStatus.backend === "connected" ? "OK" : "Erro"}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      Testa conectividade básica do backend e rotas de IA
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={testBasicConnectivity}
                      disabled={loading}
                      className="w-full"
                    >
                      <Wifi className="h-4 w-4 mr-2" />
                      Testar Conectividade
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold">Teste de APIs</h3>
                      <Badge
                        variant={
                          apiStatus.gemini === "connected" &&
                          apiStatus.perplexity === "connected"
                            ? "default"
                            : "destructive"
                        }
                      >
                        {apiStatus.gemini === "connected" &&
                        apiStatus.perplexity === "connected"
                          ? "OK"
                          : "Erro"}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      Testa conectividade com Gemini e Perplexity
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={testAllAPIs}
                      disabled={loading}
                      className="w-full"
                    >
                      <Zap className="h-4 w-4 mr-2" />
                      Testar Todas APIs
                    </Button>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold">Status das APIs</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Wifi
                        className={`h-4 w-4 ${apiStatus.backend === "connected" ? "text-green-500" : "text-red-500"}`}
                      />
                      <span className="text-sm">Backend</span>
                    </div>
                    <Badge
                      variant={
                        apiStatus.backend === "connected"
                          ? "default"
                          : "destructive"
                      }
                    >
                      {apiStatus.backend === "connected"
                        ? "Conectado"
                        : "Desconectado"}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Wifi
                        className={`h-4 w-4 ${apiStatus.ai_routes === "connected" ? "text-green-500" : "text-red-500"}`}
                      />
                      <span className="text-sm">Rotas de IA</span>
                    </div>
                    <Badge
                      variant={
                        apiStatus.ai_routes === "connected"
                          ? "default"
                          : "destructive"
                      }
                    >
                      {apiStatus.ai_routes === "connected"
                        ? "Conectado"
                        : "Desconectado"}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Wifi
                        className={`h-4 w-4 ${apiStatus.gemini === "connected" ? "text-green-500" : "text-red-500"}`}
                      />
                      <span className="text-sm">Google Gemini</span>
                    </div>
                    <Badge
                      variant={
                        apiStatus.gemini === "connected"
                          ? "default"
                          : "destructive"
                      }
                    >
                      {apiStatus.gemini === "connected"
                        ? "Conectado"
                        : "Desconectado"}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Wifi
                        className={`h-4 w-4 ${apiStatus.perplexity === "connected" ? "text-green-500" : "text-red-500"}`}
                      />
                      <span className="text-sm">Perplexity</span>
                    </div>
                    <Badge
                      variant={
                        apiStatus.perplexity === "connected"
                          ? "default"
                          : "destructive"
                      }
                    >
                      {apiStatus.perplexity === "connected"
                        ? "Conectado"
                        : "Desconectado"}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stats">
          <Card>
            <CardHeader>
              <CardTitle>Estatísticas de Uso</CardTitle>
            </CardHeader>
            <CardContent>
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  As estatísticas de uso estarão disponíveis quando as chaves
                  reais forem configuradas.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Configurações de Segurança</CardTitle>
            </CardHeader>
            <CardContent>
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  As configurações de segurança estão ativas e funcionando em
                  modo mock. Em produção, todas as chaves serão criptografadas
                  automaticamente.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AIConfigPage;
