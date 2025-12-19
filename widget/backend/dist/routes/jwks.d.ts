/**
 * JWKS Endpoint (Mock Auth0)
 * ===========================
 *
 * This endpoint exposes the public RSA key in JWK format.
 *
 * ⚠️ DEMO ARCHITECTURE NOTE:
 * ==========================
 * In a REAL production environment with Auth0:
 *
 *   1. You would NEVER host your own JWKS endpoint
 *   2. Auth0 provides this at: https://YOUR_DOMAIN.auth0.com/.well-known/jwks.json
 *   3. Your backend would FETCH from Auth0's endpoint, not host one
 *
 * This demo hosts the JWKS endpoint locally because:
 *   - We don't have a real Auth0 account
 *   - We want to demonstrate how JWKS works
 *   - The verification code (jwt-verifier.ts) works exactly the same
 *     whether fetching from Auth0 or this local endpoint
 *
 * When migrating to real Auth0:
 *   1. Delete this entire file/route
 *   2. Update JWKS_URI in auth-constants.ts to Auth0's URL
 *   3. That's it! The verification middleware works unchanged.
 */
export declare const jwksRouter: import("express-serve-static-core").Router;
//# sourceMappingURL=jwks.d.ts.map