import React, { Suspense, lazy } from 'react';
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
  Target
} from 'lucide-react';

// Lazy load do carousel para evitar erro na HomePage
const ProductCarousel = lazy(() => import('../components/products/ProductCarousel').catch(() => ({
  default: () => <div className="text-center py-8 text-gray-500">Carregando produtos...</div>
})));

const HomePage = () => {
  const features = [
    {
      icon: <Calculator className="w-8 h-8" />,
      title: "Calculadora de IMC",
      description: "Calcule seu Índice de Massa Corporal e acompanhe sua evolução",
      color: "text-gray-600"
    },
    {
      icon: <Apple className="w-8 h-8" />,
      title: "Diário Alimentar",
      description: "Registre suas refeições e monitore sua nutrição diária",
      color: "text-gray-600"
    },
    {
      icon: <ShoppingBag className="w-8 h-8" />,
      title: "Loja de Produtos",
      description: "Encontre produtos de qualidade para sua saúde e bem-estar",
      color: "text-gray-600"
    },
    {
      icon: <TrendingUp className="w-8 h-8" />,
      title: "Análise de Dados",
      description: "Acompanhe seu progresso com relatórios detalhados",
      color: "text-gray-600"
    }
  ];

  const benefits = [
    "Acompanhamento personalizado da sua saúde",
    "Produtos selecionados por especialistas",
    "Relatórios detalhados de progresso",
    "Comunidade engajada e suporte 24/7"
  ];

  // Produtos em destaque para o carrossel
  const featuredProducts = [
    {
      id: 1,
      name: "Whey Protein Premium",
      brand: "NutriMax",
      price: 89.90,
      originalPrice: 129.90,
      rating: 4.8,
      reviews: 1247,
      image: "https://images.unsplash.com/photo-1593095948071-474c5cc2989d?w=400&h=300&fit=crop",
      category: "suplementos",
      isNew: true,
      discount: 31,
      features: ["25g de proteína por dose", "Sabor chocolate", "Sem lactose"],
      freeShipping: true,
      shipping: 0
    },
    {
      id: 2,
      name: "Multivitamínico Completo",
      brand: "VitaLife",
      price: 45.50,
      rating: 4.6,
      reviews: 892,
      image: "https://images.unsplash.com/photo-1559181567-c3190ca9959b?w=400&h=300&fit=crop",
      category: "vitaminas",
      features: ["30 vitaminas e minerais", "Cápsulas vegetais", "1 mês de uso"],
      freeShipping: false,
      shipping: 12.90
    },
    {
      id: 3,
      name: "Óleo de Coco Extra Virgem",
      brand: "CocoPure",
      price: 32.90,
      rating: 4.7,
      reviews: 654,
      image: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400&h=300&fit=crop",
      category: "alimentos",
      features: ["100% natural", "500ml", "Orgânico certificado"],
      freeShipping: true,
      shipping: 0
    },
    {
      id: 4,
      name: "Termogênico Natural",
      brand: "BurnFit",
      price: 67.80,
      originalPrice: 89.90,
      rating: 4.5,
      reviews: 423,
      image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop",
      category: "suplementos",
      discount: 25,
      features: ["Queima de gordura", "Energia natural", "Sem estimulantes"],
      freeShipping: false,
      shipping: 15.90
    },
    {
      id: 5,
      name: "Chá Verde Detox",
      brand: "GreenTea",
      price: 28.50,
      rating: 4.4,
      reviews: 789,
      image: "https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&h=300&fit=crop",
      category: "bebidas",
      features: ["Antioxidantes naturais", "Sachês individuais", "Sabor suave"],
      freeShipping: true,
      shipping: 0
    },
    {
      id: 6,
      name: "Ômega 3 Premium",
      brand: "FishOil",
      price: 78.90,
      rating: 4.9,
      reviews: 1156,
      image: "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400&h=300&fit=crop",
      category: "vitaminas",
      isNew: true,
      features: ["1000mg por cápsula", "Ácido graxo EPA/DHA", "Sem sabor de peixe"],
      freeShipping: true,
      shipping: 0
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 sm:pt-24 pb-16 sm:pb-20">
          <div className="text-center">
            <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-6">
              Transforme sua
              <span className="text-gray-600 dark:text-gray-300">
                {" "}Saúde
              </span>
            </h1>
            <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 mb-6 sm:mb-8 max-w-3xl mx-auto px-4">
              A plataforma completa para monitorar sua saúde, gerenciar sua nutrição e encontrar produtos de qualidade para seu bem-estar.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center">
              <Link 
                to="/register"
                className="inline-flex items-center justify-center px-8 py-3 text-base font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors"
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
                className="inline-flex items-center justify-center px-8 py-3 text-base font-medium rounded-lg text-gray-700 hover:text-gray-900 hover:bg-gray-100 transition-colors"
              >
                Já tenho conta
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 sm:py-20 lg:py-24 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-4">
              Tudo que você precisa em um só lugar
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300">
              Ferramentas poderosas para cuidar da sua saúde
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {features.map((feature, index) => (
              <div 
                key={index} 
                className="text-center hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 bg-white dark:bg-gray-800 rounded-xl p-6"
              >
                <div className="mx-auto mb-4 p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-2xl w-fit">
                  <div className="text-blue-600 dark:text-blue-400">
                    {feature.icon}
                  </div>
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-3">
                  {feature.title}
                </h3>
                <p className="text-sm sm:text-base leading-relaxed text-gray-600 dark:text-gray-300">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products Section */}
      <Suspense fallback={
        <div className="py-16 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando produtos...</p>
        </div>
      }>
        <ProductCarousel 
          products={featuredProducts} 
          title="Produtos em Destaque" 
        />
      </Suspense>

      {/* Benefits Section */}
      <section className="py-16 sm:py-20 lg:py-24 bg-gray-800 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 items-center">
            <div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4 sm:mb-6">
                Por que escolher a RE-EDUCA?
              </h2>
              <div className="space-y-3 sm:space-y-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center text-white">
                    <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 mr-3 text-gray-300 flex-shrink-0" />
                    <span className="text-base sm:text-lg">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:gap-6">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 sm:p-6 text-center">
                <Users className="w-8 h-8 sm:w-12 sm:h-12 text-white mx-auto mb-3 sm:mb-4" />
                <div className="text-2xl sm:text-3xl font-bold text-white">10K+</div>
                <div className="text-sm sm:text-base text-white/80">Usuários Ativos</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 sm:p-6 text-center">
                <Star className="w-8 h-8 sm:w-12 sm:h-12 text-white mx-auto mb-3 sm:mb-4" />
                <div className="text-2xl sm:text-3xl font-bold text-white">4.9</div>
                <div className="text-sm sm:text-base text-white/80">Avaliação</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 sm:p-6 text-center">
                <Zap className="w-8 h-8 sm:w-12 sm:h-12 text-white mx-auto mb-3 sm:mb-4" />
                <div className="text-2xl sm:text-3xl font-bold text-white">99%</div>
                <div className="text-sm sm:text-base text-white/80">Satisfação</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 sm:p-6 text-center">
                <Heart className="w-8 h-8 sm:w-12 sm:h-12 text-white mx-auto mb-3 sm:mb-4" />
                <div className="text-2xl sm:text-3xl font-bold text-white">24/7</div>
                <div className="text-sm sm:text-base text-white/80">Suporte</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <Target className="w-16 h-16 text-gray-600 mx-auto mb-6" />
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