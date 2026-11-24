"use client";
import { Children, cloneElement, createContext, forwardRef, isValidElement, useCallback, useContext, useEffect, useId, useMemo, useRef, useState } from "react";

import { Tooltip as BaseTooltip } from "@base-ui/react/tooltip";
import { registerStyles, useStyles, useIsoLayoutEffect, useReducedMotion, refOf } from "../_shared/theme.jsx";
import { Icon } from "../_shared/icons.jsx";
import { LayerHost } from "../_shared/overlay.jsx";

// ---- springs as CSS easing --------------------------------------------------------------------------------------
// The behaviour layer moves the bubble with CSS transitions (left/top on the positioner, width/height on the popup),
// so the springs are sampled into linear() curves: time-based, the same at 60 and 120 Hz, retargeted mid-flight.
function spring(stiffness, damping) {
  const w0 = Math.sqrt(stiffness), z = damping / (2 * w0);
  const x = (t) => {
    if (z < 1) { const wd = w0 * Math.sqrt(1 - z * z); return 1 - Math.exp(-z * w0 * t) * (Math.cos(wd * t) + ((z * w0) / wd) * Math.sin(wd * t)); }
    return 1 - Math.exp(-w0 * t) * (1 + w0 * t);
  };
  let end = 0.05;
  for (let t = 0; t < 2; t += 0.004) if (Math.abs(1 - x(t)) > 0.003) end = t + 0.004;
  const n = 36, pts = [];
  for (let i = 0; i <= n; i++) pts.push(i === n ? 1 : Math.round(x((end * i) / n) * 10000) / 10000);
  return `${Math.round(end * 1000)}ms linear(${pts.join(",")})`;
}
const GLIDE = spring(420, 40);   // the slide between neighbours: damping ratio ~0.98, no overshoot
const GROW = spring(560, 30);    // opening: damping ratio ~0.63, under 1% overshoot on a 0.9 → 1 scale

const CSS = `
.ts-tt-pos{z-index:1;width:var(--positioner-width);height:var(--positioner-height);max-width:var(--available-width)}
.ts-tt-pos.is-glide{transition:top ${GLIDE},left ${GLIDE},right ${GLIDE},bottom ${GLIDE}}
.ts-tt{--tip-bg:var(--ts-ink);--tip-fg:var(--ts-bg);--tip-soft:color-mix(in srgb,var(--ts-bg) 76%,var(--ts-ink));
  box-sizing:border-box;position:relative;width:var(--popup-width,auto);height:var(--popup-height,auto);
  max-width:min(var(--tip-max,240px),calc(100vw - 16px));border-radius:var(--ts-radius-sm);
  background:var(--tip-bg);color:var(--tip-fg);box-shadow:var(--ts-shadow);font:500 12.5px/1.35 var(--ts-font);letter-spacing:-0.003em;
  transform-origin:var(--transform-origin);outline:0;pointer-events:auto;
  transition:transform ${GROW},opacity 140ms ease-out,width ${GLIDE},height ${GLIDE}}
.ts-tt.is-soft{--tip-bg:var(--ts-surface);--tip-fg:var(--ts-ink);--tip-soft:var(--ts-ink2);box-shadow:inset 0 0 0 1px var(--ts-line),var(--ts-shadow)}
.ts-tt[data-starting-style]{opacity:0;transform:scale(.88)}
.ts-tt[data-ending-style]{opacity:0;transform:scale(.95);transition:transform 110ms cubic-bezier(.4,0,1,1),opacity 110ms ease-in,width ${GLIDE},height ${GLIDE}}
.ts-tt[data-instant=dismiss]{transition:none}
.ts-tt__arrow{display:block;width:14px;height:7px;color:var(--tip-bg)}
.ts-tt__arrow svg{display:block;overflow:visible}
.ts-tt__arrow[data-side=top]{bottom:-6px}
.ts-tt__arrow[data-side=bottom]{top:-6px;rotate:180deg}
.ts-tt__arrow[data-side=left]{right:-9.5px;rotate:-90deg}
.ts-tt__arrow[data-side=right]{left:-9.5px;rotate:90deg}
.ts-tt__edge{display:none}
.ts-tt.is-soft .ts-tt__edge{display:block}
.ts-tt-pos.is-glide .ts-tt__arrow{transition:left ${GLIDE},top ${GLIDE}}
.ts-tt__vp{position:relative;box-sizing:border-box;width:100%;height:100%;overflow:clip;padding:6px 9px}
.ts-tt__vp [data-current],.ts-tt__vp [data-previous]{width:calc(var(--popup-width) - 18px);translate:0 0;opacity:1;
  transition:translate ${GLIDE},opacity 160ms ease-out}
.ts-tt__vp[data-activation-direction~=right] [data-current][data-starting-style]{translate:45% 0;opacity:0}
.ts-tt__vp[data-activation-direction~=left] [data-current][data-starting-style]{translate:-45% 0;opacity:0}
.ts-tt__vp[data-activation-direction~=right] [data-previous][data-ending-style]{translate:-45% 0;opacity:0}
.ts-tt__vp[data-activation-direction~=left] [data-previous][data-ending-style]{translate:45% 0;opacity:0}
.ts-tt__vp[data-activation-direction~=down]:not([data-activation-direction~=left]):not([data-activation-direction~=right]) [data-current][data-starting-style]{translate:0 60%;opacity:0}
.ts-tt__vp[data-activation-direction~=up]:not([data-activation-direction~=left]):not([data-activation-direction~=right]) [data-current][data-starting-style]{translate:0 -60%;opacity:0}
.ts-tt__vp[data-activation-direction~=down]:not([data-activation-direction~=left]):not([data-activation-direction~=right]) [data-previous][data-ending-style]{translate:0 -60%;opacity:0}
.ts-tt__vp[data-activation-direction~=up]:not([data-activation-direction~=left]):not([data-activation-direction~=right]) [data-previous][data-ending-style]{translate:0 60%;opacity:0}
.ts-tt__row{display:flex;align-items:center;gap:8px}
.ts-tt__label{min-width:0;overflow-wrap:anywhere;font-weight:560}
.ts-tt__keys{display:inline-flex;gap:3px;flex:none;margin-right:-2px}
.ts-tt__kbd{display:inline-grid;place-items:center;box-sizing:border-box;min-width:17px;height:17px;padding:0 4px;border-radius:4px;
  font:500 10.5px/1 var(--ts-font-mono);font-variant-numeric:tabular-nums;color:var(--tip-soft);
  background:color-mix(in srgb,var(--tip-fg) 12%,transparent);box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--tip-fg) 10%,transparent)}
.ts-tt.is-soft .ts-tt__kbd{background:var(--ts-surface2);box-shadow:inset 0 0 0 1px var(--ts-line)}
.ts-tt__desc{display:block;margin-top:2px;font-size:12px;font-weight:450;line-height:1.4;color:var(--tip-soft)}
.ts-tt-wrap{display:inline-flex;vertical-align:middle;cursor:not-allowed}
.ts-tt-wrap > [disabled]{pointer-events:none}
@media (hover:none),(pointer:coarse){
  .ts-tt{font-size:13px}
  .ts-tt__keys{display:none}
  .ts-tt-trigger{-webkit-touch-callout:none;-webkit-user-select:none;user-select:none}
}
.ts-tt.is-calm,.ts-tt.is-calm[data-ending-style]{transition:opacity 120ms ease-out}
.ts-tt.is-calm[data-starting-style],.ts-tt.is-calm[data-ending-style]{transform:none}
.ts-tt-pos.is-calm,.ts-tt-pos.is-calm .ts-tt__arrow,.ts-tt.is-calm .ts-tt__vp [data-current],.ts-tt.is-calm .ts-tt__vp [data-previous]{transition:none}
.ts-tt.is-calm .ts-tt__vp [data-previous]{display:none}
@media (prefers-reduced-motion:reduce){
  .ts-tt,.ts-tt[data-ending-style]{transition:opacity 120ms ease-out}
  .ts-tt[data-starting-style],.ts-tt[data-ending-style]{transform:none}
  .ts-tt-pos.is-glide,.ts-tt-pos .ts-tt__arrow,.ts-tt__vp [data-current],.ts-tt__vp [data-previous]{transition:none}
  .ts-tt__vp [data-previous]{display:none}
}

/* demo: an editor toolbar */
.ts-ttdemo{display:flex;flex-direction:column;align-items:center;gap:22px;padding:58px 8px 8px;font-family:var(--ts-font);max-width:100%;box-sizing:border-box}
.ts-ttdemo__bar{display:flex;flex-wrap:wrap;justify-content:center;align-items:center;gap:2px;padding:4px;max-width:100%;box-sizing:border-box;
  background:var(--ts-surface);border-radius:calc(var(--ts-radius-md) + 4px);box-shadow:inset 0 0 0 1px var(--ts-line),var(--ts-shadow)}
.ts-ttdemo__sep{width:1px;height:20px;margin:0 4px;background:var(--ts-line)}
.ts-ttdemo__btn{all:unset;box-sizing:border-box;position:relative;display:grid;place-items:center;width:36px;height:36px;border-radius:var(--ts-radius-sm);
  color:var(--ts-ink2);cursor:pointer;transition:background-color .15s,color .15s,transform .18s cubic-bezier(.3,1.4,.5,1);-webkit-tap-highlight-color:transparent}
.ts-ttdemo__btn:hover,.ts-ttdemo__btn[data-popup-open]{background:var(--ts-surface2);color:var(--ts-ink)}
.ts-ttdemo__btn:active{transform:scale(.9);transition-duration:.06s}
.ts-ttdemo__btn:focus-visible{outline:2px solid var(--ts-focus);outline-offset:1px;color:var(--ts-ink)}
.ts-ttdemo__btn[aria-pressed=true]{background:color-mix(in srgb,var(--ts-accent) 16%,transparent);color:var(--ts-ink)}
.ts-ttdemo__file{display:flex;align-items:center;gap:10px;max-width:min(320px,100%);padding:8px 12px;border-radius:var(--ts-radius-md);
  background:var(--ts-surface);box-shadow:inset 0 0 0 1px var(--ts-line);color:var(--ts-ink);font-size:13px;box-sizing:border-box}
.ts-ttdemo__name{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-weight:560;border-radius:4px}
.ts-ttdemo__name:focus-visible{outline:2px solid var(--ts-focus);outline-offset:2px}
.ts-ttdemo__meta{flex:none;color:var(--ts-ink2);font-size:12px;font-variant-numeric:tabular-nums}
@media (max-width:640px),(pointer:coarse){.ts-ttdemo__btn{width:44px;height:44px}.ts-ttdemo__name{padding:14px 0;margin:-14px 0}}
@media (prefers-reduced-motion:reduce){.ts-ttdemo__btn:active{transform:none}}
`;
registerStyles("ts-tooltip", CSS);

// ---- shortcuts --------------------------------------------------------------------------------------------------
const MOD = { "⌘": "Meta", "⇧": "Shift", "⌥": "Alt", "⌃": "Control", cmd: "Meta", command: "Meta", meta: "Meta", ctrl: "Control", control: "Control", shift: "Shift", alt: "Alt", option: "Alt", opt: "Alt" };
const NAMED = { "↵": "Enter", "⏎": "Enter", enter: "Enter", return: "Enter", esc: "Escape", escape: "Escape", "⎋": "Escape", "⌫": "Backspace", backspace: "Backspace", "⌦": "Delete", del: "Delete", delete: "Delete", tab: "Tab", "⇥": "Tab", space: "Space", "␣": "Space", "↑": "ArrowUp", "↓": "ArrowDown", "←": "ArrowLeft", "→": "ArrowRight", home: "Home", end: "End", pageup: "PageUp", pagedown: "PageDown" };
const GLYPHS = "⌘⇧⌥⌃";

/** The keys to draw: an array as given; "⌘⇧K" → ["⌘","⇧","K"]; "Ctrl+Shift+K" → ["Ctrl","Shift","K"]. */
function keysOf(shortcut) {
  if (shortcut == null || shortcut === "") return [];
  if (Array.isArray(shortcut)) return shortcut.map(String).filter(Boolean);
  const s = String(shortcut).trim();
  if (/\S\+\S/.test(s)) return s.split("+").map((k) => k.trim()).filter(Boolean);
  const out = [];
  let i = 0;
  while (i < s.length && GLYPHS.includes(s[i])) out.push(s[i++]);
  const rest = s.slice(i).trim();
  if (rest) out.push(rest);
  return out;
}
/** aria-keyshortcuts value ("Meta+Shift+K"), or null when the keys cannot be parsed. */
function ariaKeys(keys) {
  if (!keys.length) return null;
  const parts = keys.map((k) => {
    const low = k.toLowerCase();
    if (MOD[k] || MOD[low]) return { mod: MOD[k] || MOD[low] };
    if (NAMED[k] || NAMED[low]) return { key: NAMED[k] || NAMED[low] };
    if (/^[a-z0-9]$/i.test(k)) return { key: k.toUpperCase() };
    if (/^f([1-9]|1[0-9]|2[0-4])$/i.test(k)) return { key: k.toUpperCase() };
    if (/^[\p{P}\p{S}]$/u.test(k)) return { key: k };
    return null;
  });
  if (parts.some((p) => !p)) return null;
  const last = parts[parts.length - 1];
  if (!last.key || parts.slice(0, -1).some((p) => !p.mod)) return null;
  return parts.map((p) => p.mod || p.key).join("+");
}

const REASON = { "trigger-hover": "hover", "trigger-focus": "focus", "trigger-press": "press", "escape-key": "escape", "outside-press": "outside", disabled: "disabled", "imperative-action": "imperative", none: "none" };
const SIDES = new Set(["top", "bottom", "left", "right"]);
const sideAlign = (placement) => {
  const [s, a] = String(placement || "top").split("-");
  return [SIDES.has(s) ? s : "top", a === "start" || a === "end" ? a : "center"];
};
const textOf = (node) => (node == null || typeof node === "boolean" ? "" : typeof node === "string" || typeof node === "number" ? String(node)
  : Array.isArray(node) ? node.map(textOf).join("") : isValidElement(node) && !node.props["aria-hidden"] ? textOf(node.props.children) : "");
const setRef = (r, el) => { if (typeof r === "function") r(el); else if (r) r.current = el; };

/** Fully scrolled out of the viewport or out of a clipping ancestor. */
function scrolledAway(el) {
  if (!el?.isConnected) return true;
  const r = el.getBoundingClientRect();
  let l = r.left, t = r.top, rt = r.right, b = r.bottom;
  l = Math.max(l, 0); t = Math.max(t, 0); rt = Math.min(rt, innerWidth); b = Math.min(b, innerHeight);
  for (let n = el.parentElement; n && n !== document.body; n = n.parentElement) {
    const s = getComputedStyle(n);
    if (s.overflowX === "visible" && s.overflowY === "visible") continue;
    const q = n.getBoundingClientRect();
    l = Math.max(l, q.left); t = Math.max(t, q.top); rt = Math.min(rt, q.right); b = Math.min(b, q.bottom);
  }
  return rt - l <= 0 || b - t <= 0;
}
/** Close (once) when `el` scrolls away while open. One listener, only while open. */
function useCloseOnScrollAway(open, getEl, close) {
  const cb = useRef(close);
  cb.current = close;
  useEffect(() => {
    if (!open) return;
    const on = () => { if (scrolledAway(getEl())) cb.current(); };
    addEventListener("scroll", on, { capture: true, passive: true });
    return () => removeEventListener("scroll", on, { capture: true });
  }, [open]);
}

// ---- the bubble -------------------------------------------------------------------------------------------------
const ARROW = "M0 0 L5.4 5.4 Q7 7 8.6 5.4 L14 0 Z";
const EDGE = "M0 0 L5.4 5.4 Q7 7 8.6 5.4 L14 0";

function Content({ p }) {
  return (
    <>
      <span className="ts-tt__row">
        <span className="ts-tt__label">{p.label}</span>
        {p.keys.length > 0 && (
          <span className="ts-tt__keys" aria-hidden>
            {p.keys.map((k, i) => <kbd key={i} className="ts-tt__kbd">{k}</kbd>)}
          </span>
        )}
      </span>
      {p.description != null && p.description !== "" && <span className="ts-tt__desc">{p.description}</span>}
    </>
  );
}

function Bubble({ p, host, glide, calm }) {
  const [side, align] = sideAlign(p.placement);
  const { className, style, rest } = p;
  return (
    <BaseTooltip.Portal container={host}>
      <BaseTooltip.Positioner className={"ts-tt-pos" + (glide ? " is-glide" : "") + (calm ? " is-calm" : "")}
        side={side} align={align} sideOffset={p.offset} collisionPadding={8} arrowPadding={10}>
        <BaseTooltip.Popup
          {...rest}
          role="tooltip"
          id={p.bubbleId}
          data-ts-tip=""
          className={"ts-tt" + (p.surface === "soft" ? " is-soft" : "") + (calm ? " is-calm" : "") + (className ? " " + className : "")}
          style={{ "--tip-max": p.maxWidth > 0 ? p.maxWidth + "px" : "calc(100vw - 16px)", ...style }}
          render={(props) => <div {...props} tabIndex={undefined} />}
        >
          {p.arrow && (
            <BaseTooltip.Arrow className="ts-tt__arrow">
              <svg width="14" height="7" viewBox="0 0 14 7" aria-hidden>
                <path d={ARROW} fill="currentColor" />
                <path className="ts-tt__edge" d={EDGE} fill="none" stroke="var(--ts-line)" strokeWidth="1" />
              </svg>
            </BaseTooltip.Arrow>
          )}
          <BaseTooltip.Viewport className="ts-tt__vp"><Content p={p} /></BaseTooltip.Viewport>
        </BaseTooltip.Popup>
      </BaseTooltip.Positioner>
    </BaseTooltip.Portal>
  );
}

/** Mount the layer host while open or closing; set `glide` once the bubble has shown at a trigger. */
function usePresence(open) {
  const [present, setPresent] = useState(open);
  const [glide, setGlide] = useState(false);
  useIsoLayoutEffect(() => { if (open) setPresent(true); }, [open]);
  useEffect(() => {
    if (!open) return;
    let a, b;
    a = requestAnimationFrame(() => { b = requestAnimationFrame(() => setGlide(true)); });
    return () => { cancelAnimationFrame(a); cancelAnimationFrame(b); };
  }, [open]);
  const done = useCallback((o) => { if (!o) { setPresent(false); setGlide(false); } }, []);
  return { present: open || present, glide: open && glide, done };
}

// ---- group ------------------------------------------------------------------------------------------------------
const GroupCtx = createContext(null);

/**
 * TooltipGroup — wrap a toolbar or a row of icon buttons. Every Tooltip inside shares one bubble: after the first
 * opens, moving to a neighbour slides the same bubble there (no second delay) and morphs it to the new label.
 * Leaving every trigger for longer than `grace` ms makes the next one wait `delay` again.
 */
export function TooltipGroup({
  delay = 500,
  closeDelay = 0,
  grace = 400,
  disabled = false,
  children,
}) {
  const sheetTag = useStyles("ts-tooltip", CSS);
  const calm = useReducedMotion();
  const [handle] = useState(() => BaseTooltip.createHandle());
  const [inner, setInner] = useState({ open: false, id: null });
  const [held, setHeld] = useState({});   // trigger id → true / false for tooltips whose open state the caller holds
  const reg = useRef(new Map());          // trigger id → { onOpenChange }
  const [host, setHost] = useState(null);

  const heldOpen = Object.keys(held).find((k) => held[k] === true);
  const open = !disabled && (heldOpen ? true : inner.open && held[inner.id] !== false);
  const activeId = heldOpen ?? inner.id;
  const { present, glide, done } = usePresence(open);
  const owner = useRef(null);
  owner.current = (activeId && document.getElementById(activeId)?.parentElement) || null;

  const stateRef = useRef({ open, id: activeId });
  stateRef.current = { open, id: activeId };
  const change = useCallback((o, id, reason, event) => {
    const prev = stateRef.current;
    const target = id ?? prev.id;
    setInner({ open: o, id: target });
    if (o && prev.open && prev.id && prev.id !== target) reg.current.get(prev.id)?.onOpenChange?.(false, "move", event);
    if (o !== prev.open || target !== prev.id) reg.current.get(target)?.onOpenChange?.(o, reason, event);
  }, []);

  const ctx = useMemo(() => ({
    handle,
    disabled,
    register: (id, entry) => { reg.current.set(id, entry); return () => reg.current.delete(id); },
    hold: (id, v) => setHeld((h) => (h[id] === v ? h : v === undefined ? (({ [id]: _, ...r }) => r)(h) : { ...h, [id]: v })),
    openFor: (id, reason) => change(true, id, reason),
    close: (reason) => change(false, null, reason),
    isOpen: (id) => stateRef.current.open && stateRef.current.id === id,
  }), [handle, change, disabled]);

  useCloseOnScrollAway(open, () => document.getElementById(stateRef.current.id), () => change(false, null, "scroll"));

  return (
    <>{sheetTag}<BaseTooltip.Provider delay={delay} closeDelay={closeDelay} timeout={grace}>
      <GroupCtx.Provider value={ctx}>{children}</GroupCtx.Provider>
      {present && <LayerHost owner={owner} onHost={setHost} />}
      <BaseTooltip.Root handle={handle} open={open} triggerId={activeId} disabled={disabled}
        onOpenChange={(o, d) => change(o, d.trigger?.id ?? null, REASON[d.reason] ?? d.reason, d.event)}
        onOpenChangeComplete={done}>
        {({ payload }) => (present && host && payload ? <Bubble p={payload} host={host} glide={glide} calm={calm} /> : null)}
      </BaseTooltip.Root>
    </BaseTooltip.Provider></>
  );
}

// ---- demo -------------------------------------------------------------------------------------------------------
const DEMO = [
  { id: "bold", icon: "bold", label: "Bold", shortcut: "⌘B", toggle: true },
  { id: "italic", icon: "italic", label: "Italic", shortcut: "⌘I", toggle: true },
  { id: "link", icon: "link", label: "Add link", shortcut: "⌘K" },
  { id: "image", icon: "image", label: "Insert image", shortcut: "⌘⇧I" },
  { sep: true },
  { id: "comment", icon: "message", label: "Comment", shortcut: "⌘⌥M" },
  { id: "share", icon: "share", label: "Share", shortcut: "⌘⇧S", description: "Anyone with the link can view" },
  { id: "more", icon: "more", label: "More actions" },
];
const HELD = "link";

function DemoWorld({ held, tip }) {
  const [on, setOn] = useState({ bold: true });
  return (
    <div className="ts-ttdemo">
      <TooltipGroup disabled={tip.disabled}>
        <div className="ts-ttdemo__bar" role="group" aria-label="Formatting">
          {DEMO.map((it, i) => it.sep ? <span key={"s" + i} className="ts-ttdemo__sep" aria-hidden /> : (
            <Tooltip key={it.id} {...tip} label={it.label} shortcut={it.shortcut} description={it.id === HELD && tip.description ? tip.description : it.description}
              forceState={held && it.id === HELD ? "open" : undefined}>
              <button type="button" className="ts-ttdemo__btn" aria-pressed={it.toggle ? !!on[it.id] : undefined}
                onClick={() => it.toggle && setOn((s) => ({ ...s, [it.id]: !s[it.id] }))}>
                <Icon name={it.icon} size={17} />
              </button>
            </Tooltip>
          ))}
        </div>
      </TooltipGroup>
      <div className="ts-ttdemo__file">
        <Tooltip {...tip} label="Harbour survey notes, draft 3 (shared with the field team).md">
          <span className="ts-ttdemo__name" tabIndex={0}>Harbour survey notes, draft 3 (shared with the field team).md</span>
        </Tooltip>
        <span className="ts-ttdemo__meta">Edited 4 min ago</span>
      </div>
    </div>
  );
}

// ---- tooltip ----------------------------------------------------------------------------------------------------
/**
 * Tooltip — a short name or hint for a control with no room for visible text (an icon button, a truncated label,
 * a keyboard shortcut). Wrap exactly one element that takes a ref and handlers. Built on a headless behaviour
 * layer; the bubble renders through the kit's layer so it keeps the theme found at its trigger and no ancestor
 * clips it. Signature: inside a TooltipGroup, one bubble glides between neighbours.
 */
export const Tooltip = forwardRef(function Tooltip({
  children,
  label = "",
  shortcut = "",
  description = "",
  placement = "top",
  offset = 10,
  arrow = true,
  surface = "solid",
  maxWidth = 240,
  delay,
  closeDelay,
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  disabled = false,
  describes = "auto",
  id,
  demo = false,
  forceState,
  className,
  style,
  ...rest
}, ref) {
  const sheetTag = useStyles("ts-tooltip", CSS);
  const calm = useReducedMotion();
  const group = useContext(GroupCtx);
  const auto = useId().replace(/:/g, "");
  const child = Children.count(children) === 1 && isValidElement(children) ? children : null;
  const has = label != null && label !== "" && label !== false;
  const trigId = (child && child.props.id) || "ts-tt-t" + auto;
  const base = id || "ts-tt-" + auto;
  const forceOpen = forceState === "open";

  // ---- open state (standalone; inside a group the group owns it) ----
  const [innerOpen, setInnerOpen] = useState(defaultOpen);
  const controlled = openProp !== undefined;
  const wanted = forceOpen ? true : controlled ? !!openProp : innerOpen;
  const open = !group && !disabled && has && wanted;
  const cb = useRef(onOpenChange);
  cb.current = onOpenChange;
  const change = (o, reason, event) => {
    if (!controlled) setInnerOpen(o);
    if (o !== open) cb.current?.(o, reason, event);
  };
  const { present, done } = usePresence(open);
  const [host, setHost] = useState(null);
  const [ownHandle] = useState(() => BaseTooltip.createHandle());
  const trigEl = useRef(null);

  // inside a group: register, and hand over a held open state
  useIsoLayoutEffect(() => {
    if (!group || !has) return;
    return group.register(trigId, { onOpenChange: (...a) => { if (!controlled) setInnerOpen(a[0]); cb.current?.(...a); } });
  }, [group, trigId, has, controlled]);
  const heldVal = disabled ? undefined : forceOpen ? true : controlled ? !!openProp : undefined;
  useIsoLayoutEffect(() => {
    if (!group || !has) return;
    group.hold(trigId, heldVal);
    return () => group.hold(trigId, undefined);
  }, [group, trigId, has, heldVal]);

  useCloseOnScrollAway(open, () => trigEl.current, () => change(false, "scroll"));

  // ---- the name the trigger already has ----
  const childNamed = !!(child && (child.props["aria-label"] || child.props["aria-labelledby"] || textOf(child.props.children).trim()));
  const [named, setNamed] = useState(childNamed);
  useIsoLayoutEffect(() => {
    const el = trigEl.current;
    if (!el || !has) return;
    const own = el.getAttribute("data-ts-tip-own") === "label";
    const n = childNamed || (!own && el.hasAttribute("aria-label")) || el.hasAttribute("aria-labelledby") && !el.getAttribute("aria-labelledby").includes(base + "-label") || !!el.textContent.trim();
    if (n !== named) setNamed(n);
  });
  const mode = describes === "label" || describes === "description" ? describes : named ? "description" : "label";

  // ---- long press on touch ----
  const press = useRef({ t: 0, close: 0, peeked: false });
  useEffect(() => () => { clearTimeout(press.current.t); clearTimeout(press.current.close); }, []);
  const openBy = (reason) => (group ? group.openFor(trigId, reason) : change(true, reason));
  const closeBy = (reason) => (group ? (group.isOpen(trigId) && group.close(reason)) : change(false, reason));

  const keys = keysOf(shortcut);
  const aria = ariaKeys(keys);
  const labelText = typeof label === "string" || typeof label === "number" ? String(label) : textOf(label);
  const descParts = [];
  if (mode === "description") descParts.push(labelText);
  if (description) descParts.push(typeof description === "string" ? description : textOf(description));
  if (keys.length && !aria) descParts.push("Shortcut " + keys.join(" "));
  const descText = descParts.filter(Boolean).join(". ");

  const payload = useMemo(() => ({
    label, keys, description, placement, offset, arrow, surface, maxWidth, className, style, rest, bubbleId: base + "-bubble",
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [label, keys.join("\u0001"), description, placement, offset, arrow, surface, maxWidth, className, JSON.stringify(style ?? null), JSON.stringify(rest, (k, v) => (typeof v === "function" ? "fn" : v)), base]);

  if (!child) return <>{sheetTag}{demo ? <DemoWorld held={forceOpen} tip={{ placement, offset, arrow, surface, maxWidth, disabled, description }} /> : null}</>;
  if (!has) return <>{sheetTag}{cloneElement(child, { ref: (el) => { setRef(ref, el); setRef(refOf(child), el); } })}</>;

  const cp = child.props;
  const isDisabledChild = cp.disabled === true;
  const describedBy = [cp["aria-describedby"], descText ? base : null].filter(Boolean).join(" ") || undefined;
  const addLabel = mode === "label" && !cp["aria-label"] && !cp["aria-labelledby"];
  const triggerProps = {
    id: trigId,
    className: (cp.className ? cp.className + " " : "") + "ts-tt-trigger",
    "aria-label": addLabel && typeof label !== "object" ? labelText : cp["aria-label"],
    "aria-labelledby": addLabel && typeof label === "object" ? base + "-label" : cp["aria-labelledby"],
    "aria-describedby": describedBy,
    "aria-keyshortcuts": cp["aria-keyshortcuts"] ?? aria ?? undefined,
    "data-ts-tip-own": addLabel ? "label" : undefined,
    onPointerDown: (e) => {
      cp.onPointerDown?.(e);
      const p = press.current;
      p.peeked = false;
      clearTimeout(p.t); clearTimeout(p.close);
      if (e.pointerType === "touch" && !disabled && !(group && group.disabled)) p.t = setTimeout(() => { p.peeked = true; openBy("touch"); }, 500);
    },
    onPointerUp: (e) => { cp.onPointerUp?.(e); release(); },
    onPointerCancel: (e) => { cp.onPointerCancel?.(e); release(); },
    onContextMenu: (e) => { if (press.current.peeked || press.current.t) { if (e.nativeEvent.pointerType !== "mouse" && press.current.peeked) e.preventDefault(); } cp.onContextMenu?.(e); },
    onClickCapture: (e) => {
      if (press.current.peeked) { e.preventDefault(); e.stopPropagation(); press.current.peeked = false; return; }
      cp.onClickCapture?.(e);
    },
  };
  function release() {
    const p = press.current;
    clearTimeout(p.t); p.t = 0;
    if (p.peeked) p.close = setTimeout(() => closeBy("touch"), 1500);
  }

  const mergedRef = (el) => { setRef(ref, el); };
  const childEl = cloneElement(child, isDisabledChild ? { ...triggerProps, id: cp.id, ref: (el) => { setRef(ref, el); setRef(refOf(child), el); } } : triggerProps);
  const trigger = (
    <BaseTooltip.Trigger
      ref={(el) => { trigEl.current = el; if (!isDisabledChild) mergedRef(el); }}
      handle={group ? group.handle : ownHandle}
      id={trigId}
      payload={payload}
      delay={group ? delay : delay ?? 500}
      closeDelay={closeDelay}
      disabled={disabled}
      render={isDisabledChild ? <span className="ts-tt-wrap" /> : childEl}
    >
      {isDisabledChild ? childEl : undefined}
    </BaseTooltip.Trigger>
  );
  const hidden = (
    <>
      {descText && <span hidden id={base}>{descText}</span>}
      {addLabel && typeof label === "object" && <span hidden id={base + "-label"}>{label}</span>}
    </>
  );
  if (group) return <>{sheetTag}{trigger}{hidden}</>;
  return (
    <>{sheetTag}
      {trigger}
      <BaseTooltip.Root handle={ownHandle} open={open} triggerId={trigId} disabled={disabled || !has}
        onOpenChange={(o, d) => change(o, REASON[d.reason] ?? d.reason, d.event)} onOpenChangeComplete={done}>
        {({ payload: p }) => (present && host && p ? <Bubble p={p} host={host} glide={false} calm={calm} /> : null)}
      </BaseTooltip.Root>
      {present && <LayerHost anchor={trigEl} onHost={setHost} />}
      {hidden}
    </>
  );
});
