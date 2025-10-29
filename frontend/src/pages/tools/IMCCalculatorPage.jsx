import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/Ui/button';
import { Input } from '@/components/Ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/Ui/card';
// Layout será fornecido pelo UserLayoutWrapper
import AIAssistantPopup from '../../components/AIAssistantPopup';
import { useApi, apiService } from '../../lib/api';
import { calculateIMC, classifyIMC, formatWeight, formatHeight } from '../../lib/utils';
import { Calculator, TrendingUp, TrendingDown, Target, Info, Save, History, Bot } from 'lucide-react';
import { toast } from 'sonner';

// Schema de validação
const imcSchema = z.object({
  weight: z.number().min(20, 'Peso deve ser pelo menos 20kg').max(300, 'Peso deve ser no máximo 300kg'),
  height: z.number().min(0.5, 'Altura deve ser pelo menos 0.5m').max(3, 'Altura deve ser no máximo 3m'),
});

export const IMCCalculatorPage = () => {
  const { request, loading } = useApi();
  const [imcResult, setImcResult] = React.useState(null);
  const [history, setHistory] = React.useState([]);
  const [showHistory, setShowHistory] = React.useState(false);
  const [currentTool, setCurrentTool] = React.useState('imc_calculator');

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    reset,
  } = useForm({
    resolver: zodResolver(imcSchema),
  });

  const watchedWeight = watch('weight');
  const watchedHeight = watch('height');

  // Calcular IMC em tempo real
  React.useEffect(() => {
    if (watchedWeight && watchedHeight && watchedWeight > 0 && watchedHeight > 0) {
      const imc = calculateIMC(watchedWeight, watchedHeight);
      if (imc) {
        const classification = classifyIMC(imc);
        setImcResult({
          imc: imc.toFixed(1),
          classification: classification.classification,
          color: classification.color,
        });
      }
    } else {
      setImcResult(null);
    }
  }, [watchedWeight, watchedHeight]);

  // Carregar histórico
  React.useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const data = await request(() => apiService.health.getIMCHistory());
      setHistory(data.history || []);
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
    }
  };

  const onSubmit = async (data) => {
    try {
      const imc = calculateIMC(data.weight, data.height);
      const classification = classifyIMC(imc);

      await request(() => 
        apiService.health.calculateIMC({
          weight: data.weight,
          height: data.height,
          imc: imc,
          classification: classification.classification,
        })
      );

      toast.success('IMC calculado e salvo com sucesso!');
      loadHistory(); // Recarregar histórico
      reset();
    } catch {
      toast.error('Erro ao salvar IMC. Tente novamente.');
    }
  };

  const getImcColor = (imc) => {
    if (imc < 18.5) return 'text-blue-600';
    if (imc < 25) return 'text-green-600';
    if (imc < 30) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getImcBgColor = (imc) => {
    if (imc < 18.5) return 'bg-blue-50 border-blue-200';
    if (imc < 25) return 'bg-green-50 border-green-200';
    if (imc < 30) return 'bg-yellow-50 border-yellow-200';
    return 'bg-red-50 border-red-200';
  };

  return (
    <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <Calculator className="w-8 h-8 text-blue-600" />
              Calculadora IMC
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Calcule seu Índice de Massa Corporal e acompanhe sua evolução
            </p>
          </div>
          
          {/* Botão de IA com contexto da ferramenta */}
          <Button 
            onClick={() => setCurrentTool('imc_calculator')}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-300 transform hover:scale-105 shadow-lg"
          >
            <Bot className="w-5 h-5 mr-2" />
            Assistente IA
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Formulário de Cálculo */}
          <Card className="shadow-lg border-0">
            <CardHeader>
              <CardTitle className="text-xl text-gray-900 dark:text-white">
                Calcular IMC
              </CardTitle>
              <CardDescription>
                Digite seu peso e altura para calcular seu IMC
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Peso (kg)
                    </label>
                    <Input
                      type="number"
                      step="0.1"
                      placeholder="70.5"
                      {...register('weight', { valueAsNumber: true })}
                      className="w-full"
                    />
                    {errors.weight && (
                      <p className="text-red-500 text-sm mt-1">{errors.weight.message}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Altura (m)
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="1.75"
                      {...register('height', { valueAsNumber: true })}
                      className="w-full"
                    />
                    {errors.height && (
                      <p className="text-red-500 text-sm mt-1">{errors.height.message}</p>
                    )}
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3"
                  disabled={loading}
                >
                  {loading ? 'Calculando...' : 'Calcular IMC'}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Resultado do IMC */}
          <div className="space-y-6">
            {imcResult && (
              <Card className={`shadow-lg border-2 ${getImcBgColor(parseFloat(imcResult.imc))}`}>
                <CardHeader>
                  <CardTitle className="text-2xl text-center text-gray-900 dark:text-white">
                    Seu IMC: {imcResult.imc}
                  </CardTitle>
                  <CardDescription className="text-center text-lg font-medium">
                    Classificação: {imcResult.classification}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <div className={`text-6xl font-bold ${getImcColor(parseFloat(imcResult.imc))} mb-4`}>
                      {imcResult.imc}
                    </div>
                    <p className="text-gray-600 dark:text-gray-400">
                      {imcResult.classification === 'Abaixo do peso' && 'Considere consultar um nutricionista para ganhar peso de forma saudável.'}
                      {imcResult.classification === 'Peso normal' && 'Parabéns! Mantenha seus hábitos saudáveis.'}
                      {imcResult.classification === 'Sobrepeso' && 'Considere ajustar sua alimentação e aumentar a atividade física.'}
                      {imcResult.classification === 'Obesidade' && 'Recomendamos consultar um profissional de saúde para um plano personalizado.'}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Histórico */}
            <Card className="shadow-lg border-0">
              <CardHeader>
                <CardTitle className="text-xl text-gray-900 dark:text-white flex items-center gap-2">
                  <History className="w-5 h-5" />
                  Histórico de Cálculos
                </CardTitle>
                <CardDescription>
                  Acompanhe sua evolução ao longo do tempo
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={() => setShowHistory(!showHistory)}
                  variant="outline"
                  className="w-full mb-4"
                >
                  {showHistory ? 'Ocultar Histórico' : 'Ver Histórico'}
                </Button>
                
                {showHistory && (
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {history.length === 0 ? (
                      <p className="text-gray-500 text-center py-4">
                        Nenhum cálculo registrado ainda
                      </p>
                    ) : (
                      history.map((entry, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <div>
                            <p className="font-medium">{entry.imc} - {entry.classification}</p>
                            <p className="text-sm text-gray-500">
                              {new Date(entry.calculated_at).toLocaleDateString('pt-BR')}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-gray-500">{entry.weight}kg / {entry.height}m</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Informações Educacionais */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
            <Info className="w-6 h-6 text-blue-600" />
            Sobre o IMC
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="text-center p-6">
              <div className="text-blue-600 text-4xl mb-2">📊</div>
              <h3 className="font-semibold mb-2">O que é o IMC?</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                O Índice de Massa Corporal é uma medida que relaciona peso e altura para avaliar se o peso está adequado.
              </p>
            </Card>
            <Card className="text-center p-6">
              <div className="text-green-600 text-4xl mb-2">🎯</div>
              <h3 className="font-semibold mb-2">Como interpretar?</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                IMC entre 18.5 e 24.9 é considerado peso normal. Valores abaixo ou acima indicam necessidade de atenção.
              </p>
            </Card>
            <Card className="text-center p-6">
              <div className="text-yellow-600 text-4xl mb-2">⚠️</div>
              <h3 className="font-semibold mb-2">Limitações</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                O IMC não considera massa muscular, idade ou distribuição de gordura. Consulte sempre um profissional.
              </p>
            </Card>
            <Card className="text-center p-6">
              <div className="text-purple-600 text-4xl mb-2">💡</div>
              <h3 className="font-semibold mb-2">Dica</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Use o IMC como uma ferramenta de acompanhamento, não como diagnóstico definitivo de saúde.
              </p>
            </Card>
          </div>
        </div>

      {/* Chat IA Integrado */}
      <AIAssistantPopup 
        currentTool={currentTool}
        toolContext={{
          tool: 'imc_calculator',
          currentImc: imcResult?.imc,
          classification: imcResult?.classification,
          history: history,
          userInputs: { weight: watchedWeight, height: watchedHeight }
        }}
      />
    </div>
  );
};