import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// The landing page lives in tweensmith/site and imports the kit's components straight from ../components.
// It is web only: no react-native-web, so the native components are listed (from their meta.json) but not run.
const here = dirname(fileURLToPath(import.meta.url));
const kit = resolve(here, "..");

// What is free is recorded in each component's own meta.json as `tier` ("free" or "pro"), so the page cannot
// disagree with the kit. A component with no tier is treated as pro: nothing is called free by default.
/**
 * virtual:catalogue: one slim record per component, read from every meta.json at build time, so the page can
 * state counts and spec lines that are true by construction without shipping 470 KB of metadata.
 * `full` carries the complete meta.json for the few components the page shows in detail.
 */
function catalogue() {
  const id = "virtual:catalogue", rid = "\0" + id;
  const FULL = ["number-ticker"];
  const read = (dir, platform) =>
    readdirSync(dir)
      .filter((d) => !d.startsWith("_") && existsSync(resolve(dir, d, "meta.json")))
      .map((d) => {
        const m = JSON.parse(readFileSync(resolve(dir, d, "meta.json"), "utf8"));
        const controls = m.controls ?? [];
        return {
          slug: m.slug, name: m.name, export: m.export, category: m.category, subcategory: m.subcategory ?? null, platform, level: m.level ?? null, order: m.order ?? 999,
          hint: m.hint ?? "", intents: (m.intents ?? []).slice(0, 2),
          states: (m.states ?? []).length, controls: controls.length,
          ranges: controls.filter((c) => c.min != null && c.max != null).length,
          presets: Object.keys(m.presets ?? {}).length,
          tier: m.tier === "free" ? "free" : "pro", free: m.tier === "free",
          demo: m.demoProps ?? {},   // components show nothing invented by default; a specimen wants the gallery's sample content
        };
      });
  return {
    name: "tweensmith-catalogue",
    resolveId: (s) => (s === id ? rid : null),
    load(s) {
      if (s !== rid) return null;
      const web = read(resolve(kit, "components"), "web");
      const native = read(resolve(kit, "native/components"), "native");
      // The kit's structure file: kinds, their categories, and subcategories (research/product-structure). The page
      // takes the Components kind's categories, in the kit's order, with their subcategories.
      const structure = JSON.parse(readFileSync(resolve(kit, "categories.json"), "utf8"));
      const parts = structure.kinds?.find((k) => k.id === "components");
      if (!parts) throw new Error("categories.json has no `components` kind: the kit's structure file has changed shape. See catalogue() in site/vite.config.js.");
      const categories = parts.categories.map(({ id, name, subcategories = [] }) => ({ id, name, subcategories: subcategories.map((x) => ({ id: x.id, name: x.name })) }));
      const full = Object.fromEntries(FULL.map((s) => [s, JSON.parse(readFileSync(resolve(kit, "components", s, "meta.json"), "utf8"))]));
      const tokens = JSON.parse(readFileSync(resolve(kit, "tokens.json"), "utf8")).motion;
      return `export const web = ${JSON.stringify(web)};
export const native = ${JSON.stringify(native)};
export const categories = ${JSON.stringify(categories)};
export const full = ${JSON.stringify(full)};
export const motionTokens = ${JSON.stringify(tokens)};`;
    },
  };
}

// The browser-tab icon is the brand's own file (brand/book/icons/favicon.svg: the logo's small master, which
// switches its ink with the colour scheme). It is read here and written into the page's head, so the page never
// carries a copy that can fall behind the logo. The build stops if the file is missing.
function brandIcon() {
  const file = resolve(kit, "brand/book/icons/favicon.svg");
  return {
    name: "tweensmith-brand-icon",
    transformIndexHtml() {
      const svg = readFileSync(file, "utf8").trim();
      return [{ tag: "link", attrs: { rel: "icon", type: "image/svg+xml", href: "data:image/svg+xml," + encodeURIComponent(svg) }, injectTo: "head" }];
    },
  };
}

export default defineConfig({
  root: here,
  base: "./",
  plugins: [react(), catalogue(), brandIcon()],
  server: { fs: { allow: [kit] } },
  // The kit's Select and Tooltip sit on Base UI and are loaded lazily, so the dev server would only find the package
  // when one is first shown, re-bundle, and leave the open page asking for a stale file. Bundle it at start instead.
  optimizeDeps: { include: ["@base-ui/react/select", "@base-ui/react/tooltip"] },
  build: { outDir: resolve(here, "dist"), emptyOutDir: true, target: "es2020", chunkSizeWarningLimit: 700 },
});
