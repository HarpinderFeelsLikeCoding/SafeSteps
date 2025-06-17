# Multi-stage build for SafeStep hackathon project
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies with longer timeout
RUN npm ci --timeout=600000

# Copy source code
COPY . .

# Build the frontend
RUN npm run build:client

# Production stage
FROM node:20-alpine AS production

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies only with longer timeout
RUN npm ci --only=production --timeout=600000 && npm cache clean --force

# Copy built frontend
COPY --from=builder /app/dist ./dist

# Copy server code
COPY server ./server

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S safestep -u 1001

# Change ownership
RUN chown -R safestep:nodejs /app
USER safestep

# Expose port
EXPOSE 8080

# Set environment variables for Cloud Run
ENV NODE_ENV=production
ENV PORT=8080

# Health check with proper timeout
HEALTHCHECK --interval=30s --timeout=15s --start-period=60s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8080/api/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start the application with dumb-init for proper signal handling
CMD ["dumb-init", "node", "server/index.js"]