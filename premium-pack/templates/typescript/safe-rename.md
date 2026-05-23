---
name: safe-rename
description: Rename a TypeScript symbol across the codebase safely — exports, callers, type refs, tests.
premium: true
order: 25
applies_when:
  language: typescript
---
---
description: Cross-codebase TS rename
argument-hint: <old-name> -> <new-name>
---

Rename a TypeScript symbol from $ARGUMENTS. Treat this as a refactor, not a find-and-replace.

1. Parse $ARGUMENTS into `old` and `new` names. If the format isn't `OldName -> NewName`, ask me.
2. Find the canonical definition: `grep -rn "function $OLD\\|class $OLD\\|const $OLD\\|export.*$OLD" --include='*.ts' --include='*.tsx'`. Confirm there's exactly ONE definition. If there are multiple, list them and stop.
3. Find every reference:
   - Imports: `import { $OLD } from`, `import $OLD from`.
   - Re-exports: `export { $OLD }`, `export * as $OLD`.
   - Type references: `: $OLD`, `<$OLD>`, `extends $OLD`, `implements $OLD`.
   - String usages (cautious): JSX components, decorators, `class:$OLD`. Don't rename strings that *look* like the symbol but aren't (e.g. CSS class names that happen to match).
4. Apply the rename with `sed` or your editor — one file at a time, not a blanket project-wide replace, because string matches can over-match.
5. Run `{{typecheckCommand}}` — fix any leftovers it surfaces.
6. Run `{{testCommand}}` — confirm green.
7. Look for things that should also rename but won't appear in references:
   - The file itself if its name encodes the symbol (`OldName.ts` → `NewName.ts`).
   - Test file: `OldName.test.ts` / `__tests__/OldName.test.ts`.
   - Storybook stories, MDX docs, README code samples.
8. Show me `git diff --stat` to confirm the scope matches expectation.

Hard rules:
- Do NOT use `git ls-files | xargs sed -i 's/$OLD/$NEW/g'` — string replacement breaks substrings (`OldName` inside `OldNameDeprecated`).
- Do NOT rename across unrelated symbols that happen to share the name (a local var called `user` is not the same as an exported type `User`).
