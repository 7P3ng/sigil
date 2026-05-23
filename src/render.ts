import { readFileSync, readdirSync, statSync, mkdirSync, writeFileSync, existsSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { homedir } from "node:os";
import type {
  StackProfile,
  TemplateMeta,
  AppliesWhen,
  LoadedTemplate,
  RenderResult,
} from "./types.js";

export interface CatalogEntry {
  name: string;
  description: string;
  order: number;
  appliesWhen: AppliesWhen;
}

/**
 * Load the premium catalog (just frontmatter, no bodies) that ships alongside
 * the free CLI so we can advertise premium templates the user hasn't bought.
 *
 * Returns empty array if the catalog file is missing (e.g. running from src/).
 */
export function loadPremiumCatalog(): CatalogEntry[] {
  const here = dirname(fileURLToPath(import.meta.url));
  const path = join(here, "premium-catalog.json");
  if (!existsSync(path)) return [];
  try {
    return JSON.parse(readFileSync(path, "utf8")) as CatalogEntry[];
  } catch {
    return [];
  }
}

/** Catalog entries that match the stack — these are the "you're missing this" pitch. */
export function applicableCatalog(
  entries: CatalogEntry[],
  profile: StackProfile,
): CatalogEntry[] {
  return entries
    .filter((e) => matchesStack(e.appliesWhen, profile))
    .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));
}

/**
 * Locations to scan for template files.
 *   - Built-in templates live next to the compiled CLI (dist/templates/).
 *   - Premium templates live in $CC_COMMANDS_DIR or ~/.cc-commands/templates/.
 */
export function templateRoots(): { builtin: string; premium: string } {
  // dist/cli.js sits next to dist/templates/ at runtime.
  // src/render.ts (dev mode) sits next to src/templates/.
  const here = dirname(fileURLToPath(import.meta.url));
  const builtin = join(here, "templates");

  const premium = process.env.CC_COMMANDS_DIR
    ? resolve(process.env.CC_COMMANDS_DIR, "templates")
    : join(homedir(), ".cc-commands", "templates");

  return { builtin, premium };
}

/**
 * Load every template found in built-in and (if present) premium directories.
 * Silently ignores files that don't parse — surface that as a count, not a throw.
 */
export function loadAllTemplates(): { templates: LoadedTemplate[]; errors: string[] } {
  const { builtin, premium } = templateRoots();
  const templates: LoadedTemplate[] = [];
  const errors: string[] = [];

  for (const [root, source] of [[builtin, "builtin"], [premium, "premium"]] as const) {
    if (!existsSync(root)) continue;
    for (const path of walkMarkdown(root)) {
      try {
        templates.push(parseTemplate(path, source));
      } catch (err) {
        errors.push(`${path}: ${(err as Error).message}`);
      }
    }
  }

  return { templates, errors };
}

/**
 * Filter templates down to ones whose `applies_when` matches the stack,
 * then render bodies and write each one to `.claude/commands/<name>.md`.
 */
export function renderTemplates(
  templates: LoadedTemplate[],
  profile: StackProfile,
  options: { gatePremium: boolean; dryRun: boolean; outputDir: string },
): RenderResult {
  const result: RenderResult = { written: [], gated: [], skipped: 0 };
  const applicable = templates.filter((t) => matchesStack(t.meta.appliesWhen, profile));
  result.skipped = templates.length - applicable.length;

  applicable.sort((a, b) => a.meta.order - b.meta.order || a.meta.name.localeCompare(b.meta.name));

  for (const tpl of applicable) {
    if (tpl.meta.premium && options.gatePremium) {
      result.gated.push({ name: tpl.meta.name, description: tpl.meta.description });
      continue;
    }
    const rendered = substitute(tpl.body, profile);
    const outPath = join(options.outputDir, `${tpl.meta.name}.md`);
    if (!options.dryRun) {
      mkdirSync(dirname(outPath), { recursive: true });
      writeFileSync(outPath, rendered, "utf8");
    }
    result.written.push({ name: tpl.meta.name, path: outPath, premium: tpl.meta.premium });
  }

  return result;
}

/**
 * Substitute {{variable}} placeholders against the stack profile.
 * Unknown placeholders are left intact so they're easy to spot when broken.
 */
export function substitute(body: string, profile: StackProfile): string {
  const vars: Record<string, string> = {
    packageManager: profile.packageManager ?? "npm",
    pmRun: pmRunCommand(profile.packageManager),
    pmExec: pmExecCommand(profile.packageManager),
    testCommand: profile.scripts.test
      ? `${pmRunCommand(profile.packageManager)} test`
      : guessTestCommand(profile),
    devCommand: profile.scripts.dev
      ? `${pmRunCommand(profile.packageManager)} dev`
      : guessDevCommand(profile),
    buildCommand: profile.scripts.build
      ? `${pmRunCommand(profile.packageManager)} build`
      : "(no build script detected)",
    typecheckCommand: profile.scripts.typecheck
      ? `${pmRunCommand(profile.packageManager)} typecheck`
      : profile.hasTypeScript
      ? `${pmExecCommand(profile.packageManager)} tsc --noEmit`
      : "(no typecheck configured)",
    lintCommand: profile.scripts.lint
      ? `${pmRunCommand(profile.packageManager)} lint`
      : "(no lint script detected)",
    nextRouter: profile.nextRouter ?? "app",
  };

  return body.replace(/\{\{(\w+)\}\}/g, (whole, key: string) => {
    return vars[key] ?? whole;
  });
}

function pmRunCommand(pm: StackProfile["packageManager"]): string {
  switch (pm) {
    case "pnpm": return "pnpm";
    case "yarn": return "yarn";
    case "bun": return "bun run";
    case "npm":
    default: return "npm run";
  }
}

function pmExecCommand(pm: StackProfile["packageManager"]): string {
  switch (pm) {
    case "pnpm": return "pnpm exec";
    case "yarn": return "yarn";
    case "bun": return "bunx";
    case "npm":
    default: return "npx";
  }
}

function guessTestCommand(profile: StackProfile): string {
  if (profile.testRunners.has("vitest")) return `${pmExecCommand(profile.packageManager)} vitest run`;
  if (profile.testRunners.has("jest")) return `${pmExecCommand(profile.packageManager)} jest`;
  if (profile.testRunners.has("playwright")) return `${pmExecCommand(profile.packageManager)} playwright test`;
  if (profile.testRunners.has("pytest")) return "pytest";
  return "(no test runner detected)";
}

function guessDevCommand(profile: StackProfile): string {
  if (profile.frameworks.has("django")) return "python manage.py runserver";
  if (profile.frameworks.has("fastapi")) return "uvicorn app.main:app --reload";
  if (profile.frameworks.has("flask")) return "flask run --debug";
  return "(no dev command detected)";
}

/**
 * Does this stack profile satisfy the template's appliesWhen clause?
 * Multiple keys are ANDed; arrays inside a key are ORed.
 */
export function matchesStack(applies: AppliesWhen, profile: StackProfile): boolean {
  if (applies.always) return true;

  if (applies.framework) {
    const wanted = Array.isArray(applies.framework) ? applies.framework : [applies.framework];
    if (!wanted.some((f) => profile.frameworks.has(f))) return false;
  }
  if (applies.language) {
    const wanted = Array.isArray(applies.language) ? applies.language : [applies.language];
    if (!wanted.some((l) => profile.languages.has(l))) return false;
  }
  if (applies.packageManager !== undefined) {
    if (applies.packageManager !== profile.packageManager) return false;
  }
  if (applies.testRunner) {
    const wanted = Array.isArray(applies.testRunner) ? applies.testRunner : [applies.testRunner];
    if (!wanted.some((t) => profile.testRunners.has(t))) return false;
  }
  if (applies.database) {
    const wanted = Array.isArray(applies.database) ? applies.database : [applies.database];
    if (!wanted.some((d) => profile.databases.has(d))) return false;
  }
  if (applies.monorepo !== undefined && applies.monorepo !== profile.isMonorepo) return false;
  if (applies.typescript !== undefined && applies.typescript !== profile.hasTypeScript) return false;
  if (applies.githubActions !== undefined && applies.githubActions !== profile.hasGithubActions) return false;
  if (applies.nextRouter && profile.nextRouter !== applies.nextRouter && profile.nextRouter !== "both") {
    return false;
  }
  if (applies.hasScript) {
    for (const key of applies.hasScript) {
      if (!profile.scripts[key]) return false;
    }
  }
  return true;
}

/**
 * Parse a template file with hand-rolled YAML-ish frontmatter.
 *
 *   ---
 *   name: add-route
 *   description: Add a new Next.js App Router route with loading/error states.
 *   premium: false
 *   order: 10
 *   applies_when:
 *     framework: nextjs
 *     nextRouter: app
 *   ---
 *   <markdown body>
 */
export function parseTemplate(path: string, source: "builtin" | "premium"): LoadedTemplate {
  const raw = readFileSync(path, "utf8");
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) {
    throw new Error("missing frontmatter delimiters");
  }
  const [, frontmatter, body] = match;
  const meta = parseFrontmatter(frontmatter!);
  return { meta, body: body!.trimStart(), source, sourcePath: path };
}

function parseFrontmatter(text: string): TemplateMeta {
  const flat: Record<string, string> = {};
  const applies: Record<string, unknown> = {};
  let currentSection: "root" | "applies_when" = "root";

  for (const lineRaw of text.split(/\r?\n/)) {
    const line = lineRaw.replace(/\s+$/, "");
    if (!line.trim()) continue;
    if (line === "applies_when:" || line === "appliesWhen:") {
      currentSection = "applies_when";
      continue;
    }
    if (!line.startsWith(" ") && !line.startsWith("\t")) {
      currentSection = "root";
      const idx = line.indexOf(":");
      if (idx < 0) continue;
      const key = line.slice(0, idx).trim();
      const value = line.slice(idx + 1).trim();
      flat[key] = value;
    } else {
      // nested under applies_when
      const idx = line.indexOf(":");
      if (idx < 0) continue;
      const key = line.slice(0, idx).trim();
      const value = line.slice(idx + 1).trim();
      applies[key] = parseFrontmatterValue(value);
    }
  }

  const name = required(flat, "name");
  const description = flat.description ?? "";
  const premium = (flat.premium ?? "false").toLowerCase() === "true";
  const order = Number.parseInt(flat.order ?? "100", 10);

  return {
    name,
    description,
    premium,
    order: Number.isFinite(order) ? order : 100,
    appliesWhen: applies as AppliesWhen,
  };
}

function parseFrontmatterValue(raw: string): unknown {
  if (raw === "true") return true;
  if (raw === "false") return false;
  if (raw.startsWith("[") && raw.endsWith("]")) {
    return raw
      .slice(1, -1)
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return raw;
}

function required<T extends Record<string, string>>(obj: T, key: keyof T): string {
  const v = obj[key];
  if (!v) throw new Error(`missing required frontmatter field: ${String(key)}`);
  return v;
}

/** Walk a directory recursively, yielding *.md paths. */
function* walkMarkdown(dir: string): Generator<string> {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    let isDir = false;
    try {
      isDir = statSync(full).isDirectory();
    } catch {
      continue;
    }
    if (isDir) yield* walkMarkdown(full);
    else if (entry.endsWith(".md")) yield full;
  }
}
