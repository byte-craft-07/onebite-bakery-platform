# Risk Register

# RISK REGISTER

Project

Onebite Bakery Platform

Purpose

Track potential risks before they become real problems.

Every major feature should have a mitigation plan.

--------------------------------------------------------

Risk ID

R001

Risk

MongoDB Connection Failure

Impact

Critical

Probability

Low

Mitigation

Automatic retry

Health check endpoint

MongoDB Atlas monitoring

--------------------------------------------------------

Risk ID

R002

Risk

Google identity provider failure

Impact

High

Mitigation

Retry mechanism

Expiry timer

Rate limiting

--------------------------------------------------------

Risk ID

R003

Risk

Cloudinary Upload Failure

Impact

Medium

Mitigation

Retry upload

Show friendly error

Do not create incomplete orders

--------------------------------------------------------

Risk ID

R004

Risk

Large Image Upload

Impact

Medium

Mitigation

Compress image

Maximum size validation

WebP conversion

--------------------------------------------------------

Risk ID

R005

Risk

Customer Orders Same Product Simultaneously

Impact

Critical

Mitigation

Atomic database update

Stock validation

Transactions where applicable

--------------------------------------------------------

Risk ID

R006

Risk

Admin Accidentally Deletes Product

Impact

High

Mitigation

Soft Delete

Restore option

Confirmation dialog

--------------------------------------------------------

Risk ID

R007

Risk

Slow Mobile Internet

Impact

High

Mitigation

Lazy loading

Compressed images

Skeleton loaders

--------------------------------------------------------

Risk ID

R008

Risk

Server Crash

Impact

Critical

Mitigation

PM2

Automatic restart

Error logging

Monitoring

--------------------------------------------------------

Risk ID

R009

Risk

Unexpected Traffic During Festivals

Impact

High

Mitigation

Pagination

Caching (future)

Optimized database queries

--------------------------------------------------------

Risk ID

R010

Risk

Security Attack

Impact

Critical

Mitigation

Helmet

Rate Limiter

Input Validation

JWT

Environment Variables

Secure Headers

--------------------------------------------------------

Risk ID

R011

Risk

Payment Interrupted

Impact

High

Mitigation

Pending Payment Status

Retry Flow

Manual Verification

--------------------------------------------------------

Risk ID

R012

Risk

Customer Abandons Checkout

Impact

High

Mitigation

Single Page Checkout

Minimal Fields

Guest Cart

Fast Google Sign-In

--------------------------------------------------------

Review this document before every major release.
