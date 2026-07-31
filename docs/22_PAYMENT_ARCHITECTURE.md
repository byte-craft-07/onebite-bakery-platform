# Payment Architecture

## Purpose

This document defines the payment architecture for OneBite Bakery Platform.

The payment system must be provider-independent, secure, scalable, and future-ready.

Business logic must never depend on a specific payment gateway.

---

# Goals

Support:

- Cash on Delivery (COD)
- Manual UPI Verification

Future:

- Razorpay
- Stripe
- PhonePe
- Paytm
- Google Pay

without changing Order logic.

---

# Core Principles

Order Management and Payment Management are separate modules.

Orders should never contain gateway-specific logic.

Payments must reference Orders.

One Order can have multiple payment attempts.

Payment history must never be deleted.

---

# Architecture

Order

↓

Payment Intent

↓

Payment Transaction

↓

Payment Provider

---

# Payment Intent

A Payment Intent represents the customer's selected payment method for an order.

Example:

Order #1001

↓

Payment Intent

↓

UPI

If the customer changes from UPI to COD:

Only Payment Intent changes.

The Order remains unchanged.

---

# Payment Transaction

Every payment attempt creates a transaction.

Example

Attempt 1

UPI

FAILED

↓

Attempt 2

UPI

SUCCESS

↓

Attempt 3

Refund

Future

Transactions are immutable.

Never overwrite history.

---

# Payment Provider

Create a provider interface.

PaymentProvider

↓

CODProvider

↓

UPIProvider

↓

Future

RazorpayProvider

StripeProvider

PhonePeProvider

PaytmProvider

Business logic should communicate only through the interface.

---

# Payment Status

PENDING

PROCESSING

SUCCESS

FAILED

CANCELLED

REFUNDED (Future)

PARTIALLY_REFUNDED (Future)

---

# Payment Methods

Supported

COD

UPI

Future

Credit Card

Debit Card

Wallet

Net Banking

EMI

---

# Payment Flow

Customer

↓

Create Order

↓

Create Payment Intent

↓

Select Provider

↓

Process Payment

↓

Create Transaction

↓

Update Payment Status

↓

Update Order Status

---

# Retry Rules

A failed payment must not create a new Order.

Create a new Payment Transaction.

Reuse the same Payment Intent where applicable.

---

# Security Rules

Never trust payment status from clients.

Verify payment server-side.

Never expose secrets.

Never log sensitive payment information.

Validate every callback.

Use signed webhook verification for future providers.

---

# Future Webhooks

Supported architecture:

Gateway

↓

Webhook Controller

↓

Provider Verification

↓

Payment Service

↓

Order Update

---

# Refund Architecture

Future support:

Refund Request

↓

Refund Provider

↓

Refund Transaction

↓

Order Update

---

# Audit Trail

Store:

Transaction ID

Provider

Timestamp

Amount

Status

Failure Reason

IP Address (optional)

User Agent (optional)

Audit records must never be deleted.

---

# Error Handling

Invalid Provider

Invalid Signature

Payment Timeout

Duplicate Callback

Already Paid

Expired Payment

Order Not Found

---

# Provider Independence

Controllers

↓

Payment Service

↓

Payment Provider Interface

↓

Provider Implementation

Never call gateway SDKs directly from Controllers or Services.

---

# Future Expansion

Planned Providers

- Razorpay
- Stripe
- PhonePe
- Paytm
- Google Pay

No architecture changes should be required to support new providers.

---

# Definition of Done

The payment architecture is considered complete when:

✓ Provider abstraction exists

✓ Payment Intent implemented

✓ Payment Transactions implemented

✓ Secure validation exists

✓ Order integration completed

✓ Documentation updated

✓ Tests passing

✓ No gateway-specific logic inside business services