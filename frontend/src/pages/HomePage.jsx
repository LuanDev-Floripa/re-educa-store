import React, { Suspense, lazy, useState, useEffect } from "react";
import logger from "@/utils/logger";
import apiClient from "@/services/apiClient";
import { Link } from "react-router-dom";
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
  Users,
  Brain,
  Dumbbell,
  Sparkles,
  Star,
  Shield,
  Clock,
  Award,
  Activity,
  Droplets,
  Moon,
  MessageSquare,
  Image as ImageIcon,
  User,
} from "lucide-react";
import { H1, H2, H3 } from "@/components/Ui/typography";

// Lazy load do carousel para evitar erro na HomePage
const ProductCarousel = lazy(() =>
  import("../components/products/ProductCarousel").catch(() => ({
    default: () => (
      <div className="text-center py-8 text-muted-foreground">
        Carregando produtos...
      </div>
    ),
  })),
);

const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? "https://api.topsupplementslab.com" : "http://localhost:9001");

const HomePage = () => {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  // Buscar produtos reais do backend
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const data = await apiClient.get("/products?limit=6&featured=true");
        setFeaturedProducts(data.products || data.data || []);
      } catch (error) {
        logger.error("Erro ao buscar produtos:", error);
      } finally {
        setLoadingProducts(false);
      }
    };

    fetchProducts();
  }, []);

  const features = [
    {
      icon: Brain,
      title: "Assistente IA",
      description:
        "Converse com nossa IA inteligente e receba recomendações personalizadas",
      link: "/ai",
    },
    {
      icon: Calculator,
      title: "Calculadora IMC",
      description: "Calcule seu Índice de Massa Corporal e acompanhe sua evolução",
      link: "/tools/imc",
    },
    {
      icon: Apple,
      title: "Diário Alimentar",
      description: "Registre suas refeições e monitore sua nutrição diária",
      link: "/tools/food-diary",
    },
    {
      icon: Dumbbell,
      title: "Planos de Treino",
      description: "Crie e acompanhe treinos personalizados para seus objetivos",
      link: "/tools/workout-plans",
    },
    {
      icon: TrendingUp,
      title: "Análise de Progresso",
      description: "Acompanhe sua evolução com relatórios detalhados e gráficos",
      link: "/dashboard",
    },
    {
      icon: ShoppingBag,
      title: "Loja Premium",
      description: "Encontre produtos selecionados para sua saúde e bem-estar",
      link: "/store",
    },
  ];

  const tools = [
    { name: "IMC", icon: Calculator, link: "/tools/imc" },
    { name: "Calorias", icon: Zap, link: "/tools/calorie-calculator" },
    { name: "Hidratação", icon: Droplets, link: "/tools/hydration-calculator" },
    { name: "Sono", icon: Moon, link: "/tools/sleep-calculator" },
    { name: "Metabolismo", icon: Activity, link: "/tools/metabolism-calculator" },
    { name: "Idade Biológica", icon: Clock, link: "/tools/biological-age-calculator" },
  ];

  const stats = [
    { value: "10K+", label: "Usuários Ativos", icon: Users },
    { value: "95%", label: "Taxa de Sucesso", icon: Target },
    { value: "99%", label: "Satisfação", icon: Star },
    { value: "24/7", label: "Suporte", icon: Heart },
  ];

  const testimonials = [
    {
      name: "Maria Silva",
      role: "Usuária Premium",
      content: "Transformei minha saúde completamente! A plataforma é incrível e as ferramentas me ajudam todos os dias.",
      rating: 5,
    },
    {
      name: "João Santos",
      role: "Atleta",
      content: "Os planos de treino personalizados fizeram toda a diferença. Recomendo para todos!",
      rating: 5,
    },
    {
      name: "Ana Costa",
      role: "Nutricionista",
      content: "Uso com meus pacientes e os resultados são excelentes. Interface intuitiva e funcionalidades completas.",
      rating: 5,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section - Alinhada com tema do portal */}
      <section className="relative overflow-hidden bg-background">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-[0.02] dark:opacity-[0.05]">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, hsl(var(--foreground)) 1px, transparent 0)`,
            backgroundSize: '40px 40px'
          }} />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 sm:pt-32 md:pt-40 pb-20 sm:pb-24 md:pb-32">
          <div className="text-center max-w-4xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center gap-2.5 px-5 py-2.5 bg-muted/80 backdrop-blur-sm rounded-full mb-8 border border-border/30">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-foreground">
                Plataforma Completa de Saúde e Bem-Estar
              </span>
            </div>

            {/* Main Headline */}
            <H1 className="mb-8 leading-tight">
              Transforme sua{" "}
              <span className="text-primary">
                Saúde
              </span>
              <br />
              com Tecnologia
            </H1>

            <p className="text-lg sm:text-xl md:text-2xl text-muted-foreground/90 mb-10 sm:mb-12 max-w-2xl mx-auto leading-relaxed">
              A plataforma mais completa para monitorar sua saúde, gerenciar nutrição, 
              criar treinos personalizados e encontrar produtos de qualidade.
            </p>

            {/* CTA Buttons - Centralizados */}
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-5 justify-center items-center mb-12 sm:mb-16">
              <Link
                to="/register"
                className="group inline-flex items-center justify-center px-6 sm:px-8 py-3 sm:py-4 text-sm sm:text-base font-semibold rounded-xl text-primary-foreground bg-primary hover:bg-primary/90 transition-all shadow-lg hover:shadow-xl hover:scale-105 w-full sm:w-auto"
              >
                Começar Gratuitamente
                <ArrowRight className="ml-2 w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                to="/tools"
                className="inline-flex items-center justify-center px-6 sm:px-8 py-3 sm:py-4 text-sm sm:text-base font-semibold rounded-xl text-foreground bg-card border-2 border-border hover:border-primary transition-all shadow-lg hover:shadow-xl w-full sm:w-auto"
              >
                Explorar Ferramentas
              </Link>
            </div>

            {/* Trust Badges - Centralizados */}
            <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs sm:text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                <span>100% Seguro</span>
              </div>
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                <span>Certificado LGPD</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                <span>Suporte 24/7</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 sm:py-20 bg-muted/30 border-y border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 sm:gap-10">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div key={index} className="text-center">
                  <div className="inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary/10 mb-3">
                    <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                  </div>
                  <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-1">
                    {stat.value}
                  </div>
                  <div className="text-xs sm:text-sm text-muted-foreground">
                    {stat.label}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Featured Products Section - TERCEIRA SEÇÃO */}
      <section className="py-16 sm:py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 sm:mb-12">
            <H2 className="mb-3 sm:mb-4">
              Produtos em Destaque
            </H2>
            <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
              Produtos selecionados especialmente para você
            </p>
          </div>

          {loadingProducts ? (
            <div className="flex items-center justify-center py-12">
              <div className="inline-flex items-center gap-3">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <span className="text-muted-foreground">Carregando produtos...</span>
              </div>
            </div>
          ) : featuredProducts.length > 0 ? (
            <Suspense
              fallback={
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              }
            >
              <ProductCarousel
                products={featuredProducts}
                title=""
              />
            </Suspense>
          ) : (
            <div className="text-center py-16 px-4">
              <div className="max-w-md mx-auto">
                <div className="relative mb-6">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-primary/10 animate-pulse"></div>
                  </div>
                  <ShoppingBag className="w-16 h-16 sm:w-20 sm:h-20 text-primary mx-auto relative z-10" />
                </div>
                <H3 className="mb-3 text-foreground">
                  Explore Nossa Loja
                </H3>
                <p className="text-sm sm:text-base text-muted-foreground mb-8 leading-relaxed">
                  Descubra nossa seleção completa de produtos de saúde, suplementos e bem-estar na loja.
                </p>
                <Link
                  to="/store"
                  className="inline-flex items-center gap-2 px-6 py-3 text-sm sm:text-base font-medium rounded-lg text-primary-foreground bg-primary hover:bg-primary/90 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
                >
                  Explorar Loja
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Features Section - Alinhada com tema */}
      <section className="py-16 sm:py-20 md:py-24 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <H2 className="mb-3 sm:mb-4">
              Tudo que você precisa em um só lugar
            </H2>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
              Ferramentas poderosas e inteligentes para cuidar da sua saúde de forma completa
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Link
                  key={index}
                  to={feature.link}
                  className="group relative overflow-hidden bg-card rounded-xl sm:rounded-2xl p-5 sm:p-6 border border-border hover:border-primary transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
                >
                  {/* Background on Hover */}
                  <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  
                  <div className="relative inline-flex p-3 sm:p-4 rounded-xl bg-primary/10 group-hover:bg-primary/20 mb-4 group-hover:scale-110 transition-transform">
                    <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                  </div>
                  
                  <h3 className="text-lg sm:text-xl font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
                    {feature.title}
                  </h3>
                  
                  <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-4">
                    {feature.description}
                  </p>
                  
                  <div className="flex items-center text-primary font-medium group-hover:translate-x-2 transition-transform">
                    <span className="text-xs sm:text-sm">Saber mais</span>
                    <ArrowRight className="ml-2 w-3 h-3 sm:w-4 sm:h-4" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Quick Tools Section - Alinhada com tema */}
      <section className="py-12 sm:py-16 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 sm:mb-12">
            <H2 className="mb-3 sm:mb-4">
              Calculadoras Rápidas
            </H2>
            <p className="text-base sm:text-lg text-muted-foreground">
              Acesse nossas ferramentas de cálculo instantâneo
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 sm:gap-4 max-w-4xl mx-auto">
            {tools.map((tool, index) => {
              const Icon = tool.icon;
              return (
                <Link
                  key={index}
                  to={tool.link}
                  className="group flex flex-col items-center justify-center p-4 sm:p-6 bg-card rounded-lg sm:rounded-xl border border-border hover:border-primary hover:shadow-lg transition-all"
                >
                  <Icon className="w-6 h-6 sm:w-8 sm:h-8 text-primary mb-2 sm:mb-3 group-hover:scale-110 transition-transform" />
                  <span className="text-xs sm:text-sm font-medium text-foreground text-center">
                    {tool.name}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Testimonials Section - Alinhada com tema */}
      <section className="py-16 sm:py-20 bg-muted">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 sm:mb-12">
            <H2 className="mb-3 sm:mb-4">
              O que nossos usuários dizem
            </H2>
            <p className="text-base sm:text-xl text-muted-foreground">
              Milhares de pessoas já transformaram sua saúde conosco
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className="bg-card rounded-xl sm:rounded-2xl p-5 sm:p-6 border border-border hover:border-primary hover:shadow-lg transition-all"
              >
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 sm:w-5 sm:h-5 fill-primary text-primary" />
                  ))}
                </div>
                <p className="text-card-foreground mb-4 leading-relaxed">
                  "{testimonial.content}"
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                    <Users className="w-5 h-5 text-card-foreground" />
                  </div>
                  <div>
                    <div className="text-sm sm:text-base font-semibold text-foreground">{testimonial.name}</div>
                    <div className="text-sm text-card-foreground/80">{testimonial.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section - Alinhada com tema */}
      <section className="py-16 sm:py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <H2 className="mb-3 sm:mb-4">
              Como Funciona
            </H2>
            <p className="text-base sm:text-lg text-muted-foreground">
              Em 3 passos simples você começa sua jornada
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 max-w-5xl mx-auto">
            {[
              {
                step: "01",
                title: "Crie sua Conta",
                description: "Cadastre-se gratuitamente em poucos segundos",
                icon: User,
              },
              {
                step: "02",
                title: "Configure seu Perfil",
                description: "Informe seus dados de saúde e objetivos",
                icon: Target,
              },
              {
                step: "03",
                title: "Comece a Usar",
                description: "Acesse ferramentas, IA e produtos personalizados",
                icon: Zap,
              },
            ].map((item, index) => {
              const Icon = item.icon;
              return (
                <div key={index} className="relative text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-primary text-primary-foreground text-lg sm:text-2xl font-bold mb-3 sm:mb-4">
                    {item.step}
                  </div>
                  <div className="inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-primary/10 mb-3 sm:mb-4">
                    <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-foreground mb-2">
                    {item.title}
                  </h3>
                  <p className="text-sm sm:text-base text-muted-foreground">
                    {item.description}
                  </p>
                  {index < 2 && (
                    <div className="hidden md:block absolute top-6 left-full w-full h-0.5 bg-border transform translate-x-4" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Final CTA Section - Alinhada com tema */}
      <section className="py-16 sm:py-20 bg-primary">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <Sparkles className="w-12 h-12 sm:w-16 sm:h-16 text-primary-foreground mx-auto mb-4 sm:mb-6" />
          <H2 className="mb-4 sm:mb-6 text-primary-foreground">
            Pronto para transformar sua saúde?
          </H2>
          <p className="text-base sm:text-lg md:text-xl text-primary-foreground/90 mb-6 sm:mb-8 max-w-2xl mx-auto">
            Junte-se a milhares de pessoas que já transformaram sua saúde e bem-estar com a RE-EDUCA.
            Comece gratuitamente hoje mesmo!
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
            <Link
              to="/register"
              className="group inline-flex items-center justify-center px-6 sm:px-8 py-3 sm:py-4 text-sm sm:text-base md:text-lg font-semibold rounded-xl text-primary bg-primary-foreground hover:bg-primary-foreground/90 transition-all shadow-xl hover:shadow-2xl hover:scale-105"
            >
              Criar Conta Gratuita
              <ArrowRight className="ml-2 w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              to="/tools"
              className="inline-flex items-center justify-center px-6 sm:px-8 py-3 sm:py-4 text-sm sm:text-base md:text-lg font-semibold rounded-xl text-primary-foreground border-2 border-primary-foreground hover:bg-primary-foreground/10 transition-all"
            >
              Explorar Ferramentas
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
