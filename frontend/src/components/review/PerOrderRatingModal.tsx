import React, { useEffect, useState } from "react";
import { Check, CheckCircle2, Heart, PackageCheck, Sparkles, Star, ThumbsUp, X } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { useAuth } from "@/contexts/auth.context";
import { reviewService, type ItemQualityRating } from "@/services/review.service";
import type { OrderDetails, OrderItemDetails } from "@/services/order.service";

export interface PerOrderRatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: OrderDetails | null;
  focusedItemIndex?: number;
}

const QUALITY_TAGS = [
  "🎂 Superb Fresh Taste",
  "🥐 Soft, Fluffy & Fresh",
  "🍫 Rich & Premium Flavor",
  "✨ Beautiful Decoration",
  "🌿 Pure Eggless Quality",
  "📦 Pristine & Safe Packaging",
];

export const PerOrderRatingModal: React.FC<PerOrderRatingModalProps> = ({
  isOpen,
  onClose,
  order,
  focusedItemIndex,
}) => {
  const { user } = useAuth();

  const [customerName, setCustomerName] = useState("");
  const [overallRating, setOverallRating] = useState(5);
  const [deliveryRating, setDeliveryRating] = useState(5);
  const [overallComment, setOverallComment] = useState("");

  // Map of item index to rating state
  const [itemRatings, setItemRatings] = useState<
    Record<
      number,
      {
        qualityRating: number;
        tasteRating: number;
        tags: string[];
        comment: string;
      }
    >
  >({});

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && order) {
      setIsSuccess(false);
      setErrorMsg(null);
      const userEmail = user?.email?.trim().toLowerCase() || "";
      const shrunkEmail = userEmail ? userEmail.split("@")[0] : "";
      setCustomerName(shrunkEmail || user?.name || order.customerName || "Customer");
      setOverallRating(5);
      setDeliveryRating(5);
      setOverallComment("");

      // Initialize ratings from previous ratings or defaults
      const existingRatings = reviewService.getOrderRatingsMap(order.id);
      const initialMap: Record<number, any> = {};

      order.items.forEach((item, idx) => {
        const saved = existingRatings[item.name] || existingRatings[item.id];
        initialMap[idx] = {
          qualityRating: saved ? saved.qualityRating : 5,
          tasteRating: saved ? saved.tasteRating || saved.qualityRating : 5,
          tags: saved && saved.tags ? saved.tags : ["🎂 Superb Fresh Taste"],
          comment: saved ? saved.comment || "" : "",
        };
      });

      setItemRatings(initialMap);
    }
  }, [isOpen, order, user]);

  if (!isOpen || !order) return null;

  const handleItemRatingChange = (idx: number, star: number) => {
    setItemRatings((prev) => ({
      ...prev,
      [idx]: {
        ...prev[idx],
        qualityRating: star,
        tasteRating: star,
      },
    }));
  };

  const handleItemTagToggle = (idx: number, tag: string) => {
    setItemRatings((prev) => {
      const currentTags = prev[idx]?.tags || [];
      const nextTags = currentTags.includes(tag)
        ? currentTags.filter((t) => t !== tag)
        : [...currentTags, tag];

      return {
        ...prev,
        [idx]: {
          ...prev[idx],
          tags: nextTags,
        },
      };
    });
  };

  const handleItemCommentChange = (idx: number, comment: string) => {
    setItemRatings((prev) => ({
      ...prev,
      [idx]: {
        ...prev[idx],
        comment,
      },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const payloadItems: ItemQualityRating[] = order.items.map((item, idx) => {
        const r = itemRatings[idx] || {
          qualityRating: 5,
          tasteRating: 5,
          tags: ["🎂 Superb Fresh Taste"],
          comment: "",
        };

        const itemComment =
          r.comment.trim() ||
          (r.tags && r.tags.length > 0
            ? `${r.tags.join(", ")} - Baked to perfection.`
            : "Super fresh, high quality and delicious taste!");

        return {
          productId: item.productId || item.id,
          productName: item.name,
          rating: r.qualityRating,
          qualityRating: r.qualityRating,
          tasteRating: r.tasteRating,
          tags: r.tags,
          comment: itemComment,
        };
      });

      const userEmail = user?.email?.trim().toLowerCase() || "";
      const shrunkEmail = userEmail ? userEmail.split("@")[0] : "";
      const finalName = customerName.trim() || shrunkEmail || user?.name || "Customer";

      await reviewService.addOrderQualityRating({
        orderId: order.id,
        name: finalName,
        overallRating,
        deliveryRating,
        overallComment: overallComment.trim(),
        items: payloadItems,
      });

      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        onClose();
      }, 1600);
    } catch (_err) {
      setErrorMsg("Failed to submit item ratings. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in">
      <div className="w-full max-w-2xl bg-[#FFF8EC] rounded-3xl shadow-2xl border border-[#E5DEC9] overflow-hidden flex flex-col max-h-[92vh] transition-all">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#E5DEC9] flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-[#FFF8EC] border border-[#596B58]/30 flex items-center justify-center text-[#596B58]">
              <PackageCheck className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-[#3B302B]">
                  Rate Product Quality & Order
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#596B58]/10 text-[#596B58] border border-[#596B58]/30">
                  Order #{order.orderNumber}
                </span>
              </div>
              <p className="text-[11px] text-[#7A6E65]">
                Rate each item in your order to help us ensure high bakery quality!
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-gray-400 hover:text-[#3B302B] hover:bg-[#F7F2E7] transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        {isSuccess ? (
          <div className="p-8 sm:p-12 text-center space-y-4 my-auto animate-in zoom-in">
            <div className="h-16 w-16 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto border-2 border-emerald-300">
              <Check className="h-9 w-9 stroke-[3]" />
            </div>
            <h3 className="text-2xl font-extrabold text-[#3B302B]">Product Ratings Submitted!</h3>
            <p className="text-sm text-[#7A6E65] max-w-md mx-auto">
              Thank you! Your quality ratings for <strong>{order.items.length} item(s)</strong> have been recorded and are now featured live on our Home Page.
            </p>
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#E5DEC9] rounded-full text-xs font-bold text-[#596B58]">
              <Heart className="h-4 w-4 fill-current text-red-500" />
              <span>Onebite Bakery Quality Assurance</span>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-6 overflow-y-auto">
            {errorMsg ? (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-xl">
                {errorMsg}
              </div>
            ) : null}

            {/* Individual Product Quality Rating Cards */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase tracking-wider text-[#3B302B]">
                  📦 Rate Each Item in This Order ({order.items.length}):
                </span>
                <span className="text-[11px] text-[#7A6E65]">Quality & Taste Rating</span>
              </div>

              {order.items.map((item: OrderItemDetails, idx: number) => {
                const currentRating = itemRatings[idx]?.qualityRating || 5;
                const currentTags = itemRatings[idx]?.tags || [];
                const currentComment = itemRatings[idx]?.comment || "";
                const isHighlight = focusedItemIndex === idx;

                return (
                  <div
                    key={item.id || idx}
                    className={`rounded-2xl p-4 border transition-all space-y-3 bg-white shadow-xs ${
                      isHighlight
                        ? "border-[#596B58] ring-2 ring-[#596B58]/20"
                        : "border-[#E5DEC9] hover:border-[#596B58]/40"
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E5DEC9] pb-3">
                      <div>
                        <h4 className="text-sm font-extrabold text-[#3B302B]">{item.name}</h4>
                        <p className="text-[11px] text-[#7A6E65]">Quantity: {item.quantity} • Total: ₹{item.itemTotal}</p>
                      </div>

                      {/* Product Stars */}
                      <div className="flex items-center gap-1.5 bg-[#FFF8EC] px-3 py-1.5 rounded-xl border border-[#E5DEC9]">
                        <span className="text-xs font-bold text-[#7A6E65] mr-1">Quality:</span>
                        <div className="flex text-[#D8BE91]">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => handleItemRatingChange(idx, star)}
                              className="p-0.5 hover:scale-125 transition-transform cursor-pointer focus:outline-none"
                              title={`${star} Star Quality`}
                            >
                              <Star
                                className={`h-5 w-5 ${
                                  star <= currentRating
                                    ? "text-[#D8BE91] fill-[#D8BE91]"
                                    : "text-gray-200 fill-gray-100"
                                }`}
                              />
                            </button>
                          ))}
                        </div>
                        <span className="text-xs font-extrabold text-[#3B302B] ml-1">
                          {currentRating}.0★
                        </span>
                      </div>
                    </div>

                    {/* Quality Highlights Tags */}
                    <div className="space-y-1.5">
                      <span className="text-[11px] font-bold text-[#7A6E65]">
                        Product Highlights & Taste:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {QUALITY_TAGS.map((tag) => {
                          const isSelected = currentTags.includes(tag);
                          return (
                            <button
                              key={tag}
                              type="button"
                              onClick={() => handleItemTagToggle(idx, tag)}
                              className={`text-[11px] px-2.5 py-1 rounded-full border transition-all cursor-pointer font-medium ${
                                isSelected
                                  ? "bg-[#596B58] text-[#FFF8EC] border-[#596B58] shadow-2xs"
                                  : "bg-white text-[#3B302B] border-[#E5DEC9] hover:border-[#596B58]/50 hover:bg-[#FFF8EC]"
                              }`}
                            >
                              {tag}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Item Specific Note */}
                    <input
                      type="text"
                      placeholder={`Optional note on ${item.name} quality, sweetness, cream...`}
                      value={currentComment}
                      onChange={(e) => handleItemCommentChange(idx, e.target.value)}
                      className="w-full h-9 px-3 rounded-xl border border-[#E5DEC9] bg-[#FFF8EC] text-xs text-[#3B302B] outline-none focus:border-[#596B58]"
                    />
                  </div>
                );
              })}
            </div>

            {/* Reviewer Name */}
            <div className="space-y-1.5 bg-white p-4 rounded-2xl border border-[#E5DEC9]">
              <label className="block text-xs font-bold text-[#3B302B]">
                Your Name on Review <span className="text-gray-400 font-normal">(appears on Home Page)</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Rahul Mehta"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full h-10 px-3.5 rounded-xl border border-[#E5DEC9] bg-[#FFF8EC] text-xs text-[#3B302B] outline-none focus:border-[#596B58]"
              />
            </div>

            {/* Live Home Page Sync Notice */}
            <div className="p-3.5 bg-white border border-[#596B58]/30 rounded-2xl flex items-center gap-3">
              <Sparkles className="h-5 w-5 text-[#596B58] shrink-0" />
              <div className="text-xs text-[#3B302B]">
                <strong className="block text-[#596B58] font-extrabold mb-0.5">Live Home Page Publishing</strong>
                Each product quality rating you submit here is verified and showcased in the moving marquee on our Home Page!
              </div>
            </div>

            {/* Actions */}
            <div className="pt-3 flex items-center justify-end gap-3 border-t border-[#E5DEC9]">
              <Button type="button" variant="outline" onClick={onClose} className="text-xs">
                Cancel
              </Button>
              <Button
                type="submit"
                isLoading={isSubmitting}
                className="text-xs flex items-center gap-1.5 shadow-md bg-[#596B58] hover:bg-[#495948] text-[#FFF8EC]"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>Publish All Product Ratings</span>
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
