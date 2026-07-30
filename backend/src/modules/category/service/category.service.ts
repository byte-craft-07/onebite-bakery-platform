import type { HydratedDocument, Types, UpdateQuery } from "mongoose";

import { toObjectId } from "../../../db/utils/object-id.js";
import { APP_ERROR_CODES } from "../../../shared/constants/app-error-code.js";
import { HTTP_STATUS } from "../../../shared/constants/http-status.js";
import { AppError } from "../../../shared/errors/app-error.js";
import type { RequestContext } from "../../../shared/types/request-context.types.js";
import { CATEGORY_ERROR_MESSAGES } from "../constants/index.js";
import type {
  CreateCategoryDto,
  ReorderCategoriesDto,
  UpdateCategoryDto,
} from "../dto/index.js";
import type { Category } from "../model/index.js";
import type { CategoryRepository } from "../repository/index.js";
import type { CategoryResponse } from "../types/index.js";
import { createSearchableText, createSlug } from "../utils/index.js";

export class CategoryService {
  public constructor(private readonly categoryRepository: CategoryRepository) {}

  public async createCategory(
    dto: CreateCategoryDto,
    context: RequestContext,
  ): Promise<CategoryResponse> {
    await this.ensureNameAvailable(dto.name);
    const parentCategory = await this.resolveParentCategory(
      dto.parentCategory,
    );
    const slug = await this.createUniqueSlug(dto.slug ?? dto.name);

    const category = await this.categoryRepository.create({
      ...this.toWritePayload(dto),
      slug,
      parentCategory,
      createdBy: context.userId ? toObjectId(context.userId) : undefined,
      updatedBy: context.userId ? toObjectId(context.userId) : undefined,
    });

    return this.toResponse(category);
  }

  public async updateCategory(
    id: string,
    dto: UpdateCategoryDto,
    context: RequestContext,
  ): Promise<CategoryResponse> {
    const categoryId = toObjectId(id);
    const existing = await this.getExistingCategory(categoryId);

    if (dto.name) {
      await this.ensureNameAvailable(dto.name, categoryId);
    }

    const update: UpdateQuery<Category> = {
      $set: {
        ...this.toWritePayload(dto, existing),
        updatedBy: context.userId ? toObjectId(context.userId) : undefined,
      },
    };

    if (dto.slug || dto.name) {
      const nextSlug = await this.createUniqueSlug(
        dto.slug ?? dto.name ?? existing.name,
        categoryId,
      );
      update.$set = { ...update.$set, slug: nextSlug };
    }

    if (Object.prototype.hasOwnProperty.call(dto, "parentCategory")) {
      const parentCategory = await this.resolveParentCategory(
        dto.parentCategory,
      );

      await this.ensureNoCircularParent(categoryId, parentCategory);
      update.$set = { ...update.$set, parentCategory };
    }

    const updated = await this.categoryRepository.updateById(categoryId, update);

    if (!updated) {
      throw this.createNotFoundError();
    }

    return this.toResponse(updated);
  }

  public async deleteCategory(
    id: string,
    context: RequestContext,
  ): Promise<CategoryResponse> {
    const categoryId = toObjectId(id);
    await this.getExistingCategory(categoryId);

    if (await this.categoryRepository.hasChildren(categoryId)) {
      throw new AppError(
        CATEGORY_ERROR_MESSAGES.HAS_CHILDREN,
        HTTP_STATUS.CONFLICT,
        [],
        true,
        APP_ERROR_CODES.CATEGORY_HAS_CHILDREN,
      );
    }

    const deleted = await this.categoryRepository.softDelete(
      { _id: categoryId, isDeleted: false },
      context.userId ? toObjectId(context.userId) : undefined,
    );

    if (!deleted) {
      throw this.createNotFoundError();
    }

    return this.toResponse(deleted);
  }

  public async restoreCategory(
    id: string,
    context: RequestContext,
  ): Promise<CategoryResponse> {
    const categoryId = toObjectId(id);
    const existing =
      await this.categoryRepository.findByIdIncludingDeleted(categoryId);

    if (!existing) {
      throw this.createNotFoundError();
    }

    await this.ensureNameAvailable(existing.name, categoryId);

    const restored = await this.categoryRepository.updateById(categoryId, {
      $set: {
        isDeleted: false,
        updatedBy: context.userId ? toObjectId(context.userId) : undefined,
      },
      $unset: { deletedAt: "", deletedBy: "" },
    });

    if (!restored) {
      throw this.createNotFoundError();
    }

    return this.toResponse(restored);
  }

  public async getCategory(id: string): Promise<CategoryResponse> {
    return this.toResponse(await this.getExistingCategory(toObjectId(id)));
  }

  public async listAdminCategories(): Promise<CategoryResponse[]> {
    const categories = await this.categoryRepository.findAdminList();

    return categories.map((category) => this.toResponse(category));
  }

  public async listPublicCategoryTree(): Promise<CategoryResponse[]> {
    const categories = await this.categoryRepository.findActiveTreeCategories();

    return this.buildTree(categories);
  }

  public async reorderCategories(
    dto: ReorderCategoriesDto,
    context: RequestContext,
  ): Promise<CategoryResponse[]> {
    for (const item of dto.items) {
      const categoryId = toObjectId(item.id);
      await this.getExistingCategory(categoryId);
      const parentCategory = await this.resolveParentCategory(
        item.parentCategory,
      );
      await this.ensureNoCircularParent(categoryId, parentCategory);
      await this.categoryRepository.updateById(categoryId, {
        $set: {
          displayOrder: item.displayOrder,
          parentCategory,
          updatedBy: context.userId ? toObjectId(context.userId) : undefined,
        },
      });
    }

    return this.listAdminCategories();
  }

  private async getExistingCategory(
    categoryId: Types.ObjectId,
  ): Promise<HydratedDocument<Category>> {
    const category = await this.categoryRepository.findOne({
      _id: categoryId,
      isDeleted: false,
    });

    if (!category) {
      throw this.createNotFoundError();
    }

    return category;
  }

  private async resolveParentCategory(
    parentCategory?: string | null,
  ): Promise<Types.ObjectId | undefined> {
    if (!parentCategory) {
      return undefined;
    }

    const parentId = toObjectId(parentCategory);
    await this.getExistingCategory(parentId);

    return parentId;
  }

  private async ensureNameAvailable(
    name: string,
    excludeId?: Types.ObjectId,
  ): Promise<void> {
    const existing = await this.categoryRepository.findByName(name, excludeId);

    if (existing) {
      throw new AppError(
        CATEGORY_ERROR_MESSAGES.NAME_CONFLICT,
        HTTP_STATUS.CONFLICT,
        [],
        true,
        APP_ERROR_CODES.CATEGORY_NAME_CONFLICT,
      );
    }
  }

  private async createUniqueSlug(
    value: string,
    excludeId?: Types.ObjectId,
  ): Promise<string> {
    const baseSlug = createSlug(value);

    if (!baseSlug) {
      throw new AppError(
        CATEGORY_ERROR_MESSAGES.SLUG_CONFLICT,
        HTTP_STATUS.UNPROCESSABLE_ENTITY,
        [],
        true,
        APP_ERROR_CODES.CATEGORY_SLUG_CONFLICT,
      );
    }

    let candidate = baseSlug;
    let suffix = 2;

    while (await this.isSlugTaken(candidate, excludeId)) {
      candidate = `${baseSlug}-${suffix}`;
      suffix += 1;
    }

    return candidate;
  }

  private async isSlugTaken(
    slug: string,
    excludeId?: Types.ObjectId,
  ): Promise<boolean> {
    const existing = await this.categoryRepository.findBySlug(slug);

    if (!existing) {
      return false;
    }

    return excludeId ? !existing._id.equals(excludeId) : true;
  }

  private async ensureNoCircularParent(
    categoryId: Types.ObjectId,
    parentCategory?: Types.ObjectId,
  ): Promise<void> {
    if (!parentCategory) {
      return;
    }

    if (categoryId.equals(parentCategory)) {
      throw this.createCircularParentError();
    }

    let currentParent = await this.categoryRepository.findOne({
      _id: parentCategory,
      isDeleted: false,
    });

    while (currentParent?.parentCategory) {
      if (currentParent.parentCategory.equals(categoryId)) {
        throw this.createCircularParentError();
      }

      currentParent = await this.categoryRepository.findOne({
        _id: currentParent.parentCategory,
        isDeleted: false,
      });
    }
  }

  private toWritePayload(
    dto: UpdateCategoryDto,
    existing?: Category,
  ): Partial<Category> {
    const keywords = dto.seoKeywords ?? existing?.seoKeywords;
    const searchableText = createSearchableText([
      dto.name ?? existing?.name ?? "",
      dto.description ?? existing?.description ?? "",
      dto.seoTitle ?? existing?.seoTitle ?? "",
      dto.seoDescription ?? existing?.seoDescription ?? "",
      ...(keywords ?? []),
    ]);

    return {
      ...(dto.name ? { name: dto.name } : {}),
      ...(dto.description ? { description: dto.description } : {}),
      ...(dto.image ? { image: dto.image } : {}),
      ...(dto.icon ? { icon: dto.icon } : {}),
      ...(typeof dto.displayOrder === "number"
        ? { displayOrder: dto.displayOrder }
        : {}),
      ...(typeof dto.isActive === "boolean" ? { isActive: dto.isActive } : {}),
      ...(dto.seoTitle ? { seoTitle: dto.seoTitle } : {}),
      ...(dto.seoDescription ? { seoDescription: dto.seoDescription } : {}),
      ...(keywords ? { seoKeywords: keywords } : {}),
      ...(searchableText ? { searchableText } : {}),
    };
  }

  private buildTree(
    categories: Array<HydratedDocument<Category>>,
  ): CategoryResponse[] {
    const byId = new Map<string, CategoryResponse>();
    const roots: CategoryResponse[] = [];

    for (const category of categories) {
      byId.set(category._id.toString(), this.toResponse(category));
    }

    for (const category of categories) {
      const node = byId.get(category._id.toString());

      if (!node) {
        continue;
      }

      const parentId = category.parentCategory?.toString();
      const parent = parentId ? byId.get(parentId) : undefined;

      if (parent) {
        parent.children.push(node);
      } else {
        roots.push(node);
      }
    }

    return roots;
  }

  private toResponse(category: Category): CategoryResponse {
    return {
      id: category._id.toString(),
      name: category.name,
      slug: category.slug,
      description: category.description,
      image: category.image,
      ...(category.icon ? { icon: category.icon } : {}),
      displayOrder: category.displayOrder,
      isActive: category.isActive,
      ...(category.parentCategory
        ? { parentCategory: category.parentCategory.toString() }
        : {}),
      seoTitle: category.seoTitle,
      seoDescription: category.seoDescription,
      seoKeywords: category.seoKeywords,
      children: [],
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
    };
  }

  private createNotFoundError(): AppError {
    return new AppError(
      CATEGORY_ERROR_MESSAGES.NOT_FOUND,
      HTTP_STATUS.NOT_FOUND,
      [],
      true,
      APP_ERROR_CODES.CATEGORY_NOT_FOUND,
    );
  }

  private createCircularParentError(): AppError {
    return new AppError(
      CATEGORY_ERROR_MESSAGES.CIRCULAR_PARENT,
      HTTP_STATUS.CONFLICT,
      [],
      true,
      APP_ERROR_CODES.CATEGORY_CIRCULAR_PARENT,
    );
  }
}
