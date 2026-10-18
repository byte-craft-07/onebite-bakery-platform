import type { Types } from "mongoose";
import { toObjectId } from "../../../db/utils/object-id.js";
import { APP_ERROR_CODES } from "../../../shared/constants/app-error-code.js";
import { HTTP_STATUS } from "../../../shared/constants/http-status.js";
import { AppError } from "../../../shared/errors/app-error.js";
import { AddressModel } from "../../address/index.js";
import type { CartRepository } from "../../cart/index.js";

import { ProductModel } from "../../product/index.js";
import { SettingsModel } from "../../settings/index.js";
import { couponService } from "../../coupon/index.js";
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

    let customerBranchId: string | undefined;
    try {
      const { UserModel } = await import("../../user/model/user.model.js");
      if (UserModel.db?.readyState === 1) {
        let villageToResolve: string | undefined = query.villageId;

        if (!villageToResolve && query.addressId) {
          const { AddressModel } = await import("../../address/index.js");
          const addressDoc = await AddressModel.findOne({
            _id: toObjectId(query.addressId),
            userId: customerObjId,
          }).exec();

          if (addressDoc) {
            const { VillageModel } = await import("../../village/model/village.model.js");
            let vDoc = null;
            if (addressDoc.village) {
              vDoc = await VillageModel.findOne({
                name: new RegExp(`^${addressDoc.village.trim()}$`, "i"),
                isActive: true,
              }).exec();
            }
            if (!vDoc && addressDoc.city) {
              vDoc = await VillageModel.findOne({
                name: new RegExp(`^${addressDoc.city.trim()}$`, "i"),
                isActive: true,
              }).exec();
            }
            if (!vDoc && addressDoc.address) {
              vDoc = await VillageModel.findOne({
                name: new RegExp(addressDoc.address.trim(), "i"),
                isActive: true,
              }).exec();
            }

            if (vDoc) {
              villageToResolve = vDoc._id.toString();
            } else {
              villageToResolve = addressDoc.village || addressDoc.city;
            }
          }
        }

        if (!villageToResolve && query.villageName) {
          villageToResolve = query.villageName;
        }

        if (!villageToResolve && customerObjId) {
          const userDoc = await UserModel.findById(customerObjId).exec();
          if (userDoc?.currentLocation?.villageId) {
            villageToResolve = userDoc.currentLocation.villageId.toString();
          } else if (userDoc?.currentLocation?.villageName) {
            villageToResolve = userDoc.currentLocation.villageName;
          }
        }

        if (villageToResolve) {
          const { BranchService } = await import("../../branch/service/branch.service.js");
          const { BranchRepository } = await import("../../branch/repository/branch.repository.js");
          const branchService = new BranchService(new BranchRepository());
          const branchDoc = await branchService.resolveBranchForVillage(villageToResolve);
          if (branchDoc) customerBranchId = branchDoc._id.toString();
        }
      }
    } catch (_err) {
      // Fallback
    }

    for (const item of cart.items) {
      let product: any = await ProductModel.findOne({
        _id: item.productId,
        isDeleted: false,
      }).exec();

      let isDecoration = false;
      if (!product) {
        try {
          const { DecorationModel } = await import("../../decoration/model/decoration.model.js");
          if (DecorationModel.db?.readyState === 1) {
            const dec = await DecorationModel.findOne({
              _id: item.productId,
              isActive: true,
            }).exec();
            if (dec) {
              isDecoration = true;
              const decImages = Array.isArray(dec.images) && dec.images.length > 0 ? dec.images : [dec.image];
              product = {
                _id: dec._id,
                name: dec.name,
                slug: dec.slug || String(dec._id),
                price: dec.price,
                thumbnailUrl: dec.image || decImages[0],
                imageUrls: decImages,
                productType: "DECORATION",
                stockQuantity: typeof dec.stockQuantity === "number" ? dec.stockQuantity : (dec.inStock ? 99 : 0),
                isActive: dec.isActive,
                isAvailable: dec.inStock && (typeof dec.stockQuantity !== "number" || dec.stockQuantity > 0),
                trackInventory: false,
                allowBackorder: true,
              };
            }
          }
        } catch (_err) {
          // Fallback
        }
      }

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

      let isBranchAvailable = product.isAvailable;
      if (customerBranchId && !isDecoration) {
        try {
          const { BranchProductModel } = await import("../../branch/model/branch-product.model.js");
          const branchOverride = await BranchProductModel.findOne({
            branchId: toObjectId(customerBranchId),
            productId: product._id,
          }).exec();

          if (branchOverride) {
            if (!branchOverride.isAvailable) {
              isBranchAvailable = false;
            }
          }
        } catch (_err) {
          // Fallback
        }
      }

      if (!isBranchAvailable) {
        validationErrors.push(
          `Product '${product.name}' is currently unavailable for your selected location.`,
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
        productName: item.productSnapshot?.name || product.name,
        productType: item.productType || product.productType,
        quantity: item.quantity,
        unitPriceSnapshot: item.unitPriceSnapshot ?? item.unitPrice,
        totalPrice: (item.unitPriceSnapshot ?? item.unitPrice ?? product.price) * item.quantity,
        isAvailable: isBranchAvailable,
      });
    }

    const settings = await SettingsModel.findOne({ singletonKey: "default" })
      .lean()
      .exec();

    const minHomeDeliveryAmount =
      settings?.delivery?.minimumHomeDeliveryAmount ?? 300;
    const isDeliveryEnabled = settings?.isDeliveryEnabled ?? true;
    const isPickupEnabled = settings?.isPickupEnabled ?? true;

    if (!isDeliveryEnabled && !isPickupEnabled) {
      validationErrors.push(
        "Onebite Bakery is currently offline and not accepting new orders. Please check back during business hours.",
      );
    }

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
        `You are not eligible for online order because you are not full fill requirement | आप ऑनलाइन ऑर्डर के लिए पात्र नहीं हैं क्योंकि आप न्यूनतम आवश्यकता पूरी नहीं कर रहे हैं (Minimum online order limit: ₹${minHomeDeliveryAmount}, current subtotal: ₹${subtotal}). कृपया स्टोर से पिकअप कर लो (Please pick up from store / Store Pickup).`,
      );
    }

    let selectedAddress: Record<string, unknown> | undefined;
    let villageDeliveryCharge: number | undefined;
    let villageFreeThreshold: number | undefined;
    let addressDoc: {
      _id: Types.ObjectId;
      fullName: string;
      phone: string;
      address: string;
      city: string;
      state: string;
      pincode: string;
      landmark?: string;
    } | null = null;

    if (query.addressId) {
      addressDoc = await AddressModel.findOne({
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

    // Resolve village specific delivery charge
    try {
      const { VillageModel } = await import("../../village/model/village.model.js");
      if (VillageModel.db?.readyState === 1) {
        let villageDoc: { deliveryCharge?: number; freeDeliveryThreshold?: number } | null = null;

        if (query.villageId) {
          villageDoc = await VillageModel.findById(toObjectId(query.villageId)).exec();
        }

        if (!villageDoc && query.villageName) {
          villageDoc = await VillageModel.findOne({ name: new RegExp(`^${query.villageName.trim()}$`, "i"), isActive: true }).exec();
        }

        if (!villageDoc && addressDoc) {
          villageDoc =
            (addressDoc.city ? await VillageModel.findOne({ name: new RegExp(`^${addressDoc.city.trim()}$`, "i"), isActive: true }).exec() : null) ||
            (addressDoc.address ? await VillageModel.findOne({ name: new RegExp(addressDoc.address.trim(), "i"), isActive: true }).exec() : null);
        }

        if (!villageDoc && customerObjId) {
          const { UserModel } = await import("../../user/model/user.model.js");
          const userDoc = await UserModel.findById(customerObjId).exec();
          if (userDoc?.currentLocation?.villageId) {
            villageDoc = await VillageModel.findById(toObjectId(userDoc.currentLocation.villageId)).exec();
          } else if (userDoc?.currentLocation?.villageName) {
            villageDoc = await VillageModel.findOne({ name: new RegExp(`^${userDoc.currentLocation.villageName.trim()}$`, "i"), isActive: true }).exec();
          }
        }

        if (villageDoc) {
          if (villageDoc.deliveryCharge !== undefined && villageDoc.deliveryCharge !== null) {
            villageDeliveryCharge = villageDoc.deliveryCharge;
          }
          if (villageDoc.freeDeliveryThreshold !== undefined && villageDoc.freeDeliveryThreshold !== null) {
            villageFreeThreshold = villageDoc.freeDeliveryThreshold;
          }
        }
      }
    } catch (_err) {
      // Fallback
    }

    let discountAmount = cart.estimatedDiscount ?? cart.couponDiscount ?? 0;
    const appliedCoupon = (query.couponCode || cart.couponCode)?.trim();
    let effectiveCouponCode = appliedCoupon;

    if (appliedCoupon) {
      try {
        const couponRes = await couponService.validateAndCalculateDiscount(
          appliedCoupon,
          subtotal,
        );
        discountAmount = couponRes.discountAmount;
        effectiveCouponCode = couponRes.code;
      } catch (_cErr) {
        effectiveCouponCode = undefined;
      }
    }

    const freeDeliveryThreshold = villageFreeThreshold ?? (settings?.freeDeliveryThreshold ?? 799);
    const standardDeliveryCharge = villageDeliveryCharge ?? (settings?.deliveryCharge ?? 49);
    const deliveryFee =
      query.deliveryMethod === "STORE_PICKUP"
        ? 0
        : subtotal >= freeDeliveryThreshold
        ? 0
        : standardDeliveryCharge;

    const totalAmount = Math.max(0, Math.round((subtotal - discountAmount + deliveryFee) * 100) / 100);

    return {
      cartId: cart._id.toString(),
      items: itemSummaries,
      subtotal,
      totalItems: cart.items.reduce((sum, item) => sum + item.quantity, 0),
      pricing: {
        subtotal,
        deliveryFee,
        taxAmount: 0,
        discountAmount,
        totalAmount,
        ...(effectiveCouponCode ? { couponCode: effectiveCouponCode, couponDiscount: discountAmount } : {}),
      },
      ...(effectiveCouponCode ? { couponCode: effectiveCouponCode, couponDiscount: discountAmount } : {}),
      eligibleDeliveryMethods,
      homeDeliveryEligible,
      pickupEligible,
      minimumHomeDeliveryAmount: minHomeDeliveryAmount,
      freeDeliveryThreshold,
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
          `You are not eligible for online order because you are not full fill requirement | आप ऑनलाइन ऑर्डर के लिए पात्र नहीं हैं क्योंकि आप न्यूनतम आवश्यकता पूरी नहीं कर रहे हैं. Subtotal (₹${summary.subtotal}) is below minimum online order limit of ₹${summary.minimumHomeDeliveryAmount}. कृपया स्टोर से पिकअप कर लो (Please pick up from store / Store Pickup).`,
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
