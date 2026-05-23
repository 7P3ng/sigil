// Reads premium-pack/templates/**/*.md, extracts frontmatter, writes
// dist/premium-catalog.json so the free CLI can advertise premium templates
// (names + descriptions + applies_when) without shipping their bodies.

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { readdirSync, statSync } from "node:fs";

const PREMIUM_DIR = "premium-pack/templates";
const OUT_FILE = "dist/premium-catalog.json";

function* walk(dir) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) yield* walk(full);
    else if (entry.endsWith(".md")) yield full;
  }
}

function parseFrontmatter(text) {
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) throw new Error("missing frontmatter");
  const flat = {};
  const applies = {};
  let section = "root";
  for (const lineRaw of match[1].split(/\r?\n/)) {
    const line = lineRaw.replace(/\s+$/, "");
    if (!line.trim()) continue;
    if (line === "applies_when:" || line === "appliesWhen:") {
      section = "applies";
      continue;
    }
    if (!line.startsWith(" ") && !line.startsWith("\t")) {
      section = "root";
      const idx = line.indexOf(":");
      if (idx < 0) continue;
      flat[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
    } else {
      const idx = line.indexOf(":");
      if (idx < 0) continue;
      const k = line.slice(0, idx).trim();
      const v = line.slice(idx + 1).trim();
      applies[k] = parseValue(v);
    }
  }
  return { flat, applies };
}

function parseValue(raw) {
  if (raw === "true") return true;
  if (raw === "false") return false;
  if (raw.startsWith("[") && raw.endsWith("]")) {
    return raw.slice(1, -1).split(",").map((s) => s.trim()).filter(Boolean);
  }
  return raw;
}

if (!existsSync(PREMIUM_DIR)) {
  console.warn(`No ${PREMIUM_DIR} dir — skipping catalog generation.`);
  process.exit(0);
}

const catalog = [];
for (const path of walk(PREMIUM_DIR)) {
  try {
    const raw = readFileSync(path, "utf8");
    const { flat, applies } = parseFrontmatter(raw);
    catalog.push({
      name: flat.name,
      description: flat.description ?? "",
      order: Number.parseInt(flat.order ?? "100", 10),
      appliesWhen: applies,
    });
  } catch (err) {
    console.warn(`Skipping ${path}: ${err.message}`);
  }
}

catalog.sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));

mkdirSync("dist", { recursive: true });
writeFileSync(OUT_FILE, JSON.stringify(catalog, null, 2));
console.log(`Wrote ${catalog.length} premium entries → ${OUT_FILE}`);
