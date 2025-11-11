import React, { createContext, useContext, useState, useEffect } from "react";
import logger from "../utils/logger";
import { getFavorites, setFavorites as saveFavorites } from "../utils/storage";
import { apiService } from "../lib/api";
import { useAuth } from "../hooks/useAuth.jsx";

const FavoritesContext = createContext();

export const useFavorites = () => {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error("useFavorites must be used within a FavoritesProvider");
  }
  return context;
};

export const FavoritesProvider = ({ children }) => {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(false);
  const { user, isAuthenticated } = useAuth();

  // Carregar favoritos do backend se autenticado, senão do localStorage
  useEffect(() => {
    const loadFavorites = async () => {
      try {
        if (isAuthenticated && user) {
          // Carregar do backend
          setLoading(true);
          const response = await apiService.users.getFavorites();
          const backendFavorites = response?.favorites || [];
          
          if (Array.isArray(backendFavorites)) {
            // Converter formato do backend para formato do contexto
            const formattedFavorites = backendFavorites.map(fav => ({
              id: fav.product_id || fav.id,
              type: fav.type || 'product',
              name: fav.name || fav.product?.name,
              price: fav.price || fav.product?.price,
              image: fav.image || fav.product?.image_url,
              addedAt: fav.created_at || new Date().toISOString()
            }));
            setFavorites(formattedFavorites);
            saveFavorites(formattedFavorites);
          }
          setLoading(false);
        } else {
          // Carregar do localStorage (usuário não autenticado)
          const savedFavorites = getFavorites();
          if (savedFavorites && Array.isArray(savedFavorites)) {
            setFavorites(savedFavorites);
          }
        }
      } catch (error) {
        logger.error("Erro ao carregar favoritos:", error);
        // Fallback para localStorage
        try {
          const savedFavorites = getFavorites();
          if (savedFavorites && Array.isArray(savedFavorites)) {
            setFavorites(savedFavorites);
          }
        } catch (localError) {
          logger.error("Erro ao carregar favoritos do localStorage:", localError);
        }
        setLoading(false);
      }
    };

    loadFavorites();
  }, [isAuthenticated, user?.id]);

  // Salvar favoritos no localStorage sempre que houver mudanças
  useEffect(() => {
    saveFavorites(favorites);
  }, [favorites]);

  const addToFavorites = async (item) => {
    // Verificar se o item já está nos favoritos
    const exists = favorites.some(
      (fav) => fav.id === item.id && fav.type === (item.type || 'product'),
    );
    if (exists) {
      return;
    }

    // Adicionar timestamp para ordenação
    const favoriteItem = {
      ...item,
      type: item.type || 'product',
      addedAt: new Date().toISOString(),
    };

    // Atualizar estado local imediatamente (otimista)
    setFavorites((prev) => [...prev, favoriteItem]);

    // Sincronizar com backend se autenticado
    if (isAuthenticated && user && item.type === 'product') {
      try {
        await apiService.users.addFavorite({ product_id: item.id });
      } catch (error) {
        logger.error("Error adding favorite to backend:", error);
        // Reverter se falhar
        setFavorites((prev) => prev.filter(fav => !(fav.id === item.id && fav.type === (item.type || 'product'))));
      }
    }
  };

  const removeFromFavorites = async (itemId, itemType = 'product') => {
    // Atualizar estado local imediatamente
    setFavorites((prev) =>
      prev.filter((fav) => !(fav.id === itemId && fav.type === itemType)),
    );

    // Sincronizar com backend se autenticado
    if (isAuthenticated && user && itemType === 'product') {
      try {
        await apiService.users.removeFavorite(itemId);
      } catch (error) {
        logger.error("Error removing favorite from backend:", error);
      }
    }
  };

  const toggleFavorite = (item) => {
    const isFavorite = favorites.some(
      (fav) => fav.id === item.id && fav.type === item.type,
    );

    if (isFavorite) {
      removeFromFavorites(item.id, item.type);
    } else {
      addToFavorites(item);
    }
  };

  const isFavorite = (itemId, itemType) => {
    return favorites.some((fav) => fav.id === itemId && fav.type === itemType);
  };

  const getFavoritesByType = (type) => {
    return favorites.filter((fav) => fav.type === type);
  };

  const clearFavorites = () => {
    setFavorites([]);
  };

  const getFavoritesCount = () => {
    return favorites.length;
  };

  const getFavoritesCountByType = (type) => {
    return favorites.filter((fav) => fav.type === type).length;
  };

  const value = {
    favorites,
    loading,
    addToFavorites,
    removeFromFavorites,
    toggleFavorite,
    isFavorite,
    getFavoritesByType,
    clearFavorites,
    getFavoritesCount,
    getFavoritesCountByType,
  };

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
};
