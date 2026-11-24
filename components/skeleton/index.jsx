"use client";
import { forwardRef, useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { registerStyles, useStyles, useReducedMotion } from "../_shared/theme.jsx";
import { Icon } from "../_shared/icons.jsx";

const CSS = `
.ts-skel{position:relative;width:var(--sk-w);max-width:100%;font-family:var(--ts-font);color:var(--ts-ink)}
.ts-skel__lines{display:flex;flex-direction:column}
.ts-skel__frame{border-radius:var(--ts-radius-lg);background:var(--ts-surface);box-shadow:0 0 0 1px var(--ts-line);overflow:hidden}
.ts-skel{--sk-base:color-mix(in srgb,var(--ts-surface2) 90%,var(--ts-ink));--sk-hi:color-mix(in srgb,var(--ts-surface2) 78%,var(--ts-ink))}
.ts-skel__b{display:block;border-radius:var(--ts-radius-sm);
  background:linear-gradient(100deg,var(--sk-base) 30%,var(--sk-hi) 50%,var(--sk-base) 70%) var(--sk-base);
  background-size:200vw 100%;background-attachment:fixed;animation:ts-skel-wave var(--sk-speed) linear infinite}
.ts-skel.is-still .ts-skel__b{animation:none}
@keyframes ts-skel-wave{from{background-position:100vw 0}to{background-position:-100vw 0}}
@media (prefers-reduced-motion:reduce){.ts-skel__b{animation:ts-skel-pulse 2s ease-in-out infinite;background:var(--sk-base)}}
@keyframes ts-skel-pulse{0%,100%{opacity:1}50%{opacity:.6}}
.ts-skel__round{border-radius:99px}
.ts-skel__pad{padding:16px;display:flex;flex-direction:column;gap:10px}
.ts-skel__row{display:flex;align-items:center;gap:12px;padding:12px 16px;border-top:1px solid var(--ts-line)}
.ts-skel__row:first-child{border-top:0}
.ts-skel__col{display:flex;flex-direction:column;gap:7px;flex:1;min-width:0}
.ts-skel__img{aspect-ratio:16/9;display:grid;place-items:center;background:linear-gradient(135deg,color-mix(in srgb,var(--ts-accent) 30%,var(--ts-surface2)),var(--ts-surface2));color:var(--ts-accent)}
.ts-skel__avatar{display:grid;place-items:center;flex:none;border-radius:99px;background:color-mix(in srgb,var(--ts-accent) 22%,var(--ts-surface2));color:var(--ts-ink);font-size:13px;font-weight:650}
.ts-skel__title{font-size:15px;font-weight:620;letter-spacing:-0.01em}
.ts-skel__text{font-size:13px;color:var(--ts-ink2);line-height:1.5}
.ts-skel__meta{font-family:var(--ts-font-mono);font-size:11px;color:var(--ts-ink2)}
.ts-skel__pill{display:inline-flex;align-items:center;height:24px;padding:0 9px;border-radius:99px;font-size:11.5px;font-weight:600;background:var(--ts-surface2);color:var(--ts-ink)}
`;
registerStyles("ts-skeleton", CSS);

const B = ({ w = "100%", h = 12, round, style }) => <span className={"ts-skel__b" + (round ? " ts-skel__round" : "")} style={{ width: w, height: h, ...style }} />;

const PEOPLE = [["Maya Chen", "Design lead", "MC", "Online"], ["Tomás Rey", "Motion", "TR", "In a call"], ["Ife Adebayo", "Research", "IA", "Away"], ["Jonah Park", "Engineering", "JP", "Online"]];

// each layout returns [skeleton, real], drawn to roughly the same geometry so the swap barely shifts
const LAYOUTS = {
  card: (rows, o) => [
    <div className={o.framed ? "ts-skel__frame" : undefined} key="s">
      <B h="auto" style={{ aspectRatio: "16/9", borderRadius: 0 }} />
      <div className="ts-skel__pad">
        <B w="62%" h={16} />
        {Array.from({ length: rows }, (_, i) => <B key={i} w={i === rows - 1 ? "48%" : "100%"} h={11} />)}
        <div style={{ display: "flex", gap: 8, marginTop: 4 }}><B w={64} h={24} round /><B w={52} h={24} round /></div>
      </div>
    </div>,
    <div className="ts-skel__frame" key="r">
      <div className="ts-skel__img"><Icon name="image" size={30} /></div>
      <div className="ts-skel__pad">
        <span className="ts-skel__title">Northwind rebrand</span>
        <span className="ts-skel__text">{["A quieter wordmark, a warmer palette and a type system built for small screens first.", "Shipped to 14 markets in six weeks."].slice(0, Math.max(1, rows - 1)).join(" ")}</span>
        <div style={{ display: "flex", gap: 8, marginTop: 4 }}><span className="ts-skel__pill">Branding</span><span className="ts-skel__pill">2026</span></div>
      </div>
    </div>,
  ],
  list: (rows, o) => [
    <div className={o.framed ? "ts-skel__frame" : undefined} key="s">
      {Array.from({ length: rows }, (_, i) => (
        <div className="ts-skel__row" key={i} style={o.framed ? undefined : { paddingLeft: 0, paddingRight: 0 }}>
          {o.avatar && <B w={36} h={36} round style={{ flex: "none" }} />}
          <div className="ts-skel__col"><B w={`${54 - (i % 3) * 8}%`} h={12} /><B w={`${34 + (i % 2) * 10}%`} h={10} /></div>
          {o.trailing && <B w={58} h={22} round style={{ flex: "none" }} />}
        </div>
      ))}
    </div>,
    <div className="ts-skel__frame" key="r">
      {Array.from({ length: rows }, (_, i) => {
        const [n, role, ini, st] = PEOPLE[i % PEOPLE.length];
        return (
          <div className="ts-skel__row" key={i}>
            <span className="ts-skel__avatar" style={{ width: 36, height: 36 }}>{ini}</span>
            <div className="ts-skel__col" style={{ gap: 2 }}><span style={{ fontSize: 14, fontWeight: 580 }}>{n}</span><span className="ts-skel__meta">{role}</span></div>
            <span className="ts-skel__pill">{st}</span>
          </div>
        );
      })}
    </div>,
  ],
  article: (rows) => [
    <div key="s" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <B w={90} h={10} />
      <B w="88%" h={26} /><B w="56%" h={26} />
      <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "6px 0" }}><B w={28} h={28} round /><B w={140} h={11} /></div>
      {Array.from({ length: rows + 2 }, (_, i) => <B key={i} w={i % 4 === 3 ? "70%" : "100%"} h={12} />)}
    </div>,
    <div key="r" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <span className="ts-skel__meta" style={{ textTransform: "uppercase", letterSpacing: ".12em" }}>Field notes</span>
      <span style={{ fontSize: 26, fontWeight: 680, letterSpacing: "-0.025em", lineHeight: 1.15 }}>What we learned shipping motion to a million phones</span>
      <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "6px 0" }}><span className="ts-skel__avatar" style={{ width: 28, height: 28, fontSize: 11 }}>MC</span><span className="ts-skel__meta">Maya Chen · 6 min read</span></div>
      <span className="ts-skel__text" style={{ fontSize: 14, lineHeight: 1.7 }}>
        Springs beat curves for anything a finger touches, but only if they settle fast. We cut every interaction to under 400 ms, tested on the slowest phone we could buy, and dropped any effect that cost a frame.
        {rows > 3 ? " The surprise was how much calmer the product felt once loading states stopped racing." : ""}
      </span>
    </div>,
  ],
};

// circle diameter in px (layout "circle"): sm stands in for a small avatar (28px), lg for a profile photo or app icon
const SIZES = { sm: 28, md: 40, lg: 56 };
const len = (v) => (typeof v === "number" ? v + "px" : v);
// primitive shapes for composing your own layout; they have no "real" side (pass children for that)
const SHAPES = {
  text: (rows, o) => (
    <div className="ts-skel__lines" style={{ gap: o.gap }}>
      {Array.from({ length: rows }, (_, i) => (
        <B key={i} w={len(o.widths?.[i] ?? (rows > 1 && i === rows - 1 ? "60%" : "100%"))} h={o.height ?? 12} style={o.radius != null ? { borderRadius: len(o.radius) } : undefined} />
      ))}
    </div>
  ),
  circle: (rows, o) => <B w={o.size} h={o.size} round />,
  rect: (rows, o) => <B w="100%" h={len(o.height ?? 96)} style={o.radius != null ? { borderRadius: len(o.radius) } : undefined} />,
};

/**
 * Skeleton — placeholder in the exact shape of the content it stands in for.
 * Layouts: card, list, article (whole blocks) and text, circle, rect (primitives you compose into your own row or card).
 * Signature: one continuous shimmer wave travels across every block, as if lit by the same light (even across
 * separate Skeletons), and when `loading` turns false your `children` crossfade in with a short blur-to-sharp settle.
 * Shows no sample content: `demo` adds the gallery's sample card, list and article for the loaded side.
 * The ref goes to the root, which carries aria-busy and a hidden "Loading" label.
 */
export const Skeleton = forwardRef(function Skeleton({
  layout = "card",
  loading = true,
  rows = 3,
  width = 360,
  height,
  size = "md",
  radius,
  widths,
  gap = 8,
  framed = true,
  avatar = true,
  trailing = true,
  speed = 1.8,
  shimmer = true,
  label = "Loading",
  cycle = false,
  demo = false,
  children,
  className,
  style,
  forceState,
  ...rest
}, ref) {
  const sheetTag = useStyles("ts-skeleton", CSS);
  const reduce = useReducedMotion();
  const [tick, setTick] = useState(loading);
  useEffect(() => { setTick(loading); }, [loading]);
  useEffect(() => {
    if (!cycle) return;
    const t = setInterval(() => setTick((x) => !x), 2400);
    return () => clearInterval(t);
  }, [cycle]);
  const isLoading = forceState === "loading" || (cycle ? tick : loading);
  const px = typeof size === "number" ? size : SIZES[size] ?? SIZES.md;
  const o = { framed, avatar, trailing, height, size: px, radius, widths, gap };
  const n = Math.max(1, rows);
  let skel, real;
  if (SHAPES[layout]) skel = SHAPES[layout](n, o);
  else [skel, real] = (LAYOUTS[layout] ?? LAYOUTS.card)(n, o);
  const loaded = children ?? (demo ? real : null);
  const w = layout === "circle" ? px : width;

  return (
    <>{sheetTag}<div ref={ref} className={"ts-skel" + (shimmer ? "" : " is-still") + (className ? " " + className : "")}
      style={{ "--sk-w": len(w), "--sk-speed": speed + "s", ...style }} aria-busy={isLoading} {...rest}>
      <AnimatePresence mode="popLayout" initial={false}>
        {(isLoading || loaded != null) && (
          <motion.div
            key={isLoading ? "s" : "r"}
            initial={reduce ? { opacity: 0 } : { opacity: 0, filter: "blur(4px)" }}
            animate={{ opacity: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, transition: { duration: 0.18 } }}
            transition={{ duration: 0.32, ease: [0.2, 0.8, 0.2, 1] }}
            aria-hidden={isLoading || undefined}
          >
            {isLoading ? skel : loaded}
          </motion.div>
        )}
      </AnimatePresence>
      {isLoading && label && <span className="ts-sr">{label}</span>}
    </div></>
  );
});
