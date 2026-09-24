import React, { useEffect, useState } from "react";
import { Check, Heart, Sparkles, Star, ThumbsUp, X } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { useAuth } from "@/contexts/auth.context";
import { reviewService } from "@/services/review.service";

export interface RatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialProductName?: string;
  initialOrderId?: string;
}

const RATING_LABELS: Record<number, { title: string; desc: string; emoji: string }> = {
  1: { title: "Needs Improvement", desc: "Did not meet expectations", emoji: "😞" },
  2: { title: "Fair", desc: "Average taste and delivery", emoji: "😐" },
  3: { title: "Good", desc: "Nice quality and presentation", emoji: "🙂" },
  4: { title: "Very Good", desc: "Fresh, tasty and on-time", emoji: "😊" },
  5: { title: "Exceptional & Delicious!", desc: "Masterpiece taste and top service", emoji: "🤩" },
};

const QUICK_TAGS = [
  "🎂 Super Delicious Taste",
  "🥐 100% Fresh & Soft",
  "⚡ Super Fast Delivery",
  "✨ Beautiful Design",
  "🌿 100% Eggless & Pure",
  "🎁 Perfect Celebration Cake",
];

export const RatingModal: React.FC<RatingModalProps> = ({
  isOpen,
  onClose,
  initialProductName = "",
  initialOrderId = "",
}) => {
  const { user } = useAuth();

  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [name, setName] = useState<string>("");
  const [productName, setProductName] = useState<string>(initialProductName);
  const [comment, setComment] = useState<string>("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setIsSuccess(false);
      setErrorMsg(null);
      setRating(5);
      setHoverRating(null);
      setName(user?.name || (user?.email ? user.email.split("@")[0] : "") || "");
      setProductName(initialProductName);
      setComment("");
      setSelectedTags([]);
    }
  }, [isOpen, initialProductName, user]);

  if (!isOpen) return null;

  const currentDisplayRating = hoverRating || rating;

  const handleTagToggle = (tag: string) => {
    let nextTags: string[];
    if (selectedTags.includes(tag)) {
      nextTags = selectedTags.filter((t) => t !== tag);
    } else {
      nextTags = [...selectedTags, tag];
    }
    setSelectedTags(nextTags);

    const cleanedTag = tag.replace(/^[^\w\s]+/, "").trim();
    if (!comment.includes(cleanedTag)) {
      setComment((prev) => (prev ? `${prev}. ${cleanedTag}` : cleanedTag));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) {
      setErrorMsg("Please write a few words about your experience.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      await reviewService.addReview({
        name: name.trim() || "Verified Customer",
        rating,
        comment: comment.trim(),
        productName: productName.trim() || "Bakery Special",
        orderId: initialOrderId,
      });

      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        onClose();
      }, 1600);
    } catch (_err) {
      setErrorMsg("Failed to submit rating. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in">
      <div className="w-full max-w-lg bg-[#FFF8EC] rounded-3xl shadow-2xl border border-[#E5DEC9] overflow-hidden flex flex-col max-h-[92vh] transition-all">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#E5DEC9] flex items-center justify-between bg-white">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-full bg-[#FFF8EC] border border-[#596B58]/30 flex items-center justify-center text-[#596B58]">
              <Sparkles className="h-5 w-5 fill-[#D8BE91]" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-[#3B302B]">Rate Your Experience</h2>
              <p className="text-[11px] text-[#7A6E65]">Your review will appear live on our Home Page</p>
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
            <h3 className="text-2xl font-extrabold text-[#3B302B]">Thank You So Much!</h3>
            <p className="text-sm text-[#7A6E65] max-w-sm mx-auto">
              Your <strong>{rating}-star rating</strong> has been submitted. It is now live in the moving marquee on our Home Page!
            </p>
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#E5DEC9] rounded-full text-xs font-bold text-[#596B58]">
              <Heart className="h-4 w-4 fill-current text-red-500" />
              <span>Onebite Bakery Community</span>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5 overflow-y-auto">
            {errorMsg ? (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-xl">
                {errorMsg}
              </div>
            ) : null}

            {/* Star Selector */}
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#E5DEC9] text-center space-y-3 shadow-xs">
              <div className="flex items-center justify-center gap-2 sm:gap-3">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(null)}
                    className="p-1 sm:p-2 transition-transform hover:scale-125 active:scale-95 cursor-pointer focus:outline-none"
                    aria-label={`${star} star`}
                  >
                    <Star
                      className={`h-8 w-8 sm:h-9 sm:w-9 transition-colors ${
                        star <= currentDisplayRating
                          ? "text-[#D8BE91] fill-[#D8BE91] drop-shadow-sm"
                          : "text-gray-200 fill-gray-100"
                      }`}
                    />
                  </button>
                ))}
              </div>

              <div className="flex items-center justify-center gap-2">
                <span className="text-xl sm:text-2xl">{RATING_LABELS[currentDisplayRating]?.emoji}</span>
                <span className="text-sm sm:text-base font-extrabold text-[#3B302B]">
                  {RATING_LABELS[currentDisplayRating]?.title}
                </span>
                <span className="text-xs text-[#7A6E65] hidden sm:inline">
                  — {RATING_LABELS[currentDisplayRating]?.desc}
                </span>
              </div>
            </div>

            {/* Quick Tags */}
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-[#7A6E65]">
                Quick Feedback Highlights:
              </label>
              <div className="flex flex-wrap gap-2">
                {QUICK_TAGS.map((tag) => {
                  const isSelected = selectedTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => handleTagToggle(tag)}
                      className={`text-xs px-3 py-1.5 rounded-full border transition-all cursor-pointer font-medium ${
                        isSelected
                          ? "bg-[#596B58] text-[#FFF8EC] border-[#596B58] shadow-xs"
                          : "bg-white text-[#3B302B] border-[#E5DEC9] hover:border-[#596B58] hover:bg-[#FFF8EC]"
                      }`}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* User Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#3B302B]">
                  Your Name <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Priya Sharma"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-[#E5DEC9] bg-white text-xs text-[#3B302B] outline-none focus:border-[#596B58]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#3B302B]">
                  Item / Cake Name <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Belgian Truffle Cake"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-[#E5DEC9] bg-white text-xs text-[#3B302B] outline-none focus:border-[#596B58]"
                />
              </div>
            </div>

            {/* Comment Textarea */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#3B302B]">
                Your Review & Message <span className="text-[#596B58]">*</span>
              </label>
              <textarea
                rows={3}
                placeholder="Tell us what you liked! Taste, cream texture, packaging, or birthday experience..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="w-full p-3 rounded-xl border border-[#E5DEC9] bg-white text-xs text-[#3B302B] outline-none focus:border-[#596B58] leading-relaxed resize-none"
                required
              />
            </div>

            {/* Live Card Preview */}
            <div className="rounded-2xl border border-dashed border-[#596B58]/40 bg-white/70 p-3.5 space-y-2">
              <div className="flex items-center justify-between text-[11px] font-bold text-[#596B58]">
                <span>Live Home Page Preview:</span>
                <span className="flex items-center gap-1">
                  <ThumbsUp className="h-3 w-3" /> Moving Marquee
                </span>
              </div>
              <div className="bg-white rounded-xl p-3 border border-[#E5DEC9] shadow-xs space-y-1.5">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-full bg-[#596B58]/10 text-[#596B58] flex items-center justify-center font-bold text-xs">
                    {(name || "U")[0].toUpperCase()}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#3B302B]">
                      {name || "Verified Customer"}
                    </h4>
                    <div className="flex text-[#D8BE91] text-[10px]">
                      {Array.from({ length: rating }).map((_, i) => (
                        <Star key={i} className="h-2.5 w-2.5 fill-current" />
                      ))}
                    </div>
                  </div>
                  {productName ? (
                    <span className="ml-auto text-[10px] text-[#596B58] bg-[#FFF8EC] border border-[#596B58]/30 px-2 py-0.5 rounded-full font-semibold truncate max-w-[120px]">
                      {productName}
                    </span>
                  ) : null}
                </div>
                <p className="text-[11px] text-[#7A6E65] italic line-clamp-2">
                  "{comment || "The best freshly baked treats in town!"}"
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-2 flex items-center justify-end gap-3 border-t border-[#E5DEC9]">
              <Button type="button" variant="outline" onClick={onClose} className="text-xs">
                Cancel
              </Button>
              <Button
                type="submit"
                isLoading={isSubmitting}
                disabled={!comment.trim()}
                className="text-xs flex items-center gap-1.5 shadow-md"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>Submit Rating & Publish</span>
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
