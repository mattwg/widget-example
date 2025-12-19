/**
 * Embeddable Widget Entry Point
 * ==============================
 * 
 * This is the production entry point for the embeddable widget.
 * When built, it creates a single IIFE bundle that:
 * 
 * 1. Bundles React and all dependencies inline
 * 2. Exposes window.MyWidget global API
 * 3. Can be loaded via a simple <script> tag
 * 
 * Usage in host application:
 * ```html
 * <script src="http://localhost:3002/widget/widget.iife.js"></script>
 * <div id="my-widget"></div>
 * <script>
 *   window.MyWidget.init({
 *     targetId: 'my-widget',
 *     accessToken: userAccessToken,
 *     idToken: userIdToken,
 *     theme: 'light',
 *     onEvent: (e) => console.log('Widget event:', e),
 *   });
 * </script>
 * ```
 */

import { createWidget } from './widget-api.js';

// Create and expose the widget API globally
const widget = createWidget();

// Attach to window
window.MyWidget = widget;

console.log('📦 Widget: Script loaded');
console.log('   Use window.MyWidget.init({...}) to initialize');

