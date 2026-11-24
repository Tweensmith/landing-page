import { lazy, useState } from "react";
import { Title } from "../lib/Title.jsx";
import { Lazy } from "../lib/Lazy.jsx";
import { sections } from "../copy.jsx";
import { Swatches } from "./live/shared.jsx";
import "./live/live.css";

// The live section (owner's choice, 2026-11-22): one working product screen built only from free components.
// The heading and the theme dots are here; the screen itself, with its eleven components, is fetched when the
// section comes near the viewport, so the first paint carries the hero alone.
// Earlier versions are parked in sections/parked/: SpecimensCards.jsx (fifteen cards), SpecimensArrangements.jsx
// (stage, bento, sheet), LiveDeck.jsx (a deck of index cards) and LiveSayIt.jsx (a request and its first match).
const Screen = lazy(() => import("./live/Screen.jsx").then((m) => ({ default: m.Screen })));

export function Specimens({ mode = "dark" }) {
  const [preset, setPreset] = useState("tweensmith");
  return (
    <section className="section lv" id="specimens" aria-labelledby="specimens-h">
      <header className="live__head">
        <Title id="specimens-h" parts={sections.specimens.title} />
        <Swatches preset={preset} onPreset={setPreset} mode={mode} />
      </header>
      <Lazy className="scr-hold" minHeight={0} margin="0px" fallback={<div className="scr scr--wait" aria-hidden />}>
        <Screen mode={mode} preset={preset} />
      </Lazy>
    </section>
  );
}
