# MSG91 Real SMS OTP Authentication Setup & Reference Guide

This document details the configuration and architecture for real SMS OTP customer authentication using MSG91 in The Online Bakery platform.

---

## 1. Architecture Overview

Authentication follows a secure, server-verified token flow:

```
[Customer Browser] 
  1. Enters 10-digit Indian mobile number (+91)
  2. MSG91 Widget script (otp-provider.js) dispatches SMS OTP
  3. Customer inputs received SMS OTP
  4. MSG91 Widget verifies OTP and issues MSG91 Access Token
  5. Frontend sends Access Token to Bakery Backend (POST /api/v1/auth/phone/verify)

[Bakery Backend]
  6. Backend verifies Access Token against MSG91 API:
     POST https://control.msg91.com/api/v5/widget/verifyAccessToken
     Headers: { "Content-Type": "application/json", "Accept": "application/json" }
     Body: { "authkey": MSG91_AUTH_KEY, "access-token": accessToken }
  7. Backend extracts trusted verified phone identity from MSG91 response
  8. Phone number is canonicalized to 10-digit format
  9. Customer account is resolved (searched or created)
 10. Existing HttpOnly session cookies (access & refresh tokens) are issued
 11. Customer is securely logged in
```

---

## 2. Environment Variables

### Backend Configuration (`.env`)

| Variable | Description | Security / Scope |
| :--- | :--- | :--- |
| `MSG91_AUTH_KEY` | MSG91 Authentication Key from MSG91 Dashboard | **SERVER-SIDE ONLY**. Never expose to frontend or git. |
| `MSG91_TEMPLATE_ID` | Optional SMS template ID | Server-side only |
| `MSG91_SENDER_ID` | Optional sender header ID | Server-side only |

### Frontend Configuration (`.env` or `vite.config.ts`)

| Variable | Description | Security / Scope |
| :--- | :--- | :--- |
| `VITE_MSG91_WIDGET_ID` | MSG91 OTP Widget ID (`366841727443373439393035`) | Public widget identifier |

---

## 3. Security Protections

1. **Zero Client-Trust**: The backend never relies on client-reported phone numbers or client-reported verification statuses. Only the verified phone number extracted directly from MSG91's server response is trusted.
2. **Secret Isolation**: `MSG91_AUTH_KEY` is strictly confined to the backend environment and never bundled in React builds.
3. **Log Sanitization**: No raw OTPs, authorization keys, access tokens, or refresh tokens are ever logged in plaintext. Phone numbers in logs are masked (e.g. `******3210`).
4. **Rate Limiting**: Dedicated rate limiting protects the `/api/v1/auth/phone/verify` endpoint against brute-force and token reuse attempts.
5. **Session Integrity**: Uses the existing HttpOnly cookie-based refresh token session model with SHA-256 token hashing and session rotation.

---

## 4. Troubleshooting

- **"MSG91 sendOtp function is not available"**: Ensure network connectivity allows loading `https://verify.msg91.com/otp-provider.js`.
- **"Invalid or expired phone verification token"**: MSG91 access tokens expire rapidly after verification; the client must forward them immediately to `/auth/phone/verify`.
- **"MSG91_AUTH_KEY is not configured on the server"**: Ensure `MSG91_AUTH_KEY` is present in your backend `.env` file for production / staging environments.
