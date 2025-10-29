import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../Ui/card';
import { Button } from '../Ui/button';
import { Badge } from '../Ui/badge';
import { Progress } from '../Ui/progress';
import { useAuth } from '../../hooks/useAuth';
import apiClient from '../../services/apiClient';
import { 
  Trophy, 
  Award, 
  Star, 
  Target, 
  Zap, 
  Crown, 
  Medal, 
  Diamond,
  Flame,
  TrendingUp,
  CheckCircle,
  Lock,
  Gift,
  Coins,
  Calendar,
  Clock,
  RefreshCw,
  AlertCircle,
  Plus,
  Eye,
  EyeOff
} from 'lucide-react';

const GamificationSystemReal = ({ 
  onRewardClaim,
  showProgress = true,
  showAchievements = true,
  showRewards = true,
  showLeaderboard = true
}) => {
  const [gamificationData, setGamificationData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAllAchievements, setShowAllAchievements] = useState(false);

  // Carrega dados de gamificação
  useEffect(() => {
    fetchGamificationData();
  }, []);

  const fetchGamificationData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Busca progresso do usuário
      const progressResponse = await apiClient.getUserProgress();
      if (progressResponse.success) {
        setGamificationData(progressResponse.data);
      }

      // Busca conquistas
      const achievementsResponse = await apiClient.getAchievements();
      if (achievementsResponse.success) {
        setGamificationData(prev => ({
          ...prev,
          achievements: achievementsResponse.data
        }));
      }
    } catch (err) {
      setError('Erro ao carregar dados de gamificação');
      console.error('Erro:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClaimReward = async (rewardId) => {
    try {
      const response = await apiClient.claimReward(rewardId);
      if (response.success) {
        // Atualiza dados locais
        setGamificationData(prev => ({
          ...prev,
          rewards: prev.rewards.map(reward => 
            reward.id === rewardId ? { ...reward, claimed: true } : reward
          )
        }));

        if (onRewardClaim) {
          onRewardClaim(response.data);
        }
      }
    } catch (err) {
      console.error('Erro ao reivindicar recompensa:', err);
    }
  };

  const getLevelIcon = (level) => {
    if (level >= 100) return Crown;
    if (level >= 50) return Diamond;
    if (level >= 25) return Medal;
    if (level >= 10) return Trophy;
    return Star;
  };

  const getLevelColor = (level) => {
    if (level >= 100) return 'text-purple-600';
    if (level >= 50) return 'text-blue-600';
    if (level >= 25) return 'text-yellow-600';
    if (level >= 10) return 'text-orange-600';
    return 'text-gray-600';
  };

  const getLevelBgColor = (level) => {
    if (level >= 100) return 'bg-purple-50';
    if (level >= 50) return 'bg-blue-50';
    if (level >= 25) return 'bg-yellow-50';
    if (level >= 10) return 'bg-orange-50';
    return 'bg-gray-50';
  };

  const getAchievementIcon = (type) => {
    switch (type) {
      case 'streak': return Flame;
      case 'level': return TrendingUp;
      case 'exercise': return Zap;
      case 'goal': return Target;
      case 'social': return Star;
      default: return Award;
    }
  };

  const getAchievementColor = (type) => {
    switch (type) {
      case 'streak': return 'text-red-600';
      case 'level': return 'text-blue-600';
      case 'exercise': return 'text-yellow-600';
      case 'goal': return 'text-green-600';
      case 'social': return 'text-purple-600';
      default: return 'text-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="w-6 h-6 animate-spin" />
        <span className="ml-2">Carregando gamificação...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-8">
        <AlertCircle className="w-6 h-6 text-red-500" />
        <span className="ml-2 text-red-500">{error}</span>
      </div>
    );
  }

  if (!gamificationData) {
    return (
      <div className="text-center py-8">
        <Trophy className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500">Nenhum dado de gamificação disponível</p>
      </div>
    );
  }

  const { user: userData, level, xp, nextLevelXp, achievements, rewards, leaderboard } = gamificationData;
  const LevelIcon = getLevelIcon(level);
  const progressPercentage = (xp / nextLevelXp) * 100;

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header do Usuário */}
      <Card className={`${getLevelBgColor(level)} border-2`}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className={`p-3 rounded-full ${getLevelBgColor(level)}`}>
                <LevelIcon className={`w-8 h-8 ${getLevelColor(level)}`} />
              </div>
              <div>
                <h2 className="text-2xl font-bold">
                  {userData?.name || 'Usuário'}
                </h2>
                <p className="text-gray-600">
                  Nível {level} • {xp} XP
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center space-x-2">
                <Coins className="w-5 h-5 text-yellow-500" />
                <span className="text-lg font-semibold">{userData?.coins || 0}</span>
              </div>
              <p className="text-sm text-gray-600">Moedas</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Progresso do Nível */}
      {showProgress && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="w-5 h-5 mr-2" />
              Progresso do Nível
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Nível {level}</span>
                <span className="text-sm text-gray-600">
                  {xp} / {nextLevelXp} XP
                </span>
              </div>
              <Progress value={progressPercentage} className="h-3" />
              <div className="flex justify-between items-center text-sm text-gray-600">
                <span>Próximo nível em {nextLevelXp - xp} XP</span>
                <span>{Math.round(progressPercentage)}% completo</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Conquistas */}
        {showAchievements && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center">
                  <Award className="w-5 h-5 mr-2" />
                  Conquistas
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAllAchievements(!showAllAchievements)}
                >
                  {showAllAchievements ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  {showAllAchievements ? 'Ocultar' : 'Ver Todas'}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {achievements
                  ?.filter(achievement => showAllAchievements || achievement.unlocked)
                  ?.slice(0, showAllAchievements ? achievements.length : 5)
                  ?.map((achievement, index) => {
                    const AchievementIcon = getAchievementIcon(achievement.type);
                    return (
                      <div
                        key={index}
                        className={`flex items-center space-x-3 p-3 rounded-lg ${
                          achievement.unlocked ? 'bg-green-50 border border-green-200' : 'bg-gray-50'
                        }`}
                      >
                        <div className={`p-2 rounded-full ${
                          achievement.unlocked ? 'bg-green-100' : 'bg-gray-100'
                        }`}>
                          {achievement.unlocked ? (
                            <AchievementIcon className={`w-5 h-5 ${getAchievementColor(achievement.type)}`} />
                          ) : (
                            <Lock className="w-5 h-5 text-gray-400" />
                          )}
                        </div>
                        <div className="flex-1">
                          <h4 className={`font-medium ${
                            achievement.unlocked ? 'text-green-900' : 'text-gray-500'
                          }`}>
                            {achievement.name}
                          </h4>
                          <p className={`text-sm ${
                            achievement.unlocked ? 'text-green-700' : 'text-gray-400'
                          }`}>
                            {achievement.description}
                          </p>
                          {achievement.progress && (
                            <div className="mt-2">
                              <Progress 
                                value={(achievement.progress.current / achievement.progress.target) * 100} 
                                className="h-2" 
                              />
                              <p className="text-xs text-gray-500 mt-1">
                                {achievement.progress.current} / {achievement.progress.target}
                              </p>
                            </div>
                          )}
                        </div>
                        {achievement.unlocked && (
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        )}
                      </div>
                    );
                  }) || (
                    <div className="text-center py-4">
                      <Award className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-500">Nenhuma conquista disponível</p>
                    </div>
                  )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recompensas */}
        {showRewards && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Gift className="w-5 h-5 mr-2" />
                Recompensas Disponíveis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {rewards?.map((reward, index) => (
                  <div
                    key={index}
                    className={`flex items-center justify-between p-3 rounded-lg ${
                      reward.claimed ? 'bg-gray-50' : 'bg-yellow-50 border border-yellow-200'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-full ${
                        reward.claimed ? 'bg-gray-100' : 'bg-yellow-100'
                      }`}>
                        <Gift className={`w-5 h-5 ${
                          reward.claimed ? 'text-gray-400' : 'text-yellow-600'
                        }`} />
                      </div>
                      <div>
                        <h4 className={`font-medium ${
                          reward.claimed ? 'text-gray-500' : 'text-yellow-900'
                        }`}>
                          {reward.name}
                        </h4>
                        <p className={`text-sm ${
                          reward.claimed ? 'text-gray-400' : 'text-yellow-700'
                        }`}>
                          {reward.description}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={reward.claimed ? 'secondary' : 'default'}>
                        {reward.claimed ? 'Reivindicada' : `${reward.cost} moedas`}
                      </Badge>
                      {!reward.claimed && (
                        <Button
                          size="sm"
                          onClick={() => handleClaimReward(reward.id)}
                          disabled={userData?.coins < reward.cost}
                        >
                          Reivindicar
                        </Button>
                      )}
                    </div>
                  </div>
                )) || (
                  <div className="text-center py-4">
                    <Gift className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500">Nenhuma recompensa disponível</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Ranking */}
      {showLeaderboard && leaderboard && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Trophy className="w-5 h-5 mr-2" />
              Ranking
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {leaderboard.slice(0, 10).map((player, index) => (
                <div
                  key={index}
                  className={`flex items-center justify-between p-3 rounded-lg ${
                    player.id === userData?.id ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-200">
                      <span className="text-sm font-bold">
                        {index + 1}
                      </span>
                    </div>
                    <div>
                      <h4 className="font-medium">
                        {player.name}
                        {player.id === userData?.id && (
                          <Badge variant="secondary" className="ml-2">Você</Badge>
                        )}
                      </h4>
                      <p className="text-sm text-gray-600">
                        Nível {player.level} • {player.xp} XP
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center space-x-1">
                      <Coins className="w-4 h-4 text-yellow-500" />
                      <span className="font-semibold">{player.coins}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default GamificationSystemReal;