import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/Ui/card';
import { Button } from '@/components/Ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/Ui/select';
import { useApi } from '../../lib/api';
import { Download, FileText, Calendar, TrendingUp, Activity, Utensils } from 'lucide-react';
import { toast } from 'sonner';

export const HealthReportGenerator = () => {
  const { request } = useApi();
  const [reportType, setReportType] = React.useState('');
  const [period, setPeriod] = React.useState('30');
  const [generating, setGenerating] = React.useState(false);
  const [reportData, setReportData] = React.useState(null);

  const reportTypes = [
    { value: 'imc', label: 'Relatório de IMC', icon: TrendingUp },
    { value: 'nutrition', label: 'Relatório Nutricional', icon: Utensils },
    { value: 'exercise', label: 'Relatório de Exercícios', icon: Activity },
    { value: 'comprehensive', label: 'Relatório Completo', icon: FileText }
  ];

  const periods = [
    { value: '7', label: 'Últimos 7 dias' },
    { value: '30', label: 'Últimos 30 dias' },
    { value: '90', label: 'Últimos 90 dias' },
    { value: '365', label: 'Último ano' }
  ];

  const generateReport = async () => {
    if (!reportType) {
      toast.error('Selecione um tipo de relatório');
      return;
    }

    setGenerating(true);
    try {
      const response = await request(() => 
        fetch('/api/health/reports/generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            report_type: reportType,
            period_days: parseInt(period)
          }),
        })
      );

      if (response.ok) {
        const data = await response.json();
        setReportData(data);
        toast.success('Relatório gerado com sucesso!');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Erro ao gerar relatório');
      }
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
      toast.error('Erro ao gerar relatório');
    } finally {
      setGenerating(false);
    }
  };

  const downloadReport = async () => {
    if (!reportData) return;

    try {
      const response = await request(() => 
        fetch('/api/health/reports/download', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            report_id: reportData.report_id
          }),
        })
      );

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `relatorio-saude-${reportType}-${new Date().toISOString().split('T')[0]}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success('Relatório baixado com sucesso!');
      } else {
        toast.error('Erro ao baixar relatório');
      }
    } catch (error) {
      console.error('Erro ao baixar relatório:', error);
      toast.error('Erro ao baixar relatório');
    }
  };

  const selectedReportType = reportTypes.find(rt => rt.value === reportType);

  return (
    <div className="space-y-6">
      {/* Configuração do Relatório */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Gerador de Relatórios de Saúde
          </CardTitle>
          <CardDescription>
            Gere relatórios personalizados sobre sua saúde e bem-estar
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Tipo de Relatório */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Tipo de Relatório</label>
            <Select value={reportType} onValueChange={setReportType}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo de relatório" />
              </SelectTrigger>
              <SelectContent>
                {reportTypes.map((type) => {
                  const IconComponent = type.icon;
                  return (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center space-x-2">
                        <IconComponent className="w-4 h-4" />
                        <span>{type.label}</span>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Período */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Período</label>
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o período" />
              </SelectTrigger>
              <SelectContent>
                {periods.map((p) => (
                  <SelectItem key={p.value} value={p.value}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Botão de Gerar */}
          <Button
            onClick={generateReport}
            disabled={generating || !reportType}
            className="w-full"
          >
            {generating ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Gerando relatório...</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <FileText className="w-4 h-4" />
                <span>Gerar Relatório</span>
              </div>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Preview do Relatório */}
      {reportData && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  {selectedReportType && <selectedReportType.icon className="w-5 h-5" />}
                  {selectedReportType?.label}
                </CardTitle>
                <CardDescription>
                  Período: {periods.find(p => p.value === period)?.label}
                </CardDescription>
              </div>
              <Button onClick={downloadReport} className="flex items-center gap-2">
                <Download className="w-4 h-4" />
                Baixar PDF
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Resumo do Relatório */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {reportData.summary && Object.entries(reportData.summary).map(([key, value]) => (
                  <div key={key} className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-900 dark:text-white capitalize">
                      {key.replace('_', ' ')}
                    </h4>
                    <p className="text-2xl font-bold text-blue-600">
                      {typeof value === 'number' ? value.toLocaleString() : value}
                    </p>
                  </div>
                ))}
              </div>

              {/* Gráficos e Dados */}
              {reportData.charts && (
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    Visualizações
                  </h4>
                  <div className="bg-gray-100 dark:bg-gray-800 p-8 rounded-lg text-center">
                    <p className="text-gray-600 dark:text-gray-400">
                      Gráficos e visualizações serão exibidos aqui
                    </p>
                  </div>
                </div>
              )}

              {/* Recomendações */}
              {reportData.recommendations && reportData.recommendations.length > 0 && (
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    Recomendações
                  </h4>
                  <div className="space-y-2">
                    {reportData.recommendations.map((recommendation, index) => (
                      <div key={index} className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                        <p className="text-sm text-blue-800 dark:text-blue-200">
                          {recommendation}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Informações sobre Relatórios */}
      <Card>
        <CardHeader>
          <CardTitle>Tipos de Relatórios Disponíveis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reportTypes.map((type) => {
              const IconComponent = type.icon;
              return (
                <div key={type.value} className="flex items-start space-x-3 p-3 border rounded-lg">
                  <IconComponent className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      {type.label}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {getReportDescription(type.value)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const getReportDescription = (type) => {
  switch (type) {
    case 'imc':
      return 'Análise completa do seu IMC com histórico, tendências e recomendações personalizadas.';
    case 'nutrition':
      return 'Relatório detalhado sobre sua alimentação, macronutrientes e padrões alimentares.';
    case 'exercise':
      return 'Estatísticas de exercícios, calorias queimadas e progresso nos treinos.';
    case 'comprehensive':
      return 'Relatório completo combinando todos os aspectos da sua saúde e bem-estar.';
    default:
      return 'Relatório personalizado baseado nos seus dados de saúde.';
  }
};