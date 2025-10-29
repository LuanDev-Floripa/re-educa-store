import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageCircle, 
  X, 
  Send, 
  ShoppingCart, 
  CreditCard, 
  Zap,
  Bot,
  User,
  Star,
  Heart,
  Loader2,
  CheckCircle,
  AlertCircle,
  Gift,
  Target,
  TrendingUp,
  Brain,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/Ui/button';
import { Input } from '@/components/Ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/Ui/card';
import { Badge } from '@/components/Ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/Ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/Ui/tabs';
import { Progress } from '@/components/Ui/progress';

// ================================
// COMPONENTE PRINCIPAL DO CHAT IA
// ================================

const AIAssistantPopup = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentAgent, setCurrentAgent] = useState('platform_concierge');
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [user, setUser] = useState(null);
  const [cart, setCart] = useState([]);
  const [activeTab, setActiveTab] = useState('chat');
  const messagesEndRef = useRef(null);

  // Agentes disponíveis
  const agents = {
    platform_concierge: {
      name: 'RE-EDUCA Assistant',
      icon: '🤖',
      color: 'bg-blue-500',
      specialty: 'Atendimento Geral',
      description: 'Seu guia pessoal na plataforma'
    },
    dr_nutri: {
      name: 'Dr. Nutri',
      icon: '🥗',
      color: 'bg-green-500',
      specialty: 'Nutrição',
      description: 'Especialista em alimentação saudável'
    },
    coach_fit: {
      name: 'Coach Fit',
      icon: '💪',
      color: 'bg-orange-500',
      specialty: 'Fitness',
      description: 'Seu personal trainer virtual'
    },
    sage_research: {
      name: 'Sage Research',
      icon: '🔬',
      color: 'bg-purple-500',
      specialty: 'Pesquisa',
      description: 'Evidências científicas atualizadas'
    },
    moti_game: {
      name: 'Moti Game',
      icon: '🎮',
      color: 'bg-pink-500',
      specialty: 'Motivação',
      description: 'Gamificação e desafios'
    },
    mind_wellness: {
      name: 'Mind Wellness',
      icon: '🧘',
      color: 'bg-indigo-500',
      specialty: 'Bem-estar',
      description: 'Saúde mental e mindfulness'
    },
    sales_assistant: {
      name: 'Sales Assistant',
      icon: '🛒',
      color: 'bg-emerald-500',
      specialty: 'Vendas',
      description: 'Consultor de produtos'
    }
  };

  // Scroll automático para última mensagem
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Inicialização
  useEffect(() => {
    // Simular dados do usuário
    setUser({
      id: 'user_123',
      name: 'João Silva',
      level: 3,
      hp: 1250,
      avatar: '/api/placeholder/40/40'
    });

    // Mensagem de boas-vindas
    setMessages([{
      id: 1,
      type: 'ai',
      agent: 'platform_concierge',
      content: '👋 Olá! Sou seu assistente pessoal da RE-EDUCA Store. Como posso ajudar você hoje?',
      timestamp: new Date(),
      suggestions: [
        'Quero melhorar minha alimentação',
        'Preciso de um plano de exercícios',
        'Buscar produtos para saúde',
        'Ver meu progresso'
      ]
    }]);
  }, []);

  // Enviar mensagem
  const sendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    try {
      // Simular resposta da IA
      setTimeout(() => {
        const aiResponse = generateAIResponse(inputMessage, currentAgent);
        setMessages(prev => [...prev, aiResponse]);
        setIsTyping(false);
      }, 1500);

    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      setIsTyping(false);
    }
  };

  // Gerar resposta da IA (simulada)
  const generateAIResponse = (message, agentType) => {
    // const agent = agents[agentType]; // Unused variable
    const responses = {
      platform_concierge: {
        content: `Entendi que você quer "${message}". Vou te conectar com o especialista ideal! 🎯`,
        products: [],
        suggestions: ['Falar com Dr. Nutri', 'Falar com Coach Fit', 'Ver produtos']
      },
      dr_nutri: {
        content: `Como nutricionista, posso te ajudar com "${message}". Vou criar um plano personalizado baseado no seu perfil! 🥗`,
        products: [
          {
            id: 'whey_premium',
            name: 'Whey Protein Premium',
            price: 89.90,
            image: '/api/placeholder/80/80',
            rating: 4.8
          }
        ],
        suggestions: ['Criar plano alimentar', 'Calcular calorias', 'Ver receitas']
      },
      coach_fit: {
        content: `Perfeito! Como seu personal trainer virtual, vou criar um treino específico para "${message}". Vamos começar! 💪`,
        products: [
          {
            id: 'kit_exercicios',
            name: 'Kit Exercícios Casa',
            price: 199.90,
            image: '/api/placeholder/80/80',
            rating: 4.9
          }
        ],
        suggestions: ['Criar treino', 'Ver progresso', 'Cronômetro']
      }
    };

    const response = responses[agentType] || responses.platform_concierge;

    return {
      id: Date.now() + 1,
      type: 'ai',
      agent: agentType,
      content: response.content,
      timestamp: new Date(),
      products: response.products,
      suggestions: response.suggestions,
      gamification: agentType === 'moti_game' ? {
        hp_gained: 50,
        badge_unlocked: 'Conversador',
        challenge: 'Complete 3 interações com IA hoje'
      } : null
    };
  };

  // Adicionar produto ao carrinho
  const addToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.id === product.id 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });

    // Feedback visual
    setMessages(prev => [...prev, {
      id: Date.now(),
      type: 'system',
      content: `✅ ${product.name} adicionado ao carrinho!`,
      timestamp: new Date()
    }]);
  };

  // Processar pagamento
  const processPayment = async (product) => {
    try {
      // Simular criação de pagamento
      // const paymentData = { // Unused variable
      //   amount: product.price,
      //   currency: 'BRL',
      //   description: product.name,
      //   user_data: {
      //     user_id: user.id,
      //     email: 'joao@email.com',
      //     first_name: 'João',
      //     last_name: 'Silva'
      //   },
      //   metadata: {
      //     product_id: product.id,
      //     source: 'ai_chat'
      //   }
      // };

      // Aqui você faria a chamada real para a API
      // const response = await fetch('/api/payments/create', { ... });

      // Simular resposta
      setTimeout(() => {
        setMessages(prev => [...prev, {
          id: Date.now(),
          type: 'payment',
          content: `💳 Pagamento de R$ ${product.price.toFixed(2)} processado com sucesso!`,
          timestamp: new Date(),
          paymentData: {
            method: 'PIX',
            qrCode: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
          }
        }]);
      }, 1000);

    } catch (error) {
      console.error('Erro no pagamento:', error);
    }
  };

  return (
    <>
      {/* Botão Flutuante */}
      {!isOpen && (
        <div className="fixed bottom-6 right-6 z-50">
          <Button
            onClick={() => setIsOpen(true)}
            className="w-16 h-16 rounded-full bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 shadow-lg hover:shadow-xl transition-all duration-300 animate-pulse"
          >
            <MessageCircle className="w-8 h-8 text-white" />
          </Button>
          
          {/* Indicador de notificação */}
          <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
            <span className="text-white text-xs font-bold">3</span>
          </div>
        </div>
      )}

      {/* Popup do Chat */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-96 h-[600px] bg-white rounded-2xl shadow-2xl border border-gray-200 z-50 flex flex-col overflow-hidden">
          
          {/* Header */}
          <div className={`${agents[currentAgent].color} p-4 text-white relative`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Avatar className="w-10 h-10 border-2 border-white">
                  <AvatarFallback className="text-lg">
                    {agents[currentAgent].icon}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-bold text-lg">{agents[currentAgent].name}</h3>
                  <p className="text-sm opacity-90">{agents[currentAgent].specialty}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="text-white hover:bg-white/20"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Status do usuário */}
            {user && (
              <div className="mt-3 flex items-center justify-between text-sm">
                <span>Nível {user.level} • {user.hp} HP</span>
                <div className="flex items-center space-x-1">
                  <Sparkles className="w-4 h-4" />
                  <span>Online</span>
                </div>
              </div>
            )}
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
            <TabsList className="grid w-full grid-cols-3 m-2">
              <TabsTrigger value="chat">Chat</TabsTrigger>
              <TabsTrigger value="agents">Agentes</TabsTrigger>
              <TabsTrigger value="cart">
                Carrinho
                {cart.length > 0 && (
                  <Badge variant="destructive" className="ml-1 text-xs">
                    {cart.reduce((sum, item) => sum + item.quantity, 0)}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            {/* Conteúdo do Chat */}
            <TabsContent value="chat" className="flex-1 flex flex-col m-0">
              
              {/* Área de Mensagens */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message) => (
                  <MessageComponent
                    key={message.id}
                    message={message}
                    agents={agents}
                    onAddToCart={addToCart}
                    onProcessPayment={processPayment}
                    onSuggestionClick={setInputMessage}
                  />
                ))}
                
                {/* Indicador de digitação */}
                {isTyping && (
                  <div className="flex items-center space-x-2 text-gray-500">
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="text-sm">
                        {agents[currentAgent].icon}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>

              {/* Input de Mensagem */}
              <div className="p-4 border-t border-gray-200">
                <div className="flex space-x-2">
                  <Input
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder="Digite sua mensagem..."
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    className="flex-1"
                  />
                  <Button onClick={sendMessage} disabled={!inputMessage.trim() || isTyping}>
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </TabsContent>

            {/* Seletor de Agentes */}
            <TabsContent value="agents" className="flex-1 overflow-y-auto p-4">
              <div className="space-y-3">
                {Object.entries(agents).map(([key, agent]) => (
                  <Card
                    key={key}
                    className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                      currentAgent === key ? 'ring-2 ring-blue-500' : ''
                    }`}
                    onClick={() => {
                      setCurrentAgent(key);
                      setActiveTab('chat');
                    }}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-3">
                        <div className={`w-12 h-12 ${agent.color} rounded-full flex items-center justify-center text-white text-xl`}>
                          {agent.icon}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold">{agent.name}</h4>
                          <p className="text-sm text-gray-600">{agent.description}</p>
                          <Badge variant="secondary" className="mt-1">
                            {agent.specialty}
                          </Badge>
                        </div>
                        {currentAgent === key && (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Carrinho */}
            <TabsContent value="cart" className="flex-1 overflow-y-auto p-4">
              <CartComponent cart={cart} setCart={setCart} onProcessPayment={processPayment} />
            </TabsContent>
          </Tabs>
        </div>
      )}
    </>
  );
};

// ================================
// COMPONENTE DE MENSAGEM
// ================================

const MessageComponent = ({ message, agents, onAddToCart, onProcessPayment, onSuggestionClick }) => {
  const isUser = message.type === 'user';
  const isSystem = message.type === 'system';
  const isPayment = message.type === 'payment';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[80%] ${isUser ? 'order-2' : 'order-1'}`}>
        
        {/* Avatar */}
        {!isUser && !isSystem && (
          <div className="flex items-center space-x-2 mb-1">
            <Avatar className="w-6 h-6">
              <AvatarFallback className="text-xs">
                {message.agent ? agents[message.agent]?.icon : '🤖'}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs text-gray-500">
              {message.agent ? agents[message.agent]?.name : 'Sistema'}
            </span>
          </div>
        )}

        {/* Conteúdo da mensagem */}
        <div className={`rounded-2xl p-3 ${
          isUser 
            ? 'bg-blue-500 text-white' 
            : isSystem 
              ? 'bg-green-100 text-green-800 border border-green-200'
              : isPayment
                ? 'bg-purple-100 text-purple-800 border border-purple-200'
                : 'bg-gray-100 text-gray-800'
        }`}>
          <p className="text-sm">{message.content}</p>
          
          {/* Timestamp */}
          <p className={`text-xs mt-1 ${
            isUser ? 'text-blue-100' : 'text-gray-500'
          }`}>
            {message.timestamp.toLocaleTimeString('pt-BR', { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </p>
        </div>

        {/* Produtos sugeridos */}
        {message.products && message.products.length > 0 && (
          <div className="mt-3 space-y-2">
            {message.products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={onAddToCart}
                onProcessPayment={onProcessPayment}
              />
            ))}
          </div>
        )}

        {/* Gamificação */}
        {message.gamification && (
          <Card className="mt-3 bg-gradient-to-r from-purple-100 to-pink-100 border-purple-200">
            <CardContent className="p-3">
              <div className="flex items-center space-x-2 mb-2">
                <Gift className="w-4 h-4 text-purple-600" />
                <span className="text-sm font-semibold text-purple-800">Recompensa!</span>
              </div>
              <div className="space-y-1 text-xs text-purple-700">
                <p>+{message.gamification.hp_gained} HP ganhos!</p>
                <p>🏆 Badge desbloqueada: {message.gamification.badge_unlocked}</p>
                <p>🎯 Desafio: {message.gamification.challenge}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Sugestões rápidas */}
        {message.suggestions && message.suggestions.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {message.suggestions.map((suggestion, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                onClick={() => onSuggestionClick(suggestion)}
                className="text-xs"
              >
                {suggestion}
              </Button>
            ))}
          </div>
        )}

        {/* QR Code PIX */}
        {message.paymentData?.qrCode && (
          <Card className="mt-3">
            <CardContent className="p-3 text-center">
              <p className="text-sm font-semibold mb-2">Pague com PIX</p>
              <img 
                src={message.paymentData.qrCode} 
                alt="QR Code PIX" 
                className="w-32 h-32 mx-auto bg-gray-100 rounded"
              />
              <p className="text-xs text-gray-600 mt-2">
                Escaneie o código ou copie a chave PIX
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

// ================================
// COMPONENTE DE PRODUTO
// ================================

const ProductCard = ({ product, onAddToCart, onProcessPayment }) => {
  return (
    <Card className="border border-gray-200 hover:shadow-md transition-shadow">
      <CardContent className="p-3">
        <div className="flex items-center space-x-3">
          <img 
            src={product.image} 
            alt={product.name}
            className="w-16 h-16 object-cover rounded-lg bg-gray-100"
          />
          <div className="flex-1">
            <h4 className="font-semibold text-sm">{product.name}</h4>
            <div className="flex items-center space-x-1 mt-1">
              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
              <span className="text-xs text-gray-600">{product.rating}</span>
            </div>
            <p className="font-bold text-green-600 mt-1">
              R$ {product.price.toFixed(2)}
            </p>
          </div>
        </div>
        
        <div className="flex space-x-2 mt-3">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onAddToCart(product)}
            className="flex-1"
          >
            <ShoppingCart className="w-3 h-3 mr-1" />
            Carrinho
          </Button>
          <Button
            size="sm"
            onClick={() => onProcessPayment(product)}
            className="flex-1 bg-green-600 hover:bg-green-700"
          >
            <Zap className="w-3 h-3 mr-1" />
            PIX
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

// ================================
// COMPONENTE DO CARRINHO
// ================================

const CartComponent = ({ cart, setCart, onProcessPayment }) => {
  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity === 0) {
      setCart(prev => prev.filter(item => item.id !== productId));
    } else {
      setCart(prev => prev.map(item => 
        item.id === productId 
          ? { ...item, quantity: newQuantity }
          : item
      ));
    }
  };

  const processCartPayment = () => {
    const cartProduct = {
      id: 'cart_total',
      name: `Carrinho (${cart.length} itens)`,
      price: total
    };
    onProcessPayment(cartProduct);
  };

  if (cart.length === 0) {
    return (
      <div className="text-center py-8">
        <ShoppingCart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">Seu carrinho está vazio</p>
        <p className="text-sm text-gray-500 mt-1">
          Adicione produtos durante a conversa com nossos agentes
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Itens do carrinho */}
      {cart.map((item) => (
        <Card key={item.id} className="border border-gray-200">
          <CardContent className="p-3">
            <div className="flex items-center space-x-3">
              <img 
                src={item.image} 
                alt={item.name}
                className="w-12 h-12 object-cover rounded bg-gray-100"
              />
              <div className="flex-1">
                <h4 className="font-semibold text-sm">{item.name}</h4>
                <p className="text-green-600 font-bold">
                  R$ {item.price.toFixed(2)}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => updateQuantity(item.id, item.quantity - 1)}
                >
                  -
                </Button>
                <span className="w-8 text-center">{item.quantity}</span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                >
                  +
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Total e checkout */}
      <Card className="border-2 border-green-200 bg-green-50">
        <CardContent className="p-4">
          <div className="flex justify-between items-center mb-3">
            <span className="font-semibold">Total:</span>
            <span className="text-xl font-bold text-green-600">
              R$ {total.toFixed(2)}
            </span>
          </div>
          <Button 
            onClick={processCartPayment}
            className="w-full bg-green-600 hover:bg-green-700"
          >
            <CreditCard className="w-4 h-4 mr-2" />
            Finalizar Compra
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default AIAssistantPopup;

