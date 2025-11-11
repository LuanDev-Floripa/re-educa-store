/**
 * SleepCalculator Component - RE-EDUCA Store
 * 
 * Calculadora de análise de sono e qualidade do descanso.
 * 
 * Funcionalidades:
 * - Análise de qualidade do sono
 * - Recomendações de horários ideais
 * - Análise de ciclo circadiano
 * - Dicas para melhorar o sono
 * 
 * @component
 * @returns {JSX.Element} Calculadora de sono
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
import { Calculator, Moon, Clock, Heart, Brain, Info } from "lucide-react";

export const SleepCalculator = () => {
  const { request, loading } = useApi();
  const [formData, setFormData] = useState({
    age: "",
    sleep_duration: "",
    sleep_quality: "",
    bedtime: "",
    wake_time: "",
  });

  const [results, setResults] = useState(null);

  const sleepQualityLevels = [
    {
      value: "poor",
      label: "Ruim",
      description: "Acordo cansado, sono fragmentado",
    },
    {
      value: "fair",
      label: "Regular",
      description: "Sono ok, mas poderia ser melhor",
    },
    {
      value: "good",
      label: "Bom",
      description: "Durmo bem na maioria das noites",
    },
    {
      value: "excellent",
      label: "Excelente",
      description: "Sono profundo e reparador",
    },
  ];

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const calculateSleep = async () => {
    try {
      const { age, sleep_duration, sleep_quality } = formData;

      if (!age || !sleep_duration || !sleep_quality) {
        toast.error("Por favor, preencha todos os campos obrigatórios");
        return;
      }

      if (!apiService?.health?.calculateSleep) {
        toast.error("Serviço de cálculo não disponível");
        return;
      }

      const response = await request(() =>
        apiService.health.calculateSleep({
          age: parseInt(age),
          sleep_duration: parseFloat(sleep_duration),
          sleep_quality,
          bedtime: formData.bedtime,
          wake_time: formData.wake_time,
        }),
      );

      if (response && (response.sleep_duration || response.sleep_quality)) {
        setResults({
          sleep_duration: response.sleep_duration || 0,
          sleep_quality: response.sleep_quality || "unknown",
          sleep_efficiency: response.sleep_efficiency || 0,
          recommendations: response.recommendations || [],
          saved: response.saved || false,
        });

        toast.success("Cálculo realizado e salvo com sucesso!");
      } else {
        throw new Error("Resposta inválida do servidor");
      }
    } catch (error) {
      logger.error("Erro ao calcular sono:", error);
      toast.error(error?.message || "Erro ao calcular sono. Tente novamente.");
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center space-x-3 mb-4">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Moon className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Calculadora de Sono
            </h1>
            <p className="text-muted-foreground dark:text-muted-foreground">
              Analise sua qualidade de sono e receba recomendações
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Formulário */}
        <Card>
          <CardHeader>
            <CardTitle>Informações do Sono</CardTitle>
            <CardDescription>Dados sobre seus hábitos de sono</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
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
              <Label htmlFor="sleep_duration">Duração do Sono (horas) *</Label>
              <Input
                id="sleep_duration"
                type="number"
                step="0.5"
                placeholder="Ex: 8.0"
                value={formData.sleep_duration}
                onChange={(e) =>
                  handleInputChange("sleep_duration", e.target.value)
                }
              />
            </div>

            <div>
              <Label htmlFor="sleep_quality">Qualidade do Sono *</Label>
              <Select
                value={formData.sleep_quality}
                onValueChange={(value) =>
                  handleInputChange("sleep_quality", value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a qualidade" />
                </SelectTrigger>
                <SelectContent>
                  {sleepQualityLevels.map((level) => (
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

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="bedtime">Horário de Dormir</Label>
                <Input
                  id="bedtime"
                  type="time"
                  value={formData.bedtime}
                  onChange={(e) => handleInputChange("bedtime", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="wake_time">Horário de Acordar</Label>
                <Input
                  id="wake_time"
                  type="time"
                  value={formData.wake_time}
                  onChange={(e) =>
                    handleInputChange("wake_time", e.target.value)
                  }
                />
              </div>
            </div>

            <Button
              onClick={calculateSleep}
              className="w-full bg-primary hover:bg-primary/90"
              disabled={loading}
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <Calculator className="w-4 h-4 mr-2" />
              )}
              {loading ? "Calculando..." : "Analisar Sono"}
            </Button>
          </CardContent>
        </Card>

        {/* Resultados */}
        <Card>
          <CardHeader>
            <CardTitle>Análise do Sono</CardTitle>
            <CardDescription>Sua qualidade de sono analisada</CardDescription>
          </CardHeader>
          <CardContent>
            {results ? (
              <div className="space-y-6">
                {/* Duração */}
                <div className="text-center p-6 bg-gradient-primary-purple/10 rounded-lg">
                  <Clock className="w-12 h-12 text-primary mx-auto mb-2" />
                  <div className="text-3xl font-bold text-primary mb-1">
                    {results.sleep_duration}h
                  </div>
                  <div className="text-sm text-muted-foreground dark:text-muted-foreground">
                    Duração do Sono
                  </div>
                </div>

                {/* Qualidade */}
                <div className="text-center p-6 bg-gradient-info/10 rounded-lg">
                  <Moon className="w-12 h-12 text-primary mx-auto mb-2" />
                  <div className="text-2xl font-bold text-primary mb-1 capitalize">
                    {results.sleep_quality}
                  </div>
                  <div className="text-sm text-muted-foreground dark:text-muted-foreground">
                    Qualidade do Sono
                  </div>
                </div>

                {/* Eficiência */}
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="text-lg font-semibold mb-1">
                    Eficiência: {(results.sleep_efficiency * 100).toFixed(0)}%
                  </div>
                  <div className="text-sm text-muted-foreground dark:text-muted-foreground">
                    Baseada na qualidade e duração
                  </div>
                </div>

                {/* Recomendações */}
                <div className="p-4 bg-primary/10 rounded-lg">
                  <h4 className="font-semibold text-primary mb-2">
                    💡 Recomendações
                  </h4>
                  <ul className="text-sm text-primary space-y-1">
                    {results.recommendations.map((rec, index) => (
                      <li key={index}>• {rec}</li>
                    ))}
                  </ul>
                </div>

                {/* Dicas Gerais */}
                <div className="p-4 bg-primary/10 rounded-lg">
                  <h4 className="font-semibold text-primary mb-2">
                    🌙 Dicas para Melhor Sono
                  </h4>
                  <ul className="text-sm text-primary space-y-1">
                    <li>• Mantenha horários regulares de dormir e acordar</li>
                    <li>• Evite cafeína 6 horas antes de dormir</li>
                    <li>• Crie um ambiente escuro e silencioso</li>
                    <li>• Evite telas 1 hora antes de dormir</li>
                  </ul>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <Moon className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Analise seu sono
                </h3>
                <p className="text-muted-foreground dark:text-muted-foreground">
                  Preencha o formulário ao lado para ver sua análise
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
