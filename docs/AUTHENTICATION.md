# Onebite Bakery - Authentication

## Google Sign-In and Server-Side Sessions

Customer identities are verified with Google OAuth 2.0 / OpenID Connect. The
application does not provide SMS or one-time-code authentication.

```text
Customer browser
  -> Google consent
  -> Bakery OAuth callback (state validation)
  -> verified Google identity
  -> user lookup or creation
  -> HttpOnly session cookies
```

## Session security

Refresh-token sessions are stored server-side in MongoDB. Access tokens are
short-lived; refresh tokens are scoped to the authentication path and rotated
on refresh. Cookies are HttpOnly and use `Secure` in production.

The relevant endpoints are:

* `GET /api/v1/auth/google`
* `GET /api/v1/auth/google/callback`
* `POST /api/v1/auth/google`
* `GET /api/v1/auth/me`
* `POST /api/v1/auth/refresh`
* `POST /api/v1/auth/logout`
* `POST /api/v1/auth/logout-all`

## Google OAuth configuration

Create a Web application OAuth client in Google Cloud Console with the scopes
`openid`, `email`, and `profile`. Configure the callback URL to exactly match
the deployed backend callback route.

```env
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=https://onebitebakery.in/api/v1/auth/google/callback
```

The OAuth state cookie is validated before a callback is accepted. Configure
the exact production frontend and backend origins in the CORS settings.
