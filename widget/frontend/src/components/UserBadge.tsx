/**
 * UserBadge Component
 * ====================
 * 
 * Displays the authenticated user's info from the ID token.
 * Shows "Anonymous" for unauthenticated users.
 * 
 * User info comes from the decoded ID token (client-side).
 * Remember: this is for DISPLAY only - the backend independently
 * verifies the access token for authorization.
 */

import { useAuth } from '../context/AuthContext';

interface UserBadgeProps {
  /** Size variant */
  size?: 'sm' | 'md';
  /** Whether to show email */
  showEmail?: boolean;
}

export function UserBadge({ size = 'md', showEmail = false }: UserBadgeProps) {
  const { user, isAuthenticated, isExpired } = useAuth();
  
  // Anonymous user
  if (!isAuthenticated || !user) {
    return (
      <div className={`
        widget-flex widget-items-center widget-gap-2
        ${size === 'sm' ? 'widget-text-xs' : 'widget-text-sm'}
      `}>
        <div className={`
          widget-rounded-full widget-bg-gray-200 widget-flex widget-items-center widget-justify-center
          ${size === 'sm' ? 'widget-w-6 widget-h-6' : 'widget-w-8 widget-h-8'}
        `}>
          <svg 
            className={`widget-text-gray-400 ${size === 'sm' ? 'widget-w-3 widget-h-3' : 'widget-w-4 widget-h-4'}`}
            fill="currentColor" 
            viewBox="0 0 20 20"
          >
            <path 
              fillRule="evenodd" 
              d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" 
              clipRule="evenodd" 
            />
          </svg>
        </div>
        <span className="widget-text-gray-500">Anonymous</span>
      </div>
    );
  }
  
  // Authenticated user
  return (
    <div className={`
      widget-flex widget-items-center widget-gap-2
      ${size === 'sm' ? 'widget-text-xs' : 'widget-text-sm'}
    `}>
      {/* Avatar */}
      {user.picture ? (
        <img 
          src={user.picture} 
          alt={user.name}
          className={`
            widget-rounded-full widget-object-cover
            ${size === 'sm' ? 'widget-w-6 widget-h-6' : 'widget-w-8 widget-h-8'}
          `}
        />
      ) : (
        <div className={`
          widget-rounded-full widget-bg-widget-primary widget-flex widget-items-center widget-justify-center widget-text-white widget-font-medium
          ${size === 'sm' ? 'widget-w-6 widget-h-6 widget-text-xs' : 'widget-w-8 widget-h-8 widget-text-sm'}
        `}>
          {user.name.charAt(0).toUpperCase()}
        </div>
      )}
      
      {/* User info */}
      <div className="widget-flex widget-flex-col">
        <span className="widget-font-medium widget-text-gray-900">
          {user.name}
          {isExpired && (
            <span className="widget-ml-1 widget-text-widget-warning widget-text-xs">
              (session expired)
            </span>
          )}
        </span>
        {showEmail && (
          <span className="widget-text-gray-500 widget-text-xs">
            {user.email}
          </span>
        )}
      </div>
    </div>
  );
}


