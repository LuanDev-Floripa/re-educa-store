import React, { useCallback } from "react";
import logger from "@/utils/logger";
import apiClient from "@/services/apiClient";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/Ui/card";
import { Button } from "@/components/Ui/button";
import { CreditCard, Smartphone, Barcode, QrCode, Shield } from "lucide-react";
import { toast } from "sonner";

/**
 * Seleção de métodos de pagamento.
 * - Carrega métodos da API e valida seleção
 * - Emite toasts e chama callbacks de sucesso/erro
 */
export const PaymentMethods = ({
  amount,
  onPaymentMethodSelect,
  selectedMethod,
  onSuccess,
  onError,
}) => {
  const [paymentMethods, setPaymentMethods] = React.useState({});
  const [isLoading, setIsLoading] = React.useState(false);

  React.useEffect(() => {
    loadPaymentMethods();
  }, [loadPaymentMethods]);

  const loadPaymentMethods = useCallback(async () => {
    try {
      const methods = await apiClient.get("/payments/methods");
      setPaymentMethods(methods);
    } catch (error) {
      logger.error("Erro ao carregar métodos de pagamento:", error);
      if (onError) {
        onError(error);
      }
      toast.error("Erro ao carregar métodos de pagamento.");
    }
  }, [onError]);

  const handlePaymentMethodClick = async (method) => {
    setIsLoading(true);

    try {
      // Validar método de pagamento via API
      const validation = await apiClient.post("/payments/validate-method", {
        body: {
          method: method.id,
          amount: amount,
        },
      });

      if (validation.valid) {
        onPaymentMethodSelect && onPaymentMethodSelect(method);
        toast.success("Método de pagamento selecionado com sucesso!");
        if (onSuccess) {
          onSuccess(method);
        }
      } else {
        throw new Error(validation.error || "Método de pagamento inválido");
      }
    } catch (error) {
      logger.error("Erro ao selecionar método de pagamento:", error);
      toast.error(error.message || "Erro ao selecionar método de pagamento");
      if (onError) {
        onError(error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getMethodIcon = (method) => {
    switch (method) {
      case "card":
        return <CreditCard className="w-5 h-5" />;
      case "pix":
        return <QrCode className="w-5 h-5" />;
      case "boleto":
        return <Barcode className="w-5 h-5" />;
      case "debit":
        return <Smartphone className="w-5 h-5" />;
      default:
        return <CreditCard className="w-5 h-5" />;
    }
  };

  const getMethodName = (method) => {
    switch (method) {
      case "card":
        return "Cartão de Crédito";
      case "pix":
        return "PIX";
      case "boleto":
        return "Boleto Bancário";
      case "debit":
        return "Débito Online";
      default:
        return method;
    }
  };

  const getMethodDescription = (method) => {
    switch (method) {
      case "card":
        return "Visa, Mastercard, Elo";
      case "pix":
        return "Aprovação imediata";
      case "boleto":
        return "Vencimento em 3 dias úteis";
      case "debit":
        return "Débito em conta";
      default:
        return "";
    }
  };

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-foreground">
          Escolha a forma de pagamento
        </h3>
        <p className="text-sm text-muted-foreground">
          Valor: R$ {amount.toFixed(2)}
        </p>
      </div>

      {/* Stripe Methods */}
      {paymentMethods.stripe?.enabled && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Shield className="w-4 h-4 text-primary" />
              Stripe
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {paymentMethods.stripe.methods.map((method) => (
              <Button
                key={method}
                variant={selectedMethod === method ? "default" : "outline"}
                className="w-full justify-start"
                onClick={() => handlePaymentMethodClick(method)}
              >
                <div className="flex items-center gap-3">
                  {getMethodIcon(method)}
                  <div className="text-left">
                    <div className="font-medium">{getMethodName(method)}</div>
                    <div className="text-xs text-muted-foreground">
                      {getMethodDescription(method)}
                    </div>
                  </div>
                </div>
              </Button>
            ))}
          </CardContent>
        </Card>
      )}

      {/* PagSeguro Methods */}
      {paymentMethods.pagseguro?.enabled && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Shield className="w-4 h-4 text-primary" />
              PagSeguro
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {paymentMethods.pagseguro.methods.map((method) => (
              <Button
                key={method}
                variant={selectedMethod === method ? "default" : "outline"}
                className="w-full justify-start"
                onClick={() => handlePaymentMethodClick(method)}
              >
                <div className="flex items-center gap-3">
                  {getMethodIcon(method)}
                  <div className="text-left">
                    <div className="font-medium">{getMethodName(method)}</div>
                    <div className="text-xs text-muted-foreground">
                      {getMethodDescription(method)}
                    </div>
                  </div>
                </div>
              </Button>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Informações de Segurança */}
      <div className="bg-primary/10 p-4 rounded-lg">
        <div className="flex items-center gap-2 text-primary">
          <Shield className="w-4 h-4" />
          <span className="text-sm font-medium">Pagamento 100% Seguro</span>
        </div>
        {isLoading && (
          <div className="flex items-center gap-2 text-primary mt-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" role="status" aria-label="Carregando métodos de pagamento">
              <span className="sr-only">Carregando métodos de pagamento...</span>
            </div>
            <span className="text-sm">Carregando métodos de pagamento...</span>
          </div>
        )}
        <ul className="text-xs text-muted-foreground mt-2 space-y-1">
          <li>• Criptografia SSL de 256 bits</li>
          <li>• Certificação PCI DSS</li>
          <li>• Proteção contra fraudes</li>
          <li>• Suporte 24/7</li>
        </ul>
      </div>
    </div>
  );
};
