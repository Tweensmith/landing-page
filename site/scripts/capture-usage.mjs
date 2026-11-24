#!/usr/bin/env node
// Writes src/data/mcp-usage.json: the usage snippet the kit's real MCP server returns from `get_component` for
// every free web component, and the names of the server's tools. The "Get it" section shows these, so the code a
// visitor copies and the tools it names are captured output, not typed by hand.
//   cd tweensmith/site && node scripts/capture-usage.mjs
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { readdirSync, readFileSync, existsSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const kit = resolve(here, "..", "..");
// the free web components, read from the kit's own meta.json files
const slugs = readdirSync(resolve(kit, "components")).filter((d) => {
  const f = resolve(kit, "components", d, "meta.json");
  if (!existsSync(f)) return false;
  const m = JSON.parse(readFileSync(f, "utf8"));
  return m.tier === "free" && (m.platform ?? "web") === "web";
}).sort();

const client = new Client({ name: "tweensmith-site-capture", version: "0.0.1" });
await client.connect(new StdioClientTransport({ command: "node", args: ["mcp/server.mjs"], cwd: kit }));
const tools = (await client.listTools()).tools.map((t) => t.name);
const components = {};
for (const slug of slugs) {
  const res = await client.callTool({ name: "get_component", arguments: { slug } });
  const r = JSON.parse((res.content ?? []).find((c) => c.type === "text")?.text ?? "{}");
  if (!r.slug) throw new Error(`get_component("${slug}") returned no component`);
  if (r.tier !== "free") throw new Error(`${slug}: the server says tier "${r.tier}", the meta.json says free`);
  if (!r.usageSnippet) throw new Error(`${slug}: the server returned no usage snippet`);
  components[slug] = { name: r.name, export: r.export, tier: r.tier, snippet: String(r.usageSnippet).trim() };
}
await client.close();
writeFileSync(resolve(here, "..", "src/data/mcp-usage.json"), JSON.stringify({ capturedAt: new Date().toISOString().slice(0, 10), server: "tweensmith/mcp/server.mjs (stdio)", tools, components }, null, 1) + "\n");
const lines = Object.values(components).map((c) => c.snippet.split("\n").length);
console.log(`${slugs.length} free web components; snippets ${Math.min(...lines)} to ${Math.max(...lines)} lines; tools: ${tools.join(", ")}`);
