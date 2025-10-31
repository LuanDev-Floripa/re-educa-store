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
import React from "react";
import { Button } from "@/components/Ui/button";
import { Badge } from "@/components/Ui/badge";
import { useCart } from "../../contexts/CartContext";
import { ShoppingCart } from "lucide-react";

const CartButton = () => {
  const { openCart, getTotalItems } = useCart();
  const totalItems = getTotalItems();

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

export default CartButton;
