import React, { useState, useEffect } from "react";
import logger from "@/utils/logger";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/Ui/card";
import { Button } from "@/components/Ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/Ui/select";
import { Input } from "@/components/Ui/input";
import { Label } from "@/components/Ui/label";
import {
  FileText,
  Download,
  Calendar,
  Mail,
  Clock,
  X,
  CheckCircle2,
  Loader2,
  BarChart3,
  TrendingUp,
  Users,
  ShoppingBag,
  FileSpreadsheet,
  FileJson,
} from "lucide-react";
import apiClient from "@/services/apiClient";
import { toast } from "sonner";

/**
 * AdminReportsPage
 * Página completa de relatórios avançados com templates, geração, exportação e agendamento.
 */
const AdminReportsPage = () => {
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [reportType, setReportType] = useState("sales");
  const [period, setPeriod] = useState("month");
  const [format, setFormat] = useState("pdf");
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [scheduledReports, setScheduledReports] = useState([]);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleData, setScheduleData] = useState({
    template_id: "",
    frequency: "weekly",
    recipients: [],
    format: "pdf",
  });
  const [newRecipient, setNewRecipient] = useState("");

  useEffect(() => {
    loadTemplates();
    loadScheduledReports();
  }, []);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const data = await apiClient.request(() => apiClient.admin.getReportTemplates());
      setTemplates(data.templates || []);
    } catch (error) {
      logger.error("Erro ao carregar templates:", error);
      toast.error("Erro ao carregar templates de relatórios");
    } finally {
      setLoading(false);
    }
  };

  const loadScheduledReports = async () => {
    try {
      const data = await apiClient.request(() => apiClient.admin.getScheduledReports({ active_only: true }));
      setScheduledReports(data.schedules || []);
    } catch (error) {
      logger.error("Erro ao carregar relatórios agendados:", error);
    }
  };

  const handleGenerateReport = async () => {
    if (!reportType) {
      toast.error("Selecione um tipo de relatório");
      return;
    }

    try {
      setGenerating(true);
      const data = await apiClient.request(() => apiClient.admin.generateReport({
        report_type: reportType,
        period: period,
        template_id: selectedTemplate,
      }));

      if (data.success) {
        setReportData(data.report);
        toast.success("Relatório gerado com sucesso!");
      } else {
        toast.error(data.error || "Erro ao gerar relatório");
      }
    } catch (error) {
      logger.error("Erro ao gerar relatório:", error);
      toast.error("Erro ao gerar relatório");
    } finally {
      setGenerating(false);
    }
  };

  const handleExport = async () => {
    if (!reportType) {
      toast.error("Selecione um tipo de relatório");
      return;
    }

    try {
      setGenerating(true);
      const params = new URLSearchParams({
        type: reportType,
        period: period,
        format: format,
      });

      if (selectedTemplate) {
        params.append("template_id", selectedTemplate);
      }

      const url = `${import.meta.env.VITE_API_URL || "http://localhost:9001"}/api/admin/reports/export?${params}`;
      const token = localStorage.getItem("auth_token");

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = downloadUrl;
        a.download = `report_${reportType}_${period}.${format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(downloadUrl);
        document.body.removeChild(a);
        toast.success("Relatório exportado com sucesso!");
      } else {
        throw new Error("Erro ao exportar relatório");
      }
    } catch (error) {
      logger.error("Erro ao exportar relatório:", error);
      toast.error("Erro ao exportar relatório");
    } finally {
      setGenerating(false);
    }
  };

  const handleSchedule = async () => {
    if (!scheduleData.template_id) {
      toast.error("Selecione um template");
      return;
    }

    if (scheduleData.recipients.length === 0) {
      toast.error("Adicione pelo menos um destinatário");
      return;
    }

    try {
      const data = await apiClient.request(() => apiClient.admin.scheduleReport(scheduleData));
      if (data.success) {
        toast.success("Relatório agendado com sucesso!");
        setShowScheduleModal(false);
        setScheduleData({
          template_id: "",
          frequency: "weekly",
          recipients: [],
          format: "pdf",
        });
        loadScheduledReports();
      } else {
        toast.error(data.error || "Erro ao agendar relatório");
      }
    } catch (error) {
      logger.error("Erro ao agendar relatório:", error);
      toast.error("Erro ao agendar relatório");
    }
  };

  const handleCancelSchedule = async (scheduleId) => {
    if (!confirm("Deseja realmente cancelar este agendamento?")) {
      return;
    }

    try {
      await apiClient.request(() => apiClient.admin.cancelScheduledReport(scheduleId));
      toast.success("Agendamento cancelado com sucesso!");
      loadScheduledReports();
    } catch (error) {
      logger.error("Erro ao cancelar agendamento:", error);
      toast.error("Erro ao cancelar agendamento");
    }
  };

  const addRecipient = () => {
    if (newRecipient && !scheduleData.recipients.includes(newRecipient)) {
      setScheduleData({
        ...scheduleData,
        recipients: [...scheduleData.recipients, newRecipient],
      });
      setNewRecipient("");
    }
  };

  const removeRecipient = (email) => {
    setScheduleData({
      ...scheduleData,
      recipients: scheduleData.recipients.filter((e) => e !== email),
    });
  };

  const getReportIcon = (type) => {
    switch (type) {
      case "sales":
        return <ShoppingBag className="w-5 h-5" />;
      case "users":
        return <Users className="w-5 h-5" />;
      case "products":
        return <BarChart3 className="w-5 h-5" />;
      default:
        return <FileText className="w-5 h-5" />;
    }
  };

  const getFormatIcon = (format) => {
    switch (format) {
      case "pdf":
        return <FileText className="w-4 h-4" />;
      case "csv":
        return <FileSpreadsheet className="w-4 h-4" />;
      case "json":
        return <FileJson className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Relatórios Avançados</h1>
          <p className="text-muted-foreground mt-1">
            Gere, exporte e agende relatórios personalizados
          </p>
        </div>
      </div>

      {/* Templates */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Templates de Relatórios
          </CardTitle>
          <CardDescription>
            Selecione um template ou crie um relatório customizado
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {templates.map((template) => (
                <div
                  key={template.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedTemplate === template.id
                      ? "border-primary bg-primary/5"
                      : "hover:border-primary/50"
                  }`}
                  onClick={() => {
                    setSelectedTemplate(template.id);
                    setReportType(template.type);
                    setPeriod(template.period);
                  }}
                >
                  <div className="flex items-start gap-3">
                    {getReportIcon(template.type)}
                    <div className="flex-1">
                      <h3 className="font-semibold">{template.name}</h3>
                      <p className="text-sm text-muted-foreground/90 mt-2 leading-relaxed">
                        {template.description}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        {template.format.map((f) => (
                          <span
                            key={f}
                            className="text-xs bg-muted px-2 py-1 rounded"
                          >
                            {f.toUpperCase()}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Geração de Relatório */}
      <Card>
        <CardHeader>
          <CardTitle>Gerar Relatório</CardTitle>
          <CardDescription>
            Configure e gere um relatório personalizado
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-3">
              <Label>Tipo de Relatório</Label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sales">Vendas</SelectItem>
                  <SelectItem value="users">Usuários</SelectItem>
                  <SelectItem value="products">Produtos</SelectItem>
                  <SelectItem value="all">Completo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label>Período</Label>
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Hoje</SelectItem>
                  <SelectItem value="week">Semana</SelectItem>
                  <SelectItem value="month">Mês</SelectItem>
                  <SelectItem value="quarter">Trimestre</SelectItem>
                  <SelectItem value="year">Ano</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label>Formato de Exportação</Label>
              <Select value={format} onValueChange={setFormat}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pdf">PDF</SelectItem>
                  <SelectItem value="csv">CSV</SelectItem>
                  <SelectItem value="json">JSON</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleGenerateReport}
              disabled={generating}
              className="flex items-center gap-2"
            >
              {generating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <BarChart3 className="w-4 h-4" />
              )}
              Gerar Relatório
            </Button>
            <Button
              onClick={handleExport}
              disabled={generating}
              variant="outline"
              className="flex items-center gap-2"
            >
              {generating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              Exportar
            </Button>
            <Button
              onClick={() => setShowScheduleModal(true)}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Calendar className="w-4 h-4" />
              Agendar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Dados do Relatório */}
      {reportData && (
        <Card>
          <CardHeader>
            <CardTitle>Relatório Gerado</CardTitle>
            <CardDescription>
              Gerado em: {new Date(reportData.generated_at).toLocaleString()}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {reportData.sales && (
                <div>
                  <h3 className="font-semibold mb-2">Vendas</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Receita Total</p>
                      <p className="text-lg font-bold">
                        R$ {reportData.sales.metrics?.total_revenue?.toFixed(2) || "0.00"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground/90">Total de Pedidos</p>
                      <p className="text-lg font-bold">
                        {reportData.sales.metrics?.total_orders || 0}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Ticket Médio</p>
                      <p className="text-lg font-bold">
                        R$ {reportData.sales.metrics?.average_ticket?.toFixed(2) || "0.00"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground/90">Taxa de Conversão</p>
                      <p className="text-lg font-bold">
                        {reportData.sales.metrics?.conversion_rate?.toFixed(2) || "0.00"}%
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {reportData.recommendations && reportData.recommendations.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">Recomendações</h3>
                  <div className="space-y-3">
                    {reportData.recommendations.map((rec, idx) => (
                      <div
                        key={idx}
                        className={`p-3 rounded-lg border ${
                          rec.type === "warning"
                            ? "border-destructive bg-destructive/10"
                            : rec.type === "success"
                            ? "border-primary bg-primary/10"
                            : "border-primary bg-primary/10"
                        }`}
                      >
                        <p className="font-medium">{rec.title}</p>
                        <p className="text-sm text-muted-foreground/90 leading-relaxed">{rec.message}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Relatórios Agendados */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Relatórios Agendados
          </CardTitle>
          <CardDescription>
            Relatórios configurados para envio automático
          </CardDescription>
        </CardHeader>
        <CardContent>
          {scheduledReports.length === 0 ? (
            <div className="text-center py-16 px-4">
              <div className="relative mb-6 max-w-md mx-auto">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-24 h-24 rounded-full bg-primary/10 animate-pulse"></div>
                </div>
                <FileText className="h-16 w-16 text-primary mx-auto relative z-10" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-3">
                Nenhum relatório agendado
              </h3>
              <p className="text-muted-foreground/90 leading-relaxed max-w-md mx-auto mb-6">
                Configure relatórios agendados para receber análises automáticas por email
              </p>
              <Button onClick={() => setShowScheduleModal(true)} className="gap-2 shadow-md hover:shadow-lg transition-all duration-200">
                <Plus className="w-4 h-4" />
                Agendar Relatório
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {scheduledReports.map((schedule) => (
                <div
                  key={schedule.id}
                  className="p-4 border rounded-lg flex items-center justify-between"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-primary" />
                      <span className="font-semibold">
                        {templates.find((t) => t.id === schedule.template_id)?.name ||
                          "Template"}
                      </span>
                    </div>
                    <div className="mt-3 space-y-2 text-sm text-muted-foreground/90">
                      <p>
                        Frequência:{" "}
                        {schedule.frequency === "daily"
                          ? "Diário"
                          : schedule.frequency === "weekly"
                          ? "Semanal"
                          : "Mensal"}
                      </p>
                      <p>
                        Destinatários: {schedule.recipients?.length || 0} email(s)
                      </p>
                      <p>Formato: {schedule.format?.toUpperCase()}</p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCancelSchedule(schedule.id)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de Agendamento */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Agendar Relatório</CardTitle>
              <CardDescription>
                Configure o envio automático de relatórios
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <Label>Template</Label>
                <Select
                  value={scheduleData.template_id}
                  onValueChange={(value) =>
                    setScheduleData({ ...scheduleData, template_id: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um template" />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label>Frequência</Label>
                <Select
                  value={scheduleData.frequency}
                  onValueChange={(value) =>
                    setScheduleData({ ...scheduleData, frequency: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Diário</SelectItem>
                    <SelectItem value="weekly">Semanal</SelectItem>
                    <SelectItem value="monthly">Mensal</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label>Formato</Label>
                <Select
                  value={scheduleData.format}
                  onValueChange={(value) =>
                    setScheduleData({ ...scheduleData, format: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pdf">PDF</SelectItem>
                    <SelectItem value="csv">CSV</SelectItem>
                    <SelectItem value="json">JSON</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label>Destinatários</Label>
                <div className="flex gap-2">
                  <Input
                    type="email"
                    placeholder="email@exemplo.com"
                    value={newRecipient}
                    onChange={(e) => setNewRecipient(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addRecipient();
                      }
                    }}
                  />
                  <Button onClick={addRecipient} type="button">
                    Adicionar
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {scheduleData.recipients.map((email) => (
                    <span
                      key={email}
                      className="flex items-center gap-1 bg-muted px-2 py-1 rounded text-sm"
                    >
                      {email}
                      <button
                        onClick={() => removeRecipient(email)}
                        className="text-muted-foreground/80 hover:text-foreground transition-colors duration-200"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleSchedule} className="flex-1">
                  Agendar
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowScheduleModal(false)}
                  className="flex-1"
                >
                  Cancelar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default AdminReportsPage;
portsPage;
