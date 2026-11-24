"use client";
import { forwardRef, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { registerStyles, useStyles, useReducedMotion } from "../_shared/theme.jsx";
import { Icon } from "../_shared/icons.jsx";
import { RollingNumber } from "../_shared/rolling-number.jsx";

const CSS = `
.ts-badge-demo{display:flex;flex-direction:column;align-items:center;gap:26px;font-family:var(--ts-font)}
.ts-badge-row{display:flex;align-items:center;gap:22px}
.ts-badge-host{all:unset;box-sizing:border-box;position:relative;display:grid;place-items:center;width:var(--bd-host);height:var(--bd-host);border-radius:var(--ts-radius-md);cursor:pointer;
  color:var(--ts-ink);background:var(--ts-surface);box-shadow:inset 0 0 0 1px var(--ts-line);transition:background-color .15s}
.ts-badge-host:hover{background:var(--ts-surface2)}
.ts-badge-host:focus-visible{outline:2px solid var(--ts-focus);outline-offset:2px}
.ts-badge-host.is-round{border-radius:99px}
.ts-badge{box-sizing:border-box;position:absolute;top:0;right:0;translate:38% -38%;display:inline-flex;align-items:center;justify-content:center;min-width:var(--bd-h);height:var(--bd-h);padding:0 calc(var(--bd-h) * .3);
  border-radius:99px;font-size:calc(var(--bd-h) * .6);font-weight:700;line-height:1;background:var(--tone);color:var(--tone-ink);
  box-shadow:0 0 0 2.5px var(--ts-bg);pointer-events:none;white-space:nowrap}
.ts-badge.is-dot{min-width:0;width:calc(var(--bd-h) * .55);height:calc(var(--bd-h) * .55);padding:0;translate:15% -15%}
.ts-badge__ring{position:absolute;inset:0;border-radius:inherit;box-shadow:0 0 0 2px var(--tone)}
.ts-badge__plus{font-size:.85em;margin-left:1px}
.ts-badge-ctl{display:flex;gap:6px;flex-wrap:wrap;justify-content:center}
.ts-badge-ctl button{all:unset;box-sizing:border-box;height:30px;padding:0 11px;border-radius:99px;font-size:12px;font-weight:550;font-family:var(--ts-font-mono);cursor:pointer;color:var(--ts-ink);background:var(--ts-surface2);box-shadow:inset 0 0 0 1px var(--ts-line)}
.ts-badge-ctl button:hover{background:color-mix(in srgb,var(--ts-surface2) 80%,var(--ts-ink))}
.ts-badge-ctl button:focus-visible{outline:2px solid var(--ts-focus);outline-offset:2px}
.ts-badge-wrap{position:relative;display:inline-flex;vertical-align:middle;flex:none}
.ts-badge-wrap:not(.has-host){display:inline-grid;place-items:center}
.ts-badge-wrap.is-on:not(.has-host){min-width:var(--bd-h,20px);height:var(--bd-h,20px)}
.ts-badge-wrap:not(.has-host) .ts-badge{position:relative;top:auto;right:auto;translate:none}
.ts-badge[data-at=top-left]{right:auto;left:0;translate:-38% -38%}
.ts-badge[data-at=bottom-right]{top:auto;bottom:0;translate:38% 38%}
.ts-badge[data-at=bottom-left]{top:auto;right:auto;bottom:0;left:0;translate:-38% 38%}
.ts-badge[data-overlap=circle]{translate:5% -5%}
.ts-badge[data-overlap=circle][data-at=top-left]{translate:-5% -5%}
.ts-badge[data-overlap=circle][data-at=bottom-right]{translate:5% 5%}
.ts-badge[data-overlap=circle][data-at=bottom-left]{translate:-5% 5%}
.ts-badge.is-dot[data-overlap=rect]{translate:15% -15%}
.ts-badge.is-dot[data-overlap=rect][data-at=top-left]{translate:-15% -15%}
.ts-badge.is-dot[data-overlap=rect][data-at=bottom-right]{translate:15% 15%}
.ts-badge.is-dot[data-overlap=rect][data-at=bottom-left]{translate:-15% 15%}
.ts-badge.is-dot[data-overlap=circle]{translate:-10% 10%}
.ts-avatar{display:grid;place-items:center;width:100%;height:100%;border-radius:inherit;font-size:calc(var(--bd-host) * .34);font-weight:650;background:color-mix(in srgb,var(--ts-accent) 22%,var(--ts-surface2))}
@media (max-width:640px),(pointer:coarse){
  .ts-badge-ctl{gap:8px;max-width:340px}
  .ts-badge-ctl button{height:44px;min-width:44px;padding:0 14px;font-size:13px;text-align:center}
}
`;
registerStyles("ts-badge-counter", CSS);

// badge height in px: sm sits on a 28-32px avatar or tab, md on a 40-48px icon button, lg on a large tile or app icon
const SIZES = { sm: 16, md: 20, lg: 24 };
const sizePx = (size) => (typeof size === "number" ? size : SIZES[size] ?? SIZES.md);

const TONES = { danger: ["var(--ts-danger)", "var(--ts-bg)"], accent: ["var(--ts-accent)", "var(--ts-accent-ink)"], ink: ["var(--ts-ink)", "var(--ts-bg)"], success: ["var(--ts-success)", "var(--ts-bg)"] };

/** Badge — the count bubble on its own, for placing on any relatively positioned element. */
export function Badge({ count = 0, max = 99, kind = "count", tone = "danger", size = "md", pulse = true, showZero = false, placement = "top-right", overlap = "rect" }) {
  const sheetTag = useStyles("ts-badge-counter", CSS);
  const px = sizePx(size);
  const reduce = useReducedMotion();
  const prev = useRef(count);
  const [ping, setPing] = useState(0);
  useEffect(() => {
    if (count > prev.current) setPing((p) => p + 1); // only increases ask for attention
    prev.current = count;
  }, [count]);
  const over = count > max;
  const visible = count > 0 || showZero;
  const [bg, ink] = TONES[tone] ?? TONES.danger;
  return (
    <>{sheetTag}<AnimatePresence>
      {visible && (
        <motion.span
          key="b"
          className={"ts-badge" + (kind === "dot" ? " is-dot" : "")}
          data-at={placement}
          data-overlap={overlap}
          style={{ "--tone": bg, "--tone-ink": ink, "--bd-h": px + "px" }}
          initial={reduce ? { opacity: 0 } : { scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={reduce ? { opacity: 0 } : { scale: 0, opacity: 0, transition: { duration: 0.15 } }}
          transition={{ type: "spring", stiffness: 600, damping: 22 }}
          layout={!reduce}
          aria-hidden
        >
          {kind !== "dot" && (
            <AnimatePresence mode="popLayout" initial={false}>
              {over ? (
                <motion.span key="over" initial={reduce ? { opacity: 0 } : { y: "-110%", opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: "110%", opacity: 0 }}
                  transition={{ type: "spring", stiffness: 420, damping: 26 }} style={{ display: "inline-flex", alignItems: "baseline" }}>
                  {max}<span className="ts-badge__plus">+</span>
                </motion.span>
              ) : (
                <motion.span key="n" initial={reduce ? { opacity: 0 } : { y: "-110%", opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: "110%", opacity: 0 }}
                  transition={{ type: "spring", stiffness: 420, damping: 26 }} style={{ display: "inline-flex" }}>
                  <RollingNumber value={Math.max(0, count)} stiffness={420} damping={30} />
                </motion.span>
              )}
            </AnimatePresence>
          )}
          {pulse && !reduce && ping > 0 && (
            <motion.span key={ping} className="ts-badge__ring" initial={{ scale: 1, opacity: 0.8 }} animate={{ scale: 1.9, opacity: 0 }} transition={{ duration: 0.7, ease: "easeOut" }} />
          )}
        </motion.span>
      )}
    </AnimatePresence></>
  );
}

const countWords = (n, max) => (n > max ? `more than ${max}` : String(n));

/**
 * BadgeCounter — a count (or a dot) on the caller's own element: wrap an icon button, an avatar, a tab.
 * Signature: digits roll like an odometer as the count changes, and past the cap (99) the number
 * rolls over into "99+" instead of growing; only increases send out a ring, decreases stay quiet.
 * Changes are announced politely ("Notifications: 3"). `demo` shows the gallery's three sample hosts.
 */
export const BadgeCounter = forwardRef(function BadgeCounter({
  count = 0,
  max = 99,
  kind = "count",
  tone = "danger",
  size = "md",
  hostSize = 48,
  pulse = true,
  showZero = false,
  placement = "top-right",
  overlap = "rect",
  label = "",
  announce = true,
  children,
  simulate = false,
  showControls = true,
  demo = false,
  forceState,
  className,
  style,
  ...rest
}, ref) {
  const sheetTag = useStyles("ts-badge-counter", CSS);
  const [own, setOwn] = useState(count);
  useEffect(() => { setOwn(count); }, [count]);
  useEffect(() => {
    if (!simulate) return;
    const t = setInterval(() => setOwn((c) => (c > max + 4 ? 0 : c + 1 + Math.floor(Math.random() * 3))), 900);
    return () => clearInterval(t);
  }, [simulate, max]);
  // the shown count follows the caller's `count`; only simulate (and the demo's buttons) move it on their own
  const n = Math.max(0, Math.floor(forceState === "empty" ? 0 : simulate || demo ? own : Number(count) || 0));

  // polite announcement of changes only (never on mount): "Notifications: 3"
  const [said, setSaid] = useState("");
  const first = useRef(true);
  const visible = n > 0 || showZero;
  const words = kind === "dot" ? (n > 0 ? "new" : "nothing new") : countWords(n, max);
  // the demo's bubble sits on its Notifications button, so its changes are announced under that name
  const named = label || (demo ? "Notifications" : "");
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    if (!announce) return;
    const t = setTimeout(() => setSaid((named ? named + ": " : "") + words), 250);
    return () => clearTimeout(t);
  }, [words]);

  const liveRegion = announce ? <span className="ts-sr" role="status" aria-live="polite" aria-atomic="true">{said}</span> : null;
  if (demo) return <>{sheetTag}<BadgeDemo ref={ref} live={liveRegion} count={forceState === "empty" ? 0 : own} setCount={setOwn} max={max} kind={kind} tone={tone} size={size} hostSize={hostSize} pulse={pulse} showZero={showZero} placement={placement} overlap={overlap} showControls={showControls} className={className} style={style} rest={rest} /></>;

  const hasHost = children != null && children !== false;
  return (
    <>{sheetTag}<span ref={ref} className={"ts-badge-wrap" + (hasHost ? " has-host" : "") + (visible ? " is-on" : "") + (className ? " " + className : "")} style={{ "--bd-h": sizePx(size) + "px", ...style }} {...rest}>
      {children}
      <Badge count={n} max={max} kind={kind} tone={tone} size={size} pulse={pulse} showZero={showZero} placement={placement} overlap={overlap} />
      {liveRegion}
      {!hasHost && visible && <span className="ts-sr">{(label ? label + ": " : "") + words}</span>}
    </span></>
  );
});

const BadgeDemo = forwardRef(function BadgeDemo({ live, count, setCount, max, kind, tone, size, hostSize, pulse, showZero, placement, overlap, showControls, className, style, rest }, ref) {
  const label = (n) => (n > max ? `more than ${max}` : String(n));
  const host = (icon, name, round, n, child) => (
    <button type="button" className={"ts-badge-host" + (round ? " is-round" : "")} aria-label={n > 0 ? `${name}, ${label(n)} unread` : name} onClick={() => setCount(0)}>
      {child ?? <Icon name={icon} size={Math.round(hostSize * 0.44)} />}
      <Badge count={n} max={max} kind={kind} tone={tone} size={size} pulse={pulse} showZero={showZero} placement={placement} overlap={overlap} />
    </button>
  );
  return (
    <div ref={ref} className={"ts-badge-demo" + (className ? " " + className : "")} style={{ "--bd-host": hostSize + "px", ...style }} {...rest}>
      <div className="ts-badge-row">
        {host("bell", "Notifications", false, count)}
        {host("message", "Messages", false, Math.max(0, Math.round(count / 3)))}
        {host(null, "Maya Chen", true, count > 0 ? 1 : 0, <span className="ts-avatar">MC</span>)}
      </div>
      {showControls && (
        <div className="ts-badge-ctl">
          <button type="button" onClick={() => setCount((c) => Math.max(0, c - 1))}>−1</button>
          <button type="button" onClick={() => setCount((c) => c + 1)}>+1</button>
          <button type="button" onClick={() => setCount((c) => c + 25)}>+25</button>
          <button type="button" onClick={() => setCount(max - 1)}>{max - 1}</button>
          <button type="button" onClick={() => setCount(0)}>Clear</button>
        </div>
      )}
      {live}
    </div>
  );
});
