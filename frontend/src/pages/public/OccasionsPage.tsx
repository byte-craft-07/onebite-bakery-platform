import React from "react";

import { OccasionCard } from "@/components/cards/DomainCards";
import { MOCK_OCCASIONS } from "@/data/mockData";

export const OccasionsPage: React.FC = () => {
  return (
    <div className="space-y-10 pb-16">
      <div className="rounded-3xl bg-[#FFF3E6] border border-[#E8E2D9] p-10 text-center space-y-3">
        <h1 className="text-4xl font-extrabold text-[#2C1E16]">Celebration Occasions</h1>
        <p className="text-sm text-[#6E5D4F] max-w-xl mx-auto">
          Tailored tier cakes and dessert hampers crafted specifically for birthdays, anniversaries, and weddings.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {MOCK_OCCASIONS.map((occasion) => (
          <OccasionCard key={occasion.id} occasion={occasion} />
        ))}
      </div>
    </div>
  );
};
