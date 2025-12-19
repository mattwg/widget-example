/**
 * Standalone Development Entry Point
 * ====================================
 * 
 * This runs the widget as a normal React application for development.
 * 
 * Features:
 * - Dev toolbar to switch between mock users
 * - Mock Auth0-style tokens
 * - Hot module reloading
 * - No host app required
 * 
 * Run with: npm run dev (in widget/frontend directory)
 */

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { MockAuthProvider } from './dev/MockAuthProvider';
import { FeedbackWidget } from './components/FeedbackWidget';
import './index.css';

function StandaloneApp() {
  return (
    <MockAuthProvider>
      <div className="widget-min-h-screen widget-bg-gray-100 widget-py-8 widget-px-4">
        <div className="widget-max-w-md widget-mx-auto">
          {/* Title */}
          <div className="widget-mb-6 widget-text-center">
            <h1 className="widget-text-2xl widget-font-bold widget-text-gray-900 widget-mb-2">
              Widget Standalone Mode
            </h1>
            <p className="widget-text-sm widget-text-gray-600">
              Development mode with mock authentication
            </p>
          </div>
          
          {/* Widget */}
          <FeedbackWidget 
            theme="light"
            onEvent={(event) => {
              console.log('📤 Widget Event:', event);
            }}
          />
          
          {/* Debug info */}
          <div className="widget-mt-6 widget-p-4 widget-bg-white widget-rounded-lg widget-shadow widget-text-xs widget-text-gray-600">
            <h3 className="widget-font-semibold widget-text-gray-900 widget-mb-2">
              Development Info
            </h3>
            <ul className="widget-space-y-1">
              <li>• Widget backend: <code className="widget-bg-gray-100 widget-px-1 widget-rounded">localhost:3002</code></li>
              <li>• Use the toolbar above to switch users</li>
              <li>• Open DevTools to see API calls and token verification</li>
            </ul>
          </div>
        </div>
      </div>
    </MockAuthProvider>
  );
}

// Mount the app
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <StandaloneApp />
  </StrictMode>
);


