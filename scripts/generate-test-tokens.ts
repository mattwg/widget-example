/**
 * Generate Test Tokens
 * ====================
 * 
 * Generates valid RS256 JWT tokens for testing the widget.
 * 
 * Usage:
 *   npx tsx scripts/generate-test-tokens.ts
 */

import * as jose from 'jose';

// Inline config to avoid import issues
const AUTH_CONFIG = {
  ISSUER: 'https://demo-app.auth.local/',
  WIDGET_API_AUDIENCE: 'https://widget-api.local/',
  WIDGET_CLIENT_ID: 'demo-widget-client',
  KEY_ID: 'demo-key-1',
  ACCESS_TOKEN_EXPIRY_SECONDS: 3600,
  ID_TOKEN_EXPIRY_SECONDS: 86400,
  DEFAULT_SCOPES: 'read:feedback write:feedback',
};

const PRIVATE_KEY = `-----BEGIN PRIVATE KEY-----
MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC7fqu77/Xihcnz
l3qmW1Tcnzeyj6ibV9kJEfTFwvrb48rvSkMiRlyLMuwpjAp6uITngVVgJ2LTdbgf
egOGCNiD5MHaln5jCYtK8SiwQBvkXXYMEw48a0wwFqDLQkhwn9mSf/oaKq0niZmr
l72wvDDPIUU061XCSNjAKlPYmAL2lSEKkc2+YC5qC2mcWB3LwDSkug6qB93NgiG+
SItyI2cQdFeEv7WOyGlBNJG9vq3IFK+/0aZMtrUwkJOoTadEBqi882CeHDO1PZl7
GUgDjnBoggEOSBwFn4pHp3Keifq6dCwycTESZxQSxv3/HMSkxDBledsfuDLWyvwr
xWHGRk1dAgMBAAECggEANK+zsmwLvEu8JCc83+JqRlS3YgXca0qUQmg5UBkqRQAN
1pAXrVn4R2VX15TynOmc7zD4vLxUmPdLdgzjUJbLwMRXdQU1Hr9f1P9PX7ekHtfk
hCAWsAO2tQymwnctw/gnO3Oa5B956NJRzFYnh7JaRNokiGpY/u9ZeSZryUFuE7v5
G+cDg9r5Rr++o/PfgGhPE5cPf4djvrQ96FNKW51hBWztVRCdGBQw1ORz3z1V9Ymn
Kdu0RodQMFD31TDZTskfB0/ocytV610oLNNCpOU7GgoPSDEkcJynmQ//NiLI/wdO
RXEqEpUkbSbOgFgXuF4lv6CjJ+G86DANkdYcMc76QQKBgQDbahl7t4YGvMyd5bsP
HMFFim0qgjta/sg+rCeaDxZ6NLjvTOu7Y1VYWwJAg4TXYkygMtvRJXVeLyFx1DWT
fUcTrJcFDF/v1oPitp8wqnLepdNxmB6P43QkPw8tgrzSK40idc63sN6ovYagP3Uu
qM9rzJ+4dm3psjSRmbzHm9n6WwKBgQDawg2RtXgcFlKEC1GcTXgoUgqRjDweMOwz
MCNaKOR+Dnik6OYvbbYcj5qCG4QNS1HIG0QmFNsoaiz2JkRb2BAggyRP9f35RIyD
shR0bTzuhI5nLFCEUxXuvVAXpo+Pu9OAxjTUhOhnvhNGvY+s4vbLvsvctFfJVqxa
+aDC+uS0pwKBgAZXTKE8roznS+qMRxmqtRMzavA9j0WT82mMRCC5quahO27/BBkI
R+Ej0C7ZHi+zUY+XqK6krH2qUwcdIOdASZuR81NcBjHCO1GEAZnAc01n8XJo+Qkj
g6nAgMnJ63cPdya1zOGWJPkvcQKUkuhkTIpLAZqtIYQNeGN00/XY1TXdAoGBAJSA
UQfOAdhHSwK6UE9jw6LTdrsxUIpKOb3R+t20jtAH8Nw6AjDGMG8ZCREzrqP7smu+
HrgfRlscIKOEfLlAZko73EWvvxYc86pfFEWo9kkQkT72tT3uzR/BQgKcHi67mat8
Yda21rG+NYW7HzKE7HaJcgjEICfcf6pOdVSHTwRXAoGBAM86EPXhl53WWR7YgAPB
A1BsAwlc4CUukFEkbjb+LmV7uIKOkTPd0A4R91o3YbC/i61kz5MEkYmWlbpw5GvF
1YDmkdQcVKt9xG6yd5Vjt+KxhLZM0DB+WASSsJ7pk4jQXMr5Tp/4zTtPJImdUjdy
KexjD6hNNa3TOL8fVagiGNZc
-----END PRIVATE KEY-----`;

const TEST_USER = {
  sub: 'auth0|test-user-001',
  name: 'Test User',
  email: 'test@example.com',
  picture: 'https://api.dicebear.com/7.x/avataaars/svg?seed=test',
};

async function generateTokens() {
  const now = Math.floor(Date.now() / 1000);
  const privateKey = await jose.importPKCS8(PRIVATE_KEY, 'RS256');
  
  // ID Token - for client-side display
  const idToken = await new jose.SignJWT({
    iss: AUTH_CONFIG.ISSUER,
    sub: TEST_USER.sub,
    aud: AUTH_CONFIG.WIDGET_CLIENT_ID,
    name: TEST_USER.name,
    email: TEST_USER.email,
    picture: TEST_USER.picture,
    email_verified: true,
  })
    .setProtectedHeader({ alg: 'RS256', typ: 'JWT', kid: AUTH_CONFIG.KEY_ID })
    .setIssuedAt(now)
    .setExpirationTime(now + AUTH_CONFIG.ID_TOKEN_EXPIRY_SECONDS)
    .sign(privateKey);
  
  // Access Token - for API authorization
  const accessToken = await new jose.SignJWT({
    iss: AUTH_CONFIG.ISSUER,
    sub: TEST_USER.sub,
    aud: AUTH_CONFIG.WIDGET_API_AUDIENCE,
    scope: AUTH_CONFIG.DEFAULT_SCOPES,
    azp: AUTH_CONFIG.WIDGET_CLIENT_ID,
  })
    .setProtectedHeader({ alg: 'RS256', typ: 'JWT', kid: AUTH_CONFIG.KEY_ID })
    .setIssuedAt(now)
    .setExpirationTime(now + AUTH_CONFIG.ACCESS_TOKEN_EXPIRY_SECONDS)
    .sign(privateKey);
  
  console.log('=== Test Tokens Generated ===\n');
  console.log('User:', TEST_USER.name, `(${TEST_USER.email})`);
  console.log('Access token expires in:', AUTH_CONFIG.ACCESS_TOKEN_EXPIRY_SECONDS, 'seconds (1 hour)\n');
  
  console.log('ACCESS_TOKEN:');
  console.log(accessToken);
  console.log();
  
  console.log('ID_TOKEN:');
  console.log(idToken);
  console.log();
  
  console.log('=== Test with curl ===\n');
  console.log(`curl -sk -H "Host: demo-widget.dev.lxtp.chegg.services" \\
  -H "Authorization: Bearer ${accessToken}" \\
  https://k8s-default-demowidg-fe72b533ed-1475798625.us-west-2.elb.amazonaws.com/api/feedback`);
}

generateTokens().catch(console.error);

