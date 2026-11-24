"use client";
import { forwardRef, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence, animate, useAnimationControls, useIsPresent, useMotionValue } from "motion/react";
import { Combobox as BaseCombobox } from "@base-ui/react/combobox";
import { Autocomplete as BaseAutocomplete } from "@base-ui/react/autocomplete";
import { registerStyles, useStyles, useIsoLayoutEffect, useReducedMotion, useLocale } from "../_shared/theme.jsx";
import { useFieldStyles, useLabelStyles, useFieldIds, useShake, useRevealErrors, FieldLabel, FieldMessage } from "../_shared/field.jsx";
import { LayerHost } from "../_shared/overlay.jsx";
import { Icon } from "../_shared/icons.jsx";

// A damped spring (stiffness 420, damping 30, zeta 0.73, about 3% overshoot, settles in 370ms) sampled into a CSS
// easing. The popup, the chevron, the rows that move when the list filters and the list's height all use it, so they
// are time-based (the same at 60 and 120 Hz) and can be interrupted mid-flight. While a row slides after a filter, the
// highlight on it rides a copy of that row's animation.
const SPRING = "linear(0,0.025,0.0887,0.1767,0.2779,0.3835,0.4872,0.5848,0.6734,0.7514,0.8183,0.8742,0.9196,0.9555,0.983,1.0033,1.0174,1.0266,1.0318,1.034,1.034,1.0323,1.0296,1.0263,1.0228,1.0192,1.0157,1.0125,1.0097,1.0072,1.0051,1.0034,1)";
const SPRING_MS = 370;

const CSS = `
.ts-combo{--combo-spring:${SPRING}}
.ts-combo .ts-combo__shake{display:block}
.ts-field.ts-combo .ts-box{min-height:var(--combo-h);padding:0 var(--combo-pr) 0 14px;cursor:text;gap:10px;
  transition:box-shadow .18s,background-color .18s,transform .37s var(--combo-spring)}
.ts-combo .ts-box:has(.ts-combo__chev:active):not(.is-disabled):not(.is-readonly){transform:scale(.992);background:color-mix(in srgb,var(--ts-surface) 96%,var(--ts-ink))}
.ts-combo .ts-box.is-open{box-shadow:inset 0 0 0 1.5px var(--ts-focus),0 0 0 4px color-mix(in srgb,var(--ts-focus) 16%,transparent)}
.ts-combo .ts-box.is-open .ts-flabel{color:var(--ts-focus)}
.ts-combo .ts-box.is-error.is-open{box-shadow:inset 0 0 0 1.5px var(--ts-danger),0 0 0 4px color-mix(in srgb,var(--ts-danger) 14%,transparent)}
.ts-combo .ts-box.is-error .ts-flabel{color:var(--ts-danger)}
.ts-combo .ts-box.is-readonly{cursor:default}
.ts-combo.has-lead{--fl-left:44px}
.ts-combo__lead{flex:none;display:grid;place-items:center;color:var(--ts-ink2)}
.ts-combo.is-label-float .ts-combo__lead{margin-top:var(--combo-pt)}
.ts-combo__input.ts-input{align-self:stretch;min-height:var(--combo-h);box-sizing:border-box;font-family:var(--ts-font);font-size:var(--combo-fs);text-overflow:ellipsis}
.ts-field.ts-combo.is-label-float .ts-combo__input.ts-input{padding-top:var(--combo-pt)}
.ts-field.ts-combo.is-label-float.is-nolabel .ts-combo__input.ts-input{padding-top:0}
.ts-combo__input[readonly]{cursor:default}
.ts-combo__input:disabled{cursor:not-allowed}
.ts-combo__chev{all:unset;position:absolute;right:7px;top:50%;margin-top:-15px;width:30px;height:30px;display:grid;place-items:center;border-radius:var(--ts-radius-sm);
  color:var(--ts-ink2);cursor:pointer;-webkit-tap-highlight-color:transparent}
.ts-combo__chev:hover{color:var(--ts-ink)}
.ts-combo__chev > span{display:grid;transition:transform .37s var(--combo-spring)}
.ts-combo .ts-box.is-open .ts-combo__chev > span{transform:rotate(180deg)}
.ts-combo__chev::after{content:"";position:absolute;inset:-4px}
.ts-combo__clear{position:absolute;right:38px;top:50%;margin-top:-15px;z-index:1}
.ts-combo__clear::after{content:"";position:absolute;inset:-4px}
.ts-combo.is-multi .ts-box{padding:var(--combo-mpad) var(--combo-pr) var(--combo-mpad) 8px;align-items:center}
.ts-field.ts-combo.is-multi.is-label-float .ts-box{padding-top:calc(var(--combo-pt) + 8px);padding-bottom:max(2px,calc(var(--combo-mpad) - 2px))}
.ts-field.ts-combo.is-multi.is-label-float.is-nolabel .ts-box{padding-top:var(--combo-mpad)}
.ts-combo__chips{flex:1;min-width:0;display:flex;flex-wrap:wrap;align-items:center;gap:6px}
.ts-field.ts-combo.is-multi .ts-combo__input.ts-input{flex:1 1 56px;min-width:56px;min-height:var(--combo-chip);height:var(--combo-chip);padding:0 6px}
.ts-combo-chipwrap{display:inline-flex;max-width:100%;min-width:0}
.ts-combo-chipwrap.is-leaving{overflow:hidden}
.ts-combo-chip{display:inline-flex;align-items:center;gap:4px;height:var(--combo-chip);padding:0 4px 0 10px;border-radius:99px;font-size:13px;font-weight:520;
  background:var(--ts-surface2);color:var(--ts-ink);box-shadow:inset 0 0 0 1px var(--ts-line);white-space:nowrap;user-select:none;max-width:100%;box-sizing:border-box;outline:0}
.ts-combo-chip:focus-visible{box-shadow:inset 0 0 0 1.5px var(--ts-focus)}
.ts-combo-chip > span{overflow:hidden;text-overflow:ellipsis}
.ts-combo.is-ro .ts-combo-chip,.ts-combo-chip.is-static{padding-right:10px}
.ts-combo-chip__x{all:unset;position:relative;flex:none;display:grid;place-items:center;width:22px;height:22px;border-radius:99px;color:var(--ts-ink2);cursor:pointer}
.ts-combo-chip__x:hover{color:var(--ts-ink);background:color-mix(in srgb,var(--ts-ink) 10%,transparent)}
.ts-combo-chip__x:focus-visible{outline:2px solid var(--ts-focus);outline-offset:1px}
.ts-combo-chip__x::after{content:"";position:absolute;inset:-6px -4px}
.ts-combo-pos{z-index:1;outline:0}
.ts-combo-pop{--combo-spring:${SPRING};box-sizing:border-box;position:relative;min-width:max(var(--anchor-width),180px);max-width:min(var(--available-width),calc(100vw - 16px));overflow:hidden;
  font-family:var(--ts-font);color:var(--ts-ink);background:var(--ts-surface);border-radius:calc(var(--ts-radius-md) + 2px);outline:0;
  box-shadow:0 0 0 1px var(--ts-line),0 18px 44px -12px color-mix(in srgb,var(--ts-bg) 70%,var(--ts-black) 30%);
  transform-origin:var(--transform-origin);transition:transform .37s var(--combo-spring),opacity .16s ease-out}
.ts-combo-pop.is-match{width:var(--anchor-width)}
.ts-combo-pop:not(.is-match){max-width:min(360px,var(--available-width),calc(100vw - 16px))}
.ts-combo-pop[data-starting-style]{opacity:0;transform:scale(.97,.9)}
.ts-combo-pop[data-ending-style]{opacity:0;transform:scale(.985,.95);transition:transform .14s cubic-bezier(.4,0,1,1),opacity .14s cubic-bezier(.4,0,1,1)}
.ts-combo-list{position:relative;box-sizing:border-box;padding:5px;max-height:min(var(--combo-max),var(--available-height));overflow-y:auto;overscroll-behavior:contain;outline:0;scroll-padding-block:28px}
.ts-combo-list.is-busy .ts-combo-group,.ts-combo-list.is-busy .ts-combo-pill{opacity:.5;transition:opacity .2s}
.ts-combo-pill{position:absolute;top:0;left:5px;right:5px;z-index:0;pointer-events:none;background:color-mix(in srgb,var(--ts-ink) 8%,transparent);will-change:clip-path,opacity}
.ts-combo-ghosts{position:absolute;top:0;left:5px;right:5px;height:0;z-index:1;pointer-events:none}
.ts-combo-ghosts > *{position:absolute;left:0;right:0;margin:0;animation:none}
.ts-combo-opt{position:relative;z-index:1;box-sizing:border-box;display:flex;align-items:center;gap:10px;min-height:36px;padding:7px 10px;border-radius:var(--ts-radius-sm);
  font-size:14px;line-height:1.3;color:var(--ts-ink);cursor:default;outline:0;user-select:none;-webkit-user-select:none}
.ts-combo-pop.is-fresh .ts-combo-opt{animation:ts-combo-in .26s cubic-bezier(.2,.8,.2,1) both;animation-delay:calc(var(--i,0) * 16ms)}
@keyframes ts-combo-in{from{opacity:0;transform:translateY(-4px)}}
.ts-combo-opt > svg{color:var(--ts-ink2);flex:none}
.ts-combo-opt__text{display:flex;flex-direction:column;gap:2px;flex:1;min-width:0}
.ts-combo-opt__label{font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;transition:color .18s}
.ts-combo-opt__label.is-q{color:var(--ts-ink2)}
.ts-combo-mark{position:relative;background:none;color:var(--ts-ink);font-weight:inherit}
.ts-combo-mark::after{content:"";position:absolute;left:0;right:0;bottom:-1px;height:1.5px;border-radius:1px;background:var(--ts-accent);transform-origin:left center;
  animation:ts-combo-wipe .22s cubic-bezier(.2,.8,.2,1) both}
@keyframes ts-combo-wipe{from{transform:scaleX(0)}}
.ts-combo-opt__desc{font-size:12.5px;color:var(--ts-ink2);line-height:1.35}
.ts-combo-opt[data-selected] .ts-combo-opt__label{font-weight:620}
.ts-combo-opt[data-disabled]{cursor:not-allowed}
.ts-combo-opt[data-disabled] .ts-combo-opt__label{color:var(--ts-ink2)}
.ts-combo-opt[data-disabled] > svg,.ts-combo-opt[data-disabled] .ts-combo-opt__label{opacity:.7}
.ts-combo-opt.is-create{color:var(--ts-ink)}
.ts-combo-opt.is-create > svg{color:var(--ts-accent)}
.ts-combo-tick{flex:none;width:16px;height:16px;display:grid;place-items:center;color:var(--ts-accent)}
.ts-combo-tick.is-fresh path{stroke-dasharray:1;stroke-dashoffset:1;animation:ts-combo-draw .28s cubic-bezier(.65,0,.35,1) .04s forwards}
@keyframes ts-combo-draw{to{stroke-dashoffset:0}}
.ts-combo-group + .ts-combo-group{margin-top:4px;padding-top:4px;box-shadow:inset 0 1px 0 var(--ts-line)}
.ts-combo-group__label{position:sticky;top:-5px;z-index:2;margin:0 -5px;padding:9px 15px 5px;background:var(--ts-surface);font-family:var(--ts-font-mono);font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:var(--ts-ink2)}
.ts-combo-note{display:flex;align-items:center;gap:8px;padding:10px;font-size:13.5px;color:var(--ts-ink2);overflow-wrap:anywhere}
.ts-combo-skel{display:flex;align-items:center;height:36px;padding:0 10px}
.ts-combo-skel i{display:block;height:11px;border-radius:6px;background:linear-gradient(90deg,color-mix(in srgb,var(--ts-ink) 7%,transparent),color-mix(in srgb,var(--ts-ink) 14%,transparent),color-mix(in srgb,var(--ts-ink) 7%,transparent));background-size:200% 100%;animation:ts-combo-shim 1.3s linear infinite}
@keyframes ts-combo-shim{from{background-position:100% 0}to{background-position:-100% 0}}
.ts-combo-bar{position:absolute;top:0;left:0;right:0;z-index:4;height:2px;overflow:hidden;pointer-events:none}
.ts-combo-bar::before{content:"";position:absolute;top:0;bottom:0;left:0;width:36%;border-radius:2px;background:var(--ts-accent);animation:ts-combo-bar 1.1s cubic-bezier(.45,0,.25,1) infinite}
@keyframes ts-combo-bar{from{transform:translateX(-100%)}to{transform:translateX(290%)}}
.ts-combo-fade{position:absolute;left:0;right:0;z-index:3;height:22px;pointer-events:none;opacity:0;transition:opacity .16s}
.ts-combo-fade.is-top{top:0;background:linear-gradient(var(--ts-surface),transparent)}
.ts-combo-fade.is-bottom{bottom:0;background:linear-gradient(transparent,var(--ts-surface))}
.ts-combo-pop.is-scroll-up .ts-combo-fade.is-top,.ts-combo-pop.is-scroll-down .ts-combo-fade.is-bottom{opacity:1}
.ts-combo-ava{flex:none;display:grid;place-items:center;width:24px;height:24px;border-radius:99px;font-size:11px;font-weight:650;letter-spacing:.02em;
  background:color-mix(in srgb,var(--ava) 22%,var(--ts-surface));color:color-mix(in srgb,var(--ava) 70%,var(--ts-ink))}
@media (max-width:640px),(pointer:coarse){
  .ts-field.ts-combo .ts-box{min-height:var(--combo-ht)}
  .ts-combo__input.ts-input{min-height:var(--combo-ht);font-size:16px}
  .ts-combo-opt{min-height:44px;font-size:15px}
  .ts-combo__clear::after{inset:-7px}
  .ts-combo__chev::after{inset:-7px}
  .ts-combo-chip{height:36px;padding:0 0 0 12px;font-size:14px;gap:0}
  .ts-combo.is-ro .ts-combo-chip,.ts-combo-chip.is-static{padding-right:12px}
  .ts-combo-chip__x{width:36px;height:36px}
  .ts-combo-chip__x::after{inset:-4px}
  .ts-field.ts-combo.is-multi .ts-combo__input.ts-input{height:36px;min-height:36px;font-size:16px}
}
.ts-combo.is-calm .ts-box,.ts-combo.is-calm .ts-combo__chev > span{transition:box-shadow .18s,background-color .18s}
.ts-combo.is-calm .ts-box:has(.ts-combo__chev:active){transform:none}
.ts-combo-pop.is-calm,.ts-combo-pop.is-calm[data-starting-style],.ts-combo-pop.is-calm[data-ending-style]{transform:none;transition:opacity .14s}
.ts-combo-pop.is-calm .ts-combo-opt{animation:none}
.ts-combo-pop.is-calm .ts-combo-tick.is-fresh path{animation:none;stroke-dashoffset:0}
.ts-combo-pop.is-calm .ts-combo-mark::after,.ts-combo-pop.is-calm .ts-combo-skel i{animation:none}
.ts-combo-pop.is-calm .ts-combo-bar::before{animation:none;width:100%;opacity:.5}
@media (prefers-reduced-motion:reduce){
  .ts-combo .ts-box,.ts-combo__chev > span{transition:box-shadow .18s,background-color .18s}
  .ts-combo .ts-box:has(.ts-combo__chev:active){transform:none}
  .ts-combo-pop,.ts-combo-pop[data-starting-style],.ts-combo-pop[data-ending-style]{transform:none;transition:opacity .14s}
  .ts-combo-opt,.ts-combo-skel i,.ts-combo-mark::after{animation:none}
  .ts-combo-pop.is-fresh .ts-combo-opt{animation:none}
  .ts-combo-tick.is-fresh path{animation:none;stroke-dashoffset:0}
  .ts-combo-bar::before{animation:none;width:100%;opacity:.5}
  .ts-combo-opt__label{transition:none}
}
`;
registerStyles("ts-combobox", CSS);

// The field family's heights (Select and Text Field): "above" matches Button at the ends and Text Field's 48 at md,
// "float" matches Text Field's 56 at md. *T is the touch height. chip is the height of a chip with `multiple`.
const SIZES = {
  sm: { above: 34, float: 48, aboveT: 44, floatT: 48, fs: 13.5, pt: 14, chip: 24, mpad: 4 },
  md: { above: 48, float: 56, aboveT: 52, floatT: 56, fs: 15, pt: 16, chip: 30, mpad: 8 },
  lg: { above: 52, float: 64, aboveT: 52, floatT: 64, fs: 16, pt: 18, chip: 34, mpad: 8 },
};

/** English copy. Each entry may be a string ({query}, {label} and {count} are filled in) or a function. */
export const DEFAULT_LABELS = {
  clear: "Clear",
  toggle: "Show options",
  empty: "No results for “{query}”",
  none: "No options",
  create: "Create “{query}”",
  loading: "Loading options",
  remove: "Remove {label}",
  required: "Choose an option",
  results: (count, formatted) => (count === 1 ? "1 result" : `${formatted} results`),
};

const OPEN_REASONS = { "trigger-press": "trigger", "input-press": "input", "input-change": "typing", "item-press": "select", "escape-key": "escape", "outside-press": "outside", "focus-out": "blur", "list-navigation": "keyboard", "input-clear": "clear", "clear-press": "clear", "imperative-action": "api" };

// sample content, shown only with `demo` (an invented issue tracker: assigning an issue, and where someone is based)
// (series 4, the yellow, is left out: its initials fall under 4.5:1 on its own tint in light mode)
const ava = (initials, n) => <span className="ts-combo-ava" style={{ "--ava": `var(--ts-series-${n})` }} aria-hidden>{initials}</span>;
const DEMO = {
  pick: {
    label: "Assign to",
    hint: "They get a notification and the issue moves to their queue.",
    placeholder: "Search people",
    defaultValue: "maya",
    multiLabel: "Reviewers",
    multiValue: ["maya", "hana"],
    query: "ma",
    options: [
      { label: "Design", options: [
        { value: "maya", label: "Maya Okafor", description: "Product designer", icon: ava("MO", 1) },
        { value: "jonas", label: "Jonas Lindqvist", description: "Design lead", icon: ava("JL", 2) },
        { value: "priya", label: "Priya Raman", description: "UX researcher", icon: ava("PR", 3) },
      ] },
      { label: "Engineering", options: [
        { value: "mateo", label: "Mateo Álvarez", description: "Frontend engineer", icon: ava("MÁ", 8) },
        { value: "hana", label: "Hana Sato", description: "Platform engineer", icon: ava("HS", 5) },
        { value: "tomas", label: "Tomás Silva", description: "Mobile engineer, on leave until Monday", icon: ava("TS", 7), disabled: true },
      ] },
      { label: "Support", options: [
        { value: "marta", label: "Marta Kowalska", description: "Support lead", icon: ava("MK", 6), keywords: ["customer"] },
        { value: "elif", label: "Elif Demir", description: "Customer success", icon: ava("ED", 2) },
      ] },
    ],
  },
  suggest: {
    label: "City",
    hint: "Pick a suggestion or type a city that isn't listed.",
    placeholder: "Where are they based?",
    defaultValue: "Lisbon",
    query: "be",
    options: ["Amsterdam", "Barcelona", "Bergen", "Berlin", "Bern", "Copenhagen", "Kraków", "Lisbon", "Málaga", "Porto", "São Paulo", "Toronto"],
  },
};

const CREATE = Object.freeze({ create: true });
const setRef = (r, el) => { if (typeof r === "function") r(el); else if (r) r.current = el; };
const isGroup = (o) => o && typeof o === "object" && Array.isArray(o.options);
const toOption = (o) => (typeof o === "string" || typeof o === "number" ? { value: o, label: String(o) } : { ...o, label: o.label ?? String(o.value) });
const textOf = (o) => (typeof o.label === "string" || typeof o.label === "number" ? String(o.label) : String(o.value));
const asArray = (v) => (Array.isArray(v) ? v : v == null ? [] : [v]);
const keyOf = (v) => (v === CREATE ? "\u0000create" : typeof v + ":" + String(v));
const fill = (l, vars, ...args) => (typeof l === "function" ? l(...args) : String(l ?? "").replace(/\{(\w+)\}/g, (m, k) => (k in vars ? vars[k] : m)));

/** Options in, plain blocks out: [{ label?, items: [option] }], plus a flat list in display order. */
function normalize(options) {
  const flat = [];
  const blocks = [];
  let loose = null;
  for (const o of options ?? []) {
    if (o == null) continue;
    if (isGroup(o)) {
      loose = null;
      blocks.push({ label: o.label, items: o.options.filter((x) => x != null).map((x) => { const it = toOption(x); flat.push(it); return it; }) });
    } else {
      if (!loose) { loose = { items: [] }; blocks.push(loose); }
      const it = toOption(o);
      flat.push(it);
      loose.items.push(it);
    }
  }
  return { flat, blocks, grouped: blocks.some((b) => b.label != null) };
}

const WORD = /[\p{L}\p{N}]/u;
/**
 * Where `query` matches in `text`: [start, end] or null. Accent- and case-insensitive through a base-sensitivity
 * collator in the reader's locale; `anywhere` false matches only at the start of a word ("ber" finds Berlin and
 * "New Bern", not "Amber").
 */
function finder(locale) {
  const coll = new Intl.Collator(locale, { sensitivity: "base", usage: "search" });
  return (text, query, anywhere = false) => {
    const s = String(text).normalize("NFC");
    const q = String(query).normalize("NFC");
    const n = q.length;
    if (!n) return null;
    for (let i = 0; i + n <= s.length; i++) {
      if (!anywhere && i > 0 && WORD.test(s[i - 1]) && WORD.test(s[i])) continue;
      if (coll.compare(s.slice(i, i + n), q) === 0) return [i, i + n];
    }
    return null;
  };
}

function Tick({ fresh }) {
  return (
    <span className={"ts-combo-tick" + (fresh ? " is-fresh" : "")} aria-hidden>
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3.5 8.4 6.6 11.4 12.6 4.8" pathLength="1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
    </span>
  );
}

/** The label with the typed part marked: full ink and an underline that wipes in, the rest a step quieter. */
function Marked({ text, range, query }) {
  if (!range) return <span className={"ts-combo-opt__label" + (query ? " is-q" : "")}>{text}</span>;
  const s = String(text).normalize("NFC");
  return (
    <span className="ts-combo-opt__label is-q">
      {s.slice(0, range[0])}<mark key={query} className="ts-combo-mark">{s.slice(range[0], range[1])}</mark>{s.slice(range[1])}
    </span>
  );
}

/** One option row. Registers itself for the re-forming list and tells the shared highlight where it is. */
function Row({ props, state, opt, ctx, k, order }) {
  const el = useRef(null);
  useIsoLayoutEffect(() => {
    if (state.highlighted) ctx.highlight(el.current, k);
    else ctx.unhighlight(k);
  }, [state.highlighted]);
  const meta = { selected: state.selected, highlighted: state.highlighted, disabled: state.disabled, query: ctx.query };
  const create = opt === CREATE;
  return (
    <div {...props} ref={(n) => { el.current = n; ctx.track(k, n); setRef(props.ref, n); }} className={"ts-combo-opt" + (create ? " is-create" : "")} style={{ "--i": Math.min(order, 10) }}>
      {create ? (
        <>
          <Icon name="plus" size={18} />
          <span className="ts-combo-opt__text"><span className="ts-combo-opt__label">{ctx.createText}</span></span>
        </>
      ) : ctx.renderOption ? ctx.renderOption(opt, meta) : (
        <>
          {typeof opt.icon === "string" ? <Icon name={opt.icon} size={18} /> : opt.icon ?? null}
          <span className="ts-combo-opt__text">
            {typeof opt.label === "string" || typeof opt.label === "number" ? <Marked text={opt.label} range={ctx.range(opt)} query={ctx.query} /> : <span className="ts-combo-opt__label">{opt.label}</span>}
            {opt.description && <span className="ts-combo-opt__desc">{opt.description}</span>}
          </span>
        </>
      )}
      {ctx.pick && !create && (state.selected ? <Tick fresh={ctx.fresh.has(opt.value)} /> : <span className="ts-combo-tick" aria-hidden />)}
    </div>
  );
}

/** A chip with `multiple`: enters with a small spring, leaves by collapsing. While leaving it is a plain span, so the
 *  library's chip navigation and Backspace never count a chip that is on its way out. */
function Chip({ B, opt, label, removeLabel, removable, reduce }) {
  const present = useIsPresent();
  const content = <span>{label}</span>;
  return (
    <motion.span
      className={"ts-combo-chipwrap" + (present ? "" : " is-leaving")}
      initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.6 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={reduce ? { opacity: 0, transition: { duration: 0.12 } } : { opacity: 0, scale: 0.85, width: 0, marginRight: -6, transition: { duration: 0.2, ease: [0.4, 0, 0.2, 1] } }}
      transition={{ type: "spring", stiffness: 600, damping: 32 }}
    >
      {present ? (
        <B.Chip className={"ts-combo-chip" + (removable ? "" : " is-static")} aria-label={typeof opt.label === "string" ? opt.label : undefined}>
          {content}
          {removable && <B.ChipRemove className="ts-combo-chip__x" aria-label={removeLabel}><Icon name="x" size={13} stroke={2.2} /></B.ChipRemove>}
        </B.Chip>
      ) : <span className={"ts-combo-chip" + (removable ? "" : " is-static")}>{content}{removable && <span className="ts-combo-chip__x" aria-hidden><Icon name="x" size={13} stroke={2.2} /></span>}</span>}
    </motion.span>
  );
}

/**
 * Combobox — choose from a list by typing: a country among 200, an assignee, a tag, a city. Two modes:
 * pick (the value is one of the options; leaving without picking restores the chosen label) and suggest
 * (`allowCustom`: the value is the text and the list only suggests). It is a form field and matches Text Field and
 * Select at rest; its popup is Select's. Keyboard and screen-reader behaviour come from @base-ui/react.
 * Signature: the list re-forms as you type. Rows that stay slide to their new places on a spring, rows that leave fade
 * where they were, rows that return fade in, and the popup's height springs to fit; one highlight travels with the
 * row it sits on; the typed part of each label is marked with an underline that wipes in. Only rows in view move, so
 * 500 options stay quick. Reduced motion: the popup fades, rows and highlight swap in place.
 * The ref and unknown props (aria-*, data-*, onKeyDown…) go to the <input>.
 */
export const Combobox = forwardRef(function Combobox({
  options,
  value: valueProp,
  defaultValue = null,
  onChange,
  inputValue: inputValueProp,
  defaultInputValue,
  onInputChange,
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  allowCustom = false,
  creatable = false,
  onCreate,
  filter,
  openOnFocus = true,
  autoHighlight = true,
  clearable = false,
  multiple = false,
  loading = false,
  minChars = 0,
  placeholder = "",
  label = "",
  labelPlacement = "float",
  hint = "",
  error: errorProp,
  revealErrors = 0,
  name,
  id,
  autoComplete = "off",
  required = false,
  disabled = false,
  readOnly = false,
  size = "md",
  maxWidth = 380,
  fullWidth = false,
  placement = "bottom-start",
  matchTriggerWidth = true,
  maxHeight = 320,
  labels: labelsProp,
  renderOption,
  renderValue,
  demo = false,
  forceState,
  className,
  style,
  ...rest
}, ref) {
  const sheetTag = useFieldStyles();
  const sheetTag2 = useLabelStyles();
  const sheetTag3 = useStyles("ts-combobox", CSS);
  const reduce = useReducedMotion();
  const locale = useLocale();
  const ids = useFieldIds();
  const inputId = id || ids.input;
  const shake = useShake();
  const controls = useAnimationControls();
  const labels = { ...DEFAULT_LABELS, ...labelsProp };
  const suggest = !!allowCustom;
  const multi = !!multiple && !suggest;
  const B = suggest ? BaseAutocomplete : BaseCombobox;

  // demo content: people to assign in pick mode, cities in suggest mode
  const useDemo = demo && options === undefined;
  const D = suggest ? DEMO.suggest : DEMO.pick;
  const text0 = label || (useDemo ? (multi ? D.multiLabel : D.label) : "");
  const helper = hint || (useDemo ? D.hint : "");
  const ph = placeholder || (useDemo ? D.placeholder : "");
  const { flat, blocks, grouped } = useMemo(() => normalize(useDemo ? D.options : options), [useDemo, D, options]);
  const byValue = useMemo(() => new Map(flat.map((o) => [o.value, o])), [flat]);
  const labelOf = (v) => (v == null ? "" : byValue.has(v) ? textOf(byValue.get(v)) : String(v));
  const find = useMemo(() => finder(locale), [locale]);

  // value (pick mode): controlled when `value` is passed, else kept here; the library always gets it controlled
  const startValue = defaultValue ?? (useDemo && !suggest ? (multi ? D.multiValue : D.defaultValue) : null);
  const initial = multi ? asArray(startValue) : Array.isArray(startValue) ? startValue[0] ?? null : startValue;
  const [inner, setInner] = useState(initial);
  const controlled = valueProp !== undefined;
  const raw = controlled ? valueProp : inner;
  const value = multi ? asArray(raw) : Array.isArray(raw) ? raw[0] ?? null : raw ?? null;

  // the text in the input. Suggest mode: the text is the value (value / defaultValue, or inputValue). Pick mode: the
  // chosen option's label until the reader types
  const textStart = defaultInputValue ?? (suggest ? (defaultValue ?? (useDemo ? D.defaultValue : "")) : multi ? "" : labelOf(initial));
  const [textInner, setTextInner] = useState(String(textStart ?? ""));
  const textOuter = suggest ? (valueProp !== undefined ? valueProp : inputValueProp) : inputValueProp;
  const textControlled = textOuter !== undefined;
  const text = textControlled ? String(textOuter ?? "") : textInner;
  const has = suggest ? text.trim() !== "" : multi ? value.length > 0 : value != null && value !== "";
  const chosen = !suggest && !multi && has ? byValue.get(value) ?? { value, label: String(value) } : null;
  const chosenLabel = chosen ? textOf(chosen) : "";

  // open: same pattern
  const [openInner, setOpenInner] = useState(defaultOpen);
  const openControlled = openProp !== undefined;
  const isDisabled = disabled || forceState === "disabled";
  const isLoading = loading || forceState === "loading";
  const forcedOpen = forceState === "open" || forceState === "loading" || forceState === "empty";
  const isOpen = !isDisabled && !readOnly && ((openControlled ? !!openProp : openInner) || forcedOpen);
  const [mounted, setMounted] = useState(isOpen);
  const [host, setHost] = useState(null);
  const showLayer = mounted || isOpen;
  const [focused, setFocused] = useState(false);
  const [popFresh, setPopFresh] = useState(true);

  // the query the list is filtered by: what the reader typed since the popup opened (pick mode), or the text
  // (suggest mode). It only changes on typing, so it stays put while the popup closes after a pick.
  const [queryState, setQuery] = useState(suggest ? String(textStart ?? "").trim() : "");
  const typed = useRef(false);
  const emitted = useRef(text);
  // the gallery's "open" and "empty" frames show a typed query
  const forcedQuery = forceState === "empty" ? "zq" : forceState === "open" && useDemo ? D.query : null;
  const query = forcedQuery ?? queryState;
  const shownText = forcedQuery ?? text;

  // switching mode (or demo content) on a live field starts that mode afresh, as a new field would
  const modeKey = (suggest ? "s" : multi ? "m" : "p") + (useDemo ? "d" : "");
  const [modeSeen, setModeSeen] = useState(modeKey);
  if (modeSeen !== modeKey) {
    setModeSeen(modeKey);
    setInner(initial);
    setTextInner(String(textStart ?? ""));
    setQuery(suggest ? String(textStart ?? "").trim() : "");
    emitted.current = String(textStart ?? "");
  }

  const [touched, setTouched] = useState(false);
  let error = errorProp || (touched && required && !has ? labels.required : null);
  if (forceState === "error") error = error || labels.required;
  const s = SIZES[size] ?? SIZES.md;
  const above = labelPlacement === "above";
  const hasLabel = !!text0;
  const floated = !hasLabel || has || shownText !== "" || isOpen || focused || forceState === "focus";
  const hasMsgRow = !!(helper || error || required);

  const fieldRef = useRef(null);
  const boxRef = useRef(null);
  const inputRef = useRef(null);
  const hiddenRef = useRef(null);
  const setInput = useCallback((el) => { inputRef.current = el; setRef(ref, el); }, [ref]);

  // ---- filtering -----------------------------------------------------------------------------------------------
  const custom = typeof filter === "function" ? filter : null;
  const matches = (o) => {
    if (!query) return true;
    if (custom) return !!custom(o, query);
    if (find(textOf(o), query)) return true;
    return Array.isArray(o.keywords) && o.keywords.some((k) => find(k, query));
  };
  const shownBlocks = useMemo(() => {
    if (filter === false || !query) return blocks;
    return blocks.map((b) => ({ ...b, items: b.items.filter(matches) })).filter((b) => b.items.length);
  }, [blocks, query, filter, find]);
  const shownCount = shownBlocks.reduce((n, b) => n + b.items.length, 0);
  const exact = query && flat.some((o) => find(textOf(o), query) && textOf(o).normalize("NFC").length === query.normalize("NFC").length);
  const showCreate = creatable && !!query && !exact && !isLoading;
  const createText = fill(labels.create, { query }, query);
  // what the library gets: every option value, and the values shown now (same flat or grouped shape)
  const items = useMemo(() => (grouped ? blocks.map((b) => ({ label: b.label ?? null, items: b.items.map((o) => o.value) })) : blocks.flatMap((b) => b.items.map((o) => o.value))), [blocks, grouped]);
  const skeleton = isLoading && (!flat.length || forceState === "loading");
  const listBlocks = skeleton ? [] : showCreate ? [...shownBlocks, { label: null, create: true, items: [CREATE] }] : shownBlocks;
  const filteredItems = useMemo(() => (grouped ? listBlocks.map((b) => ({ label: b.label ?? null, items: b.items.map((o) => (o === CREATE ? CREATE : o.value)) })) : listBlocks.flatMap((b) => b.items.map((o) => (o === CREATE ? CREATE : o.value)))), [listBlocks, grouped]);
  const listKey = listBlocks.map((b) => b.items.map((o) => keyOf(o === CREATE ? CREATE : o.value)).join("\u0001")).join("\u0002");

  const live = useRef({});
  live.current = { value, controlled, initial, onChange, multi, suggest, byValue, has, required, text, textControlled, onInputChange, chosenLabel, isOpen, query };

  // ---- the shared highlight (as Select's): two edges on springs, drawn as a clip on one pill in the scrolling list
  const top = useMotionValue(0);
  const bot = useMotionValue(0);
  const fade = useMotionValue(0);
  const pill = useRef(null);
  const listEl = useRef(null);
  const ghostEl = useRef(null);
  const hl = useRef({ cur: null, el: null, shown: false, raf: 0, anims: [], h: 0 });
  const fresh = useRef(new Set());
  const paint = () => {
    const p = pill.current;
    if (!p) return;
    const t = top.get(), b = Math.max(bot.get(), t);
    p.style.clipPath = `inset(${t}px 0 ${Math.max(0, hl.current.h - b)}px 0 round var(--ts-radius-sm))`;
  };
  useEffect(() => { const a = top.on("change", paint), b = bot.on("change", paint); return () => { a(); b(); }; }, []);
  const growPill = (b) => {
    const st = hl.current;
    const need = Math.ceil(Math.max(b, bot.get()));
    if (need !== st.h && pill.current) { st.h = need; pill.current.style.height = need + "px"; }
  };

  // Put the highlight on `el`. Arrow keys and the pointer: the two edges travel on springs (the edge in the direction
  // of travel leads, so a long jump stretches the pill and it settles back). `jump`: it lands at once, fading in if it
  // was hidden. If the row is still sliding into place after a filter, the pill rides that same animation, so the two
  // never part.
  const place = (el, jump) => {
    const st = hl.current;
    const F = flip.current;
    const t = el.offsetTop, b = t + el.offsetHeight;
    st.anims.forEach((a) => a.stop());
    st.anims = [];
    F.pillAnim?.cancel();
    F.pillAnim = null;
    const ride = F.anims.get(el);
    const sliding = ride && ride.playState === "running" && ride.effect?.getKeyframes?.()[0]?.transform;
    if (!st.shown || reduce || jump || sliding) {
      const far = st.shown && Math.abs(t - top.get()) > (b - t) * 1.5;
      top.set(t); bot.set(b);
      if (!st.shown || far) fade.set(0);
      st.anims.push(animate(fade, 1, { duration: reduce ? 0 : 0.12 }));
      if (sliding && pill.current && !reduce) {
        try {
          F.pillAnim = pill.current.animate(ride.effect.getKeyframes().map((f) => ({ transform: f.transform, offset: f.offset })), ride.effect.getTiming());
          F.pillAnim.currentTime = ride.currentTime;
        } catch { F.pillAnim = null; }
      }
    } else {
      const down = t > top.get();
      const dist = Math.abs(t - top.get());
      const row = Math.max(1, b - t);
      const lead = { type: "spring", stiffness: 760, damping: 50, restDelta: 0.3 };
      const trail = dist > row * 1.5 ? { type: "spring", stiffness: 320, damping: 34, restDelta: 0.3 } : { type: "spring", stiffness: 560, damping: 44, restDelta: 0.3 };
      st.anims.push(animate(top, t, down ? trail : lead), animate(bot, b, down ? lead : trail), animate(fade, 1, { duration: 0.1 }));
    }
    st.shown = true;
    growPill(b);
    paint();
  };

  // ---- the re-forming list -------------------------------------------------------------------------------------
  // rows (and group labels) by key; a snapshot of where the visible ones were, taken in the render that changes the
  // list (the DOM still shows the old list then); and the list's scroll position as it was before the keystroke
  // (the library scrolls the list to the top when the reader types, before this render)
  const rowEls = useRef(new Map());
  const flip = useRef({ key: listKey, pending: null, scroll: 0, hAnim: null, anims: new WeakMap() });
  const track = (k, n) => { if (n) rowEls.current.set(k, n); else if (rowEls.current.get(k) && !rowEls.current.get(k).isConnected) rowEls.current.delete(k); };
  const shiftOf = (el) => {
    if (!flip.current.anims.has(el)) return 0;
    const t = getComputedStyle(el).transform;
    return t && t !== "none" ? new DOMMatrixReadOnly(t).m42 : 0;
  };
  if (flip.current.key !== listKey) {
    const list = listEl.current;
    flip.current.pending = null;
    if (list && list.isConnected && isOpen && !reduce && !skeleton) {
      const scroll = flip.current.scroll;
      const vh = list.clientHeight;
      const rows = new Map();
      for (const [k, el] of rowEls.current) {
        if (!el.isConnected) continue;
        const off = el.offsetTop + shiftOf(el);
        const h = el.offsetHeight;
        rows.set(k, { top: off - scroll, h, el, seen: off + h > scroll - 4 && off < scroll + vh + 4, op: flip.current.anims.has(el) ? +getComputedStyle(el).opacity : 1 });
      }
      flip.current.pending = { rows, height: list.getBoundingClientRect().height, vh };
    }
    flip.current.key = listKey;
  }

  useIsoLayoutEffect(() => {
    const snap = flip.current.pending;
    flip.current.pending = null;
    const list = listEl.current;
    if (!snap || !list) return;
    const F = flip.current;
    // the popup's height springs from where it was to the new list's height
    F.hAnim?.cancel();
    const h1 = list.getBoundingClientRect().height;
    if (Math.abs(h1 - snap.height) > 1) {
      try { F.hAnim = list.animate([{ height: snap.height + "px" }, { height: h1 + "px" }], { duration: SPRING_MS, easing: SPRING }); }
      catch { F.hAnim = list.animate([{ height: snap.height + "px" }, { height: h1 + "px" }], { duration: 300, easing: "cubic-bezier(.2,.8,.2,1)" }); }
    }
    const scroll = list.scrollTop;
    const vh = Math.max(snap.vh, list.clientHeight, h1);
    const run = (el, frames, opts) => {
      F.anims.get(el)?.cancel();
      let a;
      try { a = el.animate(frames, opts); } catch { a = el.animate(frames, { ...opts, easing: "cubic-bezier(.2,.8,.2,1)" }); }
      F.anims.set(el, a);
      a.onfinish = () => { if (F.anims.get(el) === a) F.anims.delete(el); };
    };
    for (const [k, el] of rowEls.current) {
      if (!el.isConnected) { rowEls.current.delete(k); continue; }
      const t = el.offsetTop - scroll;
      const h = el.offsetHeight;
      if (t + h < -4 || t > vh + 4) { F.anims.get(el)?.cancel(); continue; }   // out of view: plain
      const was = snap.rows.get(k);
      if (was && was.el === el) {
        // a row that stays slides from where it was; one that was out of view starts just past the edge
        let dy = was.top - t;
        if (!was.seen) dy = Math.max(-(t + h), Math.min(dy, vh - t));
        if (Math.abs(dy) > 0.5) run(el, [{ transform: `translateY(${dy}px)` }, { transform: "translateY(0)" }], { duration: SPRING_MS, easing: SPRING });
        else F.anims.get(el)?.cancel();
      } else {
        run(el, [{ opacity: 0 }, { opacity: 1 }], { duration: 200, easing: "cubic-bezier(.2,.8,.2,1)" });
      }
    }
    // rows that left fade out where they were, as copies the library and screen readers never see
    const layer = ghostEl.current;
    if (layer) {
      for (const [k, was] of snap.rows) {
        if (!was.seen || (rowEls.current.get(k) === was.el && was.el.isConnected)) continue;
        const g = was.el.cloneNode(true);
        for (const n of [g, ...g.querySelectorAll("*")]) { n.removeAttribute("id"); n.removeAttribute("role"); n.removeAttribute("aria-selected"); n.removeAttribute("data-highlighted"); }
        g.style.top = was.top + scroll + "px";
        g.style.height = was.h + "px";
        layer.appendChild(g);
        const a = g.animate([{ opacity: was.op * 0.9 }, { opacity: 0 }], { duration: 170, easing: "ease-out", fill: "forwards" });
        a.onfinish = () => g.remove();
      }
    }
    // the highlight goes to the first match with its row (it does not slide in from wherever it was)
    F.filteredAt = performance.now();
    const st = hl.current;
    if (st.el && st.el.isConnected) place(st.el, true);
  }, [listKey]);

  const ctx = {
    renderOption,
    fresh: fresh.current,
    pick: !suggest,
    query,
    createText,
    track,
    range: (o) => (query ? find(textOf(o), query) ?? find(textOf(o), query, true) : null),
    highlight(el, k) {
      const st = hl.current;
      cancelAnimationFrame(st.raf);
      if (!el) return;
      const prev = st.el;
      st.cur = k;
      st.el = el;
      // the list is re-forming in this commit: its layout effect places the highlight with the row
      if (flip.current.pending) return;
      // right after the list re-formed (the library highlights the first match a commit later), or when the row it
      // was on has gone: no travel from the old place
      place(el, performance.now() - (flip.current.filteredAt ?? -1e9) < 120 || !prev || !prev.isConnected);
    },
    unhighlight(k) {
      const st = hl.current;
      if (k !== st.cur) return;
      // wait a frame: if another row takes the highlight in the same commit, keep travelling instead of fading
      cancelAnimationFrame(st.raf);
      st.raf = requestAnimationFrame(() => { if (st.cur === k) { st.shown = false; st.cur = null; st.el = null; animate(fade, 0, { duration: reduce ? 0 : 0.12 }); } });
    },
  };

  // ---- state changes ---------------------------------------------------------------------------------------------
  const commit = (next, event, opt) => {
    const l = live.current;
    if (!l.controlled) setInner(next);
    if (l.multi) {
      const prev = l.value;
      const added = next.find((v) => !prev.includes(v));
      const removed = prev.find((v) => !next.includes(v));
      const v = added !== undefined ? added : removed;
      l.onChange?.(next, { value: v, selected: added !== undefined, option: v === undefined ? null : l.byValue.get(v) ?? null }, event);
    } else {
      l.onChange?.(next, next == null ? null : opt ?? l.byValue.get(next) ?? null, event);
    }
  };
  const setText = (t, event) => {
    const l = live.current;
    emitted.current = t;
    l.text = t;   // the library asks to open right after a keystroke, before the next render: minChars reads this
    if (!l.textControlled) setTextInner(t);
    l.onInputChange?.(t, event);
  };

  const setOpen = (next, reason, event, details) => {
    const l = live.current;
    if (next && (isDisabled || readOnly)) { details?.cancel?.(); return; }
    // minChars: typing or a press on the input does not open under the minimum (the chevron still does)
    if (next && minChars > 0 && reason !== "trigger" && l.text.trim().length < minChars) { details?.cancel?.(); return; }
    if (next) {
      setMounted(true);
      fresh.current.clear();
      hl.current.shown = false; hl.current.cur = null; hl.current.el = null; fade.set(0);
      flip.current.scroll = 0;
      setPopFresh(true);
      if (reason !== "typing") { typed.current = false; setQuery(l.suggest ? l.text.trim() : ""); }
    } else {
      // pick mode: an emptied input clears the value when the reader leaves (not on the way, while they retype)
      if (!l.suggest && !l.multi && l.has && l.text.trim() === "") commit(null, event);
      if (!l.has && l.required) setTouched(true);
      // multiple: a pick keeps the popup open for the next one
      if (l.multi && reason === "select") { details?.cancel?.(); return; }
    }
    if (!openControlled) setOpenInner(next);
    onOpenChange?.(next, reason, event);
  };

  const create = (event) => {
    const l = live.current;
    const t = l.query;
    onCreate?.(t, event);
    if (l.multi) { if (!l.value.includes(t)) commit([...l.value, t], event); setText("", event); setQuery(""); }
    else if (l.suggest) { setText(t, event); l.onChange?.(t, null, event); setOpen(false, "select", event); }
    else { commit(t, event, null); setText(t, event); setOpen(false, "select", event); }
  };

  const onValue = (v, d) => {
    const reason = d?.reason;
    const l = live.current;
    // an emptied input does not clear the value while the reader is still typing; leaving does (see setOpen)
    if (!l.multi && reason === "input-clear") { d.cancel(); return; }
    if (reason === "escape-key" && !clearable) { d.cancel(); d.allowPropagation?.(); return; }
    if (l.multi ? asArray(v).includes(CREATE) : v === CREATE) { d.cancel(); create(d?.event); return; }
    for (const x of asArray(v)) if (!asArray(l.value).includes(x)) fresh.current.add(x);
    commit(l.multi ? asArray(v) : v ?? null, d?.event);
    if (l.multi && reason === "item-press" && l.query) { setText("", d?.event); setQuery(""); }
  };

  const onText = (t, d) => {
    const reason = d?.reason;
    const l = live.current;
    // Escape on a closed field clears it only when the field is clearable; otherwise it is left to whatever holds the
    // field (a Modal closes)
    if (reason === "escape-key" && !clearable) { d.cancel(); d.allowPropagation?.(); return; }
    if (reason === "input-change") { typed.current = true; setQuery(t.trim()); }
    setText(t, d?.event);
    if (l.suggest) {
      const match = flat.find((o) => textOf(o) === t) ?? null;
      l.onChange?.(t, match, d?.event);
    }
    if (reason === "input-change" && minChars > 0 && l.isOpen && t.trim().length < minChars) setOpen(false, "typing", d?.event);
  };

  // pick mode: the input shows the chosen option's label whenever the reader is not typing (a value changed from
  // outside, a form reset, options that arrive later with the chosen label)
  useEffect(() => {
    if (suggest || multi) return;
    if (isOpen && typed.current) return;
    if (text !== chosenLabel) setText(chosenLabel);
  }, [multi ? "" : String(value), chosenLabel]);

  // a controlled text changed from outside: filter by it while open
  useEffect(() => {
    if (!textControlled || text === emitted.current) return;
    emitted.current = text;
    if (isOpen || suggest) setQuery(text.trim());
  }, [text]);

  // a fresh popup staggers its rows in once
  useEffect(() => { if (!popFresh || !isOpen) return; const t = setTimeout(() => setPopFresh(false), 420); return () => clearTimeout(t); }, [popFresh, isOpen]);

  // a <form> reset: back to defaultValue (pick) or the starting text (suggest), untouched; attached once (a listener
  // re-added on every render can be removed mid-dispatch by another field's reset handler and then never runs)
  useEffect(() => {
    const form = inputRef.current?.form ?? fieldRef.current?.closest("form");
    if (!form) return;
    const h = (e) => {
      const l = live.current;
      setTouched(false);
      if (l.suggest) {
        const t0 = String(textStart ?? "");
        if (l.text !== t0) { setText(t0, e); l.onChange?.(t0, null, e); }
        return;
      }
      const same = l.multi ? l.value.join("\u0001") === asArray(l.initial).join("\u0001") : l.value === l.initial;
      if (!same) commit(l.multi ? asArray(l.initial) : l.initial, e);
      else if (!l.multi && l.text !== l.chosenLabel) setText(l.chosenLabel, e);
      if (l.multi && l.text) setText("", e);
    };
    form.addEventListener("reset", h);
    return () => form.removeEventListener("reset", h);
  }, []);

  useRevealErrors(revealErrors, () => {
    setTouched(true);
    if ((errorProp || (required && !has)) && shake.x) controls.start(shake);
  });
  useEffect(() => { if (errorProp && shake.x) controls.start(shake); }, [errorProp]);

  // the number of results, announced politely once typing settles
  const [said, setSaid] = useState("");
  const emptyText = query ? fill(labels.empty, { query }, query) : fill(labels.none, {});
  useEffect(() => {
    if (!isOpen) { setSaid(""); return; }
    const t = setTimeout(() => {
      if (isLoading) setSaid(fill(labels.loading, {}));
      else if (!query) setSaid("");
      else if (!shownCount) setSaid(showCreate ? emptyText : "");   // the empty part announces itself
      else {
        const f = new Intl.NumberFormat(locale).format(shownCount);
        setSaid(fill(labels.results, { count: f }, shownCount, f, new Intl.PluralRules(locale).select(shownCount)));
      }
    }, 450);
    return () => clearTimeout(t);
  }, [isOpen, query, shownCount, isLoading]);

  // the edge fades: shown while there is more list above or below
  const popEl = useRef(null);
  const onListScroll = () => {
    const list = listEl.current, p = popEl.current;
    if (!list) return;
    flip.current.scroll = list.scrollTop;
    if (p) {
      p.classList.toggle("is-scroll-up", list.scrollTop > 2);
      p.classList.toggle("is-scroll-down", list.scrollTop + list.clientHeight < list.scrollHeight - 2);
    }
  };
  useIsoLayoutEffect(() => { onListScroll(); });

  // a leaving input in pick mode with the popup closed (typing under minChars): restore or clear as setOpen does
  const onBlur = (e) => {
    setFocused(false);
    rest.onBlur?.(e);
    const l = live.current;
    if (l.suggest || l.multi || l.isOpen) return;
    if (l.has && l.text.trim() === "") commit(null, e.nativeEvent);
    else if (l.text !== l.chosenLabel) setText(l.chosenLabel, e.nativeEvent);
    if (!l.has && l.required) setTouched(true);
  };

  const [side, align = "center"] = placement.split("-");
  const describedBy = [hasMsgRow ? ids.msg : null, rest["aria-describedby"]].filter(Boolean).join(" ") || undefined;
  const showClear = clearable && has && !isDisabled && !readOnly;
  const showChev = !readOnly;
  const pr = (showChev ? 40 : 14) + (showClear ? 32 : 0);
  const box = ["hover", "focus"].includes(forceState) ? forceState : undefined;
  const calm = reduce ? " is-calm" : "";
  const lead = chosen && chosen.icon ? (typeof chosen.icon === "string" ? <Icon name={chosen.icon} size={18} /> : chosen.icon) : null;
  const { onBlur: _ob, onFocus: userFocus, "aria-describedby": _ad, ...inputRest } = rest;
  const fieldStyle = {
    maxWidth: fullWidth ? "none" : maxWidth || undefined,
    "--fl-right": pr + "px",
    "--fl-top": multi ? Math.round(s[above ? "above" : "float"] / 2) + "px" : undefined,
    "--combo-h": s[above ? "above" : "float"] + "px",
    "--combo-ht": s[above ? "aboveT" : "floatT"] + "px",
    "--combo-fs": s.fs + "px",
    "--combo-pt": s.pt + "px",
    "--combo-pr": pr + "px",
    "--combo-chip": s.chip + "px",
    "--combo-mpad": s.mpad + "px",
    ...style,
  };

  const rootProps = suggest
    ? { value: shownText, onValueChange: onText, mode: "list", itemToStringValue: (v) => (v === CREATE ? query : labelOf(v)), autoHighlight: false }
    : {
        value: multi ? value : value ?? null,
        onValueChange: onValue,
        inputValue: shownText,
        onInputValueChange: onText,
        multiple: multi,
        itemToStringLabel: (v) => (v === CREATE ? query : labelOf(v)),
        itemToStringValue: (v) => (v === CREATE ? query : v == null ? "" : String(v)),
        autoHighlight,
        inputRef: hiddenRef,
      };

  const input = (
    <B.Input
      {...inputRest}
      ref={setInput}
      className="ts-input ts-combo__input"
      placeholder={ph && (above || floated) && !(multi && value.length) ? ph : undefined}
      autoComplete={autoComplete}
      aria-describedby={describedBy}
      aria-invalid={error ? true : undefined}
      aria-busy={isLoading || undefined}
      onFocus={(e) => { setFocused(true); userFocus?.(e); }}
      onBlur={onBlur}
    />
  );

  let order = 0;
  return (
    <>{sheetTag}{sheetTag2}{sheetTag3}<div
      ref={fieldRef}
      className={"ts-field ts-combo" + (above ? " is-label-above" : " is-label-float") + (floated ? " is-float" : "") + (hasLabel ? "" : " is-nolabel") + (multi ? " is-multi" : "") + (readOnly ? " is-ro" : "") + (lead && !multi ? " has-lead" : "") + calm + (className ? " " + className : "")}
      style={fieldStyle}
    >
      <B.Root
        {...rootProps}
        id={inputId}
        items={items}
        filteredItems={filteredItems}
        filter={null}
        open={isOpen}
        onOpenChange={(o, d) => setOpen(o, OPEN_REASONS[d?.reason] ?? "other", d?.event, d)}
        onOpenChangeComplete={(o) => { if (!o) setMounted(false); }}
        openOnInputClick={openOnFocus}
        modal={false}
        name={name}
        required={required}
        disabled={isDisabled}
        readOnly={readOnly}
        locale={locale}
      >
        {above && hasLabel && <FieldLabel placement="above" htmlFor={inputId} id={ids.label} required={required}>{text0}</FieldLabel>}
        <motion.div className="ts-combo__shake" animate={controls}>
          <B.InputGroup
            ref={boxRef}
            className={"ts-box" + (error ? " is-error" : "") + (isDisabled ? " is-disabled" : "") + (readOnly ? " is-readonly" : "") + (isOpen ? " is-open" : "")}
            data-force={box}
            onMouseDown={(e) => {
              // a press on the box's padding or the floating label puts the caret in the input (and opens, as a press on the input does)
              if (isDisabled || (e.target !== e.currentTarget && !e.target.closest?.(".ts-flabel,.ts-combo__chips"))) return;
              if (e.target.closest?.(".ts-combo-chip")) return;
              e.preventDefault();
              inputRef.current?.focus();
              if (openOnFocus && !isOpen && !readOnly) setOpen(true, "input", e.nativeEvent);
            }}
          >
            {!above && hasLabel && <FieldLabel placement="float" htmlFor={inputId} id={ids.label} up={floated} required={required}>{text0}</FieldLabel>}
            {lead && !multi && <span className="ts-combo__lead" aria-hidden>{lead}</span>}
            {multi ? (
              <B.Chips className="ts-combo__chips">
                <AnimatePresence initial={false}>
                  {value.map((v) => {
                    const o = byValue.get(v) ?? { value: v, label: String(v) };
                    return (
                      <Chip key={keyOf(v)} B={B} opt={o} reduce={reduce} removable={!readOnly && !isDisabled}
                        label={renderValue ? renderValue(o) : o.label} removeLabel={fill(labels.remove, { label: textOf(o) }, o)} />
                    );
                  })}
                </AnimatePresence>
                {input}
              </B.Chips>
            ) : input}
            {showClear && (
              <button type="button" className="ts-iconbtn ts-combo__clear" aria-label={fill(labels.clear, {})}
                onMouseDown={(e) => e.preventDefault()}
                onClick={(e) => {
                  // callbacks get the DOM event everywhere, as the library's own changes give it
                  const ev = e.nativeEvent;
                  if (suggest) { setText("", ev); onChange?.("", null, ev); setQuery(""); }
                  else { commit(multi ? [] : null, ev); setText("", ev); setQuery(""); }
                  inputRef.current?.focus();
                }}>
                <Icon name="x" size={16} stroke={2} />
              </button>
            )}
            {showChev && (
              <B.Trigger className="ts-combo__chev" aria-label={fill(labels.toggle, {})} tabIndex={-1} disabled={isDisabled}>
                <span aria-hidden><Icon name="chevronDown" size={16} stroke={2.2} /></span>
              </B.Trigger>
            )}
          </B.InputGroup>
        </motion.div>
        {hasMsgRow && <FieldMessage id={ids.msg} hint={helper} error={error} />}
        {showLayer && <LayerHost anchor={boxRef} owner={fieldRef} tabOut={inputRef} onHost={setHost} />}
        {showLayer && host && (
          <B.Portal container={host}>
            <B.Positioner className="ts-combo-pos" anchor={boxRef} side={side} align={align} sideOffset={6} collisionPadding={8}>
              <B.Popup ref={popEl} className={"ts-combo-pop" + (matchTriggerWidth ? " is-match" : "") + (popFresh ? " is-fresh" : "") + calm} style={{ "--combo-max": maxHeight + "px" }}>
                {isLoading && !skeleton && <span className="ts-combo-bar" aria-hidden />}
                <span className="ts-combo-fade is-top" aria-hidden />
                <B.List className={"ts-combo-list" + (isLoading && !skeleton ? " is-busy" : "")} ref={listEl} aria-busy={isLoading || undefined} onScroll={onListScroll}>
                  {!skeleton && <motion.div ref={(n) => { pill.current = n; if (n && !n.dataset.on) { n.dataset.on = "1"; hl.current.h = 0; n.style.height = "0px"; } }} className="ts-combo-pill" style={{ opacity: fade }} aria-hidden />}
                  <div ref={ghostEl} className="ts-combo-ghosts" aria-hidden />
                  {/* the library's empty part: announced, and it keeps Escape from also closing a Modal or Popover around
                      the field when nothing matches. With creatable the Create row is in the list, so the note is drawn here. */}
                  <B.Empty>{!isLoading && <div className="ts-combo-note">{emptyText}</div>}</B.Empty>
                  {!isLoading && !shownCount && showCreate && <div className="ts-combo-note" aria-hidden>{emptyText}</div>}
                  {listBlocks.map((blk, bi) => {
                    const rows = blk.items.map((opt) => {
                      const o = order++;
                      const v = opt === CREATE ? CREATE : opt.value;
                      const k = keyOf(v);
                      return (
                        <B.Item key={k} value={v} index={o} disabled={opt !== CREATE && !!opt.disabled}
                          render={(props, state) => <Row props={props} state={state} opt={opt} ctx={ctx} k={k} order={o} />} />
                      );
                    });
                    const gk = "g\u0000" + (blk.create ? "create" : blk.label ?? "loose" + bi);
                    return blk.label != null ? (
                      <B.Group key={gk} className="ts-combo-group">
                        <B.GroupLabel className="ts-combo-group__label" ref={(n) => track(gk, n)}>{blk.label}</B.GroupLabel>
                        {rows}
                      </B.Group>
                    ) : <div key={gk} className="ts-combo-group" role="presentation">{rows}</div>;
                  })}
                  {skeleton && [70, 52, 62, 44].map((w, i) => <div key={i} className="ts-combo-skel" aria-hidden><i style={{ width: w + "%" }} /></div>)}
                </B.List>
                <span className="ts-combo-fade is-bottom" aria-hidden />
                <B.Status className="ts-sr">{said}</B.Status>
              </B.Popup>
            </B.Positioner>
          </B.Portal>
        )}
      </B.Root>
    </div></>
  );
});
