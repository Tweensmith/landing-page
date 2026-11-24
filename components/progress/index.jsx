"use client";
import { forwardRef, useEffect, useId, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { registerStyles, useStyles, useReducedMotion } from "../_shared/theme.jsx";
import { Icon } from "../_shared/icons.jsx";
import { RollingNumber } from "../_shared/rolling-number.jsx";

const CSS = `
.ts-prog{display:flex;flex-direction:column;gap:9px;width:100%;max-width:var(--pg-w);font-family:var(--ts-font);color:var(--ts-ink)}
.ts-prog__head{display:flex;justify-content:space-between;align-items:baseline;gap:12px}
.ts-prog__label{font-size:13px;font-weight:550}
.ts-prog__val{font-family:var(--ts-font-mono);font-size:12.5px;color:var(--ts-ink2);display:inline-flex;align-items:baseline}
.ts-prog__track{position:relative;height:var(--pg-t);border-radius:99px;background:var(--ts-surface2);overflow:hidden}
.ts-prog__fill{position:absolute;inset:0;border-radius:inherit;background:var(--tone);transform-origin:left center}
.ts-prog__calm{position:absolute;top:0;bottom:0;width:45%;border-radius:inherit;
  background:linear-gradient(90deg,transparent,var(--tone) 35%,var(--tone) 65%,transparent);animation:ts-prog-drift 2.6s cubic-bezier(.45,0,.55,1) infinite}
@keyframes ts-prog-drift{0%{left:-45%;opacity:.35}50%{opacity:1}100%{left:100%;opacity:.35}}
.ts-prog__ringwrap{position:relative;display:grid;place-items:center;width:var(--pg-s);height:var(--pg-s)}
.ts-prog__ringwrap svg{position:absolute;inset:0}
.ts-prog__ringwrap circle{fill:none;stroke-linecap:round}
.ts-prog__spin{transform-origin:50% 50%;animation:ts-prog-spin 2.4s linear infinite}
.ts-prog__spin circle{animation:ts-prog-breathe 2.4s cubic-bezier(.45,0,.55,1) infinite}
@keyframes ts-prog-spin{to{transform:rotate(360deg)}}
@keyframes ts-prog-breathe{0%,100%{stroke-dasharray:calc(var(--pg-c) * .12) var(--pg-c)}50%{stroke-dasharray:calc(var(--pg-c) * .42) var(--pg-c)}}
.ts-prog__center{position:relative;font-family:var(--ts-font-mono);font-size:calc(var(--pg-s) * .2);font-weight:600;display:inline-flex;align-items:baseline}
.ts-prog__ringrow{display:flex;align-items:center;gap:14px}
.ts-prog__ringtext{display:flex;flex-direction:column;gap:3px}
.ts-prog__ringtext span{font-size:12.5px;color:var(--ts-ink2)}
.ts-prog__steps{display:grid;grid-template-columns:repeat(var(--pg-n),1fr);gap:5px}
.ts-prog__seg{position:relative;height:var(--pg-t);border-radius:99px;background:var(--ts-surface2);overflow:hidden}
.ts-prog__seg > span{position:absolute;inset:0;background:var(--tone);border-radius:inherit;transform-origin:left center}
.ts-prog__seg.is-now > span{animation:ts-prog-glow 1.1s ease-in-out 2}
.ts-prog__val.is-text{font-family:var(--ts-font);font-size:12.5px}
@keyframes ts-prog-glow{0%,100%{opacity:1}50%{opacity:.45}}
.ts-prog__hint{font-size:12px;color:var(--ts-ink2)}
@media (prefers-reduced-motion:reduce){
  .ts-prog__seg.is-now > span{animation:none}
  .ts-prog__calm{animation:ts-prog-glow 2.4s ease-in-out infinite;left:0;width:100%}
  .ts-prog__spin,.ts-prog__spin circle{animation:none}
  .ts-prog__spin circle{stroke-dasharray:calc(var(--pg-c) * .3) var(--pg-c);opacity:.7}
}
`;
registerStyles("ts-progress", CSS);

// ring diameter in px (kind "ring"): sm keeps the centre readout at a whole 12px, lg leads a card or an upload panel
const SIZES = { sm: 60, md: 72, lg: 96 };
const TONE = { accent: "var(--ts-accent)", success: "var(--ts-success)", warning: "var(--ts-warning)", danger: "var(--ts-danger)" };

const DEMO = { label: "Uploading assets", hint: "12 of 19 files · about 40 seconds left", doneHint: "Everything's uploaded.", busyHint: "Preparing your files…", ringBusyHint: "Preparing…" };

/**
 * Progress — linear bar, ring or segmented steps, determinate or indeterminate.
 * Signature: indeterminate states are calm: a soft band drifts and breathes instead of racing,
 * and the ring's arc lengthens and shortens slowly. Determinate values spring, and the
 * percentage rolls like an odometer. At 100% the readout becomes a check.
 * Nothing loops at rest: only an indeterminate (busy) state moves on its own.
 */
export const Progress = forwardRef(function Progress({
  kind = "linear",
  value = 0,
  max = 100,
  indeterminate = false,
  label = "",
  hint = "",
  valueText,
  showValue = true,
  tone = "accent",
  thickness = 6,
  size = "md",
  steps = 5,
  current,
  width = 380,
  simulate = false,
  showComplete = true,
  doneLabel = "Done",
  doneHint = "",
  demo = false,
  forceState,
  className,
  style,
  ...rest
}, ref) {
  const sheetTag = useStyles("ts-progress", CSS);
  const reduce = useReducedMotion();
  const id = useId();
  const px = typeof size === "number" ? size : SIZES[size] ?? SIZES.md;
  const total = Math.max(0, Number(max) || 0) || 100;
  const pctOf = (x) => Math.max(0, Math.min(100, ((Number(x) || 0) / total) * 100));
  const [sim, setSim] = useState(() => pctOf(value));
  useEffect(() => { setSim(pctOf(value)); }, [value, total]);
  useEffect(() => {
    if (!simulate) return;
    const t = setInterval(() => setSim((v) => (v >= 100 ? 0 : Math.min(100, v + 3 + Math.round(Math.random() * 6)))), 450);
    return () => clearInterval(t);
  }, [simulate]);

  // steps: a number of segments, or an array of steps (strings or { label }); `current` (0-based) makes them discrete
  const stepList = Array.isArray(steps) ? steps.map((x) => (typeof x === "string" ? { label: x } : x ?? {})) : null;
  const N = Math.max(1, stepList ? stepList.length : Math.round(Number(steps) || 1));
  const discrete = kind === "steps" && (stepList != null || current != null);
  const cur = discrete ? Math.max(0, Math.min(N, Math.floor(Number(current) || 0))) : 0;

  const busy = forceState === "loading" || (indeterminate && forceState !== "success");
  const exact = forceState === "success" ? 100 : discrete ? (cur / N) * 100 : simulate ? sim : pctOf(value);
  const v = Math.round(exact);
  // a task finishes (green, a check, the done copy); a meter such as plan usage just reads 100%: showComplete={false}
  const done = showComplete && !busy && exact >= 100;
  const toneVar = done ? "var(--ts-success)" : TONE[tone] ?? TONE.accent;
  const spring = reduce ? { duration: 0 } : { type: "spring", stiffness: 120, damping: 22 };

  // content: the caller's always wins; sample copy only with `demo`
  const lbl = label || (demo ? DEMO.label : "");
  const hintNow = done ? doneHint || hint || (demo ? DEMO.doneHint : "") : hint || (busy && demo ? (kind === "ring" ? DEMO.ringBusyHint : DEMO.busyHint) : demo ? DEMO.hint : "");
  const lblNow = done ? doneLabel || lbl : lbl;

  const stepNo = Math.min(N, discrete ? cur + 1 : Math.floor((exact / 100) * N + 1e-6) + 1);
  const stepName = discrete && stepList ? stepList[Math.min(cur, N - 1)]?.label : null;
  const info = { value: Number(value) || 0, max: total, percent: v, step: stepNo, steps: N, current: cur, done, busy };
  const custom = typeof valueText === "function" ? valueText(info) : valueText;
  const stepsText = kind === "steps" && !done ? `Step ${stepNo} of ${N}` : null;
  const ariaText = busy ? custom || "Working" : custom || (done ? "Complete" : stepsText ? stepsText + (stepName ? `: ${stepName}` : "") : `${v}%`);
  const aria = {
    role: "progressbar",
    ...(lbl ? { "aria-labelledby": id } : {}),
    "aria-valuemin": 0,
    "aria-valuemax": discrete ? N : total,
    ...(busy ? { "aria-busy": true, "aria-valuetext": ariaText } : { "aria-valuenow": discrete ? cur : forceState === "success" ? total : simulate ? Math.round((sim / 100) * total) : Math.min(total, Math.max(0, Number(value) || 0)), "aria-valuetext": ariaText }),
  };
  if (rest["aria-label"] || rest["aria-labelledby"]) {
    if (rest["aria-label"]) aria["aria-label"] = rest["aria-label"];
    if (rest["aria-labelledby"]) aria["aria-labelledby"] = rest["aria-labelledby"];
  }
  if (rest["aria-describedby"]) aria["aria-describedby"] = rest["aria-describedby"];
  const { "aria-label": _al, "aria-labelledby": _alb, "aria-describedby": _adb, ...rootRest } = rest;

  const textReadout = custom != null && custom !== "" ? custom : stepsText;
  const readout = busy ? (custom ? <span>{custom}</span> : null) : textReadout && !done ? <span>{textReadout}</span> : (
    <AnimatePresence mode="popLayout" initial={false}>
      {done ? (
        <motion.span key="ok" initial={reduce ? { opacity: 0 } : { scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ opacity: 0 }}
          transition={{ type: "spring", stiffness: 600, damping: 20 }} style={{ display: "grid", color: "var(--ts-success)" }}>
          <Icon name="check" size={kind === "ring" ? Math.round(px * 0.34) : 15} stroke={2.6} />
        </motion.span>
      ) : (
        <motion.span key="n" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ display: "inline-flex", alignItems: "baseline" }}>
          <RollingNumber value={v} stiffness={200} damping={24} />%
        </motion.span>
      )}
    </AnimatePresence>
  );
  const isText = !!(textReadout && !done) || (busy && custom);
  const vars = { "--tone": toneVar, "--pg-t": thickness + "px", "--pg-w": !width ? "100%" : typeof width === "number" ? width + "px" : width };
  const cls = "ts-prog" + (className ? " " + className : "");

  if (kind === "ring") {
    const r = (px - thickness) / 2, c = 2 * Math.PI * r;
    return (
      <>{sheetTag}<div ref={ref} className={cls} style={{ ...vars, "--pg-s": px + "px", "--pg-c": c, ...style }} {...rootRest}>
        <div className="ts-prog__ringrow">
          <div className="ts-prog__ringwrap" {...aria}>
            <svg viewBox={`0 0 ${px} ${px}`} aria-hidden>
              <circle cx={px / 2} cy={px / 2} r={r} strokeWidth={thickness} style={{ stroke: "var(--ts-surface2)" }} />
            </svg>
            {busy ? (
              <svg viewBox={`0 0 ${px} ${px}`} className="ts-prog__spin" aria-hidden>
                <circle cx={px / 2} cy={px / 2} r={r} strokeWidth={thickness} style={{ stroke: "var(--tone)" }} />
              </svg>
            ) : (
              <svg viewBox={`0 0 ${px} ${px}`} aria-hidden style={{ transform: "rotate(-90deg)" }}>
                <motion.circle cx={px / 2} cy={px / 2} r={r} strokeWidth={thickness} strokeDasharray={c} initial={false}
                  animate={{ strokeDashoffset: c * (1 - exact / 100) }} transition={spring} style={{ stroke: "var(--tone)", transition: "stroke .3s" }} />
              </svg>
            )}
            {showValue && <span className="ts-prog__center" aria-hidden>{readout}</span>}
          </div>
          {(lblNow || hintNow) && (
            <div className="ts-prog__ringtext">
              {lblNow && <b id={id} className="ts-prog__label">{lblNow}</b>}
              {hintNow && <span>{hintNow}</span>}
            </div>
          )}
        </div>
      </div></>
    );
  }

  return (
    <>{sheetTag}<div ref={ref} className={cls} style={{ ...vars, "--pg-n": N, ...style }} {...rootRest}>
      {(lblNow || showValue) && (
        <div className="ts-prog__head">
          <span id={id} className="ts-prog__label">{lblNow}</span>
          {showValue && <span className={"ts-prog__val" + (isText ? " is-text" : "")} aria-hidden>{readout}</span>}
        </div>
      )}
      {kind === "steps" ? (
        <div className="ts-prog__steps" {...aria}>
          {Array.from({ length: N }, (_, i) => {
            const per = 100 / N;
            let fill = busy ? 0 : discrete ? (i <= cur ? 1 : 0) : Math.max(0, Math.min(1, (exact - i * per) / per));
            if (fill > 0.995) fill = 1; // never park a segment at 0.99
            const now = !done && (busy ? i === 0 : discrete ? i === cur : fill > 0 && fill < 1);
            return (
              <span key={i} className={"ts-prog__seg" + (now ? " is-now" : "")} title={stepList?.[i]?.label || undefined}>
                <motion.span initial={false} animate={{ scaleX: now && !busy ? Math.max(fill, 0.08) : busy && i === 0 ? 1 : fill }} transition={spring} />
              </span>
            );
          })}
        </div>
      ) : (
        <div className="ts-prog__track" {...aria}>
          {busy ? <span className="ts-prog__calm" /> : (
            <motion.span className="ts-prog__fill" initial={false} animate={{ scaleX: exact / 100 }} transition={spring} style={{ transition: "background-color .3s" }} />
          )}
        </div>
      )}
      {hintNow && <span className="ts-prog__hint">{hintNow}</span>}
    </div></>
  );
});
