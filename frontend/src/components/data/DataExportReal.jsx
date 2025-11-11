import React, { useState, useEffect } from "react";
import logger from "@/utils/logger";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "../Ui/card";
import { Button } from "../Ui/button";
import { Badge } from "../Ui/badge";
import { Progress } from "../Ui/progress";
import { Checkbox } from "../Ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../Ui/select";
import apiClient from "../../services/apiClient";
import {
  Download,
  FileText,
  FileSpreadsheet,
  FileJson,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Eye,
  Trash2,
  Plus,
  Database,
  User,
  Activity,
  Target,
  Trophy,
  Heart,
  BarChart3,
  Settings,
  Info,
  X,
} from "lucide-react";

/**
 * Exportação de dados do usuário (histórico, agendamentos e download).
 * - Lê histórico e agendamentos da API
 * - Inicia exportação e oferece download
 * - Exibe estados, erros e feedback ao usuário
 */
const DataExportReal = ({
  onExportStart,
  onExportComplete,
  onExportError,
  showScheduled = true,
  showHistory = true,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [exportHistory, setExportHistory] = useState([]);
  const [scheduledExports, setScheduledExports] = useState([]);
  const [selectedDataTypes, setSelectedDataTypes] = useState([]);
  const [exportFormat, setExportFormat] = useState("json");
  const [dateRange, setDateRange] = useState("all");

  // Carrega histórico de exportações
  useEffect(() => {
    fetchExportHistory();
    fetchScheduledExports();
  }, []);

  const fetchExportHistory = async () => {
    try {
      // Buscar histórico real da API
      const data = await apiClient.request("/users/exports/history");
      setExportHistory(Array.isArray(data?.exports) ? data.exports : Array.isArray(data?.data) ? data.data : []);
    } catch (err) {
      logger.error("Erro ao carregar histórico:", err);
      toast.error("Falha ao carregar histórico de exportações.");
    }
  };

  const fetchScheduledExports = async () => {
    try {
      // Buscar exportações agendadas da API
      const data = await apiClient.request("/users/exports/scheduled");
      setScheduledExports(Array.isArray(data?.scheduled) ? data.scheduled : Array.isArray(data?.data) ? data.data : []);
    } catch (err) {
      logger.error("Erro ao carregar agendamentos:", err);
      toast.error("Falha ao carregar exportações agendadas.");
    }
  };

  const handleStartExport = async () => {
    if (selectedDataTypes.length === 0) {
      setError("Selecione pelo menos um tipo de dado para exportar");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      if (onExportStart) {
        onExportStart({
          dataTypes: selectedDataTypes,
          format: exportFormat,
          dateRange,
        });
      }

      const response = await apiClient.exportUserData(exportFormat);

      if (response?.success) {
        // Atualiza histórico local
        const newExport = {
          id: response?.export_id,
          name: `Exportação ${new Date().toLocaleDateString("pt-BR")}`,
          format: exportFormat,
          status: "processing",
          createdAt: new Date().toISOString(),
          size: "Calculando...",
          dataTypes: selectedDataTypes,
        };
        setExportHistory((prev) => [newExport, ...prev]);

        if (onExportComplete) {
          onExportComplete(response);
        }
      } else {
        throw new Error(response?.error || "Erro ao iniciar exportação");
      }
    } catch (err) {
      setError(err?.message);
      toast.error(err?.message || "Erro ao iniciar exportação.");
      if (onExportError) {
        onExportError(err);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadExport = async (exportId) => {
    try {
      const response = await apiClient.downloadExport(exportId);
      if (response?.success) {
        // Cria link de download
        const blob = new Blob([response?.data], {
          type: "application/octet-stream",
        });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `export_${exportId}.${exportFormat}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (err) {
      logger.error("Erro ao baixar exportação:", err);
      toast.error("Erro ao baixar exportação.");
    }
  };

  const handleCancelExport = async (exportId) => {
    try {
      // Implementar cancelamento de exportação no backend
      setExportHistory((prev) =>
        prev.map((export_) =>
          export_.id === exportId
            ? { ...export_, status: "cancelled" }
            : export_,
        ),
      );
    } catch (err) {
      logger.error("Erro ao cancelar exportação:", err);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "completed":
        return CheckCircle;
      case "processing":
        return RefreshCw;
      case "failed":
        return AlertCircle;
      case "cancelled":
        return X;
      default:
        return Clock;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "completed":
        return "text-primary";
      case "processing":
        return "text-primary";
      case "failed":
        return "text-destructive";
      case "cancelled":
        return "text-muted-foreground";
      default:
        return "text-primary";
    }
  };

  const getStatusBgColor = (status) => {
    switch (status) {
      case "completed":
        return "bg-primary/10";
      case "processing":
        return "bg-primary/10";
      case "failed":
        return "bg-destructive/10";
      case "cancelled":
        return "bg-muted";
      default:
        return "bg-primary/10";
    }
  };

  const getFormatIcon = (format) => {
    switch (format) {
      case "json":
        return FileJson;
      case "csv":
        return FileSpreadsheet;
      case "pdf":
        return FileText;
      default:
        return FileText;
    }
  };

  const dataTypes = [
    {
      id: "profile",
      name: "Perfil",
      icon: User,
      description: "Dados pessoais e configurações",
    },
    {
      id: "exercises",
      name: "Exercícios",
      icon: Activity,
      description: "Histórico de exercícios e treinos",
    },
    {
      id: "goals",
      name: "Metas",
      icon: Target,
      description: "Objetivos e progresso",
    },
    {
      id: "achievements",
      name: "Conquistas",
      icon: Trophy,
      description: "Conquistas e badges",
    },
    {
      id: "health",
      name: "Saúde",
      icon: Heart,
      description: "Dados de saúde e medições",
    },
    {
      id: "stats",
      name: "Estatísticas",
      icon: BarChart3,
      description: "Estatísticas e relatórios",
    },
  ];

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Database className="w-6 h-6 mr-2" />
            Exportação de Dados
          </CardTitle>
          <p className="text-muted-foreground">
            Exporte seus dados pessoais em diferentes formatos
          </p>
        </CardHeader>
      </Card>

      {/* Configuração de Exportação */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Settings className="w-5 h-5 mr-2" />
            Nova Exportação
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Seleção de Tipos de Dados */}
          <div>
            <h3 className="text-lg font-semibold mb-4">
              Selecione os dados para exportar
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {dataTypes.map((dataType) => {
                const Icon = dataType.icon;
                return (
                  <label
                    key={dataType.id}
                    className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-accent cursor-pointer"
                  >
                    <Checkbox
                      checked={selectedDataTypes.includes(dataType.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedDataTypes([
                            ...selectedDataTypes,
                            dataType.id,
                          ]);
                        } else {
                          setSelectedDataTypes(
                            selectedDataTypes.filter(
                              (id) => id !== dataType.id,
                            ),
                          );
                        }
                      }}
                    />
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <Icon className="w-5 h-5 text-muted-foreground" />
                        <span className="font-medium">{dataType.name}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {dataType.description}
                      </p>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Configurações Adicionais */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Formato de Exportação
              </label>
              <Select value={exportFormat} onValueChange={setExportFormat}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="json">JSON</SelectItem>
                  <SelectItem value="csv">CSV</SelectItem>
                  <SelectItem value="pdf">PDF</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Período</label>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os dados</SelectItem>
                  <SelectItem value="last_month">Último mês</SelectItem>
                  <SelectItem value="last_3_months">Últimos 3 meses</SelectItem>
                  <SelectItem value="last_year">Último ano</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Botão de Exportação */}
          <div className="flex justify-center">
            <Button
              onClick={handleStartExport}
              disabled={loading || selectedDataTypes.length === 0}
              className="px-8"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Processando...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Iniciar Exportação
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Histórico de Exportações */}
      {showHistory && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="w-5 h-5 mr-2" />
              Histórico de Exportações
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {exportHistory.map((export_) => {
                const StatusIcon = getStatusIcon(export_.status);
                const FormatIcon = getFormatIcon(export_.format);
                return (
                  <div
                    key={export_.id}
                    className={`flex items-center justify-between p-4 rounded-lg ${getStatusBgColor(
                      export_.status,
                    )}`}
                  >
                    <div className="flex items-center space-x-4">
                      <div
                        className={`p-2 rounded-full ${getStatusBgColor(
                          export_.status,
                        )}`}
                      >
                        <StatusIcon
                          className={`w-5 h-5 ${getStatusColor(
                            export_.status,
                          )} ${export_.status === "processing" ? "animate-spin" : ""}`}
                        />
                      </div>
                      <div>
                        <h4 className="font-medium">{export_.name}</h4>
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                          <div className="flex items-center space-x-1">
                            <FormatIcon className="w-4 h-4" />
                            <span>{export_.format.toUpperCase()}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Calendar className="w-4 h-4" />
                            <span>
                              {new Date(export_.createdAt).toLocaleDateString(
                                "pt-BR",
                              )}
                            </span>
                          </div>
                          <span>{export_.size}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge
                        variant={
                          export_.status === "completed"
                            ? "default"
                            : export_.status === "processing"
                              ? "secondary"
                              : export_.status === "failed"
                                ? "destructive"
                                : "outline"
                        }
                      >
                        {export_.status === "completed"
                          ? "Concluída"
                          : export_.status === "processing"
                            ? "Processando"
                            : export_.status === "failed"
                              ? "Falhou"
                              : "Cancelada"}
                      </Badge>
                      {export_.status === "completed" && (
                        <Button
                          size="sm"
                          onClick={() => handleDownloadExport(export_.id)}
                        >
                          <Download className="w-4 h-4 mr-1" />
                          Baixar
                        </Button>
                      )}
                      {export_.status === "processing" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleCancelExport(export_.id)}
                        >
                          <X className="w-4 h-4 mr-1" />
                          Cancelar
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Exportações Agendadas */}
      {showScheduled && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="w-5 h-5 mr-2" />
              Exportações Agendadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {scheduledExports.map((schedule) => {
                const FormatIcon = getFormatIcon(schedule.format);
                return (
                  <div
                    key={schedule.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="p-2 bg-primary/10 rounded-full">
                        <FormatIcon className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-medium">{schedule.name}</h4>
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                          <span>{schedule.format.toUpperCase()}</span>
                          <span>•</span>
                          <span>{schedule.frequency}</span>
                          <span>•</span>
                          <span>
                            Próxima:{" "}
                            {new Date(schedule.nextRun).toLocaleDateString(
                              "pt-BR",
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge
                        variant={schedule.enabled ? "default" : "secondary"}
                      >
                        {schedule.enabled ? "Ativo" : "Inativo"}
                      </Badge>
                      <Button size="sm" variant="outline">
                        <Settings className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Mensagem de Erro */}
      {error && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-destructive mr-2" />
            <p className="text-destructive">{error}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataExportReal;
