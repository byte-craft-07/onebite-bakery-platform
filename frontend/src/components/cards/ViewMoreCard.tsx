import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Sparkles } from "lucide-react";

export interface ViewMoreCardProps {
  title: string;
  subtitle?: string;
  link: string;
  count?: number;
  badgeText?: string;
  buttonText?: string;
  className?: string;
}

export const ViewMoreCard: React.FC<ViewMoreCardProps> = ({
  title,
  subtitle,
  link,
  count,
  badgeText = "अभी और भी प्रोडक्ट्स हैं",
  buttonText,
  className = "",
}) => {
  const effectiveButtonText =
    buttonText || (count ? `Explore All ${count}+ Products` : "Explore All Products");

  return (
    <Link
      to={link}
      className={`group relative flex flex-col justify-between overflow-hidden rounded-2xl bg-gradient-to-b from-[#FFFDF9] via-[#FFF8EC] to-[#FFF3DF] border-2 border-dashed border-[#596B58]/50 hover:border-[#596B58] transition-all duration-300 hover:shadow-xl hover:-translate-y-1 p-3.5 sm:p-5 text-center cursor-pointer min-h-[300px] sm:min-h-[340px] ${className}`}
    >
      {/* Top Badge: "Abhi aur bhi products hain" */}
      <div className="flex justify-center">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] sm:text-[11px] font-extrabold bg-[#596B58]/10 text-[#596B58] border border-[#596B58]/20 shadow-2xs tracking-wide">
          <Sparkles className="h-3 w-3 shrink-0" />
          <span>{badgeText}</span>
        </span>
      </div>

      {/* Center Icon & Title */}
      <div className="my-auto flex flex-col items-center justify-center space-y-2.5 sm:space-y-3 py-4">
        <div className="w-13 h-13 sm:w-16 sm:h-16 rounded-full bg-[#596B58] text-white flex items-center justify-center shadow-md group-hover:scale-110 group-hover:bg-[#495948] transition-all duration-300">
          <ArrowRight className="h-5 w-5 sm:h-6 sm:w-6 group-hover:translate-x-1 transition-transform" />
        </div>
        <div className="space-y-1 px-1">
          <h3 className="text-xs sm:text-sm md:text-base font-extrabold text-[#3B302B] group-hover:text-[#596B58] transition-colors leading-snug">
            {title}
          </h3>
          {subtitle && (
            <p className="text-[11px] sm:text-xs text-[#7A6E65] line-clamp-2">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Bottom Button (Matching reference screenshot exactly) */}
      <div className="pt-2">
        <div className="w-full py-2 px-3 rounded-xl border border-[#596B58] text-[#596B58] bg-white group-hover:bg-[#596B58] group-hover:text-white text-[11px] sm:text-xs font-extrabold flex items-center justify-center gap-1.5 transition-colors shadow-2xs">
          <span>{effectiveButtonText}</span>
          <ArrowRight className="h-3.5 w-3.5 shrink-0 group-hover:translate-x-0.5 transition-transform" />
        </div>
      </div>
    </Link>
  );
};
