import { useState, useEffect, useCallback } from "react";
import logger from "@/utils/logger";
import { toast } from "sonner";
import { getAuthToken, removeAuthToken } from "@/utils/storage";
import apiClient from "@/services/apiClient";

/**
 * Hook para gerenciar carrinho de compras
 *
 * @returns {Object} Objeto com estado e métodos do carrinho
 * @property {Array} cart - Lista de itens no carrinho
 * @property {Number} total - Valor total do carrinho
 * @property {Number} itemCount - Quantidade de itens
 * @property {Boolean} loading - Estado de carregamento
 * @property {Function} addItem - Adiciona item ao carrinho
 * @property {Function} updateItem - Atualiza quantidade de item
 * @property {Function} removeItem - Remove item do carrinho
 * @property {Function} clearCart - Limpa todo o carrinho
 * @property {Function} refreshCart - Recarrega dados do carrinho
 */
export const useCart = () => {
  const [cart, setCart] = useState([]);
  const [total, setTotal] = useState(0);
  const [itemCount, setItemCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /**
   * Busca carrinho do backend
   */
  const fetchCart = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      if (!getAuthToken()) {
        setCart([]);
        setTotal(0);
        setItemCount(0);
        setLoading(false);
        return;
      }

      const data = await apiClient.getCart();
      setCart(data.items || data.data?.items || []);
      setTotal(data.total || data.data?.total || 0);
      setItemCount(data.item_count || data.data?.item_count || 0);
    } catch (err) {
      // Se for 401, limpar tokens
      if (err.message?.includes('401') || err.message?.includes('Unauthorized')) {
        removeAuthToken();
        setCart([]);
        setTotal(0);
        setItemCount(0);
        return;
      }
      logger.error("Erro ao buscar carrinho:", err);
      setError(err.message);
      toast.error("Erro ao carregar carrinho");
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Adiciona item ao carrinho
   *
   * @param {String} productId - ID do produto
   * @param {Number} quantity - Quantidade (default: 1)
   * @returns {Promise<Boolean>} True se sucesso, False se erro
   */
  const addItem = async (productId, quantity = 1) => {
    try {
      if (!getAuthToken()) {
        toast.error("Você precisa estar logado para adicionar ao carrinho");
        return false;
      }

      const data = await apiClient.addToCart(productId, quantity);
      toast.success(data.message || "Produto adicionado ao carrinho");
      await fetchCart(); // Recarrega carrinho
      return true;
    } catch (err) {
      logger.error("Erro ao adicionar ao carrinho:", err);
      toast.error(err.message || "Erro ao adicionar produto ao carrinho");
      return false;
    }
  };

  /**
   * Atualiza quantidade de item no carrinho
   *
   * @param {String} itemId - ID do item no carrinho
   * @param {Number} quantity - Nova quantidade (0 = remove)
   * @returns {Promise<Boolean>} True se sucesso, False se erro
   */
  const updateItem = async (itemId, quantity) => {
    try {
      if (!getAuthToken()) {
        toast.error("Você precisa estar logado");
        return false;
      }

      const data = await apiClient.updateCartItem(itemId, quantity);
      if (quantity === 0) {
        toast.success("Item removido do carrinho");
      } else {
        toast.success(data.message || "Quantidade atualizada");
      }
      await fetchCart(); // Recarrega carrinho
      return true;
    } catch (err) {
      logger.error("Erro ao atualizar item:", err);
      toast.error(err.message || "Erro ao atualizar quantidade");
      return false;
    }
  };

  /**
   * Remove item do carrinho
   *
   * @param {String} itemId - ID do item no carrinho
   * @returns {Promise<Boolean>} True se sucesso, False se erro
   */
  const removeItem = async (itemId) => {
    try {
      if (!getAuthToken()) {
        toast.error("Você precisa estar logado");
        return false;
      }

      const data = await apiClient.removeFromCart(itemId);
      toast.success(data.message || "Item removido do carrinho");
      await fetchCart(); // Recarrega carrinho
      return true;
    } catch (err) {
      logger.error("Erro ao remover item:", err);
      toast.error(err.message || "Erro ao remover item do carrinho");
      return false;
    }
  };

  /**
   * Limpa todo o carrinho
   *
   * @returns {Promise<Boolean>} True se sucesso, False se erro
   */
  const clearCart = async () => {
    try {
      if (!getAuthToken()) {
        toast.error("Você precisa estar logado");
        return false;
      }

      // apiClient não tem método clearCart, usar request direto
      await apiClient.request("/cart", { method: "DELETE" });
      toast.success("Carrinho limpo");
      setCart([]);
      setTotal(0);
      setItemCount(0);
      return true;
    } catch (err) {
      logger.error("Erro ao limpar carrinho:", err);
      toast.error(err.message || "Erro ao limpar carrinho");
      return false;
    }
  };

  /**
   * Incrementa quantidade de um item
   *
   * @param {String} itemId - ID do item
   * @returns {Promise<Boolean>}
   */
  const incrementItem = async (itemId) => {
    const item = cart.find((i) => i.id === itemId);
    if (!item) return false;

    const newQuantity = item.quantity + 1;

    // Verificar estoque
    if (newQuantity > item.stock_quantity) {
      toast.error("Estoque insuficiente");
      return false;
    }

    return await updateItem(itemId, newQuantity);
  };

  /**
   * Decrementa quantidade de um item
   *
   * @param {String} itemId - ID do item
   * @returns {Promise<Boolean>}
   */
  const decrementItem = async (itemId) => {
    const item = cart.find((i) => i.id === itemId);
    if (!item) return false;

    const newQuantity = item.quantity - 1;

    if (newQuantity <= 0) {
      return await removeItem(itemId);
    }

    return await updateItem(itemId, newQuantity);
  };

  /**
   * Verifica se um produto está no carrinho
   *
   * @param {String} productId - ID do produto
   * @returns {Boolean}
   */
  const isInCart = (productId) => {
    return cart.some((item) => item.product_id === productId);
  };

  /**
   * Retorna quantidade de um produto no carrinho
   *
   * @param {String} productId - ID do produto
   * @returns {Number}
   */
  const getItemQuantity = (productId) => {
    const item = cart.find((i) => i.product_id === productId);
    return item ? item.quantity : 0;
  };

  /**
   * Calcula subtotal (total sem frete)
   *
   * @returns {Number}
   */
  const getSubtotal = () => {
    return total;
  };

  /**
   * Calcula valor do frete
   * Frete grátis acima de R$ 200
   *
   * @returns {Number}
   */
  const getShipping = () => {
    return total >= 200 ? 0 : 15.0;
  };

  /**
   * Calcula total com frete
   *
   * @returns {Number}
   */
  const getTotalWithShipping = () => {
    return total + getShipping();
  };

  // Carregar carrinho ao montar
  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  return {
    // Estado
    cart,
    total,
    itemCount,
    loading,
    error,

    // Métodos principais
    addItem,
    updateItem,
    removeItem,
    clearCart,
    refreshCart: fetchCart,

    // Métodos auxiliares
    incrementItem,
    decrementItem,
    isInCart,
    getItemQuantity,

    // Cálculos
    getSubtotal,
    getShipping,
    getTotalWithShipping,
  };
};

export default useCart;
