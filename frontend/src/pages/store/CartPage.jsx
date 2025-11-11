import React, { useState } from "react";
import logger from "@/utils/logger";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/Ui/card";
import { Button } from "@/components/Ui/button";
import { Input } from "@/components/Ui/input";
import { Label } from "@/components/Ui/label";
import { Badge } from "@/components/Ui/badge";
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  ArrowLeft,
  CreditCard,
  Truck,
  Shield,
  Gift,
  Percent,
  X,
} from "lucide-react";
import { useCart } from "../../hooks/useCart";
import { apiService } from "../../lib/api";
import { Link } from "react-router-dom";
import { toast } from "sonner";

const CartPage = () => {
  const { cart, updateItem, removeItem, clearCart, refreshCart } = useCart();
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [shippingData, setShippingData] = useState({ shipping_cost: 15, is_free: false });
  const [loadingShipping, setLoadingShipping] = useState(false);

  const items = cart || [];

  // Calcular subtotal
  const subtotal = items.reduce(
    (total, item) => total + Number(item?.price || 0) * Number(item?.quantity || 0),
    0,
  );

  // Carregar cálculo de frete
  React.useEffect(() => {
    const loadShipping = async () => {
      if (subtotal > 0) {
        try {
          setLoadingShipping(true);
          const result = await apiService.cart.calculateShipping();
          if (result.shipping_cost !== undefined) {
            setShippingData({
              shipping_cost: result.shipping_cost,
              is_free: result.is_free || false
            });
          }
        } catch (error) {
          logger.error("Erro ao calcular frete:", error);
        } finally {
          setLoadingShipping(false);
        }
      }
    };
    loadShipping();
  }, [subtotal]);

  const shipping = shippingData.shipping_cost;
  const discount = appliedCoupon?.discount_amount || 0;
  const total = subtotal + shipping - discount;

  const handleQuantityChange = async (itemId, newQuantity) => {
    if (newQuantity <= 0) {
      await removeItem(itemId);
    } else {
      await updateItem(itemId, newQuantity);
    }
    await refreshCart();
  };

  const applyCoupon = async () => {
    if (!couponCode.trim()) {
      toast.error("Digite um código de cupom");
      return;
    }

    try {
      const response = await apiService.cart.validateCoupon(couponCode.trim());

      if (response?.valid || response?.success) {
        setAppliedCoupon({
          code: response?.code || couponCode,
          discount_type: response?.discount_type || response?.type || "percentage",
          discount_amount: Number(response?.discount_amount || 0),
          discount_percentage: response?.discount_percentage
        });
        setCouponCode("");
        toast.success("Cupom aplicado com sucesso!");
      } else {
        toast.error(response?.error || response?.message || "Cupom inválido ou expirado");
      }
    } catch (error) {
      logger.error("Erro ao validar cupom:", error);
      toast.error(error?.message || "Erro ao validar cupom");
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
  };

  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto text-center py-16 px-4">
        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full bg-primary/10 animate-pulse"></div>
          </div>
          <ShoppingCart className="w-20 h-20 sm:w-24 sm:h-24 text-primary mx-auto relative z-10" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-3 sm:mb-4">
          Seu carrinho está vazio
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground mb-8 sm:mb-10 max-w-md mx-auto leading-relaxed">
          Explore nossa loja e descubra produtos incríveis para sua saúde e bem-estar
        </p>
        <Link to="/store">
          <Button className="flex items-center gap-2 mx-auto shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105">
            <ArrowLeft className="w-4 h-4" />
            Explorar Produtos
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 px-4 sm:px-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-2 sm:gap-3">
            <ShoppingCart className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
            Carrinho de Compras
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-2">
            {items.length} {items.length === 1 ? "item" : "itens"} no seu
            carrinho
          </p>
        </div>

        <Link to="/store">
          <Button variant="outline" className="flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Continuar Comprando
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {(Array.isArray(items) ? items : []).map((item) => (
            <Card key={item.id}>
              <CardContent className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <div className="w-20 h-20 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
                    <img
                      src={item?.image}
                      alt={item?.name || "Produto"}
                      className="w-16 h-16 object-cover rounded"
                      loading="lazy"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground text-sm sm:text-base">
                      {item?.name || "Produto"}
                    </h3>
                    <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">
                      {item?.description || ""}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-base sm:text-lg font-bold text-primary">
                        R$ {Number(item?.price || 0).toFixed(2)}
                      </span>
                      {item?.originalPrice &&
                        Number(item.originalPrice) > Number(item.price) && (
                          <span className="text-xs sm:text-sm text-muted-foreground/80 line-through">
                            R$ {Number(item.originalPrice).toFixed(2)}
                          </span>
                        )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-4">
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          handleQuantityChange(item.id, item.quantity - 1)
                        }
                        aria-label="Diminuir quantidade"
                      >
                        <Minus className="w-4 h-4" />
                      </Button>
                      <span className="w-8 text-center font-medium text-foreground">
                        {Number(item?.quantity) || 0}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          handleQuantityChange(item.id, item.quantity + 1)
                        }
                        aria-label="Aumentar quantidade"
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>

                    <div className="text-right sm:text-left">
                      <div className="text-base sm:text-lg font-bold text-foreground">
                        R$ {(Number(item?.price || 0) * Number(item?.quantity || 0)).toFixed(2)}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeItem(item.id)}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        aria-label="Remover item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          <div className="flex justify-between items-center pt-4">
            <Button
              variant="outline"
              onClick={clearCart}
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Limpar Carrinho
            </Button>
          </div>
        </div>

        {/* Order Summary */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Resumo do Pedido</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Coupon Code */}
              <div className="space-y-2">
                <Label htmlFor="coupon">Cupom de Desconto</Label>
                <div className="flex gap-2">
                  <Input
                    id="coupon"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    placeholder="Digite o código"
                    disabled={appliedCoupon}
                  />
                  <Button
                    onClick={applyCoupon}
                    disabled={!couponCode || appliedCoupon}
                    variant="outline"
                  >
                    <Percent className="w-4 h-4" />
                  </Button>
                </div>
                {appliedCoupon && (
                  <div className="flex items-center justify-between p-2 bg-primary/10 rounded">
                    <span className="text-sm text-primary">
                      Cupom {appliedCoupon.code} aplicado
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={removeCoupon}
                      className="text-destructive hover:text-destructive/80"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>

              {/* Price Breakdown */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>R$ {subtotal.toFixed(2)}</span>
                </div>

                <div className="flex justify-between">
                  <span>Frete</span>
                  <span className={shippingData.is_free ? "text-primary" : ""}>
                    {loadingShipping ? (
                      <span className="text-sm">Calculando...</span>
                    ) : shippingData.is_free ? (
                      "Grátis"
                    ) : (
                      `R$ ${shipping.toFixed(2)}`
                    )}
                  </span>
                </div>

                {discount > 0 && (
                  <div className="flex justify-between text-primary">
                    <span>Desconto</span>
                    <span>-R$ {discount.toFixed(2)}</span>
                  </div>
                )}

                <div className="border-t pt-2">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span>R$ {total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Checkout Button */}
              <Link to="/checkout" className="block">
                <Button className="w-full flex items-center gap-2">
                  <CreditCard className="w-4 h-4" />
                  Finalizar Compra
                </Button>
              </Link>

              {/* Security Badges */}
              <div className="flex items-center justify-center space-x-4 pt-4 border-t">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Shield className="w-3 h-3" />
                  <span>Compra Segura</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Truck className="w-3 h-3" />
                  <span>Frete Grátis</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Promotional Banner */}
          <Card className="bg-gradient-to-r from-primary/10 to-primary/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Gift className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                <div>
                  <h4 className="text-sm sm:text-base font-semibold text-foreground">
                    Frete Grátis
                  </h4>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Em compras acima de R$ 100
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
