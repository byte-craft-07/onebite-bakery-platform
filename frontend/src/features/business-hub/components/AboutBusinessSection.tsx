import React from "react";
import { Sparkles, Award, HeartHandshake } from "lucide-react";

import type { BusinessHubProfile } from "@/services/businessHub.service";
import type { ThemeConfig } from "../theme/themeClasses";

interface AboutBusinessSectionProps {
  profile: BusinessHubProfile;
  theme: ThemeConfig;
  borderRadiusClass: string;
}

export const AboutBusinessSection: React.FC<AboutBusinessSectionProps> = ({
  profile,
  theme,
  borderRadiusClass,
}) => {
  if (!profile.description && !profile.shortDescription) return null;

  return (
    <section
      id="about"
      aria-label="About Business"
      className={`p-5 sm:p-6 border shadow-xs space-y-3.5 text-left ${borderRadiusClass} ${theme.cardBg} ${theme.cardBorder}`}
    >
      <div className="flex items-center justify-between">
        <h2 className={`text-base sm:text-lg font-bold flex items-center gap-2 ${theme.textPrimary}`}>
          <Sparkles className="w-4 h-4 text-amber-600" />
          About {profile.businessName}
        </h2>
        {profile.foundedYear ? (
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300">
            Est. {profile.foundedYear}
          </span>
        ) : null}
      </div>

      <p className={`text-sm leading-relaxed ${theme.textSecondary}`}>
        {profile.description || profile.shortDescription}
      </p>

      {/* Highlights / Badges */}
      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-stone-100 dark:border-stone-800/60">
        <div className="flex items-center gap-2 text-xs font-medium text-stone-600 dark:text-stone-300">
          <Award className="w-3.5 h-3.5 text-amber-600 shrink-0" />
          <span>{profile.businessCategory || "Artisan Bakery"}</span>
        </div>
        <div className="flex items-center gap-2 text-xs font-medium text-stone-600 dark:text-stone-300">
          <HeartHandshake className="w-3.5 h-3.5 text-rose-500 shrink-0" />
          <span>Freshly Baked Daily</span>
        </div>
      </div>
    </section>
  );
};
