import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ShoppingBag } from "lucide-react";

import { CartItemCard } from "@/components/shopping/CartItemCard";
import { Button } from "@/components/ui/Button";
import { Card, EmptyState, Skeleton } from "@/components/ui/DisplayComponents";
import { cartService, type CartResponse } from "@/services/cart.service";

export const CartPage: React.FC = () => {
  const [cart, setCart] = useState<CartResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCart = async () => {
    try {
      setIsLoading(true);
      const res = await cartService.getCart();
      setCart(res);
    } catch (_err) {
      setCart(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, []);

  const handleUpdateQuantity = async (itemId: string, newQty: number) => {
    if (newQty <= 0) {
      handleRemoveItem(itemId);
      return;
    }
    try {
      const updated = await cartService.updateQuantity(itemId, newQty);
      setCart(updated);
    } catch (_err) {
      // Ignore
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    try {
      const updated = await cartService.removeItem(itemId);
      setCart(updated);
    } catch (_err) {
      // Ignore
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto py-10">
        <Skeleton className="h-10 w-48 rounded-xl" />
        <Skeleton className="h-24 w-full rounded-2xl" />
        <Skeleton className="h-24 w-full rounded-2xl" />
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="py-16 max-w-2xl mx-auto text-center space-y-4">
        <EmptyState
          title="Your Shopping Cart is Empty"
          description="Explore our artisanal cakes, pastries, and freshly baked breads."
          action={
            <Link to="/products">
              <Button>
                <span>Browse Products</span>
                <ArrowRight className="h-4 w-4 ml-1.5" />
              </Button>
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-16 max-w-5xl mx-auto">
      <div className="flex items-center justify-between border-b border-[#E8E2D9] pb-4">
        <div className="flex items-center gap-3">
          <ShoppingBag className="h-6 w-6 text-[#E67E22]" />
          <h1 className="text-2xl font-bold text-[#2C1E16]">Your Shopping Cart ({cart.itemCount} Items)</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Cart Item List */}
        <div className="lg:col-span-2 space-y-4">
          {cart.items.map((item) => (
            <CartItemCard
              key={item.id}
              item={item}
              onUpdateQuantity={handleUpdateQuantity}
              onRemove={handleRemoveItem}
            />
          ))}
        </div>

        {/* Cart Summary */}
        <Card className="space-y-4 bg-[#FFFBF5]">
          <h3 className="text-lg font-bold text-[#2C1E16] border-b border-[#E8E2D9] pb-3">Subtotal Summary</h3>
          <div className="flex justify-between items-baseline text-sm text-[#6E5D4F]">
            <span>Items Subtotal</span>
            <span className="text-xl font-extrabold text-[#2C1E16]">₹{cart.subtotal}</span>
          </div>

          <p className="text-xs text-gray-400">Taxes and delivery fees calculated during checkout preview.</p>

          <Link to="/checkout" className="block pt-2">
            <Button className="w-full">
              <span>Proceed to Checkout</span>
              <ArrowRight className="h-4 w-4 ml-1.5" />
            </Button>
          </Link>
        </Card>
      </div>
    </div>
  );
};
