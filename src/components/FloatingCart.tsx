import React from 'react';
import { ShoppingCart, Plus, Minus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useCartStore } from '@/store/cartStore';

const FloatingCart = () => {
  const { items, getTotalItems, getTotalPrice, updateQuantity } = useCartStore();
  const totalItems = getTotalItems();
  const totalPrice = getTotalPrice();

  if (totalItems === 0) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:w-80">
      <Card className="shadow-card-hover border-0 bg-background/95 backdrop-blur-md">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <ShoppingCart className="w-5 h-5 text-primary" />
              <span className="font-semibold">{totalItems} items</span>
            </div>
            <span className="font-bold text-primary">₹{totalPrice}</span>
          </div>
          
          {/* Show first 2 items */}
          <div className="space-y-2 mb-3">
            {items.slice(0, 2).map((item) => (
              <div key={item.id} className="flex items-center justify-between text-sm">
                <span className="flex-1 truncate">{item.name}</span>
                <div className="flex items-center space-x-1">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                  >
                    <Minus className="w-3 h-3" />
                  </Button>
                  <span className="min-w-[1.5rem] text-center font-medium">
                    {item.quantity}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                  >
                    <Plus className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))}
            {items.length > 2 && (
              <p className="text-xs text-muted-foreground">
                +{items.length - 2} more items
              </p>
            )}
          </div>
          
          <Link to="/customer/cart">
            <Button variant="cart" className="w-full">
              View Cart
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
};

export default FloatingCart;