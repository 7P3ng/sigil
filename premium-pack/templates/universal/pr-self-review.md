---
name: pr-self-review
description: Self-review your work before pushing — catches the embarrassing stuff before review.
premium: true
order: 15
applies_when:
  always: true
---
---
description: Pre-push self-review
---

Pretend you're a senior engineer reviewing this PR cold. Be harsh but specific.

## Phase 1 — Get the diff

1. `git fetch origin && git diff origin/main...HEAD` (or whatever the base branch is — check `git remote show origin`).
2. Read it ALL. Don't skim.

## Phase 2 — The senior-reviewer checklist

Walk through these in order. For each, either give a one-line "clean" or a specific finding with file:line:

3. **Scope.** Does the diff do one thing? Are there incidental refactors, debug logs, or unrelated cleanups that should be in a separate PR?
4. **Tests.** What test would catch a regression? Is that test in this PR?
5. **Naming.** Any var/function name that needs to be re-read to understand? Any name that lies about what it does?
6. **Error handling.** Any caught exception that's silently swallowed? Any `catch (e) {}` or `.catch(() => null)`?
7. **Off-by-one / bounds.** Loops, slice indices, array access — any that look wrong?
8. **Async correctness.** Promises awaited that should be parallel? Promises NOT awaited that should be? Race conditions?
9. **Side effects in pure code.** Functions that look pure but write to state, console, or filesystem?
10. **Hardcoded values.** Magic numbers, env-specific paths, prod URLs in test code?
11. **Type safety.** Any `any`, `@ts-ignore`, `@ts-expect-error`, `# type: ignore`, unsafe cast that wasn't there before?
12. **Secrets.** Any string that looks like a key, token, password, or .env var leaking into committed code?
13. **Backwards compat.** Did you change a function signature, response shape, or DB column that has external consumers?

## Phase 3 — Output

14. Give me the findings as a prioritized list (P0 ship-blockers, P1 strong-fix-before-ship, P2 nits-if-time).
15. If you find nothing in any category, say so explicitly — don't just stay silent on a category.

Don't fix anything. Just produce the review.
