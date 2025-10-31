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
    const colorMap = {
      blue: "bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400",
      green:
        "bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400",
      purple:
        "bg-purple-100 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400",
      orange:
        "bg-orange-100 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400",
      red: "bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400",
      yellow:
        "bg-yellow-100 text-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-400",
      indigo:
        "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400",
      cyan: "bg-cyan-100 text-cyan-600 dark:bg-cyan-900/20 dark:text-cyan-400",
      slate:
        "bg-slate-100 text-slate-600 dark:bg-slate-900/20 dark:text-slate-400",
      pink: "bg-pink-100 text-pink-600 dark:bg-pink-900/20 dark:text-pink-400",
      emerald:
        "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400",
    };
    return (
      colorMap[color] ||
      "bg-gray-100 text-gray-600 dark:bg-gray-900/20 dark:text-gray-400"
    );
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <Calculator className="w-8 h-8 text-blue-600" />
            Ferramentas de Saúde
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Acesse todas as ferramentas para cuidar da sua saúde e bem-estar
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
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
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name} ({category.count})
                  </option>
                ))}
              </select>
              <Button variant="outline" size="sm">
                <Filter className="w-4 h-4 mr-2" />
                Filtros
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Popular Tools */}
      {selectedCategory === "all" && searchTerm === "" && (
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-500" />
            Ferramentas Populares
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {popularTools.map((tool) => (
              <Link key={tool.id} to={tool.href}>
                <Card className="hover:shadow-lg transition-all duration-300 transform hover:scale-105 cursor-pointer">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-3 rounded-lg ${getColorClasses(tool.color)}`}
                      >
                        <tool.icon className="w-6 h-6" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{tool.name}</CardTitle>
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-yellow-500 fill-current" />
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            Popular
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-sm">
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
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-blue-500" />
          {selectedCategory === "all"
            ? "Todas as Ferramentas"
            : categories.find((c) => c.id === selectedCategory)?.name +
              " - Ferramentas"}
        </h2>

        {filteredTools.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Calculator className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Nenhuma ferramenta encontrada
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Tente ajustar os filtros de busca
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                            <Star className="w-4 h-4 text-yellow-500 fill-current" />
                            <span className="text-sm text-gray-600 dark:text-gray-400">
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
