/**
 * Host Application
 * =================
 * 
 * Demonstrates how to embed the widget in a host application
 * and pass Auth0 tokens for authentication.
 * 
 * Key Integration Points:
 * 1. User authenticates with Auth0 (mocked here)
 * 2. Host app receives access_token and id_token
 * 3. Host app passes tokens to widget via init() or setTokens()
 * 4. Widget uses access_token for API calls
 * 5. Widget uses id_token to display user info
 */

import { useState } from 'react';
import { useAuth } from './auth/useAuth';
import { LoginForm } from './components/LoginForm';
import { WidgetEmbed } from './components/WidgetEmbed';
import type { WidgetEvent } from 'shared';

function App() {
  const { isAuthenticated, isLoading, user, tokens, error, login, logout } = useAuth();
  const [widgetEvents, setWidgetEvents] = useState<WidgetEvent[]>([]);
  
  const handleLogin = async (email: string, password: string) => {
    await login(email, password);
  };
  
  const handleWidgetEvent = (event: WidgetEvent) => {
    setWidgetEvents(prev => [event, ...prev].slice(0, 10));
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Host Application</h1>
            <p className="text-sm text-gray-500">Widget Embedding Demo</p>
          </div>
          
          {isAuthenticated && user && (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                {user.picture && (
                  <img 
                    src={user.picture} 
                    alt={user.name}
                    className="w-8 h-8 rounded-full"
                  />
                )}
                <div>
                  <p className="text-sm font-medium text-gray-900">{user.name}</p>
                  <p className="text-xs text-gray-500">{user.email}</p>
                </div>
              </div>
              <button
                onClick={logout}
                className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Sign Out
              </button>
            </div>
          )}
        </div>
      </header>
      
      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left Column - Auth & Widget */}
          <div className="space-y-6">
            {/* Auth Section */}
            {!isAuthenticated ? (
              <LoginForm 
                onLogin={handleLogin} 
                error={error} 
                isLoading={isLoading} 
              />
            ) : (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="font-medium text-green-800">Authenticated</p>
                </div>
                <p className="text-sm text-green-700 mt-1">
                  Tokens passed to widget. User: {user?.name}
                </p>
              </div>
            )}
            
            {/* Widget */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Embedded Widget
              </h2>
              <WidgetEmbed
                accessToken={tokens?.access_token || null}
                idToken={tokens?.id_token || null}
                theme="light"
                onEvent={handleWidgetEvent}
              />
            </div>
          </div>
          
          {/* Right Column - Info & Events */}
          <div className="space-y-6">
            {/* Token Info */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Token Information
              </h3>
              
              {tokens ? (
                <div className="space-y-4">
                  {/* Access Token */}
                  <div>
                    <label className="block text-sm font-medium text-blue-600 mb-1">
                      Access Token (for API calls)
                    </label>
                    <div className="bg-gray-50 p-3 rounded-lg font-mono text-xs break-all text-gray-600">
                      {tokens.access_token.substring(0, 80)}...
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Sent to widget backend in Authorization header
                    </p>
                  </div>
                  
                  {/* ID Token */}
                  <div>
                    <label className="block text-sm font-medium text-green-600 mb-1">
                      ID Token (for user display)
                    </label>
                    <div className="bg-gray-50 p-3 rounded-lg font-mono text-xs break-all text-gray-600">
                      {tokens.id_token.substring(0, 80)}...
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Decoded client-side by widget to show user info
                    </p>
                  </div>
                  
                  {/* Expires */}
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">Expires in:</span>{' '}
                    {Math.floor(tokens.expires_in / 60)} minutes
                  </div>
                </div>
              ) : (
                <p className="text-gray-500 text-sm">
                  No tokens - user not authenticated
                </p>
              )}
            </div>
            
            {/* Widget Events */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Widget Events
              </h3>
              
              {widgetEvents.length > 0 ? (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {widgetEvents.map((event, index) => (
                    <div 
                      key={index}
                      className="bg-gray-50 p-2 rounded text-xs font-mono"
                    >
                      <span className="text-purple-600">{event.type}</span>
                      {event.type !== 'INITIALIZED' && event.type !== 'DESTROYED' && (
                        <pre className="text-gray-600 mt-1">
                          {JSON.stringify(event.payload, null, 2)}
                        </pre>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">
                  No events yet - interact with the widget
                </p>
              )}
            </div>
            
            {/* Architecture Info */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <h3 className="font-semibold text-amber-800 mb-2">
                🏗️ Architecture Note
              </h3>
              <p className="text-sm text-amber-700">
                In production with Auth0:
              </p>
              <ul className="text-sm text-amber-700 list-disc list-inside mt-2 space-y-1">
                <li>Auth0 generates tokens (not this app)</li>
                <li>JWKS endpoint is hosted by Auth0</li>
                <li>Widget backend fetches public key from Auth0</li>
                <li>Only the token flow changes - widget code stays the same!</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;




