# syntax=docker/dockerfile:1.7

FROM node:20-bullseye-slim AS base
ENV NODE_ENV=development
WORKDIR /repo
RUN corepack enable

FROM base AS builder
ENV NODE_ENV=development
WORKDIR /repo

# workspace root
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json turbo.json ./
# app manifests
COPY apps/web/package.json apps/web/package.json
COPY apps/socket/package.json apps/socket/package.json
# prisma schema
COPY prisma ./prisma
# rest of the repo
COPY . ./

# (optional) source scan
RUN echo "=== SCAN: looking for next/document or <Html> in /repo (source) ===" && \
    grep -R --line-number --color "next/document" /repo \
      --exclude-dir=node_modules --exclude-dir=.next --exclude-dir=dist || true && \
    grep -R --line-number --color "<Html>" /repo \
      --exclude-dir=node_modules --exclude-dir=.next --exclude-dir=dist || true

# install deps
RUN pnpm install --frozen-lockfile --prod=false

# prisma generate for this app
RUN pnpm --filter @apps/web prisma:generate

# IMPORTANT: build Next in production mode so Docker build succeeds
RUN NODE_ENV=production pnpm --filter @apps/web build

# ------------------ runtime ------------------
FROM node:20-bullseye-slim AS runner
ENV NODE_ENV=development
WORKDIR /app

# standalone server
COPY --from=builder /repo/apps/web/.next/standalone ./
# static files
COPY --from=builder /repo/apps/web/.next/static ./apps/web/.next/static
# public assets
COPY --from=builder /repo/apps/web/public ./apps/web/public

# (we're NOT copying prisma engines here because the path isn't flat in pnpm)

EXPOSE 3000
CMD ["node", "apps/web/server.js"]
