import type { HydratedDocument, Types, UpdateQuery } from "mongoose";

import { toObjectId } from "../../../db/utils/object-id.js";
import { APP_ERROR_CODES } from "../../../shared/constants/app-error-code.js";
import { HTTP_STATUS } from "../../../shared/constants/http-status.js";
import { AppError } from "../../../shared/errors/app-error.js";
import type { RequestContext } from "../../../shared/types/request-context.types.js";
import { createSlug } from "../../../shared/utils/slug.js";
import {
  PRODUCT_ERROR_MESSAGES,
} from "../constants/index.js";
import type { CreateProductDto, UpdateProductDto } from "../dto/index.js";
import type { Product } from "../model/index.js";
import type { ProductRepository } from "../repository/index.js";
import type { ProductResponse } from "../types/index.js";

export class ProductService {
  public constructor(private readonly productRepository: ProductRepository) {}

  public async createProduct(
    dto: CreateProductDto,
    context: RequestContext,
  ): Promise<ProductResponse> {
    const categoryId = toObjectId(dto.categoryId);
    const occasionIds = dto.occasionIds.map((occasionId) =>
      toObjectId(occasionId),
    );

    await this.ensureCategoryExists(categoryId);
    await this.ensureOccasionsExist(occasionIds);

    const slug = dto.slug
      ? await this.ensureExplicitSlugAvailable(dto.slug)
      : await this.createUniqueSlug(dto.name);

    const product = await this.productRepository.create({
      ...this.toWritePayload(dto),
      slug,
      categoryId,
      occasionIds,
      createdBy: context.userId ? toObjectId(context.userId) : undefined,
      updatedBy: context.userId ? toObjectId(context.userId) : undefined,
    });

    return this.toResponse(product);
  }

  public async updateProduct(
    id: string,
    dto: UpdateProductDto,
    context: RequestContext,
  ): Promise<ProductResponse> {
    const productId = toObjectId(id);
    const existing = await this.getExistingProduct(productId);
    const update: UpdateQuery<Product> = {
      $set: {
        ...this.toWritePayload(dto),
        updatedBy: context.userId ? toObjectId(context.userId) : undefined,
      },
    };

    if (dto.categoryId) {
      const categoryId = toObjectId(dto.categoryId);
      await this.ensureCategoryExists(categoryId);
      update.$set = { ...update.$set, categoryId };
    }

    if (dto.occasionIds) {
      const occasionIds = dto.occasionIds.map((occasionId) =>
        toObjectId(occasionId),
      );
      await this.ensureOccasionsExist(occasionIds);
      update.$set = { ...update.$set, occasionIds };
    }

    if (dto.slug) {
      update.$set = {
        ...update.$set,
        slug: await this.ensureExplicitSlugAvailable(dto.slug, productId),
      };
    } else if (dto.name) {
      update.$set = {
        ...update.$set,
        slug: await this.createUniqueSlug(dto.name, productId),
      };
    }

    const updated = await this.productRepository.updateById(productId, update);

    if (!updated) {
      throw this.createNotFoundError();
    }

    return this.toResponse(updated);
  }

  public async deleteProduct(
    id: string,
    context: RequestContext,
  ): Promise<ProductResponse> {
    const productId = toObjectId(id);
    await this.getExistingProduct(productId);

    const deleted = await this.productRepository.softDelete(
      { _id: productId, isDeleted: false },
      context.userId ? toObjectId(context.userId) : undefined,
    );

    if (!deleted) {
      throw this.createNotFoundError();
    }

    return this.toResponse(deleted);
  }

  public async restoreProduct(
    id: string,
    context: RequestContext,
  ): Promise<ProductResponse> {
    const productId = toObjectId(id);
    const existing =
      await this.productRepository.findByIdIncludingDeleted(productId);

    if (!existing) {
      throw this.createNotFoundError();
    }

    await this.ensureCategoryExists(existing.categoryId);
    await this.ensureOccasionsExist(existing.occasionIds);

    const restored = await this.productRepository.updateById(productId, {
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

  public async getProduct(id: string): Promise<ProductResponse> {
    return this.toResponse(await this.getExistingProduct(toObjectId(id)));
  }

  public async listAdminProducts(): Promise<ProductResponse[]> {
    const products = await this.productRepository.findAdminList();

    return products.map((product) => this.toResponse(product));
  }

  public async listPublicProducts(): Promise<ProductResponse[]> {
    const products = await this.productRepository.findPublicList();

    return products.map((product) => this.toResponse(product));
  }

  public async getPublicProductBySlug(slug: string): Promise<ProductResponse> {
    const product = await this.productRepository.findActiveBySlug(slug);

    if (!product) {
      throw this.createNotFoundError();
    }

    return this.toResponse(product);
  }

  private async getExistingProduct(
    productId: Types.ObjectId,
  ): Promise<HydratedDocument<Product>> {
    const product = await this.productRepository.findExistingProduct({
      _id: productId,
      isDeleted: false,
    });

    if (!product) {
      throw this.createNotFoundError();
    }

    return product;
  }

  private async ensureCategoryExists(categoryId: Types.ObjectId): Promise<void> {
    if (!(await this.productRepository.categoryExists(categoryId))) {
      throw new AppError(
        PRODUCT_ERROR_MESSAGES.INVALID_CATEGORY,
        HTTP_STATUS.UNPROCESSABLE_ENTITY,
        [],
        true,
        APP_ERROR_CODES.PRODUCT_INVALID_CATEGORY,
      );
    }
  }

  private async ensureOccasionsExist(
    occasionIds: Types.ObjectId[],
  ): Promise<void> {
    const missingIds =
      await this.productRepository.findMissingOccasionIds(occasionIds);

    if (missingIds.length > 0) {
      throw new AppError(
        PRODUCT_ERROR_MESSAGES.INVALID_OCCASION,
        HTTP_STATUS.UNPROCESSABLE_ENTITY,
        [],
        true,
        APP_ERROR_CODES.PRODUCT_INVALID_OCCASION,
      );
    }
  }

  private async ensureExplicitSlugAvailable(
    slug: string,
    excludeId?: Types.ObjectId,
  ): Promise<string> {
    const normalizedSlug = createSlug(slug);

    if (await this.isSlugTaken(normalizedSlug, excludeId)) {
      throw new AppError(
        PRODUCT_ERROR_MESSAGES.SLUG_CONFLICT,
        HTTP_STATUS.CONFLICT,
        [],
        true,
        APP_ERROR_CODES.PRODUCT_SLUG_CONFLICT,
      );
    }

    return normalizedSlug;
  }

  private async createUniqueSlug(
    value: string,
    excludeId?: Types.ObjectId,
  ): Promise<string> {
    const baseSlug = createSlug(value);
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
    const existing = await this.productRepository.findBySlug(slug);

    if (!existing) {
      return false;
    }

    return excludeId ? !existing._id.equals(excludeId) : true;
  }

  private toWritePayload(dto: UpdateProductDto): Partial<Product> {
    return {
      ...(dto.name ? { name: dto.name } : {}),
      ...(dto.shortDescription
        ? { shortDescription: dto.shortDescription }
        : {}),
      ...(dto.description ? { description: dto.description } : {}),
      ...(dto.productType ? { productType: dto.productType } : {}),
      ...(typeof dto.price === "number" ? { price: dto.price } : {}),
      ...(typeof dto.compareAtPrice === "number"
        ? { compareAtPrice: dto.compareAtPrice }
        : {}),
      ...(dto.imageUrls ? { imageUrls: dto.imageUrls } : {}),
      ...(dto.thumbnailUrl ? { thumbnailUrl: dto.thumbnailUrl } : {}),
      ...(typeof dto.isActive === "boolean" ? { isActive: dto.isActive } : {}),
      ...(typeof dto.isFeatured === "boolean"
        ? { isFeatured: dto.isFeatured }
        : {}),
      ...(typeof dto.isTrending === "boolean"
        ? { isTrending: dto.isTrending }
        : {}),
      ...(typeof dto.isRecommended === "boolean"
        ? { isRecommended: dto.isRecommended }
        : {}),
      ...(typeof dto.isSeasonal === "boolean"
        ? { isSeasonal: dto.isSeasonal }
        : {}),
      ...(typeof dto.deliveryEligible === "boolean"
        ? { deliveryEligible: dto.deliveryEligible }
        : {}),
      ...(typeof dto.pickupEligible === "boolean"
        ? { pickupEligible: dto.pickupEligible }
        : {}),
      ...(typeof dto.displayOrder === "number"
        ? { displayOrder: dto.displayOrder }
        : {}),
      ...(dto.seoTitle ? { seoTitle: dto.seoTitle } : {}),
      ...(dto.seoDescription ? { seoDescription: dto.seoDescription } : {}),
      ...(dto.seoKeywords ? { seoKeywords: dto.seoKeywords } : {}),
    };
  }

  private toResponse(product: Product): ProductResponse {
    return {
      id: product._id.toString(),
      name: product.name,
      slug: product.slug,
      ...(product.shortDescription
        ? { shortDescription: product.shortDescription }
        : {}),
      description: product.description,
      categoryId: product.categoryId.toString(),
      occasionIds: product.occasionIds.map((occasionId) =>
        occasionId.toString(),
      ),
      productType: product.productType,
      price: product.price,
      ...(typeof product.compareAtPrice === "number"
        ? { compareAtPrice: product.compareAtPrice }
        : {}),
      imageUrls: product.imageUrls,
      thumbnailUrl: product.thumbnailUrl,
      isActive: product.isActive,
      isFeatured: product.isFeatured,
      isTrending: product.isTrending,
      isRecommended: product.isRecommended,
      isSeasonal: product.isSeasonal,
      deliveryEligible: product.deliveryEligible,
      pickupEligible: product.pickupEligible,
      displayOrder: product.displayOrder,
      seoTitle: product.seoTitle,
      seoDescription: product.seoDescription,
      seoKeywords: product.seoKeywords,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    };
  }

  private createNotFoundError(): AppError {
    return new AppError(
      PRODUCT_ERROR_MESSAGES.NOT_FOUND,
      HTTP_STATUS.NOT_FOUND,
      [],
      true,
      APP_ERROR_CODES.PRODUCT_NOT_FOUND,
    );
  }
}
