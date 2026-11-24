// Tweensmith's logo for React: the mark or the full lockup, the mark on a flat tile, and the line loader,
// with the brand's eight logo animations. Each one plays the timeline the brand book defines
// (../src/timelines.json) on the kit's own springs, so the logo moves the same way everywhere.
//
//   <TweensmithLogo animation="settle" size={32} />          the header mark, first paint
//   <TweensmithLogo animation="reveal" size={64} />          the full logo, for heroes
//   <TweensmithLogo animation="breathe" playOn="hover" />    hover and focus
//   <TweensmithLogo animation="sweep" size={20} />           the loader for small spaces
//   <TweensmithTile onPress={...} />                         the mark on a flat tile
//   <TweensmithRoll width={256} />                           the loader for wide spaces
//
// Under reduced motion every animation shows its rest state at once, and nothing moves.
import { forwardRef, useCallback, useEffect, useId, useImperativeHandle, useLayoutEffect, useRef, useState } from "react";
import { animate, useReducedMotion } from "motion/react";
import DATA from "../src/timelines.json";
import { part, pointAt, restTime } from "../src/timeline.js";

const { pad: PAD, mark: MARK, name: NAME, tile: TILE, roll: ROLL, rest: REST, animations: ANIMS, colours: COLOURS } = DATA;
const { cx: BX, cy: BY, r: BR } = MARK.ball;
const n = (v) => +v.toFixed(3);
const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;
/** Animation names that TweensmithLogo plays. Press and roll have their own components. */
export const LOGO_ANIMATIONS = Object.keys(ANIMS).filter((k) => ANIMS[k].scene === "mark" || ANIMS[k].scene === "lockup");

// ---------------------------------------------------------------- one clock ----
/** Runs a clock from `from` to `to` (ms of the timeline) in real time and calls `draw` with it on every frame. */
function useClock(draw) {
  const ctl = useRef(null);
  const stop = useCallback(() => { ctl.current?.stop(); ctl.current = null; }, []);
  const run = useCallback((from, to, { speed = 1, delay = 0, loop = false, onFinish } = {}) => {
    stop();
    draw(from);
    ctl.current = animate(from, to, {
      duration: (to - from) / 1000 / speed, delay: delay / 1000, ease: "linear", repeat: loop ? Infinity : 0,
      onUpdate: draw, onComplete: () => { ctl.current = null; onFinish?.(); },
    });
  }, [draw, stop]);
  useEffect(() => stop, [stop]);
  return { run, stop, running: () => !!ctl.current };
}

/** Moves the mark's parts (inside `root`) to where `anim` puts them at `t`. */
function drawMark(root, anim, t) {
  if (!root) return;
  const el = (name) => root.querySelector(`[data-part="${name}"]`);
  const v = (name) => part(anim, REST, name, t);
  const all = v("all");
  el("all")?.setAttribute("transform", `translate(${n(all[0])} ${n(all[1])})`);
  for (const k of ["pA", "pB", "pC"]) {
    const p = v(k), e = el(k);
    if (!e) continue;
    e.setAttribute("transform", `translate(${n(p[0])} ${n(p[1])}) rotate(${n(p[2])} ${BX} ${BY})`);
    e.setAttribute("opacity", n(p[3]));
  }
  const bx = v("bX"), by = v("bY"), bc = v("bC"), ball = el("ball");
  if (ball) {
    ball.setAttribute("transform", `translate(${n(bx[0] + by[0])} ${n(bx[1] + by[1])})`);
    ball.setAttribute("opacity", n(bc[0]));
    ball.style.fill = bc[1] <= 0 ? "currentColor" : bc[1] >= 1 ? COLOURS.green : `color-mix(in srgb, currentColor, ${COLOURS.green} ${n(bc[1] * 100)}%)`;
  }
  const ring = v("ring"), ringEl = el("ring");
  if (ringEl) {
    ringEl.setAttribute("transform", `translate(${BX} ${BY}) scale(${n(ring[0])}) translate(${-BX} ${-BY})`);
    ringEl.setAttribute("opacity", n(ring[1]));
  }
  for (let i = 0; i < NAME.std.letters.length; i++) {
    const e = el(`g${i}`);
    if (!e) break;
    const g = v(`g${i}`);
    e.setAttribute("transform", `translate(${n(g[0])} ${n(g[1])})`);
  }
  const dot = el("dot");
  if (dot) {
    const d = v("wD");
    dot.setAttribute("transform", `translate(${n(d[0])} ${n(d[1])})`);
    dot.setAttribute("opacity", n(v("wO")[0]));
  }
}

/** The mark's three pieces, the ring and the ball, as SVG. `small` draws the small master's pieces (wider cuts). */
function MarkParts({ small, ring }) {
  const P = small ? MARK.piecesSmall : MARK.pieces;
  const piece = (k) => (
    <g key={k} data-part={`p${k.toUpperCase()}`}>
      <path d={P[k]} fill="currentColor" />
    </g>
  );
  return (
    <>
      <g data-part="all">
        {["a", "b", "c"].map(piece)}
        {ring && <circle data-part="ring" cx={BX} cy={BY} r={BR} fill="none" stroke={COLOURS.green} strokeWidth={MARK.ringWidth} opacity="0" />}
        <circle data-part="ball" cx={BX} cy={BY} r={BR} fill="currentColor" />
      </g>
    </>
  );
}

// ---------------------------------------------------------------- the logo ----
/**
 * The mark, or the mark with the name (`name`, and always for "reveal").
 * `size` is the height of the mark in px. Under 24px it switches to the small cut, as the logo files do.
 * `playOn`: "mount" (default) plays once when it appears, "hover" plays on pointer hover and keyboard focus,
 * "none" waits for `ref.current.play()`. Loaders loop until unmounted.
 */
export const TweensmithLogo = forwardRef(function TweensmithLogo(
  { animation = "settle", size = 64, name = false, color, playOn = "mount", speed = 1, delay = 0, onFinish, label = "Tweensmith", className, style },
  ref,
) {
  const anim = ANIMS[animation] && ANIMS[animation].scene !== "key" && ANIMS[animation].scene !== "roll" ? ANIMS[animation] : null;
  const withName = name || anim?.scene === "lockup";
  const small = size < 24;
  const N = small ? NAME.sml : NAME.std;
  const W = withName ? N.width : MARK.size;
  const k = size / MARK.size;
  const id = useId().replace(/[^a-zA-Z0-9]/g, "");
  const reduce = useReducedMotion();
  const root = useRef(null);
  const draw = useCallback((t) => { if (anim) drawMark(root.current, anim, t); }, [anim]);
  const clock = useClock(draw);
  const done = useRef(onFinish);
  done.current = onFinish;

  const rest = useCallback(() => { clock.stop(); if (anim) draw(restTime(anim)); }, [anim, clock, draw]);
  const play = useCallback(() => {
    if (!anim) return;
    if (reduce) { rest(); done.current?.(); return; }
    clock.run(0, anim.play, { speed, delay, loop: anim.loop, onFinish: () => done.current?.() });
  }, [anim, reduce, clock, rest, speed, delay]);
  const seek = useCallback((ms) => { clock.stop(); draw(ms); }, [clock, draw]);
  useImperativeHandle(ref, () => ({ play, stop: rest, seek, duration: anim ? anim.play : 0 }), [play, rest, seek, anim]);

  // Before the first paint: the first frame if it is about to play, the rest state if not.
  useIsoLayoutEffect(() => {
    if (!anim) return;
    if (playOn === "mount" && !reduce) play(); else rest();
    return clock.stop;
  }, [anim, playOn, reduce, size, withName]);

  // "hover": the logo usually sits inside a link or a button, and that is the element that gets hover and focus.
  useEffect(() => {
    if (playOn !== "hover" || !root.current) return;
    const host = root.current.closest("a,button,[role=button],[tabindex]") || root.current;
    const go = () => { if (!clock.running()) play(); };
    host.addEventListener("pointerenter", go);
    host.addEventListener("focus", go);
    return () => { host.removeEventListener("pointerenter", go); host.removeEventListener("focus", go); };
  }, [playOn, play, clock]);
  const vb = [-PAD.left, -PAD.top, W + PAD.left + PAD.right, MARK.size + PAD.top + PAD.bottom];
  return (
    <span ref={root} role="img" aria-label={label} className={className}
      style={{ display: "inline-block", position: "relative", width: W * k, height: size, lineHeight: 0, verticalAlign: "middle", flex: "none", color, ...style }}>
      <svg viewBox={vb.join(" ")} width={vb[2] * k} height={vb[3] * k} aria-hidden="true" focusable="false"
        style={{ position: "absolute", left: -PAD.left * k, top: -PAD.top * k, overflow: "visible", pointerEvents: "none" }}>
        <MarkParts small={small} ring={animation === "done"} />
        {withName && (
          <g fill="currentColor">
            <clipPath id={`${id}r`}><rect x={N.clip.x} y={N.clip.y} width={N.clip.width} height={N.clip.height} /></clipPath>
            <g clipPath={`url(#${id}r)`}>
              {N.letters.map((d, i) => <path key={i} data-part={`g${i}`} d={d} />)}
            </g>
            <circle data-part="dot" cx={N.ball.cx} cy={N.ball.cy} r={N.ball.r} />
          </g>
        )}
      </svg>
    </span>
  );
});

// ---------------------------------------------------------------- the mark on a tile ----
const TK = ANIMS.press.parts.tile; // [press starts, fully pressed, release starts, back at rest]
const PRESS = { from: TK[0][0], down: TK[1][0], release: TK[2][0], back: TK[3][0], hop: ANIMS.press.parts.bY[0][0], end: ANIMS.press.play };
const pressAt = (t) => part(ANIMS.press, REST, "tile", t)[0];
/** The moment of the press at which the tile is `k` of the way pressed, so a press can start from where the tile is. */
function pressTimeFor(k) {
  let lo = PRESS.from, hi = PRESS.down;
  for (let i = 0; i < 20; i++) { const mid = (lo + hi) / 2; if (pressAt(mid) < k) lo = mid; else hi = mid; }
  return lo;
}

/**
 * The mark on a flat tile: a fill and a hairline edge, no shadow. A press scales the tile down a little in 90ms;
 * letting go returns it on the snappy spring and the ball hops.
 * Space and Enter press it exactly as a pointer does, and leaving the tile releases it.
 * `demo` plays the whole press once on mount, for docs and recordings.
 */
export const TweensmithTile = forwardRef(function TweensmithTile({ size = TILE.size, dark = false, demo = false, onPress, disabled = false, label = "Tweensmith", className, style }, ref) {
  const C = dark ? TILE.dark : TILE.light;
  const id = useId().replace(/[^a-zA-Z0-9]/g, "");
  const reduce = useReducedMotion();
  const face = useRef(null);
  const held = useRef(false);
  const pressed = useRef(0); // how far pressed the tile is now, 0 to 1
  const [still, setStill] = useState(false); // pressed, under reduced motion
  const anim = ANIMS.press;

  const drawTile = useCallback((t) => {
    const f = face.current;
    if (!f) return;
    const k = (pressed.current = pressAt(t));
    f.style.transform = `scale(${n(1 - k * (1 - TILE.scale))})`;
  }, []);
  const drawBall = useCallback((t) => drawMark(face.current, anim, t), [anim]);
  const tile = useClock(drawTile), ball = useClock(drawBall);

  const release = () => { tile.run(PRESS.release, PRESS.back); ball.run(PRESS.hop, PRESS.end); };
  const down = () => {
    if (disabled || held.current) return;
    held.current = true;
    if (reduce) return setStill(true);
    // start from where the tile is, and let it scale all the way before it comes back, so a quick tap still reads as a press
    tile.run(pressTimeFor(pressed.current), PRESS.down, { onFinish: () => { if (!held.current) release(); } });
  };
  const up = () => {
    if (!held.current) return;
    held.current = false;
    if (reduce) return setStill(false);
    if (!tile.running()) release();
  };
  const seek = useCallback((ms) => { tile.stop(); ball.stop(); drawTile(ms); drawBall(ms); }, [tile, ball, drawTile, drawBall]);
  const playDemo = useCallback(() => { if (!reduce) { tile.run(0, PRESS.end); ball.run(0, PRESS.end); } }, [tile, ball, reduce]);
  useImperativeHandle(ref, () => ({ play: playDemo, seek, duration: PRESS.end }), [playDemo, seek]);
  useIsoLayoutEffect(() => { seek(0); if (demo) playDemo(); return () => { tile.stop(); ball.stop(); }; }, [size, dark, demo, reduce]);

  const isKey = (e) => e.key === " " || e.key === "Enter";
  return (
    <button type="button" aria-label={label} disabled={disabled} className={className} onClick={onPress}
      onPointerDown={down} onPointerUp={up} onPointerLeave={up} onPointerCancel={up} onBlur={up}
      onKeyDown={(e) => { if (isKey(e) && !e.repeat) down(); }} onKeyUp={(e) => { if (isKey(e)) up(); }}
      style={{ appearance: "none", background: "none", border: 0, margin: 0, padding: 0, font: "inherit", boxSizing: "content-box", display: "inline-block", cursor: disabled ? "not-allowed" : "pointer", lineHeight: 0, borderRadius: TILE.radius * size, outlineOffset: 4, WebkitTapHighlightColor: "transparent", touchAction: "manipulation", ...style }}>
      <span ref={face}
        style={{ display: "grid", placeItems: "center", width: size, height: size, borderRadius: TILE.radius * size, background: still ? C.still : C.face, color: C.ink, boxShadow: `inset 0 0 0 1px ${C.edge}`, transition: `background-color ${TILE.stillMs}ms` }}>
        <svg viewBox={`0 0 ${MARK.size} ${MARK.size}`} width={TILE.mark * size} height={TILE.mark * size} aria-hidden="true" focusable="false" style={{ overflow: "visible" }}>
          <MarkParts small={false} ring={false} />
        </svg>
      </span>
    </button>
  );
});

// ---------------------------------------------------------------- the line loader ----
/** The loader for wide spaces: the ball rolls down a cut and comes to rest. `width` in px; the height follows. */
export const TweensmithRoll = forwardRef(function TweensmithRoll({ width = ROLL.width, color, label = "Loading", className, style }, ref) {
  const anim = ANIMS.roll;
  const reduce = useReducedMotion();
  const ball = useRef(null);
  const draw = useCallback((t) => {
    const b = ball.current;
    if (!b) return;
    const [d, o] = t == null ? REST.rb : part(anim, REST, "rb", t), [x, y] = pointAt(ROLL.points, d); // no time: at rest, at the end of the line
    b.setAttribute("cx", n(x));
    b.setAttribute("cy", n(y));
    b.setAttribute("opacity", n(o));
  }, [anim]);
  const clock = useClock(draw);
  useImperativeHandle(ref, () => ({ seek: (ms) => { clock.stop(); draw(ms); }, duration: anim.play }), [clock, draw, anim]);
  useIsoLayoutEffect(() => {
    if (reduce) { clock.stop(); draw(null); } else clock.run(0, anim.play, { loop: true });
    return clock.stop;
  }, [reduce, width]);
  return (
    <svg role="img" aria-label={label} className={className} viewBox={`0 0 ${ROLL.width} ${ROLL.height}`} width={width} height={(width * ROLL.height) / ROLL.width}
      style={{ display: "block", flex: "none", color, overflow: "visible", ...style }}>
      <path d={ROLL.path} fill="none" stroke="currentColor" strokeOpacity="0.13" strokeWidth={ROLL.line} strokeLinecap="round" />
      <circle ref={ball} r={ROLL.ball / 2} fill="currentColor" />
    </svg>
  );
});
