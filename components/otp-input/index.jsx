"use client";
import { forwardRef, useEffect, useRef, useState } from "react";
import { motion, useAnimationControls } from "motion/react";
import { registerStyles, useStyles, useReducedMotion } from "../_shared/theme.jsx";
import { useShake, FieldMessage, useFieldStyles, useFieldIds } from "../_shared/field.jsx";

const CSS = `
.ts-otp{display:flex;flex-direction:column;align-items:center;gap:12px;font-family:var(--ts-font);max-width:100%;min-width:0}
.ts-otp__row{display:flex;align-items:center;gap:8px;max-width:100%;min-width:0}
.ts-otp__sep{flex:none;width:10px;height:2px;border-radius:2px;background:var(--ts-line);margin:0 2px}
.ts-otp__cell{all:unset;box-sizing:border-box;flex:0 1 auto;min-width:0;aspect-ratio:1/1.15;text-align:center;font-family:var(--ts-font-mono);font-weight:500;color:var(--ts-ink);caret-color:var(--ts-focus);
  border-radius:var(--ts-radius-md);background:var(--ts-surface);box-shadow:inset 0 0 0 1px var(--ts-line);transition:box-shadow .15s,background-color .25s,color .25s}
.ts-otp__cell:hover{box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--ts-ink) 22%,transparent)}
.ts-otp__cell:focus-visible,.ts-otp__cell[data-force=focus]{box-shadow:inset 0 0 0 1.5px var(--ts-focus),0 0 0 4px color-mix(in srgb,var(--ts-focus) 16%,transparent)}
.ts-otp__cell.is-filled{background:var(--ts-surface2)}
.ts-otp.is-error .ts-otp__cell{box-shadow:inset 0 0 0 1.5px var(--ts-danger)}
.ts-otp__cell.is-ok{background:var(--ts-success);color:var(--ts-bg);box-shadow:none}
.ts-otp__cell:disabled{opacity:.5}
.ts-otp.is-busy .ts-otp__cell{opacity:.7;cursor:progress}
@media (prefers-reduced-motion:reduce){.ts-otp__cell{transition:none}}
`;
registerStyles("ts-otp", CSS);

/** Neutral copy. Override any key through `messages`. */
export const DEFAULT_MESSAGES = {
  error: "That code didn't match. Try again.",
  success: "Verified",
  digit: (i, n) => `Digit ${i} of ${n}`,
};

const DEMO = { expected: "424242", hint: "Sent to •••• 0193. Try 424242." };

const setRef = (ref, el) => { if (typeof ref === "function") ref(el); else if (ref) ref.current = el; };
const toArr = (s, n) => Array.from({ length: n }, (_, i) => String(s ?? "").replace(/\D/g, "")[i] ?? "");

/**
 * OtpInput — one-time code entry. Auto-advance, Backspace steps back, paste or SMS autofill fills
 * every cell, arrows move. When the last cell fills it calls onComplete(code): check the code there and
 * set `error` (or `success`) yourself; set `busy` while you check. With `demo` on (or `expected` set,
 * for tests) a right code turns the cells green one after another and a wrong code shakes and clears.
 * The ref is the first cell.
 */
export const OtpInput = forwardRef(function OtpInput({
  length = 6,
  groupAfter = 3,
  expected = "",
  cellSize = 52,
  mask = false,
  label = "Verification code",
  hint = "",
  value: valueProp,
  defaultValue = "",
  onChange,
  onComplete,
  error,
  success = false,
  busy = false,
  messages,
  id,
  name,
  autoComplete = "one-time-code",
  autoFocus = false,
  required = false,
  disabled = false,
  demo = false,
  className,
  style,
  forceState,
  ...rest
}, ref) {
  const sheetTag = useFieldStyles();
  const sheetTag2 = useStyles("ts-otp", CSS);
  const reduce = useReducedMotion();
  const ids = useFieldIds();
  const shake = useShake();
  const controls = useAnimationControls();
  const msg = { ...DEFAULT_MESSAGES, ...messages };
  const target = expected || (demo ? DEMO.expected : "");
  const hintText = hint || (demo ? DEMO.hint : "");
  const controlled = valueProp !== undefined;
  const [inner, setInner] = useState(() => toArr(controlled ? valueProp : defaultValue, length));
  // a controlled value that differs from what the cells hold wins (the cells keep gaps the caller's string can't)
  const digits = controlled && String(valueProp ?? "") !== inner.join("") ? toArr(valueProp, length) : inner;
  const [status, setStatus] = useState("idle"); // idle | error | success (built-in check only: demo / expected)
  const refs = useRef([]);
  const timer = useRef(0);
  const prevLength = useRef(length);
  useEffect(() => {
    if (prevLength.current === length) return;
    prevLength.current = length;
    setInner(toArr(controlled ? valueProp : "", length)); setStatus("idle");
  }, [length]);
  useEffect(() => () => clearTimeout(timer.current), []);

  const state = forceState === "error" ? "error" : forceState === "success" ? "success"
    : error ? "error" : success ? "success" : status;
  const shown = forceState === "success" ? toArr(target || DEMO.expected, length) : forceState === "error" ? "4242".padEnd(length, "1").split("").slice(0, length) : digits;
  const isDisabled = disabled || forceState === "disabled";
  const locked = isDisabled || busy;
  const code = digits.join("");

  // the caller's error shakes the row once when it appears
  useEffect(() => { if (error && shake.x) controls.start(shake); }, [error]);

  // when the caller clears the code (or a new error arrives) while the person is in the group, put the caret in the
  // first empty cell, so the next code types from the start instead of from the last cell
  const rowRef = useRef(null);
  const toFirstEmpty = () => {
    const row = rowRef.current;
    if (!row || !row.contains(document.activeElement)) return;
    const i = digits.indexOf("");
    if (i >= 0) focus(i);
  };
  const lastCode = useRef(code);
  useEffect(() => {
    const was = lastCode.current;
    lastCode.current = code;
    if (code === "" && was !== "") toFirstEmpty();
  }, [code]);
  const lastError = useRef(error);
  useEffect(() => {
    const was = lastError.current;
    lastError.current = error;
    if (error && error !== was) toFirstEmpty();
  }, [error]);

  const commit = (next) => {
    setInner(next);
    if (next.join("") !== code) onChange?.(next.join(""));
  };
  const focus = (i) => refs.current[Math.max(0, Math.min(length - 1, i))]?.focus();
  const finish = (arr) => {
    const c = arr.join("");
    if (c.length < length || arr.includes("")) return;
    onComplete?.(c);
    if (!target) return;
    clearTimeout(timer.current);
    if (c === target.slice(0, length)) {
      setStatus("success");
      refs.current[length - 1]?.blur();
    } else {
      setStatus("error");
      if (shake.x) controls.start(shake);
      timer.current = setTimeout(() => { commit(Array(length).fill("")); setStatus("idle"); focus(0); }, 650);
    }
  };
  const put = (i, chars) => {
    const clean = chars.replace(/\D/g, "");
    if (!clean) return;
    // a whole code (paste, SMS autofill) fills from the first cell wherever it lands
    const start = clean.length >= length ? 0 : i;
    const src = clean.length >= length ? clean.slice(-length) : clean;
    const next = [...digits];
    let j = start;
    for (const c of src) { if (j >= length) break; next[j++] = c; }
    commit(next);
    setStatus("idle");
    focus(j);
    finish(next);
  };

  const onKey = (i, e) => {
    if (e.key === "Backspace") {
      e.preventDefault();
      if (locked) return;
      const next = [...digits];
      if (next[i]) next[i] = "";
      else if (i > 0) { next[i - 1] = ""; focus(i - 1); }
      commit(next);
      setStatus("idle");
    } else if (e.key === "Delete") {
      // clears this cell and stays (the cell is controlled, so the browser's own delete would be undone)
      e.preventDefault();
      if (locked || !digits[i]) return;
      const next = [...digits];
      next[i] = "";
      commit(next);
      setStatus("idle");
    } else if (e.key === "ArrowLeft") { e.preventDefault(); focus(i - 1); }
    else if (e.key === "ArrowRight") { e.preventDefault(); focus(i + 1); }
    else if (e.key === "Home") { e.preventDefault(); focus(0); }
    else if (e.key === "End") { e.preventDefault(); focus(length - 1); }
  };

  // <form> reset: empty cells, idle
  const resetRef = useRef();
  resetRef.current = () => { clearTimeout(timer.current); setStatus("idle"); commit(toArr(defaultValue, length)); };
  useEffect(() => {
    const form = refs.current[0]?.form;
    if (!form) return;
    const h = () => resetRef.current();
    form.addEventListener("reset", h);
    return () => form.removeEventListener("reset", h);
  }, []);   // once: a listener re-added mid-dispatch (another field's reset re-rendering the page) never runs

  const errText = state === "error" ? (typeof error === "string" && error ? error : msg.error) : null;
  const okText = state === "success" ? (typeof success === "string" && success ? success : msg.success) : null;
  const hasLabel = label !== "" && label != null;

  return (
    <>{sheetTag}{sheetTag2}<div
      {...rest}
      className={"ts-otp" + (state === "error" ? " is-error" : "") + (busy ? " is-busy" : "") + (className ? " " + className : "")}
      style={style}
      role="group"
      aria-labelledby={hasLabel ? ids.label : undefined}
      aria-busy={busy || undefined}
    >
      {hasLabel && <span id={ids.label} className="ts-field__label">{label}</span>}
      <motion.div ref={rowRef} className="ts-otp__row" animate={controls}>
        {shown.map((d, i) => (
          <span key={i} style={{ display: "contents" }}>
            {groupAfter > 0 && i === groupAfter && i < length && <span className="ts-otp__sep" aria-hidden />}
            <motion.input
              ref={(el) => { refs.current[i] = el; if (i === 0) setRef(ref, el); }}
              id={i === 0 ? id : undefined}
              className={"ts-otp__cell" + (d ? " is-filled" : "") + (state === "success" ? " is-ok" : "")}
              data-force={forceState === "focus" && i === 0 ? "focus" : undefined}
              value={mask && d && state !== "success" ? "•" : d}
              inputMode="numeric"
              autoComplete={i === 0 ? autoComplete : "off"}
              autoFocus={i === 0 && autoFocus}
              pattern="[0-9]*"
              maxLength={length + 1}
              disabled={isDisabled}
              readOnly={busy}
              aria-label={msg.digit(i + 1, length)}
              aria-invalid={state === "error" || undefined}
              aria-required={required || undefined}
              aria-describedby={ids.msg}
              onFocus={(e) => e.target.select()}
              onKeyDown={(e) => onKey(i, e)}
              onChange={(e) => {
                if (locked) return;
                const v = e.target.value;
                put(i, v.length > 1 && (!digits[i] || v.replace(/\D/g, "").length >= length) ? v : v.slice(-1));
              }}
              onPaste={(e) => { e.preventDefault(); if (!locked) put(i, e.clipboardData.getData("text")); }}
              animate={state === "success" && !reduce ? { scale: [1, 1.12, 1] } : { scale: 1 }}
              transition={{ delay: state === "success" ? i * 0.05 : 0, duration: 0.3 }}
              style={{ width: cellSize, fontSize: cellSize * 0.44, transitionDelay: state === "success" && !reduce ? `${i * 50}ms` : "0ms" }}
            />
          </span>
        ))}
      </motion.div>
      {name && <input type="hidden" name={name} value={code} disabled={isDisabled} />}
      <FieldMessage id={ids.msg} hint={hintText} error={errText} success={okText} />
    </div></>
  );
});
