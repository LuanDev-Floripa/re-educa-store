import { useState, useEffect, useMemo } from 'react';

// Hook para gerenciar produtos e catálogo
export const useProducts = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Carregar dados reais da API
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch('/api/products', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error(`Erro ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        // A API retorna { products: [], total: 0, page: 1 } ou formato similar
        const productsList = data.products || data.data || data || [];
        setProducts(productsList);

        // Gerar categorias dinamicamente a partir dos produtos
        const categoriesMap = new Map();
        productsList.forEach(product => {
          const cat = product.category || 'outros';
          const count = categoriesMap.get(cat) || 0;
          categoriesMap.set(cat, count + 1);
        });

        const categoriesList = [
          { id: 'all', name: 'Todos os Produtos', count: productsList.length },
          ...Array.from(categoriesMap.entries()).map(([id, count]) => ({
            id,
            name: id.charAt(0).toUpperCase() + id.slice(1),
            count
          }))
        ];

        setCategories(categoriesList);
      } catch (err) {
        console.error('Erro ao carregar produtos:', err);
        setError(err.message);
        setProducts([]);
        setCategories([{ id: 'all', name: 'Todos os Produtos', count: 0 }]);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Funções de filtro e busca
  const filterProducts = (filters = {}) => {
    let filtered = [...products];

    // Filtro por categoria
    if (filters.category && filters.category !== 'all') {
      filtered = filtered.filter(product => product.category === filters.category);
    }

    // Filtro por subcategoria
    if (filters.subcategory) {
      filtered = filtered.filter(product => product.subcategory === filters.subcategory);
    }

    // Filtro por busca
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(product => 
        product.name.toLowerCase().includes(searchLower) ||
        product.brand.toLowerCase().includes(searchLower) ||
        product.description.toLowerCase().includes(searchLower) ||
        product.tags.some(tag => tag.toLowerCase().includes(searchLower))
      );
    }

    // Filtro por preço
    if (filters.minPrice) {
      filtered = filtered.filter(product => product.price >= filters.minPrice);
    }
    if (filters.maxPrice) {
      filtered = filtered.filter(product => product.price <= filters.maxPrice);
    }

    // Filtro por disponibilidade
    if (filters.inStock) {
      filtered = filtered.filter(product => product.stock > 0);
    }

    // Filtro por frete grátis
    if (filters.freeShipping) {
      filtered = filtered.filter(product => product.freeShipping);
    }

    return filtered;
  };

  const sortProducts = (products, sortBy) => {
    const sorted = [...products];
    
    switch (sortBy) {
      case 'name':
        return sorted.sort((a, b) => a.name.localeCompare(b.name));
      case 'price-low':
        return sorted.sort((a, b) => a.price - b.price);
      case 'price-high':
        return sorted.sort((a, b) => b.price - a.price);
      case 'rating':
        return sorted.sort((a, b) => b.rating - a.rating);
      case 'reviews':
        return sorted.sort((a, b) => b.reviews - a.reviews);
      case 'newest':
        return sorted.sort((a, b) => b.isNew - a.isNew);
      case 'discount':
        return sorted.sort((a, b) => b.discount - a.discount);
      default:
        return sorted;
    }
  };

  // Produtos em destaque
  const featuredProducts = useMemo(() => {
    return products.filter(product => product.isNew || product.discount > 20).slice(0, 6);
  }, [products]);

  // Produtos mais vendidos
  const bestSellers = useMemo(() => {
    return products.sort((a, b) => b.reviews - a.reviews).slice(0, 6);
  }, [products]);

  // Produtos com desconto
  const discountedProducts = useMemo(() => {
    return products.filter(product => product.discount > 0).sort((a, b) => b.discount - a.discount);
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
    getProductById: (id) => products.find(p => p.id === id),
    getProductsByCategory: (category) => products.filter(p => p.category === category),
    getRelatedProducts: (productId, limit = 4) => {
      const product = products.find(p => p.id === productId);
      if (!product) return [];
      return products
        .filter(p => p.id !== productId && p.category === product.category)
        .slice(0, limit);
    }
  };
};