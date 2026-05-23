---
name: check-actions-status
description: Check GitHub Actions status for the current branch and surface failures.
premium: false
order: 70
applies_when:
  githubActions: true
---
---
description: Check CI status for current branch
---

Check GitHub Actions status for the current branch.

1. Get the current branch: `git branch --show-current`.
2. Get the latest commit on this branch and look up its workflow runs via `gh run list --branch <branch> --limit 5`.
3. For each run, show: workflow name, status, conclusion, duration, URL.
4. If any failed, fetch the failing job's logs: `gh run view <run-id> --log-failed`. Extract the most-likely failure: the first FAIL/Error message, the failing test name, the failing step.
5. If failures are obvious from the diff (typo, missing import, broken type), propose a fix. Don't apply it — show me what you'd change.
6. If failures look environmental (network, flaky, infra), suggest re-running rather than chasing it.

Requires the `gh` CLI to be authenticated.
