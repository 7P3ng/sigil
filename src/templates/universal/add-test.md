---
name: add-test
description: Add a test for the most recently-modified file using the project's test runner.
premium: false
order: 50
applies_when:
  always: true
---
---
description: Add a test for the last-touched file
argument-hint: [file-path]
---

Add a test.

1. If $ARGUMENTS is set, target that file. Otherwise, target the most recently modified non-test source file (`git status` + `git log -1 --name-only`).
2. Read the target file completely and identify what's worth testing — public exports, branching logic, error paths, edge cases.
3. Find existing tests for similar files in this repo. Match their layout, naming conventions, and helper imports exactly — don't introduce a new style.
4. Write one test per behavior worth pinning down. Each test should fail for a real reason if the implementation breaks. Avoid trivial "function returns" tests.
5. Run `{{testCommand}}` and confirm:
   - The new tests pass.
   - No existing tests regressed.
6. If `{{testCommand}}` doesn't resolve to a real command (`(no test runner detected)`), tell me — don't guess.

Don't mock dependencies unless the repo already mocks them in similar tests. Prefer real implementations + minimal fixtures.
