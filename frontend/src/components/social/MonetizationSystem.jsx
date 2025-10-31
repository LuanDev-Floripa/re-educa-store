import React, { useState, useEffect } from "react";
/**
 * Sistema de Monetização do Social.
 * - Assinaturas, dicas, presentes e transações
 * - Fallbacks em listas/valores e toasts nas interações
 */
import { Card, CardContent, CardHeader, CardTitle } from "../Ui/card";
import { Button } from "../Ui/button";
import { Input } from "../Ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "../Ui/avatar";
import { Badge } from "../Ui/badge";
import { Progress } from "../Ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../Ui/tabs";
import {
  DollarSign,
  Plus,
  Minus,
  Gift,
  Heart,
  Star,
  Crown,
  Zap,
  TrendingUp,
  CreditCard,
  Wallet,
  Banknote,
  Coins,
  Gem,
  Award,
  Trophy,
  Target,
  X,
  Check,
  ArrowUp,
  ArrowDown,
  Eye,
  Users,
  MessageCircle,
  Share2,
  Settings,
  Bell,
  Lock,
  Unlock,
  Edit,
  Trash2,
  Flag,
  MoreHorizontal,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

const MonetizationSystem = ({
  // eslint-disable-next-line no-unused-vars
  currentUser,
  onSendTip,
  onPurchaseCoins,
  onWithdrawEarnings,
  onSubscribeToUser,
  onUnsubscribeFromUser,
  // eslint-disable-next-line no-unused-vars
  onPurchasePremium,
  onSendGift,
  // eslint-disable-next-line no-unused-vars
  onCreatePaidContent,
  // eslint-disable-next-line no-unused-vars
  onPurchaseContent,
}) => {
  const [balance, setBalance] = useState(0);
  const [coins, setCoins] = useState(0);
  const [earnings, setEarnings] = useState(0);
  const [subscriptions, setSubscriptions] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [showTipModal, setShowTipModal] = useState(false);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showGiftModal, setShowGiftModal] = useState(false);
  // eslint-disable-next-line no-unused-vars
  const [selectedUser, setSelectedUser] = useState(null);
  const [tipAmount, setTipAmount] = useState(0);
  const [purchaseAmount, setPurchaseAmount] = useState(0);
  const [withdrawAmount, setWithdrawAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("card");

  // Carregar dados reais de monetização da API
  useEffect(() => {
    const loadMonetizationData = async () => {
      try {
        const token =
          localStorage.getItem("auth_token") || localStorage.getItem("token");

        // Carregar subscriptions
        const subscriptionsResponse = await fetch(
          "/api/social/monetization/subscriptions",
          {
            method: "GET",
            headers: {
              Authorization: token ? `Bearer ${token}` : "",
              "Content-Type": "application/json",
            },
          },
        );

        if (subscriptionsResponse.ok) {
          const subsData = await subscriptionsResponse.json();
          setSubscriptions(subsData.subscriptions || subsData.data || []);
        } else {
          setSubscriptions([]);
        }

        // Carregar transactions
        const transactionsResponse = await fetch(
          "/api/social/monetization/transactions",
          {
            method: "GET",
            headers: {
              Authorization: token ? `Bearer ${token}` : "",
              "Content-Type": "application/json",
            },
          },
        );

        if (transactionsResponse.ok) {
          const transData = await transactionsResponse.json();
          setTransactions(transData.transactions || transData.data || []);

          // Calcular balance e earnings a partir das transactions
          const transactionsList =
            transData.transactions || transData.data || [];
          const totalEarnings = transactionsList
            .filter(
              (t) =>
                t.type === "tip_received" || t.type === "subscription_payment",
            )
            .reduce((sum, t) => sum + (Math.abs(t.amount) || 0), 0);
          const totalSpent = transactionsList
            .filter((t) => t.amount < 0)
            .reduce((sum, t) => sum + Math.abs(t.amount || 0), 0);

          setEarnings(totalEarnings);
          setBalance(totalEarnings - totalSpent);
        } else {
          setTransactions([]);
        }

        // Buscar balance e coins do endpoint de stats ou monetization/balance
        try {
          const balanceResponse = await fetch(
            "/api/social/monetization/balance",
            {
              method: "GET",
              headers: {
                Authorization: token ? `Bearer ${token}` : "",
                "Content-Type": "application/json",
              },
            },
          );

          if (balanceResponse.ok) {
            const balanceData = await balanceResponse.json();
            if (balanceData.balance !== undefined)
              setBalance(balanceData.balance || 0);
            if (balanceData.coins !== undefined)
              setCoins(balanceData.coins || 0);
            if (balanceData.earnings !== undefined)
              setEarnings(balanceData.earnings || 0);
          } else {
            // Se endpoint não existir, manter valores zerados (não hardcoded)
            setBalance(0);
            setCoins(0);
            setEarnings(0);
          }
        } catch (error) {
          // Em caso de erro, manter zerado ao invés de hardcoded
          console.error("Erro ao carregar balance:", error);
          setBalance(0);
          setCoins(0);
          setEarnings(0);
        }
      } catch (error) {
        console.error("Erro ao carregar dados de monetização:", error);
        setSubscriptions([]);
        setTransactions([]);
        // Manter valores zerados ao invés de hardcoded
        setBalance(0);
        setCoins(0);
        setEarnings(0);
      }
    };

    loadMonetizationData();
  }, []);

  const handleSendTip = async () => {
    if (tipAmount <= 0) {
      toast.error("Digite um valor válido para a dica");
      return;
    }

    if (tipAmount > balance) {
      toast.error("Saldo insuficiente");
      return;
    }

    try {
      if (onSendTip) {
        await onSendTip({
        userId: selectedUser?.id,
        amount: tipAmount,
        message: `Dica de R$ ${tipAmount.toFixed(2)}`,
        });
      }

      setBalance((prev) => prev - tipAmount);
      setTipAmount(0);
      setShowTipModal(false);
      toast.success(`Dica de R$ ${tipAmount.toFixed(2)} enviada!`);
    } catch (error) {
      toast.error("Erro ao enviar dica");
    }
  };

  const handlePurchaseCoins = async () => {
    if (purchaseAmount <= 0) {
      toast.error("Selecione um pacote de moedas");
      return;
    }

    try {
      if (onPurchaseCoins) {
        await onPurchaseCoins({
        amount: purchaseAmount,
        paymentMethod,
        });
      }

      setCoins((prev) => prev + purchaseAmount);
      setShowPurchaseModal(false);
      toast.success(`${purchaseAmount} moedas adicionadas!`);
    } catch (error) {
      toast.error("Erro ao comprar moedas");
    }
  };

  const handleWithdrawEarnings = async () => {
    if (withdrawAmount <= 0) {
      toast.error("Digite um valor válido para saque");
      return;
    }

    if (withdrawAmount > earnings) {
      toast.error("Valor maior que os ganhos disponíveis");
      return;
    }

    try {
      if (onWithdrawEarnings) {
        await onWithdrawEarnings({
        amount: withdrawAmount,
        paymentMethod,
        });
      }

      setEarnings((prev) => prev - withdrawAmount);
      setWithdrawAmount(0);
      setShowWithdrawModal(false);
      toast.success(`Saque de R$ ${withdrawAmount.toFixed(2)} solicitado!`);
    } catch (error) {
      toast.error("Erro ao solicitar saque");
    }
  };

  const handleSubscribeToUser = async (userId, plan) => {
    try {
      if (onSubscribeToUser) {
        await onSubscribeToUser(userId, plan);
      }
      toast.success("Assinatura ativada!");
    } catch (error) {
      toast.error("Erro ao ativar assinatura");
    }
  };

  const handleUnsubscribeFromUser = async (subscriptionId) => {
    try {
      if (onUnsubscribeFromUser) {
        await onUnsubscribeFromUser(subscriptionId);
      }
      setSubscriptions((prev) => prev.filter((s) => s.id !== subscriptionId));
      toast.success("Assinatura cancelada");
    } catch (error) {
      toast.error("Erro ao cancelar assinatura");
    }
  };

  const handleSendGift = async (gift) => {
    try {
      if (onSendGift) {
        await onSendGift({
        userId: selectedUser?.id,
        gift,
        message: `Presente: ${gift.name}`,
        });
      }

      setCoins((prev) => prev - gift.cost);
      setShowGiftModal(false);
      toast.success(`Presente ${gift.name} enviado!`);
    } catch (error) {
      toast.error("Erro ao enviar presente");
    }
  };

  const coinPackages = [
    { amount: 100, price: 4.99, bonus: 0 },
    { amount: 500, price: 19.99, bonus: 50 },
    { amount: 1000, price: 39.99, bonus: 150 },
    { amount: 2500, price: 89.99, bonus: 500 },
    { amount: 5000, price: 159.99, bonus: 1250 },
  ];

  const gifts = [
    { id: 1, name: "Coração", emoji: "❤️", cost: 10, color: "text-red-500" },
    { id: 2, name: "Estrela", emoji: "⭐", cost: 25, color: "text-yellow-500" },
    { id: 3, name: "Diamante", emoji: "💎", cost: 50, color: "text-blue-500" },
    { id: 4, name: "Coroa", emoji: "👑", cost: 100, color: "text-purple-500" },
    {
      id: 5,
      name: "Foguete",
      emoji: "🚀",
      cost: 200,
      color: "text-orange-500",
    },
    {
      id: 6,
      name: "Presente",
      emoji: "🎁",
      cost: 500,
      color: "text-green-500",
    },
  ];

  // eslint-disable-next-line no-unused-vars
  const subscriptionPlans = [
    {
      id: "basic",
      name: "Básico",
      price: 4.99,
      features: ["Conteúdo premium", "Suporte prioritário"],
      color: "border-gray-300",
    },
    {
      id: "premium",
      name: "Premium",
      price: 9.99,
      features: ["Conteúdo exclusivo", "Acesso antecipado", "Chat privado"],
      color: "border-blue-500",
    },
    {
      id: "vip",
      name: "VIP",
      price: 19.99,
      features: [
        "Tudo do Premium",
        "Mentoria personalizada",
        "Acesso a eventos",
      ],
      color: "border-purple-500",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Sistema de Monetização
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Gerencie seus ganhos e investimentos na plataforma
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="flex items-center space-x-1">
            <Wallet className="w-4 h-4" />
            <span>R$ {balance.toFixed(2)}</span>
          </Badge>
          <Badge variant="outline" className="flex items-center space-x-1">
            <Coins className="w-4 h-4" />
            <span>{coins.toLocaleString()} moedas</span>
          </Badge>
        </div>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Saldo Disponível
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  R$ {balance.toFixed(2)}
                </p>
              </div>
              <div className="p-3 bg-green-100 dark:bg-green-900 rounded-full">
                <Wallet className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <Button
              onClick={() => setShowWithdrawModal(true)}
              className="w-full mt-4"
              variant="outline"
            >
              <ArrowDown className="w-4 h-4 mr-2" />
              Sacar
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Moedas
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {coins.toLocaleString()}
                </p>
              </div>
              <div className="p-3 bg-yellow-100 dark:bg-yellow-900 rounded-full">
                <Coins className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
            <Button
              onClick={() => setShowPurchaseModal(true)}
              className="w-full mt-4"
            >
              <Plus className="w-4 h-4 mr-2" />
              Comprar
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Ganhos Totais
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  R$ {earnings.toFixed(2)}
                </p>
              </div>
              <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
                <TrendingUp className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <Button
              onClick={() => setShowWithdrawModal(true)}
              className="w-full mt-4"
              variant="outline"
            >
              <ArrowDown className="w-4 h-4 mr-2" />
              Sacar
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="transactions" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="transactions">Transações</TabsTrigger>
          <TabsTrigger value="subscriptions">Assinaturas</TabsTrigger>
          <TabsTrigger value="tips">Dicas</TabsTrigger>
          <TabsTrigger value="gifts">Presentes</TabsTrigger>
        </TabsList>

        {/* Transações */}
        <TabsContent value="transactions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Transações</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {transactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center space-x-4">
                      <div
                        className={`p-2 rounded-full ${
                          transaction.type === "tip_received" ||
                          transaction.type === "gift_received"
                            ? "bg-green-100 dark:bg-green-900"
                            : "bg-red-100 dark:bg-red-900"
                        }`}
                      >
                        {transaction.type === "tip_received" ? (
                          <Heart className="w-5 h-5 text-green-600 dark:text-green-400" />
                        ) : transaction.type === "subscription_payment" ? (
                          <Crown className="w-5 h-5 text-red-600 dark:text-red-400" />
                        ) : transaction.type === "coin_purchase" ? (
                          <Coins className="w-5 h-5 text-red-600 dark:text-red-400" />
                        ) : transaction.type === "gift_sent" ? (
                          <Gift className="w-5 h-5 text-red-600 dark:text-red-400" />
                        ) : (
                          <ArrowDown className="w-5 h-5 text-red-600 dark:text-red-400" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {transaction.description}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {formatDistanceToNow(transaction.timestamp, {
                            addSuffix: true,
                            locale: ptBR,
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p
                        className={`font-bold ${
                          transaction.amount > 0
                            ? "text-green-600 dark:text-green-400"
                            : "text-red-600 dark:text-red-400"
                        }`}
                      >
                        {transaction.amount > 0 ? "+" : ""}R${" "}
                        {Math.abs(transaction.amount).toFixed(2)}
                      </p>
                      <Badge
                        variant={
                          transaction.status === "completed"
                            ? "default"
                            : "secondary"
                        }
                      >
                        {transaction.status === "completed"
                          ? "Concluído"
                          : "Pendente"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Assinaturas */}
        <TabsContent value="subscriptions" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {subscriptions.map((subscription) => (
              <Card key={subscription.id} className="overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-center space-x-3">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={subscription.user.avatar} />
                      <AvatarFallback>
                        {subscription.user.name[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {subscription.user.name}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        @{subscription.user.username}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Badge
                      variant={
                        subscription.plan === "premium"
                          ? "default"
                          : "secondary"
                      }
                    >
                      {subscription.plan === "premium" ? "Premium" : "Básico"}
                    </Badge>
                    <span className="text-lg font-bold text-gray-900 dark:text-white">
                      R$ {subscription.price.toFixed(2)}/mês
                    </span>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                      Benefícios
                    </h4>
                    <ul className="space-y-1">
                      {subscription.benefits.map((benefit, index) => (
                        <li
                          key={index}
                          className="text-sm text-gray-600 dark:text-gray-400 flex items-center space-x-2"
                        >
                          <Check className="w-3 h-3 text-green-500" />
                          <span>{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Próxima cobrança:{" "}
                    {formatDistanceToNow(subscription.nextBilling, {
                      addSuffix: true,
                      locale: ptBR,
                    })}
                  </div>

                  <Button
                    onClick={() => handleUnsubscribeFromUser(subscription.id)}
                    variant="outline"
                    className="w-full"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancelar Assinatura
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Dicas */}
        <TabsContent value="tips" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Enviar Dica</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Valor da Dica
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {[5, 10, 25, 50].map((amount) => (
                      <Button
                        key={amount}
                        onClick={() => setTipAmount(amount)}
                        variant={tipAmount === amount ? "default" : "outline"}
                        className="w-full"
                      >
                        R$ {amount}
                      </Button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Valor Personalizado
                  </label>
                  <Input
                    type="number"
                    value={tipAmount}
                    onChange={(e) => setTipAmount(Number(e.target.value))}
                    placeholder="Digite o valor"
                    className="w-full"
                  />
                </div>

                <Button
                  onClick={() => setShowTipModal(true)}
                  className="w-full"
                  disabled={tipAmount <= 0}
                >
                  <Heart className="w-4 h-4 mr-2" />
                  Enviar Dica
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Presentes */}
        <TabsContent value="gifts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Enviar Presente</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {gifts.map((gift) => (
                  <Button
                    key={gift.id}
                    onClick={() => handleSendGift(gift)}
                    variant="outline"
                    className="flex flex-col items-center space-y-2 p-4 h-auto"
                    disabled={coins < gift.cost}
                  >
                    <span className={`text-3xl ${gift.color}`}>
                      {gift.emoji}
                    </span>
                    <span className="text-sm font-medium">{gift.name}</span>
                    <span className="text-xs text-gray-500">
                      {gift.cost} moedas
                    </span>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal de Envio de Dica */}
      {showTipModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Enviar Dica</CardTitle>
              <Button
                onClick={() => setShowTipModal(false)}
                variant="ghost"
                size="sm"
              >
                <X className="w-4 h-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Valor da Dica
                </label>
                <Input
                  type="number"
                  value={tipAmount}
                  onChange={(e) => setTipAmount(Number(e.target.value))}
                  placeholder="Digite o valor"
                  className="w-full"
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  onClick={() => setShowTipModal(false)}
                  variant="outline"
                >
                  Cancelar
                </Button>
                <Button onClick={handleSendTip}>
                  <Heart className="w-4 h-4 mr-2" />
                  Enviar Dica
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal de Compra de Moedas */}
      {showPurchaseModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Comprar Moedas</CardTitle>
              <Button
                onClick={() => setShowPurchaseModal(false)}
                variant="ghost"
                size="sm"
              >
                <X className="w-4 h-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                {coinPackages.map((pkg) => (
                  <Button
                    key={pkg.amount}
                    onClick={() => setPurchaseAmount(pkg.amount)}
                    variant={
                      purchaseAmount === pkg.amount ? "default" : "outline"
                    }
                    className="w-full justify-between"
                  >
                    <span>{pkg.amount} moedas</span>
                    <span>R$ {pkg.price.toFixed(2)}</span>
                  </Button>
                ))}
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  onClick={() => setShowPurchaseModal(false)}
                  variant="outline"
                >
                  Cancelar
                </Button>
                <Button onClick={handlePurchaseCoins}>
                  <CreditCard className="w-4 h-4 mr-2" />
                  Comprar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal de Saque */}
      {showWithdrawModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Solicitar Saque</CardTitle>
              <Button
                onClick={() => setShowWithdrawModal(false)}
                variant="ghost"
                size="sm"
              >
                <X className="w-4 h-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Valor do Saque
                </label>
                <Input
                  type="number"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(Number(e.target.value))}
                  placeholder="Digite o valor"
                  className="w-full"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Disponível: R$ {earnings.toFixed(2)}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Método de Pagamento
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                >
                  <option value="card">Cartão de Crédito</option>
                  <option value="pix">PIX</option>
                  <option value="bank">Transferência Bancária</option>
                </select>
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  onClick={() => setShowWithdrawModal(false)}
                  variant="outline"
                >
                  Cancelar
                </Button>
                <Button onClick={handleWithdrawEarnings}>
                  <ArrowDown className="w-4 h-4 mr-2" />
                  Solicitar Saque
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default MonetizationSystem;
