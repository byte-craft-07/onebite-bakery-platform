import type { HydratedDocument, Types, UpdateQuery } from "mongoose";

import { toObjectId } from "../../../db/utils/object-id.js";
import { APP_ERROR_CODES } from "../../../shared/constants/app-error-code.js";
import { HTTP_STATUS } from "../../../shared/constants/http-status.js";
import { AppError } from "../../../shared/errors/app-error.js";
import type { RequestContext } from "../../../shared/types/request-context.types.js";
import {
  PRODUCT_ERROR_MESSAGES,
} from "../constants/index.js";
import type {
  UpdateAvailabilityDto,
  UpdateInventoryDto,
  UpdatePricingDto,
} from "../dto/index.js";
import type { Product } from "../model/index.js";
import type { InventoryRepository } from "../repository/index.js";
import type { ProductInventoryResponse } from "../types/index.js";
import { calculateStockStatus } from "../utils/index.js";

export class InventoryService {
  public constructor(
    private readonly inventoryRepository: InventoryRepository,
  ) {}

  public async getInventory(id: string): Promise<ProductInventoryResponse> {
    return this.toInventoryResponse(await this.getExistingProduct(toObjectId(id)));
  }

  public async updatePricing(
    id: string,
    dto: UpdatePricingDto,
    context: RequestContext,
  ): Promise<ProductInventoryResponse> {
    const productId = toObjectId(id);
    await this.getExistingProduct(productId);
    const updated = await this.inventoryRepository.updateProductInventory(
      productId,
      {
        $set: {
          price: dto.price,
          ...(typeof dto.compareAtPrice === "number"
            ? { compareAtPrice: dto.compareAtPrice }
            : {}),
          ...(typeof dto.costPrice === "number"
            ? { costPrice: dto.costPrice }
            : {}),
          ...(dto.taxCategory ? { taxCategory: dto.taxCategory } : {}),
          updatedBy: context.userId ? toObjectId(context.userId) : undefined,
        },
      },
    );

    if (!updated) {
      throw this.createNotFoundError();
    }

    return this.toInventoryResponse(updated);
  }

  public async updateInventory(
    id: string,
    dto: UpdateInventoryDto,
    context: RequestContext,
  ): Promise<ProductInventoryResponse> {
    const productId = toObjectId(id);
    await this.getExistingProduct(productId);
    const stockStatus = calculateStockStatus({
      stockQuantity: dto.stockQuantity,
      lowStockThreshold: dto.lowStockThreshold,
      trackInventory: dto.trackInventory,
      allowBackorder: dto.allowBackorder,
      explicitStockStatus: dto.stockStatus,
    });
    const updated = await this.inventoryRepository.updateProductInventory(
      productId,
      {
        $set: {
          stockQuantity: dto.stockQuantity,
          lowStockThreshold: dto.lowStockThreshold,
          trackInventory: dto.trackInventory,
          allowBackorder: dto.allowBackorder,
          stockStatus,
          updatedBy: context.userId ? toObjectId(context.userId) : undefined,
        },
      },
    );

    if (!updated) {
      throw this.createNotFoundError();
    }

    return this.toInventoryResponse(updated);
  }

  public async updateAvailability(
    id: string,
    dto: UpdateAvailabilityDto,
    context: RequestContext,
  ): Promise<ProductInventoryResponse> {
    const productId = toObjectId(id);
    await this.getExistingProduct(productId);
    const update: UpdateQuery<Product> = {
      $set: {
        isAvailable: dto.isAvailable,
        deliveryEligible: dto.deliveryEligible,
        pickupEligible: dto.pickupEligible,
        updatedBy: context.userId ? toObjectId(context.userId) : undefined,
      },
    };

    if (dto.availableFrom) {
      update.$set = { ...update.$set, availableFrom: dto.availableFrom };
    }

    if (dto.availableUntil) {
      update.$set = { ...update.$set, availableUntil: dto.availableUntil };
    }

    const updated = await this.inventoryRepository.updateProductInventory(
      productId,
      update,
    );

    if (!updated) {
      throw this.createNotFoundError();
    }

    return this.toInventoryResponse(updated);
  }

  private async getExistingProduct(
    productId: Types.ObjectId,
  ): Promise<HydratedDocument<Product>> {
    const product =
      await this.inventoryRepository.findByIdWithPrivatePricing(productId);

    if (!product) {
      throw this.createNotFoundError();
    }

    return product;
  }

  private toInventoryResponse(product: Product): ProductInventoryResponse {
    return {
      id: product._id.toString(),
      price: product.price,
      ...(typeof product.compareAtPrice === "number"
        ? { compareAtPrice: product.compareAtPrice }
        : {}),
      ...(typeof product.costPrice === "number"
        ? { costPrice: product.costPrice }
        : {}),
      ...(product.taxCategory ? { taxCategory: product.taxCategory } : {}),
      stockQuantity: product.stockQuantity,
      lowStockThreshold: product.lowStockThreshold,
      trackInventory: product.trackInventory,
      allowBackorder: product.allowBackorder,
      stockStatus: product.stockStatus,
      isAvailable: product.isAvailable,
      deliveryEligible: product.deliveryEligible,
      pickupEligible: product.pickupEligible,
      ...(product.availableFrom ? { availableFrom: product.availableFrom } : {}),
      ...(product.availableUntil
        ? { availableUntil: product.availableUntil }
        : {}),
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
