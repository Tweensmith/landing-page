"use client";
import { forwardRef, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, useAnimationControls } from "motion/react";
import { registerStyles, useStyles, useReducedMotion } from "../_shared/theme.jsx";
import { useFieldStyles, useLabelStyles, useFieldIds, useShake, useRevealErrors, FieldLabel, FieldMessage } from "../_shared/field.jsx";
import { Icon } from "../_shared/icons.jsx";

const CSS = `
.ts-tf .ts-box{cursor:text}
.ts-tf.is-label-float .ts-box{min-height:56px;padding-top:0}
.ts-tf.is-label-float.is-nolabel .ts-input{padding-top:0}
.ts-tf .ts-input[readonly]{cursor:default}
.ts-tf__row{display:flex;gap:8px}
.ts-tf__count{font-family:var(--ts-font-mono);font-size:11px;color:var(--ts-ink2);margin-left:auto;font-variant-numeric:tabular-nums}
.ts-tf__count.is-over{color:var(--ts-danger)}
@media (max-width:640px),(pointer:coarse){.ts-tf .ts-input{font-size:16px}}
`;
registerStyles("ts-text-field", CSS);

/** Neutral error copy. Override any of these through the `messages` prop; `tooLong` may be a function of the limit. */
export const DEFAULT_MESSAGES = {
  required: "This field is required",
  emailRequired: "Enter your email address",
  email: "Enter a valid email address",
  urlRequired: "Enter a URL",
  url: "Enter a valid URL",
  tooLong: (max) => `Keep it under ${max} characters`,
  invalid: "Check this field",
  count: (n, max) => `${n} of ${max} characters`,
};

const RULES = {
  none: () => null,
  required: (v, m) => (v.trim() ? null : m.required),
  email: (v, m) => (!v.trim() ? m.emailRequired : /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) ? null : m.email),
  url: (v, m) => (!v.trim() ? m.urlRequired : /^(https?:\/\/)?[\w-]+(\.[\w-]+)+(\/\S*)?$/.test(v.trim()) ? null : m.url),
};

// sensible autocomplete tokens when the caller gives none
const AUTO = { email: "email", tel: "tel", url: "url", password: "current-password" };

const setRef = (ref, el) => { if (typeof ref === "function") ref(el); else if (ref) ref.current = el; };

/**
 * TextField — a label that floats inside the box (or sits above it with labelPlacement="above", to match the rest
 * of a form), inline validation on blur, a gentle shake on error,
 * a check when valid, optional leading icon and character counter.
 * Validation never scolds while typing: it runs on blur, then live once an error is showing.
 * Error copy comes from `messages` (neutral defaults); `validate` also takes your own (value) => message | null,
 * and `error` shows a message you already have (for example from the server).
 * The ref reaches the <input>; unknown props (aria-*, data-*, onKeyDown…) go to the <input> too.
 */
export const TextField = forwardRef(function TextField({
  label = "Email address",
  labelPlacement = "float",
  type = "email",
  hint = "",
  validate = "email",
  icon = "mail",
  maxLength = 0,
  showCount = true,
  defaultValue = "",
  successText = "",
  showSuccess = true,
  disabled = false,
  readOnly = false,
  required = false,
  revealErrors = 0,
  messages,
  value: valueProp,
  maxWidth = 380,
  error: errorProp,
  onChange,
  onBlur,
  onFocus,
  id,
  name,
  autoComplete,
  inputMode,
  autoFocus = false,
  placeholder,
  demo = false,
  className,
  style,
  forceState,
  ...rest
}, ref) {
  const sheetTag = useFieldStyles();
  const sheetTag2 = useLabelStyles();
  const sheetTag3 = useStyles("ts-text-field", CSS);
  const reduce = useReducedMotion();
  const ids = useFieldIds();
  const inputId = id || ids.input;
  const shake = useShake();
  const inputRef = useRef(null);
  // controlled when `value` is passed (pair it with onChange); otherwise the field keeps its own from defaultValue
  const [inner, setInner] = useState(defaultValue);
  const controlled = valueProp !== undefined;
  const value = controlled ? String(valueProp ?? "") : inner;
  const setValue = (v) => { if (!controlled) setInner(v); onChange?.(v); };
  const [touched, setTouched] = useState(false);
  const [focused, setFocused] = useState(false);
  const controls = useAnimationControls();

  const success = successText || (demo ? "Looks good" : "");
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
  const hasLabel = label !== "" && label != null;
  const above = labelPlacement === "above";
  const floated = !hasLabel || focused || value.length > 0 || forceState === "focus" || forceState === "error" || forceState === "success";
  const box = ["hover", "focus"].includes(forceState) ? forceState : undefined;
  const counted = maxLength > 0 && showCount;
  // reserve the message line only when something can appear in it (a hint, a rule that can fail, a counter, an error)
  const hasMsgRow = !!(hint || error || (valid && success) || counted || ruleKey !== "none" || over);

  // a form bumps revealErrors on every submit: mark the field touched and shake if anything is wrong, including an
  // `error` the caller passes (so a second submit with the same message still shakes)
  useRevealErrors(revealErrors, () => {
    setTouched(true);
    if ((errorProp || rule(value) || over) && shake.x) controls.start(shake);
  });

  // a new error from the caller shakes the box once (as Password Field does)
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
  // "above": the box is a plain div (a second <label> around the input would add to its name); a press on the
  // padding still puts the caret in the input
  const Box = above ? motion.div : motion.label;
  const boxProps = above
    ? { onMouseDown: (e) => { if (e.target === e.currentTarget && !isDisabled) { e.preventDefault(); inputRef.current?.focus(); } } }
    : { htmlFor: inputId };

  return (
    <>{sheetTag}{sheetTag2}{sheetTag3}<div
      className={"ts-field ts-tf" + (above ? " is-label-above" : " is-label-float") + (floated ? " is-float" : "") + (hasLabel ? "" : " is-nolabel") + (className ? " " + className : "")}
      style={{ maxWidth: maxWidth || undefined, "--fl-left": icon !== "none" ? "44px" : "14px", ...style }}
    >
      {above && hasLabel && <FieldLabel placement="above" htmlFor={inputId} id={ids.label} required={required}>{label}</FieldLabel>}
      <Box
        {...boxProps}
        className={"ts-box" + (error ? " is-error" : valid ? " is-success" : "") + (isDisabled ? " is-disabled" : "")}
        data-force={box}
        animate={controls}
      >
        {icon !== "none" && <Icon name={icon} size={18} />}
        {!above && hasLabel && <FieldLabel placement="float" as="span" id={ids.label} up={floated} required={required}>{label}</FieldLabel>}
        <input
          {...rest}
          ref={(el) => { inputRef.current = el; setRef(ref, el); }}
          id={inputId}
          name={name}
          className="ts-input"
          type={type}
          value={value}
          disabled={isDisabled}
          readOnly={readOnly}
          required={required}
          autoFocus={autoFocus}
          placeholder={placeholder && (above || floated) ? placeholder : undefined}
          inputMode={inputMode}
          aria-invalid={!!error || undefined}
          aria-describedby={describedBy}
          autoComplete={autoComplete ?? AUTO[type]}
          onFocus={(e) => { setFocused(true); onFocus?.(e); }}
          onBlur={blur}
          onChange={(e) => setValue(e.target.value)}
        />
        <AnimatePresence>
          {valid && (
            <motion.span key="ok" initial={reduce ? { opacity: 0 } : { scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ type: "spring", stiffness: 600, damping: 22 }} style={{ display: "grid", color: "var(--ts-success)" }} aria-hidden>
              <Icon name="check" size={18} stroke={2.4} />
            </motion.span>
          )}
        </AnimatePresence>
      </Box>
      {hasMsgRow && (
        <div className="ts-tf__row">
          <FieldMessage id={ids.msg} hint={hint} error={error} success={valid ? success : null} />
          {counted && <span className={"ts-tf__count" + (over ? " is-over" : "")} aria-hidden>{value.length}/{maxLength}</span>}
          {counted && <span id={ids.msg + "n"} className="ts-sr">{msg.count(value.length, maxLength)}</span>}
        </div>
      )}
    </div></>
  );
});
