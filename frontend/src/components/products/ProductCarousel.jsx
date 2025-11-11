import React, { useState, useEffect, useCallback } from "react";
import { getAuthToken } from "@/utils/storage";
import logger from "@/utils/logger";
import apiClient from "@/services/apiClient";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/Ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/Ui/card";
import { Badge } from "@/components/Ui/badge";
import { H2 } from "@/components/Ui/typography";
import { useCart } from "../../contexts/CartContext";
import { useAuth } from "../../hooks/useAuth.jsx";
import { toast } from "sonner";
import {
  ChevronLeft,
  ChevronRight,
  Star,
  ShoppingCart,
  Heart,
  Eye,
  Package,
  Truck,
} from "lucide-react";

/**
 * Carrossel de produtos com navegação responsiva.
 * - Exibe de 1 a 3 itens por visão conforme largura da tela
 * - Suporta ações de ver detalhes, adicionar ao carrinho e wishlist
 * - Inclui fallback seguro quando lista está vazia ou indefinida
 */
const ProductCarousel = ({ products, title = "Produtos em Destaque" }) => {
  const navigate = useNavigate();
  const { refreshCart } = useCart();
  const { isAuthenticated } = useAuth();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [itemsPerView, setItemsPerView] = useState(3);

  // Responsive items per view
  useEffect(() => {
    const updateItemsPerView = () => {
      if (window.innerWidth < 640) {
        setItemsPerView(1);
      } else if (window.innerWidth < 1024) {
        setItemsPerView(2);
      } else {
        setItemsPerView(3);
      }
    };

    updateItemsPerView();
    window.addEventListener("resize", updateItemsPerView);
    return () => window.removeEventListener("resize", updateItemsPerView);
  }, []);

  const list = Array.isArray(products) ? products : [];
  const maxIndex = Math.max(0, list.length - itemsPerView);

  const nextSlide = React.useCallback(() => {
    setCurrentIndex((prev) => Math.min(prev + 1, maxIndex));
  }, [maxIndex]);

  const prevSlide = React.useCallback(() => {
    setCurrentIndex((prev) => Math.max(prev - 1, 0));
  }, []);

  const goToSlide = (index) => {
    setCurrentIndex(index);
  };

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < Math.floor(rating)
            ? "text-primary fill-current"
            : "text-muted-foreground"
        }`}
      />
    ));
  };

  const handleViewDetails = (productId) => {
    navigate(`/product/${productId}`);
  };

  const handleAddToCart = React.useCallback(async (product) => {
    if (!isAuthenticated) {
      toast.info("Faça login para adicionar produtos ao carrinho");
      navigate("/login");
      return;
    }

    try {
      await apiClient.post("/cart/add", {
        body: {
          product_id: product.id,
          quantity: 1
        }
      });
      await refreshCart();
      toast.success(`${product.name} adicionado ao carrinho!`);
    } catch (error) {
      logger.error("Erro ao adicionar ao carrinho:", error);
      toast.error(error.message || "Erro ao adicionar produto ao carrinho");
    }
  }, [isAuthenticated, navigate, refreshCart]);

  const handleAddToWishlist = useCallback(async (product) => {
    if (!isAuthenticated) {
      toast.info("Faça login para adicionar à lista de desejos");
      navigate("/login");
      return;
    }

    try {
      const token = getAuthToken();

      if (!token) {
        toast.info("Faça login para adicionar à lista de desejos");
        navigate("/login");
        return;
      }

      // Adicionar produto à lista de desejos via API real
      await apiClient.post("/wishlist/add", {
        body: {
          product_id: product.id,
          product_name: product.name,
          product_price: product.price,
          product_image: product.image,
        },
      });
      toast.success(`${product.name} adicionado à lista de desejos!`);
    } catch (error) {
      logger.error("Erro ao adicionar à lista de desejos:", error);
      toast.error(
        error.message || "Erro ao adicionar produto à lista de desejos",
      );
    }
  }, [isAuthenticated, navigate]);

  if (!list || list.length === 0) {
    return null;
  }

  return (
    <section className="py-16 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <H2 className="text-3xl md:text-4xl mb-6">
            {title}
          </H2>
          <p className="text-lg text-muted-foreground/90 max-w-2xl mx-auto leading-relaxed">
            Descubra nossos produtos mais populares e bem avaliados
          </p>
        </div>

        {/* Carousel Container */}
        <div className="relative">
          {/* Navigation Buttons */}
          <Button
            variant="outline"
            size="icon"
            onClick={prevSlide}
            disabled={currentIndex === 0}
            className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-4 z-10 w-12 h-12 rounded-full shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1),0_2px_4px_-1px_rgba(0,0,0,0.06)] bg-card/80 backdrop-blur-sm border border-border/50 hover:bg-accent/80 transition-all duration-300"
          >
            <ChevronLeft className="w-6 h-6" />
          </Button>

          <Button
            variant="outline"
            size="icon"
            onClick={nextSlide}
            disabled={currentIndex >= maxIndex}
            className="absolute right-0 top-1/2 transform -translate-y-1/2 translate-x-4 z-10 w-12 h-12 rounded-full shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1),0_2px_4px_-1px_rgba(0,0,0,0.06)] bg-card/80 backdrop-blur-sm border border-border/50 hover:bg-accent/80 transition-all duration-300"
          >
            <ChevronRight className="w-6 h-6" />
          </Button>

          {/* Products Grid */}
          <div className="overflow-hidden">
            <div
              className="flex transition-transform duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]"
              style={{
                transform: `translateX(-${currentIndex * (100 / itemsPerView)}%)`,
              }}
            >
              {list.map((product) => (
                <div
                  key={product.id}
                  className="flex-shrink-0 px-3"
                  style={{ width: `${100 / itemsPerView}%` }}
                >
                  <Card className="group hover:shadow-lg transition-all duration-300 border-0 shadow-md flex flex-col h-full">
                    <div className="relative overflow-hidden rounded-t-lg">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      {product.isNew && (
                        <Badge variant="default" className="absolute top-2 left-2">
                          Novo
                        </Badge>
                      )}
                      {product.discount && (
                        <Badge variant="destructive" className="absolute top-2 right-2">
                          -{product.discount}%
                        </Badge>
                      )}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]" />
                    </div>

                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg font-semibold line-clamp-2">
                            {product.name}
                          </CardTitle>
                          <CardDescription className="text-sm mt-1">
                            {product.brand}
                          </CardDescription>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleAddToWishlist(product)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                        >
                          <Heart className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardHeader>

                    <CardContent className="pt-0 flex flex-col flex-1">
                      {/* Rating */}
                      <div className="flex items-center gap-2 mb-3">
                        <div className="flex items-center">
                          {renderStars(product.rating)}
                        </div>
                        <span className="text-sm text-muted-foreground">
                          ({product.reviews})
                        </span>
                      </div>

                      {/* Price */}
                      <div className="flex items-center gap-2 mb-4">
                        <span className="text-xl font-bold text-foreground">
                          R$ {product.price.toFixed(2).replace(".", ",")}
                        </span>
                        {product.originalPrice && (
                          <span className="text-sm text-muted-foreground line-through">
                            R${" "}
                            {product.originalPrice.toFixed(2).replace(".", ",")}
                          </span>
                        )}
                      </div>

                      {/* Features */}
                      <div className="space-y-1 mb-4 flex-1">
                        {product.features?.slice(0, 2).map((feature, index) => (
                          <div
                            key={index}
                            className="flex items-center text-sm text-muted-foreground"
                          >
                            <Package className="w-3 h-3 mr-2" />
                            {feature}
                          </div>
                        ))}
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 mt-auto">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewDetails(product.id)}
                          className="flex-1 h-9"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Ver Detalhes
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleAddToCart(product)}
                          className="flex-1 h-9"
                        >
                          <ShoppingCart className="w-4 h-4 mr-2" />
                          Adicionar
                        </Button>
                      </div>

                      {/* Shipping Info */}
                      <div className="flex items-center text-xs text-muted-foreground mt-3 pt-3 border-t border-border">
                        <Truck className="w-3 h-3 mr-1" />
                        {product.freeShipping
                          ? "Frete grátis"
                          : `Frete: R$ ${product.shipping?.toFixed(2).replace(".", ",")}`}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Dots Indicator */}
        {maxIndex > 0 && (
          <div className="flex justify-center mt-8 space-x-2">
            {Array.from({ length: maxIndex + 1 }, (_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  index === currentIndex
                    ? "bg-primary"
                    : "bg-muted hover:bg-accent"
                }`}
              />
            ))}
          </div>
        )}

        {/* View All Button */}
        <div className="text-center mt-8">
          <Button
            variant="outline"
            size="lg"
            onClick={() => navigate("/catalog")}
            className="px-8"
          >
            Ver Todos os Produtos
          </Button>
        </div>
      </div>
    </section>
  );
};

export default ProductCarousel;
