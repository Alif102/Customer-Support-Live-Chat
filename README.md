# Customer Support Live Chat

A lightweight MVP for customer support with Google Sign-In and real-time messaging.

## Architecture
- **Auth:** NextAuth v5 (Auth.js) with Google Provider and Database session strategy.
- **Real-time:** Server-Sent Events (SSE) for message delivery. In-process `EventEmitter` for pub/sub.
- **Database:** MariaDB/MySQL managed via Prisma 7.
- **Structure:** Next.js App Router inside `src/` directory. Role-based access control (RBAC) enforced via `proxy.ts` (middleware) and server-side page checks.

## Setup
1. **Env:** Copy `.env.example` to `.env.local` and fill in:
   - `DATABASE_URL`, `AUTH_SECRET` (generate with `npx auth secret`)
   - `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`
   - `SEED_AGENT_EMAIL` (your agent gmail)
2. **Install:** `pnpm install`
3. **Database:**
   - `pnpm db:migrate` - Run migrations
   - `pnpm db:seed` - Seed the agent user
4. **Run:** `pnpm dev`

## Commands
- `pnpm dev`: Start development server
- `pnpm db:migrate`: Sync schema with database
- `pnpm db:seed`: Seed agent user defined in `.env.local`
- `pnpm db:reset`: Clear and reset database

## Module Ownership
- **Auth (Dev A):** `auth.ts`, `proxy.ts`, Login/Home pages, Seed script.
- **Chat (Dev B):** API routes (Messages/SSE), `events.ts`, Chat/Agent pages, `ChatWindow` component.
