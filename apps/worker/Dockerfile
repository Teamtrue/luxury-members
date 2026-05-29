# ── Build stage ──────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy manifests first (layer cache)
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/worker/package.json         ./apps/worker/
COPY packages/shared/package.json     ./packages/shared/
COPY packages/db/package.json         ./packages/db/

RUN pnpm install --frozen-lockfile --ignore-scripts

# Copy source
COPY apps/worker/   ./apps/worker/
COPY packages/      ./packages/
COPY tsconfig.json  ./

# Type-check worker
RUN pnpm --filter @plutusclub/worker exec tsc --noEmit

# ── Production stage ──────────────────────────────────────────────────────────
FROM node:20-alpine AS runner

ENV NODE_ENV=production

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

# Only production deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/worker/package.json         ./apps/worker/
COPY packages/shared/package.json     ./packages/shared/
COPY packages/db/package.json         ./packages/db/

RUN pnpm install --frozen-lockfile --ignore-scripts --prod

# Copy compiled source (tsx runs TS directly in production via --import tsx/esm)
COPY --from=builder /app/apps/worker/  ./apps/worker/
COPY --from=builder /app/packages/     ./packages/

# Non-root user for security
RUN addgroup --system --gid 1001 worker && \
    adduser  --system --uid 1001 worker
USER worker

HEALTHCHECK --interval=30s --timeout=10s --start-period=20s --retries=3 \
  CMD node -e "require('ioredis'); process.exit(0)" || exit 1

CMD ["node", "--import", "tsx/esm", "apps/worker/src/index.ts"]
