# Order Architecture

## Purpose

This document defines the Order Architecture for the OneBite Bakery Platform.

The Order module is designed to be immutable, provider-independent, secure, and fully decoupled from payments, search engines, or external SDKs.

---

## Core Principles

1. **Strict Layered Separation**:
   - `Controller` (HTTP & DTO routing) ➔ `Service` (Business logic, state machine & snapshot generation) ➔ `Repository` (Mongoose persistence).

2. **Immutable Order Snapshots**:
   - Product details, prices, variants, custom cake options, address, and pricing calculations are captured as immutable snapshots at the moment of order placement.
   - Future modifications to products, categories, or user addresses will never mutate historical order data.

3. **Strict Order State Machine**:
   - Status transitions follow a strict unidirectional state machine (`PENDING` ➔ `CONFIRMED` ➔ `PREPARING` ➔ `READY` ➔ `OUT_FOR_DELIVERY` ➔ `DELIVERED`).
   - Customer cancellations are permitted only before `PREPARING`.
   - Store owners may cancel at any state prior to terminal `DELIVERED`.

4. **Cart Clearing & Transactional Safety**:
   - Customer carts are recalculated and validated before order creation.
   - The cart is cleared only after successful order persistence.

5. **Payment Independence**:
   - Orders maintain a `paymentStatus` field (`PENDING`, `PROCESSING`, `SUCCESS`, `FAILED`, `CANCELLED`).
   - Order management operates independently of payment gateway implementations, making it 100% ready for Milestone 12.

---

## Order Data Model

### Fields

- `_id`: Unique Mongoose ObjectId
- `orderNumber`: Human-readable unique order identifier (e.g. `OB-YYYYMMDD-XXXXXX`)
- `customerId`: User ObjectId (ref `User`)
- `items`: Array of `OrderItemSnapshot`
- `addressSnapshot`: Optional `OrderAddressSnapshot` (required for `HOME_DELIVERY`)
- `pricingSnapshot`: `OrderPricingSnapshot`
- `deliveryMethod`: `"HOME_DELIVERY"` | `"STORE_PICKUP"`
- `orderStatus`: `"PENDING"` | `"CONFIRMED"` | `"PREPARING"` | `"READY"` | `"OUT_FOR_DELIVERY"` | `"DELIVERED"` | `"CANCELLED"`
- `paymentStatus`: `"PENDING"` | `"PROCESSING"` | `"SUCCESS"` | `"FAILED"` | `"CANCELLED"`
- `notes`: Customer notes string (optional)
- `estimatedReadyTime`: Admin-set estimated completion timestamp (optional)
- `scheduledDate`: Preferred delivery/pickup date (optional)
- `scheduledTimeSlot`: Preferred delivery/pickup slot (optional)
- `cancellationReason`: String cancellation justification (optional)
- `cancelledBy`: User ObjectId (ref `User`, optional)
- `cancelledAt`: Cancellation timestamp (optional)

---

## State Machine & Allowed Transitions

```
[ PENDING ] ───────► [ CONFIRMED ] ───────► [ PREPARING ]
     │                    │                      │
     ├──────────────► [ CANCELLED ] ◄────────────┤
     │                                           │
     ▼                                           ▼
 [ READY ] ────────► [ OUT_FOR_DELIVERY ] ──► [ DELIVERED ]
```

### Transition Table

| Current Status | Allowed Next Statuses | Notes |
| :--- | :--- | :--- |
| `PENDING` | `CONFIRMED`, `CANCELLED` | Customer or Admin cancellation allowed |
| `CONFIRMED` | `PREPARING`, `CANCELLED` | Customer or Admin cancellation allowed |
| `PREPARING` | `READY`, `CANCELLED` | Admin only cancellation allowed |
| `READY` | `OUT_FOR_DELIVERY`, `DELIVERED`, `CANCELLED` | Admin only |
| `OUT_FOR_DELIVERY` | `DELIVERED`, `CANCELLED` | Admin only |
| `DELIVERED` | None | Terminal state |
| `CANCELLED` | None | Terminal state |

---

## Delivery & Settings Rules

1. **Home Delivery**:
   - Requires valid `addressId` or address payload.
   - Enforces `subtotal >= minimumHomeDeliveryAmount` from store `Settings`.
2. **Store Pickup**:
   - Requires zero delivery address; sets `deliveryCharge = 0`.
   - Permitted regardless of minimum home delivery subtotal.

---

## Payment Integration Readiness

Milestone 12 Payment Intent and Payment Transaction modules will attach to the Order ID via `orderId` reference without requiring any structural changes or refactoring to the Order module.
