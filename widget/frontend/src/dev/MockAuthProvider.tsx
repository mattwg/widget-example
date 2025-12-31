/**
 * Mock Auth Provider for Standalone Development
 * ===============================================
 * 
 * Provides mock Auth0-style tokens for developing the widget
 * without needing the host app or actual Auth0 integration.
 * 
 * Features:
 * - Switch between predefined mock users
 * - Generate realistic Auth0-style tokens
 * - Simulate anonymous mode
 * - Display decoded token info for learning
 */

import { useState, useCallback, useEffect, type ReactNode } from 'react';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { initialize as initializeTokenStore, setTokens as setStoreTokens, clearTokens as clearStoreTokens } from '../stores/tokenStore';
import { setApiAccessToken } from '../api/client';
import { generateMockTokens, MOCK_USERS, type MockUser } from './generateMockTokens';

interface MockAuthProviderProps {
  children: ReactNode;
}

export function MockAuthProvider({ children }: MockAuthProviderProps) {
  const [currentUser, setCurrentUser] = useState<MockUser | null>(MOCK_USERS[0]);
  
  // Initialize token store on mount
  useEffect(() => {
    if (currentUser) {
      const tokens = generateMockTokens(currentUser);
      initializeTokenStore(tokens.access_token, tokens.id_token);
      setApiAccessToken(tokens.access_token);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  
  const handleUserChange = useCallback((user: MockUser | null) => {
    setCurrentUser(user);
    if (user) {
      const newTokens = generateMockTokens(user);
      setStoreTokens(newTokens.access_token, newTokens.id_token);
      setApiAccessToken(newTokens.access_token);
    } else {
      clearStoreTokens();
      setApiAccessToken(null);
    }
  }, []);
  
  return (
    <AuthProvider>
      <DevToolbar 
        users={MOCK_USERS}
        currentUser={currentUser}
        onUserChange={handleUserChange}
      />
      {children}
    </AuthProvider>
  );
}

// ===========================================
// Dev Toolbar Component
// ===========================================

interface DevToolbarProps {
  users: MockUser[];
  currentUser: MockUser | null;
  onUserChange: (user: MockUser | null) => void;
}

function DevToolbar({ users, currentUser, onUserChange }: DevToolbarProps) {
  const [showTokens, setShowTokens] = useState(false);
  const auth = useAuth();
  
  return (
    <div className="widget-fixed widget-top-0 widget-left-0 widget-right-0 widget-z-50 widget-bg-gray-900 widget-text-white widget-text-xs">
      <div className="widget-max-w-4xl widget-mx-auto widget-px-4 widget-py-2">
        <div className="widget-flex widget-items-center widget-justify-between widget-gap-4">
          {/* Label */}
          <div className="widget-flex widget-items-center widget-gap-2">
            <span className="widget-bg-yellow-500 widget-text-black widget-px-2 widget-py-0.5 widget-rounded widget-font-bold">
              DEV MODE
            </span>
            <span className="widget-text-gray-400">
              Mock Auth0 Tokens
            </span>
          </div>
          
          {/* User selector */}
          <div className="widget-flex widget-items-center widget-gap-3">
            <label className="widget-text-gray-400">User:</label>
            <select
              value={currentUser?.sub || 'anonymous'}
              onChange={(e) => {
                const value = e.target.value;
                if (value === 'anonymous') {
                  onUserChange(null);
                } else {
                  const user = users.find(u => u.sub === value);
                  if (user) onUserChange(user);
                }
              }}
              className="widget-bg-gray-800 widget-border widget-border-gray-700 widget-rounded widget-px-2 widget-py-1 widget-text-white focus:widget-outline-none focus:widget-ring-1 focus:widget-ring-blue-500"
            >
              <option value="anonymous">Anonymous (No Token)</option>
              {users.map(user => (
                <option key={user.sub} value={user.sub}>
                  {user.name}
                </option>
              ))}
            </select>
            
            {/* Toggle token display */}
            <button
              onClick={() => setShowTokens(!showTokens)}
              className="widget-px-2 widget-py-1 widget-bg-gray-700 widget-rounded hover:widget-bg-gray-600 widget-transition-colors"
            >
              {showTokens ? 'Hide Tokens' : 'Show Tokens'}
            </button>
          </div>
        </div>
        
        {/* Token display (expandable) */}
        {showTokens && (
          <div className="widget-mt-2 widget-pt-2 widget-border-t widget-border-gray-700">
            {auth.isAuthenticated ? (
              <div className="widget-grid widget-grid-cols-2 widget-gap-4">
                {/* ID Token */}
                <div>
                  <div className="widget-font-semibold widget-text-green-400 widget-mb-1">
                    ID Token (decoded - for display only)
                  </div>
                  <pre className="widget-bg-gray-800 widget-p-2 widget-rounded widget-overflow-x-auto widget-text-xs">
                    {JSON.stringify({
                      sub: auth.user?.sub,
                      name: auth.user?.name,
                      email: auth.user?.email,
                    }, null, 2)}
                  </pre>
                </div>
                
                {/* Access Token info */}
                <div>
                  <div className="widget-font-semibold widget-text-blue-400 widget-mb-1">
                    Access Token (used for API calls)
                  </div>
                  <pre className="widget-bg-gray-800 widget-p-2 widget-rounded widget-overflow-x-auto widget-text-xs">
                    {auth.accessToken ? (
                      `Bearer ${auth.accessToken.substring(0, 50)}...`
                    ) : 'null'}
                  </pre>
                  <p className="widget-text-gray-500 widget-mt-1">
                    Sent in Authorization header to widget backend
                  </p>
                </div>
              </div>
            ) : (
              <p className="widget-text-gray-400">
                No tokens - requests will be anonymous
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}


