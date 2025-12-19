/**
 * RSA Key Pair Generator
 * =======================
 * This script generates an RSA-256 key pair for JWT signing.
 * 
 * In a REAL Auth0 Integration:
 * - Auth0 manages the keys internally
 * - You would NEVER have access to the private key
 * - Your app only needs to fetch the public key from Auth0's JWKS endpoint
 * 
 * For this DEMO:
 * - We generate our own key pair
 * - Private key is used by host app to sign tokens (simulates Auth0)
 * - Public key is exposed via mock JWKS endpoint
 * 
 * Run: npm run generate-keys
 */

import { generateKeyPairSync, createPublicKey } from 'crypto';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Generate RSA key pair (2048 bits, standard for JWT)
console.log('🔐 Generating RSA-256 key pair...\n');

const { publicKey, privateKey } = generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: {
    type: 'spki',
    format: 'pem',
  },
  privateKeyEncoding: {
    type: 'pkcs8',
    format: 'pem',
  },
});

// Convert public key to JWK format for JWKS endpoint
const publicKeyObject = createPublicKey(publicKey);
const jwk = publicKeyObject.export({ format: 'jwk' });

// Add required JWK properties
const jwkWithMetadata = {
  ...jwk,
  kid: 'demo-key-1', // Key ID (Auth0 uses this for key rotation)
  use: 'sig',         // Key usage: signature
  alg: 'RS256',       // Algorithm
};

// Output directory
const outputDir = join(__dirname, '..', 'shared', 'src', 'keys');

// Create output directory if it doesn't exist
if (!existsSync(outputDir)) {
  mkdirSync(outputDir, { recursive: true });
}

// Write keys to files
const privateKeyPath = join(outputDir, 'private-key.ts');
const publicKeyPath = join(outputDir, 'public-key.ts');
const jwksPath = join(outputDir, 'jwks.ts');

// Private key file (PEM format)
writeFileSync(privateKeyPath, `/**
 * RSA Private Key (PEM Format)
 * 
 * ⚠️ DEMO ONLY - SECURITY WARNING ⚠️
 * In production with Auth0:
 * - This key would NEVER exist in your codebase
 * - Auth0 manages private keys internally
 * - Only Auth0 servers can sign tokens
 * 
 * This demo includes the private key for educational purposes only.
 * It allows the host app to simulate what Auth0 does when signing tokens.
 */
export const PRIVATE_KEY = \`${privateKey}\`;
`);

// Public key file (PEM format)
writeFileSync(publicKeyPath, `/**
 * RSA Public Key (PEM Format)
 * 
 * This is the public half of the RSA key pair.
 * It's used to VERIFY JWT signatures, not create them.
 * 
 * In production with Auth0:
 * - You would fetch this from Auth0's JWKS endpoint
 * - https://YOUR_DOMAIN.auth0.com/.well-known/jwks.json
 */
export const PUBLIC_KEY = \`${publicKey}\`;
`);

// JWKS file (JSON Web Key Set format)
writeFileSync(jwksPath, `/**
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
export const DEMO_JWKS = ${JSON.stringify({ keys: [jwkWithMetadata] }, null, 2)};

export const DEMO_JWK = ${JSON.stringify(jwkWithMetadata, null, 2)};
`);

console.log('✅ Keys generated successfully!\n');
console.log('Files created:');
console.log(`  📁 ${privateKeyPath}`);
console.log(`  📁 ${publicKeyPath}`);
console.log(`  📁 ${jwksPath}`);
console.log('\n⚠️  Remember: In production, private keys stay with Auth0!');
console.log('    This demo includes them for educational purposes only.\n');

