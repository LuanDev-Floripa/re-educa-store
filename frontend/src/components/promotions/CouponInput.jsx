import React from 'react';
import { Button } from '@/components/Ui/button';
import { Input } from '@/components/Ui/input';
import { Card, CardContent } from '@/components/Ui/card';
import { Badge } from '@/components/Ui/badge';
import { useApi } from '../../lib/api';
import { CheckCircle, XCircle, Tag, Percent, DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import { formatCurrency } from '../../lib/utils';

export const CouponInput = ({ orderValue, onCouponApplied, onCouponRemoved, appliedCoupon }) => {
  const { request } = useApi();
  const [couponCode, setCouponCode] = React.useState('');
  const [validating, setValidating] = React.useState(false);
  const [validationResult, setValidationResult] = React.useState(null);

  const validateCoupon = async (code) => {
    if (!code.trim()) return;

    setValidating(true);
    try {
      const response = await request(() => 
        fetch('/api/promotions/coupons/validate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            code: code.trim(),
            order_value: orderValue
          }),
        })
      );

      if (response.ok) {
        const data = await response.json();
        setValidationResult(data);
        return data;
      } else {
        const error = await response.json();
        setValidationResult({ success: false, error: error.error });
        return { success: false, error: error.error };
      }
    } catch (error) {
      console.error('Erro ao validar cupom:', error);
      setValidationResult({ success: false, error: 'Erro ao validar cupom' });
      return { success: false, error: 'Erro ao validar cupom' };
    } finally {
      setValidating(false);
    }
  };

  const applyCoupon = async () => {
    if (!couponCode.trim()) {
      toast.error('Digite um código de cupom');
      return;
    }

    const validation = await validateCoupon(couponCode);
    
    if (validation.success) {
      onCouponApplied && onCouponApplied(validation);
      setCouponCode('');
      setValidationResult(null);
      toast.success('Cupom aplicado com sucesso!');
    } else {
      toast.error(validation.error);
    }
  };

  const removeCoupon = () => {
    onCouponRemoved && onCouponRemoved();
    setValidationResult(null);
    toast.success('Cupom removido');
  };

  const getDiscountIcon = (type) => {
    return type === 'percentage' ? <Percent className="w-4 h-4" /> : <DollarSign className="w-4 h-4" />;
  };

  const getDiscountText = (coupon) => {
    if (coupon.type === 'percentage') {
      return `${coupon.value}% de desconto`;
    } else {
      return `${formatCurrency(coupon.value)} de desconto`;
    }
  };

  return (
    <div className="space-y-4">
      {/* Cupom Aplicado */}
      {appliedCoupon && (
        <Card className="border-green-200 bg-green-50 dark:bg-green-900/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      <Tag className="w-3 h-3 mr-1" />
                      {appliedCoupon.coupon.code}
                    </Badge>
                    <span className="text-sm font-medium text-green-800">
                      {appliedCoupon.coupon.name}
                    </span>
                  </div>
                  <p className="text-sm text-green-600">
                    {getDiscountText(appliedCoupon.coupon)} aplicado
                  </p>
                </div>
              </div>
              <Button
                onClick={removeCoupon}
                variant="ghost"
                size="sm"
                className="text-green-600 hover:text-green-700"
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
                onKeyPress={(e) => e.key === 'Enter' && applyCoupon()}
                className="uppercase"
              />
            </div>
            <Button
              onClick={applyCoupon}
              disabled={validating || !couponCode.trim()}
              className="px-6"
            >
              {validating ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                'Aplicar'
              )}
            </Button>
          </div>

          {/* Resultado da Validação */}
          {validationResult && (
            <Card className={`border-2 ${
              validationResult.success 
                ? 'border-green-200 bg-green-50 dark:bg-green-900/20' 
                : 'border-red-200 bg-red-50 dark:bg-red-900/20'
            }`}>
              <CardContent className="p-3">
                <div className="flex items-center space-x-2">
                  {validationResult.success ? (
                    <>
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-green-800">
                          Cupom válido!
                        </p>
                        <p className="text-sm text-green-600">
                          Desconto: {formatCurrency(validationResult.discount)} 
                          (Valor final: {formatCurrency(validationResult.final_value)})
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4 text-red-600" />
                      <p className="text-sm text-red-800">
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
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-blue-900 dark:text-blue-100">
                Resumo do Desconto
              </h4>
              <div className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                <div className="flex items-center space-x-2">
                  {getDiscountIcon(appliedCoupon.coupon.type)}
                  <span>
                    {getDiscountText(appliedCoupon.coupon)}
                  </span>
                </div>
                <div>
                  Valor original: {formatCurrency(orderValue)}
                </div>
                <div>
                  Desconto: -{formatCurrency(appliedCoupon.discount)}
                </div>
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