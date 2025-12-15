# syntax=docker.io/docker/dockerfile:1

FROM node:22-bookworm AS base
WORKDIR /app
ENV NODE_ENV=production
RUN corepack enable

# ------------------------
# deps (compile native)
# ------------------------
FROM base AS deps

RUN apt-get update && apt-get install -y \
  python3 \
  make \
  g++ \
  && rm -rf /var/lib/apt/lists/*

COPY package.json pnpm-lock.yaml .npmrc* ./

# IMPORTANT: do NOT use --ignore-scripts
RUN pnpm install --frozen-lockfile

RUN ls node_modules/better-sqlite3/build/Release

# ------------------------
# builder
# ------------------------
FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN pnpm run build

# ✅ prune ONLY after build
RUN pnpm prune --prod && pnpm store prune

# ------------------------
# runner
# ------------------------
FROM node:22-bookworm AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN groupadd --system --gid 1001 nodejs \
  && useradd --system --uid 1001 --gid nodejs nextjs

# ✅ copy pruned + compiled node_modules
COPY --from=builder /app/node_modules ./node_modules

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

EXPOSE 4000
USER nextjs
CMD ["node", "server.js"]
