import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/Ui/card';
import { Button } from '@/components/Ui/button';
import { Badge } from '@/components/Ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/Ui/tabs';
import { 
  Brain, 
  ShoppingCart, 
  Dumbbell, 
  Apple, 
  TrendingUp,
  Users,
  Lightbulb,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';

const RecommendationsPanel = () => {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('products');
  const [recommendations, setRecommendations] = useState({
    products: [],
    exercises: [],
    nutrition: [],
    healthTrends: null,
    similarUsers: [],
    insights: null
  });

  const fetchRecommendations = useCallback(async (type = 'all') => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      const requests = [];

      if (type === 'all' || type === 'products') {
        requests.push(
          fetch('/api/ai/recommendations/products?limit=6', { headers })
            .then(res => res.json())
            .then(data => ({ type: 'products', data }))
        );
      }

      if (type === 'all' || type === 'exercises') {
        requests.push(
          fetch('/api/ai/recommendations/exercises?limit=6', { headers })
            .then(res => res.json())
            .then(data => ({ type: 'exercises', data }))
        );
      }

      if (type === 'all' || type === 'nutrition') {
        requests.push(
          fetch('/api/ai/recommendations/nutrition?limit=6', { headers })
            .then(res => res.json())
            .then(data => ({ type: 'nutrition', data }))
        );
      }

      if (type === 'all' || type === 'trends') {
        requests.push(
          fetch('/api/ai/predictions/health-trends?days_ahead=30', { headers })
            .then(res => res.json())
            .then(data => ({ type: 'healthTrends', data }))
        );
      }

      if (type === 'all' || type === 'users') {
        requests.push(
          fetch('/api/ai/similar-users?limit=5', { headers })
            .then(res => res.json())
            .then(data => ({ type: 'similarUsers', data }))
        );
      }

      if (type === 'all' || type === 'insights') {
        requests.push(
          fetch('/api/ai/insights', { headers })
            .then(res => res.json())
            .then(data => ({ type: 'insights', data }))
        );
      }

      const results = await Promise.all(requests);

      const newRecommendations = { ...recommendations };
      results.forEach(({ type, data }) => {
        if (data.success) {
          newRecommendations[type] = data.data || data;
        }
      });

      setRecommendations(newRecommendations);
      toast.success('Recomendações atualizadas com sucesso!');

    } catch (error) {
      console.error('Erro ao buscar recomendações:', error);
      toast.error('Erro ao carregar recomendações');
    } finally {
      setLoading(false);
    }
  }, [recommendations]);

  useEffect(() => {
    fetchRecommendations();
  }, [fetchRecommendations]);

  const ProductCard = ({ product }) => (
    <Card className="h-full hover:shadow-lg transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h4 className="font-semibold text-sm line-clamp-2">{product.name}</h4>
          <Badge variant="secondary" className="text-xs">
            {product.category}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
          {product.description}
        </p>
        <div className="flex items-center justify-between">
          <span className="font-bold text-primary">
            R$ {product.price?.toFixed(2) || 'N/A'}
          </span>
          <div className="flex items-center text-xs text-muted-foreground">
            <TrendingUp className="w-3 h-3 mr-1" />
            {product.relevance_score?.toFixed(1) || 'N/A'}%
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const ExerciseCard = ({ exercise }) => (
    <Card className="h-full hover:shadow-lg transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h4 className="font-semibold text-sm line-clamp-2">{exercise.name}</h4>
          <Badge variant="outline" className="text-xs">
            {exercise.difficulty}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
          {exercise.description}
        </p>
        <div className="flex items-center justify-between">
          <div className="flex gap-1">
            {exercise.muscle_groups?.slice(0, 2).map((muscle, idx) => (
              <Badge key={idx} variant="secondary" className="text-xs">
                {muscle}
              </Badge>
            ))}
          </div>
          <div className="flex items-center text-xs text-muted-foreground">
            <TrendingUp className="w-3 h-3 mr-1" />
            {exercise.relevance_score?.toFixed(1) || 'N/A'}%
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const NutritionCard = ({ plan }) => (
    <Card className="h-full hover:shadow-lg transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h4 className="font-semibold text-sm line-clamp-2">{plan.name}</h4>
          <Badge variant="outline" className="text-xs">
            {plan.type}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
          {plan.description}
        </p>
        <div className="flex items-center justify-between">
          <div className="text-xs text-muted-foreground">
            {plan.calories} cal/dia
          </div>
          <div className="flex items-center text-xs text-muted-foreground">
            <TrendingUp className="w-3 h-3 mr-1" />
            {plan.relevance_score?.toFixed(1) || 'N/A'}%
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const HealthTrendsCard = ({ trends }) => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Tendências de Saúde
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {trends?.predictions?.map((prediction, idx) => (
            <div key={idx} className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div>
                <p className="font-medium text-sm">{prediction.metric}</p>
                <p className="text-xs text-muted-foreground">
                  {prediction.description}
                </p>
              </div>
              <div className="text-right">
                <p className="font-bold text-sm">
                  {prediction.predicted_value}
                </p>
                <p className="text-xs text-muted-foreground">
                  {prediction.confidence}% confiança
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );

  const SimilarUsersCard = ({ users }) => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          Usuários Similares
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {users?.map((user, idx) => (
            <div key={idx} className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div>
                <p className="font-medium text-sm">Usuário {user.user_id?.slice(-4)}</p>
                <p className="text-xs text-muted-foreground">
                  {user.similarity_reasons?.join(', ')}
                </p>
              </div>
              <Badge variant="outline">
                {user.similarity_score?.toFixed(1)}% similar
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );

  const InsightsCard = ({ insights }) => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="w-5 h-5" />
          Insights de IA
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {insights?.health_summary && (
            <div>
              <h4 className="font-semibold text-sm mb-2">Resumo de Saúde</h4>
              <p className="text-sm text-muted-foreground">
                {insights.health_summary}
              </p>
            </div>
          )}
          
          {insights?.improvement_opportunities && (
            <div>
              <h4 className="font-semibold text-sm mb-2">Oportunidades de Melhoria</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                {insights.improvement_opportunities.map((opportunity, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    {opportunity}
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {insights?.personalized_tips && (
            <div>
              <h4 className="font-semibold text-sm mb-2">Dicas Personalizadas</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                {insights.personalized_tips.map((tip, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className="w-6 h-6 text-primary" />
          <h2 className="text-2xl font-bold">Recomendações Inteligentes</h2>
        </div>
        <Button 
          onClick={() => fetchRecommendations('all')} 
          disabled={loading}
          variant="outline"
          size="sm"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="products" className="flex items-center gap-2">
            <ShoppingCart className="w-4 h-4" />
            Produtos
          </TabsTrigger>
          <TabsTrigger value="exercises" className="flex items-center gap-2">
            <Dumbbell className="w-4 h-4" />
            Exercícios
          </TabsTrigger>
          <TabsTrigger value="nutrition" className="flex items-center gap-2">
            <Apple className="w-4 h-4" />
            Nutrição
          </TabsTrigger>
          <TabsTrigger value="trends" className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Tendências
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Usuários
          </TabsTrigger>
          <TabsTrigger value="insights" className="flex items-center gap-2">
            <Lightbulb className="w-4 h-4" />
            Insights
          </TabsTrigger>
        </TabsList>

        <TabsContent value="products" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recommendations.products?.map((product, idx) => (
              <ProductCard key={idx} product={product} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="exercises" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recommendations.exercises?.map((exercise, idx) => (
              <ExerciseCard key={idx} exercise={exercise} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="nutrition" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recommendations.nutrition?.map((plan, idx) => (
              <NutritionCard key={idx} plan={plan} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <HealthTrendsCard trends={recommendations.healthTrends} />
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <SimilarUsersCard users={recommendations.similarUsers} />
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          <InsightsCard insights={recommendations.insights} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default RecommendationsPanel;