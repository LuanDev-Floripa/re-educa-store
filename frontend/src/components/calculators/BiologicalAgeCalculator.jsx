/**
 * BiologicalAgeCalculator Component - RE-EDUCA Store
 * 
 * Calculadora de idade biológica baseada em múltiplos fatores.
 * 
 * Funcionalidades:
 * - Cálculo de idade biológica vs cronológica
 * - Análise de múltiplos fatores (condições, hábitos, etc.)
 * - Recomendações personalizadas
 * - Histórico de cálculos
 * 
 * @component
 * @returns {JSX.Element} Calculadora de idade biológica
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/Ui/tabs";
import { Badge } from "@/components/Ui/badge";
import { Progress } from "@/components/Ui/progress";
import { useApi, apiService } from "../../lib/api";
import { toast } from "sonner";
import {
  Calculator,
  Clock,
  Heart,
  Brain,
  Activity,
  Moon,
  Sun,
  Target,
  Info,
  AlertTriangle,
  CheckCircle,
  Zap,
  Shield,
  TrendingUp,
  TrendingDown,
  Calendar,
  Award,
  Flame,
  Droplets,
  Smile,
  Frown,
} from "lucide-react";

export const BiologicalAgeCalculator = () => {
  const { request, loading } = useApi();
  const [formData, setFormData] = useState({
    age: "",
    gender: "",
    weight: "",
    height: "",
    bodyFat: "",
    muscleMass: "",
    flexibility: "",
    balance: "",
    reactionTime: "",
    cardiovascularFitness: "",
    strength: "",
    endurance: "",
    sleepQuality: "",
    stressLevel: "",
    dietQuality: "",
    hydration: "",
    exerciseFrequency: "",
    smoking: "",
    alcohol: "",
    chronicDiseases: [],
    medications: [],
    familyHistory: [],
    lifestyleFactors: [],
    biomarkers: {
      bloodPressure: "",
      cholesterol: "",
      bloodSugar: "",
      inflammation: "",
      vitaminD: "",
      omega3: "",
    },
  });

  const [results, setResults] = useState(null);
  const [activeTab, setActiveTab] = useState("calculator");

  const fitnessLevels = [
    {
      value: "poor",
      label: "Ruim",
      factor: 1.3,
      description: "Sedentário, sem exercícios",
    },
    {
      value: "below_average",
      label: "Abaixo da Média",
      factor: 1.2,
      description: "Exercício ocasional",
    },
    {
      value: "average",
      label: "Média",
      factor: 1.0,
      description: "Exercício regular moderado",
    },
    {
      value: "good",
      label: "Boa",
      factor: 0.9,
      description: "Exercício regular intenso",
    },
    {
      value: "excellent",
      label: "Excelente",
      factor: 0.8,
      description: "Atleta ou muito ativo",
    },
  ];

  const qualityLevels = [
    { value: "poor", label: "Ruim", factor: 1.2 },
    { value: "fair", label: "Regular", factor: 1.1 },
    { value: "good", label: "Boa", factor: 1.0 },
    { value: "excellent", label: "Excelente", factor: 0.9 },
  ];

  const stressLevels = [
    { value: "low", label: "Baixo", factor: 0.9 },
    { value: "moderate", label: "Moderado", factor: 1.0 },
    { value: "high", label: "Alto", factor: 1.1 },
    { value: "severe", label: "Severo", factor: 1.2 },
  ];

  const chronicDiseases = [
    { value: "diabetes", label: "Diabetes", factor: 1.3 },
    { value: "hypertension", label: "Hipertensão", factor: 1.2 },
    { value: "heart_disease", label: "Doença Cardíaca", factor: 1.4 },
    { value: "cancer", label: "Câncer", factor: 1.5 },
    { value: "arthritis", label: "Artrite", factor: 1.1 },
    { value: "osteoporosis", label: "Osteoporose", factor: 1.2 },
    { value: "depression", label: "Depressão", factor: 1.1 },
    { value: "anxiety", label: "Ansiedade", factor: 1.1 },
  ];

  const medications = [
    { value: "blood_pressure", label: "Pressão Arterial", factor: 1.1 },
    { value: "cholesterol", label: "Colesterol", factor: 1.1 },
    { value: "diabetes", label: "Diabetes", factor: 1.2 },
    { value: "antidepressants", label: "Antidepressivos", factor: 1.05 },
    { value: "pain_medication", label: "Analgésicos", factor: 1.1 },
    { value: "hormone_therapy", label: "Terapia Hormonal", factor: 1.05 },
  ];

  const familyHistory = [
    { value: "heart_disease", label: "Doença Cardíaca", factor: 1.1 },
    { value: "diabetes", label: "Diabetes", factor: 1.1 },
    { value: "cancer", label: "Câncer", factor: 1.1 },
    { value: "alzheimer", label: "Alzheimer", factor: 1.1 },
    { value: "osteoporosis", label: "Osteoporose", factor: 1.05 },
  ];

  const lifestyleFactors = [
    { value: "smoking", label: "Tabagismo", factor: 1.3 },
    { value: "excessive_alcohol", label: "Álcool Excessivo", factor: 1.2 },
    { value: "poor_diet", label: "Alimentação Ruim", factor: 1.2 },
    { value: "sedentary", label: "Vida Sedentária", factor: 1.2 },
    { value: "chronic_stress", label: "Estresse Crônico", factor: 1.1 },
    { value: "poor_sleep", label: "Sono Ruim", factor: 1.1 },
    { value: "dehydration", label: "Desidratação", factor: 1.1 },
    { value: "sun_exposure", label: "Exposição Solar Excessiva", factor: 1.1 },
  ];

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleBiomarkerChange = (biomarker, value) => {
    setFormData((prev) => ({
      ...prev,
      biomarkers: {
        ...prev.biomarkers,
        [biomarker]: value,
      },
    }));
  };

  const handleArrayChange = (field, value, checked) => {
    setFormData((prev) => ({
      ...prev,
      [field]: checked
        ? [...prev[field], value]
        : prev[field].filter((item) => item !== value),
    }));
  };

  const calculateBiologicalAge = async () => {
    const {
      age,
      gender,
      weight,
      height,
      bodyFat,
      muscleMass,
      cardiovascularFitness,
      strength,
      endurance,
      sleepQuality,
      stressLevel,
      dietQuality,
      hydration,
      exerciseFrequency,
      smoking,
      alcohol,
      chronicDiseases,
      medications,
      familyHistory,
      lifestyleFactors,
      biomarkers,
    } = formData;

    if (!age || !gender || !weight || !height) {
      toast.error("Por favor, preencha os campos obrigatórios");
      return;
    }

    try {
      // Enviar dados para o backend - TODA a lógica de cálculo está no backend
      const response = await request(() =>
        apiService.health.calculateBiologicalAge({
          age: parseInt(age),
          gender,
          weight: parseFloat(weight),
          height: parseFloat(height),
          factors: {
            cardiovascularFitness,
            strength,
            endurance,
            sleepQuality,
            stressLevel,
            dietQuality,
            hydration,
            exerciseFrequency,
            smoking,
            alcohol,
          },
          chronicDiseases,
          medications,
          familyHistory,
          lifestyleFactors,
          biomarkers: {
            bodyFat,
            muscleMass,
            ...biomarkers,
          },
        }),
      );

      // Determinar cor e mensagem baseado na resposta do backend
      const ageDifference = response.age_difference;
      let color = "blue";
      let message = "Sua idade biológica está próxima da cronológica.";

      if (ageDifference <= -5) {
        color = "green";
        message =
          "Parabéns! Você está biologicamente mais jovem que sua idade cronológica.";
      } else if (ageDifference <= -2) {
        color = "green";
        message =
          "Você está biologicamente mais jovem que sua idade cronológica.";
      } else if (ageDifference >= 5) {
        color = "red";
        message =
          "Sua idade biológica está significativamente acima da cronológica.";
      } else if (ageDifference >= 2) {
        color = "orange";
        message = "Sua idade biológica está um pouco acima da cronológica.";
      }

      // Fatores que mais impactam (identificados localmente para display)
      const impactFactors = identifyImpactFactors(
        cardiovascularFitness,
        strength,
        sleepQuality,
        dietQuality,
        chronicDiseases,
        lifestyleFactors,
        smoking,
        alcohol,
      );

      setResults({
        chronologicalAge: response.chronological_age,
        biologicalAge: response.biological_age,
        ageDifference: response.age_difference,
        ageRatio: response.biological_age / response.chronological_age,
        classification: response.classification,
        color,
        message,
        recommendations: response.recommendations || [],
        impactFactors,
        score: response.score,
        saved: response.saved,
      });

      toast.success("Cálculo realizado e salvo com sucesso!");
    } catch (error) {
      console.error("Erro ao calcular idade biológica:", error);
      toast.error("Erro ao calcular idade biológica. Tente novamente.");
    }
  };

  // Funções removidas - toda lógica de cálculo foi movida para o backend
  // calculateBiomarkerFactors e generateRecommendations agora são calculadas no backend

  const identifyImpactFactors = (
    cardio,
    strength,
    sleep,
    diet,
    diseases,
    lifestyle,
    smoking,
    alcohol,
  ) => {
    const factors = [];

    if (cardio === "poor" || cardio === "below_average") {
      factors.push({
        name: "Fitness Cardiovascular",
        impact: "Alto",
        priority: "Alta",
      });
    }

    if (smoking === "yes") {
      factors.push({
        name: "Tabagismo",
        impact: "Muito Alto",
        priority: "Crítica",
      });
    } else if (smoking === "former") {
      factors.push({
        name: "Ex-tabagismo",
        impact: "Moderado",
        priority: "Média",
      });
    }

    if (alcohol === "heavy") {
      factors.push({
        name: "Consumo Excessivo de Álcool",
        impact: "Alto",
        priority: "Alta",
      });
    } else if (alcohol === "moderate") {
      factors.push({
        name: "Consumo Moderado de Álcool",
        impact: "Baixo",
        priority: "Baixa",
      });
    }

    if (strength === "poor" || strength === "below_average") {
      factors.push({
        name: "Força Muscular",
        impact: "Médio",
        priority: "Alta",
      });
    }

    if (sleep === "poor" || sleep === "fair") {
      factors.push({
        name: "Qualidade do Sono",
        impact: "Alto",
        priority: "Alta",
      });
    }

    if (diet === "poor" || diet === "fair") {
      factors.push({
        name: "Qualidade da Dieta",
        impact: "Alto",
        priority: "Alta",
      });
    }

    if (diseases.length > 0) {
      factors.push({
        name: "Doenças Crônicas",
        impact: "Muito Alto",
        priority: "Crítica",
      });
    }

    if (lifestyle.includes("smoking")) {
      factors.push({
        name: "Tabagismo",
        impact: "Muito Alto",
        priority: "Crítica",
      });
    }

    if (lifestyle.includes("sedentary")) {
      factors.push({
        name: "Vida Sedentária",
        impact: "Alto",
        priority: "Alta",
      });
    }

    if (lifestyle.includes("chronic_stress")) {
      factors.push({
        name: "Estresse Crônico",
        impact: "Médio",
        priority: "Média",
      });
    }

    return factors;
  };

  const getScoreColor = (score) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-blue-600";
    if (score >= 40) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreBgColor = (score) => {
    if (score >= 80) return "bg-green-100 dark:bg-green-900/20";
    if (score >= 60) return "bg-blue-100 dark:bg-blue-900/20";
    if (score >= 40) return "bg-yellow-100 dark:bg-yellow-900/20";
    return "bg-red-100 dark:bg-red-900/20";
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center space-x-3 mb-4">
          <div className="p-2 bg-emerald-100 dark:bg-emerald-900 rounded-lg">
            <Clock className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Calculadora de Idade Biológica
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Descubra sua verdadeira idade baseada na saúde e estilo de vida
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
                <CardTitle>Avaliação de Idade Biológica</CardTitle>
                <CardDescription>
                  Informações sobre sua saúde e estilo de vida
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Dados básicos */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="age">Idade Cronológica *</Label>
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

                {/* Fitness */}
                <div>
                  <h4 className="font-semibold mb-3">
                    Fitness e Capacidade Física
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <Label>Fitness Cardiovascular</Label>
                      <Select
                        value={formData.cardiovascularFitness}
                        onValueChange={(value) =>
                          handleInputChange("cardiovascularFitness", value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          {fitnessLevels.map((level) => (
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
                      <Label>Força Muscular</Label>
                      <Select
                        value={formData.strength}
                        onValueChange={(value) =>
                          handleInputChange("strength", value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          {fitnessLevels.map((level) => (
                            <SelectItem key={level.value} value={level.value}>
                              {level.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Resistência</Label>
                      <Select
                        value={formData.endurance}
                        onValueChange={(value) =>
                          handleInputChange("endurance", value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          {fitnessLevels.map((level) => (
                            <SelectItem key={level.value} value={level.value}>
                              {level.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Estilo de vida */}
                <div>
                  <h4 className="font-semibold mb-3">Estilo de Vida</h4>
                  <div className="space-y-3">
                    <div>
                      <Label>Qualidade do Sono</Label>
                      <Select
                        value={formData.sleepQuality}
                        onValueChange={(value) =>
                          handleInputChange("sleepQuality", value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          {qualityLevels.map((level) => (
                            <SelectItem key={level.value} value={level.value}>
                              {level.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Qualidade da Dieta</Label>
                      <Select
                        value={formData.dietQuality}
                        onValueChange={(value) =>
                          handleInputChange("dietQuality", value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          {qualityLevels.map((level) => (
                            <SelectItem key={level.value} value={level.value}>
                              {level.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Nível de Estresse</Label>
                      <Select
                        value={formData.stressLevel}
                        onValueChange={(value) =>
                          handleInputChange("stressLevel", value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          {stressLevels.map((level) => (
                            <SelectItem key={level.value} value={level.value}>
                              {level.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Fatores de risco */}
                <div>
                  <h4 className="font-semibold mb-3">Fatores de Risco</h4>
                  <div className="space-y-3">
                    <div>
                      <Label>Tabagismo</Label>
                      <Select
                        value={formData.smoking}
                        onValueChange={(value) =>
                          handleInputChange("smoking", value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="never">Nunca fumou</SelectItem>
                          <SelectItem value="former">Ex-fumante</SelectItem>
                          <SelectItem value="yes">Fumante atual</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Consumo de Álcool</Label>
                      <Select
                        value={formData.alcohol}
                        onValueChange={(value) =>
                          handleInputChange("alcohol", value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Não bebe</SelectItem>
                          <SelectItem value="light">
                            Leve (1-2 doses/dia)
                          </SelectItem>
                          <SelectItem value="moderate">
                            Moderado (3-4 doses/dia)
                          </SelectItem>
                          <SelectItem value="heavy">
                            Pesado (5+ doses/dia)
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Doenças crônicas */}
                <div>
                  <h4 className="font-semibold mb-3">Doenças Crônicas</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {chronicDiseases.map((disease) => (
                      <label
                        key={disease.value}
                        className="flex items-center space-x-2"
                      >
                        <input
                          type="checkbox"
                          checked={formData.chronicDiseases.includes(
                            disease.value,
                          )}
                          onChange={(e) =>
                            handleArrayChange(
                              "chronicDiseases",
                              disease.value,
                              e.target.checked,
                            )
                          }
                          className="rounded"
                        />
                        <span className="text-sm">{disease.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Medicamentos */}
                <div>
                  <h4 className="font-semibold mb-3">Medicamentos Atuais</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {medications.map((medication) => (
                      <label
                        key={medication.value}
                        className="flex items-center space-x-2"
                      >
                        <input
                          type="checkbox"
                          checked={formData.medications.includes(
                            medication.value,
                          )}
                          onChange={(e) =>
                            handleArrayChange(
                              "medications",
                              medication.value,
                              e.target.checked,
                            )
                          }
                          className="rounded"
                        />
                        <span className="text-sm">{medication.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Histórico familiar */}
                <div>
                  <h4 className="font-semibold mb-3">Histórico Familiar</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {familyHistory.map((history) => (
                      <label
                        key={history.value}
                        className="flex items-center space-x-2"
                      >
                        <input
                          type="checkbox"
                          checked={formData.familyHistory.includes(
                            history.value,
                          )}
                          onChange={(e) =>
                            handleArrayChange(
                              "familyHistory",
                              history.value,
                              e.target.checked,
                            )
                          }
                          className="rounded"
                        />
                        <span className="text-sm">{history.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Fatores de estilo de vida */}
                <div>
                  <h4 className="font-semibold mb-3">
                    Fatores de Estilo de Vida
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    {lifestyleFactors.map((factor) => (
                      <label
                        key={factor.value}
                        className="flex items-center space-x-2"
                      >
                        <input
                          type="checkbox"
                          checked={formData.lifestyleFactors.includes(
                            factor.value,
                          )}
                          onChange={(e) =>
                            handleArrayChange(
                              "lifestyleFactors",
                              factor.value,
                              e.target.checked,
                            )
                          }
                          className="rounded"
                        />
                        <span className="text-sm">{factor.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Biomarcadores */}
                <div>
                  <h4 className="font-semibold mb-3">Biomarcadores</h4>
                  <div className="space-y-3">
                    <div>
                      <Label>Gordura Corporal (%)</Label>
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="15.0"
                        value={formData.biomarkers.bodyFat}
                        onChange={(e) =>
                          handleBiomarkerChange("bodyFat", e.target.value)
                        }
                      />
                    </div>
                    <div>
                      <Label>Massa Muscular (kg)</Label>
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="35.0"
                        value={formData.biomarkers.muscleMass}
                        onChange={(e) =>
                          handleBiomarkerChange("muscleMass", e.target.value)
                        }
                      />
                    </div>
                  </div>
                </div>

                <Button
                  onClick={calculateBiologicalAge}
                  className="w-full bg-emerald-600 hover:bg-emerald-700"
                  disabled={loading}
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  ) : (
                    <Calculator className="w-4 h-4 mr-2" />
                  )}
                  {loading ? "Calculando..." : "Calcular Idade Biológica"}
                </Button>
              </CardContent>
            </Card>

            {/* Resultados */}
            <Card>
              <CardHeader>
                <CardTitle>Resultados</CardTitle>
                <CardDescription>Sua idade biológica calculada</CardDescription>
              </CardHeader>
              <CardContent>
                {results ? (
                  <div className="space-y-6">
                    {/* Idade Biológica */}
                    <div
                      className={`text-center p-6 rounded-lg ${getScoreBgColor(results.score)}`}
                    >
                      <Clock className="w-12 h-12 text-emerald-600 mx-auto mb-2" />
                      <div className="text-3xl font-bold mb-2">
                        <span className={getScoreColor(results.score)}>
                          {results.biologicalAge}
                        </span>
                        <span className="text-gray-600 dark:text-gray-400">
                          {" "}
                          anos
                        </span>
                      </div>
                      <div className="text-lg font-semibold mb-2">
                        {results.classification}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                        {results.message}
                      </div>
                      <Progress value={results.score} className="h-2" />
                    </div>

                    {/* Comparação */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <Calendar className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                        <div className="text-2xl font-bold text-blue-600">
                          {results.chronologicalAge}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          Idade Cronológica
                        </div>
                      </div>
                      <div className="text-center p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                        <Heart className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                        <div className="text-2xl font-bold text-emerald-600">
                          {results.biologicalAge}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          Idade Biológica
                        </div>
                      </div>
                    </div>

                    {/* Diferença */}
                    <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="text-lg font-semibold mb-1">
                        {results.ageDifference > 0 ? (
                          <span className="text-red-600 flex items-center justify-center">
                            <TrendingUp className="w-5 h-5 mr-1" />+
                            {results.ageDifference} anos
                          </span>
                        ) : (
                          <span className="text-green-600 flex items-center justify-center">
                            <TrendingDown className="w-5 h-5 mr-1" />
                            {results.ageDifference} anos
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Diferença da idade cronológica
                      </div>
                    </div>

                    {/* Fatores de Impacto */}
                    {results.impactFactors.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-3">
                          Fatores de Maior Impacto:
                        </h4>
                        <div className="space-y-2">
                          {results.impactFactors
                            .slice(0, 5)
                            .map((factor, index) => (
                              <div
                                key={index}
                                className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded"
                              >
                                <span className="text-sm font-medium">
                                  {factor.name}
                                </span>
                                <div className="flex space-x-2">
                                  <Badge
                                    variant={
                                      factor.priority === "Crítica"
                                        ? "destructive"
                                        : factor.priority === "Alta"
                                          ? "destructive"
                                          : "secondary"
                                    }
                                  >
                                    {factor.priority}
                                  </Badge>
                                  <Badge variant="outline">
                                    {factor.impact}
                                  </Badge>
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}

                    {/* Recomendações */}
                    <div>
                      <h4 className="font-semibold mb-3">Recomendações:</h4>
                      <div className="space-y-2">
                        {results.recommendations.map((rec, index) => (
                          <div
                            key={index}
                            className={`p-3 rounded-lg text-sm ${
                              rec.type === "error"
                                ? "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
                                : rec.type === "warning"
                                  ? "bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800"
                                  : rec.type === "info"
                                    ? "bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800"
                                    : "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800"
                            }`}
                          >
                            <div className="font-semibold mb-1">
                              {rec.title}
                            </div>
                            <div className="text-gray-600 dark:text-gray-400">
                              {rec.message}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Clock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      Calcule sua idade biológica
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
                  <Clock className="w-5 h-5 text-emerald-500" />
                  <span>O que é Idade Biológica?</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  A idade biológica é uma medida de quão bem seu corpo está
                  funcionando em comparação com sua idade cronológica. Reflete o
                  estado real de saúde e envelhecimento do seu organismo.
                </p>
                <div className="space-y-2">
                  <h4 className="font-semibold">Fatores que influenciam:</h4>
                  <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                    <li>• Condição física e fitness</li>
                    <li>• Qualidade do sono</li>
                    <li>• Alimentação e nutrição</li>
                    <li>• Níveis de estresse</li>
                    <li>• Doenças crônicas</li>
                    <li>• Hábitos de vida</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Heart className="w-5 h-5 text-red-500" />
                  <span>Como Melhorar sua Idade Biológica</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                    <li>
                      • <strong>Exercício regular:</strong> Cardio + força
                    </li>
                    <li>
                      • <strong>Sono de qualidade:</strong> 7-9 horas por noite
                    </li>
                    <li>
                      • <strong>Dieta anti-inflamatória:</strong> Frutas,
                      vegetais, ômega-3
                    </li>
                    <li>
                      • <strong>Gerenciamento de estresse:</strong> Meditação,
                      respiração
                    </li>
                    <li>
                      • <strong>Evitar toxinas:</strong> Não fumar, álcool
                      moderado
                    </li>
                    <li>
                      • <strong>Check-ups regulares:</strong> Monitorar saúde
                    </li>
                    <li>
                      • <strong>Hidratação:</strong> Água suficiente
                    </li>
                    <li>
                      • <strong>Relacionamentos:</strong> Conexões sociais
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="w-5 h-5 text-blue-500" />
                  <span>Biomarcadores Importantes</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <h4 className="font-semibold text-red-600">
                      Cardiovascular:
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Pressão arterial, colesterol, frequência cardíaca
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-orange-600">
                      Metabólico:
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Glicose, insulina, HbA1c, triglicerídeos
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-yellow-600">
                      Inflamatório:
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      PCR, interleucinas, marcadores de inflamação
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-green-600">
                      Nutricional:
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Vitaminas D, B12, ômega-3, antioxidantes
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Award className="w-5 h-5 text-purple-500" />
                  <span>Benefícios de uma Idade Biológica Jovem</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                    <li>
                      • <strong>Longevidade:</strong> Vida mais longa e saudável
                    </li>
                    <li>
                      • <strong>Energia:</strong> Mais vitalidade e disposição
                    </li>
                    <li>
                      • <strong>Resistência:</strong> Menor risco de doenças
                    </li>
                    <li>
                      • <strong>Recuperação:</strong> Cicatrização mais rápida
                    </li>
                    <li>
                      • <strong>Cognição:</strong> Melhor função cerebral
                    </li>
                    <li>
                      • <strong>Mobilidade:</strong> Flexibilidade e força
                    </li>
                    <li>
                      • <strong>Qualidade de vida:</strong> Bem-estar geral
                    </li>
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
