# Multi-stage Dockerfile for API Manager Backend Production
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files
COPY backend/package.json backend/package-lock.json* ./
RUN npm ci --only=production

# Build stage
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY backend/ .

# Generate Prisma client
RUN npx prisma generate

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8000

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nodejs

# Copy built application
COPY --from=builder --chown=nodejs:nodejs /app ./

# Switch to non-root user
USER nodejs

EXPOSE 8000

ENV PORT 8000
ENV HOSTNAME "0.0.0.0"

# Start the application
CMD ["node", "src/index.js"] 