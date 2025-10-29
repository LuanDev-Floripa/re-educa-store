import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/Ui/card';
import { Button } from '@/components/Ui/button';
import { Badge } from '@/components/Ui/badge';
import { ExternalLink, ShoppingCart, Star, TrendingUp } from 'lucide-react';
import { formatCurrency } from '../../lib/utils';

export const AffiliateProductCard = ({ product, onAddToCart, onViewDetails }) => {
  const getPlatformColor = (platform) => {
    switch (platform) {
      case 'hotmart': return 'bg-orange-100 text-orange-800';
      case 'kiwify': return 'bg-blue-100 text-blue-800';
      case 'logs': return 'bg-green-100 text-green-800';
      case 'braip': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPlatformName = (platform) => {
    switch (platform) {
      case 'hotmart': return 'Hotmart';
      case 'kiwify': return 'Kiwify';
      case 'logs': return 'Logs';
      case 'braip': return 'Braip';
      default: return platform;
    }
  };

  return (
    <Card className="group hover:shadow-lg transition-all duration-300 border-0 shadow-md">
      <div className="relative">
        {/* Imagem do produto */}
        <div className="aspect-square overflow-hidden rounded-t-lg bg-gray-100">
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
              <ShoppingCart className="w-12 h-12 text-gray-400" />
            </div>
          )}
        </div>

        {/* Badge da plataforma */}
        <Badge className={`absolute top-2 right-2 ${getPlatformColor(product.platform)}`}>
          {getPlatformName(product.platform)}
        </Badge>

        {/* Badge de comissão */}
        {product.commission_rate > 0 && (
          <Badge className="absolute top-2 left-2 bg-green-100 text-green-800">
            <TrendingUp className="w-3 h-3 mr-1" />
            {product.commission_rate}% comissão
          </Badge>
        )}
      </div>

      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold line-clamp-2 group-hover:text-blue-600 transition-colors">
          {product.name}
        </CardTitle>
        <CardDescription className="line-clamp-3 text-sm">
          {product.description}
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Preço */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <span className="text-2xl font-bold text-gray-900">
              {formatCurrency(product.price)}
            </span>
            <span className="text-sm text-gray-500">
              {product.currency}
            </span>
          </div>
          
          {/* Rating (simulado) */}
          <div className="flex items-center space-x-1">
            <Star className="w-4 h-4 text-yellow-400 fill-current" />
            <span className="text-sm text-gray-600">4.5</span>
          </div>
        </div>

        {/* Tags */}
        {product.tags && product.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {product.tags.slice(0, 3).map((tag, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
            {product.tags.length > 3 && (
              <Badge variant="secondary" className="text-xs">
                +{product.tags.length - 3}
              </Badge>
            )}
          </div>
        )}

        {/* Botões de ação */}
        <div className="flex space-x-2">
          <Button
            onClick={() => onViewDetails && onViewDetails(product)}
            variant="outline"
            className="flex-1"
          >
            Ver Detalhes
          </Button>
          
          <Button
            onClick={() => onAddToCart && onAddToCart(product)}
            className="flex-1 bg-blue-600 hover:bg-blue-700"
          >
            <ShoppingCart className="w-4 h-4 mr-2" />
            Adicionar
          </Button>
        </div>

        {/* Link afiliado */}
        {product.affiliate_url && (
          <div className="mt-3 pt-3 border-t">
            <Button
              onClick={() => window.open(product.affiliate_url, '_blank')}
              variant="ghost"
              size="sm"
              className="w-full text-blue-600 hover:text-blue-700"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Comprar na {getPlatformName(product.platform)}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};