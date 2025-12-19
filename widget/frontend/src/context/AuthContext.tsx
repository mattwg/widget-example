/**
 * Auth Context
 * =============
 * 
 * Manages authentication state for the widget.
 * Uses an external token store for reliable updates across Shadow DOM boundaries.
 * 
 * Token Flow:
 * 1. Host app authenticates with Auth0
 * 2. Host app passes tokens to widget via window.MyWidget.init()
 * 3. Widget stores tokens in the tokenStore
 * 4. API client uses access token for requests
 * 5. Components use decoded ID token for user display
 */

import { createContext, useContext, type ReactNode } from 'react';
import { 
  useTokenStore, 
  setTokens as storeSetTokens, 
  clearTokens as storeClearTokens,
  initialize as storeInitialize,
  type TokenState 
} from '../stores/tokenStore';

// ===========================================
// Types
// ===========================================

interface AuthContextValue extends TokenState {
  /** Set both tokens (called when host user logs in) */
  setTokens: (accessToken: string, idToken: string) => void;
  /** Clear tokens (called when host user logs out) */
  clearTokens: () => void;
}

// ===========================================
// Context
// ===========================================

const AuthContext = createContext<AuthContextValue | null>(null);

// ===========================================
// Provider
// ===========================================

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  // Use the external store for token state
  // This guarantees re-renders when tokens change, even in Shadow DOM
  const tokenState = useTokenStore();
  
  // Build context value with store methods
  const value: AuthContextValue = {
    ...tokenState,
    setTokens: storeSetTokens,
    clearTokens: storeClearTokens,
  };
  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// ===========================================
// Hook
// ===========================================

/**
 * Hook to access auth state and methods.
 * 
 * @example
 * function MyComponent() {
 *   const { user, isAuthenticated, accessToken } = useAuth();
 *   
 *   if (!isAuthenticated) {
 *     return <div>Please log in</div>;
 *   }
 *   
 *   return <div>Hello, {user.name}</div>;
 * }
 */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}

// ===========================================
// Direct Store Access (for widget-api.ts)
// ===========================================

/**
 * Initialize the token store with initial tokens.
 * Called by widget-api.ts during init.
 */
export function initializeTokenStore(accessToken?: string, idToken?: string): void {
  storeInitialize(accessToken, idToken);
}

/**
 * Set tokens in the store.
 * Called by widget-api.ts when host calls setTokens.
 */
export function setStoreTokens(accessToken: string, idToken: string): void {
  storeSetTokens(accessToken, idToken);
}

/**
 * Clear tokens in the store.
 * Called by widget-api.ts when host calls clearTokens.
 */
export function clearStoreTokens(): void {
  storeClearTokens();
}
