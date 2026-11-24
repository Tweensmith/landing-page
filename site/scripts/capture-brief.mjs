#!/usr/bin/env node
// Writes src/data/mcp-brief.json: what the kit's real MCP server returns from `get_component` for the free
// components the "what your agent receives" section shows. The page draws that section from this file, so what it
// says an agent reads is captured output, not a description written by hand.
//   cd tweensmith/site && node scripts/capture-brief.mjs
// The reply also carries the component's source files; only their names and line counts are kept here.
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const kit = resolve(here, "..", "..");
const SLUGS = process.argv.slice(2).length ? process.argv.slice(2) : [
  "avatar-group",
  "switch", "progress", "rating", "button", "text-field", "copy-button", "checkbox", "otp-input", "number-ticker",
];

const client = new Client({ name: "tweensmith-site-capture", version: "0.0.1" });
await client.connect(new StdioClientTransport({ command: "node", args: ["mcp/server.mjs"], cwd: kit }));
const components = {};
for (const slug of SLUGS) {
  const res = await client.callTool({ name: "get_component", arguments: { slug } });
  const r = JSON.parse((res.content ?? []).find((c) => c.type === "text")?.text ?? "{}");
  if (!r.slug) throw new Error(`get_component("${slug}") returned no component`);
  components[slug] = {
    name: r.name, slug: r.slug, export: r.export, tier: r.tier, platform: r.platform,
    intents: r.intents ?? [], states: r.states ?? [], presets: r.presets ?? {},
    // the props that publish a range (min and max); the rest are counted
    ranges: (r.props ?? []).filter((p) => p.min != null && p.max != null).map(({ key, label, min, max, step, unit, default: d }) => ({ key, label, min, max, step, unit, default: d })),
    propCount: (r.props ?? []).length,
    files: Object.entries(r.files ?? {}).map(([path, text]) => ({ path, lines: String(text).split("\n").length })),
    fields: Object.keys(r),
  };
  const c = components[slug];
  console.log(`${slug}: ${c.intents.length} intents, ${c.states.length} states, ${Object.keys(c.presets).length} presets, ${c.ranges.length} ranges, ${c.files.length} files`);
}
await client.close();
writeFileSync(resolve(here, "..", "src/data/mcp-brief.json"), JSON.stringify({ capturedAt: new Date().toISOString().slice(0, 10), server: "tweensmith/mcp/server.mjs (stdio)", tool: "get_component", components }, null, 2) + "\n");
