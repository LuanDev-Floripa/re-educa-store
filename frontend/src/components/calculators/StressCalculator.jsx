/**
 * StressCalculator Component - RE-EDUCA Store
 * 
 * Calculadora de nível de estresse baseada em fatores.
 * 
 * Funcionalidades:
 * - Avaliação de fatores de estresse
 * - Cálculo de nível de estresse
 * - Recomendações personalizadas
 * - Estratégias de gerenciamento
 * 
 * @component
 * @returns {JSX.Element} Calculadora de estresse
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
import { Badge } from "@/components/Ui/badge";
import { useApi, apiService } from "../../lib/api";
import { toast } from "sonner";
import {
  Calculator,
  Brain,
  Heart,
  AlertTriangle,
  CheckCircle,
  Info,
} from "lucide-react";

export const StressCalculator = () => {
  const { request, loading } = useApi();
  const [stressFactors, setStressFactors] = useState([]);
  const [results, setResults] = useState(null);

  const availableFactors = [
    { id: "work", name: "Pressão no Trabalho", severity: "medium" },
    { id: "financial", name: "Problemas Financeiros", severity: "high" },
    {
      id: "relationships",
      name: "Problemas de Relacionamento",
      severity: "medium",
    },
    { id: "health", name: "Preocupações com Saúde", severity: "high" },
    { id: "family", name: "Problemas Familiares", severity: "medium" },
    { id: "time", name: "Falta de Tempo", severity: "low" },
    { id: "social", name: "Isolamento Social", severity: "medium" },
    { id: "future", name: "Incerteza sobre o Futuro", severity: "high" },
    { id: "perfectionism", name: "Perfeccionismo", severity: "medium" },
    { id: "change", name: "Mudanças na Vida", severity: "medium" },
  ];

  const handleFactorToggle = (factor) => {
    setStressFactors((prev) => {
      const exists = prev.find((f) => f.id === factor.id);
      if (exists) {
        return prev.filter((f) => f.id !== factor.id);
      } else {
        return [...prev, factor];
      }
    });
  };

  const calculateStress = async () => {
    if (stressFactors.length === 0) {
      toast.error("Selecione pelo menos um fator de estresse");
      return;
    }

    try {
      const response = await request(() =>
        apiService.health.calculateStress({
          stress_factors: stressFactors,
        }),
      );

      setResults({
        stress_level: response.stress_level,
        stress_score: response.stress_score,
        coping_strategies: response.coping_strategies,
        recommendations: response.recommendations,
        saved: response.saved,
      });

      toast.success("Análise realizada e salva com sucesso!");
    } catch (error) {
      logger.error("Erro ao calcular estresse:", error);
      toast.error("Erro ao analisar estresse. Tente novamente.");
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case "high":
        return "bg-destructive/10 text-destructive border-destructive/20";
      case "medium":
        return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
      case "low":
        return "bg-primary/10 text-primary border-primary/20";
      default:
        return "bg-muted text-foreground border-border";
    }
  };

  const getSeverityLabel = (severity) => {
    switch (severity) {
      case "high":
        return "Alto";
      case "medium":
        return "Médio";
      case "low":
        return "Baixo";
      default:
        return "N/A";
    }
  };

  const getStressLevelColor = (level) => {
    switch (level) {
      case "Baixo":
        return "text-primary";
      case "Moderado":
        return "text-yellow-500";
      case "Alto":
        return "text-primary";
      case "Muito Alto":
        return "text-destructive";
      default:
        return "text-muted-foreground";
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center space-x-3 mb-4">
          <div className="p-2 bg-destructive/10 rounded-lg">
            <Brain className="w-6 h-6 text-destructive" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Calculadora de Estresse
            </h1>
            <p className="text-muted-foreground dark:text-muted-foreground">
              Analise seu nível de estresse e receba estratégias de coping
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Formulário */}
        <Card>
          <CardHeader>
            <CardTitle>Fatores de Estresse</CardTitle>
            <CardDescription>
              Selecione os fatores que estão causando estresse em sua vida
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              {availableFactors.map((factor) => {
                const isSelected = stressFactors.find(
                  (f) => f.id === factor.id,
                );
                return (
                  <div
                    key={factor.id}
                    onClick={() => handleFactorToggle(factor)}
                    className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      isSelected
                        ? "border-primary bg-primary/10"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{factor.name}</span>
                      <Badge
                        variant="outline"
                        className={getSeverityColor(factor.severity)}
                      >
                        {getSeverityLabel(factor.severity)}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-4">
              <p className="text-sm text-muted-foreground dark:text-muted-foreground mb-4">
                Fatores selecionados: {stressFactors.length}
              </p>

              <Button
                onClick={calculateStress}
                className="w-full bg-destructive hover:bg-destructive/90"
                disabled={loading || stressFactors.length === 0}
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : (
                  <Calculator className="w-4 h-4 mr-2" />
                )}
                {loading ? "Analisando..." : "Analisar Estresse"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Resultados */}
        <Card>
          <CardHeader>
            <CardTitle>Análise de Estresse</CardTitle>
            <CardDescription>
              Seu nível de estresse e recomendações
            </CardDescription>
          </CardHeader>
          <CardContent>
            {results ? (
              <div className="space-y-6">
                {/* Nível de Estresse */}
                <div className="text-center p-6 bg-gradient-error-orange/10 rounded-lg">
                  <AlertTriangle className="w-12 h-12 text-destructive mx-auto mb-2" />
                  <div
                    className={`text-3xl font-bold mb-1 ${getStressLevelColor(results.stress_level)}`}
                  >
                    {results.stress_level}
                  </div>
                  <div className="text-sm text-muted-foreground dark:text-muted-foreground">
                    Nível de Estresse
                  </div>
                </div>

                {/* Score */}
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="text-2xl font-bold mb-1">
                    {results.stress_score}/20
                  </div>
                  <div className="text-sm text-muted-foreground dark:text-muted-foreground">
                    Score de Estresse
                  </div>
                </div>

                {/* Estratégias de Coping */}
                <div className="p-4 bg-primary/10 rounded-lg">
                  <h4 className="font-semibold text-primary mb-3 flex items-center gap-2">
                    <Heart className="w-5 h-5" />
                    Estratégias de Coping
                  </h4>
                  <ul className="text-sm text-primary space-y-2">
                    {results.coping_strategies.map((strategy, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        {strategy}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Recomendações */}
                <div className="p-4 bg-primary/10 rounded-lg">
                  <h4 className="font-semibold text-primary mb-3 flex items-center gap-2">
                    <Info className="w-5 h-5" />
                    Recomendações
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
                    🧘 Dicas para Gerenciar Estresse
                  </h4>
                  <ul className="text-sm text-primary space-y-1">
                    <li>• Pratique respiração profunda diariamente</li>
                    <li>• Mantenha uma rotina de exercícios</li>
                    <li>• Conecte-se com pessoas queridas</li>
                    <li>• Reserve tempo para atividades prazerosas</li>
                    <li>• Considere meditação ou mindfulness</li>
                  </ul>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <Brain className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Analise seu estresse
                </h3>
                <p className="text-muted-foreground dark:text-muted-foreground">
                  Selecione os fatores de estresse ao lado para ver sua análise
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
