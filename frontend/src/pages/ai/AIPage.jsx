import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/Ui/tabs";
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

      {/* Main Content */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger
            value="recommendations"
            className="flex items-center gap-2"
          >
            <Brain className="w-4 h-4" />
            Recomendações
          </TabsTrigger>
          <TabsTrigger value="chat" className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            Chat
          </TabsTrigger>
          <TabsTrigger value="analysis" className="flex items-center gap-2">
            <ImageIcon className="w-4 h-4" />
            Análise
          </TabsTrigger>
        </TabsList>

        <TabsContent value="recommendations">
          <RecommendationsPanel />
        </TabsContent>

        <TabsContent value="chat">
          <AIChat />
        </TabsContent>

        <TabsContent value="analysis">
          <ImageAnalysis />
        </TabsContent>
      </Tabs>

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
