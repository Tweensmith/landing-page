"use client";
import { forwardRef } from "react";

import { registerStyles, useStyles, useReducedMotion } from "../_shared/theme.jsx";

const CSS = `
.ts-ld{display:inline-grid;place-items:center;width:var(--ld-s);height:var(--ld-s);color:var(--tone);position:relative}
.ts-ld *{box-sizing:border-box}
.ts-ld-grid{display:flex;flex-wrap:wrap;gap:12px;justify-content:center;font-family:var(--ts-font)}
.ts-ld-cell{display:flex;flex-direction:column;align-items:center;gap:12px;width:104px;padding:22px 0 14px;border-radius:var(--ts-radius-lg);background:var(--ts-surface);box-shadow:inset 0 0 0 1px var(--ts-line)}
.ts-ld-cell span.ts-ld-name{font-family:var(--ts-font-mono);font-size:10.5px;letter-spacing:.12em;text-transform:uppercase;color:var(--ts-ink2)}

/* orbit: two satellites on tilted paths around a still core */
.ts-ld--orbit .core{width:22%;height:22%;border-radius:99px;background:currentColor}
.ts-ld--orbit .path{position:absolute;inset:6%;border-radius:99px;border:1.5px solid color-mix(in srgb,currentColor 30%,transparent);animation:ts-ld-rot calc(var(--ld-d) * 1.4) linear infinite}
.ts-ld--orbit .path.b{inset:20%;animation-duration:calc(var(--ld-d) * .9);animation-direction:reverse}
.ts-ld--orbit .path::after{content:"";position:absolute;top:-6%;left:50%;width:16%;height:16%;margin-left:-8%;border-radius:99px;background:currentColor}
.ts-ld--orbit .path.b::after{width:20%;height:20%;margin-left:-10%;top:-10%}

/* pulse: rings that bloom out of the centre and fade */
.ts-ld--pulse span{position:absolute;inset:0;border-radius:99px;border:2px solid currentColor;opacity:0;animation:ts-ld-bloom calc(var(--ld-d) * 1.6) cubic-bezier(.2,.6,.3,1) infinite}
.ts-ld--pulse span:nth-child(2){animation-delay:calc(var(--ld-d) * .53)}
.ts-ld--pulse span:nth-child(3){animation-delay:calc(var(--ld-d) * 1.06)}
.ts-ld--pulse::after{content:"";width:18%;height:18%;border-radius:99px;background:currentColor}

/* bars: an equaliser with staggered heights */
.ts-ld--bars{display:flex;align-items:center;justify-content:center;gap:9%}
.ts-ld--bars span{width:11%;height:70%;border-radius:99px;background:currentColor;animation:ts-ld-eq var(--ld-d) ease-in-out infinite}
.ts-ld--bars span:nth-child(2){animation-delay:calc(var(--ld-d) * -.8)}
.ts-ld--bars span:nth-child(3){animation-delay:calc(var(--ld-d) * -.6)}
.ts-ld--bars span:nth-child(4){animation-delay:calc(var(--ld-d) * -.4)}
.ts-ld--bars span:nth-child(5){animation-delay:calc(var(--ld-d) * -.2)}

/* dots: a travelling hop, like someone typing */
.ts-ld--dots{display:flex;align-items:center;justify-content:center;gap:10%}
.ts-ld--dots span{width:17%;height:17%;border-radius:99px;background:currentColor;animation:ts-ld-hop var(--ld-d) cubic-bezier(.45,0,.55,1) infinite}
.ts-ld--dots span:nth-child(2){animation-delay:calc(var(--ld-d) * .15)}
.ts-ld--dots span:nth-child(3){animation-delay:calc(var(--ld-d) * .3)}

/* ring: a tapered arc chasing its tail */
.ts-ld--ring span{position:absolute;inset:8%;border-radius:99px;
  background:conic-gradient(from 0deg,transparent 0 12%,currentColor 100%);
  -webkit-mask:radial-gradient(farthest-side,transparent calc(100% - var(--ld-t)),black calc(100% - var(--ld-t) + 1px));
  mask:radial-gradient(farthest-side,transparent calc(100% - var(--ld-t)),black calc(100% - var(--ld-t) + 1px));
  animation:ts-ld-rot calc(var(--ld-d) * .9) linear infinite}
.ts-ld--ring span::after{content:"";position:absolute;top:0;left:50%;width:var(--ld-t);height:var(--ld-t);margin-left:calc(var(--ld-t) / -2);border-radius:99px;background:currentColor}

@keyframes ts-ld-rot{to{transform:rotate(360deg)}}
@keyframes ts-ld-bloom{0%{transform:scale(.2);opacity:.9}100%{transform:scale(1);opacity:0}}
@keyframes ts-ld-eq{0%,100%{transform:scaleY(.3)}50%{transform:scaleY(1)}}
@keyframes ts-ld-hop{0%,60%,100%{transform:translateY(0);opacity:.45}30%{transform:translateY(-70%);opacity:1}}
@keyframes ts-ld-fade{0%,100%{opacity:.35}50%{opacity:1}}
.ts-ld.is-calm *,.ts-ld.is-calm::after{animation:ts-ld-fade 1.6s ease-in-out infinite !important;transform:none !important}
.ts-ld.is-calm.ts-ld--pulse span{opacity:.3}
@media (prefers-reduced-motion:reduce){.ts-ld *,.ts-ld::after{animation:ts-ld-fade 1.6s ease-in-out infinite !important;transform:none !important}.ts-ld--pulse span{opacity:.3}}
.ts-ld-wrap{display:inline-flex;align-items:center;gap:.6em;font-family:var(--ts-font);font-size:13px;color:var(--ts-ink2)}
.ts-ld-wrap--below{flex-direction:column;gap:8px}
@media (max-width:640px){.ts-ld-cell span.ts-ld-name{font-size:11px}}
`;
registerStyles("ts-loader", CSS);

const TONE = { accent: "var(--ts-accent)", ink: "var(--ts-ink)", muted: "var(--ts-ink2)", success: "var(--ts-success)", danger: "var(--ts-danger)" };
// width and height in px: sm sits inside a button or beside a line of text, lg holds a panel or an empty page
const SIZES = { sm: 20, md: 40, lg: 64 };
const KINDS = ["orbit", "pulse", "bars", "dots", "ring"];
const PARTS = { orbit: 0, pulse: 3, bars: 5, dots: 3, ring: 1 };

// the drawing alone: always hidden from assistive tech; the status role and its text live on the wrapper
function Art({ kind, size, speed, tone, calm }) {
  const k = PARTS[kind] === undefined ? "ring" : kind;
  return (
    <span
      className={`ts-ld ts-ld--${k}${calm ? " is-calm" : ""}`}
      aria-hidden
      style={{ "--ld-s": size + "px", "--ld-d": speed + "s", "--ld-t": Math.max(2, Math.round(size * 0.1)) + "px", "--tone": TONE[tone] ?? TONE.accent }}
    >
      {k === "orbit" ? (<><span className="path" /><span className="path b" /><span className="core" /></>) : Array.from({ length: PARTS[k] }, (_, i) => <span key={i} />)}
    </span>
  );
}

// one loader with its name: role="status" plus text (hidden unless showLabel), or fully hidden when label is ""
function One({ kind, size, speed, tone, calm, label, showLabel, labelPosition, className, style, rest, innerRef }) {
  const named = !!label;
  return (
    <span
      ref={innerRef}
      className={"ts-ld-wrap" + (labelPosition === "below" ? " ts-ld-wrap--below" : "") + (className ? " " + className : "")}
      role={named ? "status" : undefined}
      aria-hidden={named ? undefined : true}
      style={style}
      {...rest}
    >
      <Art kind={kind} size={size} speed={speed} tone={tone} calm={calm} />
      {named && (showLabel ? <span className="ts-ld-label">{label}</span> : <span className="ts-sr">{label}</span>)}
    </span>
  );
}

/**
 * Loader — five loaders that share one size, speed and tone: orbit, pulse, bars, dots and ring.
 * Each is pure CSS (no JS per frame) and has its own personality: orbit for "thinking", pulse for
 * "listening", bars for audio and data, dots for "typing", ring for generic waits.
 * Under reduced motion every loader falls back to a gentle fade with no movement.
 * One loader is a role="status" region named by `label` (read by screen readers; shown when `showLabel`).
 * Pass label="" when text beside it already says what is loading: the loader is then hidden from assistive tech.
 * kind="all" lays out all five side by side (the gallery's sampler). The ref goes to the root.
 */
export const Loader = forwardRef(function Loader({
  kind = "ring",
  size = "md",
  speed = 1,
  tone = "accent",
  label = "Loading",
  showLabel = false,
  labelPosition = "end",
  className,
  style,
  forceState,
  ...rest
}, ref) {
  const sheetTag = useStyles("ts-loader", CSS);
  const reduce = useReducedMotion();
  const calm = !!reduce;
  const px = typeof size === "number" ? size : SIZES[size] ?? SIZES.md;
  if (kind !== "all") return <>{sheetTag}<One innerRef={ref} kind={kind} size={px} speed={speed} tone={tone} calm={calm} label={label} showLabel={showLabel} labelPosition={labelPosition} className={className} style={style} rest={rest} /></>;
  return (
    <>{sheetTag}<div ref={ref} className={"ts-ld-grid" + (className ? " " + className : "")} style={style} {...rest}>
      {KINDS.map((k) => (
        <div key={k} className="ts-ld-cell">
          <One kind={k} size={px} speed={speed} tone={tone} calm={calm} label={label ? `${label} (${k})` : ""} />
          <span className="ts-ld-name" aria-hidden>{k}</span>
        </div>
      ))}
    </div></>
  );
});
