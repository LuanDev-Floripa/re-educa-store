/**
 * CartButton Component - RE-EDUCA Store
 * 
 * Bot?o do carrinho de compras com badge de contagem de itens.
 * 
 * Funcionalidades:
 * - Exibe ?cone de carrinho
 * - Mostra badge com quantidade de itens (at? 99+)
 * - Abre o popup do carrinho ao clicar
 * - Responsivo e adapt?vel ao tema
 * 
 * @component
 * @returns {JSX.Element} Bot?o do carrinho com badge
 */
import React, { memo } from "react";
import { Button } from "@/components/Ui/button";
import { Badge } from "@/components/Ui/badge";
import { useCart } from "../../hooks/useCart";
import { ShoppingCart } from "lucide-react";
import { useNavigate } from "react-router-dom";

const CartButton = () => {
  const navigate = useNavigate();
  const { cart } = useCart();
  const totalItems = cart?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0;
  
  const openCart = () => {
    navigate("/cart");
  };

  return (
    <Button variant="ghost" size="icon" onClick={openCart} className="relative">
      <ShoppingCart className="h-5 w-5" />
      {totalItems > 0 && (
        <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs">
          {totalItems > 99 ? "99+" : totalItems}
        </Badge>
      )}
    </Button>
  );
};

// Memoize para evitar re-renderiza??es desnecess?rias
// CartButton ? usado no header e pode renderizar frequentemente
export default memo(CartButton);
