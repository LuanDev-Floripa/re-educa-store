import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/Ui/card';
import { Button } from '@/components/Ui/button';
import { Badge } from '@/components/Ui/badge';
import { Input } from '@/components/Ui/input';
import { Label } from '@/components/Ui/label';
import { 
  Users, 
  DollarSign, 
  TrendingUp, 
  Share2, 
  Copy, 
  Check, 
  Link, 
  BarChart3, 
  PieChart, 
  Target, 
  Award, 
  Calendar, 
  Clock, 
  Eye, 
  MousePointer, 
  ShoppingCart, 
  CreditCard, 
  Gift, 
  Star, 
  Zap, 
  Crown, 
  Trophy, 
  Activity, 
  MessageCircle, 
  Mail, 
  Phone, 
  MapPin, 
  Globe, 
  Instagram, 
  Facebook, 
  Twitter, 
  Youtube, 
  Linkedin, 
  Tiktok, 
  Twitch, 
  Download, 
  Upload, 
  RefreshCw, 
  Settings, 
  Plus, 
  Edit, 
  Trash2, 
  Filter, 
  Search, 
  ArrowRight, 
  ArrowLeft, 
  ExternalLink, 
  Info, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Minus, 
  Plus as PlusIcon,
  Diamond
} from 'lucide-react';

export const AffiliateIntegration = ({ 
  userProfile = {},
  onGenerateLink,
  onTrackConversion,
  onPayoutRequest,
  showAdminFeatures = false
}) => {
  const [affiliateData, setAffiliateData] = useState({});
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [copiedLink, setCopiedLink] = useState(null);

  // Dados do usuário de exemplo
  const defaultUserProfile = {
    id: 1,
    name: 'João Silva',
    email: 'joao@email.com',
    phone: '+55 11 99999-9999',
    address: 'São Paulo, SP',
    socialMedia: {
      instagram: '@joaosilva',
      youtube: 'João Silva Fitness',
      tiktok: '@joaofitness'
    },
    memberSince: '2023-01-15',
    totalSpent: 2450.80,
    totalOrders: 23
  };

  const currentUserProfile = { ...defaultUserProfile, ...userProfile };

  // Dados do programa de afiliados
  const affiliateProgramData = useMemo(() => ({
    status: 'active',
    tier: 'gold',
    commissionRate: 8,
    referralCode: 'JOÃO2024',
    totalEarnings: 1250.50,
    pendingEarnings: 180.25,
    paidEarnings: 1070.25,
    totalReferrals: 45,
    activeReferrals: 32,
    totalClicks: 1250,
    totalConversions: 45,
    conversionRate: 3.6,
    averageOrderValue: 156.80,
    lastPayout: '2024-01-01',
    nextPayout: '2024-02-01',
    paymentMethod: 'PIX',
    paymentDetails: {
      pix: 'joao@email.com',
      bank: 'Banco do Brasil',
      account: '12345-6',
      agency: '1234'
    },
    performance: {
      thisMonth: {
        clicks: 180,
        conversions: 8,
        earnings: 125.60,
        referrals: 5
      },
      lastMonth: {
        clicks: 220,
        conversions: 12,
        earnings: 189.40,
        referrals: 8
      },
      thisYear: {
        clicks: 1250,
        conversions: 45,
        earnings: 1250.50,
        referrals: 32
      }
    },
    links: [
      {
        id: 1,
        name: 'Link Principal',
        url: 'https://re-educa.com.br/?ref=JOÃO2024',
        product: 'all',
        category: 'all',
        clicks: 450,
        conversions: 18,
        earnings: 225.60,
        createdAt: '2023-01-15',
        isActive: true
      },
      {
        id: 2,
        name: 'Suplementos',
        url: 'https://re-educa.com.br/suplementos?ref=JOÃO2024',
        product: 'all',
        category: 'Suplementos',
        clicks: 320,
        conversions: 15,
        earnings: 189.40,
        createdAt: '2023-02-01',
        isActive: true
      },
      {
        id: 3,
        name: 'Whey Protein',
        url: 'https://re-educa.com.br/produto/whey-protein?ref=JOÃO2024',
        product: 'whey-protein',
        category: 'Suplementos',
        clicks: 180,
        conversions: 8,
        earnings: 125.60,
        createdAt: '2023-03-15',
        isActive: true
      },
      {
        id: 4,
        name: 'Equipamentos',
        url: 'https://re-educa.com.br/equipamentos?ref=JOÃO2024',
        product: 'all',
        category: 'Equipamentos',
        clicks: 120,
        conversions: 4,
        earnings: 89.20,
        createdAt: '2023-04-01',
        isActive: false
      }
    ],
    referrals: [
      {
        id: 1,
        name: 'Maria Santos',
        email: 'maria@email.com',
        status: 'active',
        joinedAt: '2023-12-15',
        totalSpent: 450.80,
        totalOrders: 3,
        lastOrder: '2024-01-10',
        commission: 36.06,
        tier: 'bronze'
      },
      {
        id: 2,
        name: 'Pedro Costa',
        email: 'pedro@email.com',
        status: 'active',
        joinedAt: '2023-11-20',
        totalSpent: 890.50,
        totalOrders: 5,
        lastOrder: '2024-01-08',
        commission: 71.24,
        tier: 'silver'
      },
      {
        id: 3,
        name: 'Ana Silva',
        email: 'ana@email.com',
        status: 'inactive',
        joinedAt: '2023-10-10',
        totalSpent: 120.00,
        totalOrders: 1,
        lastOrder: '2023-10-15',
        commission: 9.60,
        tier: 'bronze'
      }
    ],
    payouts: [
      {
        id: 1,
        amount: 189.40,
        status: 'paid',
        date: '2024-01-01',
        method: 'PIX',
        reference: 'PAY-2024-001'
      },
      {
        id: 2,
        amount: 156.80,
        status: 'paid',
        date: '2023-12-01',
        method: 'PIX',
        reference: 'PAY-2023-012'
      },
      {
        id: 3,
        amount: 180.25,
        status: 'pending',
        date: '2024-02-01',
        method: 'PIX',
        reference: 'PAY-2024-002'
      }
    ],
    tiers: [
      {
        id: 'bronze',
        name: 'Bronze',
        level: 1,
        minReferrals: 0,
        maxReferrals: 9,
        commissionRate: 5,
        benefits: [
          '5% de comissão',
          'Relatórios básicos',
          'Suporte por email'
        ],
        color: 'text-orange-600',
        bgColor: 'bg-orange-50',
        icon: Award
      },
      {
        id: 'silver',
        name: 'Silver',
        level: 2,
        minReferrals: 10,
        maxReferrals: 24,
        commissionRate: 6,
        benefits: [
          '6% de comissão',
          'Relatórios avançados',
          'Suporte prioritário',
          'Materiais de marketing'
        ],
        color: 'text-gray-600',
        bgColor: 'bg-gray-50',
        icon: Star
      },
      {
        id: 'gold',
        name: 'Gold',
        level: 3,
        minReferrals: 25,
        maxReferrals: 49,
        commissionRate: 8,
        benefits: [
          '8% de comissão',
          'Relatórios premium',
          'Suporte prioritário',
          'Materiais de marketing',
          'Acesso a eventos exclusivos'
        ],
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-50',
        icon: Crown
      },
      {
        id: 'platinum',
        name: 'Platinum',
        level: 4,
        minReferrals: 50,
        maxReferrals: 99,
        commissionRate: 10,
        benefits: [
          '10% de comissão',
          'Relatórios premium',
          'Suporte dedicado',
          'Materiais de marketing',
          'Acesso a eventos exclusivos',
          'Consultoria personalizada'
        ],
        color: 'text-purple-600',
        bgColor: 'bg-purple-50',
        icon: Trophy
      },
      {
        id: 'diamond',
        name: 'Diamond',
        level: 5,
        minReferrals: 100,
        maxReferrals: Infinity,
        commissionRate: 12,
        benefits: [
          '12% de comissão',
          'Relatórios premium',
          'Suporte dedicado',
          'Materiais de marketing',
          'Acesso a eventos exclusivos',
          'Consultoria personalizada',
          'Bônus mensais',
          'Programa de mentoria'
        ],
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
        icon: Diamond
      }
    ],
    materials: [
      {
        id: 1,
        name: 'Banner Principal',
        type: 'banner',
        size: '728x90',
        format: 'PNG',
        url: '/materials/banner-principal.png',
        description: 'Banner principal para sites e blogs'
      },
      {
        id: 2,
        name: 'Banner Retangular',
        type: 'banner',
        size: '300x250',
        format: 'PNG',
        url: '/materials/banner-retangular.png',
        description: 'Banner retangular para sidebars'
      },
      {
        id: 3,
        name: 'Post Instagram',
        type: 'social',
        size: '1080x1080',
        format: 'PNG',
        url: '/materials/post-instagram.png',
        description: 'Post para Instagram Stories'
      },
      {
        id: 4,
        name: 'Texto Promocional',
        type: 'text',
        format: 'TXT',
        url: '/materials/texto-promocional.txt',
        description: 'Texto promocional para usar em posts'
      }
    ]
  }), []);

  useEffect(() => {
    loadAffiliateData();
  }, [loadAffiliateData]);

  const loadAffiliateData = useCallback(async () => {
    setLoading(true);
    
    // Simular carregamento de API
    setTimeout(() => {
      setAffiliateData(affiliateProgramData);
      setLoading(false);
    }, 1000);
  }, [affiliateProgramData]);

  const handleCopyLink = (link) => {
    navigator.clipboard.writeText(link);
    setCopiedLink(link);
    setTimeout(() => setCopiedLink(null), 2000);
  };

  const handleGenerateLink = (product, category) => {
    if (onGenerateLink) {
      onGenerateLink(product, category);
    }
  };

  const handleTrackConversion = (linkId, conversionData) => {
    if (onTrackConversion) {
      onTrackConversion(linkId, conversionData);
    }
  };

  const handlePayoutRequest = () => {
    if (onPayoutRequest) {
      onPayoutRequest();
    }
  };

  const getTierIcon = (tierId) => {
    const tier = affiliateData.tiers?.find(t => t.id === tierId);
    return tier?.icon || Award;
  };

  const getTierColor = (tierId) => {
    const tier = affiliateData.tiers?.find(t => t.id === tierId);
    return tier?.color || 'text-gray-600';
  };

  const getTierBgColor = (tierId) => {
    const tier = affiliateData.tiers?.find(t => t.id === tierId);
    return tier?.bgColor || 'bg-gray-50';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'text-green-600';
      case 'inactive': return 'text-red-600';
      case 'pending': return 'text-yellow-600';
      case 'paid': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'active': return 'Ativo';
      case 'inactive': return 'Inativo';
      case 'pending': return 'Pendente';
      case 'paid': return 'Pago';
      default: return 'Desconhecido';
    }
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Status Atual */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Crown className="w-5 h-5 text-yellow-600" />
            <span>Status do Afiliado - {affiliateData.tier?.toUpperCase()}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <DollarSign className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                R$ {affiliateData.totalEarnings?.toFixed(2).replace('.', ',')}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Total Ganho
              </div>
            </div>
            
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <Users className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {affiliateData.totalReferrals}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Indicações
              </div>
            </div>
            
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <TrendingUp className="w-8 h-8 text-purple-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {affiliateData.conversionRate}%
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Taxa de Conversão
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Comissão Atual</span>
                <span className="text-lg font-bold text-green-600">
                  {affiliateData.commissionRate}%
                </span>
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                Baseado no seu nível {affiliateData.tier}
              </div>
            </div>
            
            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Próximo Pagamento</span>
                <span className="text-lg font-bold text-blue-600">
                  R$ {affiliateData.pendingEarnings?.toFixed(2).replace('.', ',')}
                </span>
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                {new Date(affiliateData.nextPayout).toLocaleDateString()}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Mensal */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Mensal</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-3">Este Mês</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Cliques</span>
                  <span className="font-medium">{affiliateData.performance?.thisMonth?.clicks}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Conversões</span>
                  <span className="font-medium">{affiliateData.performance?.thisMonth?.conversions}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Ganhos</span>
                  <span className="font-medium text-green-600">
                    R$ {affiliateData.performance?.thisMonth?.earnings?.toFixed(2).replace('.', ',')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Indicações</span>
                  <span className="font-medium">{affiliateData.performance?.thisMonth?.referrals}</span>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-medium mb-3">Mês Passado</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Cliques</span>
                  <span className="font-medium">{affiliateData.performance?.lastMonth?.clicks}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Conversões</span>
                  <span className="font-medium">{affiliateData.performance?.lastMonth?.conversions}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Ganhos</span>
                  <span className="font-medium text-green-600">
                    R$ {affiliateData.performance?.lastMonth?.earnings?.toFixed(2).replace('.', ',')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Indicações</span>
                  <span className="font-medium">{affiliateData.performance?.lastMonth?.referrals}</span>
                </div>
              </div>
            </div>
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
            {affiliateData.tiers?.map((tier) => {
              const IconComponent = getTierIcon(tier.id);
              const isCurrentTier = tier.id === affiliateData.tier;
              const isUnlocked = affiliateData.totalReferrals >= tier.minReferrals;
              
              return (
                <div
                  key={tier.id}
                  className={`p-4 border rounded-lg ${
                    isCurrentTier ? 'border-yellow-300 bg-yellow-50 dark:bg-yellow-900/20' : 
                    isUnlocked ? 'border-green-300 bg-green-50 dark:bg-green-900/20' : 
                    `border-gray-200 ${getTierBgColor(tier.id)} dark:bg-gray-800`
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <IconComponent className={`w-6 h-6 ${getTierColor(tier.id)}`} />
                      <div>
                        <div className="font-semibold">{tier.name}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {tier.minReferrals} - {tier.maxReferrals === Infinity ? '∞' : tier.maxReferrals} indicações
                        </div>
                        <div className="text-sm font-medium text-green-600">
                          {tier.commissionRate}% de comissão
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {isCurrentTier && (
                        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                          Atual
                        </Badge>
                      )}
                      {isUnlocked && !isCurrentTier && (
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          Desbloqueado
                        </Badge>
                      )}
                      {!isUnlocked && (
                        <Badge variant="outline">
                          Bloqueado
                        </Badge>
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

  const renderLinks = () => (
    <div className="space-y-4">
      {affiliateData.links?.map((link) => (
        <Card key={link.id} className="hover:shadow-lg transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-semibold">{link.name}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {link.category === 'all' ? 'Todas as categorias' : link.category}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant={link.isActive ? 'default' : 'secondary'}>
                  {link.isActive ? 'Ativo' : 'Inativo'}
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCopyLink(link.url)}
                >
                  {copiedLink === link.url ? (
                    <Check className="w-4 h-4 text-green-600" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleTrackConversion(link.id, { clicks: link.clicks, conversions: link.conversions })}
                >
                  <BarChart3 className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            <div className="mb-3">
              <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg font-mono text-sm break-all">
                {link.url}
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-lg font-bold text-gray-900 dark:text-white">
                  {link.clicks}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  Cliques
                </div>
              </div>
              <div>
                <div className="text-lg font-bold text-gray-900 dark:text-white">
                  {link.conversions}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  Conversões
                </div>
              </div>
              <div>
                <div className="text-lg font-bold text-green-600">
                  R$ {link.earnings?.toFixed(2).replace('.', ',')}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  Ganhos
                </div>
              </div>
              <div>
                <div className="text-lg font-bold text-blue-600">
                  {((link.conversions / link.clicks) * 100).toFixed(1)}%
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  Taxa
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
      
      <Card className="border-dashed">
        <CardContent className="p-6 text-center">
          <Plus className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <h3 className="font-semibold mb-2">Criar Novo Link</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Gere links personalizados para produtos ou categorias específicas
          </p>
          <Button onClick={() => handleGenerateLink('all', 'all')}>
            <Plus className="w-4 h-4 mr-2" />
            Criar Link
          </Button>
        </CardContent>
      </Card>
    </div>
  );

  const renderReferrals = () => (
    <div className="space-y-4">
      {affiliateData.referrals?.map((referral) => (
        <Card key={referral.id}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <div className="font-medium">{referral.name}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {referral.email}
                  </div>
                  <div className="text-xs text-gray-500">
                    Cadastrado em {new Date(referral.joinedAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-semibold text-green-600">
                  R$ {referral.commission?.toFixed(2).replace('.', ',')}
                </div>
                <Badge variant="secondary" className="text-xs">
                  {referral.tier}
                </Badge>
                <div className="text-xs text-gray-500">
                  {referral.totalOrders} pedidos
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const renderPayouts = () => (
    <div className="space-y-4">
      {affiliateData.payouts?.map((payout) => (
        <Card key={payout.id}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <div className="font-medium">
                    Pagamento #{payout.reference}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {payout.method} • {new Date(payout.date).toLocaleDateString()}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-semibold text-green-600">
                  R$ {payout.amount?.toFixed(2).replace('.', ',')}
                </div>
                <Badge 
                  variant="secondary" 
                  className={`text-xs ${getStatusColor(payout.status)}`}
                >
                  {getStatusText(payout.status)}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
      
      {affiliateData.pendingEarnings > 0 && (
        <Card className="border-green-200 bg-green-50 dark:bg-green-900/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-green-800 dark:text-green-200">
                  Próximo Pagamento
                </h3>
                <p className="text-sm text-green-700 dark:text-green-300">
                  {new Date(affiliateData.nextPayout).toLocaleDateString()}
                </p>
              </div>
              <div className="text-right">
                <div className="text-xl font-bold text-green-600">
                  R$ {affiliateData.pendingEarnings?.toFixed(2).replace('.', ',')}
                </div>
                <Button size="sm" onClick={handlePayoutRequest}>
                  Solicitar Pagamento
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );

  const renderMaterials = () => (
    <div className="space-y-4">
      {affiliateData.materials?.map((material) => (
        <Card key={material.id}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center">
                  <Download className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <div className="font-medium">{material.name}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {material.description}
                  </div>
                  <div className="text-xs text-gray-500">
                    {material.size} • {material.format}
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Baixar
                </Button>
                <Button variant="outline" size="sm">
                  <Eye className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const tabs = [
    { id: 'overview', label: 'Visão Geral', icon: BarChart3 },
    { id: 'links', label: 'Links', icon: Link },
    { id: 'referrals', label: 'Indicações', icon: Users },
    { id: 'payouts', label: 'Pagamentos', icon: CreditCard },
    { id: 'materials', label: 'Materiais', icon: Download }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Programa de Afiliados
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Ganhe comissões indicando nossos produtos - {currentUserProfile.name}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
            {affiliateData.tier?.toUpperCase()}
          </Badge>
          <Button variant="outline" size="sm">
            <Settings className="w-4 h-4 mr-2" />
            Configurações
          </Button>
          {showAdminFeatures && (
            <Button variant="outline" size="sm">
              <Settings className="w-4 h-4 mr-2" />
              Admin
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
        {tabs.map((tab) => {
          const IconComponent = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <IconComponent className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-gray-600 dark:text-gray-400">Carregando dados...</p>
          </div>
        </div>
      ) : (
        <>
          {activeTab === 'overview' && renderOverview()}
          {activeTab === 'links' && renderLinks()}
          {activeTab === 'referrals' && renderReferrals()}
          {activeTab === 'payouts' && renderPayouts()}
          {activeTab === 'materials' && renderMaterials()}
        </>
      )}
    </div>
  );
};