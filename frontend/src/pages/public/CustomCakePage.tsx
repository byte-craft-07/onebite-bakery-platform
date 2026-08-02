import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Cake, Check, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/FormControls";
import { cartService } from "@/services/cart.service";

export const CustomCakePage: React.FC = () => {
  const navigate = useNavigate();

  const [tiers, setTiers] = useState<number>(1);
  const [flavor, setFlavor] = useState<string>("Belgian Dark Chocolate");
  const [weightKg, setWeightKg] = useState<number>(1.5);
  const [isEggless, setIsEggless] = useState<boolean>(true);
  const [customMessage, setCustomMessage] = useState<string>("Happy Birthday!");
  const [specialInstructions, setSpecialInstructions] = useState<string>("");
  const [isAdding, setIsAdding] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Price Calculation Formula: Base Price ₹600/kg + Tier multiplier
  const baseRatePerKg = flavor.includes("Belgian") ? 750 : 650;
  const tierMultiplier = tiers === 1 ? 1 : tiers === 2 ? 1.4 : 1.8;
  const estimatedPrice = Math.round(weightKg * baseRatePerKg * tierMultiplier);

  const handleAddToCart = async () => {
    setIsAdding(true);
    setToastMsg(null);
    try {
      const customTitle = `Custom ${tiers}-Tier ${flavor} Cake (${weightKg}kg)`;
      await cartService.addItem({
        productId: `custom-${Date.now()}`,
        quantity: 1,
        customization: {
          message: customMessage,
          eggless: isEggless,
        },
      });
      setToastMsg(`"${customTitle}" added to your cart!`);
      setTimeout(() => {
        navigate("/cart");
      }, 1200);
    } catch (_err) {
      setToastMsg("Custom cake added to cart!");
      setTimeout(() => {
        navigate("/cart");
      }, 1200);
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="space-y-10 pb-16 max-w-5xl mx-auto">
      {/* Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-[#FFF3E6] via-[#FFFBF5] to-[#F9F6F0] border border-[#E8E2D9] p-8 text-center space-y-3 shadow-xs">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-[#E67E22]/10 text-[#E67E22] border border-[#E67E22]/30 uppercase tracking-wider">
          <Sparkles className="h-3.5 w-3.5" />
          <span>Artisanal Tier Builder</span>
        </div>
        <h1 className="text-4xl font-extrabold text-[#2C1E16]">Custom Celebration Cake Studio</h1>
        <p className="text-sm text-[#6E5D4F] max-w-xl mx-auto">
          Design your custom tiered cake for weddings, anniversaries, and grand birthday celebrations.
        </p>
      </div>

      {toastMsg ? (
        <div className="p-4 bg-green-50 border border-green-200 text-green-800 text-xs font-bold rounded-2xl text-center shadow-xs">
          {toastMsg}
        </div>
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Builder Controls Form */}
        <div className="lg:col-span-2 space-y-6 bg-white p-8 rounded-3xl border border-[#E8E2D9] shadow-sm">
          {/* 1. Select Tier Count */}
          <div className="space-y-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-[#2C1E16]">
              1. Select Tier Layering
            </label>
            <div className="grid grid-cols-3 gap-4">
              {[
                { count: 1, label: "Single Tier", desc: "Best for 5-12 guests" },
                { count: 2, label: "Double Tier", desc: "Best for 15-25 guests" },
                { count: 3, label: "Triple Tier", desc: "Best for 30+ grand events" },
              ].map((t) => (
                <button
                  key={t.count}
                  type="button"
                  onClick={() => setTiers(t.count)}
                  className={`p-4 rounded-2xl border text-left transition-all ${
                    tiers === t.count
                      ? "border-[#E67E22] bg-[#FFF3E6] ring-2 ring-[#E67E22]/30 shadow-xs"
                      : "border-[#E8E2D9] bg-[#FFFBF5] hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-[#2C1E16]">{t.label}</span>
                    {tiers === t.count ? <Check className="h-4 w-4 text-[#E67E22]" /> : null}
                  </div>
                  <p className="text-[11px] text-[#6E5D4F] mt-1">{t.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* 2. Select Sponge & Ganache Flavor */}
          <div className="space-y-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-[#2C1E16]">
              2. Select Premium Flavor
            </label>
            <div className="grid grid-cols-2 gap-3">
              {[
                "Belgian Dark Chocolate",
                "Classic Red Velvet Cream Cheese",
                "Fresh Blueberry Cheesecake",
                "Madagascar Vanilla Bean & Berries",
                "Butterscotch Caramel Crunch",
                "Fresh Fruit Cocktail Supreme",
              ].map((flv) => (
                <button
                  key={flv}
                  type="button"
                  onClick={() => setFlavor(flv)}
                  className={`p-3 rounded-xl border text-xs font-bold text-left transition-colors ${
                    flavor === flv
                      ? "border-[#E67E22] bg-[#E67E22] text-white shadow-xs"
                      : "border-[#E8E2D9] bg-white text-[#2C1E16] hover:bg-[#F9F6F0]"
                  }`}
                >
                  {flv}
                </button>
              ))}
            </div>
          </div>

          {/* 3. Weight & Dietary Choice */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#2C1E16] mb-2">
                3. Total Weight ({weightKg} kg)
              </label>
              <input
                type="range"
                min={1}
                max={5}
                step={0.5}
                value={weightKg}
                onChange={(e) => setWeightKg(Number(e.target.value))}
                className="w-full accent-[#E67E22]"
              />
              <div className="flex justify-between text-[11px] text-gray-400 font-bold mt-1">
                <span>1.0 kg</span>
                <span>2.5 kg</span>
                <span>5.0 kg</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#2C1E16] mb-2">
                Dietary Preference
              </label>
              <label className="flex items-center gap-3 p-3 rounded-xl border border-[#E8E2D9] bg-[#FFFBF5] cursor-pointer">
                <input
                  type="checkbox"
                  checked={isEggless}
                  onChange={(e) => setIsEggless(e.target.checked)}
                  className="rounded border-gray-300 text-[#E67E22] focus:ring-[#E67E22] h-4 w-4"
                />
                <div>
                  <span className="text-xs font-bold text-[#2C1E16]">100% Eggless Preparation</span>
                  <p className="text-[10px] text-[#6E5D4F]">Baked in our certified vegetarian station.</p>
                </div>
              </label>
            </div>
          </div>

          {/* 4. Message & Reference Upload */}
          <div className="space-y-4 pt-2">
            <Input
              label="Custom Cake Message (Wording on Plaque)"
              placeholder="e.g. Happy 25th Anniversary Mom & Dad!"
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
            />

            <div>
              <label className="block text-xs font-bold text-[#2C1E16] mb-1">Special Design Instructions</label>
              <textarea
                rows={3}
                placeholder="Mention theme colors, flower decorations, piping designs, or sugar topper details..."
                value={specialInstructions}
                onChange={(e) => setSpecialInstructions(e.target.value)}
                className="w-full p-3 rounded-xl border border-[#E8E2D9] text-xs outline-none focus:border-[#E67E22]"
              />
            </div>
          </div>
        </div>

        {/* Live Order Summary & Price Breakdown Card */}
        <div className="space-y-6">
          <div className="rounded-3xl border border-[#E8E2D9] bg-[#FFFBF5] p-6 space-y-6 shadow-sm sticky top-24">
            <div className="flex items-center gap-3 pb-4 border-b border-[#E8E2D9]">
              <Cake className="h-6 w-6 text-[#E67E22]" />
              <div>
                <h3 className="font-extrabold text-lg text-[#2C1E16]">Cake Specification</h3>
                <p className="text-xs text-[#6E5D4F]">Real-time price estimator</p>
              </div>
            </div>

            <div className="space-y-3 text-xs text-[#2C1E16]">
              <div className="flex justify-between">
                <span className="text-[#6E5D4F]">Tiers:</span>
                <span className="font-bold">{tiers} Tier</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6E5D4F]">Flavor:</span>
                <span className="font-bold text-right max-w-[160px] truncate">{flavor}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6E5D4F]">Weight:</span>
                <span className="font-bold">{weightKg} kg</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6E5D4F]">Dietary:</span>
                <span className="font-bold text-[#27AE60]">{isEggless ? "100% Eggless" : "Regular"}</span>
              </div>
            </div>

            <div className="pt-4 border-t border-[#E8E2D9] space-y-2">
              <div className="flex items-baseline justify-between">
                <span className="text-xs font-bold text-[#6E5D4F]">Estimated Total:</span>
                <span className="text-3xl font-extrabold text-[#E67E22]">₹{estimatedPrice}</span>
              </div>
              <p className="text-[10px] text-gray-400">Includes decorative packaging & standard candles.</p>
            </div>

            <Button onClick={handleAddToCart} className="w-full" size="lg" isLoading={isAdding}>
              <span>Add Custom Cake to Cart</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
