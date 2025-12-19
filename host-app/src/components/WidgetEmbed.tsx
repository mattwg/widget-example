/**
 * Widget Embed Component
 * =======================
 * 
 * Demonstrates how to embed the widget in a host application.
 * 
 * This component:
 * 1. Loads the widget script from the widget backend
 * 2. Initializes the widget with Auth0 tokens
 * 3. Updates the widget when tokens change (login/logout)
 * 4. Cleans up the widget on unmount
 */

import { useEffect, useRef, useCallback } from 'react';
import { SERVICE_URLS, type WidgetEvent } from 'shared';

interface WidgetEmbedProps {
  /** Auth0 access token */
  accessToken: string | null;
  /** Auth0 ID token */
  idToken: string | null;
  /** Widget theme */
  theme?: 'light' | 'dark';
  /** Callback for widget events */
  onEvent?: (event: WidgetEvent) => void;
}

export function WidgetEmbed({ 
  accessToken, 
  idToken, 
  theme = 'light',
  onEvent,
}: WidgetEmbedProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetInitialized = useRef(false);
  const scriptLoaded = useRef(false);
  
  // Handle widget events
  const handleWidgetEvent = useCallback((event: WidgetEvent) => {
    console.log('📥 [Host] Widget event:', event);
    onEvent?.(event);
  }, [onEvent]);
  
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

