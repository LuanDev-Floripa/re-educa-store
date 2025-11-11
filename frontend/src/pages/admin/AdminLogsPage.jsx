import React, { useState, useEffect } from "react";
import logger from "@/utils/logger";
import apiClient from "@/services/apiClient";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/Ui/card";
import { Button } from "@/components/Ui/button";
import { Badge } from "@/components/Ui/badge";
import { Input } from "@/components/Ui/input";
import { Label } from "@/components/Ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/Ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/Ui/tabs";
import {
  Search,
  Filter,
  RefreshCw,
  Download,
  Shield,
  Activity,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Calendar,
  User,
  Eye,
  FileText,
} from "lucide-react";

/**
 * AdminLogsPage
 * Visualização de logs de atividades e segurança para auditoria.
 * @returns {JSX.Element}
 */
const AdminLogsPage = () => {
  const [activityLogs, setActivityLogs] = useState([]);
  const [securityLogs, setSecurityLogs] = useState([]);
  const [stats, setStats] = useState({
    total_activity_logs: 0,
    total_security_logs: 0,
    unresolved_security_logs: 0,
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("activity");
  const [filters, setFilters] = useState({
    user_id: "",
    activity_type: "",
    event_type: "",
    severity: "",
    resolved: "all",
    start_date: "",
    end_date: "",
  });
  const [pagination, setPagination] = useState({
    page: 1,
    per_page: 20,
    total: 0,
    pages: 0,
  });

  useEffect(() => {
    loadLogs();
    loadStats();
  }, [activeTab, pagination.page, filters]);

  const loadLogs = async () => {
    try {
      setLoading(true);
      if (activeTab === "activity") {
        await loadActivityLogs();
      } else {
        await loadSecurityLogs();
      }
    } catch (error) {
      logger.error("Erro ao carregar logs:", error);
      toast.error("Erro ao carregar logs");
    } finally {
      setLoading(false);
    }
  };

  const loadActivityLogs = async () => {
    try {
      const params = {
        page: pagination.page,
        per_page: pagination.per_page,
      };
      if (filters.user_id) params.user_id = filters.user_id;
      if (filters.activity_type) params.activity_type = filters.activity_type;
      if (filters.start_date) params.start_date = filters.start_date;
      if (filters.end_date) params.end_date = filters.end_date;

      const response = await apiClient.request(() => apiClient.get("/api/admin/logs/activity", { params }));

      setActivityLogs(response?.logs || []);
      setPagination({
        ...pagination,
        total: response?.total || 0,
        pages: response?.pages || 0,
      });
    } catch (error) {
      logger.error("Erro ao carregar logs de atividade:", error);
      setActivityLogs([]);
    }
  };

  const loadSecurityLogs = async () => {
    try {
      const params = {
        page: pagination.page,
        per_page: pagination.per_page,
      };
      if (filters.user_id) params.user_id = filters.user_id;
      if (filters.event_type) params.event_type = filters.event_type;
      if (filters.severity) params.severity = filters.severity;
      if (filters.resolved !== "all")
        params.resolved = filters.resolved === "true";
      if (filters.start_date) params.start_date = filters.start_date;
      if (filters.end_date) params.end_date = filters.end_date;

      const response = await apiClient.get("/api/admin/logs/security", { params });

      setSecurityLogs(response?.logs || []);
      setPagination({
        ...pagination,
        total: response?.total || 0,
        pages: response?.pages || 0,
      });
    } catch (error) {
      logger.error("Erro ao carregar logs de segurança:", error);
      setSecurityLogs([]);
    }
  };

  const loadStats = async () => {
    try {
      const params = {};
      if (filters.start_date) params.start_date = filters.start_date;
      if (filters.end_date) params.end_date = filters.end_date;

      const response = await apiClient.request(() => apiClient.get("/api/admin/logs/stats", { params }));

      if (response?.stats) {
        setStats(response.stats);
      }
    } catch (error) {
      logger.error("Erro ao carregar estatísticas:", error);
    }
  };

  const handleResolveSecurityLog = async (logId) => {
    try {
      const response = await apiClient.request(() => apiClient.put(`/api/admin/logs/security/${logId}/resolve`));

      if (response?.success) {
        toast.success("Log marcado como resolvido!");
        loadSecurityLogs();
        loadStats();
      } else {
        throw new Error(response?.error || "Erro ao resolver log");
      }
    } catch (error) {
      logger.error("Erro ao resolver log:", error);
      toast.error(error.message || "Erro ao resolver log");
    }
  };

  const handleExport = async (type) => {
    try {
      const params = {
        type: type === "activity" ? "activity" : "security",
        format: "csv",
      };
      if (filters.start_date) params.start_date = filters.start_date;
      if (filters.end_date) params.end_date = filters.end_date;

      const response = await fetch(
        `${import.meta.env.VITE_API_URL || "http://localhost:9001"}/api/admin/logs/export?${new URLSearchParams(params)}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("authToken") || localStorage.getItem("token")}`,
          },
        }
      );

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `logs_${type}_${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success("Logs exportados com sucesso!");
    } catch (error) {
      logger.error("Erro ao exportar logs:", error);
      toast.error("Erro ao exportar logs");
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case "critical":
        return "destructive";
      case "high":
        return "destructive";
      case "medium":
        return "warning";
      case "low":
        return "default";
      default:
        return "default";
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleString("pt-BR");
    } catch {
      return dateString;
    }
  };

  if (loading && activityLogs.length === 0 && securityLogs.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Carregando logs...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            Logs e Auditoria
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground/90 leading-relaxed mt-1">
            Visualize atividades de usuários e eventos de segurança
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => handleExport(activeTab)}
            className="w-full sm:w-auto gap-2.5"
          >
            <Download className="h-4 w-4" />
            Exportar
          </Button>
          <Button
            variant="outline"
            onClick={loadLogs}
            className="w-full sm:w-auto gap-2.5"
          >
            <RefreshCw className="h-4 w-4" />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-muted-foreground/90">
                  Logs de Atividade
                </p>
                <p className="text-xl sm:text-2xl font-bold mt-1">
                  {stats.total_activity_logs}
                </p>
              </div>
              <Activity className="h-8 w-8 text-muted-foreground/60" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-muted-foreground/90">
                  Logs de Segurança
                </p>
                <p className="text-xl sm:text-2xl font-bold mt-1">
                  {stats.total_security_logs}
                </p>
              </div>
              <Shield className="h-8 w-8 text-muted-foreground/60" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-muted-foreground/90">
                  Não Resolvidos
                </p>
                <p className="text-xl sm:text-2xl font-bold mt-1 text-primary">
                  {stats.unresolved_security_logs}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="activity">Atividades</TabsTrigger>
          <TabsTrigger value="security">Segurança</TabsTrigger>
        </TabsList>

        <TabsContent value="activity" className="space-y-4">
          {/* Filtros */}
          <Card>
            <CardContent className="p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="user_id">User ID</Label>
                  <Input
                    id="user_id"
                    placeholder="Filtrar por usuário"
                    value={filters.user_id}
                    onChange={(e) =>
                      setFilters({ ...filters, user_id: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="activity_type">Tipo de Atividade</Label>
                  <Input
                    id="activity_type"
                    placeholder="Ex: product_created"
                    value={filters.activity_type}
                    onChange={(e) =>
                      setFilters({
                        ...filters,
                        activity_type: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="start_date">Data Inicial</Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={filters.start_date}
                    onChange={(e) =>
                      setFilters({ ...filters, start_date: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end_date">Data Final</Label>
                  <Input
                    id="end_date"
                    type="date"
                    value={filters.end_date}
                    onChange={(e) =>
                      setFilters({ ...filters, end_date: e.target.value })
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Lista de Logs */}
          <Card>
            <CardHeader>
              <CardTitle>Logs de Atividade</CardTitle>
              <CardDescription>
                Registro de todas as atividades dos usuários
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activityLogs.length === 0 ? (
                  <div className="text-center py-16 px-4">
                    <div className="relative mb-6 max-w-md mx-auto">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-24 h-24 rounded-full bg-primary/10 animate-pulse"></div>
                      </div>
                      <Activity className="h-16 w-16 text-primary mx-auto relative z-10" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-3">
                      Nenhum log de atividade encontrado
                    </h3>
                    <p className="text-muted-foreground/90 leading-relaxed max-w-md mx-auto">
                      {searchTerm || userFilter || activityFilter !== "all"
                        ? "Tente ajustar os filtros de busca para encontrar logs"
                        : "Os logs de atividade do sistema aparecerão aqui quando houver ações registradas"}
                    </p>
                  </div>
                ) : (
                  activityLogs.map((log) => (
                    <div
                      key={log.id}
                      className="flex items-start justify-between p-5 border border-border/30 rounded-lg hover:bg-accent/50 transition-colors duration-200"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2.5 mb-3">
                          <Activity className="h-4 w-4 text-muted-foreground/80" />
                          <p className="font-medium">{log.activity_type}</p>
                        </div>
                        <p className="text-sm text-muted-foreground/90 mb-3 leading-relaxed">
                          {log.activity_description || "Sem descrição"}
                        </p>
                        <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground/90">
                          <span className="flex items-center gap-1.5">
                            <User className="h-3 w-3" />
                            {log.user_id || "Sistema"}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Calendar className="h-3 w-3" />
                            {formatDate(log.created_at)}
                          </span>
                          {log.ip_address && (
                            <span>IP: {log.ip_address}</span>
                          )}
                        </div>
                        {log.details && Object.keys(log.details).length > 0 && (
                          <details className="mt-3">
                            <summary className="text-xs text-muted-foreground/90 cursor-pointer">
                              Ver detalhes
                            </summary>
                            <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto">
                              {JSON.stringify(log.details, null, 2)}
                            </pre>
                          </details>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Paginação */}
              {pagination.pages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    Página {pagination.page} de {pagination.pages} ({pagination.total} total)
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setPagination({ ...pagination, page: pagination.page - 1 })
                      }
                      disabled={pagination.page === 1}
                    >
                      Anterior
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setPagination({ ...pagination, page: pagination.page + 1 })
                      }
                      disabled={pagination.page >= pagination.pages}
                    >
                      Próxima
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          {/* Filtros */}
          <Card>
            <CardContent className="p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="security_user_id">User ID</Label>
                  <Input
                    id="security_user_id"
                    placeholder="Filtrar por usuário"
                    value={filters.user_id}
                    onChange={(e) =>
                      setFilters({ ...filters, user_id: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="event_type">Tipo de Evento</Label>
                  <Input
                    id="event_type"
                    placeholder="Ex: login_failed"
                    value={filters.event_type}
                    onChange={(e) =>
                      setFilters({ ...filters, event_type: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="severity">Severidade</Label>
                  <Select
                    value={filters.severity}
                    onValueChange={(value) =>
                      setFilters({ ...filters, severity: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Todas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Todas</SelectItem>
                      <SelectItem value="low">Baixa</SelectItem>
                      <SelectItem value="medium">Média</SelectItem>
                      <SelectItem value="high">Alta</SelectItem>
                      <SelectItem value="critical">Crítica</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="resolved">Status</Label>
                  <Select
                    value={filters.resolved}
                    onValueChange={(value) =>
                      setFilters({ ...filters, resolved: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="false">Não Resolvidos</SelectItem>
                      <SelectItem value="true">Resolvidos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="security_start_date">Data Inicial</Label>
                  <Input
                    id="security_start_date"
                    type="date"
                    value={filters.start_date}
                    onChange={(e) =>
                      setFilters({ ...filters, start_date: e.target.value })
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Lista de Logs */}
          <Card>
            <CardHeader>
              <CardTitle>Logs de Segurança</CardTitle>
              <CardDescription>
                Eventos de segurança e tentativas de acesso
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {securityLogs.length === 0 ? (
                  <div className="text-center py-16 px-4">
                    <div className="relative mb-6 max-w-md mx-auto">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-24 h-24 rounded-full bg-primary/10 animate-pulse"></div>
                      </div>
                      <Shield className="h-16 w-16 text-primary mx-auto relative z-10" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-3">
                      Nenhum log de segurança encontrado
                    </h3>
                    <p className="text-muted-foreground/90 leading-relaxed max-w-md mx-auto">
                      {searchTerm || userFilter || securityFilter !== "all"
                        ? "Tente ajustar os filtros de busca para encontrar logs de segurança"
                        : "Os logs de segurança aparecerão aqui quando houver eventos de segurança registrados"}
                    </p>
                  </div>
                ) : (
                  securityLogs.map((log) => (
                    <div
                      key={log.id}
                      className={`flex items-start justify-between p-4 border rounded-lg hover:bg-accent transition-colors ${
                        !log.resolved
                          ? "border-destructive/20 bg-destructive/10"
                          : ""
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <Shield className="h-4 w-4 text-muted-foreground" />
                          <p className="font-medium">{log.event_type}</p>
                          <Badge variant={getSeverityColor(log.severity)}>
                            {log.severity}
                          </Badge>
                          {log.resolved ? (
                            <Badge variant="default">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Resolvido
                            </Badge>
                          ) : (
                            <Badge variant="warning">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              Não Resolvido
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {log.event_description || "Sem descrição"}
                        </p>
                        <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {log.user_id || "Sistema"}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(log.created_at)}
                          </span>
                          {log.ip_address && (
                            <span>IP: {log.ip_address}</span>
                          )}
                        </div>
                        {log.details && Object.keys(log.details).length > 0 && (
                          <details className="mt-2">
                            <summary className="text-xs text-muted-foreground cursor-pointer">
                              Ver detalhes
                            </summary>
                            <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto">
                              {JSON.stringify(log.details, null, 2)}
                            </pre>
                          </details>
                        )}
                      </div>
                      {!log.resolved && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleResolveSecurityLog(log.id)}
                          className="ml-4"
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Resolver
                        </Button>
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* Paginação */}
              {pagination.pages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    Página {pagination.page} de {pagination.pages} ({pagination.total} total)
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setPagination({ ...pagination, page: pagination.page - 1 })
                      }
                      disabled={pagination.page === 1}
                    >
                      Anterior
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setPagination({ ...pagination, page: pagination.page + 1 })
                      }
                      disabled={pagination.page >= pagination.pages}
                    >
                      Próxima
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminLogsPage;
