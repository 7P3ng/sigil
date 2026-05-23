---
name: add-package
description: Add a new package to the monorepo with proper workspace wiring.
premium: false
order: 30
applies_when:
  monorepo: true
---
---
description: Scaffold a new workspace package
argument-hint: <package-name>
---

Add a new package named $ARGUMENTS to the monorepo.

1. First read one existing package's structure (probably under `packages/` or `apps/`). Match its layout exactly — `package.json`, `tsconfig.json`, source dir, test setup.
2. Use the workspace's exact name format. If existing packages are `@org/foo`, use `@org/<name>`.
3. The `package.json` needs:
   - `"private": true` unless you specifically want it publishable.
   - `"main"` / `"exports"` pointing at the build output, not source.
   - The same `engines.node` as siblings.
4. Mirror the workspace's TypeScript config — extend the same base `tsconfig.base.json` (or whatever the convention is).
5. Wire it into the build orchestrator (turbo, nx, pnpm) — check `turbo.json` / `nx.json` for whether new packages auto-detect or need explicit listing.
6. Add the package to consumers' dependencies as `"workspace:*"` (pnpm) or `"workspace:^"` (yarn/npm).
7. Run `{{pmRun}} build` from the root to confirm the new package builds.

Do NOT:
- Add a dep that isn't already in the workspace's allow-list (root `package.json` often declares which version of common libs all packages must use).
- Duplicate a tsconfig that already exists in a base config.
