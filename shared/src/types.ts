/**
 * Shared TypeScript Types
 * ========================
 * Types used across widget frontend, widget backend, and host app.
 */

// ===========================================
// User Types
// ===========================================

/**
 * User profile information.
 * In Auth0, this comes from the ID token or /userinfo endpoint.
 */
export interface User {
  /** Unique user identifier (Auth0 format: "auth0|xxx" or provider-specific) */
  sub: string;
  /** User's display name */
  name: string;
  /** User's email address */
  email: string;
  /** URL to user's profile picture (optional) */
  picture?: string;
}

// ===========================================
// JWT Token Types (Auth0-Style)
// ===========================================

/**
 * Standard JWT claims present in all tokens.
 * These are defined by the JWT specification (RFC 7519).
 */
export interface StandardJWTClaims {
  /** Issuer - who created and signed this token (e.g., Auth0 domain URL) */
  iss: string;
  /** Subject - the user ID this token represents */
  sub: string;
  /** Audience - intended recipient(s) of this token */
  aud: string | string[];
  /** Expiration time (Unix timestamp in seconds) */
  exp: number;
  /** Issued at time (Unix timestamp in seconds) */
  iat: number;
}

/**
 * ID Token claims.
 * 
 * In Auth0/OIDC, the ID token contains user profile information.
 * It's meant to be decoded client-side to display user info.
 * 
 * ⚠️ NEVER use ID token for API authorization - use access token instead!
 */
export interface IDTokenClaims extends StandardJWTClaims {
  /** User's display name */
  name: string;
  /** User's email */
  email: string;
  /** User's profile picture URL */
  picture?: string;
  /** Email verification status (optional) */
  email_verified?: boolean;
}

/**
 * Access Token claims.
 * 
 * In Auth0, the access token is used to authorize API calls.
 * It contains minimal user info but includes permissions (scopes).
 * 
 * The backend MUST verify this token before trusting any claims.
 */
export interface AccessTokenClaims extends StandardJWTClaims {
  /** Space-separated list of permissions granted (e.g., "read:feedback write:feedback") */
  scope: string;
  /** Authorized party - the client ID that requested this token (optional) */
  azp?: string;
}

/**
 * Token pair returned after authentication.
 * This mirrors Auth0's token response format.
 */
export interface TokenPair {
  /** Access token for API authorization (sent to widget backend) */
  access_token: string;
  /** ID token containing user profile (decoded client-side) */
  id_token: string;
  /** Token type (always "Bearer" for Auth0) */
  token_type: 'Bearer';
  /** Access token expiration in seconds (e.g., 3600 = 1 hour) */
  expires_in: number;
}

// ===========================================
// JWK Types (JSON Web Key)
// ===========================================

/**
 * JSON Web Key for RSA public keys.
 * This is the format Auth0 uses in their JWKS endpoint.
 */
export interface RSAPublicJWK {
  /** Key type (always "RSA" for RSA keys) */
  kty: 'RSA';
  /** Key usage ("sig" for signature verification) */
  use: 'sig';
  /** Key ID - used to match against JWT header's "kid" claim */
  kid: string;
  /** Algorithm (RS256 = RSA with SHA-256) */
  alg: 'RS256';
  /** RSA modulus (base64url encoded) */
  n: string;
  /** RSA public exponent (base64url encoded, typically "AQAB" for 65537) */
  e: string;
}

/**
 * JSON Web Key Set.
 * Auth0 exposes this at: https://YOUR_DOMAIN.auth0.com/.well-known/jwks.json
 */
export interface JWKS {
  keys: RSAPublicJWK[];
}

// ===========================================
// Widget Types
// ===========================================

/**
 * Configuration options for initializing the widget.
 */
export interface WidgetConfig {
  /** ID of the DOM element to render the widget into */
  targetId: string;
  /** Access token for API calls (from Auth0) */
  accessToken?: string;
  /** ID token for user display (from Auth0) */
  idToken?: string;
  /** Widget theme */
  theme?: 'light' | 'dark';
  /** Callback for widget events */
  onEvent?: (event: WidgetEvent) => void;
}

/**
 * Events emitted by the widget to the host application.
 */
export type WidgetEvent =
  | { type: 'FEEDBACK_SUBMITTED'; payload: { rating: number; comment: string } }
  | { type: 'ERROR'; payload: { message: string; code?: string } }
  | { type: 'INITIALIZED' }
  | { type: 'DESTROYED' };

/**
 * Global API exposed by the widget via window.MyWidget
 */
export interface WidgetAPI {
  /** Initialize the widget in a target container (async for Shadow DOM setup) */
  init: (config: WidgetConfig) => Promise<void>;
  /** Update tokens (call when host user logs in or tokens refresh) */
  setTokens: (accessToken: string, idToken: string) => void;
  /** Clear tokens (call when host user logs out) */
  clearTokens: () => void;
  /** Clean up and remove the widget */
  destroy: () => void;
}

// ===========================================
// API Types
// ===========================================

/**
 * Feedback submission request body.
 */
export interface FeedbackSubmission {
  /** Rating from 1-5 */
  rating: number;
  /** Optional comment */
  comment?: string;
}

/**
 * Feedback item stored in the "database".
 */
export interface FeedbackItem {
  /** Unique feedback ID */
  id: string;
  /** Rating 1-5 */
  rating: number;
  /** User comment */
  comment?: string;
  /** User ID from verified JWT (or "anonymous") */
  userId: string;
  /** User name from verified JWT (or "Anonymous") */
  userName: string;
  /** Creation timestamp */
  createdAt: string;
}

/**
 * API response for feedback submission.
 */
export interface FeedbackResponse {
  success: boolean;
  feedback: FeedbackItem;
}

// ===========================================
// Augment Window interface for widget global
// ===========================================

declare global {
  interface Window {
    MyWidget?: WidgetAPI;
  }
}


