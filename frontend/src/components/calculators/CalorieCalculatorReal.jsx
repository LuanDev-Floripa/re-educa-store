/**
 * CalorieCalculatorReal Component - RE-EDUCA Store
 * 
 * Versão real/otimizada da calculadora de calorias.
 * 
 * Funcionalidades:
 * - Cálculo de calorias usando hook useHealthTools
 * - Cálculo de macronutrientes
 * - Recomendações personalizadas
 * - Callback opcional para integração
 * 
 * @component
 * @param {Object} props - Props do componente
 * @param {Function} [props.onCalculationComplete] - Callback após cálculo
 * @param {boolean} [props.showMacros=true] - Mostrar macronutrientes
 * @param {boolean} [props.showRecommendations=true] - Mostrar recomendações
 * @returns {JSX.Element} Calculadora de calorias otimizada
 */
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../Ui/card";
import { Button } from "../Ui/button";
import { Input } from "../Ui/input";
import { Label } from "../Ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../Ui/select";
import { Badge } from "../Ui/badge";
import { Progress } from "../Ui/progress";
import { useHealthTools } from "../../hooks/useHealthTools";
import {
  Calculator,
  Target,
  Activity,
  Heart,
  Zap,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Info,
} from "lucide-react";

const CalorieCalculatorReal = ({
  onCalculationComplete,
  showMacros = true,
  showRecommendations = true,
}) => {
  const { calculateCalories, calculateMacros, loading, error } =
    useHealthTools();

  const [formData, setFormData] = useState({
    age: "",
    gender: "",
    weight: "",
    height: "",
    activityLevel: "",
    goal: "",
  });

  const [result, setResult] = useState(null);
  const [macros, setMacros] = useState(null);
  const [showResult, setShowResult] = useState(false);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleCalculate = async () => {
    if (
      !formData.age ||
      !formData.gender ||
      !formData.weight ||
      !formData.height ||
      !formData.activityLevel ||
      !formData.goal
    ) {
      return;
    }

    try {
      // Calcula calorias
      const calorieResult = await calculateCalories(
        parseInt(formData.age),
        formData.gender,
        parseFloat(formData.weight),
        parseFloat(formData.height),
        formData.activityLevel,
        formData.goal,
      );

      if (calorieResult.success) {
        setResult(calorieResult.data);
        setShowResult(true);

        // Calcula macros se habilitado
        if (showMacros) {
          const macroResult = await calculateMacros(
            calorieResult.data.calories,
            formData.goal,
          );
          if (macroResult.success) {
            setMacros(macroResult.data);
          }
        }

        if (onCalculationComplete) {
          onCalculationComplete(calorieResult.data);
        }
      }
    } catch (err) {
      console.error("Erro ao calcular calorias:", err);
    }
  };

  const getActivityMultiplier = (level) => {
    const multipliers = {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      active: 1.725,
      very_active: 1.9,
    };
    return multipliers[level] || 1.2;
  };

  const getGoalDescription = (goal) => {
    const descriptions = {
      lose: "Perda de peso (déficit calórico)",
      maintain: "Manutenção do peso",
      gain: "Ganho de peso (superávit calórico)",
    };
    return descriptions[goal] || "Manutenção do peso";
  };

  const getActivityDescription = (level) => {
    const descriptions = {
      sedentary: "Sedentário (pouco ou nenhum exercício)",
      light: "Leve (exercício leve 1-3 dias/semana)",
      moderate: "Moderado (exercício moderado 3-5 dias/semana)",
      active: "Ativo (exercício intenso 6-7 dias/semana)",
      very_active: "Muito ativo (exercício muito intenso, trabalho físico)",
    };
    return descriptions[level] || "Sedentário";
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calculator className="w-6 h-6 mr-2" />
            Calculadora de Calorias
          </CardTitle>
          <p className="text-gray-600">
            Calcule suas necessidades calóricas diárias baseadas em seus dados
            pessoais
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Formulário */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="age">Idade</Label>
              <Input
                id="age"
                type="number"
                value={formData.age}
                onChange={(e) => handleInputChange("age", e.target.value)}
                placeholder="Sua idade"
                min="1"
                max="120"
              />
            </div>

            <div>
              <Label htmlFor="gender">Gênero</Label>
              <Select
                value={formData.gender}
                onValueChange={(value) => handleInputChange("gender", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione seu gênero" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Masculino</SelectItem>
                  <SelectItem value="female">Feminino</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="weight">Peso (kg)</Label>
              <Input
                id="weight"
                type="number"
                value={formData.weight}
                onChange={(e) => handleInputChange("weight", e.target.value)}
                placeholder="Seu peso em kg"
                min="1"
                step="0.1"
              />
            </div>

            <div>
              <Label htmlFor="height">Altura (cm)</Label>
              <Input
                id="height"
                type="number"
                value={formData.height}
                onChange={(e) => handleInputChange("height", e.target.value)}
                placeholder="Sua altura em cm"
                min="50"
                max="250"
              />
            </div>

            <div>
              <Label htmlFor="activityLevel">Nível de Atividade</Label>
              <Select
                value={formData.activityLevel}
                onValueChange={(value) =>
                  handleInputChange("activityLevel", value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione seu nível de atividade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sedentary">Sedentário</SelectItem>
                  <SelectItem value="light">Leve</SelectItem>
                  <SelectItem value="moderate">Moderado</SelectItem>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="very_active">Muito Ativo</SelectItem>
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
                  <SelectItem value="lose">Perder Peso</SelectItem>
                  <SelectItem value="maintain">Manter Peso</SelectItem>
                  <SelectItem value="gain">Ganhar Peso</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Botão de Cálculo */}
          <div className="flex justify-center">
            <Button
              onClick={handleCalculate}
              disabled={
                loading ||
                !formData.age ||
                !formData.gender ||
                !formData.weight ||
                !formData.height ||
                !formData.activityLevel ||
                !formData.goal
              }
              className="px-8"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Calculando...
                </>
              ) : (
                <>
                  <Calculator className="w-4 h-4 mr-2" />
                  Calcular Calorias
                </>
              )}
            </Button>
          </div>

          {/* Resultado */}
          {showResult && result && (
            <div className="mt-8 space-y-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                  <h3 className="text-lg font-semibold text-green-800">
                    Resultado do Cálculo
                  </h3>
                </div>
              </div>

              {/* Calorias Principais */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="flex items-center justify-center mb-2">
                      <Zap className="w-8 h-8 text-yellow-500" />
                    </div>
                    <h4 className="font-semibold text-lg">{result.calories}</h4>
                    <p className="text-sm text-gray-600">Calorias Diárias</p>
                    <Badge variant="secondary" className="mt-2">
                      {getGoalDescription(formData.goal)}
                    </Badge>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="flex items-center justify-center mb-2">
                      <Activity className="w-8 h-8 text-blue-500" />
                    </div>
                    <h4 className="font-semibold text-lg">{result.bmr}</h4>
                    <p className="text-sm text-gray-600">
                      Taxa Metabólica Basal
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Calorias em repouso
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="flex items-center justify-center mb-2">
                      <TrendingUp className="w-8 h-8 text-green-500" />
                    </div>
                    <h4 className="font-semibold text-lg">{result.tdee}</h4>
                    <p className="text-sm text-gray-600">Gasto Total Diário</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Multiplicador:{" "}
                      {getActivityMultiplier(formData.activityLevel)}x
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Macros */}
              {showMacros && macros && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Target className="w-5 h-5 mr-2" />
                      Distribuição de Macronutrientes
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center">
                        <div className="flex items-center justify-center mb-2">
                          <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                            <span className="text-red-600 font-bold text-sm">
                              P
                            </span>
                          </div>
                        </div>
                        <h4 className="font-semibold text-lg">
                          {macros.protein}g
                        </h4>
                        <p className="text-sm text-gray-600">Proteínas</p>
                        <p className="text-xs text-gray-500">
                          {macros.protein_percentage}%
                        </p>
                        <Progress
                          value={macros.protein_percentage}
                          className="mt-2"
                        />
                      </div>

                      <div className="text-center">
                        <div className="flex items-center justify-center mb-2">
                          <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                            <span className="text-yellow-600 font-bold text-sm">
                              C
                            </span>
                          </div>
                        </div>
                        <h4 className="font-semibold text-lg">
                          {macros.carbs}g
                        </h4>
                        <p className="text-sm text-gray-600">Carboidratos</p>
                        <p className="text-xs text-gray-500">
                          {macros.carbs_percentage}%
                        </p>
                        <Progress
                          value={macros.carbs_percentage}
                          className="mt-2"
                        />
                      </div>

                      <div className="text-center">
                        <div className="flex items-center justify-center mb-2">
                          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                            <span className="text-green-600 font-bold text-sm">
                              G
                            </span>
                          </div>
                        </div>
                        <h4 className="font-semibold text-lg">{macros.fat}g</h4>
                        <p className="text-sm text-gray-600">Gorduras</p>
                        <p className="text-xs text-gray-500">
                          {macros.fat_percentage}%
                        </p>
                        <Progress
                          value={macros.fat_percentage}
                          className="mt-2"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Recomendações */}
              {showRecommendations && result.recommendations && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Info className="w-5 h-5 mr-2" />
                      Recomendações
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {result.recommendations.map((rec, index) => (
                        <div
                          key={index}
                          className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg"
                        >
                          <Heart className="w-5 h-5 text-blue-600 mt-0.5" />
                          <div>
                            <p className="font-medium text-blue-900">
                              {rec.title}
                            </p>
                            <p className="text-sm text-blue-700">
                              {rec.description}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Informações Adicionais */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Info className="w-5 h-5 mr-2" />
                    Informações do Cálculo
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p>
                        <strong>Nível de Atividade:</strong>{" "}
                        {getActivityDescription(formData.activityLevel)}
                      </p>
                      <p>
                        <strong>Objetivo:</strong>{" "}
                        {getGoalDescription(formData.goal)}
                      </p>
                    </div>
                    <div>
                      <p>
                        <strong>Fórmula Utilizada:</strong>{" "}
                        {result.formula || "Harris-Benedict"}
                      </p>
                      <p>
                        <strong>Data do Cálculo:</strong>{" "}
                        {new Date().toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Mensagem de Erro */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
                <p className="text-red-800">{error}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CalorieCalculatorReal;
