"use client";
import { forwardRef, useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, useMotionValue, animate } from "motion/react";
import { registerStyles, useStyles, useIsoLayoutEffect, useReducedMotion } from "../_shared/theme.jsx";
import { Icon } from "../_shared/icons.jsx";

const CSS = `
.ts-alert-wrap{width:100%;max-width:var(--alert-max,560px);font-family:var(--ts-font)}
.ts-alert-wrap[hidden]{display:none !important}
.ts-alert{position:relative;display:flex;align-items:flex-start;gap:12px;padding:14px 14px 14px 16px;border-radius:var(--ts-radius-lg);color:var(--ts-ink);overflow:hidden}
.ts-alert--soft{background:color-mix(in srgb,var(--tone) 10%,var(--ts-surface));box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--tone) 26%,transparent)}
.ts-alert--outline{background:var(--ts-surface);box-shadow:inset 0 0 0 1px var(--ts-line)}
.ts-alert--outline::before{content:"";position:absolute;left:0;top:0;bottom:0;width:3px;background:var(--tone)}
.ts-alert--solid{background:var(--tone);color:var(--tone-ink)}
.ts-alert__icon{display:grid;place-items:center;width:28px;height:28px;flex:none;border-radius:var(--ts-radius-sm);color:var(--tone);background:color-mix(in srgb,var(--tone) 16%,transparent)}
.ts-alert--solid .ts-alert__icon{color:inherit;background:color-mix(in srgb,var(--tone-ink) 14%,transparent)}
.ts-alert__body{display:flex;flex-direction:column;gap:3px;min-width:0;flex:1;padding-top:4px}
.ts-alert__title{font-size:14px;font-weight:620;line-height:1.3}
.ts-alert__desc{font-size:13px;line-height:1.5;color:var(--ts-ink2)}
.ts-alert--solid .ts-alert__desc{color:inherit;opacity:.82}
.ts-alert__actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:8px}
.ts-alert__btn{all:unset;box-sizing:border-box;display:inline-flex;align-items:center;gap:6px;height:34px;padding:0 14px;border-radius:var(--ts-radius-sm);font-size:12.5px;font-weight:600;cursor:pointer;
  background:var(--tone);color:var(--tone-ink)}
.ts-alert__btn--ghost{background:none;color:var(--ts-ink);box-shadow:inset 0 0 0 1px var(--ts-line)}
.ts-alert--solid .ts-alert__btn{background:var(--tone-ink);color:var(--tone)}
.ts-alert--solid .ts-alert__btn--ghost{background:none;color:inherit;box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--tone-ink) 35%,transparent)}
.ts-alert__btn:hover:not(:disabled){filter:brightness(1.08)}
.ts-alert__btn:disabled,.ts-alert__x:disabled{cursor:not-allowed;opacity:.5}
.ts-alert__btn[aria-busy="true"]{cursor:progress;opacity:.75}
.ts-alert__spin{width:12px;height:12px;border-radius:99px;border:2px solid currentColor;border-right-color:transparent;animation:ts-alert-spin .7s linear infinite}
@keyframes ts-alert-spin{to{transform:rotate(360deg)}}
@media (prefers-reduced-motion:reduce){.ts-alert__spin{animation:none;border-right-color:currentColor;opacity:.6}}
.ts-alert__btn:focus-visible,.ts-alert__x:focus-visible,.ts-alert-again:focus-visible{outline:2px solid var(--ts-focus);outline-offset:2px}
.ts-alert__x{all:unset;display:grid;place-items:center;flex:none;width:28px;height:28px;border-radius:var(--ts-radius-sm);color:var(--ts-ink2);cursor:pointer}
.ts-alert--solid .ts-alert__x{color:inherit;opacity:.75}
.ts-alert__x:hover:not(:disabled){color:var(--ts-ink);background:color-mix(in srgb,var(--ts-ink) 8%,transparent);opacity:1}
.ts-alert__timer{position:absolute;left:0;bottom:0;height:2px;width:100%;background:var(--tone);transform-origin:left center;opacity:.6}
.ts-alert-again{all:unset;font-size:12.5px;color:var(--ts-ink2);text-decoration:underline;text-underline-offset:3px;cursor:pointer;border-radius:4px}
@media (max-width:640px),(pointer:coarse){
  .ts-alert{gap:10px;padding:14px 8px 14px 14px}
  .ts-alert__actions{margin-top:10px}
  .ts-alert__btn{height:44px;padding:0 16px;font-size:13.5px}
  .ts-alert__x{width:44px;height:44px;margin:-8px 0 -8px -6px}
  .ts-alert-again{display:inline-flex;align-items:center;min-height:44px;font-size:13.5px}
}
`;
registerStyles("ts-alert-banner", CSS);

const TONES = {
  info: { icon: "bell", v: "var(--ts-accent)", ink: "var(--ts-accent-ink)" },
  success: { icon: "check", v: "var(--ts-success)", ink: "var(--ts-bg)" },
  warning: { icon: "alert", v: "var(--ts-warning)", ink: "var(--ts-bg)" },
  danger: { icon: "alert", v: "var(--ts-danger)", ink: "var(--ts-bg)" },
};
const COPY = {
  info: ["A new version is ready", "Reload to get offline editing and faster exports."],
  success: ["Domain connected", "studio.com now points at your site. SSL is live."],
  warning: ["You've used 92% of your storage", "Uploads pause at 100%. Free up space or upgrade."],
  danger: ["Your last payment failed", "We'll retry in 3 days. Update your card to avoid losing access."],
};

const SPRING_IN = { type: "spring", stiffness: 400, damping: 36 };
const SPRING_OUT = { type: "spring", stiffness: 400, damping: 40 };
const len = (v) => (typeof v === "number" ? v + "px" : v || 0);
// the row gap a flex-column parent puts next to this element (0 for any other layout, or when it is the only child)
function parentRowGap(el) {
  const p = el?.parentElement;
  if (!p) return 0;
  const cs = getComputedStyle(p);
  if (!/flex/.test(cs.display) || !cs.flexDirection.startsWith("column")) return 0;
  const others = [...p.children].some((c) => c !== el && !c.hidden && getComputedStyle(c).display !== "none" && !/absolute|fixed/.test(getComputedStyle(c).position));
  return others ? parseFloat(cs.rowGap) || 0 : 0;
}

/**
 * AlertBanner — inline message with a tone, an optional action pair and dismiss.
 * Signature: dismissing folds the banner's height away so the content below closes the gap
 * smoothly instead of jumping; an optional countdown line auto-dismisses non-urgent messages.
 * Warning and danger render as role="alert"; info and success as role="status".
 * Shows only what you pass: no title, description or labels means no banner. `demo` fills blanks with sample copy.
 * Open state works uncontrolled (defaultOpen) or controlled (open + onOpenChange). The ref goes to the root.
 * Spacing: `gapBefore` / `gapAfter` are space the banner owns above and below itself; they open and fold with its
 * height on the same spring. Once closed (exit finished) the root is `hidden` (display:none), so it leaves no box in
 * the parent's flow and a parent's flex/grid `gap` is not doubled. In a flex column with a row gap, the banner
 * also folds that one gap with itself (a negative bottom margin on the same spring) unless foldParentGap is false.
 */
export const AlertBanner = forwardRef(function AlertBanner({
  tone = "warning",
  surface = "soft",
  title = "",
  description = "",
  actionLabel = "",
  secondaryLabel = "",
  dismissible = true,
  autoDismiss = 0,
  showIcon = true,
  icon,
  fullWidth = false,
  maxWidth = 560,
  loading = false,
  disabled = false,
  appear = true,
  showRestore = false,
  restoreLabel = "Show the banner again",
  dismissLabel = "Dismiss",
  gapBefore = 0,
  gapAfter = 0,
  foldParentGap = true,
  open: openProp,
  defaultOpen = true,
  onOpenChange,
  onAction,
  onSecondary,
  onDismiss,
  role: roleProp,
  demo = false,
  children,
  className,
  style,
  forceState,
  ...rest
}, ref) {
  const sheetTag = useStyles("ts-alert-banner", CSS);
  const reduce = useReducedMotion();
  const [openState, setOpenState] = useState(defaultOpen);
  const controlled = openProp !== undefined;
  const open = controlled ? !!openProp : openState;
  const setOpen = (v) => { if (!controlled) setOpenState(v); onOpenChange?.(v); };
  const t = TONES[tone] ?? TONES.info;
  const [defTitle, defDesc] = demo ? (COPY[tone] ?? COPY.info) : ["", ""];
  const urgent = tone === "danger" || tone === "warning";
  const timed = autoDismiss > 0 && !urgent;
  const shownTitle = title || defTitle;
  const shownDesc = description || defDesc;
  const hasContent = !!(shownTitle || shownDesc || children || actionLabel || secondaryLabel);
  const isOpen = open && hasContent && forceState !== "empty";

  // in flow while open, while the exit runs, or while the restore link shows; otherwise hidden (no box at all)
  const showsRestore = !isOpen && hasContent && showRestore;
  const [lingering, setLingering] = useState(false);
  const [prevOpen, setPrevOpen] = useState(isOpen);
  if (prevOpen !== isOpen) { setPrevOpen(isOpen); setLingering(!isOpen); }
  const hidden = !isOpen && !lingering && !showsRestore;

  // fold a flex-column parent's row gap together with the height
  const root = useRef(null);
  const setRef = useCallback((el) => { root.current = el; if (typeof ref === "function") ref(el); else if (ref) ref.current = el; }, [ref]);
  const mb = useMotionValue(0);
  const first = useRef(true);
  useIsoLayoutEffect(() => {
    const mount = first.current;
    first.current = false;
    if (mount && (!appear || !isOpen)) return;
    const g = foldParentGap ? parentRowGap(root.current) : 0;
    if (isOpen) {
      mb.set(-g);
      if (reduce || !g) mb.set(0); else animate(mb, 0, SPRING_IN);
    } else if (!showsRestore && g) {
      if (!reduce) animate(mb, -g, SPRING_OUT);   // reduced motion: the box goes at once when the fade ends
    } else mb.set(0);
  }, [isOpen]);

  // focus never falls to <body> when the banner holding it goes: it moves to the restore link (when shown), and
  // from the restore link back to the banner's × when it returns
  const refocus = useRef(null);
  useEffect(() => {
    const want = refocus.current;
    refocus.current = null;
    if (!want || !root.current) return;
    const q = (s) => root.current.querySelector(s);
    (want === "restore" ? q(".ts-alert-again") : q(".ts-alert__x") ?? q(".ts-alert__btn"))?.focus({ preventScroll: true });
  }, [isOpen]);
  const close = () => { if (disabled) return; refocus.current = root.current?.contains(document.activeElement) ? "restore" : null; setOpen(false); onDismiss?.(); };
  const primary = (e) => { if (disabled || loading) return; onAction?.("primary", e); };
  const secondary = (e) => { if (disabled) return; onSecondary?.(e); onAction?.("secondary", e); };
  const wrapStyle = { ...(fullWidth ? { maxWidth: "none" } : { "--alert-max": typeof maxWidth === "number" ? maxWidth + "px" : maxWidth }), ...style };

  return (
    <>{sheetTag}<motion.div ref={setRef} className={"ts-alert-wrap" + (className ? " " + className : "")} style={{ ...wrapStyle, ...(style?.marginBottom === undefined ? { marginBottom: mb } : null) }} hidden={hidden} {...rest}>
      <AnimatePresence initial={appear} onExitComplete={() => { setLingering(false); mb.set(0); }}>
        {isOpen && (
          <motion.div
            key="a"
            initial={reduce ? { opacity: 0 } : { opacity: 0, height: 0, y: -6 }}
            animate={{ opacity: 1, height: "auto", y: 0 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, height: 0, y: -6, transition: { height: { type: "spring", stiffness: 400, damping: 40 }, opacity: { duration: 0.12 } } }}
            transition={reduce ? { duration: 0.15 } : { type: "spring", stiffness: 400, damping: 36 }}
            style={{ overflow: "hidden" }}
          >
            <div style={gapBefore || gapAfter ? { paddingTop: len(gapBefore), paddingBottom: len(gapAfter) } : undefined}>
            <div className={`ts-alert ts-alert--${surface}`} role={roleProp ?? (urgent ? "alert" : "status")} style={{ "--tone": t.v, "--tone-ink": t.ink }}>
              {showIcon && <span className="ts-alert__icon" aria-hidden>{icon ?? <Icon name={t.icon} size={16} stroke={2.2} />}</span>}
              <div className="ts-alert__body">
                {shownTitle && <div className="ts-alert__title">{shownTitle}</div>}
                {shownDesc && <div className="ts-alert__desc">{shownDesc}</div>}
                {children}
                {(actionLabel || secondaryLabel) && (
                  <div className="ts-alert__actions">
                    {actionLabel && (
                      <button type="button" className="ts-alert__btn" onClick={primary} disabled={disabled} aria-busy={loading || undefined} aria-disabled={loading || undefined}>
                        {loading && <span className="ts-alert__spin" aria-hidden />}{actionLabel}
                      </button>
                    )}
                    {secondaryLabel && <button type="button" className="ts-alert__btn ts-alert__btn--ghost" onClick={secondary} disabled={disabled}>{secondaryLabel}</button>}
                  </div>
                )}
              </div>
              {dismissible && (
                <button type="button" className="ts-alert__x" aria-label={dismissLabel} onClick={close} disabled={disabled}><Icon name="x" size={15} stroke={2} /></button>
              )}
              {timed && (
                <motion.span className="ts-alert__timer" aria-hidden initial={{ scaleX: 1 }} animate={{ scaleX: 0 }}
                  transition={{ duration: autoDismiss, ease: "linear" }} onAnimationComplete={close} />
              )}
            </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {!isOpen && hasContent && showRestore && (
        <button type="button" className="ts-alert-again" onClick={() => { refocus.current = "banner"; setOpen(true); }}>{restoreLabel}</button>
      )}
    </motion.div></>
  );
});
