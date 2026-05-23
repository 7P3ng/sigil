---
name: find-dead-code
description: Find unused exports, dead branches, and orphaned files in the codebase.
premium: false
order: 60
applies_when:
  always: true
---
---
description: Hunt for unused code paths
---

Look for code that's no longer reached.

1. **Unused exports.** For each exported function/type/constant in the codebase, grep for its name and confirm at least one external import. Surface anything with zero imports.
2. **Unreachable branches.** `if (false)`, conditions on flags that are always one value, switch cases that can't trigger.
3. **Orphaned files.** Files that aren't imported anywhere (entry points like `cli.ts`, `app/layout.tsx`, `manage.py`, `index.html` are exceptions — don't flag those).
4. **Stale dependencies.** Packages in `package.json` (or `pyproject.toml` / `requirements.txt`) that aren't referenced in source.

For each finding, give: file:line, what it is, and one-sentence reasoning. Group by category.

Don't actually delete anything — just produce the list. I'll decide what goes.
