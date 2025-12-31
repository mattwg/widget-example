/**
 * Widget Embed Component
 * =======================
 * 
 * Demonstrates how to embed the widget in a host application.
 * 
 * This component:
 * 1. Loads the widget script from the widget backend
 * 2. Initializes the widget with Auth0 tokens
 * 3. Provides a getTokens callback for token refresh
 * 4. Updates the widget when tokens change (login/logout)
 * 5. Cleans up the widget on unmount
 */

import { useEffect, useRef, useCallback } from 'react';
import { SERVICE_URLS, type WidgetEvent, type TokenRefreshResult } from 'shared';

interface WidgetEmbedProps {
  /** Auth0 access token */
  accessToken: string | null;
  /** Auth0 ID token */
  idToken: string | null;
  /** Widget theme */
  theme?: 'light' | 'dark';
  /** Callback for widget events */
  onEvent?: (event: WidgetEvent) => void;
  /** Optional: callback to refresh tokens (for demo purposes, we use current tokens) */
  onRefreshTokens?: () => Promise<TokenRefreshResult | null>;
}

export function WidgetEmbed({ 
  accessToken, 
  idToken, 
  theme = 'light',
  onEvent,
  onRefreshTokens,
}: WidgetEmbedProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetInitialized = useRef(false);
  const scriptLoaded = useRef(false);
  
  // Store refs for tokens to use in getTokens callback
  const accessTokenRef = useRef(accessToken);
  const idTokenRef = useRef(idToken);
  const onRefreshTokensRef = useRef(onRefreshTokens);
  
  // Keep refs in sync
  useEffect(() => {
    accessTokenRef.current = accessToken;
    idTokenRef.current = idToken;
    onRefreshTokensRef.current = onRefreshTokens;
  }, [accessToken, idToken, onRefreshTokens]);
  
  // Handle widget events with token lifecycle logging
  const handleWidgetEvent = useCallback((event: WidgetEvent) => {
    console.log('📥 [Host] Widget event:', event);
    
    // Log token lifecycle events specifically
    switch (event.type) {
      case 'TOKENS_EXPIRING_SOON':
        console.log(`⏳ [Host] Widget tokens expiring in ${event.payload.expiresIn}s - host should refresh`);
        break;
      case 'TOKENS_EXPIRED':
        console.log('⚠️ [Host] Widget tokens expired - user session ended');
        break;
      case 'TOKENS_REFRESHED':
        console.log('✅ [Host] Widget tokens successfully refreshed');
        break;
    }
    
    onEvent?.(event);
  }, [onEvent]);
  
  /**
   * Callback for widget to get fresh tokens.
   * 
   * In a real Auth0 integration, this would call:
   *   const token = await auth0.getAccessTokenSilently();
   *   const idToken = await auth0.getIdTokenClaims().__raw;
   * 
   * For this demo, we return the current tokens or call the provided callback.
   */
  const getTokens = useCallback(async (): Promise<TokenRefreshResult | null> => {
    console.log('🔄 [Host] Widget requesting fresh tokens...');
    
    // If a custom refresh callback is provided, use it
    if (onRefreshTokensRef.current) {
      console.log('🔄 [Host] Using custom refresh callback');
      return onRefreshTokensRef.current();
    }
    
    // Otherwise, return current tokens if available
    // In production, you would call Auth0 SDK here
    if (accessTokenRef.current && idTokenRef.current) {
      console.log('✅ [Host] Returning current tokens to widget');
      return {
        accessToken: accessTokenRef.current,
        idToken: idTokenRef.current,
      };
    }
    
    console.log('❌ [Host] No tokens available (user logged out)');
    return null;
  }, []);
  
  // Load widget script and initialize
  useEffect(() => {
    if (scriptLoaded.current) return;
    
    console.log('📦 [Host] Loading widget script...');
    
    const script = document.createElement('script');
    script.src = `${SERVICE_URLS.WIDGET_BACKEND}/widget/widget.iife.js`;
    script.async = true;
    
    script.onload = async () => {
      console.log('✅ [Host] Widget script loaded');
      scriptLoaded.current = true;
      
      // Initialize widget
      if (window.MyWidget && containerRef.current) {
        console.log('🚀 [Host] Initializing widget...');
        
        await window.MyWidget.init({
          targetId: 'widget-embed-container',
          accessToken: accessToken || undefined,
          idToken: idToken || undefined,
          theme,
          onEvent: handleWidgetEvent,
          // Token refresh callback - widget calls this when tokens are expiring
          getTokens,
          // Optional: Configure validation timing (using defaults for demo)
          // tokenCheckInterval: 60000, // Check every 60 seconds
          // tokenExpirationBuffer: 300000, // Refresh 5 minutes before expiry
        });
        
        widgetInitialized.current = true;
      }
    };
    
    script.onerror = () => {
      console.error('❌ [Host] Failed to load widget script');
      console.error('   Make sure the widget backend is running on localhost:3002');
    };
    
    document.body.appendChild(script);
    
    // Cleanup on unmount
    return () => {
      if (window.MyWidget && widgetInitialized.current) {
        console.log('💥 [Host] Destroying widget');
        window.MyWidget.destroy();
        widgetInitialized.current = false;
      }
      // Note: We don't remove the script as it might cause issues
    };
  }, []); // Empty deps - only run once on mount
  
  // Update tokens when they change
  useEffect(() => {
    if (!widgetInitialized.current || !window.MyWidget) return;
    
    if (accessToken && idToken) {
      console.log('🔄 [Host] Updating widget tokens');
      window.MyWidget.setTokens(accessToken, idToken);
    } else {
      console.log('🔄 [Host] Clearing widget tokens');
      window.MyWidget.clearTokens();
    }
  }, [accessToken, idToken]);
  
  return (
    <div 
      id="widget-embed-container" 
      ref={containerRef}
      className="w-full max-w-md"
    />
  );
}

