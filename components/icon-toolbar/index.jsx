"use client";
import { forwardRef, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { registerStyles, useStyles, useReducedMotion } from "../_shared/theme.jsx";
import { Icon } from "../_shared/icons.jsx";

const DEMO_ITEMS = [
  { id: "bold", icon: "bold", label: "Bold", shortcut: "⌘B", toggle: true },
  { id: "italic", icon: "italic", label: "Italic", shortcut: "⌘I", toggle: true },
  { id: "link", icon: "link", label: "Add link", shortcut: "⌘K" },
  { id: "image", icon: "image", label: "Insert image" },
  { sep: true },
  { id: "comment", icon: "message", label: "Comment", shortcut: "⌘⌥M" },
  { id: "more", icon: "more", label: "More" },
];

const CSS = `
.ts-tb{display:inline-flex;align-items:center;gap:2px;padding:4px;font-family:var(--ts-font);
  background:var(--ts-surface);border-radius:calc(var(--ts-radius-md) + 4px);box-shadow:var(--ts-shadow),0 0 0 1px var(--ts-line)}
.ts-tb__sep{width:1px;height:20px;background:var(--ts-line);margin:0 4px}
.ts-ib{all:unset;box-sizing:border-box;position:relative;display:grid;place-items:center;cursor:pointer;color:var(--ts-ink2);
  border-radius:var(--ts-radius-sm);transition:background-color .15s,color .15s;-webkit-tap-highlight-color:transparent}
.ts-ib:hover,.ts-ib[data-force=hover]{background:var(--ts-surface2);color:var(--ts-ink)}
.ts-ib:focus-visible,.ts-ib[data-force=focus]{outline:2px solid var(--ts-focus);outline-offset:1px;color:var(--ts-ink)}
.ts-ib[aria-pressed=true]{background:color-mix(in srgb,var(--ts-accent) 16%,transparent);color:var(--ts-ink)}
.ts-ib.is-circle{border-radius:999px}
.ts-ib.is-solid{background:var(--ts-accent);color:var(--ts-accent-ink)}
.ts-ib:disabled,.ts-ib[aria-disabled=true]{opacity:.4;cursor:not-allowed}
.ts-tip{position:absolute;bottom:calc(100% + 10px);left:50%;pointer-events:none;white-space:nowrap;z-index:30;
  display:flex;gap:8px;align-items:center;padding:6px 9px;border-radius:var(--ts-radius-sm);font-size:12px;font-weight:500;
  background:var(--ts-ink);color:var(--ts-bg);box-shadow:var(--ts-shadow)}
.ts-tip kbd{font-family:var(--ts-font-mono);font-size:10.5px;opacity:.6}
.ts-ib{-webkit-touch-callout:none;-webkit-user-select:none;user-select:none}
.ts-ib::after{content:"";position:absolute;inset:min(0px, calc((100% - 44px) / 2))}
@media (max-width:640px),(pointer:coarse){
  .ts-tb{gap:2px;padding:3px}
  .ts-tb .ts-ib{min-width:44px;min-height:44px}
  .ts-tb .ts-ib::after{inset:0}
  .ts-tip{font-size:13px;padding:7px 10px}
}
@media (pointer:coarse){.ts-tip kbd{display:none}}
`;
registerStyles("ts-icon-toolbar", CSS);

// one button's width and height in px (the bar adds 4px of padding each side): sm for dense panels, lg for touch-first and media controls
const SIZES = { sm: 30, md: 38, lg: 46 };

// Shared across every toolbar on the page: once one tooltip has shown, neighbours show instantly.
let warmUntil = 0;

const EMPTY = [];
const asSet = (v) => new Set(v == null ? [] : [].concat(v));

/**
 * IconToolbar — a row of icon buttons with tooltips (editor toolbars, card actions, media controls).
 * Signature: the first tooltip waits `tooltipDelay`; moving to a neighbour shows its tooltip instantly.
 * role="toolbar" with roving focus: ←/→ (and Home/End) move between enabled buttons, Tab leaves the toolbar.
 * Items: [{ id, label, icon, shortcut?, disabled?, toggle?, pressed? } | { sep: true }]. `icon` is a node or a
 * built-in icon name. Toggle items keep a pressed set: controlled with `value` (array of ids) + `onChange`, or
 * uncontrolled from `defaultValue`. An item's own `pressed` boolean wins for that item.
 */
export const IconToolbar = forwardRef(function IconToolbar({
  items,
  value,
  defaultValue = EMPTY,
  onChange,
  onSelect,
  onAction,
  size = "md",
  shape = "square",
  tooltipDelay = 450,
  showShortcuts = true,
  label = "",
  disabled = false,
  demo = false,
  forceState,
  className,
  style,
  ...rest
}, ref) {
  const sheetTag = useStyles("ts-icon-toolbar", CSS);
  const list = items ?? (demo ? DEMO_ITEMS : EMPTY);
  const buttons = list.filter((i) => !i.sep);
  const [inner, setInner] = useState(() => asSet(defaultValue));
  const pressedSet = value !== undefined ? asSet(value) : inner;
  const isOn = (it) => (typeof it.pressed === "boolean" ? it.pressed : pressedSet.has(it.id));
  const isToggle = (it) => !!it.toggle || typeof it.pressed === "boolean";
  const isOff = (it) => disabled || !!it.disabled;
  const [focusId, setFocusId] = useState(null);
  const refs = useRef({});

  // the one tab stop: the last focused enabled button, else the first enabled one
  const enabled = buttons.filter((b) => !isOff(b));
  const tabId = enabled.some((b) => b.id === focusId) ? focusId : enabled[0]?.id;

  const onKey = (e) => {
    rest.onKeyDown?.(e);
    const n = enabled.length;
    if (!n) return;
    const at = Math.max(0, enabled.findIndex((b) => b.id === tabId));
    const move = (i) => { e.preventDefault(); const it = enabled[(i + n) % n]; setFocusId(it.id); refs.current[it.id]?.focus(); };
    if (e.key === "ArrowRight") move(at + 1);
    else if (e.key === "ArrowLeft") move(at - 1);
    else if (e.key === "Home") move(0);
    else if (e.key === "End") move(n - 1);
  };

  const activate = (it, e) => {
    if (isOff(it)) return;
    let next;
    if (isToggle(it)) {
      const on = !isOn(it);
      next = new Set(pressedSet);
      if (on) next.add(it.id); else next.delete(it.id);
      if (value === undefined) setInner(next);
      onChange?.([...next], { id: it.id, pressed: on, item: it });
    }
    onSelect?.(it.id, it, e);
    onAction?.(it.id);
  };

  if (!list.length) return null;
  return (
    <>{sheetTag}<div
      ref={ref}
      role="toolbar"
      aria-label={label || rest["aria-label"] || (demo ? "Formatting" : undefined)}
      aria-disabled={disabled || undefined}
      {...rest}
      className={"ts-tb" + (className ? " " + className : "")}
      style={style}
      onKeyDown={onKey}
    >
      {list.map((it, i) => {
        if (it.sep) return <span key={"sep" + i} className="ts-tb__sep" aria-hidden />;
        return (
          <IconButton
            key={it.id}
            ref={(el) => { refs.current[it.id] = el; }}
            icon={it.icon}
            label={it.label}
            shortcut={showShortcuts ? it.shortcut : undefined}
            disabled={isOff(it)}
            size={size}
            shape={shape}
            variant={it.variant}
            tooltipDelay={tooltipDelay}
            tabIndex={it.id === tabId ? 0 : -1}
            onFocus={() => setFocusId(it.id)}
            pressed={isToggle(it) ? isOn(it) : undefined}
            forceState={i === list.findIndex((x) => !x.sep) ? forceState : undefined}
            onClick={(e) => activate(it, e)}
          />
        );
      })}
    </div></>
  );
});

/** IconButton — a single icon button with a delayed, warm-aware tooltip. Usable on its own. */
export const IconButton = forwardRef(function IconButton({ icon, label, shortcut, size = "md", shape = "square", variant = "ghost", pressed, tooltipDelay = 450, disabled, forceState, onClick, onFocus, onBlur, className, style, ...rest }, ref) {
  const sheetTag = useStyles("ts-icon-toolbar", CSS);
  const px = typeof size === "number" ? size : SIZES[size] ?? SIZES.md;
  const reduce = useReducedMotion();
  const [tip, setTip] = useState(false);
  const t = useRef(null);
  const peek = useRef(false); // a touch long-press that opened the tooltip reads the label; lifting doesn't fire the action
  useEffect(() => () => clearTimeout(t.current), []);
  const show = () => {
    clearTimeout(t.current);
    if (performance.now() < warmUntil) setTip(true);
    else t.current = setTimeout(() => setTip(true), tooltipDelay);
  };
  const hide = () => {
    clearTimeout(t.current);
    if (tip) warmUntil = performance.now() + 500;
    setTip(false);
  };
  const isDisabled = disabled || forceState === "disabled";
  const showTip = tip || forceState === "hover" || forceState === "focus";
  const force = forceState && forceState !== "default" ? forceState : undefined;

  return (
    <>{sheetTag}<motion.button
      ref={ref}
      type="button"
      {...rest}
      className={`ts-ib${shape === "circle" ? " is-circle" : ""}${variant === "solid" ? " is-solid" : ""}${className ? " " + className : ""}`}
      data-force={force}
      aria-label={rest["aria-label"] ?? label}
      aria-pressed={pressed}
      aria-keyshortcuts={shortcut?.replace("⌘", "Meta+").replace("⇧", "Shift+").replace("⌥", "Alt+")}
      disabled={isDisabled}
      onPointerEnter={show}
      onPointerDown={(e) => { peek.current = e.pointerType !== "mouse"; }}
      onPointerLeave={(e) => { if (e.pointerType === "mouse") hide(); else { clearTimeout(t.current); setTimeout(() => setTip(false), 900); } }}
      onFocus={(e) => { onFocus?.(e); if (e.currentTarget.matches(":focus-visible")) show(); }}
      onBlur={(e) => { onBlur?.(e); hide(); }}
      // Escape puts a tooltip away without moving focus, so it never hides what is under it
      onKeyDown={(e) => { rest.onKeyDown?.(e); if (e.key === "Escape" && tip) hide(); }}
      onClick={(e) => { const peeked = peek.current && tip; peek.current = false; hide(); if (!peeked) onClick?.(e); }}
      whileTap={reduce || isDisabled ? undefined : { scale: 0.88 }}
      transition={{ type: "spring", stiffness: 600, damping: 30 }}
      style={{ width: px, height: px, ...style }}
    >
      {typeof icon === "string" ? <Icon name={icon} size={Math.round(px * 0.47)} /> : icon}
      <AnimatePresence>
        {showTip && (
          <motion.span
            className="ts-tip"
            aria-hidden
            initial={reduce ? { opacity: 0, x: "-50%" } : { opacity: 0, y: 4, scale: 0.96, x: "-50%" }}
            animate={{ opacity: 1, y: 0, scale: 1, x: "-50%" }}
            exit={{ opacity: 0, transition: { duration: 0.08 } }}
            transition={{ type: "spring", stiffness: 700, damping: 40 }}
          >
            {label}
            {shortcut && <kbd>{shortcut}</kbd>}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button></>
  );
});
