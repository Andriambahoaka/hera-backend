# syntax=docker/dockerfile:1

# ---------- Build stage ----------
FROM node:24-alpine AS builder
WORKDIR /app

# Toolchain for native modules (bcrypt has no prebuilt binary for Node 24 + musl).
RUN apk add --no-cache python3 make g++

COPY package.json package-lock.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# Keep only production dependencies (already compiled) for the runtime image.
RUN npm prune --omit=dev


# ---------- Runtime stage ----------
FROM node:24-alpine
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder --chown=node:node /app/node_modules ./node_modules
COPY --from=builder --chown=node:node /app/dist ./dist
COPY --chown=node:node package.json ./
COPY --chown=node:node public ./public

# Run as the unprivileged user shipped with the node image.
USER node

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- "http://127.0.0.1:${PORT:-3000}/healthz" || exit 1

# Run node directly (not through npm) so SIGTERM reaches the process
# and the graceful shutdown in server.ts runs.
CMD ["node", "dist/server.js"]
