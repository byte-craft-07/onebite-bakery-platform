import crypto from "node:crypto";
import type { HydratedDocument } from "mongoose";

import { toObjectId } from "../../../db/utils/object-id.js";
import { APP_ERROR_CODES } from "../../../shared/constants/app-error-code.js";
import { HTTP_STATUS } from "../../../shared/constants/http-status.js";
import { AppError } from "../../../shared/errors/app-error.js";
import type { RequestContext } from "../../../shared/types/request-context.types.js";
import { AddressModel } from "../../address/index.js";
import { CartRepository, CartService } from "../../cart/index.js";
import { CategoryModel } from "../../category/index.js";
import { OccasionModel } from "../../occasion/index.js";
import { ProductModel } from "../../product/index.js";
import type { OrderNotificationService } from "../../notification/index.js";
import {
  VALID_STATUS_TRANSITIONS,
} from "../constants/index.js";
import type {
  CancelOrderDto,
  CreateOrderDto,
  ListOrdersFilterDto,
  UpdateOrderStatusDto,
  UpdateReadyTimeDto,
} from "../dto/index.js";
import {
  type Order,
  type OrderAddressSnapshot,
  type OrderItemSnapshot,
  type OrderPricingSnapshot,
} from "../model/index.js";
import type { OrderRepository } from "../repository/index.js";
import type { OrderResponse, ReorderResultResponse } from "../types/index.js";

export class OrderService {
  private readonly cartService: CartService;

  public constructor(
    private readonly orderRepository: OrderRepository,
    cartService?: CartService,
    private readonly orderNotificationService?: OrderNotificationService,
  ) {
    this.cartService = cartService ?? new CartService(new CartRepository());
  }

  public async createOrder(
    customerId: string,
    dto: CreateOrderDto,
    context: RequestContext,
  ): Promise<OrderResponse> {
    const customerObjId = toObjectId(customerId);

    // 1. Read & Validate Cart
    const cart = await this.cartService.getOrCreateCartDocument(customerId);
    await this.cartService.recalculateCart(cart);

    if (!cart.items || cart.items.length === 0) {
      throw new AppError(
        "Cart is empty. Add items to cart before placing an order.",
        HTTP_STATUS.BAD_REQUEST,
        [],
        true,
        APP_ERROR_CODES.ORDER_CART_EMPTY,
      );
    }

    // 2. Validate Delivery Method & Address Snapshot
    let addressSnapshot: OrderAddressSnapshot | undefined;

    if (dto.deliveryMethod === "HOME_DELIVERY") {
      if (!cart.homeDeliveryAvailable) {
        throw new AppError(
          "Home delivery is not available for this cart total.",
          HTTP_STATUS.UNPROCESSABLE_ENTITY,
          [],
          true,
          APP_ERROR_CODES.ORDER_MINIMUM_DELIVERY_NOT_MET,
        );
      }

      if (dto.addressId) {
        const addressDoc = await AddressModel.findOne({
          _id: toObjectId(dto.addressId),
          userId: customerObjId,
        }).exec();

        if (!addressDoc) {
          throw new AppError(
            "Specified delivery address not found.",
            HTTP_STATUS.NOT_FOUND,
            [],
            true,
            APP_ERROR_CODES.ORDER_ADDRESS_REQUIRED,
          );
        }

        addressSnapshot = {
          addressId: addressDoc._id,
          fullName: addressDoc.fullName,
          phone: addressDoc.phone,
          street: addressDoc.address,
          city: addressDoc.city,
          state: addressDoc.state,
          pincode: addressDoc.pincode,
          ...(addressDoc.landmark ? { landmark: addressDoc.landmark } : {}),
        };
      } else if (dto.address) {
        addressSnapshot = {
          fullName: dto.address.fullName,
          phone: dto.address.phone,
          street: dto.address.street,
          city: dto.address.city,
          state: dto.address.state,
          pincode: dto.address.pincode,
          ...(dto.address.landmark ? { landmark: dto.address.landmark } : {}),
        };
      } else {
        throw new AppError(
          "Delivery address is required for home delivery orders.",
          HTTP_STATUS.BAD_REQUEST,
          [],
          true,
          APP_ERROR_CODES.ORDER_ADDRESS_REQUIRED,
        );
      }
    }

    // 3. Create Immutable Order Item Snapshots
    const orderItemSnapshots: OrderItemSnapshot[] = [];

    for (const cartItem of cart.items) {
      const product = await ProductModel.findOne({
        _id: cartItem.productId,
        isActive: true,
        isDeleted: false,
      }).exec();

      if (!product || !product.isAvailable) {
        throw new AppError(
          `Product '${cartItem.productSnapshot.name}' is no longer available.`,
          HTTP_STATUS.UNPROCESSABLE_ENTITY,
          [],
          true,
          APP_ERROR_CODES.PRODUCT_INVALID_AVAILABILITY,
        );
      }

      if (product.trackInventory && !product.allowBackorder) {
        if (product.stockQuantity < cartItem.quantity) {
          throw new AppError(
            `Insufficient stock for product '${product.name}'. Available: ${product.stockQuantity}.`,
            HTTP_STATUS.UNPROCESSABLE_ENTITY,
            [],
            true,
            APP_ERROR_CODES.CART_INSUFFICIENT_STOCK,
          );
        }
      }

      let categoryName: string | undefined;
      if (product.categoryId) {
        const cat = await CategoryModel.findById(product.categoryId).lean().exec();
        if (cat) categoryName = cat.name;
      }

      let occasionName: string | undefined;
      if (product.occasionIds && product.occasionIds.length > 0) {
        const occ = await OccasionModel.findById(product.occasionIds[0]).lean().exec();
        if (occ) occasionName = occ.name;
      }

      const customization = cartItem.customization ?? cartItem.customCakeConfig;

      orderItemSnapshots.push({
        productId: product._id,
        productNameSnapshot: product.name,
        productName: product.name,
        slug: product.slug,
        ...(categoryName ? { categoryName } : {}),
        ...(occasionName ? { occasionName } : {}),
        productType: product.productType,
        ...(product.thumbnailUrl
          ? { image: product.thumbnailUrl }
          : product.imageUrls[0]
          ? { image: product.imageUrls[0] }
          : {}),
        unitPriceSnapshot: product.price,
        unitPrice: product.price,
        quantity: cartItem.quantity,
        subtotal: product.price * cartItem.quantity,
        ...(customization ? { customization, customCakeConfig: customization } : {}),
        ...(cartItem.selectedVariant
          ? { selectedVariant: cartItem.selectedVariant }
          : {}),
        ...(cartItem.notes ? { notes: cartItem.notes } : {}),
      });
    }

    // 4. Pricing Snapshot
    const deliveryCharge =
      dto.deliveryMethod === "HOME_DELIVERY"
        ? cart.estimatedDeliveryCharge
        : 0;

    const subtotal = cart.subtotal;
    const grandTotal =
      subtotal - cart.estimatedDiscount + cart.estimatedTax + deliveryCharge;

    const pricingSnapshot: OrderPricingSnapshot = {
      subtotal,
      tax: cart.estimatedTax,
      deliveryCharge,
      discount: cart.estimatedDiscount,
      grandTotal,
      homeDeliveryAvailable: cart.homeDeliveryAvailable,
      pickupAvailable: cart.pickupAvailable,
    };

    // 5. Generate Human-Readable Unique Order Number (OB-YYYYMMDD-XXXXXX)
    const datePrefix = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const randomSuffix = crypto.randomBytes(3).toString("hex").toUpperCase();
    const orderNumber = `OB-${datePrefix}-${randomSuffix}`;

    // 6. Persist Order Document
    const order = await this.orderRepository.createOrder({
      orderNumber,
      userId: customerObjId,
      customerId: customerObjId,
      ...(addressSnapshot?.addressId ? { addressId: addressSnapshot.addressId } : {}),
      items: orderItemSnapshots,
      ...(addressSnapshot ? { addressSnapshot } : {}),
      pricingSnapshot,
      subtotal,
      deliveryCharge,
      totalAmount: grandTotal,
      deliveryMethod: dto.deliveryMethod,
      orderStatus: "PENDING",
      paymentStatus: "PENDING",
      ...(dto.notes ? { notes: dto.notes } : {}),
      ...(dto.scheduledDate ? { scheduledDate: new Date(dto.scheduledDate) } : {}),
      ...(dto.scheduledTimeSlot ? { scheduledTimeSlot: dto.scheduledTimeSlot } : {}),
    });

    // 7. Clear Customer Cart only after successful order creation
    await this.cartService.clearCart(customerId);

    const response = this.toResponse(order);
    void this.orderNotificationService?.dispatchOrderCreated(response);

    return response;
  }

  public async getOrder(
    customerId: string,
    orderId: string,
  ): Promise<OrderResponse> {
    return this.getCustomerOrderById(customerId, orderId);
  }

  public async getCustomerOrders(
    customerId: string,
    page = 1,
    limit = 20,
  ): Promise<{
    orders: OrderResponse[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  }> {
    const customerObjId = toObjectId(customerId);
    const result = await this.orderRepository.findCustomerOrders(
      customerObjId,
      page,
      limit,
    );

    return {
      orders: result.items.map((item) => this.toResponse(item)),
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      },
    };
  }

  public async listCustomerOrders(
    customerId: string,
    page = 1,
    limit = 20,
  ) {
    return this.getCustomerOrders(customerId, page, limit);
  }

  public async getCustomerOrderById(
    customerId: string,
    orderId: string,
  ): Promise<OrderResponse> {
    const orderObjId = toObjectId(orderId);
    const order = await this.orderRepository.findById(orderObjId);

    if (!order) {
      throw this.createNotFoundError();
    }

    if (
      order.customerId.toString() !== customerId &&
      order.userId?.toString() !== customerId
    ) {
      throw new AppError(
        "You are not authorized to view this order.",
        HTTP_STATUS.FORBIDDEN,
        [],
        true,
        APP_ERROR_CODES.AUTHORIZATION_FAILED,
      );
    }

    return this.toResponse(order);
  }

  public async cancelOrder(
    customerId: string,
    orderId: string,
    dto: CancelOrderDto,
    context: RequestContext,
  ): Promise<OrderResponse> {
    return this.cancelCustomerOrder(customerId, orderId, dto, context);
  }

  public async cancelCustomerOrder(
    customerId: string,
    orderId: string,
    dto: CancelOrderDto,
    _context: RequestContext,
  ): Promise<OrderResponse> {
    const orderObjId = toObjectId(orderId);
    const order = await this.orderRepository.findById(orderObjId);

    if (!order) {
      throw this.createNotFoundError();
    }

    if (
      order.customerId.toString() !== customerId &&
      order.userId?.toString() !== customerId
    ) {
      throw new AppError(
        "You are not authorized to cancel this order.",
        HTTP_STATUS.FORBIDDEN,
        [],
        true,
        APP_ERROR_CODES.AUTHORIZATION_FAILED,
      );
    }

    if (order.orderStatus !== "PENDING" && order.orderStatus !== "CONFIRMED") {
      throw new AppError(
        `Order cannot be cancelled in state '${order.orderStatus}'. Customers can cancel only before PREPARING state.`,
        HTTP_STATUS.UNPROCESSABLE_ENTITY,
        [],
        true,
        APP_ERROR_CODES.ORDER_CANCELLATION_NOT_ALLOWED,
      );
    }

    const updated = await this.orderRepository.updateStatus(
      orderObjId,
      "CANCELLED",
      dto.cancellationReason ?? "Cancelled by customer",
      toObjectId(customerId),
    );

    if (!updated) {
      throw this.createNotFoundError();
    }

    const response = this.toResponse(updated);
    void this.orderNotificationService?.dispatchOrderStatusUpdated(response);

    return response;
  }

  public async reorder(
    customerId: string,
    orderId: string,
  ): Promise<ReorderResultResponse> {
    const orderObjId = toObjectId(orderId);
    const order = await this.orderRepository.findById(orderObjId);

    if (!order) {
      throw this.createNotFoundError();
    }

    if (
      order.customerId.toString() !== customerId &&
      order.userId?.toString() !== customerId
    ) {
      throw new AppError(
        "You are not authorized to reorder items from this order.",
        HTTP_STATUS.FORBIDDEN,
        [],
        true,
        APP_ERROR_CODES.AUTHORIZATION_FAILED,
      );
    }

    await this.cartService.clearCart(customerId);

    const skippedItems: string[] = [];

    for (const item of order.items) {
      const product = await ProductModel.findOne({
        _id: item.productId,
        isActive: true,
        isDeleted: false,
      }).exec();

      if (!product || !product.isAvailable) {
        skippedItems.push(item.productName);
        continue;
      }

      if (product.trackInventory && !product.allowBackorder) {
        if (product.stockQuantity <= 0) {
          skippedItems.push(item.productName);
          continue;
        }
      }

      try {
        await this.cartService.addItem(customerId, undefined, {
          productId: product._id.toString(),
          quantity: item.quantity,
          ...(item.selectedVariant
            ? { selectedVariant: item.selectedVariant }
            : {}),
          ...(item.customization ?? item.customCakeConfig
            ? { customization: item.customization ?? item.customCakeConfig }
            : {}),
          ...(item.notes ? { notes: item.notes } : {}),
        });
      } catch (_err) {
        skippedItems.push(item.productName);
      }
    }

    const updatedCart = await this.cartService.getCart(customerId);

    return {
      cart: updatedCart,
      skippedItems,
    };
  }

  public async adminListOrders(
    query: ListOrdersFilterDto,
  ): Promise<{
    orders: OrderResponse[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  }> {
    const result = await this.orderRepository.findAllOrders(query);

    return {
      orders: result.items.map((item) => this.toResponse(item)),
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      },
    };
  }

  public async adminGetOrderById(orderId: string): Promise<OrderResponse> {
    const orderObjId = toObjectId(orderId);
    const order = await this.orderRepository.findById(orderObjId);

    if (!order) {
      throw this.createNotFoundError();
    }

    return this.toResponse(order);
  }

  public async adminUpdateOrderStatus(
    orderId: string,
    dto: UpdateOrderStatusDto,
    context: RequestContext,
  ): Promise<OrderResponse> {
    const orderObjId = toObjectId(orderId);
    const order = await this.orderRepository.findById(orderObjId);

    if (!order) {
      throw this.createNotFoundError();
    }

    const currentStatus = order.orderStatus;
    const nextStatus = dto.status;

    if (currentStatus !== nextStatus) {
      const allowedNextStatuses = VALID_STATUS_TRANSITIONS[currentStatus] ?? [];

      if (!allowedNextStatuses.includes(nextStatus)) {
        throw new AppError(
          `Invalid order status transition from '${currentStatus}' to '${nextStatus}'.`,
          HTTP_STATUS.UNPROCESSABLE_ENTITY,
          [],
          true,
          APP_ERROR_CODES.ORDER_INVALID_STATUS_TRANSITION,
        );
      }
    }

    const cancelledBy = context.userId ? toObjectId(context.userId) : undefined;
    const updated = await this.orderRepository.updateStatus(
      orderObjId,
      nextStatus,
      dto.cancellationReason,
      cancelledBy,
    );

    if (!updated) {
      throw this.createNotFoundError();
    }

    const response = this.toResponse(updated);
    void this.orderNotificationService?.dispatchOrderStatusUpdated(response);

    return response;
  }

  public async adminUpdateReadyTime(
    orderId: string,
    dto: UpdateReadyTimeDto,
  ): Promise<OrderResponse> {
    const orderObjId = toObjectId(orderId);
    const order = await this.orderRepository.findById(orderObjId);

    if (!order) {
      throw this.createNotFoundError();
    }

    order.estimatedReadyTime = new Date(dto.estimatedReadyTime);
    await order.save();

    return this.toResponse(order);
  }

  private toResponse(order: HydratedDocument<Order>): OrderResponse {
    return {
      id: order._id.toString(),
      orderNumber: order.orderNumber,
      customerId: order.customerId.toString(),
      items: order.items,
      ...(order.addressSnapshot
        ? { addressSnapshot: order.addressSnapshot }
        : {}),
      pricingSnapshot: order.pricingSnapshot,
      deliveryMethod: order.deliveryMethod,
      orderStatus: order.orderStatus,
      paymentStatus: order.paymentStatus,
      ...(order.notes ? { notes: order.notes } : {}),
      ...(order.estimatedReadyTime
        ? { estimatedReadyTime: order.estimatedReadyTime }
        : {}),
      ...(order.scheduledDate ? { scheduledDate: order.scheduledDate } : {}),
      ...(order.scheduledTimeSlot
        ? { scheduledTimeSlot: order.scheduledTimeSlot }
        : {}),
      ...(order.cancellationReason
        ? { cancellationReason: order.cancellationReason }
        : {}),
      ...(order.cancelledBy ? { cancelledBy: order.cancelledBy.toString() } : {}),
      ...(order.cancelledAt ? { cancelledAt: order.cancelledAt } : {}),
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    };
  }

  private createNotFoundError(): AppError {
    return new AppError(
      "Order not found.",
      HTTP_STATUS.NOT_FOUND,
      [],
      true,
      APP_ERROR_CODES.ORDER_NOT_FOUND,
    );
  }
}
