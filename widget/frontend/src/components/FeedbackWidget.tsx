/**
 * FeedbackWidget Component
 * =========================
 * 
 * Main widget UI: a feedback form with star rating and comment.
 * 
 * Features:
 * - Star rating (1-5)
 * - Optional comment
 * - Shows user info from ID token
 * - Submits to widget backend with access token
 */

import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { submitFeedback } from '../api/client';
import { UserBadge } from './UserBadge';
import type { WidgetEvent } from 'shared';

interface FeedbackWidgetProps {
  /** Theme variant */
  theme?: 'light' | 'dark';
  /** Callback for widget events (passed from host) */
  onEvent?: (event: WidgetEvent) => void;
}

type SubmitState = 'idle' | 'submitting' | 'success' | 'error';

export function FeedbackWidget({ theme = 'light', onEvent }: FeedbackWidgetProps) {
  const { isAuthenticated } = useAuth();
  
  // Form state
  const [rating, setRating] = useState<number>(0);
  const [hoveredRating, setHoveredRating] = useState<number>(0);
  const [comment, setComment] = useState('');
  const [submitState, setSubmitState] = useState<SubmitState>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (rating === 0) {
      setErrorMessage('Please select a rating');
      return;
    }
    
    setSubmitState('submitting');
    setErrorMessage('');
    
    try {
      const response = await submitFeedback({
        rating,
        comment: comment.trim() || undefined,
      });
      
      console.log('✅ Feedback submitted:', response.feedback);
      setSubmitState('success');
      
      // Notify host app
      onEvent?.({
        type: 'FEEDBACK_SUBMITTED',
        payload: { rating, comment: comment.trim() },
      });
      
      // Reset form after delay
      setTimeout(() => {
        setRating(0);
        setComment('');
        setSubmitState('idle');
      }, 3000);
      
    } catch (error) {
      console.error('❌ Failed to submit feedback:', error);
      setSubmitState('error');
      setErrorMessage(
        error instanceof Error ? error.message : 'Failed to submit feedback'
      );
      
      // Notify host app of error
      onEvent?.({
        type: 'ERROR',
        payload: { 
          message: error instanceof Error ? error.message : 'Submission failed',
          code: 'SUBMIT_ERROR',
        },
      });
    }
  };
  
  // Render star rating
  const renderStars = () => {
    return (
      <div className="widget-flex widget-gap-1">
        {[1, 2, 3, 4, 5].map((star) => {
          const isActive = star <= (hoveredRating || rating);
          
          return (
            <button
              key={star}
              type="button"
              className="widget-star-button widget-p-1 widget-rounded focus:widget-outline-none focus:widget-ring-2 focus:widget-ring-widget-primary focus:widget-ring-offset-1"
              onMouseEnter={() => setHoveredRating(star)}
              onMouseLeave={() => setHoveredRating(0)}
              onClick={() => setRating(star)}
              aria-label={`Rate ${star} out of 5`}
            >
              <svg
                className={`widget-w-8 widget-h-8 widget-transition-colors ${
                  isActive 
                    ? 'widget-text-yellow-400' 
                    : 'widget-text-gray-300'
                }`}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </button>
          );
        })}
      </div>
    );
  };
  
  // Success state
  if (submitState === 'success') {
    return (
      <div className={`
        widget-container widget-p-6 widget-rounded-xl widget-shadow-widget
        ${theme === 'dark' ? 'widget-bg-gray-800' : 'widget-bg-white'}
        widget-animate-fade-in
      `}>
        <div className="widget-flex widget-flex-col widget-items-center widget-py-4">
          <div className="widget-w-16 widget-h-16 widget-rounded-full widget-bg-green-100 widget-flex widget-items-center widget-justify-center widget-mb-4">
            <svg 
              className="widget-w-8 widget-h-8 widget-text-green-500" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M5 13l4 4L19 7" 
              />
            </svg>
          </div>
          <h3 className={`widget-text-lg widget-font-semibold widget-mb-2 ${
            theme === 'dark' ? 'widget-text-white' : 'widget-text-gray-900'
          }`}>
            Thank you!
          </h3>
          <p className={`widget-text-sm ${
            theme === 'dark' ? 'widget-text-gray-300' : 'widget-text-gray-600'
          }`}>
            Your feedback has been submitted.
          </p>
        </div>
      </div>
    );
  }
  
  return (
    <div className={`
      widget-container widget-p-6 widget-rounded-xl widget-shadow-widget
      ${theme === 'dark' ? 'widget-bg-gray-800' : 'widget-bg-white'}
      widget-animate-fade-in
    `}>
      {/* Header */}
      <div className="widget-flex widget-items-center widget-justify-between widget-mb-6">
        <h2 className={`widget-text-lg widget-font-semibold ${
          theme === 'dark' ? 'widget-text-white' : 'widget-text-gray-900'
        }`}>
          Send Feedback
        </h2>
        <UserBadge size="sm" />
      </div>
      
      {/* Auth status message */}
      {!isAuthenticated && (
        <div className="widget-mb-4 widget-p-3 widget-bg-blue-50 widget-border widget-border-blue-100 widget-rounded-lg">
          <p className="widget-text-xs widget-text-blue-700">
            💡 You're submitting as anonymous. Log in to the host app to submit with your account.
          </p>
        </div>
      )}
      
      {/* Feedback form */}
      <form onSubmit={handleSubmit} className="widget-space-y-4">
        {/* Rating */}
        <div>
          <label className={`widget-block widget-text-sm widget-font-medium widget-mb-2 ${
            theme === 'dark' ? 'widget-text-gray-200' : 'widget-text-gray-700'
          }`}>
            How would you rate your experience?
          </label>
          {renderStars()}
        </div>
        
        {/* Comment */}
        <div>
          <label 
            htmlFor="widget-comment"
            className={`widget-block widget-text-sm widget-font-medium widget-mb-2 ${
              theme === 'dark' ? 'widget-text-gray-200' : 'widget-text-gray-700'
            }`}
          >
            Additional comments (optional)
          </label>
          <textarea
            id="widget-comment"
            rows={3}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Tell us more about your experience..."
            className={`
              widget-w-full widget-px-3 widget-py-2 widget-rounded-lg widget-border
              widget-text-sm widget-resize-none
              focus:widget-outline-none focus:widget-ring-2 focus:widget-ring-widget-primary focus:widget-border-transparent
              ${theme === 'dark' 
                ? 'widget-bg-gray-700 widget-border-gray-600 widget-text-white widget-placeholder-gray-400' 
                : 'widget-bg-white widget-border-gray-300 widget-text-gray-900 widget-placeholder-gray-400'
              }
            `}
          />
        </div>
        
        {/* Error message */}
        {errorMessage && (
          <div className="widget-p-3 widget-bg-red-50 widget-border widget-border-red-100 widget-rounded-lg">
            <p className="widget-text-sm widget-text-red-700">{errorMessage}</p>
          </div>
        )}
        
        {/* Submit button */}
        <button
          type="submit"
          disabled={submitState === 'submitting' || rating === 0}
          className={`
            widget-w-full widget-py-2.5 widget-px-4 widget-rounded-lg widget-font-medium widget-text-sm
            widget-transition-colors widget-duration-200
            focus:widget-outline-none focus:widget-ring-2 focus:widget-ring-widget-primary focus:widget-ring-offset-2
            ${rating === 0
              ? 'widget-bg-gray-200 widget-text-gray-400 widget-cursor-not-allowed'
              : submitState === 'submitting'
                ? 'widget-bg-widget-primary/70 widget-text-white widget-cursor-wait'
                : 'widget-bg-widget-primary widget-text-white hover:widget-bg-widget-primary-hover'
            }
          `}
        >
          {submitState === 'submitting' ? (
            <span className="widget-flex widget-items-center widget-justify-center widget-gap-2">
              <svg 
                className="widget-animate-spin widget-h-4 widget-w-4" 
                fill="none" 
                viewBox="0 0 24 24"
              >
                <circle 
                  className="widget-opacity-25" 
                  cx="12" 
                  cy="12" 
                  r="10" 
                  stroke="currentColor" 
                  strokeWidth="4"
                />
                <path 
                  className="widget-opacity-75" 
                  fill="currentColor" 
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Submitting...
            </span>
          ) : (
            'Submit Feedback'
          )}
        </button>
      </form>
      
      {/* Footer */}
      <div className="widget-mt-4 widget-pt-4 widget-border-t widget-border-gray-100">
        <p className={`widget-text-xs widget-text-center ${
          theme === 'dark' ? 'widget-text-gray-400' : 'widget-text-gray-500'
        }`}>
          Powered by Widget Demo
        </p>
      </div>
    </div>
  );
}


