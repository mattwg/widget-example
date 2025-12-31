/**
 * Token Store
 * ===========
 * 
 * External store for authentication tokens that works reliably with Shadow DOM.
 * Uses the useSyncExternalStore pattern for guaranteed React re-renders.
 * 
 * Why this approach?
 * - React Context updates don't always propagate through Shadow DOM boundaries
 * - useSyncExternalStore is React's recommended pattern for external state
 * - Guarantees synchronous re-renders when state changes
 * 
 * The store is attached to window.__WIDGET_TOKEN_STORE__ to ensure all script
 * loads share the same state (important when script is loaded multiple times).
 */

import { useSyncExternalStore } from 'react';
import { decodeIdToken, getTokenTTL } from '../utils/jwt-decoder';
import type { TokenStatus } from 'shared';

// ===========================================
// Types
// ===========================================

export interface UserInfo {
  sub: string;
  name: string;
  email: string;
  picture?: string;
}

export interface TokenState {
  accessToken: string | null;
  idToken: string | null;
  user: UserInfo | null;
  isAuthenticated: boolean;
  isExpired: boolean;
  /** Current token status: 'valid', 'expiring', or 'expired' */
  tokenStatus: TokenStatus;
  /** Time until token expires in seconds (0 if expired or no token) */
  tokenTTL: number;
}

type Listener = () => void;

// ===========================================
// Global Store State (attached to window)
// ===========================================

interface GlobalTokenStore {
  accessToken: string | null;
  idToken: string | null;
  listeners: Set<Listener>;
  cachedSnapshot: TokenState | null;
  lastAccessToken: string | null;
  lastIdToken: string | null;
  /** Buffer time before expiration to consider tokens "expiring" (in ms) */
  expirationBufferMs: number;
}

declare global {
  interface Window {
    __WIDGET_TOKEN_STORE__?: GlobalTokenStore;
  }
}

// Default expiration buffer: 5 minutes
const DEFAULT_EXPIRATION_BUFFER_MS = 5 * 60 * 1000;

// Initialize global store if it doesn't exist
if (!window.__WIDGET_TOKEN_STORE__) {
  window.__WIDGET_TOKEN_STORE__ = {
    accessToken: null,
    idToken: null,
    listeners: new Set<Listener>(),
    cachedSnapshot: null,
    lastAccessToken: null,
    lastIdToken: null,
    expirationBufferMs: DEFAULT_EXPIRATION_BUFFER_MS,
  };
}

// Reference to the global store
const store = window.__WIDGET_TOKEN_STORE__;

// ===========================================
// Internal Helpers
// ===========================================

function decodeUser(): UserInfo | null {
  if (!store.idToken) {
    return null;
  }

  const claims = decodeIdToken(store.idToken);
  if (!claims) {
    console.log('🔐 TokenStore: Failed to decode ID token');
    return null;
  }

  console.log('🔐 TokenStore: User decoded:', claims.name, claims.email);
  return {
    sub: claims.sub,
    name: claims.name,
    email: claims.email,
    picture: claims.picture,
  };
}

function emitChange(): void {
  console.log('🔐 TokenStore: Notifying', store.listeners.size, 'listeners');
  // Invalidate cache
  store.cachedSnapshot = null;
  for (const listener of store.listeners) {
    listener();
  }
}

// ===========================================
// Store API
// ===========================================

/**
 * Calculate token status based on TTL and buffer
 */
function calculateTokenStatus(accessToken: string | null): { 
  status: TokenStatus; 
  ttl: number; 
  isExpired: boolean;
} {
  if (!accessToken) {
    return { status: 'expired', ttl: 0, isExpired: true };
  }
  
  const ttlSeconds = getTokenTTL(accessToken);
  const ttlMs = ttlSeconds * 1000;
  
  if (ttlSeconds <= 0) {
    return { status: 'expired', ttl: 0, isExpired: true };
  }
  
  if (ttlMs < store.expirationBufferMs) {
    return { status: 'expiring', ttl: ttlSeconds, isExpired: false };
  }
  
  return { status: 'valid', ttl: ttlSeconds, isExpired: false };
}

/**
 * Get the current snapshot of token state.
 * This is called by useSyncExternalStore on every render.
 * Returns cached snapshot if state hasn't changed (referential equality).
 */
export function getSnapshot(): TokenState {
  // Return cached snapshot if state hasn't changed
  if (store.cachedSnapshot !== null && 
      store.lastAccessToken === store.accessToken && 
      store.lastIdToken === store.idToken) {
    return store.cachedSnapshot;
  }

  const user = decodeUser();
  const { status, ttl, isExpired } = calculateTokenStatus(store.accessToken);
  const isAuthenticated = !!store.accessToken && !!user && !isExpired;

  store.cachedSnapshot = {
    accessToken: store.accessToken,
    idToken: store.idToken,
    user,
    isAuthenticated,
    isExpired,
    tokenStatus: status,
    tokenTTL: ttl,
  };
  store.lastAccessToken = store.accessToken;
  store.lastIdToken = store.idToken;

  return store.cachedSnapshot;
}

/**
 * Subscribe to store changes.
 * Returns an unsubscribe function.
 */
export function subscribe(listener: Listener): () => void {
  console.log('🔐 TokenStore: Subscriber added, total:', store.listeners.size + 1);
  store.listeners.add(listener);
  return () => {
    store.listeners.delete(listener);
    console.log('🔐 TokenStore: Subscriber removed, total:', store.listeners.size);
  };
}

/**
 * Set both tokens (called when host user logs in).
 */
export function setTokens(newAccessToken: string, newIdToken: string): void {
  console.log('🔐 TokenStore: Setting tokens');
  store.accessToken = newAccessToken;
  store.idToken = newIdToken;
  emitChange();
}

/**
 * Clear tokens (called when host user logs out).
 */
export function clearTokens(): void {
  console.log('🔐 TokenStore: Clearing tokens');
  store.accessToken = null;
  store.idToken = null;
  emitChange();
}

/**
 * Initialize with tokens (called during widget init).
 */
export function initialize(initialAccessToken?: string, initialIdToken?: string): void {
  console.log('🔐 TokenStore: Initializing', { 
    hasAccessToken: !!initialAccessToken, 
    hasIdToken: !!initialIdToken 
  });
  store.accessToken = initialAccessToken ?? null;
  store.idToken = initialIdToken ?? null;
  // Invalidate cache but don't emit - React will read initial state
  store.cachedSnapshot = null;
}

/**
 * Get the raw access token (for API client).
 */
export function getAccessToken(): string | null {
  return store.accessToken;
}

/**
 * Set the expiration buffer (in milliseconds).
 * This determines when tokens are considered "expiring".
 */
export function setExpirationBuffer(bufferMs: number): void {
  store.expirationBufferMs = bufferMs;
  // Invalidate cache so next getSnapshot recalculates status
  store.cachedSnapshot = null;
}

/**
 * Get current expiration buffer setting.
 */
export function getExpirationBuffer(): number {
  return store.expirationBufferMs;
}

/**
 * Force a cache invalidation to recalculate token status.
 * Call this when time-sensitive status checks are needed.
 */
export function invalidateCache(): void {
  store.cachedSnapshot = null;
  emitChange();
}

// ===========================================
// Convenience object for tokenStore.xxx pattern
// ===========================================

export const tokenStore = {
  getSnapshot,
  subscribe,
  setTokens,
  clearTokens,
  initialize,
  getAccessToken,
  setExpirationBuffer,
  getExpirationBuffer,
  invalidateCache,
};

// ===========================================
// React Hook
// ===========================================

/**
 * Hook to subscribe to token state changes.
 * Uses useSyncExternalStore for guaranteed re-renders.
 * 
 * @example
 * function MyComponent() {
 *   const { user, isAuthenticated } = useTokenStore();
 *   
 *   if (!isAuthenticated) {
 *     return <div>Please log in</div>;
 *   }
 *   
 *   return <div>Hello, {user.name}</div>;
 * }
 */
export function useTokenStore(): TokenState {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}


