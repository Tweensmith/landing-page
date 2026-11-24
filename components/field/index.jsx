"use client";
import { createContext, cloneElement, forwardRef, isValidElement, useCallback, useContext, useEffect, useId, useRef, useState } from "react";
import { motion, AnimatePresence, useAnimationControls, useMotionValue, animate } from "motion/react";
import { registerStyles, useStyles, useReducedMotion, useIsoLayoutEffect, useLocale } from "../_shared/theme.jsx";
import { useFieldStyles, useFieldIds, useShake, useRevealErrors, FieldLabel, FieldMessage } from "../_shared/field.jsx";
import { RollingNumber } from "../_shared/rolling-number.jsx";
import { Icon } from "../_shared/icons.jsx";
import { Button } from "../button/index.jsx";

// Field (ts-fld), Fieldset (ts-fset), Label (ts-fld-label), ErrorSummary (ts-errs). The label, the box, the message
// line and their classes (.ts-field, .ts-field__label, .ts-box, .ts-msg) come from _shared/field.jsx and are used as
// they are; nothing here restyles them, apart from Label's sm / lg font size, scoped to Label's own wrapper.
const CSS = `
.ts-fld{min-width:0}
.ts-fld[data-layout=row]{container-type:inline-size}
.ts-fld__head{display:flex;align-items:baseline;gap:8px;min-width:0}
.ts-fld__opt{margin-left:6px;font-weight:400;color:var(--ts-ink2)}
.ts-fld__action{margin-left:auto;display:inline-flex;align-items:baseline;gap:6px;font-size:12.5px;color:var(--ts-ink2);white-space:nowrap}
.ts-fld__ctl{position:relative;display:flex;flex-direction:column;min-width:0;transition:opacity .2s}
.ts-fld__ctl.is-dim{opacity:.5}
.ts-fld__msg{display:flex;gap:8px;min-width:0}
.ts-fld__row{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);grid-template-areas:"text ctl" ". msg";column-gap:24px;row-gap:7px;align-items:center}
.ts-fld__text{grid-area:text;display:flex;flex-direction:column;gap:4px;min-width:0}
.ts-fld__hint{font-size:12.5px;line-height:1.4;color:var(--ts-ink2)}
.ts-fld__row > .ts-fld__ctl{grid-area:ctl}
.ts-fld__row > .ts-fld__msg{grid-area:msg}
@container (max-width:440px){.ts-fld__row{grid-template-columns:minmax(0,1fr);grid-template-areas:"text" "ctl" "msg"}}

.ts-fld-label{display:inline-flex;min-width:0}
.ts-fld-label[data-size=sm] .ts-field__label{font-size:12px}
.ts-fld-label[data-size=lg] .ts-field__label{font-size:14.5px}
.ts-fld-label[data-disabled]{opacity:.5;cursor:not-allowed}

.ts-fset{box-sizing:border-box;width:100%;min-width:0;margin:0;padding:0;border:0;font-family:var(--ts-font);color:var(--ts-ink)}
.ts-fset[data-surface=card]{padding:20px;border-radius:var(--ts-radius-lg);background:var(--ts-surface);box-shadow:inset 0 0 0 1px var(--ts-line);transition:box-shadow .2s}
.ts-fset[data-surface=card].is-invalid{box-shadow:inset 0 0 0 1.5px var(--ts-danger)}
.ts-fset__legend{float:left;width:100%;box-sizing:border-box;margin:0;padding:0;font-size:15px;font-weight:620;line-height:1.35;letter-spacing:-0.01em;color:var(--ts-ink)}
.ts-fset__req{margin-left:4px;font-weight:400;color:var(--ts-ink2)}
.ts-fset__desc{clear:both;margin:0;padding-top:4px;max-width:62ch;font-size:13px;line-height:1.45;color:var(--ts-ink2)}
.ts-fset__err{clear:both;overflow:hidden}
.ts-fset__errin{padding-top:8px}
.ts-fset__wrap{clear:both;container-type:inline-size;min-width:0;transition:opacity .2s}
.ts-fset[data-head] .ts-fset__wrap{padding-top:16px}
.ts-fset__body{display:flex;flex-direction:column;gap:var(--fset-gap,16px);min-width:0}
.ts-fset[data-layout=row] .ts-fset__body{flex-direction:row;flex-wrap:wrap;align-items:flex-start}
.ts-fset[data-layout=row] .ts-fset__body > *{flex:1 1 200px;min-width:0}
.ts-fset[data-layout=grid] .ts-fset__body{display:grid;grid-template-columns:repeat(var(--fset-cols,2),minmax(0,1fr));align-items:start}
@container (max-width:520px){.ts-fset[data-layout=grid] .ts-fset__body{grid-template-columns:minmax(0,1fr)}}
.ts-fset[data-disabled] > .ts-fset__legend,.ts-fset[data-disabled] > .ts-fset__desc,.ts-fset[data-disabled] > .ts-fset__wrap{opacity:.5}
.ts-fset[data-disabled] > .ts-fset__wrap{cursor:not-allowed}

.ts-errs-fold{margin:-4px;padding:4px}
.ts-errs{position:relative;box-sizing:border-box;padding:14px 16px 10px;border-radius:var(--ts-radius-lg);font-family:var(--ts-font);color:var(--ts-ink);outline:none;
  background:color-mix(in srgb,var(--ts-danger) 8%,var(--ts-surface));box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--ts-danger) 30%,transparent);transition:box-shadow .2s}
.ts-errs:focus-visible{box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--ts-danger) 30%,transparent),0 0 0 2px var(--ts-focus)}
.ts-errs__head{display:flex;align-items:center;gap:10px;min-height:28px}
.ts-errs__icon{display:grid;place-items:center;flex:none;width:28px;height:28px;border-radius:var(--ts-radius-sm);color:var(--ts-danger);background:color-mix(in srgb,var(--ts-danger) 16%,transparent)}
.ts-errs__icon.is-clear{color:var(--ts-success);background:color-mix(in srgb,var(--ts-success) 16%,transparent)}
.ts-errs__icon{transition:color .2s,background-color .2s}
.ts-errs__title{flex:1;min-width:0;margin:0;font-size:14px;font-weight:620;line-height:1.3;letter-spacing:-0.005em;color:var(--ts-ink)}
.ts-errs__count{flex:none;display:inline-grid;place-items:center;box-sizing:border-box;min-width:24px;height:22px;padding:0 7px;border-radius:999px;
  font-family:var(--ts-font-mono);font-size:12px;font-weight:600;font-variant-numeric:tabular-nums;line-height:1;
  color:color-mix(in srgb,var(--ts-danger) 70%,var(--ts-ink));background:color-mix(in srgb,var(--ts-danger) 14%,transparent);transition:color .2s,background-color .2s}
.ts-errs__count.is-clear{color:color-mix(in srgb,var(--ts-success) 70%,var(--ts-ink));background:color-mix(in srgb,var(--ts-success) 14%,transparent)}
.ts-errs__list{list-style:none;margin:6px 0 0;padding:0}
.ts-errs__item{position:relative}
.ts-errs__item.is-done{overflow:hidden}
.ts-errs__link{all:unset;box-sizing:border-box;display:flex;align-items:flex-start;width:100%;min-height:32px;padding:5px 8px 5px 0;border-radius:var(--ts-radius-sm);
  font-family:var(--ts-font);font-size:13.5px;line-height:1.45;color:var(--ts-ink);cursor:pointer;-webkit-tap-highlight-color:transparent;transition:background-color .15s}
.ts-errs__link:hover{background:color-mix(in srgb,var(--ts-danger) 8%,transparent)}
.ts-errs__link:focus-visible{box-shadow:inset 0 0 0 2px var(--ts-focus)}
.ts-errs__link.is-static,.ts-errs__item.is-done .ts-errs__link{cursor:default;background:none}
.ts-errs__mark{position:relative;flex:none;display:grid;place-items:center;width:28px;margin-right:10px;height:1.45em}
.ts-errs__dot{width:6px;height:6px;border-radius:50%;background:var(--ts-danger);transition:transform .2s cubic-bezier(.2,.8,.2,1),opacity .2s}
.ts-errs__tick{position:absolute;left:50%;top:50%;width:16px;height:16px;margin:-8px 0 0 -8px;color:var(--ts-success)}
.ts-errs__tick path{stroke-dasharray:1;stroke-dashoffset:1;transition:stroke-dashoffset .3s cubic-bezier(.2,.8,.2,1) .08s}
.ts-errs__msg{min-width:0;overflow-wrap:anywhere;text-decoration:underline;text-decoration-thickness:1px;text-underline-offset:3px;
  text-decoration-color:color-mix(in srgb,var(--ts-danger) 55%,transparent);
  background-image:linear-gradient(currentColor,currentColor);background-repeat:no-repeat;background-position:0 58%;background-size:0% 1.5px;
  -webkit-box-decoration-break:clone;box-decoration-break:clone;transition:background-size .3s cubic-bezier(.2,.8,.2,1),color .2s,text-decoration-color .2s}
.ts-errs__link:hover .ts-errs__msg{text-decoration-color:currentColor}
.ts-errs__link.is-static .ts-errs__msg{text-decoration:none}
.ts-errs__item.is-done .ts-errs__msg{background-size:100% 1.5px;color:var(--ts-ink2);text-decoration-color:transparent}
.ts-errs__item.is-done .ts-errs__dot{transform:scale(0);opacity:0}
.ts-errs__item.is-done .ts-errs__tick path{stroke-dashoffset:0}
.ts-errs-ring{position:fixed;left:0;top:0;box-sizing:border-box;border:2px solid var(--ring,currentColor);pointer-events:none;z-index:2147483000;opacity:0}
@media (prefers-reduced-motion:reduce){
  .ts-fld__ctl,.ts-fset__wrap,.ts-errs__dot,.ts-errs__msg,.ts-errs__tick path{transition:none}
}
@media (max-width:640px),(pointer:coarse){
  .ts-errs__link{min-height:44px;padding-top:11px;padding-bottom:11px;font-size:14px}
  .ts-errs{padding:14px 12px 8px 14px}
}

.ts-fld-demo{display:flex;flex-direction:column;gap:20px;width:100%;max-width:520px;margin:0 auto;font-family:var(--ts-font)}
.ts-fld-demo__box{box-sizing:border-box;min-height:48px;cursor:text}
.ts-fld-demo .ts-input{align-self:stretch}
.ts-fld-demo__prefix{flex:none;margin-right:-8px;font-size:15px;color:var(--ts-ink2);user-select:none}
.ts-fld-demo__select{all:unset;position:absolute;inset:0;display:block;box-sizing:border-box;width:100%;padding:0 40px 0 14px;border-radius:inherit;font-family:var(--ts-font);font-size:15px;line-height:48px;white-space:nowrap;text-overflow:ellipsis;color:var(--ts-ink);cursor:pointer;-webkit-appearance:none;appearance:none}
[data-ts-mode=dark] .ts-fld-demo__select{color-scheme:dark}
[data-ts-mode=light] .ts-fld-demo__select{color-scheme:light}
.ts-fld-demo__select:focus-visible{outline:none}
.ts-fld-demo__chev{position:absolute;right:14px;top:50%;margin-top:-8px;color:var(--ts-ink2);pointer-events:none}
.ts-fld-demo__count{font-family:var(--ts-font-mono);font-size:11px;font-variant-numeric:tabular-nums;color:var(--ts-ink2)}
.ts-fld-demo__count.is-over{color:var(--ts-danger)}
.ts-fld-demo__foot{display:flex;justify-content:flex-end}
@media (max-width:640px),(pointer:coarse){
  .ts-fld-demo__box{min-height:52px}
  .ts-fld-demo .ts-input,.ts-fld-demo__select,.ts-fld-demo__prefix{font-size:16px}
  .ts-fld-demo__select{line-height:52px}
}
`;
registerStyles("ts-fld", CSS);

// What a Field hands its control, and what a Fieldset hands everything inside it.
const FieldCtx = createContext(null);
const FieldsetCtx = createContext(null);

// elements a <label for> reaches natively, and those that take the `disabled` / `readOnly` attributes
const DISABLEABLE = new Set(["input", "select", "textarea", "button", "fieldset", "optgroup", "option"]);
const READONLY = new Set(["input", "textarea"]);
const FOCUSABLE = 'input:not([type=hidden]):not(:disabled),select:not(:disabled),textarea:not(:disabled),button:not(:disabled),a[href],[contenteditable]:not([contenteditable=false]),[tabindex]:not([tabindex="-1"])';

const setRef = (ref, el) => { if (typeof ref === "function") ref(el); else if (ref) ref.current = el; };
const has = (v) => v !== "" && v !== null && v !== undefined && v !== false;

/**
 * The attributes a Field gives its control, for a custom control anywhere inside one:
 * { id, "aria-labelledby", "aria-describedby", "aria-invalid", "aria-required", disabled, readOnly }.
 * Inside a Fieldset but no Field it still says whether the group is disabled.
 */
export function useField() {
  const field = useContext(FieldCtx);
  const group = useContext(FieldsetCtx);
  if (field) return field;
  return { id: undefined, "aria-labelledby": undefined, "aria-describedby": undefined, "aria-invalid": undefined, "aria-required": undefined, disabled: !!group?.disabled, readOnly: false };
}

// Adds the Field's attributes to a single element child without overwriting what the caller set; the caller's own
// aria-describedby is kept and extended.
function wire(el, c) {
  const p = el.props;
  const dom = typeof el.type === "string";
  const out = {};
  if (p.id === undefined) out.id = c.id;
  if (c["aria-labelledby"] && p["aria-labelledby"] === undefined && p["aria-label"] === undefined) out["aria-labelledby"] = c["aria-labelledby"];
  const describedBy = [c["aria-describedby"], p["aria-describedby"]].filter(Boolean).join(" ");
  if (describedBy) out["aria-describedby"] = describedBy;
  if (c["aria-invalid"] && p["aria-invalid"] === undefined) out["aria-invalid"] = true;
  if (c["aria-required"] && p["aria-required"] === undefined) out["aria-required"] = true;
  if (c.disabled && p.disabled === undefined) {
    if (!dom || DISABLEABLE.has(el.type)) out.disabled = true;
    else out["aria-disabled"] = true;
  }
  if (c.readOnly && p.readOnly === undefined) {
    if (!dom || READONLY.has(el.type)) out.readOnly = true;
    else out["aria-readonly"] = true;
  }
  return cloneElement(el, out);
}

/**
 * Field — the kit's label, hint, error and required mark around one control the kit does not draw itself (your own
 * input, a third-party picker, a native <select>), wired for assistive technology the way Text Field wires its own:
 * the same 13px label 7px above the control, the same message line under it, with its height reserved so the form
 * does not jump when an error comes and goes. A new error slides in and the message line shakes once; bumping
 * `revealErrors` (every submit) shakes it again for the same message.
 * `children` is a function ({ id, aria-labelledby, aria-describedby, aria-invalid, aria-required, disabled,
 * readOnly }) => node, spread onto the control; or one element, which gets those attributes added. useField() gives
 * them to a custom control anywhere inside. A click on the label focuses the control: natively for labelable
 * elements, by script for custom widgets (contenteditable, role="slider"...). The ref goes to the root element.
 */
export const Field = forwardRef(function Field({
  label = "",
  hint = "",
  error = "",
  success = "",
  required = false,
  disabled = false,
  readOnly = false,
  labelPlacement = "above",
  layout = "stack",
  optionalLabel = "",
  labelAction,
  revealErrors = 0,
  reserveMessage = true,
  maxWidth = 0,
  id,
  demo = false,
  children,
  className,
  style,
  forceState,
  ...rest
}, ref) {
  if (demo && (children === undefined || children === null)) {
    return <FieldDemo ref={ref} label={label} hint={hint} error={error} required={required} disabled={disabled} layout={layout}
      forceState={forceState} className={className} style={style} {...rest} />;
  }
  return <FieldBody ref={ref} {...{ label, hint, error, success, required, disabled, readOnly, labelPlacement, layout, optionalLabel, labelAction,
    revealErrors, reserveMessage, maxWidth, id, children, className, style, forceState }} rest={rest} />;
});

const FieldBody = forwardRef(function FieldBody({
  label, hint, error, success, required, disabled, readOnly, layout, optionalLabel, labelAction, revealErrors, reserveMessage, maxWidth,
  id, children, className, style, forceState, rest,
}, ref) {
  const sheetTag = useFieldStyles();
  const sheetTag2 = useStyles("ts-fld", CSS);
  const ids = useFieldIds();
  const group = useContext(FieldsetCtx);
  const shake = useShake();
  const controls = useAnimationControls();
  const ctlRef = useRef(null);

  const ownDisabled = disabled || forceState === "disabled";
  const isDisabled = ownDisabled || !!group?.disabled;
  const shownError = error || (forceState === "error" ? "Check this field" : "");
  const shownSuccess = shownError ? "" : success;
  const row = layout === "row";
  const fn = typeof children === "function";
  const el = !fn && isValidElement(children) ? children : null;
  // a kit field that draws its own label (Text Field, Select with `label`): do not name it twice
  const childLabelled = !!el && typeof el.type !== "string" && has(el.props.label);
  const hasLabel = has(label) && !childLabelled;
  const controlId = el?.props.id ?? id ?? ids.input;
  const hintId = ids.msg + "h";
  const msgText = shownError || shownSuccess || (!row ? hint : "");
  const describedBy = [row && has(hint) ? hintId : null, has(msgText) ? ids.msg : null].filter(Boolean).join(" ") || undefined;

  const control = {
    id: controlId,
    "aria-labelledby": hasLabel ? ids.label : undefined,
    "aria-describedby": describedBy,
    "aria-invalid": shownError ? true : undefined,
    "aria-required": required || undefined,
    disabled: isDisabled,
    readOnly,
  };

  // a new error shakes the message line once (not one the field mounted with); a resubmit shakes it again
  const lastError = useRef(shownError);
  useEffect(() => {
    if (shownError && shownError !== lastError.current && shake.x) controls.start(shake);
    lastError.current = shownError;
  }, [shownError]); // eslint-disable-line react-hooks/exhaustive-deps
  useRevealErrors(revealErrors, () => { if (shownError && shake.x) controls.start(shake); });

  // a click on the label: labelable elements (input, select, textarea, button) are focused by the browser; a custom
  // widget (contenteditable, role="slider", a div that holds an input) is focused here
  const labelClick = (e) => {
    if (!e.target.closest?.(".ts-field__label") || isDisabled) return;
    const target = document.getElementById(controlId);
    if (target && "labels" in target && target.labels) return;
    e.preventDefault();
    const scope = target ?? ctlRef.current;
    const t = scope?.matches?.(FOCUSABLE) ? scope : scope?.querySelector(FOCUSABLE);
    t?.focus();
  };

  const content = fn ? children(control) : el ? wire(el, control) : children;
  const opt = has(optionalLabel) && !required ? <span className="ts-fld__opt">{optionalLabel}</span> : null;
  const head = hasLabel || labelAction ? (
    <div className="ts-fld__head" onClick={labelClick}>
      {hasLabel && <FieldLabel placement="above" htmlFor={controlId} id={ids.label} required={required}>{label}{opt}</FieldLabel>}
      {labelAction && <span className="ts-fld__action">{labelAction}</span>}
    </div>
  ) : null;
  const msg = reserveMessage || has(msgText) ? (
    <motion.div className="ts-fld__msg" animate={controls}>
      <FieldMessage id={ids.msg} hint={row ? "" : hint} error={shownError} success={shownSuccess} />
    </motion.div>
  ) : null;
  const ctl = <div ref={ctlRef} className={"ts-fld__ctl" + (ownDisabled ? " is-dim" : "")}>{content}</div>;

  return (
    <>{sheetTag}{sheetTag2}<FieldCtx.Provider value={control}>
      <div
        ref={ref}
        className={"ts-field ts-fld" + (className ? " " + className : "")}
        data-layout={row ? "row" : "stack"}
        data-invalid={shownError ? "" : undefined}
        data-disabled={isDisabled ? "" : undefined}
        style={{ maxWidth: maxWidth || undefined, ...style }}
        {...rest}
      >
        {row ? (
          <div className="ts-fld__row">
            <div className="ts-fld__text">
              {head}
              {has(hint) && <div id={hintId} className="ts-fld__hint">{hint}</div>}
            </div>
            {ctl}
            {msg}
          </div>
        ) : (
          <>{head}{ctl}{msg}</>
        )}
      </div>
    </FieldCtx.Provider></>
  );
});

/**
 * Label — the family's field label on its own (13px, 550, the * for required), for the rare place a label sits apart
 * from a Field. `size` sm / md / lg is 12 / 13 / 14.5px (lg matches Switch and Checkbox row labels).
 * Renders through the shared FieldLabel; the ref and other props go to a wrapping span.
 */
export const Label = forwardRef(function Label({
  htmlFor,
  required = false,
  optionalLabel = "",
  disabled = false,
  size = "md",
  as = "label",
  id,
  children,
  className,
  style,
  ...rest
}, ref) {
  const sheetTag = useFieldStyles();
  const sheetTag2 = useStyles("ts-fld", CSS);
  return (
    <>{sheetTag}{sheetTag2}<span ref={ref} className={"ts-fld-label" + (className ? " " + className : "")} data-size={["sm", "md", "lg"].includes(size) ? size : "md"}
      data-disabled={disabled ? "" : undefined} style={style} {...rest}>
      <FieldLabel placement="above" as={as} htmlFor={htmlFor} id={id} required={required}>
        {children}{has(optionalLabel) && !required && <span className="ts-fld__opt">{optionalLabel}</span>}
      </FieldLabel>
    </span></>
  );
});

/**
 * Fieldset — a real <fieldset> and <legend> for a group of fields: "Delivery address", "Notifications".
 * The legend lays out like a heading (15px / 620), with an optional description and one error for the whole group
 * (announced; the space for it opens on a spring). `disabled` is the native attribute, so every native control
 * inside is disabled; Fields and useField() controls inside hear it too, and the contents dim once.
 * layout: stack (default), row (wraps), or grid with `columns` (one column below 520px of the group's own width).
 * surface: plain (default) or card. The ref goes to the <fieldset>.
 */
export const Fieldset = forwardRef(function Fieldset({
  legend = "",
  description = "",
  error = "",
  disabled = false,
  required = false,
  layout = "stack",
  columns = 2,
  gap = 16,
  surface = "plain",
  revealErrors = 0,
  id,
  children,
  className,
  style,
  ...rest
}, ref) {
  const sheetTag = useFieldStyles();
  const sheetTag2 = useStyles("ts-fld", CSS);
  const reduce = useReducedMotion();
  const uid = useId();
  const base = id ?? uid;
  const legendId = base + "-legend";
  const descId = base + "-desc";
  const errId = base + "-error";
  const parent = useContext(FieldsetCtx);
  const isDisabled = disabled || !!parent?.disabled;
  const shake = useShake();
  const controls = useAnimationControls();
  const lastError = useRef(error);
  useEffect(() => {
    if (error && error !== lastError.current && shake.x) controls.start(shake);
    lastError.current = error;
  }, [error]); // eslint-disable-line react-hooks/exhaustive-deps
  useRevealErrors(revealErrors, () => { if (error && shake.x) controls.start(shake); });

  const { "aria-describedby": ariaDescribedBy, ...attrs } = rest;
  const describedBy = [has(description) ? descId : null, error ? errId : null, ariaDescribedBy].filter(Boolean).join(" ") || undefined;
  const cols = Math.max(1, Math.round(Number(columns) || 1));
  const lay = ["stack", "row", "grid"].includes(layout) ? layout : "stack";

  return (
    <>{sheetTag}{sheetTag2}<FieldsetCtx.Provider value={{ disabled: isDisabled, legendId: has(legend) ? legendId : undefined }}>
      <fieldset
        ref={ref}
        id={id}
        className={"ts-fset" + (error ? " is-invalid" : "") + (className ? " " + className : "")}
        data-surface={surface === "card" ? "card" : "plain"}
        data-layout={lay}
        data-head={has(legend) || has(description) || error ? "" : undefined}
        data-disabled={disabled ? "" : undefined}
        disabled={disabled || undefined}
        aria-describedby={describedBy}
        style={style}
        {...attrs}
      >
        {has(legend) && <legend id={legendId} className="ts-fset__legend">{legend}{required && <span className="ts-fset__req" aria-hidden>*</span>}</legend>}
        {has(description) && <p id={descId} className="ts-fset__desc">{description}</p>}
        {/* the live region stays mounted, so a new group error is announced; its space opens and folds on a spring */}
        <motion.div className="ts-fset__err" initial={false} animate={{ height: error ? "auto" : 0, opacity: error ? 1 : 0 }}
          transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 420, damping: 38 }}>
          <motion.div className="ts-fset__errin" animate={controls}>
            <FieldMessage id={errId} error={error} />
          </motion.div>
        </motion.div>
        <div className="ts-fset__wrap">
          <div className="ts-fset__body" style={{ "--fset-gap": (Number(gap) || 0) + "px", "--fset-cols": cols }}>{children}</div>
        </div>
      </fieldset>
    </FieldsetCtx.Provider></>
  );
});

// ── ErrorSummary ─────────────────────────────────────────────────────────────────────────────────────────────────
const HOLD = 700;   // ms a fixed entry stays struck through before it folds away
const SPRING_OPEN = { type: "spring", stiffness: 380, damping: 36 };
const SPRING_FOLD = { type: "spring", stiffness: 420, damping: 42 };

const keyOf = (e, i) => String(e.id ?? e.field ?? e.name ?? (typeof e.message === "string" ? e.message : "#" + i));

// The new list, with entries that just went missing kept (struck through) where they were.
function merge(prev, list, keep) {
  const out = list.map((e, i) => ({ key: keyOf(e, i), e, done: false }));
  if (!keep) return out;
  const present = new Set(out.map((o) => o.key));
  prev.forEach((p, idx) => {
    if (present.has(p.key)) return;
    let at = 0;
    for (let j = idx - 1; j >= 0; j--) {
      const k = out.findIndex((o) => o.key === prev[j].key);
      if (k >= 0) { at = k + 1; break; }
    }
    out.splice(at, 0, { ...p, done: true });
  });
  return out;
}

// the row gap a flex-column parent puts beside this element (0 for any other layout)
function parentRowGap(el) {
  const p = el?.parentElement;
  if (!p) return 0;
  const cs = getComputedStyle(p);
  if (!/flex/.test(cs.display) || !cs.flexDirection.startsWith("column")) return 0;
  return parseFloat(cs.rowGap) || 0;
}

function scrollParent(el) {
  for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
    const oy = getComputedStyle(p).overflowY;
    if ((oy === "auto" || oy === "scroll") && p.scrollHeight > p.clientHeight) return p;
  }
  return null;
}

// Scrolls `el` so its top sits `margin` px below the top of its scroller (a sticky header's height), unless it is
// already fully in view below that line. The glide is our own, time-based, and re-reads where `el` is every frame:
// the page above it may still be moving (a summary opening, an entry folding), which would cancel a native smooth
// scroll half way.
let gliding = 0;
function reveal(el, margin, smooth) {
  const sc = scrollParent(el);
  const top = () => (sc ? sc.getBoundingClientRect().top : 0);
  const bottom = () => (sc ? sc.getBoundingClientRect().bottom : window.innerHeight);
  const get = () => (sc ? sc.scrollTop : window.scrollY);
  const set = (y) => (sc ? (sc.scrollTop = y) : window.scrollTo(0, y));
  const goal = () => get() + el.getBoundingClientRect().top - top() - margin;
  const r = el.getBoundingClientRect();
  if (r.top >= top() + margin && r.bottom <= bottom() - 8) return;
  cancelAnimationFrame(gliding);
  if (!smooth) { set(goal()); return; }
  const from = get(), t0 = performance.now(), RUN = 420;
  const step = (now) => {
    const p = Math.min(1, (now - t0) / RUN);
    const e = 1 - Math.pow(1 - p, 3);
    set(from + (goal() - from) * e);
    if (p < 1) gliding = requestAnimationFrame(step);
  };
  gliding = requestAnimationFrame(step);
}

// The field's visible box: the kit's .ts-box when there is one, else the element, or its first ancestor big enough
// to see (a visually hidden native input).
function visibleBox(el) {
  let box = el.closest?.(".ts-box") ?? el;
  while (box && box.parentElement && (box.offsetWidth < 8 || box.offsetHeight < 8)) box = box.parentElement;
  return box;
}

// Points at a field: a ring in the danger tone on a fixed overlay over the field's box. It waits for the scroll to
// settle (the box holds still for a few frames), then grows out from the box's edge and fades, reading the box every
// frame so it tracks the field. Time-based, so it looks the same at any refresh rate. Under reduced motion it is a
// still ring for a moment. The field's own styles are never touched. Returns a function that removes it.
function pointAt(box, { color, reduce }) {
  const ring = document.createElement("div");
  ring.className = "ts-errs-ring";
  ring.setAttribute("aria-hidden", "true");
  if (color) ring.style.setProperty("--ring", color);
  const radius = parseFloat(getComputedStyle(box).borderTopLeftRadius) || 0;
  document.body.appendChild(ring);
  const t0 = performance.now();
  let last = null, still = 0, start = 0, raf = 0;
  const RUN = reduce ? 650 : 760;
  const place = (grow, opacity) => {
    const r = box.getBoundingClientRect();
    const g = 2 + grow;
    ring.style.transform = `translate(${r.left - g}px,${r.top - g}px)`;
    ring.style.width = r.width + 2 * g + "px";
    ring.style.height = r.height + 2 * g + "px";
    ring.style.borderRadius = radius + g + "px";
    ring.style.opacity = String(opacity);
  };
  const tick = (now) => {
    if (!box.isConnected) return stop();
    if (!start) {
      const r = box.getBoundingClientRect();
      still = last && Math.abs(r.top - last.top) < 0.5 && Math.abs(r.left - last.left) < 0.5 ? still + 1 : 0;
      last = r;
      if (still >= 3 || now - t0 > 1000) start = now;
    }
    if (start) {
      const p = Math.min(1, (now - start) / RUN);
      if (reduce) place(0, 1);
      else {
        const out = 1 - Math.pow(1 - p, 3);
        const fade = p < 0.14 ? p / 0.14 : 1 - Math.pow((p - 0.14) / 0.86, 1.6);
        place(10 * out, Math.max(0, fade));
      }
      if (p >= 1) return stop();
    }
    raf = requestAnimationFrame(tick);
  };
  const stop = () => { cancelAnimationFrame(raf); ring.remove(); };
  raf = requestAnimationFrame(tick);
  return stop;
}

/**
 * ErrorSummary — the list of problems at the top of a form after a failed submit. Each entry is a link: it scrolls the
 * field into view (below `scrollMargin`), focuses it and points at it with a ring that grows from the field's edge
 * and fades. Signature: the list gets shorter. A fixed entry is struck through, ticks and folds away while the
 * entries below close the gap and the count rolls down; when the last one goes the block folds shut. Errors arrive
 * as one block that grows open, entries settling in on a short stagger. Entries are keyed by id / field / name, so a
 * changed message updates in place. With no errors it renders nothing. role="alert", tabIndex -1: it takes focus
 * when errors arrive (focusOnShow) and again on a resubmit (revealErrors), and it shakes on the resubmit.
 * Keep it mounted and pass an empty array when there is nothing wrong; mounted with errors already present it shows
 * them at rest (no grow) and still takes focus. The ref goes to the summary box.
 */
export const ErrorSummary = forwardRef(function ErrorSummary({
  errors = [],
  title = "There is a problem",
  titleAs = "h2",
  focusOnShow = true,
  showCount = true,
  scrollMargin = 16,
  revealErrors = 0,
  onNavigate,
  id,
  className,
  style,
  ...rest
}, ref) {
  const sheetTag = useStyles("ts-fld", CSS);
  const reduce = useReducedMotion();
  const locale = useLocale();
  const uid = useId();
  const titleId = (id ?? uid) + "-title";
  const shake = useShake();
  const controls = useAnimationControls();

  const list = (Array.isArray(errors) ? errors : []).filter((e) => e && has(e.message));
  const sig = list.map((e, i) => keyOf(e, i) + "\u0001" + (typeof e.message === "string" ? e.message : "")).join("\u0002");
  const [items, setItems] = useState(() => merge([], list, false));
  const [seen, setSeen] = useState(sig);
  if (seen !== sig) { setSeen(sig); setItems((prev) => merge(prev, list, !reduce)); }
  const latest = new Map(list.map((e, i) => [keyOf(e, i), e]));
  const live = items.filter((i) => !i.done).length;
  const lastCount = useRef(live || 1);
  if (live) lastCount.current = live;
  const open = items.length > 0;

  const box = useRef(null);
  const fold = useRef(null);
  const ring = useRef(null);
  const returnTo = useRef(null);
  const mountedOpen = useRef(open);
  // whether the block was showing at the last commit: the render that opens it staggers its entries in
  const wasOpen = useRef(open);
  useEffect(() => { wasOpen.current = open; });
  const setBox = useCallback((el) => { box.current = el; setRef(ref, el); }, [ref]);

  // fixed entries fold away after HOLD; one that comes back before then is kept
  const timers = useRef(new Map());
  useEffect(() => {
    const t = timers.current;
    const doneKeys = new Set(items.filter((i) => i.done).map((i) => i.key));
    for (const [k, h] of t) if (!doneKeys.has(k)) { clearTimeout(h); t.delete(k); }
    for (const k of doneKeys) {
      if (t.has(k)) continue;
      t.set(k, setTimeout(() => {
        t.delete(k);
        // focus inside the leaving entry moves to the next link, or to the summary
        const li = box.current?.querySelector(`[data-key="${CSS_ESCAPE(k)}"]`);
        if (li && li.contains(document.activeElement)) {
          const next = [...box.current.querySelectorAll(".ts-errs__item:not(.is-done) a.ts-errs__link")][0];
          (next ?? box.current).focus({ preventScroll: true });
        }
        setItems((prev) => prev.filter((p) => !(p.key === k && p.done)));
      }, HOLD));
    }
  }, [items]);
  useEffect(() => () => { timers.current.forEach(clearTimeout); ring.current?.(); }, []);

  const focusBox = () => {
    const el = box.current;
    if (!el) return;
    const a = document.activeElement;
    if (a && a !== document.body && !el.contains(a)) returnTo.current = a;
    el.focus({ preventScroll: true });
    reveal(el, scrollMargin, !reduce);
  };

  // a resubmit: shake (when the block was already showing) and take focus again
  const liveBefore = useRef(0);
  useRevealErrors(revealErrors, () => {
    if (!live) return;
    if (liveBefore.current > 0 && shake.x) controls.start(shake);
    if (focusOnShow) focusBox();
  });
  // errors arrived (none → some): take focus
  useEffect(() => {
    const was = liveBefore.current;
    liveBefore.current = live;
    if (!was && live && focusOnShow) focusBox();
  }, [live > 0]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { liveBefore.current = live; });

  // the block is about to fold shut with focus inside it: hand focus back instead of losing it to <body>
  useIsoLayoutEffect(() => {
    if (open || !box.current) return;
    if (!box.current.contains(document.activeElement)) return;
    const back = returnTo.current;
    const form = box.current.closest("form");
    const target = back && back.isConnected && !back.disabled ? back : form?.querySelector(FOCUSABLE);
    target?.focus({ preventScroll: true });
  }, [open]);

  // fold a flex-column parent's row gap with the block, so the gap opens and closes with it instead of jumping
  const mb = useMotionValue(-4);
  const gapRef = useRef(0);
  useIsoLayoutEffect(() => {
    if (!open) return;
    const fresh = !mountedOpen.current;
    mountedOpen.current = false;
    const g = parentRowGap(fold.current);
    gapRef.current = g;
    if (!fresh) return;
    mb.set(-4 - g);
    if (reduce || !g) mb.set(-4); else animate(mb, -4, SPRING_OPEN);
  }, [open]);

  const go = (err) => (ev) => {
    const root = box.current;
    let el = null;
    if (err.field) el = document.getElementById(err.field);
    else if (err.name && root) {
      // the nearest form: the one around the summary, else the first one after it in the page
      const form = root.closest("form") ?? [...document.forms].find((f) => root.compareDocumentPosition(f) & Node.DOCUMENT_POSITION_FOLLOWING);
      const hit = form ? form.elements.namedItem(err.name) : document.getElementsByName(err.name)[0];
      el = hit && typeof hit.length === "number" && !hit.tagName ? hit[0] : hit;
    }
    onNavigate?.(err, el ?? null, ev);
    if (ev.defaultPrevented) return;
    ev.preventDefault();
    if (!el) return;
    const target = el.matches?.(FOCUSABLE) ? el : el.querySelector?.(FOCUSABLE) ?? el;
    reveal(target.closest(".ts-fld, .ts-field") ?? visibleBox(target), scrollMargin, !reduce);
    target.focus({ preventScroll: true });
    ring.current?.();
    const color = root ? getComputedStyle(root).getPropertyValue("--ts-danger").trim() : "";
    ring.current = pointAt(visibleBox(target), { color, reduce });
  };

  const fmt = (n) => new Intl.NumberFormat(locale).format(n);
  const n = live || lastCount.current;
  const fnTitle = typeof title === "function";
  const titleText = fnTitle ? title(n) : title;
  let titleShown = titleText;
  if (fnTitle && typeof titleText === "string") {
    const s = fmt(n);
    const at = titleText.indexOf(s);
    if (at >= 0) titleShown = <>{titleText.slice(0, at)}<RollingNumber value={n} format={fmt} stiffness={320} damping={28} />{titleText.slice(at + s.length)}</>;
  }
  const Title = titleAs || "h2";
  const stagger = open && !wasOpen.current && !reduce;
  const enter = !stagger && !reduce;

  return (
    <>{sheetTag}<AnimatePresence initial={false}>
      {open && (
        <motion.div
          key="errs"
          ref={fold}
          className="ts-errs-fold"
          initial={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={reduce ? { opacity: 0, transition: { duration: 0.12 } } : { height: 0, opacity: 0, marginBottom: -4 - gapRef.current, transition: { height: SPRING_FOLD, marginBottom: SPRING_FOLD, opacity: { duration: 0.18 } } }}
          transition={reduce ? { duration: 0.12 } : { height: SPRING_OPEN, opacity: { duration: 0.16 } }}
          style={{ overflow: "hidden", marginBottom: mb }}
        >
          <motion.div
            ref={setBox}
            id={id}
            role="alert"
            aria-atomic="false"
            aria-labelledby={titleId}
            tabIndex={-1}
            className={"ts-errs" + (className ? " " + className : "")}
            style={style}
            animate={controls}
            {...rest}
          >
            <div className="ts-errs__head">
              <span className={"ts-errs__icon" + (live ? "" : " is-clear")} aria-hidden><Icon name={live ? "alert" : "check"} size={16} stroke={2.2} /></span>
              <Title id={titleId} className="ts-errs__title">
                {fnTitle && typeof titleText === "string" ? <><span className="ts-sr">{titleText}</span><span aria-hidden>{titleShown}</span></> : titleShown}
              </Title>
              {showCount && !fnTitle && (
                <span className={"ts-errs__count" + (live ? "" : " is-clear")} aria-hidden>
                  {live ? <RollingNumber value={live} format={fmt} stiffness={320} damping={28} /> : <Icon name="check" size={13} stroke={2.6} />}
                </span>
              )}
            </div>
            <ul className="ts-errs__list">
              <AnimatePresence initial={stagger}>
                {items.map((it, i) => {
                  const e = (!it.done && latest.get(it.key)) || it.e;
                  const linked = !!(e.field || e.name);
                  const inner = (
                    <>
                      <span className="ts-errs__mark" aria-hidden>
                        <span className="ts-errs__dot" />
                        <svg className="ts-errs__tick" viewBox="0 0 24 24" fill="none"><path d="M5 12.5l4.5 4.5L19 7.5" pathLength="1" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
                      </span>
                      <span className="ts-errs__msg">{e.message}</span>
                    </>
                  );
                  return (
                    <motion.li
                      key={it.key}
                      data-key={it.key}
                      className={"ts-errs__item" + (it.done ? " is-done" : "")}
                      aria-hidden={it.done || undefined}
                      initial={stagger ? { opacity: 0, y: 6 } : enter ? { opacity: 0, height: 0 } : false}
                      animate={{ opacity: 1, y: 0, height: "auto" }}
                      exit={reduce ? { opacity: 0, transition: { duration: 0 } } : { opacity: 0, height: 0, transition: { height: SPRING_FOLD, opacity: { duration: 0.16 } } }}
                      transition={stagger ? { type: "spring", stiffness: 420, damping: 34, delay: 0.1 + i * 0.05 } : { height: SPRING_OPEN, opacity: { duration: 0.18 } }}
                    >
                      {linked ? (
                        <a className="ts-errs__link" href={"#" + (e.field ?? e.name)} onClick={it.done ? (ev) => ev.preventDefault() : go(e)} tabIndex={it.done ? -1 : undefined}>{inner}</a>
                      ) : (
                        <span className="ts-errs__link is-static">{inner}</span>
                      )}
                    </motion.li>
                  );
                })}
              </AnimatePresence>
            </ul>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence></>
  );
});

// attribute-selector escaping for entry keys (field ids may hold any character)
const CSS_ESCAPE = (s) => (globalThis.CSS?.escape ? globalThis.CSS.escape(s) : String(s).replace(/["\\]/g, "\\$&"));

// ── Sample content (demo only): an invented product's "Create a workspace" form ──────────────────────────────────
const DEMO = {
  legend: "Workspace",
  description: "Where your team's projects and files live. You can rename it later in Settings.",
  slug: { label: "Workspace address", hint: "Lowercase letters, numbers and dashes.", prefix: "fernwork.app/", max: 32 },
  region: {
    label: "Data region",
    hint: "Where files are stored. This can't be changed later.",
    options: [["", "Choose a region"], ["fra", "Frankfurt, Germany"], ["dub", "Dublin, Ireland"], ["iad", "Virginia, United States"], ["syd", "Sydney, Australia"]],
  },
  seats: { label: "Seats", hint: "Billed monthly. Add more any time." },
  submit: "Create workspace",
  title: (n) => (n === 1 ? "1 thing to fix before you continue" : `${n} things to fix before you continue`),
  taken: ["studio", "design", "team"],
};
const AT_REST = { slug: "studio", region: "fra", seats: "5" };
const EMPTY = { slug: "", region: "", seats: "" };

function check(v) {
  const e = {};
  const s = v.slug.trim();
  if (!s) e.slug = "Choose an address for the workspace";
  else if (!/^[a-z0-9-]+$/.test(s)) e.slug = "Use only lowercase letters, numbers and dashes";
  else if (s.length > DEMO.slug.max) e.slug = `Keep the address under ${DEMO.slug.max} characters`;
  else if (DEMO.taken.includes(s)) e.slug = `${s} is taken. Try ${s}-north or another name`;
  if (!v.region) e.region = "Choose where the workspace's files are stored";
  const n = Number(v.seats);
  if (!v.seats.trim()) e.seats = "Enter how many seats you need";
  else if (!Number.isInteger(n) || n < 1 || n > 500) e.seats = "Seats must be a whole number from 1 to 500";
  return e;
}

const FieldDemo = forwardRef(function FieldDemo({ label, hint, error, required, disabled, layout, forceState, className, style, ...rest }, ref) {
  const sheetTag = useFieldStyles();
  const sheetTag2 = useStyles("ts-fld", CSS);
  const base = useId();
  const slugId = base + "slug";
  const regionId = base + "region";
  const [values, setValues] = useState(forceState === "error" ? EMPTY : AT_REST);
  const [submitted, setSubmitted] = useState(true);
  const [asked, setAsked] = useState(false);   // the person has pressed submit: from then on the summary takes focus
  const [reveal, setReveal] = useState(0);
  const [done, setDone] = useState(false);
  const timer = useRef(null);
  useEffect(() => () => clearTimeout(timer.current), []);
  // the gallery's forced states: "error" shows every problem at once
  const firstForce = useRef(true);
  useEffect(() => {
    if (firstForce.current) { firstForce.current = false; return; }
    setValues(forceState === "error" ? EMPTY : AT_REST);
    setSubmitted(true);
  }, [forceState]);

  const errs = submitted ? check(values) : {};
  const summary = [
    errs.slug && { field: slugId, message: errs.slug },
    errs.region && { field: regionId, message: errs.region },
    errs.seats && { name: "seats", message: errs.seats },
  ].filter(Boolean);
  const off = disabled || forceState === "disabled";
  const set = (k) => (e) => setValues((v) => ({ ...v, [k]: e.target.value }));
  const submit = (e) => {
    e.preventDefault();
    if (off) return;
    setAsked(true);
    setSubmitted(true);
    setReveal((r) => r + 1);
    if (Object.keys(check(values)).length) return;
    setDone(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setDone(false), 1800);
  };
  const slugError = error || errs.slug;
  // a press on the box around an input (its padding, the prefix) puts the caret in the input, as Text Field does
  const focusInput = (e) => { const i = e.currentTarget.querySelector("input"); if (i && e.target !== i && !i.disabled && !off) { e.preventDefault(); i.focus(); } };
  const over = values.slug.length > DEMO.slug.max;

  return (
    <>{sheetTag}{sheetTag2}<form ref={ref} className={"ts-fld-demo" + (className ? " " + className : "")} style={style} noValidate onSubmit={submit} aria-label="Create a workspace" {...rest}>
      <ErrorSummary errors={summary} title={DEMO.title} focusOnShow={asked} revealErrors={reveal} />
      <Fieldset legend={DEMO.legend} description={DEMO.description} disabled={off}>
        <Field id={slugId} label={label || DEMO.slug.label} hint={hint || DEMO.slug.hint} error={slugError} required layout={layout} revealErrors={reveal}
          labelAction={<span className={"ts-fld-demo__count" + (over ? " is-over" : "")} aria-hidden>{values.slug.length}/{DEMO.slug.max}</span>}>
          {(p) => (
            <div className={"ts-box ts-fld-demo__box" + (slugError ? " is-error" : "")} onMouseDown={focusInput}>
              <span className="ts-fld-demo__prefix" aria-hidden>{DEMO.slug.prefix}</span>
              <input {...p} className="ts-input" name="slug" value={values.slug} onChange={set("slug")} autoComplete="off" autoCapitalize="none" spellCheck={false} />
            </div>
          )}
        </Field>
        <Field id={regionId} label={DEMO.region.label} hint={DEMO.region.hint} error={errs.region} required={required} revealErrors={reveal}>
          {(p) => (
            <div className={"ts-box ts-fld-demo__box" + (errs.region ? " is-error" : "")}>
              <select {...p} className="ts-fld-demo__select" name="region" value={values.region} onChange={set("region")}>
                {DEMO.region.options.map(([v, t]) => <option key={v} value={v} disabled={!v}>{t}</option>)}
              </select>
              <Icon name="chevronDown" size={16} className="ts-fld-demo__chev" aria-hidden />
            </div>
          )}
        </Field>
        <Field label={DEMO.seats.label} hint={DEMO.seats.hint} error={errs.seats} layout="row" revealErrors={reveal}>
          {(p) => (
            <div className={"ts-box ts-fld-demo__box" + (errs.seats ? " is-error" : "")} onMouseDown={focusInput}>
              <input {...p} className="ts-input" name="seats" type="text" inputMode="numeric" value={values.seats} onChange={set("seats")} autoComplete="off" />
            </div>
          )}
        </Field>
      </Fieldset>
      <div className="ts-fld-demo__foot">
        <Button type="submit" label={DEMO.submit} success={done} disabled={off} />
      </div>
    </form></>
  );
});
