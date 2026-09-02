# Payment Provider Specification

## Purpose

This document defines the implementation contract for all payment providers used in the The Online Bakery Platform.

It standardizes how payment providers integrate with the Payment module while keeping the business logic provider-independent.

This specification applies to all current and future providers.

---

# Goals

Support current provider:

- Razorpay UPI only

Current checkout must not expose COD, manual UPI verification, cards, wallets, net banking, EMI, or pay-later methods.

Support future providers without architecture changes:

- PhonePe
- Paytm
- Direct bank integrations

Controllers and Services must never depend on provider-specific SDKs.

---

# Provider Architecture

Payment Controller

↓

Payment Service

↓

Payment Provider Interface

↓

Provider Implementation

↓

External Gateway (if applicable)

Only the Provider Implementation may communicate with external payment systems.

---

# Payment Provider Interface

Every provider must implement the following operations:

- createPaymentIntent()
- processPayment()
- verifyPayment()
- cancelPayment()
- getPaymentStatus()

Optional future methods:

- refundPayment()
- capturePayment()
- voidPayment()

Controllers and Services communicate only through this interface.

---

# Provider Responsibilities

A provider is responsible for:

- Creating payment requests
- Validating payment responses
- Verifying transactions
- Returning standardized responses
- Handling provider-specific errors

Providers must not:

- Access repositories directly
- Modify Orders directly
- Modify Inventory
- Perform business logic

---

# Standard Payment Response

Every provider must return a normalized response.

Required fields:

- success
- paymentStatus
- provider
- transactionId
- providerReference
- message
- metadata

Never expose provider secrets.

---

# Payment Status Mapping

Internal statuses:

- PENDING
- PROCESSING
- SUCCESS
- FAILED
- CANCELLED
- REFUNDED (Future)

Every provider must map its own status values to these internal statuses.

Business logic must never use provider-specific status values.

---

# Idempotency

All payment requests must support idempotency.

Repeated requests with the same idempotency key must return the same logical result.

Duplicate payment creation must be prevented.

---

# Timeout Rules

Every provider should define:

Connection Timeout

Response Timeout

Retry Policy

Timeouts must not leave Orders in inconsistent states.

---

# Retry Strategy

Retry only for temporary failures.

Examples:

- Network timeout
- Temporary gateway outage

Never retry:

- Invalid payment request
- Authentication failure
- Invalid signature

Maximum retries should be configurable.

---

# Verification Rules

Payment verification must always happen on the server.

Client-side payment status must never be trusted.

Verification should include:

- Transaction ID
- Amount
- Currency
- Order Reference
- Provider Signature (if available)

---

# Webhook Support

Razorpay webhooks are the source of truth for final payment capture.

Webhook flow:

Gateway

↓

Webhook Controller

↓

Provider Verification

↓

Payment Service

↓

Order Update

Webhook requests must always verify signatures before processing.

Webhook processing must verify order mapping, amount, currency, payment method, and idempotency before marking an order paid.

---

# Logging Rules

Allowed:

- Provider name
- Transaction ID
- Payment status
- Timestamp

Never log:

- Secret keys
- Access tokens
- Refresh tokens
- Raw payment payloads containing sensitive information
- Full UPI IDs (mask if needed)

---

# Error Handling

Providers must convert provider-specific errors into standardized application errors.

Examples:

- PAYMENT_FAILED
- PAYMENT_TIMEOUT
- PAYMENT_CANCELLED
- INVALID_SIGNATURE
- DUPLICATE_PAYMENT
- PROVIDER_UNAVAILABLE

Controllers must never receive provider-specific exceptions.

---

# Security Rules

Use HTTPS only.

Validate every callback.

Never expose provider credentials.

Never trust client payment confirmation.

Secrets must come from environment variables.

Rotate credentials periodically.

---

# Configuration

Each provider should load configuration from the environment.

Example:

- API Keys
- Secret Keys
- Webhook Secret
- Merchant ID
- Environment (Sandbox / Production)

Configuration must never be hardcoded.

---

# Testing Requirements

Every provider must include:

- Unit Tests
- Mock Provider Tests
- Failure Scenario Tests
- Timeout Tests
- Invalid Signature Tests

No provider should be merged without automated tests.

---

# Supported Providers

## Current

- COD Provider
- Manual UPI Provider

## Planned

- Razorpay Provider
- Stripe Provider
- PhonePe Provider
- Paytm Provider
- Google Pay Provider

Future providers must implement the same interface without changing business logic.

---

# Definition of Done

A payment provider implementation is complete when:

✓ Implements the Payment Provider Interface

✓ Returns standardized responses

✓ Supports idempotency

✓ Handles failures gracefully

✓ Passes automated tests

✓ Uses environment-based configuration

✓ Does not contain business logic

✓ Does not bypass Payment Service

✓ Meets all security requirements defined in 16_SECURITY.md
