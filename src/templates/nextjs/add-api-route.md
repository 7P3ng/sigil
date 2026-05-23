---
name: add-api-route
description: Add a Next.js App Router Route Handler with Zod validation and proper error responses.
premium: false
order: 50
applies_when:
  framework: nextjs
  nextRouter: app
---
---
description: Scaffold a Route Handler
argument-hint: <method> <path>
---

Add a Route Handler for $ARGUMENTS (e.g. `POST /api/foo`).

1. Create `app/api/<path>/route.ts`.
2. Export the method handler: `export async function POST(req: Request) { ... }`.
3. Parse and validate the request body with Zod. Return `400` with a JSON error shape for invalid input — don't trust client input.
4. Use a consistent error shape across the codebase. If one already exists (check other route.ts files), reuse it. Don't invent a new shape.
5. Return `Response.json(...)` with appropriate status codes. Don't return raw `new Response(JSON.stringify(...))`.
6. Wrap the handler body in try/catch ONLY if you can do something useful in the catch. Don't swallow errors into 500s without logging.
7. If the route is public-mutation (POST/PUT/DELETE without auth), add a TODO marking it for rate-limiting consideration.
8. Run `{{typecheckCommand}}`.

Auth check: if every other route in this codebase calls an `auth()` or `getSession()` helper, this one should too. Don't ship an unauthenticated route by default unless I specifically said it's public.
