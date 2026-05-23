---
name: fix-bug
description: Systematic debugging — minimal repro, failing test, root-cause fix, regression test.
premium: true
order: 5
applies_when:
  always: true
---
---
description: Debug a bug from the root, not the symptom
argument-hint: <bug description or issue link>
---

We are fixing the bug described in $ARGUMENTS. This is a debug workflow, not a quick patch — don't shortcut it.

## Step 1 — Reproduce

1. Restate the bug in one sentence. Include: what should happen, what actually happens, the trigger.
2. Reproduce it locally. If you can't reproduce, stop and ask me for more context — don't speculate.
3. If repro requires data, capture the minimal dataset (one row, one fixture). Write that down.

## Step 2 — Localize before fixing

4. Trace from symptom to root: what line emits the bad behavior? What function calls that line? Walk the call stack backwards by reading code, not guessing.
5. Form a hypothesis about the root cause. Write it down in one sentence.
6. CONFIRM the hypothesis with one targeted check (a console.log, a debugger, a unit test). Don't fix until the hypothesis is confirmed — you'll patch the wrong line.

## Step 3 — Write a failing test that catches THIS bug

7. Add a test that exercises the exact failure path. Match the existing test style. Run it — confirm it fails for the right reason.

## Step 4 — Fix at the root

8. Make the minimum change to fix the root cause. Do NOT:
   - Wrap the symptom in a try/catch to silence it.
   - Add a special-case branch for the failing input.
   - Add defensive checks on every call site instead of fixing the source.
9. Run the new test — confirm green.
10. Run `{{testCommand}}` and confirm no regression elsewhere.

## Step 5 — Look one level deeper

11. Could this same root cause have broken anything else? Grep for similar patterns. If yes, fix those too — or write down what you found and tell me.

## Step 6 — Stop and report

12. Show me: the one-sentence root cause, the test that catches it, the diff. Don't commit yet.

Hard rules:
- "It works now" with no failing test reproduced first = not done.
- Suppressing errors to make a test pass = not a fix.
- Catch + log + continue when the right answer is "fail loudly" = anti-pattern.
