import React, { useState, useEffect } from "react";
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
  const { addToCart, openCart } = useCart();
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

  const nextSlide = () => {
    setCurrentIndex((prev) => Math.min(prev + 1, maxIndex));
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => Math.max(prev - 1, 0));
  };

  const goToSlide = (index) => {
    setCurrentIndex(index);
  };

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < Math.floor(rating)
            ? "text-yellow-400 fill-current"
            : "text-gray-300"
        }`}
      />
    ));
  };

  const handleViewDetails = (productId) => {
    navigate(`/product/${productId}`);
  };

  const handleAddToCart = async (product) => {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        toast.info("Faça login para adicionar produtos ao carrinho");
        navigate("/login");
        return;
      }

      // Adicionar produto ao carrinho via API real
      const response = await fetch("/api/cart/add", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          product_id: product.id,
          quantity: 1,
          price: product.price,
        }),
      });

      if (response.ok) {
        await response.json(); // Result não usado, apenas aguardar resposta

        // Atualizar carrinho local se necessário
        if (addToCart) {
          addToCart(product);
        }

        toast.success(`${product.name} adicionado ao carrinho!`);

        if (openCart) {
          openCart();
        }
      } else {
        const error = await response.json();
        throw new Error(error.error || "Erro ao adicionar ao carrinho");
      }
    } catch (error) {
      console.error("Erro ao adicionar ao carrinho:", error);
      toast.error(error.message || "Erro ao adicionar produto ao carrinho");
    }
  };

  const handleAddToWishlist = async (product) => {
    if (!isAuthenticated) {
      toast.info("Faça login para adicionar à lista de desejos");
      navigate("/login");
      return;
    }

    try {
      const token = localStorage.getItem("token");

      if (!token) {
        toast.info("Faça login para adicionar à lista de desejos");
        navigate("/login");
        return;
      }

      // Adicionar produto à lista de desejos via API real
      const response = await fetch("/api/wishlist/add", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          product_id: product.id,
          product_name: product.name,
          product_price: product.price,
          product_image: product.image,
        }),
      });

      if (response.ok) {
        await response.json(); // Result não usado, apenas aguardar resposta
        toast.success(`${product.name} adicionado à lista de desejos!`);
      } else {
        const error = await response.json();
        throw new Error(error.error || "Erro ao adicionar à lista de desejos");
      }
    } catch (error) {
      console.error("Erro ao adicionar à lista de desejos:", error);
      toast.error(
        error.message || "Erro ao adicionar produto à lista de desejos",
      );
    }
  };

  if (!list || list.length === 0) {
    return null;
  }

  return (
    <section className="py-16 bg-white dark:bg-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            {title}
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
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
            className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-4 z-10 w-12 h-12 rounded-full shadow-lg bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <ChevronLeft className="w-6 h-6" />
          </Button>

          <Button
            variant="outline"
            size="icon"
            onClick={nextSlide}
            disabled={currentIndex >= maxIndex}
            className="absolute right-0 top-1/2 transform -translate-y-1/2 translate-x-4 z-10 w-12 h-12 rounded-full shadow-lg bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <ChevronRight className="w-6 h-6" />
          </Button>

          {/* Products Grid */}
          <div className="overflow-hidden">
            <div
              className="flex transition-transform duration-500 ease-in-out"
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
                        <Badge className="absolute top-2 left-2 bg-green-500 text-white">
                          Novo
                        </Badge>
                      )}
                      {product.discount && (
                        <Badge className="absolute top-2 right-2 bg-red-500 text-white">
                          -{product.discount}%
                        </Badge>
                      )}
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-300" />
                    </div>

                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white line-clamp-2">
                            {product.name}
                          </CardTitle>
                          <CardDescription className="text-sm text-gray-600 dark:text-gray-400 mt-1">
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
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          ({product.reviews})
                        </span>
                      </div>

                      {/* Price */}
                      <div className="flex items-center gap-2 mb-4">
                        <span className="text-xl font-bold text-gray-900 dark:text-white">
                          R$ {product.price.toFixed(2).replace(".", ",")}
                        </span>
                        {product.originalPrice && (
                          <span className="text-sm text-gray-500 line-through">
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
                            className="flex items-center text-sm text-gray-600 dark:text-gray-400"
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
                          className="flex-1 h-9 bg-gray-800 hover:bg-gray-700 text-white"
                        >
                          <ShoppingCart className="w-4 h-4 mr-2" />
                          Adicionar
                        </Button>
                      </div>

                      {/* Shipping Info */}
                      <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
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
                    ? "bg-gray-800 dark:bg-white"
                    : "bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500"
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
