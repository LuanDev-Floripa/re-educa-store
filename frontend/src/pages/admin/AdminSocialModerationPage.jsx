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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/Ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/Ui/tabs";
import {
  Shield,
  AlertTriangle,
  Ban,
  CheckCircle,
  XCircle,
  Eye,
  Trash2,
  RefreshCw,
  Search,
  Filter,
  UserX,
  FileText,
  Calendar,
  User,
} from "lucide-react";

/**
 * AdminSocialModerationPage
 * Moderação completa de conteúdo social.
 * @returns {JSX.Element}
 */
const AdminSocialModerationPage = () => {
  const [reports, setReports] = useState([]);
  const [bannedUsers, setBannedUsers] = useState([]);
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState({
    pending_reports: 0,
    reviewing_reports: 0,
    resolved_reports: 0,
    banned_users: 0,
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("reports");
  const [filters, setFilters] = useState({
    status: "all",
    report_type: "all",
  });
  const [selectedReport, setSelectedReport] = useState(null);
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [showBanModal, setShowBanModal] = useState(false);
  const [resolveData, setResolveData] = useState({
    status: "resolved",
    resolution_note: "",
    action_taken: "",
  });
  const [banData, setBanData] = useState({
    user_id: "",
    reason: "",
    ban_type: "temporary",
    expires_at: "",
  });
  const [pagination, setPagination] = useState({
    page: 1,
    per_page: 20,
    total: 0,
    pages: 0,
  });

  useEffect(() => {
    loadData();
  }, [activeTab, pagination.page, filters]);

  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([loadStats(), loadReports(), loadBannedUsers(), loadHistory()]);
    } catch (error) {
      logger.error("Erro ao carregar dados:", error);
      toast.error("Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await apiClient.get("/api/admin/social/moderation/stats");
      if (response?.stats) {
        setStats(response.stats);
      }
    } catch (error) {
      logger.error("Erro ao carregar estatísticas:", error);
    }
  };

  const loadReports = async () => {
    try {
      const params = {
        page: pagination.page,
        per_page: pagination.per_page,
      };
      if (filters.status !== "all") params.status = filters.status;
      if (filters.report_type !== "all") params.report_type = filters.report_type;

      const response = await apiClient.get("/api/admin/social/moderation/reports", {
        params,
      });

      setReports(response?.reports || []);
      setPagination({
        ...pagination,
        total: response?.total || 0,
        pages: response?.pages || 0,
      });
    } catch (error) {
      logger.error("Erro ao carregar reports:", error);
      setReports([]);
    }
  };

  const loadBannedUsers = async () => {
    try {
      const response = await apiClient.get("/api/admin/social/moderation/banned", {
        params: { page: 1, per_page: 50 },
      });

      setBannedUsers(response?.banned_users || []);
    } catch (error) {
      logger.error("Erro ao carregar usuários banidos:", error);
      setBannedUsers([]);
    }
  };

  const loadHistory = async () => {
    try {
      const response = await apiClient.get("/api/admin/social/moderation/history", {
        params: { page: 1, per_page: 50 },
      });

      setHistory(response?.history || []);
    } catch (error) {
      logger.error("Erro ao carregar histórico:", error);
      setHistory([]);
    }
  };

  const handleResolveReport = async () => {
    if (!selectedReport) return;

    try {
      const response = await apiClient.put(
        `/api/admin/social/moderation/reports/${selectedReport.id}/resolve`,
        resolveData
      );

      if (response?.success) {
        toast.success("Report resolvido com sucesso!");
        setShowResolveModal(false);
        setSelectedReport(null);
        loadData();
      } else {
        throw new Error(response?.error || "Erro ao resolver report");
      }
    } catch (error) {
      logger.error("Erro ao resolver report:", error);
      toast.error(error.message || "Erro ao resolver report");
    }
  };

  const handleBanUser = async () => {
    if (!banData.user_id || !banData.reason) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    try {
      const response = await apiClient.post(
        "/api/admin/social/moderation/ban",
        banData
      );

      if (response?.success) {
        toast.success("Usuário banido com sucesso!");
        setShowBanModal(false);
        setBanData({
          user_id: "",
          reason: "",
          ban_type: "temporary",
          expires_at: "",
        });
        loadData();
      } else {
        throw new Error(response?.error || "Erro ao banir usuário");
      }
    } catch (error) {
      logger.error("Erro ao banir usuário:", error);
      toast.error(error.message || "Erro ao banir usuário");
    }
  };

  const handleUnbanUser = async (userId) => {
    if (!confirm("Tem certeza que deseja desbanir este usuário?")) return;

    try {
      const response = await apiClient.post(
        `/api/admin/social/moderation/unban/${userId}`
      );

      if (response?.success) {
        toast.success("Usuário desbanido com sucesso!");
        loadData();
      } else {
        throw new Error(response?.error || "Erro ao desbanir usuário");
      }
    } catch (error) {
      logger.error("Erro ao desbanir usuário:", error);
      toast.error(error.message || "Erro ao desbanir usuário");
    }
  };

  const handleDeletePost = async (postId) => {
    if (!confirm("Tem certeza que deseja deletar este post?")) return;

    try {
      const response = await apiClient.delete(
        `/api/admin/social/moderation/posts/${postId}`,
        { data: { reason: "Conteúdo inapropriado" } }
      );

      if (response?.success) {
        toast.success("Post deletado com sucesso!");
        loadData();
      } else {
        throw new Error(response?.error || "Erro ao deletar post");
      }
    } catch (error) {
      logger.error("Erro ao deletar post:", error);
      toast.error(error.message || "Erro ao deletar post");
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!confirm("Tem certeza que deseja deletar este comentário?")) return;

    try {
      const response = await apiClient.delete(
        `/api/admin/social/moderation/comments/${commentId}`,
        { data: { reason: "Comentário inapropriado" } }
      );

      if (response?.success) {
        toast.success("Comentário deletado com sucesso!");
        loadData();
      } else {
        throw new Error(response?.error || "Erro ao deletar comentário");
      }
    } catch (error) {
      logger.error("Erro ao deletar comentário:", error);
      toast.error(error.message || "Erro ao deletar comentário");
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "warning";
      case "reviewing":
        return "default";
      case "approved":
      case "resolved":
        return "default";
      case "rejected":
        return "destructive";
      default:
        return "default";
    }
  };

  const getReportTypeLabel = (type) => {
    const labels = {
      spam: "Spam",
      harassment: "Assédio",
      inappropriate: "Inapropriado",
      fake: "Falso",
      other: "Outro",
    };
    return labels[type] || type;
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleString("pt-BR");
    } catch {
      return dateString;
    }
  };

  if (loading && reports.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Carregando moderação...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            Moderação Social
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            Gerencie reports, usuários banidos e histórico de moderação
          </p>
        </div>
        <Button variant="outline" onClick={loadData}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Atualizar
        </Button>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-muted-foreground">
                  Reports Pendentes
                </p>
                <p className="text-xl sm:text-2xl font-bold mt-1 text-primary">
                  {stats.pending_reports}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-muted-foreground">
                  Em Revisão
                </p>
                <p className="text-xl sm:text-2xl font-bold mt-1">
                  {stats.reviewing_reports}
                </p>
              </div>
              <Eye className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-muted-foreground">
                  Resolvidos
                </p>
                <p className="text-xl sm:text-2xl font-bold mt-1">
                  {stats.resolved_reports}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-muted-foreground">
                  Usuários Banidos
                </p>
                <p className="text-xl sm:text-2xl font-bold mt-1 text-destructive">
                  {stats.banned_users}
                </p>
              </div>
              <Ban className="h-8 w-8 text-destructive" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="reports">Reports</TabsTrigger>
          <TabsTrigger value="banned">Banidos</TabsTrigger>
          <TabsTrigger value="history">Histórico</TabsTrigger>
        </TabsList>

        <TabsContent value="reports" className="space-y-4">
          {/* Filtros */}
          <Card>
            <CardContent className="p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={filters.status}
                    onValueChange={(value) =>
                      setFilters({ ...filters, status: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="pending">Pendente</SelectItem>
                      <SelectItem value="reviewing">Em Revisão</SelectItem>
                      <SelectItem value="resolved">Resolvido</SelectItem>
                      <SelectItem value="approved">Aprovado</SelectItem>
                      <SelectItem value="rejected">Rejeitado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="report_type">Tipo</Label>
                  <Select
                    value={filters.report_type}
                    onValueChange={(value) =>
                      setFilters({ ...filters, report_type: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="spam">Spam</SelectItem>
                      <SelectItem value="harassment">Assédio</SelectItem>
                      <SelectItem value="inappropriate">Inapropriado</SelectItem>
                      <SelectItem value="fake">Falso</SelectItem>
                      <SelectItem value="other">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Lista de Reports */}
          <Card>
            <CardHeader>
              <CardTitle>Reports de Conteúdo</CardTitle>
              <CardDescription>
                {reports.length} report(s) encontrado(s)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {reports.length === 0 ? (
                  <div className="text-center py-16 px-4">
                    <div className="relative mb-6 max-w-md mx-auto">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-24 h-24 rounded-full bg-primary/10 animate-pulse"></div>
                      </div>
                      <Shield className="h-16 w-16 text-primary mx-auto relative z-10" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-3">
                      Nenhum report encontrado
                    </h3>
                    <p className="text-muted-foreground/90 leading-relaxed max-w-md mx-auto">
                      {statusFilter !== "all"
                        ? "Tente ajustar os filtros de status para encontrar reports"
                        : "Os reports de conteúdo aparecerão aqui quando usuários reportarem posts ou comentários"}
                    </p>
                  </div>
                ) : (
                  reports.map((report) => (
                    <div
                      key={report.id}
                      className="flex items-start justify-between p-4 border rounded-lg hover:bg-accent transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant={getStatusColor(report.status)}>
                            {report.status}
                          </Badge>
                          <Badge variant="outline">
                            {getReportTypeLabel(report.report_type)}
                          </Badge>
                        </div>
                        <p className="text-sm font-medium mb-1">
                          {report.reason}
                        </p>
                        <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            Reportado por: {report.reporter_id?.substring(0, 8)}...
                          </span>
                          {report.post_id && (
                            <span>Post: {report.post_id.substring(0, 8)}...</span>
                          )}
                          {report.comment_id && (
                            <span>Comentário: {report.comment_id.substring(0, 8)}...</span>
                          )}
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(report.created_at)}
                          </span>
                        </div>
                        {report.resolution_note && (
                          <p className="text-xs text-muted-foreground mt-2">
                            Resolução: {report.resolution_note}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedReport(report);
                            setResolveData({
                              status: "resolved",
                              resolution_note: "",
                              action_taken: "",
                            });
                            setShowResolveModal(true);
                          }}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Resolver
                        </Button>
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

        <TabsContent value="banned" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Usuários Banidos</CardTitle>
                  <CardDescription>
                    {bannedUsers.length} usuário(s) banido(s)
                  </CardDescription>
                </div>
                <Button onClick={() => setShowBanModal(true)}>
                  <Ban className="h-4 w-4 mr-2" />
                  Banir Usuário
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {bannedUsers.length === 0 ? (
                  <div className="text-center py-16 px-4">
                    <div className="relative mb-6 max-w-md mx-auto">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-24 h-24 rounded-full bg-primary/10 animate-pulse"></div>
                      </div>
                      <UserX className="h-16 w-16 text-primary mx-auto relative z-10" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-3">
                      Nenhum usuário banido
                    </h3>
                    <p className="text-muted-foreground/90 leading-relaxed max-w-md mx-auto">
                      Ótimo! Não há usuários banidos no momento. Continue monitorando a plataforma para manter um ambiente saudável.
                    </p>
                  </div>
                ) : (
                  bannedUsers.map((banned) => (
                    <div
                      key={banned.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex-1">
                        <p className="font-medium">Usuário: {banned.user_id?.substring(0, 8)}...</p>
                        <p className="text-sm text-muted-foreground">
                          Motivo: {banned.reason}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
                          <Badge variant={banned.ban_type === "permanent" ? "destructive" : "warning"}>
                            {banned.ban_type === "permanent" ? "Permanente" : "Temporário"}
                          </Badge>
                          {banned.expires_at && (
                            <span>Expira em: {formatDate(banned.expires_at)}</span>
                          )}
                          <span>Banido em: {formatDate(banned.created_at)}</span>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUnbanUser(banned.user_id)}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Desbanir
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Moderação</CardTitle>
              <CardDescription>
                {history.length} ação(ões) registrada(s)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {history.length === 0 ? (
                  <div className="text-center py-16 px-4">
                    <div className="relative mb-6 max-w-md mx-auto">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-24 h-24 rounded-full bg-primary/10 animate-pulse"></div>
                      </div>
                      <FileText className="h-16 w-16 text-primary mx-auto relative z-10" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-3">
                      Nenhum histórico encontrado
                    </h3>
                    <p className="text-muted-foreground/90 leading-relaxed max-w-md mx-auto">
                      O histórico de ações de moderação aparecerá aqui quando houver ações realizadas
                    </p>
                  </div>
                ) : (
                  history.map((entry) => (
                    <div
                      key={entry.id}
                      className="flex items-start justify-between p-4 border rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline">{entry.action_type}</Badge>
                          <Badge variant="outline">{entry.target_type}</Badge>
                        </div>
                        <p className="text-sm">
                          {entry.reason || "Sem motivo especificado"}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
                          <span>Moderador: {entry.moderator_id?.substring(0, 8)}...</span>
                          <span>Alvo: {entry.target_id?.substring(0, 8)}...</span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(entry.created_at)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal de Resolver Report */}
      <Dialog open={showResolveModal} onOpenChange={setShowResolveModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resolver Report</DialogTitle>
            <DialogDescription>
              {selectedReport?.reason || "Report"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="resolve_status">Status</Label>
              <Select
                value={resolveData.status}
                onValueChange={(value) =>
                  setResolveData({ ...resolveData, status: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="resolved">Resolvido</SelectItem>
                  <SelectItem value="approved">Aprovado</SelectItem>
                  <SelectItem value="rejected">Rejeitado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="resolution_note">Nota de Resolução</Label>
              <Input
                id="resolution_note"
                value={resolveData.resolution_note}
                onChange={(e) =>
                  setResolveData({
                    ...resolveData,
                    resolution_note: e.target.value,
                  })
                }
                placeholder="Descreva a resolução..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="action_taken">Ação Tomada (opcional)</Label>
              <Input
                id="action_taken"
                value={resolveData.action_taken}
                onChange={(e) =>
                  setResolveData({ ...resolveData, action_taken: e.target.value })
                }
                placeholder="Ex: post_deleted, user_banned"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowResolveModal(false)}>
              Cancelar
            </Button>
            <Button onClick={handleResolveReport}>Resolver</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Banir Usuário */}
      <Dialog open={showBanModal} onOpenChange={setShowBanModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Banir Usuário</DialogTitle>
            <DialogDescription>
              Banir um usuário da plataforma
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="ban_user_id">ID do Usuário *</Label>
              <Input
                id="ban_user_id"
                value={banData.user_id}
                onChange={(e) =>
                  setBanData({ ...banData, user_id: e.target.value })
                }
                placeholder="UUID do usuário"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ban_reason">Motivo *</Label>
              <Input
                id="ban_reason"
                value={banData.reason}
                onChange={(e) =>
                  setBanData({ ...banData, reason: e.target.value })
                }
                placeholder="Motivo do banimento"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ban_type">Tipo de Ban</Label>
              <Select
                value={banData.ban_type}
                onValueChange={(value) =>
                  setBanData({ ...banData, ban_type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="temporary">Temporário</SelectItem>
                  <SelectItem value="permanent">Permanente</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {banData.ban_type === "temporary" && (
              <div className="space-y-2">
                <Label htmlFor="expires_at">Data de Expiração *</Label>
                <Input
                  id="expires_at"
                  type="datetime-local"
                  value={banData.expires_at}
                  onChange={(e) =>
                    setBanData({ ...banData, expires_at: e.target.value })
                  }
                  required
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBanModal(false)}>
              Cancelar
            </Button>
            <Button onClick={handleBanUser}>Banir</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminSocialModerationPage;
