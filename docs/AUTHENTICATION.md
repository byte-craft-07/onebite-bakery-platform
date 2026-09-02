# The Online Bakery - Authentication Documentation
## Google Sign-In + Real SMS OTP (MSG91)

This document provides a comprehensive operational and setup guide for the authentication system implemented in the The Online Bakery platform.

---

## 1. Authentication Architecture

The The Online Bakery platform implements two primary customer authentication methods:

1. **Continue with Google**: Google OAuth 2.0 / OpenID Connect identity verification.
2. **Continue with Phone**: Real 6-digit SMS OTP delivery via MSG91.

```
                         AUTHENTICATION
                              |
                 +------------+------------+
                 |                         |
                 ↓                         ↓
       Continue with Google       Continue with Phone
                 |                         |
                 ↓                         ↓
          Google OAuth/OIDC            SMS OTP
                 |                         |
                 ↓                         ↓
       Verify Google Identity       MSG91 Send OTP
                 |                         |
                 ↓                         ↓
                 |                    Verify OTP
                 |                         |
                 +------------+------------+
                              ↓
                       Find/Create Customer
                              ↓
                       Create Session
                              ↓
                       HttpOnly Cookie
                              ↓
                         Authenticated
```

Both methods authenticate the user into the **same** unified `User` model (`backend/src/modules/user/model/user.model.ts`) and create the **same** HttpOnly cookie session (`RefreshTokenModel`).

---

## 2. Session Architecture & Cookie Security

- **Session Store**: Server-side sessions in MongoDB (`RefreshTokenModel`). Sessions record `userId`, `tokenHash`, `deviceId`, `ipAddress`, `userAgent`, and `expiresAt`.
- **Cookies**:
  - `accessToken`: Short-lived JWT (15 minutes).
  - `refreshToken`: Long-lived session token (30 days) scoped to path `/api/v1/auth`.
- **Cookie Security Settings**:
  - `HttpOnly`: `true` (inaccessible to client-side JS).
  - `SameSite`: `Lax` (compatible with OAuth redirects while protecting against CSRF).
  - `Secure`: `true` in production (HTTPS).
- **Session Endpoints**:
  - `GET /api/v1/auth/me`: Validates cookie session and returns authenticated customer profile.
  - `POST /api/v1/auth/refresh`: Performs automatic refresh token rotation.
  - `POST /api/v1/auth/logout`: Revokes current refresh token session and clears cookies.
  - `POST /api/v1/auth/logout-all`: Revokes all active sessions for the customer across devices.

---

## 3. Google OAuth 2.0 & OpenID Connect Setup

### A. Google Cloud Console Setup
1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Create or select your project (e.g. `The Online Bakery`).
3. Navigate to **APIs & Services > OAuth consent screen**:
   - User Type: **External**
   - App Name: `The Online Bakery`
   - User Support Email: `support@theonlinebakery.in`
   - Scopes: `openid`, `email`, `profile` (Minimal identity scopes).
4. Navigate to **APIs & Services > Credentials**:
   - Click **Create Credentials > OAuth client ID**.
   - Application Type: **Web application**.
   - Name: `The Online Bakery Web Client`.

### B. Authorized Origins & Redirect URIs
- **Authorized JavaScript origins**:
  - Development: `http://localhost:5173`, `http://localhost:5000`
  - Production: `https://theonlinebakery.in`
- **Authorized redirect URIs**:
  - Development: `http://localhost:5000/api/v1/auth/google/callback`
  - Production: `https://theonlinebakery.in/api/v1/auth/google/callback`

### C. Backend Google Routes
- `GET /api/v1/auth/google`: Initiates Google OAuth consent flow.
- `GET /api/v1/auth/google/callback`: OAuth callback handler. Verifies authorization code, creates session, sets HttpOnly cookies, and redirects to frontend.
- `POST /api/v1/auth/google`: Credential verification endpoint for Google One Tap / direct ID token POST payloads.

---

## 4. MSG91 SMS OTP Integration & DLT Requirements

### A. MSG91 Account & Credentials
- **Provider**: MSG91 (India SMS Gateway)
- **API Endpoint**: `https://control.msg91.com/api/v5/otp`
- Credentials needed in `.env`:
  - `MSG91_AUTH_KEY`: Authentication Key from MSG91 Dashboard.
  - `MSG91_TEMPLATE_ID`: DLT-Approved SMS OTP Template ID.
  - `MSG91_SENDER_ID`: 6-character DLT Sender ID (e.g. `ONEBTE`).

### B. DLT Registration Guidance (India SMS Regulations)
In India, SMS delivery requires Telecom Commercial Communications Customer Preference Regulations (TCCCPR) compliance:
1. Register Entity on DLT Portal (Jio, Airtel, Vodafone Idea, or BSNL DLT).
2. Register Sender ID / Header (e.g. `ONEBTE`).
3. Register Content Template for OTP:
   - Example DLT Template Text: `Your The Online Bakery verification code is {#var#}. Valid for 5 minutes. Do not share this code with anyone.`
4. Map the Approved DLT Template ID to `MSG91_TEMPLATE_ID` in your production environment variables.

### C. Phone Number Normalization
All phone inputs (`+919876543210`, `919876543210`, `09876543210`, `9876543210`) are normalized to a canonical 10-digit format (`9876543210`) via `normalizeIndianPhone()` before challenge creation and database queries.

---

## 5. Account Linking Rules

| Scenario | Authentication Method | Outcome |
| :--- | :--- | :--- |
| New Customer | Phone OTP | New `User` document created (`phone`, `role: "customer"`). |
| Existing Customer | Phone OTP | Logged into existing account. |
| New Customer | Google | New `User` document created (`googleId`, `email`, `authProviders: ["google"]`). |
| Existing Google Customer | Google | Logged into existing account. |
| Existing Phone Customer + Google (Matching Email) | Google | Accounts safely linked (`googleId` appended, `authProviders` updated with `"google"`). No duplicate account created. |
| Google ID belongs to another account | Google | User logged into target Google account; no account overwrite occurs. |

---

## 6. Rate Limiting & Security Controls

- **Send OTP Rate Limiter**: Maximum 3 OTP requests per 15-minute window (`sendOtpRateLimiter`).
- **Verify OTP Rate Limiter**: Maximum 5 attempts per 15-minute window (`verifyOtpRateLimiter`).
- **Resend Cooldown**: 30-second cooldown enforced between OTP requests (`OTP_CONSTANTS.COOLDOWN_SECONDS`).
- **OTP Expiration**: 5 minutes expiry (`OTP_CONSTANTS.EXPIRY_MINUTES`).
- **OTP Hashing**: Raw OTP values are never stored in the database; HMAC SHA-256 hashes are stored (`createOtpHash`).
- **Attempts Tracking**: Maximum 5 failed verification attempts before invalidating challenge.

---

## 7. Environment Variables Reference

```env
# Google OAuth 2.0
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=https://theonlinebakery.in/api/v1/auth/google/callback

# MSG91 SMS OTP
MSG91_AUTH_KEY=your_msg91_auth_key
MSG91_TEMPLATE_ID=your_dlt_approved_template_id
MSG91_SENDER_ID=ONEBTE
```
