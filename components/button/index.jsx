"use client";
import { forwardRef, useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, frame } from "motion/react";
import { registerStyles, useStyles, useIsoLayoutEffect, useReducedMotion } from "../_shared/theme.jsx";

export const SIZES = { sm: { h: 34, pad: 14, font: 13 }, md: { h: 42, pad: 18, font: 14 }, lg: { h: 52, pad: 24, font: 16 } };

export const BUTTON_CSS = `
.ts-btn{all:unset;box-sizing:border-box;position:relative;display:inline-flex;align-items:center;justify-content:center;gap:8px;
  font-family:var(--ts-font);font-weight:550;letter-spacing:-0.01em;white-space:nowrap;cursor:pointer;user-select:none;overflow:hidden;
  border-radius:var(--ts-radius-button,var(--ts-radius-md));-webkit-tap-highlight-color:transparent;
  transition:background-color .2s,color .2s,box-shadow .2s,opacity .2s,border-radius .4s cubic-bezier(.2,.8,.2,1)}
.ts-btn--primary{background:var(--ts-accent);color:var(--ts-accent-ink);
  box-shadow:inset 0 1px 0 color-mix(in srgb,var(--ts-accent-ink) 14%,transparent),0 1px 2px color-mix(in srgb,var(--ts-bg) 40%,transparent),0 8px 22px -10px var(--ts-accent)}
.ts-btn--primary:hover,.ts-btn--primary[data-force=hover]{background:color-mix(in srgb,var(--ts-accent) 90%,var(--ts-ink))}
.ts-btn--primary::after{content:"";position:absolute;inset:0;pointer-events:none;
  background:linear-gradient(105deg,transparent 35%,color-mix(in srgb,var(--ts-accent-ink) 18%,transparent) 50%,transparent 65%);
  transform:translateX(-110%);transition:transform .7s cubic-bezier(.2,.8,.2,1)}
.ts-btn--primary:hover::after,.ts-btn--primary[data-force=hover]::after{transform:translateX(110%)}
.ts-btn--secondary{background:var(--ts-surface2);color:var(--ts-ink);box-shadow:inset 0 0 0 1px var(--ts-line)}
.ts-btn--secondary:hover,.ts-btn--secondary[data-force=hover]{background:color-mix(in srgb,var(--ts-surface2) 86%,var(--ts-ink))}
.ts-btn--ghost{background:transparent;color:var(--ts-ink)}
.ts-btn--ghost:hover,.ts-btn--ghost[data-force=hover]{background:color-mix(in srgb,var(--ts-ink) 8%,transparent)}
.ts-btn--danger{background:var(--ts-danger);color:var(--ts-bg)}
.ts-btn--danger:hover,.ts-btn--danger[data-force=hover]{background:color-mix(in srgb,var(--ts-danger) 88%,var(--ts-ink))}
.ts-btn--danger-quiet{background:transparent;color:var(--ts-danger);box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--ts-danger) 38%,transparent)}
.ts-btn--danger-quiet:hover,.ts-btn--danger-quiet[data-force=hover]{background:color-mix(in srgb,var(--ts-danger) 10%,transparent)}
.ts-btn--danger-quiet.is-busy{background:color-mix(in srgb,var(--ts-danger) 10%,transparent)}
.ts-btn:focus-visible,.ts-btn[data-force=focus]{outline:2px solid var(--ts-focus);outline-offset:3px}
.ts-btn[data-force=active]{transform:scale(.96)}
.ts-btn:disabled,.ts-btn[aria-disabled=true]{opacity:.42;cursor:not-allowed;box-shadow:none}
.ts-btn.is-pill{border-radius:999px}
.ts-btn.is-busy{border-radius:999px;cursor:default}
.ts-btn.is-success{background:var(--ts-success);color:var(--ts-bg)}
.ts-btn__spin{width:18px;height:18px;border-radius:50%;border:2px solid currentColor;border-right-color:transparent;animation:ts-spin .7s linear infinite}
@keyframes ts-spin{to{transform:rotate(360deg)}}
/* reduced motion: the ring holds still and breathes in opacity instead of turning, so the busy state stays plain to see */
@keyframes ts-btn-fade{0%,100%{opacity:.35}50%{opacity:1}}
.ts-btn__spin.is-calm{animation:ts-btn-fade 1.6s ease-in-out infinite}
@media (prefers-reduced-motion:reduce){.ts-btn__spin{animation:ts-btn-fade 1.6s ease-in-out infinite}.ts-btn::after{display:none}}
.ts-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}
@media (max-width:640px),(pointer:coarse){.ts-btn{min-height:44px}.ts-btn.is-busy{min-width:44px}}
`;
registerStyles("ts-button", BUTTON_CSS);

/** Inject the shared .ts-btn styles (other button components reuse them). */
export const useButtonStyles = () => useStyles("ts-button", BUTTON_CSS);

/**
 * Button — primary / secondary / ghost / danger / danger-quiet.
 * Signature: press compresses on a spring; while loading the button morphs into a
 * circle with a spinner, then a check draws itself before the label returns.
 * Pass `loading`/`success` from your own async work. While loading or showing success it will not fire
 * `onClick` again (and a `type="submit"` button will not submit again). The morph keeps the button's place in
 * the layout, so neighbours do not move and a full-width button's circle sits in the middle.
 * The ref goes to the <button>, so a Button can be a Modal or popover trigger.
 * `simulate` (or `demo`) plays a fake "working, done" cycle on click: it is for demos only (the gallery turns
 * it on) and is off by default, so a button never claims success on its own.
 * `shape` is "rounded" (the default: the theme's button corner, which is its corner size unless the Theme above has
 * `buttonShape="pill"`) or "pill" (this button fully rounded whatever the Theme says). For one shape across a
 * surface set `buttonShape` on <Theme>; it also reaches the buttons other components draw.
 */
export const Button = forwardRef(function Button({
  label = "Continue",
  children,
  variant = "primary",
  size = "md",
  shape = "rounded",
  fullWidth = false,
  loading = false,
  success = false,
  disabled = false,
  demo = false,
  simulate = false,
  pressScale = 0.96,
  icon,
  type = "button",
  onClick,
  forceState,
  className,
  style,
  ...rest
}, ref) {
  const sheetTag = useButtonStyles();
  const reduce = useReducedMotion();
  const [phase, setPhase] = useState("idle");
  const timers = useRef([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const isLoading = loading || phase === "loading" || forceState === "loading";
  const isSuccess = !isLoading && (success || phase === "success" || forceState === "success");
  const isDisabled = disabled || forceState === "disabled";
  const busy = isLoading || isSuccess;
  const s = SIZES[size] ?? SIZES.md;
  const content = children ?? label;
  const text = typeof content === "string" || typeof content === "number" ? String(content) : typeof label === "string" ? label : "";
  const { "aria-label": ariaLabel, ...attrs } = rest;

  // own ref + the caller's
  const own = useRef(null);
  const setRef = useCallback((el) => {
    own.current = el;
    if (typeof ref === "function") ref(el);
    else if (ref) ref.current = el;
  }, [ref]);

  // Keep the button's place while it morphs: remember its idle size, and pad the shrinking circle with side
  // margins so the layout box stays as wide as it was (neighbours do not jump, a full-width circle is centred).
  const idle = useRef({ w: 0, h: 0 });
  const busyRef = useRef(busy);
  const morphing = useRef(false);
  const morphTimer = useRef(null);
  busyRef.current = busy;
  const prevBusy = useRef(busy);
  useIsoLayoutEffect(() => {
    const el = own.current;
    if (busy !== prevBusy.current) {
      prevBusy.current = busy;
      morphing.current = true;
      clearTimeout(morphTimer.current);
      morphTimer.current = setTimeout(() => settle(), 1200); // fallback if no animation runs
    } else if (!busy && !morphing.current && el) idle.current = { w: el.offsetWidth, h: el.offsetHeight };
    if (busy || morphing.current) pad(); // before paint: the padding change and a mount in the busy state
  });
  useEffect(() => {
    const el = own.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => { if (!busyRef.current && !morphing.current) idle.current = { w: el.offsetWidth, h: el.offsetHeight }; });
    ro.observe(el);
    return () => { ro.disconnect(); clearTimeout(morphTimer.current); };
  }, []);
  // the width the layout box should keep: a full-width button keeps its container's width, others their idle width
  const keepWidth = (el) => {
    if (fullWidth && el.parentElement) {
      const p = el.parentElement, cs = getComputedStyle(p);
      return p.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    }
    return idle.current.w;
  };
  const pad = () => {
    const el = own.current;
    if (!el || (!busyRef.current && !morphing.current)) return;
    const W = keepWidth(el);
    if (!W) return;
    const m = Math.max(0, (W - el.offsetWidth) / 2);
    el.style.marginLeft = el.style.marginRight = m >= 0.5 ? m + "px" : "";
  };
  // run after motion has written this frame's width, so the margins match it exactly (no one-frame lag)
  const padAfterRender = () => frame.postRender(pad);
  function settle() {
    clearTimeout(morphTimer.current);
    morphing.current = false;
    const el = own.current;
    if (!el) return;
    if (busyRef.current) pad();
    else { el.style.marginLeft = el.style.marginRight = ""; idle.current = { w: el.offsetWidth, h: el.offsetHeight }; }
  }
  const circle = idle.current.h || s.h;

  // one activation per tick: a second click before the caller's `loading` arrives is dropped
  const lock = useRef(false);
  const handle = (e) => {
    if (busy || isDisabled || lock.current) { e.preventDefault(); return; }
    lock.current = true;
    requestAnimationFrame(() => { lock.current = false; });
    onClick?.(e);
    if (simulate || demo) {
      setPhase("loading");
      timers.current.push(setTimeout(() => setPhase("success"), 1300), setTimeout(() => setPhase("idle"), 2900));
    }
  };

  const swap = reduce
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : { initial: { opacity: 0, scale: 0.6, filter: "blur(4px)" }, animate: { opacity: 1, scale: 1, filter: "blur(0px)" }, exit: { opacity: 0, scale: 0.6, filter: "blur(4px)" } };

  return (
    <>{sheetTag}
      <motion.button
        ref={setRef}
        type={type}
        className={`ts-btn ts-btn--${variant}${shape === "pill" ? " is-pill" : ""}${busy ? " is-busy" : ""}${isSuccess ? " is-success" : ""}${className ? " " + className : ""}`}
        data-force={forceState && forceState !== "default" ? forceState : undefined}
        disabled={isDisabled}
        aria-disabled={isDisabled || undefined}
        aria-busy={isLoading || undefined}
        onClick={handle}
        whileTap={busy || isDisabled || reduce ? undefined : { scale: pressScale }}
        animate={{ width: busy ? circle : fullWidth ? "100%" : "auto" }}
        transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 420, damping: 34, mass: 0.8 }}
        onUpdate={padAfterRender}
        onAnimationComplete={(d) => { if (d && typeof d === "object" && "width" in d) settle(); }}
        style={{ height: s.h, padding: busy ? 0 : `0 ${s.pad}px`, fontSize: s.font, ...style }}
        {...attrs}
        aria-label={ariaLabel ?? (busy && text ? text : undefined)}
      >
        <AnimatePresence mode="popLayout" initial={false}>
          {isSuccess ? (
            <motion.svg key="ok" {...swap} width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
              <motion.path d="M5 12.5l4.5 4.5L19 7.5" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"
                initial={{ pathLength: reduce ? 1 : 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.35, delay: 0.08, ease: [0.2, 0.8, 0.2, 1] }} />
            </motion.svg>
          ) : isLoading ? (
            <motion.span key="spin" {...swap} className={"ts-btn__spin" + (reduce ? " is-calm" : "")} aria-hidden />
          ) : (
            <motion.span key="label" {...swap} style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
              {icon}
              {children !== undefined && children !== null ? <span>{children}</span> : label}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>
      <span className="ts-sr" aria-live="polite">{isLoading ? `${text || "Button"}: working` : isSuccess ? `${text || "Button"}: done` : ""}</span>
    </>
  );
});
