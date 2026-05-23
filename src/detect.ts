import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import type {
  StackProfile,
  ScriptKind,
} from "./types.js";

/**
 * Inspect a repo root and return a StackProfile describing what's in it.
 *
 * Pure synchronous file reads — fast enough for any repo (<100ms typical).
 * Never throws on missing files; absent signals just don't set the flag.
 */
export function detectStack(repoRoot: string): StackProfile {
  const root = resolve(repoRoot);
  const profile: StackProfile = {
    packageManager: detectPackageManager(root),
    languages: new Set(),
    frameworks: new Set(),
    testRunners: new Set(),
    databases: new Set(),
    isMonorepo: false,
    hasTypeScript: false,
    hasGithubActions: false,
    nextRouter: null,
    scripts: {},
    repoRoot: root,
  };

  // --- Node ecosystem signals ---
  const pkgPath = join(root, "package.json");
  if (existsSync(pkgPath)) {
    const pkg = safeJson(pkgPath);
    if (pkg) {
      profile.languages.add("javascript");
      detectNodeFrameworks(pkg, profile);
      detectNodeTestRunners(pkg, profile);
      detectNodeDatabases(pkg, profile);
      extractNodeScripts(pkg, profile);

      if (pkg.workspaces || existsSync(join(root, "pnpm-workspace.yaml")) ||
          existsSync(join(root, "turbo.json")) || existsSync(join(root, "nx.json"))) {
        profile.isMonorepo = true;
      }
    }
  }

  if (existsSync(join(root, "tsconfig.json"))) {
    profile.hasTypeScript = true;
    profile.languages.add("typescript");
  }

  // Next.js router shape
  if (profile.frameworks.has("nextjs")) {
    const hasApp = existsSync(join(root, "app")) || existsSync(join(root, "src/app"));
    const hasPages = existsSync(join(root, "pages")) || existsSync(join(root, "src/pages"));
    if (hasApp && hasPages) profile.nextRouter = "both";
    else if (hasApp) profile.nextRouter = "app";
    else if (hasPages) profile.nextRouter = "pages";
  }

  // --- Python ecosystem ---
  if (existsSync(join(root, "pyproject.toml")) ||
      existsSync(join(root, "requirements.txt")) ||
      existsSync(join(root, "setup.py"))) {
    profile.languages.add("python");
    detectPythonStack(root, profile);
  }

  // --- Other languages (light touch) ---
  if (existsSync(join(root, "go.mod"))) profile.languages.add("go");
  if (existsSync(join(root, "Cargo.toml"))) profile.languages.add("rust");
  if (existsSync(join(root, "Gemfile"))) profile.languages.add("ruby");
  if (existsSync(join(root, "composer.json"))) profile.languages.add("php");

  // --- CI ---
  const workflowsDir = join(root, ".github", "workflows");
  if (existsSync(workflowsDir) && safeIsDir(workflowsDir)) {
    const entries = safeReaddir(workflowsDir);
    if (entries.some((f) => f.endsWith(".yml") || f.endsWith(".yaml"))) {
      profile.hasGithubActions = true;
    }
  }

  // --- Makefile script extraction (overrides if more specific) ---
  const makefile = join(root, "Makefile");
  if (existsSync(makefile)) {
    extractMakefileScripts(makefile, profile);
  }

  return profile;
}

function detectPackageManager(root: string): StackProfile["packageManager"] {
  if (existsSync(join(root, "bun.lockb")) || existsSync(join(root, "bun.lock"))) return "bun";
  if (existsSync(join(root, "pnpm-lock.yaml"))) return "pnpm";
  if (existsSync(join(root, "yarn.lock"))) return "yarn";
  if (existsSync(join(root, "package-lock.json"))) return "npm";
  if (existsSync(join(root, "package.json"))) return "npm";
  return null;
}

interface PkgJson {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  scripts?: Record<string, string>;
  workspaces?: string[] | { packages?: string[] };
  bin?: string | Record<string, string>;
}

function detectNodeFrameworks(pkg: PkgJson, profile: StackProfile): void {
  const deps = allDeps(pkg);
  const has = (name: string) => Object.prototype.hasOwnProperty.call(deps, name);

  if (has("next")) profile.frameworks.add("nextjs");
  if (has("react") && !profile.frameworks.has("nextjs")) profile.frameworks.add("react");
  if (has("vue") || has("nuxt")) profile.frameworks.add("vue");
  if (has("svelte") || has("@sveltejs/kit")) profile.frameworks.add("svelte");
  if (has("astro")) profile.frameworks.add("astro");
  if (has("@remix-run/node")) profile.frameworks.add("remix");
  if (has("express")) profile.frameworks.add("express");
  if (has("fastify")) profile.frameworks.add("fastify");
  if (has("hono")) profile.frameworks.add("hono");

  // CLI heuristic: bin field present, no web framework detected
  if (pkg.bin && profile.frameworks.size === 0) {
    profile.frameworks.add("node-cli");
  }
}

function detectNodeTestRunners(pkg: PkgJson, profile: StackProfile): void {
  const deps = allDeps(pkg);
  if (deps.vitest) profile.testRunners.add("vitest");
  if (deps.jest || deps["@jest/core"]) profile.testRunners.add("jest");
  if (deps["@playwright/test"] || deps.playwright) profile.testRunners.add("playwright");
}

function detectNodeDatabases(pkg: PkgJson, profile: StackProfile): void {
  const deps = allDeps(pkg);
  if (deps.prisma || deps["@prisma/client"]) profile.databases.add("prisma");
  if (deps["drizzle-orm"]) profile.databases.add("drizzle");
  if (deps["@supabase/supabase-js"]) profile.databases.add("supabase");
  if (deps.pg || deps.postgres) profile.databases.add("postgres-raw");
}

function extractNodeScripts(pkg: PkgJson, profile: StackProfile): void {
  if (!pkg.scripts) return;
  const knownKeys: ScriptKind[] = [
    "dev", "build", "start", "test", "lint", "typecheck", "format", "deploy", "migrate",
  ];
  for (const key of knownKeys) {
    if (pkg.scripts[key]) profile.scripts[key] = pkg.scripts[key];
  }
  // Aliases
  if (!profile.scripts.typecheck && pkg.scripts["type-check"]) {
    profile.scripts.typecheck = pkg.scripts["type-check"];
  }
  if (!profile.scripts.typecheck && pkg.scripts.tsc) {
    profile.scripts.typecheck = pkg.scripts.tsc;
  }
}

function detectPythonStack(root: string, profile: StackProfile): void {
  const candidates = [
    join(root, "pyproject.toml"),
    join(root, "requirements.txt"),
    join(root, "setup.py"),
  ];
  const combined = candidates
    .filter(existsSync)
    .map((p) => safeRead(p))
    .filter((x): x is string => x !== null)
    .join("\n")
    .toLowerCase();

  const has = (needle: string) => combined.includes(needle);

  if (has("fastapi")) profile.frameworks.add("fastapi");
  if (has("django")) profile.frameworks.add("django");
  if (has("flask")) profile.frameworks.add("flask");

  if (has("pytest")) profile.testRunners.add("pytest");
  if (has("alembic")) profile.databases.add("alembic");
  if (profile.frameworks.has("django")) profile.databases.add("django-orm");
}

function extractMakefileScripts(path: string, profile: StackProfile): void {
  const content = safeRead(path);
  if (!content) return;
  // Targets look like "name:" at column 0.
  const targetRegex = /^([a-zA-Z][a-zA-Z0-9_-]*):/gm;
  const targets = new Set<string>();
  for (const m of content.matchAll(targetRegex)) {
    if (m[1]) targets.add(m[1].toLowerCase());
  }
  const map: Record<string, ScriptKind> = {
    dev: "dev",
    serve: "dev",
    run: "dev",
    build: "build",
    test: "test",
    lint: "lint",
    typecheck: "typecheck",
    fmt: "format",
    format: "format",
    deploy: "deploy",
    migrate: "migrate",
  };
  for (const [target, kind] of Object.entries(map)) {
    if (targets.has(target) && !profile.scripts[kind]) {
      profile.scripts[kind] = `make ${target}`;
    }
  }
}

// ---------- helpers ----------

function allDeps(pkg: PkgJson): Record<string, string> {
  return { ...(pkg.dependencies ?? {}), ...(pkg.devDependencies ?? {}) };
}

function safeJson(path: string): PkgJson | null {
  const raw = safeRead(path);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as PkgJson;
  } catch {
    return null;
  }
}

function safeRead(path: string): string | null {
  try {
    return readFileSync(path, "utf8");
  } catch {
    return null;
  }
}

function safeIsDir(path: string): boolean {
  try {
    return statSync(path).isDirectory();
  } catch {
    return false;
  }
}

function safeReaddir(path: string): string[] {
  try {
    return readdirSync(path);
  } catch {
    return [];
  }
}
