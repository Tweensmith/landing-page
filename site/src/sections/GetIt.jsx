import { lazy } from "react";
import { Lazy } from "../lib/Lazy.jsx";
import "./get/get.css";

// Get it (owner's choice, 2026-11-23): the install command set large, with a component name that changes, and the
// other places as words under it. Every destination reads src/links.js: a link, the command or a copy key once it
// is live, "Not live yet" until then. Not chosen, parked in sections/parked/: GetWays.jsx (two cards), GetKeys.jsx
// (five keys) and GetItList.jsx (the list before them).
const Line = lazy(() => import("./get/Line.jsx").then((m) => ({ default: m.Line })));

export function GetIt() {
  return (
    <section className="section gt" id="get" aria-labelledby="get-h">
      <Lazy minHeight={0} fallback={<div className="gt__wait" aria-hidden />}>
        <Line />
      </Lazy>
    </section>
  );
}
