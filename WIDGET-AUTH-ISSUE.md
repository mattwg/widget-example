# Widget Authentication State Update Issue

## Problem Summary

The embedded widget is **not reflecting authentication state changes** when the host application passes JWT tokens after user login. The tokens are being passed correctly, the AuthContext is updating internally, but the UI components (specifically `UserBadge`) continue to show "Anonymous" instead of the authenticated user.

## Current Behavior

1. ✅ Host app generates RS256-signed JWTs (access + ID tokens)
2. ✅ Host app calls `window.MyWidget.setTokens(accessToken, idToken)` after login
3. ✅ Widget's `setTokens` method receives the tokens
4. ✅ AuthContext's internal state updates (confirmed via console logs)
5. ✅ ID token is decoded successfully (user info extracted)
6. ❌ **UI does not re-render** - widget still shows "Anonymous"

## Expected Behavior

After `setTokens()` is called, the widget should immediately display the authenticated user's name and avatar from the decoded ID token.

## Technical Context

### Architecture
- **Widget**: React SPA embedded via Shadow DOM (for CSS isolation)
- **Host App**: Separate React app that manages authentication
- **Communication**: Host calls `window.MyWidget` API methods
- **Rendering**: Widget uses `createRoot()` to render into Shadow DOM

### Key Files

1. **`widget/frontend/src/widget-api.tsx`** (lines 556-571)
   - Exposes `window.MyWidget.setTokens()` 
   - Calls `authContextSetTokens()` directly (bypassing props)
   - This was implemented to avoid prop-based re-render issues

2. **`widget/frontend/src/context/AuthContext.tsx`** (lines 118-124)
   - `setTokens()` callback updates state via `setAccessToken()` and `setIdToken()`
   - Includes `forceUpdate()` call (line 123) to trigger re-render
   - User info is derived via `useMemo()` from `idToken` (lines 91-109)

3. **`widget/frontend/src/components/UserBadge.tsx`** (lines 22-26)
   - Consumes `useAuth()` hook to get `user` and `isAuthenticated`
   - Conditionally renders "Anonymous" vs user info

### Console Evidence

```
🔄 Widget: Tokens updated by host
🔄 Widget: Calling AuthContext.setTokens directly
🔐 Widget: Tokens updated
🔐 Widget: User decoded from ID token: Alice Developer alice@example.com
🔐 Widget: AuthContext value computed [object Object]
```

**Analysis**: The state is updating, user is being decoded, context value is recomputed, but components consuming the context aren't re-rendering.

## Root Cause Hypothesis

**Shadow DOM + React Context issue**: When React renders into a Shadow DOM root, context updates may not properly trigger re-renders in child components. This could be due to:

1. React's reconciliation not detecting changes across Shadow DOM boundaries
2. Context subscribers not being notified of updates
3. The `useMemo` dependencies not triggering properly

## Attempted Solutions

### ✅ Attempt 1: Direct AuthContext Method Calls
- Changed from prop-based updates to calling `authContextSetTokens()` directly
- **Result**: State updates but UI doesn't reflect it

### ✅ Attempt 2: Force Update
- Added `forceUpdate` state in AuthContext to force re-renders
- **Result**: Same issue - state updates but components don't re-render

### ❌ Not Yet Tried: Alternative Approaches

## Recommended Investigation Steps

### 1. Verify React Context Subscription (Priority: HIGH)

Check if components are properly subscribed to context updates:

```tsx
// Add to UserBadge.tsx for debugging
const { user, isAuthenticated } = useAuth();
useEffect(() => {
  console.log('🔍 UserBadge re-rendered:', { user, isAuthenticated });
}, [user, isAuthenticated]);
```

**Expected**: Should log on every context update  
**If not logging**: Context subscription is broken

### 2. Test Without Shadow DOM (Priority: HIGH)

Temporarily disable Shadow DOM to isolate the issue:

```tsx
// In widget-api.tsx, comment out Shadow DOM creation
// Render directly to container instead
root = createRoot(container); // Instead of shadowContainer
```

**If this works**: Issue is Shadow DOM + React Context interaction  
**If still broken**: Issue is elsewhere in the state management

### 3. Check React Version Compatibility (Priority: MEDIUM)

Shadow DOM + React 18 concurrent features may have edge cases:
- Verify React version in `widget/frontend/package.json`
- Check if `createRoot` needs special configuration for Shadow DOM
- Consider using `flushSync` for synchronous updates

### 4. Alternative: Event-Based Updates (Priority: MEDIUM)

Instead of relying on React Context, use a custom event system:

```tsx
// In AuthContext
const setTokens = useCallback((accessToken, idToken) => {
  setAccessToken(accessToken);
  setIdToken(idToken);
  
  // Dispatch custom event
  window.dispatchEvent(new CustomEvent('widget:auth:update', {
    detail: { accessToken, idToken }
  }));
}, []);

// In UserBadge
useEffect(() => {
  const handleAuthUpdate = () => {
    // Force component to check latest context
    forceUpdate();
  };
  window.addEventListener('widget:auth:update', handleAuthUpdate);
  return () => window.removeEventListener('widget:auth:update', handleAuthUpdate);
}, []);
```

### 5. React DevTools Inspection (Priority: HIGH)

Use React DevTools to inspect:
- Is AuthContext Provider in the component tree?
- Are consumers showing updated values?
- Is the Shadow DOM boundary visible in the tree?

## Quick Win: Workaround

If you need a temporary solution, re-render the entire widget on token update:

```tsx
// In widget-api.tsx setTokens()
setTokens(accessToken: string, idToken: string) {
  currentAccessToken = accessToken;
  currentIdToken = idToken;
  setApiAccessToken(accessToken);
  
  // Force full re-render
  if (root) {
    root.unmount();
    root = null;
  }
  
  // Re-initialize
  const shadowContainer = shadowRoot?.querySelector('#widget-shadow-root');
  if (shadowContainer) {
    root = createRoot(shadowContainer);
    render();
  }
}
```

**Trade-off**: Loses component state but guarantees UI updates

## Testing the Fix

1. Start all services:
   ```bash
   npm run dev:widget-backend  # Port 3002
   npm run dev:host            # Port 3000
   ```

2. Navigate to `http://localhost:3000`
3. Click "Sign In" (default: Alice Developer / password)
4. **Expected**: Widget should show "Alice Developer" with avatar
5. **Actual**: Widget shows "Anonymous"

6. Check console for:
   - `🔐 Widget: User decoded from ID token: Alice Developer`
   - `🔐 Widget: AuthContext value computed`

## Additional Context

### Why Shadow DOM?
- Provides CSS isolation (host app's Tailwind doesn't affect widget)
- Industry standard for embedded widgets
- See `SHADOW-DOM.md` for implementation details

### Authentication Flow
- Host app generates JWTs using RS256 (mimics Auth0)
- Access token: sent to widget backend for API auth
- ID token: decoded client-side for user display
- See `README.md` for full Auth0-style architecture

## Success Criteria

✅ After host login, widget immediately shows authenticated user  
✅ User avatar/name displays correctly  
✅ "Anonymous" message disappears  
✅ No full widget re-mount required  
✅ Shadow DOM CSS isolation maintained  

## Questions?

- Check console logs for `🔐 Widget:` messages
- All auth logic is in `widget/frontend/src/context/AuthContext.tsx`
- Widget API is in `widget/frontend/src/widget-api.tsx`
- Test in standalone mode: `npm run dev:widget-standalone` (works correctly)

---

**Last Updated**: 2025-12-19  
**Status**: ✅ RESOLVED  
**Impact**: High - core demo functionality broken

---

## Resolution

### Root Cause

The issue had two components:

1. **Shadow DOM + React Context**: React Context updates weren't reliably propagating through the Shadow DOM boundary when using callback-based state management.

2. **Double Script Loading**: The widget script was being loaded twice (due to React StrictMode), creating two separate module instances with their own state. When `setTokens` was called, it updated one store, but the visible React tree was subscribed to a different store.

### Solution

1. **Replaced React Context state with `useSyncExternalStore`**: This is React's recommended pattern for external state synchronization and guarantees re-renders.

2. **Made the token store truly global**: Attached the store state to `window.__WIDGET_TOKEN_STORE__` so all script loads share the same state.

### Files Changed

- `widget/frontend/src/stores/tokenStore.ts` (NEW) - Global token store using `useSyncExternalStore`
- `widget/frontend/src/context/AuthContext.tsx` - Simplified to use the token store
- `widget/frontend/src/widget-api.tsx` - Simplified, added double-init protection
- `widget/frontend/src/dev/MockAuthProvider.tsx` - Updated to use new store pattern

