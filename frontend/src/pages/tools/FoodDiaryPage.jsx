import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/Ui/button';
import { Input } from '@/components/Ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/Ui/card';
// Layout será fornecido pelo UserLayoutWrapper
import AIAssistantPopup from '../../components/AIAssistantPopup';
import { useApi, apiService } from '../../lib/api';
import { formatDate } from '../../lib/utils';
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
  Bot
} from 'lucide-react';
import { toast } from 'sonner';

// Schema de validação
const foodEntrySchema = z.object({
  food_name: z.string().min(1, 'Nome do alimento é obrigatório'),
  quantity: z.number().min(0.1, 'Quantidade deve ser maior que 0'),
  unit: z.string().min(1, 'Unidade é obrigatória'),
  meal_type: z.string().min(1, 'Tipo de refeição é obrigatório'),
  calories: z.number().min(0, 'Calorias devem ser maior ou igual a 0'),
  protein: z.number().min(0, 'Proteína deve ser maior ou igual a 0'),
  carbs: z.number().min(0, 'Carboidratos devem ser maior ou igual a 0'),
  fat: z.number().min(0, 'Gordura deve ser maior ou igual a 0'),
  fiber: z.number().min(0, 'Fibra deve ser maior ou igual a 0'),
});

export const FoodDiaryPage = () => {
  const { request, loading } = useApi();
  const [entries, setEntries] = React.useState([]);
  const [searchResults, setSearchResults] = React.useState([]);
  const [selectedDate, setSelectedDate] = React.useState(new Date().toISOString().split('T')[0]);
  const [showAddForm, setShowAddForm] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [isSearching, setIsSearching] = React.useState(false);
  const [currentTool, setCurrentTool] = React.useState('food_diary');
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
      const data = await request(() => 
        apiService.health.getFoodEntries({ date: selectedDate })
      );
      setEntries(data.entries || []);
      calculateDailyTotals(data.entries || []);
    } catch {
      console.error('Erro ao carregar entradas:');
    }
  };

  const calculateDailyTotals = (entries) => {
    const totals = entries.reduce((acc, entry) => ({
      calories: acc.calories + (entry.calories || 0),
      protein: acc.protein + (entry.protein || 0),
      carbs: acc.carbs + (entry.carbs || 0),
      fat: acc.fat + (entry.fat || 0),
      fiber: acc.fiber + (entry.fiber || 0),
    }), {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      fiber: 0,
    });

    setDailyTotals(totals);
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const data = await request(() => 
        apiService.health.searchFoods({ query: searchQuery })
      );
      setSearchResults(data.foods || []);
    } catch (error) {
      console.error('Erro na busca:', error);
      toast.error('Erro ao buscar alimentos. Tente novamente.');
    } finally {
      setIsSearching(false);
    }
  };

  const selectFood = (food) => {
    setValue('food_name', food.name);
    setValue('calories', food.calories || 0);
    setValue('protein', food.protein || 0);
    setValue('carbs', food.carbs || 0);
    setValue('fat', food.fat || 0);
    setValue('fiber', food.fiber || 0);
    setSearchResults([]);
    setSearchQuery('');
  };

  const onSubmit = async (data) => {
    try {
      await request(() => 
        apiService.health.addFoodEntry({
          ...data,
          date: selectedDate,
        })
      );

      toast.success('Alimento adicionado com sucesso!');
      loadEntries();
      reset();
      setShowAddForm(false);
    } catch (error) {
      console.error('Erro ao adicionar alimento:', error);
      toast.error('Erro ao adicionar alimento. Tente novamente.');
    }
  };

  const deleteEntry = async (entryId) => {
    try {
      await request(() => 
        apiService.health.deleteFoodEntry(entryId)
      );
      toast.success('Alimento removido com sucesso!');
      loadEntries();
    } catch (error) {
      console.error('Erro ao remover alimento:', error);
      toast.error('Erro ao remover alimento. Tente novamente.');
    }
  };

  const getMealTypeIcon = (mealType) => {
    switch (mealType) {
      case 'breakfast': return '🌅';
      case 'lunch': return '🍽️';
      case 'dinner': return '🌙';
      case 'snack': return '🍎';
      default: return '🍴';
    }
  };

  const getMealTypeLabel = (mealType) => {
    switch (mealType) {
      case 'breakfast': return 'Café da Manhã';
      case 'lunch': return 'Almoço';
      case 'dinner': return 'Jantar';
      case 'snack': return 'Lanches';
      default: return mealType;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <Apple className="w-8 h-8 text-green-600" />
              Diário Alimentar
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Registre suas refeições e acompanhe sua nutrição diária
            </p>
          </div>
          
          {/* Botão de IA com contexto da ferramenta */}
          <Button 
            onClick={() => setCurrentTool('food_diary')}
            className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-300 transform hover:scale-105 shadow-lg"
          >
            <Bot className="w-5 h-5 mr-2" />
            Assistente IA
          </Button>
        </div>

        {/* Resumo Nutricional */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <Card className="text-center p-4">
            <div className="text-2xl font-bold text-orange-600 mb-2">
              <Flame className="w-8 h-8 mx-auto" />
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Calorias</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">
              {dailyTotals.calories.toFixed(0)}
            </p>
          </Card>
          
          <Card className="text-center p-4">
            <div className="text-2xl font-bold text-red-600 mb-2">
              <Zap className="w-8 h-8 mx-auto" />
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Proteínas</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">
              {dailyTotals.protein.toFixed(1)}g
            </p>
          </Card>
          
          <Card className="text-center p-4">
            <div className="text-2xl font-bold text-green-600 mb-2">
              <Wheat className="w-8 h-8 mx-auto" />
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Carboidratos</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">
              {dailyTotals.carbs.toFixed(1)}g
            </p>
          </Card>
          
          <Card className="text-center p-4">
            <div className="text-2xl font-bold text-yellow-600 mb-2">
              <Droplets className="w-8 h-8 mx-auto" />
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Gorduras</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">
              {dailyTotals.fat.toFixed(1)}g
            </p>
          </Card>
          
          <Card className="text-center p-4">
            <div className="text-2xl font-bold text-purple-600 mb-2">
              <Leaf className="w-8 h-8 mx-auto" />
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Fibras</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">
              {dailyTotals.fiber.toFixed(1)}g
            </p>
          </Card>
        </div>

        {/* Seletor de Data */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <Calendar className="w-5 h-5 text-gray-600" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-gray-600">
                {formatDate(selectedDate)}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Formulário de Adição */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Adicionar Alimento
            </CardTitle>
            <CardDescription>
              Registre uma nova refeição no seu diário
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Busca de Alimentos */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
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
                    className="bg-blue-600 hover:bg-blue-700"
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
                  <div className="border border-gray-200 rounded-lg max-h-40 overflow-y-auto">
                    {searchResults.map((food, index) => (
                      <div
                        key={index}
                        onClick={() => selectFood(food)}
                        className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                      >
                        <div className="font-medium">{food.name}</div>
                        <div className="text-sm text-gray-600">
                          {food.calories} cal • P: {food.protein}g • C: {food.carbs}g • G: {food.fat}g
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                    Nome do Alimento
                  </label>
                  <Input
                    {...register('food_name')}
                    placeholder="Nome do alimento"
                  />
                  {errors.food_name && (
                    <p className="text-red-500 text-sm mt-1">{errors.food_name.message}</p>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                    Tipo de Refeição
                  </label>
                  <select
                    {...register('meal_type')}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Selecione...</option>
                    <option value="breakfast">Café da Manhã</option>
                    <option value="lunch">Almoço</option>
                    <option value="dinner">Jantar</option>
                    <option value="snack">Lanches</option>
                  </select>
                  {errors.meal_type && (
                    <p className="text-red-500 text-sm mt-1">{errors.meal_type.message}</p>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                    Quantidade
                  </label>
                  <Input
                    type="number"
                    step="0.1"
                    {...register('quantity', { valueAsNumber: true })}
                    placeholder="1.0"
                  />
                  {errors.quantity && (
                    <p className="text-red-500 text-sm mt-1">{errors.quantity.message}</p>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                    Unidade
                  </label>
                  <Input
                    {...register('unit')}
                    placeholder="xícara, grama, etc."
                  />
                  {errors.unit && (
                    <p className="text-red-500 text-sm mt-1">{errors.unit.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                    Calorias
                  </label>
                  <Input
                    type="number"
                    {...register('calories', { valueAsNumber: true })}
                    placeholder="0"
                  />
                  {errors.calories && (
                    <p className="text-red-500 text-sm mt-1">{errors.calories.message}</p>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                    Proteínas (g)
                  </label>
                  <Input
                    type="number"
                    step="0.1"
                    {...register('protein', { valueAsNumber: true })}
                    placeholder="0"
                  />
                  {errors.protein && (
                    <p className="text-red-500 text-sm mt-1">{errors.protein.message}</p>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                    Carboidratos (g)
                  </label>
                  <Input
                    type="number"
                    step="0.1"
                    {...register('carbs', { valueAsNumber: true })}
                    placeholder="0"
                  />
                  {errors.carbs && (
                    <p className="text-red-500 text-sm mt-1">{errors.carbs.message}</p>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                    Gorduras (g)
                  </label>
                  <Input
                    type="number"
                    step="0.1"
                    {...register('fat', { valueAsNumber: true })}
                    placeholder="0"
                  />
                  {errors.fat && (
                    <p className="text-red-500 text-sm mt-1">{errors.fat.message}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                  Fibras (g)
                </label>
                <Input
                  type="number"
                  step="0.1"
                  {...register('fiber', { valueAsNumber: true })}
                  placeholder="0"
                />
                {errors.fiber && (
                  <p className="text-red-500 text-sm mt-1">{errors.fiber.message}</p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full bg-green-600 hover:bg-green-700 text-white py-3"
                disabled={loading}
              >
                {loading ? 'Adicionando...' : 'Adicionar ao Diário'}
              </Button>
            </form>
          </CardContent>
        </Card>

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
                <Apple className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">Nenhuma refeição registrada hoje</p>
                <p className="text-gray-400">Comece adicionando sua primeira refeição!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {entries.map((entry, index) => (
                  <div
                    key={index}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-2xl">{getMealTypeIcon(entry.meal_type)}</span>
                          <span className="font-medium text-gray-900 dark:text-white">
                            {entry.food_name}
                          </span>
                          <span className="text-sm text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                            {getMealTypeLabel(entry.meal_type)}
                          </span>
                        </div>
                        
                        <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          {entry.quantity} {entry.unit} • {entry.calories} calorias
                        </div>
                        
                        <div className="flex gap-4 text-sm">
                          <span className="text-red-600">P: {entry.protein}g</span>
                          <span className="text-green-600">C: {entry.carbs}g</span>
                          <span className="text-yellow-600">G: {entry.fat}g</span>
                          <span className="text-purple-600">F: {entry.fiber}g</span>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {/* Implementar edição */}}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteEntry(entry.id)}
                          className="text-red-600 hover:text-red-700"
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
      <AIAssistantPopup 
        currentTool={currentTool}
        toolContext={{
          tool: 'food_diary',
          selectedDate: selectedDate,
          dailyTotals: dailyTotals,
          entries: entries,
          searchQuery: searchQuery,
          userInputs: { 
            calories: dailyTotals.calories,
            protein: dailyTotals.protein,
            carbs: dailyTotals.carbs,
            fat: dailyTotals.fat,
            fiber: dailyTotals.fiber
          }
        }}
      />
    </div>
  );
};