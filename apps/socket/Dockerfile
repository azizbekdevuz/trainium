# syntax=docker/dockerfile:1.7

FROM node:20-bullseye-slim AS base
ENV NODE_ENV=production
WORKDIR /app
RUN corepack enable

# Install only socket service deps from workspace lockfile
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/socket/package.json ./apps/socket/package.json
COPY packages/logging/package.json ./packages/logging/package.json
COPY packages/logging/index.js ./packages/logging/index.js
COPY packages/logging/index.d.ts ./packages/logging/index.d.ts
RUN pnpm -w install --filter @apps/socket --prod --frozen-lockfile

# Copy source and start
COPY apps/socket/src ./apps/socket/src
EXPOSE 4000
CMD ["node", "apps/socket/src/index.js"]


