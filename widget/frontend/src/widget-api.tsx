/**
 * Widget Global API
 * ==================
 * 
 * Exposes the widget to host applications via window.MyWidget.
 * 
 * This is the public interface that host applications use to:
 * - Initialize the widget in a container
 * - Pass Auth0 tokens from the host's authentication
 * - React to token changes (login/logout)
 * - Clean up the widget
 * 
 * Usage in host app:
 * ```javascript
 * // Load the widget script
 * <script src="http://localhost:3002/widget/widget.iife.js"></script>
 * 
 * // Initialize
 * window.MyWidget.init({
 *   targetId: 'widget-container',
 *   accessToken: accessToken,
 *   idToken: idToken,
 *   theme: 'light',
 *   onEvent: (event) => console.log('Widget event:', event),
 * });
 * 
 * // When user logs in/out or tokens refresh
 * window.MyWidget.setTokens(newAccessToken, newIdToken);
 * window.MyWidget.clearTokens();
 * 
 * // Clean up
 * window.MyWidget.destroy();
 * ```
 */

import { createRoot, type Root } from 'react-dom/client';
import { AuthProvider, initializeTokenStore, setStoreTokens, clearStoreTokens } from './context/AuthContext';
import { FeedbackWidget } from './components/FeedbackWidget';
import { setApiAccessToken } from './api/client';
import { startTokenValidation, stopTokenValidation } from './services/tokenValidator';
import { setExpirationBuffer } from './stores/tokenStore';
import type { WidgetConfig, WidgetAPI } from 'shared';

// Import styles (bundled into the IIFE)
import './index.css';

// ===========================================
// Default Configuration
// ===========================================

const DEFAULT_TOKEN_CHECK_INTERVAL = 60 * 1000; // 60 seconds
const DEFAULT_TOKEN_EXPIRATION_BUFFER = 5 * 60 * 1000; // 5 minutes

// ===========================================
// Internal State
// ===========================================

let root: Root | null = null;
let shadowRoot: ShadowRoot | null = null;
let currentConfig: WidgetConfig | null = null;

// Capture the script URL immediately during script execution
// (document.currentScript is only available during synchronous execution)
const WIDGET_SCRIPT_URL = document.currentScript 
  ? (document.currentScript as HTMLScriptElement).src 
  : '';

// ===========================================
// CSS Injection Helper
// ===========================================

/**
 * Fetches the widget CSS and injects it into the shadow DOM.
 * The CSS is served alongside the widget.iife.js file.
 */
async function injectStyles(shadow: ShadowRoot): Promise<void> {
  try {
    // Determine CSS URL from the script URL
    let cssUrl: string;
    
    if (WIDGET_SCRIPT_URL) {
      // Use the captured script URL
      // widget.iife.js -> widget.css (Vite doesn't include .iife in CSS filename)
      cssUrl = WIDGET_SCRIPT_URL.replace('widget.iife.js', 'widget.css');
    } else {
      // Fallback: try to find the script tag
      const scripts = Array.from(document.getElementsByTagName('script'));
      const widgetScript = scripts.find(s => s.src.includes('widget.iife.js'));
      
      if (widgetScript) {
        cssUrl = widgetScript.src.replace('widget.iife.js', 'widget.css');
      } else {
        console.error('❌ Widget: Could not determine script URL');
        return;
      }
    }
    
    // Fetch and inject CSS
    const response = await fetch(cssUrl);
    if (response.ok) {
      const cssText = await response.text();
      const styleElement = document.createElement('style');
      styleElement.textContent = cssText;
      shadow.appendChild(styleElement);
      console.log('✅ Widget: Styles loaded from', cssUrl);
    } else {
      console.warn('⚠️ Widget: Could not load styles from', cssUrl);
      console.warn('   HTTP Status:', response.status);
    }
  } catch (error) {
    console.error('❌ Widget: Failed to load styles:', error);
  }
}

// ===========================================
// Widget Component Wrapper
// ===========================================

interface WidgetWrapperProps {
  config: WidgetConfig;
}

function WidgetWrapper({ config }: WidgetWrapperProps) {
  return (
    <AuthProvider>
      <FeedbackWidget 
        theme={config.theme} 
        onEvent={config.onEvent}
      />
    </AuthProvider>
  );
}

// ===========================================
// Re-render Helper
// ===========================================

function render() {
  if (!root || !currentConfig) return;
  
  root.render(
    <WidgetWrapper config={currentConfig} />
  );
}

// ===========================================
// Public API
// ===========================================

/**
 * Creates the widget API object that gets exposed on window.MyWidget
 */
export function createWidget(): WidgetAPI {
  return {
    /**
     * Initialize the widget in a target container.
     */
    async init(config: WidgetConfig) {
      console.log('🚀 Widget: Initializing...');
      
      // Calculate validation config with defaults
      const tokenCheckInterval = config.tokenCheckInterval ?? DEFAULT_TOKEN_CHECK_INTERVAL;
      const tokenExpirationBuffer = config.tokenExpirationBuffer ?? DEFAULT_TOKEN_EXPIRATION_BUFFER;
      
      // Prevent double initialization - if already initialized, just update config
      if (root) {
        console.log('⚠️ Widget: Already initialized, updating config');
        currentConfig = config;
        initializeTokenStore(config.accessToken, config.idToken);
        setApiAccessToken(config.accessToken ?? null);
        
        // Update expiration buffer and restart validation
        setExpirationBuffer(tokenExpirationBuffer);
        startTokenValidation({
          getTokens: config.getTokens,
          tokenCheckInterval,
          tokenExpirationBuffer,
          onEvent: config.onEvent,
        });
        
        render();
        config.onEvent?.({ type: 'INITIALIZED' });
        return;
      }
      
      // Find target container
      const container = document.getElementById(config.targetId);
      if (!container) {
        const error = `Widget: Container #${config.targetId} not found`;
        console.error(error);
        config.onEvent?.({ type: 'ERROR', payload: { message: error, code: 'CONTAINER_NOT_FOUND' } });
        return;
      }
      
      // Store config
      currentConfig = config;
      
      // Initialize token store with initial tokens and expiration buffer
      initializeTokenStore(config.accessToken, config.idToken);
      setExpirationBuffer(tokenExpirationBuffer);
      
      // Set up API client with access token
      setApiAccessToken(config.accessToken ?? null);
      
      // Create Shadow DOM for style isolation (or reuse existing)
      if (!shadowRoot) {
        shadowRoot = container.shadowRoot || container.attachShadow({ mode: 'open' });
      }
      
      // Create a container div inside shadow DOM
      let shadowContainer = shadowRoot.querySelector('#widget-shadow-root') as HTMLElement;
      if (!shadowContainer) {
        shadowContainer = document.createElement('div');
        shadowContainer.id = 'widget-shadow-root';
        shadowRoot.appendChild(shadowContainer);
        
        // Inject widget styles into shadow DOM (only once)
        await injectStyles(shadowRoot);
      }
      
      // Create React root in shadow DOM (only once)
      root = createRoot(shadowContainer);
      render();
      
      // Start token validation timer (if tokens provided)
      if (config.accessToken) {
        startTokenValidation({
          getTokens: config.getTokens,
          tokenCheckInterval,
          tokenExpirationBuffer,
          onEvent: config.onEvent,
        });
      }
      
      console.log('✅ Widget: Initialized successfully');
      console.log(`   Container: #${config.targetId}`);
      console.log(`   Theme: ${config.theme || 'light'}`);
      console.log(`   Authenticated: ${!!config.accessToken}`);
      console.log(`   Style Isolation: Shadow DOM enabled`);
      console.log(`   Token Validation: ${config.accessToken ? 'enabled' : 'disabled'}`);
      console.log(`   Check Interval: ${tokenCheckInterval}ms`);
      console.log(`   Expiration Buffer: ${tokenExpirationBuffer}ms`);
      
      // Notify host
      config.onEvent?.({ type: 'INITIALIZED' });
    },
    
    /**
     * Update tokens (called by host when user logs in or tokens refresh).
     */
    setTokens(accessToken: string, idToken: string) {
      console.log('🔄 Widget: Tokens updated by host');
      
      // Update API client
      setApiAccessToken(accessToken);
      
      // Update token store - this will trigger React re-renders
      // via useSyncExternalStore in all subscribed components
      setStoreTokens(accessToken, idToken);
      
      // Restart token validation with updated tokens (if config available)
      if (currentConfig) {
        const tokenCheckInterval = currentConfig.tokenCheckInterval ?? DEFAULT_TOKEN_CHECK_INTERVAL;
        const tokenExpirationBuffer = currentConfig.tokenExpirationBuffer ?? DEFAULT_TOKEN_EXPIRATION_BUFFER;
        
        startTokenValidation({
          getTokens: currentConfig.getTokens,
          tokenCheckInterval,
          tokenExpirationBuffer,
          onEvent: currentConfig.onEvent,
        });
      }
      
      console.log('✅ Widget: Tokens set successfully');
    },
    
    /**
     * Clear tokens (called by host when user logs out).
     */
    clearTokens() {
      console.log('🧹 Widget: Tokens cleared by host');
      
      // Clear API client token
      setApiAccessToken(null);
      
      // Clear token store - this will trigger React re-renders
      clearStoreTokens();
      
      console.log('✅ Widget: Tokens cleared successfully');
    },
    
    /**
     * Clean up and destroy the widget.
     */
    destroy() {
      console.log('💥 Widget: Destroying...');
      
      // Stop token validation timer
      stopTokenValidation();
      
      if (root) {
        root.unmount();
        root = null;
      }
      
      // Clear shadow DOM
      shadowRoot = null;
      
      // Clear tokens
      clearStoreTokens();
      setApiAccessToken(null);
      
      // Notify host
      currentConfig?.onEvent?.({ type: 'DESTROYED' });
      currentConfig = null;
      
      console.log('✅ Widget: Destroyed');
    },
  };
}
