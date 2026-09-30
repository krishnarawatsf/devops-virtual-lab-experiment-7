# Multi-stage lightweight production Dockerfile
FROM node:20-alpine AS builder

WORKDIR /usr/src/app

# Install dependencies first for layer caching
COPY package*.json ./
RUN npm ci --only=production

# Application source code
COPY . .

# Final runtime image
FROM node:20-alpine AS runner

WORKDIR /usr/src/app

ENV NODE_ENV=production \
    PORT=8080

# Security: Run as non-root user
USER node

# Copy artifacts from builder
COPY --chown=node:node --from=builder /usr/src/app ./

EXPOSE 8080

# Container Healthcheck
HEALTHCHECK --interval=15s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:8080/api/health/live || exit 1

CMD ["node", "server.js"]
