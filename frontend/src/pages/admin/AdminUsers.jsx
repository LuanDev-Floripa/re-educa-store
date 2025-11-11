import React, { useState, useEffect } from "react";
import logger from "@/utils/logger";
import apiClient from "@/services/apiClient";
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
  Users,
  Search,
  Filter,
  MoreHorizontal,
  UserCheck,
  UserX,
  Mail,
  Calendar,
  Shield,
  Eye,
  Edit,
  Trash2,
  Download,
  Key,
  Loader2,
  X,
} from "lucide-react";
import { toast } from "sonner";

/**
 * AdminUsers
 * Lista e gerencia usuários com filtros, com robustez em storage e API.
 * @returns {JSX.Element}
 */
const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [creating, setCreating] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [newUserData, setNewUserData] = useState({
    name: "",
    email: "",
    password: "",
    role: "user",
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await apiClient.get("/admin/users");
      // A API retorna { users: [], total: 0, page: 1 } ou formato similar
      const usersList = data?.users || data?.data || (Array.isArray(data) ? data : []) || [];
      setUsers(usersList);
    } catch (error) {
      logger.error("Erro ao carregar usuários:", error);
      // Em caso de erro, manter array vazio ao invés de mostrar dados mockados
      setUsers([]);
      if (error.message?.includes('401') || error.message?.includes('Unauthorized')) {
        toast.error("Não autorizado. Faça login novamente.");
      } else {
        toast.error("Erro ao carregar usuários");
      }
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      String(user?.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(user?.email || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === "all" || user?.role === filterRole;
    const matchesStatus =
      filterStatus === "all" || user?.status === filterStatus;

    return matchesSearch && matchesRole && matchesStatus;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case "active":
        return "bg-primary/10 text-primary";
      case "inactive":
        return "bg-muted text-foreground";
      case "suspended":
        return "bg-destructive/10 text-destructive";
      default:
        return "bg-muted text-foreground";
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case "admin":
        return "bg-primary/10 text-primary";
      case "user":
        return "bg-primary/10 text-primary";
      default:
        return "bg-muted text-foreground";
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("pt-BR");
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      const { apiService } = await import("@/lib/api");
      const response = await apiService.admin.createUser(newUserData);
      toast.success("Usuário criado com sucesso!");
      setShowCreateModal(false);
      setNewUserData({ name: "", email: "", password: "", role: "user" });
      loadUsers();
    } catch (error) {
      logger.error("Erro ao criar usuário:", error);
      toast.error(error.message || "Erro ao criar usuário");
    } finally {
      setCreating(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!selectedUser) return;
    setResetting(true);
    try {
      const { apiService } = await import("@/lib/api");
      const formData = new FormData(e.target);
      const sendEmail = formData.get("send_email") === "true";
      const newPassword = formData.get("new_password") || undefined;
      
      const response = await apiService.admin.resetUserPassword(selectedUser.id, {
        new_password: newPassword,
        send_email: sendEmail,
      });
      
      toast.success(
        response.new_password
          ? `Senha resetada: ${response.new_password}`
          : "Senha resetada com sucesso!"
      );
      setShowResetPasswordModal(false);
      setSelectedUser(null);
    } catch (error) {
      logger.error("Erro ao resetar senha:", error);
      toast.error(error.message || "Erro ao resetar senha");
    } finally {
      setResetting(false);
    }
  };

  const handleExportUsers = async () => {
    try {
      const { apiService } = await import("@/lib/api");
      const format = "csv"; // ou "json"
      const params = {
        format,
        role: filterRole !== "all" ? filterRole : undefined,
        status: filterStatus !== "all" ? filterStatus : undefined,
      };
      
      const response = await apiService.admin.exportUsers(params);
      
      // Criar blob e download
      const blob = new Blob([response], {
        type: format === "csv" ? "text/csv" : "application/json",
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `usuarios_${new Date().toISOString().split("T")[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      toast.success("Usuários exportados com sucesso!");
    } catch (error) {
      logger.error("Erro ao exportar usuários:", error);
      toast.error(error.message || "Erro ao exportar usuários");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-border"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Gerenciamento de Usuários
          </h1>
          <p className="text-muted-foreground/90 leading-relaxed">
            Gerencie usuários, permissões e status da conta
          </p>
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={handleExportUsers}
            disabled={loading}
            className="gap-2.5"
          >
            <Download className="h-4 w-4" />
            Exportar
          </Button>
          <Button onClick={() => setShowCreateModal(true)} className="gap-2.5">
            <Users className="h-4 w-4" />
            Novo Usuário
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-primary mr-3" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total de Usuários
                </p>
                <p className="text-2xl font-bold text-foreground">
                  {users.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <UserCheck className="h-8 w-8 text-primary mr-3" />
              <div>
                <p className="text-sm font-medium text-muted-foreground/90">
                  Usuários Ativos
                </p>
                <p className="text-2xl font-bold text-foreground">
                  {users.filter((u) => u.status === "active").length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <UserX className="h-8 w-8 text-muted-foreground mr-3" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Usuários Inativos
                </p>
                <p className="text-2xl font-bold text-foreground">
                  {users.filter((u) => u.status === "inactive").length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Shield className="h-8 w-8 text-primary mr-3" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Administradores
                </p>
                <p className="text-2xl font-bold text-foreground">
                  {users.filter((u) => u.role === "admin").length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Buscar usuários..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="border border-border/50 rounded-lg px-4 py-2.5 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all duration-200"
              >
                <option value="all">Todos os Roles</option>
                <option value="admin">Administrador</option>
                <option value="user">Usuário</option>
              </select>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="border border-border/50 rounded-lg px-4 py-2.5 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all duration-200"
              >
                <option value="all">Todos os Status</option>
                <option value="active">Ativo</option>
                <option value="inactive">Inativo</option>
                <option value="suspended">Suspenso</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Usuários</CardTitle>
          <CardDescription>
            {filteredUsers.length} usuário(s) encontrado(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredUsers.length === 0 ? (
            <div className="text-center py-16 px-4">
              <div className="max-w-md mx-auto">
                <div className="relative mb-6">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-primary/10 animate-pulse"></div>
                  </div>
                  <Users className="w-16 h-16 sm:w-20 sm:h-20 text-primary mx-auto relative z-10" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-3">
                  {searchTerm || filterRole !== "all" || filterStatus !== "all"
                    ? "Nenhum usuário encontrado"
                    : "Nenhum usuário cadastrado"}
                </h3>
                <p className="text-sm sm:text-base text-muted-foreground mb-8 leading-relaxed">
                  {searchTerm || filterRole !== "all" || filterStatus !== "all"
                    ? "Tente ajustar os filtros ou a busca para encontrar mais usuários."
                    : "Comece criando o primeiro usuário do sistema."}
                </p>
                {!searchTerm && filterRole === "all" && filterStatus === "all" && (
                  <Button
                    onClick={() => setShowCreateModal(true)}
                    className="inline-flex items-center gap-2 px-6 py-3 text-sm sm:text-base font-medium rounded-lg text-primary-foreground bg-primary hover:bg-primary/90 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
                  >
                    <Users className="w-4 h-4" />
                    Criar Primeiro Usuário
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 font-medium text-foreground">
                      Usuário
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-foreground">
                      Role
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-foreground">
                      Status
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-foreground">
                      Verificação
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-foreground">
                      Pedidos
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-foreground">
                      Total Gasto
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-foreground">
                      Último Login
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-foreground">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                  <tr
                    key={user.id}
                    className="border-b border-border hover:bg-accent"
                  >
                    <td className="py-4 px-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-muted-foreground">
                            {user.name.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <div className="font-medium text-foreground">
                            {user?.name || "Usuário"}
                          </div>
                          <div className="text-sm text-muted-foreground dark:text-muted-foreground">
                            {user?.email || ""}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <Badge className={getRoleColor(user?.role)}>
                        {user?.role === "admin" ? "Administrador" : "Usuário"}
                      </Badge>
                    </td>
                    <td className="py-4 px-4">
                      <Badge className={getStatusColor(user?.status)}>
                        {user?.status === "active"
                          ? "Ativo"
                          : user?.status === "inactive"
                            ? "Inativo"
                            : "Suspenso"}
                      </Badge>
                    </td>
                    <td className="py-4 px-4">
                      {user?.emailVerified ? (
                        <Badge className="bg-primary/10 text-primary">
                          Verificado
                        </Badge>
                      ) : (
                        <Badge className="bg-muted text-muted-foreground">
                          Pendente
                        </Badge>
                      )}
                    </td>
                    <td className="py-4 px-4 text-foreground">
                      {Number(user?.totalOrders || 0)}
                    </td>
                    <td className="py-4 px-4 text-foreground">
                      {formatCurrency(Number(user?.totalSpent || 0))}
                    </td>
                    <td className="py-4 px-4 text-muted-foreground dark:text-muted-foreground">
                      {user?.lastLogin ? formatDate(user.lastLogin) : "—"}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedUser(user);
                            setShowResetPasswordModal(true);
                          }}
                          title="Resetar senha"
                        >
                          <Key className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" title="Ver detalhes">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" title="Editar">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de Criar Usuário */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Criar Novo Usuário</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowCreateModal(false);
                  setNewUserData({ name: "", email: "", password: "", role: "user" });
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateUser} className="space-y-4">
                <div>
                  <Label htmlFor="name">Nome *</Label>
                  <Input
                    id="name"
                    value={newUserData.name}
                    onChange={(e) =>
                      setNewUserData({ ...newUserData, name: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newUserData.email}
                    onChange={(e) =>
                      setNewUserData({ ...newUserData, email: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="password">Senha *</Label>
                  <Input
                    id="password"
                    type="password"
                    value={newUserData.password}
                    onChange={(e) =>
                      setNewUserData({ ...newUserData, password: e.target.value })
                    }
                    required
                    minLength={8}
                  />
                </div>
                <div>
                  <Label htmlFor="role">Role</Label>
                  <Select
                    value={newUserData.role}
                    onValueChange={(value) =>
                      setNewUserData({ ...newUserData, role: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">Usuário</SelectItem>
                      <SelectItem value="admin">Administrador</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowCreateModal(false);
                      setNewUserData({ name: "", email: "", password: "", role: "user" });
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={creating} className="gap-2.5">
                    {creating ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Criando...
                      </>
                    ) : (
                      "Criar"
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal de Resetar Senha */}
      {showResetPasswordModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Resetar Senha</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowResetPasswordModal(false);
                  setSelectedUser(null);
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Resetar senha para: <strong>{selectedUser.email}</strong>
              </p>
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div>
                  <Label htmlFor="new_password">Nova Senha (deixe em branco para gerar aleatória)</Label>
                  <Input
                    id="new_password"
                    name="new_password"
                    type="password"
                    placeholder="Deixe em branco para gerar automaticamente"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="send_email"
                    name="send_email"
                    value="true"
                    defaultChecked
                    className="rounded"
                  />
                  <Label htmlFor="send_email" className="cursor-pointer">
                    Enviar email com nova senha
                  </Label>
                </div>
                <div className="flex justify-end gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowResetPasswordModal(false);
                      setSelectedUser(null);
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={resetting} className="gap-2.5">
                    {resetting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Resetando...
                      </>
                    ) : (
                      "Resetar Senha"
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;
