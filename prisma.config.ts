import { config as loadEnv } from "dotenv";
import { resolve } from "node:path";
import { defineConfig, env } from "prisma/config";

// This file lives at the repository root, next to `.env`.
// Web Prisma scripts run with cwd `apps/web`, so load the root file explicitly.
// Existing process env (Docker build args, CI) is left unchanged.
loadEnv({ path: resolve(__dirname, ".env") });

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: process.env.DATABASE_URL
  },
});
