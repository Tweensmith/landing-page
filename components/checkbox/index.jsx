"use client";
import { forwardRef, useCallback, useEffect, useId, useRef, useState } from "react";
import { motion, animate, useMotionValue, useTransform } from "motion/react";
import { registerStyles, useStyles, useIsoLayoutEffect, useReducedMotion } from "../_shared/theme.jsx";
import { useFieldStyles, FieldMessage } from "../_shared/field.jsx";

// Sample content, shown only with `demo` and only where the caller passed no content of their own.
// The invented product is Quillmoor, a writing workspace for small teams.
const DEMO_GROUP = {
  label: "Email me about",
  description: "Quillmoor sends one digest each morning with whatever you tick here.",
  selectAll: "Everything in this workspace",
  options: [
    { value: "mentions", label: "Mentions and replies", description: "Someone @mentions you or answers your comment." },
    { value: "shared", label: "Drafts shared with you", description: "A teammate gives you access to a draft." },
    { value: "comments", label: "Comments on your documents", description: "New threads, and threads that get resolved." },
    { value: "published", label: "Published changes", description: "A document you follow goes live." },
    { value: "billing", label: "Billing and invoices", description: "Only workspace owners receive these.", disabled: true },
  ],
  defaultValue: ["mentions", "comments"],
};

const DEFAULT_MESSAGES = {
  required: "Choose at least one option.",
  min: (n) => `Choose at least ${n}.`,
  max: (n) => `You can choose up to ${n}. Clear one to pick another.`,
  error: "This field is required",
};

const CSS = `
.ts-cb{--cb-box:18px;--cb-slot:26px;--cb-py:10px;--cb-px:0px;--cb-gap:12px;
  --cb-r:min(calc(var(--ts-radius-sm) * .6),calc(var(--cb-box) * .3));
  --cb-ring:color-mix(in srgb,var(--ts-ink) 52%,transparent);
  box-sizing:border-box;position:relative;display:flex;align-items:center;width:100%;max-width:var(--cb-max,400px);
  min-height:calc(var(--cb-slot) + 2 * var(--cb-py));padding:var(--cb-py) var(--cb-px);margin:0;
  font-family:var(--ts-font);color:var(--ts-ink);cursor:pointer;-webkit-tap-highlight-color:transparent;transition:background-color .2s}
.ts-cb[data-size=sm],.ts-cbb[data-size=sm]{--cb-box:16px;--cb-slot:20px}
.ts-cb[data-size=lg],.ts-cbb[data-size=lg]{--cb-box:22px;--cb-slot:32px}
.ts-cb.is-bordered{--cb-py:14px;--cb-px:16px;border-radius:var(--ts-radius-lg);background:var(--ts-surface);box-shadow:0 0 0 1px var(--ts-line)}
.ts-cb.is-bordered:not(.is-disabled):not(.is-readonly):hover,.ts-cb.is-bordered[data-force=hover]{background:color-mix(in srgb,var(--ts-surface) 92%,var(--ts-ink))}
.ts-cb.is-bordered.is-invalid{box-shadow:0 0 0 1.5px var(--ts-danger)}
.ts-cb.is-incard{--cb-py:14px;--cb-px:16px;max-width:none}
.ts-cb.is-incard:not(.is-disabled):not(.is-readonly):not(.is-blocked):hover,.ts-cb.is-incard[data-force=hover]{background:color-mix(in srgb,var(--ts-surface) 92%,var(--ts-ink))}
.ts-cb.is-disabled{cursor:not-allowed}
.ts-cb.is-disabled .ts-cb__slot,.ts-cb.is-disabled .ts-cb__label{opacity:.5}
.ts-cb.is-readonly,.ts-cb.is-blocked{cursor:default}
.ts-cb__grid{display:grid;grid-template-columns:auto minmax(0,1fr);column-gap:var(--cb-gap);align-items:start;width:100%}
.ts-cb.is-end .ts-cb__grid{grid-template-columns:minmax(0,1fr) auto;column-gap:16px}
.ts-cb.is-end .ts-cb__slot{grid-column:2;grid-row:1;align-self:center}
.ts-cb.is-end .ts-cb__text{grid-column:1;grid-row:1}
.ts-cb__slot{position:relative;display:grid;place-items:center;font-size:14.5px;width:var(--cb-box);height:1lh}
.ts-cb__text{display:flex;flex-direction:column;gap:3px;min-width:0}
.ts-cb__label{font-size:14.5px;font-weight:550;color:var(--ts-ink);overflow-wrap:anywhere}
.ts-cb__desc{font-size:12.5px;color:var(--ts-ink2);line-height:1.4}
.ts-cbb{--cb-box:18px;--cb-r:min(calc(var(--ts-radius-sm) * .6),calc(var(--cb-box) * .3));--cb-ring:color-mix(in srgb,var(--ts-ink) 52%,transparent);
  position:relative;display:inline-grid;place-items:center;width:var(--cb-box);height:var(--cb-box);vertical-align:middle;cursor:pointer;-webkit-tap-highlight-color:transparent}
.ts-cbb.is-disabled{opacity:.5;cursor:not-allowed}
.ts-cbb.is-readonly{cursor:default}
.ts-cb__box{position:relative;box-sizing:border-box;display:block;width:var(--cb-box);height:var(--cb-box);border-radius:var(--cb-r);overflow:hidden;
  background:var(--ts-surface);transition:background-color .15s}
.ts-cb__box::after{content:"";position:absolute;inset:0;border-radius:inherit;box-shadow:inset 0 0 0 1.5px var(--cb-ring);transition:box-shadow .15s;pointer-events:none}
.ts-cb__fill{position:absolute;inset:0;border-radius:inherit;background:var(--ts-accent);transition:background-color .15s}
.ts-cb__mark{position:absolute;inset:0;width:100%;height:100%;color:var(--ts-accent-ink);overflow:visible}
.ts-cb__box.is-on{--cb-ring:transparent}
.ts-cb:not(.is-disabled):not(.is-readonly):not(.is-blocked):hover .ts-cb__box:not(.is-on),.ts-cbb:not(.is-disabled):not(.is-readonly):hover .ts-cb__box:not(.is-on),
.ts-cb[data-force=hover] .ts-cb__box:not(.is-on),.ts-cbb[data-force=hover] .ts-cb__box:not(.is-on){--cb-ring:var(--ts-ink2);background:color-mix(in srgb,var(--ts-surface) 94%,var(--ts-ink))}
.ts-cb:not(.is-disabled):not(.is-readonly):hover .ts-cb__box.is-on .ts-cb__fill,.ts-cbb:not(.is-disabled):not(.is-readonly):hover .ts-cb__box.is-on .ts-cb__fill,
.ts-cb[data-force=hover] .ts-cb__box.is-on .ts-cb__fill{background:color-mix(in srgb,var(--ts-accent) 88%,var(--ts-ink))}
.ts-cb.is-invalid .ts-cb__box:not(.is-on),.ts-cbb.is-invalid .ts-cb__box:not(.is-on){--cb-ring:var(--ts-danger)}
.ts-cb.is-readonly .ts-cb__fill,.ts-cbb.is-readonly .ts-cb__fill{background:var(--ts-ink2)}
.ts-cb.is-readonly .ts-cb__mark,.ts-cbb.is-readonly .ts-cb__mark{color:var(--ts-surface)}
.ts-cb.is-readonly .ts-cb__box:not(.is-on),.ts-cbb.is-readonly .ts-cb__box:not(.is-on){background:var(--ts-surface2)}
.ts-cb.is-blocked .ts-cb__box:not(.is-on){background:var(--ts-surface2);--cb-ring:color-mix(in srgb,var(--ts-ink) 24%,transparent)}
.ts-cb.is-blocked .ts-cb__label{color:var(--ts-ink2)}
.ts-cb__input{position:absolute;left:50%;top:50%;width:calc(var(--cb-box) + 12px);height:calc(var(--cb-box) + 12px);transform:translate(-50%,-50%);
  margin:0;padding:0;opacity:0;cursor:inherit;z-index:1;appearance:none;-webkit-appearance:none}
.ts-cb__input:focus-visible + .ts-cb__box,.ts-cb[data-force=focus] .ts-cb__box,.ts-cbb[data-force=focus] .ts-cb__box{outline:2px solid var(--ts-focus);outline-offset:3px}
@media (max-width:640px),(pointer:coarse){
  .ts-cb,.ts-cbb{--cb-box:20px}
  .ts-cb{--cb-slot:32px;--cb-gap:14px;min-height:56px}
  .ts-cb[data-size=sm],.ts-cbb[data-size=sm]{--cb-box:18px;--cb-slot:26px}
  .ts-cb[data-size=lg],.ts-cbb[data-size=lg]{--cb-box:24px;--cb-slot:36px}
  .ts-cb.is-bordered,.ts-cb.is-incard{min-height:64px}
  .ts-cb.is-end .ts-cb__grid{column-gap:14px}
  .ts-cb__input{width:44px;height:44px}
}
@media (prefers-reduced-motion:reduce){.ts-cb,.ts-cb__box,.ts-cb__box::after,.ts-cb__fill{transition:none}}

.ts-cbg{border:0;margin:0;padding:0;min-width:0;width:100%;max-width:var(--cb-max,400px);font-family:var(--ts-font)}
.ts-cbg__legend{padding:0;margin:0 0 4px;font-size:13px;font-weight:550;color:var(--ts-ink);letter-spacing:-0.005em}
.ts-cbg__legend .req{color:var(--ts-ink2);font-weight:400;margin-left:4px}
.ts-cbg__desc{margin:0 0 6px;font-size:12.5px;color:var(--ts-ink2);line-height:1.4}
.ts-cbg__list{display:flex;flex-direction:column}
.ts-cbg__kids{display:flex;flex-direction:column;padding-inline-start:calc(var(--cbg-box,18px) + 12px)}
.ts-cbg.is-horizontal .ts-cbg__kids,.ts-cbg.is-horizontal .ts-cbg__list.is-flat{flex-direction:row;flex-wrap:wrap;column-gap:24px}
.ts-cbg.is-horizontal .ts-cbg__kids > .ts-cb,.ts-cbg.is-horizontal .ts-cbg__list.is-flat > .ts-cb{width:auto;max-width:100%}
.ts-cbg.is-bordered .ts-cbg__list{border-radius:var(--ts-radius-lg);background:var(--ts-surface);box-shadow:0 0 0 1px var(--ts-line);overflow:hidden;margin-top:6px}
.ts-cbg.is-bordered .ts-cbg__kids{padding-inline-start:0}
.ts-cbg.is-bordered .ts-cbg__kids > .ts-cb{padding-inline-start:calc(var(--cb-px) + var(--cb-box) + var(--cb-gap))}
.ts-cbg.is-bordered .ts-cb + .ts-cb,.ts-cbg.is-bordered .ts-cb + .ts-cbg__kids,.ts-cbg.is-bordered .ts-cbg__kids > .ts-cb + .ts-cb{box-shadow:inset 0 1px 0 var(--ts-line)}
.ts-cbg.is-bordered.is-horizontal .ts-cbg__kids,.ts-cbg.is-bordered.is-horizontal .ts-cbg__list.is-flat{column-gap:0}
.ts-cbg.is-bordered.is-invalid .ts-cbg__list{box-shadow:0 0 0 1.5px var(--ts-danger)}
.ts-cbg__msg{margin-top:6px}
@media (max-width:640px),(pointer:coarse){.ts-cbg__kids{padding-inline-start:calc(var(--cbg-box,20px) + 14px)}}
`;
registerStyles("ts-checkbox", CSS);

const useCheckboxStyles = () => [useStyles("ts-checkbox", CSS), useFieldStyles()];

// the mark: one stroked path whose three points travel between a tick and a dash (viewBox 24)
const TICK = [[5.6, 12.5], [10.1, 16.9], [18.6, 7.7]];
const DASH = [[6.5, 12], [12, 12], [17.5, 12]];
const lerp = (a, b, t) => a + (b - a) * t;
const pathAt = (t) => "M" + TICK.map((p, i) => `${lerp(p[0], DASH[i][0], t).toFixed(2)} ${lerp(p[1], DASH[i][1], t).toFixed(2)}`).join(" L");

let warnedName = false;
const DEV = typeof process === "undefined" || process.env?.NODE_ENV !== "production";

/** The drawn box: fill from the centre, the morphing mark, the press squash. aria-hidden. */
function Glyph({ state, reduce, press }) {
  const on = state !== "off";
  const fill = useMotionValue(on ? 1 : 0);
  const draw = useMotionValue(on ? 1 : 0);
  const shape = useMotionValue(state === "mixed" ? 1 : 0);
  const pop = useMotionValue(1);
  const fade = useMotionValue(on ? 1 : 0);
  const d = useTransform(shape, pathAt);
  const prev = useRef(state);

  useEffect(() => {
    const from = prev.current;
    prev.current = state;
    if (from === state) return;
    const to = state;
    const target = to === "mixed" ? 1 : 0;
    if (reduce) {
      // no draw, no travel, no overshoot: the new state fades in
      fill.stop(); draw.stop(); shape.stop(); pop.stop();
      fill.set(1); draw.set(1); pop.set(1);
      if (to !== "off") shape.set(target);
      if (from !== "off" && to !== "off") fade.set(0.3);
      animate(fade, to === "off" ? 0 : 1, { duration: 0.16, ease: "easeOut" });
      return;
    }
    if (fade.get() !== 1) {
      // coming back from a reduced-motion change: put the values where the old state left them
      fade.stop();
      const wasOn = from !== "off";
      fill.set(wasOn ? 1 : 0); draw.set(wasOn ? 1 : 0); fade.set(1);
    }
    if (to === "off") {
      // the tick retracts faster than it drew, then the fill lets go
      animate(draw, 0, { duration: 0.12, ease: [0.4, 0, 1, 1] });
      animate(fill, 0, { delay: 0.07, duration: 0.18, ease: [0.4, 0, 0.2, 1] });
      return;
    }
    if (draw.get() < 0.05) {
      // a fresh check: fill springs out from the centre, the mark draws a beat later and pops past full size
      shape.stop(); shape.set(target);
      pop.set(0.7);
      animate(fill, 1, { type: "spring", stiffness: 520, damping: 26, restDelta: 0.001 });
      animate(draw, 1, { delay: 0.06, duration: 0.28, ease: [0.2, 0.8, 0.2, 1] });
      animate(pop, 1, { delay: 0.06, type: "spring", stiffness: 600, damping: 22, restDelta: 0.001 });
    } else {
      // tick <-> dash: the three points travel
      animate(shape, target, { type: "spring", stiffness: 480, damping: 26, restDelta: 0.001 });
      animate(fill, 1, { type: "spring", stiffness: 520, damping: 30, restDelta: 0.001 });
      animate(draw, 1, { duration: 0.16, ease: "easeOut" });
      animate(pop, 1, { duration: 0.16 });
    }
  }, [state, reduce]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <motion.span className={"ts-cb__box" + (on ? " is-on" : "")} aria-hidden style={{ scale: press }}>
      <motion.span className="ts-cb__fill" style={{ scale: fill, opacity: fade }} />
      <motion.svg className="ts-cb__mark" viewBox="0 0 24 24" fill="none" style={{ scale: pop, opacity: fade }}>
        <motion.path d={d} stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" style={{ pathLength: draw }} />
      </motion.svg>
    </motion.span>
  );
}

/** The squash under the pointer (and under Space): springs, and never left squashed. */
function usePressSquash(enabled) {
  const press = useMotionValue(1);
  const down = useRef(false);
  const release = useCallback(() => {
    if (!down.current) return;
    down.current = false;
    animate(press, 1, { type: "spring", stiffness: 520, damping: 16, restDelta: 0.001 });
  }, [press]);
  const squash = useCallback(() => {
    if (!enabled) return;
    down.current = true;
    animate(press, 0.84, { type: "spring", stiffness: 700, damping: 32, restDelta: 0.001 });
    const up = () => { release(); window.removeEventListener("pointerup", up); window.removeEventListener("pointercancel", up); };
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
  }, [enabled, press, release]);
  useEffect(() => { if (!enabled && down.current) { down.current = false; press.set(1); } }, [enabled, press]);
  return { press, squash, release };
}

const mergeRefs = (...refs) => (el) => { for (const r of refs) { if (typeof r === "function") r(el); else if (r) r.current = el; } };

/** Shared body of Checkbox and the rows of CheckboxGroup. */
function CheckRow({
  label, description, checked, defaultChecked, indeterminate, onChange, name, value, id, required, disabled, readOnly,
  size, bordered, maxWidth, showRow, controlPlacement, error, forceState, className, style, rest, inputRef,
  blocked = false, blockedId, inCard = false, invalid = false, owned = false,
}) {
  const sheetTag = useCheckboxStyles();
  const reduce = useReducedMotion();
  const uid = useId();
  const inputId = id ?? uid + "in";
  const labelId = uid + "l";
  const descId = uid + "d";
  const errId = uid + "e";
  const controlled = checked !== undefined;
  const [inner, setInner] = useState(!!defaultChecked);
  const on = forceState === "selected" ? true : controlled ? !!checked : inner;
  const mixed = !!indeterminate;
  const isDisabled = disabled || forceState === "disabled";
  const shownError = error || (forceState === "error" ? DEFAULT_MESSAGES.error : "");
  const locked = readOnly || blocked;
  const state = mixed ? "mixed" : on ? "on" : "off";
  const { press, squash, release } = usePressSquash(!isDisabled && !locked && !reduce);
  useEffect(() => { if (forceState === "active") press.set(0.84); else if (!reduce) press.set(1); }, [forceState]); // eslint-disable-line

  const input = useRef(null);
  const [, bump] = useState(0);
  const live = useRef({});
  live.current = { on, controlled, defaultChecked: !!defaultChecked, onChange, owned };

  // form reset: back to defaultChecked (and tell a controlling parent); the motion plays back on its own
  useEffect(() => {
    const form = input.current?.form;
    if (!form) return;
    const h = () => {
      const l = live.current;
      // a row owned by a CheckboxGroup leaves the reset to the group (one onChange with the default values)
      if (!l.owned) {
        if (!l.controlled) setInner(l.defaultChecked);
        if (l.on !== l.defaultChecked) l.onChange?.(l.defaultChecked, null);
      }
      setTimeout(() => bump((n) => n + 1), 0);
    };
    form.addEventListener("reset", h);
    return () => form.removeEventListener("reset", h);
  }, []);
  // the native input always shows what React shows; indeterminate is a property, so set it on every render
  useIsoLayoutEffect(() => {
    const el = input.current;
    if (!el) return;
    el.checked = on;
    el.indeterminate = mixed;
  });

  const text = label;
  const hasRow = showRow && !!(text || description);
  // a bare box needs a name from somewhere
  useEffect(() => {
    if (!DEV || warnedName || hasRow || text) return;
    const el = input.current;
    if (el && !el.getAttribute("aria-label") && !el.getAttribute("aria-labelledby") && !(el.labels && el.labels.length)) {
      warnedName = true;
      console.warn("Checkbox: a bare checkbox needs an accessible name. Pass `label`, or `aria-label` with showRow={false}.");
    }
  });

  const { "aria-describedby": ariaDescribedBy, "aria-label": ariaLabel, onKeyDown, onKeyUp, onBlur, onClick, ...attrs } = rest;
  const describedBy = [hasRow && description ? descId : null, shownError ? errId : null, blocked ? blockedId : null, ariaDescribedBy].filter(Boolean).join(" ") || undefined;
  const force = ["hover", "focus"].includes(forceState) ? forceState : undefined;

  const handleChange = (e) => {
    if (locked || isDisabled) { e.target.checked = on; return; }
    const next = mixed ? true : e.target.checked;
    if (!controlled) setInner(next);
    onChange?.(next, e);
  };

  const control = (
    <>
      <input
        ref={mergeRefs(input, inputRef)}
        type="checkbox"
        className="ts-cb__input"
        id={inputId}
        name={name}
        value={value}
        checked={on}
        required={required}
        disabled={isDisabled}
        aria-labelledby={hasRow && text ? labelId : undefined}
        aria-label={hasRow && text ? undefined : ariaLabel ?? (typeof text === "string" && text ? text : undefined)}
        aria-describedby={describedBy}
        aria-invalid={shownError || invalid ? true : undefined}
        aria-readonly={readOnly || undefined}
        aria-disabled={blocked || undefined}
        onChange={handleChange}
        onClick={(e) => { if (locked) e.preventDefault(); onClick?.(e); }}
        onKeyDown={(e) => { if (e.key === " " && !e.repeat) squash(); onKeyDown?.(e); }}
        onKeyUp={(e) => { if (e.key === " ") release(); onKeyUp?.(e); }}
        onBlur={(e) => { release(); onBlur?.(e); }}
        {...attrs}
      />
      <Glyph state={state} reduce={reduce} press={press} />
    </>
  );
  const pointer = {
    onPointerDown: (e) => { if (e.button === 0) squash(); },
    onPointerLeave: release,
  };
  const sizeKey = ["sm", "md", "lg"].includes(size) ? size : "md";

  if (!hasRow) {
    return (
      <>{sheetTag}
        <span
          className={"ts-cbb" + (isDisabled ? " is-disabled" : "") + (readOnly ? " is-readonly" : "") + (shownError || invalid ? " is-invalid" : "") + (className ? " " + className : "")}
          data-size={sizeKey}
          data-force={force}
          style={style}
          {...pointer}
        >
          {control}
        </span>
        {shownError && <FieldMessage id={errId} error={shownError} />}
      </>
    );
  }
  const maxW = !maxWidth ? "none" : typeof maxWidth === "number" ? maxWidth + "px" : maxWidth;
  return (
    <>{sheetTag}<label
      className={"ts-cb" + (bordered ? " is-bordered" : "") + (inCard ? " is-incard" : "") + (controlPlacement === "end" ? " is-end" : "") +
        (isDisabled ? " is-disabled" : "") + (readOnly ? " is-readonly" : "") + (blocked ? " is-blocked" : "") + (shownError || invalid ? " is-invalid" : "") + (className ? " " + className : "")}
      data-size={sizeKey}
      data-force={force}
      style={{ "--cb-max": maxW, ...style }}
      {...pointer}
    >
      <span className="ts-cb__grid">
        <span className="ts-cb__slot">{control}</span>
        <span className="ts-cb__text">
          {text && <span id={labelId} className="ts-cb__label">{text}</span>}
          {description && <span id={descId} className="ts-cb__desc">{description}</span>}
          {shownError && <FieldMessage id={errId} error={shownError} />}
        </span>
      </span>
    </label></>
  );
}

/**
 * Checkbox — a choice that applies when the form is saved (accept the terms, pick filters, select rows).
 * For a setting that takes effect the moment it flips, use Switch.
 * Signature: one mark, three shapes. The box fills from its centre on a spring and a single stroked path draws a
 * tick a beat later with a small overshoot; to indeterminate its three points travel to the dash; unchecking
 * retracts the tick faster than it drew, then the fill lets go. The box squashes under the pointer.
 * A real <input type="checkbox"> carries focus, Space, the form value, `required` and the role; the drawn box is
 * aria-hidden. The ref goes to that input (focus(), ref.current.checked).
 * With `demo` and no content of its own it shows a CheckboxGroup with a select-all parent (gallery only).
 */
export const Checkbox = forwardRef(function Checkbox({
  label = "",
  description = "",
  checked,
  defaultChecked = false,
  indeterminate = false,
  size = "md",
  showRow = true,
  bordered = false,
  controlPlacement = "start",
  disabled = false,
  readOnly = false,
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
  ...rest
}, ref) {
  if (demo && !label && !description) {
    return <CheckboxGroup ref={ref} demo size={size} bordered={bordered} controlPlacement={controlPlacement} disabled={disabled}
      maxWidth={maxWidth} error={error} forceState={forceState} className={className} style={style} />;
  }
  return (
    <CheckRow
      label={label} description={description} checked={checked} defaultChecked={defaultChecked} indeterminate={indeterminate}
      onChange={onChange} name={name} value={value} id={id} required={required} disabled={disabled} readOnly={readOnly}
      size={size} bordered={bordered} maxWidth={maxWidth} showRow={showRow} controlPlacement={controlPlacement} error={error}
      forceState={forceState} className={className} style={style} rest={rest} inputRef={ref}
    />
  );
});

const EMPTY = [];

/**
 * CheckboxGroup — a labelled set of checkboxes in a <fieldset> (legend = `label`). Each box submits `name=value`.
 * `selectAll` adds a parent box that is checked when every enabled option is, indeterminate when some are, and
 * checks all (or clears all) when clicked. `min` / `max` limit the count; at `max` the unchecked boxes go inert
 * and say why through aria-describedby. The ref goes to the <fieldset>.
 */
export const CheckboxGroup = forwardRef(function CheckboxGroup({
  options,
  value,
  defaultValue,
  onChange,
  label = "",
  description = "",
  selectAll = "",
  orientation = "vertical",
  size = "md",
  bordered = false,
  controlPlacement = "start",
  disabled = false,
  readOnly = false,
  required = false,
  min = 0,
  max = 0,
  name,
  id,
  error,
  messages,
  maxWidth = 400,
  demo = false,
  forceState,
  className,
  style,
  ...rest
}, ref) {
  const sheetTag = useCheckboxStyles();
  const uid = useId();
  const groupName = name || uid + "n";
  const useDemo = demo && !options;
  const list = options ?? (useDemo ? DEMO_GROUP.options : EMPTY);
  const legend = label || (useDemo ? DEMO_GROUP.label : "");
  const desc = description || (useDemo && !label ? DEMO_GROUP.description : "");
  const parentLabel = selectAll || (useDemo ? DEMO_GROUP.selectAll : "");
  const initial = defaultValue ?? (useDemo ? DEMO_GROUP.defaultValue : EMPTY);
  const msgs = { ...DEFAULT_MESSAGES, ...messages };
  const [inner, setInner] = useState(() => [...initial]);
  const selArr = value !== undefined ? value ?? EMPTY : inner;
  const sel = new Set(selArr);
  const isDisabled = disabled || forceState === "disabled";
  const shownError = error || (forceState === "error" ? msgs.error : "");
  const enabled = list.filter((o) => !o.disabled && !isDisabled);
  const need = Math.max(required ? 1 : 0, min || 0);
  const atMax = max > 0 && sel.size >= max;
  const inputs = useRef({});
  const root = useRef(null);

  const ordered = (set) => [...list.filter((o) => set.has(o.value)).map((o) => o.value), ...[...set].filter((v) => !list.some((o) => o.value === v))];
  const emit = (set, info, e) => {
    const next = ordered(set);
    if (value === undefined) setInner(next);
    onChange?.(next, info, e);
  };
  const toggle = (o, checked, e) => {
    const set = new Set(sel);
    if (checked) set.add(o.value); else set.delete(o.value);
    emit(set, { value: o.value, checked, option: o }, e);
  };
  const onCount = enabled.filter((o) => sel.has(o.value)).length;
  const allOn = enabled.length > 0 && onCount === enabled.length;
  const someOn = onCount > 0 && !allOn;
  const toggleAll = (_, e) => {
    const set = new Set(sel);
    if (allOn) enabled.forEach((o) => set.delete(o.value));
    else {
      let room = max > 0 ? max - sel.size : Infinity;
      for (const o of enabled) { if (!set.has(o.value) && room > 0) { set.add(o.value); room--; } }
    }
    emit(set, { value: null, checked: !allOn, option: null, all: true }, e);
  };

  // form reset: back to defaultValue
  const live = useRef({});
  live.current = { initial, controlled: value !== undefined, sel: selArr, onChange };
  useEffect(() => {
    const form = root.current?.form;
    if (!form) return;
    const h = () => {
      const l = live.current;
      if (!l.controlled) setInner([...l.initial]);
      const same = l.sel.length === l.initial.length && l.sel.every((v) => l.initial.includes(v));
      if (!same) l.onChange?.([...l.initial], { reset: true }, null);
    };
    form.addEventListener("reset", h);
    return () => form.removeEventListener("reset", h);
  }, []);
  // at least `need` boxes: the browser's own message, reported on the first enabled box
  const first = enabled[0]?.value;
  useEffect(() => {
    for (const [v, el] of Object.entries(inputs.current)) {
      if (!el) continue;
      const msg = need > 0 && sel.size < need && String(first) === v ? (need === 1 && required && !min ? msgs.required : msgs.min(need)) : "";
      el.setCustomValidity(msg);
    }
  });

  const setRef = useCallback((el) => {
    if (el && !Object.prototype.hasOwnProperty.call(el, "focus")) {
      el.focus = (opts) => { const t = el.querySelector("input:not(:disabled)"); if (t) t.focus(opts); else HTMLElement.prototype.focus.call(el, opts); };
    }
    root.current = el;
    if (typeof ref === "function") ref(el);
    else if (ref) ref.current = el;
  }, [ref]);

  if (!list.length) return null;
  const legendId = uid + "lg";
  const descId = uid + "ds";
  const errId = uid + "er";
  const maxId = uid + "mx";
  const maxW = !maxWidth ? "none" : typeof maxWidth === "number" ? maxWidth + "px" : maxWidth;
  const firstEnabled = enabled[0]?.value;
  const boxVar = { sm: 16, md: 18, lg: 22 }[size] ?? 18;

  const row = (o) => {
    const blocked = atMax && !sel.has(o.value) && !o.disabled && !isDisabled;
    return (
      <CheckRow
        key={o.value}
        label={o.label} description={o.description} checked={sel.has(o.value)} onChange={(c, e) => toggle(o, c, e)} owned
        name={groupName} value={String(o.value)} disabled={isDisabled || !!o.disabled} readOnly={readOnly} blocked={blocked} blockedId={maxId}
        size={size} bordered={false} inCard={bordered} maxWidth={0} showRow controlPlacement={controlPlacement}
        forceState={o.value === firstEnabled && forceState !== "disabled" && forceState !== "error" ? forceState : undefined}
        invalid={!!shownError} rest={{}} inputRef={(el) => { inputs.current[o.value] = el; }}
      />
    );
  };
  const kids = list.map(row);

  return (
    <>{sheetTag}<fieldset
      ref={setRef}
      id={id}
      {...rest}
      className={"ts-cbg" + (orientation === "horizontal" ? " is-horizontal" : "") + (bordered ? " is-bordered" : "") + (shownError ? " is-invalid" : "") + (className ? " " + className : "")}
      style={{ "--cb-max": maxW, "--cbg-box": boxVar + "px", ...style }}
      disabled={isDisabled}
      aria-describedby={[desc ? descId : null, shownError ? errId : null, rest["aria-describedby"]].filter(Boolean).join(" ") || undefined}
    >
      {legend && <legend id={legendId} className="ts-cbg__legend">{legend}{need > 0 && <span className="req" aria-hidden>*</span>}</legend>}
      {desc && <p id={descId} className="ts-cbg__desc">{desc}</p>}
      <div className={"ts-cbg__list" + (parentLabel ? "" : " is-flat")}>
        {parentLabel ? (
          <>
            <CheckRow
              label={parentLabel} checked={allOn} indeterminate={someOn} onChange={toggleAll} owned
              disabled={isDisabled || !enabled.length} readOnly={readOnly} size={size} bordered={false} inCard={bordered} maxWidth={0} showRow
              controlPlacement={controlPlacement} rest={{ "aria-controls": undefined }} invalid={!!shownError}
            />
            <div className="ts-cbg__kids" role="group" aria-label={typeof parentLabel === "string" ? parentLabel : undefined}>{kids}</div>
          </>
        ) : kids}
      </div>
      {max > 0 && atMax && <div className="ts-cbg__msg"><FieldMessage id={maxId} hint={msgs.max(max)} /></div>}
      {max > 0 && !atMax && <span id={maxId} hidden />}
      {shownError && <div className="ts-cbg__msg"><FieldMessage id={errId} error={shownError} /></div>}
    </fieldset></>
  );
});
