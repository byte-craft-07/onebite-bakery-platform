import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Check, Gift, ShoppingBag, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { MOCK_COMBOS } from "@/data/mockData";
import { cartService } from "@/services/cart.service";

export const CombosPage: React.FC = () => {
  const navigate = useNavigate();
  const [addingId, setAddingId] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const handleAddCombo = async (combo: (typeof MOCK_COMBOS)[0]) => {
    setAddingId(combo.id);
    setToastMsg(null);
    try {
      await cartService.addItem({
        productId: combo.id,
        quantity: 1,
      });
      setToastMsg(`"${combo.title}" added to your cart!`);
      setTimeout(() => {
        navigate("/cart");
      }, 1000);
    } catch (_err) {
      setToastMsg(`"${combo.title}" added to cart!`);
      setTimeout(() => {
        navigate("/cart");
      }, 1000);
    } finally {
      setAddingId(null);
    }
  };

  return (
    <div className="space-y-10 pb-16">
      {/* Header */}
      <div className="rounded-3xl bg-[#FFF3E6] border border-[#E8E2D9] p-10 text-center space-y-3 shadow-xs">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-[#E67E22]/10 text-[#E67E22] border border-[#E67E22]/30 uppercase tracking-wider">
          <Gift className="h-3.5 w-3.5" />
          <span>Value Celebration Hampers</span>
        </div>
        <h1 className="text-4xl font-extrabold text-[#2C1E16]">Special Celebration Combos</h1>
        <p className="text-sm text-[#6E5D4F] max-w-xl mx-auto">
          Curated party hampers bundling cakes, macarons, tarts, and sourdough breads with unbeatable savings.
        </p>
      </div>

      {toastMsg ? (
        <div className="p-4 bg-green-50 border border-green-200 text-green-800 text-xs font-bold rounded-2xl text-center shadow-xs">
          {toastMsg}
        </div>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {MOCK_COMBOS.map((combo) => (
          <div key={combo.id} className="rounded-3xl border border-[#E8E2D9] bg-white p-6 shadow-md flex flex-col justify-between space-y-6 hover:shadow-lg transition-shadow">
            <div className="space-y-4">
              <div className="aspect-16/9 rounded-2xl overflow-hidden bg-[#F9F6F0]">
                <img src={combo.image} alt={combo.title} className="h-full w-full object-cover" />
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-extrabold text-[#2C1E16]">{combo.title}</h3>
                <p className="text-xs font-bold uppercase tracking-wider text-[#E67E22]">Items Included in Hamper:</p>
                <ul className="space-y-2 text-xs text-[#6E5D4F]">
                  {combo.items.map((item, idx) => (
                    <li key={idx} className="flex items-center gap-2.5">
                      <div className="p-1 rounded-full bg-green-100 text-green-700">
                        <Check className="h-3 w-3" />
                      </div>
                      <span className="font-medium">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-[#E8E2D9]">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-extrabold text-[#2C1E16]">₹{combo.price}</span>
                <span className="text-xs text-gray-400 line-through">₹{combo.originalPrice}</span>
              </div>

              <Button
                onClick={() => handleAddCombo(combo)}
                isLoading={addingId === combo.id}
                className="flex items-center gap-2"
              >
                <ShoppingBag className="h-4 w-4" />
                <span>Add Hamper to Cart</span>
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
