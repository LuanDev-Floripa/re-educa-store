import React, { useState } from 'react';
import { X, ShoppingCart, Plus, Minus, Trash2, ArrowRight, PackageX } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCart } from '../../hooks/useCart';
import { Button } from '../Ui/button';
import { Badge } from '../Ui/badge';

/**
 * CartPopup - Mini carrinho dropdown
 * 
 * Exibe resumo do carrinho com:
 * - Lista de itens
 * - Incrementar/decrementar quantidade
 * - Remover itens
 * - Subtotal e frete
 * - Botão para checkout
 */
export const CartPopup = ({ isOpen, onClose }) => {
  const {
    cart,
    total,
    itemCount,
    loading,
    incrementItem,
    decrementItem,
    removeItem,
    getShipping,
    getTotalWithShipping
  } = useCart();

  const [removingItem, setRemovingItem] = useState(null);

  const handleIncrement = async (itemId) => {
    await incrementItem(itemId);
  };

  const handleDecrement = async (itemId) => {
    await decrementItem(itemId);
  };

  const handleRemove = async (itemId) => {
    setRemovingItem(itemId);
    await removeItem(itemId);
    setRemovingItem(null);
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/20 z-40"
        onClick={onClose}
      />

      {/* Popup */}
      <div className="fixed right-0 top-0 h-full w-full md:w-96 bg-white dark:bg-gray-900 shadow-2xl z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              Meu Carrinho
            </h2>
            {itemCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {itemCount} {itemCount === 1 ? 'item' : 'itens'}
              </Badge>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full">
              <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600 mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">Carregando...</p>
            </div>
          ) : cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <PackageX className="w-16 h-16 text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Carrinho vazio
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Adicione produtos para começar suas compras
              </p>
              <Link to="/store">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Ir para Loja
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {cart.map((item) => (
                <div
                  key={item.id}
                  className={`bg-gray-50 dark:bg-gray-800 rounded-lg p-3 transition-all ${
                    removingItem === item.id ? 'opacity-50' : ''
                  }`}
                >
                  <div className="flex gap-3">
                    {/* Image */}
                    <div className="flex-shrink-0">
                      <img
                        src={item.image_url || '/placeholder-product.png'}
                        alt={item.name}
                        className="w-16 h-16 object-cover rounded-md bg-white"
                        onError={(e) => {
                          e.target.src = '/placeholder-product.png';
                        }}
                      />
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {item.name}
                      </h4>
                      <p className="text-sm text-blue-600 font-semibold mt-1">
                        {formatCurrency(item.price)}
                      </p>

                      {/* Quantity Controls */}
                      <div className="flex items-center gap-2 mt-2">
                        <button
                          onClick={() => handleDecrement(item.id)}
                          disabled={removingItem === item.id}
                          className="p-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          <Minus className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                        </button>

                        <span className="px-3 py-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-sm font-medium text-gray-900 dark:text-white min-w-[40px] text-center">
                          {item.quantity}
                        </span>

                        <button
                          onClick={() => handleIncrement(item.id)}
                          disabled={removingItem === item.id || item.quantity >= item.stock_quantity}
                          className="p-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          <Plus className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                        </button>

                        <button
                          onClick={() => handleRemove(item.id)}
                          disabled={removingItem === item.id}
                          className="ml-auto p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors disabled:opacity-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Stock warning */}
                      {item.stock_quantity < 10 && (
                        <p className="text-xs text-orange-600 mt-1">
                          Apenas {item.stock_quantity} em estoque
                        </p>
                      )}
                    </div>

                    {/* Item Total */}
                    <div className="text-right">
                      <p className="text-sm font-bold text-gray-900 dark:text-white">
                        {formatCurrency(item.total)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {cart.length > 0 && (
          <div className="border-t border-gray-200 dark:border-gray-700 p-4 space-y-3 bg-gray-50 dark:bg-gray-800">
            {/* Subtotal */}
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {formatCurrency(total)}
              </span>
            </div>

            {/* Shipping */}
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Frete</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {getShipping() === 0 ? (
                  <span className="text-green-600">Grátis</span>
                ) : (
                  formatCurrency(getShipping())
                )}
              </span>
            </div>

            {/* Free shipping progress */}
            {total < 200 && (
              <div className="text-xs text-gray-600 dark:text-gray-400">
                Faltam {formatCurrency(200 - total)} para frete grátis
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mt-1">
                  <div 
                    className="bg-green-600 h-1.5 rounded-full transition-all"
                    style={{ width: `${(total / 200) * 100}%` }}
                  ></div>
                </div>
              </div>
            )}

            {/* Divider */}
            <div className="border-t border-gray-300 dark:border-gray-600 pt-3">
              <div className="flex justify-between text-base font-bold">
                <span className="text-gray-900 dark:text-white">Total</span>
                <span className="text-blue-600">
                  {formatCurrency(getTotalWithShipping())}
                </span>
              </div>
            </div>

            {/* Checkout Button */}
            <Link to="/checkout" onClick={onClose}>
              <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 text-base font-semibold">
                Finalizar Compra
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>

            {/* Continue Shopping */}
            <Link to="/store" onClick={onClose}>
              <button className="w-full text-center text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 py-2 transition-colors">
                Continuar Comprando
              </button>
            </Link>
          </div>
        )}
      </div>
    </>
  );
};

export default CartPopup;
