/**
 * Token Validation Service
 * =========================
 * 
 * Periodically validates token expiration and triggers refresh when needed.
 * 
 * This service:
 * 1. Runs a timer to check token expiration periodically
 * 2. Calls the host's getTokens() callback when tokens are expiring
 * 3. Emits events for token lifecycle changes
 * 4. Updates the token store with fresh tokens
 * 
 * The host application is responsible for providing fresh tokens.
 * If the host returns null, the session is considered expired.
 */

import type { WidgetEvent, TokenRefreshResult } from 'shared';
import { getTokenTTL } from '../utils/jwt-decoder';
import { setTokens, getSnapshot } from '../stores/tokenStore';

// ===========================================
// Types
// ===========================================

export interface TokenValidatorConfig {
  /** Callback to get fresh tokens from host */
  getTokens?: () => Promise<TokenRefreshResult | null>;
  /** How often to check token expiration (ms) */
  tokenCheckInterval: number;
  /** Time before expiration to trigger refresh (ms) */
  tokenExpirationBuffer: number;
  /** Event emitter callback */
  onEvent?: (event: WidgetEvent) => void;
}

// ===========================================
// State
// ===========================================

let validationTimerId: ReturnType<typeof setInterval> | null = null;
let currentConfig: TokenValidatorConfig | null = null;
let isRefreshing = false;

// ===========================================
// Internal Helpers
// ===========================================

/**
 * Check token TTL and determine status
 */
function checkTokenStatus(accessToken: string | null, bufferMs: number): {
  status: 'valid' | 'expiring' | 'expired';
  ttlSeconds: number;
} {
  if (!accessToken) {
    return { status: 'expired', ttlSeconds: 0 };
  }
  
  const ttlSeconds = getTokenTTL(accessToken);
  const ttlMs = ttlSeconds * 1000;
  
  if (ttlSeconds <= 0) {
    return { status: 'expired', ttlSeconds: 0 };
  }
  
  if (ttlMs < bufferMs) {
    return { status: 'expiring', ttlSeconds };
  }
  
  return { status: 'valid', ttlSeconds };
}

/**
 * Attempt to refresh tokens by calling the host's getTokens callback
 */
async function attemptTokenRefresh(): Promise<boolean> {
  if (!currentConfig?.getTokens) {
    console.log('⏰ TokenValidator: No getTokens callback provided');
    return false;
  }
  
  if (isRefreshing) {
    console.log('⏰ TokenValidator: Refresh already in progress');
    return false;
  }
  
  isRefreshing = true;
  
  try {
    console.log('⏰ TokenValidator: Requesting fresh tokens from host...');
    const result = await currentConfig.getTokens();
    
    if (result && result.accessToken && result.idToken) {
      console.log('✅ TokenValidator: Received fresh tokens from host');
      setTokens(result.accessToken, result.idToken);
      
      currentConfig.onEvent?.({ type: 'TOKENS_REFRESHED' });
      return true;
    } else {
      console.log('⚠️ TokenValidator: Host returned null (session expired)');
      currentConfig.onEvent?.({ type: 'TOKENS_EXPIRED' });
      return false;
    }
  } catch (error) {
    console.error('❌ TokenValidator: Error refreshing tokens:', error);
    currentConfig.onEvent?.({
      type: 'ERROR',
      payload: {
        message: error instanceof Error ? error.message : 'Failed to refresh tokens',
        code: 'TOKEN_REFRESH_ERROR',
      },
    });
    return false;
  } finally {
    isRefreshing = false;
  }
}

/**
 * Run a single validation check
 */
async function runValidationCheck(): Promise<void> {
  if (!currentConfig) {
    return;
  }
  
  const { accessToken } = getSnapshot();
  const { status, ttlSeconds } = checkTokenStatus(
    accessToken,
    currentConfig.tokenExpirationBuffer
  );
  
  console.log(`⏰ TokenValidator: Check - status=${status}, TTL=${ttlSeconds}s`);
  
  switch (status) {
    case 'expired':
      console.log('⏰ TokenValidator: Tokens have expired');
      currentConfig.onEvent?.({ type: 'TOKENS_EXPIRED' });
      break;
      
    case 'expiring':
      console.log('⏰ TokenValidator: Tokens expiring soon, attempting refresh...');
      currentConfig.onEvent?.({ 
        type: 'TOKENS_EXPIRING_SOON', 
        payload: { expiresIn: ttlSeconds } 
      });
      await attemptTokenRefresh();
      break;
      
    case 'valid':
      // Tokens are still valid, nothing to do
      break;
  }
}

// ===========================================
// Public API
// ===========================================

/**
 * Start the token validation timer.
 * 
 * @param config - Validation configuration
 */
export function startTokenValidation(config: TokenValidatorConfig): void {
  // Stop any existing validation
  stopTokenValidation();
  
  currentConfig = config;
  
  console.log('⏰ TokenValidator: Starting validation', {
    checkInterval: `${config.tokenCheckInterval}ms`,
    expirationBuffer: `${config.tokenExpirationBuffer}ms`,
    hasGetTokens: !!config.getTokens,
  });
  
  // Run initial check
  runValidationCheck();
  
  // Start periodic validation
  validationTimerId = setInterval(() => {
    runValidationCheck();
  }, config.tokenCheckInterval);
}

/**
 * Stop the token validation timer.
 */
export function stopTokenValidation(): void {
  if (validationTimerId !== null) {
    console.log('⏰ TokenValidator: Stopping validation');
    clearInterval(validationTimerId);
    validationTimerId = null;
  }
  currentConfig = null;
  isRefreshing = false;
}

/**
 * Force a token refresh attempt.
 * Useful when the host wants to proactively refresh tokens.
 */
export async function forceTokenRefresh(): Promise<boolean> {
  if (!currentConfig) {
    console.warn('⏰ TokenValidator: Cannot force refresh - not initialized');
    return false;
  }
  return attemptTokenRefresh();
}

/**
 * Get the current token status.
 * 
 * @param bufferMs - Optional buffer override
 * @returns Token status and TTL
 */
export function getCurrentTokenStatus(bufferMs?: number): {
  status: 'valid' | 'expiring' | 'expired';
  ttlSeconds: number;
} {
  const { accessToken } = getSnapshot();
  const buffer = bufferMs ?? currentConfig?.tokenExpirationBuffer ?? 300000;
  return checkTokenStatus(accessToken, buffer);
}

/**
 * Check if validation is currently running.
 */
export function isValidationRunning(): boolean {
  return validationTimerId !== null;
}




