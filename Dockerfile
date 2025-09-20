# Multi-stage Dockerfile for RideShare Backend
FROM node:18-alpine AS base

# Install dependencies needed for native modules
RUN apk add --no-cache python3 make g++ curl

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Development stage
FROM base AS development
RUN npm ci
COPY . .
EXPOSE 3000
CMD ["npm", "run", "dev"]

# Production build stage
FROM base AS production

# Copy application code
COPY . .

# Create uploads directory
RUN mkdir -p uploads logs

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs
RUN adduser -S rideshare -u 1001

# Change ownership of app directory
RUN chown -R rideshare:nodejs /app
USER rideshare

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

# Start application
CMD ["npm", "start"]