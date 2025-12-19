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

import { Router } from 'express';
import { DEMO_JWKS } from 'shared';

export const jwksRouter = Router();

/**
 * GET /.well-known/jwks.json
 * 
 * Returns the JSON Web Key Set containing our public RSA key.
 * 
 * This is the standard endpoint path that Auth0 and other OIDC providers use.
 * The ".well-known" path is defined by RFC 5785 for discoverable resources.
 * 
 * Response format (matches Auth0's response):
 * {
 *   "keys": [
 *     {
 *       "kty": "RSA",        // Key type
 *       "use": "sig",        // Key usage (signature verification)
 *       "kid": "demo-key-1", // Key ID (for key rotation)
 *       "n": "...",          // RSA modulus (base64url)
 *       "e": "AQAB",         // RSA exponent (base64url)
 *       "alg": "RS256"       // Algorithm
 *     }
 *   ]
 * }
 */
jwksRouter.get('/.well-known/jwks.json', (_req, res) => {
  // Log for demo/learning purposes
  console.log('📥 JWKS request received');
  console.log('   In production, this request would go to Auth0\'s servers');
  
  // Set appropriate cache headers
  // Auth0 recommends caching JWKS for performance
  res.setHeader('Cache-Control', 'public, max-age=3600'); // 1 hour
  res.setHeader('Content-Type', 'application/json');
  
  res.json(DEMO_JWKS);
});


