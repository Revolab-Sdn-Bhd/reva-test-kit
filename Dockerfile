# syntax=docker.io/docker/dockerfile:1

# ------------------------
# Base image
# ------------------------
FROM node:22-bookworm AS base
WORKDIR /app
ENV NODE_ENV=production

# Enable pnpm via corepack
RUN corepack enable

# ------------------------
# Dependencies (build deps)
# ------------------------
FROM base AS deps

# Install native build dependencies for better-sqlite3
RUN apt-get update && apt-get install -y \
  python3 \
  make \
  g++ \
  && rm -rf /var/lib/apt/lists/*

# Copy dependency files
COPY package.json pnpm-lock.yaml .npmrc* ./

# Install deps (native addons compiled here)
RUN pnpm install --frozen-lockfile

# ------------------------
# Builder (Next.js build)
# ------------------------
FROM base AS builder
WORKDIR /app

# Reuse node_modules with native binaries
COPY --from=deps /app/node_modules ./node_modules

# Copy source
COPY . .

# Build Next.js (standalone)
RUN pnpm run build

# ------------------------
# Production runner
# ------------------------
FROM base AS runner
WORKDIR /app

# Create non-root user
RUN groupadd --system --gid 1001 nodejs \
  && useradd --system --uid 1001 --gid nodejs nextjs

# IMPORTANT:
# Copy node_modules so native binaries exist at runtime
COPY --from=deps /app/node_modules ./node_modules

# Copy standalone output
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Expose app port
EXPOSE 4000

# Switch to non-root
USER nextjs

ENV HOSTNAME="0.0.0.0"

# Next.js standalone entry
CMD ["node", "server.js"]
