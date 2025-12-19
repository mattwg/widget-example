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
import { type AccessTokenClaims } from 'shared';
/**
 * Verification errors with specific codes for better error handling.
 */
export declare class TokenVerificationError extends Error {
    readonly code: 'TOKEN_MISSING' | 'TOKEN_MALFORMED' | 'TOKEN_EXPIRED' | 'TOKEN_INVALID_SIGNATURE' | 'TOKEN_INVALID_ISSUER' | 'TOKEN_INVALID_AUDIENCE' | 'JWKS_FETCH_FAILED' | 'KEY_NOT_FOUND';
    constructor(message: string, code: 'TOKEN_MISSING' | 'TOKEN_MALFORMED' | 'TOKEN_EXPIRED' | 'TOKEN_INVALID_SIGNATURE' | 'TOKEN_INVALID_ISSUER' | 'TOKEN_INVALID_AUDIENCE' | 'JWKS_FETCH_FAILED' | 'KEY_NOT_FOUND');
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
export declare function verifyAccessToken(token: string): Promise<AccessTokenClaims>;
//# sourceMappingURL=jwt-verifier.d.ts.map