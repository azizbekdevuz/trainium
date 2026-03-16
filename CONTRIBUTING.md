# Contributing to Trainium

Thank you for your interest in contributing to Trainium, a modern e-commerce platform for high-tech fitness equipment. This document provides guidelines and instructions for contributing effectively.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Testing](#testing)
- [Project Structure](#project-structure)

## Code of Conduct

This project adheres to the [Contributor Covenant Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code. Please report unacceptable behavior to the project maintainers.

## Getting Started

### Prerequisites

- **Node.js** 18+ (20 recommended; see `.nvmrc`)
- **pnpm** 9.0.6+
- **PostgreSQL** database
- **Docker** (optional, for containerized development)

### Setup

1. **Fork and clone the repository**
   ```bash
   git clone https://github.com/YOUR_USERNAME/trainium.git
   cd trainium
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your local configuration
   ```

4. **Generate Prisma client and push schema**
   ```bash
   pnpm --filter @apps/web prisma:generate
   pnpm --filter @apps/web prisma:push
   ```

5. **Start development servers**
   ```bash
   pnpm dev
   ```
   - Web app: http://localhost:3000
   - Socket server: http://localhost:4000

## Development Workflow

### Monorepo Structure

Trainium uses **Turbo** and **pnpm workspaces**:

- `apps/web` — Next.js 15 web application
- `apps/socket` — Socket.IO server for real-time notifications
- `prisma/` — Shared database schema

### Key Commands

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start all services (web + socket) |
| `pnpm dev:web` | Start Next.js dev server only |
| `pnpm dev:socket` | Start Socket.IO server only |
| `pnpm build` | Build all applications |
| `pnpm lint` | Lint all code |
| `pnpm lint:fix` | Lint and auto-fix |
| `pnpm typecheck` | TypeScript type checking |
| `pnpm --filter @apps/web test` | Run Vitest tests |
| `pnpm --filter @apps/web prisma:studio` | Open Prisma Studio |

### Before Submitting

Ensure all checks pass locally:

```bash
pnpm lint
pnpm typecheck
pnpm --filter @apps/web test
```

CI runs these same checks on every push and pull request to `main`.

## Pull Request Process

1. **Create a branch** from `main`
   ```bash
   git checkout -b feat/your-feature-name
   # or fix/bug-description
   ```

2. **Make your changes** following our [coding standards](#coding-standards)

3. **Run quality checks** (lint, typecheck, test)

4. **Commit with clear messages**
   - Use present tense: "Add cart merge logic" not "Added cart merge logic"
   - Reference issues when applicable: "Fix #123"

5. **Open a pull request** using our [PR template](.github/PULL_REQUEST_TEMPLATE.md)
   - Fill out all sections
   - Link related issues
   - Ensure CI passes

6. **Address review feedback** promptly

7. **Squash or rebase** if requested by maintainers before merge

## Coding Standards

### TypeScript & JavaScript

- **TypeScript** is used in `apps/web`; **JavaScript** in `apps/socket`
- Avoid `any` when possible; use `unknown` or proper types
- Use `const` over `let`; avoid `var`
- Prefer named exports for utilities and components

### Linting

- ESLint 9 (flat config) with TypeScript ESLint
- Next.js rules apply to `apps/web`
- Run `pnpm lint:fix` to auto-fix where possible

### File Organization

- **Components**: `apps/web/src/components/` (grouped by feature: admin, cart, checkout, product, nav, ui)
- **API routes**: `apps/web/src/app/api/`
- **Business logic**: `apps/web/src/lib/`
- **Types**: `apps/web/src/types/`
- **Hooks**: `apps/web/src/hooks/`

### Conventions

- Use **Zod** for API input validation
- Use **React Hook Form** for form state
- Use **Server Components** where possible; Client Components only when needed (interactivity, hooks)
- Follow existing patterns for auth (`requireAdminSession`), cart, checkout, and notifications

## Testing

- **Framework**: Vitest
- **Location**: `apps/web/src/**/*.test.ts` and `*.test.tsx`
- **Run**: `pnpm --filter @apps/web test`
- **Watch mode**: `pnpm --filter @apps/web test:watch`

Add tests for:
- New utility functions
- Critical business logic (cart merge, checkout, auth)
- Path safety and validation helpers

## Project Structure

```
trainium/
├── apps/
│   ├── web/           # Next.js app (App Router, API routes)
│   └── socket/        # Socket.IO server
├── prisma/            # Database schema
├── scripts/           # Build/utility scripts
├── .github/           # CI, issue/PR templates
├── CONTRIBUTING.md    # This file
├── CODE_OF_CONDUCT.md
├── SECURITY.md
└── LICENSE
```

For architecture details, see [architecture.md](architecture.md).

## Questions?

- Open a [GitHub Discussion](https://github.com/azizbekdevuz/trainium/discussions) for questions
- Use [GitHub Issues](https://github.com/azizbekdevuz/trainium/issues) for bugs and feature requests
- See [SECURITY.md](SECURITY.md) for reporting security vulnerabilities

Thank you for contributing to Trainium!
