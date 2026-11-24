"use client";
import { forwardRef, isValidElement, useCallback, useEffect, useId, useRef, useState } from "react";
import { animate, useMotionValue } from "motion/react";
import { registerStyles, useStyles, useIsoLayoutEffect, useReducedMotion } from "../_shared/theme.jsx";
import { useFieldStyles, FieldMessage } from "../_shared/field.jsx";
import { Icon } from "../_shared/icons.jsx";

// Heights are Button's: 34 / 42 / 52 (44 at least on phones and touch screens, as Button does).
const SIZES = { sm: { icon: 15 }, md: { icon: 16 }, lg: { icon: 18 } };
// The two edges of the thumb are separate springs: the edge moving toward the target leads, the other trails, so
// the thumb stretches in the direction of travel and settles. Both carry the release velocity of a drag.
const LEAD = { type: "spring", stiffness: 720, damping: 44, restDelta: 0.2 };
const TRAIL = { type: "spring", stiffness: 300, damping: 30, restDelta: 0.2 };
const FOLLOW = { type: "spring", stiffness: 1400, damping: 70, restDelta: 0.3 };
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

// sample content, shown only with `demo` and only when the caller passes no options
const DEMO_TASKS = [
  { value: "inbox", label: "Inbox", icon: "inbox", count: 12 },
  { value: "assigned", label: "Assigned", icon: "user", count: 4 },
  { value: "done", label: "Done", icon: "check", count: 31 },
];
const DEMO_BILLING = ["Monthly", "Yearly"];

const CSS = `
.ts-segctl{--sc-h:42px;--sc-fs:14px;--sc-px:16px;--sc-r:var(--ts-radius-md);--sc-tr:max(4px,calc(var(--ts-radius-md) - 3px));
  --sc-thumb:var(--ts-surface);--sc-on:var(--ts-ink);
  position:relative;display:inline-flex;flex-direction:column;gap:7px;max-width:100%;min-width:0;vertical-align:middle;font-family:var(--ts-font);color:var(--ts-ink);-webkit-tap-highlight-color:transparent}
@supports (color:light-dark(red,red)){.ts-segctl{--sc-thumb:light-dark(var(--ts-surface),color-mix(in srgb,var(--ts-ink) 14%,var(--ts-surface2)))}}
.ts-segctl[data-size=sm]{--sc-h:34px;--sc-fs:13px;--sc-px:12px}
.ts-segctl[data-size=lg]{--sc-h:52px;--sc-fs:16px;--sc-px:20px}
.ts-segctl[data-shape=pill]{--sc-r:999px;--sc-tr:999px}
.ts-segctl[data-tone=accent]{--sc-thumb:var(--ts-accent);--sc-on:var(--ts-accent-ink)}
.ts-segctl[data-fill=true]{display:flex;width:100%}
.ts-segctl__track{position:relative;box-sizing:border-box;height:var(--sc-h);min-width:0;border-radius:var(--sc-r);overflow:hidden;
  background:var(--ts-surface2);box-shadow:inset 0 0 0 1px var(--ts-line);transition:box-shadow .18s,opacity .2s}
.ts-segctl__track[data-invalid=true]{box-shadow:inset 0 0 0 1.5px var(--ts-danger),0 0 0 4px color-mix(in srgb,var(--ts-danger) 14%,transparent)}
.ts-segctl[data-disabled=true] .ts-segctl__track{opacity:.5}
.ts-segctl__scroll{box-sizing:border-box;height:100%;padding:3px;overflow-x:auto;overflow-y:hidden;scrollbar-width:none;overscroll-behavior-x:contain;--fs:0px;--fe:0px;
  -webkit-mask-image:linear-gradient(to right,transparent,black var(--fs),black calc(100% - var(--fe)),transparent);mask-image:linear-gradient(to right,transparent,black var(--fs),black calc(100% - var(--fe)),transparent)}
.ts-segctl__scroll::-webkit-scrollbar{display:none}
.ts-segctl__list{position:relative;display:flex;width:max-content;min-width:100%;height:100%;touch-action:pan-y;user-select:none;-webkit-user-select:none;outline:none}
.ts-segctl[data-fill=true] .ts-segctl__list{width:100%}
.ts-segctl[data-scroll=true] .ts-segctl__list{touch-action:pan-x pan-y}
.ts-segctl[data-scroll=true] .ts-segctl__seg[data-on=true]{touch-action:pan-y}
.ts-segctl__thumb{position:absolute;left:0;top:0;width:0;height:100%;pointer-events:none;transform-origin:0 50%;opacity:0;will-change:transform}
.ts-segctl[data-tone=neutral] .ts-segctl__thumb{filter:drop-shadow(0 1px 1.5px color-mix(in srgb,var(--ts-black) 16%,transparent)) drop-shadow(0 0 .5px color-mix(in srgb,var(--ts-black) 30%,transparent))}
.ts-segctl__thumb>span{position:absolute;left:0;top:0;height:100%;background:var(--sc-thumb)}
.ts-segctl__cap{border-radius:var(--sc-tr)}
.ts-segctl__mid{width:100px;transform-origin:0 50%}
.ts-segctl__seg{position:relative;box-sizing:border-box;display:flex;align-items:center;justify-content:center;flex:none;height:100%;padding:0 var(--sc-px);
  border-radius:var(--sc-tr);cursor:pointer;font-size:var(--sc-fs);line-height:1.2;letter-spacing:-0.01em;--p:0;--sc-base:var(--ts-ink2);transition:background-color .15s}
.ts-segctl[data-fill=true] .ts-segctl__seg{flex:1 1 0;min-width:0;padding:0 10px}
.ts-segctl[data-icon=true] .ts-segctl__seg{padding:0;min-width:calc(var(--sc-h) - 6px)}
.ts-segctl__seg:hover:not([data-on=true]):not([data-dis=true]),.ts-segctl__seg[data-force=hover]{--sc-base:var(--ts-ink);background:color-mix(in srgb,var(--ts-ink) 6%,transparent)}
.ts-segctl[data-ro=true] .ts-segctl__seg,.ts-segctl[data-disabled=true] .ts-segctl__seg{cursor:default;background:none;--sc-base:var(--ts-ink2)}
.ts-segctl[data-disabled=true] .ts-segctl__seg{cursor:not-allowed}
.ts-segctl__seg[data-dis=true]{cursor:not-allowed;opacity:.42}
.ts-segctl__seg:has(.ts-segctl__input:focus-visible),.ts-segctl__seg[data-force=focus]{outline:2px solid var(--ts-focus);outline-offset:1px}
.ts-segctl__face{display:grid;min-width:0;max-width:100%;transition:transform .16s cubic-bezier(.2,.8,.2,1)}
.ts-segctl:not([data-ro=true]):not([data-disabled=true]) .ts-segctl__seg:not([data-dis=true]):not([data-on=true]):active .ts-segctl__face{transform:scale(.95)}
.ts-segctl__txt,.ts-segctl__ghost{grid-area:1/1;display:inline-flex;align-items:center;justify-content:center;gap:6px;min-width:0;white-space:nowrap}
.ts-segctl__ghost{visibility:hidden;font-weight:650}
.ts-segctl[data-fill=true] .ts-segctl__ghost{display:none}
.ts-segctl__txt{font-weight:calc(510 + var(--p) * 140);color:color-mix(in srgb,var(--sc-on) calc(var(--p) * 100%),var(--sc-base))}
.ts-segctl__lbl{min-width:0;overflow:hidden;text-overflow:ellipsis}
.ts-segctl__count{font-size:.84em;font-variant-numeric:tabular-nums;letter-spacing:0}
.ts-segctl__input{position:absolute;left:0;top:0;width:100%;height:100%;margin:0;opacity:0;pointer-events:none;-webkit-appearance:none;appearance:none}
.ts-segctl .ts-field__label{align-self:flex-start}
@media (max-width:640px),(pointer:coarse){.ts-segctl[data-size=sm],.ts-segctl[data-size=md]{--sc-h:44px}}
@media (prefers-reduced-motion:reduce){.ts-segctl__face{transition:none}.ts-segctl__seg{transition:none}}
.ts-segctl-demo{display:flex;flex-direction:column;align-items:flex-start;gap:18px;max-width:100%;min-width:0}
`;
registerStyles("ts-segmented-control", CSS);

function normalise(options) {
  return (Array.isArray(options) ? options : []).filter((o) => o !== null && o !== undefined && o !== false).map((o) => {
    if (typeof o === "string" || typeof o === "number") return { value: o, label: String(o), raw: o };
    return { ...o, label: o.label ?? String(o.value ?? ""), raw: o };
  });
}
const textOf = (o) => (typeof o.label === "string" || typeof o.label === "number" ? String(o.label) : o.ariaLabel ?? String(o.value ?? ""));

/**
 * SegmentedControl: two to five short options that switch a view or a setting in place (Monthly / Yearly,
 * List / Board / Calendar). A form control: one value, native radios under one `name`.
 * Signature: one thumb sits under the selected segment. A click or an arrow key sends it there on two edge
 * springs, so it stretches in the direction of travel and settles, while each label's weight and colour follow
 * the thumb as it passes. The thumb can be grabbed: press on it (or anywhere on the track) and drag; it follows the
 * pointer, squashes slightly while held, previews the segment under it, and on release snaps to the nearest
 * enabled segment carrying the release velocity (a flick selects the neighbour). Escape cancels a drag. The value
 * changes on release; `onPreview(value | null)` reports the segment under a drag. Reduced motion: the thumb jumps
 * with a short fade, and dragging still works without stretch or squash.
 * Keyboard: Tab enters at the selected segment; arrows move and wrap, skipping disabled segments (reversed under
 * dir="rtl"); Home / End. The ref is the root; `ref.current.focus()` focuses the selected segment.
 */
export const SegmentedControl = forwardRef(function SegmentedControl({
  options = [],
  value,
  defaultValue,
  onChange,
  onPreview,
  label = "",
  showLabel = false,
  name,
  id,
  size = "md",
  fill = false,
  iconOnly = false,
  shape = "rounded",
  tone = "neutral",
  disabled = false,
  readOnly = false,
  required = false,
  error,
  demo = false,
  forceState,
  className,
  style,
  "aria-label": ariaLabel,
  "aria-describedby": ariaDescribedBy,
  ...rest
}, ref) {
  const hasOwn = Array.isArray(options) && options.length > 0;
  if (demo && !hasOwn) {
    return (
      <div ref={ref} className={"ts-segctl-demo" + (className ? " " + className : "")} style={style} {...rest}>
        <SegmentedControl options={DEMO_TASKS} defaultValue="inbox" label="Tasks" size={size} fill={fill} iconOnly={iconOnly} shape={shape} tone={tone}
          disabled={disabled} readOnly={readOnly} forceState={forceState} onChange={onChange} onPreview={onPreview} />
        <SegmentedControl options={DEMO_BILLING} defaultValue="Yearly" label="Billing period" showLabel size={size} fill={fill} shape={shape} tone={tone}
          disabled={disabled} readOnly={readOnly} />
      </div>
    );
  }
  return <Control {...{ options, value, defaultValue, onChange, onPreview, label, showLabel, name, id, size, fill, iconOnly, shape, tone, disabled, readOnly, required, error, forceState, className, style, ariaLabel, ariaDescribedBy, rest, fwd: ref }} />;
});

function Control({ options, value, defaultValue, onChange, onPreview, label, showLabel, name, id, size, fill, iconOnly, shape, tone, disabled, readOnly, required, error, forceState, className, style, ariaLabel, ariaDescribedBy, rest, fwd }) {
  const sheetTag = useStyles("ts-segmented-control", CSS);
  const sheetTag2 = useFieldStyles();
  const reduce = useReducedMotion();
  const uid = useId();
  const opts = normalise(options);
  const sz = SIZES[size] ?? SIZES.md;
  const isDisabled = disabled || forceState === "disabled";
  const inert = isDisabled || readOnly;
  const groupName = name || "ts-segctl-" + uid.replace(/:/g, "");
  const listId = id || uid + "g";
  const labelId = uid + "l";
  const msgId = uid + "m";
  const err = error || (forceState === "error" ? "Choose one to continue." : "");

  // controlled when `value` is passed; otherwise our own, seeded by defaultValue (or the first enabled option)
  const firstEnabled = opts.find((o) => !o.disabled)?.value;
  const initial = defaultValue !== undefined ? defaultValue : firstEnabled ?? null;
  const controlled = value !== undefined;
  const [inner, setInner] = useState(initial);
  const selected = controlled ? value : inner;
  const selIdx = opts.findIndex((o) => o.value === selected);
  const [epoch, setEpoch] = useState(0);

  const root = useRef(null);
  const list = useRef(null);
  const scroller = useRef(null);
  const thumb = useRef(null);
  const capL = useRef(null);
  const capR = useRef(null);
  const mid = useRef(null);
  const inputs = useRef([]);
  const geo = useRef({ segs: [], els: [], h: 0 });
  const target = useRef({ idx: -2, w: 0 });
  const g = useRef(null);
  const handledAt = useRef(-1e9);
  const anims = useRef([]);
  const [scrollable, setScrollable] = useState(false);

  const live = useRef({});
  live.current = { opts, selIdx, selected, controlled, onChange, onPreview, inert, reduce, initial };

  const lv = useMotionValue(0);
  const rv = useMotionValue(0);
  const hold = useMotionValue(forceState === "active" ? 1 : 0);
  const op = useMotionValue(0);

  // the ref stays the root element; its .focus() goes to the segment a keyboard user would land on
  const setRoot = useCallback((el) => {
    root.current = el;
    if (el && !Object.prototype.hasOwnProperty.call(el, "focus")) {
      el.focus = (o) => {
        const L = live.current;
        const i = L.selIdx >= 0 ? L.selIdx : L.opts.findIndex((x) => !x.disabled);
        const t = inputs.current[i];
        if (t && !t.disabled) t.focus(o); else HTMLElement.prototype.focus.call(el, o);
      };
    }
    if (typeof fwd === "function") fwd(el);
    else if (fwd && typeof fwd === "object" && "current" in fwd) fwd.current = el;
  }, [fwd]);

  /* ---------- drawing: everything below is transforms, opacity and one CSS variable per label */
  const paint = useCallback(() => {
    const G = geo.current, th = thumb.current;
    if (!th || !G.h) return;
    const h = G.h, hd = hold.get();
    const L0 = lv.get(), R0 = rv.get();
    const L = L0 - hd * 2, R = R0 + hd * 2;
    const w = Math.max(R - L, h);
    const tw = target.current.w || w;
    const stretch = live.current.reduce ? 0 : clamp((w - tw) / tw, 0, 0.6);
    const sy = 1 - hd * 0.07 - stretch * 0.14;
    th.style.transform = `translate3d(${L}px,0,0) scaleY(${sy})`;
    th.style.opacity = String(op.get());
    if (capR.current) capR.current.style.transform = `translate3d(${w - h}px,0,0)`;
    if (mid.current) mid.current.style.transform = `scaleX(${(w - h) / 100})`;
    const c = (L0 + R0) / 2, o = op.get();
    G.els.forEach((el, i) => {
      const s = G.segs[i];
      if (!s || !el) return;
      const p = o < 0.02 ? 0 : clamp(1 - Math.abs(c - s.c) / (s.w * 0.8), 0, 1) * Math.min(1, o * 1.5);
      el.style.setProperty("--p", p.toFixed(3));
    });
  }, []);
  useEffect(() => {
    const u = [lv.on("change", paint), rv.on("change", paint), hold.on("change", paint), op.on("change", paint)];
    return () => u.forEach((f) => f());
  }, [paint]);

  const stopAll = () => { anims.current.forEach((a) => a?.stop?.()); anims.current = []; lv.stop(); rv.stop(); };

  // width of a thumb centred at c: interpolated between the two segments around it (segments differ in width)
  const widthAt = (c) => {
    const S = geo.current.segs;
    if (!S.length) return 0;
    if (c <= S[0].c) return S[0].w;
    for (let i = 0; i < S.length - 1; i++) if (c <= S[i + 1].c) { const t = (c - S[i].c) / (S[i + 1].c - S[i].c || 1); return S[i].w + (S[i + 1].w - S[i].w) * t; }
    return S[S.length - 1].w;
  };
  const nearestEnabled = (c) => {
    const S = geo.current.segs, O = live.current.opts;
    let best = -1, bd = Infinity;
    S.forEach((s, i) => { if (O[i] && !O[i].disabled) { const d = Math.abs(c - s.c); if (d < bd) { bd = d; best = i; } } });
    return best;
  };

  const ensureVisible = (idx, smooth) => {
    const sc = scroller.current, s = geo.current.segs[idx];
    if (!sc || !s || sc.scrollWidth <= sc.clientWidth + 1) return;
    const pad = 24;
    let left = sc.scrollLeft;
    if (s.l - pad < left) left = s.l - pad;
    else if (s.l + s.w + pad > left + sc.clientWidth) left = s.l + s.w + pad - sc.clientWidth;
    if (Math.abs(left - sc.scrollLeft) > 1) sc.scrollTo({ left, behavior: smooth && !live.current.reduce ? "smooth" : "auto" });
  };

  // send the thumb to segment idx (or hide it for -1)
  const moveThumb = (idx, velocity = 0, { instant = false } = {}) => {
    const s = geo.current.segs[idx];
    target.current = { idx, w: s ? s.w : 0 };
    if (!s) { stopAll(); anims.current = [animate(op, 0, { duration: live.current.reduce ? 0 : 0.15 })]; return; }
    const wasHidden = op.get() < 0.5;
    const tL = s.l, tR = s.l + s.w;
    if (instant || wasHidden || live.current.reduce) {
      stopAll();
      lv.set(tL); rv.set(tR);
      if (instant) op.set(1);
      else anims.current = [animate(op, [live.current.reduce && !wasHidden ? 0.35 : 0, 1], { duration: 0.16, ease: "easeOut" })];
      paint();
    } else {
      stopAll();
      op.set(1);
      const right = (tL + tR) / 2 > (lv.get() + rv.get()) / 2;
      anims.current = [
        animate(lv, tL, { ...(right ? TRAIL : LEAD), velocity }),
        animate(rv, tR, { ...(right ? LEAD : TRAIL), velocity }),
      ];
    }
    ensureVisible(idx, !instant);
  };

  /* ---------- measuring: the thumb is placed from the segments' boxes, kept right on resize and font load */
  const measure = useCallback(() => {
    const ls = list.current;
    if (!ls) return;
    const els = [...ls.querySelectorAll(":scope > .ts-segctl__seg")];
    const segs = els.map((el) => ({ l: el.offsetLeft, w: el.offsetWidth, c: el.offsetLeft + el.offsetWidth / 2 }));
    const h = els[0]?.offsetHeight ?? 0;
    geo.current = { segs, els, h };
    if (capL.current) capL.current.style.width = h + "px";
    if (capR.current) capR.current.style.width = h + "px";
    if (mid.current) mid.current.style.left = h / 2 + "px";
    // a truncated label keeps its full text as the accessible name; show it as a title too
    els.forEach((el) => { const t = el.querySelector(".ts-segctl__txt .ts-segctl__lbl"); if (t) { if (t.scrollWidth > t.clientWidth + 1) el.title = t.textContent; else el.removeAttribute("title"); } });
    const sc = scroller.current;
    if (sc) setScrollable(sc.scrollWidth > sc.clientWidth + 1);
    updateFades();
    const L = live.current;
    if (g.current?.dragging) return;
    const running = lv.isAnimating() || rv.isAnimating();
    if (target.current.idx === -2 || !running) moveThumb(L.selIdx, 0, { instant: target.current.idx === -2 || op.get() > 0.5 });
    else moveThumb(L.selIdx);
  }, []);

  const updateFades = () => {
    const sc = scroller.current;
    if (!sc) return;
    const max = sc.scrollWidth - sc.clientWidth;
    const x = Math.abs(sc.scrollLeft);
    const rtl = getComputedStyle(sc).direction === "rtl";
    const atStart = rtl ? x >= max - 1 : x <= 1;
    const atEnd = rtl ? x <= 1 : x >= max - 1;
    sc.style.setProperty("--fs", max > 1 && !atStart ? "20px" : "0px");
    sc.style.setProperty("--fe", max > 1 && !atEnd ? "20px" : "0px");
  };

  const optKey = opts.map((o) => String(o.value) + (o.disabled ? "!" : "") + textOf(o) + (o.count ?? "")).join("|");
  useIsoLayoutEffect(() => { measure(); }, [optKey, size, fill, iconOnly, shape, measure]);
  useEffect(() => {
    const ls = list.current;
    if (!ls || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => measure());
    ro.observe(ls);
    if (scroller.current) ro.observe(scroller.current);
    ls.querySelectorAll(":scope > .ts-segctl__seg").forEach((el) => ro.observe(el));
    document.fonts?.ready?.then(() => measure());
    return () => ro.disconnect();
  }, [optKey, measure]);

  // the selection changed from outside a gesture (keyboard, a controlling parent, a native change)
  useIsoLayoutEffect(() => {
    if (g.current?.dragging) return;
    if (target.current.idx !== selIdx && target.current.idx !== -2) moveThumb(selIdx);
  }, [selIdx]);

  // forced pressed state for the gallery
  useEffect(() => { hold.set(forceState === "active" ? 1 : 0); }, [forceState]);

  // form reset: back to the starting value (the radios are controlled, so remount them after the browser's reset)
  useEffect(() => {
    const form = inputs.current.find(Boolean)?.form;
    if (!form) return;
    const onReset = () => {
      const L = live.current;
      if (!L.controlled) setInner(L.initial);
      if (L.selected !== L.initial) L.onChange?.(L.initial, L.opts.find((o) => o.value === L.initial)?.raw, null);
      setTimeout(() => setEpoch((n) => n + 1), 0);
    };
    form.addEventListener("reset", onReset);
    return () => form.removeEventListener("reset", onReset);
  }, [optKey]);

  const commit = (idx, e) => {
    const L = live.current, o = L.opts[idx];
    if (!o || o.disabled || L.inert || idx === L.selIdx) return false;
    if (!L.controlled) setInner(o.value);
    L.onChange?.(o.value, o.raw, e);
    return true;
  };
  // after a gesture: if a controlling parent kept the old value, the thumb goes back to it
  const reconcile = () => requestAnimationFrame(() => requestAnimationFrame(() => {
    const L = live.current;
    if (!g.current?.dragging && target.current.idx !== L.selIdx) moveThumb(L.selIdx);
  }));

  /* ---------- the drag */
  const endListeners = useRef(() => {});
  const onPointerDown = (e) => {
    if (e.button !== 0 || live.current.inert || !geo.current.segs.length) return;
    const ls = list.current;
    const rect = ls.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const S = geo.current.segs;
    let press = S.findIndex((s) => x >= s.l && x < s.l + s.w);
    if (press < 0) press = nearestEnabled(x);
    const has = op.get() > 0.5 && live.current.selIdx >= 0;
    const L = lv.get(), R = rv.get();
    const onThumb = has && x >= L - 2 && x <= R + 2;
    if (scrollable && e.pointerType === "touch" && !onThumb) { g.current = { id: e.pointerId, tapOnly: true, press, x0: e.clientX, y0: e.clientY }; }
    else g.current = { id: e.pointerId, x0: e.clientX, y0: e.clientY, press, onThumb, dragging: false, grab: onThumb ? x - (L + R) / 2 : 0, catching: !onThumb, samples: [{ t: e.timeStamp, x: e.clientX }], start: live.current.selIdx, preview: live.current.selIdx, type: e.pointerType, left: rect.left };
    if (onThumb && !live.current.reduce) animate(hold, 1, { type: "spring", stiffness: 600, damping: 32 });
    const move = (ev) => onMove(ev), up = (ev) => onUp(ev), cancel = (ev) => onCancel(ev), key = (ev) => { if (ev.key === "Escape" && g.current?.dragging) { ev.preventDefault(); ev.stopPropagation(); onCancel(ev); } };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", cancel);
    window.addEventListener("keydown", key, true);
    endListeners.current = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", cancel);
      window.removeEventListener("keydown", key, true);
    };
  };

  const centreRange = () => {
    const S = geo.current.segs, O = live.current.opts;
    const en = S.filter((s, i) => O[i] && !O[i].disabled);
    return en.length ? [en[0].c, en[en.length - 1].c] : [0, 0];
  };

  const onMove = (e) => {
    const G = g.current;
    if (!G || e.pointerId !== G.id || G.tapOnly) return;
    const dx = e.clientX - G.x0;
    G.samples.push({ t: e.timeStamp, x: e.clientX });
    while (G.samples.length > 2 && e.timeStamp - G.samples[0].t > 100) G.samples.shift();
    const slop = G.type === "touch" ? 10 : 6;
    if (!G.dragging) {
      if (Math.abs(dx) < slop) return;
      G.dragging = true;
      stopAll();
      if (op.get() < 0.5) { op.set(1); G.catching = false; }
      if (!live.current.reduce) animate(hold, 1, { type: "spring", stiffness: 600, damping: 32 });
    }
    const rect = list.current.getBoundingClientRect();
    let c = e.clientX - rect.left - G.grab;
    const [lo, hi] = centreRange();
    if (c < lo) c = lo - Math.min(14, (lo - c) * 0.3);
    if (c > hi) c = hi + Math.min(14, (c - hi) * 0.3);
    const w = widthAt(clamp(c, lo, hi));
    target.current.w = w;
    const tL = c - w / 2, tR = c + w / 2;
    if (G.catching && !live.current.reduce) {
      anims.current = [animate(lv, tL, FOLLOW), animate(rv, tR, FOLLOW)];
      if (Math.abs(lv.get() - tL) < 2 && Math.abs(rv.get() - tR) < 2) G.catching = false;
    } else { lv.stop(); rv.stop(); lv.set(tL); rv.set(tR); }
    const n = nearestEnabled(c);
    if (n !== G.preview) { G.preview = n; live.current.onPreview?.(live.current.opts[n]?.value ?? null); }
  };

  const finish = () => {
    endListeners.current();
    animate(hold, 0, live.current.reduce ? { duration: 0 } : { type: "spring", stiffness: 500, damping: 26 });
  };

  const onUp = (e) => {
    const G = g.current;
    if (!G || e.pointerId !== G.id) return;
    finish();
    handledAt.current = performance.now();
    g.current = null;
    if (G.tapOnly) {
      if (Math.abs(e.clientX - G.x0) < 10 && Math.abs(e.clientY - G.y0) < 10) { const done = commit(G.press, e); if (done) inputs.current[G.press]?.focus({ preventScroll: true }); }
      return;
    }
    if (!G.dragging) {
      // a tap (a small wobble included)
      const done = commit(G.press, e);
      if (done) inputs.current[G.press]?.focus({ preventScroll: true });
      else if (G.press === live.current.selIdx) moveThumb(live.current.selIdx);
      return;
    }
    // release: velocity from the recent samples, projected a little ahead
    const s = G.samples, last = s[s.length - 1];
    const recent = s.filter((p) => last.t - p.t <= 80);
    let v = 0;
    if (recent.length > 1 && e.timeStamp - last.t < 60) v = ((last.x - recent[0].x) / Math.max(1, last.t - recent[0].t)) * 1000;
    const c = (lv.get() + rv.get()) / 2;
    const [lo, hi] = centreRange();
    let idx = nearestEnabled(clamp(c + v * 0.12, lo, hi));
    if (Math.abs(v) > 600 && idx === nearestEnabled(c)) {
      // a fast flick toward a neighbour selects it
      const O = live.current.opts, dir = v > 0 ? 1 : -1;
      for (let i = nearestEnabled(c) + dir; i >= 0 && i < O.length; i += dir) if (!O[i].disabled) { idx = i; break; }
    }
    live.current.onPreview?.(null);
    moveThumb(idx, live.current.reduce ? 0 : v);
    const done = commit(idx, e);
    if (done) inputs.current[idx]?.focus({ preventScroll: true });
    reconcile();
  };

  const onCancel = (e) => {
    const G = g.current;
    if (!G) return;
    finish();
    g.current = null;
    if (G.dragging) { handledAt.current = performance.now(); live.current.onPreview?.(null); moveThumb(live.current.selIdx); }
  };
  useEffect(() => () => endListeners.current(), []);

  // a pointer gesture already decided; keep the label's own click from checking a radio as well
  const onClickCapture = (e) => {
    if (live.current.inert || performance.now() - handledAt.current < 500) e.preventDefault();
  };

  const onKeyDown = (e) => {
    const k = e.key;
    if (!["ArrowRight", "ArrowLeft", "ArrowUp", "ArrowDown", "Home", "End"].includes(k)) return;
    e.preventDefault();
    if (live.current.inert) return;
    const O = live.current.opts;
    const rtl = getComputedStyle(list.current).direction === "rtl";
    const cur = Math.max(0, inputs.current.indexOf(document.activeElement) >= 0 ? inputs.current.indexOf(document.activeElement) : live.current.selIdx);
    const en = O.map((o, i) => (o.disabled ? -1 : i)).filter((i) => i >= 0);
    if (!en.length) return;
    let next;
    if (k === "Home") next = en[0];
    else if (k === "End") next = en[en.length - 1];
    else {
      let d = k === "ArrowRight" || k === "ArrowDown" ? 1 : -1;
      if (rtl && (k === "ArrowRight" || k === "ArrowLeft")) d = -d;
      next = cur;
      for (let n = 0; n < O.length; n++) { next = (next + d + O.length) % O.length; if (!O[next].disabled) break; }
    }
    commit(next, e);
    inputs.current[next]?.focus();
  };

  const onScroll = () => updateFades();

  if (!opts.length) return null;
  const visibleLabel = showLabel && label;
  const describedBy = [err ? msgId : null, ariaDescribedBy].filter(Boolean).join(" ") || undefined;
  const forceHoverIdx = forceState === "hover" ? opts.findIndex((o, i) => i !== selIdx && !o.disabled) : -1;

  return (
    <>{sheetTag}{sheetTag2}<div
      ref={setRoot}
      {...rest}
      className={"ts-segctl" + (className ? " " + className : "")}
      style={style}
      data-size={SIZES[size] ? size : "md"}
      data-fill={fill || undefined}
      data-icon={iconOnly || undefined}
      data-shape={shape === "pill" ? "pill" : "rounded"}
      data-tone={tone === "accent" ? "accent" : "neutral"}
      data-disabled={isDisabled || undefined}
      data-ro={readOnly || undefined}
      data-scroll={scrollable && !fill ? true : undefined}
    >
      {visibleLabel && <span id={labelId} className="ts-field__label">{label}{required && <span className="req" aria-hidden>*</span>}</span>}
      <div className="ts-segctl__track" data-invalid={err ? true : undefined}>
        <div className="ts-segctl__scroll" ref={scroller} onScroll={onScroll}>
          <div
            ref={list}
            id={listId}
            className="ts-segctl__list"
            role="radiogroup"
            aria-labelledby={visibleLabel ? labelId : undefined}
            aria-label={visibleLabel ? undefined : ariaLabel ?? (label || undefined)}
            aria-describedby={describedBy}
            aria-required={required || undefined}
            aria-invalid={err ? true : undefined}
            aria-disabled={isDisabled || undefined}
            aria-readonly={readOnly || undefined}
            onPointerDown={onPointerDown}
            onClickCapture={onClickCapture}
            onKeyDown={onKeyDown}
          >
            <div className="ts-segctl__thumb" ref={thumb} aria-hidden>
              <span className="ts-segctl__cap" ref={capL} />
              <span className="ts-segctl__mid" ref={mid} />
              <span className="ts-segctl__cap" ref={capR} />
            </div>
            {opts.map((o, i) => {
              const text = textOf(o);
              const ic = o.icon ? (typeof o.icon === "string" ? <Icon name={o.icon} size={sz.icon} stroke={1.9} /> : isValidElement(o.icon) ? o.icon : null) : null;
              const body = (
                <>
                  {ic}
                  {iconOnly && ic ? <span className="ts-sr">{text}</span> : <span className="ts-segctl__lbl">{o.label}</span>}
                  {o.count !== undefined && o.count !== null && !iconOnly && <span className="ts-segctl__count">{o.count}</span>}
                </>
              );
              const on = i === selIdx;
              return (
                <label key={String(o.value)} className="ts-segctl__seg" data-on={on || undefined} data-dis={o.disabled || undefined}
                  data-force={i === forceHoverIdx ? "hover" : forceState === "focus" && (on || (selIdx < 0 && i === 0)) ? "focus" : undefined}>
                  <input
                    key={epoch}
                    ref={(el) => { inputs.current[i] = el; }}
                    type="radio"
                    className="ts-segctl__input"
                    name={groupName}
                    value={String(o.value)}
                    checked={on}
                    required={required}
                    disabled={isDisabled || !!o.disabled}
                    aria-label={o.ariaLabel ?? (iconOnly ? text : undefined)}
                    onChange={(e) => { if (!commit(i, e)) e.target.checked = on; }}
                    onClick={(e) => { if (readOnly) e.preventDefault(); }}
                  />
                  <span className="ts-segctl__face">
                    {!fill && <span className="ts-segctl__ghost" aria-hidden>{body}</span>}
                    <span className="ts-segctl__txt">{body}</span>
                  </span>
                </label>
              );
            })}
          </div>
        </div>
      </div>
      {err && <FieldMessage id={msgId} error={err} />}
    </div></>
  );
}
