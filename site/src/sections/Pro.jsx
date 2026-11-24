import { lazy } from "react";
import { Lazy } from "../lib/Lazy.jsx";
import "./pro/pro.css";

// The one line about Pro (owner's choice, 2026-11-23): it is coming, and here is where to leave an email, over a
// slow row of blank name-plates. It sells nothing: no price, no list of what is in Pro, no offer (milestone 1 shows
// the free release). No service takes addresses yet (src/links.js, `waitlist`), so the page shows "Not live yet"
// and no field until one does. Not chosen, parked in sections/parked/: ProOpen.jsx (no plates), ProPill.jsx (one
// key that opens the field) and ProCard.jsx (the card before them).
const More = lazy(() => import("./pro/More.jsx").then((m) => ({ default: m.More })));

export function Pro() {
  return (
    <section className="section pw" id="pro" aria-labelledby="pro-h">
      <Lazy minHeight={0} fallback={<div className="pw__wait" aria-hidden />}>
        <More />
      </Lazy>
    </section>
  );
}
