import React, { useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/Ui/card";
import { Button } from "@/components/Ui/button";
import { useApi } from "../../lib/api";
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
  const { request } = useApi();
  const [paymentMethods, setPaymentMethods] = React.useState({});
  const [isLoading, setIsLoading] = React.useState(false);

  React.useEffect(() => {
    loadPaymentMethods();
  }, [loadPaymentMethods]);

  const loadPaymentMethods = useCallback(async () => {
    try {
      const response = await request(() => fetch("/api/payments/methods"));

      if (response.ok) {
        const methods = await response.json();
        setPaymentMethods(methods);
      } else {
        toast.error("Não foi possível carregar métodos de pagamento.");
      }
    } catch (error) {
      console.error("Erro ao carregar métodos de pagamento:", error);
      if (onError) {
        onError(error);
      }
      toast.error("Erro ao carregar métodos de pagamento.");
    }
  }, [request, onError]);

  const handlePaymentMethodClick = async (method) => {
    setIsLoading(true);

    try {
      const token = localStorage.getItem("token");

      if (!token) {
        throw new Error("Token de autenticação não encontrado");
      }

      // Validar método de pagamento via API
      const response = await request(() =>
        fetch("/api/payments/validate-method", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            method: method.id,
            amount: amount,
          }),
        }),
      );

      if (response.ok) {
        const validation = await response.json();

        if (validation.valid) {
          onPaymentMethodSelect && onPaymentMethodSelect(method);
          toast.success("Método de pagamento selecionado com sucesso!");
          if (onSuccess) {
            onSuccess(method);
          }
        } else {
          throw new Error(validation.error || "Método de pagamento inválido");
        }
      } else {
        const error = await response.json();
        throw new Error(error.error || "Erro ao validar método de pagamento");
      }
    } catch (error) {
      console.error("Erro ao selecionar método de pagamento:", error);
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
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Escolha a forma de pagamento
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Valor: R$ {amount.toFixed(2)}
        </p>
      </div>

      {/* Stripe Methods */}
      {paymentMethods.stripe?.enabled && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Shield className="w-4 h-4 text-blue-600" />
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
                    <div className="text-xs text-gray-500">
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
              <Shield className="w-4 h-4 text-green-600" />
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
                    <div className="text-xs text-gray-500">
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
      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
        <div className="flex items-center gap-2 text-blue-800 dark:text-blue-200">
          <Shield className="w-4 h-4" />
          <span className="text-sm font-medium">Pagamento 100% Seguro</span>
        </div>
        {isLoading && (
          <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 mt-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span className="text-sm">Carregando métodos de pagamento...</span>
          </div>
        )}
        <ul className="text-xs text-blue-700 dark:text-blue-300 mt-2 space-y-1">
          <li>• Criptografia SSL de 256 bits</li>
          <li>• Certificação PCI DSS</li>
          <li>• Proteção contra fraudes</li>
          <li>• Suporte 24/7</li>
        </ul>
      </div>
    </div>
  );
};
