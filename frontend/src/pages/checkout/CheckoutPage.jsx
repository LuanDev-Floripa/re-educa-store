import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/Ui/card';
import { Button } from '@/components/Ui/button';
import { DashboardLayout } from '../../components/layouts/PageLayout';
import { PaymentMethods } from '../../components/payments/PaymentMethods';
import { StripePaymentForm } from '../../components/payments/StripePaymentForm';
import { useApi } from '../../lib/api';
import { ShoppingCart, ArrowLeft, CheckCircle, Package } from 'lucide-react';
import { toast } from 'sonner';

export const CheckoutPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { request } = useApi();
  
  const [cart, setCart] = React.useState([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = React.useState(null);
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [orderSummary, setOrderSummary] = React.useState({
    subtotal: 0,
    discount: 0,
    shipping: 0,
    total: 0
  });

  React.useEffect(() => {
    // Buscar carrinho do backend
    const fetchCart = async () => {
      try {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:9001';
        const token = localStorage.getItem('token');
        
        const response = await fetch(`${API_URL}/api/cart`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          setCart(data.items || []);
          
          // Calcula resumo do pedido
          const subtotal = data.total || 0;
          const shipping = subtotal > 200 ? 0 : 15.00; // Frete grátis acima de R$ 200
          const discount = 0; // Cupons implementados futuramente
          const total = subtotal + shipping - discount;
          
          setOrderSummary({
            subtotal,
            discount,
            shipping,
            total
          });
        } else {
          toast.error('Erro ao carregar carrinho');
        }
      } catch (error) {
        console.error('Erro ao buscar carrinho:', error);
        toast.error('Erro ao carregar carrinho');
      }
    };

    fetchCart();
  }, []);

  const handlePaymentMethodSelect = (method) => {
    setSelectedPaymentMethod(method);
  };

  const handlePaymentSuccess = () => {
    toast.success('Pagamento realizado com sucesso!');
    navigate('/payment/success');
  };

  const handlePaymentError = (error) => {
    toast.error('Erro no pagamento. Tente novamente.');
    console.error('Erro no pagamento:', error);
  };

  const renderPaymentForm = () => {
    if (!selectedPaymentMethod) {
      return (
        <PaymentMethods
          amount={orderSummary.total}
          onPaymentMethodSelect={handlePaymentMethodSelect}
          selectedMethod={selectedPaymentMethod}
          onSuccess={handlePaymentSuccess}
          onError={handlePaymentError}
        />
      );
    }

    switch (selectedPaymentMethod) {
      case 'card':
        return (
          <StripePaymentForm
            amount={orderSummary.total}
            onSuccess={handlePaymentSuccess}
            onError={handlePaymentError}
          />
        );
      case 'pix':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Pagamento via PIX</CardTitle>
              <CardDescription>
                Escaneie o QR Code ou copie o código PIX
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <div className="bg-gray-100 dark:bg-gray-800 p-8 rounded-lg mb-4">
                <div className="w-48 h-48 mx-auto bg-white rounded-lg flex items-center justify-center">
                  <span className="text-gray-400">QR Code PIX</span>
                </div>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Valor: R$ {orderSummary.total.toFixed(2)}
              </p>
              <Button
                onClick={handlePaymentSuccess}
                className="w-full"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Confirmar Pagamento PIX
              </Button>
            </CardContent>
          </Card>
        );
      case 'boleto':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Boleto Bancário</CardTitle>
              <CardDescription>
                Gere o boleto e pague em qualquer banco
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <div className="bg-gray-100 dark:bg-gray-800 p-8 rounded-lg mb-4">
                <div className="w-full h-32 mx-auto bg-white rounded-lg flex items-center justify-center">
                  <span className="text-gray-400">Boleto Bancário</span>
                </div>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Valor: R$ {orderSummary.total.toFixed(2)}
              </p>
              <Button
                onClick={handlePaymentSuccess}
                className="w-full"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Gerar Boleto
              </Button>
            </CardContent>
          </Card>
        );
      default:
        return null;
    }
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="outline"
            onClick={() => navigate(-1)}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <ShoppingCart className="w-8 h-8 text-blue-600" />
              Finalizar Compra
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Revise seu pedido e escolha a forma de pagamento
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Resumo do Pedido */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Resumo do Pedido
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Itens */}
                <div className="space-y-3">
                  {cart.map((item) => (
                    <div key={item.id} className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                        <Package className="w-5 h-5 text-gray-400" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">{item.name}</h4>
                        <p className="text-xs text-gray-500">
                          Qtd: {item.quantity} × R$ {item.price.toFixed(2)}
                        </p>
                      </div>
                      <div className="font-medium text-sm">
                        R$ {(item.price * item.quantity).toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Totais */}
                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal:</span>
                    <span>R$ {orderSummary.subtotal.toFixed(2)}</span>
                  </div>
                  {orderSummary.discount > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Desconto:</span>
                      <span>-R$ {orderSummary.discount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span>Frete:</span>
                    <span>
                      {orderSummary.shipping === 0 ? 'Grátis' : `R$ ${orderSummary.shipping.toFixed(2)}`}
                    </span>
                  </div>
                  <div className="flex justify-between font-bold text-lg border-t pt-2">
                    <span>Total:</span>
                    <span>R$ {orderSummary.total.toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Formulário de Pagamento */}
          <div className="lg:col-span-2">
            {renderPaymentForm()}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};