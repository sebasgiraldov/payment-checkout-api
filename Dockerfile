# Multi-stage Dockerfile for Payment Checkout API
# Stage 1: Builder - Install dependencies and build application
FROM node:18-alpine AS builder

# Install OpenSSL (required by Prisma) and other necessary packages
RUN apk add --no-cache openssl libc6-compat

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install all dependencies (including dev dependencies for build)
RUN npm ci

# Generate Prisma Client (without requiring DATABASE_URL)
RUN npx prisma generate

# Copy source code
COPY . .

# Build TypeScript application
RUN npm run build

# Stage 2: Production - Create minimal production image
FROM node:18-alpine AS production

# Install OpenSSL (required by Prisma at runtime)
RUN apk add --no-cache openssl libc6-compat

# Set working directory
WORKDIR /app

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install only production dependencies
RUN npm ci --only=production && \
    npm cache clean --force

# Copy Prisma Client from builder (already generated)
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist

# Change ownership of all files to nodejs user
RUN chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose application port
EXPOSE 3000

# Health check configuration
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Run migrations and start application
# DATABASE_URL will be available at runtime from Railway
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]
