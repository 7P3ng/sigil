# cc-commands

**Generate Claude Code slash commands tailored to your repo.**

Run once. Get a `.claude/commands/` directory full of slash commands that match your actual stack — your test runner, your framework, your package manager, your conventions. No more copy-pasting other people's commands and editing them by hand.

```
$ npx cc-commands

Detected stack:
  pkgmgr      pnpm
  languages   javascript, typescript
  frameworks  nextjs
  tests       vitest
  flags       typescript, next-router:app

Wrote 7 commands:
  ✓ /commit
  ✓ /review
  ✓ /add-route
  ✓ /add-server-action
  ✓ /add-api-route
  ✓ /add-test
  ✓ /find-dead-code
  → .claude/commands/

+7 premium commands available for this stack:
  ○ /add-feature   — Add a feature using TDD — failing test first.
  ○ /fix-bug       — Systematic debugging — minimal repro, failing test.
  ○ /pr-self-review — Self-review your work before pushing.
  ○ /safe-rename   — Rename a TS symbol across the codebase safely.
  ○ /optimize-rerenders — Find re-render hotspots in React.
  ○ /audit-bundle  — Find oversized client bundles in Next.js.
  ○ /add-rate-limit — Add per-route rate limiting.
```

## Why

Claude Code lets you write custom slash commands as markdown files in `.claude/commands/`. The defaults are generic. Writing good custom ones means knowing:

- Where to put them
- What's worth a command (and what isn't)
- How to phrase them so Claude actually does the right thing
- How to reference your stack's specifics (your test command, your migration tool, your framework conventions)

`cc-commands` scans your repo and writes commands that are **stack-aware** — the `/commit` for a pnpm + vitest repo runs `pnpm test`, the `/commit` for a poetry + pytest repo runs `pytest`. Same for `/add-route` (Next.js App Router vs Pages), `/add-model` (Django vs Prisma vs Drizzle), etc.

## Install & run

```bash
# Run once in your repo, no install needed
npx cc-commands

# Or scan a specific dir
npx cc-commands --dir path/to/repo

# Preview without writing
npx cc-commands --dry-run
```

The CLI writes to `.claude/commands/` in the target directory. Open that repo in Claude Code and your commands show up as `/<name>`.

## What's in the free tier (12 commands)

Stack-aware commands across:

- **Universal** — `/commit`, `/review`, `/add-test`, `/find-dead-code`
- **Next.js App Router** — `/add-route`, `/add-server-action`, `/add-api-route`
- **FastAPI** — `/add-endpoint`, `/add-pydantic-model`
- **Django** — `/add-view`, `/add-model`
- **Monorepo** — `/add-package`
- **GitHub Actions** — `/check-actions-status`

## Premium pack — $19 one-time

8 deeper commands that are deliberately sharper and longer:

| Command | What it does |
|---|---|
| `/add-feature` | TDD-first feature add — failing test, minimum impl, refactor |
| `/fix-bug` | Systematic debugging — repro, root cause, regression test, no symptom-patching |
| `/pr-self-review` | Senior-reviewer self-review checklist before pushing |
| `/safe-rename` | Cross-codebase TypeScript symbol rename — exports, callers, type refs |
| `/optimize-rerenders` | Hunt React re-render hotspots — bad memo, unstable refs, context fan-out |
| `/audit-bundle` | Find oversized Next.js client bundles, server modules in client |
| `/safe-migration` | Generate deploy-safe DB migrations — Prisma, Drizzle, Alembic, Django |
| `/add-rate-limit` | Per-route rate limiting with proper IP/user keys and 429 responses |

These take repo conventions into account just like the free tier, but each goes further: enforces TDD discipline, pushes back on anti-patterns, refuses to suppress errors.

### How to install the premium pack after purchase

You'll get a zip via email. Drop it in:

```bash
~/.cc-commands/templates/
```

Re-run `npx cc-commands` — premium templates now render automatically. No license key, no env var. The CLI just sees they're there.

### Buy

→ **[cc-commands.thomaspeng.ca](https://cc-commands.thomaspeng.ca)**

## How it works

1. **Detect.** The CLI reads `package.json`, `pyproject.toml`, `requirements.txt`, `Makefile`, `.github/workflows/`, lockfiles, and top-level dirs to build a `StackProfile`.
2. **Match.** Each template has an `applies_when` clause (framework, language, monorepo, etc.). The CLI filters to templates whose conditions match.
3. **Render.** Substitutes `{{packageManager}}`, `{{testCommand}}`, `{{typecheckCommand}}` etc. with the values from your stack.
4. **Write.** Outputs to `.claude/commands/<name>.md`.

No LLM at runtime. Deterministic, fast (<100ms), no API key needed.

## Roadmap

- [ ] npm publish (currently install via `npx github:thomaspeng/cc-commands`)
- [ ] More stacks: SvelteKit, Astro, Rails, Phoenix
- [ ] Per-team template overrides (extend the built-in templates without forking)
- [ ] CI hook — run on every PR, comment if commands are stale

## License

MIT for the CLI and free templates. The premium pack is licensed for personal + commercial use by the buyer's team; no redistribution.
