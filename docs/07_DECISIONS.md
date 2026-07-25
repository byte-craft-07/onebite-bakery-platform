# Decisions

# PROJECT DECISIONS

This document records every major architectural and business decision
taken during the development of the OneBite Bakery Platform.

Every decision must include the reason behind it.

Never change a decision without documenting why.

---

# Decision 01

Backend First

Status

Approved

Reason

Frontend depends on APIs and database.

A stable backend prevents unnecessary frontend rewrites.

---

# Decision 02

Mobile First

Status

Approved

Reason

Most customers will place orders using mobile devices.

Desktop is treated as an expanded version of mobile.

---

# Decision 03

Customer First

Status

Approved

Reason

Every feature should make ordering easier.

If a feature creates confusion,
it must be redesigned.

---

# Decision 04

Premium UI

Status

Approved

Reason

The website should create trust and increase conversion.

Premium appearance improves customer confidence.

---

# Decision 05

TypeScript

Status

Approved

Reason

Better type safety.

Fewer runtime bugs.

Cleaner architecture.

Easier long-term maintenance.

---

# Decision 06

Feature-Based Architecture

Status

Approved

Reason

Every module remains independent.

Easy to maintain.

Easy to scale.

---

# Decision 07

Repository Pattern

Status

Approved

Reason

Database layer remains isolated.

Future database migration becomes easier.

---

# Decision 08

OTP Authentication

Status

Approved

Reason

Most bakery customers remember phone numbers,
not passwords.

Faster checkout.

---

# Decision 09

Guest Cart + Hybrid Cart

Status

Approved

Reason

Customers can shop without logging in.

Cart automatically syncs after login.

Better user experience.

---

# Decision 10

Product Variants

Status

Approved

Reason

One product can have multiple weights,
prices and options.

Reduces duplicate products.

---

# Decision 11

Store Settings

Status

Approved

Reason

Business information must never be hardcoded.

Everything should be editable from Admin Panel.

---

# Decision 12

Single Branch Ready

Status

Approved

Reason

Business currently has one branch.

Architecture should support future expansion.

---

# Decision 13

Single Page Checkout

Status

Approved

Reason

Reduces checkout abandonment.

Improves mobile experience.

---

# Decision 14

Stock Management

Status

Approved

Reason

Stock is reduced only after successful order placement.

Cart should never reserve inventory.

---

# Decision 15

API Versioning

Status

Approved

Reason

Future API updates should not break existing clients.

Version Format

/api/v1/

---

# Decision 16

Order Number Format

Status

Approved

Example

BAK-20260724-0001

Reason

Readable.

Professional.

Easy to search.

---

# Decision 17

Soft Delete

Status

Approved

Reason

Products and categories should be recoverable.

Avoid accidental permanent deletion.

---

# Decision 18

Image Storage

Status

Approved

Reason

Images stored in Cloudinary.

Database stores URLs only.

Improves performance.

---

# Decision 19

Validation

Status

Approved

Reason

Every request must be validated before entering business logic.

---

# Decision 20

Logging

Status

Approved

Reason

Important actions should be traceable.

Examples

User Login

Order Created

Status Updated

Product Added

Customer Review

---

# Decision 21

Error Handling

Status

Approved

Reason

Global error handler.

Consistent API responses.

---

# Decision 22

Pagination

Status

Approved

Reason

Never return thousands of records in one request.

Default page size

20

---

# Decision 23

Performance First

Status

Approved

Reason

Target customers may use slower mobile networks.

Fast loading is mandatory.

---

# Decision 24

Admin Simplicity

Status

Approved

Reason

Owner should learn the dashboard within minutes.

Avoid unnecessary complexity.

---

# Decision 25

Documentation First

Status

Approved

Reason

Every major feature must be documented before development.

Planning reduces future rework.

---

# Future Decisions

Any future architectural change must be added below this section.

Never remove historical decisions.

Only mark them as Deprecated if replaced.

---

# Decision 26

Shared Architecture Contracts

Status

Approved

Reason

Every future backend module must reuse the same response shape,
pagination defaults, error codes, HTTP status constants,
request context shape, route constants, logger, and middleware conventions.

This prevents duplicate patterns and keeps controllers, services,
and repositories consistent across the platform.

---

# Decision 27

Database Foundation Before Feature Modules

Status

Approved

Reason

User, Address, OTP, RefreshToken, and Settings models are foundational
for authentication, customer profile, serviceability, and configurable
business behavior.

Creating these models before feature modules ensures future services
reuse consistent schema patterns, indexes, timestamps, validation,
and repository conventions.

---

# Decision 28

Feature Module Architecture

Status

Approved

Reason

Every backend feature uses a module-first structure with route registration
at the module boundary and centralized mounting under `/api/v1`.

Controllers, services, repositories, validators, DTOs, types, constants,
models, and routes must stay inside the owning module when they are needed.

Empty placeholders should be avoided until a layer has a real contract or
implementation.
