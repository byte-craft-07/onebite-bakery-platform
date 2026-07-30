export interface CreateCategoryDto {
  name: string;
  slug?: string;
  description: string;
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
