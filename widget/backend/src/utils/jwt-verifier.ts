/**
 * JWT Verification Utilities
 * ===========================
 * 
 * Handles RS256 JWT verification with JWKS public key lookup.
 * 
 * This code works identically whether you're fetching from:
 * - Our local mock JWKS endpoint (demo)
 * - Auth0's actual JWKS endpoint (production)
 * 
 * The only change needed for production is updating JWKS_URI.
 */

import jwt from 'jsonwebtoken';
import jwkToPem from 'jwk-to-pem';
import { AUTH_CONFIG, type AccessTokenClaims, type JWKS, type RSAPublicJWK } from 'shared';

// ===========================================
// JWKS Cache
// ===========================================
// Cache the JWKS to avoid fetching on every request.
// In production, you'd want a more sophisticated cache
// with proper TTL and refresh logic.

interface JWKSCache {
  jwks: JWKS | null;
  fetchedAt: number;
  ttlMs: number;
}

const jwksCache: JWKSCache = {
  jwks: null,
  fetchedAt: 0,
  ttlMs: 60 * 60 * 1000, // 1 hour cache
};

/**
 * Fetch JWKS from the configured endpoint.
 * 
 * In production with Auth0:
 *   JWKS_URI = 'https://YOUR_DOMAIN.auth0.com/.well-known/jwks.json'
 * 
 * In this demo:
 *   JWKS_URI = 'http://localhost:3002/.well-known/jwks.json'
 */
async function fetchJWKS(): Promise<JWKS> {
  const now = Date.now();
  
  // Return cached JWKS if still valid
  if (jwksCache.jwks && (now - jwksCache.fetchedAt) < jwksCache.ttlMs) {
    return jwksCache.jwks;
  }
  
  console.log(`🔑 Fetching JWKS from: ${AUTH_CONFIG.JWKS_URI}`);
  console.log('   (In production, this would fetch from Auth0)');
  
  const response = await fetch(AUTH_CONFIG.JWKS_URI);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch JWKS: ${response.status} ${response.statusText}`);
  }
  
  const jwks = await response.json() as JWKS;
  
  // Update cache
  jwksCache.jwks = jwks;
  jwksCache.fetchedAt = now;
  
  return jwks;
}

/**
 * Get the public key for a given key ID (kid).
 * 
 * Auth0 can have multiple active keys for rotation purposes.
 * The JWT header contains the "kid" that identifies which key was used to sign it.
 */
async function getPublicKey(kid: string): Promise<string> {
  const jwks = await fetchJWKS();
  
  const key = jwks.keys.find((k: RSAPublicJWK) => k.kid === kid);
  
  if (!key) {
    throw new Error(`Key with kid "${kid}" not found in JWKS`);
  }
  
  // Convert JWK to PEM format for jsonwebtoken library
  return jwkToPem(key);
}

/**
 * Verification errors with specific codes for better error handling.
 */
export class TokenVerificationError extends Error {
  constructor(
    message: string,
    public readonly code: 
      | 'TOKEN_MISSING'
      | 'TOKEN_MALFORMED'
      | 'TOKEN_EXPIRED'
      | 'TOKEN_INVALID_SIGNATURE'
      | 'TOKEN_INVALID_ISSUER'
      | 'TOKEN_INVALID_AUDIENCE'
      | 'JWKS_FETCH_FAILED'
      | 'KEY_NOT_FOUND'
  ) {
    super(message);
    this.name = 'TokenVerificationError';
  }
}

/**
 * Verify an access token and return the decoded claims.
 * 
 * This function performs the following checks (same as Auth0 SDK):
 * 1. ✓ Decodes the JWT header to get the key ID (kid)
 * 2. ✓ Fetches the public key from JWKS endpoint
 * 3. ✓ Verifies the RS256 signature
 * 4. ✓ Validates the issuer (iss) claim
 * 5. ✓ Validates the audience (aud) claim
 * 6. ✓ Checks the expiration (exp) claim
 * 
 * @param token - The JWT access token to verify
 * @returns The decoded token claims
 * @throws TokenVerificationError if verification fails
 */
export async function verifyAccessToken(token: string): Promise<AccessTokenClaims> {
  // Step 1: Decode header to get key ID
  const decoded = jwt.decode(token, { complete: true });
  
  if (!decoded || typeof decoded === 'string') {
    throw new TokenVerificationError(
      'Token is malformed or cannot be decoded',
      'TOKEN_MALFORMED'
    );
  }
  
  const { kid } = decoded.header;
  
  if (!kid) {
    throw new TokenVerificationError(
      'Token header missing "kid" (key ID)',
      'TOKEN_MALFORMED'
    );
  }
  
  // Step 2: Get public key from JWKS
  let publicKey: string;
  try {
    publicKey = await getPublicKey(kid);
  } catch (error) {
    if (error instanceof Error && error.message.includes('not found')) {
      throw new TokenVerificationError(
        `Key "${kid}" not found in JWKS`,
        'KEY_NOT_FOUND'
      );
    }
    throw new TokenVerificationError(
      'Failed to fetch JWKS',
      'JWKS_FETCH_FAILED'
    );
  }
  
  // Step 3-6: Verify signature and claims
  try {
    const verified = jwt.verify(token, publicKey, {
      algorithms: [AUTH_CONFIG.ALGORITHM],
      issuer: AUTH_CONFIG.ISSUER,
      audience: AUTH_CONFIG.WIDGET_API_AUDIENCE,
    }) as AccessTokenClaims;
    
    return verified;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new TokenVerificationError(
        'Token has expired',
        'TOKEN_EXPIRED'
      );
    }
    
    if (error instanceof jwt.JsonWebTokenError) {
      const message = error.message.toLowerCase();
      
      if (message.includes('issuer')) {
        throw new TokenVerificationError(
          `Invalid issuer. Expected: ${AUTH_CONFIG.ISSUER}`,
          'TOKEN_INVALID_ISSUER'
        );
      }
      
      if (message.includes('audience')) {
        throw new TokenVerificationError(
          `Invalid audience. Expected: ${AUTH_CONFIG.WIDGET_API_AUDIENCE}`,
          'TOKEN_INVALID_AUDIENCE'
        );
      }
      
      if (message.includes('signature')) {
        throw new TokenVerificationError(
          'Invalid token signature',
          'TOKEN_INVALID_SIGNATURE'
        );
      }
    }
    
    throw new TokenVerificationError(
      `Token verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      'TOKEN_INVALID_SIGNATURE'
    );
  }
}


