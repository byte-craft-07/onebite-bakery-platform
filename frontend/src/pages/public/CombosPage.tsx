import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Check, Gift, ShoppingBag, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { MOCK_COMBOS } from "@/data/mockData";
import { cartService } from "@/services/cart.service";
import { comboService, type Combo } from "@/services/combo.service";
import { toast } from "@/contexts/toast.context";
import { useAuth } from "@/contexts/auth.context";

export const CombosPage: React.FC = () => {
  const { currentLocation } = useAuth();
  const navigate = useNavigate();
  const [addingId, setAddingId] = useState<string | null>(null);
  const [combos, setCombos] = useState<Combo[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchCombos = async () => {
      try {
        const data = await comboService.getCombos();
        if (data && data.length > 0) {
          setCombos(data);
        } else {
          setCombos(MOCK_COMBOS as any);
        }
      } catch (_err) {
        setCombos(MOCK_COMBOS as any);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCombos();
  }, []);

  const handleAddCombo = async (combo: Combo) => {
    setAddingId(combo.id);
    try {
      await cartService.addItem({
        productId: combo.id,
        quantity: 1,
        productDetails: {
          name: combo.title,
          price: combo.price,
          mainImage: combo.image,
          slug: combo.slug || combo.id,
        },
      });
      toast.add("Celebration Combo Added!", `"${combo.title}" (₹${combo.price}) added to cart.`, {
        image: combo.image,
        action: {
          label: "View Cart",
          onClick: () => navigate("/cart"),
        },
      });
      setTimeout(() => {
        navigate("/cart");
      }, 900);
    } catch (_err) {
      toast.add("Combo Added", `"${combo.title}" added to cart.`);
      setTimeout(() => {
        navigate("/cart");
      }, 900);
    } finally {
      setAddingId(null);
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Top Back Link */}
      <Link
        to="/products"
        className="inline-flex items-center gap-2 text-sm font-semibold text-[#7A6E65] hover:text-[#596B58] transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Back to Products</span>
      </Link>

      {/* Header */}
      <div className="rounded-3xl bg-[#FFF8EC] border border-[#E5DEC9] p-8 sm:p-10 text-center space-y-3 shadow-xs">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-[#596B58]/10 text-[#596B58] border border-[#596B58]/30 uppercase tracking-wider">
          <Gift className="h-3.5 w-3.5" />
          <span>Value Celebration Hampers</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#3B302B]">Special Celebration Combos</h1>
        <p className="text-sm text-[#7A6E65] max-w-xl mx-auto">
          Curated party hampers bundling cakes, macarons, tarts, and sourdough breads with unbeatable savings.
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {[1, 2, 3, 4].map((n) => (
            <div
              key={n}
              className="rounded-3xl border border-[#E5DEC9] bg-white p-6 shadow-sm space-y-4 animate-pulse"
            >
              <div className="aspect-16/9 rounded-2xl bg-gray-200" />
              <div className="h-6 w-3/4 bg-gray-200 rounded" />
              <div className="h-4 w-1/2 bg-gray-200 rounded" />
              <div className="space-y-2 pt-2">
                <div className="h-4 w-full bg-gray-100 rounded" />
                <div className="h-4 w-5/6 bg-gray-100 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : combos.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-[#E5DEC9] space-y-3">
          <Gift className="h-10 w-10 text-gray-300 mx-auto" />
          <h3 className="text-lg font-bold text-[#3B302B]">No Combos Available</h3>
          <p className="text-xs text-[#7A6E65]">Please check back soon for fresh celebration packages.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {combos.map((combo) => {
            const discountPct =
              combo.originalPrice && combo.originalPrice > combo.price
                ? Math.round(((combo.originalPrice - combo.price) / combo.originalPrice) * 100)
                : 0;

            return (
              <div
                key={combo.id}
                className="rounded-3xl border border-[#E5DEC9] bg-white p-6 shadow-md flex flex-col justify-between space-y-6 hover:shadow-lg transition-all group"
              >
                <div className="space-y-4">
                  {/* Image with optional badge */}
                  <div className="aspect-16/9 rounded-2xl overflow-hidden bg-[#FFF8EC] relative">
                    <img
                      src={combo.image}
                      alt={combo.title}
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {combo.badge && (
                      <div className="absolute top-3 left-3 bg-[#596B58] text-white text-[11px] font-extrabold px-3 py-1 rounded-full shadow-md">
                        {combo.badge}
                      </div>
                    )}
                    {discountPct > 0 && (
                      <div className="absolute top-3 right-3 bg-green-600 text-white text-[11px] font-extrabold px-2.5 py-1 rounded-full shadow-md">
                        {discountPct}% OFF
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-xl font-extrabold text-[#3B302B]">{combo.title}</h3>
                    {combo.description && (
                      <p className="text-xs text-[#7A6E65] leading-relaxed">{combo.description}</p>
                    )}
                    <p className="text-xs font-bold uppercase tracking-wider text-[#596B58] pt-1">
                      Items Included in Hamper:
                    </p>
                    <ul className="space-y-2 text-xs text-[#7A6E65]">
                      {combo.items && combo.items.map((item, idx) => (
                        <li key={idx} className="flex items-center gap-2.5">
                          <div className="p-1 rounded-full bg-green-100 text-green-700 shrink-0">
                            <Check className="h-3 w-3" />
                          </div>
                          <span className="font-medium">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-[#E5DEC9]">
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-extrabold text-[#3B302B]">₹{combo.price}</span>
                    {combo.originalPrice && combo.originalPrice > combo.price && (
                      <span className="text-xs text-gray-400 line-through">₹{combo.originalPrice}</span>
                    )}
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
            );
          })}
        </div>
      )}
    </div>
  );
};
