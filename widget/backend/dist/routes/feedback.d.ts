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
export declare const feedbackRouter: import("express-serve-static-core").Router;
//# sourceMappingURL=feedback.d.ts.map