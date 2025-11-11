import React, { useState, useEffect, useRef, useCallback, useMemo, memo } from "react";
import logger from "@/utils/logger";
import { getAuthToken } from "@/utils/storage";
import apiClient from "@/services/apiClient";
/**
 * Busca inteligente com sugestões locais/API.
 * - Mantém histórico, tendências e ranking por relevância
 * - Fallback local quando não autenticado ou API indisponível
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
import { Badge } from "@/components/Ui/badge";
import {
  Search,
  Clock,
  TrendingUp,
  Star,
  Package,
  Activity,
  Target,
  Calculator,
  Heart,
  X,
  ArrowRight,
  Filter,
  SortAsc,
  SortDesc,
  History,
  Lightbulb,
  Zap,
  Users,
  Award,
  Tag,
} from "lucide-react";

const SmartSearchComponent = ({
  onSearch,
  placeholder = "Buscar produtos, exercícios, planos...",
  showSuggestions = true,
  showRecentSearches = true,
  showTrendingSearches = true,
  searchTypes = ["products", "exercises", "workout_plans", "tools"],
}) => {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [recentSearches, setRecentSearches] = useState([]);
  const [trendingSearches, setTrendingSearches] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState(-1);
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);

  // Dados de exemplo para sugestões
  const suggestionsData = {
    products: [
      {
        id: 1,
        name: "Whey Protein Premium",
        type: "product",
        category: "Suplementos",
        popularity: 95,
      },
      {
        id: 2,
        name: "Creatina Monohidratada",
        type: "product",
        category: "Suplementos",
        popularity: 88,
      },
      {
        id: 3,
        name: "Multivitamínico Completo",
        type: "product",
        category: "Suplementos",
        popularity: 82,
      },
      {
        id: 4,
        name: "BCAA 2:1:1",
        type: "product",
        category: "Suplementos",
        popularity: 75,
      },
      {
        id: 5,
        name: "Óleo de Peixe Ômega 3",
        type: "product",
        category: "Suplementos",
        popularity: 70,
      },
    ],
    exercises: [
      {
        id: 1,
        name: "Flexão de Braço",
        type: "exercise",
        category: "Peito",
        difficulty: "beginner",
        popularity: 90,
      },
      {
        id: 2,
        name: "Agachamento",
        type: "exercise",
        category: "Pernas",
        difficulty: "beginner",
        popularity: 85,
      },
      {
        id: 3,
        name: "Prancha",
        type: "exercise",
        category: "Core",
        difficulty: "beginner",
        popularity: 80,
      },
      {
        id: 4,
        name: "Burpee",
        type: "exercise",
        category: "Cardio",
        difficulty: "intermediate",
        popularity: 75,
      },
      {
        id: 5,
        name: "Mountain Climber",
        type: "exercise",
        category: "Cardio",
        difficulty: "intermediate",
        popularity: 70,
      },
    ],
    workout_plans: [
      {
        id: 1,
        name: "Iniciante Total",
        type: "workout_plan",
        category: "Força",
        duration: 8,
        popularity: 88,
      },
      {
        id: 2,
        name: "Queima Gordura HIIT",
        type: "workout_plan",
        category: "Cardio",
        duration: 6,
        popularity: 85,
      },
      {
        id: 3,
        name: "Ganho de Massa Avançado",
        type: "workout_plan",
        category: "Força",
        duration: 12,
        popularity: 82,
      },
      {
        id: 4,
        name: "Funcional para Iniciantes",
        type: "workout_plan",
        category: "Funcional",
        duration: 6,
        popularity: 78,
      },
      {
        id: 5,
        name: "Resistência Cardio",
        type: "workout_plan",
        category: "Cardio",
        duration: 8,
        popularity: 75,
      },
    ],
    tools: [
      {
        id: 1,
        name: "Calculadora de Calorias",
        type: "tool",
        category: "Nutrição",
        popularity: 90,
      },
      {
        id: 2,
        name: "Calculadora de Metabolismo",
        type: "tool",
        category: "Saúde",
        popularity: 85,
      },
      {
        id: 3,
        name: "Calculadora de Hidratação",
        type: "tool",
        category: "Saúde",
        popularity: 80,
      },
      {
        id: 4,
        name: "Calculadora de Sono",
        type: "tool",
        category: "Saúde",
        popularity: 75,
      },
      {
        id: 5,
        name: "Calculadora de Estresse",
        type: "tool",
        category: "Saúde",
        popularity: 70,
      },
    ],
  };

  // Buscas recentes de exemplo
  const recentSearchesData = useMemo(() => [
    { query: "whey protein", timestamp: Date.now() - 1000 * 60 * 30 },
    { query: "exercícios para peito", timestamp: Date.now() - 1000 * 60 * 60 },
    {
      query: "plano de treino iniciante",
      timestamp: Date.now() - 1000 * 60 * 60 * 2,
    },
    { query: "creatina", timestamp: Date.now() - 1000 * 60 * 60 * 3 },
    {
      query: "calculadora de calorias",
      timestamp: Date.now() - 1000 * 60 * 60 * 4,
    },
  ], []);

  // Buscas em tendência
  const trendingSearchesData = useMemo(() => [
    { query: "whey protein", count: 1250, trend: "up" },
    { query: "exercícios em casa", count: 980, trend: "up" },
    { query: "plano de treino", count: 850, trend: "stable" },
    { query: "calculadora imc", count: 720, trend: "up" },
    { query: "suplementos", count: 650, trend: "down" },
  ], []);

  useEffect(() => {
    setRecentSearches(recentSearchesData);
    setTrendingSearches(trendingSearchesData);
  }, [recentSearchesData, trendingSearchesData]);

  useEffect(() => {
    if (query.length > 1) {
      generateSuggestions(query);
    } else {
      setSuggestions([]);
    }
  }, [query, generateSuggestions]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const generateSuggestions = useCallback(async (searchQuery) => {
    setIsLoading(true);

    try {
      const token = getAuthToken();

      if (!token) {
        // Fallback para sugestões locais se não autenticado
        generateLocalSuggestions(searchQuery);
        return;
      }

      // Buscar sugestões reais da API
      const data = await apiClient.get(
        `/search/suggestions?q=${encodeURIComponent(searchQuery)}&types=${searchTypes.join(",")}`
      );
      setSuggestions(data.suggestions || []);
    } catch (error) {
      logger.error("Erro ao buscar sugestões:", error);
      // Fallback para sugestões locais em caso de erro
      generateLocalSuggestions(searchQuery);
    } finally {
      setIsLoading(false);
    }
  }, [searchTypes, generateLocalSuggestions]);

  const generateLocalSuggestions = useCallback((searchQuery) => {
    const allSuggestions = [];

    (Array.isArray(searchTypes) ? searchTypes : []).forEach((type) => {
      if (suggestionsData[type]) {
        const typeSuggestions = suggestionsData[type]
          .filter(
            (item) =>
              item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
              item.category.toLowerCase().includes(searchQuery.toLowerCase()),
          )
          .map((item) => ({
            ...item,
            relevance: calculateRelevance(item, searchQuery),
          }))
          .sort((a, b) => b.relevance - a.relevance)
          .slice(0, 3);

        allSuggestions.push(...typeSuggestions);
      }
    });

    // Ordenar por relevância
    allSuggestions.sort((a, b) => b.relevance - a.relevance);
    setSuggestions(allSuggestions.slice(0, 8));
  }, [searchTypes, suggestionsData]);

  const calculateRelevance = (item, query) => {
    const queryLower = query.toLowerCase();
    const nameLower = item.name.toLowerCase();
    const categoryLower = item.category.toLowerCase();

    let relevance = 0;

    // Match exato no nome
    if (nameLower === queryLower) relevance += 100;

    // Nome começa com a query
    if (nameLower.startsWith(queryLower)) relevance += 80;

    // Nome contém a query
    if (nameLower.includes(queryLower)) relevance += 60;

    // Categoria contém a query
    if (categoryLower.includes(queryLower)) relevance += 40;

    // Popularidade
    relevance += item.popularity * 0.1;

    return relevance;
  };

  const handleSearch = (searchQuery = query) => {
    if (searchQuery.trim()) {
      // Usar showSuggestions para controlar exibição
      if (showSuggestions) {
        generateSuggestions(searchQuery);
      }

      // Adicionar à busca recente
      const newRecentSearch = {
        query: searchQuery,
        timestamp: Date.now(),
      };

      setRecentSearches((prev) => {
        const filtered = prev.filter((item) => item.query !== searchQuery);
        return [newRecentSearch, ...filtered].slice(0, 10);
      });

      // Executar busca
      if (onSearch) onSearch(searchQuery);
      setShowDropdown(false);
      setQuery(searchQuery);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setQuery(suggestion.name);
    handleSearch(suggestion.name);
  };

  const handleRecentSearchClick = (recentSearch) => {
    setQuery(recentSearch.query);
    handleSearch(recentSearch.query);
  };

  const handleTrendingSearchClick = (trendingSearch) => {
    setQuery(trendingSearch.query);
    handleSearch(trendingSearch.query);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (selectedSuggestion >= 0 && suggestions[selectedSuggestion]) {
        handleSuggestionClick(suggestions[selectedSuggestion]);
      } else {
        handleSearch();
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedSuggestion((prev) =>
        prev < suggestions.length - 1 ? prev + 1 : prev,
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedSuggestion((prev) => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === "Escape") {
      setShowDropdown(false);
      setSelectedSuggestion(-1);
    }
  };

  const getSuggestionIcon = (type) => {
    switch (type) {
      case "product":
        return Package;
      case "exercise":
        return Activity;
      case "workout_plan":
        return Target;
      case "tool":
        return Calculator;
      default:
        return Search;
    }
  };

  const getSuggestionColor = (type) => {
    switch (type) {
      case "product":
        return "text-primary";
      case "exercise":
        return "text-primary";
      case "workout_plan":
        return "text-primary";
      case "tool":
        return "text-primary";
      default:
        return "text-muted-foreground";
    }
  };

  const getTrendIcon = (trend) => {
    switch (trend) {
      case "up":
        return <TrendingUp className="w-3 h-3 text-primary" />;
      case "down":
        return <TrendingUp className="w-3 h-3 text-destructive rotate-180" />;
      default:
        return <TrendingUp className="w-3 h-3 text-muted-foreground" />;
    }
  };

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setShowDropdown(true);
            setSelectedSuggestion(-1);
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => setShowDropdown(true)}
          className="pl-10 pr-10"
        />
        {query && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setQuery("");
              setShowDropdown(false);
            }}
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Dropdown de Sugestões */}
      {showDropdown &&
        (suggestions.length > 0 ||
          showRecentSearches ||
          showTrendingSearches) && (
          <Card className="absolute top-full left-0 right-0 mt-1 z-50 max-h-96 overflow-y-auto">
            <CardContent className="p-0">
              {/* Sugestões */}
              {suggestions.length > 0 && (
                <div className="p-4 border-b">
                  <div className="flex items-center space-x-2 mb-3">
                    <Lightbulb className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium text-foreground">
                      Sugestões
                    </span>
                  </div>
                  <div className="space-y-1">
                    {suggestions.map((suggestion, index) => {
                      const IconComponent = getSuggestionIcon(suggestion.type);
                      return (
                        <button
                          key={`${suggestion.type}-${suggestion.id}`}
                          onClick={() => handleSuggestionClick(suggestion)}
                          className={`w-full flex items-center space-x-3 p-2 rounded-lg text-left hover:bg-accent transition-colors ${
                            index === selectedSuggestion
                              ? "bg-muted"
                              : ""
                          }`}
                        >
                          <IconComponent
                            className={`w-4 h-4 ${getSuggestionColor(suggestion.type)}`}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm truncate">
                              {suggestion.name}
                            </div>
                            <div className="text-xs text-muted-foreground truncate">
                              {suggestion.category}
                            </div>
                          </div>
                          <Badge variant="secondary" className="text-xs">
                            {suggestion.type === "product"
                              ? "Produto"
                              : suggestion.type === "exercise"
                                ? "Exercício"
                                : suggestion.type === "workout_plan"
                                  ? "Plano"
                                  : "Ferramenta"}
                          </Badge>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Buscas Recentes */}
              {showRecentSearches && recentSearches.length > 0 && (
                <div className="p-4 border-b">
                  <div className="flex items-center space-x-2 mb-3">
                    <History className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium text-foreground">
                      Buscas Recentes
                    </span>
                  </div>
                  <div className="space-y-1">
                    {recentSearches.slice(0, 5).map((recent, index) => (
                      <button
                        key={index}
                        onClick={() => handleRecentSearchClick(recent)}
                        className="w-full flex items-center space-x-3 p-2 rounded-lg text-left hover:bg-accent transition-colors"
                      >
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm text-foreground">
                          {recent.query}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Buscas em Tendência */}
              {showTrendingSearches && trendingSearches.length > 0 && (
                <div className="p-4">
                  <div className="flex items-center space-x-2 mb-3">
                    <Zap className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium text-foreground">
                      Em Tendência
                    </span>
                  </div>
                  <div className="space-y-1">
                    {trendingSearches.slice(0, 5).map((trending, index) => (
                      <button
                        key={index}
                        onClick={() => handleTrendingSearchClick(trending)}
                        className="w-full flex items-center justify-between p-2 rounded-lg text-left hover:bg-accent transition-colors"
                      >
                        <div className="flex items-center space-x-3">
                          <span className="text-sm font-medium text-foreground">
                            {trending.query}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {trending.count} buscas
                          </Badge>
                        </div>
                        {getTrendIcon(trending.trend)}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Estado de Carregamento */}
              {isLoading && (
                <div className="p-4 text-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                  <p className="text-sm text-muted-foreground mt-2">Buscando...</p>
                </div>
              )}

              {/* Sem resultados */}
              {!isLoading && suggestions.length === 0 && query.length > 1 && (
                <div className="p-4 text-center">
                  <Search className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Nenhuma sugestão encontrada para "{query}"
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSearch()}
                    className="mt-2"
                  >
                    Buscar mesmo assim
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}
    </div>
  );
};

// Memoize para evitar re-renderizações desnecessárias
// SmartSearch pode ter muitas sugestões e cálculos, otimização importante
export const SmartSearch = memo(SmartSearchComponent);
