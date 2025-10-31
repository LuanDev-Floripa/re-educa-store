import React, { createContext, useContext, useState, useEffect } from "react";

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

  // Carregar favoritos do localStorage na inicialização
  useEffect(() => {
    const savedFavorites = localStorage.getItem("re-educa-favorites");
    if (savedFavorites) {
      try {
        setFavorites(JSON.parse(savedFavorites));
      } catch (error) {
        console.error("Erro ao carregar favoritos:", error);
        setFavorites([]);
      }
    }
  }, []);

  // Salvar favoritos no localStorage sempre que houver mudanças
  useEffect(() => {
    localStorage.setItem("re-educa-favorites", JSON.stringify(favorites));
  }, [favorites]);

  const addToFavorites = (item) => {
    setFavorites((prev) => {
      // Verificar se o item já está nos favoritos
      const exists = prev.some(
        (fav) => fav.id === item.id && fav.type === item.type,
      );
      if (exists) {
        return prev;
      }

      // Adicionar timestamp para ordenação
      const favoriteItem = {
        ...item,
        addedAt: new Date().toISOString(),
      };

      return [...prev, favoriteItem];
    });
  };

  const removeFromFavorites = (itemId, itemType) => {
    setFavorites((prev) =>
      prev.filter((fav) => !(fav.id === itemId && fav.type === itemType)),
    );
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
