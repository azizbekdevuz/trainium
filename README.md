# Trainium E-Commerce Platform

A modern, full-stack e-commerce platform built for selling high-tech fitness equipment. Trainium features a comprehensive product catalog, shopping cart, checkout system, real-time notifications, and an admin panel for managing all aspects of the business.

## 🏗️ Architecture

For a comprehensive overview of the system architecture, design patterns, and implementation details, see the [Architecture Documentation](./architecture.md).

## ✨ Features

- **E-Commerce Core**
  - Product catalog with variants, categories, and inventory management
  - Shopping cart with guest and authenticated user support
  - Multi-provider payment processing (Stripe, Toss Payments)
  - Order management and tracking
  - Product recommendations engine

- **User Management**
  - Multi-provider authentication (Google, Kakao, Email/Password)
  - Role-based access control (Admin, Staff, Customer)
  - User profiles and account management

- **Real-Time Features**
  - Socket.IO-based notification system
  - Real-time order updates
  - Product alerts and system notifications

- **Admin Panel**
  - Dashboard with analytics and statistics
  - Product, order, and customer management
  - Category and FAQ management
  - Low stock alerts and inventory tracking

- **Social Features**
  - Product reviews and ratings
  - Favorites and likes
  - Review replies and interactions

- **Internationalization**
  - Multi-language support (English, Korean, Uzbek)
  - URL-based locale routing
  - Translated email notifications

## 🛠️ Tech Stack

- **Frontend**: Next.js 15.5, React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Express.js
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js 5.0
- **Real-Time**: Socket.IO
- **Payments**: Stripe, Toss Payments
- **Email**: Resend
- **Build System**: Turbo (Monorepo)
- **Package Manager**: pnpm

## 📁 Project Structure

```
trainium/
├── apps/
│   ├── web/              # Next.js web application
│   └── socket/            # Socket.IO server
├── apps/packages/
│   ├── shared/            # Shared utilities
│   └── tsconfig/          # Shared TypeScript configs
├── prisma/                # Database schema
├── scripts/               # Build scripts
└── architecture.md       # Architecture documentation
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- pnpm 9.0.6+
- PostgreSQL database
- Docker (optional, for containerized deployment)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd trainium
```

2. Install dependencies:
```bash
pnpm install
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

Required environment variables:
- `DATABASE_URL`: PostgreSQL connection string
- `AUTH_SECRET`: NextAuth secret key
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`: Google OAuth credentials
- `KAKAO_CLIENT_ID` / `KAKAO_CLIENT_SECRET`: Kakao OAuth credentials
- `STRIPE_SECRET_KEY` / `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`: Stripe credentials
- `TOSS_CLIENT_KEY` / `TOSS_SECRET_KEY`: Toss Payments credentials
- `RESEND_API_KEY`: Resend email service key
- `NEXTAUTH_URL`: Application URL
- `SOCKET_ADMIN_SECRET`: Socket server admin secret

4. Set up the database:
```bash
# Generate Prisma client
pnpm --filter @apps/web prisma:generate

# Run migrations (or push schema)
pnpm --filter @apps/web prisma:push
```

5. Start development servers:
```bash
# Start both web and socket servers
pnpm dev

# Or start individually
pnpm dev:web      # Web app on http://localhost:3000
pnpm dev:socket   # Socket server on http://localhost:4000
```

## 📝 Available Scripts

### Root Level
- `pnpm dev` - Start all services in development mode
- `pnpm build` - Build all applications
- `pnpm start` - Start all services in production mode
- `pnpm lint` - Lint all code
- `pnpm typecheck` - Type check all TypeScript code

### Web Application
- `pnpm dev:web` - Start Next.js dev server
- `pnpm start:web` - Start Next.js production server
- `pnpm --filter @apps/web prisma:studio` - Open Prisma Studio

### Socket Server
- `pnpm dev:socket` - Start Socket.IO server
- `pnpm start:socket` - Start Socket.IO server in production

## 🐳 Docker Deployment

The project includes Docker configuration for containerized deployment:

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## 📚 Documentation

- **[Architecture Documentation](./architecture.md)** - Comprehensive system architecture, design patterns, and implementation details
- **[Prisma Schema](./prisma/schema.prisma)** - Database schema and models

## 🔐 Authentication

The platform supports multiple authentication methods:
- **Google OAuth**: Social login via Google
- **Kakao OAuth**: Korean social login
- **Email/Password**: Traditional credentials authentication

All authentication is handled via NextAuth.js with JWT session strategy.

## 💳 Payment Processing

The platform integrates with two payment providers:
- **Stripe**: International payment processing
- **Toss Payments**: Korean payment gateway

Both providers support multiple currencies and handle zero-decimal currencies (KRW, JPY, VND) correctly.

## 🌐 Internationalization

The platform supports three languages:
- English (en) - Default
- Korean (ko)
- Uzbek (uz)

Locale routing is URL-based (`/en/...`, `/ko/...`, `/uz/...`) with cookie-based preference storage.

## 📧 Email Notifications

Email notifications are sent via Resend for:
- Order confirmations
- Order status updates
- Shipping notifications

## 🔔 Real-Time Notifications

The platform includes a real-time notification system powered by Socket.IO:
- User-specific notifications
- Order update notifications
- Product alerts
- System-wide announcements

## 🧪 Development

### Code Structure
- **Components**: Reusable React components in `apps/web/src/components/`
- **API Routes**: Next.js API routes in `apps/web/src/app/api/`
- **Business Logic**: Core logic in `apps/web/src/lib/`
- **Types**: TypeScript definitions in `apps/web/src/types/`

### Database Management
```bash
# Open Prisma Studio
pnpm --filter @apps/web prisma:studio

# Generate ERD diagram
pnpm erd:generate
```

## 📄 License

MIT License

## 🤝 Contributing

[I will update soon]

## 📞 Support

[Refer to my GitHub profile links for contact and support]
