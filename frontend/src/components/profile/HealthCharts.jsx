import React from "react";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/Ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/Ui/tabs";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

// Função para obter cores de gráfico baseadas em variáveis CSS
const getChartColor = (colorName) => {
  // Retorna valores HSL que correspondem às variáveis CSS
  const colors = {
    primary: "hsl(var(--primary))",
    success: "hsl(var(--success))",
    warning: "hsl(var(--warning))",
    info: "hsl(var(--info))",
    error: "hsl(var(--error))",
  };
  return colors[colorName] || colors.primary;
};

/**
 * Componente de gráficos de saúde
 * Exibe gráficos de evolução de métricas de saúde usando Recharts
 */
const HealthCharts = ({ healthData, loading = false }) => {
  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!healthData || !healthData.history) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            <p>Nenhum dado disponível ainda.</p>
            <p className="text-sm mt-2">
              Use as calculadoras para começar a coletar dados!
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { history, metrics } = healthData;

  // Preparar dados de IMC para gráfico
  const imcChartData =
    history?.imc?.map((entry) => ({
      date: new Date(entry.created_at || entry.date).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
      }),
      imc: parseFloat(entry.imc || entry.result?.imc || 0),
      weight: parseFloat(entry.weight || 0),
    })) || [];

  // Preparar dados de Calorias para gráfico
  const calorieChartData =
    history?.calories?.map((entry) => ({
      date: new Date(entry.created_at || entry.date).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
      }),
      tdee: parseFloat(entry.tdee || entry.result?.tdee || 0),
      bmr: parseFloat(entry.bmr || entry.result?.bmr || 0),
    })) || [];

  // Calcular tendência do IMC
  const calculateTrend = (data, field) => {
    if (!data || data.length < 2) return null;
    const first = data[0][field];
    const last = data[data.length - 1][field];
    if (first === 0) return null;
    const change = ((last - first) / first) * 100;
    if (change > 1) return { type: "up", value: change.toFixed(1) };
    if (change < -1) return { type: "down", value: Math.abs(change).toFixed(1) };
    return { type: "stable", value: change.toFixed(1) };
  };

  const imcTrend = calculateTrend(imcChartData, "imc");
  const weightTrend = calculateTrend(imcChartData, "weight");

  const TrendIcon = ({ trend }) => {
    if (!trend) return null;
    if (trend.type === "up")
      return <TrendingUp className="w-4 h-4 text-destructive" />;
    if (trend.type === "down")
      return <TrendingDown className="w-4 h-4 text-primary" />;
    return <Minus className="w-4 h-4 text-gray-500" />;
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="imc" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="imc">IMC e Peso</TabsTrigger>
          <TabsTrigger value="calories">Calorias (TDEE/BMR)</TabsTrigger>
        </TabsList>

        {/* Gráfico de IMC e Peso */}
        <TabsContent value="imc" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Evolução do IMC</CardTitle>
                {imcTrend && (
                  <div className="flex items-center gap-2 text-sm">
                    <TrendIcon trend={imcTrend} />
                    <span
                      className={
                        imcTrend.type === "down"
                          ? "text-primary"
                          : imcTrend.type === "up"
                          ? "text-destructive"
                          : "text-muted-foreground"
                      }
                    >
                      {imcTrend.value}%
                    </span>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {imcChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={imcChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis yAxisId="left" />
                    <Tooltip />
                    <Legend />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="imc"
                      stroke={getChartColor("primary")}
                      strokeWidth={2}
                      name="IMC"
                      dot={{ r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center text-muted-foreground py-12">
                  Nenhum dado de IMC disponível
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Evolução do Peso</CardTitle>
                {weightTrend && (
                  <div className="flex items-center gap-2 text-sm">
                    <TrendIcon trend={weightTrend} />
                    <span
                      className={
                        weightTrend.type === "down"
                          ? "text-primary"
                          : weightTrend.type === "up"
                          ? "text-destructive"
                          : "text-muted-foreground"
                      }
                    >
                      {weightTrend.value}%
                    </span>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {imcChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={imcChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="weight"
                      stroke={getChartColor("success")}
                      fill={getChartColor("success")}
                      fillOpacity={0.3}
                      name="Peso (kg)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center text-muted-foreground py-12">
                  Nenhum dado de peso disponível
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Gráfico de Calorias */}
        <TabsContent value="calories" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Evolução das Necessidades Calóricas</CardTitle>
            </CardHeader>
            <CardContent>
              {calorieChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={calorieChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="bmr"
                      stroke={getChartColor("warning")}
                      strokeWidth={2}
                      name="BMR (Taxa Metabólica Basal)"
                      dot={{ r: 4 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="tdee"
                      stroke={getChartColor("info")}
                      strokeWidth={2}
                      name="TDEE (Gasto Calórico Total)"
                      dot={{ r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center text-muted-foreground py-12">
                  Nenhum dado de calorias disponível
                </div>
              )}
            </CardContent>
          </Card>

          {/* Métricas consolidadas */}
          {metrics && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {metrics.avg_imc && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">
                      IMC Médio
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {parseFloat(metrics.avg_imc).toFixed(1)}
                    </div>
                  </CardContent>
                </Card>
              )}
              {metrics.avg_weight && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">
                      Peso Médio
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {parseFloat(metrics.avg_weight).toFixed(1)} kg
                    </div>
                  </CardContent>
                </Card>
              )}
              {metrics.avg_tdee && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">
                      TDEE Médio
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {parseInt(metrics.avg_tdee)} kcal
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default HealthCharts;
