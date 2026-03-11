# STP - Three Departments and Six Ministries Framework
# Dockerfile for single-machine deployment

# Stage 1: Build stage
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY src/ ./src/
COPY examples/ ./examples/

# Build TypeScript
RUN npm run build

# Stage 2: Production stage
FROM node:20-alpine

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production

# Copy built artifacts from builder stage
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/examples ./examples

# Copy configuration files
COPY --chown=nodejs:nodejs .env.example .env
COPY --chown=nodejs:nodejs docker-entrypoint.sh ./

# Set permissions
RUN chmod +x docker-entrypoint.sh

# Switch to non-root user
USER nodejs

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "const {STP} = require('./dist/index.js'); const stp = new STP({enableLogging: false}); console.log('STP Health Check:', stp.getStatus().framework); process.exit(0);" || exit 1

# Expose port (if running API server)
EXPOSE 3000

# Use dumb-init as entrypoint
ENTRYPOINT ["dumb-init", "--"]

# Default command
CMD ["./docker-entrypoint.sh"]