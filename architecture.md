# Trainium E-Commerce Platform - Software Architecture

## Table of Contents
1. [Overview](#overview)
2. [System Architecture](#system-architecture)
3. [Technology Stack](#technology-stack)
4. [Project Structure](#project-structure)
5. [Core Components](#core-components)
6. [Data Flow](#data-flow)
7. [Authentication & Authorization](#authentication--authorization)
8. [Business Logic](#business-logic)
9. [Real-Time Features](#real-time-features)
10. [Payment Processing](#payment-processing)
11. [Internationalization](#internationalization)
12. [Deployment Architecture](#deployment-architecture)

---

## Overview

Trainium is a modern, full-stack e-commerce platform built for selling high-tech fitness equipment. The system is designed as a monorepo with a microservices-oriented architecture, featuring a Next.js web application and a dedicated Socket.IO server for real-time functionality.

### Key Features
- **E-Commerce Core**: Product catalog, shopping cart, checkout, order management
- **User Management**: Multi-provider authentication (Google, Kakao, Email/Password)
- **Admin Panel**: Comprehensive dashboard for managing products, orders, customers, and content
- **Real-Time Notifications**: Socket.IO-based notification system
- **Multi-Language Support**: i18n with support for English, Korean, and Uzbek
- **Payment Integration**: Stripe and Toss Payments support
- **Product Recommendations**: AI-powered recommendation engine
- **Social Features**: Reviews, ratings, favorites, and likes
- **Inventory Management**: Stock tracking with low-stock alerts

---

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Client Browser                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Next.js    │  │  Socket.IO   │  │   Stripe     │     │
│  │   Web App    │◄─┤   Client     │  │   Elements   │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
                          │                    │
                          │                    │
        ┌─────────────────┘                    └─────────────────┐
        │                                                    │
        ▼                                                    ▼
┌──────────────────────────────────┐        ┌──────────────────────────────┐
│      Next.js Web Application     │        │    Socket.IO Server          │
│      (Port 3000)                  │        │    (Port 4000)               │
│                                   │        │                              │
│  ┌────────────────────────────┐  │        │  ┌────────────────────────┐ │
│  │   App Router (Next.js 15)  │  │        │  │   Socket.IO Server     │ │
│  │   - Server Components      │  │        │  │   - Real-time events  │ │
│  │   - API Routes             │  │        │  │   - Room management   │ │
│  │   - Server Actions         │  │        │  │   - Admin endpoints   │ │
│  └────────────────────────────┘  │        │  └────────────────────────┘ │
│                                   │        │                              │
│  ┌────────────────────────────┐  │        └──────────────────────────────┘
│  │   NextAuth.js              │  │
│  │   - Session Management     │  │
│  │   - JWT Strategy           │  │
│  └────────────────────────────┘  │
│                                   │
│  ┌────────────────────────────┐  │
│  │   Prisma Client            │  │
│  │   - Database ORM           │  │
│  └────────────────────────────┘  │
└───────────────────────────────────┘
                    │
                    ▼
        ┌───────────────────────────┐
        │   PostgreSQL Database     │
        │   - User data             │
        │   - Products & Inventory  │
        │   - Orders & Payments     │
        │   - Notifications         │
        └───────────────────────────┘
                    │
        ┌───────────┴───────────┐
        │                       │
        ▼                       ▼
┌──────────────┐      ┌──────────────────┐
│   Stripe     │      │  Toss Payments   │
│   API        │      │  API             │
└──────────────┘      └──────────────────┘
```

### Monorepo Structure

The project uses **Turbo** for monorepo management with the following structure:

```
trainium/
├── apps/
│   ├── web/              # Next.js web application
│   └── socket/            # Socket.IO server
├── apps/packages/
│   ├── shared/            # Shared utilities
│   └── tsconfig/          # Shared TypeScript configs
├── prisma/                # Database schema and migrations
├── scripts/                # Build and utility scripts
└── [root config files]    # Turbo, ESLint, TypeScript configs
```

---

## Technology Stack

### Frontend
- **Next.js 15.5.0**: React framework with App Router
- **React 19.1.0**: UI library
- **TypeScript 5.x**: Type safety
- **Tailwind CSS 4.x**: Utility-first CSS framework
- **Framer Motion**: Animation library
- **React Hook Form**: Form management
- **Zod**: Schema validation
- **Socket.IO Client**: Real-time communication
- **Stripe Elements**: Payment UI components

### Backend
- **Next.js API Routes**: RESTful API endpoints
- **NextAuth.js 5.0**: Authentication framework
- **Prisma 6.14.0**: ORM for database access
- **PostgreSQL**: Primary database
- **Express.js**: Socket server framework
- **Socket.IO 4.8.1**: WebSocket server

### Authentication Providers
- **Google OAuth**: Social login
- **Kakao OAuth**: Korean social login
- **Credentials**: Email/password authentication

### Payment Providers
- **Stripe**: International payments
- **Toss Payments**: Korean payment gateway

### Infrastructure & Tools
- **Turbo**: Monorepo build system
- **Docker**: Containerization
- **pnpm**: Package manager
- **ESLint**: Code linting
- **Resend**: Email service

---

## Project Structure

### Web Application (`apps/web/`)

```
apps/web/src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   ├── auth/          # Authentication endpoints
│   │   ├── cart/          # Cart operations
│   │   ├── checkout/      # Payment processing
│   │   ├── products/      # Product endpoints
│   │   ├── admin/         # Admin API
│   │   └── ...
│   ├── admin/             # Admin panel pages
│   ├── account/           # User account pages
│   ├── products/          # Product pages
│   ├── checkout/          # Checkout flow
│   └── ...
├── components/            # React components
│   ├── admin/             # Admin components
│   ├── cart/              # Cart components
│   ├── checkout/          # Checkout components
│   ├── product/           # Product components
│   ├── nav/               # Navigation
│   └── ui/                # Reusable UI components
├── lib/                   # Business logic & utilities
│   ├── auth/              # Auth utilities
│   ├── cart/              # Cart logic
│   ├── checkout/          # Checkout logic
│   ├── database/          # Database client
│   ├── email/             # Email service
│   ├── i18n/              # Internationalization
│   ├── notifications/     # Notification system
│   ├── order/             # Order management
│   ├── product/           # Product operations
│   ├── services/          # Business services
│   ├── socket/            # Socket.IO client
│   └── utils/             # Utility functions
├── hooks/                 # React hooks
├── types/                 # TypeScript types
├── locales/               # Translation files
└── auth.ts                # NextAuth configuration
```

### Socket Server (`apps/socket/`)

```
apps/socket/src/
└── index.js               # Socket.IO server entry point
    ├── Express app setup
    ├── Socket.IO server
    ├── Event handlers
    └── Admin HTTP endpoints
```

---

## Core Components

### 1. Authentication System

**Architecture**: NextAuth.js with Prisma Adapter

**Flow**:
1. User initiates login via provider (Google/Kakao/Credentials)
2. NextAuth handles OAuth flow or validates credentials
3. Session created with JWT strategy
4. User role attached to JWT token
5. Cart merged from cookie to user account on sign-in

**Key Files**:
- `apps/web/src/auth.ts`: NextAuth configuration
- `apps/web/src/auth/rbac.ts`: Role-based access control
- `apps/web/src/auth/providers/kakao.ts`: Custom Kakao provider

**Features**:
- Multi-provider authentication
- Account linking (same email across providers)
- JWT-based sessions
- Role-based authorization (ADMIN, STAFF, CUSTOMER)
- Automatic cart merging on login

### 2. Cart System

**Architecture**: Hybrid cookie + database approach

**Flow**:
1. **Guest Users**: Cart stored in database with cookie ID reference
2. **Authenticated Users**: Cart linked to user account
3. **Cart Merge**: On login, cookie cart merged into user cart
4. **Persistence**: All carts stored in database for consistency

**Key Files**:
- `apps/web/src/lib/cart/cart.ts`: Cart operations
- `apps/web/src/lib/cart/cart-merge.ts`: Cart merging logic
- `apps/web/src/lib/utils/cookies.ts`: Cookie management

**Features**:
- Guest cart support
- User cart persistence
- Automatic cart merging
- Variant support (size, color, etc.)
- Price snapshot at add-to-cart time

### 3. Checkout & Payment Processing

**Architecture**: Multi-provider payment gateway integration

**Flow**:
1. User completes shipping address form
2. Payment method selected (Stripe or Toss)
3. Payment intent created via API
4. Payment processed through provider
5. Webhook validates payment
6. Order created and inventory decremented
7. Confirmation email sent

**Stripe Flow**:
```
Client → /api/checkout/stripe → Stripe PaymentIntent
→ Stripe Elements → Payment Confirmation
→ /api/checkout/complete → Order Creation
```

**Toss Flow**:
```
Client → /api/checkout/toss/create-intent → Toss API
→ Toss Widget → Payment Confirmation
→ /api/checkout/toss/success → Order Creation
```

**Key Files**:
- `apps/web/src/app/api/checkout/stripe/route.ts`
- `apps/web/src/app/api/checkout/toss/create-intent/route.ts`
- `apps/web/src/app/api/checkout/toss/success/route.ts`
- `apps/web/src/components/checkout/`: Checkout UI components

**Features**:
- Multi-currency support (KRW, USD, etc.)
- Zero-decimal currency handling
- Payment intent idempotency
- Webhook validation
- Automatic inventory management
- Order confirmation emails

### 4. Order Management

**Architecture**: State machine with status tracking

**Order Status Flow**:
```
PENDING → PAID → FULFILLING → SHIPPED → DELIVERED
                ↓
            CANCELED / REFUNDED
```

**Key Files**:
- `apps/web/src/lib/order/`: Order operations
- `apps/web/src/app/api/admin/orders/`: Admin order management

**Features**:
- Status tracking
- Shipping information
- Payment records
- Order history
- Admin order management
- Email notifications on status changes

### 5. Product Management

**Architecture**: Flexible product model with variants

**Product Structure**:
- Base product with metadata
- Product variants (SKU, price, attributes)
- Inventory tracking
- Category associations (many-to-many)
- Image galleries (JSON storage)

**Key Files**:
- `apps/web/src/lib/product/`: Product operations
- `apps/web/src/app/admin/products/`: Admin product management

**Features**:
- Product variants
- Inventory management
- Category organization
- Image upload and management
- Active/inactive status
- Slug-based URLs

### 6. Real-Time Notification System

**Architecture**: Socket.IO server with room-based messaging

**Components**:
1. **Socket Server** (`apps/socket/`): Standalone Express + Socket.IO server
2. **Socket Client** (`apps/web/src/lib/socket/`): Client-side Socket.IO wrapper
3. **Notification Hook** (`apps/web/src/hooks/useSocket.ts`): React hook for notifications

**Notification Types**:
- `ORDER_UPDATE`: Order status changes
- `PRODUCT_ALERT`: Product-related notifications (low stock, price changes)
- `SYSTEM_ALERT`: System-wide announcements

**Flow**:
1. Client connects to Socket.IO server
2. Client authenticates with user ID and role
3. Server joins user to rooms: `user:{userId}`, `order:{orderId}`, `product:{productId}`
4. Server emits notifications to appropriate rooms
5. Client receives and displays notifications
6. Notifications persisted in database

**Key Files**:
- `apps/socket/src/index.js`: Socket server
- `apps/web/src/lib/socket/socket-client.ts`: Client wrapper
- `apps/web/src/hooks/useSocket.ts`: React hook
- `apps/web/src/components/account/NotificationClient.tsx`: UI component

**Features**:
- Real-time delivery
- Room-based targeting
- Database persistence
- Read/unread tracking
- Admin broadcast capability
- Automatic reconnection

### 7. Recommendation Engine

**Architecture**: Multi-source recommendation system

**Recommendation Sources** (priority order):
1. **Favorites**: Products similar to user's favorites
2. **Likes**: Products similar to liked products
3. **Purchases**: Products similar to purchased items
4. **Fallback**: Popular and newest products

**Algorithm**:
- Product similarity based on categories and attributes
- User activity tracking (favorites, likes, purchases)
- Fallback to popular/newest products

**Key Files**:
- `apps/web/src/lib/services/recommendations/recommendation-engine.ts`
- `apps/web/src/lib/services/recommendations/product-similarity.ts`
- `apps/web/src/lib/services/recommendations/user-activity-service.ts`

**Features**:
- Personalized recommendations
- Similarity-based matching
- Activity-based prioritization
- Fallback strategies
- Cache support

### 8. Review & Rating System

**Architecture**: Hierarchical review system with moderation

**Features**:
- Product reviews with ratings (1-5 stars)
- Review replies (nested comments)
- Review likes
- Review editing with edit history
- Soft deletion
- Status management (ACTIVE, DELETED)

**Key Files**:
- `apps/web/src/app/api/reviews/`: Review API endpoints
- `apps/web/src/lib/services/reviews.ts`: Review operations

### 9. Admin Panel

**Architecture**: Role-based admin interface

**Features**:
- Dashboard with statistics
- Product management (CRUD)
- Order management and tracking
- Customer management
- Category management
- FAQ management
- Notification management
- Low stock alerts

**Key Files**:
- `apps/web/src/app/admin/`: Admin pages
- `apps/web/src/components/admin/`: Admin components
- `apps/web/src/app/api/admin/`: Admin API endpoints

**Access Control**:
- Admin-only routes protected by layout-level checks
- RBAC utilities for role validation

---

## Data Flow

### User Registration Flow

```
1. User submits registration form
   ↓
2. POST /api/auth/register
   ↓
3. Validate input (email, password)
   ↓
4. Hash password with bcrypt
   ↓
5. Create user in database
   ↓
6. Return success/error response
```

### Product Purchase Flow

```
1. User adds products to cart
   ↓
2. Cart stored in database (guest or user)
   ↓
3. User navigates to checkout
   ↓
4. User enters shipping address
   ↓
5. User selects payment method
   ↓
6. Payment intent created
   ↓
7. Payment processed
   ↓
8. Webhook validates payment
   ↓
9. Order created in database
   ↓
10. Inventory decremented
   ↓
11. Confirmation email sent
   ↓
12. Real-time notification sent
```

### Notification Flow

```
1. Event occurs (order update, low stock, etc.)
   ↓
2. Server-side code calls Socket.IO API
   ↓
3. Socket server emits to appropriate rooms
   ↓
4. Connected clients receive notification
   ↓
5. Notification displayed in UI
   ↓
6. Notification persisted in database
   ↓
7. User marks as read
   ↓
8. Database updated
```

---

## Authentication & Authorization

### Authentication Providers

1. **Google OAuth**
   - OAuth 2.0 flow
   - Account linking enabled

2. **Kakao OAuth**
   - Custom provider implementation
   - Korean market support

3. **Credentials (Email/Password)**
   - bcrypt password hashing
   - Email verification support

### Session Management

- **Strategy**: JWT (JSON Web Tokens)
- **Storage**: HTTP-only cookies
- **Expiration**: Configurable via NextAuth
- **Role Attachment**: User role included in JWT

### Authorization

**Role Hierarchy**:
- `ADMIN`: Full system access
- `STAFF`: Limited admin access
- `CUSTOMER`: Standard user access

**Protection Mechanisms**:
1. **Layout-level**: Server-side checks in page layouts
2. **API-level**: Route handlers check session and role
3. **Component-level**: Client-side conditional rendering

**Key Implementation**:
- `apps/web/src/auth/rbac.ts`: RBAC utilities
- Layout files check `auth()` before rendering
- API routes validate session and role

---

## Business Logic

### Cart Management

**Cart Lifecycle**:
1. **Creation**: Cart created on first add-to-cart
2. **Guest Cart**: Stored with cookie ID
3. **User Cart**: Linked to user account
4. **Merge**: Cookie cart merged into user cart on login
5. **Checkout**: Cart converted to order
6. **Cleanup**: Old carts can be cleaned up

**Cart Operations**:
- Add item (with variant support)
- Update quantity
- Remove item
- Clear cart
- Price snapshot (price at time of add)

### Inventory Management

**Features**:
- Stock tracking per product
- Low stock threshold configuration
- Automatic decrement on order
- Low stock notifications
- Out-of-stock handling

### Order Processing

**Order Creation**:
1. Validate cart
2. Calculate totals (subtotal, shipping, discount)
3. Create order with PENDING status
4. Process payment
5. Update order to PAID
6. Decrement inventory
7. Create shipping record
8. Send confirmation email

**Order Status Updates**:
- Admin can update order status
- Status changes trigger notifications
- Email notifications on status changes
- Tracking number assignment

### Product Recommendations

**Algorithm**:
1. Check user activity (favorites, likes, purchases)
2. Find similar products based on categories
3. Rank by similarity score
4. Fallback to popular/newest if insufficient data
5. Enrich with user interaction data (isFavorited, isLiked)

---

## Real-Time Features

### Socket.IO Architecture

**Server** (`apps/socket/`):
- Standalone Express server
- Socket.IO server on port 4000
- Room-based messaging
- Admin HTTP endpoints for triggering notifications

**Client** (`apps/web/src/lib/socket/`):
- Singleton Socket.IO client
- Automatic reconnection
- Event emitter pattern
- Type-safe event handling

**Rooms**:
- `user:{userId}`: User-specific notifications
- `order:{orderId}`: Order-specific updates
- `product:{productId}`: Product-specific alerts
- `admin:all`: Admin broadcast channel

### Notification Types

1. **User Notifications**: Targeted to specific user
2. **System Notifications**: Broadcast to all users
3. **Order Updates**: Real-time order status changes
4. **Product Alerts**: Low stock, price changes, etc.

### Integration Points

**Web App → Socket Server**:
- HTTP POST to `/admin/*` endpoints
- Admin secret authentication
- Payload includes user ID, notification data

**Socket Server → Web App**:
- WebSocket events
- Room-based targeting
- Automatic reconnection on disconnect

---

## Payment Processing

### Stripe Integration

**Flow**:
1. Create PaymentIntent via `/api/checkout/stripe`
2. Return client secret to frontend
3. Render Stripe Elements
4. User completes payment
5. Confirm payment via Stripe SDK
6. Webhook validates payment
7. Order created and confirmed

**Features**:
- Multi-currency support
- Zero-decimal currency handling (KRW, JPY, VND)
- Payment intent idempotency
- Webhook validation
- Automatic payment method detection

### Toss Payments Integration

**Flow**:
1. Create payment intent via `/api/checkout/toss/create-intent`
2. Return payment configuration
3. Render Toss widget
4. User completes payment
5. Redirect to success URL
6. Validate payment on server
7. Order created and confirmed

**Features**:
- Korean payment gateway
- Test mode support
- Payment validation
- Order creation on success

### Payment Security

- Server-side payment intent creation
- Webhook validation
- Idempotency keys
- Payment reference storage
- Transaction logging

---

## Internationalization

### i18n Architecture

**Supported Locales**:
- `en`: English (default)
- `ko`: Korean
- `uz`: Uzbek

**Implementation**:
- Middleware-based locale detection
- URL-based locale routing (`/en/...`, `/ko/...`)
- Cookie-based locale preference
- Server-side dictionary loading

**Key Files**:
- `apps/web/src/lib/i18n/i18n-config.ts`: Configuration
- `apps/web/src/lib/i18n/i18n.ts`: Dictionary loading
- `apps/web/src/middleware.ts`: Locale routing
- `apps/web/src/locales/`: Translation files

**Features**:
- Automatic locale detection
- URL-based routing
- Cookie persistence
- Server-side rendering support
- Email translation support

---

## Deployment Architecture

### Docker Setup

**Services**:
1. **web**: Next.js application (port 3000)
2. **socket**: Socket.IO server (port 4000)

**Configuration**:
- Multi-stage builds
- Health checks
- Environment variable injection
- Volume mounts for uploads

### Environment Variables

**Required**:
- `DATABASE_URL`: PostgreSQL connection string
- `AUTH_SECRET`: NextAuth secret
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`
- `KAKAO_CLIENT_ID` / `KAKAO_CLIENT_SECRET`
- `STRIPE_SECRET_KEY` / `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `TOSS_CLIENT_KEY` / `TOSS_SECRET_KEY`
- `RESEND_API_KEY`: Email service
- `NEXTAUTH_URL`: Application URL
- `SOCKET_ADMIN_SECRET`: Socket server admin authentication

### Build Process

**Turbo Pipeline**:
1. Install dependencies (`pnpm install`)
2. Generate Prisma client
3. Build web app (`turbo run build`)
4. Build socket server
5. Docker image creation

**Output**:
- Standalone Next.js build
- Optimized production bundle
- Static asset optimization

---

## Database Schema

### Core Models

**User Management**:
- `User`: User accounts with roles
- `Account`: OAuth account linking
- `Session`: Active sessions

**E-Commerce**:
- `Product`: Product catalog
- `ProductVariant`: Product variations
- `Category`: Product categories
- `Inventory`: Stock management
- `Cart` / `CartItem`: Shopping cart
- `Order` / `OrderItem`: Orders
- `Shipping`: Shipping information
- `Payment`: Payment records
- `Discount`: Discount codes
- `Bundle` / `BundleItem`: Product bundles

**Social Features**:
- `Review` / `ReviewLike`: Product reviews
- `Favorite`: User favorites
- `ProductLike`: Product likes

**Content Management**:
- `FaqCategory` / `Faq`: FAQ system
- `Notification`: Notification storage

### Relationships

- **User ↔ Orders**: One-to-many
- **User ↔ Cart**: One-to-many
- **Product ↔ Categories**: Many-to-many
- **Product ↔ Variants**: One-to-many
- **Order ↔ OrderItems**: One-to-many
- **Review ↔ Replies**: Self-referential (parent-child)

---

## Security Considerations

### Authentication Security
- Password hashing with bcrypt
- JWT token security
- HTTP-only cookies
- CSRF protection via NextAuth

### API Security
- Session validation on protected routes
- Role-based access control
- Input validation with Zod
- SQL injection prevention via Prisma

### Payment Security
- Server-side payment intent creation
- Webhook signature validation
- No sensitive data in client
- Idempotency for payment operations

### File Upload Security
- File type validation
- Size limits
- Secure file storage
- Path traversal prevention

---

## Performance Optimizations

### Frontend
- Next.js App Router for optimal rendering
- Image optimization (WebP, AVIF)
- Code splitting
- Static generation where possible
- Client-side caching

### Backend
- Database query optimization
- Connection pooling (Prisma)
- Indexed database queries
- Efficient data fetching
- Caching strategies

### Real-Time
- Room-based message targeting
- Efficient Socket.IO connection management
- Automatic reconnection
- Connection state management

---

## Future Enhancements

### Potential Improvements
1. **Caching Layer**: Redis for session and cache management
2. **Search**: Full-text search (Elasticsearch, Algolia)
3. **Analytics**: User behavior tracking
4. **CDN**: Static asset delivery
5. **Monitoring**: Application performance monitoring
6. **Testing**: Comprehensive test suite
7. **CI/CD**: Automated deployment pipeline
8. **Microservices**: Further service decomposition

---

## Conclusion

Trainium is a well-architected, modern e-commerce platform built with best practices in mind. The monorepo structure, separation of concerns, and use of modern technologies provide a solid foundation for scalability and maintainability. The real-time notification system, multi-provider authentication, and comprehensive admin panel make it a complete solution for e-commerce operations.

