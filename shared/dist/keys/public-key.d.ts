/**
 * RSA Public Key (PEM Format)
 *
 * This is the public half of the RSA key pair.
 * It's used to VERIFY JWT signatures, not create them.
 *
 * In production with Auth0:
 * - You would fetch this from Auth0's JWKS endpoint
 * - https://YOUR_DOMAIN.auth0.com/.well-known/jwks.json
 */
export declare const PUBLIC_KEY = "-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAu36ru+/14oXJ85d6pltU\n3J83so+om1fZCRH0xcL62+PK70pDIkZcizLsKYwKeriE54FVYCdi03W4H3oDhgjY\ng+TB2pZ+YwmLSvEosEAb5F12DBMOPGtMMBagy0JIcJ/Zkn/6GiqtJ4mZq5e9sLww\nzyFFNOtVwkjYwCpT2JgC9pUhCpHNvmAuagtpnFgdy8A0pLoOqgfdzYIhvkiLciNn\nEHRXhL+1jshpQTSRvb6tyBSvv9GmTLa1MJCTqE2nRAaovPNgnhwztT2ZexlIA45w\naIIBDkgcBZ+KR6dynon6unQsMnExEmcUEsb9/xzEpMQwZXnbH7gy1sr8K8VhxkZN\nXQIDAQAB\n-----END PUBLIC KEY-----\n";
//# sourceMappingURL=public-key.d.ts.map