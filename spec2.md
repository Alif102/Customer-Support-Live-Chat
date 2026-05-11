# SPEC: Hardening Pass

*Window:* 1 day
*Base:* Working app from previous spec on main
*Repo:* Same shared repo, continued

---

## 1. Why

The MVP works end-to-end. This pass takes it from "works locally" to "shaped like the production version will be." Three concerns:

- *Portability* — prove the abstractions hold by swapping a real implementation underneath
- *Observability* — structured logs and request tracing, the minimum a real ops surface needs
- *Lifecycle* — exercise the schema's state model so it isn't theoretical

## 2. Success criteria

End of day, single main branch, fresh clone runs. All of:

- All logs are structured via Pino. No console.* calls remain in app code.
- Every HTTP request and every SSE connection has a unique correlation ID, present on every log line emitted while handling it.
- A message published on a conversation channel can be traced from POST through persistence through SSE delivery using the correlation ID.
- lib/events.ts is backed by Redis pub/sub. Public interface (publish, subscribe) unchanged.
- Two instances of the app run simultaneously on different ports against the same Redis + MariaDB. A message sent from a customer connected to instance A appears in real time to an agent connected to instance B.
- POST /api/messages is rate-limited per user. Exceeding the limit returns 429 with a Retry-After header. Limit and window are configurable via env.
- An existing AGENT can promote a CUSTOMER to AGENT via an authenticated endpoint. A CUSTOMER cannot. Unauthenticated requests are rejected.
- Agents can close a conversation. A closed conversation is removed from the agent's open list and rejects new messages from both sides. A customer with no OPEN conversation gets a new one created on their next visit to /chat.
- README updated with: Redis setup, two-instance run instructions, rate limit env keys, conversation lifecycle behavior.

## 3. Out of scope

- Typing indicators, presence, read receipts, unread counts
- File uploads, attachments
- Agent assignment, agent-to-agent transfer
- Email/SMS notifications
- Production deploy, CI/CD
- Persistent rate limit store (in-memory is fine)
- Admin UI (endpoint only)
- Backfilling correlation IDs into historical logs

## 4. Stack additions

- *ioredis* for Redis client
- *pino* + *pino-pretty* for logging
- *uuid* (or crypto.randomUUID()) for correlation IDs
- *Redis 7* added to docker-compose.yml
- No other dependencies added.

## 5. Operational setup

- New env keys (added to .env.example):
  - REDIS_URL — e.g. redis://localhost:6379
  - RATE_LIMIT_MAX — integer, default 30
  - RATE_LIMIT_WINDOW_MS — integer, default 60000
  - LOG_LEVEL — debug | info | warn | error, default info
- docker compose up -d brings up MariaDB and Redis together.
- Both instances of the app share one Redis and one MariaDB.

## 6. Logger contract (joint design, T+0 to T+20m)

Both devs agree on this before either codes.

- One root logger configured once at server start.
- Per-request child logger with requestId bound.
- Per-SSE-connection child logger with connectionId and userId bound.
- When publishing on lib/events.ts, the payload carries requestId (or connectionId for server-originated events). Subscribers log it on receive.
- Pretty output in dev (NODE_ENV !== 'production'), JSON in prod.
- Replaces every console.log / console.warn / console.error in app code.

## 7. Module ownership

| Path | Owner |
|------|-------|
| src/lib/logger.ts (Pino root + child factory) | Dev A |
| src/lib/rate-limit.ts | Dev A |
| src/app/api/admin/promote/route.ts | Dev A |
| Cross-cutting log replacement in existing files | Dev A |
| src/lib/events.ts (Redis backed) | Dev B |
| docker-compose.yml (Redis added) | Dev B |
| Conversation close: API route + UI affordance + lifecycle logic in /chat and /agent | Dev B |
| Two-instance test documented in README.md | Dev B |
| next-auth.d.ts, role-check helpers if needed | Joint |

## 8. Dev A — infrastructure layer

*Acceptance:*

- src/lib/logger.ts exports a configured Pino root logger and a withRequestId(id) / withConnectionId(id, userId) child factory. Pretty in dev, JSON in prod, level from LOG_LEVEL.
- Every existing console.* in app code replaced. New code uses the child logger appropriate to its scope.
- src/lib/rate-limit.ts exports a function that takes a key and returns { allowed, remaining, retryAfterMs }. In-memory token bucket. Configurable via RATE_LIMIT_MAX and RATE_LIMIT_WINDOW_MS.
- POST /api/messages applies the rate limit, keyed by user ID. On exceed: 429 with Retry-After header in seconds and JSON body explaining the limit. Logs the rejection.
- POST /api/admin/promote accepts { userId }. Requires the caller to be authenticated and have role = AGENT. Promotes the target user to AGENT. Returns the updated user. Logs the action with both the actor and target user IDs.
- Rejection paths: unauthenticated → 401, authenticated but not AGENT → 403, target user not found → 404, target already AGENT → 200 idempotent.

*Expectations:*

- Logger interface stays simple — no log shipping, no rotation, just stdout.
- Rate limit store is in-memory and intentionally not shared across instances. README documents this and notes that a Redis-backed store is the production path.
- Promote endpoint has no UI in this build; tested via curl or a REST client.

## 9. Dev B — realtime + lifecycle

*Acceptance:*

- src/lib/events.ts internals replaced with Redis pub/sub via ioredis. Public interface unchanged. Existing callers (POST handler, SSE handler) untouched.
- docker-compose.yml adds a Redis 7 service. pnpm db:reset and the existing dev flow still work.
- Two-instance proof: start app on :3000 and :3001 against the same Redis + MariaDB. Connect a customer to one, an agent to the other. Messages cross. Steps to reproduce in README.md. A short recording or screenshot attached to the PR.
- POST /api/conversations/[id]/close closes a conversation. Requires authenticated AGENT. Sets status = CLOSED. Publishes a closed event on the channel so connected clients can react.
- /agent list filters to status = OPEN (already true in MVP — verify it still holds).
- POST /api/messages rejects with 409 if the target conversation is CLOSED (existing OPEN check tightened — already required by section 2 of the MVP spec but make it explicit and tested).
- /chat flow: if the customer's existing conversation is CLOSED, on next /chat visit a new OPEN conversation is created. Customer sees a clean chat with empty history.
- Agent UI shows a "Close conversation" button on /agent/[id]. After close, the page redirects to /agent (now no longer in the list).

*Expectations:*

- Redis swap is internals-only. If a caller needs to change, the abstraction leaked — investigate before patching the caller.
- Two-instance proof is the verification that the swap actually works. Without it, the swap is unverified.
- Closed conversations are not deleted. History remains queryable; only status changes.

## 10. Collaboration rules

Same shape as the MVP spec. Slightly relaxed since both devs have the codebase.

1. *20-min joint sync at start.* Agree on the logger contract (Section 6) and the event-payload shape (does the published payload now carry requestId?). Push the agreed interfaces as stubs on main.
2. *Branches:* feat/hardening-infra (Dev A), feat/hardening-realtime (Dev B).
3. *Push at least every 90 minutes.*
4. *PR size cap: 300 lines of diff.* Generated files don't count.
5. *No self-merge.* Other dev reviews.
6. *Minimum 2 merges to main per dev* before the final integration check.
7. *Standups:* 5 min after the joint sync, 5 min midday, 5 min late afternoon.
8. *Conventional Commits.*

## 11. Definition of done

- All Section 2 success criteria pass on a fresh clone after: pnpm install && docker compose up -d && pnpm db:migrate && pnpm db:seed && pnpm dev
- Two-instance test reproduces per the README steps
- README.md updated for: Redis, two-instance run, new env keys, conversation lifecycle, rate limit behavior, promote endpoint usage
- No console.* calls remain in src/
- No secrets in the repo

## 12. Walkthrough + code review

- *Walkthrough (live, 20 min):* demo each Section 2 criterion. Run the two-instance proof live. Hit the rate limit. Promote a user. Close a conversation and start a new one as the same customer.
- *Code review (async, after walkthrough):* diff and commit history reviewed. Findings sent as PR comments.

## 13. Non-goals to resist

- Adding Redis-backed sessions or anything else "while we're here"
- Building admin UI for promote
- Switching the rate limit to Redis (in-memory is the spec)
- Replacing NextAuth callbacks while touching the logger
- Adding tests as a new initiative — improving existing test coverage where touched is fine, building a suite is not                                                                                                                                          [11:39 am, 11/05/2026] +880 1711-727248: Dev A's section:

Unit test for lib/rate-limit.ts — token bucket behavior (allow under limit, reject over, window reset)
Unit test for the promote endpoint's authorization logic (customer rejected, unauthenticated rejected, agent accepted, idempotent on already-agent)
[11:39 am, 11/05/2026] +880 1711-727248: Dev B's section:

Integration test for conversation close → reject new messages with 409
Integration test for closed-conversation → next /chat visit creates a new OPEN one                                                                      