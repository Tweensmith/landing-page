// Theme presets. Pure data so both the gallery (browser) and the MCP server (Node) can import it.
// Every themed component reads ONLY the --ts-* variables these produce.
// The Apple system face: San Francisco on Apple devices, the platform's own UI font elsewhere (SF can't be shipped as a web font).
const base = {
  font: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", "Helvetica Neue", system-ui, sans-serif',
  mono: 'ui-monospace, "SF Mono", SFMono-Regular, Menlo, Monaco, monospace',
};
// Text colours are held to 4.5:1 (WCAG AA) on bg, surface and surface2 of every preset, in both directions for the
// status colours (as text, and as a fill under bg-coloured text). Measured 2026-11-21: the light values of ink2,
// ink3, danger, success and warning sat between 2.9:1 and 4.4:1 and were darkened to the nearest passing step
// (worst case now 4.53:1, on Ember's surface2). Each accent is held to the same test, as text and as a fill under its
// accentInk; Ember's light accent was #e8481a (3.2:1 as text, 3.9:1 as a fill). A new preset or a changed surface must
// be checked the same way.
const neutralDark = { bg: "#0a0a0c", surface: "#141419", surface2: "#1d1d24", ink: "#f2f2f5", ink2: "#8d8f9b", line: "rgba(255,255,255,0.09)", danger: "#ff6369", success: "#3dd68c", warning: "#f5b84a", panel: "#1d1d24", panelInk: "#f2f2f5", panelInk2: "#8d8f9b", shadow: "0 1px 2px rgba(0,0,0,.4), 0 12px 32px -12px rgba(0,0,0,.6)" };
const neutralLight = { bg: "#f6f5f1", surface: "#ffffff", surface2: "#efeee8", ink: "#121214", ink2: "#666772", line: "rgba(18,18,20,0.09)", danger: "#c82428", success: "#0e783c", warning: "#965a09", panel: "#1d1d24", panelInk: "#f2f2f5", panelInk2: "#9a9ca8", shadow: "0 1px 2px rgba(18,18,20,.06), 0 12px 32px -14px rgba(18,18,20,.22)" };

export const THEMES = {
  // The kit's default: neutral, flat, lime accent on near-black (black in light). What a caller gets with no preset.
  tweensmith: { ...base, label: "Tweensmith", radius: [8, 12, 18],
    dark: { ...neutralDark, accent: "#c8ff3d", accentInk: "#0d1200", focus: "#c8ff3d" },
    light: { ...neutralLight, accent: "#121214", accentInk: "#f6f5f1", focus: "#121214" } },
  // Porcelain: Tweensmith's own identity (its site, docs and gallery), offered as a preset like any other. Grey canvas, white cards, black primary buttons (white in dark
  // mode), #29292b panels, and green #22c55e for a switch when on (1.8:1 on the light canvas: below the 3:1 a control
  // needs, kept on purpose; the thumb position also shows the state). Text greys are held to 4.5:1.
  // Radii: small parts 12, controls 14, cards 14. The kit draws cards with the large radius, and the brand's white
  // cards are 14; its 26 is for dark panels, which no component draws yet.
  porcelain: { ...base, label: "Porcelain", radius: [12, 14, 14],
    light: { bg: "#e9e9ea", surface: "#ffffff", surface2: "#f8fafc", ink: "#1a1a1c", ink2: "#67686e", ink3: "#67686e", headingMuted: "#83848a", line: "rgba(26,26,28,0.08)", accent: "#1a1a1c", accentInk: "#ffffff", accentText: "#1a1a1c", onState: "#22c55e", focus: "#1a1a1c", danger: "#c82428", success: "#0e783c", warning: "#965a09", panel: "#29292b", panelInk: "#ffffff", panelInk2: "#9f9fa0", shadow: "inset 0 1px 0 rgba(255,255,255,.9), 0 10px 20px -14px rgba(30,30,40,.3)" },
    dark: { bg: "#1a1a1c", surface: "#232325", surface2: "#2a2a2c", ink: "#f5f5f7", ink2: "#9f9fa0", ink3: "#9f9fa0", headingMuted: "#7f7f80", line: "rgba(255,255,255,0.08)", accent: "#ffffff", accentInk: "#1a1a1c", accentText: "#ffffff", onState: "#22c55e", focus: "#ffffff", danger: "#ff6369", success: "#3dd68c", warning: "#f5b84a", panel: "#29292b", panelInk: "#ffffff", panelInk2: "#9f9fa0", shadow: "inset 0 0 0 1px rgba(255,255,255,.06), 0 34px 50px -26px rgba(0,0,0,.7)" } },
  // Porcelain's petrol palette from the brand board; parked as a preset.
  petrol: { ...base, label: "Petrol", radius: [10, 14, 22],
    light: { bg: "#e8ebee", surface: "#f8f9fa", surface2: "#eef0f3", ink: "#14171c", ink2: "#566070", ink3: "#696863", line: "rgba(20,23,28,0.10)", accent: "#1d6a86", accentInk: "#ffffff", accentText: "#1d6a86", focus: "#1d6a86", danger: "#c0392b", success: "#12775e", warning: "#955c02", panel: "#15181d", panelInk: "#eef1f4", panelInk2: "#9aa3af", shadow: "0 1px 2px rgba(20,23,28,.06), 0 14px 30px -16px rgba(20,23,28,.22)" },
    dark: { bg: "#0f1216", surface: "#171b20", surface2: "#20252c", ink: "#eef1f4", ink2: "#98a1ad", ink3: "#908e88", line: "rgba(238,241,244,0.08)", accent: "#63a6bb", accentInk: "#04121a", accentText: "#63a6bb", focus: "#63a6bb", danger: "#ff7b6b", success: "#5cc6a3", warning: "#f0b54a", panel: "#1b2027", panelInk: "#eef1f4", panelInk2: "#98a1ad", shadow: "0 1px 2px rgba(0,0,0,.4), 0 14px 30px -14px rgba(0,0,0,.6)" } },
  indigo: { ...base, label: "Indigo", radius: [10, 14, 22],
    dark: { ...neutralDark, bg: "#0b0a1a", surface: "#14122b", surface2: "#1d1a3a", accent: "#a493ff", accentInk: "#0e0b2e", focus: "#a493ff" },
    light: { ...neutralLight, bg: "#f4f2ff", surface2: "#ebe7ff", accent: "#5b3dff", accentInk: "#ffffff", focus: "#5b3dff" } },
  ember: { ...base, label: "Ember", radius: [6, 10, 14],
    dark: { ...neutralDark, bg: "#110b08", surface: "#1c1310", surface2: "#271b16", accent: "#ff7a45", accentInk: "#1a0700", focus: "#ff7a45" },
    light: { ...neutralLight, bg: "#f7f1ea", surface2: "#efe6dc", accent: "#bd3913", accentInk: "#ffffff", focus: "#bd3913" } },
  forest: { ...base, label: "Forest", radius: [12, 16, 24],
    dark: { ...neutralDark, bg: "#04130e", surface: "#0a1f18", surface2: "#112b22", accent: "#b8ffd9", accentInk: "#03140f", focus: "#b8ffd9" },
    light: { ...neutralLight, bg: "#eef5f1", surface2: "#e1ede7", accent: "#0c6b4a", accentInk: "#ffffff", focus: "#0c6b4a" } },
  mono: { ...base, label: "Mono", radius: [3, 5, 8],
    dark: { ...neutralDark, bg: "#000000", surface: "#0c0c0c", surface2: "#161616", accent: "#ffffff", accentInk: "#000000", focus: "#ffffff" },
    light: { ...neutralLight, bg: "#ffffff", surface: "#ffffff", surface2: "#f2f2f2", accent: "#000000", accentInk: "#ffffff", focus: "#000000" } },
};

// Data colours, shared by every chart. Identity colours are fixed across presets (colour follows the entity, never
// the brand) and stepped per mode. The order is the colour-blind safety mechanism: validated with the dataviz
// skill's validator against every preset's surface (adjacent CVD ΔE ≥ 8.4, normal-vision ΔE ≥ 19.3). On the white
// light surface slots 3, 4 and 5 sit under 3:1, so charts must also carry direct labels or a table view.
// seq-1 means "near zero" and recedes toward the surface; seq-7 is the maximum. Diverging = blue ↔ grey ↔ red.
export const CHART = {
  light: {
    series: ["#2a78d6", "#eb6834", "#1baf7a", "#eda100", "#e87ba4", "#008300", "#6250d6", "#e34948"],
    seq: ["#cde2fb", "#9ec5f4", "#6da7ec", "#3987e5", "#256abf", "#184f95", "#0d366b"],
    divNeg: "#2a78d6", divMid: "#f0efec", divPos: "#e34948",
    grid: "rgba(18,18,20,0.07)", axis: "rgba(18,18,20,0.22)", ink3: "#696863",
  },
  dark: {
    series: ["#3987e5", "#d95926", "#199e70", "#c98500", "#d55181", "#0ca30c", "#9085e9", "#e66767"],
    seq: ["#0d366b", "#184f95", "#256abf", "#3987e5", "#6da7ec", "#9ec5f4", "#cde2fb"],
    divNeg: "#3987e5", divMid: "#383835", divPos: "#e66767",
    grid: "rgba(255,255,255,0.06)", axis: "rgba(255,255,255,0.2)", ink3: "#908e88",
  },
};

export const THEME_VARS = ["bg", "surface", "surface2", "ink", "ink2", "line", "accent", "accentInk", "focus", "danger", "success", "warning", "panel", "panelInk", "panelInk2", "shadow"];

export function themeVars(preset = "tweensmith", mode = "dark") {
  const t = THEMES[preset] ?? THEMES.tweensmith;
  const c = t[mode] ?? t.dark;
  const v = { colorScheme: mode };
  for (const k of THEME_VARS) v["--ts-" + k.replace(/[A-Z]/g, (m) => "-" + m.toLowerCase())] = c[k];
  v["--ts-radius-sm"] = t.radius[0] + "px";
  v["--ts-radius-md"] = t.radius[1] + "px";
  v["--ts-radius-lg"] = t.radius[2] + "px";
  const ch = CHART[mode] ?? CHART.dark;
  ch.series.forEach((c, i) => (v[`--ts-series-${i + 1}`] = c));
  ch.seq.forEach((c, i) => (v[`--ts-seq-${i + 1}`] = c));
  v["--ts-div-neg"] = ch.divNeg;
  v["--ts-div-mid"] = ch.divMid;
  v["--ts-div-pos"] = ch.divPos;
  v["--ts-grid"] = ch.grid;
  v["--ts-axis"] = ch.axis;
  v["--ts-ink3"] = c.ink3 ?? ch.ink3;
  // Accent text (links), on state (switch on, checked, selected) and the grey second part of two-tone headings.
  // Presets without them fall back; those presets were not re-measured for these roles.
  v["--ts-accent-text"] = c.accentText ?? c.accent;
  v["--ts-on-state"] = c.onState ?? c.accent;
  v["--ts-heading-muted"] = c.headingMuted ?? c.ink2;
  // The two ends that do not flip with the mode: what shadows, scrims and darkening are mixed from, and what
  // highlights and ink over a photo or a swatch are mixed from. Pure by default; a preset may tint them
  // (`black` / `white` on the preset, or on one of its modes). Components never write a colour of their own.
  v["--ts-black"] = c.black ?? t.black ?? "rgb(0 0 0)";
  v["--ts-white"] = c.white ?? t.white ?? "rgb(255 255 255)";
  v["--ts-font"] = t.font;
  v["--ts-font-mono"] = t.mono;
  return v;
}
