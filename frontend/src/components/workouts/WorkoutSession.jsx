import React, { useState, useEffect } from "react";
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
  Play,
  Pause,
  Square,
  Clock,
  Target,
  CheckCircle,
  RotateCcw,
  Timer,
  Flame,
  TrendingUp,
  Heart,
  Zap,
} from "lucide-react";

/**
 * WorkoutSession
 * Controla execução de um treino com sets, descanso e progresso.
 * @param {{
 *   workout: { name?: string, description?: string, exercises: Array<{id: string|number, name?: string, sets?: number, reps?: string, instructions?: string[], tips?: string[]}> }
 *   onComplete?: (data: { totalTime: number, caloriesBurned: number, exercisesCompleted: number, setsCompleted: number }) => void,
 *   onPause?: () => void,
 *   onResume?: () => void,
 * }} props
 */
export const WorkoutSession = ({ workout, onComplete, onPause, onResume }) => {
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [currentSet, setCurrentSet] = useState(1);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [restTime, setRestTime] = useState(0);
  const [isResting, setIsResting] = useState(false);
  const [completedSets, setCompletedSets] = useState({});
  const [sessionData, setSessionData] = useState({
    startTime: null,
    endTime: null,
    totalTime: 0,
    caloriesBurned: 0,
    exercisesCompleted: 0,
    setsCompleted: 0,
  });

  const safeExercises = Array.isArray(workout?.exercises) ? workout.exercises : [];
  const currentExercise = safeExercises[currentExerciseIndex] || null;
  const totalSets = Number(currentExercise?.sets) || 0;
  const totalExercises = safeExercises.length;
  const totalSetsInWorkout = safeExercises.reduce(
    (sum, ex) => sum + (Number(ex?.sets) || 0),
    0,
  );
  const completedSetsCount = Object.values(completedSets).reduce(
    (sum, sets) => sum + sets,
    0,
  );

  // Timer para o treino
  useEffect(() => {
    let interval;
    if (isRunning && !isPaused) {
      interval = setInterval(() => {
        setTimeElapsed((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning, isPaused]);

  // Timer para descanso
  useEffect(() => {
    let interval;
    if (isResting && restTime > 0) {
      interval = setInterval(() => {
        setRestTime((prev) => {
          if (prev <= 1) {
            setIsResting(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isResting, restTime]);

  const formatTime = (seconds) => {
    const total = Number(seconds) || 0;
    const mins = Math.floor(total / 60);
    const secs = total % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const startWorkout = () => {
    setIsRunning(true);
    setSessionData((prev) => ({
      ...prev,
      startTime: new Date(),
    }));
  };

  const pauseWorkout = () => {
    setIsPaused(true);
    onPause && onPause();
  };

  const resumeWorkout = () => {
    setIsPaused(false);
    onResume && onResume();
  };

  const completeSet = () => {
    const exerciseId = currentExercise.id;
    const newCompletedSets = {
      ...completedSets,
      [exerciseId]: (completedSets[exerciseId] || 0) + 1,
    };
    setCompletedSets(newCompletedSets);

    if (currentSet < totalSets) {
      setCurrentSet((prev) => prev + 1);
      startRest();
    } else {
      completeExercise();
    }
  };

  const completeExercise = () => {
    if (currentExerciseIndex < totalExercises - 1) {
      setCurrentExerciseIndex((prev) => prev + 1);
      setCurrentSet(1);
      startRest();
    } else {
      completeWorkout();
    }
  };

  const startRest = () => {
    setIsResting(true);
    setRestTime(60); // 60 segundos de descanso
  };

  const skipRest = () => {
    setIsResting(false);
    setRestTime(0);
  };

  const completeWorkout = () => {
    setIsRunning(false);
    const finalData = {
      ...sessionData,
      endTime: new Date(),
      totalTime: Number(timeElapsed) || 0,
      caloriesBurned: Math.round((Number(timeElapsed) || 0) * 0.1),
      exercisesCompleted: Number(totalExercises) || 0,
      setsCompleted: Number(completedSetsCount) || 0,
    };
    setSessionData(finalData);
    if (typeof onComplete === "function") {
      onComplete(finalData);
    }
  };

  const resetWorkout = () => {
    setCurrentExerciseIndex(0);
    setCurrentSet(1);
    setIsRunning(false);
    setIsPaused(false);
    setTimeElapsed(0);
    setRestTime(0);
    setIsResting(false);
    setCompletedSets({});
    setSessionData({
      startTime: null,
      endTime: null,
      totalTime: 0,
      caloriesBurned: 0,
      exercisesCompleted: 0,
      setsCompleted: 0,
    });
  };

  const getProgressPercentage = () => {
    if (!Number(totalSetsInWorkout)) return 0;
    return (Number(completedSetsCount) / Number(totalSetsInWorkout)) * 100;
  };

  if (!workout || !Array.isArray(workout?.exercises) || workout.exercises.length === 0) {
    return (
      <div className="text-center py-12">
        <Target className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Nenhum treino selecionado
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Selecione um plano de treino para começar
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header do Treino */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">{workout.name}</CardTitle>
              <CardDescription>{workout.description}</CardDescription>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-blue-600">
                {formatTime(timeElapsed)}
              </div>
              <div className="text-sm text-gray-500">Tempo Total</div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {completedSetsCount}
              </div>
              <div className="text-sm text-gray-500">Sets Completos</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {Number(currentExerciseIndex) + 1}
              </div>
              <div className="text-sm text-gray-500">Exercício Atual</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {Math.round(Number(sessionData.caloriesBurned) || 0)}
              </div>
              <div className="text-sm text-gray-500">Calorias</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {getProgressPercentage().toFixed(0)}%
              </div>
              <div className="text-sm text-gray-500">Progresso</div>
            </div>
          </div>
          <Progress value={getProgressPercentage()} className="h-2" />
        </CardContent>
      </Card>

      {/* Controles do Treino */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center space-x-4">
            {!isRunning ? (
              <Button
                onClick={startWorkout}
                size="lg"
                className="bg-green-600 hover:bg-green-700"
              >
                <Play className="w-5 h-5 mr-2" />
                Iniciar Treino
              </Button>
            ) : (
              <>
                {isPaused ? (
                  <Button
                    onClick={resumeWorkout}
                    size="lg"
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Play className="w-5 h-5 mr-2" />
                    Continuar
                  </Button>
                ) : (
                  <Button onClick={pauseWorkout} size="lg" variant="outline">
                    <Pause className="w-5 h-5 mr-2" />
                    Pausar
                  </Button>
                )}
                <Button
                  onClick={completeWorkout}
                  size="lg"
                  className="bg-red-600 hover:bg-red-700"
                >
                  <Square className="w-5 h-5 mr-2" />
                  Finalizar
                </Button>
              </>
            )}
            <Button onClick={resetWorkout} variant="outline" size="lg">
              <RotateCcw className="w-5 h-5 mr-2" />
              Reiniciar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Exercício Atual */}
      {isRunning && currentExercise && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl">
                  {currentExercise.name}
                </CardTitle>
                <CardDescription>
                  Exercício {Number(currentExerciseIndex) + 1} de {Number(totalExercises)}
                </CardDescription>
              </div>
              <Badge variant="outline">
                Set {Number(currentSet)} de {Number(totalSets)}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-2">Instruções:</h4>
                <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                  {(Array.isArray(currentExercise?.instructions) ? currentExercise.instructions : []).map((instruction, index) => (
                    <li key={index} className="flex items-start">
                      <span className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                      {instruction}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Dicas:</h4>
                <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                  {(Array.isArray(currentExercise?.tips) ? currentExercise.tips : []).map((tip, index) => (
                    <li key={index} className="flex items-start">
                      <span className="w-2 h-2 bg-green-600 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="mt-6 flex justify-center">
              <Button
                onClick={completeSet}
                size="lg"
                className="bg-blue-600 hover:bg-blue-700"
                disabled={isResting}
              >
                <CheckCircle className="w-5 h-5 mr-2" />
                Completar Set
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Timer de Descanso */}
      {isResting && (
        <Card className="border-orange-200 bg-orange-50 dark:bg-orange-900/20">
          <CardContent className="p-6 text-center">
            <div className="mb-4">
              <Timer className="w-12 h-12 text-orange-600 mx-auto mb-2" />
              <h3 className="text-xl font-semibold text-orange-800 dark:text-orange-200">
                Tempo de Descanso
              </h3>
            </div>
            <div className="text-4xl font-bold text-orange-600 mb-4">
              {formatTime(restTime)}
            </div>
            <p className="text-orange-700 dark:text-orange-300 mb-4">
              Prepare-se para o próximo set
            </p>
            <Button
              onClick={skipRest}
              variant="outline"
              className="border-orange-300 text-orange-700 hover:bg-orange-100"
            >
              Pular Descanso
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Lista de Exercícios */}
      <Card>
        <CardHeader>
          <CardTitle>Exercícios do Treino</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {safeExercises.map((exercise, index) => {
              const isCompleted = index < currentExerciseIndex;
              const isCurrent = index === currentExerciseIndex;
              const completedSetsForExercise = completedSets[exercise?.id] || 0;

              return (
                <div
                  key={exercise.id}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    isCurrent
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                      : isCompleted
                        ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                        : "border-gray-200 dark:border-gray-700"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          isCompleted
                            ? "bg-green-500 text-white"
                            : isCurrent
                              ? "bg-blue-500 text-white"
                              : "bg-gray-200 dark:bg-gray-700 text-gray-600"
                        }`}
                      >
                        {isCompleted ? (
                          <CheckCircle className="w-5 h-5" />
                        ) : (
                          <span className="text-sm font-semibold">
                            {index + 1}
                          </span>
                        )}
                      </div>
                      <div>
                        <h4 className="font-semibold">{exercise?.name || "Exercício"}</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {Number(exercise?.sets) || 0} sets × {exercise?.reps || ""}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      {isCurrent && (
                        <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                          Atual
                        </Badge>
                      )}
                      {isCompleted && (
                        <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                          Concluído
                        </Badge>
                      )}
                      {Number(completedSetsForExercise) > 0 && (
                        <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {Number(completedSetsForExercise)}/{Number(exercise?.sets) || 0} sets
                        </div>
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
};
