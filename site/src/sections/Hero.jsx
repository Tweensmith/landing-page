import { Fragment, useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";
import { motionTokens } from "virtual:catalogue";
import { Key } from "../lib/Key.jsx";
import { hero } from "../copy.jsx";
import { counts } from "../lib/counts.js";
import { GitHubKey } from "../lib/GitHub.jsx";

/*
 * The hero's sentence is "Make what your AI builds feel finished." (copy.jsx), and the sentence is the demo.
 * Each word is plain type, with no tile behind it. They drop in on a kit spring and come to rest; any word can be
 * grabbed and thrown, leaves its in-between frames behind it (outlined copies of the word), and springs back into the sentence. The spring is
 * one of the kit's named ones (tokens.json), integrated here step by step so a throw carries its real velocity.
 * The full stop is the brand's green: it lights when every word is at rest.
 * Behind the hero is a still surface: a few level lines, closer together toward the back. Moving the cursor raises
 * a low swell in them under the hand, by how fast the hand moves; when the hand stops, the swell rings down on the
 * chosen spring and the lines are level again. At rest nothing is drawn twice and no frame is requested.
 * (The earlier background, a bundle of settling curves, is parked in sections/parked/HeroSettlingCurves.jsx.)
 *
 * Reduced motion: nothing travels. The words are simply in place, a throw draws its frames as a still, and the
 * lines are drawn once, level, and do not answer the cursor.
 * (The first hero, a throwable tile on a plate, is parked in sections/parked/HeroPlate.jsx.)
 */

// The sentence, word by word. The lead-in is the quiet tone and the payoff ("feel finished.") the strong one.
// `br` ends the line after that word: "all" at every width, "narrow" only on a phone.
const WORDS = [
  { t: "Make", muted: true },
  { t: "what", muted: true, br: "narrow" },
  { t: "your", muted: true },
  { t: "AI", muted: true },
  { t: "builds", muted: true, br: "all" },
  { t: "feel" },
  { t: "finished", stop: true },
];
// One spring for everything in the hero (owner, 2026-11-22: "One throw style is enough and I will choose playful").
const SPRING_KEY = "playful";
const SPRING = motionTokens.springs[SPRING_KEY] ?? { stiffness: 90, damping: 9 };
const STEP = 1 / 240;         // integration step, seconds
const SHOT = 1 / 30;          // one kept frame every 1/30 s
const MAX_SHOTS = 26;
const REST_POS = 0.4, REST_SPEED = 6;   // px, px/s: below both, a word is at rest
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const tilt = (b) => clamp(b.x * 0.03 + b.vx * 0.0015, -12, 12);
const SAMPLE = 6;             // px between the points of a line where it is lifted
const LINES = 12;             // level lines in the surface
const LIFT = 16;              // px: the most the nearest line rises
const FAST = 1100;            // px/s of the cursor that raises the full swell

/** The line colour of the field, from CSS (`color` on the canvas), as its three channels and its alpha. */
function inkOf(el) {
  const m = getComputedStyle(el).color.match(/[\d.]+/g) || [128, 128, 128, 0.2];
  return { rgb: m.slice(0, 3).join(","), a: m[3] != null ? Number(m[3]) : 1 };
}

export function jumpTo(id) {
  const el = document.getElementById(id);
  if (!el) return;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  el.setAttribute("tabindex", "-1");
  el.focus({ preventScroll: true });
}

/** One step of a unit-mass spring toward 0 on both axes (semi-implicit Euler). */
function step(b, k, c) {
  b.vx += (-k * b.x - c * b.vx) * STEP; b.vy += (-k * b.y - c * b.vy) * STEP;
  b.x += b.vx * STEP; b.y += b.vy * STEP;
}

export function Hero({ mode }) {
  const reduce = !!useReducedMotion();
  const springKey = SPRING_KEY, spring = SPRING;
  const [resting, setResting] = useState(true);
  const [shots, setShots] = useState({ word: 0, frames: [] });   // the frames kept from the last throw
  const [fading, setFading] = useState(false);                    // the trail is on its way out
  const trail = useRef([]);                                       // its timers
  const [read, setRead] = useState(null);                        // { settle, peak, over } of the last throw
  const [homes, setHomes] = useState([]);
  const [status, setStatus] = useState("");

  const box = useRef(null);
  const sect = useRef(null);
  const field = useRef(null);
  const F = useRef({ w: 0, h: 0, dpr: 1, top: 0, bottom: 0, rgb: "128,128,128", a: 0.2 });
  const O = useRef({ x: 0, vx: 0, tx: 0, y: 0, e: 0, ve: 0, te: 0, raf: 0, last: 0, acc: 0, seen: null });   // the swell: where it is, how high, and what it is heading for
  const els = useRef([]);
  const bodies = useRef(WORDS.map(() => ({ x: 0, y: 0, vx: 0, vy: 0, active: false, held: false, wait: 0 })));
  const live = useRef({ k: spring.stiffness, c: spring.damping, raf: 0, last: 0, acc: 0, track: null, reduce });
  live.current.k = spring.stiffness; live.current.c = spring.damping; live.current.reduce = reduce;

  const paint = (i) => {
    const b = bodies.current[i], el = els.current[i];
    if (el) el.style.transform = b.x || b.y ? `translate3d(${b.x.toFixed(2)}px, ${b.y.toFixed(2)}px, 0) rotate(${tilt(b).toFixed(2)}deg)` : "";
  };

  // ---- the field: level lines; each is lifted in a low bump around the swell's place, the near lines most
  const drawField = useCallback(() => {
    const cv = field.current, f = F.current, o = O.current;
    if (!cv || !f.w) return;
    const ctx = cv.getContext("2d");
    ctx.setTransform(f.dpr, 0, 0, f.dpr, 0, 0);
    ctx.clearRect(0, 0, f.w, f.h);
    ctx.lineWidth = 1; ctx.lineJoin = "round";
    for (let i = 0; i < LINES; i++) {
      const u = i / (LINES - 1), y = Math.round(f.top + (f.bottom - f.top) * u ** 1.7) + 0.5;
      const near = 0.4 + 0.6 * Math.exp(-(((y - o.y) / 130) ** 2));     // lines level with the hand rise most
      const amp = o.e * LIFT * (0.3 + 0.7 * u) * near, sig = 80 + 110 * u;
      ctx.strokeStyle = `rgba(${f.rgb},${(f.a * (0.22 + 0.78 * u)).toFixed(3)})`;
      ctx.beginPath(); ctx.moveTo(0, y);
      if (Math.abs(amp) > 0.05) {
        const a = Math.max(0, o.x - sig * 3), b = Math.min(f.w, o.x + sig * 3);
        ctx.lineTo(a, y);
        for (let x = a; x <= b; x += SAMPLE) ctx.lineTo(x, y - amp * Math.exp(-(((x - o.x) / sig) ** 2)));
        ctx.lineTo(b, y);
      }
      ctx.lineTo(f.w, y); ctx.stroke();
    }
  }, []);

  // The swell follows the hand and its height follows the hand's speed, both on the chosen spring. What it is
  // heading for falls away on its own, so a still hand lets the lines come level; then the loop stops.
  const fieldTick = useCallback((now) => {
    const o = O.current, L = live.current;
    const dt = Math.min(0.05, (now - o.last) / 1000); o.last = now; o.acc += dt;
    o.te *= Math.pow(0.004, dt);
    while (o.acc >= STEP) {
      o.acc -= STEP;
      o.vx += (-L.k * (o.x - o.tx) - L.c * o.vx) * STEP; o.x += o.vx * STEP;
      o.ve += (-L.k * (o.e - o.te) - L.c * o.ve) * STEP; o.e += o.ve * STEP;
    }
    if (o.te < 0.004 && Math.abs(o.e) < 0.004 && Math.abs(o.ve) < 0.03 && Math.abs(o.x - o.tx) < REST_POS && Math.abs(o.vx) < REST_SPEED) {
      o.e = o.ve = o.te = 0; o.x = o.tx; o.vx = 0; o.raf = 0;
      drawField();
      return;
    }
    drawField();
    o.raf = requestAnimationFrame(fieldTick);
  }, [drawField]);
  const onField = (e) => {
    const o = O.current;
    if (e.pointerType === "touch" || !field.current || live.current.reduce || !F.current.w) return;
    const r = field.current.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top, now = performance.now();
    if (!o.seen || now - o.seen.t > 400) { o.x = x; o.vx = 0; }
    else { const dt = Math.max(8, now - o.seen.t) / 1000; o.te = Math.max(o.te, Math.min(1, Math.hypot(x - o.seen.x, y - o.seen.y) / dt / FAST)); }
    o.seen = { t: now, x, y }; o.tx = x; o.y = y;
    if (!o.raf) { o.last = now; o.acc = 0; o.raf = requestAnimationFrame(fieldTick); }
  };

  // The trail is shown while the word travels and for a moment after; then it fades and is removed, so it never
  // stays over the text under the sentence. `hold` and `fade` are in milliseconds.
  const clearTrail = useCallback((hold, fade) => {
    trail.current.forEach(clearTimeout);
    trail.current = [
      setTimeout(() => setFading(true), hold),
      setTimeout(() => { setShots({ word: 0, frames: [] }); setFading(false); }, hold + fade),
    ];
  }, []);
  const keepTrail = () => { trail.current.forEach(clearTimeout); trail.current = []; setFading(false); };

  // ---- the loop: integrates every word that is moving, keeps frames of the tracked one, stops when all rest
  const tick = useCallback((now) => {
    const L = live.current, B = bodies.current;
    const dt = Math.min(0.05, (now - L.last) / 1000); L.last = now; L.acc += dt;
    let moving = false;
    while (L.acc >= STEP) {
      L.acc -= STEP;
      const t = L.track;
      for (let i = 0; i < B.length; i++) {
        const b = B[i];
        if (!b.active || b.held) continue;
        if (b.wait > now) continue;
        step(b, L.k, L.c);
        if (t && t.i === i) {
          t.t += STEP;
          const speed = Math.hypot(b.vx, b.vy);
          if (speed > t.peak) t.peak = speed;
          if (t.d0 > 8) t.over = Math.max(t.over, -(b.x * t.ux + b.y * t.uy) / t.d0);
          if (t.t >= t.next && t.frames.length < MAX_SHOTS) { t.frames.push({ x: b.x, y: b.y, r: tilt(b), f: Math.round(t.t * 60) }); t.next += SHOT; t.dirty = true; }
        }
        if (Math.hypot(b.x, b.y) < REST_POS && Math.hypot(b.vx, b.vy) < REST_SPEED) {
          b.x = b.y = b.vx = b.vy = 0; b.active = false;
          if (t && t.i === i && !t.done) { t.done = true; t.settle = t.t; }
        }
      }
    }
    for (let i = 0; i < B.length; i++) { const b = B[i]; if (b.active || b.held) moving = true; if (!b.held) paint(i); if (b.active && b.wait <= now && els.current[i]) els.current[i].style.opacity = ""; }
    const t = L.track;
    if (t && t.dirty) { t.dirty = false; setShots({ word: t.i, frames: t.frames.slice() }); }
    if (moving) { L.raf = requestAnimationFrame(tick); return; }
    L.raf = 0;
    setResting(true);
    if (t && t.done) {
      const r = { settle: t.settle, peak: t.peak, over: t.d0 > 8 ? Math.max(0, t.over) : null };
      setRead(r);
      setStatus(`${t.say}. At rest in ${r.settle.toFixed(2)} seconds on the ${t.spring} spring.`);
      if (t.frames.length) clearTrail(900, 900);
    }
  }, [clearTrail]);

  const run = useCallback(() => {
    const L = live.current;
    setResting(false);
    if (!L.raf) { L.last = performance.now(); L.acc = 0; L.raf = requestAnimationFrame(tick); }
  }, [tick]);

  // The handle is cleared as well as cancelled: effects run again on a remount, and a stale handle would stop the loop from starting.
  useEffect(() => () => { cancelAnimationFrame(live.current.raf); live.current.raf = 0; cancelAnimationFrame(O.current.raf); O.current.raf = 0; trail.current.forEach(clearTimeout); }, []);

  /** The word in hand, or last thrown, rides above the others. */
  const lift = (i) => els.current.forEach((el, n) => { if (el) el.style.zIndex = n === i ? "3" : ""; });

  /** Start following word i from where it is now: these are the frames and numbers the page shows. */
  const follow = (i, say, keep = true) => {
    keepTrail();
    const b = bodies.current[i], d0 = Math.hypot(b.x, b.y);
    live.current.track = { i, say, spring: springKey, t: 0, next: keep ? 0 : Infinity, frames: [], peak: Math.hypot(b.vx, b.vy), over: 0, d0, ux: d0 ? b.x / d0 : 0, uy: d0 ? b.y / d0 : 0, settle: 0, done: false, dirty: true };
  };

  /** Let word i go with the position and velocity it has. Under reduced motion it is put back and the frames are a still. */
  const release = (i, say) => {
    const b = bodies.current[i];
    b.held = false;
    lift(i);
    follow(i, say);
    if (!reduce) { b.active = true; b.wait = 0; run(); return; }
    const t = live.current.track, { k, c } = live.current;
    for (let n = 0; n < 240 * 6; n++) {
      step(b, k, c); t.t += STEP;
      const speed = Math.hypot(b.vx, b.vy);
      if (speed > t.peak) t.peak = speed;
      if (t.d0 > 8) t.over = Math.max(t.over, -(b.x * t.ux + b.y * t.uy) / t.d0);
      if (t.t >= t.next && t.frames.length < MAX_SHOTS) { t.frames.push({ x: b.x, y: b.y, r: tilt(b), f: Math.round(t.t * 60) }); t.next += SHOT; }
      if (Math.hypot(b.x, b.y) < REST_POS && speed < REST_SPEED) break;
    }
    b.x = b.y = b.vx = b.vy = 0; b.active = false; paint(i);
    setShots({ word: i, frames: t.frames.slice() });
    clearTrail(3500, 0);   // motion is reduced: the still stays long enough to read, then goes at once
    const r = { settle: t.t, peak: t.peak, over: t.d0 > 8 ? Math.max(0, t.over) : null };
    setRead(r); setResting(true);
    setStatus(`${say}. It would come to rest in ${r.settle.toFixed(2)} seconds on the ${springKey} spring. Motion is reduced, so the frames are shown as a still.`);
  };

  // ---- where each word sits, for drawing the frames behind it
  const measure = useCallback(() => {
    const hs = els.current.map((el) => (el ? { l: el.offsetLeft, t: el.offsetTop, w: el.offsetWidth, h: el.offsetHeight } : null));
    setHomes(hs);
    // the field: sized to the whole section. The surface lies in the band kept clear under the buttons, down to
    // the foot of the hero.
    const cv = field.current, bx = box.current, f = F.current;
    if (!cv || !bx) return;
    const sr = cv.getBoundingClientRect();   // the canvas reaches a little above the section
    const dpr = Math.min(2, window.devicePixelRatio || 1), w = Math.round(sr.width), h = Math.round(sr.height);
    if (w !== f.w || h !== f.h || dpr !== f.dpr) { cv.width = w * dpr; cv.height = h * dpr; }
    Object.assign(f, { w, h, dpr, top: h - (w < 760 ? 150 : 172), bottom: h - 30, ...inkOf(cv) });
    drawField();
  }, [drawField]);
  useLayoutEffect(() => {
    measure();
    if (typeof ResizeObserver === "undefined" || !sect.current) return;
    const ro = new ResizeObserver(measure);
    ro.observe(sect.current); ro.observe(box.current);
    return () => ro.disconnect();
  }, [measure]);
  // light or dark changed: the dots take the new colour
  useEffect(() => { if (field.current) { Object.assign(F.current, inkOf(field.current)); drawField(); } }, [mode, drawField]);

  // ---- the entrance: each word drops in, a beat after the one before, and comes to rest. Not under reduced motion.
  useLayoutEffect(() => {
    if (reduce) return;
    const now = performance.now();
    bodies.current.forEach((b, i) => {
      b.x = 0; b.y = -120; b.vx = 0; b.vy = 0; b.active = true; b.held = false; b.wait = now + 120 + i * 70;
      paint(i);
      if (els.current[i]) els.current[i].style.opacity = "0";
    });
    follow(WORDS.length - 1, "The sentence dropped in", false);   // timed, but its frames are not kept: they would sit over the line
    run();
    // on the first paint only
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- grabbing and throwing
  const drag = useRef(null);
  const onDown = (i) => (e) => {
    if (e.button != null && e.button !== 0) return;
    const b = bodies.current[i];
    b.held = true; b.active = false; b.vx = b.vy = 0;
    lift(i);
    drag.current = { i, id: e.pointerId, sx: e.clientX - b.x, sy: e.clientY - b.y, trail: [{ t: performance.now(), x: b.x, y: b.y }] };
    e.currentTarget.setPointerCapture?.(e.pointerId);
    setResting(false);
    run();
  };
  const onMove = (e) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    const b = bodies.current[d.i];
    b.x = e.clientX - d.sx; b.y = e.clientY - d.sy;
    const now = performance.now();
    d.trail.push({ t: now, x: b.x, y: b.y });
    while (d.trail.length > 2 && now - d.trail[0].t > 90) d.trail.shift();
    paint(d.i);
  };
  const onUp = (e) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    drag.current = null;
    const b = bodies.current[d.i], a = d.trail[0], z = d.trail[d.trail.length - 1];
    const span = Math.max(16, z.t - a.t) / 1000;
    b.vx = clamp((z.x - a.x) / span, -6000, 6000); b.vy = clamp((z.y - a.y) / span, -6000, 6000);
    const moved = Math.hypot(b.x, b.y) > 3 || Math.hypot(b.vx, b.vy) > 60;
    if (!moved) { b.vx = 900; b.vy = -1500; }   // a plain click or tap: toss it
    release(d.i, `"${WORDS[d.i].t}" thrown`);
  };
  const onKey = (i) => (e) => {
    const dirs = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
    const b = bodies.current[i];
    if (dirs[e.key]) { e.preventDefault(); b.vx = dirs[e.key][0] * 2200; b.vy = dirs[e.key][1] * 2200; release(i, `"${WORDS[i].t}" flicked`); }
    else if (e.key === "Enter" || e.key === " ") { e.preventDefault(); b.vx = 900; b.vy = -1500; release(i, `"${WORDS[i].t}" thrown`); }
  };

  const home = homes[shots.word];

  return (
    <section className="hero" aria-labelledby="hero-title" ref={sect} onPointerMove={onField}>
      <canvas className="hero__field" ref={field} aria-hidden />
      <div className="hero__in">
      <div className="say" ref={box}>
        <div className="say__frames" data-fading={fading || undefined} aria-hidden>
          {home && shots.frames.map((g, n) => (
            <span key={n} className="say__frame" data-first={n === 0 || undefined}
              style={{ left: home.l, top: home.t, width: home.w, height: home.h, opacity: n === 0 ? 0.9 : 0.14 + (n / shots.frames.length) * 0.5, transform: `translate3d(${g.x.toFixed(1)}px, ${g.y.toFixed(1)}px, 0) rotate(${g.r.toFixed(1)}deg)` }}>
              <span>{WORDS[shots.word].t}</span>
            </span>
          ))}
        </div>
        <h1 id="hero-title" className="say__line" aria-label={hero.titlePlain}>
          {WORDS.map((w, i) => (
            <Fragment key={w.t}>
            <button
              type="button" ref={(el) => { els.current[i] = el; }}
              className={`say__word${w.muted ? " say__word--muted" : ""}`} data-cursor="throw"
              aria-label={`The word "${w.t}". Drag and throw it, press an arrow key to flick it, or Enter to toss it.`}
              onPointerDown={onDown(i)} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp} onKeyDown={onKey(i)}
            >
              <span aria-hidden>{w.t}</span>
              {w.stop && <i className="say__stop" data-on={resting} aria-hidden />}
            </button>
            {w.br && <span className={`say__br say__br--${w.br}`} aria-hidden />}
            </Fragment>
          ))}
        </h1>
      </div>

      <div className="hero__row">
        <div className="hero__copy">
          <p className="hero__sub">{hero.sub(counts)}</p>
          <div className="hero__actions">
            <Key primary onClick={() => jumpTo("specimens")} chip={counts.specimens}>See them running</Key>
            <GitHubKey />
          </div>
        </div>
      </div>

      <p className="sr" role="status" aria-live="polite">{status}</p>
      </div>
    </section>
  );
}
