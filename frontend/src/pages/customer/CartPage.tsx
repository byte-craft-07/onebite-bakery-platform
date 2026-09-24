import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, ShoppingBag } from "lucide-react";

import { CartItemCard } from "@/components/shopping/CartItemCard";
import { Button } from "@/components/ui/Button";
import { Card, EmptyState, Skeleton } from "@/components/ui/DisplayComponents";
import { cartService, type CartResponse } from "@/services/cart.service";
import { useAuth } from "@/contexts/auth.context";
import { toast } from "@/contexts/toast.context";

export const CartPage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [cart, setCart] = useState<CartResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCart = async (showLoader = false) => {
    try {
      if (showLoader) setIsLoading(true);
      const res = await cartService.getCart();
      setCart(res);
    } catch (_err) {
      setCart(null);
    } finally {
      if (showLoader) setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCart(true);

    const handleCartUpdated = () => {
      fetchCart(false);
    };

    window.addEventListener("onebitebakery_cart_updated", handleCartUpdated);
    window.addEventListener("onebitebakery_location_changed", handleCartUpdated);
    return () => {
      window.removeEventListener("onebitebakery_cart_updated", handleCartUpdated);
      window.removeEventListener("onebitebakery_location_changed", handleCartUpdated);
    };
  }, []);

  const handleUpdateQuantity = async (itemId: string, newQty: number) => {
    const item = cart?.items.find((i) => i.id === itemId);
    const itemName = item?.productId.name || "Item";

    if (newQty <= 0) {
      handleRemoveItem(itemId);
      return;
    }
    try {
      const updated = await cartService.updateQuantity(itemId, newQty);
      setCart(updated);
      toast.update("Cart Updated", `Quantity for "${itemName}" updated to ${newQty}.`);
    } catch (_err) {
      toast.error("Update Failed", "Could not update item quantity.");
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    const item = cart?.items.find((i) => i.id === itemId);
    const itemName = item?.productId.name || "Item";

    try {
      const updated = await cartService.removeItem(itemId);
      setCart(updated);
      toast.delete("Item Removed", `"${itemName}" removed from your cart.`);
    } catch (_err) {
      toast.error("Remove Failed", "Could not remove item from cart.");
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto py-10">
        <Skeleton className="h-10 w-48 rounded-xl" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-24 w-full rounded-2xl" />
            <Skeleton className="h-24 w-full rounded-2xl" />
          </div>
          <Skeleton className="h-48 w-full rounded-2xl" />
        </div>
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
    <div className="space-y-6 pb-16 max-w-5xl mx-auto">
      {/* Top Back Link */}
      <Link to="/products" className="inline-flex items-center gap-2 text-sm font-semibold text-[#7A6E65] hover:text-[#596B58] transition-colors">
        <ArrowLeft className="h-4 w-4" />
        <span>Continue Shopping</span>
      </Link>

      <div className="flex items-center justify-between border-b border-[#E5DEC9] pb-4">
        <div className="flex items-center gap-3">
          <ShoppingBag className="h-6 w-6 text-[#596B58]" />
          <h1 className="text-2xl font-bold text-[#3B302B]">Your Shopping Cart ({cart.itemCount} Items)</h1>
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
        <Card className="space-y-4 bg-[#FFF8EC]">
          <h3 className="text-lg font-bold text-[#3B302B] border-b border-[#E5DEC9] pb-3">Subtotal Summary</h3>
          <div className="flex justify-between items-baseline text-sm text-[#7A6E65]">
            <span>Items Subtotal</span>
            <span className="text-xl font-extrabold text-[#3B302B]">₹{cart.subtotal}</span>
          </div>

          <p className="text-xs text-gray-400">Taxes and delivery fees calculated during checkout preview.</p>

          <div className="pt-2">
            <Link
              to={isAuthenticated ? "/checkout" : "/auth/login?redirect=/checkout"}
              className="block"
            >
              <Button className="w-full">
                <span>Proceed to Checkout</span>
                <ArrowRight className="h-4 w-4 ml-1.5" />
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
};
