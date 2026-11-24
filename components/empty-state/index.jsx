"use client";
import { forwardRef, useId, useMemo } from "react";
import { motion } from "motion/react";
import { registerStyles, useStyles, useReducedMotion } from "../_shared/theme.jsx";
import { Icon } from "../_shared/icons.jsx";
import { Button } from "../button/index.jsx";

const CSS = `
.ts-empty{box-sizing:border-box;display:flex;flex-direction:column;align-items:center;gap:6px;width:100%;max-width:448px;padding:28px 24px;text-align:center;font-family:var(--ts-font);color:var(--ts-ink)}
.ts-empty.is-framed{border-radius:calc(var(--ts-radius-lg) + 4px);background:var(--ts-surface);box-shadow:0 0 0 1px var(--ts-line)}
.ts-empty__art{width:220px;max-width:100%;height:auto;margin-bottom:12px;overflow:visible}
.ts-empty__slot{display:flex;justify-content:center;max-width:100%;margin-bottom:12px}
.ts-empty__icon{display:grid;place-items:center;width:56px;height:56px;margin-bottom:12px;border-radius:var(--ts-radius-lg);color:var(--ts-accent);background:color-mix(in srgb,var(--ts-accent) 14%,var(--ts-surface2))}
.ts-empty__extra{display:flex;flex-direction:column;align-items:center;gap:8px;margin-top:10px}
.ts-empty__title{margin:0;font-size:18px;font-weight:650;letter-spacing:-0.015em}
.ts-empty__desc{margin:0 0 14px;font-size:13.5px;line-height:1.55;color:var(--ts-ink2);max-width:320px}
.ts-empty__link{all:unset;margin-top:10px;font-size:12.5px;color:var(--ts-ink2);cursor:pointer;text-decoration:underline;text-decoration-color:var(--ts-line);text-underline-offset:3px;border-radius:4px}
.ts-empty__link:disabled{cursor:not-allowed;opacity:.5}
.ts-empty__link:hover:not(:disabled){color:var(--ts-ink);text-decoration-color:var(--ts-ink)}
.ts-empty__link:focus-visible{outline:2px solid var(--ts-focus);outline-offset:2px}
@media (max-width:640px),(pointer:coarse){
  .ts-empty{padding:28px 20px}
  .ts-empty__link{display:inline-flex;align-items:center;min-height:44px;margin-top:2px;padding:0 8px;font-size:13.5px}
}
`;
registerStyles("ts-empty-state", CSS);

const COPY = {
  projects: ["No projects yet", "Projects hold your files, comments and versions in one place. Start one and invite your team when you're ready.", "New project", "Import from Figma", "plus"],
  search: ["No results for “brand deck”", "Try a shorter search, or check the spelling. You can also search inside file contents.", "Clear search", "Search everywhere", "search"],
  inbox: ["You're all caught up", "New mentions, approvals and comments will land here. Nothing needs you right now.", "Open settings", "Notification preferences", "settings"],
  offline: ["You're offline", "Changes are saved on this device and will sync when you reconnect.", "Try again", "Work offline", "sparkle"],
};

// tiny seeded random so the same seed always draws the same scene
function rng(seed) {
  let h = (seed * 2654435761) >>> 0 || 1;
  return () => ((h ^= h << 13), (h ^= h >>> 17), (h ^= h << 5), ((h >>> 0) % 10000) / 10000);
}

const S = { fill: "var(--ts-surface2)", stroke: "var(--ts-line)" };
const strong = { fill: "var(--ts-surface)", stroke: "color-mix(in srgb,var(--ts-ink) 22%,transparent)", strokeWidth: 1.5 };
const acc = "var(--ts-accent)";

function Scene({ kind, float, r }) {
  const line = (x, y, w, o = 1) => <rect x={x} y={y} width={w} height="5" rx="2.5" fill="color-mix(in srgb,var(--ts-ink) 14%,transparent)" opacity={o} />;
  if (kind === "search")
    return (<>
      <rect x="40" y="38" width="120" height="78" rx="10" {...S} />
      {line(54, 54, 60)}{line(54, 66, 84, 0.7)}{line(54, 78, 50, 0.5)}
      <motion.g {...float(0)}>
        <circle cx="128" cy="62" r="24" {...strong} />
        <circle cx="128" cy="62" r="16" fill="color-mix(in srgb,var(--ts-accent) 14%,transparent)" />
        <path d="M145 79l17 17" stroke={acc} strokeWidth="7" strokeLinecap="round" />
        <path d="M122 56l12 12M134 56l-12 12" stroke="var(--ts-ink2)" strokeWidth="2.4" strokeLinecap="round" />
      </motion.g>
    </>);
  if (kind === "inbox")
    return (<>
      <path d="M48 84l16-34h72l16 34v28a8 8 0 0 1-8 8H56a8 8 0 0 1-8-8z" {...S} />
      <path d="M48 84h32l6 10h28l6-10h32" fill="none" stroke="color-mix(in srgb,var(--ts-ink) 22%,transparent)" strokeWidth="1.5" />
      <motion.g {...float(0)}>
        <rect x="74" y="22" width="52" height="36" rx="6" {...strong} />
        <path d="M76 25l24 17 24-17" fill="none" stroke={acc} strokeWidth="2.2" strokeLinejoin="round" />
      </motion.g>
      <motion.path d="M156 40l3 7 7 3-7 3-3 7-3-7-7-3 7-3z" fill={acc} {...float(0.4)} />
    </>);
  if (kind === "offline")
    return (<>
      <rect x="44" y="54" width="112" height="62" rx="10" {...S} />
      {line(58, 70, 54)}{line(58, 82, 74, 0.6)}
      <motion.g {...float(0)}>
        <path d="M70 46a46 46 0 0 1 60 0" fill="none" stroke="color-mix(in srgb,var(--ts-ink) 22%,transparent)" strokeWidth="5" strokeLinecap="round" />
        <path d="M82 58a28 28 0 0 1 36 0" fill="none" stroke="color-mix(in srgb,var(--ts-ink) 22%,transparent)" strokeWidth="5" strokeLinecap="round" />
        <circle cx="100" cy="70" r="5" fill={acc} />
        <path d="M64 30l72 52" stroke={acc} strokeWidth="5" strokeLinecap="round" />
      </motion.g>
    </>);
  // projects: a fanned stack of cards and a floating plus
  return (<>
    <rect x="58" y="36" width="96" height="70" rx="10" {...S} transform="rotate(-9 106 71)" />
    <rect x="52" y="40" width="96" height="70" rx="10" {...S} transform="rotate(5 100 75)" />
    <rect x="50" y="44" width="100" height="72" rx="10" {...strong} />
    <rect x="60" y="54" width="80" height="34" rx="6" fill="color-mix(in srgb,var(--ts-accent) 18%,transparent)" />
    <path d={`M60 ${82 - r() * 6}l18-14 14 10 16-18 32 22`} fill="none" stroke={acc} strokeWidth="2" strokeLinejoin="round" opacity=".8" />
    {line(60, 96, 46)}{line(60, 105, 30, 0.6)}
    <motion.g {...float(0.2)}>
      <circle cx="150" cy="40" r="15" fill={acc} />
      <path d="M150 33v14M143 40h14" stroke="var(--ts-accent-ink)" strokeWidth="2.6" strokeLinecap="round" />
    </motion.g>
  </>);
}

/**
 * EmptyState — a generated illustration, one sentence of why, and one clear next action.
 * Signature: the illustration is drawn from theme tokens and a seed, so it matches every theme
 * and each seed scatters its own constellation of shapes; the hero object can float gently.
 * Kinds (the drawn scene): projects (first run), search (no results), inbox (all caught up), offline.
 * Shows only what you pass: no title, description or action labels means none are drawn. `demo` fills
 * blanks with sample copy and the kind's action icon. `illustration` or `icon` replace the drawn scene.
 * The ref goes to the root <section>.
 */
export const EmptyState = forwardRef(function EmptyState({
  kind = "projects",
  seed = 3,
  title = "",
  description = "",
  actionLabel = "",
  secondaryLabel = "",
  actionIcon,
  icon,
  illustration,
  showIllustration = true,
  framed = true,
  animate = false,
  loading = false,
  disabled = false,
  headingLevel = 3,
  forceState,
  demo = false,
  onAction,
  onSecondary,
  children,
  className,
  style,
  ...rest
}, ref) {
  const sheetTag = useStyles("ts-empty-state", CSS);
  const reduce = useReducedMotion();
  const tid = useId();
  const [dTitle, dDesc, dAction, dSecondary, dIcon] = demo ? (COPY[kind] ?? COPY.projects) : ["", "", "", "", null];
  const shownTitle = title || dTitle;
  const shownDesc = description || dDesc;
  const shownAction = actionLabel || dAction;
  const shownSecondary = secondaryLabel || dSecondary;
  const shownActionIcon = actionIcon ?? (dIcon ? <Icon name={dIcon} size={16} stroke={2.2} /> : undefined);
  const H = `h${Math.min(6, Math.max(1, headingLevel))}`;
  const moving = animate && !reduce;
  const float = (delay) => (moving ? { animate: { y: [0, -5, 0] }, transition: { duration: 3.6, repeat: Infinity, ease: "easeInOut", delay } } : {});
  const decor = useMemo(() => {
    const r = rng(seed + 1);
    const spots = [[24, 30], [176, 24], [18, 100], [184, 96], [36, 128], [166, 130], [100, 12], [10, 64], [192, 60]];
    return spots.map(([x, y], i) => ({ x: x + (r() - 0.5) * 14, y: y + (r() - 0.5) * 12, k: Math.floor(r() * 4), s: 1 + r() * 0.8, on: r() > 0.3, i }));
  }, [seed]);
  const sceneR = useMemo(() => rng(seed + 7), [seed, kind]);

  return (
    <>{sheetTag}<section ref={ref} className={"ts-empty" + (framed ? " is-framed" : "") + (className ? " " + className : "")} style={style}
      aria-labelledby={shownTitle ? tid : undefined} {...rest}>
      {illustration != null ? <div className="ts-empty__slot" aria-hidden>{illustration}</div>
        : icon != null ? <div className="ts-empty__icon" aria-hidden>{icon}</div>
        : showIllustration && (
      <svg className="ts-empty__art" viewBox="0 0 200 140" aria-hidden>
        <ellipse cx="100" cy="126" rx="70" ry="7" fill="color-mix(in srgb,var(--ts-ink) 7%,transparent)" />
        {decor.filter((d) => d.on).map((d) => {
          const c = d.i % 3 === 0 ? acc : "color-mix(in srgb,var(--ts-ink) 26%,transparent)";
          const shape =
            d.k === 0 ? <circle r={2.4 * d.s} fill={c} /> :
            d.k === 1 ? <circle r={4 * d.s} fill="none" stroke={c} strokeWidth="1.4" /> :
            d.k === 2 ? <path d={`M${-4 * d.s} 0h${8 * d.s}M0 ${-4 * d.s}v${8 * d.s}`} stroke={c} strokeWidth="1.6" strokeLinecap="round" /> :
            <rect x={-3 * d.s} y={-3 * d.s} width={6 * d.s} height={6 * d.s} rx="1.5" fill="none" stroke={c} strokeWidth="1.4" transform="rotate(20)" />;
          return (
            <g key={d.i} transform={`translate(${d.x} ${d.y})`}>
              <motion.g initial={moving ? { opacity: 0, scale: 0.4 } : false} animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.15 + d.i * 0.04, type: "spring", stiffness: 300, damping: 18 }}>
                {shape}
              </motion.g>
            </g>
          );
        })}
        <Scene kind={kind} float={float} r={sceneR} />
      </svg>
      )}
      {shownTitle && <H id={tid} className="ts-empty__title">{shownTitle}</H>}
      {shownDesc && <p className="ts-empty__desc">{shownDesc}</p>}
      {shownAction && <Button label={shownAction} simulate={false} loading={loading} disabled={disabled} onClick={onAction} icon={shownActionIcon} />}
      {shownSecondary && <button type="button" className="ts-empty__link" disabled={disabled} onClick={onSecondary}>{shownSecondary}</button>}
      {children && <div className="ts-empty__extra">{children}</div>}
    </section></>
  );
});
