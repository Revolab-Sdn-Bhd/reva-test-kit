# syntax=docker.io/docker/dockerfile:1

# ======================================================
# Base
# ======================================================
FROM node:22-bookworm AS base
WORKDIR /app
ENV NODE_ENV=production

# Enable pnpm
RUN corepack enable

# ======================================================
# deps — install & compile native addons
# ======================================================
FROM base AS deps

# Build tools required for better-sqlite3
RUN apt-get update && apt-get install -y \
  python3 \
  make \
  g++ \
  libsqlite3-dev \
  && rm -rf /var/lib/apt/lists/*

COPY package.json pnpm-lock.yaml .npmrc* ./

RUN pnpm install --frozen-lockfile

# FORCE native build (guarantees .node exists)
RUN pnpm rebuild better-sqlite3

# Sanity check — fail early if binary missing
RUN ls node_modules/better-sqlite3/build/Release/better_sqlite3.node

# ======================================================
# builder — Next.js build
# ======================================================
FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build Next.js (standalone)
RUN pnpm run build

# ======================================================
# runner — production image
# ======================================================
FROM node:22-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production

# Non-root user
RUN groupadd --system --gid 1001 nodejs \
  && useradd --system --uid 1001 --gid nodejs nextjs

# Copy PRUNED, COMPILED deps
COPY --from=builder /app/node_modules ./node_modules

# Copy Next.js standalone output
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

EXPOSE 4000
USER nextjs

CMD ["node", "server.js"]
