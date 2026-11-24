"use client";
import { forwardRef, useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import { motion, animate, useMotionValue, useTransform } from "motion/react";
import { registerStyles, useStyles, useReducedMotion } from "../_shared/theme.jsx";
import { useFieldStyles, FieldMessage } from "../_shared/field.jsx";
import { Icon } from "../_shared/icons.jsx";

const SIZES = { sm: { w: 34, h: 20 }, md: { w: 44, h: 26 }, lg: { w: 56, h: 32 } };
// On a phone the switch grows to the platform size (iOS is 51×31) instead of staying a desktop 44×26.
const TOUCH_SIZES = { sm: { w: 44, h: 26 }, md: { w: 52, h: 32 }, lg: { w: 60, h: 36 } };
const MQ = "(max-width: 640px), (pointer: coarse)";
const subscribeMq = (f) => { const m = matchMedia(MQ); m.addEventListener("change", f); return () => m.removeEventListener("change", f); };
const useTouch = () => useSyncExternalStore(subscribeMq, () => matchMedia(MQ).matches, () => false);

// sample copy, shown only with `demo` and only where the caller left the text empty
const DEMO = { label: "Email notifications", description: "A weekly digest, plus mentions and replies." };

const CSS = `
.ts-sw-row{box-sizing:border-box;position:relative;display:flex;align-items:center;gap:16px;width:100%;max-width:var(--sw-max,400px);padding:14px 16px;font-family:var(--ts-font);cursor:pointer;
  border-radius:var(--ts-radius-lg);background:var(--ts-surface);box-shadow:0 0 0 1px var(--ts-line);transition:background-color .2s}
.ts-sw-row:hover{background:color-mix(in srgb,var(--ts-surface) 92%,var(--ts-ink))}
.ts-sw-row.is-plain{padding:10px 0;background:none;box-shadow:none;border-radius:0}
.ts-sw-row.is-plain:hover{background:none}
.ts-sw-row.is-invalid:not(.is-plain){box-shadow:0 0 0 1.5px var(--ts-danger)}
.ts-sw-row.is-disabled{opacity:.5;cursor:not-allowed}
.ts-sw-text{display:flex;flex-direction:column;gap:3px;flex:1;min-width:0}
.ts-sw-label{font-size:14.5px;font-weight:550;color:var(--ts-ink)}
.ts-sw-desc{font-size:12.5px;color:var(--ts-ink2);line-height:1.4}
.ts-sw{all:unset;box-sizing:border-box;position:relative;flex-shrink:0;border-radius:999px;padding:3px;cursor:pointer;
  background:color-mix(in srgb,var(--ts-ink) 16%,transparent);transition:background-color .25s;-webkit-tap-highlight-color:transparent}
.ts-sw[aria-checked=true]{background:var(--ts-on-state)}
.ts-sw:focus-visible,.ts-sw[data-force=focus]{outline:2px solid var(--ts-focus);outline-offset:3px}
.ts-sw:not(:disabled):hover,.ts-sw[data-force=hover]{background:color-mix(in srgb,var(--ts-ink) 24%,transparent)}
.ts-sw[aria-checked=true]:not(:disabled):hover,.ts-sw[aria-checked=true][data-force=hover]{background:color-mix(in srgb,var(--ts-on-state) 88%,var(--ts-ink))}
.ts-sw:disabled{cursor:not-allowed;opacity:.5}
.ts-sw-row.is-disabled .ts-sw{opacity:1}
.ts-sw__thumb{display:grid;place-items:center;height:100%;border-radius:999px;background:var(--ts-surface);color:var(--ts-ink2);
  box-shadow:0 1px 3px color-mix(in srgb,var(--ts-bg) 60%,transparent),0 0 0 .5px var(--ts-line)}
.ts-sw[aria-checked=true] .ts-sw__thumb{color:var(--ts-on-state)}
.ts-sw::after{content:"";position:absolute;inset:-9px -6px}
.ts-sw__input{position:absolute;width:1px;height:1px;margin:0;padding:0;opacity:0;pointer-events:none;clip-path:inset(50%)}
@media (max-width:640px),(pointer:coarse){.ts-sw-row{gap:14px;min-height:64px}.ts-sw-row.is-plain{min-height:56px}}
`;
registerStyles("ts-switch", CSS);

/**
 * Switch — an on/off setting with a label and description (settings rows, preferences).
 * Signature: the thumb stretches as it travels and settles with a squash; the whole row is clickable.
 * role="switch" with aria-checked; Space/Enter toggle. A hidden checkbox carries the value in a <form>.
 * Controlled: pass `checked` and update it in `onChange`. Uncontrolled: leave `checked` out (seed it with
 * `defaultChecked`) and the switch keeps its own state. The ref goes to the switch <button>.
 */
export const Switch = forwardRef(function Switch({
  label = "",
  description = "",
  checked,
  defaultChecked = false,
  size = "md",
  showIcons = false,
  showRow = true,
  bordered = true,
  disabled = false,
  required = false,
  name,
  value = "on",
  id,
  error,
  maxWidth = 400,
  demo = false,
  onChange,
  forceState,
  className,
  style,
  "aria-label": ariaLabel,
  "aria-describedby": ariaDescribedBy,
  ...rest
}, ref) {
  const sheetTag = useStyles("ts-switch", CSS);
  const sheetTag2 = useFieldStyles();
  const reduce = useReducedMotion();
  const uid = useId();
  const baseId = id ?? uid;
  const text = label || (demo ? DEMO.label : "");
  const desc = description || (demo && !label ? DEMO.description : "");
  const controlled = checked !== undefined;
  const [inner, setInner] = useState(!!defaultChecked);
  const on = controlled ? !!checked : inner;
  const isOn = forceState === "selected" ? true : on;
  const isDisabled = disabled || forceState === "disabled";
  const touch = useTouch();
  const s = (touch ? TOUCH_SIZES : SIZES)[size] ?? SIZES.md;
  const thumb = s.h - 6;
  const travel = s.w - thumb - 6;

  const input = useRef(null);
  const btn = useRef(null);
  const setBtn = (el) => { btn.current = el; if (typeof ref === "function") ref(el); else if (ref) ref.current = el; };
  const [, bump] = useState(0);
  const live = useRef({});
  live.current = { on, controlled, defaultChecked: !!defaultChecked, onChange };

  // form reset puts the switch back to defaultChecked (and tells a controlling parent)
  useEffect(() => {
    const form = input.current?.form;
    if (!form) return;
    const h = () => {
      const l = live.current;
      if (!l.controlled) setInner(l.defaultChecked);
      if (l.on !== l.defaultChecked) l.onChange?.(l.defaultChecked);
      bump((n) => n + 1);
    };
    form.addEventListener("reset", h);
    return () => form.removeEventListener("reset", h);
  }, []);
  // keep the hidden checkbox equal to what is shown (a native reset can move it underneath React)
  useEffect(() => { if (input.current) input.current.checked = on; });

  // The squash is a spring kicked with velocity, so a second tap mid-squash carries on from the current
  // scale and speed instead of restarting from 1 (peaks near 1.28 / 0.84 about 100ms after a tap). Kept just
  // under critical damping: Motion 11 stalls a critically damped spring that starts at its target.
  const sx = useMotionValue(1);
  const sy = useTransform(sx, (v) => 1 - (v - 1) * 0.57);
  const toggle = (e) => {
    if (isDisabled) return;
    const next = !on;
    if (!controlled) setInner(next);
    onChange?.(next, e);
    if (!reduce) {
      const room = Math.max(0, 1 - (sx.get() - 1) / 0.28);
      animate(sx, 1, { type: "spring", stiffness: 100, damping: 18, velocity: Math.max(sx.getVelocity(), 7.1 * room), restDelta: 0.001 });
    }
  };
  const force = ["hover", "focus"].includes(forceState) ? forceState : undefined;
  const hasRow = showRow && !!(text || desc);
  const errId = baseId + "e";
  const describedBy = [hasRow && desc ? baseId + "d" : null, error ? errId : null, ariaDescribedBy].filter(Boolean).join(" ") || undefined;

  const hidden = (
    <input
      ref={input}
      type="checkbox"
      className="ts-sw__input"
      tabIndex={-1}
      aria-hidden
      name={name}
      value={value}
      required={required}
      disabled={isDisabled}
      defaultChecked={on}
      onFocus={() => btn.current?.focus()}
    />
  );

  const control = (
    <button
      ref={setBtn}
      type="button"
      role="switch"
      id={hasRow ? baseId : id}
      aria-checked={isOn}
      aria-labelledby={hasRow && text ? baseId + "l" : undefined}
      aria-describedby={describedBy}
      aria-label={hasRow && text ? undefined : ariaLabel ?? (text || undefined)}
      aria-invalid={error ? true : undefined}
      aria-required={required || undefined}
      className={"ts-sw" + (!hasRow && className ? " " + className : "")}
      data-force={force}
      disabled={isDisabled}
      onClick={(e) => { e.stopPropagation(); toggle(e); }}
      style={{ width: s.w, height: s.h, ...(!hasRow ? style : null) }}
      {...(!hasRow ? rest : null)}
    >
      <motion.span
        initial={false}
        animate={{ x: isOn ? travel : 0 }}
        transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 520, damping: 32 }}
        style={{ display: "block", width: thumb, height: "100%" }}
      >
        <motion.span className="ts-sw__thumb" style={{ width: "100%", scaleX: sx, scaleY: sy }}>
          {showIcons && thumb >= 18 && <Icon name={isOn ? "check" : "minus"} size={Math.round(thumb * 0.55)} stroke={2.6} />}
        </motion.span>
      </motion.span>
    </button>
  );

  if (!hasRow) return (<>{sheetTag}{sheetTag2}{control}{hidden}{error && <FieldMessage id={errId} error={error} />}</>);
  const maxW = !maxWidth ? "none" : typeof maxWidth === "number" ? maxWidth + "px" : maxWidth;
  return (
    <>{sheetTag}{sheetTag2}<div
      className={"ts-sw-row" + (bordered ? "" : " is-plain") + (isDisabled ? " is-disabled" : "") + (error ? " is-invalid" : "") + (className ? " " + className : "")}
      style={{ "--sw-max": maxW, ...style }}
      onClick={toggle}
      {...rest}
    >
      <div className="ts-sw-text">
        {text && <span id={baseId + "l"} className="ts-sw-label">{text}</span>}
        {desc && <span id={baseId + "d"} className="ts-sw-desc">{desc}</span>}
        {error && <FieldMessage id={errId} error={error} />}
      </div>
      {control}
      {hidden}
    </div></>
  );
});
