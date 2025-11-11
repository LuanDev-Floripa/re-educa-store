import React, { useState, memo } from "react";
import { ShoppingCart } from "lucide-react";
import { useCart } from "../../hooks/useCart";
import { CartPopup } from "./CartPopup";
import { Badge } from "../Ui/badge";

/**
 * FloatingCartButton - Botão flutuante de carrinho
 *
 * Botão fixo no canto inferior direito que:
 * - Mostra quantidade de itens no badge
 * - Abre o CartPopup ao clicar
 * - Anima ao adicionar item
 */
const FloatingCartButtonComponent = () => {
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const { itemCount, loading } = useCart();
  const [pulse, setPulse] = useState(false);

  // Animar botão quando itemCount muda
  React.useEffect(() => {
    if (itemCount > 0 && !loading) {
      setPulse(true);
      setTimeout(() => setPulse(false), 600);
    }
  }, [itemCount, loading]);

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsPopupOpen(true)}
        className={`fixed bottom-6 right-6 z-30 bg-primary hover:bg-primary/90 text-white rounded-full p-4 shadow-2xl transition-all duration-300 hover:scale-110 ${
          pulse ? "animate-bounce" : ""
        }`}
        aria-label="Abrir carrinho"
      >
        <div className="relative">
          <ShoppingCart className="w-6 h-6" />
          {itemCount > 0 && (
            <Badge className="absolute -top-3 -right-3 bg-destructive text-white border-2 border-white min-w-[24px] h-6 flex items-center justify-center px-1.5 rounded-full text-xs font-bold">
              {itemCount > 99 ? "99+" : itemCount}
            </Badge>
          )}
        </div>
      </button>

      {/* Cart Popup */}
      <CartPopup isOpen={isPopupOpen} onClose={() => setIsPopupOpen(false)} />
    </>
  );
};

// Memoize para evitar re-renderizações desnecessárias
// FloatingCartButton é sempre visível, otimização importante
export const FloatingCartButton = memo(FloatingCartButtonComponent);
export default FloatingCartButton;
