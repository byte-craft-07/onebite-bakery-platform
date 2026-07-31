import React, { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Check, Heart, ShieldCheck, ShoppingBag, Star, Truck } from "lucide-react";

import { Badge } from "@/components/ui/DisplayComponents";
import { MOCK_PRODUCTS } from "@/data/mockData";

export const ProductDetailsPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const product = MOCK_PRODUCTS.find((p) => p.slug === slug) || MOCK_PRODUCTS[0];

  const [quantity, setQuantity] = useState(1);
  const [selectedWeight, setSelectedWeight] = useState("500g");

  return (
    <div className="space-y-12 pb-16">
      {/* Back Link */}
      <Link to="/products" className="inline-flex items-center gap-2 text-sm font-semibold text-[#6E5D4F] hover:text-[#E67E22]">
        <ArrowLeft className="h-4 w-4" />
        <span>Back to Products</span>
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
        {/* Product Image */}
        <div className="rounded-3xl overflow-hidden border border-[#E8E2D9] bg-white shadow-lg aspect-4/3">
          <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
        </div>

        {/* Product Info */}
        <div className="space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="primary">{product.category}</Badge>
              {product.isEggless ? <Badge variant="success">100% Eggless</Badge> : null}
            </div>
            <h1 className="text-3xl font-extrabold text-[#2C1E16]">{product.name}</h1>
            <div className="flex items-center gap-2 text-amber-500 text-sm font-bold mt-2">
              <Star className="h-4 w-4 fill-current" />
              <span>{product.rating}</span>
              <span className="text-[#6E5D4F]">({product.reviewCount} customer reviews)</span>
            </div>
          </div>

          <div className="flex items-baseline gap-3 pt-2 border-t border-[#E8E2D9]">
            <span className="text-3xl font-extrabold text-[#2C1E16]">₹{product.price}</span>
            {product.compareAtPrice ? (
              <span className="text-sm text-gray-400 line-through">₹{product.compareAtPrice}</span>
            ) : null}
          </div>

          <p className="text-sm text-[#6E5D4F] leading-relaxed">{product.description}</p>

          {/* Weight Selection */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-[#2C1E16]">
              Select Weight / Portion:
            </label>
            <div className="flex gap-3">
              {["500g", "1kg", "2kg"].map((weight) => (
                <button
                  key={weight}
                  onClick={() => setSelectedWeight(weight)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold border transition-colors ${
                    selectedWeight === weight
                      ? "border-[#E67E22] bg-[#FFF3E6] text-[#E67E22]"
                      : "border-[#E8E2D9] text-[#2C1E16] hover:border-gray-400"
                  }`}
                >
                  {weight}
                </button>
              ))}
            </div>
          </div>

          {/* Quantity Controls & Add Button */}
          <div className="flex items-center gap-4 pt-4">
            <div className="flex items-center border border-[#E8E2D9] rounded-xl bg-white">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="px-3 py-2 text-gray-600 font-bold hover:bg-[#F9F6F0] rounded-l-xl"
              >
                -
              </button>
              <span className="px-4 text-sm font-bold">{quantity}</span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="px-3 py-2 text-gray-600 font-bold hover:bg-[#F9F6F0] rounded-r-xl"
              >
                +
              </button>
            </div>

            <button className="flex-1 h-12 bg-[#E67E22] text-white font-bold rounded-xl hover:bg-[#D35400] transition-colors flex items-center justify-center gap-2 shadow-md">
              <ShoppingBag className="h-5 w-5" />
              <span>Add to Cart</span>
            </button>

            <button className="p-3.5 border border-[#E8E2D9] rounded-xl text-[#2C1E16] hover:text-[#C0392B] transition-colors">
              <Heart className="h-5 w-5" />
            </button>
          </div>

          {/* Delivery & Assurance Details */}
          <div className="pt-6 border-t border-[#E8E2D9] space-y-3 text-xs text-[#6E5D4F]">
            <div className="flex items-center gap-2.5">
              <Truck className="h-4 w-4 text-[#E67E22]" />
              <span>Home delivery available within 3 hours or schedule for pickup.</span>
            </div>
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="h-4 w-4 text-[#27AE60]" />
              <span>100% Quality & Hygiene Guaranteed.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
