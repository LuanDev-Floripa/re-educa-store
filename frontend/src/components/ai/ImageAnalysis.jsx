/**
 * ImageAnalysis Component - RE-EDUCA Store
 * 
 * Componente de análise de imagens usando IA.
 * 
 * Funcionalidades:
 * - Upload de imagens
 * - Análise de diferentes tipos (geral, alimento, exercício)
 * - Captura de foto via câmera
 * - Resultados detalhados da análise
 * 
 * @component
 * @returns {JSX.Element} Interface de análise de imagens
 */
import React, { useState, useRef } from "react";
import logger from "@/utils/logger";
import apiClient from "@/services/apiClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/Ui/card";
import { Button } from "@/components/Ui/button";
import { Badge } from "@/components/Ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/Ui/tabs";
import {
  Upload,
  Camera,
  Image as ImageIcon,
  Loader2,
  CheckCircle,
  AlertCircle,
  Apple,
  Dumbbell,
  Eye,
} from "lucide-react";
import { toast } from "sonner";

const ImageAnalysis = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [analysisType, setAnalysisType] = useState("general");
  const [loading, setLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  const analysisTypes = [
    { value: "general", label: "Geral", icon: Eye },
    { value: "food", label: "Alimento", icon: Apple },
    { value: "exercise", label: "Exercício", icon: Dumbbell },
  ];

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        // 5MB limit
        toast.error("Arquivo muito grande. Máximo 5MB.");
        return;
      }

      if (!file.type.startsWith("image/")) {
        toast.error("Por favor, selecione uma imagem válida.");
        return;
      }

      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target.result);
      reader.readAsDataURL(file);
      setAnalysisResult(null);
    }
  };

  const handleCameraCapture = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target.result);
      reader.readAsDataURL(file);
      setAnalysisResult(null);
    }
  };

  const analyzeImage = async () => {
    if (!selectedFile) {
      toast.error("Por favor, selecione uma imagem primeiro.");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("image", selectedFile);
      formData.append("type", analysisType);

      const data = await apiClient.request("/ai/analyze/image", {
        method: "POST",
        body: formData,
      });

      if (data.success) {
        setAnalysisResult(data.data || data);
        toast.success("Análise concluída com sucesso!");
      } else {
        throw new Error(data.error || "Erro na análise");
      }
    } catch (error) {
      logger.error("Erro na análise:", error);
      toast.error("Erro ao analisar imagem");
    } finally {
      setLoading(false);
    }
  };

  const clearImage = () => {
    setSelectedFile(null);
    setPreview(null);
    setAnalysisResult(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (cameraInputRef.current) cameraInputRef.current.value = "";
  };

  const FoodAnalysisResult = ({ result }) => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Identificação</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="font-semibold">{result.food_name}</p>
              <p className="text-sm text-muted-foreground">
                {result.description}
              </p>
              <div className="flex gap-2">
                <Badge variant="outline">Confiança: {result.confidence}%</Badge>
                {result.category && (
                  <Badge variant="secondary">{result.category}</Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Informações Nutricionais</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {result.nutritional_info &&
                Object.entries(result.nutritional_info).map(([key, value]) => (
                  <div key={key} className="flex justify-between text-sm">
                    <span className="capitalize">{key.replace("_", " ")}:</span>
                    <span className="font-medium">{value}</span>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {result.recommendations && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recomendações</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {result.recommendations.map((rec, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  {rec}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );

  const ExerciseAnalysisResult = ({ result }) => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Identificação</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="font-semibold">{result.exercise_name}</p>
              <p className="text-sm text-muted-foreground">
                {result.description}
              </p>
              <div className="flex gap-2">
                <Badge variant="outline">Confiança: {result.confidence}%</Badge>
                {result.difficulty && (
                  <Badge variant="secondary">{result.difficulty}</Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Detalhes do Exercício</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {result.muscle_groups && (
                <div>
                  <p className="text-sm font-medium">Grupos Musculares:</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {result.muscle_groups.map((muscle, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {muscle}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {result.equipment && (
                <div>
                  <p className="text-sm font-medium">Equipamento:</p>
                  <p className="text-sm text-muted-foreground">
                    {result.equipment}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {result.form_tips && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Dicas de Forma</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {result.form_tips.map((tip, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  {tip}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );

  const GeneralAnalysisResult = ({ result }) => (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Análise Geral</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <p className="font-semibold mb-2">Descrição:</p>
              <p className="text-sm text-muted-foreground">
                {result.description}
              </p>
            </div>

            {result.objects && (
              <div>
                <p className="font-semibold mb-2">Objetos Identificados:</p>
                <div className="flex flex-wrap gap-2">
                  {result.objects.map((obj, idx) => (
                    <Badge key={idx} variant="outline">
                      {obj.name} ({obj.confidence}%)
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {result.tags && (
              <div>
                <p className="font-semibold mb-2">Tags:</p>
                <div className="flex flex-wrap gap-2">
                  {result.tags.map((tag, idx) => (
                    <Badge key={idx} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <ImageIcon className="w-6 h-6 text-primary" />
        <h2 className="text-2xl font-bold">Análise de Imagem com IA</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upload Section */}
        <Card>
          <CardHeader>
            <CardTitle>Selecionar Imagem</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Tabs value={analysisType} onValueChange={setAnalysisType}>
              <TabsList className="grid w-full grid-cols-3">
                {analysisTypes.map((type) => {
                  const Icon = type.icon;
                  return (
                    <TabsTrigger
                      key={type.value}
                      value={type.value}
                      className="flex items-center gap-2"
                    >
                      <Icon className="w-4 h-4" />
                      {type.label}
                    </TabsTrigger>
                  );
                })}
              </TabsList>
            </Tabs>

            <div className="space-y-3">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload
                </Button>
                <Button
                  variant="outline"
                  onClick={() => cameraInputRef.current?.click()}
                  className="flex-1"
                >
                  <Camera className="w-4 h-4 mr-2" />
                  Câmera
                </Button>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleCameraCapture}
                className="hidden"
              />

              {preview && (
                <div className="relative">
                  <img
                    src={preview}
                    alt="Preview"
                    className="w-full h-48 object-cover rounded-lg border"
                  />
                  <Button
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={clearImage}
                  >
                    ×
                  </Button>
                </div>
              )}

              <Button
                onClick={analyzeImage}
                disabled={!selectedFile || loading}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Analisando...
                  </>
                ) : (
                  <>
                    <Eye className="w-4 h-4 mr-2" />
                    Analisar Imagem
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results Section */}
        <Card>
          <CardHeader>
            <CardTitle>Resultado da Análise</CardTitle>
          </CardHeader>
          <CardContent>
            {!analysisResult ? (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <ImageIcon className="w-12 h-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  Selecione uma imagem e clique em "Analisar" para ver os
                  resultados
                </p>
              </div>
            ) : analysisResult.error ? (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <AlertCircle className="w-12 h-12 text-destructive mb-4" />
                <p className="text-destructive font-medium">Erro na análise</p>
                <p className="text-sm text-muted-foreground">
                  {analysisResult.error}
                </p>
              </div>
            ) : (
              <div>
                {analysisType === "food" && (
                  <FoodAnalysisResult result={analysisResult} />
                )}
                {analysisType === "exercise" && (
                  <ExerciseAnalysisResult result={analysisResult} />
                )}
                {analysisType === "general" && (
                  <GeneralAnalysisResult result={analysisResult} />
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ImageAnalysis;
