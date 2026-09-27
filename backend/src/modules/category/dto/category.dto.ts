export interface CreateCategoryDto {
  name: string;
  nameHi?: string;
  slug?: string;
  description: string;
  descriptionHi?: string;
  image: string;
  icon?: string;
  displayOrder: number;
  isActive: boolean;
  parentCategory?: string | null;
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string[];
}

export type UpdateCategoryDto = Partial<CreateCategoryDto>;

export interface ReorderCategoryItemDto {
  id: string;
  displayOrder: number;
  parentCategory?: string | null;
}

export interface ReorderCategoriesDto {
  items: ReorderCategoryItemDto[];
}
