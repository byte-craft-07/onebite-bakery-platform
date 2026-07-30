# Architecture Contracts

This document defines backend contracts that every future module must follow.

---

# API Version

Current API prefix:

`/api/v1`

API version constants must come from backend shared constants.

Future breaking API changes must use a new version instead of changing `/api/v1`.

---

# Response Contract

Success response:

```json
{
  "success": true,
  "message": "Success",
  "data": {}
}
```

Error response:

```json
{
  "success": false,
  "message": "Something went wrong",
  "errors": [],
  "code": "INTERNAL_SERVER_ERROR"
}
```

All controllers must use shared response helpers.

Do not return custom response shapes.

---

# Pagination Contract

Default page:

`1`

Default limit:

`20`

Maximum limit:

`100`

Paginated payloads must include:

* items
* pagination metadata

---

# Error Contract

Throw application errors with:

* standard HTTP status
* application error code
* safe public message
* optional error details

Validation failures return:

`422`

Unknown failures return:

`500`

Sensitive details must never be sent to clients.

---

# Request Context Contract

Future authenticated modules must pass request context through services instead of passing Express request/response objects.

Allowed context fields:

* requestId
* userId
* userRole
* ip
* userAgent

---

# Middleware Contract

Global middleware order:

1. Request logging
2. Security headers
3. CORS
4. Global rate limit
5. JSON/body parsing
6. Request sanitization
7. HTTP parameter pollution protection
8. Compression
9. API routes
10. Not-found handler
11. Global error handler

Feature modules may add stricter route-specific middleware, but must not bypass global middleware.

---

# Security Contract

Query, body and params must be sanitized before controllers.

CORS origins must be configured explicitly in production.

Route-specific rate limits must be added for:

* OTP
* Authentication
* Uploads
* Checkout

Logs must redact:

* Authorization headers
* Cookies
* OTP values
* JWT values
* Secrets

OTP foundation rules:

* OTP length is 6 digits.
* OTP expiry is 5 minutes.
* Maximum verification attempts is 5.
* Maximum resend count is 3.
* Cooldown is 60 seconds.
* OTP values are stored only as server-secret HMAC hashes.
* OTP comparison must use constant-time comparison.
* Successful verification invalidates the challenge.
* OTP delivery must use the `OtpProvider` abstraction.
* Development delivery providers must not log raw OTP values.
* OTP foundation must not issue JWTs, refresh tokens, cookies, or sessions.

---

# Module Contract

Future feature modules should follow this structure:

```text
modules/<feature>/
  routes/
  controller/
  service/
  repository/
  validators/
  dto/
  types/
  constants/
  model/
  index.ts
```

Create only files that contain real architecture contracts or implementation.
Do not add empty controller/service/repository files before the feature is implemented.

Controllers should only:

* receive requests
* validate input
* call services
* return responses

Services must not depend on Express request/response objects.

Repositories must contain database queries only.

Current module routes are centrally registered under `/api/v1`:

* `/auth`
* `/users`
* `/addresses`
* `/products`
* `/categories`
* `/cart`
* `/orders`
* `/reviews`
* `/favorites`
* `/settings`
* `/upload`
* `/search`
* `/health`

---

# Database Contract

All MongoDB models must use:

* TypeScript interfaces
* Mongoose schemas
* timestamps
* named indexes
* validation at schema level
* collection-name constants

Indexes must be added only when they support:

* unique business constraints
* frequent lookup paths
* TTL cleanup
* geospatial lookup

Every index must have a clear reason documented near the schema.

Future feature repositories should extend the shared base repository instead of duplicating common query methods.

Business logic must not be placed inside repositories.

---

# Authentication Foundation Contract

Current OTP endpoints:

* `POST /auth/send-otp`
* `POST /auth/verify-otp`
* `POST /auth/refresh`
* `POST /auth/logout`
* `POST /auth/logout-all`
* `GET /auth/me`

Dependency flow:

```text
Controller
  -> Service
  -> Repository + Provider
  -> Database / Delivery implementation
```

Routes only register endpoint middleware and controller handlers.

Controllers must not access Mongoose.

Repositories must not contain OTP business rules.

Authentication session rules:

* Access and refresh tokens must be sent through HttpOnly cookies.
* Refresh tokens must be hashed before database storage.
* Refresh token rotation must revoke the previous session token.
* Multiple devices are represented as separate refresh-token sessions.
* Logout revokes the current refresh session.
* Logout all revokes all active refresh sessions for the authenticated user.

---

# Category Module Contract

Public category listing:

* `GET /categories`
* returns active, non-deleted categories only
* returns a nested tree sorted by `displayOrder`

Owner category APIs require authentication and owner/admin role authorization.

Category hierarchy rules:

* Duplicate active category names are rejected.
* Slugs are canonical and unique.
* Parent relationships cannot be circular.
* Categories with active child categories cannot be soft-deleted.
* Soft-deleted categories must not appear in public responses.

---

# Celebration Commerce Contract

OneBite Bakery is a Celebration Commerce Platform.

Product architecture must support:

* `NORMAL`
* `COMBO`
* `CUSTOM_CAKE`

Occasions are independent from categories.

Products may belong to multiple occasions.

Combo products are first-class products and reference child products through `comboItems`.

Decoration products use the same Product architecture as bakery products.

Delivery eligibility must use configurable settings:

* `delivery.minimumHomeDeliveryAmount`
* `delivery.homeDeliveryEnabled`
* `delivery.pickupEnabled`

Product, occasion, combo, checkout, cart, inventory, and search business logic must be implemented only in their approved future milestones.

---

# Product Foundation Contract

Public product APIs:

* `GET /products`
* `GET /products/:slug`

Public product APIs must return active, non-deleted products only.

Owner product APIs require authentication and owner/admin role authorization.

Product foundation includes:

* product CRUD
* canonical unique slugs
* category reference validation
* occasion reference validation
* soft delete and restore
* URL-only media fields
* SEO metadata

Product foundation must not implement:

* inventory
* stock deduction
* upload integration
* search indexing
* cart/order/checkout behavior
* review/favorite behavior
* combo inventory logic
