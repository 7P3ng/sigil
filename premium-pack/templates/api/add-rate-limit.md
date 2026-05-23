---
name: add-rate-limit
description: Add per-route rate limiting with sensible defaults and a redis-or-memory backend.
premium: true
order: 55
applies_when:
  framework: [nextjs, express, fastify, fastapi, django]
---
---
description: Add rate limiting to a route
argument-hint: <route-path>
---

Add rate limiting to the route at $ARGUMENTS.

## Step 1 — Decide the limit

1. Tell me what kind of route this is, then pick a default:
   - Authenticated read: 60/min per user.
   - Authenticated mutation: 20/min per user.
   - Unauthenticated public form: 5/min per IP.
   - Auth endpoint (login, signup, password-reset): 5/min per IP + 10/hour per email.
   - LLM/expensive compute: 10/min per user, 100/day per user.
2. If the route doesn't fit cleanly, ask me — don't default to "100/min" as a generic.

## Step 2 — Pick a backend

3. Detect what's available:
   - If Redis is configured anywhere in the codebase (search for `ioredis`, `redis`, `upstash`), use it.
   - If Upstash is configured, use `@upstash/ratelimit`.
   - If neither, use an in-memory limiter (`lru-cache`-backed) and tell me — single-instance only, NOT safe behind a load balancer.

## Step 3 — Implement

4. Add the limiter at the route boundary, not deep in business logic. Reject with `429 Too Many Requests` and a `Retry-After` header.
5. Key derivation:
   - Authenticated: user ID, not session ID (sessions rotate).
   - Unauthenticated: derive IP from `x-forwarded-for` if behind a proxy. NEVER trust `req.ip` if behind Vercel/Cloudflare — use the proxy header.
6. Return a clear error body: `{ error: "rate_limited", retryAfter: <seconds> }`. The client needs to surface this to the user.
7. Add headers on success too: `X-RateLimit-Remaining`, `X-RateLimit-Reset`. Cheap to set, very useful for clients.

## Step 4 — Test

8. Add a test that fires (limit + 1) requests and asserts the (limit + 1)-th is 429. Skip the test if the project doesn't have an integration test harness; don't fabricate one.

## Step 5 — Observability

9. Add a log line on rate-limit hits (level=warn) with key, route, and current count. Without this, you'll never know a real user is being throttled.

Hard rules:
- Never put the rate limit AFTER the expensive operation. Limit before the work.
- Never use the session token or cookie as the rate-limit key — sessions rotate, allowing trivial evasion.
- Never store the limiter state in the database. Redis or memory only.
