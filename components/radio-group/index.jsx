"use client";
import { createContext, forwardRef, useCallback, useContext, useEffect, useId, useRef, useState } from "react";
import { motion, animate, useMotionValue, useTransform, useVelocity } from "motion/react";
import { registerStyles, useStyles, useIsoLayoutEffect, useReducedMotion } from "../_shared/theme.jsx";
import { useFieldStyles, FieldMessage } from "../_shared/field.jsx";

// Sample content, shown only with `demo` and only where the caller passed no content of their own.
// The invented product is Quillmoor, a writing workspace for small teams.
const DEMO = {
  label: "Send the digest",
  description: "How often Quillmoor gathers your notifications into one email.",
  options: [
    { value: "instant", label: "As it happens", description: "Each mention lands in your inbox within a minute." },
    { value: "hourly", label: "Every hour", description: "Needs the Team plan. Ask a workspace owner to upgrade.", disabled: true },
    { value: "daily", label: "Once a day", description: "One email at 8:00 in your time zone." },
    { value: "weekly", label: "Every Monday", description: "A single round-up of the week before." },
  ],
  defaultValue: "weekly",
};
const REQUIRED_MSG = "This field is required";

const CSS = `
.ts-radios{--rg-box:18px;--rg-slot:26px;--rg-py:10px;--rg-px:0px;--rg-gap:12px;--rg-dot:8px;
  --rg-ring:color-mix(in srgb,var(--ts-ink) 52%,transparent);
  border:0;margin:0;padding:0;min-width:0;width:100%;max-width:var(--rg-max,480px);font-family:var(--ts-font);color:var(--ts-ink)}
.ts-radios[data-size=sm]{--rg-box:16px;--rg-slot:20px;--rg-dot:7px}
.ts-radios[data-size=lg]{--rg-box:22px;--rg-slot:32px;--rg-dot:10px}
.ts-radios__legend{padding:0;margin:0 0 4px;font-size:13px;font-weight:550;color:var(--ts-ink);letter-spacing:-0.005em}
.ts-radios__legend .req{color:var(--ts-ink2);font-weight:400;margin-left:4px}
.ts-radios__desc{margin:0 0 6px;font-size:12.5px;color:var(--ts-ink2);line-height:1.4}
.ts-radios__list{position:relative;display:flex;flex-direction:column}
.ts-radios.is-horizontal .ts-radios__list{flex-direction:row;flex-wrap:wrap;column-gap:24px}
.ts-radios.is-bordered .ts-radios__list{display:grid;grid-template-columns:minmax(0,1fr);border-radius:var(--ts-radius-lg);background:var(--ts-surface);
  box-shadow:0 0 0 1px var(--ts-line);overflow:hidden;margin-top:6px}
.ts-radios.is-bordered.is-horizontal .ts-radios__list{grid-template-columns:repeat(auto-fit,minmax(min(100%,180px),1fr));column-gap:0}
.ts-radios.is-bordered.is-invalid .ts-radios__list{box-shadow:0 0 0 1.5px var(--ts-danger)}
.ts-radios__row{box-sizing:border-box;position:relative;display:flex;align-items:center;min-height:calc(var(--rg-slot) + 2 * var(--rg-py));padding:var(--rg-py) var(--rg-px);
  cursor:pointer;-webkit-tap-highlight-color:transparent;transition:background-color .2s}
.ts-radios.is-horizontal:not(.is-bordered) .ts-radios__row{max-width:100%}
.ts-radios.is-bordered .ts-radios__row{--rg-py:14px;--rg-px:16px;box-shadow:-1px -1px 0 var(--ts-line)}
.ts-radios.is-bordered .ts-radios__row:not(.is-disabled):hover,.ts-radios.is-bordered .ts-radios__row[data-force=hover]{background:color-mix(in srgb,var(--ts-surface) 92%,var(--ts-ink))}
.ts-radios__row.is-disabled{cursor:not-allowed}
.ts-radios__row.is-disabled .ts-radios__slot,.ts-radios__row.is-disabled .ts-radios__label{opacity:.5}
.ts-radios.is-readonly .ts-radios__row{cursor:default}
.ts-radios__grid{display:grid;grid-template-columns:auto minmax(0,1fr);column-gap:var(--rg-gap);align-items:start;width:100%}
.ts-radios.is-end .ts-radios__grid{grid-template-columns:minmax(0,1fr) auto;column-gap:16px}
.ts-radios.is-end .ts-radios__slot{grid-column:2;grid-row:1;align-self:center}
.ts-radios.is-end .ts-radios__text{grid-column:1;grid-row:1}
.ts-radios__slot{position:relative;display:grid;place-items:center;font-size:14.5px;width:var(--rg-box);height:1lh}
.ts-radios__text{display:flex;flex-direction:column;gap:3px;min-width:0}
.ts-radios__label{font-size:14.5px;font-weight:550;color:var(--ts-ink);overflow-wrap:anywhere}
.ts-radios__rdesc{font-size:12.5px;color:var(--ts-ink2);line-height:1.4}
.ts-radios__ring{position:relative;box-sizing:border-box;display:block;width:var(--rg-box);height:var(--rg-box);border-radius:50%;background:var(--ts-surface);
  box-shadow:inset 0 0 0 1.5px var(--rg-ring);transition:box-shadow .18s,background-color .15s}
.ts-radios__row.is-on .ts-radios__ring{box-shadow:inset 0 0 0 2px var(--ts-accent);transition:box-shadow .2s .1s,background-color .15s}
.ts-radios__row.is-on.is-landing .ts-radios__ring{animation:ts-radios-tight .36s .1s cubic-bezier(.3,.7,.3,1.4) both}
@keyframes ts-radios-tight{0%{scale:1}40%{scale:.86}100%{scale:1}}
.ts-radios__row:not(.is-disabled):not(.is-on):hover .ts-radios__ring,.ts-radios__row[data-force=hover]:not(.is-on) .ts-radios__ring{--rg-ring:var(--ts-ink2);background:color-mix(in srgb,var(--ts-surface) 94%,var(--ts-ink))}
.ts-radios.is-readonly .ts-radios__row:hover .ts-radios__ring{--rg-ring:color-mix(in srgb,var(--ts-ink) 52%,transparent);background:var(--ts-surface)}
.ts-radios.is-invalid .ts-radios__row:not(.is-on) .ts-radios__ring{--rg-ring:var(--ts-danger)}
.ts-radios.is-readonly .ts-radios__row.is-on .ts-radios__ring{box-shadow:inset 0 0 0 2px var(--ts-ink2)}
.ts-radios__input{position:absolute;left:50%;top:50%;width:calc(var(--rg-box) + 12px);height:calc(var(--rg-box) + 12px);transform:translate(-50%,-50%);
  margin:0;padding:0;opacity:0;cursor:inherit;z-index:1;appearance:none;-webkit-appearance:none}
.ts-radios__input:focus-visible + .ts-radios__ring,.ts-radios__row[data-force=focus] .ts-radios__ring{outline:2px solid var(--ts-focus);outline-offset:3px}
.ts-radios__dotpos{position:absolute;left:0;top:0;width:0;height:0;pointer-events:none;z-index:2;will-change:transform}
.ts-radios__dotpos.is-muted{opacity:.5}
.ts-radios__dot{position:absolute;left:0;top:0;width:var(--rg-dot);height:var(--rg-dot);margin:calc(var(--rg-dot) / -2) 0 0 calc(var(--rg-dot) / -2);
  border-radius:50%;background:var(--ts-accent)}
.ts-radios.is-readonly .ts-radios__dot{background:var(--ts-ink2)}
@media (max-width:640px),(pointer:coarse){
  .ts-radios{--rg-box:20px;--rg-slot:32px;--rg-gap:14px;--rg-dot:9px}
  .ts-radios[data-size=sm]{--rg-box:18px;--rg-slot:26px;--rg-dot:8px}
  .ts-radios[data-size=lg]{--rg-box:24px;--rg-slot:36px;--rg-dot:11px}
  .ts-radios__row{min-height:56px}
  .ts-radios.is-bordered .ts-radios__row{min-height:64px}
  .ts-radios.is-end .ts-radios__grid{column-gap:14px}
  .ts-radios__input{width:44px;height:44px}
}
@media (prefers-reduced-motion:reduce){.ts-radios__row,.ts-radios__ring,.ts-radios__row.is-on .ts-radios__ring{transition:none}.ts-radios__row.is-on.is-landing .ts-radios__ring{animation:none}}
`;
registerStyles("ts-radio-group", CSS);

const Ctx = createContext(null);
let warnedOutside = false;
const DEV = typeof process === "undefined" || process.env?.NODE_ENV !== "production";
const EMPTY = [];

// a ring's centre in the list's own (untransformed) coordinates: rect differences divided by the list's scale,
// so a group inside a scaled or animating container still lands the dot in the ring
function centreIn(el, box) {
  const b = box.getBoundingClientRect();
  const w = parseFloat(getComputedStyle(box).width) || box.offsetWidth;
  if (!w || !b.width) return null;
  const k = b.width / w;
  const r = el.getBoundingClientRect();
  return { x: (r.left + r.width / 2 - b.left) / k, y: (r.top + r.height / 2 - b.top) / k };
}

/** One option row. Used by RadioGroup for `options`, and exported as Radio for markup between options. */
function RadioRow({ value, label, description, disabled, option }) {
  const g = useContext(Ctx);
  const uid = useId();
  const reduce = useReducedMotion();
  const ring = useRef(null);
  const input = useRef(null);
  const press = useMotionValue(1);
  const down = useRef(false);
  const on = g.selected === value;
  const off = g.disabled || !!disabled;
  const canPress = !off && !g.readOnly && !reduce;
  const release = useCallback(() => {
    if (!down.current) return;
    down.current = false;
    animate(press, 1, { type: "spring", stiffness: 520, damping: 16, restDelta: 0.001 });
  }, [press]);
  const squash = () => {
    if (!canPress) return;
    down.current = true;
    animate(press, 0.84, { type: "spring", stiffness: 700, damping: 32, restDelta: 0.001 });
    const up = () => { release(); window.removeEventListener("pointerup", up); window.removeEventListener("pointercancel", up); };
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
  };
  useIsoLayoutEffect(() => { g.register(value, ring.current, input.current); return () => g.register(value, null, null); }, [value]); // eslint-disable-line
  // the native radio always shows what React shows (a form reset can move it underneath)
  useIsoLayoutEffect(() => { if (input.current) input.current.checked = on; });
  const force = g.forceFirst === value ? g.force : undefined;
  useEffect(() => { if (force === "active") press.set(0.84); else press.set(1); }, [force]); // eslint-disable-line
  const opt = option ?? { value, label, description, disabled };

  return (
    <label
      className={"ts-radios__row" + (on ? " is-on" : "") + (on && g.landing ? " is-landing" : "") + (off ? " is-disabled" : "")}
      data-force={force === "hover" || force === "focus" ? force : undefined}
      onPointerDown={(e) => { if (e.button === 0) squash(); }}
      onPointerLeave={release}
    >
      <span className="ts-radios__grid">
        <span className="ts-radios__slot">
          <input
            ref={input}
            type="radio"
            className="ts-radios__input"
            name={g.name}
            value={String(value)}
            checked={on}
            disabled={off}
            required={g.required}
            aria-labelledby={label ? uid + "l" : undefined}
            aria-describedby={description ? uid + "d" : undefined}
            onChange={(e) => g.choose(value, opt, e)}
            onClick={(e) => { if (g.readOnly) e.preventDefault(); }}
            onKeyDown={(e) => { if (e.key === " " && !e.repeat) squash(); }}
            onKeyUp={(e) => { if (e.key === " ") release(); }}
            onBlur={release}
          />
          <motion.span ref={ring} className="ts-radios__ring" aria-hidden style={{ scale: press }} />
        </span>
        {(label || description) && (
          <span className="ts-radios__text">
            {label && <span id={uid + "l"} className="ts-radios__label">{label}</span>}
            {description && <span id={uid + "d"} className="ts-radios__rdesc">{description}</span>}
          </span>
        )}
      </span>
    </label>
  );
}

/**
 * Radio — one option inside a RadioGroup, for callers who need markup between options:
 * <RadioGroup label="..."><Radio value="a" label="..." description="..." /></RadioGroup>.
 * It reads the group through context and renders nothing outside one.
 */
export function Radio({ value, label, description, disabled = false }) {
  const g = useContext(Ctx);
  if (!g) {
    if (DEV && !warnedOutside) { warnedOutside = true; console.warn("Radio: render it inside a RadioGroup."); }
    return null;
  }
  return <RadioRow value={value} label={label} description={description} disabled={disabled} />;
}

/**
 * RadioGroup — one choice out of a few, all visible, each explained by a line of text. Native radios with one
 * name: one Tab stop, arrow keys move and select (wrapping, skipping disabled ones), `required` and form reset
 * behave natively. Signature: there is one selection dot per group. When the choice changes it travels from the
 * old ring to the new one on a spring, stretching along its direction of travel and settling round; the new ring
 * tightens around it as it lands. The dot is measured against the group (rings read on resize and when options
 * change), never a layoutId. The ref goes to the <fieldset>; ref.current.focus() focuses the checked radio, or
 * the first enabled one.
 */
export const RadioGroup = forwardRef(function RadioGroup({
  options,
  value,
  defaultValue,
  onChange,
  label = "",
  description = "",
  orientation = "vertical",
  size = "md",
  bordered = false,
  controlPlacement = "start",
  disabled = false,
  readOnly = false,
  required = false,
  name,
  id,
  error,
  maxWidth = 480,
  demo = false,
  children,
  forceState,
  className,
  style,
  ...rest
}, ref) {
  const sheetTag = useStyles("ts-radio-group", CSS);
  const sheetTag2 = useFieldStyles();
  const reduce = useReducedMotion();
  const uid = useId();
  const groupName = name || uid + "n";
  const useDemo = demo && !options && !children;
  const list = options ?? (useDemo ? DEMO.options : EMPTY);
  const legend = label || (useDemo ? DEMO.label : "");
  const desc = description || (useDemo && !label ? DEMO.description : "");
  const initial = defaultValue !== undefined ? defaultValue : useDemo ? DEMO.defaultValue : null;
  const [inner, setInner] = useState(initial);
  const controlled = value !== undefined;
  let selected = controlled ? value : inner;
  const isDisabled = disabled || forceState === "disabled";
  const shownError = error || (forceState === "error" ? REQUIRED_MSG : "");
  const firstEnabled = list.find((o) => !o.disabled)?.value;
  // the forced states all land on the first enabled option, so "selected" shows that option chosen (in the demo
  // another option is already chosen by default, and the state has to be told apart from it)
  if (forceState === "selected") selected = firstEnabled;
  const [landing, setLanding] = useState(false);

  const rings = useRef(new Map());
  const radios = useRef(new Map());
  const listRef = useRef(null);
  const root = useRef(null);
  const [, bump] = useState(0);

  const choose = (v, opt, e) => {
    if (readOnly || isDisabled) return;
    if (!controlled) setInner(v);
    setLanding(true);
    onChange?.(v, opt, e);
  };
  const register = useCallback((v, ringEl, inputEl) => {
    if (ringEl) { rings.current.set(v, ringEl); radios.current.set(v, inputEl); }
    else { rings.current.delete(v); radios.current.delete(v); }
  }, []);

  // ---- the dot ----
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const grow = useMotionValue(0);
  const fade = useMotionValue(1);
  const vx = useVelocity(x);
  const vy = useVelocity(y);
  const stretch = (vxv, vyv) => Math.min(Math.hypot(vxv, vyv) / 2600, 0.55);
  const scaleX = useTransform([grow, vx, vy], ([g, a, b]) => g * (1 + stretch(a, b)));
  const scaleY = useTransform([grow, vx, vy], ([g, a, b]) => g * (1 - stretch(a, b) * 0.42));
  const rotate = useTransform([vx, vy], ([a, b]) => (Math.hypot(a, b) < 30 ? 0 : (Math.atan2(b, a) * 180) / Math.PI));
  const shown = useRef({ value: undefined, pos: null });

  const place = (animateMove) => {
    const box = listRef.current;
    const has = selected !== null && selected !== undefined && rings.current.has(selected);
    const prev = shown.current;
    if (!box) return;
    if (!has) {
      if (prev.value !== undefined && prev.value !== null) {
        if (reduce) animate(fade, 0, { duration: 0.14 });
        else animate(grow, 0, { duration: 0.16, ease: [0.4, 0, 1, 1] });
      }
      shown.current = { value: null, pos: null };
      return;
    }
    const p = centreIn(rings.current.get(selected), box);
    if (!p) return;
    const changed = prev.value !== selected;
    const fresh = prev.value === undefined || prev.value === null;
    shown.current = { value: selected, pos: p };
    if (!changed) {
      // same choice, the layout moved (resize, wrap, font): follow without travel
      if (Math.abs(x.get() - p.x) > 0.25 || Math.abs(y.get() - p.y) > 0.25) {
        if (!x.isAnimating() && !y.isAnimating()) { x.set(p.x); y.set(p.y); }
        else { animate(x, p.x, { type: "spring", stiffness: 380, damping: 32 }); animate(y, p.y, { type: "spring", stiffness: 380, damping: 32 }); }
      }
      return;
    }
    if (fresh || !animateMove) {
      x.stop(); y.stop();
      x.set(p.x); y.set(p.y);
      if (!animateMove) { grow.set(1); fade.set(1); return; }
      if (reduce) { grow.set(1); fade.set(0); animate(fade, 1, { duration: 0.16 }); }
      else { fade.set(1); grow.set(0); animate(grow, 1, { type: "spring", stiffness: 520, damping: 22, restDelta: 0.001 }); }
      return;
    }
    if (reduce) {
      x.stop(); y.stop(); x.set(p.x); y.set(p.y); grow.set(1);
      fade.set(0); animate(fade, 1, { duration: 0.16 });
      return;
    }
    fade.set(1);
    if (grow.get() < 1) animate(grow, 1, { type: "spring", stiffness: 520, damping: 26 });
    const spring = { type: "spring", stiffness: 340, damping: 26, mass: 0.9, restDelta: 0.01 };
    animate(x, p.x, spring);
    animate(y, p.y, spring);
  };
  const mounted = useRef(false);
  const placeRef = useRef(place);
  placeRef.current = place;
  useIsoLayoutEffect(() => {
    placeRef.current(mounted.current);
    mounted.current = true;
  });
  // re-measure when the list or any row changes size (width change, a description wrapping, fonts)
  useEffect(() => {
    const box = listRef.current;
    if (!box || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => placeRef.current(true));
    ro.observe(box);
    for (const row of box.children) ro.observe(row);
    return () => ro.disconnect();
  });

  // form reset: back to defaultValue (the radios are controlled, so the browser's own reset would not stick)
  const live = useRef({});
  live.current = { initial, controlled, selected, onChange };
  useEffect(() => {
    const form = root.current?.form;
    if (!form) return;
    const h = () => {
      const l = live.current;
      if (!l.controlled) setInner(l.initial);
      if (l.selected !== l.initial) l.onChange?.(l.initial, null, null);
      setTimeout(() => bump((n) => n + 1), 0);
    };
    form.addEventListener("reset", h);
    return () => form.removeEventListener("reset", h);
  }, []);

  // read-only: arrows move focus without choosing
  const onKeyDown = (e) => {
    rest.onKeyDown?.(e);
    if (!readOnly) return;
    const keys = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
    if (!(e.key in keys)) return;
    e.preventDefault();
    const all = [...(listRef.current?.querySelectorAll("input[type=radio]:not(:disabled)") ?? [])];
    if (!all.length) return;
    let step = keys[e.key];
    if (getComputedStyle(e.currentTarget).direction === "rtl" && (e.key === "ArrowLeft" || e.key === "ArrowRight")) step = -step;
    const i = all.indexOf(document.activeElement);
    all[(i + step + all.length) % all.length].focus();
  };

  const setRef = useCallback((el) => {
    if (el && !Object.prototype.hasOwnProperty.call(el, "focus")) {
      el.focus = (opts) => {
        const t = el.querySelector("input[type=radio]:checked:not(:disabled)") || el.querySelector("input[type=radio]:not(:disabled)");
        if (t) t.focus(opts); else HTMLElement.prototype.focus.call(el, opts);
      };
    }
    root.current = el;
    if (typeof ref === "function") ref(el);
    else if (ref) ref.current = el;
  }, [ref]);

  if (!list.length && !children) return null;
  const legendId = uid + "lg";
  const descId = uid + "ds";
  const errId = uid + "er";
  const maxW = !maxWidth ? "none" : typeof maxWidth === "number" ? maxWidth + "px" : maxWidth;
  const sizeKey = ["sm", "md", "lg"].includes(size) ? size : "md";
  const selOpt = list.find((o) => o.value === selected);
  const ctx = {
    name: groupName, selected, choose, register, disabled: isDisabled, readOnly, required, landing: landing && !reduce,
    force: ["hover", "focus", "active"].includes(forceState) ? forceState : undefined, forceFirst: firstEnabled,
  };
  const { onKeyDown: _k, "aria-describedby": ariaDescribedBy, ...attrs } = rest;

  return (
    <>{sheetTag}{sheetTag2}<Ctx.Provider value={ctx}>
      <fieldset
        ref={setRef}
        id={id}
        role="radiogroup"
        {...attrs}
        className={"ts-radios" + (orientation === "horizontal" ? " is-horizontal" : "") + (bordered ? " is-bordered" : "") + (controlPlacement === "end" ? " is-end" : "") +
          (readOnly ? " is-readonly" : "") + (shownError ? " is-invalid" : "") + (className ? " " + className : "")}
        data-size={sizeKey}
        style={{ "--rg-max": maxW, ...style }}
        disabled={isDisabled}
        aria-labelledby={legend ? legendId : attrs["aria-labelledby"]}
        aria-describedby={[desc ? descId : null, shownError ? errId : null, ariaDescribedBy].filter(Boolean).join(" ") || undefined}
        aria-required={required || undefined}
        aria-readonly={readOnly || undefined}
        aria-invalid={shownError ? true : undefined}
        onKeyDown={onKeyDown}
      >
        {legend && <legend id={legendId} className="ts-radios__legend">{legend}{required && <span className="req" aria-hidden>*</span>}</legend>}
        {desc && <p id={descId} className="ts-radios__desc">{desc}</p>}
        <div className="ts-radios__list" ref={listRef}>
          {options || useDemo
            ? list.map((o) => <RadioRow key={String(o.value)} value={o.value} label={o.label} description={o.description} disabled={o.disabled} option={o} />)
            : children}
          {/* outer: position and the direction of travel; inner: the stretch along that direction */}
          <motion.span className={"ts-radios__dotpos" + (isDisabled || selOpt?.disabled ? " is-muted" : "")} aria-hidden style={{ x, y, rotate }}>
            <motion.span className="ts-radios__dot" style={{ scaleX, scaleY, opacity: fade }} />
          </motion.span>
        </div>
        {shownError && <div style={{ marginTop: 6 }}><FieldMessage id={errId} error={shownError} /></div>}
      </fieldset>
    </Ctx.Provider></>
  );
});
