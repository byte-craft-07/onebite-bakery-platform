import React, { useEffect, useState } from "react";

import { OccasionCard } from "@/components/cards/DomainCards";
import { Skeleton } from "@/components/ui/DisplayComponents";
import { catalogService, type OccasionItem } from "@/services/catalog.service";

export const OccasionsPage: React.FC = () => {
  const [occasions, setOccasions] = useState<OccasionItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    catalogService
      .getOccasions()
      .then(setOccasions)
      .catch(() => setOccasions([]))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div className="space-y-10 pb-16">
      <div className="rounded-3xl bg-[#FFF3E6] border border-[#E8E2D9] p-10 text-center space-y-3">
        <h1 className="text-4xl font-extrabold text-[#2C1E16]">Celebration Occasions</h1>
        <p className="text-sm text-[#6E5D4F] max-w-xl mx-auto">
          Tailored tier cakes and dessert hampers crafted specifically for birthdays, anniversaries, and weddings.
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-48 w-full rounded-2xl" />
          ))}
        </div>
      ) : occasions.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {occasions.map((occasion) => (
            <OccasionCard
              key={occasion.id}
              occasion={{
                id: occasion.id,
                name: occasion.name,
                slug: occasion.slug,
                image: occasion.image || "https://images.unsplash.com/photo-1535141192574-5d4897c13136?auto=format&fit=crop&w=600&q=80",
                tagline: occasion.tagline || "Special celebration creation.",
              }}
            />
          ))}
        </div>
      ) : (
        <p className="text-center text-[#6E5D4F]">No occasions available.</p>
      )}
    </div>
  );
};
