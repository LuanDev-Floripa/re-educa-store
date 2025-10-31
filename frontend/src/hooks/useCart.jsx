import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";

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

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:9001";

  /**
   * Busca carrinho do backend
   */
  const fetchCart = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem("token");

      if (!token) {
        setCart([]);
        setTotal(0);
        setItemCount(0);
        setLoading(false);
        return;
      }

      const response = await fetch(`${API_URL}/api/cart`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        setCart(data.items || []);
        setTotal(data.total || 0);
        setItemCount(data.item_count || 0);
      } else if (response.status === 401) {
        // Token inválido ou expirado
        localStorage.removeItem("token");
        setCart([]);
        setTotal(0);
        setItemCount(0);
      } else {
        throw new Error("Erro ao carregar carrinho");
      }
    } catch (err) {
      console.error("Erro ao buscar carrinho:", err);
      setError(err.message);
      toast.error("Erro ao carregar carrinho");
    } finally {
      setLoading(false);
    }
  }, [API_URL]);

  /**
   * Adiciona item ao carrinho
   *
   * @param {String} productId - ID do produto
   * @param {Number} quantity - Quantidade (default: 1)
   * @returns {Promise<Boolean>} True se sucesso, False se erro
   */
  const addItem = async (productId, quantity = 1) => {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        toast.error("Você precisa estar logado para adicionar ao carrinho");
        return false;
      }

      const response = await fetch(`${API_URL}/api/cart/add`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          product_id: productId,
          quantity: quantity,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message || "Produto adicionado ao carrinho");
        await fetchCart(); // Recarrega carrinho
        return true;
      } else {
        toast.error(data.error || "Erro ao adicionar produto");
        return false;
      }
    } catch (err) {
      console.error("Erro ao adicionar ao carrinho:", err);
      toast.error("Erro ao adicionar produto ao carrinho");
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
      const token = localStorage.getItem("token");

      if (!token) {
        toast.error("Você precisa estar logado");
        return false;
      }

      const response = await fetch(`${API_URL}/api/cart/update/${itemId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ quantity }),
      });

      const data = await response.json();

      if (response.ok) {
        if (quantity === 0) {
          toast.success("Item removido do carrinho");
        } else {
          toast.success(data.message || "Quantidade atualizada");
        }
        await fetchCart(); // Recarrega carrinho
        return true;
      } else {
        toast.error(data.error || "Erro ao atualizar quantidade");
        return false;
      }
    } catch (err) {
      console.error("Erro ao atualizar item:", err);
      toast.error("Erro ao atualizar quantidade");
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
      const token = localStorage.getItem("token");

      if (!token) {
        toast.error("Você precisa estar logado");
        return false;
      }

      const response = await fetch(`${API_URL}/api/cart/remove/${itemId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message || "Item removido do carrinho");
        await fetchCart(); // Recarrega carrinho
        return true;
      } else {
        toast.error(data.error || "Erro ao remover item");
        return false;
      }
    } catch (err) {
      console.error("Erro ao remover item:", err);
      toast.error("Erro ao remover item do carrinho");
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
      const token = localStorage.getItem("token");

      if (!token) {
        toast.error("Você precisa estar logado");
        return false;
      }

      const response = await fetch(`${API_URL}/api/cart/clear`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message || "Carrinho limpo");
        setCart([]);
        setTotal(0);
        setItemCount(0);
        return true;
      } else {
        toast.error(data.error || "Erro ao limpar carrinho");
        return false;
      }
    } catch (err) {
      console.error("Erro ao limpar carrinho:", err);
      toast.error("Erro ao limpar carrinho");
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
