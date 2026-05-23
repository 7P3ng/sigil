---
name: audit-bundle
description: Find oversized client bundles, mis-imported server modules, and untreeshaken deps.
premium: true
order: 45
applies_when:
  framework: nextjs
---
---
description: Audit Next.js client bundle size
---

Audit this Next.js build for bundle bloat.

## Step 1 — Build with stats

1. Run `ANALYZE=true {{buildCommand}}` if the project already has `@next/bundle-analyzer` configured. If not, install it:
   ```
   {{pmRun}} add -D @next/bundle-analyzer
   ```
   Wire it into `next.config.ts` per their docs, then re-build. Don't permanently add the dep if I haven't agreed — show me the change first.
2. Open the resulting bundle report (or read the `.next/analyze/*.html` if non-interactive).

## Step 2 — The 6 patterns that cause bundle bloat

For each, grep + report:

3. **Server-only modules imported in client components.** Anything that imports `fs`, `path`, `node:*`, `pg`, `mysql2`, `aws-sdk`, etc. inside a file that has `"use client"` (directly or via transitive import).
4. **Date libraries in client bundles.** `moment` or full `date-fns` import (`import * as df from 'date-fns'`) instead of named imports. Suggest `dayjs` or named imports.
5. **Icon libraries imported wholesale.** `import { Icon1, Icon2 } from 'react-icons'` — re-export pattern often pulls everything. Prefer per-icon subpath: `import Icon1 from 'react-icons/fa/Icon1'`.
6. **MDX/markdown processors in client.** `remark`, `unified`, `shiki` in a `"use client"` file = MB of polyfill. Either move to a Server Component or pre-render at build.
7. **Validation libs duplicated.** Both `zod` and `yup`, or both `joi` and `zod`. Pick one.
8. **Polyfills for modern browsers.** `core-js` imports in app code (not auto-polyfilled by Next).

## Step 3 — Specific findings

9. Identify the top 3 client chunks by gzipped size. For each, list the top contributors. For each contributor over 30KB gzipped, propose: code-split, move-to-server, replace, or drop.
10. Identify any client component that imports a Server Component's helpers (these often pull in DB drivers via transitive imports). Use the `server-only` package or convert to a Server Component.

## Step 4 — Output

11. Give me a ranked list with: file path, current weight, proposed fix, estimated savings. Don't apply fixes — I'll choose.

Hard rule: don't suggest tree-shaking flags or webpack tweaks. Fix the imports, not the bundler.
