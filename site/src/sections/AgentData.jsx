import { States } from "./agent/States.jsx";
import "./agent/agent.css";

// What your agent receives (owner's choice, 2026-11-23): one free component on a stage, going through every state
// it publishes. The state names are the ones the kit's agent server returns (src/data/mcp-brief.json, captured by
// scripts/capture-brief.mjs). The two options not chosen are parked in sections/parked/: AgentTurn.jsx (cards
// with two sides) and AgentDrawing.jsx (published ranges, drawn), with AgentThreePanes.jsx, the section before them.
export function AgentData({ mode = "dark" }) {
  return (
    <section className="section ag" aria-labelledby="agent-h">
      <States mode={mode} />
    </section>
  );
}
