import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/Ui/card";
import { Button } from "@/components/Ui/button";
import { Badge } from "@/components/Ui/badge";
import {
  Clock,
  Target,
  Users,
  Star,
  Play,
  Calendar,
  Dumbbell,
  TrendingUp,
  Heart,
  Zap,
} from "lucide-react";
import {
  formatDifficulty,
  getDifficultyColor,
  formatGoal,
  formatWorkoutDuration,
  countPlanExercises,
} from "@/utils/workoutHelpers";

/**
 * Componente de card para exibir plano de treino
 * @param {Object} props
 * @param {Object} props.plan Plano de treino
 * @param {(plan:any)=>void} [props.onStartPlan]
 * @param {(plan:any)=>void} [props.onViewDetails]
 * @param {(plan:any)=>void} [props.onAddToFavorites]
 */
export const WorkoutPlanCard = ({
  plan,
  onStartPlan,
  onViewDetails,
  onAddToFavorites,
}) => {
  const getGoalIcon = (goal) => {
    switch (goal) {
      case "weight_loss":
        return <TrendingUp className="w-4 h-4" />;
      case "muscle_gain":
        return <Dumbbell className="w-4 h-4" />;
      case "endurance":
        return <Heart className="w-4 h-4" />;
      case "strength":
        return <Zap className="w-4 h-4" />;
      default:
        return <Target className="w-4 h-4" />;
    }
  };

  // Normaliza dados do plano
  const planDuration = Number(plan?.duration_weeks ?? plan?.duration) || 0;
  const workoutsPerWeek = Number(plan?.workouts_per_week) || 0;
  const exercisesCount = countPlanExercises(plan);
  const planGoal = plan?.goal ? [plan.goal] : (Array.isArray(plan?.goals) ? plan.goals : []);

  return (
    <Card className="group hover:shadow-lg transition-all duration-300 border-0 shadow-md">
      <div className="relative">
        {/* Imagem do plano */}
        <div className="aspect-video overflow-hidden rounded-t-lg bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900">
          {plan?.image_url ? (
            <img
              src={plan.image_url}
              alt={plan?.name || "Plano de treino"}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-center">
                <Dumbbell className="w-12 h-12 text-blue-600 dark:text-blue-400 mx-auto mb-2" />
                <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
                  {plan.name}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          <Badge className={`${getDifficultyColor(plan?.difficulty)} text-xs`}>
            {formatDifficulty(plan?.difficulty)}
          </Badge>
          <Badge variant="secondary" className="text-xs">
            {planDuration} semana{planDuration !== 1 ? "s" : ""}
          </Badge>
        </div>

        <div className="absolute top-2 right-2">
          <Badge
            variant="outline"
            className="bg-white/90 dark:bg-gray-900/90 text-xs"
          >
            {workoutsPerWeek}x/semana
          </Badge>
        </div>
      </div>

      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg font-semibold line-clamp-2 group-hover:text-blue-600 transition-colors">
              {plan?.name || "Plano"}
            </CardTitle>
            <CardDescription className="line-clamp-2 text-sm mt-1">
              {plan?.description || ""}
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onAddToFavorites && onAddToFavorites(plan)}
            className="ml-2 p-1 h-8 w-8"
          >
            <Star className="w-4 h-4 text-gray-400 hover:text-yellow-500" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Metas */}
        <div className="mb-4">
          <div className="flex items-center space-x-2 mb-2">
            <Target className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Objetivos:
            </span>
          </div>
          <div className="flex flex-wrap gap-1">
            {planGoal.map((goal, index) => (
              <Badge
                key={index}
                variant="outline"
                className="text-xs flex items-center gap-1"
              >
                {getGoalIcon(goal)}
                {formatGoal(goal)}
              </Badge>
            ))}
          </div>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-gray-500" />
            <div>
              <div className="text-sm font-medium text-gray-900 dark:text-white">
                {plan?.workout_duration
                  ? formatWorkoutDuration(plan.workout_duration)
                  : "N/A"}
              </div>
              <div className="text-xs text-gray-500">por treino</div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Users className="w-4 h-4 text-gray-500" />
            <div>
              <div className="text-sm font-medium text-gray-900 dark:text-white">
                {exercisesCount}
              </div>
              <div className="text-xs text-gray-500">exercícios</div>
            </div>
          </div>
        </div>

        {/* Rating e participantes */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-1">
            <Star className="w-4 h-4 text-yellow-400 fill-current" />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {Number(plan?.rating) || 4.5}
            </span>
            <span className="text-xs text-gray-500">
              ({Number(plan?.participants_count) || 0} participantes)
            </span>
          </div>

          <div className="flex items-center space-x-1 text-xs text-gray-500">
            <Calendar className="w-3 h-3" />
            <span>{plan?.created_at || ""}</span>
          </div>
        </div>

        {/* Botões de ação */}
        <div className="flex space-x-2">
          <Button
            onClick={() => onViewDetails && onViewDetails(plan)}
            variant="outline"
            className="flex-1"
          >
            Ver Detalhes
          </Button>

          <Button
            onClick={() => onStartPlan && onStartPlan(plan)}
            className="flex-1 bg-blue-600 hover:bg-blue-700"
          >
            <Play className="w-4 h-4 mr-2" />
            Iniciar
          </Button>
        </div>

        {/* Progresso (se aplicável) */}
        {plan?.progress && (
          <div className="mt-4 pt-4 border-t">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Progresso
              </span>
              <span className="text-sm text-gray-500">
                {Number(plan?.progress?.completed_workouts) || 0}/
                {Number(plan?.progress?.total_workouts) || 0} treinos
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${(
                    Number(plan?.progress?.total_workouts)
                      ? (Number(plan?.progress?.completed_workouts) || 0) /
                        Number(plan?.progress?.total_workouts)
                      : 0
                  ) * 100}%`,
                }}
              ></div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
