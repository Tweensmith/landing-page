"use client";
import { forwardRef, useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import { motion } from "motion/react";
import { registerStyles, useStyles, useReducedMotion } from "../_shared/theme.jsx";
import { useFieldStyles, FieldMessage } from "../_shared/field.jsx";
import { Icon } from "../_shared/icons.jsx";

const CSS = `
.ts-rate{display:inline-flex;flex-direction:column;gap:8px;font-family:var(--ts-font)}
.ts-rate__label{font-size:13px;font-weight:550;color:var(--ts-ink)}
.ts-rate__row{position:relative;display:inline-flex;align-items:center;gap:12px}
.ts-rate__stars{display:inline-flex;gap:var(--rate-gap);border-radius:var(--ts-radius-sm);cursor:pointer;touch-action:none}
.ts-rate__stars:focus-visible,.ts-rate__stars[data-force=focus]{outline:2px solid var(--ts-focus);outline-offset:4px}
.ts-rate__stars[aria-readonly=true]{cursor:default}
.ts-rate__stars[aria-disabled=true]{opacity:.45;cursor:not-allowed}
.ts-rate.is-invalid .ts-rate__stars{outline:1.5px solid var(--ts-danger);outline-offset:4px}
.ts-rate__star{position:relative;display:grid;color:color-mix(in srgb,var(--ts-ink) 18%,transparent)}
.ts-rate__fill{position:absolute;inset:0;overflow:hidden;color:var(--ts-tone)}
.ts-rate__val{font-family:var(--ts-font-mono);font-size:13px;color:var(--ts-ink2);min-width:3ch;font-variant-numeric:tabular-nums}
.ts-rate__word{font-size:12.5px;color:var(--ts-ink2);min-height:18px}
.ts-rate__input{position:absolute;left:0;bottom:0;width:1px;height:1px;margin:0;padding:0;border:0;opacity:0;pointer-events:none;clip-path:inset(50%)}
@media (max-width:640px),(pointer:coarse){
  .ts-rate__stars{padding:6px 0;margin:-6px 0}
  .ts-rate__val{font-size:14px}
  .ts-rate__word{font-size:13px}
}
`;
registerStyles("ts-rating", CSS);

// On a phone the stars grow to thumb size, and a finger can scrub across them before lifting to commit.
const MQ = "(max-width: 640px), (pointer: coarse)";
const subscribeMq = (f) => { const m = matchMedia(MQ); m.addEventListener("change", f); return () => m.removeEventListener("change", f); };
const useTouch = () => useSyncExternalStore(subscribeMq, () => matchMedia(MQ).matches, () => false);

// one star in px: sm reads in a table row or a review card, lg is the one question on a feedback screen
const SIZES = { sm: 20, md: 30, lg: 40 };

// sample words for each whole star, shown only with `demo` when the caller passes no `words`
const DEMO_WORDS = ["", "Poor", "Not great", "Okay", "Good", "Loved it"];
const valueText = (v, max) => `${v} out of ${max} stars`;

/**
 * Rating — stars that fill to the pointer with half steps; click commits, leaving reverts
 * to the committed value. A slider for assistive tech: ←/→ by half (or whole) steps, Home/End;
 * with `clearable`, Backspace/Delete/0 or clicking the current value clears it to 0.
 * Signature: the star under the pointer lifts, and committing pops the filled stars in sequence.
 * Controlled: pass `value` and update it in `onChange`. Uncontrolled: `defaultValue`. The ref goes to the slider.
 */
export const Rating = forwardRef(function Rating({
  value,
  defaultValue = 0,
  max = 5,
  allowHalf = true,
  clearable = false,
  size = "md",
  gap = 6,
  tone = "accent",
  showValue = true,
  showWords = true,
  words,
  label = "",
  formatValue = valueText,
  readOnly = false,
  disabled = false,
  required = false,
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
  const sheetTag = useStyles("ts-rating", CSS);
  const sheetTag2 = useFieldStyles();
  const reduce = useReducedMotion();
  const uid = useId();
  const baseId = id ?? uid;
  const text = label || (demo ? "Rate this recipe" : "");
  const wordList = words ?? (demo ? DEMO_WORDS : null);
  const step = allowHalf ? 0.5 : 1;
  const floor = clearable ? 0 : step;
  const controlled = value !== undefined;
  const [inner, setInner] = useState(defaultValue);
  const committed = Math.min(max, Math.max(0, Number(controlled ? value : inner) || 0));
  const box = useRef(null);
  const setBox = (el) => { box.current = el; if (typeof ref === "function") ref(el); else if (ref) ref.current = el; };
  const input = useRef(null);
  const cur = useRef(committed);
  cur.current = committed;
  const [hover, setHover] = useState(null);
  const [pop, setPop] = useState(0);
  const isDisabled = disabled || forceState === "disabled";
  const interactive = !readOnly && !isDisabled;
  const shown = hover ?? committed;
  const touch = useTouch();
  const starGap = touch ? Math.max(gap, 8) : gap;
  const px = typeof size === "number" ? size : SIZES[size] ?? SIZES.md;
  // grow to thumb size on a phone, but never past what fits a 390px screen (about 300px for the stars)
  const starSize = touch ? Math.max(px, Math.min(36, Math.floor((300 - (max - 1) * starGap) / max))) : px;
  const scrub = useRef(false);
  const skipClick = useRef(false);
  const live = useRef({});
  live.current = { committed, controlled, defaultValue, onChange };

  // form reset returns to defaultValue (and tells a controlling parent)
  useEffect(() => {
    const form = input.current?.form;
    if (!form) return;
    const h = () => {
      const l = live.current;
      if (!l.controlled) setInner(l.defaultValue);
      if (l.committed !== l.defaultValue) l.onChange?.(l.defaultValue);
    };
    form.addEventListener("reset", h);
    return () => form.removeEventListener("reset", h);
  }, []);
  useEffect(() => { if (input.current) input.current.value = committed > 0 ? String(committed) : ""; });

  const fromPointer = (e) => {
    const r = box.current.getBoundingClientRect();
    const x = Math.min(Math.max(e.clientX - r.left, 0), r.width);
    const raw = (x / r.width) * max;
    return Math.max(step, Math.ceil(raw / step) * step);
  };
  const commit = (v, fromPointerPick) => {
    let c = Math.min(max, Math.max(floor, v));
    if (fromPointerPick && clearable && c === cur.current) c = 0;
    if (c > 0) setPop((p) => p + 1);
    if (c === cur.current) return;
    cur.current = c;
    if (!controlled) setInner(c);
    onChange?.(c);
  };
  const onKey = (e) => {
    if (e.key === "Enter") { input.current?.form?.requestSubmit(); return; }
    if (!interactive) return;
    const map = { ArrowRight: step, ArrowUp: step, ArrowLeft: -step, ArrowDown: -step };
    if (e.key in map) { e.preventDefault(); commit(cur.current + map[e.key]); }
    else if (e.key === "Home") { e.preventDefault(); commit(floor); }
    else if (e.key === "End") { e.preventDefault(); commit(max); }
    else if (clearable && (e.key === "Backspace" || e.key === "Delete" || e.key === "0")) { e.preventDefault(); commit(0); }
  };

  const word = (v) => (wordList && showWords ? wordList[Math.ceil(v)] ?? "" : "");
  const vt = formatValue(committed, max) + (word(committed) ? ", " + word(committed) : "");
  const describedBy = [error ? baseId + "e" : null, ariaDescribedBy].filter(Boolean).join(" ") || undefined;

  return (
    <>{sheetTag}{sheetTag2}<div
      className={"ts-rate" + (error ? " is-invalid" : "") + (className ? " " + className : "")}
      style={{ "--rate-gap": starGap + "px", "--ts-tone": tone === "accent" ? "var(--ts-accent)" : `var(--ts-${tone})`, ...style }}
      {...rest}
    >
      {text && <span id={baseId + "l"} className="ts-rate__label">{text}</span>}
      <div className="ts-rate__row">
        <div
          ref={setBox}
          id={baseId}
          className="ts-rate__stars"
          role="slider"
          tabIndex={interactive ? 0 : -1}
          aria-labelledby={text ? baseId + "l" : undefined}
          aria-label={text ? undefined : ariaLabel}
          aria-describedby={describedBy}
          aria-valuemin={0}
          aria-valuemax={max}
          aria-valuenow={committed}
          aria-valuetext={vt}
          aria-readonly={readOnly || undefined}
          aria-disabled={isDisabled || undefined}
          aria-required={required || undefined}
          aria-invalid={error ? true : undefined}
          data-force={forceState === "focus" ? "focus" : undefined}
          onPointerDown={(e) => {
            skipClick.current = false;
            if (!interactive || e.pointerType === "mouse") return;
            scrub.current = true;
            try { e.currentTarget.setPointerCapture(e.pointerId); } catch {}
            setHover(fromPointer(e));
          }}
          onPointerMove={(e) => interactive && (e.pointerType === "mouse" || scrub.current) && setHover(fromPointer(e))}
          onPointerUp={(e) => {
            if (!scrub.current) return;
            scrub.current = false;
            skipClick.current = true;
            setHover(null);
            commit(fromPointer(e), true);
          }}
          onPointerCancel={() => { scrub.current = false; setHover(null); }}
          onPointerLeave={() => { if (!scrub.current) setHover(null); }}
          onClick={(e) => { if (skipClick.current) { skipClick.current = false; return; } interactive && commit(fromPointer(e), true); }}
          onKeyDown={onKey}
        >
          {Array.from({ length: max }, (_, i) => {
            const fill = Math.max(0, Math.min(1, shown - i));
            const under = hover !== null && Math.ceil(hover) === i + 1;
            return (
              <motion.span
                key={i + "-" + (fill > 0 ? pop : "e")}
                className="ts-rate__star"
                initial={pop > 0 && fill > 0 && !reduce ? { scale: 0.6 } : false}
                animate={{ scale: under && !reduce ? 1.15 : 1, y: under && !reduce ? -2 : 0 }}
                transition={{ type: "spring", stiffness: 520, damping: 16, delay: pop > 0 && hover === null ? i * 0.04 : 0 }}
              >
                <Icon name="star" size={starSize} stroke={1.6} fill="currentColor" />
                <span className="ts-rate__fill" style={{ width: `${fill * 100}%`, transition: reduce ? "none" : "width .12s" }}>
                  <Icon name="star" size={starSize} stroke={1.6} fill="currentColor" />
                </span>
              </motion.span>
            );
          })}
        </div>
        {showValue && <span className="ts-rate__val" aria-hidden>{shown.toFixed(allowHalf ? 1 : 0)}</span>}
        <input
          ref={input}
          className="ts-rate__input"
          tabIndex={-1}
          aria-hidden
          name={name}
          required={required}
          disabled={isDisabled}
          defaultValue={committed > 0 ? String(committed) : ""}
          onFocus={() => box.current?.focus()}
        />
      </div>
      {wordList && showWords && <span className="ts-rate__word" aria-hidden>{word(shown)}</span>}
      {error && <FieldMessage id={baseId + "e"} error={error} />}
    </div></>
  );
});
