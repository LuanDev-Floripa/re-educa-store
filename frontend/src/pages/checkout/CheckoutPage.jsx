import React from "react";
import logger from "@/utils/logger";
/**
 * CheckoutPage
 * - Busca carrinho; métodos de pagamento; fallbacks e toasts
 */
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/Ui/card";
import { Button } from "@/components/Ui/button";
import { DashboardLayout } from "../../components/layouts/PageLayout";
import { PaymentMethods } from "../../components/payments/PaymentMethods";
import { StripePaymentForm } from "../../components/payments/StripePaymentForm";
import { useCart } from "../../hooks/useCart";
import { apiService } from "../../lib/api";
import { ShoppingCart, ArrowLeft, CheckCircle, Package, Tag, X } from "lucide-react";
import { toast } from "sonner";
import { CouponInput } from "../../components/promotions/CouponInput";

export const CheckoutPage = () => {
  const navigate = useNavigate();
  const { cart, getSubtotal } = useCart();

  const [selectedPaymentMethod, setSelectedPaymentMethod] =
    React.useState(null);
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [shippingAddress, setShippingAddress] = React.useState({
    street: "",
    number: "",
    complement: "",
    neighborhood: "",
    city: "",
    state: "",
    zipcode: "",
    country: "Brasil"
  });
  const [appliedCoupon, setAppliedCoupon] = React.useState(null);
  const [shippingData, setShippingData] = React.useState({ shipping_cost: 15, is_free: false });

  // Calcular resumo do pedido
  const subtotal = getSubtotal();
  const shipping = shippingData.shipping_cost;
  const discount = appliedCoupon?.discount_amount || 0;
  const total = subtotal + shipping - discount;

  // Carregar cálculo de frete
  React.useEffect(() => {
    const loadShipping = async () => {
      if (subtotal > 0) {
        try {
          const result = await apiService.cart.calculateShipping(shippingAddress);
          if (result.shipping_cost !== undefined) {
            setShippingData({
              shipping_cost: result.shipping_cost,
              is_free: result.is_free || false
            });
          }
        } catch (error) {
          logger.error("Erro ao calcular frete:", error);
        }
      }
    };
    loadShipping();
  }, [subtotal, shippingAddress.zipcode]); // Recalcular quando CEP mudar

  const handlePaymentMethodSelect = (method) => {
    setSelectedPaymentMethod(method);
  };

  const handlePaymentSuccess = () => {
    toast.success("Pagamento realizado com sucesso!");
    navigate("/payment/success");
  };

  const handlePaymentError = (error) => {
    toast.error("Erro no pagamento. Tente novamente.");
    logger.error("Erro no pagamento:", error);
  };

  const handleApplyCoupon = async (couponData) => {
    try {
      setAppliedCoupon(couponData);
      toast.success("Cupom aplicado com sucesso!");
    } catch (error) {
      logger.error("Erro ao aplicar cupom:", error);
      toast.error("Erro ao aplicar cupom");
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    toast.success("Cupom removido");
  };

  const handleProcessPayment = async (paymentType) => {
    setIsProcessing(true);
    try {
      // Simular processamento de pagamento
      await new Promise((resolve) => setTimeout(resolve, 2000));
      handlePaymentSuccess({ transaction_id: `${paymentType}_${Date.now()}` });
    } catch (error) {
      handlePaymentError(error);
    } finally {
      setIsProcessing(false);
    }
  };

  const renderPaymentForm = () => {
    // Validar se tem endereço antes de permitir pagamento
    const hasAddress = shippingAddress.street && shippingAddress.number && 
                      shippingAddress.city && shippingAddress.state && shippingAddress.zipcode;

    if (!hasAddress) {
      return (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground/90 leading-relaxed">
              Preencha o endereço de entrega para continuar com o pagamento.
            </p>
          </CardContent>
        </Card>
      );
    }

    if (!selectedPaymentMethod) {
      return (
        <PaymentMethods
          amount={total}
          onPaymentMethodSelect={handlePaymentMethodSelect}
          selectedMethod={selectedPaymentMethod}
          onSuccess={handlePaymentSuccess}
          onError={handlePaymentError}
        />
      );
    }

    switch (selectedPaymentMethod) {
      case "card":
        return (
          <StripePaymentForm
            amount={total}
            onSuccess={handlePaymentSuccess}
            onError={handlePaymentError}
          />
        );
      case "pix":
        return (
          <Card>
            <CardHeader>
              <CardTitle>Pagamento via PIX</CardTitle>
              <CardDescription>
                Escaneie o QR Code ou copie o código PIX
              </CardDescription>
            </CardHeader>
              <CardContent className="text-center">
                <div className="bg-muted p-6 sm:p-8 rounded-lg mb-4">
                  <div className="w-40 h-40 sm:w-48 sm:h-48 mx-auto bg-card rounded-lg flex items-center justify-center">
                    <span className="text-muted-foreground text-sm sm:text-base">QR Code PIX</span>
                  </div>
                </div>
              <p className="text-sm text-muted-foreground/90 mb-6">
                Valor: R$ {total.toFixed(2)}
              </p>
              <Button 
                onClick={() => handleProcessPayment("pix")} 
                className="w-full gap-2.5"
                disabled={isProcessing}
              >
                <CheckCircle className="w-4 h-4" />
                {isProcessing ? "Processando..." : "Confirmar Pagamento PIX"}
              </Button>
            </CardContent>
          </Card>
        );
      case "boleto":
        return (
          <Card>
            <CardHeader>
              <CardTitle>Boleto Bancário</CardTitle>
              <CardDescription>
                Gere o boleto e pague em qualquer banco
              </CardDescription>
            </CardHeader>
              <CardContent className="text-center">
                <div className="bg-muted/50 p-6 sm:p-8 rounded-2xl mb-6 border border-border/30">
                  <div className="w-full h-24 sm:h-32 mx-auto bg-card rounded-lg flex items-center justify-center border border-border/30">
                    <span className="text-muted-foreground/90 text-sm sm:text-base">Boleto Bancário</span>
                  </div>
                </div>
              <p className="text-sm text-muted-foreground/90 mb-6">
                Valor: R$ {total.toFixed(2)}
              </p>
              <Button 
                onClick={() => handleProcessPayment("boleto")} 
                className="w-full gap-2.5"
                disabled={isProcessing}
              >
                <CheckCircle className="w-4 h-4" />
                {isProcessing ? "Processando..." : "Gerar Boleto"}
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
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
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
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-2 sm:gap-3">
              <ShoppingCart className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
              Finalizar Compra
            </h1>
            <p className="text-muted-foreground mt-2">
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
                  {(Array.isArray(cart) && cart.length > 0 ? cart : []).map((item) => (
                    <div key={item.id || item.product_id} className="flex items-center gap-3">
                      <div className="w-12 h-12 sm:w-16 sm:h-16 bg-muted rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                        {item?.image_url || item?.image ? (
                          <img 
                            src={item.image_url || item.image} 
                            alt={item?.name || "Produto"}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Package className="w-5 h-5 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">{item?.name || "Produto"}</h4>
                        <p className="text-xs text-muted-foreground">
                          Qtd: {Number(item?.quantity) || 0} × R$ {Number(item?.price || 0).toFixed(2)}
                        </p>
                      </div>
                      <div className="font-medium text-sm">
                        R$ {(Number(item?.price || 0) * Number(item?.quantity || 0)).toFixed(2)}
                      </div>
                    </div>
                  ))}
                  {(Array.isArray(cart) && cart.length === 0) && (
                    <div className="text-center py-4">
                      <p className="text-sm text-muted-foreground/90 leading-relaxed">Seu carrinho está vazio.</p>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => navigate("/store")}
                        className="mt-2"
                      >
                        Continuar Comprando
                      </Button>
                    </div>
                  )}
                </div>

                {/* Aplicar Cupom */}
                <div className="border-t pt-4">
                  <CouponInput
                    orderValue={subtotal}
                    onCouponApplied={handleApplyCoupon}
                    onCouponRemoved={handleRemoveCoupon}
                    appliedCoupon={appliedCoupon}
                  />
                </div>

                {/* Totais */}
                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal:</span>
                    <span>R$ {subtotal.toFixed(2)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-sm text-primary">
                      <span>Desconto:</span>
                      <span>-R$ {discount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span>Frete:</span>
                    <span className={shippingData.is_free ? "text-primary" : ""}>
                      {shippingData.is_free
                        ? "Grátis"
                        : `R$ ${shipping.toFixed(2)}`}
                    </span>
                  </div>
                  <div className="flex justify-between font-bold text-lg border-t pt-2">
                    <span>Total:</span>
                    <span>R$ {total.toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Formulário de Endereço e Pagamento */}
          <div className="lg:col-span-2 space-y-6">
            {/* Formulário de Endereço */}
            <Card>
              <CardHeader>
                <CardTitle>Endereço de Entrega</CardTitle>
                <CardDescription>
                  Informe o endereço para entrega do pedido
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="text-sm font-medium mb-2 block">CEP</label>
                    <input
                      type="text"
                      placeholder="00000-000"
                      value={shippingAddress.zipcode}
                      onChange={(e) => {
                        const zip = e.target.value.replace(/\D/g, '');
                        setShippingAddress({ ...shippingAddress, zipcode: zip });
                      }}
                      className="w-full px-4 py-2.5 border border-border/50 rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)]"
                      maxLength={8}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-sm font-medium mb-2 block">Rua</label>
                    <input
                      type="text"
                      placeholder="Ex: Rua das Flores"
                      value={shippingAddress.street}
                      onChange={(e) => setShippingAddress({ ...shippingAddress, street: e.target.value })}
                      className="w-full px-4 py-2.5 border border-border/50 rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)]"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Número</label>
                    <input
                      type="text"
                      placeholder="123"
                      value={shippingAddress.number}
                      onChange={(e) => setShippingAddress({ ...shippingAddress, number: e.target.value })}
                      className="w-full px-4 py-2.5 border border-border/50 rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)]"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Complemento</label>
                    <input
                      type="text"
                      placeholder="Apto, Bloco, etc."
                      value={shippingAddress.complement}
                      onChange={(e) => setShippingAddress({ ...shippingAddress, complement: e.target.value })}
                      className="w-full px-4 py-2.5 border border-border/50 rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)]"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Bairro</label>
                    <input
                      type="text"
                      placeholder="Ex: Centro"
                      value={shippingAddress.neighborhood}
                      onChange={(e) => setShippingAddress({ ...shippingAddress, neighborhood: e.target.value })}
                      className="w-full px-4 py-2.5 border border-border/50 rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)]"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Cidade</label>
                    <input
                      type="text"
                      placeholder="Ex: São Paulo"
                      value={shippingAddress.city}
                      onChange={(e) => setShippingAddress({ ...shippingAddress, city: e.target.value })}
                      className="w-full px-4 py-2.5 border border-border/50 rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)]"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Estado</label>
                    <input
                      type="text"
                      placeholder="Ex: SP"
                      value={shippingAddress.state}
                      onChange={(e) => setShippingAddress({ ...shippingAddress, state: e.target.value })}
                      className="w-full px-4 py-2.5 border border-border/50 rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)]"
                      maxLength={2}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Formulário de Pagamento */}
            {renderPaymentForm()}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};
mentForm()}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};
