# syntax=docker.io/docker/dockerfile:1

# ------------------------
# Base image
# ------------------------
FROM node:22-alpine AS base
WORKDIR /app
ENV NODE_ENV=production

# Enable corepack (manages pnpm)
RUN corepack enable

# ------------------------
# Dependencies (build stage)
# ------------------------
FROM base AS deps

# Install build tools + SQLite headers for better-sqlite3
RUN apk add --no-cache libc6-compat python3 make g++ sqlite-dev

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml .npmrc* ./

# Install dependencies with pnpm
RUN pnpm install --frozen-lockfile

# ------------------------
# Builder stage (build Next.js app)
# ------------------------
FROM base AS builder
WORKDIR /app

# Copy node_modules from deps
COPY --from=deps /app/node_modules ./node_modules

# Copy source code
COPY . .

# Build Next.js with pnpm
RUN pnpm run build

# ------------------------
# Production Runner
# ------------------------
FROM base AS runner
WORKDIR /app

# Create non-root user
RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

# Copy Next.js standalone build
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Expose port
EXPOSE 4000

# Switch to non-root
USER nextjs

# Run Next.js standalone server
ENV HOSTNAME="0.0.0.0"
CMD ["node", "server.js"]
