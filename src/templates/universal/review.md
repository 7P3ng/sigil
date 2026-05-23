---
name: review
description: Review the current uncommitted changes for bugs, style, and missing tests.
premium: false
order: 20
applies_when:
  always: true
---
---
description: Critique the current diff before commit
---

Review my current uncommitted changes (`git diff` plus untracked files via `git status`).

Focus on real problems, in priority order:

1. **Bugs.** Logic errors, off-by-one, null/undefined access, wrong async handling, race conditions, unhandled error cases, returns that don't match the type.
2. **Security.** Injection (SQL, command, XSS), secrets in code, missing authn/authz, unsafe deserialization, query-string auth.
3. **Tests missing.** If new logic was added, what test would catch a regression? If new logic was added without a test, flag it.
4. **Consistency with the rest of the codebase.** Look at neighboring files. Are we following existing patterns? Naming? Error handling style?
5. **Dead or duplicate code.** Anything we just wrote that's already in another file?

Skip pure style nits unless they hurt readability. Don't suggest renames or refactors unrelated to the diff.

Output the findings as a numbered list with file:line refs. If everything looks fine, say so in one sentence.
