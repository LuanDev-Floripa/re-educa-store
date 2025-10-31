import React, { useState, useEffect } from "react";
/**
 * OrdersPage
 * - Lista pedidos com filtros, estados vazios e fallbacks seguros
 */
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/Ui/card";
import { Button } from "@/components/Ui/button";
import { Badge } from "@/components/Ui/badge";
import {
  Package,
  Truck,
  CheckCircle,
  Clock,
  XCircle,
  Eye,
  Download,
  RefreshCw,
  Filter,
  Search,
  Loader2,
} from "lucide-react";
import { Input } from "@/components/Ui/input";
import apiClient from "@/services/apiClient";
import { toast } from "sonner";
import OrderDetail from "@/components/orders/OrderDetail";

const OrdersPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Carregar pedidos da API
  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      if (!apiClient?.getOrders) {
        throw new Error("Serviço de pedidos indisponível");
      }
      const response = await apiClient.getOrders();

      if (Array.isArray(response?.orders)) {
        // Formatar pedidos para o formato esperado
        const formattedOrders = response.orders.map((order) => ({
          id: order?.id || order?.order_id,
          date: order?.created_at || order?.date,
          status: order?.status || "pending",
          total: Number(order?.total ?? order?.total_amount ?? 0) || 0,
          items: Array.isArray(order?.items)
            ? order.items
            : Array.isArray(order?.order_items)
              ? order.order_items
              : [],
          tracking: order?.tracking_number || order?.shipping?.tracking || null,
          estimatedDelivery:
            order?.estimated_delivery || order?.shipping?.estimated_delivery || null,
        }));
        setOrders(formattedOrders);
      } else {
        setOrders([]);
      }
    } catch (err) {
      console.error("Erro ao carregar pedidos:", err);
      setError("Erro ao carregar pedidos");
      toast.error("Erro ao carregar seus pedidos");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusInfo = (status) => {
    switch (status) {
      case "processing":
        return {
          label: "Processando",
          color:
            "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300",
          icon: Clock,
        };
      case "shipped":
        return {
          label: "Enviado",
          color:
            "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300",
          icon: Truck,
        };
      case "delivered":
        return {
          label: "Entregue",
          color:
            "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300",
          icon: CheckCircle,
        };
      case "cancelled":
        return {
          label: "Cancelado",
          color: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300",
          icon: XCircle,
        };
      default:
        return {
          label: "Desconhecido",
          color:
            "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300",
          icon: Package,
        };
    }
  };

  const filteredOrders = (Array.isArray(orders) ? orders : []).filter((order) => {
    const matchesSearch =
      String(order?.id || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (Array.isArray(order?.items)
        ? order.items.some((item) =>
            String(item?.name || "").toLowerCase().includes(searchTerm.toLowerCase()),
          )
        : false);
    const matchesStatus =
      statusFilter === "all" || order?.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("pt-BR");
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <Package className="w-8 h-8 text-blue-600" />
            Meus Pedidos
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Acompanhe o status dos seus pedidos
          </p>
        </div>
        <Button
          onClick={loadOrders}
          variant="outline"
          size="sm"
          disabled={loading}
        >
          <RefreshCw
            className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`}
          />
          Atualizar
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Buscar por número do pedido ou produto..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Todos os Status</option>
                <option value="processing">Processando</option>
                <option value="shipped">Enviado</option>
                <option value="delivered">Entregue</option>
                <option value="cancelled">Cancelado</option>
              </select>
              <Button variant="outline" size="sm">
                <Filter className="w-4 h-4 mr-2" />
                Filtros
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Loading State */}
      {loading && (
        <Card>
          <CardContent className="p-12 text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600 mb-4" />
            <p className="text-gray-600 dark:text-gray-400">
              Carregando seus pedidos...
            </p>
          </CardContent>
        </Card>
      )}

      {/* Error State */}
      {error && !loading && (
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-red-600 dark:text-red-400">
              <p className="mb-4">{error}</p>
              <Button onClick={loadOrders} variant="outline" size="sm">
                Tentar novamente
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!loading && !error && filteredOrders.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Package className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Nenhum pedido encontrado
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {searchTerm || statusFilter !== "all"
                ? "Tente ajustar os filtros de busca"
                : "Você ainda não fez nenhum pedido"}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Orders List */}
      {!loading && !error && filteredOrders.length > 0 && (
        <div className="space-y-4">
          {filteredOrders.map((order) => {
            const statusInfo = getStatusInfo(order.status);
            const StatusIcon = statusInfo.icon;

            return (
              <Card key={order.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">
                        Pedido #{order.id}
                      </CardTitle>
                      <CardDescription>
                        Realizado em {order?.date ? formatDate(order.date) : "—"}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className={statusInfo.color}>
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {statusInfo.label}
                      </Badge>
                      <div className="text-right">
                        <div className="text-lg font-bold text-gray-900 dark:text-white">
                          {formatCurrency(Number(order?.total) || 0)}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Order Items */}
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                        Itens do Pedido
                      </h4>
                      <div className="space-y-2">
                        {(Array.isArray(order?.items) ? order.items : []).map((item, index) => (
                          <div
                            key={index}
                            className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700 last:border-b-0"
                          >
                            <div>
                              <span className="font-medium">{item?.name || "Item"}</span>
                              <span className="text-gray-600 dark:text-gray-400 ml-2">
                                Qtd: {Number(item?.quantity) || 0}
                              </span>
                            </div>
                            <span className="font-medium">
                              {formatCurrency((Number(item?.price || 0) * Number(item?.quantity || 0)))}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Order Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {order.tracking && (
                        <div>
                          <h5 className="font-medium text-gray-900 dark:text-white mb-1">
                            Código de Rastreamento
                          </h5>
                          <p className="text-sm text-gray-600 dark:text-gray-400 font-mono">
                            {order.tracking}
                          </p>
                        </div>
                      )}

                      {order.estimatedDelivery && (
                        <div>
                          <h5 className="font-medium text-gray-900 dark:text-white mb-1">
                            Previsão de Entrega
                          </h5>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {formatDate(order.estimatedDelivery)}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-100 dark:border-gray-700">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedOrderId(order.id);
                          setIsDetailOpen(true);
                        }}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Ver Detalhes
                      </Button>

                      {order.tracking && (
                        <Button variant="outline" size="sm">
                          <Truck className="w-4 h-4 mr-2" />
                          Rastrear
                        </Button>
                      )}

                      <Button variant="outline" size="sm">
                        <Download className="w-4 h-4 mr-2" />
                        Nota Fiscal
                      </Button>

                      {order.status === "delivered" && (
                        <Button variant="outline" size="sm">
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Comprar Novamente
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Order Detail Dialog */}
      <OrderDetail
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
        orderId={selectedOrderId}
      />
    </div>
  );
};

export default OrdersPage;
