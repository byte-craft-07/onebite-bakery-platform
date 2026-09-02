import React from "react";
import { Link } from "react-router-dom";
import { Cake, Home, ShoppingBag, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/Button";

export const NotFoundPage: React.FC = () => {
  return (
    <div className="py-16 md:py-24 max-w-3xl mx-auto px-6 text-center space-y-8 animate-in fade-in zoom-in-95">
      {/* Decorative Floating Bakery Icon Badge */}
      <div className="relative inline-block">
        <div className="h-28 w-28 rounded-3xl bg-gradient-to-tr from-[#596B58] via-[#F39C12] to-[#495948] text-white flex items-center justify-center shadow-xl mx-auto transform -rotate-3 hover:rotate-0 transition-transform duration-300">
          <Cake className="h-14 w-14 drop-shadow-md" />
        </div>
        <span className="absolute -top-2 -right-2 p-2 rounded-full bg-[#FFF8EC] border border-[#596B58]/30 text-[#596B58] shadow-sm animate-bounce">
          <Sparkles className="h-5 w-5" />
        </span>
      </div>

      {/* 404 Headline */}
      <div className="space-y-3">
        <span className="inline-block px-4 py-1.5 rounded-full text-xs font-extrabold bg-[#FFF8EC] text-[#596B58] border border-[#596B58]/30 uppercase tracking-widest">
          404 Page Not Found
        </span>
        <h1 className="text-4xl md:text-5xl font-extrabold text-[#3B302B] tracking-tight">
          Oops! This Bakery Recipe Is Missing!
        </h1>
        <p className="text-sm md:text-base text-[#7A6E65] max-w-md mx-auto leading-relaxed">
          Looks like the cake or page you were searching for has been freshly eaten or moved to a new baking oven.
        </p>
        <p className="text-xs font-bold text-[#596B58]">
          हर जश्न का पहला निवाला। &bull; Pure Joy in Every Single Bite
        </p>
      </div>

      {/* Bakery Action Buttons */}
      <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
        <Link to="/" className="w-full sm:w-auto">
          <Button size="lg" className="w-full shadow-md">
            <Home className="h-5 w-5 mr-2" />
            <span>Return to Home Page</span>
          </Button>
        </Link>

        <Link to="/products" className="w-full sm:w-auto">
          <Button size="lg" variant="outline" className="w-full border-[#596B58] text-[#596B58] hover:bg-[#FFF8EC]">
            <ShoppingBag className="h-5 w-5 mr-2" />
            <span>Explore Fresh Catalog</span>
          </Button>
        </Link>
      </div>
    </div>
  );
};
