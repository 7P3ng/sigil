---
name: add-feature
description: Add a feature using TDD — failing test first, then implementation, then refactor.
premium: true
order: 5
applies_when:
  always: true
---
---
description: Add a feature, TDD-first
argument-hint: <feature description>
---

We are adding the feature described in $ARGUMENTS using strict TDD. Do not skip the discipline below — the discipline is the value.

## Phase 1 — Understand before touching code

1. Re-read $ARGUMENTS and restate the requirement in one sentence. If anything is ambiguous, stop and ask me ONE question. Don't ask three.
2. Scan the codebase for the area that owns this feature. Read 2-3 nearby files in full so you understand the local patterns.
3. List the test files that would naturally cover this — by convention from existing tests, not by your own preference.

## Phase 2 — Write the test FIRST

4. Write a failing test for the feature. The test must:
   - Pin down observable behavior, not implementation details.
   - Use the same helpers, fixtures, and mocking style as existing tests.
   - Cover at minimum: happy path + one realistic failure mode.
5. Run `{{testCommand}}` — confirm the new test fails for the RIGHT reason (the feature doesn't exist yet — not a typo, not a missing import).

## Phase 3 — Implement the minimum that passes

6. Write the smallest implementation that makes the test pass. Don't add error handling that isn't tested. Don't add helpers you don't need yet. Don't refactor neighboring code.
7. Run `{{testCommand}}` — confirm green.
8. Run `{{typecheckCommand}}` and `{{lintCommand}}` — fix any new errors, don't suppress them.

## Phase 4 — Refactor if needed

9. Look at what you wrote: is anything obviously off-pattern, duplicating other code, or unclear? Improve in place. Tests stay green throughout.

## Phase 5 — Stop

10. Show me the diff (`git diff`) before committing. Don't commit yet — I'll review.

Hard rules:
- Don't add tests just to inflate coverage. Each test must pin a behavior I'd care about breaking.
- Don't mock things the existing tests don't mock.
- Don't add a feature flag, config knob, or telemetry hook unless the task explicitly calls for it.
