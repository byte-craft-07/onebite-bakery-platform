# Security

# SECURITY POLICY

Project

OneBite Bakery Platform

Brand

OneBite Bakery

Tagline

हर जश्न का पहला निवाला।

Version

1.0

Purpose

This document defines the security standards for the OneBite Bakery Platform.

Every feature must follow these rules before deployment.

Security is part of development, not an afterthought.

---

# SECURITY PRINCIPLES

1. Never trust client input.

2. Validate everything.

3. Sanitize everything.

4. Least privilege access.

5. Secure by default.

6. Fail safely.

7. Log important events.

8. Never expose secrets.

---

# THREAT MODEL

Primary Assets

- Customer Accounts
- Customer Addresses
- Orders
- Custom Cake Images
- Reviews
- Favorites
- Owner Dashboard
- Business Settings

Potential Attackers

- Anonymous users
- Automated bots
- Spammers
- Malicious customers
- Credential attackers

---

# AUTHENTICATION SECURITY

Use OTP Authentication.

OTP expires after 5 minutes.

Maximum OTP attempts

5

Maximum OTP resend

3 per 15 minutes

After repeated failures

Temporarily block verification.

Never store plain OTP.

Store only hashed OTP.

OTP becomes invalid immediately after successful verification.

OTP hashing must use a server-side secret.

Production must configure:

OTP_HASH_SECRET

Development delivery providers must never log raw OTP values.

---

# SESSION SECURITY

Use JWT Access Token.

Use Refresh Token Rotation.

Every login creates a new session.

Support multiple devices.

Owner can revoke sessions.

Logout removes Refresh Token.

Expired tokens cannot be reused.

---

# AUTHORIZATION

Version 1 Roles

Customer

Owner

Every protected route must verify:

Authentication

Authorization

Ownership

Never rely on frontend permissions.

---

# PASSWORD POLICY

Reserved for future.

Current Version

OTP only.

---

# API SECURITY

Every request must:

Validate input

Sanitize input

Return standardized responses

Use correct HTTP status codes

Version

/api/v1/

Sensitive endpoints require authentication.

---

# RATE LIMITING

General API

100 requests / 15 minutes

OTP Send

5 requests / 15 minutes

OTP Verify

10 requests / 15 minutes

Login

10 requests / 15 minutes

Review Submission

10 requests / hour

Order Placement

20 requests / hour

---

# REQUEST VALIDATION

Validate

Body

Params

Query

Headers (where applicable)

Reject invalid payloads.

Never trust frontend validation.

---

# INPUT SANITIZATION

Sanitize

Body

Params

Query

Prevent

NoSQL Injection

XSS

Prototype Pollution

---

# FILE UPLOAD SECURITY

Allowed Types

JPG

JPEG

PNG

WEBP

Maximum Size

5 MB

Randomize filenames.

Validate MIME type.

Reject executable files.

Reject HTML.

Reject JavaScript.

Reject SVG unless explicitly sanitized.

Future

Virus scanning.

---

# DATABASE SECURITY

Repository Pattern only.

No raw database access from controllers.

Indexes for performance.

Use transactions where required.

Soft delete supported.

Never expose internal database IDs unnecessarily.

---

# HEADERS

Enable Helmet.

Recommended headers

Content-Security-Policy

X-Frame-Options

X-Content-Type-Options

Referrer-Policy

Permissions-Policy

Strict-Transport-Security

---

# CORS

Whitelist allowed origins only.

Development

localhost only.

Production

Frontend Domain

Admin Domain

Reject unknown origins.

---

# ENVIRONMENT VARIABLES

Never commit

JWT_SECRET

JWT_REFRESH_SECRET

MongoDB URI

Cloudinary Secret

OTP Provider Key

Any API Secret

Maintain

.env.example

only.

---

# LOGGING

Log

Authentication

Orders

Admin Actions

Errors

Warnings

Never log

OTP

JWT

Secrets

PII beyond operational need

Payment credentials

---

# ERROR RESPONSES

Never expose

Stack traces

Database errors

Internal paths

Library versions

Use generic messages for clients.

Log detailed errors internally.

---

# SECURITY MONITORING

Track

Failed Logins

OTP Failures

Rate Limit Violations

Admin Actions

Unexpected Errors

Future

Centralized monitoring.

---

# DEPENDENCY SECURITY

Run

npm audit

before every release.

Update vulnerable packages.

Avoid abandoned libraries.

Pin important dependency versions.

---

# BACKUP POLICY

Regular MongoDB backups.

Verify restore process.

Store backups securely.

---

# INCIDENT RESPONSE

If suspicious activity is detected

Identify

Contain

Investigate

Recover

Document

---

# SECURITY TEST CHECKLIST

NoSQL Injection

XSS

Broken Access Control

Rate Limiting

File Upload Validation

JWT Validation

OTP Abuse

CORS

Headers

Input Validation

Error Handling

---

# SECURITY REVIEW

Every milestone must include

Security Review

Dependency Review

Architecture Review

before approval.

---

# FUTURE ENHANCEMENTS

Email Verification

2FA for Owner

WebAuthn / Passkeys

Audit Dashboard

WAF

CDN

Image Malware Scanning

Real-time Threat Detection

---

# GOLDEN RULE

If a feature improves usability but weakens security,

security wins.

Build customer trust before adding convenience.
