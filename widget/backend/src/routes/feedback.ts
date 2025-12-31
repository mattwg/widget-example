/**
 * Feedback API Routes
 * ====================
 * 
 * Handles feedback submissions from the widget.
 * Demonstrates JWT-authenticated API endpoints.
 * 
 * Key Security Principle:
 * -----------------------
 * User identity comes from the VERIFIED JWT, never from the request body!
 * This is why we use req.user (set by auth middleware) instead of
 * trusting any user data sent by the client.
 */

import { Router, Request, Response } from 'express';
import type { FeedbackItem, FeedbackSubmission, FeedbackResponse } from 'shared';

export const feedbackRouter = Router();

// ===========================================
// In-Memory "Database" (Demo Only)
// ===========================================
// In production, you'd use a real database.

const feedbackStore: FeedbackItem[] = [];

/**
 * Generate a simple unique ID (demo only)
 */
function generateId(): string {
  return `feedback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// ===========================================
// POST /api/feedback
// ===========================================
/**
 * Submit new feedback.
 * 
 * Accepts both authenticated and anonymous users.
 * User identity is extracted from verified JWT, NOT from request body.
 * 
 * Request Body:
 * {
 *   "rating": 5,        // Required: 1-5
 *   "comment": "Great!" // Optional
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "feedback": { ...submitted feedback with user info }
 * }
 */
feedbackRouter.post('/feedback', async (req: Request, res: Response) => {
  try {
    const { rating, comment } = req.body as FeedbackSubmission;
    
    // Validate rating
    if (typeof rating !== 'number' || rating < 1 || rating > 5) {
      res.status(400).json({
        error: 'Validation failed',
        message: 'Rating must be a number between 1 and 5',
      });
      return;
    }
    
    // ===========================================
    // SECURITY: User identity from verified JWT
    // ===========================================
    // We get user info from req.user (set by auth middleware)
    // This data is trustworthy because:
    // 1. The JWT signature was verified
    // 2. The issuer and audience were validated
    // 3. The token hasn't expired
    //
    // NEVER trust user data sent in the request body!
    
    const userId = req.user?.sub || 'anonymous';
    const userName = req.user ? `User ${req.user.sub.split('|')[1]?.slice(0, 8) || req.user.sub}` : 'Anonymous';
    
    // Create feedback item
    const feedback: FeedbackItem = {
      id: generateId(),
      rating,
      comment: comment || undefined,
      userId,
      userName,
      createdAt: new Date().toISOString(),
    };
    
    // Store feedback
    feedbackStore.push(feedback);
    
    console.log('📝 Feedback submitted:');
    console.log(`   ID: ${feedback.id}`);
    console.log(`   Rating: ${feedback.rating}/5`);
    console.log(`   User: ${feedback.userName} (${feedback.userId})`);
    console.log(`   Authenticated: ${req.isAuthenticated}`);
    
    const response: FeedbackResponse = {
      success: true,
      feedback,
    };
    
    res.status(201).json(response);
  } catch (error) {
    console.error('Error submitting feedback:', error);
    res.status(500).json({
      error: 'Failed to submit feedback',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// ===========================================
// GET /api/feedback
// ===========================================
/**
 * Get all feedback (for demo/testing purposes).
 * 
 * In production, you'd:
 * - Add pagination
 * - Filter by user (only show user's own feedback)
 * - Require authentication
 * - Add proper authorization checks
 */
feedbackRouter.get('/feedback', async (_req: Request, res: Response) => {
  try {
    // Return all feedback (newest first)
    const sortedFeedback = [...feedbackStore].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    
    res.json({
      success: true,
      count: sortedFeedback.length,
      feedback: sortedFeedback,
    });
  } catch (error) {
    console.error('Error fetching feedback:', error);
    res.status(500).json({
      error: 'Failed to fetch feedback',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// ===========================================
// GET /api/feedback/me
// ===========================================
/**
 * Get feedback submitted by the authenticated user.
 * Requires authentication.
 */
feedbackRouter.get('/feedback/me', async (req: Request, res: Response) => {
  if (!req.isAuthenticated || !req.user) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required to view your feedback',
    });
    return;
  }
  
  try {
    const userFeedback = feedbackStore.filter(f => f.userId === req.user!.sub);
    
    res.json({
      success: true,
      count: userFeedback.length,
      feedback: userFeedback,
    });
  } catch (error) {
    console.error('Error fetching user feedback:', error);
    res.status(500).json({
      error: 'Failed to fetch feedback',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});




