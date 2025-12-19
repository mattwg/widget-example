/**
 * Auth0-Style Configuration Constants
 * ====================================
 *
 * These values mirror what you would configure in a real Auth0 setup.
 *
 * IN PRODUCTION WITH AUTH0:
 * -------------------------
 * - ISSUER would be: https://YOUR_DOMAIN.auth0.com/
 * - JWKS_URI would be: https://YOUR_DOMAIN.auth0.com/.well-known/jwks.json
 * - These values come from your Auth0 dashboard
 * - You'd configure them via environment variables
 *
 * IN THIS DEMO:
 * -------------
 * - We use fake domains for educational clarity
 * - JWKS is hosted by the widget backend (represents Auth0's endpoint)
 * - The host app generates tokens (represents what Auth0 does)
 */
export const AUTH_CONFIG = {
    // ==========================================
    // Issuer Configuration
    // ==========================================
    /**
     * Token issuer URL (iss claim).
     *
     * In Auth0: https://YOUR_DOMAIN.auth0.com/
     * This demo: A fake URL for educational purposes
     */
    ISSUER: 'https://demo-app.auth.local/',
    // ==========================================
    // Audience Configuration
    // ==========================================
    /**
     * Widget API audience (aud claim in access tokens).
     *
     * In Auth0: You create an "API" in the dashboard and get this URL
     * This is what the access token is intended for.
     */
    WIDGET_API_AUDIENCE: 'https://widget-api.local/',
    /**
     * Widget client ID (aud claim in ID tokens).
     *
     * In Auth0: This is your application's Client ID
     * The ID token is for this specific client application.
     */
    WIDGET_CLIENT_ID: 'demo-widget-client',
    // ==========================================
    // JWKS Configuration
    // ==========================================
    /**
     * JWKS (JSON Web Key Set) endpoint URL.
     *
     * ⚠️ DEMO ARCHITECTURE NOTE:
     * In production with Auth0:
     *   JWKS_URI: 'https://YOUR_DOMAIN.auth0.com/.well-known/jwks.json'
     *
     * In this demo, the widget backend hosts the JWKS endpoint.
     * This is ONLY because we don't have a real Auth0 account.
     * In reality, you would NEVER host your own JWKS - Auth0 does that.
     */
    JWKS_URI: 'http://localhost:3002/.well-known/jwks.json',
    // ==========================================
    // Token Expiration
    // ==========================================
    /**
     * Access token expiration (in seconds).
     * Auth0 default is typically 24 hours (86400) but can be configured.
     * For APIs, shorter is more secure (e.g., 1 hour).
     */
    ACCESS_TOKEN_EXPIRY_SECONDS: 3600, // 1 hour
    /**
     * ID token expiration (in seconds).
     * Auth0 default is typically 36000 (10 hours).
     */
    ID_TOKEN_EXPIRY_SECONDS: 86400, // 24 hours
    // ==========================================
    // Scopes / Permissions
    // ==========================================
    /**
     * Available scopes for the widget API.
     * In Auth0, you define these when creating your API.
     *
     * Scopes define what the access token allows the user to do.
     */
    AVAILABLE_SCOPES: ['read:feedback', 'write:feedback'],
    /**
     * Default scopes requested during authentication.
     */
    DEFAULT_SCOPES: 'read:feedback write:feedback',
    // ==========================================
    // Key Configuration
    // ==========================================
    /**
     * Key ID for the RSA signing key.
     * Auth0 uses this for key rotation (multiple keys can be active).
     */
    KEY_ID: 'demo-key-1',
    /**
     * Signing algorithm.
     * RS256 = RSA with SHA-256 (asymmetric, recommended for distributed systems)
     */
    ALGORITHM: 'RS256',
};
/**
 * Backend service URLs
 */
export const SERVICE_URLS = {
    /** Widget backend API base URL */
    WIDGET_BACKEND: 'http://localhost:3002',
    /** Widget frontend dev server (standalone mode) */
    WIDGET_FRONTEND_DEV: 'http://localhost:3001',
    /** Host application dev server */
    HOST_APP: 'http://localhost:3000',
};
//# sourceMappingURL=auth-constants.js.map