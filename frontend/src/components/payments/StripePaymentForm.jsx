import React from "react";
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
import { useApi } from "../../lib/api";
import { CreditCard, Lock, CheckCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";

/**
 * Formulário de pagamento via Stripe (simulado client_secret).
 * - Cria PaymentIntent no backend e confirma pagamento
 * - Alterna entre Cartão e PIX (simulado)
 */
export const StripePaymentForm = ({
  amount,
  currency = "brl",
  onSuccess,
  onError,
}) => {
  const { request } = useApi();
  const [isLoading, setIsLoading] = React.useState(false);
  const [paymentMethod, setPaymentMethod] = React.useState("card");
  const [selectedPaymentMethod, setSelectedPaymentMethod] =
    React.useState("card");
  const [cardDetails, setCardDetails] = React.useState({
    number: "",
    expiry: "",
    cvc: "",
    name: "",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Cria Payment Intent usando a API real
      const response = await request(() =>
        fetch("/api/payments/stripe/create-payment-intent", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({
            amount: Math.round(amount * 100), // Converter para centavos
            currency: currency,
            payment_method: selectedPaymentMethod,
          }),
        }),
      );

      if (response.ok) {
        const result = await response.json();

        if (result.success) {
          const { client_secret, payment_intent_id } = result;

          // Usar o client_secret para processar o pagamento

          // Aqui você integraria com o Stripe Elements usando o client_secret
          // Por enquanto, vamos simular a confirmação do pagamento
          setTimeout(() => {
            setIsLoading(false);
            toast.success(
              `Pagamento de R$ ${amount.toFixed(2)} realizado com sucesso!`,
            );
            onSuccess &&
              onSuccess({
                client_secret,
                payment_intent_id,
                paymentMethod: selectedPaymentMethod,
              });
          }, 2000);
        } else {
          throw new Error(result.error || "Erro ao criar payment intent");
        }
      } else {
        const error = await response.json();
        throw new Error(error.error || "Erro ao processar pagamento");
      }
    } catch (error) {
      console.error("Erro no pagamento:", error);
      toast.error(error.message || "Erro ao processar pagamento");
      onError && onError(error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCardNumber = (value) => {
    return value
      .replace(/\s/g, "")
      .replace(/(.{4})/g, "$1 ")
      .trim();
  };

  const formatExpiry = (value) => {
    return value
      .replace(/\D/g, "")
      .replace(/(.{2})/, "$1/")
      .trim();
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="w-5 h-5" />
          Pagamento com Cartão
        </CardTitle>
        <CardDescription>
          Valor: R$ {amount.toFixed(2)} - Método: {paymentMethod}
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Número do Cartão */}
          <div className="space-y-2">
            <Label htmlFor="cardNumber">Número do Cartão</Label>
            <Input
              id="cardNumber"
              type="text"
              placeholder="1234 5678 9012 3456"
              value={cardDetails.number}
              onChange={(e) =>
                setCardDetails((prev) => ({
                  ...prev,
                  number: formatCardNumber(e.target.value),
                }))
              }
              maxLength={19}
              required
            />
          </div>

          {/* Nome no Cartão */}
          <div className="space-y-2">
            <Label htmlFor="cardName">Nome no Cartão</Label>
            <Input
              id="cardName"
              type="text"
              placeholder="João Silva"
              value={cardDetails.name}
              onChange={(e) =>
                setCardDetails((prev) => ({
                  ...prev,
                  name: e.target.value,
                }))
              }
              required
            />
          </div>

          {/* Validade e CVC */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="expiry">Validade</Label>
              <Input
                id="expiry"
                type="text"
                placeholder="MM/AA"
                value={cardDetails.expiry}
                onChange={(e) =>
                  setCardDetails((prev) => ({
                    ...prev,
                    expiry: formatExpiry(e.target.value),
                  }))
                }
                maxLength={5}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cvc">CVC</Label>
              <Input
                id="cvc"
                type="text"
                placeholder="123"
                value={cardDetails.cvc}
                onChange={(e) =>
                  setCardDetails((prev) => ({
                    ...prev,
                    cvc: e.target.value.replace(/\D/g, ""),
                  }))
                }
                maxLength={4}
                required
              />
            </div>
          </div>

          {/* Informações de Segurança */}
          <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
            <div className="flex items-center gap-2 text-green-800 dark:text-green-200">
              <Lock className="w-4 h-4" />
              <span className="text-sm font-medium">Pagamento Seguro</span>
            </div>
            <p className="text-xs text-green-700 dark:text-green-300 mt-1">
              Seus dados são protegidos com criptografia SSL
            </p>
          </div>

          {/* Botão para alternar método de pagamento */}
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              const newMethod = paymentMethod === "card" ? "pix" : "card";
              setPaymentMethod(newMethod);
              setSelectedPaymentMethod(newMethod);
            }}
            className="w-full mb-4"
          >
            Alternar para {paymentMethod === "card" ? "PIX" : "Cartão"}
          </Button>

          {/* Botão de Pagamento */}
          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white"
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Processando...</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <CreditCard className="w-4 h-4" />
                <span>Pagar R$ {amount.toFixed(2)}</span>
              </div>
            )}
          </Button>
        </form>

        {/* Informações Adicionais */}
        <div className="mt-4 text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Processado com segurança pelo Stripe
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
