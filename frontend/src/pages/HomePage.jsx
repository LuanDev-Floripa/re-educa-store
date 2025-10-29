import React, { Suspense, lazy, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Calculator, 
  Apple, 
  ShoppingBag, 
  TrendingUp, 
  ArrowRight,
  CheckCircle,
  Zap,
  Heart,
  Target,
  Users
} from 'lucide-react';

// Lazy load do carousel para evitar erro na HomePage
const ProductCarousel = lazy(() => import('../components/products/ProductCarousel').catch(() => ({
  default: () => <div className="text-center py-8 text-gray-500">Carregando produtos...</div>
})));

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:9001';

const HomePage = () => {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  // Buscar produtos reais do backend
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch(`${API_URL}/api/products?limit=6&featured=true`);
        if (response.ok) {
          const data = await response.json();
          setFeaturedProducts(data.products || []);
        }
      } catch (error) {
        console.error('Erro ao buscar produtos:', error);
      } finally {
        setLoadingProducts(false);
      }
    };

    fetchProducts();
  }, []);
  const features = [
    {
      icon: <Calculator className="w-8 h-8" />,
      title: "Calculadora de IMC",
      description: "Calcule seu Índice de Massa Corporal e acompanhe sua evolução",
      color: "text-blue-600"
    },
    {
      icon: <Apple className="w-8 h-8" />,
      title: "Diário Alimentar",
      description: "Registre suas refeições e monitore sua nutrição diária",
      color: "text-green-600"
    },
    {
      icon: <ShoppingBag className="w-8 h-8" />,
      title: "Loja de Produtos",
      description: "Encontre produtos de qualidade para sua saúde e bem-estar",
      color: "text-purple-600"
    },
    {
      icon: <TrendingUp className="w-8 h-8" />,
      title: "Análise de Dados",
      description: "Acompanhe seu progresso com relatórios detalhados",
      color: "text-orange-600"
    }
  ];

  const benefits = [
    "Acompanhamento personalizado da sua saúde",
    "Produtos selecionados por especialistas",
    "Relatórios detalhados de progresso",
    "Comunidade engajada e suporte 24/7"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 sm:pt-24 pb-16 sm:pb-20">
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
              Transforme sua{" "}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
                Saúde
              </span>
            </h1>
            <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
              A plataforma completa para monitorar sua saúde, gerenciar sua nutrição e encontrar produtos de qualidade para seu bem-estar.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                to="/register"
                className="inline-flex items-center justify-center px-8 py-3 text-base font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl"
              >
                Começar Agora
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
              <Link 
                to="/catalog"
                className="inline-flex items-center justify-center px-8 py-3 text-base font-medium rounded-lg text-blue-600 bg-white border-2 border-blue-600 hover:bg-blue-50 transition-colors"
              >
                Ver Produtos
              </Link>
              <Link 
                to="/login"
                className="inline-flex items-center justify-center px-8 py-3 text-base font-medium rounded-lg text-gray-700 hover:text-gray-900 hover:bg-gray-100 transition-colors dark:text-gray-300 dark:hover:bg-gray-800"
              >
                Já tenho conta
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 sm:py-20 lg:py-24 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Tudo que você precisa em um só lugar
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Ferramentas poderosas para cuidar da sua saúde
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div 
                key={index} 
                className="text-center hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 bg-white dark:bg-gray-700 rounded-xl p-6 border border-gray-200 dark:border-gray-600"
              >
                <div className={`mx-auto mb-4 p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-2xl w-fit ${feature.color}`}>
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-base leading-relaxed text-gray-600 dark:text-gray-300">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products Section */}
      {!loadingProducts && featuredProducts.length > 0 && (
        <section className="py-16">
          <Suspense fallback={
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Carregando produtos...</p>
            </div>
          }>
            <ProductCarousel 
              products={featuredProducts} 
              title="Produtos em Destaque" 
            />
          </Suspense>
        </section>
      )}
      
      {loadingProducts && (
        <section className="py-16">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-300">Buscando produtos...</p>
          </div>
        </section>
      )}

      {!loadingProducts && featuredProducts.length === 0 && (
        <section className="py-16 bg-white dark:bg-gray-800">
          <div className="max-w-7xl mx-auto px-4 text-center">
            <ShoppingBag className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Produtos em breve!
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Estamos preparando produtos incríveis para você.
            </p>
            <Link 
              to="/catalog"
              className="inline-flex items-center justify-center px-6 py-3 text-base font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors"
            >
              Ver Catálogo Completo
            </Link>
          </div>
        </section>
      )}

      {/* Benefits Section */}
      <section className="py-16 sm:py-20 lg:py-24 bg-gradient-to-br from-blue-600 to-blue-800 dark:from-blue-900 dark:to-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                Por que escolher a RE-EDUCA?
              </h2>
              <div className="space-y-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center text-white">
                    <CheckCircle className="w-6 h-6 mr-3 flex-shrink-0" />
                    <span className="text-lg">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 text-center">
                <Users className="w-12 h-12 text-white mx-auto mb-4" />
                <div className="text-3xl font-bold text-white">10K+</div>
                <div className="text-white/80">Usuários Ativos</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 text-center">
                <Target className="w-12 h-12 text-white mx-auto mb-4" />
                <div className="text-3xl font-bold text-white">95%</div>
                <div className="text-white/80">Taxa de Sucesso</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 text-center">
                <Zap className="w-12 h-12 text-white mx-auto mb-4" />
                <div className="text-3xl font-bold text-white">99%</div>
                <div className="text-white/80">Satisfação</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 text-center">
                <Heart className="w-12 h-12 text-white mx-auto mb-4" />
                <div className="text-3xl font-bold text-white">24/7</div>
                <div className="text-white/80">Suporte</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <Target className="w-16 h-16 text-blue-600 mx-auto mb-6" />
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-6">
            Pronto para começar sua jornada?
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
            Junte-se a milhares de pessoas que já transformaram sua saúde com a RE-EDUCA.
          </p>
          <Link 
            to="/register"
            className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl"
          >
            Criar Conta Gratuita
            <ArrowRight className="ml-2 w-5 h-5" />
          </Link>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
