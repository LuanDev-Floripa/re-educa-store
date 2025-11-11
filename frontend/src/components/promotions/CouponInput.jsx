import React from "react";
import logger from "@/utils/logger";
import { Button } from "@/components/Ui/button";
import { Input } from "@/components/Ui/input";
import { Card, CardContent } from "@/components/Ui/card";
import { Badge } from "@/components/Ui/badge";
import apiClient from "../../services/apiClient";
import { CheckCircle, XCircle, Tag, Percent, DollarSign } from "lucide-react";
import { toast } from "sonner";
import { formatCurrency } from "../../lib/utils";

/**
 * Entrada e validação de cupons de desconto.
 * - Valida cupom na API e aplica/remover na ordem
 * - Exibe feedback com toasts e cartões de status
 */
export const CouponInput = ({
  orderValue,
  onCouponApplied,
  onCouponRemoved,
  appliedCoupon,
}) => {
  const [couponCode, setCouponCode] = React.useState("");
  const [validating, setValidating] = React.useState(false);
  const [validationResult, setValidationResult] = React.useState(null);

  const validateCoupon = async (code) => {
    if (!code.trim()) return;
    const numericOrder = Number(orderValue);
    if (!Number.isFinite(numericOrder) || numericOrder < 0) {
      toast.error("Valor do pedido inválido");
      return { success: false, error: "Valor do pedido inválido" };
    }

    setValidating(true);
    try {
      const data = await apiClient.validateCoupon(code.trim());
      setValidationResult(data);
      return data;
    } catch (error) {
      logger.error("Erro ao validar cupom:", error);
      setValidationResult({ success: false, error: "Erro ao validar cupom" });
      return { success: false, error: "Erro ao validar cupom" };
    } finally {
      setValidating(false);
    }
  };

  const applyCoupon = async () => {
    if (!couponCode.trim()) {
      toast.error("Digite um código de cupom");
      return;
    }

    const validation = await validateCoupon(couponCode);

    if (validation.success) {
      onCouponApplied && onCouponApplied(validation);
      setCouponCode("");
      setValidationResult(null);
      toast.success("Cupom aplicado com sucesso!");
    } else {
      toast.error(validation.error);
    }
  };

  const removeCoupon = () => {
    onCouponRemoved && onCouponRemoved();
    setValidationResult(null);
    toast.success("Cupom removido");
  };

  const getDiscountIcon = (type) => {
    return type === "percentage" ? (
      <Percent className="w-4 h-4" />
    ) : (
      <DollarSign className="w-4 h-4" />
    );
  };

  const getDiscountText = (coupon) => {
    if (coupon.type === "percentage") {
      return `${coupon.value}% de desconto`;
    } else {
      return `${formatCurrency(coupon.value)} de desconto`;
    }
  };

  return (
    <div className="space-y-4">
      {/* Cupom Aplicado */}
      {appliedCoupon && (
        <Card className="border-primary/20 bg-primary/10">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <CheckCircle className="w-5 h-5 text-primary" />
                <div>
                  <div className="flex items-center space-x-2">
                    <Badge
                      variant="secondary"
                      className="bg-primary/10 text-primary"
                    >
                      <Tag className="w-3 h-3 mr-1" />
                      {appliedCoupon?.coupon?.code}
                    </Badge>
                    <span className="text-sm font-medium text-primary">
                      {appliedCoupon?.coupon?.name}
                    </span>
                  </div>
                  <p className="text-sm text-primary">
                    {appliedCoupon?.coupon
                      ? `${getDiscountText(appliedCoupon.coupon)} aplicado`
                      : "Cupom aplicado"}
                  </p>
                </div>
              </div>
              <Button
                onClick={removeCoupon}
                variant="ghost"
                size="sm"
                className="text-primary hover:text-primary"
              >
                <XCircle className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Input de Cupom */}
      {!appliedCoupon && (
        <div className="space-y-3">
          <div className="flex space-x-2">
            <div className="flex-1">
              <Input
                placeholder="Digite o código do cupom"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === "Enter" && applyCoupon()}
                className="uppercase"
                aria-label="Código do cupom"
              />
            </div>
            <Button
              onClick={applyCoupon}
              disabled={validating || !couponCode.trim()}
              className="px-6"
              aria-label="Aplicar cupom"
            >
              {validating ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                "Aplicar"
              )}
            </Button>
          </div>

          {/* Resultado da Validação */}
          {validationResult && (
            <Card
              className={`border-2 ${
                validationResult.success
                  ? "border-primary/20 bg-primary/10"
                  : "border-destructive/20 bg-destructive/10"
              }`}
            >
              <CardContent className="p-3">
                <div className="flex items-center space-x-2">
                  {validationResult.success ? (
                    <>
                      <CheckCircle className="w-4 h-4 text-primary" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-primary">
                          Cupom válido!
                        </p>
                        <p className="text-sm text-primary">
                          Desconto: {formatCurrency(validationResult.discount)}
                          (Valor final:{" "}
                          {formatCurrency(validationResult.final_value)})
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4 text-destructive" />
                      <p className="text-sm text-destructive">
                        {validationResult.error}
                      </p>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Informações do Cupom */}
      {appliedCoupon && (
        <div className="bg-primary/10 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-foreground">
                Resumo do Desconto
              </h4>
              <div className="text-sm text-primary space-y-1">
                <div className="flex items-center space-x-2">
                  {getDiscountIcon(appliedCoupon?.coupon?.type)}
                  <span>
                    {appliedCoupon?.coupon
                      ? getDiscountText(appliedCoupon.coupon)
                      : "Desconto aplicado"}
                  </span>
                </div>
                <div>Valor original: {formatCurrency(orderValue)}</div>
                <div>Desconto: -{formatCurrency(appliedCoupon.discount)}</div>
                <div className="font-semibold text-lg">
                  Total: {formatCurrency(appliedCoupon.final_value)}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
