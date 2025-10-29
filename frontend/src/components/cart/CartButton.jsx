import React from 'react';
import { Button } from '@/components/Ui/button';
import { Badge } from '@/components/Ui/badge';
import { useCart } from '../../contexts/CartContext';
import { ShoppingCart } from 'lucide-react';

const CartButton = () => {
  const { openCart, getTotalItems } = useCart();
  const totalItems = getTotalItems();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={openCart}
      className="relative"
    >
      <ShoppingCart className="h-5 w-5" />
      {totalItems > 0 && (
        <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs">
          {totalItems > 99 ? '99+' : totalItems}
        </Badge>
      )}
    </Button>
  );
};

export default CartButton;