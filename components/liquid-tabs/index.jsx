"use client";
import { forwardRef, isValidElement, useEffect, useId, useRef, useState } from "react";
import { useIsoLayoutEffect, useReducedMotion } from "../_shared/theme.jsx";
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform, animate } from "motion/react";
import { useMedia, PHONE, TOUCH } from "../_shared/media.js";
import { Icon } from "../_shared/icons.jsx";

const DEMO_TABS = ["Overview", "Activity", "Billing", "Team", "Settings"];
const SAMPLE = {
  Overview: { stat: "48.2k", sub: "visitors this week", delta: "+12.4%", seed: 1 },
  Activity: { stat: "1,204", sub: "events in the last hour", delta: "+3.1%", seed: 2 },
  Billing: { stat: "$8,940", sub: "monthly recurring", delta: "+6.8%", seed: 3 },
  Team: { stat: "23", sub: "active members", delta: "+2", seed: 4 },
  Settings: { stat: "14", sub: "integrations connected", delta: "—", seed: 5 },
};

/** Tabs may be plain labels or { id, label, icon, disabled, badge, panelId, content }. */
function normalise(tabs) {
  return (tabs ?? []).map((t, i) =>
    t !== null && typeof t === "object" && !isValidElement(t)
      ? { ...t, id: t.id ?? (typeof t.label === "string" ? t.label : i), label: t.label ?? String(t.id ?? "") }
      : { id: t, label: t }
  );
}

/**
 * LiquidTabs — the indicator's two edges are separate springs. The edge moving
 * toward the target uses `lead` stiffness, the other uses `trail`, so the pill
 * stretches then snaps. A slower droplet follows the centre and the goo filter
 * (blur → alpha threshold) fuses everything into one liquid shape.
 * The pill is three SVG shapes: two round caps ride `x` on the edge springs and
 * a flat body between them stretches, so the ends stay round however far it
 * stretches. Under reduced motion it jumps, with no stretch.
 * When the tabs outgrow their box the bar becomes a snapping, momentum-scrolling
 * rail with edge fades; the indicator lives on the scrolled track, so it tracks.
 * Keyboard follows the WAI-ARIA tabs pattern: roving tabindex, Left/Right,
 * Home/End, selection follows focus.
 *
 * Content: `tabs` are labels or { id, label, icon, disabled, badge, panelId, content }. The selected tab is
 * `value` / `defaultValue` (a tab's id, or its index) and `onChange(index, label, id)` reports a pick.
 * Panels: pass `renderPanel(label, index, tab)` or a `content` node per tab and the component renders the
 * tabpanel; or render your own panels and give each tab its panel id (`panelId` on the tab, or a
 * `panelId(index, tab)` function), and the tab's id is that panel id + "-tab". Colours come from the theme
 * (--ts-accent / --ts-accent-ink on a --ts-surface track) unless `accent` is set. `demo` shows sample tabs and
 * a sample panel.
 */
export const LiquidTabs = forwardRef(function LiquidTabs({
  tabs = [],
  value,
  defaultValue,
  goo = 8,
  droplet = true,
  lead = 520,
  trail = 130,
  damping = 26,
  pillRadius = 30,
  padding = 6,
  accent = "",
  accentInk,
  showContent = true,
  disabled = [],
  ariaLabel = "Sections",
  renderPanel,
  panelId,
  align = "center",
  demo = false,
  onChange,
  forceState, // the gallery's forced-state switch: "focus" rings the selected tab, "disabled" disables every tab
  className,
  style,
  ...rest
}, ref) {
  const reduce = !!useReducedMotion();
  const list = normalise(tabs?.length ? tabs : demo ? DEMO_TABS : []);
  const n = list.length;
  const isOff = (i) => {
    const t = list[i];
    if (!t) return true;
    return disabled === true || forceState === "disabled" || !!t.disabled || (Array.isArray(disabled) && (disabled.includes(i) || disabled.includes(t.id) || disabled.includes(t.label)));
  };
  const firstOn = () => { for (let i = 0; i < n; i++) if (!isOff(i)) return i; return 0; };
  const indexOf = (v) => {
    if (v === undefined || v === null) return -1;
    const i = list.findIndex((t) => t.id === v);
    if (i >= 0) return i;
    return typeof v === "number" && Number.isInteger(v) && v >= 0 && v < n ? v : -1;
  };
  // one pattern for controlled / uncontrolled: `value` wins; otherwise the component keeps the picked tab's id
  const controlled = value !== undefined;
  const [inner, setInner] = useState(() => { const i = indexOf(defaultValue); return list[i >= 0 ? i : firstOn()]?.id; });
  const found = indexOf(controlled ? value : inner);
  const active = found >= 0 ? found : firstOn();
  // panel slide direction follows whichever way the selection moved, however it moved
  const last = useRef(active);
  const dirRef = useRef(1);
  if (last.current !== active) { dirRef.current = active > last.current ? 1 : -1; last.current = active; }
  const dir = dirRef.current;

  const refs = useRef([]);
  refs.current.length = n;
  const ready = useRef(false);
  const [tick, setTick] = useState(0);
  useEffect(() => { document.fonts?.ready.then(() => { ready.current = false; setTick((t) => t + 1); }); }, []);
  const uid = useId().replace(/:/g, "");
  const fid = "goo" + uid;
  const ownPanel = (i) => list[i]?.panelId ?? (typeof panelId === "function" ? panelId(i, list[i]) : null);
  const owns = panelId != null || list.some((t) => t.panelId);
  const tabId = (i) => { const c = ownPanel(i); return c ? `${c}-tab` : typeof panelId === "string" ? `${panelId}-tab-${i}` : `ltab-${uid}-${i}`; };
  const pnlId = (i) => ownPanel(i) ?? (typeof panelId === "string" ? panelId : `lpanel-${uid}-${i}`);
  const hasContent = list.some((t) => t.content !== undefined);
  const panelOn = showContent && n > 0 && (!!renderPanel || hasContent || demo);
  const demoPanel = panelOn && !renderPanel && !hasContent;

  // colours: the theme's accent pair unless the caller picks an accent (then the label is white, as before)
  const fillC = accent || "var(--ts-accent)";
  const inkC = accentInk ?? (!accent ? "var(--ts-accent-ink)" : accent === "var(--ts-ink)" ? "var(--ts-bg)" : "white");

  // rail state: is the track wider than its box, and is there more to scroll on each side?
  const rail = useRef(null);
  const [fade, setFade] = useState({ l: false, r: false });
  const phone = useMedia(PHONE);
  const touch = useMedia(TOUCH);
  const measure = () => {
    const el = rail.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    const l = el.scrollLeft > 2, r = el.scrollLeft < max - 2;
    setFade((f) => (f.l === l && f.r === r ? f : { l, r }));
  };
  useIsoLayoutEffect(() => {
    const el = rail.current;
    if (!el) return;
    let w = -1;
    const ro = new ResizeObserver(() => {
      measure();
      // the track itself changed size (phone padding, fonts, new labels): re-seat the pill without a glide
      const tw = el.firstElementChild.offsetWidth;
      if (w >= 0 && tw !== w) { ready.current = false; setTick((t) => t + 1); }
      w = tw;
    });
    ro.observe(el);
    ro.observe(el.firstElementChild);
    return () => ro.disconnect();
  }, [n > 0]);

  // edges of the pill (track coordinates) and its height, which is also the cap size
  const l = useMotionValue(0);
  const r = useMotionValue(0);
  const H = useMotionValue(0);
  const center = useTransform([l, r], ([a, b]) => (a + b) / 2);
  const drop = useSpring(center, { stiffness: 70, damping: 11, mass: 0.9 });
  const capR = useTransform([r, H], ([b, h]) => b - h);
  // a cap's corner radius, capped at half its height like CSS border-radius
  const capRx = useTransform(H, (h) => Math.min(pillRadius, h / 2));
  const bodyX = useTransform([l, H], ([a, h]) => a + h / 2);
  const bodyW = useTransform([l, r, H], ([a, b, h]) => Math.max(0, b - a - h));

  useIsoLayoutEffect(() => {
    const el = refs.current[active];
    if (!el) return;
    const L = el.offsetLeft, R = L + el.offsetWidth;
    H.set(el.offsetHeight);
    if (!ready.current || reduce) {
      // first paint, a re-measure, or reduced motion: jump straight to the tab (jump also stops any spring in flight)
      l.jump(L); r.jump(R); drop.jump((L + R) / 2); ready.current = true;
      return;
    }
    const right = R > r.get();
    animate(r, R, { type: "spring", stiffness: right ? lead : trail, damping });
    animate(l, L, { type: "spring", stiffness: right ? trail : lead, damping });
  }, [active, lead, trail, damping, padding, n, tick, reduce, touch]);

  // bring the selected tab (and a peek of its neighbour) into view without moving the page, however it was selected
  const seen = useRef(false);
  useEffect(() => {
    if (!seen.current) { seen.current = true; return; }
    const el = rail.current, tab = refs.current[active];
    if (el && tab && el.scrollWidth > el.clientWidth) {
      el.scrollTo({ left: tab.offsetLeft + tab.offsetWidth / 2 - el.clientWidth / 2, behavior: reduce ? "auto" : "smooth" });
    }
  }, [active]);

  const pick = (i) => {
    if (isOff(i) || i === active) return;
    if (!controlled) setInner(list[i].id);
    onChange?.(i, list[i].label, list[i].id);
  };
  // arrow keys move focus and selection together (automatic activation); disabled tabs are skipped
  const onKey = (e) => {
    const from = Math.max(0, refs.current.indexOf(e.target));
    const step = (start, d) => { for (let k = 1; k <= n; k++) { const j = (((start + d * k) % n) + n) % n; if (!isOff(j)) return j; } return -1; };
    let to = -1;
    if (e.key === "ArrowRight") to = step(from, 1);
    else if (e.key === "ArrowLeft") to = step(from, -1);
    else if (e.key === "Home") to = step(-1, 1);
    else if (e.key === "End") to = step(n, -1);
    else return;
    e.preventDefault();
    if (to < 0) return;
    refs.current[to]?.focus({ preventScroll: true });
    pick(to);
  };
  const cur = list[active];
  const data = demoPanel ? SAMPLE[cur?.label] ?? { stat: "—", sub: cur?.label, delta: "", seed: active } : null;
  const items = { start: "flex-start", stretch: "stretch", end: "flex-end" }[align] ?? "center";

  if (!n) return <div ref={ref} className={className} style={style} {...rest} />;

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={demo ? { opacity: 0, y: reduce ? 0 : 24 } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 140, damping: 18 }}
      style={{ display: "flex", flexDirection: "column", alignItems: items, gap: 22, maxWidth: "100%", color: "var(--ts-ink)", ...style }}
      {...rest}
    >
      <style dangerouslySetInnerHTML={{ __html: `.ts-ltabs-scroll::-webkit-scrollbar{display:none}.ts-ltab{all:unset}.ts-ltab:focus-visible,.ts-ltab[data-force=focus]{outline:2px solid var(--ts-focus,currentColor);outline-offset:-3px;border-radius:99px}.ts-ltabs-panel:focus-visible{outline:2px solid var(--ts-focus,currentColor);outline-offset:2px}.ts-ltab[aria-selected=true]:focus-visible,.ts-ltab[aria-selected=true][data-force=focus]{outline-color:currentColor}.ts-ltab-badge{display:inline-grid;place-items:center;min-width:18px;height:18px;box-sizing:border-box;padding:0 5px;border-radius:99px;font-size:11px;font-weight:600;font-variant-numeric:tabular-nums;line-height:1;background:color-mix(in srgb,currentColor 16%,transparent)}` }} />
      <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden>
        <filter id={fid}>
          <feGaussianBlur in="SourceGraphic" stdDeviation={goo} result="b" />
          <feColorMatrix in="b" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 22 -10" result="g" />
          <feComposite in="SourceGraphic" in2="g" operator="atop" />
        </filter>
      </svg>

      {/* outer element scrolls on narrow screens; inner track holds tabs + liquid layer at full width so the goo filter never clips */}
      <div style={{ boxSizing: "border-box", maxWidth: "100%", padding, borderRadius: pillRadius + padding, background: "var(--ts-surface)", boxShadow: "var(--ts-shadow), inset 0 0 0 1px var(--ts-line)" }}>
      <div
        ref={rail}
        className="ts-ltabs-scroll"
        onScroll={measure}
        style={{
          maxWidth: "100%", overflowX: "auto", overscrollBehaviorX: "contain", scrollbarWidth: "none", scrollSnapType: "x proximity", borderRadius: pillRadius, WebkitOverflowScrolling: "touch",
          maskImage: railMask(fade), WebkitMaskImage: railMask(fade), transition: "-webkit-mask-image .2s",
        }}
      >
      <div role="tablist" aria-label={ariaLabel} aria-orientation="horizontal" onKeyDown={onKey} style={{ position: "relative", display: "flex", width: align === "stretch" ? "100%" : "max-content", minWidth: "max-content" }}>
        {/* the liquid layer is SVG shapes filtered inside SVG: a CSS url() filter on an HTML element ended the page in a pre-release Safari */}
        <svg aria-hidden width="100%" height="100%" style={{ position: "absolute", inset: 0, overflow: "visible", pointerEvents: "none" }}>
          <g filter={goo > 0 ? `url(#${fid})` : undefined} style={{ fill: fillC }}>
            {/* pill = left cap + body + right cap; the body's ends sit inside the caps, so no seam shows even without goo */}
            <motion.rect data-part="pill-body" x={bodyX} y={0} width={bodyW} height="100%" />
            <motion.rect data-part="pill-cap" x={l} y={0} width={H} height="100%" rx={capRx} />
            <motion.rect data-part="pill-cap" x={capR} y={0} width={H} height="100%" rx={capRx} />
            {droplet && !reduce && <motion.circle cx={drop} cy="50%" r={15} />}
          </g>
        </svg>
        {list.map((t, i) => {
          const on = i === active, off = isOff(i);
          return (
            <button
              key={String(t.id)}
              ref={(el) => (refs.current[i] = el)}
              type="button"
              role="tab"
              id={tabId(i)}
              aria-selected={on}
              aria-controls={owns || (panelOn && on) ? pnlId(i) : undefined}
              aria-disabled={off || undefined}
              tabIndex={on ? 0 : -1}
              data-force={forceState === "focus" && on ? "focus" : undefined}
              onClick={() => pick(i)}
              className="ts-ltab"
              style={{ position: "relative", zIndex: 1, display: "inline-flex", alignItems: "center", gap: 7, ...(align === "stretch" ? { flex: "1 1 0", justifyContent: "center" } : null), padding: touch ? "13px 16px" : "11px 18px", lineHeight: touch ? "18px" : undefined, fontSize: 14, fontWeight: 500, cursor: off ? "not-allowed" : "pointer", color: on ? inkC : "var(--ts-ink2)", opacity: off ? 0.38 : 1, transition: "color .3s", whiteSpace: "nowrap", scrollSnapAlign: "center", WebkitTapHighlightColor: "transparent" }}
            >
              {typeof t.icon === "string" ? <Icon name={t.icon} size={16} /> : t.icon ?? null}
              {t.label}
              {t.badge != null && t.badge !== false && t.badge !== "" && <span className="ts-ltab-badge">{t.badge}</span>}
            </button>
          );
        })}
      </div>
      </div>
      </div>

      {panelOn && (
        <div
          role="tabpanel"
          id={pnlId(active)}
          aria-labelledby={tabId(active)}
          tabIndex={0}
          className="ts-ltabs-panel"
          style={{ position: "relative", boxSizing: "border-box", width: demoPanel ? 460 : "100%", maxWidth: "100%", ...(demoPanel ? { height: 190 } : {}), borderRadius: 24, background: "color-mix(in srgb, var(--ts-surface) 70%, transparent)", backdropFilter: "blur(12px)", boxShadow: "var(--ts-shadow), inset 0 0 0 1px var(--ts-line)", overflow: "hidden" }}
        >
          <AnimatePresence mode="popLayout" custom={dir} initial={false}>
            <motion.div
              key={String(cur.id)}
              custom={dir}
              variants={{
                enter: (d) => ({ x: reduce ? 0 : d * 60, opacity: 0, filter: reduce ? "blur(0px)" : "blur(10px)" }),
                center: { x: 0, opacity: 1, filter: "blur(0px)" },
                exit: (d) => ({ x: reduce ? 0 : -d * 60, opacity: 0, filter: reduce ? "blur(0px)" : "blur(10px)" }),
              }}
              initial="enter" animate="center" exit="exit"
              transition={reduce ? { duration: 0.15, ease: "easeOut" } : { type: "spring", stiffness: 260, damping: 28 }}
              style={!demoPanel
                ? { padding: phone ? 20 : 24 }
                : { position: "absolute", inset: 0, padding: phone ? 20 : 24, display: "flex", justifyContent: "space-between", gap: 8 }}
            >
              {renderPanel ? renderPanel(cur.label, active, cur) : hasContent ? cur.content ?? null : (
                <>
                  <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                    <span style={{ fontFamily: "var(--ts-font-mono)", fontSize: phone ? 11 : 10, letterSpacing: ".14em", textTransform: "uppercase", color: "var(--ts-ink2)" }}>{cur.label}</span>
                    <div>
                      <div style={{ fontSize: phone ? 40 : 44, whiteSpace: "nowrap", fontWeight: 600, letterSpacing: "-0.045em", color: "var(--ts-ink)", lineHeight: 1 }}>{data.stat}</div>
                      <div style={{ fontSize: 13, color: "var(--ts-ink2)", marginTop: 6 }}>
                        {data.sub} <span style={{ color: fillC, fontWeight: 600 }}>{data.delta}</span>
                      </div>
                    </div>
                  </div>
                  <Spark seed={data.seed} color={fillC} w={phone ? 132 : 180} />
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
});


const railMask = ({ l, r }) =>
  `linear-gradient(90deg, ${l ? "transparent" : "black"} 0, black ${l ? 36 : 0}px, black calc(100% - ${r ? 36 : 0}px), ${r ? "transparent" : "black"} 100%)`;

function Spark({ seed, color, w = 180 }) {
  const pts = Array.from({ length: 12 }, (_, i) => {
    const v = Math.sin(i * 0.9 + seed * 1.7) * 0.5 + Math.sin(i * 0.37 + seed) * 0.35 + i * 0.06;
    return [i * 16, 100 - (v + 1) * 40];
  });
  const d = pts.map((p, i) => (i ? "L" : "M") + p[0] + " " + p[1]).join(" ");
  return (
    <svg width={w} height={(w * 140) / 180} viewBox="-4 0 184 120" aria-hidden="true" style={{ alignSelf: "center", flexShrink: 0 }}>
      <defs>
        <linearGradient id={"sf" + seed} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" style={{ stopColor: color, stopOpacity: 0.28 }} />
          <stop offset="1" style={{ stopColor: color, stopOpacity: 0 }} />
        </linearGradient>
      </defs>
      <motion.path d={d + " L 176 120 L 0 120 Z"} fill={`url(#sf${seed})`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} />
      <motion.path d={d} fill="none" style={{ stroke: color }} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.9, ease: [0.2, 0.8, 0.2, 1] }} />
      <circle cx={pts[11][0]} cy={pts[11][1]} r="4" style={{ fill: color }} />
    </svg>
  );
}
