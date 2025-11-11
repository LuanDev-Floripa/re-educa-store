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
  Eye,
  Package,
  Truck,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  DollarSign,
  Calendar,
  User,
  MapPin,
  CreditCard,
  Phone,
  Mail,
  MoreHorizontal,
  Download,
  Printer,
} from "lucide-react";

/**
 * AdminOrdersPage
 * Gestão de pedidos com filtros, ordenação e detalhes com fallbacks de API.
 * @returns {JSX.Element}
 */
const AdminOrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedPayment, setSelectedPayment] = useState("all");
  const [selectedSort, setSelectedSort] = useState("date");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderModal, setShowOrderModal] = useState(false);

  const statuses = [
    { value: "all", label: "Todos os Status" },
    { value: "pending_payment", label: "Aguardando Pagamento" },
    { value: "processing", label: "Processando" },
    { value: "shipped", label: "Enviado" },
    { value: "delivered", label: "Entregue" },
    { value: "cancelled", label: "Cancelado" },
  ];

  const paymentMethods = [
    { value: "all", label: "Todos os Pagamentos" },
    { value: "credit_card", label: "Cartão de Crédito" },
    { value: "pix", label: "PIX" },
    { value: "boleto", label: "Boleto" },
  ];

  const sortOptions = [
    { value: "date", label: "Data" },
    { value: "total", label: "Valor Total" },
    { value: "status", label: "Status" },
    { value: "customer", label: "Cliente" },
  ];

  useEffect(() => {
    loadOrders();
  }, []);

  useEffect(() => {
    filterOrders();
  }, [searchTerm, selectedStatus, selectedPayment, selectedSort, orders]);

  const filterOrders = () => {
    let filtered = orders;

    // Filtro por busca
    if (searchTerm) {
      filtered = filtered.filter((order) => {
        const term = searchTerm.toLowerCase();
        return (
          String(order?.id || "").toLowerCase().includes(term) ||
          String(order?.customer?.name || "").toLowerCase().includes(term) ||
          String(order?.customer?.email || "").toLowerCase().includes(term)
        );
      });
    }

    // Filtro por status
    if (selectedStatus !== "all") {
      filtered = filtered.filter((order) => order.status === selectedStatus);
    }

    // Filtro por método de pagamento
    if (selectedPayment !== "all") {
      filtered = filtered.filter(
        (order) => order.payment.method === selectedPayment,
      );
    }

    // Ordenação
    filtered.sort((a, b) => {
      switch (selectedSort) {
        case "date":
          return new Date(b.createdAt) - new Date(a.createdAt);
        case "total":
          return Number(b.total) - Number(a.total);
        case "status":
          return String(a.status || "").localeCompare(String(b.status || ""));
        case "customer":
          return String(a?.customer?.name || "").localeCompare(String(b?.customer?.name || ""));
        default:
          return 0;
      }
    });

    setFilteredOrders(filtered);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "pending_payment":
        return "bg-primary/10 text-primary";
      case "processing":
        return "bg-primary/10 text-primary";
      case "shipped":
        return "bg-primary/10 text-primary";
      case "delivered":
        return "bg-primary/10 text-primary";
      case "cancelled":
        return "bg-destructive/10 text-destructive";
      default:
        return "bg-muted text-foreground";
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case "pending_payment":
        return "Aguardando Pagamento";
      case "processing":
        return "Processando";
      case "shipped":
        return "Enviado";
      case "delivered":
        return "Entregue";
      case "cancelled":
        return "Cancelado";
      default:
        return status;
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "pending_payment":
        return <Clock className="w-4 h-4" />;
      case "processing":
        return <Package className="w-4 h-4" />;
      case "shipped":
        return <Truck className="w-4 h-4" />;
      case "delivered":
        return <CheckCircle className="w-4 h-4" />;
      case "cancelled":
        return <XCircle className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const getPaymentMethodLabel = (method) => {
    switch (method) {
      case "credit_card":
        return "Cartão de Crédito";
      case "pix":
        return "PIX";
      case "boleto":
        return "Boleto";
      default:
        return method;
    }
  };

  const handleViewOrder = (order) => {
    setSelectedOrder(order);
    setShowOrderModal(true);
  };

  const handleUpdateOrderStatus = (orderId, newStatus) => {
    setOrders((prev) =>
      prev.map((order) =>
        order.id === orderId
          ? { ...order, status: newStatus, updatedAt: new Date().toISOString() }
          : order,
      ),
    );
  };

  const handleCancelOrder = async (orderId, reason) => {
    try {
      const { apiService } = await import("@/lib/api");
      await apiService.admin.cancelOrder(orderId, { reason: reason || "Cancelado pelo administrador" });
      toast.success("Pedido cancelado com sucesso!");
      loadOrders();
    } catch (error) {
      logger.error("Erro ao cancelar pedido:", error);
      toast.error(error.message || "Erro ao cancelar pedido");
    }
  };

  const handleRefundOrder = async (orderId, amount) => {
    try {
      const { apiService } = await import("@/lib/api");
      await apiService.admin.refundOrder(orderId, { amount });
      toast.success("Reembolso processado com sucesso!");
      loadOrders();
    } catch (error) {
      logger.error("Erro ao processar reembolso:", error);
      toast.error(error.message || "Erro ao processar reembolso");
    }
  };

  const handleUpdateOrderItems = async (orderId, items) => {
    try {
      const { apiService } = await import("@/lib/api");
      await apiService.admin.updateOrderItems(orderId, { items, recalculate_total: true });
      toast.success("Itens do pedido atualizados com sucesso!");
      loadOrders();
      if (selectedOrder?.id === orderId) {
        setShowOrderModal(false);
      }
    } catch (error) {
      logger.error("Erro ao atualizar itens:", error);
      toast.error(error.message || "Erro ao atualizar itens");
    }
  };

  const loadOrders = async () => {
    try {
      setLoading(true);
      if (!apiClient?.getAdminOrders) {
        throw new Error("Serviço de pedidos indisponível");
      }
      const response = await apiClient.getAdminOrders(1, 100);

      if (Array.isArray(response?.orders) || Array.isArray(response?.data) || Array.isArray(response)) {
        const ordersList = (Array.isArray(response?.orders)
          ? response.orders
          : Array.isArray(response?.data)
            ? response.data
            : Array.isArray(response)
              ? response
              : [])
          .map((o) => ({
            ...o,
            id: String(o?.id ?? "").toString(),
            customer: {
              id: o?.customer?.id,
              name: o?.customer?.name || o?.user_name || o?.email?.split("@")[0] || "Cliente",
              email: o?.customer?.email || o?.email || "",
              phone: o?.customer?.phone || "",
            },
            items: Array.isArray(o?.items) ? o.items : Array.isArray(o?.order_items) ? o.order_items : [],
            shipping: {
              ...(o?.shipping || {}),
              method: o?.shipping?.method || o?.shipping_method || "",
              cost: Number(o?.shipping?.cost ?? 0) || 0,
            },
            payment: {
              ...(o?.payment || {}),
              method: o?.payment?.method || o?.payment_method || "",
              status: o?.payment?.status || o?.payment_status || "",
              transactionId: o?.payment?.transactionId || o?.transaction_id || "",
            },
            status: o?.status || "processing",
            subtotal: Number(o?.subtotal) || 0,
            discount: Number(o?.discount) || 0,
            total: Number(o?.total ?? o?.total_amount) || 0,
            createdAt: o?.createdAt || o?.created_at || new Date().toISOString(),
            estimatedDelivery: o?.estimatedDelivery || o?.estimated_delivery || null,
          }));
        setOrders(ordersList);
        setFilteredOrders(ordersList);
      } else {
        setOrders([]);
        setFilteredOrders([]);
      }
    } catch (err) {
      logger.error("Erro ao carregar pedidos:", err);
      toast.error("Erro ao carregar pedidos");
      setOrders([]);
      setFilteredOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const getStats = () => {
    const totalOrders = orders.length;
    const pendingPayment = orders.filter(
      (o) => o.status === "pending_payment",
    ).length;
    const processing = orders.filter((o) => o.status === "processing").length;
    const shipped = orders.filter((o) => o.status === "shipped").length;
    const delivered = orders.filter((o) => o.status === "delivered").length;
    const cancelled = orders.filter((o) => o.status === "cancelled").length;
    const totalRevenue = orders
      .filter((o) => o.status === "delivered")
      .reduce((sum, o) => sum + o.total, 0);

    return {
      total: totalOrders,
      pendingPayment,
      processing,
      shipped,
      delivered,
      cancelled,
      totalRevenue,
    };
  };

  const stats = getStats();

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-card rounded-lg p-4 sm:p-6">
                <div className="h-4 bg-muted rounded mb-2"></div>
                <div className="h-4 bg-muted rounded w-3/4"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Package className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                Gerenciamento de Pedidos
              </h1>
              <p className="text-muted-foreground/90 leading-relaxed">
                Gerencie todos os pedidos da loja
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="gap-2.5">
              <Download className="w-4 h-4" />
              Exportar
            </Button>
            <Button variant="outline" className="gap-2.5">
              <Printer className="w-4 h-4" />
              Imprimir
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3 sm:gap-4 mb-6">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary">
                {stats.total}
              </div>
              <div className="text-sm text-muted-foreground">
                Total
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-muted-foreground">
                {stats.pendingPayment}
              </div>
              <div className="text-sm text-muted-foreground">
                Aguardando
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary">
                {stats.processing}
              </div>
              <div className="text-sm text-muted-foreground/90">
                Processando
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary">
                {stats.shipped}
              </div>
              <div className="text-sm text-muted-foreground">
                Enviados
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary">
                {stats.delivered}
              </div>
              <div className="text-sm text-muted-foreground">
                Entregues
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-destructive">
                {stats.cancelled}
              </div>
              <div className="text-sm text-muted-foreground/90">
                Cancelados
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary">
                R$ {stats.totalRevenue.toLocaleString()}
              </div>
              <div className="text-sm text-muted-foreground">
                Receita
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Filtros */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Buscar pedidos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {statuses.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedPayment} onValueChange={setSelectedPayment}>
              <SelectTrigger>
                <SelectValue placeholder="Pagamento" />
              </SelectTrigger>
              <SelectContent>
                {paymentMethods.map((method) => (
                  <SelectItem key={method.value} value={method.value}>
                    {method.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedSort} onValueChange={setSelectedSort}>
              <SelectTrigger>
                <SelectValue placeholder="Ordenar por" />
              </SelectTrigger>
              <SelectContent>
                {sortOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Pedidos */}
      <Card>
        <CardHeader>
          <CardTitle>Pedidos</CardTitle>
          <CardDescription>
            {filteredOrders.length} pedido(s) encontrado(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredOrders.map((order) => (
              <div
                key={order.id}
                className="border border-border/30 rounded-lg p-6 hover:shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1),0_2px_4px_-1px_rgba(0,0,0,0.06)] transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]"
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div>
                      <h3 className="font-semibold text-lg">{order.id}</h3>
                      <p className="text-sm text-muted-foreground">
                        {new Date(order.createdAt).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                    <Badge className={`${getStatusColor(order.status)}`}>
                      {getStatusIcon(order.status)}
                      <span className="ml-1">
                        {getStatusLabel(order.status)}
                      </span>
                    </Badge>
                  </div>

                  <div className="text-right">
                    <div className="text-lg font-bold text-primary">
                      R$ {Number(order.total).toFixed(2)}
                    </div>
                    <p className="text-sm text-muted-foreground/90">
                      {(Array.isArray(order.items) ? order.items.length : 0)} item(s)
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground mb-1">
                      Cliente
                    </h4>
                    <p className="font-semibold">{order.customer.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {order.customer.email}
                    </p>
                  </div>

                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground mb-1">
                      Pagamento
                    </h4>
                    <p className="font-semibold">
                      {getPaymentMethodLabel(order.payment.method)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {order.payment.status === "paid" ? "Pago" : "Pendente"}
                    </p>
                  </div>

                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground mb-1">
                      Entrega
                    </h4>
                    <p className="font-semibold">{order.shipping.method}</p>
                    <p className="text-sm text-muted-foreground">
                      {order.estimatedDelivery
                        ? new Date(order.estimatedDelivery).toLocaleDateString(
                            "pt-BR",
                          )
                        : "Não definido"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex gap-3">
                    {order.status === "pending_payment" && (
                      <Button
                        onClick={() =>
                          handleUpdateOrderStatus(order.id, "processing")
                        }
                        size="sm"
                        className="bg-primary hover:bg-primary/90"
                      >
                        Processar
                      </Button>
                    )}
                    {order.status === "processing" && (
                      <Button
                        onClick={() =>
                          handleUpdateOrderStatus(order.id, "shipped")
                        }
                        size="sm"
                        className="bg-primary hover:bg-primary/90"
                      >
                        Enviar
                      </Button>
                    )}
                    {order.status === "shipped" && (
                      <Button
                        onClick={() =>
                          handleUpdateOrderStatus(order.id, "delivered")
                        }
                        size="sm"
                        className="bg-primary hover:bg-primary/90"
                      >
                        Marcar como Entregue
                      </Button>
                    )}
                    {order.status !== "cancelled" && order.status !== "delivered" && (
                      <Button
                        onClick={() => {
                          if (window.confirm("Tem certeza que deseja cancelar este pedido?")) {
                            handleCancelOrder(order.id);
                          }
                        }}
                        size="sm"
                        variant="outline"
                        className="text-destructive hover:text-destructive/80"
                      >
                        Cancelar
                      </Button>
                    )}
                    {order.payment?.status === "paid" && order.status !== "cancelled" && (
                      <Button
                        onClick={() => {
                          if (window.confirm(`Reembolsar R$ ${order.total.toFixed(2)}?`)) {
                            handleRefundOrder(order.id);
                          }
                        }}
                        size="sm"
                        variant="outline"
                        className="text-primary hover:text-primary/80"
                      >
                        Reembolsar
                      </Button>
                    )}
                  </div>

                  <Button
                    onClick={() => handleViewOrder(order)}
                    variant="outline"
                    size="sm"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Ver Detalhes
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {filteredOrders.length === 0 && (
            <div className="text-center py-16 px-4">
              <div className="relative mb-6 max-w-md mx-auto">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-24 h-24 rounded-full bg-primary/10 animate-pulse"></div>
                </div>
                <Package className="w-16 h-16 text-primary mx-auto relative z-10" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-3">
                Nenhum pedido encontrado
              </h3>
              <p className="text-muted-foreground/90 leading-relaxed max-w-md mx-auto">
                {searchTerm || statusFilter !== "all" || paymentFilter !== "all"
                  ? "Tente ajustar os filtros de busca para encontrar pedidos"
                  : "Os pedidos aparecerão aqui quando os clientes realizarem compras"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de Detalhes do Pedido */}
      {showOrderModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-background rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold">
                  Detalhes do Pedido {selectedOrder.id}
                </h2>
                <Button
                  onClick={() => setShowOrderModal(false)}
                  variant="outline"
                  size="sm"
                  className="gap-2.5"
                >
                  Fechar
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Informações do Cliente */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <User className="w-5 h-5" />
                      <span>Cliente</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <p>
                        <strong>Nome:</strong> {selectedOrder.customer.name}
                      </p>
                      <p>
                        <strong>Email:</strong> {selectedOrder.customer.email}
                      </p>
                      <p>
                        <strong>Telefone:</strong>{" "}
                        {selectedOrder.customer.phone}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Endereço de Entrega */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <MapPin className="w-5 h-5" />
                      <span>Endereço de Entrega</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-1">
                      <p>{selectedOrder.shipping.address}</p>
                      <p>
                        {selectedOrder.shipping.city},{" "}
                        {selectedOrder.shipping.state}
                      </p>
                      <p>CEP: {selectedOrder.shipping.zipCode}</p>
                      <p>
                        <strong>Método:</strong> {selectedOrder.shipping.method}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Informações de Pagamento */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <CreditCard className="w-5 h-5" />
                      <span>Pagamento</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <p>
                        <strong>Método:</strong>{" "}
                        {getPaymentMethodLabel(selectedOrder.payment.method)}
                      </p>
                      <p>
                        <strong>Status:</strong>{" "}
                        {selectedOrder.payment.status === "paid"
                          ? "Pago"
                          : "Pendente"}
                      </p>
                      <p>
                        <strong>ID da Transação:</strong>{" "}
                        {selectedOrder.payment.transactionId}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Resumo do Pedido */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2.5">
                      <DollarSign className="w-5 h-5" />
                      <span>Resumo</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span>Subtotal:</span>
                        <span>R$ {Number(selectedOrder.subtotal).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Frete:</span>
                        <span>R$ {Number(selectedOrder.shipping.cost).toFixed(2)}</span>
                      </div>
                      {Number(selectedOrder.discount) > 0 && (
                        <div className="flex justify-between text-primary">
                          <span>Desconto:</span>
                          <span>-R$ {Number(selectedOrder.discount).toFixed(2)}</span>
                        </div>
                      )}
                      <div className="flex justify-between font-bold text-lg border-t pt-2">
                        <span>Total:</span>
                        <span>R$ {Number(selectedOrder.total).toFixed(2)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Itens do Pedido */}
              <Card className="mt-8">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Itens do Pedido</CardTitle>
                  {selectedOrder.status !== "cancelled" && selectedOrder.status !== "delivered" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        // Modal simples para editar itens - pode ser melhorado
                        const newItems = prompt(
                          "Editar itens (JSON):",
                          JSON.stringify(selectedOrder.items, null, 2)
                        );
                        if (newItems) {
                          try {
                            const parsed = JSON.parse(newItems);
                            handleUpdateOrderItems(selectedOrder.id, parsed);
                          } catch (e) {
                            toast.error("JSON inválido");
                          }
                        }
                      }}
                      className="gap-2.5"
                    >
                      <Edit className="w-4 h-4" />
                      Editar Itens
                    </Button>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {selectedOrder.items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-4 p-5 border border-border/30 rounded-lg transition-all duration-200"
                      >
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-16 h-16 object-cover rounded"
                        />
                        <div className="flex-1">
                          <h4 className="font-semibold">{item.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            Quantidade: {item.quantity}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">
                            R$ {(item.price * item.quantity).toFixed(2)}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            R$ {item.price.toFixed(2)} cada
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOrdersPage;
