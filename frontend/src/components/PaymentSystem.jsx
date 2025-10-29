import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/Ui/card';
import { Button } from '@/components/Ui/button';
import { Input } from '@/components/Ui/input';
import { useApi, apiService } from '../lib/api';
// Função utilitária para formatação de moeda
const formatCurrency = (value) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
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
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';

export const PaymentSystem = ({ 
  order, 
  onSuccess, 
  onCancel,
  showPaymentMethods = true 
}) => {
  const { request, loading } = useApi();
  const [selectedPaymentMethod, setSelectedPaymentMethod] = React.useState('credit_card');
  const [paymentData, setPaymentData] = React.useState({
    cardNumber: '',
    cardHolder: '',
    expiryMonth: '',
    expiryYear: '',
    cvv: '',
    installments: 1
  });
  const [billingAddress, setBillingAddress] = React.useState({
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'Brasil'
  });
  const [showBillingForm, setShowBillingForm] = React.useState(false);
  const [paymentStatus, setPaymentStatus] = React.useState('pending');

  const paymentMethods = [
    {
      id: 'credit_card',
      name: 'Cartão de Crédito',
      icon: <CreditCard className="w-5 h-5" />,
      description: 'Visa, Mastercard, Elo e outros',
      processingFee: 0,
      installments: true
    },
    {
      id: 'pix',
      name: 'PIX',
      icon: <Gift className="w-5 h-5" />,
      description: 'Pagamento instantâneo',
      processingFee: 0,
      discount: 0.05, // 5% de desconto
      installments: false
    },
    {
      id: 'boleto',
      name: 'Boleto Bancário',
      icon: <Truck className="w-5 h-5" />,
      description: 'Vencimento em 3 dias úteis',
      processingFee: 2.99,
      installments: false
    },
    {
      id: 'paypal',
      name: 'PayPal',
      icon: <Star className="w-5 h-5" />,
      description: 'Conta PayPal ou cartão',
      processingFee: 0,
      installments: false
    }
  ];

  const selectedMethod = paymentMethods.find(m => m.id === selectedPaymentMethod);

  const calculateTotal = () => {
    let total = order.total || 0;
    
    if (selectedMethod.processingFee > 0) {
      total += selectedMethod.processingFee;
    }
    
    if (selectedMethod.discount) {
      total = total * (1 - selectedMethod.discount);
    }
    
    return total;
  };

  const handlePaymentDataChange = (field, value) => {
    setPaymentData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleBillingAddressChange = (field, value) => {
    setBillingAddress(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validatePaymentData = () => {
    if (selectedPaymentMethod === 'credit_card') {
      if (!paymentData.cardNumber || paymentData.cardNumber.length < 16) {
        toast.error('Número do cartão inválido');
        return false;
      }
      if (!paymentData.cardHolder.trim()) {
        toast.error('Nome do titular é obrigatório');
        return false;
      }
      if (!paymentData.expiryMonth || !paymentData.expiryYear) {
        toast.error('Data de validade é obrigatória');
        return false;
      }
      if (!paymentData.cvv || paymentData.cvv.length < 3) {
        toast.error('CVV é obrigatório');
        return false;
      }
    }
    
    if (showBillingForm && !billingAddress.street.trim()) {
      toast.error('Endereço de cobrança é obrigatório');
      return false;
    }
    
    return true;
  };

  const processPayment = async () => {
    if (!validatePaymentData()) return;

    setPaymentStatus('processing');
    
    try {
      const paymentPayload = {
        order_id: order.id,
        payment_method: selectedPaymentMethod,
        amount: calculateTotal(),
        installments: selectedMethod.installments ? paymentData.installments : 1,
        billing_address: showBillingForm ? billingAddress : null
      };

      if (selectedPaymentMethod === 'credit_card') {
        paymentPayload.card_data = {
          number: paymentData.cardNumber.replace(/\s/g, ''),
          holder_name: paymentData.cardHolder,
          expiry_month: paymentData.expiryMonth,
          expiry_year: paymentData.expiryYear,
          cvv: paymentData.cvv
        };
      }

      const result = await request(() => 
        apiService.payments.processPayment(paymentPayload)
      );

      if (result.success) {
        setPaymentStatus('success');
        toast.success('Pagamento processado com sucesso!');
        
        // Aguardar um momento para mostrar o sucesso
        setTimeout(() => {
          onSuccess && onSuccess(result);
        }, 2000);
      } else {
        setPaymentStatus('failed');
        toast.error(result.message || 'Erro ao processar pagamento');
      }
    } catch (error) {
      console.error('Erro no pagamento:', error);
      setPaymentStatus('failed');
      toast.error('Erro ao processar pagamento. Tente novamente.');
    }
  };

  const formatCardNumber = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    
    if (parts.length) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  const getCardBrand = (number) => {
    const cleanNumber = number.replace(/\s/g, '');
    if (/^4/.test(cleanNumber)) return 'visa';
    if (/^5[1-5]/.test(cleanNumber)) return 'mastercard';
    if (/^3[47]/.test(cleanNumber)) return 'amex';
    if (/^6/.test(cleanNumber)) return 'discover';
    if (/^35/.test(cleanNumber)) return 'jcb';
    return 'unknown';
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
          <CardDescription>
            Escolha como deseja pagar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {paymentMethods.map((method) => (
              <div
                key={method.id}
                onClick={() => setSelectedPaymentMethod(method.id)}
                className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  selectedPaymentMethod === method.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="text-blue-600">
                    {method.icon}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      {method.name}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {method.description}
                    </p>
                    {method.processingFee > 0 && (
                      <p className="text-sm text-red-600">
                        Taxa: {formatCurrency(method.processingFee)}
                      </p>
                    )}
                    {method.discount && (
                      <p className="text-sm text-green-600">
                        Desconto: {method.discount * 100}%
                      </p>
                    )}
                  </div>
                  <div className="w-4 h-4 rounded-full border-2 border-gray-300 flex items-center justify-center">
                    {selectedPaymentMethod === method.id && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
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
    if (selectedPaymentMethod !== 'credit_card') return null;

    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Dados do Cartão
          </CardTitle>
          <CardDescription>
            Informações do cartão de crédito
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Número do Cartão
              </label>
              <Input
                placeholder="0000 0000 0000 0000"
                value={paymentData.cardNumber}
                onChange={(e) => handlePaymentDataChange('cardNumber', formatCardNumber(e.target.value))}
                maxLength={19}
                className="font-mono"
              />
              {paymentData.cardNumber && (
                <div className="mt-2 text-sm text-gray-600">
                  Bandeira: {getCardBrand(paymentData.cardNumber)}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nome do Titular
                </label>
                <Input
                  placeholder="Como está no cartão"
                  value={paymentData.cardHolder}
                  onChange={(e) => handlePaymentDataChange('cardHolder', e.target.value.toUpperCase())}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  CVV
                </label>
                <Input
                  placeholder="123"
                  value={paymentData.cvv}
                  onChange={(e) => handlePaymentDataChange('cvv', e.target.value.replace(/\D/g, ''))}
                  maxLength={4}
                  className="font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Mês de Validade
                </label>
                <select
                  value={paymentData.expiryMonth}
                  onChange={(e) => handlePaymentDataChange('expiryMonth', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Mês</option>
                  {Array.from({ length: 12 }, (_, i) => (
                    <option key={i + 1} value={String(i + 1).padStart(2, '0')}>
                      {String(i + 1).padStart(2, '0')}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Ano de Validade
                </label>
                <select
                  value={paymentData.expiryYear}
                  onChange={(e) => handlePaymentDataChange('expiryYear', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Parcelas
                </label>
                <select
                  value={paymentData.installments}
                  onChange={(e) => handlePaymentDataChange('installments', parseInt(e.target.value))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {Array.from({ length: 12 }, (_, i) => {
                    const installments = i + 1;
                    const installmentValue = calculateTotal() / installments;
                    return (
                      <option key={installments} value={installments}>
                        {installments}x de {formatCurrency(installmentValue)} sem juros
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
          <CardDescription>
            Endereço para fatura do cartão
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Rua
                </label>
                <Input
                  placeholder="Nome da rua"
                  value={billingAddress.street}
                  onChange={(e) => handleBillingAddressChange('street', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Número
                </label>
                <Input
                  placeholder="123"
                  value={billingAddress.number}
                  onChange={(e) => handleBillingAddressChange('number', e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Complemento
                </label>
                <Input
                  placeholder="Apto, bloco, etc."
                  value={billingAddress.complement}
                  onChange={(e) => handleBillingAddressChange('complement', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Bairro
                </label>
                <Input
                  placeholder="Nome do bairro"
                  value={billingAddress.neighborhood}
                  onChange={(e) => handleBillingAddressChange('neighborhood', e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Cidade
                </label>
                <Input
                  placeholder="Nome da cidade"
                  value={billingAddress.city}
                  onChange={(e) => handleBillingAddressChange('city', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Estado
                </label>
                <Input
                  placeholder="UF"
                  value={billingAddress.state}
                  onChange={(e) => handleBillingAddressChange('state', e.target.value.toUpperCase())}
                  maxLength={2}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  CEP
                </label>
                <Input
                  placeholder="00000-000"
                  value={billingAddress.zipCode}
                  onChange={(e) => handleBillingAddressChange('zipCode', e.target.value)}
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
            {order.items?.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img
                    src={item.image || 'https://via.placeholder.com/40x40'}
                    alt={item.name}
                    className="w-10 h-10 rounded object-cover"
                  />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {item.name}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Qtd: {item.quantity}
                    </p>
                  </div>
                </div>
                <p className="font-medium text-gray-900 dark:text-white">
                  {formatCurrency(item.price * item.quantity)}
                </p>
              </div>
            ))}
            
            <div className="border-t pt-3 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Subtotal:</span>
                <span>{formatCurrency(order.subtotal || order.total)}</span>
              </div>
              
              {order.shipping > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span>Frete:</span>
                  <span>{formatCurrency(order.shipping)}</span>
                </div>
              )}
              
              {selectedMethod.processingFee > 0 && (
                <div className="flex items-center justify-between text-sm text-red-600">
                  <span>Taxa de processamento:</span>
                  <span>{formatCurrency(selectedMethod.processingFee)}</span>
                </div>
              )}
              
              {selectedMethod.discount && (
                <div className="flex items-center justify-between text-sm text-green-600">
                  <span>Desconto ({selectedMethod.discount * 100}%):</span>
                  <span>-{formatCurrency((order.total || 0) * selectedMethod.discount)}</span>
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
    if (paymentStatus === 'pending') return null;

    return (
      <Card className={`mb-6 border-2 ${
        paymentStatus === 'success' ? 'border-green-200 bg-green-50' :
        paymentStatus === 'failed' ? 'border-red-200 bg-red-50' :
        'border-blue-200 bg-blue-50'
      }`}>
        <CardContent className="p-6 text-center">
          {paymentStatus === 'processing' && (
            <>
              <Loader2 className="w-16 h-16 text-blue-600 mx-auto mb-4 animate-spin" />
              <h3 className="text-xl font-semibold text-blue-600 mb-2">
                Processando Pagamento...
              </h3>
              <p className="text-blue-600">
                Aguarde enquanto processamos sua transação
              </p>
            </>
          )}
          
          {paymentStatus === 'success' && (
            <>
              <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-green-600 mb-2">
                Pagamento Aprovado!
              </h3>
              <p className="text-green-600">
                Seu pedido foi confirmado e será processado em breve
              </p>
            </>
          )}
          
          {paymentStatus === 'failed' && (
            <>
              <AlertCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-red-600 mb-2">
                Pagamento Recusado
              </h3>
              <p className="text-red-600">
                Houve um problema com seu pagamento. Tente novamente.
              </p>
              <Button
                onClick={() => setPaymentStatus('pending')}
                className="mt-4 bg-red-600 hover:bg-red-700"
              >
                Tentar Novamente
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    );
  };

  if (paymentStatus === 'success') {
    return renderPaymentStatus();
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Finalizar Compra
        </h2>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Lock className="w-4 h-4" />
          <span>Pagamento Seguro</span>
          <Shield className="w-4 h-4" />
        </div>
      </div>

      {renderPaymentStatus()}
      {renderOrderSummary()}
      {renderPaymentMethod()}
      {renderCreditCardForm()}
      
      {selectedPaymentMethod === 'credit_card' && (
        <div className="mb-6">
          <Button
            variant="outline"
            onClick={() => setShowBillingForm(!showBillingForm)}
            className="w-full"
          >
            {showBillingForm ? 'Ocultar' : 'Adicionar'} Endereço de Cobrança
          </Button>
        </div>
      )}
      
      {showBillingForm && renderBillingAddressForm()}

      <div className="flex gap-4">
        <Button
          onClick={onCancel}
          variant="outline"
          className="flex-1"
          disabled={loading || paymentStatus === 'processing'}
        >
          Cancelar
        </Button>
        <Button
          onClick={processPayment}
          className="flex-1 bg-blue-600 hover:bg-blue-700"
          disabled={loading || paymentStatus === 'processing'}
        >
          {loading || paymentStatus === 'processing' ? (
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

      <div className="mt-6 text-center text-sm text-gray-600">
        <p className="flex items-center justify-center gap-2">
          <Lock className="w-4 h-4" />
          Seus dados estão protegidos com criptografia SSL
        </p>
        <p className="mt-2">
          Ao finalizar, você concorda com nossos{' '}
          <a href="/terms" className="text-blue-600 hover:underline">
            Termos de Uso
          </a>{' '}
          e{' '}
          <a href="/privacy" className="text-blue-600 hover:underline">
            Política de Privacidade
          </a>
        </p>
      </div>
    </div>
  );
};