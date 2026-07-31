import { toObjectId } from "../../../db/utils/object-id.js";
import { APP_ERROR_CODES } from "../../../shared/constants/app-error-code.js";
import { HTTP_STATUS } from "../../../shared/constants/http-status.js";
import { AppError } from "../../../shared/errors/app-error.js";
import { AddressModel } from "../../address/index.js";
import type { CartRepository } from "../../cart/index.js";

import { ProductModel } from "../../product/index.js";
import { SettingsModel } from "../../settings/index.js";
import type { DeliveryMethod } from "../../order/constants/index.js";
import type {
  CheckoutPreviewQueryDto,
  ValidateCheckoutDto,
} from "../dto/index.js";
import type {
  CheckoutItemSummary,
  CheckoutSummaryResponse,
  ValidateCheckoutResponse,
} from "../types/index.js";

export class CheckoutService {
  public constructor(private readonly cartRepository: CartRepository) {}

  public async getCheckoutSummary(
    customerId: string,
    query: CheckoutPreviewQueryDto,
  ): Promise<CheckoutSummaryResponse> {
    const customerObjId = toObjectId(customerId);
    const cart = await this.cartRepository.findActiveCart(customerObjId);

    if (!cart || !cart.items || cart.items.length === 0) {
      throw new AppError(
        "Cart is empty. Add items to cart before proceeding to checkout.",
        HTTP_STATUS.BAD_REQUEST,
        [],
        true,
        APP_ERROR_CODES.ORDER_CART_EMPTY,
      );
    }

    const validationErrors: string[] = [];
    const warnings: string[] = [];
    const itemSummaries: CheckoutItemSummary[] = [];

    for (const item of cart.items) {
      const product = await ProductModel.findOne({
        _id: item.productId,
        isDeleted: false,
      }).exec();

      if (!product || !product.isActive) {
        validationErrors.push(
          `Product '${item.productSnapshot.name}' is inactive or no longer available.`,
        );
        itemSummaries.push({
          productId: item.productId.toString(),
          productName: item.productSnapshot.name,
          productType: item.productType,
          quantity: item.quantity,
          unitPriceSnapshot: item.unitPriceSnapshot ?? item.unitPrice,
          totalPrice: item.totalPrice,
          isAvailable: false,
        });
        continue;
      }

      if (!product.isAvailable) {
        validationErrors.push(
          `Product '${product.name}' is currently unavailable.`,
        );
      }

      if (product.trackInventory && !product.allowBackorder) {
        if (product.stockQuantity < item.quantity) {
          validationErrors.push(
            `Insufficient stock for '${product.name}'. Available: ${product.stockQuantity}, in cart: ${item.quantity}.`,
          );
        }
      }

      itemSummaries.push({
        productId: product._id.toString(),
        productName: product.name,
        productType: product.productType,
        quantity: item.quantity,
        unitPriceSnapshot: item.unitPriceSnapshot ?? item.unitPrice,
        totalPrice: item.unitPrice * item.quantity,
        isAvailable: product.isAvailable,
      });
    }

    const settings = await SettingsModel.findOne({ singletonKey: "default" })
      .lean()
      .exec();

    const minHomeDeliveryAmount =
      settings?.delivery?.minimumHomeDeliveryAmount ?? 300;
    const isDeliveryEnabled = settings?.isDeliveryEnabled ?? true;
    const isPickupEnabled = settings?.isPickupEnabled ?? true;

    const subtotal = cart.items.reduce(
      (sum, item) => sum + item.unitPrice * item.quantity,
      0,
    );

    const homeDeliveryEligible =
      isDeliveryEnabled && subtotal >= minHomeDeliveryAmount;
    const pickupEligible = isPickupEnabled;

    const eligibleDeliveryMethods: DeliveryMethod[] = [];
    if (homeDeliveryEligible) eligibleDeliveryMethods.push("HOME_DELIVERY");
    if (pickupEligible) eligibleDeliveryMethods.push("STORE_PICKUP");

    if (subtotal < minHomeDeliveryAmount) {
      warnings.push(
        `Cart subtotal (₹${subtotal}) is below the minimum threshold (₹${minHomeDeliveryAmount}) for Home Delivery. Only Store Pickup is available.`,
      );
    }

    let selectedAddress: Record<string, unknown> | undefined;

    if (query.addressId) {
      const addressDoc = await AddressModel.findOne({
        _id: toObjectId(query.addressId),
        userId: customerObjId,
      }).exec();

      if (!addressDoc) {
        validationErrors.push(
          "Selected delivery address was not found or does not belong to your account.",
        );
      } else {
        selectedAddress = {
          id: addressDoc._id.toString(),
          fullName: addressDoc.fullName,
          phone: addressDoc.phone,
          street: addressDoc.address,
          city: addressDoc.city,
          state: addressDoc.state,
          pincode: addressDoc.pincode,
          landmark: addressDoc.landmark,
        };
      }
    }

    return {
      cartId: cart._id.toString(),
      items: itemSummaries,
      subtotal,
      totalItems: cart.items.reduce((sum, item) => sum + item.quantity, 0),
      eligibleDeliveryMethods,
      homeDeliveryEligible,
      pickupEligible,
      minimumHomeDeliveryAmount: minHomeDeliveryAmount,
      ...(query.deliveryMethod ? { selectedDeliveryMethod: query.deliveryMethod } : {}),
      ...(selectedAddress ? { selectedAddress } : {}),
      validationErrors,
      warnings,
    };
  }

  public async validateCheckout(
    customerId: string,
    dto: ValidateCheckoutDto,
  ): Promise<ValidateCheckoutResponse> {
    const summary = await this.getCheckoutSummary(customerId, {
      deliveryMethod: dto.deliveryMethod,
      addressId: dto.addressId,
    });

    const validationErrors = [...summary.validationErrors];

    if (dto.deliveryMethod === "HOME_DELIVERY") {
      if (!summary.homeDeliveryEligible) {
        throw new AppError(
          `Home Delivery is not available. Subtotal (₹${summary.subtotal}) is below minimum threshold of ₹${summary.minimumHomeDeliveryAmount}.`,
          HTTP_STATUS.UNPROCESSABLE_ENTITY,
          [],
          true,
          APP_ERROR_CODES.ORDER_MINIMUM_DELIVERY_NOT_MET,
        );
      }

      if (!dto.addressId && !dto.address) {
        validationErrors.push("Delivery address is required for Home Delivery.");
      }
    }

    if (dto.addressId) {
      const addressDoc = await AddressModel.findOne({
        _id: toObjectId(dto.addressId),
        userId: toObjectId(customerId),
      }).exec();

      if (!addressDoc) {
        throw new AppError(
          "Invalid delivery address.",
          HTTP_STATUS.BAD_REQUEST,
          [],
          true,
          APP_ERROR_CODES.ORDER_ADDRESS_REQUIRED,
        );
      }
    }

    return {
      isValid: validationErrors.length === 0,
      cartId: summary.cartId,
      subtotal: summary.subtotal,
      totalItems: summary.totalItems,
      deliveryMethod: dto.deliveryMethod,
      validationErrors,
      warnings: summary.warnings,
    };
  }
}
