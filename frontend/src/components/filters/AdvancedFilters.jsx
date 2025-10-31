/**
 * AdvancedFilters Component - RE-EDUCA Store
 * 
 * Componente de filtros avançados para produtos, exercícios e planos de treino.
 * 
 * Funcionalidades:
 * - Filtros múltiplos (preço, categoria, rating, etc.)
 * - Sliders para faixas de valores
 * - Filtros por tags
 * - Reset de filtros
 * - Suporte a diferentes tipos (products, exercises, workout_plans)
 * 
 * @component
 * @param {Object} props - Props do componente
 * @param {Function} props.onFiltersChange - Callback quando filtros mudam
 * @param {Object} [props.initialFilters={}] - Filtros iniciais
 * @param {string} [props.filterType="products"] - Tipo de filtro (products/exercises/workout_plans)
 * @returns {JSX.Element} Interface de filtros avançados
 */
import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/Ui/card";
import { Button } from "@/components/Ui/button";
import { Input } from "@/components/Ui/input";
import { Label } from "@/components/Ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/Ui/select";
import { Checkbox } from "@/components/Ui/checkbox";
import { Slider } from "@/components/Ui/slider";
import { Badge } from "@/components/Ui/badge";
import {
  Filter,
  X,
  Search,
  DollarSign,
  Star,
  Package,
  Tag,
  Calendar,
  TrendingUp,
  Award,
  Truck,
  Shield,
  Zap,
  Heart,
  Target,
  Activity,
  Clock,
  Users,
} from "lucide-react";

export const AdvancedFilters = ({
  onFiltersChange,
  initialFilters = {},
  filterType = "products", // 'products', 'exercises', 'workout_plans'
}) => {
  const [filters, setFilters] = useState({
    // Filtros gerais
    search: "",
    category: "",
    subcategory: "",
    tags: [],

    // Filtros de preço (para produtos)
    priceRange: [0, 1000],
    hasDiscount: false,

    // Filtros de rating
    minRating: 0,

    // Filtros de disponibilidade
    inStock: false,
    lowStock: false,

    // Filtros de data
    dateRange: "all", // 'all', 'today', 'week', 'month', 'year'

    // Filtros específicos para produtos
    brand: "",
    weight: "",
    flavor: "",
    ingredients: [],

    // Filtros específicos para exercícios
    difficulty: "",
    muscleGroups: [],
    equipment: [],
    duration: [0, 120], // em minutos

    // Filtros específicos para planos de treino
    workoutDuration: [0, 90], // em minutos
    workoutsPerWeek: [0, 7],
    goals: [],

    // Filtros de popularidade
    sortBy: "relevance",
    sortOrder: "desc",

    ...initialFilters,
  });

  const [showFilters, setShowFilters] = useState(false);

  const productCategories = [
    "Suplementos",
    "Equipamentos",
    "Roupas",
    "Acessórios",
    "Livros",
    "Cursos",
  ];

  const supplementSubcategories = [
    "Proteínas",
    "Creatina",
    "Vitaminas",
    "Ômega 3",
    "Pré-treino",
    "Pós-treino",
    "Termogênicos",
    "Multivitamínicos",
  ];

  const brands = [
    "MuscleTech",
    "Optimum Nutrition",
    "Dymatize",
    "BSN",
    "Cellucor",
    "Universal Nutrition",
    "GNC",
    "Centrum",
  ];

  const flavors = [
    "Chocolate",
    "Baunilha",
    "Morango",
    "Cookies & Cream",
    "Caramelo",
    "Café",
    "Frutas Tropicais",
    "Sem Sabor",
  ];

  const difficulties = [
    { value: "beginner", label: "Iniciante" },
    { value: "intermediate", label: "Intermediário" },
    { value: "advanced", label: "Avançado" },
  ];

  const muscleGroups = [
    "Peito",
    "Costas",
    "Ombros",
    "Bíceps",
    "Tríceps",
    "Quadríceps",
    "Isquiotibiais",
    "Glúteos",
    "Panturrilhas",
    "Core",
    "Antebraços",
    "Trapézio",
  ];

  const equipment = [
    "Nenhum",
    "Halteres",
    "Barra",
    "Máquinas",
    "Cabo",
    "Kettlebell",
    "TRX",
    "Elásticos",
    "Bola Suíça",
    "Step",
  ];

  const workoutGoals = [
    "Perda de Peso",
    "Ganho de Massa",
    "Força",
    "Resistência",
    "Definição",
    "Condicionamento",
    "Flexibilidade",
    "Reabilitação",
  ];

  const ingredients = [
    "Whey Protein",
    "Caseína",
    "Creatina Monohidratada",
    "BCAA",
    "Glutamina",
    "Beta-Alanina",
    "Cafeína",
    "L-Carnitina",
    "Ômega 3",
    "Vitamina D",
    "Magnésio",
    "Zinco",
  ];

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleArrayFilterChange = (key, value, checked) => {
    const currentArray = filters[key] || [];
    const newArray = checked
      ? [...currentArray, value]
      : currentArray.filter((item) => item !== value);

    handleFilterChange(key, newArray);
  };

  const handleRangeFilterChange = (key, value) => {
    handleFilterChange(key, value);
  };

  const clearFilters = () => {
    const clearedFilters = {
      search: "",
      category: "",
      subcategory: "",
      tags: [],
      priceRange: [0, 1000],
      hasDiscount: false,
      minRating: 0,
      inStock: false,
      lowStock: false,
      dateRange: "all",
      brand: "",
      weight: "",
      flavor: "",
      ingredients: [],
      difficulty: "",
      muscleGroups: [],
      equipment: [],
      duration: [0, 120],
      workoutDuration: [0, 90],
      workoutsPerWeek: [0, 7],
      goals: [],
      sortBy: "relevance",
      sortOrder: "desc",
    };

    setFilters(clearedFilters);
    onFiltersChange(clearedFilters);
  };

  const getActiveFiltersCount = () => {
    let count = 0;

    if (filters.search) count++;
    if (filters.category) count++;
    if (filters.subcategory) count++;
    if (filters.tags.length > 0) count++;
    if (filters.priceRange[0] > 0 || filters.priceRange[1] < 1000) count++;
    if (filters.hasDiscount) count++;
    if (filters.minRating > 0) count++;
    if (filters.inStock) count++;
    if (filters.lowStock) count++;
    if (filters.dateRange !== "all") count++;
    if (filters.brand) count++;
    if (filters.flavor) count++;
    if (filters.ingredients.length > 0) count++;
    if (filters.difficulty) count++;
    if (filters.muscleGroups.length > 0) count++;
    if (filters.equipment.length > 0) count++;
    if (filters.duration[0] > 0 || filters.duration[1] < 120) count++;
    if (filters.workoutDuration[0] > 0 || filters.workoutDuration[1] < 90)
      count++;
    if (filters.workoutsPerWeek[0] > 0 || filters.workoutsPerWeek[1] < 7)
      count++;
    if (filters.goals.length > 0) count++;

    return count;
  };

  const renderProductFilters = () => (
    <>
      {/* Categoria e Subcategoria */}
      <div className="space-y-4">
        <div>
          <Label>Categoria</Label>
          <Select
            value={filters.category}
            onValueChange={(value) => handleFilterChange("category", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione uma categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todas as categorias</SelectItem>
              {productCategories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {filters.category === "Suplementos" && (
          <div>
            <Label>Subcategoria</Label>
            <Select
              value={filters.subcategory}
              onValueChange={(value) =>
                handleFilterChange("subcategory", value)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma subcategoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todas as subcategorias</SelectItem>
                {supplementSubcategories.map((subcategory) => (
                  <SelectItem key={subcategory} value={subcategory}>
                    {subcategory}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Preço */}
      <div className="space-y-4">
        <div>
          <Label>
            Faixa de Preço: R$ {filters.priceRange[0]} - R${" "}
            {filters.priceRange[1]}
          </Label>
          <Slider
            value={filters.priceRange}
            onValueChange={(value) =>
              handleRangeFilterChange("priceRange", value)
            }
            max={1000}
            min={0}
            step={10}
            className="mt-2"
          />
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="hasDiscount"
            checked={filters.hasDiscount}
            onCheckedChange={(checked) =>
              handleFilterChange("hasDiscount", checked)
            }
          />
          <Label htmlFor="hasDiscount">Apenas produtos em promoção</Label>
        </div>
      </div>

      {/* Marca e Sabor */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label>Marca</Label>
          <Select
            value={filters.brand}
            onValueChange={(value) => handleFilterChange("brand", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Todas as marcas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todas as marcas</SelectItem>
              {brands.map((brand) => (
                <SelectItem key={brand} value={brand}>
                  {brand}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Sabor</Label>
          <Select
            value={filters.flavor}
            onValueChange={(value) => handleFilterChange("flavor", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Todos os sabores" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todos os sabores</SelectItem>
              {flavors.map((flavor) => (
                <SelectItem key={flavor} value={flavor}>
                  {flavor}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Ingredientes */}
      <div>
        <Label>Ingredientes</Label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
          {ingredients.map((ingredient) => (
            <div key={ingredient} className="flex items-center space-x-2">
              <Checkbox
                id={`ingredient-${ingredient}`}
                checked={filters.ingredients.includes(ingredient)}
                onCheckedChange={(checked) =>
                  handleArrayFilterChange("ingredients", ingredient, checked)
                }
              />
              <Label htmlFor={`ingredient-${ingredient}`} className="text-sm">
                {ingredient}
              </Label>
            </div>
          ))}
        </div>
      </div>
    </>
  );

  const renderExerciseFilters = () => (
    <>
      {/* Dificuldade */}
      <div>
        <Label>Dificuldade</Label>
        <Select
          value={filters.difficulty}
          onValueChange={(value) => handleFilterChange("difficulty", value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Todas as dificuldades" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Todas as dificuldades</SelectItem>
            {difficulties.map((difficulty) => (
              <SelectItem key={difficulty.value} value={difficulty.value}>
                {difficulty.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Duração */}
      <div>
        <Label>
          Duração: {filters.duration[0]} - {filters.duration[1]} minutos
        </Label>
        <Slider
          value={filters.duration}
          onValueChange={(value) => handleRangeFilterChange("duration", value)}
          max={120}
          min={0}
          step={5}
          className="mt-2"
        />
      </div>

      {/* Grupos Musculares */}
      <div>
        <Label>Grupos Musculares</Label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
          {muscleGroups.map((muscle) => (
            <div key={muscle} className="flex items-center space-x-2">
              <Checkbox
                id={`muscle-${muscle}`}
                checked={filters.muscleGroups.includes(muscle)}
                onCheckedChange={(checked) =>
                  handleArrayFilterChange("muscleGroups", muscle, checked)
                }
              />
              <Label htmlFor={`muscle-${muscle}`} className="text-sm">
                {muscle}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {/* Equipamentos */}
      <div>
        <Label>Equipamentos</Label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
          {equipment.map((eq) => (
            <div key={eq} className="flex items-center space-x-2">
              <Checkbox
                id={`equipment-${eq}`}
                checked={filters.equipment.includes(eq)}
                onCheckedChange={(checked) =>
                  handleArrayFilterChange("equipment", eq, checked)
                }
              />
              <Label htmlFor={`equipment-${eq}`} className="text-sm">
                {eq}
              </Label>
            </div>
          ))}
        </div>
      </div>
    </>
  );

  const renderWorkoutPlanFilters = () => (
    <>
      {/* Duração do Treino */}
      <div>
        <Label>
          Duração do Treino: {filters.workoutDuration[0]} -{" "}
          {filters.workoutDuration[1]} minutos
        </Label>
        <Slider
          value={filters.workoutDuration}
          onValueChange={(value) =>
            handleRangeFilterChange("workoutDuration", value)
          }
          max={90}
          min={0}
          step={5}
          className="mt-2"
        />
      </div>

      {/* Treinos por Semana */}
      <div>
        <Label>
          Treinos por Semana: {filters.workoutsPerWeek[0]} -{" "}
          {filters.workoutsPerWeek[1]}
        </Label>
        <Slider
          value={filters.workoutsPerWeek}
          onValueChange={(value) =>
            handleRangeFilterChange("workoutsPerWeek", value)
          }
          max={7}
          min={0}
          step={1}
          className="mt-2"
        />
      </div>

      {/* Objetivos */}
      <div>
        <Label>Objetivos</Label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
          {workoutGoals.map((goal) => (
            <div key={goal} className="flex items-center space-x-2">
              <Checkbox
                id={`goal-${goal}`}
                checked={filters.goals.includes(goal)}
                onCheckedChange={(checked) =>
                  handleArrayFilterChange("goals", goal, checked)
                }
              />
              <Label htmlFor={`goal-${goal}`} className="text-sm">
                {goal}
              </Label>
            </div>
          ))}
        </div>
      </div>
    </>
  );

  const activeFiltersCount = getActiveFiltersCount();

  return (
    <div className="space-y-4">
      {/* Botão de Filtros */}
      <Button
        variant="outline"
        onClick={() => setShowFilters(!showFilters)}
        className="w-full justify-between"
      >
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4" />
          <span>Filtros Avançados</span>
          {activeFiltersCount > 0 && (
            <Badge variant="secondary" className="ml-2">
              {activeFiltersCount}
            </Badge>
          )}
        </div>
        {showFilters ? (
          <X className="w-4 h-4" />
        ) : (
          <Filter className="w-4 h-4" />
        )}
      </Button>

      {/* Painel de Filtros */}
      {showFilters && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Filtros Avançados</CardTitle>
                <CardDescription>
                  Refine sua busca com filtros específicos
                </CardDescription>
              </div>
              {activeFiltersCount > 0 && (
                <Button variant="outline" size="sm" onClick={clearFilters}>
                  <X className="w-4 h-4 mr-2" />
                  Limpar Filtros
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Busca */}
            <div>
              <Label htmlFor="search">Buscar</Label>
              <div className="relative mt-2">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  id="search"
                  placeholder="Digite para buscar..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange("search", e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Filtros Gerais */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="inStock"
                  checked={filters.inStock}
                  onCheckedChange={(checked) =>
                    handleFilterChange("inStock", checked)
                  }
                />
                <Label htmlFor="inStock">Apenas em estoque</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="lowStock"
                  checked={filters.lowStock}
                  onCheckedChange={(checked) =>
                    handleFilterChange("lowStock", checked)
                  }
                />
                <Label htmlFor="lowStock">Estoque baixo</Label>
              </div>
            </div>

            {/* Rating Mínimo */}
            <div>
              <Label>Avaliação Mínima: {filters.minRating} estrelas</Label>
              <Slider
                value={[filters.minRating]}
                onValueChange={(value) =>
                  handleFilterChange("minRating", value[0])
                }
                max={5}
                min={0}
                step={0.5}
                className="mt-2"
              />
            </div>

            {/* Filtros Específicos por Tipo */}
            {filterType === "products" && renderProductFilters()}
            {filterType === "exercises" && renderExerciseFilters()}
            {filterType === "workout_plans" && renderWorkoutPlanFilters()}

            {/* Ordenação */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Ordenar por</Label>
                <Select
                  value={filters.sortBy}
                  onValueChange={(value) => handleFilterChange("sortBy", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="relevance">Relevância</SelectItem>
                    <SelectItem value="name">Nome</SelectItem>
                    <SelectItem value="price">Preço</SelectItem>
                    <SelectItem value="rating">Avaliação</SelectItem>
                    <SelectItem value="popularity">Popularidade</SelectItem>
                    <SelectItem value="newest">Mais recentes</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Ordem</Label>
                <Select
                  value={filters.sortOrder}
                  onValueChange={(value) =>
                    handleFilterChange("sortOrder", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="asc">Crescente</SelectItem>
                    <SelectItem value="desc">Decrescente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filtros Ativos */}
      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap gap-2">
          {filters.search && (
            <Badge variant="secondary" className="flex items-center space-x-1">
              <Search className="w-3 h-3" />
              <span>"{filters.search}"</span>
              <button
                onClick={() => handleFilterChange("search", "")}
                className="ml-1 hover:text-red-600"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          )}

          {filters.category && (
            <Badge variant="secondary" className="flex items-center space-x-1">
              <Package className="w-3 h-3" />
              <span>{filters.category}</span>
              <button
                onClick={() => handleFilterChange("category", "")}
                className="ml-1 hover:text-red-600"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          )}

          {filters.difficulty && (
            <Badge variant="secondary" className="flex items-center space-x-1">
              <Target className="w-3 h-3" />
              <span>
                {
                  difficulties.find((d) => d.value === filters.difficulty)
                    ?.label
                }
              </span>
              <button
                onClick={() => handleFilterChange("difficulty", "")}
                className="ml-1 hover:text-red-600"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          )}

          {filters.muscleGroups.map((muscle) => (
            <Badge
              key={muscle}
              variant="secondary"
              className="flex items-center space-x-1"
            >
              <Activity className="w-3 h-3" />
              <span>{muscle}</span>
              <button
                onClick={() =>
                  handleArrayFilterChange("muscleGroups", muscle, false)
                }
                className="ml-1 hover:text-red-600"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}

          {filters.equipment.map((eq) => (
            <Badge
              key={eq}
              variant="secondary"
              className="flex items-center space-x-1"
            >
              <Package className="w-3 h-3" />
              <span>{eq}</span>
              <button
                onClick={() => handleArrayFilterChange("equipment", eq, false)}
                className="ml-1 hover:text-red-600"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
};
