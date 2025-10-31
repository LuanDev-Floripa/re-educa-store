import React, { useState, useEffect } from "react";
/**
 * Fluxo de onboarding do usuário.
 * - Passos com validação mínima e progresso
 * - Callbacks onComplete/onSkip, com estado de loading seguro
 */
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/Ui/card";
import { Button } from "@/components/Ui/button";
import { Input } from "@/components/Ui/input";
import { Label } from "@/components/Ui/label";
import { Badge } from "@/components/Ui/badge";
import { Progress } from "@/components/Ui/progress";
import {
  User,
  Target,
  Activity,
  Heart,
  Calculator,
  Package,
  Star,
  Check,
  ArrowRight,
  ArrowLeft,
  TrendingDown,
  TrendingUp,
  Wind,
  Dumbbell,
  Apple,
  Shirt,
  Watch,
  Book,
  GraduationCap,
  Skip,
  Zap,
  Award,
  Users,
  Calendar,
  Clock,
  MapPin,
  Phone,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Info,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Plus,
  Minus,
  Edit,
  Trash2,
  Upload,
  Download,
  Camera,
  Image,
  FileText,
  Settings,
  Bell,
  Shield,
  Globe,
  Smartphone,
  Monitor,
  Tablet,
  Headphones,
  Mic,
  Video,
  MessageCircle,
  Share2,
  Bookmark,
  Flag,
  BarChart3,
  PieChart,
  Target as TargetIcon,
  Trophy,
  Crown,
  Diamond,
  Medal,
  Flame,
  Droplets,
  Moon,
  Sun,
  Cloud,
  Snow,
  Umbrella,
  TreePine,
  Mountain,
  Waves,
  Fish,
  Bird,
  Cat,
  Dog,
  Rabbit,
  Car,
  Bike,
  Bus,
  Train,
  Plane,
  Ship,
  Rocket,
  Gamepad2,
  Music,
  Headphones as HeadphonesIcon,
  Mic as MicIcon,
  Video as VideoIcon,
  Camera as CameraIcon,
  Image as ImageIcon,
  FileText as FileTextIcon,
  Settings as SettingsIcon,
  Bell as BellIcon,
  Shield as ShieldIcon,
  Globe as GlobeIcon,
  Smartphone as SmartphoneIcon,
  Monitor as MonitorIcon,
  Tablet as TabletIcon,
} from "lucide-react";

/**
 * UserOnboarding
 * Wizard de onboarding com validação básica e progresso.
 * @param {{
 *   onComplete?: (data: any) => void,
 *   onSkip?: () => void,
 *   userData?: Record<string, any>,
 *   showProgress?: boolean,
 *   allowSkip?: boolean,
 * }} props
 */
export const UserOnboarding = ({
  onComplete,
  onSkip,
  userData = {},
  showProgress = true,
  allowSkip = true,
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    // Informações Pessoais
    name: "",
    email: "",
    phone: "",
    birthDate: "",
    gender: "",
    height: "",
    weight: "",
    location: "",

    // Objetivos e Preferências
    goals: [],
    experience: "",
    activityLevel: "",
    workoutFrequency: "",
    workoutDuration: "",
    preferredTime: "",

    // Interesses
    interests: [],
    favoriteCategories: [],
    preferredBrands: [],

    // Configurações
    notifications: {
      email: true,
      push: true,
      sms: false,
      marketing: false,
    },
    privacy: {
      profilePublic: false,
      showProgress: true,
      allowMessages: true,
    },
    preferences: {
      theme: "light",
      language: "pt-BR",
      units: "metric",
    },
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const steps = [
    {
      id: "welcome",
      title: "Bem-vindo ao Re-Educa!",
      description: "Vamos personalizar sua experiência",
      icon: Star,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      id: "personal",
      title: "Informações Pessoais",
      description: "Conte-nos sobre você",
      icon: User,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      id: "goals",
      title: "Seus Objetivos",
      description: "O que você quer alcançar?",
      icon: Target,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      id: "experience",
      title: "Experiência",
      description: "Qual seu nível atual?",
      icon: Activity,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
    {
      id: "interests",
      title: "Interesses",
      description: "O que te motiva?",
      icon: Heart,
      color: "text-red-600",
      bgColor: "bg-red-50",
    },
    {
      id: "preferences",
      title: "Preferências",
      description: "Como você gosta de treinar?",
      icon: Settings,
      color: "text-gray-600",
      bgColor: "bg-gray-50",
    },
    {
      id: "notifications",
      title: "Notificações",
      description: "Como quer ser notificado?",
      icon: Bell,
      color: "text-yellow-600",
      bgColor: "bg-yellow-50",
    },
    {
      id: "complete",
      title: "Tudo Pronto!",
      description: "Sua conta está configurada",
      icon: CheckCircle,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
  ];

  const goalOptions = [
    {
      id: "weight_loss",
      label: "Perda de Peso",
      icon: TrendingDown,
      color: "text-green-600",
    },
    {
      id: "muscle_gain",
      label: "Ganho de Massa",
      icon: TrendingUp,
      color: "text-blue-600",
    },
    {
      id: "strength",
      label: "Aumentar Força",
      icon: Target,
      color: "text-red-600",
    },
    {
      id: "endurance",
      label: "Melhorar Resistência",
      icon: Activity,
      color: "text-purple-600",
    },
    {
      id: "flexibility",
      label: "Flexibilidade",
      icon: Wind,
      color: "text-yellow-600",
    },
    { id: "health", label: "Saúde Geral", icon: Heart, color: "text-pink-600" },
    {
      id: "sports",
      label: "Performance Esportiva",
      icon: Trophy,
      color: "text-orange-600",
    },
    {
      id: "rehabilitation",
      label: "Reabilitação",
      icon: Shield,
      color: "text-gray-600",
    },
  ];

  const experienceLevels = [
    {
      id: "beginner",
      label: "Iniciante",
      description: "Pouco ou nenhum experiência",
      icon: Star,
      color: "text-green-600",
    },
    {
      id: "intermediate",
      label: "Intermediário",
      description: "Alguma experiência",
      icon: Award,
      color: "text-blue-600",
    },
    {
      id: "advanced",
      label: "Avançado",
      description: "Muita experiência",
      icon: Crown,
      color: "text-purple-600",
    },
    {
      id: "expert",
      label: "Especialista",
      description: "Experiência profissional",
      icon: Diamond,
      color: "text-yellow-600",
    },
  ];

  const activityLevels = [
    {
      id: "sedentary",
      label: "Sedentário",
      description: "Pouco ou nenhum exercício",
      icon: Monitor,
      color: "text-gray-600",
    },
    {
      id: "light",
      label: "Leve",
      description: "Exercício leve 1-3x/semana",
      icon: Bike,
      color: "text-green-600",
    },
    {
      id: "moderate",
      label: "Moderado",
      description: "Exercício moderado 3-5x/semana",
      icon: Activity,
      color: "text-blue-600",
    },
    {
      id: "active",
      label: "Ativo",
      description: "Exercício intenso 6-7x/semana",
      icon: Flame,
      color: "text-orange-600",
    },
    {
      id: "very_active",
      label: "Muito Ativo",
      description: "Exercício muito intenso",
      icon: Zap,
      color: "text-red-600",
    },
  ];

  const interestOptions = [
    {
      id: "weightlifting",
      label: "Musculação",
      icon: Dumbbell,
      color: "text-blue-600",
    },
    { id: "cardio", label: "Cardio", icon: Heart, color: "text-red-600" },
    { id: "yoga", label: "Yoga", icon: Wind, color: "text-green-600" },
    {
      id: "pilates",
      label: "Pilates",
      icon: Activity,
      color: "text-purple-600",
    },
    { id: "running", label: "Corrida", icon: Zap, color: "text-orange-600" },
    { id: "cycling", label: "Ciclismo", icon: Bike, color: "text-blue-600" },
    { id: "swimming", label: "Natação", icon: Waves, color: "text-cyan-600" },
    {
      id: "martial_arts",
      label: "Artes Marciais",
      icon: Shield,
      color: "text-gray-600",
    },
    { id: "dance", label: "Dança", icon: Music, color: "text-pink-600" },
    {
      id: "outdoor",
      label: "Atividades ao Ar Livre",
      icon: Mountain,
      color: "text-green-600",
    },
    {
      id: "team_sports",
      label: "Esportes Coletivos",
      icon: Users,
      color: "text-blue-600",
    },
    {
      id: "nutrition",
      label: "Nutrição",
      icon: Apple,
      color: "text-green-600",
    },
  ];

  const categoryOptions = [
    {
      id: "supplements",
      label: "Suplementos",
      icon: Package,
      color: "text-green-600",
    },
    {
      id: "equipment",
      label: "Equipamentos",
      icon: Dumbbell,
      color: "text-blue-600",
    },
    { id: "clothing", label: "Roupas", icon: Shirt, color: "text-purple-600" },
    {
      id: "accessories",
      label: "Acessórios",
      icon: Watch,
      color: "text-orange-600",
    },
    { id: "books", label: "Livros", icon: Book, color: "text-yellow-600" },
    {
      id: "courses",
      label: "Cursos",
      icon: GraduationCap,
      color: "text-red-600",
    },
  ];

  const brandOptions = [
    "MuscleTech",
    "Optimum Nutrition",
    "Dymatize",
    "BSN",
    "Cellucor",
    "Universal Nutrition",
    "GNC",
    "Centrum",
    "Nike",
    "Adidas",
    "Under Armour",
  ];

  useEffect(() => {
    if (userData && typeof userData === "object") {
      setFormData((prev) => ({ ...prev, ...userData }));
    }
  }, [userData]);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Limpar erro do campo
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: null,
      }));
    }
  };

  const handleArrayChange = (field, value, checked) => {
    setFormData((prev) => ({
      ...prev,
      [field]: checked
        ? ([...(Array.isArray(prev[field]) ? prev[field] : []), value])
        : (Array.isArray(prev[field]) ? prev[field].filter((item) => item !== value) : []),
    }));
  };

  const handleNestedChange = (parent, field, value) => {
    setFormData((prev) => ({
      ...prev,
      [parent]: {
        ...prev[parent],
        [field]: value,
      },
    }));
  };

  const validateStep = (stepId) => {
    const newErrors = {};

    switch (stepId) {
      case "personal":
        if (!formData.name.trim()) newErrors.name = "Nome é obrigatório";
        if (!formData.email.trim()) newErrors.email = "Email é obrigatório";
        if (!formData.birthDate)
          newErrors.birthDate = "Data de nascimento é obrigatória";
        if (!formData.gender) newErrors.gender = "Gênero é obrigatório";
        break;
      case "goals":
        if (formData.goals.length === 0)
          newErrors.goals = "Selecione pelo menos um objetivo";
        break;
      case "experience":
        if (!formData.experience)
          newErrors.experience = "Nível de experiência é obrigatório";
        if (!formData.activityLevel)
          newErrors.activityLevel = "Nível de atividade é obrigatório";
        break;
      case "interests":
        if (formData.interests.length === 0)
          newErrors.interests = "Selecione pelo menos um interesse";
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    const currentStepData = steps[currentStep];

    if (validateStep(currentStepData.id)) {
      if (currentStep < steps.length - 1) {
        setCurrentStep((prev) => prev + 1);
      } else {
        handleComplete();
      }
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleSkip = () => {
    if (onSkip) {
      onSkip();
    }
  };

  const handleComplete = async () => {
    setLoading(true);

    try {
      // Simular salvamento dos dados
      await new Promise((resolve) => setTimeout(resolve, 2000));

      if (typeof onComplete === "function") {
        onComplete(formData);
      }
    } catch (error) {
      console.error("Erro ao salvar dados:", error);
    } finally {
      setLoading(false);
    }
  };

  const getProgress = () => {
    return ((currentStep + 1) / steps.length) * 100;
  };

  const renderWelcomeStep = () => (
    <div className="text-center space-y-6">
      <div className="mx-auto w-24 h-24 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
        <Star className="w-12 h-12 text-blue-600" />
      </div>

      <div>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          Bem-vindo ao Re-Educa!
        </h2>
        <p className="text-lg text-gray-600 dark:text-gray-400 mb-6">
          Vamos personalizar sua experiência para você alcançar seus objetivos
          de saúde e fitness
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
          <Target className="w-8 h-8 text-green-600 mx-auto mb-2" />
          <h3 className="font-semibold text-green-800 dark:text-green-200">
            Objetivos Personalizados
          </h3>
          <p className="text-sm text-green-700 dark:text-green-300">
            Defina e acompanhe seus objetivos
          </p>
        </div>

        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <Activity className="w-8 h-8 text-blue-600 mx-auto mb-2" />
          <h3 className="font-semibold text-blue-800 dark:text-blue-200">
            Planos de Treino
          </h3>
          <p className="text-sm text-blue-700 dark:text-blue-300">
            Treinos adaptados ao seu nível
          </p>
        </div>

        <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
          <Calculator className="w-8 h-8 text-purple-600 mx-auto mb-2" />
          <h3 className="font-semibold text-purple-800 dark:text-purple-200">
            Ferramentas de Saúde
          </h3>
          <p className="text-sm text-purple-700 dark:text-purple-300">
            Calculadoras e análises
          </p>
        </div>
      </div>
    </div>
  );

  const renderPersonalStep = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Nome Completo *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => handleInputChange("name", e.target.value)}
            placeholder="Seu nome completo"
            className={errors.name ? "border-red-500" : ""}
          />
          {errors.name && (
            <p className="text-red-500 text-sm mt-1">{errors.name}</p>
          )}
        </div>

        <div>
          <Label htmlFor="email">Email *</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => handleInputChange("email", e.target.value)}
            placeholder="seu@email.com"
            className={errors.email ? "border-red-500" : ""}
          />
          {errors.email && (
            <p className="text-red-500 text-sm mt-1">{errors.email}</p>
          )}
        </div>

        <div>
          <Label htmlFor="phone">Telefone</Label>
          <Input
            id="phone"
            value={formData.phone}
            onChange={(e) => handleInputChange("phone", e.target.value)}
            placeholder="(11) 99999-9999"
          />
        </div>

        <div>
          <Label htmlFor="birthDate">Data de Nascimento *</Label>
          <Input
            id="birthDate"
            type="date"
            value={formData.birthDate}
            onChange={(e) => handleInputChange("birthDate", e.target.value)}
            className={errors.birthDate ? "border-red-500" : ""}
          />
          {errors.birthDate && (
            <p className="text-red-500 text-sm mt-1">{errors.birthDate}</p>
          )}
        </div>

        <div>
          <Label htmlFor="gender">Gênero *</Label>
          <select
            id="gender"
            value={formData.gender}
            onChange={(e) => handleInputChange("gender", e.target.value)}
            className={`w-full px-3 py-2 border rounded-md ${errors.gender ? "border-red-500" : "border-gray-300"}`}
          >
            <option value="">Selecione</option>
            <option value="male">Masculino</option>
            <option value="female">Feminino</option>
            <option value="other">Outro</option>
            <option value="prefer_not_to_say">Prefiro não informar</option>
          </select>
          {errors.gender && (
            <p className="text-red-500 text-sm mt-1">{errors.gender}</p>
          )}
        </div>

        <div>
          <Label htmlFor="location">Localização</Label>
          <Input
            id="location"
            value={formData.location}
            onChange={(e) => handleInputChange("location", e.target.value)}
            placeholder="Cidade, Estado"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="height">Altura (cm)</Label>
          <Input
            id="height"
            type="number"
            value={formData.height}
            onChange={(e) => handleInputChange("height", e.target.value)}
            placeholder="170"
          />
        </div>

        <div>
          <Label htmlFor="weight">Peso (kg)</Label>
          <Input
            id="weight"
            type="number"
            value={formData.weight}
            onChange={(e) => handleInputChange("weight", e.target.value)}
            placeholder="70"
          />
        </div>
      </div>
    </div>
  );

  const renderGoalsStep = () => (
    <div className="space-y-6">
      <div>
        <Label>Seus Objetivos *</Label>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Selecione todos os objetivos que se aplicam a você
        </p>
        {errors.goals && (
          <p className="text-red-500 text-sm mb-4">{errors.goals}</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {goalOptions.map((goal) => {
          const IconComponent = goal.icon;
          const isSelected = formData.goals.includes(goal.id);

          return (
            <div
              key={goal.id}
              className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                isSelected
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                  : "border-gray-200 hover:border-gray-300"
              }`}
              onClick={() => handleArrayChange("goals", goal.id, !isSelected)}
            >
              <div className="flex items-center space-x-3">
                <IconComponent className={`w-6 h-6 ${goal.color}`} />
                <div>
                  <h3 className="font-semibold">{goal.label}</h3>
                </div>
                {isSelected && (
                  <Check className="w-5 h-5 text-blue-600 ml-auto" />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderExperienceStep = () => (
    <div className="space-y-6">
      <div>
        <Label>Nível de Experiência *</Label>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Qual seu nível atual de experiência com exercícios?
        </p>
        {errors.experience && (
          <p className="text-red-500 text-sm mb-4">{errors.experience}</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {experienceLevels.map((level) => {
          const IconComponent = level.icon;
          const isSelected = formData.experience === level.id;

          return (
            <div
              key={level.id}
              className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                isSelected
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                  : "border-gray-200 hover:border-gray-300"
              }`}
              onClick={() => handleInputChange("experience", level.id)}
            >
              <div className="flex items-center space-x-3">
                <IconComponent className={`w-6 h-6 ${level.color}`} />
                <div>
                  <h3 className="font-semibold">{level.label}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {level.description}
                  </p>
                </div>
                {isSelected && (
                  <Check className="w-5 h-5 text-blue-600 ml-auto" />
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div>
        <Label>Nível de Atividade *</Label>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Com que frequência você se exercita atualmente?
        </p>
        {errors.activityLevel && (
          <p className="text-red-500 text-sm mb-4">{errors.activityLevel}</p>
        )}
      </div>

      <div className="space-y-3">
        {activityLevels.map((level) => {
          const IconComponent = level.icon;
          const isSelected = formData.activityLevel === level.id;

          return (
            <div
              key={level.id}
              className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                isSelected
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                  : "border-gray-200 hover:border-gray-300"
              }`}
              onClick={() => handleInputChange("activityLevel", level.id)}
            >
              <div className="flex items-center space-x-3">
                <IconComponent className={`w-6 h-6 ${level.color}`} />
                <div>
                  <h3 className="font-semibold">{level.label}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {level.description}
                  </p>
                </div>
                {isSelected && (
                  <Check className="w-5 h-5 text-blue-600 ml-auto" />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderInterestsStep = () => (
    <div className="space-y-6">
      <div>
        <Label>Interesses *</Label>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Selecione as atividades que mais te interessam
        </p>
        {errors.interests && (
          <p className="text-red-500 text-sm mb-4">{errors.interests}</p>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {interestOptions.map((interest) => {
          const IconComponent = interest.icon;
          const isSelected = formData.interests.includes(interest.id);

          return (
            <div
              key={interest.id}
              className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                isSelected
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                  : "border-gray-200 hover:border-gray-300"
              }`}
              onClick={() =>
                handleArrayChange("interests", interest.id, !isSelected)
              }
            >
              <div className="text-center">
                <IconComponent
                  className={`w-8 h-8 ${interest.color} mx-auto mb-2`}
                />
                <h3 className="font-semibold text-sm">{interest.label}</h3>
                {isSelected && (
                  <Check className="w-4 h-4 text-blue-600 mx-auto mt-2" />
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div>
        <Label>Categorias Favoritas</Label>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Quais categorias de produtos te interessam?
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {categoryOptions.map((category) => {
          const IconComponent = category.icon;
          const isSelected = formData.favoriteCategories.includes(category.id);

          return (
            <div
              key={category.id}
              className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                isSelected
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                  : "border-gray-200 hover:border-gray-300"
              }`}
              onClick={() =>
                handleArrayChange(
                  "favoriteCategories",
                  category.id,
                  !isSelected,
                )
              }
            >
              <div className="text-center">
                <IconComponent
                  className={`w-8 h-8 ${category.color} mx-auto mb-2`}
                />
                <h3 className="font-semibold text-sm">{category.label}</h3>
                {isSelected && (
                  <Check className="w-4 h-4 text-blue-600 mx-auto mt-2" />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderPreferencesStep = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label>Frequência de Treino</Label>
          <select
            value={formData.workoutFrequency}
            onChange={(e) =>
              handleInputChange("workoutFrequency", e.target.value)
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          >
            <option value="">Selecione</option>
            <option value="1-2">1-2 vezes por semana</option>
            <option value="3-4">3-4 vezes por semana</option>
            <option value="5-6">5-6 vezes por semana</option>
            <option value="daily">Todos os dias</option>
          </select>
        </div>

        <div>
          <Label>Duração do Treino</Label>
          <select
            value={formData.workoutDuration}
            onChange={(e) =>
              handleInputChange("workoutDuration", e.target.value)
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          >
            <option value="">Selecione</option>
            <option value="15-30">15-30 minutos</option>
            <option value="30-45">30-45 minutos</option>
            <option value="45-60">45-60 minutos</option>
            <option value="60+">Mais de 60 minutos</option>
          </select>
        </div>

        <div>
          <Label>Horário Preferido</Label>
          <select
            value={formData.preferredTime}
            onChange={(e) => handleInputChange("preferredTime", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          >
            <option value="">Selecione</option>
            <option value="morning">Manhã (6h-12h)</option>
            <option value="afternoon">Tarde (12h-18h)</option>
            <option value="evening">Noite (18h-24h)</option>
            <option value="flexible">Flexível</option>
          </select>
        </div>

        <div>
          <Label>Tema</Label>
          <select
            value={formData.preferences.theme}
            onChange={(e) =>
              handleNestedChange("preferences", "theme", e.target.value)
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          >
            <option value="light">Claro</option>
            <option value="dark">Escuro</option>
            <option value="system">Sistema</option>
          </select>
        </div>
      </div>
    </div>
  );

  const renderNotificationsStep = () => (
    <div className="space-y-6">
      <div>
        <Label>Preferências de Notificação</Label>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Escolha como você quer ser notificado
        </p>
      </div>

      <div className="space-y-4">
        {Object.entries(formData.notifications).map(([key, value]) => (
          <div
            key={key}
            className="flex items-center justify-between p-4 border rounded-lg"
          >
            <div>
              <h3 className="font-semibold capitalize">{key}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {key === "email" && "Receber notificações por email"}
                {key === "push" && "Receber notificações push"}
                {key === "sms" && "Receber notificações por SMS"}
                {key === "marketing" && "Receber ofertas e promoções"}
              </p>
            </div>
            <input
              type="checkbox"
              checked={value}
              onChange={(e) =>
                handleNestedChange("notifications", key, e.target.checked)
              }
              className="w-5 h-5 text-blue-600 rounded"
            />
          </div>
        ))}
      </div>
    </div>
  );

  const renderCompleteStep = () => (
    <div className="text-center space-y-6">
      <div className="mx-auto w-24 h-24 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
        <CheckCircle className="w-12 h-12 text-green-600" />
      </div>

      <div>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          Tudo Pronto!
        </h2>
        <p className="text-lg text-gray-600 dark:text-gray-400 mb-6">
          Sua conta foi configurada com sucesso. Agora você pode começar sua
          jornada de saúde e fitness!
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <Target className="w-8 h-8 text-blue-600 mx-auto mb-2" />
          <h3 className="font-semibold text-blue-800 dark:text-blue-200">
            Objetivos Definidos
          </h3>
          <p className="text-sm text-blue-700 dark:text-blue-300">
            {formData.goals.length} objetivo(s) configurado(s)
          </p>
        </div>

        <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
          <Activity className="w-8 h-8 text-green-600 mx-auto mb-2" />
          <h3 className="font-semibold text-green-800 dark:text-green-200">
            Perfil Completo
          </h3>
          <p className="text-sm text-green-700 dark:text-green-300">
            Experiência: {formData.experience}
          </p>
        </div>

        <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
          <Heart className="w-8 h-8 text-purple-600 mx-auto mb-2" />
          <h3 className="font-semibold text-purple-800 dark:text-purple-200">
            Interesses
          </h3>
          <p className="text-sm text-purple-700 dark:text-purple-300">
            {formData.interests.length} interesse(s) selecionado(s)
          </p>
        </div>

        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <Star className="w-8 h-8 text-blue-600 mx-auto mb-2" />
          <h3 className="font-semibold text-blue-800 dark:text-blue-200">
            Marcas Favoritas
          </h3>
          <p className="text-sm text-blue-700 dark:text-blue-300">
            {brandOptions.length} marcas disponíveis
          </p>
        </div>
      </div>
    </div>
  );

  const renderStepContent = () => {
    const currentStepData = steps[currentStep];

    switch (currentStepData.id) {
      case "welcome":
        return renderWelcomeStep();
      case "personal":
        return renderPersonalStep();
      case "goals":
        return renderGoalsStep();
      case "experience":
        return renderExperienceStep();
      case "interests":
        return renderInterestsStep();
      case "preferences":
        return renderPreferencesStep();
      case "notifications":
        return renderNotificationsStep();
      case "complete":
        return renderCompleteStep();
      default:
        return null;
    }
  };

  const currentStepData = steps[currentStep];
  const IconComponent = currentStepData.icon;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`p-2 ${currentStepData.bgColor} rounded-lg`}>
                  <IconComponent
                    className={`w-6 h-6 ${currentStepData.color}`}
                  />
                </div>
                <div>
                  <CardTitle>{currentStepData.title}</CardTitle>
                  <CardDescription>
                    {currentStepData.description}
                  </CardDescription>
                </div>
              </div>

              {allowSkip && currentStep < steps.length - 1 && (
                <Button variant="outline" onClick={handleSkip}>
                  <Skip className="w-4 h-4 mr-2" />
                  Pular
                </Button>
              )}
            </div>

            {showProgress && (
              <div className="mt-4">
                <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
                  <span>
                    Passo {currentStep + 1} de {steps.length}
                  </span>
                  <span>{Math.round(getProgress())}%</span>
                </div>
                <Progress value={getProgress()} className="h-2" />
              </div>
            )}
          </CardHeader>

          <CardContent className="min-h-[500px]">
            {renderStepContent()}
          </CardContent>

          <div className="flex items-center justify-between p-6 border-t">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 0}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Anterior
            </Button>

            <div className="flex space-x-2">
              {currentStep < steps.length - 1 ? (
                <Button onClick={handleNext} disabled={loading}>
                  Próximo
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button onClick={handleComplete} disabled={loading}>
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" aria-hidden="true"></div>
                      <span role="status" aria-live="polite">Finalizando...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Finalizar
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
