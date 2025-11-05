# syntax=docker/dockerfile:1.7

FROM node:20-bullseye-slim AS base
ENV NODE_ENV=production
WORKDIR /repo
RUN corepack enable

# --- Install deps and build (workspace root) ---
FROM base AS builder
ENV NODE_ENV=development
WORKDIR /repo
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json turbo.json ./
COPY apps/web/package.json apps/web/package.json
COPY apps/socket/package.json apps/socket/package.json
COPY prisma ./prisma
COPY . ./
RUN pnpm install --frozen-lockfile --prod=false
RUN pnpm --filter @apps/web prisma:generate
RUN pnpm --filter @apps/web build
RUN echo "=== DEBUG: searching for next/document in container ===" && \
    grep -R --line-number --color "next/document" . \
      --exclude-dir=node_modules \
      --exclude-dir=.next \
      --exclude-dir=dist \
      || true


# --- Runtime: Next.js standalone output ---
FROM node:20-bullseye-slim AS runner
ENV NODE_ENV=production
WORKDIR /app

# Copy Next standalone server and static assets
COPY --from=builder /repo/apps/web/.next/standalone ./
COPY --from=builder /repo/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder /repo/apps/web/public ./apps/web/public
# Ensure Prisma engines are available at runtime
COPY --from=builder /repo/apps/web/node_modules/.prisma ./apps/web/node_modules/.prisma

EXPOSE 3000
CMD ["node", "apps/web/server.js"]


