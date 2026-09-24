# Code Standards

# CODE STANDARDS

This document defines the coding standards for the Onebite Bakery Platform.

Every developer and AI agent must follow these rules.

---

# GENERAL PRINCIPLES

Write code for humans first.

Readable code is better than clever code.

Keep functions small.

Keep files organized.

Avoid duplication.

Think scalability.

---

# PROJECT STRUCTURE

Use Feature Based Architecture.

Every feature must be isolated.

Example

modules/

auth/

product/

order/

cart/

review/

customer/

settings/

Never mix business logic between modules.

---

# FILE NAMING

Use lowercase.

Use kebab-case for folders.

Examples

custom-cake

product

order

Files

product.controller.ts

product.service.ts

product.repository.ts

product.routes.ts

product.validation.ts

product.model.ts

---

# TYPESCRIPT

Strict Mode ON

Never use

any

Prefer

unknown

or proper interfaces.

Always create types.

Always create interfaces.

---

# IMPORT ORDER

1.

Node Modules

2.

Third Party Libraries

3.

Internal Modules

4.

Relative Imports

Always keep one blank line between groups.

---

# FUNCTIONS

Maximum preferred size

50 Lines

Split large functions.

One function should solve one problem.

---

# CONTROLLERS

Controllers should

Receive Request

Validate

Call Service

Return Response

Nothing else.

Never write business logic inside controllers.

---

# SERVICES

Business Logic only.

Never access Express Request.

Never return Express Response.

---

# REPOSITORIES

Database Queries only.

Never write business logic.

---

# MODELS

Only Schema.

Indexes.

Virtuals.

Hooks.

Nothing else.

---

# VALIDATION

Use Zod.

Every request must be validated.

Never trust client data.

---

# ERROR HANDLING

Throw custom errors.

Never return raw errors.

Use Global Error Middleware.

---

# LOGGING

Use Pino.

Log

Errors

Warnings

Important Actions

Never log

Passwords

JWT

Sensitive Data

---

# ENVIRONMENT VARIABLES

Never hardcode

API Keys

Database URLs

JWT Secret

Cloudinary Keys

Everything must come from .env

---

# DATABASE

Always use indexes.

Always paginate.

Never fetch unnecessary fields.

Use lean() where possible.

Avoid N+1 queries.

---

# API DESIGN

REST API

Versioned

/api/v1/

Plural Resources

/products

/orders

/customers

---

# STATUS CODES

200

201

204

400

401

403

404

409

422

500

---

# RESPONSE FORMAT

Success

{
 "success": true,
 "message": "",
 "data": {}
}

Error

{
 "success": false,
 "message": "",
 "errors": []
}

Never return random response structures.

---

# PAGINATION

Default

20

Maximum

100

Response

Page

Limit

Total

Total Pages

Data

---

# SECURITY

Helmet

Rate Limiter

CORS

XSS Protection

Mongo Injection Protection

Input Validation

Secure Cookies

---

# PERFORMANCE

Lazy Loading

Compression

Caching (Future)

Optimized Queries

Image Optimization

Minimal Bundle Size

---

# COMMENTS

Comment WHY.

Do not comment WHAT.

Bad

// increment i

Good

// Prevent duplicate orders during retry

---

# GIT COMMITS

Format

feat:

fix:

refactor:

docs:

style:

test:

build:

Examples

feat: add cart api

fix: order status bug

docs: update database design

---

# BRANCHES

main

develop

feature/<name>

bugfix/<name>

hotfix/<name>

---

# TESTING

Write tests for

Services

Utilities

Critical APIs

Authentication

Orders

Payments

---

# DO NOT

❌ Duplicate code

❌ Hardcode values

❌ Massive controllers

❌ Massive services

❌ Console.log in production

❌ Inline database queries everywhere

❌ Nested callbacks

❌ Magic Numbers

❌ Unhandled Promises

❌ Ignore TypeScript errors

---

# ALWAYS

✅ Clean Code

✅ Strong Typing

✅ Reusable Components

✅ Mobile First

✅ Customer First

✅ Performance First

✅ Secure

✅ Scalable

✅ Maintainable

---

# GOLDEN RULE

If a new feature does not improve the customer experience,
reconsider whether it should exist.

Every line of code should have a purpose.
