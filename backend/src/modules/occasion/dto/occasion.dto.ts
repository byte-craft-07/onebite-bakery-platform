export interface CreateOccasionDto {
  name: string;
  slug?: string;
  description: string;
  bannerImage: string;
  icon?: string;
  displayOrder?: number;
  isActive?: boolean;
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string[];
}

export type UpdateOccasionDto = Partial<CreateOccasionDto>;
