import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/Ui/card';
import { Button } from '@/components/Ui/button';
import { Input } from '@/components/Ui/input';
import { Label } from '@/components/Ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/Ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/Ui/tabs';
import { Badge } from '@/components/Ui/badge';
import { Progress } from '@/components/Ui/progress';
import { useApi, apiService } from '../../lib/api';
import { toast } from 'sonner';
import { 
  Calculator, 
  Droplets, 
  Activity, 
  Sun, 
  Thermometer,
  Clock,
  Target,
  Info,
  AlertTriangle,
  CheckCircle,
  Zap,
  Heart,
  Brain
} from 'lucide-react';

export const HydrationCalculator = () => {
  const { request, loading } = useApi();
  const [formData, setFormData] = useState({
    weight: '',
    age: '',
    gender: '',
    activityLevel: '',
    climate: '',
    exerciseDuration: '',
    exerciseIntensity: '',
    healthConditions: [],
    medications: false,
    pregnancy: false,
    breastfeeding: false
  });

  const [results, setResults] = useState(null);
  const [activeTab, setActiveTab] = useState('calculator');
  const [dailyIntake, setDailyIntake] = useState(0);
  const [currentIntake, setCurrentIntake] = useState(0);

  const activityLevels = [
    { value: 'sedentary', label: 'Sedentário', factor: 1.0, description: 'Pouco ou nenhum exercício' },
    { value: 'light', label: 'Levemente Ativo', factor: 1.2, description: 'Exercício leve 1-3 dias/semana' },
    { value: 'moderate', label: 'Moderadamente Ativo', factor: 1.4, description: 'Exercício moderado 3-5 dias/semana' },
    { value: 'active', label: 'Muito Ativo', factor: 1.6, description: 'Exercício pesado 6-7 dias/semana' },
    { value: 'very_active', label: 'Extremamente Ativo', factor: 1.8, description: 'Exercício muito pesado, trabalho físico' }
  ];

  const climates = [
    { value: 'temperate', label: 'Temperado', factor: 1.0, description: '20-25°C, umidade normal' },
    { value: 'hot', label: 'Quente', factor: 1.3, description: '25-30°C, umidade alta' },
    { value: 'very_hot', label: 'Muito Quente', factor: 1.5, description: '30°C+, umidade muito alta' },
    { value: 'cold', label: 'Frio', factor: 0.9, description: 'Abaixo de 15°C' },
    { value: 'dry', label: 'Seco', factor: 1.2, description: 'Baixa umidade, altitude' }
  ];

  const exerciseIntensities = [
    { value: 'low', label: 'Baixa', factor: 0.5, description: 'Caminhada leve, yoga' },
    { value: 'moderate', label: 'Moderada', factor: 1.0, description: 'Corrida leve, ciclismo' },
    { value: 'high', label: 'Alta', factor: 1.5, description: 'Corrida intensa, HIIT' },
    { value: 'very_high', label: 'Muito Alta', factor: 2.0, description: 'Treino de alta intensidade' }
  ];

  const healthConditions = [
    { value: 'diabetes', label: 'Diabetes', factor: 1.2 },
    { value: 'kidney_disease', label: 'Doença Renal', factor: 0.8 },
    { value: 'heart_disease', label: 'Doença Cardíaca', factor: 1.1 },
    { value: 'hypertension', label: 'Hipertensão', factor: 1.1 },
    { value: 'fever', label: 'Febre', factor: 1.3 },
    { value: 'diarrhea', label: 'Diarreia', factor: 1.4 },
    { value: 'vomiting', label: 'Vômito', factor: 1.3 }
  ];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleHealthConditionChange = (condition, checked) => {
    setFormData(prev => ({
      ...prev,
      healthConditions: checked 
        ? [...prev.healthConditions, condition]
        : prev.healthConditions.filter(c => c !== condition)
    }));
  };

  const calculateHydration = async () => {
    const { 
      weight, age, gender, activityLevel, climate, exerciseDuration, 
      exerciseIntensity, healthConditions, medications, pregnancy, breastfeeding 
    } = formData;
    
    if (!weight || !age || !gender || !activityLevel || !climate) {
      toast.error('Por favor, preencha todos os campos obrigatórios');
      return;
    }

    try {
      // Enviar dados para o backend
      const response = await request(() => 
        apiService.health.calculateHydration({
          weight: parseFloat(weight),
          age: parseInt(age),
          gender,
          activity_level: activityLevel,
          climate,
          exercise_duration: exerciseDuration ? parseFloat(exerciseDuration) : 0,
          exercise_intensity: exerciseIntensity,
          health_conditions: healthConditions,
          medications,
          pregnancy,
          breastfeeding
        })
      );

      const totalIntake = response.total_intake;
      const waterIntake = response.water_intake;
      const otherFluids = response.other_fluids;
      const hourlyIntake = response.hourly_intake;

      // Sinais de desidratação
      const dehydrationSigns = [
        'Sede excessiva',
        'Boca seca',
        'Fadiga',
        'Tontura',
        'Urina escura',
        'Pele seca',
        'Dor de cabeça'
      ];

      // Benefícios da hidratação adequada
      const benefits = [
        'Melhora a função cerebral',
        'Regula a temperatura corporal',
        'Auxilia na digestão',
        'Mantém a pele saudável',
        'Melhora o desempenho físico',
        'Previne cãibras musculares',
        'Auxilia na função renal'
      ];

      // Recomendações personalizadas
      const recommendations = generateRecommendations(healthConditions, pregnancy, breastfeeding, exerciseDuration ? parseFloat(exerciseDuration) : 0);

      setResults({
        totalIntake,
        waterIntake,
        otherFluids,
        hourlyIntake,
        preWorkout: exerciseDuration ? Math.round(parseFloat(exerciseDuration) * 5) : 0,
        duringWorkout: exerciseDuration ? Math.round(parseFloat(exerciseDuration) * 10) : 0,
        postWorkout: exerciseDuration ? Math.round(parseFloat(exerciseDuration) * 15) : 0,
        dehydrationSigns,
        benefits,
        recommendations,
        saved: response.saved
      });

      setDailyIntake(totalIntake);
      toast.success('Cálculo realizado e salvo com sucesso!');
    } catch (error) {
      console.error('Erro ao calcular hidratação:', error);
      toast.error('Erro ao calcular hidratação. Tente novamente.');
    }
  };

  const generateRecommendations = (conditions, pregnancy, breastfeeding, exerciseDuration) => {
    const recommendations = [];

    if (conditions.includes('diabetes')) {
      recommendations.push({
        type: 'warning',
        title: 'Diabetes',
        message: 'Monitore a glicemia e beba água regularmente para evitar picos de açúcar no sangue'
      });
    }

    if (conditions.includes('kidney_disease')) {
      recommendations.push({
        type: 'error',
        title: 'Doença Renal',
        message: 'Consulte seu médico para determinar a quantidade ideal de líquidos'
      });
    }

    if (conditions.includes('heart_disease')) {
      recommendations.push({
        type: 'warning',
        title: 'Doença Cardíaca',
        message: 'Evite excesso de líquidos e monitore a pressão arterial'
      });
    }

    if (pregnancy) {
      recommendations.push({
        type: 'info',
        title: 'Gravidez',
        message: 'Aumente a ingestão de água para apoiar o desenvolvimento do bebê e prevenir infecções urinárias'
      });
    }

    if (breastfeeding) {
      recommendations.push({
        type: 'info',
        title: 'Amamentação',
        message: 'Beba água antes, durante e após cada mamada para manter a produção de leite'
      });
    }

    if (exerciseDuration > 60) {
      recommendations.push({
        type: 'info',
        title: 'Exercício Prolongado',
        message: 'Considere bebidas isotônicas para repor eletrólitos perdidos no suor'
      });
    }

    recommendations.push({
      type: 'success',
      title: 'Dica Geral',
      message: 'Beba água ao longo do dia, não apenas quando sentir sede'
    });

    return recommendations;
  };

  const addIntake = (amount) => {
    setCurrentIntake(prev => Math.min(prev + amount, dailyIntake));
  };

  const getHydrationStatus = () => {
    if (!dailyIntake) return { status: 'unknown', color: 'gray', message: 'Calcule suas necessidades' };
    
    const percentage = (currentIntake / dailyIntake) * 100;
    
    if (percentage >= 100) {
      return { status: 'excellent', color: 'green', message: 'Hidratação excelente!' };
    } else if (percentage >= 80) {
      return { status: 'good', color: 'blue', message: 'Hidratação boa' };
    } else if (percentage >= 60) {
      return { status: 'fair', color: 'yellow', message: 'Hidratação regular' };
    } else {
      return { status: 'poor', color: 'red', message: 'Precisa beber mais água' };
    }
  };

  const hydrationStatus = getHydrationStatus();

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center space-x-3 mb-4">
          <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
            <Droplets className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Calculadora de Hidratação
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Calcule suas necessidades diárias de água e acompanhe sua hidratação
            </p>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="calculator" className="flex items-center space-x-2">
            <Calculator className="w-4 h-4" />
            <span>Calculadora</span>
          </TabsTrigger>
          <TabsTrigger value="tracker" className="flex items-center space-x-2">
            <Target className="w-4 h-4" />
            <span>Acompanhamento</span>
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
                  Informações para calcular suas necessidades de hidratação
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="weight">Peso (kg) *</Label>
                    <Input
                      id="weight"
                      type="number"
                      step="0.1"
                      placeholder="70.0"
                      value={formData.weight}
                      onChange={(e) => handleInputChange('weight', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="age">Idade *</Label>
                    <Input
                      id="age"
                      type="number"
                      placeholder="25"
                      value={formData.age}
                      onChange={(e) => handleInputChange('age', e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="gender">Gênero *</Label>
                    <Select value={formData.gender} onValueChange={(value) => handleInputChange('gender', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Masculino</SelectItem>
                        <SelectItem value="female">Feminino</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="activity">Nível de Atividade *</Label>
                    <Select value={formData.activityLevel} onValueChange={(value) => handleInputChange('activityLevel', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {activityLevels.map(level => (
                          <SelectItem key={level.value} value={level.value}>
                            <div>
                              <div className="font-medium">{level.label}</div>
                              <div className="text-sm text-gray-500">{level.description}</div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="climate">Clima *</Label>
                  <Select value={formData.climate} onValueChange={(value) => handleInputChange('climate', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {climates.map(climate => (
                        <SelectItem key={climate.value} value={climate.value}>
                          <div>
                            <div className="font-medium">{climate.label}</div>
                            <div className="text-sm text-gray-500">{climate.description}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="exerciseDuration">Duração do Exercício (min)</Label>
                    <Input
                      id="exerciseDuration"
                      type="number"
                      placeholder="0"
                      value={formData.exerciseDuration}
                      onChange={(e) => handleInputChange('exerciseDuration', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="exerciseIntensity">Intensidade do Exercício</Label>
                    <Select value={formData.exerciseIntensity} onValueChange={(value) => handleInputChange('exerciseIntensity', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {exerciseIntensities.map(intensity => (
                          <SelectItem key={intensity.value} value={intensity.value}>
                            <div>
                              <div className="font-medium">{intensity.label}</div>
                              <div className="text-sm text-gray-500">{intensity.description}</div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label>Condições de Saúde</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {healthConditions.map(condition => (
                      <label key={condition.value} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={formData.healthConditions.includes(condition.value)}
                          onChange={(e) => handleHealthConditionChange(condition.value, e.target.checked)}
                          className="rounded"
                        />
                        <span className="text-sm">{condition.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.medications}
                      onChange={(e) => handleInputChange('medications', e.target.checked)}
                      className="rounded"
                    />
                    <span className="text-sm">Toma medicamentos regularmente</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.pregnancy}
                      onChange={(e) => handleInputChange('pregnancy', e.target.checked)}
                      className="rounded"
                    />
                    <span className="text-sm">Está grávida</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.breastfeeding}
                      onChange={(e) => handleInputChange('breastfeeding', e.target.checked)}
                      className="rounded"
                    />
                    <span className="text-sm">Está amamentando</span>
                  </label>
                </div>

                <Button 
                  onClick={calculateHydration}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  disabled={loading}
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  ) : (
                    <Calculator className="w-4 h-4 mr-2" />
                  )}
                  {loading ? 'Calculando...' : 'Calcular Hidratação'}
                </Button>
              </CardContent>
            </Card>

            {/* Resultados */}
            <Card>
              <CardHeader>
                <CardTitle>Resultados</CardTitle>
                <CardDescription>
                  Suas necessidades de hidratação calculadas
                </CardDescription>
              </CardHeader>
              <CardContent>
                {results ? (
                  <div className="space-y-6">
                    {/* Total de Líquidos */}
                    <div className="text-center p-6 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-lg">
                      <Droplets className="w-12 h-12 text-blue-600 mx-auto mb-2" />
                      <div className="text-3xl font-bold text-blue-600 mb-1">
                        {results.totalIntake}ml
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Total de líquidos por dia
                      </div>
                    </div>

                    {/* Distribuição */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <div className="text-xl font-bold text-blue-600">{results.waterIntake}ml</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Água pura</div>
                      </div>
                      <div className="text-center p-4 bg-cyan-50 dark:bg-cyan-900/20 rounded-lg">
                        <div className="text-xl font-bold text-cyan-600">{results.otherFluids}ml</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Outros líquidos</div>
                      </div>
                    </div>

                    {/* Horários */}
                    <div>
                      <h4 className="font-semibold mb-3">Distribuição ao longo do dia:</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-800 rounded">
                          <span className="text-sm">Por hora (16h acordado):</span>
                          <span className="font-semibold">{results.hourlyIntake}ml</span>
                        </div>
                        {results.preWorkout > 0 && (
                          <div className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-800 rounded">
                            <span className="text-sm">Antes do exercício:</span>
                            <span className="font-semibold">{results.preWorkout}ml</span>
                          </div>
                        )}
                        {results.duringWorkout > 0 && (
                          <div className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-800 rounded">
                            <span className="text-sm">Durante o exercício:</span>
                            <span className="font-semibold">{results.duringWorkout}ml</span>
                          </div>
                        )}
                        {results.postWorkout > 0 && (
                          <div className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-800 rounded">
                            <span className="text-sm">Após o exercício:</span>
                            <span className="font-semibold">{results.postWorkout}ml</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Recomendações */}
                    <div>
                      <h4 className="font-semibold mb-3">Recomendações:</h4>
                      <div className="space-y-2">
                        {results.recommendations.map((rec, index) => (
                          <div key={index} className={`p-3 rounded-lg text-sm ${
                            rec.type === 'error' ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800' :
                            rec.type === 'warning' ? 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800' :
                            rec.type === 'info' ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800' :
                            'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                          }`}>
                            <div className="font-semibold mb-1">{rec.title}</div>
                            <div className="text-gray-600 dark:text-gray-400">{rec.message}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Droplets className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      Calcule suas necessidades
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

        <TabsContent value="tracker" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Progresso */}
            <Card>
              <CardHeader>
                <CardTitle>Acompanhamento Diário</CardTitle>
                <CardDescription>
                  Acompanhe sua ingestão de água hoje
                </CardDescription>
              </CardHeader>
              <CardContent>
                {dailyIntake > 0 ? (
                  <div className="space-y-6">
                    <div className="text-center">
                      <div className={`text-4xl font-bold mb-2 ${
                        hydrationStatus.color === 'green' ? 'text-green-600' :
                        hydrationStatus.color === 'blue' ? 'text-blue-600' :
                        hydrationStatus.color === 'yellow' ? 'text-yellow-600' :
                        'text-red-600'
                      }`}>
                        {Math.round((currentIntake / dailyIntake) * 100)}%
                      </div>
                      <div className="text-lg font-semibold mb-2">{hydrationStatus.message}</div>
                      <Progress value={(currentIntake / dailyIntake) * 100} className="h-3 mb-4" />
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {currentIntake}ml de {dailyIntake}ml
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-3">Adicionar Ingestão:</h4>
                      <div className="grid grid-cols-2 gap-2">
                        {[100, 200, 250, 500].map(amount => (
                          <Button
                            key={amount}
                            onClick={() => addIntake(amount)}
                            variant="outline"
                            size="sm"
                          >
                            +{amount}ml
                          </Button>
                        ))}
                      </div>
                    </div>

                    <div className="text-center">
                      <Button
                        onClick={() => setCurrentIntake(0)}
                        variant="outline"
                        size="sm"
                      >
                        Resetar Dia
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400">
                      Calcule suas necessidades primeiro para começar o acompanhamento
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Dicas */}
            <Card>
              <CardHeader>
                <CardTitle>Dicas de Hidratação</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                    <div>
                      <h4 className="font-semibold">Beba água ao acordar</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Comece o dia com um copo de água para reidratar após o sono
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                    <div>
                      <h4 className="font-semibold">Antes das refeições</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Beba água 30 minutos antes das refeições para melhor digestão
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                    <div>
                      <h4 className="font-semibold">Durante o exercício</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Hidrate-se a cada 15-20 minutos durante atividades físicas
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                    <div>
                      <h4 className="font-semibold">Monitore a urina</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Urina clara indica boa hidratação, escura indica necessidade de mais água
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="info" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Droplets className="w-5 h-5 text-blue-500" />
                  <span>Importância da Hidratação</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  A água é essencial para o funcionamento de todos os órgãos e sistemas do corpo. 
                  Representa cerca de 60% do peso corporal em adultos.
                </p>
                <div className="space-y-2">
                  <h4 className="font-semibold">Funções da água:</h4>
                  <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                    <li>• Regula a temperatura corporal</li>
                    <li>• Transporta nutrientes e oxigênio</li>
                    <li>• Remove resíduos e toxinas</li>
                    <li>• Lubrifica articulações</li>
                    <li>• Protege órgãos e tecidos</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                  <span>Sinais de Desidratação</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <h4 className="font-semibold text-red-600">Leve (1-2% de perda):</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Sede, boca seca, fadiga leve
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-orange-600">Moderada (3-5% de perda):</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Tontura, dor de cabeça, urina escura
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-red-600">Severa (6%+ de perda):</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Confusão, desmaio, choque - procure ajuda médica
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Heart className="w-5 h-5 text-pink-500" />
                  <span>Benefícios da Hidratação</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                    <li>• <strong>Cérebro:</strong> Melhora concentração e memória</li>
                    <li>• <strong>Pele:</strong> Mantém elasticidade e brilho</li>
                    <li>• <strong>Rins:</strong> Previne pedras nos rins</li>
                    <li>• <strong>Digestão:</strong> Ajuda na absorção de nutrientes</li>
                    <li>• <strong>Exercício:</strong> Melhora performance e recuperação</li>
                    <li>• <strong>Peso:</strong> Ajuda no controle do apetite</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Zap className="w-5 h-5 text-yellow-500" />
                  <span>Fontes de Hidratação</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <h4 className="font-semibold">Água pura (70%):</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      A melhor fonte de hidratação, sem calorias
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold">Outros líquidos (30%):</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Chás, sucos naturais, leite, sopas
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold">Alimentos:</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Frutas, vegetais, iogurte contribuem com 20% da hidratação
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};