---
name: add-server-action
description: Add a Next.js Server Action with Zod input validation and typed errors.
premium: false
order: 40
applies_when:
  framework: nextjs
  nextRouter: app
---
---
description: Scaffold a Server Action with validation
argument-hint: <action-name>
---

Add a Server Action named in $ARGUMENTS.

1. Put it in `app/<feature>/actions.ts` (or wherever existing actions live — check the codebase first).
2. Start the file with `"use server"`.
3. Validate the input with Zod. Reject invalid input with a typed error result — never throw raw exceptions across the action boundary.
4. The return type is a discriminated union: `{ ok: true; data: ... } | { ok: false; error: ... }`. Don't reject with HTTP-style codes; this is RPC, not REST.
5. If the action mutates data, call `revalidatePath` or `revalidateTag` for the affected routes at the end. Don't blast `revalidatePath("/")`.
6. If the action redirects, use `redirect()` from `next/navigation`, called AFTER the response shape is determined (redirect throws).
7. Add a tiny unit test if a test framework is configured (`{{testCommand}}`).

Do NOT:
- Use Server Actions to do work that should be a Route Handler (large file uploads, streaming, OAuth callbacks).
- Read from `cookies()` or `headers()` without checking the existing helper conventions in the codebase first.
