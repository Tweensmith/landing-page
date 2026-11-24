"use client";
import { forwardRef, useCallback, useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { registerStyles, useStyles, useIsoLayoutEffect, useLocale, useReducedMotion } from "../_shared/theme.jsx";
import { Icon } from "../_shared/icons.jsx";

// The same sizes, type and status-mark sizes as Avatar Group, so the two read as one family.
const SIZES = { sm: { s: 28, fs: 11, d: 8 }, md: { s: 36, fs: 13, d: 10 }, lg: { s: 44, fs: 15, d: 12 } };
const dims = (size) => {
  if (typeof size === "number" && Number.isFinite(size)) {
    const s = Math.round(Math.max(16, Math.min(128, size)));
    return { s, fs: Math.max(7, Math.round(s * 0.36)), d: Math.max(6, Math.min(26, Math.round(s * 0.27))) };
  }
  return SIZES[size] ?? SIZES.md;
};
const STATUS_WORD = { online: "online", away: "away", busy: "busy", offline: "offline" };

/** Initials from a name: first letter of the first and last word. Handles one word, extra spaces, non-Latin names.
 *  Upper-cased in `locale` (Avatar passes the Theme's). */
export function initialsOf(name, locale = "en-US") {
  const words = String(name ?? "").trim().split(/\s+/).filter(Boolean);
  if (!words.length) return "";
  const first = (w) => { const m = w.match(/[\p{L}\p{N}]/u); return m ? m[0] : Array.from(w)[0] ?? ""; };
  const a = first(words[0]);
  const b = words.length > 1 ? first(words[words.length - 1]) : "";
  return (a + b).toLocaleUpperCase(locale);
}
// the identity colour: the same hash Avatar Group uses, so a name gets the same tint in both
const hashHue = (s) => { let h = 0; for (const ch of String(s)) h = (h * 31 + ch.codePointAt(0)) >>> 0; return h % 8; };

const isDev = (() => { try { return import.meta.env?.DEV ?? true; } catch { return true; } })();

const CSS = `
.ts-av{all:unset;box-sizing:border-box;position:relative;display:inline-flex;flex:none;vertical-align:middle;width:var(--av-s);height:var(--av-s);font-family:var(--ts-font);color:var(--ts-ink);
  --av-r:50%;--av-ring-c:var(--ts-avatar-ring,var(--ts-surface));-webkit-tap-highlight-color:transparent}
.ts-av[data-shape=rounded]{--av-r:min(var(--ts-radius-md),calc(var(--av-s) * .3))}
.ts-av__lift{position:absolute;inset:0;transition:transform .26s cubic-bezier(.3,1.45,.5,1)}
.ts-av__face{position:absolute;inset:0;display:grid;place-items:center;overflow:hidden;border-radius:var(--av-r);
  font-size:var(--av-fs);font-weight:650;letter-spacing:-0.01em;line-height:1;color:var(--ts-ink);
  background:color-mix(in srgb,var(--av-id) 26%,var(--ts-surface));transition:background-color .3s,box-shadow .2s}
.ts-av__face::after{content:"";position:absolute;inset:0;border-radius:inherit;pointer-events:none;box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--av-id) 45%,transparent);transition:box-shadow .3s}
.ts-av__face[data-photo=true]::after{box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--ts-ink) 10%,transparent)}
.ts-av[data-tint=none] .ts-av__face{background:var(--ts-surface2)}
.ts-av[data-tint=none] .ts-av__face::after{box-shadow:inset 0 0 0 1px var(--ts-line)}
.ts-av[data-ring=true] .ts-av__face{box-shadow:0 0 0 2px var(--av-ring-c)}
.ts-av__ini{grid-area:1/1;display:grid;place-items:center;white-space:nowrap;user-select:none}
.ts-av__ini[data-glyph=true]{color:var(--ts-ink2)}
.ts-av__img{grid-area:1/1;position:absolute;inset:0;width:100%;height:100%;object-fit:cover;border-radius:inherit;user-select:none;-webkit-user-drag:none}
.ts-av__skel{position:absolute;inset:0;border-radius:var(--av-r);background:color-mix(in srgb,var(--ts-surface2) 88%,var(--ts-ink));animation:ts-av-pulse 1.6s ease-in-out infinite}
@keyframes ts-av-pulse{0%,100%{opacity:1}50%{opacity:.55}}
.ts-av__status{position:absolute;right:-1px;bottom:-1px;width:var(--av-d);height:var(--av-d);border-radius:50%;overflow:hidden;pointer-events:none;
  background:var(--av-sc,var(--ts-success));box-shadow:0 0 0 2px var(--av-ring-c);transition:background-color .3s,opacity .3s}
.ts-av[data-shape=rounded] .ts-av__status{right:-2px;bottom:-2px}
.ts-av__status[data-s=away]{--av-sc:var(--ts-warning)}
.ts-av__status[data-s=busy]{--av-sc:var(--ts-danger)}
.ts-av__status[data-s=offline]{--av-sc:var(--ts-ink3)}
.ts-av__hole,.ts-av__bar{position:absolute;left:50%;top:50%;background:var(--av-ring-c)}
.ts-av__hole{width:56%;height:56%;margin:-28% 0 0 -28%;border-radius:50%;transform:scale(0);transition:transform .34s cubic-bezier(.3,1.4,.5,1)}
.ts-av__bar{width:60%;height:24%;margin:-12% 0 0 -30%;border-radius:99px;transform:scaleX(0);transition:transform .3s cubic-bezier(.3,1.3,.5,1)}
.ts-av__status[data-s=away] .ts-av__hole{transform:scale(1)}
.ts-av__status[data-s=offline] .ts-av__hole{transform:scale(1.32)}
.ts-av__status[data-s=busy] .ts-av__bar{transform:scaleX(1)}
.ts-av__badge{position:absolute;top:14.6%;right:14.6%;transform:translate(50%,-50%);display:inline-grid;place-items:center;line-height:1;pointer-events:none}
.ts-av[data-shape=rounded] .ts-av__badge{top:0;right:0;transform:translate(35%,-35%)}
a.ts-av,button.ts-av{cursor:pointer}
.ts-av[data-act=true]:not([aria-disabled=true]):hover .ts-av__lift,.ts-av[data-force=hover] .ts-av__lift{transform:translateY(-1px) scale(1.05)}
.ts-av[data-act=true]:not([aria-disabled=true]):active .ts-av__lift,.ts-av[data-force=active] .ts-av__lift{transform:scale(.93);transition-duration:.12s}
.ts-av[data-act=true]:focus-visible{outline:none}
.ts-av[data-act=true]:focus-visible .ts-av__face,.ts-av[data-force=focus] .ts-av__face{box-shadow:0 0 0 2px var(--av-ring-c),0 0 0 4px var(--ts-focus)}
/* the ring is there the moment focus arrives (it still fades out on leaving) */
.ts-av[data-act=true]:focus-visible .ts-av__face{transition:background-color .3s}
.ts-av[aria-disabled=true]{cursor:not-allowed;opacity:.5}
.ts-av[data-act=true]::before{content:"";position:absolute;inset:0;border-radius:var(--av-r)}
@media (pointer:coarse){.ts-av[data-act=true]::before{inset:min(0px,calc((var(--av-s) - 44px) / 2))}}
@media (prefers-reduced-motion:reduce){.ts-av__lift,.ts-av__hole,.ts-av__bar{transition:none}.ts-av__skel{animation:none}
  .ts-av[data-act=true]:hover .ts-av__lift,.ts-av[data-act=true]:active .ts-av__lift{transform:none}}

.ts-av-demo{--ts-avatar-ring:var(--ts-bg);display:flex;flex-direction:column;gap:14px;width:min(440px,100%);font-family:var(--ts-font);color:var(--ts-ink)}
.ts-av-demo__head{display:flex;align-items:center;gap:12px;min-width:0}
.ts-av-demo__who{display:flex;flex-direction:column;gap:3px;min-width:0}
.ts-av-demo__who b{font-size:14px;font-weight:620;letter-spacing:-0.01em}
.ts-av-demo__who span{font-size:13px;color:var(--ts-ink2);line-height:1.4}
.ts-av-demo__msg{margin:0 0 0 56px;font-size:13.5px;line-height:1.5;color:var(--ts-ink)}
.ts-av-demo__row{display:flex;align-items:center;flex-wrap:wrap;gap:8px;margin-left:56px;padding-top:12px;border-top:1px solid var(--ts-line)}
.ts-av-demo__lbl{margin-right:4px;font-size:12.5px;color:var(--ts-ink2)}
@media (max-width:640px){.ts-av-demo__msg,.ts-av-demo__row{margin-left:0}}
`;
registerStyles("ts-avatar", CSS);

/* ---------------------------------------------------------------- sample content (demo only)
   A comment in an invented field-survey workspace. The portraits are drawn here as small SVG images. */
function portrait({ bg, bg2, skin, hair, shirt, long = false }) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${bg}"/><stop offset="1" stop-color="${bg2}"/></linearGradient></defs>`
    + `<rect width="64" height="64" fill="url(#g)"/>`
    + (long ? `<path d="M17 30c0-11 6-18 15-18s15 7 15 18v14H17z" fill="${hair}"/>` : "")
    + `<path d="M10 64c1-11 10-17 22-17s21 6 22 17z" fill="${shirt}"/>`
    + `<path d="M27 40h10v9c-2 2-8 2-10 0z" fill="${skin}" opacity=".85"/>`
    + `<ellipse cx="32" cy="29" rx="10.5" ry="12.5" fill="${skin}"/>`
    + `<path d="M21 28c0-9 5-13.5 11-13.5S43 19 43 27c-3-4-7-6-12-6-4 0-7 2-10 7z" fill="${hair}"/>`
    + `<path d="M27 48c3 2 7 2 10 0" stroke="${shirt}" stroke-width="1.2" fill="none" opacity=".5"/>`
    + `</svg>`;
  return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
}
const PORTRAIT_A = portrait({ bg: "rgb(214 228 214)", bg2: "rgb(168 196 176)", skin: "rgb(196 142 110)", hair: "rgb(46 32 28)", shirt: "rgb(54 84 110)", long: true });
const PORTRAIT_B = portrait({ bg: "rgb(226 218 236)", bg2: "rgb(186 172 210)", skin: "rgb(236 198 170)", hair: "rgb(150 92 52)", shirt: "rgb(96 70 60)" });

function AvatarDemo({ size, shape, ring, forceState, fwd, className, style, rest }) {
  const st = forceState === "loading";
  return (
    <div ref={fwd} className={"ts-av-demo" + (className ? " " + className : "")} style={style} {...rest}>
      <div className="ts-av-demo__head">
        <Avatar size={size === "md" ? "lg" : size} shape={shape} ring={ring} name="Mira Castell" src={PORTRAIT_A} status="online" loading={st}
          onClick={() => {}} forceState={["hover", "focus", "active"].includes(forceState) ? forceState : undefined} />
        <div className="ts-av-demo__who">
          <b>Mira Castell</b>
          <span>commented on Spring survey, north ridge · 4 min ago</span>
        </div>
      </div>
      <p className="ts-av-demo__msg">Swapped in the new trail counts. Can someone check the legend before Friday?</p>
      <div className="ts-av-demo__row">
        <span className="ts-av-demo__lbl">Shared with</span>
        <Avatar shape="rounded" name="Field Team" initials="FT" loading={st} />
        <Avatar size="sm" name="Tomasz Brandt" status="away" loading={st} />
        <Avatar size="sm" name="Sana Iqbal" status="busy" loading={st} />
        <Avatar size="sm" name="Wren Hollis" src={PORTRAIT_B} status="offline" loading={st} />
        <Avatar size="sm" name="Kofi Mensah" loading={st} />
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- one photo layer */
function Photo({ layer, imgProps, reduce, onState, onDone, first, solo }) {
  const el = useRef(null);
  // a cached image is already complete before the first paint: show it with no animation at all
  useIsoLayoutEffect(() => {
    const img = el.current;
    // (a new src over an earlier photo still cross-fades, even when it is cached)
    if (img && img.complete && img.naturalWidth > 0) onState(layer.id, solo ? "instant" : "in");
  }, []);
  const ready = (e) => {
    const img = e.currentTarget;
    const evt = { type: e.type, target: img, currentTarget: img, nativeEvent: e.nativeEvent };
    const go = () => onState(layer.id, "in", evt);
    if (img.decode) img.decode().then(go, () => onState(layer.id, "failed", evt)); else go();
  };
  const st = layer.state;
  const shown = st === "in" || st === "instant";
  const out = st === "out";
  const from = reduce ? { opacity: 0 } : first ? { opacity: 0, scale: 1.08, filter: "blur(8px)" } : { opacity: 0, filter: "blur(4px)" };
  const to = reduce ? { opacity: 1 } : { opacity: 1, scale: 1, filter: "blur(0px)" };
  return (
    <motion.img
      ref={el}
      className="ts-av__img"
      src={layer.src}
      alt=""
      draggable={false}
      decoding="async"
      {...imgProps}
      initial={from}
      animate={out ? { opacity: 0 } : shown ? to : from}
      transition={st === "instant" ? { duration: 0 } : reduce ? { duration: 0.2 } : { duration: out ? 0.25 : 0.45, ease: [0.2, 0.8, 0.2, 1] }}
      onAnimationComplete={() => { if (shown || out) onDone(layer.id, st); }}
      onLoad={ready}
      onError={(e) => onState(layer.id, "failed", e)}
      style={{ display: st === "failed" ? "none" : undefined }}
    />
  );
}

/**
 * Avatar: one person or team. A photo when there is one, otherwise initials on a tint that is always the same for
 * the same name (the `--ts-series-*` identity colours through a stable hash, the same one Avatar Group uses).
 * Signature: the photo resolves over the name. The initials are there at once; when the image has loaded and
 * decoded it comes in over them (blur to sharp, a small scale settle) while the initials leave underneath. A failed
 * image changes nothing, a cached one shows with no animation, a new `src` cross-fades photo to photo, and a status
 * change morphs the status mark (dot, ring, bar, faded outline) instead of swapping it. Reduced motion: plain opacity.
 * Status is never colour alone and is part of the accessible name ("Ada Okafor, away").
 * With `href` it renders a link, with `onClick` a button (hover lift, press give, a focus ring that follows the
 * shape); otherwise a non-focusable role="img". The ref goes to that root element.
 */
export const Avatar = forwardRef(function Avatar({
  src,
  alt,
  name = "",
  initials,
  fallback,
  size = "md",
  shape = "circle",
  ring = false,
  tint = "auto",
  status = "none",
  statusLabel,
  badge,
  loading = false,
  href,
  target,
  rel,
  onClick,
  disabled = false,
  onLoad,
  onError,
  imgProps,
  demo = false,
  forceState,
  className,
  style,
  ...rest
}, ref) {
  const sheetTag = useStyles("ts-avatar", CSS);
  const reduce = useReducedMotion();
  const showDemo = demo && !src && !name && !initials && !fallback;

  /* photo layers: the newest on top; older ones stay until the newest has come in */
  const [layers, setLayers] = useState(() => (src ? [{ id: 1, src, state: "loading" }] : []));
  const nextId = useRef(2);
  const cb = useRef({});
  cb.current = { onLoad, onError };
  const lastSrc = useRef(src);
  useEffect(() => {
    if (lastSrc.current === src) return;
    lastSrc.current = src;
    if (!src) { setLayers((ls) => ls.filter((l) => l.state === "in" || l.state === "instant").map((l) => ({ ...l, state: "out" }))); return; }
    setLayers((ls) => [...ls.filter((l) => l.state !== "failed" && l.state !== "loading"), { id: nextId.current++, src, state: "loading" }]);
  }, [src]);
  const layersRef = useRef(layers);
  layersRef.current = layers;
  const onState = useCallback((id, state, e) => {
    const prior = layersRef.current.find((l) => l.id === id)?.state;
    // a cached image was already shown at once; its later load event only reports onLoad
    if ((prior === "instant" || prior === "in") && state === "in") { if (e) cb.current.onLoad?.(e); return; }
    if (prior === state) return;
    setLayers((ls) => {
      const top = ls[ls.length - 1];
      let next = ls.map((l) => (l.id === id ? { ...l, state } : l));
      // the newest photo failed: older photos fade out to the initials
      if (state === "failed" && top?.id === id) next = next.map((l) => (l.id !== id && (l.state === "in" || l.state === "instant") ? { ...l, state: "out" } : l));
      return next;
    });
    if (state === "in" || state === "instant") { if (e) cb.current.onLoad?.(e); }
    if (state === "failed") cb.current.onError?.(e);
  }, []);
  const onDone = useCallback((id, state) => {
    setLayers((ls) => {
      if (state === "out") return ls.filter((l) => l.id !== id);
      const i = ls.findIndex((l) => l.id === id);
      return i > 0 ? ls.slice(i) : ls;
    });
  }, []);
  // an instant (cached) image still reports onLoad, from its element
  const covered = layers.some((l) => l.state === "in" || l.state === "instant");
  const instant = layers.some((l) => l.state === "instant") && !layers.some((l) => l.state === "in");

  const hasName = !!String(name ?? "").trim();
  const loc = useLocale();
  const ini = initials ? Array.from(String(initials).trim()).slice(0, 2).join("").toLocaleUpperCase(loc) : initialsOf(name, loc);
  const word = status && status !== "none" && STATUS_WORD[status] ? statusLabel || STATUS_WORD[status] : "";
  const base = alt ?? (hasName ? String(name).trim() : "");
  const label = [base, word].filter(Boolean).join(", ") || undefined;

  useEffect(() => {
    if (isDev && !showDemo && !base && !rest["aria-label"] && !rest["aria-labelledby"]) console.warn("Avatar: no `name`, `alt` or aria-label, so it has no accessible name.");
  }, [showDemo, base]);

  if (showDemo) return <>{sheetTag}<AvatarDemo size={size} shape={shape} ring={ring} forceState={forceState} fwd={ref} className={className} style={style} rest={rest} /></>;

  const D = dims(size);
  const t = tint === "none" ? "none" : Number(tint);
  // no name and no chosen tint: the neutral face (an identity colour needs an identity)
  const idx = tint === "none" ? null : t >= 1 && t <= 8 ? Math.round(t) - 1 : hasName ? hashHue(String(name).trim()) : null;
  const isLoading = loading || forceState === "loading";
  const isDisabled = disabled;
  const act = !!(href || onClick);
  const Tag = href ? "a" : onClick ? "button" : "span";
  const force = act && ["hover", "focus", "active"].includes(forceState) ? forceState : undefined;
  const glyph = !ini && !fallback;

  const props = {
    ref,
    ...rest,
    className: "ts-av" + (className ? " " + className : ""),
    style: { "--av-s": D.s + "px", "--av-fs": D.fs + "px", "--av-d": D.d + "px", "--av-id": idx === null ? "var(--ts-ink3)" : `var(--ts-series-${idx + 1})`, ...style },
    "data-shape": shape === "rounded" ? "rounded" : "circle",
    "data-ring": ring || undefined,
    "data-tint": idx === null ? "none" : undefined,
    "data-act": act || undefined,
    "data-force": force,
    "aria-busy": isLoading || undefined,
  };
  if (Tag === "a") Object.assign(props, { href: isDisabled ? undefined : href, target, rel: rel ?? (target === "_blank" ? "noopener noreferrer" : undefined), "aria-label": rest["aria-label"] ?? label, "aria-disabled": isDisabled || undefined, role: isDisabled ? "link" : undefined, onClick: isDisabled ? (e) => e.preventDefault() : onClick });
  else if (Tag === "button") Object.assign(props, { type: "button", disabled: isDisabled, "aria-disabled": isDisabled || undefined, "aria-label": rest["aria-label"] ?? label, onClick });
  else Object.assign(props, { role: "img", "aria-label": rest["aria-label"] ?? label });

  return (
    <>{sheetTag}<Tag {...props}>
      <span className="ts-av__lift" aria-hidden>
        {isLoading ? (
          <span className="ts-av__skel" />
        ) : (
          <span className="ts-av__face" data-photo={covered || undefined}>
            <motion.span className="ts-av__ini" data-glyph={glyph || undefined} initial={false}
              animate={covered ? (reduce ? { opacity: 0 } : { opacity: 0, scale: 0.86 }) : { opacity: 1, scale: 1 }}
              transition={instant ? { duration: 0 } : { duration: reduce ? 0.2 : 0.35, ease: [0.2, 0.8, 0.2, 1] }}>
              {ini || fallback || <Icon name="user" size={Math.round(D.s * 0.56)} stroke={D.s < 24 ? 2.2 : 1.8} />}
            </motion.span>
            {layers.map((l, i) => (
              <Photo key={l.id} layer={l} imgProps={imgProps} reduce={reduce} first={i === 0} solo={i === 0} onState={onState} onDone={onDone} />
            ))}
          </span>
        )}
        {word && !isLoading && (
          <span className="ts-av__status" data-s={status}>
            <span className="ts-av__hole" />
            <span className="ts-av__bar" />
          </span>
        )}
        {badge != null && badge !== false && !isLoading && <span className="ts-av__badge">{badge}</span>}
      </span>
    </Tag></>
  );
});
