import React, { useState, useEffect } from "react";
import logger from "@/utils/logger";
import apiClient from "@/services/apiClient";
import { toast } from "sonner";
import { AnimatePresence } from "framer-motion";
import {
  BookOpen,
  TrendingUp,
  Clock,
  User,
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  Search,
  Filter,
  Calendar,
  Tag,
  Eye,
  ThumbsUp,
  Instagram,
  Sparkles,
  Brain,
  Zap,
  Star,
  ChevronRight,
  Play,
  Pause,
  Volume2,
  VolumeX,
  MoreHorizontal,
  ExternalLink,
  Download,
  RefreshCw,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/Ui/card";
import { Button } from "@/components/Ui/button";
import { Badge } from "@/components/Ui/badge";
import { Input } from "@/components/Ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/Ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/Ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/Ui/select";
import {
  AnimatedGradient,
  FloatingElement,
  MagneticButton,
  MorphingCard,
  ParticleSystem,
  GlowingBorder,
  TypingAnimation,
  RippleEffect,
  StaggerContainer,
} from "@/components/magic-ui";

// ================================
// BLOG INTELIGENTE COM IA
// ================================

const IntelligentBlog = () => {
  const [posts, setPosts] = useState([]);
  const [featuredPost, setFeaturedPost] = useState(null);
  const [categories, setCategories] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  // Estados para funcionalidades avançadas
  // const [readingMode, setReadingMode] = useState(false); // Unused variables
  // const [audioEnabled, setAudioEnabled] = useState(false); // Unused variables
  const [bookmarkedPosts, setBookmarkedPosts] = useState([]);

  useEffect(() => {
    loadBlogData();
  }, []);

  const loadBlogData = async () => {
    setIsLoading(true);
    try {
      // Carregar posts reais da API
      const data = await apiClient.get("/social/posts?type=blog");
      const postsList = data.posts || data.data || [];

      // Gerar categorias dinamicamente
      const categoriesMap = new Map();
      postsList.forEach((post) => {
        const cat = post.category || "outros";
        const count = categoriesMap.get(cat) || 0;
        categoriesMap.set(cat, count + 1);
      });

      const categoriesList = [
        { id: "all", name: "Todos", count: postsList.length },
        ...Array.from(categoriesMap.entries()).map(([id, count]) => ({
          id: id.toLowerCase().replace(/\s+/g, "-"),
          name: id,
          count,
        })),
      ];

      setPosts(postsList);
      setFeaturedPost(
        postsList.find((post) => post.featured) || postsList[0],
      );
      setCategories(categoriesList);
    } catch (error) {
      logger.error("Erro ao carregar dados do blog:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateAIContent = async () => {
    setIsGenerating(true);
    try {
      // Gerar conteúdo com IA via API real
      const aiResponse = await apiClient.chatWithAI(
        "Gere um artigo sobre saúde e bem-estar",
        { type: "blog_post", category: selectedCategory },
      );

      if (
        aiResponse &&
        (aiResponse.response || aiResponse.content || aiResponse.message)
      ) {
        const aiContent =
          aiResponse.response || aiResponse.content || aiResponse.message || "";
        const newPost = {
          id: Date.now(),
          title: "Novo Artigo Gerado por IA",
          excerpt:
            "Conteúdo personalizado baseado nas últimas tendências do Instagram e pesquisas científicas.",
          content: aiContent,
          author: {
            name: "IA Assistant",
            avatar: "/api/placeholder/40/40",
            bio: "Assistente de IA especializado em saúde",
          },
          category: "IA Generated",
          tags: ["ia", "personalizado", "tendências"],
          publishedAt: new Date().toISOString(),
          readTime: 5,
          views: 0,
          likes: 0,
          comments: 0,
          featured: false,
          aiGenerated: true,
          instagramSource: "Múltiplas fontes",
          image: "/api/placeholder/600/300",
        };

        setPosts((prev) => [newPost, ...prev]);
        toast.success("Artigo gerado por IA com sucesso!");
      } else {
        throw new Error("Resposta inválida da IA");
      }
    } catch (error) {
      logger.error("Erro ao gerar conteúdo:", error);
      toast.error("Erro ao gerar conteúdo com IA");
    } finally {
      setIsGenerating(false);
    }
  };

  const filteredPosts = posts.filter((post) => {
    const matchesSearch =
      post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.excerpt.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === "all" ||
      post.category.toLowerCase().includes(selectedCategory);
    return matchesSearch && matchesCategory;
  });

  if (isLoading) {
    return <BlogSkeleton />;
  }

  return (
    <AnimatedGradient className="min-h-screen">
      <ParticleSystem count={20} />

      <div className="container mx-auto px-4 py-8">
        {/* Header do Blog */}
        <BlogHeader
          onGenerateContent={generateAIContent}
          isGenerating={isGenerating}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          categories={categories}
        />

        {/* Post em Destaque */}
        {featuredPost && (
          <FeaturedPost
            post={featuredPost}
            onBookmark={(postId) =>
              setBookmarkedPosts((prev) => [...prev, postId])
            }
          />
        )}

        {/* Grid de Posts */}
        <PostGrid
          posts={filteredPosts}
          onBookmark={(postId) =>
            setBookmarkedPosts((prev) => [...prev, postId])
          }
          bookmarkedPosts={bookmarkedPosts}
        />

        {/* Sidebar com Widgets */}
        <BlogSidebar />
      </div>
    </AnimatedGradient>
  );
};

// ================================
// COMPONENTES DO BLOG
// ================================

const BlogSkeleton = () => (
  <div className="min-h-screen bg-background animate-pulse">
    <div className="container mx-auto px-4 py-8">
      <div className="h-20 bg-muted rounded-lg mb-8"></div>
      <div className="h-64 bg-muted rounded-lg mb-8"></div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-80 bg-muted rounded-lg"></div>
        ))}
      </div>
    </div>
  </div>
);

const BlogHeader = ({
  onGenerateContent,
  isGenerating,
  searchTerm,
  setSearchTerm,
  selectedCategory,
  setSelectedCategory,
  categories,
}) => (
  <StaggerContainer className="mb-12">
    <div className="text-center mb-8">
      <FloatingElement>
        <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
          <TypingAnimation text="Blog Inteligente RE-EDUCA" speed={50} />
        </h1>
      </FloatingElement>
      <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
        Conteúdo personalizado gerado por IA, baseado nas últimas tendências do
        Instagram e pesquisas científicas em saúde e bem-estar.
      </p>
    </div>

    <MorphingCard className="p-6">
      <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Buscar artigos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-48">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name} ({category.count})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2">
          <MagneticButton
            onClick={onGenerateContent}
            disabled={isGenerating}
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Gerando...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Gerar com IA
              </>
            )}
          </MagneticButton>

          <Button variant="outline">
            <Instagram className="w-4 h-4 mr-2" />
            Conectar Instagram
          </Button>
        </div>
      </div>
    </MorphingCard>
  </StaggerContainer>
);

const FeaturedPost = ({ post, onBookmark }) => (
  <StaggerContainer className="mb-12">
    <MorphingCard className="overflow-hidden">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
        <div className="relative h-64 lg:h-auto">
          <img
            src={post.image}
            alt={post.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute top-4 left-4">
            <Badge className="bg-primary text-primary-foreground">
              <Star className="w-3 h-3 mr-1" />
              Destaque
            </Badge>
          </div>
          {post.aiGenerated && (
            <div className="absolute top-4 right-4">
              <Badge className="bg-primary text-primary-foreground">
                <Brain className="w-3 h-3 mr-1" />
                IA
              </Badge>
            </div>
          )}
        </div>

        <div className="p-8">
          <div className="flex items-center gap-2 mb-4">
            <Badge variant="secondary">{post.category}</Badge>
            <span className="text-sm text-muted-foreground">•</span>
            <span className="text-sm text-muted-foreground">
              {post.readTime} min de leitura
            </span>
          </div>

          <h2 className="text-2xl lg:text-3xl font-bold text-foreground mb-4 leading-tight">
            {post.title}
          </h2>

          <p className="text-muted-foreground mb-6 text-lg leading-relaxed">
            {post.excerpt}
          </p>

          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Avatar className="w-10 h-10">
                <AvatarImage src={post.author.avatar} alt={post.author.name} />
                <AvatarFallback>{post.author.name[0]}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium text-foreground">{post.author.name}</p>
                <p className="text-sm text-muted-foreground">
                  {new Date(post.publishedAt).toLocaleDateString("pt-BR")}
                </p>
              </div>
            </div>

            {post.instagramSource && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Instagram className="w-4 h-4" />
                {post.instagramSource}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Eye className="w-4 h-4" />
                {post.views.toLocaleString()}
              </span>
              <span className="flex items-center gap-1">
                <Heart className="w-4 h-4" />
                {post.likes}
              </span>
              <span className="flex items-center gap-1">
                <MessageCircle className="w-4 h-4" />
                {post.comments}
              </span>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onBookmark(post.id)}
              >
                <Bookmark className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm">
                <Share2 className="w-4 h-4" />
              </Button>
              <MagneticButton size="sm">
                Ler Artigo
                <ChevronRight className="w-4 h-4 ml-1" />
              </MagneticButton>
            </div>
          </div>
        </div>
      </div>
    </MorphingCard>
  </StaggerContainer>
);

const PostGrid = ({ posts, onBookmark, bookmarkedPosts }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
    {posts.map((post, index) => (
      <FloatingElement key={post.id} delay={index * 0.1}>
        <PostCard
          post={post}
          onBookmark={onBookmark}
          isBookmarked={bookmarkedPosts.includes(post.id)}
        />
      </FloatingElement>
    ))}
  </div>
);

const PostCard = ({ post, onBookmark, isBookmarked }) => (
  <MorphingCard className="overflow-hidden h-full hover-lift">
    <div className="relative">
      <img
        src={post.image}
        alt={post.title}
        className="w-full h-48 object-cover"
      />
      <div className="absolute top-3 left-3">
        <Badge variant="secondary" className="bg-card/90 text-foreground">
          {post.category}
        </Badge>
      </div>
      {post.aiGenerated && (
        <div className="absolute top-3 right-3">
          <Badge className="bg-primary text-primary-foreground">
            <Brain className="w-3 h-3 mr-1" />
            IA
          </Badge>
        </div>
      )}
    </div>

    <div className="p-6">
      <div className="flex items-center gap-2 mb-3">
        <Clock className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">{post.readTime} min</span>
        {post.instagramSource && (
          <>
            <span className="text-muted-foreground/50">•</span>
            <Instagram className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Instagram</span>
          </>
        )}
      </div>

      <h3 className="text-lg font-semibold text-foreground mb-3 line-clamp-2 leading-tight">
        {post.title}
      </h3>

      <p className="text-muted-foreground mb-4 line-clamp-3 text-sm leading-relaxed">
        {post.excerpt}
      </p>

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Avatar className="w-8 h-8">
            <AvatarImage src={post.author.avatar} alt={post.author.name} />
            <AvatarFallback className="text-xs">
              {post.author.name[0]}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-medium text-foreground">
              {post.author.name}
            </p>
            <p className="text-xs text-muted-foreground">
              {new Date(post.publishedAt).toLocaleDateString("pt-BR")}
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Heart className="w-3 h-3" />
            {post.likes}
          </span>
          <span className="flex items-center gap-1">
            <MessageCircle className="w-3 h-3" />
            {post.comments}
          </span>
        </div>

        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onBookmark(post.id)}
            className={isBookmarked ? "text-primary" : ""}
          >
            <Bookmark className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm">
            <Share2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  </MorphingCard>
);

const BlogSidebar = () => (
  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
    {/* Trending Topics */}
    <MorphingCard className="p-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <TrendingUp className="w-5 h-5 text-primary" />
        Trending Topics
      </h3>
      <div className="space-y-3">
        {[
          "Jejum Intermitente",
          "Treino Funcional",
          "Mindfulness",
          "Suplementação",
          "Sono Reparador",
        ].map((topic, index) => (
          <RippleEffect
            key={index}
            className="p-2 rounded-lg hover:bg-accent cursor-pointer transition-colors"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{topic}</span>
              <Badge variant="secondary" className="text-xs">
                #{index + 1}
              </Badge>
            </div>
          </RippleEffect>
        ))}
      </div>
    </MorphingCard>

    {/* Newsletter */}
    <MorphingCard className="p-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Zap className="w-5 h-5 text-primary" />
        Newsletter IA
      </h3>
      <p className="text-sm text-muted-foreground mb-4">
        Receba conteúdo personalizado gerado por IA baseado no seu perfil de
        saúde.
      </p>
      <div className="space-y-3">
        <Input placeholder="Seu email" />
        <MagneticButton className="w-full">Inscrever-se</MagneticButton>
      </div>
    </MorphingCard>

    {/* Instagram Feed */}
    <MorphingCard className="p-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Instagram className="w-5 h-5 text-primary" />
        Feed Instagram
      </h3>
      <div className="grid grid-cols-3 gap-2">
        {[...Array(9)].map((_, index) => (
          <div
            key={index}
            className="aspect-square bg-muted rounded-lg overflow-hidden"
          >
            <img
              src={`/api/placeholder/100/100`}
              alt={`Instagram post ${index + 1}`}
              className="w-full h-full object-cover hover:scale-110 transition-transform duration-300 cursor-pointer"
            />
          </div>
        ))}
      </div>
      <Button variant="outline" className="w-full mt-4">
        <ExternalLink className="w-4 h-4 mr-2" />
        Ver no Instagram
      </Button>
    </MorphingCard>
  </div>
);

// ================================
// FUNÇÕES AUXILIARES
// ================================


export default IntelligentBlog;
