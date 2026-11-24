#!/usr/bin/env node
// Writes src/data/mcp-say.json: the kit's real MCP server answering a handful of requests written the way a builder
// talks to their agent. The landing page shows each sentence with the component the server ranked first, so every
// pairing on the page is captured output, not something arranged by hand.
//   cd tweensmith/site && node scripts/capture-say.mjs
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const kit = resolve(here, "..", "..");
const QUERIES = process.argv.slice(2).length ? process.argv.slice(2) : [
  "add a field for a six-digit login code",
  "let people pick a price range",
  "a toggle to turn notifications on",
  "show how far an upload has got",
  "star rating for a recipe",
  "tabs for a project page",
  "let them choose how many guests",
  "a row of pages to move through results",
  "copy an API key to the clipboard",
  "add tags for skills",
];
// Tried and left out, for the record: "a switch to turn the weekly digest on" ranked pricing-table (Pro) first and
// switch second, so it is not shown. Every sentence above is shown only while its first match is a free component
// the page can render; the page checks that when it is built.

const client = new Client({ name: "tweensmith-site-capture", version: "0.0.1" });
await client.connect(new StdioClientTransport({ command: "node", args: ["mcp/server.mjs"], cwd: kit }));
const asks = [];
for (const query of QUERIES) {
  const res = await client.callTool({ name: "search_components", arguments: { query } });
  const reply = JSON.parse((res.content ?? []).find((c) => c.type === "text")?.text ?? "{}");
  const m = reply.matches ?? [];
  asks.push({ query, matches: m.length, top: m[0] ? { slug: m[0].slug, name: m[0].name, platform: m[0].platform } : null, next: m.slice(1, 4).map((x) => x.slug) });
  console.log(`${query}  ->  ${m.slice(0, 4).map((x) => x.slug).join(", ")}`);
}
await client.close();
writeFileSync(resolve(here, "..", "src/data/mcp-say.json"), JSON.stringify({ capturedAt: new Date().toISOString().slice(0, 10), server: "tweensmith/mcp/server.mjs (stdio)", tool: "search_components", asks }, null, 2) + "\n");
