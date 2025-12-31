# Multi-stage Dockerfile for Widget Backend + Frontend
# ========================================================
# This Dockerfile builds:
# 1. Shared package (contains auth constants, types, keys)
# 2. Widget frontend (React app bundled as IIFE)
# 3. Widget backend (Express server that serves frontend + API)

# ========================================================
# Stage 1: Build shared package
# ========================================================
FROM node:18-alpine AS shared-builder

WORKDIR /app

# Copy root package files and shared package
COPY package*.json ./
COPY tsconfig.base.json ./
COPY shared/package.json ./shared/
COPY shared/tsconfig.json ./shared/
COPY shared/src ./shared/src/

# Install dependencies and build shared
WORKDIR /app/shared
RUN npm ci
RUN npm run build

# ========================================================
# Stage 2: Build widget frontend
# ========================================================
FROM node:18-alpine AS frontend-builder

WORKDIR /app

# Copy root package files and tsconfig
COPY package*.json ./
COPY tsconfig.base.json ./

# Copy shared package (already built)
COPY --from=shared-builder /app/shared ./shared/

# Copy widget frontend
COPY widget/frontend/package.json ./widget/frontend/
COPY widget/frontend/tsconfig.json ./widget/frontend/
COPY widget/frontend/vite.config.ts ./widget/frontend/
COPY widget/frontend/tailwind.config.js ./widget/frontend/
COPY widget/frontend/postcss.config.js ./widget/frontend/
COPY widget/frontend/src ./widget/frontend/src/

# Install dependencies and build frontend
WORKDIR /app/widget/frontend
RUN npm ci
RUN npm run build

# The build output will be in /app/widget/frontend/dist/
# - widget.iife.js
# - widget.css

# ========================================================
# Stage 3: Build widget backend
# ========================================================
FROM node:18-alpine AS backend-builder

WORKDIR /app

# Copy root package files and tsconfig
COPY package*.json ./
COPY tsconfig.base.json ./

# Copy shared package (already built)
COPY --from=shared-builder /app/shared ./shared/

# Copy widget backend
COPY widget/backend/package.json ./widget/backend/
COPY widget/backend/tsconfig.json ./widget/backend/
COPY widget/backend/src ./widget/backend/src/

# Install dependencies and build backend
WORKDIR /app/widget/backend
RUN npm ci
RUN npm run build

# The build output will be in /app/widget/backend/dist/

# ========================================================
# Stage 4: Production image
# ========================================================
FROM node:18-alpine

WORKDIR /app

# Copy root package files
COPY package*.json ./

# Copy shared package (built)
COPY --from=shared-builder /app/shared/package.json ./shared/
COPY --from=shared-builder /app/shared/dist ./shared/dist/

# Copy widget backend (built)
COPY --from=backend-builder /app/widget/backend/package.json ./widget/backend/
COPY --from=backend-builder /app/widget/backend/dist ./widget/backend/dist/

# Copy widget frontend (built) - backend serves these static files
COPY --from=frontend-builder /app/widget/frontend/dist ./widget/frontend/dist/

# Install production dependencies only
WORKDIR /app/widget/backend
RUN npm ci --only=production

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001
USER nodejs

# Expose the backend port
EXPOSE 3002

# Set environment to production
ENV NODE_ENV=production

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3002/health', (r) => r.statusCode === 200 ? process.exit(0) : process.exit(1))"

# Start the backend server
CMD ["node", "dist/index.js"]

