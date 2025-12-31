/**
 * Client-Side JWT Decoder
 * ========================
 * 
 * Decodes JWT tokens WITHOUT verification.
 * 
 * ⚠️ IMPORTANT SECURITY NOTE:
 * ---------------------------
 * This decoder is for DISPLAY PURPOSES ONLY!
 * 
 * - Use it to decode ID tokens and show user info in the UI
 * - NEVER use decoded data for authorization decisions
 * - NEVER trust this data on the backend
 * 
 * The widget backend must independently verify tokens using
 * the JWKS public key - that's where trust is established.
 */

import type { IDTokenClaims, AccessTokenClaims } from 'shared';

/**
 * Base64URL decode (handles URL-safe base64)
 */
function base64UrlDecode(str: string): string {
  // Convert base64url to base64
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  
  // Add padding if needed
  const padding = base64.length % 4;
  if (padding) {
    base64 += '='.repeat(4 - padding);
  }
  
  // Decode
  return atob(base64);
}

/**
 * Decode a JWT token without verification.
 * 
 * @param token - The JWT token string
 * @returns The decoded payload, or null if decoding fails
 */
export function decodeToken<T = Record<string, unknown>>(token: string): T | null {
  try {
    const parts = token.split('.');
    
    if (parts.length !== 3) {
      console.warn('Invalid JWT format: expected 3 parts');
      return null;
    }
    
    const payload = parts[1];
    const decoded = base64UrlDecode(payload);
    return JSON.parse(decoded) as T;
  } catch (error) {
    console.warn('Failed to decode JWT:', error);
    return null;
  }
}

/**
 * Decode an ID token to extract user profile information.
 * 
 * Use this to display user name, email, picture in the widget UI.
 */
export function decodeIdToken(token: string): IDTokenClaims | null {
  return decodeToken<IDTokenClaims>(token);
}

/**
 * Decode an access token to view its claims.
 * 
 * Useful for debugging, but remember: the backend
 * is the only place that should trust these claims.
 */
export function decodeAccessToken(token: string): AccessTokenClaims | null {
  return decodeToken<AccessTokenClaims>(token);
}

/**
 * Check if a token is expired based on its exp claim.
 * 
 * Note: This is a client-side check for UX purposes.
 * The backend will independently verify expiration.
 */
export function isTokenExpired(token: string): boolean {
  const claims = decodeToken<{ exp: number }>(token);
  
  if (!claims || typeof claims.exp !== 'number') {
    return true; // Assume expired if we can't check
  }
  
  // exp is in seconds, Date.now() is in milliseconds
  const expirationMs = claims.exp * 1000;
  const nowMs = Date.now();
  
  // Add 30 second buffer to account for clock skew
  return nowMs >= (expirationMs - 30000);
}

/**
 * Get time until token expires.
 * 
 * @returns Seconds until expiration, or 0 if expired
 */
export function getTokenTTL(token: string): number {
  const claims = decodeToken<{ exp: number }>(token);
  
  if (!claims || typeof claims.exp !== 'number') {
    return 0;
  }
  
  const expirationMs = claims.exp * 1000;
  const nowMs = Date.now();
  const ttlMs = expirationMs - nowMs;
  
  return Math.max(0, Math.floor(ttlMs / 1000));
}




