import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { motionTokens } from "virtual:catalogue";
import brief from "../../data/mcp-brief.json";
import { Theme } from "../../../../components/_shared/theme.jsx";
import { Icon } from "../../../../components/_shared/icons.jsx";
import { Button } from "../../../../components/button/index.jsx";
import { TextField } from "../../../../components/text-field/index.jsx";
import { CopyButton } from "../../../../components/copy-button/index.jsx";
import { Checkbox } from "../../../../components/checkbox/index.jsx";
import { OtpInput } from "../../../../components/otp-input/index.jsx";
import { Title } from "../../lib/Title.jsx";
import { Key } from "../../lib/Key.jsx";
import { useOnScreen } from "../../lib/Lazy.jsx";
import { inert } from "../../lib/inert.js";
import { sections } from "../../copy.jsx";

/*
 * What your agent receives. One free component on a stage, walking through each state it publishes: the names are
 * the ones the kit's agent server returns for it (src/data/mcp-brief.json, captured by scripts/capture-brief.mjs),
 * and the component is held in each with the kit's own `forceState` prop, so what moves between two states is the
 * component's real transition (a button going to "loading" becomes a circle with a spinner, then draws its check).
 *
 * The stage takes its height from the tallest of the five components, so it never changes size.
 *
 * It plays while it is on screen. Pressing a state holds it there; the play key starts it again. Under reduced
 * motion it does not play by itself: the states are chosen by hand and change at once.
 */
const SET = [
  { slug: "button", C: Button, props: { label: "Save changes", size: "lg" }, dwell: { loading: 2000, success: 1900 } },
  { slug: "text-field", C: TextField, props: { demo: true, hint: "We only use it for receipts." } },
  { slug: "copy-button", C: CopyButton, props: { demo: true, value: "stiffness 220 · damping 24", prompt: "" } },
  { slug: "checkbox", C: Checkbox, props: { demo: true } },
  { slug: "otp-input", C: OtpInput, props: { demo: true } },
];
for (const c of SET) {
  const b = brief.components[c.slug];
  if (!b) throw new Error(`States: no captured brief for ${c.slug}. Run: node scripts/capture-brief.mjs`);
  if (b.tier !== "free") throw new Error(`States: ${c.slug} is not a free component; this page shows the free release.`);
}
const DWELL = 1500;
const SETTLE = motionTokens.springs.settle;

export function States({ mode }) {
  const reduce = !!useReducedMotion();
  const [pick, setPick] = useState(0);
  const [at, setAt] = useState(0);
  const [playing, setPlaying] = useState(true);
  const root = useRef(null);
  const seen = useOnScreen(root, "-15% 0px");
  const item = SET[pick], b = brief.components[item.slug], states = b.states, state = states[at % states.length];

  useEffect(() => {
    if (reduce || !playing || !seen) return;
    const t = setTimeout(() => setAt((i) => (i + 1) % states.length), item.dwell?.[state] ?? DWELL);
    return () => clearTimeout(t);
  }, [at, playing, seen, reduce, pick, state, states.length, item]);

  const choose = (i) => { setPick(i); setAt(0); };
  const hold = (i) => { setAt(i); setPlaying(false); };
  const onKey = (e) => {
    const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
    if (!step) return;
    e.preventDefault();
    const i = (at + step + states.length) % states.length;
    hold(i);
    e.currentTarget.querySelectorAll("[role=tab]")[i]?.focus();
  };

  return (
    <>
      <header className="ag__head">
        <Title id="agent-h" parts={sections.agent.title} />
        <div className="ag__pick" role="group" aria-label="Component">
          {SET.map((c, i) => (
            <Key key={c.slug} small latched={i === pick} aria-pressed={i === pick} onClick={() => choose(i)}>{brief.components[c.slug].name}</Key>
          ))}
        </div>
      </header>

      <div className="states" ref={root}>
        <div id="states-panel" role="tabpanel" aria-label={`${b.name}, shown in its ${state} state`}>
          <Theme preset="tweensmith" mode={mode} buttonShape="pill" className="states__well">
            {/* The stage is as tall as the tallest component in its tallest state, and stays that size. Each of the
                five is laid in the same place once, unseen, to hold the space: in its "error" state where it has one,
                since an error adds a line (the tallest is the Checkbox group showing an error). The one that shows
                sits in that same place. If a component is added or changed, the stage follows by itself. */}
            {SET.map((c) => (
              <div className="states__live" key={"size-" + c.slug} aria-hidden ref={inert(true)}>
                <c.C {...c.props} forceState={brief.components[c.slug].states.includes("error") ? "error" : undefined} />
              </div>
            ))}
            <div className="states__live" data-on key={item.slug} ref={inert(true)}>
              <item.C {...item.props} forceState={state === "default" ? undefined : state} />
            </div>
          </Theme>
        </div>

        <div className="states__row">
          <div className="states__words" role="tablist" aria-label={`States of ${b.name}`} onKeyDown={onKey}>
            {states.map((s, i) => {
              const on = i === at % states.length;
              return (
                <button key={s} type="button" role="tab" aria-selected={on} aria-controls="states-panel" tabIndex={on ? 0 : -1} className="states__word" onClick={() => hold(i)}>
                  {on && <motion.span layoutId="states-pill" className="states__pill" aria-hidden transition={reduce ? { duration: 0 } : { type: "spring", ...SETTLE }} />}
                  <span>{s}</span>
                </button>
              );
            })}
          </div>
          {!reduce && (
            <button type="button" className="key key--sm key--icon states__play" aria-label={playing ? "Pause" : "Play through the states"} onClick={() => setPlaying((p) => !p)}>
              <Icon name={playing ? "pause" : "play"} size={16} />
            </button>
          )}
        </div>
      </div>
    </>
  );
}
