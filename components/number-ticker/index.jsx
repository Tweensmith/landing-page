"use client";
import { forwardRef, useEffect, useId, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { motion, AnimatePresence, animate, useIsPresent, useMotionValue } from "motion/react";
import { registerStyles, useStyles, useIsoLayoutEffect, useLocale, useReducedMotion } from "../_shared/theme.jsx";
import { useWidth } from "../_shared/page.jsx";
import { fmt, useInView } from "../_shared/chart.jsx";
import { Icon } from "../_shared/icons.jsx";

const CSS = `
.ts-nt{position:relative;isolation:isolate;display:inline-flex;align-items:baseline;white-space:nowrap;line-height:1.12;font-variant-numeric:tabular-nums;font-feature-settings:"tnum" 1;vertical-align:baseline}
.ts-nt--cue{padding-inline-end:.5em}
.ts-nt--cue[data-cue=start]{padding-inline-end:0;padding-inline-start:.5em}
.ts-nt__vis{display:inline-flex;align-items:baseline;user-select:none;-webkit-user-select:none}
.ts-nt__slot{display:inline-block;overflow:clip;vertical-align:baseline}
.ts-nt__d{position:relative;-webkit-mask-image:linear-gradient(transparent,black 9%,black 91%,transparent);mask-image:linear-gradient(transparent,black 9%,black 91%,transparent)}
.ts-nt__sz{display:inline-block;visibility:hidden;height:1.12em;line-height:1.12em}
.ts-nt__strip{position:absolute;left:0;right:0;top:0;will-change:transform}
.ts-nt__strip>span{display:block;height:1.12em;line-height:1.12em;text-align:center}
.ts-nt__rt{position:relative;display:inline-grid;overflow:clip;vertical-align:baseline}
.ts-nt__rti{grid-area:1/1;white-space:pre}
.ts-nt__meas{position:absolute;left:0;top:0;visibility:hidden;white-space:pre;pointer-events:none}
.ts-nt__xf{display:inline-grid}
.ts-nt__xf>span{grid-area:1/1;white-space:pre}
.ts-nt__xf .ts-nt__d{-webkit-mask-image:none;mask-image:none}
.ts-nt__ph{display:inline-block;height:.62em;border-radius:.14em;background:linear-gradient(90deg,var(--ts-surface2) 0%,color-mix(in srgb,var(--ts-ink) 9%,var(--ts-surface2)) 50%,var(--ts-surface2) 100%);background-size:200% 100%;animation:ts-nt-sh 1.3s linear infinite}
@keyframes ts-nt-sh{from{background-position:100% 0}to{background-position:-100% 0}}
.ts-nt__cue{--c:var(--ts-success);position:absolute;z-index:-1;inset:-.12em -.3em -.1em -.3em;border-radius:max(.3em,6px);background:radial-gradient(closest-side,color-mix(in srgb,var(--c) 17%,transparent),color-mix(in srgb,var(--c) 9%,transparent) 62%,transparent);pointer-events:none}
.ts-nt__cue[data-dir=down]{--c:var(--ts-danger)}
.ts-nt__arrow{position:absolute;right:.02em;top:.22em;width:clamp(8px,.34em,26px);height:clamp(8px,.34em,26px);color:var(--ts-success);pointer-events:none}
.ts-nt[data-cue=start] .ts-nt__arrow{right:auto;left:.02em}
.ts-nt__arrow[data-dir=down]{color:var(--ts-danger)}
.ts-nt__arrow svg{display:block;width:100%;height:100%;overflow:visible}
.ts-nt__fix{white-space:pre}
.ts-nt[data-tone=inverted] .ts-nt__cue[data-dir=up],.ts-nt[data-tone=inverted] .ts-nt__arrow[data-dir=up]{--c:var(--ts-danger);color:var(--ts-danger)}
.ts-nt[data-tone=inverted] .ts-nt__cue[data-dir=down],.ts-nt[data-tone=inverted] .ts-nt__arrow[data-dir=down]{--c:var(--ts-success);color:var(--ts-success)}
.ts-nt[data-tone=neutral] .ts-nt__cue{--c:var(--ts-accent)}
.ts-nt[data-tone=neutral] .ts-nt__arrow{color:var(--ts-ink2)}
@media (prefers-reduced-motion:reduce){.ts-nt__ph{animation:none}}

.ts-ntb{box-sizing:border-box;width:min(780px,100%);display:flex;flex-direction:column;gap:20px;padding:22px 26px 20px;border-radius:var(--ts-radius-lg);background:var(--ts-surface);box-shadow:inset 0 0 0 1px var(--ts-line),var(--ts-shadow);color:var(--ts-ink);font-family:var(--ts-font)}
.ts-ntb__top{display:flex;align-items:center;gap:10px 12px;flex-wrap:wrap}
.ts-ntb__live{display:inline-flex;align-items:center;gap:7px;height:22px;padding:0 9px 0 8px;border-radius:99px;font:600 10.5px/1 var(--ts-font-mono);letter-spacing:.14em;text-transform:uppercase;color:var(--ts-ink);background:color-mix(in srgb,var(--ts-danger) 13%,transparent)}
.ts-ntb__live[data-on=false]{background:var(--ts-surface2);color:var(--ts-ink2)}
.ts-ntb__dot{position:relative;width:6px;height:6px;border-radius:9px;background:var(--ts-danger)}
.ts-ntb__live[data-on=false] .ts-ntb__dot{background:var(--ts-ink3)}
.ts-ntb__live[data-on=true] .ts-ntb__dot::after{content:"";position:absolute;inset:-4px;border-radius:99px;border:1.5px solid var(--ts-danger);animation:ts-ntb-ping 1.6s cubic-bezier(.2,.6,.3,1) infinite}
@keyframes ts-ntb-ping{0%{transform:scale(.5);opacity:.7}100%{transform:scale(1.4);opacity:0}}
.ts-ntb__name{font-size:13.5px;font-weight:600;letter-spacing:-.01em}
.ts-ntb__name span{font-weight:450;color:var(--ts-ink2)}
.ts-ntb__ends{margin-left:auto;font:500 10.5px/1 var(--ts-font-mono);letter-spacing:.14em;text-transform:uppercase;color:var(--ts-ink3)}
.ts-ntb__herobox{display:flex;flex-direction:column;gap:8px;min-width:0}
.ts-ntb__label{font-size:13px;color:var(--ts-ink2)}
.ts-ntb__hero{font-weight:640;letter-spacing:-.04em;color:var(--ts-ink);line-height:1.12;min-width:0}
.ts-ntb__hero .ts-nt__sym,.ts-ntb__hero .ts-nt__dec,.ts-ntb__hero .ts-nt__d[data-frac]{font-size:.44em;align-self:flex-start;margin-top:.26em;color:var(--ts-ink2);letter-spacing:-.01em}
.ts-ntb__hero .ts-nt__sym{margin-right:.08em}
.ts-ntb__hero .ts-nt__unit{color:var(--ts-ink2)}
.ts-ntb__sub{display:flex;align-items:baseline;gap:6px;flex-wrap:wrap;font-size:13.5px;color:var(--ts-ink2)}
.ts-ntb__sub strong{font-weight:620;color:var(--ts-ink)}
.ts-ntb__goal{display:grid;gap:7px;margin-top:6px}
.ts-ntb__goalrow{display:flex;justify-content:space-between;gap:12px;font-size:12px;color:var(--ts-ink2)}
.ts-ntb__goalrow b{font-weight:600;color:var(--ts-ink)}
.ts-ntb__track{position:relative;height:4px;border-radius:99px;background:var(--ts-surface2);overflow:hidden}
.ts-ntb__fill{position:absolute;left:0;right:0;top:0;bottom:0;border-radius:99px;background:var(--ts-accent)}
.ts-ntb__stats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));border-top:1px solid var(--ts-line);border-bottom:1px solid var(--ts-line)}
.ts-ntb__stat{display:flex;flex-direction:column;gap:6px;min-width:0;padding:14px 0 15px 16px;border-left:1px solid var(--ts-line)}
.ts-ntb__stat:first-child{padding-left:0;border-left:0}
.ts-ntb__stat dt{font-size:12px;color:var(--ts-ink2)}
.ts-ntb__stat dd{margin:0;display:flex;align-items:baseline;gap:3px;font-size:25px;font-weight:620;letter-spacing:-.025em;color:var(--ts-ink)}
.ts-ntb__stat dd small{font-size:12px;font-weight:500;letter-spacing:0;color:var(--ts-ink3)}
.ts-ntb__table{width:100%;border-collapse:collapse;font-size:13.5px}
.ts-ntb__table th{padding:0 0 8px;text-align:left;font:500 10.5px/1 var(--ts-font-mono);letter-spacing:.14em;text-transform:uppercase;color:var(--ts-ink3)}
.ts-ntb__table td{padding:9px 0;border-top:1px solid var(--ts-line);color:var(--ts-ink)}
.ts-ntb__table [data-num]{text-align:right;font-variant-numeric:tabular-nums}
.ts-ntb__table td[data-num]{color:var(--ts-ink)}
.ts-ntb__table .ts-ntb__muted{color:var(--ts-ink3)}
.ts-ntb__tier{display:flex;align-items:center;gap:8px}
.ts-ntb__tier i{font-style:normal;font-size:12px;color:var(--ts-ink3)}
.ts-ntb__pill{display:inline-flex;align-items:center;gap:4px;height:19px;padding:0 7px;border-radius:99px;font-size:11px;font-weight:600;color:var(--ts-ink2);background:var(--ts-surface2)}
.ts-ntb__feed{display:flex;align-items:baseline;gap:10px;min-width:0;font-size:13px;color:var(--ts-ink2)}
.ts-ntb__feed>span:first-child{flex:none;font:500 10.5px/1 var(--ts-font-mono);letter-spacing:.14em;text-transform:uppercase;color:var(--ts-ink3)}
.ts-ntb__feed .ts-nt__rt{min-width:0;color:var(--ts-ink)}
.ts-ntb__bar{display:flex;align-items:center;gap:8px;flex-wrap:wrap;padding-top:14px;border-top:1px solid var(--ts-line)}
.ts-ntb__bar p{margin:0 auto 0 0;font-size:12.5px;color:var(--ts-ink2)}
.ts-ntb__btn{all:unset;box-sizing:border-box;display:inline-flex;align-items:center;gap:6px;height:32px;padding:0 12px;border-radius:var(--ts-radius-button,var(--ts-radius-md));font-size:12.5px;font-weight:600;cursor:pointer;color:var(--ts-ink);background:var(--ts-surface2);transition:background-color .2s}
.ts-ntb__btn:hover{background:color-mix(in srgb,var(--ts-ink) 9%,var(--ts-surface2))}
.ts-ntb__btn.is-primary{background:var(--ts-accent);color:var(--ts-accent-ink)}
.ts-ntb__btn.is-primary:hover{background:color-mix(in srgb,var(--ts-ink) 10%,var(--ts-accent))}
.ts-ntb__btn:focus-visible{outline:2px solid var(--ts-focus);outline-offset:2px}
.ts-ntb__btn:active{transform:translateY(1px)}
.ts-ntb__btn:disabled{opacity:.4;cursor:default;transform:none}
.ts-ntb[data-narrow=true]{padding:18px 18px 16px;gap:16px}
.ts-ntb[data-narrow=true] .ts-ntb__stats{grid-template-columns:repeat(2,minmax(0,1fr))}
.ts-ntb[data-narrow=true] .ts-ntb__stat:nth-child(3){padding-left:0;border-left:0}
.ts-ntb[data-narrow=true] .ts-ntb__stat:nth-child(n+3){border-top:1px solid var(--ts-line)}
.ts-ntb[data-narrow=true] .ts-ntb__stat dd{font-size:22px}
.ts-ntb[data-narrow=true] .ts-ntb__price{display:none}
.ts-ntb[data-narrow=true] .ts-ntb__ends{margin-left:0;width:100%}
.ts-ntb[data-narrow=true] .ts-ntb__bar p{width:100%}
.ts-ntb[data-narrow=true] .ts-ntb__live,.ts-ntb[data-narrow=true] .ts-ntb__ends,.ts-ntb[data-narrow=true] .ts-ntb__table th,.ts-ntb[data-narrow=true] .ts-ntb__feed>span:first-child{font-size:11px}
.ts-ntb[data-narrow=true] .ts-ntb__live{height:24px}
.ts-ntb[data-narrow=true] .ts-ntb__feed .ts-nt__rt{max-width:100%;grid-template-columns:minmax(0,1fr);line-height:1.45}
.ts-ntb[data-narrow=true] .ts-ntb__feed .ts-nt__rti{white-space:normal}
.ts-ntb[data-narrow=true] .ts-ntb__bar{flex-wrap:wrap;row-gap:12px}
.ts-ntb[data-narrow=true] .ts-ntb__acts{display:flex;gap:8px;width:100%}
.ts-ntb[data-narrow=true] .ts-ntb__acts .ts-ntb__btn{flex:1 1 auto;justify-content:center;padding:0 10px}
.ts-ntb[data-narrow=true] .ts-ntb__acts .ts-ntb__btn.is-icon{flex:none;width:44px;padding:0}
.ts-ntb__acts{display:contents}
.ts-ntb__btn.is-icon{gap:0}
@media (max-width:640px),(pointer:coarse){.ts-ntb__btn{height:44px;font-size:13px}}
@media (prefers-reduced-motion:reduce){.ts-ntb__live[data-on=true] .ts-ntb__dot::after{animation:none;opacity:0}}
.ts-ntb[data-idle=true] .ts-ntb__live .ts-ntb__dot::after,.ts-ntb[data-idle=true] .ts-nt__ph{animation-play-state:paused}
`;
registerStyles("ts-number-ticker", CSS);

/* ------------------------------------------------------------------ engine */

const H = 1.12; // reel cell height (em); matches the CSS line-height
const MAX_SPINS = 1; // carry mode: a column turns at most this many full revolutions before landing
const WIDTH = { type: "spring", stiffness: 320, damping: 36, mass: 0.9 };
const mod10 = (n) => ((Math.round(n) % 10) + 10) % 10;

const nfCache = new Map();
function intlOptions(format, decimals, currency, abs, extra) {
  const o = { numberingSystem: "latn" };
  if (extra) { const r = intlOptions(format, decimals, currency, abs); return { ...r, ...extra, numberingSystem: "latn" }; }
  const fixed = (d) => { o.minimumFractionDigits = d; o.maximumFractionDigits = d; };
  switch (format) {
    case "decimal": fixed(decimals ?? 2); break;
    case "currency": o.style = "currency"; o.currency = currency; fixed(decimals ?? 2); break;
    case "percent": o.style = "percent"; fixed(decimals ?? 1); break;
    case "compact":
    case "compact-currency":
      o.notation = "compact";
      if (format === "compact-currency") { o.style = "currency"; o.currency = currency; }
      fixed(abs >= 1000 ? decimals ?? 1 : 0);
      break;
    default: fixed(0);
  }
  return o;
}
function formatter(locale, o) {
  const k = locale + JSON.stringify(o);
  if (!nfCache.has(k)) nfCache.set(k, new Intl.NumberFormat(locale, o));
  return nfCache.get(k);
}

/** "integer" is the default format, and on its own it would silently turn 2.4 into 2. A value that has a
 *  fraction keeps it (up to two places) unless the caller sets `decimals`; pass decimals={0} to round. Works
 *  from the value the caller passed, never from a count-up's in-between values. */
export function resolveFormat(value, format = "integer", decimals) {
  if (format !== "integer" || decimals !== undefined || typeof value !== "number" || !Number.isFinite(value) || Number.isInteger(value)) return { format, decimals };
  return { format: "decimal", decimals: Math.min(2, (String(value).split(".")[1] || "").length) || 2 };
}

/** Split a formatted number into keyed slots. Digits are keyed by place value (d3 = thousands), so a column
 *  keeps its identity when the number grows a digit; separators are keyed by the place they sit above. */
export function tickerLayout(value, { format = "integer", decimals, currency = "USD", locale = "en-US", options } = {}) {
  const parts = formatter(locale, intlOptions(format, decimals, currency, Math.abs(value), options)).formatToParts(value);
  const intDigits = parts.filter((p) => p.type === "integer").map((p) => p.value).join("");
  const fracDigits = parts.filter((p) => p.type === "fraction").map((p) => p.value).join("");
  const I = intDigits.length;
  const tokens = [];
  let k = 0, j = 0, seen = false, unit = "";
  parts.forEach((p, idx) => {
    if (p.type === "integer") for (const ch of p.value) { const place = I - 1 - k++; tokens.push({ kind: "d", key: "d" + place, place, digit: +ch }); seen = true; }
    else if (p.type === "fraction") for (const ch of p.value) { const place = -++j; tokens.push({ kind: "d", key: "d" + place, place, digit: +ch, frac: true }); }
    else if (p.type === "group") tokens.push({ kind: "g", key: "g" + (I - k), text: p.value, cls: "grp" });
    else if (p.type === "decimal") tokens.push({ kind: "t", key: "dec", text: p.value, cls: "dec" });
    else if (p.type === "currency") tokens.push({ kind: "t", key: "cur", text: p.value, cls: "sym" });
    else if (p.type === "percentSign") tokens.push({ kind: "t", key: "pct", text: p.value, cls: "sym" });
    else if (p.type === "compact") { unit = p.value; tokens.push({ kind: "t", key: "unit", text: p.value, cls: "unit" }); }
    else if (p.type === "minusSign" || p.type === "plusSign") tokens.push({ kind: "t", key: "sign", text: p.value, cls: "sign" });
    else tokens.push({ kind: "t", key: (seen ? "post-" : "pre-") + p.type + idx, text: p.value, cls: "lit" });
  });
  return { value, tokens, digits: intDigits + fracDigits, minPlace: -fracDigits.length, sig: `${format}|${options ? JSON.stringify(options) : ""}|${unit}|${fracDigits.length}`, text: parts.map((p) => p.value).join("") };
}

// The number a column has "counted" to: every digit at or above `place`. A wheel's true travel is the change in this.
function prefix(layout, place) {
  const n = layout.digits.length - (place - layout.minPlace);
  return n > 0 ? Number(layout.digits.slice(0, n)) : 0;
}

/** Plan each column's absolute reel position. prev holds the last committed layout and reel targets. */
function planReels(prev, next, mode, stagger) {
  const targets = new Map(), delays = new Map(), initial = new Map(), lead = new Set();
  const dir = prev ? Math.sign(next.value - prev.value) : 0;
  const sameScale = prev && prev.sig === next.sig;
  const digits = next.tokens.filter((t) => t.kind === "d");
  const top = prev ? Math.max(0, ...prev.tokens.filter((t) => t.kind === "d").map((t) => t.place)) : 0;
  const changed = [];
  digits.forEach((t, i) => {
    const rank = digits.length - 1 - i;
    if (!prev) { targets.set(t.key, t.digit); initial.set(t.key, t.digit); return; }
    const had = prev.targets.has(t.key);
    const from = had ? prev.targets.get(t.key) : 0;
    const od = mod10(from);
    // a new leading column grows out of an implied (blank) zero, always counting upward
    const isLead = !had && t.place > top;
    if (isLead) lead.add(t.key);
    let delta;
    if (isLead && !(mode === "carry" && sameScale)) delta = t.digit;
    else if (mode === "direct") delta = t.digit - od;
    else if (mode === "shortest" || (mode === "carry" && !sameScale && dir === 0)) {
      delta = (((t.digit - od) % 10) + 10) % 10;
      if (delta > 5 || (delta === 5 && dir < 0)) delta -= 10;
    } else if (sameScale) {
      const steps = prefix(next, t.place) - prefix(prev, t.place);
      const a = Math.abs(steps);
      delta = Math.sign(steps) * (a <= 10 ? a : (a % 10) + 10 * Math.min(MAX_SPINS, Math.floor(a / 10)));
    } else delta = dir > 0 ? (((t.digit - od) % 10) + 10) % 10 : -((((od - t.digit) % 10) + 10) % 10);
    let target = from + delta;
    const fix = (((t.digit - mod10(target)) % 10) + 10) % 10; // safety: always land on the right digit
    if (fix) target += fix > 5 ? fix - 10 : fix;
    targets.set(t.key, target);
    initial.set(t.key, had ? from : 0);
    if (target !== from) changed.push(rank);
  });
  const first = changed.length ? Math.min(...changed) : 0;
  digits.forEach((t, i) => delays.set(t.key, Math.max(0, digits.length - 1 - i - first) * stagger));
  return { targets, delays, initial, lead, dir, changed: !!prev && next.text !== prev.text };
}

/** One digit column: a 4-cell window onto an endless 0–9 wheel, driven by a spring on an unbounded position.
 *  Velocity feeds a vertical-only SVG blur and a slight stretch, so fast wheels smear like real ones. */
function Reel({ target, initial, lead, delay, stiffness, damping, blur, ctx }) {
  const isPresent = useIsPresent();
  const pos = useMotionValue(initial);
  const strip = useRef(null), cells = useRef([]), fe = useRef(null);
  const fid = "nt-" + useId().replace(/:/g, "");
  // lo / hi: absolute wheel positions at or beyond which a cell is blank (implied leading zero)
  // The cells are written imperatively by paint(); React renders them once from the mount-time position only,
  // so a re-render with a new `initial` (a change mid-roll) can't overwrite glyphs the painter has cached.
  const [mount] = useState(() => ({ initial, lead }));
  const st = useRef({ base: null, px: 16, anim: null, aim: initial, blur, lo: lead ? initial : -Infinity, hi: Infinity, runs: 0 });
  st.current.blur = blur;

  const paint = (v, still) => {
    const s = strip.current;
    if (!s) return;
    const S = st.current, base = Math.floor(v), f = v - base;
    if (base !== S.base) {
      S.base = base;
      for (let i = 0; i < 4; i++) {
        const abs = base + i - 1;
        if (cells.current[i]) cells.current[i].textContent = abs <= S.lo || abs >= S.hi ? "" : String(mod10(abs));
      }
    }
    const fs = st.current.px;
    const px = still ? 0 : Math.min(fs * 0.3, Math.abs(pos.getVelocity()) * fs * 0.0065 * st.current.blur);
    const stretch = px > 0.4 ? 1 + Math.min(0.12, (px / fs) * 0.45) : 1;
    s.style.transformOrigin = `50% ${(1.5 + f) * H}em`;
    s.style.transform = `translate3d(0,${(-(1 + f) * H).toFixed(4)}em,0)` + (stretch > 1 ? ` scaleY(${stretch.toFixed(3)})` : "");
    if (px > 0.3 && fe.current) { fe.current.setAttribute("stdDeviation", `0 ${px.toFixed(2)}`); s.style.filter = `url(#${fid})`; }
    else s.style.filter = "none";
  };

  useIsoLayoutEffect(() => {
    paint(pos.get(), true);
    const S = st.current;
    return pos.on("change", (v) => {
      // track the wheel's own speed: when a re-render is slow, Motion's getVelocity() reads 0 by the time a
      // retarget runs (it forgets after 30ms), which would cut the wheel's momentum
      const now = performance.now();
      if (S.vt != null && now > S.vt) S.vel = ((v - S.vv) / (now - S.vt)) * 1000;
      S.vv = v; S.vt = now;
      paint(v, false);
    });
  }, []);

  useEffect(() => {
    const S = st.current;
    let want = target;
    if (!isPresent) {
      const od = mod10(S.aim), dir = ctx.current.dir;
      want = od === 0 ? S.aim : dir >= 0 ? S.aim + (10 - od) : S.aim - od;
      if (dir >= 0) S.hi = want; else S.lo = want;
      S.base = null;
      paint(pos.get(), !S.anim);
    } else if (S.runs > 0 && S.lo !== -Infinity) { S.lo = -Infinity; S.base = null; }
    if (want === S.aim && (S.anim || pos.get() === want)) return;
    S.runs++;
    S.px = strip.current ? parseFloat(getComputedStyle(strip.current).fontSize) || 16 : 16;
    const moving = !!S.anim;
    const vel = moving && S.vt != null && performance.now() - S.vt < 100 ? S.vel : 0;
    S.anim?.stop();
    S.aim = want;
    S.anim = animate(pos, want, {
      type: "spring", stiffness, damping, velocity: vel, restDelta: 0.002, restSpeed: 0.05, delay: moving ? 0 : delay / 1000,
      onComplete: () => { S.anim = null; paint(pos.get(), true); },
    });
    return undefined;
  }, [target, isPresent]);
  useEffect(() => () => st.current.anim?.stop(), []);

  return (
    <>
      <svg width="0" height="0" aria-hidden style={{ position: "absolute" }}>
        <filter id={fid} x="-5%" y="-20%" width="110%" height="140%" colorInterpolationFilters="sRGB"><feGaussianBlur ref={fe} stdDeviation="0 0" /></filter>
      </svg>
      <span className="ts-nt__sz">0</span>
      <span ref={strip} className="ts-nt__strip">
        {[0, 1, 2, 3].map((i) => { const abs = Math.floor(mount.initial) + i - 1; return <span key={i} ref={(el) => (cells.current[i] = el)}>{mount.lead && abs <= mount.initial ? "" : mod10(abs)}</span>; })}
      </span>
    </>
  );
}

/** Text that rolls when it changes (a compact unit K → M, a currency symbol). Width springs to the new text. */
export function RollText({ text, dir = 1, className = "" }) {
  const reduce = useReducedMotion();
  const meas = useRef(null);
  const [w, setW] = useState(null);
  useIsoLayoutEffect(() => {
    const el = meas.current;
    if (!el) return;
    const read = () => setW(el.getBoundingClientRect().width);
    read();
    const ro = new ResizeObserver(read);
    ro.observe(el);
    return () => ro.disconnect();
  }, [text]);
  const d = dir < 0 ? -1 : 1;
  const v = reduce
    ? { enter: { opacity: 0 }, center: { opacity: 1 }, exit: { opacity: 0 } }
    : {
        enter: (k) => ({ y: `${0.95 * k}em`, opacity: 0, filter: "blur(2px)" }),
        center: { y: "0em", opacity: 1, filter: "blur(0px)" },
        exit: (k) => ({ y: `${-0.95 * k}em`, opacity: 0, filter: "blur(2px)" }),
      };
  return (
    <motion.span className={"ts-nt__rt " + className} initial={false} animate={{ width: w ?? "auto" }} transition={reduce ? { duration: 0 } : WIDTH}>
      <span ref={meas} className="ts-nt__meas" aria-hidden>{text}</span>
      <AnimatePresence initial={false} custom={d}>
        <motion.span key={text} className="ts-nt__rti" custom={d} variants={v} initial="enter" animate="center" exit="exit"
          transition={reduce ? { duration: 0.16 } : { type: "spring", stiffness: 380, damping: 32, opacity: { duration: 0.2 } }}>
          {text}
        </motion.span>
      </AnimatePresence>
    </motion.span>
  );
}

function Cue({ dir, reduce }) {
  const d = dir > 0 ? "up" : "down";
  return (
    <>
      <motion.span className="ts-nt__cue" data-dir={d} aria-hidden initial={{ opacity: 1 }} animate={{ opacity: 0 }} transition={{ duration: 1.3, delay: 0.3, ease: [0.2, 0.7, 0.3, 1] }} />
      <motion.span className="ts-nt__arrow" data-dir={d} aria-hidden
        initial={{ opacity: 0, y: reduce ? 0 : dir > 0 ? "0.22em" : "-0.22em" }}
        animate={{ opacity: [0, 1, 1, 0], y: "0em" }}
        transition={{ opacity: { duration: 1.9, times: [0, 0.08, 0.62, 1] }, y: reduce ? { duration: 0 } : { type: "spring", stiffness: 520, damping: 26 } }}>
        <svg viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          <path d={dir > 0 ? "M5 8.6V1.6M1.9 4.6 5 1.5l3.1 3.1" : "M5 1.4v7M1.9 5.4 5 8.5l3.1-3.1"} />
        </svg>
      </motion.span>
    </>
  );
}

/**
 * Ticker: the reusable primitive. Each digit is a spring-driven wheel keyed by place value. In "carry" mode a
 * wheel travels the true distance (adding 10 spins the units wheel once, like a mechanical counter, capped so
 * big jumps don't spin forever); "shortest" takes the short way round; "direct" rolls straight along 0–9.
 * Columns start right-to-left like a carry, blur with speed, new separators and digits grow in, compact units
 * roll (999.9K → 1.0M). Changes flash an arrow and a tint behind the number. Settled values are announced
 * politely, once; reduced motion cuts straight to the new value.
 *
 * <Ticker value={1284512.4} format="currency" label="Raised so far" announce />
 */
export const Ticker = forwardRef(function Ticker({
  value,
  format = "integer",
  decimals,
  currency = "USD",
  locale: localeProp,
  options,
  prefix,
  suffix,
  direction = "carry",
  blur = 1,
  stiffness = 170,
  damping = 22,
  stagger = 45,
  cue = true,
  cueTone = "default",
  cuePosition = "end",
  countUp = false,
  from = 0,
  label,
  announce = false,
  announceEvery = 0,
  loading = false,
  placeholder = 3.2,
  className = "",
  style,
  ...rest
}, ref) {
  const sheetTag = useStyles("ts-number-ticker", CSS);
  const locale = useLocale(localeProp);   // the caller's locale, else the Theme's
  const reduce = useReducedMotion();
  const root = useRef(null);
  const setRoot = (el) => { root.current = el; if (typeof ref === "function") ref(el); else if (ref) ref.current = el; };
  const seen = useInView(root, { amount: 0.35 });
  const shown = value == null || loading ? null : countUp && !seen && !reduce ? from : value;
  const optKey = options ? JSON.stringify(options) : "";
  const rf = resolveFormat(value, format, decimals);
  const layout = useMemo(() => (shown == null ? null : tickerLayout(shown, { format: rf.format, decimals: rf.decimals, currency, locale, options })), [shown, rf.format, rf.decimals, currency, locale, optKey]);
  const committed = useRef(null);
  const ctx = useRef({ dir: 0 });
  const plan = useMemo(() => (layout ? planReels(committed.current, layout, direction, stagger) : null), [layout, direction]);
  const [flash, setFlash] = useState(null);
  const wasSeen = useRef(seen);
  useIsoLayoutEffect(() => {
    if (!layout || !plan) return;
    committed.current = { ...layout, targets: plan.targets };
    ctx.current.dir = plan.dir;
    const entrance = countUp && seen && !wasSeen.current; // the count-up is an entrance, not a change: no cue
    wasSeen.current = seen;
    if (plan.changed && plan.dir && !entrance) setFlash({ dir: plan.dir, id: performance.now() });
  }, [plan]);

  // polite announcements: once the value has settled (900ms quiet), so a screen reader hears the final value once
  // and never the frames in between. announceEvery (ms) spaces announcements out for values that change all the
  // time (a live total); under constant churn the value is still announced at least every ~15s.
  const pre = typeof prefix === "string" || typeof prefix === "number" ? String(prefix) : "";
  const suf = typeof suffix === "string" || typeof suffix === "number" ? String(suffix) : "";
  const text = layout ? pre + layout.text + suf : null;
  const [live, setLive] = useState(text ?? "");
  const pend = useRef({ t: 0, last: 0, first: true });
  useEffect(() => {
    if (!announce || text == null) return;
    const P = pend.current, now = Date.now();
    if (P.first) { P.first = false; setLive(text); P.last = now; return; } // the first value is content, not news
    if (!P.last) P.last = now;
    clearTimeout(P.t);
    const wait = now - P.last > 15000 ? 0 : Math.max(900, P.last + announceEvery - now);
    P.t = setTimeout(() => { setLive(text); P.last = Date.now(); }, wait);
  }, [text, announce]);
  useEffect(() => () => clearTimeout(pend.current.t), []);

  const spec = { stiffness, damping, blur };
  return (
    <>{sheetTag}<span ref={setRoot} className={"ts-nt" + (cue ? " ts-nt--cue" : "") + (className ? " " + className : "")} data-cue={cuePosition} data-tone={cueTone} style={style} {...rest}>
      {cue && flash && <Cue key={flash.id} dir={flash.dir} reduce={reduce} />}
      {prefix != null && prefix !== "" && <span className="ts-nt__fix ts-nt__pre" aria-hidden>{prefix}</span>}
      {!layout ? (
        <span className="ts-nt__ph" style={{ width: placeholder + "em" }} aria-hidden />
      ) : reduce ? (
        // reduced motion: no wheels and no fade, the new value replaces the old one at once
        <span className="ts-nt__vis" aria-hidden>
          {layout.tokens.map((t) => t.kind === "d"
            ? <span key={t.key} className="ts-nt__slot ts-nt__d" data-frac={t.frac || undefined}>{t.digit}</span>
            : <span key={t.key} className={"ts-nt__slot ts-nt__t ts-nt__" + t.cls}>{t.text}</span>)}
        </span>
      ) : (
        <span className="ts-nt__vis" aria-hidden>
          <AnimatePresence initial={false}>
            {layout.tokens.map((t) =>
              t.kind === "d" ? (
                <motion.span key={t.key} className="ts-nt__slot ts-nt__d" data-frac={t.frac || undefined}
                  initial={{ width: 0, opacity: 0 }} animate={{ width: "auto", opacity: 1 }} exit={{ width: 0, opacity: 0, transition: WIDTH }}
                  transition={{ ...WIDTH, delay: plan.lead.has(t.key) ? plan.delays.get(t.key) / 1000 : 0 }}>
                  <Reel target={plan.targets.get(t.key)} initial={plan.initial.get(t.key)} lead={plan.lead.has(t.key)} delay={plan.delays.get(t.key)} ctx={ctx} {...spec} />
                </motion.span>
              ) : (
                <motion.span key={t.key} className={"ts-nt__slot ts-nt__t ts-nt__" + t.cls}
                  initial={{ width: 0, opacity: 0, y: t.kind === "g" ? "-0.4em" : "0em" }} animate={{ width: "auto", opacity: 1, y: "0em" }} exit={{ width: 0, opacity: 0, transition: WIDTH }}
                  transition={{ ...WIDTH, delay: t.kind === "g" && plan.lead.has("d" + t.key.slice(1)) ? plan.delays.get("d" + t.key.slice(1)) / 1000 : 0 }}>
                  <RollText text={t.text} dir={plan.dir || 1} />
                </motion.span>
              )
            )}
          </AnimatePresence>
        </span>
      )}
      {suffix != null && suffix !== "" && <span className="ts-nt__fix ts-nt__suf" aria-hidden>{suffix}</span>}
      {announce ? (
        <span className="ts-sr" role="status" aria-live="polite" aria-atomic="true">{text == null ? "" : (label ? label + ": " : "") + live}</span>
      ) : (
        <span className="ts-sr">{(label ? label + ": " : "") + (text ?? "loading")}</span>
      )}
    </span></>
  );
});

/* --------------------------------------------------------------- showcase */

// the demo board's hero figure in px (it still shrinks to fit a narrow card): sm for a quieter board, lg the most a full-width (780px) board fits
const SIZES = { sm: 56, md: 84, lg: 104 };
const GOAL = 200000;
const STRETCH = { at: 1500000, name: "Ambisonic capsule" };
const CITIES = ["Oslo, NO", "Osaka, JP", "Leeds, UK", "Austin, US", "Lyon, FR", "Melbourne, AU", "Berlin, DE", "Toronto, CA", "Seoul, KR", "Lisbon, PT", "Nairobi, KE", "São Paulo, BR", "Reykjavík, IS", "Utrecht, NL", "Taipei, TW", "Cape Town, ZA"];
const TIPS = [5, 10, 12.5, 20, 3.27, 7.77, 1.5];
const pick = (a) => a[Math.floor(Math.random() * a.length)];

const startState = (raised) => ({
  raised,
  backers: 7121,
  countries: 61,
  views: 999310,
  rate: 1842,
  tiers: [
    { id: "early", name: "Early bird", price: 149, claimed: 993, limit: 1000 },
    { id: "std", name: "Standard", price: 199, claimed: 4310, limit: null },
    { id: "pair", name: "Studio pair", price: 379, claimed: 611, limit: 800 },
  ],
  latest: { text: "$199.00 · Standard · Leeds, UK", dir: 1 },
});
const zeroState = () => ({
  raised: 0, backers: 0, countries: 0, views: 0, rate: 0,
  tiers: startState(0).tiers.map((t) => ({ ...t, claimed: 0 })),
  latest: { text: "Waiting for the first pledge", dir: 1 },
});

const subscribeVisibility = (f) => { document.addEventListener("visibilitychange", f); return () => document.removeEventListener("visibilitychange", f); };

function step(s, kind, locale) {
  const tiers = s.tiers.map((t) => ({ ...t }));
  const open = tiers.filter((t) => t.limit == null || t.claimed < t.limit);
  const city = pick(CITIES);
  const money = (n) => fmt(n, { currency: "USD", decimals: 2, locale });
  const walk = (k) => Math.round(Math.max(600, Math.min(3600, s.rate * (1 + k))));
  if (kind === "refund") {
    const t = tiers[1];
    if (t.claimed <= 0 || s.raised < t.price) return s;
    t.claimed -= 1;
    return { ...s, tiers, raised: s.raised - t.price, backers: Math.max(0, s.backers - 1), rate: walk(-0.09), latest: { text: `Refund −${money(t.price)} · ${t.name} · ${city}`, dir: -1 } };
  }
  if (kind === "big") {
    const t = tiers[2];
    const n = Math.max(0, Math.min(66, (t.limit ?? Infinity) - t.claimed));
    t.claimed += n;
    const amount = n > 0 ? n * t.price : 25000;
    return { ...s, tiers, raised: s.raised + amount, backers: s.backers + 1, rate: walk(0.35), views: s.views + 420, countries: s.countries, latest: { text: `${money(amount)} · ${n} × ${t.name} · Studio order, ${city}`, dir: 1 } };
  }
  const r = Math.random();
  const t = open.find((x) => x.id === "early" && r < 0.32) ?? open.find((x) => x.id === "pair" && r > 0.84) ?? tiers[1];
  t.claimed += 1;
  const tip = Math.random() < 0.34 ? pick(TIPS) : 0;
  const amount = t.price + tip;
  return {
    ...s, tiers,
    raised: Math.round((s.raised + amount) * 100) / 100,
    backers: s.backers + 1,
    countries: s.countries + (Math.random() < 0.06 ? 1 : 0),
    views: s.views + 40 + Math.floor(Math.random() * 230),
    rate: walk((Math.random() - 0.47) * 0.13),
    latest: { text: `${money(amount)} · ${t.name} · ${city}`, dir: 1 },
  };
}

/**
 * NumberTicker: an animated number. Pass `value` and it rolls to each new value on spring-driven digit wheels
 * (the Ticker primitive; `Ticker` is the same component under its older name). Format with `format`, `decimals`,
 * `currency`, `locale` or raw Intl `options`; add `prefix` / `suffix`. It inherits font size and weight.
 * `demo` shows the launch-day board: a crowdfunded field recorder's live totals built from the same primitive.
 */
export const NumberTicker = forwardRef(function NumberTicker({
  value = 0,
  format = "integer",
  decimals,
  currency = "USD",
  locale: localeProp,
  options,
  prefix,
  suffix,
  direction = "carry",
  blur = 1,
  stiffness = 170,
  damping = 22,
  stagger = 45,
  cue = true,
  cueTone = "default",
  cuePosition = "end",
  countUp = false,
  from = 0,
  label,
  announce = false,
  announceEvery = 0,
  loading = false,
  placeholder = 3.2,
  live = true,
  interval = 1600,
  size = "md",
  demo = false,
  forceState,
  className,
  style,
  ...rest
}, ref) {
  if (demo) return <TickerBoard ref={ref} value={value} format={format} direction={direction} blur={blur} stiffness={stiffness} damping={damping} stagger={stagger} cue={cue} cueTone={cueTone} countUp={countUp} live={live} interval={interval} size={size} locale={localeProp} forceState={forceState} className={className} style={style} rest={rest} />;
  return (
    <Ticker ref={ref} value={forceState === "empty" ? 0 : value} loading={loading || forceState === "loading"} format={format} decimals={decimals} currency={currency} locale={localeProp} options={options}
      prefix={prefix} suffix={suffix} direction={direction} blur={blur} stiffness={stiffness} damping={damping} stagger={stagger} cue={cue} cueTone={cueTone} cuePosition={cuePosition}
      countUp={countUp} from={from} label={label} announce={announce} announceEvery={announceEvery} placeholder={placeholder} className={className} style={style} {...rest} />
  );
});

/** The launch-day board shown with `demo`: pledges stream in, the hero total carries through its wheels, backers and
 *  countries tick, stream views cross 1.0M (the compact unit rolls), and a reward table counts at 13px. */
const TickerBoard = forwardRef(function TickerBoard({ value, format, direction, blur, stiffness, damping, stagger, cue, cueTone, countUp, live, interval, size, locale, forceState, className, style, rest }, ref) {
  const sheetTag = useStyles("ts-number-ticker", CSS);
  const loc = useLocale(locale);
  const reduce = useReducedMotion();
  const root = useRef(null);
  const setRoot = (el) => { root.current = el; if (typeof ref === "function") ref(el); else if (ref) ref.current = el; };
  const w = useWidth(root);
  const narrow = w > 0 && w < 560;
  const loading = forceState === "loading";
  const empty = forceState === "empty";
  const [s, setS] = useState(() => (empty ? zeroState() : startState(value)));
  const [paused, setPaused] = useState(false);
  const [epoch, setEpoch] = useState(0); // switching state remounts the figures: no roll, no cue
  const first = useRef(true);
  useEffect(() => { if (first.current) return; setS((p) => ({ ...p, raised: value })); }, [value]);
  useEffect(() => { if (first.current) { first.current = false; return; } setS(empty ? zeroState() : startState(value)); setEpoch((e) => e + 1); }, [empty, loading]);

  const running = live && !paused && !loading && !empty;
  // the stream (and the looping ping/shimmer) idles while the card is off screen or the tab is hidden
  const onScreen = useInView(root, { once: false, amount: 0 });
  const tabVisible = useSyncExternalStore(subscribeVisibility, () => document.visibilityState !== "hidden", () => true);
  const active = onScreen && tabVisible;
  const streaming = running && active;
  useEffect(() => {
    if (!streaming) return undefined;
    let t;
    const tick = () => { setS((p) => step(p, undefined, loc)); t = setTimeout(tick, interval * (0.55 + Math.random() * 0.9)); };
    t = setTimeout(tick, interval * 0.7);
    return () => clearTimeout(t);
  }, [streaming, interval]);

  const common = { direction, blur, stiffness, damping, stagger, cue, cueTone, countUp, locale: loc };
  const v = (n) => (loading ? null : n);
  const pct = format === "percent";
  const px = typeof size === "number" ? size : SIZES[size] ?? SIZES.md;
  const heroPx = Math.max(30, Math.min(px, w ? (w - (narrow ? 36 : 52)) / (narrow ? 5.7 : 6.3) : px));
  const usd = format === "integer" || format === "decimal" || format === "compact";
  const stretchPct = Math.min(1, s.raised / STRETCH.at);
  const spring = reduce ? { duration: 0 } : { type: "spring", stiffness: 120, damping: 22 }; // reduced motion: the bar jumps to its new length

  return (
    <>{sheetTag}<section ref={setRoot} {...rest} className={"ts-ntb" + (className ? " " + className : "")} style={style} data-narrow={narrow} data-idle={!active} aria-label="Halcyon F1 launch, live totals">
      <header className="ts-ntb__top">
        <span className="ts-ntb__live" data-on={running}>
          <span className="ts-ntb__dot" />{loading ? "Connecting" : running ? "Live" : empty ? "Opens 10:00" : "Paused"}
        </span>
        <span className="ts-ntb__name">Halcyon F1 <span>· pocket field recorder</span></span>
        <span className="ts-ntb__ends">Day 1 of 30 · ends 18 Dec</span>
      </header>

      <div className="ts-ntb__herobox" key={"h" + epoch}>
        <span className="ts-ntb__label">{pct ? "Funded, of the $200,000 goal" : "Raised so far" + (usd ? " (USD)" : "")}</span>
        <div className="ts-ntb__hero" style={{ fontSize: heroPx }}>
          <Ticker value={v(pct ? s.raised / GOAL : s.raised)} format={format} decimals={pct ? 1 : undefined} label={pct ? "Funded" : "Raised so far"} announce announceEvery={8000} placeholder={4.6} {...common} />
        </div>
        <div className="ts-ntb__sub">
          {pct ? (
            <><strong><Ticker value={v(s.raised)} format="currency" {...common} cue={false} placeholder={5} /></strong> raised from</>
          ) : (
            <><strong><Ticker value={v(s.raised / GOAL)} format="percent" decimals={0} {...common} cue={false} placeholder={2.4} /></strong> of the $200,000 goal from</>
          )}
          <strong><Ticker value={v(s.backers)} format="integer" {...common} cue={false} placeholder={2.6} /></strong> backers
        </div>
        <div className="ts-ntb__goal">
          <div className="ts-ntb__goalrow">
            <span>Next stretch goal · <b>{STRETCH.name}</b></span>
            <span>{fmt(STRETCH.at, { currency: "USD", decimals: 0, locale: loc })}</span>
          </div>
          <div className="ts-ntb__track" role="progressbar" aria-label={"Progress to " + STRETCH.name} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(stretchPct * 100)}>
            <motion.div className="ts-ntb__fill" initial={false} animate={{ x: (loading ? 0 : stretchPct * 100) - 100 + "%" }} transition={spring} />
          </div>
        </div>
      </div>

      <dl className="ts-ntb__stats" style={{ margin: 0 }} key={"s" + epoch}>
        <div className="ts-ntb__stat"><dt>Backers</dt><dd><Ticker value={v(s.backers)} format="integer" label="Backers" {...common} /></dd></div>
        <div className="ts-ntb__stat"><dt>Countries</dt><dd><Ticker value={v(s.countries)} format="integer" label="Countries" {...common} placeholder={1.4} /></dd></div>
        <div className="ts-ntb__stat"><dt>Stream views</dt><dd><Ticker value={v(s.views)} format="compact" label="Stream views" {...common} /></dd></div>
        <div className="ts-ntb__stat"><dt>Pledge rate</dt><dd><Ticker value={v(s.rate)} format="currency" decimals={0} label="Pledge rate per minute" {...common} /><small>/min</small></dd></div>
      </dl>

      <table className="ts-ntb__table">
        <caption className="ts-sr">Reward tiers</caption>
        <thead>
          <tr><th scope="col">Reward</th><th scope="col" data-num className="ts-ntb__price">Price</th><th scope="col" data-num>Claimed</th><th scope="col" data-num>Left</th></tr>
        </thead>
        <tbody key={"t" + epoch}>
          {s.tiers.map((t) => {
            const left = t.limit == null ? null : t.limit - t.claimed;
            return (
              <tr key={t.id}>
                <td><span className="ts-ntb__tier">{t.name}{t.limit != null && <i>{fmt(t.limit, { locale: loc })} made</i>}</span></td>
                <td data-num className="ts-ntb__price">{fmt(t.price, { currency: "USD", decimals: 0, locale: loc })}</td>
                <td data-num><Ticker value={v(t.claimed)} format="integer" label={t.name + " claimed"} {...common} cuePosition="start" placeholder={2.4} /></td>
                <td data-num>
                  {left == null ? <span className="ts-ntb__muted">No limit</span> : left === 0 && !loading ? <span className="ts-ntb__pill">Sold out</span> : <Ticker value={v(left)} format="integer" label={t.name + " left"} {...common} cuePosition="start" placeholder={1.6} />}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div className="ts-ntb__feed">
        <span>Latest</span>
        <RollText text={loading ? "Connecting to live pledges…" : s.latest.text} dir={s.latest.dir} />
      </div>

      <div className="ts-ntb__bar">
        <p>{loading ? "Connecting to the pledge feed…" : empty ? "Pledging opens at 10:00 CET. Simulate the first one." : "Simulate the stream, or let it run."}</p>
        <div className="ts-ntb__acts">
          <button type="button" className="ts-ntb__btn is-primary" disabled={loading} onClick={() => setS((p) => step(p, undefined, loc))}>+ Pledge</button>
          <button type="button" className="ts-ntb__btn" disabled={loading} onClick={() => setS((p) => step(p, "big", loc))}>+ Studio order</button>
          <button type="button" className="ts-ntb__btn" disabled={loading} onClick={() => setS((p) => step(p, "refund", loc))}>Refund</button>
          {live && !empty && !loading && (narrow ? (
            // phones: one tidy row, so the stream toggle becomes an icon button. Its name says what a press does
            // (pause or resume), so it is not also marked as a pressed toggle, which would read twice
            <button type="button" className="ts-ntb__btn is-icon" aria-label={paused ? "Resume live pledges" : "Pause live pledges"} onClick={() => setPaused((x) => !x)}>
              <Icon name={paused ? "play" : "pause"} size={15} stroke={2.2} />
            </button>
          ) : (
            <button type="button" className="ts-ntb__btn" onClick={() => setPaused((x) => !x)}>{paused ? "Resume" : "Pause"}</button>
          ))}
        </div>
      </div>
    </section></>
  );
});
