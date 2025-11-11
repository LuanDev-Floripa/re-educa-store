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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/Ui/dialog";
import {
  Search,
  Filter,
  Package,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Plus,
  Minus,
  Edit,
  Eye,
  Download,
  RefreshCw,
  Calendar,
  BarChart3,
  Settings,
  CheckCircle,
  XCircle,
} from "lucide-react";

/**
 * AdminInventoryPage
 * Gestão completa de estoque com visualização, atualização e relatórios.
 * @returns {JSX.Element}
 */
const AdminInventoryPage = () => {
  const [products, setProducts] = useState([]);
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [updateData, setUpdateData] = useState({
    operation: "set",
    quantity: 0,
    reason: "",
  });
  const [alertSettings, setAlertSettings] = useState({
    threshold: 10,
    enabled: true,
    notify_admins: true,
  });
  const [activeTab, setActiveTab] = useState("overview");
  const [workerStatus, setWorkerStatus] = useState(null);

  useEffect(() => {
    loadInventoryData();
    loadWorkerStatus();
  }, []);

  const loadWorkerStatus = async () => {
    try {
      const response = await apiClient.inventory.getWorkerStatus();
      if (response?.success && response?.worker) {
        setWorkerStatus(response.worker);
      }
    } catch (error) {
      // Worker pode não estar rodando, não é erro crítico
      logger.debug("Worker status não disponível:", error);
    }
  };

  const loadInventoryData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadProducts(),
        loadLowStockProducts(),
        loadMovements(),
      ]);
    } catch (error) {
      logger.error("Erro ao carregar dados de estoque:", error);
      toast.error("Erro ao carregar dados de estoque");
    } finally {
      setLoading(false);
    }
  };

  const loadProducts = async () => {
    try {
      const response = await apiClient.get("/api/products");
      const productsList =
        response?.products ||
        response?.data ||
        (Array.isArray(response) ? response : []);
      setProducts(productsList);
    } catch (error) {
      logger.error("Erro ao carregar produtos:", error);
      setProducts([]);
    }
  };

  const loadLowStockProducts = async () => {
    try {
      const response = await apiClient.get("/api/inventory/low-stock", {
        params: { threshold: 10 },
      });
      const lowStock =
        response?.products ||
        response?.data ||
        (Array.isArray(response) ? response : []);
      setLowStockProducts(lowStock);
    } catch (error) {
      logger.error("Erro ao carregar produtos com estoque baixo:", error);
      setLowStockProducts([]);
    }
  };

  const loadMovements = async () => {
    try {
      const response = await apiClient.get("/api/inventory/movements", {
        params: { page: 1, limit: 50 },
      });
      const movementsList =
        response?.movements ||
        response?.data ||
        (Array.isArray(response) ? response : []);
      setMovements(movementsList);
    } catch (error) {
      logger.error("Erro ao carregar movimentações:", error);
      setMovements([]);
    }
  };

  const handleCheckAlerts = async () => {
    try {
      const response = await apiClient.post("/api/inventory/alerts/check", null, {
        params: { threshold: alertSettings.threshold },
      });

      if (response?.success) {
        toast.success(
          `${response.alerts_sent || 0} alertas enviados com sucesso!`
        );
        loadLowStockProducts();
      } else {
        throw new Error(response?.error || "Erro ao verificar alertas");
      }
    } catch (error) {
      logger.error("Erro ao verificar alertas:", error);
      toast.error(error.message || "Erro ao verificar alertas");
    }
  };

  const handleUpdateStock = async () => {
    if (!selectedProduct) return;

    try {
      const response = await apiClient.post(
        `/api/inventory/stock/${selectedProduct.id}/update`,
        {
          quantity: parseInt(updateData.quantity),
          operation: updateData.operation,
          reason: updateData.reason || "Ajuste manual",
        }
      );

      if (response?.success) {
        toast.success("Estoque atualizado com sucesso!");
        setShowUpdateModal(false);
        setUpdateData({ operation: "set", quantity: 0, reason: "" });
        setSelectedProduct(null);
        loadInventoryData();
      } else {
        throw new Error(response?.error || "Erro ao atualizar estoque");
      }
    } catch (error) {
      logger.error("Erro ao atualizar estoque:", error);
      toast.error(error.message || "Erro ao atualizar estoque");
    }
  };

  const handleSaveAlertSettings = async () => {
    if (!selectedProduct) return;

    try {
      const response = await apiClient.post(
        "/api/inventory/alerts/settings",
        {
          product_id: selectedProduct.id,
          ...alertSettings,
        }
      );

      if (response?.success) {
        toast.success("Configurações de alerta salvas!");
        setShowSettingsModal(false);
      } else {
        throw new Error(response?.error || "Erro ao salvar configurações");
      }
    } catch (error) {
      logger.error("Erro ao salvar configurações:", error);
      toast.error(error.message || "Erro ao salvar configurações");
    }
  };


  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      String(product?.name || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      String(product?.id || "").includes(searchTerm);
    const matchesStatus =
      filterStatus === "all" ||
      (filterStatus === "low" && product.stock_quantity <= 10) ||
      (filterStatus === "out" && product.stock_quantity === 0) ||
      (filterStatus === "ok" && product.stock_quantity > 10);

    return matchesSearch && matchesStatus;
  });

  const getStockStatus = (stock, minStock = 0) => {
    if (stock === 0) return { label: "Sem Estoque", color: "destructive" };
    if (stock <= minStock || stock <= 10)
      return { label: "Estoque Baixo", color: "warning" };
    return { label: "Em Estoque", color: "default" };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Carregando estoque...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            Gestão de Estoque
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground/90 leading-relaxed mt-1">
            Gerencie o estoque de produtos da plataforma
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleCheckAlerts}
            className="w-full sm:w-auto gap-2.5"
          >
            <AlertTriangle className="h-4 w-4" />
            Verificar Alertas
          </Button>
          <Button
            variant="outline"
            onClick={loadInventoryData}
            className="w-full sm:w-auto gap-2.5"
          >
            <RefreshCw className="h-4 w-4" />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Status do Worker */}
      {workerStatus && (
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground/90">
                  Worker de Alertas
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge
                    variant={workerStatus.running ? "default" : "secondary"}
                    className={
                      workerStatus.running
                        ? "bg-primary"
                        : "bg-muted/50"
                    }
                  >
                    {workerStatus.running ? "Ativo" : "Inativo"}
                  </Badge>
                  {workerStatus.last_check && (
                    <span className="text-xs text-muted-foreground/90">
                      Última verificação:{" "}
                      {new Date(workerStatus.last_check).toLocaleString("pt-BR")}
                    </span>
                  )}
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground/90">
                  Verificações: {workerStatus.total_checks || 0}
                </p>
                <p className="text-xs text-muted-foreground/90">
                  Alertas enviados: {workerStatus.total_alerts_sent || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Estatísticas Rápidas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-muted-foreground/90">
                  Total de Produtos
                </p>
                <p className="text-xl sm:text-2xl font-bold mt-1">
                  {products.length}
                </p>
              </div>
              <Package className="h-8 w-8 text-muted-foreground/60" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-muted-foreground/90">
                  Estoque Baixo
                </p>
                <p className="text-xl sm:text-2xl font-bold mt-1 text-primary">
                  {lowStockProducts.length}
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
                  Sem Estoque
                </p>
                <p className="text-xl sm:text-2xl font-bold mt-1 text-destructive">
                  {products.filter((p) => p.stock_quantity === 0).length}
                </p>
              </div>
              <XCircle className="h-8 w-8 text-destructive" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-muted-foreground">
                  Movimentações
                </p>
                <p className="text-xl sm:text-2xl font-bold mt-1">
                  {movements.length}
                </p>
              </div>
              <BarChart3 className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 sm:grid-cols-4">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="low-stock">Estoque Baixo</TabsTrigger>
          <TabsTrigger value="movements">Movimentações</TabsTrigger>
          <TabsTrigger value="settings">Configurações</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Filtros */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar produtos..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Filtrar por status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="ok">Em Estoque</SelectItem>
                    <SelectItem value="low">Estoque Baixo</SelectItem>
                    <SelectItem value="out">Sem Estoque</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Lista de Produtos */}
          <Card>
            <CardHeader>
              <CardTitle>Produtos em Estoque</CardTitle>
              <CardDescription>
                Gerencie o estoque de todos os produtos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredProducts.length === 0 ? (
                  <div className="text-center py-16 px-4">
                    <div className="relative mb-6 max-w-md mx-auto">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-24 h-24 rounded-full bg-primary/10 animate-pulse"></div>
                      </div>
                      <Package className="h-16 w-16 text-primary mx-auto relative z-10" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-3">
                      Nenhum produto encontrado
                    </h3>
                    <p className="text-muted-foreground/90 leading-relaxed max-w-md mx-auto">
                      {searchTerm || statusFilter !== "all"
                        ? "Tente ajustar os filtros de busca para encontrar produtos"
                        : "Adicione produtos ao sistema para começar a gerenciar o estoque"}
                    </p>
                  </div>
                ) : (
                  filteredProducts.map((product) => {
                    const stockStatus = getStockStatus(
                      product.stock_quantity || 0,
                      product.min_stock || 0
                    );
                    return (
                      <div
                        key={product.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3">
                            <div className="flex-shrink-0">
                              {product.image ? (
                                <img
                                  src={product.image}
                                  alt={product.name}
                                  className="w-12 h-12 rounded object-cover"
                                />
                              ) : (
                                <div className="w-12 h-12 rounded bg-muted flex items-center justify-center">
                                  <Package className="h-6 w-6 text-muted-foreground/60" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">
                                {product.name || "Produto sem nome"}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                ID: {product.id}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-sm font-medium">
                              {product.stock_quantity || 0} unidades
                            </p>
                            <Badge variant={stockStatus.color} className="mt-1">
                              {stockStatus.label}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedProduct(product);
                                setUpdateData({
                                  operation: "set",
                                  quantity: product.stock_quantity || 0,
                                  reason: "",
                                });
                                setShowUpdateModal(true);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedProduct(product);
                                setShowSettingsModal(true);
                              }}
                            >
                              <Settings className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="low-stock" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-primary" />
                Produtos com Estoque Baixo
              </CardTitle>
              <CardDescription>
                Produtos que precisam de reposição urgente
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {lowStockProducts.length === 0 ? (
                  <div className="text-center py-16 px-4">
                    <div className="relative mb-6 max-w-md mx-auto">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-24 h-24 rounded-full bg-primary/10 animate-pulse"></div>
                      </div>
                      <CheckCircle className="h-16 w-16 text-primary mx-auto relative z-10" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-3">
                      Estoque em dia!
                    </h3>
                    <p className="text-muted-foreground/90 leading-relaxed max-w-md mx-auto">
                      Todos os produtos estão com estoque adequado. Continue monitorando para manter os níveis ideais.
                    </p>
                  </div>
                ) : (
                  lowStockProducts.map((product) => {
                    const stockStatus = getStockStatus(
                      product.stock_quantity || 0,
                      product.min_stock || 0
                    );
                    return (
                      <div
                        key={product.id}
                        className="flex items-center justify-between p-4 border border-destructive/20 rounded-lg bg-destructive/10"
                      >
                        <div className="flex items-center gap-3">
                          {product.image ? (
                            <img
                              src={product.image}
                              alt={product.name}
                              className="w-12 h-12 rounded object-cover"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded bg-muted flex items-center justify-center">
                              <Package className="h-6 w-6 text-muted-foreground" />
                            </div>
                          )}
                          <div>
                            <p className="font-medium">{product.name}</p>
                            <p className="text-sm text-muted-foreground">
                              Estoque: {product.stock_quantity || 0} unidades
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="warning">{stockStatus.label}</Badge>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedProduct(product);
                              setUpdateData({
                                operation: "add",
                                quantity: 10,
                                reason: "Reposição de estoque baixo",
                              });
                              setShowUpdateModal(true);
                            }}
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Repor
                          </Button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="movements" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Movimentações</CardTitle>
              <CardDescription>
                Registro de todas as alterações de estoque
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {movements.length === 0 ? (
                  <div className="text-center py-16 px-4">
                    <div className="relative mb-6 max-w-md mx-auto">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-24 h-24 rounded-full bg-primary/10 animate-pulse"></div>
                      </div>
                      <BarChart3 className="h-16 w-16 text-primary mx-auto relative z-10" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-3">
                      Nenhuma movimentação registrada
                    </h3>
                    <p className="text-muted-foreground/90 leading-relaxed max-w-md mx-auto">
                      As movimentações de estoque aparecerão aqui quando houver alterações nos produtos.
                    </p>
                  </div>
                ) : (
                  movements.map((movement, index) => (
                    <div
                      key={movement.id || index}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        {movement.operation === "add" ? (
                          <TrendingUp className="h-5 w-5 text-primary" />
                        ) : movement.operation === "subtract" ? (
                          <TrendingDown className="h-5 w-5 text-destructive" />
                        ) : (
                          <Edit className="h-5 w-5 text-primary" />
                        )}
                        <div>
                          <p className="font-medium">
                            {movement.product_name || "Produto"}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {movement.reason || "Movimentação de estoque"}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {movement.created_at
                              ? new Date(movement.created_at).toLocaleString()
                              : "Data não disponível"}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p
                          className={`font-medium ${
                            movement.operation === "add"
                              ? "text-primary"
                              : movement.operation === "subtract"
                              ? "text-destructive"
                              : "text-primary"
                          }`}
                        >
                          {movement.operation === "add" ? "+" : "-"}
                          {movement.quantity || 0}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Estoque: {movement.new_stock || 0}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configurações de Alertas</CardTitle>
              <CardDescription>
                Configure alertas automáticos de estoque baixo
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="threshold">Threshold de Estoque Baixo</Label>
                <Input
                  id="threshold"
                  type="number"
                  value={alertSettings.threshold}
                  onChange={(e) =>
                    setAlertSettings({
                      ...alertSettings,
                      threshold: parseInt(e.target.value) || 10,
                    })
                  }
                  min="0"
                />
                <p className="text-xs text-muted-foreground">
                  Produtos com estoque igual ou abaixo deste valor serão
                  considerados com estoque baixo
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="enabled"
                  checked={alertSettings.enabled}
                  onChange={(e) =>
                    setAlertSettings({
                      ...alertSettings,
                      enabled: e.target.checked,
                    })
                  }
                  className="rounded"
                />
                <Label htmlFor="enabled">Habilitar alertas automáticos</Label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="notify_admins"
                  checked={alertSettings.notify_admins}
                  onChange={(e) =>
                    setAlertSettings({
                      ...alertSettings,
                      notify_admins: e.target.checked,
                    })
                  }
                  className="rounded"
                />
                <Label htmlFor="notify_admins">
                  Notificar administradores
                </Label>
              </div>
              <Button onClick={handleCheckAlerts} className="w-full sm:w-auto">
                <AlertTriangle className="h-4 w-4 mr-2" />
                Verificar Alertas Agora
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal de Atualização de Estoque */}
      <Dialog open={showUpdateModal} onOpenChange={setShowUpdateModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Atualizar Estoque</DialogTitle>
            <DialogDescription>
              {selectedProduct?.name || "Produto"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="operation">Operação</Label>
              <Select
                value={updateData.operation}
                onValueChange={(value) =>
                  setUpdateData({ ...updateData, operation: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="set">Definir quantidade</SelectItem>
                  <SelectItem value="add">Adicionar</SelectItem>
                  <SelectItem value="subtract">Subtrair</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantidade</Label>
              <Input
                id="quantity"
                type="number"
                value={updateData.quantity}
                onChange={(e) =>
                  setUpdateData({
                    ...updateData,
                    quantity: parseInt(e.target.value) || 0,
                  })
                }
                min="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reason">Motivo (opcional)</Label>
              <Input
                id="reason"
                value={updateData.reason}
                onChange={(e) =>
                  setUpdateData({ ...updateData, reason: e.target.value })
                }
                placeholder="Ex: Reposição de estoque"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUpdateModal(false)}>
              Cancelar
            </Button>
            <Button onClick={handleUpdateStock}>Atualizar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Configurações de Alerta */}
      <Dialog open={showSettingsModal} onOpenChange={setShowSettingsModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Configurações de Alerta</DialogTitle>
            <DialogDescription>
              {selectedProduct?.name || "Produto"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="alert-threshold">Threshold</Label>
              <Input
                id="alert-threshold"
                type="number"
                value={alertSettings.threshold}
                onChange={(e) =>
                  setAlertSettings({
                    ...alertSettings,
                    threshold: parseInt(e.target.value) || 10,
                  })
                }
                min="0"
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="alert-enabled"
                checked={alertSettings.enabled}
                onChange={(e) =>
                  setAlertSettings({
                    ...alertSettings,
                    enabled: e.target.checked,
                  })
                }
                className="rounded"
              />
              <Label htmlFor="alert-enabled">Habilitar alertas</Label>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowSettingsModal(false)}
            >
              Cancelar
            </Button>
            <Button onClick={handleSaveAlertSettings}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminInventoryPage;
