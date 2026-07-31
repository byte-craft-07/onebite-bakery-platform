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

    const productObjId = toObjectId(dto.productId);
    const product = await ProductModel.findOne({
      _id: productObjId,
      isDeleted: false,
    }).exec();

    if (!product || !product.isActive || !product.isAvailable) {
      throw new AppError(
        "Product is currently unavailable or inactive.",
        HTTP_STATUS.UNPROCESSABLE_ENTITY,
        [],
        true,
        APP_ERROR_CODES.CART_PRODUCT_UNAVAILABLE,
      );
    }

    if (product.trackInventory && !product.allowBackorder) {
      if (product.stockQuantity < dto.quantity) {
        throw new AppError(
          `Insufficient stock. Available quantity: ${product.stockQuantity}.`,
          HTTP_STATUS.UNPROCESSABLE_ENTITY,
          [],
          true,
          APP_ERROR_CODES.CART_INSUFFICIENT_STOCK,
        );
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

      if (dto.notes) existingItem.notes = dto.notes;
    } else {
      const newItem: Partial<CartItem> = {
        _id: new Types.ObjectId(),
        productId: productObjId,
        quantity: dto.quantity,
        unitPriceSnapshot: product.price,
        unitPrice: product.price,
        totalPrice: product.price * dto.quantity,
        productType: product.productType,
        ...(customization ? { customization, customCakeConfig: customization } : {}),
        ...(dto.selectedVariant ? { selectedVariant: dto.selectedVariant } : {}),
        productSnapshot: {
          name: product.name,
          slug: product.slug,
          thumbnailUrl: product.thumbnailUrl,
          productType: product.productType,
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
      "Session ID or authentication is required for cart access.",
      HTTP_STATUS.BAD_REQUEST,
      [],
      true,
      APP_ERROR_CODES.CART_SESSION_ID_REQUIRED,
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
      isActive: true,
      isDeleted: false,
    }).exec();

    const productMap = new Map<string, Product>();
    for (const prod of products) {
      productMap.set(prod._id.toString(), prod);
    }

    const validItems: CartItem[] = [];

    for (const item of cart.items) {
      const product = productMap.get(item.productId.toString());
      if (!product || !product.isActive || !product.isAvailable) {
        continue; // Automatically remove inactive or unavailable product
      }

      let quantity = item.quantity;
      if (quantity < 1) {
        continue;
      }

      if (product.trackInventory && !product.allowBackorder) {
        if (product.stockQuantity <= 0) {
          continue; // Out of stock
        }
        if (quantity > product.stockQuantity) {
          quantity = product.stockQuantity;
        }
      }

      item.quantity = quantity;
      item.unitPriceSnapshot = product.price;
      item.unitPrice = product.price;
      item.totalPrice = product.price * quantity;
      item.productType = product.productType;
      item.productSnapshot = {
        name: product.name,
        slug: product.slug,
        thumbnailUrl: product.thumbnailUrl,
        productType: product.productType,
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

    // Delivery rules from store settings
    const settings = await SettingsModel.findOne({ singletonKey: "default" })
      .lean()
      .exec();

    const minHomeDeliveryAmount =
      settings?.delivery?.minimumHomeDeliveryAmount ?? 300;
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
      cart.subtotal -
      cart.estimatedDiscount +
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
      createdAt: cart.createdAt,
      updatedAt: cart.updatedAt,
    };
  }
}
