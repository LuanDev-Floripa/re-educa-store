import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/Ui/card';
import { Button } from '@/components/Ui/button';
import { Badge } from '@/components/Ui/badge';
import { useApi, apiService } from '../../lib/api';
import { toast } from 'sonner';
import { 
  Calculator, 
  Brain, 
  Heart, 
  AlertTriangle,
  CheckCircle,
  Info
} from 'lucide-react';

export const StressCalculator = () => {
  const { request, loading } = useApi();
  const [stressFactors, setStressFactors] = useState([]);
  const [results, setResults] = useState(null);

  const availableFactors = [
    { id: 'work', name: 'Pressão no Trabalho', severity: 'medium' },
    { id: 'financial', name: 'Problemas Financeiros', severity: 'high' },
    { id: 'relationships', name: 'Problemas de Relacionamento', severity: 'medium' },
    { id: 'health', name: 'Preocupações com Saúde', severity: 'high' },
    { id: 'family', name: 'Problemas Familiares', severity: 'medium' },
    { id: 'time', name: 'Falta de Tempo', severity: 'low' },
    { id: 'social', name: 'Isolamento Social', severity: 'medium' },
    { id: 'future', name: 'Incerteza sobre o Futuro', severity: 'high' },
    { id: 'perfectionism', name: 'Perfeccionismo', severity: 'medium' },
    { id: 'change', name: 'Mudanças na Vida', severity: 'medium' }
  ];

  const handleFactorToggle = (factor) => {
    setStressFactors(prev => {
      const exists = prev.find(f => f.id === factor.id);
      if (exists) {
        return prev.filter(f => f.id !== factor.id);
      } else {
        return [...prev, factor];
      }
    });
  };

  const calculateStress = async () => {
    if (stressFactors.length === 0) {
      toast.error('Selecione pelo menos um fator de estresse');
      return;
    }

    try {
      const response = await request(() => 
        apiService.health.calculateStress({
          stress_factors: stressFactors
        })
      );

      setResults({
        stress_level: response.stress_level,
        stress_score: response.stress_score,
        coping_strategies: response.coping_strategies,
        recommendations: response.recommendations,
        saved: response.saved
      });

      toast.success('Análise realizada e salva com sucesso!');
    } catch (error) {
      console.error('Erro ao calcular estresse:', error);
      toast.error('Erro ao analisar estresse. Tente novamente.');
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getSeverityLabel = (severity) => {
    switch (severity) {
      case 'high': return 'Alto';
      case 'medium': return 'Médio';
      case 'low': return 'Baixo';
      default: return 'N/A';
    }
  };

  const getStressLevelColor = (level) => {
    switch (level) {
      case 'Baixo': return 'text-green-600';
      case 'Moderado': return 'text-yellow-600';
      case 'Alto': return 'text-orange-600';
      case 'Muito Alto': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center space-x-3 mb-4">
          <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
            <Brain className="w-6 h-6 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Calculadora de Estresse
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
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
                const isSelected = stressFactors.find(f => f.id === factor.id);
                return (
                  <div
                    key={factor.id}
                    onClick={() => handleFactorToggle(factor)}
                    className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      isSelected 
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                        : 'border-gray-200 hover:border-gray-300'
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
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Fatores selecionados: {stressFactors.length}
              </p>
              
              <Button 
                onClick={calculateStress}
                className="w-full bg-red-600 hover:bg-red-700"
                disabled={loading || stressFactors.length === 0}
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : (
                  <Calculator className="w-4 h-4 mr-2" />
                )}
                {loading ? 'Analisando...' : 'Analisar Estresse'}
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
                <div className="text-center p-6 bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 rounded-lg">
                  <AlertTriangle className="w-12 h-12 text-red-600 mx-auto mb-2" />
                  <div className={`text-3xl font-bold mb-1 ${getStressLevelColor(results.stress_level)}`}>
                    {results.stress_level}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Nível de Estresse
                  </div>
                </div>

                {/* Score */}
                <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="text-2xl font-bold mb-1">
                    {results.stress_score}/20
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Score de Estresse
                  </div>
                </div>

                {/* Estratégias de Coping */}
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-3 flex items-center gap-2">
                    <Heart className="w-5 h-5" />
                    Estratégias de Coping
                  </h4>
                  <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-2">
                    {results.coping_strategies.map((strategy, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        {strategy}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Recomendações */}
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <h4 className="font-semibold text-green-800 dark:text-green-200 mb-3 flex items-center gap-2">
                    <Info className="w-5 h-5" />
                    Recomendações
                  </h4>
                  <ul className="text-sm text-green-700 dark:text-green-300 space-y-1">
                    {results.recommendations.map((rec, index) => (
                      <li key={index}>• {rec}</li>
                    ))}
                  </ul>
                </div>

                {/* Dicas Gerais */}
                <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <h4 className="font-semibold text-purple-800 dark:text-purple-200 mb-2">
                    🧘 Dicas para Gerenciar Estresse
                  </h4>
                  <ul className="text-sm text-purple-700 dark:text-purple-300 space-y-1">
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
                <Brain className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Analise seu estresse
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
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