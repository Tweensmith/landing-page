"use client";
import { forwardRef, useEffect, useId, useRef, useState } from "react";
import { motion } from "motion/react";
import { registerStyles, useStyles, useReducedMotion } from "../_shared/theme.jsx";
import { useFieldStyles, FieldMessage } from "../_shared/field.jsx";
import { Icon } from "../_shared/icons.jsx";
import { RollingNumber } from "../_shared/rolling-number.jsx";

const CSS = `
.ts-step{display:inline-flex;flex-direction:column;gap:8px;font-family:var(--ts-font)}
.ts-step__label{font-size:13px;font-weight:550;color:var(--ts-ink)}
.ts-step__row{display:inline-flex;align-items:center;gap:4px;padding:4px;border-radius:calc(var(--ts-radius-md) + 4px);background:var(--ts-surface);box-shadow:inset 0 0 0 1px var(--ts-line)}
.ts-step.is-invalid .ts-step__row{box-shadow:inset 0 0 0 1.5px var(--ts-danger)}
.ts-step__btn{all:unset;box-sizing:border-box;display:grid;place-items:center;border-radius:var(--ts-radius-md);cursor:pointer;color:var(--ts-ink);background:var(--ts-surface2);
  transition:background-color .15s,opacity .15s;-webkit-tap-highlight-color:transparent;touch-action:manipulation}
.ts-step__btn:hover,.ts-step__btn[data-force=hover]{background:color-mix(in srgb,var(--ts-surface2) 84%,var(--ts-ink))}
.ts-step__btn:focus-visible{outline:2px solid var(--ts-focus);outline-offset:2px}
.ts-step__btn:disabled{opacity:.35;cursor:not-allowed}
.ts-step__val{display:grid;place-items:center;font-weight:600;color:var(--ts-ink);border-radius:var(--ts-radius-sm);letter-spacing:-0.02em;cursor:default;user-select:none}
.ts-step__val:focus-visible,.ts-step__val[data-force=focus]{outline:2px solid var(--ts-focus);outline-offset:2px}
.ts-step__val[aria-disabled=true]{opacity:.5}
.ts-step__unit{font-size:.5em;font-weight:500;color:var(--ts-ink2);margin-left:4px;letter-spacing:0}
.ts-step__sr{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap}
@media (max-width:640px),(pointer:coarse){.ts-step__btn{min-width:44px;min-height:44px}.ts-step__val{min-height:44px}}
`;
registerStyles("ts-stepper", CSS);

const SIZES = { sm: { btn: 32, val: 48, font: 16 }, md: { btn: 40, val: 64, font: 22 }, lg: { btn: 52, val: 84, font: 30 } };

/**
 * Stepper — increment / decrement a quantity (guests, seats, items).
 * Signature: odometer digits; press-and-hold repeats and accelerates; bounds disable the button.
 * The value is a focusable spinbutton: ↑/↓ step, PageUp/PageDown ×10, Home/End jump to bounds, Enter submits
 * the form. The − / + buttons answer pointer, click and assistive-tech activation; like a native number field
 * they stay out of the tab order because the spinbutton's arrow keys do the same job.
 * Controlled: pass `value` and update it in `onChange`. Uncontrolled: `defaultValue`. The ref goes to the spinbutton.
 */
export const Stepper = forwardRef(function Stepper({
  value,
  defaultValue = 0,
  min = 0,
  max = 12,
  step = 1,
  label = "",
  hideLabel = false,
  unit = "",
  incrementLabel,
  decrementLabel,
  size = "md",
  disabled = false,
  readOnly = false,
  name,
  id,
  error,
  demo = false,
  onChange,
  forceState,
  className,
  style,
  "aria-label": ariaLabel,
  "aria-describedby": ariaDescribedBy,
  ...rest
}, ref) {
  const sheetTag = useStyles("ts-stepper", CSS);
  const sheetTag2 = useFieldStyles();
  const reduce = useReducedMotion();
  const uid = useId();
  const baseId = id ?? uid;
  const text = label || (demo ? "Guests" : "");
  const clamp = (n) => Math.min(max, Math.max(min, n));
  const controlled = value !== undefined;
  const [inner, setInner] = useState(() => clamp(defaultValue));
  useEffect(() => { if (!controlled) setInner((x) => clamp(x)); }, [min, max]);
  const v = clamp(controlled ? Number(value) : inner);
  const hold = useRef(null);
  const cur = useRef(v);
  cur.current = v;
  const isDisabled = disabled || forceState === "disabled";
  const inert = isDisabled || readOnly;
  const s = SIZES[size] ?? SIZES.md;
  const input = useRef(null);
  const live = useRef({});
  live.current = { v, controlled, defaultValue, onChange, clamp };
  const val = useRef(null);
  const setVal = (el) => { val.current = el; if (typeof ref === "function") ref(el); else if (ref) ref.current = el; };
  // a press on − / + while focus is elsewhere (a screen reader's virtual cursor, a tap) is spoken through a
  // polite status line; with focus on the spinbutton its own value change is announced, so nothing is added
  const [said, setSaid] = useState("");
  const say = () => { if (document.activeElement !== val.current) setSaid(unit ? `${cur.current} ${unit}` : String(cur.current)); };

  const set = (n) => {
    const c = clamp(Math.round(n / step) * step);
    if (c !== cur.current) { cur.current = c; if (!controlled) setInner(c); onChange?.(c); }
    return c;
  };
  const stop = () => { clearTimeout(hold.current); hold.current = null; };
  useEffect(() => stop, []);
  useEffect(() => { if (inert) stop(); }, [inert]);
  const start = (dir) => {
    if (inert) return;
    set(cur.current + dir * step);
    let delay = 380;
    const tick = () => {
      const before = cur.current;
      if (set(before + dir * step) === before) return stop();
      delay = Math.max(45, delay * 0.78);
      hold.current = setTimeout(tick, delay);
    };
    hold.current = setTimeout(tick, delay);
  };

  // form reset returns to defaultValue (and tells a controlling parent)
  useEffect(() => {
    const form = input.current?.form;
    if (!form) return;
    const h = () => {
      const l = live.current;
      const d = l.clamp(l.defaultValue);
      if (!l.controlled) setInner(d);
      if (l.v !== d) l.onChange?.(d);
    };
    form.addEventListener("reset", h);
    return () => form.removeEventListener("reset", h);
  }, []);
  useEffect(() => { if (input.current) input.current.value = String(v); });

  const onKey = (e) => {
    if (e.key === "Enter") { input.current?.form?.requestSubmit(); return; }
    if (inert) return;
    const map = { ArrowUp: step, ArrowRight: step, ArrowDown: -step, ArrowLeft: -step, PageUp: step * 10, PageDown: -step * 10 };
    if (e.key in map) { e.preventDefault(); set(cur.current + map[e.key]); }
    else if (e.key === "Home") { e.preventDefault(); set(min); }
    else if (e.key === "End") { e.preventDefault(); set(max); }
  };

  // a pointer press steps (and repeats while held); the click that follows it is swallowed. A click with no
  // pointer press before it (keyboard on a focused button, a screen reader, element.click()) steps once.
  const pressed = useRef(false);
  const name_ = (text || ariaLabel || "").toLowerCase();
  const btn = (dir) => (
    <motion.button
      type="button"
      className="ts-step__btn"
      data-force={forceState === "hover" && dir > 0 ? "hover" : undefined}
      aria-label={dir > 0 ? incrementLabel ?? `Increase${name_ ? " " + name_ : ""}` : decrementLabel ?? `Decrease${name_ ? " " + name_ : ""}`}
      aria-controls={baseId + "v"}
      tabIndex={-1}
      disabled={inert || (dir < 0 ? v <= min : v >= max)}
      onPointerDown={(e) => { if (e.button !== 0) return; e.preventDefault(); pressed.current = true; start(dir); }}
      onPointerUp={() => { stop(); if (pressed.current) say(); setTimeout(() => { pressed.current = false; }, 0); }}
      onPointerLeave={() => { stop(); pressed.current = false; }}
      onPointerCancel={() => { stop(); pressed.current = false; }}
      onClick={() => { if (pressed.current) { pressed.current = false; return; } if (!inert) { set(cur.current + dir * step); say(); } }}
      whileTap={reduce ? undefined : { scale: 0.88 }}
      style={{ width: s.btn, height: s.btn }}
    >
      <Icon name={dir > 0 ? "plus" : "minus"} size={Math.round(s.btn * 0.45)} stroke={2.2} />
    </motion.button>
  );

  const describedBy = [error ? baseId + "e" : null, ariaDescribedBy].filter(Boolean).join(" ") || undefined;
  return (
    <>{sheetTag}{sheetTag2}<div className={"ts-step" + (error ? " is-invalid" : "") + (className ? " " + className : "")} style={style} {...rest}>
      {text && <span id={baseId + "l"} className={hideLabel ? "ts-step__sr" : "ts-step__label"}>{text}</span>}
      <div className="ts-step__row">
        {btn(-1)}
        <div
          ref={setVal}
          id={baseId + "v"}
          className="ts-step__val"
          role="spinbutton"
          tabIndex={isDisabled ? -1 : 0}
          aria-labelledby={text ? baseId + "l" : undefined}
          aria-label={text ? undefined : ariaLabel}
          aria-describedby={describedBy}
          aria-valuenow={v}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuetext={unit ? `${v} ${unit}` : undefined}
          aria-disabled={isDisabled || undefined}
          aria-readonly={readOnly || undefined}
          aria-invalid={error ? true : undefined}
          data-force={forceState === "focus" ? "focus" : undefined}
          onKeyDown={onKey}
          style={{ minWidth: s.val, height: s.btn, fontSize: s.font }}
        >
          <span style={{ display: "inline-flex", alignItems: "baseline" }}>
            <RollingNumber value={v} stiffness={340} damping={26} />
            {unit && <span className="ts-step__unit">{unit}</span>}
          </span>
        </div>
        {btn(1)}
      </div>
      <span className="ts-step__sr" role="status">{said}</span>
      <input ref={input} type="hidden" name={name} defaultValue={String(v)} disabled={isDisabled} />
      {error && <FieldMessage id={baseId + "e"} error={error} />}
    </div></>
  );
});
