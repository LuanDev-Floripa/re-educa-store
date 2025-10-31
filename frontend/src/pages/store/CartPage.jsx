import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/Ui/card";
import { Button } from "@/components/Ui/button";
import { Input } from "@/components/Ui/input";
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
} from "lucide-react";
import { useCart } from "../../contexts/CartContext";
import { Link } from "react-router-dom";
import apiClient from "@/services/apiClient";
import { toast } from "sonner";

const CartPage = () => {
  const { items, updateQuantity, removeItem, clearCart } = useCart();
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);

  // Calcular totais
  const subtotal = (Array.isArray(items) ? items : []).reduce(
    (total, item) => total + Number(item?.price || 0) * Number(item?.quantity || 0),
    0,
  );
  const shipping = subtotal > 100 ? 0 : 15; // Frete grátis acima de R$ 100
  const discount = appliedCoupon ? subtotal * 0.1 : 0; // 10% de desconto
  const total = subtotal + shipping - discount;

  const handleQuantityChange = (itemId, newQuantity) => {
    if (newQuantity <= 0) {
      removeItem(itemId);
    } else {
      updateQuantity(itemId, newQuantity);
    }
  };

  const applyCoupon = async () => {
    if (!couponCode.trim()) {
      toast.error("Digite um código de cupom");
      return;
    }

    try {
      if (!apiClient?.validateCoupon) {
        throw new Error("Serviço de cupom indisponível");
      }
      // Validar cupom via API real
      const response = await apiClient.validateCoupon(couponCode.trim());

      if (response?.valid || response?.success) {
        const discountValue =
          Number(response?.discount ?? response?.discount_percentage ?? 0) || 0;
        const discountType =
          response?.type || response?.discount_type || "percentage";

        setAppliedCoupon({
          code: response?.code || couponCode,
          discount:
            discountType === "percentage" ? discountValue / 100 : discountValue,
          discountType: discountType,
          discountAmount: Number(response?.discount_amount || 0),
        });
        setCouponCode("");
        toast.success("Cupom aplicado com sucesso!");
      } else {
        toast.error(response?.message || "Cupom inválido ou expirado");
      }
    } catch (error) {
      console.error("Erro ao validar cupom:", error);
      toast.error(error?.message || "Erro ao validar cupom");
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
  };

  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <ShoppingCart className="w-24 h-24 text-gray-400 mx-auto mb-6" />
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          Seu carrinho está vazio
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          Adicione alguns produtos para começar suas compras
        </p>
        <Link to="/store">
          <Button className="flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Continuar Comprando
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <ShoppingCart className="w-8 h-8 text-blue-600" />
            Carrinho de Compras
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
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
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                    <img
                      src={item?.image}
                      alt={item?.name || "Produto"}
                      className="w-16 h-16 object-cover rounded"
                    />
                  </div>

                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {item?.name || "Produto"}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {item?.description || ""}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-lg font-bold text-blue-600">
                        R$ {Number(item?.price || 0).toFixed(2)}
                      </span>
                      {item?.originalPrice &&
                        Number(item.originalPrice) > Number(item.price) && (
                          <span className="text-sm text-gray-500 line-through">
                            R$ {Number(item.originalPrice).toFixed(2)}
                          </span>
                        )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        handleQuantityChange(item.id, item.quantity - 1)
                      }
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                    <span className="w-8 text-center font-medium">
                      {Number(item?.quantity) || 0}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        handleQuantityChange(item.id, item.quantity + 1)
                      }
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="text-right">
                    <div className="text-lg font-bold text-gray-900 dark:text-white">
                      R$ {(Number(item?.price || 0) * Number(item?.quantity || 0)).toFixed(2)}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeItem(item.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          <div className="flex justify-between items-center pt-4">
            <Button
              variant="outline"
              onClick={clearCart}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
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
                  <div className="flex items-center justify-between p-2 bg-green-50 dark:bg-green-900/20 rounded">
                    <span className="text-sm text-green-700 dark:text-green-300">
                      Cupom {appliedCoupon.code} aplicado
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={removeCoupon}
                      className="text-red-600 hover:text-red-700"
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
                  <span className={shipping === 0 ? "text-green-600" : ""}>
                    {shipping === 0 ? "Grátis" : `R$ ${shipping.toFixed(2)}`}
                  </span>
                </div>

                {discount > 0 && (
                  <div className="flex justify-between text-green-600">
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
                <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
                  <Shield className="w-3 h-3" />
                  <span>Compra Segura</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
                  <Truck className="w-3 h-3" />
                  <span>Frete Grátis</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Promotional Banner */}
          <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Gift className="w-6 h-6 text-blue-600" />
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white">
                    Frete Grátis
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
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
