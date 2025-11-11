import React, { createContext, useContext, useReducer, useEffect } from "react";
import logger from "../utils/logger";
import { getCart, setCart as saveCart } from "../utils/storage";
import { apiService } from "../lib/api";
import { useAuth } from "../hooks/useAuth.jsx";

const CartContext = createContext();

// Cart reducer
const cartReducer = (state, action) => {
  switch (action.type) {
    case "ADD_TO_CART": {
      const existingItem = state.items.find(
        (item) => item.id === action.payload.id,
      );
      if (existingItem) {
        return {
          ...state,
          items: state.items.map((item) =>
            item.id === action.payload.id
              ? {
                  ...item,
                  quantity: item.quantity + (action.payload.quantity || 1),
                }
              : item,
          ),
        };
      }
      return {
        ...state,
        items: [
          ...state.items,
          { ...action.payload, quantity: action.payload.quantity || 1 },
        ],
      };
    }

    case "REMOVE_FROM_CART":
      return {
        ...state,
        items: state.items.filter((item) => item.id !== action.payload),
      };

    case "UPDATE_QUANTITY":
      return {
        ...state,
        items: state.items
          .map((item) =>
            item.id === action.payload.id
              ? { ...item, quantity: Math.max(0, action.payload.quantity) }
              : item,
          )
          .filter((item) => item.quantity > 0),
      };

    case "CLEAR_CART":
      return {
        ...state,
        items: [],
      };

    case "SET_CART":
      return {
        ...state,
        items: action.payload || [],
      };

    case "SET_CART_OPEN":
      return {
        ...state,
        isOpen: action.payload,
      };

    default:
      return state;
  }
};

export const CartProvider = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, {
    items: [],
    isOpen: false,
  });
  const { user, isAuthenticated } = useAuth();
  const [syncing, setSyncing] = React.useState(false);

  // Load cart from backend if authenticated, otherwise from localStorage
  useEffect(() => {
    const loadCart = async () => {
      try {
        if (isAuthenticated && user) {
          // Carregar do backend
          setSyncing(true);
          const backendCart = await apiService.cart.getCart();
          if (backendCart?.items && Array.isArray(backendCart.items)) {
            dispatch({ type: "SET_CART", payload: backendCart.items });
            // Sincronizar localStorage também
            saveCart(backendCart.items);
          }
          setSyncing(false);
        } else {
          // Carregar do localStorage (usuário não autenticado)
          const savedCart = getCart();
          if (savedCart && Array.isArray(savedCart)) {
            dispatch({ type: "SET_CART", payload: savedCart });
          }
        }
      } catch (error) {
        logger.error("Error loading cart:", error);
        // Fallback para localStorage
        try {
          const savedCart = getCart();
          if (savedCart && Array.isArray(savedCart)) {
            dispatch({ type: "SET_CART", payload: savedCart });
          }
        } catch (localError) {
          logger.error("Error loading cart from localStorage:", localError);
        }
        setSyncing(false);
      }
    };

    loadCart();
  }, [isAuthenticated, user?.id]);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    saveCart(state.items);
  }, [state.items]);

  // Sincronizar com backend quando autenticado
  useEffect(() => {
    if (isAuthenticated && user && state.items.length > 0 && !syncing) {
      const syncToBackend = async () => {
        try {
          setSyncing(true);
          // Sincronizar cada item do carrinho com o backend
          for (const item of state.items) {
            try {
              await apiService.cart.addItem({
                product_id: item.id,
                quantity: item.quantity || 1
              });
            } catch (error) {
              logger.warn(`Error syncing cart item ${item.id}:`, error);
            }
          }
        } catch (error) {
          logger.error("Error syncing cart to backend:", error);
        } finally {
          setSyncing(false);
        }
      };

      // Debounce para evitar muitas requisições
      const timeoutId = setTimeout(syncToBackend, 1000);
      return () => clearTimeout(timeoutId);
    }
  }, [state.items, isAuthenticated, user?.id]);

  const addToCart = async (product, quantity = 1) => {
    // Atualizar estado local imediatamente (otimista)
    dispatch({
      type: "ADD_TO_CART",
      payload: {
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        brand: product.brand,
        quantity,
      },
    });

    // Sincronizar com backend se autenticado
    if (isAuthenticated && user) {
      try {
        await apiService.cart.addItem({
          product_id: product.id,
          quantity: quantity
        });
      } catch (error) {
        logger.error("Error adding item to backend cart:", error);
        // Reverter se falhar (opcional - pode manter otimista)
      }
    }
  };

  const removeFromCart = async (productId) => {
    // Atualizar estado local imediatamente
    dispatch({ type: "REMOVE_FROM_CART", payload: productId });

    // Sincronizar com backend se autenticado
    if (isAuthenticated && user) {
      try {
        // Buscar item_id do backend primeiro (se necessário)
        // Por enquanto, assumimos que productId é o item_id
        await apiService.cart.removeItem(productId);
      } catch (error) {
        logger.error("Error removing item from backend cart:", error);
      }
    }
  };

  const updateQuantity = async (productId, quantity) => {
    // Atualizar estado local imediatamente
    dispatch({ type: "UPDATE_QUANTITY", payload: { id: productId, quantity } });

    // Sincronizar com backend se autenticado
    if (isAuthenticated && user) {
      try {
        await apiService.cart.updateItem(productId, { quantity });
      } catch (error) {
        logger.error("Error updating item quantity in backend cart:", error);
      }
    }
  };

  const clearCart = async () => {
    // Atualizar estado local imediatamente
    dispatch({ type: "CLEAR_CART" });

    // Sincronizar com backend se autenticado
    if (isAuthenticated && user) {
      try {
        await apiService.cart.clearCart();
      } catch (error) {
        logger.error("Error clearing backend cart:", error);
      }
    }
  };

  const openCart = () => {
    dispatch({ type: "SET_CART_OPEN", payload: true });
  };

  const closeCart = () => {
    dispatch({ type: "SET_CART_OPEN", payload: false });
  };

  const getTotalItems = () => {
    return state.items.reduce((total, item) => total + item.quantity, 0);
  };

  const getTotalPrice = () => {
    return state.items.reduce(
      (total, item) => total + item.price * item.quantity,
      0,
    );
  };

  const value = {
    items: state.items,
    isOpen: state.isOpen,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    openCart,
    closeCart,
    getTotalItems,
    getTotalPrice,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};
