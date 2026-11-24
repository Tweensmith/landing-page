"use client";
// Procedural artwork. Every image in Tweensmith is generated here, so the library
// ships with zero licensed assets. Swap `art` for a real image URL in production.
import { useId, useMemo } from "react";

export const ARTWORKS = [
  { id: "ember-silk", title: "Ember Silk", caption: "Heat folding over itself, slowly.", palette: ["#1a0503", "#ff4d00", "#ffb36b", "#7a0a3d", "#ffe2c4"], variant: "silk" },
  { id: "glacier", title: "Glacier Hum", caption: "Cold light under a lot of pressure.", palette: ["#dfeaff", "#7fb2ff", "#1c3faa", "#f4f8ff", "#ffffff"], variant: "silk" },
  { id: "night-bloom", title: "Night Bloom", caption: "A flower that only opens on screens.", palette: ["#07020f", "#5b2bff", "#ff3db8", "#ffb4e6", "#2a0b5e"], variant: "bloom" },
  { id: "chrome", title: "Liquid Chrome", caption: "Mercury, played back at quarter speed.", palette: ["#0c0c0e", "#d9dce3", "#5b5f6a", "#ffffff", "#1d1f25"], variant: "silk" },
  { id: "citrine", title: "Citrine", caption: "Late sun through a glass of something.", palette: ["#2b1100", "#ffb800", "#fff1b8", "#ff6a00", "#7a2c00"], variant: "aurora" },
  { id: "tidal", title: "Tidal Static", caption: "The sea, received as a signal.", palette: ["#00110f", "#00d1b2", "#0a4a6e", "#b6fff2", "#003b36"], variant: "aurora" },
  { id: "orchid", title: "Orchid Engine", caption: "Soft machinery, humming pink.", palette: ["#f3e6ff", "#b46bff", "#ff8fc8", "#3a0b6b", "#ffffff"], variant: "bloom" },
  { id: "eclipse", title: "Eclipse", caption: "Everything bright happens at the edge.", palette: ["#020203", "#0b0b0f", "#ff7a1a", "#ffd6a8", "#ff3d00"], variant: "ring" },
];

const byId = Object.fromEntries(ARTWORKS.map((a) => [a.id, a]));
export const getArt = (a) => (typeof a === "string" ? byId[a] ?? ARTWORKS[0] : a ?? ARTWORKS[0]);

function rng(str) {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  };
}

const fill = { position: "absolute", inset: 0, width: "100%", height: "100%" };

/**
 * <Art art="night-bloom" />  — art id, or an artwork object {palette, variant}.
 * lite: CSS-only gradients (use when rendering 20+ tiles at once).
 * animate: slowly morphs the noise field (use on 1–2 hero pieces, not grids).
 */
export function Art({ art, seed = 0, lite = false, animate = false, grain = 0.12, style, className, children }) {
  const a = getArt(art);
  const uid = useId().replace(/:/g, "");
  const p = a.palette;

  const blobs = useMemo(() => {
    const r = rng(a.id + ":" + seed);
    return Array.from({ length: 7 }, (_, i) => ({
      cx: -10 + r() * 120, cy: -10 + r() * 160, rx: 22 + r() * 40, ry: 16 + r() * 38,
      c: p[1 + (i % (p.length - 1))], rot: r() * 180, o: 0.65 + r() * 0.35,
    }));
  }, [a.id, seed]);
  const seedNum = useMemo(() => Math.floor(rng(a.id + seed)() * 999), [a.id, seed]);

  const base = { position: "relative", overflow: "hidden", background: p[0], ...style };

  if (lite) {
    const bg = blobs
      .slice(0, 5)
      .map((b) => `radial-gradient(${b.rx}% ${b.ry * 0.75}% at ${b.cx}% ${b.cy / 1.4}%, ${b.c} 0%, transparent 72%)`)
      .join(",");
    return (
      <div className={className} style={{ ...base, backgroundImage: bg }}>
        {children}
      </div>
    );
  }

  const turb = (freq, alt) => (
    <feTurbulence type="fractalNoise" baseFrequency={freq} numOctaves="2" seed={seedNum}>
      {animate && <animate attributeName="baseFrequency" dur="22s" values={`${freq};${alt};${freq}`} repeatCount="indefinite" />}
    </feTurbulence>
  );

  let body;
  if (a.variant === "ring") {
    body = (
      <>
        <defs>
          <radialGradient id={`g${uid}`} cx="50%" cy="46%" r="60%">
            <stop offset="0%" stopColor={p[1]} />
            <stop offset="100%" stopColor={p[0]} />
          </radialGradient>
          <filter id={`b${uid}`} x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="6" /></filter>
          <filter id={`w${uid}`} x="-30%" y="-30%" width="160%" height="160%">{turb("0.03", "0.05")}<feDisplacementMap in="SourceGraphic" scale="9" /></filter>
        </defs>
        <rect width="100" height="140" fill={`url(#g${uid})`} />
        <g filter={`url(#w${uid})`}>
          <circle cx="50" cy="64" r="27" fill="none" stroke={p[4]} strokeWidth="9" filter={`url(#b${uid})`} opacity="0.9" />
          <circle cx="50" cy="64" r="27" fill="none" stroke={p[2]} strokeWidth="2.4" />
          <circle cx="50" cy="64" r="27" fill="none" stroke={p[3]} strokeWidth="0.6" opacity="0.9" />
        </g>
        <circle cx="50" cy="64" r="25.6" fill={p[0]} />
      </>
    );
  } else if (a.variant === "aurora") {
    body = (
      <>
        <defs>
          <filter id={`b${uid}`} x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="5" /></filter>
          <filter id={`w${uid}`} x="-30%" y="-30%" width="160%" height="160%">{turb("0.006 0.035", "0.009 0.022")}<feDisplacementMap in="SourceGraphic" scale="46" xChannelSelector="R" yChannelSelector="G" /></filter>
        </defs>
        <rect width="100" height="140" fill={p[0]} />
        <g filter={`url(#w${uid})`}>
          <g filter={`url(#b${uid})`}>
            {blobs.map((b, i) => (
              <rect key={i} x={b.cx - 8} y={-20 + (i % 3) * 18} width={8 + (b.rx % 12)} height={120} fill={b.c} opacity={b.o} />
            ))}
          </g>
        </g>
        <rect width="100" height="140" fill={`url(#v${uid})`} />
        <defs>
          <linearGradient id={`v${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0.45" stopColor={p[0]} stopOpacity="0" />
            <stop offset="1" stopColor={p[0]} stopOpacity="0.95" />
          </linearGradient>
        </defs>
      </>
    );
  } else {
    // silk + bloom: blurred colour fields + ribbons, pushed through a noise displacement
    const silk = a.variant === "silk";
    body = (
      <>
        <defs>
          <filter id={`b${uid}`} x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation={silk ? 6 : 9} /></filter>
          <filter id={`w${uid}`} x="-30%" y="-30%" width="160%" height="160%">
            {turb(silk ? "0.012 0.019" : "0.008", silk ? "0.016 0.012" : "0.012")}
            <feDisplacementMap in="SourceGraphic" scale={silk ? 58 : 26} xChannelSelector="R" yChannelSelector="G" />
            <feGaussianBlur stdDeviation="0.6" />
          </filter>
        </defs>
        <rect width="100" height="140" fill={p[0]} />
        <g filter={`url(#w${uid})`}>
          <g filter={`url(#b${uid})`}>
            {blobs.map((b, i) => (
              <ellipse key={i} cx={b.cx} cy={b.cy} rx={b.rx} ry={b.ry} fill={b.c} opacity={b.o} transform={`rotate(${b.rot} ${b.cx} ${b.cy})`} />
            ))}
          </g>
          {silk &&
            blobs.slice(0, 5).map((b, i) => (
              <path key={i} d={`M -20 ${b.cy} C 30 ${b.cy - 40}, 70 ${b.cy + 40}, 120 ${b.cy - 10}`} stroke={p[i % 2 ? 3 : 4] ?? p[3]} strokeWidth={1.2 + (i % 3)} fill="none" opacity={0.55} />
            ))}
        </g>
      </>
    );
  }

  return (
    <div className={className} style={base}>
      <svg viewBox="0 0 100 140" preserveAspectRatio="xMidYMid slice" style={fill} aria-hidden>
        {body}
      </svg>
      {grain > 0 && (
        <svg style={{ ...fill, mixBlendMode: "overlay", opacity: grain, pointerEvents: "none" }} aria-hidden>
          <filter id={`n${uid}`}><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" stitchTiles="stitch" /><feColorMatrix type="saturate" values="0" /></filter>
          <rect width="100%" height="100%" filter={`url(#n${uid})`} />
        </svg>
      )}
      {children}
    </div>
  );
}
