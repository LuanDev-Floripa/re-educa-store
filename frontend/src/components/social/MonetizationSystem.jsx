import React, { useState, useEffect } from "react";
import logger from "@/utils/logger";
import apiClient from "@/services/apiClient";
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
  onSendTip,
  onPurchaseCoins,
  onWithdrawEarnings,
  onUnsubscribeFromUser,
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
  const [selectedUser] = useState(null);
  const [tipAmount, setTipAmount] = useState(0);
  const [purchaseAmount, setPurchaseAmount] = useState(0);
  const [withdrawAmount, setWithdrawAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("card");

  // Carregar dados reais de monetização da API
  useEffect(() => {
    const loadMonetizationData = async () => {
      try {
        // Carregar subscriptions, transactions e balance em paralelo
        const [subsData, transData, balanceData] = await Promise.all([
          apiClient.request("/social/monetization/subscriptions").catch(() => ({ subscriptions: [] })),
          apiClient.request("/social/monetization/transactions").catch(() => ({ transactions: [] })),
          apiClient.request("/social/monetization/balance").catch(() => ({ balance: 0, coins: 0 })),
        ]);

        setSubscriptions(subsData.subscriptions || subsData.data || []);

        const transactionsList = transData.transactions || transData.data || [];
        setTransactions(transactionsList);

        // Calcular balance e earnings a partir das transactions
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
        setBalance(balanceData.balance || (totalEarnings - totalSpent));
        setCoins(balanceData.coins || 0);
      } catch (error) {
        logger.error("Erro ao carregar dados de monetização:", error);
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
    } catch {
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
    } catch {
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
    } catch {
      toast.error("Erro ao solicitar saque");
    }
  };

  const handleUnsubscribeFromUser = async (subscriptionId) => {
    try {
      if (onUnsubscribeFromUser) {
        await onUnsubscribeFromUser(subscriptionId);
      }
      setSubscriptions((prev) => prev.filter((s) => s.id !== subscriptionId));
      toast.success("Assinatura cancelada");
    } catch {
      toast.error("Erro ao cancelar assinatura");
    }
  };

  const handleSendGift = async (gift) => {
    try {
      if (!selectedUser?.id) {
        toast.error("Selecione um usuário para enviar o presente");
        return;
      }

      if (coins < gift.cost) {
        toast.error("Moedas insuficientes");
        return;
      }

      const response = await apiClient.post("/social/monetization/gift", {
        user_id: selectedUser.id,
        gift_id: gift.id,
        gift_name: gift.name,
        gift_cost: gift.cost,
        message: `Presente: ${gift.name}`,
      });

      if (response.success) {
        setCoins((prev) => prev - gift.cost);
        setShowGiftModal(false);
        toast.success(`Presente ${gift.name} enviado!`);
      } else {
        toast.error(response.error || "Erro ao enviar presente");
      }
    } catch (error) {
      logger.error("Erro ao enviar presente:", error);
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
    { id: 1, name: "Coração", emoji: "❤️", cost: 10, color: "text-destructive" },
    { id: 2, name: "Estrela", emoji: "⭐", cost: 25, color: "text-primary" },
    { id: 3, name: "Diamante", emoji: "💎", cost: 50, color: "text-primary" },
    { id: 4, name: "Coroa", emoji: "👑", cost: 100, color: "text-primary" },
    {
      id: 5,
      name: "Foguete",
      emoji: "🚀",
      cost: 200,
      color: "text-primary",
    },
    {
      id: 6,
      name: "Presente",
      emoji: "🎁",
      cost: 500,
      color: "text-primary",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">
            Sistema de Monetização
          </h2>
          <p className="text-muted-foreground">
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
                <p className="text-sm font-medium text-muted-foreground">
                  Saldo Disponível
                </p>
                <p className="text-2xl font-bold text-foreground">
                  R$ {balance.toFixed(2)}
                </p>
              </div>
              <div className="p-3 bg-primary/10 rounded-full">
                <Wallet className="w-6 h-6 text-primary" />
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
                <p className="text-sm font-medium text-muted-foreground">
                  Moedas
                </p>
                <p className="text-2xl font-bold text-foreground">
                  {coins.toLocaleString()}
                </p>
              </div>
              <div className="p-3 bg-primary/10 rounded-full">
                <Coins className="w-6 h-6 text-primary" />
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
                <p className="text-sm font-medium text-muted-foreground">
                  Ganhos Totais
                </p>
                <p className="text-2xl font-bold text-foreground">
                  R$ {earnings.toFixed(2)}
                </p>
              </div>
              <div className="p-3 bg-primary/10 rounded-full">
                <TrendingUp className="w-6 h-6 text-primary" />
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
                            ? "bg-primary/10"
                            : "bg-destructive/10"
                        }`}
                      >
                        {transaction.type === "tip_received" ? (
                          <Heart className="w-5 h-5 text-primary" />
                        ) : transaction.type === "subscription_payment" ? (
                          <Crown className="w-5 h-5 text-destructive" />
                        ) : transaction.type === "coin_purchase" ? (
                          <Coins className="w-5 h-5 text-destructive" />
                        ) : transaction.type === "gift_sent" ? (
                          <Gift className="w-5 h-5 text-destructive" />
                        ) : (
                          <ArrowDown className="w-5 h-5 text-destructive" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-foreground">
                          {transaction.description}
                        </p>
                        <p className="text-sm text-muted-foreground">
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
                            ? "text-primary"
                            : "text-destructive"
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
                      <h3 className="font-semibold text-foreground">
                        {subscription.user.name}
                      </h3>
                      <p className="text-sm text-muted-foreground">
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
                    <span className="text-lg font-bold text-foreground">
                      R$ {subscription.price.toFixed(2)}/mês
                    </span>
                  </div>

                  <div>
                    <h4 className="font-medium text-foreground mb-2">
                      Benefícios
                    </h4>
                    <ul className="space-y-1">
                      {subscription.benefits.map((benefit, index) => (
                        <li
                          key={index}
                          className="text-sm text-muted-foreground flex items-center space-x-2"
                        >
                          <Check className="w-3 h-3 text-primary" />
                          <span>{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="text-sm text-muted-foreground">
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
                  <label className="block text-sm font-medium text-foreground mb-2">
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
                  <label className="block text-sm font-medium text-foreground mb-2">
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
                    <span className="text-xs text-muted-foreground">
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
                <label className="block text-sm font-medium text-foreground mb-2">
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
                <label className="block text-sm font-medium text-foreground mb-2">
                  Valor do Saque
                </label>
                <Input
                  type="number"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(Number(e.target.value))}
                  placeholder="Digite o valor"
                  className="w-full"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Disponível: R$ {earnings.toFixed(2)}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Método de Pagamento
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-background border-border text-foreground"
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

      {/* Modal de Envio de Presente */}
      {showGiftModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Enviar Presente</CardTitle>
              <Button
                onClick={() => setShowGiftModal(false)}
                variant="ghost"
                size="sm"
              >
                <X className="w-4 h-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Selecionar Presente
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {gifts.map((gift) => (
                    <Button
                      key={gift.id}
                      type="button"
                      variant="outline"
                      onClick={() => handleSendGift(gift)}
                      className="flex flex-col items-center space-y-2 h-auto py-4"
                      disabled={coins < gift.cost}
                    >
                      <span className="text-2xl">{gift.emoji}</span>
                      <span className="text-sm">{gift.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {gift.cost} moedas
                      </span>
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default MonetizationSystem;
