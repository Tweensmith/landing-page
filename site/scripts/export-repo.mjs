#!/usr/bin/env node
// Writes the landing page out as a repository that builds on its own.
//
// The page lives inside the kit and imports the kit's components and the brand's logo from outside this folder,
// so this folder alone does not build. This script copies the files the page builds from, in this folder and in
// the kit, to the same places they have in the kit. Nothing is rewritten: the page's imports and vite.config.js
// work unchanged, because every path still leads where it led.
//
// Which files the page builds from is not kept as a list: it is read from a real build of the page, so the copy
// cannot fall behind the page. A file the page does not import is not copied. That is deliberate, and it is
// what keeps unreleased things out of a repository other people can read: the parked sections, the parked tiers
// and founding offer (src/copy-pricing.jsx), and every component the page does not show.
//
// The repository was made public on the owner's word (2026-11-24). It still holds the source of the Pro
// components the page uses, because the page cannot build without them.
//
//   node scripts/export-repo.mjs <directory>
//
// <directory> is a clone of the landing page's repository (or an empty folder). Everything in it except .git
// is replaced. The working notes, the plan, the review captures and the parked files stay in the kit.
import { build } from "vite";
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const site = resolve(here, "..");
const kit = resolve(site, "..");

if (!process.argv[2]) { console.error("usage: node scripts/export-repo.mjs <directory>"); process.exit(1); }
const out = resolve(process.argv[2]);
if (out === kit || out.startsWith(kit + sep) || kit.startsWith(out + sep)) { console.error("The directory must be outside the kit."); process.exit(1); }

// ---- 1. what the page imports, from a real build ----
const under = (dir, f) => f.startsWith(dir + sep);
const clean = (id) => id.replace(/^\0+/, "").replace(/[?#].*$/, "");
const packageOf = (f) => { const p = f.slice(f.lastIndexOf("node_modules" + sep) + 13).split(sep); return p[0].startsWith("@") ? p[0] + "/" + p[1] : p[0]; };
const used = new Set(), packages = new Set(), sheets = new Set();
await build({
  configFile: resolve(site, "vite.config.js"),
  logLevel: "warn",
  build: { write: false },
  plugins: [{
    name: "tweensmith-export-trace",
    buildEnd() {
      for (const id of this.getModuleIds()) {
        const f = clean(id);
        if (f.includes(sep + "node_modules" + sep) || !existsSync(f)) continue;
        if (under(kit, f)) used.add(f);
        if (f.endsWith(".css")) sheets.add(f);
        // the packages the page's own files and the kit's files ask for by name
        if (under(kit, f)) for (const dep of this.getModuleInfo(id)?.importedIds ?? []) { const d = clean(dep); if (d.includes(sep + "node_modules" + sep)) packages.add(packageOf(d)); }
      }
    },
  }],
});

// A file a stylesheet points at with url() (the footer's font, in the brand's folder) is not a module, so the build
// does not list it; and when it is missing the build still passes and only leaves the address in the stylesheet.
// So the stylesheets the page uses are read for them here, and one that leads nowhere stops the export.
for (const sheet of sheets) {
  for (const [, ref] of readFileSync(sheet, "utf8").matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/g)) {
    if (/^(data:|https?:|\/|#)/.test(ref)) continue;
    const f = resolve(dirname(sheet), clean(ref));
    if (!existsSync(f)) { console.error(`${relative(kit, sheet)} points at a file that is not there: ${ref}`); process.exit(1); }
    if (under(kit, f)) used.add(f);
  }
}

// ---- 2. what vite.config.js reads at build time (see catalogue() and brandIcon() there) ----
const metas = (dir) => readdirSync(resolve(kit, dir)).filter((d) => !d.startsWith("_")).map((d) => resolve(kit, dir, d, "meta.json")).filter(existsSync);
const read = [...metas("components"), ...metas("native/components"), resolve(kit, "categories.json"), resolve(kit, "tokens.json"), resolve(kit, "brand/book/icons/favicon.svg")];
// and the page's own files that are not modules: its settings, and the scripts that recorded the MCP server's answers
const own = ["index.html", "package.json", "vite.config.js", ".gitignore", ...readdirSync(resolve(site, "scripts")).filter((f) => f.endsWith(".mjs")).map((f) => "scripts/" + f)].map((f) => resolve(site, f));
for (const f of [...read, ...own]) { if (!existsSync(f)) { console.error("Missing a file the build reads: " + relative(kit, f)); process.exit(1); } used.add(f); }

// ---- 3. write the directory ----
mkdirSync(out, { recursive: true });
for (const name of readdirSync(out)) if (name !== ".git") rmSync(resolve(out, name), { recursive: true, force: true });

for (const f of used) { const to = resolve(out, relative(kit, f)); mkdirSync(dirname(to), { recursive: true }); cpSync(f, to); }

// The versions are the ones installed in the kit right now, written exactly, so the copy builds with what the
// page was checked with.
const version = (p) => JSON.parse(readFileSync(resolve(kit, "node_modules", p, "package.json"), "utf8")).version;
const pin = (list) => Object.fromEntries([...list].sort().map((p) => [p, version(p)]));
const DEV = ["@vitejs/plugin-react", "vite"];
writeFileSync(resolve(out, "package.json"), JSON.stringify({
  name: "tweensmith-landing-page",
  private: true,
  version: "0.0.0",
  type: "module",
  description: "The Tweensmith landing page, built from Tweensmith's own components.",
  scripts: { dev: "npm --prefix site run dev", build: "npm --prefix site run build", preview: "npm --prefix site run preview" },
  dependencies: pin(packages),
  devDependencies: pin(DEV),
}, null, 2) + "\n");

writeFileSync(resolve(out, ".gitignore"), "node_modules/\ndist/\n.DS_Store\n.netlify/\n");

// Netlify reads this, so the repository deploys as it is: install at the top, build the page, serve site/dist.
writeFileSync(resolve(out, "netlify.toml"), `[build]
  command = "npm run build"
  publish = "site/dist"

[build.environment]
  NODE_VERSION = "22"
`);

writeFileSync(resolve(out, "README.md"), `# Tweensmith landing page

The landing page for Tweensmith, built from Tweensmith's own components.

## Run it

\`\`\`bash
npm install
npm run dev
\`\`\`

The page is served on port 5190. \`npm run build\` writes the finished page to \`site/dist\`.

## What is here

- \`site/\` is the page.
- \`components/\`, \`brand/\`, \`native/\`, \`tokens.json\` and \`categories.json\` are copies of the files the page
  imports or reads from the Tweensmith kit, at the places they have there. Only the files the page uses are here.
- \`netlify.toml\` holds the build settings for Netlify.

The page is developed inside the kit and written out to this repository by \`site/scripts/export-repo.mjs\`, which
replaces everything here. So changes are made in the kit and exported, not made here. The scripts in
\`site/scripts/\` that record the MCP server's answers need the whole kit and do not run from this repository.
`);

const kitFiles = [...used].filter((f) => !under(site, f)).map((f) => relative(kit, f)).sort();
console.log(`  from this folder: ${[...used].filter((f) => under(site, f)).length} files`);
console.log(`Wrote ${out}`);
console.log(`  from the kit: ${kitFiles.length} files (${kitFiles.filter((f) => f.endsWith("meta.json")).length} meta.json, ${kitFiles.filter((f) => f.startsWith("components" + sep) && !f.endsWith("meta.json")).length} component files, ${kitFiles.filter((f) => f.startsWith("brand" + sep)).length} brand files)`);
console.log(`  packages: ${[...packages].sort().join(", ")}`);
