# ONEBITE BAKERY — BRANCH SYSTEM IMPLEMENTATION BASELINE

Date of Audit: 2026-08-29  
Repository Baseline: `bakery-platform`  
Environment: Node.js v24+ / TypeScript 5.7+ / Mongoose 8.x / React 19 / Vite 8.x

---

## 1. Current Architecture

Onebite Bakery Platform currently operates as a single-store / centralized e-commerce system. The system features a clear separation of concerns between backend services (`backend/`) and single-page frontend application (`frontend/`).

```
                              [ CUSTOMER / ADMIN ]
                                        │
                                        ▼
                             [ FRONTEND (Vite / React 19) ]
                         ├── Public Customer Portal
                         └── Protected Admin Console
                                        │
                                        ▼ REST API / HTTPS
                              [ BACKEND (Express / TS) ]
                         ├── Auth & Security (Google OAuth, JWT, RBAC)
                         ├── Catalog (Products, Categories, Occasions)
                         ├── Checkout & Cart Service
                         ├── Order Engine & Payment Gateway (Razorpay)
                         └── Notification & Media Engine
                                        │
                                        ▼
                                [ MongoDB Database ]
```

### Architectural Key Characteristics
- **Centralized Database**: Single MongoDB database instance storing all users, products, orders, cart states, and system settings.
- **RESTful API Layer**: Modular Express application structured by domain sub-modules under `src/modules/`.
- **Single Store Assumptions**: Delivery charges, minimum order limits, store online/offline status, and product stock currently operate globally via `SettingsModel` and `ProductModel`.

---

## 2. Existing Modules

### Backend Modules (`backend/src/modules/`)
1. `address`: Customer delivery address management (CRUD, default set, pincode).
2. `auth`: Google OAuth login/link, JWT access & refresh tokens, cookie handling, and session management.
3. `cart`: Cart creation (guest session or customer ID), item additions, quantity updates, coupon calculation, cart merging.
4. `category`: Product categories (CRUD, active toggle, slug-based queries).
5. `checkout`: Delivery serviceability check, delivery fee estimation, minimum order value validation.
6. `coupon`: Discount coupon validation and discount calculation.
7. `favorite`: Customer product bookmarking/favorites list.
8. `health`: System health monitor and administrative audit logs.
9. `media`: File uploads, mime validation, local disk storage / Cloudinary adapter interface.
10. `notification`: Transactional SMS/Email log tracking, broadcast notification dispatch engine.
11. `occasion`: Event/Occasion categorization (Birthdays, Weddings, Anniversaries).
12. `order`: Order creation, lifecycle state machine (`PENDING` -> `CONFIRMED` -> `PREPARING` -> `OUT_FOR_DELIVERY` -> `DELIVERED`), status timeline.
13. `payment`: Razorpay payment intent creation, HMAC signature verification, webhook handler (`payment.captured`, `payment.failed`).
14. `platform`: Operational metadata, system overview.
15. `product`: Product CRUD, pricing, multi-type handling (NORMAL, COMBO, CUSTOM_CAKE, DECORATION), stock management, SEO fields.
16. `review`: Customer ratings and reviews for products.
17. `search`: Full-text product search, price range filtering, category/occasion slug filtering.
18. `settings`: Global store settings (Store Profile, Delivery fees, Store online/offline toggle).
19. `upload`: Multer upload configuration middleware.
20. `user`: Account management, customer profiling, role management, block/unblock.
21. `village`: Early service area / village locality structure.

---

## 3. Existing Database Models

All database models reside in their respective module `model/` folders and use Mongoose schemas with clean object ID helpers and indexes:

| Model | Collection | Primary Keys / Key Indexes | Key Responsibilities |
| :--- | :--- | :--- | :--- |
| `User` | `users` | `_id`, `phone` (unique), `email` (sparse unique) | Customer & Admin accounts, roles (`customer`, `admin`), active status. |
| `Product` | `products` | `_id`, `slug` (unique), `categoryId`, `stockStatus` | Central product definitions, global prices, inventory fields. |
| `Category` | `categories` | `_id`, `slug` (unique), `displayOrder` | Product category structure. |
| `Occasion` | `occasions` | `_id`, `slug` (unique), `displayOrder` | Event/Milestone classification. |
| `Order` | `orders` | `_id`, `orderNumber` (unique), `customerId`, `orderStatus` | Order state machine, line item snapshot, delivery address snapshot. |
| `Cart` | `carts` | `_id`, `userId` (unique), `sessionId` (unique) | Persistent customer and guest cart items, coupon state. |
| `Address` | `addresses` | `_id`, `customerId`, `isDefault` | Saved customer delivery locations. |
| `Payment` | `payments` | `_id`, `orderId`, `providerOrderId` (unique) | Payment attempts, Razorpay provider tracking, transaction logs. |
| `Coupon` | `coupons` | `_id`, `code` (unique) | Promotional discount rules. |
| `Favorite` | `favorites` | `_id`, `customerId`, `productId` | Customer wishlists. |
| `Review` | `reviews` | `_id`, `productId`, `customerId` | Customer feedback and ratings. |
| `Village` | `villages` | `_id`, `name`, `pincode`, `isActive` | Legacy village/locality reference collection. |
| `Settings` | `settings` | `_id`, `singletonKey: "default"` | Global store configuration. |

---

## 4. Existing Roles

Currently, the backend enforces two user roles via `src/shared/enums/roles.enum.ts` and `requireRole` middleware:

1. `CUSTOMER` (`customer`):
   - Access to public catalog, cart, checkout, payments, profile, address book, own order history and order tracking.
2. `CENTRAL_ADMIN` / `ADMIN` (`admin`):
   - Unrestricted administrative access across all management APIs (Catalog, Orders, Customers, Payments, Notifications, Settings, Logs).

### Role Expansion Requirement
The system will introduce `BRANCH_ADMIN` (`branch_admin`) to allow branch managers to handle branch-specific stock, product availability, and assigned orders without accessing Central Admin settings or other branches' operational data.

---

## 5. Existing APIs

The existing backend exposes API endpoints under `/api/v1/`:

- **Auth**: `GET /auth/google`, `POST /auth/google`, `POST /auth/refresh`, `POST /auth/logout`, `GET /auth/me`
- **Products**: `GET /products`, `GET /products/:slug`, `POST /products` (Admin), `PUT /products/:id` (Admin), `DELETE /products/:id` (Admin)
- **Categories & Occasions**: `GET /categories`, `GET /categories/:slug`, `GET /occasions`, `GET /occasions/:slug`
- **Cart**: `GET /cart`, `POST /cart/items`, `PUT /cart/items/:itemId`, `DELETE /cart/items/:itemId`, `POST /cart/merge`, `POST /cart/coupon`, `DELETE /cart/coupon`
- **Checkout & Address**: `GET /addresses`, `POST /addresses`, `PUT /addresses/:id`, `DELETE /addresses/:id`, `POST /checkout/preview`
- **Orders**: `POST /orders`, `GET /orders/my-orders`, `GET /orders/:id`, `PATCH /orders/:id/cancel` (Customer)
- **Payments**: `POST /payments/create`, `POST /payments/verify`, `POST /payments/webhook`
- **Admin**: `GET /admin/dashboard/stats`, `GET /admin/orders`, `PATCH /admin/orders/:id/status`, `GET /admin/customers`, `PATCH /admin/customers/:id/status`, `GET /admin/payments`, `GET /admin/notifications`, `POST /admin/notifications/broadcast`, `GET /admin/settings`, `PUT /admin/settings`, `GET /admin/health`

---

## 6. Existing Frontend Routes

The frontend router (`frontend/src/routes.tsx`) defines the full set of customer and administrative routes:

- **Public Customer**:
  - `/` (Home)
  - `/about` (About Us)
  - `/contact` (Contact Us)
  - `/products` (Catalog Grid & Search)
  - `/products/:slug` (Product Details)
  - `/categories` & `/categories/:slug` (Category Listings)
  - `/occasions` & `/occasions/:slug` (Occasion Listings)
- **Customer Auth & Account**:
  - `/auth/login` (Google Login)
  - `/customer/profile` (Profile & Saved Addresses)
  - `/customer/favorites` (Favorites List)
  - `/customer/orders` (Order History)
  - `/customer/orders/:id` (Order Tracking Timeline)
- **Cart & Checkout**:
  - `/cart` (Cart Drawer/Page)
  - `/checkout` (Address selection & fulfillment options)
  - `/payment/:orderId` (Razorpay Payment Modal/Simulation)
  - `/order/success/:orderId` (Order Confirmation)
  - `/order/failure/:orderId` (Payment Failure Notice)
- **Admin Shell (`/admin`)**:
  - `/admin/dashboard` (Platform Overview)
  - `/admin/catalog` (Product Management)
  - `/admin/categories` (Category & Occasion Management)
  - `/admin/orders` (Order Fulfillment Console)
  - `/admin/customers` (Customer Directory)
  - `/admin/payments` (Payment Audit Log)
  - `/admin/notifications` (Notification Logs & Broadcast)
  - `/admin/analytics` (Revenue Analytics)
  - `/admin/settings` (Global Store Settings)
  - `/admin/logs` (Health Monitor & Audit Trail)

---

## 7. Existing Reusable Components

The frontend maintains a clean component library in `frontend/src/components/`:

- **UI Kit** (`components/ui/`): `Button`, `Input`, `Modal`, `Table`, `Badge`, `Select`, `Textarea`, `Toast`, `SkeletonLoader`
- **Navigation** (`components/navigation/`): `Navbar`, `Footer`, `MobileNav`, `Sidebar`
- **Domain Cards** (`components/cards/`): `ProductCard`, `CategoryCard`, `OccasionCard`, `OrderCard`
- **Shopping & Checkout** (`components/shopping/`): `CartDrawer`, `AddressSelector`, `CheckoutComponents`, `PriceSummary`
- **Admin Layout & Controls** (`features/admin/`): `AdminLayout`, `AdminCard`, `StatCard`, `StatusBadge`, `AdminTable`

---

## 8. Current Product Architecture

Products are managed centrally via `ProductModel`:
- **Central Catalog**: Contains details like `name`, `slug`, `description`, `price`, `compareAtPrice`, `thumbnailUrl`, `imageUrls`, `categoryId`, `occasionIds`, `productType` (`NORMAL`, `COMBO`, `CUSTOM_CAKE`, `DECORATION`), and `isAvailable`.
- **Global Pricing & Availability**: Price and `isAvailable` boolean currently apply platform-wide across all customer requests.

---

## 9. Current Inventory Architecture

Inventory fields exist directly inside `ProductModel`:
- `stockQuantity`: Total units available globally.
- `lowStockThreshold`: Threshold for low stock warning.
- `trackInventory`: Boolean flag indicating whether stock decrementing is active.
- `allowBackorder`: Boolean flag allowing purchases when stock reaches 0.
- `stockStatus`: Enumerated string (`IN_STOCK`, `LOW_STOCK`, `OUT_OF_STOCK`).

---

## 10. Current Order Architecture

Order creation workflow (`order.service.ts`):
1. **Cart Snapshot**: Converts active cart items into immutable `OrderLineItem` snapshots (storing product ID, name, unit price, quantity, customization).
2. **Pricing Snapshot**: Captures subtotal, discount, delivery charge, tax, and grand total.
3. **Address Snapshot**: Captures full delivery address (`street`, `city`, `state`, `pincode`, `village`, `phone`).
4. **State Machine**:
   - `PENDING` -> `CONFIRMED` -> `PREPARING` -> `OUT_FOR_DELIVERY` -> `DELIVERED` (or `CANCELLED`).
5. **Stock Deduction**: Upon confirmation, `product.stockQuantity` is decremented globally.

---

## 11. Current Address Architecture

Customer addresses (`AddressModel`):
- Customer can save multiple addresses (`streetAddress`, `landmark`, `villageName`, `pincode`, `city`, `state`, `isDefault`).
- During checkout, address details are verified for serviceability against global settings or pincode lists and snapshotted into the `Order`.

---

## 12. Current Authorization Architecture

- Backend JWT authentication extracts user ID and role (`req.user = { id, role }`).
- Middleware `requireRole("admin")` guards admin routes.
- Resource ownership is checked on customer endpoints (e.g. `order.customerId.toString() === req.user.id`).

---

## 13. Existing Branch / Location Functionality Assessment

A comprehensive repository search for `branch`, `franchise`, `store`, `serviceArea`, `village`, `location` revealed:
- `backend/src/modules/village`: Contains an initial `Village` model and routes structure.
- `Order` schema contains `village` string field in delivery address snapshot.
- **Assessment**: No full Branch or Franchise model, BranchProduct availability table, BranchInventory table, or Branch Admin role exists yet in active runtime code. The existing `Village` structure can be integrated directly into the new Service Area / Location architecture.

---

## 14. Required Future Modifications

1. **Branch Management**:
   - Central Admin must be able to create and manage Branches / Franchises.
2. **Service Area / Village Mapping**:
   - Map Villages / Localities / Service Areas to specific servicing Branches.
3. **Location-Based Branch Resolution**:
   - Resolve Customer Address -> Service Area / Village -> Servicing Branch.
4. **Branch-Level Product Availability & Stock**:
   - Support `BranchProduct` override where a Central Product can be toggled available/unavailable per Branch, with branch-specific stock counts.
5. **Branch Order Assignment**:
   - Automatically assign created orders to the resolved Branch upon checkout.
6. **Branch Admin Role & Scoped Access**:
   - Enforce backend authorization so `BRANCH_ADMIN` can only view and manage orders/stock for their assigned branch.

---

## 15. Required New Modules

1. `branch`: Branch / Franchise creation, operating hours, active status, branch settings.
2. `service-area`: Service Area & Village coverage definitions mapped to assigned branches.
3. `branch-product`: Branch-specific availability overrides, pricing overrides (if applicable), and localized stock levels.

---

## 16. Database Changes Required Later

1. **New `Branch` Model**:
   - Fields: `name`, `code`, `address`, `phone`, `email`, `isActive`, `managerId`.
2. **New `ServiceArea` / `Village` Model**:
   - Fields: `name`, `pincode`, `branchId`, `isActive`, `deliveryFeeOverride`.
3. **New `BranchProduct` / `BranchInventory` Model**:
   - Fields: `branchId`, `productId`, `isAvailable`, `stockQuantity`, `lowStockThreshold`, `allowBackorder`.
4. **Updated `Order` Model**:
   - Fields: Add `branchId` reference for assigned fulfillment branch.
5. **Updated `User` Model**:
   - Fields: Add `branchId` (optional, for `BRANCH_ADMIN` users) and update role enum to include `BRANCH_ADMIN`.

---

## 17. API Changes Required Later

1. **Branch Management Endpoints**:
   - `GET /api/v1/branches`, `POST /api/v1/branches`, `PUT /api/v1/branches/:id`
2. **Service Area Mapping Endpoints**:
   - `GET /api/v1/service-areas`, `POST /api/v1/service-areas`, `GET /api/v1/service-areas/resolve?pincode=...`
3. **Branch Product & Inventory Endpoints**:
   - `GET /api/v1/branches/:branchId/products`, `PATCH /api/v1/branches/:branchId/products/:productId/availability`
4. **Location-Aware Catalog & Checkout Endpoints**:
   - Pass branch context or address identifier to evaluate localized product availability during browsing and checkout preview.

---

## 18. Frontend Changes Required Later

1. **Location / Village Picker Header**:
   - Allow customer to select delivery locality / village upfront to filter catalog by branch availability.
2. **Branch Admin Dashboard Views**:
   - Scoped order management console, stock update table, and daily branch order queue.
3. **Central Admin Management UI**:
   - Branch directory page, Service Area mapping editor, and Central catalog branch matrix.

---

## 19. Security & Isolation Baseline

- **Strict Backend Scoping**: `BRANCH_ADMIN` JWT claims will carry `branchId`. Backend authorization middleware will enforce `req.user.branchId === order.branchId` on all branch mutation routes.
- **Cross-Branch Prevention**: Prevent Branch A admins from viewing or editing Branch B orders, stock, or settings. Central Admin maintains platform-wide access.

---

## 20. Risks & Mitigation Strategies

| Risk | Mitigation |
| :--- | :--- |
| **Breaking Existing Single-Store Orders** | Keep `branchId` optional during migration fallback, defaulting existing orders to primary Central branch. |
| **Cart Stale Items Across Location Switch** | Re-evaluate product availability when customer changes delivery address in checkout. |
| **Race Conditions on Branch Stock** | Use atomic Mongoose updates (`$inc`, `$set`) with condition check during order confirmation. |

---

## 21. Migration Concerns

- Existing products in MongoDB will need default `BranchProduct` entries created for existing default branch when multi-branch is activated.
- Existing customers without assigned branches will resolve branch dynamically from their default address pincode/village.

---

## 22. Recommended Implementation Order

```
MILESTONE 1: Baseline Audit & Verification (COMPLETED)
       │
       ▼
MILESTONE 2A: Branch Core & Service Area Models + Backend RBAC Infrastructure (COMPLETED)
       │
       ▼
MILESTONE 2B: Branch Product Availability & Branch Stock Foundation
       │
       ▼
MILESTONE 3: Customer Location Resolution & Branch Checkout Integration
       │
       ▼
MILESTONE 4: Branch Admin Dashboard & Central Admin Branch Management UI
       │
       ▼
MILESTONE 5: End-to-End Verification & Production Readiness
```

---

## 23. Milestone 2A — Implemented

### Implemented Functionality & Artifacts

1. **Branch Model (`BranchModel`)**:
   - Location type: `MAIN` vs `FRANCHISE`.
   - Fields: `name`, `code` (unique uppercase, indexed), `address` (`street`, `city`, `state`, `pincode`, `landmark`), `phone`, `email`, `managerId` (ref `User`), `isActive` (boolean).
   - Module structure: `backend/src/modules/branch/` (`model/`, `dto/`, `repository/`, `service/`, `controller/`, `routes/`).

2. **Village / Service Area Extension (`VillageModel`)**:
   - Extended existing `VillageModel` with `branchId?: Types.ObjectId | null` reference and `villages_branch` index.
   - Enforced business rule: One Service Area / Village maps to exactly one responsible Branch. Duplicate assignment is prevented with `409 Conflict`.

3. **RBAC & Authorization Engine (`BRANCH_ADMIN`)**:
   - Extended `USER_ROLES` to include `"branch_admin"`.
   - Added `branchId?: Types.ObjectId` to `UserModel`.
   - Updated JWT tokens & authentication middleware to pack and verify `branchId` claims.
   - Created authorization guards:
     - `requireCentralAdmin`: Guards operations requiring `req.user.role === 'admin'`.
     - `requireBranchAdmin`: Guards operations requiring `req.user.role === 'admin'` or `req.user.role === 'branch_admin'`.
     - `requireBranchScope`: Enforces server-side branch scope so a `branch_admin` can only access operations where target `branchId === req.user.branchId`. Central Admin (`admin`) bypasses with global platform authorization.

4. **Branch & Service Area APIs (`/api/v1/branches`)**:
   - `POST /branches`: Create branch (Central Admin).
   - `GET /branches`: List branches with filtering (Central Admin).
   - `GET /branches/:branchId`: Get branch details & assigned villages (Central Admin or Scoped Branch Admin).
   - `PATCH /branches/:branchId`: Update branch profile (Central Admin).
   - `PATCH /branches/:branchId/status`: Activate / deactivate branch (Central Admin).
   - `POST /branches/:branchId/service-areas`: Assign village to branch (Central Admin).
   - `DELETE /branches/:branchId/service-areas/:serviceAreaId`: Unassign village (Central Admin).
   - `GET /branches/:branchId/service-areas`: List branch villages (Central Admin or Scoped Branch Admin).
   - `POST /branches/:branchId/assign-admin`: Assign Branch Admin (Central Admin).
   - `POST /branches/:branchId/remove-admin`: Remove Branch Admin (Central Admin).

5. **Audit Logging Integration**:
   - Reused existing `AuditLogModel` to record actions: `BRANCH_CREATED`, `BRANCH_UPDATED`, `BRANCH_ACTIVATED`, `BRANCH_DEACTIVATED`, `VILLAGE_ASSIGNED`, `VILLAGE_UNASSIGNED`, `BRANCH_ADMIN_ASSIGNED`, `BRANCH_ADMIN_REMOVED`.

6. **Verification & Test Suite**:
   - Backend Unit Tests: 20 Test Suites Passed (148/148 Tests Passed).
   - Backend Typecheck: 0 Errors (`npm run typecheck`).
   - Backend Lint: 0 Errors (`npm run lint`).
   - Backend Build: 0 Errors (`npm run build`).
   - Frontend Verification: Typecheck, Lint, 38/38 Tests, and Build all passing with 0 errors.

---

## 24. Milestone 2C — Implemented

### Implemented Functionality & Artifacts

1. **Branch Product Availability & Inventory Override System (`BranchProductModel`)**:
   - Schema & Model: `BranchProductModel` (`branch_products` collection).
   - Fields: `branchId`, `productId`, `isAvailable`, `stockQuantity`, `lowStockThreshold`, `allowBackorder`, `createdBy`, `updatedBy`.
   - Compound unique index: `{ branchId: 1, productId: 1 }` (`branch_products_unique`).
   - Query indexes: `{ branchId: 1, isAvailable: 1 }` (`branch_products_branch`), `{ productId: 1, isAvailable: 1 }` (`branch_products_product`).

2. **Customer Village → Servicing Branch Resolution Engine**:
   - `BranchService.resolveBranchForVillage(villageId)` resolves customer location (`currentLocation.villageId`) to assigned servicing branch (`village.branchId`).
   - Fallback to `MAIN` active branch if village is unassigned or guest user.
   - Products disabled or out of stock in the customer's branch are filtered server-side in catalog queries and direct URL lookups.

3. **Cart, Checkout & Order Branch Enforcement**:
   - `cartService.addItem` and `checkoutService.validateCheckout` validate product availability and stock against the customer's active branch.
   - Revalidates cart items on customer location change (`onebitebakery_location_changed`).
   - `OrderModel` captures an immutable `branchId` and `branchSnapshot` (`branchId`, `name`, `code`, `type`) at creation time.
   - Order placement atomically decrements inventory in `BranchProductModel` (or global `ProductModel` fallback).
   - Preserves `My Orders` (`GET /orders`) querying strictly by `customerId`, independent of past or current customer shopping location.

4. **Branch Admin RBAC & Scope Enforcement**:
   - `BRANCH_ADMIN` accounts carry `branchId` in authenticated context.
   - `requireBranchScope` middleware enforces server-side authorization on all branch APIs:
     - `GET /api/v1/branches/:branchId/products`: List products & branch overrides for own branch ONLY.
     - `PATCH /api/v1/branches/:branchId/products/:productId`: Update availability & stock for own branch ONLY.
     - `GET /api/v1/branches/:branchId/orders`: List orders assigned to own branch ONLY.
     - `GET /api/v1/branches/:branchId/dashboard`: View branch dashboard stats for own branch ONLY.
   - Denies cross-branch access (`403 Forbidden`).

5. **Central Admin Controls & Branch Admin UI Components**:
   - `adminBranch.service.ts` & `adminBranchProduct.service.ts` client API integration.
   - `AdminBranchManagementPage.tsx`: Central Admin branch CRUD, village assignment modal, and branch status toggles.
   - `BranchAdminDashboardPage.tsx`: Branch Admin real-time operations dashboard (Today's orders, pending, kitchen, out for delivery, low stock alerts, unavailable count).
   - `BranchAdminProductsPage.tsx`: Branch Admin availability toggles & stock input controls.
   - Integrated sidebar navigation items under Admin Layout (`Sidebar.tsx`, `AppRoutes.tsx`).

6. **Audit Logging Integration**:
   - Audits operations: `BRANCH_PRODUCT_ENABLED`, `BRANCH_PRODUCT_DISABLED`, `BRANCH_STOCK_UPDATED`, `BRANCH_CREATED`, `BRANCH_UPDATED`, `BRANCH_ACTIVATED`, `BRANCH_DEACTIVATED`, `VILLAGE_ASSIGNED`, `VILLAGE_UNASSIGNED`, `BRANCH_ADMIN_ASSIGNED`, `BRANCH_ADMIN_REMOVED`.

7. **Final Verification & Production Build**:
   - Backend Typecheck: 0 Errors (`npm run typecheck`).
   - Backend Lint: 0 Errors (`npm run lint`).
   - Backend Tests: 20 Test Suites Passed (`148/148 tests passed`).
   - Backend Build: 0 Errors (`npm run build`).
   - Frontend Typecheck: 0 Errors (`npm run typecheck`).
   - Frontend Lint: 0 Errors (`npm run lint`).
   - Frontend Tests: 8 Test Suites Passed (`38/38 tests passed`).
   - Frontend Build: 0 Errors (`npm run build` / Vite production build).

---

## 25. Milestone 2D — Customer Location Based Product Availability & End-to-End Flow

### Implemented Functionality & Artifacts

1. **Location Source of Truth & Resolution Engine**:
   - `currentLocation` (`villageId`, `villageName`, `district`, `pincode`) updated via `PATCH /users/location`.
   - `BranchService.resolveBranchForVillage` maps `villageId` -> servicing branch (`MAIN` vs `FRANCHISE`).

2. **Catalog-Wide Location-Aware Product Filtering**:
   - `queryPublicCatalog` filters out products disabled for customer's branch (`_id: { $nin: disabledProductIds }`).
   - Hides unavailable products across `/products`, category listings, occasion listings, search results, featured, trending, recommended, seasonal, and combo sections.

3. **Direct URL & Product Detail Page Protection**:
   - `GET /products/:slug` checks branch availability override. Returns `isAvailable: false` if unserviced in customer's location.
   - `ProductDetailsPage` displays location availability banner and disables Add to Cart if unavailable.
   - `POST /cart` (`addItem`) enforces server-side branch availability check (rejects unserviced products with HTTP 422).

4. **Cart & Checkout Location Revalidation**:
   - `CheckoutService.getCheckoutSummary` and `validateCheckout` check branch availability and stock server-side.
   - Frontend refetches catalog and cart upon `onebitebakery_location_changed` events.

5. **Immutable Order Branch & Location Snapshots**:
   - Order creation captures server-side immutable `branchId`, `branchSnapshot`, and `locationSnapshot`.

6. **Location-Independent Order History**:
   - `getCustomerOrders` queries strictly by `customerId`, preserving all historical customer orders across past and current locations.

7. **Final Verification & Test Suite**:
   - Backend Typecheck: 0 Errors (`npm run typecheck`).
   - Backend Lint: 0 Errors (`npm run lint`).
   - Backend Tests: 21 Test Suites Passed (`149/149 tests passed`).
   - Backend Build: 0 Errors (`npm run build`).
   - Frontend Typecheck: 0 Errors (`npm run typecheck`).
   - Frontend Lint: 0 Errors (`npm run lint`).
   - Frontend Tests: 8 Test Suites Passed (`38/38 tests passed`).
   - Frontend Build: 0 Errors (`npm run build` / Vite production build).

---

## 26. Milestone 2E — Central Admin + Branch Admin Operational Control

### Implemented Functionality & Artifacts

1. **Central Admin Branch Operations Console (`/admin/branches`)**:
   - Real branch directory with name, code, type (`MAIN`/`FRANCHISE`), status badge, phone, email, assigned villages, and manager info.
   - Interactive search bar (name, code, city) and filtering by branch type and status.
   - Branch Creation modal with validation, uniqueness checks, and address input.
   - Service Area & Village assignment modal with real-time district/village selection and unassignment.

2. **Central Admin Branch Product Matrix (`/admin/branch-matrix`)**:
   - `GET /branches/matrix` endpoint returns global product catalogue alongside per-branch overrides.
   - Matrix table view displaying global products vs active branches.
   - Interactive toggles for availability and inline stock quantity editing per branch with backend persistence.

3. **Branch Admin Scoped Fulfillment & Inventory**:
   - `requireBranchScope` middleware strictly scopes Branch Admin accounts (`user.branchId`).
   - `BranchAdminDashboardPage` (`/admin/branch/dashboard`): Operational statistics, today's order counts, low stock alerts.
   - `BranchAdminProductsPage` (`/admin/branch/products`): Scoped stock updates and availability controls.
   - `BranchAdminOrdersPage` (`/admin/branch/orders`): Order fulfillment console with status filters (`PENDING`, `CONFIRMED`, `PREPARING`, `OUT_FOR_DELIVERY`, `DELIVERED`, `CANCELLED`).

4. **Role-Based Navigation & UI Isolation**:
   - `Sidebar` dynamically displays Central Admin links vs Branch Admin scoped links based on `user.role`.

5. **Audit Logging Integration**:
   - Mutations emit audit events: `BRANCH_CREATED`, `BRANCH_UPDATED`, `BRANCH_ACTIVATED`, `BRANCH_DEACTIVATED`, `VILLAGE_ASSIGNED`, `VILLAGE_UNASSIGNED`, `BRANCH_ADMIN_ASSIGNED`, `BRANCH_ADMIN_REMOVED`, `BRANCH_PRODUCT_ENABLED`, `BRANCH_PRODUCT_DISABLED`, `BRANCH_STOCK_UPDATED`.

6. **Final Regression & Verification Suite**:
   - Backend Typecheck: 0 Errors (`npm run typecheck`).
   - Backend Lint: 0 Errors (`npm run lint`).
   - Backend Tests: 22 Test Suites Passed (`152/152 tests passed`).
   - Backend Build: 0 Errors (`npm run build`).
   - Frontend Typecheck: 0 Errors (`npm run typecheck`).
   - Frontend Lint: 0 Errors (`npm run lint`).
   - Frontend Tests: 8 Test Suites Passed (`38/38 tests passed`).
   - Frontend Build: 0 Errors (`npm run build` / Vite production build).

---

## 27. Milestone 2F — Branch Fulfillment + Delivery Operations + Service-Area Enforcement

### Implemented Functionality & Artifacts

1. **Order Lifecycle State Machine Hardening**:
   - Explicit state transitions enforced by `VALID_STATUS_TRANSITIONS`: `PENDING` -> `CONFIRMED` -> `PREPARING` -> `OUT_FOR_DELIVERY` -> `DELIVERED`.
   - Rejects invalid transitions (e.g. `DELIVERED` -> `PREPARING`, `CANCELLED` -> `CONFIRMED`) with HTTP 422 Unprocessable Entity.

2. **Delivery Operations & Branch Agents**:
   - `USER_ROLES` extended with `"delivery_agent"`.
   - `OrderModel` extended with `deliveryAgentId` and `deliveryAgentSnapshot`.
   - `POST /branches/:branchId/orders/:orderId/assign-delivery` assigns active delivery agent belonging to the same branch.
   - Enforces that home delivery orders MUST have an assigned delivery agent before transitioning to `OUT_FOR_DELIVERY` (HTTP 422).
   - `STORE_PICKUP` orders reject delivery agent assignment attempts (HTTP 422).

3. **Two-Layer Security Isolation & Scoped Lookups**:
   - Verified `user.branchId === route.branchId` AND `order.branchId === route.branchId`. Cross-branch attempts yield HTTP 403 Forbidden.
   - Secure order detail lookup `getOrderByIdForActor` checks customer, branch admin, and central admin permissions.

4. **Service-Area & Location Safety**:
   - Reassigning villages or deactivating branches leaves historical order snapshots (`branchSnapshot`, `locationSnapshot`) 100% immutable.
   - New customer location updates affect ONLY new cart, checkout, and branch resolution.

5. **Audit Logging Integration**:
   - Emits structured audit log entries for `ORDER_STATUS_CHANGED`, `DELIVERY_AGENT_ASSIGNED`, `DELIVERY_AGENT_UNASSIGNED`, `ORDER_CANCELLED`.

6. **Final Regression & Integration Verification Suite**:
   - Backend Typecheck: 0 Errors (`npm run typecheck`).
   - Backend Lint: 0 Errors (`npm run lint`).
   - Backend Tests: 23 Test Suites Passed (`156/156 tests passed`).
   - Backend Build: 0 Errors (`npm run build`).
   - Frontend Typecheck: 0 Errors (`npm run typecheck`).
   - Frontend Lint: 0 Errors (`npm run lint`).
   - Frontend Tests: 8 Test Suites Passed (`38/38 tests passed`).
   - Frontend Build: 0 Errors (`npm run build` / Vite production build).

---

## 28. Milestone 2G — Delivery Agent Operations + Delivery Execution + Customer Delivery Visibility

### Implemented Functionality & Artifacts

1. **Delivery Agent RBAC & Double-Layer Security Isolation**:
   - `requireDeliveryAgent` middleware guard (`role === 'delivery_agent' || role === 'admin'`).
   - Double security verification: `order.deliveryAgentId === req.user.id` AND `order.branchId === req.user.branchId` (rejects cross-agent / cross-branch access with HTTP 403 Forbidden).

2. **Delivery Execution & Management APIs**:
   - `GET /api/v1/delivery-agent/dashboard`: Returns server-calculated daily stats (`todayAssigned`, `todayOutForDelivery`, `todayDelivered`, `todayCancelled`, `pendingDelivery`).
   - `GET /api/v1/delivery-agent/orders`: Returns assigned orders with status filters (`ALL`, `ASSIGNED`, `OUT_FOR_DELIVERY`, `DELIVERED`).
   - `GET /api/v1/delivery-agent/orders/:orderId`: Returns order details strictly scoped to assigned agent and branch.
   - `POST /api/v1/delivery-agent/orders/:orderId/start`: Transitions order status from `PREPARING` to `OUT_FOR_DELIVERY`, records `deliveryStartedAt`, emits `DELIVERY_STARTED` audit log event.
   - `POST /api/v1/delivery-agent/orders/:orderId/complete`: Transitions order status from `OUT_FOR_DELIVERY` to `DELIVERED`, records `deliveredAt`, emits `DELIVERY_COMPLETED` audit log event.

3. **Store Pickup & Inactive Agent Protection**:
   - `STORE_PICKUP` orders reject delivery execution attempts (`start` or `complete`) with HTTP 422 Unprocessable Entity.
   - Inactive agents or agents moved to another branch are rejected with HTTP 403 Forbidden.
   - Completing delivery before starting (`PREPARING` -> `DELIVERED`) returns HTTP 422 Unprocessable Entity.

4. **Snapshot & Location Safety**:
   - Customer profile location changes do NOT mutate historical order snapshots (`locationSnapshot`, `branchSnapshot`, `deliveryAgentSnapshot`).
   - Historical delivery address displays strictly from locked immutable order snapshots.

5. **Frontend Delivery Partner Portal**:
   - Dedicated mobile-friendly `DeliveryAgentDashboardPage.tsx` (`/agent/dashboard`).
   - Scoped `Sidebar.tsx` rendering only Delivery Dashboard & My Deliveries for `delivery_agent` role.

6. **Audit Logging Integration**:
   - Emits structured audit log entries for `DELIVERY_STARTED` and `DELIVERY_COMPLETED`.

7. **Final Regression & Integration Verification Suite**:
   - Backend Typecheck: 0 Errors (`npm run typecheck`).
   - Backend Lint: 0 Errors (`npm run lint`).
   - Backend Tests: 24 Test Suites Passed (`161/161 tests passed`).
   - Backend Build: 0 Errors (`npm run build`).
   - Frontend Typecheck: 0 Errors (`npm run typecheck`).
   - Frontend Lint: 0 Errors (`npm run lint`).
   - Frontend Tests: 8 Test Suites Passed (`38/38 tests passed`).
   - Frontend Build: 0 Errors (`npm run build` / Vite production build).

