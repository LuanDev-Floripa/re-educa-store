import React from "react";
import logger from "@/utils/logger";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/Ui/button";
import { Input } from "@/components/Ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/Ui/card";
// Layout será fornecido pelo UserLayoutWrapper
// // import AIAssistantPopup - Substituído por UnifiedAIAssistant global
import { useApi, apiService } from "../../lib/api";
import { formatDate } from "../../lib/utils";
import {
  Apple,
  Search,
  Plus,
  Calendar,
  Clock,
  Scale,
  Flame,
  Zap,
  Wheat,
  Droplets,
  Leaf,
  Trash2,
  Edit,
  Filter,
  Bot,
} from "lucide-react";
import { toast } from "sonner";

// Schema de validação
const foodEntrySchema = z.object({
  food_name: z.string().min(1, "Nome do alimento é obrigatório"),
  quantity: z.number().min(0.1, "Quantidade deve ser maior que 0"),
  unit: z.string().min(1, "Unidade é obrigatória"),
  meal_type: z.string().min(1, "Tipo de refeição é obrigatório"),
  calories: z.number().min(0, "Calorias devem ser maior ou igual a 0"),
  protein: z.number().min(0, "Proteína deve ser maior ou igual a 0"),
  carbs: z.number().min(0, "Carboidratos devem ser maior ou igual a 0"),
  fat: z.number().min(0, "Gordura deve ser maior ou igual a 0"),
  fiber: z.number().min(0, "Fibra deve ser maior ou igual a 0"),
});

/**
 * FoodDiaryPage
 * Diário alimentar com busca, CRUD de entradas e totais diários (com guards).
 */
export const FoodDiaryPage = () => {
  const { request, loading } = useApi();
  const [entries, setEntries] = React.useState([]);
  const [searchResults, setSearchResults] = React.useState([]);
  const [selectedDate, setSelectedDate] = React.useState(
    new Date().toISOString().split("T")[0],
  );
  const [showAddForm, setShowAddForm] = React.useState(false);
  const [editingEntry, setEditingEntry] = React.useState(null);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [isSearching, setIsSearching] = React.useState(false);
  const [dailyTotals, setDailyTotals] = React.useState({
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    fiber: 0,
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm({
    resolver: zodResolver(foodEntrySchema),
  });

  // Carregar entradas do dia
  React.useEffect(() => {
    loadEntries();
  }, [selectedDate]);

  const loadEntries = async () => {
    try {
      if (typeof request !== "function") {
        throw new Error("Serviço de rede indisponível");
      }
      if (!apiService?.health?.getFoodEntries) {
        throw new Error("Serviço de entradas indisponível");
      }
      const data = await request(() =>
        apiService.health.getFoodEntries({ date: selectedDate }),
      );
      const list = Array.isArray(data?.entries) ? data.entries : [];
      setEntries(list);
      calculateDailyTotals(list);
    } catch (e) {
      logger.error("Erro ao carregar entradas:", e);
    }
  };

  const calculateDailyTotals = (entries) => {
    const totals = entries.reduce(
      (acc, entry) => ({
        calories: acc.calories + (entry.calories || 0),
        protein: acc.protein + (entry.protein || 0),
        carbs: acc.carbs + (entry.carbs || 0),
        fat: acc.fat + (entry.fat || 0),
        fiber: acc.fiber + (entry.fiber || 0),
      }),
      {
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        fiber: 0,
      },
    );

    setDailyTotals(totals);
  };

  // Função robusta para extrair valores numéricos
  const safeGetNumericValue = (value, defaultValue = 0) => {
    // Caso 1: Já é número válido
    if (typeof value === 'number' && !isNaN(value)) {
      return value;
    }
    
    // Caso 2: String numérica
    if (typeof value === 'string') {
      const parsed = parseFloat(value);
      if (!isNaN(parsed)) return parsed;
    }
    
    // Caso 3: Objeto com value ou amount
    if (value && typeof value === 'object') {
      if (typeof value.value === 'number') return value.value;
      if (typeof value.value === 'string') {
        const parsed = parseFloat(value.value);
        if (!isNaN(parsed)) return parsed;
      }
      if (typeof value.amount === 'number') return value.amount;
      if (typeof value.amount === 'string') {
        const parsed = parseFloat(value.amount);
        if (!isNaN(parsed)) return parsed;
      }
    }
    
    // Caso 4: Array (pegar primeiro valor)
    if (Array.isArray(value) && value.length > 0) {
      return safeGetNumericValue(value[0], defaultValue);
    }
    
    return defaultValue;
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      if (typeof request !== "function") {
        throw new Error("Serviço de rede indisponível");
      }
      if (!apiService?.health?.searchFoods) {
        throw new Error("Serviço de busca indisponível");
      }
      const data = await request(() => apiService.health.searchFoods({ query: searchQuery }));
      
      // Validar estrutura de resposta
      if (!data || (!Array.isArray(data.foods) && !Array.isArray(data))) {
        logger.warn("Formato de resposta inesperado:", data);
        setSearchResults([]);
        toast.warning("Resposta da API em formato inesperado");
        return;
      }
      
      const foods = Array.isArray(data.foods) ? data.foods : data;
      
      // Normalizar dados antes de definir estado - garantir que todos os valores são números
      const normalizedFoods = foods.map(food => ({
        ...food,
        calories: safeGetNumericValue(food.calories, 0),
        protein: safeGetNumericValue(food.protein, 0),
        carbs: safeGetNumericValue(food.carbs, 0),
        fat: safeGetNumericValue(food.fat, 0),
        fiber: safeGetNumericValue(food.fiber, 0),
      }));
      
      setSearchResults(normalizedFoods);
    } catch (error) {
      logger.error("Erro na busca:", error);
      toast.error("Erro ao buscar alimentos. Tente novamente.");
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const selectFood = (food) => {
    try {
      // Garantir que todos os valores são números antes de usar
      setValue("food_name", food?.name || "");
      setValue("calories", safeGetNumericValue(food?.calories, 0));
      setValue("protein", safeGetNumericValue(food?.protein, 0));
      setValue("carbs", safeGetNumericValue(food?.carbs, 0));
      setValue("fat", safeGetNumericValue(food?.fat, 0));
      setValue("fiber", safeGetNumericValue(food?.fiber, 0));
      setSearchResults([]);
      setSearchQuery("");
    } catch (error) {
      logger.error("Erro ao selecionar alimento:", error, food);
      toast.error("Erro ao carregar dados do alimento. Tente novamente.");
    }
  };

  const onSubmit = async (data) => {
    try {
      if (typeof request !== "function") {
        throw new Error("Serviço de rede indisponível");
      }
      
      if (editingEntry) {
        // Atualizar entrada existente
        if (!apiService?.health?.updateFoodEntry) {
          throw new Error("Serviço de atualização indisponível");
        }
        await request(() => apiService.health.updateFoodEntry(editingEntry.id, { ...data, entry_date: selectedDate }));
        toast.success("Alimento atualizado com sucesso!");
        setEditingEntry(null);
      } else {
        // Criar nova entrada
        if (!apiService?.health?.addFoodEntry) {
          throw new Error("Serviço de inclusão indisponível");
        }
        await request(() => apiService.health.addFoodEntry({ ...data, date: selectedDate }));
        toast.success("Alimento adicionado com sucesso!");
      }
      
      loadEntries();
      reset();
      setShowAddForm(false);
      setEditingEntry(null);
    } catch (error) {
      logger.error(`Erro ao ${editingEntry ? 'atualizar' : 'adicionar'} alimento:`, error);
      toast.error(error?.message || `Erro ao ${editingEntry ? 'atualizar' : 'adicionar'} alimento. Tente novamente.`);
    }
  };

  const deleteEntry = async (entryId) => {
    try {
      if (typeof request !== "function") {
        throw new Error("Serviço de rede indisponível");
      }
      if (!apiService?.health?.deleteFoodEntry) {
        throw new Error("Serviço de remoção indisponível");
      }
      await request(() => apiService.health.deleteFoodEntry(entryId));
      toast.success("Alimento removido com sucesso!");
      loadEntries();
    } catch (error) {
      logger.error("Erro ao remover alimento:", error);
      toast.error(error?.message || "Erro ao remover alimento. Tente novamente.");
    }
  };

  const getMealTypeIcon = (mealType) => {
    switch (mealType) {
      case "breakfast":
        return "🌅";
      case "lunch":
        return "🍽️";
      case "dinner":
        return "🌙";
      case "snack":
        return "🍎";
      default:
        return "🍴";
    }
  };

  const getMealTypeLabel = (mealType) => {
    switch (mealType) {
      case "breakfast":
        return "Café da Manhã";
      case "lunch":
        return "Almoço";
      case "dinner":
        return "Jantar";
      case "snack":
        return "Lanches";
      default:
        return mealType;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <Apple className="w-8 h-8 text-primary" />
            Diário Alimentar
          </h1>
          <p className="text-muted-foreground mt-2">
            Registre suas refeições e acompanhe sua nutrição diária
          </p>
        </div>

        {/* Botão de IA com contexto da ferramenta */}
        <Button
          onClick={() => {
            // Tool context set
          }}
          className="px-4 sm:px-6 py-2 sm:py-3"
        >
          <Bot className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
          Assistente IA
        </Button>
      </div>

      {/* Resumo Nutricional */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
        <Card className="text-center p-4">
          <div className="text-2xl font-bold text-primary mb-2">
            <Flame className="w-8 h-8 mx-auto" />
          </div>
          <p className="text-sm text-muted-foreground mb-1">
            Calorias
          </p>
          <p className="text-xl font-bold text-foreground">
            {dailyTotals.calories.toFixed(0)}
          </p>
        </Card>

        <Card className="text-center p-4">
          <div className="text-2xl font-bold text-destructive mb-2">
            <Zap className="w-8 h-8 mx-auto" />
          </div>
          <p className="text-sm text-muted-foreground mb-1">
            Proteínas
          </p>
          <p className="text-xl font-bold text-foreground">
            {dailyTotals.protein.toFixed(1)}g
          </p>
        </Card>

        <Card className="text-center p-4">
          <div className="text-2xl font-bold text-primary mb-2">
            <Wheat className="w-8 h-8 mx-auto" />
          </div>
          <p className="text-sm text-muted-foreground mb-1">
            Carboidratos
          </p>
          <p className="text-xl font-bold text-foreground">
            {dailyTotals.carbs.toFixed(1)}g
          </p>
        </Card>

        <Card className="text-center p-4">
          <div className="text-2xl font-bold text-primary mb-2">
            <Droplets className="w-8 h-8 mx-auto" />
          </div>
          <p className="text-sm text-muted-foreground mb-1">
            Gorduras
          </p>
          <p className="text-xl font-bold text-foreground">
            {dailyTotals.fat.toFixed(1)}g
          </p>
        </Card>

        <Card className="text-center p-3 sm:p-4">
          <div className="text-xl sm:text-2xl font-bold text-primary mb-2">
            <Leaf className="w-6 h-6 sm:w-8 sm:h-8 mx-auto" />
          </div>
          <p className="text-sm text-muted-foreground mb-1">
            Fibras
          </p>
          <p className="text-xl font-bold text-foreground">
            {dailyTotals.fiber.toFixed(1)}g
          </p>
        </Card>
      </div>

      {/* Seletor de Data */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <Calendar className="w-5 h-5 text-muted-foreground" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <span className="text-muted-foreground">{formatDate(selectedDate)}</span>
          </div>
        </CardContent>
      </Card>

      {/* Botão para mostrar/esconder formulário */}
      <div className="mb-4">
        <Button
          onClick={() => setShowAddForm(!showAddForm)}
          variant={showAddForm ? "outline" : "default"}
          className="w-full md:w-auto"
        >
          {showAddForm ? null : <Plus className="w-4 h-4 mr-2" />}
          {showAddForm ? "Ocultar Formulário" : "Adicionar Alimento"}
        </Button>
      </div>

      {/* Formulário de Adição/Edição */}
      {showAddForm && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {editingEntry ? <Edit className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
              {editingEntry ? "Editar Alimento" : "Adicionar Alimento"}
            </CardTitle>
            <CardDescription>
              {editingEntry ? "Atualize os dados da refeição" : "Registre uma nova refeição no seu diário"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Busca de Alimentos */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Buscar Alimento
              </label>
              <div className="flex gap-2">
                <Input
                  placeholder="Digite o nome do alimento..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1"
                />
                <Button
                  type="button"
                  onClick={handleSearch}
                  disabled={isSearching || !searchQuery.trim()}
                  className="bg-primary hover:bg-primary/90"
                >
                  {isSearching ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <Search className="w-4 h-4" />
                  )}
                </Button>
              </div>

              {/* Resultados da Busca */}
              {searchResults.length > 0 && (
                <div className="border border-border rounded-lg max-h-40 overflow-y-auto">
                  {searchResults.map((food, index) => {
                    // Usar função centralizada - dados já estão normalizados
                    const calories = safeGetNumericValue(food.calories, 0);
                    const protein = safeGetNumericValue(food.protein, 0);
                    const carbs = safeGetNumericValue(food.carbs, 0);
                    const fat = safeGetNumericValue(food.fat, 0);

                    return (
                      <div
                        key={food.fdc_id || index}
                        onClick={() => selectFood(food)}
                        className="p-3 hover:bg-accent cursor-pointer border-b border-border last:border-b-0"
                      >
                        <div className="font-medium text-foreground">{food.name || "Alimento sem nome"}</div>
                        <div className="text-sm text-muted-foreground">
                          {calories} cal • P: {protein}g • C: {carbs}g • G: {fat}g
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Nome do Alimento
                </label>
                <Input
                  {...register("food_name")}
                  placeholder="Nome do alimento"
                />
                {errors.food_name && (
                  <p className="text-destructive text-sm mt-1">
                    {errors.food_name.message}
                  </p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Tipo de Refeição
                </label>
                <select
                  {...register("meal_type")}
                  className="w-full border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Selecione...</option>
                  <option value="breakfast">Café da Manhã</option>
                  <option value="lunch">Almoço</option>
                  <option value="dinner">Jantar</option>
                  <option value="snack">Lanches</option>
                </select>
                {errors.meal_type && (
                  <p className="text-destructive text-sm mt-1">
                    {errors.meal_type.message}
                  </p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Quantidade
                </label>
                <Input
                  type="number"
                  step="0.1"
                  {...register("quantity", { valueAsNumber: true })}
                  placeholder="1.0"
                />
                {errors.quantity && (
                  <p className="text-destructive text-sm mt-1">
                    {errors.quantity.message}
                  </p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Unidade
                </label>
                <Input
                  {...register("unit")}
                  placeholder="xícara, grama, etc."
                />
                {errors.unit && (
                  <p className="text-destructive text-sm mt-1">
                    {errors.unit.message}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Calorias
                </label>
                <Input
                  type="number"
                  {...register("calories", { valueAsNumber: true })}
                  placeholder="0"
                />
                {errors.calories && (
                  <p className="text-destructive text-sm mt-1">
                    {errors.calories.message}
                  </p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Proteínas (g)
                </label>
                <Input
                  type="number"
                  step="0.1"
                  {...register("protein", { valueAsNumber: true })}
                  placeholder="0"
                />
                {errors.protein && (
                  <p className="text-destructive text-sm mt-1">
                    {errors.protein.message}
                  </p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Carboidratos (g)
                </label>
                <Input
                  type="number"
                  step="0.1"
                  {...register("carbs", { valueAsNumber: true })}
                  placeholder="0"
                />
                {errors.carbs && (
                  <p className="text-destructive text-sm mt-1">
                    {errors.carbs.message}
                  </p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Gorduras (g)
                </label>
                <Input
                  type="number"
                  step="0.1"
                  {...register("fat", { valueAsNumber: true })}
                  placeholder="0"
                />
                {errors.fat && (
                  <p className="text-destructive text-sm mt-1">
                    {errors.fat.message}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Fibras (g)
              </label>
              <Input
                type="number"
                step="0.1"
                {...register("fiber", { valueAsNumber: true })}
                placeholder="0"
              />
              {errors.fiber && (
                <p className="text-destructive text-sm mt-1">
                  {errors.fiber.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full bg-primary hover:bg-primary/90 text-white py-3"
              disabled={loading}
            >
              {loading ? "Adicionando..." : "Adicionar ao Diário"}
            </Button>
          </form>
        </CardContent>
      </Card>
      )}

      {/* Lista de Entradas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Refeições do Dia
          </CardTitle>
          <CardDescription>
            Suas refeições registradas para {formatDate(selectedDate)}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {entries.length === 0 ? (
            <div className="text-center py-8">
              <Apple className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground text-lg">
                Nenhuma refeição registrada hoje
              </p>
              <p className="text-muted-foreground">
                Comece adicionando sua primeira refeição!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {entries.map((entry, index) => (
                <div
                  key={index}
                  className="border border-border rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-2xl">
                          {getMealTypeIcon(entry.meal_type)}
                        </span>
                        <span className="font-medium text-foreground">
                          {entry.food_name}
                        </span>
                        <span className="text-sm text-muted-foreground bg-muted px-2 py-1 rounded">
                          {getMealTypeLabel(entry.meal_type)}
                        </span>
                      </div>

                      <div className="text-sm text-muted-foreground mb-2">
                        {entry.quantity} {entry.unit} • {entry.calories}{" "}
                        calorias
                      </div>

                      <div className="flex gap-4 text-sm">
                        <span className="text-destructive">
                          P: {entry.protein}g
                        </span>
                        <span className="text-primary">
                          C: {entry.carbs}g
                        </span>
                        <span className="text-primary">G: {entry.fat}g</span>
                        <span className="text-primary">
                          F: {entry.fiber}g
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingEntry(entry);
                          setValue("food_name", entry.food_name || "");
                          setValue("quantity", entry.quantity || 0);
                          setValue("unit", entry.unit || "g");
                          setValue("meal_type", entry.meal_type || "other");
                          setValue("calories", entry.calories || 0);
                          setValue("protein", entry.protein || 0);
                          setValue("carbs", entry.carbs || 0);
                          setValue("fat", entry.fat || 0);
                          setValue("fiber", entry.fiber || 0);
                          setShowAddForm(true);
                        }}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteEntry(entry.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Chat IA Integrado */}
    </div>
  );
};

