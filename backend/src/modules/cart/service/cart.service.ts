import { Types, type HydratedDocument } from "mongoose";

import { toObjectId } from "../../../db/utils/object-id.js";
import { APP_ERROR_CODES } from "../../../shared/constants/app-error-code.js";
import { HTTP_STATUS } from "../../../shared/constants/http-status.js";
import { AppError } from "../../../shared/errors/app-error.js";
import { ProductModel, type Product } from "../../product/index.js";
import { SettingsModel } from "../../settings/index.js";
import type { AddCartItemDto, UpdateCartItemDto } from "../dto/index.js";
import {
  CartModel,
  type Cart,
  type CartItem,
  type CustomCakeConfig,
} from "../model/index.js";
import type { CartRepository } from "../repository/index.js";
import type { CartItemResponse, CartResponse } from "../types/index.js";
import { couponService } from "../../coupon/index.js";

export class CartService {
  public constructor(private readonly cartRepository: CartRepository) {}

  public async getCart(
    customerId?: string,
    sessionId?: string,
  ): Promise<CartResponse> {
    const cart = await this.getOrCreateCartDocument(customerId, sessionId);
    await this.recalculateCart(cart);
    await cart.save();
    return this.toResponse(cart);
  }

  public async getCustomerCartByAdmin(
    customerId: string,
  ): Promise<CartResponse> {
    const customerObjId = toObjectId(customerId);
    let cart = await this.cartRepository.findActiveCart(customerObjId);

    if (!cart) {
      cart = new CartModel({
        userId: customerObjId,
        customerId: customerObjId,
        items: [],
        totalItems: 0,
      });
    }

    await this.recalculateCart(cart);
    await cart.save();
    return this.toResponse(cart);
  }

  public async clearCustomerCartByAdmin(
    customerId: string,
  ): Promise<CartResponse> {
    const customerObjId = toObjectId(customerId);
    let cart = await this.cartRepository.findActiveCart(customerObjId);

    if (!cart) {
      cart = new CartModel({
        userId: customerObjId,
        customerId: customerObjId,
        items: [],
        totalItems: 0,
      });
    }

    cart.items = [];
    cart.totalItems = 0;
    await this.recalculateCart(cart);
    await cart.save();
    return this.toResponse(cart);
  }

  public async addItem(
    customerId: string | undefined,
    sessionId: string | undefined,
    dto: AddCartItemDto,
  ): Promise<CartResponse> {
    if (dto.quantity <= 0) {
      throw new AppError(
        "Quantity must be greater than 0.",
        HTTP_STATUS.BAD_REQUEST,
        [],
        true,
        APP_ERROR_CODES.VALIDATION_ERROR,
      );
    }

    const targetSessionId = dto.sessionId ?? sessionId;
    const cart = await this.getOrCreateCartDocument(customerId, targetSessionId);

    const isCustomCakeItem =
      String(dto.productId).startsWith("custom") ||
      dto.productDetails?.name?.toLowerCase().includes("custom") ||
      Boolean(dto.customization?.tierCount || (dto.customization as any)?.tiers || dto.customCakeConfig?.tierCount || (dto.customCakeConfig as any)?.tiers);

    let productObjId: Types.ObjectId;
    let product: any = null;

    if (Types.ObjectId.isValid(dto.productId)) {
      productObjId = toObjectId(dto.productId);
      product = await ProductModel.findOne({
        _id: productObjId,
        isDeleted: { $ne: true },
      }).exec();
    } else {
      productObjId = new Types.ObjectId();
    }

    if (!product && isCustomCakeItem) {
      let customCakeProduct = await ProductModel.findOne({
        slug: "custom-celebration-cake",
      }).exec();

      if (!customCakeProduct) {
        try {
          const { CategoryModel } = await import("../../category/model/category.model.js");
          const firstCat = await CategoryModel.findOne({ isDeleted: { $ne: true } }).exec();
          customCakeProduct = await ProductModel.create({
            name: dto.productDetails?.name || "Custom Celebration Cake",
            nameHi: "कस्टमाइज़्ड सेलिब्रेशन केक",
            slug: "custom-celebration-cake",
            description: "Handcrafted custom tier celebration cake tailored to your specific flavor, design, and size.",
            categoryId: firstCat?._id || new Types.ObjectId(),
            productType: "CUSTOM_CAKE",
            price: dto.productDetails?.price || 649,
            isEggless: true,
            isAvailable: true,
            isActive: true,
            stockStatus: "IN_STOCK",
            trackInventory: false,
            allowBackorder: true,
            imageUrls: [dto.productDetails?.mainImage || "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=600&q=80"],
            thumbnailUrl: dto.productDetails?.mainImage || "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=600&q=80",
            seoTitle: "Custom Celebration Cake | OneBite Bakery",
            seoDescription: "Order freshly baked custom tiered celebration cakes with bespoke flavors and themes.",
            seoKeywords: ["custom cake", "celebration cake", "designer cake"],
          });
        } catch (_createErr) {
          customCakeProduct = await ProductModel.findOne({
            slug: "custom-celebration-cake",
          }).exec();
        }
      }

      if (customCakeProduct) {
        if (!customCakeProduct.isActive || !customCakeProduct.isAvailable || customCakeProduct.isDeleted) {
          customCakeProduct.isActive = true;
          customCakeProduct.isAvailable = true;
          customCakeProduct.isDeleted = false;
          customCakeProduct.deletedAt = undefined as any;
          customCakeProduct.deletedBy = undefined as any;
          await customCakeProduct.save();
        }
        product = customCakeProduct;
        productObjId = customCakeProduct._id;
      }
    }

    let isDecoration = false;
    if (!product) {
      try {
        const { DecorationModel } = await import("../../decoration/model/decoration.model.js");
        if (DecorationModel.db?.readyState === 1 && Types.ObjectId.isValid(dto.productId)) {
          const dec = await DecorationModel.findOne({ _id: toObjectId(dto.productId), isActive: true }).exec();
          if (dec) {
            isDecoration = true;
            product = {
              _id: dec._id,
              name: dec.name,
              slug: dec.slug || String(dec._id),
              price: dec.price,
              compareAtPrice: dec.originalPrice,
              thumbnailUrl: dec.image,
              imageUrls: [dec.image],
              productType: "DECORATION",
              stockStatus: dec.inStock ? "IN_STOCK" : "OUT_OF_STOCK",
              isActive: dec.isActive,
              isAvailable: dec.inStock,
              trackInventory: false,
              allowBackorder: true,
            };
            productObjId = dec._id;
          }
        }
      } catch (_err) {
        // fallback
      }
    }

    if (!product || !product.isActive || !product.isAvailable) {
      throw new AppError(
        "Product is currently unavailable for your selected location.",
        HTTP_STATUS.UNPROCESSABLE_ENTITY,
        [],
        true,
        APP_ERROR_CODES.CART_PRODUCT_UNAVAILABLE,
      );
    }

    if (customerId && !isDecoration && !isCustomCakeItem) {
      try {
        const { UserModel } = await import("../../user/model/user.model.js");
        if (UserModel.db?.readyState === 1) {
          const userDoc = await UserModel.findById(toObjectId(customerId)).exec();
          if (userDoc?.currentLocation?.villageId) {
            const { BranchService } = await import("../../branch/service/branch.service.js");
            const { BranchRepository } = await import("../../branch/repository/branch.repository.js");
            const { BranchProductModel } = await import("../../branch/model/branch-product.model.js");

            const branchService = new BranchService(new BranchRepository());
            const branchDoc = await branchService.resolveBranchForVillage(userDoc.currentLocation.villageId);

            if (branchDoc) {
              const branchProduct = await BranchProductModel.findOne({
                branchId: branchDoc._id,
                productId: product._id,
              }).exec();

              if (branchProduct && !branchProduct.isAvailable) {
                throw new AppError(
                  "Product is currently unavailable for your selected location.",
                  HTTP_STATUS.UNPROCESSABLE_ENTITY,
                  [],
                  true,
                  APP_ERROR_CODES.CART_PRODUCT_UNAVAILABLE,
                );
              }
            }
          }
        }
      } catch (err) {
        if (err instanceof AppError) throw err;
      }
    }


    const customization = dto.customization ?? dto.customCakeConfig;

    const existingIndex = cart.items.findIndex(
      (item) =>
        item.productId.toString() === productObjId.toString() &&
        this.areConfigsEqual(
          item.customization ?? item.customCakeConfig,
          customization,
        ),
    );

    if (existingIndex >= 0) {
      const existingItem = cart.items[existingIndex];
      if (!existingItem) {
        throw new AppError(
          "Cart item not found.",
          HTTP_STATUS.NOT_FOUND,
          [],
          true,
          APP_ERROR_CODES.CART_ITEM_NOT_FOUND,
        );
      }
      const itemPrice =
        typeof dto.productDetails?.price === "number" && dto.productDetails.price > 0
          ? dto.productDetails.price
          : typeof (dto.selectedVariant as any)?.price === "number"
          ? (dto.selectedVariant as any).price
          : typeof (customization as any)?.estimatedPrice === "number" && (customization as any).estimatedPrice > 0
          ? (customization as any).estimatedPrice
          : product.price;

      const itemName = dto.productDetails?.name || product.name;
      const itemImage =
        dto.productDetails?.mainImage ||
        product.thumbnailUrl ||
        (product.imageUrls && product.imageUrls.length > 0 ? product.imageUrls[0] : undefined);

      const newQuantity = existingItem.quantity + dto.quantity;

      if (
        product.trackInventory &&
        !product.allowBackorder &&
        newQuantity > product.stockQuantity
      ) {
        existingItem.quantity = product.stockQuantity;
      } else {
        existingItem.quantity = newQuantity;
      }

      existingItem.unitPrice = itemPrice;
      existingItem.unitPriceSnapshot = itemPrice;
      existingItem.totalPrice = itemPrice * existingItem.quantity;
      if (dto.notes) existingItem.notes = dto.notes;
    } else {
      const itemPrice =
        typeof dto.productDetails?.price === "number" && dto.productDetails.price > 0
          ? dto.productDetails.price
          : typeof (dto.selectedVariant as any)?.price === "number"
          ? (dto.selectedVariant as any).price
          : typeof (customization as any)?.estimatedPrice === "number" && (customization as any).estimatedPrice > 0
          ? (customization as any).estimatedPrice
          : product.price;

      const itemName = dto.productDetails?.name || product.name;
      const itemImage =
        dto.productDetails?.mainImage ||
        product.thumbnailUrl ||
        (product.imageUrls && product.imageUrls.length > 0 ? product.imageUrls[0] : undefined);

      const newItem: Partial<CartItem> = {
        _id: new Types.ObjectId(),
        productId: productObjId,
        quantity: dto.quantity,
        unitPriceSnapshot: itemPrice,
        unitPrice: itemPrice,
        totalPrice: itemPrice * dto.quantity,
        productType: isCustomCakeItem ? "CUSTOM_CAKE" : product.productType,
        ...(customization ? { customization, customCakeConfig: customization } : {}),
        ...(dto.selectedVariant ? { selectedVariant: dto.selectedVariant } : {}),
        productSnapshot: {
          name: itemName,
          slug: dto.productDetails?.slug || product.slug,
          thumbnailUrl: itemImage,
          productType: isCustomCakeItem ? "CUSTOM_CAKE" : product.productType,
          isInstantAvailable: Boolean(product.isInstantAvailable),
        },
        addedAt: new Date(),
        ...(dto.notes ? { notes: dto.notes } : {}),
      };

      cart.items.push(newItem as CartItem);
    }

    await this.recalculateCart(cart);
    await cart.save();

    return this.toResponse(cart);
  }

  public async updateQuantity(
    customerId: string | undefined,
    sessionId: string | undefined,
    itemId: string,
    quantity: number,
  ): Promise<CartResponse> {
    return this.updateItem(customerId, sessionId, itemId, { quantity });
  }

  public async updateItem(
    customerId: string | undefined,
    sessionId: string | undefined,
    itemId: string,
    dto: UpdateCartItemDto,
  ): Promise<CartResponse> {
    if (dto.quantity !== undefined && dto.quantity <= 0) {
      throw new AppError(
        "Quantity must be greater than 0.",
        HTTP_STATUS.BAD_REQUEST,
        [],
        true,
        APP_ERROR_CODES.VALIDATION_ERROR,
      );
    }

    const targetSessionId = dto.sessionId ?? sessionId;
    const cart = await this.getOrCreateCartDocument(customerId, targetSessionId);

    const itemIndex = cart.items.findIndex(
      (item) => item._id.toString() === itemId,
    );

    if (itemIndex < 0) {
      throw new AppError(
        "Cart item not found.",
        HTTP_STATUS.NOT_FOUND,
        [],
        true,
        APP_ERROR_CODES.CART_ITEM_NOT_FOUND,
      );
    }

    const item = cart.items[itemIndex];
    if (!item) {
      throw new AppError(
        "Cart item not found.",
        HTTP_STATUS.NOT_FOUND,
        [],
        true,
        APP_ERROR_CODES.CART_ITEM_NOT_FOUND,
      );
    }

    if (typeof dto.quantity === "number") {
      item.quantity = dto.quantity;
    }

    if (dto.notes !== undefined) {
      item.notes = dto.notes;
    }

    await this.recalculateCart(cart);
    await cart.save();

    return this.toResponse(cart);
  }

  public async removeItem(
    customerId: string | undefined,
    sessionId: string | undefined,
    itemId: string,
  ): Promise<CartResponse> {
    const cart = await this.getOrCreateCartDocument(customerId, sessionId);

    cart.items = cart.items.filter((item) => item._id.toString() !== itemId);

    await this.recalculateCart(cart);
    await cart.save();

    return this.toResponse(cart);
  }

  public async clearCart(
    customerId?: string,
    sessionId?: string,
  ): Promise<CartResponse> {
    const cart = await this.getOrCreateCartDocument(customerId, sessionId);

    cart.items = [];
    cart.totalItems = 0;
    await this.recalculateCart(cart);
    await cart.save();

    return this.toResponse(cart);
  }

  public async mergeCart(
    customerId: string,
    sessionId: string,
  ): Promise<CartResponse> {
    if (!sessionId) {
      return this.getCart(customerId);
    }

    const customerObjId = toObjectId(customerId);
    const guestCart = await this.cartRepository.findBySessionId(sessionId);

    let customerCart = await this.cartRepository.findActiveCart(customerObjId);
    if (!customerCart) {
      customerCart = new CartModel({
        userId: customerObjId,
        customerId: customerObjId,
        items: [],
        totalItems: 0,
      });
    }

    if (guestCart && guestCart.items.length > 0) {
      for (const guestItem of guestCart.items) {
        const existingIndex = customerCart.items.findIndex(
          (item) =>
            item.productId.toString() === guestItem.productId.toString() &&
            this.areConfigsEqual(
              item.customization ?? item.customCakeConfig,
              guestItem.customization ?? guestItem.customCakeConfig,
            ),
        );

        if (existingIndex >= 0) {
          const existingItem = customerCart.items[existingIndex];
          if (existingItem) {
            existingItem.quantity += guestItem.quantity;
          }
        } else {
          customerCart.items.push(guestItem);
        }
      }

      await this.cartRepository.deleteBySessionId(sessionId);
    }

    await this.recalculateCart(customerCart);
    await customerCart.save();

    return this.toResponse(customerCart);
  }

  public async getOrCreateCartDocument(
    customerId?: string,
    sessionId?: string,
  ): Promise<HydratedDocument<Cart>> {
    if (customerId) {
      const customerObjId = toObjectId(customerId);
      let cart = await this.cartRepository.findActiveCart(customerObjId);
      if (!cart) {
        cart = new CartModel({
          userId: customerObjId,
          customerId: customerObjId,
          items: [],
          totalItems: 0,
        });
      }
      return cart;
    }

    if (sessionId && sessionId.trim().length > 0) {
      let cart = await this.cartRepository.findBySessionId(sessionId);
      if (!cart) {
        cart = new CartModel({
          sessionId,
          items: [],
          totalItems: 0,
        });
      }
      return cart;
    }

    throw new AppError(
      "Cart access requires a customerId or sessionId.",
      HTTP_STATUS.BAD_REQUEST,
      [],
      true,
      APP_ERROR_CODES.VALIDATION_ERROR,
    );
  }

  public async recalculateCart(cart: HydratedDocument<Cart>): Promise<void> {
    if (!cart.items || cart.items.length === 0) {
      cart.items = [];
      cart.totalItems = 0;
      cart.subtotal = 0;
      cart.estimatedDiscount = 0;
      cart.estimatedTax = 0;
      cart.estimatedDeliveryCharge = 0;
      cart.grandTotal = 0;
      cart.homeDeliveryAvailable = false;
      cart.pickupAvailable = true;
      return;
    }

    const productIds = cart.items.map((item) => item.productId);
    const products = await ProductModel.find({
      _id: { $in: productIds },
    }).exec();

    const productMap = new Map<string, any>();
    for (const prod of products) {
      productMap.set(prod._id.toString(), prod);
    }

    try {
      const { DecorationModel } = await import("../../decoration/model/decoration.model.js");
      if (DecorationModel.db?.readyState === 1) {
        const decorations = await DecorationModel.find({
          _id: { $in: productIds },
          isActive: true,
        }).exec();
        for (const dec of decorations) {
          productMap.set(dec._id.toString(), {
            _id: dec._id,
            name: dec.name,
            slug: dec.slug || String(dec._id),
            price: dec.price,
            compareAtPrice: dec.originalPrice,
            thumbnailUrl: dec.image,
            imageUrls: [dec.image],
            productType: "DECORATION",
            stockStatus: dec.inStock ? "IN_STOCK" : "OUT_OF_STOCK",
            isActive: dec.isActive,
            isAvailable: dec.inStock,
            trackInventory: false,
            allowBackorder: true,
          });
        }
      }
    } catch (_err) {
      // fallback
    }

    const validItems: CartItem[] = [];

    for (const item of cart.items) {
      let product = productMap.get(item.productId.toString());

      const isCustomItem =
        item.productType === "CUSTOM_CAKE" ||
        product?.productType === "CUSTOM_CAKE" ||
        product?.slug === "custom-celebration-cake" ||
        Boolean(
          item.customization?.tierCount ||
          (item.customization as any)?.tiers ||
          item.customCakeConfig?.tierCount ||
          (item.customCakeConfig as any)?.tiers ||
          (item.customization as any)?.estimatedPrice ||
          (item.customCakeConfig as any)?.estimatedPrice
        );

      if (isCustomItem) {
        if (!product) {
          product = {
            _id: item.productId,
            name: item.productSnapshot?.name || "Custom Celebration Cake",
            slug: item.productSnapshot?.slug || "custom-celebration-cake",
            price: item.unitPriceSnapshot || (item.customization as any)?.estimatedPrice || 649,
            thumbnailUrl: item.productSnapshot?.thumbnailUrl || "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=600&q=80",
            imageUrls: [item.productSnapshot?.thumbnailUrl || "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=600&q=80"],
            productType: "CUSTOM_CAKE",
            stockStatus: "IN_STOCK",
            isActive: true,
            isAvailable: true,
            trackInventory: false,
            allowBackorder: true,
          };
        } else {
          product.isActive = true;
          product.isAvailable = true;
          if (product.isDeleted) {
            product.isDeleted = false;
          }
        }
      }

      if (!product || !product.isActive || !product.isAvailable || (!isCustomItem && product.isDeleted)) {
        continue; // Automatically remove inactive or unavailable product
      }

      let quantity = item.quantity;
      if (quantity < 1) {
        continue;
      }

      if (!isCustomItem && product.trackInventory && !product.allowBackorder) {
        if (product.stockQuantity <= 0) {
          continue; // Out of stock
        }
        if (quantity > product.stockQuantity) {
          quantity = product.stockQuantity;
        }
      }

      const resolvedUnitPrice = isCustomItem
        ? (item.unitPriceSnapshot ||
           (item.customization as any)?.estimatedPrice ||
           (item.customCakeConfig as any)?.estimatedPrice ||
           item.unitPrice ||
           product.price)
        : (item.unitPriceSnapshot || product.price);

      item.quantity = quantity;
      item.unitPriceSnapshot = resolvedUnitPrice;
      item.unitPrice = resolvedUnitPrice;
      item.totalPrice = resolvedUnitPrice * quantity;
      item.productType = isCustomItem ? "CUSTOM_CAKE" : product.productType;
      item.productSnapshot = {
        name: isCustomItem && item.productSnapshot?.name ? item.productSnapshot.name : product.name,
        slug: isCustomItem && item.productSnapshot?.slug ? item.productSnapshot.slug : product.slug,
        thumbnailUrl: isCustomItem && item.productSnapshot?.thumbnailUrl ? item.productSnapshot.thumbnailUrl : product.thumbnailUrl,
        productType: isCustomItem ? "CUSTOM_CAKE" : product.productType,
        isInstantAvailable: Boolean(product.isInstantAvailable),
      };

      if (!item.addedAt) {
        item.addedAt = new Date();
      }

      validItems.push(item);
    }

    cart.items = validItems;
    cart.totalItems = validItems.reduce((sum, item) => sum + item.quantity, 0);

    const subtotal = validItems.reduce(
      (sum, item) => sum + item.totalPrice,
      0,
    );
    cart.subtotal = subtotal;

    // Evaluate coupon code if present
    if (cart.couponCode) {
      try {
        const couponRes = await couponService.validateAndCalculateDiscount(
          cart.couponCode,
          subtotal,
        );
        cart.couponDiscount = couponRes.discountAmount;
        cart.estimatedDiscount = couponRes.discountAmount;
      } catch (_err) {
        // If minimum subtotal not met or coupon expired, reset applied coupon
        cart.couponCode = undefined;
        cart.couponDiscount = 0;
        cart.estimatedDiscount = 0;
      }
    } else {
      cart.couponDiscount = 0;
      cart.estimatedDiscount = 0;
    }

    // Delivery rules from store settings
    const settings = await SettingsModel.findOne({ singletonKey: "default" })
      .lean()
      .exec();

    const minHomeDeliveryAmount =
      settings?.delivery?.minimumHomeDeliveryAmount ?? 0;
    const baseDeliveryCharge = settings?.deliveryCharge ?? 0;
    const isDeliveryEnabled = settings?.isDeliveryEnabled ?? true;
    const isPickupEnabled = settings?.isPickupEnabled ?? true;

    if (subtotal < minHomeDeliveryAmount) {
      cart.homeDeliveryAvailable = false;
      cart.pickupAvailable = isPickupEnabled;
      cart.estimatedDeliveryCharge = 0;
    } else {
      cart.homeDeliveryAvailable = isDeliveryEnabled;
      cart.pickupAvailable = isPickupEnabled;
      cart.estimatedDeliveryCharge =
        isDeliveryEnabled && subtotal > 0 ? baseDeliveryCharge : 0;
    }

    cart.grandTotal =
      Math.max(0, cart.subtotal - cart.estimatedDiscount) +
      cart.estimatedTax +
      cart.estimatedDeliveryCharge;
  }

  private areConfigsEqual(
    config1?: CustomCakeConfig,
    config2?: CustomCakeConfig,
  ): boolean {
    if (!config1 && !config2) return true;
    if (!config1 || !config2) return false;

    return (
      config1.flavour === config2.flavour &&
      config1.weightKg === config2.weightKg &&
      config1.tierCount === config2.tierCount &&
      config1.eggPreference === config2.eggPreference &&
      config1.messageOnCake === config2.messageOnCake &&
      config1.specialInstructions === config2.specialInstructions
    );
  }

  public async applyCoupon(
    customerId?: string,
    sessionId?: string,
    code?: string,
  ): Promise<CartResponse> {
    if (!code) {
      throw new AppError(
        "Coupon code is required.",
        HTTP_STATUS.BAD_REQUEST,
        [],
        true,
        APP_ERROR_CODES.VALIDATION_ERROR,
      );
    }

    const cart = await this.getOrCreateCartDocument(customerId, sessionId);
    await this.recalculateCart(cart);

    if (cart.items.length === 0) {
      throw new AppError(
        "Cannot apply coupon to an empty cart.",
        HTTP_STATUS.BAD_REQUEST,
        [],
        true,
        APP_ERROR_CODES.ORDER_CART_EMPTY,
      );
    }

    // Validate coupon and throw if invalid
    const discountRes = await couponService.validateAndCalculateDiscount(
      code,
      cart.subtotal,
    );

    cart.couponCode = discountRes.code;
    cart.couponDiscount = discountRes.discountAmount;
    cart.estimatedDiscount = discountRes.discountAmount;
    await this.recalculateCart(cart);
    await cart.save();

    return this.toResponse(cart);
  }

  public async removeCoupon(
    customerId?: string,
    sessionId?: string,
  ): Promise<CartResponse> {
    const cart = await this.getOrCreateCartDocument(customerId, sessionId);
    cart.couponCode = undefined;
    cart.couponDiscount = 0;
    cart.estimatedDiscount = 0;
    await this.recalculateCart(cart);
    await cart.save();

    return this.toResponse(cart);
  }

  private toResponse(cart: HydratedDocument<Cart>): CartResponse {
    return {
      id: cart._id.toString(),
      ...(cart.userId ? { userId: cart.userId.toString() } : {}),
      ...(cart.customerId ? { customerId: cart.customerId.toString() } : {}),
      ...(cart.sessionId ? { sessionId: cart.sessionId } : {}),
      items: cart.items.map((item) => ({
        id: item._id.toString(),
        productId: item.productId.toString(),
        quantity: item.quantity,
        unitPriceSnapshot: item.unitPriceSnapshot ?? item.unitPrice,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
        productType: item.productType,
        ...(item.customization ? { customization: item.customization } : {}),
        ...(item.customCakeConfig ? { customCakeConfig: item.customCakeConfig } : {}),
        productSnapshot: item.productSnapshot,
        addedAt: item.addedAt ?? cart.createdAt,
        ...(item.selectedVariant ? { selectedVariant: item.selectedVariant } : {}),
        ...(item.notes ? { notes: item.notes } : {}),
      })),
      totalItems: cart.totalItems,
      subtotal: cart.subtotal,
      estimatedDiscount: cart.estimatedDiscount,
      estimatedTax: cart.estimatedTax,
      estimatedDeliveryCharge: cart.estimatedDeliveryCharge,
      grandTotal: cart.grandTotal,
      homeDeliveryAvailable: cart.homeDeliveryAvailable,
      pickupAvailable: cart.pickupAvailable,
      appliedOffers: cart.appliedOffers,
      ...(cart.couponCode ? { couponCode: cart.couponCode } : {}),
      couponDiscount: cart.couponDiscount ?? 0,
      createdAt: cart.createdAt,
      updatedAt: cart.updatedAt,
    };
  }
}
