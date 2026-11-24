import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { animate, motion, useMotionValue, useMotionValueEvent, useReducedMotion } from "motion/react";
import { motionTokens } from "virtual:catalogue";
import { Icon } from "../../../../components/_shared/icons.jsx";
import { Title } from "../../lib/Title.jsx";
import { sections } from "../../copy.jsx";
import { FREE, Stage } from "./shared.jsx";
import { peekWanted, takeWanted, onShowFree } from "../../lib/showFree.js";

/*
 * The free set. Every free component's name on one long row under a stage. Throw the row, as a word is thrown
 * in the hero: it carries on, slows, and comes to rest with one name under the mark. That component is the one on
 * the stage, live. Pressing a name brings it to the mark; the arrow keys and the two buttons move one name.
 *
 * The stage changes only when the row is at rest, so a throw across thirty names loads one component, not thirty.
 * Under reduced motion nothing coasts: a drag is ignored and a press or a key moves straight to the name.
 */
const START = "liquid-tabs";
const { stiffness: PS, damping: PD } = motionTokens.springs.playful ?? motionTokens.springs.settle;

export function Row({ mode, order }) {
  // the names in the given order (a list of slugs), or A to Z
  const [list] = useState(() => (order ? order.map((slug) => FREE.find((m) => m.slug === slug)).filter(Boolean) : FREE));
  const reduce = !!useReducedMotion();
  // the name it opens on: the one a link elsewhere on the page asked for (lib/showFree.js), or the usual one
  const indexOf = (slug) => list.findIndex((m) => m.slug === slug);
  const [first] = useState(() => { const w = indexOf(peekWanted()); return w >= 0 ? w : Math.max(0, indexOf(START)); });
  const [at, setAt] = useState(first);          // the name under the mark
  const [live, setLive] = useState(first);      // the component on the stage: follows `at` once the row rests
  const x = useMotionValue(0);
  const view = useRef(null), row = useRef(null);
  const centres = useRef([]);
  const anim = useRef(null), rest = useRef(0);
  const dragged = useRef(false);
  const atNow = useRef(first);
  atNow.current = at;
  const [, measured] = useState(0);            // the limits of the drag depend on the measurements: draw again once they are known

  const xFor = (i) => (view.current ? view.current.clientWidth / 2 - (centres.current[i] ?? 0) : 0);
  const nearest = (v) => {
    const c = (view.current?.clientWidth ?? 0) / 2 - v;
    let best = 0, d = Infinity;
    centres.current.forEach((p, i) => { const e = Math.abs(p - c); if (e < d) { d = e; best = i; } });
    return best;
  };
  // measure where each name's middle is; keep the current one under the mark when the row is resized
  useLayoutEffect(() => {
    const measure = () => {
      centres.current = [...row.current.children].map((el) => el.offsetLeft + el.offsetWidth / 2);
      anim.current?.stop();
      x.set(xFor(atNow.current));
      measured((n) => n + 1);
    };
    measure();
    document.fonts?.ready?.then(measure);
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(measure);
    ro.observe(view.current);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => () => { anim.current?.stop(); clearTimeout(rest.current); }, []);

  useMotionValueEvent(x, "change", (v) => {
    const i = nearest(v);
    setAt((p) => (p === i ? p : i));
    clearTimeout(rest.current);
    // at rest: on a name and barely moving. A spring's last hair of travel goes on for a second; the stage does not wait for it.
    if (Math.abs(xFor(i) - v) < 1.5 && Math.abs(x.getVelocity()) < 30) setLive(i);
    else rest.current = setTimeout(() => setLive(nearest(x.get())), 160);
  });

  const go = (i) => {
    const to = Math.max(0, Math.min(list.length - 1, i));
    anim.current?.stop();
    if (reduce) { x.set(xFor(to)); return; }
    anim.current = animate(x, xFor(to), { type: "spring", stiffness: PS * 1.6, damping: PD * 1.9 });
  };
  // a link elsewhere on the page asks for a component by name: bring it to the mark
  const goRef = useRef(go);
  goRef.current = go;
  useEffect(() => { takeWanted(); return onShowFree((slug) => { const i = indexOf(slug); takeWanted(); if (i >= 0) goRef.current(i); }); }, []);   // eslint-disable-line react-hooks/exhaustive-deps

  const onKey = (e) => {
    const step = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
    if (step) { e.preventDefault(); go(at + step); }
    else if (e.key === "Home") { e.preventDefault(); go(0); }
    else if (e.key === "End") { e.preventDefault(); go(list.length - 1); }
  };

  return (
    <>
      <header className="fr__head">
        <Title id="cat-h" parts={sections.catalogue.title(list.length)} />
      </header>
      <div className="frow">
        <div id="row-stage" role="region" aria-live="polite" aria-label={`${list[live].name}, live`}>
          <Stage item={list[live]} mode={mode} className="frow__stage" />
        </div>
        <div className="frow__mark" aria-hidden><i /></div>
        <div className="frow__view" ref={view} role="listbox" aria-label="Free components" aria-orientation="horizontal" aria-activedescendant={"row-" + list[at].slug} tabIndex={0} onKeyDown={onKey}
          data-cursor={reduce ? undefined : "throw"}>
          <motion.div className="frow__row" ref={row} style={{ x }}
            drag={reduce ? false : "x"} dragElastic={0.18} dragConstraints={{ left: xFor(list.length - 1), right: xFor(0) }}
            dragTransition={{ power: 0.32, timeConstant: 280, modifyTarget: (t) => xFor(nearest(t)), bounceStiffness: PS * 1.6, bounceDamping: PD * 1.9 }}
            onDragStart={() => { anim.current?.stop(); dragged.current = true; }}
            onDragEnd={() => { setTimeout(() => { dragged.current = false; }, 0); }}>
            {list.map((m, i) => (
              <span key={m.slug} id={"row-" + m.slug} role="option" aria-selected={i === at} className="frow__name" data-near={Math.abs(i - at) === 1 || undefined}
                onClick={() => { if (!dragged.current) go(i); }}>{m.name}</span>
            ))}
          </motion.div>
        </div>
        <div className="frow__keys">
          <button type="button" className="key key--sm key--icon" aria-label="Previous component" disabled={at === 0} onClick={() => go(at - 1)}><Icon name="arrowLeft" size={18} /></button>
          <span className="mono frow__count" aria-hidden><b>{String(at + 1).padStart(2, "0")}</b> / {list.length}</span>
          <button type="button" className="key key--sm key--icon" aria-label="Next component" disabled={at === list.length - 1} onClick={() => go(at + 1)}><Icon name="arrowRight" size={18} /></button>
        </div>
      </div>
    </>
  );
}
