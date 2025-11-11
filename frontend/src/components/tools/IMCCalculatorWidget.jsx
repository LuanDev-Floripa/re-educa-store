import React, { useState } from "react";
/**
 * Widget de calculadora de IMC.
 * - Valida entradas e classifica resultado com rótulos e dicas
 */
import { Button } from "@/components/Ui/button";
import { Input } from "@/components/Ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/Ui/card";
import { Badge } from "@/components/Ui/badge";
import {
  Calculator,
  TrendingUp,
  TrendingDown,
  Target,
  Info,
} from "lucide-react";

const IMCCalculatorWidget = () => {
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [result, setResult] = useState(null);
  const [showResult, setShowResult] = useState(false);

  const calculateIMC = (weight, height) => {
    const weightNum = parseFloat(weight);
    const heightNum = parseFloat(height);

    if (weightNum > 0 && heightNum > 0) {
      const heightInMeters = heightNum / 100;
      const imc = weightNum / (heightInMeters * heightInMeters);
      return imc;
    }
    return null;
  };

  const classifyIMC = (imc) => {
    if (imc < 18.5) {
      return {
        category: "Abaixo do peso",
        color: "bg-primary/10 text-primary",
        icon: <TrendingDown className="w-4 h-4" />,
        description:
          "Consulte um profissional de saúde para orientações sobre ganho de peso saudável.",
      };
    } else if (imc >= 18.5 && imc < 25) {
      return {
        category: "Peso normal",
        color: "bg-primary/10 text-primary",
        icon: <Target className="w-4 h-4" />,
        description:
          "Parabéns! Você está dentro da faixa de peso considerada saudável.",
      };
    } else if (imc >= 25 && imc < 30) {
      return {
        category: "Sobrepeso",
        color: "bg-primary/10 text-primary",
        icon: <TrendingUp className="w-4 h-4" />,
        description:
          "Considere ajustar sua alimentação e aumentar a atividade física.",
      };
    } else {
      return {
        category: "Obesidade",
        color: "bg-destructive/10 text-destructive",
        icon: <TrendingUp className="w-4 h-4" />,
        description:
          "Recomendamos consultar um profissional de saúde para orientações específicas.",
      };
    }
  };

  const handleCalculate = () => {
    const imc = calculateIMC(weight, height);
    if (imc) {
      setResult({
        imc: imc.toFixed(1),
        classification: classifyIMC(imc),
      });
      setShowResult(true);
    } else {
      setShowResult(false);
    }
  };

  const handleReset = () => {
    setWeight("");
    setHeight("");
    setResult(null);
    setShowResult(false);
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="flex items-center justify-center mb-2">
          <Calculator className="w-8 h-8 text-muted-foreground mr-2" />
          <CardTitle className="text-2xl font-bold text-foreground">
            Calculadora de IMC
          </CardTitle>
        </div>
        <CardDescription className="text-muted-foreground">
          Calcule seu Índice de Massa Corporal de forma rápida e gratuita
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Input Fields */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Peso (kg)
            </label>
            <Input
              type="number"
              placeholder="Ex: 70"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              className="w-full"
              min="1"
              max="300"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Altura (cm)
            </label>
            <Input
              type="number"
              placeholder="Ex: 175"
              value={height}
              onChange={(e) => setHeight(e.target.value)}
              className="w-full"
              min="50"
              max="250"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button
            onClick={handleCalculate}
            disabled={!weight || !height}
            className="flex-1"
          >
            <Calculator className="w-4 h-4 mr-2" />
            Calcular IMC
          </Button>

          {showResult && (
            <Button onClick={handleReset} variant="outline" className="flex-1">
              Limpar
            </Button>
          )}
        </div>

        {/* Result */}
        {showResult && result && (
          <div className="space-y-4 p-4 bg-muted rounded-lg">
            <div className="text-center">
              <div className="text-3xl font-bold text-foreground mb-2">
                {result.imc}
              </div>
              <div className="text-sm text-muted-foreground">
                Índice de Massa Corporal
              </div>
            </div>

            <div className="text-center">
              <Badge
                className={`inline-flex items-center gap-2 ${result.classification.color}`}
              >
                {result.classification.icon}
                {result.classification.category}
              </Badge>
            </div>

            <div className="text-sm text-muted-foreground text-center">
              {result.classification.description}
            </div>
          </div>
        )}

        {/* Info */}
        <div className="flex items-start gap-2 p-3 bg-primary/10 rounded-lg">
          <Info className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
          <div className="text-xs text-primary">
            <strong>Importante:</strong> O IMC é uma ferramenta de triagem e não
            substitui a avaliação de um profissional de saúde.
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default IMCCalculatorWidget;
