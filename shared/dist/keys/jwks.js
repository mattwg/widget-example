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
export const DEMO_JWKS = {
    "keys": [
        {
            "kty": "RSA",
            "n": "u36ru-_14oXJ85d6pltU3J83so-om1fZCRH0xcL62-PK70pDIkZcizLsKYwKeriE54FVYCdi03W4H3oDhgjYg-TB2pZ-YwmLSvEosEAb5F12DBMOPGtMMBagy0JIcJ_Zkn_6GiqtJ4mZq5e9sLwwzyFFNOtVwkjYwCpT2JgC9pUhCpHNvmAuagtpnFgdy8A0pLoOqgfdzYIhvkiLciNnEHRXhL-1jshpQTSRvb6tyBSvv9GmTLa1MJCTqE2nRAaovPNgnhwztT2ZexlIA45waIIBDkgcBZ-KR6dynon6unQsMnExEmcUEsb9_xzEpMQwZXnbH7gy1sr8K8VhxkZNXQ",
            "e": "AQAB",
            "kid": "demo-key-1",
            "use": "sig",
            "alg": "RS256"
        }
    ]
};
export const DEMO_JWK = {
    "kty": "RSA",
    "n": "u36ru-_14oXJ85d6pltU3J83so-om1fZCRH0xcL62-PK70pDIkZcizLsKYwKeriE54FVYCdi03W4H3oDhgjYg-TB2pZ-YwmLSvEosEAb5F12DBMOPGtMMBagy0JIcJ_Zkn_6GiqtJ4mZq5e9sLwwzyFFNOtVwkjYwCpT2JgC9pUhCpHNvmAuagtpnFgdy8A0pLoOqgfdzYIhvkiLciNnEHRXhL-1jshpQTSRvb6tyBSvv9GmTLa1MJCTqE2nRAaovPNgnhwztT2ZexlIA45waIIBDkgcBZ-KR6dynon6unQsMnExEmcUEsb9_xzEpMQwZXnbH7gy1sr8K8VhxkZNXQ",
    "e": "AQAB",
    "kid": "demo-key-1",
    "use": "sig",
    "alg": "RS256"
};
//# sourceMappingURL=jwks.js.map