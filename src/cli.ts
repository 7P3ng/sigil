import mri from "mri";
import { resolve, join } from "node:path";
import { existsSync, readdirSync } from "node:fs";
import { homedir } from "node:os";
import kleur from "kleur";
import { detectStack } from "./detect.js";
import {
  loadAllTemplates,
  renderTemplates,
  templateRoots,
  loadPremiumCatalog,
  applicableCatalog,
} from "./render.js";
import type { StackProfile } from "./types.js";
import type { CatalogEntry } from "./render.js";

const PREMIUM_HINT = `Premium templates: paste the template pack into ${kleur.cyan("~/.sigil/templates/")} after purchase.`;
const BUY_URL = process.env.SIGIL_BUY_URL ?? "https://sigil.thomaspeng.ca";

interface CliArgs {
  dir?: string;
  dryRun?: boolean;
  json?: boolean;
  help?: boolean;
  version?: boolean;
}

function main(): void {
  const argv = mri<CliArgs>(process.argv.slice(2), {
    boolean: ["dryRun", "json", "help", "version"],
    string: ["dir"],
    alias: { h: "help", v: "version", n: "dryRun" },
    default: { dir: ".", dryRun: false, json: false, help: false, version: false },
  });

  if (argv.help) {
    printHelp();
    return;
  }
  if (argv.version) {
    console.log("sigil 0.1.0");
    return;
  }

  const repoRoot = resolve(argv.dir ?? ".");
  if (!existsSync(repoRoot)) {
    console.error(kleur.red(`Directory does not exist: ${repoRoot}`));
    process.exit(2);
  }

  const profile = detectStack(repoRoot);

  if (argv.json) {
    console.log(JSON.stringify(profileToJson(profile), null, 2));
    return;
  }

  printStackSummary(profile);

  const { templates, errors } = loadAllTemplates();
  if (errors.length) {
    for (const e of errors) console.warn(kleur.yellow(`warn: ${e}`));
  }
  if (templates.length === 0) {
    console.error(kleur.red(
      `No templates found. Looked in:\n  - ${templateRoots().builtin}\n  - ${templateRoots().premium}\n` +
      `If you installed via npx, this is a packaging bug — please report it.`,
    ));
    process.exit(3);
  }

  const premiumInstalled = templates.some((t) => t.source === "premium");
  const gatePremium = !premiumInstalled;

  const outputDir = join(repoRoot, ".claude", "commands");
  const result = renderTemplates(templates, profile, {
    gatePremium,
    dryRun: argv.dryRun ?? false,
    outputDir,
  });

  // When premium isn't installed, surface the catalog so users see what they'd unlock.
  const catalogPreview = premiumInstalled
    ? []
    : applicableCatalog(loadPremiumCatalog(), profile);

  printRenderResult(result, {
    dryRun: argv.dryRun ?? false,
    premiumInstalled,
    outputDir,
    catalogPreview,
  });
}

function printHelp(): void {
  console.log(`${kleur.bold("sigil")} — Claude Code slash commands tailored to your repo

${kleur.bold("Usage:")}
  npx sigil [options]

${kleur.bold("Options:")}
  -d, --dir <path>     Repo root to scan (default: current directory)
  -n, --dry-run        Detect & list what would be written; don't touch disk
  --json               Print detected stack as JSON and exit
  -h, --help           Show this message
  -v, --version        Show version

${kleur.bold("Where templates come from:")}
  Built-in (free):     bundled with the CLI
  Premium (paid):      ${join(homedir(), ".sigil", "templates")}

${kleur.bold("Buy the premium pack:")}
  ${kleur.cyan(BUY_URL)}
`);
}

function printStackSummary(profile: StackProfile): void {
  console.log(kleur.bold("\nDetected stack:"));
  console.log(`  ${kleur.dim("root")}        ${profile.repoRoot}`);
  console.log(`  ${kleur.dim("pkgmgr")}      ${profile.packageManager ?? "(none)"}`);
  console.log(`  ${kleur.dim("languages")}   ${setToList(profile.languages)}`);
  console.log(`  ${kleur.dim("frameworks")}  ${setToList(profile.frameworks)}`);
  console.log(`  ${kleur.dim("tests")}       ${setToList(profile.testRunners)}`);
  console.log(`  ${kleur.dim("databases")}   ${setToList(profile.databases)}`);
  console.log(`  ${kleur.dim("flags")}       ${flagList(profile)}`);
  console.log();
}

function flagList(p: StackProfile): string {
  const flags: string[] = [];
  if (p.hasTypeScript) flags.push("typescript");
  if (p.isMonorepo) flags.push("monorepo");
  if (p.hasGithubActions) flags.push("github-actions");
  if (p.nextRouter) flags.push(`next-router:${p.nextRouter}`);
  return flags.length ? flags.join(", ") : "(none)";
}

function setToList(s: Set<string>): string {
  return s.size === 0 ? "(none)" : Array.from(s).sort().join(", ");
}

function profileToJson(p: StackProfile): Record<string, unknown> {
  return {
    repoRoot: p.repoRoot,
    packageManager: p.packageManager,
    languages: Array.from(p.languages),
    frameworks: Array.from(p.frameworks),
    testRunners: Array.from(p.testRunners),
    databases: Array.from(p.databases),
    isMonorepo: p.isMonorepo,
    hasTypeScript: p.hasTypeScript,
    hasGithubActions: p.hasGithubActions,
    nextRouter: p.nextRouter,
    scripts: p.scripts,
  };
}

function printRenderResult(
  result: ReturnType<typeof renderTemplates>,
  opts: {
    dryRun: boolean;
    premiumInstalled: boolean;
    outputDir: string;
    catalogPreview: CatalogEntry[];
  },
): void {
  const verb = opts.dryRun ? "Would write" : "Wrote";
  if (result.written.length === 0 && result.gated.length === 0 && opts.catalogPreview.length === 0) {
    console.log(kleur.yellow("No templates matched this stack. Try adding a package.json or pyproject.toml."));
    return;
  }

  if (result.written.length > 0) {
    console.log(kleur.bold(`${verb} ${result.written.length} command${result.written.length === 1 ? "" : "s"}:`));
    for (const w of result.written) {
      console.log(`  ${kleur.green("✓")} /${w.name}${w.premium ? kleur.magenta(" (premium)") : ""}`);
    }
    console.log(`  ${kleur.dim(`→ ${opts.outputDir}`)}`);
  }

  // Premium templates from a loaded premium pack that are gated by the engine
  // (rare in practice — only if pack is half-installed).
  if (result.gated.length > 0) {
    console.log();
    console.log(kleur.bold(`${result.gated.length} premium command${result.gated.length === 1 ? "" : "s"} not generated:`));
    for (const g of result.gated) {
      console.log(`  ${kleur.dim("○")} /${g.name} — ${kleur.dim(g.description || "(no description)")}`);
    }
  }

  // Catalog preview — what the user would unlock by buying the premium pack.
  if (opts.catalogPreview.length > 0) {
    console.log();
    console.log(kleur.bold(
      `+${opts.catalogPreview.length} premium command${opts.catalogPreview.length === 1 ? "" : "s"} available for this stack:`,
    ));
    for (const c of opts.catalogPreview) {
      console.log(`  ${kleur.magenta("○")} /${c.name} — ${kleur.dim(c.description || "(no description)")}`);
    }
    console.log();
    console.log(`  ${kleur.dim("→")} ${PREMIUM_HINT}`);
    console.log(`  ${kleur.dim("→")} Buy: ${kleur.cyan(BUY_URL)}`);
  }

  if (opts.dryRun) {
    console.log();
    console.log(kleur.dim("(dry-run — no files were written)"));
  } else {
    console.log();
    console.log(kleur.dim("Next: open Claude Code in this repo. Your commands will appear as /<name>."));
  }
}

main();
