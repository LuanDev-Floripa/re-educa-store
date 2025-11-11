/**
 * PaymentSystem Component - RE-EDUCA Store
 * 
 * Sistema completo de pagamento com suporte a múltiplos métodos incluindo:
 * - Cartão de crédito (Visa, Mastercard, Elo, etc.)
 * - PIX (pagamento instantâneo com desconto)
 * - Boleto bancário
 * - PayPal
 * 
 * Funcionalidades:
 * - Validação completa de dados do cartão e endereço de cobrança
 * - Cálculo automático de totais com taxas e descontos
 * - Processamento seguro via apiService
 * - Formatação de números de cartão
 * - Detecção automática de bandeira
 * - Parcelamento para cartão de crédito
 * - Tratamento robusto de erros com fallbacks
 * 
 * @component
 * @param {Object} props - Props do componente
 * @param {Object} props.order - Objeto do pedido com total/subtotal
 * @param {Function} props.onSuccess - Callback chamado quando pagamento é bem-sucedido
 * @param {Function} props.onCancel - Callback chamado quando pagamento é cancelado
 * @param {boolean} props.showPaymentMethods - Se deve exibir seleção de métodos (padrão: true)
 * @returns {JSX.Element} Componente de pagamento completo
 */
import React from "react";
import { Link } from "react-router-dom";
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
import { useApi, apiService } from "../lib/api";
// Função utilitária para formatação de moeda
const formatCurrency = (value) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
};
import {
  CreditCard,
  Lock,
  Shield,
  CheckCircle,
  AlertCircle,
  ShoppingCart,
  Truck,
  Gift,
  Star,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

export const PaymentSystem = ({
  order,
  onSuccess,
  onCancel,
  showPaymentMethods = true,
}) => {
  const { request, loading } = useApi();
  const [selectedPaymentMethod, setSelectedPaymentMethod] =
    React.useState("credit_card");
  const [paymentData, setPaymentData] = React.useState({
    cardNumber: "",
    cardHolder: "",
    expiryMonth: "",
    expiryYear: "",
    cvv: "",
    installments: 1,
  });
  const [billingAddress, setBillingAddress] = React.useState({
    street: "",
    number: "",
    complement: "",
    neighborhood: "",
    city: "",
    state: "",
    zipCode: "",
    country: "Brasil",
  });
  const [showBillingForm, setShowBillingForm] = React.useState(false);
  const [paymentStatus, setPaymentStatus] = React.useState("pending");

  const paymentMethods = [
    {
      id: "credit_card",
      name: "Cartão de Crédito",
      icon: <CreditCard className="w-5 h-5" />,
      description: "Visa, Mastercard, Elo e outros",
      processingFee: 0,
      installments: true,
    },
    {
      id: "pix",
      name: "PIX",
      icon: <Gift className="w-5 h-5" />,
      description: "Pagamento instantâneo",
      processingFee: 0,
      discount: 0.05, // 5% de desconto
      installments: false,
    },
    {
      id: "boleto",
      name: "Boleto Bancário",
      icon: <Truck className="w-5 h-5" />,
      description: "Vencimento em 3 dias úteis",
      processingFee: 2.99,
      installments: false,
    },
    {
      id: "paypal",
      name: "PayPal",
      icon: <Star className="w-5 h-5" />,
      description: "Conta PayPal ou cartão",
      processingFee: 0,
      installments: false,
    },
  ];

  const selectedMethod =
    paymentMethods.find((m) => m.id === selectedPaymentMethod) ||
    paymentMethods[0];

  /**
   * Calcula o total final do pagamento incluindo taxas e descontos.
   * 
   * @returns {number} Total final calculado com taxas e descontos aplicados.
   */
  const calculateTotal = () => {
    const base = Number(order?.total ?? order?.subtotal ?? 0);
    let total = Number.isFinite(base) ? base : 0;

    if (Number(selectedMethod?.processingFee) > 0) {
      total += Number(selectedMethod.processingFee) || 0;
    }

    if (Number(selectedMethod?.discount)) {
      total = total * (1 - Number(selectedMethod.discount));
    }

    return total;
  };

  const handlePaymentDataChange = (field, value) => {
    setPaymentData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleBillingAddressChange = (field, value) => {
    setBillingAddress((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  /**
   * Valida dados do pagamento antes de processar.
   * 
   * Valida campos obrigatórios baseado no método de pagamento:
   * - Cartão de crédito: número, titular, validade, CVV
   * - Endereço de cobrança se necessário
   * 
   * @returns {boolean} True se dados são válidos, False caso contrário.
   */
  const validatePaymentData = () => {
    if (selectedPaymentMethod === "credit_card") {
      if (!paymentData.cardNumber || paymentData.cardNumber.length < 16) {
        toast.error("Número do cartão inválido");
        return false;
      }
      if (!paymentData.cardHolder.trim()) {
        toast.error("Nome do titular é obrigatório");
        return false;
      }
      if (!paymentData.expiryMonth || !paymentData.expiryYear) {
        toast.error("Data de validade é obrigatória");
        return false;
      }
      if (!paymentData.cvv || paymentData.cvv.length < 3) {
        toast.error("CVV é obrigatório");
        return false;
      }
    }

    if (showBillingForm && !billingAddress.street.trim()) {
      toast.error("Endereço de cobrança é obrigatório");
      return false;
    }

    return true;
  };

  /**
   * Processa o pagamento via API.
   * 
   * Envia dados do pagamento para o backend e gerencia estados:
   * - Valida dados antes de enviar
   * - Atualiza status (processing, success, failed)
   * - Chama callbacks onSuccess ou onCancel
   * - Exibe mensagens de erro via toast
   * 
   * @async
   * @throws {Error} Erro se serviço não disponível ou pagamento falhar.
   */
  const processPayment = async () => {
    if (!validatePaymentData()) return;

    setPaymentStatus("processing");

    try {
      const paymentPayload = {
        order_id: order?.id,
        payment_method: selectedPaymentMethod,
        amount: calculateTotal(),
        installments: selectedMethod.installments
          ? paymentData.installments
          : 1,
        billing_address: showBillingForm ? billingAddress : null,
      };

      if (selectedPaymentMethod === "credit_card") {
        paymentPayload.card_data = {
          number: paymentData.cardNumber.replace(/\s/g, ""),
          holder_name: paymentData.cardHolder,
          expiry_month: paymentData.expiryMonth,
          expiry_year: paymentData.expiryYear,
          cvv: paymentData.cvv,
        };
      }

      if (typeof request !== "function") {
        throw new Error("Serviço de rede indisponível");
      }
      if (!apiService?.payments?.processPayment) {
        throw new Error("Serviço de pagamento indisponível");
      }
      const result = await request(() =>
        apiService.payments.processPayment(paymentPayload),
      );

      if (result?.success) {
        setPaymentStatus("success");
        toast.success("Pagamento processado com sucesso!");

        // Aguardar um momento para mostrar o sucesso
        setTimeout(() => {
          onSuccess && onSuccess(result);
        }, 2000);
      } else {
        setPaymentStatus("failed");
        toast.error(result?.message || "Erro ao processar pagamento");
      }
    } catch (error) {
      logger.error("Erro no pagamento:", error);
      setPaymentStatus("failed");
      toast.error(error?.message || "Erro ao processar pagamento. Tente novamente.");
    }
  };

  /**
   * Formata número de cartão de crédito com espaços a cada 4 dígitos.
   * 
   * Remove caracteres não numéricos e adiciona espaços para melhorar
   * legibilidade (ex: 1234 5678 9012 3456).
   * 
   * @param {string} value - Número de cartão sem formatação.
   * @returns {string} Número de cartão formatado com espaços.
   */
  const formatCardNumber = (value) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || "";
    const parts = [];

    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }

    if (parts.length) {
      return parts.join(" ");
    } else {
      return v;
    }
  };

  /**
   * Identifica a bandeira do cartão baseado no número.
   * 
   * Usa padrões de prefixo para identificar:
   * - Visa: inicia com 4
   * - Mastercard: inicia com 51-55
   * - Amex: inicia com 34 ou 37
   * - Discover: inicia com 6
   * - JCB: inicia com 35
   * 
   * @param {string} number - Número do cartão (com ou sem formatação).
   * @returns {string} Nome da bandeira ('visa', 'mastercard', 'amex', 'discover', 'jcb', 'unknown').
   */
  const getCardBrand = (number) => {
    const cleanNumber = String(number || "").replace(/\s/g, "");
    if (/^4/.test(cleanNumber)) return "visa";
    if (/^5[1-5]/.test(cleanNumber)) return "mastercard";
    if (/^3[47]/.test(cleanNumber)) return "amex";
    if (/^6/.test(cleanNumber)) return "discover";
    if (/^35/.test(cleanNumber)) return "jcb";
    return "unknown";
  };

  const renderPaymentMethod = () => {
    if (!showPaymentMethods) return null;

    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Forma de Pagamento
          </CardTitle>
          <CardDescription>Escolha como deseja pagar</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {paymentMethods.map((method) => (
              <div
                key={method.id}
                onClick={() => setSelectedPaymentMethod(method.id)}
                className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  selectedPaymentMethod === method.id
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-border"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="text-primary">{method.icon}</div>
                  <div className="flex-1">
                    <h4 className="font-medium text-foreground">
                      {method.name}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {method.description}
                    </p>
                    {method.processingFee > 0 && (
                      <p className="text-sm text-destructive">
                        Taxa: {formatCurrency(method.processingFee)}
                      </p>
                    )}
                    {method.discount && (
                      <p className="text-sm text-primary">
                        Desconto: {method.discount * 100}%
                      </p>
                    )}
                  </div>
                  <div className="w-4 h-4 rounded-full border-2 border-border flex items-center justify-center">
                    {selectedPaymentMethod === method.id && (
                      <div className="w-2 h-2 bg-primary rounded-full"></div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderCreditCardForm = () => {
    if (selectedPaymentMethod !== "credit_card") return null;

    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Dados do Cartão
          </CardTitle>
          <CardDescription>Informações do cartão de crédito</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Número do Cartão
              </label>
              <Input
                placeholder="0000 0000 0000 0000"
                value={paymentData.cardNumber}
                onChange={(e) =>
                  handlePaymentDataChange(
                    "cardNumber",
                    formatCardNumber(e.target.value),
                  )
                }
                maxLength={19}
                className="font-mono"
              />
              {paymentData.cardNumber && (
                <div className="mt-2 text-sm text-muted-foreground">
                  Bandeira: {getCardBrand(paymentData.cardNumber)}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Nome do Titular
                </label>
                <Input
                  placeholder="Como está no cartão"
                  value={paymentData.cardHolder}
                  onChange={(e) =>
                    handlePaymentDataChange(
                      "cardHolder",
                      e.target.value.toUpperCase(),
                    )
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  CVV
                </label>
                <Input
                  placeholder="123"
                  value={paymentData.cvv}
                  onChange={(e) =>
                    handlePaymentDataChange(
                      "cvv",
                      e.target.value.replace(/\D/g, ""),
                    )
                  }
                  maxLength={4}
                  className="font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Mês de Validade
                </label>
                <select
                  value={paymentData.expiryMonth}
                  onChange={(e) =>
                    handlePaymentDataChange("expiryMonth", e.target.value)
                  }
                  className="w-full border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Mês</option>
                  {Array.from({ length: 12 }, (_, i) => (
                    <option key={i + 1} value={String(i + 1).padStart(2, "0")}>
                      {String(i + 1).padStart(2, "0")}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Ano de Validade
                </label>
                <select
                  value={paymentData.expiryYear}
                  onChange={(e) =>
                    handlePaymentDataChange("expiryYear", e.target.value)
                  }
                  className="w-full border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Ano</option>
                  {Array.from({ length: 20 }, (_, i) => {
                    const year = new Date().getFullYear() + i;
                    return (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>

            {selectedMethod.installments && (
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Parcelas
                </label>
                <select
                  value={paymentData.installments}
                  onChange={(e) =>
                    handlePaymentDataChange(
                      "installments",
                      parseInt(e.target.value),
                    )
                  }
                  className="w-full border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {Array.from({ length: 12 }, (_, i) => {
                    const installments = i + 1;
                    const installmentValue = calculateTotal() / installments;
                    return (
                      <option key={installments} value={installments}>
                        {installments}x de {formatCurrency(installmentValue)}{" "}
                        sem juros
                      </option>
                    );
                  })}
                </select>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderBillingAddressForm = () => {
    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="w-5 h-5" />
            Endereço de Cobrança
          </CardTitle>
          <CardDescription>Endereço para fatura do cartão</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Rua
                </label>
                <Input
                  placeholder="Nome da rua"
                  value={billingAddress.street}
                  onChange={(e) =>
                    handleBillingAddressChange("street", e.target.value)
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Número
                </label>
                <Input
                  placeholder="123"
                  value={billingAddress.number}
                  onChange={(e) =>
                    handleBillingAddressChange("number", e.target.value)
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Complemento
                </label>
                <Input
                  placeholder="Apto, bloco, etc."
                  value={billingAddress.complement}
                  onChange={(e) =>
                    handleBillingAddressChange("complement", e.target.value)
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Bairro
                </label>
                <Input
                  placeholder="Nome do bairro"
                  value={billingAddress.neighborhood}
                  onChange={(e) =>
                    handleBillingAddressChange("neighborhood", e.target.value)
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Cidade
                </label>
                <Input
                  placeholder="Nome da cidade"
                  value={billingAddress.city}
                  onChange={(e) =>
                    handleBillingAddressChange("city", e.target.value)
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Estado
                </label>
                <Input
                  placeholder="UF"
                  value={billingAddress.state}
                  onChange={(e) =>
                    handleBillingAddressChange(
                      "state",
                      e.target.value.toUpperCase(),
                    )
                  }
                  maxLength={2}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  CEP
                </label>
                <Input
                  placeholder="00000-000"
                  value={billingAddress.zipCode}
                  onChange={(e) =>
                    handleBillingAddressChange("zipCode", e.target.value)
                  }
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderOrderSummary = () => {
    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5" />
            Resumo do Pedido
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {(Array.isArray(order?.items) ? order.items : []).map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img
                    src={item?.image || "https://via.placeholder.com/40x40"}
                    alt={item?.name || "Item"}
                    className="w-10 h-10 rounded object-cover"
                  />
                  <div>
                    <p className="font-medium text-foreground">
                      {item?.name || "Produto"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Qtd: {Number(item?.quantity) || 0}
                    </p>
                  </div>
                </div>
                <p className="font-medium text-foreground">
                  {formatCurrency((Number(item?.price) || 0) * (Number(item?.quantity) || 0))}
                </p>
              </div>
            ))}

            <div className="border-t pt-3 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Subtotal:</span>
                <span>{formatCurrency(Number(order?.subtotal ?? order?.total) || 0)}</span>
              </div>

              {Number(order?.shipping) > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span>Frete:</span>
                  <span>{formatCurrency(Number(order?.shipping) || 0)}</span>
                </div>
              )}

              {Number(selectedMethod?.processingFee) > 0 && (
                <div className="flex items-center justify-between text-sm text-destructive">
                  <span>Taxa de processamento:</span>
                  <span>{formatCurrency(Number(selectedMethod?.processingFee) || 0)}</span>
                </div>
              )}

              {Number(selectedMethod?.discount) > 0 && (
                <div className="flex items-center justify-between text-sm text-primary">
                  <span>Desconto ({selectedMethod.discount * 100}%):</span>
                  <span>
                    -
                    {formatCurrency((Number(order?.total) || 0) * Number(selectedMethod?.discount || 0))}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between text-lg font-bold border-t pt-2">
                <span>Total:</span>
                <span>{formatCurrency(calculateTotal())}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderPaymentStatus = () => {
    if (paymentStatus === "pending") return null;

    return (
      <Card
        className={`mb-6 border-2 ${
          paymentStatus === "success"
            ? "border-primary/20 bg-primary/10"
            : paymentStatus === "failed"
              ? "border-destructive/20 bg-destructive/10"
              : "border-primary/20 bg-primary/10"
        }`}
      >
        <CardContent className="p-6 text-center">
          {paymentStatus === "processing" && (
            <>
              <Loader2 className="w-16 h-16 text-primary mx-auto mb-4 animate-spin" aria-hidden="true" role="status" aria-label="Processando pagamento" />
              <h3 className="text-xl font-semibold text-primary mb-2">
                Processando Pagamento...
              </h3>
              <p className="text-primary" role="status" aria-live="polite">
                Aguarde enquanto processamos sua transação
              </p>
            </>
          )}

          {paymentStatus === "success" && (
            <>
              <CheckCircle className="w-16 h-16 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-primary mb-2">
                Pagamento Aprovado!
              </h3>
              <p className="text-primary">
                Seu pedido foi confirmado e será processado em breve
              </p>
            </>
          )}

          {paymentStatus === "failed" && (
            <>
              <AlertCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-destructive mb-2">
                Pagamento Recusado
              </h3>
              <p className="text-destructive">
                Houve um problema com seu pagamento. Tente novamente.
              </p>
              <Button
                onClick={() => setPaymentStatus("pending")}
                className="mt-4"
              >
                Tentar Novamente
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    );
  };

  if (paymentStatus === "success") {
    return renderPaymentStatus();
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-foreground">
          Finalizar Compra
        </h2>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Lock className="w-4 h-4" />
          <span>Pagamento Seguro</span>
          <Shield className="w-4 h-4" />
        </div>
      </div>

      {renderPaymentStatus()}
      {renderOrderSummary()}
      {renderPaymentMethod()}
      {renderCreditCardForm()}

      {selectedPaymentMethod === "credit_card" && (
        <div className="mb-6">
          <Button
            variant="outline"
            onClick={() => setShowBillingForm(!showBillingForm)}
            className="w-full"
          >
            {showBillingForm ? "Ocultar" : "Adicionar"} Endereço de Cobrança
          </Button>
        </div>
      )}

      {showBillingForm && renderBillingAddressForm()}

      <div className="flex gap-4">
        <Button
          onClick={onCancel}
          variant="outline"
          className="flex-1"
          disabled={loading || paymentStatus === "processing"}
        >
          Cancelar
        </Button>
        <Button
          onClick={processPayment}
          className="flex-1"
          disabled={loading || paymentStatus === "processing"}
        >
          {loading || paymentStatus === "processing" ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Processando...
            </>
          ) : (
            <>
              Finalizar Pagamento
              <ArrowRight className="w-4 h-4 ml-2" />
            </>
          )}
        </Button>
      </div>

      <div className="mt-6 text-center text-sm text-muted-foreground">
        <p className="flex items-center justify-center gap-2">
          <Lock className="w-4 h-4" />
          Seus dados estão protegidos com criptografia SSL
        </p>
        <p className="mt-2">
          Ao finalizar, você concorda com nossos{" "}
          <Link to="/terms" className="text-primary hover:underline">
            Termos de Uso
          </Link>{" "}
          e{" "}
          <Link to="/privacy" className="text-primary hover:underline">
            Política de Privacidade
          </Link>
        </p>
      </div>
    </div>
  );
};
