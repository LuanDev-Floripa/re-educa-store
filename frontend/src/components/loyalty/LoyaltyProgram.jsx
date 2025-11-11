import React, { useState, useEffect, useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/Ui/card";
import { Button } from "@/components/Ui/button";
import { Badge } from "@/components/Ui/badge";
import { Progress } from "@/components/Ui/progress";
import {
  Star,
  Gift,
  Trophy,
  Crown,
  Zap,
  Target,
  Award,
  ShoppingCart,
  Heart,
  Share2,
  Users,
  Calendar,
  Clock,
  TrendingUp,
  DollarSign,
  Truck,
  Percent,
  CheckCircle,
  ArrowRight,
  Sparkles,
  Diamond,
  Medal,
  Flame,
  Activity,
  MessageCircle,
  Bookmark,
  Eye,
  Download,
  Upload,
  RefreshCw,
  Settings,
} from "lucide-react";

/**
 * Programa de fidelidade do usuário.
 * - Exibe status do tier, recompensas, desafios, indicações e histórico
 * - Usa dados locais com carregamento simulado e UI responsiva
 */
export const LoyaltyProgram = ({
  userProfile = {},
  onRedeemReward,
  onShareAchievement,
  onInviteFriend,
}) => {
  const [loyaltyData, setLoyaltyData] = useState({});
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  // Dados do usuário de exemplo
  const defaultUserProfile = {
    id: 1,
    name: "João Silva",
    email: "joao@email.com",
    memberSince: "2023-01-15",
    totalSpent: 2450.8,
    totalOrders: 23,
    averageOrderValue: 106.55,
    favoriteCategories: ["Suplementos", "Equipamentos"],
    lastOrderDate: "2024-01-10",
    referralCode: "JOÃO2024",
    referredFriends: 5,
  };

  const currentUserProfile = { ...defaultUserProfile, ...userProfile };

  // Dados do programa de fidelidade - memoizado para evitar recriação
  const loyaltyProgramData = useMemo(() => ({
    currentTier: {
      id: "gold",
      name: "Gold",
      level: 3,
      points: 2450,
      nextTierPoints: 3000,
      benefits: [
        "5% de desconto em todas as compras",
        "Frete grátis em pedidos acima de R$ 100",
        "Acesso antecipado a novos produtos",
        "Suporte prioritário",
        "Produtos exclusivos",
      ],
      color: "text-yellow-500",
      bgColor: "bg-yellow-50",
      icon: Crown,
    },
    tiers: [
      {
        id: "bronze",
        name: "Bronze",
        level: 1,
        minPoints: 0,
        maxPoints: 999,
        benefits: [
          "1% de desconto em todas as compras",
          "Frete grátis em pedidos acima de R$ 200",
        ],
        color: "text-primary",
        bgColor: "bg-primary/10",
        icon: Medal,
      },
      {
        id: "silver",
        name: "Silver",
        level: 2,
        minPoints: 1000,
        maxPoints: 1999,
        benefits: [
          "3% de desconto em todas as compras",
          "Frete grátis em pedidos acima de R$ 150",
          "Acesso a produtos exclusivos",
        ],
        color: "text-muted-foreground",
        bgColor: "bg-muted",
        icon: Award,
      },
      {
        id: "gold",
        name: "Gold",
        level: 3,
        minPoints: 2000,
        maxPoints: 4999,
        benefits: [
          "5% de desconto em todas as compras",
          "Frete grátis em pedidos acima de R$ 100",
          "Acesso antecipado a novos produtos",
          "Suporte prioritário",
          "Produtos exclusivos",
        ],
        color: "text-yellow-500",
        bgColor: "bg-yellow-50",
        icon: Crown,
      },
      {
        id: "platinum",
        name: "Platinum",
        level: 4,
        minPoints: 5000,
        maxPoints: 9999,
        benefits: [
          "8% de desconto em todas as compras",
          "Frete grátis em todos os pedidos",
          "Acesso antecipado a novos produtos",
          "Suporte prioritário 24/7",
          "Produtos exclusivos",
          "Consultoria personalizada",
        ],
        color: "text-primary",
        bgColor: "bg-primary/10",
        icon: Diamond,
      },
      {
        id: "diamond",
        name: "Diamond",
        level: 5,
        minPoints: 10000,
        maxPoints: Infinity,
        benefits: [
          "10% de desconto em todas as compras",
          "Frete grátis em todos os pedidos",
          "Acesso antecipado a novos produtos",
          "Suporte prioritário 24/7",
          "Produtos exclusivos",
          "Consultoria personalizada",
          "Eventos VIP",
          "Presentes exclusivos",
        ],
        color: "text-primary",
        bgColor: "bg-primary/10",
        icon: Star,
      },
    ],
    pointsHistory: [
      {
        date: "2024-01-10",
        action: "Compra",
        points: 150,
        description: "Whey Protein Premium",
      },
      {
        date: "2024-01-08",
        action: "Avaliação",
        points: 10,
        description: "Avaliou produto",
      },
      {
        date: "2024-01-05",
        action: "Indicação",
        points: 100,
        description: "Indicou amigo",
      },
      {
        date: "2024-01-03",
        action: "Compra",
        points: 200,
        description: "Creatina + BCAA",
      },
      {
        date: "2024-01-01",
        action: "Bônus",
        points: 50,
        description: "Bônus de Ano Novo",
      },
    ],
    availableRewards: [
      {
        id: 1,
        name: "Desconto de R$ 50",
        description: "Desconto de R$ 50 na próxima compra",
        points: 1000,
        type: "discount",
        value: 50,
        icon: Percent,
        color: "text-primary",
        bgColor: "bg-primary/10",
      },
      {
        id: 2,
        name: "Frete Grátis",
        description: "Frete grátis no próximo pedido",
        points: 500,
        type: "shipping",
        value: 0,
        icon: Truck,
        color: "text-primary",
        bgColor: "bg-primary/10",
      },
      {
        id: 3,
        name: "Produto Grátis",
        description: "Amostra grátis de Whey Protein",
        points: 800,
        type: "product",
        value: 0,
        icon: Gift,
        color: "text-primary",
        bgColor: "bg-primary/10",
      },
      {
        id: 4,
        name: "Desconto de R$ 100",
        description: "Desconto de R$ 100 na próxima compra",
        points: 2000,
        type: "discount",
        value: 100,
        icon: Percent,
        color: "text-primary",
        bgColor: "bg-primary/10",
      },
    ],
    challenges: [
      {
        id: 1,
        name: "Primeira Compra",
        description: "Faça sua primeira compra e ganhe 100 pontos",
        points: 100,
        progress: 100,
        maxProgress: 100,
        completed: true,
        icon: ShoppingCart,
        color: "text-primary",
      },
      {
        id: 2,
        name: "Comprador Frequente",
        description: "Faça 5 compras em um mês",
        points: 250,
        progress: 3,
        maxProgress: 5,
        completed: false,
        icon: Calendar,
        color: "text-primary",
      },
      {
        id: 3,
        name: "Avaliador Ativo",
        description: "Avalie 10 produtos",
        points: 150,
        progress: 7,
        maxProgress: 10,
        completed: false,
        icon: Star,
        color: "text-primary",
      },
      {
        id: 4,
        name: "Indicador de Amigos",
        description: "Indique 3 amigos",
        points: 300,
        progress: 1,
        maxProgress: 3,
        completed: false,
        icon: Users,
        color: "text-primary",
      },
    ],
    referralProgram: {
      code: currentUserProfile?.referralCode || "",
      referredFriends: currentUserProfile?.referredFriends || 0,
      totalEarned: 500,
      pendingRewards: 200,
      rewards: [
        {
          friend: "Maria Santos",
          date: "2024-01-08",
          points: 100,
          status: "completed",
        },
        {
          friend: "Pedro Costa",
          date: "2024-01-05",
          points: 100,
          status: "completed",
        },
        {
          friend: "Ana Silva",
          date: "2024-01-03",
          points: 100,
          status: "completed",
        },
        {
          friend: "Carlos Lima",
          date: "2024-01-01",
          points: 100,
          status: "completed",
        },
        {
          friend: "Julia Oliveira",
          date: "2023-12-28",
          points: 100,
          status: "completed",
        },
      ],
    },
  }), [currentUserProfile?.referralCode, currentUserProfile?.referredFriends]);

  useEffect(() => {
    const loadLoyaltyData = async () => {
      setLoading(true);
      // Simular carregamento de API
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setLoyaltyData(loyaltyProgramData);
      setLoading(false);
    };
    loadLoyaltyData();
  }, [loyaltyProgramData]);

  const getTierProgress = () => {
    const currentTier = loyaltyData?.currentTier;
    if (!currentTier) return 0;
    const nextTier = loyaltyData.tiers?.find(
      (tier) => tier.level === currentTier.level + 1,
    );

    if (!nextTier) return 100; // Último tier

    const currentPoints = currentTier.points ?? 0;
    const tierStart =
      loyaltyData.tiers?.find((tier) => tier.level === currentTier.level)
        ?.minPoints || 0;
    const tierEnd = nextTier.minPoints;

    return ((currentPoints - tierStart) / (tierEnd - tierStart)) * 100;
  };

  const getTierIcon = (tierId) => {
    const tier = loyaltyData.tiers?.find((t) => t.id === tierId);
    return tier?.icon || Star;
  };

  const getTierColor = (tierId) => {
    const tier = loyaltyData.tiers?.find((t) => t.id === tierId);
    return tier?.color || "text-muted-foreground";
  };

  const getTierBgColor = (tierId) => {
    const tier = loyaltyData.tiers?.find((t) => t.id === tierId);
    return tier?.bgColor || "bg-gray-50";
  };

  const handleRedeemReward = (reward) => {
    if (onRedeemReward) {
      onRedeemReward(reward);
    }
  };

  const handleShareAchievement = (achievement) => {
    if (onShareAchievement) {
      onShareAchievement(achievement);
    }
  };

  const handleInviteFriend = () => {
    if (onInviteFriend) {
      onInviteFriend();
    }
  };

  const tabs = [
    { id: "overview", label: "Visão Geral", icon: Target },
    { id: "rewards", label: "Recompensas", icon: Gift },
    { id: "challenges", label: "Desafios", icon: Trophy },
    { id: "referrals", label: "Indicações", icon: Users },
    { id: "history", label: "Histórico", icon: Clock },
  ];

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Status Atual */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Crown className="w-5 h-5 text-primary" />
            <span>Status Atual - {loyaltyData.currentTier?.name}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-foreground">
                {loyaltyData.currentTier?.points?.toLocaleString()} pontos
              </div>
              <div className="text-sm text-muted-foreground">
                Nível {loyaltyData.currentTier?.level}
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-muted-foreground">
                Próximo nível
              </div>
              <div className="font-semibold">
                {loyaltyData.currentTier?.nextTierPoints?.toLocaleString()}{" "}
                pontos
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progresso para o próximo nível</span>
              <span>{Math.round(getTierProgress())}%</span>
            </div>
            <Progress value={getTierProgress()} className="h-2" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-muted rounded-lg">
              <div className="text-lg font-bold text-foreground">
                {currentUserProfile.totalOrders}
              </div>
              <div className="text-sm text-muted-foreground">
                Pedidos
              </div>
            </div>
            <div className="text-center p-3 bg-muted rounded-lg">
              <div className="text-lg font-bold text-foreground">
                R$ {currentUserProfile.totalSpent?.toFixed(2).replace(".", ",")}
              </div>
              <div className="text-sm text-muted-foreground">
                Total Gasto
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Benefícios Atuais */}
      <Card>
        <CardHeader>
          <CardTitle>
            Benefícios do Nível {loyaltyData.currentTier?.name}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {loyaltyData.currentTier?.benefits?.map((benefit, index) => (
              <div key={index} className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-primary" />
                <span className="text-sm">{benefit}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Níveis do Programa */}
      <Card>
        <CardHeader>
          <CardTitle>Níveis do Programa</CardTitle>
          <CardDescription>
            Conheça todos os níveis e seus benefícios
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {loyaltyData.tiers?.map((tier) => {
              const IconComponent = getTierIcon(tier.id);
              const isCurrentTier = tier.id === loyaltyData.currentTier?.id;
              const isUnlocked =
                loyaltyData.currentTier?.points >= tier.minPoints;

              return (
                <div
                  key={tier.id}
                  className={`p-4 border rounded-lg ${
                    isCurrentTier
                      ? "border-primary/30 bg-primary/10"
                      : isUnlocked
                        ? "border-primary/30 bg-primary/10"
                        : `border-border ${getTierBgColor(tier.id)}`
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {React.createElement(getTierIcon(tier.id), {
                        className: `w-6 h-6 ${getTierColor(tier.id)}`,
                      })}
                      <div>
                        <div className="font-semibold">{tier.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {tier.minPoints.toLocaleString()} -{" "}
                          {tier.maxPoints === Infinity
                            ? "∞"
                            : tier.maxPoints.toLocaleString()}{" "}
                          pontos
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {isCurrentTier && (
                        <Badge
                          variant="secondary"
                          className="bg-primary/10 text-primary"
                        >
                          Atual
                        </Badge>
                      )}
                      {isUnlocked && !isCurrentTier && (
                        <Badge
                          variant="secondary"
                          className="bg-primary/10 text-primary"
                        >
                          Desbloqueado
                        </Badge>
                      )}
                      {!isUnlocked && (
                        <Badge variant="outline">Bloqueado</Badge>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderRewards = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {loyaltyData.availableRewards?.map((reward) => {
          const IconComponent = reward.icon;
          const canRedeem = loyaltyData.currentTier?.points >= reward.points;

          return (
            <Card key={reward.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <IconComponent className={`w-5 h-5 ${reward.color}`} />
                    <CardTitle className="text-lg">{reward.name}</CardTitle>
                  </div>
                  <Badge variant="outline">{reward.points} pts</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  {reward.description}
                </p>

                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    {canRedeem ? "Disponível" : "Pontos insuficientes"}
                  </div>
                  <Button
                    size="sm"
                    disabled={!canRedeem}
                    onClick={() => handleRedeemReward(reward)}
                  >
                    Resgatar
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );

  const renderChallenges = () => (
    <div className="space-y-4">
      {loyaltyData.challenges?.map((challenge) => {
        const IconComponent = challenge.icon;
        const progressPercentage =
          (challenge.progress / challenge.maxProgress) * 100;

        return (
          <Card
            key={challenge.id}
            className="hover:shadow-lg transition-shadow"
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <IconComponent className={`w-5 h-5 ${challenge.color}`} />
                  <div>
                    <div className="font-semibold">{challenge.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {challenge.description}
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleShareAchievement(challenge)}
                      className="mt-2"
                    >
                      <Share2 className="w-4 h-4 mr-2" />
                      Compartilhar
                    </Button>
                  </div>
                </div>
                <Badge variant="outline">{challenge.points} pts</Badge>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progresso</span>
                  <span>
                    {challenge.progress}/{challenge.maxProgress}
                  </span>
                </div>
                <Progress value={progressPercentage} className="h-2" />
              </div>

              {challenge.completed && (
                <div className="mt-3 flex items-center space-x-2 text-primary">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-sm font-medium">
                    Desafio Concluído!
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );

  const renderReferrals = () => (
    <div className="space-y-6">
      {/* Estatísticas de Indicação */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Users className="w-8 h-8 text-primary mx-auto mb-2" />
            <div className="text-2xl font-bold text-foreground">
              {loyaltyData.referralProgram?.referredFriends}
            </div>
            <div className="text-sm text-muted-foreground">
              Amigos Indicados
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <DollarSign className="w-8 h-8 text-primary mx-auto mb-2" />
            <div className="text-2xl font-bold text-foreground">
              {loyaltyData.referralProgram?.totalEarned}
            </div>
            <div className="text-sm text-muted-foreground">
              Pontos Ganhos
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <Gift className="w-8 h-8 text-primary mx-auto mb-2" />
            <div className="text-2xl font-bold text-foreground">
              {loyaltyData.referralProgram?.pendingRewards}
            </div>
            <div className="text-sm text-muted-foreground">
              Pontos Pendentes
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Código de Indicação */}
      <Card>
        <CardHeader>
          <CardTitle>Seu Código de Indicação</CardTitle>
          <CardDescription>
            Compartilhe seu código e ganhe pontos quando seus amigos se
            cadastrarem
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <div className="flex-1 p-3 bg-muted rounded-lg font-mono text-lg">
              {loyaltyData.referralProgram?.code}
            </div>
            <Button variant="outline" onClick={handleInviteFriend}>
              <Share2 className="w-4 h-4 mr-2" />
              Compartilhar
            </Button>
          </div>

              <div className="bg-primary/10 p-4 rounded-lg">
                <div className="flex items-start space-x-2">
                  <Info className="w-5 h-5 text-primary mt-0.5" />
                  <div className="text-sm text-primary">
                <p className="font-medium mb-1">Como funciona:</p>
                <ul className="space-y-1 text-xs">
                  <li>• Você ganha 100 pontos quando um amigo se cadastra</li>
                  <li>• Seu amigo ganha 50 pontos de boas-vindas</li>
                  <li>• Ambos ganham 10% de desconto na primeira compra</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Histórico de Indicações */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Indicações</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {loyaltyData.referralProgram?.rewards?.map((reward, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div>
                  <div className="font-medium">{reward.friend}</div>
                  <div className="text-sm text-muted-foreground">
                    Cadastrado em {new Date(reward.date).toLocaleDateString()}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-primary">
                    +{reward.points} pts
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {reward.status === "completed" ? "Concluído" : "Pendente"}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderHistory = () => (
    <div className="space-y-4">
      {loyaltyData.pointsHistory?.map((entry, index) => (
        <Card key={index}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-primary/10/20 rounded-full flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <div className="font-medium">{entry.action}</div>
                  <div className="text-sm text-muted-foreground">
                    {entry.description}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(entry.date).toLocaleDateString()}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-semibold text-primary">
                  +{entry.points} pts
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" role="status" aria-label="Carregando programa de fidelidade">
            <span className="sr-only">Carregando programa de fidelidade...</span>
          </div>
          <p className="text-muted-foreground">
            Carregando programa de fidelidade...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">
            Programa de Fidelidade
          </h2>
          <p className="text-muted-foreground">
            Ganhe pontos, suba de nível e desbloqueie benefícios exclusivos
          </p>
          <Button
            variant="outline"
            onClick={() => setLoading(true)}
            className="mt-2"
          >
            <TrendingUp className="w-4 h-4 mr-2" />
            Atualizar
          </Button>
          {loading && (
            <div className="flex items-center space-x-2 mt-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" role="status" aria-label="Carregando">
                <span className="sr-only">Carregando...</span>
              </div>
              <span className="text-sm text-muted-foreground">Carregando...</span>
            </div>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="secondary" className="bg-primary/10 text-primary">
            {loyaltyData.currentTier?.name}
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              handleShareAchievement({
                tier: loyaltyData.currentTier,
                points: loyaltyData.currentPoints,
              })
            }
          >
            <Settings className="w-4 h-4 mr-2" />
            Compartilhar
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-muted p-1 rounded-lg">
        {tabs.map((tab) => {
          const IconComponent = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <IconComponent className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Content */}
      {activeTab === "overview" && renderOverview()}
      {activeTab === "rewards" && renderRewards()}
      {activeTab === "challenges" && renderChallenges()}
      {activeTab === "referrals" && renderReferrals()}
      {activeTab === "history" && renderHistory()}
    </div>
  );
};
