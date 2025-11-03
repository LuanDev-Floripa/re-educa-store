import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/Ui/card";
import { Badge } from "@/components/Ui/badge";
import {
  Brain,
  MessageSquare,
  Image as ImageIcon,
  TrendingUp,
  Sparkles,
  Zap,
} from "lucide-react";
import RecommendationsPanel from "@/components/ai/RecommendationsPanel";
import AIChat from "@/components/ai/AIChat";
import ImageAnalysis from "@/components/ai/ImageAnalysis";

/**
 * AIPage
 * Página de recursos de IA (recomendações, chat e análise de imagem).
 * @returns {JSX.Element}
 */
const AIPage = () => {
  const [activeTab, setActiveTab] = useState("recommendations");

  const tabs = [
    {
      id: "recommendations",
      label: "Recomendações",
      icon: Brain,
      color: "text-blue-600",
      bgColor: "bg-blue-50 dark:bg-blue-900/20",
      borderColor: "border-blue-500",
    },
    {
      id: "chat",
      label: "Chat",
      icon: MessageSquare,
      color: "text-green-600",
      bgColor: "bg-green-50 dark:bg-green-900/20",
      borderColor: "border-green-500",
    },
    {
      id: "analysis",
      label: "Análise",
      icon: ImageIcon,
      color: "text-purple-600",
      bgColor: "bg-purple-50 dark:bg-purple-900/20",
      borderColor: "border-purple-500",
    },
  ];

  const aiFeatures = [
    {
      title: "Recomendações Inteligentes",
      description: "Produtos, exercícios e planos nutricionais personalizados",
      icon: Brain,
      color: "text-blue-500",
    },
    {
      title: "Chat com IA",
      description: "Assistente virtual para dúvidas e orientações",
      icon: MessageSquare,
      color: "text-green-500",
    },
    {
      title: "Análise de Imagem",
      description: "Identifique alimentos e exercícios através de fotos",
      icon: ImageIcon,
      color: "text-purple-500",
    },
    {
      title: "Previsões de Saúde",
      description: "Tendências e insights baseados em seus dados",
      icon: TrendingUp,
      color: "text-orange-500",
    },
  ];

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-3">
          <div className="p-3 bg-primary/10 rounded-full">
            <Sparkles className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-4xl font-bold">Inteligência Artificial</h1>
        </div>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Descubra o poder da IA personalizada para sua saúde e bem-estar.
          Receba recomendações inteligentes, converse com nosso assistente e
          analise imagens.
        </p>
        <div className="flex justify-center gap-2">
          <Badge variant="secondary" className="flex items-center gap-1">
            <Zap className="w-3 h-3" />
            IA Avançada
          </Badge>
          <Badge variant="secondary" className="flex items-center gap-1">
            <Brain className="w-3 h-3" />
            Personalizado
          </Badge>
          <Badge variant="secondary" className="flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            Aprendizado Contínuo
          </Badge>
        </div>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {aiFeatures.map((feature, idx) => {
          const Icon = feature.icon;
          return (
            <Card key={idx} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6 text-center">
                <div className={`w-12 h-12 mx-auto mb-4 ${feature.color}`}>
                  <Icon className="w-full h-full" />
                </div>
                <h3 className="font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Main Content - Tabs com Barra Superior */}
      <Card className="overflow-hidden">
        {/* Barra de Abas Superior */}
        <div className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <div className="flex items-center gap-1 px-4">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    relative flex items-center gap-2 px-6 py-4 font-medium text-sm transition-all duration-200
                    ${
                      isActive
                        ? `text-gray-900 dark:text-white ${tab.color}`
                        : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                    }
                  `}
                >
                  <Icon className={`w-5 h-5 ${isActive ? tab.color : ""}`} />
                  <span>{tab.label}</span>
                  {isActive && (
                    <div
                      className={`absolute bottom-0 left-0 right-0 h-0.5 ${tab.bgColor.replace(
                        "50",
                        "500"
                      )} ${tab.borderColor.replace("border", "bg")}`}
                      style={{
                        backgroundColor:
                          isActive && tab.id === "recommendations"
                            ? "rgb(37 99 235)"
                            : isActive && tab.id === "chat"
                            ? "rgb(22 163 74)"
                            : "rgb(147 51 234)",
                      }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Conteúdo das Abas - Janelas Internas */}
        <CardContent className="p-0">
          <div className="relative min-h-[600px]">
            {/* Janela de Recomendações */}
            {activeTab === "recommendations" && (
              <div className="animate-in fade-in-50 duration-300">
                <div className="p-6">
                  <RecommendationsPanel />
                </div>
              </div>
            )}

            {/* Janela de Chat */}
            {activeTab === "chat" && (
              <div className="animate-in fade-in-50 duration-300">
                <div className="p-6">
                  <AIChat />
                </div>
              </div>
            )}

            {/* Janela de Análise */}
            {activeTab === "analysis" && (
              <div className="animate-in fade-in-50 duration-300">
                <div className="p-6">
                  <ImageAnalysis />
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* AI Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Estatísticas da IA
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-2">95%</div>
              <p className="text-sm text-muted-foreground">
                Precisão nas Recomendações
              </p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-2">10k+</div>
              <p className="text-sm text-muted-foreground">
                Análises de Imagem Realizadas
              </p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-2">24/7</div>
              <p className="text-sm text-muted-foreground">
                Assistente Disponível
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AIPage;
