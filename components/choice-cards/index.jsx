"use client";
import { forwardRef, useCallback, useEffect, useId, useRef, useState } from "react";
import { motion } from "motion/react";
import { registerStyles, useStyles, useReducedMotion } from "../_shared/theme.jsx";
import { Icon } from "../_shared/icons.jsx";
import { FieldMessage, useFieldStyles } from "../_shared/field.jsx";

const DEMO_ITEMS = [
  { value: "personal", title: "Personal", description: "Just you, one workspace.", meta: "Free", icon: "user" },
  { value: "team", title: "Team", description: "Shared projects and roles.", meta: "$12 / seat", icon: "message" },
  { value: "studio", title: "Studio", description: "Brands, clients, approvals.", meta: "$29 / seat", icon: "sparkle" },
];

const CSS = `
.ts-cc{border:0;margin:0;padding:0;min-width:0;font-family:var(--ts-font);width:100%;max-width:640px}
.ts-cc legend{padding:0;margin-bottom:12px;font-size:13px;font-weight:550;color:var(--ts-ink)}
.ts-cc__grid{display:grid;gap:10px}
.ts-cc__card{position:relative;display:flex;flex-direction:column;gap:6px;padding:16px;cursor:pointer;border-radius:var(--ts-radius-lg);
  background:var(--ts-surface);box-shadow:inset 0 0 0 1px var(--ts-line);transition:box-shadow .2s,background-color .2s;color:var(--ts-ink)}
.ts-cc__card:hover,.ts-cc__card[data-force=hover]{box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--ts-ink) 24%,transparent)}
.ts-cc__card.is-on{box-shadow:inset 0 0 0 1.5px var(--ts-accent),0 12px 28px -16px var(--ts-accent);background:color-mix(in srgb,var(--ts-accent) 6%,var(--ts-surface))}
.ts-cc__card:has(input:focus-visible),.ts-cc__card[data-force=focus]{outline:2px solid var(--ts-focus);outline-offset:3px}
.ts-cc__card.is-disabled{opacity:.45;cursor:not-allowed}
.ts-cc.is-error .ts-cc__card:not(.is-on){box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--ts-danger) 55%,transparent)}
.ts-cc__err{margin-top:10px}
.ts-cc__card input{position:absolute;opacity:0;width:1px;height:1px;pointer-events:none}
.ts-cc__icon{width:34px;height:34px;border-radius:var(--ts-radius-sm);display:grid;place-items:center;background:var(--ts-surface2);color:var(--ts-ink2);margin-bottom:6px;transition:background-color .2s,color .2s}
.ts-cc__card.is-on .ts-cc__icon{background:var(--ts-accent);color:var(--ts-accent-ink)}
.ts-cc__title{font-size:14.5px;font-weight:600;letter-spacing:-0.01em}
.ts-cc__desc{font-size:12.5px;color:var(--ts-ink2);line-height:1.45}
.ts-cc__meta{margin-top:auto;padding-top:8px;font-family:var(--ts-font-mono);font-size:11.5px;color:var(--ts-ink2)}
.ts-cc[data-meta-font=text] .ts-cc__meta{font-family:var(--ts-font);font-size:12.5px}
.ts-cc__check{position:absolute;top:14px;right:14px;width:20px;height:20px;display:grid;place-items:center;box-shadow:inset 0 0 0 1.5px var(--ts-line);
  transition:background-color .2s,box-shadow .2s;color:var(--ts-accent-ink)}
.ts-cc__card.is-on .ts-cc__check{background:var(--ts-accent);box-shadow:none}
/* phone: one column of horizontal cards (icon, copy, price, check) instead of a 2 + 1 wrap */
@media (max-width:640px){
  .ts-cc__grid{grid-template-columns:minmax(0,1fr) !important;max-width:none !important}
  .ts-cc__card{display:grid;grid-template-columns:auto minmax(0,1fr) auto auto;grid-template-areas:"icon title meta check" "icon desc desc check";
    column-gap:12px;row-gap:2px;align-items:center;padding:14px 14px 14px 14px;min-height:72px}
  .ts-cc__icon{grid-area:icon;width:40px;height:40px;margin:0}
  .ts-cc__title{grid-area:title}
  .ts-cc__desc{grid-area:desc;font-size:13px}
  .ts-cc__meta{grid-area:meta;margin:0;padding:0;font-size:12px;text-align:right;white-space:nowrap}
  .ts-cc__check{grid-area:check;position:relative;top:auto;right:auto;width:22px;height:22px}
  .ts-cc__card:not(:has(.ts-cc__icon)){grid-template-areas:"title title meta check" "desc desc desc check"}
}
`;
registerStyles("ts-choice-cards", CSS);

const EMPTY = [];
const asSet = (v) => new Set(v == null || v === "" ? [] : [].concat(v));

/**
 * ChoiceCards — radio cards (pick one) or checkbox cards (pick many), built on native inputs
 * so keyboard, screen readers and forms behave natively. Single mode is one radio group: one Tab stop, arrow keys
 * move and select. Multiple mode is a checkbox group with one Tab stop: arrow keys move, Space toggles.
 * Signature: the chosen card lifts and its check draws itself in.
 * Controlled with `value` + `onChange`, or uncontrolled from `defaultValue`. Inside a <form> the inputs carry
 * `name`, and a form reset returns to `defaultValue`.
 * The ref is the <fieldset>; calling its .focus() moves focus to the checked card, else the first enabled one.
 */
export const ChoiceCards = forwardRef(function ChoiceCards({
  items,
  mode = "single",
  columns = 3,
  legend = "",
  legendHint,
  showIcons = true,
  showMeta = true,
  metaFont = "mono",
  defaultValue,
  value,
  onChange,
  name,
  id,
  required = false,
  disabled = false,
  error,
  demo = false,
  forceState,
  className,
  style,
  ...rest
}, ref) {
  const sheetTag = useStyles("ts-choice-cards", CSS);
  const sheetTag2 = useFieldStyles();
  const reduce = useReducedMotion();
  const autoName = useId();
  const errId = useId();
  const cardId = useId();
  const groupName = name || autoName;
  const multi = mode === "multiple";
  const list = items ?? (demo ? DEMO_ITEMS : EMPTY);
  const shownLegend = legend || (demo ? "Choose a plan" : "");
  const initial = defaultValue !== undefined ? defaultValue : demo && !items ? "team" : undefined;
  // controlled when `value` is passed (a value, or an array in multiple mode); otherwise it keeps its own
  const [inner, setSel] = useState(() => asSet(initial));
  const sel = value !== undefined ? asSet(value) : inner;
  const isDisabled = disabled || forceState === "disabled";
  const off = (it) => isDisabled || !!it.disabled;
  const [pressed, setPressed] = useState(null);
  const [epoch, setEpoch] = useState(0);
  const [focusV, setFocusV] = useState(null);
  const root = useRef(null);
  const inputs = useRef({});
  // the ref stays the <fieldset>; its own .focus() is redirected to the card a keyboard user would land on:
  // the checked one (first checked in multiple mode), else the first enabled one
  const focusTarget = useRef(() => null);
  const setRef = useCallback((el) => {
    if (el && !Object.prototype.hasOwnProperty.call(el, "focus")) {
      el.focus = (opts) => { const t = focusTarget.current(); if (t) t.focus(opts); else HTMLElement.prototype.focus.call(el, opts); };
    }
    root.current = el;
    if (typeof ref === "function") ref(el);
    else if (ref) ref.current = el;
  }, [ref]);

  const emit = (next, it) => {
    if (value === undefined) setSel(next);
    onChange?.(multi ? [...next] : [...next][0] ?? null, it);
  };
  const change = (it) => {
    const v = it.value;
    const next = new Set(multi ? sel : []);
    if (multi && sel.has(v)) next.delete(v); else next.add(v);
    emit(next, it);
  };

  // form reset: back to defaultValue (the inputs are controlled, so the browser's own reset would not stick)
  const resetTo = useRef(initial);
  resetTo.current = initial;
  // remount the inputs after the browser's reset so their checked state follows ours, not the reset's
  const onResetRef = useRef(null);
  onResetRef.current = () => { emit(asSet(resetTo.current), null); setEpoch((n) => n + 1); };
  useEffect(() => {
    const form = root.current?.form;
    if (!form) return;
    const onReset = () => onResetRef.current();
    form.addEventListener("reset", onReset);
    return () => form.removeEventListener("reset", onReset);
  }, []);   // once: a listener re-added mid-dispatch (another field's reset re-rendering the page) never runs

  // multiple + required: at least one box must be ticked (native `required` on a checkbox would demand every one)
  const firstBox = list.find((it) => !off(it))?.value;
  useEffect(() => {
    if (!multi) return;
    const el = inputs.current[firstBox];
    if (el) el.setCustomValidity(required && sel.size === 0 ? "Choose at least one option." : "");
  });

  // multiple mode: one Tab stop for the group, arrow keys move between boxes (radios do this natively)
  const enabled = list.filter((it) => !off(it));
  const tabV = enabled.some((it) => it.value === focusV) ? focusV : (enabled.find((it) => sel.has(it.value)) ?? enabled[0])?.value;
  focusTarget.current = () => {
    const v = (enabled.find((it) => sel.has(it.value)) ?? enabled[0])?.value;
    return v === undefined ? null : inputs.current[v] ?? null;
  };
  const onKey = (e) => {
    rest.onKeyDown?.(e);
    if (!multi || !enabled.length) return;
    const keys = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
    let i = enabled.findIndex((it) => it.value === tabV);
    if (e.key in keys) i = (i + keys[e.key] + enabled.length) % enabled.length;
    else if (e.key === "Home") i = 0;
    else if (e.key === "End") i = enabled.length - 1;
    else return;
    e.preventDefault();
    setFocusV(enabled[i].value);
    inputs.current[enabled[i].value]?.focus();
  };

  if (!list.length && !shownLegend) return null;
  const hint = legendHint !== undefined ? legendHint : multi ? "pick any" : "";
  const describedBy = [rest["aria-describedby"], error ? errId : null].filter(Boolean).join(" ") || undefined;
  const minCol = columns >= 3 ? 150 : 200;
  const cols = Math.max(1, columns);

  return (
    <>{sheetTag}{sheetTag2}<fieldset
      ref={setRef}
      id={id}
      {...rest}
      className={"ts-cc" + (error ? " is-error" : "") + (className ? " " + className : "")}
      style={style}
      data-meta-font={metaFont === "text" ? "text" : undefined}
      disabled={isDisabled}
      aria-describedby={describedBy}
      onKeyDown={onKey}
    >
      {shownLegend && <legend>{shownLegend}{hint && <span style={{ color: "var(--ts-ink2)", fontWeight: 400 }}> · {hint}</span>}</legend>}
      <div className="ts-cc__grid" style={{ gridTemplateColumns: `repeat(auto-fit, minmax(max(${minCol}px, calc((100% - ${(cols - 1) * 10}px) / ${cols})), 1fr))` }}>
        {list.map((it, i) => {
          const on = sel.has(it.value) || (forceState === "selected" && i === 0);
          const force = i === 0 && ["hover", "focus"].includes(forceState) ? forceState : undefined;
          const itemOff = off(it);
          const icon = typeof it.icon === "string" ? <Icon name={it.icon} size={17} /> : it.icon;
          return (
            <motion.label
              key={it.value}
              className={"ts-cc__card" + (on ? " is-on" : "") + (itemOff ? " is-disabled" : "")}
              data-force={force}
              animate={{ y: on && !reduce ? -3 : 0, scale: pressed === it.value && !reduce ? 0.98 : 1 }}
              transition={{ type: "spring", stiffness: 420, damping: 28 }}
              onPointerDown={() => !itemOff && setPressed(it.value)}
              onPointerUp={() => setPressed(null)}
              onPointerLeave={() => setPressed(null)}
              onPointerCancel={() => setPressed(null)}
            >
              {/* named by the title alone; the description and the meta line follow as its description */}
              <input
                key={epoch}
                ref={(el) => { inputs.current[it.value] = el; }}
                type={multi ? "checkbox" : "radio"}
                name={groupName}
                value={it.value}
                checked={on}
                disabled={itemOff}
                required={!multi && required}
                aria-invalid={error ? true : undefined}
                aria-labelledby={cardId + i + "t"}
                aria-describedby={[it.description ? cardId + i + "d" : null, showMeta && it.meta ? cardId + i + "m" : null].filter(Boolean).join(" ") || undefined}
                tabIndex={multi ? (it.value === tabV ? 0 : -1) : undefined}
                onFocus={() => setFocusV(it.value)}
                onChange={() => change(it)}
              />
              <span className="ts-cc__check" aria-hidden style={{ borderRadius: multi ? 6 : 99 }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
                  <motion.path d="M5 12.5l4.5 4.5L19 7.5" initial={false} animate={{ pathLength: on ? 1 : 0, opacity: on ? 1 : 0 }} transition={{ duration: reduce ? 0 : 0.28, ease: [0.2, 0.8, 0.2, 1] }} />
                </svg>
              </span>
              {showIcons && icon && <span className="ts-cc__icon">{icon}</span>}
              <span id={cardId + i + "t"} className="ts-cc__title">{it.title}</span>
              {it.description && <span id={cardId + i + "d"} className="ts-cc__desc">{it.description}</span>}
              {showMeta && it.meta && <span id={cardId + i + "m"} className="ts-cc__meta">{it.meta}</span>}
            </motion.label>
          );
        })}
      </div>
      {error && <div className="ts-cc__err"><FieldMessage id={errId} error={error} /></div>}
    </fieldset></>
  );
});
