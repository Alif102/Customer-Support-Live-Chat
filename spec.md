# SPEC: Customer Support Live Chat + Google Sign-In

**Window:** 1–2 days
**Repo:** Single shared GitHub repo, both devs as collaborators

---

## 1. Why

Customer support chat MVP. Internal/local use only at this stage. Two features, both on the product roadmap:

- **Google sign-in** alongside existing phone/OTP
- **Live chat** so customers reach support without leaving the platform

Patterns and schema must map cleanly to the production codebase later.

## 2. Success criteria

End of window, single `main` branch, fresh clone runs the app. All of:

- Visitor on `/` sees "Sign in with Google"
- Sign-in completes; new user gets a `User` row with `role = CUSTOMER` by default
- One pre-seeded agent user signs in with Google and gets `role = AGENT`
- After sign-in, customers land on `/chat`, agents land on `/agent`
- A signed-in user cannot access the other role's pages (server-side check)
- `/chat`: customer has one open conversation, can send messages, sees agent replies appear without page refresh
- `/agent`: agent sees a list of all open conversations with last-message preview, can open one, send replies, see customer messages appear without page refresh
- All messages persist in MariaDB and survive a refresh
- Unauthenticated request to any chat API or SSE endpoint is rejected
- A customer cannot read or write into another customer's conversation, enforced server-side
- Closing and reopening the tab restores the conversation and resumes live updates

## 3. Out of scope

- Apple OAuth, phone/OTP
- Typing indicators, presence, read receipts (stretch only)
- File uploads, attachments
- Agent-to-agent transfer, agent assignment
- Conversation closing/archiving UI
- Email or SMS notifications
- Mobile, Capacitor, deploy, CI/CD
- Rate limiting beyond NextAuth defaults
- Admin UI for promoting users to agent
- Live updates to the agent's conversation **list** when a new conversation appears (live updates **inside** an open conversation are required; agent refreshes the list)
- Filling the message gap during a disconnect — page refresh recovers

## 4. Stack

Match production so the work ports cleanly. Use minimally — skip optional libs.

- **Web:** Next.js 16, React 19, TypeScript strict, Tailwind 4
- **Node:** 20 LTS
- **DB:** MariaDB 10.11 local via the provided `docker-compose.yml`
- **ORM:** Prisma 7, stock MySQL provider against MariaDB 10.11
- **Auth:** `next-auth@beta` (v5) + `@auth/prisma-adapter`, Google provider, database session strategy
- **Real-time delivery:** Server-Sent Events. Server streams events on a conversation channel; client subscribes via `EventSource`. No custom server, no `ws` package, no Redis. In-process pub/sub fan-out is fine for one-instance local.
- **Real-time send:** Standard HTTP POST to a Next.js API route. Server validates, persists, publishes on the conversation channel, returns 200.
- **Validation:** Zod **only** at API route entry points (POST handlers, route params). Type inference everywhere else.
- **Logging:** `console.log` / `console.warn`. No Pino.
- **Package manager:** pnpm
- **Starter:** `pnpm create next-app@latest` (App Router, TS, Tailwind, ESLint, src directory **yes**, alias `@/*`)

**AI tooling:** Cursor, Claude, anything they want. Both devs must explain every line they ship in the walkthrough and code review.

## 5. Operational setup

- **Node:** `nvm use 20`
- **MariaDB:** `docker-compose.yml` ships in the scaffolding commit
- **Google OAuth:** one OAuth Client provisioned. Two authorized redirect URIs registered: `localhost:3000` and `localhost:3001`. Client ID + secret shared via 1Password.
- **Ports:** Dev A = 3000, Dev B = 3001. Both can run simultaneously.
- **Env file:** copy `.env.example` → `.env.local`. Required keys: `DATABASE_URL`, `AUTH_SECRET`, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`, `AUTH_TRUST_HOST=true`, `PORT`, `SEED_AGENT_EMAIL` (real Gmail address used for the agent seed)
- **`.env.example`** committed; **`.env.local`** gitignored
- **`package.json` scripts:** `dev`, `build`, `start`, `db:migrate`, `db:seed`, `db:reset`. Pinned in the scaffolding PR.

## 6. Data model

Full Prisma schema. This is contract — neither dev modifies field types or names without the other's PR review.

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}

// NextAuth v5 / @auth/prisma-adapter required tables
model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?
  user              User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime
  @@unique([identifier, token])
}

// App tables
enum UserRole { CUSTOMER  AGENT }
enum ConvStatus { OPEN  CLOSED }

model User {
  id            String         @id @default(cuid())
  email         String         @unique
  name          String?
  image         String?
  emailVerified DateTime?
  role          UserRole       @default(CUSTOMER)
  accounts      Account[]
  sessions      Session[]
  conversations Conversation[] @relation("CustomerConversations")
  messagesSent  Message[]
  createdAt     DateTime       @default(now())
  updatedAt     DateTime       @updatedAt
}

model Conversation {
  id         String     @id @default(cuid())
  customerId String
  customer   User       @relation("CustomerConversations", fields: [customerId], references: [id])
  status     ConvStatus @default(OPEN)
  messages   Message[]
  createdAt  DateTime   @default(now())
  updatedAt  DateTime   @updatedAt
  @@index([customerId, status])
  @@index([status, updatedAt])
}

model Message {
  id             String       @id @default(cuid())
  conversationId String
  conversation   Conversation @relation(fields: [conversationId], references: [id])
  senderId       String
  sender         User         @relation(fields: [senderId], references: [id])
  body           String       @db.Text
  createdAt      DateTime     @default(now())
  @@index([conversationId, createdAt])
}
```

## 7. Module ownership

| Path                                                                            | Owner               |
| ------------------------------------------------------------------------------- | ------------------- |
| `prisma/schema.prisma`                                                          | Joint (scaffolding) |
| `src/auth.ts` (NextAuth setup, exports `auth`, `handlers`, `signIn`, `signOut`) | Dev A               |
| `src/proxy.ts` (Next.js 16 — replaces `middleware.ts`; route protection only)   | Dev A               |
| `src/app/api/auth/[...nextauth]/route.ts`                                       | Dev A               |
| `src/app/login/page.tsx`, `src/app/page.tsx`                                    | Dev A               |
| `src/app/chat/**`                                                               | Dev B               |
| `src/app/agent/**`                                                              | Dev B               |
| `src/app/api/messages/route.ts` (POST handler)                                  | Dev B               |
| `src/app/api/conversations/[id]/stream/route.ts` (SSE)                          | Dev B               |
| `src/lib/events.ts` (in-process pub/sub)                                        | Dev B               |
| `src/lib/prisma.ts` (singleton client)                                          | Joint (scaffolding) |
| `prisma/seed.ts`                                                                | Dev A               |
| `next-auth.d.ts` (Session/User type augmentation)                               | Dev A               |
| `docker-compose.yml`, `.env.example`, `package.json` scripts, `README.md`       | Joint (scaffolding) |

By end of scaffolding: every file listed exists with at minimum a stub export so both devs can import without compile errors.

## 8. Auth feature — Dev A

**Acceptance:**

- Google provider works via `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET`
- Database session strategy (not JWT)
- Session object exposes `user.id` and `user.role` to server components and route handlers
- `/login` page with a working Google sign-in button
- `/` redirects: customer → `/chat`, agent → `/agent`, unauth → `/login`
- `/chat` and `/agent` are role-gated server-side. Wrong role → redirect to the right page. Unauth → `/login`.
- `proxy.ts` (Next.js 16 file name; not `middleware.ts`) provides cheap unauth-redirect for `/chat` and `/agent` matchers. Role-based redirects live in the page-level checks because proxy runs without the database adapter.
- `prisma/seed.ts` upserts one agent: email = `SEED_AGENT_EMAIL`, role = `AGENT`. Idempotent.
- Agent's first Google sign-in links the OAuth account to the seeded user and the role sticks.
- `Session` and `User` extended in `next-auth.d.ts` so `session.user.id` and `session.user.role` are typed everywhere.
- Sign-in, sign-out, session-rejection events log to console with enough info to trace.

**Expectations:**

- NextAuth v5 in Next.js 16 + database sessions has known config patterns. AI assistants will guide the split-config detail. Dev A must be able to explain the choice.
- Email-based account linking on first Google sign-in for a pre-seeded user requires an explicit flag on the Google provider. Dev A understands the security tradeoff: acceptable here because Google is a verified-email provider and the seed is internal. Not portable to unverified-email providers.

## 9. Chat feature — Dev B

**Acceptance:**

- `/chat` (server component): finds or creates the customer's one OPEN conversation, loads last 50 messages, renders a client child that handles the live chat UI.
- `/agent` (server component): lists all OPEN conversations, sorted by `updatedAt` desc, with last-message preview. Each row links to a per-conversation page.
- `/agent/[id]` (server component): loads the conversation's history, renders the same chat UI bound to that conversation.
- `POST /api/messages` accepts `{ conversationId, body }`. Validates with Zod. Authorizes:
  - Customer can post only into their own OPEN conversation
  - Agent can post into any OPEN conversation
  - Otherwise 403, no persist
- On valid POST: persist the message, publish on `lib/events.ts` channel `conversation:{id}`, return the persisted message.
- `GET /api/conversations/[id]/stream` is a Server-Sent Events endpoint. Authenticates the user, authorizes the same way as POST, subscribes to channel `conversation:{id}`, streams `message` events to the client. Closes cleanly on client disconnect.
- Client-side: `EventSource` opens to the stream endpoint, appends incoming messages to the UI in real time. Auto-scroll to latest. Auto-reconnect handled by `EventSource`'s built-in retry.
- Conversation creation race: if a customer hits `/chat` from two tabs and no OPEN conversation exists, only one row is created. Approach is up to Dev B; documented in the PR.
- `lib/events.ts` exposes `publish(channel, payload)` and `subscribe(channel, handler)` returning an unsubscribe function. In-process only for this build. Interface shape matches Redis pub/sub semantics so a future swap is one file.
- Server-side filtering only. Each subscriber receives only events for channels its user is authorized to subscribe to. No client-side filtering.
- Connect, disconnect, persist, authz-reject events log to console.

**Expectations:**

- SSE is a one-way stream. Sends are HTTP POST. AI assistants will guide `EventSource` usage and the `Response` stream pattern in App Router.
- The published payload shape (server → client SSE event) and the POST request body shape are part of the contract between Dev A's auth surface and Dev B's chat surface — agreed in the joint scaffolding session and documented in `lib/events.ts` and the API route.
- Disconnect-window message gap is out of scope (Section 3). Page refresh is recovery.

## 10. Collaboration rules

1. **Joint scaffolding session, 60–90 min, one keyboard.** Together produce the initial commit on `main`: Next.js boilerplate, full Prisma schema, `docker-compose.yml`, `.env.example`, `package.json` scripts, stub files for every entry in Section 7, README skeleton, first migration generated against running MariaDB. Push to `main`. Only after this merges do they branch.
2. **Branches:** `feat/auth-google` (Dev A), `feat/chat-sse` (Dev B). No work on `main` after scaffolding until merge.
3. **Stub-by-T+1h:** within an hour of scaffolding ending, both devs have stub exports on `main` so the other compiles.
4. **Push at least every 90 minutes.** WIP commit fine. 90+ min silent = surface the blocker in standup.
5. **PR size cap: 300 lines of diff.** Generated files (lockfiles, Prisma migrations, `schema.prisma`) don't count. Scaffolding PR is exempt.
6. **No self-merge.** Every PR reviewed by the other dev — at least one inline comment or one named-check approval.
7. **Minimum 3 merges to `main` per dev** before the final integration check. Forces continuous integration over big-bang merge.
8. **Standups:** 5 min after scaffolding, 5 min midday, 5 min late afternoon. Channel: done / next / blocked.
9. **Conventional Commits:** `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`. PR titles match.

## 11. Definition of done

- All Section 2 success criteria pass on a fresh clone after: `pnpm install && docker compose up -d && pnpm db:migrate && pnpm db:seed && pnpm dev`
- `README.md` documents env setup, `pnpm` commands, architecture in under 300 words
- Both devs can answer questions about any part of the codebase, including parts they didn't write
- Git history shows continuous integration: small commits, multiple merges per dev, cross-reviews, no force-push to `main`
- No secrets in the repo

## 12. Walkthrough + code review

Two end gates.

- **Walkthrough (live, 20 min):** both devs together, screen shared. Demo the working app end-to-end (sign in as customer, sign in as agent in another browser, exchange messages live, refresh and reconnect). Then take questions on architecture and choices.
- **Code review (async, after walkthrough):** diff and commit history reviewed. Findings sent as PR comments. Devs respond.

## 13. Stretch (only if Section 2 fully done with time left)

Priority order:

1. **Typing indicator** — broadcast a `typing` event on the conversation channel, recipients show "..." for ~3s
2. **Last-read marker** — per user per conversation; agent's list shows unread counts
3. **Swap `lib/events.ts` to Redis pub/sub** — interface stays, internals replaced; document the diff in the README
