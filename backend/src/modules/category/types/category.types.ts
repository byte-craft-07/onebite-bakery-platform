export interface CategoryResponse {
  id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
  icon?: string;
  displayOrder: number;
  isActive: boolean;
  parentCategory?: string;
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string[];
  children: CategoryResponse[];
  createdAt: Date;
  updatedAt: Date;
}
