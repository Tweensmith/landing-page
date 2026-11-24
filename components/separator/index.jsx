"use client";
import { forwardRef, useCallback, useEffect, useRef, useSyncExternalStore } from "react";
import { registerStyles, useStyles, useIsoLayoutEffect, useReducedMotion } from "../_shared/theme.jsx";

// The line is the kit's hairline: 1px, the same weight as a card's edge and the rule between a card's sections at
// every screen density. It is a 2px box shrunk to half with `scale` about its top edge, which keeps it centred on
// whole pixels beside a 16px label, so it is never smeared across two rows. `fade` fades the ends with a mask.
const CSS = `
.ts-sep{--sep-s:.5;--sep-c:var(--ts-line);--sep-min:24px;box-sizing:border-box;display:flex;align-items:center;align-self:stretch;flex:none;min-width:0;
  font-family:var(--ts-font);color:var(--ts-ink2)}
.ts-sep__line{display:block;flex:1 1 0;min-width:var(--sep-min);height:2px;background:var(--sep-c);scale:1 var(--sep-s);transform-origin:left top}
.ts-sep:not(.has-label) .ts-sep__line{min-width:0}
.ts-sep__line--a{transform-origin:right top}
.ts-sep__label{flex:0 1 auto;min-width:0;padding:0 12px;font-size:12px;font-weight:500;line-height:16px;letter-spacing:.01em;color:var(--ts-ink2);
  text-align:center;overflow-wrap:anywhere;text-wrap:balance}
.ts-sep[data-align=start] .ts-sep__label{padding-inline-start:0;text-align:start}
.ts-sep[data-align=end] .ts-sep__label{padding-inline-end:0;text-align:end}
.ts-sep[data-kind=dashed]{--sep-c:color-mix(in srgb,var(--ts-ink) 26%,transparent)}
.ts-sep[data-kind=dashed] .ts-sep__line{background:repeating-linear-gradient(to right,var(--sep-c) 0 4px,transparent 4px 8px)}
.ts-sep[data-kind=fade] .ts-sep__line{-webkit-mask-image:linear-gradient(to right,transparent,var(--ts-ink) 30%,var(--ts-ink) 70%,transparent);mask-image:linear-gradient(to right,transparent,var(--ts-ink) 30%,var(--ts-ink) 70%,transparent)}
.ts-sep[data-kind=fade] .ts-sep__line--a{-webkit-mask-image:linear-gradient(to right,transparent,var(--ts-ink) 75%);mask-image:linear-gradient(to right,transparent,var(--ts-ink) 75%)}
.ts-sep[data-kind=fade] .ts-sep__line--b{-webkit-mask-image:linear-gradient(to left,transparent,var(--ts-ink) 75%);mask-image:linear-gradient(to left,transparent,var(--ts-ink) 75%)}
.ts-sep:dir(rtl) .ts-sep__line{transform-origin:right top}
.ts-sep:dir(rtl) .ts-sep__line--a{transform-origin:left top}
.ts-sep[data-kind=fade]:dir(rtl) .ts-sep__line--a{-webkit-mask-image:linear-gradient(to left,transparent,var(--ts-ink) 75%);mask-image:linear-gradient(to left,transparent,var(--ts-ink) 75%)}
.ts-sep[data-kind=fade]:dir(rtl) .ts-sep__line--b{-webkit-mask-image:linear-gradient(to right,transparent,var(--ts-ink) 75%);mask-image:linear-gradient(to right,transparent,var(--ts-ink) 75%)}
.ts-sep[data-o=v]{display:inline-flex;flex-direction:column;vertical-align:middle;min-height:16px;min-width:0}
.ts-sep[data-o=v] .ts-sep__line{flex:1 1 0;width:2px;height:auto;min-width:0;min-height:8px;scale:var(--sep-s) 1;transform-origin:left top}
.ts-sep[data-o=v] .ts-sep__line--a{transform-origin:left bottom}
.ts-sep[data-o=v] .ts-sep__label{padding:6px 0}
.ts-sep[data-o=v][data-align=start] .ts-sep__label{padding-top:0}
.ts-sep[data-o=v][data-align=end] .ts-sep__label{padding-bottom:0}
.ts-sep[data-o=v][data-kind=dashed] .ts-sep__line{background:repeating-linear-gradient(to bottom,var(--sep-c) 0 4px,transparent 4px 8px)}
.ts-sep[data-o=v][data-kind=fade] .ts-sep__line{-webkit-mask-image:linear-gradient(to bottom,transparent,var(--ts-ink) 30%,var(--ts-ink) 70%,transparent);mask-image:linear-gradient(to bottom,transparent,var(--ts-ink) 30%,var(--ts-ink) 70%,transparent)}
.ts-sep[data-o=v][data-kind=fade] .ts-sep__line--a{-webkit-mask-image:linear-gradient(to bottom,transparent,var(--ts-ink) 75%);mask-image:linear-gradient(to bottom,transparent,var(--ts-ink) 75%)}
.ts-sep[data-o=v][data-kind=fade] .ts-sep__line--b{-webkit-mask-image:linear-gradient(to top,transparent,var(--ts-ink) 75%);mask-image:linear-gradient(to top,transparent,var(--ts-ink) 75%)}
.ts-sep-demo{box-sizing:border-box;width:100%;max-width:380px;padding:22px 22px 14px;border-radius:var(--ts-radius-lg);background:var(--ts-surface);box-shadow:inset 0 0 0 1px var(--ts-line);
  font-family:var(--ts-font);color:var(--ts-ink)}
.ts-sep-demo__title{margin:0 0 4px;font-size:17px;font-weight:640;letter-spacing:-.015em}
.ts-sep-demo__sub{margin:0 0 18px;font-size:13px;line-height:1.45;color:var(--ts-ink2)}
.ts-sep-demo__stack{display:flex;flex-direction:column;gap:8px}
.ts-sep-demo__btn{box-sizing:border-box;display:flex;align-items:center;justify-content:center;gap:8px;height:42px;padding:0 16px;border-radius:var(--ts-radius-md);
  font-size:14px;font-weight:550;letter-spacing:-.01em;background:var(--ts-surface2);color:var(--ts-ink);box-shadow:inset 0 0 0 1px var(--ts-line)}
.ts-sep-demo__btn.is-primary{background:var(--ts-accent);color:var(--ts-accent-ink);box-shadow:none}
.ts-sep-demo__lab{font-size:13px;font-weight:550}
.ts-sep-demo__input{box-sizing:border-box;display:flex;align-items:center;height:48px;padding:0 14px;border-radius:var(--ts-radius-md);font-size:15px;color:var(--ts-ink2);background:var(--ts-surface);box-shadow:inset 0 0 0 1px var(--ts-line)}
.ts-sep-demo__foot{display:flex;align-items:center;justify-content:center;gap:0}
.ts-sep-demo__link{display:inline-flex;align-items:center;height:32px;padding:0 4px;font-size:12.5px;color:var(--ts-ink2)}
@media (max-width:640px),(pointer:coarse){
  .ts-sep-demo__btn{height:44px}
  .ts-sep-demo__input{height:52px;font-size:16px}
  .ts-sep-demo__link{font-size:13.5px}
}
`;
registerStyles("ts-sep", CSS);

const DRAW = { duration: 0.42, ease: "cubic-bezier(.22,.8,.24,1)" };
const len = (v) => (typeof v === "number" ? v + "px" : v);
// true only in the render that hydrates server HTML (the server's line was already on screen)
const never = () => () => {};
const no = () => false;
const yes = () => true;

/**
 * Separator — a rule between two groups of content: sections of a card or menu, sign-in options and a form ("or"),
 * items in a toolbar (vertical).
 * Signature: it draws itself. The first time it comes into view the line draws from its start edge to its end, or,
 * with a label, outward from the label to both edges, once, in about 400ms. It never redraws on a re-render, a
 * theme change or a second visit. `draw={false}` turns it off; reduced motion: it is simply there. A page rendered
 * on a server shows the line at once if it was already on screen when the page woke up.
 * The line is the kit's 1px hairline. `label` sits in the line (`align` center, start or end) and
 * wraps rather than overflowing; each line keeps at least 24px. Vertical separators stretch to their flex
 * parent's height (min 16px). Decorative by default (role="none", hidden from assistive technology);
 * `decorative={false}` makes it a real role="separator" with aria-orientation, named by a text label.
 * The ref goes to the root.
 */
export const Separator = forwardRef(function Separator({
  orientation = "horizontal",
  kind = "line",
  label = "",
  align = "center",
  inset = 0,
  spacing = 16,
  decorative = true,
  draw = true,
  demo = false,
  forceState,
  className,
  style,
  ...rest
}, ref) {
  const sheetTag = useStyles("ts-sep", CSS);   // forceState is the gallery's; a separator has only its default state
  if (demo && (label === "" || label == null)) return <>{sheetTag}<SeparatorDemo ref={ref} kind={kind} draw={draw} className={className} style={style} rest={rest} /></>;
  return <>{sheetTag}<Rule ref={ref} orientation={orientation} kind={kind} label={label} align={align} inset={inset} spacing={spacing} decorative={decorative} draw={draw} className={className} style={style} rest={rest} /></>;
});

const Rule = forwardRef(function Rule({ orientation, kind, label, align, inset, spacing, decorative, draw, className, style, rest }, ref) {
  const reduce = useReducedMotion();
  const vertical = orientation === "vertical";
  const hasLabel = label !== "" && label !== null && label !== undefined && label !== false;
  const al = align === "start" || align === "end" ? align : "center";
  const root = useRef(null);
  const setRef = useCallback((el) => { root.current = el; if (typeof ref === "function") ref(el); else if (ref) ref.current = el; }, [ref]);

  const hydrating = useSyncExternalStore(never, no, yes);
  const born = useRef(hydrating);
  const state = useRef("idle");   // idle -> waiting -> drawn
  const parts = () => {
    const el = root.current;
    return el ? { lines: [...el.querySelectorAll(":scope > .ts-sep__line")], text: el.querySelector(":scope > .ts-sep__label") } : { lines: [], text: null };
  };
  const reveal = () => {
    const { lines, text } = parts();
    lines.forEach((l) => { l.style.transform = ""; });
    if (text) text.style.opacity = "";
    state.current = "drawn";
  };
  // Before the first paint: hide the line (and label) until the separator comes into view, then draw it once.
  useIsoLayoutEffect(() => {
    const el = root.current;
    if (!el || !draw || reduce || typeof IntersectionObserver === "undefined") { state.current = "drawn"; return; }
    if (born.current) {
      // hydrating server HTML: the line has been on screen already if it is in view now; leave it as it is
      const r = el.getBoundingClientRect();
      if (r.bottom > 0 && r.top < window.innerHeight && r.right > 0 && r.left < window.innerWidth) { state.current = "drawn"; return; }
    }
    const { lines, text } = parts();
    const scale = vertical ? "scaleY(0)" : "scaleX(0)";
    lines.forEach((l) => { l.style.transform = scale; });
    if (text) text.style.opacity = "0";
    state.current = "waiting";
    const io = new IntersectionObserver((entries) => {
      if (!entries.some((e) => e.isIntersecting) || state.current !== "waiting") return;
      io.disconnect();
      state.current = "drawn";
      // Web Animations without fill: the inline hide is dropped as each animation starts, so when it ends the line
      // is back to its own CSS with nothing left in its style attribute
      const p = parts();
      const full = vertical ? "scaleY(1)" : "scaleX(1)";
      const delay = p.text ? 60 : 0;
      if (p.text) { p.text.animate({ opacity: [0, 1] }, { duration: 240, easing: "ease-out", fill: "backwards" }); p.text.style.opacity = ""; }
      p.lines.forEach((l) => {
        l.animate({ transform: [scale, full] }, { duration: DRAW.duration * 1000, delay, easing: DRAW.ease, fill: "backwards" });
        l.style.transform = "";
      });
    }, { threshold: 0.01 });
    io.observe(el);
    return () => { io.disconnect(); if (state.current === "waiting") reveal(); };
  }, []);
  // the reader asks for less motion (or draw is turned off) while it waits: it is simply there
  useEffect(() => { if ((reduce || !draw) && state.current === "waiting") reveal(); }, [reduce, draw]);

  // A horizontal rule takes its container's width less the inset, in any parent (a flex row would shrink it)
  const ins = inset === true ? "16px" : len(inset || 0);
  const margin = vertical
    ? { marginInline: len(spacing), marginBlock: ins }
    : { marginBlock: len(spacing), marginInline: ins, width: inset ? `calc(100% - 2 * ${ins})` : "100%" };
  const a11y = decorative
    ? { role: "none", "aria-hidden": true }
    : { role: "separator", "aria-orientation": vertical ? "vertical" : "horizontal", "aria-label": typeof label === "string" && label ? label : undefined };

  return (
    <div ref={setRef} className={"ts-sep" + (hasLabel ? " has-label" : "") + (className ? " " + className : "")} data-o={vertical ? "v" : "h"} data-kind={kind === "dashed" || kind === "fade" ? kind : "line"}
      data-align={al} style={{ ...margin, ...style }} {...a11y} {...rest}>
      {(!hasLabel || al !== "start") && <span className={"ts-sep__line" + (hasLabel ? " ts-sep__line--a" : "")} />}
      {hasLabel && <span className="ts-sep__label">{label}</span>}
      {hasLabel && al !== "end" && <span className="ts-sep__line ts-sep__line--b" />}
    </div>
  );
});

// ── Sample content (demo only): a still picture of one invented app's sign-in panel, to show the three uses ──────
const SeparatorDemo = forwardRef(function SeparatorDemo({ kind, draw, className, style, rest }, ref) {
  return (
    <div ref={ref} className={"ts-sep-demo" + (className ? " " + className : "")} style={style} {...rest}>
      <h3 className="ts-sep-demo__title">Sign in to your workspace</h3>
      <p className="ts-sep-demo__sub">Use the passkey on this device, or get a link by email.</p>
      <div className="ts-sep-demo__stack">
        <span className="ts-sep-demo__btn is-primary">Continue with passkey</span>
        <span className="ts-sep-demo__btn">Continue with single sign-on</span>
      </div>
      <Separator label="or" kind={kind} draw={draw} spacing={18} />
      <div className="ts-sep-demo__stack">
        <span className="ts-sep-demo__lab">Work email</span>
        <span className="ts-sep-demo__input">you@company.com</span>
        <span className="ts-sep-demo__btn">Email me a sign-in link</span>
      </div>
      <Separator kind={kind} draw={draw} spacing={18} />
      <div className="ts-sep-demo__foot">
        <span className="ts-sep-demo__link">Help</span>
        <Separator orientation="vertical" kind={kind} draw={draw} spacing={10} inset={8} />
        <span className="ts-sep-demo__link">Privacy</span>
        <Separator orientation="vertical" kind={kind} draw={draw} spacing={10} inset={8} />
        <span className="ts-sep-demo__link">Create an account</span>
      </div>
    </div>
  );
});
