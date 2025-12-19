/**
 * Widget Backend API Server
 * ==========================
 *
 * This is the backend service for the embeddable widget.
 * It provides:
 * - JWKS endpoint (simulates Auth0's public key endpoint)
 * - Feedback API with JWT authentication
 *
 * IN PRODUCTION WITH AUTH0:
 * -------------------------
 * - Remove the JWKS endpoint (Auth0 provides this)
 * - Update JWKS_URI in config to point to Auth0
 * - Everything else stays the same!
 */
import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { SERVICE_URLS } from 'shared';
import { jwksRouter } from './routes/jwks.js';
import { feedbackRouter } from './routes/feedback.js';
import { authenticateToken } from './middleware/auth.js';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const app = express();
const PORT = 3002;
// ===========================================
// CORS Configuration
// ===========================================
// Allow requests from:
// - Host app (localhost:3000)
// - Widget frontend dev mode (localhost:3001)
// - Any origin (for demo flexibility)
app.use(cors({
    origin: [
        SERVICE_URLS.HOST_APP,
        SERVICE_URLS.WIDGET_FRONTEND_DEV,
        // In production, you'd whitelist specific domains:
        // 'https://your-app.com',
        // 'https://your-widget-cdn.com',
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));
// Parse JSON bodies
app.use(express.json());
// ===========================================
// Health Check
// ===========================================
app.get('/health', (_req, res) => {
    res.json({ status: 'healthy', service: 'widget-backend' });
});
// ===========================================
// JWKS Endpoint (Mock Auth0)
// ===========================================
// ⚠️ DEMO ONLY: In production with Auth0, this endpoint would be
// provided by Auth0 at https://YOUR_DOMAIN.auth0.com/.well-known/jwks.json
// You would NOT host your own JWKS endpoint.
app.use(jwksRouter);
// ===========================================
// Protected API Routes
// ===========================================
// All routes under /api require JWT authentication
app.use('/api', authenticateToken, feedbackRouter);
// ===========================================
// Serve Widget Static Assets
// ===========================================
// In production, you might serve these from a CDN instead.
// The widget frontend build outputs to ../frontend/dist/
const widgetDistPath = join(__dirname, '../../frontend/dist');
app.use('/widget', express.static(widgetDistPath));
console.log(`📁 Serving widget assets from: ${widgetDistPath}`);
// ===========================================
// Error Handling
// ===========================================
app.use((err, _req, res, _next) => {
    console.error('Server error:', err);
    res.status(500).json({
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined,
    });
});
// ===========================================
// Start Server
// ===========================================
app.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════════════════════════════╗
║                    Widget Backend Server                        ║
╠════════════════════════════════════════════════════════════════╣
║                                                                  ║
║  🚀 Server running at http://localhost:${PORT}                    ║
║                                                                  ║
║  Endpoints:                                                      ║
║  ──────────────────────────────────────────────────────────────  ║
║  GET  /.well-known/jwks.json  - JWKS endpoint (mock Auth0)      ║
║  POST /api/feedback           - Submit feedback (requires JWT)   ║
║  GET  /api/feedback           - Get all feedback (requires JWT)  ║
║  GET  /health                 - Health check                     ║
║                                                                  ║
║  ⚠️  Note: JWKS endpoint simulates Auth0's endpoint.             ║
║      In production, use Auth0's actual JWKS URL.                 ║
║                                                                  ║
╚════════════════════════════════════════════════════════════════╝
`);
});
//# sourceMappingURL=index.js.map