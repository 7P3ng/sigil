---
name: add-route
description: Add a new Next.js App Router route with loading and error boundaries.
premium: false
order: 30
applies_when:
  framework: nextjs
  nextRouter: app
---
---
description: Scaffold a new App Router route
argument-hint: <route-path>
---

Create a new App Router route at the path I specify in $ARGUMENTS.

1. Create `app/<route>/page.tsx` as a **Server Component** by default. Do NOT add `"use client"` unless the page needs interactivity.
2. If the page does any data fetching, do it directly in the Server Component using `async`. No `useEffect` for data fetching.
3. Add `app/<route>/loading.tsx` with a sensible skeleton or fallback.
4. Add `app/<route>/error.tsx` with `"use client"` and a reset button. Errors must be recoverable.
5. If the route accepts dynamic params (`[slug]` or `[id]`), type them properly and validate at the boundary — don't trust `params` without parsing.
6. Match the existing visual conventions: import the same UI primitives the other routes use (look at one other `page.tsx` in `app/`).
7. Run `{{typecheckCommand}}` and confirm zero errors before declaring done.

Do NOT:
- Add a client component wrapper unless interactivity is actually needed.
- Touch `app/layout.tsx` (unless I asked for layout changes).
- Add new dependencies without checking with me first.
