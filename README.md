# Widget Embedding Demo with Auth0-Style Authentication

A comprehensive demo project that teaches how to build an embeddable HTML widget (a full React SPA with its own Express backend) and integrate it into a host application. Demonstrates **JWT-based authentication** with Auth0-style patterns: dual tokens (access + ID), RS256 asymmetric signing, JWKS public key distribution, and proper claims validation.

## Key Features

✅ **Shadow DOM Style Isolation** - Widget styles are completely isolated from host app CSS  
✅ **JWT Authentication** - Auth0-style access and ID tokens with RS256 signing  
✅ **Dual Mode Development** - Standalone dev mode with mock auth + production embed mode  
✅ **JWKS Endpoint** - Public key distribution for JWT verification  
✅ **TypeScript Monorepo** - Shared types and constants across all packages  
✅ **Production-Ready Patterns** - CORS, error handling, token refresh flows

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              HOST APPLICATION                                │
│                              (localhost:3000)                                │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │  1. User logs in → Mock Auth0 generates tokens (RS256)                 │ │
│  │  2. Host passes tokens to widget: MyWidget.init({accessToken, idToken})│ │
│  └────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           EMBEDDED WIDGET (SPA)                              │
│                     (Loaded via <script> from backend)                       │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │  • Decodes ID token client-side → Displays user info                   │ │
│  │  • Sends Access token in API calls → Authorization header              │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           WIDGET BACKEND API                                 │
│                           (localhost:3002)                                   │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │  1. Receives request with Authorization: Bearer <access_token>         │ │
│  │  2. Fetches public key from JWKS endpoint                              │ │
│  │  3. Verifies RS256 signature                                           │ │
│  │  4. Validates claims (iss, aud, exp)                                   │ │
│  │  5. Extracts user identity from verified token                         │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                      JWKS ENDPOINT (Mock Auth0)                              │
│                  localhost:3002/.well-known/jwks.json                        │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │  ⚠️ In production, this would be Auth0's endpoint:                     │ │
│  │     https://YOUR_DOMAIN.auth0.com/.well-known/jwks.json                │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Quick Start

### Prerequisites
- Node.js 18+ 
- npm 9+

### Installation

```bash
# Clone and install dependencies
cd widget-embedding-demo
npm install

# Generate RSA key pair (one-time setup)
npm run generate-keys
```

### Running the Demo

For the full embedded integration demo, you need to build the widget first (so the host can load `widget.iife.js`), then run the backend and host:

```bash
# 1. Build the widget (creates widget.iife.js)
cd widget/frontend && npm run build && cd ../..

# 2. Run backend + host (two terminals, or use concurrently)
npm run dev:widget-backend  # Terminal 1
npm run dev:host            # Terminal 2
```

Then open http://localhost:3000 in your browser.

> **Note:** `npm run dev` runs all three services in dev mode, which is useful for development but the widget frontend dev server (port 3001) is separate from the embedded widget. For the embedded demo, ensure the widget is built first.

### Standalone Widget Development

Develop the widget in isolation without the host app:

```bash
# Terminal 1: Widget Backend
npm run dev:widget-backend

# Terminal 2: Widget Frontend (standalone mode)
npm run dev:widget-frontend
```

Open http://localhost:3001 to see the widget with a dev toolbar for switching mock users.

## Project Structure

```
widget-embedding-demo/
├── widget/
│   ├── frontend/              # React + Vite SPA
│   │   ├── src/
│   │   │   ├── components/    # FeedbackWidget, UserBadge
│   │   │   ├── context/       # AuthContext (dual token management)
│   │   │   ├── api/           # API client with Bearer token
│   │   │   ├── utils/         # JWT decoder (client-side)
│   │   │   ├── dev/           # MockAuthProvider (includes DevToolbar)
│   │   │   ├── embed.tsx      # Production entry (window.MyWidget)
│   │   │   ├── standalone.tsx # Development entry
│   │   │   └── widget-api.tsx # Global API implementation
│   │   └── vite.config.ts     # Dual mode: dev SPA vs. IIFE library
│   └── backend/
│       ├── src/
│       │   ├── middleware/    # JWT verification (RS256 + JWKS)
│       │   ├── routes/        # feedback.ts, jwks.ts
│       │   ├── utils/         # jwt-verifier.ts
│       │   └── index.ts       # Express server
│       └── package.json
├── host-app/                  # Demo host application
│   ├── src/
│   │   ├── auth/              # Mock Auth0 service (RS256 signing)
│   │   ├── components/        # WidgetEmbed, LoginForm
│   │   └── App.tsx
│   └── package.json
├── shared/                    # Shared types and config
│   └── src/
│       ├── types.ts           # TokenPair, JWTClaims, WidgetAPI, etc.
│       ├── auth-constants.ts  # Auth0-style configuration
│       └── keys/              # RSA key pair (demo only!)
├── scripts/
│   └── generate-keys.ts       # RSA key pair generator
└── package.json               # Workspace root
```

## Auth0 Concepts Demonstrated

### 1. Dual Tokens (Access + ID)

| Token Type | Purpose | Where Used | Claims |
|------------|---------|------------|--------|
| **Access Token** | API authorization | Widget backend | `sub`, `iss`, `aud`, `exp`, `scope` |
| **ID Token** | User display | Widget frontend | `sub`, `name`, `email`, `picture` |

**Key principle:** ID token is decoded client-side for UI, but NEVER trusted for authorization. The backend independently verifies the access token.

### 2. RS256 Asymmetric Signing

```
Private Key (Auth0 only)     Public Key (JWKS endpoint)
        │                              │
        ▼                              ▼
   Signs tokens              Verifies signatures
   
In this demo:                In production:
- Private key in shared/     - Only Auth0 has private key
- Host app signs tokens      - Auth0 signs tokens
```

**Why RS256 over HS256?**
- Widget backend only needs the public key
- No shared secret between services
- Standard for distributed systems

### 3. JWKS (JSON Web Key Set)

The standard way to distribute public keys for JWT verification.

```json
// GET /.well-known/jwks.json
{
  "keys": [{
    "kty": "RSA",
    "use": "sig", 
    "kid": "demo-key-1",
    "n": "...",        // RSA modulus
    "e": "AQAB",       // RSA exponent
    "alg": "RS256"
  }]
}
```

**In this demo:** Hosted by widget backend (localhost:3002)  
**In production:** Hosted by Auth0 (https://YOUR_DOMAIN.auth0.com/.well-known/jwks.json)

### 4. JWT Claims Validation

The widget backend validates these claims:

| Claim | Description | Validation |
|-------|-------------|------------|
| `iss` | Issuer | Must match Auth0 domain |
| `aud` | Audience | Must match widget API identifier |
| `exp` | Expiration | Must be in the future |
| `sub` | Subject | User identifier (trusted after verification) |

## Widget Integration Guide

### Embedding the Widget

```html
<!-- 1. Add a container -->
<div id="my-widget"></div>

<!-- 2. Load the widget script -->
<script src="http://localhost:3002/widget/widget.iife.js"></script>

<!-- 3. Initialize with tokens -->
<script>
  window.MyWidget.init({
    targetId: 'my-widget',
    accessToken: userAccessToken,  // From Auth0
    idToken: userIdToken,          // From Auth0
    theme: 'light',
    onEvent: (event) => console.log('Widget event:', event),
  });
</script>
```

### Handling Token Updates

```javascript
// When user logs in or tokens refresh
window.MyWidget.setTokens(newAccessToken, newIdToken);

// When user logs out
window.MyWidget.clearTokens();

// Clean up when unmounting
window.MyWidget.destroy();
```

### Widget Events

```typescript
type WidgetEvent =
  | { type: 'INITIALIZED' }
  | { type: 'DESTROYED' }
  | { type: 'FEEDBACK_SUBMITTED'; payload: { rating: number; comment: string } }
  | { type: 'ERROR'; payload: { message: string; code?: string } };
```

## Migrating to Real Auth0

### What Changes

| Component | This Demo | With Real Auth0 |
|-----------|-----------|-----------------|
| Token generation | Host app (client-side) | Auth0 servers |
| Private key location | `shared/src/keys/` | Auth0 infrastructure |
| JWKS endpoint | `localhost:3002/.well-known/jwks.json` | `YOUR_DOMAIN.auth0.com/.well-known/jwks.json` |
| Login flow | Mock form | Auth0 Universal Login |

### What Stays the Same

- Widget frontend code (token handling, API client)
- Widget backend code (JWT verification, JWKS fetch)
- Widget API (`init`, `setTokens`, `clearTokens`)
- Authentication middleware

### Migration Steps

1. **Set up Auth0 account**
   - Create an Application (SPA)
   - Create an API (widget backend)
   - Configure scopes

2. **Update host app**
   ```typescript
   // Replace mock auth with Auth0 SDK
   import { useAuth0 } from '@auth0/auth0-react';
   
   const { getAccessTokenSilently, getIdTokenClaims, user } = useAuth0();
   ```

3. **Update configuration**
   ```typescript
   // shared/src/auth-constants.ts
   export const AUTH_CONFIG = {
     ISSUER: 'https://YOUR_DOMAIN.auth0.com/',
     JWKS_URI: 'https://YOUR_DOMAIN.auth0.com/.well-known/jwks.json',
     // ...
   };
   ```

4. **Remove demo keys**
   - Delete `shared/src/keys/`
   - Remove key generation from host app

## Security Notes

### Critical Security Principles

1. **Never trust client-decoded data**
   - ID token is decoded client-side for display only
   - Backend must independently verify access token
   - User identity comes from verified JWT claims

2. **Private key security**
   - In production: Only Auth0 has the private key
   - This demo includes it for educational purposes
   - NEVER commit real private keys to version control

3. **Token storage**
   - This demo stores tokens in React state (memory)
   - Consider security trade-offs of localStorage vs memory
   - Use secure, httpOnly cookies when possible

4. **CORS configuration**
   - Widget backend allows specific origins
   - In production, whitelist only your domains

5. **Token expiration**
   - Access tokens should be short-lived (1 hour in this demo)
   - ID tokens can be longer-lived
   - Implement token refresh for long sessions

### What This Demo Simplifies

- No token refresh flow
- Single RSA key (Auth0 rotates keys)
- Client-side token generation (for learning only)
- No PKCE flow
- No actual OAuth/OIDC redirect

## Development Workflow

### Widget Development (Standalone)

```bash
# Start backend
npm run dev:widget-backend

# Start frontend in dev mode
npm run dev:widget-frontend
```

The dev toolbar lets you:
- Switch between mock users
- Simulate anonymous access
- View decoded token claims

### Testing the Full Flow

1. Start all services
2. Open http://localhost:3000
3. Log in with any mock user (password: "password")
4. Submit feedback through the widget
5. Check browser console for token verification logs
6. Check widget backend console for JWT verification

### Building for Production

```bash
# Build widget frontend (creates widget.iife.js)
cd widget/frontend && npm run build

# Build widget backend
cd widget/backend && npm run build

# Build host app
cd host-app && npm run build
```

## API Reference

### Widget Backend Endpoints

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/.well-known/jwks.json` | GET | None | Public keys for JWT verification |
| `/api/feedback` | POST | Optional | Submit feedback |
| `/api/feedback` | GET | Optional | Get all feedback |
| `/api/feedback/me` | GET | Required | Get user's feedback |
| `/health` | GET | None | Health check |

### Authentication Header

```
Authorization: Bearer <access_token>
```

## Style Isolation

The widget uses **Shadow DOM** to ensure complete CSS isolation from the host application. This means:

- ✅ Host app styles (including Tailwind resets) don't affect the widget
- ✅ Widget styles don't leak into the host app
- ✅ Widget looks identical regardless of host styling

See [SHADOW-DOM.md](./SHADOW-DOM.md) for detailed implementation and alternatives.

## Troubleshooting

### Widget styles look wrong or are affected by host CSS
- Verify Shadow DOM is enabled (check console for "Style Isolation: Shadow DOM enabled")
- Check that `widget.css` is being loaded from the backend
- Inspect the DOM to ensure `#shadow-root` is present

### "Failed to load widget script"
- Ensure widget backend is running on localhost:3002
- Check that widget frontend has been built (`npm run build`)

### "Token verification failed"
- Check that RSA keys were generated (`npm run generate-keys`)
- Verify issuer and audience match in token and config
- Check token expiration

### "CORS error"
- Add your domain to allowed origins in widget backend
- Ensure credentials are included in requests

## Learning Resources

- [Auth0 Documentation](https://auth0.com/docs)
- [JWT.io](https://jwt.io) - JWT debugger
- [RFC 7519](https://tools.ietf.org/html/rfc7519) - JWT specification
- [RFC 7517](https://tools.ietf.org/html/rfc7517) - JWK specification

## License

MIT - Use this demo for learning and as a starting point for your own projects.


