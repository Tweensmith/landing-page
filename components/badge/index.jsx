"use client";
import { Children, forwardRef, isValidElement, useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, animate, useIsPresent } from "motion/react";
import { registerStyles, useStyles, useIsoLayoutEffect, useReducedMotion } from "../_shared/theme.jsx";
import { Icon } from "../_shared/icons.jsx";

// Sizes are label heights (18 / 22 / 26), not control heights: a badge sits on a row, a card or a heading.
// Each size sets its type, padding, gap, dot, remove button and tick through custom properties.
const CSS = `
.ts-bdg{--bdg-h:22px;--bdg-fs:12px;--bdg-px:8px;--bdg-gap:5px;--bdg-dot:6px;--bdg-x:16px;--bdg-tick:10px;--bdg-icon:12px;
  --bdg-c:var(--ts-ink2);--bdg-fill:var(--ts-ink);--bdg-on:var(--ts-bg);--bdg-dc:var(--ts-ink3);
  all:unset;box-sizing:border-box;position:relative;display:inline-flex;align-items:center;justify-content:center;vertical-align:baseline;flex:none;
  height:var(--bdg-h);min-width:var(--bdg-h);max-width:100%;padding:0 var(--bdg-px);border-radius:999px;
  font-family:var(--ts-font);font-size:var(--bdg-fs);font-weight:560;letter-spacing:.005em;font-variant-numeric:tabular-nums;white-space:nowrap;
  color:var(--bdg-ink);background:var(--bdg-bg);box-shadow:var(--bdg-line);-webkit-tap-highlight-color:transparent;
  transition:background-color .28s ease,color .28s ease,box-shadow .28s ease,opacity .2s ease,transform .16s cubic-bezier(.2,.8,.2,1)}
.ts-bdg[data-size=sm]{--bdg-h:18px;--bdg-fs:11px;--bdg-px:6px;--bdg-gap:4px;--bdg-x:14px;--bdg-tick:9px;--bdg-icon:11px}
.ts-bdg[data-size=lg]{--bdg-h:26px;--bdg-fs:13px;--bdg-px:10px;--bdg-gap:6px;--bdg-dot:7px;--bdg-x:18px;--bdg-tick:11px;--bdg-icon:14px}
.ts-bdg[data-shape=rounded]{border-radius:min(var(--ts-radius-sm),calc(var(--bdg-h) * .27))}
.ts-bdg[data-tone=accent],.ts-bdg[data-tone=info]{--bdg-c:var(--ts-accent);--bdg-fill:var(--ts-accent);--bdg-on:var(--ts-accent-ink);--bdg-dc:var(--ts-accent)}
.ts-bdg[data-tone=success]{--bdg-c:var(--ts-success);--bdg-fill:var(--ts-success);--bdg-dc:var(--ts-success)}
.ts-bdg[data-tone=warning]{--bdg-c:var(--ts-warning);--bdg-fill:var(--ts-warning);--bdg-dc:var(--ts-warning)}
.ts-bdg[data-tone=danger]{--bdg-c:var(--ts-danger);--bdg-fill:var(--ts-danger);--bdg-dc:var(--ts-danger)}
.ts-bdg[data-surface=soft]{--bdg-bg:color-mix(in srgb,var(--bdg-c) 14%,transparent);--bdg-ink:color-mix(in srgb,var(--bdg-c) 70%,var(--ts-ink));--bdg-line:inset 0 0 0 1px color-mix(in srgb,var(--bdg-c) 16%,transparent)}
.ts-bdg[data-surface=outline]{--bdg-bg:color-mix(in srgb,var(--bdg-c) 0%,transparent);--bdg-ink:color-mix(in srgb,var(--bdg-c) 70%,var(--ts-ink));--bdg-line:inset 0 0 0 1px color-mix(in srgb,var(--bdg-c) 46%,transparent)}
.ts-bdg[data-surface=solid]{--bdg-bg:var(--bdg-fill);--bdg-ink:var(--bdg-on);--bdg-line:inset 0 0 0 1px color-mix(in srgb,var(--bdg-fill) 0%,transparent);--bdg-dc:currentColor}
.ts-bdg.is-selected{--bdg-bg:var(--ts-accent);--bdg-ink:var(--ts-accent-ink);--bdg-line:inset 0 0 0 1px color-mix(in srgb,var(--ts-accent) 0%,transparent);--bdg-dc:currentColor}
.ts-bdg.is-icon{padding:0;width:var(--bdg-h)}
.ts-bdg.is-short{padding:0 calc(var(--bdg-px) / 2)}
.ts-bdg.has-x{padding-inline-end:calc((var(--bdg-h) - var(--bdg-x)) / 2);gap:2px}
.ts-bdg__main{all:unset;box-sizing:border-box;position:relative;display:inline-flex;align-items:center;gap:var(--bdg-gap);min-width:0;height:var(--bdg-h);align-self:baseline;color:inherit;cursor:inherit;border-radius:inherit}
.ts-bdg__main > *{align-self:center}
.ts-bdg__main > .ts-bdg__lab{align-self:baseline}
.ts-bdg__lab{position:relative;display:block;min-width:0;height:var(--bdg-h);line-height:var(--bdg-h);overflow:hidden;overflow:clip}
.ts-bdg__txt{display:inline-block;vertical-align:top;white-space:nowrap}
.ts-bdg.is-trunc .ts-bdg__txt{max-width:100%;overflow:hidden;text-overflow:ellipsis}
.ts-bdg__icon{display:inline-grid;place-items:center;flex:none;width:var(--bdg-icon);height:var(--bdg-icon)}
.ts-bdg__icon > svg{width:100%;height:100%}
.ts-bdg__dot{position:relative;flex:none;width:var(--bdg-dot);height:var(--bdg-dot);border-radius:50%;background:var(--bdg-dc);transition:background-color .28s ease}
.ts-bdg__dot.is-pulse::after{content:"";position:absolute;inset:0;border-radius:inherit;background:var(--bdg-dc);opacity:0;animation:ts-bdg-ping 2.4s cubic-bezier(.2,.6,.3,1) infinite}
@keyframes ts-bdg-ping{0%{transform:scale(1);opacity:.55}72%,100%{transform:scale(2.7);opacity:0}}
.ts-bdg__tick{display:inline-grid;place-items:center;flex:none;width:0;margin-inline-end:calc(var(--bdg-gap) * -1);overflow:hidden;
  transition:width .32s cubic-bezier(.3,1.3,.5,1),margin .32s cubic-bezier(.3,1.3,.5,1)}
.ts-bdg__tick svg{flex:none;width:var(--bdg-tick);height:var(--bdg-tick)}
.ts-bdg__tick path{fill:none;stroke:currentColor;stroke-width:2.4;stroke-linecap:round;stroke-linejoin:round;stroke-dasharray:1;stroke-dashoffset:1;transition:stroke-dashoffset .26s cubic-bezier(.2,.8,.2,1) .08s}
.ts-bdg.is-selected .ts-bdg__tick{width:var(--bdg-tick);margin-inline-end:0}
.ts-bdg.is-selected .ts-bdg__tick path{stroke-dashoffset:0}
.ts-bdg__x{all:unset;box-sizing:border-box;position:relative;display:grid;place-items:center;flex:none;align-self:center;width:var(--bdg-x);height:var(--bdg-x);border-radius:50%;
  color:inherit;cursor:pointer;-webkit-tap-highlight-color:transparent;transition:background-color .15s ease,transform .14s cubic-bezier(.2,.8,.2,1)}
.ts-bdg__x:hover:not(:disabled){background:color-mix(in srgb,var(--bdg-ink) 16%,transparent)}
.ts-bdg__x:active:not(:disabled){transform:scale(.84)}
.ts-bdg__x:focus-visible{outline:2px solid var(--ts-focus);outline-offset:0}
.ts-bdg__x:disabled{cursor:not-allowed}
.ts-bdg.is-press{cursor:pointer;touch-action:manipulation}
:is(.ts-bdg.is-press:not(.has-x):hover,.ts-bdg.is-press:has(> button.ts-bdg__main:hover),.ts-bdg[data-force=hover]):not(.is-off)[data-surface=soft]:not(.is-selected){--bdg-bg:color-mix(in srgb,var(--bdg-c) 24%,transparent)}
:is(.ts-bdg.is-press:not(.has-x):hover,.ts-bdg.is-press:has(> button.ts-bdg__main:hover),.ts-bdg[data-force=hover]):not(.is-off)[data-surface=outline]:not(.is-selected){--bdg-bg:color-mix(in srgb,var(--bdg-c) 10%,transparent)}
:is(.ts-bdg.is-press:not(.has-x):hover,.ts-bdg.is-press:has(> button.ts-bdg__main:hover),.ts-bdg[data-force=hover]):not(.is-off)[data-surface=solid]:not(.is-selected){--bdg-bg:color-mix(in srgb,var(--bdg-fill) 86%,var(--ts-ink))}
:is(.ts-bdg.is-press:not(.has-x):hover,.ts-bdg.is-press:has(> button.ts-bdg__main:hover),.ts-bdg[data-force=hover]):not(.is-off).is-selected{--bdg-bg:color-mix(in srgb,var(--ts-accent) 86%,var(--ts-ink))}
:is(.ts-bdg.is-press:not(.has-x):active,.ts-bdg.is-press:has(> button.ts-bdg__main:active),.ts-bdg[data-force=active]):not(.is-off){transform:scale(.94)}
:is(.ts-bdg:focus-visible,.ts-bdg:has(> .ts-bdg__main:focus-visible),.ts-bdg[data-force=focus]){outline:2px solid var(--ts-focus);outline-offset:2px}
.ts-bdg.is-off{opacity:.45;cursor:not-allowed}
.ts-bdg.is-off .ts-bdg__main{cursor:not-allowed}
.ts-bdg[data-reduce] .ts-bdg__dot.is-pulse::after{animation:none;opacity:0}
.ts-bdg[data-reduce] .ts-bdg__dot.is-pulse{box-shadow:0 0 0 2px color-mix(in srgb,var(--bdg-dc) 28%,transparent)}
.ts-bdg[data-reduce],.ts-bdg[data-reduce] .ts-bdg__tick,.ts-bdg[data-reduce] .ts-bdg__tick path{transition-duration:.01s;transition-delay:0s}
@media (prefers-reduced-motion:reduce){
  .ts-bdg__dot.is-pulse::after{animation:none;opacity:0}
  .ts-bdg__dot.is-pulse{box-shadow:0 0 0 2px color-mix(in srgb,var(--bdg-dc) 28%,transparent)}
  .ts-bdg,.ts-bdg__tick,.ts-bdg__tick path,.ts-bdg__x{transition-duration:.01s;transition-delay:0s}
  :is(.ts-bdg.is-press:not(.has-x):active,.ts-bdg.is-press:has(> button.ts-bdg__main:active),.ts-bdg[data-force=active]):not(.is-off){transform:none;filter:brightness(.92)}
}
/* Phones and touch: a badge you press or remove grows to a 32px tag (36 at lg) and its targets reach 44px through
   pseudo-elements; with BadgeGroup's 12px row gap the targets of two rows meet but never overlap. Static badges keep
   their label sizes. */
@media (max-width:640px),(pointer:coarse){
  .ts-bdg.is-press,.ts-bdg.has-x{--bdg-h:32px;--bdg-fs:13px;--bdg-px:12px;--bdg-gap:6px;--bdg-x:24px;--bdg-tick:11px}
  .ts-bdg.is-press[data-size=lg],.ts-bdg.has-x[data-size=lg]{--bdg-h:36px;--bdg-fs:14px;--bdg-px:14px;--bdg-x:26px}
  .ts-bdg.is-press:not(.has-x)::before{content:"";position:absolute;left:50%;top:50%;width:max(100%,44px);height:44px;transform:translate(-50%,-50%)}
  button.ts-bdg__main::before{content:"";position:absolute;left:calc(var(--bdg-px) * -1);right:0;top:50%;height:44px;transform:translateY(-50%)}
  .ts-bdg__x::after{content:"";position:absolute;top:50%;left:-14px;right:-6px;height:44px;transform:translateY(-50%)}
}
.ts-bdg-group{position:relative;display:flex;flex-wrap:wrap;align-items:center;gap:var(--bdg-gg,6px);min-width:0;border-radius:var(--ts-radius-sm);outline:none}
.ts-bdg-group.is-nowrap{flex-wrap:nowrap}
.ts-bdg-group:focus-visible{outline:2px solid var(--ts-focus);outline-offset:3px}
.ts-bdg-group__item{display:inline-flex;max-width:100%;min-width:0}
@media (max-width:640px),(pointer:coarse){.ts-bdg-group{column-gap:max(var(--bdg-gg,6px),10px);row-gap:max(var(--bdg-gg,6px),12px)}}
.ts-bdg-demo{box-sizing:border-box;width:100%;max-width:460px;padding:16px 16px 6px;border-radius:var(--ts-radius-lg);background:var(--ts-surface);box-shadow:inset 0 0 0 1px var(--ts-line);
  font-family:var(--ts-font);color:var(--ts-ink)}
.ts-bdg-demo__head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:12px}
.ts-bdg-demo__title{display:flex;align-items:baseline;gap:8px;margin:0;font-size:15px;font-weight:620;letter-spacing:-.01em}
.ts-bdg-demo__rows{list-style:none;margin:12px 0 0;padding:0}
.ts-bdg-demo__row{display:flex;align-items:center;gap:12px;padding:11px 0;box-shadow:inset 0 1px 0 var(--ts-line)}
.ts-bdg-demo__id{flex:none;width:44px;font-family:var(--ts-font-mono);font-size:11.5px;color:var(--ts-ink2);font-variant-numeric:tabular-nums}
.ts-bdg-demo__what{display:flex;flex-direction:column;gap:2px;flex:1;min-width:0}
.ts-bdg-demo__name{font-size:13.5px;font-weight:540;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ts-bdg-demo__meta{font-size:12px;color:var(--ts-ink2);font-variant-numeric:tabular-nums}
.ts-bdg-demo__reset{all:unset;font-size:12px;color:var(--ts-ink2);text-decoration:underline;text-underline-offset:3px;cursor:pointer;border-radius:4px}
.ts-bdg-demo__reset:focus-visible{outline:2px solid var(--ts-focus);outline-offset:2px}
@media (max-width:640px),(pointer:coarse){.ts-bdg-demo__reset{display:inline-flex;align-items:center;min-height:44px}}
`;
registerStyles("ts-bdg", CSS);

const SIZE_SET = new Set(["sm", "md", "lg"]);
const TONE_SET = new Set(["neutral", "accent", "info", "success", "warning", "danger"]);
const SURFACE_SET = new Set(["soft", "solid", "outline"]);
const ICON_PX = { sm: 11, md: 12, lg: 14 };
const X_PX = { sm: 9, md: 10, lg: 11 };

// The label roll: the new word comes up from below while the old one leaves through the top, as Select rolls its value.
const ROLL = { enter: { y: "100%", opacity: 0 }, center: { y: "0%", opacity: 1 }, exit: { y: "-100%", opacity: 0 } };
const ROLL_SPRING = { type: "spring", stiffness: 520, damping: 40, opacity: { duration: 0.16 } };
const WIDTH_SPRING = { type: "spring", stiffness: 420, damping: 38, mass: 0.9 };
const ITEM_SPRING = { type: "spring", stiffness: 520, damping: 40 };

const textOf = (c) => (typeof c === "string" || typeof c === "number" ? String(c) : null);
const assign = (ref, el) => { if (typeof ref === "function") ref(el); else if (ref) ref.current = el; };
const hasContent = (children) => children !== undefined && children !== null && children !== false && children !== "";

// Where focus goes when a focused badge leaves: the next badge's control, else the previous one, else the group.
// Nothing happens unless focus is inside the badge, so a mouse user's focus is never moved.
function handOff(root) {
  if (!root || typeof document === "undefined" || !root.contains(document.activeElement)) return;
  root.setAttribute("data-gone", "");
  const group = root.closest("[data-ts-bdg-group]");
  const scope = group ?? root.parentElement;
  if (!scope) return;
  const all = [...scope.querySelectorAll(".ts-bdg__x:not(:disabled), button.ts-bdg__main:not(:disabled), button.ts-bdg:not(:disabled), a.ts-bdg[href]")]
    .filter((el) => !el.closest("[data-gone]"));
  const after = all.find((el) => root.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING);
  const before = all.filter((el) => root.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_PRECEDING).pop();
  const next = after ?? before ?? group;
  next?.focus({ preventScroll: true });
}

/**
 * Badge — a short static label or status ("Paid", "Draft", "Beta", "3 new"), and the kit's Tag: the same thing when
 * a person can press it (a filter chip, with `selected`) or remove it (`onRemove`).
 * Signature: a status changes, it is not replaced. When the text changes on a mounted badge the old word rolls out
 * through the top, the new one rolls in from below, the colour cross-fades to the new tone, and the label's width
 * springs from the old word's width to the new one's, so the row around it does not jump. At rest the width is
 * the text's own (auto), exactly as a freshly mounted badge. `dot` adds a status dot; `pulse` lets one calm ring
 * leave it for something live. Reduced motion: the text swaps in place, no roll, no width spring, the dot is still.
 * Pressable with `onClick` (a <button>; pass `selected` true or false and it is a toggle with aria-pressed and a drawn tick) or `href` (an <a>).
 * Removable with `onRemove`: the × is a real button named "Remove <label>"; Delete or Backspace on a focused badge
 * removes it too. Inside a BadgeGroup a removed badge fades out and its neighbours slide into the gap. When a
 * focused badge leaves, focus moves to the next badge, else the previous one, else the group.
 * An icon-only badge (no children) needs an `aria-label`. The ref goes to the root element.
 */
export const Badge = forwardRef(function Badge({
  children = "",
  tone = "neutral",
  surface = "soft",
  size = "md",
  shape = "pill",
  icon = "",
  dot = false,
  pulse = false,
  onRemove,
  removeLabel = "Remove",
  onClick,
  href,
  selected,
  disabled = false,
  maxWidth = 0,
  demo = false,
  forceState,
  className,
  style,
  ...rest
}, ref) {
  const sheetTag = useStyles("ts-bdg", CSS);
  const shows = hasContent(children) || !!icon || dot;
  if (!shows && demo) return <>{sheetTag}<BadgeDemo ref={ref} size={size} surface={surface} shape={shape} disabled={disabled} forceState={forceState} className={className} style={style} rest={rest} /></>;
  if (!shows) return null;
  return (
    <>{sheetTag}<BadgeView innerRef={ref} tone={tone} surface={surface} size={size} shape={shape} icon={icon} dot={dot} pulse={pulse} onRemove={onRemove} removeLabel={removeLabel}
      onClick={onClick} href={href} selected={selected} disabled={disabled} maxWidth={maxWidth} forceState={forceState} className={className} style={style} rest={rest}>
      {children}
    </BadgeView></>
  );
});

function BadgeView({ children, tone, surface, size, shape, icon, dot, pulse, onRemove, removeLabel, onClick, href, selected, disabled, maxWidth, forceState, className, style, rest, innerRef }) {
  const reduce = useReducedMotion();
  const sz = SIZE_SET.has(size) ? size : "md";
  const isOff = disabled || forceState === "disabled";
  const isSel = !!selected || forceState === "selected";
  const removable = typeof onRemove === "function";
  const pressable = !!href || typeof onClick === "function";
  const txt = textOf(children);
  const hasText = hasContent(children);
  const labelKey = txt ?? "node";
  const trunc = maxWidth > 0;

  const own = useRef(null);
  const setRef = useCallback((el) => { own.current = el; assign(innerRef, el); }, [innerRef]);
  const slot = useRef(null);

  // The width spring. Before paint: read the label's current width (mid-spring included), let it take the new
  // word's own width to measure it, then hold it at the old width and spring to the new one. At rest it is auto.
  const shown = useRef(labelKey);
  const run = useRef(null);
  const before = useRef(null);
  // the old width is read while rendering, before React swaps the words in the DOM (a layout effect is too late)
  if (shown.current !== labelKey && before.current === null && slot.current) before.current = parseFloat(getComputedStyle(slot.current).width) || 0;
  useIsoLayoutEffect(() => {
    if (shown.current === labelKey) return;
    shown.current = labelKey;
    const el = slot.current;
    const from = before.current;
    before.current = null;
    run.current?.stop();
    if (!el) return;
    if (reduce || from === null) { el.style.width = ""; return; }
    el.style.width = "";
    const to = parseFloat(getComputedStyle(el).width) || 0;
    if (Math.abs(to - from) < 0.5) return;
    el.style.width = from + "px";
    run.current = animate(from, to, { ...WIDTH_SPRING, onUpdate: (v) => { el.style.width = v + "px"; }, onComplete: () => { el.style.width = ""; } });
  }, [labelKey, reduce]);
  useEffect(() => () => run.current?.stop(), []);

  // focus never falls to <body> when a focused badge leaves (inside a BadgeGroup it stays mounted while it fades)
  const present = useIsPresent();
  useEffect(() => { if (!present) handOff(own.current); }, [present]);
  useIsoLayoutEffect(() => () => handOff(own.current), []);

  const remove = (e) => {
    if (isOff) return;
    e.stopPropagation();
    onRemove?.(e);
  };
  const { onKeyDown, title, "aria-label": ariaLabel, ...attrs } = rest;
  const keyDown = (e) => {
    onKeyDown?.(e);
    if (e.defaultPrevented || !removable || isOff) return;
    if (e.key === "Delete" || e.key === "Backspace") { e.preventDefault(); remove(e); }
  };
  const press = (e) => {
    if (isOff) { e.preventDefault(); return; }
    onClick?.(e);
  };

  const iconNode = typeof icon === "string" ? (icon ? <Icon name={icon} size={ICON_PX[sz]} stroke={2.1} /> : null) : icon;
  const iconOnly = !hasText && !!iconNode && !dot && !removable;

  const text = reduce ? (
    <span key={labelKey} className="ts-bdg__txt">{children}</span>
  ) : (
    <AnimatePresence initial={false} mode="popLayout">
      <motion.span key={labelKey} className="ts-bdg__txt" variants={ROLL} initial="enter" animate="center" exit="exit" transition={ROLL_SPRING}>{children}</motion.span>
    </AnimatePresence>
  );
  const inner = (
    <>
      {pressable && (
        <span className="ts-bdg__tick" aria-hidden>
          <svg viewBox="0 0 12 12"><path d="M2.6 6.3l2.3 2.3 4.6-4.9" pathLength="1" /></svg>
        </span>
      )}
      {dot && <span className={"ts-bdg__dot" + (pulse ? " is-pulse" : "")} aria-hidden />}
      {iconNode && <span className="ts-bdg__icon" aria-hidden>{iconNode}</span>}
      {hasText && <span ref={slot} className="ts-bdg__lab">{text}</span>}
    </>
  );

  const cls = "ts-bdg" + (isSel ? " is-selected" : "") + (pressable ? " is-press" : "") + (removable ? " has-x" : "") + (isOff ? " is-off" : "")
    + (iconOnly ? " is-icon" : "") + (txt && txt.length <= 2 && !dot && !iconNode && !removable && !pressable ? " is-short" : "") + (trunc ? " is-trunc" : "") + (className ? " " + className : "");
  const rootProps = {
    ref: setRef,
    className: cls,
    "data-tone": TONE_SET.has(tone) ? tone : "neutral",
    "data-surface": SURFACE_SET.has(surface) ? surface : "soft",
    "data-size": sz,
    "data-shape": shape === "rounded" ? "rounded" : "pill",
    "data-force": forceState && forceState !== "default" ? forceState : undefined,
    "data-reduce": reduce ? "" : undefined,
    title: title ?? (trunc && txt ? txt : undefined),
    style: trunc ? { maxWidth, ...style } : style,
    onKeyDown: removable ? keyDown : onKeyDown,
  };
  // a toggle only when the caller passes `selected` (true or false); a bare onClick is a plain button
  const pressedAttrs = href ? { "aria-current": isSel ? "true" : undefined } : { "aria-pressed": selected !== undefined || isSel ? isSel : undefined };

  if (removable) {
    const MainTag = pressable ? (href && !isOff ? "a" : href ? "span" : "button") : "span";
    const mainProps = pressable
      ? (MainTag === "button" ? { type: "button", disabled: isOff, onClick: press, ...pressedAttrs } : MainTag === "a" ? { href, onClick: press, ...pressedAttrs } : { "aria-disabled": true })
      : {};
    return (
      <span {...rootProps} {...attrs} aria-label={ariaLabel}>
        <MainTag className="ts-bdg__main" {...mainProps}>{inner}</MainTag>
        <button type="button" className="ts-bdg__x" aria-label={txt ? `${removeLabel} ${txt}` : removeLabel} disabled={isOff} onClick={remove}>
          <Icon name="x" size={X_PX[sz]} stroke={2.4} />
        </button>
      </span>
    );
  }
  if (href) {
    return (
      <a {...rootProps} {...attrs} aria-label={ariaLabel} href={isOff ? undefined : href} aria-disabled={isOff || undefined} onClick={press} {...pressedAttrs}>
        <span className="ts-bdg__main">{inner}</span>
      </a>
    );
  }
  if (pressable) {
    return (
      <button {...rootProps} type="button" {...attrs} aria-label={ariaLabel} disabled={isOff} onClick={press} {...pressedAttrs}>
        <span className="ts-bdg__main">{inner}</span>
      </button>
    );
  }
  return (
    <span {...rootProps} {...attrs} aria-label={ariaLabel}>
      <span className="ts-bdg__main">{inner}</span>
    </span>
  );
}

/**
 * BadgeGroup — a wrapping row of badges with a gap. It owns the motion of its children: a badge that is added fades
 * and scales in, one that is removed fades out where it stood while its neighbours slide into the gap (across rows
 * too). A caller mapping an array gets this for free; keys are the caller's. With `label` it is a named group
 * (role="group"), for a set of filters. It can take focus (tabIndex -1) so focus has somewhere to go when the
 * last focused badge is removed. Reduced motion: badges come and go at once, nothing slides.
 */
export const BadgeGroup = forwardRef(function BadgeGroup({
  children,
  gap = 6,
  wrap = true,
  label = "",
  className,
  style,
  ...rest
}, ref) {
  const sheetTag = useStyles("ts-bdg", CSS);
  const reduce = useReducedMotion();
  const items = Children.toArray(children).filter(isValidElement);
  return (
    <>{sheetTag}<div ref={ref} className={"ts-bdg-group" + (wrap ? "" : " is-nowrap") + (className ? " " + className : "")} role={label ? "group" : undefined} aria-label={label || undefined}
      tabIndex={-1} data-ts-bdg-group="" style={{ "--bdg-gg": (typeof gap === "number" ? gap + "px" : gap), ...style }} {...rest}>
      <AnimatePresence initial={false} mode={reduce ? "sync" : "popLayout"}>
        {items.map((child) => (
          <motion.div key={child.key} className="ts-bdg-group__item" layout={reduce ? false : "position"}
            initial={reduce ? { opacity: 1 } : { opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
            exit={reduce ? { opacity: 0, transition: { duration: 0 } } : { opacity: 0, scale: 0.8, transition: { ...ITEM_SPRING, opacity: { duration: 0.14 } } }}
            transition={ITEM_SPRING}>
            {child}
          </motion.div>
        ))}
      </AnimatePresence>
    </div></>
  );
});

// ── Sample content (demo only): one invented coffee roaster's order list ──────────────────────────────────────────
const FLOW = [["Roasting", "warning", true], ["Packed", "neutral", false], ["Shipped", "info", false], ["Delivered", "success", false]];
const FILTERS = ["Wholesale", "Whole bean", "Ships Monday"];

const BadgeDemo = forwardRef(function BadgeDemo({ size, surface, shape, disabled, forceState, className, style, rest }, ref) {
  const [step, setStep] = useState(0);
  const [filters, setFilters] = useState(FILTERS);
  const [due, setDue] = useState(true);
  const root = useRef(null);
  // the third order's status advances every few seconds, only while the card is on screen
  useEffect(() => {
    const el = root.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    let timer = null;
    const io = new IntersectionObserver(([e]) => {
      clearInterval(timer);
      if (e.isIntersecting) timer = setInterval(() => setStep((s) => (s + 1) % FLOW.length), 2800);
    });
    io.observe(el);
    return () => { io.disconnect(); clearInterval(timer); };
  }, []);
  const [word, tone, live] = FLOW[step];
  const forced = forceState && forceState !== "default" ? forceState : undefined;
  const common = { size, surface, shape, disabled: disabled || forced === "disabled" };
  return (
    <div ref={(el) => { root.current = el; assign(ref, el); }} className={"ts-bdg-demo" + (className ? " " + className : "")} style={style} {...rest}>
      <div className="ts-bdg-demo__head">
        <h3 className="ts-bdg-demo__title">Orders <Badge tone="accent" size="sm">3 new</Badge></h3>
        <Badge tone="success" size="sm" dot pulse>Live</Badge>
      </div>
      <BadgeGroup label="Filters">
        <Badge key="due" {...common} selected={forced ? false : due} onClick={() => setDue((d) => !d)} forceState={forced}>Due today</Badge>
        {filters.map((f) => (
          <Badge key={f} {...common} onRemove={() => setFilters((list) => list.filter((x) => x !== f))} removeLabel="Remove filter">{f}</Badge>
        ))}
        {filters.length === 0 && <button key="reset" type="button" className="ts-bdg-demo__reset" onClick={() => setFilters(FILTERS)}>Reset filters</button>}
      </BadgeGroup>
      <ul className="ts-bdg-demo__rows">
        <li className="ts-bdg-demo__row">
          <span className="ts-bdg-demo__id">{"#" + 1042}</span>
          <span className="ts-bdg-demo__what"><span className="ts-bdg-demo__name">Guji, washed</span><span className="ts-bdg-demo__meta">12 kg · whole bean</span></span>
          <Badge {...common} tone="success">Paid</Badge>
        </li>
        <li className="ts-bdg-demo__row">
          <span className="ts-bdg-demo__id">{"#" + 1043}</span>
          <span className="ts-bdg-demo__what"><span className="ts-bdg-demo__name">Huila decaf</span><span className="ts-bdg-demo__meta">6 kg · ground for filter</span></span>
          <Badge {...common} tone={tone} dot={live}>{word}</Badge>
        </li>
        <li className="ts-bdg-demo__row">
          <span className="ts-bdg-demo__id">{"#" + 1044}</span>
          <span className="ts-bdg-demo__what"><span className="ts-bdg-demo__name">House espresso</span><span className="ts-bdg-demo__meta">3 kg · whole bean</span></span>
          <Badge {...common} tone="neutral" shape="rounded" surface="outline">Gift</Badge>
          <Badge {...common} tone="neutral">Draft</Badge>
        </li>
      </ul>
    </div>
  );
});
