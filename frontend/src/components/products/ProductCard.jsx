import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/Ui/card";
import { Button } from "@/components/Ui/button";
import { Badge } from "@/components/Ui/badge";
import {
  Star,
  ShoppingCart,
  Heart,
  Eye,
  Package,
  Truck,
  Shield,
  Award,
  Tag,
} from "lucide-react";
import { formatCurrency } from "../../lib/utils";

/**
 * Card de produto com modos grid e lista.
 * - Exibe preço, avaliação, estoque e ações
 * - Suporta callbacks externos para carrinho e wishlist
 */
const ProductCard = ({
  product,
  onAddToCart,
  onAddToWishlist,
  viewMode = "grid",
  showQuickActions = true,
}) => {
  const navigate = useNavigate();
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  const renderStars = (rating) => {
    const safeRating = Number.isFinite(rating) ? rating : 0;
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < Math.floor(safeRating)
            ? "text-yellow-400 fill-current"
            : "text-gray-300"
        }`}
      />
    ));
  };

  const handleAddToCart = async () => {
    if (isAddingToCart) return;

    setIsAddingToCart(true);
    try {
      if (onAddToCart) {
        await onAddToCart(product);
      }
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handleAddToWishlist = () => {
    setIsWishlisted(!isWishlisted);
    if (onAddToWishlist) {
      onAddToWishlist(product);
    }
  };

  const handleViewDetails = () => {
    navigate(`/product/${product.id}`);
  };

  const isOutOfStock = (product?.stock ?? 0) === 0;
  const discountAmount = product?.originalPrice
    ? product.originalPrice - (product.price ?? 0)
    : 0;

  if (viewMode === "list") {
    return (
      <Card className="group hover:shadow-lg transition-all duration-300">
        <div className="flex">
          {/* Imagem */}
          <div className="relative w-48 h-48 flex-shrink-0">
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-full object-cover rounded-l-lg"
            />
            {product.isNew && (
              <Badge className="absolute top-2 left-2 bg-green-500 text-white">
                Novo
              </Badge>
            )}
            {product.discount && (
              <Badge className="absolute top-2 right-2 bg-red-500 text-white">
                -{product.discount}%
              </Badge>
            )}
          </div>

          {/* Conteúdo */}
          <div className="flex-1 p-6">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 transition-colors">
                  {product.name}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {product.brand}
                </p>
              </div>
              <div className="text-right">
                <div className="flex items-center space-x-2">
                  <span className="text-xl font-bold text-gray-900 dark:text-white">
                    {formatCurrency(product.price)}
                  </span>
                  {product.originalPrice && (
                    <span className="text-sm text-gray-500 line-through">
                      {formatCurrency(product.originalPrice)}
                    </span>
                  )}
                </div>
                {discountAmount > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    Economize {formatCurrency(discountAmount)}
                  </Badge>
                )}
              </div>
            </div>

            <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">
              {product.description}
            </p>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-1">
                  {renderStars(product.rating)}
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    ({product.reviews})
                  </span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                  {product.freeShipping && (
                    <div className="flex items-center space-x-1">
                      <Truck className="h-4 w-4 text-green-500" />
                      <span>Frete Grátis</span>
                    </div>
                  )}
                  <div className="flex items-center space-x-1">
                    <Package className="h-4 w-4" />
                    <span>{product.stock} em estoque</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm" onClick={handleViewDetails}>
                  <Eye className="h-4 w-4 mr-1" />
                  Ver Detalhes
                </Button>
                <Button
                  onClick={handleAddToCart}
                  disabled={isOutOfStock || isAddingToCart}
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <ShoppingCart className="h-4 w-4 mr-1" />
                  {isAddingToCart ? "Adicionando..." : "Adicionar"}
                </Button>
                {showQuickActions && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleAddToWishlist}
                  >
                    <Heart
                      className={`h-4 w-4 ${isWishlisted ? "fill-red-500 text-red-500" : ""}`}
                    />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  // Modo grid (padrão)
  return (
    <Card className="group hover:shadow-lg transition-all duration-300 border-0 shadow-md flex flex-col h-full">
      <div className="relative overflow-hidden rounded-t-lg">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
        />
        {product.isNew && (
          <Badge className="absolute top-2 left-2 bg-green-500 text-white">
            <Award className="h-3 w-3 mr-1" />
            Novo
          </Badge>
        )}
        {product.discount && (
          <Badge className="absolute top-2 right-2 bg-red-500 text-white">
            <Tag className="h-3 w-3 mr-1" />-{product.discount}%
          </Badge>
        )}
        {isOutOfStock && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <Badge variant="destructive" className="text-white">
              Esgotado
            </Badge>
          </div>
        )}
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-300" />
      </div>

      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg line-clamp-2 group-hover:text-blue-600 transition-colors">
              {product.name}
            </CardTitle>
            <CardDescription className="text-sm text-gray-600 dark:text-gray-400">
              {product.brand}
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col">
        {/* Preço */}
        <div className="mb-3">
          <div className="flex items-center space-x-2">
            <span className="text-xl font-bold text-gray-900 dark:text-white">
              {formatCurrency(product.price)}
            </span>
            {product.originalPrice && (
              <span className="text-sm text-gray-500 line-through">
                {formatCurrency(product.originalPrice)}
              </span>
            )}
          </div>
          {discountAmount > 0 && (
            <Badge variant="secondary" className="text-xs mt-1">
              Economize {formatCurrency(discountAmount)}
            </Badge>
          )}
        </div>

        {/* Avaliação */}
        <div className="flex items-center space-x-2 mb-3">
          <div className="flex items-center space-x-1">
            {renderStars(product.rating)}
          </div>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            ({product.reviews})
          </span>
        </div>

        {/* Features */}
        {product.features && product.features.length > 0 && (
          <div className="mb-4">
            <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
              {product.features.slice(0, 2).map((feature, index) => (
                <li key={index} className="flex items-center space-x-1">
                  <div className="w-1 h-1 bg-blue-500 rounded-full"></div>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Info adicional */}
        <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 mb-4">
          <div className="flex items-center space-x-3">
            {product.freeShipping && (
              <div className="flex items-center space-x-1">
                <Truck className="h-3 w-3 text-green-500" />
                <span>Frete Grátis</span>
              </div>
            )}
            <div className="flex items-center space-x-1">
              <Package className="h-3 w-3" />
              <span>{product.stock} em estoque</span>
            </div>
          </div>
        </div>

        {/* Botões */}
        <div className="flex space-x-2 mt-auto">
          <Button
            onClick={handleAddToCart}
            disabled={isOutOfStock || isAddingToCart}
            className="flex-1 bg-blue-600 hover:bg-blue-700"
            size="sm"
          >
            <ShoppingCart className="h-4 w-4 mr-1" />
            {isAddingToCart ? "Adicionando..." : "Adicionar"}
          </Button>
          {showQuickActions && (
            <>
              <Button variant="outline" size="sm" onClick={handleViewDetails}>
                <Eye className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={handleAddToWishlist}>
                <Heart
                  className={`h-4 w-4 ${isWishlisted ? "fill-red-500 text-red-500" : ""}`}
                />
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ProductCard;
