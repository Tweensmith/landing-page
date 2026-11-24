"use client";
import { cloneElement, forwardRef, isValidElement, useCallback, useEffect, useId, useRef, useState } from "react";
import { motion, AnimatePresence, useMotionValue } from "motion/react";
import { registerStyles, useStyles, useIsoLayoutEffect, useReducedMotion, refOf } from "../_shared/theme.jsx";
import { Icon } from "../_shared/icons.jsx";
import { useDismiss, useFloating, originFor, focusables, Layer } from "../_shared/overlay.jsx";

const CSS = `
.ts-pop-area{position:relative;width:min(560px,100%);height:var(--pa-h);border-radius:calc(var(--ts-radius-lg) + 4px);font-family:var(--ts-font);
  background:radial-gradient(circle at 1px 1px,color-mix(in srgb,var(--ts-ink) 14%,transparent) 1px,transparent 0) 0 0/18px 18px,var(--ts-surface);box-shadow:inset 0 0 0 1px var(--ts-line);overflow:hidden}
.ts-pop-hint{position:absolute;left:14px;bottom:12px;font-size:12px;color:var(--ts-ink2);pointer-events:none}
.ts-pop-anchor{all:unset;box-sizing:border-box;position:absolute;left:calc(50% - 22px);top:calc(50% - 22px);display:grid;place-items:center;width:44px;height:44px;border-radius:99px;cursor:grab;touch-action:none;
  font-size:14px;font-weight:700;color:var(--ts-accent-ink);background:var(--ts-accent);box-shadow:0 0 0 4px color-mix(in srgb,var(--ts-accent) 22%,transparent),0 8px 20px -6px color-mix(in srgb,var(--ts-bg) 60%,transparent)}
.ts-pop-anchor:active{cursor:grabbing}
.ts-pop-anchor:focus-visible{outline:2px solid var(--ts-focus);outline-offset:4px}
.ts-pop{position:fixed;z-index:125;width:var(--pp-w);max-width:calc(100vw - 16px);font-family:var(--ts-font);color:var(--ts-ink);
  background:var(--ts-surface);border-radius:calc(var(--ts-radius-md) + 4px);box-shadow:0 0 0 1px var(--ts-line),0 20px 50px -14px color-mix(in srgb,var(--ts-bg) 70%,var(--ts-black) 30%);outline:none}
.ts-pop__arrow{position:absolute;pointer-events:none;width:12px;height:12px;background:var(--ts-surface);transform:rotate(45deg);box-shadow:-1px -1px 0 0 var(--ts-line);margin:-6px}
.ts-pop[data-side=bottom] .ts-pop__arrow{top:0}
.ts-pop[data-side=top] .ts-pop__arrow{bottom:-12px;box-shadow:1px 1px 0 0 var(--ts-line)}
.ts-pop[data-side=right] .ts-pop__arrow{left:0;box-shadow:-1px 1px 0 0 var(--ts-line)}
.ts-pop[data-side=left] .ts-pop__arrow{right:-12px;box-shadow:1px -1px 0 0 var(--ts-line)}
.ts-pop__in{position:relative;display:flex;flex-direction:column;gap:12px;padding:16px;overflow-y:auto;overscroll-behavior:contain}
.ts-pop__title{margin:0;font-size:15px;font-weight:620;letter-spacing:-0.01em}
.ts-pop__body{font-size:13.5px;line-height:1.5}
.ts-pop:focus-visible{box-shadow:0 0 0 2px var(--ts-focus),0 20px 50px -14px color-mix(in srgb,var(--ts-bg) 70%,var(--ts-black) 30%)}
.ts-pop__who{display:flex;align-items:center;gap:12px}
.ts-pop__av{display:grid;place-items:center;width:42px;height:42px;border-radius:99px;font-weight:700;font-size:14px;background:var(--ts-accent);color:var(--ts-accent-ink)}
.ts-pop__who b{display:block;font-size:15px;font-weight:620}
.ts-pop__who b + span{font-size:12.5px;color:var(--ts-ink2)}
.ts-pop__bio{margin:0;font-size:13px;line-height:1.5;color:var(--ts-ink2)}
.ts-pop__stats{display:flex;gap:16px;font-size:12.5px;color:var(--ts-ink2)}
.ts-pop__stats b{color:var(--ts-ink);font-weight:620;margin-right:3px}
.ts-pop__acts{display:flex;gap:8px}
.ts-pop__btn{all:unset;box-sizing:border-box;flex:1;display:inline-flex;align-items:center;justify-content:center;gap:6px;height:34px;border-radius:var(--ts-radius-sm);font-size:13px;font-weight:600;cursor:pointer;background:var(--ts-surface2);color:var(--ts-ink)}
.ts-pop__btn.is-primary{background:var(--ts-accent);color:var(--ts-accent-ink)}
.ts-pop__btn:hover{filter:brightness(1.07)}
.ts-pop__btn:focus-visible{outline:2px solid var(--ts-focus);outline-offset:2px}
@media (max-width:640px),(pointer:coarse){.ts-pop__btn{height:44px;font-size:14px}.ts-pop-hint{right:14px;font-size:12.5px}}
/* phones: the card can't go sideways, so give the stage enough height for it above or below the avatar */
@media (max-width:640px){.ts-pop-area{height:max(var(--pa-h),min(540px,calc(100dvh - 96px)))}}
`;
registerStyles("ts-popover", CSS);

const setRef = (r, el) => { if (typeof r === "function") r(el); else if (r) r.current = el; };

/**
 * Popover — a small non-modal panel anchored to an element.
 * Signature: the arrow keeps pointing at the anchor's centre as the anchor moves, and the panel
 * flips to the other side or slides along its edge before it would leave the viewport.
 *
 * Pass your own `trigger` (an element, cloned with a ref, onClick and aria attributes, or a render function
 * `(props) => <Button {...props} />`), or `anchorRef` to anchor it to an element you already have and open it by
 * state. Content goes in `children` (or `content`); `title` gives it a visible heading and its name, else
 * `aria-label`, else the trigger's text names it. `placement` and `offset` set where it sits; it flips when
 * there is no room. Open state: `open` / `defaultOpen` / `onOpenChange(open, reason)`.
 * Escape or a press outside closes it (`closeOnEscape` / `closeOnOutside` switch them off). Opening moves focus
 * to the first control inside (or the panel); closing with Escape or from inside puts it back on the trigger.
 * The panel renders through a portal into document.body (`portal`, default true) carrying the theme found at the
 * anchor, so an ancestor with overflow:hidden, transform or filter can't clip or move it; Tab from its last control
 * continues after the anchor, Shift+Tab from its first returns to it. `portal={false}` renders it in place, or
 * pass an element / ref to portal into.
 * `demo` shows the gallery's stage: a draggable avatar with a profile card.
 * The ref, `className`, `style` and other props go to the panel (rendered only while open).
 */
export const Popover = forwardRef(function Popover({
  trigger,
  anchorRef,
  content,
  children,
  title,
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  placement = "top",
  offset = 12,
  width = 280,
  showArrow = true,
  closeOnEscape = true,
  closeOnOutside = true,
  autoFocus = true,
  disabled = false,
  demo = false,
  contain = true,
  areaHeight = 400,
  portal = true,
  forceState,
  className,
  style,
  ...rest
}, ref) {
  const sheetTag = useStyles("ts-popover", CSS);
  const body = content ?? children;
  const isDemo = demo && trigger === undefined && anchorRef === undefined && body === undefined;
  if (isDemo) return <>{sheetTag}<PopoverDemo {...{ placement, offset, width, showArrow, contain, areaHeight, defaultOpen, forceState, openProp, onOpenChange, closeOnEscape, closeOnOutside, portal, className, style, rest, panelRef: ref }} /></>;
  return <>{sheetTag}<AnchoredPopover {...{ trigger, anchorRef, body, title, openProp, defaultOpen, onOpenChange, placement, offset, width, showArrow, closeOnEscape, closeOnOutside, autoFocus, disabled, forceState, portal, className, style, rest, panelRef: ref }} /></>;
});

/** Open state that works controlled (`open`) or not, reporting every change through onOpenChange. */
function useOpen(openProp, defaultOpen, forceState, onOpenChange) {
  const [state, setState] = useState(!!defaultOpen || forceState === "open");
  const controlled = openProp !== undefined;
  useEffect(() => { if (forceState === "open") setState(true); }, [forceState]);
  const open = controlled ? !!openProp : state;
  const setOpen = (v, why) => { if (v === open) return; if (!controlled) setState(v); onOpenChange?.(v, why); };
  return [open, setOpen];
}

const panelMotion = (reduce) => ({
  initial: reduce ? { opacity: 0 } : { opacity: 0, scale: 0.94 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: reduce ? 1 : 0.96, transition: { duration: reduce ? 0.08 : 0.12 } },
  transition: reduce ? { duration: 0.12 } : { type: "spring", stiffness: 600, damping: 36 },
});

function AnchoredPopover({ trigger, anchorRef, body, title, openProp, defaultOpen, onOpenChange, placement, offset, width, showArrow, closeOnEscape, closeOnOutside, autoFocus, disabled, forceState, portal, className, style, rest, panelRef }) {
  const reduce = useReducedMotion();
  const uid = useId();
  const own = useRef(null);
  const anchor = anchorRef ?? own;
  const panel = useRef(null);
  const [open, setOpen] = useOpen(openProp, defaultOpen, forceState, onOpenChange);
  const setPanel = useCallback((el) => { panel.current = el; setRef(panelRef, el); }, [panelRef]);
  const pos = useFloating(anchor, panel, open, { placement, offset: showArrow ? offset : offset - 4, padding: 8 });
  useDismiss(open, (why) => {
    if (why === "escape" && !closeOnEscape) return;
    if (why === "outside" && !closeOnOutside) return;
    setOpen(false, why);
  }, [panel, anchor]);

  // focus in on open, back to the trigger on close when focus was inside (or was dropped to the body)
  useEffect(() => {
    if (!open || !pos || !autoFocus) return;
    const el = panel.current;
    if (!el || el.contains(document.activeElement)) return;
    (el.querySelector("[data-autofocus]") || focusables(el)[0] || el).focus({ preventScroll: true });
  }, [open, !!pos]);
  const wasOpen = useRef(open);
  const before = useRef(null);   // what had focus when it opened: the way back when the anchor can't take focus
  useIsoLayoutEffect(() => { if (open && !wasOpen.current) before.current = document.activeElement; }, [open]);
  useEffect(() => {
    if (wasOpen.current && !open) {
      const ae = document.activeElement;
      if (!ae || ae === document.body || panel.current?.contains(ae)) {
        const back = [anchor.current, before.current].find((el) => { if (!el?.isConnected) return false; el.focus?.({ preventScroll: true }); return document.activeElement === el; });
        if (!back) document.activeElement?.blur?.();
      }
    }
    wasOpen.current = open;
  }, [open]);

  const toggle = () => { if (!disabled) setOpen(!open, "trigger"); };
  const triggerId = uid + "t";
  const aria = { "aria-haspopup": "dialog", "aria-expanded": open, "aria-controls": open ? uid : undefined };
  let triggerEl = null;
  if (typeof trigger === "function") triggerEl = trigger({ ref: own, id: triggerId, onClick: toggle, disabled: disabled || undefined, open, ...aria });
  else if (isValidElement(trigger)) {
    const p = trigger.props;
    triggerEl = cloneElement(trigger, {
      ref: (el) => { own.current = el; setRef(refOf(trigger), el); },
      id: p.id ?? triggerId,
      onClick: (e) => { p.onClick?.(e); if (!e?.defaultPrevented) toggle(); },
      ...aria,
      ...(disabled ? { disabled: true } : null),
    });
  }
  const labelledBy = rest["aria-labelledby"] ?? (title ? uid + "h" : rest["aria-label"] ? undefined : anchorRef ? undefined : (isValidElement(trigger) ? trigger.props.id ?? triggerId : trigger ? triggerId : undefined));
  const w = typeof width === "number" ? width + "px" : width;

  return (
    <>
      {triggerEl}
      <AnimatePresence>
        {open && (
          <Layer key="p" portal={portal} anchor={anchor} tabOut={anchor} z={125}>
          <motion.div
            {...rest}
            ref={setPanel}
            id={uid}
            key="p"
            className={"ts-pop" + (className ? " " + className : "")}
            role="dialog"
            tabIndex={-1}
            aria-labelledby={labelledBy}
            data-side={pos?.side ?? placement.split("-")[0]}
            style={{ ...style, "--pp-w": w, left: pos?.x ?? -9999, top: pos?.y ?? 0, transformOrigin: originFor(pos), visibility: pos ? undefined : "hidden" }}
            onKeyDown={(e) => {
              rest.onKeyDown?.(e);
              // handled here so an Escape inside a popover inside a Modal closes only the popover
              if (e.key === "Escape" && closeOnEscape) { e.stopPropagation(); setOpen(false, "escape"); }
            }}
            {...panelMotion(reduce)}
          >
            {showArrow && pos && <span className="ts-pop__arrow" aria-hidden style={pos.arrow.left != null ? { left: pos.arrow.left } : { top: pos.arrow.top }} />}
            <div className="ts-pop__in" style={{ maxHeight: pos?.maxHeight }}>
              {title && <h2 id={uid + "h"} className="ts-pop__title">{title}</h2>}
              {body != null && <div className="ts-pop__body">{body}</div>}
            </div>
          </motion.div>
          </Layer>
        )}
      </AnimatePresence>
    </>
  );
}

/** The gallery's stage: a draggable avatar and a sample profile card. Shown only with `demo` and no content. */
function PopoverDemo({ placement, offset, width, showArrow, contain, areaHeight, defaultOpen, forceState, openProp, onOpenChange, closeOnEscape, closeOnOutside, portal, className, style, rest, panelRef }) {
  const sheetTag = useStyles("ts-popover", CSS);
  const reduce = useReducedMotion();
  const uid = useId();
  const area = useRef(null);
  const anchor = useRef(null);
  const panel = useRef(null);
  const [open, setOpenRaw] = useOpen(openProp, defaultOpen, forceState, onOpenChange);
  const setOpen = (v) => setOpenRaw(typeof v === "function" ? v(open) : v, "trigger");
  const setPanel = useCallback((el) => { panel.current = el; setRef(panelRef, el); }, [panelRef]);
  const focusIn = useRef(false);
  const x = useMotionValue(-100), y = useMotionValue(90);
  const pos = useFloating(anchor, panel, open, { placement, offset: showArrow ? offset : offset - 4, padding: 10, boundary: contain ? area : undefined });
  useDismiss(open, (why) => {
    if (why === "escape" && !closeOnEscape) return;
    if (why === "outside" && !closeOnOutside) return;
    setOpenRaw(false, why);
  }, [panel, anchor]);

  useEffect(() => {
    if (open && pos && focusIn.current) { focusIn.current = false; focusables(panel.current)[0]?.focus(); }
  }, [open, !!pos]);
  useEffect(() => { if (!open && document.activeElement && panel.current?.contains(document.activeElement)) anchor.current?.focus(); }, [open]);

  // drag the anchor with our own pointer tracking (clamped to the area); a press that doesn't move is a tap.
  // Works the same for mouse, pen and touch (touch-action:none on the anchor keeps the page from scrolling).
  const press = useRef(null);
  const onDown = (e) => {
    if (e.button > 0) return;
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch {}
    press.current = { px: e.clientX, py: e.clientY, x: x.get(), y: y.get(), moved: false };
  };
  const onMove = (e) => {
    const p = press.current;
    if (!p || reduce || !area.current) return;
    const dx = e.clientX - p.px, dy = e.clientY - p.py;
    if (!p.moved && Math.hypot(dx, dy) < 4) return;
    p.moved = true;
    const r = area.current.getBoundingClientRect();
    const mx = r.width / 2 - 22, my = r.height / 2 - 22;
    x.set(Math.max(-mx, Math.min(mx, p.x + dx)));
    y.set(Math.max(-my, Math.min(my, p.y + dy)));
  };
  const onUp = (e) => {
    const p = press.current;
    press.current = null;
    if (!p) return;
    if (!p.moved && e.type === "pointerup") setOpen((o) => !o);
  };

  const nudge = (e) => {
    const m = { ArrowLeft: [-12, 0], ArrowRight: [12, 0], ArrowUp: [0, -12], ArrowDown: [0, 12] }[e.key];
    if (!m || !area.current) return;
    e.preventDefault();
    const r = area.current.getBoundingClientRect();
    const mx = r.width / 2 - 22, my = r.height / 2 - 22;
    x.set(Math.max(-mx, Math.min(mx, x.get() + m[0] * (e.shiftKey ? 3 : 1))));
    y.set(Math.max(-my, Math.min(my, y.get() + m[1] * (e.shiftKey ? 3 : 1))));
  };

  return (
    <>{sheetTag}<div {...rest} ref={area} className={"ts-pop-area" + (className ? " " + className : "")} style={{ ...style, "--pa-h": areaHeight + "px" }}>
      <motion.button
        ref={anchor}
        type="button"
        className="ts-pop-anchor"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? uid : undefined}
        aria-label="Maya Chen, show profile. Arrow keys move it."
        style={{ x, y }}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") { e.preventDefault(); focusIn.current = !open; setOpen((o) => !o); }
          else nudge(e);
        }}
      >
        MC
      </motion.button>
      <span className="ts-pop-hint">Drag the avatar toward an edge. The card flips and the arrow follows.</span>
      <AnimatePresence>
        {open && (
          <Layer key="p" portal={portal} anchor={anchor} tabOut={anchor} z={125}>
          <motion.div
            ref={setPanel}
            id={uid}
            key="p"
            className="ts-pop"
            role="dialog"
            aria-label="Maya Chen's profile"
            data-side={pos?.side ?? placement.split("-")[0]}
            style={{ "--pp-w": width + "px", left: pos?.x ?? -9999, top: pos?.y ?? 0, transformOrigin: originFor(pos), visibility: pos ? undefined : "hidden" }}
            {...panelMotion(reduce)}
          >
            {showArrow && pos && <span className="ts-pop__arrow" aria-hidden style={pos.arrow.left != null ? { left: pos.arrow.left } : { top: pos.arrow.top }} />}
            {/* if neither side has room for the whole card, it scrolls rather than covering its anchor */}
            <div className="ts-pop__in" style={{ maxHeight: pos?.maxHeight }}>
              <div className="ts-pop__who">
                <span className="ts-pop__av" aria-hidden>MC</span>
                <div><b>Maya Chen</b><span>Design lead · Lisbon</span></div>
              </div>
              <p className="ts-pop__bio">Leads the type system and motion guidelines. Usually replies within a day.</p>
              <div className="ts-pop__stats"><span><b>48</b>projects</span><span><b>1.2k</b>followers</span></div>
              <div className="ts-pop__acts">
                <button type="button" className="ts-pop__btn is-primary"><Icon name="plus" size={14} stroke={2.4} />Follow</button>
                <button type="button" className="ts-pop__btn"><Icon name="message" size={14} />Message</button>
              </div>
            </div>
          </motion.div>
          </Layer>
        )}
      </AnimatePresence>
    </div></>
  );
}
