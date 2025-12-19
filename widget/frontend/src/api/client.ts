/**
 * Widget API Client
 * ==================
 * 
 * HTTP client for communicating with the widget backend.
 * Automatically attaches the access token to requests.
 */

import { SERVICE_URLS } from 'shared';
import type { FeedbackSubmission, FeedbackResponse, FeedbackItem } from 'shared';

// ===========================================
// Configuration
// ===========================================

const API_BASE_URL = SERVICE_URLS.WIDGET_BACKEND;

// Token storage (set by widget-api.ts or AuthContext)
let currentAccessToken: string | null = null;

/**
 * Set the access token to use for API requests.
 * Called by the widget initialization code.
 */
export function setApiAccessToken(token: string | null) {
  currentAccessToken = token;
}

/**
 * Get the current access token.
 */
export function getApiAccessToken(): string | null {
  return currentAccessToken;
}

// ===========================================
// HTTP Client
// ===========================================

interface ApiError {
  error: string;
  message: string;
  code?: string;
}

class ApiClientError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string
  ) {
    super(message);
    this.name = 'ApiClientError';
  }
}

/**
 * Make an authenticated API request.
 */
async function apiRequest<T>(
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  path: string,
  body?: unknown
): Promise<T> {
  const url = `${API_BASE_URL}${path}`;
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  // Add Authorization header if we have a token
  if (currentAccessToken) {
    headers['Authorization'] = `Bearer ${currentAccessToken}`;
  }
  
  console.log(`📤 API ${method} ${path}`, currentAccessToken ? '(authenticated)' : '(anonymous)');
  
  const response = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    const error = data as ApiError;
    console.error(`❌ API Error: ${response.status}`, error);
    throw new ApiClientError(
      error.message || 'API request failed',
      response.status,
      error.code
    );
  }
  
  console.log(`📥 API Response:`, data);
  return data as T;
}

// ===========================================
// Feedback API
// ===========================================

/**
 * Submit feedback to the widget backend.
 * 
 * @param submission - The feedback data (rating and optional comment)
 * @returns The created feedback item with user info from JWT
 */
export async function submitFeedback(submission: FeedbackSubmission): Promise<FeedbackResponse> {
  return apiRequest<FeedbackResponse>('POST', '/api/feedback', submission);
}

/**
 * Get all feedback (for demo purposes).
 */
export async function getAllFeedback(): Promise<{ feedback: FeedbackItem[] }> {
  return apiRequest<{ feedback: FeedbackItem[] }>('GET', '/api/feedback');
}

/**
 * Get feedback submitted by the current user.
 * Requires authentication.
 */
export async function getMyFeedback(): Promise<{ feedback: FeedbackItem[] }> {
  return apiRequest<{ feedback: FeedbackItem[] }>('GET', '/api/feedback/me');
}

// ===========================================
// Health Check
// ===========================================

/**
 * Check if the widget backend is healthy.
 */
export async function healthCheck(): Promise<{ status: string }> {
  const response = await fetch(`${API_BASE_URL}/health`);
  return response.json();
}


