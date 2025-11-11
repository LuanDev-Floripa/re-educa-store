import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
/**
 * FavoritesPage
 * - Lista favoritos por tipo; ordenação; estados vazios
 */
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/Ui/card";
import { Button } from "@/components/Ui/button";
import { Badge } from "@/components/Ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/Ui/tabs";
import { useFavorites } from "../contexts/FavoritesContext";
import { useCart } from "../contexts/CartContext";
import {
  Heart,
  Package,
  Activity,
  Target,
  Calculator,
  ShoppingCart,
  Eye,
  Trash2,
  Star,
  Calendar,
  Filter,
  SortAsc,
  SortDesc,
  Grid,
  List,
  Search,
} from "lucide-react";
import { toast } from "sonner";

const FavoritesPage = () => {
  const {
    favorites,
    removeFromFavorites,
    getFavoritesByType,
    clearFavorites,
    getFavoritesCountByType,
  } = useFavorites();
  const { addToCart } = useCart();

  const [activeTab, setActiveTab] = useState("all");
  const [viewMode, setViewMode] = useState("grid");
  const [sortBy] = useState("newest");

  const productFavorites = Array.isArray(getFavoritesByType("product")) ? getFavoritesByType("product") : [];
  const exerciseFavorites = Array.isArray(getFavoritesByType("exercise")) ? getFavoritesByType("exercise") : [];
  const workoutPlanFavorites = Array.isArray(getFavoritesByType("workout_plan")) ? getFavoritesByType("workout_plan") : [];
  const toolFavorites = Array.isArray(getFavoritesByType("tool")) ? getFavoritesByType("tool") : [];

  const getItemIcon = (type) => {
    switch (type) {
      case "product":
        return Package;
      case "exercise":
        return Activity;
      case "workout_plan":
        return Target;
      case "tool":
        return Calculator;
      default:
        return Heart;
    }
  };

  const getItemTypeLabel = (type) => {
    switch (type) {
      case "product":
        return "Produto";
      case "exercise":
        return "Exercício";
      case "workout_plan":
        return "Plano de Treino";
      case "tool":
        return "Ferramenta";
      default:
        return "Item";
    }
  };

  const getItemUrl = (item) => {
    switch (item?.type) {
      case "product":
        return `/store/product/${item.id}`;
      case "exercise":
        return `/tools/exercises`;
      case "workout_plan":
        return `/tools/workout-plans`;
      case "tool":
        return `/tools/${item.slug}`;
      default:
        return "#";
    }
  };

  const sortFavorites = (items) => {
    return [...items].sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.addedAt) - new Date(a.addedAt);
        case "oldest":
          return new Date(a.addedAt) - new Date(b.addedAt);
        case "name":
          return a.name.localeCompare(b.name);
        case "type":
          return a.type.localeCompare(b.type);
        default:
          return 0;
      }
    });
  };

  const getFilteredFavorites = () => {
    let items = [];

    switch (activeTab) {
      case "products":
        items = productFavorites;
        break;
      case "exercises":
        items = exerciseFavorites;
        break;
      case "workout_plans":
        items = workoutPlanFavorites;
        break;
      case "tools":
        items = toolFavorites;
        break;
      default:
        items = favorites || [];
    }

    return sortFavorites(items);
  };

  const FavoriteCard = ({ item }) => {
    const IconComponent = getItemIcon(item?.type);

    return (
      <Card className="group hover:shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1),0_2px_4px_-1px_rgba(0,0,0,0.06)] transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]">
        <div className="relative">
          {item?.image && (
            <div className="aspect-video overflow-hidden rounded-t-2xl bg-muted">
              <img
                src={item.image}
                alt={item?.name || "Item"}
                className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]"
              />
            </div>
          )}

          <Badge className="absolute top-3 right-3 bg-primary/10 text-primary">
            {getItemTypeLabel(item?.type)}
          </Badge>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => removeFromFavorites(item?.id, item?.type)}
            className="absolute top-3 left-3 bg-card/90 backdrop-blur-sm hover:bg-card text-destructive hover:text-destructive transition-colors duration-200"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>

        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-primary/10 rounded-lg">
              <IconComponent className="w-5 h-5 text-primary" />
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg line-clamp-2 group-hover:text-primary transition-colors duration-200 mb-2">
                {item?.name || "Item"}
              </h3>
              {item?.description && (
                <p className="text-sm text-muted-foreground/90 line-clamp-2 leading-relaxed">
                  {item.description}
                </p>
              )}

              <div className="flex items-center justify-between mt-4">
                <div className="flex items-center gap-2 text-xs text-muted-foreground/90">
                  <Calendar className="w-3 h-3" />
                  <span>
                    Adicionado em{" "}
                    {item?.addedAt ? new Date(item.addedAt).toLocaleDateString("pt-BR") : "—"}
                  </span>
                </div>

                {item?.rating && (
                  <div className="flex items-center gap-1.5">
                    <Star className="w-4 h-4 text-primary fill-current" />
                    <span className="text-sm font-medium">{item?.rating}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <Button asChild className="flex-1 gap-2.5">
              <Link to={getItemUrl(item)}>
                <Eye className="w-4 h-4" />
                Ver Detalhes
              </Link>
            </Button>

            {item?.type === "product" && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  addToCart({
                    id: item.id,
                    name: item.name,
                    price: item.price || 0,
                    image: item.image,
                    brand: item.brand,
                  });
                  toast.success("Produto adicionado ao carrinho!");
                }}
              >
                <ShoppingCart className="w-4 h-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  const EmptyState = ({ type = "all" }) => {
    const getEmptyMessage = () => {
      switch (type) {
        case "products":
          return {
            title: "Nenhum produto favorito",
            description:
              "Adicione produtos aos seus favoritos para encontrá-los facilmente",
          };
        case "exercises":
          return {
            title: "Nenhum exercício favorito",
            description:
              "Marque exercícios como favoritos para acessá-los rapidamente",
          };
        case "workout_plans":
          return {
            title: "Nenhum plano de treino favorito",
            description: "Salve planos de treino nos seus favoritos",
          };
        case "tools":
          return {
            title: "Nenhuma ferramenta favorita",
            description: "Adicione ferramentas de saúde aos seus favoritos",
          };
        default:
          return {
            title: "Nenhum favorito",
            description: "Comece adicionando itens aos seus favoritos",
          };
      }
    };

    const message = getEmptyMessage();

    return (
      <div className="text-center py-16 px-4">
        <div className="relative mb-6 max-w-md mx-auto">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-24 h-24 rounded-full bg-primary/10 animate-pulse"></div>
          </div>
          <Heart className="w-16 h-16 text-primary mx-auto relative z-10" />
        </div>
        <h3 className="text-xl font-semibold text-foreground mb-3">
          {message.title}
        </h3>
        <p className="text-muted-foreground/90 leading-relaxed max-w-md mx-auto mb-6">
          {message.description}
        </p>
      </div>
    );
  };

  if (!favorites || favorites.length === 0) {
    return (
      <div className="max-w-7xl mx-auto p-8">
        <div className="text-center py-16 space-y-6">
          <div className="relative mb-6 max-w-md mx-auto">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-32 h-32 rounded-full bg-primary/10 animate-pulse"></div>
            </div>
            <Heart className="w-20 h-20 text-primary mx-auto relative z-10" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">
            Seus Favoritos
          </h1>
          <p className="text-muted-foreground/90 leading-relaxed max-w-md mx-auto">
            Nenhum item foi adicionado aos favoritos ainda
          </p>
          <Button asChild className="gap-2.5">
            <Link to="/store">
              <Package className="w-4 h-4" />
              Explorar Produtos
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-destructive/10 rounded-lg">
              <Heart className="w-6 h-6 text-destructive" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                Seus Favoritos
              </h1>
              <p className="text-muted-foreground">
                {favorites.length} item(s) salvos
              </p>
            </div>
          </div>

          <div className="flex space-x-2">
            <Button
              variant="outline"
              onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
            >
              {viewMode === "grid" ? (
                <List className="w-4 h-4" />
              ) : (
                <Grid className="w-4 h-4" />
              )}
            </Button>

            <Button
              variant="outline"
              onClick={clearFavorites}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Limpar Tudo
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-6 mb-8">
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-2xl font-bold text-primary mb-2">
                {favorites.length}
              </div>
              <div className="text-sm text-muted-foreground/90">
                Total
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-2xl font-bold text-primary mb-2">
                {getFavoritesCountByType("product")}
              </div>
              <div className="text-sm text-muted-foreground/90">
                Produtos
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-2xl font-bold text-primary mb-2">
                {getFavoritesCountByType("exercise")}
              </div>
              <div className="text-sm text-muted-foreground/90">
                Exercícios
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-2xl font-bold text-primary mb-2">
                {getFavoritesCountByType("workout_plan")}
              </div>
              <div className="text-sm text-muted-foreground/90">
                Planos
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-2xl font-bold text-primary mb-2">
                {getFavoritesCountByType("tool")}
              </div>
              <div className="text-sm text-muted-foreground/90">
                Ferramentas
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="all" className="flex items-center space-x-2">
            <Heart className="w-4 h-4" />
            <span>Todos</span>
          </TabsTrigger>
          <TabsTrigger value="products" className="flex items-center space-x-2">
            <Package className="w-4 h-4" />
            <span>Produtos</span>
          </TabsTrigger>
          <TabsTrigger
            value="exercises"
            className="flex items-center space-x-2"
          >
            <Activity className="w-4 h-4" />
            <span>Exercícios</span>
          </TabsTrigger>
          <TabsTrigger
            value="workout_plans"
            className="flex items-center space-x-2"
          >
            <Target className="w-4 h-4" />
            <span>Planos</span>
          </TabsTrigger>
          <TabsTrigger value="tools" className="flex items-center space-x-2">
            <Calculator className="w-4 h-4" />
            <span>Ferramentas</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {getFilteredFavorites().length > 0 ? (
            <div
              className={`grid gap-6 ${
                viewMode === "grid"
                  ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                  : "grid-cols-1"
              }`}
            >
              {getFilteredFavorites().map((item) => (
                <FavoriteCard key={`${item.type}-${item.id}`} item={item} />
              ))}
            </div>
          ) : (
            <EmptyState type={activeTab} />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FavoritesPage;
