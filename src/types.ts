/**
 * Canonical description of a repo's tech stack, produced by the detector
 * and consumed by templates to decide which slash commands to emit.
 */
export interface StackProfile {
  /** Package managers detected by lockfile presence. */
  packageManager: "npm" | "pnpm" | "yarn" | "bun" | null;
  /** Top-level languages detected. */
  languages: Set<Language>;
  /** Frameworks detected via dependency manifests or config files. */
  frameworks: Set<Framework>;
  /** Test runners detected. */
  testRunners: Set<TestRunner>;
  /** Database/ORM layer detected. */
  databases: Set<Database>;
  /** True if monorepo (workspaces in package.json, turbo, nx, pnpm-workspace). */
  isMonorepo: boolean;
  /** True if uses TypeScript (tsconfig.json present). */
  hasTypeScript: boolean;
  /** True if a .github/workflows/* directory exists. */
  hasGithubActions: boolean;
  /** True if Next.js using App Router (app/ dir or src/app/ dir present). */
  nextRouter: "app" | "pages" | "both" | null;
  /** Detected commands inferred from package.json scripts or Makefile. */
  scripts: Partial<Record<ScriptKind, string>>;
  /** Absolute path to repo root. */
  repoRoot: string;
}

export type Language =
  | "typescript"
  | "javascript"
  | "python"
  | "go"
  | "rust"
  | "ruby"
  | "php";

export type Framework =
  | "nextjs"
  | "react"
  | "vue"
  | "svelte"
  | "astro"
  | "remix"
  | "express"
  | "fastify"
  | "hono"
  | "fastapi"
  | "django"
  | "flask"
  | "rails"
  | "node-cli";

export type TestRunner = "vitest" | "jest" | "playwright" | "pytest" | "go-test";

export type Database =
  | "prisma"
  | "drizzle"
  | "alembic"
  | "django-orm"
  | "supabase"
  | "postgres-raw";

/** Common script-kind keys we try to extract from package.json or Makefile. */
export type ScriptKind =
  | "dev"
  | "build"
  | "start"
  | "test"
  | "lint"
  | "typecheck"
  | "format"
  | "deploy"
  | "migrate";

/**
 * Metadata block at the top of every template file (YAML-ish frontmatter
 * parsed manually — no yaml dep needed).
 */
export interface TemplateMeta {
  /** File-system name (no extension) — becomes the slash command name. */
  name: string;
  /** One-line description shown in the CLI summary. */
  description: string;
  /** Conditions that must match the StackProfile for this template to apply. */
  appliesWhen: AppliesWhen;
  /** True if this template is in the premium pack (gated behind purchase). */
  premium: boolean;
  /** Sort key — lower = earlier in summary output. */
  order: number;
}

export interface AppliesWhen {
  framework?: Framework | Framework[];
  language?: Language | Language[];
  packageManager?: StackProfile["packageManager"];
  testRunner?: TestRunner | TestRunner[];
  database?: Database | Database[];
  monorepo?: boolean;
  typescript?: boolean;
  githubActions?: boolean;
  nextRouter?: "app" | "pages";
  /** If set, applies only if all listed scripts exist in detected scripts. */
  hasScript?: ScriptKind[];
  /** If true, applies to every stack (universal templates). */
  always?: true;
}

export interface LoadedTemplate {
  meta: TemplateMeta;
  /** Raw markdown body after frontmatter. */
  body: string;
  /** Where the template was loaded from (built-in vs premium). */
  source: "builtin" | "premium";
  /** Path to the source file, for debugging. */
  sourcePath: string;
}

export interface RenderResult {
  /** Templates that matched the stack and were written. */
  written: { name: string; path: string; premium: boolean }[];
  /** Templates that matched but were skipped because premium gate is closed. */
  gated: { name: string; description: string }[];
  /** Templates that did not match the stack. */
  skipped: number;
}
