import React, { useState, useEffect } from "react";
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
  const [activeTab, setActiveTab] = useState("list");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderModal, setShowOrderModal] = useState(false);

  // Dados de exemplo removidos - usando API real acima no useEffect
  const ordersDataFallback = [
    {
      id: "ORD-2024-001",
      customer: {
        id: 1,
        name: "João Silva",
        email: "joao.silva@email.com",
        phone: "(11) 99999-9999",
      },
      items: [
        {
          id: 1,
          name: "Whey Protein Premium",
          price: 89.9,
          quantity: 2,
          image: "/api/placeholder/100/100",
        },
        {
          id: 2,
          name: "Creatina Monohidratada",
          price: 45.9,
          quantity: 1,
          image: "/api/placeholder/100/100",
        },
      ],
      shipping: {
        address: "Rua das Flores, 123",
        city: "São Paulo",
        state: "SP",
        zipCode: "01234-567",
        method: "PAC",
        cost: 15.9,
      },
      payment: {
        method: "credit_card",
        status: "paid",
        transactionId: "TXN-123456789",
      },
      status: "processing",
      subtotal: 225.7,
      discount: 0,
      total: 241.6,
      createdAt: "2024-01-20T10:30:00Z",
      updatedAt: "2024-01-20T10:30:00Z",
      estimatedDelivery: "2024-01-25",
    },
    {
      id: "ORD-2024-002",
      customer: {
        id: 2,
        name: "Maria Santos",
        email: "maria.santos@email.com",
        phone: "(11) 88888-8888",
      },
      items: [
        {
          id: 3,
          name: "Multivitamínico Completo",
          price: 32.9,
          quantity: 3,
          image: "/api/placeholder/100/100",
        },
      ],
      shipping: {
        address: "Av. Paulista, 1000",
        city: "São Paulo",
        state: "SP",
        zipCode: "01310-100",
        method: "SEDEX",
        cost: 25.9,
      },
      payment: {
        method: "pix",
        status: "paid",
        transactionId: "PIX-987654321",
      },
      status: "shipped",
      subtotal: 98.7,
      discount: 10.0,
      total: 114.6,
      createdAt: "2024-01-19T14:15:00Z",
      updatedAt: "2024-01-20T09:00:00Z",
      estimatedDelivery: "2024-01-22",
    },
    {
      id: "ORD-2024-003",
      customer: {
        id: 3,
        name: "Pedro Oliveira",
        email: "pedro.oliveira@email.com",
        phone: "(11) 77777-7777",
      },
      items: [
        {
          id: 4,
          name: "BCAA 2:1:1",
          price: 67.9,
          quantity: 1,
          image: "/api/placeholder/100/100",
        },
        {
          id: 5,
          name: "Óleo de Peixe Ômega 3",
          price: 54.9,
          quantity: 2,
          image: "/api/placeholder/100/100",
        },
      ],
      shipping: {
        address: "Rua Augusta, 500",
        city: "São Paulo",
        state: "SP",
        zipCode: "01305-000",
        method: "PAC",
        cost: 12.9,
      },
      payment: {
        method: "boleto",
        status: "pending",
        transactionId: "BOL-456789123",
      },
      status: "pending_payment",
      subtotal: 177.7,
      discount: 0,
      total: 190.6,
      createdAt: "2024-01-18T16:45:00Z",
      updatedAt: "2024-01-18T16:45:00Z",
      estimatedDelivery: "2024-01-28",
    },
    {
      id: "ORD-2024-004",
      customer: {
        id: 4,
        name: "Ana Costa",
        email: "ana.costa@email.com",
        phone: "(11) 66666-6666",
      },
      items: [
        {
          id: 1,
          name: "Whey Protein Premium",
          price: 89.9,
          quantity: 1,
          image: "/api/placeholder/100/100",
        },
      ],
      shipping: {
        address: "Rua Oscar Freire, 2000",
        city: "São Paulo",
        state: "SP",
        zipCode: "01426-001",
        method: "SEDEX",
        cost: 20.9,
      },
      payment: {
        method: "credit_card",
        status: "paid",
        transactionId: "TXN-789123456",
      },
      status: "delivered",
      subtotal: 89.9,
      discount: 5.0,
      total: 105.8,
      createdAt: "2024-01-15T11:20:00Z",
      updatedAt: "2024-01-17T15:30:00Z",
      estimatedDelivery: "2024-01-18",
      deliveredAt: "2024-01-17T15:30:00Z",
    },
    {
      id: "ORD-2024-005",
      customer: {
        id: 5,
        name: "Carlos Ferreira",
        email: "carlos.ferreira@email.com",
        phone: "(11) 55555-5555",
      },
      items: [
        {
          id: 2,
          name: "Creatina Monohidratada",
          price: 45.9,
          quantity: 2,
          image: "/api/placeholder/100/100",
        },
        {
          id: 3,
          name: "Multivitamínico Completo",
          price: 32.9,
          quantity: 1,
          image: "/api/placeholder/100/100",
        },
      ],
      shipping: {
        address: "Av. Faria Lima, 3000",
        city: "São Paulo",
        state: "SP",
        zipCode: "04538-132",
        method: "PAC",
        cost: 18.9,
      },
      payment: {
        method: "pix",
        status: "paid",
        transactionId: "PIX-321654987",
      },
      status: "cancelled",
      subtotal: 124.7,
      discount: 0,
      total: 143.6,
      createdAt: "2024-01-16T13:10:00Z",
      updatedAt: "2024-01-17T10:00:00Z",
      estimatedDelivery: "2024-01-21",
      cancelledAt: "2024-01-17T10:00:00Z",
      cancelReason: "Cliente solicitou cancelamento",
    },
  ];

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
        console.error("Erro ao carregar pedidos:", err);
        toast.error("Erro ao carregar pedidos");
        setOrders([]);
        setFilteredOrders([]);
      } finally {
        setLoading(false);
      }
    };

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
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "processing":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "shipped":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
      case "delivered":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "cancelled":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
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
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg p-6">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
              <Package className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Gerenciamento de Pedidos
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Gerencie todos os pedidos da loja
              </p>
            </div>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Exportar
            </Button>
            <Button variant="outline">
              <Printer className="w-4 h-4 mr-2" />
              Imprimir
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-7 gap-4 mb-6">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">
                {stats.total}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Total
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {stats.pendingPayment}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Aguardando
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">
                {stats.processing}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Processando
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">
                {stats.shipped}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Enviados
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">
                {stats.delivered}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Entregues
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-red-600">
                {stats.cancelled}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Cancelados
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-emerald-600">
                R$ {stats.totalRevenue.toLocaleString()}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
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
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
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
                className="border rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    <div>
                      <h3 className="font-semibold text-lg">{order.id}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
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
                    <div className="text-lg font-bold text-green-600">
                      R$ {Number(order.total).toFixed(2)}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {(Array.isArray(order.items) ? order.items.length : 0)} item(s)
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <h4 className="font-medium text-sm text-gray-600 dark:text-gray-400 mb-1">
                      Cliente
                    </h4>
                    <p className="font-semibold">{order.customer.name}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {order.customer.email}
                    </p>
                  </div>

                  <div>
                    <h4 className="font-medium text-sm text-gray-600 dark:text-gray-400 mb-1">
                      Pagamento
                    </h4>
                    <p className="font-semibold">
                      {getPaymentMethodLabel(order.payment.method)}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {order.payment.status === "paid" ? "Pago" : "Pendente"}
                    </p>
                  </div>

                  <div>
                    <h4 className="font-medium text-sm text-gray-600 dark:text-gray-400 mb-1">
                      Entrega
                    </h4>
                    <p className="font-semibold">{order.shipping.method}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {order.estimatedDelivery
                        ? new Date(order.estimatedDelivery).toLocaleDateString(
                            "pt-BR",
                          )
                        : "Não definido"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex space-x-2">
                    {order.status === "pending_payment" && (
                      <Button
                        onClick={() =>
                          handleUpdateOrderStatus(order.id, "processing")
                        }
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700"
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
                        className="bg-purple-600 hover:bg-purple-700"
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
                        className="bg-green-600 hover:bg-green-700"
                      >
                        Marcar como Entregue
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
            <div className="text-center py-12">
              <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Nenhum pedido encontrado
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Tente ajustar os filtros para encontrar mais pedidos
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de Detalhes do Pedido */}
      {showOrderModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">
                  Detalhes do Pedido {selectedOrder.id}
                </h2>
                <Button
                  onClick={() => setShowOrderModal(false)}
                  variant="outline"
                  size="sm"
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
                    <CardTitle className="flex items-center space-x-2">
                      <DollarSign className="w-5 h-5" />
                      <span>Resumo</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Subtotal:</span>
                        <span>R$ {Number(selectedOrder.subtotal).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Frete:</span>
                        <span>R$ {Number(selectedOrder.shipping.cost).toFixed(2)}</span>
                      </div>
                      {Number(selectedOrder.discount) > 0 && (
                        <div className="flex justify-between text-green-600">
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
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Itens do Pedido</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {selectedOrder.items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center space-x-4 p-4 border rounded-lg"
                      >
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-16 h-16 object-cover rounded"
                        />
                        <div className="flex-1">
                          <h4 className="font-semibold">{item.name}</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Quantidade: {item.quantity}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">
                            R$ {(item.price * item.quantity).toFixed(2)}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
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
