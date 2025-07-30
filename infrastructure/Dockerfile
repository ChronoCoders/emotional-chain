# Multi-stage Dockerfile for EmotionalChain production deployment
FROM node:18-alpine AS builder

# Install system dependencies for biometric devices
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    git \
    bluetooth \
    bluez \
    bluez-libs \
    bluez-utils \
    libusb-dev \
    libudev-dev

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:18-alpine AS production

# Install runtime dependencies
RUN apk add --no-cache \
    curl \
    bluetooth \
    bluez \
    bluez-libs \
    bluez-utils \
    libusb \
    libudev \
    dumb-init

# Create app user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S emotionalchain -u 1001

# Set working directory
WORKDIR /app

# Copy built application
COPY --from=builder --chown=emotionalchain:nodejs /app/dist ./dist
COPY --from=builder --chown=emotionalchain:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=emotionalchain:nodejs /app/package.json ./

# Create necessary directories
RUN mkdir -p /app/data/logs /app/data/config /app/data/blockchain /app/data/backups && \
    chown -R emotionalchain:nodejs /app/data

# Expose ports
EXPOSE 8000 8001 8002

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Switch to non-root user
USER emotionalchain

# Use dumb-init for proper signal handling
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["node", "dist/index.js"]