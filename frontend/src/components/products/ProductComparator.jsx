import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/Ui/card';
import { Button } from '@/components/Ui/button';
import { Badge } from '@/components/Ui/badge';
import { Progress } from '@/components/Ui/progress';
import { 
  ShoppingCart, 
  Heart, 
  Star, 
  Package, 
  Truck, 
  Shield, 
  Award, 
  TrendingUp,
  TrendingDown,
  Minus,
  Plus,
  X,
  Check,
  AlertTriangle,
  Info,
  Zap,
  Target,
  Users,
  Clock,
  DollarSign,
  Percent,
  Scale,
  Droplets,
  Flame,
  Activity
} from 'lucide-react';

export const ProductComparator = ({ 
  products = [], 
  onAddToCart, 
  onAddToFavorites,
  onRemoveProduct,
  maxProducts = 4 
}) => {
  const [comparisonData, setComparisonData] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [showComparison, setShowComparison] = useState(false);

  // Função para adicionar produto à comparação
  const handleAddToComparison = (product) => {
    if (comparisonData.length < maxProducts) {
      setComparisonData([...comparisonData, product]);
    }
  };

  // Função para remover produto da comparação
  const handleRemoveFromComparison = (productId) => {
    setComparisonData(comparisonData.filter(p => p.id !== productId));
  };

  // Função para alternar exibição da comparação
  const toggleComparison = () => {
    setShowComparison(!showComparison);
  };

  useEffect(() => {
    if (products.length > 0) {
      setSelectedProducts(products.slice(0, maxProducts));
      setShowComparison(true);
    } else {
      // Carregar produtos da API se não foram fornecidos
      loadProductsFromAPI();
    }
  }, [products, maxProducts]);

  const loadProductsFromAPI = async () => {
    try {
      const response = await fetch('/api/products?per_page=20&featured=true');
      if (response.ok) {
        const data = await response.json();
        if (data.products && data.products.length > 0) {
          setSelectedProducts(data.products.slice(0, maxProducts));
          setShowComparison(true);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
    }
  };

  // Dados de exemplo para comparação
  const exampleProducts = [
    {
      id: 1,
      name: 'Whey Protein Premium',
      brand: 'MuscleTech',
      price: 189.90,
      originalPrice: 229.90,
      discount: 17,
      rating: 4.8,
      reviews: 1247,
      image: '/images/whey-premium.jpg',
      category: 'Suplementos',
      subcategory: 'Proteínas',
      weight: '2kg',
      servings: 66,
      proteinPerServing: 25,
      caloriesPerServing: 120,
      flavor: 'Chocolate',
      ingredients: ['Whey Protein Concentrate', 'Whey Protein Isolate', 'Cocoa Powder'],
      benefits: ['Ganho de Massa', 'Recuperação', 'Conveniência'],
      inStock: true,
      stock: 15,
      shipping: 'Frete Grátis',
      warranty: '30 dias',
      origin: 'Importado',
      certifications: ['FDA', 'GMP', 'ISO'],
      allergens: ['Leite'],
      shelfLife: '24 meses',
      storage: 'Ambiente seco',
      popularity: 95,
      trend: 'up'
    },
    {
      id: 2,
      name: 'Whey Protein Gold Standard',
      brand: 'Optimum Nutrition',
      price: 199.90,
      originalPrice: 199.90,
      discount: 0,
      rating: 4.9,
      reviews: 2156,
      image: '/images/whey-gold.jpg',
      category: 'Suplementos',
      subcategory: 'Proteínas',
      weight: '2.27kg',
      servings: 74,
      proteinPerServing: 24,
      caloriesPerServing: 130,
      flavor: 'Baunilha',
      ingredients: ['Whey Protein Isolate', 'Whey Protein Concentrate', 'Natural Vanilla'],
      benefits: ['Ganho de Massa', 'Qualidade Premium', 'Sabor'],
      inStock: true,
      stock: 8,
      shipping: 'Frete Grátis',
      warranty: '30 dias',
      origin: 'Importado',
      certifications: ['FDA', 'GMP', 'NSF'],
      allergens: ['Leite'],
      shelfLife: '24 meses',
      storage: 'Ambiente seco',
      popularity: 98,
      trend: 'stable'
    },
    {
      id: 3,
      name: 'Whey Protein Dymatize',
      brand: 'Dymatize',
      price: 179.90,
      originalPrice: 219.90,
      discount: 18,
      rating: 4.7,
      reviews: 892,
      image: '/images/whey-dymatize.jpg',
      category: 'Suplementos',
      subcategory: 'Proteínas',
      weight: '2kg',
      servings: 60,
      proteinPerServing: 25,
      caloriesPerServing: 110,
      flavor: 'Cookies & Cream',
      ingredients: ['Whey Protein Isolate', 'Whey Protein Concentrate', 'Natural Flavors'],
      benefits: ['Absorção Rápida', 'Baixo Carboidrato', 'Sabor Único'],
      inStock: true,
      stock: 12,
      shipping: 'Frete Grátis',
      warranty: '30 dias',
      origin: 'Importado',
      certifications: ['FDA', 'GMP'],
      allergens: ['Leite'],
      shelfLife: '24 meses',
      storage: 'Ambiente seco',
      popularity: 87,
      trend: 'up'
    },
    {
      id: 4,
      name: 'Whey Protein BSN',
      brand: 'BSN',
      price: 169.90,
      originalPrice: 199.90,
      discount: 15,
      rating: 4.6,
      reviews: 634,
      image: '/images/whey-bsn.jpg',
      category: 'Suplementos',
      subcategory: 'Proteínas',
      weight: '1.8kg',
      servings: 54,
      proteinPerServing: 22,
      caloriesPerServing: 140,
      flavor: 'Morango',
      ingredients: ['Whey Protein Blend', 'Natural Strawberry', 'Digestive Enzymes'],
      benefits: ['Digestão Fácil', 'Sabor Natural', 'Preço Acessível'],
      inStock: false,
      stock: 0,
      shipping: 'Frete Grátis',
      warranty: '30 dias',
      origin: 'Importado',
      certifications: ['FDA', 'GMP'],
      allergens: ['Leite'],
      shelfLife: '24 meses',
      storage: 'Ambiente seco',
      popularity: 78,
      trend: 'down'
    }
  ];

  const comparisonFields = [
    {
      key: 'price',
      label: 'Preço',
      type: 'currency',
      icon: DollarSign,
      better: 'lower'
    },
    {
      key: 'rating',
      label: 'Avaliação',
      type: 'rating',
      icon: Star,
      better: 'higher'
    },
    {
      key: 'reviews',
      label: 'Avaliações',
      type: 'number',
      icon: Users,
      better: 'higher'
    },
    {
      key: 'proteinPerServing',
      label: 'Proteína por Dose (g)',
      type: 'number',
      icon: Target,
      better: 'higher'
    },
    {
      key: 'caloriesPerServing',
      label: 'Calorias por Dose',
      type: 'number',
      icon: Flame,
      better: 'lower'
    },
    {
      key: 'servings',
      label: 'Doses',
      type: 'number',
      icon: Package,
      better: 'higher'
    },
    {
      key: 'weight',
      label: 'Peso',
      type: 'text',
      icon: Scale,
      better: 'higher'
    },
    {
      key: 'popularity',
      label: 'Popularidade',
      type: 'percentage',
      icon: TrendingUp,
      better: 'higher'
    },
    {
      key: 'stock',
      label: 'Estoque',
      type: 'number',
      icon: Package,
      better: 'higher'
    }
  ];

  const getBestValue = (field, products) => {
    if (field.better === 'higher') {
      return Math.max(...products.map(p => p[field.key] || 0));
    } else if (field.better === 'lower') {
      return Math.min(...products.map(p => p[field.key] || Infinity));
    }
    return null;
  };

  const formatValue = (value, type) => {
    switch (type) {
      case 'currency':
        return `R$ ${value.toFixed(2).replace('.', ',')}`;
      case 'rating':
        return value.toFixed(1);
      case 'number':
        return value.toString();
      case 'percentage':
        return `${value}%`;
      case 'text':
        return value;
      default:
        return value;
    }
  };

  const getValueColor = (value, field, products) => {
    const bestValue = getBestValue(field, products);
    if (bestValue === null) return 'text-gray-600';
    
    if (field.better === 'higher' && value === bestValue) {
      return 'text-green-600 font-semibold';
    } else if (field.better === 'lower' && value === bestValue) {
      return 'text-green-600 font-semibold';
    }
    
    return 'text-gray-600';
  };

  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'down':
        return <TrendingDown className="w-4 h-4 text-red-500" />;
      default:
        return <Minus className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStockStatus = (product) => {
    if (!product.inStock) {
      return { text: 'Fora de Estoque', color: 'text-red-600', bg: 'bg-red-50' };
    } else if (product.stock <= 5) {
      return { text: 'Estoque Baixo', color: 'text-orange-600', bg: 'bg-orange-50' };
    } else {
      return { text: 'Em Estoque', color: 'text-green-600', bg: 'bg-green-50' };
    }
  };

  const productsToCompare = selectedProducts.length > 0 ? selectedProducts : exampleProducts;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Comparador de Produtos
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Compare produtos lado a lado e encontre o melhor para você
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="secondary">
            {productsToCompare.length} produtos
          </Badge>
          {productsToCompare.length < maxProducts && (
            <Button variant="outline" size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Produto
            </Button>
          )}
        </div>
      </div>

      {/* Controles de Comparação */}
      <div className="flex items-center space-x-2 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <span className="text-sm text-gray-600 dark:text-gray-400">
          Produtos na comparação: {comparisonData.length}
        </span>
        <Button 
          variant="outline" 
          size="sm"
          onClick={toggleComparison}
        >
          {showComparison ? 'Ocultar' : 'Mostrar'} Comparação
        </Button>
        {comparisonData.length > 0 && (
          <Button 
            variant="destructive" 
            size="sm"
            onClick={() => setComparisonData([])}
          >
            Limpar Comparação
          </Button>
        )}
        <Button 
          variant="secondary" 
          size="sm"
          onClick={() => handleAddToComparison(productsToCompare[0])}
        >
          Adicionar à Comparação
        </Button>
        <Button 
          variant="secondary" 
          size="sm"
          onClick={() => handleRemoveFromComparison(productsToCompare[0]?.id)}
        >
          Remover da Comparação
        </Button>
      </div>

      {/* Cards dos Produtos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {productsToCompare.map((product, index) => {
          const stockStatus = getStockStatus(product);
          return (
            <Card key={product.id} className="relative">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-sm font-medium line-clamp-2">
                      {index + 1}. {product.name}
                    </CardTitle>
                    <CardDescription className="text-xs">
                      {product.brand}
                    </CardDescription>
                  </div>
                  {onRemoveProduct && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onRemoveProduct(product.id)}
                      className="h-6 w-6 p-0 text-gray-400 hover:text-red-600"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              
              <CardContent className="space-y-3">
                {/* Imagem do Produto */}
                <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
                  <Package className="w-12 h-12 text-gray-400" />
                </div>

                {/* Preço */}
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg font-bold text-green-600">
                      R$ {product.price.toFixed(2).replace('.', ',')}
                    </span>
                    {product.discount > 0 && (
                      <Badge variant="destructive" className="text-xs">
                        -{product.discount}%
                      </Badge>
                    )}
                  </div>
                  {product.originalPrice > product.price && (
                    <span className="text-sm text-gray-500 line-through">
                      R$ {product.originalPrice.toFixed(2).replace('.', ',')}
                    </span>
                  )}
                </div>

                {/* Rating */}
                <div className="flex items-center space-x-2">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3 h-3 ${
                          i < Math.floor(product.rating)
                            ? 'text-yellow-400 fill-current'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-xs text-gray-600">
                    {product.rating} ({product.reviews})
                  </span>
                </div>

                {/* Status do Estoque */}
                <div className={`px-2 py-1 rounded-full text-xs font-medium ${stockStatus.bg} ${stockStatus.color}`}>
                  {stockStatus.text}
                </div>

                {/* Tendência */}
                <div className="flex items-center space-x-1">
                  {getTrendIcon(product.trend)}
                  <span className="text-xs text-gray-600">
                    Popularidade: {product.popularity}%
                  </span>
                </div>

                {/* Ações */}
                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    className="flex-1"
                    disabled={!product.inStock}
                    onClick={() => onAddToCart && onAddToCart(product)}
                  >
                    <ShoppingCart className="w-3 h-3 mr-1" />
                    Comprar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onAddToFavorites && onAddToFavorites(product)}
                  >
                    <Heart className="w-3 h-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Tabela de Comparação */}
      <Card>
        <CardHeader>
          <CardTitle>Comparação Detalhada</CardTitle>
          <CardDescription>
            Compare especificações, preços e características dos produtos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
                    Característica
                  </th>
                  {productsToCompare.map((product) => (
                    <th key={product.id} className="text-center py-3 px-4 font-medium text-gray-700 dark:text-gray-300 min-w-[200px]">
                      <div className="space-y-1">
                        <div className="font-semibold text-sm">{product.name}</div>
                        <div className="text-xs text-gray-500">{product.brand}</div>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {comparisonFields.map((field) => {
                  const IconComponent = field.icon;
                  return (
                    <tr key={field.key} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          <IconComponent className="w-4 h-4 text-gray-500" />
                          <span className="font-medium text-gray-700 dark:text-gray-300">
                            {field.label}
                          </span>
                        </div>
                      </td>
                      {productsToCompare.map((product) => {
                        const value = product[field.key];
                        const formattedValue = formatValue(value, field.type);
                        const valueColor = getValueColor(value, field, productsToCompare);
                        
                        return (
                          <td key={product.id} className="py-3 px-4 text-center">
                            <span className={valueColor}>
                              {formattedValue}
                            </span>
                            {value === getBestValue(field, productsToCompare) && (
                              <Check className="w-4 h-4 text-green-600 inline-block ml-1" />
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Resumo da Comparação */}
      <Card>
        <CardHeader>
          <CardTitle>Resumo da Comparação</CardTitle>
          <CardDescription>
            Análise rápida dos melhores produtos em cada categoria
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {comparisonFields.slice(0, 6).map((field) => {
              const bestProduct = productsToCompare.reduce((best, current) => {
                const currentValue = current[field.key] || 0;
                const bestValue = best[field.key] || 0;
                
                if (field.better === 'higher') {
                  return currentValue > bestValue ? current : best;
                } else if (field.better === 'lower') {
                  return currentValue < bestValue ? current : best;
                }
                return best;
              });
              
              const IconComponent = field.icon;
              
              return (
                <div key={field.key} className="p-4 border rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <IconComponent className="w-4 h-4 text-blue-600" />
                    <span className="font-medium text-sm">{field.label}</span>
                  </div>
                  <div className="space-y-1">
                    <div className="font-semibold text-sm">{bestProduct.name}</div>
                    <div className="text-xs text-gray-600">
                      {formatValue(bestProduct[field.key], field.type)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Recomendações */}
      <Card>
        <CardHeader>
          <CardTitle>Nossa Recomendação</CardTitle>
          <CardDescription>
            Baseado na análise comparativa, aqui está nossa sugestão
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-900/20 dark:to-green-900/20 p-6 rounded-lg">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <Award className="w-8 h-8 text-yellow-500" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg mb-2">
                  Melhor Custo-Benefício: {productsToCompare[0]?.name}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Este produto oferece a melhor combinação de qualidade, preço e disponibilidade 
                  para suas necessidades.
                </p>
                <div className="flex space-x-2">
                  <Button>
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    Comprar Agora
                  </Button>
                  <Button variant="outline">
                    <Info className="w-4 h-4 mr-2" />
                    Ver Detalhes
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};