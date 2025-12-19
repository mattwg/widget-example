/**
 * Authentication Hook
 * ====================
 * 
 * Manages authentication state for the host application.
 * 
 * In production with Auth0:
 * - Use the Auth0 React SDK instead
 * - import { useAuth0 } from '@auth0/auth0-react';
 */

import { useState, useCallback } from 'react';
import { mockLogin, mockLogout, type LoginResult } from './authService';
import type { User, TokenPair } from 'shared';

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  tokens: TokenPair | null;
  error: string | null;
}

interface UseAuthReturn extends AuthState {
  login: (email: string, password: string) => Promise<LoginResult>;
  logout: () => void;
}

export function useAuth(): UseAuthReturn {
  const [state, setState] = useState<AuthState>({
    isAuthenticated: false,
    isLoading: false,
    user: null,
    tokens: null,
    error: null,
  });
  
  const login = useCallback(async (email: string, password: string): Promise<LoginResult> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const result = await mockLogin(email, password);
    
    if (result.success && result.user && result.tokens) {
      setState({
        isAuthenticated: true,
        isLoading: false,
        user: result.user,
        tokens: result.tokens,
        error: null,
      });
    } else {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: result.error || 'Login failed',
      }));
    }
    
    return result;
  }, []);
  
  const logout = useCallback(() => {
    mockLogout();
    setState({
      isAuthenticated: false,
      isLoading: false,
      user: null,
      tokens: null,
      error: null,
    });
  }, []);
  
  return {
    ...state,
    login,
    logout,
  };
}

