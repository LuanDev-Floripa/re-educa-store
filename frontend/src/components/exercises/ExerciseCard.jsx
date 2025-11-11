/**
 * ExerciseCard Component - RE-EDUCA Store
 * 
 * Card de exibição de exercício individual.
 * 
 * Funcionalidades:
 * - Exibe informações do exercício
 * - Badge de dificuldade
 * - Botões de ação (visualizar, adicionar ao treino)
 * - Hover effects
 * 
 * @component
 * @param {Object} props - Props do componente
 * @param {Object} props.exercise - Dados do exercício
 * @param {Function} [props.onViewDetails] - Callback para ver detalhes
 * @param {Function} [props.onAddToWorkout] - Callback para adicionar ao treino
 * @returns {JSX.Element} Card de exercício
 */
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
import { Play, Clock, Target, Dumbbell, Star, Eye } from "lucide-react";

export const ExerciseCard = ({ exercise, onViewDetails, onAddToWorkout }) => {
  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case "beginner":
        return "bg-primary/10 text-primary";
      case "intermediate":
        return "bg-primary/10 text-primary";
      case "advanced":
        return "bg-destructive/10 text-destructive";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getDifficultyLabel = (difficulty) => {
    switch (difficulty) {
      case "beginner":
        return "Iniciante";
      case "intermediate":
        return "Intermediário";
      case "advanced":
        return "Avançado";
      default:
        return difficulty;
    }
  };

  return (
    <Card className="group hover:shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1),0_2px_4px_-1px_rgba(0,0,0,0.06)] transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] border-0 shadow-[0_1px_2px_0_rgba(0,0,0,0.05),0_1px_3px_0_rgba(0,0,0,0.1)]">
      <div className="relative">
        {/* Imagem do exercício */}
        <div className="aspect-video overflow-hidden rounded-t-2xl bg-muted">
          {exercise.image_url ? (
            <img
              src={exercise.image_url}
              alt={exercise.name}
              className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/50">
              <Dumbbell className="w-12 h-12 text-muted-foreground" />
            </div>
          )}
        </div>

        {/* Badge de dificuldade */}
        <Badge
          className={`absolute top-2 right-2 ${getDifficultyColor(exercise.difficulty)}`}
        >
          {getDifficultyLabel(exercise.difficulty)}
        </Badge>

        {/* Badge de categoria */}
        <Badge variant="secondary" className="absolute top-2 left-2">
          {exercise.category}
        </Badge>
      </div>

      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold line-clamp-2 group-hover:text-primary transition-colors">
          {exercise.name}
        </CardTitle>
        <CardDescription className="line-clamp-3 text-sm">
          {exercise.description}
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Grupos musculares */}
        {exercise.muscle_groups && exercise.muscle_groups.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center space-x-2 mb-2">
              <Target className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">
                Grupos Musculares:
              </span>
            </div>
            <div className="flex flex-wrap gap-1">
              {exercise.muscle_groups.slice(0, 3).map((muscle, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {muscle}
                </Badge>
              ))}
              {exercise.muscle_groups.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{exercise.muscle_groups.length - 3}
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Equipamentos */}
        {exercise.equipment && exercise.equipment.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center space-x-2 mb-2">
              <Dumbbell className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">
                Equipamentos:
              </span>
            </div>
            <div className="flex flex-wrap gap-1">
              {exercise.equipment.slice(0, 2).map((equipment, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {equipment}
                </Badge>
              ))}
              {exercise.equipment.length > 2 && (
                <Badge variant="secondary" className="text-xs">
                  +{exercise.equipment.length - 2}
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* MET Value */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              MET: {exercise.met_value}
            </span>
          </div>

          {/* Rating (simulado) */}
          <div className="flex items-center space-x-1">
            <Star className="w-4 h-4 text-primary fill-current" />
            <span className="text-sm text-muted-foreground">4.2</span>
          </div>
        </div>

        {/* Botões de ação */}
        <div className="flex space-x-2">
          <Button
            onClick={() => onViewDetails && onViewDetails(exercise)}
            variant="outline"
            className="flex-1"
          >
            <Eye className="w-4 h-4 mr-2" />
            Ver Detalhes
          </Button>

          <Button
            onClick={() => onAddToWorkout && onAddToWorkout(exercise)}
            className="flex-1"
          >
            <Play className="w-4 h-4 mr-2" />
            Adicionar
          </Button>
        </div>

        {/* Link do vídeo */}
        {exercise.video_url && (
          <div className="mt-3 pt-3 border-t">
            <Button
              onClick={() => window.open(exercise.video_url, "_blank")}
              variant="ghost"
              size="sm"
              className="w-full text-primary hover:text-primary"
            >
              <Play className="w-4 h-4 mr-2" />
              Ver Vídeo
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
