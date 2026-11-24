"use client";
import { forwardRef, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { motion, AnimatePresence, useMotionValue, animate } from "motion/react";
import { registerStyles, useStyles, useIsoLayoutEffect, useReducedMotion } from "../_shared/theme.jsx";
import { Icon } from "../_shared/icons.jsx";

// ---- tiny store: call toast() from anywhere, render <ToastStack /> once
let items = [];
let seq = 0;
const subs = new Set();
const emit = () => subs.forEach((f) => f());
const subscribe = (f) => (subs.add(f), () => subs.delete(f));
const snapshot = () => items;

/**
 * Show a toast. Returns its id. Fields: { id?, title, description?, tone?, duration?, persist?, icon?,
 * action?: { label, onClick(id) }, onDismiss?(id, reason) }. tone: "neutral" | "success" | "danger" | "warning" | "info".
 * Passing an id that is already shown replaces that toast in place (use it to update "Uploading…" to "Uploaded").
 */
export function toast(input) {
  const t = typeof input === "string" ? { title: input } : input;
  const id = t.id ?? "t" + ++seq;
  items = [{ tone: "neutral", ...t, id, at: Date.now() }, ...items.filter((x) => x.id !== id)];
  emit();
  return id;
}
/** Remove one toast (or all, with no id). reason is passed to each toast's onDismiss: "timeout" | "close" | "swipe" | "action" | "dismiss". */
toast.dismiss = (id, reason = "dismiss") => {
  const gone = id ? items.filter((x) => x.id === id) : items;
  items = id ? items.filter((x) => x.id !== id) : [];
  emit();
  gone.forEach((x) => { try { x.onDismiss?.(x.id, reason); } catch (e) { setTimeout(() => { throw e; }); } });
};
/** Change fields of a toast that is showing, without moving it or restarting its timer. */
toast.update = (id, patch) => {
  if (!items.some((x) => x.id === id)) return false;
  items = items.map((x) => (x.id === id ? { ...x, ...patch, id, at: x.at } : x));
  emit();
  return true;
};
toast.success = (title, o) => toast({ ...o, title, tone: "success" });
toast.error = (title, o) => toast({ ...o, title, tone: "danger" });
toast.warning = (title, o) => toast({ ...o, title, tone: "warning" });
toast.info = (title, o) => toast({ ...o, title, tone: "info" });

/** The same API as a hook, plus the toasts on screen: const { toast, dismiss, update, toasts } = useToast(). */
export function useToast() {
  const toasts = useSyncExternalStore(subscribe, snapshot, snapshot);
  return useMemo(() => ({ toast, dismiss: toast.dismiss, update: toast.update, success: toast.success, error: toast.error, toasts }), [toasts]);
}

const ICONS = { success: "check", danger: "alert", warning: "alert", info: "bell", neutral: "bell" };
const DEMO = [
  { title: "Invite sent to Maya", description: "She'll get an email in a minute.", tone: "success", action: { label: "Undo" } },
  { title: "Couldn't upload hero.mov", description: "The file is over 200 MB.", tone: "danger", action: { label: "Retry" } },
  { title: "Draft saved", tone: "neutral" },
  { title: "Your trial ends in 3 days", description: "Add a card to keep your projects.", tone: "warning", action: { label: "Add card" } },
  { title: "New comment on Q3 roadmap", tone: "info" },
];

const CSS = `
.ts-toasts-demo{position:relative;width:440px;max-width:100%;height:var(--ts-h);font-family:var(--ts-font)}
.ts-toasts-bar{display:flex;flex-wrap:wrap;gap:6px;justify-content:center}
.ts-toasts-bar button{all:unset;box-sizing:border-box;height:32px;padding:0 12px;border-radius:99px;font-size:12.5px;font-weight:550;cursor:pointer;color:var(--ts-ink);background:var(--ts-surface2);box-shadow:inset 0 0 0 1px var(--ts-line)}
.ts-toasts-bar button:hover{background:color-mix(in srgb,var(--ts-surface2) 80%,var(--ts-ink))}
.ts-toasts-bar button:focus-visible{outline:2px solid var(--ts-focus);outline-offset:2px}
.ts-toasts{position:absolute;z-index:90;width:min(380px,calc(100% - 0px));margin:0;padding:0;list-style:none;outline:none}
.ts-toasts.is-fixed{position:fixed;width:min(380px,calc(100vw - 32px))}
.ts-toasts[data-pos=bottom-right]{right:0;bottom:0}
.ts-toasts[data-pos=bottom-left]{left:0;bottom:0}
.ts-toasts[data-pos=bottom-center]{left:50%;bottom:0;translate:-50% 0}
.ts-toasts[data-pos=top-center]{left:50%;top:0;translate:-50% 0}
.ts-toasts[data-pos=top-right]{right:0;top:0}
.ts-toasts[data-pos=top-left]{left:0;top:0}
.ts-toasts.is-fixed[data-pos$=right]{right:var(--ts-toast-x,16px)}
.ts-toasts.is-fixed[data-pos$=left]{left:var(--ts-toast-x,16px)}
.ts-toasts.is-fixed[data-pos^=bottom]{bottom:var(--ts-toast-y,16px)}
.ts-toasts.is-fixed[data-pos^=top]{top:var(--ts-toast-y,16px)}
.ts-toast{position:absolute;left:0;right:0;overflow:hidden;border-radius:var(--ts-radius-lg);
  background:var(--ts-surface);color:var(--ts-ink);box-shadow:0 0 0 1px var(--ts-line),0 16px 36px -14px color-mix(in srgb,var(--ts-bg) 70%,var(--ts-black) 30%);touch-action:pan-y;cursor:grab;user-select:none}
.ts-toasts[data-pos^=bottom] .ts-toast{bottom:0;transform-origin:center bottom}
.ts-toasts[data-pos^=top] .ts-toast{top:0;transform-origin:center top}
.ts-toast:active{cursor:grabbing}
.ts-toast__in{display:flex;align-items:flex-start;gap:11px;padding:13px 12px 13px 14px;transition:opacity .2s}
.ts-toast.is-back .ts-toast__in{opacity:0}
.ts-toast__icon{display:grid;place-items:center;width:24px;height:24px;flex:none;border-radius:99px;color:var(--tone);background:color-mix(in srgb,var(--tone) 16%,transparent)}
.ts-toast__body{display:flex;flex-direction:column;gap:2px;min-width:0;flex:1;padding-top:2px}
.ts-toast__title{font-size:13.5px;font-weight:600;line-height:1.3}
.ts-toast__desc{font-size:12.5px;color:var(--ts-ink2);line-height:1.4}
.ts-toast__action{all:unset;flex:none;align-self:center;height:28px;padding:0 10px;border-radius:var(--ts-radius-sm);font-size:12.5px;font-weight:600;cursor:pointer;color:var(--ts-ink);background:var(--ts-surface2)}
.ts-toast__action:hover{background:color-mix(in srgb,var(--ts-surface2) 80%,var(--ts-ink))}
.ts-toast__x{all:unset;display:grid;place-items:center;flex:none;width:24px;height:24px;border-radius:var(--ts-radius-sm);color:var(--ts-ink2);cursor:pointer}
.ts-toast__x:hover{color:var(--ts-ink);background:var(--ts-surface2)}
.ts-toast__action:focus-visible,.ts-toast__x:focus-visible{outline:2px solid var(--ts-focus);outline-offset:1px}
.ts-toast__bar{position:absolute;left:14px;right:14px;bottom:0;height:2px;border-radius:2px;background:var(--tone);opacity:.5;transform-origin:left center}
.ts-toast__x{position:relative}
.ts-toast__x::after{content:"";position:absolute;inset:-8px}
/* phone: the stack is pinned to the screen edge above the safe area, full width, like a native banner */
@media (max-width:640px){
  .ts-toasts.is-fixed,.ts-toasts-demo .ts-toasts{position:fixed;left:12px;right:12px;width:auto;translate:none}
  .ts-toasts.is-fixed[data-pos^=bottom],.ts-toasts-demo .ts-toasts[data-pos^=bottom]{top:auto;bottom:calc(max(16px, env(safe-area-inset-bottom, 0px)) + var(--ts-toast-y,12px))}
  .ts-toasts.is-fixed[data-pos^=top],.ts-toasts-demo .ts-toasts[data-pos^=top]{bottom:auto;top:calc(max(16px, env(safe-area-inset-top, 0px)) + var(--ts-toast-y,12px))}
  .ts-toasts-demo{height:auto}
}
@media (max-width:640px),(pointer:coarse){
  .ts-toasts-bar{gap:8px}
  .ts-toasts-bar button{height:44px;padding:0 16px;font-size:13.5px}
  .ts-toast__in{padding:12px 6px 12px 14px;gap:10px;align-items:center}
  .ts-toast__body{padding-top:0}
  .ts-toast__action{position:relative;height:36px;padding:0 12px;font-size:13.5px}
  .ts-toast__action::after{content:"";position:absolute;inset:-4px -2px}
  .ts-toast__x{width:32px;height:32px;align-self:center}
  .ts-toast__x::after{inset:-6px}
}
`;
registerStyles("ts-toast-stack", CSS);

const noop = () => {};

// Where focus goes when the toast holding it leaves (its × or action, or Escape): the next toast's first button,
// else the previous one's, else back to where focus was before it entered the stack. Nothing moves unless focus is
// inside that toast, so a pointer user's focus is never touched.
const returnTo = new WeakMap();
function handOff(el) {
  if (!el || typeof document === "undefined" || !el.contains(document.activeElement)) return;
  el.setAttribute("data-leaving", "");
  const list = el.parentElement;
  const others = [...(list?.children ?? [])].filter((x) => x !== el && x.hasAttribute("data-toast") && !x.hasAttribute("data-leaving") && !x.inert);
  const after = others.find((x) => el.compareDocumentPosition(x) & Node.DOCUMENT_POSITION_FOLLOWING);
  const next = (after ?? others[others.length - 1])?.querySelector("button");
  if (next) { next.focus({ preventScroll: true }); return; }
  const prior = list && returnTo.get(list);
  // blur first so the stack hears focus leave (a removed element sends no blur) and its timers run again
  document.activeElement.blur?.();
  if (prior?.isConnected) prior.focus({ preventScroll: true });
}
const toneVar = (t) => (t === "neutral" ? "var(--ts-ink2)" : t === "info" ? "var(--ts-accent)" : `var(--ts-${t})`);

function Toast({ t, index, expanded, offset, frontH, count, max, duration: stackDuration, paused, onHeight, reduce, pos }) {
  const duration = t.duration ?? stackDuration;
  const inner = useRef(null);
  const [natural, setNatural] = useState(null);
  useIsoLayoutEffect(() => {
    const el = inner.current;
    const measure = () => { setNatural(el.offsetHeight); onHeight(t.id, el.offsetHeight); };
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    measure();
    return () => ro.disconnect();
  }, []);

  // auto-dismiss; the clock stops while the stack is hovered / focused or the tab is hidden
  const remaining = useRef(duration);
  const startedAt = useRef(Date.now());
  const timed = duration > 0 && !t.persist;
  useEffect(() => {
    if (!timed || paused) return;
    startedAt.current = Date.now();
    const timer = setTimeout(() => toast.dismiss(t.id, "timeout"), remaining.current);
    return () => { clearTimeout(timer); remaining.current -= Date.now() - startedAt.current; };
  }, [paused, timed]);
  const left = Math.max(0, paused ? remaining.current : remaining.current - (Date.now() - startedAt.current));

  const up = pos.startsWith("bottom") ? -1 : 1;
  const hidden = index >= max;
  const back = !expanded && index > 0;
  const y = expanded ? up * offset : up * index * 12;
  const scale = expanded ? 1 : 1 - index * 0.05;
  // x is a motion value we own: drag writes it, release animates it, so no two animations fight over it
  const dx = useMotionValue(0);
  const [swiped, setSwiped] = useState(false);
  // a toast behind the front one (collapsed stack) or past `max` cannot be tapped, tabbed to or read: its buttons sit
  // under the front toast's. The stack fans open on hover, focus or a tap, and then every toast is reachable.
  const li = useRef(null);
  const asleep = hidden || back;
  useIsoLayoutEffect(() => { if (li.current) li.current.inert = asleep; }, [asleep]);
  const close = (reason) => { handOff(li.current); toast.dismiss(t.id, reason); };
  return (
    <motion.li
      ref={li}
      data-toast={t.id}
      className={"ts-toast" + (back ? " is-back" : "")}
      aria-hidden={asleep || undefined}
      style={{ "--tone": toneVar(t.tone), zIndex: count - index, pointerEvents: hidden ? "none" : "auto", x: dx }}
      initial={reduce ? { opacity: 0 } : { opacity: 0, y: up * -24, scale: 0.94 }}
      animate={{ opacity: hidden ? 0 : 1, y, scale, height: back ? frontH : natural ?? "auto" }}
      exit={reduce || swiped ? { opacity: 0, transition: { duration: 0.12 } } : { opacity: 0, scale: 0.94, y: y - up * 12, transition: { duration: 0.2 } }}
      // reduced motion: the stack re-lays out in place and toasts only fade (this holds without a MotionConfig too)
      transition={reduce ? { default: { duration: 0 }, opacity: { duration: 0.18, ease: "easeOut" } } : { type: "spring", stiffness: 420, damping: 36 }}
      // an onUpdate keeps opacity on Motion's frame loop rather than WAAPI, so the exit's final 0 is written before
      // the element goes; with WAAPI a toast that had no animating child repainted at full opacity for one frame
      onUpdate={noop}
      drag="x"
      dragElastic={0.6}
      dragMomentum={false}
      onDragEnd={(_, i) => {
        if (Math.abs(i.offset.x) > 90 || Math.abs(i.velocity.x) > 600) {
          const dir = Math.sign(i.offset.x || i.velocity.x);
          setSwiped(true);
          // reduced motion: no throw, the toast fades out where the finger left it
          if (reduce) toast.dismiss(t.id, "swipe");
          else animate(dx, dir * 440, { duration: 0.2, ease: "easeOut" }).then(() => toast.dismiss(t.id, "swipe"));
        } else if (reduce) animate(dx, 0, { duration: 0.12, ease: "easeOut" });
        else animate(dx, 0, { type: "spring", stiffness: 500, damping: 34 });
      }}
    >
      <div ref={inner} className="ts-toast__in">
        <span className="ts-toast__icon" aria-hidden><Icon name={t.icon ?? ICONS[t.tone] ?? "sparkle"} size={14} stroke={2.4} /></span>
        <span className="ts-toast__body">
          <span className="ts-toast__title">{t.title}</span>
          {t.description && <span className="ts-toast__desc">{t.description}</span>}
        </span>
        {t.action && (
          <button type="button" className="ts-toast__action" tabIndex={back ? -1 : 0} onClick={() => { t.action.onClick?.(t.id); close("action"); }}>{t.action.label}</button>
        )}
        <button type="button" className="ts-toast__x" tabIndex={back ? -1 : 0} style={back ? { visibility: "hidden" } : undefined} aria-label="Dismiss notification" onClick={() => close("close")}><Icon name="x" size={13} stroke={2.2} /></button>
      </div>
      {timed && index === 0 && !reduce && (
        <motion.span key={String(paused)} className="ts-toast__bar" aria-hidden initial={{ scaleX: left / duration }} animate={{ scaleX: paused ? left / duration : 0 }}
          transition={{ duration: paused ? 0 : left / 1000, ease: "linear" }} />
      )}
    </motion.li>
  );
}

/**
 * ToastStack — render once, then call toast({ title, description, tone, action }) from anywhere.
 * Signature: toasts sit stacked like cards, fan open on hover or focus, and can be flicked away sideways.
 * Timers pause while you hover or read, and while the tab is hidden. Danger toasts are alerts; others are status.
 */
export const ToastStack = forwardRef(function ToastStack({
  position = "bottom-right",
  max = 3,
  duration = 6000,
  expand = false,
  fixed = false,
  offset,
  label = "Notifications",
  demo = false,
  showDemo = false,
  height = 360,
  forceState,
  className,
  style,
  ...rest
}, ref) {
  const sheetTag = useStyles("ts-toast-stack", CSS);
  const demoOn = demo || showDemo;
  const reduce = useReducedMotion();
  const list = useSyncExternalStore(subscribe, snapshot, snapshot);
  const [hover, setHover] = useState(false);
  const [focus, setFocus] = useState(false);
  const [hiddenTab, setHiddenTab] = useState(false);
  const [heights, setHeights] = useState({});
  const demoIdx = useRef(0);
  const gap = 10;

  // One polite and one assertive live region exist before any toast does; each toast's text is spoken through
  // them once (a status element that arrives together with its text is often not announced).
  const politeRef = useRef(null);
  const alertRef = useRef(null);
  const said = useRef(new Set());
  const pending = useRef({ polite: [], alert: [], timer: 0 });
  useEffect(() => {
    const key = (t) => t.id + ":" + t.at;
    const fresh = list.filter((t) => !said.current.has(key(t))).reverse();
    said.current = new Set(list.map(key));
    if (!fresh.length) return;
    const q = pending.current;
    // sentences are joined with ". ", so a full stop the text already ends with is dropped first
    const bare = (s) => (typeof s === "string" ? s.replace(/[\s.]+$/, "") : s);
    fresh.forEach((t) => q[t.tone === "danger" ? "alert" : "polite"].push([t.title, t.description].filter(Boolean).map(bare).join(". ")));
    if (q.timer) return;
    // clear first, then write after a beat, so a repeated message is still a change the reader hears
    if (q.polite.length && politeRef.current) politeRef.current.textContent = "";
    if (q.alert.length && alertRef.current) alertRef.current.textContent = "";
    q.timer = setTimeout(() => {
      if (q.polite.length && politeRef.current) politeRef.current.textContent = q.polite.join(". ");
      if (q.alert.length && alertRef.current) alertRef.current.textContent = q.alert.join(". ");
      q.polite = []; q.alert = []; q.timer = 0;
    }, 100);
  }, [list]);
  useEffect(() => () => clearTimeout(pending.current.timer), []);

  useEffect(() => {
    const on = () => setHiddenTab(document.hidden);
    document.addEventListener("visibilitychange", on);
    return () => document.removeEventListener("visibilitychange", on);
  }, []);
  useEffect(() => {
    if (!demoOn) return;
    toast.dismiss();
    [DEMO[2], DEMO[1], DEMO[0]].forEach((d) => toast(d));
    demoIdx.current = 3;
    return () => toast.dismiss();
  }, [demoOn]);

  // the gallery's "open" state is a still: keep the demo toasts on screen (re-seeding if their timers already ran out)
  useEffect(() => {
    if (forceState !== "open" || !demoOn || items.length) return;
    [DEMO[2], DEMO[1], DEMO[0]].forEach((d) => toast(d));
    demoIdx.current = 3;
  }, [forceState, demoOn]);

  const expanded = expand || hover || focus || forceState === "open";
  const paused = hover || focus || hiddenTab || forceState === "open";
  const onHeight = (id, h) => setHeights((s) => (s[id] === h ? s : { ...s, [id]: h }));
  const shown = list.slice(0, max + 1);
  let acc = 0;
  const offsets = shown.map((t) => { const o = acc; acc += (heights[t.id] ?? 64) + gap; return o; });
  const frontH = heights[shown[0]?.id] ?? 64;
  const stackH = expanded ? Math.max(0, acc - gap) : frontH + Math.min(shown.length - 1, max - 1) * 12;

  // offset: distance from the screen edges when fixed (a number, a CSS length, or { x, y }), e.g. to clear a phone's tab bar
  const len = (v) => (v == null ? undefined : typeof v === "number" ? v + "px" : v);
  const offVars = offset == null ? {} : typeof offset === "object" ? { "--ts-toast-x": len(offset.x), "--ts-toast-y": len(offset.y) } : { "--ts-toast-x": len(offset), "--ts-toast-y": len(offset) };
  const { onKeyDown: userKeyDown, ...listRest } = rest;
  // Escape dismisses the toast that holds focus, as its × would
  const keyDown = (e) => {
    userKeyDown?.(e);
    if (e.key !== "Escape" || e.defaultPrevented) return;
    const el = e.target.closest?.("[data-toast]");
    const t = el && e.currentTarget.contains(el) && list.find((x) => String(x.id) === el.getAttribute("data-toast"));
    if (!t) return;
    e.preventDefault();
    handOff(el);
    toast.dismiss(t.id, "close");
  };
  const stack = (
    <ol
      ref={ref}
      {...listRest}
      className={"ts-toasts" + (fixed ? " is-fixed" : "") + (className ? " " + className : "")}
      data-pos={position}
      aria-label={label}
      tabIndex={-1}
      onKeyDown={keyDown}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onFocus={(e) => { if (e.relatedTarget && !e.currentTarget.contains(e.relatedTarget)) returnTo.set(e.currentTarget, e.relatedTarget); setFocus(true); }}
      onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setFocus(false); }}
      // the list box is only the hover area (the toasts are absolutely placed), so it takes its height at once
      style={{ ...offVars, ...style, height: shown.length ? stackH : 0 }}
    >
      <AnimatePresence initial={false}>
        {shown.map((t, i) => (
          <Toast key={t.id} t={t} index={i} expanded={expanded} offset={offsets[i]} frontH={frontH} count={shown.length} max={max} duration={duration}
            paused={paused} onHeight={onHeight} reduce={reduce} pos={position} />
        ))}
      </AnimatePresence>
    </ol>
  );
  const live = (
    <>
      <div ref={politeRef} className="ts-sr" role="status" aria-live="polite" aria-atomic="true" />
      <div ref={alertRef} className="ts-sr" role="alert" aria-live="assertive" aria-atomic="true" />
    </>
  );

  if (!demoOn) return <>{sheetTag}{stack}{live}</>;
  return (
    <>{sheetTag}<div className="ts-toasts-demo" style={{ "--ts-h": height + "px" }}>
      <div className="ts-toasts-bar">
        <button type="button" onClick={() => toast(DEMO[demoIdx.current++ % DEMO.length])}>Show a toast</button>
        <button type="button" onClick={() => toast.success("Changes published")}>Success</button>
        <button type="button" onClick={() => toast.error("Payment failed", { description: "Your card was declined.", action: { label: "Update" } })}>Error</button>
        <button type="button" onClick={() => toast.dismiss()}>Clear</button>
      </div>
      {stack}
      {live}
    </div></>
  );
});
