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
