"use client";
import { cloneElement, forwardRef, isValidElement, useCallback, useEffect, useId, useRef, useState } from "react";
import { motion, AnimatePresence, useAnimationControls } from "motion/react";
import { registerStyles, useStyles, useIsoLayoutEffect, useReducedMotion, refOf } from "../_shared/theme.jsx";
import { Icon } from "../_shared/icons.jsx";
import { useFocusTrap, useDismiss, useScrollLock, focusables } from "../_shared/overlay.jsx";
import { TextField } from "../text-field/index.jsx";
import { Button } from "../button/index.jsx";

const CSS = `
.ts-modal-trigger{all:unset;box-sizing:border-box;display:inline-flex;align-items:center;gap:8px;height:44px;padding:0 18px;border-radius:var(--ts-radius-md);
  font-family:var(--ts-font);font-size:14.5px;font-weight:600;cursor:pointer;color:var(--ts-ink);background:var(--ts-surface);box-shadow:inset 0 0 0 1px var(--ts-line)}
.ts-modal-trigger:hover{background:var(--ts-surface2)}
.ts-modal-trigger:focus-visible{outline:2px solid var(--ts-focus);outline-offset:2px}
.ts-modal-scrim{position:fixed;inset:0;z-index:120;display:grid;place-items:center;padding:16px;background:color-mix(in srgb,var(--ts-bg) 62%,transparent);backdrop-filter:blur(var(--md-blur))}
.ts-modal{position:relative;width:min(var(--md-w),100%);max-height:calc(100vh - 32px);display:flex;flex-direction:column;font-family:var(--ts-font);color:var(--ts-ink);
  background:var(--ts-surface);border-radius:calc(var(--ts-radius-lg) + 4px);box-shadow:0 0 0 1px var(--ts-line),0 40px 100px -30px color-mix(in srgb,var(--ts-bg) 70%,var(--ts-black) 30%);transform-origin:0 0;outline:none}
.ts-modal__in{display:flex;flex-direction:column;gap:18px;padding:22px;overflow:auto}
.ts-modal__head{display:flex;align-items:flex-start;gap:12px}
.ts-modal__title{margin:0;font-size:19px;font-weight:650;letter-spacing:-0.015em}
.ts-modal__desc{margin:4px 0 0;font-size:13.5px;line-height:1.5;color:var(--ts-ink2)}
.ts-modal__x{all:unset;margin-left:auto;display:grid;place-items:center;flex:none;width:32px;height:32px;border-radius:var(--ts-radius-sm);color:var(--ts-ink2);cursor:pointer}
.ts-modal__x:hover{color:var(--ts-ink);background:var(--ts-surface2)}
.ts-modal__x:focus-visible{outline:2px solid var(--ts-focus);outline-offset:1px}
.ts-modal__x:disabled,.ts-modal__ghost:disabled{opacity:.42;cursor:not-allowed;background:none}
.ts-modal-trigger:disabled{opacity:.42;cursor:not-allowed}
.ts-modal__people{display:flex;flex-direction:column;margin:0;padding:0;list-style:none;border-radius:var(--ts-radius-md);box-shadow:inset 0 0 0 1px var(--ts-line)}
.ts-modal__person{display:flex;align-items:center;gap:10px;padding:10px 12px;border-top:1px solid var(--ts-line);font-size:13.5px}
.ts-modal__person:first-child{border-top:0}
.ts-modal__av{display:grid;place-items:center;width:30px;height:30px;border-radius:99px;font-size:11.5px;font-weight:650;background:color-mix(in srgb,var(--ts-accent) 22%,var(--ts-surface2))}
.ts-modal__role{margin-left:auto;font-size:12px;color:var(--ts-ink2)}
.ts-modal__foot{display:flex;justify-content:flex-end;align-items:center;gap:8px}
.ts-modal__ghost{all:unset;height:40px;padding:0 14px;border-radius:var(--ts-radius-md);font-size:14px;font-weight:550;color:var(--ts-ink2);cursor:pointer}
.ts-modal__ghost:hover{color:var(--ts-ink);background:var(--ts-surface2)}
.ts-modal__ghost:focus-visible{outline:2px solid var(--ts-focus);outline-offset:2px}
/* phones: the scrim tracks the visual viewport, so the dialog stays centred in what's visible above the
   keyboard and clear of the notch and home indicator */
@media (max-width:640px){
  .ts-modal-scrim{top:var(--vv-top,0px);bottom:auto;height:var(--vv-h,100dvh);box-sizing:border-box;
    padding:max(12px,env(safe-area-inset-top)) max(12px,env(safe-area-inset-right)) max(12px,env(safe-area-inset-bottom)) max(12px,env(safe-area-inset-left))}
  .ts-modal{max-height:100%}
  .ts-modal__in{padding:20px 18px 18px;overscroll-behavior:contain}
  .ts-modal__x{width:44px;height:44px;margin:-10px -12px 0 auto}
  .ts-modal .ts-input{font-size:16px}
  .ts-modal__ghost{height:44px}
}
@media (pointer:coarse){.ts-modal__x{width:44px;height:44px;margin:-10px -12px 0 auto}.ts-modal__ghost{height:44px}}
`;
registerStyles("ts-modal", CSS);

const SIZES = { sm: 380, md: 480, lg: 620 };

/** The gallery's sample content: an invite form. Shown only when a Modal is given no children and no footer. */
function InviteDemo() {
  return (
    <>
      <TextField label="Email address" hint="Separate several emails with commas." successText="" />
      <ul className="ts-modal__people" aria-label="Already in the project">
        {[["Maya Chen", "MC", "Owner"], ["Tomás Rey", "TR", "Editor"]].map(([n, i, r]) => (
          <li key={n} className="ts-modal__person"><span className="ts-modal__av" aria-hidden>{i}</span>{n}<span className="ts-modal__role">{r}</span></li>
        ))}
      </ul>
    </>
  );
}

const setRef = (r, el) => { if (typeof r === "function") r(el); else if (r) r.current = el; };
// a ref, an element, a selector or a function returning one of those
const resolveEl = (t) => {
  const v = typeof t === "function" ? t() : t;
  if (!v) return null;
  if (typeof v === "string") return document.querySelector(v);
  return "current" in v && !(v instanceof Element) ? v.current : v;
};

/** Make everything outside `el` inert (and hidden from screen readers) while a modal is open. Only touches
 *  elements it changed itself, so nested modals and the caller's own inert regions are left alone. */
function useInertOutside(ref, active) {
  useIsoLayoutEffect(() => {
    const el = ref.current;
    if (!active || !el) return;
    const changed = [];
    for (let n = el; n && n.parentElement && n !== document.body; n = n.parentElement) {
      for (const sib of n.parentElement.children) {
        if (sib === n || sib.inert || /^(SCRIPT|STYLE|LINK|TEMPLATE)$/.test(sib.tagName)) continue;
        sib.inert = true;
        changed.push(sib);
      }
    }
    // whatever had focus is now inert and would drop it to the body until the trap moves it in: hold it on the dialog
    if (!el.contains(document.activeElement)) el.querySelector('[role="dialog"]')?.focus({ preventScroll: true });
    return () => changed.forEach((s) => { s.inert = false; });
  }, [active]);
}

/**
 * Modal — a dialog that grows out of the button that opened it and shrinks back into it on close.
 * The background dims and blurs. Focus is trapped inside, the page behind is inert and its scroll locked,
 * Escape and a press outside close it (`closeOnEscape` / `closeOnOutside` switch them off), and focus returns
 * to the trigger. Reduced motion: a plain fade. Built without layoutId (it can stall exits); the grow is a
 * measured FLIP from the trigger's rect. Phones: centred in the visible viewport (above the keyboard, inside
 * the safe areas), 44px targets.
 *
 * Content: `title` and `description` head the dialog, `children` are the body and `footer` the actions. Left alone,
 * the footer is Cancel plus a confirm button that calls `onConfirm` (return false to stay open; return a promise
 * and the button shows loading until it settles; `confirmVariant="danger"` for destructive actions and
 * `confirmDisabled` to hold it until the form is valid). Pass `footer={null}` for none, or a function of
 * `{ close, busy }` (children take the same function form). `busy` is the caller's own busy flag: the confirm
 * button shows loading and will not fire, and nothing closes the dialog until it clears (`closeWhileBusy` allows it).
 * `demo` shows the gallery's invite sample when there are no children and no footer.
 * Open state: uncontrolled by default, or pass `open` + `onOpenChange`. `trigger` is a node (cloned with a ref and
 * onClick), a render function `(props) => <YourButton {...props} />`, or null for none. With `open` passed and no
 * `trigger`, no built-in button is rendered (the dialog is opened by state).
 * Focus lands on the first input (or any element marked data-autofocus), else the first control. On close it goes
 * to `returnFocusTo` if given, else the trigger, else whatever had focus before, else the nearest control that is
 * still on the page where the trigger was (the trigger may have been removed).
 * The ref, `className`, `style` and other props go to the dialog element (rendered only while open).
 */
export const Modal = forwardRef(function Modal({
  triggerLabel = "Open",
  title = "",
  description = "",
  size = "md",
  grow = true,
  blur = 6,
  closeOnOutside = true,
  closeOnEscape = true,
  confirmLabel = "Confirm",
  defaultOpen = false,
  cancelLabel = "Cancel",
  confirmVariant = "primary",
  confirmDisabled = false,
  triggerIcon = "user",
  busy = false,
  closeWhileBusy = false,
  disabled = false,
  demo = false,
  returnFocusTo,
  open: openProp,
  onOpenChange,
  onConfirm,
  onClose,
  trigger: triggerProp,
  footer,
  children,
  forceState,
  className,
  style,
  ...rest
}, ref) {
  const sheetTag = useStyles("ts-modal", CSS);
  const reduce = useReducedMotion();
  const uid = useId();
  const trigger = useRef(null);
  const dialog = useRef(null);
  const from = useRef(null);
  const [openState, setOpenState] = useState(defaultOpen || forceState === "open");
  const controlled = openProp !== undefined;
  const open = controlled ? !!openProp : openState;
  const setOpen = (v, why) => { if (!controlled) setOpenState(v); onOpenChange?.(v, why); };
  const [busyState, setBusy] = useState(false);
  const isBusy = busy || busyState;
  const showDemo = demo && children === undefined && footer === undefined;
  const [hideTrigger, setHideTrigger] = useState(false);
  const controls = useAnimationControls();
  const scrim = useRef(null);
  useEffect(() => { if (forceState === "open") setOpenState(true); }, [forceState]);
  const setDialog = useCallback((el) => { dialog.current = el; setRef(ref, el); }, [ref]);
  const live = useRef({});
  live.current = { returnFocusTo };

  const measure = () => { const t = trigger.current; from.current = t?.isConnected ? t.getBoundingClientRect() : null; };
  const doOpen = () => { if (disabled) return; measure(); setOpen(true, "trigger"); };
  const close = (why) => {
    if (why === "outside" && !closeOnOutside) return;
    if (why === "escape" && !closeOnEscape) return;
    if (why !== "confirm" && why !== "footer" && isBusy && !closeWhileBusy) return;   // "footer": the caller's own close(), their call
    measure(); setOpen(false, why); onClose?.(why);
  };

  // the default confirm: run onConfirm, wait for it if it is async, and close unless it answers false
  const alive = useRef(true);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
  // `confirming` holds from the first press until the dialog is open again: the button stays on screen and
  // clickable while the dialog animates out, so a double click would otherwise call onConfirm twice
  const confirming = useRef(false);
  useEffect(() => { if (open) confirming.current = false; }, [open]);
  const confirm = async () => {
    if (isBusy || confirming.current) return;
    confirming.current = true;
    let ok;
    try {
      const r = onConfirm?.();
      if (r && typeof r.then === "function") { setBusy(true); ok = await r; } else ok = r;
    } catch { ok = false; }   // a rejected promise keeps the dialog open: the caller shows why
    if (!alive.current) return;
    setBusy(false);
    if (ok !== false) close("confirm"); else confirming.current = false;
  };
  const slot = (v) => (typeof v === "function" ? v({ close: () => close("footer"), busy: isBusy }) : v);

  // first focus: a marked element, else the first input; in a radio group that means the checked radio, not the first one
  useFocusTrap(dialog, open, { initial: "[data-autofocus],input:not([type=radio]),input[type=radio]:checked", restore: false });
  useDismiss(open, close, [dialog]);
  useScrollLock(open);

  // focus on close: returnFocusTo, the trigger, what had focus before, or the nearest control still on the page
  // around where the opener was. Runs on close and on unmount (a confirm that removes the whole Modal).
  // A layout effect so it reads the opener before the page behind is made inert (which drops its focus).
  useIsoLayoutEffect(() => {
    if (!open) return;
    const ae = document.activeElement;
    const opener = ae && ae !== document.body ? ae : null;
    const chain = [];
    const origin = opener ?? trigger.current;
    for (let n = origin?.parentElement; n && n !== document.body; n = n.parentElement) chain.push(n);
    const at = origin?.getBoundingClientRect();
    const dlg = dialog.current;
    return () => {
      const pref = live.current.returnFocusTo;
      if (pref === false) return;
      const trig = trigger.current;
      requestAnimationFrame(() => {
        const now = document.activeElement;
        const inDialog = (el) => !!(dlg && dlg.contains(el)) || !!el?.closest?.(".ts-modal");
        // focus already went somewhere else on purpose (another field, another dialog): leave it
        if (now && now !== document.body && !inDialog(now)) return;
        const tryFocus = (el) => {
          if (!el || !el.isConnected || inDialog(el) || el.inert || el.closest?.("[inert]")) return false;
          el.focus?.({ preventScroll: true });
          return document.activeElement === el;
        };
        if ([resolveEl(pref), trig, opener].some(tryFocus)) return;
        // the opener is gone: the control now nearest to where it stood, inside its closest surviving ancestor
        const dist = (el) => { if (!at) return 0; const r = el.getBoundingClientRect(); return Math.hypot(r.left + r.width / 2 - at.left - at.width / 2, r.top + r.height / 2 - at.top - at.height / 2); };
        for (const n of chain) {
          if (!n.isConnected) continue;
          const list = focusables(n).filter((el) => !inDialog(el)).sort((a, b) => dist(a) - dist(b));
          if (list.some(tryFocus)) return;
        }
      });
    };
  }, [open]);
  useInertOutside(scrim, open);

  // follow the visual viewport (it shrinks under an on-screen keyboard); the phone CSS sizes the scrim to it
  useEffect(() => {
    const vv = window.visualViewport;
    if (!open || !vv) return;
    const fit = () => { scrim.current?.style.setProperty("--vv-top", vv.offsetTop + "px"); scrim.current?.style.setProperty("--vv-h", vv.height + "px"); };
    fit();
    vv.addEventListener("resize", fit);
    vv.addEventListener("scroll", fit);
    return () => { vv.removeEventListener("resize", fit); vv.removeEventListener("scroll", fit); };
  }, [open]);

  const morph = grow && !reduce;
  // the dialog's own layout box, ignoring its current transform (mid-animation the rect is scaled and moved)
  const box = (el) => {
    const p = el.offsetParent?.getBoundingClientRect() ?? { left: 0, top: 0 };
    return { left: p.left + el.offsetLeft, top: p.top + el.offsetTop, width: el.offsetWidth, height: el.offsetHeight };
  };
  // FLIP: start the dialog at the trigger's box, then release it to its own
  const flip = () => {
    const f = from.current, el = dialog.current;
    if (!f || !el || !f.width || !f.height) return null;
    const t = box(el);
    return { x: f.left - t.left, y: f.top - t.top, scaleX: f.width / t.width, scaleY: f.height / t.height };
  };
  // true from close until the exit finishes: a reopen in that window reuses the same element mid-shrink
  const exiting = useRef(false);
  useIsoLayoutEffect(() => {
    if (!open) { exiting.current = !!dialog.current; if (exiting.current) measure(); return; }
    const resume = exiting.current;
    exiting.current = false;
    if (!controlled || !from.current) measure();   // opened by state: grow from the trigger if there is one
    const s = morph ? flip() : null;
    if (s) {
      if (typeof triggerProp !== "function" && !isValidElement(triggerProp) && triggerProp !== null) setHideTrigger(true);
      if (!resume) controls.set({ ...s, opacity: 1 }); // reopened mid-close: grow on from where it is
      controls.start({ x: 0, y: 0, scaleX: 1, scaleY: 1, opacity: 1, transition: { type: "spring", stiffness: 380, damping: 34, mass: 0.9 } });
    } else {
      if (!resume) controls.set({ x: 0, y: 0, scaleX: 1, scaleY: 1, opacity: 0, scale: reduce ? 1 : 0.97 });
      controls.start({ x: 0, y: 0, scaleX: 1, scaleY: 1, opacity: 1, scale: 1, transition: { duration: reduce ? 0.12 : 0.18 } });
    }
  }, [open]);

  const triggerProps = { ref: trigger, onClick: doOpen, "aria-haspopup": "dialog", "aria-expanded": open, disabled: disabled || undefined };
  let triggerEl = null;
  if (typeof triggerProp === "function") triggerEl = triggerProp(triggerProps);
  else if (isValidElement(triggerProp)) {
    const own = triggerProp.props;
    triggerEl = cloneElement(triggerProp, {
      ref: (el) => { trigger.current = el; setRef(refOf(triggerProp), el); },
      onClick: (e) => { own.onClick?.(e); if (!e?.defaultPrevented) doOpen(); },
      "aria-haspopup": "dialog",
      "aria-expanded": open,
      ...(disabled ? { disabled: true } : null),
    });
  } else if (triggerProp !== null && !(controlled && triggerProp === undefined)) {   // opened by state: no built-in button unless asked for
    triggerEl = (
      <button ref={trigger} type="button" className="ts-modal-trigger" onClick={doOpen} aria-haspopup="dialog" aria-expanded={open} disabled={disabled} style={hideTrigger ? { opacity: 0 } : undefined}>
        {triggerIcon && triggerIcon !== "none" && <Icon name={triggerIcon} size={17} />}{triggerLabel}
      </button>
    );
  }

  return (
    <>{sheetTag}
      {triggerEl}
      <AnimatePresence onExitComplete={() => { exiting.current = false; setHideTrigger(false); }} custom={morph}>
        {open && (
          <motion.div key="scrim" ref={scrim} className="ts-modal-scrim" style={{ "--md-blur": blur + "px" }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.22, delay: morph ? 0.05 : 0 } }} transition={{ duration: 0.2 }}>
            <motion.div
              {...rest}
              ref={setDialog}
              className={"ts-modal" + (className ? " " + className : "")}
              role="dialog"
              aria-modal="true"
              aria-labelledby={rest["aria-labelledby"] ?? (title ? uid + "t" : undefined)}
              aria-label={rest["aria-label"] ?? (title ? undefined : triggerLabel)}
              aria-describedby={rest["aria-describedby"] ?? (description ? uid + "d" : undefined)}
              aria-busy={isBusy || undefined}
              tabIndex={-1}
              style={{ ...style, "--md-w": (SIZES[size] ?? SIZES.md) + "px" }}
              initial={false}
              animate={controls}
              exit={morph ? "shrink" : { opacity: 0, transition: { duration: 0.14 } }}
              variants={{ shrink: () => ({ ...(flip() ?? { opacity: 0 }), transition: { type: "spring", stiffness: 520, damping: 44 } }) }}
            >
              <motion.div className="ts-modal__in"
                initial={morph ? { opacity: 0 } : false} animate={{ opacity: 1, transition: { delay: morph ? 0.1 : 0, duration: 0.2 } }} exit={{ opacity: 0, transition: { duration: 0.08 } }}>
                <div className="ts-modal__head">
                  <div>
                    {title && <h2 id={uid + "t"} className="ts-modal__title">{title}</h2>}
                    {description && <p id={uid + "d"} className="ts-modal__desc">{description}</p>}
                  </div>
                  <button type="button" className="ts-modal__x" aria-label="Close" disabled={isBusy && !closeWhileBusy} onClick={() => close("button")}><Icon name="x" size={16} stroke={2} /></button>
                </div>
                {showDemo ? <InviteDemo /> : slot(children)}
                {footer === undefined ? (
                  (cancelLabel || confirmLabel) && <div className="ts-modal__foot">
                    {cancelLabel && <button type="button" className="ts-modal__ghost" disabled={isBusy && !closeWhileBusy} onClick={() => close("button")}>{cancelLabel}</button>}
                    {showDemo
                      ? <Button label={confirmLabel} simulate onClick={() => setTimeout(() => close("confirm"), 2200)} />
                      : confirmLabel && <Button label={confirmLabel} variant={confirmVariant} disabled={confirmDisabled} loading={isBusy} onClick={confirm} />}
                  </div>
                ) : footer !== null && <div className="ts-modal__foot">{slot(footer)}</div>}
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
});
