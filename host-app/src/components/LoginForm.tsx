/**
 * Login Form Component
 * =====================
 * 
 * A simple login form that simulates Auth0 authentication.
 * 
 * In production with Auth0:
 * - You would use Auth0's Universal Login or loginWithRedirect()
 * - Users would be redirected to Auth0's hosted login page
 * - This form wouldn't exist
 */

import { useState } from 'react';
import { MOCK_USERS } from '../auth/authService';

interface LoginFormProps {
  onLogin: (email: string, password: string) => Promise<void>;
  error: string | null;
  isLoading: boolean;
}

export function LoginForm({ onLogin, error, isLoading }: LoginFormProps) {
  const [email, setEmail] = useState(MOCK_USERS[0].email);
  const [password, setPassword] = useState('password');
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onLogin(email, password);
  };
  
  return (
    <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900">Sign In</h2>
        <p className="text-sm text-gray-500 mt-1">
          Demo login - simulates Auth0 authentication
        </p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email field */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <select
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            {MOCK_USERS.map(user => (
              <option key={user.email} value={user.email}>
                {user.name} ({user.email})
              </option>
            ))}
          </select>
        </div>
        
        {/* Password field */}
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            Password
          </label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            placeholder="Enter password"
          />
          <p className="text-xs text-gray-500 mt-1">
            Hint: password is "password"
          </p>
        </div>
        
        {/* Error message */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}
        
        {/* Submit button */}
        <button
          type="submit"
          disabled={isLoading}
          className={`
            w-full py-2.5 px-4 rounded-lg font-medium text-white
            transition-colors duration-200
            ${isLoading 
              ? 'bg-primary/70 cursor-wait' 
              : 'bg-primary hover:bg-primary-hover'
            }
          `}
        >
          {isLoading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>
      
      {/* Auth0 notice */}
      <div className="mt-6 pt-4 border-t border-gray-100">
        <p className="text-xs text-gray-500 text-center">
          ⚠️ This is a mock login. In production, you would use{' '}
          <a 
            href="https://auth0.com" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            Auth0
          </a>
          's Universal Login.
        </p>
      </div>
    </div>
  );
}




