import React, { useState, useEffect } from "react";
import logger from "@/utils/logger";
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
  ShoppingCart,
} from "lucide-react";
import { Link } from "react-router-dom";
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
  const [showTrackingModal, setShowTrackingModal] = useState(false);
  const [trackingInfo, setTrackingInfo] = useState(null);

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
      logger.error("Erro ao carregar pedidos:", err);
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
          color: "bg-primary/10 text-primary",
          icon: Clock,
        };
      case "shipped":
        return {
          label: "Enviado",
          color: "bg-primary/10 text-primary",
          icon: Truck,
        };
      case "delivered":
        return {
          label: "Entregue",
          color: "bg-primary/10 text-primary",
          icon: CheckCircle,
        };
      case "cancelled":
        return {
          label: "Cancelado",
          color: "bg-destructive/10 text-destructive",
          icon: XCircle,
        };
      default:
        return {
          label: "Desconhecido",
          color: "bg-muted text-foreground",
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
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <Package className="w-8 h-8 text-primary" />
            Meus Pedidos
          </h1>
          <p className="text-muted-foreground mt-2">
            Acompanhe o status dos seus pedidos
          </p>
        </div>
        <Button
          onClick={loadOrders}
          variant="outline"
          size="sm"
          disabled={loading}
          className="gap-2.5"
        >
          <RefreshCw
            className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
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
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
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
                className="px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="all">Todos os Status</option>
                <option value="processing">Processando</option>
                <option value="shipped">Enviado</option>
                <option value="delivered">Entregue</option>
                <option value="cancelled">Cancelado</option>
              </select>
              <Button variant="outline" size="sm" className="gap-2.5">
                <Filter className="w-4 h-4" />
                Filtros
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Loading State */}
      {loading && (
        <Card>
          <CardContent className="p-16 text-center">
            <div className="flex flex-col items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" role="status" aria-label="Carregando pedidos">
                <span className="sr-only">Carregando pedidos...</span>
              </div>
              <p className="text-muted-foreground/90 leading-relaxed">
                Carregando seus pedidos...
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error State */}
      {error && !loading && (
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-destructive">
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
          <CardContent className="p-16 text-center">
            <div className="relative mb-6 max-w-md mx-auto">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-32 h-32 rounded-full bg-primary/10 animate-pulse"></div>
              </div>
              <Package className="w-20 h-20 text-primary mx-auto relative z-10" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-3">
              {searchTerm || statusFilter !== "all"
                ? "Nenhum pedido encontrado"
                : "Você ainda não fez nenhum pedido"}
            </h3>
            <p className="text-muted-foreground/90 leading-relaxed max-w-md mx-auto mb-6">
              {searchTerm || statusFilter !== "all"
                ? "Tente ajustar os filtros de busca para encontrar seus pedidos"
                : "Explore nossa loja e faça seu primeiro pedido para começar"}
            </p>
            {(!searchTerm && statusFilter === "all") && (
              <Link to="/store">
                <Button className="gap-2 shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105">
                  <ShoppingCart className="w-4 h-4" />
                  Explorar Produtos
                </Button>
              </Link>
            )}
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
                        <div className="text-lg font-bold text-foreground">
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
                      <h4 className="font-medium text-foreground mb-2">
                        Itens do Pedido
                      </h4>
                      <div className="space-y-2">
                        {(Array.isArray(order?.items) ? order.items : []).map((item, index) => (
                          <div
                            key={index}
                            className="flex justify-between items-center py-3 border-b border-border/30 last:border-b-0 transition-colors duration-200"
                          >
                            <div>
                              <span className="font-medium">{item?.name || "Item"}</span>
                              <span className="text-muted-foreground/90 ml-2">
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
                          <h5 className="font-medium text-foreground mb-1">
                            Código de Rastreamento
                          </h5>
                          <p className="text-sm text-muted-foreground/90 font-mono">
                            {order.tracking}
                          </p>
                        </div>
                      )}

                      {order.estimatedDelivery && (
                        <div>
                          <h5 className="font-medium text-foreground mb-2">
                            Previsão de Entrega
                          </h5>
                          <p className="text-sm text-muted-foreground/90">
                            {formatDate(order.estimatedDelivery)}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap gap-3 pt-6 border-t border-border/30">
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
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={async () => {
                            try {
                              const data = await apiClient.get(`/api/orders/${order.id}/tracking`);
                              if (data?.success && data?.tracking) {
                                setTrackingInfo(data.tracking);
                                setShowTrackingModal(true);
                              } else {
                                toast.error("Erro ao buscar informações de rastreamento");
                              }
                            } catch (error) {
                              logger.error("Erro ao buscar rastreamento:", error);
                              toast.error("Erro ao buscar informações de rastreamento");
                            }
                          }}
                        >
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

      {/* Tracking Modal */}
      {showTrackingModal && trackingInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto bg-card/95 backdrop-blur-xl shadow-[0_20px_25px_-5px_rgba(0,0,0,0.1),0_10px_10px_-5px_rgba(0,0,0,0.04)] border border-border/30 rounded-2xl">
            <CardHeader>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Rastreamento do Pedido</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowTrackingModal(false);
                    setTrackingInfo(null);
                  }}
                >
                  ×
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {trackingInfo.tracking_number && (
                <div>
                  <p className="text-sm text-muted-foreground/90 mb-2">Código de Rastreamento</p>
                  <p className="font-mono text-lg">{trackingInfo.tracking_number}</p>
                </div>
              )}
              {trackingInfo.carrier && (
                <div>
                  <p className="text-sm text-muted-foreground/90 mb-2">Transportadora</p>
                  <p className="font-medium capitalize">{trackingInfo.carrier}</p>
                </div>
              )}
              {trackingInfo.tracking_url && (
                <div>
                  <Button
                    variant="outline"
                    className="w-full gap-2.5"
                    onClick={() => window.open(trackingInfo.tracking_url, "_blank")}
                  >
                    <Truck className="w-4 h-4" />
                    Rastrear na Transportadora
                  </Button>
                </div>
              )}
              {trackingInfo.estimated_delivery && (
                <div>
                  <p className="text-sm text-muted-foreground/90 mb-2">Previsão de Entrega</p>
                  <p>{formatDate(trackingInfo.estimated_delivery)}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-muted-foreground/90 mb-2">Status</p>
                <Badge className={getStatusInfo(trackingInfo.status).color}>
                  {getStatusInfo(trackingInfo.status).label}
                </Badge>
              </div>

              {/* Histórico de Rastreamento */}
              {trackingInfo.history && trackingInfo.history.length > 0 && (
                <div className="mt-8 pt-8 border-t border-border/30">
                  <h4 className="font-semibold mb-6">Histórico de Rastreamento</h4>
                  <div className="space-y-6">
                    {trackingInfo.history.map((event, index) => (
                      <div key={event.id || index} className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className={`w-3 h-3 rounded-full transition-all duration-200 ${
                            index === 0 ? 'bg-primary' : 'bg-muted/50'
                          }`} />
                          {index < trackingInfo.history.length - 1 && (
                            <div className="w-0.5 h-full bg-muted/50 mt-1" />
                          )}
                        </div>
                        <div className="flex-1 pb-4">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="font-medium text-foreground mb-1">
                                {event.event_description || event.event_type}
                              </p>
                              {event.location && (
                                <p className="text-sm text-muted-foreground/90 mt-1">
                                  📍 {event.location}
                                </p>
                              )}
                              {event.event_date && (
                                <p className="text-xs text-muted-foreground/90 mt-1">
                                  {formatDate(event.event_date)}
                                </p>
                              )}
                            </div>
                            {event.event_type && (
                              <Badge variant="outline" className="text-xs">
                                {event.event_type}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {(!trackingInfo.history || trackingInfo.history.length === 0) && (
                <div className="mt-6 pt-6 border-t border-border text-center text-muted-foreground">
                  <p className="text-sm">Nenhum evento de rastreamento registrado ainda.</p>
                  {trackingInfo.tracking_url && (
                    <p className="text-xs mt-2">
                      Acesse o link acima para verificar atualizações na transportadora.
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default OrdersPage;
