"use client";
import { forwardRef, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, useAnimationControls } from "motion/react";
import { registerStyles, useStyles, useIsoLayoutEffect, useReducedMotion } from "../_shared/theme.jsx";
import { useFieldStyles, useLabelStyles, useFieldIds, useShake, useRevealErrors, FieldLabel, FieldMessage } from "../_shared/field.jsx";
import { Icon } from "../_shared/icons.jsx";

const CSS = `
.ts-field.ts-ta .ts-box.ts-ta__box{display:block;padding:0;min-height:0;cursor:text}
.ts-ta .ts-ta__input,.ts-ta__mirror{box-sizing:border-box;display:block;width:100%;margin:0;padding:13px 14px;font-family:var(--ts-font);font-size:15px;line-height:22px;
  white-space:pre-wrap;overflow-wrap:break-word;word-break:break-word;letter-spacing:normal}
.ts-ta .ts-ta__input{resize:none;overflow-y:hidden;border-radius:inherit;color:var(--ts-ink);caret-color:var(--ts-focus)}
.ts-ta .ts-ta__input.is-scroll{overflow-y:auto}
.ts-ta.is-resize .ts-ta__input{resize:vertical;overflow-y:auto}
.ts-field.ts-ta.is-label-float .ts-ta__input,.ts-ta.is-label-float .ts-ta__mirror{padding-top:25px}
.ts-ta.is-ok .ts-ta__input,.ts-ta.is-ok .ts-ta__mirror{padding-right:40px}
.ts-ta .ts-ta__input[readonly]{cursor:default}
.ts-ta__mirror{position:absolute;left:0;top:0;visibility:hidden;pointer-events:none;height:auto;overflow:hidden}
.ts-ta__ok{position:absolute;right:12px;top:var(--ta-ok-top,14px);display:grid;color:var(--ts-success)}
.ts-ta__row{display:flex;gap:8px}
.ts-ta__count{font-family:var(--ts-font-mono);font-size:11px;color:var(--ts-ink2);margin-left:auto;font-variant-numeric:tabular-nums;white-space:nowrap;line-height:18px}
.ts-ta__count.is-over{color:var(--ts-danger)}
@media (max-width:640px),(pointer:coarse){.ts-ta .ts-ta__input,.ts-ta__mirror{font-size:16px;line-height:24px}}
`;
registerStyles("ts-textarea", CSS);

/** Neutral error copy. Override any of these through the `messages` prop; `tooLong` may be a function of the limit. */
export const DEFAULT_MESSAGES = {
  required: "This field is required",
  tooLong: (max) => `Keep it under ${max} characters`,
  invalid: "Check this field",
  count: (n, max) => `${n} of ${max} characters`,
};

const RULES = {
  none: () => null,
  required: (v, m) => (v.trim() ? null : m.required),
};

const DEMO = { label: "Message", hint: "Your draft is kept if you close this.", placeholder: "Say what you have in mind" };

const setRef = (ref, el) => { if (typeof ref === "function") ref(el); else if (ref) ref.current = el; };
const num = (s) => parseFloat(s) || 0;

/**
 * Textarea — multi-line text in the field family: the same label (above the box, or floating inside it with
 * labelPlacement="float"), focus ring, hint / error / success line, shake on error and n/max counter as Text Field.
 * The box grows with a spring as lines are added, from `rows` (or `minRows`) up to `maxRows`, then scrolls;
 * instant under reduced motion. `resize="vertical"` gives a manual handle instead of auto-grow.
 * Validation runs on blur, then live once an error is showing; `error` shows a message you already have.
 * The ref reaches the <textarea>; unknown props (aria-*, data-*, onKeyDown, spellCheck…) go to it too.
 */
export const Textarea = forwardRef(function Textarea({
  label = "",
  labelPlacement = "above",
  hint = "",
  placeholder,
  value: valueProp,
  defaultValue = "",
  onChange,
  onBlur,
  onFocus,
  rows = 3,
  minRows,
  maxRows = 8,
  autoGrow = true,
  resize = "none",
  maxLength = 0,
  showCount = true,
  validate = "none",
  messages,
  error: errorProp,
  successText = "",
  showSuccess = true,
  revealErrors = 0,
  required = false,
  disabled = false,
  readOnly = false,
  id,
  name,
  autoComplete,
  autoFocus = false,
  maxWidth = 380,
  demo = false,
  className,
  style,
  forceState,
  ...rest
}, ref) {
  const sheetTag = useFieldStyles();
  const sheetTag2 = useLabelStyles();
  const sheetTag3 = useStyles("ts-textarea", CSS);
  const reduce = useReducedMotion();
  const ids = useFieldIds();
  const inputId = id || ids.input;
  const shake = useShake();
  const controls = useAnimationControls();
  const inputRef = useRef(null);
  const mirrorRef = useRef(null);
  const boxRef = useRef(null);
  // controlled when `value` is passed (pair it with onChange); otherwise the field keeps its own from defaultValue
  const [inner, setInner] = useState(defaultValue);
  const controlled = valueProp !== undefined;
  const value = controlled ? String(valueProp ?? "") : inner;
  const setValue = (v) => { if (!controlled) setInner(v); onChange?.(v); };
  const [touched, setTouched] = useState(false);
  const [focused, setFocused] = useState(false);

  const shownLabel = label || (demo ? DEMO.label : "");
  const shownHint = hint || (demo ? DEMO.hint : "");
  const shownPlaceholder = placeholder ?? (demo ? DEMO.placeholder : undefined);
  const msg = { ...DEFAULT_MESSAGES, ...messages };
  const ruleKey = typeof validate === "function" ? null : validate === "none" && required ? "required" : validate;
  const check = typeof validate === "function" ? validate : RULES[ruleKey] ?? RULES.none;
  const rule = (v) => check(v, msg) || null;
  const over = maxLength > 0 && value.length > maxLength;
  const tooLong = typeof msg.tooLong === "function" ? msg.tooLong(maxLength) : msg.tooLong;
  let error = errorProp || (touched ? rule(value) || (over ? tooLong : null) : null);
  let valid = showSuccess && touched && !error && ruleKey !== "none" && value.trim().length > 0;
  if (forceState === "error") { error = error || msg[ruleKey] || msg.invalid; valid = false; }
  if (forceState === "success") { error = null; valid = true; }
  const isDisabled = disabled || forceState === "disabled";
  const hasLabel = shownLabel !== "" && shownLabel != null;
  const float = labelPlacement === "float";
  const up = !hasLabel || focused || value.length > 0 || ["focus", "error", "success"].includes(forceState);
  const box = ["hover", "focus"].includes(forceState) ? forceState : undefined;
  const counted = maxLength > 0 && showCount;
  const success = successText;
  const hasMsgRow = !!(shownHint || error || (valid && success) || counted || ruleKey !== "none" || over);
  const manual = resize === "vertical";

  // height: measured from a hidden copy of the text with the same width, font and padding, clamped to the row range
  const min = Math.max(1, minRows ?? rows);
  const max = maxRows > 0 ? Math.max(min, maxRows) : 0;
  const [size, setSize] = useState(null); // { h, scroll, minH }
  const measure = () => {
    const m = mirrorRef.current, el = inputRef.current;
    if (!m || !el) return;
    const cs = getComputedStyle(m);
    const line = num(cs.lineHeight) || 22;
    const pad = num(cs.paddingTop) + num(cs.paddingBottom);
    const minH = min * line + pad;
    const maxH = max ? max * line + pad : Infinity;
    const content = m.offsetHeight;
    const h = Math.round(Math.min(maxH, Math.max(minH, content)));
    setSize((s) => (s && s.h === h && s.scroll === content > maxH && s.minH === minH ? s : { h, scroll: content > maxH, minH }));
  };
  useIsoLayoutEffect(measure, [value, min, max, float, shownPlaceholder, valid]);
  useEffect(() => {
    const el = boxRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    let w = el.clientWidth;
    const ro = new ResizeObserver(() => { if (el.clientWidth !== w) { w = el.clientWidth; measure(); } });
    ro.observe(el);
    return () => ro.disconnect();
  });

  // a form bumps revealErrors on every submit: mark the field touched and shake if anything is wrong
  useRevealErrors(revealErrors, () => {
    setTouched(true);
    if ((errorProp || rule(value) || over) && shake.x) controls.start(shake);
  });
  // a new error from the caller shakes the box once
  useEffect(() => { if (errorProp && shake.x) controls.start(shake); }, [errorProp]);

  // <form> reset: back to defaultValue and untouched (a controlled caller hears it through onChange)
  const resetRef = useRef();
  resetRef.current = () => { setTouched(false); if (value !== defaultValue) setValue(defaultValue); };
  useEffect(() => {
    const form = inputRef.current?.form;
    if (!form) return;
    const h = () => resetRef.current();
    form.addEventListener("reset", h);
    return () => form.removeEventListener("reset", h);
  }, []);   // once: a listener re-added mid-dispatch (another field's reset re-rendering the page) never runs

  const blur = (e) => {
    setFocused(false);
    setTouched(true);
    if ((rule(value) || over) && shake.x) controls.start(shake);
    onBlur?.(e);
  };

  // the counter is read with the description when the field takes focus, not on every keystroke
  const describedBy = [hasMsgRow ? ids.msg : null, counted ? ids.msg + "n" : null, rest["aria-describedby"]].filter(Boolean).join(" ") || undefined;
  const grow = autoGrow && !manual;
  const height = grow ? size?.h : undefined;
  // the first measure (and every change under reduced motion) lands at once; later lines grow with a spring
  const transition = reduce || !size ? { duration: 0 } : { type: "spring", stiffness: 520, damping: 38 };

  return (
    <>{sheetTag}{sheetTag2}{sheetTag3}<div
      className={"ts-field ts-ta" + (float ? " is-label-float" : " is-label-above") + (manual ? " is-resize" : "") + (valid ? " is-ok" : "") + (className ? " " + className : "")}
      style={{ maxWidth: maxWidth || undefined, "--fl-left": "14px", "--fl-top": "28px", "--fl-right": "14px", "--ta-ok-top": float ? "27px" : "15px", ...style }}
    >
      {!float && hasLabel && <FieldLabel placement="above" htmlFor={inputId} id={ids.label} required={required}>{shownLabel}</FieldLabel>}
      <motion.div
        ref={boxRef}
        className={"ts-box ts-ta__box" + (error ? " is-error" : valid ? " is-success" : "") + (isDisabled ? " is-disabled" : "")}
        data-force={box}
        animate={controls}
        onMouseDown={(e) => { if (e.target === e.currentTarget && !isDisabled) { e.preventDefault(); inputRef.current?.focus(); } }}
      >
        {float && hasLabel && <FieldLabel placement="float" htmlFor={inputId} id={ids.label} up={up} required={required}>{shownLabel}</FieldLabel>}
        <div ref={mirrorRef} className="ts-ta__mirror" aria-hidden>{(value || (up ? shownPlaceholder : "") || "") + "​"}</div>
        <motion.textarea
          {...rest}
          ref={(el) => { inputRef.current = el; setRef(ref, el); }}
          id={inputId}
          name={name}
          className={"ts-input ts-ta__input" + ((grow && size?.scroll) || !grow ? " is-scroll" : "")}
          rows={min}
          value={value}
          disabled={isDisabled}
          readOnly={readOnly}
          required={required}
          autoFocus={autoFocus}
          autoComplete={autoComplete}
          placeholder={shownPlaceholder && (!float || up) ? shownPlaceholder : undefined}
          aria-invalid={!!error || undefined}
          aria-describedby={describedBy}
          initial={false}
          animate={height ? { height } : undefined}
          transition={transition}
          style={{ ...(manual && size ? { minHeight: size.minH } : null), ...(!grow && !manual && size ? { height: size.minH } : null) }}
          onFocus={(e) => { setFocused(true); onFocus?.(e); }}
          onBlur={blur}
          onChange={(e) => setValue(e.target.value)}
        />
        <AnimatePresence>
          {valid && (
            <motion.span key="ok" className="ts-ta__ok" initial={reduce ? { opacity: 0 } : { scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ type: "spring", stiffness: 600, damping: 22 }} aria-hidden>
              <Icon name="check" size={18} stroke={2.4} />
            </motion.span>
          )}
        </AnimatePresence>
      </motion.div>
      {hasMsgRow && (
        <div className="ts-ta__row">
          <FieldMessage id={ids.msg} hint={shownHint} error={error} success={valid ? success : null} />
          {counted && <span className={"ts-ta__count" + (over ? " is-over" : "")} aria-hidden>{value.length}/{maxLength}</span>}
          {counted && <span id={ids.msg + "n"} className="ts-sr">{msg.count(value.length, maxLength)}</span>}
        </div>
      )}
    </div></>
  );
});
