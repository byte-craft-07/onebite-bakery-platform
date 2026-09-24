import type { HydratedDocument, Types, UpdateQuery } from "mongoose";

import { toObjectId } from "../../../db/utils/object-id.js";
import { APP_ERROR_CODES } from "../../../shared/constants/app-error-code.js";
import { HTTP_STATUS } from "../../../shared/constants/http-status.js";
import { AppError } from "../../../shared/errors/app-error.js";
import type { RequestContext } from "../../../shared/types/request-context.types.js";
import { createSlug } from "../../../shared/utils/slug.js";
import { CategoryModel } from "../../category/index.js";
import {
  PRODUCT_ERROR_MESSAGES,
  type ProductType,
} from "../constants/index.js";
import type {
  ComboItemDto,
  CreateProductDto,
  UpdateProductDto,
} from "../dto/index.js";
import type { ComboItem, Product } from "../model/index.js";
import { InventoryRepository, type ProductRepository } from "../repository/index.js";
import type {
  PaginatedResult,
  ProductResponse,
  PublicProductQueryDto,
} from "../types/index.js";
import { calculateStockStatus } from "../utils/index.js";

export class ProductService {
  private readonly inventoryRepository: InventoryRepository;

  public constructor(
    private readonly productRepository: ProductRepository,
    inventoryRepository?: InventoryRepository,
  ) {
    this.inventoryRepository = inventoryRepository ?? new InventoryRepository();
  }

  public async createProduct(
    dto: CreateProductDto,
    context: RequestContext,
  ): Promise<ProductResponse> {
    let categoryId: Types.ObjectId;
    if (dto.categoryId) {
      categoryId = toObjectId(dto.categoryId);
      await this.ensureCategoryExists(categoryId);
    } else {
      const defaultCategory = await CategoryModel.findOne({ isDeleted: false }).sort({ displayOrder: 1 }).exec();
      if (defaultCategory) {
        categoryId = defaultCategory._id;
      } else {
        categoryId = toObjectId("64e000000000000000000001");
      }
    }
    const occasionIds = (dto.occasionIds || []).map((occasionId) =>
      toObjectId(occasionId),
    );

    if (occasionIds.length > 0) {
      await this.ensureOccasionsExist(occasionIds);
    }

    const comboItems = await this.validateComboItems(
      dto.productType,
      dto.comboItems,
    );

    const slug = dto.slug
      ? await this.ensureExplicitSlugAvailable(dto.slug)
      : await this.createUniqueSlug(dto.name);

    const stockQuantity = dto.stockQuantity ?? 0;
    const lowStockThreshold = dto.lowStockThreshold ?? 5;
    const trackInventory = dto.trackInventory ?? true;
    const allowBackorder = dto.allowBackorder ?? false;

    const stockStatus = calculateStockStatus({
      stockQuantity,
      lowStockThreshold,
      trackInventory,
      allowBackorder,
      explicitStockStatus: dto.stockStatus,
    });

    const mainImg = dto.thumbnailUrl || (dto as unknown as Record<string, string>).mainImage || "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=600&q=80";

    const product = await this.productRepository.create({
      ...this.toWritePayload(dto),
      name: dto.name,
      description: dto.description || "Freshly baked artisanal delight from Onebite Bakery.",
      thumbnailUrl: mainImg,
      imageUrls: dto.imageUrls && dto.imageUrls.length > 0 ? dto.imageUrls : [mainImg],
      seoTitle: dto.seoTitle || dto.name,
      seoDescription: dto.seoDescription || (dto.description ? dto.description.slice(0, 150) : `${dto.name} from Onebite Bakery`),
      slug,
      categoryId,
      occasionIds,
      comboItems,
      stockQuantity,
      lowStockThreshold,
      trackInventory,
      allowBackorder,
      stockStatus,
      isAvailable: dto.isAvailable ?? true,
      availableFrom: dto.availableFrom,
      availableUntil: dto.availableUntil,
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

    const targetType = dto.productType ?? existing.productType;
    const comboItems =
      dto.comboItems !== undefined
        ? await this.validateComboItems(targetType, dto.comboItems, productId)
        : existing.comboItems;

    const update: UpdateQuery<Product> = {
      $set: {
        ...this.toWritePayload(dto),
        comboItems,
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

    if (
      dto.stockQuantity !== undefined ||
      dto.lowStockThreshold !== undefined ||
      dto.trackInventory !== undefined ||
      dto.allowBackorder !== undefined ||
      dto.stockStatus !== undefined
    ) {
      const stockQuantity = dto.stockQuantity ?? existing.stockQuantity;
      const lowStockThreshold =
        dto.lowStockThreshold ?? existing.lowStockThreshold;
      const trackInventory = dto.trackInventory ?? existing.trackInventory;
      const allowBackorder = dto.allowBackorder ?? existing.allowBackorder;

      const stockStatus = calculateStockStatus({
        stockQuantity,
        lowStockThreshold,
        trackInventory,
        allowBackorder,
        explicitStockStatus: dto.stockStatus,
      });

      update.$set = {
        ...update.$set,
        stockQuantity,
        lowStockThreshold,
        trackInventory,
        allowBackorder,
        stockStatus,
      };
    }

    const newMainImg = dto.thumbnailUrl || (dto as unknown as Record<string, string>).mainImage;
    if (newMainImg) {
      update.$set = {
        ...update.$set,
        thumbnailUrl: newMainImg,
        imageUrls: dto.imageUrls && dto.imageUrls.length > 0 ? dto.imageUrls : [newMainImg],
      };
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

  public async queryPublicCatalog(
    query: PublicProductQueryDto,
    filterOverrides: Record<string, unknown> = {},
  ): Promise<{
    products: ProductResponse[];
    pagination: PaginatedResult<Product>["pagination"];
  }> {
    let categoryOverride: Types.ObjectId | undefined;
    let occasionOverride: Types.ObjectId | undefined;

    if (query.category) {
      const category = await this.productRepository.findCategoryBySlugOrId(
        query.category,
      );
      if (!category) {
        throw new AppError(
          "Category not found.",
          HTTP_STATUS.NOT_FOUND,
          [],
          true,
          APP_ERROR_CODES.CATEGORY_NOT_FOUND,
        );
      }
      categoryOverride = category._id;
    }

    if (query.occasion) {
      const occasion = await this.productRepository.findOccasionBySlugOrId(
        query.occasion,
      );
      if (!occasion) {
        throw new AppError(
          "Occasion not found.",
          HTTP_STATUS.NOT_FOUND,
          [],
          true,
          APP_ERROR_CODES.OCCASION_NOT_FOUND,
        );
      }
      occasionOverride = occasion._id;
    }

    let disabledProductIds: Types.ObjectId[] = [];
    const branchOverridesMap = new Map<string, { productId: Types.ObjectId | string; isAvailable?: boolean; stockQuantity?: number; price?: number }>();
    let resolvedBranchDoc: { _id: Types.ObjectId; name: string; code: string; type?: string; address?: { city?: string } } | null = null;

    const rawLocationQuery =
      (query as Record<string, unknown>).villageId ||
      (query as Record<string, unknown>).villageName ||
      (query as Record<string, unknown>).location ||
      (query as Record<string, unknown>).district;

    if (rawLocationQuery && typeof rawLocationQuery === "string") {
      try {
        const { BranchService } = await import("../../branch/service/branch.service.js");
        const { BranchRepository } = await import("../../branch/repository/branch.repository.js");
        const { BranchProductModel } = await import("../../branch/model/branch-product.model.js");

        const branchService = new BranchService(new BranchRepository());
        const branchDoc = await branchService.resolveBranchForVillage(rawLocationQuery);

        if (branchDoc) {
          resolvedBranchDoc = branchDoc;
          const isMainBranch = branchDoc.type === "MAIN" || branchDoc.code === "CD-01";

          if (!isMainBranch) {
            const queryChain = BranchProductModel.find({
              branchId: branchDoc._id,
              isAvailable: false,
            }) as unknown as {
              select?: (f: string) => { lean?: () => { exec: () => Promise<unknown> }; exec: () => Promise<unknown> };
              lean?: () => { exec: () => Promise<unknown> };
              exec: () => Promise<unknown>;
            };

            let disabledQuery: { lean?: () => { exec: () => Promise<unknown> }; exec: () => Promise<unknown> } =
              typeof queryChain.select === "function" ? queryChain.select("productId") : queryChain;
            if (typeof disabledQuery.lean === "function") {
              disabledQuery = disabledQuery.lean();
            }
            const disabledOverrides = (await disabledQuery.exec()) as { productId: Types.ObjectId }[];

            if (Array.isArray(disabledOverrides)) {
              for (const ov of disabledOverrides) {
                branchOverridesMap.set(ov.productId.toString(), ov);
                disabledProductIds.push(ov.productId);
              }
            }

            try {
              const activeChain = BranchProductModel.find({
                branchId: branchDoc._id,
                isAvailable: true,
              }) as unknown as {
                select?: (f: string) => { lean?: () => { exec: () => Promise<unknown> }; exec: () => Promise<unknown> };
                lean?: () => { exec: () => Promise<unknown> };
                exec: () => Promise<unknown>;
              };
              let activeQuery: { lean?: () => { exec: () => Promise<unknown> }; exec: () => Promise<unknown> } =
                typeof activeChain.select === "function" ? activeChain.select("productId isAvailable stockQuantity price") : activeChain;
              if (typeof activeQuery.lean === "function") activeQuery = activeQuery.lean();
              const activeOverrides = (await activeQuery.exec()) as { productId: Types.ObjectId; isAvailable?: boolean; stockQuantity?: number; price?: number }[];
              if (Array.isArray(activeOverrides)) {
                for (const ov of activeOverrides) {
                  branchOverridesMap.set(ov.productId.toString(), ov);
                }
              }
            } catch (_e) {
              // Ignore
            }
          }
        }
      } catch (_err) {
        // Fallback safely
      }
    }

    const mergedOverrides = {
      ...filterOverrides,
      ...(categoryOverride ? { categoryId: categoryOverride } : {}),
      ...(occasionOverride ? { occasionIds: occasionOverride } : {}),
      ...(disabledProductIds.length > 0 ? { _id: { $nin: disabledProductIds } } : {}),
    };

    const result = await this.productRepository.findPublicCatalog(
      query,
      mergedOverrides,
    );

    const products = result.items
      .filter((item) => {
        const ov = branchOverridesMap.get(item._id.toString());
        if (ov && ov.isAvailable === false) return false;
        return true;
      })
      .map((item) => {
        const response = this.toResponse(item);
        const ov = branchOverridesMap.get(item._id.toString());
        if (ov) {
          if (typeof ov.isAvailable === "boolean") response.isAvailable = ov.isAvailable;
          if (typeof ov.stockQuantity === "number") response.stockQuantity = ov.stockQuantity;
          if (typeof ov.price === "number") response.price = ov.price;
        } else {
          response.isAvailable = true;
        }
        if (resolvedBranchDoc) {
          response.branchSnapshot = {
            branchId: resolvedBranchDoc._id.toString(),
            name: resolvedBranchDoc.name,
            code: resolvedBranchDoc.code,
            city: resolvedBranchDoc.address?.city,
          };
          response.locationBranchName = resolvedBranchDoc.name;
        }
        return response;
      });

    return {
      products,
      pagination: result.pagination,
    };
  }

  public async listFeaturedProducts(query: PublicProductQueryDto) {
    return this.queryPublicCatalog(query, { isFeatured: true });
  }

  public async listTrendingProducts(query: PublicProductQueryDto) {
    return this.queryPublicCatalog(query, { isTrending: true });
  }

  public async listRecommendedProducts(query: PublicProductQueryDto) {
    return this.queryPublicCatalog(query, { isRecommended: true });
  }

  public async listSeasonalProducts(query: PublicProductQueryDto) {
    return this.queryPublicCatalog(query, { isSeasonal: true });
  }

  public async listProductsByCategorySlug(
    slug: string,
    query: PublicProductQueryDto,
  ) {
    const category =
      await this.productRepository.findCategoryBySlugOrId(slug);

    if (!category) {
      throw new AppError(
        "Category not found.",
        HTTP_STATUS.NOT_FOUND,
        [],
        true,
        APP_ERROR_CODES.CATEGORY_NOT_FOUND,
      );
    }

    const result = await this.queryPublicCatalog(query, {
      categoryId: category._id,
    });

    return {
      category: {
        id: category._id.toString(),
        name: category.name,
        slug: category.slug,
      },
      products: result.products,
      pagination: result.pagination,
    };
  }

  public async listProductsByOccasionSlug(
    slug: string,
    query: PublicProductQueryDto,
  ) {
    const occasion =
      await this.productRepository.findOccasionBySlugOrId(slug);

    if (!occasion) {
      throw new AppError(
        "Occasion not found.",
        HTTP_STATUS.NOT_FOUND,
        [],
        true,
        APP_ERROR_CODES.OCCASION_NOT_FOUND,
      );
    }

    const result = await this.queryPublicCatalog(query, {
      occasionIds: occasion._id,
    });

    return {
      occasion: {
        id: occasion._id.toString(),
        name: occasion.name,
        slug: occasion.slug,
      },
      products: result.products,
      pagination: result.pagination,
    };
  }

  public async getPublicProductBySlug(
    slug: string,
    villageId?: string,
  ): Promise<ProductResponse> {
    const product = await this.productRepository.findActiveBySlug(slug);

    if (!product) {
      throw this.createNotFoundError();
    }

    const response = this.toResponse(product);

    if (villageId) {
      try {
        const { BranchService } = await import("../../branch/service/branch.service.js");
        const { BranchRepository } = await import("../../branch/repository/branch.repository.js");
        const { BranchProductModel } = await import("../../branch/model/branch-product.model.js");

        const branchService = new BranchService(new BranchRepository());
        const branchDoc = await branchService.resolveBranchForVillage(villageId);

        if (branchDoc) {
          response.branchSnapshot = {
            branchId: branchDoc._id.toString(),
            name: branchDoc.name,
            code: branchDoc.code,
            city: branchDoc.address?.city,
          };
          response.locationBranchName = branchDoc.name;

          const override = await BranchProductModel.findOne({
            branchId: branchDoc._id,
            productId: product._id,
          }).exec();

          if (override) {
            if (typeof override.isAvailable === "boolean") response.isAvailable = override.isAvailable;
            if (typeof override.stockQuantity === "number") response.stockQuantity = override.stockQuantity;
          }
        }
      } catch (_err) {
        // Fallback safely
      }
    }

    return response;
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

  private async validateComboItems(
    productType: ProductType,
    comboItems?: ComboItemDto[],
    productId?: Types.ObjectId,
  ): Promise<ComboItem[]> {
    if (productType === "COMBO") {
      if (!comboItems || comboItems.length === 0) {
        throw new AppError(
          PRODUCT_ERROR_MESSAGES.INVALID_COMBO,
          HTTP_STATUS.UNPROCESSABLE_ENTITY,
          [],
          true,
          APP_ERROR_CODES.PRODUCT_INVALID_COMBO,
        );
      }
    }

    if (!comboItems || comboItems.length === 0) {
      return [];
    }

    const childObjectIds = comboItems.map((item) => toObjectId(item.productId));
    const uniqueChildIds = new Set(
      childObjectIds.map((childObjectId) => childObjectId.toString()),
    );

    if (uniqueChildIds.size !== childObjectIds.length) {
      throw new AppError(
        PRODUCT_ERROR_MESSAGES.INVALID_COMBO,
        HTTP_STATUS.UNPROCESSABLE_ENTITY,
        [],
        true,
        APP_ERROR_CODES.PRODUCT_INVALID_COMBO,
      );
    }

    if (productId && childObjectIds.some((id) => id.equals(productId))) {
      throw new AppError(
        PRODUCT_ERROR_MESSAGES.INVALID_COMBO,
        HTTP_STATUS.UNPROCESSABLE_ENTITY,
        [],
        true,
        APP_ERROR_CODES.PRODUCT_INVALID_COMBO,
      );
    }

    const missingIds =
      await this.inventoryRepository.findMissingProductIds(childObjectIds);

    if (missingIds.length > 0) {
      throw new AppError(
        PRODUCT_ERROR_MESSAGES.INVALID_COMBO,
        HTTP_STATUS.UNPROCESSABLE_ENTITY,
        [],
        true,
        APP_ERROR_CODES.PRODUCT_INVALID_COMBO,
      );
    }

    return comboItems.map((item) => ({
      productId: toObjectId(item.productId),
      quantity: item.quantity,
    }));
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
      ...(typeof dto.costPrice === "number" ? { costPrice: dto.costPrice } : {}),
      ...(dto.taxCategory ? { taxCategory: dto.taxCategory } : {}),
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
      ...(typeof dto.isAvailable === "boolean"
        ? { isAvailable: dto.isAvailable }
        : {}),
      ...(dto.availableFrom ? { availableFrom: dto.availableFrom } : {}),
      ...(dto.availableUntil ? { availableUntil: dto.availableUntil } : {}),
      ...(typeof dto.displayOrder === "number"
        ? { displayOrder: dto.displayOrder }
        : {}),
      ...(dto.seoTitle ? { seoTitle: dto.seoTitle } : {}),
      ...(dto.seoDescription ? { seoDescription: dto.seoDescription } : {}),
      ...(dto.seoKeywords ? { seoKeywords: dto.seoKeywords } : {}),
    };
  }

  private toResponse(product: Product): ProductResponse {
    const productIdStr = product._id ? product._id.toString() : "";
    const categoryIdStr = product.categoryId ? product.categoryId.toString() : "";
    const occasionIdsStr = product.occasionIds
      ? product.occasionIds.map((id) => id.toString())
      : [];

    return {
      id: productIdStr,
      name: product.name,
      slug: product.slug,
      ...(product.shortDescription
        ? { shortDescription: product.shortDescription }
        : {}),
      description: product.description,
      categoryId: categoryIdStr,
      occasionIds: occasionIdsStr,
      productType: product.productType,
      ...(product.comboItems && product.comboItems.length > 0
        ? {
            comboItems: product.comboItems.map((item) => ({
              productId: item.productId ? item.productId.toString() : "",
              quantity: item.quantity,
            })),
          }
        : {}),
      price: product.price,
      ...(typeof product.compareAtPrice === "number"
        ? { compareAtPrice: product.compareAtPrice }
        : {}),
      ...(product.taxCategory ? { taxCategory: product.taxCategory } : {}),
      imageUrls: product.imageUrls,
      thumbnailUrl: product.thumbnailUrl,
      stockStatus: product.stockStatus,
      isAvailable: product.isAvailable,
      ...(product.availableFrom ? { availableFrom: product.availableFrom } : {}),
      ...(product.availableUntil ? { availableUntil: product.availableUntil } : {}),
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
