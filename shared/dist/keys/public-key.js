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
export const PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAu36ru+/14oXJ85d6pltU
3J83so+om1fZCRH0xcL62+PK70pDIkZcizLsKYwKeriE54FVYCdi03W4H3oDhgjY
g+TB2pZ+YwmLSvEosEAb5F12DBMOPGtMMBagy0JIcJ/Zkn/6GiqtJ4mZq5e9sLww
zyFFNOtVwkjYwCpT2JgC9pUhCpHNvmAuagtpnFgdy8A0pLoOqgfdzYIhvkiLciNn
EHRXhL+1jshpQTSRvb6tyBSvv9GmTLa1MJCTqE2nRAaovPNgnhwztT2ZexlIA45w
aIIBDkgcBZ+KR6dynon6unQsMnExEmcUEsb9/xzEpMQwZXnbH7gy1sr8K8VhxkZN
XQIDAQAB
-----END PUBLIC KEY-----
`;
//# sourceMappingURL=public-key.js.map