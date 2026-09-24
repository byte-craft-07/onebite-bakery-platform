# ONEBITE BAKERY — MILESTONE 2F IMPLEMENTATION REPORT

## A. Audit Findings
- **Order Lifecycle State Machine**: Pre-existing `VALID_STATUS_TRANSITIONS` map was enforced in `OrderService.adminUpdateOrderStatus` and extended to ensure `OUT_FOR_DELIVERY` requires an assigned delivery agent for home delivery orders.
- **Delivery Agent Operations**: Added `"delivery_agent"` to `USER_ROLES` in `UserModel` and `deliveryAgentId` / `deliveryAgentSnapshot` to `OrderModel`. Added endpoints for listing branch delivery agents and assigning/unassigning delivery agents.
- **Two-Layer Security Isolation**: Verified `user.branchId === route.branchId` AND `order.branchId === route.branchId`. Rejects cross-branch agent assignment or order status updates with HTTP 403 Forbidden.
- **Order Detail Security**: `getOrderByIdForActor` verifies customer (`customerId`), Branch Admin (`branchId`), or Central Admin access rights.
- **Snapshot & Location Safety**: Immutable snapshots (`branchSnapshot`, `locationSnapshot`) remain untouched during village reassignments or customer location changes.

## B. Existing Components Reused
- `OrderModel`, `UserModel`, `BranchModel`, `AuditLogModel`.
- `VALID_STATUS_TRANSITIONS` state machine map.
- `requireBranchScope` middleware and `requireBranchAdmin` / `requireCentralAdmin` guards.
- `BranchAdminOrdersPage` and `adminBranchProductService`.

## C. Backend Changes
- **[user.model.ts](file:///c:/Users/ajayk/OneDrive/Desktop/new/bakery-platform/backend/src/modules/user/model/user.model.ts)**: Added `"delivery_agent"` to `USER_ROLES`.
- **[order.model.ts](file:///c:/Users/ajayk/OneDrive/Desktop/new/bakery-platform/backend/src/modules/order/model/order.model.ts)**: Added `OrderDeliveryAgentSnapshot` interface and `deliveryAgentId` / `deliveryAgentSnapshot` schema fields.
- **[order.constants.ts](file:///c:/Users/ajayk/OneDrive/Desktop/new/bakery-platform/backend/src/modules/order/constants/order.constants.ts)**: Allowed `PREPARING` -> `OUT_FOR_DELIVERY` transitions.
- **[order.types.ts](file:///c:/Users/ajayk/OneDrive/Desktop/new/bakery-platform/backend/src/modules/order/types/order.types.ts)**: Added `deliveryAgentId` and `deliveryAgentSnapshot` to `OrderResponse`.
- **[order.service.ts](file:///c:/Users/ajayk/OneDrive/Desktop/new/bakery-platform/backend/src/modules/order/service/order.service.ts)**: Added `assignDeliveryAgent`, `unassignDeliveryAgent`, `getOrderByIdForActor`, and delivery agent check for `OUT_FOR_DELIVERY` transitions.
- **[branch.routes.ts](file:///c:/Users/ajayk/OneDrive/Desktop/new/bakery-platform/backend/src/modules/branch/routes/branch.routes.ts)**: Mounted `GET /branches/:branchId/delivery-agents`, `POST /branches/:branchId/orders/:orderId/assign-delivery`, and `POST /branches/:branchId/orders/:orderId/unassign-delivery`.

## D. Frontend Changes
- **[adminBranchProduct.service.ts](file:///c:/Users/ajayk/OneDrive/Desktop/new/bakery-platform/frontend/src/features/admin/services/adminBranchProduct.service.ts)**: Added `getBranchDeliveryAgents`, `assignDeliveryAgent`, and `unassignDeliveryAgent` methods.
- **[BranchAdminOrdersPage.tsx](file:///c:/Users/ajayk/OneDrive/Desktop/new/bakery-platform/frontend/src/features/admin/pages/BranchAdminOrdersPage.tsx)**: Added delivery agent selector dropdown for home delivery orders and display of location snapshots.

## E. Database Changes
- Extended `orders` collection schema with `deliveryAgentId` and `deliveryAgentSnapshot`.

## F. API Changes
- Added: `GET /api/v1/branches/:branchId/delivery-agents`
- Added: `POST /api/v1/branches/:branchId/orders/:orderId/assign-delivery`
- Added: `POST /api/v1/branches/:branchId/orders/:orderId/unassign-delivery`

## G. Order Lifecycle
- Enforced state transitions: `PENDING` -> `CONFIRMED` -> `PREPARING` -> `OUT_FOR_DELIVERY` -> `DELIVERED`.
- `PENDING` / `CONFIRMED` -> `CANCELLED`.
- Invalid transitions (e.g. `DELIVERED` -> `PREPARING`, `CANCELLED` -> `CONFIRMED`) return HTTP 422 Unprocessable Entity.

## H. Delivery Operations
- Delivery agents must be active and belong to the order's branch (`agent.branchId === order.branchId`).
- `STORE_PICKUP` orders reject delivery agent assignments (HTTP 422).
- Home delivery orders require an assigned delivery agent before transitioning to `OUT_FOR_DELIVERY`.

## I. Branch Isolation
- Layer 1: Authenticated user `branchId === route.branchId`.
- Layer 2: Target order `branchId === route.branchId`.
- Cross-branch access yields HTTP 403 Forbidden.

## J. Security Verification
- Unauthenticated requests return HTTP 401 Unauthorized.
- Unauthorized order views by customer or cross-branch admin return HTTP 403 Forbidden.

## K. Audit Logging
- Emits audit log entries for `ORDER_STATUS_CHANGED`, `DELIVERY_AGENT_ASSIGNED`, `DELIVERY_AGENT_UNASSIGNED`, `ORDER_CANCELLED`.

## L. Tests Added
- **`backend/src/modules/branch/milestone-2f.integration.test.ts`**: Tests state machine transitions, delivery requirement for `OUT_FOR_DELIVERY`, same-branch agent assignment isolation, store pickup assignment rejection, and customer/branch isolation.

## M. Verification Results

Backend:
- Typecheck: **PASSED** (`0 errors`)
- Lint: **PASSED** (`0 errors`)
- Tests: **PASSED** (`23/23 test suites`, `156/156 tests passed`)
- Build: **PASSED** (`tsc -p tsconfig.build.json`)

Frontend:
- Typecheck: **PASSED** (`0 errors`)
- Lint: **PASSED** (`0 errors`)
- Tests: **PASSED** (`8/8 test suites`, `38/38 tests passed`)
- Build: **PASSED** (`vite build`)

## N. Files Modified
- `backend/src/modules/user/model/user.model.ts`
- `backend/src/modules/order/model/order.model.ts`
- `backend/src/modules/order/constants/order.constants.ts`
- `backend/src/modules/order/types/order.types.ts`
- `backend/src/modules/order/service/order.service.ts`
- `backend/src/modules/branch/routes/branch.routes.ts`
- `frontend/src/features/admin/services/adminBranchProduct.service.ts`
- `frontend/src/features/admin/pages/BranchAdminOrdersPage.tsx`
- `docs/BRANCH_SYSTEM_IMPLEMENTATION_BASELINE.md`

## O. Files Created
- `backend/src/modules/branch/milestone-2f.integration.test.ts`
- `docs/MILESTONE_2F_IMPLEMENTATION_REPORT.md`

## P. Remaining Issues
No known implementation or verification issues remain for Milestone 2F based on the completed test suite and build verification.
