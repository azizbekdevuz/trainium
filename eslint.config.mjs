// eslint.config.mjs
import js from "@eslint/js";
import typescriptEslint from "typescript-eslint";
import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const compat = new FlatCompat({ baseDirectory: __dirname });

export default [
  // 1) Global base (NO Next/React here)
  js.configs.recommended,
  ...typescriptEslint.configs.recommended,

  // 2) Global ignores
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "dist/**",
      "*.config.js",
      "*.config.mjs",
      "*.config.ts",
      "prisma/**",
      "public/**",
      "*.d.ts",
      "next-env.d.ts",
      "tsconfig.tsbuildinfo",
      "pnpm-lock.yaml",
      "turbo.json",
      "apps/web/.next/**",
      "apps/web/out/**",
      "apps/web/build/**",
    ],
  },

  // 3) Global TypeScript file rules
  {
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      parser: typescriptEslint.parser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        ecmaFeatures: { jsx: true },
      },
    },
    rules: {
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
      "no-debugger": "error",
      "prefer-const": "error",
      "no-var": "error",

      // relaxed toggles for current codebase
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-var-requires": "warn",
      "@typescript-eslint/no-empty-object-type": "off",
      "@typescript-eslint/triple-slash-reference": "off",
      "@typescript-eslint/no-require-imports": "warn",
      "@typescript-eslint/no-unsafe-function-type": "off",
      "no-console": "off",
      "no-empty": "warn",
      "no-prototype-builtins": "warn",
    },
  },

  // 4) Global JS file rules
  {
    files: ["**/*.js", "**/*.mjs"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
    },
    rules: {
      "no-console": "off",
      "no-debugger": "error",
      "prefer-const": "error",
      "no-var": "error",
      "no-empty": "warn",
    },
  },

  // 5) NEXT/REACT **ONLY** for apps/web
  // Use flat-compat to bring Next configs **scoped to web**
  ...compat
    .extends("next/core-web-vitals", "next/typescript")
    .map((cfg) => ({
      ...cfg,
      files: ["apps/web/**/*.{ts,tsx,js,mjs}"],
    })),
  {
    files: ["apps/web/**/*.{ts,tsx,js,mjs}"],
    settings: { react: { version: "detect" } },
    rules: {
      // Next.js specific rules
      "@next/next/no-img-element": "error",
      "@next/next/no-html-link-for-pages": "error",
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
      "react/no-unescaped-entities": "error",
      "react/jsx-key": "error",
      
      // Override TypeScript rules that are too strict for this codebase
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-empty-object-type": "off",
      "@typescript-eslint/triple-slash-reference": "off",
      "@typescript-eslint/no-unsafe-function-type": "off",
    },
  },

  // 6) NODE/SOCKET **ONLY** for apps/socket
  {
    files: ["apps/socket/**/*.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        process: "readonly",
        Buffer: "readonly",
        __dirname: "readonly",
        __filename: "readonly",
        global: "readonly",
        console: "readonly",
        module: "readonly",
        require: "readonly",
        exports: "readonly",
      },
    },
    rules: {
      "no-console": "off",
      "no-debugger": "error",
      "prefer-const": "error",
      "no-var": "error",
    },
  },
];