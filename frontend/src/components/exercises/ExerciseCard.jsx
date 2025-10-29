import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/Ui/card';
import { Button } from '@/components/Ui/button';
import { Badge } from '@/components/Ui/badge';
import { Play, Clock, Target, Dumbbell, Star, Eye } from 'lucide-react';

export const ExerciseCard = ({ exercise, onViewDetails, onAddToWorkout }) => {
  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDifficultyLabel = (difficulty) => {
    switch (difficulty) {
      case 'beginner': return 'Iniciante';
      case 'intermediate': return 'Intermediário';
      case 'advanced': return 'Avançado';
      default: return difficulty;
    }
  };

  return (
    <Card className="group hover:shadow-lg transition-all duration-300 border-0 shadow-md">
      <div className="relative">
        {/* Imagem do exercício */}
        <div className="aspect-video overflow-hidden rounded-t-lg bg-gray-100">
          {exercise.image_url ? (
            <img
              src={exercise.image_url}
              alt={exercise.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
              <Dumbbell className="w-12 h-12 text-gray-400" />
            </div>
          )}
        </div>

        {/* Badge de dificuldade */}
        <Badge className={`absolute top-2 right-2 ${getDifficultyColor(exercise.difficulty)}`}>
          {getDifficultyLabel(exercise.difficulty)}
        </Badge>

        {/* Badge de categoria */}
        <Badge variant="secondary" className="absolute top-2 left-2">
          {exercise.category}
        </Badge>
      </div>

      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold line-clamp-2 group-hover:text-blue-600 transition-colors">
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
              <Target className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Grupos Musculares:</span>
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
              <Dumbbell className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Equipamentos:</span>
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
            <Clock className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-600">
              MET: {exercise.met_value}
            </span>
          </div>
          
          {/* Rating (simulado) */}
          <div className="flex items-center space-x-1">
            <Star className="w-4 h-4 text-yellow-400 fill-current" />
            <span className="text-sm text-gray-600">4.2</span>
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
            className="flex-1 bg-blue-600 hover:bg-blue-700"
          >
            <Play className="w-4 h-4 mr-2" />
            Adicionar
          </Button>
        </div>

        {/* Link do vídeo */}
        {exercise.video_url && (
          <div className="mt-3 pt-3 border-t">
            <Button
              onClick={() => window.open(exercise.video_url, '_blank')}
              variant="ghost"
              size="sm"
              className="w-full text-blue-600 hover:text-blue-700"
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