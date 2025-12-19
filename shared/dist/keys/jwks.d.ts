/**
 * JSON Web Key Set (JWKS)
 *
 * This is the standard format for exposing public keys.
 * Auth0 exposes their public keys at:
 * https://YOUR_DOMAIN.auth0.com/.well-known/jwks.json
 *
 * Your backend fetches this to verify JWT signatures.
 *
 * Key properties:
 * - kty: Key type (RSA)
 * - use: Key usage (sig = signature)
 * - kid: Key ID (for key rotation)
 * - n: RSA modulus (base64url encoded)
 * - e: RSA exponent (base64url encoded)
 * - alg: Algorithm (RS256)
 */
export declare const DEMO_JWKS: {
    keys: {
        kty: string;
        n: string;
        e: string;
        kid: string;
        use: string;
        alg: string;
    }[];
};
export declare const DEMO_JWK: {
    kty: string;
    n: string;
    e: string;
    kid: string;
    use: string;
    alg: string;
};
//# sourceMappingURL=jwks.d.ts.map