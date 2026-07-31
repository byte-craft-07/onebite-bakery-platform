# 37 — Frontend Architecture Specification

## 1. Stack & Directory Structure

- **Framework**: Vite + React 18 + TypeScript (Strict Mode).
- **Styling**: TailwindCSS v3 + CSS Modules / Design Tokens.
- **State Management**: TanStack Query v5 (Server State & Caching) + Zustand (Client Cart / Auth Local State).
- **Routing**: React Router v6.

```
frontend/
├── src/
│   ├── assets/          # Static media, icons, fonts
│   ├── components/      # Shared UI library (Button, Modal, Card, etc.)
│   ├── features/        # Feature modules
│   │   ├── auth/
│   │   ├── catalog/
│   │   ├── cart/
│   │   ├── checkout/
│   │   ├── orders/
│   │   ├── admin/
│   ├── hooks/           # Custom React hooks
│   ├── services/        # Axios API client instances and endpoints
│   ├── store/           # Zustand stores
│   ├── types/           # Shared TypeScript interfaces & DTOs
│   ├── utils/           # Helper functions & formatters
│   ├── routes.tsx       # Route definitions & guards
│   └── App.tsx
```

---

## 2. API Integration & Service Layer

- Axios instance configured with base URL `/api/v1`, credentials handling (`withCredentials: true`), and automatic correlation ID header injection (`x-request-id`).
- TanStack Query hooks (`useQuery`, `useMutation`) for caching, optimistic updates, and automatic background refetching.

---

## 3. State Management Strategy

- **Server State**: Managed by TanStack Query (product listings, order details, settings).
- **Client State**:
  - `useAuthStore` (Zustand): User session state, active role, token refresh state.
  - `useCartStore` (Zustand): Persistent guest/customer cart items, drawer visibility, subtotal recalculation triggers.

---

## 4. Route Guards & Code Splitting

- **Route Guards**: `ProtectedRoute` (requires authentication), `AdminRoute` (requires `admin` role), `GuestRoute` (redirects logged-in users).
- **Code Splitting**: Dynamic imports (`React.lazy`) for heavy pages (Admin Dashboard, Custom Cake Builder, Order Tracking) to keep initial bundle under 150KB.
