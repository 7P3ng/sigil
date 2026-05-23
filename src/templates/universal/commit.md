---
name: commit
description: Stage, commit, and push the current changes with a conventional commit message.
premium: false
order: 10
applies_when:
  always: true
---
---
description: Stage relevant files and commit with a conventional message
---

Look at the current uncommitted changes in this repo and create a single commit.

1. Run `git status` and `git diff` (staged + unstaged) to see exactly what changed.
2. Group the changes into one logical commit. If they don't form a coherent commit, stop and tell me what should be split out.
3. Stage only the files that belong in this commit — never use `git add -A`. List files individually.
4. Write a conventional commit message:
   - First line: `<type>(<scope>): <subject>` in imperative mood, under 72 chars. Types: feat, fix, docs, style, refactor, test, chore, perf.
   - Skip the scope if it doesn't add clarity.
   - Add a body only if the *why* isn't obvious from the diff.
5. Run `{{testCommand}}` if there's something quick to check. Skip if it would take more than 30 seconds.
6. Commit (do NOT use `--no-verify` or skip hooks).
7. Do NOT push unless I explicitly tell you to.

Never commit `.env`, credentials, or anything that looks like a secret.
