# EmotionalChain Production Dockerfile
# Multi-stage build for optimized production container

# Build stage
FROM node:20-alpine AS builder

# Install security updates and build dependencies
RUN apk update && apk upgrade && \
    apk add --no-cache python3 make g++ git

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm ci --only=production && \
    npm cache clean --force

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Remove development dependencies
RUN npm prune --production

# Production stage
FROM node:20-alpine AS runtime

# Create non-root user
RUN addgroup -g 1000 emotionalchain && \
    adduser -u 1000 -G emotionalchain -s /bin/sh -D emotionalchain

# Install security updates and runtime dependencies
RUN apk update && apk upgrade && \
    apk add --no-cache dumb-init curl && \
    rm -rf /var/cache/apk/*

# Set working directory
WORKDIR /app

# Copy built application from builder stage
COPY --from=builder --chown=emotionalchain:emotionalchain /app/dist ./dist
COPY --from=builder --chown=emotionalchain:emotionalchain /app/node_modules ./node_modules
COPY --from=builder --chown=emotionalchain:emotionalchain /app/package*.json ./

# Copy configuration files
COPY --chown=emotionalchain:emotionalchain shared ./shared
COPY --chown=emotionalchain:emotionalchain contracts ./contracts

# Create necessary directories
RUN mkdir -p /app/data /app/logs /tmp/emotionalchain && \
    chown -R emotionalchain:emotionalchain /app/data /app/logs /tmp/emotionalchain

# Switch to non-root user
USER emotionalchain

# Expose ports
EXPOSE 3000 8000 8001 9090

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000
ENV P2P_LISTEN_PORT=8000
ENV WEBSOCKET_PORT=8001
ENV METRICS_PORT=9090

# Labels for metadata
LABEL org.opencontainers.image.title="EmotionalChain Validator"
LABEL org.opencontainers.image.description="Production EmotionalChain validator node with Proof of Emotion consensus"
LABEL org.opencontainers.image.vendor="EmotionalChain Foundation"
LABEL org.opencontainers.image.source="https://github.com/emotionalchain/validator"
LABEL org.opencontainers.image.licenses="MIT"

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["node", "dist/server/index.js"]