"use client";
import { forwardRef, useEffect, useId, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { registerStyles, useStyles, useLocale, useReducedMotion } from "../_shared/theme.jsx";
import { useFieldStyles, FieldMessage } from "../_shared/field.jsx";

const CSS = `
.ts-range{display:flex;flex-direction:column;gap:12px;width:100%;max-width:420px;font-family:var(--ts-font)}
.ts-range__head{display:flex;justify-content:space-between;align-items:baseline;gap:12px}
.ts-range__label{font-size:13px;font-weight:550;color:var(--ts-ink)}
.ts-range__out{margin-left:auto;font-family:var(--ts-font-mono);font-size:13px;color:var(--ts-ink);font-variant-numeric:tabular-nums}
.ts-range__hist{display:flex;align-items:flex-end;gap:2px;height:56px;padding:0 2px}
.ts-range__bar{flex:1;border-radius:2px 2px 0 0;background:var(--ts-surface2);transition:background-color .2s}
.ts-range__bar.is-in{background:color-mix(in srgb,var(--ts-accent) 70%,transparent)}
.ts-range__track{position:relative;height:28px;cursor:pointer;touch-action:none}
.ts-range__rail{position:absolute;left:0;right:0;top:50%;height:4px;margin-top:-2px;border-radius:4px;background:var(--ts-surface2)}
.ts-range__sel{position:absolute;top:50%;height:4px;margin-top:-2px;border-radius:4px;background:var(--ts-accent)}
.ts-range__thumb{position:absolute;top:50%;width:22px;height:22px;margin:-11px 0 0 -11px;border-radius:99px;background:var(--ts-surface);cursor:grab;
  box-shadow:0 0 0 2px var(--ts-accent),0 4px 10px color-mix(in srgb,var(--ts-bg) 50%,transparent);transition:box-shadow .15s}
.ts-range__thumb:active{cursor:grabbing}
.ts-range__thumb:focus-visible,.ts-range__thumb[data-force=focus]{outline:none;box-shadow:0 0 0 2px var(--ts-accent),0 0 0 7px color-mix(in srgb,var(--ts-focus) 25%,transparent)}
.ts-range.is-invalid .ts-range__thumb{box-shadow:0 0 0 2px var(--ts-danger),0 4px 10px color-mix(in srgb,var(--ts-bg) 50%,transparent)}
.ts-range__bubble{position:absolute;bottom:calc(100% + 10px);left:50%;padding:4px 7px;border-radius:var(--ts-radius-sm);white-space:nowrap;pointer-events:none;
  background:var(--ts-ink);color:var(--ts-bg);font-family:var(--ts-font-mono);font-size:11.5px}
.ts-range__ends{display:flex;justify-content:space-between;font-family:var(--ts-font-mono);font-size:11px;color:var(--ts-ink2)}
.ts-range.is-disabled{opacity:.5;pointer-events:none}
.ts-range__thumb::before{content:"";position:absolute;inset:-11px;border-radius:99px}
@media (max-width:640px),(pointer:coarse){
  .ts-range__track{height:44px}
  /* the thumb is a 44px target; the 28px circle you see is drawn by ::after */
  .ts-range__thumb,.ts-range__thumb:focus-visible,.ts-range__thumb[data-force=focus],.ts-range.is-invalid .ts-range__thumb{width:44px;height:44px;margin:-22px 0 0 -22px;background:none;box-shadow:none}
  .ts-range__thumb::before{content:none}
  .ts-range__thumb::after{content:"";position:absolute;inset:8px;border-radius:99px;background:var(--ts-surface);
    box-shadow:0 0 0 2px var(--ts-accent),0 4px 10px color-mix(in srgb,var(--ts-bg) 50%,transparent);transition:box-shadow .15s}
  .ts-range__thumb:focus-visible::after,.ts-range__thumb[data-force=focus]::after{box-shadow:0 0 0 2px var(--ts-accent),0 0 0 7px color-mix(in srgb,var(--ts-focus) 25%,transparent)}
  .ts-range.is-invalid .ts-range__thumb::after{box-shadow:0 0 0 2px var(--ts-danger),0 4px 10px color-mix(in srgb,var(--ts-bg) 50%,transparent)}
  .ts-range__bubble{z-index:1;font-size:12.5px;padding:5px 8px;bottom:calc(100% + 4px)}
}
`;
registerStyles("ts-range", CSS);

// sample histogram for the gallery (`demo`): a two-hump distribution, the same every render
function seeded(n, seed = 7) {
  let h = seed;
  const r = () => ((h = Math.imul(h ^ (h >>> 15), 2246822507) + 0x6d2b79f5), ((h >>> 0) % 1000) / 1000);
  return Array.from({ length: n }, (_, i) => {
    const x = i / (n - 1);
    const bell = Math.exp(-((x - 0.38) ** 2) / 0.05) + 0.55 * Math.exp(-((x - 0.72) ** 2) / 0.02);
    return 0.12 + bell * 0.8 + r() * 0.12;
  });
}

/**
 * RangeSlider — pick a min–max range (price filters, date spans, sizes).
 * Signature: a histogram of the underlying data sits behind the track and lights up
 * inside the selected range, so people see how many results their range keeps.
 * Two keyboard sliders: ←/→ step, Shift or PageUp/PageDown ×10, Home/End; Enter submits the form.
 * Controlled: pass `value` ([low, high]) and update it in `onChange`. Uncontrolled: `defaultValue`
 * (or the older `low` / `high`). `onChangeEnd` fires once per drag or key press with the committed range.
 * The ref goes to the low thumb.
 */
export const RangeSlider = forwardRef(function RangeSlider({
  value,
  defaultValue,
  min = 0,
  max = 100,
  step = 1,
  low,
  high,
  bins = 32,
  prefix = "",
  formatValue,
  showHistogram = true,
  openEnded = false,
  label = "",
  minLabel = "Minimum",
  maxLabel = "Maximum",
  data,
  name,
  id,
  error,
  disabled = false,
  demo = false,
  onChange,
  onChangeEnd,
  forceState,
  className,
  style,
  "aria-label": ariaLabel,
  "aria-describedby": ariaDescribedBy,
  ...rest
}, ref) {
  const sheetTag = useStyles("ts-range", CSS);
  const sheetTag2 = useFieldStyles();
  const reduce = useReducedMotion();
  const uid = useId();
  const baseId = id ?? uid;
  const track = useRef(null);
  const form0 = useRef(null);
  const text = label || (demo ? "Price range" : "");
  const seed = () => {
    const at = (f) => min + Math.round((f * (max - min)) / step) * step;
    const d = defaultValue ?? [low ?? (demo ? at(0.2) : min), high ?? (demo ? at(0.65) : max)];
    return [Math.max(min, Math.min(max, d[0])), Math.max(min, Math.min(max, d[1]))];
  };
  const controlled = Array.isArray(value);
  const [inner, setInner] = useState(seed);
  const vals = controlled ? value : inner;
  const cur = useRef(vals);
  cur.current = vals;
  const [active, setActive] = useState(null);
  const hist = useMemo(() => data ?? (demo ? seeded(bins) : null), [data, bins, demo]);
  const isDisabled = disabled || forceState === "disabled";
  const span = max - min || 1;
  const pct = (v) => ((v - min) / span) * 100;
  const loc = useLocale();
  const fmt = (v) => (formatValue ? formatValue(v) : prefix + Number(v).toLocaleString(loc));
  const [a, b] = vals;
  const live = useRef({});
  live.current = { vals, controlled, seed, onChange, onChangeEnd };

  const commitEnd = () => onChangeEnd?.(cur.current);
  const set = (i, v) => {
    const c = Math.min(max, Math.max(min, Math.round((v - min) / step) * step + min));
    const prev = cur.current;
    const next = [...prev];
    next[i] = i === 0 ? Math.min(c, prev[1] - step) : Math.max(c, prev[0] + step);
    if (next[i] === prev[i]) return false;
    cur.current = next;
    if (!controlled) setInner(next);
    onChange?.(next);
    return true;
  };

  // form reset returns to defaultValue (and tells a controlling parent)
  useEffect(() => {
    const form = form0.current?.form;
    if (!form) return;
    const h = () => {
      const l = live.current;
      const d = l.seed();
      if (!l.controlled) setInner(d);
      if (l.vals[0] !== d[0] || l.vals[1] !== d[1]) { l.onChange?.(d); l.onChangeEnd?.(d); }
    };
    form.addEventListener("reset", h);
    return () => form.removeEventListener("reset", h);
  }, []);

  const fromX = (x) => {
    const r = track.current.getBoundingClientRect();
    return min + ((x - r.left) / r.width) * span;
  };
  const down = (e) => {
    if (isDisabled) return;
    const v = fromX(e.clientX);
    const i = Math.abs(v - a) <= Math.abs(v - b) ? 0 : 1;
    setActive(i);
    set(i, v);
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch {}
    track.current.querySelectorAll("[role=slider]")[i]?.focus({ preventScroll: true });
  };
  const up = () => { if (active !== null) { setActive(null); commitEnd(); } };
  const keys = (i) => (e) => {
    if (e.key === "Enter") { form0.current?.form?.requestSubmit(); return; }
    if (isDisabled) return;
    const big = step * 10;
    const map = { ArrowRight: e.shiftKey ? big : step, ArrowUp: e.shiftKey ? big : step, ArrowLeft: e.shiftKey ? -big : -step, ArrowDown: e.shiftKey ? -big : -step, PageUp: big, PageDown: -big };
    let moved = false;
    if (e.key in map) { e.preventDefault(); moved = set(i, cur.current[i] + map[e.key]); }
    else if (e.key === "Home") { e.preventDefault(); moved = set(i, min); }
    else if (e.key === "End") { e.preventDefault(); moved = set(i, max); }
    if (moved) commitEnd();
  };
  const names = Array.isArray(name) ? name : [name, name];
  const describedBy = [error ? baseId + "e" : null, ariaDescribedBy].filter(Boolean).join(" ") || undefined;

  return (
    <>{sheetTag}{sheetTag2}<div
      id={id}
      className={"ts-range" + (isDisabled ? " is-disabled" : "") + (error ? " is-invalid" : "") + (className ? " " + className : "")}
      role="group"
      aria-labelledby={text ? baseId + "l" : undefined}
      aria-label={text ? undefined : ariaLabel}
      aria-disabled={isDisabled || undefined}
      style={style}
      {...rest}
    >
      <div className="ts-range__head">
        {text && <span id={baseId + "l"} className="ts-range__label">{text}</span>}
        <span className="ts-range__out" aria-live="polite">{fmt(a)} – {fmt(b)}</span>
      </div>
      {showHistogram && hist && hist.length > 0 && (() => {
        const top = Math.max(...hist) || 1;
        return (
          <div className="ts-range__hist" aria-hidden>
            {hist.map((h, i) => {
              const v0 = min + (i / hist.length) * span, v1 = min + ((i + 1) / hist.length) * span;
              return <span key={i} className={"ts-range__bar" + (v1 > a && v0 < b ? " is-in" : "")} style={{ height: `${+((data ? h / top : h) * 100).toFixed(3)}%` }} />;
            })}
          </div>
        );
      })()}
      <div ref={track} className="ts-range__track" onPointerDown={down} onPointerMove={(e) => active !== null && set(active, fromX(e.clientX))} onPointerUp={up} onPointerCancel={up}>
        <span className="ts-range__rail" />
        <span className="ts-range__sel" style={{ left: `${pct(a)}%`, width: `${pct(b) - pct(a)}%` }} />
        {[a, b].map((v, i) => (
          <motion.span
            key={i}
            ref={i === 0 ? ref : undefined}
            className="ts-range__thumb"
            role="slider"
            tabIndex={isDisabled ? -1 : 0}
            aria-label={i === 0 ? minLabel : maxLabel}
            aria-describedby={describedBy}
            aria-valuemin={i === 0 ? min : a + step}
            aria-valuemax={i === 0 ? b - step : max}
            aria-valuenow={v}
            aria-valuetext={fmt(v) + (openEnded && v >= max ? "+" : "")}
            aria-disabled={isDisabled || undefined}
            aria-invalid={error ? true : undefined}
            data-force={(forceState === "focus" || forceState === "dragging") && i === 1 ? "focus" : undefined}
            onKeyDown={keys(i)}
            animate={{ scale: active === i && !reduce ? 1.15 : 1 }}
            transition={{ type: "spring", stiffness: 600, damping: 30 }}
            style={{ left: `${pct(v)}%` }}
          >
            <AnimatePresence>
              {(active === i || (forceState === "dragging" && i === 1)) && (
                <motion.span className="ts-range__bubble" initial={{ opacity: 0, y: reduce ? 0 : 4, x: "-50%" }} animate={{ opacity: 1, y: 0, x: "-50%" }} exit={{ opacity: 0, x: "-50%" }} transition={{ duration: 0.12 }}>
                  {fmt(v)}
                </motion.span>
              )}
            </AnimatePresence>
          </motion.span>
        ))}
      </div>
      <div className="ts-range__ends" aria-hidden><span>{fmt(min)}</span><span>{fmt(max)}{openEnded ? "+" : ""}</span></div>
      <input ref={form0} type="hidden" name={names[0]} value={String(a)} disabled={isDisabled} />
      <input type="hidden" name={names[1]} value={String(b)} disabled={isDisabled} />
      {error && <FieldMessage id={baseId + "e"} error={error} />}
    </div></>
  );
});
