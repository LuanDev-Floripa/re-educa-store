import React, { useState } from "react";
/**
 * ToolsPage
 * - Lista e filtra ferramentas com estados vazios
 */
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/Ui/card";
import { Button } from "@/components/Ui/button";
import { Input } from "@/components/Ui/input";
import {
  Calculator,
  Activity,
  Dumbbell,
  Target,
  Calendar,
  Zap,
  Brain,
  Droplets,
  Moon,
  Heart,
  Clock,
  Search,
  Filter,
  Star,
  TrendingUp,
} from "lucide-react";
import { Link } from "react-router-dom";

const ToolsPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const tools = [
    // Health Tools
    {
      id: "imc",
      name: "Calculadora IMC",
      description:
        "Calcule seu índice de massa corporal e descubra se está no peso ideal",
      icon: Calculator,
      category: "health",
      href: "/tools/imc",
      popular: true,
      color: "blue",
    },
    {
      id: "food-diary",
      name: "Diário Alimentar",
      description: "Registre suas refeições e acompanhe sua alimentação diária",
      icon: Calendar,
      category: "health",
      href: "/tools/food-diary",
      popular: true,
      color: "green",
    },
    {
      id: "exercises",
      name: "Exercícios",
      description:
        "Biblioteca completa de exercícios com instruções detalhadas",
      icon: Activity,
      category: "fitness",
      href: "/tools/exercises",
      popular: true,
      color: "purple",
    },
    {
      id: "workout-plans",
      name: "Planos de Treino",
      description: "Planos de treino personalizados para seus objetivos",
      icon: Dumbbell,
      category: "fitness",
      href: "/tools/workout-plans",
      popular: false,
      color: "orange",
    },
    {
      id: "workout-sessions",
      name: "Sessões de Treino",
      description: "Acompanhe suas sessões de treino e progresso",
      icon: Target,
      category: "fitness",
      href: "/tools/workout-sessions",
      popular: false,
      color: "red",
    },

    // Calculators
    {
      id: "calorie-calculator",
      name: "Calculadora de Calorias",
      description: "Calcule suas necessidades calóricas diárias",
      icon: Zap,
      category: "calculators",
      href: "/tools/calorie-calculator",
      popular: true,
      color: "yellow",
    },
    {
      id: "metabolism-calculator",
      name: "Calculadora de Metabolismo",
      description: "Analise seu metabolismo basal e taxa metabólica",
      icon: Brain,
      category: "calculators",
      href: "/tools/metabolism-calculator",
      popular: false,
      color: "indigo",
    },
    {
      id: "hydration-calculator",
      name: "Calculadora de Hidratação",
      description: "Descubra quanta água você precisa beber por dia",
      icon: Droplets,
      category: "calculators",
      href: "/tools/hydration-calculator",
      popular: false,
      color: "cyan",
    },
    {
      id: "sleep-calculator",
      name: "Calculadora de Sono",
      description: "Analise sua qualidade de sono e ciclos",
      icon: Moon,
      category: "calculators",
      href: "/tools/sleep-calculator",
      popular: false,
      color: "slate",
    },
    {
      id: "stress-calculator",
      name: "Calculadora de Estresse",
      description: "Avalie seu nível de estresse e bem-estar",
      icon: Heart,
      category: "calculators",
      href: "/tools/stress-calculator",
      popular: false,
      color: "pink",
    },
    {
      id: "biological-age-calculator",
      name: "Idade Biológica",
      description: "Descubra sua idade biológica real",
      icon: Clock,
      category: "calculators",
      href: "/tools/biological-age-calculator",
      popular: false,
      color: "emerald",
    },
  ];

  const categories = [
    { id: "all", name: "Todas", count: tools.length },
    {
      id: "health",
      name: "Saúde",
      count: tools.filter((t) => t.category === "health").length,
    },
    {
      id: "fitness",
      name: "Fitness",
      count: tools.filter((t) => t.category === "fitness").length,
    },
    {
      id: "calculators",
      name: "Calculadoras",
      count: tools.filter((t) => t.category === "calculators").length,
    },
  ];

  const filteredTools = (Array.isArray(tools) ? tools : []).filter((tool) => {
    const matchesSearch =
      String(tool?.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(tool?.description || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === "all" || tool?.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const popularTools = (Array.isArray(tools) ? tools : []).filter((tool) => tool?.popular);

  const getColorClasses = (color) => {
    // Simplificado para usar apenas cores do tema
    return "bg-primary/10 text-primary";
  };

  return (
    <div className="max-w-7xl mx-auto space-y-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-2.5 sm:gap-3 mb-3">
            <Calculator className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
            Ferramentas de Saúde
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground/90 leading-relaxed">
            Acesse todas as ferramentas para cuidar da sua saúde e bem-estar
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-8">
          <div className="flex flex-col sm:flex-row gap-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Buscar ferramentas..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
              >
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name} ({category.count})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Popular Tools */}
      {selectedCategory === "all" && searchTerm === "" && (
        <div>
          <h2 className="text-lg sm:text-xl font-semibold text-foreground mb-6 flex items-center gap-2.5">
            <Star className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
            Ferramentas Populares
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {popularTools.map((tool) => (
              <Link key={tool.id} to={tool.href}>
                <Card className="hover:shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1),0_2px_4px_-1px_rgba(0,0,0,0.06)] transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] transform hover:scale-[1.02] cursor-pointer">
                  <CardHeader>
                    <div className="flex items-center gap-4">
                      <div
                        className={`p-4 rounded-lg ${getColorClasses(tool.color)}`}
                      >
                        <tool.icon className="w-6 h-6" />
                      </div>
                      <div>
                        <CardTitle className="text-lg mb-1">{tool.name}</CardTitle>
                        <div className="flex items-center gap-1.5">
                          <Star className="w-4 h-4 text-primary fill-current" />
                          <span className="text-sm text-muted-foreground/90">
                            Popular
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-sm leading-relaxed">
                      {tool.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* All Tools */}
      <div>
        <h2 className="text-xl font-semibold text-foreground mb-6 flex items-center gap-2.5">
          <TrendingUp className="w-5 h-5 text-primary" />
          {selectedCategory === "all"
            ? "Todas as Ferramentas"
            : categories.find((c) => c.id === selectedCategory)?.name +
              " - Ferramentas"}
        </h2>

        {filteredTools.length === 0 ? (
          <Card>
            <CardContent className="p-16 text-center space-y-4">
              <Calculator className="w-16 h-16 text-muted-foreground/60 mx-auto" />
              <h3 className="text-lg font-semibold text-foreground">
                Nenhuma ferramenta encontrada
              </h3>
              <p className="text-muted-foreground/90 leading-relaxed">
                Tente ajustar os filtros de busca
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {filteredTools.map((tool) => (
              <Link key={tool.id} to={tool.href}>
                <Card className="hover:shadow-lg transition-all duration-300 transform hover:scale-105 cursor-pointer h-full">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-3 rounded-lg ${getColorClasses(tool.color)}`}
                      >
                        <tool.icon className="w-6 h-6" />
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-lg">{tool.name}</CardTitle>
                        {tool.popular && (
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-primary fill-current" />
                            <span className="text-sm text-muted-foreground">
                              Popular
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-sm">
                      {tool.description}
                    </CardDescription>
                    <div className="mt-4">
                      <Button variant="outline" size="sm" className="w-full">
                        Acessar Ferramenta
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ToolsPage;
