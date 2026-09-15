# The Online Bakery — Progressive Web App (PWA) Documentation

## 1. Overview & Vision
The Online Bakery Progressive Web App (PWA) converts the existing customer-facing e-commerce storefront, admin dashboard, and delivery agent portal into an installable, mobile-first, and network-resilient application.

The PWA functions as both:
1. **Standard Website**: Accessible through any modern desktop and mobile browser at `https://your-domain.com`.
2. **Installable Application**: Installable to Android, iOS, Windows, and macOS home screens and docks as a standalone app with customized brand icons, launch screen, offline fallback, and web push notifications.

---

## 2. Architecture & Design Principles

```text
┌────────────────────────────────────────────────────────┐
│                   The Online Bakery                    │
│                 Progressive Web App                    │
└────────────────────────────────────────────────────────┘
          │                                 │
          ▼                                 ▼
┌──────────────────────┐         ┌──────────────────────┐
│  PWA Manifest Layer  │         │ Service Worker Layer │
│  - App Identity      │         │ - Precache Shell     │
│  - Standalone Mode   │         │ - SWR Static Assets  │
│  - High-res Icons    │         │ - Network-First Nav  │
│  - Quick Shortcuts   │         │ - Exclude API Caches │
└──────────────────────┘         └──────────────────────┘
          │                                 │
          ▼                                 ▼
┌────────────────────────────────────────────────────────┐
│               Frontend Enhancement Layer               │
│  - usePWA Hook & PWAProvider Context                   │
│  - Network State Detection (Online/Offline)            │
│  - Non-Intrusive Install Banners (Android/Desktop)     │
│  - iOS Safari "Add to Home Screen" Guidance Modal      │
│  - Zero-Disruption Service Worker Update Toast         │
│  - Permission-First Web Push Notification Modal        │
└────────────────────────────────────────────────────────┘
```

### Key Principles
- **Enhancement Layer Only**: No rebuilds, no framework migrations, no API breakages.
- **Zero Sensitive Caching**: Authentication tokens, OTPs, customer profiles, payments, checkouts, and admin actions are **strictly network-only** and never stored in service worker caches.
- **Offline Transparency**: Offline users can browse previously cached pages and view clear offline banners; checkout/payment submissions are explicitly guarded and require network connectivity.

---

## 3. Web App Manifest Configuration

The manifest is located at `/manifest.webmanifest` (with a `/manifest.json` compatibility alias):

```json
{
  "name": "The Online Bakery",
  "short_name": "Online Bakery",
  "description": "Order handcrafted cakes, fresh pastries, custom celebratory cakes and party supplies online.",
  "start_url": "/",
  "scope": "/",
  "id": "/",
  "display": "standalone",
  "display_override": ["standalone", "minimal-ui", "browser"],
  "orientation": "portrait-primary",
  "theme_color": "#596B58",
  "background_color": "#FFF8EC",
  "lang": "en",
  "dir": "ltr",
  "categories": ["shopping", "food", "lifestyle"],
  "icons": [
    {
      "src": "/icons/pwa-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/pwa-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/pwa-maskable-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "maskable"
    },
    {
      "src": "/icons/pwa-maskable-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable"
    },
    {
      "src": "/favicon.svg",
      "sizes": "any",
      "type": "image/svg+xml"
    }
  ],
  "shortcuts": [
    {
      "name": "Browse Cakes",
      "short_name": "Cakes",
      "description": "Explore artisan cakes and confectionery",
      "url": "/products?category=cakes",
      "icons": [{ "src": "/icons/pwa-192x192.png", "sizes": "192x192" }]
    },
    {
      "name": "Custom Cake Design",
      "short_name": "Custom Cake",
      "description": "Build and customize your celebration cake",
      "url": "/custom-cake",
      "icons": [{ "src": "/icons/pwa-192x192.png", "sizes": "192x192" }]
    },
    {
      "name": "My Orders",
      "short_name": "Orders",
      "description": "Check order status and tracking",
      "url": "/customer/orders",
      "icons": [{ "src": "/icons/pwa-192x192.png", "sizes": "192x192" }]
    },
    {
      "name": "View Shopping Cart",
      "short_name": "Cart",
      "description": "View items in your cart",
      "url": "/cart",
      "icons": [{ "src": "/icons/pwa-192x192.png", "sizes": "192x192" }]
    }
  ]
}
```

---

## 4. Application Icons

Official brand assets located in `/icons/`:
- `pwa-192x192.png` — 192×192 standard icon (Android home screen / task switcher)
- `pwa-512x512.png` — 512×512 high-resolution icon (Splash screen & install banner)
- `pwa-maskable-192x192.png` — 192×192 adaptive icon with 20% safe-zone margin
- `pwa-maskable-512x512.png` — 512×512 adaptive icon with 20% safe-zone margin
- `apple-touch-icon.png` — 180×180 Apple Touch Icon (iOS home screen)
- `favicon-32x32.png` / `favicon-16x16.png` — Browser tab favicons

---

## 5. Service Worker & Caching Strategy (`public/sw.js`)

| Resource Type | Pattern | Strategy | Description |
|---|---|---|---|
| **App Shell** | `/`, `/index.html`, `/manifest.webmanifest` | Precache + Stale-While-Revalidate | Instant startup without waiting for network |
| **Static Assets** | `/assets/*`, `.js`, `.css`, fonts, images | Stale-While-Revalidate | Serves cached asset immediately, updates cache in background |
| **HTML Navigations** | `request.mode === 'navigate'` | Network-First + Cache Fallback + `/offline.html` | Live content when online, cached routes or styled offline page when disconnected |
| **Sensitive APIs** | `/api/auth/*`, `/api/admin/*`, `/api/payment/*`, `/api/checkout/*`, `/api/orders/*`, `/api/customer/*`, `/socket.io/*` | **Network-Only (Strict)** | **Never cached** in Service Worker. Returns 503 offline JSON when network is unavailable |

### Cache Versioning
- Cache prefix: `theonlinebakery-pwa-v1`
- Old caches are automatically purged during the `activate` event.
- When an update is deployed, the client receives an `updatefound` event and displays a clean "New version available! [Refresh]" toast.
- Clicking refresh sends `{ type: 'SKIP_WAITING' }` to activate immediately.

---

## 6. Installation Flows

### 1. Android & Chromium Desktop
1. App intercepts `beforeinstallprompt` event and defers browser banner.
2. A non-intrusive floating card appears after 3.5s on the page.
3. User can tap **Install App** to trigger native installation or **Maybe Later** to dismiss (persisted in localStorage).
4. Menu buttons in the mobile navigation drawer and Customer Settings trigger installation on demand.

### 2. iOS (iPhone / iPad)
1. Detects iOS Safari / iPadOS environment.
2. When the user taps "Install App", an iOS-specific modal opens:
   - Step 1: Tap **Share** in Safari toolbar
   - Step 2: Scroll down and select **Add to Home Screen**
   - Step 3: Tap **Add** in the top right corner.

### 3. Standalone Mode Detection
When launched from the home screen:
- `isStandalone` is set to `true`.
- Install banners and buttons are automatically hidden.
- Status bar color matches brand `#596B58`.
- Safe area insets (`env(safe-area-inset-bottom)`) ensure edge-to-edge rendering without obstruction.

---

## 7. Web Push Notification Architecture

### Foundation Workflow
1. **Explain First**: The `PushNotificationModal` explains the benefit (order status, baking, rider dispatch alerts) before requesting browser permission.
2. **Permission & Key Exchange**: Fetches VAPID public key from `/api/notifications/vapid-public-key`.
3. **Registration**: Creates push subscription via Service Worker and registers endpoint with `/api/notifications/push-subscriptions`.
4. **Push Events**: The service worker receives push events, displays notifications with brand icons, and handles clicks by opening/focusing the app at `/customer/orders/:id`.

---

## 8. Security Considerations
- **No Token Exposure**: JWT tokens and cookies are never stored in cache storage.
- **Role Separation**: Admin routes (`/admin/*`) require server authorization and are not pre-cached for offline access.
- **Guarded Checkout**: Offline order placement and payment execution are guarded on the client and server.

---

## 9. Verification & Build Commands

```powershell
# Typecheck
npm run typecheck

# Lint check
npm run lint

# Production build
npm run build
```
