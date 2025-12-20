# Widget Embedding Tutorial

A comprehensive guide to understanding how embeddable widgets work—from architecture to authentication to communication patterns. By the end of this tutorial, you'll understand this codebase deeply and be able to apply these patterns to your own projects.

## Table of Contents

1. [What Are We Building?](#what-are-we-building)
2. [Architecture Overview](#architecture-overview)
3. [Key Concepts & Terminology](#key-concepts--terminology)
4. [The Three Components](#the-three-components)
5. [Building the Widget (Vite Dual Mode)](#building-the-widget-vite-dual-mode)
6. [Embedding & Initialization](#embedding--initialization)
7. [Authentication Deep Dive](#authentication-deep-dive)
8. [Communication Patterns](#communication-patterns)
9. [Style Isolation with Shadow DOM](#style-isolation-with-shadow-dom)
10. [Design Decision: CSS Loading Strategies](#design-decision-css-loading-strategies)
11. [Extending the Architecture](#extending-the-architecture)
12. [Code Walkthrough](#code-walkthrough)
13. [Comprehension Questions](#comprehension-questions)
14. [Summary](#summary)

---

## What Are We Building?

Imagine you're building a feedback widget that other companies can embed in their applications. Your customers (host applications) should be able to:

1. **Drop in a script tag** and get a working widget
2. **Pass their user's authentication** so the widget knows who's submitting feedback
3. **React to widget events** like "feedback submitted" or "error occurred"
4. **Style it to match their app** (theming)

This is the same pattern used by:
- **Intercom** - Customer chat widgets
- **Stripe** - Payment elements
- **Auth0** - Login widgets
- **Typeform** - Embedded forms

The challenge? Your widget needs to:
- Work in any host environment without breaking their CSS
- Authenticate users without having access to their auth system
- Communicate bidirectionally with the host
- Be independently deployable and versionable

---

## Architecture Overview

### High-Level Design

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              HOST APPLICATION                               │
│                              (Your Customer)                                │
│                                                                             │
│   ┌──────────────┐      ┌──────────────────────────────────────────────┐    │
│   │              │      │              EMBEDDED WIDGET                 │    │
│   │   Host's     │ ───► │   (Your Code Running in Their Page)          │    │
│   │   Auth       │      │                                              │    │
│   │   System     │      │   ┌────────────────────────────────────┐     │    │
│   │              │      │   │         Shadow DOM                 │     │    │
│   │   (Auth0,    │      │   │   • Isolated styles                │     │    │
│   │    Okta,     │      │   │   • React application              │     │    │
│   │    Custom)   │      │   │   • Makes API calls                │     │    │
│   │              │      │   └────────────────────────────────────┘     │    │
│   └──────────────┘      └──────────────────────────────────────────────┘    │
│          │                                    │                             │
│          │ Tokens                             │ API Calls                   │
│          ▼                                    ▼                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                                │
                                                │ HTTPS + JWT
                                                ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                            WIDGET BACKEND                                   │
│                         (Your API Server)                                   │
│                                                                             │
│   1. Receives JWT in Authorization header                                   │
│   2. Fetches public key from JWKS endpoint                                  │
│   3. Verifies signature (RS256)                                             │
│   4. Validates claims (issuer, audience, expiration)                        │
│   5. Trusts user identity from verified token                               │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                                │
                                                │ Fetch public key
                                                ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           JWKS ENDPOINT                                     │
│              (Auth0 or your own for development)                            │
│                                                                             │
│   Returns public keys in standard JWK format for signature verification     │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Data Flow

```
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│             │         │             │         │             │
│  Host App   │────────►│   Widget    │────────►│  Widget     │
│             │         │  Frontend   │         │  Backend    │
│             │◄────────│             │◄────────│             │
│             │         │             │         │             │
└─────────────┘         └─────────────┘         └─────────────┘

     │                       │                       │
     │  1. init({tokens})    │                       │
     │──────────────────────►│                       │
     │                       │                       │
     │                       │  2. API call + JWT    │
     │                       │──────────────────────►│
     │                       │                       │
     │                       │  3. Verified response │
     │                       │◄──────────────────────│
     │                       │                       │
     │  4. onEvent(result)   │                       │
     │◄──────────────────────│                       │
     │                       │                       │
```

### Component Responsibilities

| Component | Location | Responsibility |
|-----------|----------|----------------|
| **Host App** | Customer's domain | Authenticates users, provides tokens, embeds widget |
| **Widget Frontend** | Runs in host's page | UI, user interaction, API calls with tokens |
| **Widget Backend** | Your servers | Verifies tokens, business logic, data storage |
| **JWKS Endpoint** | Auth provider | Distributes public keys for token verification |

---

## Key Concepts & Terminology

### IIFE (Immediately Invoked Function Expression)

**What it is:** A JavaScript pattern where a function is defined and executed immediately.

**Why we use it:** When building a widget, we want to:
1. Bundle all our code (React, dependencies) into one file
2. Expose a single global variable (`window.MyWidget`)
3. Not pollute the global namespace with internal variables

```javascript
// This is what an IIFE looks like
(function() {
  // All widget code is private in here
  const internalState = {};
  
  // Only expose what we want
  window.MyWidget = {
    init: function(config) { /* ... */ },
    destroy: function() { /* ... */ }
  };
})();
```

**In this project:** Vite builds our React app as an IIFE bundle (`widget.iife.js`). Host apps load this script, and `window.MyWidget` becomes available.

**See:** `widget/frontend/vite.config.ts` (production build config)

---

### Shadow DOM

**What it is:** A browser feature that creates an isolated DOM subtree with its own encapsulated styles.

**The Problem:** When you embed a widget in someone else's page, CSS conflicts happen:

```css
/* Host app's CSS (you don't control this) */
button { background: red !important; }
* { box-sizing: content-box; margin: 0; }
.card { display: none; }
```

Your widget uses a class called `.card`? It's now invisible. Your buttons? All red. Your layout? Broken. Every host app has different CSS, so your widget looks different (or broken) everywhere.

**The Solution:** Shadow DOM creates an impenetrable boundary:

```
                    LIGHT DOM (Host Page)
                    ═══════════════════════
                    │
                    │  Host styles apply here
                    │  button { background: red; }
                    │
    ┌───────────────┴───────────────┐
    │         <div id="widget">     │
    │               │               │
    │     ══════════╪═══════════    │ ← Shadow boundary
    │               │               │
    │         SHADOW DOM            │
    │    ┌──────────┴──────────┐    │
    │    │                     │    │
    │    │  Widget styles      │    │
    │    │  button { blue; }   │    │
    │    │                     │    │
    │    │  Host CSS can NOT   │    │
    │    │  reach in here!     │    │
    │    │                     │    │
    │    └─────────────────────┘    │
    └───────────────────────────────┘
```

**Key benefits:**

| Benefit | Without Shadow DOM | With Shadow DOM |
|---------|-------------------|-----------------|
| **Style isolation** | Host CSS breaks widget | Widget looks the same everywhere |
| **Class name conflicts** | Must use unique prefixes | Use any class names you want |
| **CSS resets** | Host's resets affect widget | Widget has its own baseline |
| **Predictability** | Widget looks different per host | Widget looks identical everywhere |

**How we use it:**

```javascript
// Create a shadow root attached to our container
const shadowRoot = container.attachShadow({ mode: 'open' });

// Inject OUR styles into the shadow (host can't see these)
const style = document.createElement('style');
style.textContent = await fetch('widget.css').then(r => r.text());
shadowRoot.appendChild(style);

// Render React INTO the shadow DOM
const reactContainer = document.createElement('div');
shadowRoot.appendChild(reactContainer);
createRoot(reactContainer).render(<Widget />);
```

**The trade-off:** Styles don't cascade IN, but they also don't cascade OUT. Your widget must be completely self-contained with all its own styles.

**See:** `widget/frontend/src/widget-api.tsx` (lines 67-104), `SHADOW-DOM.md`

---

### Dual Tokens (Access Token + ID Token)

**The Problem:** Authentication serves two purposes:
1. **Display user info** in the UI (name, avatar)
2. **Authorize API requests** (prove who's making the request)

**The Solution:** Use two specialized tokens:

| Token | Purpose | Where Used | Contains |
|-------|---------|------------|----------|
| **ID Token** | Display user info | Client-side (widget UI) | `name`, `email`, `picture` |
| **Access Token** | Authorize API calls | Server-side (backend) | `sub`, `scope`, permissions |

```
┌─────────────────────────────────────────────────────────────────────┐
│                        HOST AUTHENTICATES USER                      │
│                                                                     │
│   Auth0/Okta/etc returns:                                           │
│   {                                                                 │
│     access_token: "eyJ...",  // For API authorization               │
│     id_token: "eyJ...",      // For UI display                      │
│     token_type: "Bearer",                                           │
│     expires_in: 3600                                                │
│   }                                                                 │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      WIDGET USES BOTH TOKENS                        │
│                                                                     │
│   ID Token (decoded client-side):         Access Token (sent to API)│
│   ┌─────────────────────────────┐         ┌───────────────────────┐ │
│   │ {                           │         │ Authorization:        │ │
│   │   "name": "Jane Doe",       │         │ Bearer eyJhbGc...     │ │
│   │   "email": "jane@acme.com", │         │                       │ │
│   │   "picture": "https://..."  │         │ (Never decoded        │ │
│   │ }                           │         │  client-side!)        │ │
│   └─────────────────────────────┘         └───────────────────────┘ │
│              │                                      │               │
│              ▼                                      ▼               │
│        Show in UI                           Send to backend         │
│   "Welcome, Jane!"                         for verification         │
└─────────────────────────────────────────────────────────────────────┘
```

**Critical Security Rule:** The ID token is for display only. Never use it for authorization! The backend must independently verify the access token.

**See:** `shared/src/types.ts` (`IDTokenClaims`, `AccessTokenClaims`)

---

### RS256 Asymmetric Signing

**The Problem:** How does your widget backend know a token is legitimate?

**Option 1: Symmetric (HS256)**
- Same secret key signs and verifies
- Everyone who verifies needs the secret
- 🚨 Risk: Widget backend would need the secret, increasing attack surface

**Option 2: Asymmetric (RS256)** [PREFERRED]
- Private key signs (only auth provider has this)
- Public key verifies (anyone can have this)
- Widget backend only needs the public key

```
┌─────────────────────────────────────────────────────────────────────┐
│                      RS256 SIGNING FLOW                             │
│                                                                     │
│   AUTH PROVIDER                           YOUR WIDGET BACKEND       │
│   (Has private key)                       (Has public key only)     │
│                                                                     │
│   ┌─────────────────┐                     ┌─────────────────┐       │
│   │   Private Key   │                     │   Public Key    │       │
│   │   [SECRET]      │                     │   [SHAREABLE]   │       │
│   └────────┬────────┘                     └────────┬────────┘       │
│            │                                       │                │
│            ▼                                       ▼                │
│   ┌─────────────────┐                     ┌─────────────────┐       │
│   │  Sign Token     │ ──── token ────►    │ Verify Signature│       │
│   │  (creates JWT)  │                     │ (checks if real)│       │
│   └─────────────────┘                     └─────────────────┘       │
│                                                                     │
│   Only Auth0/Okta has                     Anyone can verify,        │
│   the ability to sign                     but can't forge tokens    │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

**See:** `widget/backend/src/utils/jwt-verifier.ts`

---

### JWKS (JSON Web Key Set)

**What it is:** A standard format for publishing public keys.

**The Flow:**
1. Auth provider publishes keys at `/.well-known/jwks.json`
2. Your backend fetches keys from this URL
3. Uses the key matching the token's `kid` (Key ID) to verify

```json
// GET https://your-domain.auth0.com/.well-known/jwks.json
{
  "keys": [{
    "kty": "RSA",           // Key type
    "use": "sig",           // Usage: signature verification
    "kid": "abc123",        // Key ID (matches JWT header)
    "alg": "RS256",         // Algorithm
    "n": "0vx7agoebG...",   // RSA modulus (the actual key data)
    "e": "AQAB"             // RSA exponent
  }]
}
```

**Why a set of keys?** Auth providers rotate keys for security. During rotation, they publish both old and new keys so existing tokens still verify.

**See:** `widget/backend/src/routes/jwks.ts`, `shared/src/keys/jwks.ts`

---

### JWT Claims

**What they are:** The payload inside a JWT containing assertions about the user.

**Standard Claims:**

| Claim | Name | Purpose |
|-------|------|---------|
| `iss` | Issuer | Who created this token (e.g., `https://acme.auth0.com/`) |
| `sub` | Subject | User identifier (e.g., `auth0|123456`) |
| `aud` | Audience | Who this token is for (e.g., `https://widget-api.com`) |
| `exp` | Expiration | When this token expires (Unix timestamp) |
| `iat` | Issued At | When this token was created |
| `scope` | Scope | Permissions granted (e.g., `read:feedback write:feedback`) |

**Validation:** Your backend MUST check:
- `iss` matches expected auth provider
- `aud` includes your API identifier  
- `exp` is in the future
- Signature is valid

**See:** `widget/backend/src/utils/jwt-verifier.ts` (`verifyAccessToken` function)

---

### Vite Dual Mode Configuration

**The Challenge:** Our widget needs to run in two completely different ways:

| Mode | Purpose | Entry Point | Output |
|------|---------|-------------|--------|
| **Development** | Standalone testing | `standalone.tsx` | Normal React app on port 3001 |
| **Production** | Embedding | `embed.tsx` | Single IIFE file |

**How Vite handles this:**

```typescript
// vite.config.ts (simplified)
export default defineConfig(({ mode }) => {
  if (mode === 'development') {
    // Normal React SPA for development
    return {
      server: { port: 3001 },
      // Entry: index.html → standalone.tsx
    };
  }
  
  // Production: Build as embeddable library
  return {
    build: {
      lib: {
        entry: 'src/embed.tsx',
        name: 'MyWidget',           // Global variable name
        formats: ['iife'],          // Output format
        fileName: 'widget',         // → widget.iife.js
      },
    },
  };
});
```

**See:** `widget/frontend/vite.config.ts`

---

## The Three Components

### 1. Host Application (`host-app/`)

The host app represents your customer's application. In the real world, this would be someone else's code. Here, we've built a demo host to test our widget.

**Key files:**
- `src/auth/authService.ts` - Mock Auth0 that generates real RS256 tokens
- `src/components/WidgetEmbed.tsx` - Loads and initializes the widget
- `src/App.tsx` - Demo UI with login/logout

**What it does:**
1. Authenticates users (mock Auth0 in demo, real Auth0 in production)
2. Receives access token + ID token
3. Loads widget script from backend
4. Calls `window.MyWidget.init()` with tokens
5. Handles widget events

### 2. Widget Frontend (`widget/frontend/`)

The actual widget code—a React application that gets embedded.

**Key files:**
- `src/embed.tsx` - Production entry, creates `window.MyWidget`
- `src/standalone.tsx` - Development entry, runs as normal app
- `src/widget-api.tsx` - The public API implementation
- `src/context/AuthContext.tsx` - Token state management
- `src/components/FeedbackWidget.tsx` - The actual UI

**Two entry points:**

```
┌─────────────────────────────────────────────────────────────────────┐
│                     WIDGET FRONTEND                                 │
│                                                                     │
│   ┌─────────────────────┐         ┌─────────────────────┐           │
│   │   standalone.tsx    │         │     embed.tsx       │           │
│   │   (Development)     │         │   (Production)      │           │
│   │                     │         │                     │           │
│   │   • Normal React    │         │   • Creates global  │           │
│   │   • Dev toolbar     │         │   • window.MyWidget │           │
│   │   • Mock auth       │         │   • IIFE bundle     │           │
│   │   • Port 3001       │         │   • Shadow DOM      │           │
│   └──────────┬──────────┘         └──────────┬──────────┘           │
│              │                               │                      │
│              └───────────┬───────────────────┘                      │
│                          │                                          │
│                          ▼                                          │
│              ┌─────────────────────┐                                │
│              │  Shared Components  │                                │
│              │  • FeedbackWidget   │                                │
│              │  • AuthContext      │                                │
│              │  • API Client       │                                │
│              └─────────────────────┘                                │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 3. Widget Backend (`widget/backend/`)

Your API server that the widget talks to.

**Key files:**
- `src/index.ts` - Express server setup
- `src/middleware/auth.ts` - JWT verification middleware
- `src/utils/jwt-verifier.ts` - RS256 + JWKS verification logic
- `src/routes/feedback.ts` - Business logic endpoints
- `src/routes/jwks.ts` - JWKS endpoint (demo only)

**What it does:**
1. Serves the widget static files (`widget.iife.js`, `widget.css`)
2. Provides JWKS endpoint (in production, Auth0 does this)
3. Verifies JWTs on protected routes
4. Handles business logic (feedback CRUD)

---

## Building the Widget (Vite Dual Mode)

### Development Mode

```bash
npm run dev:widget-frontend
```

This runs the widget as a normal React SPA:
- Entry: `index.html` → `standalone.tsx`
- Includes dev toolbar for switching mock users
- Hot module reloading
- No host app needed

### Production Mode

```bash
cd widget/frontend && npm run build
```

This creates an embeddable library:
- Entry: `embed.tsx`
- Output: `dist/widget.iife.js` + `dist/widget.css`
- Everything bundled (React, dependencies)
- Exposes `window.MyWidget`

### What Goes in the Bundle

```
┌─────────────────────────────────────────────────────────────────────┐
│                        widget.iife.js                               │
│                                                                     │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │  React + ReactDOM (bundled inline)                          │   │
│   ├─────────────────────────────────────────────────────────────┤   │
│   │  Your components (FeedbackWidget, UserBadge, etc.)          │   │
│   ├─────────────────────────────────────────────────────────────┤   │
│   │  Auth context, API client, utilities                        │   │
│   ├─────────────────────────────────────────────────────────────┤   │
│   │  Widget API (init, setTokens, clearTokens, destroy)         │   │
│   └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│   Final line: window.MyWidget = createWidget();                     │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Embedding & Initialization

### Step 1: Load the Script

```html
<div id="widget-container"></div>
<script src="https://your-widget.com/widget/widget.iife.js"></script>
```

When the script loads:
1. IIFE executes immediately
2. `createWidget()` runs
3. `window.MyWidget` becomes available

### Step 2: Initialize

```javascript
window.MyWidget.init({
  targetId: 'widget-container',    // Where to render
  accessToken: userAccessToken,     // For API calls
  idToken: userIdToken,             // For display
  theme: 'light',
  onEvent: (event) => {
    console.log('Widget event:', event);
  }
});
```

### What Happens During init()

```
┌─────────────────────────────────────────────────────────────────────┐
│                        init() Flow                                  │
│                                                                     │
│   1. Find container element                                         │
│      └── document.getElementById('widget-container')                │
│                                                                     │
│   2. Create Shadow DOM                                              │
│      └── container.attachShadow({ mode: 'open' })                   │
│                                                                     │
│   3. Inject styles into Shadow DOM                                  │
│      └── Fetch widget.css, create <style> element                   │
│                                                                     │
│   4. Initialize token store                                         │
│      └── Store access + ID tokens in reactive state                 │
│                                                                     │
│   5. Create React root in Shadow DOM                                │
│      └── createRoot(shadowContainer)                                │
│                                                                     │
│   6. Render widget                                                  │
│      └── <AuthProvider><FeedbackWidget /></AuthProvider>            │
│                                                                     │
│   7. Emit INITIALIZED event                                         │
│      └── config.onEvent({ type: 'INITIALIZED' })                    │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

**See:** `widget/frontend/src/widget-api.tsx`

---

## Authentication Deep Dive

### The Full Auth Flow

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                              AUTHENTICATION FLOW                              │
└──────────────────────────────────────────────────────────────────────────────┘

  HOST APP                      WIDGET                      WIDGET BACKEND
     │                            │                              │
     │  1. User logs in           │                              │
     │  (Auth0/Okta/custom)       │                              │
     │                            │                              │
     │  2. Receive tokens         │                              │
     │  {access_token, id_token}  │                              │
     │                            │                              │
     │  3. MyWidget.init(tokens)  │                              │
     │───────────────────────────►│                              │
     │                            │                              │
     │                            │  4. Store tokens             │
     │                            │  • accessToken → API client  │
     │                            │  • idToken → decode for UI   │
     │                            │                              │
     │                            │  5. Show user info           │
     │                            │  (from decoded idToken)      │
     │                            │                              │
     │                            │  6. User submits feedback    │
     │                            │                              │
     │                            │  7. POST /api/feedback       │
     │                            │  Authorization: Bearer xxx   │
     │                            │─────────────────────────────►│
     │                            │                              │
     │                            │              8. Verify token │
     │                            │              • Fetch JWKS    │
     │                            │              • Check sig     │
     │                            │              • Validate iss  │
     │                            │              • Validate aud  │
     │                            │              • Check exp     │
     │                            │                              │
     │                            │              9. Extract user │
     │                            │              from claims.sub │
     │                            │                              │
     │                            │  10. Response (success)      │
     │                            │◄─────────────────────────────│
     │                            │                              │
     │  11. onEvent(FEEDBACK_     │                              │
     │      SUBMITTED)            │                              │
     │◄───────────────────────────│                              │
     │                            │                              │
```

### Why We Verify on the Backend

**Wrong approach:** Trust what the client sends

```javascript
// NEVER DO THIS!
app.post('/feedback', (req, res) => {
  const { userId, feedback } = req.body;  // ← Client could lie!
  saveFeedback(userId, feedback);
});
```

**Right approach:** Verify token, extract user from claims

```javascript
// auth.ts middleware verifies token first
app.post('/feedback', authenticateToken, (req, res) => {
  const userId = req.user.sub;  // ← From VERIFIED token
  saveFeedback(userId, req.body.feedback);
});
```

**See:** `widget/backend/src/routes/feedback.ts` (lines 68-80)

---

## Communication Patterns

### Host → Widget Communication

The host controls the widget through the public API:

```javascript
// Initialize with config
window.MyWidget.init({
  targetId: 'container',
  accessToken: token,
  idToken: idToken,
  theme: 'dark',
  onEvent: handleEvent
});

// Update tokens (after refresh or re-login)
window.MyWidget.setTokens(newAccessToken, newIdToken);

// Clear tokens (logout)
window.MyWidget.clearTokens();

// Clean up
window.MyWidget.destroy();
```

### Widget → Host Communication

The widget communicates back through the `onEvent` callback:

```javascript
window.MyWidget.init({
  // ...
  onEvent: (event) => {
    switch (event.type) {
      case 'INITIALIZED':
        console.log('Widget is ready');
        break;
        
      case 'FEEDBACK_SUBMITTED':
        console.log('Rating:', event.payload.rating);
        // Maybe show a toast, track analytics, etc.
        break;
        
      case 'ERROR':
        console.error('Widget error:', event.payload.message);
        // Maybe show error UI, report to error tracking
        break;
        
      case 'DESTROYED':
        console.log('Widget cleaned up');
        break;
    }
  }
});
```

### Event Types

```typescript
type WidgetEvent =
  | { type: 'INITIALIZED' }
  | { type: 'DESTROYED' }
  | { type: 'FEEDBACK_SUBMITTED'; payload: { rating: number; comment: string } }
  | { type: 'ERROR'; payload: { message: string; code?: string } };
```

**See:** `shared/src/types.ts` (`WidgetEvent` type)

---

## Style Isolation with Shadow DOM

### The Problem

When you embed a widget in someone else's page, CSS conflicts:

```css
/* Host app's CSS */
button { background: red; }
* { box-sizing: content-box; }
h1 { font-size: 100px; }

/* Your widget expects default styles, gets chaos instead */
```

### The Solution: Shadow DOM

Shadow DOM creates a boundary that CSS cannot cross:

```
┌─────────────────────────────────────────────────────────────────────┐
│                         HOST PAGE                                   │
│                                                                     │
│   <html>                                                            │
│     <head>                                                          │
│       <style>                                                       │
│         button { background: red; }  ← Affects host only            │
│       </style>                                                      │
│     </head>                                                         │
│     <body>                                                          │
│       <button>Host Button</button>  ← Red background                │
│                                                                     │
│       <div id="widget-container">                                   │
│         ┌─────────────────────────────────────────────────────┐     │
│         │ #shadow-root                                        │     │
│         │                                                     │     │
│         │   <style>                                           │     │
│         │     button { background: blue; }  ← Only in shadow  │     │
│         │   </style>                                          │     │
│         │                                                     │     │
│         │   <button>Widget Button</button>  ← Blue background │     │
│         │                                                     │     │
│         └─────────────────────────────────────────────────────┘     │
│       </div>                                                        │
│                                                                     │
│     </body>                                                         │
│   </html>                                                           │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Implementation

```javascript
// Create shadow root
const shadowRoot = container.attachShadow({ mode: 'open' });

// Inject styles INTO the shadow
const response = await fetch('widget.css');
const css = await response.text();
const style = document.createElement('style');
style.textContent = css;
shadowRoot.appendChild(style);

// Render React INTO the shadow
const reactContainer = document.createElement('div');
shadowRoot.appendChild(reactContainer);
createRoot(reactContainer).render(<Widget />);
```

**See:** `widget/frontend/src/widget-api.tsx` (lines 67-104), `SHADOW-DOM.md`

---

## Design Decision: CSS Loading Strategies

You might wonder: why do we *fetch* the CSS at runtime instead of bundling it directly into the JavaScript? This is an architectural choice with trade-offs worth understanding.

### Current Approach: Fetch at Runtime

In `widget-api.tsx`, we fetch the CSS as a separate file:

```javascript
async function injectStyles(shadow: ShadowRoot): Promise<void> {
  // Derive CSS URL from the script URL
  const cssUrl = WIDGET_SCRIPT_URL.replace('widget.iife.js', 'widget.css');
  
  // Fetch and inject
  const response = await fetch(cssUrl);
  const cssText = await response.text();
  
  const styleElement = document.createElement('style');
  styleElement.textContent = cssText;
  shadow.appendChild(styleElement);
}
```

**Why this works for Shadow DOM:**
- Shadow DOM has its own isolated style scope
- Styles in the main document (`<link>` or `<style>`) don't apply inside the shadow
- We must explicitly inject styles *into* the shadow root
- Fetching lets us get the CSS content as a string to inject

### Alternative: Inline CSS in the JS Bundle

We **could** bundle the CSS directly into `widget.iife.js`:

```javascript
// Vite supports importing CSS as a string
import styles from './index.css?inline';

// No fetch needed - CSS is already embedded in the JS
function injectStyles(shadow: ShadowRoot): void {
  const styleElement = document.createElement('style');
  styleElement.textContent = styles;  // Already a string!
  shadow.appendChild(styleElement);
}
```

### Trade-offs Comparison

| Approach | Pros | Cons |
|----------|------|------|
| **Fetch at runtime** (our approach) | Separate caching for CSS vs JS; Smaller JS bundle; Easy to inspect CSS in DevTools; Can update CSS independently | Extra HTTP request; Async complexity; Can fail if network issues |
| **Inline in JS bundle** | Single file to deploy; No extra network request; Works offline after load; Simpler initialization; No race conditions | Larger JS file; Can't cache CSS separately; Any CSS change requires full rebuild |

### Why We Chose Fetching (For This Demo)

For this **educational project**, fetching has benefits:

1. **Debuggability** - You can open `widget.css` directly in browser DevTools
2. **Separation of concerns** - Clear distinction between code and styles
3. **Demonstrates the pattern** - Shows how styles get into Shadow DOM

### For Production: Consider Inlining

For a real-world widget, inlining is often the better choice:

```typescript
// vite.config.ts modification
export default defineConfig({
  build: {
    lib: {
      entry: 'src/embed.tsx',
      name: 'MyWidget',
      formats: ['iife'],
    },
    // Inline CSS into JS bundle
    cssCodeSplit: false,
  },
});
```

Or use the `?inline` import suffix:

```typescript
// In embed.tsx or widget-api.tsx
import widgetStyles from './index.css?inline';

// Synchronous injection - no async/await needed
function injectStyles(shadow: ShadowRoot): void {
  const style = document.createElement('style');
  style.textContent = widgetStyles;
  shadow.appendChild(style);
}
```

**Production benefits:**
- Single file to host, cache, and version
- No race conditions between JS and CSS loading
- Works offline immediately after first load
- Simpler error handling (no fetch failures)
- Faster initialization (no extra HTTP round-trip)

### Bottom Line

Both approaches work. The key insight is that **styles must be injected into the Shadow DOM**—a regular `<link>` tag in the host page won't reach inside. How you get the CSS content (fetch vs inline) is a deployment trade-off.

---

## Extending the Architecture

The patterns we've established make extensions straightforward:

### Token Refresh

The architecture already handles this:

```javascript
// Host app's token refresh logic
async function refreshTokens() {
  const newTokens = await auth0.getTokensSilently();
  
  // Just call setTokens - widget handles the rest
  window.MyWidget.setTokens(
    newTokens.access_token,
    newTokens.id_token
  );
}

// Set up automatic refresh
setInterval(refreshTokens, 50 * 60 * 1000); // 50 minutes
```

**What already exists:**
- `setTokens()` method on widget API
- Reactive token store that propagates changes
- API client that uses current token

### Multi-Tenancy

Add to the config, thread through context:

```javascript
// Host A
window.MyWidget.init({
  token,
  tenantId: 'acme-corp',
  apiBaseUrl: 'https://acme.widget-api.com'
});

// Host B
window.MyWidget.init({
  token,
  tenantId: 'globex',
  apiBaseUrl: 'https://globex.widget-api.com'
});
```

**What to add:**
1. `tenantId` and `apiBaseUrl` to `WidgetConfig` type
2. Pass through to API client
3. Backend uses tenant for data isolation

### More Event Types

```typescript
// Extend the WidgetEvent union type
type WidgetEvent =
  | { type: 'INITIALIZED' }
  | { type: 'DESTROYED' }
  | { type: 'FEEDBACK_SUBMITTED'; payload: { rating: number; comment: string } }
  | { type: 'ERROR'; payload: { message: string; code?: string } }
  // New events
  | { type: 'WIDGET_OPENED' }
  | { type: 'WIDGET_CLOSED' }
  | { type: 'FORM_STARTED' }
  | { type: 'RATING_SELECTED'; payload: { rating: number } };
```

### Theming

Already supported via config:

```javascript
window.MyWidget.init({
  theme: 'dark',  // Already works!
  // Extend to:
  accentColor: '#FF5500',
  fontFamily: 'Inter, sans-serif',
  borderRadius: 'lg',
});
```

### The Pattern

For almost any extension:
1. Add fields to `WidgetConfig`
2. Thread through context or props
3. Use in components

The hard work—entry points, initialization, auth flow, dev mode—is already done.

---

## Code Walkthrough

### Following a Feedback Submission

Let's trace what happens when a user submits feedback, following the request across all three components:

```
┌──────────────────┐      ┌──────────────────┐      ┌──────────────────┐
│    HOST APP      │      │     WIDGET       │      │     WIDGET       │
│                  │      │    FRONTEND      │      │    BACKEND       │
│   localhost:3000 │      │   (embedded)     │      │   localhost:3002 │
└──────────────────┘      └──────────────────┘      └──────────────────┘
        │                         │                         │
        │    init(tokens)         │                         │
        │────────────────────────►│                         │
        │                         │                         │
        │                         │   POST /api/feedback    │
        │                         │   + JWT in header       │
        │                         │────────────────────────►│
        │                         │                         │
        │                         │        response         │
        │                         │◄────────────────────────│
        │                         │                         │
        │   onEvent(SUBMITTED)    │                         │
        │◄────────────────────────│                         │
        │                         │                         │
```

---

**1. User clicks submit** — WIDGET FRONTEND

File: `widget/frontend/src/components/FeedbackWidget.tsx`

```typescript
const handleSubmit = async () => {
  const response = await submitFeedback({ rating, comment });
};
```

---

**2. API client adds auth header** — WIDGET FRONTEND

File: `widget/frontend/src/api/client.ts`

```typescript
export async function submitFeedback(data: FeedbackSubmission) {
  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  
  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }
  
  return fetch(`${API_BASE}/api/feedback`, {
    method: 'POST',
    headers,
    body: JSON.stringify(data),
  });
}
```

---

**3. Backend middleware verifies token** — WIDGET BACKEND

File: `widget/backend/src/middleware/auth.ts`

```typescript
export async function authenticateToken(req, res, next) {
  const token = req.headers['authorization']?.split(' ')[1];
  
  if (!token) {
    req.user = null;
    req.isAuthenticated = false;
    return next();  // Allow anonymous
  }
  
  const claims = await verifyAccessToken(token);
  req.user = claims;
  req.isAuthenticated = true;
  next();
}
```

---

**4. JWT verifier checks signature** — WIDGET BACKEND

File: `widget/backend/src/utils/jwt-verifier.ts`

```typescript
export async function verifyAccessToken(token: string) {
  // Decode header to get key ID
  const { kid } = decodeHeader(token);
  
  // Fetch public key from JWKS
  const publicKey = await getPublicKey(kid);
  
  // Verify signature with RS256
  const claims = jwt.verify(token, publicKey, {
    algorithms: ['RS256'],
    issuer: AUTH_CONFIG.ISSUER,
    audience: AUTH_CONFIG.AUDIENCE,
  });
  
  return claims;
}
```

> **Understanding `jwt.verify()`:**
> 
> This single line does a LOT of security-critical work:
> 
> | Option | What it checks | Why it matters |
> |--------|----------------|----------------|
> | `token` | The JWT string from the Authorization header | The thing we're validating |
> | `publicKey` | RSA public key fetched from JWKS | Used to verify the signature—proves the token was signed by the trusted auth provider |
> | `algorithms: ['RS256']` | Only accept RS256-signed tokens | Prevents algorithm confusion attacks (e.g., attacker switching to `none` or `HS256`) |
> | `issuer` | Token's `iss` claim must match | Ensures token came from YOUR auth provider, not some random issuer |
> | `audience` | Token's `aud` claim must match | Ensures token was intended for YOUR API, not a token meant for a different service |
> 
> The library also automatically checks:
> - `exp` (expiration) - Rejects expired tokens
> - `iat` (issued at) - Token was issued in the past
> - `nbf` (not before) - Token is already valid
> 
> **If ANY check fails, `jwt.verify()` throws an error** and the request is rejected with 401 Unauthorized.

---

**5. Route handler uses verified user** — WIDGET BACKEND

File: `widget/backend/src/routes/feedback.ts`

```typescript
feedbackRouter.post('/feedback', async (req, res) => {
  // User identity from VERIFIED token, not request body!
  const userId = req.user?.sub || 'anonymous';
  
  const feedback = {
    id: generateId(),
    rating: req.body.rating,
    userId,  // Trustworthy!
    createdAt: new Date().toISOString(),
  };
  
  feedbackStore.push(feedback);
  res.status(201).json({ success: true, feedback });
});
```

---

**6. Widget emits event to host** — WIDGET FRONTEND

File: `widget/frontend/src/components/FeedbackWidget.tsx`

```typescript
onEvent?.({ 
  type: 'FEEDBACK_SUBMITTED', 
  payload: { rating, comment } 
});
```

---

**7. Host app receives event** — HOST APP

File: `host-app/src/components/WidgetEmbed.tsx` (or wherever host handles events)

```javascript
window.MyWidget.init({
  onEvent: (event) => {
    if (event.type === 'FEEDBACK_SUBMITTED') {
      showToast('Thanks for your feedback!');
      analytics.track('feedback_submitted', event.payload);
    }
  }
});
```

---

## Comprehension Questions

Test your understanding by answering these questions:

### Architecture

1. **Why do we build the widget as an IIFE instead of a regular bundle?**
   
2. **What are the three main components in this architecture, and what is each responsible for?**

3. **Why do we use Shadow DOM? What problem does it solve?**

### Authentication

4. **What's the difference between an access token and an ID token? Where is each used?**

5. **Why do we use RS256 (asymmetric) instead of HS256 (symmetric) for signing tokens?**

6. **What is a JWKS endpoint and why is it needed?**

7. **What claims should the backend validate when verifying a JWT?**

8. **Why must user identity come from the verified token, not from the request body?**

### Communication

9. **How does the host app pass authentication to the widget?**

10. **How does the widget communicate events back to the host app?**

11. **What happens when the host calls `setTokens()`? How do components react?**

### Development

12. **Why does the widget have two entry points (`standalone.tsx` and `embed.tsx`)?**

13. **How does Vite's config handle the dual development/production modes?**

### Extension

14. **If you needed to add multi-tenancy support, what would you change?**

15. **How would token refresh work with this architecture?**

---

## Summary

You've learned how to build an embeddable widget with:

- **Clean architecture** - Separation of host, widget frontend, and widget backend  
- **Secure authentication** - Dual tokens, RS256 signing, JWKS verification  
- **Bidirectional communication** - Host to Widget via API, Widget to Host via events  
- **Style isolation** - Shadow DOM prevents CSS conflicts  
- **Developer experience** - Standalone mode for testing without host  
- **Extensibility** - Patterns that support refresh tokens, multi-tenancy, theming  

The foundational patterns—entry points, initialization API, auth flow, dev mode—are the hard part. Once those are solid, extending the widget is just adding fields and logic within that structure.

**Now go build something!**
