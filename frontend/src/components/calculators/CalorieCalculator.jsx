/**
 * CalorieCalculator Component - RE-EDUCA Store
 * 
 * Calculadora de calorias (TMB, TDEE) e macronutrientes.
 * 
 * Funcionalidades:
 * - Cálculo de TMB (Taxa Metabólica Basal)
 * - Cálculo de TDEE (Total Daily Energy Expenditure)
 * - Distribuição de macronutrientes
 * - Recomendações baseadas em objetivos
 * - Histórico de cálculos
 * 
 * @component
 * @returns {JSX.Element} Calculadora de calorias
 */
import React, { useState, useEffect, useCallback } from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/Ui/tabs";
import { Badge } from "@/components/Ui/badge";
import { useApi, apiService } from "../../lib/api";
import { toast } from "sonner";
import {
  Calculator,
  Target,
  Activity,
  Flame,
  TrendingUp,
  TrendingDown,
  Scale,
  Heart,
  Zap,
  Info,
  Save,
  History,
} from "lucide-react";

export const CalorieCalculator = () => {
  const { request, loading } = useApi();
  const [formData, setFormData] = useState({
    age: "",
    gender: "",
    weight: "",
    height: "",
    activityLevel: "",
    goal: "maintain",
  });

  const [results, setResults] = useState(null);
  const [activeTab, setActiveTab] = useState("calculator");
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  const activityLevels = [
    {
      value: "sedentary",
      label: "Sedentário",
      description: "Pouco ou nenhum exercício",
    },
    {
      value: "light",
      label: "Levemente Ativo",
      description: "Exercício leve 1-3 dias/semana",
    },
    {
      value: "moderate",
      label: "Moderadamente Ativo",
      description: "Exercício moderado 3-5 dias/semana",
    },
    {
      value: "active",
      label: "Muito Ativo",
      description: "Exercício pesado 6-7 dias/semana",
    },
    {
      value: "very_active",
      label: "Extremamente Ativo",
      description: "Exercício muito pesado, trabalho físico",
    },
  ];

  const goals = [
    {
      value: "lose_weight",
      label: "Perder Peso",
      description: "Deficit calórico de 500-750 cal/dia",
    },
    {
      value: "maintain",
      label: "Manter Peso",
      description: "Manter peso atual",
    },
    {
      value: "gain_weight",
      label: "Ganhar Peso",
      description: "Superávit calórico de 300-500 cal/dia",
    },
  ];

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Carregar histórico
  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const loadHistory = useCallback(async () => {
    try {
      const data = await request(() => apiService.health.getCalorieHistory());
      setHistory(data.calculations || []);
    } catch (error) {
      console.error("Erro ao carregar histórico:", error);
    }
  }, [request]);

  const calculateCalories = async () => {
    const { age, gender, weight, height, activityLevel, goal } = formData;

    if (!age || !gender || !weight || !height || !activityLevel) {
      toast.error("Por favor, preencha todos os campos obrigatórios");
      return;
    }

    try {
      // Enviar dados para o backend
      const response = await request(() =>
        apiService.health.calculateCalories({
          age: parseInt(age),
          gender,
          weight: parseFloat(weight),
          height: parseFloat(height),
          activity_level: activityLevel,
          goal,
        }),
      );

      setResults({
        bmr: response.bmr,
        tdee: response.daily_calories,
        targetCalories: response.daily_calories,
        goal,
        deficit: goal === "lose_weight" ? 500 : 0,
        surplus: goal === "gain_weight" ? 300 : 0,
        macros: response.macros,
        saved: response.saved,
      });

      toast.success("Cálculo realizado e salvo com sucesso!");
      loadHistory(); // Recarregar histórico
    } catch (error) {
      console.error("Erro ao calcular calorias:", error);
      toast.error("Erro ao calcular calorias. Tente novamente.");
    }
  };

  const getGoalColor = (goal) => {
    switch (goal) {
      case "lose_weight":
        return "text-red-600";
      case "maintain":
        return "text-blue-600";
      case "gain_weight":
        return "text-green-600";
      default:
        return "text-gray-600";
    }
  };

  const getGoalIcon = (goal) => {
    switch (goal) {
      case "lose_weight":
        return <TrendingDown className="w-5 h-5" />;
      case "maintain":
        return <Target className="w-5 h-5" />;
      case "gain_weight":
        return <TrendingUp className="w-5 h-5" />;
      default:
        return <Target className="w-5 h-5" />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center space-x-3 mb-4">
          <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
            <Calculator className="w-6 h-6 text-orange-600 dark:text-orange-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Calculadora de Calorias
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Calcule suas necessidades calóricas diárias
            </p>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger
            value="calculator"
            className="flex items-center space-x-2"
          >
            <Calculator className="w-4 h-4" />
            <span>Calculadora</span>
          </TabsTrigger>
          <TabsTrigger value="info" className="flex items-center space-x-2">
            <Info className="w-4 h-4" />
            <span>Informações</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="calculator" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Formulário */}
            <Card>
              <CardHeader>
                <CardTitle>Dados Pessoais</CardTitle>
                <CardDescription>
                  Preencha suas informações para calcular suas necessidades
                  calóricas
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="age">Idade *</Label>
                    <Input
                      id="age"
                      type="number"
                      placeholder="25"
                      value={formData.age}
                      onChange={(e) => handleInputChange("age", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="gender">Gênero *</Label>
                    <Select
                      value={formData.gender}
                      onValueChange={(value) =>
                        handleInputChange("gender", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Masculino</SelectItem>
                        <SelectItem value="female">Feminino</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="weight">Peso (kg) *</Label>
                    <Input
                      id="weight"
                      type="number"
                      step="0.1"
                      placeholder="70.0"
                      value={formData.weight}
                      onChange={(e) =>
                        handleInputChange("weight", e.target.value)
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="height">Altura (cm) *</Label>
                    <Input
                      id="height"
                      type="number"
                      placeholder="175"
                      value={formData.height}
                      onChange={(e) =>
                        handleInputChange("height", e.target.value)
                      }
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="activity">Nível de Atividade *</Label>
                  <Select
                    value={formData.activityLevel}
                    onValueChange={(value) =>
                      handleInputChange("activityLevel", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione seu nível" />
                    </SelectTrigger>
                    <SelectContent>
                      {activityLevels.map((level) => (
                        <SelectItem key={level.value} value={level.value}>
                          <div>
                            <div className="font-medium">{level.label}</div>
                            <div className="text-sm text-gray-500">
                              {level.description}
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="goal">Objetivo</Label>
                  <Select
                    value={formData.goal}
                    onValueChange={(value) => handleInputChange("goal", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione seu objetivo" />
                    </SelectTrigger>
                    <SelectContent>
                      {goals.map((goal) => (
                        <SelectItem key={goal.value} value={goal.value}>
                          <div>
                            <div className="font-medium">{goal.label}</div>
                            <div className="text-sm text-gray-500">
                              {goal.description}
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  onClick={calculateCalories}
                  className="w-full bg-orange-600 hover:bg-orange-700"
                  disabled={loading}
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  ) : (
                    <Calculator className="w-4 h-4 mr-2" />
                  )}
                  {loading ? "Calculando..." : "Calcular Calorias"}
                </Button>
              </CardContent>
            </Card>

            {/* Resultados */}
            <Card>
              <CardHeader>
                <CardTitle>Resultados</CardTitle>
                <CardDescription>
                  Suas necessidades calóricas calculadas
                </CardDescription>
              </CardHeader>
              <CardContent>
                {results ? (
                  <div className="space-y-6">
                    {/* Calorias Alvo */}
                    <div className="text-center p-6 bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-lg">
                      <div className="flex items-center justify-center space-x-2 mb-2">
                        {getGoalIcon(results.goal)}
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                          {goals.find((g) => g.value === results.goal)?.label}
                        </span>
                      </div>
                      <div
                        className={`text-4xl font-bold ${getGoalColor(results.goal)}`}
                      >
                        {results.targetCalories}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        calorias por dia
                      </div>
                    </div>

                    {/* Detalhes */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <Heart className="w-5 h-5 text-red-500" />
                          <span className="font-medium">
                            Taxa Metabólica Basal (BMR)
                          </span>
                        </div>
                        <span className="font-bold text-lg">
                          {results.bmr} cal
                        </span>
                      </div>

                      <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <Activity className="w-5 h-5 text-blue-500" />
                          <span className="font-medium">
                            Gasto Total Diário (TDEE)
                          </span>
                        </div>
                        <span className="font-bold text-lg">
                          {results.tdee} cal
                        </span>
                      </div>

                      {results.deficit > 0 && (
                        <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                          <div className="flex items-center space-x-2">
                            <TrendingDown className="w-5 h-5 text-red-500" />
                            <span className="font-medium">
                              Deficit Calórico
                            </span>
                          </div>
                          <span className="font-bold text-lg text-red-600">
                            -{results.deficit} cal
                          </span>
                        </div>
                      )}

                      {results.surplus > 0 && (
                        <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                          <div className="flex items-center space-x-2">
                            <TrendingUp className="w-5 h-5 text-green-500" />
                            <span className="font-medium">
                              Superávit Calórico
                            </span>
                          </div>
                          <span className="font-bold text-lg text-green-600">
                            +{results.surplus} cal
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Dicas */}
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
                        💡 Dicas Importantes
                      </h4>
                      <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                        <li>
                          • Consulte um nutricionista para um plano
                          personalizado
                        </li>
                        <li>• Monitore seu progresso semanalmente</li>
                        <li>• Ajuste as calorias conforme necessário</li>
                        <li>• Mantenha uma alimentação equilibrada</li>
                      </ul>
                    </div>

                    {/* Histórico */}
                    <div className="mt-6">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-semibold flex items-center gap-2">
                          <History className="w-5 h-5" />
                          Histórico de Cálculos
                        </h4>
                        <Button
                          onClick={() => setShowHistory(!showHistory)}
                          variant="outline"
                          size="sm"
                        >
                          {showHistory ? "Ocultar" : "Ver Histórico"}
                        </Button>
                      </div>

                      {showHistory && (
                        <div className="space-y-3 max-h-64 overflow-y-auto">
                          {history.length === 0 ? (
                            <p className="text-gray-500 text-center py-4">
                              Nenhum cálculo registrado ainda
                            </p>
                          ) : (
                            history.map((entry, index) => (
                              <div
                                key={index}
                                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                              >
                                <div>
                                  <p className="font-medium">
                                    {entry.target_calories} cal/dia
                                  </p>
                                  <p className="text-sm text-gray-500">
                                    {new Date(
                                      entry.created_at,
                                    ).toLocaleDateString("pt-BR")}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="text-sm text-gray-500">
                                    {entry.age} anos • {entry.weight}kg •{" "}
                                    {entry.height}cm
                                  </p>
                                  <Badge variant="outline">{entry.goal}</Badge>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Calculator className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      Calcule suas calorias
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Preencha o formulário ao lado para ver seus resultados
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="info" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Heart className="w-5 h-5 text-red-500" />
                  <span>Taxa Metabólica Basal (BMR)</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  A BMR é a quantidade de calorias que seu corpo queima em
                  repouso para manter funções básicas como respiração,
                  circulação e digestão.
                </p>
                <div className="space-y-2">
                  <h4 className="font-semibold">Fatores que afetam a BMR:</h4>
                  <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                    <li>• Idade (diminui com a idade)</li>
                    <li>• Gênero (homens geralmente têm BMR maior)</li>
                    <li>• Peso e altura</li>
                    <li>• Massa muscular</li>
                    <li>• Genética</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Activity className="w-5 h-5 text-blue-500" />
                  <span>Gasto Total Diário (TDEE)</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  O TDEE é o total de calorias que você queima em um dia,
                  incluindo atividades físicas e exercícios.
                </p>
                <div className="space-y-2">
                  <h4 className="font-semibold">Componentes do TDEE:</h4>
                  <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                    <li>• BMR (60-70%)</li>
                    <li>• Atividade física (20-30%)</li>
                    <li>• Efeito térmico dos alimentos (10%)</li>
                    <li>• Atividades não-exercício (5-15%)</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingDown className="w-5 h-5 text-red-500" />
                  <span>Perda de Peso</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Para perder peso de forma saudável, é recomendado um deficit
                  calórico de 500-750 calorias por dia.
                </p>
                <div className="space-y-2">
                  <h4 className="font-semibold">Recomendações:</h4>
                  <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                    <li>• 0.5-1kg de perda por semana</li>
                    <li>• Combine dieta e exercícios</li>
                    <li>• Mantenha a massa muscular</li>
                    <li>• Seja consistente</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5 text-green-500" />
                  <span>Ganho de Peso</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Para ganhar peso de forma saudável, é recomendado um superávit
                  calórico de 300-500 calorias por dia.
                </p>
                <div className="space-y-2">
                  <h4 className="font-semibold">Recomendações:</h4>
                  <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                    <li>• 0.25-0.5kg de ganho por semana</li>
                    <li>• Foque em ganho de massa muscular</li>
                    <li>• Treine com pesos</li>
                    <li>• Consuma proteínas adequadas</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
