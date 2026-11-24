"use client";
import { forwardRef, isValidElement, useCallback, useEffect, useId, useRef, useState } from "react";
import { animate, motion, useMotionValue } from "motion/react";
import { registerStyles, useStyles, useIsoLayoutEffect, useReducedMotion, useLocale } from "../_shared/theme.jsx";
import { Icon } from "../_shared/icons.jsx";

// Heights are Button's (34 / 42 / 52); on phones and touch screens sm and md grow to 44, as Button does.
const ICON = { sm: 15, md: 16, lg: 18 };
// The indicator's two edges are separate springs. The edge moving toward the new tab is stiff and leaves first,
// the other trails, so the indicator stretches in the direction of travel and a long jump reads as one move.
const LEAD = { type: "spring", stiffness: 640, damping: 42, restDelta: 0.2 };
const TRAIL = { type: "spring", stiffness: 250, damping: 28, restDelta: 0.2 };
const HOVER = { type: "spring", stiffness: 700, damping: 50, restDelta: 0.2 };
const PANEL_IN = { type: "spring", stiffness: 480, damping: 42, restDelta: 0.1 };
const PANEL_OUT = { type: "spring", stiffness: 600, damping: 50, restDelta: 0.1 };
const HEIGHT = { type: "spring", stiffness: 420, damping: 40, restDelta: 0.5 };
// how far a panel travels on its way in or out (a nudge, not a slide)
const DIST = 12;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const FOCUSABLE = "a[href],button:not([disabled]),input:not([disabled]):not([type=hidden]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex='-1']),[contenteditable=true],audio[controls],video[controls],summary";

const CSS = `
.ts-tabs{--tb-h:42px;--tb-fs:14px;--tb-px:14px;--tb-gap:7px;--tb-base:var(--ts-ink2);--tb-on:var(--ts-ink);--tb-ind:var(--ts-accent);--tb-r:var(--ts-radius-sm);
  display:block;box-sizing:border-box;width:100%;min-width:0;font-family:var(--ts-font);color:var(--ts-ink);-webkit-tap-highlight-color:transparent}
.ts-tabs[data-size=sm]{--tb-h:34px;--tb-fs:13px;--tb-px:11px;--tb-gap:6px}
.ts-tabs[data-size=lg]{--tb-h:52px;--tb-fs:16px;--tb-px:18px;--tb-gap:8px}
.ts-tabs[data-surface=line]{--tb-lpx:4px;--tb-sp:24px}
.ts-tabs[data-surface=line][data-size=sm]{--tb-sp:20px}
.ts-tabs[data-surface=line][data-size=lg]{--tb-sp:30px}
.ts-tabs[data-surface=pill]{--tb-on:var(--ts-accent-ink);--tb-r:999px}
.ts-tabs[data-surface=boxed]{--tb-ind:var(--ts-surface);--tb-r:max(4px,calc(var(--ts-radius-md) - 3px))}
@supports (color:light-dark(red,red)){.ts-tabs[data-surface=boxed]{--tb-ind:light-dark(var(--ts-surface),color-mix(in srgb,var(--ts-ink) 14%,var(--ts-surface2)))}}
.ts-tabs__frame{display:flex;flex-direction:column;gap:16px;min-width:0}
.ts-tabs__bar{position:relative;display:flex;min-width:0;max-width:100%}
.ts-tabs[data-surface=line] .ts-tabs__bar::before{content:"";position:absolute;left:0;right:0;bottom:0;height:1px;background:var(--ts-line);pointer-events:none}
.ts-tabs[data-surface=boxed] .ts-tabs__bar{align-self:flex-start;border-radius:var(--ts-radius-md);background:var(--ts-surface2);box-shadow:inset 0 0 0 1px var(--ts-line);overflow:hidden}
.ts-tabs[data-surface=boxed][data-full=true] .ts-tabs__bar{align-self:stretch}
.ts-tabs__scroll{flex:1 1 auto;min-width:0;overflow-x:auto;overflow-y:hidden;scrollbar-width:none;overscroll-behavior-x:contain;--fs:0px;--fe:0px;
  -webkit-mask-image:linear-gradient(to right,transparent,black var(--fs),black calc(100% - var(--fe)),transparent);mask-image:linear-gradient(to right,transparent,black var(--fs),black calc(100% - var(--fe)),transparent)}
.ts-tabs__scroll::-webkit-scrollbar{display:none}
.ts-tabs__list{position:relative;box-sizing:border-box;display:flex;align-items:center;gap:2px;width:max-content;min-width:100%;padding:3px;outline:none}
.ts-tabs[data-full=true] .ts-tabs__list{width:100%}
.ts-tabs[data-surface=line]:not([data-full=true]) .ts-tabs__scroll{margin-inline-start:calc(-3px - var(--tb-lpx))}
.ts-tabs[data-surface=pill]:not([data-full=true]) .ts-tabs__scroll{margin-inline-start:-3px}
.ts-tabs[data-surface=line]:not([data-full=true]) .ts-tabs__list{gap:calc(var(--tb-sp) - 2 * var(--tb-lpx))}
.ts-tabs__tab{all:unset;box-sizing:border-box;position:relative;z-index:1;display:inline-flex;align-items:center;justify-content:center;flex:none;height:var(--tb-h);padding:0 var(--tb-px);
  border-radius:var(--tb-r);font-family:inherit;font-size:var(--tb-fs);font-weight:550;line-height:1.2;letter-spacing:-0.01em;white-space:nowrap;cursor:pointer;user-select:none;-webkit-user-select:none;text-decoration:none;
  --p:0;color:color-mix(in srgb,var(--tb-on) calc(var(--p) * 100%),var(--tb-base))}
.ts-tabs[data-surface=boxed] .ts-tabs__tab{height:calc(var(--tb-h) - 6px)}
.ts-tabs__tab[aria-selected=true],.ts-tabs__tab[aria-current=page]{--p:1}
.ts-tabs[data-surface=line]:not([data-full=true]) .ts-tabs__tab{padding:0 var(--tb-lpx)}
.ts-tabs[data-full=true] .ts-tabs__tab{flex:1 1 0;min-width:0;padding:0 10px}
.ts-tabs__tab:hover:not([aria-disabled=true]),.ts-tabs__tab[data-force=hover]{--tb-base:var(--ts-ink)}
.ts-tabs__tab:focus-visible,.ts-tabs__tab[data-force=focus]{outline:2px solid var(--ts-focus);outline-offset:1px}
.ts-tabs__tab[aria-disabled=true]{cursor:not-allowed;opacity:.42}
.ts-tabs[data-disabled=true] .ts-tabs__bar{opacity:.5}
.ts-tabs[data-disabled=true] .ts-tabs__tab{opacity:1}
.ts-tabs__face{display:inline-flex;align-items:center;gap:var(--tb-gap);min-width:0;max-width:100%;transition:transform .16s cubic-bezier(.2,.8,.2,1)}
.ts-tabs__tab:active:not([aria-disabled=true]) .ts-tabs__face,.ts-tabs__tab[data-force=active] .ts-tabs__face{transform:scale(.95)}
.ts-tabs__face>svg{flex:none}
.ts-tabs__lbl{min-width:0;overflow:hidden;text-overflow:ellipsis}
.ts-tabs__badge{box-sizing:border-box;display:inline-grid;place-items:center;flex:none;min-width:calc(var(--tb-fs) + 5px);height:calc(var(--tb-fs) + 5px);padding:0 5px;border-radius:999px;
  font-size:max(11px,calc(var(--tb-fs) - 3px));font-weight:650;line-height:1;letter-spacing:0;font-variant-numeric:tabular-nums;
  color:color-mix(in srgb,var(--tb-on) calc(var(--p) * 100%),var(--ts-ink));background:color-mix(in srgb,currentColor 12%,transparent)}
.ts-tabs__ind,.ts-tabs__hov{position:absolute;left:0;top:0;width:0;height:0;pointer-events:none;opacity:0;will-change:transform}
.ts-tabs__ind>span,.ts-tabs__fill>span{position:absolute;left:0;top:0;display:block;transform-origin:0 0}
.ts-tabs__ind>span{background:var(--tb-ind)}
.ts-tabs__fill{position:absolute;inset:0;opacity:.07}
.ts-tabs__fill>span{background:var(--ts-ink)}
.ts-tabs[data-surface=boxed] .ts-tabs__ind{filter:drop-shadow(0 1px 1.5px color-mix(in srgb,var(--ts-black) 16%,transparent)) drop-shadow(0 0 .5px color-mix(in srgb,var(--ts-black) 30%,transparent))}
.ts-tabs:not([data-ready]) .ts-tabs__tab[aria-selected=true],.ts-tabs:not([data-ready]) .ts-tabs__tab[aria-current=page]{background:var(--tb-ind)}
.ts-tabs[data-surface=line]:not([data-ready]) .ts-tabs__tab[aria-selected=true],.ts-tabs[data-surface=line]:not([data-ready]) .ts-tabs__tab[aria-current=page]{background:none}
.ts-tabs[data-surface=line]:not([data-ready]) .ts-tabs__tab[aria-selected=true]::after,.ts-tabs[data-surface=line]:not([data-ready]) .ts-tabs__tab[aria-current=page]::after{content:"";position:absolute;left:0;right:0;bottom:-3px;height:2px;border-radius:1px;background:var(--tb-ind)}
.ts-tabs__panes{position:relative;min-width:0}
.ts-tabs__panes[data-anim]{overflow-y:clip}
.ts-tabs__panel{outline:none;border-radius:var(--ts-radius-sm);min-width:0}
.ts-tabs__panel:focus-visible{outline:2px solid var(--ts-focus);outline-offset:2px}
.ts-tabs__panel[data-role=out]{position:absolute;left:0;right:0;top:0;pointer-events:none}
.ts-tabs[data-orient=vertical]{container:ts-tabs / inline-size}
@container ts-tabs (min-width:520px){
  .ts-tabs[data-orient=vertical]>.ts-tabs__frame{flex-direction:row;align-items:flex-start;gap:24px}
  .ts-tabs[data-orient=vertical]>.ts-tabs__frame>.ts-tabs__bar{flex:none;min-width:144px;max-width:40%}
  .ts-tabs[data-orient=vertical][data-surface=line]>.ts-tabs__frame>.ts-tabs__bar::before{left:auto;right:auto;top:0;bottom:0;inset-inline-end:0;width:1px;height:auto}
  .ts-tabs[data-orient=vertical]>.ts-tabs__frame>.ts-tabs__bar>.ts-tabs__scroll{margin-inline-start:0;overflow:visible;-webkit-mask-image:none;mask-image:none}
  .ts-tabs[data-orient=vertical]>.ts-tabs__frame>.ts-tabs__bar>.ts-tabs__scroll>.ts-tabs__list{flex-direction:column;align-items:stretch;width:100%;min-width:0;gap:2px}
  .ts-tabs[data-orient=vertical][data-surface=line]>.ts-tabs__frame>.ts-tabs__bar>.ts-tabs__scroll>.ts-tabs__list{padding-inline-end:9px}
  .ts-tabs[data-orient=vertical]>.ts-tabs__frame>.ts-tabs__bar>.ts-tabs__scroll>.ts-tabs__list>.ts-tabs__tab{justify-content:flex-start;flex:none;padding:0 var(--tb-px)}
  .ts-tabs[data-orient=vertical]>.ts-tabs__frame>.ts-tabs__bar>.ts-tabs__scroll>.ts-tabs__list>.ts-tabs__tab>.ts-tabs__face{flex:1 1 auto}
  .ts-tabs[data-orient=vertical]>.ts-tabs__frame>.ts-tabs__bar>.ts-tabs__scroll>.ts-tabs__list>.ts-tabs__tab .ts-tabs__badge{margin-inline-start:auto}
  .ts-tabs[data-orient=vertical]>.ts-tabs__frame>.ts-tabs__panes{flex:1 1 0}
}
@media (max-width:640px),(pointer:coarse){
  .ts-tabs[data-size=sm],.ts-tabs[data-size=md]{--tb-h:44px}
  .ts-tabs[data-surface=boxed][data-size=sm],.ts-tabs[data-surface=boxed][data-size=md]{--tb-h:50px}
  .ts-tabs[data-surface=line]{--tb-lpx:10px}
  .ts-tabs__tab{min-width:44px}
}
@media (prefers-reduced-motion:reduce){.ts-tabs__face{transition:none}}
.ts-tabs-demo{display:flex;flex-direction:column;gap:12px;font-size:14px;line-height:1.5;color:var(--ts-ink)}
.ts-tabs-demo__lead{margin:0;max-width:60ch;color:var(--ts-ink2)}
.ts-tabs-demo__facts{display:flex;flex-wrap:wrap;gap:8px 28px;margin:0}
.ts-tabs-demo__facts div{display:flex;flex-direction:column;gap:2px}
.ts-tabs-demo__facts dt{font-size:12px;color:var(--ts-ink2)}
.ts-tabs-demo__facts dd{margin:0;font-weight:550}
.ts-tabs-demo__rows{list-style:none;margin:0;padding:0;display:flex;flex-direction:column}
.ts-tabs-demo__rows li{display:flex;align-items:baseline;justify-content:space-between;gap:16px;padding:10px 0;box-shadow:inset 0 -1px 0 var(--ts-line)}
.ts-tabs-demo__rows li:last-child{box-shadow:none}
.ts-tabs-demo__rows span:last-child{flex:none;font-size:12.5px;color:var(--ts-ink2);font-variant-numeric:tabular-nums}
.ts-tabs-demo__rows b{font-weight:600}
`;
registerStyles("ts-tabs", CSS);

// sample content, shown only with `demo` and only when the caller passes no tabs
function DemoOverview() {
  return (
    <div className="ts-tabs-demo">
      <p className="ts-tabs-demo__lead">Twelve looks over two days at the Pier 4 studio. Final selects go to the print team once the client has signed off on the edit.</p>
      <dl className="ts-tabs-demo__facts">
        <div><dt>Status</dt><dd>On track</dd></div>
        <div><dt>Shoot days</dt><dd>2 of 2 booked</dd></div>
        <div><dt>Lead</dt><dd>Ines Duarte</dd></div>
      </dl>
    </div>
  );
}
function DemoActivity() {
  return (
    <ul className="ts-tabs-demo ts-tabs-demo__rows">
      <li><span><b>Ines</b> moved the call sheet to Ready</span><span>09:42</span></li>
      <li><span><b>Tomas</b> uploaded the contact sheets for day one</span><span>Yesterday</span></li>
      <li><span><b>Wren</b> left a note on Look 07: swap the linen jacket for the navy one</span><span>Yesterday</span></li>
      <li><span><b>Ines</b> created the project</span><span>Monday</span></li>
    </ul>
  );
}
function DemoFiles() {
  const locale = useLocale();
  const nf = new Intl.NumberFormat(locale, { maximumFractionDigits: 1 });
  const files = [["Call sheet.pdf", 412, "KB"], ["Shot list, version 3.csv", 88, "KB"], ["Moodboard.png", 18.6, "MB"]];
  return (
    <ul className="ts-tabs-demo ts-tabs-demo__rows">
      {files.map(([n, s, u]) => <li key={n}><span>{n}</span><span>{nf.format(s)} {u}</span></li>)}
    </ul>
  );
}
const DEMO_TABS = [
  { id: "overview", label: "Overview", icon: "layers", content: <DemoOverview /> },
  { id: "activity", label: "Activity", icon: "clock", badge: 4, content: <DemoActivity /> },
  { id: "files", label: "Files", icon: "folder", content: <DemoFiles /> },
  { id: "settings", label: "Settings", icon: "settings", disabled: true, title: "Only the project lead can change settings", content: null },
];

function normalise(tabs) {
  return (Array.isArray(tabs) ? tabs : []).filter((t) => t !== null && t !== undefined && t !== false).map((t, i) => {
    if (typeof t === "string" || typeof t === "number") return { id: t, label: String(t), raw: t };
    const id = t.id ?? (typeof t.label === "string" || typeof t.label === "number" ? t.label : i);
    return { ...t, id, label: t.label ?? String(id), raw: t };
  });
}
const textOf = (t) => (typeof t.label === "string" || typeof t.label === "number" ? String(t.label) : t.ariaLabel ?? String(t.id));
const same = (a, b) => a === b || (a !== null && a !== undefined && b !== null && b !== undefined && String(a) === String(b));

// Draws one measured bar (the indicator or the hover surface) between L and R on the main axis. It is three
// pieces, two end caps and a middle that scales, so the rounded ends keep their radius however far it stretches.
function drawBar(P, axis, L, R, r, cross) {
  if (!P.box) return;
  const w = Math.max(R - L, 2 * r);
  const T = axis === "x" ? (v) => `translate3d(${v}px,0,0)` : (v) => `translate3d(0,${v}px,0)`;
  P.box.style.transform = T(L) + (cross !== 1 ? (axis === "x" ? ` scaleY(${cross})` : ` scaleX(${cross})`) : "");
  if (P.b) P.b.style.transform = T(w - 2 * r);
  if (P.m) P.m.style.transform = T(r) + (axis === "x" ? ` scaleX(${(w - 2 * r) / 100})` : ` scaleY(${(w - 2 * r) / 100})`);
}
// Sizes the pieces once per measure: where the bar sits across the main axis, how thick it is, and its radius.
function placeBar(P, axis, pos, size, r) {
  if (!P.box) return;
  const B = P.box.style;
  if (axis === "x") { B.left = "0px"; B.width = "0px"; B.top = pos + "px"; B.height = size + "px"; B.transformOrigin = "0 50%"; }
  else { B.top = "0px"; B.height = "0px"; B.left = pos + "px"; B.width = size + "px"; B.transformOrigin = "50% 0"; }
  for (const c of [P.a, P.b]) {
    if (!c) continue;
    c.style.borderRadius = r + "px";
    c.style.width = axis === "x" ? 2 * r + "px" : size + "px";
    c.style.height = axis === "x" ? size + "px" : 2 * r + "px";
  }
  if (P.m) { P.m.style.width = axis === "x" ? "100px" : size + "px"; P.m.style.height = axis === "x" ? size + "px" : "100px"; }
}

/**
 * Tabs: sections of one page or panel that share a place (Overview / Activity / Settings). One section shows at a
 * time and its tab says which. The WAI-ARIA tabs pattern on native buttons: roving tabindex, arrow keys along the
 * list's axis (mirrored under dir="rtl"), Home / End, disabled tabs skipped, `activation` "auto" (focus selects)
 * or "manual" (Enter or Space selects). Tabs with `href` render as links in a nav with aria-current="page" and no
 * panels, for apps where each tab is a route.
 * Signature: one measured indicator for the whole list travels to the selected tab on two edge springs, so it
 * stretches in the direction of travel and settles; a faint second surface follows the pointer under the hovered
 * tab. The new panel comes in from the side you moved toward while the old one leaves the other way (a short
 * nudge and a cross-fade), and the panel area's height springs to the new panel's height. Every new selection
 * redirects the indicator, the panels and the height from where they are. A list wider than its box scrolls
 * sideways with an edge fade and brings the selected tab into view. Reduced motion: the indicator and the panel
 * swap in place with a short fade; no travel, stretch or height spring.
 * The ref is the tablist element (the link list in link mode); `ref.current.focus()` focuses the selected tab.
 */
export const Tabs = forwardRef(function Tabs({
  tabs = [],
  value,
  defaultValue,
  onChange,
  renderPanel,
  children,
  panelId,
  keepMounted = false,
  label = "",
  size = "md",
  surface = "line",
  orientation = "horizontal",
  activation = "auto",
  fullWidth = false,
  disabled = false,
  maxWidth = 0,
  demo = false,
  forceState,
  className,
  style,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
  ...rest
}, ref) {
  const sheetTag = useStyles("ts-tabs", CSS);
  const reduce = useReducedMotion();
  const uid = useId().replace(/[^\w-]/g, "");
  const hasOwn = Array.isArray(tabs) && tabs.length > 0;
  const opts = normalise(hasOwn ? tabs : demo ? DEMO_TABS : []);
  const sz = ICON[size] ? size : "md";
  const surf = surface === "pill" || surface === "boxed" ? surface : "line";
  const isDisabled = disabled || forceState === "disabled";
  const linkMode = opts.some((o) => o.href !== undefined && o.href !== null);
  const panelFor = (t) => (t.content !== undefined ? t.content : typeof renderPanel === "function" ? renderPanel(t) : typeof children === "function" ? children(t) : null);
  const hasPanels = !linkMode && (typeof renderPanel === "function" || typeof children === "function" || opts.some((o) => o.content !== undefined));

  // controlled when `value` is passed; otherwise our own, seeded by defaultValue (or the first enabled tab)
  const firstEnabled = opts.find((o) => !o.disabled)?.id;
  const controlled = value !== undefined;
  const [inner, setInner] = useState(() => (defaultValue !== undefined ? defaultValue : firstEnabled ?? null));
  const selected = controlled ? value : inner;
  const selIdx = selected === null || selected === undefined ? -1 : opts.findIndex((o) => same(o.id, selected));
  const selKey = selIdx >= 0 ? String(opts[selIdx].id) : null;

  // a vertical list falls back to horizontal in a container narrower than 520px (CSS does the same with a
  // container query, so the first paint is already right; this keeps aria-orientation and the keys in step)
  const [narrow, setNarrow] = useState(false);
  const eff = orientation === "vertical" && !narrow ? "vertical" : "horizontal";
  const [roving, setRoving] = useState(null);

  // the panels on stage: the selected one, the ones still leaving (with the direction they leave in), and the
  // visited ones that `keepMounted` keeps hidden. Updated during render so a leaving panel is never unmounted.
  const [track, setTrack] = useState(() => ({ cur: selKey, leaving: {}, visited: selKey === null ? [] : [selKey], dir: 0 }));
  if (track.cur !== selKey) {
    const oi = opts.findIndex((o) => String(o.id) === track.cur);
    const dir = oi < 0 || selIdx < 0 ? 1 : Math.sign(selIdx - oi) || 1;
    const leaving = { ...track.leaving };
    if (selKey !== null) delete leaving[selKey];
    if (track.cur !== null && !reduce && hasPanels && oi >= 0) leaving[track.cur] = dir;
    const visited = selKey !== null && !track.visited.includes(selKey) ? [...track.visited, selKey] : track.visited;
    setTrack({ cur: selKey, leaving, visited, dir });
  }

  const root = useRef(null);
  const list = useRef(null);
  const scroller = useRef(null);
  const panes = useRef(null);
  const ind = useRef({}).current;
  const hov = useRef({}).current;
  const tabEls = useRef([]);
  // segs: each tab's box on the main axis; iseg: where the indicator sits on it (the label's width for the
  // underline); hseg: where the hover surface sits
  const geo = useRef({ els: [], segs: [], iseg: [], hseg: [], axis: "x", rtl: false, ir: 0, hr: 0 });
  const target = useRef({ idx: -2, w: 0 });
  const anims = useRef([]);
  const hoverIdx = useRef(-1);
  const hoverTimer = useRef(0);
  const forcedHover = useRef(false);
  const hAnim = useRef(null);
  const restH = useRef(null);

  const live = useRef({ mounted: false });
  Object.assign(live.current, { opts, selIdx, controlled, onChange, inert: isDisabled, reduce, surf, activation, forceState, fullWidth, axis: geo.current.axis, rtl: geo.current.rtl });

  const lv = useMotionValue(0);
  const rv = useMotionValue(0);
  const iop = useMotionValue(0);
  const hl = useMotionValue(0);
  const hr = useMotionValue(0);
  const hop = useMotionValue(0);

  // the ref is the list; its .focus() goes to the tab a keyboard user would land on
  const setList = useCallback((el) => {
    list.current = el;
    if (el && !Object.prototype.hasOwnProperty.call(el, "focus")) {
      el.focus = (o) => {
        const L = live.current;
        const i = L.selIdx >= 0 && !L.opts[L.selIdx]?.disabled ? L.selIdx : L.opts.findIndex((x) => !x.disabled);
        const t = tabEls.current[i];
        if (t && !L.inert) t.focus(o); else HTMLElement.prototype.focus.call(el, o);
      };
    }
    if (typeof ref === "function") ref(el);
    else if (ref && typeof ref === "object" && "current" in ref) ref.current = el;
  }, [ref]);

  /* ---------- drawing: transforms and opacity, plus one CSS variable per label */
  const paint = useCallback(() => {
    const G = geo.current;
    if (!G.els.length) return;
    const L = lv.get(), R = rv.get(), o = iop.get();
    const tw = target.current.w || R - L;
    const stretch = live.current.reduce || !tw ? 0 : clamp((R - L - tw) / tw, 0, 0.6);
    drawBar(ind, G.axis, L, R, G.ir, live.current.surf === "line" ? 1 : 1 - stretch * 0.12);
    if (ind.box) ind.box.style.opacity = String(o);
    // a label takes its selected colour as the indicator covers it, so text on the pill always has its ink
    G.els.forEach((el, i) => {
      const s = G.iseg[i];
      if (!el || !s) return;
      const cover = Math.max(0, Math.min(R, s.e) - Math.max(L, s.s)) / Math.max(1, s.e - s.s);
      const p = o < 0.02 ? 0 : Math.min(1, cover * 1.15) * Math.min(1, o * 1.5);
      el.style.setProperty("--p", p.toFixed(3));
    });
  }, []);
  const paintHover = useCallback(() => {
    const G = geo.current;
    drawBar(hov, G.axis, hl.get(), hr.get(), G.hr, 1);
    if (hov.box) hov.box.style.opacity = String(hop.get());
  }, []);
  useEffect(() => {
    const u = [lv.on("change", paint), rv.on("change", paint), iop.on("change", paint), hl.on("change", paintHover), hr.on("change", paintHover), hop.on("change", paintHover)];
    return () => u.forEach((f) => f());
  }, [paint, paintHover]);

  const stopAll = () => { anims.current.forEach((a) => a?.stop?.()); anims.current = []; lv.stop(); rv.stop(); iop.stop(); };

  // brings tab idx into view inside the scroller (works the same under dir="rtl": it compares boxes)
  const ensureVisible = (idx, smooth) => {
    const sc = scroller.current, el = geo.current.els[idx];
    if (!sc || !el || sc.scrollWidth <= sc.clientWidth + 1) return;
    const a = sc.getBoundingClientRect(), b = el.getBoundingClientRect(), pad = 28;
    let d = 0;
    if (b.left - pad < a.left) d = b.left - pad - a.left;
    else if (b.right + pad > a.right) d = b.right + pad - a.right;
    if (Math.abs(d) > 1) sc.scrollTo({ left: sc.scrollLeft + d, behavior: smooth && !live.current.reduce ? "smooth" : "auto" });
  };

  // send the indicator to tab idx (or fade it out for -1)
  const moveIndicator = (idx, { instant = false } = {}) => {
    const s = geo.current.iseg[idx];
    target.current = { idx, w: s ? s.e - s.s : 0 };
    if (!s) { stopAll(); anims.current = [animate(iop, 0, { duration: live.current.reduce || instant ? 0 : 0.15 })]; return; }
    const wasHidden = iop.get() < 0.5;
    if (instant || wasHidden || live.current.reduce) {
      stopAll();
      lv.set(s.s); rv.set(s.e);
      if (instant) iop.set(1);
      else anims.current = [animate(iop, [live.current.reduce && !wasHidden ? 0.35 : 0, 1], { duration: 0.16, ease: "easeOut" })];
      paint();
    } else {
      stopAll();
      iop.set(1);
      const forward = (s.s + s.e) / 2 > (lv.get() + rv.get()) / 2;
      anims.current = [animate(lv, s.s, forward ? TRAIL : LEAD), animate(rv, s.e, forward ? LEAD : TRAIL)];
    }
  };

  const hoverTo = (i, instant = false) => {
    const s = geo.current.hseg[i];
    clearTimeout(hoverTimer.current);
    if (!s) return;
    hoverIdx.current = i;
    if (instant || hop.get() < 0.05 || live.current.reduce) { hl.stop(); hr.stop(); hl.set(s.s); hr.set(s.e); }
    else { animate(hl, s.s, HOVER); animate(hr, s.e, HOVER); }
    if (instant) { hop.stop(); hop.set(1); } else animate(hop, 1, { duration: 0.12, ease: "easeOut" });
    paintHover();
  };
  const hoverOff = () => {
    clearTimeout(hoverTimer.current);
    hoverTimer.current = setTimeout(() => { hoverIdx.current = -1; animate(hop, 0, { duration: 0.16, ease: "easeOut" }); }, 70);
  };

  const updateFades = () => {
    const sc = scroller.current;
    if (!sc) return;
    const max = sc.scrollWidth - sc.clientWidth;
    const x = Math.abs(sc.scrollLeft);
    const rtl = geo.current.rtl;
    if (geo.current.axis === "y") { sc.style.setProperty("--fs", "0px"); sc.style.setProperty("--fe", "0px"); return; }
    const atStart = rtl ? x >= max - 1 : x <= 1;
    const atEnd = rtl ? x <= 1 : x >= max - 1;
    sc.style.setProperty("--fs", max > 1 && !atStart ? "24px" : "0px");
    sc.style.setProperty("--fe", max > 1 && !atEnd ? "24px" : "0px");
  };

  /* ---------- measuring: the bars are placed from the tabs' boxes, kept right on resize and font load */
  const measure = useCallback(() => {
    const ls = list.current;
    if (!ls) return;
    const els = [...ls.querySelectorAll(":scope > .ts-tabs__tab")];
    const cs = getComputedStyle(ls);
    const axis = cs.flexDirection.indexOf("column") === 0 ? "y" : "x";
    const rtl = cs.direction === "rtl";
    const segs = els.map((el) => (axis === "x" ? { s: el.offsetLeft, e: el.offsetLeft + el.offsetWidth } : { s: el.offsetTop, e: el.offsetTop + el.offsetHeight }));
    const G = geo.current;
    const line = live.current.surf === "line";
    // a horizontal underline sits under the label only, and the hover surface there is a faint underline too
    const lineX = line && axis === "x";
    const t0 = els[0];
    const t0s = t0 ? getComputedStyle(t0) : null;
    const inset = lineX && !live.current.fullWidth && t0s ? parseFloat(t0s.paddingLeft) || 0 : 0;
    const iseg = segs.map((s) => ({ s: s.s + inset, e: s.e - inset }));
    Object.assign(G, { els, segs, iseg, hseg: lineX ? iseg : segs, axis, rtl });
    live.current.axis = axis; live.current.rtl = rtl;
    if (t0) {
      const tabR = parseFloat(t0s.borderTopLeftRadius) || 0;
      const minMain = Math.min(...segs.map((s) => s.e - s.s));
      const box = axis === "x" ? { pos: t0.offsetTop, size: t0.offsetHeight } : { pos: t0.offsetLeft, size: t0.offsetWidth };
      const bar = !line ? box : axis === "x" ? { pos: ls.clientHeight - 2, size: 2 } : { pos: rtl ? 0 : ls.clientWidth - 2, size: 2 };
      G.ir = line ? 1 : Math.max(0, Math.min(tabR, bar.size / 2, minMain / 2));
      G.hr = lineX ? 1 : Math.max(0, Math.min(tabR, box.size / 2, minMain / 2));
      placeBar(ind, axis, bar.pos, bar.size, G.ir);
      if (lineX) placeBar(hov, axis, bar.pos, bar.size, 1); else placeBar(hov, axis, box.pos, box.size, G.hr);
      if (hov.fill) hov.fill.style.opacity = lineX ? "0.3" : "";
    }
    // a truncated label keeps its full text as the accessible name; show it as a title too
    els.forEach((el, i) => {
      const t = el.querySelector(".ts-tabs__lbl");
      if (!t || live.current.opts[i]?.title) return;
      if (t.scrollWidth > t.clientWidth + 1) el.title = t.textContent; else el.removeAttribute("title");
    });
    root.current?.setAttribute("data-ready", "");
    updateFades();
    const L = live.current;
    const running = lv.isAnimating() || rv.isAnimating();
    if (target.current.idx === -2 || !running) moveIndicator(L.selIdx, { instant: target.current.idx === -2 || iop.get() > 0.5 || L.reduce });
    else moveIndicator(L.selIdx);
    if (target.current.idx !== -2 && L.forceState !== "hover" && hoverIdx.current >= 0) hoverTo(hoverIdx.current, true);
    if (L.forceState === "hover") {
      const h = L.opts.findIndex((o, i) => i !== L.selIdx && !o.disabled);
      if (h >= 0) hoverTo(h, true);
      forcedHover.current = true;
    } else if (forcedHover.current) {
      // the gallery's forced hover was lifted: put the surface away
      forcedHover.current = false;
      hoverIdx.current = -1; hop.stop(); hop.set(0); paintHover();
    }
  }, []);

  const tabKey = opts.map((o) => String(o.id) + (o.disabled ? "!" : "") + textOf(o) + (o.badge ?? "") + (typeof o.icon === "string" ? o.icon : o.icon ? "*" : "")).join("|");
  useIsoLayoutEffect(() => {
    target.current.idx = target.current.idx === -2 ? -2 : target.current.idx;
    measure();
    if (target.current.idx >= 0) ensureVisible(target.current.idx, false);
  }, [tabKey, sz, surf, fullWidth, eff, forceState, measure]);
  useEffect(() => {
    const ls = list.current;
    if (!ls || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => measure());
    ro.observe(ls);
    if (scroller.current) ro.observe(scroller.current);
    ls.querySelectorAll(":scope > .ts-tabs__tab").forEach((el) => ro.observe(el));
    const fonts = typeof document !== "undefined" ? document.fonts : null;
    let gone = false;
    fonts?.ready?.then(() => { if (!gone) measure(); });
    fonts?.addEventListener?.("loadingdone", measure);
    return () => { gone = true; ro.disconnect(); fonts?.removeEventListener?.("loadingdone", measure); };
  }, [tabKey, eff, measure]);

  // the container's width decides whether a vertical list fits beside its panel
  useIsoLayoutEffect(() => {
    const el = root.current;
    if (!el || orientation !== "vertical") { setNarrow(false); return; }
    const check = () => setNarrow(el.clientWidth < 520);
    check();
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(check);
    ro.observe(el);
    return () => ro.disconnect();
  }, [orientation]);

  // the selection changed (a click, a key, a controlling parent): the indicator goes, the tab comes into view
  useIsoLayoutEffect(() => {
    if (target.current.idx === -2) return;
    if (target.current.idx !== selIdx) moveIndicator(selIdx);
    if (selIdx >= 0) ensureVisible(selIdx, true);
  }, [selIdx]);

  // the panel area's height springs from where it is to the new panel's height, then lets go (height: auto)
  const hTo = useRef(null);
  const growTo = (W, to) => {
    if (hAnim.current && hTo.current === to) return;   // already on its way there: restarting the spring every frame overshoots
    hTo.current = to;
    hAnim.current?.stop?.();
    W.setAttribute("data-anim", "");
    hAnim.current = animate(hv, to, {
      ...HEIGHT,
      onUpdate: (v) => { W.style.height = Math.max(0, v) + "px"; },
      onComplete: () => { hAnim.current = null; hTo.current = null; W.style.height = ""; W.removeAttribute("data-anim"); restH.current = W.offsetHeight; },
    });
  };
  const hv = useMotionValue(0);
  useIsoLayoutEffect(() => {
    const W = panes.current;
    if (!W) return;
    const inEl = W.querySelector(":scope > [data-role=in]");
    const to = inEl ? inEl.offsetHeight : 0;
    const from = hAnim.current ? hv.get() : restH.current;
    if (!live.current.mounted || reduce || from === null || Math.abs(from - to) < 1) {
      hAnim.current?.stop?.(); hAnim.current = null; hTo.current = null;
      W.style.height = ""; W.removeAttribute("data-anim");
      restH.current = W.offsetHeight;
      return;
    }
    if (!hAnim.current) hv.set(from);
    W.style.height = from + "px";
    growTo(W, to);
  }, [track.cur]);
  // while the height is moving, follow the new panel if its own content changes size; at rest, remember it
  useEffect(() => {
    const W = panes.current;
    if (!W || typeof ResizeObserver === "undefined") return;
    const inEl = W.querySelector(":scope > [data-role=in]");
    const ro = new ResizeObserver(() => {
      if (hAnim.current && inEl && !live.current.reduce) growTo(W, inEl.offsetHeight);
      else if (!hAnim.current) restH.current = W.offsetHeight;
    });
    ro.observe(W);
    if (inEl) ro.observe(inEl);
    return () => ro.disconnect();
  }, [track.cur]);

  useEffect(() => {
    live.current.mounted = true;
    return () => { clearTimeout(hoverTimer.current); hAnim.current?.stop?.(); };
  }, []);

  const onGone = useCallback((key) => {
    setTrack((t) => {
      if (!(key in t.leaving) || t.cur === key) return t;
      const leaving = { ...t.leaving };
      delete leaving[key];
      return { ...t, leaving };
    });
  }, []);

  const commit = (i, e) => {
    const L = live.current, o = L.opts[i];
    if (!o || o.disabled || L.inert || i === L.selIdx) return false;
    if (!L.controlled) setInner(o.id);
    L.onChange?.(o.id, o.raw, e);
    return true;
  };

  const onKeyDown = (e) => {
    if (linkMode || e.altKey || e.ctrlKey || e.metaKey) return;
    const k = e.key, L = live.current;
    const vertical = eff === "vertical";
    const keys = vertical ? ["ArrowUp", "ArrowDown", "Home", "End"] : ["ArrowLeft", "ArrowRight", "Home", "End"];
    if (!keys.includes(k)) return;
    e.preventDefault();
    if (L.inert) return;
    const O = L.opts;
    const en = O.map((o, i) => (o.disabled ? -1 : i)).filter((i) => i >= 0);
    if (!en.length) return;
    const at = tabEls.current.indexOf(document.activeElement);
    const cur = at >= 0 ? at : Math.max(0, L.selIdx);
    let next;
    if (k === "Home") next = en[0];
    else if (k === "End") next = en[en.length - 1];
    else {
      let d = k === "ArrowRight" || k === "ArrowDown" ? 1 : -1;
      if (!vertical && geo.current.rtl) d = -d;
      next = cur;
      for (let n = 0; n < O.length; n++) { next = (next + d + O.length) % O.length; if (!O[next].disabled) break; }
    }
    tabEls.current[next]?.focus();
    if (L.activation !== "manual") commit(next, e);
  };

  if (!opts.length) return null;

  const focusIdx = roving !== null && roving >= 0 && roving < opts.length && !opts[roving].disabled ? roving
    : selIdx >= 0 && !opts[selIdx].disabled ? selIdx : opts.findIndex((o) => !o.disabled);
  const pid = (t, i) => t.panelId ?? (typeof panelId === "function" ? panelId(t, i) : undefined);
  const ids = opts.map((t, i) => {
    const custom = pid(t, i);
    return custom ? { panel: custom, tab: custom + "-tab", custom: true } : { panel: `${uid}-panel-${i}`, tab: `${uid}-tab-${i}`, custom: false };
  });
  const mountedPanel = (key) => key === track.cur || key in track.leaving || (keepMounted && track.visited.includes(key));
  const forceHoverIdx = forceState === "hover" ? opts.findIndex((o, i) => i !== selIdx && !o.disabled) : -1;
  const name = ariaLabelledBy ? undefined : ariaLabel ?? (label || undefined);

  const tabNodes = opts.map((t, i) => {
    const on = i === selIdx;
    const dis = isDisabled || !!t.disabled;
    const ic = t.icon ? (typeof t.icon === "string" ? <Icon name={t.icon} size={ICON[sz]} stroke={1.9} /> : isValidElement(t.icon) ? t.icon : null) : null;
    const hasBadge = t.badge !== undefined && t.badge !== null && t.badge !== false && t.badge !== "";
    const body = (
      <span className="ts-tabs__face">
        {ic}
        <span className="ts-tabs__lbl">{t.label}</span>
        {hasBadge && <span className="ts-tabs__badge">{t.badge}</span>}
      </span>
    );
    const common = {
      ref: (el) => { tabEls.current[i] = el; },
      className: "ts-tabs__tab",
      title: t.title,
      "aria-label": t.ariaLabel,
      "aria-disabled": dis || undefined,
      "data-force": i === forceHoverIdx ? "hover" : forceState === "focus" && i === focusIdx ? "focus" : forceState === "active" && on ? "active" : undefined,
      onPointerEnter: (e) => { if (e.pointerType !== "touch" && !dis) hoverTo(i); },
      onPointerLeave: () => { if (live.current.forceState !== "hover") hoverOff(); },
    };
    if (linkMode) {
      return (
        <a key={String(t.id)} {...common} href={dis ? undefined : t.href ?? undefined} aria-current={on ? "page" : undefined}
          onClick={(e) => { if (dis) { e.preventDefault(); return; } commit(i, e); }}>
          {body}
        </a>
      );
    }
    const showsPanel = hasPanels && (ids[i].custom || mountedPanel(String(t.id)));
    return (
      <button key={String(t.id)} {...common} type="button" role="tab" id={ids[i].tab} aria-selected={on}
        aria-controls={showsPanel || ids[i].custom ? ids[i].panel : undefined}
        tabIndex={dis || i !== focusIdx ? -1 : 0}
        onFocus={() => setRoving(i)}
        onClick={(e) => { if (dis) { e.preventDefault(); return; } commit(i, e); }}>
        {body}
      </button>
    );
  });

  const bars = (
    <>
      <span className="ts-tabs__hov" aria-hidden ref={(el) => { hov.box = el; }}>
        <span className="ts-tabs__fill" ref={(el) => { hov.fill = el; }}>
          <span ref={(el) => { hov.a = el; }} />
          <span ref={(el) => { hov.m = el; }} />
          <span ref={(el) => { hov.b = el; }} />
        </span>
      </span>
      <span className="ts-tabs__ind" aria-hidden ref={(el) => { ind.box = el; }}>
        <span ref={(el) => { ind.a = el; }} />
        <span ref={(el) => { ind.m = el; }} />
        <span ref={(el) => { ind.b = el; }} />
      </span>
    </>
  );

  const listEl = linkMode ? (
    <div ref={setList} className="ts-tabs__list">{bars}{tabNodes}</div>
  ) : (
    <div
      ref={setList}
      className="ts-tabs__list"
      role="tablist"
      aria-orientation={eff}
      aria-label={name}
      aria-labelledby={ariaLabelledBy}
      aria-disabled={isDisabled || undefined}
      onKeyDown={onKeyDown}
      onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setRoving(null); }}
    >
      {bars}{tabNodes}
    </div>
  );
  const Bar = linkMode ? "nav" : "div";

  return (
    <>{sheetTag}<div
      ref={root}
      {...rest}
      className={"ts-tabs" + (className ? " " + className : "")}
      style={{ maxWidth: maxWidth || undefined, ...style }}
      data-size={sz}
      data-surface={surf}
      data-orient={orientation === "vertical" ? "vertical" : "horizontal"}
      data-full={fullWidth || undefined}
      data-disabled={isDisabled || undefined}
    >
      <div className="ts-tabs__frame">
        <Bar className="ts-tabs__bar" aria-label={linkMode ? name : undefined} aria-labelledby={linkMode ? ariaLabelledBy : undefined}>
          <div className="ts-tabs__scroll" ref={scroller} onScroll={updateFades}>{listEl}</div>
        </Bar>
        {hasPanels && (
          <div className="ts-tabs__panes" ref={panes}>
            {opts.map((t, i) => {
              const key = String(t.id);
              if (ids[i].custom || !mountedPanel(key)) return null;
              const role = key === track.cur ? "in" : key in track.leaving ? "out" : "idle";
              return (
                <Panel key={key} k={key} role={role} dir={role === "out" ? track.leaving[key] : track.dir} axis={eff === "vertical" ? "y" : "x"}
                  ctx={live} onGone={onGone} id={ids[i].panel} tabId={ids[i].tab}>
                  {panelFor(t)}
                </Panel>
              );
            })}
          </div>
        )}
      </div>
    </div></>
  );
});

// One tabpanel. "in" is the selected panel, "out" is leaving (taken out of the flow and nudged away while it
// fades), "idle" is a visited panel kept mounted and hidden. A panel that is called back while it is still leaving
// turns around from where it is.
function Panel({ k, role, dir, axis, ctx, onGone, id, tabId, children }) {
  const el = useRef(null);
  const off = useMotionValue(0);
  const op = useMotionValue(1);
  const prev = useRef(null);
  const runs = useRef([]);
  const token = useRef(0);
  useIsoLayoutEffect(() => {
    const C = ctx.current;
    const was = prev.current;
    prev.current = role;
    const node = el.current;
    if (node) node.inert = role === "out";
    runs.current.forEach((a) => a.stop());
    runs.current = [];
    const my = ++token.current;
    const D = axis === "x" && C.rtl ? -DIST : DIST;
    if (role === "in") {
      if (was === null && !C.mounted) { off.set(0); op.set(1); return; }
      if (C.reduce) { off.set(0); if (was !== "out") op.set(0); runs.current = [animate(op, 1, { duration: 0.15, ease: "easeOut" })]; return; }
      if (was === null || was === "idle") { off.set(dir * D); op.set(0); }
      runs.current = [animate(off, 0, PANEL_IN), animate(op, 1, { duration: 0.22, ease: [0.2, 0.8, 0.2, 1] })];
    } else if (role === "out") {
      if (C.reduce) { op.set(0); onGone(k); return; }
      runs.current = [animate(off, -dir * D, PANEL_OUT), animate(op, 0, { duration: 0.14, ease: "easeIn" })];
      runs.current[1].then(() => { if (token.current === my) onGone(k); });
    } else {
      off.set(0); op.set(1);
    }
  }, [role]);
  useEffect(() => () => runs.current.forEach((a) => a.stop()), []);
  // focusable itself only when it holds nothing focusable, so Tab from the list lands on the first control
  useIsoLayoutEffect(() => {
    const n = el.current;
    if (!n) return;
    if (n.querySelector(FOCUSABLE)) n.removeAttribute("tabindex"); else n.tabIndex = 0;
  });
  return (
    <motion.div
      ref={el}
      role="tabpanel"
      id={id}
      aria-labelledby={tabId}
      aria-hidden={role === "out" || undefined}
      hidden={role === "idle"}
      className="ts-tabs__panel"
      data-role={role}
      style={axis === "y" ? { y: off, opacity: op } : { x: off, opacity: op }}
    >
      {children}
    </motion.div>
  );
}
