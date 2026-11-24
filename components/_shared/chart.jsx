"use client";
// Shared chart kit: one frame, legend, tooltip, table view, scales and number formats, so every chart in the
// library reads as one system. Built to the dataviz rules: colours come from --ts-series-* / --ts-seq-* (see
// CHART in themes.js), text never wears a series colour, tooltips enhance but never gate (the table view holds
// every value), legends exist for 2+ series and can toggle them, hit targets are bigger than marks.
import { forwardRef, useCallback, useEffect, useId, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { registerStyles, useStyles, useIsoLayoutEffect, useReducedMotion, inertAttr } from "./theme.jsx";

export const CHART_CSS = `
.ts-chart{position:relative;display:flex;flex-direction:column;gap:14px;min-width:0;padding:18px 20px 16px;border-radius:var(--ts-radius-lg);background:var(--ts-surface);box-shadow:inset 0 0 0 1px var(--ts-line),var(--ts-shadow);color:var(--ts-ink);font-family:var(--ts-font)}
.ts-chart__head{display:flex;align-items:flex-start;gap:12px}
.ts-chart__titles{min-width:0;margin-right:auto}
.ts-chart__title{margin:0;font-size:14px;font-weight:600;letter-spacing:-0.01em}
.ts-chart__sub{margin:3px 0 0;font-size:12.5px;color:var(--ts-ink2)}
.ts-chart__body{position:relative;min-width:0}
.ts-seg{display:inline-flex;padding:2px;border-radius:99px;background:var(--ts-surface2);flex:none}
.ts-seg button{all:unset;position:relative;height:24px;padding:0 10px;border-radius:99px;font-size:11.5px;font-weight:600;color:var(--ts-ink2);cursor:pointer;white-space:nowrap}
.ts-seg button[aria-pressed=true]{color:var(--ts-ink)}
.ts-seg button:focus-visible{outline:2px solid var(--ts-focus);outline-offset:1px}
.ts-seg__pill{position:absolute;inset:0;border-radius:99px;background:var(--ts-surface);box-shadow:0 1px 2px color-mix(in srgb,var(--ts-black) 12%,transparent),inset 0 0 0 1px var(--ts-line)}
.ts-seg__label{position:relative}
.ts-legend{display:flex;flex-wrap:wrap;gap:4px 14px;margin:0;padding:0;list-style:none}
.ts-legend button{all:unset;display:inline-flex;align-items:center;gap:7px;padding:3px 0;font-size:12px;color:var(--ts-ink2);cursor:pointer;transition:opacity .2s}
.ts-legend button[aria-pressed=false]{opacity:.42}
.ts-legend button:hover{color:var(--ts-ink)}
.ts-legend button:focus-visible{outline:2px solid var(--ts-focus);outline-offset:2px;border-radius:4px}
.ts-key{flex:none;display:inline-block}
.ts-key[data-k=rect]{width:10px;height:10px;border-radius:3px}
.ts-key[data-k=line]{width:14px;height:2px;border-radius:2px}
.ts-key[data-k=dot]{width:8px;height:8px;border-radius:99px}
.ts-tip{position:absolute;z-index:20;pointer-events:none;min-width:132px;padding:9px 11px 10px;border-radius:12px;background:color-mix(in srgb,var(--ts-surface) 88%,transparent);backdrop-filter:blur(14px) saturate(1.4);-webkit-backdrop-filter:blur(14px) saturate(1.4);box-shadow:inset 0 0 0 1px var(--ts-line),0 12px 32px -10px color-mix(in srgb,var(--ts-black) 35%,transparent);font-size:12px}
.ts-tip__title{margin-bottom:6px;font-size:11px;font-weight:600;color:var(--ts-ink2);letter-spacing:.01em}
.ts-tip__row{display:grid;grid-template-columns:14px 1fr auto;align-items:center;gap:8px;line-height:1.7}
.ts-tip__row .ts-key{width:12px}
.ts-tip__label{color:var(--ts-ink2);white-space:nowrap}
.ts-tip__value{font-weight:650;font-variant-numeric:tabular-nums;color:var(--ts-ink);text-align:right}
.ts-axis-t{font-family:var(--ts-font);font-size:11px;fill:var(--ts-ink3);font-variant-numeric:tabular-nums}
.ts-ctable{width:100%;border-collapse:collapse;font-size:12.5px}
.ts-ctable th{position:sticky;top:0;padding:7px 10px;text-align:left;font-weight:600;font-size:11.5px;color:var(--ts-ink2);background:var(--ts-surface);border-bottom:1px solid var(--ts-line)}
.ts-ctable td{padding:7px 10px;border-bottom:1px solid var(--ts-line);font-variant-numeric:tabular-nums}
.ts-ctable td[data-num],.ts-ctable th[data-num]{text-align:right}
.ts-ctable__wrap{max-height:var(--ct-h,260px);overflow:auto;border-radius:var(--ts-radius-md)}
@media (max-width:640px),(pointer:coarse){
  .ts-chart{padding:16px 14px 14px}
  .ts-chart__head{flex-wrap:wrap}
  .ts-seg button{height:32px;padding:0 12px;font-size:12.5px}
  .ts-seg button::after{content:"";position:absolute;inset:-6px 0}
  .ts-legend{gap:2px 14px}
  .ts-legend button{min-height:36px;font-size:12.5px}
}
.ts-chart :focus-visible:not(svg *){outline:2px solid var(--ts-focus);outline-offset:2px}
.ts-chart__plot[data-hidden=true]{position:absolute;inset:0 0 auto 0;visibility:hidden;pointer-events:none}
.ts-chart__head[data-switch=true]{min-height:28px}
.ts-chart__legend[data-hidden=true]{visibility:hidden;pointer-events:none}
.ts-legend button{position:relative}
.ts-seg[data-size=md] button{height:32px;padding:0 14px;font-size:13px}
.ts-seg[data-size=lg] button{height:36px;padding:0 14px;font-size:14px}
.ts-seg[data-fill=true]{display:flex}
.ts-seg[data-fill=true] button{flex:1;text-align:center}
.ts-seg button:disabled{cursor:default;opacity:.45}
.ts-seg[aria-disabled=true]{opacity:.55}
.ts-chart-msg{display:grid;place-items:center;align-content:center;gap:6px;box-sizing:border-box;width:100%;height:100%;padding:16px;text-align:center}
.ts-chart-msg b{font-size:13.5px;font-weight:620;color:var(--ts-ink)}
.ts-chart-msg span{max-width:320px;font-size:12.5px;line-height:1.5;color:var(--ts-ink2)}
.ts-chart-msg[data-kind=error] b{color:var(--ts-danger,var(--ts-ink))}
.ts-chart-msg button{all:unset;position:relative;margin-top:4px;display:inline-flex;align-items:center;height:28px;padding:0 12px;border-radius:99px;font-size:12px;font-weight:600;color:var(--ts-ink);background:var(--ts-surface2);cursor:pointer}
.ts-chart-msg button:hover{background:color-mix(in srgb,var(--ts-ink) 10%,var(--ts-surface2))}
.ts-chart-msg button:focus-visible{outline:2px solid var(--ts-focus);outline-offset:2px}
.ts-chart[aria-disabled=true] .ts-chart__body{opacity:.55;pointer-events:none}
@media (max-width:640px),(pointer:coarse){
  .ts-chart__head[data-switch=true]{min-height:36px}
  .ts-legend button::after{content:"";position:absolute;inset:-4px 0}
  .ts-seg[data-size=md] button{height:40px;padding:0 14px;font-size:13.5px}
  .ts-seg[data-size=md] button::after{inset:-2px 0}
  .ts-seg[data-size=lg] button{height:44px;padding:0 12px;font-size:14px}
  .ts-seg[data-size=lg] button::after{inset:0}
  .ts-chart-msg button{height:36px}
  .ts-chart-msg button::after{content:"";position:absolute;inset:-4px 0}
}
`;
registerStyles("ts-chart", CHART_CSS);
export const useChartStyles = () => useStyles("ts-chart", CHART_CSS);

/** Series colour by index (0-based), in the fixed validated order. Never cycle past 8: fold into "Other". */
export const seriesColor = (i) => `var(--ts-series-${Math.min(i, 7) + 1})`;
/** Sequential step 1..7 (1 = near zero, recedes into the surface). */
export const seqColor = (step) => `var(--ts-seq-${Math.max(1, Math.min(7, Math.round(step)))})`;

/** Linear scale: map [d0, d1] → [r0, r1]. scale.invert maps back. */
export function scaleLinear([d0, d1], [r0, r1]) {
  const k = d1 === d0 ? 0 : (r1 - r0) / (d1 - d0);
  const f = (v) => r0 + (v - d0) * k;
  f.invert = (r) => (k === 0 ? d0 : d0 + (r - r0) / k);
  return f;
}

/** Clean axis ticks covering [min, max] in about `count` steps (1, 2, 2.5, 5 × 10^n). */
export function niceTicks(min, max, count = 5) {
  if (min === max) max = min + 1;
  const raw = (max - min) / Math.max(1, count);
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw) ?? 10 * mag;
  const lo = Math.floor(min / step) * step, hi = Math.ceil(max / step) * step;
  const out = [];
  for (let v = lo; v <= hi + step / 2; v += step) out.push(+v.toFixed(10));
  return out;
}

/**
 * Number formats. fmt(1284) → "1,284"; fmt(12900, { compact: true }) → "12.9K";
 * fmt(4.2e6, { currency: "USD", compact: true }) → "$4.2M"; fmt(0.163, { percent: true }) → "16.3%".
 * The caller passes `locale`, the value of useLocale() (see theme.jsx); "en-US" only stands in if it is missing.
 */
export function fmt(n, { compact = false, currency, percent = false, decimals, signed = false, locale = "en-US" } = {}) {
  if (n == null || Number.isNaN(n)) return "–";
  const o = { maximumFractionDigits: decimals ?? (percent ? 1 : compact ? 1 : 2), ...(decimals != null ? { minimumFractionDigits: decimals } : {}) };
  if (compact && Math.abs(n) >= 10000) o.notation = "compact";
  if (currency) { o.style = "currency"; o.currency = currency; }
  if (percent) o.style = "percent";
  if (signed) o.signDisplay = "exceptZero";
  return new Intl.NumberFormat(locale, o).format(n);
}

/** Size of an element (width and height), kept current. */
export function useSize(ref) {
  const [s, setS] = useState({ width: 0, height: 0 });
  useIsoLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setS({ width: e.contentRect.width, height: e.contentRect.height }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return s;
}

/** True once the element has scrolled into view (for draw-on entrances). */
export function useInView(ref, { once = true, amount = 0.3 } = {}) {
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") { setSeen(true); return; }
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setSeen(true); if (once) io.disconnect(); } else if (!once) setSeen(false); }, { threshold: amount });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return seen;
}

/**
 * A legend / tooltip key that mirrors its mark: rect for bars and areas, line for lines, dot for points.
 * `dash` (an SVG stroke-dasharray such as "4 3") draws a line key dashed, so series differ by more than hue.
 */
export function Key({ color, kind = "rect", dash }) {
  if (dash && kind === "line") {
    return (
      <svg className="ts-key" width="14" height="4" viewBox="0 0 14 4" aria-hidden style={{ overflow: "visible" }}>
        <line x1="1" x2="13" y1="2" y2="2" stroke={color} strokeWidth="2" strokeLinecap="round" strokeDasharray={dash} />
      </svg>
    );
  }
  return <span className="ts-key" data-k={kind} style={{ background: color }} aria-hidden />;
}

/** Dash patterns for line series after the first, so overlapping lines differ by more than hue. */
export const SERIES_DASH = [undefined, "6 3", "2 3", "8 3 2 3", "1 4", "10 4", "4 2 1 2", "3 6"];

/**
 * Colour for a caller's series: a number is a slot in the validated series order (0-based); a string naming a
 * --ts-* token ("--ts-series-3" or "var(--ts-accent)") is used as that token; anything else falls back to slot i.
 */
export function toneColor(tone, i = 0) {
  if (typeof tone === "number" && Number.isFinite(tone)) return seriesColor(tone);
  if (typeof tone === "string") {
    const t = tone.trim();
    if (t.startsWith("--ts-")) return `var(${t})`;
    if (/^var\(--ts-[\w-]+\)$/.test(t)) return t;
  }
  return seriesColor(i);
}

/** value / defaultValue / onChange in one hook. Uncontrolled when `value` is undefined. */
export function useControlled(value, defaultValue, onChange) {
  const [inner, setInner] = useState(defaultValue);
  const controlled = value !== undefined;
  const cur = controlled ? value : inner;
  const ref = useRef(cur);
  ref.current = cur;
  const set = useCallback((next, ...args) => {
    const v = typeof next === "function" ? next(ref.current) : next;
    if (!controlled) setInner(v);
    onChange?.(v, ...args);
  }, [controlled, onChange]);
  return [cur, set];
}

/** Write one element to a forwarded ref (function or object) and to a local ref. */
export function assignRef(ref, el) {
  if (typeof ref === "function") ref(el);
  else if (ref) ref.current = el;
}

/**
 * The empty / error box a chart shows in its own plot area. kind "empty" | "error"; `message` is a string or node
 * the caller passed; `onRetry` adds a retry button to the error form.
 */
export function ChartMessage({ kind = "empty", title, message, onRetry, retryLabel = "Try again", style, className = "" }) {
  return (
    <div className={"ts-chart-msg " + className} data-kind={kind} role={kind === "error" ? "alert" : "status"} style={style}>
      {title != null && title !== "" && <b>{title}</b>}
      {message != null && message !== "" && (typeof message === "string" ? <span>{message}</span> : message)}
      {kind === "error" && onRetry && <button type="button" onClick={onRetry}>{retryLabel}</button>}
    </div>
  );
}

/** A visually hidden table of the data for screen readers (the kit's .ts-sr class). Same columns/rows as DataTableView. */
export function SrTable({ caption, columns, rows }) {
  return (
    <div className="ts-sr"><table>
      {caption && <caption>{caption}</caption>}
      <thead><tr>{columns.map((c) => <th key={c.key} scope="col">{typeof c.label === "string" ? c.label : c.key}</th>)}</tr></thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={i}>{columns.map((c, j) => { const v = c.format ? c.format(r[c.key], r) : r[c.key]; return j === 0 ? <th key={c.key} scope="row">{v}</th> : <td key={c.key}>{v}</td>; })}</tr>
        ))}
      </tbody>
    </table></div>
  );
}

/**
 * Legend for 2+ series. items: [{ id, label, color, kind }]. Pass `hidden` (Set of ids) and `onToggle(id)` to let
 * readers switch series off; the last visible series can't be hidden.
 */
export function Legend({ items, hidden, onToggle, label = "Series" }) {
  const visible = items.filter((it) => !hidden?.has(it.id)).length;
  return (
    <ul className="ts-legend" aria-label={label}>
      {items.map((it) => {
        const on = !hidden?.has(it.id);
        return (
          <li key={it.id}>
            {onToggle ? (
              <button type="button" aria-pressed={on} disabled={on && visible === 1} onClick={() => onToggle(it.id)}>
                <Key color={it.color} kind={it.kind} dash={it.dash} />{it.label}
              </button>
            ) : (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: 12, color: "var(--ts-ink2)" }}><Key color={it.color} kind={it.kind} dash={it.dash} />{it.label}</span>
            )}
          </li>
        );
      })}
    </ul>
  );
}

/**
 * Tooltip positioned inside a relatively-positioned box. x/y are the anchor in that box's pixels; it sits
 * above-right of the anchor and flips to stay inside `bounds` ({ width, height }).
 */
export function Tooltip({ open, x, y, bounds, title, children, offset = 14 }) {
  const ref = useRef(null);
  const reduce = useReducedMotion();
  const [size, setSize] = useState({ w: 150, h: 60 });
  useIsoLayoutEffect(() => {
    if (ref.current) { const r = ref.current.getBoundingClientRect(); if (Math.abs(r.width - size.w) > 1 || Math.abs(r.height - size.h) > 1) setSize({ w: r.width, h: r.height }); }
  });
  const W = bounds?.width ?? Infinity, H = bounds?.height ?? Infinity;
  let left = x + offset, top = y - size.h - offset / 2;
  if (left + size.w > W) left = x - size.w - offset;
  if (left < 0) left = Math.max(0, Math.min(W - size.w, x - size.w / 2));
  if (top < 0) top = Math.min(H - size.h, y + offset);
  return (
    <AnimatePresence>
      {open && (
        <motion.div ref={ref} className="ts-tip" role="status" aria-live="polite"
          initial={{ opacity: 0, scale: reduce ? 1 : 0.96 }} animate={{ opacity: 1, scale: 1, left, top }} exit={{ opacity: 0, transition: { duration: 0.12 } }}
          transition={reduce ? { duration: 0 } : { left: { type: "spring", stiffness: 700, damping: 48, mass: 0.6 }, top: { type: "spring", stiffness: 700, damping: 48, mass: 0.6 }, default: { duration: 0.14 } }}
          style={{ transformOrigin: "left bottom" }}>
          {title != null && <div className="ts-tip__title">{title}</div>}
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** One tooltip row: line key, label, value (the value is the strong element). */
export function TipRow({ color, label, value, kind = "line" }) {
  return (
    <div className="ts-tip__row">
      {color ? <Key color={color} kind={kind} /> : <span />}
      <span className="ts-tip__label">{label}</span>
      <span className="ts-tip__value">{value}</span>
    </div>
  );
}

/**
 * Segmented control (Chart / Table, Week / Month …) with a sliding pill. options: strings or { value, label, disabled }.
 * `size` "sm" (24px, the chart-card default), "md" (32px; 40px on touch) or "lg" (36px; 44px on phones and touch,
 * for a page-level switch such as a date range), `fill` stretches the buttons to equal
 * widths across the row, `disabled` makes the whole group inert. className / style / rest go to the group. The pill is measured, not a layoutId:
 * a layoutId inside an AnimatePresence subtree can stall its exit (see guidelines.md).
 */
export function Segmented({ options, value, onChange, label, size = "sm", fill = false, disabled = false, className = "", style, "aria-label": ariaLabel, ...rest }) {
  const reduce = useReducedMotion();
  const box = useRef(null);
  const [pill, setPill] = useState(null);
  useIsoLayoutEffect(() => {
    const measure = () => {
      const b = box.current?.querySelector('button[aria-pressed="true"]');
      if (b) setPill((p) => (p && p.x === b.offsetLeft && p.w === b.offsetWidth ? p : { x: b.offsetLeft, w: b.offsetWidth }));
    };
    measure();
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(measure) : null;
    ro?.observe(box.current);
    return () => ro?.disconnect();
  }, [value, options.length]);
  return (
    <div ref={box} className={"ts-seg" + (className ? " " + className : "")} role="group" aria-label={ariaLabel ?? label} aria-disabled={disabled || undefined}
      data-size={size !== "sm" ? size : undefined} data-fill={fill || undefined} style={{ position: "relative", ...style }} {...rest}>
      {pill && (
        <motion.span className="ts-seg__pill" aria-hidden initial={false} animate={{ x: pill.x, width: pill.w }}
          transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 520, damping: 38 }}
          style={{ inset: "2px auto 2px 0", left: 0 }} />
      )}
      {options.map((o) => {
        const v = typeof o === "string" ? o : o.value, l = typeof o === "string" ? o : o.label;
        return (
          <button key={v} type="button" aria-pressed={value === v} disabled={disabled || (typeof o === "object" && o.disabled) || undefined} onClick={() => onChange(v)}>
            <span className="ts-seg__label">{l}</span>
          </button>
        );
      })}
    </div>
  );
}

/** The table view every chart offers: columns [{ key, label, num, format }], rows [{...}]. */
export function DataTableView({ caption, columns, rows, maxHeight = 260 }) {
  return (
    <div className="ts-ctable__wrap" style={{ "--ct-h": maxHeight + "px" }} tabIndex={0} role="region" aria-label={caption}>
      <table className="ts-ctable">
        <caption className="ts-sr">{caption}</caption>
        <thead><tr>{columns.map((c) => <th key={c.key} scope="col" data-num={c.num || undefined}>{c.label}</th>)}</tr></thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>{columns.map((c) => <td key={c.key} data-num={c.num || undefined}>{c.format ? c.format(r[c.key], r) : r[c.key]}</td>)}</tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * The card every chart sits in: title, subtitle, optional actions, legend row, and a Chart / Table switch that
 * cross-fades between the plot and its table view.
 * <ChartFrame title="Revenue" subtitle="Last 12 months" legend={<Legend …/>} table={{ caption, columns, rows }}>{plot}</ChartFrame>
 * Also takes: `summary` (a one-line text alternative, read by screen readers), `srTable` (keep a visually hidden
 * copy of the table in the page while the plot shows), `view` / `defaultView` / `onViewChange` ("chart" | "table"),
 * `viewSwitch` (false hides the Chart / Table switch), `disabled`, a ref to the <section>, and rest props on it.
 * The header keeps the switch's height whenever it shows, and the legend keeps its row in table view, so nothing
 * below moves when data, the table or the legend arrive.
 */
export const ChartFrame = forwardRef(function ChartFrame({
  title, subtitle, actions, legend, table, footer, children, style, className = "",
  summary, srTable = false, view: viewProp, defaultView = "chart", onViewChange, viewSwitch = true, disabled = false,
  "aria-label": ariaLabel, ...rest
}, ref) {
  const sheetTag = useChartStyles();
  const reduce = useReducedMotion();
  const [view, setView] = useControlled(viewProp, defaultView, onViewChange);
  const showTable = view === "table" && !!table;
  const sumId = "ts-cs" + useId().replace(/:/g, "");
  const hasSwitch = !!table && viewSwitch;
  return (
    <>{sheetTag}<section ref={ref} className={"ts-chart " + className} style={style} aria-label={ariaLabel ?? (typeof title === "string" && title ? title : undefined)}
      aria-describedby={summary ? sumId : undefined} aria-disabled={disabled || undefined} {...rest}>
      {(title || actions || table) && (
        <header className="ts-chart__head" data-switch={!!table || undefined}>
          <div className="ts-chart__titles">
            {title && <h3 className="ts-chart__title">{title}</h3>}
            {subtitle && <p className="ts-chart__sub">{subtitle}</p>}
          </div>
          {actions}
          {hasSwitch && <Segmented label="View" disabled={disabled} options={[{ value: "chart", label: "Chart" }, { value: "table", label: "Table" }]} value={view} onChange={setView} />}
        </header>
      )}
      {summary && <p id={sumId} className="ts-sr">{summary}</p>}
      {legend && <div className="ts-chart__legend" data-hidden={showTable || undefined} aria-hidden={showTable || undefined} {...inertAttr(showTable)}>{legend}</div>}
      <div className="ts-chart__body" {...inertAttr(disabled)}>
        {/* the plot stays mounted under the table, so it keeps its measured size, zoom and state */}
        <motion.div className="ts-chart__plot" data-hidden={showTable} aria-hidden={showTable || undefined} initial={false}
          animate={{ opacity: showTable ? 0 : 1 }} transition={{ duration: reduce ? 0.01 : 0.18 }}>
          {children}
        </motion.div>
        <AnimatePresence initial={false}>
          {showTable && (
            <motion.div key="table" initial={{ opacity: 0, y: reduce ? 0 : 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, transition: { duration: 0.01 } }} transition={{ duration: reduce ? 0.01 : 0.18 }}>
              <DataTableView {...table} />
            </motion.div>
          )}
        </AnimatePresence>
        {srTable && table && table.rows?.length > 0 && !showTable && <SrTable {...table} />}
      </div>
      {footer}
    </section></>
  );
});
