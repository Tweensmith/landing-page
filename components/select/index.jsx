"use client";
import { forwardRef, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence, animate, useAnimationControls, useMotionValue } from "motion/react";
import { Select as BaseSelect } from "@base-ui/react/select";
import { registerStyles, useStyles, useIsoLayoutEffect, useReducedMotion } from "../_shared/theme.jsx";
import { useFieldStyles, useLabelStyles, useFieldIds, useShake, useRevealErrors, FieldLabel, FieldMessage } from "../_shared/field.jsx";
import { LayerHost } from "../_shared/overlay.jsx";
import { Icon } from "../_shared/icons.jsx";

// A damped spring (stiffness 420, damping 30, zeta 0.73, about 3% overshoot, settles in 370ms) sampled into a
// CSS easing, so the popup and the chevron spring with CSS transitions: time-based and interruptible mid-flight.
const SPRING = "linear(0,0.025,0.0887,0.1767,0.2779,0.3835,0.4872,0.5848,0.6734,0.7514,0.8183,0.8742,0.9196,0.9555,0.983,1.0033,1.0174,1.0266,1.0318,1.034,1.034,1.0323,1.0296,1.0263,1.0228,1.0192,1.0157,1.0125,1.0097,1.0072,1.0051,1.0034,1)";

const CSS = `
.ts-sel{--sel-spring:${SPRING}}
.ts-sel .ts-sel__shake{display:block}
.ts-field.ts-sel.is-label-float .ts-box,.ts-field.ts-sel.is-label-above .ts-box{min-height:var(--sel-h);padding:0;cursor:pointer;
  transition:box-shadow .18s,background-color .18s,transform .37s var(--sel-spring)}
.ts-sel .ts-box:has(.ts-sel__trigger:active):not(.is-disabled):not(.is-readonly){transform:scale(.992);background:color-mix(in srgb,var(--ts-surface) 96%,var(--ts-ink))}
.ts-sel .ts-box.is-open{box-shadow:inset 0 0 0 1.5px var(--ts-focus),0 0 0 4px color-mix(in srgb,var(--ts-focus) 16%,transparent)}
.ts-sel .ts-box.is-open .ts-flabel{color:var(--ts-focus)}
.ts-sel .ts-box.is-error.is-open{box-shadow:inset 0 0 0 1.5px var(--ts-danger),0 0 0 4px color-mix(in srgb,var(--ts-danger) 14%,transparent)}
.ts-sel .ts-box.is-error .ts-flabel{color:var(--ts-danger)}
.ts-sel .ts-box.is-readonly{cursor:default}
.ts-sel__trigger{all:unset;box-sizing:border-box;flex:1;align-self:stretch;display:flex;align-items:center;min-width:0;min-height:var(--sel-h);
  padding:0 var(--sel-pr) 0 14px;font-family:var(--ts-font);font-size:var(--sel-fs);line-height:1.3;color:var(--ts-ink);cursor:inherit;-webkit-tap-highlight-color:transparent}
.ts-sel__trigger:focus-visible{outline:none}
.ts-sel.is-label-float .ts-sel__value{padding-top:var(--sel-pt)}
.ts-sel__value{display:flex;flex:1;min-width:0}
.ts-sel__roll{position:relative;display:block;flex:1;min-width:0;height:1.3em;overflow:hidden}
.ts-sel__val{position:absolute;inset:0;display:flex;align-items:center;gap:8px;min-width:0;white-space:nowrap}
.ts-sel__val > svg{color:var(--ts-ink2)}
.ts-sel__text{overflow:hidden;text-overflow:ellipsis;min-width:0}
.ts-sel__more{flex:none;font-variant-numeric:tabular-nums;color:var(--ts-ink2)}
.ts-sel__ph{color:var(--ts-ink2)}
.ts-sel__chev{position:absolute;right:14px;top:50%;margin-top:-8px;display:grid;color:var(--ts-ink2);pointer-events:none;transition:transform .37s var(--sel-spring)}
.ts-sel .ts-box.is-open .ts-sel__chev{transform:rotate(180deg)}
.ts-sel__clear{position:absolute;right:38px;top:50%;margin-top:-15px;z-index:1}
.ts-sel__clear::after{content:"";position:absolute;inset:-4px}
.ts-sel-pos{z-index:1;outline:0}
.ts-sel-pop{--sel-spring:${SPRING};box-sizing:border-box;position:relative;min-width:max(var(--anchor-width),180px);max-width:min(var(--available-width),calc(100vw - 16px));overflow:hidden;
  font-family:var(--ts-font);color:var(--ts-ink);background:var(--ts-surface);border-radius:calc(var(--ts-radius-md) + 2px);outline:0;
  box-shadow:0 0 0 1px var(--ts-line),0 18px 44px -12px color-mix(in srgb,var(--ts-bg) 70%,var(--ts-black) 30%);
  transform-origin:var(--transform-origin);transition:transform .37s var(--sel-spring),opacity .16s ease-out}
.ts-sel-pop.is-match{width:var(--anchor-width)}
.ts-sel-pop:not(.is-match){max-width:min(360px,var(--available-width),calc(100vw - 16px))}
.ts-sel-pop[data-starting-style]{opacity:0;transform:scale(.97,.9)}
.ts-sel-pop[data-ending-style]{opacity:0;transform:scale(.985,.95);transition:transform .14s cubic-bezier(.4,0,1,1),opacity .14s cubic-bezier(.4,0,1,1)}
.ts-sel-list{position:relative;box-sizing:border-box;padding:5px;max-height:min(var(--sel-max),var(--available-height));overflow-y:auto;overscroll-behavior:contain;outline:0;scroll-padding-block:28px}
.ts-sel-pill{position:absolute;top:0;left:5px;right:5px;z-index:0;pointer-events:none;background:color-mix(in srgb,var(--ts-ink) 8%,transparent);will-change:clip-path,opacity}
.ts-sel-opt{position:relative;z-index:1;box-sizing:border-box;display:flex;align-items:center;gap:10px;min-height:36px;padding:7px 10px;border-radius:var(--ts-radius-sm);
  font-size:14px;line-height:1.3;color:var(--ts-ink);cursor:default;outline:0;user-select:none;-webkit-user-select:none;
  animation:ts-sel-in .26s cubic-bezier(.2,.8,.2,1) both;animation-delay:calc(var(--i,0) * 16ms)}
@keyframes ts-sel-in{from{opacity:0;transform:translateY(-4px)}}
.ts-sel-opt > svg{color:var(--ts-ink2);flex:none}
.ts-sel-opt__text{display:flex;flex-direction:column;gap:2px;flex:1;min-width:0}
.ts-sel-opt__label{font-weight:500;overflow:hidden;text-overflow:ellipsis}
.ts-sel-opt__desc{font-size:12.5px;color:var(--ts-ink2);line-height:1.35}
.ts-sel-opt[data-selected] .ts-sel-opt__label{font-weight:620}
.ts-sel-opt[data-disabled]{cursor:not-allowed}
.ts-sel-opt[data-disabled] .ts-sel-opt__label{color:var(--ts-ink2)}
.ts-sel-opt[data-disabled] > svg,.ts-sel-opt[data-disabled] .ts-sel-opt__label{opacity:.7}
.ts-sel-tick{flex:none;width:16px;height:16px;display:grid;place-items:center;color:var(--ts-accent)}
.ts-sel-tick.is-fresh path{stroke-dasharray:1;stroke-dashoffset:1;animation:ts-sel-draw .28s cubic-bezier(.65,0,.35,1) .04s forwards}
@keyframes ts-sel-draw{to{stroke-dashoffset:0}}
.ts-sel-group + .ts-sel-group{margin-top:4px;padding-top:4px;box-shadow:inset 0 1px 0 var(--ts-line)}
.ts-sel-group__label{position:sticky;top:-5px;z-index:2;margin:0 -5px;padding:9px 15px 5px;background:var(--ts-surface);font-family:var(--ts-font-mono);font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:var(--ts-ink2)}
.ts-sel-note{display:flex;align-items:center;gap:8px;padding:10px;font-size:13.5px;color:var(--ts-ink2)}
.ts-sel-skel{display:flex;align-items:center;height:36px;padding:0 10px}
.ts-sel-skel i{display:block;height:11px;border-radius:6px;background:linear-gradient(90deg,color-mix(in srgb,var(--ts-ink) 7%,transparent),color-mix(in srgb,var(--ts-ink) 14%,transparent),color-mix(in srgb,var(--ts-ink) 7%,transparent));background-size:200% 100%;animation:ts-sel-shim 1.3s linear infinite}
@keyframes ts-sel-shim{from{background-position:100% 0}to{background-position:-100% 0}}
.ts-sel-arrow{position:absolute;left:0;right:0;z-index:3;height:24px;display:grid;place-items:center;color:var(--ts-ink2);cursor:default}
.ts-sel-arrow[data-direction=up]{top:0;background:linear-gradient(var(--ts-surface) 40%,transparent)}
.ts-sel-arrow[data-direction=down]{bottom:0;background:linear-gradient(transparent,var(--ts-surface) 60%)}
.ts-sel-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}
@media (max-width:640px),(pointer:coarse){
  .ts-field.ts-sel.is-label-float .ts-box,.ts-field.ts-sel.is-label-above .ts-box{min-height:var(--sel-ht)}
  .ts-sel__trigger{min-height:var(--sel-ht);font-size:16px}
  .ts-sel-opt{min-height:44px;font-size:15px}
  .ts-sel__clear::after{inset:-7px}
}
.ts-sel.is-calm .ts-box,.ts-sel.is-calm .ts-sel__chev{transition:box-shadow .18s,background-color .18s}
.ts-sel.is-calm .ts-box:has(.ts-sel__trigger:active){transform:none}
.ts-sel-pop.is-calm,.ts-sel-pop.is-calm[data-starting-style],.ts-sel-pop.is-calm[data-ending-style]{transform:none;transition:opacity .14s}
.ts-sel-pop.is-calm .ts-sel-opt{animation:none}
.ts-sel-pop.is-calm .ts-sel-tick.is-fresh path{animation:none;stroke-dashoffset:0}
.ts-sel-pop.is-calm .ts-sel-skel i{animation:none}
@media (prefers-reduced-motion:reduce){
  .ts-sel .ts-box,.ts-sel__chev{transition:box-shadow .18s,background-color .18s}
  .ts-sel .ts-box:has(.ts-sel__trigger:active){transform:none}
  .ts-sel-pop,.ts-sel-pop[data-starting-style],.ts-sel-pop[data-ending-style]{transform:none;transition:opacity .14s}
  .ts-sel-opt,.ts-sel-skel i{animation:none}
  .ts-sel-tick.is-fresh path{animation:none;stroke-dashoffset:0}
}
`;
registerStyles("ts-select", CSS);

// heights per size: "above" matches Button (34 / 52) at the ends and Text Field (48) at md; "float" matches Text
// Field's 56 at md. *T is the touch height (at least 44, and Text Field's 52 for md above).
const SIZES = {
  sm: { above: 34, float: 48, aboveT: 44, floatT: 48, fs: 13.5, pt: 14 },
  md: { above: 48, float: 56, aboveT: 52, floatT: 56, fs: 15, pt: 16 },
  lg: { above: 52, float: 64, aboveT: 52, floatT: 64, fs: 16, pt: 18 },
};

export const DEFAULT_LABELS = { clear: "Clear", empty: "No options", loading: "Loading options", required: "Choose an option" };

const REASONS = { "trigger-press": "trigger", "item-press": "select", "escape-key": "escape", "outside-press": "outside", "focus-out": "blur", "list-navigation": "keyboard", "window-resize": "resize", "imperative-action": "api" };

// sample content, shown only with `demo` (an invented team workspace, "Invite a teammate")
const DEMO = {
  label: "Role",
  hint: "They get an email invite and can join right away.",
  placeholder: "Choose a role",
  defaultValue: "editor",
  options: [
    { value: "admin", label: "Admin", icon: "settings", description: "Manages billing, members and every project." },
    { value: "editor", label: "Editor", icon: "edit", description: "Creates and edits projects. Can't touch billing." },
    { value: "commenter", label: "Commenter", icon: "message", description: "Reads everything, leaves comments, approves drafts." },
    { value: "viewer", label: "Viewer", icon: "eye", description: "Sees only the projects shared with them." },
    { value: "owner", label: "Owner", icon: "lock", description: "One per workspace. Transfer it from Settings.", disabled: true },
  ],
};

const setRef = (r, el) => { if (typeof r === "function") r(el); else if (r) r.current = el; };
const isGroup = (o) => o && typeof o === "object" && Array.isArray(o.options);
const toOption = (o) => (typeof o === "string" || typeof o === "number" ? { value: o, label: String(o) } : { ...o, label: o.label ?? String(o.value) });
const textOf = (o) => (typeof o.label === "string" || typeof o.label === "number" ? String(o.label) : String(o.value));
const asArray = (v) => (Array.isArray(v) ? v : v == null ? [] : [v]);

/** Options in, plain blocks out: [{ label?, items: [option + index] }], plus a flat list in display order. */
function normalize(options) {
  const flat = [];
  const blocks = [];
  let loose = null;
  for (const o of options ?? []) {
    if (o == null) continue;
    if (isGroup(o)) {
      loose = null;
      blocks.push({ label: o.label, items: o.options.filter((x) => x != null).map((x) => { const it = toOption(x); it.index = flat.push(it) - 1; return it; }) });
    } else {
      if (!loose) { loose = { items: [] }; blocks.push(loose); }
      const it = toOption(o);
      it.index = flat.push(it) - 1;
      loose.items.push(it);
    }
  }
  return { flat, blocks };
}

function Tick({ fresh }) {
  return (
    <span className={"ts-sel-tick" + (fresh ? " is-fresh" : "")} aria-hidden>
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3.5 8.4 6.6 11.4 12.6 4.8" pathLength="1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
    </span>
  );
}

/** One option row. Tells the shared highlight where it is whenever it becomes (or stops being) the highlighted one. */
function Row({ props, state, opt, ctx }) {
  const el = useRef(null);
  useIsoLayoutEffect(() => {
    if (state.highlighted) ctx.highlight(el.current, opt.index);
    else ctx.unhighlight(opt.index);
  }, [state.highlighted]);
  const meta = { selected: state.selected, highlighted: state.highlighted, disabled: state.disabled };
  return (
    <div {...props} ref={(n) => { el.current = n; setRef(props.ref, n); }} className="ts-sel-opt" style={{ "--i": Math.min(ctx.order(opt.index), 10) }}>
      {ctx.renderOption ? ctx.renderOption(opt, meta) : (
        <>
          {typeof opt.icon === "string" ? <Icon name={opt.icon} size={18} /> : opt.icon ?? null}
          <span className="ts-sel-opt__text">
            <span className="ts-sel-opt__label">{opt.label}</span>
            {opt.description && <span className="ts-sel-opt__desc">{opt.description}</span>}
          </span>
        </>
      )}
      {state.selected ? <Tick fresh={ctx.fresh.has(opt.value)} /> : <span className="ts-sel-tick" aria-hidden />}
    </div>
  );
}

/**
 * Select — choose one value (or several) from a list that is too long for a Radio Group or a Segmented Control.
 * It is a form field: at rest it matches Text Field (height, radius, hairline, label in both placements, hint and
 * error line, focus ring, shake on a new error). Keyboard and screen-reader behaviour come from @base-ui/react.
 * Signature: the popup springs out of the field; one highlight pill travels between options (its leading edge
 * leads, so long jumps stretch it before it settles); the tick draws on the option you pick; in the field the value
 * rolls in the direction of the move in the list. Reduced motion: opacity only, nothing travels.
 * A hidden input carries the value under `name` (one per value with `multiple`); a form reset returns to
 * `defaultValue`. The popup renders through the kit's layer, so it keeps the theme, is never clipped, and counts
 * as inside a Modal or Popover that holds the field. It does not lock page scroll (as Dropdown Menu).
 * The ref, `className`'s neighbours aria-* / data-* and other unknown props go to the trigger button.
 */
export const Select = forwardRef(function Select({
  options,
  value: valueProp,
  defaultValue = null,
  onChange,
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  multiple = false,
  clearable = false,
  placeholder = "",
  label = "",
  labelPlacement = "float",
  hint = "",
  error: errorProp,
  revealErrors = 0,
  name,
  id,
  autoComplete,
  required = false,
  disabled = false,
  readOnly = false,
  loading = false,
  size = "md",
  maxWidth = 380,
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
  const sheetTag3 = useStyles("ts-select", CSS);
  const reduce = useReducedMotion();
  const ids = useFieldIds();
  const shake = useShake();
  const controls = useAnimationControls();
  const labels = { ...DEFAULT_LABELS, ...labelsProp };

  const useDemo = demo && options === undefined;
  const text = label || (useDemo ? DEMO.label : "");
  const helper = hint || (useDemo ? DEMO.hint : "");
  const ph = placeholder || (useDemo ? DEMO.placeholder : "");
  const { flat, blocks } = useMemo(() => normalize(useDemo ? DEMO.options : options), [useDemo, options]);
  const byValue = useMemo(() => new Map(flat.map((o) => [o.value, o])), [flat]);
  const startValue = defaultValue ?? (useDemo && !multiple ? DEMO.defaultValue : null);
  const initial = multiple ? asArray(startValue) : Array.isArray(startValue) ? startValue[0] ?? null : startValue;

  // value: controlled when `value` is passed, else kept here (the library always gets it controlled, so a form
  // reset can put it back)
  const [inner, setInner] = useState(initial);
  const controlled = valueProp !== undefined;
  const raw = controlled ? valueProp : inner;
  const value = multiple ? asArray(raw) : Array.isArray(raw) ? raw[0] ?? null : raw ?? null;
  const has = multiple ? value.length > 0 : value != null && value !== "";

  // open: same pattern
  const [openInner, setOpenInner] = useState(defaultOpen);
  const openControlled = openProp !== undefined;
  const isDisabled = disabled || forceState === "disabled";
  const isLoading = loading || forceState === "loading";
  // the gallery forces "loading" as the first fetch: skeleton rows in place of the options
  const skeleton = isLoading && (!flat.length || forceState === "loading");
  const isOpen = !isDisabled && !readOnly && ((openControlled ? !!openProp : openInner) || forceState === "open" || forceState === "loading");
  // the layer host lives while the popup is open or closing (unmounted once the close transition completes)
  const [mounted, setMounted] = useState(isOpen);
  const [host, setHost] = useState(null);
  const showLayer = mounted || isOpen;

  const [touched, setTouched] = useState(false);
  let error = errorProp || (touched && required && !has ? labels.required : null);
  if (forceState === "error") error = error || labels.required;
  const s = SIZES[size] ?? SIZES.md;
  const above = labelPlacement === "above";
  const hasLabel = !!text;
  const floated = !hasLabel || has || isOpen || forceState === "focus";
  const hasMsgRow = !!(helper || error || required);

  const fieldRef = useRef(null);
  const trigger = useRef(null);
  const inputRef = useRef(null);
  const setTrigger = useCallback((el) => { trigger.current = el; setRef(ref, el); }, [ref]);

  const live = useRef({});
  live.current = { value, controlled, initial, onChange, multiple, byValue, has, required };

  // the shared highlight: two edges on springs, drawn as a clip on one pill that lives inside the scrolling list
  const top = useMotionValue(0);
  const bot = useMotionValue(0);
  const fade = useMotionValue(0);
  const pill = useRef(null);
  const listEl = useRef(null);
  const hl = useRef({ cur: -1, shown: false, raf: 0, anims: [], h: 0 });
  const fresh = useRef(new Set());
  const paint = () => {
    const p = pill.current;
    if (!p) return;
    const h = hl.current.h;
    const t = top.get(), b = Math.max(bot.get(), t);
    p.style.clipPath = `inset(${t}px 0 ${Math.max(0, h - b)}px 0 round var(--ts-radius-sm))`;
  };
  useEffect(() => { const a = top.on("change", paint), b = bot.on("change", paint); return () => { a(); b(); }; }, []);

  const ctx = {
    renderOption,
    fresh: fresh.current,
    order: (i) => i,
    highlight(el, index) {
      const st = hl.current;
      cancelAnimationFrame(st.raf);
      if (!el) return;
      const t = el.offsetTop, b = t + el.offsetHeight;
      st.anims.forEach((a) => a.stop());
      st.anims = [];
      if (!st.shown || reduce) {
        top.set(t); bot.set(b);
        st.anims.push(animate(fade, 1, { duration: st.shown ? 0 : 0.12 }));
      } else {
        // the edge in the direction of travel leads; the trailing edge is softer the further it goes, so a long jump
        // (Home / End, typeahead) stretches the pill and it settles back to the row's height
        const down = t > top.get();
        const dist = Math.abs(t - top.get());
        const row = Math.max(1, b - t);
        const lead = { type: "spring", stiffness: 760, damping: 50, restDelta: 0.3 };
        const trail = dist > row * 1.5 ? { type: "spring", stiffness: 320, damping: 34, restDelta: 0.3 } : { type: "spring", stiffness: 560, damping: 44, restDelta: 0.3 };
        st.anims.push(animate(top, t, down ? trail : lead), animate(bot, b, down ? lead : trail), animate(fade, 1, { duration: 0.1 }));
      }
      st.cur = index;
      st.shown = true;
      // the pill reaches only as far down as the lowest edge it is travelling between (set once per move, never per
      // frame), so it never adds to the list's scroll height; each frame only its clip changes
      const need = Math.ceil(Math.max(b, bot.get()));
      if (need !== st.h && pill.current) { st.h = need; pill.current.style.height = need + "px"; }
      paint();
    },
    unhighlight(index) {
      const st = hl.current;
      if (index !== st.cur) return;
      // wait a frame: if another row takes the highlight in the same commit, keep travelling instead of fading
      cancelAnimationFrame(st.raf);
      st.raf = requestAnimationFrame(() => { if (st.cur === index) { st.shown = false; st.cur = -1; animate(fade, 0, { duration: 0.12 }); } });
    },
  };

  // value roll: direction follows the move in the list (further down rolls up)
  const valueKey = multiple ? value.join("\u0001") : has ? String(value) : "";
  const roll = useRef({ key: valueKey, dir: 1, idx: multiple ? value.length : byValue.get(value)?.index ?? -1 });
  if (roll.current.key !== valueKey) {
    const idx = multiple ? value.length : byValue.get(value)?.index ?? -1;
    roll.current = { key: valueKey, idx, dir: idx >= roll.current.idx ? 1 : -1 };
  }
  const dir = roll.current.dir;

  const commit = (next, event) => {
    const l = live.current;
    if (!l.controlled) setInner(next);
    if (l.multiple) {
      const prev = l.value;
      const added = next.find((v) => !prev.includes(v));
      const removed = prev.find((v) => !next.includes(v));
      const v = added !== undefined ? added : removed;
      l.onChange?.(next, { value: v, selected: added !== undefined, option: v === undefined ? null : l.byValue.get(v) ?? null }, event);
    } else {
      l.onChange?.(next, next == null ? null : l.byValue.get(next) ?? null, event);
    }
  };

  const setOpen = (next, reason, event) => {
    if (next && (isDisabled || readOnly)) return;
    if (next) { setMounted(true); fresh.current.clear(); hl.current.shown = false; hl.current.cur = -1; fade.set(0); }
    else if (!live.current.has && live.current.required) setTouched(true);
    if (!openControlled) setOpenInner(next);
    onOpenChange?.(next, reason, event);
  };

  // a <form> reset: back to defaultValue and untouched (a controlled caller hears it through onChange)
  // Attached once: a listener re-added on every render can be removed mid-dispatch (another field's reset handler
  // re-renders the page between listeners) and then never runs.
  useEffect(() => {
    const form = inputRef.current?.form ?? fieldRef.current?.closest("form");
    if (!form) return;
    const h = (e) => {
      const l = live.current;
      setTouched(false);
      const same = l.multiple ? l.value.join("\u0001") === asArray(l.initial).join("\u0001") : l.value === l.initial;
      if (!same) commit(l.multiple ? asArray(l.initial) : l.initial, e);
    };
    form.addEventListener("reset", h);
    return () => form.removeEventListener("reset", h);
  }, []);

  useRevealErrors(revealErrors, () => {
    setTouched(true);
    if ((errorProp || (required && !has)) && shake.x) controls.start(shake);
  });
  useEffect(() => { if (errorProp && shake.x) controls.start(shake); }, [errorProp]);

  // typeahead on the closed field picks, as a native select does (the popup's own typeahead only runs while open,
  // because its options are not mounted while closed): repeating one letter cycles through the options it starts
  const typed = useRef({ s: "", t: 0 });
  const typeClosed = (e) => {
    if (isOpen || multiple || readOnly || isDisabled || e.ctrlKey || e.metaKey || e.altKey || e.key.length !== 1) return;
    const now = Date.now();
    const st = typed.current;
    if (e.key === " " && (!st.s || now - st.t > 600)) return;
    st.s = now - st.t > 600 ? e.key.toLowerCase() : st.s + e.key.toLowerCase();
    st.t = now;
    const pool = flat.filter((o) => !o.disabled);
    if (!pool.length) return;
    const cur = has ? pool.findIndex((o) => o.value === value) : -1;
    const cycle = [...st.s].every((c) => c === st.s[0]);
    const q = cycle ? st.s[0] : st.s;
    const from = cycle ? cur + 1 : Math.max(cur, 0);
    for (let i = 0; i < pool.length; i++) {
      const o = pool[(from + i) % pool.length];
      if (textOf(o).toLowerCase().startsWith(q)) { e.preventDefault(); if (o.value !== value) commit(o.value, e.nativeEvent); return; }
    }
  };

  // the content shown in the field
  const chosen = multiple ? value.map((v) => byValue.get(v)).filter(Boolean) : has ? byValue.get(value) ?? { value, label: String(value) } : null;
  let shown;
  if (multiple ? chosen.length : chosen) {
    if (renderValue) shown = renderValue(chosen);
    else if (multiple) {
      const first = chosen.slice(0, 2).map(textOf).join(", ");
      shown = <><span className="ts-sel__text">{first}</span>{chosen.length > 2 && <span className="ts-sel__more">+{chosen.length - 2}</span>}</>;
    } else shown = <>{typeof chosen.icon === "string" ? <Icon name={chosen.icon} size={18} /> : chosen.icon ?? null}<span className="ts-sel__text">{chosen.label}</span></>;
  } else shown = ph && (above || floated) ? <span className="ts-sel__ph">{ph}</span> : null;

  const variants = {
    enter: (d) => (reduce ? { opacity: 0 } : { y: d > 0 ? "100%" : "-100%", opacity: 0 }),
    center: { y: "0%", opacity: 1 },
    exit: (d) => (reduce ? { opacity: 0 } : { y: d > 0 ? "-100%" : "100%", opacity: 0 }),
  };
  const rollSpring = reduce ? { duration: 0.12 } : { type: "spring", stiffness: 520, damping: 40, opacity: { duration: 0.16 } };

  const [side, align = "center"] = placement.split("-");
  const describedBy = [hasMsgRow ? ids.msg : null, rest["aria-describedby"]].filter(Boolean).join(" ") || undefined;
  const showClear = clearable && has && !isDisabled && !readOnly;
  const pr = 38 + (showClear ? 34 : 0);
  const box = ["hover", "focus"].includes(forceState) ? forceState : undefined;
  const calm = reduce ? " is-calm" : "";
  let order = 0;

  return (
    <>{sheetTag}{sheetTag2}{sheetTag3}<div
      ref={fieldRef}
      className={"ts-field ts-sel" + (above ? " is-label-above" : " is-label-float") + (floated ? " is-float" : "") + (hasLabel ? "" : " is-nolabel") + calm + (className ? " " + className : "")}
      style={{ maxWidth: maxWidth || undefined, "--fl-left": "14px", "--fl-right": pr + "px", "--sel-h": s[above ? "above" : "float"] + "px", "--sel-ht": s[above ? "aboveT" : "floatT"] + "px", "--sel-fs": s.fs + "px", "--sel-pt": s.pt + "px", "--sel-pr": pr + "px", ...style }}
      onMouseDown={(e) => { if (e.target.closest?.(".ts-field__label") && !isDisabled) { e.preventDefault(); trigger.current?.focus(); } }}
    >
      <BaseSelect.Root
        value={value}
        onValueChange={(v, d) => { for (const x of asArray(v)) if (!asArray(live.current.value).includes(x)) fresh.current.add(x); commit(multiple ? asArray(v) : v, d?.event); }}
        open={isOpen}
        onOpenChange={(o, d) => setOpen(o, REASONS[d?.reason] ?? "other", d?.event)}
        onOpenChangeComplete={(o) => { if (!o) setMounted(false); }}
        modal={false}
        multiple={multiple}
        name={name}
        autoComplete={autoComplete}
        required={required}
        disabled={isDisabled}
        readOnly={readOnly}
        inputRef={inputRef}
      >
        {above && hasLabel && <FieldLabel placement="above" as="span" id={ids.label} required={required}>{text}</FieldLabel>}
        <motion.div className="ts-sel__shake" animate={controls}>
          <div className={"ts-box" + (error ? " is-error" : "") + (isDisabled ? " is-disabled" : "") + (readOnly ? " is-readonly" : "") + (isOpen ? " is-open" : "")} data-force={box}>
            <BaseSelect.Trigger
              {...rest}
              ref={setTrigger}
              id={id}
              className="ts-sel__trigger"
              aria-labelledby={hasLabel ? ids.label : rest["aria-labelledby"]}
              aria-describedby={describedBy}
              aria-invalid={error ? true : undefined}
              aria-busy={isLoading || undefined}
              onKeyDown={(e) => { rest.onKeyDown?.(e); if (!e.defaultPrevented) typeClosed(e); }}
            >
              {!above && hasLabel && <FieldLabel placement="float" as="span" id={ids.label} up={floated} required={required}>{text}</FieldLabel>}
              <BaseSelect.Value className="ts-sel__value">
                {() => (
                  <span className="ts-sel__roll">
                    <AnimatePresence initial={false} custom={dir} mode="popLayout">
                      <motion.span key={valueKey || (shown ? "ph" : "none")} className="ts-sel__val" custom={dir} variants={variants} initial="enter" animate="center" exit="exit" transition={rollSpring}>
                        {shown}
                      </motion.span>
                    </AnimatePresence>
                  </span>
                )}
              </BaseSelect.Value>
            </BaseSelect.Trigger>
            {showClear && (
              <button type="button" className="ts-iconbtn ts-sel__clear" aria-label={labels.clear}
                onClick={(e) => { commit(multiple ? [] : null, e.nativeEvent); trigger.current?.focus(); }}>
                <Icon name="x" size={16} stroke={2} />
              </button>
            )}
            {!readOnly && <span className="ts-sel__chev" aria-hidden><Icon name="chevronDown" size={16} stroke={2.2} /></span>}
          </div>
        </motion.div>
        {hasMsgRow && <FieldMessage id={ids.msg} hint={helper} error={error} />}
        {showLayer && <LayerHost anchor={trigger} owner={fieldRef} tabOut={trigger} onHost={setHost} />}
        {showLayer && host && (
          <BaseSelect.Portal container={host}>
            <BaseSelect.Positioner className="ts-sel-pos" side={side} align={align} sideOffset={6} collisionPadding={8} alignItemWithTrigger={false}>
              <BaseSelect.Popup className={"ts-sel-pop" + (matchTriggerWidth ? " is-match" : "") + calm} style={{ "--sel-max": maxHeight + "px" }}>
                <BaseSelect.ScrollUpArrow key={skeleton ? "su" : "u"} className="ts-sel-arrow"><Icon name="chevronUp" size={14} stroke={2.2} /></BaseSelect.ScrollUpArrow>
                <BaseSelect.List className="ts-sel-list" ref={listEl} aria-busy={isLoading || undefined}>
                  {!skeleton && <motion.div ref={(n) => { pill.current = n; if (n) { hl.current.h = 0; n.style.height = "0px"; } }} className="ts-sel-pill" style={{ opacity: fade }} aria-hidden />}
                  {(skeleton ? [] : blocks).map((blk, bi) => {
                    const rows = blk.items.map((opt) => {
                      const o = order++;
                      return (
                        <BaseSelect.Item key={String(opt.value)} value={opt.value} disabled={!!opt.disabled} label={textOf(opt)}
                          render={(props, state) => <Row props={props} state={state} opt={opt} ctx={{ ...ctx, order: () => o }} />} />
                      );
                    });
                    return blk.label != null ? (
                      <BaseSelect.Group key={"g" + bi} className="ts-sel-group">
                        <BaseSelect.GroupLabel className="ts-sel-group__label">{blk.label}</BaseSelect.GroupLabel>
                        {rows}
                      </BaseSelect.Group>
                    ) : <div key={"b" + bi} className="ts-sel-group" role="presentation">{rows}</div>;
                  })}
                  {skeleton && [70, 52, 62, 44].map((w, i) => <div key={i} className="ts-sel-skel" aria-hidden><i style={{ width: w + "%" }} /></div>)}
                  {isLoading && <div className={skeleton ? "ts-sel-sr" : "ts-sel-note"} role="status">{labels.loading}</div>}
                  {!isLoading && !flat.length && <div className="ts-sel-note" role="status">{labels.empty}</div>}
                </BaseSelect.List>
                <BaseSelect.ScrollDownArrow key={skeleton ? "sd" : "d"} className="ts-sel-arrow"><Icon name="chevronDown" size={14} stroke={2.2} /></BaseSelect.ScrollDownArrow>
              </BaseSelect.Popup>
            </BaseSelect.Positioner>
          </BaseSelect.Portal>
        )}
      </BaseSelect.Root>
    </div></>
  );
});
