"use client";
import { Children, createContext, forwardRef, isValidElement, useCallback, useContext, useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import { motion, animate, useSpring, useTransform } from "motion/react";
import { registerStyles, useStyles, useIsoLayoutEffect, useReducedMotion, useLocale } from "../_shared/theme.jsx";
import { Icon } from "../_shared/icons.jsx";
import { Button } from "../button/index.jsx";
import { Switch } from "../switch/index.jsx";

// Layout notes:
// - The root is a size container (`ts-card`), so padding follows the card's own width, never the window's.
//   Padding lives on the parts (header, body, footer) because a container query cannot style the container itself.
// - A pressable card is one real <a> or <button> in the title whose ::after covers the whole card, under the
//   content. The content lets the pointer through (pointer-events: none) and every interactive thing inside it
//   takes the pointer back, so buttons and links in the card stay clickable above the card's own target.
// - Every selector that reads a root modifier goes through `>` so a card nested in a card's body is not affected.
const CSS = `
.ts-card{--card-r:var(--ts-radius-lg);--card-bg:var(--ts-surface);--card-ring:var(--ts-line);--card-tile:var(--ts-surface2);
  --p-wide:24px;--p-narrow:16px;--gap-wide:16px;--gap-narrow:12px;--fp-wide:16px;--fp-narrow:12px;--sg-wide:20px;--sg-narrow:16px;
  box-sizing:border-box;position:relative;isolation:isolate;display:flex;flex-direction:column;width:100%;min-width:0;
  container:ts-card / inline-size;border-radius:var(--card-r);background:var(--card-bg);color:var(--ts-ink);
  font-family:var(--ts-font);font-size:14px;line-height:1.5;text-align:start;-webkit-tap-highlight-color:transparent}
.ts-card *,.ts-card *::before,.ts-card *::after{box-sizing:border-box}
.ts-card::before{content:"";position:absolute;inset:0;z-index:3;border-radius:inherit;pointer-events:none;
  box-shadow:inset 0 0 0 1px var(--card-ring);transition:box-shadow .2s ease}
.ts-card--outline{--card-bg:transparent}
.ts-card--sunken{--card-bg:var(--ts-surface2);--card-ring:transparent;--card-tile:var(--ts-surface)}
.ts-card--plain{--card-bg:transparent;--card-ring:transparent;--p-wide:0px;--p-narrow:0px}
.ts-card.is-accent:not(.ts-card--plain){--card-ring:color-mix(in srgb,var(--ts-accent) 38%,var(--ts-line))}
.ts-card.is-compact{--p-wide:16px;--p-narrow:12px;--gap-wide:12px;--gap-narrow:10px;--fp-wide:12px;--fp-narrow:10px;--sg-wide:14px;--sg-narrow:12px}
.ts-card.is-compact.ts-card--plain{--p-wide:0px;--p-narrow:0px}
/* a card inside a card: the next radius down and the compact rhythm, so the inner corners sit concentric */
.ts-card .ts-card{--card-r:var(--ts-radius-md)}
.ts-card .ts-card:not(.ts-card--plain){--p-wide:16px;--p-narrow:12px;--gap-wide:12px;--gap-narrow:10px;--fp-wide:12px;--fp-narrow:10px;--sg-wide:14px;--sg-narrow:12px}

.ts-card__frame{display:flex;flex-direction:column;flex:1 1 auto;min-width:0;
  --p:var(--p-wide);--gap:var(--gap-wide);--fp:var(--fp-wide);--sg:var(--sg-wide)}
.ts-card__main{display:flex;flex-direction:column;flex:1 1 auto;min-width:0}
@container ts-card (max-width:440px){.ts-card__frame{--p:var(--p-narrow);--gap:var(--gap-narrow);--fp:var(--fp-narrow);--sg:var(--sg-narrow)}}

.ts-card__media{position:relative;flex:none;overflow:hidden;aspect-ratio:var(--card-ratio,auto);border-radius:var(--card-r) var(--card-r) 0 0;background:var(--ts-surface2)}
.ts-card__media > :is(img,video,picture,svg,canvas,iframe){display:block;width:100%;height:100%;object-fit:cover;border:0}
.ts-card__media > picture > img{display:block;width:100%;height:100%;object-fit:cover}
.ts-card.is-side > .ts-card__frame{flex-direction:row}
.ts-card.is-side > .ts-card__frame > .ts-card__media{flex:0 0 38%;max-width:320px;min-height:160px;aspect-ratio:auto;border-radius:var(--card-r) 0 0 var(--card-r)}
@container ts-card (max-width:480px){
  .ts-card.is-side > .ts-card__frame{flex-direction:column}
  .ts-card.is-side > .ts-card__frame > .ts-card__media{flex:none;max-width:none;min-height:0;aspect-ratio:var(--card-ratio,16/9);border-radius:var(--card-r) var(--card-r) 0 0}
}

.ts-card__head{display:flex;align-items:center;gap:14px;min-width:0;padding:var(--p) var(--p) 0}
.ts-card__main > .ts-card__head:last-child,.ts-card__head.is-toggle{padding-bottom:var(--p)}
.ts-card__head + .ts-card__foot{margin-top:var(--p)}
.ts-card__icon{display:grid;place-items:center;flex:none;width:36px;height:36px;border-radius:var(--ts-radius-sm);background:var(--card-tile);color:var(--ts-ink)}
.ts-card.is-accent > .ts-card__frame .ts-card__icon{background:color-mix(in srgb,var(--ts-accent) 14%,var(--card-tile));color:color-mix(in srgb,var(--ts-accent) 70%,var(--ts-ink))}
.ts-card__mid{display:flex;flex-wrap:wrap;align-items:center;gap:12px 16px;flex:1 1 auto;min-width:0}
.ts-card__text{display:flex;flex-direction:column;gap:2px;flex:1 1 14rem;min-width:0}
.ts-card__eyebrow{margin-bottom:2px;font-family:var(--ts-font-mono);font-size:11px;line-height:16px;letter-spacing:.14em;text-transform:uppercase;color:var(--ts-ink2)}
.ts-card__title{margin:0;font-size:16px;line-height:1.3;font-weight:620;letter-spacing:-0.012em;color:var(--ts-ink);overflow-wrap:anywhere}
.ts-card__desc{margin:0;font-size:14px;line-height:1.45;color:var(--ts-ink2);overflow-wrap:anywhere}
.ts-card__actions{display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin-left:auto;min-width:0}
.ts-card__end{position:relative;display:grid;place-items:center;flex:none;width:28px;height:28px;border-radius:999px;color:var(--ts-ink2);transition:background-color .2s,color .2s}
.ts-card__check{display:grid;place-items:center;width:22px;height:22px;border-radius:999px;background:var(--ts-accent);color:var(--ts-accent-ink)}
@container ts-card (max-width:440px){.ts-card__actions{flex-basis:100%;margin-left:0}.ts-card__head:has(> .ts-card__mid > .ts-card__actions){align-items:flex-start}}
.ts-card.is-compact > .ts-card__frame .ts-card__head{gap:12px}
.ts-card.is-compact > .ts-card__frame .ts-card__title{font-size:15px}
.ts-card.is-compact > .ts-card__frame .ts-card__desc{font-size:13px}
.ts-card.is-compact > .ts-card__frame .ts-card__icon{width:32px;height:32px}

.ts-card__body{flex:1 1 auto;min-width:0;padding:var(--gap) var(--p) var(--p);--bleed:var(--p)}
.ts-card__main > .ts-card__body:first-child,.ts-card__fold-in > .ts-card__body:first-child{padding-top:var(--p)}
.ts-card__head.is-toggle + .ts-card__fold .ts-card__fold-in > .ts-card__body:first-child{padding-top:0}
.ts-card__body.is-flush{padding:var(--gap) 0 0;--bleed:0px;overflow:hidden}
.ts-card__main > .ts-card__body.is-flush:first-child{padding-top:0;border-radius:var(--card-r) var(--card-r) 0 0}
.ts-card__body.is-flush:last-child{border-radius:0 0 var(--card-r) var(--card-r)}
.ts-card__body.is-flush:first-child:last-child{border-radius:var(--card-r)}
.ts-card.is-side > .ts-card__frame > .ts-card__main > .ts-card__body.is-flush{border-radius:0}
.ts-card__body > :first-child{margin-top:0}
.ts-card__body > :last-child{margin-bottom:0}

.ts-card__section{display:flex;flex-direction:column;gap:12px;min-width:0;margin-inline:calc(-1 * var(--bleed,0px));padding-inline:var(--bleed,0px)}
.ts-card__section + .ts-card__section{margin-top:var(--sg,20px);padding-top:var(--sg,20px);border-top:1px solid var(--ts-line)}
.ts-card__section-head{display:flex;flex-wrap:wrap;align-items:center;gap:8px 16px;min-width:0}
.ts-card__section-text{display:flex;flex-direction:column;gap:2px;flex:1 1 12rem;min-width:0}
.ts-card__section-title{margin:0;font-size:14px;line-height:1.35;font-weight:600;color:var(--ts-ink)}
.ts-card__section-desc{margin:0;font-size:13px;line-height:1.45;color:var(--ts-ink2)}
.ts-card__section-actions{display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin-left:auto}
.ts-card__section-head:only-child{min-height:28px}

.ts-card__foot{display:flex;flex-wrap:wrap;align-items:center;justify-content:flex-end;gap:8px 12px;min-width:0;padding:var(--fp) var(--p);border-top:1px solid var(--ts-line)}
.ts-card__foot.is-start{justify-content:flex-start}
.ts-card__foot.is-between{justify-content:space-between}
.ts-card__main > .ts-card__foot:first-child{border-top:0}
/* plain: no padding of its own, but the body still keeps its distance from a footer's hairline */
.ts-card--plain > .ts-card__frame > .ts-card__main > .ts-card__body:not(:last-child),
.ts-card--plain > .ts-card__frame > .ts-card__main > .ts-card__fold > .ts-card__fold-in > .ts-card__body:not(:last-child){padding-bottom:var(--gap)}
.ts-card--plain > .ts-card__frame > .ts-card__main > .ts-card__foot,
.ts-card--plain > .ts-card__frame > .ts-card__main > .ts-card__fold > .ts-card__fold-in > .ts-card__foot{padding:var(--fp) 0 0}
.ts-card--plain > .ts-card__frame > .ts-card__main > .ts-card__head + .ts-card__foot{margin-top:var(--gap)}

.ts-card__fold{min-width:0}
.ts-card__fold-in{display:flow-root}

/* pressable: one target over the whole card */
.ts-card__hit{all:unset;cursor:pointer;pointer-events:auto;color:inherit;border-radius:2px}
.ts-card__hit::after{content:"";position:absolute;inset:0;z-index:-1;border-radius:var(--card-r)}
.ts-card__hit:empty{display:block;width:0;height:0}
/* the ring is drawn by the target's own cover, which spans the card, so it sits on the control that has focus */
.ts-card__hit:focus-visible::after{outline:2px solid var(--ts-focus);outline-offset:3px}
.ts-card.is-pressable > .ts-card__frame{pointer-events:none}
.ts-card.is-pressable > .ts-card__frame :is(a[href],button,input,select,textarea,label,summary,video[controls],audio,iframe,[tabindex],[role=button],[role=link],[role=switch],[role=checkbox],[role=menuitem],[role=tab],[contenteditable=true],[contenteditable=""]){pointer-events:auto}
.ts-card.is-pressable{cursor:pointer}
.ts-card.is-pressable.is-disabled{cursor:not-allowed}
.ts-card.is-pressable.is-disabled .ts-card__hit{cursor:not-allowed}
.ts-card__lift{position:absolute;inset:0;z-index:-1;border-radius:inherit;pointer-events:none;opacity:0;
  box-shadow:0 1px 2px color-mix(in srgb,var(--ts-black) 6%,transparent),0 14px 30px -14px color-mix(in srgb,var(--ts-black) 30%,transparent)}
[data-ts-mode=dark] .ts-card__lift{box-shadow:0 1px 2px color-mix(in srgb,var(--ts-black) 40%,transparent),0 18px 36px -14px color-mix(in srgb,var(--ts-black) 75%,transparent)}
@media (hover:hover){
  .ts-card.is-pressable:not(.is-disabled):not(.is-selected):hover::before{box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--ts-ink) 20%,transparent)}
  .ts-card.is-pressable:not(.is-disabled):hover > .ts-card__frame .ts-card__end{color:var(--ts-ink)}
  .ts-card.is-pressable:not(.is-disabled):hover > .ts-card__frame > .ts-card__media > :first-child{transform:scale(1.025)}
  .ts-card__head.is-toggle:not(.is-disabled):hover .ts-card__end{background:var(--ts-surface2);color:var(--ts-ink)}
}
.ts-card.is-pressable:not(.is-selected)[data-force=hover]::before{box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--ts-ink) 20%,transparent)}
.ts-card.is-pressable[data-force=hover] > .ts-card__frame .ts-card__end{color:var(--ts-ink)}
.ts-card.is-pressable > .ts-card__frame > .ts-card__media > :first-child{transition:transform .6s cubic-bezier(.2,.8,.2,1)}
.ts-card.is-selected::before{box-shadow:inset 0 0 0 2px var(--ts-accent)}
.ts-card.is-focus{outline:2px solid var(--ts-focus);outline-offset:3px}
.ts-card.is-disabled{opacity:.5}

/* collapsible: the header is one button */
.ts-card__head.is-toggle{position:relative;isolation:isolate;cursor:pointer;border-radius:var(--card-r)}
.ts-card__head.is-toggle > *{pointer-events:none}
.ts-card__head.is-toggle :is(a[href],button,input,select,textarea,label,summary,[tabindex],[role=button],[role=link],[role=switch]){pointer-events:auto}
.ts-card__toggle{all:unset;cursor:pointer;pointer-events:auto;color:inherit;border-radius:2px}
.ts-card__toggle::after{content:"";position:absolute;inset:0;z-index:-1;border-radius:inherit}
.ts-card__toggle:empty{display:block;width:0;height:0}
.ts-card__head.is-toggle.is-focus{outline:2px solid var(--ts-focus);outline-offset:-4px}
.ts-card__head.is-toggle.is-disabled{cursor:not-allowed}
.ts-card__head.is-toggle.is-disabled .ts-card__toggle{cursor:not-allowed}

/* loading: bars in the body, in the kit's skeleton look */
.ts-card__sk{display:flex;flex-direction:column;gap:10px;padding-block:2px}
.ts-card__sk-bar{display:block;height:12px;border-radius:var(--ts-radius-sm);
  --sk-base:color-mix(in srgb,var(--ts-surface2) 90%,var(--ts-ink));--sk-hi:color-mix(in srgb,var(--ts-surface2) 78%,var(--ts-ink));
  background:linear-gradient(100deg,var(--sk-base) 30%,var(--sk-hi) 50%,var(--sk-base) 70%) var(--sk-base);
  background-size:200vw 100%;background-attachment:fixed;animation:ts-card-wave 1.6s linear infinite}
.ts-card--sunken > .ts-card__frame .ts-card__sk-bar{--sk-base:color-mix(in srgb,var(--ts-surface2) 84%,var(--ts-ink));--sk-hi:color-mix(in srgb,var(--ts-surface2) 72%,var(--ts-ink))}
@keyframes ts-card-wave{from{background-position:100vw 0}to{background-position:-100vw 0}}
@keyframes ts-card-pulse{0%,100%{opacity:1}50%{opacity:.6}}

@media (pointer:coarse){
  .ts-card__head.is-toggle{min-height:56px}
  .ts-card__end{width:32px;height:32px}
}
@media (prefers-reduced-motion:reduce){
  .ts-card::before,.ts-card__end{transition:none}
  .ts-card.is-pressable > .ts-card__frame > .ts-card__media > :first-child{transition:none;transform:none !important}
  .ts-card__sk-bar{animation:ts-card-pulse 2s ease-in-out infinite;background:var(--sk-base)}
}
@media print{.ts-card__part{opacity:1 !important;transform:none !important}}

/* the sample workspace column */
.ts-card-demo{display:flex;flex-direction:column;gap:16px;width:100%;max-width:520px}
.ts-card-demo__field{display:flex;align-items:center;gap:10px;min-height:44px;padding:0 14px;border-radius:var(--ts-radius-md);background:var(--ts-surface2);box-shadow:inset 0 0 0 1px var(--ts-line)}
.ts-card-demo__field input{all:unset;display:block;align-self:stretch;flex:1;min-width:0;min-height:44px;font-size:15px;color:var(--ts-ink)}
.ts-card-demo__field:focus-within{box-shadow:inset 0 0 0 1.5px var(--ts-focus),0 0 0 4px color-mix(in srgb,var(--ts-focus) 16%,transparent)}
.ts-card-demo__suffix{font-family:var(--ts-font-mono);font-size:12px;color:var(--ts-ink2)}
.ts-card-demo__note{margin:0;font-size:13px;color:var(--ts-ink2)}
.ts-card-demo__list{margin:0;padding:0;list-style:none;display:flex;flex-direction:column;gap:8px;font-size:14px;color:var(--ts-ink2)}
.ts-card-demo__list b{color:var(--ts-ink);font-weight:600;font-variant-numeric:tabular-nums}
.ts-card-demo__num{font-variant-numeric:tabular-nums;white-space:nowrap}
@media (max-width:640px),(pointer:coarse){.ts-card-demo__field input{font-size:16px}}
`;
registerStyles("ts-card", CSS);

const CardContext = createContext(null);
const useCard = () => useContext(CardContext);

const FOLD_SPRING = { type: "spring", stiffness: 380, damping: 38, mass: 0.9 };
const TURN_SPRING = { type: "spring", stiffness: 420, damping: 30 };
const LIFT_PX = 3;
// true only in the render that hydrates server HTML: the arrival is skipped there, the content is already painted
const never = () => () => {};
const no = () => false;
const yes = () => true;
const useHydrating = () => useSyncExternalStore(never, no, yes);

const ICON = (icon, size) => (typeof icon === "string" ? <Icon name={icon} size={size} /> : icon);

/** The header row: icon tile, eyebrow, title, description, actions, and the card's end mark (arrow, check or chevron). */
export const CardHeader = forwardRef(function CardHeader({
  title,
  description,
  eyebrow,
  icon,
  actions,
  titleAs = "h3",
  children,
  className,
  style,
  ...rest
}, ref) {
  const sheetTag = useStyles("ts-card", CSS);
  const card = useCard();
  const part = card?.part;
  const setRef = useCallback((el) => { part?.(el); if (typeof ref === "function") ref(el); else if (ref) ref.current = el; }, [ref, part]);
  const ownTitle = useId();
  const ownDesc = useId();
  const titleId = card?.titleId ?? ownTitle;
  const descId = card?.descId ?? ownDesc;
  const press = card?.press;
  const fold = card?.fold;
  const Title = titleAs || "h3";
  const label = card?.ariaLabel;

  let target = title;
  if (press) {
    const common = {
      className: "ts-card__hit",
      "aria-describedby": description ? descId : undefined,
      "aria-label": title ? undefined : label,
      onFocus: press.onFocus, onBlur: press.onBlur, onKeyDown: press.onKeyDown, onKeyUp: press.onKeyUp, onClick: press.onClick,
    };
    target = press.kind === "link" ? (
      <a {...common} href={press.disabled ? undefined : press.href} target={press.target} rel={press.rel}
        role={press.disabled ? "link" : undefined} aria-disabled={press.disabled || undefined} aria-current={press.selected ? "true" : undefined}>{title}</a>
    ) : (
      <button {...common} type="button" disabled={press.disabled} aria-pressed={press.selectable ? !!press.selected : undefined}>{title}</button>
    );
  } else if (fold) {
    target = (
      <button type="button" className="ts-card__toggle" aria-expanded={fold.open} aria-controls={fold.bodyId} disabled={fold.disabled}
        aria-describedby={description ? descId : undefined} aria-label={title ? undefined : label}
        onClick={fold.onToggle} onFocus={fold.onFocus} onBlur={fold.onBlur}>{title}</button>
    );
  }

  const hasText = !!(eyebrow || title || description);
  return (
    <>{sheetTag}<div ref={setRef} className={"ts-card__head ts-card__part" + (fold ? " is-toggle" : "") + (fold?.focus ? " is-focus" : "") + (fold?.disabled ? " is-disabled" : "") + (className ? " " + className : "")}
      data-still={press ? "" : undefined} style={style} {...rest}>
      {icon && <span className="ts-card__icon" aria-hidden>{ICON(icon, 18)}</span>}
      {(hasText || actions) && (
        <div className="ts-card__mid">
          {hasText && (
            <div className="ts-card__text">
              {eyebrow && <span className="ts-card__eyebrow">{eyebrow}</span>}
              {title ? <Title id={titleId} className="ts-card__title">{target}</Title> : (press || fold) ? target : null}
              {description && <p id={descId} className="ts-card__desc">{description}</p>}
            </div>
          )}
          {!hasText && (press || fold) && target}
          {actions && <div className="ts-card__actions">{actions}</div>}
        </div>
      )}
      {!hasText && !actions && (press || fold) && target}
      {children}
      {card?.end}
    </div></>
  );
});

/** The body. `flush` drops its side and bottom padding so a table or a list runs edge to edge. */
export const CardBody = forwardRef(function CardBody({
  flush = false,
  children,
  className,
  style,
  ...rest
}, ref) {
  const sheetTag = useStyles("ts-card", CSS);
  const card = useCard();
  const part = card?.part;
  const setRef = useCallback((el) => { part?.(el); if (typeof ref === "function") ref(el); else if (ref) ref.current = el; }, [ref, part]);
  const loading = card?.loading;
  return (
    <>{sheetTag}<div ref={setRef} className={"ts-card__body ts-card__part" + ((flush || card?.flush) && !loading ? " is-flush" : "") + (className ? " " + className : "")} style={style} {...rest}>
      {loading ? (
        <div className="ts-card__sk" role="status">
          <span className="ts-sr">{card.loadingLabel}</span>
          <span className="ts-card__sk-bar" style={{ width: "100%" }} aria-hidden />
          <span className="ts-card__sk-bar" style={{ width: "86%" }} aria-hidden />
          <span className="ts-card__sk-bar" style={{ width: "58%" }} aria-hidden />
        </div>
      ) : children}
    </div></>
  );
});

/** The footer bar, with a hairline above it. `align`: "end" (default), "start" or "between". */
export const CardFooter = forwardRef(function CardFooter({
  align = "end",
  children,
  className,
  style,
  ...rest
}, ref) {
  const sheetTag = useStyles("ts-card", CSS);
  const card = useCard();
  const part = card?.part;
  const setRef = useCallback((el) => { part?.(el); if (typeof ref === "function") ref(el); else if (ref) ref.current = el; }, [ref, part]);
  return (
    <>{sheetTag}<div ref={setRef} className={"ts-card__foot ts-card__part" + (align === "start" ? " is-start" : align === "between" ? " is-between" : "") + (className ? " " + className : "")} style={style} {...rest}>
      {children}
    </div></>
  );
});

/** A slice of the body with its own optional title, description and actions, and a rule between it and the next. */
export const CardSection = forwardRef(function CardSection({
  title,
  description,
  actions,
  titleAs = "h4",
  children,
  className,
  style,
  ...rest
}, ref) {
  const sheetTag = useStyles("ts-card", CSS);
  const id = useId();
  const Title = titleAs || "h4";
  const head = title || description || actions;
  return (
    <>{sheetTag}<div ref={ref} role={title ? "group" : undefined} aria-labelledby={title ? id : undefined} className={"ts-card__section" + (className ? " " + className : "")} style={style} {...rest}>
      {head && (
        <div className="ts-card__section-head">
          {(title || description) && (
            <div className="ts-card__section-text">
              {title && <Title id={id} className="ts-card__section-title">{title}</Title>}
              {description && <p className="ts-card__section-desc">{description}</p>}
            </div>
          )}
          {actions && <div className="ts-card__section-actions">{actions}</div>}
        </div>
      )}
      {children}
    </div></>
  );
});

/** Folding body: height springs to the measured content (and follows it while open); the content fades in a beat later. */
function Fold({ open, id, reduce, children }) {
  const outer = useRef(null);
  const inner = useRef(null);
  const [h, setH] = useState(null);
  const [moving, setMoving] = useState(false);
  const [was, setWas] = useState(open);
  if (was !== open) { setWas(open); if (!reduce) setMoving(true); }
  const first = useRef(true);
  useIsoLayoutEffect(() => {
    const el = inner.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => setH(el.offsetHeight));
    ro.observe(el);
    setH(el.offsetHeight);
    return () => ro.disconnect();
  }, []);
  useEffect(() => { if (h != null) first.current = false; }, [h]);
  useEffect(() => { if (outer.current) outer.current.inert = !open; }, [open]);
  const instant = reduce || first.current;
  return (
    <motion.div ref={outer} id={id} className="ts-card__fold" aria-hidden={!open || undefined} initial={false}
      animate={{ height: open ? (h ?? "auto") : 0 }}
      transition={instant ? { duration: 0 } : FOLD_SPRING}
      onAnimationStart={() => { if (!instant) setMoving(true); }}
      onAnimationComplete={() => setMoving(false)}
      style={{ overflow: open && !moving ? "visible" : "hidden", visibility: !open && !moving ? "hidden" : undefined }}>
      <motion.div ref={inner} className="ts-card__fold-in" initial={false} animate={{ opacity: open ? 1 : 0 }}
        transition={open ? { duration: reduce ? 0.12 : 0.22, delay: instant ? 0 : 0.07 } : { duration: reduce ? 0 : 0.12 }}>
        {children}
      </motion.div>
    </motion.div>
  );
}

const PARTS = new Set([CardHeader, CardBody, CardFooter]);

/**
 * Card — the general surface: a titled block of anything (a settings block, an order summary, a sign-in panel).
 * Common cards are all props: title, description, eyebrow, icon, actions, media, children (the body) and footer.
 * Richer ones pass CardHeader / CardBody / CardFooter / CardSection as children (the same parts Card uses).
 * Signature:
 *  1. With href or onClick the whole card is one real <a> or <button> (the title is its text). Inner buttons and
 *     links stay clickable above it. It lifts a few pixels on hover and gives under the press on springs driven
 *     by the pointer, and its arrow nudges forward. `selected` draws the chosen state.
 *  2. `collapsible`: the header is a button; the body's height springs open and shut and its content fades in a
 *     beat later. Folded, the body is inert. Interruptible: it ends where the last press says.
 *  3. On first view the parts settle in with a short stagger (under 400ms), once; skipped when the card mounts
 *     already scrolled past, when it was rendered on the server, and under reduced motion.
 * Reduced motion: no lift, no press travel, no stagger; the fold swaps without the height spring.
 * The ref goes to the root element.
 */
export const Card = forwardRef(function Card({
  title = "",
  description = "",
  eyebrow = "",
  icon,
  actions,
  media,
  mediaRatio,
  layout = "stack",
  children,
  footer,
  footerAlign = "end",
  surface = "card",
  tone = "neutral",
  density = "comfortable",
  flush = false,
  href,
  target,
  rel,
  onClick,
  selected,
  collapsible = false,
  open: openProp,
  defaultOpen = true,
  onOpenChange,
  loading = false,
  loadingLabel = "Loading",
  disabled = false,
  appear = true,
  as: asProp,
  titleAs = "h3",
  maxWidth = 0,
  fullWidth = false,
  demo = false,
  forceState,
  className,
  style,
  ...rest
}, ref) {
  const sheetTag = useStyles("ts-card", CSS);
  const reduce = useReducedMotion();
  const locale = useLocale();
  const hydrating = useHydrating();
  const fromServer = useRef(hydrating).current;
  const uid = useId();
  const titleId = uid + "t";
  const descId = uid + "d";
  const bodyId = uid + "b";

  const isLoading = loading || forceState === "loading";
  const isSelected = !!selected || forceState === "selected";
  const [openState, setOpenState] = useState(defaultOpen);
  const controlled = openProp !== undefined;
  const open = forceState === "open" ? true : controlled ? !!openProp : openState;
  const pressable = !collapsible && !!(href || onClick);
  const [focusVis, setFocusVis] = useState(false);
  const focused = focusVis || forceState === "focus";

  const root = useRef(null);
  const setRef = useCallback((el) => { root.current = el; if (typeof ref === "function") ref(el); else if (ref) ref.current = el; }, [ref]);

  // parts register themselves so the arrival can find them, in the props form and the parts form alike
  const parts = useRef(new Set());
  const part = useCallback((el) => { if (el) parts.current.add(el); }, []);

  // ── 1. pressable: lift on hover and give under the press, on springs driven by the pointer ──
  const lift = useSpring(0, { stiffness: 420, damping: 30, mass: 0.7 });
  const press = useSpring(0, { stiffness: 700, damping: 40 });
  const depth = useRef(0.012);
  const y = useTransform([lift, press], ([l, p]) => -LIFT_PX * l * (1 - p) + 0.5 * p);
  const scale = useTransform(press, (p) => 1 - depth.current * p);
  const shade = useTransform([lift, press], ([l, p]) => Math.max(0, l * (1 - 0.7 * p)));
  const nudge = useTransform([lift, press], ([l, p]) => 3 * l - 1.5 * p);
  const moving = pressable && !reduce;            // the root carries the lift and press transforms
  const live = moving && !disabled;               // and the pointer drives them
  useEffect(() => {
    if (!moving) return;
    if (live && forceState === "hover") lift.jump(1);
    else if (!live || forceState !== undefined) { lift.jump(0); press.jump(0); }
  }, [forceState, moving, live, lift, press]);
  // aria-pressed only on a card that is used as a toggle: the caller passes `selected` (true or false), or it has been selected once
  const toggles = useRef(false);
  if (isSelected || selected !== undefined) toggles.current = true;
  const release = useCallback(() => press.set(0), [press]);
  useEffect(() => {
    if (!live) return;
    addEventListener("pointerup", release);
    addEventListener("pointercancel", release);
    return () => { removeEventListener("pointerup", release); removeEventListener("pointercancel", release); };
  }, [live, release]);
  const pressDown = () => {
    // the same few pixels of give on any card width: a large card scales less than a small one
    const w = root.current?.offsetWidth || 400;
    depth.current = Math.min(0.02, 5 / w);
    press.set(1);
  };
  const { onPointerEnter, onPointerLeave, onPointerDown, ...attrs } = rest;
  const pointer = live ? {
    onPointerEnter: (e) => { onPointerEnter?.(e); if (e.pointerType !== "touch") lift.set(1); },
    onPointerLeave: (e) => { onPointerLeave?.(e); lift.set(0); press.set(0); },
    onPointerDown: (e) => { onPointerDown?.(e); if (e.button === 0 && e.target.closest?.(".ts-card__hit")) pressDown(); },
  } : { onPointerEnter, onPointerLeave, onPointerDown };
  const pulse = useRef(null);
  useEffect(() => () => clearTimeout(pulse.current), []);
  const linkRel = rel ?? (target === "_blank" ? "noopener noreferrer" : undefined);
  const pressCtx = pressable ? {
    kind: href ? "link" : "button",
    href, target, rel: linkRel, disabled, selected: isSelected, selectable: !href && toggles.current,
    onClick: (e) => { if (disabled) { e.preventDefault(); return; } onClick?.(e); },
    onFocus: (e) => setFocusVis(e.currentTarget.matches?.(":focus-visible") ?? true),
    onBlur: () => setFocusVis(false),
    onKeyDown: (e) => {
      if (!live) return;
      if (e.key === " " && !href) pressDown();
      else if (e.key === "Enter" && !e.repeat) { pressDown(); clearTimeout(pulse.current); pulse.current = setTimeout(release, 140); }
    },
    onKeyUp: (e) => { if (e.key === " ") release(); },
  } : null;

  // ── 2. collapsible ──
  const setOpen = (v, e) => { if (!controlled) setOpenState(v); onOpenChange?.(v, e); };
  const foldCtx = collapsible ? {
    open, bodyId, disabled, focus: focused,
    onToggle: (e) => { if (!disabled) setOpen(!open, e); },
    onFocus: (e) => setFocusVis(e.currentTarget.matches?.(":focus-visible") ?? true),
    onBlur: () => setFocusVis(false),
  } : null;

  // ── 3. arrival: once, on first view ──
  useIsoLayoutEffect(() => {
    const el = root.current;
    if (!appear || reduce || fromServer || !el || demo) return;
    const list = [...parts.current].filter((p) => p.isConnected && el.contains(p) && !p.closest("[aria-hidden=true]"))
      .sort((a, b) => (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1));
    if (!list.length) return;
    const r = el.getBoundingClientRect();
    if (r.bottom <= 0) return;   // mounted already scrolled past: no arrival
    const runs = [];
    let io = null;
    const clear = (p) => { p.style.opacity = ""; p.style.transform = ""; };
    list.forEach((p) => { p.style.opacity = "0"; if (!p.hasAttribute("data-still")) p.style.transform = "translateY(8px)"; });
    const play = () => list.forEach((p, i) => {
      const still = p.hasAttribute("data-still");
      const run = animate(p, still ? { opacity: [0, 1] } : { opacity: [0, 1], y: [8, 0] }, { duration: 0.26, delay: i * 0.04, ease: [0.2, 0.8, 0.2, 1] });
      runs.push(run);
      run.then(() => requestAnimationFrame(() => clear(p)));   // after Motion's last write of the frame
    });
    if (r.top < innerHeight) play();
    else if (typeof IntersectionObserver === "function") {
      io = new IntersectionObserver((es) => { if (es.some((x) => x.isIntersecting)) { io.disconnect(); play(); } }, { threshold: 0.05 });
      io.observe(el);
    } else list.forEach(clear);
    return () => { io?.disconnect(); runs.forEach((x) => x.stop()); list.forEach(clear); };
  }, []);

  // the end mark: arrow (or external, or a check when selected) on a pressable card; a turning chevron when it folds
  let end = null;
  if (pressable) {
    end = (
      <span className="ts-card__end" aria-hidden>
        {isSelected ? (
          <motion.span key="ok" className="ts-card__check" initial={reduce ? false : { scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 520, damping: 26 }}>
            <Icon name="check" size={13} stroke={2.6} />
          </motion.span>
        ) : (
          <motion.span key="go" style={live ? { x: nudge, display: "grid" } : { display: "grid" }}>
            <Icon name={target === "_blank" ? "external" : "arrowRight"} size={16} stroke={1.9} />
          </motion.span>
        )}
      </span>
    );
  } else if (collapsible) {
    end = (
      <span className="ts-card__end" aria-hidden>
        <motion.span style={{ display: "grid" }} initial={false} animate={{ rotate: open ? 180 : 0 }} transition={reduce ? { duration: 0 } : TURN_SPRING}>
          <Icon name="chevronDown" size={16} stroke={2} />
        </motion.span>
      </span>
    );
  }

  const ctx = { titleId, descId, part, end, loading: isLoading, loadingLabel, flush, press: pressCtx, fold: foldCtx, ariaLabel: attrs["aria-label"] };

  if (demo) return <>{sheetTag}<DemoColumn ref={setRef} locale={locale} props={{ title, description, eyebrow, surface, tone, density, footerAlign, flush, selected: isSelected, loading: isLoading, disabled, forceState, open: forceState === "open" ? true : openProp }} className={className} style={style} attrs={attrs} /></>;

  // the props form, or the parts form when CardHeader / CardBody / CardFooter come as children
  const kids = Children.toArray(children);
  const partsForm = kids.some((k) => isValidElement(k) && PARTS.has(k.type));
  const hasHeaderProps = !!(title || description || eyebrow || icon || actions);
  let head = null, rest2 = [], headTitle = null;
  if (partsForm) {
    const heads = kids.filter((k) => isValidElement(k) && k.type === CardHeader);
    headTitle = heads[0]?.props.title;
    head = heads.length ? heads : (pressable || collapsible) ? <CardHeader /> : null;
    rest2 = kids.filter((k) => !(isValidElement(k) && k.type === CardHeader));
  } else {
    head = hasHeaderProps || pressable || collapsible ? <CardHeader title={title} description={description} eyebrow={eyebrow} icon={icon} actions={actions} titleAs={titleAs} /> : null;
    if (children !== undefined && children !== null && children !== false || isLoading) rest2.push(<CardBody key="b">{children}</CardBody>);
    if (footer) rest2.push(<CardFooter key="f" align={footerAlign}>{footer}</CardFooter>);
  }

  const named = title || headTitle;
  const Tag = asProp || (named ? "section" : "div");
  const Root = pressable ? motion[Tag] : Tag;
  const cap = fullWidth ? undefined : typeof maxWidth === "number" ? (maxWidth > 0 ? maxWidth : undefined) : maxWidth || undefined;
  const cls = "ts-card ts-card--" + (["card", "outline", "plain", "sunken"].includes(surface) ? surface : "card")
    + (tone === "accent" ? " is-accent" : "") + (density === "compact" ? " is-compact" : "") + (layout === "side" && media ? " is-side" : "")
    + (pressable ? " is-pressable" : "") + (isSelected ? " is-selected" : "") + (disabled ? " is-disabled" : "")
    + (focused && pressable ? " is-focus" : "") + (className ? " " + className : "");
  const rootStyle = { ...(cap !== undefined ? { maxWidth: cap } : null), ...(moving ? { y, scale } : null), ...style };

  return (
    <>{sheetTag}<CardContext.Provider value={ctx}>
      <Root ref={setRef} className={cls} style={rootStyle} aria-labelledby={named && !attrs["aria-labelledby"] && !attrs["aria-label"] ? titleId : undefined}
        aria-busy={isLoading || undefined} aria-disabled={disabled || undefined}
        data-force={forceState && forceState !== "default" ? forceState : undefined} {...pointer} {...attrs}>
        {moving && <motion.span className="ts-card__lift" style={{ opacity: shade }} aria-hidden />}
        <div className="ts-card__frame">
          {media && <div ref={part} className="ts-card__media ts-card__part" style={mediaRatio ? { "--card-ratio": String(mediaRatio) } : undefined}>{media}</div>}
          <div className="ts-card__main">
            {head}
            {collapsible ? <Fold open={open} id={bodyId} reduce={reduce}>{rest2}</Fold> : rest2}
          </div>
        </div>
      </Root>
    </CardContext.Provider></>
  );
});

// ── the sample: a workspace settings column in one invented product (shown only with `demo`) ──
const DemoColumn = forwardRef(function DemoColumn({ locale, props: p, className, style, attrs }, ref) {
  const [name, setName] = useState("Kiteline Field Team");
  const [invite, setInvite] = useState(true);
  const [dangerOpen, setDangerOpen] = useState(false);
  const money = new Intl.NumberFormat(locale, { style: "currency", currency: "USD" }).format(144);
  const day = new Intl.DateTimeFormat(locale, { day: "numeric", month: "long", timeZone: "UTC" }).format(Date.UTC(2026, 11, 1));
  const n = (v) => new Intl.NumberFormat(locale).format(v);
  const look = { surface: p.surface, tone: p.tone, density: p.density, disabled: p.disabled };
  const fs = p.forceState;
  return (
    <div ref={ref} className={"ts-card-demo" + (className ? " " + className : "")} style={style} {...attrs}>
      <Card {...look} title={p.title || "Workspace"} description={p.description || "How Kiteline shows your team to the people you invite."} eyebrow={p.eyebrow || undefined}
        loading={p.loading} footerAlign={p.footerAlign === "end" ? "between" : p.footerAlign}
        forceState={fs === "loading" ? "loading" : undefined}
        footer={<><span className="ts-card-demo__note">Changes apply to all {n(12)} members.</span><Button size="sm" label="Save" disabled={p.disabled} /></>}>
        <CardSection title="Name" description="Shown on invites and shared notebooks.">
          <label className="ts-card-demo__field">
            <span className="ts-sr">Workspace name</span>
            <input value={name} onChange={(e) => setName(e.target.value)} maxLength={40} disabled={p.disabled} />
            <span className="ts-card-demo__suffix ts-card-demo__num" aria-hidden>{n(name.length)}/{n(40)}</span>
          </label>
        </CardSection>
        <CardSection title="Members can invite" description="Anyone in the workspace can add people. Owners still approve new seats."
          actions={<Switch showRow={false} aria-label="Members can invite" checked={invite} onChange={(v) => setInvite(v)} disabled={p.disabled} />} />
      </Card>
      <Card {...look} icon="layers" eyebrow="Billing" title="Team plan, 12 seats" href="#billing"
        description={<>Next invoice <span className="ts-card-demo__num">{money}</span> <span className="ts-card-demo__num">on {day}</span></>}
        selected={p.selected} forceState={fs === "hover" || fs === "focus" || fs === "selected" ? fs : undefined} />
      <Card {...look} title="Danger zone" description="Delete the workspace and everything in it." collapsible
        open={p.open !== undefined ? p.open : dangerOpen} onOpenChange={(v) => setDangerOpen(v)}
        footer={<Button size="sm" variant="danger-quiet" label="Delete workspace" icon={<Icon name="trash" size={15} />} disabled={p.disabled} />}>
        <ul className="ts-card-demo__list">
          <li><b>{n(48)}</b> notebooks and <b>{n(1204)}</b> notes, for every member</li>
          <li>Shared links stop working at once</li>
          <li>Owners can restore it for 30 days, then it is gone</li>
        </ul>
      </Card>
    </div>
  );
});
