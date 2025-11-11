/**
 * AffiliateProductCard Component - RE-EDUCA Store
 * 
 * Card de exibição de produto afiliado.
 * 
 * Funcionalidades:
 * - Exibe informações do produto
 * - Link de afiliado
 * - Badge de plataforma (Hotmart, Kiwify, etc.)
 * - Botões de ação (adicionar ao carrinho, ver detalhes)
 * 
 * @component
 * @param {Object} props - Props do componente
 * @param {Object} props.product - Dados do produto afiliado
 * @param {Function} [props.onAddToCart] - Callback para adicionar ao carrinho
 * @param {Function} [props.onViewDetails] - Callback para ver detalhes
 * @returns {JSX.Element} Card de produto afiliado
 */
import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/Ui/card";
import { Button } from "@/components/Ui/button";
import { Badge } from "@/components/Ui/badge";
import { ExternalLink, ShoppingCart, Star, TrendingUp } from "lucide-react";
import { formatCurrency } from "../../lib/utils";

export const AffiliateProductCard = ({
  product,
  onAddToCart,
  onViewDetails,
}) => {
  const getPlatformColor = (platform) => {
    switch (platform) {
      case "hotmart":
        return "bg-primary/10 text-primary";
      case "kiwify":
        return "bg-primary/10 text-primary";
      case "logs":
        return "bg-primary/10 text-primary";
      case "braip":
        return "bg-primary/10 text-primary";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getPlatformName = (platform) => {
    switch (platform) {
      case "hotmart":
        return "Hotmart";
      case "kiwify":
        return "Kiwify";
      case "logs":
        return "Logs";
      case "braip":
        return "Braip";
      default:
        return platform;
    }
  };

  return (
    <Card className="group hover:shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1),0_2px_4px_-1px_rgba(0,0,0,0.06)] transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] border-0 shadow-[0_1px_2px_0_rgba(0,0,0,0.05),0_1px_3px_0_rgba(0,0,0,0.1)]">
      <div className="relative">
        {/* Imagem do produto */}
        <div className="aspect-square overflow-hidden rounded-t-2xl bg-muted">
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/50">
              <ShoppingCart className="w-12 h-12 text-muted-foreground" />
            </div>
          )}
        </div>

        {/* Badge da plataforma */}
        <Badge
          className={`absolute top-2 right-2 ${getPlatformColor(product.platform)}`}
        >
          {getPlatformName(product.platform)}
        </Badge>

        {/* Badge de comissão */}
        {product.commission_rate > 0 && (
          <Badge className="absolute top-2 left-2 bg-primary/10 text-primary">
            <TrendingUp className="w-3 h-3 mr-1" />
            {product.commission_rate}% comissão
          </Badge>
        )}
      </div>

      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold line-clamp-2 group-hover:text-primary transition-colors">
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
            <span className="text-2xl font-bold text-foreground">
              {formatCurrency(product.price)}
            </span>
            <span className="text-sm text-muted-foreground">{product.currency}</span>
          </div>

          {/* Rating (simulado) */}
          <div className="flex items-center space-x-1">
            <Star className="w-4 h-4 text-primary fill-current" />
            <span className="text-sm text-muted-foreground">4.5</span>
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
            className="flex-1"
          >
            <ShoppingCart className="w-4 h-4 mr-2" />
            Adicionar
          </Button>
        </div>

        {/* Link afiliado */}
        {product.affiliate_url && (
          <div className="mt-3 pt-3 border-t">
            <Button
              onClick={() => window.open(product.affiliate_url, "_blank")}
              variant="ghost"
              size="sm"
              className="w-full text-primary hover:text-primary"
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
