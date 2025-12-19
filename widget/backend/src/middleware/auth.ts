/**
 * Authentication Middleware
 * ==========================
 * 
 * Verifies JWT access tokens on protected routes.
 * 
 * This middleware:
 * 1. Extracts the Bearer token from Authorization header
 * 2. Verifies the token using our JWT verifier (RS256 + JWKS)
 * 3. Attaches the decoded user info to the request
 * 4. Allows anonymous access if no token is provided
 * 
 * IN PRODUCTION WITH AUTH0:
 * -------------------------
 * This middleware works exactly the same! The only change is
 * the JWKS_URI in auth-constants.ts pointing to Auth0's endpoint.
 */

import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, TokenVerificationError } from '../utils/jwt-verifier.js';
import type { AccessTokenClaims } from 'shared';

// Extend Express Request type to include user info
declare global {
  namespace Express {
    interface Request {
      /** Decoded user info from verified JWT (null if anonymous) */
      user: AccessTokenClaims | null;
      /** Whether the request is authenticated */
      isAuthenticated: boolean;
    }
  }
}

/**
 * JWT Authentication Middleware
 * 
 * Extracts and verifies the JWT from the Authorization header.
 * Sets req.user with decoded claims or null for anonymous users.
 * 
 * Authorization Header Format:
 *   Authorization: Bearer <access_token>
 * 
 * @example
 * // Protected route that requires authentication
 * app.post('/api/feedback', authenticateToken, requireAuth, feedbackHandler);
 * 
 * // Route that allows anonymous but uses user if available
 * app.post('/api/feedback', authenticateToken, feedbackHandler);
 */
export async function authenticateToken(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  // Extract Authorization header
  const authHeader = req.headers['authorization'];
  const token = authHeader?.split(' ')[1]; // "Bearer <token>"
  
  // No token provided - allow anonymous access
  if (!token) {
    console.log('📋 Request without token - anonymous access');
    req.user = null;
    req.isAuthenticated = false;
    return next();
  }
  
  try {
    // Verify the token and extract claims
    console.log('🔐 Verifying access token...');
    const claims = await verifyAccessToken(token);
    
    console.log('✅ Token verified successfully');
    console.log(`   User: ${claims.sub}`);
    console.log(`   Scopes: ${claims.scope}`);
    
    req.user = claims;
    req.isAuthenticated = true;
    next();
  } catch (error) {
    if (error instanceof TokenVerificationError) {
      console.log(`❌ Token verification failed: ${error.code}`);
      console.log(`   ${error.message}`);
      
      // Return appropriate error response
      res.status(401).json({
        error: 'Unauthorized',
        code: error.code,
        message: error.message,
      });
      return;
    }
    
    // Unexpected error
    console.error('❌ Unexpected authentication error:', error);
    res.status(500).json({
      error: 'Authentication failed',
      message: 'An unexpected error occurred during authentication',
    });
  }
}

/**
 * Require Authentication Middleware
 * 
 * Use after authenticateToken to require a valid token.
 * Rejects anonymous requests with 401.
 */
export function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (!req.isAuthenticated || !req.user) {
    res.status(401).json({
      error: 'Unauthorized',
      code: 'TOKEN_MISSING',
      message: 'Authentication required. Please provide a valid access token.',
    });
    return;
  }
  
  next();
}

/**
 * Require Scope Middleware
 * 
 * Checks if the authenticated user has the required scope(s).
 * Must be used after authenticateToken.
 * 
 * @param requiredScopes - One or more required scopes
 * 
 * @example
 * app.post('/api/feedback', authenticateToken, requireScope('write:feedback'), handler);
 */
export function requireScope(...requiredScopes: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        error: 'Unauthorized',
        code: 'TOKEN_MISSING',
        message: 'Authentication required.',
      });
      return;
    }
    
    const userScopes = req.user.scope?.split(' ') || [];
    const missingScopes = requiredScopes.filter(s => !userScopes.includes(s));
    
    if (missingScopes.length > 0) {
      res.status(403).json({
        error: 'Forbidden',
        code: 'INSUFFICIENT_SCOPE',
        message: `Missing required scope(s): ${missingScopes.join(', ')}`,
        required: requiredScopes,
        provided: userScopes,
      });
      return;
    }
    
    next();
  };
}


