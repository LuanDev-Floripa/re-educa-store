/**
 * OrderDetail - Componente de Detalhes do Pedido
 * 
 * Exibe detalhes completos de um pedido incluindo:
 * - Informa??es do pedido
 * - Itens do pedido
 * - Status e hist?rico
 * - Informa??es de pagamento e envio
 * 
 * @component
 * @param {Object} props
 * @param {Object} props.order - Objeto do pedido
 * @param {Function} props.onClose - Fun??o para fechar o modal
 * @returns {JSX.Element} Interface de detalhes do pedido
 */
import React, { useEffect, useState } from "react";
import { X, Package, Truck, CreditCard, Calendar, User, MapPin } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../Ui/dialog";
import { Badge } from "../Ui/badge";
import { Button } from "../Ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../Ui/card";
import { Separator } from "../Ui/separator";
import apiClient from "../../services/apiClient";
import { toast } from "sonner";

const OrderDetail = ({ order, onClose, orderId }) => {
  const [orderDetails, setOrderDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  // Usa orderId se fornecido, sen?o usa order.id
  const targetOrderId = orderId || order?.id;

  useEffect(() => {
    if (targetOrderId) {
      loadOrderDetails();
    }
  }, [targetOrderId]);

  const loadOrderDetails = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/api/orders/${targetOrderId}`);
      setOrderDetails(response.data);
    } catch (error) {
      console.error("Erro ao carregar detalhes do pedido:", error);
      toast.error("Erro ao carregar detalhes do pedido");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!confirm("Tem certeza que deseja cancelar este pedido?")) {
      return;
    }

    try {
      setCancelling(true);
      const response = await apiClient.put(`/api/orders/${targetOrderId}/cancel`);
      
      if (response.data.success) {
        toast.success("Pedido cancelado com sucesso");
        await loadOrderDetails(); // Recarrega dados
      } else {
        toast.error(response.data.error || "Erro ao cancelar pedido");
      }
    } catch (error) {
      console.error("Erro ao cancelar pedido:", error);
      toast.error("Erro ao cancelar pedido");
    } finally {
      setCancelling(false);
    }
  };

  const handleTrackOrder = () => {
    if (orderDetails?.tracking_code) {
      // Abre p?gina de rastreamento externa ou modal
      window.open(`https://www.correios.com.br/enviar/rastreamento?tracking=${orderDetails.tracking_code}`, '_blank');
    } else {
      toast.info("C?digo de rastreamento ainda n?o dispon?vel");
    }
  };

  if (!order) return null;

  const orderData = orderDetails || order;

  const getStatusColor = (status) => {
    const colors = {
      pending: "bg-yellow-500",
      paid: "bg-blue-500",
      completed: "bg-green-500",
      cancelled: "bg-red-500",
    };
    return colors[status] || "bg-gray-500";
  };

  const getStatusLabel = (status) => {
    const labels = {
      pending: "Pendente",
      paid: "Pago",
      completed: "Conclu?do",
      cancelled: "Cancelado",
    };
    return labels[status] || status;
  };

  return (
    <Dialog open={!!targetOrderId} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Detalhes do Pedido #{orderData.id?.slice(0, 8)}</span>
            <Badge className={getStatusColor(orderData.status)}>
              {getStatusLabel(orderData.status)}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Informa??es Gerais */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Informa??es do Pedido
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Data</p>
                    <p className="font-medium flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      {new Date(orderData.created_at).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Total</p>
                    <p className="font-bold text-lg">
                      R$ {parseFloat(orderData.total || 0).toFixed(2)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Itens do Pedido */}
            {orderData.items && orderData.items.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Itens do Pedido</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {orderData.items.map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium">{item.product_name || item.name}</p>
                          <p className="text-sm text-gray-500">
                            Quantidade: {item.quantity} x R$ {parseFloat(item.price || 0).toFixed(2)}
                          </p>
                        </div>
                        <p className="font-bold">
                          R$ {parseFloat((item.price || 0) * (item.quantity || 1)).toFixed(2)}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Informa??es de Pagamento */}
            {orderData.payment && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <CreditCard className="w-5 h-5" />
                    Pagamento
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="text-sm">
                      <span className="text-gray-500">M?todo:</span>{" "}
                      {orderData.payment.method || "N?o especificado"}
                    </p>
                    {orderData.payment.transaction_id && (
                      <p className="text-sm">
                        <span className="text-gray-500">Transa??o:</span>{" "}
                        {orderData.payment.transaction_id}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Rastreamento de Entrega */}
            {orderData.tracking_code && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Truck className="w-5 h-5" />
                    Rastreamento
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500">C?digo de Rastreamento</p>
                        <p className="font-mono font-medium">{orderData.tracking_code}</p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleTrackOrder}
                      >
                        <Truck className="w-4 h-4 mr-2" />
                        Rastrear
                      </Button>
                    </div>
                    {orderData.shipping_status && (
                      <div>
                        <p className="text-sm text-gray-500">Status de Entrega</p>
                        <Badge className={getStatusColor(orderData.shipping_status)}>
                          {getStatusLabel(orderData.shipping_status)}
                        </Badge>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Endere?o de Entrega */}
            {orderData.shipping_address && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    Endere?o de Entrega
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1">
                    <p className="text-sm">{orderData.shipping_address.street}</p>
                    <p className="text-sm">
                      {orderData.shipping_address.city}, {orderData.shipping_address.state}
                    </p>
                    <p className="text-sm">CEP: {orderData.shipping_address.zip_code}</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* A??es do Pedido */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">A??es</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {orderData.tracking_code && (
                    <Button
                      variant="outline"
                      onClick={handleTrackOrder}
                    >
                      <Truck className="w-4 h-4 mr-2" />
                      Rastrear Pedido
                    </Button>
                  )}
                  
                  {(orderData.status === 'pending' || orderData.status === 'paid') && (
                    <Button
                      variant="destructive"
                      onClick={handleCancelOrder}
                      disabled={cancelling}
                    >
                      <X className="w-4 h-4 mr-2" />
                      {cancelling ? 'Cancelando...' : 'Cancelar Pedido'}
                    </Button>
                  )}

                  <Button variant="outline">
                    <Package className="w-4 h-4 mr-2" />
                    Baixar Nota Fiscal
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Bot?o de Fechar */}
            <div className="flex justify-end">
              <Button onClick={onClose} variant="outline">
                Fechar
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default OrderDetail;
