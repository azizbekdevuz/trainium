# syntax=docker/dockerfile:1.7

FROM node:20-bullseye-slim AS base
ENV NODE_ENV=production
WORKDIR /repo
RUN corepack enable

# --- Install deps and build (workspace root) ---
FROM base AS builder
WORKDIR /repo
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json turbo.json ./
COPY apps/web/package.json apps/web/package.json
COPY apps/socket/package.json apps/socket/package.json
COPY prisma ./prisma
COPY . ./
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @apps/web prisma:generate
RUN pnpm --filter @apps/web build

# --- Runtime: Next.js standalone output ---
FROM node:20-bullseye-slim AS runner
ENV NODE_ENV=production
WORKDIR /app

# Copy Next standalone server and static assets
COPY --from=builder /repo/apps/web/.next/standalone ./
COPY --from=builder /repo/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder /repo/apps/web/public ./apps/web/public

EXPOSE 3000
CMD ["node", "apps/web/server.js"]


