import crypto from "node:crypto";
import type { HydratedDocument, Types } from "mongoose";

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
import { couponService } from "../../coupon/index.js";
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
import { UserModel } from "../../user/index.js";
import { AuditLogModel } from "../../platform/model/audit-log.model.js";
import {
  type Order,
  type OrderAddressSnapshot,
  type OrderBranchSnapshot,
  type OrderItemSnapshot,
  type OrderLocationSnapshot,
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
            "Specified delivery address not found or does not belong to your account.",
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
          village: addressDoc.village,
          district: addressDoc.district,
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
          village: dto.address.village,
          district: dto.address.district,
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

      if (!product || !product.isActive || !product.isAvailable) {
        throw new AppError(
          `Product '${cartItem.productSnapshot?.name || "Bakery Item"}' is currently unavailable for your selected location.`,
          HTTP_STATUS.UNPROCESSABLE_ENTITY,
          [],
          true,
          APP_ERROR_CODES.PRODUCT_INVALID_AVAILABILITY,
        );
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

    // 5. Build Immutable Order Location Snapshot (Server-side authoritative)
    let locationSnapshot: OrderLocationSnapshot | undefined;

    if (UserModel.db?.readyState === 1) {
      try {
        const { VillageModel } = await import("../../village/model/village.model.js");
        let villageDoc = null;

        // A. If addressId / addressDoc exists, resolve village from the delivery address
        if (dto.addressId) {
          const addressDoc = await AddressModel.findOne({
            _id: toObjectId(dto.addressId),
            userId: customerObjId,
          }).exec();

          if (addressDoc) {
            // 1. Try matching by village
            if (addressDoc.village && addressDoc.village.trim()) {
              villageDoc = await VillageModel.findOne({
                name: new RegExp(`^${addressDoc.village.trim()}$`, "i"),
                isActive: true,
              }).exec();
            }
            // 2. Try matching by city
            if (!villageDoc && addressDoc.city && addressDoc.city.trim()) {
              villageDoc = await VillageModel.findOne({
                name: new RegExp(`^${addressDoc.city.trim()}$`, "i"),
                isActive: true,
              }).exec();
            }
            // 3. Try matching by district
            if (!villageDoc && addressDoc.district && addressDoc.district.trim()) {
              villageDoc = await VillageModel.findOne({
                name: new RegExp(`^${addressDoc.district.trim()}$`, "i"),
                isActive: true,
              }).exec();
            }
            // 4. Try matching by full address text containing any active village name
            if (!villageDoc) {
              const fullAddressStr = `${addressDoc.village || ""} ${addressDoc.address || ""} ${addressDoc.city || ""} ${addressDoc.district || ""}`.toLowerCase();
              const allActiveVillages = await VillageModel.find({ isActive: true }).exec();
              const matched = allActiveVillages.find((v) => {
                const vName = v.name.trim().toLowerCase();
                return fullAddressStr.includes(vName);
              });
              if (matched) {
                villageDoc = matched;
              }
            }

            if (villageDoc) {
              locationSnapshot = {
                villageId: villageDoc._id,
                villageName: villageDoc.name,
                district: villageDoc.district,
                pincode: addressDoc.pincode || villageDoc.pincode,
              };
            } else {
              locationSnapshot = {
                villageName: addressDoc.village || addressDoc.city || "Hamirpur",
                district: addressDoc.district || addressDoc.state || "Hamirpur",
                pincode: addressDoc.pincode || "210502",
              };
            }
          }
        } else if (dto.address) {
          if (dto.address.city) {
            villageDoc = await VillageModel.findOne({
              name: new RegExp(`^${dto.address.city.trim()}$`, "i"),
              isActive: true,
            }).exec();
          }
          if (!villageDoc && dto.address.street) {
            const fullStr = `${dto.address.street} ${dto.address.city || ""}`.toLowerCase();
            const allActiveVillages = await VillageModel.find({ isActive: true }).exec();
            const matched = allActiveVillages.find((v) => fullStr.includes(v.name.trim().toLowerCase()));
            if (matched) {
              villageDoc = matched;
            }
          }
          if (villageDoc) {
            locationSnapshot = {
              villageId: villageDoc._id,
              villageName: villageDoc.name,
              district: villageDoc.district,
              pincode: dto.address.pincode || villageDoc.pincode,
            };
          } else {
            locationSnapshot = {
              villageName: dto.address.city || "Hamirpur",
              district: dto.address.state || "Hamirpur",
              pincode: dto.address.pincode || "210502",
            };
          }
        }

        // B. Fallback to user's currentLocation (e.g. for Store Pickup or missing address)
        if (!locationSnapshot) {
          const userDoc = await UserModel.findById(customerObjId).exec();
          if (userDoc?.currentLocation) {
            locationSnapshot = {
              villageId: userDoc.currentLocation.villageId,
              villageName: userDoc.currentLocation.villageName,
              district: userDoc.currentLocation.district,
              pincode: userDoc.currentLocation.pincode,
            };
          }
        }
      } catch (_err) {
        // Ignore error
      }
    }

    if (!locationSnapshot && addressSnapshot) {
      locationSnapshot = {
        villageName: addressSnapshot.city || "Hamirpur",
        district: addressSnapshot.state || "Hamirpur",
        pincode: addressSnapshot.pincode || "210502",
      };
    }

    // 6. Build Immutable Order Branch Snapshot (Server-side authoritative)
    let branchId: Types.ObjectId | undefined;
    let branchSnapshot: OrderBranchSnapshot | undefined;

    if (UserModel.db?.readyState === 1) {
      try {
        const { BranchService } = await import("../../branch/service/branch.service.js");
        const { BranchRepository } = await import("../../branch/repository/branch.repository.js");
        const branchService = new BranchService(new BranchRepository());
        const branchDoc = await branchService.resolveBranchForVillage(
          locationSnapshot?.villageId || locationSnapshot?.villageName,
        );
        if (branchDoc) {
          branchId = branchDoc._id;
          branchSnapshot = {
            branchId: branchDoc._id,
            name: branchDoc.name,
            code: branchDoc.code,
            type: branchDoc.type,
          };
        }
      } catch (_err) {
        // Fallback for unit tests
      }
    }

    // 7. Generate Human-Readable Unique Order Number (OB-YYYYMMDD-XXXXXX)
    const datePrefix = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const randomSuffix = crypto.randomBytes(3).toString("hex").toUpperCase();
    const orderNumber = `OB-${datePrefix}-${randomSuffix}`;

    const hasCustomCake = orderItemSnapshots.some(
      (item) =>
        item.productType === "CUSTOM_CAKE" ||
        Boolean(item.customization || item.customCakeConfig),
    );

    let timingType: "INSTANT" | "SCHEDULED" = dto.deliveryTimingType ?? (dto.scheduledDate ? "SCHEDULED" : "INSTANT");
    if (hasCustomCake && timingType === "INSTANT") {
      timingType = "SCHEDULED";
    }

    let deliveryPreference = dto.deliveryTimePreference;
    if (!deliveryPreference) {
      if (timingType === "SCHEDULED") {
        const dateStr = dto.scheduledDate
          ? new Date(dto.scheduledDate).toLocaleDateString("en-IN", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })
          : "Upcoming Date";
        const slotStr = dto.scheduledTimeSlot ? ` (${dto.scheduledTimeSlot})` : "";
        deliveryPreference = `📅 Scheduled: ${dateStr}${slotStr}`;
      } else {
        deliveryPreference = "⚡ Instant Delivery (Within 30-45 mins)";
      }
    }

    // 8. Persist Order Document
    const order = await this.orderRepository.createOrder({
      orderNumber,
      userId: customerObjId,
      customerId: customerObjId,
      ...(branchId ? { branchId } : {}),
      ...(addressSnapshot?.addressId ? { addressId: addressSnapshot.addressId } : {}),
      items: orderItemSnapshots,
      ...(addressSnapshot ? { addressSnapshot } : {}),
      ...(locationSnapshot ? { locationSnapshot } : {}),
      ...(branchSnapshot ? { branchSnapshot } : {}),
      pricingSnapshot,
      subtotal,
      deliveryCharge,
      totalAmount: grandTotal,
      deliveryMethod: dto.deliveryMethod,
      paymentMethod: dto.paymentMethod ?? "UPI",
      orderStatus: "PENDING",
      paymentStatus: "PENDING",
      deliveryTimingType: timingType,
      deliveryTimePreference: deliveryPreference,
      ...(dto.notes ? { notes: dto.notes } : {}),
      ...(dto.scheduledDate ? { scheduledDate: new Date(dto.scheduledDate) } : {}),
      ...(dto.scheduledTimeSlot ? { scheduledTimeSlot: dto.scheduledTimeSlot } : {}),
    });

    if (cart.couponCode) {
      await couponService.incrementCouponUsage(cart.couponCode);
    }

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

    const customerIds = [...new Set(result.items.map((it) => it.customerId.toString()))];
    const userMap = new Map<string, { name?: string; phone?: string }>();
    if (customerIds.length > 0) {
      try {
        const users = await UserModel.find({ _id: { $in: customerIds.map(toObjectId) } })
          .select("_id name phone")
          .lean()
          .exec();
        for (const u of users) {
          userMap.set(u._id.toString(), { name: u.name, phone: u.phone });
        }
      } catch (_e) {
        // Ignore
      }
    }

    return {
      orders: result.items.map((item) => this.toResponse(item, userMap)),
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      },
    };
  }

  public async adminDeleteOrder(
    orderId: string,
    context?: RequestContext,
  ): Promise<{ id: string; success: boolean }> {
    const orderObjId = toObjectId(orderId);
    let order = await this.orderRepository.findById(orderObjId);
    if (!order) {
      order = await this.orderRepository.findByOrderNumber(orderId);
    }

    if (!order) {
      throw this.createNotFoundError();
    }

    await this.orderRepository.deleteOrderById(order._id);

    if (context?.userId) {
      void AuditLogModel.create({
        actorId: toObjectId(context.userId),
        actorRole: context.userRole ?? "admin",
        action: "ORDER_DELETED",
        entity: "Order",
        entityId: order._id.toString(),
        timestamp: new Date(),
        metadata: {
          orderNumber: order.orderNumber,
          deletedBy: context.userId,
        },
      }).catch(() => {});
    }

    return { id: order._id.toString(), success: true };
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

    if (context.userId) {
      void AuditLogModel.create({
        actorId: toObjectId(context.userId),
        actorRole: context.userRole ?? "admin",
        action: nextStatus === "CANCELLED" ? "ORDER_CANCELLED" : "ORDER_STATUS_CHANGED",
        entity: "Order",
        entityId: order._id.toString(),
        timestamp: new Date(),
        metadata: {
          fromStatus: currentStatus,
          toStatus: nextStatus,
          branchId: order.branchId?.toString(),
        },
      }).catch(() => {});
    }

    const response = this.toResponse(updated);
    void this.orderNotificationService?.dispatchOrderStatusUpdated(response);

    return response;
  }

  public async assignDeliveryAgent(
    branchId: string,
    orderId: string,
    agentId: string,
    actorId?: string,
  ): Promise<OrderResponse> {
    const orderObjId = toObjectId(orderId);
    const branchObjId = toObjectId(branchId);
    const agentObjId = toObjectId(agentId);

    const order = await this.orderRepository.findById(orderObjId);
    if (!order) {
      throw this.createNotFoundError();
    }

    if (!order.branchId || order.branchId.toString() !== branchObjId.toString()) {
      throw new AppError("Order does not belong to this branch.", HTTP_STATUS.FORBIDDEN);
    }

    if (order.deliveryMethod === "STORE_PICKUP") {
      throw new AppError("Delivery agent cannot be assigned to store pickup orders.", HTTP_STATUS.UNPROCESSABLE_ENTITY);
    }

    if (order.orderStatus === "DELIVERED" || order.orderStatus === "CANCELLED") {
      throw new AppError(`Cannot assign delivery agent for ${order.orderStatus} order.`, HTTP_STATUS.UNPROCESSABLE_ENTITY);
    }

    const agent = await UserModel.findById(agentObjId).exec();
    if (!agent || agent.status !== "active") {
      throw new AppError("Delivery agent not found or inactive.", HTTP_STATUS.BAD_REQUEST);
    }

    if (!agent.branchId || agent.branchId.toString() !== branchObjId.toString()) {
      throw new AppError("Delivery agent does not belong to this branch.", HTTP_STATUS.FORBIDDEN);
    }

    order.deliveryAgentId = agent._id;
    order.deliveryAgentSnapshot = {
      agentId: agent._id,
      name: agent.name,
      phone: agent.phone,
    };
    await order.save();

    if (actorId) {
      await AuditLogModel.create({
        actorId: toObjectId(actorId),
        action: "DELIVERY_AGENT_ASSIGNED",
        entity: "Order",
        entityId: order._id.toString(),
        timestamp: new Date(),
        metadata: {
          deliveryAgentId: agent._id.toString(),
          branchId,
        },
      });
    }

    return this.toResponse(order);
  }

  public async unassignDeliveryAgent(
    branchId: string,
    orderId: string,
    actorId?: string,
  ): Promise<OrderResponse> {
    const orderObjId = toObjectId(orderId);
    const branchObjId = toObjectId(branchId);

    const order = await this.orderRepository.findById(orderObjId);
    if (!order) {
      throw this.createNotFoundError();
    }

    if (!order.branchId || order.branchId.toString() !== branchObjId.toString()) {
      throw new AppError("Order does not belong to this branch.", HTTP_STATUS.FORBIDDEN);
    }

    if (order.orderStatus === "DELIVERED" || order.orderStatus === "CANCELLED") {
      throw new AppError(`Cannot unassign delivery agent for ${order.orderStatus} order.`, HTTP_STATUS.UNPROCESSABLE_ENTITY);
    }

    order.deliveryAgentId = undefined;
    order.deliveryAgentSnapshot = undefined;
    await order.save();

    if (actorId) {
      await AuditLogModel.create({
        actorId: toObjectId(actorId),
        action: "DELIVERY_AGENT_UNASSIGNED",
        entity: "Order",
        entityId: order._id.toString(),
        timestamp: new Date(),
        metadata: { branchId },
      });
    }

    return this.toResponse(order);
  }

  public async getOrderByIdForActor(
    orderId: string,
    actor: { id: string; role: string; branchId?: string },
  ): Promise<OrderResponse> {
    const orderObjId = toObjectId(orderId);
    const order = await this.orderRepository.findById(orderObjId);
    if (!order) {
      throw this.createNotFoundError();
    }

    if (actor.role === "customer") {
      if (order.customerId.toString() !== actor.id && order.userId?.toString() !== actor.id) {
        throw new AppError("Access denied: You are not authorized to view this order.", HTTP_STATUS.FORBIDDEN);
      }
    } else if (actor.role === "branch_admin") {
      if (!order.branchId || order.branchId.toString() !== actor.branchId) {
        throw new AppError("Access denied: Order does not belong to your assigned branch.", HTTP_STATUS.FORBIDDEN);
      }
    }

    return this.toResponse(order);
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

  public async getDeliveryAgentDashboard(
    agentId: string,
    userBranchId?: string,
  ): Promise<{
    todayAssigned: number;
    todayOutForDelivery: number;
    todayDelivered: number;
    todayCancelled: number;
    pendingDelivery: number;
  }> {
    const agentObjId = toObjectId(agentId);
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const query: Record<string, unknown> = { deliveryAgentId: agentObjId };
    if (userBranchId) {
      query.branchId = toObjectId(userBranchId);
    }

    const { OrderModel } = await import("../model/order.model.js");
    const agentOrders = await OrderModel.find(query).exec();

    let todayAssigned = 0;
    let todayOutForDelivery = 0;
    let todayDelivered = 0;
    let todayCancelled = 0;
    let pendingDelivery = 0;

    for (const order of agentOrders) {
      const isToday = order.createdAt >= startOfDay || (order.deliveredAt && order.deliveredAt >= startOfDay);

      if (isToday) {
        todayAssigned++;
      }

      if (order.orderStatus === "OUT_FOR_DELIVERY") {
        todayOutForDelivery++;
        pendingDelivery++;
      } else if (order.orderStatus === "DELIVERED") {
        if (isToday) {
          todayDelivered++;
        }
      } else if (order.orderStatus === "CANCELLED") {
        if (isToday) {
          todayCancelled++;
        }
      } else if (order.orderStatus === "CONFIRMED" || order.orderStatus === "PREPARING") {
        pendingDelivery++;
      }
    }

    return {
      todayAssigned,
      todayOutForDelivery,
      todayDelivered,
      todayCancelled,
      pendingDelivery,
    };
  }

  public async getDeliveryAgentOrders(
    agentId: string,
    status?: string,
    userBranchId?: string,
  ): Promise<OrderResponse[]> {
    const agentObjId = toObjectId(agentId);
    const query: Record<string, unknown> = { deliveryAgentId: agentObjId };

    if (userBranchId) {
      query.branchId = toObjectId(userBranchId);
    }

    if (status && status !== "ALL") {
      if (status === "ASSIGNED") {
        query.orderStatus = { $in: ["CONFIRMED", "PREPARING"] };
      } else {
        query.orderStatus = status;
      }
    }

    const { OrderModel } = await import("../model/order.model.js");
    const orders = await OrderModel.find(query)
      .sort({ createdAt: -1 })
      .exec();

    return orders.map((o) => this.toResponse(o));
  }

  public async getDeliveryAgentOrderById(
    agentId: string,
    orderId: string,
    userBranchId?: string,
    userRole?: string,
  ): Promise<OrderResponse> {
    const orderObjId = toObjectId(orderId);
    const order = await this.orderRepository.findById(orderObjId);

    if (!order) {
      throw this.createNotFoundError();
    }

    if (userRole !== "admin") {
      if (!order.deliveryAgentId || order.deliveryAgentId.toString() !== agentId) {
        throw new AppError("Access denied: Order is not assigned to you.", HTTP_STATUS.FORBIDDEN);
      }
      if (userBranchId && order.branchId && order.branchId.toString() !== userBranchId) {
        throw new AppError("Access denied: Order does not belong to your assigned branch.", HTTP_STATUS.FORBIDDEN);
      }
    }

    return this.toResponse(order);
  }

  public async startDelivery(
    agentId: string,
    orderId: string,
    userBranchId?: string,
    userRole?: string,
  ): Promise<OrderResponse> {
    const agentObjId = toObjectId(agentId);
    const orderObjId = toObjectId(orderId);

    const agent = await UserModel.findById(agentObjId).exec();
    if (!agent || agent.status !== "active") {
      throw new AppError("Delivery agent account is inactive or not found.", HTTP_STATUS.FORBIDDEN);
    }

    if (userRole !== "admin" && userBranchId && agent.branchId && agent.branchId.toString() !== userBranchId) {
      throw new AppError("Delivery agent does not belong to this branch.", HTTP_STATUS.FORBIDDEN);
    }

    const order = await this.orderRepository.findById(orderObjId);
    if (!order) {
      throw this.createNotFoundError();
    }

    if (userRole !== "admin") {
      if (!order.deliveryAgentId || order.deliveryAgentId.toString() !== agentId) {
        throw new AppError("Access denied: Order is not assigned to you.", HTTP_STATUS.FORBIDDEN);
      }
      if (order.branchId && agent.branchId && order.branchId.toString() !== agent.branchId.toString()) {
        throw new AppError("Access denied: Order branch does not match your assigned branch.", HTTP_STATUS.FORBIDDEN);
      }
    }

    if (order.deliveryMethod === "STORE_PICKUP") {
      throw new AppError("Store pickup orders cannot enter delivery execution flow.", HTTP_STATUS.UNPROCESSABLE_ENTITY);
    }

    if (order.orderStatus === "CANCELLED") {
      throw new AppError("Cannot start delivery for a cancelled order.", HTTP_STATUS.UNPROCESSABLE_ENTITY);
    }

    if (order.orderStatus === "DELIVERED") {
      throw new AppError("Order is already delivered.", HTTP_STATUS.UNPROCESSABLE_ENTITY);
    }

    if (order.orderStatus !== "PREPARING") {
      throw new AppError(`Order must be in PREPARING status to start delivery (current status: '${order.orderStatus}').`, HTTP_STATUS.UNPROCESSABLE_ENTITY);
    }

    order.orderStatus = "OUT_FOR_DELIVERY";
    order.deliveryStartedAt = new Date();
    await order.save();

    void AuditLogModel.create({
      actorId: agentObjId,
      actorRole: userRole ?? "delivery_agent",
      action: "DELIVERY_STARTED",
      entity: "Order",
      entityId: order._id.toString(),
      timestamp: new Date(),
      metadata: {
        branchId: order.branchId?.toString(),
        deliveryAgentId: agentId,
      },
    }).catch(() => {});

    return this.toResponse(order);
  }

  public async completeDelivery(
    agentId: string,
    orderId: string,
    userBranchId?: string,
    userRole?: string,
  ): Promise<OrderResponse> {
    const agentObjId = toObjectId(agentId);
    const orderObjId = toObjectId(orderId);

    const agent = await UserModel.findById(agentObjId).exec();
    if (!agent || agent.status !== "active") {
      throw new AppError("Delivery agent account is inactive or not found.", HTTP_STATUS.FORBIDDEN);
    }

    if (userRole !== "admin" && userBranchId && agent.branchId && agent.branchId.toString() !== userBranchId) {
      throw new AppError("Delivery agent does not belong to this branch.", HTTP_STATUS.FORBIDDEN);
    }

    const order = await this.orderRepository.findById(orderObjId);
    if (!order) {
      throw this.createNotFoundError();
    }

    if (userRole !== "admin") {
      if (!order.deliveryAgentId || order.deliveryAgentId.toString() !== agentId) {
        throw new AppError("Access denied: Order is not assigned to you.", HTTP_STATUS.FORBIDDEN);
      }
      if (order.branchId && agent.branchId && order.branchId.toString() !== agent.branchId.toString()) {
        throw new AppError("Access denied: Order branch does not match your assigned branch.", HTTP_STATUS.FORBIDDEN);
      }
    }

    if (order.deliveryMethod === "STORE_PICKUP") {
      throw new AppError("Store pickup orders cannot enter delivery execution flow.", HTTP_STATUS.UNPROCESSABLE_ENTITY);
    }

    if (order.orderStatus === "CANCELLED") {
      throw new AppError("Cannot complete delivery for a cancelled order.", HTTP_STATUS.UNPROCESSABLE_ENTITY);
    }

    if (order.orderStatus !== "OUT_FOR_DELIVERY") {
      throw new AppError("Cannot complete delivery before starting delivery.", HTTP_STATUS.UNPROCESSABLE_ENTITY);
    }

    order.orderStatus = "DELIVERED";
    order.deliveredAt = new Date();
    order.deliveryCompletedBy = agentObjId;
    await order.save();

    void AuditLogModel.create({
      actorId: agentObjId,
      actorRole: userRole ?? "delivery_agent",
      action: "DELIVERY_COMPLETED",
      entity: "Order",
      entityId: order._id.toString(),
      timestamp: new Date(),
      metadata: {
        branchId: order.branchId?.toString(),
        deliveryAgentId: agentId,
      },
    }).catch(() => {});

    return this.toResponse(order);
  }

  private toResponse(
    order: HydratedDocument<Order>,
    userMap?: Map<string, { name?: string; phone?: string }>,
  ): OrderResponse {
    const user = userMap?.get(order.customerId.toString());
    const customerName = order.addressSnapshot?.fullName || user?.name;
    const customerPhone = order.addressSnapshot?.phone || user?.phone;

    return {
      id: order._id.toString(),
      orderNumber: order.orderNumber,
      customerId: order.customerId.toString(),
      ...(customerName ? { customerName } : {}),
      ...(customerPhone ? { customerPhone } : {}),
      totalAmount: order.totalAmount ?? order.pricingSnapshot?.grandTotal ?? 0,
      subtotal: order.subtotal ?? order.pricingSnapshot?.subtotal ?? 0,
      deliveryCharge: order.deliveryCharge ?? order.pricingSnapshot?.deliveryCharge ?? 0,
      items: order.items,
      ...(order.addressSnapshot
        ? { addressSnapshot: order.addressSnapshot }
        : {}),
      ...(order.locationSnapshot
        ? {
            locationSnapshot: {
              ...(order.locationSnapshot.villageId ? { villageId: order.locationSnapshot.villageId } : {}),
              villageName: order.locationSnapshot.villageName,
              district: order.locationSnapshot.district,
              pincode: order.locationSnapshot.pincode,
            },
          }
        : {}),
      ...(order.branchId ? { branchId: order.branchId.toString() } : {}),
      ...(order.deliveryAgentId ? { deliveryAgentId: order.deliveryAgentId.toString() } : {}),
      ...(order.branchSnapshot
        ? {
            branchSnapshot: {
              branchId: order.branchSnapshot.branchId,
              name: order.branchSnapshot.name,
              code: order.branchSnapshot.code,
              type: order.branchSnapshot.type,
            },
          }
        : {}),
      ...(order.deliveryAgentSnapshot
        ? {
            deliveryAgentSnapshot: {
              agentId: order.deliveryAgentSnapshot.agentId.toString(),
              name: order.deliveryAgentSnapshot.name,
              ...(order.deliveryAgentSnapshot.phone ? { phone: order.deliveryAgentSnapshot.phone } : {}),
            },
          }
        : {}),
      pricingSnapshot: order.pricingSnapshot,
      deliveryMethod: order.deliveryMethod,
      ...(order.paymentMethod ? { paymentMethod: order.paymentMethod } : {}),
      orderStatus: order.orderStatus,
      paymentStatus: order.paymentStatus,
      ...(order.deliveryTimingType ? { deliveryTimingType: order.deliveryTimingType } : {}),
      ...(order.deliveryTimePreference ? { deliveryTimePreference: order.deliveryTimePreference } : {}),
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
      ...(order.deliveryStartedAt ? { deliveryStartedAt: order.deliveryStartedAt } : {}),
      ...(order.deliveredAt ? { deliveredAt: order.deliveredAt } : {}),
      ...(order.deliveryCompletedBy ? { deliveryCompletedBy: order.deliveryCompletedBy.toString() } : {}),
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
