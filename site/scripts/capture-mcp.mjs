#!/usr/bin/env node
// Writes src/data/mcp-search.json: the kit's real MCP server answering one real query, so the transcript on the
// landing page is captured output, not something written to look like it.
//   cd tweensmith/site && npm run capture:mcp
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const kit = resolve(here, "..", "..");
const query = "a number that rolls when its value changes";

const client = new Client({ name: "tweensmith-site-capture", version: "0.0.1" });
await client.connect(new StdioClientTransport({ command: "node", args: ["mcp/server.mjs"], cwd: kit }));
const { tools } = await client.listTools();
const res = await client.callTool({ name: "search_components", arguments: { query } });
await client.close();

const text = (res.content ?? []).find((c) => c.type === "text")?.text ?? "{}";
const reply = JSON.parse(text);
const out = {
  capturedAt: new Date().toISOString().slice(0, 10),
  server: "tweensmith/mcp/server.mjs (stdio)",
  tools: tools.map((t) => t.name),
  call: { tool: "search_components", arguments: { query } },
  reply,
};
writeFileSync(resolve(here, "..", "src/data/mcp-search.json"), JSON.stringify(out, null, 2) + "\n");
console.log(`wrote src/data/mcp-search.json: ${reply.matches?.length ?? 0} matches, top = ${reply.matches?.[0]?.slug}`);
