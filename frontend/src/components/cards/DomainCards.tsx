import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Check, Star } from "lucide-react";

import type { MockCategory, MockCombo, MockOccasion, MockReview } from "@/data/mockData";

export const CategoryCard: React.FC<{ category: MockCategory }> = ({ category }) => {
  return (
    <Link
      to={`/categories/${category.slug}`}
      className="group relative rounded-2xl overflow-hidden aspect-4/3 border border-[#E8E2D9] shadow-md flex flex-col justify-end p-6"
    >
      <img
        src={category.image}
        alt={category.name}
        className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
        loading="lazy"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

      <div className="relative z-10 text-white space-y-1">
        <h3 className="text-xl font-bold group-hover:text-[#E67E22] transition-colors">
          {category.name}
        </h3>
        <p className="text-xs text-white/80">{category.itemCount} Items</p>
      </div>
    </Link>
  );
};

export const OccasionCard: React.FC<{ occasion: MockOccasion }> = ({ occasion }) => {
  return (
    <Link
      to={`/occasions/${occasion.slug}`}
      className="group relative rounded-2xl overflow-hidden aspect-3/2 border border-[#E8E2D9] shadow-md flex flex-col justify-end p-6"
    >
      <img
        src={occasion.image}
        alt={occasion.name}
        className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        loading="lazy"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />

      <div className="relative z-10 text-white space-y-1">
        <h3 className="text-2xl font-extrabold group-hover:text-[#E67E22] transition-colors">
          {occasion.name}
        </h3>
        <p className="text-xs text-white/90 line-clamp-1">{occasion.tagline}</p>
      </div>
    </Link>
  );
};

export const ComboCard: React.FC<{ combo: MockCombo }> = ({ combo }) => {
  return (
    <div className="rounded-2xl border border-[#E8E2D9] bg-white p-6 shadow-md flex flex-col md:flex-row gap-6 items-center">
      <div className="w-full md:w-1/3 aspect-4/3 rounded-xl overflow-hidden bg-[#F9F6F0]">
        <img src={combo.image} alt={combo.title} className="h-full w-full object-cover" loading="lazy" />
      </div>

      <div className="w-full md:w-2/3 space-y-3">
        <h3 className="text-xl font-bold text-[#2C1E16]">{combo.title}</h3>
        <ul className="space-y-1.5 text-xs text-[#6E5D4F]">
          {combo.items.map((item, idx) => (
            <li key={idx} className="flex items-center gap-2">
              <Check className="h-3.5 w-3.5 text-[#27AE60]" />
              <span>{item}</span>
            </li>
          ))}
        </ul>

        <div className="flex items-center justify-between pt-2 border-t border-[#E8E2D9]">
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-extrabold text-[#2C1E16]">₹{combo.price}</span>
            <span className="text-xs text-gray-400 line-through">₹{combo.originalPrice}</span>
          </div>

          <button className="flex items-center gap-1.5 px-4 py-2 bg-[#2C1E16] text-white rounded-lg text-xs font-semibold hover:bg-[#E67E22] transition-colors">
            <span>Explore Combo</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export const ReviewCard: React.FC<{ review: MockReview }> = ({ review }) => {
  return (
    <div className="rounded-2xl border border-[#E8E2D9] bg-[#FFFBF5] p-6 shadow-sm space-y-3">
      <div className="flex items-center gap-3">
        <img src={review.avatar} alt={review.name} className="h-10 w-10 rounded-full object-cover" />
        <div>
          <h4 className="text-sm font-bold text-[#2C1E16]">{review.name}</h4>
          <div className="flex text-amber-500 text-xs">
            {Array.from({ length: review.rating }).map((_, i) => (
              <Star key={i} className="h-3 w-3 fill-current" />
            ))}
          </div>
        </div>
      </div>
      <p className="text-xs text-[#6E5D4F] italic">"{review.comment}"</p>
      <p className="text-[10px] text-gray-400 text-right">{review.date}</p>
    </div>
  );
};
