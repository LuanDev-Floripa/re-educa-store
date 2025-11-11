/**
 * MetabolismCalculator Component - RE-EDUCA Store
 * 
 * Calculadora de metabolismo (TMB e taxa metabólica).
 * 
 * Funcionalidades:
 * - Cálculo de Taxa Metabólica Basal (TMB)
 * - Análise de nível de atividade
 * - Estimativa de gasto calórico
 * - Recomendações para acelerar metabolismo
 * 
 * @component
 * @returns {JSX.Element} Calculadora de metabolismo
 */
import React, { useState } from "react";
import logger from "@/utils/logger";
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
import { useApi, apiService } from "../../lib/api";
import { toast } from "sonner";
import { Calculator, Activity, Flame, Heart, Zap, Info } from "lucide-react";

export const MetabolismCalculator = () => {
  const { request, loading } = useApi();
  const [formData, setFormData] = useState({
    age: "",
    gender: "",
    weight: "",
    height: "",
    activityLevel: "",
  });

  const [results, setResults] = useState(null);

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

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const calculateMetabolism = async () => {
    const { age, gender, weight, height, activityLevel } = formData;

    if (!age || !gender || !weight || !height || !activityLevel) {
      toast.error("Por favor, preencha todos os campos obrigatórios");
      return;
    }

    try {
      const response = await request(() =>
        apiService.health.calculateMetabolism({
          age: parseInt(age),
          gender,
          weight: parseFloat(weight),
          height: parseFloat(height),
          activity_level: activityLevel,
        }),
      );

      setResults({
        bmr: response.bmr,
        tdee: response.tdee,
        metabolism_type: response.metabolism_type,
        saved: response.saved,
      });

      toast.success("Cálculo realizado e salvo com sucesso!");
    } catch (error) {
      logger.error("Erro ao calcular metabolismo:", error);
      toast.error("Erro ao calcular metabolismo. Tente novamente.");
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center space-x-3 mb-4">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Activity className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Calculadora de Metabolismo
            </h1>
            <p className="text-muted-foreground dark:text-muted-foreground">
              Calcule sua taxa metabólica basal e gasto energético total
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Formulário */}
        <Card>
          <CardHeader>
            <CardTitle>Dados Pessoais</CardTitle>
            <CardDescription>
              Informações para calcular seu metabolismo
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
                  onValueChange={(value) => handleInputChange("gender", value)}
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
                  onChange={(e) => handleInputChange("weight", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="height">Altura (cm) *</Label>
                <Input
                  id="height"
                  type="number"
                  placeholder="Ex: 175"
                  value={formData.height}
                  onChange={(e) => handleInputChange("height", e.target.value)}
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
                        <div className="text-sm text-muted-foreground">
                          {level.description}
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={calculateMetabolism}
              className="w-full bg-primary hover:bg-primary/90"
              disabled={loading}
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <Calculator className="w-4 h-4 mr-2" />
              )}
              {loading ? "Calculando..." : "Calcular Metabolismo"}
            </Button>
          </CardContent>
        </Card>

        {/* Resultados */}
        <Card>
          <CardHeader>
            <CardTitle>Resultados</CardTitle>
            <CardDescription>Seu metabolismo calculado</CardDescription>
          </CardHeader>
          <CardContent>
            {results ? (
              <div className="space-y-6">
                {/* BMR */}
                <div className="text-center p-6 bg-gradient-primary-purple/10 rounded-lg">
                  <Heart className="w-12 h-12 text-primary mx-auto mb-2" />
                  <div className="text-3xl font-bold text-primary mb-1">
                    {results.bmr} cal
                  </div>
                  <div className="text-sm text-muted-foreground dark:text-muted-foreground">
                    Taxa Metabólica Basal (BMR)
                  </div>
                </div>

                {/* TDEE */}
                <div className="text-center p-6 bg-gradient-info/10 rounded-lg">
                  <Flame className="w-12 h-12 text-primary mx-auto mb-2" />
                  <div className="text-3xl font-bold text-primary mb-1">
                    {results.tdee} cal
                  </div>
                  <div className="text-sm text-muted-foreground dark:text-muted-foreground">
                    Gasto Energético Total (TDEE)
                  </div>
                </div>

                {/* Tipo de Metabolismo */}
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="text-lg font-semibold mb-1">
                    Tipo de Metabolismo: {results.metabolism_type}
                  </div>
                  <div className="text-sm text-muted-foreground dark:text-muted-foreground">
                    Baseado no seu TDEE
                  </div>
                </div>

                {/* Dicas */}
                <div className="p-4 bg-primary/10 rounded-lg">
                  <h4 className="font-semibold text-primary mb-2">
                    💡 Dicas Importantes
                  </h4>
                  <ul className="text-sm text-primary space-y-1">
                    <li>• BMR é a energia que seu corpo gasta em repouso</li>
                    <li>• TDEE inclui todas as atividades do dia</li>
                    <li>• Use o TDEE como base para suas calorias diárias</li>
                    <li>
                      • Monitore seu progresso e ajuste conforme necessário
                    </li>
                  </ul>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <Activity className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Calcule seu metabolismo
                </h3>
                <p className="text-muted-foreground dark:text-muted-foreground">
                  Preencha o formulário ao lado para ver seus resultados
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
