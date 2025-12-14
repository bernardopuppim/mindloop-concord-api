# Contract Management System

## Overview

This is an enterprise contract management web application designed for tracking employees, service posts, allocations, and contractual documentation. The system provides role-based access control with admin and viewer roles, comprehensive CRUD operations for core entities, daily allocation tracking, occurrence management, document uploads, and audit logging. Built with a modern full-stack architecture using React, Express, and PostgreSQL.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework**: React 18 with TypeScript
- **Router**: Wouter for client-side routing
- **State Management**: TanStack Query (React Query) for server state management
- **Form Handling**: React Hook Form with Zod validation via @hookform/resolvers
- **UI Components**: Radix UI primitives with shadcn/ui design system
- **Styling**: TailwindCSS with custom design tokens following Carbon Design System principles
- **Theme System**: Context-based theme provider supporting light/dark/system modes

**Design System**:
- Typography: IBM Plex Sans and IBM Plex Mono font families
- Color Scheme: Custom HSL-based color variables supporting theme switching
- Component Library: shadcn/ui components in "new-york" style variant
- Layout: Sidebar navigation with responsive mobile drawer pattern

**Key Frontend Patterns**:
- Feature-based page organization under `client/src/pages/`
- Shared UI components in `client/src/components/`
- Custom hooks for authentication (`useAuth`) and mobile detection
- Centralized API request handling via query client with credential inclusion
- Type-safe data fetching using shared schema types from backend

### Backend Architecture

**Framework**: Express.js with TypeScript
- **Database ORM**: Drizzle ORM for PostgreSQL
- **Authentication**: Replit Auth (OpenID Connect) with Passport.js
- **Session Management**: express-session with PostgreSQL session store (connect-pg-simple)
- **File Uploads**: Multer for multipart form data handling
- **API Design**: RESTful endpoints under `/api/*` routes

**Database Schema** (`shared/schema.ts`):
- **Core Entities**: employees, servicePosts, allocations, occurrences, documents
- **Auth/Audit**: users (with role enum), sessions, auditLogs
- **Enums**: userRole, employeeStatus, modality, allocationStatus, occurrenceCategory, documentType
- **Relations**: Defined using Drizzle ORM relations for entity associations

**Storage Layer** (`server/storage.ts`):
- Abstraction interface (`IStorage`) for all database operations
- CRUD operations for all entities with search capabilities
- Audit log creation for tracking system changes
- Type-safe operations using Drizzle schema types

**Authentication & Authorization**:
- OAuth/OIDC flow via Replit Auth
- Role-based access control (admin/viewer roles)
- Middleware guards: `isAuthenticated`, `isAdmin`
- Session-based authentication with secure cookie configuration

**File Management**:
- Upload directory: `uploads/` in project root
- UUID-based filename generation to prevent collisions
- 10MB file size limit enforced at middleware level
- Document metadata stored in database with file path references

### Build & Deployment

**Development**:
- Vite dev server with HMR for frontend
- tsx for running TypeScript server in development
- Middleware mode integration between Express and Vite

**Production Build**:
- Custom build script (`script/build.ts`) using esbuild and Vite
- Frontend: Vite builds to `dist/public`
- Backend: esbuild bundles server to single `dist/index.cjs` file
- Selective dependency bundling (allowlist pattern) for optimized cold starts
- Static file serving from built frontend assets

**Configuration Files**:
- `vite.config.ts`: Frontend build configuration with path aliases
- `drizzle.config.ts`: Database migration configuration
- `tsconfig.json`: Shared TypeScript config with path mappings
- `tailwind.config.ts`: Custom design tokens and theme configuration

### Data Flow Patterns

1. **Query Pattern**: Client requests → TanStack Query → Fetch with credentials → Express route → Storage layer → Drizzle ORM → PostgreSQL
2. **Mutation Pattern**: Form submission → React Hook Form validation → TanStack Query mutation → API request → Server validation (Zod) → Storage layer → Database → Invalidate cache
3. **Authentication Flow**: Login redirect → Replit OIDC → Passport strategy → Session creation → User record upsert → Client receives user data
4. **File Upload Flow**: Form with file input → Multer middleware → File saved to uploads/ → Document record created with path → Frontend receives document metadata

### Error Handling

- Client-side: Centralized error handling in query client with toast notifications
- Server-side: Express error middleware with JSON error responses
- Validation: Zod schemas shared between client and server for consistency
- Unauthorized handling: 401 responses with configurable behavior in query client

### Performance Optimizations

- Query caching via TanStack Query with infinite stale time
- Selective dependency bundling to reduce syscalls on cold start
- Static asset caching via Express static middleware
- Database connection pooling via pg Pool
- Memoized OIDC configuration fetching

## External Dependencies

### Primary Services

**Database**: PostgreSQL
- Connection via `DATABASE_URL` environment variable
- Managed via Drizzle ORM with push-based schema migrations (`db:push` script)
- Session persistence using pg-specific session store

**Authentication**: Replit Auth (OpenID Connect)
- Discovery endpoint: `process.env.ISSUER_URL` (defaults to replit.com/oidc)
- Client ID: `process.env.REPL_ID`
- Session secret: `process.env.SESSION_SECRET`

### Third-Party Libraries

**UI Components**: Radix UI ecosystem
- Comprehensive set of accessible, unstyled primitives
- Used for: dialogs, dropdowns, selects, tooltips, accordions, etc.
- Styled via Tailwind and shadcn/ui patterns

**Frontend Utilities**:
- `date-fns`: Date manipulation and formatting
- `clsx` + `tailwind-merge`: Conditional className composition
- `class-variance-authority`: Component variant management
- `cmdk`: Command palette component

**Backend Utilities**:
- `multer`: File upload handling
- `express-rate-limit`: API rate limiting (imported but configuration not shown)
- `nanoid`: Unique ID generation
- `memoizee`: Function result caching

**Development Tools**:
- `@replit/vite-plugin-*`: Replit-specific dev tooling (cartographer, dev banner, runtime error modal)
- `tsx`: TypeScript execution for development server
- `esbuild`: Production server bundling

### Font Resources

**Google Fonts CDN**:
- IBM Plex Sans (weights: 400, 500, 600, 700)
- IBM Plex Mono (weights: 400, 500, 600)
- Loaded via preconnect + font link tags in `client/index.html`

### API Integrations

No external third-party APIs are currently integrated beyond Replit Auth. The application is self-contained with all business logic handled server-side.