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
import type { AccessTokenClaims } from 'shared';
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
export declare function authenticateToken(req: Request, res: Response, next: NextFunction): Promise<void>;
/**
 * Require Authentication Middleware
 *
 * Use after authenticateToken to require a valid token.
 * Rejects anonymous requests with 401.
 */
export declare function requireAuth(req: Request, res: Response, next: NextFunction): void;
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
export declare function requireScope(...requiredScopes: string[]): (req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=auth.d.ts.map