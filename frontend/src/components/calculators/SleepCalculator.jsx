import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/Ui/card';
import { Button } from '@/components/Ui/button';
import { Input } from '@/components/Ui/input';
import { Label } from '@/components/Ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/Ui/select';
import { useApi, apiService } from '../../lib/api';
import { toast } from 'sonner';
import { 
  Calculator, 
  Moon, 
  Clock, 
  Heart,
  Brain,
  Info
} from 'lucide-react';

export const SleepCalculator = () => {
  const { request, loading } = useApi();
  const [formData, setFormData] = useState({
    age: '',
    sleep_duration: '',
    sleep_quality: '',
    bedtime: '',
    wake_time: ''
  });

  const [results, setResults] = useState(null);

  const sleepQualityLevels = [
    { value: 'poor', label: 'Ruim', description: 'Acordo cansado, sono fragmentado' },
    { value: 'fair', label: 'Regular', description: 'Sono ok, mas poderia ser melhor' },
    { value: 'good', label: 'Bom', description: 'Durmo bem na maioria das noites' },
    { value: 'excellent', label: 'Excelente', description: 'Sono profundo e reparador' }
  ];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const calculateSleep = async () => {
    const { age, sleep_duration, sleep_quality } = formData;
    
    if (!age || !sleep_duration || !sleep_quality) {
      toast.error('Por favor, preencha todos os campos obrigatórios');
      return;
    }

    try {
      const response = await request(() => 
        apiService.health.calculateSleep({
          age: parseInt(age),
          sleep_duration: parseFloat(sleep_duration),
          sleep_quality,
          bedtime: formData.bedtime,
          wake_time: formData.wake_time
        })
      );

      setResults({
        sleep_duration: response.sleep_duration,
        sleep_quality: response.sleep_quality,
        sleep_efficiency: response.sleep_efficiency,
        recommendations: response.recommendations,
        saved: response.saved
      });

      toast.success('Cálculo realizado e salvo com sucesso!');
    } catch (error) {
      console.error('Erro ao calcular sono:', error);
      toast.error('Erro ao calcular sono. Tente novamente.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center space-x-3 mb-4">
          <div className="p-2 bg-indigo-100 dark:bg-indigo-900 rounded-lg">
            <Moon className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Calculadora de Sono
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
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
            <CardDescription>
              Dados sobre seus hábitos de sono
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
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

            <div>
              <Label htmlFor="sleep_duration">Duração do Sono (horas) *</Label>
              <Input
                id="sleep_duration"
                type="number"
                step="0.5"
                placeholder="8.0"
                value={formData.sleep_duration}
                onChange={(e) => handleInputChange('sleep_duration', e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="sleep_quality">Qualidade do Sono *</Label>
              <Select value={formData.sleep_quality} onValueChange={(value) => handleInputChange('sleep_quality', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a qualidade" />
                </SelectTrigger>
                <SelectContent>
                  {sleepQualityLevels.map(level => (
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

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="bedtime">Horário de Dormir</Label>
                <Input
                  id="bedtime"
                  type="time"
                  value={formData.bedtime}
                  onChange={(e) => handleInputChange('bedtime', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="wake_time">Horário de Acordar</Label>
                <Input
                  id="wake_time"
                  type="time"
                  value={formData.wake_time}
                  onChange={(e) => handleInputChange('wake_time', e.target.value)}
                />
              </div>
            </div>

            <Button 
              onClick={calculateSleep}
              className="w-full bg-indigo-600 hover:bg-indigo-700"
              disabled={loading}
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <Calculator className="w-4 h-4 mr-2" />
              )}
              {loading ? 'Calculando...' : 'Analisar Sono'}
            </Button>
          </CardContent>
        </Card>

        {/* Resultados */}
        <Card>
          <CardHeader>
            <CardTitle>Análise do Sono</CardTitle>
            <CardDescription>
              Sua qualidade de sono analisada
            </CardDescription>
          </CardHeader>
          <CardContent>
            {results ? (
              <div className="space-y-6">
                {/* Duração */}
                <div className="text-center p-6 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-lg">
                  <Clock className="w-12 h-12 text-indigo-600 mx-auto mb-2" />
                  <div className="text-3xl font-bold text-indigo-600 mb-1">
                    {results.sleep_duration}h
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Duração do Sono
                  </div>
                </div>

                {/* Qualidade */}
                <div className="text-center p-6 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-lg">
                  <Moon className="w-12 h-12 text-blue-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-blue-600 mb-1 capitalize">
                    {results.sleep_quality}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Qualidade do Sono
                  </div>
                </div>

                {/* Eficiência */}
                <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="text-lg font-semibold mb-1">
                    Eficiência: {(results.sleep_efficiency * 100).toFixed(0)}%
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Baseada na qualidade e duração
                  </div>
                </div>

                {/* Recomendações */}
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <h4 className="font-semibold text-green-800 dark:text-green-200 mb-2">
                    💡 Recomendações
                  </h4>
                  <ul className="text-sm text-green-700 dark:text-green-300 space-y-1">
                    {results.recommendations.map((rec, index) => (
                      <li key={index}>• {rec}</li>
                    ))}
                  </ul>
                </div>

                {/* Dicas Gerais */}
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
                    🌙 Dicas para Melhor Sono
                  </h4>
                  <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                    <li>• Mantenha horários regulares de dormir e acordar</li>
                    <li>• Evite cafeína 6 horas antes de dormir</li>
                    <li>• Crie um ambiente escuro e silencioso</li>
                    <li>• Evite telas 1 hora antes de dormir</li>
                  </ul>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <Moon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Analise seu sono
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
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