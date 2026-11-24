"use client";
import { forwardRef, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, useAnimationControls } from "motion/react";
import { registerStyles, useStyles, useReducedMotion } from "../_shared/theme.jsx";
import { useFieldStyles, useLabelStyles, useFieldIds, useShake, useRevealErrors, FieldLabel, FieldMessage } from "../_shared/field.jsx";
import { Icon } from "../_shared/icons.jsx";

const CSS = `
.ts-pw__meter{display:grid;gap:4px}
.ts-pw__seg{height:4px;border-radius:4px;background:var(--ts-surface2);overflow:hidden}
.ts-pw__seg > span{display:block;height:100%;border-radius:inherit;transform-origin:left center;transition:background-color .3s}
.ts-pw__rules{list-style:none;padding:0;margin:2px 0 0;display:grid;grid-template-columns:1fr 1fr;gap:6px 12px}
.ts-pw__rule{display:flex;align-items:center;gap:7px;font-size:12.5px;color:var(--ts-ink2);transition:color .2s}
.ts-pw__rule.is-met{color:var(--ts-ink)}
.ts-pw__dot{flex:none;width:16px;height:16px;border-radius:99px;display:grid;place-items:center;box-shadow:inset 0 0 0 1px var(--ts-line);transition:background-color .2s,box-shadow .2s}
.ts-pw__rule.is-met .ts-pw__dot{background:var(--ts-success);box-shadow:none;color:var(--ts-bg)}
.ts-pw .ts-iconbtn:disabled{cursor:default;opacity:.6}
.ts-pw .ts-box{cursor:text}
@media (max-width:640px),(pointer:coarse){
  .ts-pw .ts-box{min-height:52px;padding-right:4px}
  .ts-pw .ts-input{align-self:stretch;font-size:16px}
  .ts-pw .ts-iconbtn{width:44px;height:44px;margin-right:0}
  .ts-pw__rules{gap:8px 12px}
  .ts-pw__rule{font-size:13px}
}
`;
registerStyles("ts-password", CSS);

const TONES = [
  "var(--ts-danger)",
  "var(--ts-danger)",
  "color-mix(in srgb, var(--ts-danger) 45%, var(--ts-success))",
  "color-mix(in srgb, var(--ts-danger) 15%, var(--ts-success))",
  "var(--ts-success)",
];

/** Neutral copy. Override any key through `messages`. */
export const DEFAULT_MESSAGES = {
  hint: (min) => `At least ${min} characters.`,
  strength: (level) => `Strength: ${level}`,
  strong: "Strong password",
  levels: ["Too weak", "Weak", "Fair", "Good", "Strong"],
  show: "Show password",
  hide: "Hide password",   // no longer read: the button keeps the `show` name and says its state with aria-pressed
  rulesLabel: "Password requirements",
  met: ", met",
  notMet: ", not met",
  invalid: "Check your password",
};

/** The built-in rule list; pass your own `rules` ([{ label, test(value) }]) to replace it. */
export const defaultRules = (minLength) => [
  { label: `${minLength}+ characters`, test: (v) => v.length >= minLength },
  { label: "A number", test: (v) => /\d/.test(v) },
  { label: "Upper & lower case", test: (v) => /[a-z]/.test(v) && /[A-Z]/.test(v) },
  { label: "A symbol", test: (v) => /[^A-Za-z0-9]/.test(v) },
];

const setRef = (ref, el) => { if (typeof ref === "function") ref(el); else if (ref) ref.current = el; };

/**
 * PasswordField — show/hide toggle, a segmented strength meter that fills as rules
 * are met, and a rule checklist that ticks live. Announces the strength level politely.
 * For sign-in, turn off showRules and showStrength: autocomplete then becomes "current-password".
 */
export const PasswordField = forwardRef(function PasswordField({
  label = "Create a password",
  labelPlacement = "above",
  icon = "lock",
  minLength = 8,
  showRules = true,
  showStrength = true,
  segments = 4,
  rules: rulesProp,
  messages,
  hint,
  value: valueProp,
  defaultValue = "",
  onChange,
  onBlur,
  onFocus,
  onStrengthChange,
  error,
  id,
  name,
  autoComplete,
  autoFocus = false,
  placeholder,
  required = false,
  readOnly = false,
  disabled = false,
  revealErrors = 0,
  maxWidth = 380,
  className,
  style,
  forceState,
  ...rest
}, ref) {
  const sheetTag = useFieldStyles();
  const sheetTag2 = useLabelStyles();
  const sheetTag3 = useStyles("ts-password", CSS);
  const reduce = useReducedMotion();
  const ids = useFieldIds();
  const inputId = id || ids.input;
  const shake = useShake();
  const controls = useAnimationControls();
  const inputRef = useRef(null);
  const [inner, setInner] = useState(defaultValue);
  const controlled = valueProp !== undefined;
  const value = controlled ? String(valueProp ?? "") : inner;
  const setValue = (v) => { if (!controlled) setInner(v); onChange?.(v); };
  const [show, setShow] = useState(false);
  const [focused, setFocused] = useState(false);
  const v = forceState === "success" ? "Studio!2026" : value;
  const msg = { ...DEFAULT_MESSAGES, ...messages };

  const rules = (rulesProp ?? defaultRules(minLength)).map((r) => ({ label: r.label, met: !!r.test?.(v) }));
  const score = v ? rules.filter((r) => r.met).length : 0;
  const levelIdx = rules.length ? Math.round((score / rules.length) * (msg.levels.length - 1)) : 0;
  const level = msg.levels[levelIdx];
  const tone = TONES[Math.round((levelIdx / Math.max(1, msg.levels.length - 1)) * (TONES.length - 1))];
  const filled = rules.length ? Math.round((score / rules.length) * segments) : 0;
  const strong = rules.length > 0 && score === rules.length;
  const isDisabled = disabled || forceState === "disabled";
  const box = ["hover", "focus"].includes(forceState) ? forceState : undefined;
  const metered = showStrength || showRules;
  const shownError = error || (forceState === "error" ? msg.invalid : null);

  // tell the caller when the strength changes (score of rules met, out of rules.length)
  const lastScore = useRef(score);
  useEffect(() => {
    if (lastScore.current === score) return;
    lastScore.current = score;
    onStrengthChange?.({ score, max: rules.length, level, strong });
  }, [score]);

  // a new error from the caller shakes the box once
  useEffect(() => { if (error && shake.x) controls.start(shake); }, [error]);
  // a form bumps revealErrors on every submit: shake again while an error shows, even the same message as last time
  useRevealErrors(revealErrors, () => { if (shownError && shake.x) controls.start(shake); });

  // <form> reset: back to defaultValue, hidden again
  const resetRef = useRef();
  resetRef.current = () => { setShow(false); if (value !== defaultValue) setValue(defaultValue); };
  useEffect(() => {
    const form = inputRef.current?.form;
    if (!form) return;
    const h = () => resetRef.current();
    form.addEventListener("reset", h);
    return () => form.removeEventListener("reset", h);
  }, []);   // once: a listener re-added mid-dispatch (another field's reset re-rendering the page) never runs

  // before anything is typed the line says the length rule, unless the checklist below already says it (a hint the
  // caller passes through messages.hint always shows); the line keeps its height so the checklist does not jump
  const emptyHint = showRules && rules.length > 0 && messages?.hint === undefined ? "" : typeof msg.hint === "function" ? msg.hint(minLength) : msg.hint;
  const hintText = hint !== undefined ? hint : showStrength ? (v ? msg.strength(level) : emptyHint) : "";
  const hasMsgRow = !!(hintText || shownError || (showStrength && strong) || (showStrength && hint === undefined));
  const describedBy = [hasMsgRow ? ids.msg : null, rest["aria-describedby"]].filter(Boolean).join(" ") || undefined;
  const hasLabel = label !== "" && label != null;
  const float = labelPlacement === "float";
  const up = !hasLabel || focused || v.length > 0 || ["focus", "error", "success"].includes(forceState);
  const hasIcon = icon && icon !== "none";

  return (
    <>{sheetTag}{sheetTag2}{sheetTag3}<div
      className={"ts-field ts-pw" + (float ? " is-label-float" : " is-label-above") + (className ? " " + className : "")}
      style={{ maxWidth: maxWidth || undefined, "--fl-left": hasIcon ? "44px" : "14px", "--fl-right": "50px", ...style }}
    >
      {!float && hasLabel && <FieldLabel placement="above" htmlFor={inputId} id={ids.label} required={required}>{label}</FieldLabel>}
      <motion.div
        className={"ts-box" + (isDisabled ? " is-disabled" : "") + (shownError ? " is-error" : metered && strong ? " is-success" : "")}
        data-force={box}
        animate={controls}
        onMouseDown={(e) => { if (e.target === e.currentTarget && !isDisabled) { e.preventDefault(); inputRef.current?.focus(); } }}
      >
        {hasIcon && <Icon name={icon} size={18} />}
        {float && hasLabel && <FieldLabel placement="float" htmlFor={inputId} id={ids.label} up={up} required={required}>{label}</FieldLabel>}
        <input
          {...rest}
          ref={(el) => { inputRef.current = el; setRef(ref, el); }}
          id={inputId}
          name={name}
          className="ts-input"
          type={show ? "text" : "password"}
          value={v}
          disabled={isDisabled}
          readOnly={readOnly}
          required={required}
          autoFocus={autoFocus}
          placeholder={placeholder && (!float || up) ? placeholder : undefined}
          autoComplete={autoComplete ?? (metered ? "new-password" : "current-password")}
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          aria-invalid={!!shownError || undefined}
          aria-describedby={describedBy}
          onFocus={(e) => { setFocused(true); onFocus?.(e); }}
          onBlur={(e) => { setFocused(false); onBlur?.(e); }}
          onChange={(e) => setValue(e.target.value)}
        />
        <button type="button" className="ts-iconbtn" aria-label={msg.show} aria-pressed={show} aria-controls={inputId} disabled={isDisabled} onClick={() => setShow((s) => !s)}>
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span key={show ? "off" : "on"} initial={reduce ? { opacity: 0 } : { opacity: 0, rotate: -30, scale: 0.6 }} animate={{ opacity: 1, rotate: 0, scale: 1 }} exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.6 }}
              transition={{ type: "spring", stiffness: 500, damping: 28 }} style={{ display: "grid" }}>
              <Icon name={show ? "eyeOff" : "eye"} size={18} />
            </motion.span>
          </AnimatePresence>
        </button>
      </motion.div>

      {showStrength && (
        <div className="ts-pw__meter" style={{ gridTemplateColumns: `repeat(${segments}, 1fr)` }} aria-hidden>
          {Array.from({ length: segments }, (_, i) => (
            <span key={i} className="ts-pw__seg">
              <motion.span
                initial={false}
                animate={{ scaleX: i < filled ? 1 : 0 }}
                style={{ backgroundColor: tone }}
                transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 260, damping: 26, delay: i < filled ? i * 0.04 : 0 }}
              />
            </span>
          ))}
        </div>
      )}
      {hasMsgRow && <FieldMessage id={ids.msg} hint={hintText} error={shownError} success={showStrength && strong ? msg.strong : null} />}

      {showRules && rules.length > 0 && (
        <ul className="ts-pw__rules" aria-label={msg.rulesLabel}>
          {rules.map((r) => (
            <li key={r.label} className={"ts-pw__rule" + (r.met ? " is-met" : "")}>
              <span className="ts-pw__dot">
                <AnimatePresence>
                  {r.met && (
                    <motion.span initial={reduce ? { opacity: 0 } : { scale: 0 }} animate={{ scale: 1, opacity: 1 }} exit={reduce ? { opacity: 0, transition: { duration: 0.15 } } : { scale: 0 }} transition={{ type: "spring", stiffness: 600, damping: 20 }} style={{ display: "grid" }}>
                      <Icon name="check" size={11} stroke={3} />
                    </motion.span>
                  )}
                </AnimatePresence>
              </span>
              <span>{r.label}<span className="ts-sr">{r.met ? msg.met : msg.notMet}</span></span>
            </li>
          ))}
        </ul>
      )}
    </div></>
  );
});
