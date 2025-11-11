import { useState, useEffect, useMemo } from "react";
import logger from "@/utils/logger";
import { apiService } from "../lib/api";
/**
 * useProducts
 * - Carrega produtos e categorias; utilitários de filtro/ordenação
 * - Fallbacks seguros para campos opcionais e erros de API
 */

// Hook para gerenciar produtos e catálogo
export const useProducts = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Carregar dados reais da API
  useEffect(() => {
    const abortController = new AbortController();
    
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Usar apiService em vez de fetch direto
        const data = await apiService.products.getAll();
        
        // A API retorna { products: [], total: 0, page: 1 } ou formato similar
        const productsList = Array.isArray(data?.products)
          ? data.products
          : Array.isArray(data?.data)
            ? data.data
            : Array.isArray(data)
              ? data
              : [];
        setProducts(productsList);

        // Gerar categorias dinamicamente a partir dos produtos
        const categoriesMap = new Map();
        productsList.forEach((product) => {
          const cat = product?.category || "outros";
          const count = categoriesMap.get(cat) || 0;
          categoriesMap.set(cat, count + 1);
        });

        const categoriesList = [
          { id: "all", name: "Todos os Produtos", count: productsList.length },
          ...Array.from(categoriesMap.entries()).map(([id, count]) => ({
            id,
            name: id.charAt(0).toUpperCase() + id.slice(1),
            count,
          })),
        ];

        setCategories(categoriesList);
      } catch (err) {
        // Ignorar erro se foi cancelado (componente desmontou)
        if (err.name === 'AbortError') {
          return;
        }
        logger.error("Erro ao carregar produtos:", err);
        setError(err.message);
        setProducts([]);
        setCategories([{ id: "all", name: "Todos os Produtos", count: 0 }]);
      } finally {
        if (!abortController.signal.aborted) {
          setLoading(false);
        }
      }
    };

    loadData();
    
    return () => {
      abortController.abort();
    };
  }, []);

  // Funções de filtro e busca
  const filterProducts = (filters = {}) => {
    let filtered = [...products];

    // Filtro por categoria
    if (filters.category && filters.category !== "all") {
      filtered = filtered.filter(
        (product) => (product?.category || "") === filters.category,
      );
    }

    // Filtro por subcategoria
    if (filters.subcategory) {
      filtered = filtered.filter(
        (product) => (product?.subcategory || "") === filters.subcategory,
      );
    }

    // Filtro por busca
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter((product) => {
        const name = product?.name || "";
        const brand = product?.brand || "";
        const description = product?.description || "";
        const tags = Array.isArray(product?.tags) ? product.tags : [];
        return (
          name.toLowerCase().includes(searchLower) ||
          brand.toLowerCase().includes(searchLower) ||
          description.toLowerCase().includes(searchLower) ||
          tags.some((tag) => (tag || "").toLowerCase().includes(searchLower))
        );
      });
    }

    // Filtro por preço
    if (filters.minPrice) {
      filtered = filtered.filter(
        (product) => Number(product?.price) >= Number(filters.minPrice),
      );
    }
    if (filters.maxPrice) {
      filtered = filtered.filter(
        (product) => Number(product?.price) <= Number(filters.maxPrice),
      );
    }

    // Filtro por disponibilidade
    if (filters.inStock) {
      filtered = filtered.filter((product) => Number(product?.stock) > 0);
    }

    // Filtro por frete grátis
    if (filters.freeShipping) {
      filtered = filtered.filter((product) => Boolean(product?.freeShipping));
    }

    return filtered;
  };

  const sortProducts = (products, sortBy) => {
    const sorted = [...products];

    switch (sortBy) {
      case "name":
        return sorted.sort((a, b) => a.name.localeCompare(b.name));
      case "price-low":
        return sorted.sort((a, b) => (a.price || 0) - (b.price || 0));
      case "price-high":
        return sorted.sort((a, b) => (b.price || 0) - (a.price || 0));
      case "rating":
        return sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0));
      case "reviews":
        return sorted.sort((a, b) => (b.reviews || 0) - (a.reviews || 0));
      case "newest":
        return sorted.sort((a, b) => Number(b.isNew) - Number(a.isNew));
      case "discount":
        return sorted.sort((a, b) => (b.discount || 0) - (a.discount || 0));
      default:
        return sorted;
    }
  };

  // Produtos em destaque
  const featuredProducts = useMemo(() => {
    return (products || [])
      .filter((product) => Boolean(product?.isNew) || (product?.discount || 0) > 20)
      .slice(0, 6);
  }, [products]);

  // Produtos mais vendidos
  const bestSellers = useMemo(() => {
    return [...(products || [])]
      .sort((a, b) => (b.reviews || 0) - (a.reviews || 0))
      .slice(0, 6);
  }, [products]);

  // Produtos com desconto
  const discountedProducts = useMemo(() => {
    return (products || [])
      .filter((product) => (product?.discount || 0) > 0)
      .sort((a, b) => (b.discount || 0) - (a.discount || 0));
  }, [products]);

  return {
    products,
    categories,
    featuredProducts,
    bestSellers,
    discountedProducts,
    loading,
    error,
    filterProducts,
    sortProducts,
    // Funções utilitárias
    getProductById: (id) => (products || []).find((p) => p.id === id),
    getProductsByCategory: (category) =>
      (products || []).filter((p) => p.category === category),
    getRelatedProducts: (productId, limit = 4) => {
      const product = products.find((p) => p.id === productId);
      if (!product) return [];
      return products
        .filter((p) => p.id !== productId && p.category === product.category)
        .slice(0, limit);
    },
  };
};
